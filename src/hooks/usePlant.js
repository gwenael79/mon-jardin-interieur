// src/hooks/usePlant.js
import { useEffect, useCallback } from 'react'
import { usePlantStore }   from '../store/plant.store'
import { plantService }     from '../services/plant.service'
import { ritualService }    from '../services/ritual.service'
import { useCircle } from '../hooks/useCircle'

/**
 * Hook principal — charge et gère la plante du jour.
 * Expose toutes les actions nécessaires à PlantHero, WeekGrid, HistoryChart.
 */
export function usePlant(userId) {
  const { activeCircle } = useCircle(userId)
  const {
    todayPlant, history, weekGrid, todayRituals, stats, isLoading, error,
    setTodayPlant, setHistory, setWeekGrid, setTodayRituals, setStats,
    setLoading, setError, optimisticApplyDelta, rollback, addTodayRitual,
  } = usePlantStore()

  // ─── Init au montage ──────────────────────────────────────
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
      // ── Reset plante jamais initialisée (valeurs DB par défaut = 50) → 5% ──
      const ZONE_KEYS = ['zone_racines', 'zone_tige', 'zone_feuilles', 'zone_fleurs', 'zone_souffle']
      const isUninitialised = (p) =>
        p && p.health === 50 && ZONE_KEYS.every(k => (p[k] ?? 50) === 50)

      let resolvedPlant = plant
      if (isUninitialised(plant)) {
        const zeros = Object.fromEntries(ZONE_KEYS.map(k => [k, 5]))
        const patch = { health: 5, ...zeros }
        resolvedPlant = { ...plant, ...patch }
        // Persiste en DB (fire & forget)
        import('../core/supabaseClient').then(({ supabase }) =>
          supabase.from('plants').update(patch).eq('id', plant.id)
        )
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

  // ─── Compléter un rituel (avec optimistic update) ─────────
  const completeRitual = useCallback(async (ritualId) => {
    if (!todayPlant) return

    const catalog = (await import('../services/ritual.service')).RITUAL_CATALOG.find(r => r.id === ritualId)
    if (!catalog) return

    const previous = optimisticApplyDelta(catalog.delta, catalog.zone)

    try {
      const { ritual, plant } = await ritualService.complete(userId, todayPlant.id, ritualId, activeCircle?.id )
      setTodayPlant(plant)
      addTodayRitual(ritual)
      // Rafraîchit la grille et les stats en arrière-plan (non bloquant)
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