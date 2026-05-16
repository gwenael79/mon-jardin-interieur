// src/utils/logActivity.js
// Alimente la table `activity` depuis n'importe quel composant
import { supabase } from '../core/supabaseClient'

const ADMIN_ID = 'aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'

export async function logActivity({ userId, action, ritual = null, zone = null, circleId = null }) {
  if (!userId || userId === ADMIN_ID) return
  try {
    const prevLevel = parseInt(localStorage.getItem(`mji_level_${userId}`) ?? '1', 10)

    await supabase.from('activity').insert({ user_id: userId, action, ritual, zone, circle_id: circleId })

    const [{ data: profile }, { data: userData }] = await Promise.all([
      supabase.from('profiles').select('level').eq('id', userId).maybeSingle(),
      supabase.from('users').select('plan').eq('id', userId).maybeSingle(),
    ])
    const newLevel = profile?.level ?? 1
    const planRaw = userData?.plan ?? 'free'
    const plan = ['premium', 'pro-premium'].includes(planRaw) ? 'premium' : 'free'

    localStorage.setItem(`mji_level_${userId}`, String(newLevel))

    if (newLevel > prevLevel) {
      window.dispatchEvent(new CustomEvent('mji:levelup', { detail: { level: newLevel, plan } }))
    }
  } catch (e) {
    console.warn('[activity] log error:', e)
  }
}
