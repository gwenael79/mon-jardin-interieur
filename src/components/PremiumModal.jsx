// src/components/PremiumModal.jsx
export default function PremiumModal({ onClose, onUpgrade }) {
  const PERKS = [
    { icon: '🌻', text: 'Jardin Collectif — toutes les connexions visibles' },
    { icon: '📖', text: 'Ateliers illimités — tous les ateliers accessibles' },
    { icon: '✨', text: 'Défis complets — participez à tous les défis' },
    { icon: '👥', text: 'Club des Jardiniers — interactions complètes' },
    { icon: '🎧', text: 'Jardinothèque — accès aux achats' },
    { icon: '💡', text: 'Lumens & statistiques détaillées' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(10,20,10,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg)',
        borderRadius: '24px 24px 0 0',
        border: '1px solid rgba(255,255,255,0.10)', borderBottom: 'none',
        padding: '28px 24px 44px',
        width: '100%', maxWidth: 480,
        position: 'relative',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 100, margin: '0 auto 20px' }} />

        <button onClick={onClose} style={{
          position: 'absolute', top: 20, right: 20,
          background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '50%',
          width: 32, height: 32, fontSize: 14, cursor: 'pointer', color: 'rgba(242,237,224,0.60)',
        }}>✕</button>

        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 44 }}>🌿</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 300, color: '#f2ede0', marginTop: 8 }}>
            Rejoignez l'univers Premium
          </div>
          <div style={{ fontSize: 12, color: 'rgba(242,237,224,0.45)', marginTop: 6 }}>
            Tout votre jardin intérieur, sans limites
          </div>
        </div>

        {/* Perks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {PERKS.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
              <span style={{ fontSize: 13, color: 'rgba(242,237,224,0.75)' }}>{p.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={() => { onClose(); onUpgrade?.() }} style={{
          width: '100%', padding: '15px',
          background: 'linear-gradient(135deg, rgba(232,192,96,0.25), rgba(180,160,240,0.25))',
          border: '1px solid rgba(232,192,96,0.40)',
          borderRadius: 14, fontSize: 15, fontWeight: 600,
          color: '#e8c060', cursor: 'pointer',
          fontFamily: "'Jost',sans-serif",
          boxShadow: '0 4px 24px rgba(232,192,96,0.15)',
          marginBottom: 10,
        }}>
          Découvrir les offres Premium ✨
        </button>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(242,237,224,0.30)' }}>
          Sans engagement · Paiement sécurisé
        </div>
      </div>
    </div>
  )
}
