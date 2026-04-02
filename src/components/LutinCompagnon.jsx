// src/components/LutinCompagnon.jsx
// Positions : 'right' | 'left' | 'bottom' | 'top-right'
// bubbleOpen / onCloseBubble / onClickImage : contrôlés par le parent

import { useState, useEffect } from 'react'

const LUTIN_STYLES = `
  @keyframes lutinFromRight {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0);    }
  }
  @keyframes lutinFromLeft {
    from { opacity: 0; transform: translateX(-40px); }
    to   { opacity: 1; transform: translateX(0);     }
  }
  @keyframes lutinFromBottom {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes lutinLeaveRight {
    from { opacity: 1; transform: translateX(0);    }
    to   { opacity: 0; transform: translateX(40px); }
  }
  @keyframes lutinLeaveLeft {
    from { opacity: 1; transform: translateX(0);     }
    to   { opacity: 0; transform: translateX(-40px); }
  }
  @keyframes lutinLeaveBottom {
    from { opacity: 1; transform: translateY(0);    }
    to   { opacity: 0; transform: translateY(40px); }
  }
  @keyframes lutinBobble {
    0%, 100% { transform: translateY(0px);  }
    50%       { transform: translateY(-6px); }
  }
  @keyframes bubblePop {
    from { opacity: 0; transform: scale(0.85) translateY(6px); }
    65%  { opacity: 1; transform: scale(1.03) translateY(-2px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);    }
  }
`

