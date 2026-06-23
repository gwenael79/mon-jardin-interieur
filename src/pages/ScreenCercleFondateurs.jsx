// ─────────────────────────────────────────────────────────────────────────────
//  ScreenCercleFondateurs.jsx — Le Cercle qui nous porte — V4
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../hooks/useAuth'

// Hook mobile autonome — pas de dépendance à dashboardShared
function useIsMobile() {
  const [mob, setMob] = useState(() => window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setMob(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mob
}

// Scan automatique de /public/fondateurs/ — images état vide
const _fleurGlob = import.meta.glob('/public/fondateurs/*.{png,jpg,jpeg,webp}', { eager: true, as: 'url' })
const FLEUR_IMAGES = Object.entries(_fleurGlob)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([key, url]) => (typeof url === 'string' && url.startsWith('/public') ? url.replace('/public', '') : url))

// Scan automatique de /public/fondateurs/exemple/ — choix de fleur pour le client
const _exempleGlob = import.meta.glob('/public/fondateurs/exemple/*.{png,jpg,jpeg,webp}', { eager: true, as: 'url' })
const FLEUR_CHOIX = Object.entries(_exempleGlob)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([key, url]) => (typeof url === 'string' && url.startsWith('/public') ? url.replace('/public', '') : url))

// ─────────────────────────────────────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────────────────────────────────────
const CERCLE_CSS = `
  @keyframes cfTicker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  .cf-ticker-track { display: flex; animation: cfTicker 28s linear infinite; width: max-content; }
  .cf-ticker-track:hover { animation-play-state: paused; }

  /* ── Mobile ── */
  @media (max-width: 480px) {
    .cf-tier-outer { height: auto !important; min-height: 160px; }
    .cf-card:hover { transform: none; }
  }

  @keyframes cfFadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cfBloom  { from{opacity:0;transform:scale(.58) rotate(-16deg)} to{opacity:1;transform:scale(1) rotate(0)} }
  @keyframes cfFloat  { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(4deg)} }
  @keyframes cfPulse  { 0%,100%{opacity:.60;transform:scale(.95)} 50%{opacity:1;transform:scale(1.05)} }
  @keyframes cfSlideIn{ from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  .cf-card {
    animation: cfFadeUp .40s ease both;
    transition: transform .26s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease;
  }
  .cf-card:hover { transform: translateY(-6px) scale(1.025); }

  .cf-fleur {
    animation: cfBloom .50s cubic-bezier(.34,1.56,.64,1) both;
    transition: transform .32s cubic-bezier(.34,1.56,.64,1);
    display: block;
  }
  .cf-card:hover .cf-fleur { transform: rotate(16deg) scale(1.12); }
  .cf-hero-fleur { animation: cfFloat 3.6s ease-in-out infinite; }

  .cf-cta-btn {
    transition: transform .16s ease, box-shadow .16s ease, filter .16s ease;
  }
  .cf-cta-btn:hover { transform:translateY(-3px); filter:brightness(1.07); }
  .cf-cta-btn:active { transform:translateY(0); }

  /* ── Carte flip ── */
  .cf-tier-outer {
    perspective: 900px;
    cursor: pointer;
    height: 270px;
  }
  .cf-tier-inner {
    position: relative;
    width: 100%; height: 100%;
    transform-style: preserve-3d;
    transition: transform .55s cubic-bezier(.4,0,.2,1);
  }
  .cf-tier-inner.flipped { transform: rotateY(180deg); }
  .cf-tier-face {
    position: absolute; inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 18px;
    overflow: hidden;
  }
  .cf-tier-back {
    transform: rotateY(180deg);
  }

  /* ── Slider ── */
  .cf-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    transition: opacity .15s;
  }
  .cf-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 26px; height: 26px;
    border-radius: 50%;
    border: 3px solid #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,.22);
    cursor: grab;
    transition: transform .15s;
  }
  .cf-slider::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.15); }
  .cf-slider::-moz-range-thumb {
    width: 26px; height: 26px;
    border-radius: 50%;
    border: 3px solid #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,.22);
    cursor: grab;
  }

  /* ── Form fields ── */
  .cf-input {
    width: 100%;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1.5px solid rgba(200,178,168,.35);
    background: #fff;
    font-family: 'Jost', sans-serif;
    font-size: 16px;
    color: #1a1208;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
    box-sizing: border-box;
  }
  .cf-input:focus {
    border-color: rgba(74,124,69,.55);
    box-shadow: 0 0 0 3px rgba(74,124,69,.12);
  }
  .cf-input::placeholder { color: rgba(30,20,8,.32); }

  .cf-label {
    display: block;
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .05em;
    text-transform: uppercase;
    color: rgba(30,20,8,.55);
    margin-bottom: 6px;
  }
`

// ─────────────────────────────────────────────────────────────────────────────
//  DONNÉES
// ─────────────────────────────────────────────────────────────────────────────
const LEVEL_LABEL = { graine:'Un geste doux', ami:'Ami du Jardin', compagnon:'Compagnon de route', fondateur:'Fondateur' }
const LEVEL_ICON  = { graine:'🌸', ami:'🌱', compagnon:'🌿', fondateur:'🌳' }
const LEVEL_COLOR = { graine:'#c07898', ami:'#7ea870', compagnon:'#4a7c45', fondateur:'#2D5F3F' }

const PETAL_PALETTE = {
  graine:    ['#f4b4c8','#f0c0d8','#f8d0e0','#f4c0b0','#eeb8d0','#f0d0e8','#f8c8d8'],
  ami:       ['#f4b4c8','#a8d5b0','#f5e396','#c2def0','#dbb4f0','#f0d2a0','#f4c8a8'],
  compagnon: ['#7ea870','#a898b0','#c47a60','#6aa0b0','#a89a5a','#987898','#5a9890'],
  fondateur: ['#3a6c3f','#6a3a6c','#b08030','#484878','#8a3a30','#3a6870','#6a5830'],
}

const TIERS_DETAIL = [
  {
    niveau: 'graine', icon: '🌸', label: 'Un geste doux', range: '10€ à 100€',
    avantages: [
      'Accès à l\'appli (plan Free)',
      '**−50% de remise sur le Premium (12 mois)',
      'Accès au Jardin collectif',
      'Accès aux 120 rituels',
      'Nom dans les remerciements',
      'Badge "Soutien" dans le profil',
    ],
  },
  {
    niveau: 'ami', icon: '🌱', label: 'Ami du Jardin', range: '150€ à 249€',
    avantages: [
      '**Accès Premium offert',
      'Nom dans le Cercle des fondateurs',
      'Badge "Ami du Jardin" dans le profil',
    ],
  },
  {
    niveau: 'compagnon', icon: '🍃', label: 'Compagnon de route', range: '250€ à 499€',
    avantages: [
      'Accès Premium offert',
      'Nom dans le Cercle des fondateurs',
      'Citation gravée (message + nom)',
      '**−50% sur tous les ateliers',
      'Accès anticipé aux nouvelles fonctionnalités (bêta)',
      'Badge "Compagnon" dans le profil',
    ],
  },
  {
    niveau: 'fondateur', icon: '🌳', label: 'Fondateur', range: '500€ à 2000€',
    avantages: [
      'Accès Premium offert',
      'Nom dans le Cercle des fondateurs',
      '**−50% sur tous les ateliers et sur la jardinothèque',
      'Accès prioritaire au support',
      'Badge "Fondateur" exclusif dans le profil',
      'Participation exclusive aux évolutions à venir',
    ],
  },
]

