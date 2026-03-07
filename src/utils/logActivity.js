// src/utils/logActivity.js
// Alimente la table `activity` depuis n'importe quel composant
import { supabase } from '../core/supabaseClient'

const ADMIN_ID = 'aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'

export async function logActivity({ userId, action, ritual = null, zone = null, circleId = null }) {
  if (!userId || userId === ADMIN_ID) return
  try {
    await supabase.from('activity').insert({ user_id: userId, action, ritual, zone, circle_id: circleId })
  } catch (e) {
    console.warn('[activity] log error:', e)
  }
}
