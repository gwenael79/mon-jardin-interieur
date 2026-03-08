// public/sw.js
// Service Worker — gère les push notifications et le cache PWA
// À placer dans le dossier public/ de votre projet Vite

const APP_NAME = 'Mon Jardin Intérieur'
const CACHE_V  = 'jardin-v1'

// ── Installation ──────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// ── Push reçu depuis le serveur ───────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: APP_NAME, body: event.data.text(), icon: '🌱' }
  }

  const { title, body, icon = '🌱', tag = 'jardin', url = '/' } = payload

  // Icône selon le type
  const iconMap = {
    ritual:      '/icons/icon-192.png',
    degradation: '/icons/icon-192.png',
    coeur:       '/icons/icon-192.png',
  }

  const options = {
    body,
    icon:   iconMap[tag] ?? '/icons/icon-192.png',
    badge:  '/icons/badge-72.png',
    tag,                          // remplace la notif précédente du même type
    renotify: false,
    data:   { url },
    actions: [
      { action: 'open',    title: 'Ouvrir mon jardin' },
      { action: 'dismiss', title: 'Plus tard'         },
    ],
    // Vibration douce (mobile)
    vibrate: [100, 50, 100],
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// ── Clic sur la notification ──────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // Réutilise un onglet existant si possible
      const existing = list.find(c => c.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        existing.navigate(url)
      } else {
        clients.openWindow(url)
      }
    })
  )
})
