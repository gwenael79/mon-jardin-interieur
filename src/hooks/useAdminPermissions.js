import { useState, useEffect } from 'react'
import { supabase } from '../core/supabaseClient'

// Cache en mémoire pour éviter les requêtes répétées
let _cache = null
let _cacheUserId = null

export function useAdminPermissions() {
  const [permissions, setPermissions] = useState(null) // null = chargement
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) { if (!cancelled) { setPermissions(null); setLoading(false) }; return }

      // Cache valide
      if (_cacheUserId === userId && _cache !== null) {
        if (!cancelled) { setPermissions(_cache); setLoading(false) }
        return
      }

      const { data } = await supabase
        .from('admin_users')
        .select('statut, droits')
        .eq('user_id', userId)
        .maybeSingle()

      const perms = data?.statut === 'actif' ? (data.droits ?? {}) : null
      _cache = perms
      _cacheUserId = userId
      if (!cancelled) { setPermissions(perms); setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const has = (droit) => permissions !== null && permissions[droit] === true
  const isAdmin = permissions !== null  // a au moins un enregistrement actif

  return { permissions, loading, has, isAdmin }
}

// Invalide le cache (à appeler après un save dans AdminPage)
export function invalidateAdminCache() {
  _cache = null
  _cacheUserId = null
}
