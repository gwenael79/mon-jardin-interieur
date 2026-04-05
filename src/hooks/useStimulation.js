// src/hooks/useStimulation.js
// Appelle la Edge Function 'stimulation' et met le résultat en cache 30min.
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../core/supabaseClient'

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

function cacheKey(userId) {
  return `stimulation_${userId}_${new Date().toISOString().slice(0, 10)}`
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

export function useStimulation({ userId, payload = {}, enabled = true }) {
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const inflightRef = useRef(false)

  useEffect(() => {
    if (!enabled || !userId) return

    const key    = cacheKey(userId)
    const cached = readCache(key)
    if (cached) { setMessage(cached); return }

    if (inflightRef.current) return
    inflightRef.current = true
    setLoading(true)

    supabase.functions.invoke('stimulation', {
      body: { userId, ...payload },
    })
      .then(({ data, error }) => {
        if (!error && data?.message) {
          setMessage(data.message)
          writeCache(key, data.message)
        }
      })
      .catch(() => {})
      .finally(() => { setLoading(false); inflightRef.current = false })
  }, [userId, enabled]) // payload exclu — pas de re-fetch à chaque rendu

  return { message, loading }
}
