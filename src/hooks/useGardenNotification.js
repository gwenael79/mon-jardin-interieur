// hooks/useGardenNotification.js
// Orchestre toute la séquence : son → plante → bannière → badge → onglet

import { useEffect, useCallback, useRef } from 'react'
import { useGardenSound } from './useGardenSound'

// ── Constantes ────────────────────────────────────────────────────────────────

export const PLANT_STATES = [
  {
    emoji:    '🌱',
    label:    'Épanouie',
    vitality: 100,
    message:  null,               // pas de notification si actif aujourd'hui
    sound:    null,
  },
  {
    emoji:    '🌿',
    label:    'Douce',
    vitality: 65,
    message: {
      icon:  '🌿',
      title: 'Votre jardin vous attend',
      body:  'Un rituel doux est prêt pour vous aujourd\'hui.',
      type:  'gentle',
    },
    sound: 'chime',
  },
  {
    emoji:    '🍂',
    label:    'Fragile',
    vitality: 30,
    message: {
      icon:  '🍂',
      title: 'Votre plante a besoin de vous',
      body:  'Cela fait 3 jours… quelques minutes suffisent.',
      type:  'alert',
    },
    sound: 'pulse',
  },
  {
    emoji:    '🥀',
    label:    'En attente',
    vitality: 8,
    message: {
      icon:  '🥀',
      title: 'Votre jardin vous attend depuis longtemps',
      body:  'Revenez cultiver votre équilibre. 🌱',
      type:  'alert',
    },
    sound: 'pulse',
  },
]

// ── Utilitaires onglet ────────────────────────────────────────────────────────

const originalTitle = document.title

export function flashTabTitle(message, durationMs = 10000) {
  let toggle       = false
  const interval   = setInterval(() => {
    document.title = toggle ? message : originalTitle
    toggle         = !toggle
  }, 1500)
  setTimeout(() => {
    clearInterval(interval)
    document.title = originalTitle
  }, durationMs)
  return interval
}

export function resetTabTitle() {
  document.title = originalTitle
}

// ── Calcul de l'état plante selon les jours d'absence ────────────────────────

export function getPlantStateIndex(daysSince) {
  if (daysSince === 0) return 0
  if (daysSince === 1) return 1
  if (daysSince <= 6)  return 2
  return 3
}

// ── Hook principal ────────────────────────────────────────────────────────────

/**
 * useGardenNotification
 *
 * @param {object} options
 * @param {number}   options.daysSince    - jours depuis la dernière visite (depuis useLastVisit)
 * @param {function} options.onShowBanner - (message) => void  — affiche votre composant bannière
 * @param {function} options.onSetBadge   - (show: bool) => void
 * @param {function} options.onSetPlant   - (stateIndex: number) => void
 */
export function useGardenNotification({ daysSince, onShowBanner, onSetBadge, onSetPlant }) {
  const { playChime, playPulse } = useGardenSound()
  const hasRun = useRef(false)

  const runSequence = useCallback((days) => {
    const idx   = getPlantStateIndex(days)
    const state = PLANT_STATES[idx]

    // Étape 1 — Son (immédiat)
    if (state.sound === 'chime') playChime()
    if (state.sound === 'pulse') playPulse()

    // Étape 2 — Plante animée (0.6s)
    setTimeout(() => {
      onSetPlant?.(idx)
    }, 600)

    // Étape 3 — Bannière (1.2s)
    if (state.message) {
      setTimeout(() => {
        onShowBanner?.(state.message)
      }, 1200)
    }

    // Étape 4 — Badge (2s)
    if (idx >= 2) {
      setTimeout(() => {
        onSetBadge?.(true)
      }, 2000)
    }

    // Étape 5 — Titre onglet (3s)
    if (idx >= 1) {
      setTimeout(() => {
        flashTabTitle(state.message?.title
          ? `${state.emoji} ${state.message.title}`
          : `${state.emoji} Votre jardin vous attend`)
      }, 3000)
    }
  }, [playChime, playPulse, onShowBanner, onSetBadge, onSetPlant])

  // Déclenche automatiquement au montage (une seule fois)
  useEffect(() => {
    if (hasRun.current || daysSince === undefined) return
    hasRun.current = true
    runSequence(daysSince)
  }, [daysSince, runSequence])

  return { runSequence, getPlantStateIndex }
}
