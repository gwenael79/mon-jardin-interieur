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
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [plants, rituals, activityRows] = await Promise.all([
      query(
        supabase
          .from('plants')
          .select('date, health')
          .eq('user_id', userId)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false }),
        'getStats/plants'
      ),
      query(
        supabase
          .from('rituals')
          .select('zone, completed_at')
          .eq('user_id', userId)
          .gte('completed_at', thirtyDaysAgo.toISOString()),
        'getStats/rituals'
      ),
      query(
        supabase
          .from('activity')
          .select('day')
          .eq('user_id', userId)
          .gte('day', thirtyDaysAgo.toISOString().split('T')[0]),
        'getStats/activity'
      ),
    ])

    // Jours valides depuis activity (vraies interactions)
    const activityDates = new Set(activityRows.map(a => a.day))

    return {
      plants,
      streak:           calculateStreak(plants, activityDates),
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

// Un jour compte dans le streak si :
//   - Il est présent dans activity (vraie interaction : rituel, bilan, défi, cœur, merci)
//
// Règles importantes :
//   - Aujourd'hui ne compte QUE s'il y a une activité réelle (pas juste un carry-over de plante)
//   - Hier compte si : activité réelle OU plants.health > HEALTH_DEFAULT (rituels anciens sans activity)
//   - Le streak tolère un jour de gap si aujourd'hui n'a pas encore d'activité
//     (ex: 9h du matin → pas encore fait le bilan → on ne casse pas le streak)
function calculateStreak(plants, activityDates) {
  if (!plants.length) return 0

  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Jours réels avec activité (source authoritative)
  const activitySet = new Set([...activityDates].filter(Boolean))

  // Jours avec plante développée (fallback pour les anciens rituels sans activity log)
  const plantSet = new Set(plants.filter(p => p.health > HEALTH_DEFAULT).map(p => p.date))

  // Un jour passé compte s'il est dans activity OU dans plants (health > 5)
  // Aujourd'hui compte UNIQUEMENT si activity contient aujourd'hui
  const hasActivityToday = activitySet.has(today)

  // Point de départ : hier si pas encore d'activité aujourd'hui, aujourd'hui sinon
  const startDate = hasActivityToday ? today : yesterday

  let current = new Date(startDate)
  let streak   = 0

  while (true) {
    const dateStr = current.toISOString().split('T')[0]
    const isToday = dateStr === today
    // Aujourd'hui : seulement si activité réelle
    // Autres jours : activité OU plante développée
    const counts = isToday
      ? activitySet.has(dateStr)
      : activitySet.has(dateStr) || plantSet.has(dateStr)

    if (!counts) break
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