const TIERS = [
  {
    niveau: 'graine', icon: '🌸', label: 'Un geste doux',
    range: '10€ – 100€', min: 10, max: 100, step: 1, defaultMontant: 30,
    avantages: ['−50% sur le Premium', 'Jardin collectif', '120 rituels'],
    desc: '−50% Premium · Jardin collectif · 120 rituels',
  },
  {
    niveau: 'ami', icon: '🌱', label: 'Ami du Jardin',
    range: '150€ – 249€', min: 150, max: 249, step: 1, defaultMontant: 180,
    avantages: ['Premium offert', 'Nom dans le Cercle'],
    desc: 'Premium offert · Nom dans le Cercle',
  },
  {
    niveau: 'compagnon', icon: '🌿', label: 'Compagnon de route',
    range: '250€ – 499€', min: 250, max: 499, step: 1, defaultMontant: 350,
    avantages: ['Premium offert', 'Citation gravée · −50% ateliers'],
    desc: 'Premium · Citation gravée · −50% ateliers',
    highlighted: true,
  },
  {
    niveau: 'fondateur', icon: '🌳', label: 'Fondateur',
    range: '500€ – 2000€', min: 500, max: 2000, step: 50, defaultMontant: 800,
    avantages: ['Premium offert', 'Badge Fondateur exclusif'],
    desc: 'Premium · Citation · Badge exclusif · Priorité support',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS COULEUR
// ─────────────────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = (hex||'#e8789a').replace('#','')
  if (h.length < 6) return [232,120,154]
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
}
function lighten(hex, t) {
  const [r,g,b] = hexToRgb(hex)
  return `rgb(${Math.round(r+(255-r)*t)},${Math.round(g+(255-g)*t)},${Math.round(b+(255-b)*t)})`
}
function darken(hex, t) {
  const [r,g,b] = hexToRgb(hex)
  return `rgb(${Math.round(r*(1-t))},${Math.round(g*(1-t))},${Math.round(b*(1-t))})`
}
function rgba(hex, a) {
  const [r,g,b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}
function getPetalColor(f) {
  if (f.couleur_petale) return f.couleur_petale
  const p = PETAL_PALETTE[f.niveau] ?? PETAL_PALETTE.ami
  return p[(f.fleur_variant - 1) % p.length]
}

// ─────────────────────────────────────────────────────────────────────────────
//  FLEUR SVG — Pétales en courbes de Bézier organiques
// ─────────────────────────────────────────────────────────────────────────────
const FLOWER_CFG = [
  [5,  42,  9, 0.45, 0,  0   ],
  [5,  48,  6, 0.42, 0,  0   ],
  [8,  38,  5, 0.40, 0,  0   ],
  [4,  40, 13, 0.48, 0,  0   ],
  [12, 34,  4, 0.38, 0,  0   ],
  [3,  44, 12, 0.50, 0,  0   ],
  [5,  42,  8, 0.43, 5,  0.55],
  [6,  40,  8, 0.44, 0,  0   ],
  [5,  38, 10, 0.46, 0,  0   ],
  [7,  36,  6, 0.41, 0,  0   ],
  [4,  44, 14, 0.50, 4,  0.58],
  [6,  40,  7, 0.43, 6,  0.50],
]

let _cfN = 0

function FleurSVG({ variant = 1, color = '#e8789a', size = 96 }) {
  const uid = useRef('cf' + (++_cfN)).current
  const [np, len, wid, ctrl, innerNp, innerScale] = FLOWER_CFG[(variant - 1) % 12]
  const cx = 50, cy = 50
  const pd = (L, W, C) => {
    const c1 = Math.round(C * L), c2 = Math.round((1 - C) * L)
    return `M 0,0 C ${-W},${-c1} ${-W},${-c2} 0,${-L} C ${W},${-c2} ${W},${-c1} 0,0`
  }
  const lighter = lighten(color, 0.44), darker = darken(color, 0.22), mid = lighten(color, 0.22)
  const cR = np <= 5 ? 5.5 : np <= 8 ? 5.0 : 4.5
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="cf-fleur">
      <defs>
        <radialGradient id={`${uid}-go`} cx="50%" cy="28%" r="72%">
          <stop offset="0%" stopColor={lighter}/><stop offset="100%" stopColor={color}/>
        </radialGradient>
        <radialGradient id={`${uid}-gi`} cx="50%" cy="28%" r="72%">
          <stop offset="0%" stopColor={mid}/><stop offset="100%" stopColor={darken(color, 0.08)}/>
        </radialGradient>
        <filter id={`${uid}-sh`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.22"/>
        </filter>
      </defs>
      {Array.from({ length: np }, (_, i) => (
        <path key={`o${i}`} d={pd(len, wid, ctrl)} fill={`url(#${uid}-go)`}
          stroke={darker} strokeWidth="0.28" opacity="0.94" filter={`url(#${uid}-sh)`}
          transform={`translate(${cx},${cy}) rotate(${(i * 360) / np})`}/>
      ))}
      {innerNp > 0 && Array.from({ length: innerNp }, (_, i) => (
        <path key={`i${i}`} d={pd(len * innerScale, wid * 0.85, ctrl + 0.02)}
          fill={`url(#${uid}-gi)`} stroke={darken(color, 0.10)} strokeWidth="0.20" opacity="0.90"
          transform={`translate(${cx},${cy}) rotate(${(i * 360) / innerNp + 360 / (innerNp * 2)})`}/>
      ))}
      <circle cx={cx} cy={cy} r={cR + 2.5} fill={darker} opacity="0.45"/>
      <circle cx={cx} cy={cy} r={cR}        fill="rgba(255,255,255,.92)"/>
      <circle cx={cx} cy={cy} r={cR * .40}  fill={color}  opacity="0.76"/>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  COURONNE BOTANIQUE (modale)
// ─────────────────────────────────────────────────────────────────────────────
function CouronneBotanique({ size = 90 }) {
  const n = 16, R = 38
  const leafD = 'M 0,0 C -3,-5 -3,-11 0,-14 C 3,-11 3,-5 0,0'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const angle = (i * 360) / n
        const rad = (angle - 90) * Math.PI / 180
        return <path key={i} d={leafD} fill="#4a7c45" opacity={0.55 + (i%2)*0.12}
          transform={`translate(${50 + R*Math.cos(rad)},${50 + R*Math.sin(rad)}) rotate(${angle})`}/>
      })}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 360) / 8 + 22.5, rad = (angle - 90) * Math.PI / 180, r2 = 26
        return <path key={i} d='M 0,0 C -2,-4 -2,-8 0,-10 C 2,-8 2,-4 0,0' fill="#6a9a5a" opacity="0.40"
          transform={`translate(${50 + r2*Math.cos(rad)},${50 + r2*Math.sin(rad)}) rotate(${angle})`}/>
      })}
      <g transform="translate(50,50)">
        {[0,72,144,216,288].map((a,i) => <path key={i} d='M 0,0 C -4,-5 -4,-10 0,-13 C 4,-10 4,-5 0,0'
          fill="#5a9a40" opacity="0.70" transform={`rotate(${a}) translate(0,-4)`}/>)}
        <circle r="3.5" fill="#4a7c45" opacity="0.80"/>
        <circle r="2"   fill="rgba(255,255,255,.85)"/>
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  BANDEAU CITATIONS DÉFILANT
// ─────────────────────────────────────────────────────────────────────────────
function BandeauCitations({ fondateurs }) {
  const avecCitation = fondateurs.filter(f => f.citation?.trim())
  if (avecCitation.length === 0) return null

  // On duplique pour que le défilement soit continu sans saut
  const items = [...avecCitation, ...avecCitation]

  return (
    <div style={{
      overflow: 'hidden',
      borderTop: '1px solid rgba(200,178,148,.18)',
      borderBottom: '1px solid rgba(200,178,148,.18)',
      background: 'rgba(74,124,69,.04)',
      padding: '10px 0',
      margin: '8px 0',
    }}>
      <div className="cf-ticker-track">
        {items.map((f, i) => (
          <span key={i} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 32px',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ color:'rgba(74,124,69,.50)', fontSize:14 }}>🌸</span>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: 16,
              color: 'rgba(30,20,8,.72)',
            }}>
              "{f.citation}"
            </span>
            <span style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: 12,
              color: 'rgba(30,20,8,.38)',
              letterSpacing: '0.04em',
            }}>
              — {f.display_name}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  HERO
// ─────────────────────────────────────────────────────────────────────────────
function HeroCercle({ count, firstDate }) {
  const dateLabel = firstDate
    ? new Date(firstDate).toLocaleDateString('fr-FR', { month:'long', year:'numeric' })
    : null
  return (
    <div style={{ textAlign:'center', borderBottom:'1px solid rgba(200,178,148,.16)', background:'#faf8f2', overflow:'hidden' }}>
      <div style={{ margin:'20px 16px 0', borderRadius:30, overflow:'hidden', lineHeight:0 }}>
        <img src="/bienfaiteurs.png" alt="Le Cercle des Fondateurs" style={{ width:'100%', height:'auto', display:'block' }}/>
      </div>
      <div style={{ padding:'28px 24px 30px' }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(30px,7vw,46px)', fontWeight:300, color:'#1a1208', lineHeight:1.15, margin:'0 0 10px', letterSpacing:'0.01em' }}>
          Le Cercle <em style={{ fontStyle:'italic', color:'#4a7c45', fontWeight:400 }}>qui nous porte</em>
        </h1>
        <div style={{ width:52, height:1, background:'linear-gradient(90deg,transparent,rgba(74,124,69,.45),transparent)', margin:'14px auto 16px' }}/>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:23, fontStyle:'italic', color:'rgba(30,20,8,.90)', lineHeight:1.80, maxWidth:440, margin:'0 auto' }}>
          Ces personnes ont choisi d'inscrire leur nom dans l'histoire de Mon Jardin Intérieur. Grâce à elles, ce jardin continue de pousser.
        </p>
        {count > 0 && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'6px 18px', borderRadius:100, marginTop:18, background:'rgba(74,124,69,.08)', border:'1px solid rgba(74,124,69,.20)', fontSize:14, color:'#4a7c45', fontFamily:"'Jost',sans-serif", letterSpacing:'0.04em', fontWeight:600 }}>
            🌿 <strong>{count}</strong> Fondateur{count > 1 ? 's' : ''}
            {dateLabel && <span style={{ color:'rgba(74,124,69,.78)', fontWeight:400 }}>· depuis {dateLabel}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  BLOC INTENTION
// ─────────────────────────────────────────────────────────────────────────────
function IntentionBlock() {
  return (
    <div style={{ margin:'20px 0', padding:'20px 22px 20px 26px', borderRadius:14, background:'rgba(255,255,255,.80)', borderLeft:'3px solid rgba(74,124,69,.35)', boxShadow:'0 1px 8px rgba(0,0,0,.04)' }}>
      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontStyle:'italic', color:'#1a1208', lineHeight:1.90, margin:0 }}>
        Mon Jardin Intérieur est porté par une seule personne, Gwenaël. Pour que cette application reste indépendante, sans publicité, sans compromis sur sa douceur, un Cercle de proches a choisi de soutenir l'aventure. Merci à eux :
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  CARTE FONDATEUR
// ─────────────────────────────────────────────────────────────────────────────
function CarteFondateur({ fondateur, animDelay = 0, small = false, mini = false }) {
  const color = getPetalColor(fondateur), lvlColor = LEVEL_COLOR[fondateur.niveau] ?? '#4a7c45'

  // ── Mode mini : carte horizontale compacte pour les niveaux "graine" ──
  if (mini) {
    return (
      <div className="cf-card" style={{
        display:'flex', alignItems:'center', gap:5,
        borderRadius:40, overflow:'hidden',
        boxShadow:'0 1px 6px rgba(0,0,0,.07)',
        animationDelay:`${animDelay}ms`,
        background:'#fff',
        padding:'3px 10px 3px 4px',
        border:`1px solid ${rgba(color,.18)}`,
      }}>
        <FleurSVG variant={fondateur.fleur_variant ?? 1} color={color} size={22}/>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:12, fontWeight:600, color:'#1a1208', whiteSpace:'nowrap' }}>
          {fondateur.display_name}
        </div>
      </div>
    )
  }

  return (
    <div className="cf-card" style={{ borderRadius: small ? 14 : 20, overflow:'hidden', boxShadow:'0 3px 18px rgba(0,0,0,.07)', animationDelay:`${animDelay}ms`, background:'#fff' }}>
      <div style={{ height:3, background:`linear-gradient(90deg, ${color}, ${lighten(color, 0.30)})` }}/>
      <div style={{ padding: small ? '12px 8px 10px' : '24px 18px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap: small ? 6 : 10, textAlign:'center' }}>
        <FleurSVG variant={fondateur.fleur_variant ?? 1} color={color} size={small ? 64 : 104}/>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: small ? 13 : 20, fontWeight:600, color:'#1a1208', lineHeight:1.2 }}>
          {fondateur.display_name}
        </div>
        {fondateur.citation && !small && (
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:16, color:'rgba(30,20,8,.88)', lineHeight:1.65, maxWidth:200 }}>
            "{fondateur.citation}"
          </div>
        )}
        <div style={{ padding: small ? '2px 6px' : '4px 14px', borderRadius:100, background:rgba(lvlColor,.09), border:`1px solid ${rgba(lvlColor,.25)}`, fontSize: small ? 9 : 12.5, color:lvlColor, fontFamily:"'Jost',sans-serif", fontWeight:600, letterSpacing:'0.03em', marginTop:2 }}>
          {LEVEL_ICON[fondateur.niveau]} {small ? '' : LEVEL_LABEL[fondateur.niveau]}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  CARTE IMAGE MANUELLE — affiche l'image Canva ou un placeholder
