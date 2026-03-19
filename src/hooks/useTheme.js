// src/hooks/useTheme.js
import { useEffect } from 'react'
import { supabase } from '../core/supabaseClient'

const CSS_VARS = ['--bg','--bg2','--bg3','--text','--text2','--text3','--green','--gold','--border','--border2']

export function applyTheme(settings) {
  const root = document.documentElement
  CSS_VARS.forEach(v => {
    const val = settings[v]
    if (val) root.style.setProperty(v, val)
  })
  if (settings['--green'] && settings['--green'].startsWith('#') && settings['--green'].length === 7) {
    const g = settings['--green']
    const rgb = parseInt(g.slice(1,3),16)+','+parseInt(g.slice(3,5),16)+','+parseInt(g.slice(5,7),16)
    root.style.setProperty('--green2', `rgba(${rgb},0.22)`)
    root.style.setProperty('--green3', `rgba(${rgb},0.11)`)
    root.style.setProperty('--greenT', `rgba(${rgb},0.48)`)
  }
}

export function useTheme() {
  useEffect(() => {
    supabase.from('app_settings').select('key,value')
      .then(({ data }) => {
        if (!data?.length) return
        const map = Object.fromEntries(data.map(r => [r.key, r.value]))
        applyTheme(map)
      })
  }, [])
}
