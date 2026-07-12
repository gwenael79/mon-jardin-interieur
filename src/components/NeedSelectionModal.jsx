// NeedSelectionModal.jsx — premium living cards
import { useRef, useState, useEffect } from 'react'
import { useIsMobile } from '../pages/dashboardShared'
import { supabase } from '../core/supabaseClient'
import { logActivity } from '../utils/logActivity'
import AudioRitualsModal from './AudioRitualsModal'
import { ExerciseDetail } from '../pages/mafleur_rituels'
import { playChime } from '../utils/playChime'
import { completeRitualHealth, RITUAL_DELTA } from '../utils/completeRitualHealth'
import RitualFinderModal from './RitualFinderModal'

// ─── Données ────────────────────────────────────────────────────────────────

const NEEDS = [
  { id:'sleep',       icon:'sleep',       label:'Mieux dormir',           description:'Retrouver un sommeil apaisé',
    g1:'#5B3FA0', g2:'#8B6FD0', glow:'rgba(107,75,200,0.32)' },
  { id:'stress',      icon:'stress',      label:'Apaiser le stress',       description:'Relâcher la pression',
    g1:'#2058B0', g2:'#5090E0', glow:'rgba(48,112,200,0.28)' },
  { id:'emotions',    icon:'emotions',    label:'Apaiser mes émotions',    description:'Accueillir ce qui est là',
    g1:'#B83070', g2:'#E870A8', glow:'rgba(200,60,120,0.28)' },
  { id:'grounding',   icon:'grounding',   label:'Me sentir ancré',         description:'Retrouver ma stabilité',
    g1:'#1A6645', g2:'#38A870', glow:'rgba(40,140,90,0.28)' },
  { id:'thoughts',    icon:'thoughts',    label:'Calmer mes pensées',      description:'Faire de la place',
    g1:'#2A4468', g2:'#4A70A0', glow:'rgba(58,96,148,0.28)' },
  { id:'energy',      icon:'energy',      label:"Retrouver de l'énergie",  description:"Revenir à l'élan",
    g1:'#A06010', g2:'#D8A030', glow:'rgba(190,140,30,0.28)' },
  { id:'selfconnect', icon:'selfconnect', label:'Me reconnecter à moi',    description:'Me retrouver',
    g1:'#0E5250', g2:'#28B0A8', glow:'rgba(20,160,150,0.28)' },
  { id:'softness',    icon:'softness',    label:'Retrouver de la douceur', description:"M'apaiser",
    g1:'#902060', g2:'#E090B8', glow:'rgba(190,80,140,0.25)' },
]

// ─── Univers — regroupement éditorial des besoins, présentation haut de gamme ─
const UNIVERSES = [
  { id:'dormir',      title:'Dormir',      icon:'sleep',   image:'/carte1.png',
    subtitle:'Retrouver un sommeil apaisé',
    color:'#4B3E7A', accent:'#8B7BC7', needIds:['sleep'] },
  { id:'apaiser',     title:'Apaiser',     icon:'stress',  image:'/carte2.png',
    subtitle:'Apaiser le stress, calmer mes pensées, apaiser mes émotions',
    color:'#3F6E52', accent:'#8FBFA0', needIds:['stress','thoughts','emotions'] },
  { id:'energie',     title:'Énergie',     icon:'sun',     image:'/carte3.png',
    subtitle:"Retrouver de l'énergie, me sentir ancré",
    color:'#B07A24', accent:'#F0C36B', needIds:['energy','grounding'] },
  { id:'reconnexion', title:'Reconnexion', icon:'feather', image:'/carte4.png',
    subtitle:'Me reconnecter à moi, retrouver de la douceur',
    color:'#B36F92', accent:'#F0B8D0', needIds:['selfconnect','softness'] },
]

function needById(id) { return NEEDS.find(n => n.id === id) }
function universeForNeed(needId) { return UNIVERSES.find(u => u.needIds.includes(needId)) }

// ─── Icônes SVG outline ──────────────────────────────────────────────────────

function Icon({ id, size = 28 }) {
  const s = { fill:'none', stroke:'rgba(255,255,255,0.90)', strokeWidth:1.6, strokeLinecap:'round', strokeLinejoin:'round' }
  const paths = {
    sleep:       <path {...s} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
    stress:      <><path {...s} d="M9.59 4.59A2 2 0 1 1 11 8H2"/><path {...s} d="M10.59 19.41A2 2 0 1 0 14 16H2"/><path {...s} d="M15.73 7.73A2.5 2.5 0 1 1 19.5 12H2"/></>,
    emotions:    <path {...s} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.84-7.84a5.5 5.5 0 0 0 0-7.78z"/>,
    grounding:   <><circle {...s} cx="12" cy="5" r="3"/><line {...s} x1="12" y1="8" x2="12" y2="22"/><path {...s} d="M5 15a7 7 0 0 0 14 0"/></>,
    thoughts:    <><circle {...s} cx="12" cy="12" r="2.5"/><path {...s} d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"/></>,
    energy:      <path {...s} d="M13 2L4.09 12.96A1 1 0 0 0 5 14.5h6.5L10 22l9.5-11.5A1 1 0 0 0 18.5 9H12L13 2z"/>,
    selfconnect: <><circle {...s} cx="12" cy="8" r="4"/><path {...s} d="M4 20c0-3.5 3.6-6.5 8-6.5s8 3 8 6.5"/></>,
    softness:    <><circle {...s} cx="12" cy="12" r="2.5"/><path {...s} d="M12 2a3.5 3.5 0 0 1 0 7"/><path {...s} d="M12 22a3.5 3.5 0 0 1 0-7"/><path {...s} d="M2 12a3.5 3.5 0 0 1 7 0"/><path {...s} d="M22 12a3.5 3.5 0 0 1-7 0"/></>,
    audio:       <><path {...s} d="M3 18v-6a9 9 0 0 1 18 0v6"/><path {...s} d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></>,
    sun:         <><circle {...s} cx="12" cy="12" r="4"/><path {...s} d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M17.99 17.99l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M17.99 6.01l1.77-1.77"/></>,
    feather:     <><path {...s} d="M20.24 3.76a6 6 0 0 0-8.49 0L3 12.5V21h8.5l8.74-8.74a6 6 0 0 0 0-8.5z"/><path {...s} d="M16 8L2 22M17.5 15H9"/></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{display:'block',filter:'drop-shadow(0 1px 4px rgba(0,0,0,0.2))'}}>
      {paths[id]}
    </svg>
  )
}