// ─────────────────────────────────────────────────────────────────────────────
function CarteImageManuelle({ fondateur, canvaPath, isMobile, animDelay }) {
  const [loaded, setLoaded] = useState(false)
  const [error,  setError]  = useState(false)

  if (!canvaPath || error) {
    // Pas encore de fichier déposé dans /fondateurs/
    return (
      <div className="cf-card" style={{
        borderRadius: isMobile ? 12 : 18,
        boxShadow:'0 2px 10px rgba(0,0,0,.06)',
        animationDelay:`${animDelay}ms`,
        background:'rgba(248,244,240,.90)',
        border:'1.5px dashed rgba(200,185,168,.45)',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding: isMobile ? '18px 10px' : '28px 14px',
        textAlign:'center', minHeight: isMobile ? 120 : 160,
        gap:8,
      }}>
        <span style={{ fontSize: isMobile ? 26 : 34 }}>{LEVEL_ICON[fondateur.niveau]}</span>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 13 : 16, fontWeight:600, color:'#1a1208', lineHeight:1.25 }}>
          {fondateur.display_name}
        </div>
        <div style={{ fontSize:10, color:'rgba(30,20,8,.38)', fontFamily:"'Jost',sans-serif", fontStyle:'italic', letterSpacing:'.03em' }}>
          Image en préparation
        </div>
      </div>
    )
  }

  return (
    <div className="cf-card" style={{
      borderRadius: isMobile ? 12 : 18,
      overflow:'hidden',
      boxShadow:'0 3px 18px rgba(0,0,0,.09)',
      animationDelay:`${animDelay}ms`,
      background:'#fff',
      // Masque le conteneur tant que l'image n'est pas chargée
      minHeight: loaded ? 0 : (isMobile ? 120 : 160),
    }}>
      {!loaded && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height: isMobile ? 120 : 160 }}>
          <span style={{ fontSize:24, opacity:.3 }}>{LEVEL_ICON[fondateur.niveau]}</span>
        </div>
      )}
      <img
        src={canvaPath}
        alt={fondateur.display_name}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{ width:'100%', height:'auto', display: loaded ? 'block' : 'none' }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  GRILLE
