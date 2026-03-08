// hooks/usePushNotification.js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../core/supabaseClient'

const VAPID_PUBLIC_KEY = 'BHoBRIRxT_0pQzgRMVn2BG9lgFbQ3au8aa7FFGn3Ab-O_V5N0ZXBZ0bLObr1t0SYKXwogXdJnAfqvAJuGf69INo'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function usePushNotification(userId) {
  const [permission,   setPermission]   = useState(Notification.permission)
  const [subscription, setSubscription] = useState(null)
  const [isSupported,  setIsSupported]  = useState(false)
  const [isLoading,    setIsLoading]    = useState(false)

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window)
  }, [])

  useEffect(() => {
    if (!isSupported) return
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        if (sub) setSubscription(sub)
      })
    })
  }, [isSupported])

  const subscribe = useCallback(async () => {
    if (!isSupported || !userId) return
    setIsLoading(true)
    try {
      const reg  = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') { setIsLoading(false); return }

      const sub  = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      setSubscription(sub)

      const json = sub.toJSON()
      await supabase.from('push_subscriptions').upsert({
        user_id:  userId,
        endpoint: json.endpoint,
        p256dh:   json.keys.p256dh,
        auth:     json.keys.auth,
      }, { onConflict: 'user_id,endpoint' })

    } catch (e) {
      console.error('[push] subscribe error:', e)
    }
    setIsLoading(false)
  }, [isSupported, userId])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return
    await subscription.unsubscribe()
    await supabase.from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', subscription.endpoint)
    setSubscription(null)
  }, [subscription, userId])

  return { isSupported, permission, isSubscribed: !!subscription, isLoading, subscribe, unsubscribe }
}
