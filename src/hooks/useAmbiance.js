// src/hooks/useAmbiance.js
import { useState, useEffect } from 'react'
import { supabase } from '../core/supabaseClient'

const CACHE_KEY = 'mji_ambiance'

// ─────────────────────────────────────────────────────────────────────────────
//  useAmbiance — lit users.ambiance ('zen' | 'feerique'), cache localStorage
//  Défaut 'feerique' (univers historique avec lutin) si non renseigné.
// ─────────────────────────────────────────────────────────────────────────────
export function useAmbiance() {
  const [ambiance, setAmbiance] = useState(() => {
    try { return localStorage.getItem(CACHE_KEY) || 'feerique' } catch { return 'feerique' }
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('ambiance').eq('id', user.id).maybeSingle()
      const val = data?.ambiance === 'zen' ? 'zen' : 'feerique'
      if (!cancelled) {
        setAmbiance(val)
        try { localStorage.setItem(CACHE_KEY, val) } catch {}
      }
    })()
    return () => { cancelled = true }
  }, [])

  return ambiance
}

// ─────────────────────────────────────────────────────────────────────────────
//  ambianceAsset — préfixe le nom de fichier par "zen-" en ambiance zen
//  ex: ambianceAsset('/stress1.png', 'zen') → '/zen-stress1.png'
// ─────────────────────────────────────────────────────────────────────────────
export function ambianceAsset(path, ambiance) {
  if (ambiance !== 'zen') return path
  const i = path.lastIndexOf('/')
  return path.slice(0, i + 1) + 'zen-' + path.slice(i + 1)
}
