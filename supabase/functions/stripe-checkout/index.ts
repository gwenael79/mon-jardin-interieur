import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON     = Deno.env.get('SUPABASE_ANON_KEY')!

const PLAN_MONTHS: Record<string, number> = {
  'price_1TMpO0CIpPVJTaopHfQrzF8z': 1,
  'price_1TMpO0CIpPVJTaopzrpNDw8r': 12,
}

const ONE_TIME_PACKS: Record<string, { lumens?: number; months?: number }> = {
  'price_1TMpOGCIpPVJTaopkipwkvDT': { lumens: 50  },
  'price_1TMpOSCIpPVJTaopNRKgm3rn': { lumens: 100 },
  'price_1TMpObCIpPVJTaopdCLedWAg': { lumens: 150 },
}

const SOLIDARITY_MIN_CENTS = 10800

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() })

  try {
    if (!STRIPE_SECRET_KEY) return error(500, 'Configuration serveur manquante')

    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim()
    if (!token) return error(401, 'Non autorisé — token manquant')

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON)
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
    if (authErr || !user) return error(401, 'Non autorisé — session invalide')

    const body = await req.json()
    const { priceId, successUrl, cancelUrl, produitId, atelierId, solidarity, amount, promoCode } = body

    // ── Résolution du code promo (Stripe + détection pro) ────────────────────
    let discounts: unknown[] | undefined
    let proUsersProId: string | undefined

    if (promoCode && typeof promoCode === 'string' && promoCode.trim()) {
      const resolved = await resolvePromoCode(promoCode.trim())
      if (!resolved) return error(400, `Code promo "${promoCode.trim()}" invalide ou expiré.`)
      discounts    = [{ promotion_code: resolved.id }]
      proUsersProId = resolved.proUsersProId
      console.log(`[stripe-checkout] Promo: ${promoCode} → ${resolved.id}${proUsersProId ? ` (pro ${proUsersProId})` : ''}`)
    }

    // ── Cas Atelier payant ───────────────────────────────────────────────────
    if (atelierId) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE)

      const { data: atelier, error: atelierErr } = await adminClient
        .from('ateliers').select('id, title, price, animator_id')
        .eq('id', atelierId).maybeSingle()

      if (!atelier) return error(404, 'Atelier introuvable — ' + JSON.stringify(atelierErr))
      if (!atelier.price || atelier.price <= 0) return error(400, 'Cet atelier est gratuit')

      const { data: userData } = await adminClient
        .from('users').select('stripe_customer_id, display_name').eq('id', user.id).single()

      let customerId = userData?.stripe_customer_id
      if (!customerId) {
        const cust = await stripePost('customers', { email: user.email ?? '', name: userData?.display_name ?? '', metadata: { supabase_uid: user.id } })
        customerId = cust.id
        await adminClient.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id)
      }

      const baseUrl = req.headers.get('origin') ?? 'https://monjardininterieur.com'
      const sessionBody: Record<string, unknown> = {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ quantity: 1, price_data: {
          currency: 'eur',
          unit_amount: Math.round(atelier.price * 100),
          product_data: { name: atelier.title },
        }}],
        mode: 'payment',
        success_url: successUrl ?? `${baseUrl}/?atelier_success=1`,
        cancel_url:  cancelUrl  ?? `${baseUrl}/`,
        metadata: {
          supabase_uid: user.id, type: 'atelier_achat',
          atelier_id: atelierId, animator_user_id: atelier.animator_id ?? '',
        },
        payment_intent_data: { metadata: {
          supabase_uid: user.id, type: 'atelier_achat',
          atelier_id: atelierId, animator_user_id: atelier.animator_id ?? '',
        }},
      }
      const session = await stripePost('checkout/sessions', sessionBody)
      console.log(`[stripe-checkout] Atelier session créée — ${atelierId} pour ${user.id}`)
      return json({ url: session.url, sessionId: session.id })
    }

    // ── Cas Jardinothèque ────────────────────────────────────────────────────
    if (produitId) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE)

      const { data: produit, error: produitErr } = await adminClient
        .from('produits').select('id, titre, prix, stripe_price_id, type')
        .eq('id', produitId).maybeSingle()

      if (!produit) return error(404, 'Produit introuvable — ' + JSON.stringify(produitErr))
      if (!produit.stripe_price_id) return error(400, 'Pas de Price ID Stripe')

      const { data: userData } = await adminClient
        .from('users').select('stripe_customer_id, display_name').eq('id', user.id).single()

      let customerId = userData?.stripe_customer_id
      if (!customerId) {
        const cust = await stripePost('customers', { email: user.email ?? '', name: userData?.display_name ?? '', metadata: { supabase_uid: user.id } })
        customerId = cust.id
        await adminClient.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id)
      }

      const baseUrl = req.headers.get('origin') ?? 'https://monjardininterieur.com'
      const sessionBody: Record<string, unknown> = {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: produit.stripe_price_id, quantity: 1 }],
        mode: 'payment',
        success_url: successUrl ?? `${baseUrl}/?achat=success`,
        cancel_url:  cancelUrl  ?? `${baseUrl}/?achat=cancel`,
        metadata: {
          supabase_uid: user.id, price_id: produit.stripe_price_id,
          produit_id: produitId, type: 'produit_achat',
          ...(proUsersProId ? { pro_users_pro_id: proUsersProId } : {}),
        },
        payment_intent_data: { metadata: {
          supabase_uid: user.id, price_id: produit.stripe_price_id,
          produit_id: produitId, type: 'produit_achat',
          ...(proUsersProId ? { pro_users_pro_id: proUsersProId } : {}),
        }},
      }
      if (discounts) sessionBody.discounts = discounts
      const session = await stripePost('checkout/sessions', sessionBody)
      return json({ url: session.url, sessionId: session.id })
    }

    // ── Cas tarif solidaire ──────────────────────────────────────────────────
    if (solidarity === true) {
      const amountCents = Math.round(Number(amount))
      if (!amountCents || amountCents < SOLIDARITY_MIN_CENTS)
        return error(400, `Minimum ${SOLIDARITY_MIN_CENTS / 100} €`)

      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE)
      const { data: userData } = await admin.from('users').select('stripe_customer_id, display_name').eq('id', user.id).single()

      let customerId = userData?.stripe_customer_id
      if (!customerId) {
        const cust = await stripePost('customers', { email: user.email ?? '', name: userData?.display_name ?? '', metadata: { supabase_uid: user.id } })
        customerId = cust.id
        await admin.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id)
      }

      const baseUrl = req.headers.get('origin') ?? 'https://monjardininterieur.com'
      const sessionBody: Record<string, unknown> = {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: amountCents, product_data: { name: 'Mon Jardin Intérieur — Tarif solidaire 12 mois', description: 'Accès Premium complet pendant 12 mois.' } } }],
        mode: 'payment',
        success_url: successUrl ?? `${baseUrl}/?premium=success`,
        cancel_url:  cancelUrl  ?? `${baseUrl}/?premium=cancel`,
        metadata: {
          supabase_uid: user.id, type: 'solidarity', plan_months: '12', amount_cents: String(amountCents),
          ...(proUsersProId ? { pro_users_pro_id: proUsersProId } : {}),
        },
        payment_intent_data: { metadata: {
          supabase_uid: user.id, type: 'solidarity', plan_months: '12', amount_cents: String(amountCents),
          ...(proUsersProId ? { pro_users_pro_id: proUsersProId } : {}),
        }, description: `Tarif solidaire Mon Jardin Intérieur — ${amountCents / 100} €` },
      }
      if (discounts) sessionBody.discounts = discounts
      const session = await stripePost('checkout/sessions', sessionBody)
      return json({ url: session.url, sessionId: session.id })
    }

    // ── Cas abonnements récurrents + packs Lumens ────────────────────────────
    const isSubscription = !!PLAN_MONTHS[priceId]
    const isOneTime      = !!ONE_TIME_PACKS[priceId]
    if (!priceId || (!isSubscription && !isOneTime)) return error(400, 'Price ID invalide')

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE)
    const { data: userData } = await admin.from('users').select('stripe_customer_id, display_name').eq('id', user.id).single()

    let customerId = userData?.stripe_customer_id
    if (!customerId) {
      const cust = await stripePost('customers', { email: user.email ?? '', name: userData?.display_name ?? '', metadata: { supabase_uid: user.id } })
      customerId = cust.id
      await admin.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const baseUrl = req.headers.get('origin') ?? 'https://monjardininterieur.com'
    const pack    = ONE_TIME_PACKS[priceId] ?? {}

    const sessionBody: Record<string, unknown> = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: successUrl ?? `${baseUrl}/?premium=success`,
      cancel_url:  cancelUrl  ?? `${baseUrl}/?premium=cancel`,
      metadata: {
        supabase_uid: user.id, price_id: priceId,
        ...(isSubscription
          ? { plan_months: String(PLAN_MONTHS[priceId]) }
          : { ...(pack.lumens ? { lumen_amount: String(pack.lumens) } : {}), ...(pack.months ? { plan_months: String(pack.months) } : {}) }),
        ...(proUsersProId ? { pro_users_pro_id: proUsersProId } : {}),
      },
    }

    if (isSubscription) {
      sessionBody.subscription_data = { metadata: {
        supabase_uid: user.id, price_id: priceId, plan_months: String(PLAN_MONTHS[priceId]),
        ...(proUsersProId ? { pro_users_pro_id: proUsersProId } : {}),
      }}
    } else {
      sessionBody.payment_intent_data = { metadata: {
        supabase_uid: user.id, price_id: priceId,
        ...(pack.lumens ? { lumen_amount: String(pack.lumens) } : {}),
        ...(pack.months ? { plan_months: String(pack.months) } : {}),
        ...(proUsersProId ? { pro_users_pro_id: proUsersProId } : {}),
      }}
    }

    if (discounts) sessionBody.discounts = discounts

    const session = await stripePost('checkout/sessions', sessionBody)
    console.log(`[stripe-checkout] Session créée pour ${user.id} — ${priceId}`)
    return json({ url: session.url, sessionId: session.id })

  } catch (e) {
    console.error('[stripe-checkout] Erreur:', e)
    return error(500, e instanceof Error ? e.message : 'Erreur serveur')
  }
})