// ─────────────────────────────────────────────────────────────────────────────
function GrilleFondateurs({ fondateurs }) {
  const isMobile = useIsMobile()

  // ── En-tête commun (image + titre) ──────────────────────────────────────────
  const header = (
    <div style={{ textAlign:'center', marginBottom:20 }}>
      <img src="/fondateurs/profil/Gwenaël.png" alt="Gwenaël" style={{
        width: isMobile ? 130 : 180, height: isMobile ? 130 : 180,
        objectFit:'contain',
        display:'block', margin:'0 auto 12px',
      }}/>
      <div style={{
        fontFamily:"'Cormorant Garamond',serif",
        fontSize: isMobile ? 22 : 26, fontWeight:300, color:'#1a1208',
      }}>
        Le jardin des Fondateurs
      </div>
    </div>
  )

  // Fondateurs des niveaux supérieurs (ami, compagnon, fondateur)
  const fondateursSupérieurs = fondateurs.filter(f => f.niveau !== 'graine')

  if (fondateurs.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'32px 16px 28px' }}>
        {header}
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontStyle:'italic', color:'#4a7c45', marginBottom:10 }}>
          Chaque contributeur y apparaîtra sous sa fleur.
        </div>
        <div style={{ fontSize:15, color:'rgba(30,20,8,.62)', lineHeight:1.85, fontFamily:"'Jost',sans-serif", maxWidth:320, margin:'0 auto 24px' }}>
          Dès qu'une première personne rejoint le Cercle, sa fleur s'affiche ici, avec son prénom, son nom et sa citation, pour toujours.
        </div>
        {FLEUR_IMAGES.length > 0 && (
          <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:12 }}>
            {FLEUR_IMAGES.map((src, i) => (
              <img key={i} src={src} alt="" style={{ width: isMobile ? 90 : 130, height: isMobile ? 90 : 130, objectFit:'contain', display:'block' }}/>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {header}

      {/* Fondateurs niveaux supérieurs — cartes ou images placeholder */}
      {fondateursSupérieurs.length > 0 ? (
        <div style={{
          display:'grid',
          gridTemplateColumns: isMobile
            ? `repeat(${Math.min(fondateursSupérieurs.length, 3)}, 1fr)`
            : 'repeat(auto-fill, minmax(148px, 1fr))',
          gap: isMobile ? 10 : 14,
        }}>
          {fondateursSupérieurs.map((f, i) => {
            // Chemin Canva : /fondateurs/exemple/fleur3.png → /fondateurs/fleur3.png
            const canvaPath = f.fleur_image
              ? f.fleur_image.replace('/fondateurs/exemple/', '/fondateurs/')
              : null

            return (
              <CarteImageManuelle
                key={f.id}
                fondateur={f}
                canvaPath={canvaPath}
                isMobile={isMobile}
                animDelay={Math.min(i*65,450)}
              />
            )
          })}
        </div>
      ) : FLEUR_IMAGES.length > 0 && (
        <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:12, marginTop:8 }}>
          {FLEUR_IMAGES.map((src, i) => (
            <img key={i} src={src} alt="" style={{ width: isMobile ? 90 : 130, height: isMobile ? 90 : 130, objectFit:'contain', display:'block', opacity:0.72 }}/>
          ))}
        </div>
      )}

      {/* Cartes des fondateurs niveau graine — format mini horizontal, en bas */}
      {fondateurs.filter(f => f.niveau === 'graine').length > 0 && (
        <>
          <div style={{
            display:'flex', alignItems:'center', gap:12,
            marginTop: fondateursSupérieurs.length > 0 || FLEUR_IMAGES.length > 0 ? 28 : 8,
            marginBottom: 14,
          }}>
            <div style={{ flex:1, height:1, background:'linear-gradient(90deg, transparent, rgba(192,120,152,.30))' }}/>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, fontStyle:'italic', fontWeight:400, color:'#c07898', whiteSpace:'nowrap', letterSpacing:'.02em' }}>
              Mes remerciements à&nbsp;:
            </span>
            <div style={{ flex:1, height:1, background:'linear-gradient(90deg, rgba(192,120,152,.30), transparent)' }}/>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
            {fondateurs.filter(f => f.niveau === 'graine').map((f, i) => (
              <CarteFondateur key={f.id} fondateur={f} animDelay={Math.min(i*65,450)} mini={true}/>
            ))}
          </div>
        </>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  CARTE TIER — face avant + face arrière (slider)
// ─────────────────────────────────────────────────────────────────────────────
function TierCard({ tier, isFlipped, onFlip, montant, onMontant }) {
  const isMobile = useIsMobile()
  const c = LEVEL_COLOR[tier.niveau]
  const pct = ((montant - tier.min) / (tier.max - tier.min)) * 100
  const trackBg = `linear-gradient(to right, ${c} 0%, ${c} ${pct}%, #e0d8d0 ${pct}%, #e0d8d0 100%)`

  // ── Mobile : layout simple empilé, pas de flip ──
  if (isMobile) {
    return (
      <div style={{
        borderRadius:16, overflow:'hidden',
        border: `1.5px solid ${isFlipped ? c : tier.highlighted ? rgba(c,.28) : 'rgba(200,190,175,.25)'}`,
        background: isFlipped ? '#fff' : tier.highlighted ? rgba(c,.07) : '#fff',
        transition:'border-color .2s, background .2s',
      }}>
        {/* Infos niveau */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer' }} onClick={onFlip}>
          <span style={{ fontSize:28, lineHeight:1, flexShrink:0 }}>{tier.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:700, color:c, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:2 }}>
              {tier.label}
            </div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, color:'#1a1208' }}>
              {tier.range}
            </div>
          </div>
          <div style={{ fontSize:12, color:c, fontFamily:"'Jost',sans-serif", fontWeight:600 }}>
            {isFlipped ? '▲' : '▼'}
          </div>
        </div>

        {/* Slider — visible quand sélectionné */}
        {isFlipped && (
          <div style={{ padding:'0 16px 16px', borderTop:`1px solid ${rgba(c,.18)}` }}>
            <div style={{ textAlign:'center', padding:'10px 0 8px' }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:600, color:'#1a1208', lineHeight:1 }}>
                {montant}<span style={{ fontSize:18 }}>€</span>
              </div>
            </div>
            <input
              type="range" className="cf-slider"
              min={tier.min} max={tier.max} step={tier.step} value={montant}
              onChange={e => onMontant(Number(e.target.value))}
              style={{ background:trackBg }}
            />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
              <span style={{ fontSize:11, color:'rgba(30,20,8,.50)', fontFamily:"'Jost',sans-serif" }}>{tier.min}€</span>
              <span style={{ fontSize:11, color:'rgba(30,20,8,.50)', fontFamily:"'Jost',sans-serif" }}>{tier.max}€</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Desktop : flip 3D ──
  return (
    <div className="cf-tier-outer" onClick={!isFlipped ? onFlip : undefined}>
      <div className={`cf-tier-inner${isFlipped ? ' flipped' : ''}`}>

        {/* Face avant */}
        <div className="cf-tier-face" style={{
          background: tier.highlighted ? rgba(c, .07) : '#fff',
          border: `1.5px solid ${tier.highlighted ? rgba(c,.28) : 'rgba(200,190,175,.25)'}`,
          display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'center', gap:10, padding:'20px 14px', textAlign:'center',
        }}>
          <span style={{ fontSize:34, lineHeight:1 }}>{tier.icon}</span>
          <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11.5, fontWeight:700, color:c, letterSpacing:'0.08em', textTransform:'uppercase' }}>
            {tier.label}
          </div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:600, color:'#1a1208' }}>
            {tier.range}
          </div>
          <div style={{ fontSize:12.5, color:'rgba(30,20,8,.72)', fontFamily:"'Jost',sans-serif", lineHeight:1.5 }}>
            {tier.avantages.map((a,i) => <div key={i}>· {a}</div>)}
          </div>
          <div style={{ marginTop:4, fontSize:11.5, color:c, fontFamily:"'Jost',sans-serif", fontWeight:500, letterSpacing:'0.03em' }}>
            Cliquer pour choisir →
          </div>
        </div>

        {/* Face arrière */}
        <div className="cf-tier-face cf-tier-back" style={{
          background:'#fff', border:`2px solid ${c}`,
          display:'flex', flexDirection:'column', justifyContent:'center', gap:14, padding:'18px 16px',
        }} onClick={e => e.stopPropagation()}>
          <button onClick={e => { e.stopPropagation(); onFlip() }}
            style={{ position:'absolute', top:10, left:12, background:'none', border:'none', cursor:'pointer', fontSize:12, color:c, fontFamily:"'Jost',sans-serif", fontWeight:600, padding:0 }}>
            ← retour
          </button>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:600, color:c, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>
              Votre contribution
            </div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:600, color:'#1a1208', lineHeight:1 }}>
              {montant}<span style={{ fontSize:20 }}>€</span>
            </div>
          </div>
          <div>
            <input type="range" className="cf-slider"
              min={tier.min} max={tier.max} step={tier.step} value={montant}
              onChange={e => onMontant(Number(e.target.value))}
              style={{ background:trackBg, '--thumb-color':c }}
            />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
              <span style={{ fontSize:11, color:'rgba(30,20,8,.50)', fontFamily:"'Jost',sans-serif" }}>{tier.min}€</span>
              <span style={{ fontSize:11, color:'rgba(30,20,8,.50)', fontFamily:"'Jost',sans-serif" }}>{tier.max}€</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION CTA
