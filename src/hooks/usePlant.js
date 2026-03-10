// src/hooks/usePlant.js
import { useEffect, useCallback } from 'react'
import { usePlantStore }   from '../store/plant.store'
import { plantService }     from '../services/plant.service'
import { ritualService }    from '../services/ritual.service'
import { useCircle } from '../hooks/useCircle'

/**
 * Hook principal — charge et gère la plante du jour.
 *
 * Règle fondamentale :
 *   - Tout premier jour (aucun historique) → graine à 5% (défaut DB, rien à faire).
 *   - Nouveau jour avec historique → repart du dernier état connu.
 *   - Une ligne qui a déjà reçu un bilan n'est JAMAIS réécrite.
 *
 * Détection d'une ligne vierge :
 *   On ne se fie PAS à updated_at (trigger inopérant sur certains envs).
 *   On compare la ligne du jour avec le dernier historique :
 *     - Si health du jour = 5 (défaut DB) ET un historique existe avec health > 5
 *       → la ligne est vierge, on copie l'historique.
 *     - Si health du jour > 5 → un bilan a déjà été fait, on ne touche à rien.
 *     - Si health du jour = 5 ET aucun historique → premier jour, graine à 5%, rien à faire.
 */
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

      // ── Détection de ligne vierge ─────────────────────────────────────────
      // health = 5 = valeur par défaut DB = ligne jamais touchée par un bilan.
      // Si un bilan a été fait, health est forcément > 5 (les rituels font monter).
      // On ne réécrit QUE si health vaut encore 5 ET qu'un historique existe
      // avec une valeur supérieure à copier.
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
          .gt('health', 5)           // ← seulement un jour où il s'est passé quelque chose
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (lastPlant) {
          // Repart exactement là où la plante en était
          const patch = {
            health: lastPlant.health,
            ...Object.fromEntries(ZONE_KEYS.map(k => [k, lastPlant[k] ?? lastPlant.health])),
          }
          resolvedPlant = { ...plant, ...patch }
          // Persiste en base — non bloquant
          supabase.from('plants').update(patch).eq('id', plant.id)
        }
        // Pas d'historique avec health > 5 = premier jour ou utilisateur
        // qui n'a jamais fait de rituel → on garde la graine à 5%, rien à faire
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
