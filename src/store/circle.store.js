// src/store/circle.store.js
import { create as createCircle } from 'zustand'
import { devtools as devtoolsCircle } from 'zustand/middleware'

export const useCircleStore = createCircle(
  devtoolsCircle(
    (set) => ({
      circles:         [],       // mes cercles
      activeCircleId:  null,     // cercle actif (vue Cercle du Matin)
      circleMembers:   [],       // membres du cercle actif avec leurs plantes
      isLoading:       false,
      error:           null,

      stats: {
  myCircleCount: 0,
  totalMembers: 0,
},



      setCircles:       (c)  => set({ circles: c },        false, 'circle/setCircles'),
      setActiveCircle:  (id) => set({ activeCircleId: id }, false, 'circle/setActive'),
      setCircleMembers: (m)  => set({ circleMembers: m },  false, 'circle/setMembers'),
      setLoading:       (v)  => set({ isLoading: v },      false, 'circle/setLoading'),
      setError:         (e)  => set({ error: e },          false, 'circle/setError'),
      setStats: (stats) => set({ stats }, false, 'circle/setStats'),
      addCircle: (c) =>
        set(s => ({ circles: [...s.circles, c] }), false, 'circle/add'),

      reset: () => set(
        { circles: [], activeCircleId: null, circleMembers: [], isLoading: false, error: null, stats: { myCircleCount: 0, totalMembers: 0 },
      },
        false, 'circle/reset'
      ),
    }),
    { name: 'CircleStore' }
  )
)