// ─────────────────────────────────────────────────────────────────────────────
//  MODAL AVANTAGES DÉTAILLÉS
// ─────────────────────────────────────────────────────────────────────────────
function ModalAvantages({ onClose }) {
  return createPortal(
    <div
      role="dialog" aria-modal="true" aria-label="Avantages du Cercle"
      style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(10,22,8,.58)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, animation:'cfFadeUp .22s ease both' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background:'#faf8f4', borderRadius:26, width:'min(640px,100%)', maxHeight:'88vh', overflowY:'auto', scrollbarWidth:'thin', padding:'36px 28px 32px', position:'relative', boxShadow:'0 24px 72px rgba(30,60,10,.28)', border:'1.5px solid rgba(180,210,140,.28)', animation:'cfFadeUp .30s cubic-bezier(.22,1,.36,1) both' }}>

        <button onClick={onClose} aria-label="Fermer"
          style={{ position:'absolute', top:14, right:14, width:30, height:30, borderRadius:'50%', border:'none', background:'rgba(200,160,150,.14)', cursor:'pointer', fontSize:13, color:'rgba(30,20,8,.45)', display:'flex', alignItems:'center', justifyContent:'center' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(200,160,150,.28)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(200,160,150,.14)'}
        >✕</button>

        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:300, color:'#1a1208', marginBottom:10, textAlign:'center' }}>
          Les avantages du Cercle
        </div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:15, color:'rgba(30,20,8,.52)', lineHeight:1.70, textAlign:'center', marginBottom:24, maxWidth:420, margin:'0 auto 24px' }}>
          Aucune obligation d'adhésion à l'application — votre participation peut être tout simplement un encouragement financier.
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {TIERS_DETAIL.map((t, idx) => {
            const c = LEVEL_COLOR[t.niveau] ?? '#4a7c45'
            return (
              <div key={t.niveau}>
                {idx > 0 && <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(200,178,148,.30),transparent)', marginBottom:16 }}/>}
                <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                  {/* Icône */}
                  <div style={{ width:44, height:44, borderRadius:12, background:`${c}12`, border:`1px solid ${c}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, marginTop:2 }}>
                    {t.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    {/* Titre + range */}
                    <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap', marginBottom:8 }}>
                      <span style={{ fontFamily:"'Jost',sans-serif", fontSize:11.5, fontWeight:700, color:c, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                        {t.label}
                      </span>
                      <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color:'#1a1208' }}>
                        {t.range}
                      </span>
                    </div>
                    {/* Avantages */}
                    <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:5 }}>
                      {t.avantages.map((a, i) => {
                        const isBold = a.startsWith('**')
                        const text = isBold ? a.slice(2) : a
                        return (
                          <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:14, color:'rgba(30,20,8,.78)', fontFamily:"'Jost',sans-serif", lineHeight:1.5, fontWeight: isBold ? 700 : 400 }}>
                            <span style={{ color:c, fontSize:12, marginTop:2, flexShrink:0 }}>✦</span>
                            {text}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─────────────────────────────────────────────────────────────────────────────
function NiveauxCTA({ onRejoindre }) {
  const isMobile = useIsMobile()
  const [flipped, setFlipped]       = useState(null)
  const [showAvantages, setShowAvantages] = useState(false)
  const [montants, setMontants] = useState({
    graine: 30, ami: 180, compagnon: 350, fondateur: 800,
  })

  const selectedTier   = TIERS.find(t => t.niveau === flipped)
  const selectedMontant = flipped ? montants[flipped] : null

  const handleFlip = (niveau) => {
    setFlipped(prev => prev === niveau ? null : niveau)
  }
  const handleMontant = (niveau, val) => {
    setMontants(prev => ({ ...prev, [niveau]: val }))
  }

  return (
    <div>
      <div style={{ textAlign:'center', marginBottom:26 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(26px,5vw,34px)', fontWeight:300, color:'#1a1208', lineHeight:1.25, marginBottom:10 }}>
          Et si vous inscriviez votre nom ?
        </div>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:18, color:'rgba(30,20,8,.88)', lineHeight:1.80, maxWidth:600, margin:'0 auto' }}>
          Choisissez un niveau · ajustez votre contribution avec le curseur.
        </p>
      </div>

      {/* Bouton avantages */}
      <div style={{ textAlign:'center', marginBottom:18 }}>
        <button
          onClick={() => setShowAvantages(true)}
          style={{ padding:'8px 22px', borderRadius:100, border:'1.5px solid rgba(74,124,69,.30)', background:'rgba(74,124,69,.06)', color:'#4a7c45', fontFamily:"'Jost',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer', letterSpacing:'0.04em', transition:'background .15s, border-color .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(74,124,69,.12)'; e.currentTarget.style.borderColor='rgba(74,124,69,.50)' }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(74,124,69,.06)'; e.currentTarget.style.borderColor='rgba(74,124,69,.30)' }}
        >
          🌸 Voir les avantages de chaque niveau
        </button>
      </div>

      {showAvantages && <ModalAvantages onClose={() => setShowAvantages(false)}/>}

      {/* Grille des 4 cartes */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 16, marginBottom:20 }}>
        {TIERS.map(t => (
          <TierCard
            key={t.niveau}
            tier={t}
            isFlipped={flipped === t.niveau}
            onFlip={() => handleFlip(t.niveau)}
            montant={montants[t.niveau]}
            onMontant={v => handleMontant(t.niveau, v)}
          />
        ))}
      </div>

      {/* CTA — apparaît quand un tier est sélectionné */}
      {selectedTier && (
        <div style={{ textAlign:'center', animation:'cfSlideIn .3s ease both' }}>
          <div style={{ marginBottom:12, fontSize: isMobile ? 13 : 14, color:'rgba(30,20,8,.65)', fontFamily:"'Jost',sans-serif" }}>
            {selectedTier.icon} <strong style={{ color:LEVEL_COLOR[selectedTier.niveau] }}>{selectedTier.label}</strong>
            {' '}· <strong style={{ color:'#1a1208' }}>{selectedMontant}€</strong>
          </div>
          <button
            className="cf-cta-btn"
            onClick={() => onRejoindre(selectedTier, selectedMontant)}
            style={{ padding: isMobile ? '12px 24px' : '14px 44px', borderRadius:100, border:'none', background:'linear-gradient(135deg, #5a9a2e, #3a7a18)', color:'#fff', fontFamily:"'Jost',sans-serif", fontSize: isMobile ? 14 : 16, fontWeight:600, cursor:'pointer', boxShadow:'0 8px 28px rgba(60,120,20,.30)', letterSpacing:'0.04em' }}
          >
            Rejoindre le Cercle ✦
          </button>
          <div style={{ marginTop:8, fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:14, color:'rgba(30,20,8,.72)' }}>
            Paiement sécurisé via Stripe.
          </div>
        </div>
      )}

      {!selectedTier && (
        <div style={{ textAlign:'center', fontSize:14, color:'rgba(30,20,8,.40)', fontFamily:"'Jost',sans-serif", marginTop:8 }}>
          Cliquez sur un niveau pour commencer.
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  FORMULAIRE REJOINDRE
// ─────────────────────────────────────────────────────────────────────────────
function FormulaireRejoindre({ tier, montant, onClose, onSuccess }) {
  const isMobile = useIsMobile()
  const [form, setForm] = useState({ prenom:'', nom:'', email:'', telephone:'', citation:'', fleur_image:'', voulezVip: null })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const c = LEVEL_COLOR[tier.niveau]

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const citationEnabled = tier.niveau === 'compagnon' || tier.niveau === 'fondateur'
  const fleurEnabled = tier.niveau !== 'graine'
  const valid = form.prenom.trim() && form.nom.trim() && form.email.includes('@') && (fleurEnabled ? form.fleur_image : true)

  const handleSubmit = async () => {
    if (!valid || loading) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('cercle-checkout', {
        body: {
          prenom:    form.prenom.trim(),
          nom:       form.nom.trim(),
          email:     form.email.trim(),
          telephone: form.telephone.trim(),
          montant,
          niveau:      tier.niveau,
          label:       tier.label,
          citation:    form.citation.trim() || null,
          fleur_image: form.fleur_image || null,
        },
      })
      if (fnErr) throw fnErr
      if (data?.url) {
        sessionStorage.setItem('cercle_vip', JSON.stringify({ voulezVip: form.voulezVip, email: form.email.trim(), prenom: form.prenom.trim() }))
        window.location.href = data.url
      } else {
        throw new Error('Lien de paiement non reçu.')
      }
    } catch (e) {
      setError('Une erreur est survenue. Veuillez réessayer ou écrire à hypnoppal@gmail.com.')
      setLoading(false)
    }
  }


  return createPortal(
    <div
      role="dialog" aria-modal="true" aria-label="Formulaire Cercle"
      style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(10,22,8,.55)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, animation:'cfFadeUp .22s ease both' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modale */}
      <div style={{ background:'#faf8f4', borderRadius: isMobile ? 20 : 26, width:'min(700px,100%)', height: isMobile ? '92vh' : '80vh', display: isMobile ? 'flex' : 'grid', flexDirection: isMobile ? 'column' : undefined, gridTemplateColumns: isMobile ? undefined : '1fr 150px', position:'relative', overflow:'hidden', boxShadow:'0 24px 72px rgba(30,60,10,.28)', border:'1.5px solid rgba(180,210,140,.28)', animation:'cfFadeUp .30s cubic-bezier(.22,1,.36,1) both' }}>

        {/* ── Bouton fermer ── */}
        <button onClick={onClose} aria-label="Fermer"
          style={{ position:'absolute', top:14, right: isMobile ? 14 : 164, zIndex:10, width:30, height:30, borderRadius:'50%', border:'none', background:'rgba(200,160,150,.14)', cursor:'pointer', fontSize:13, color:'rgba(30,20,8,.45)', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .14s' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(200,160,150,.28)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(200,160,150,.14)'}
        >✕</button>

        {/* ── Colonne gauche : en-tête + champs ── */}
        <div style={{ display:'flex', flexDirection:'column', overflowY:'auto', scrollbarWidth:'thin', flex: isMobile ? '1 1 0' : undefined, minHeight:0 }}>

          {/* En-tête */}
          <div style={{ padding:'28px 28px 16px', textAlign:'center', flexShrink:0 }}>
            <img src="/icons/logo.png" alt="" style={{ width:72, height:72, objectFit:'cover', borderRadius:12, display:'block', margin:'0 auto 10px' }}/>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:300, color:'#1a1208', lineHeight:1.25, marginBottom:8 }}>
              Rejoindre le Cercle
            </div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px', borderRadius:100, background:rgba(c,.08), border:`1px solid ${rgba(c,.25)}` }}>
              <span style={{ fontSize:16 }}>{tier.icon}</span>
              <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12.5, fontWeight:600, color:c }}>{tier.label}</span>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:19, fontWeight:700, color:'#1a1208' }}>{montant}€</span>
            </div>
          </div>

          {/* Champs */}
          <div style={{ padding:'0 24px 24px', display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label className="cf-label" htmlFor="cf-prenom">Prénom <span style={{ color:c }}>*</span></label>
                <input id="cf-prenom" className="cf-input" type="text" placeholder="Marie" autoComplete="given-name" value={form.prenom} onChange={e => set('prenom', e.target.value)}/>
              </div>
              <div>
                <label className="cf-label" htmlFor="cf-nom">Nom <span style={{ color:c }}>*</span></label>
                <input id="cf-nom" className="cf-input" type="text" placeholder="Lambert" autoComplete="family-name" value={form.nom} onChange={e => set('nom', e.target.value)}/>
              </div>
            </div>

            <div>
              <label className="cf-label" htmlFor="cf-email">Email <span style={{ color:c }}>*</span></label>
              <input id="cf-email" className="cf-input" type="email" placeholder="marie@exemple.fr" autoComplete="email" value={form.email} onChange={e => set('email', e.target.value)}/>
            </div>

            {/* Question accès VIP */}
            <div style={{ padding:'14px 16px', borderRadius:14, background:'rgba(74,124,69,.05)', border:'1px solid rgba(74,124,69,.18)' }}>
              <div style={{ fontFamily:"'Jost',sans-serif", fontSize:13, fontWeight:600, color:'#1a1208', marginBottom:6 }}>
                Souhaitez-vous votre accès VIP à l'application ?
              </div>
              <div style={{ fontSize:12, color:'rgba(30,20,8,.50)', fontFamily:"'Jost',sans-serif", lineHeight:1.5, marginBottom:12, fontStyle:'italic' }}>
                Créez votre compte Mon Jardin Intérieur avec les avantages de votre niveau.
              </div>
              <div style={{ display:'flex', gap:10 }}>
                {[{ val: true, label:'Oui, je veux mon accès' }, { val: false, label:'Non merci' }].map(({ val, label }) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => set('voulezVip', val)}
                    style={{
                      flex:1, padding:'10px 8px', borderRadius:10, border: form.voulezVip === val ? `2px solid ${c}` : '1.5px solid rgba(200,190,175,.40)',
                      background: form.voulezVip === val ? `${c}12` : '#fff',
                      color: form.voulezVip === val ? c : 'rgba(30,20,8,.65)',
                      fontFamily:"'Jost',sans-serif", fontSize:12.5, fontWeight: form.voulezVip === val ? 700 : 400,
                      cursor:'pointer', transition:'all .15s',
                    }}
                  >
                    {form.voulezVip === val ? '✓ ' : ''}{label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="cf-label" htmlFor="cf-telephone">Téléphone</label>
              <input id="cf-telephone" className="cf-input" type="tel" placeholder="+33 6 00 00 00 00" autoComplete="tel" value={form.telephone} onChange={e => set('telephone', e.target.value)}/>
            </div>

            <div style={{ opacity: citationEnabled ? 1 : 0.38, pointerEvents: citationEnabled ? 'auto' : 'none' }}>
              <label className="cf-label" htmlFor="cf-citation">
                Citation florale{' '}
                {citationEnabled
                  ? <span style={{ color:'rgba(30,20,8,.35)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>— optionnelle, 80 car. max</span>
                  : <span style={{ color:'rgba(30,20,8,.35)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>— disponible dès Compagnon</span>
                }
              </label>
              <div style={{ position:'relative' }}>
                <textarea
                  id="cf-citation"
                  className="cf-input"
                  placeholder='"Pour que la douceur ait sa place."'
                  maxLength={80}
                  rows={2}
                  value={form.citation}
                  onChange={e => set('citation', e.target.value)}
                  disabled={!citationEnabled}
                  style={{ resize:'none', fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontStyle: form.citation ? 'italic' : 'normal', background: citationEnabled ? '#fff' : 'rgba(200,190,180,.12)' }}
                />
                {citationEnabled && (
                  <span style={{ position:'absolute', bottom:8, right:10, fontSize:11, color:'rgba(30,20,8,.28)', fontFamily:"'Jost',sans-serif" }}>
                    {form.citation.length}/80
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="cf-label">Contribution</label>
              <div style={{ padding:'11px 14px', borderRadius:12, border:`1.5px solid ${rgba(c,.35)}`, background:rgba(c,.05), fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, color:'#1a1208' }}>
                {montant}€ <span style={{ fontSize:13, color:c, fontFamily:"'Jost',sans-serif", fontWeight:500 }}>· {tier.label}</span>
              </div>
            </div>

            {error && (
              <div style={{ padding:'11px 14px', borderRadius:12, background:'rgba(180,50,50,.06)', border:'1px solid rgba(180,50,50,.20)', fontSize:13.5, color:'rgba(160,40,40,.90)', fontFamily:"'Jost',sans-serif", lineHeight:1.5 }}>
                {error}
              </div>
            )}

            <button className="cf-cta-btn" onClick={handleSubmit} disabled={!valid || loading}
              style={{ width:'100%', padding:'14px', borderRadius:50, border:'none', background: valid ? 'linear-gradient(135deg, #5a9a2e, #3a7a18)' : 'rgba(200,190,180,.40)', color: valid ? '#fff' : 'rgba(30,20,8,.35)', fontFamily:"'Jost',sans-serif", fontSize:15.5, fontWeight:600, cursor: valid ? 'pointer' : 'not-allowed', boxShadow: valid ? '0 8px 28px rgba(60,120,20,.28)' : 'none', letterSpacing:'0.04em', transition:'all .2s' }}
            >
              {loading ? 'Redirection…' : `Voici mon soutien · ${montant}€`}
            </button>

            <div style={{ textAlign:'center', fontSize:12.5, color:'rgba(30,20,8,.45)', fontFamily:"'Jost',sans-serif", lineHeight:1.6 }}>
              🔒 Paiement sécurisé par Stripe<br/>
              Votre fleur apparaîtra dans le Cercle après confirmation.
            </div>
          </div>

        </div>{/* fin colonne gauche */}

        {/* ── Sélecteur de fleur : colonne (desktop) ou bande (mobile) ── */}
        <div style={{
          borderLeft: isMobile ? 'none' : '1px solid rgba(200,178,148,.20)',
          borderTop: isMobile ? '1px solid rgba(200,178,148,.20)' : 'none',
          background:'#faf8f4', display:'flex',
          flexDirection:'column',
          overflow:'hidden', minHeight:0,
          flexShrink: isMobile ? 0 : undefined,
          height: isMobile ? 170 : undefined,
          opacity: fleurEnabled ? 1 : 0.35,
          pointerEvents: fleurEnabled ? 'auto' : 'none',
        }}>
          {/* Titre */}
          <div style={{ padding: isMobile ? '8px 14px 6px' : '14px 10px 10px', fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 14 : 15, fontStyle:'italic', fontWeight:400, color:'rgba(30,20,8,.70)', textAlign: isMobile ? 'left' : 'center', flexShrink:0, borderBottom:'1px solid rgba(200,178,148,.15)' }}>
            Choisis ta fleur.
          </div>
          {/* Fleurs */}
          <div style={{ flex:1, overflowY: isMobile ? 'hidden' : 'scroll', overflowX: isMobile ? 'auto' : 'hidden', padding: isMobile ? '8px 8px 20px' : '8px 8px 20px', display:'flex', flexDirection: isMobile ? 'row' : 'column', gap:8, scrollbarWidth:'thin', scrollbarColor:'rgba(74,124,69,.30) transparent' }}>
            {FLEUR_CHOIX.length === 0 && (
              <div style={{ textAlign:'center', fontSize:11, color:'rgba(30,20,8,.35)', fontFamily:"'Jost',sans-serif", padding:'20px 4px', lineHeight:1.5 }}>
                Aucune image disponible
              </div>
            )}
            {FLEUR_CHOIX.map((src, i) => {
              const isSel = form.fleur_image === src
              return (
                <div key={i} onClick={() => set('fleur_image', isSel ? '' : src)}
                  style={{ borderRadius:12, overflow:'hidden', cursor:'pointer', flexShrink:0, width: isMobile ? 100 : undefined, height: isMobile ? 100 : undefined, border: isSel ? `2.5px solid ${c}` : '2.5px solid rgba(200,178,148,.18)', boxShadow: isSel ? `0 0 0 2px ${rgba(c,.30)}` : 'none', transition:'border-color .15s, box-shadow .15s', background:'#faf8f4' }}
                >
                  {isSel && (
                    <div style={{ background:c, textAlign:'center', fontSize:10, color:'#fff', fontFamily:"'Jost',sans-serif", fontWeight:600, padding:'3px 0', lineHeight:1 }}>
                      ✓ choisie
                    </div>
                  )}
                  <img src={src} alt={`Fleur ${i+1}`} style={{ width:'100%', height:'auto', display:'block' }}/>
                </div>
              )
            })}
          </div>
        </div>{/* fin colonne droite */}

      </div>{/* fin modale */}
    </div>,
    document.body
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  FOOTER
// ─────────────────────────────────────────────────────────────────────────────
function PageFooterCercle() {
  return (
    <div style={{ textAlign:'center', padding:'28px 16px 32px' }}>
      <div style={{ width:44, height:1, background:'linear-gradient(90deg,transparent,rgba(74,124,69,.28),transparent)', margin:'0 auto 20px' }}/>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:19, fontStyle:'italic', color:'rgba(30,20,8,.85)', lineHeight:1.95, maxWidth:380, margin:'0 auto' }}>
        "Merci. Vraiment.<br/>Sans vous, ce jardin n'aurait pas de racines."
      </div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, fontStyle:'italic', color:'rgba(30,20,8,.65)', marginTop:8, letterSpacing:'0.06em' }}>
        — Gwen
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODAL SUCCÈS
// ─────────────────────────────────────────────────────────────────────────────
function SuccessModal({ onClose }) {
  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(10,22,8,.60)', backdropFilter:'blur(14px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, animation:'cfFadeUp .3s ease both' }}>
      <div style={{ background:'#faf8f4', borderRadius:26, width:'min(440px,100%)', padding:'44px 32px 40px', textAlign:'center', boxShadow:'0 24px 72px rgba(30,60,10,.30)', border:'1.5px solid rgba(180,210,140,.35)', animation:'cfFadeUp .35s cubic-bezier(.22,1,.36,1) both' }}>
        <div style={{ marginBottom:20, lineHeight:0 }}>
          <FleurSVG variant={7} color="#4a7c45" size={88}/>
        </div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, fontWeight:300, color:'#1a1208', lineHeight:1.25, marginBottom:12 }}>
          Bienvenue dans le Cercle.
        </div>
        <div style={{ width:48, height:1, background:'linear-gradient(90deg,transparent,rgba(74,124,69,.40),transparent)', margin:'0 auto 16px' }}/>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontStyle:'italic', color:'rgba(30,20,8,.80)', lineHeight:1.80, marginBottom:28 }}>
          Votre contribution a été confirmée. Votre fleur apparaîtra dans le jardin après validation. Merci — vraiment.
        </p>
        <button
          onClick={onClose}
          style={{ padding:'13px 36px', borderRadius:100, border:'none', background:'linear-gradient(135deg, #5a9a2e, #3a7a18)', color:'#fff', fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:600, cursor:'pointer', boxShadow:'0 7px 22px rgba(60,120,20,.28)', letterSpacing:'0.04em' }}
        >
          Voir le jardin
        </button>
      </div>
    </div>,
    document.body
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODAL INSCRIPTION VIP
// ─────────────────────────────────────────────────────────────────────────────
function InscriptionVipModal({ email: initialEmail, prenom, onClose }) {
  const [email,    setEmail]    = useState(initialEmail ?? '')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState(null)

  const valid = email.includes('@') && password.length >= 8

  const handleSignup = async () => {
    if (!valid || loading) return
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signUp({ email, password, options: { data: { prenom, plan: 'vip' } } })
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      setDone(true)
      setLoading(false)
    }
  }

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(10,22,8,.65)', backdropFilter:'blur(14px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, animation:'cfFadeUp .3s ease both' }}>
      <div style={{ background:'#faf8f4', borderRadius:26, width:'min(420px,100%)', padding:'40px 32px 36px', position:'relative', boxShadow:'0 24px 72px rgba(30,60,10,.30)', border:'1.5px solid rgba(180,210,140,.35)', animation:'cfFadeUp .35s cubic-bezier(.22,1,.36,1) both' }}>

        <button onClick={onClose} aria-label="Fermer"
          style={{ position:'absolute', top:14, right:14, width:30, height:30, borderRadius:'50%', border:'none', background:'rgba(200,160,150,.14)', cursor:'pointer', fontSize:13, color:'rgba(30,20,8,.45)', display:'flex', alignItems:'center', justifyContent:'center' }}
        >✕</button>

        {done ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>🌿</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:300, color:'#1a1208', marginBottom:12 }}>
              Votre compte est créé !
            </div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, fontStyle:'italic', color:'rgba(30,20,8,.72)', lineHeight:1.75, marginBottom:24 }}>
              Un email de confirmation vous a été envoyé. Connectez-vous ensuite pour accéder à votre espace VIP.
            </p>
            <button onClick={onClose} style={{ padding:'12px 32px', borderRadius:100, border:'none', background:'linear-gradient(135deg,#5a9a2e,#3a7a18)', color:'#fff', fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:600, cursor:'pointer' }}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:300, color:'#1a1208', lineHeight:1.25, marginBottom:6 }}>
                Créer votre accès VIP
              </div>
              <div style={{ fontSize:13, color:'rgba(30,20,8,.55)', fontFamily:"'Jost',sans-serif" }}>
                {prenom ? `Bienvenue ${prenom} ! ` : ''}Choisissez un mot de passe pour accéder à l'application.
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label className="cf-label" htmlFor="vip-email">Email</label>
                <input id="vip-email" className="cf-input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"/>
              </div>

              <div>
                <label className="cf-label" htmlFor="vip-pwd">Mot de passe <span style={{ color:'#4a7c45' }}>*</span></label>
                <div style={{ position:'relative' }}>
                  <input id="vip-pwd" className="cf-input" type={showPwd ? 'text' : 'password'} placeholder="8 caractères minimum" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight:44 }}/>
                  <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'rgba(30,20,8,.38)', padding:0 }}>
                    {showPwd ? '🙈' : '👁'}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <div style={{ marginTop:5, fontSize:11.5, color:'rgba(180,60,60,.80)', fontFamily:"'Jost',sans-serif" }}>
                    Minimum 8 caractères ({password.length}/8)
                  </div>
                )}
              </div>

              {error && (
                <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(180,50,50,.06)', border:'1px solid rgba(180,50,50,.20)', fontSize:13, color:'rgba(160,40,40,.90)', fontFamily:"'Jost',sans-serif" }}>
                  {error}
                </div>
              )}

              <button onClick={handleSignup} disabled={!valid || loading}
                style={{ width:'100%', padding:'14px', borderRadius:50, border:'none', background: valid ? 'linear-gradient(135deg,#5a9a2e,#3a7a18)' : 'rgba(200,190,180,.40)', color: valid ? '#fff' : 'rgba(30,20,8,.35)', fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:600, cursor: valid ? 'pointer' : 'not-allowed', letterSpacing:'0.04em', transition:'all .2s' }}>
                {loading ? 'Création…' : 'Créer mon compte VIP'}
              </button>

              <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'rgba(30,20,8,.40)', fontFamily:"'Jost',sans-serif", textAlign:'center' }}>
                Ignorer pour l'instant
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export function ScreenCercleFondateurs({ userId, standalone = false }) {
  const [fondateurs,  setFondateurs]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [formData,    setFormData]    = useState(null) // { tier, montant }
  const [showSuccess, setShowSuccess] = useState(false)
  const [vipData,     setVipData]     = useState(null) // { email, prenom }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('cercle') === 'success') {
      window.history.replaceState({}, '', window.location.pathname)
      setShowSuccess(true)
      try {
        const saved = JSON.parse(sessionStorage.getItem('cercle_vip') ?? 'null')
        if (saved?.voulezVip) setVipData({ email: saved.email, prenom: saved.prenom })
        sessionStorage.removeItem('cercle_vip')
      } catch {}
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('fondateurs')
          .select('id, display_name, citation, niveau, date_contribution, fleur_variant, couleur_petale, fleur_image')
          .eq('affichage_public', true)
          .order('date_contribution', { ascending: true })
        if (!error && data) setFondateurs(data)
      } catch (e) {
        console.warn('[CercleFondateurs]', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
        <div style={{ animation:'cfPulse 1.6s ease-in-out infinite' }}>
          <FleurSVG variant={1} color="#4a7c45" size={44}/>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{CERCLE_CSS}</style>

      <div style={{ ...(standalone ? {} : { height:'100%', overflowY:'auto', overscrollBehavior:'contain' }), scrollbarWidth:'thin', scrollbarColor:'rgba(74,124,69,.20) transparent', background:'#faf8f2' }}>
        <div style={{ maxWidth:700, margin:'0 auto', paddingBottom:40 }}>

          <HeroCercle count={fondateurs.length} firstDate={fondateurs[0]?.date_contribution}/>

          <div style={{ padding:'0 16px' }}>
            <IntentionBlock/>

            <section aria-label="Les Fondateurs" style={{ margin:'22px 0' }}>
              <GrilleFondateurs fondateurs={fondateurs}/>
              <BandeauCitations fondateurs={fondateurs}/>
            </section>

            <div style={{ display:'flex', alignItems:'center', gap:14, margin:'26px 0' }}>
              <div style={{ flex:1, height:1, background:'linear-gradient(to right,transparent,rgba(74,124,69,.15))' }}/>
              <span style={{ fontSize:16, opacity:.35 }}>🌿</span>
              <div style={{ flex:1, height:1, background:'linear-gradient(to left,transparent,rgba(74,124,69,.15))' }}/>
            </div>

            <section aria-label="Rejoindre le Cercle" style={{ padding:'28px 16px 32px', borderRadius:20, background:'rgba(255,255,255,.75)', border:'1px solid rgba(200,190,175,.22)', boxShadow:'0 2px 16px rgba(74,124,69,.05)', margin:'0 -16px' }}>
              <NiveauxCTA onRejoindre={(tier, montant) => setFormData({ tier, montant })}/>
            </section>

            <PageFooterCercle/>
          </div>
        </div>
      </div>

      {formData && (
        <FormulaireRejoindre
          tier={formData.tier}
          montant={formData.montant}
          onClose={() => setFormData(null)}
          onSuccess={() => { setFormData(null); setShowSuccess(true) }}
        />
      )}

      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)}/>}
      {!showSuccess && vipData && <InscriptionVipModal email={vipData.email} prenom={vipData.prenom} onClose={() => setVipData(null)}/>}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE PUBLIQUE STANDALONE — accessible via ?cercle sans connexion
// ─────────────────────────────────────────────────────────────────────────────
export function CerclePublicPage() {
  const { user } = useAuth()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 30% 20%, #1a2e1a 0%, #0e1a0e 60%, #080f08 100%)',
      fontFamily: "'Jost', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 16px 48px',
    }}>
      <style>{CERCLE_CSS}</style>

      {/* Barre de navigation */}
      <div style={{
        width: '100%', maxWidth: 760,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, padding: '0 4px',
      }}>
        {/* Logo */}
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 300, color: 'rgba(255,255,255,.70)', letterSpacing: '0.01em' }}>
          Mon <em style={{ fontStyle: 'italic', color: '#7ab870' }}>Jardin</em>
          <span style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.30)', fontStyle: 'normal', marginLeft: 6 }}>Intérieur</span>
        </div>

        {/* Bouton retour — visible uniquement si connecté */}
        {user && (
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '6px 16px', borderRadius: 100,
              border: '1px solid rgba(122,184,112,.35)',
              background: 'rgba(122,184,112,.12)',
              color: '#7ab870',
              fontFamily: "'Jost', sans-serif",
              fontSize: 12.5, fontWeight: 500,
              cursor: 'pointer', letterSpacing: '0.03em',
              transition: 'background .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(122,184,112,.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(122,184,112,.12)'}
          >
            ← Mon Jardin
          </button>
        )}
      </div>

      {/* Carte de contenu */}
      <div style={{
        width: '100%', maxWidth: 760,
        background: '#faf8f2',
        borderRadius: 28,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06)',
      }}>
        <ScreenCercleFondateurs userId={user?.id} standalone/>
      </div>
    </div>
  )
}
