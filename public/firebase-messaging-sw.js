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

// ── Badge counter via Cache API (localStorage indisponible en SW) ─────────────
async function getBadgeCount() {
  try {
    const cache = await caches.open('badge-store')
    const res   = await cache.match('/badge-count')
    return res ? parseInt(await res.text(), 10) : 0
  } catch { return 0 }
}

async function incrementBadge() {
  if (!('setAppBadge' in self.registration)) return
  try {
    const cache = await caches.open('badge-store')
    const count = await getBadgeCount() + 1
    await cache.put('/badge-count', new Response(String(count)))
    await self.registration.setAppBadge(count)
  } catch (_) {}
}

async function clearBadge() {
  try {
    const cache = await caches.open('badge-store')
    await cache.put('/badge-count', new Response('0'))
    if ('clearAppBadge' in self.registration) await self.registration.clearAppBadge()
  } catch (_) {}
}

// ── Actions contextuelles par type ───────────────────────────────────────────
function getActions(type) {
  if (type === 'coeur_recu')
    return [{ action: 'reply', title: '💐 Renvoyer' }, { action: 'view', title: 'Voir' }]
  if (type === 'ritual_reminder')
    return [{ action: 'view', title: '🌿 Commencer' }, { action: 'later', title: 'Plus tard' }]
  if (type?.startsWith('degradation'))
    return [{ action: 'view', title: '🌱 Prendre soin' }, { action: 'later', title: 'Pas maintenant' }]
  return [{ action: 'view', title: '🌿 Ouvrir mon jardin' }, { action: 'later', title: 'Plus tard' }]
}

// ── Notification en arrière-plan ──────────────────────────────────────────────
messaging.onBackgroundMessage(async (payload) => {
  const notif = payload.notification ?? {}
  const data  = payload.data ?? {}
  const type  = data.type ?? notif.tag ?? 'ritual'
  const url   = data.url  ?? '/'

  // Si l'app est visible en premier plan → postMessage + pas de doublon système
  const wins = await clients.matchAll({ type: 'window', includeUncontrolled: true })
  const visibleWin = wins.find(w => w.visibilityState === 'visible')
  if (visibleWin) {
    visibleWin.postMessage({ type: 'PUSH_RECEIVED', data: { ...data, type, url } })
    return
  }

  await incrementBadge()

  self.registration.showNotification(notif.title ?? '🌿 Mon Jardin', {
    body:     notif.body ?? 'Un moment pour vous.',
    icon:     '/icons/icon-192.png',
    badge:    '/icons/monochrome.png',
    tag:      notif.tag ?? type,
    renotify: true,
    vibrate:  [200, 100, 200],
    actions:  getActions(type),
    data:     { ...data, url },
  })
})

// ── Clic sur la notification ──────────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close()

  e.waitUntil(
    clearBadge().then(() => {
      if (e.action === 'later') return

      const senderId = e.notification.data?.senderId
      const url = e.action === 'reply'
        ? `/jardin${senderId ? `?from=${senderId}` : ''}`
        : (e.notification.data?.url ?? '/')

      const fullUrl = `https://monjardininterieur.com${url}`

      return clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
        const existing = wins.find(w => w.url.includes('monjardininterieur.com'))
        if (existing) {
          existing.postMessage({ type: 'NOTIFICATION_CLICKED', action: e.action, url: fullUrl })
          existing.navigate(fullUrl).catch(() => existing.focus())
          return
        }
        return clients.openWindow(fullUrl)
      })
    })
  )
})
