// src/utils/playChime.js
// Petit arpège de succès (C5→E5→G5), généré à la volée — pas de fichier
// audio. Même technique que useNotificationSound.js (arpège de push).
export function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((freq, i) => {
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
    })
    setTimeout(() => ctx.close(), 900)
  } catch {
    // AudioContext indisponible (navigateur non supporté) — silencieux
  }
}
