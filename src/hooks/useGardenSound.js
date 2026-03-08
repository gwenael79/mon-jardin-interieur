// hooks/useGardenSound.js
// Génère les sons en temps réel via Web Audio API — aucun fichier mp3 requis

import { useRef, useCallback } from 'react'

export function useGardenSound() {
  const ctxRef = useRef(null)

  function getCtx() {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return ctxRef.current
  }

  const playChime = useCallback(() => {
    const ctx = getCtx()
    ;[523.25, 659.25].forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.3)
      gain.gain.setValueAtTime(0,    ctx.currentTime + i * 0.3)
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.3 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 1.4)
      osc.start(ctx.currentTime + i * 0.3)
      osc.stop(ctx.currentTime  + i * 0.3 + 1.4)
    })
  }, [])

  const playPulse = useCallback(() => {
    const ctx  = getCtx()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 330
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0)
    osc.start()
    osc.stop(ctx.currentTime + 1.0)
  }, [])

  const playDrop = useCallback(() => {
    const ctx  = getCtx()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  }, [])

  return { playChime, playPulse, playDrop }
}
