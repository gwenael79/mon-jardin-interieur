// components/GardenNotificationBanner.jsx
// Bannière douce qui glisse depuis la droite — disparaît seule après 5s

import { useEffect, useRef } from 'react'

/**
 * @param {{ message: { icon, title, body, type } | null, onClose: () => void }} props
 */
export default function GardenNotificationBanner({ message, onClose }) {
  const timerRef = useRef(null)

  useEffect(() => {
    if (!message) return
    // Disparaît automatiquement après 5s
    timerRef.current = setTimeout(onClose, 5000)
    return () => clearTimeout(timerRef.current)
  }, [message, onClose])

  if (!message) return null

  const isAlert = message.type === 'alert'

  return (
    <div style={{
      position:   'fixed',
      top:        20,
      right:      20,
      zIndex:     9999,
      width:      320,
      maxWidth:   'calc(100vw - 40px)',
      background: '#ffffff',
      borderLeft: `3px solid ${isAlert ? '#c97b4b' : '#7a9e7e'}`,
      borderRadius: 14,
      padding:    '18px 20px',
      boxShadow:  '0 8px 40px rgba(42,53,40,0.12)',
      display:    'flex',
      gap:        14,
      alignItems: 'flex-start',
      animation:  'slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
    }}>

      {/* Keyframes injectés une seule fois */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(360px) scale(0.95); opacity: 0; }
          to   { transform: translateX(0) scale(1);        opacity: 1; }
        }
      `}</style>

      {/* Icône */}
      <span style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>
        {message.icon}
      </span>

      {/* Texte */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: 15, fontWeight: 400,
          color: '#2a3528', marginBottom: 4,
        }}>
          {message.title}
        </div>
        <div style={{
          fontSize: 11, fontWeight: 300,
          color: '#8b6f5c', lineHeight: 1.6,
        }}>
          {message.body}
        </div>
      </div>

      {/* Fermer */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 10, right: 12,
          background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 13,
          color: '#8b6f5c', opacity: 0.5,
        }}
      >
        ✕
      </button>
    </div>
  )
}
