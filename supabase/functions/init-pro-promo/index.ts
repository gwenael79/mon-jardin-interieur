import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON     = Deno.env.get('SUPABASE_ANON_KEY')!

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors() })

  try {
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim()
    if (!token) return error(401, 'Non autorisé')

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON)
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
    if (authErr || !user) return error(401, 'Session invalide')

    console.log('[init-pro-promo] user.id:', user.id, '| user.email:', user.email)

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE)

    const { data: pro, error: proErr } = await admin
      .from('users_pro')
      .select('id, pro_id, nom, prenom, stripe_coupon_id, stripe_promo_code_id')
      .eq('user_id', user.id)
      .maybeSingle()

    console.log('[init-pro-promo] pro found:', JSON.stringify(pro), '| error:', JSON.stringify(proErr))

    if (!pro)        return error(404, 'Compte pro introuvable')
    if (!pro.pro_id) return error(400, 'pro_id manquant — rechargez votre profil')

    // Déjà initialisé
    if (pro.stripe_promo_code_id) {
      return json({ promo_code: pro.pro_id, stripe_promo_code_id: pro.stripe_promo_code_id })
    }

    // 1. Vérifier si le promo code existe déjà dans Stripe avant de créer quoi que ce soit
    const checkRes = await fetch(
      `https://api.stripe.com/v1/promotion_codes?code=${encodeURIComponent(pro.pro_id)}&limit=1`,
      { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
    )
    const checkData = await checkRes.json()
    const existingPromo = checkData?.data?.[0]

    if (existingPromo) {
      const promoId  = existingPromo.id
      const couponId = existingPromo.coupon?.id ?? null
      console.log(`[init-pro-promo] Promo code déjà existant dans Stripe : ${promoId}`)
      await dbUpdate(pro.id, couponId, promoId)
      return json({ promo_code: pro.pro_id, stripe_promo_code_id: promoId })
    }

    // 2. Créer le coupon Stripe -10%
    const coupon = await stripePost('coupons', {
      percent_off: 10,
      duration:    'forever',
      name:        `Partenaire Mon Jardin — ${pro.prenom} ${pro.nom}`,
      metadata:    { pro_users_pro_id: pro.id },
    })
    const couponId = coupon.id
    console.log(`[init-pro-promo] Coupon créé : ${couponId}`)

    // 3. Créer le promotion_code Stripe
    const promo = await stripePost('promotion_codes', {
      coupon:   couponId,
      code:     pro.pro_id,
      metadata: { pro_users_pro_id: pro.id },
    })
    const promoId = promo.id
    console.log(`[init-pro-promo] Promo code créé : ${promoId} (${pro.pro_id})`)

    // 4. Persister les IDs Stripe via fetch direct REST
    await dbUpdate(pro.id, couponId, promoId)

    return json({ promo_code: pro.pro_id, stripe_promo_code_id: promoId })

  } catch (e) {
    console.error('[init-pro-promo]', e)
    return error(500, e instanceof Error ? e.message : 'Erreur serveur')
  }
})

async function stripePost(endpoint: string, body: Record<string, unknown>) {
  const params = new URLSearchParams()
  flattenParams(body, '', params)
  const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? JSON.stringify(data.error))
  return data
}

function flattenParams(obj: Record<string, unknown>, prefix: string, params: URLSearchParams) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k
    if (v === null || v === undefined) continue
    if (typeof v === 'object' && !Array.isArray(v)) {
      flattenParams(v as Record<string, unknown>, key, params)
    } else {
      params.append(key, String(v))
    }
  }
}

function cors() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors(), 'Content-Type': 'application/json' } })
}
function error(status: number, message: string) {
  return json({ error: message }, status)
}