// ── Résout un code promo vers son ID Stripe + pro_users_pro_id (si code pro) ──
async function resolvePromoCode(code: string): Promise<{ id: string; proUsersProId?: string } | null> {
  const res  = await fetch(
    `https://api.stripe.com/v1/promotion_codes?code=${encodeURIComponent(code)}&active=true&limit=1`,
    { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
  )
  const data  = await res.json()
  const promo = data?.data?.[0]
  if (!promo) return null
  return { id: promo.id, proUsersProId: promo.metadata?.pro_users_pro_id }
}

async function stripePost(endpoint: string, body: Record<string, unknown>) {
  const params = new URLSearchParams()
  flatten(body, '', params)
  const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? JSON.stringify(data.error))
  return data
}

function flatten(obj: Record<string, unknown>, prefix: string, params: URLSearchParams) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k
    if (v === null || v === undefined) continue
    if (typeof v === 'object' && !Array.isArray(v)) {
      flatten(v as Record<string, unknown>, key, params)
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === 'object') flatten(item as Record<string, unknown>, `${key}[${i}]`, params)
        else params.append(`${key}[${i}]`, String(item))
      })
    } else {
      params.append(key, String(v))
    }
  }
}

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
}
function error(status: number, message: string) {
  return json({ error: message }, status)
}
