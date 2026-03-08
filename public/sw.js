// public/sw.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'
import { getMessaging, onBackgroundMessage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-sw.js'

const firebaseConfig = {
  apiKey:            "AIzaSyCk9B399pkq6exTKGh5FEVaqx9a_Tv2iv4",
  authDomain:        "mon-jardin-interieur.firebaseapp.com",
  projectId:         "mon-jardin-interieur",
  storageBucket:     "mon-jardin-interieur.firebasestorage.app",
  messagingSenderId: "470084583376",
  appId:             "1:470084583376:web:c21bbfbd9d89f678d483d5",
}

const app       = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

onBackgroundMessage(messaging, (payload) => {
  const { title, body, tag, icon } = payload.notification ?? payload.data ?? {}
  self.registration.showNotification(title ?? '🌿 Mon Jardin', {
    body:  body  ?? 'Un moment pour vous.',
    icon:  icon  ?? '/icon-192.png',
    badge: '/icon-192.png',
    tag:   tag   ?? 'jardin',
    data:  payload.data,
  })
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url ?? '/'
  e.waitUntil(clients.openWindow(url))
})
