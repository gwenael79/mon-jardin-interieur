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

  async getStats(userId) {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const since90 = ninetyDaysAgo.toISOString().split('T')[0]

    const [plants, rituals, activityRows] = await Promise.all([
      query(
        supabase
          .from('plants')
          .select('date, health')
          .eq('user_id', userId)
          .gte('date', since90)
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
      query(
        supabase
          .from('activity')
          .select('day')
          .eq('user_id', userId)
          .gte('day', since90),
        'getStats/activity'
      ),
    ])

    // Jours avec vraie activité (trigger DB garantit que day = date UTC de created_at)
    const activityDates = new Set((activityRows ?? []).map(a => a.day).filter(Boolean))
    // Jours avec au moins 1 rituel complété (source fiable, pas de carry-over)
    const ritualDates   = new Set((rituals ?? []).map(r => r.completed_at?.split('T')[0]).filter(Boolean))

    return {
      plants,
      streak:           calculateStreak(activityDates, ritualDates),
      ritualsThisMonth: (rituals ?? []).filter(r => r.completed_at >= thirtyDaysAgo.toISOString()).length,
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

// Un jour compte dans le streak si :
//   - activity contient ce jour (vraie interaction : rituel, bilan, défi, cœur…)
//   - OU la table rituals contient au moins 1 rituel complété ce jour
//
// Le plantSet (health > HEALTH_DEFAULT) a été supprimé : il incluait à tort les
// jours de carry-over où la plante conserve une santé > 5 sans aucune activité
// réelle, créant de faux streaks.
//
// Tolérance matin : si aujourd'hui n'a pas encore d'activité, on part d'hier
// pour ne pas casser le streak avant que l'utilisateur ait eu le temps d'agir.
function calculateStreak(activityDates, ritualDates) {
  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const hasActivityToday = activityDates.has(today) || ritualDates.has(today)
  const startDate = hasActivityToday ? today : yesterday

  let current = new Date(startDate + 'T12:00:00Z') // midi UTC pour éviter les glissements DST
  let streak   = 0

  while (true) {
    const dateStr = current.toISOString().split('T')[0]
    const counts  = activityDates.has(dateStr) || ritualDates.has(dateStr)
    if (!counts) break
    streak++
    current.setUTCDate(current.getUTCDate() - 1)
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