// ─── Particules de fond ──────────────────────────────────────────────────────

const PARTICLES = [
  { x:'6%',  y:'9%',  s:2.5, d:0,   dur:4.2 },
  { x:'88%', y:'6%',  s:2,   d:0.8, dur:3.8 },
  { x:'18%', y:'38%', s:1.5, d:1.5, dur:5.1 },
  { x:'80%', y:'30%', s:2.5, d:0.3, dur:4.5 },
  { x:'50%', y:'14%', s:1.5, d:2.0, dur:3.5 },
  { x:'92%', y:'58%', s:2,   d:1.1, dur:4.8 },
  { x:'4%',  y:'68%', s:1.5, d:0.6, dur:3.9 },
  { x:'62%', y:'90%', s:2.5, d:1.8, dur:4.3 },
]

// ─── CSS ─────────────────────────────────────────────────────────────────────

// Mapping zones bilan → ids de besoins (par priorité)
const ZONE_TO_NEEDS = {
  roots:   ['grounding', 'stress'],
  stem:    ['energy', 'grounding'],
  leaves:  ['thoughts', 'softness'],
  flowers: ['emotions', 'selfconnect'],
  breath:  ['sleep', 'stress', 'softness'],
}

function getRecommendedNeeds(degradation) {
  if (!degradation || typeof degradation !== 'object') return []
  const scores = {}
  Object.entries(degradation).forEach(([zone, stress]) => {
    ;(ZONE_TO_NEEDS[zone] || []).forEach((id, i) => {
      scores[id] = (scores[id] || 0) + stress * (i === 0 ? 1 : 0.55)
    })
  })
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([, s]) => s > 40)
    .slice(0, 3)
    .map(([id]) => id)
}

const CSS = `
  @keyframes nm_float {
    0%,100%{ transform:translateY(0) scale(1); opacity:.4; }
    50%     { transform:translateY(-10px) scale(1.3); opacity:.8; }
  }
  @keyframes nm_fadeUp {
    from{ opacity:0; transform:translateY(12px); }
    to  { opacity:1; transform:translateY(0); }
  }
  @keyframes nm_cardIn {
    from{ opacity:0; transform:translateY(18px) scale(.96); }
    to  { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes nm_ripple {
    from{ transform:scale(0); opacity:.4; }
    to  { transform:scale(4); opacity:0; }
  }
  @keyframes nm_shimmer {
    0%,100% { opacity:.55; transform:translate(0%,0%); }
    50%      { opacity:.85; transform:translate(18%,10%); }
  }
  @keyframes nm_breathe {
    0%  { transform:scale(1); }
    25% { transform:scale(0.96); }
    70% { transform:scale(1.015); }
    100%{ transform:scale(1); }
  }
  .nm-card {
    -webkit-tap-highlight-color:transparent;
    transition: transform .18s ease, box-shadow .18s ease !important;
  }
  .nm-card:active {
    animation: nm_breathe .38s ease forwards !important;
  }
  @keyframes nm_jardin_aura {
    0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgba(93,202,165,0.9), 0 0 0 0 rgba(93,202,165,0.5), 0 0 30px 4px rgba(93,202,165,0.4); filter: brightness(1); }
    40%  { transform: scale(1.06); box-shadow: 0 0 0 14px rgba(93,202,165,0.3), 0 0 0 28px rgba(93,202,165,0.12), 0 0 50px 12px rgba(93,202,165,0.6); filter: brightness(1.25); }
    100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(93,202,165,0), 0 0 0 0 rgba(93,202,165,0), 0 0 30px 4px rgba(93,202,165,0.4); filter: brightness(1); }
  }
  .nm-jardin-aura {
    animation: nm_jardin_aura 1.4s cubic-bezier(.4,0,.2,1) infinite;
    background: linear-gradient(135deg, #1a6b2a, #3dbb6a, #1c7a38) !important;
    color: #fff !important;
    letter-spacing: .04em;
  }
  @keyframes nm_badge_pulse {
    0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(255,255,255,0.8); opacity: 1; }
    50%       { transform: scale(1.12); box-shadow: 0 0 0 5px rgba(255,255,255,0); opacity: 0.85; }
  }
  .nm-recommended {
    animation: nm_cardIn .42s ease both !important;
  }
`

// ─── Card ────────────────────────────────────────────────────────────────────
// Carte "univers" large avec illustration — remplace l'ancienne grille 8 besoins
// par 4 univers éditoriaux, dans l'esprit Apple Santé / Calm.

