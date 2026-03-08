// hooks/usePushNotification.js
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

const VAPID_KEY = 'BHoBRIRxT_0pQzgRMVn2BG9lgFbQ3au8aa7FFGn3Ab-O_V5N0ZXBZ0bLObr1t0SYKXwogXdJnAfqvAJuGf69INo'

function getFirebaseApp() {
  if (getApps().length) return getApps()[0]
  return initializeApp(firebaseConfig)
}

export function usePushNotification(userId) {
  const [permission,   setPermission]   = useState(Notification.permission)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSupported,  setIsSupported]  = useState(false)
  const [isLoading,    setIsLoading]    = useState(false)
  const [fcmToken,     setFcmToken]     = useState(null)

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
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') { setIsLoading(false); return }

      const app       = getFirebaseApp()
      const messaging = getMessaging(app)
      const sw        = await navigator.serviceWorker.ready

      const token = await getToken(messaging, {
        vapidKey:           VAPID_KEY,
        serviceWorkerRegistration: sw,
      })

      if (!token) { console.error('[push] no token'); setIsLoading(false); return }
      setFcmToken(token)
      console.log('[push] FCM token:', token.slice(0, 30))

      // Supprimer l'ancien abonnement et insérer le nouveau
      await supabase.from('push_subscriptions').delete().eq('user_id', userId)
      await supabase.from('push_subscriptions').insert({
        user_id:  userId,
        endpoint: `fcm:${token}`,
        p256dh:   token.slice(0, 87),
        auth:     token.slice(0, 22),
      })

      setIsSubscribed(true)
    } catch (e) {
      console.error('[push] subscribe error:', e)
    }
    setIsLoading(false)
  }, [isSupported, userId])

  const unsubscribe = useCallback(async () => {
    try {
      const app       = getFirebaseApp()
      const messaging = getMessaging(app)
      await deleteToken(messaging)
      await supabase.from('push_subscriptions').delete().eq('user_id', userId)
      setIsSubscribed(false)
      setFcmToken(null)
    } catch (e) {
      console.error('[push] unsubscribe error:', e)
    }
  }, [userId])

  return { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe }
}
