// src/services/circle.service.js
import { supabase } from "../core/supabaseClient"

export const circleService = {
  // ─── MES CERCLES ─────────────────────────────────────────
  /**
   * Récupère tous les cercles de l'utilisateur connecté
   * avec les membres et leurs plantes du jour.
   */
  async getMyCircles(userId) {
    // 1. IDs des cercles dont je suis membre
    const memberships = await query(
      supabase
        .from('circle_members')
        .select('circle_id, role')
        .eq('user_id', userId),
      'getMyCircles/memberships'
    )

    if (!memberships.length) return []

    const circleIds = memberships.map(m => m.circle_id)
    const roleMap   = Object.fromEntries(memberships.map(m => [m.circle_id, m.role]))

    // 2. Données des cercles + membres
    const circles = await query(
      supabase
        .from('circles')
        .select(`
          id, name, theme, invite_code, is_open, max_members, created_at,
          circle_members (
            user_id, role, joined_at,
            users ( id, display_name, email, avatar_url )
          )
        `)
        .in('id', circleIds),
      'getMyCircles/circles'
    )

    return circles.map(c => ({
      ...c,
      myRole: roleMap[c.id],
      isAdmin: roleMap[c.id] === 'admin',
      memberCount: c.circle_members.length,
    }))
  },

  // ─── MEMBRES D'UN CERCLE AVEC LEURS PLANTES ──────────────
  /**
   * Retourne les membres d'un cercle avec la plante du jour de chacun.
   * RLS garantit que seules les plantes avec show_health = true sont visibles.
   */
  async getCircleMembersWithPlants(circleId) {
    const today = new Date().toISOString().split('T')[0]

    const members = await query(
      supabase
        .from('circle_members')
        .select(`
          user_id, role, joined_at,
          users (
            id, display_name, email, avatar_url,
            plants (
              id, date, health, zone_racines, zone_tige,
              zone_feuilles, zone_fleurs, zone_souffle
            )
          )
        `)
        .eq('circle_id', circleId),
      'getMembersWithPlants'
    )

    return members.map(m => {
      const todayPlant = m.users?.plants?.find(p => p.date === today) ?? null
      return {
        userId:    m.user_id,
        role:      m.role,
        joinedAt:  m.joined_at,
        user:      m.users,
        todayPlant,
      }
    })
  },

  // ─── CRÉER UN CERCLE ─────────────────────────────────────
  async create(userId, { name, theme, isOpen = false }) {
    const circle = await query(
      supabase
        .from('circles')
        .insert({ name, theme, is_open: isOpen, created_by: userId })
        .select()
        .single(),
      'createCircle'
    )

    // Le créateur devient admin automatiquement
    await query(
      supabase
        .from('circle_members')
        .insert({ circle_id: circle.id, user_id: userId, role: 'admin' }),
      'createCircle/addAdmin'
    )

    return circle
  },

  // ─── REJOINDRE VIA CODE ───────────────────────────────────
  async joinByCode(userId, inviteCode) {
    const circle = await query(
      supabase
        .from('circles')
        .select('id, name, max_members')
        .eq('invite_code', inviteCode.toUpperCase())
        .single(),
      'joinByCode/findCircle'
    )

    // Vérifie la capacité
    const { count } = await supabase
      .from('circle_members')
      .select('*', { count: 'exact', head: true })
      .eq('circle_id', circle.id)

    if (count >= circle.max_members) {
      throw new Error(`Ce cercle est complet (${circle.max_members} membres max).`)
    }

    await query(
      supabase
        .from('circle_members')
        .insert({ circle_id: circle.id, user_id: userId, role: 'member' }),
      'joinByCode/insert'
    )

    return circle
  },

  // ─── QUITTER UN CERCLE ────────────────────────────────────
  async leave(userId, circleId) {
    return query(
      supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', circleId)
        .eq('user_id', userId),
      'leaveCircle'
    )
  },
}
