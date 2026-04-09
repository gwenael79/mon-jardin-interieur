// src/services/defi.service.js
import { supabase } from '../core/supabaseClient'


export const defiService = {

  // ── Tous les défis actifs avec nb participants ──────────
  async getAll() {
    const { data, error } = await supabase
      .from('defis')
      .select(`
        *,
        defi_participants(count)
      `)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)

    return data.map(d => ({
      ...d,
      participantCount: d.defi_participants?.[0]?.count ?? 0,
    }))
  },

  // ── Défis rejoints par l'utilisateur ───────────────────
  async getMyDefis(userId) {
    const { data, error } = await supabase
      .from('defi_participants')
      .select(`
        progress, joined_at,
        defi:defis(*)
      `)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)

    // Count validated days from defi_daily_actions
    const defiIds = data.map(row => row.defi?.id).filter(Boolean)
    let validatedByDefi = {}
    if (defiIds.length > 0) {
      const { data: actions } = await supabase
        .from('defi_daily_actions')
        .select('defi_id')
        .eq('user_id', userId)
        .eq('completed', true)
        .in('defi_id', defiIds)
      actions?.forEach(a => {
        validatedByDefi[a.defi_id] = (validatedByDefi[a.defi_id] ?? 0) + 1
      })
    }

    return data.map(row => ({
      ...row.defi,
      progress: row.progress,
      joined_at: row.joined_at,
      joined: true,
      days_validated: validatedByDefi[row.defi?.id] ?? 0,
    }))
  },

  // ── Rejoindre un défi ───────────────────────────────────
  async join(userId, defiId) {
    const { error } = await supabase
      .from('defi_participants')
      .insert({ user_id: userId, defi_id: defiId, progress: 0 })

    if (error) throw new Error(error.message)
  },

  // ── Quitter un défi ─────────────────────────────────────
  async leave(userId, defiId) {
    const { error } = await supabase
      .from('defi_participants')
      .delete()
      .eq('user_id', userId)
      .eq('defi_id', defiId)

    if (error) throw new Error(error.message)
  },

  // ── Mettre à jour la progression ────────────────────────
  async updateProgress(userId, defiId, progress) {
    const { error } = await supabase
      .from('defi_participants')
      .update({ progress })
      .eq('user_id', userId)
      .eq('defi_id', defiId)

    if (error) throw new Error(error.message)
  },

  // ── Proposer un nouveau défi ────────────────────────────
async propose(_userId, { title, description, zone, duration_days, emoji, action_duration_minutes, action_periods }) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Session expirée, veuillez vous reconnecter')

  const authUid = session.user.id

  const { data, error } = await supabase
    .from('defis')
    .insert({
      title,
      description,
      zone,
      duration_days,
      emoji: emoji || '🌿',
      is_active: false,
      is_featured: false,
      created_by: authUid,
      action_duration_minutes: action_duration_minutes ?? null,
      action_periods: action_periods?.length > 0 ? action_periods : null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
},

 // ── Stats globales communauté ───────────────────────────
async getCommunityStats() {

  // 👥 Total participations
  const { count: totalParticipants } = await supabase
    .from('defi_participants')
    .select('*', { count: 'exact', head: true })

  // 🌿 Défis actifs
  const { count: totalDefis } = await supabase
    .from('defis')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // 🌱 Jardins actifs = utilisateurs distincts engagés
  const { data: gardens } = await supabase
    .from('defi_participants')
    .select('user_id')

  const activeGardens = new Set(
    gardens?.map(g => g.user_id)
  ).size

  // ✅ Rituels complétés = progress à 100%
  const { count: completedRituals } = await supabase
    .from('defi_participants')
    .select('*', { count: 'exact', head: true })
    .eq('progress', 100)

  return {
    totalParticipants: totalParticipants ?? 0,
    totalDefis: totalDefis ?? 0,
    activeGardens: activeGardens ?? 0,
    completedRituals: completedRituals ?? 0,
  }
},
}