function UniverseCard({ universe, index, onSelect, onToggleExpand, isMobile, isRecommended, isExpanded }) {
  const hasChoice = universe.needIds.length > 1
  const cardH = isMobile ? 128 : 156
  const textW = isMobile ? '64%' : '58%'

  function handleClick() {
    if (hasChoice) onToggleExpand(universe.id)
    else onSelect(needById(universe.needIds[0]))
  }

  return (
    <button
      onClick={handleClick}
      className={isRecommended ? 'nm-card nm-recommended' : 'nm-card'}
      style={{
        display:'block', width:'100%', height:cardH,
        borderRadius:22, border:'1px solid rgba(255,255,255,0.6)',
        background:'rgba(255,253,248,0.85)',
        cursor:'pointer', textAlign:'left', overflow:'hidden',
        position:'relative', padding:0,
        boxShadow: isExpanded ? `0 4px 18px ${universe.color}35` : '0 8px 22px rgba(60,40,20,0.10)',
        animation:`nm_cardIn .42s ease ${index*.08}s both`,
        boxSizing:'border-box',
        transition:'box-shadow .2s ease, transform .2s ease',
      }}
    >
      {/* Illustration — plein cadre, fondue sur toute la carte (pas de bord net) */}
      <img src={universe.image} alt="" style={{
        position:'absolute', inset:0, width:'100%', height:'100%',
        objectFit:'cover', objectPosition:'center', display:'block',
        maskImage: 'linear-gradient(90deg, transparent 0%, transparent 50%, #000 74%, #000 100%)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, transparent 50%, #000 74%, #000 100%)',
      }}/>

      {/* Badge recommandé */}
      {isRecommended && (
        <div style={{
          position:'absolute', top:10, left:10, zIndex:8,
          background:'rgba(255,255,255,0.94)',
          borderRadius:100, padding:'4px 10px',
          fontFamily:"'Jost',sans-serif", fontSize:9,
          fontWeight:800, letterSpacing:'0.10em',
          color: universe.color, textTransform:'uppercase',
          animation:'nm_badge_pulse 1.6s ease-in-out infinite',
          boxShadow:'0 2px 8px rgba(0,0,0,0.14)',
        }}>
          ✦ Recommandé
        </div>
      )}

      {/* Panneau texte — verre dépoli, garantit la lisibilité quelle que soit l'image */}
      <div style={{
        position:'relative', zIndex:1, width:textW, height:'100%',
        padding: isMobile ? '12px 12px 12px 16px' : '18px 22px 18px 26px',
        display:'flex', flexDirection:'column', justifyContent:'center', gap: isMobile ? 4 : 6,
        background:'linear-gradient(90deg, rgba(255,253,248,0.92) 0%, rgba(255,253,248,0.92) 78%, rgba(255,253,248,0) 100%)',
        backdropFilter:'blur(1.5px)', WebkitBackdropFilter:'blur(1.5px)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 10 : 13 }}>
          <div style={{
            width: isMobile ? 36 : 46, height: isMobile ? 36 : 46, borderRadius:'50%', flexShrink:0,
            background:`linear-gradient(145deg, ${universe.color}, ${universe.accent})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:`0 4px 12px ${universe.color}45`,
          }}>
            <Icon id={universe.icon} size={isMobile ? 17 : 22}/>
          </div>
          <div style={{
            fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic',
            fontSize: isMobile ? 21 : 29, fontWeight:600,
            color: universe.color, lineHeight:1.1,
          }}>
            {universe.title}
          </div>
        </div>
        <div style={{
          fontFamily:"'Jost',sans-serif", fontWeight:500,
          fontSize: isMobile ? 13 : 15.5, color:'rgba(30,20,10,0.82)',
          lineHeight:1.4,
        }}>
          {universe.subtitle}
        </div>
        <div style={{
          fontFamily:"'Jost',sans-serif", fontSize: isMobile ? 12 : 14, fontWeight:700,
          color: universe.color, marginTop: isMobile ? 2 : 5,
        }}>
          {hasChoice ? (isExpanded ? 'Choisis un rituel ↑' : 'Voir les rituels →') : 'Voir les rituels →'}
        </div>
      </div>
    </button>
  )
}

// Choix fin — apparaît sous une carte univers regroupant plusieurs besoins
function NeedSubChoice({ universe, onSelect, isMobile }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap: isMobile ? 6 : 8, padding: isMobile ? '2px 4px 2px 8px' : '2px 4px 2px 16px', animation:'nm_fadeUp .3s ease both' }}>
      {universe.needIds.map(id => {
        const need = needById(id)
        if (!need) return null
        return (
          <button key={id} onClick={() => onSelect(need)} style={{
            padding: isMobile ? '7px 12px' : '11px 20px', borderRadius:100,
            border:`1.5px solid ${universe.color}55`, background:'#fff',
            boxShadow:'0 2px 8px rgba(0,0,0,0.10)',
            color:universe.color, fontFamily:"'Jost',sans-serif",
            fontSize: isMobile ? 12 : 16.5, fontWeight:600,
            cursor:'pointer', display:'flex', alignItems:'center', gap: isMobile ? 4 : 6,
          }}>
            {need.label} <span style={{ opacity:.6 }}>→</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Rituels par durée ───────────────────────────────────────────────────────

const TIME_BUCKETS = [
  { id:'micro',  label:'Moins de 2 min', sub:'Une pause éclair',      emoji:'⚡', g1:'#2058B0', g2:'#5090E0', durs:['1 min'] },
  { id:'short',  label:'2 à 5 min',      sub:'Un moment pour moi',    emoji:'🌱', g1:'#1A6645', g2:'#38A870', durs:['2 min','3 min'] },
  { id:'medium', label:'5 à 15 min',     sub:'Une vraie pause',       emoji:'🌿', g1:'#A06010', g2:'#D8A030', durs:['10 min','10 min/soir','15 min'] },
  { id:'long',   label:'Plus de 15 min', sub:'Une séance complète',   emoji:'🌸', g1:'#5B3FA0', g2:'#8B6FD0', durs:null },
]

const SHORT_DURS = ['1 min','2 min','3 min','10 min','10 min/soir','15 min']

// ─── Gestion de session (2 rituels max, cooldown 1h) ─────────────────────────
const SESSION_KEY = 'ritual_session_v2'

function loadSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}')
    if (s.cooldownUntil && Date.now() >= new Date(s.cooldownUntil).getTime()) {
      return { count: 0, cooldownUntil: null, doneIds: [] }
    }
    return { count: s.count ?? 0, cooldownUntil: s.cooldownUntil ?? null, doneIds: s.doneIds ?? [] }
  } catch { return { count: 0, cooldownUntil: null, doneIds: [] } }
}

function saveSession(s) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s))
}

// Salve de paillettes — retour visuel immédiat quand la fleur évolue.
// La fleur elle-même n'est pas visible pendant que ce modal plein écran
// est ouvert, d'où ce feedback local en plus de l'événement plantCelebrate.
const SPARKLE_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  angle: (i / 10) * 360 + (i % 2) * 18,
  dist: 70 + (i % 3) * 22,
  delay: (i % 4) * 0.04,
  size: 14 + (i % 3) * 6,
}))

function SparkleBurst() {
  return (
    <div aria-hidden style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'visible', zIndex:5 }}>
      <style>{`
        @keyframes sparkleBurst {
          0%   { transform:translate(-50%,-50%) scale(0.3); opacity:0; }
          25%  { opacity:1; }
          100% { transform:translate(calc(-50% + var(--sx)), calc(-50% + var(--sy))) scale(1); opacity:0; }
        }
      `}</style>
      {SPARKLE_PARTICLES.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180
        const sx = `${Math.cos(rad) * p.dist}px`
        const sy = `${Math.sin(rad) * p.dist}px`
        return (
          <span key={i} style={{
            position:'absolute', top:'50%', left:'50%', fontSize:p.size,
            '--sx':sx, '--sy':sy,
            animation:`sparkleBurst 0.9s ease-out ${p.delay}s both`,
          }}>✨</span>
        )
      })}
    </div>
  )
}

function RitualByTimeModal({ onClose, userId, plantId, onHealthUpdate }) {
  const [bucket,   setBucket]   = useState(null)
  const [rituals,  setRituals]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState(null)
  const [done,     setDone]     = useState(false)
  const [session,  setSession]  = useState(loadSession)
  const [, setTick]             = useState(0)
  const isMobile = useIsMobile()

  // Tick chaque seconde pendant le cooldown pour mettre à jour l'affichage
  useEffect(() => {
    if (!session.cooldownUntil) return
    const id = setInterval(() => {
      // Auto-reset si expiré
      if (Date.now() >= new Date(session.cooldownUntil).getTime()) {
        const reset = { count: 0, cooldownUntil: null, doneIds: [] }
        setSession(reset)
        saveSession(reset)
      }
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [session.cooldownUntil])

  const now = Date.now()
  const cooldownMs = session.cooldownUntil ? Math.max(0, new Date(session.cooldownUntil).getTime() - now) : 0
  const inCooldown = cooldownMs > 0
  const canValidate = !inCooldown && session.count < 2
  const cooldownH = Math.floor(cooldownMs / 3600000)
  const cooldownM = Math.floor((cooldownMs % 3600000) / 60000)
  const cooldownLabel = cooldownH > 0 ? `${cooldownH}h ${cooldownM} min` : `${cooldownM} min`

  async function handleValidate() {
    if (!canValidate || done) return
    const newCount = session.count + 1
    const newCooldownUntil = newCount >= 2 ? new Date(now + 60 * 60 * 1000).toISOString() : null
    const newDoneIds = [...session.doneIds, selected.n]
    const newSession = { count: newCount, cooldownUntil: newCooldownUntil, doneIds: newDoneIds }
    setSession(newSession)
    saveSession(newSession)
    setDone(true)
    playChime()
    const zoneLabel = ZONE_LABELS[selected?.zone] || 'Racines'
    try {
      await completeRitualHealth({ plantId, zoneId: selected?.zone, onHealthUpdate, userId })
    } catch (e) { console.error('[ritual] health update failed:', e) }
    if (userId && plantId && selected?.n) {
      try {
        await supabase.from('rituals').insert({ user_id: userId, plant_id: plantId, name: selected.title || String(selected.n), zone: zoneLabel, health_delta: RITUAL_DELTA })
        await logActivity({ userId, action: 'ritual', ritual: selected.title || String(selected.n), zone: zoneLabel, circleId: null })
      } catch (e) { console.error('[ritual] log failed:', e) }
    }
    setTimeout(onClose, 1400)
  }

  useEffect(() => {
    if (!bucket) return
    setLoading(true)
    setRituals([])
    setSelected(null)
    setDone(false)
    let q = supabase.from('rituels').select('*').order('n')
    if (bucket.durs) {
      q = q.in('dur', bucket.durs)
    } else {
      q = q.not('dur', 'in', `(${SHORT_DURS.map(d => `"${d}"`).join(',')})`)
        .not('dur', 'in', '("Variable","Journée","Journée entière","Demi-journée","1–2 jours")')
    }
    q.then(({ data }) => { setRituals(data || []); setLoading(false) })
  }, [bucket])

  const ZONE_COLORS  = { roots:'#c87840', stem:'#5a9a50', leaves:'#48a078', flowers:'#c87898', breath:'#6888c0' }
  const ZONE_LABELS  = { roots:'Racines', stem:'Tige', leaves:'Feuilles', flowers:'Fleurs', breath:'Souffle' }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:400,
      background:'rgba(10,8,5,0.82)', backdropFilter:'blur(10px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding: isMobile ? 0 : 24,
    }}>
      <div style={{
        width: isMobile ? '100%' : selected ? 'min(900px,95vw)' : 'min(520px,95vw)',
        height: isMobile ? '100%' : 'auto',
        maxHeight: isMobile ? '100%' : '90vh',
        background:'linear-gradient(160deg,#fdf9f4,#f4ede4)',
        borderRadius: isMobile ? 0 : 24,
        display:'flex', flexDirection:'column',
        overflow:'hidden',
        boxShadow:'0 32px 80px rgba(0,0,0,0.4)',
        transition: 'width 0.25s ease',
      }}>
        {/* Header */}
        <div style={{ padding:'20px 20px 12px', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid rgba(0,0,0,0.06)', flexShrink:0 }}>
          {bucket && (
            <button onClick={() => { setBucket(null); setSelected(null) }} style={{ background:'rgba(0,0,0,0.06)', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
          )}
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: bucket ? 20 : 26, fontWeight:600, fontStyle:'italic', color:'#1a1008', margin:0, lineHeight:1.2 }}>
              {bucket ? bucket.label : 'Choisissez le temps que vous y accordez'}
            </p>
            {!bucket && <p style={{ fontFamily:"'Jost',sans-serif", fontSize:16, fontWeight:600, color:'#1a1008', margin:'4px 0 0' }}>Parmi 120 rituels disponibles</p>}
            {bucket && !loading && (
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <p style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:'rgba(30,20,8,0.5)', margin:0 }}>{rituals.length} rituel{rituals.length > 1 ? 's' : ''}</p>
              {inCooldown ? (
                <span style={{ fontFamily:"'Jost',sans-serif", fontSize:11, background:'rgba(200,80,60,0.10)', color:'#c04030', borderRadius:20, padding:'2px 8px' }}>
                  Cooldown · {cooldownLabel}
                </span>
              ) : (
                <span style={{ fontFamily:"'Jost',sans-serif", fontSize:11, background:'rgba(60,140,80,0.10)', color:'#3a8050', borderRadius:20, padding:'2px 8px' }}>
                  {session.count}/2 rituels
                </span>
              )}
            </div>
          )}
          </div>
          <button onClick={onClose} style={{ background:'rgba(0,0,0,0.06)', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(30,20,8,0.6)', flexShrink:0 }}>✕</button>
        </div>

        {/* Contenu */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 40px', WebkitOverflowScrolling:'touch' }}>

          {/* Sélection bucket */}
          {!bucket && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {TIME_BUCKETS.map(b => (
                <button key={b.id} onClick={() => setBucket(b)} style={{
                  background:`linear-gradient(135deg,${b.g1},${b.g2})`,
                  border:'none', borderRadius:18, padding:'20px 16px',
                  cursor:'pointer', textAlign:'left', color:'#fff',
                  boxShadow:`0 6px 20px ${b.g1}55`,
                  transition:'transform 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform='scale(1.03)'}
                  onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                >
                  <div style={{ fontSize:34, marginBottom:12 }}>{b.emoji}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, fontStyle:'italic', lineHeight:1.2, marginBottom:6 }}>{b.label}</div>
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:14, opacity:0.85 }}>{b.sub}</div>
                </button>
              ))}
            </div>
          )}

          {/* Liste rituels */}
          {bucket && !selected && (
            loading ? (
              <p style={{ textAlign:'center', color:'rgba(30,20,8,0.4)', fontFamily:"'Jost',sans-serif", fontSize:14, padding:'40px 0' }}>Chargement…</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {rituals.map(r => (
                  <button key={r.n} onClick={() => { setSelected(r); setDone(session.doneIds.includes(r.n)) }} style={{
                    display:'flex', alignItems:'center', gap:12,
                    background:'#fff', border:'1px solid rgba(0,0,0,0.07)',
                    borderRadius:14, padding:'12px 14px',
                    cursor:'pointer', textAlign:'left',
                    transition:'box-shadow 0.15s',
                    boxShadow:'0 1px 6px rgba(0,0,0,0.04)',
                  }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.10)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 6px rgba(0,0,0,0.04)'}
                  >
                    <span style={{ fontSize:22, flexShrink:0 }}>{r.icon || '🌿'}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"'Jost',sans-serif", fontSize:14, fontWeight:600, color:'#1a1008', lineHeight:1.25, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.title}</div>
                      <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color: ZONE_COLORS[r.zone] || '#888', marginTop:2 }}>{ZONE_LABELS[r.zone] || r.zone} · {r.dur}</div>
                    </div>
                    {session.doneIds.includes(r.n)
                      ? <span style={{ fontSize:14, color:'#3a8050', flexShrink:0 }}>✓</span>
                      : <span style={{ color:'rgba(30,20,8,0.25)', fontSize:16, flexShrink:0 }}>›</span>
                    }
                  </button>
                ))}
              </div>
            )
          )}

          {/* Détail rituel */}
          {selected && (
            inCooldown ? (
              <div>
                <button onClick={() => { setSelected(null); setDone(false) }} style={{ background:'none', border:'none', fontFamily:"'Jost',sans-serif", fontSize:12, color:'rgba(30,20,8,0.45)', cursor:'pointer', padding:'0 0 16px', display:'flex', alignItems:'center', gap:4 }}>‹ Retour à la liste</button>
                <div style={{ textAlign:'center', padding:'14px 0' }}>
                  <p style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:'#c04030', margin:'0 0 4px' }}>
                    Vous avez fait 2 rituels dans cette session.
                  </p>
                  <p style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:'rgba(30,20,8,0.55)', margin:0 }}>
                    Revenez dans <strong>{cooldownLabel}</strong> pour continuer.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ position:'relative' }}>
                <ExerciseDetail
                  exercise={selected}
                  zone={{ name: ZONE_LABELS[selected.zone] || selected.zone, color: ZONE_COLORS[selected.zone] || '#888', accent: ZONE_COLORS[selected.zone] || '#888' }}
                  initialMarked={done}
                  onBack={() => { setSelected(null); setDone(false) }}
                  onDone={handleValidate}
                />
                {done && <SparkleBurst />}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Modal principal ─────────────────────────────────────────────────────────

function NeedModalInner({ onSelectNeed, onClose, isMobile, recommendedIds = [], userId, plantId, plantHealth, onHealthUpdate, appUnlocked, onEnterApp, onboarding, isPremium, onUpgrade, onAudio, onSeeFlower, onCompleteRitual, vitalityTotal, vitalityGain }) {
  const [showByTime,  setShowByTime]  = useState(false)
  const [showAudio,   setShowAudio]   = useState(false)
  const [showFinder,  setShowFinder]  = useState(false)
  const [expandedUniverse, setExpandedUniverse] = useState(null)

  const recommendedUniverseIds = [...new Set(
    recommendedIds.map(id => universeForNeed(id)?.id).filter(Boolean)
  )]

  function handleUniverseSelect(need) {
    setExpandedUniverse(null)
    onSelectNeed(need)
  }
  function handleUniverseToggle(universeId) {
    setExpandedUniverse(prev => prev === universeId ? null : universeId)
  }

  return (
    <>
      {/* Grain subtil */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none', zIndex:0, opacity:.018,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat:'repeat', backgroundSize:'128px',
      }}/>
      {/* Halos */}
      <div style={{position:'absolute', inset:0, pointerEvents:'none', zIndex:0}}>
        <div style={{position:'absolute',top:'-10%',left:'-8%',width:360,height:360,borderRadius:'50%',background:'radial-gradient(circle,rgba(160,130,220,.10) 0%,transparent 70%)'}}/>
        <div style={{position:'absolute',bottom:'5%',right:'-8%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(20,150,140,.08) 0%,transparent 70%)'}}/>
      </div>
      {/* Particules */}
      <div style={{position:'absolute', inset:0, pointerEvents:'none', zIndex:0}}>
        {PARTICLES.map((p,i) => (
          <div key={i} style={{
            position:'absolute', left:p.x, top:p.y,
            width:p.s, height:p.s, borderRadius:'50%',
            background:'rgba(255,255,255,0.9)',
            boxShadow:`0 0 ${p.s*4}px ${p.s*2}px rgba(210,190,255,0.35)`,
            animation:`nm_float ${p.dur}s ease-in-out ${p.d}s infinite`,
          }}/>
        ))}
      </div>
      {/* Bouton fermer — masqué quand un sous-modal plein écran est ouvert (sinon il reste visible au-dessus, cf. contexte d'empilement) */}
      {!showByTime && !showAudio && !showFinder && (
        <button onClick={onClose} style={{
          position:'absolute', top:16, right:16, zIndex:10,
          width:32, height:32, borderRadius:'50%',
          background:'rgba(255,255,255,0.50)', border:'1px solid rgba(180,160,200,.30)',
          backdropFilter:'blur(8px)', cursor:'pointer', fontSize:13, color:'rgba(50,35,70,.45)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>✕</button>
      )}
      {/* Contenu */}
      <div style={{
        position:'relative', zIndex:1, flex:1, minHeight:0, overflowY:'auto',
        width:'100%', margin:'0 auto',
        padding: onboarding && isMobile ? '12px 12px 0 76px' : isMobile ? '16px 16px 0' : '32px 32px 0',
        boxSizing:'border-box', display:'flex', flexDirection:'column',
      }}>
        {/* Header */}
        <div style={{textAlign:'center', marginBottom: isMobile ? '10px' : '20px', animation:'nm_fadeUp .45s ease both', flexShrink:0}}>
          <h1 style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize: isMobile ? 22 : 38,
            fontWeight:400, color:'#2A1F18', lineHeight:1.2,
            margin:'0 0 4px', letterSpacing:'-.01em',
          }}>
            {isMobile ? <>Quel est ton besoin<br/><em style={{fontStyle:'italic', fontWeight:300, color:'#4a3860'}}>en ce moment ?</em></> : <>Quel est ton besoin <em style={{fontStyle:'italic', fontWeight:300, color:'#4a3860'}}>en ce moment ?</em></>}
          </h1>
          <p style={{
            fontFamily:"'Jost',sans-serif",
            fontSize: isMobile ? 20 : 26,
            fontWeight:600, color:'#1a1008',
            margin:'0 0 2px', letterSpacing:'.01em',
          }}>Suis ce qui résonne en toi</p>
          <p style={{
            fontFamily:"'Jost',sans-serif",
            fontSize: isMobile ? 15 : 19,
            fontWeight:600, color:'#1a1008',
            margin:0, letterSpacing:'.01em',
          }}>Un seul choix suffit pour commencer</p>
        </div>

        {/* "Trouve tes rituels" — carte de test, dev uniquement pour l'instant */}
        {import.meta.env.DEV && (
          <button onClick={() => setShowFinder(true)} style={{
            flexShrink: 0, width: '100%', height: isMobile ? 88 : 100, textAlign: 'left', border: 'none', cursor: 'pointer',
            marginBottom: isMobile ? 12 : 16, padding: 0,
            borderRadius: 18, background: 'linear-gradient(135deg,#7d4368,#a06a8c)',
            color: '#fff', boxShadow: '0 6px 20px rgba(125,67,104,0.30)',
            display: 'flex', alignItems: 'center', animation: 'nm_fadeUp .5s ease both',
            position: 'relative', overflow: 'hidden',
          }}>
            {!isPremium && (
              <div style={{ position: 'absolute', zIndex: 2, top: 10, right: 12, fontSize: 22 }}>🔒</div>
            )}

            {/* Illustration — object-fit:cover force un zoom trop fort sur ce format très large/bas.
                On affiche l'image à une taille réduite (45% de largeur) et on la décale pour cadrer
                le dôme entier plutôt qu'un fragment. */}
            <div style={{
              position:'absolute', inset:0, overflow:'hidden',
              maskImage: 'linear-gradient(90deg, #000 0%, #000 12%, transparent 28%)',
              WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 12%, transparent 28%)',
            }}>
              <img src="/carte5.png" alt="" style={{
                position:'absolute', width:'45%', height:'auto', display:'block',
                left:'0%', top: isMobile ? '-65%' : '-101%',
              }}/>
            </div>

            <div style={{ position:'relative', zIndex:1, flex: 1, minWidth:0, padding: isMobile ? '14px 16px 14px 100px' : '18px 20px 18px 150px' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 18 : 27, fontStyle: 'italic', fontWeight: 600, marginBottom: isMobile ? 2 : 4, lineHeight:1.15 }}>Définir mon protocole de rituels personnalisé</div>
              <div style={{ fontFamily: "'Jost',sans-serif", fontWeight:500, fontSize: isMobile ? 12 : 17, opacity: 0.92, lineHeight:1.3 }}>
                {isPremium ? 'Un questionnaire, une sélection de rituels rien que pour toi — DEV' : '3 problématiques offertes, le reste en Premium — DEV'}
              </div>
            </div>
            <span style={{ position:'relative', zIndex:1, fontSize: isMobile ? 14 : 16, opacity: 0.8, marginRight: isMobile ? 12 : 20, flexShrink:0 }}>›</span>
          </button>
        )}

        {/* Bouton jardin — visible quand 50% de vitalité atteints */}
        {appUnlocked && (
          <div style={{ flexShrink:0, padding: isMobile ? '4px 0 calc(env(safe-area-inset-bottom,0px) + 20px)' : '8px 0 28px', animation:'nm_fadeUp .5s ease both' }}>
            <div style={{
              background:'linear-gradient(135deg,rgba(28,56,24,0.07),rgba(59,109,17,0.05))',
              border:'1px solid rgba(59,109,17,0.18)',
              borderRadius:18,
              padding: isMobile ? '18px 16px 20px' : '22px 24px 24px',
              textAlign:'center',
            }}>
              <div style={{ fontSize: isMobile ? 28 : 32, marginBottom:10 }}>🌿</div>
              <p style={{
                fontFamily:"'Cormorant Garamond',serif",
                fontSize: isMobile ? 17 : 20,
                fontWeight:400, fontStyle:'italic',
                color:'#1c3818', lineHeight:1.45,
                margin:'0 0 16px',
              }}>
                Ta fleur t'attend dans ton jardin intérieur
              </p>
              <button
                onClick={onEnterApp}
                className={onboarding ? 'nm-jardin-aura' : ''}
                style={{
                  display:'block', width:'100%',
                  padding: isMobile ? '15px 24px' : '13px 32px',
                  borderRadius:50,
                  background:'linear-gradient(135deg,#1c3818,#3B6D11)',
                  border:'none', cursor:'pointer',
                  color:'#c8e6b0',
                  fontSize: isMobile ? 15 : 14,
                  fontWeight:600,
                  fontFamily:"'Jost',sans-serif",
                  letterSpacing:'.04em',
                  boxShadow:'0 8px 28px rgba(28,56,24,0.35)',
                }}
              >
                Entrer dans mon jardin →
              </button>
            </div>
          </div>
        )}

        {/* Univers */}
        <div style={{ display:'flex', flexDirection:'column', gap: isMobile ? 12 : 16, flexShrink:0, paddingBottom: isMobile ? 24 : 32 }}>
          {UNIVERSES.map((universe, i) => (
            <div key={universe.id} style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <UniverseCard
                universe={universe}
                index={i}
                onSelect={handleUniverseSelect}
                onToggleExpand={handleUniverseToggle}
                isMobile={isMobile}
                isRecommended={recommendedUniverseIds.includes(universe.id)}
                isExpanded={expandedUniverse === universe.id}
              />
              {expandedUniverse === universe.id && (
                <NeedSubChoice universe={universe} onSelect={handleUniverseSelect} isMobile={isMobile}/>
              )}
            </div>
          ))}
        </div>

        {/* Card rituels audios */}
        {(
          <div style={{ flexShrink:0, paddingBottom: isMobile ? 12 : 16, animation:'nm_fadeUp .45s ease .3s both' }}>
            <button
              onClick={() => setShowAudio(true)}
              style={{
                width:'100%', height: isMobile ? 110 : 128, display:'flex', alignItems:'stretch', padding:0,
                borderRadius:20, border:'1px solid rgba(180,130,170,0.25)',
                background:'linear-gradient(135deg, #F1E6F3, #F9EAEE)',
                boxShadow:'0 6px 18px rgba(140,90,140,0.12)',
                cursor:'pointer', textAlign:'left', position:'relative', overflow:'hidden',
                transition:'transform 0.15s, box-shadow 0.15s',
                boxSizing:'border-box',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 26px rgba(140,90,140,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 6px 18px rgba(140,90,140,0.12)' }}
            >
              {/* Illustration — image réduite à 50% de largeur puis décalée pour cadrer le casque entier
                  (object-fit:cover zoomait trop fort sur ce format très large/bas). */}
              <div style={{
                position:'absolute', inset:0, overflow:'hidden',
                maskImage: 'linear-gradient(90deg, #000 0%, #000 10%, transparent 24%)',
                WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 10%, transparent 24%)',
              }}>
                <img src="/carte6.png" alt="" style={{
                  position:'absolute', width:'50%', height:'auto', display:'block',
                  left:'0%', top: isMobile ? '-52%' : '-81%',
                }}/>
              </div>

              <div style={{
                position:'relative', zIndex:1, flex:1, minWidth:0, height:'100%',
                display:'flex', alignItems:'center', gap: isMobile ? 12 : 16,
                padding: isMobile ? '0 12px 0 80px' : '0 18px 0 118px',
              }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 23 : 28, fontWeight:600, fontStyle:'italic', color:'#5C3A66', lineHeight:1.2 }}>
                    Rituels guidés en audio
                  </div>
                  <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:500, fontSize: isMobile ? 14.5 : 17, color:'rgba(74,38,86,0.85)', marginTop:5, letterSpacing:'.02em' }}>
                    {isPremium ? 'La voix te porte, tu fermes les yeux' : '2 rituels offerts, le reste en Premium'}
                  </div>
                </div>
              </div>

              <div style={{
                position:'relative', zIndex:1, alignSelf:'center', flexShrink:0, marginRight: isMobile ? 12 : 16,
                width: isMobile ? 44 : 54, height: isMobile ? 44 : 54, borderRadius:'50%',
                background:'linear-gradient(135deg,#7B4FA8,#5C3A66)', color:'#fff',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize: isMobile ? 17 : 20,
                boxShadow:'0 4px 10px rgba(0,0,0,0.25)',
              }}>▶</div>
            </button>
          </div>
        )}

        {/* Footer — accès aux 120 rituels (conditionné premium, caché en onboarding) */}
        {!onboarding && (
          <div style={{ flexShrink:0, paddingBottom: isMobile ? 20 : 28, animation:'nm_fadeUp .5s ease .35s both' }}>
            <button
              onClick={() => isPremium ? setShowByTime(true) : onUpgrade?.()}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap: isMobile ? 14 : 18,
                padding: isMobile ? '16px 18px' : '20px 26px',
                borderRadius:20, border:'none', textAlign:'left', cursor:'pointer',
                background: isPremium
                  ? 'linear-gradient(135deg,#5a9a28,#3a7a18)'
                  : 'linear-gradient(135deg,#2c4a1e,#1a3012)',
                boxShadow: isPremium ? '0 8px 26px rgba(60,120,20,.30)' : '0 8px 26px rgba(20,40,10,0.32)',
                position:'relative', overflow:'hidden',
                transition:'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='none' }}
            >
              {!isPremium && (
                <div style={{ position:'absolute', top:14, right:16, fontSize:24 }}>🔒</div>
              )}
              <div style={{
                flexShrink:0, width: isMobile ? 50 : 60, height: isMobile ? 50 : 60, borderRadius:'50%',
                background:'rgba(255,255,255,0.14)', border:'1px solid rgba(255,255,255,0.28)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize: isMobile ? 24 : 28,
              }}>
                {isPremium ? '✨' : '🌿'}
              </div>
              <div style={{ flex:1, minWidth:0, color:'#fff' }}>
                <div style={{ fontFamily:"'Jost',sans-serif", fontSize: isMobile ? 11.5 : 13, fontWeight:600, opacity:0.78, letterSpacing:'.04em', textTransform:'uppercase', marginBottom:4 }}>
                  {isPremium ? 'Accède aux 120 rituels disponibles' : '120 rituels disponibles en Premium'}
                </div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 19 : 24, fontWeight:700, fontStyle:'italic', lineHeight:1.2 }}>
                  {isPremium ? 'Je choisis mon rituel' : 'Débloquer l\'accès Premium'}
                </div>
                {!isPremium && (
                  <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:500, fontSize: isMobile ? 12 : 13.5, marginTop:5, opacity:0.82 }}>
                    Choisis ton rituel selon le temps que tu as devant toi
                  </div>
                )}
              </div>
              <span style={{ fontSize: isMobile ? 18 : 22, color:'rgba(255,255,255,0.7)', flexShrink:0 }}>→</span>
            </button>
          </div>
        )}
        {showByTime && <RitualByTimeModal onClose={() => setShowByTime(false)} userId={userId} plantId={plantId} plantHealth={plantHealth} onHealthUpdate={onHealthUpdate} />}
        {showAudio && <AudioRitualsModal onClose={() => setShowAudio(false)} plantId={plantId} plantHealth={plantHealth} onHealthUpdate={onHealthUpdate} onSeeFlower={onSeeFlower ?? onClose} onboarding={onboarding} onCompleteRitual={onCompleteRitual} vitalityTotal={vitalityTotal} vitalityGain={vitalityGain} isPremium={isPremium} onUpgrade={onUpgrade} />}
        {showFinder && <RitualFinderModal onClose={() => setShowFinder(false)} userId={userId} plantId={plantId} onHealthUpdate={onHealthUpdate} isPremium={isPremium} onUpgrade={onUpgrade} />}
      </div>
    </>
  )
}

export default function NeedSelectionModal({ onSelectNeed, onClose, bilanDegradation, userId, plantId, plantHealth, onHealthUpdate, appUnlocked, onEnterApp, onboarding, isPremium, onUpgrade, onAudio, onSeeFlower, onCompleteRitual, vitalityTotal, vitalityGain }) {
  const isMobile = useIsMobile()
  const bgStyle = {
    backgroundColor: '#f7f0e6',
    backgroundImage: 'linear-gradient(rgba(255,251,244,0.55),rgba(255,251,244,0.55)), url(/fondchoix.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center top',
    backgroundRepeat: 'no-repeat',
  }
  const recommendedIds = getRecommendedNeeds(bilanDegradation)
  const shared = { onSelectNeed, onClose, recommendedIds, userId, plantId, plantHealth, onHealthUpdate, appUnlocked, onEnterApp, onboarding, isPremium, onUpgrade, onAudio, onSeeFlower, onCompleteRitual, vitalityTotal, vitalityGain }

  if (!isMobile) return (
    <>
      <style>{CSS}</style>
      <div style={{ position:'fixed', inset:0, zIndex:260, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,12,5,0.55)', backdropFilter:'blur(8px)' }}/>
        <div style={{
          position:'relative', zIndex:1,
          width:'min(780px, 95vw)', maxHeight:'92vh',
          borderRadius:24, overflow:'hidden', ...bgStyle,
          display:'flex', flexDirection:'column',
          boxShadow:'0 32px 80px rgba(0,0,0,0.32)',
        }}>
          <NeedModalInner {...shared} isMobile={false} />
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{CSS}</style>
      <div style={{ position:'fixed', inset:0, zIndex:260, ...bgStyle, display:'flex', flexDirection:'column' }}>
        <NeedModalInner {...shared} isMobile={true} />
      </div>
    </>
  )
}
