// src/components/PremiumBanner.jsx
import { useState } from 'react'

export default function PremiumBanner({ onUpgrade }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998,
        background: 'linear-gradient(90deg, rgba(180,160,240,0.22) 0%, rgba(232,192,96,0.22) 100%)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(232,192,96,0.20)',
        padding: '9px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 14 }}>✨</span>
        <div style={{ flex: 1, fontSize: 12, color: 'rgba(242,237,224,0.85)', lineHeight: 1.4 }}>
          Accédez à tout l'univers de votre jardin intérieur en rejoignant l'offre{' '}
          <strong style={{ color: '#e8c060' }}>Premium</strong>
        </div>
        <button
          onClick={onUpgrade}
          style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
            fontFamily: "'Jost',sans-serif", fontWeight: 600, whiteSpace: 'nowrap',
            background: 'linear-gradient(135deg, rgba(232,192,96,0.30), rgba(180,160,240,0.30))',
            border: '1px solid rgba(232,192,96,0.40)', color: '#e8c060',
          }}>
          Découvrir →
        </button>
      </div>

      {/* Spacer */}
      <div style={{ height: 40 }} />
    </>
  )
}
