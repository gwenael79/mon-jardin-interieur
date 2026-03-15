// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            "AIzaSyCk9B399pkq6exTKGh5FEVaqx9a_Tv2iv4",
  authDomain:        "mon-jardin-interieur.firebaseapp.com",
  projectId:         "mon-jardin-interieur",
  storageBucket:     "mon-jardin-interieur.firebasestorage.app",
  messagingSenderId: "470084583376",
  appId:             "1:470084583376:web:c21bbfbd9d89f678d483d5",
})

const messaging = firebase.messaging()

// ── Notification en arrière-plan ─────────────────────────
messaging.onBackgroundMessage((payload) => {
  const { title, body, tag, icon } = payload.notification ?? payload.data ?? {}
  self.registration.showNotification(title ?? '🌿 Mon Jardin', {
    body:    body    ?? 'Un moment pour vous.',
    icon:    '/icons/icon-192.png',
    badge:   '/icons/icon-192.png',
    tag:     tag     ?? 'jardin',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open',  title: '🌿 Ouvrir mon jardin' },
      { action: 'later', title: 'Plus tard'            },
    ],
    data: payload.data,
  })
})

// ── Clic sur la notification ─────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close()

  // Bouton "Plus tard" → on ferme juste
  if (e.action === 'later') return

  // Bouton "Ouvrir" ou clic direct → ouvrir l'app
  const url = e.notification.data?.url ?? 'https://monjardininterieur.com/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      // Si une fenêtre est déjà ouverte → la focus
      const existing = wins.find(w => w.url.includes('monjardininterieur.com'))
      if (existing) return existing.focus()
      // Sinon ouvrir une nouvelle fenêtre
      return clients.openWindow(url)
    })
  )
})
