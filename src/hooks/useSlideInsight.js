// src/hooks/useSlideInsight.js
// Appelle l'Edge Function slide-insight et met le résultat en cache 30min par slide.
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../core/supabaseClient'

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

function cacheKey(userId, slideId) {
  return `slide_insight_${userId}_${slideId}`
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { ts, message } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(key); return null }
    return message
  } catch { return null }
}

function writeCache(key, message) {
  try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), message })) } catch {}
}

export function useSlideInsight({ userId, slideId, payload, enabled = true }) {
  const [message,   setMessage]   = useState(null)
  const [loading,   setLoading]   = useState(false)
  const inflightRef = useRef(false)

  useEffect(() => {
    if (!enabled || !userId || !slideId) return

    const key    = cacheKey(userId, slideId)
    const cached = readCache(key)
    if (cached) { setMessage(cached); return }

    if (inflightRef.current) return
    inflightRef.current = true
    setLoading(true)

    supabase.functions.invoke('slide-insight', {
      body: { userId, slide: slideId, ...payload },
    })
      .then(({ data, error }) => {
        if (!error && data?.message) {
          setMessage(data.message)
          writeCache(key, data.message)
        }
      })
      .catch(() => {})
      .finally(() => { setLoading(false); inflightRef.current = false })
  }, [userId, slideId, enabled]) // payload exclu volontairement — on ne re-fetch pas à chaque rendu

  return { message, loading }
}
