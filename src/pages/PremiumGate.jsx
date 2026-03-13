import React, { useState } from 'react'
import { usePremium } from './usePremium'

/**
 * PremiumGate — enveloppe n'importe quelle section payante.
 *
 * Usage simple :
 *   <PremiumGate onUpgrade={() => setShowAccessPage(true)}>
 *     <ClubDesJardiniers />
 *   </PremiumGate>
 *
 * Props :
 *   - children       : le contenu à afficher si premium
 *   - onUpgrade      : callback quand l'user clique "Passer Premium"
 *   - featureName    : nom de la fonctionnalité (affiché dans la modale)
 *   - blur           : afficher le contenu flouté derrière (default: true)
 */
export default function PremiumGate({
  children,
  onUpgrade,
  featureName = 'cette fonctionnalité',
  blur = true,
}) {
  const { isPremium, loading } = usePremium()
  const [visible, setVisible]  = useState(false)

  if (loading) return null
  if (isPremium) return <>{children}</>

  return (
    <div style={styles.wrapper}>

      {/* Contenu flouté en arrière-plan */}
      {blur && (
        <div
          style={styles.blurred}
          onClick={() => setVisible(true)}
          aria-hidden="true"
        >
          {children}
        </div>
      )}

      {/* Bandeau d'accès */}
      <div style={styles.overlay} onClick={() => setVisible(true)}>
        <div style={styles.badge}>✨ Premium</div>
        <p style={styles.overlayText}>
          Débloque {featureName} avec l'abonnement Premium
        </p>
        <button style={styles.btn} onClick={(e) => { e.stopPropagation(); setVisible(true) }}>
          Voir les abonnements
        </button>
      </div>

      {/* Modale */}
      {visible && (
        <div style={styles.backdrop} onClick={() => setVisible(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setVisible(false)}>✕</button>

            <div style={styles.modalIcon}>🌿</div>
            <h2 style={styles.modalTitle}>Passe à l'étape suivante</h2>
            <p style={styles.modalSubtitle}>
              {featureName === 'cette fonctionnalité'
                ? 'Cette section est réservée aux membres Premium.'
                : <>
                    <strong>{featureName}</strong> est réservé aux membres Premium.
                  </>
              }
            </p>

            <div style={styles.perks}>
              {PERKS.map((p, i) => (
                <div key={i} style={styles.perk}>
                  <span style={styles.perkIcon}>{p.icon}</span>
                  <span style={styles.perkText}>{p.text}</span>
                </div>
              ))}
            </div>

            <button
              style={styles.upgradeBtn}
              onClick={() => { setVisible(false); onUpgrade?.() }}
            >
              Voir les abonnements — dès 5€
            </button>
            <p style={styles.hint}>Sans engagement · Paiement sécurisé</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Avantages listés dans la modale ─────────────────────────────────────────

const PERKS = [
  { icon: '🌻', text: 'Club des Jardiniers — connexions & élans' },
  { icon: '🌱', text: 'Ateliers & Défis — pratiques guidées' },
  { icon: '📖', text: 'Journal illimité — toutes tes entrées' },
  { icon: '💡', text: 'Lumens complets & statistiques détaillées' },
]

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  blurred: {
    filter: 'blur(6px)',
    opacity: 0.45,
    pointerEvents: 'none',
    userSelect: 'none',
    overflow: 'hidden',
    maxHeight: '340px',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    cursor: 'pointer',
    zIndex: 2,
    padding: '24px',
  },
  badge: {
    background: 'linear-gradient(135deg, #a8d5a2, #6dbf67)',
    color: '#fff',
    borderRadius: '20px',
    padding: '4px 14px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.06em',
  },
  overlayText: {
    textAlign: 'center',
    color: '#3a5c38',
    fontSize: '15px',
    fontWeight: '500',
    margin: 0,
  },
  btn: {
    background: 'rgba(107,191,103,0.15)',
    border: '1.5px solid rgba(107,191,103,0.5)',
    borderRadius: '20px',
    padding: '8px 20px',
    fontSize: '14px',
    color: '#3a7c36',
    fontWeight: '600',
    cursor: 'pointer',
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(30,50,28,0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '0 0 env(safe-area-inset-bottom,0)',
  },
  modal: {
    background: '#fff',
    borderRadius: '24px 24px 0 0',
    padding: '32px 24px 40px',
    width: '100%',
    maxWidth: '480px',
    position: 'relative',
    textAlign: 'center',
    boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(0,0,0,0.06)',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#555',
  },
  modalIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1e3a1c',
    margin: '0 0 8px',
  },
  modalSubtitle: {
    fontSize: '15px',
    color: '#5a7a58',
    margin: '0 0 24px',
    lineHeight: '1.5',
  },
  perks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '28px',
    textAlign: 'left',
  },
  perk: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(107,191,103,0.08)',
    borderRadius: '12px',
    padding: '10px 14px',
  },
  perkIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  perkText: {
    fontSize: '14px',
    color: '#2d4a2b',
    fontWeight: '500',
  },
  upgradeBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #6dbf67, #4a9e44)',
    color: '#fff',
    border: 'none',
    borderRadius: '16px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(107,191,103,0.4)',
    marginBottom: '10px',
  },
  hint: {
    fontSize: '12px',
    color: '#9ab898',
    margin: 0,
  },
}
