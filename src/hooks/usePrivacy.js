// src/hooks/usePrivacy.js
import { useEffect, useCallback } from 'react'
import { usePrivacyStore } from '../store/privacy.store'
import { privacyService }   from '../services/privacy-gesture-journal.service'

export function usePrivacy(userId) {
  const { settings, isLoading, setSettings, setLoading, optimisticToggle, rollbackField } = usePrivacyStore()

  useEffect(() => {
    if (!userId || settings) return
    loadSettings()
  }, [userId]) // eslint-disable-line

  async function loadSettings() {
    setLoading(true)
    try {
      const data = await privacyService.getSettings(userId)
      setSettings(data)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Toggle optimiste : feedback immédiat, rollback si erreur.
   */
  const toggle = useCallback(async (field) => {
    const previousValue = settings?.[field]
    optimisticToggle(field)
    try {
      await privacyService.updateSetting(userId, field, !previousValue)
    } catch {
      rollbackField(field, previousValue)
    }
  }, [userId, settings])

  return { settings, isLoading, toggle }
}
