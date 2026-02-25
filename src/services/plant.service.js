// src/services/plant.service.js
import { supabase, query } from '../core/supabaseClient'

const HEALTH_MIN = 0
const HEALTH_MAX = 100
const HEALTH_DEFAULT = 50

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

    return query(
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
        .select()
        .single(),
      'createTodayPlant'
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

    const plants = await query(
      supabase
        .from('plants')
        .select('date, health')
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false }),
      'getStats/plants'
    )

    const rituals = await query(
      supabase
        .from('rituals')
        .select('zone, completed_at')
        .eq('user_id', userId)
        .gte('completed_at', thirtyDaysAgo.toISOString()),
      'getStats/rituals'
    )

    return {
      plants,
      streak:           calculateStreak(plants),
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

function calculateStreak(plants) {
  if (!plants.length) return 0
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  const dates = new Set(plants.map(p => p.date))
  let current = new Date(today)

  while (true) {
    const dateStr = current.toISOString().split('T')[0]
    if (!dates.has(dateStr)) break
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