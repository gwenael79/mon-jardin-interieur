// ─────────────────────────────────────────────────────────────────────────────
//  FleurAccomplieModal.jsx  —  Écran de célébration post-rituel
//
//  Affichage : après qu'un rituel est accompli, remplace (ou s'affiche par-dessus)
//  le WakeUpModal pour offrir un moment de fierté et de récompense.
//
//  INTÉGRATION (dans WakeUpModal, quand doneCount === 4 et confetti déclenché) :
//
//    import FleurAccomplieModal from './FleurAccomplieModal'
//
//    // Dans le JSX, après le confetti (à la place du fermeture auto) :
//    {showFleurAccomplie && (
//      <FleurAccomplieModal
//        plant={plant}
//        gardenSettings={gardenSettings}
//        lumensLevel={lumens?.level ?? 'faible'}
//        lumensTotal={lumens?.total ?? 0}
//        streak={stats?.streak ?? 1}
//        aiMessage={aiMessage}
//        onClose={() => setShowFleurAccomplie(false)}
//        onViewRituals={() => { setShowFleurAccomplie(false); /* naviguer vers rituels */ }}
//      />
//    )}
//
//  PROPS :
//    plant            — objet plant (usePlant)
//    gardenSettings   — objet settings (couleur/forme pétales)
//    streak           — number, jours consécutifs
//    vitalite         — number 0-100
//    aiMessage        — string, message IA du jour
//    onClose          — fn, ferme la modale
//    onViewRituals    — fn, CTA secondaire "Voir mes rituels"
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { PlantSVG } from './ScreenMonJardin'   // ajuster le chemin si nécessaire

