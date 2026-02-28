// src/services/circle.service.js
import { supabase, query } from '../core/supabaseClient'

export const circleService = {
  // ─── MES CERCLES ─────────────────────────────────────────
  async getMyCircles(userId) {
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
      myRole:      roleMap[c.id],
      isAdmin:     roleMap[c.id] === 'admin',
      memberCount: c.circle_members.length,
    }))
  },

  // ─── MEMBRES D'UN CERCLE AVEC LEURS PLANTES ──────────────
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
        userId:   m.user_id,
        role:     m.role,
        joinedAt: m.joined_at,
        user:     m.users,
        todayPlant,
      }
    })
  },

  // ─── CRÉER UN CERCLE (via RPC security definer) ───────────
  // Contourne RLS en déléguant à une fonction Postgres owner.
  // À exécuter UNE FOIS dans le SQL Editor Supabase :
  //
  //   create or replace function public.create_circle(
  //     p_name text, p_theme text, p_is_open boolean default false
  //   ) returns public.circles language plpgsql security definer as $$
  //   declare v_circle public.circles;
  //   begin
  //     insert into public.circles (name, theme, is_open, created_by)
  //     values (p_name, p_theme, p_is_open, auth.uid())
  //     returning * into v_circle;
  //     insert into public.circle_members (circle_id, user_id, role)
  //     values (v_circle.id, auth.uid(), 'admin');
  //     return v_circle;
  //   end; $$;
  //   grant execute on function public.create_circle to authenticated;
  //
  async create(userId, { name, theme, isOpen = false }) {
    const { data, error } = await supabase.rpc('create_circle', {
      p_name:    name,
      p_theme:   theme ?? 'Bien-être général',
      p_is_open: isOpen,
    })
    if (error) throw new Error(error.message)
    return {
      ...data,
      myRole:         'admin',
      isAdmin:        true,
      memberCount:    1,
      circle_members: [],
    }
  },

  // ─── REJOINDRE VIA CODE ───────────────────────────────────
  async joinByCode(userId, inviteCode) {
    const { data: circle, error: findError } = await supabase
      .from('circles')
      .select('id, name, max_members')
      .eq('invite_code', inviteCode.toUpperCase().trim())
      .single()

    if (findError || !circle) {
      throw new Error('Code invalide ou cercle introuvable.')
    }

    const { count } = await supabase
      .from('circle_members')
      .select('*', { count: 'exact', head: true })
      .eq('circle_id', circle.id)

    if (count >= (circle.max_members ?? 8)) {
      throw new Error(`Ce cercle est complet (${circle.max_members} membres max).`)
    }

    const { data: existing } = await supabase
      .from('circle_members')
      .select('circle_id')
      .eq('circle_id', circle.id)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) throw new Error('Vous êtes déjà membre de ce cercle.')

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
// ─── STATS GLOBALES DES CERCLES ──────────────────────────
async getGlobalStats(userId) {

  // 🔹 Combien de cercles j’ai rejoint
  const { count: myCircleCount } = await supabase
    .from('circle_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // 🔹 Nombre total de membres dans tous mes cercles
  const { data: memberships } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', userId)

  const circleIds = memberships?.map(m => m.circle_id) ?? []

  let totalMembers = 0

  if (circleIds.length) {
    const { count } = await supabase
      .from('circle_members')
      .select('*', { count: 'exact', head: true })
      .in('circle_id', circleIds)

    totalMembers = count ?? 0
  }

  return {
    myCircleCount: myCircleCount ?? 0,
    totalMembers,
  }
},


}
