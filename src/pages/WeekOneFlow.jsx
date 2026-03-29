// src/pages/WeekOneFlow.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../core/supabaseClient'

// ─────────────────────────────────────────────────────────────────────────────
// 1. Styles globaux — keyframes + responsive modal
// ─────────────────────────────────────────────────────────────────────────────

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

      @keyframes stepIn {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0);    }
      }
      @keyframes fleurFloat {
        0%,100% { transform: translateY(0px)   rotate(0deg);    }
        40%     { transform: translateY(-8px)  rotate(1.5deg);  }
        70%     { transform: translateY(-4px)  rotate(-0.8deg); }
      }
      @keyframes bloom {
        from { opacity: 0; transform: scale(0.25) rotate(-25deg); }
        65%  { opacity: 1; transform: scale(1.08) rotate(3deg);   }
        to   { opacity: 1; transform: scale(1)    rotate(0deg);   }
      }
      @keyframes petalIn {
        from { opacity: 0; transform: scale(0.3); }
        to   { opacity: 1; transform: scale(1);   }
      }

      .wof-in { animation: stepIn 400ms ease both; }
      .wof-fl { animation: fleurFloat 6s ease-in-out infinite; }

      .wof-backdrop {
        position: fixed; inset: 0;
        display: flex; align-items: center; justify-content: center;
        padding: 24px 16px;
        z-index: 10;
        overflow-y: auto;
      }
      .wof-modal {
        width: 100%;
        max-width: 560px;
        background: #faf5f2;
        border-radius: 24px;
        box-shadow: 0 24px 70px rgba(180,120,110,0.20);
        padding: 0;
        position: relative;
        min-height: 520px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      @media (max-width: 600px) {
        .wof-backdrop { padding: 0; align-items: stretch; }
        .wof-modal    { border-radius: 0; min-height: 100dvh; min-height: 100vh; }
      }
    `}</style>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Données : labels, couleurs zones, contenu des 7 jours
// ─────────────────────────────────────────────────────────────────────────────

const LABEL_MAP = {
  // Jour 1 — ressenti
  fatigue:       'Fatigué·e',
  stresse:       'Stressé·e',
  neutre:        'Neutre',
  calme:         'Calme',
  bien:          'Bien',
  // Jour 2 — énergie
  vide:          'Vide',
  basse:         'Basse',
  correcte:      'Correcte',
  bonne:         'Bonne',
  vive:          'Vive',
  // Jour 3 — espace
  travail:       'le travail',
  relations:     'les relations',
  corps:         'mon corps',
  pensees:       'mes pensées',
  avenir:        "l'avenir",
  // Jour 4 — besoin
  silence:       'du silence',
  mouvement:     'du mouvement',
  douceur:       'de la douceur',
  clarte:        'de la clarté',
  connexion:     'de la connexion',
  // Jour 5 — lien
  pas_vraiment:  'Pas vraiment',
  un_peu:        'Un peu',
  avec_quelquun: "avec quelqu'un",
  avec_moi:      'avec vous-même',
  profondement:  'Profondément',
  // Jour 6 — stress
  identique:     'identique',
  legere_moins:  'légèrement moins présent',
  moins_present: 'moins présent',
  beaucoup_moins:'beaucoup moins présent',
  different:     'différent',
  // Jour 7 — observation
  calme_plus:    'plus de calme',
  clarte_plus:   'plus de clarté',
  presence_plus: 'plus de présence',
  energie_plus:  "plus d'énergie",
  indefinissable:"quelque chose d'indéfinissable",
}

function labelFor(v) {
  return LABEL_MAP[v] || v || '…'
}

const ZONE_COLORS = {
  racines:  '#c8a0b0',
  tige:     '#9ab8c8',
  feuilles: '#7aaa88',
  fleurs:   '#d4a0b0',
  souffle:  '#c8a870',
}

export const WEEK_ONE_DATA = [
  /* ── JOUR 1 ─────────────────────────────────────────────────────────────── */
  {
    day: 1,
    title: 'Je commence',
    color: '#c8a0b0',
    accueil: {
      headline: "Vous êtes là. C'est suffisant pour aujourd'hui.",
      subtitle: 'Prenez une grande inspiration avant de continuer.',
      pauseSeconds: 3,
    },
    introspection: {
      question: 'Comment vous sentez-vous là, maintenant ?',
      answerKey: 'feel',
      choices: [
        { label: '😴 Fatigué·e', value: 'fatigue'  },
        { label: '😰 Stressé·e', value: 'stresse'  },
        { label: '😐 Neutre',    value: 'neutre'   },
        { label: '😌 Calme',     value: 'calme'    },
        { label: '🙂 Bien',      value: 'bien'     },
      ],
    },
    rituel: {
      zone: 'Racines',
      intro: "Les racines sont le fondement. Elles tiennent, même dans la tempête.",
      lines: [
        'Posez les pieds à plat sur le sol.',
        'Fermez les yeux si vous le souhaitez.',
        '',
        '3 cycles de respiration :',
        '• Inspirez… 4 temps',
        '• Retenez… 2 temps',
        '• Expirez… 6 temps',
      ],
      hasTimer: true,
      timerLabel: '3 cycles',
      timerDuration: 36,
    },
    getTrace: (ans) =>
      `Vous vous sentiez ${labelFor(ans?.j1?.feel)}. Et vous avez quand même pris ce moment.`,
    ouverture: 'Demain, vous découvrirez ce qui vous porte, même quand vous vacillez.',
  },

  /* ── JOUR 2 ─────────────────────────────────────────────────────────────── */
  {
    day: 2,
    title: 'Je reviens',
    color: '#9ab8c8',
    accueil: {
      headline: "Vous êtes revenu·e. Votre jardin s'en souvient.",
      subtitle: 'La continuité est une forme de soin.',
      pauseSeconds: 2,
      getPreviousNote: (ans) =>
        ans?.j1?.feel ? `Hier vous étiez : ${labelFor(ans.j1.feel)}` : null,
    },
    introspection: {
      question: 'Votre énergie ce matin est plutôt…',
      answerKey: 'energy',
      choices: [
        { label: '🪫 Vide',     value: 'vide'     },
        { label: '🔋 Basse',    value: 'basse'    },
        { label: '⚡ Correcte', value: 'correcte' },
        { label: '✨ Bonne',    value: 'bonne'    },
        { label: '🌟 Vive',     value: 'vive'     },
      ],
    },
    rituel: {
      zone: 'Tige',
      intro: "La tige relie les racines aux feuilles. Elle porte sans s'effondrer.",
      lines: [
        'Debout ou assis — sentez vos pieds contre le sol.',
        '',
        'Prenez 30 secondes pour simplement remarquer',
        'ce contact : sol, chaussure, peau.',
        '',
        "Rien d'autre à faire.",
      ],
      hasTimer: true,
      timerLabel: 'Contact conscient',
      timerDuration: 30,
    },
    getTrace: () =>
      "Vous avez été présent·e deux jours de suite. Votre tige commence à tenir.",
    ouverture: 'Juste revenir… suffit. À demain.',
  },

  /* ── JOUR 3 ─────────────────────────────────────────────────────────────── */
  {
    day: 3,
    title: 'Je me vois',
    color: '#7aaa88',
    accueil: {
      headline: 'Quelque chose commence à se dessiner.',
      subtitle: "Regarder sans juger — c'est déjà beaucoup.",
      pauseSeconds: 2,
      getNarrativeNote: (ans) => {
        const j1 = ans?.j1?.feel   ? labelFor(ans.j1.feel)   : null
        const j2 = ans?.j2?.energy ? labelFor(ans.j2.energy) : null
        if (!j1 && !j2) return null
        const parts = []
        if (j1) parts.push(`Il y a 2 jours vous étiez : ${j1}.`)
        if (j2) parts.push(`Hier votre énergie était : ${j2}.`)
        parts.push("Aujourd'hui…")
        return parts.join(' ')
      },
    },
    introspection: {
      question: "Qu'est-ce qui prend le plus de place en vous aujourd'hui ?",
      answerKey: 'space',
      choices: [
        { label: '💼 Le travail',    value: 'travail'   },
        { label: '🤝 Les relations', value: 'relations' },
        { label: '🧘 Mon corps',     value: 'corps'     },
        { label: '🌀 Mes pensées',   value: 'pensees'   },
        { label: "🔭 L'avenir",      value: 'avenir'    },
      ],
    },
    rituel: {
      zone: 'Feuilles',
      intro: "Les feuilles captent la lumière. Elles reçoivent sans retenir.",
      lines: [
        'Choisissez une émotion présente en ce moment.',
        'Nommez-la intérieurement.',
        '',
        "Observez-la comme si c'était un nuage qui passe.",
        'Ne cherchez pas à la modifier.',
        '',
        'Juste : observer.',
      ],
      hasTimer: true,
      timerLabel: 'Observation silencieuse',
      timerDuration: 60,
    },
    getTrace: () =>
      "Vous avez nommé quelque chose. C'est plus courageux qu'il n'y paraît.",
    ouverture: 'Demain, vous allez vous accorder quelque chose de rare.',
  },

  /* ── JOUR 4 ─────────────────────────────────────────────────────────────── */
  {
    day: 4,
    title: "Je m'accorde de l'espace",
    color: '#d4a0b0',
    accueil: {
      headline: 'Vous pouvez ralentir ici.',
      subtitle: 'Ce moment vous appartient entièrement.',
      pauseSeconds: 3,
    },
    introspection: {
      question: "De quoi auriez-vous besoin aujourd'hui ?",
      answerKey: 'need',
      choices: [
        { label: '🤫 De silence',   value: 'silence'   },
        { label: '🚶 De mouvement', value: 'mouvement' },
        { label: '🫶 De douceur',   value: 'douceur'   },
        { label: '💡 De clarté',    value: 'clarte'    },
        { label: '🌱 De connexion', value: 'connexion' },
      ],
    },
    rituel: {
      zone: 'Fleurs',
      intro: "Les fleurs s'ouvrent quand elles sont prêtes. Pas avant.",
      lines: [
        'Installez-vous confortablement.',
        '',
        'Scannez votre corps doucement, de la tête aux pieds.',
        'Remarquez les zones tendues, les zones douces.',
        '',
        'Ne cherchez pas à changer quoi que ce soit.',
        'Juste : passer en revue.',
      ],
      hasTimer: true,
      timerLabel: 'Scan corporel',
      timerDuration: 60,
    },
    getTrace: () =>
      "Vous venez de vous accorder de l'espace. Même peu… compte.",
    ouverture: 'Demain, quelque chose de nouveau entre dans votre jardin.',
  },

  /* ── JOUR 5 ─────────────────────────────────────────────────────────────── */
  {
    day: 5,
    title: 'Je crée un lien',
    color: '#c8a870',
    accueil: {
      headline: "Vous n'êtes pas seul·e aujourd'hui.",
      subtitle: 'Le lien commence souvent par un seul geste silencieux.',
      pauseSeconds: 2,
      showZoneBadges: true,
    },
    introspection: {
      question: 'Avez-vous ressenti du lien récemment ?',
      answerKey: 'connection',
      choices: [
        { label: '🫥 Pas vraiment',         value: 'pas_vraiment'  },
        { label: '🌿 Un peu',               value: 'un_peu'        },
        { label: "🤗 Oui, avec quelqu'un",  value: 'avec_quelquun' },
        { label: '💛 Oui, avec moi-même',   value: 'avec_moi'      },
        { label: '🌊 Profondément',          value: 'profondement'  },
      ],
    },
    rituel: {
      zone: 'Souffle',
      intro: "Le souffle relie l'intérieur à l'extérieur. Il traverse tout.",
      lines: [
        'Pensez à quelqu\'un — proche ou lointain.',
        '',
        'En silence, envoyez-lui une "pensée douce".',
        'Pas de mots nécessaires.',
        'Juste : la direction de votre attention.',
        '',
        '30 secondes de ce geste invisible.',
      ],
      hasTimer: true,
      timerLabel: 'Pensée douce',
      timerDuration: 30,
    },
    getTrace: () =>
      "Vous avez pris soin… au-delà de vous. Les 5 zones de votre jardin sont maintenant actives.",
    ouverture: "Demain, vous allez voir quelque chose que vous n'avez pas encore vu.",
  },

  /* ── JOUR 6 ─────────────────────────────────────────────────────────────── */
  {
    day: 6,
    title: 'Je prends conscience',
    color: '#b888a0',
    accueil: {
      headline: 'Regardez ce qui a changé, même légèrement.',
      subtitle: "La croissance est souvent invisible jusqu'au jour où elle ne l'est plus.",
      pauseSeconds: 3,
      showFlowerReveal: true,
    },
    introspection: {
      question: "Votre stress aujourd'hui comparé à il y a 6 jours est…",
      answerKey: 'stress',
      choices: [
        { label: '= Identique',        value: 'identique'      },
        { label: '↘ Légèrement moins', value: 'legere_moins'   },
        { label: '↓ Moins présent',    value: 'moins_present'  },
        { label: '⬇ Beaucoup moins',   value: 'beaucoup_moins' },
        { label: '~ Différent',        value: 'different'      },
      ],
    },
    rituel: {
      zone: 'Les 5 zones',
      intro: 'Toutes les zones sont maintenant actives. Ressentez-les ensemble.',
      lines: [
        'Respirez lentement.',
        '',
        'Portez votre attention successivement sur :',
        '• Vos pieds — racines',
        '• Votre colonne — tige',
        '• Votre poitrine — feuilles',
        '• Votre cœur — fleurs',
        '• Votre souffle — souffle',
        '',
        'Un cercle complet.',
      ],
      hasTimer: true,
      timerLabel: 'Cercle des 5 zones',
      timerDuration: 90,
    },
    getTrace: (ans, completedDays) => {
      const n = completedDays ? completedDays.length : 6
      return `Cette semaine, vous êtes revenu·e ${n} fois. Chaque zone nourrie est visible maintenant.`
    },
    ouverture: 'Demain, ce jardin devient vraiment le vôtre.',
  },

  /* ── JOUR 7 ─────────────────────────────────────────────────────────────── */
  {
    day: 7,
    title: 'Je fais partie',
    color: '#c8a0b0',
    gradient: 'linear-gradient(135deg, #c8a0b0 0%, #9ab8c8 35%, #7aaa88 65%, #c8a870 100%)',
    accueil: {
      headline: 'Cela fait déjà une semaine.',
      subtitle: 'Vous prenez soin de vous.',
      pauseSeconds: 3,
      showFlowerFull: true,
    },
    introspection: {
      question: "Qu'est-ce que vous remarquez chez vous ?",
      answerKey: 'notice',
      choices: [
        { label: '🌊 Plus de calme',                   value: 'calme_plus'     },
        { label: '💡 Plus de clarté',                  value: 'clarte_plus'    },
        { label: '🌱 Plus de présence',                value: 'presence_plus'  },
        { label: "⚡ Plus d'énergie",                  value: 'energie_plus'   },
        { label: "✨ Quelque chose d'indéfinissable",  value: 'indefinissable' },
      ],
    },
    rituel: {
      zone: 'Rituel libre',
      intro: 'Vous connaissez maintenant vos zones. Choisissez ce dont vous avez besoin.',
      isFreeChoice: true,
      freeChoices: [
        {
          label: 'Respiration',
          desc: '3 cycles · Racines',
          timerDuration: 36,
          lines: [
            'Posez les pieds au sol.',
            '',
            '• Inspirez… 4 temps',
            '• Retenez… 2 temps',
            '• Expirez… 6 temps',
          ],
        },
        {
          label: 'Ancrage',
          desc: 'Pieds au sol · Tige',
          timerDuration: 30,
          lines: [
            'Sentez le contact de vos pieds.',
            '',
            'Restez simplement présent·e',
            'à cette sensation pendant 30 secondes.',
          ],
        },
        {
          label: 'Pause consciente',
          desc: 'Corps et souffle · Fleurs',
          timerDuration: 60,
          lines: [
            'Scannez votre corps de la tête aux pieds.',
            '',
            'Puis revenez doucement au souffle.',
            "Laissez s'installer un silence intérieur.",
          ],
        },
      ],
    },
    getTrace: () =>
      "Il y a 7 jours, vous avez commencé. Aujourd'hui… vous êtes toujours là.",
    ouverture: null,
    isFinal: true,
    finalCTA: 'Entrer dans mon jardin',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// 3. Composants partagés
// ─────────────────────────────────────────────────────────────────────────────


// ── Bouton principal ───────────────────────────────────────────────────────

function PrimaryButton({ onClick, disabled, children, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: 'Jost, sans-serif',
        fontSize: 15,
        fontWeight: 500,
        letterSpacing: '0.04em',
        color: '#fff',
        background: disabled
          ? '#d8c8c4'
          : 'linear-gradient(135deg, #c8a0b0, #a07888)',
        border: 'none',
        borderRadius: 50,
        padding: '14px 40px',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'transform 0.15s ease, opacity 0.2s',
        ...style,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(1.03)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {children}
    </button>
  )
}

// ── Bouton retour ──────────────────────────────────────────────────────────

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'Jost, sans-serif',
        fontSize: 13,
        color: '#b09898',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 0 12px',
        letterSpacing: '0.02em',
      }}
    >
      ← Revenir
    </button>
  )
}

// ── Lumières organiques en fond ────────────────────────────────────────────

function OrganicLights() {
  const blobs = [
    { top: '8%',  left: '12%',             size: 300, color: '#e8c8c0', delay: '0s',   dur: '9s'  },
    { top: '55%', right: '8%', left: 'auto', size: 220, color: '#c8d8e0', delay: '2s',   dur: '11s' },
    { top: '38%', left: '55%',             size: 180, color: '#c8d8b8', delay: '1.5s', dur: '8s'  },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: b.top, left: b.left, right: b.right,
            width: b.size, height: b.size,
            borderRadius: '50%',
            background: b.color,
            opacity: 0.22,
            filter: 'blur(64px)',
            animation: `fleurFloat ${b.dur} ease-in-out infinite`,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  )
}

// ── Fleur SVG ──────────────────────────────────────────────────────────────

function FlowerSVG({ size = 140, animated = false, style: extraStyle }) {
  const petals = [
    { zone: 'racines',  color: ZONE_COLORS.racines,  angle: 270 },
    { zone: 'tige',     color: ZONE_COLORS.tige,     angle: 54  },
    { zone: 'feuilles', color: ZONE_COLORS.feuilles, angle: 126 },
    { zone: 'fleurs',   color: ZONE_COLORS.fleurs,   angle: 198 },
    { zone: 'souffle',  color: ZONE_COLORS.souffle,  angle: 342 },
  ]
  const cx      = size / 2
  const petalRx = size * 0.22
  const petalRy = size * 0.14
  const dist    = size * 0.28

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        display: 'block',
        ...(animated ? { animation: 'bloom 1.4s cubic-bezier(.25,.8,.25,1) both' } : {}),
        ...extraStyle,
      }}
    >
      {petals.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180
        const px  = cx + dist * Math.cos(rad)
        const py  = cx + dist * Math.sin(rad)
        return (
          <ellipse
            key={p.zone}
            cx={px}
            cy={py}
            rx={petalRx}
            ry={petalRy}
            fill={p.color}
            opacity={0.88}
            transform={`rotate(${p.angle + 90}, ${px}, ${py})`}
            style={animated ? {
              animation: 'petalIn 0.5s ease both',
              animationDelay: `${0.15 + i * 0.1}s`,
            } : {}}
          />
        )
      })}
      <circle cx={cx} cy={cx} r={size * 0.13} fill="#faf0e8" />
      <circle cx={cx} cy={cx} r={size * 0.08} fill="#ead8c8" />
    </svg>
  )
}


// ── Timer de rituel ────────────────────────────────────────────────────────

function RituelTimer({ duration, label, color, onComplete }) {
  const [started,   setStarted]   = useState(false)
  const [remaining, setRemaining] = useState(duration)
  const [done,      setDone]      = useState(false)
  const intervalRef = useRef(null)

  const CIRC = 2 * Math.PI * 40   // rayon 40

  function start() {
    setStarted(true)
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current)
          setDone(true)
          onComplete?.()
          return 0
        }
        return r - 1
      })
    }, 1000)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const progress    = started ? (duration - remaining) / duration : 0
  const dashOffset  = CIRC * (1 - progress)
  const mins        = Math.floor(remaining / 60)
  const secs        = remaining % 60
  const displayTime = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')}`
    : `${secs}s`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, margin: '20px 0' }}>
      <p style={{
        fontFamily: 'Jost, sans-serif',
        fontSize: 12,
        color: '#a09090',
        margin: 0,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        {label}
      </p>

      <div style={{ position: 'relative', width: 96, height: 96 }}>
        <svg width={96} height={96} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={48} cy={48} r={40} fill="none" stroke="#ede8e4" strokeWidth={5} />
          <circle
            cx={48} cy={48} r={40}
            fill="none"
            stroke={color || '#c8a0b0'}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {done ? (
            <span style={{ fontSize: 20, color: color || '#c8a0b0' }}>✓</span>
          ) : (
            <span style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: started ? 17 : 13,
              fontWeight: 300,
              color: '#806868',
            }}>
              {started ? displayTime : '—'}
            </span>
          )}
        </div>
      </div>

      {!started && (
        <button
          onClick={start}
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            color: color || '#c8a0b0',
            background: 'transparent',
            border: `1.5px solid ${color || '#c8a0b0'}`,
            borderRadius: 50,
            padding: '8px 24px',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
        >
          Commencer
        </button>
      )}

      {done && (
        <p style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 13,
          color: '#9a8888',
          margin: 0,
          fontStyle: 'italic',
        }}>
          Bien. Prenez un instant avant de continuer.
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Composants d'étapes
// ─────────────────────────────────────────────────────────────────────────────

