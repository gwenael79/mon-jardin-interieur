// src/store/privacy.store.js
import { create as createPrivacy } from 'zustand'
import { devtools as devtoolsPrivacy } from 'zustand/middleware'

export const usePrivacyStore = createPrivacy(
  devtoolsPrivacy(
    (set) => ({
      settings:  null,
      isLoading: false,

      setSettings: (s) => set({ settings: s }, false, 'privacy/setSettings'),
      setLoading:  (v) => set({ isLoading: v }, false, 'privacy/setLoading'),

      /**
       * Optimistic toggle : mis à jour local immédiat.
       */
      optimisticToggle: (field) =>
        set(s => ({
          settings: s.settings ? { ...s.settings, [field]: !s.settings[field] } : s.settings
        }), false, 'privacy/optimisticToggle'),

      rollbackField: (field, previous) =>
        set(s => ({
          settings: s.settings ? { ...s.settings, [field]: previous } : s.settings
        }), false, 'privacy/rollbackField'),

      reset: () => set({ settings: null, isLoading: false }, false, 'privacy/reset'),
    }),
    { name: 'PrivacyStore' }
  )
)
