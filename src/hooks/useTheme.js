// src/hooks/useTheme.js
import { useEffect } from 'react'
import { supabase } from '../core/supabaseClient'

const CACHE_KEY = 'mji_theme_vars'
const CACHE_TTL = 10 * 60 * 1000

// ─────────────────────────────────────────────────────────────────────────────
//  CSS_VARS — liste exhaustive de toutes les variables du thème
//
//  Pattern RGB : pour chaque couleur utilisée avec des opacités variables
//  dans le code, on expose --XXX (couleur hex) ET --XXX-rgb (composantes R,G,B).
//  Usage dans les composants : rgba(var(--green-rgb), 0.15)
// ─────────────────────────────────────────────────────────────────────────────
export const CSS_VARS = [
  // ── Fonds structuraux ──────────────────────────────────────────────────────
  '--bg', '--bg2', '--bg3', '--card',
  '--sidebar-bg', '--topbar-bg',
  '--nav-item-active-bg', '--nav-item-active-color', '--nav-item-hover-bg', '--nav-item-hover-color',
  '--nav-fs-logo', '--nav-fs-section', '--nav-fs-item', '--nav-fs-icon', '--nav-fs-badge',

  // ── Surfaces superposées ───────────────────────────────────────────────────
  '--surface-1', '--surface-2', '--surface-3', '--surface-hover',

  // ── Overlays & modals ──────────────────────────────────────────────────────
  '--overlay', '--overlay-dark', '--modal-bg', '--modal-surface',

  // ── Séparateurs & tracks ───────────────────────────────────────────────────
  '--separator', '--track',

  // ── Textes ─────────────────────────────────────────────────────────────────
  '--text', '--text2', '--text3', '--cream',

  // ── Accent principal — couleur + composantes RGB ───────────────────────────
  '--green', '--green-rgb',       // ex: '#96d485' et '150,212,133'
  '--green2', '--green3', '--greenT',

  // ── Accent doré — couleur + composantes RGB ────────────────────────────────
  '--gold', '--gold-rgb',         // ex: '#e8d4a8' et '232,212,168'
  '--gold-warm', '--gold-warm-rgb',

  // ── Danger — couleur + composantes RGB ────────────────────────────────────
  '--red', '--red-rgb',
  '--red2', '--redT',

  // ── Lumens (violet système) — couleur + composantes RGB ────────────────────
  '--lumens', '--lumens-rgb',     // ex: '#b4a0f0' et '180,160,240'

  // ── Texte sur fond sombre (modals rituels) — couleur + composantes RGB ─────
  '--text-on-dark', '--text-on-dark-rgb',  // ex: '#EEF0E8' et '242,237,224'

  // ── Bordures ───────────────────────────────────────────────────────────────
  '--border', '--border2',

  // ── Zones rituels ──────────────────────────────────────────────────────────
  '--zone-roots', '--zone-stem', '--zone-leaves',
  '--zone-flowers', '--zone-breath',
  // Textes des cards de zone
  '--zone-card-text',
  '--zone-card-text-sub',
  // Modal de rituel (RitualZoneModal + ExerciseDetail)
  '--ritual-modal-bg-start',
  '--ritual-modal-bg-end',
  '--ritual-modal-text',
  '--ritual-modal-text-rgb',
  '--ritual-item-bg',
  '--ritual-item-border',
  '--ritual-bar-bg',
  // Modal quiz bilan (DailyQuizModal)
  '--quiz-modal-bg',
  '--quiz-modal-text',
  '--quiz-modal-text-rgb',

  // ── Ombres ─────────────────────────────────────────────────────────────────
  '--shadow-sm', '--shadow',

  // ── Typographie ────────────────────────────────────────────────────────────
  '--font-body', '--font-serif',
  '--fs-h1', '--fs-h2', '--fs-h3', '--fs-h4', '--fs-h5',
  '--fs-emoji-sm', '--fs-emoji-md', '--fs-emoji-lg',

  // ── Global ─────────────────────────────────────────────────────────────────
  '--radius',

  // ── Variables RGB des zones rituels (pour rgba() dynamique) ────────────────
  '--zone-roots-rgb', '--zone-stem-rgb', '--zone-leaves-rgb',
  '--zone-flowers-rgb', '--zone-breath-rgb',

  // ── Badges niveaux ──────────────────────────────────────────────────────────
  '--badge-lvl1', '--badge-lvl1-rgb',   // vert clair  #C8F0B8
  '--badge-lvl2', '--badge-lvl2-rgb',   // bleu clair  #82C8F0
  '--badge-lvl3', '--badge-lvl3-rgb',   // or          #F6C453
]

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convertit #rrggbb en '255,255,255' (format composantes RGB pour rgba()) */
function hexToRgb(hex) {
  if (!hex?.startsWith('#') || hex.length !== 7) return null
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ].join(',')
}

