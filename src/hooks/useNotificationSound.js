// src/hooks/useNotificationSound.js
// Joue un arpège procédural quand une push arrive en premier plan (via postMessage SW)
import { useEffect, useRef } from 'react'

export function useNotificationSound() {
  const ctxRef = useRef(null)

  // AudioContext initialisé seulement après un geste utilisateur (contrainte navigateur)
  useEffect(() => {
    const init = () => {
      if (ctxRef.current) return
      try {
        ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      } catch (_) {}
    }
    window.addEventListener('click',      init, { once: true })
    window.addEventListener('touchstart', init, { once: true })
    return () => {
      window.removeEventListener('click',      init)
      window.removeEventListener('touchstart', init)
    }
  }, [])

  // Écoute les postMessages du Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = (event) => {
      if (event.data?.type === 'PUSH_RECEIVED') playArpeggio(ctxRef.current)
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [])
}

// Arpège C5→E5→G5 (523→659→784 Hz), ~400ms, sans fichier audio
function playArpeggio(ctx) {
  if (!ctx) return
  const notes = [523.25, 659.25, 783.99]
  notes.forEach((freq, i) => {
    try {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.13
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.15, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
      osc.start(t)
      osc.stop(t + 0.41)
    } catch (_) {}
  })
}
