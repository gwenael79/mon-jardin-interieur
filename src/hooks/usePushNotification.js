// hooks/usePushNotification.js
// iOS → Web Push natif (VAPID)
// Android → Firebase Cloud Messaging

import { useState, useEffect, useCallback } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, deleteToken } from 'firebase/messaging'
import { supabase } from '../core/supabaseClient'

const firebaseConfig = {
  apiKey:            "AIzaSyCk9B399pkq6exTKGh5FEVaqx9a_Tv2iv4",
  authDomain:        "mon-jardin-interieur.firebaseapp.com",
  projectId:         "mon-jardin-interieur",
  storageBucket:     "mon-jardin-interieur.firebasestorage.app",
  messagingSenderId: "470084583376",
  appId:             "1:470084583376:web:c21bbfbd9d89f678d483d5",
}

const VAPID_PUBLIC_KEY = 'BHoBRIRxT_0pQzgRMVn2BG9lgFbQ3au8aa7FFGn3Ab-O_V5N0ZXBZ0bLObr1t0SYKXwogXdJnAfqvAJuGf69INo'

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

function getFirebaseApp() {
  if (getApps().length) return getApps()[0]
  return initializeApp(firebaseConfig)
}

// Convertit la VAPID key base64url en Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function usePushNotification(userId) {
  const [permission,   setPermission]   = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSupported,  setIsSupported]  = useState(false)
  const [isLoading,    setIsLoading]    = useState(false)

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)
  }, [])

  // Vérifier si déjà abonné en base
  useEffect(() => {
    if (!userId) return
    supabase.from('push_subscriptions')
      .select('id').eq('user_id', userId).limit(1).maybeSingle()
      .then(({ data }) => setIsSubscribed(!!data))
  }, [userId])

  const subscribe = useCallback(async () => {
    if (!isSupported || !userId) return
    setIsLoading(true)
    try {
      // Demander la permission
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') { setIsLoading(false); return }

      const sw = await navigator.serviceWorker.ready

      if (isIOS) {
        // ── iOS : Web Push natif avec VAPID ──────────────────
        const sub = await sw.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        const subJson = sub.toJSON()
        const endpoint = subJson.endpoint
        const p256dh   = subJson.keys?.p256dh   ?? ''
        const auth     = subJson.keys?.auth      ?? ''

        // Supprimer l'ancien et insérer le nouveau
        await supabase.from('push_subscriptions').delete().eq('user_id', userId)
        await supabase.from('push_subscriptions').insert({
          user_id:  userId,
          endpoint: endpoint,
          p256dh:   p256dh,
          auth:     auth,
          platform: 'ios',
        })
      } else {
        // ── Android : Firebase Cloud Messaging ───────────────
        const app       = getFirebaseApp()
        const messaging = getMessaging(app)

        const token = await getToken(messaging, {
          vapidKey:                  VAPID_PUBLIC_KEY,
          serviceWorkerRegistration: sw,
        })

        if (!token) { console.error('[push] no FCM token'); setIsLoading(false); return }

        await supabase.from('push_subscriptions').delete().eq('user_id', userId)
        await supabase.from('push_subscriptions').insert({
          user_id:  userId,
          endpoint: `fcm:${token}`,
          p256dh:   token.slice(0, 87),
          auth:     token.slice(0, 22),
          platform: 'android',
        })
      }

      setIsSubscribed(true)
      console.log('[push] abonné avec succès —', isIOS ? 'iOS WebPush' : 'Android FCM')

    } catch (e) {
      console.error('[push] subscribe error:', e)
    }
    setIsLoading(false)
  }, [isSupported, userId])

  const unsubscribe = useCallback(async () => {
    try {
      if (!isIOS) {
        const app       = getFirebaseApp()
        const messaging = getMessaging(app)
        await deleteToken(messaging)
      } else {
        const sw  = await navigator.serviceWorker.ready
        const sub = await sw.pushManager.getSubscription()
        if (sub) await sub.unsubscribe()
      }
      await supabase.from('push_subscriptions').delete().eq('user_id', userId)
      setIsSubscribed(false)
    } catch (e) {
      console.error('[push] unsubscribe error:', e)
    }
  }, [userId])

  return { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe }
}
