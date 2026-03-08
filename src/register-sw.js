// src/register-sw.js
// À importer dans main.jsx : import './register-sw.js'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => console.log('[SW] registered:', reg.scope))
      .catch(err => console.error('[SW] registration failed:', err))
  })
}
