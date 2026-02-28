// src/hooks/useDefi.js
import { useState, useEffect, useCallback } from 'react'
import { defiService } from '../services/defi.service'

export function useDefi(userId) {
  const [defis, setDefis]               = useState([])
  const [myDefis, setMyDefis]           = useState([])
  const [joinedIds, setJoinedIds]       = useState(new Set())
  const [isLoading, setIsLoading]       = useState(true)
  const [error, setError]               = useState(null)
  const [communityStats, setCommunityStats] = useState({
  totalParticipants: 0,
  totalDefis: 0,
  activeGardens: 0,
  completedRituals: 0,
})

  // ── Chargement initial ──────────────────────────────────
  useEffect(() => {
    void loadAll()
  }, [userId]) // eslint-disable-line

  async function loadAll() {
    setIsLoading(true)
    setError(null)
    try {
      const [all, stats] = await Promise.all([
        defiService.getAll(),
        defiService.getCommunityStats(),
      ])
      setCommunityStats(stats)
console.log("COMMUNITY STATS", stats)    

if (userId) {
        const mine = await defiService.getMyDefis(userId)
        const ids = new Set(mine.map(d => d.id))
        const merged = all.map(d => ({
          ...d,
          joined: ids.has(d.id),
          progress: mine.find(m => m.id === d.id)?.progress ?? 0,
        }))
        setDefis(merged)
        setMyDefis(mine)
        setJoinedIds(ids)
      } else {
        setDefis(all)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Rejoindre / quitter ─────────────────────────────────
  const toggleJoin = useCallback(async (defiId) => {
    if (!userId) return
    const isJoined = joinedIds.has(defiId)

    // Optimistic update
    setJoinedIds(prev => {
      const next = new Set(prev)
      isJoined ? next.delete(defiId) : next.add(defiId)
      return next
    })
    setDefis(prev => prev.map(d => d.id === defiId
      ? { ...d, joined: !isJoined, participantCount: d.participantCount + (isJoined ? -1 : 1) }
      : d
    ))

    try {
      if (isJoined) {
        await defiService.leave(userId, defiId)
        setMyDefis(prev => prev.filter(d => d.id !== defiId))
      } else {
        await defiService.join(userId, defiId)
        const mine = await defiService.getMyDefis(userId)
        setMyDefis(mine)
      }
    } catch (err) {
      // Rollback
      setError(err.message)
      await loadAll()
    }
  }, [userId, joinedIds])

  // ── Proposer un défi ────────────────────────────────────
  // userId non requis ici — defiService.propose() lit la session JWT directement
  const proposeDefi = useCallback(async (fields) => {
    await defiService.propose(userId, fields)
    // Le défi proposé est is_active=false donc n'apparaît pas dans la liste avant validation admin
  }, [userId])

  const featured = defis.find(d => d.is_featured) ?? null
 

  return {
    defis,
    featured,
    myDefis,
    joinedIds,
    communityStats,
    isLoading,
    error,
    toggleJoin,
    proposeDefi,
    reload: loadAll,
  }
}
