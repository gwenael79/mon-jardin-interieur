// src/services/plant.service.js
import { supabase, query } from '../core/supabaseClient'

const HEALTH_MIN = 0
const HEALTH_MAX = 100
const HEALTH_DEFAULT = 5

const ZONE_COLUMN = {
  Racines:  'zone_racines',
  Tige:     'zone_tige',
  Feuilles: 'zone_feuilles',
  Fleurs:   'zone_fleurs',
  Souffle:  'zone_souffle',
}

function clamp(val, min = HEALTH_MIN, max = HEALTH_MAX) {
  return Math.min(max, Math.max(min, val))
}

export const plantService = {
  async getTodayPlant(userId) {
    const today = new Date().toISOString().split('T')[0]

    const existing = await query(
      supabase
        .from('plants')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle(),
      'getTodayPlant'
    )

    if (existing) return existing

    await query(
      supabase
        .from('plants')
        .upsert(
          {
            user_id:       userId,
            date:          today,
            health:        HEALTH_DEFAULT,
            zone_racines:  HEALTH_DEFAULT,
            zone_tige:     HEALTH_DEFAULT,
            zone_feuilles: HEALTH_DEFAULT,
            zone_fleurs:   HEALTH_DEFAULT,
            zone_souffle:  HEALTH_DEFAULT,
          },
          { onConflict: 'user_id,date', ignoreDuplicates: true }
        )
        .select(),
      'createTodayPlant'
    )
    return query(
      supabase.from('plants').select('*').eq('user_id', userId).eq('date', today).maybeSingle(),
      'createTodayPlant/refetch'
    )
  },

  async applyRitualEffect(plantId, delta, zone = null) {
    const plant = await query(
      supabase.from('plants').select('*').eq('id', plantId).single(),
      'applyRitualEffect/get'
    )

    const updates = {
      health:     clamp(plant.health + delta),
      updated_at: new Date().toISOString(),
    }

    if (zone && ZONE_COLUMN[zone]) {
      const col = ZONE_COLUMN[zone]
      updates[col] = clamp(plant[col] + delta)
    }

    return query(
      supabase.from('plants').update(updates).eq('id', plantId).select().single(),
      'applyRitualEffect/update'
    )
  },

  async updateZone(plantId, zone, delta) {
    const col = ZONE_COLUMN[zone]
    if (!col) throw new Error(`Zone inconnue : ${zone}`)

    const plant = await query(
      supabase.from('plants').select(col).eq('id', plantId).single(),
      'updateZone/get'
    )

    const newVal = clamp(plant[col] + delta)
    const newHealth = await recalculateHealth(plantId, col, newVal)

    return query(
      supabase.from('plants')
        .update({ [col]: newVal, health: newHealth, updated_at: new Date().toISOString() })
        .eq('id', plantId)
        .select()
        .single(),
      'updateZone/update'
    )
  },

  async getHistory(userId, days = 7) {
    const since = new Date()
    since.setDate(since.getDate() - days + 1)
    const sinceStr = since.toISOString().split('T')[0]

    return query(
      supabase
        .from('plants')
        .select('id, date, health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
        .eq('user_id', userId)
        .gte('date', sinceStr)
        .order('date', { ascending: true }),
      'getHistory'
    )
  },

  // -------------------------------------------------------------------
  // CORRECTIF STREAK
  // Source de verite : table `activity`
  // Chaque ligne = une vraie action metier (rituel, bilan, bouquet, coeur, merci...)
  // Le champ `day` est de type date (YYYY-MM-DD) -> pas de conversion timezone
  // Fenetre elargie a 90 jours pour supporter des streaks longs
  // -------------------------------------------------------------------
  async getStats(userId) {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const since = ninetyDaysAgo.toISOString().split('T')[0]

    const [activityRows, plants, rituals] = await Promise.all([
      query(
        supabase
          .from('activity')
          .select('day')
          .eq('user_id', userId)
          .gte('day', since),
        'getStats/activity'
      ),
      query(
        supabase
          .from('plants')
          .select('date, health')
          .eq('user_id', userId)
          .gte('date', since)
          .order('date', { ascending: false }),
        'getStats/plants'
      ),
      query(
        supabase
          .from('rituals')
          .select('zone, completed_at')
          .eq('user_id', userId)
          .gte('completed_at', ninetyDaysAgo.toISOString()),
        'getStats/rituals'
      ),
    ])

    // Jours uniques d'activite -- `day` est deja YYYY-MM-DD, pas de conversion necessaire
    const activeDates = new Set(activityRows.map(a => a.day))

    return {
      plants,
      streak:           calculateStreak(activeDates),
      ritualsThisMonth: rituals.length,
      favoriteZone:     calculateFavoriteZone(rituals),
    }
  },
}

async function recalculateHealth(plantId, updatedCol, updatedVal) {
  const plant = await query(
    supabase.from('plants')
      .select('zone_racines,zone_tige,zone_feuilles,zone_fleurs,zone_souffle')
      .eq('id', plantId)
      .single(),
    'recalculateHealth'
  )
  const overridden = { ...plant, [updatedCol]: updatedVal }
  const vals = Object.values(overridden)
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

// activeDates : Set<string> de dates YYYY-MM-DD issues du champ `day` de la table `activity`
// Regles :
//   - Aucune activite ni aujourd'hui ni hier  -> streak = 0 (reset garanti)
//   - Pas encore d'activite aujourd'hui       -> on part d'hier (streak conserve en cours de journee)
//   - Jour consecutif trouve                  -> on incremente et recule d'un jour
function calculateStreak(activeDates) {
  if (!activeDates.size) return 0

  const now       = new Date()
  const today     = now.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })
    .split('/').reverse().join('-')
  const yesterday = new Date(now - 86400000)
    .toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })
    .split('/').reverse().join('-')

  // Aucune activite ni aujourd'hui ni hier -> streak casse
  if (!activeDates.has(today) && !activeDates.has(yesterday)) return 0

  // On part d'aujourd'hui si actif, sinon d'hier
  const startDate = activeDates.has(today) ? today : yesterday
  let current = new Date(startDate + 'T12:00:00') // midi pour eviter les decalages DST

  let streak = 0
  while (true) {
    const dateStr = current.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })
      .split('/').reverse().join('-')
    if (!activeDates.has(dateStr)) break
    streak++
    current.setDate(current.getDate() - 1)
  }
  return streak
}

function calculateFavoriteZone(rituals) {
  if (!rituals.length) return null
  const counts = {}
  for (const r of rituals) {
    counts[r.zone] = (counts[r.zone] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}
