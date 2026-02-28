import { useState, useEffect, useCallback } from 'react'
import { supabase, query } from '../core/supabaseClient'

/**
 * useSubscription
 * Gère les abonnements de l'utilisateur connecté via Supabase.
 * Table attendue : "subscriptions"
 *   id, user_id, product_id, product_name, product_icon,
 *   months, price, purchased_at, expires_at, is_active
 */
export function useSubscription() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading]             = useState(true)
  const [user, setUser]                   = useState(null)

  // ── Charger l'utilisateur ────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // ── Charger les abonnements ──────────────────────────────
  const fetchSubscriptions = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    try {
      const data = await query(
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('purchased_at', { ascending: false }),
        'fetchSubscriptions'
      )
      const enriched = data.map(s => ({
        ...s,
        daysLeft: Math.max(0, Math.ceil(
          (new Date(s.expires_at) - Date.now()) / (24 * 3600 * 1000)
        )),
        isExpired: new Date(s.expires_at) <= Date.now()
      }))
      setSubscriptions(enriched)
    } catch {
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchSubscriptions() }, [fetchSubscriptions])

  // ── Vérifier si l'utilisateur a un plan ─────────────────
  const hasPlan = subscriptions.some(s => !s.isExpired)
  const isFirstConnection = !loading && !hasPlan

  // ── Activer l'accès gratuit ──────────────────────────────
  const activateFree = useCallback(async () => {
    if (!user) return false
    try {
      await query(
        supabase.from('profiles').update({ plan: 'free', onboarded: true }).eq('id', user.id),
        'activateFree'
      )
      await fetchSubscriptions()
      return true
    } catch {
      return false
    }
  }, [user, fetchSubscriptions])

  // ── Enregistrer les abonnements après paiement Stripe ───
  // En production : déclenché par webhook Stripe, pas directement ici
  const saveSubscriptions = useCallback(async (items) => {
    if (!user) return false
    try {
      const rows = items.map(item => ({
        user_id:      user.id,
        product_id:   item.id,
        product_name: item.name,
        product_icon: item.icon,
        months:       parseInt(item.months),
        price:        item.price,
        purchased_at: new Date().toISOString(),
        expires_at:   new Date(
          Date.now() + DUR_DAYS[item.months] * 24 * 3600 * 1000
        ).toISOString(),
        is_active: true
      }))

      await query(
        supabase.from('subscriptions').insert(rows),
        'saveSubscriptions'
      )
      await query(
        supabase.from('profiles').update({ plan: 'premium', onboarded: true }).eq('id', user.id),
        'updateProfile'
      )
      await fetchSubscriptions()
      return true
    } catch {
      return false
    }
  }, [user, fetchSubscriptions])

  return {
    user,
    subscriptions,
    loading,
    hasPlan,
    isFirstConnection,
    activateFree,
    saveSubscriptions,
    refresh: fetchSubscriptions
  }
}

export const DUR_DAYS   = { "1": 30, "3": 90, "6": 180, "12": 365 }
export const DUR_LABELS = { "1": "1 mois", "3": "3 mois", "6": "6 mois", "12": "1 an" }

export const PRODUCTS = [
  {
    id: "total",
    icon: "🌸",
    name: "Accès Total",
    desc: "Tout débloquer : cercles, défis, articles, contenus guidés",
    prices: { "1": 14.90, "3": 38.70, "6": 71.52, "12": 119.20 },
    savings: { "3": "-14%", "6": "-20%", "12": "-33%" },
    stripePrices: { "1": "price_XXX_1m", "3": "price_XXX_3m", "6": "price_XXX_6m", "12": "price_XXX_12m" }
  },
  {
    id: "cercle",
    icon: "🔵",
    name: "Accès Cercle",
    desc: "Espaces communautaires & partage en groupe",
    prices: { "1": 6.90, "3": 17.70, "6": 32.40, "12": 55.20 },
    savings: { "3": "-15%", "6": "-22%", "12": "-33%" },
    stripePrices: { "1": "price_XXX_1m", "3": "price_XXX_3m", "6": "price_XXX_6m", "12": "price_XXX_12m" }
  },
  {
    id: "circles",
    icon: "🌀",
    name: "Accès Circles",
    desc: "Sous-groupes affinitaires & conversations profondes",
    prices: { "1": 5.90, "3": 15.30, "6": 28.32, "12": 47.20 },
    savings: { "3": "-14%", "6": "-20%", "12": "-33%" },
    stripePrices: { "1": "price_XXX_1m", "3": "price_XXX_3m", "6": "price_XXX_6m", "12": "price_XXX_12m" }
  },
  {
    id: "defis",
    icon: "🎯",
    name: "Accès Défis",
    desc: "Parcours de croissance guidés & challenges collectifs",
    prices: { "1": 4.90, "3": 12.60, "6": 23.52, "12": 39.20 },
    savings: { "3": "-14%", "6": "-20%", "12": "-33%" },
    stripePrices: { "1": "price_XXX_1m", "3": "price_XXX_3m", "6": "price_XXX_6m", "12": "price_XXX_12m" }
  },
  {
    id: "articles",
    icon: "📖",
    name: "Articles Bienveillants",
    desc: "Bibliothèque de lectures soignées pour l'éveil quotidien",
    prices: { "1": 3.90, "3": 9.90, "6": 18.72, "12": 31.20 },
    savings: { "3": "-15%", "6": "-20%", "12": "-33%" },
    stripePrices: { "1": "price_XXX_1m", "3": "price_XXX_3m", "6": "price_XXX_6m", "12": "price_XXX_12m" }
  },
  {
    id: "exclusifs",
    icon: "✨",
    name: "Contenus Exclusifs Guidés",
    desc: "Méditations, ateliers audio & vidéos d'accompagnement",
    prices: { "1": 7.90, "3": 20.70, "6": 37.92, "12": 63.20 },
    savings: { "3": "-13%", "6": "-20%", "12": "-33%" },
    stripePrices: { "1": "price_XXX_1m", "3": "price_XXX_3m", "6": "price_XXX_6m", "12": "price_XXX_12m" }
  }
]
