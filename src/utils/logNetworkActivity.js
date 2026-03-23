// src/utils/logNetworkActivity.js
import { supabase } from '../core/supabaseClient'

export async function logNetworkActivity(userId, actionType) {
  if (!userId || !actionType) {
    console.warn('[logNetworkActivity] userId ou actionType manquant', { userId, actionType })
    return
  }
  try {
    const { error } = await supabase.from('network_activity').insert({ user_id: userId, action_type: actionType })
    if (error) console.error('[logNetworkActivity] erreur:', error.message, error)
    else console.log('[logNetworkActivity] ✓', actionType, userId)
  } catch (e) {
    console.error('[logNetworkActivity] exception:', e.message)
  }
}
