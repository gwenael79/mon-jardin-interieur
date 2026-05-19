import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

async function sendTelegram(text: string) {
  const token  = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) {
    console.error('[cercle-telegram] secrets manquants token:', !!token, 'chatId:', !!chatId)
    return
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
  const data = await res.json()
  if (!data.ok) console.error('[cercle-telegram] erreur:', JSON.stringify(data))
  else console.log('[cercle-telegram] envoyé ok')
}

serve(async (req) => {
  const sig    = req.headers.get('stripe-signature') ?? ''
  const body   = await req.text()
  const secret = Deno.env.get('CERCLE_WEBHOOK_SECRET') ?? ''

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, secret)
  } catch (err) {
    console.error('[cercle-webhook] signature invalide:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const meta    = session.metadata ?? {}

  // Ignore les sessions qui ne viennent pas du Cercle
  if (meta.source !== 'cercle_fondateurs') {
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  }

  const montant = (session.amount_total ?? 0) / 100

  // Évite les doublons
  const { data: existing } = await supabase
    .from('fondateurs')
    .select('id')
    .eq('paiement_ref', session.id)
    .maybeSingle()

  if (!existing) {
    const niveau = (meta.niveau ?? 'graine') as 'graine' | 'ami' | 'compagnon' | 'fondateur'
    const email  = meta.email || session.customer_email || null
    const isUpgrade = meta.upgrade === 'true'

    let error: any = null

    if (isUpgrade && email) {
      // ── Upgrade : met à jour le record existant ──────────────────────────
      const { error: upErr } = await supabase.from('fondateurs')
        .update({ niveau, montant, paiement_ref: session.id, updated_at: new Date().toISOString() })
        .eq('email', email)
      error = upErr

      // Met le plan premium si l'upgrade sort du niveau graine
      if (!upErr && niveau !== 'graine') {
        const { data: f } = await supabase.from('fondateurs').select('user_id').eq('email', email).maybeSingle()
        if (f?.user_id) {
          await supabase.from('profiles').update({ plan: 'premium' }).eq('id', f.user_id)
        }
      }
    } else {
      // ── Nouveau fondateur : insertion normale ───────────────────────────
      const { error: insErr } = await supabase.from('fondateurs').insert({
        display_name:    `${meta.prenom ?? ''} ${meta.nom ?? ''}`.trim(),
        email,
        citation:        meta.citation || null,
        niveau,
        montant,
        devise:          session.currency?.toUpperCase() ?? 'EUR',
        paiement_method: 'stripe',
        paiement_ref:    session.id,
        affichage_public: true,
        fleur_variant:   1,
        fleur_image:     meta.fleur_image || null,
      })
      error = insErr
    }

    if (error) console.error('[cercle-webhook] error:', error)

    const NIVEAU_LABEL: Record<string, string> = {
      graine:    '🌸 Un geste doux',
      ami:       '🌱 Ami du Jardin',
      compagnon: '🌿 Compagnon de route',
      fondateur: '🌳 Fondateur',
    }

    const msg = [
      isUpgrade ? '⬆️ <b>Upgrade Fondateur !</b>' : '🌸 <b>Nouveau Fondateur !</b>',
      '',
      `👤 <b>${meta.prenom ?? ''} ${meta.nom ?? ''}</b>`,
      `🏵 Niveau : ${NIVEAU_LABEL[niveau] ?? niveau}`,
      `💶 Contribution : <b>${montant}€</b>`,
      `✉️ Email : ${email ?? '—'}`,
      `📞 Tél : ${meta.telephone || '—'}`,
      `📅 ${new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}`,
      '',
      `🔗 Stripe : <code>${session.id.slice(-12)}</code>`,
    ].join('\n')

    await sendTelegram(msg)
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})
