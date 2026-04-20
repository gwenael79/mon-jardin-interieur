import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const LUMEN_PACKS: Record<string, number> = {
  'price_1TMpOGCIpPVJTaopkipwkvDT': 50,
  'price_1TMpOSCIpPVJTaopNRKgm3rn': 100,
  'price_1TMpObCIpPVJTaopdCLedWAg': 150,
}

const PRICE_MAP: Record<string, { product_name: string; product_icon: string; price: number }> = {
  'price_1TMpO0CIpPVJTaopHfQrzF8z': { product_name: '1 mois', product_icon: '🌱', price: 13  },
  'price_1TMpO0CIpPVJTaopzrpNDw8r': { product_name: '1 an',  product_icon: '✨', price: 108 },
}

Deno.serve(async (req: Request) => {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Record<string, unknown>

  if (!STRIPE_WEBHOOK_SECRET) {
    console.warn('[webhook] STRIPE_WEBHOOK_SECRET manquant — mode non sécurisé')
    try { event = JSON.parse(body) } catch { return new Response('JSON invalide', { status: 400 }) }
  } else {
    try {
      event = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET)
    } catch (e) {
      console.error('[webhook] Signature invalide:', e)
      return new Response('Signature invalide', { status: 400 })
    }
  }

  console.log('[webhook] Événement reçu:', event.type)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
  const ok = () => new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  // ── checkout.session.completed ────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const data = event.data   as Record<string, unknown>
    const obj  = data?.object as Record<string, unknown>
    const meta = obj?.metadata as Record<string, string> | null

    const uid            = meta?.supabase_uid
    const priceId        = meta?.price_id
    const planMonths     = parseInt(meta?.plan_months  ?? '0', 10)
    const lumenAmount    = parseInt(meta?.lumen_amount ?? '0', 10)
    const produitId      = meta?.produit_id
    const atelierIdMeta  = meta?.atelier_id
    const animatorUserId = meta?.animator_user_id
    const type           = meta?.type
    const sessionId      = obj?.id as string
    const proUsersProId  = meta?.pro_users_pro_id

    if (!uid) {
      console.error('[webhook] supabase_uid manquant')
      return new Response(JSON.stringify({ received: true, warning: 'uid manquant' }), { status: 200 })
    }

    // ── Cas Atelier payant ───────────────────────────────────────────────────
    if (type === 'atelier_achat' && atelierIdMeta) {
      // Idempotence
      const { data: existingReg } = await supabase.from('atelier_registrations')
        .select('id').eq('stripe_session_id', sessionId).maybeSingle()
      if (existingReg) { console.log(`[webhook] Atelier inscription ${sessionId} déjà traitée`); return ok() }

      const amount = (obj?.amount_total as number ?? 0) / 100

      // 1. Créer un achat
      const { data: achatData } = await supabase.from('achats').insert({
        user_id: uid, atelier_id: atelierIdMeta, stripe_payment_id: sessionId, montant: amount, statut: 'complete',
      }).select('id').single()

      // 2. Inscrire le participant
      await supabase.from('atelier_registrations').insert({
        atelier_id: atelierIdMeta, user_id: uid, stripe_session_id: sessionId,
      })

      // 3. Créer vente_partenaires via users_pro si l'animateur est un pro actif
      if (animatorUserId) {
        const { data: usersPro } = await supabase.from('users_pro')
          .select('id, user_id').eq('user_id', animatorUserId).maybeSingle()
        if (usersPro) {
          const taux = 15.00
          const commission = Math.round(amount * taux) / 100
          const mois = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
          await supabase.from('ventes_partenaires').insert({
            achat_id: achatData?.id ?? null,
            atelier_id: atelierIdMeta,
            users_pro_id: usersPro.id,
            user_id: uid,
            montant_brut: amount,
            taux_commission: taux,
            commission,
            montant_net: amount - commission,
            mois_facturation: mois,
            statut: 'en_attente',
          })
          console.log(`[webhook] ✅ Vente pro créée — users_pro ${usersPro.id}`)
        }
      }

      console.log(`[webhook] ✅ Atelier payant — atelier ${atelierIdMeta} pour ${uid}`)
      return ok()
    }

    // ── Cas Jardinothèque ────────────────────────────────────────────────────
    if (type === 'produit_achat' && produitId) {
      const { data: existing } = await supabase.from('achats').select('id')
        .eq('user_id', uid).eq('produit_id', produitId).maybeSingle()

      if (existing) {
        console.log(`[webhook] Achat ${produitId} déjà enregistré — ignoré`)
        return ok()
      }

      const amount = (obj?.amount_total as number ?? 0) / 100
      const { error: insertErr } = await supabase.from('achats').insert({
        user_id: uid, produit_id: produitId, stripe_payment_id: sessionId, montant: amount, statut: 'complete',
      })
      if (insertErr) { console.error('[webhook] Erreur achat:', insertErr); return new Response('Erreur DB', { status: 500 }) }

      const { data: produitData } = await supabase.from('produits')
        .select('partenaire_id, partenaires(type_vendeur, statut)').eq('id', produitId).maybeSingle()

      if (produitData?.partenaire_id && (produitData?.partenaires as Record<string,string>)?.type_vendeur === 'professionnel' && (produitData?.partenaires as Record<string,string>)?.statut === 'actif') {
        const taux = 15.00; const commission = Math.round(amount * taux) / 100
        const mois = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        const { data: achatData } = await supabase.from('achats').select('id').eq('stripe_payment_id', sessionId).maybeSingle()
        await supabase.from('ventes_partenaires').insert({
          achat_id: achatData?.id ?? null, produit_id: produitId, partenaire_id: produitData.partenaire_id,
          montant_brut: amount, taux_commission: taux, commission, montant_net: amount - commission,
          mois_facturation: mois, statut: 'en_attente',
        })
      }
      console.log(`[webhook] ✅ Achat — produit ${produitId} pour ${uid}`)
      return ok()
    }

    // ── Cas premium (abonnement ou solidaire) ─────────────────────────────────
    if (planMonths > 0) {
      const { data: userData } = await supabase.from('users').select('premium_until').eq('id', uid).single()
      const base         = userData?.premium_until && new Date(userData.premium_until) > new Date() ? new Date(userData.premium_until) : new Date()
      const premiumUntil = new Date(base)
      premiumUntil.setMonth(premiumUntil.getMonth() + planMonths)

      const { error } = await supabase.from('users').update({
        plan: 'premium', premium_until: premiumUntil.toISOString(), stripe_plan_id: priceId ?? null,
      }).eq('id', uid)

      if (error) { console.error('[webhook] Erreur premium:', error); return new Response('Erreur DB', { status: 500 }) }

      // Subscription history
      const isSolidaire = type === 'solidarity'
      const amountCents = parseInt(meta?.amount_cents ?? '0', 10)
      const planInfo    = isSolidaire
        ? { product_name: '1 an solidaire', product_icon: '💚', price: amountCents / 100 }
        : (priceId ? PRICE_MAP[priceId] : null)

      if (planInfo) {
        await supabase.from('subscriptions').update({ is_active: false }).eq('user_id', uid).eq('is_active', true)
        await supabase.from('subscriptions').insert({
          user_id: uid, product_id: isSolidaire ? 'solidarity' : (priceId ?? 'unknown'),
          product_name: planInfo.product_name, product_icon: planInfo.product_icon,
          months: planMonths, price: planInfo.price, purchased_at: new Date().toISOString(),
          expires_at: premiumUntil.toISOString(), is_active: true, stripe_session_id: sessionId,
        })
      }

      // ── Referral pro : créer le lien client ↔ pro ─────────────────────────
      if (proUsersProId) {
        const stripeCustomerId    = obj?.customer     as string
        const stripeSubscriptionId = obj?.subscription as string | undefined

        const { error: refErr } = await supabase.from('pro_referrals').upsert({
          pro_id:                 proUsersProId,
          client_user_id:         uid,
          stripe_customer_id:     stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId ?? null,
          status:                 'active',
        }, { onConflict: 'stripe_customer_id', ignoreDuplicates: true })

        if (refErr) console.error('[webhook] Erreur pro_referral:', JSON.stringify(refErr))
        else console.log(`[webhook] ✅ Referral créé — pro ${proUsersProId}, client ${uid}`)
      }

      console.log(`[webhook] ✅ Premium activé pour ${uid} jusqu'au ${premiumUntil.toISOString()}`)
    }

    // ── Cas pack Lumens ───────────────────────────────────────────────────────
    else if (lumenAmount > 0 && priceId && LUMEN_PACKS[priceId]) {
      const { data: existing } = await supabase.from('lumen_transactions').select('id')
        .eq('reason', 'lumen_purchase').contains('meta', { stripe_session_id: sessionId }).maybeSingle()
      if (existing) { console.log(`[webhook] Session ${sessionId} déjà traitée`); return ok() }

      const { error: rpcError } = await supabase.rpc('award_lumens', {
        p_user_id: uid, p_amount: lumenAmount, p_reason: 'lumen_purchase',
        p_meta: { price_id: priceId, stripe_session_id: sessionId, lumen_amount: lumenAmount },
      })
      if (rpcError) { console.error('[webhook] Erreur Lumens:', rpcError); return new Response('Erreur DB', { status: 500 }) }
      console.log(`[webhook] ✅ ${lumenAmount} Lumens crédités pour ${uid}`)
    }

    else {
      console.warn('[webhook] metadata incomplète ou price_id non reconnu:', priceId)
    }
  }

  // ── invoice.payment_succeeded → commission pro ────────────────────────────
  if (event.type === 'invoice.payment_succeeded') {
    const data      = event.data   as Record<string, unknown>
    const obj       = data?.object as Record<string, unknown>
    const invoiceId = obj?.id         as string
    const custId    = obj?.customer   as string
    const subId     = obj?.subscription as string | undefined
    const amountPaid = obj?.amount_paid as number ?? 0

    if (!amountPaid || amountPaid <= 0) return ok()

    // Idempotence
    const { data: existingComm } = await supabase.from('pro_commissions')
      .select('id').eq('stripe_invoice_id', invoiceId).maybeSingle()
    if (existingComm) { console.log(`[webhook] Commission ${invoiceId} déjà créditée`); return ok() }

    // Trouver le referral (par subscription_id d'abord, puis customer_id)
    let referral: { id: string; pro_id: string } | null = null

    if (subId) {
      const { data } = await supabase.from('pro_referrals').select('id, pro_id')
        .eq('stripe_subscription_id', subId).eq('status', 'active').maybeSingle()
      referral = data
    }
    if (!referral && custId) {
      const { data } = await supabase.from('pro_referrals').select('id, pro_id')
        .eq('stripe_customer_id', custId).eq('status', 'active').maybeSingle()
      referral = data
    }

    if (!referral) return ok() // Pas un client affilié → rien à faire

    const commissionCents = Math.round(amountPaid * 0.10)

    const { error: commErr } = await supabase.from('pro_commissions').insert({
      pro_id: referral.pro_id, referral_id: referral.id,
      stripe_invoice_id: invoiceId, amount_cents: commissionCents,
    })
    if (commErr) { console.error('[webhook] Erreur insert commission:', commErr); return ok() }

    // Incrémenter solde pro (select + update atomic-enough à cette échelle)
    const { data: proRow } = await supabase.from('users_pro')
      .select('commission_balance_cents, total_earned_cents').eq('id', referral.pro_id).single()
    if (proRow) {
      await supabase.from('users_pro').update({
        commission_balance_cents: (proRow.commission_balance_cents ?? 0) + commissionCents,
        total_earned_cents:       (proRow.total_earned_cents ?? 0)       + commissionCents,
      }).eq('id', referral.pro_id)
    }

    console.log(`[webhook] ✅ Commission ${(commissionCents / 100).toFixed(2)} € → pro ${referral.pro_id}`)
  }

  // ── customer.subscription.deleted → résiliation ───────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const data  = event.data   as Record<string, unknown>
    const obj   = data?.object as Record<string, unknown>
    const meta  = (obj?.metadata ?? {}) as Record<string, string>
    const uid   = meta?.supabase_uid
    const subId = obj?.id as string

    if (uid) {
      await supabase.from('subscriptions').update({ is_active: false }).eq('user_id', uid).eq('is_active', true)
      await supabase.from('users').update({ plan: 'free', premium_until: null, stripe_plan_id: null }).eq('id', uid)
      console.log(`[webhook] ❌ Abonnement résilié — user ${uid}`)
    }

    // Marquer le referral comme cancelled
    if (subId) {
      await supabase.from('pro_referrals').update({
        status: 'cancelled', cancelled_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', subId)
      console.log(`[webhook] Referral pro marqué cancelled — sub ${subId}`)
    }
  }

  // ── invoice.payment_failed → log ─────────────────────────────────────────
  if (event.type === 'invoice.payment_failed') {
    const data   = event.data   as Record<string, unknown>
    const obj    = data?.object as Record<string, unknown>
    console.warn(`[webhook] ⚠️ Paiement échoué — customer ${obj?.customer}`)
  }

  // ── charge.refunded → annuler la commission pro ───────────────────────────
  if (event.type === 'charge.refunded') {
    const data      = event.data   as Record<string, unknown>
    const obj       = data?.object as Record<string, unknown>
    const invoiceId = obj?.invoice as string | undefined

    if (!invoiceId) return ok() // Paiement ponctuel sans invoice — ignoré

    const { data: commission } = await supabase
      .from('pro_commissions')
      .select('id, pro_id, amount_cents, refunded_at')
      .eq('stripe_invoice_id', invoiceId)
      .maybeSingle()

    if (!commission || commission.refunded_at) {
      console.log(`[webhook] Remboursement ${invoiceId} — commission absente ou déjà annulée`)
      return ok()
    }

    await supabase.from('pro_commissions')
      .update({ refunded_at: new Date().toISOString() })
      .eq('id', commission.id)

    const { data: proRow } = await supabase.from('users_pro')
      .select('commission_balance_cents')
      .eq('id', commission.pro_id)
      .single()

    if (proRow) {
      const newBalance = Math.max(0, (proRow.commission_balance_cents ?? 0) - commission.amount_cents)
      await supabase.from('users_pro')
        .update({ commission_balance_cents: newBalance })
        .eq('id', commission.pro_id)
    }

    console.log(`[webhook] ↩️ Commission ${(commission.amount_cents / 100).toFixed(2)} € annulée — pro ${commission.pro_id}`)
  }

  return ok()
})

async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<Record<string, unknown>> {
  const parts     = Object.fromEntries(header.split(',').map(p => p.split('=') as [string, string]))
  const timestamp = parts['t']; const sigHex = parts['v1']
  if (!timestamp || !sigHex) throw new Error('Header Stripe-Signature incomplet')
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`))
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  if (computed !== sigHex) throw new Error('Signature invalide')
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp, 10)) > 300) throw new Error('Webhook trop ancien')
  return JSON.parse(payload)
}
