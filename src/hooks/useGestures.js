// src/hooks/useGestures.js
import { useState, useEffect, useCallback } from 'react'
import { gestureService } from '../services/privacy-gesture-journal.service'

export function useGestures(userId) {
  const [received, setReceived] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) return
    loadReceived()
  }, [userId]) // eslint-disable-line

  async function loadReceived() {
    setIsLoading(true)
    try {
      const data = await gestureService.getReceived(userId)
      setReceived(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const send = useCallback(async (toUserId, circleId, type) => {
    try {
      await gestureService.send(userId, toUserId, circleId, type)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [userId])

  return { received, isLoading, error, send }
}