// ── ACCUEIL ────────────────────────────────────────────────────────────────

function DayAccueil({ data, onNext }) {
  const [ctaReady,      setCtaReady]      = useState(false)
  const [flowerVisible, setFlowerVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setCtaReady(true), data.pauseSeconds * 1000)
    const t2 = (data.showFlowerReveal || data.showFlowerFull)
      ? setTimeout(() => setFlowerVisible(true), (data.pauseSeconds + 0.2) * 1000)
      : null
    return () => { clearTimeout(t1); if (t2) clearTimeout(t2) }
  }, [data.pauseSeconds, data.showFlowerReveal, data.showFlowerFull])


  return (
    <div className="wof-in" style={{ textAlign: 'center', padding: '28px 24px 16px' }}>
      <h1 style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 'clamp(22px, 5vw, 32px)',
        fontWeight: 400,
        color: '#000',
        lineHeight: 1.3,
        margin: '0 0 16px',
        letterSpacing: '-0.01em',
      }}>
        {data.headline}
      </h1>

      {(data.showFlowerReveal || data.showFlowerFull) && flowerVisible && (
        <div className="wof-in" style={{ margin: '20px auto' }}>
          <div className="wof-fl">
            <FlowerSVG size={data.showFlowerFull ? 160 : 140} animated />
          </div>
        </div>
      )}

      {ctaReady && (
        <div className="wof-in" style={{ marginTop: 28 }}>
          <PrimaryButton onClick={onNext}>
            {data.showFlowerReveal || data.showFlowerFull ? 'Continuer' : 'Je suis prêt·e'}
          </PrimaryButton>
        </div>
      )}
    </div>
  )
}

