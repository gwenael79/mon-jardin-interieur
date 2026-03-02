// src/hooks/useCircle.js
import { useEffect, useCallback } from 'react'
import { useCircleStore }  from '../store/circle.store'
import { circleService }   from '../services/circle.service'

export function useCircle(userId) {
  const {
    circles, activeCircleId, circleMembers, isLoading, error,
    stats, setStats,
    setCircles, setActiveCircle, setCircleMembers,
    setLoading, setError, addCircle,
  } = useCircleStore()

  useEffect(() => {
    if (!userId) return
    void loadCircles()
  }, [userId]) // eslint-disable-line

  async function loadCircles() {
  setLoading(true)
  try {
    const [data, globalStats] = await Promise.all([
      circleService.getMyCircles(userId),
      circleService.getGlobalStats(userId),
    ])

    setCircles(data)
    setStats(globalStats)

    if (data.length && !activeCircleId) {
      const first = data[0]
      setActiveCircle(first.id)
      loadMembers(first.id)
    }

  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

  const loadMembers = useCallback(async (circleId) => {
    try {
      const members = await circleService.getCircleMembersWithPlants(circleId)
      setCircleMembers(members)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const selectCircle = useCallback((circleId) => {
    setActiveCircle(circleId)
    loadMembers(circleId)
  }, [loadMembers])

  const createCircle = useCallback(async (name, theme, isOpen) => {
    const circle = await circleService.create(userId, { name, theme, isOpen })
    addCircle({ ...circle, myRole: 'admin', isAdmin: true, memberCount: 1 })
    return circle
  }, [userId])

  const joinByCode = useCallback(async (code) => {
    const circle = await circleService.joinByCode(userId, code)
    await loadCircles() // rafraîchit la liste complète
    return circle
  }, [userId])

  const activeCircle = circles.find(c => c.id === activeCircleId) ?? null

  return {
    circles, activeCircle, circleMembers,
    isLoading, error, stats,
    selectCircle, createCircle, joinByCode, loadCircles,
  }
}
