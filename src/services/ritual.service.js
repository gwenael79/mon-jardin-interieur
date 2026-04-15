// src/services/ritual.service.js
import { supabase, query } from '../core/supabaseClient'
import { plantService } from './plant.service'

// Catalogue des rituels disponibles (statique pour l'instant)
export const RITUAL_CATALOG = [
  { id: 'r_breath',    name: 'Respiration consciente', zone: 'Souffle',  delta: +8,  emoji: '🌬️', duration: '5 min'  },
  { id: 'r_body',      name: 'Bouger mon corps',       zone: 'Tige',     delta: +10, emoji: '🌿', duration: '10 min' },
  { id: 'r_centering', name: '5 min de centrage',      zone: 'Racines',  delta: +5,  emoji: '🌱', duration: '5 min'  },
  { id: 'r_gratitude', name: 'Gratitude du jour',      zone: 'Feuilles', delta: +7,  emoji: '🍃', duration: '3 min'  },
  { id: 'r_flower',    name: 'Moment de beauté',       zone: 'Fleurs',   delta: +6,  emoji: '🌸', duration: '5 min'  },
  { id: 'r_neglect',   name: 'Journée difficile',      zone: null,       delta: -8,  emoji: '😔', duration: null     },
]

export const ritualService = {
  // ─── COMPLÉTER UN RITUEL ──────────────────────────────────
  /**
   * Marque un rituel comme complété :
   * 1. Insère dans rituals
   * 2. Met à jour la plante du jour (health + zone)
   * Retourne { ritual, plant } pour mise à jour optimiste.
   */
  async complete(userId, plantId, ritualId, circleId){
    const catalog = RITUAL_CATALOG.find(r => r.id === ritualId)
    if (!catalog) throw new Error(`Rituel inconnu : ${ritualId}`)

    // Vérifie que ce rituel n'a pas déjà été complété aujourd'hui
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const alreadyDone = await query(
      supabase
        .from('rituals')
        .select('id')
        .eq('user_id', userId)
        .eq('plant_id', plantId)
        .eq('name', catalog.name)
        .gte('completed_at', today.toISOString())
        .maybeSingle(),
      'checkDuplicate'
    )

    if (alreadyDone) {
      throw new Error('Ce rituel a déjà été complété aujourd\'hui.')
    }

    // Insère le rituel
    const ritual = await query(
      supabase
        .from('rituals')
        .insert({
          user_id:      userId,
          plant_id:     plantId,
          name:         catalog.name,
          zone:         catalog.zone ?? 'Racines',
          health_delta: catalog.delta,
        })
        .select()
        .single(),
      'completeRitual/insert'
    )

    // Met à jour la plante — delta fixe 0.5% sur la zone du rituel
    const plant = await plantService.applyRitualEffect(plantId, 0.5, catalog.zone)
// ─── LOG ACTIVITÉ (toujours, cercle optionnel) ───────────────────────────
try {
  await supabase
    .from('activity')
    .insert({
      user_id:   userId,
      action:    'a complété',
      ritual:    catalog.name,
      zone:      catalog.zone ?? 'Racines',
      ...(circleId ? { circle_id: circleId } : {}),
    })
} catch (err) {
  console.error('Erreur log activité:', err)
}
    return { ritual, plant }
  },

  // ─── RITUELS DU JOUR ──────────────────────────────────────
  async getTodayRituals(userId, plantId) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return query(
      supabase
        .from('rituals')
        .select('*')
        .eq('user_id', userId)
        .eq('plant_id', plantId)
        .gte('completed_at', today.toISOString())
        .order('completed_at', { ascending: false }),
      'getTodayRituals'
    )
  },

  // ─── GRILLE HEBDOMADAIRE ──────────────────────────────────
  /**
   * Retourne pour chaque jour de la semaine le nombre de rituels complétés.
   * Utilisé pour la WeekGrid.
   */
  async getWeekGrid(userId) {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 6)
    weekAgo.setHours(0, 0, 0, 0)

    const rituals = await query(
      supabase
        .from('rituals')
        .select('completed_at')
        .eq('user_id', userId)
        .gte('completed_at', weekAgo.toISOString()),
      'getWeekGrid'
    )

    // Groupe par jour
    const dayMap = {}
    for (const r of rituals) {
      const day = r.completed_at.split('T')[0]
      dayMap[day] = (dayMap[day] || 0) + 1
    }

    // Génère les 7 derniers jours
    const days = []
    const DAY_LABELS = ['D','L','M','M','J','V','S']
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr  = d.toISOString().split('T')[0]
      const count    = dayMap[dateStr] || 0
      const isToday  = i === 0
      days.push({
        date:    dateStr,
        label:   DAY_LABELS[d.getDay()],
        count,
        status:  count >= 4 ? 'full' : count >= 2 ? 'partial' : 'empty',
        isToday,
      })
    }

    return days
  },
}
