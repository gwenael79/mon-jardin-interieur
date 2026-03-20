// src/hooks/useTheme.js
import { useEffect } from 'react'
import { supabase } from '../core/supabaseClient'

const CACHE_KEY = 'mji_theme_vars'
const CACHE_TTL = 10 * 60 * 1000 // 10 min — rafraîchit Supabase si cache > 10 min

const CSS_VARS = [
  '--bg','--bg2','--bg3',
  '--text','--text2','--text3','--cream',
  '--green','--green2','--green3','--greenT',
  '--gold','--gold-warm',
  '--border','--border2',
  '--red','--red2','--redT',
  '--zone-roots','--zone-stem','--zone-leaves','--zone-flowers','--zone-breath',
]

export function applyTheme(settings) {
  const root = document.documentElement
  CSS_VARS.forEach(v => {
    if (settings[v]) root.style.setProperty(v, settings[v])
  })
  // Dériver --green2/3/T depuis --green si hex
  const g = settings['--green']
  if (g?.startsWith('#') && g.length === 7) {
    const rgb = parseInt(g.slice(1,3),16)+','+parseInt(g.slice(3,5),16)+','+parseInt(g.slice(5,7),16)
    if (!settings['--green2']) root.style.setProperty('--green2', `rgba(${rgb},0.22)`)
    if (!settings['--green3']) root.style.setProperty('--green3', `rgba(${rgb},0.11)`)
    if (!settings['--greenT']) root.style.setProperty('--greenT', `rgba(${rgb},0.48)`)
  }
}

export function useTheme() {
  useEffect(() => {
    // ── Étape 1 : application instantanée depuis le cache (0ms, pas de flash) ──
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

    // ── Étape 2 : fetch Supabase seulement si cache absent ou périmé ──
    if (cacheIsFresh) return

    supabase.from('app_settings').select('key,value')
      .then(({ data }) => {
        if (!data?.length) return
        const map = Object.fromEntries(data.map(r => [r.key, r.value]))
        applyTheme(map)
        // Mettre à jour le cache pour la prochaine visite
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ vars: map, ts: Date.now() }))
        } catch {}
      })
  }, [])
}