// ── INTROSPECTION ──────────────────────────────────────────────────────────

function DayIntrospection({ data, onAnswer, onBack }) {
  const [selected, setSelected] = useState(null)

  function confirm() {
    if (selected) onAnswer(data.answerKey, selected)
  }

  return (
    <div className="wof-in" style={{ padding: '8px 0 16px' }}>
      <BackButton onClick={onBack} />

      <h2 style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 'clamp(18px, 4.5vw, 24px)',
        fontWeight: 400,
        color: '#000',
        lineHeight: 1.45,
        margin: '8px 0 28px',
        textAlign: 'center',
      }}>
        {data.question}
      </h2>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
        marginBottom: 32,
      }}>
        {data.choices.map((c) => (
          <button
            key={c.value}
            onClick={() => setSelected(c.value)}
            style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 14,
              fontWeight: selected === c.value ? 500 : 300,
              color: selected === c.value ? '#fff' : '#5a4848',
              background: selected === c.value
                ? 'linear-gradient(135deg, #c8a0b0, #a07888)'
                : '#f0e8e4',
              border: 'none',
              borderRadius: 50,
              padding: '11px 22px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selected === c.value ? '0 4px 14px rgba(160,100,120,0.25)' : 'none',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <PrimaryButton onClick={confirm} disabled={!selected}>
          Continuer
        </PrimaryButton>
      </div>
    </div>
  )
}

// ── RITUEL ─────────────────────────────────────────────────────────────────

function DayRituel({ data, dayColor, onNext, onBack }) {
  const [freeChoice,    setFreeChoice]    = useState(null)
  const [choiceStarted, setChoiceStarted] = useState(false)
  const [timerDone,     setTimerDone]     = useState(false)

  const isFree       = !!data.isFreeChoice
  const activeLines  = isFree && freeChoice ? freeChoice.lines    : data.lines
  const activeDur    = isFree && freeChoice ? freeChoice.timerDuration : data.timerDuration
  const activeLabel  = isFree && freeChoice ? freeChoice.label    : data.timerLabel

  // Si rituel libre, on ne bloque pas tant qu'un choix n'est pas fait + timer démarré
  const canContinue  = isFree
    ? (!choiceStarted || timerDone)
    : (!data.hasTimer || timerDone)

  return (
    <div className="wof-in" style={{ padding: '8px 0 16px' }}>
      <BackButton onClick={onBack} />

      <p style={{
        fontFamily: 'Jost, sans-serif',
        fontSize: 11,
        fontWeight: 500,
        color: dayColor || '#c8a0b0',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        margin: '8px 0 6px',
        textAlign: 'center',
      }}>
        {data.zone}
      </p>

      <p style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 'clamp(15px, 3.5vw, 18px)',
        fontStyle: 'italic',
        color: '#000',
        textAlign: 'center',
        lineHeight: 1.65,
        margin: '0 0 20px',
      }}>
        {data.intro}
      </p>

      {/* Choix libre — Jour 7 */}
      {isFree && !choiceStarted && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {data.freeChoices.map((fc) => (
            <button
              key={fc.label}
              onClick={() => { setFreeChoice(fc); setChoiceStarted(true) }}
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: 14,
                color: '#000',
                background: '#f4eee8',
                border: 'none',
                borderRadius: 14,
                padding: '14px 20px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ede4de' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f4eee8' }}
            >
              <span style={{ fontWeight: 500 }}>{fc.label}</span>
              <span style={{ fontSize: 12, color: '#a09090' }}>{fc.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Lignes d'instructions */}
      {(!isFree || choiceStarted) && activeLines && (
        <div style={{
          background: '#f4eee8',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 20,
        }}>
          {activeLines.map((line, i) =>
            line === '' ? (
              <div key={i} style={{ height: 7 }} />
            ) : (
              <p key={i} style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: 14,
                fontWeight: 300,
                color: '#000',
                lineHeight: 1.75,
                margin: 0,
              }}>
                {line}
              </p>
            )
          )}
        </div>
      )}

      {/* Timer */}
      {(!isFree || choiceStarted) && data.hasTimer && (
        <RituelTimer
          duration={activeDur}
          label={activeLabel}
          color={dayColor}
          onComplete={() => setTimerDone(true)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <PrimaryButton onClick={onNext} disabled={!canContinue && choiceStarted}>
          Continuer
        </PrimaryButton>
      </div>
    </div>
  )
}

// ── TRACE ──────────────────────────────────────────────────────────────────

function DayTrace({ text, onNext, onBack }) {
  return (
    <div className="wof-in" style={{ padding: '8px 0 16px', textAlign: 'center' }}>
      <BackButton onClick={onBack} />

      <div style={{
        margin: '16px auto 0',
        maxWidth: 380,
        padding: '26px 28px',
        background: 'linear-gradient(145deg, #f8f0ec, #f0e8e4)',
        borderRadius: 18,
        boxShadow: '0 8px 28px rgba(180,120,110,0.13)',
      }}>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(17px, 4vw, 21px)',
          fontWeight: 400,
          fontStyle: 'italic',
          color: '#000',
          lineHeight: 1.7,
          margin: 0,
        }}>
          "{text}"
        </p>
      </div>

      <div style={{ marginTop: 32 }}>
        <PrimaryButton onClick={onNext}>Continuer</PrimaryButton>
      </div>
    </div>
  )
}

// ── OUVERTURE ──────────────────────────────────────────────────────────────

function DayOuverture({ text, isFinal, ctaLabel, onNext, onBack }) {
  return (
    <div className="wof-in" style={{ padding: '8px 0 16px', textAlign: 'center' }}>
      <BackButton onClick={onBack} />

      {isFinal ? (
        <>
          <div className="wof-fl" style={{ margin: '20px auto 20px', display: 'flex', justifyContent: 'center' }}>
            <FlowerSVG size={110} animated={false} />
          </div>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(18px, 4.5vw, 24px)',
            fontWeight: 400,
            color: '#000',
            lineHeight: 1.5,
            margin: '0 0 10px',
          }}>
            Ce jardin peut continuer à grandir avec vous.
          </h2>
          <p style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 14,
            fontWeight: 300,
            color: '#000',
            lineHeight: 1.65,
            margin: '0 0 36px',
          }}>
            Votre fleur vous attend.
          </p>
        </>
      ) : (
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(17px, 4vw, 22px)',
          fontStyle: 'italic',
          color: '#000',
          lineHeight: 1.7,
          margin: '20px 0 36px',
        }}>
          {text}
        </p>
      )}

      <PrimaryButton onClick={onNext}>
        {isFinal ? ctaLabel : 'À demain'}
      </PrimaryButton>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. DayShell — orchestre les 5 étapes d'un jour