/** Dérive les variantes alpha d'une couleur hex vers des vars rgba */
function deriveAlphas(hex, prefix) {
  if (!hex?.startsWith('#') || hex.length !== 7) return {}
  const rgb = hexToRgb(hex)
  return {
    [`${prefix}2`]: `rgba(${rgb},0.22)`,
    [`${prefix}3`]: `rgba(${rgb},0.11)`,
    [`${prefix}T`]: `rgba(${rgb},0.48)`,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  applyTheme — applique un objet settings sur :root
// ─────────────────────────────────────────────────────────────────────────────
export function applyTheme(settings) {
  const root = document.documentElement

  // 1. Appliquer toutes les vars connues
  CSS_VARS.forEach(v => {
    if (settings[v] !== undefined && settings[v] !== null && settings[v] !== '')
      root.style.setProperty(v, settings[v])
  })

  // 3. Appliquer les valeurs par défaut des badges si absentes
  Object.entries(BADGE_DEFAULTS).forEach(([k, v]) => {
    if (!settings[k]) {
      root.style.setProperty(k, v)
      const rgb = hexToRgb(v)
      if (rgb) root.style.setProperty(k + '-rgb', rgb)
    }
  })

  // 3b. Appliquer les valeurs par défaut des tailles si absentes
  Object.entries(FS_DEFAULTS).forEach(([k, v]) => {
    if (!settings[k]) root.style.setProperty(k, v)
  })

  // 4. Appliquer les polices si définies (injecter <style> override)
  if (settings['--font-body']) {
    let s = document.getElementById('mji-font-body-override')
    if (!s) { s = document.createElement('style'); s.id = 'mji-font-body-override'; document.head.appendChild(s) }
    s.textContent = `body, button, input, select, textarea { font-family: ${settings['--font-body']} !important; }`
  }
  if (settings['--font-serif']) {
    let s = document.getElementById('mji-font-serif-override')
    if (!s) { s = document.createElement('style'); s.id = 'mji-font-serif-override'; document.head.appendChild(s) }
    s.textContent = `.adm-logo, .adm-stat-val { font-family: ${settings['--font-serif']} !important; }`
  }

  // 2. Dériver les composantes RGB automatiquement si la var hex est présente
  //    et que la var RGB n'est pas déjà fournie explicitement
  const rgbPairs = [
    ['--green',          '--green-rgb'],
    ['--gold',           '--gold-rgb'],
    ['--gold-warm',      '--gold-warm-rgb'],
    ['--red',            '--red-rgb'],
    ['--lumens',         '--lumens-rgb'],
    ['--text-on-dark',   '--text-on-dark-rgb'],
    // Modal rituel
    ['--ritual-modal-text', '--ritual-modal-text-rgb'],
    ['--quiz-modal-text',   '--quiz-modal-text-rgb'],
    // Zones rituels
    ['--zone-roots',     '--zone-roots-rgb'],
    ['--zone-stem',      '--zone-stem-rgb'],
    ['--zone-leaves',    '--zone-leaves-rgb'],
    ['--zone-flowers',   '--zone-flowers-rgb'],
    ['--zone-breath',    '--zone-breath-rgb'],
    // Badges niveaux
    ['--badge-lvl1',     '--badge-lvl1-rgb'],
    ['--badge-lvl2',     '--badge-lvl2-rgb'],
    ['--badge-lvl3',     '--badge-lvl3-rgb'],
  ]
  const forceRederive = ['--ritual-modal-text-rgb', '--quiz-modal-text-rgb']
  rgbPairs.forEach(([hexVar, rgbVar]) => {
    const shouldDerive = settings[hexVar]?.startsWith('#') && (!settings[rgbVar] || forceRederive.includes(rgbVar))
    if (shouldDerive) {
      const rgb = hexToRgb(settings[hexVar])
      if (rgb) root.style.setProperty(rgbVar, rgb)
    }
  })

  // 3. Dériver --green2/3/T et --red2/T si absents
  if (settings['--green']?.startsWith('#')) {
    const d = deriveAlphas(settings['--green'], '--green')
    Object.entries(d).forEach(([k, v]) => { if (!settings[k]) root.style.setProperty(k, v) })
  }
  if (settings['--red']?.startsWith('#')) {
    const d = deriveAlphas(settings['--red'], '--red')
    Object.entries(d).forEach(([k, v]) => { if (!settings[k]) root.style.setProperty(k, v) })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  useTheme — hook principal, cache localStorage + fetch Supabase
// ─────────────────────────────────────────────────────────────────────────────
// Valeurs par défaut des badges (si non définies en base)
const BADGE_DEFAULTS = {
  '--badge-lvl1': '#C8F0B8',
  '--badge-lvl2': '#82C8F0',
  '--badge-lvl3': '#F6C453',
}

// Valeurs par défaut (si non définies en base)
const FS_DEFAULTS = {
  // Tailles typographie
  '--fs-h1':       '32px',
  '--fs-h2':       '24px',
  '--fs-h3':       '18px',
  '--fs-h4':       '14px',
  '--fs-h5':       '11px',
  '--fs-emoji-sm': '14px',
  '--fs-emoji-md': '20px',
  '--fs-emoji-lg': '28px',
  // Layout
  '--sidebar-bg':  'rgba(0,0,0,0.18)',
  '--topbar-bg':   'rgba(0,0,0,0.08)',
  // Navigation tailles
  '--nav-fs-logo':     '18px',
  '--nav-fs-section':  '10px',
  '--nav-fs-item':     '13px',
  '--nav-fs-icon':     '15px',
  '--nav-fs-badge':    '9px',
  // Navigation couleurs
  '--nav-item-active-bg':     'rgba(150,212,133,0.11)',
  '--nav-item-active-color':  '#96d485',
  '--nav-item-hover-bg':      'rgba(255,255,255,0.05)',
  '--nav-item-hover-color':   'rgba(242,237,224,0.85)',
  // Cards de zone
  '--zone-card-bg':           'var(--bg3)',
  '--zone-card-text':         'var(--text)',
  '--zone-card-text-sub':     'var(--text3)',
  // Modal rituel
  '--ritual-modal-bg-start':  '#06100A',
  '--ritual-modal-bg-end':    '#030808',
  '--ritual-modal-text':      '#EEF0E8',
  '--ritual-modal-text-rgb':  '238,240,232',
  '--ritual-item-bg':         'rgba(255,255,255,0.04)',
  '--ritual-item-border':     'rgba(255,255,255,0.08)',
  '--ritual-bar-bg':          'rgba(255,255,255,0.08)',
  // Modal quiz
  '--quiz-modal-bg':          'rgba(6,14,7,0.96)',
  '--quiz-modal-text':        '#EEF0E8',
  '--quiz-modal-text-rgb':    '238,240,232',
}

export function useTheme() {
  useEffect(() => {
    let cacheIsFresh = false
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const { vars, ts } = JSON.parse(raw)
        if (vars) {
          applyTheme(vars)
          cacheIsFresh = ts && (Date.now() - ts < CACHE_TTL)
        }
      }
    } catch {}

    if (cacheIsFresh) return

    supabase.from('app_settings').select('key,value')
      .then(({ data }) => {
        if (!data?.length) return
        const map = Object.fromEntries(data.map(r => [r.key, r.value]))
        applyTheme(map)
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ vars: map, ts: Date.now() }))
        } catch {}
      })
  }, [])
}
