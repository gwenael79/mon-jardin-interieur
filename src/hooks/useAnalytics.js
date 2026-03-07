// src/hooks/useAnalytics.js
// Hook universel de tracking — à appeler depuis n'importe quel composant
// Usage : const { track } = useAnalytics(userId)
//         track('ritual_complete', { zone: 'racines', delta: 10 })

import { useCallback, useEffect, useRef } from 'react'
import { supabase } from '../core/supabaseClient'

const ADMIN_ID = 'aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'

// Génère un session_id unique par onglet/session navigateur
function getSessionId() {
  let sid = sessionStorage.getItem('mji_session_id')
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem('mji_session_id', sid)
  }
  return sid
}

// Détecte mobile
function getPlatform() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'web'
}

export function useAnalytics(userId) {
  const sessionId  = useRef(getSessionId())
  const platform   = useRef(getPlatform())
  const sessionStart = useRef(Date.now())

  const track = useCallback(async (eventType, properties = {}, page = null, eventCat = null) => {
    // Ne pas tracker l'admin
    if (!userId || userId === ADMIN_ID) return

    try {
      await supabase.from('analytics_events').insert({
        user_id:    userId,
        session_id: sessionId.current,
        event_type: eventType,
        event_cat:  eventCat ?? inferCategory(eventType),
        properties: properties,
        page:       page,
        platform:   platform.current,
      })
    } catch (e) {
      // Ne jamais bloquer l'UI pour un event analytics
      console.warn('[analytics] track error:', e)
    }
  }, [userId])

  // Track session_start au montage
  useEffect(() => {
    if (!userId || userId === ADMIN_ID) return
    track('session_start', {}, null, 'system')

    // Track session_end à la fermeture
    const handleUnload = () => {
      const duration = Math.round((Date.now() - sessionStart.current) / 1000)
      // sendBeacon pour être sûr que ça part même à la fermeture
      const payload = JSON.stringify({
        user_id:    userId,
        session_id: sessionId.current,
        event_type: 'session_end',
        event_cat:  'system',
        properties: { duration_seconds: duration },
        platform:   platform.current,
      })
      navigator.sendBeacon?.('/api/analytics', payload) // optionnel
      // Fallback supabase (peut ne pas partir si page fermée)
      track('session_end', { duration_seconds: duration }, null, 'system')
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [userId])

  return { track }
}

// Infère la catégorie depuis l'event_type
function inferCategory(eventType) {
  if (['page_view','session_start','session_end'].includes(eventType))              return 'navigation'
  if (['bilan_start','bilan_complete','bilan_skip','ritual_complete'].includes(eventType)) return 'engagement'
  if (['coeur_sent','merci_sent','invite_sent'].includes(eventType))                return 'social'
  if (['atelier_view','atelier_register','atelier_complete'].includes(eventType))   return 'ateliers'
  if (['defi_join','defi_complete'].includes(eventType))                            return 'defis'
  if (['lumens_earned','lumens_spent','lumens_transfer'].includes(eventType))       return 'lumens'
  if (['profile_update','plant_named','app_install'].includes(eventType))           return 'profil'
  return 'other'
}
