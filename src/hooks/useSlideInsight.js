// src/hooks/useSlideInsight.js
//
// Hook IA par slide — avec cache sessionStorage (durée : session courante).
// Deux usages :
//   1. useSlideInsight({ userId, slideId, payload, enabled, ready })
//      → retourne { message, loading } pour un slide précis
//      → `ready` permet d'attendre que les données soient chargées avant de fetch
//
//   2. prefetchAllSlideInsights({ userId, slideIds, payload })
//      → déclenche tous les appels en parallèle et remplit le cache
//      → à appeler UNIQUEMENT une fois les stats disponibles (pas au montage à vide)
//
// Format de clé cache : `slide_insight__${VERSION}__${userId}__${slideId}__${today}__${payloadHash}`
// Le hash payload garantit qu'on ne sert pas un cache généré avec un payload vide.

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../core/supabaseClient'

// ─── Helpers cache ────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10)
const CACHE_VERSION = 'v5'  // incrémenté — invalide les anciens caches v4 générés avec payload vide

// Hash léger basé sur les champs clés du payload pour éviter de servir un cache
// généré quand stats n'était pas encore chargé (streak=0, ritualsMonth=0).
function payloadHash(payload = {}) {
  const streak       = payload.streak        ?? 0
  const ritualsMonth = payload.ritualsMonth  ?? 0
  const ritualsDone  = payload.ritualsDone   ?? 0
  const lumens       = payload.lumens        ?? 0
  return `${streak}-${ritualsMonth}-${ritualsDone}-${lumens}`
}

function cacheKey(userId, slideId, payload) {
  return `slide_insight__${CACHE_VERSION}__${userId}__${slideId}__${today()}__${payloadHash(payload)}`
}

function readCache(userId, slideId, payload) {
  try {
    const raw = sessionStorage.getItem(cacheKey(userId, slideId, payload))
    if (!raw) return null
    const { message, ts } = JSON.parse(raw)
    if (ts !== today()) { sessionStorage.removeItem(cacheKey(userId, slideId, payload)); return null }
    return message ?? null
  } catch { return null }
}

function writeCache(userId, slideId, payload, message) {
  try {
    sessionStorage.setItem(
      cacheKey(userId, slideId, payload),
      JSON.stringify({ message, ts: today() })
    )
  } catch { /* sessionStorage plein — on ignore */ }
}

// ─── Appel API central ────────────────────────────────────────────────────────

async function fetchInsight(userId, slideId, payload) {
  const cached = readCache(userId, slideId, payload)
  if (cached) return cached

  const { data, error } = await supabase.functions.invoke('slide-insight', {
    body: { userId, slide: slideId, ...payload },
  })

  if (error || !data?.message) return null

  writeCache(userId, slideId, payload, data.message)
  return data.message
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useSlideInsight({ userId, slideId, payload, enabled = true, ready = true }) {
  const payloadRef = useRef(payload)
  payloadRef.current = payload

  const [message, setMessage] = useState(() => {
    if (!userId || !slideId) return null
    return readCache(userId, slideId, payload)
  })
  const [loading, setLoading] = useState(() => {
    if (!enabled || !ready || !userId || !slideId) return false
    return !readCache(userId, slideId, payload)
  })

  const abortRef = useRef(false)

  useEffect(() => {
    // On attend que `ready` soit true — évite de fetcher avec un payload vide
    if (!enabled || !ready || !userId || !slideId) return

    const cached = readCache(userId, slideId, payloadRef.current)
    if (cached) { setMessage(cached); setLoading(false); return }

    abortRef.current = false
    setLoading(true)

    fetchInsight(userId, slideId, payloadRef.current ?? {})
      .then(msg => {
        if (abortRef.current) return
        setMessage(msg)
      })
      .catch(() => {})
      .finally(() => {
        if (!abortRef.current) setLoading(false)
      })

    return () => { abortRef.current = true }
  }, [userId, slideId, enabled, ready])
  // payload exclu des dépendances mais lu via ref —
  // on re-fetch si ready passe de false à true (données chargées), pas à chaque re-render.

  return { message, loading }
}

// ─── Prefetch — à appeler uniquement quand les stats sont disponibles ──────────
//
// ⚠️  Ne pas appeler au montage du dashboard si les stats ne sont pas encore chargées.
//     Un payload vide génère des insights inutiles qui polluent le cache.
//
// Usage recommandé dans DashboardV2 :
//   useEffect(() => {
//     if (!user?.id || !stats) return   // ← attendre les stats
//     prefetchAllSlideInsights({ userId: user.id, payload: insightPayload })
//   }, [user?.id, !!stats])

export async function prefetchAllSlideInsights({ userId, payload = {} }) {
  if (!userId) return

  const SLIDE_IDS = [
    'bilan', 'jardin', 'champ', 'defis',
    'club', 'ateliers', 'bibliotheque', 'jardinotheque', 'boite_graine',
  ]

  await Promise.allSettled(
    SLIDE_IDS.map(slideId => fetchInsight(userId, slideId, payload))
  )
}
