// src/hooks/useSlideInsight.js
//
// Hook IA par slide — avec cache sessionStorage (durée : session courante).
// Deux usages :
//   1. useSlideInsight({ userId, slideId, payload, enabled })
//      → retourne { message, loading } pour un slide précis
//
//   2. prefetchAllSlideInsights({ userId, slideIds, payload })
//      → déclenche tous les appels en parallèle et remplit le cache
//      → à appeler une seule fois au montage du dashboard
//
// Format de clé cache : `slide_insight__${userId}__${slideId}__${today}`
// Le suffixe date garantit qu'on régénère chaque jour.

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../core/supabaseClient'

// ─── Helpers cache ────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10)

function cacheKey(userId, slideId) {
  return `slide_insight__${userId}__${slideId}__${today()}`
}

function readCache(userId, slideId) {
  try {
    const raw = sessionStorage.getItem(cacheKey(userId, slideId))
    if (!raw) return null
    const { message, ts } = JSON.parse(raw)
    // Invalidation au changement de jour (ts = date ISO)
    if (ts !== today()) { sessionStorage.removeItem(cacheKey(userId, slideId)); return null }
    return message ?? null
  } catch { return null }
}

function writeCache(userId, slideId, message) {
  try {
    sessionStorage.setItem(cacheKey(userId, slideId), JSON.stringify({ message, ts: today() }))
  } catch { /* sessionStorage plein — on ignore */ }
}

// ─── Appel API central ────────────────────────────────────────────────────────

async function fetchInsight(userId, slideId, payload) {
  const cached = readCache(userId, slideId)
  if (cached) return cached

  const { data, error } = await supabase.functions.invoke('slide-insight', {
    body: { userId, slide: slideId, ...payload },
  })

  if (error || !data?.message) return null

  writeCache(userId, slideId, data.message)
  return data.message
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useSlideInsight({ userId, slideId, payload, enabled = true }) {
  const [message, setMessage] = useState(() => {
    // Initialisation synchrone depuis le cache — évite tout flash de loading
    if (!userId || !slideId) return null
    return readCache(userId, slideId)
  })
  const [loading, setLoading] = useState(() => {
    if (!enabled || !userId || !slideId) return false
    return !readCache(userId, slideId)   // loading seulement si pas en cache
  })

  const abortRef = useRef(false)

  useEffect(() => {
    if (!enabled || !userId || !slideId) return

    // Déjà en cache → rien à faire
    const cached = readCache(userId, slideId)
    if (cached) { setMessage(cached); setLoading(false); return }

    abortRef.current = false
    setLoading(true)

    fetchInsight(userId, slideId, payload ?? {})
      .then(msg => {
        if (abortRef.current) return
        setMessage(msg)
      })
      .catch(() => {})
      .finally(() => {
        if (!abortRef.current) setLoading(false)
      })

    return () => { abortRef.current = true }
  }, [userId, slideId, enabled])
  // Note : payload volontairement exclu des dépendances —
  // on ne re-fetch pas si les stats changent légèrement en cours de session.

  return { message, loading }
}

// ─── Prefetch — à appeler au montage du dashboard ─────────────────────────────
//
// Usage dans DashboardV2 :
//   useEffect(() => {
//     if (!user?.id || !screenProps) return
//     prefetchAllSlideInsights({ userId: user.id, payload: insightPayload })
//   }, [user?.id])

export async function prefetchAllSlideInsights({ userId, payload = {} }) {
  if (!userId) return

  const SLIDE_IDS = [
    'bilan', 'jardin', 'champ', 'defis',
    'club', 'ateliers', 'bibliotheque', 'jardinotheque',
  ]

  // On lance tous les appels en parallèle, sans attendre
  // Les résultats se stockent en cache — les hooks les liront au montage
  await Promise.allSettled(
    SLIDE_IDS.map(slideId => fetchInsight(userId, slideId, payload))
  )
}
