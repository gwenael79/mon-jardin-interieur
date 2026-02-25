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

export const gestureService = {
  /**
   * Envoie un geste de soin à un membre du cercle.
   */
  async send(fromUserId, toUserId, circleId, type) {
    return q(
      sb.from('gestures')
        .insert({ from_user_id: fromUserId, to_user_id: toUserId, circle_id: circleId, type })
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
          id, type, created_at,
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
