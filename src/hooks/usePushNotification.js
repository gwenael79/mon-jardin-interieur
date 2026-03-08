// hooks/usePushNotification.js
// Gère l'abonnement aux push notifications Web
// → Demande la permission, s'abonne au service worker, enregistre en base

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../core/supabaseClient'

// ⚠️ Remplacez par votre clé publique VAPID générée
const VAPID_PUBLIC_KEY = 'BCdr2M4QaVxarPh-AdSoQXbJ1WseRvL4tnZVvy5kHZk7YqgAkXLqtYNNAjzSBiDTfOCoQbIDoykIcNqODVU1nxQ'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function usePushNotification(userId) {
  const [permission,    setPermission]    = useState(Notification.permission)
  const [subscription,  setSubscription]  = useState(null)
  const [isSupported,   setIsSupported]   = useState(false)
  const [isLoading,     setIsLoading]     = useState(false)

  // Vérifie le support PWA + push
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)
  }, [])

  // Récupère l'abonnement existant au montage
  useEffect(() => {
    if (!isSupported) return
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        if (sub) setSubscription(sub)
      })
    })
  }, [isSupported])

  // Demande la permission + s'abonne
  const subscribe = useCallback(async () => {
    if (!isSupported || !userId) return
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready

      // Demande la permission si pas encore accordée
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') { setIsLoading(false); return }

      // Crée l'abonnement push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      setSubscription(sub)

      // Enregistre en base Supabase
      const json  = sub.toJSON()
      await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: json.endpoint,
        p256dh:   json.keys.p256dh,
        auth:     json.keys.auth,
      }, { onConflict: 'user_id,endpoint' })

    } catch (e) {
      console.error('[push] subscribe error:', e)
    }
    setIsLoading(false)
  }, [isSupported, userId])

  // Se désabonne
  const unsubscribe = useCallback(async () => {
    if (!subscription) return
    await subscription.unsubscribe()
    await supabase.from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', subscription.endpoint)
    setSubscription(null)
  }, [subscription, userId])

  return {
    isSupported,
    permission,
    isSubscribed: !!subscription,
    isLoading,
    subscribe,
    unsubscribe,
  }
}
