// src/hooks/usePlant.js
import { useEffect, useCallback } from 'react'
import { usePlantStore }   from '../store/plant.store'
import { plantService }     from '../services/plant.service'
import { ritualService }    from '../services/ritual.service'
import { useCircle } from '../hooks/useCircle'

export function usePlant(userId) {
  const { activeCircle } = useCircle(userId)
  const {
    todayPlant, history, weekGrid, todayRituals, stats, isLoading, error,
    setTodayPlant, setHistory, setWeekGrid, setTodayRituals, setStats,
    setLoading, setError, optimisticApplyDelta, rollback, addTodayRitual,
  } = usePlantStore()

  useEffect(() => {
    if (!userId) return
    void loadAll()
  }, [userId]) // eslint-disable-line

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [plant, hist, grid, stats_] = await Promise.all([
        plantService.getTodayPlant(userId),
        plantService.getHistory(userId, 7),
        ritualService.getWeekGrid(userId),
        plantService.getStats(userId),
      ])

      const ZONE_KEYS = ['zone_racines', 'zone_tige', 'zone_feuilles', 'zone_fleurs', 'zone_souffle']

      const todayIsDefault = plant?.health === 5
        && ZONE_KEYS.every(k => (plant[k] ?? 5) === 5)

      let resolvedPlant = plant

      if (todayIsDefault) {
        const todayKey = new Date().toISOString().slice(0, 10)
        const { supabase } = await import('../core/supabaseClient')

        const { data: lastPlant } = await supabase
          .from('plants')
          .select('health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
          .eq('user_id', userId)
          .lt('date', todayKey)
          .gt('health', 5)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (lastPlant) {
          const safeHealth = lastPlant.health ?? 5
          const patch = {
            health:        safeHealth,
            updated_at:    new Date().toISOString(),
            ...Object.fromEntries(ZONE_KEYS.map(k => [k, lastPlant[k] ?? safeHealth])),
          }
          resolvedPlant = { ...plant, ...patch }
          if (plant?.id) {
            supabase.from('plants').update(patch).eq('id', plant.id)
              .then(({ error }) => {
                if (error) console.warn('[usePlant] carry-over patch failed:', error.message)
              })
          }
        }
      }

      setTodayPlant(resolvedPlant)
      setHistory(hist)
      setWeekGrid(grid)
      setStats(stats_)

      if (resolvedPlant) {
        const rituals = await ritualService.getTodayRituals(userId, resolvedPlant.id)
        setTodayRituals(rituals)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const completeRitual = useCallback(async (ritualId) => {
    if (!todayPlant) return

    const catalog = (await import('../services/ritual.service')).RITUAL_CATALOG.find(r => r.id === ritualId)
    if (!catalog) return

    const previous = optimisticApplyDelta(catalog.delta, catalog.zone)

    try {
      const { ritual, plant } = await ritualService.complete(userId, todayPlant.id, ritualId, activeCircle?.id)
      setTodayPlant(plant)
      addTodayRitual(ritual)
      ritualService.getWeekGrid(userId).then(setWeekGrid)
      plantService.getStats(userId).then(setStats)
    } catch (err) {
      rollback(previous)
      setError(err.message)
    }
  }, [todayPlant, userId, activeCircle])

  return {
    todayPlant,
    history,
    weekGrid,
    todayRituals,
    stats,
    isLoading,
    error,
    completeRitual,
    reload: loadAll,
  }
}
