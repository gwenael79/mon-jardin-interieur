// src/components/PremiumGate.jsx
import { useState } from 'react'
import { usePremium } from '../hooks/usePremium'

/**
 * Bloque l'accès à un contenu si l'utilisateur n'est pas premium.
 *
 * Usage :
 *   <PremiumGate featureName="le Club des Jardiniers" onUpgrade={() => setShowAccessPage(true)}>
 *     <ScreenClubJardiniers />
 *   </PremiumGate>
 */
export default function PremiumGate({ children, featureName = 'cette section', onUpgrade }) {
  const { isPremium, loading } = usePremium()
  const [modalOpen, setModalOpen] = useState(false)

  // Pendant le chargement : écran neutre
  if (loading) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
      }}>
        <div style={{ fontSize: 12, color: 'rgba(238,232,218,0.3)', letterSpacing: '.1em' }}>
          Chargement…
        </div>
      </div>
    )
  }

  // Utilisateur premium : affiche le contenu normalement
  if (isPremium) return children

  // Utilisateur gratuit : contenu flouté + bandeau
  return (
    <>
      {/* Contenu flouté */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <div style={{
          filter: 'blur(6px)',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.45,
        }}>
          {children}
        </div>

        {/* Bandeau centré */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: '0 24px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(6,14,7,0.85) 40%, rgba(6,14,7,0.95) 100%)',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(232,196,100,0.12)',
            border: '1px solid rgba(232,196,100,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
          }}>
            🔒
          </div>

          <div style={{ textAlign: 'center', maxWidth: 320 }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 300,
              color: '#f0e8d0',
              marginBottom: 8,
              lineHeight: 1.2,
            }}>
              Accès Premium requis
            </div>
            <div style={{
              fontSize: 13,
              color: 'rgba(238,232,218,0.55)',
              lineHeight: 1.65,
            }}>
              {featureName} est réservé aux membres Premium.
              Débloquez l'accès pour profiter de toutes les fonctionnalités.
            </div>
          </div>

          <div
            onClick={() => setModalOpen(true)}
            style={{
              minHeight: 44,
              padding: '0 28px',
              borderRadius: 100,
              display: 'flex',
              alignItems: 'center',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(232,196,100,0.22), rgba(232,196,100,0.12))',
              border: '1px solid rgba(232,196,100,0.50)',
              color: '#e8d4a8',
              letterSpacing: '.04em',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Voir les abonnements →
          </div>
        </div>
      </div>

      {/* Modal bottom-sheet */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 500,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'linear-gradient(160deg, #0d1f0d, #080e08)',
              border: '1px solid rgba(232,196,100,0.2)',
              borderRadius: '22px 22px 0 0',
              padding: '20px 24px 40px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              animation: 'slideUp .3s ease',
            }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -8 }}>
              <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
            </div>

            {/* Titre */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>✨</div>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 24,
                fontWeight: 300,
                color: '#f0e8d0',
              }}>
                Passez Premium
              </div>
              <div style={{ fontSize: 12, color: 'rgba(238,232,218,0.45)', marginTop: 6 }}>
                Débloquez {featureName} et bien plus
              </div>
            </div>

            {/* Avantages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '🌿', label: 'Club des Jardiniers',    sub: 'Égrégore, Jardin collectif, Amis jardiniers' },
                { icon: '🌱', label: 'Mon Jardin complet',     sub: 'Rituels avancés, personnalisation, insights IA' },
                { icon: '🎓', label: 'Ateliers illimités',     sub: 'Inscriptions et accès à tous les ateliers' },
                { icon: '🏆', label: 'Défis communauté',       sub: 'Rejoignez les défis et suivez votre progression' },
              ].map(({ icon, label, sub }) => (
                <div key={label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, color: 'rgba(238,232,218,0.9)', fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(238,232,218,0.4)', marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div
              onClick={() => { setModalOpen(false); onUpgrade?.() }}
              style={{
                width: '100%',
                minHeight: 50,
                borderRadius: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(232,196,100,0.28), rgba(232,196,100,0.15))',
                border: '1px solid rgba(232,196,100,0.55)',
                color: '#e8d4a8',
                letterSpacing: '.04em',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Voir les abonnements
            </div>

            <div
              onClick={() => setModalOpen(false)}
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: 'rgba(238,232,218,0.3)',
                cursor: 'pointer',
                paddingTop: 4,
              }}
            >
              Fermer
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
