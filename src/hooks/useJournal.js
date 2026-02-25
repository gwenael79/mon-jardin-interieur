// src/hooks/useJournal.js
import { useState, useEffect, useCallback } from 'react'
import { journalService } from '../services/privacy-gesture-journal.service'

export function useJournal(userId) {
  const [entries, setEntries]     = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => {
    if (!userId) return
    loadEntries()
  }, [userId]) // eslint-disable-line

  async function loadEntries() {
    setIsLoading(true)
    try {
      const data = await journalService.getEntries(userId)
      setEntries(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const create = useCallback(async (plantId, content, zoneTags) => {
    const entry = await journalService.create(userId, plantId, content, zoneTags)
    setEntries(prev => [entry, ...prev])
    return entry
  }, [userId])

  const remove = useCallback(async (entryId) => {
    await journalService.delete(entryId)
    setEntries(prev => prev.filter(e => e.id !== entryId))
  }, [])

  return { entries, isLoading, error, create, remove }
}