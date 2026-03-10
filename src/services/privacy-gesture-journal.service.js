// src/services/privacy.service.js
import { supabase, query } from '../core/supabaseClient'

export const privacyService = {
  async getSettings(userId) {
    return query(
      supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single(),
      'getPrivacySettings'
    )
  },

  async updateSetting(userId, field, value) {
    return query(
      supabase
        .from('privacy_settings')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single(),
      'updatePrivacySetting'
    )
  },
}

// ─── src/services/gesture.service.js ──────────────────────
import { supabase as sb, query as q } from '../core/supabaseClient'

const ZONE_KEYS = ['zone_racines', 'zone_tige', 'zone_feuilles', 'zone_fleurs', 'zone_souffle']

/**
 * Trouve la zone la plus faible d'un utilisateur en lisant son plant du jour.
 * En cas d'égalité, prend la première zone de la liste (priorité aux racines).
 * Retourne null si aucun plant trouvé.
 */
async function getWeakestZone(userId) {
  const today = new Date().toISOString().slice(0, 10)

  // Cherche le plant du jour, ou le plus récent si absent
  const { data: plant } = await sb
    .from('plants')
    .select('zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle, date')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (!plant) return null

  // Trouve la clé avec la valeur minimale (première en cas d'égalité)
  let weakestKey = ZONE_KEYS[0]
  let weakestVal = plant[ZONE_KEYS[0]] ?? 100

  for (const key of ZONE_KEYS) {
    const val = plant[key] ?? 100
    if (val < weakestVal) {
      weakestVal = val
      weakestKey = key
    }
  }

  return weakestKey
}

export const gestureService = {
  /**
   * Envoie un geste de soin à un membre du cercle.
   * Calcule automatiquement la zone la plus faible du destinataire
   * et l'enregistre dans target_zone.
   */
  async send(fromUserId, toUserId, circleId, type) {
    const target_zone = await getWeakestZone(toUserId)

    return q(
      sb.from('gestures')
        .insert({
          from_user_id: fromUserId,
          to_user_id:   toUserId,
          circle_id:    circleId,
          type,
          target_zone,          // zone la plus faible du destinataire
        })
        .select()
        .single(),
      'sendGesture'
    )
  },

  /**
   * Récupère les gestes reçus par l'utilisateur (avec infos expéditeur).
   */
  async getReceived(userId, limit = 10) {
    return q(
      sb.from('gestures')
        .select(`
          id, type, target_zone, created_at,
          users!from_user_id ( id, display_name, email, avatar_url )
        `)
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
      'getReceivedGestures'
    )
  },
}

// ─── src/services/journal.service.js ──────────────────────
import { supabase as sb2, query as q2 } from '../core/supabaseClient'

export const journalService = {
  async getEntries(userId, limit = 10) {
    return q2(
      sb2.from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
      'getJournalEntries'
    )
  },

  async create(userId, plantId, content, zoneTags = []) {
    return q2(
      sb2.from('journal_entries')
        .insert({ user_id: userId, plant_id: plantId, content, zone_tags: zoneTags })
        .select()
        .single(),
      'createJournalEntry'
    )
  },

  async update(entryId, content, zoneTags) {
    return q2(
      sb2.from('journal_entries')
        .update({ content, zone_tags: zoneTags })
        .eq('id', entryId)
        .select()
        .single(),
      'updateJournalEntry'
    )
  },

  async delete(entryId) {
    return q2(
      sb2.from('journal_entries').delete().eq('id', entryId),
      'deleteJournalEntry'
    )
  },
}
