// ─────────────────────────────────────────────────────────────────────────────
//  HelpModal.jsx  —  Guide de découverte de l'application
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'

const STEPS = [
  {
    icon: '🌸',
    title: 'Ma Fleur',
    subtitle: 'Votre espace personnel',
    description: 'Chaque jour, prenez soin de votre jardin intérieur en complétant vos rituels quotidiens. Chaque attention à vous-même nourrit vos zones de vie — racines, tige, feuilles, fleurs et souffle.',
    tip: '💡 Complétez au moins un rituel par jour pour maintenir votre vitalité.',
    color: 'rgba(232,192,96,0.15)',
    border: 'rgba(232,192,96,0.30)',
    accent: '#e8c060',
  },
  {
    icon: '🌻',
    title: 'Jardin Collectif',
    subtitle: 'La communauté en fleurs',
    description: 'Découvrez les fleurs des autres membres de la communauté. Vous faites partie de cet ensemble, nous sommes reliés les uns aux autres, et grâce à la bienveillance des uns pour les autres nous grandissons.',
    tip: '💡 Activez votre visibilité dans votre profil pour apparaître dans le jardin.',
    color: 'rgba(150,212,133,0.12)',
    border: 'rgba(150,212,133,0.28)',
    accent: '#96d485',
  },
  {
    icon: '🪴',
    title: 'Club des Jardiniers',
    subtitle: 'Partageons nos bonnes ondes',
    description: 'Rejoignez un véritable réseau autour de la bienveillance et de l\'évolution de chacun. Ici, vous pourrez nourrir l\'égrégore créé autour d\'une énergie positive et collective. Vous pourrez soutenir l\'effort de chaque personne dans l\'établissement de leur ritualisation vers un mieux-être et enfin créer un véritable bouquet de fleurs en tissant des liens d\'intentions positives.',
    tip: '💡 Rejoignez un cercle avec un code d\'invitation ou créez le vôtre.',
    color: 'rgba(180,150,220,0.12)',
    border: 'rgba(180,150,220,0.28)',
    accent: '#b496dc',
  },
  {
    icon: '🌿',
    title: 'Ateliers',
    subtitle: 'Approfondissez votre pratique',
    description: 'Accédez à des séances en visio, des groupes de parole, à des contenus guidés, méditations et ateliers audio pour accompagner votre croissance intérieure au quotidien.',
    tip: '💡 Les ateliers sont disponibles avec un abonnement actif.',
    color: 'rgba(100,180,160,0.12)',
    border: 'rgba(100,180,160,0.28)',
    accent: '#64b4a0',
  },
  {
    icon: '✨',
    title: 'Défis',
    subtitle: 'Grandissez ensemble',
    description: 'Participez aux défis collectifs de la communauté. Chaque défi est une invitation à explorer une nouvelle intention, partagée avec des centaines de jardiniers.',
    tip: '💡 Vous pouvez aussi proposer vos propres défis à la communauté.',
    color: 'rgba(232,192,96,0.12)',
    border: 'rgba(232,192,96,0.25)',
    accent: '#e8c060',
  },
  {
    icon: '✦',
    title: 'Lumens',
    subtitle: 'Votre lumière intérieure',
    description: 'Les Lumens mesurent votre rayonnement dans la communauté. Vous en gagnez en complétant des rituels, en participant aux défis et en interagissant au quotidien dans cette aventure vers le mieux-être. Votre aura grandit avec vous.',
    tip: '💡 Consultez vos Lumens depuis le bandeau doré en bas de l\'écran.',
    color: 'rgba(255,220,100,0.10)',
    border: 'rgba(255,220,100,0.25)',
    accent: '#ffd864',
  },
]