// ── Particule confetti ────────────────────────────────────────────────────────
function Confetti({ count = 52 }) {
  const colors = [
    'var(--zone-flowers)', 'var(--gold)', 'var(--green)',
    'var(--lumens)', '#f0c8e0', '#c8f0d0', '#f0e0a0',
  ]
  const items = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,               // vw
      delay: Math.random() * 1.2,            // s
      dur: 2.2 + Math.random() * 1.6,        // s
      size: 5 + Math.random() * 8,           // px
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
      rotate: Math.random() * 360,
    }))
  )

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 2 }}>
      {items.current.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-12px',
            width: p.size,
            height: p.shape === 'circle' ? p.size : p.size * 0.5,
            borderRadius: p.shape === 'circle' ? '50%' : 2,
            background: p.color,
            opacity: 0,
            animation: `confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}

// ── Barre de vitalité animée ──────────────────────────────────────────────────
function VitalityBar({ value = 80 }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 80)
    return () => clearTimeout(t)
  }, [value])
  const color = value >= 70 ? 'var(--green)' : value >= 40 ? 'var(--gold)' : 'var(--zone-flowers)'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, letterSpacing: '.08em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
          Vitalité
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>
          {value}%
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 6,
          width: `${width}%`,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          transition: 'width 1.1s cubic-bezier(0.34,1.1,0.64,1)',
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>
    </div>
  )
}

// ── Modal principale ──────────────────────────────────────────────────────────
export default function FleurAccomplieModal({
  plant,
  gardenSettings,
  lumensLevel = 'faible',
  lumensTotal = 0,
  streak = 1,
  aiMessage = '',
  onClose,
  onViewRituals,
}) {
  const [visible, setVisible]   = useState(false)
  const [closing, setClosing]   = useState(false)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  // Animation d'entrée
  useEffect(() => { const t = setTimeout(() => setVisible(true), 30); return () => clearTimeout(t) }, [])

  const doClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => onClose?.(), 400)
  }, [onClose])

  const doViewRituals = useCallback(() => {
    setClosing(true)
    setTimeout(() => { onClose?.(); onViewRituals?.() }, 400)
  }, [onClose, onViewRituals])

  // Fermer sur Escape
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') doClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [doClose])

  // Date lisible
  const dateLabel = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  return (
    <>
      {/* ── CSS keyframes injectés une seule fois ── */}
      <style>{`
        @keyframes confettiFall {
          0%   { opacity: 0; transform: translateY(-10px) rotate(0deg) scale(1); }
          8%   { opacity: 1; }
          100% { opacity: 0; transform: translateY(110vh) rotate(720deg) scale(0.5); }
        }
        @keyframes fleurEntree {
          0%   { opacity: 0; transform: scale(0.82) translateY(18px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes haloGlow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%       { opacity: 0.85; transform: scale(1.06); }
        }
        @keyframes streakBounce {
          0%, 100% { transform: scale(1); }
          40%       { transform: scale(1.14); }
          70%       { transform: scale(0.95); }
        }
      `}</style>

      {/* ── Overlay ── */}
      <div
        onClick={e => e.target === e.currentTarget && doClose()}
        style={{
          position: 'fixed', inset: 0, zIndex: 600,
          background: 'rgba(10,8,20,0.82)',
          backdropFilter: 'blur(14px)',
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          padding: isMobile ? 0 : 20,
          opacity: closing ? 0 : (visible ? 1 : 0),
          transition: 'opacity 0.38s ease',
        }}
      >
        {/* ── Card ── */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: isMobile ? '100%' : 420,
            maxHeight: isMobile ? '92vh' : '88vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            background: 'linear-gradient(170deg, #1a1230 0%, #0e0e1a 100%)',
            border: '1px solid rgba(180,140,220,0.22)',
            borderRadius: isMobile ? '22px 22px 0 0' : 20,
            borderBottom: isMobile ? 'none' : undefined,
            boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
            opacity: closing ? 0 : (visible ? 1 : 0),
            transform: closing
              ? (isMobile ? 'translateY(40px)' : 'scale(0.96)')
              : (visible ? 'none' : (isMobile ? 'translateY(40px)' : 'scale(0.96)')),
            transition: 'opacity 0.38s ease, transform 0.38s cubic-bezier(0.34,1.1,0.64,1)',
          }}
        >
          {/* Confettis */}
          {visible && !closing && <Confetti count={56} />}

          {/* Poignée mobile */}
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 2 }}>
              <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
            </div>
          )}

          {/* ── Bouton fermer ── */}
          <button
            onClick={doClose}
            style={{
              position: 'absolute', top: 14, right: 14, zIndex: 10,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '50%', width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
              fontSize: 14, lineHeight: 1, transition: 'all .18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
          >
            ✕
          </button>

          {/* ── Corps ── */}
          <div style={{ padding: isMobile ? '12px 20px 28px' : '24px 28px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, position: 'relative', zIndex: 3 }}>

            {/* Surtitle */}
            <div style={{
              fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase',
              color: 'rgba(200,160,230,0.65)', marginBottom: 6,
            }}>
              Rituel accompli
            </div>

            {/* Titre principal */}
            <h2 style={{
              fontFamily: "'Cormorant Garamond', 'Georgia', serif",
              fontSize: isMobile ? 28 : 32,
              fontWeight: 300,
              color: '#f0ecf8',
              textAlign: 'center',
              lineHeight: 1.15,
              margin: 0,
              marginBottom: 4,
            }}>
              Ta fleur a grandi aujourd'hui
            </h2>

            {/* Sous-titre date */}
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.32)',
              marginBottom: 24, textAlign: 'center',
            }}>
              {dateLabel}{streak > 1 ? ` · ${streak} jours de suite` : ''}
            </div>

            {/* ── Fleur — même conteneur exact que ScreenMonJardin (lignes 4765-4779) ── */}
            <div style={{
              position: 'relative',
              flexShrink: 0,
              width: isMobile ? '80%' : '60%',
              alignSelf: 'center',
              height: isMobile ? 300 : 380,
              borderRadius: 24,
              overflow: 'hidden',
              marginBottom: 20,
              animation: 'fleurEntree 0.7s 0.15s cubic-bezier(0.34,1.1,0.64,1) both',
            }}>
              <PlantSVG
                health={plant?.health ?? 5}
                gardenSettings={gardenSettings}
                lumensLevel={lumensLevel}
                lumensTotal={lumensTotal}
              />

              {/* Badge vitalité — position identique à ScreenMonJardin */}
              <div style={{
                position: 'absolute', bottom: 14, left: 14,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 100,
                background: 'rgba(0,0,0,0.28)',
                border: '1px solid rgba(255,255,255,0.20)',
                fontSize: 14, color: 'rgba(255,255,255,0.92)',
                fontFamily: "'Jost',sans-serif",
              }}>
                Vitalité · <span style={{ fontWeight: 700, fontSize: 16 }}>{plant?.health ?? 5}%</span>
              </div>

              {/* Badge streak — position identique à ScreenMonJardin */}
              {streak >= 1 && (
                <div style={{
                  position: 'absolute', top: 12, right: 14,
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 100,
                  background: 'rgba(0,0,0,0.20)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  fontSize: 11, color: 'rgba(255,255,255,0.88)',
                  fontFamily: "'Jost',sans-serif",
                }}>
                  👍 {streak} jour{streak > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* ── Barre de vitalité ── */}
            <div style={{ width: '100%', maxWidth: 340, marginBottom: 16 }}>
              <VitalityBar value={vitalite} />
            </div>

            {/* ── Streak badge ── */}
            {streak > 1 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px',
                borderRadius: 20,
                background: 'rgba(255,190,80,0.10)',
                border: '1px solid rgba(255,190,80,0.25)',
                marginBottom: 20,
                animation: 'streakBounce 0.6s 0.8s cubic-bezier(0.34,1.3,0.64,1) both',
              }}>
                <span style={{ fontSize: 14 }}>🔥</span>
                <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 500 }}>
                  {streak} jours de suite
                </span>
              </div>
            )}

            {/* ── Message IA ── */}
            {aiMessage && (
              <div style={{
                width: '100%', maxWidth: 340,
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.045)',
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: 24,
                textAlign: 'center',
                fontSize: isMobile ? 13 : 12,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}>
                {aiMessage}
              </div>
            )}

            {/* ── CTAs ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
              {/* Bouton principal — Voir mes rituels */}
              <button
                onClick={doViewRituals}
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(135deg, #b090d0, #7858a8)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: '.04em',
                  cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(140,90,200,0.38)',
                  transition: 'all .18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(140,90,200,0.52)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(140,90,200,0.38)' }}
              >
                🌸 Voir mes rituels
              </button>

              {/* Bouton secondaire — Fermer */}
              <button
                onClick={doClose}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.38)',
                  fontSize: 13,
                  cursor: 'pointer',
                  letterSpacing: '.04em',
                  transition: 'all .18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.38)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