const CONFIG = {
  right: {
    imgSrc:    '/lutin-droit.png',
    imgWidth:  110,
    enterAnim: 'lutinFromRight  0.50s cubic-bezier(0.16,1,0.3,1) both',
    leaveAnim: 'lutinLeaveRight 0.35s cubic-bezier(0.4,0,1,1)   both',
    wrapStyle: { right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-end' },
    imgStyle:  { marginRight: -4 },
    bubbleStyle: { marginBottom: 64, marginRight: 4, borderRadius: '18px 18px 4px 18px' },
    tailStyle: { bottom: -10, right: 14, borderLeft: '10px solid transparent', borderTop: '10px solid rgba(255,252,248,0.72)' },
  },
  left: {
    imgSrc:    '/lutin-gauche.png',
    imgWidth:  110,
    enterAnim: 'lutinFromLeft  0.50s cubic-bezier(0.16,1,0.3,1) both',
    leaveAnim: 'lutinLeaveLeft 0.35s cubic-bezier(0.4,0,1,1)   both',
    wrapStyle: { left: 0, bottom: 0, flexDirection: 'row-reverse', alignItems: 'flex-end' },
    imgStyle:  { marginLeft: -4 },
    bubbleStyle: { marginBottom: 64, marginLeft: 4, borderRadius: '18px 18px 18px 4px' },
    tailStyle: { bottom: -10, left: 14, borderRight: '10px solid transparent', borderTop: '10px solid rgba(255,252,248,0.72)' },
  },
  bottom: {
    imgSrc:    '/lutin-bas.png',
    imgWidth:  130,
    enterAnim: 'lutinFromBottom  0.50s cubic-bezier(0.16,1,0.3,1) both',
    leaveAnim: 'lutinLeaveBottom 0.35s cubic-bezier(0.4,0,1,1)   both',
    wrapStyle: { left: '50%', bottom: 0, transform: 'translateX(-50%)', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' },
    imgStyle:  {},
    bubbleStyle: { marginBottom: 8, borderRadius: '18px 18px 18px 18px' },
    tailStyle: { bottom: -10, left: '50%', transform: 'translateX(-50%)', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid rgba(255,252,248,0.72)' },
  },
  'top-right': {
    imgSrc:    '/lutin-droit.png',
    imgWidth:  110,
    enterAnim: 'lutinFromRight  0.50s cubic-bezier(0.16,1,0.3,1) both',
    leaveAnim: 'lutinLeaveRight 0.35s cubic-bezier(0.4,0,1,1)   both',
    wrapStyle: { right: 0, top: 0, flexDirection: 'row', alignItems: 'flex-start' },
    imgStyle:  { marginRight: -4 },
    bubbleStyle: { marginTop: 16, marginRight: 4, borderRadius: '18px 4px 18px 18px' },
    tailStyle: { top: -10, right: 14, borderLeft: '10px solid transparent', borderBottom: '10px solid rgba(255,252,248,0.72)' },
  },
}

export function LutinCompagnon({
  message,
  visible,
  position      = 'right',
  wrapStyleOverride = {},
  bubbleOpen    = false,
  onCloseBubble,
  onClickImage,
  contained     = false,
}) {
  const [show,    setShow]    = useState(false)
  const [leaving, setLeaving] = useState(false)

  const cfg = CONFIG[position] ?? CONFIG.right

  useEffect(() => {
    if (visible) {
      setLeaving(false)
      const t = setTimeout(() => setShow(true), 60)
      return () => clearTimeout(t)
    } else {
      if (!show) return
      setLeaving(true)
      const t = setTimeout(() => { setShow(false); setLeaving(false) }, 360)
      return () => clearTimeout(t)
    }
  }, [visible])

  if (!show && !leaving) return null

  return (
    <>
      <style>{LUTIN_STYLES}</style>

      <div style={{
        position: contained ? 'absolute' : 'fixed',
        zIndex: 60,
        display: 'flex',
        pointerEvents: 'none',
        animation: leaving ? cfg.leaveAnim : cfg.enterAnim,
        ...cfg.wrapStyle,
        ...wrapStyleOverride,
      }}>

        {/* Bulle — visible uniquement si bubbleOpen */}
        {bubbleOpen && (
          <div style={{
            pointerEvents: 'auto',
            maxWidth: 230,
            minWidth: 160,
            background: 'rgba(255,252,248,0.72)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255,255,255,0.55)',
            boxShadow: '0 8px 32px rgba(120,80,40,0.12), 0 2px 8px rgba(120,80,40,0.08)',
            padding: '12px 32px 12px 14px',
            position: 'relative',
            animation: 'bubblePop 0.44s cubic-bezier(0.16,1,0.3,1) both',
            ...cfg.bubbleStyle,
          }}>
            <div style={{ position: 'absolute', width: 0, height: 0, ...cfg.tailStyle }} />

            <p style={{
              margin: 0,
              fontFamily: 'Jost, sans-serif',
              fontSize: 13.5,
              lineHeight: 1.55,
              color: '#3a2a1a',
              fontWeight: 400,
            }}>
              {message}
            </p>

            <button
              onClick={onCloseBubble}
              style={{
                position: 'absolute', top: 6, right: 8,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: 'rgba(120,80,40,0.40)',
                lineHeight: 1, padding: '2px 4px', borderRadius: 4,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(120,80,40,0.85)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(120,80,40,0.40)'}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Image du lutin — cliquable quand la bulle est fermée */}
        <div
          style={{
            flexShrink: 0,
            animation: leaving ? 'none' : 'lutinBobble 3.5s ease-in-out 0.8s infinite',
            pointerEvents: 'auto',
            cursor: bubbleOpen ? 'default' : 'pointer',
            filter: bubbleOpen ? 'none' : 'drop-shadow(0 2px 10px rgba(120,80,40,0.28))',
            transition: 'filter 0.3s ease',
            ...cfg.imgStyle,
          }}
          onClick={!bubbleOpen ? onClickImage : undefined}
        >
          <img
            src={cfg.imgSrc}
            alt="Félin, le lutin des forêts"
            style={{ width: cfg.imgWidth, height: 'auto', display: 'block', userSelect: 'none', pointerEvents: 'none' }}
          />
        </div>

      </div>
    </>
  )
}

// ─── Messages fallback pour WeekOneFlow ──────────────────────────────────────

export const LUTIN_MESSAGES_WEEK_ONE = {
  1: "Bienvenue. Je suis Félin, ton guide des forêts. Prends le temps de respirer... ton voyage intérieur commence ici.",
  2: "Te voilà de retour. Dans la forêt, les arbres les plus solides sont ceux qui reviennent toujours à leurs racines.",
  3: "Comme une plante qui cherche la lumière, tu t'orientes vers ce qui compte vraiment.",
  4: "À mi-chemin. Les feuilles captent la lumière même par temps couvert. Continue à te nourrir.",
  5: "Le souffle relie tout. Laisse-toi traverser par ce qui circule en toi.",
  6: "La fleur se prépare à s'ouvrir. Ce que tu as semé ces derniers jours prend forme.",
  7: "Dernier jour de cette semaine... Ce n'est pas une fin. C'est le début de quelque chose qui va fleurir.",
}
