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
  rgbPairs.forEach(([hexVar, rgbVar]) => {
    if (settings[hexVar]?.startsWith('#') && !settings[rgbVar]) {
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

// Valeurs par défaut des tailles (si non définies en base)
const FS_DEFAULTS = {
  '--fs-h1':       '32px',
  '--fs-h2':       '24px',
  '--fs-h3':       '18px',
  '--fs-h4':       '14px',
  '--fs-h5':       '11px',
  '--fs-emoji-sm': '14px',
  '--fs-emoji-md': '20px',
  '--fs-emoji-lg': '28px',
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
