// src/hooks/usePremium.js
import { useEffect, useState } from 'react'
import { supabase } from '../core/supabaseClient'

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false)
  const [premiumUntil, setPremiumUntil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let subscription

    async function checkPremium(userId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('premium_until')
        .eq('id', userId)
        .single()

      if (error || !data) {
        setIsPremium(false)
        setPremiumUntil(null)
      } else {
        const until = data.premium_until ? new Date(data.premium_until) : null
        const active = until && until > new Date()
        setIsPremium(active)
        setPremiumUntil(until)
      }
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkPremium(session.user.id)
      } else {
        setIsPremium(false)
        setLoading(false)
      }
    })

    // Réagit aux changements de session (login/logout)
    subscription = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkPremium(session.user.id)
      } else {
        setIsPremium(false)
        setPremiumUntil(null)
        setLoading(false)
      }
    }).data.subscription

    return () => subscription?.unsubscribe()
  }, [])

  return { isPremium, premiumUntil, loading }
}
