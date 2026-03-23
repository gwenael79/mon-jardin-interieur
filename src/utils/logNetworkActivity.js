// src/utils/logNetworkActivity.js
import { supabase } from '../core/supabaseClient'

/**
 * Enregistre une action dans network_activity pour le Pouls du réseau
 * @param {string} userId
 * @param {'ritual_complete'|'coeur'|'login'|'intention_joined'|'defi_validated'} actionType
 */
export async function logNetworkActivity(userId, actionType) {
  if (!userId || !actionType) return
  try {
    await supabase.from('network_activity').insert({ user_id: userId, action_type: actionType })
  } catch (e) {
    console.warn('[logNetworkActivity]', e.message)
  }
}