export function HelpModal({ onClose }) {
  const [step, setStep] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState(1)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function goTo(next, dir = 1) {
    if (animating) return
    setAnimating(true)
    setDirection(dir)
    setTimeout(() => {
      setStep(next)
      setAnimating(false)
    }, 220)
  }

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const current = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div
      onClick={e => e.target === e.currentTarget && handleClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        padding: '20px 16px',
        opacity: visible ? 1 : 0,
        transition: 'opacity .28s ease',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'linear-gradient(160deg, #1a2e1a 0%, #0f1f12 100%)',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.04) inset',
        overflow: 'hidden',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        transition: 'transform .28s cubic-bezier(.16,1,.3,1), opacity .28s ease',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '20px 22px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 13, color: 'rgba(232,192,96,0.70)',
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            Guide de découverte
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 30, height: 30, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.07)', color: 'rgba(242,237,224,0.5)',
              cursor: 'pointer', fontSize: 14, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'background .2s, color .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'rgba(242,237,224,0.9)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(242,237,224,0.5)' }}
          >✕</button>
        </div>

        {/* ── Barre de progression ── */}
        <div style={{ padding: '14px 22px 0', display: 'flex', gap: 5 }}>
          {STEPS.map((s, i) => (
            <div
              key={i}
              onClick={() => goTo(i, i > step ? 1 : -1)}
              style={{
                flex: 1, height: 3, borderRadius: 100, cursor: 'pointer',
                background: i <= step ? current.accent : 'rgba(255,255,255,0.10)',
                transition: 'background .35s ease',
              }}
            />
          ))}
        </div>

        {/* ── Contenu principal ── */}
        <div style={{
          padding: '28px 26px 24px',
          opacity: animating ? 0 : 1,
          transform: animating
            ? `translateX(${direction * 28}px)`
            : 'translateX(0)',
          transition: animating ? 'none' : 'opacity .22s ease, transform .22s cubic-bezier(.16,1,.3,1)',
        }}>
          {/* Icône + titre */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18, flexShrink: 0,
              background: current.color,
              border: `1px solid ${current.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
              boxShadow: `0 8px 24px ${current.color}`,
            }}>
              {current.icon}
            </div>
            <div>
              <div style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 26, fontWeight: 400,
                color: 'var(--cream, #f2ede0)', lineHeight: 1.1,
              }}>
                {current.title}
              </div>
              <div style={{
                fontSize: 12, color: current.accent,
                marginTop: 3, letterSpacing: '0.04em',
              }}>
                {current.subtitle}
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{
            fontSize: 14, color: 'rgba(242,237,224,0.75)',
            lineHeight: 1.75, marginBottom: 16,
          }}>
            {current.description}
          </div>

          {/* Tip */}
          <div style={{
            padding: '11px 14px',
            background: current.color,
            border: `1px solid ${current.border}`,
            borderRadius: 10,
            fontSize: 12, color: 'rgba(242,237,224,0.65)',
            lineHeight: 1.55,
          }}>
            {current.tip}
          </div>
        </div>

        {/* ── Navigation ── */}
        <div style={{
          padding: '0 22px 24px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {/* Précédent */}
          <button
            onClick={() => step > 0 && goTo(step - 1, -1)}
            disabled={step === 0}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.05)', color: 'rgba(242,237,224,0.6)',
              cursor: step === 0 ? 'not-allowed' : 'pointer',
              opacity: step === 0 ? 0.35 : 1,
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .2s', flexShrink: 0,
            }}
          >‹</button>

          {/* Compteur */}
          <div style={{
            flex: 1, textAlign: 'center',
            fontSize: 11, color: 'rgba(242,237,224,0.30)',
            letterSpacing: '0.08em',
          }}>
            {step + 1} / {STEPS.length}
          </div>

          {/* Suivant / Terminer */}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => goTo(step + 1, 1)}
              style={{
                padding: '10px 22px', borderRadius: 100,
                border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${current.accent}, rgba(150,212,133,0.9))`,
                color: '#0f1f12', fontSize: 13, fontWeight: 600,
                letterSpacing: '0.03em',
                boxShadow: `0 4px 16px ${current.color}`,
                transition: 'all .2s', flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Suivant ›
            </button>
          ) : (
            <button
              onClick={handleClose}
              style={{
                padding: '10px 22px', borderRadius: 100,
                border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #e8c060, #96d485)',
                color: '#0f1f12', fontSize: 13, fontWeight: 600,
                letterSpacing: '0.03em',
                boxShadow: '0 4px 16px rgba(232,192,96,0.25)',
                transition: 'all .2s', flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              C'est parti 🌱
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
