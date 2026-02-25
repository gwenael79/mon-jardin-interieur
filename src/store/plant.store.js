// src/store/plant.store.js
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const usePlantStore = create(
  devtools(
    (set, get) => ({
      todayPlant:  null,
      history:     [],     // 7 derniers jours
      weekGrid:    [],     // grille rituelle hebdomadaire
      todayRituals:[],     // rituels complétés aujourd'hui
      stats:       null,   // streak, ritualsThisMonth, favoriteZone
      isLoading:   false,
      error:       null,

      setTodayPlant:   (p)  => set({ todayPlant: p },   false, 'plant/setTodayPlant'),
      setHistory:      (h)  => set({ history: h },       false, 'plant/setHistory'),
      setWeekGrid:     (wg) => set({ weekGrid: wg },     false, 'plant/setWeekGrid'),
      setTodayRituals: (r)  => set({ todayRituals: r }, false, 'plant/setTodayRituals'),
      setStats:        (s)  => set({ stats: s },         false, 'plant/setStats'),
      setLoading:      (v)  => set({ isLoading: v },     false, 'plant/setLoading'),
      setError:        (e)  => set({ error: e },         false, 'plant/setError'),

      /**
       * Optimistic update : modifie la plante localement avant la réponse API.
       * Retourne l'état précédent pour rollback éventuel.
       */
      optimisticApplyDelta: (delta, zone) => {
        const { todayPlant } = get()
        if (!todayPlant) return null

        const previous = { ...todayPlant }
        const zoneKey = zone ? `zone_${zone.toLowerCase()}` : null
        const updated = {
          ...todayPlant,
          health: Math.min(100, Math.max(0, todayPlant.health + delta)),
          ...(zoneKey && { [zoneKey]: Math.min(100, Math.max(0, (todayPlant[zoneKey] ?? 50) + delta)) }),
        }
        set({ todayPlant: updated }, false, 'plant/optimisticDelta')
        return previous
      },

      rollback: (previous) =>
        set({ todayPlant: previous }, false, 'plant/rollback'),

      addTodayRitual: (ritual) =>
        set(s => ({ todayRituals: [ritual, ...s.todayRituals] }), false, 'plant/addRitual'),

      reset: () => set(
        { todayPlant: null, history: [], weekGrid: [], todayRituals: [], stats: null, isLoading: false, error: null },
        false, 'plant/reset'
      ),
    }),
    { name: 'PlantStore' }
  )
)