// ─────────────────────────────────────────────────────────────────────────────

function DayShell({ dayIndex, answers, completedDays, onDayComplete }) {
  const [step, setStep] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  const dayConfig = WEEK_ONE_DATA[dayIndex]

  function advance() {
    setStep((s) => s + 1)
    setAnimKey((k) => k + 1)
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1))
    setAnimKey((k) => k + 1)
  }

  function handleAnswer(answerKey, value) {
    onDayComplete({ type: 'answer', dayKey: `j${dayConfig.day}`, answerKey, value })
    advance()
  }

  function handleDayDone() {
    onDayComplete({ type: 'complete' })
  }

  // Pour le getTrace de J6, on passe les jours complétés en incluant le jour courant
  const completedWithCurrent = completedDays.includes(dayConfig.day)
    ? completedDays
    : [...completedDays, dayConfig.day]

  const traceText = dayConfig.getTrace(answers, completedWithCurrent)

  return (
    <div key={animKey}>
      {step === 0 && (
        <DayAccueil
          data={dayConfig.accueil}
          answers={answers}
          onNext={advance}
        />
      )}
      {step === 1 && (
        <DayIntrospection
          data={dayConfig.introspection}
          onAnswer={handleAnswer}
          onBack={goBack}
        />
      )}
      {step === 2 && (
        <DayRituel
          data={dayConfig.rituel}
          dayColor={dayConfig.color}
          onNext={advance}
          onBack={goBack}
        />
      )}
      {step === 3 && (
        <DayTrace
          text={traceText}
          onNext={advance}
          onBack={goBack}
        />
      )}
      {step === 4 && (
        <DayOuverture
          text={dayConfig.ouverture}
          isFinal={!!dayConfig.isFinal}
          ctaLabel={dayConfig.finalCTA}
          onNext={handleDayDone}
          onBack={goBack}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. WeekOneFlow — export principal
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_WEEK_DATA = {
  currentDay:    1,
  completedDays: [],
  answers:       {},
  startDate:     new Date().toISOString().split('T')[0],
}

export function WeekOneFlow({ userId, onComplete }) {
  const [loading,  setLoading]  = useState(true)
  const [weekData, setWeekData] = useState(INITIAL_WEEK_DATA)
  const weekDataRef = useRef(INITIAL_WEEK_DATA)

  // Chargement depuis Supabase
  useEffect(() => {
    if (!userId) { setLoading(false); return }
    ;(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('week_one_data')
        .eq('id', userId)
        .single()

      if (!error && data?.week_one_data) {
        const saved = data.week_one_data
        setWeekData(saved)
        weekDataRef.current = saved
      }
      setLoading(false)
    })()
  }, [userId])

  // Sauvegarde dans Supabase
  const saveWeekData = useCallback(async (updated) => {
    weekDataRef.current = updated
    setWeekData(updated)
    if (!userId) return
    await supabase
      .from('profiles')
      .update({ week_one_data: updated })
      .eq('id', userId)
  }, [userId])

  async function handleDayEvent(event) {
    const current = weekDataRef.current

    if (event.type === 'answer') {
      const updated = {
        ...current,
        answers: {
          ...current.answers,
          [event.dayKey]: {
            ...(current.answers[event.dayKey] || {}),
            [event.answerKey]: event.value,
          },
        },
      }
      await saveWeekData(updated)
    }

    if (event.type === 'complete') {
      const dayNum  = current.currentDay
      const nextDay = Math.min(dayNum + 1, 7)
      const updated = {
        ...current,
        currentDay:    nextDay,
        completedDays: current.completedDays.includes(dayNum)
          ? current.completedDays
          : [...current.completedDays, dayNum],
      }
      await saveWeekData(updated)

      if (dayNum === 7) {
        onComplete?.()
      }
    }
  }

  // ── Écran de chargement ────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <GlobalStyles />
        <div style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(160deg, #f8f0ec, #e8d8d0)',
        }}>
          <p style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 14,
            fontWeight: 300,
            color: '#a09090',
            letterSpacing: '0.04em',
          }}>
            Votre jardin se prépare…
          </p>
        </div>
      </>
    )
  }

  const dayIndex      = Math.min(Math.max((weekData.currentDay || 1) - 1, 0), 6)
  const currentConfig = WEEK_ONE_DATA[dayIndex]
  const accentColor   = currentConfig.color || '#c8a0b0'

  // ── Rendu principal ────────────────────────────────────────────────────

  const isMobile = window.innerWidth < 600

  return (
    <>
      <GlobalStyles />

      {/* Fond desktop */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(160deg, #f8f0ec, #e8d8d0)',
        zIndex: 1,
      }} />

      <OrganicLights />

      {/* Conteneur modal */}
      <div className="wof-backdrop" style={{ zIndex: 10 }}>
        <div className="wof-modal">

          {/* ── Image hero — même design que SlidesEducatives ── */}
          <div style={{
            flexShrink: 0,
            height: isMobile ? '36%' : '40%',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src="/champs.png"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }}
            />

            {/* Fondu bas */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 50%, #faf5f2 100%)',
              pointerEvents: 'none',
            }}/>

            {/* Barre de progression en overlay haut */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', gap: 3 }}>
              {WEEK_ONE_DATA.map((d) => {
                const done   = weekData.completedDays.includes(d.day)
                const active = d.day === weekData.currentDay
                return (
                  <div key={d.day} style={{
                    flex: 1, height: 3,
                    background: done ? (d.color || accentColor) : active ? `${d.color || accentColor}88` : 'rgba(255,255,255,0.35)',
                    transition: 'background .4s ease',
                  }}>
                    {active && <div style={{ height: '100%', background: d.color || accentColor, animation: 'progressBar .3s ease both' }}/>}
                  </div>
                )
              })}
            </div>

            {/* Tag jour + compteur en overlay bas */}
            <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase',
                color: accentColor, fontWeight: 600, padding: '4px 12px', borderRadius: 100,
                background: 'rgba(255,255,255,0.82)', border: `1px solid ${accentColor}40`,
                backdropFilter: 'blur(6px)', fontFamily: 'Jost, sans-serif',
              }}>
                {currentConfig.title}
              </span>
              <span style={{
                fontSize: 11, color: 'rgba(60,50,40,0.55)', letterSpacing: '.08em',
                background: 'rgba(255,255,255,0.70)', padding: '3px 10px', borderRadius: 100,
                backdropFilter: 'blur(4px)', fontFamily: 'Jost, sans-serif',
              }}>
                {String(weekData.currentDay).padStart(2,'0')} / 07
              </span>
            </div>
          </div>

          {/* ── Contenu du jour (scrollable) ── */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <DayShell
              key={weekData.currentDay}
              dayIndex={dayIndex}
              answers={weekData.answers}
              completedDays={weekData.completedDays}
              onDayComplete={handleDayEvent}
            />
          </div>

        </div>
      </div>
    </>
  )
}
