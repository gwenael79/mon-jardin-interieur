// ─────────────────────────────────────────────────────────────────────────────
//  ScreenClubJardiniers.jsx
//  3 onglets : Égrégore · Mes Fleurs · Le Jardin
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'

import { useAnalytics } from '../hooks/useAnalytics'
import { supabase } from '../core/supabaseClient'
import { logActivity } from '../utils/logActivity'
import { logNetworkActivity } from '../utils/logNetworkActivity'
import { useIsMobile, Toast, timeAgo } from './dashboardShared'

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────
const ZONES = [
  { key: 'zone_souffle',  name: 'Souffle',  icon: '🌬️', color: 'var(--zone-breath)', angle: 90  },
  { key: 'zone_feuilles', name: 'Feuilles', icon: '🍃', color: 'var(--zone-leaves)', angle: 18  },
  { key: 'zone_fleurs',   name: 'Fleurs',   icon: '🌸', color: 'var(--zone-flowers)', angle: 306 },
  { key: 'zone_racines',  name: 'Racines',  icon: '🌱', color: 'var(--zone-roots)', angle: 234 },
  { key: 'zone_tige',     name: 'Tige',     icon: '🌿', color: 'var(--zone-stem)', angle: 162 },
]

const ZONE_MAP = Object.fromEntries(ZONES.map(z => [z.key, z]))
const FRAGILE  = 35

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function flowerName(user) {
  if (!user) return 'Une fleur'
  if (user.flower_name) return `${user.display_name}·${user.flower_name}`
  return user.display_name ?? 'Une fleur'
}

function fragileZones(plant) {
  return ZONES
    .filter(z => (plant?.[z.key] ?? 5) < FRAGILE)
    .sort((a, b) => (plant?.[a.key] ?? 5) - (plant?.[b.key] ?? 5))
}

function petalPath(angleDeg, pct, cx = 130, cy = 130, minPct = 0) {
  const minR = 22, maxR = 78
  const effectivePct = Math.max(pct, minPct)
  const r    = minR + (effectivePct / 100) * (maxR - minR)
  const rad  = ((angleDeg - 90) * Math.PI) / 180
  const tip  = { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  const w    = 18 + (pct / 100) * 14
  const lRad = rad - Math.PI / 2
  const c1   = { x: cx + r * .42 * Math.cos(rad) + w * Math.cos(lRad), y: cy + r * .42 * Math.sin(rad) + w * Math.sin(lRad) }
  const c2   = { x: cx + r * .42 * Math.cos(rad) - w * Math.cos(lRad), y: cy + r * .42 * Math.sin(rad) - w * Math.sin(lRad) }
  return `M ${cx} ${cy} Q ${c1.x} ${c1.y} ${tip.x} ${tip.y} Q ${c2.x} ${c2.y} ${cx} ${cy} Z`
}

function polarToXY(angleDeg, r, cx = 130, cy = 130) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function vitality(plant) {
  if (!plant) return 5
  const vals = ZONES.map(z => plant[z.key] ?? 5)
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
}

// ─────────────────────────────────────────────────────────────────────────────
//  EDGE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
async function generateCoeurMessage({ senderName, receiverName, zone }) {
  const zoneName = ZONE_MAP[zone]?.name ?? zone
  try {
    const { data, error } = await supabase.functions.invoke('Moderate-circle', {
      body: { action: 'generate_coeur_message', senderName, receiverName, zone: zoneName }
    })
    if (error) throw error
    return data?.message ?? null
  } catch {
    const fallbacks = [
      `${senderName} pense à vous et vous envoie toute sa chaleur sur vos ${zoneName.toLowerCase()}.`,
      `Un élan du cœur de ${senderName} — vos ${zoneName.toLowerCase()} méritent d'être célébrées.`,
      `${senderName} vous voit avancer et vous envoie cette énergie pour nourrir vos ${zoneName.toLowerCase()}.`,
    ]
    return fallbacks[Math.floor(Math.random() * fallbacks.length)]
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPOSANT PARTICULE (copié du prototype FleurCollective)
// ─────────────────────────────────────────────────────────────────────────────
function Particle({ x, y, color, char, vx: initVx, vy: initVy, dur: initDur, onDone }) {
  const [pos, setPos]   = useState({ x, y, o: 1, rot: 0 })
  const [gone, setGone] = useState(false)
  const frame = useRef(null)
  const start = useRef(Date.now())

  useEffect(() => {
    const dur = initDur ?? (3200 + Math.random() * 1200)
    const vx  = initVx  ?? (0.5 + Math.random() * 0.8)
    const vy  = initVy  ?? -(0.5 + Math.random() * 0.7)
    const rot = (Math.random() - 0.5) * 0.004
    function tick() {
      const elapsed = Date.now() - start.current
      const p = Math.min(elapsed / dur, 1)
      setPos({ x: x + vx * elapsed * 0.06, y: y + vy * elapsed * 0.06, o: 1 - p, rot: rot * elapsed })
      if (p < 1) frame.current = requestAnimationFrame(tick)
      else { setGone(true); onDone?.() }
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [])

  if (gone) return null
  if (char) return (
    <div style={{
      position: 'fixed', left: pos.x - 10, top: pos.y - 10,
      fontSize:'var(--fs-emoji-md, 18px)', opacity: pos.o, pointerEvents: 'none', zIndex: 9999,
      transform: `rotate(${pos.rot}rad)`, transition: 'none', userSelect: 'none',
    }}>{char}</div>
  )
  return (
    <div style={{
      position: 'fixed', left: pos.x - 4, top: pos.y - 4,
      width: 8, height: 8, borderRadius: '50%',
      background: color, opacity: pos.o, pointerEvents: 'none',
      boxShadow: `0 0 6px ${color}`, transition: 'none',
    }} />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  SVG FLEUR COLLECTIVE
// ─────────────────────────────────────────────────────────────────────────────
// ── FleurSimple — fleur décorative pour le modal Égrégore ──────────────────
function FleurSimple({ zonesData, pulseKey = null, size = 220 }) {
  const cx = 120, cy = 120, R = 108
  const globalVit = Math.round(ZONES.reduce((s, z) => s + (zonesData[z.key] ?? 5), 0) / ZONES.length)
  return (
    <svg viewBox="0 0 240 240" width={size} height={size}>
      <defs>
        {ZONES.map(z => (
          <radialGradient key={z.key} id={`fs-${z.key}`} cx="30%" cy="30%" r="70%">
            <stop offset="0%"   stopColor={z.color} stopOpacity="0.9"/>
            <stop offset="100%" stopColor={z.color} stopOpacity="0.3"/>
          </radialGradient>
        ))}
        <radialGradient id="fs-core" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#FFFAE0"/><stop offset="50%" stopColor="#F5C842"/><stop offset="100%" stopColor="#D4920A"/>
        </radialGradient>
      </defs>
      {ZONES.map(z => {
        const rad = ((z.angle - 90) * Math.PI) / 180
        const tx = cx + R * Math.cos(rad), ty = cy + R * Math.sin(rad)
        const lRad = rad - Math.PI / 2, w = 40
        const c1x = cx + R*.45*Math.cos(rad) + w*Math.cos(lRad), c1y = cy + R*.45*Math.sin(rad) + w*Math.sin(lRad)
        const c2x = cx + R*.45*Math.cos(rad) - w*Math.cos(lRad), c2y = cy + R*.45*Math.sin(rad) - w*Math.sin(lRad)
        const pct = zonesData[z.key] ?? 5
        const isPulse = pulseKey === z.key
        const d = `M ${cx} ${cy} Q ${c1x} ${c1y} ${tx} ${ty} Q ${c2x} ${c2y} ${cx} ${cy} Z`
        return (
          <g key={z.key}>
            {isPulse && <path d={d} fill={z.color} opacity="0.18" style={{ animation: 'petal-pulse .7s ease-out forwards' }} />}
            <path d={d} fill={`url(#fs-${z.key})`} stroke={z.color} strokeWidth={isPulse ? "1.2" : "0.6"} strokeOpacity="0.5"
              opacity={0.5 + (pct/100)*0.5}/>
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r="36" fill="rgba(255,255,255,0.6)"/>
      <circle cx={cx} cy={cy} r="33" fill="url(#fs-core)"/>
      <text x={cx} y={cy-5} textAnchor="middle" dominantBaseline="middle"
        fontSize="16" fontFamily="'Cormorant Garamond',serif" fill="rgba(30,20,5,0.9)" fontWeight="500">{globalVit}%</text>
      <text x={cx} y={cy+12} textAnchor="middle" dominantBaseline="middle"
        fontSize="6" fontFamily="Jost,sans-serif" fill="rgba(30,20,5,0.55)" letterSpacing=".1em">VITALITÉ</text>
    </svg>
  )
}
function FleurSVG({ zonesData, pulseKey, breathPhase, size = 260, svgRef, compact = false }) {
  const cx = 130, cy = 130

  const globalVit = Math.round(
    ZONES.reduce((s, z) => s + (zonesData[z.key] ?? 5), 0) / ZONES.length
  )


  return (
    <svg ref={svgRef} viewBox={compact ? "2 2 256 256" : "0 0 260 260"} width={size} height={size} style={{ overflow: 'hidden' }}>
      <defs>
        {ZONES.map(z => (
          <radialGradient key={z.key} id={`pg-${z.key}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={z.color} stopOpacity={pulseKey === z.key ? '.9' : '.65'} />
            <stop offset="100%" stopColor={z.color} stopOpacity=".05" />
          </radialGradient>
        ))}
        <radialGradient id="core-g" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="var(--gold-warm)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity=".5" />
        </radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="glow2"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>


      {/* Pétales */}
      {ZONES.map(z => {
        const pct      = zonesData[z.key] ?? 5
        const isPulse  = pulseKey === z.key
        const isFragile = pct < FRAGILE
        const breathR  = 1 + breathPhase * .022

        return (
          <g key={z.key}>
            <g style={{ transform: `scale(${breathR})`, transformOrigin: `${cx}px ${cy}px`, transition: 'transform .15s' }}>
              {isPulse && (
                <path d={petalPath(z.angle, Math.min(100, pct + 10), cx, cy, compact ? 60 : 0)}
                  fill={z.color} opacity=".14" filter="url(#glow2)"
                  style={{ animation: 'petal-pulse .7s ease-out forwards' }} />
              )}
              <path
                d={petalPath(z.angle, pct, cx, cy, compact ? 60 : 0)}
                fill={`url(#pg-${z.key})`}
                stroke={z.color}
                strokeWidth={isPulse ? '1.4' : '0.7'}
                strokeOpacity={isFragile ? '.4' : isPulse ? '.9' : '.5'}
                filter={isPulse ? 'url(#glow)' : undefined}
                style={{ transition: 'd 1s ease' }}
              />
            </g>
          </g>
        )
      })}

      {/* Cœur central — plus grand, vitalité bien visible */}
      <circle cx={cx} cy={cy} r={18 + breathPhase * 2.5}
        fill="url(#core-g)" filter="url(#glow)"
        style={{ transition: 'r .12s' }} />
      {/* % vitalité */}
      <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle"
        fontSize="13" fontFamily="'Cormorant Garamond',serif"
        fill="rgba(var(--overlay-dark-rgb,6,14,7),.92)" fontWeight="500">
        {globalVit}%
      </text>
      {/* label vitalité */}
      <text x={cx} y={cy + 8} textAnchor="middle" dominantBaseline="middle"
        fontSize="5.5" fontFamily="Jost, sans-serif"
        fill="rgba(var(--overlay-dark-rgb,6,14,7),.55)" letterSpacing=".08em">
        VITALITÉ
      </text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET ÉGRÉGORE
// ─────────────────────────────────────────────────────────────────────────────
function TabEgregore({ userId, myName, feedKey, onFeedRefresh, onParticleBurst, isPremium = false, onUpgrade }) {
  const isMobile                      = useIsMobile()
  const [zonesData, setZonesData]     = useState(Object.fromEntries(ZONES.map(z => [z.key, 50])))
  const [activeCount, setActiveCount] = useState(0)
  const [pulseKey, setPulseKey]       = useState(null)
  const svgRef = useRef(null)
  const [breathPhase, setBreath]      = useState(0)
  const [intention, setIntention]     = useState(null)
  const [joined, setJoined]           = useState(false)
  const [resonance, setResonance]     = useState(null)
  const [myMessages, setMyMessages]   = useState([]) // cœurs reçus par moi
  const [mercisEnvoyes, setMercisEnvoyes] = useState([])

  // Respiration
  useEffect(() => {
    let frame
    const start = Date.now()
    function tick() {
      setBreath(Math.sin(((Date.now() - start) / 3200) * Math.PI * 2) * .5 + .5)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  // Charger données collectives
  useEffect(() => {
    if (!userId) return
    loadCollectiveData()
    loadMyMessages()
    loadMercisEnvoyes()

    // Realtime — cœurs
    const channel = supabase
      .channel('coeurs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'coeurs' }, payload => {
        const z = payload.new?.zone
        if (z) {
          setPulseKey(z)
          setTimeout(() => setPulseKey(null), 1800)
          setZonesData(prev => ({ ...prev, [z]: Math.min(100, (prev[z] ?? 50) + .5) }))
          setActiveCount(n => n + 1)

        }
        // Si c'est pour moi
        if (payload.new?.receiver_id === userId) {
          loadMyMessages()
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId, feedKey])

  async function loadCollectiveData() {
    // Moyenne des zones de toutes les plantes du jour
    const today = new Date().toISOString().slice(0, 10)
    const { data: plants } = await supabase
      .from('plants')
      .select('zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
      .gte('date', today)

    if (plants?.length) {
      const sums = Object.fromEntries(ZONES.map(z => [z.key, 0]))
      plants.forEach(p => ZONES.forEach(z => { sums[z.key] += (p[z.key] ?? 5) }))
      const avgs = Object.fromEntries(ZONES.map(z => [z.key, Math.round(sums[z.key] / plants.length)]))
      setZonesData(avgs)
      setActiveCount(plants.length)

      // Résonance : zone la plus proche du seuil 80%
      const closestToSeuil = ZONES
        .map(z => ({ ...z, pct: avgs[z.key], dist: Math.abs(80 - avgs[z.key]) }))
        .filter(z => z.pct >= 60 && z.pct < 80)
        .sort((a, b) => a.dist - b.dist)[0]
      if (closestToSeuil) setResonance({ zone: closestToSeuil.key, current: closestToSeuil.pct, threshold: 80 })
    }

    // Intention du jour
    const todayDate = new Date().toISOString().slice(0, 10)
    const { data: int } = await supabase
      .from('intentions')
      .select('*')
      .eq('date', todayDate)
      .maybeSingle()
    setIntention(int ?? { text: 'Paix intérieure', description: 'Chaque rituel complété, chaque élan 💐 offert nourrit cette énergie collective.' })

    // Vérifier si déjà rejoint
    const { data: j } = await supabase
      .from('intentions_joined')
      .select('id')
      .eq('user_id', userId)
      .eq('date', todayDate)
      .maybeSingle()
    setJoined(!!j)
  }

  async function loadMyMessages() {
    // Cœurs reçus par moi, non encore remerciés
    const { data: coeurs } = await supabase
      .from('coeurs')
      .select('id, sender_id, zone, message_ia, created_at, sender:sender_id(display_name, flower_name)')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    setMyMessages(coeurs ?? [])
  }

  async function loadMercisEnvoyes() {
    const { data } = await supabase
      .from('mercis').select('coeur_id').eq('sender_id', userId)
    setMercisEnvoyes((data ?? []).map(m => m.coeur_id))
  }

  function spawnIntentionParticles() {
    if (!svgRef.current) return
    const rect   = svgRef.current.getBoundingClientRect()
    const scaleX = rect.width  / 260
    const scaleY = rect.height / 260
    const newPs  = []
    const PETALS = ['🌸','🌺','🌼','🌷','💮']
    const STARS  = ['✨','⭐','🌟','💫','✦']

    ZONES.forEach(z => {
      const pct = zonesData[z.key] ?? 50
      const r   = 28 + (pct / 100) * 95
      const pos = polarToXY(z.angle, r * 0.6, 130, 130)
      const bx  = rect.left + pos.x * scaleX
      const by  = rect.top  + pos.y * scaleY

      // 🌸 Pétales — montent lentement vers le haut à droite
      for (let i = 0; i < 3; i++) {
        newPs.push({
          id:    `${z.key}-petal-${i}-${Date.now()}-${Math.random()}`,
          x:     bx + (Math.random() - 0.5) * 20,
          y:     by + (Math.random() - 0.5) * 20,
          char:  PETALS[Math.floor(Math.random() * PETALS.length)],
          vx:    0.35 + Math.random() * 0.5,
          vy:   -(0.35 + Math.random() * 0.5),
          dur:   3200 + Math.random() * 1400,
          color: null,
        })
      }

      // ✨ Étoiles — explosent dans toutes les directions, rapides
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 0.9 + Math.random() * 1.1
        newPs.push({
          id:    `${z.key}-star-${i}-${Date.now()}-${Math.random()}`,
          x:     bx + (Math.random() - 0.5) * 14,
          y:     by + (Math.random() - 0.5) * 14,
          char:  STARS[Math.floor(Math.random() * STARS.length)],
          vx:    Math.cos(angle) * speed,
          vy:    Math.sin(angle) * speed,
          dur:   900 + Math.random() * 500,
          color: null,
        })
      }
    })

    onParticleBurst?.(newPs)
  }

  async function handleJoinIntention() {
    if (!isPremium) { onUpgrade?.(); return }
    const today = new Date().toISOString().slice(0, 10)
    if (joined) {
      await supabase.from('intentions_joined').delete().eq('user_id', userId).eq('date', today)
      setJoined(false)
    } else {
      window.dispatchEvent(new CustomEvent('analytics_track', { detail: { event: 'intention_join', props: {}, page: 'club', cat: 'social' } }))
      await supabase.from('intentions_joined').insert({ user_id: userId, date: today })
      logNetworkActivity(userId, 'intention_joined')
      window.dispatchEvent(new CustomEvent('garden:activity', { detail: { userId } }))
      setJoined(true)
      // Pulse chaque pétale en cascade
      ZONES.forEach((z, i) => {
        setTimeout(() => {
          setPulseKey(z.key)
          setTimeout(() => setPulseKey(null), 1800)
        }, i * 200)
      })
      // Particules style prototype
      spawnIntentionParticles()
    }
  }

  async function handleMerci(coeurId, senderId) {
    try {
      await supabase.from('mercis').insert({ sender_id: userId, receiver_id: senderId, coeur_id: coeurId })
      logActivity({ userId, action: 'merci' })
      logNetworkActivity(userId, 'merci')
      window.dispatchEvent(new CustomEvent('garden:activity', { detail: { userId } }))
      setMercisEnvoyes(prev => [...prev, coeurId])
      onFeedRefresh?.()
    } catch(e) { console.error(e) }
  }

  const pendingMercis = myMessages.filter(c => !mercisEnvoyes.includes(c.id))

  const globalVit = Math.round(ZONES.reduce((s, z) => s + (zonesData[z.key] ?? 5), 0) / ZONES.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>

      {/* ── ÉGRÉGORE — layout redesigné ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

        {/* Titre — bien visible */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? -16 : -24, zIndex: 1 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 28 : 36, fontWeight: 300, color: 'var(--gold)', letterSpacing: '.04em', lineHeight: 1 }}>L'Égrégore</div>
          <div style={{ fontSize: isMobile ? 13 : 14, color: 'var(--text3)', marginTop: 6, letterSpacing: '.04em' }}>
            <span style={{ color: 'rgba(var(--green-rgb),0.85)', fontWeight: 500 }}>{activeCount}</span>
            {' '}fleur{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''} aujourd'hui
          </div>
        </div>

        {/* Fleur */}
        <FleurSVG zonesData={zonesData} pulseKey={pulseKey} breathPhase={breathPhase} size={isMobile ? 300 : 380} svgRef={svgRef} />

        {/* Intention + bouton + résonance */}
        {intention && (
          <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 14, marginTop: isMobile ? -8 : -16 }}>

            {/* Label */}
            <div style={{ fontSize: isMobile ? 11 : 12, color: 'rgba(var(--gold-rgb),0.65)', letterSpacing: '.12em', textTransform: 'uppercase', textAlign: 'center' }}>✦ Intention collective du jour</div>

            {/* Texte de l'intention — hero */}
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 28 : 36, fontWeight: 300, color: 'var(--cream)', lineHeight: 1.15, textAlign: 'center', letterSpacing: '-.01em' }}>{intention.text}</div>

            {/* Description */}
            <div style={{ fontSize: isMobile ? 14 : 15, color: 'var(--text3)', lineHeight: 1.7, textAlign: 'center' }}>{intention.description}</div>

            {/* Bouton rejoindre */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div onClick={isPremium ? handleJoinIntention : onUpgrade} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                minHeight: isMobile ? 44 : 40, padding: '0 28px',
                borderRadius: 100, fontSize: isMobile ? 14 : 13,
                cursor: 'pointer',
                background: joined ? 'rgba(var(--gold-rgb),0.14)' : 'var(--surface-2)',
                border: `1px solid ${joined ? 'rgba(var(--gold-rgb),0.45)' : 'var(--border2)'}`,
                color: joined ? 'var(--gold)' : 'var(--text3)',
                transition: 'all .2s', WebkitTapHighlightColor: 'transparent',
                fontWeight: joined ? 500 : 300,
              }}>
                {joined ? '✓ Vous nourrissez l\'intention' : '🌿 Rejoindre l\'intention'}
              </div>
            </div>

            {/* Explication étoiles */}
        <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6, fontStyle: 'italic', opacity: 0.7 }}>
          Les étoiles ✦ s'envolent à chaque action dans le réseau — rituel, élan, défi — signes de la vie collective.
        </div>

        {/* Résonance */}
            {resonance && (() => {
              const z = ZONE_MAP[resonance.zone]
              const pct = (resonance.current / resonance.threshold) * 100
              return (
                <div style={{ background: `${z?.color}0a`, border: `1px solid ${z?.color}28`, borderRadius: 14, padding: isMobile ? '14px 16px' : '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize:'var(--fs-emoji-md, 18px)' }}>🔥</span>
                      <div style={{ fontSize: isMobile ? 14 : 13, color: z?.color, fontWeight: 500 }}>Résonance {z?.name}</div>
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 22 : 20, color: z?.color, fontWeight: 300 }}>{resonance.current}<span style={{ fontSize:'var(--fs-h5, 12px)', opacity: .6 }}>%</span></div>
                  </div>
                  <div style={{ height: 4, borderRadius: 100, background: 'var(--surface-3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 100, width: `${pct}%`, background: `linear-gradient(90deg,${z?.color}88,${z?.color})`, transition: 'width .6s ease' }} />
                  </div>
                  <div style={{ fontSize: isMobile ? 12 : 11, color: 'var(--text3)' }}>Seuil {resonance.threshold}% · encore <strong style={{ color: z?.color }}>{resonance.threshold - resonance.current} points</strong></div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* ── MESSAGES REÇUS ── */}
      {pendingMercis.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: isMobile ? 12 : 11, color: 'var(--text3)', letterSpacing: '.10em', textTransform: 'uppercase' }}>✦ Messages reçus pour vous</div>
          {pendingMercis.slice(0, 3).map(c => {
            const z      = ZONE_MAP[c.zone]
            const sender = flowerName(c.sender)
            return (
              <div key={c.id} style={{ background: 'rgba(var(--red-rgb),0.05)', border: '1px solid rgba(var(--red-rgb),0.16)', borderRadius: 14, padding: isMobile ? '16px' : '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize:'var(--fs-emoji-md, 20px)' }}>💐</span>
                  <div>
                    <div style={{ fontSize: isMobile ? 15 : 14, color: 'var(--text2)', fontWeight: 500 }}>{sender}</div>
                    <div style={{ fontSize: isMobile ? 12 : 11, color: z?.color ?? 'var(--green)', marginTop: 2 }}>{z?.icon} {z?.name} · {timeAgo(c.created_at)}</div>
                  </div>
                </div>
                <div style={{ fontSize: isMobile ? 14 : 13, color: 'var(--text2)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 12 }}>"{c.message_ia}"</div>
                <div onClick={() => isPremium ? handleMerci(c.id, c.sender_id) : onUpgrade?.()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: isMobile ? '8px 20px' : '7px 18px', borderRadius: 100, fontSize: isMobile ? 14 : 13, background: 'rgba(var(--gold-rgb),0.10)', border: '1px solid rgba(var(--gold-rgb),0.30)', color: isPremium ? 'rgba(var(--gold-rgb),0.9)' : 'rgba(var(--gold-rgb),0.35)', cursor: isPremium ? 'pointer' : 'not-allowed', WebkitTapHighlightColor: 'transparent' }}>{isPremium ? '🙏 Remercier' : '🔒 Remercier'}</div>
              </div>
            )
          })}
        </div>
      )}


    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  CARTE FLEUR — format card pour la grille
// ─────────────────────────────────────────────────────────────────────────────
function FleurCard({ fleur, userId, senderName, alreadySent, bouquetMember, badge, onBadgeClick, onCoeurSent, expanded, pendingMercisForFleur, onMerci, isPremium = false, onUpgrade }) {
  const [sending, setSending] = useState(false)
  const plant     = fleur.plant ?? {}
  const name      = flowerName(fleur)
  const vit       = vitality(plant)
  const fragile   = fragileZones(plant)
  const isFragile = fragile.length > 0
  const weakest   = fragile[0] ?? ZONES[0]

  async function handleSend() {
    if (alreadySent || sending) return
    setSending(true)
    try {
      const message = await generateCoeurMessage({ senderName, receiverName: name, zone: weakest.key })
      await supabase.from('coeurs').insert({ sender_id: userId, receiver_id: fleur.id, zone: weakest.key, message_ia: message })
      logActivity({ userId, action: 'coeur', zone: weakest.key })
      window.dispatchEvent(new CustomEvent('garden:activity', { detail: { userId } }))
      logNetworkActivity(userId, 'coeur')
      window.dispatchEvent(new CustomEvent('garden:activity', { detail: { userId } }))
      window.dispatchEvent(new CustomEvent('analytics_track', { detail: { event: 'coeur_sent', props: { receiver_id: fleur.id, zone: weakest.key }, page: 'club', cat: 'social' } }))
      onCoeurSent?.({ receiverName: name, zone: weakest.key, receiverId: fleur.id })
      // Notifier le receveur
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_JWT}` },
        body: JSON.stringify({ type: 'coeur_recu', userId: fleur.id, data: { senderName } }),
      }).then(r => console.log('[push] coeur notif status:', r.status)).catch(e => console.error('[push] coeur notif error:', e))
    } catch(e) { console.error(e) }
    finally { setSending(false) }
  }

  const STAR_CHARS = ['✦','✧','★','⋆','✨']
  return (
    <div style={{
      background: isFragile ? 'rgba(212,146,10,0.08)' : 'rgba(255,252,248,0.98)',
      border: `1px solid ${isFragile ? 'rgba(var(--gold-rgb),.18)' : 'var(--track)'}`,
      borderRadius: 14, padding: 'clamp(10px, 2.5vw, 14px) clamp(8px, 2vw, 12px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      position: 'relative', transition: 'border-color .2s',
      overflow: 'hidden',
    }}>
      {/* Étoiles dorées sur interaction membre */}
      {showStars && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${15 + Math.random() * 70}%`,
              top: `${10 + Math.random() * 80}%`,
              fontSize: `${10 + Math.floor(Math.random() * 10)}px`,
              color: ['#FFE566','#FFD700','#FFF0A0'][i % 3],
              textShadow: '0 0 8px #FFD700',
              animation: 'star-float 1.8s ease-out forwards',
              animationDelay: `${i * 0.08}s`,
            }}>{STAR_CHARS[i % STAR_CHARS.length]}</div>
          ))}
          <style>{`@keyframes star-float { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-40px) scale(0.5)} }`}</style>
        </div>
      )}

      {/* Badge bouquet */}
      {bouquetMember && (
        <div style={{ position: 'absolute', top: 8, left: 8, fontSize:'var(--fs-emoji-sm, 10px)' }}>💐</div>
      )}

      {/* Badge merci */}
      {badge > 0 && (
        <div onClick={onBadgeClick} style={{
          position: 'absolute', top: 8, right: 8,
          fontSize:'var(--fs-h5, 9px)', cursor: 'pointer',
          background: 'rgba(var(--gold-rgb),.15)', border: '1px solid rgba(var(--gold-rgb),.3)',
          borderRadius: 100, padding: '2px 6px', color: 'rgba(var(--gold-rgb),.9)',
          WebkitTapHighlightColor: 'transparent',
        }}>🙏{badge}</div>
      )}

      {/* Anneau vitalité */}
      <div style={{
        width: 'clamp(40px, 8vw, 52px)', height: 'clamp(40px, 8vw, 52px)', borderRadius: '50%', flexShrink: 0,
        background: `conic-gradient(${isFragile ? 'rgba(var(--gold-rgb),.85)' : 'var(--green)'} ${vit * 3.6}deg, var(--track) 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 'clamp(30px, 6vw, 40px)', height: 'clamp(30px, 6vw, 40px)', borderRadius: '50%',
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Cormorant Garamond',serif", fontSize:'var(--fs-h5, 12px)', color: isFragile ? 'rgba(var(--gold-rgb),.9)' : 'rgba(var(--badge-lvl1-rgb),.8)',
        }}>{vit}%</div>
      </div>

      {/* Nom */}
      <div style={{
        fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(11px, 2.8vw, 13px)',
        color: '#1a1208', textAlign: 'center',
        lineHeight: 1.3, width: '100%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{name}</div>

      {/* Zones fragiles */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', minHeight: 18 }}>
        {fragile.length > 0
          ? fragile.map(z => (
              <span key={z.key} style={{ fontSize:'var(--fs-emoji-sm, 13px)' }} title={`${z.name} : ${Math.round(plant[z.key]??0)}%`}>{z.icon}</span>
            ))
          : <span style={{ fontSize:'var(--fs-h5, 9px)', color: 'rgba(var(--green-rgb),.35)' }}>✓ bonne santé</span>
        }
      </div>

      {/* Bouton 💐 intention */}
      <div
        onClick={handleSend}
        style={{
          width: 'clamp(38px, 8vw, 36px)', height: 'clamp(38px, 8vw, 36px)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: !isPremium ? 'not-allowed' : alreadySent || sending ? 'default' : 'pointer',
          background: alreadySent ? 'var(--surface-2)' : 'rgba(var(--green-rgb),.12)',
          border: `1px solid ${alreadySent ? 'var(--track)' : 'rgba(var(--green-rgb),.3)'}`,
          fontSize:'var(--fs-emoji-sm, 16px)', opacity: !isPremium ? 0.4 : sending ? .5 : 1,
          transition: 'transform .15s, background .2s',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => { if (isPremium && !alreadySent && !sending) e.currentTarget.style.transform = 'scale(1.15)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        {!isPremium ? '🔒' : sending ? '…' : alreadySent ? '✓' : '💐'}
      </div>

      {/* Messages dépliés */}
      {expanded && badge > 0 && (
        <div style={{ width: '100%', borderTop: '1px solid rgba(var(--gold-rgb),.12)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(pendingMercisForFleur ?? []).map(c => {
            const z = ZONE_MAP[c.zone]
            return (
              <div key={c.id} style={{ fontSize:'var(--fs-h5, 10px)', color: 'var(--text3)', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{c.message_ia}"
                <div style={{ fontSize:'var(--fs-h5, 9px)', color: z?.color, marginTop: 2, fontStyle: 'normal' }}>{z?.icon} {z?.name}</div>
                <div onClick={() => onMerci?.(c.id, c.sender_id)} style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 100, fontSize:'var(--fs-h5, 9px)', background: 'rgba(var(--gold-rgb),.1)', border: '1px solid rgba(var(--gold-rgb),.22)', color: 'rgba(var(--gold-rgb),.9)', cursor: 'pointer' }}>🙏 Merci</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
//  BOUQUET CARD — colonne droite, format vertical compact
// ─────────────────────────────────────────────────────────────────────────────
function BouquetCard({ fleur, userId, senderName, alreadySent, onCoeurSent, badge, onBadgeClick, expanded, pendingMercisForFleur, onMerci, intentionMode, isPremium = false, onUpgrade, starFlash = false }) {
  const [sending, setSending] = useState(false)
  const [showStars, setShowStars] = useState(false)

  useEffect(() => {
    if (starFlash) {
      setShowStars(true)
      const t = setTimeout(() => setShowStars(false), 2000)
      return () => clearTimeout(t)
    }
  }, [starFlash])
  const [sentAt, setSentAt]   = useState(alreadySent ? Date.now() : null)
  const [cooldown, setCooldown] = useState(null) // texte "Xh" restant
  const plant     = fleur.plant ?? {}
  const name      = flowerName(fleur)
  const vit       = vitality(plant)
  const fragile   = fragileZones(plant)
  const isFragile = fragile.length > 0
  const weakest   = fragile[0] ?? ZONES[0]

  // Calcul cooldown toutes les minutes
  useEffect(() => {
    if (!alreadySent) return
    function update() {
      const msLeft = (24 * 60 * 60 * 1000) - (Date.now() - (sentAt ?? Date.now()))
      if (msLeft <= 0) { setCooldown(null); return }
      const h = Math.floor(msLeft / 3600000)
      const m = Math.floor((msLeft % 3600000) / 60000)
      setCooldown(h > 0 ? `${h}h` : `${m}m`)
    }
    update()
    const t = setInterval(update, 60000)
    return () => clearInterval(t)
  }, [alreadySent, sentAt])

  async function handleSend() {
    if (alreadySent || sending) return
    setSending(true)
    try {
      const message = await generateCoeurMessage({ senderName, receiverName: name, zone: weakest.key })
      await supabase.from('coeurs').insert({ sender_id: userId, receiver_id: fleur.id, zone: weakest.key, message_ia: message })
      // Notifier le receveur
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_JWT}` },
        body: JSON.stringify({ type: 'coeur_recu', userId: fleur.id, data: { senderName } }),
      }).then(r => console.log('[push] coeur notif status:', r.status)).catch(e => console.error('[push] coeur notif error:', e))
      logActivity({ userId, action: 'coeur', zone: weakest.key })
      window.dispatchEvent(new CustomEvent('garden:activity', { detail: { userId } }))
      setSentAt(Date.now())
      onCoeurSent?.({ receiverName: name, zone: weakest.key, receiverId: fleur.id })
    } catch(e) { console.error(e) }
    finally { setSending(false) }
  }

  const isSent = alreadySent || sentAt !== null

  return (
    <div style={{
      background: isFragile ? 'rgba(212,146,10,0.08)' : 'rgba(255,252,248,0.98)',
      border: `1.5px solid ${isFragile ? 'rgba(212,146,10,0.35)' : 'rgba(180,130,110,0.28)'}`,
      borderRadius: 12, padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {/* Anneau vitalité */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: `conic-gradient(${isFragile ? 'rgba(var(--gold-rgb),.85)' : 'var(--green)'} ${vit * 3.6}deg, var(--track) 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 27, height: 27, borderRadius: '50%',
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize:'var(--fs-h5, 9px)', fontFamily: "'Cormorant Garamond',serif",
          color: isFragile ? '#8a6008' : '#1a1208',
        }}>{vit}%</div>
      </div>

      {/* Nom + zones fragiles */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Cormorant Garamond',serif", fontSize:'var(--fs-h4, 13px)', color: '#1a1208',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</div>
        <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
          {fragile.length > 0
            ? fragile.slice(0, 3).map(z => <span key={z.key} style={{ fontSize:'var(--fs-emoji-sm, 11px)' }}>{z.icon}</span>)
            : <span style={{ fontSize:'var(--fs-h5, 9px)', color: 'rgba(var(--green-rgb),.35)' }}>✓</span>
          }
        </div>
      </div>

      {/* Badge merci */}
      {badge > 0 && (
        <div onClick={onBadgeClick} style={{ fontSize:'var(--fs-h5, 10px)', cursor: 'pointer', background: 'rgba(var(--gold-rgb),.12)', border: '1px solid rgba(var(--gold-rgb),.25)', borderRadius: 100, padding: '2px 6px', color: 'rgba(var(--gold-rgb),.85)', flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>🙏{badge}</div>
      )}

      {/* Bouton 🌻 / 💐 */}
      <div
        onClick={handleSend}
        style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: !isPremium ? 'not-allowed' : isSent || sending ? 'default' : 'pointer',
          background: isSent ? 'var(--surface-2)' : 'rgba(var(--green-rgb),.15)',
          border: `1px solid ${isSent ? 'var(--track)' : 'rgba(var(--green-rgb),.4)'}`,
          boxShadow: isSent ? 'none' : '0 0 8px rgba(var(--green-rgb),.25)',
          opacity: !isPremium ? 0.4 : sending ? .5 : 1, transition: 'all .2s',
          WebkitTapHighlightColor: 'transparent', position: 'relative',
          gap: 1,
        }}
        onMouseEnter={e => { if (isPremium && !isSent && !sending) e.currentTarget.style.transform = 'scale(1.12)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        title={!isPremium ? 'Premium requis' : isSent ? `Disponible dans ${cooldown ?? '…'}` : `Offrir un élan 💐 sur ${weakest.name}`}
      >
        {!isPremium
          ? <div style={{ fontSize:'var(--fs-h4, 13px)', lineHeight: 1 }}>🔒</div>
          : <>
              <div style={{ fontSize: isSent ? 13 : 15, filter: isSent ? 'none' : 'drop-shadow(0 0 4px rgba(var(--green-rgb),.5))', opacity: isSent ? .25 : 1, lineHeight: 1 }}>
                {sending ? '…' : '💐'}
              </div>
              {isSent && cooldown && null}
            </>
        }
      </div>

      {/* Messages dépliés */}
      {expanded && badge > 0 && (
        <div style={{ width: '100%', borderTop: '1px solid rgba(var(--gold-rgb),.1)', paddingTop: 8, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(pendingMercisForFleur ?? []).map(c => {
            const z = ZONE_MAP[c.zone]
            return (
              <div key={c.id}>
                <div style={{ fontSize:'var(--fs-h5, 10px)', color: 'var(--text3)', fontStyle: 'italic', lineHeight: 1.5 }}>"{c.message_ia}"</div>
                <div onClick={() => isPremium ? onMerci?.(c.id, c.sender_id) : onUpgrade?.()} style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 100, fontSize:'var(--fs-h5, 9px)', background: 'rgba(var(--gold-rgb),.1)', border: '1px solid rgba(var(--gold-rgb),.2)', color: 'rgba(var(--gold-rgb),.9)', cursor: isPremium ? 'pointer' : 'not-allowed', opacity: isPremium ? 1 : 0.4 }}>
                  {isPremium ? '🙏 Merci' : '🔒 Merci'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODAL ÉGRÉGORE
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  MODAL BASE
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ onClose, children, maxWidth = 480 }) {
  const isMobile = useIsMobile()
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 400, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: isMobile ? '20px 20px 0 0' : 20, width: '100%', maxWidth: isMobile ? '100%' : maxWidth, maxHeight: isMobile ? '92vh' : '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {isMobile && <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--separator)' }} /></div>}
        {children}
        <div onClick={onClose} style={{ textAlign: 'center', padding: '12px 0 20px', fontSize: isMobile ? 14 : 13, color: 'var(--text3)', cursor: 'pointer', letterSpacing: '.04em' }}>Fermer</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODAL 1 — EGREGORE
// ─────────────────────────────────────────────────────────────────────────────

// ── PoulsReseau — étoiles depuis la fleur ──────────────────────────────────
function PoulsReseau({ zonesData }) {
  const canvasRef = useRef(null)
  const starsRef  = useRef([])
  const animRef   = useRef(null)
  const W = 400, H = 160
  const CX = W / 2, CY = H / 2 + 10

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Mettre à jour et dessiner les étoiles
      for (let i = starsRef.current.length - 1; i >= 0; i--) {
        const s = starsRef.current[i]
        s.x += s.vx
        s.y += s.vy
        s.life -= s.decay
        s.size *= 0.97
        if (s.life <= 0) { starsRef.current.splice(i, 1); continue }

        const alpha = Math.pow(s.life, 0.5)
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = s.glow * s.life
        ctx.font = `${s.size}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(s.char, s.x, s.y)
        ctx.restore()
      }

      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const addPulseRef = useRef(null)
  function addPulse() {
    const CHARS = ['✦','✧','★','✦','✧','✦','⋆','✦']
    const ZONE_COLORS = [
      '#FFE566', '#FFD700', '#FFF0A0', '#FFCC00', '#FFE566', '#FFFAE0'
    ]
    const count = 12 + Math.floor(Math.random() * 10)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.6 + Math.random() * 2.5
      const color = ZONE_COLORS[Math.floor(Math.random() * ZONE_COLORS.length)]
      starsRef.current.push({
        x: CX + (Math.random() - 0.5) * 20,
        y: CY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.3,
        life: 0.7 + Math.random() * 0.3,
        decay: 0.006 + Math.random() * 0.008,
        size: 10 + Math.random() * 18,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        color,
        glow: 18 + Math.random() * 22,
      })
    }
  }
  addPulseRef.current = addPulse

  useEffect(() => {
    const ch = supabase.channel('pouls-etoiles')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'network_activity' },
        (p) => { if (p.new?.action_type === 'intention_joined') addPulseRef.current?.() })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  return (
    <canvas ref={canvasRef} width={W} height={H}
      style={{ width: '100%', height: '100%', display: 'block' }} />
  )
}


function ModalEgregore({ userId, onClose, onParticleBurst, isPremium = false, onUpgrade }) {
  const isMobile = useIsMobile()
  const [zonesData, setZonesData]     = useState(Object.fromEntries(ZONES.map(z => [z.key, 50])))
  const [activeCount, setActiveCount] = useState(0)
  const [intention, setIntention]     = useState(null)
  const [joined, setJoined]           = useState(false)
  const [resonance, setResonance]     = useState(null)
  const [pulseKey, setPulseKey]       = useState(null)
  const [breathPhase, setBreath]      = useState(0)
  const svgRef = useRef(null)

  useEffect(() => {
    let frame, start = Date.now()
    const tick = () => { setBreath(Math.sin(((Date.now()-start)/3200)*Math.PI*2)*.5+.5); frame = requestAnimationFrame(tick) }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!userId) return
    setJoined(false)
    loadData()
    const today = new Date().toISOString().slice(0,10)
    supabase.from('intentions_joined').select('id').eq('user_id', userId).eq('date', today).maybeSingle()
      .then(({ data }) => setJoined(!!data))
  }, [userId])

  async function loadData() {
    const today = new Date().toISOString().slice(0,10)
    const [{ data: allPlants }, { data: intentions, error: intentErr }] = await Promise.all([
      supabase.from('plants').select('user_id, zone_racines,zone_tige,zone_feuilles,zone_fleurs,zone_souffle, date').order('date', { ascending: false }),
      supabase.from('intentions').select('text,description,date').order('date', { ascending: false }).limit(1),
    ])
    const intent = intentions?.[0] ?? null
    if (allPlants?.length) {
      const latestByUser = {}
      allPlants.forEach(p => { if (!latestByUser[p.user_id]) latestByUser[p.user_id] = p })
      const plants = Object.values(latestByUser)
      const sums = Object.fromEntries(ZONES.map(z => [z.key, 0]))
      plants.forEach(p => ZONES.forEach(z => { sums[z.key] += (p[z.key] ?? 5) }))
      const avgs = Object.fromEntries(ZONES.map(z => [z.key, Math.round(sums[z.key] / plants.length)]))
      setZonesData(avgs); setActiveCount(plants.length)
      const r = ZONES.map(z => ({ ...z, pct: avgs[z.key], dist: Math.abs(80-avgs[z.key]) }))
        .filter(z => z.pct >= 60 && z.pct < 80).sort((a,b) => a.dist-b.dist)[0]
      if (r) setResonance({ zone: r.key, current: r.pct, threshold: 80 })
    }
    if (intent) setIntention(intent)
    else setIntention({ text: 'Prendre soin de soi', description: 'Chaque rituel complété, chaque élan 💐 offert nourrit cette énergie collective et renforce le groupe.' })
  }

  function spawnParticles() {
    const PETALS = ['🌸','🌺','🌼','🌷','💮','🌻','🌹','💐']
    const ps = []
    const rect = svgRef.current ? svgRef.current.getBoundingClientRect() : null
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 0.5 + Math.random() * 1.8
      ps.push({
        id: `burst-${i}-${Date.now()}-${Math.random()}`,
        x: cx + (Math.random() - 0.5) * 80,
        y: cy + (Math.random() - 0.5) * 80,
        char: PETALS[Math.floor(Math.random() * PETALS.length)],
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.4,
        dur: 2200 + Math.random() * 1400,
        color: null,
      })
    }
    onParticleBurst?.(ps)
  }
  async function handleJoin() {
    if (!isPremium) { onUpgrade?.(); return }
    const today = new Date().toISOString().slice(0,10)
    if (joined) {
      await supabase.from('intentions_joined').delete().eq('user_id', userId).eq('date', today)
      setJoined(false)
    } else {
      await supabase.from('intentions_joined').insert({ user_id: userId, date: today })
      logNetworkActivity(userId, 'intention_joined')
      window.dispatchEvent(new CustomEvent('garden:activity', { detail: { userId } }))
      setJoined(true)
      ZONES.forEach((z,i) => setTimeout(() => { setPulseKey(z.key); setTimeout(() => setPulseKey(null), 1800) }, i*160))
      spawnParticles()
    }
  }

  return (
    <Modal onClose={onClose} maxWidth={500}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '8px 24px 16px' }}>

        {/* Fleur décorative + étoiles superposées */}
        <div style={{ position: 'relative', width: isMobile ? 220 : 260, height: isMobile ? 220 : 260 }}>
          <div ref={svgRef} style={{ width: '100%', height: '100%' }}>
            <FleurSimple zonesData={zonesData} pulseKey={pulseKey} size={isMobile ? 220 : 260} />
          </div>
          <div style={{ position: 'absolute', inset: -30, pointerEvents: 'none' }}>
            <PoulsReseau />
          </div>
        </div>

        {/* Compteur fleurs */}
        <div style={{ fontSize: 13, color: 'var(--text3)', letterSpacing: '.06em' }}>
          Collectif de <span style={{ color: 'var(--green)', fontWeight: 600 }}>{activeCount}</span> fleur{activeCount > 1 ? 's' : ''} actives
        </div>

        {intention && (<>
          {/* Label */}
          <div style={{ fontSize: 11, color: 'rgba(212,146,10,0.85)', letterSpacing: '.12em', textTransform: 'uppercase' }}>✦ Intention collective du jour</div>

          {/* Titre de l'intention — hero */}
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 32 : 36, fontWeight: 300, color: 'var(--text)', lineHeight: 1.1, textAlign: 'center', letterSpacing: '-.01em' }}>{intention.text}</div>

          {/* Description */}
          <div style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.7, textAlign: 'center' }}>{intention.description}</div>
        </>)}

        {/* Bouton rejoindre */}
        <div onClick={handleJoin} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          minHeight: isMobile ? 48 : 44, padding: '0 28px',
          borderRadius: 100, fontSize: isMobile ? 15 : 14,
          cursor: !isPremium ? 'not-allowed' : 'pointer',
          background: !isPremium ? 'var(--surface-2)' : joined ? 'rgba(212,146,10,0.15)' : 'rgba(var(--green-rgb),.10)',
          border: `1px solid ${!isPremium ? 'var(--surface-3)' : joined ? 'rgba(212,146,10,0.50)' : 'rgba(var(--green-rgb),.35)'}`,
          color: !isPremium ? 'var(--text3)' : joined ? '#D4920A' : 'var(--text)',
          fontWeight: joined ? 500 : 300,
          opacity: !isPremium ? 0.6 : 1,
          transition: 'all .2s', WebkitTapHighlightColor: 'transparent',
          width: '100%', justifyContent: 'center',
        }}>
          {!isPremium ? '🔒 Rejoindre l\'intention — Premium' : joined ? '✓ Vous nourrissez l\'intention' : '🌸 Je participe à l\'intention collective'}
        </div>

        {/* Résonance */}
        {resonance && (() => {
          const z = ZONE_MAP[resonance.zone]
          const pct = (resonance.current / resonance.threshold) * 100
          return (
            <div style={{ width: '100%', background: `${z?.color}0a`, border: `1px solid ${z?.color}28`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize:'var(--fs-emoji-md, 18px)' }}>🔥</span>
                  <div style={{ fontSize: isMobile ? 14 : 13, color: z?.color, fontWeight: 500 }}>Résonance {z?.name}</div>
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 22 : 20, color: z?.color }}>
                  {resonance.current}<span style={{ fontSize:'var(--fs-h5, 12px)', opacity: .6 }}>%</span>
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 100, background: 'var(--surface-3)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 100, background: `linear-gradient(90deg,${z?.color}88,${z?.color})`, transition: 'width .6s ease' }} />
              </div>
              <div style={{ fontSize: isMobile ? 12 : 12, color: 'var(--text3)' }}>
                Seuil {resonance.threshold}% · encore <strong style={{ color: z?.color }}>{resonance.threshold - resonance.current} pts</strong>
              </div>
            </div>
          )
        })()}
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODAL 2 — JARDIN (fleurs fragiles, 1 colonne)
// ─────────────────────────────────────────────────────────────────────────────
function ModalJardin({ userId, myName, bouquetIds, onClose, onCoeurSent, isPremium = false, onUpgrade }) {
  const [list, setList]     = useState([])
  const [ready, setReady]   = useState(false)
  const [excluded, setExcluded] = useState(new Set())
  const [starFlashes, setStarFlashes] = useState({}) // { userId: timestamp }

  // Realtime — étoiles sur la fleur du membre actif
  useEffect(() => {
    const ch = supabase.channel('jardin-stars')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'network_activity' },
        (p) => {
          const uid = p.new?.user_id
          if (uid && uid !== userId) {
            setStarFlashes(prev => ({ ...prev, [uid]: Date.now() }))
          }
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [userId])

  useEffect(() => { if (userId) init() }, [userId])

  async function init() {
    const today = new Date().toISOString().slice(0,10)
    const { data: sentToday } = await supabase.from('coeurs').select('receiver_id').eq('sender_id', userId).gte('created_at', today+'T00:00:00')
    const alreadySent = new Set((sentToday ?? []).map(c => c.receiver_id))
    setExcluded(alreadySent)
    await loadList(alreadySent)
    setReady(true)
  }

  async function loadList(excludeSet) {
    const exIds = [...(excludeSet ?? excluded), userId].filter(Boolean)
    let q = supabase.from('users').select('id, display_name, flower_name, level')
    exIds.forEach(id => { q = q.neq('id', id) })
    const { data: users } = await q
    if (!users?.length) { setList([]); return }
    const { data: plants } = await supabase.from('plants').select('user_id, health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle, date').in('user_id', users.map(u => u.id)).order('date', { ascending: false })
    const plantMap = {}
    ;(plants ?? []).forEach(p => { if (!plantMap[p.user_id]) plantMap[p.user_id] = p })
    setList(users.map(u => ({ ...u, plant: plantMap[u.id] ?? {} })).filter(u => u.display_name).sort((a,b) => vitality(a.plant)-vitality(b.plant)).slice(0,20))
  }

  async function handleCoeurSent({ receiverName, zone, receiverId }) {
    // Marquer comme envoyé sans retirer la card — juste griser le bouton
    const newEx = new Set([...excluded, receiverId])
    setExcluded(newEx)
    onCoeurSent?.({ receiverName, zone, receiverId })
  }

  return (
    <Modal onClose={onClose} maxWidth={440}>
      {/* Intro bouquet */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 24px 12px', borderBottom: '1px solid var(--surface-2)' }}>
        <img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAACl5ElEQVR42uz9d7Rl913ej78+Ze992j23zb1z7/QmjaRRlyxbkm2N3GRcsfGMDbhAABswNZBQErhzMSYESEgBJ3ZoBpzEMxiMDXbABkm2ccGWm6RR1/Ry6+m7fdrvj33lEMp3/VaCMcjzXmuWltYanZl7tJ/9bs/7eeBSXIpLcSkuxaW4FJfiUlyKS3EpLsWluBSX4lJciktxKS7FpbgUl+JSXIpLcSkuxaW4FJfiUlyKS3EpLsWluBSX4lJciktxKS7FpbgUl+JS/FMKcekr+PuPQ4cOqauuukocBDh4kHvuuYfFxUUHhEvfzqX4uo2FhQUZQvhbXzpCXHoXXcogX+fgWFxc9ADffNddt26dn799fn5ze3p2Ew+cPnHul375Hb8RQrAbQLmUSS7F1xc4AJ511VX7fuPnfvbjX/y994blP/toGHz6UyE8ejw8/ucfDt/zLd/83wERNn7vpbiUQb5u+o3f+73fcz/8um979oufd9sHn3HV/onYWS+k90LF1LzyaKl+48MfuvDbd39s9z333OMuZZF/OqEvfQX/b3H06NEghNBX79v+i3dcftnEcDAweWGiOI6lVJZMNXytoeRsoza69957nyqxLr2Y/onEpXT/V8qkuxcW9N13362PHjqk/v/NwFIID9Q3T7QP5BeXw+jiijb9EaY/wqY5phhIUZTU4+aul7zotu//7u9+1WwI4asNkksAvASQvz9gSClZXFz0dy4u2jvvvNMePnbM/V3TqL8W4b1HjypgdPrJEx/pX7hIubzqi8GQtDegHObYLMUNc8biJLrj9iv+U6spflAIEd785jfro4eOqo3+RRw9elTdfffduvoV9N13360X/i/6FSkFQhDC3Qv/V//9pbhUYn0FGEcOHBDi8GEHcPjwq667Zvfl3xDruHXh3Jk/EUJ8XAjBBlD+zn7hwQcfFIA7tdZ99/rs4NV1b0kR6CgmeIFymtxE1DVo2XMq+Jcfumph8dd/7W3lu/y7vvI5hzf+Hn8LBgWI8H+WdYfUoZllwcHZAIcAuO9d/1be9Ob7rBAhAA1x52IKEI4eUkcePBYOHlyQBw8eD3CIY8eOcfjwMX+pD7qUiv/2Rw6E2Hg4Xv+KVzzzlS9+0S9fsWfPrdunZmirOitFwf/88Pt/9wff9rZvv3thgTv/P5Z8CyAXwb/udf9syxu3bX50n9LNYSJDUm+KZlRH1+okzRan+2f443OfDkZQfOjT79t+3710fn7hV25dWz2f/uKv/tyTP/YjP/Wca6+88ZqJVjs0xsY4ceaEePsv/uTvPPHEE2f+6gh5YQG5uIj/u362P37Pa947P9+49UJn9OH//t77f+09Rx/97N+aaYTAh0v4uASQvw6OEIQQIjzvOTfd8tqXvOpHb7v8wGuu3rlT4D1obX0QyLHxkA5H0ZH/8Ev//hd/+zd/5O6FBX3n4qL9Oxv1Q4fU4WPH3G9853d/9Jbpzc9LbeZko6njuEat0SSp1RnkPT587nMhU0PRWd/2gZtvesWWXfMHbj574TROZGvzc1umx5uzUASc8+gYHnvyy4998cv33/H2d/7wxSNHjoiDB++Rd955r/35n3juqw/eMvMC2ZjY0s1NGff7ZVQ3n/30n5czb3lT+181d01Daxtnnlgzn7j75H/4rXc+8K4f+oFn/+jkjmROJKFz9oT7w9d852+8PwTEsWOH5OHDx9wlKFwqsTh66JASQrhveeUr3/CtL73rt++66SaUgay/5p1WMqmNaV+LcMNOaERN+7rnPf+tyysXf//OxcW/+Ktv8b9RZi1fJQCeGHTeuXNy+vl1Y4XPM0rnKb2lZksiFC0Ri15/goM3vPUVu3dczpmTJ31sNsu5+enp4drQnznT8zbziACNprJzzd2XFdlfvEgI8e4HHjgaXX31YvlrP3XHd7/0OXP/ZW7TOtQdtHdAcxxG6bfeMLeKG636/MyI2lTit89MRi+7q/Uv9szsfeszD9gGkw1ozfOMy0ff9r9+6/CfCXH0hXDMCQH+vYeUuFR2/Y1QX08/7FUzM+reU6f81fv2PPeV19/4ksYoLTprq1oEIUQArEP6QBQnwgz6TF/sRg1df/lKKN7967/zO6PFxUX5tz1A9566NywsLMi3/eqvPvSsfZe9cr6ezJfGeR+QwTmc82A9T3ZymvWXsWvnlc4UnqVz69J4j81M8NZLFcUyqisZ17WMa6isXAvDdOln/+wzf3LhHe84xm/9zPN++nnPiv7t3MRaMJl3xdBiu0ve53hJ3cdRGsxopOwoFTLykrwbaqULc+N5XIx61kFwhfCRsH7feNi3Z0u8Y27flUuf+/zk0uKxj9pLbJiv9yb94EHPvffy+PK5P330iUdMbWw6tvUG5B7iiCTS6DhG1kfISMn+sGefOT038/IDN7xdCPFd4ehRKQ4f/tvbmnvuUYB9sHfhZ7eMNX6vbgVBBCya2AaW/BqDdDeX770Z651aW1ulKAV1HZA+FdaWWK9I6gaRFKimwnTX5LnzD5QhBPGhd7zsPd9wO69FCG99JOOmVgrwZUEYrGFGPZSI8aUl7XWwmaXWrIvghLD5KEitdKPeQkZ98p7Brp/3b3jllm+/y8x++8L36Efu/uSeD3zL9x/7CSFwISAuZZKv5x7kssvi9776G++/fXzzZd1m7FvNMam1RiuJlBIhBDUdUYoQeOQiX15dGfzoJ/7n3s/d9+ia+Eqf/7dPxhaPL4pfGvu2z18fNa8ZELzXStVD4FS/YFh/AfM7r0f4mP76BTZPlVy+NdBuSByGC911sshgagW1ibpfWevKN33nj9/842+eLr//Ww58eaLWL42vRTquC6EaeKEAgyuGFIMRNs1waY4dDJEiICKFrCfEtRpCCGTcAF3HjQqidp1kYsKRNCQ1IRAxv/2+Cx940w+87zUhLDghFv0leHydlVgAB0G/+w/+wLzwigPbdzcmbiuF9UJLqYLEBw/WEQpDaUqc9KLZbLh6ST0Qn37OA1/6y99cWKhdf/AgBw8elPfee2/4a5+t7v3QKXf1gSsv1mvidb7Irc1GsnCpOJdJxNgzULZOOlxF2oe58QrPjmlBTeeM1T2bJ2vMNBLaSYzwnk2tCXHgyv0v27118tXX7UwnyjBUSigRlAfpCQQQErzFFxkhzykGOeCJG4poLKI+OYZuN1DNBkEqhsMeFCXRZBNfr0uCEiHDybIXopq+ciWbesfhw+8ehIBYXLwEkK+7PcjK8eMB4HSR/a/lLP0XDeOlVZIyDiglsFIiA9jM0koVo4mmbG6dCtcPd353COE3v32x2i/8bbF47712o5l//1u+5aW/e83u6dcXvZ4JPXTfFaLtB5Q2MEg/z3OunWK27kj7PXScIKwmUlD3UIubTEUtYbzj9c+9fYv2z2Zt7RSeu2mOXyQKBSFkCAL4iGANoRxSphnOWgKOSECSJAQRQRB4GSEiaI23cCLH9gaINMeqgHVe+NLK/nrj4Zt37R294J3DCHGf/buy5JHFxSC+Tkqwr8e2TATg9ttua/3wNdd/ad9ke5eImyFuaKlUDNKjiDibn2NWj9GOJilU8NJq+efnzn3w/NLqHyfjY3JsQmXf83P/9t3VxwURNpYrAIcOHZLHjh2Tb/3Blx2ZmWn/pB+lrJ/Lw3j0UtGMDU3xOK+643nUpSLvdomTGnGziYg0Smmk0rjgsbbEZXnQWgaTxDKOm6jWRUT7I8T+DGSBPOvgspSQFuR9T5kHdBSIa5LG1DgiqSG1Bp0QhAJjCYVhtLyGcwGXxORuwscTk/I3Prhy/5H/8olrobpfCX9lT7KwsCCPHDny1DiDEII8dviwOHzs6T0i/rqcWzy11/iPb3rD226bmvvXQUYuGlNKqjoxBhUSPstjzNsxtsutGGEIQYTp2d3CasXF4RJ23HD3Qw/8zk/80q9/WwgBIYQXQvDe17xGPUVVEUKEN37by79vavPYL6wsP1yXnX1h/8R2cdu+CfbO7CRu1dBSolDIWoJMYmQUIYUkBE8IgeANtigRShAShVAtQrKEUL9PJM/gfQOf9XDdLll3RJk7CAIVCZpTY6hGjFAKVIRUGhEUIXjKzpB8mFGbnEDXImQzDheG28TZdfOhj3358T868m8+85shLJRHDt4jD7z1reGpTf9NNx3Ye9/DDw4YsQxw9OhRdfjw4aftePjrkmpyD9Um+pE0f/dlOvuXY1Eeed0IWkuhhcN76KscspJxNUFNSkItFt1Rx+tE+O7oHGqy5vddsf0Nz33+zb8shPjC5GRte6eTdw8fOzZYWFiQQoiwsHCHXlz84K+8/OUv/tz83qkPdoozUzoZY6a5XeRpF1vWSGo1dBKjpSASAmcMxjt8CNXAIErQSQOtBcNhjxAypJ7CqDlqmwfEtSmsrGEcqKLEDjN8rpBSIUVJYkHGkqANUmqUUHitUXGMMT1k2iVECboQYlsrhMu2zL7khv17XrKtue3VQiy+EPDcey+33XHbzS975u0/edPVV7wi1lHvsZOn7r/7M5/8z4cPH37fxsvgaTn5+rqdfIeFBSkWF/27vv2ffeBKFb3cRZFtNtraxYbI1fhc9DAXilVeMLqWpNWmPj5Gr8jxDU1t8zhbtm8JoZbwpUfPnBbGdp0Il59ZWut88fNf/sl3vf99797oRcJGueV++Cdf+3AmBvuvDDv8N2y6WnozpCEbCCkJ9Zio2SCp1XG+ar6fKm+kUDgJcb0OzpPmA2StiYo/w/jUCbz0eDvA5l3Kbo/euR7Zeo4SMSqBZFwT1xOINFJJtBTVaKaM6HUGqNgjmk2iKEGpADpy07Vp32/MRz/3noff9cgD9fdfe9XWF95+y60/fPs119JsxOg4IhjHk+fP8z8/9Ke//K///X/80VChhKcbSL5uyYpH7rlHhkD4l9+08kdbxqZfrooCJRQCiaNAOM+KGHEyPcMeu4OBN2y/4SraszMk9YS6iIVF8OIb5nfKSO7EOdBR/dP79v3WyBb3/8zP/MznDx06pI4dO+ZuuummyHhfD0mJcBZfljhbIlSMUBJXeIrgwXuEFAQXCL4qsYSUOAGuKNBRBC5AGmF8QW77KNEk+BIbwFMnro8YATYvUUZgbUlZt8hIoXX1K4SANWCsRcYxkTDgFUUpMcaozA9Ux5rwihtf9OaplzzjzTu3jBERoSLtQunVaNQLHu+318fCW17ysh/2WbZNCPG6hYUFFhcXn1YA+bqlQx+YnQ1CENZmxHNW4ozhcMQwGxAyg7UGmwcKFzgerXJ2tErHjZjetYPGWBsc5GWBx2Fs4dM09aMsDeWobw5cdlnYtWvXz4UQeMHkpDx66JC67777rPbypPQeV+YhZCnBODJXUFiDt45QGspRSpmlmCLHFCWmNJjC4gpHmWb0OmvkZYF167hyDT/s4os1IKB9AJPjjEZqTV4aitRT9gWjbknWKRmt5/SWR3Qv9MkHfWr1QKMtqbcbNKbGaE5P0xyfwqqY1QtdMRVid/WeXW6s0XBS6yCFUoNTKwwfvyhk7tVwaU3XOoPy0O23H/qJN7/hdYuLi35hYeFvvHSPHj2qQghSSkkIQW78HnEpg/wjKSOPHjoqZ66aEfcAi4t3OkAcPnbM3fqqW2enLm+9+uL5DhPnhdJ5hFSKJChiocBalnXKiajHlfE0Nk1pjE/ilUJqRRQrQnBSBggh4AqnIwmE4paZbe19b3nXux4PIcijx47Ju//iPSeM8M9VQQZZWKw0GARShaoh9x4VAsGCEwIXIJIKKTxBCrwIpGmKL3Lq7RrdzDIut9FIWhSDJ7BrF3F5TiAQ1QRTWycZdTKyXorOJUYYvLcgJM474rokaiRIIRFaEWT1yOp6nTEZsWt/m956X5184CHmtkwiUQzWewzPLqO0JOslSALpaCQnk8jPJc27gP9+EHhqfXL00CH1uve9z/1VKr+oDsy8qNjE4h/7uPhpDZCFhSAXF4U/fOz/vLVYWLhDLS7e63dMb3r57Px0Y9V0nH8sU40swsUR0ifIeoSwktyWWBnYOTVD7/xZ/CglaTSIag28cThrEQGEh2BtiGSQ89P1Eytn+6tXXn/lZaIpBqRcfOP3vfyjKpNvmohjURQlucqpeY9TAZQiOAvBo0RVUnkpCSLglMIH8HiQAeFL+qmivv3Z1LbM4IaB7un/Sf/J+1HSs3nfOJNz06ACzdmS4cU+MguAoCyzajIWxThv6KwPGJmS9pyjNdlGKk8wHoo6UZBIkbN+/iJTzQTvLN2zyyhfgXjU6SMTiRCGNEul0skn/vf3izxyJAQhhAN418/87Lftmd/+mkdPPjk3sWn6/JnzZz70Y7/4i78lIN/IJOESQP5BALEgjxw4IjhEOHbsmDh8WDig8fYf+KXbr7zyhk0nz51p/trv/8L/PHBgNgPYcdnWqThRiKlGGGzKWTk7QCQRKolwQRKCwjqLEyC9IF9dwfX6yKhGnDSIWk10rNFCIIXAOicths1bWte+/s0v/uRNyZX7p17xuvVTF87+h3/z/t/90+9/6QvMnvZElK+mIURBhLLE1CTCeXAevEAoDSIQhCCoQHAerwQ2WJy3iKqFZ2LTHrAD1rPTtLfsYrTSZPc2QWN+lqBjPI5IJ0xHCUV/SNxMiOtzDNIRFCNsKvCyTu4cw9WUwgyJajVi30T7afANfFFSDruMuhP4ogRjMEIggoPUY22MMrno5ymfP3321MaEUC4uYhcXBT/+Pd/zopsPHPixO25+1vM2TUzz/Gc8EyfDTb1B/+UzE9M/9Fsf+IOX3/uZzzx+ZOOm5hJAvsrgWFxc9Iv8b37E23/iV++8at/1v76ptX33pvZWZsbXOP7I5+Xhw//pXWEhyB8Mr99pahEqJPS21wi9Ibq7Qj4rET5CC4kJgb4ZYkclOm4j0GgvCHmOsTlOSVwcIYTGyUCEZnt7XF9xoHXl8+Veto3Pb1rZtetnt24d+/FEOSE7JXlZCEVCJh1RadBaIkKA4AgKghQoqXDBg/AEC144TJkTkNhWgWhHpI9doLP2JGFmF1tu+n6WVp8gKaaYoo+UHqMcUW0Vl60zHHqmE8HUREY+aJIZw9ooJ07qEEmCLyk6gZHLcJwmMMbAzBDqO1jpd2ka8N5iZcA7i/QxcWF8WcvVyc7F47/x0EP3vPOd74ze8pa3lNNbx5/3L9/w5re94RXfeNt8exIT8HkxCso5IQsfJlRs3/Sil+xf6qz9nPjMZw6Fo0fl4t9OAr0EkL9PcHzzq998xcuf/5qf3bNz7+bffN87fv/qXc/47hv2PGP3em5s4fDLnZNCxPqiEBKxKPyP/qfvuNNYwSAtZG0qwlzb5In71plfXcZFNexUhA6SbqfPoL9OqylA1ggiRmmJdjECTbCKoBzOWVyAaT1Br+z4T/vPyxerW0LTK3dw667WKbtKdvIcNSPw0oKWSGMhSKQPeB+IQgApCbrKFZ5AEGCEoywN3WLE436FT9z9RdTJEVfvuYbm9AE6/cCHH/0cz735+5kY34XXKUE5fLlK0QiEUcKKO0VLPslar6AQNeL5JmapR778fppzT1AoRewcwgaytEc/DzR2TLI8OMs2JrHB471F2sAIw0rS8T2FvH+08r84frx8y1vewr/4gW//kWdef9UvvWD/TcTeuyIdCpK6FMZQDEb40mLKUrTrTb93buutgJSvfa37x1pq6X/KoPir//6yF33zFd/8su/4s+suu2VLUcA33Pb6Z0815xgMc+9kJkdDoR868Zkn/9t7/v0HAPH9b/2J753fVNs/NCe8l4VUSUK2OaK8JnD2c+cZi7ehiWglMb4p6AyHtPvTmBxMXFAbV/jEUHpDZBIi7wkSBtKiQ0zkInl350ts8i1xXWO/Pt9ZDYGhKGyJKgRIiUMikYAlBBA+oDwErQgB/EZzjggUrqDMUs4X53lULpMuD1CmyV1X3w6ixp999hhn+48wGD5BObuT4BU6GqdWn4TIYGsBY7ayHu4gutyhIk2IFMmmjNH71zijdsA1txMe/11WixXW+2NktOkv38dU3mGyeR2xERTSkJJyoZZzrjkQSiVcXO0c2L9/750v+oZnvvkFz7rhdc+a3x1Mv+dVc0LhNLbXpZpgeQgOIQhm1JfZ+topIPif9lIsinApg/w9xKFDR9XRo4f8xjSEEEIkhDA/+6P/8e37t9+4pbc6KobpUCd5S4pmQwysk4OVPHSGj1Ob6M39wk//lz+4Zt/Nuzzj1x/vfySY+gkhhUbH4zRNTrLdM7b5Fl66/wUcP/swn/n8J0iTgkFqGQw6NHZIdlwzQXNzgQyB7sWS9TMKzFa0blLGIxohYj5s5pH0DB/OPs/09DTSW5GHnNxblAGlFVJobLAIJN4FZARWKrA5LmhEpLFliRWKUkoKr7kQUvoqZ26swSCVuMxxofM4jy3dh28oTq19mR2zd5C0PN5ZlPQEwFsN1iLliCA1OIdzjrgdY+au52I2zVjtRXz8/Kc5Nyhps5lobIm1pVV2tbayjmWqgAt0uNge0WsUlNapKdni+bc++64brrzhrtndDcbqIaS9XNSTMSWdJF1bR5kSW4+QQWDSnDLPubi8LJbPnf4dINzDEQXYSwD5eymlDjsh4Bu/8bV7005HCCEeB7bvnNt9cDTMvMt8nHUzYYYFdszRHeVcfPwJUW+OeNa1r2pMNvd/o/AZnX7wanlMdrISG2ssgriR0JBj3Lr9CqZbazxnImZL6wDHPvQFBm7I/LUJO27VqAaEIkcYy9TMEnknkK1oBLME4ZDOsyOZJJae9WLEp85/ketaW8lDQZEbVClQOqMemhSRI3iDUhIvQGBBBYb1zcjaBKKVEE1spTY2QxIpbnUpB/w5iJd51H2Zftnh4eXj5MrSFBFrg4dY7Zxlm9qO944yqua3PjiCg1BqhAt4DdpLrFK4TdsYPd6jla6xll+kyC2pWyEWCqccadljObvAIIUzjSFpQxIkGOtoRg12z02HbTvngrQyDIenlGl4mmjyfh87GEKkMJlB+UA2TEO5uq6eOHF2eLLXOwZw8MgRxz9Sbr3+pwWORf/W1//zF972jBcvTI3vusWYkTz8wh/588J2Duzacv3UsGcDzonR0FComGxQsnLuHI3mGLO7DqCsY9gdWOqRPNN7Ql5YOUtUE1y2I3DL3iFTImeYj7Ol/Sgz7QztCnbNgOtMM2MH7L29gY0DtvBoa3Aio7QOW1ik72H6GkOgZ/pMy5gpsZlzqsP9xQkmuo6arpOXA1SRoJVCB42UAgt4FJESKANpvIty/Bm4xhyNZg0bJSAUIjim4zab5R5CqLH3ym/EmC5KX6QeRaRDSd7qcH71s2xu7CHYIV7VQEuCD4ggCD5A4QlBEjw4LEl7Ci/bnL94nFgKbtj7Cuba8wQVSIPDZGc5kd3HKMmJ27PUpME4RQiWgOVCZ1Vs3rVPiBNL5IM+q2aF8bEGg7U1tNAVzbkI9PMhZb/v3HpHXcx6f/yr73//2lM6AZfGvP8PscEYdd/9hp9+wzfc8cbf3rNlL0UxgiDZvfnaF/Z6fXorfSJlhfcl/YFB1RKWeys06jXmdm7BxQFfeERN6aWLj2N7v8Vr7yyYbNSYVUNaUYcQgZsYovQE3ihKIdCF57brO0R5RSAMZYLwOc4PUX5I93zKoCsJ5RqqJmjOepTq0VqOmek1OF2u0VPw8GiJecaQ0pI4SVRapFBESiEJlQyP9/RVm2xsPyHZjFYJhZMIZ4gwCOmwIkHpAq1HIBJcmODK2e+hrm7mni//IlaOWBp9gV73edRaTYT0CO0q+4UgCN7j8AQp0S5gsVhZR+gR3fWHefEz/jWXbbuWRojIncOUjqJMOT/4BA+tf4Ch6oKPcMHghWM5XWdqx07GWuN0ug+TB8fqcJnNwxgChBjK3OGygnTYwax1xNJoJE51V38NEA8uL/+j3qj/UwCIePDBGbFnz03jV+y9+u3T7T2srK4aqYQOHrwbemOs9A7RH3QRIpCnDp2myEZgbPM0aT5Ce48PY6wOOywtvY83vmSFpG3Aa4JRZGkgGE2ianiv8NIirIVSoSX4ehNnhngGQA4u0O+kLK1ljO3azMyuNq1NdVRSI/gWojCc+HjKJ++V1LzmlBsSKxjTmtxKyhCQgBNRdVGCRIWAao6jx/eS0SCUligIFAKPwMsEoSWEgAwxMgElQZiUKzbdwtzBf8/nzv8u670vs9x7ghlxHUFlREISaY0XgeADMgSkr7IKTjJKM7IsZfv8s9k9cy1FOcI6gbECWziyQZdo7SouV4qH1TFyUpT3BOnph4z1kDK72iEvUjq6xPZTuplifPMW8qLAFJZ8MMAOOp5hJh8bdM/82mc+86mNMwF3CSD/b6WVWFy80wI95Wq90WBtW1bmKvhISDxaBiVDQCiBKQrKzJGlJTIEtszMYvMSby3DwpIVfU4ufYn9u58gjkucbeK1R0QxSdKkHPYxSKJGjCst0pWEwmJTi6jlOPJqX+EDrrQMOwXb980zs2cXaIW3GX5oIYBUJc+5usWHPz/GmdVljKlxMR8RjdVJlwONIiaTBk9K7EHaAh9PoLZeRz+rMz6nqOuYsnB4a/EuYIocIiDReC/QAXSkUZHGhxETehu3zL+Fj6aLnOo/wpS8klFcECtFXVXPoQ2ghSQKFisC3mtWly5Sq21lx+x1WFcglMR6iUsdg/6QUW+dMnf0ki7EEiE8XjgiAkJJHll+mHaRETvHmu0gs4gyjsjLkqIsKQYpo8EQuh1vnNfrmF9aWloaHTt2TAGXAPJ/Gxt3Bv47Dv/Q7bdc/ZzXz7T37MwGhhBpIUWJKy1pZsCB1gohI7IiJ81SJJrz59dIyz7eGopywCB/DK0CkWnTX7qfVnsKPdasKJuxhkSSjnrUjUVKRcBiixKfFyjvsFpUw3rrydOUVrvJ1GwLM+qDSkDVkcIi7ZC8v0SUZly1ucbJ5YRGvclgtMqFlqKcgdmznqRM8CIQq5QgNTU9RTy9j3Ldcv7Rs+y7eh+N8RpFkVGWHlE6TGlxzhAnCh8U3nl8JIhjjXUjJuQE10y9igdO/gX9WoF2gZHIsBt0d+eqa8G6iEFCOSgYdgq27biMSNdwxkPpsaklHxhGwwGZ91xMvkC3+QVQJRqNVZagYhKZ4NOCc6NztJwidSmla+CkYjBMMaMMOxhh0p4XeameMPm5P0jWfn1hYUEeO3YMQB46dEgAXHXVVeHv0h67BJC/pSmXQvpnXfa8rbde9+KPXrPzubVRmuExeFHirUDqGB9phtmQQW8AIsEExXq3QxQp4vYs05umiCNLcE18ntDvXKBctQw6n8VnF4izJlGrgdQBiUM6R7rWIVYxQVQUdB8sLisBiVIaYwzBBRptTZ51EVGdKFhEMBRlRj5cweQ9suGApquRaMuoHFAmLUyWEdUl0YxmfmkI5BShRvBjUKvRWxkQZIPB6pCTj55jz/4t1W25sggZ0DrGWoc1buPiUOOdJwRQWpIXGVvjZ3NSnWap/xhb6ldiyfCxRyiJ9wIlBEJJlJT0VnrEUZPxsWlc6fHBYcsSl0GWj4hbji1zLfzyFvKQkcr7sSHDBofSMU4GHDlLZcbAxrioWnSWaYYrLXY0xI1SXJE6K5PouM8Xv/S7H0m5+yeV2FCr3ADKX30p8o9lafiPFSACjhBYFK9+9be9/+qdB2tpmoayNEEEEZRKFMFXtbjw1GoJwnpWOimd/oDxqQn2XT7H9OwUSQ2EKxH+BGONR0nqS3izStycJIScshjh7Qghq0Wu9oo8LUiLlKQeoxOJ0gIZBK5wDPMR1lnGxsbwxiFlifAOkw0pRgMKk6LqDaLGFHFzkhe3Yg5c51g+s8qfPeR46Dxc0IZoSx0TZcyubWbLzE00Z/ehx3fhZI1e0SNozcrJZaRzzO3eQjQWEdU8eVrihEfIgPOOECoal/EVeLyTCAzbWzdy5sxF2pN9wGAMiEgTStBKopOYzBV0uwOm56cIwlHmHlcWSKoRbtAlcztrTMxDsulytq0doDPcwcB/kkTG1FEsFylnygFGOTLnIQiElxSDPnmeYfMUitzWolr0cD787C//3vt/7ZcFgTvvtEmS7AH8K+984UzUTJoPPP74SSHESQG8d0PO9RJAvgII/upbIxw5AouL0O+vfvb4k5/cEikpFc25JMyQDkcgHHmekmYZzgmsCwyGJdt2TbNr1xaEdOTlEGcVzdopdu77c2Y2nyGqAaKEcg6XZ5h+H9Pp4XOLtQaEJ6opmpsmaTTr1Yg0BLwx+DSjyHMoHa4sIHVIA84aytwQtZqMz20lGdsMWhOkZCIEttkh7Ix57hUl7/zoBT7ymIF6nb03HWb/5AuYmtqOrCUEGZBWkNmS7tqItfNdOmvrjPKS9vQ4Y60EEYtq8edcNZESVTkokZRZjlQaby3N2iwyrLI+XKZdb+MdSC/J84JES7St0+0MKIMgqTfI+imuEKjYYvHIliVplog4UPQgXe9iuyXjfoopeRARRghb0rAOaxNOiseQTlCSY4sa3cEQO1z3wmSuFtej09acOIv/FgThust23/Idb3rTv6vX4mfK5TVx454rdX3nFh45/aT58Kc++cf/9bf++3cdPnZsNYQF+bXW5/qajtiOHj2qDh06hJTSAfj3vlcdefBBsfg3haLre/bsiV966zc/U8r6G3dO3/gtvqdCf9iVzoKOYnyQqCjh1udcg5AWIROKvE8oulx74wfYuus4gaRiysqAxCJKj09zitUuppNickPUUozNTSMbdULwuOARJiBKQ1kW2FFJuj6gzFN0LaJ0BUHD9MwMY/NbIWkSRAJUtApnSlyRYtKcqHAsZ5J3/kmH7RPfxg07X4+MaqgkIHU1yQKPw2EC5CNLfyXj4vkV+oMBQTiaYy2mpqdpthJQntIYvIVIaVwAHzzeCDywfOFJ8r5lZnoGR0DHCcPhiEYtojU1ydr5Jdrj44zNTFKWA2SIUbHGJgXTczEuPEo2NLhsArxBSQGhQGDx0iBtSVMLenLE/WufYpCeYOQDc4OYbcsOnRm8Tliz4qEVzyt+/oMffPzVL3zh7a9+wfP/5NWvfEnTrfZIT5xn01X7g2w1Q5YN5OMnT/Hx++5b+ssv3Pe2d//Rh3/1qRH/11UGWQD5Nin9X/nBG0AQhw9n8BVpfgGEsBCkWJTZiZMnsv/85Nv/9K1v+OHn13RD5Nq4qU2bZBLXieMY56u6OooFxoCnoCw9kfoomyYfJBQFXhmk2tgsi0BQDpGAbMXIrESVlqRZxxGwZYGk2k2Isrr4s9bjQ0BphTeQZTmqqRmbapO02ljrgAxkjgwBvCeYEp/nhNySjQL10Ofg/mmWLuxkda1ASketKYgbETpKSHyMDyU+eHSImNwUESUxw0FKUeSsr3Y5+fgpkkbM2GSLeqMBHoyzBKkoTUkwILUmUnV62RpZUSCkwvmSsjDIOMKNRhSmRNViRqMcZ3OSWsDYktZ0wmB4krI/xORtZAxJEgMGpRVKamCMms5puTVik7A7bON+9zjOCVbLYRBWO2c4NXL+V399efXX1//yL/tA69brr/nVFz/v2U0hrBk9cTZqbt8aTKMmpDFCO8lVU3Puqpe9bPONV17+K1PTM3sOHz78I0ePHlJfKwX6f3CALCwsyMWf+RmP9/z8kZ9+0203XH+ozNLrsrUea2eW/vL4ysUP/MKvv+vdQohKB2BReFiQ3h0JBw4cmLxs203fM5vMkial8l7RaDRQSpBlDmPzDUKcwJag0DRaI6TsI0IbIUqk9wjr8M7ijCMUAdfLKXojpADrDC71KBkhRFVeOeegdHgTKJ3B4rAerPO0GnWSJCIEQ7A5QlgICueraZc3JdZYrPEUHlwBc9Ekp9LAif45Yp2goxZxXeHVgKIYkZU51jkUEUksaTXHaNbGESJmZm4K7yFLc7JuRjkwSCEIzqPiGC0lrgATOTwKg2CU5jQaDZwzmKKkVq+RdofEKsJ4R54PiYTEOks0nlGmS6SjQFFsJw4J7Vig8UTKogWI4PFOIMucuu+TFIF52+BxMU/fnXAmStR9Qnzv+x985Hc4dSoPIUghhPjJ7/6u//S65995XVzmdnBuEEUT4yRTE8KXOcIHpFQQxyofDf2z9l3pG1Htn/ez/Pzhw0f/3f+Xuv7TBiBPjW33bd267ciP/uhvvPIld72wNd4iDAeIvmFt8/K2Z62nrz4wtfPQm37xXx0OIeRHjhwRx48fF0IIf/jlb7pyrLmtGcXS+66UITikFgQhcNKR5ZbuuiVuekZ9i3YJAzfL2tkhzbqh8AaVB3woka6SGfWmwA8teWpIJmvINEdaDTLgBJUqofcEGwilJbgCm5XYtEQIjytLnIkRuUF5jzCKIEQ1fnUQrMMZhykkZSHxxrG+vom1tRZEI1IfsG7AafOXdPMHsaGDiAU6SlBEqGKatrySq7ZfwbZtW5kYn0ArDV5WC7g0p0xL8n7GMC8YeYMSCpsGnIKgJGmeEUcJ1nqK0lFPDVmZ0xhvkfX7eBmwXiCSnCBO4YsEm+9F2TGazRpKgPQOISsCtXUel/XRw2WUHKE9tPLAnN0cLorHpDUy7Z9pfYhTp/IfPnSoLoTIvu1Vr1x87Uvv+vbZVs2k/TTSpaQxNY1wjuAc3jhMCEgJJi9kJ8vF5bv3uduuu+7nf+9P/vD3f2Zx8QRs1KBPR4Bs0NPDK1/wgmte/4pX/umrX/bSOYlzo84arixlZCEzma/r4F77oue9tIz+1buFEIelEOGnnvvTGqDVaNaUrIvCEIoyQzjtNZH31glRBpXlKRcuGGanWxhnWe6uYukwWfc00wEyypkch8aYJmrU0TWJM5LC5ISRxWaOUnqE8aBASg8evAt466F0lGVB1sswPYOQkqEoyHKHjhVKC4IEISQegaAq54KDyHpqpaMk4tzSJvo2oILFlat0i4c4Jz6OjPqoEFEfj2m0BcHn5OtLRMkMB665kqlN0xQiAwveg7cJjXYNbzzknmFacnFtnX5ngHfV3zuKNEWaURYlRWEojaE/HEEkKb3D5gYvNJlZYXzyIYydxg6vQLuYRqyqbBECWkYoIoS3UAZCUce6zaShIHZLRIVn1jV8Utuklk3vU3d/+o/PHVo4FP/7I0fzs3fd9cJvvetFP7Wn3TLrKytaqzq1ehMAUxZgXJVlvUFKQZkNMUoJaU140a236Te98tDB//Tbv3via5FF/sFUTY4cOYIQIhx60V2/9poXvXjOF7kpikIFhNJBCuGdqE0mamx7My7VyL7qtme/5jd/4ic/MDM72zx4sPqMte5SWbqhGA1y8jSnCIVMxmJdayTKm8BwOKTfH9A5N6S33Gdl7QSld2SZwoaUzTsm2HzFDFP7tjC2bRPJpgbReIt4somTnqyXUYwc2dCS9VPyfkY6qP5ZdEcMOyMGyxmm7whW4LzDeYN3JQSLxBIJj5IBgccWJavrOQ+czfiLk5ZPng3c+3idxy5upcg75MOC1HZZFQ8TZB9vJVFN0GorRDwkyBVqrfOs55/g7OqTICVSOMBjjcEUBuscBkeBIQjLWKvB1NQUUgjKIicSCoVklOekRYEpDEVRoJQkG2WUhac7uIBuPobN22SrexAjTewjnA/VVWNQFJlnfbnD+RMXOH/6SS50VrnIdlZr17HOHCEfMp25MFOMY104FoAf2/KCIIQIL7nl5p9+9rYtovvkSUnhhfYK56rSzvQHmF4PM+jh0xE+yxmNhqAEIS/EuIzDFbv3vmHjGXp6llgLCwtaSmn/5Xe+5bteeMPNt7h0ZHyiIoJHGwfW470jqSe4siTPcp0IYV51/TNf5l/n3nXn4uK3hoUgd92z67NXnz3+xRl52fVlKHy/PH3y7P2f/vR4a2anL8TtWUnI00j0xHkK2UG3JKEQDPqBAzc0mNo1hY+gQKBCwAeFUDEqKogTxdpajgugYokUARckhoAoPTJ35KVBOAHB4ZWhtXWKTds3EdU1Qii8DATh8cZgTU6eeRrSUjclD65InuxI+mnB5CiiHhxlGGFFSpZ0wVqEVAQxICsEwRoEgVotAlZ58vQj7Jy9Gt30WKPwVpFnhmKYURSGwhqsd3gHBEl7rEWRpZTGoGVEZizGWoQNRDWFcwERPGmaYWROM9+OyzaRRBOImsL4UJWWOYz6A/IiI1iLBKI4IaonGOFYNk3GGjdSygGRWVK1NCpWVjv3CuDmt7zF/MQb33jtMyc3PXP4+GlvYq1kTVVLTjMAAaEwuLKsVOqFQEUxKq5jHXTPXRTj9ZavKX0l0ATSpx1AFhYW9KEDB+RiCOL6K/e/ZbbZCkVRSGSMNSXCegSW4D2+NJhRji8tfWxUs5hrt2/7lp88fPj35aJ8XyDkT7Yefdf4/Mw7unnXfuzR9778E3/5ieMAP/7DP/UDs3u3/4fTD+fOtkqVq9PENc1IaJL2JJOTBSYH4SVSWQICFdXwwhLKjPp0k2RQMlrPSKSuDo0EOC8RLiCNQzpweEplqE8mjG2eJG6Po+oJKoqRsqJ2ByzBFNStoZ2nbJrJmJgS/OGnu5zqZkTFQyT5LXSiJYrkHKXoMzmR8MbDh0nzizz0+MOMipzClAgJoeGZnuhRnz2JThTraz0uLPUw6SSxaOMyyEeOwlhKl+OtQfg6UmlM4fBeYMqSsrTUohihBM6UFMbihSBRWwiZRiYJeE/pHFJIMAZXlNUAQEl0klQMhSghUglSe2zwDEwdM35TSMzHhAxl9+EJecZvaBNfOTX9g1vjJFovS+tlLIusoPRFJfzgAt5YvPXVXseCU5q4Xsc0i1BT0q/0uvrM6XN/CGTHDh+T/9Dcra8qQDaacrsIvOgZz3rxNbt231R442ykFM4ilEQrgelnZIMBobS40uCLkmAtqfVys9bhionZnwiE9wNu3Z78WC6vYnJTM94ZdvIDP/pxdegQ/tixX/3Yjul5UZjjYjlbx7o+pUyZbKbsmLOkZYEUFb1CBYGQEr8xUpZRgooi4jgh9QVl6fC+BOdRxBvrIoeILUSauNUgHks2ypwSGcV4XdE9EIIgFUQ1lNIIrUEJ9kSBl968jYc/fIHV5IsEW6cXnyNvnsXKIUG32Tw5zqZNO7h819WouIaKJMEGcIF2K6HVWAOp2Ooc29YND375Pr70xfMMOmPYrIk2DaRpgG8gGKBkiRAaGxymKCAEdFzDeIMrLc4LdL2OUtUJsBcBh8TmFmcL8BalKu91JHhbqT66ckQqJUpHlS97EHRpC13f7K34+MyL49o1R44c/NzO68Zbm5Lort5gRDdSUg6HqI1VsLAVQIL3WOPRxlNqkBaGzoU4in13vKE/dvaxH1/4tf/6CxvM3/B0yiBCCBG+743f/vq56fb2my674nv3bdocSm9kpCOcsYjgyftDRmsdvLXgPN46KAy5KzHOq2RQ+B3tqRt/+JvfeNMv/4/f/ss/+ZMPHt/+TTvfvqWxbXuapquHDwsfQuDf/tvfPPHLb/8X577xVddvuf+h46HV2itOrJxgbPgRJkJBmtZJQokXGrRE6QBUHKu02yFbG1CkI5rTCXEzoihSzMgQSgje02g3iTZF1Go18lGOUgrvHKN+H2cdzbExZEthqfYfwlVCbdZanDFkw5wd7XFu2TrB+890Mc0/wwWJkDkOTVk40rSDteM0auPU4xhrS5SS1JqVjE9ROqRUKDXGzHSLW59dZ24e7v3E/Zxf9QwuxNTNPrZvuR0pDGU2JBsF0rxHURRorSiLDGsU0guUjpFBoGV1Ge+NJctygvUIUQ0pPB5VE6gY6jqhLiVSeIy0eJuCBIEkKwpc0cBOtaRfeyRZXHzcvvFFz7u8VVdbu/2+L+NEEjzCBUQIKFPx3FwIFV0GRVGdjgXlg79QKvWFE0+89Sf/x397x8aY+GuyUddfpcwhhRD+bT/0Qz//mufd+WPbZ2bAWPL1dayGvDcklhJvDKPVdcKGJq13VWMbjKO0JVhLlqdhUz2S+8fG3gL85d0LC+rOxcV//X/8gceOqfvuu6/34AMn/vUrX7L7N59x3XXOGat2bt3OycdXyAafoyVLbLUixGlJkWeY4RCbpXjjcR6m9kzTnGpBJDCmxKQFeS8jOBibHkfV6kgRiNIMk3uiWKG1xhQ5axuCcq2pcYIOOGcJ3lQjXuNxAXRRsG0iQZ8tsXKEcwnKxTgRyEPB+qjDNrkTUxqK0lYXe5FnUD41T1EoNULrIVHUQKka+/ZeyZa57Zw4fYaTj3axq3PYbiCOJ2B8HGcd7V6Lx594hLJIsSZDqxqNpEGkFVpGOBswZYZzBiEFWqjKwi0RTEyN0WzXUIlEKoUKAomo+h1bMOh1iaWnWY8ZlEoi5sKWHTf8zlt+4opfm19v3hSNCtZLA2UN6QLSVeQx4RwBAVFFyQnSERkbrC38CkJ9brD61rf9j//xjne++c2REOJrdq+uvwo9hxRC+P3792+56corfnTHWN0Nz5zzhbFaWCdQCh1HZNaRDYfgKtnNpy7qSmdxZYkoDCIvsc5JrGE80i8Z37lz4uDiYu/QoUPq0KFDPOVLIQ4f9hugfM+e3b/7Y9ddsWt/6kt35sKqOmXmcOUMe0cXGMOTDYcMsxEUJTXpiKUiBM3k1mnGNk9BXeO9QxtLPfHEbkgIjqTVQugm3hmSuia4HOctWiuSOCIdjBgurzFcWqM+PYVOPMLlFA5y6ylSTSg21BHJUWULIQJIg1COwhuWVnuoKxQi8UgpGKUDbJrjbcA7A1isqAQf4iiiXp8iro8Tj7W4/PJdtCd6nDw+Yu3BdfBTBJVDHDGzeQYVKS6cP4uQDq1i4qSO1jFCSJABiPC+sqHTSlNr1Bgbr1NvJcSRIoo1QQoEAuEFKkBwFiVrDHp9lG5QG0vpiCmhp09un5nOF+OG5LETT9J0E7IhLVqCCg5twStdHX9ZKLRAOOvtKA9Z6dXDJnvr236vAsdb3vUu87QkKyYhJCIEmVvPyBopbRDeWDSCsjsg6/fRUhElMU5IgnUEa3HOYbwFWymgO+dFRPBTtfrc4euvv0qcOvXJQ8Bf4+eEI0eOKMB84UsP/fz1+3b/VmEKTq6dxErH/YM6Dz0Cl0cjZlp9kragVdcE7VjuKuZ3CZrTdXQcY4VCBFA4nFCARseAVKAVUolKgYQcgaY0Fh1LGo06QxcYrA5YfWyJOElo1RXOVdOjsozRskGnU1I4TS0ucURIqfGhZHyswU033EytPo4XJf3uGv21izTqYzRq4+hIEzAYVzW03hcM03Uo+tRrLZr1cbZt30G9tswTqsvqo+uoMEnQHpBsmt2MlBpncjZvmUbXErRW1LXAK4EXVZayxlEUBQiI4qhiDPuAMwoU6FCNsAOAUKhai5qXlKMBRDFIQWc199mo4+3wolxVjbAntaJtI9nQMUlIKmBKtyFAB6JwzhaFOmcMj4yy7/s3H/7AO95509ceHF8VgCwuLj71Nj//2fvv/+wNe/feEsexz4qB0IDNUrKVLt4YjJS4Rh0Rb7DX7VNnrhu1u7M4H0AQGkmNmfHWZoBDwLG/+ee6EIJ4zs6dH9h/zZ5V1WJT7lZDJFKhW3V69QaDkLKzrojjKr0/8rhEjcVcMT9GUAqromoBFyRBCKwryFxBvRYDEhk8QgS8BINHBJAebFEgZIxoxMRTNUIoeOScYy2VbG00aNqA1poz1nL/SmWz4AOUsrr2CyPLq171jezZsotOd0Ct1aQz7BDX62zatJsoqmNdjnMl2lVicloHEIosz8izDtb2GGvMMTu3i7i1yhfK4wxPXE5TzWJFhJCW6dlxLpwrGQ5zputNtBLImqgWnFSCDnES0WrXKAtDt9sDqalFEZKAEAItKqt4Dzjn8c6jtWRkNNbXIS7Is0QO15G2DD6ETNnGEvPdmp/ut8NkrKTURngbaLrI47zPgtWnRtnSY8F/+698+I8+HA4dUuLY1x4cX70MIkQQQhR/9LGPf9Pe+a1/dteN112Gs16VTvZ7g4rE5zwmL8jzDKkUUmu8FATnsMbgjSFYhyFggw01lyBG9krgDx686qq/jYUclFJ47ztvfPKxlV1b25u2YwOFFagGfupqNpcpsVjBlec5tVrywGOSb3rtBCq0sUERihLhBXiDD468ZyiyQK0h8dYhMAQR8N6BCJTGEgUQOEoZ0FSGN0lb0zQRH/hiRud8SQuJkJJuaVhDInWC8pJYCoo04/rLrubgLc9h6eJ5vBA0GuMkOmKqNYXD0Oku470HFFp5SpvhAzR0m2a9QaRbDLI+3f4yJggmJuZ51osi7rv3MVYeKRhvbcEHQRTXGJ9us7J8jvGJMaRWOBkT6aqvCEHgfSBgSRJFs9UkTQ3OO9AepSKQAi01SuiqJC4teWZxDvJUI/VmyB8i7xVBiZpMhfps6spWv22unKmVbM8c891JZ0QpUmGkJZbH3fAjn8jPfvuf//mXzh09dEiJf0S+h18VgAgI4b3vVeLw4bNnnnvwtJI3XF6r13y/v4awjiAFTlSWASY3iBDwQuCUwAWPgoqfs0E3D84jbM5Yu6YADgJ/TUVJHD10VB4+dli+483f8asvaW29TA20L+WENOWQ9MIyWjaoRW2c8xi/Qto9yf6rzrGp3SWYEVY2keUQaQTe5HjrOXd6hFaCZruGxBC8B1Hdf3jvyfIUogghAx5LIFBIDT5nc9OzdVxzqh9Y82DLUAFDeWJrCcQ4ApHUvOYlrwLr6Q07NGo1tFA0ajXiaIy0zEF4arU6+BgtJIKEQbrGsLhImcckjXHa9RmGJmUwuIAInompbdz6on38Ue9jPPnoHLu3HMT7QHOszpkzKevrF9mybQcVaVr8H9cPguq7j2KNzB2jzIEQSGmIlEQri1IlUiq8DwipaU82oeMoB3souh/1lJHUTL/t937vT38abope+Or8xf1EfufKeO/mqZrYsjmtY/v23IUi/eVf+fCH/x1Udgn/2ExBvyoAOXr0qBKHD7sf+Gdv+qZX3nnHC4LxPk9zZbK8upHwDi8qac0gILcWZy0KAZHCAWWolAGFcZRO0Nk0JNtUCoB7/toicoPGYv/Nt7/u7a89cO13OSN9KqWsJwm1ItBbMYzvaCKbDTSamquxq1kyNtUjTTs4ciglJgiCdVibwlBx8lzBzq2aonREzmK9RMhA2Cj9ht2UEMVE7RgTAt6D9iPKQhJcYEpZQpCooJBSVGeziEo1UXtG5YhveMFdXLXvStaWlqubcWuRKkLXWjilMRiErg62RsNlTNFF6hpJvQ1WUZY5xneoJY5WezNCa9K0y9rqRaan5njOi67mN8/+Lg+d7XPVzpeCF1jZ58zKiM1bt6ONxW3shKhcEvDGYZE4W2KLnDQzyFDdnBgkQla7ESlltQcRgQC0mwJR7HVTyTVqZe30Oz/44T/96TvuQN97733mI7/PB4EPPvtbXjo5Xs9vekib7off/9HPPQWMQ8eOefGP0DH3q8HFEocOHfJAfPCmW35+95Z5MpOTrqwj0wIT2NhQO5wIBCWq5R0C4xxpWbkumbwgH6XkZUovHtJpl6y6bOMLvOepPQuLi4tWCGGv2775wG3ze36gGGU2GxZC2QDGsnbxAkIIorEJvIzAl6wun6amJXW3EzsI5EOB6ReYbkG/PyDtDbm4MuJMNxCIKPOUrCjIU0sxMuRpSVkUFMPAyvmUMCxxmcGkjuFQkI0kIrW4UmC8AB+qLOMF3kusqJTXp6enePFzXkiZZSAg1ooi72LLkmYyi5RgQxdjU3xwDEcriEhiZcnF9ZNEtQat9mzFsLUZebqKxDMxPkfwgQsXTzLWmuK13/pKXPvTPLb0J7S3H2du9wrra11GowyBqO5cnMfZijRYlJ5RWlBkgdW1ZS6ef5SLZ8+wtt4nGEMUqqmrs5VuVlkGylJhXB6k8HLb5C3DrXOX/dTCAvLgvQt+YWFB/sfv//4khCA+8d//uPPl337gwvZs+nU/+b3f+wM377ni6sPHjrl77r5b/XW95adlBllYWFBCCPtDb3jDa5+xd98+l2e26A90tryONp5CUs1ANsa7YcNgXKhK/claUzFRradwlqEchUEjqPURg8eeOPvbAcTBe6ryTAjBO773n3/Pnq1bDi9fPHHtvJP1fJAFlWihnSBb69C/eJHa2Dh5YYmiiLUL5ynTIWMT44TBGEFuxdg1CplTGIsrU3SmeeRC4P51zdUGGsaAU8BGk24NZVEyMIozvTqZdMyNCwrnyLxAlRlWJSwNK92pKJIEKTHeI7wE5SmKnJe+6MXsbG+l7I+QkSAYsHlKv7/EppldlNYTvKLIDRMTE2zfcj1FYYgaCiFP0+ktMTezkzgaw/shpugT3CROQmtsjMHQsLJ6gZnJnbz8G1/BA196GNUUXHPTON21Nc6df5ypieuxbsN5ym6sG3xFRcEkZC6lnzzETLtN7+IpRp15mq0ZmpMxSVyDqn0nOIXAi7LMXD2aaE41DrwMrvqdA0cPycOHry6B4gf/838ee8u3HvqBV3zDCxeefeDGqCYTbr3uuotvfftP3X7nnXc+CVAdyAn/tAXIkSNH/OLiIlfv2/fmuWbLX7x4WnRPniXr9nGlBQdBCUSkQFQDQxs2hP5DQPiAMYbCOkYuZ6meQSMOE9G4nKrPtwUE+bGPWyGE+jff9p2//+orrn1FqxUzGhtn/fRpYqGFCx5rLZ0LS5TDlMb4NNJ7is46w9VVpmcmkEEgjcL1L6dUn8UoS1EA+Rgnhg0+dGHImTRwbm3E5pam9A5BtbwsjMEXgtN2nPvcZk4vd7lxNKCVCETw1KTkSRPzSMfiJeTOgJdVlxIcdR1T9zG7JncSlwqHBOcINiCJ6HTOMb1pK5FqEUcthuECedlhbuIahqMOhR2xdeZq8myAs4KxsSkG/RFlWSCFJ0liRmmPVqvN2soSg94FNs/OUrs54eLpi/gw4obb4MFPLTMYjjZYBZW5p/ehooM4gyklIQp01TnqEyfZMzHPyvkuZ9bOIFbrjLUmSaIx2u0aUTyG9ALn0hDVhGiPz75iYfF7fxMWue2mm/a+5qUv+N6rd+559U37r9o1NT0NprD4MrzsObfP1Y/8/Mc//tn7fvnuL33hL8Si+NRTHvNP3ykWQFbYYnlV9p48WXTW1/FpKV1mhLEOvENqidQRSkqskJR4cleAsxS5Yd0NWI1zynpDtGMd2jNx89pr5t/zhdM3vOSRT34h/ZUf+pH//Oorr32F7A1MxwhZdPpSooQLVf1fjoZkq2t4GVBKo41neW2JejMm1o1qyVWrI6NJTFZQ8CWMtQxWJ/hk4VmLA8pZvngeLp/3JGFA4QDrkKXhQjrB59c057MRF63iVNpgLgnM+JKBqPG5vqUTEm4Z38518/tpTE0wPt7mIw98ks9euJ9SgS9LrKocpKKgMFKia3Xy4Rq9fp+JiXnG6rOk6TL9bBmlTjLWmq2o9i5Qa04SvKXIOkhimq0WOm58pS8oixIda7q9JXSUMDWxie5an6xvaDQbbL98yGi1S921EcFUVm8+UOJxQeKMoyYbNKKYs8U6ohaQmx1+HM49cJrmYCfTtTvwdoaxtiTWAuMLVZiAquUvffMbX/mzz7zuWc+4anbrwZuuOBBHkcab0uW9nhSJ0hAIqQnPvvzyLVdNbvrFF9xwI79/5WW/JIT4Fwt33KEX773X8TWW/1F/3x944Phxeez48bB1evaxPCu+NUbXRFlKNxwJO8psXuaUwYnCGLI8r1irZUZRpORlhjGGHhnnGkMGUxG59IRQirqqh7smrpq7Y+by7zx8xx3f9w179j9L9QYuw2mBlMVgIHBhw4ci4LKc/tIycbNOfWKSssgZDnqMj40DmqjWQDUSZNRCys2EfIaVC/Bpk3Ey8QRRNUsX8hrYkhntyItAt4h4dDXiE6t1Jscv54bxPWyOpzlfZDzYzXgg1DmZCtLCc92mK/mXz/0uDl51G3vn9nDlxB5uv/wWVoddRJbx/L3Xs6Uxh8oCsdVIJ5DaUZoeK4Mu4+05anqi2nDb6lirKIqNBtnhvd04r9OMtSdotjYRUBTZgCJP8c4ghaU/XCXSLSYn5glOkWcp1nikcpisic2bldaW9ThXqcC74LCmBG249rYW5zuP0aEglwGhDcPBWWx8msbskJ1br0LLccrSgPeiKIfMX1mqb7rj5uc+Z9/Ve7e1J1U5GjmTpwS8kpEUQqnqsCwvxfmTp0KeDd1l7alw7e79z7aNJPqlD3zgo0ePHo2PHTvmn1YZ5PCxYy6AEH/4vk/ed9VVN73gplsOblHqZeOeOybr9YbIAnk6qhyVnKcUgaZQxFphWjEXbcmnzpxkNC2YSOaZbDdBBvYU02JTV/ltzfFxG2vSzqoTQSkP6CxHGIdxbuN9I3BZ1YDGcQNrSorRiEaUQFDoKEYnbdACtMO5wIWlLqfXRpyZL5FKEJcaE1VOUJ86G3P/apN6ZOnbnH3tK/m+Ow9xxZa9qLiB8YHu6hJ/9LkP8LsP3Q1xHYfjxu1XsGVyjoFJkUowVA6tFf/81tey3FlnOpmmfl4RZIIVgToxA1lDCM0Tg8d58sQn2b/3dtqtLSgiStslBEs66ldkQiGRSiCkYJABoyH4ysMwBE8cRRTG4Z0ijmpVD6U8zXYb2+ki1JCotkram8daU5n4CIFwYKXDek+a5lw2u42Zyefx3nv/lFKVxEogGhOkgw6MPcntLy+RQ8F9H1csnyoATztKmBd1a86ui1xIGcdKRXEFiiAFQmiE86yfOU+23hFxHOsz2fmwbXzW3bX/6h/7Ffi1w4cPn/wrQnJPjwzCxo4ihCDe/H3ft/LxL3/xsx/64hfe09o7/weZFI8Pfdg1OT+9SSWR9/VY0K6xHMMpLPetLvG+z3+Wzz5xihNPLPHoF09y4ewK1+3exR1Tl6NCIkaRCUW/IHiksFQqHrbE5SXGWkIISB/IsiFlVhDX6hW3y1h0FJHUm8T1JkprlBSU3vPQow/w6PIjPDYd0JvG2Ltzjk3tOt21DiUWIRqUImLgBTtmdvH9d76ZyzbtwXhH6TzWOdr1JjfuuYE4DfzlmYfxjSZ3br2BfeObKYsRiYpAx6gyoLxEqwjlJSrWBFGd5goPzVxTZgkmCQxGXQrTZ3rTZurxBN57vCso8wznPKFaZ1f6WK4SpJZC4BVIpRFKkReOifHNNBsTrK5dpNtbYnximjL3mLKHySJG6/MYU1STLBfAWkpv8EFSlpbZ7SVX7t5E6S2PnHucWl1jyoxRt8/e7ft51tW30KjnzO4Q9HpDusuW6+dhphhK38+ksFYID1polI4ROkEIhSodFx57AvISjQQpRFmm7JrbIm+54cYXb9u6rfbiV7/qvoWFhXDvvfc+vXoQIURYWFiQR44cQQrhf+f9H3oIeAh472//8s+duf3mAzJ3Ptz76S+Jn337LzLKC6yxBEBqSRwUHsn5c8tkTwyZ2dViVBoiHwkI2CLHIytVQ28rkQRjIQRKwJcetyGeYK1BAo2ohorqBKEIBKwx3P/kg5w/f5LTmyGdaPLanbdxUp5m2G4y1xnRP7uMVB4tS4I2vGTrNcwzTloMkVKiXUXTLwkYqXnNM1/CI8vn+P2VT2OyNUSWI4TAGY8uK9NPi0PZgFLVRZ2UHhEkG1UdzRCIRwmtsVlWLpxDi4hde65jbHwzcd6ksKfp9M6jEUQiQiqJkKryb1cKgsKj8V5Rr41DCKyvnmK9u0RrbJJ6o0mz5chG1S1IWXZwdkMKKdRQ5DhbmYkWRUExUGRlxs37rmaps8TDaydIGk0gZ9vcNHWdMBqNSGoFtx2MeHJ8yHhnFbvmiZM6YjIiqjVRY21EPQZVKVXKRp1EaorVFUTLECUxQQlpyvXw6utuvOKOG2/6Jbzfvbi4+H1fK32sr+rB1OLiol9cXJQ7dlwz+axn7diaNNgRhN/NuBer9JCRpj4Vk5UGY+xXtrnBB3JvQEsOzG/h8HW3keU5QUuEAycDxprKS9x5bGm+ojRYFnbjgbQVncWUWOdo1BLiOK5UCGVlZfzkY49yZvkUa23PxVrJjkaL/VuuZLCeszI8ycSmTdSXOpXsj4hoKU0zahAKhw8OSYQPrqKBhIByBV5EfNuzXspDf/QY51eXcTtLYiSWvOLDiOpYC+sxiUA5US0fN9ZSynuky3DlECJIRJ1zZ54gLYfs2HMl7bEtzNevptYYp7t2Em9STOlxvirVpZAoHaOjGlFcI4oDSE1US5jetIV6c4qAQkXVMdfYdEIZ1inzMYSqEGpFCV7hhcGUlkHXIkRMJOC6y/dz+ounGeSVfNCuLTtxoWJjB+uR2rF/LMed7ZOPTRDPzFCbmUE3Gngl8UGAAadB1CKiOGbp/BLjYy2isSZRs4nPg1i/eNHNbtsVXnL9TW94zyf/5G2HDh1arhYC/7BN+1cLIE+pdU9+w8uf+4WZXdFM4YZSJSqJ4oQL6gxnHn8MGUDJGj/w46/i8YfP8fhjSzzx8DnSNOVNtx/k0I23MVevMREUpjREKgGqRtz76uAG6/FlVVqFELBFiVYaZytqiClKEAIdxwQhESIgguWJMyd5ZPkkJoGVmiMoxfJwnS+vnmPoYwZ5jlI1xsfH6KysIWxVkBpT4GxBcCAQeOkJwSGcA2cZhYLtyTh37b6JRy6eqUavTuCtxImKFCi1xGQFytcJkccDYYMMGEJg4AeM3Ig4S5hKJvBRQv/8Ck92U2Z2rDC7ZRebZ3czPTGHKfq4UFkuhBAQCLTWlcaUAOs9ZbDg6gQvMF5hjMG6AusCulagW4a1FaglSWVFTeWbiNC40pFnAWihJXQ76+gAQnsmp6fYMrEdYwxsZDPbGZI/eoYGMY0tM+j5TVgZVwwBGxBCVveZWqBqmnqtRoRAWo8pLLLmSVo1ZBypzpNP2v2TU+3veOFLXy2E+C93Lyxo/qbq5j9JgARAtNvtzBTFrxrLD03NtuZT0y0Lm0pv0Kiq/Akmp7055obZvdz47Cs4d6bD1AXFd+65ldgZcmtwmcXhkVEEQlaNpBAUWY4OFcGxmr5UZZbz1YjTW4fxnjhJ0DqqFBGDY/XCRZbPnsZrSzc2XEhyGqFGv0j51KN/wZbt++gOLZOtQHu8xXBtnVAEer0+S6tLZJM5SkU4FFYYJJ6oMLhgia0g157r5y/j5Jkz9Po92qKGjyuGMEIStMSkGUGAtB42nGwRgPCkZY9IKrZFm5lRY0gi0lrOUnaB1ccep7Nyntnte5iZ20t9vGqwN8rayp7BWay3WFdigwEnCGZD34sAtqBI+9g8ENQQWcspvUAYj/CKIBzgkCLayM4bVJkgmRibpKYS0CO27drBZGMaawpkEuFSy/onHiIeGqLdW0gaDWw6QpAjqNgSQoDTkhhNmqYI6yv1eiEq4YsN5XrRGdG/uCTHZibDnVuv+NF3Tu17z8EjR4ZhcfEfNIuor+aHnz171n7m01/8i1OPrP/O9q07t7bb49ejc+mM88IrIYJEeYUpIc9yejZjPJHcObWXyR4MQ4EVgrpXlBsnrFpVdsLWWco0Q25I0zhbWaQ5a3HGkmcpzjqcddRbTcbGxgFYXVvh7JnTaKmoN1uEdp1+bBn6jDjWkOfs33MZS2trjLIMESDtjVBBkBlDwwgun95CnRbeV5T8YAzBuCprlQZjSuIoYTTsMykTaiImCw5R2o1+yVEO0w0Wgcc7QwgWHyylyfGFZUtzMzOqTRQipJdETtMiRjhBr+xztnOKwfpFQhTRaowhVXXl58JG0x4sPhi83zDvDA5BwJqc3voS3c46BE1uBpw+tUzeGyeYarwrgsB7h5Oewhbs3l9j1+UJFJIQSR5bfRxjSu648llsb80QUPQ7HeLMUzxwlubEBMmmaYT3hKIkFAXG5NWvIsOmI4rhkP7qKolUeO/JhylJHFc3N1pjRyl5NhTaWL97y9bp+mY99eyXvuKDB44eVceOHXt6AOQpMuH73//+wV/cc9/vz22bO1+Pms+tNZP6KBs66710DoywSO8wzhOMZUfeYky08QJiLyiERwYwpqxu2QUEH7B5gTO28g50vgJOWWLzgiLPcMZAgImpSXDQWeswGPWZ3TLHZQeu4srLrub63VfxzLn92P6Ic7bHMDLsmJ7lum37eejCE/QGfQbpCBsMKkSUdsS+WpPpZDvOO4SzlTJHWRn6OGsqfw1fjVl1bquXgHeIoqT0DmcMZpiitMbj8b5iAntvKUclrbhFK2ohUFgpCKL6XOlBOkURDFlUknf7nFs5zai3hFaaetIikrXKrNMF2OCBhVBWwOivsbx0ln6nCzLgpaM36nL6ycCw1yIARhgEEhc8FkFuRlx+dZ3tu+uEAlRN8cDZL7O5NcutO2/BCc8nvvAZZK9gk40wyz3q01OgJN5V3C5ny2opmucUwxFlt0+apSitECFQbzXxpvpeRFxN3ygNxhgcTsZS2vFtW24Z1KOPLL7t7aePHjqkjh0/Hp4WALn33ns9IEII8lUv/eb7aqb54fFNE89ojbW2pnlqrfUyc5VUYOygCIaaT9jhJtAllLJ681UOrdWyrCwKQlm9id1Gg+xd9ZBZaxkNBxsAsSRxDaEEWV4wNjHOrv2XsWX3LpKpSXyjDlGNsdY0bad48uSXWa/nJF5xcOt1XB3PsEnUackYmVsKB8tuxJQ3bI83E4s6weRVBilKfFFWJZ6xmLKSNAqZRVpXTdhMVeKYosTnJdV4v8p8+IBNDTWj0TJCRAkyjgm+An9VQwU0GlOkDHSO0IoQHIPeOssXztBdu0iR9TDliDLvkY26DPvrdNeXWF46y9raeYp8hBIRFke/WGdlJWPlRBuX1wnCE7zAeo8LJcEJnFjjptum2DRTr2zgKDj+5P3ctPtGJqJZPnr/J3jy3GM8b8f1DJ44T40Y6jWc9xvMaIMz1Rl1kWcURUHwDiUUASphOiFIagllnhMJjRACGUBYj9MCV9qwc3Zeqlq8+/fuued3jz74IIuLi08PgPyViVZ485tvio6+7zPnByv+2Oa5qedPTje2FUVqQ+ml9VRi0sbRKzPqJcyGRtVzbExogvcIHwgbX3hZljjnkC7gvMEGB96T9gcMs6x68KSk1mqweec2ZnZsI2418UoTqQit4srtlcATD3yZifY4B69/ITfMXcNk1GYmnmPv1A6uH9/DLY1d7JITDEaec/4Es6FkUmzB4cFaXFFii7KSAnKVkkkoHaas3t7BWKytqP42L5HG4fFI4TfGqSU+M5UogtbIWFUypkEAG8ROCdI6Rp0VumMGpzXBi+pC0RuGw1VWls9w4fwpLl44yeryOTrrFxj01jAmR0mNVBEuQCcfsJ6vsXxBc/7cAKO6WO8RVoPXKGkwmWHnPsEdd+3AWEOsI9b6yzhvuGX7zdx/8kE+duLT7J3awu5eg6wzQMQJ+GpK6K2p5H2sxeVFRYYMHhkCUajkl4Kg+v+kFUiBzw0qUlhVnWHLEPCxlKo0dtvczF451X74rld90/0LCwt64+X79AAIwH33XfCHDh1Sd999d3ruxKn3zc9vfe7c5smdzpU2KwzBC6GMI7M5Z9MeWVYyRY1YJYRQCbj5UI00g7OURQnOoaWoqBFlpWWVFwXdfg8bPPPbt7Nz316ak+OESCG0RkcJ6AgRKRpxxImH7+fisMcLX/Y69mzaz2xtllrUQOoGWibEqk4U19mE5jKzCYHhYZ5kiiZ1xsB6rK20b+1GBrFliS89ZVlSFBk4XymBmMr3UPhqaiUjUVHMRznSUQnQ1WOCqliyyEqc229cJpi0x2q2StEEKzZkeXCoAELECKnR1aysGvVGMXGs0KoOxOADg3LIqe46F9b7PPTIOTrmPKZxHlkv0bKGxBMKgfN9XnroKrZsjTGlrwQeCGyf2cYoL/nQF/6EombYNNTMdxJK5ylsSSIU3liE8wTrqymXr06FffAb+iyVkqJXQKhu3KOoEgEHgU90NeWkAo+ThLmxtkiV3nz0nrt/856DB1m8997wtAIIwPHjx8PCwoL8oz/60/Rzn3zot6++Zv/s5OTYLZGmGkeJWMRBiaA8F8WI5awDZUFdVEtBAdgQEM5X9bU1OGerM0bjcLZi0A5GQ3bu2cPOy/ZWda2olEAinaCjhLqK8HnGyePH+cx9n2L/LTexZdseSpPhsHgPwlmCteArQWqV1PAjT5TX6BnD2eEZ5pmqWMreUxSWPM+qnsRUgPXWVpI6weNtpalbbmjjalWNq/NBhjCeSGpUnCCiqNr5yMoCOvgAwaO8wXZXOa969Boe7QPaPXXnZBEiVKJ4QqB1DR3XkSpGiTqBGBsEjsDS+nkev3iB4196gnQwRMaBsUaTTc1dbG7sY2Z2M+36LBNzETffOY9WDuEFgUCsEppRnY/c/zGeWD5JrBPG1j1b3CSjLCPSEUJUpEfvHMZYjHcVZ8x6VKgmeZ6AExUwZAgED0JKlPWVYF+jRlyvb/i0SJwUUjmPHm9vXZLpH7/uv/3W+YWFBXnvVxkk/+AA2ehLwsIC8p578C954QN/tHvHrsfrcfNAfSye0RrhXUBFEl3XmFpgXaf0xZBhPkSkjkbQ1UMhBMF7iiIjz9Kv9ChZkTM5s4n5rVvxgFCKelKnHtdQslI7P3/6BPd/+T6ePPkE1CP2XnsN463JSh0xiMr/0AaCcWAqxUfrPK1Y4dMc3Y140nbIzICZvKJ0WOMosgxTlgSgNIbSFNVkyjucqwBCCGilKoHpNMeVFq00sY6QWlfnAEpUo1UEITjAYOyQx4oLLMUlXmq0i1BUpZiRHoFDeL+hNxwjhEKICILCkuNlxvpglSfWezxw4jT50DDemiGJSqZbm5mOn0Ez2USjPsum6Vlm52fp5ieZn29UW/4Q0ErSSbv8+Zc/Vt3nG2h2BDO2ifEerXX1HfpQ9R7ebmTAgLaBGIUVoRrrfqW/qrhWQVVsAuECIolJxsYoR0OcKdHVvZCb2DyrQ6P5yAfuvufTRw4eVO/+KpdZXzOPwsVF/OIiYkPS/j1XzVz1h3e+8drXN2r+B8drY/tl7tmUCjGTKVpOIx1EIaIWxyilUYAzFqRCScUwSxkOBngChkBjrM1oMKRWb1Z20cMRpbX0+n06nXXyPEVqQSNu4NHYzG5s8V0lpOzZEDirMpV0AVGW5KZgcnqSfJiyd3WWE/Y8sy6mJSfxVIAy3qHjCIHA2JyyTBFSIUWluZXEMdZrfGpwpSdOagRfGWdSFuhYIkpFEIAtiVQEeC4snadbDmjqmJkQUW/WCJM1hJekImeVDjb2lWKiiAgiqjbjIauybTmBX5niinAX+67STCY1Wo0GPVt5PS4vjchCiowrkep8pDh1vMvmadi7c54sL5A6ZpiOGJkCLaDIS/qDklzkkEhs6ZCiIkwKFyrWgg8oISikovQl2qqvCMepjXNf5UHqgNMSREB4i8BiTY4pUpAOoxtMADva7QSAgwcrI8unI0CeWiguLi6GhYUFvbi4ODz+747/1yPf9LoDt+/eekVzkDthgtJeIagu8oQCocAZQ5lnjNKMNB2RDQe4smDHzl3YEHj85BOcPHea2uoKURTjgic1BaWr/sfXYk0S1Yh9jaSslnWj0xcJey4nOIEQHrzbMNKtlOe9cwgLxkjK3NCcHGNXZ4rhaJnHdI8r87h6yL3Deot0GiklpSkoyoxI6WoPiCBSEpPlOGMrb3LvKK0BJaGUiLJSeJHWEGuFNwVnT55mpbtKuzVGY7pFY2yMmoqJC03sY2RtjKbWnFdDnJQ4Nsocsuo+pr+N1fNThOEW2q0W0xMN2klMHCmmWgo/VjBb7/Dlx06DVSTjkjxXjMm9nHzicXZu31xdU3qLUAqJY5hlDIYjZkONNBsg/RgNcoxQ4CxKbmz1rUVLjYscXgpUEHgh8VohVKX3JaNqLCykxAmIPeTdPtmoj1KV3XWQQighubC0eivAwZWVr3oP8jV3ud3IIPZnDr/pG6+b3/a2y6Pm1b4/CibUldcbvt0hgKgWccUwr+pSASKOaEYTWGvYNDvDZVdfizGW1Bq+8MgDJCavVECUIihZeXsjyE2gtJ6SkkJJvITV+/+SmX3bmJ3bgzMWGaq62zlHsIZgzIacaIE3lctUe6zJdDlJOVxhhQ5NahhX1dzCCZRSlEVBXubUogi8R8cxRWkobFEJ5ymF9xLnBcaIimGcV/1WFEV0spzl02fJ+0PaU5O0xtrU4ogoAmJB0JBFnsRr2r7FerAMKakkgkuCcGTdNuceadAdOmpqHSctMgbnLGXPgXA0Ek1cb7J1do4LKyu4SU/wkoaYJxukdAcFE7UGykOwmvHRAcbVZsbiLqp8jF7aZ3MsyOwY3hVEwSMjjcMTIxkJg/LVSyMloFWC9OBlQCuN8SVOeuJ6EyHBZTmdQQdbGmQSQZAIUR3XKfEP1xl8TQHyFEPzyBv+2b941ZYrfmHTyLCc90IWSRGZgPMe7z3WlaTZgLIoqCUJrfExdNIgEhEmTSEv2LV7FwhJlMToOKKuY3Zs3orwgW63WznAKoUj4AArHEEFXBzhG5pcZHzi0/fw3GfHTI3P4k2lKBiMg9IijcWXpnKttZa8zCmdYzJqk/s+3bJPKQuUExUFPgSEgqzMKExJYjQ1FdMQEmdGaDStuq5uWFxlEkoQWFnpc+EcneVVumvrKA/tiQniVgOgEvi2DlG6qoRx/7v/CDpgI4f0Ah0kaaF57LEClUU06gl5OuDC0ohOd52piUlaE+N4C/kwo9Fy1OKEVpIw6GQ0GjO4whOKaQbdERPbDMOR5/EvbGZ/6zuoRxGjhiVnmeL8J+ibx0jCEOk8XmgiKuX3klCpm9pAQKC1Am0JwoNSOB9INhgRqda0Ww26p87iij5aSnyQeBERUAihMNZvHIgcenoDZObBBwVAQxCULcIF2zM6qFhbR0llyZVnKXk+gmAZa7Vp1FpEcY2gFL6wrC4vMTXdJqk3QEpcCKR5gQsQJ3Wm222mJqdZW1mmyDPEhsasVxKhBF5CIaBRj1nvrPDJez7C9QduZH5uO1Jo7IYZTihLrCmr8q4sMdaQmQzpoZ20GRQF6+kAIQVDX9A3GXkoKTA4H5BGUEOzqRxjXDWYicZxpaaUAR9Aa49AYkVJXhaMsgxbFNSiGJ1olNbIjR2QVwqbFeAD2mnwEaW0DOKUTBVgKw3dgct4+OwyUt7Mrp370I2qBzKFJx9ldNZ7rHU7jI9P06o1KEaWpBUx1Z5gaXUdm1ikkAg7SZl66i3Dlz5dw462UW9GFEOHKx0uquHmX8RKfz/ti39CEtbRiai8IIMkatSJawlKyK8sUm1RVuWmrn62UnsQGp/+/9p78yhNr7u+8/O7y7O971tLb+pu7ZtlS7bs4EXGEW6Z2GCDgxNMKYQEMoRE2XMm5CSzhJlSh8yc5HAIZ2YSGAsIxCEBqzBgwGC8qm3jyIvssZaydqlbvVbXXu/yLHeZP+7bQpDJQgZsSXm/5/SpPtV1uqqe5/k9997f77s0dGIxvYrxeA+DYNBonWFMjlKGflE883Wqj29sgdx3X/rYTOqttmmlVUG1HroYEDdhMhkxqScoEQb9efKsgpgO0G075rmnnqFXFey/bF/qVilNMxkzmoyTpZBJe/He3DyLB/fz3KlT7OzsYJVFK00uKd+iCYHdxhGznPH2Nl/63Kc5vP8oVx28mn5/kNinbUczPft0TU3X1rh2Qt00dC5QSs5mGHKx3mFXjWltgKkRXohggjCJnnXfMDcyuCogRHqqTF0fFDE21OMxLqSskcymLUkUISrBaIPObPpjLKIUru5o2ppxL7JX1DRdRFrDRbfHwxceZxiFa+Y0RmsybSjmB1TWkhlLDIoLG5ucv7BG5yZ0rdAFw9ygYL6/wO54j15WopTm7JOLjDbX2Ti/iBXFaKem811qNHSRzo+Q/Cijo+/Eb3+ahbCeCj4EmrbBSSTLcjJrMNaiY1oJW9ehupYOg5GADTB2gaLXI5tbxNcNJispspKsKGNQKh6cX3gG4L6775OX+RkkVcg4NEUXXWi6CdIGOmPomhFNM0QbQ1/3sKoiBgGtGA33eOrJJ8iyjCNXXIlSZWr7KpIjetfiY4f3HVoZTFbQG/R55avmeOqJJ9nd2sZaQ7Sps1RKwAWhm0zp2AE2njvD3ul1+mWfXllR5CWiLRFPdA00LXRtmoy3Ha1v2Qk1WzImVEJ0mvGoow4OoxSV0iijERsZxYaTzQbWGbwLFLlDSWL35pIkwVmWU+QF5fyA/uI8xWBA1q8wRY7OzPPtYNV4NrbPc7o7xe64RW9HNkd7PDw5x/nxeXLr6eRjbEx2uCy/lYWD8ywuLDDXnyMvLIePHOTw4UUmo4at7TEb67tsru9iMoN2hi4EbKYYbRlOrmquuq6ijY62hq4LuCYQHBibhFumvAZfKoZnPsxcN6SOgV7XktUttW3ptEJrTaYzdJ5hM4ura9pJi+8UnXVor4kS6C/Oo1zA2Aybl1hr2XGtPHLmdPPC5+dlWyC3HDoUASZWXQy+U6Gt/a7yMfc6ON/qWFiMKiikTME0CHvjIU889jiZ1hy94kqysiSIQosiRqjrlkB64+6Ohxw5eBRTpMl0lltuuOkVPPPU03STIViFVxrrNf0odMHjAygUyiiM0rSuod1u0JKMnJUShHRucMETuw7nO7baEWt+C58HuhbWRg2740SWTC7qkVJHejpics1uHHPabeLalv4kY1D1qPo9BnlJ2e9RzS9Qzc+R9StsVSKZJU6LIioh6jRlD1XJQnE1Nw419194kK8MT3Jmd41t3xGUo/MKVZ1jV32Crb1trgtvZWcH+v2awwcW6FcZQUV8gP6goihzNjf22NjcZVzX9LIiTSK1ob+wQOeZSn8DbdMRfCAr7HRmo4hRaKVg2FvAbO2Q1R1DMWTaY7xHK43SilZ3qK5Ba510KIUwGQ7JxxArSyuBYCy9rCAKtJrY11Z97Zlnd3/+s7/9EUnl8fKimvxBrKyuEmOUf/W+e07PZ8WfOVz1L9OTTnTUKow7Kltg84o4/TFHkwmPPf0E46bhxhtuZDA3h8kytLUpO1xrtna2ubixxqhLVPUDCwewRY4tCxCFNpp+f4CbNBhRaGURAsFAlhlUFAhpKEYMaFGIJLkGpE5aWzdMxmPGTUPTNYxdw1PNOpt6RKeEtd2aC8OOUQdtECYhUrtI62PKHJdIsELrPHO6x/7BPIv9AYN+n7m5PkWvQud5cr3XKkUTSLL61NqgjCJORTcuJieSBSnwmecz6w9zvtumbwfceMVNXHX0elxX4LXFq1NIvZ+j+6/h0OEBi4sVvb5FtE0ERd+BRPKsxBhL1zkmoxoVFV0X6XykyAqaScNkNEnkSWvSnC86lIp4GtYmz+DlWQajXcLEJz8wn9KkwjRWOnkuR6L3NF2HMpZe1Wdc1+yNxsi0U6WNRbQmy3Lf5VZ/6msP//Of+dCvf/BTy8vmB48f9y/rAplC/eTP/Vw9/7rrf018fMPEx/7T7eTz8/MHjh7K+ya4pJIbT8Y8c+oke6MhV119NQf3XQai0vJrM/LcAsLW9jabW5tM6hHKR+Z7A6q8QmUGpRUxRIy1SJZRd45MG4aV53R3kULpNIhUhizL6Vc9qrIkzwq01mirU7hljHjnGTU1w8mYjdEOz8oOTkfGdeDMqKFuY9KGyyUlIbQh4EIgU4I2GrywP59nf9knE4O2BpUs4hGtEmlxOnE3kgRHyfNKnrebNt4RXIeqAzqPfHXnabTN+Ovv/au86/bvpMjmOHXmMULbkeWB3M7zuuu/hcW5AUqDj0moZWyG0RbQ6BAwWsiKCo9mtDvCt46uS3KEZjRKLu/GpGEmCiXg/Ji9bo09/wyy8wDFbo0PFu3b5Ogf43SmFFLEtE/kUx8Crk15LL1DB5Co6TZ2UM7TqEheld28KdXnTz21+89+97d+aO3M2t41b3tbPP51eDi/4XOQ48ePhwgi71858344dvWx1y6c3Irdb9/+7c/5EHNXx9iNR3LqwllGzYRD+w5yeP4AwXka11CVVaK7JyldYr4ag1YKBNaGW8z351CZxfi0gngbKfoD5kZD2gjNoCNkngP9yzkyfyW5FCgtEBPt2rcprLNparpJQzsc0YzG2OEeQ5tzwe2xJ448BtrOTQ0QQCRMjSUiQRLZcBwDQx/JOg860tCAjzRG0NFT+ggu4rpkUBeVTnQTBK8itomoEBCrEa1AHEOBykdcXaMRbr7uJnZGO/zsB+/hsTNPU+QWWxa0wdHLKupJx3C0RRSP8prgHbVX+OCQGFE+LZmB1N3rehWbazuJZdCOKat86uye9B4xehQOjKfMKi6rbqJuTtE1D9PkEe2EGA2QmA9FtFjlcVYn+p3SlMqnXMqu4+DRK6PffzCE3c1oo9Eyau05v8NDp8/c/ciXHnlu5c4VfefXKe3WvAhWkBSXEKPcd/fd+m3Hj2//z3/u+9+TaVmUpnGxbvTpzQt03lMWJfv27UcbzXg8wnmP6AOEmBijQgp1yYylLTNqgUGE9dEuB22KGyvJEWWJKlBmA4b5BqO4y1uueRtX7r8KCSYVXGiJbbLAESRZ7LiAMhEpkpLQ+pxKQTbJcHXAEIkhFZWeEvIUMW3PYiCKopum7iijcdExjDUtLTpqgoOms6Ad0kBHpB8k2bV6QbyiK3yibvhEi9cqsr/xjOKED218kSf9Bs88u8nvPvgFdKYpBgVtCPguuSUO4y5rp7dwwdBKTd1MwKVZRFQTJCh0MAiXJMCCMhYvns612LygdR7f7tC6DmM1eZGjMpushvDgKopDt9FNdpGzG2wXY3qxT+bBCQRarDcoPKiGoCROtAlZKOKgHcuWO6/nb7hC77vxRs6fW+PMaPzh1bPP/sI/+rf/6peWlpb0nStfP3eTF0WBkIiH8VPLywCSef+mXiC2EbM+3EsEP60YlBVVVeEFhuMhSmt89OAF6RLrwAeP1hqVV0y6Bl0U7NQT9PYm8yoNrPTU5r+xng21x3WXX88V2SsIMSJGQAJ4m7K8AVqPiKBF0g2OEe9ThIMWIUMnIzwlGKspreBdTFvz1MO9RMfDCuQarFW0XujZjIX+gCKvqDILVgjS4WPNZOI5OTnNSDx5lVNlFqNKMmtRCrwyjFzH1niDJ9QmT9qNpGkPEZtlGGVoxo4QPUZqonVc8J8j1IuU3dXkvkI8THBY2yfThsFgwPyghzXpIrVty7ieMGlgPJ7QtJHWJalwUZbkZY7WKuk6LjmrENHsw9/4HUj+O7iTq2xPAgOl0SYjakOtPTjIA1itxRaiyR3jLDDstnYef2jjq/nCwsP/fvf0L/3MBz/4GXg+Vvzlk5P+h5+L3AcQR93kjIoiT0/2vvJ4sz1/g8mua30b5wdzYqwlCownY/KywHlH8gXRxBDTTRLYV86xr0opqpkXtuoRfjNAP1CUfZQyPOVOUl7W56r8OmpqjGQoSS0BFTVeS8opF5UMBczUeCFEMmXIjaWrOwplyFAEAsZCVSra2tG4aWlIUkRqicxnmoG9dMg2vGLhco72D5DPzVPN91C5TVuebkLbTAjNFpvtGo+1Z6nzANogLtB0Hc9cHDIMHl96ir6l0Dk+CEJgHFo6pTGZISqDEQ1kTPQmzxX3Etsj1NsaQdiXHeWwvI4brn8jV11zBJtrYvDJOskl58l6cpT1tW3OnT5H2zXYskS0wvsG59LvJ0alJ0orVFD4SZ8rv/XdXH34Nk599UlGz65Rr48Y73YoF9CZiW1eyVrX7Wr4f/Ymo1Pbbvjx82rykV/6jU9eeJ6wtxzVyuqdX/fieNEVCHfcEThxArLqE1/Z2hievLhxV9TyXQI/kol1g7KyoiI+OCbtGLTQdQ06WnxwaD81B9GaXEkyrVYKqxQ+BLaaEdFotB+zG2r28l0ur65AHATlphEHKg1UiBAcQsoMFyUEsaA7lDYEBVpggseIYsGXXIg7SKEpc41SMGkdtY+4AAVCL9NUlSFozWTScnlvnqPlAjrPyPKczFTYrCArC6LVNKHj4GSHI3tXcMXwHPdPnuK82gYryT/XgNPCIC+IrWc0HhGtwmrBaIXVNpWtdHRBpsZ0GoktXfYk/qDDqxpdvYYD1Ts4cHhAlqdunTGazJqkK3cBbSL96igL83M8+vgTSfuRWbRVKbtdKdAQCHivCaqGGKgnfY68eh+X3XwTxkVUHWi3R4SxD725ffLx+7/09MfuO/HNH/vQx9Ze2LS9tOX+ydXVKMflGxas86IqkOPHjweAH1v5t4+9401vuvVjX/jCM3/7XX86vxjd/3KVzZW2Eh1RXNMlvyfX0bRt8lVSgvNJbSgqmcxk2mBRaBGstex2DW07xHUepyAXgbGjsx0ms/joiD6R4tLWX4gRokrzEpEumUV4j1iDjhlZWXKVOULMM764+TjnJjvoImMRxYKxNBFs1EQN+bRdvNF1HA4Vb+xdSa8osWWeqCRMbXuIKK2oegPCvj6FO8z+yeUc3D7Ah5/7Eg/sPUesDGRgQmR7PCHGQJ5bMpK7vQ+Bxjdoo1BWUJISepWkl0BRFRhjmExGjFhD7ISKg0TGRBR6mswmOtmZ4pKNUm++4Oprr+KJR5+kHk/Q1iT5gTZo68mKgBKPiwFcn5PPnOF9v/hJOjxllrMwGNCveixmGUezK2RbhqP29Lb6/cWxrO5cuVNWjq+8/Nzd/6jw9Jkz28vHjpkf+/hHT950w7XZ5YsHjpXWhhiDmkwadsZDAMqqh1JJZNoFT+M6Wu+IEXJlsJLapVYpJtHT6EiQJEl1ylNUFf1iH0qbZLwWU88ozULSIysRurpmsrfHaHcHYvq+Sc5a0NMZ81nJwf4C40nN+mRIrRNTtdSKUgvoyJ4K7NUtV4Q+t1/2Si7TA5RoyqpHWVbYzKKsQbRKBTg1gGtyjZQZiwv7uHbxcsKo4+mdC0xMpGk6fEyT7EtJtYrpFk4giko2n0qjRaezkIagEw0nGThMUG3GFfOvo+qbtI2MKZcwkUWTmYMATdugtGF3b8i58+eo2zF7o23G7RaTbovdyRbOB0KnqLuTcVsejptyTlrXUbcTNvY2Ob91nqcvnpaHTz7KKOxeduCawV9//Ztv+lO3ftONh179+pu3vvvd77u4upJcS5aWlvTq18nB5CVVIMugjp88Ge5dWtL/4Dd+4+M333DD6HDee0ceY9iZjNWoueTenmF0Uhh6ibTO0bQdQcAqhdGakCUv3iEtrVUpNNR5LvptzrsdDpaL9MimAy1PcIm56yYdo51tNs+dY3djnfFwSK4t+/fvR1lDJgaMAQStNIUqOJAv4McNk7omRIULkUno8E1A1YqriwPccfiVHM76ZGWJ1Za2bQkxORvarECUSpp0lejvQVI3zIuilw94zaFrcM7xwKmnaUJM0cyBFPVGmpNc0rOHGAmk9NoggShJiemV4KOQ6QwCXNx7jroNLMo15MYmMmiA4CM+pqZD1zq8j3iE0+fW2Ku3KQcK04uUB2FwxFEdGrHZfo3z3UPxvHlMtuSc+DaE6EOIIsoYIS80RdkjK0qUjdFWOi/ms+vm9xXflpf2r73xT77ybW/+5lu2Pv/Z3VOrq/e39967pFfuXf0Pklv/my6QE9Ol9ebVVfk0xHxx/tEbBgt/f14pudiNZDhpJWqN0SrkWnsfvISIdD4NnbROAT25yYkCu3HClybnec6OafKGZ7t1Ht7b5rOPn2SPQJ6B25mwsbXN+fWLnHvuFM889TjrZ86gnae0GUVZcdnhIxibJeWWlnRs0VN39ihoJyxmPfrKsGgLDpg+l+t5rssP8icWruZ1B65lPu+RZxllnlOaDGMzuq5jXI8JKlLlBUZbfBACPqWS+4CO0BBRUXHTZdexNxmyunuS4B2+CygEJYIiCb2iEiJh2nIO06Fe8geGFP2sfJpqS9GyvnGGvc0WN9a4ieA7IXjoOkfT+qR5t4rdnQlnzpzG47CZIi8EycfML+5w4ysabnvDKyKmlceePLntgz4Zan+wjSO1N9oO9WQko0lL3SSfr0JbySWPSnTocMFm0fQX82urhezPv+ktl3/P9TddtfYj//BDD3P8G7OavGgL5IWFcu/Skn5qfr7pBffam4r5W4bDPbfjGrGiYl71lMutal0ntK0PwatJ7OiUp9WRNrQM6fjy5jrv+9inePiZ03RFjrpsnp2J58EvPssza+dhsaBta9rNbbbW11jbWieLkSsPH2VhfoGsKDlw6BA2L0ArtLGg03lFRNBBkoG2QOsddTtmoax4xf6jXL9wmGsGhzhYzdPLKoyk+IMiy7HKpu2PMYQYGI522K1HqNxSGov4mJwSAQIon1iw0iqO7l/kmewirkg79W6qI0Glc4OKYESjYnJGERQqRpTw/JCvcw5lDVoZdnfWWd99jI3xabYn59ncuUg9bBEMvXKAzQyEyDNPnmI0HoLKMDonUwW+VlS555prqrg4OBi/dP+T4TO/fv93fO6zX/qH/+76n3/I6OzKucpcpfUkpJlKI3U7Sq3jiQdUJCrxSPAxeq9dHOzXhw4d3Lf0httuvV7a/mc/8pGPDL9edj8vmQJJq8iS/MvVn4z/o3efKfcvfkueZVf5tpWs6svJrj51KrqfHuJfZzOb166JQ2lkpD2NNEykY6dS/MJnP8fm7gjVCadPX2R3r8F4TaUL1i5u89zFDbazFhbATiYcLha5/oprmJ+bB6XoLcwzmJ9P0l+jUdamw6tMzykBnHd4FdjYXSdKYLE34OD8IoOyT6/oU2QlZVFircEHn7aHNtHWn3+jE1lvhlzYWyfElkIV4EFFwQfAJT6TCxHpap5U59jJW/bPL7AwNyBGT900qOnc5pL3VJwWBVOOWe1aPHHaPVPsbTfsbY/BtITqAqP4FN5fIOt22Ty/hdKL5Mby7NOnuHDu4vTMo9GSUWYlme4x2V1gbS2EMxfW9Sc+9/G7vvDQw7+6eu8j+tf+8W898uhXn/3Z6645Mr8wX71F5z5abTAG8TRBlFfRB+V9q7QKShuvjTJKMNis8wcOLb7u0JF9711cOPSp9/3kz5xHZivIH1hFTsTjIM9tbOx9LD70/msHVz8+Ufqa09E9euLZJ9/1y5858avXvfIVv74t7kht46uqwhCUjsQgVdXjk489wRcefYL0Ek6coL2tIWvnNxhPxsQYGI8mbNcTjlwz4FVqnpsP3ki50E9OI0qxuLiPrFeBMSirQenUDtbJ36ntOmKMbGyvM6x36JcV82WfffP7qHp9srwkryryqk9ZVnR1srPRNkuiJFKHSSRJgHfdmPVuSNM0KU1KJztQT0i2RD6wU2/xZXeSLlP0spJeP+fgoUX6vZJJM6J2HVEBOhI1iBHyMkdZRdGryPMcCYFu1LF9YYtMW6rBgKxcQEnOYrlAvxsw3vacOrPOxto6W5sbKDGYLCfPy+TarjTGWIqqoB4Noh8dVnODax7+3Fc+9Mmlm/+lhmfVm970JvmVlY9+5MYbrnuy6pXvzbIgqNBV1cDIpLo4XGs/3Q7l6UyKJ9q9ENpRwHeMfB36WkWOHJlfPLAw/zcOHzpYjEfxs3/n72zGEyf++DtcwksLkgx5fj/uuusue88993QAf/Fb3vatt1x12Yf6QjWSWvwAec4PObW9QVN3rK+P2Lk4Ym+zYWNjmJz+dPIL7y30+O9vfyNv3Xcd+weXEzIhC4Lq4PIbr8P2esnzFiG4gO86Qgj42jHZ3mNj7RxPPPUIg/mKTBt6vT779x3CZEUqAlGINhgUw80Ndre2ycsCo/Q07dcTY6LL7MqEx90FRGmusvtY6C/S6w1oCk0eBFHw+a2HWbnwOWShx759i8zN9ci1kGUW5xzPnjrJxvYOZV4iJo14rLEYa3HO09UOFWDr/B5WwfxihckzuqDpF30Ws0Xm9i5H715F5Ag4yLRBSQ9MSTXXZzwZBY0XW5WiVEVRZMQ4CaN2or72zBd/+P2/+T/8xPJyVMePS1hePmaOHz/h/sz33v7n919pf7YaZOXG+e6Ta483P/jxj//uqRe+uN/5znf2suxorP0zr7jl1ivnmmb7tgOHFsrTT03e8MyT6z/8qU996rGpn0GYFcgf+JnvXVpSf25lxQO89dgxc+LTJxwR3vOe91wZL9/9S/s6/w+siYMtGvZCI5qINSop8aY2NKrLePprGzz4hWeo9zogYAvNT71riVdfeQ0ZOUGD7gKqhatfdwtZvyK4FH0WfcS75Mzu6obdtXUe/MoXidGxf3EBRWRufoG5/YdQJseIoLWAtkjUhMmIs6dOorUmtxaUwhGQCCEaogo859dYOfMFbK/km/qXc6ScI+8PyEzJU5N1fv38/ax128nPttAcOHCAK684Qq/KqLIcVOSxp55kOJlgtDAZNxhlcZ1jd2ePPE/ERXxkbr5Ca0HQNG3HZQsHKYuSXnuAcvtP0De3omLyIEZ6RPEUvQVq2WK8ucn+xcOgM7JSY7Mqxi6LF4ZPq6fXf/ON/+aD93xpaWlJr6ys+Esf3/7db73xyqP7bvi5f/FrnwLq5eVjZnU16YNWpvf2xQDzEiyQeGe6gLK8fEwfP37CAfYv/q133yX5+EdVPywORxN8nYzarIfYQeMdjR/RuZYgAaWgf7Tim771RrbPjnjuyfO86uiVHFk8mA61BGIHofO0kwY3HlMu9J8Pu4wk8qGPkb3xFo8/9RCTyR6HDh6cymEh6/VQNkPbHKvTYT4qjUJjBWyRM67HGJvYx1oS1bwxGrzm+uxK3rh/yP/xzCd4qjzLgYP7mAsVHrg4HlKblp5kBC845zl/4Ryj8R633nIzeq5AJPDKm1/J5nCLXBvWTl9k9aHH8U1AotDpCNZQVDmtdxhJ4ToRQ9ApwHSiNsiyhqrcj8LT6THBZQS/GxSoveaJTw3byRvmR4d6WdVJdF68rkSi84cG10rr3vq/wD3vWWKJFVZYWVnx0zf/E8ATAMvLqOl9/A9e3MvLy7J6y6rc/MiawB2srq7Gr2cBaV6iSBf5X/vv+r4/9fY/+e03/0J+oLur1eOSUeN8zFSYjsu8OJxxBOlI8zqNYCEY2s7jTMdgQbPvSI9vuvpa3lAeRVw6C3gfab3H1zXjZszioQMpycl58AHvWjY2LvD4Y4+wt3WRQVVRFEWiYJiM3twcpihQWT6dNKu0gqikgByN99ja3cLaHKOTMEh0Ui1aSRP8K/Yd4Xy7y6M7p9lrG7bbRJNxmTwvJopEcq2xxlBPajY2tunN9+j3K6yS5wmFBw8eYGd3h82tEZpER8EqFIHMKBSCa5M10aAssAZcbMndNezvvY6iqBABR0CRea+H6tntL/7lznVfWJy/7D02DkLwXikrEJ3SIZOJ23lF1tt6/z/77X+2eckq9JKz5qFDS2p1dZX/1FnixIkTcXVlNZ44cTKcOHEizNq8/wW4994l/bf/9k+GP/NDb/1Hh64Z/LwZTK4YNyPngpIYRU+ko5MWkaRawwldUPiYIs4CPjF1Y7LncS7Qxo4FUbymdyU6JHZuG5InVgiOzdEuO7vbaNdRT4Zc3N7gzPlTPPv0E4y2t+nnBUVeUJQ9RCX7od78IiYvMTbpJy6FbQoKrRSjnW3Wd9dRSHr4jEUZndKpleAy6OtkD/TVySm88rR1IHSRblzjmg6dWWyeT9nGisxYOt9x/tw5ijJjMDcg02mFUgbm9y/w7KkzhCYkm6DgwUfiJcJh1JRVTq9XoZXB+wbrrmBf/jqqKocoxNBF762qw1q9Fh/88V/44E9+7JqrD4/7vX3fnoWF4F0ryig0EFUnE7P30199+P6Ld9xxh1zy0j1xgviNnJC/bLdYS/cu6TvvXPHf84Pf9gNHXlH9kz23HfzYJeV3DDjlyTwor/BdCtj00aNDSFPhEMCRnMYlDd20Sk7qZ8d7nO32uM6U7AVPHgLKB9x06Hb64gVOnXuax9jkqF3ggBnQBUfV62HRmCzD2ArX1SARmxVonU99eA0o0BIRNFFFWtfR6ciun5C5mqrKUImJhVeC1cl+9OreEa5bOMyju6fBgQupuBvXUnc11aBP3i8TjT94rNFEF3joKw8hWnHtVZcjUeGjZ3FxnisvP8yTF59D26RBiYBrOybjDmsscTojKasBRdbRsk3wHUiGqJxMd4hpZK/enTz11NfOTmnoP/Y3lg6Vr7zs0PF26HwjovJqIM1ktPmVRz5xFuTrlunxRwn1UttW3bt0b3jXe9/yhoOHq5+LcdyFxomADi9IeU3SziT4STpujVeCS69mlImJuKdT9oYLHgmei3HI5/aexhPQXnAijJQw0oIj0unAx5pn+e2dxyl6JVW0VHlJXlTYqkDnOUqnYE8XA9patFaISk7tSifjM5SgFey1E5SLeC2sNzsE3yVBlUkxDSoziM3Io2E+2GRXlGt8aFA2hc4ordkbDtnZ2KRpG6JSBFGIMQQfeeqxJ9iuR3Qkv1yjFIcOHcDj8QYaCThCIjEbhZdAM24YXtxl/ewa585eZHPvHE23RexCsgdqupAVEWdGn//CF74w/Gt/7R6zvBzV6rO/e89m/WxjMqt93TkvMe64Z+9/6KGHtuJyUN9o4uHLvUBk9ZZVEZF45MoDP1nsR40nIyXBiPeXrPa7FNkMaK2fT3uVaZEoScbIqGS972NAkThKatrF+vf105zYW6VhROgaygYKJ3S0fHV0ki80J9lvCw7aRUzeoyoHiVeU99AmJyjBhY7WeYKo36N3wJQflaSyXXB0bYNzDieBs+0u290QJxGvIVpFMApvFZ2K7PkJsYhklSErklFCJCImuYJoFKPhiL3dXULrCCJkRcF4OObMqdPp+rQdddtgCo3JE3HRPL/1UyidJMmmsGRlTj4dYo7adba3N9i8uMmk2cKHlp1wkSHDnwPCkcfOxrvvJp744m9ddLhHJQYktmF98jV54sKX/ikgd67e+VLsmL50tlhLS0tq5c4V/xf+6jv/0cJB88ad0Y73Xms3tShFpXjoGGOKQCbiWpeSmUJAhYgOgS5OGdRqynyVNFPoRGFiQNvIx5rH+Vq3xrWyn31dySS2POnXeMytoXVgvuzRKxaSqTIO4yM6gI9ACLjQ4TB0XZsCKQlolagfISSzg729XYbjXSa5og0tj7gNmiEcKxZwMakWtY8o6Tg5vsCFsIMMFFmwCAXD8QStpo4rknyAtdLEGGnHDRINRZkjEtg4e46DCwtUvZLhcIQPHmsNxiuMJDKkqIgoklLRRJSKGCI602QCk26L8eggJjbUYRtz6CzKnzpKRLj7+dvk63EtjXRkvS5/4vyXP/ihD3/gM9OulZ8VyB/jSreyshK+47vfdvXiwfJHOmlicCjXpYSlFAmuEq0vQLKtSvpwCTJ1bIeoIjHK8+ZwKqbcdCXJlkYpTVGWBB94tr7I4/58evC9xxEodOqAbfshQ92wTw0IaJSPKUi0jcR2RKMiO/mQy0brGLkMn2m6qNEhJl+oSeSZpx5nQ2p65YDn2g0eqp/jTHeOA1Jyw/6rKbxlguOJnZN8dOdBxrqhJE/nnEs2Pc6lopAUNYeAUakb5YPQjBoG/YKm7dja3KKqKkIXGe+MktGCtkTxaM2UU0ZKEVaSnPRVTAf1bI+t/BOobghRMfeaIQdeNeLsJzf/IsL/QSSsrKwowNf+/CNdOX/rsxcf+emf+dUf+7vT4oi8RPGS6GItLx/TJ06cDG++/TV/b+Gwefv2cMN3rdeQ5LCJXhSnYZgkD6ZprgcxwtR2J8SYNsEBwtTO85JGXSQZpyltEnNWBDU1YFAIRl2ahGtC13LF/GVcUx0luEum2AHlAnt+zGbV8NELDzNqJlxe7ifvUhIUDnZ3t/jaU1/lzPYFsqxHLBSfGD7ObthlUjq+7M6xPl7nbHORT+8+yse2H+K5sA4aTJZj8gyrNdZquq6dylzToV9pjVaSzj1aIxJQSsBaQvSUZR6VUjx36pwMd8cYYwkSk6hK1PS8ppJjilJoBdoaKD0x36S1zzAsH8ZVT6vNza0w2WkOXHP1VZ943/f83GlAVldX4ytv3HdfE9d+/qd++f/6OcCdOHGCl+LZ4yW1gtx9/IT/2TdfUca8/fMXdze7pnZRKeMvMatCjEqBuiTwkeQpMC2QtFePMaZCitO3ZUjJsiqCC4G8ysmLHFd3BIk4UoagU4mQqIiI1VhlENNw/+YjHM4XOaoXsU7ogNp2POd2eNZv8HDc4ImzF7lYD7lpcJhFU2EmgdHeiM0woShzygzuu/gQ58N55vdVdAYker7cnKQZOqqqwCwIpS9wk4agQWUGEyI2r+hcQ920aA1KJaEVIaTsQ0k8L2MFZcH7OrTtWLX1hL2dUcgyq5QIUZI8WE2N6ZRSqdVsUtZhICBthspzfDbE0XHxbCCyExfnyYtF+/eB77l0r/7Nr/3aBrAxpZfEl3JxvCRWkKWlJX3n6mp4+1u++Y6Fw9nfc3GsreprhVZKjLLWKqVFYvCEGJ0PAQkihKQOZFoABCEmtVCKGA7JkQQRggjloMJoQULKJEmrjUoPpbFT/bXFiCJYzzDUnGm3wSQx0lPji9y//QRP2x3G0rI3GbPXTXimuchXRid5YPwMj9ZnaTTslwV2dMeHt77CF7ce58DVi+RzFZnO0Vl6UK3WKAlkRYEuimRcLVD1SpRWZFmGzS2+68hUesi1KKw1zx+6tVYoLRR5FXt5T7V78fzuemvrrrYIHiUqKjDThoY2Oh3SrSHXmjKz6ayiQSxkvQqTFRhlMcYrH7Qf9Kpbrrry8q988Jd+59Gle5f06srqdIj7tsDLAPIS+Rnjn/2z77yinJe/GlSrQ8soL4svjuoardU78x7vCKa71ZbQtBMmdRtUCMFNndWTj25MrunBpWXEa1zs8BIQcr1/37zEEGm6CdEFok+pVkggYhHp0EGSXeZUtdd2jnbUQAeN8xAci4MBVhu29nZpo0OZpOxTSoME8qjptQXbkyFr7S6FFW583dWUvQEqRurYUG83FCajcTWdd5R5ibGGcT2mN+iR2Tx16XTGztZ2UkEqaCc1bdOmtrLWGGvBiO/1S1018599+oHz30VfH+kthPerrHt97UfORVEZubJWISYiojHapFgCnXTsogWxBokRk5u0rYsdBAm5tVJv+ae+9un69Z///Of3BCFpll8ekJfLL/Jd3/v2N1R9+5d9HL5LjLvGm0SJCLFDXVoRYjqwE9JBXZtIcBGlDWWlaTpP4zuY9ne0dkqpQOgyYuhQ6KkFTs1wOGI0muBc8rNVeup+2KXJm1iT9vMhoFTiYWXG4n2gbjyhcUgHUgo333YdRb/EqMBoOMbXgUxndL5j7BuiixgMG1s7aBO44YZrUVphM0vXOsbjCeg0Se8mDVsbW7Rdh7E5eZ6FQTVQfqJvWXnfZ1cBbr/99sXB0d1/rvrdf9cGIRKcNlFybZVWmTAtCms0euoDrERhTBpjYgxWa7QKQHQ9W5ndU+GHf/ZffOQnLjF2ZwXyDfhZl5ePaUim94emzE+AlV9e8ZfeWW9+85vLxSP2m4tedoXz/ptNrrTGEaNE54I043Zda/tgEK6bX+xdN9lrQt63t/cW5VWjeuKwQVurRJzGu9jtjTbsZBiom5rgA67ztK3D+yRhNUYxncsTQ2odR0LawlmTlIBT02Yj04QkH/DjFuU0emB49Zuvp+wXGBXZ3RtjgmCVwQcYti07G9tcPLdO2wWMDhw9eoAbbroBnaVBaN20uBiwxpDptO165ulT1KMWRIXS5ErqwS889sDCX5n/1ovhgXse6ADesfQn/1LVa37EVNygrRBjhxblvdIxSMQaI0orpZUgxGS2qJNYzCqN0gERfFXkql4Pv/Mv/8lH3hXjshI5HmYF8iKcsq/esiord/7hmZ5Ld337Ly8eke8OQaQZR3wrv9iMJj/bNPU/H7v1Wze3hyFqUTpOXd5F4V2avRibVpU4jUn2pNBP5VP3S0yaTQjJKFophXWeUePwYsmN59W33cjc4j5811K7ln6e09Utp8+scfHsNvVwknTpxpBbS/ANB47s4+Zbb6LfL/E+DT0lJv8uk+fsbY9YfehRiBofO79YLmgZ9b/nQ7/4mQ++/q7X23cfecAfP054xztu7RX75n+wNyj+nK3Cm7K+ZGICUSU/MIiE6IlEL1FwQbQyCqtVNEaCqEyKzKpmM6zd/+GvveKBB57eubQtfjk8V+blUiAvEM7I0tKSWltbE+74//jC+9KHsiz15LaJz76s3npwcfG97WSPesRnt9d3f/Q3P/CZjwJm6W+97Ug7LmLhGzGin++G4aFzEaMzYky0kY6I8x0qqKmnbaTzARNc2opEnagm0RNtms8wbohaMRyOWdi3gACZzjh3dp2zp84x3BkTUFg7pajENO/J8j4bF3d48IFHuOmW6zl8+aFEpwmOaTA8Ry4/zPrFTS6evUBhLEHqoIy6C/iVdx95tz9+/IEw1WaMgH8B/Ivv/u/efmO9a9+oVXMsr/RBNPu0lVfoLD9c9K0WA+NuTOdbZ2xuqjzXzoOP3hdVcejy6665/IEHnt5ZXl6Wl/Ls42W5gvzXrDjHjx8Px95x7NX7DlRvHO9tffV3fvP+LwPc/p23Lx66XP92KIe37e7tBi2iVFCJtBjSNosQiWISWzgkq3HnO7zrksVODESfZjIigahStLMNKXjTBaHbqrH9goUjfa659gounrnI2toWo+EINaWvP09Rmb6SM5tcDLVWBB8REzl4eB9Hjx5l0O+hTKKxtM5z9rmzjHdHaGOiqCiF6w/ZnL/+V3/1Y2skmlEA5NixY/q++05cSmn4fXj9699dXXV9c125YG6p5rO/0puTt/cWMnY2293QxQdtZt68cEAZOh0f+8rmn//Az3/0A8eWj5kTL5NziPlvtUAurTgnPnbiYeBhgOVPLRvuIzx45sT37b/G3La13bp5W5noSZEEIdK1LWrKYHM+RSaKj2k7NTVfwAWEdD7wQeh8JEypHCKSSJSiEKOw1tJMWr728BPsbY0xwVAWVZr6q4iOKSskQAqdEZe6S0pjTMoy2V4bs3H+MYxR2MxgTJrx5FlGaS2tFhEVXFVl/dGk/W7g/z62fEydOH4iAPHEiRNOJAmX7rvvmOIOOHTLoXjv0r1BRMYPPMCla/SB7/3B77it31ffubPT/ebK+z/8he9a+tabr7iu/7f279v3N622+wDuAE68TJ6T/2YL5IWr6LFjx/ShQ4fi6sXVuHJ8hR/44XctSbEX8jKXQEb0HhUcbRtQKuCNgijYLlFUQoy0MaJdRMTQSTqTBO8RHVBtwKiILfN0iI8hmYxKyn/HJd5YlpfpwK+S5acoeZ6NzNRRXklI8wqVZhwigsnLqcYlTgM/DZkKmNxiMk0hGlSQLBfUfPl24H0vbHL83kuDACfCpad7GtMjy8vLsrq6KjfffHM8fvz454HPAyzHZXVcjq8Cf+s73vuO9/fmFp5O/88J/7J5OGb18fvnLbfddttlr33X4AkG9aBuYhSUqAjedTRNBwG61hFDhC4mp8GYCJO+S/yotmtxPsW1KR9phi1ehHJukJKYgiN4aHdrslyjM4UPEIOezkyYTrVTTLW26aCvA0jwySrImES/MhqlLDLVrCQqvU66kxjolSU2y4hKYplZCSO1/tyDF6/52MceHP3XHKaXl5cV3KfgjnD8+PGwvIy65ZYlufPOFf9yfShmIE3sV1ZW/Hv/8ju/7cpb5XdamQQflIJ0KB/ujVAqrRyuc8m8wSc1ogsRXKBpPc63dG5M6DwhgArCZHdM7aFamEcbIAb8pKXZa0ErTGFJjrpmyqiV51cHrRKlPRDRIsQuBYzaXKKIEW00VgsqCkEDKuW/i1IpSg0oqh5iNDYzIQvGrz8b3njvz330q3+UriDT6xdeLt2r2RbrP7jBsLICg/nwZ4teSWxcMDrlptW+xWQpazyEqfeQiYQugPaIj4jWeKWCb1sVuglaCcbkEARrFY1vibGD3JBrQ+NaRAW6AErFVBRoogpTL6tpgQjJDUVpgoJoFNE10VotSutglJLMWImplFMOo1FEiVidoUMAXArd0URT5rY/p64Gvrq6uvpH9oJ8MTmRzArkjwGPLN0cARYP5regOzRKUEI3DejJyjw5v/uISCT4gBJNDCppur2LfZ2rUA9pgyMGweZVioG2gm5B4elnOcZovImI8ijvyXSGENES8FM2bgrrhKiZRlKnIuliGzNTipoU47mDZRWNI0QVokZZpTCkFQRzKSNE03QOUVDmWSzLnM3R8A3Ar99889psB/GfgZpdgrTVPC7H46233tpz0h32IRKnuQfO+SmZT6N0xFiPzSSF05gMrA8262LPDGS8Hn9CeTPRWvDOIzqiTdouGSPgU6pubvVUgxFSQA8OUyTefaYUmQiZSkVhsgxtwFAiQqhKK5b9z+08a17TbNm/X8pc7M9ZZbPolFVR5wZlBZtpjNWIUZS9HKVJsWmZRavZi3FWIH8ITK0a41ve8paeCFf6LiIi4r0nepIlD4kPJapA6TxFQhvn+3lf9dU+aTfUT/3Gz3/xh0PIzmW5hRiDMNVj6EheWFBh6m4oWAQdE0nFS0RnEWUUYgQxU/N4nfx1YxSi7ryxRul2X+239Z/67Ge/9PSv/Pyn//nuGfet7M4/c7B3xAwKK7kN3lobMm3IdY4hwypDVhQE0SCGXq84O7vrswL5Q8NaG0XRhZBYwN4n+a5EMFHQCDpmgEF0282VhQ5b/Se2nyu+/d/91Cf/ZpKQmH9fFn2UioGg0EZARWyp0DYF0yijsUZhBZRKFBGrBKMcrQSCFkQlJ0bRkbYjih7pPPZdc3Huf//wr3z6iWPHjpljy8fMB//tifu++qnhmzZPuh9j2N+YLw/oxUGpqkKRZd7bLDhjlMsz64xW3ofgbZGfBli95VCc3fVZgfxnceedSwrg5JnV10Lsee+890Gcd8kWfequLsQocewznB/Ifjs8a375/k8+8y0fuOc3P/rOv/POHCFa3b/P6gwh4F3ATLdXulBkuUIIYIHCgBVyESQGREdMAdlUr5Jyp0G8D1o8ujvwjKF6/W//6u/86NLSkj5x4oQ7cfyEW15eVg88cGL9F37qw//wkS9vv2rtpP+R0bp6wnQLlNminu/tM/vLg+ZA/4BZHAzywoq2WTme3fXZIf0PjbkDZam1U955T9QQNKJSiLuP4rXWptS5bjctZ0+Pf/QX3vfx/xXg2LFjZvLgxAOMtpqmHBiyTIPvEJWjM0U0IErjfEswfaSy6EIjYUo0TLI+dJsGfilIFLxzsd/LlOwt/pNf+tlPPHbXXa+399yz8jyNY9qmlaV7l9TKnSsXP/sR/jfgJ37gr7z32mJOvbo3Zxa6pq7advzNc/vL6NruyvOn6/MANz9y82wFmRXIf0mPF1iBciF3ybm9IQQVUCrE2KncGmV1bkbbvh4Ow4c3np385K/+0sc/GWMUuVskvclRJ07AwNgHYyTozOjYNhHVF6UErQzkhnY8wejEyjVWcLlKk/OoQYFXNQSLJUuuKwrdmxfHJPzo9/25t2/fc8/Hf+XSzOaFx6gpi/mSX/H4/T/zwUeAR17wNT/xB3/tP25n9FmBvEyQjJFBufY1Is652JBnoq1BxbqiuWhO7gy7Xzr3bPuvf+vXPv41SIOxaW7373sLzy0e2GlkB5tbaX0bRSQlSoVIkedsDIdoH6iyjEmW0TroIijvMZmllWScjXhERaq5LOaDTl95qDpqNq54Cj7OzTf/R9/8cSpWkuXlZbmP+9Qdz//THdxyy2pcSvwqeJkN9GYF8seKOwKc0Jm235cbMaOdCuf06u6Izzfj+oOf+tDafRcuPDiC5Au8svIfH4x5FwwkJZ6xiS+ljSLEiCosUUPb1lRZhS4Mse2SX1YMQHKdDzGiTcToQF5ExBqpZXNvsfeaUwB33308Hv9PB1rGKd08/B5p8NLfZqOPWYH8IXH8+PFw8803Zxvr3b8Zd/zGeC//jV/82eoB+L0iWF4+ZuBE+M9xjsaTYdffnzHxUDcTTNsQNSm/3QrGaJq6pl/2MLlFTIOES0xdyKyh9i1apy2YsYJWfYZj7z/xwY9pYCpkmmFWIF9HrK6utqurqz/+ws+9YLUI/zmd9erqksAK6PyWK6/sy2Xkfn1zW7fO4ZuO0WiEuIgINJMJYT559xJBYqSd1GRFBjFip3pwmxl6xXzMyMQ7s7FvXz6ZLQGzAvmG4dixY+aOO2B19VBcWVkJ/zUMVZ2pMGnb2OnIgcsup8xKlAg+evbGI4reHE3TkhUVJQaHxoQU1FP1e8nMTjRa5wQf2d6N0m3uoltzaGHhxgoYzYpkViDfEJw4ccKd+P+p9CmKbKffK9RmHeP6xm40siUiimgEa3MW+/vQ85au7chNRX+wD2qHbxxN6/Ah0DQt4/Hu8+ZvC/sXMV6PvvSZx7tZccwK5CWJlZWVIAL12nB1byeePHTkyNVh8XAI3knbtuw1NcPJkN1mGxFNZjLapqMd1vjGE7zgY6QwltL2KQZQljnKRsbdLltb9eDWW79Jf/WrX50ac82u+axAXlqIH/jAkr7zzpWdH7j6T9w35tm/NJmYkNlClWWPIptn7kAfJRl4IbYdurO4ckLdNtP0K4V0jkDHpAtsbF1ge7QOuo6L1UBiXs8BG3G2jMwK5CUIufPOlXDbba++rBrYb9/YPh1PPrWrF/fldG1gMhLKUlH1+hhV0C9y3DigTMSHjvG4wXXJCXZ7Z5Ph0GHyiM6iDA6UPihfTdyZW4FnEjXm5am/eLFhxsX6I8LU1C7e8Ib5H95/RX7YR+eLKpO5hYK5+RytOly7y3h4gdNnn2R99znObD7BbnOOVtYZNRdY3z7FxK2DaXBxgrWahbk+WqsYjSeorW8CWJvpOGYF8lJbPe6++4R/7WuPLfT61Q9EHaIY9L6D8+jcYsuMKJHBXJ/eoELnFtPLKBYKbKVZPDBg38F5ssxSZcL++YqyLKi7DmOSTWoxyMkr/U0Ad3BiRhGZFchLafVYThHo270jw0k9dmEiEjJ6vYzcKBQKoiLrTfPQgwYRjILgoOhXzB8cUPQMATBFRlkpfB1oGo9RUZkoFFW45eabl7Lj/5hZgcwK5KWD48ePRwSePXnh7P7Li1NN1yJBBVHJBNoFCFowpSUYmT7dEas1vu3IrGXfwoADB3pEAjpT9PoZSgL1pENppZquDkVfXXPLmzdfT0xcsNmVnxXISwcRbvnOiyqr/J/Y2RlibaZC8ETROBeTACrXyaI0pigGYw1N0+C6QF5kLO7vo3QEPL1BTlEKdT0hRiEQgu07WVh03wMw05PPCuQltcUCuPHyq16h7Hh+PG6j0VpC12GiIrSBwhhKq6H14FJ+u84y6g6G446AougX5LkFOvLCMBjkSIj42pPrnvKuo6qabwPh+D9++UQMzArkZY/7FBGJC+qdPrYxdvggisY3RDRd6zCFQhuF6xxOktuuzhTRwtbeCEfA5DlZYVEuYi3oKoXVjOoaZbS4JsSQTW5651947c3EZBU6u/azAnnRd7DgRECIpsd3bw83RSESOo+rGwiRrmsoK0OMHu9C8uUNEaOEwiia4YTgPCYzVHN5MrzWQl5YMg2x64hdJyLiVeXsFVeWt6dvfWx2/2YF8uLG0tKSOn6c8N6/8tZvyea6Vw+bYbDW6HY0QQdLDIHQtZR5kuDiAxqeDxotTEazM6GbOIJEirkKJ5EQk5O7sgpUZNzUxNymnHevDs2u/KxAXiIFkj4evEL/vXwwUuKyKGKouwaT5XgcQaVsPxc7XAw4Ip6IIyC5pW4c9agmxoCpMiTLcN6TGY1oqMqcUNcYhCI3EGXWwZoVyEvhdI66884V//alt1+1eDT7tsl4LyrRCqVpGoeyKbZAFNhS4UMg+oBRaQ4SfUBZRfSBvd0J3geM0RRlhqsblCEFf9qcQmX4nVqVmSEr5E44Zu6++4RnRsuaFciLtz6OKUAuv5bvLxe7Xj3sQpkb8T7Q1J68MNAlq1KdC66L4CP4gGiF945MK4wW9nbGOOcRpch7Oa7rUErIrGbSNJTz82yPJ6ruHOUgvur7f+jwjSLESx20GWYF8uLD3XcEIM4dqP/MpNmhqyOlzekmLToTiiJjsjfCGIUyhtoFHOAlghEcngBkhWUyHlFPOloCdlDhNSgR5rMMV4+xZYk3hr3RyPXmRezgwrel1eO+2T2cFciL8nCuj8vx+J6/+C1vqfbLrRfXt0PQ6GAUbdtSlBavYNw0yXY0BqILBJ+CafLMAJHOO6w1eO+ZDBuUh7Is0VmGD56syggmUrctB3r7GG/WRD2mmqu/DYi3zNwRZwXyYsR0kh0PXh1/yFQ+G+7UQecZbfR4H+j1C2Js6YInLzOUj4iX1L2S5OCuUUj0KBuJROrRGNU6rFJUVUXTdEiuKIqS8XCH+bkBXRP1zmhENsdt7373sQNTWfDsPs4K5EUFOX73CX/TTW8Z9C/T7xzubkc/caqwfXAe5wPlIIM4QdmIKQ1d26aEXECiYJQgUSHBY0sFStGOarqpYKrX79G1Aa1hkBc03RByoSgHsrm164sF2X/ZjfH7SGZxs/s4K5AX0eF8+ZhGiH/yuwZ/ff6gObq9vhskogoNoY2goehbJp0jKEFnhg5HxGGjwmDQCKKg9pAVGVqEdtjhW49zHUVlQYN3ESnBW02YTLj2smsZ7Y3pQs38EfU9QJyehWaYFciL5Gw+ba8Wffn+1q/FvZ1OkseVZ1x78iojt5F21KElI88KCElIrpVGaUs0iqywEBVKB6y1TEaBZtIRvUdbyMucLgQKE5nLSrZHWywu9inVIb25sxFsr37L9//dY7cfl+Nhxu6dFciLDXFSb3TD4ZZINGRlRpCID5HBfI8YWtpJQ88O2N8/ROgSxcRNL3uUiK1yRDTRQ5Ybmg7Gow4ICJ7eoI8TIdORQgy1ckwYcvVlr2R3ay/EstVlT/5BahrMbsisQF4k5w8B3vzmN5ex5/ePJo5SaxZ7PXAKayK9eaHuamrX0I9zzOkDNLFBtAIUVhlMFKwF5yJhkqFsIM8K6glIcISuozco6WU9vAoEPLlSrO9tc8ORK5FJqTdHw9gbhDve8c3vOHTnnSueOBsazgrkG4ylpSWFEC+7vv+W3qJcPdz14fqjr1ELvT5NN8bkgjVC0zW4FvbPXUHA4YNCa5MSp4wQBHJrySJ04xZQKKuYTFqChxjTAX2h6JP7HlocBBiPh6jccXjxStm9MA52oZ07etveOwDuXVma3c9ZgXxjcUmoNLhsvKTLOlrXD1dfdjWda2m7jirLsDHiW4it5aqD1yOmIQgYrUBAjAGt0EajMkXdRXwQREW8F9ouAIIoT9HrE/UckkXqzuOjY23nNK+8+nX4vS50DEN/rvcPjx07ZpaWVmaH9VmBfGPxj5NQSar5+K2T8VgWqoOqX2g6HN4Lg7xEdRE6g/aWQTnAxTHKpMxBpTUms8i0i0WhaH0E0WgdETRN3QEQQkeRFezrHaHSiipo6BoubJ6jUovxiv1X2HpTq8k25y5evFhMTa1n26xZgXxjsLyMihHe8Z63vLZY4Prh7jheve8qZRTEqBFlya2i7RqcC2hTMN8vaVxLrkHrDJUVFDqShYxgA/NVQeaTJDcqj840k9H0xgi0MubI3A0IPXRh6epA59v46LNfDuPTh59df8T8T//q//zEO1dXV4ekzI/ZZH1WIN8opIHc9a8p3lMuAkHaV+67hlHnidFQRSHPCzrnaZpAZeaoqoKma8hNngaEWiPWE1UgeM9NV17PK697Na1riUbIJKMbRaIHpYWR7NAbZFzd+yYECMp0kQk1m+7X/+3Xblv5xQf+6azFOyuQF0X3iuRHpY2S789Mqy7vvTo/NLiWYbuNayM9k2FEh7r1rp7EOJfvD8pqV3djn0tOdCGGcQw6SyKoXFkOzh2OVxy6wXvXRWIMi705l6syjocdIRK7GMJee9G/+VXH/FxmGPTFxvEBaYb9n14bP7N2112vtysrs7PHHxdm1qP/5bhkiRt21sLP2HLuL6w/bTZ/Y+3ztx15zaZ2XSd5nimrtFJilPM1c/0FQURpq1CtDTqzan9ppY2ToNEyX/Yiyqh+tU8XmUK8lvleplzI2ds76/PFTM+VudRqxPp6h95+hfNx7dfPPal/7Ffvve9+QN1zzwPd7Nb8sb4VZ/ivhAb8X/obx973lnccvuuhJx7k8OFFmovzJx/72qkvN0xuj5PB+uXzN/5U2Hf21de/Vt/13DN7W5uPDTZ61+3coLPAjVddw/ZauPD4V+oPFvvW/+xo3Oxk3dyjnYlv23/dznw3KUa2XniysgfXHrn/wi/tntv93c899NBj6Ty0rGYhnLMCeVFiaWlJ33vvSribZfl/vvcjVx29ct8PtW701oXF6tVrZ5vv/zfv+9RvHfuOY4fHzYXui594dOM7b7998cZ36k9t7/jx/b/R/Ok3f0fx01p1N2+vq796cP8VW//3j9/78I//+L3lv/t3H3cPPHBP923fe/M7r7q29/dOPd584KMffPBf/cFGwerqkvzHMhJnmOFFi8XF6+YBlu79vUPzXXfdZV/wIqouff7NVyyVv/fQL6sXFt/ve4MJLMdldezYMTOz+ZnhJbkKLy8fM3FK83hBwKa8oDBEfu8f5NLXLi0t6RcUx/Nfv7yMWrp3SU8LYrbKz/DfzJZVZtvbGWaYYYYZZphhhhlmmGGGGWaYYYYZZphhhhlmmGGGGWaYYYYZZphhhhlmmGGGGWaYYYYZZphhhhlmmGGGGWb448P/C+jE4PBJG1BpAAAAAElFTkSuQmCC'
          alt="bouquet" style={{ width: 90, height: 90, objectFit: 'contain' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize:'var(--fs-h3, 18px)', fontWeight: 600, color: '#7a5208', marginBottom: 6 }}>Offrir un bouquet</div>
          <div style={{ fontSize:'var(--fs-h5, 11px)', color: '#1a1208', lineHeight: 1.65, maxWidth: 320 }}>
            Offrez un élan à un jardin fragile — un geste bienveillant, sans attente de retour.
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize:'var(--fs-h3, 16px)', fontWeight: 600, color: '#5a4010' }}>Ces jardins ont besoin d'un peu d'énergie</div>
        <div style={{ fontSize:'var(--fs-h5, 9px)', color: '#1a1208', flexShrink: 0, marginLeft: 8 }}>{list.length}/20</div>
      </div>
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {!ready
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ height: 62, borderRadius: 12, background: 'var(--surface-1)', border: '1px solid var(--surface-2)', opacity: 1 - i * 0.12 }} />)
          : list.length === 0
            ? <div style={{ textAlign: 'center', padding: 32, color: '#1a1208', fontSize:'var(--fs-h5, 12px)' }}>Toutes les fleurs sont en bonne santé 🌿</div>
            : list.map(fleur => (
                <BouquetCard
                  key={fleur.id}
                  fleur={fleur}
                  userId={userId}
                  senderName={myName}
                  alreadySent={excluded.has(fleur.id)}
                  bouquetMember={bouquetIds?.has(fleur.id)}
                  badge={0}
                  onCoeurSent={handleCoeurSent} isPremium={isPremium} onUpgrade={onUpgrade}
                  intentionMode
                  starFlash={!!starFlashes[fleur.id]}
                />
              ))
        }
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODAL 3 — MON BOUQUET (1 colonne)
// ─────────────────────────────────────────────────────────────────────────────
function ModalBouquet({ userId, myName, onClose, isPremium = false, onUpgrade }) {
  const [bouquet, setBouquet] = useState([])
  const [loading, setLoading] = useState(true)
  const [excluded, setExcluded] = useState(new Set())

  useEffect(() => { if (userId) init() }, [userId])

  async function init() {
    setLoading(true)
    try {
      const [{ data: sent }, { data: recv }] = await Promise.all([
        supabase.from('coeurs').select('receiver_id').eq('sender_id', userId),
        supabase.from('mercis').select('sender_id').eq('receiver_id', userId),
      ])
      const sentIds = new Set((sent ?? []).map(c => c.receiver_id))
      const recvIds = new Set((recv ?? []).map(m => m.sender_id))
      const ids = [...sentIds].filter(id => recvIds.has(id))
      if (!ids.length) { setBouquet([]); setLoading(false); return }
      const today = new Date().toISOString().slice(0,10)
      const [{ data: users }, { data: plants }, { data: sentToday }] = await Promise.all([
        supabase.from('users').select('id, display_name, flower_name, level').in('id', ids),
        supabase.from('plants').select('user_id, health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle, date').in('user_id', ids).order('date', { ascending: false }),
        supabase.from('coeurs').select('receiver_id').eq('sender_id', userId).gte('created_at', today+'T00:00:00'),
      ])
      const plantMap = {}
      ;(plants ?? []).forEach(p => { if (!plantMap[p.user_id]) plantMap[p.user_id] = p })
      setExcluded(new Set((sentToday ?? []).map(c => c.receiver_id)))
      setBouquet((users ?? []).map(u => ({ ...u, plant: plantMap[u.id] ?? {} })).sort((a,b) => vitality(a.plant)-vitality(b.plant)))
    } finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose} maxWidth={400}>
      {/* Intro coeur */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 24px 12px', borderBottom: '1px solid var(--surface-2)' }}>
        <div style={{ fontSize:'var(--fs-emoji-lg, 64px)', lineHeight: 1, filter: 'drop-shadow(0 0 18px rgba(var(--gold-rgb),.5))' }}>🌻</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize:'var(--fs-h3, 18px)', fontWeight: 600, color: '#7a5208', marginBottom: 6 }}>Mes ami(e)s jardinier(e)s</div>
          <div style={{ fontSize:'var(--fs-h5, 11px)', color: '#1a1208', lineHeight: 1.65, maxWidth: 300 }}>
            Offrez une présence bienveillante à vos ami(e)s jardiniers — un lien de confiance, cultivé ensemble.
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize:'var(--fs-h3, 16px)', fontWeight: 600, color: '#5a4010' }}>Mes ami(e)s jardinier(e)s</div>
        <div style={{ fontSize:'var(--fs-h5, 9px)', color: '#1a1208', flexShrink: 0, marginLeft: 8 }}>{bouquet.length} jardinier{bouquet.length !== 1 ? 's' : ''}</div>
      </div>
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: 54, borderRadius: 12, background: 'var(--surface-1)', border: '1px solid var(--surface-2)', opacity: 1 - i * 0.18 }} />)
          : bouquet.length === 0
            ? (
              <div style={{ background: 'rgba(var(--green-rgb),.03)', border: '1px solid rgba(var(--green-rgb),.1)', borderRadius: 14, padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <div style={{ fontSize:'var(--fs-emoji-md, 26px)' }}>🌱</div>
                <div style={{ fontSize:'var(--fs-h5, 11px)', color: '#1a1208', lineHeight: 1.65 }}>Envoyez des 💐 dans le jardin — quand un(e) ami(e) vous remercie, il/elle rejoint vos ami(e)s jardinier(e)s.</div>
              </div>
            )
            : bouquet.map(fleur => (
                <BouquetCard
                  key={fleur.id}
                  fleur={fleur}
                  userId={userId}
                  senderName={myName}
                  alreadySent={excluded.has(fleur.id)}
                  badge={0}
                  onCoeurSent={() => setExcluded(prev => new Set([...prev, fleur.id]))}
                  isPremium={isPremium}
                  onUpgrade={onUpgrade}
                />
              ))
        }
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  SCREEN PRINCIPAL — 3 boutons + messages
// ─────────────────────────────────────────────────────────────────────────────
function ScreenClubJardiniers({ userId, awardLumens, onCoeurSeen, isPremium = false, onUpgrade }) {
  const isMobile = useIsMobile()
  const [myName, setMyName]           = useState('Vous')
  const [toast, setToast]             = useState(null)
  const [particles, setParticles]     = useState([])
  const [bouquetIds, setBouquetIds]   = useState(new Set())
  const [showEgregore, setShowEgregore] = useState(false)
  const [showJardin, setShowJardin]     = useState(false)
  const [showBouquet, setShowBouquet]   = useState(false)
  const [messages, setMessages]         = useState([])
  const [mercisEnvoyes, setMercisEnvoyes] = useState(new Set())

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (!userId) return
    supabase.from('users').select('display_name, flower_name').eq('id', userId).maybeSingle()
      .then(({ data }) => { if (data) setMyName(flowerName(data)) })
    loadMessages()
    loadBouquetIds()
  }, [userId])

  async function loadMessages() {
    const [{ data: coeurs }, { data: mercis }] = await Promise.all([
      supabase.from('coeurs').select('id, sender_id, zone, message_ia, created_at, sender:sender_id(display_name, flower_name)').eq('receiver_id', userId).order('created_at', { ascending: false }).limit(10),
      supabase.from('mercis').select('coeur_id').eq('sender_id', userId),
    ])
    const done = new Set((mercis ?? []).map(m => m.coeur_id))
    setMercisEnvoyes(done)
    setMessages((coeurs ?? []).filter(c => !done.has(c.id)).slice(0, 5))
  }

  async function loadBouquetIds() {
    const [{ data: sent }, { data: recv }] = await Promise.all([
      supabase.from('coeurs').select('receiver_id').eq('sender_id', userId),
      supabase.from('mercis').select('sender_id').eq('receiver_id', userId),
    ])
    const sentIds = new Set((sent ?? []).map(c => c.receiver_id))
    const recvIds = new Set((recv ?? []).map(m => m.sender_id))
    setBouquetIds(new Set([...sentIds].filter(id => recvIds.has(id))))
  }

  async function handleMerci(coeurId, senderId) {
    if (!isPremium) { onUpgrade?.(); return }
    try {
      await supabase.from('mercis').insert({ sender_id: userId, receiver_id: senderId, coeur_id: coeurId })
      logActivity({ userId, action: 'merci' })
      logNetworkActivity(userId, 'merci')
      window.dispatchEvent(new CustomEvent('garden:activity', { detail: { userId } }))
      // Marque le coeur comme vu (interaction effectuée)
      await supabase.from('coeurs').update({ seen: true }).eq('id', coeurId)
      setMercisEnvoyes(prev => new Set([...prev, coeurId]))
      setMessages(prev => prev.filter(c => c.id !== coeurId))
      if (onCoeurSeen) onCoeurSeen()
    } catch(e) { console.error(e) }
  }

  const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const BTN_DATA = [
    {
      emoji: '✦', label: "L'Égrégore", sub: 'Fleur collective du groupe',
      glow: true, onClick: () => setShowEgregore(true),
    },
    {
      emoji: '🌿', label: 'Le Jardin', sub: '20 fleurs à soutenir',
      glow: false, onClick: () => setShowJardin(true),
    },
    {
      emoji: '🌻', label: 'Mes ami(e)s', sub: `${bouquetIds.size} jardinier${bouquetIds.size !== 1 ? 's' : ''}`,
      glow: false, onClick: () => setShowBouquet(true),
    },
  ]

  return (
    <>
      <style>{`
        @keyframes petal-pulse { 0%{transform:scale(.85);opacity:.9} 100%{transform:scale(2.2);opacity:0} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <Toast msg={toast} />

      {showEgregore && <ModalEgregore userId={userId} onClose={() => setShowEgregore(false)} onParticleBurst={ps => setParticles(prev => [...prev, ...ps])} isPremium={isPremium} onUpgrade={onUpgrade} />}
      {showJardin   && <ModalJardin userId={userId} myName={myName} bouquetIds={bouquetIds} onClose={() => { setShowJardin(false); loadMessages() }} onCoeurSent={({ receiverName, zone }) => { showToast(`💐 Élan offert à ${receiverName} !`); awardLumens?.(1, 'coeur_envoye', { zone }); loadMessages() }} isPremium={isPremium} onUpgrade={onUpgrade} />}
      {showBouquet  && <ModalBouquet userId={userId} myName={myName} onClose={() => { setShowBouquet(false); loadMessages() }} isPremium={isPremium} onUpgrade={onUpgrade} />}

      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px 14px' : '36px 40px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Titre */}
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 34 : 50, fontWeight: 300, color: 'var(--gold)', lineHeight: 1.0, letterSpacing: '.02em' }}>
               {isMobile ? (<><span>Club des</span><br /><em style={{ color: 'rgba(var(--green-rgb),.85)' }}>Jardiniers</em></>) : (<><span>Club des </span><em style={{ color: 'rgba(var(--green-rgb),.85)' }}>Jardiniers</em></>)}
            </div>

          </div>

          {/* 3 boutons */}
          <div style={{ display: 'flex', gap: isMobile ? 10 : 14 }}>
            {BTN_DATA.map(b => (
              <div
                key={b.label}
                onClick={b.onClick}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: isMobile ? '16px 8px' : '22px 14px', borderRadius: 18, cursor: 'pointer',
                  background: b.glow ? 'linear-gradient(135deg, rgba(212,146,10,0.16), rgba(150,212,133,0.10))' : 'var(--surface-1)',
                  border: `1px solid ${b.glow ? 'rgba(212,146,10,0.42)' : 'var(--track)'}`,
                  boxShadow: b.glow ? '0 0 22px rgba(212,146,10,0.25), 0 0 50px rgba(150,212,133,0.10)' : 'none',
                  transition: 'all .2s', WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = b.glow ? 'rgba(212,146,10,0.7)' : 'var(--separator)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = b.glow ? 'rgba(212,146,10,0.42)' : 'var(--track)' }}
              >
                <div style={{ fontSize: isMobile ? 28 : 34, lineHeight: 1, color: b.glow ? '#D4920A' : 'inherit', filter: b.glow ? 'drop-shadow(0 0 10px rgba(212,146,10,0.65))' : 'none', textShadow: b.glow ? '0 0 12px rgba(212,146,10,0.8)' : 'none' }}>{b.emoji}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 14 : 17, color: b.glow ? '#D4920A' : '#1a1208', textAlign: 'center', lineHeight: 1.2 }}>{b.label}</div>
                <div style={{ fontSize:'var(--fs-h5, 9px)', color: b.glow ? 'rgba(212,146,10,0.75)' : '#1a1208', textAlign: 'center' }}>{b.sub}</div>
              </div>
            ))}
          </div>

          {/* Texte de bienvenue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '18px 20px', borderRadius: 16, background: 'var(--surface-1)', border: '1px solid var(--surface-2)' }}>
            <p style={{ margin: '0 0 16px', fontSize:'var(--fs-h5, 12px)', color: '#1a1208', lineHeight: 1.75, textAlign: 'center', fontStyle: 'italic' }}>
              Bienvenue dans le Club des Jardiniers. Cet espace vous permet de vous relier aux autres membres, de partager une présence bienveillante et de participer à la dynamique du groupe. Chaque geste, même simple, contribue à faire grandir une atmosphère de soutien et de joie.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                {
                  icon: <FleurSVG zonesData={Object.fromEntries(ZONES.map(z => [z.key, 72]))} pulseKey={null} breathPhase={0.5} size={38} />,
                  color: '#7a5208',
                  title: "L'Égrégore",
                  desc: "Ici se manifeste l'énergie du groupe. Chaque rituel, chaque présence et chaque intention nourrit la fleur collective. Ensemble, les jardiniers participent à faire grandir cette force commune qui relie les membres du groupe.",
                },
                {
                  icon: <img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAACl5ElEQVR42uz9d7Rl913ej78+Ze992j23zb1z7/QmjaRRlyxbkm2N3GRcsfGMDbhAABswNZBQErhzMSYESEgBJ3ZoBpzEMxiMDXbABkm2ccGWm6RR1/Ry6+m7fdrvj33lEMp3/VaCMcjzXmuWltYanZl7tJ/9bs/7eeBSXIpLcSkuxaW4FJfiUlyKS3EpLsWluBSX4lJciktxKS7FpbgUl+JSXIpLcSkuxaW4FJfiUlyKS3EpLsWluBSX4lJciktxKS7FpbgUl+JS/FMKcekr+PuPQ4cOqauuukocBDh4kHvuuYfFxUUHhEvfzqX4uo2FhQUZQvhbXzpCXHoXXcogX+fgWFxc9ADffNddt26dn799fn5ze3p2Ew+cPnHul375Hb8RQrAbQLmUSS7F1xc4AJ511VX7fuPnfvbjX/y994blP/toGHz6UyE8ejw8/ucfDt/zLd/83wERNn7vpbiUQb5u+o3f+73fcz/8um979oufd9sHn3HV/onYWS+k90LF1LzyaKl+48MfuvDbd39s9z333OMuZZF/OqEvfQX/b3H06NEghNBX79v+i3dcftnEcDAweWGiOI6lVJZMNXytoeRsoza69957nyqxLr2Y/onEpXT/V8qkuxcW9N13362PHjqk/v/NwFIID9Q3T7QP5BeXw+jiijb9EaY/wqY5phhIUZTU4+aul7zotu//7u9+1WwI4asNkksAvASQvz9gSClZXFz0dy4u2jvvvNMePnbM/V3TqL8W4b1HjypgdPrJEx/pX7hIubzqi8GQtDegHObYLMUNc8biJLrj9iv+U6spflAIEd785jfro4eOqo3+RRw9elTdfffduvoV9N13360X/i/6FSkFQhDC3Qv/V//9pbhUYn0FGEcOHBDi8GEHcPjwq667Zvfl3xDruHXh3Jk/EUJ8XAjBBlD+zn7hwQcfFIA7tdZ99/rs4NV1b0kR6CgmeIFymtxE1DVo2XMq+Jcfumph8dd/7W3lu/y7vvI5hzf+Hn8LBgWI8H+WdYfUoZllwcHZAIcAuO9d/1be9Ob7rBAhAA1x52IKEI4eUkcePBYOHlyQBw8eD3CIY8eOcfjwMX+pD7qUiv/2Rw6E2Hg4Xv+KVzzzlS9+0S9fsWfPrdunZmirOitFwf/88Pt/9wff9rZvv3thgTv/P5Z8CyAXwb/udf9syxu3bX50n9LNYSJDUm+KZlRH1+okzRan+2f443OfDkZQfOjT79t+3710fn7hV25dWz2f/uKv/tyTP/YjP/Wca6+88ZqJVjs0xsY4ceaEePsv/uTvPPHEE2f+6gh5YQG5uIj/u362P37Pa947P9+49UJn9OH//t77f+09Rx/97N+aaYTAh0v4uASQvw6OEIQQIjzvOTfd8tqXvOpHb7v8wGuu3rlT4D1obX0QyLHxkA5H0ZH/8Ev//hd/+zd/5O6FBX3n4qL9Oxv1Q4fU4WPH3G9853d/9Jbpzc9LbeZko6njuEat0SSp1RnkPT587nMhU0PRWd/2gZtvesWWXfMHbj574TROZGvzc1umx5uzUASc8+gYHnvyy4998cv33/H2d/7wxSNHjoiDB++Rd955r/35n3juqw/eMvMC2ZjY0s1NGff7ZVQ3n/30n5czb3lT+181d01Daxtnnlgzn7j75H/4rXc+8K4f+oFn/+jkjmROJKFz9oT7w9d852+8PwTEsWOH5OHDx9wlKFwqsTh66JASQrhveeUr3/CtL73rt++66SaUgay/5p1WMqmNaV+LcMNOaERN+7rnPf+tyysXf//OxcW/+Ktv8b9RZi1fJQCeGHTeuXNy+vl1Y4XPM0rnKb2lZksiFC0Ri15/goM3vPUVu3dczpmTJ31sNsu5+enp4drQnznT8zbziACNprJzzd2XFdlfvEgI8e4HHjgaXX31YvlrP3XHd7/0OXP/ZW7TOtQdtHdAcxxG6bfeMLeKG636/MyI2lTit89MRi+7q/Uv9szsfeszD9gGkw1ozfOMy0ff9r9+6/CfCXH0hXDMCQH+vYeUuFR2/Y1QX08/7FUzM+reU6f81fv2PPeV19/4ksYoLTprq1oEIUQArEP6QBQnwgz6TF/sRg1df/lKKN7967/zO6PFxUX5tz1A9566NywsLMi3/eqvPvSsfZe9cr6ezJfGeR+QwTmc82A9T3ZymvWXsWvnlc4UnqVz69J4j81M8NZLFcUyqisZ17WMa6isXAvDdOln/+wzf3LhHe84xm/9zPN++nnPiv7t3MRaMJl3xdBiu0ve53hJ3cdRGsxopOwoFTLykrwbaqULc+N5XIx61kFwhfCRsH7feNi3Z0u8Y27flUuf+/zk0uKxj9pLbJiv9yb94EHPvffy+PK5P330iUdMbWw6tvUG5B7iiCTS6DhG1kfISMn+sGefOT038/IDN7xdCPFd4ehRKQ4f/tvbmnvuUYB9sHfhZ7eMNX6vbgVBBCya2AaW/BqDdDeX770Z651aW1ulKAV1HZA+FdaWWK9I6gaRFKimwnTX5LnzD5QhBPGhd7zsPd9wO69FCG99JOOmVgrwZUEYrGFGPZSI8aUl7XWwmaXWrIvghLD5KEitdKPeQkZ98p7Brp/3b3jllm+/y8x++8L36Efu/uSeD3zL9x/7CSFwISAuZZKv5x7kssvi9776G++/fXzzZd1m7FvNMam1RiuJlBIhBDUdUYoQeOQiX15dGfzoJ/7n3s/d9+ia+Eqf/7dPxhaPL4pfGvu2z18fNa8ZELzXStVD4FS/YFh/AfM7r0f4mP76BTZPlVy+NdBuSByGC911sshgagW1ibpfWevKN33nj9/842+eLr//Ww58eaLWL42vRTquC6EaeKEAgyuGFIMRNs1waY4dDJEiICKFrCfEtRpCCGTcAF3HjQqidp1kYsKRNCQ1IRAxv/2+Cx940w+87zUhLDghFv0leHydlVgAB0G/+w/+wLzwigPbdzcmbiuF9UJLqYLEBw/WEQpDaUqc9KLZbLh6ST0Qn37OA1/6y99cWKhdf/AgBw8elPfee2/4a5+t7v3QKXf1gSsv1mvidb7Irc1GsnCpOJdJxNgzULZOOlxF2oe58QrPjmlBTeeM1T2bJ2vMNBLaSYzwnk2tCXHgyv0v27118tXX7UwnyjBUSigRlAfpCQQQErzFFxkhzykGOeCJG4poLKI+OYZuN1DNBkEqhsMeFCXRZBNfr0uCEiHDybIXopq+ciWbesfhw+8ehIBYXLwEkK+7PcjK8eMB4HSR/a/lLP0XDeOlVZIyDiglsFIiA9jM0koVo4mmbG6dCtcPd353COE3v32x2i/8bbF47712o5l//1u+5aW/e83u6dcXvZ4JPXTfFaLtB5Q2MEg/z3OunWK27kj7PXScIKwmUlD3UIubTEUtYbzj9c+9fYv2z2Zt7RSeu2mOXyQKBSFkCAL4iGANoRxSphnOWgKOSECSJAQRQRB4GSEiaI23cCLH9gaINMeqgHVe+NLK/nrj4Zt37R294J3DCHGf/buy5JHFxSC+Tkqwr8e2TATg9ttua/3wNdd/ad9ke5eImyFuaKlUDNKjiDibn2NWj9GOJilU8NJq+efnzn3w/NLqHyfjY3JsQmXf83P/9t3VxwURNpYrAIcOHZLHjh2Tb/3Blx2ZmWn/pB+lrJ/Lw3j0UtGMDU3xOK+643nUpSLvdomTGnGziYg0Smmk0rjgsbbEZXnQWgaTxDKOm6jWRUT7I8T+DGSBPOvgspSQFuR9T5kHdBSIa5LG1DgiqSG1Bp0QhAJjCYVhtLyGcwGXxORuwscTk/I3Prhy/5H/8olrobpfCX9lT7KwsCCPHDny1DiDEII8dviwOHzs6T0i/rqcWzy11/iPb3rD226bmvvXQUYuGlNKqjoxBhUSPstjzNsxtsutGGEIQYTp2d3CasXF4RJ23HD3Qw/8zk/80q9/WwgBIYQXQvDe17xGPUVVEUKEN37by79vavPYL6wsP1yXnX1h/8R2cdu+CfbO7CRu1dBSolDIWoJMYmQUIYUkBE8IgeANtigRShAShVAtQrKEUL9PJM/gfQOf9XDdLll3RJk7CAIVCZpTY6hGjFAKVIRUGhEUIXjKzpB8mFGbnEDXImQzDheG28TZdfOhj3358T868m8+85shLJRHDt4jD7z1reGpTf9NNx3Ye9/DDw4YsQxw9OhRdfjw4aftePjrkmpyD9Um+pE0f/dlOvuXY1Eeed0IWkuhhcN76KscspJxNUFNSkItFt1Rx+tE+O7oHGqy5vddsf0Nz33+zb8shPjC5GRte6eTdw8fOzZYWFiQQoiwsHCHXlz84K+8/OUv/tz83qkPdoozUzoZY6a5XeRpF1vWSGo1dBKjpSASAmcMxjt8CNXAIErQSQOtBcNhjxAypJ7CqDlqmwfEtSmsrGEcqKLEDjN8rpBSIUVJYkHGkqANUmqUUHitUXGMMT1k2iVECboQYlsrhMu2zL7khv17XrKtue3VQiy+EPDcey+33XHbzS975u0/edPVV7wi1lHvsZOn7r/7M5/8z4cPH37fxsvgaTn5+rqdfIeFBSkWF/27vv2ffeBKFb3cRZFtNtraxYbI1fhc9DAXilVeMLqWpNWmPj5Gr8jxDU1t8zhbtm8JoZbwpUfPnBbGdp0Il59ZWut88fNf/sl3vf99797oRcJGueV++Cdf+3AmBvuvDDv8N2y6WnozpCEbCCkJ9Zio2SCp1XG+ar6fKm+kUDgJcb0OzpPmA2StiYo/w/jUCbz0eDvA5l3Kbo/euR7Zeo4SMSqBZFwT1xOINFJJtBTVaKaM6HUGqNgjmk2iKEGpADpy07Vp32/MRz/3noff9cgD9fdfe9XWF95+y60/fPs119JsxOg4IhjHk+fP8z8/9Ke//K///X/80VChhKcbSL5uyYpH7rlHhkD4l9+08kdbxqZfrooCJRQCiaNAOM+KGHEyPcMeu4OBN2y/4SraszMk9YS6iIVF8OIb5nfKSO7EOdBR/dP79v3WyBb3/8zP/MznDx06pI4dO+ZuuummyHhfD0mJcBZfljhbIlSMUBJXeIrgwXuEFAQXCL4qsYSUOAGuKNBRBC5AGmF8QW77KNEk+BIbwFMnro8YATYvUUZgbUlZt8hIoXX1K4SANWCsRcYxkTDgFUUpMcaozA9Ux5rwihtf9OaplzzjzTu3jBERoSLtQunVaNQLHu+318fCW17ysh/2WbZNCPG6hYUFFhcXn1YA+bqlQx+YnQ1CENZmxHNW4ozhcMQwGxAyg7UGmwcKFzgerXJ2tErHjZjetYPGWBsc5GWBx2Fs4dM09aMsDeWobw5cdlnYtWvXz4UQeMHkpDx66JC67777rPbypPQeV+YhZCnBODJXUFiDt45QGspRSpmlmCLHFCWmNJjC4gpHmWb0OmvkZYF167hyDT/s4os1IKB9AJPjjEZqTV4aitRT9gWjbknWKRmt5/SWR3Qv9MkHfWr1QKMtqbcbNKbGaE5P0xyfwqqY1QtdMRVid/WeXW6s0XBS6yCFUoNTKwwfvyhk7tVwaU3XOoPy0O23H/qJN7/hdYuLi35hYeFvvHSPHj2qQghSSkkIQW78HnEpg/wjKSOPHjoqZ66aEfcAi4t3OkAcPnbM3fqqW2enLm+9+uL5DhPnhdJ5hFSKJChiocBalnXKiajHlfE0Nk1pjE/ilUJqRRQrQnBSBggh4AqnIwmE4paZbe19b3nXux4PIcijx47Ju//iPSeM8M9VQQZZWKw0GARShaoh9x4VAsGCEwIXIJIKKTxBCrwIpGmKL3Lq7RrdzDIut9FIWhSDJ7BrF3F5TiAQ1QRTWycZdTKyXorOJUYYvLcgJM474rokaiRIIRFaEWT1yOp6nTEZsWt/m956X5184CHmtkwiUQzWewzPLqO0JOslSALpaCQnk8jPJc27gP9+EHhqfXL00CH1uve9z/1VKr+oDsy8qNjE4h/7uPhpDZCFhSAXF4U/fOz/vLVYWLhDLS7e63dMb3r57Px0Y9V0nH8sU40swsUR0ifIeoSwktyWWBnYOTVD7/xZ/CglaTSIag28cThrEQGEh2BtiGSQ89P1Eytn+6tXXn/lZaIpBqRcfOP3vfyjKpNvmohjURQlucqpeY9TAZQiOAvBo0RVUnkpCSLglMIH8HiQAeFL+qmivv3Z1LbM4IaB7un/Sf/J+1HSs3nfOJNz06ACzdmS4cU+MguAoCyzajIWxThv6KwPGJmS9pyjNdlGKk8wHoo6UZBIkbN+/iJTzQTvLN2zyyhfgXjU6SMTiRCGNEul0skn/vf3izxyJAQhhAN418/87Lftmd/+mkdPPjk3sWn6/JnzZz70Y7/4i78lIN/IJOESQP5BALEgjxw4IjhEOHbsmDh8WDig8fYf+KXbr7zyhk0nz51p/trv/8L/PHBgNgPYcdnWqThRiKlGGGzKWTk7QCQRKolwQRKCwjqLEyC9IF9dwfX6yKhGnDSIWk10rNFCIIXAOicths1bWte+/s0v/uRNyZX7p17xuvVTF87+h3/z/t/90+9/6QvMnvZElK+mIURBhLLE1CTCeXAevEAoDSIQhCCoQHAerwQ2WJy3iKqFZ2LTHrAD1rPTtLfsYrTSZPc2QWN+lqBjPI5IJ0xHCUV/SNxMiOtzDNIRFCNsKvCyTu4cw9WUwgyJajVi30T7afANfFFSDruMuhP4ogRjMEIggoPUY22MMrno5ymfP3321MaEUC4uYhcXBT/+Pd/zopsPHPixO25+1vM2TUzz/Gc8EyfDTb1B/+UzE9M/9Fsf+IOX3/uZzzx+ZOOm5hJAvsrgWFxc9Iv8b37E23/iV++8at/1v76ptX33pvZWZsbXOP7I5+Xhw//pXWEhyB8Mr99pahEqJPS21wi9Ibq7Qj4rET5CC4kJgb4ZYkclOm4j0GgvCHmOsTlOSVwcIYTGyUCEZnt7XF9xoHXl8+Veto3Pb1rZtetnt24d+/FEOSE7JXlZCEVCJh1RadBaIkKA4AgKghQoqXDBg/AEC144TJkTkNhWgWhHpI9doLP2JGFmF1tu+n6WVp8gKaaYoo+UHqMcUW0Vl60zHHqmE8HUREY+aJIZw9ooJ07qEEmCLyk6gZHLcJwmMMbAzBDqO1jpd2ka8N5iZcA7i/QxcWF8WcvVyc7F47/x0EP3vPOd74ze8pa3lNNbx5/3L9/w5re94RXfeNt8exIT8HkxCso5IQsfJlRs3/Sil+xf6qz9nPjMZw6Fo0fl4t9OAr0EkL9PcHzzq998xcuf/5qf3bNz7+bffN87fv/qXc/47hv2PGP3em5s4fDLnZNCxPqiEBKxKPyP/qfvuNNYwSAtZG0qwlzb5In71plfXcZFNexUhA6SbqfPoL9OqylA1ggiRmmJdjECTbCKoBzOWVyAaT1Br+z4T/vPyxerW0LTK3dw667WKbtKdvIcNSPw0oKWSGMhSKQPeB+IQgApCbrKFZ5AEGCEoywN3WLE436FT9z9RdTJEVfvuYbm9AE6/cCHH/0cz735+5kY34XXKUE5fLlK0QiEUcKKO0VLPslar6AQNeL5JmapR778fppzT1AoRewcwgaytEc/DzR2TLI8OMs2JrHB471F2sAIw0rS8T2FvH+08r84frx8y1vewr/4gW//kWdef9UvvWD/TcTeuyIdCpK6FMZQDEb40mLKUrTrTb93buutgJSvfa37x1pq6X/KoPir//6yF33zFd/8su/4s+suu2VLUcA33Pb6Z0815xgMc+9kJkdDoR868Zkn/9t7/v0HAPH9b/2J753fVNs/NCe8l4VUSUK2OaK8JnD2c+cZi7ehiWglMb4p6AyHtPvTmBxMXFAbV/jEUHpDZBIi7wkSBtKiQ0zkInl350ts8i1xXWO/Pt9ZDYGhKGyJKgRIiUMikYAlBBA+oDwErQgB/EZzjggUrqDMUs4X53lULpMuD1CmyV1X3w6ixp999hhn+48wGD5BObuT4BU6GqdWn4TIYGsBY7ayHu4gutyhIk2IFMmmjNH71zijdsA1txMe/11WixXW+2NktOkv38dU3mGyeR2xERTSkJJyoZZzrjkQSiVcXO0c2L9/750v+oZnvvkFz7rhdc+a3x1Mv+dVc0LhNLbXpZpgeQgOIQhm1JfZ+topIPif9lIsinApg/w9xKFDR9XRo4f8xjSEEEIkhDA/+6P/8e37t9+4pbc6KobpUCd5S4pmQwysk4OVPHSGj1Ob6M39wk//lz+4Zt/Nuzzj1x/vfySY+gkhhUbH4zRNTrLdM7b5Fl66/wUcP/swn/n8J0iTgkFqGQw6NHZIdlwzQXNzgQyB7sWS9TMKzFa0blLGIxohYj5s5pH0DB/OPs/09DTSW5GHnNxblAGlFVJobLAIJN4FZARWKrA5LmhEpLFliRWKUkoKr7kQUvoqZ26swSCVuMxxofM4jy3dh28oTq19mR2zd5C0PN5ZlPQEwFsN1iLliCA1OIdzjrgdY+au52I2zVjtRXz8/Kc5Nyhps5lobIm1pVV2tbayjmWqgAt0uNge0WsUlNapKdni+bc++64brrzhrtndDcbqIaS9XNSTMSWdJF1bR5kSW4+QQWDSnDLPubi8LJbPnf4dINzDEQXYSwD5eymlDjsh4Bu/8bV7005HCCEeB7bvnNt9cDTMvMt8nHUzYYYFdszRHeVcfPwJUW+OeNa1r2pMNvd/o/AZnX7wanlMdrISG2ssgriR0JBj3Lr9CqZbazxnImZL6wDHPvQFBm7I/LUJO27VqAaEIkcYy9TMEnknkK1oBLME4ZDOsyOZJJae9WLEp85/ketaW8lDQZEbVClQOqMemhSRI3iDUhIvQGBBBYb1zcjaBKKVEE1spTY2QxIpbnUpB/w5iJd51H2Zftnh4eXj5MrSFBFrg4dY7Zxlm9qO944yqua3PjiCg1BqhAt4DdpLrFK4TdsYPd6jla6xll+kyC2pWyEWCqccadljObvAIIUzjSFpQxIkGOtoRg12z02HbTvngrQyDIenlGl4mmjyfh87GEKkMJlB+UA2TEO5uq6eOHF2eLLXOwZw8MgRxz9Sbr3+pwWORf/W1//zF972jBcvTI3vusWYkTz8wh/588J2Duzacv3UsGcDzonR0FComGxQsnLuHI3mGLO7DqCsY9gdWOqRPNN7Ql5YOUtUE1y2I3DL3iFTImeYj7Ol/Sgz7QztCnbNgOtMM2MH7L29gY0DtvBoa3Aio7QOW1ik72H6GkOgZ/pMy5gpsZlzqsP9xQkmuo6arpOXA1SRoJVCB42UAgt4FJESKANpvIty/Bm4xhyNZg0bJSAUIjim4zab5R5CqLH3ym/EmC5KX6QeRaRDSd7qcH71s2xu7CHYIV7VQEuCD4ggCD5A4QlBEjw4LEl7Ci/bnL94nFgKbtj7Cuba8wQVSIPDZGc5kd3HKMmJ27PUpME4RQiWgOVCZ1Vs3rVPiBNL5IM+q2aF8bEGg7U1tNAVzbkI9PMhZb/v3HpHXcx6f/yr73//2lM6AZfGvP8PscEYdd/9hp9+wzfc8cbf3rNlL0UxgiDZvfnaF/Z6fXorfSJlhfcl/YFB1RKWeys06jXmdm7BxQFfeERN6aWLj2N7v8Vr7yyYbNSYVUNaUYcQgZsYovQE3ihKIdCF57brO0R5RSAMZYLwOc4PUX5I93zKoCsJ5RqqJmjOepTq0VqOmek1OF2u0VPw8GiJecaQ0pI4SVRapFBESiEJlQyP9/RVm2xsPyHZjFYJhZMIZ4gwCOmwIkHpAq1HIBJcmODK2e+hrm7mni//IlaOWBp9gV73edRaTYT0CO0q+4UgCN7j8AQp0S5gsVhZR+gR3fWHefEz/jWXbbuWRojIncOUjqJMOT/4BA+tf4Ch6oKPcMHghWM5XWdqx07GWuN0ug+TB8fqcJnNwxgChBjK3OGygnTYwax1xNJoJE51V38NEA8uL/+j3qj/UwCIePDBGbFnz03jV+y9+u3T7T2srK4aqYQOHrwbemOs9A7RH3QRIpCnDp2myEZgbPM0aT5Ce48PY6wOOywtvY83vmSFpG3Aa4JRZGkgGE2ianiv8NIirIVSoSX4ehNnhngGQA4u0O+kLK1ljO3azMyuNq1NdVRSI/gWojCc+HjKJ++V1LzmlBsSKxjTmtxKyhCQgBNRdVGCRIWAao6jx/eS0SCUligIFAKPwMsEoSWEgAwxMgElQZiUKzbdwtzBf8/nzv8u670vs9x7ghlxHUFlREISaY0XgeADMgSkr7IKTjJKM7IsZfv8s9k9cy1FOcI6gbECWziyQZdo7SouV4qH1TFyUpT3BOnph4z1kDK72iEvUjq6xPZTuplifPMW8qLAFJZ8MMAOOp5hJh8bdM/82mc+86mNMwF3CSD/b6WVWFy80wI95Wq90WBtW1bmKvhISDxaBiVDQCiBKQrKzJGlJTIEtszMYvMSby3DwpIVfU4ufYn9u58gjkucbeK1R0QxSdKkHPYxSKJGjCst0pWEwmJTi6jlOPJqX+EDrrQMOwXb980zs2cXaIW3GX5oIYBUJc+5usWHPz/GmdVljKlxMR8RjdVJlwONIiaTBk9K7EHaAh9PoLZeRz+rMz6nqOuYsnB4a/EuYIocIiDReC/QAXSkUZHGhxETehu3zL+Fj6aLnOo/wpS8klFcECtFXVXPoQ2ghSQKFisC3mtWly5Sq21lx+x1WFcglMR6iUsdg/6QUW+dMnf0ki7EEiE8XjgiAkJJHll+mHaRETvHmu0gs4gyjsjLkqIsKQYpo8EQuh1vnNfrmF9aWloaHTt2TAGXAPJ/Gxt3Bv47Dv/Q7bdc/ZzXz7T37MwGhhBpIUWJKy1pZsCB1gohI7IiJ81SJJrz59dIyz7eGopywCB/DK0CkWnTX7qfVnsKPdasKJuxhkSSjnrUjUVKRcBiixKfFyjvsFpUw3rrydOUVrvJ1GwLM+qDSkDVkcIi7ZC8v0SUZly1ucbJ5YRGvclgtMqFlqKcgdmznqRM8CIQq5QgNTU9RTy9j3Ldcv7Rs+y7eh+N8RpFkVGWHlE6TGlxzhAnCh8U3nl8JIhjjXUjJuQE10y9igdO/gX9WoF2gZHIsBt0d+eqa8G6iEFCOSgYdgq27biMSNdwxkPpsaklHxhGwwGZ91xMvkC3+QVQJRqNVZagYhKZ4NOCc6NztJwidSmla+CkYjBMMaMMOxhh0p4XeameMPm5P0jWfn1hYUEeO3YMQB46dEgAXHXVVeHv0h67BJC/pSmXQvpnXfa8rbde9+KPXrPzubVRmuExeFHirUDqGB9phtmQQW8AIsEExXq3QxQp4vYs05umiCNLcE18ntDvXKBctQw6n8VnF4izJlGrgdQBiUM6R7rWIVYxQVQUdB8sLisBiVIaYwzBBRptTZ51EVGdKFhEMBRlRj5cweQ9suGApquRaMuoHFAmLUyWEdUl0YxmfmkI5BShRvBjUKvRWxkQZIPB6pCTj55jz/4t1W25sggZ0DrGWoc1buPiUOOdJwRQWpIXGVvjZ3NSnWap/xhb6ldiyfCxRyiJ9wIlBEJJlJT0VnrEUZPxsWlc6fHBYcsSl0GWj4hbji1zLfzyFvKQkcr7sSHDBofSMU4GHDlLZcbAxrioWnSWaYYrLXY0xI1SXJE6K5PouM8Xv/S7H0m5+yeV2FCr3ADKX30p8o9lafiPFSACjhBYFK9+9be9/+qdB2tpmoayNEEEEZRKFMFXtbjw1GoJwnpWOimd/oDxqQn2XT7H9OwUSQ2EKxH+BGONR0nqS3izStycJIScshjh7Qghq0Wu9oo8LUiLlKQeoxOJ0gIZBK5wDPMR1lnGxsbwxiFlifAOkw0pRgMKk6LqDaLGFHFzkhe3Yg5c51g+s8qfPeR46Dxc0IZoSx0TZcyubWbLzE00Z/ehx3fhZI1e0SNozcrJZaRzzO3eQjQWEdU8eVrihEfIgPOOECoal/EVeLyTCAzbWzdy5sxF2pN9wGAMiEgTStBKopOYzBV0uwOm56cIwlHmHlcWSKoRbtAlcztrTMxDsulytq0doDPcwcB/kkTG1FEsFylnygFGOTLnIQiElxSDPnmeYfMUitzWolr0cD787C//3vt/7ZcFgTvvtEmS7AH8K+984UzUTJoPPP74SSHESQG8d0PO9RJAvgII/upbIxw5AouL0O+vfvb4k5/cEikpFc25JMyQDkcgHHmekmYZzgmsCwyGJdt2TbNr1xaEdOTlEGcVzdopdu77c2Y2nyGqAaKEcg6XZ5h+H9Pp4XOLtQaEJ6opmpsmaTTr1Yg0BLwx+DSjyHMoHa4sIHVIA84aytwQtZqMz20lGdsMWhOkZCIEttkh7Ix57hUl7/zoBT7ymIF6nb03HWb/5AuYmtqOrCUEGZBWkNmS7tqItfNdOmvrjPKS9vQ4Y60EEYtq8edcNZESVTkokZRZjlQaby3N2iwyrLI+XKZdb+MdSC/J84JES7St0+0MKIMgqTfI+imuEKjYYvHIliVplog4UPQgXe9iuyXjfoopeRARRghb0rAOaxNOiseQTlCSY4sa3cEQO1z3wmSuFtej09acOIv/FgThust23/Idb3rTv6vX4mfK5TVx454rdX3nFh45/aT58Kc++cf/9bf++3cdPnZsNYQF+bXW5/qajtiOHj2qDh06hJTSAfj3vlcdefBBsfg3haLre/bsiV966zc/U8r6G3dO3/gtvqdCf9iVzoKOYnyQqCjh1udcg5AWIROKvE8oulx74wfYuus4gaRiysqAxCJKj09zitUuppNickPUUozNTSMbdULwuOARJiBKQ1kW2FFJuj6gzFN0LaJ0BUHD9MwMY/NbIWkSRAJUtApnSlyRYtKcqHAsZ5J3/kmH7RPfxg07X4+MaqgkIHU1yQKPw2EC5CNLfyXj4vkV+oMBQTiaYy2mpqdpthJQntIYvIVIaVwAHzzeCDywfOFJ8r5lZnoGR0DHCcPhiEYtojU1ydr5Jdrj44zNTFKWA2SIUbHGJgXTczEuPEo2NLhsArxBSQGhQGDx0iBtSVMLenLE/WufYpCeYOQDc4OYbcsOnRm8Tliz4qEVzyt+/oMffPzVL3zh7a9+wfP/5NWvfEnTrfZIT5xn01X7g2w1Q5YN5OMnT/Hx++5b+ssv3Pe2d//Rh3/1qRH/11UGWQD5Nin9X/nBG0AQhw9n8BVpfgGEsBCkWJTZiZMnsv/85Nv/9K1v+OHn13RD5Nq4qU2bZBLXieMY56u6OooFxoCnoCw9kfoomyYfJBQFXhmk2tgsi0BQDpGAbMXIrESVlqRZxxGwZYGk2k2Isrr4s9bjQ0BphTeQZTmqqRmbapO02ljrgAxkjgwBvCeYEp/nhNySjQL10Ofg/mmWLuxkda1ASketKYgbETpKSHyMDyU+eHSImNwUESUxw0FKUeSsr3Y5+fgpkkbM2GSLeqMBHoyzBKkoTUkwILUmUnV62RpZUSCkwvmSsjDIOMKNRhSmRNViRqMcZ3OSWsDYktZ0wmB4krI/xORtZAxJEgMGpRVKamCMms5puTVik7A7bON+9zjOCVbLYRBWO2c4NXL+V399efXX1//yL/tA69brr/nVFz/v2U0hrBk9cTZqbt8aTKMmpDFCO8lVU3Puqpe9bPONV17+K1PTM3sOHz78I0ePHlJfKwX6f3CALCwsyMWf+RmP9/z8kZ9+0203XH+ozNLrsrUea2eW/vL4ysUP/MKvv+vdQohKB2BReFiQ3h0JBw4cmLxs203fM5vMkial8l7RaDRQSpBlDmPzDUKcwJag0DRaI6TsI0IbIUqk9wjr8M7ijCMUAdfLKXojpADrDC71KBkhRFVeOeegdHgTKJ3B4rAerPO0GnWSJCIEQ7A5QlgICueraZc3JdZYrPEUHlwBc9Ekp9LAif45Yp2goxZxXeHVgKIYkZU51jkUEUksaTXHaNbGESJmZm4K7yFLc7JuRjkwSCEIzqPiGC0lrgATOTwKg2CU5jQaDZwzmKKkVq+RdofEKsJ4R54PiYTEOks0nlGmS6SjQFFsJw4J7Vig8UTKogWI4PFOIMucuu+TFIF52+BxMU/fnXAmStR9Qnzv+x985Hc4dSoPIUghhPjJ7/6u//S65995XVzmdnBuEEUT4yRTE8KXOcIHpFQQxyofDf2z9l3pG1Htn/ez/Pzhw0f/3f+Xuv7TBiBPjW33bd267ciP/uhvvPIld72wNd4iDAeIvmFt8/K2Z62nrz4wtfPQm37xXx0OIeRHjhwRx48fF0IIf/jlb7pyrLmtGcXS+66UITikFgQhcNKR5ZbuuiVuekZ9i3YJAzfL2tkhzbqh8AaVB3woka6SGfWmwA8teWpIJmvINEdaDTLgBJUqofcEGwilJbgCm5XYtEQIjytLnIkRuUF5jzCKIEQ1fnUQrMMZhykkZSHxxrG+vom1tRZEI1IfsG7AafOXdPMHsaGDiAU6SlBEqGKatrySq7ZfwbZtW5kYn0ArDV5WC7g0p0xL8n7GMC8YeYMSCpsGnIKgJGmeEUcJ1nqK0lFPDVmZ0xhvkfX7eBmwXiCSnCBO4YsEm+9F2TGazRpKgPQOISsCtXUel/XRw2WUHKE9tPLAnN0cLorHpDUy7Z9pfYhTp/IfPnSoLoTIvu1Vr1x87Uvv+vbZVs2k/TTSpaQxNY1wjuAc3jhMCEgJJi9kJ8vF5bv3uduuu+7nf+9P/vD3f2Zx8QRs1KBPR4Bs0NPDK1/wgmte/4pX/umrX/bSOYlzo84arixlZCEzma/r4F77oue9tIz+1buFEIelEOGnnvvTGqDVaNaUrIvCEIoyQzjtNZH31glRBpXlKRcuGGanWxhnWe6uYukwWfc00wEyypkch8aYJmrU0TWJM5LC5ISRxWaOUnqE8aBASg8evAt466F0lGVB1sswPYOQkqEoyHKHjhVKC4IEISQegaAq54KDyHpqpaMk4tzSJvo2oILFlat0i4c4Jz6OjPqoEFEfj2m0BcHn5OtLRMkMB665kqlN0xQiAwveg7cJjXYNbzzknmFacnFtnX5ngHfV3zuKNEWaURYlRWEojaE/HEEkKb3D5gYvNJlZYXzyIYydxg6vQLuYRqyqbBECWkYoIoS3UAZCUce6zaShIHZLRIVn1jV8Utuklk3vU3d/+o/PHVo4FP/7I0fzs3fd9cJvvetFP7Wn3TLrKytaqzq1ehMAUxZgXJVlvUFKQZkNMUoJaU140a236Te98tDB//Tbv3via5FF/sFUTY4cOYIQIhx60V2/9poXvXjOF7kpikIFhNJBCuGdqE0mamx7My7VyL7qtme/5jd/4ic/MDM72zx4sPqMte5SWbqhGA1y8jSnCIVMxmJdayTKm8BwOKTfH9A5N6S33Gdl7QSld2SZwoaUzTsm2HzFDFP7tjC2bRPJpgbReIt4somTnqyXUYwc2dCS9VPyfkY6qP5ZdEcMOyMGyxmm7whW4LzDeYN3JQSLxBIJj5IBgccWJavrOQ+czfiLk5ZPng3c+3idxy5upcg75MOC1HZZFQ8TZB9vJVFN0GorRDwkyBVqrfOs55/g7OqTICVSOMBjjcEUBuscBkeBIQjLWKvB1NQUUgjKIicSCoVklOekRYEpDEVRoJQkG2WUhac7uIBuPobN22SrexAjTewjnA/VVWNQFJlnfbnD+RMXOH/6SS50VrnIdlZr17HOHCEfMp25MFOMY104FoAf2/KCIIQIL7nl5p9+9rYtovvkSUnhhfYK56rSzvQHmF4PM+jh0xE+yxmNhqAEIS/EuIzDFbv3vmHjGXp6llgLCwtaSmn/5Xe+5bteeMPNt7h0ZHyiIoJHGwfW470jqSe4siTPcp0IYV51/TNf5l/n3nXn4uK3hoUgd92z67NXnz3+xRl52fVlKHy/PH3y7P2f/vR4a2anL8TtWUnI00j0xHkK2UG3JKEQDPqBAzc0mNo1hY+gQKBCwAeFUDEqKogTxdpajgugYokUARckhoAoPTJ35KVBOAHB4ZWhtXWKTds3EdU1Qii8DATh8cZgTU6eeRrSUjclD65InuxI+mnB5CiiHhxlGGFFSpZ0wVqEVAQxICsEwRoEgVotAlZ58vQj7Jy9Gt30WKPwVpFnhmKYURSGwhqsd3gHBEl7rEWRpZTGoGVEZizGWoQNRDWFcwERPGmaYWROM9+OyzaRRBOImsL4UJWWOYz6A/IiI1iLBKI4IaonGOFYNk3GGjdSygGRWVK1NCpWVjv3CuDmt7zF/MQb33jtMyc3PXP4+GlvYq1kTVVLTjMAAaEwuLKsVOqFQEUxKq5jHXTPXRTj9ZavKX0l0ATSpx1AFhYW9KEDB+RiCOL6K/e/ZbbZCkVRSGSMNSXCegSW4D2+NJhRji8tfWxUs5hrt2/7lp88fPj35aJ8XyDkT7Yefdf4/Mw7unnXfuzR9778E3/5ieMAP/7DP/UDs3u3/4fTD+fOtkqVq9PENc1IaJL2JJOTBSYH4SVSWQICFdXwwhLKjPp0k2RQMlrPSKSuDo0EOC8RLiCNQzpweEplqE8mjG2eJG6Po+oJKoqRsqJ2ByzBFNStoZ2nbJrJmJgS/OGnu5zqZkTFQyT5LXSiJYrkHKXoMzmR8MbDh0nzizz0+MOMipzClAgJoeGZnuhRnz2JThTraz0uLPUw6SSxaOMyyEeOwlhKl+OtQfg6UmlM4fBeYMqSsrTUohihBM6UFMbihSBRWwiZRiYJeE/pHFJIMAZXlNUAQEl0klQMhSghUglSe2zwDEwdM35TSMzHhAxl9+EJecZvaBNfOTX9g1vjJFovS+tlLIusoPRFJfzgAt5YvPXVXseCU5q4Xsc0i1BT0q/0uvrM6XN/CGTHDh+T/9Dcra8qQDaacrsIvOgZz3rxNbt231R442ykFM4ilEQrgelnZIMBobS40uCLkmAtqfVys9bhionZnwiE9wNu3Z78WC6vYnJTM94ZdvIDP/pxdegQ/tixX/3Yjul5UZjjYjlbx7o+pUyZbKbsmLOkZYEUFb1CBYGQEr8xUpZRgooi4jgh9QVl6fC+BOdRxBvrIoeILUSauNUgHks2ypwSGcV4XdE9EIIgFUQ1lNIIrUEJ9kSBl968jYc/fIHV5IsEW6cXnyNvnsXKIUG32Tw5zqZNO7h819WouIaKJMEGcIF2K6HVWAOp2Ooc29YND375Pr70xfMMOmPYrIk2DaRpgG8gGKBkiRAaGxymKCAEdFzDeIMrLc4LdL2OUtUJsBcBh8TmFmcL8BalKu91JHhbqT66ckQqJUpHlS97EHRpC13f7K34+MyL49o1R44c/NzO68Zbm5Lort5gRDdSUg6HqI1VsLAVQIL3WOPRxlNqkBaGzoU4in13vKE/dvaxH1/4tf/6CxvM3/B0yiBCCBG+743f/vq56fb2my674nv3bdocSm9kpCOcsYjgyftDRmsdvLXgPN46KAy5KzHOq2RQ+B3tqRt/+JvfeNMv/4/f/ss/+ZMPHt/+TTvfvqWxbXuapquHDwsfQuDf/tvfPPHLb/8X577xVddvuf+h46HV2itOrJxgbPgRJkJBmtZJQokXGrRE6QBUHKu02yFbG1CkI5rTCXEzoihSzMgQSgje02g3iTZF1Go18lGOUgrvHKN+H2cdzbExZEthqfYfwlVCbdZanDFkw5wd7XFu2TrB+890Mc0/wwWJkDkOTVk40rSDteM0auPU4xhrS5SS1JqVjE9ROqRUKDXGzHSLW59dZ24e7v3E/Zxf9QwuxNTNPrZvuR0pDGU2JBsF0rxHURRorSiLDGsU0guUjpFBoGV1Ge+NJctygvUIUQ0pPB5VE6gY6jqhLiVSeIy0eJuCBIEkKwpc0cBOtaRfeyRZXHzcvvFFz7u8VVdbu/2+L+NEEjzCBUQIKFPx3FwIFV0GRVGdjgXlg79QKvWFE0+89Sf/x397x8aY+GuyUddfpcwhhRD+bT/0Qz//mufd+WPbZ2bAWPL1dayGvDcklhJvDKPVdcKGJq13VWMbjKO0JVhLlqdhUz2S+8fG3gL85d0LC+rOxcV//X/8gceOqfvuu6/34AMn/vUrX7L7N59x3XXOGat2bt3OycdXyAafoyVLbLUixGlJkWeY4RCbpXjjcR6m9kzTnGpBJDCmxKQFeS8jOBibHkfV6kgRiNIMk3uiWKG1xhQ5axuCcq2pcYIOOGcJ3lQjXuNxAXRRsG0iQZ8tsXKEcwnKxTgRyEPB+qjDNrkTUxqK0lYXe5FnUD41T1EoNULrIVHUQKka+/ZeyZa57Zw4fYaTj3axq3PYbiCOJ2B8HGcd7V6Lx594hLJIsSZDqxqNpEGkFVpGOBswZYZzBiEFWqjKwi0RTEyN0WzXUIlEKoUKAomo+h1bMOh1iaWnWY8ZlEoi5sKWHTf8zlt+4opfm19v3hSNCtZLA2UN6QLSVeQx4RwBAVFFyQnSERkbrC38CkJ9brD61rf9j//xjne++c2REOJrdq+uvwo9hxRC+P3792+56corfnTHWN0Nz5zzhbFaWCdQCh1HZNaRDYfgKtnNpy7qSmdxZYkoDCIvsc5JrGE80i8Z37lz4uDiYu/QoUPq0KFDPOVLIQ4f9hugfM+e3b/7Y9ddsWt/6kt35sKqOmXmcOUMe0cXGMOTDYcMsxEUJTXpiKUiBM3k1mnGNk9BXeO9QxtLPfHEbkgIjqTVQugm3hmSuia4HOctWiuSOCIdjBgurzFcWqM+PYVOPMLlFA5y6ylSTSg21BHJUWULIQJIg1COwhuWVnuoKxQi8UgpGKUDbJrjbcA7A1isqAQf4iiiXp8iro8Tj7W4/PJdtCd6nDw+Yu3BdfBTBJVDHDGzeQYVKS6cP4uQDq1i4qSO1jFCSJABiPC+sqHTSlNr1Bgbr1NvJcSRIoo1QQoEAuEFKkBwFiVrDHp9lG5QG0vpiCmhp09un5nOF+OG5LETT9J0E7IhLVqCCg5twStdHX9ZKLRAOOvtKA9Z6dXDJnvr236vAsdb3vUu87QkKyYhJCIEmVvPyBopbRDeWDSCsjsg6/fRUhElMU5IgnUEa3HOYbwFWymgO+dFRPBTtfrc4euvv0qcOvXJQ8Bf4+eEI0eOKMB84UsP/fz1+3b/VmEKTq6dxErH/YM6Dz0Cl0cjZlp9kragVdcE7VjuKuZ3CZrTdXQcY4VCBFA4nFCARseAVKAVUolKgYQcgaY0Fh1LGo06QxcYrA5YfWyJOElo1RXOVdOjsozRskGnU1I4TS0ucURIqfGhZHyswU033EytPo4XJf3uGv21izTqYzRq4+hIEzAYVzW03hcM03Uo+tRrLZr1cbZt30G9tswTqsvqo+uoMEnQHpBsmt2MlBpncjZvmUbXErRW1LXAK4EXVZayxlEUBQiI4qhiDPuAMwoU6FCNsAOAUKhai5qXlKMBRDFIQWc199mo4+3wolxVjbAntaJtI9nQMUlIKmBKtyFAB6JwzhaFOmcMj4yy7/s3H/7AO95509ceHF8VgCwuLj71Nj//2fvv/+wNe/feEsexz4qB0IDNUrKVLt4YjJS4Rh0Rb7DX7VNnrhu1u7M4H0AQGkmNmfHWZoBDwLG/+ee6EIJ4zs6dH9h/zZ5V1WJT7lZDJFKhW3V69QaDkLKzrojjKr0/8rhEjcVcMT9GUAqromoBFyRBCKwryFxBvRYDEhk8QgS8BINHBJAebFEgZIxoxMRTNUIoeOScYy2VbG00aNqA1poz1nL/SmWz4AOUsrr2CyPLq171jezZsotOd0Ct1aQz7BDX62zatJsoqmNdjnMl2lVicloHEIosz8izDtb2GGvMMTu3i7i1yhfK4wxPXE5TzWJFhJCW6dlxLpwrGQ5zputNtBLImqgWnFSCDnES0WrXKAtDt9sDqalFEZKAEAItKqt4Dzjn8c6jtWRkNNbXIS7Is0QO15G2DD6ETNnGEvPdmp/ut8NkrKTURngbaLrI47zPgtWnRtnSY8F/+698+I8+HA4dUuLY1x4cX70MIkQQQhR/9LGPf9Pe+a1/dteN112Gs16VTvZ7g4rE5zwmL8jzDKkUUmu8FATnsMbgjSFYhyFggw01lyBG9krgDx686qq/jYUclFJ47ztvfPKxlV1b25u2YwOFFagGfupqNpcpsVjBlec5tVrywGOSb3rtBCq0sUERihLhBXiDD468ZyiyQK0h8dYhMAQR8N6BCJTGEgUQOEoZ0FSGN0lb0zQRH/hiRud8SQuJkJJuaVhDInWC8pJYCoo04/rLrubgLc9h6eJ5vBA0GuMkOmKqNYXD0Oku470HFFp5SpvhAzR0m2a9QaRbDLI+3f4yJggmJuZ51osi7rv3MVYeKRhvbcEHQRTXGJ9us7J8jvGJMaRWOBkT6aqvCEHgfSBgSRJFs9UkTQ3OO9AepSKQAi01SuiqJC4teWZxDvJUI/VmyB8i7xVBiZpMhfps6spWv22unKmVbM8c891JZ0QpUmGkJZbH3fAjn8jPfvuf//mXzh09dEiJf0S+h18VgAgI4b3vVeLw4bNnnnvwtJI3XF6r13y/v4awjiAFTlSWASY3iBDwQuCUwAWPgoqfs0E3D84jbM5Yu6YADgJ/TUVJHD10VB4+dli+483f8asvaW29TA20L+WENOWQ9MIyWjaoRW2c8xi/Qto9yf6rzrGp3SWYEVY2keUQaQTe5HjrOXd6hFaCZruGxBC8B1Hdf3jvyfIUogghAx5LIFBIDT5nc9OzdVxzqh9Y82DLUAFDeWJrCcQ4ApHUvOYlrwLr6Q07NGo1tFA0ajXiaIy0zEF4arU6+BgtJIKEQbrGsLhImcckjXHa9RmGJmUwuIAInompbdz6on38Ue9jPPnoHLu3HMT7QHOszpkzKevrF9mybQcVaVr8H9cPguq7j2KNzB2jzIEQSGmIlEQri1IlUiq8DwipaU82oeMoB3souh/1lJHUTL/t937vT38abope+Or8xf1EfufKeO/mqZrYsjmtY/v23IUi/eVf+fCH/x1Udgn/2ExBvyoAOXr0qBKHD7sf+Gdv+qZX3nnHC4LxPk9zZbK8upHwDi8qac0gILcWZy0KAZHCAWWolAGFcZRO0Nk0JNtUCoB7/toicoPGYv/Nt7/u7a89cO13OSN9KqWsJwm1ItBbMYzvaCKbDTSamquxq1kyNtUjTTs4ciglJgiCdVibwlBx8lzBzq2aonREzmK9RMhA2Cj9ht2UEMVE7RgTAt6D9iPKQhJcYEpZQpCooJBSVGeziEo1UXtG5YhveMFdXLXvStaWlqubcWuRKkLXWjilMRiErg62RsNlTNFF6hpJvQ1WUZY5xneoJY5WezNCa9K0y9rqRaan5njOi67mN8/+Lg+d7XPVzpeCF1jZ58zKiM1bt6ONxW3shKhcEvDGYZE4W2KLnDQzyFDdnBgkQla7ESlltQcRgQC0mwJR7HVTyTVqZe30Oz/44T/96TvuQN97733mI7/PB4EPPvtbXjo5Xs9vekib7off/9HPPQWMQ8eOefGP0DH3q8HFEocOHfJAfPCmW35+95Z5MpOTrqwj0wIT2NhQO5wIBCWq5R0C4xxpWbkumbwgH6XkZUovHtJpl6y6bOMLvOepPQuLi4tWCGGv2775wG3ze36gGGU2GxZC2QDGsnbxAkIIorEJvIzAl6wun6amJXW3EzsI5EOB6ReYbkG/PyDtDbm4MuJMNxCIKPOUrCjIU0sxMuRpSVkUFMPAyvmUMCxxmcGkjuFQkI0kIrW4UmC8AB+qLOMF3kusqJTXp6enePFzXkiZZSAg1ooi72LLkmYyi5RgQxdjU3xwDEcriEhiZcnF9ZNEtQat9mzFsLUZebqKxDMxPkfwgQsXTzLWmuK13/pKXPvTPLb0J7S3H2du9wrra11GowyBqO5cnMfZijRYlJ5RWlBkgdW1ZS6ef5SLZ8+wtt4nGEMUqqmrs5VuVlkGylJhXB6k8HLb5C3DrXOX/dTCAvLgvQt+YWFB/sfv//4khCA+8d//uPPl337gwvZs+nU/+b3f+wM377ni6sPHjrl77r5b/XW95adlBllYWFBCCPtDb3jDa5+xd98+l2e26A90tryONp5CUs1ANsa7YcNgXKhK/claUzFRradwlqEchUEjqPURg8eeOPvbAcTBe6ryTAjBO773n3/Pnq1bDi9fPHHtvJP1fJAFlWihnSBb69C/eJHa2Dh5YYmiiLUL5ynTIWMT44TBGEFuxdg1CplTGIsrU3SmeeRC4P51zdUGGsaAU8BGk24NZVEyMIozvTqZdMyNCwrnyLxAlRlWJSwNK92pKJIEKTHeI7wE5SmKnJe+6MXsbG+l7I+QkSAYsHlKv7/EppldlNYTvKLIDRMTE2zfcj1FYYgaCiFP0+ktMTezkzgaw/shpugT3CROQmtsjMHQsLJ6gZnJnbz8G1/BA196GNUUXHPTON21Nc6df5ypieuxbsN5ym6sG3xFRcEkZC6lnzzETLtN7+IpRp15mq0ZmpMxSVyDqn0nOIXAi7LMXD2aaE41DrwMrvqdA0cPycOHry6B4gf/838ee8u3HvqBV3zDCxeefeDGqCYTbr3uuotvfftP3X7nnXc+CVAdyAn/tAXIkSNH/OLiIlfv2/fmuWbLX7x4WnRPniXr9nGlBQdBCUSkQFQDQxs2hP5DQPiAMYbCOkYuZ6meQSMOE9G4nKrPtwUE+bGPWyGE+jff9p2//+orrn1FqxUzGhtn/fRpYqGFCx5rLZ0LS5TDlMb4NNJ7is46w9VVpmcmkEEgjcL1L6dUn8UoS1EA+Rgnhg0+dGHImTRwbm3E5pam9A5BtbwsjMEXgtN2nPvcZk4vd7lxNKCVCETw1KTkSRPzSMfiJeTOgJdVlxIcdR1T9zG7JncSlwqHBOcINiCJ6HTOMb1pK5FqEUcthuECedlhbuIahqMOhR2xdeZq8myAs4KxsSkG/RFlWSCFJ0liRmmPVqvN2soSg94FNs/OUrs54eLpi/gw4obb4MFPLTMYjjZYBZW5p/ehooM4gyklIQp01TnqEyfZMzHPyvkuZ9bOIFbrjLUmSaIx2u0aUTyG9ALn0hDVhGiPz75iYfF7fxMWue2mm/a+5qUv+N6rd+559U37r9o1NT0NprD4MrzsObfP1Y/8/Mc//tn7fvnuL33hL8Si+NRTHvNP3ykWQFbYYnlV9p48WXTW1/FpKV1mhLEOvENqidQRSkqskJR4cleAsxS5Yd0NWI1zynpDtGMd2jNx89pr5t/zhdM3vOSRT34h/ZUf+pH//Oorr32F7A1MxwhZdPpSooQLVf1fjoZkq2t4GVBKo41neW2JejMm1o1qyVWrI6NJTFZQ8CWMtQxWJ/hk4VmLA8pZvngeLp/3JGFA4QDrkKXhQjrB59c057MRF63iVNpgLgnM+JKBqPG5vqUTEm4Z38518/tpTE0wPt7mIw98ks9euJ9SgS9LrKocpKKgMFKia3Xy4Rq9fp+JiXnG6rOk6TL9bBmlTjLWmq2o9i5Qa04SvKXIOkhimq0WOm58pS8oixIda7q9JXSUMDWxie5an6xvaDQbbL98yGi1S921EcFUVm8+UOJxQeKMoyYbNKKYs8U6ohaQmx1+HM49cJrmYCfTtTvwdoaxtiTWAuMLVZiAquUvffMbX/mzz7zuWc+4anbrwZuuOBBHkcab0uW9nhSJ0hAIqQnPvvzyLVdNbvrFF9xwI79/5WW/JIT4Fwt33KEX773X8TWW/1F/3x944Phxeez48bB1evaxPCu+NUbXRFlKNxwJO8psXuaUwYnCGLI8r1irZUZRpORlhjGGHhnnGkMGUxG59IRQirqqh7smrpq7Y+by7zx8xx3f9w179j9L9QYuw2mBlMVgIHBhw4ci4LKc/tIycbNOfWKSssgZDnqMj40DmqjWQDUSZNRCys2EfIaVC/Bpk3Ey8QRRNUsX8hrYkhntyItAt4h4dDXiE6t1Jscv54bxPWyOpzlfZDzYzXgg1DmZCtLCc92mK/mXz/0uDl51G3vn9nDlxB5uv/wWVoddRJbx/L3Xs6Uxh8oCsdVIJ5DaUZoeK4Mu4+05anqi2nDb6lirKIqNBtnhvd04r9OMtSdotjYRUBTZgCJP8c4ghaU/XCXSLSYn5glOkWcp1nikcpisic2bldaW9ThXqcC74LCmBG249rYW5zuP0aEglwGhDcPBWWx8msbskJ1br0LLccrSgPeiKIfMX1mqb7rj5uc+Z9/Ve7e1J1U5GjmTpwS8kpEUQqnqsCwvxfmTp0KeDd1l7alw7e79z7aNJPqlD3zgo0ePHo2PHTvmn1YZ5PCxYy6AEH/4vk/ed9VVN73gplsOblHqZeOeOybr9YbIAnk6qhyVnKcUgaZQxFphWjEXbcmnzpxkNC2YSOaZbDdBBvYU02JTV/ltzfFxG2vSzqoTQSkP6CxHGIdxbuN9I3BZ1YDGcQNrSorRiEaUQFDoKEYnbdACtMO5wIWlLqfXRpyZL5FKEJcaE1VOUJ86G3P/apN6ZOnbnH3tK/m+Ow9xxZa9qLiB8YHu6hJ/9LkP8LsP3Q1xHYfjxu1XsGVyjoFJkUowVA6tFf/81tey3FlnOpmmfl4RZIIVgToxA1lDCM0Tg8d58sQn2b/3dtqtLSgiStslBEs66ldkQiGRSiCkYJABoyH4ysMwBE8cRRTG4Z0ijmpVD6U8zXYb2+ki1JCotkram8daU5n4CIFwYKXDek+a5lw2u42Zyefx3nv/lFKVxEogGhOkgw6MPcntLy+RQ8F9H1csnyoATztKmBd1a86ui1xIGcdKRXEFiiAFQmiE86yfOU+23hFxHOsz2fmwbXzW3bX/6h/7Ffi1w4cPn/wrQnJPjwzCxo4ihCDe/H3ft/LxL3/xsx/64hfe09o7/weZFI8Pfdg1OT+9SSWR9/VY0K6xHMMpLPetLvG+z3+Wzz5xihNPLPHoF09y4ewK1+3exR1Tl6NCIkaRCUW/IHiksFQqHrbE5SXGWkIISB/IsiFlVhDX6hW3y1h0FJHUm8T1JkprlBSU3vPQow/w6PIjPDYd0JvG2Ltzjk3tOt21DiUWIRqUImLgBTtmdvH9d76ZyzbtwXhH6TzWOdr1JjfuuYE4DfzlmYfxjSZ3br2BfeObKYsRiYpAx6gyoLxEqwjlJSrWBFGd5goPzVxTZgkmCQxGXQrTZ3rTZurxBN57vCso8wznPKFaZ1f6WK4SpJZC4BVIpRFKkReOifHNNBsTrK5dpNtbYnximjL3mLKHySJG6/MYU1STLBfAWkpv8EFSlpbZ7SVX7t5E6S2PnHucWl1jyoxRt8/e7ft51tW30KjnzO4Q9HpDusuW6+dhphhK38+ksFYID1polI4ROkEIhSodFx57AvISjQQpRFmm7JrbIm+54cYXb9u6rfbiV7/qvoWFhXDvvfc+vXoQIURYWFiQR44cQQrhf+f9H3oIeAh472//8s+duf3mAzJ3Ptz76S+Jn337LzLKC6yxBEBqSRwUHsn5c8tkTwyZ2dViVBoiHwkI2CLHIytVQ28rkQRjIQRKwJcetyGeYK1BAo2ohorqBKEIBKwx3P/kg5w/f5LTmyGdaPLanbdxUp5m2G4y1xnRP7uMVB4tS4I2vGTrNcwzTloMkVKiXUXTLwkYqXnNM1/CI8vn+P2VT2OyNUSWI4TAGY8uK9NPi0PZgFLVRZ2UHhEkG1UdzRCIRwmtsVlWLpxDi4hde65jbHwzcd6ksKfp9M6jEUQiQiqJkKryb1cKgsKj8V5Rr41DCKyvnmK9u0RrbJJ6o0mz5chG1S1IWXZwdkMKKdRQ5DhbmYkWRUExUGRlxs37rmaps8TDaydIGk0gZ9vcNHWdMBqNSGoFtx2MeHJ8yHhnFbvmiZM6YjIiqjVRY21EPQZVKVXKRp1EaorVFUTLECUxQQlpyvXw6utuvOKOG2/6Jbzfvbi4+H1fK32sr+rB1OLiol9cXJQ7dlwz+axn7diaNNgRhN/NuBer9JCRpj4Vk5UGY+xXtrnBB3JvQEsOzG/h8HW3keU5QUuEAycDxprKS9x5bGm+ojRYFnbjgbQVncWUWOdo1BLiOK5UCGVlZfzkY49yZvkUa23PxVrJjkaL/VuuZLCeszI8ycSmTdSXOpXsj4hoKU0zahAKhw8OSYQPrqKBhIByBV5EfNuzXspDf/QY51eXcTtLYiSWvOLDiOpYC+sxiUA5US0fN9ZSynuky3DlECJIRJ1zZ54gLYfs2HMl7bEtzNevptYYp7t2Em9STOlxvirVpZAoHaOjGlFcI4oDSE1US5jetIV6c4qAQkXVMdfYdEIZ1inzMYSqEGpFCV7hhcGUlkHXIkRMJOC6y/dz+ounGeSVfNCuLTtxoWJjB+uR2rF/LMed7ZOPTRDPzFCbmUE3Gngl8UGAAadB1CKiOGbp/BLjYy2isSZRs4nPg1i/eNHNbtsVXnL9TW94zyf/5G2HDh1arhYC/7BN+1cLIE+pdU9+w8uf+4WZXdFM4YZSJSqJ4oQL6gxnHn8MGUDJGj/w46/i8YfP8fhjSzzx8DnSNOVNtx/k0I23MVevMREUpjREKgGqRtz76uAG6/FlVVqFELBFiVYaZytqiClKEAIdxwQhESIgguWJMyd5ZPkkJoGVmiMoxfJwnS+vnmPoYwZ5jlI1xsfH6KysIWxVkBpT4GxBcCAQeOkJwSGcA2cZhYLtyTh37b6JRy6eqUavTuCtxImKFCi1xGQFytcJkccDYYMMGEJg4AeM3Ig4S5hKJvBRQv/8Ck92U2Z2rDC7ZRebZ3czPTGHKfq4UFkuhBAQCLTWlcaUAOs9ZbDg6gQvMF5hjMG6AusCulagW4a1FaglSWVFTeWbiNC40pFnAWihJXQ76+gAQnsmp6fYMrEdYwxsZDPbGZI/eoYGMY0tM+j5TVgZVwwBGxBCVveZWqBqmnqtRoRAWo8pLLLmSVo1ZBypzpNP2v2TU+3veOFLXy2E+C93Lyxo/qbq5j9JgARAtNvtzBTFrxrLD03NtuZT0y0Lm0pv0Kiq/Akmp7055obZvdz47Cs4d6bD1AXFd+65ldgZcmtwmcXhkVEEQlaNpBAUWY4OFcGxmr5UZZbz1YjTW4fxnjhJ0DqqFBGDY/XCRZbPnsZrSzc2XEhyGqFGv0j51KN/wZbt++gOLZOtQHu8xXBtnVAEer0+S6tLZJM5SkU4FFYYJJ6oMLhgia0g157r5y/j5Jkz9Po92qKGjyuGMEIStMSkGUGAtB42nGwRgPCkZY9IKrZFm5lRY0gi0lrOUnaB1ccep7Nyntnte5iZ20t9vGqwN8rayp7BWay3WFdigwEnCGZD34sAtqBI+9g8ENQQWcspvUAYj/CKIBzgkCLayM4bVJkgmRibpKYS0CO27drBZGMaawpkEuFSy/onHiIeGqLdW0gaDWw6QpAjqNgSQoDTkhhNmqYI6yv1eiEq4YsN5XrRGdG/uCTHZibDnVuv+NF3Tu17z8EjR4ZhcfEfNIuor+aHnz171n7m01/8i1OPrP/O9q07t7bb49ejc+mM88IrIYJEeYUpIc9yejZjPJHcObWXyR4MQ4EVgrpXlBsnrFpVdsLWWco0Q25I0zhbWaQ5a3HGkmcpzjqcddRbTcbGxgFYXVvh7JnTaKmoN1uEdp1+bBn6jDjWkOfs33MZS2trjLIMESDtjVBBkBlDwwgun95CnRbeV5T8YAzBuCprlQZjSuIoYTTsMykTaiImCw5R2o1+yVEO0w0Wgcc7QwgWHyylyfGFZUtzMzOqTRQipJdETtMiRjhBr+xztnOKwfpFQhTRaowhVXXl58JG0x4sPhi83zDvDA5BwJqc3voS3c46BE1uBpw+tUzeGyeYarwrgsB7h5Oewhbs3l9j1+UJFJIQSR5bfRxjSu648llsb80QUPQ7HeLMUzxwlubEBMmmaYT3hKIkFAXG5NWvIsOmI4rhkP7qKolUeO/JhylJHFc3N1pjRyl5NhTaWL97y9bp+mY99eyXvuKDB44eVceOHXt6AOQpMuH73//+wV/cc9/vz22bO1+Pms+tNZP6KBs66710DoywSO8wzhOMZUfeYky08QJiLyiERwYwpqxu2QUEH7B5gTO28g50vgJOWWLzgiLPcMZAgImpSXDQWeswGPWZ3TLHZQeu4srLrub63VfxzLn92P6Ic7bHMDLsmJ7lum37eejCE/QGfQbpCBsMKkSUdsS+WpPpZDvOO4SzlTJHWRn6OGsqfw1fjVl1bquXgHeIoqT0DmcMZpiitMbj8b5iAntvKUclrbhFK2ohUFgpCKL6XOlBOkURDFlUknf7nFs5zai3hFaaetIikrXKrNMF2OCBhVBWwOivsbx0ln6nCzLgpaM36nL6ycCw1yIARhgEEhc8FkFuRlx+dZ3tu+uEAlRN8cDZL7O5NcutO2/BCc8nvvAZZK9gk40wyz3q01OgJN5V3C5ny2opmucUwxFlt0+apSitECFQbzXxpvpeRFxN3ygNxhgcTsZS2vFtW24Z1KOPLL7t7aePHjqkjh0/Hp4WALn33ns9IEII8lUv/eb7aqb54fFNE89ojbW2pnlqrfUyc5VUYOygCIaaT9jhJtAllLJ681UOrdWyrCwKQlm9id1Gg+xd9ZBZaxkNBxsAsSRxDaEEWV4wNjHOrv2XsWX3LpKpSXyjDlGNsdY0bad48uSXWa/nJF5xcOt1XB3PsEnUackYmVsKB8tuxJQ3bI83E4s6weRVBilKfFFWJZ6xmLKSNAqZRVpXTdhMVeKYosTnJdV4v8p8+IBNDTWj0TJCRAkyjgm+An9VQwU0GlOkDHSO0IoQHIPeOssXztBdu0iR9TDliDLvkY26DPvrdNeXWF46y9raeYp8hBIRFke/WGdlJWPlRBuX1wnCE7zAeo8LJcEJnFjjptum2DRTr2zgKDj+5P3ctPtGJqJZPnr/J3jy3GM8b8f1DJ44T40Y6jWc9xvMaIMz1Rl1kWcURUHwDiUUASphOiFIagllnhMJjRACGUBYj9MCV9qwc3Zeqlq8+/fuued3jz74IIuLi08PgPyViVZ485tvio6+7zPnByv+2Oa5qedPTje2FUVqQ+ml9VRi0sbRKzPqJcyGRtVzbExogvcIHwgbX3hZljjnkC7gvMEGB96T9gcMs6x68KSk1mqweec2ZnZsI2418UoTqQit4srtlcATD3yZifY4B69/ITfMXcNk1GYmnmPv1A6uH9/DLY1d7JITDEaec/4Es6FkUmzB4cFaXFFii7KSAnKVkkkoHaas3t7BWKytqP42L5HG4fFI4TfGqSU+M5UogtbIWFUypkEAG8ROCdI6Rp0VumMGpzXBi+pC0RuGw1VWls9w4fwpLl44yeryOTrrFxj01jAmR0mNVBEuQCcfsJ6vsXxBc/7cAKO6WO8RVoPXKGkwmWHnPsEdd+3AWEOsI9b6yzhvuGX7zdx/8kE+duLT7J3awu5eg6wzQMQJ+GpK6K2p5H2sxeVFRYYMHhkCUajkl4Kg+v+kFUiBzw0qUlhVnWHLEPCxlKo0dtvczF451X74rld90/0LCwt64+X79AAIwH33XfCHDh1Sd999d3ruxKn3zc9vfe7c5smdzpU2KwzBC6GMI7M5Z9MeWVYyRY1YJYRQCbj5UI00g7OURQnOoaWoqBFlpWWVFwXdfg8bPPPbt7Nz316ak+OESCG0RkcJ6AgRKRpxxImH7+fisMcLX/Y69mzaz2xtllrUQOoGWibEqk4U19mE5jKzCYHhYZ5kiiZ1xsB6rK20b+1GBrFliS89ZVlSFBk4XymBmMr3UPhqaiUjUVHMRznSUQnQ1WOCqliyyEqc229cJpi0x2q2StEEKzZkeXCoAELECKnR1aysGvVGMXGs0KoOxOADg3LIqe46F9b7PPTIOTrmPKZxHlkv0bKGxBMKgfN9XnroKrZsjTGlrwQeCGyf2cYoL/nQF/6EombYNNTMdxJK5ylsSSIU3liE8wTrqymXr06FffAb+iyVkqJXQKhu3KOoEgEHgU90NeWkAo+ThLmxtkiV3nz0nrt/856DB1m8997wtAIIwPHjx8PCwoL8oz/60/Rzn3zot6++Zv/s5OTYLZGmGkeJWMRBiaA8F8WI5awDZUFdVEtBAdgQEM5X9bU1OGerM0bjcLZi0A5GQ3bu2cPOy/ZWda2olEAinaCjhLqK8HnGyePH+cx9n2L/LTexZdseSpPhsHgPwlmCteArQWqV1PAjT5TX6BnD2eEZ5pmqWMreUxSWPM+qnsRUgPXWVpI6weNtpalbbmjjalWNq/NBhjCeSGpUnCCiqNr5yMoCOvgAwaO8wXZXOa969Boe7QPaPXXnZBEiVKJ4QqB1DR3XkSpGiTqBGBsEjsDS+nkev3iB4196gnQwRMaBsUaTTc1dbG7sY2Z2M+36LBNzETffOY9WDuEFgUCsEppRnY/c/zGeWD5JrBPG1j1b3CSjLCPSEUJUpEfvHMZYjHcVZ8x6VKgmeZ6AExUwZAgED0JKlPWVYF+jRlyvb/i0SJwUUjmPHm9vXZLpH7/uv/3W+YWFBXnvVxkk/+AA2ehLwsIC8p578C954QN/tHvHrsfrcfNAfSye0RrhXUBFEl3XmFpgXaf0xZBhPkSkjkbQ1UMhBMF7iiIjz9Kv9ChZkTM5s4n5rVvxgFCKelKnHtdQslI7P3/6BPd/+T6ePPkE1CP2XnsN463JSh0xiMr/0AaCcWAqxUfrPK1Y4dMc3Y140nbIzICZvKJ0WOMosgxTlgSgNIbSFNVkyjucqwBCCGilKoHpNMeVFq00sY6QWlfnAEpUo1UEITjAYOyQx4oLLMUlXmq0i1BUpZiRHoFDeL+hNxwjhEKICILCkuNlxvpglSfWezxw4jT50DDemiGJSqZbm5mOn0Ez2USjPsum6Vlm52fp5ieZn29UW/4Q0ErSSbv8+Zc/Vt3nG2h2BDO2ifEerXX1HfpQ9R7ebmTAgLaBGIUVoRrrfqW/qrhWQVVsAuECIolJxsYoR0OcKdHVvZCb2DyrQ6P5yAfuvufTRw4eVO/+KpdZXzOPwsVF/OIiYkPS/j1XzVz1h3e+8drXN2r+B8drY/tl7tmUCjGTKVpOIx1EIaIWxyilUYAzFqRCScUwSxkOBngChkBjrM1oMKRWb1Z20cMRpbX0+n06nXXyPEVqQSNu4NHYzG5s8V0lpOzZEDirMpV0AVGW5KZgcnqSfJiyd3WWE/Y8sy6mJSfxVIAy3qHjCIHA2JyyTBFSIUWluZXEMdZrfGpwpSdOagRfGWdSFuhYIkpFEIAtiVQEeC4snadbDmjqmJkQUW/WCJM1hJekImeVDjb2lWKiiAgiqjbjIauybTmBX5niinAX+67STCY1Wo0GPVt5PS4vjchCiowrkep8pDh1vMvmadi7c54sL5A6ZpiOGJkCLaDIS/qDklzkkEhs6ZCiIkwKFyrWgg8oISikovQl2qqvCMepjXNf5UHqgNMSREB4i8BiTY4pUpAOoxtMADva7QSAgwcrI8unI0CeWiguLi6GhYUFvbi4ODz+747/1yPf9LoDt+/eekVzkDthgtJeIagu8oQCocAZQ5lnjNKMNB2RDQe4smDHzl3YEHj85BOcPHea2uoKURTjgic1BaWr/sfXYk0S1Yh9jaSslnWj0xcJey4nOIEQHrzbMNKtlOe9cwgLxkjK3NCcHGNXZ4rhaJnHdI8r87h6yL3Deot0GiklpSkoyoxI6WoPiCBSEpPlOGMrb3LvKK0BJaGUiLJSeJHWEGuFNwVnT55mpbtKuzVGY7pFY2yMmoqJC03sY2RtjKbWnFdDnJQ4Nsocsuo+pr+N1fNThOEW2q0W0xMN2klMHCmmWgo/VjBb7/Dlx06DVSTjkjxXjMm9nHzicXZu31xdU3qLUAqJY5hlDIYjZkONNBsg/RgNcoxQ4CxKbmz1rUVLjYscXgpUEHgh8VohVKX3JaNqLCykxAmIPeTdPtmoj1KV3XWQQighubC0eivAwZWVr3oP8jV3ud3IIPZnDr/pG6+b3/a2y6Pm1b4/CibUldcbvt0hgKgWccUwr+pSASKOaEYTWGvYNDvDZVdfizGW1Bq+8MgDJCavVECUIihZeXsjyE2gtJ6SkkJJvITV+/+SmX3bmJ3bgzMWGaq62zlHsIZgzIacaIE3lctUe6zJdDlJOVxhhQ5NahhX1dzCCZRSlEVBXubUogi8R8cxRWkobFEJ5ymF9xLnBcaIimGcV/1WFEV0spzl02fJ+0PaU5O0xtrU4ogoAmJB0JBFnsRr2r7FerAMKakkgkuCcGTdNuceadAdOmpqHSctMgbnLGXPgXA0Ek1cb7J1do4LKyu4SU/wkoaYJxukdAcFE7UGykOwmvHRAcbVZsbiLqp8jF7aZ3MsyOwY3hVEwSMjjcMTIxkJg/LVSyMloFWC9OBlQCuN8SVOeuJ6EyHBZTmdQQdbGmQSQZAIUR3XKfEP1xl8TQHyFEPzyBv+2b941ZYrfmHTyLCc90IWSRGZgPMe7z3WlaTZgLIoqCUJrfExdNIgEhEmTSEv2LV7FwhJlMToOKKuY3Zs3orwgW63WznAKoUj4AArHEEFXBzhG5pcZHzi0/fw3GfHTI3P4k2lKBiMg9IijcWXpnKttZa8zCmdYzJqk/s+3bJPKQuUExUFPgSEgqzMKExJYjQ1FdMQEmdGaDStuq5uWFxlEkoQWFnpc+EcneVVumvrKA/tiQniVgOgEvi2DlG6qoRx/7v/CDpgI4f0Ah0kaaF57LEClUU06gl5OuDC0ohOd52piUlaE+N4C/kwo9Fy1OKEVpIw6GQ0GjO4whOKaQbdERPbDMOR5/EvbGZ/6zuoRxGjhiVnmeL8J+ibx0jCEOk8XmgiKuX3klCpm9pAQKC1Am0JwoNSOB9INhgRqda0Ww26p87iij5aSnyQeBERUAihMNZvHIgcenoDZObBBwVAQxCULcIF2zM6qFhbR0llyZVnKXk+gmAZa7Vp1FpEcY2gFL6wrC4vMTXdJqk3QEpcCKR5gQsQJ3Wm222mJqdZW1mmyDPEhsasVxKhBF5CIaBRj1nvrPDJez7C9QduZH5uO1Jo7IYZTihLrCmr8q4sMdaQmQzpoZ20GRQF6+kAIQVDX9A3GXkoKTA4H5BGUEOzqRxjXDWYicZxpaaUAR9Aa49AYkVJXhaMsgxbFNSiGJ1olNbIjR2QVwqbFeAD2mnwEaW0DOKUTBVgKw3dgct4+OwyUt7Mrp370I2qBzKFJx9ldNZ7rHU7jI9P06o1KEaWpBUx1Z5gaXUdm1ikkAg7SZl66i3Dlz5dw462UW9GFEOHKx0uquHmX8RKfz/ti39CEtbRiai8IIMkatSJawlKyK8sUm1RVuWmrn62UnsQGp/+/9p78yhNr7u+8/O7y7O971tLb+pu7ZtlS7bs4EXGEW6Z2GCDgxNMKYQEMoRE2XMm5CSzhJlSh8yc5HAIZ2YSGAsIxCEBqzBgwGC8qm3jyIvssZaydqlbvVbXXu/yLHeZP+7bQpDJQgZsSXm/5/SpPtV1uqqe5/k9997f77s0dGIxvYrxeA+DYNBonWFMjlKGflE883Wqj29sgdx3X/rYTOqttmmlVUG1HroYEDdhMhkxqScoEQb9efKsgpgO0G075rmnnqFXFey/bF/qVilNMxkzmoyTpZBJe/He3DyLB/fz3KlT7OzsYJVFK00uKd+iCYHdxhGznPH2Nl/63Kc5vP8oVx28mn5/kNinbUczPft0TU3X1rh2Qt00dC5QSs5mGHKx3mFXjWltgKkRXohggjCJnnXfMDcyuCogRHqqTF0fFDE21OMxLqSskcymLUkUISrBaIPObPpjLKIUru5o2ppxL7JX1DRdRFrDRbfHwxceZxiFa+Y0RmsybSjmB1TWkhlLDIoLG5ucv7BG5yZ0rdAFw9ygYL6/wO54j15WopTm7JOLjDbX2Ti/iBXFaKem811qNHSRzo+Q/Cijo+/Eb3+ahbCeCj4EmrbBSSTLcjJrMNaiY1oJW9ehupYOg5GADTB2gaLXI5tbxNcNJispspKsKGNQKh6cX3gG4L6775OX+RkkVcg4NEUXXWi6CdIGOmPomhFNM0QbQ1/3sKoiBgGtGA33eOrJJ8iyjCNXXIlSZWr7KpIjetfiY4f3HVoZTFbQG/R55avmeOqJJ9nd2sZaQ7Sps1RKwAWhm0zp2AE2njvD3ul1+mWfXllR5CWiLRFPdA00LXRtmoy3Ha1v2Qk1WzImVEJ0mvGoow4OoxSV0iijERsZxYaTzQbWGbwLFLlDSWL35pIkwVmWU+QF5fyA/uI8xWBA1q8wRY7OzPPtYNV4NrbPc7o7xe64RW9HNkd7PDw5x/nxeXLr6eRjbEx2uCy/lYWD8ywuLDDXnyMvLIePHOTw4UUmo4at7TEb67tsru9iMoN2hi4EbKYYbRlOrmquuq6ijY62hq4LuCYQHBibhFumvAZfKoZnPsxcN6SOgV7XktUttW3ptEJrTaYzdJ5hM4ura9pJi+8UnXVor4kS6C/Oo1zA2Aybl1hr2XGtPHLmdPPC5+dlWyC3HDoUASZWXQy+U6Gt/a7yMfc6ON/qWFiMKiikTME0CHvjIU889jiZ1hy94kqysiSIQosiRqjrlkB64+6Ohxw5eBRTpMl0lltuuOkVPPPU03STIViFVxrrNf0odMHjAygUyiiM0rSuod1u0JKMnJUShHRucMETuw7nO7baEWt+C58HuhbWRg2740SWTC7qkVJHejpics1uHHPabeLalv4kY1D1qPo9BnlJ2e9RzS9Qzc+R9StsVSKZJU6LIioh6jRlD1XJQnE1Nw419194kK8MT3Jmd41t3xGUo/MKVZ1jV32Crb1trgtvZWcH+v2awwcW6FcZQUV8gP6goihzNjf22NjcZVzX9LIiTSK1ob+wQOeZSn8DbdMRfCAr7HRmo4hRaKVg2FvAbO2Q1R1DMWTaY7xHK43SilZ3qK5Ba510KIUwGQ7JxxArSyuBYCy9rCAKtJrY11Z97Zlnd3/+s7/9EUnl8fKimvxBrKyuEmOUf/W+e07PZ8WfOVz1L9OTTnTUKow7Kltg84o4/TFHkwmPPf0E46bhxhtuZDA3h8kytLUpO1xrtna2ubixxqhLVPUDCwewRY4tCxCFNpp+f4CbNBhRaGURAsFAlhlUFAhpKEYMaFGIJLkGpE5aWzdMxmPGTUPTNYxdw1PNOpt6RKeEtd2aC8OOUQdtECYhUrtI62PKHJdIsELrPHO6x/7BPIv9AYN+n7m5PkWvQud5cr3XKkUTSLL61NqgjCJORTcuJieSBSnwmecz6w9zvtumbwfceMVNXHX0elxX4LXFq1NIvZ+j+6/h0OEBi4sVvb5FtE0ERd+BRPKsxBhL1zkmoxoVFV0X6XykyAqaScNkNEnkSWvSnC86lIp4GtYmz+DlWQajXcLEJz8wn9KkwjRWOnkuR6L3NF2HMpZe1Wdc1+yNxsi0U6WNRbQmy3Lf5VZ/6msP//Of+dCvf/BTy8vmB48f9y/rAplC/eTP/Vw9/7rrf018fMPEx/7T7eTz8/MHjh7K+ya4pJIbT8Y8c+oke6MhV119NQf3XQai0vJrM/LcAsLW9jabW5tM6hHKR+Z7A6q8QmUGpRUxRIy1SJZRd45MG4aV53R3kULpNIhUhizL6Vc9qrIkzwq01mirU7hljHjnGTU1w8mYjdEOz8oOTkfGdeDMqKFuY9KGyyUlIbQh4EIgU4I2GrywP59nf9knE4O2BpUs4hGtEmlxOnE3kgRHyfNKnrebNt4RXIeqAzqPfHXnabTN+Ovv/au86/bvpMjmOHXmMULbkeWB3M7zuuu/hcW5AUqDj0moZWyG0RbQ6BAwWsiKCo9mtDvCt46uS3KEZjRKLu/GpGEmCiXg/Ji9bo09/wyy8wDFbo0PFu3b5Ogf43SmFFLEtE/kUx8Crk15LL1DB5Co6TZ2UM7TqEheld28KdXnTz21+89+97d+aO3M2t41b3tbPP51eDi/4XOQ48ePhwgi71858344dvWx1y6c3Irdb9/+7c/5EHNXx9iNR3LqwllGzYRD+w5yeP4AwXka11CVVaK7JyldYr4ag1YKBNaGW8z351CZxfi0gngbKfoD5kZD2gjNoCNkngP9yzkyfyW5FCgtEBPt2rcprLNparpJQzsc0YzG2OEeQ5tzwe2xJ448BtrOTQ0QQCRMjSUiQRLZcBwDQx/JOg860tCAjzRG0NFT+ggu4rpkUBeVTnQTBK8itomoEBCrEa1AHEOBykdcXaMRbr7uJnZGO/zsB+/hsTNPU+QWWxa0wdHLKupJx3C0RRSP8prgHbVX+OCQGFE+LZmB1N3rehWbazuJZdCOKat86uye9B4xehQOjKfMKi6rbqJuTtE1D9PkEe2EGA2QmA9FtFjlcVYn+p3SlMqnXMqu4+DRK6PffzCE3c1oo9Eyau05v8NDp8/c/ciXHnlu5c4VfefXKe3WvAhWkBSXEKPcd/fd+m3Hj2//z3/u+9+TaVmUpnGxbvTpzQt03lMWJfv27UcbzXg8wnmP6AOEmBijQgp1yYylLTNqgUGE9dEuB22KGyvJEWWJKlBmA4b5BqO4y1uueRtX7r8KCSYVXGiJbbLAESRZ7LiAMhEpkpLQ+pxKQTbJcHXAEIkhFZWeEvIUMW3PYiCKopum7iijcdExjDUtLTpqgoOms6Ad0kBHpB8k2bV6QbyiK3yibvhEi9cqsr/xjOKED218kSf9Bs88u8nvPvgFdKYpBgVtCPguuSUO4y5rp7dwwdBKTd1MwKVZRFQTJCh0MAiXJMCCMhYvns612LygdR7f7tC6DmM1eZGjMpushvDgKopDt9FNdpGzG2wXY3qxT+bBCQRarDcoPKiGoCROtAlZKOKgHcuWO6/nb7hC77vxRs6fW+PMaPzh1bPP/sI/+rf/6peWlpb0nStfP3eTF0WBkIiH8VPLywCSef+mXiC2EbM+3EsEP60YlBVVVeEFhuMhSmt89OAF6RLrwAeP1hqVV0y6Bl0U7NQT9PYm8yoNrPTU5r+xng21x3WXX88V2SsIMSJGQAJ4m7K8AVqPiKBF0g2OEe9ThIMWIUMnIzwlGKspreBdTFvz1MO9RMfDCuQarFW0XujZjIX+gCKvqDILVgjS4WPNZOI5OTnNSDx5lVNlFqNKMmtRCrwyjFzH1niDJ9QmT9qNpGkPEZtlGGVoxo4QPUZqonVc8J8j1IuU3dXkvkI8THBY2yfThsFgwPyghzXpIrVty7ieMGlgPJ7QtJHWJalwUZbkZY7WKuk6LjmrENHsw9/4HUj+O7iTq2xPAgOl0SYjakOtPTjIA1itxRaiyR3jLDDstnYef2jjq/nCwsP/fvf0L/3MBz/4GXg+Vvzlk5P+h5+L3AcQR93kjIoiT0/2vvJ4sz1/g8mua30b5wdzYqwlCownY/KywHlH8gXRxBDTTRLYV86xr0opqpkXtuoRfjNAP1CUfZQyPOVOUl7W56r8OmpqjGQoSS0BFTVeS8opF5UMBczUeCFEMmXIjaWrOwplyFAEAsZCVSra2tG4aWlIUkRqicxnmoG9dMg2vGLhco72D5DPzVPN91C5TVuebkLbTAjNFpvtGo+1Z6nzANogLtB0Hc9cHDIMHl96ir6l0Dk+CEJgHFo6pTGZISqDEQ1kTPQmzxX3Etsj1NsaQdiXHeWwvI4brn8jV11zBJtrYvDJOskl58l6cpT1tW3OnT5H2zXYskS0wvsG59LvJ0alJ0orVFD4SZ8rv/XdXH34Nk599UlGz65Rr48Y73YoF9CZiW1eyVrX7Wr4f/Ymo1Pbbvjx82rykV/6jU9eeJ6wtxzVyuqdX/fieNEVCHfcEThxArLqE1/Z2hievLhxV9TyXQI/kol1g7KyoiI+OCbtGLTQdQ06WnxwaD81B9GaXEkyrVYKqxQ+BLaaEdFotB+zG2r28l0ur65AHATlphEHKg1UiBAcQsoMFyUEsaA7lDYEBVpggseIYsGXXIg7SKEpc41SMGkdtY+4AAVCL9NUlSFozWTScnlvnqPlAjrPyPKczFTYrCArC6LVNKHj4GSHI3tXcMXwHPdPnuK82gYryT/XgNPCIC+IrWc0HhGtwmrBaIXVNpWtdHRBpsZ0GoktXfYk/qDDqxpdvYYD1Ts4cHhAlqdunTGazJqkK3cBbSL96igL83M8+vgTSfuRWbRVKbtdKdAQCHivCaqGGKgnfY68eh+X3XwTxkVUHWi3R4SxD725ffLx+7/09MfuO/HNH/vQx9Ze2LS9tOX+ydXVKMflGxas86IqkOPHjweAH1v5t4+9401vuvVjX/jCM3/7XX86vxjd/3KVzZW2Eh1RXNMlvyfX0bRt8lVSgvNJbSgqmcxk2mBRaBGstex2DW07xHUepyAXgbGjsx0ms/joiD6R4tLWX4gRokrzEpEumUV4j1iDjhlZWXKVOULMM764+TjnJjvoImMRxYKxNBFs1EQN+bRdvNF1HA4Vb+xdSa8osWWeqCRMbXuIKK2oegPCvj6FO8z+yeUc3D7Ah5/7Eg/sPUesDGRgQmR7PCHGQJ5bMpK7vQ+Bxjdoo1BWUJISepWkl0BRFRhjmExGjFhD7ISKg0TGRBR6mswmOtmZ4pKNUm++4Oprr+KJR5+kHk/Q1iT5gTZo68mKgBKPiwFcn5PPnOF9v/hJOjxllrMwGNCveixmGUezK2RbhqP29Lb6/cWxrO5cuVNWjq+8/Nzd/6jw9Jkz28vHjpkf+/hHT950w7XZ5YsHjpXWhhiDmkwadsZDAMqqh1JJZNoFT+M6Wu+IEXJlsJLapVYpJtHT6EiQJEl1ylNUFf1iH0qbZLwWU88ozULSIysRurpmsrfHaHcHYvq+Sc5a0NMZ81nJwf4C40nN+mRIrRNTtdSKUgvoyJ4K7NUtV4Q+t1/2Si7TA5RoyqpHWVbYzKKsQbRKBTg1gGtyjZQZiwv7uHbxcsKo4+mdC0xMpGk6fEyT7EtJtYrpFk4giko2n0qjRaezkIagEw0nGThMUG3GFfOvo+qbtI2MKZcwkUWTmYMATdugtGF3b8i58+eo2zF7o23G7RaTbovdyRbOB0KnqLuTcVsejptyTlrXUbcTNvY2Ob91nqcvnpaHTz7KKOxeduCawV9//Ztv+lO3ftONh179+pu3vvvd77u4upJcS5aWlvTq18nB5CVVIMugjp88Ge5dWtL/4Dd+4+M333DD6HDee0ceY9iZjNWoueTenmF0Uhh6ibTO0bQdQcAqhdGakCUv3iEtrVUpNNR5LvptzrsdDpaL9MimAy1PcIm56yYdo51tNs+dY3djnfFwSK4t+/fvR1lDJgaMAQStNIUqOJAv4McNk7omRIULkUno8E1A1YqriwPccfiVHM76ZGWJ1Za2bQkxORvarECUSpp0lejvQVI3zIuilw94zaFrcM7xwKmnaUJM0cyBFPVGmpNc0rOHGAmk9NoggShJiemV4KOQ6QwCXNx7jroNLMo15MYmMmiA4CM+pqZD1zq8j3iE0+fW2Ku3KQcK04uUB2FwxFEdGrHZfo3z3UPxvHlMtuSc+DaE6EOIIsoYIS80RdkjK0qUjdFWOi/ms+vm9xXflpf2r73xT77ybW/+5lu2Pv/Z3VOrq/e39967pFfuXf0Pklv/my6QE9Ol9ebVVfk0xHxx/tEbBgt/f14pudiNZDhpJWqN0SrkWnsfvISIdD4NnbROAT25yYkCu3HClybnec6OafKGZ7t1Ht7b5rOPn2SPQJ6B25mwsbXN+fWLnHvuFM889TjrZ86gnae0GUVZcdnhIxibJeWWlnRs0VN39ihoJyxmPfrKsGgLDpg+l+t5rssP8icWruZ1B65lPu+RZxllnlOaDGMzuq5jXI8JKlLlBUZbfBACPqWS+4CO0BBRUXHTZdexNxmyunuS4B2+CygEJYIiCb2iEiJh2nIO06Fe8geGFP2sfJpqS9GyvnGGvc0WN9a4ieA7IXjoOkfT+qR5t4rdnQlnzpzG47CZIi8EycfML+5w4ysabnvDKyKmlceePLntgz4Zan+wjSO1N9oO9WQko0lL3SSfr0JbySWPSnTocMFm0fQX82urhezPv+ktl3/P9TddtfYj//BDD3P8G7OavGgL5IWFcu/Skn5qfr7pBffam4r5W4bDPbfjGrGiYl71lMutal0ntK0PwatJ7OiUp9WRNrQM6fjy5jrv+9inePiZ03RFjrpsnp2J58EvPssza+dhsaBta9rNbbbW11jbWieLkSsPH2VhfoGsKDlw6BA2L0ArtLGg03lFRNBBkoG2QOsddTtmoax4xf6jXL9wmGsGhzhYzdPLKoyk+IMiy7HKpu2PMYQYGI522K1HqNxSGov4mJwSAQIon1iw0iqO7l/kmewirkg79W6qI0Glc4OKYESjYnJGERQqRpTw/JCvcw5lDVoZdnfWWd99jI3xabYn59ncuUg9bBEMvXKAzQyEyDNPnmI0HoLKMDonUwW+VlS555prqrg4OBi/dP+T4TO/fv93fO6zX/qH/+76n3/I6OzKucpcpfUkpJlKI3U7Sq3jiQdUJCrxSPAxeq9dHOzXhw4d3Lf0httuvV7a/mc/8pGPDL9edj8vmQJJq8iS/MvVn4z/o3efKfcvfkueZVf5tpWs6svJrj51KrqfHuJfZzOb166JQ2lkpD2NNEykY6dS/MJnP8fm7gjVCadPX2R3r8F4TaUL1i5u89zFDbazFhbATiYcLha5/oprmJ+bB6XoLcwzmJ9P0l+jUdamw6tMzykBnHd4FdjYXSdKYLE34OD8IoOyT6/oU2QlZVFircEHn7aHNtHWn3+jE1lvhlzYWyfElkIV4EFFwQfAJT6TCxHpap5U59jJW/bPL7AwNyBGT900qOnc5pL3VJwWBVOOWe1aPHHaPVPsbTfsbY/BtITqAqP4FN5fIOt22Ty/hdKL5Mby7NOnuHDu4vTMo9GSUWYlme4x2V1gbS2EMxfW9Sc+9/G7vvDQw7+6eu8j+tf+8W898uhXn/3Z6645Mr8wX71F5z5abTAG8TRBlFfRB+V9q7QKShuvjTJKMNis8wcOLb7u0JF9711cOPSp9/3kz5xHZivIH1hFTsTjIM9tbOx9LD70/msHVz8+Ufqa09E9euLZJ9/1y5858avXvfIVv74t7kht46uqwhCUjsQgVdXjk489wRcefYL0Ek6coL2tIWvnNxhPxsQYGI8mbNcTjlwz4FVqnpsP3ki50E9OI0qxuLiPrFeBMSirQenUDtbJ36ntOmKMbGyvM6x36JcV82WfffP7qHp9srwkryryqk9ZVnR1srPRNkuiJFKHSSRJgHfdmPVuSNM0KU1KJztQT0i2RD6wU2/xZXeSLlP0spJeP+fgoUX6vZJJM6J2HVEBOhI1iBHyMkdZRdGryPMcCYFu1LF9YYtMW6rBgKxcQEnOYrlAvxsw3vacOrPOxto6W5sbKDGYLCfPy+TarjTGWIqqoB4Noh8dVnODax7+3Fc+9Mmlm/+lhmfVm970JvmVlY9+5MYbrnuy6pXvzbIgqNBV1cDIpLo4XGs/3Q7l6UyKJ9q9ENpRwHeMfB36WkWOHJlfPLAw/zcOHzpYjEfxs3/n72zGEyf++DtcwksLkgx5fj/uuusue88993QAf/Fb3vatt1x12Yf6QjWSWvwAec4PObW9QVN3rK+P2Lk4Ym+zYWNjmJz+dPIL7y30+O9vfyNv3Xcd+weXEzIhC4Lq4PIbr8P2esnzFiG4gO86Qgj42jHZ3mNj7RxPPPUIg/mKTBt6vT779x3CZEUqAlGINhgUw80Ndre2ycsCo/Q07dcTY6LL7MqEx90FRGmusvtY6C/S6w1oCk0eBFHw+a2HWbnwOWShx759i8zN9ci1kGUW5xzPnjrJxvYOZV4iJo14rLEYa3HO09UOFWDr/B5WwfxihckzuqDpF30Ws0Xm9i5H715F5Ag4yLRBSQ9MSTXXZzwZBY0XW5WiVEVRZMQ4CaN2or72zBd/+P2/+T/8xPJyVMePS1hePmaOHz/h/sz33v7n919pf7YaZOXG+e6Ta483P/jxj//uqRe+uN/5znf2suxorP0zr7jl1ivnmmb7tgOHFsrTT03e8MyT6z/8qU996rGpn0GYFcgf+JnvXVpSf25lxQO89dgxc+LTJxwR3vOe91wZL9/9S/s6/w+siYMtGvZCI5qINSop8aY2NKrLePprGzz4hWeo9zogYAvNT71riVdfeQ0ZOUGD7gKqhatfdwtZvyK4FH0WfcS75Mzu6obdtXUe/MoXidGxf3EBRWRufoG5/YdQJseIoLWAtkjUhMmIs6dOorUmtxaUwhGQCCEaogo859dYOfMFbK/km/qXc6ScI+8PyEzJU5N1fv38/ax128nPttAcOHCAK684Qq/KqLIcVOSxp55kOJlgtDAZNxhlcZ1jd2ePPE/ERXxkbr5Ca0HQNG3HZQsHKYuSXnuAcvtP0De3omLyIEZ6RPEUvQVq2WK8ucn+xcOgM7JSY7Mqxi6LF4ZPq6fXf/ON/+aD93xpaWlJr6ys+Esf3/7db73xyqP7bvi5f/FrnwLq5eVjZnU16YNWpvf2xQDzEiyQeGe6gLK8fEwfP37CAfYv/q133yX5+EdVPywORxN8nYzarIfYQeMdjR/RuZYgAaWgf7Tim771RrbPjnjuyfO86uiVHFk8mA61BGIHofO0kwY3HlMu9J8Pu4wk8qGPkb3xFo8/9RCTyR6HDh6cymEh6/VQNkPbHKvTYT4qjUJjBWyRM67HGJvYx1oS1bwxGrzm+uxK3rh/yP/xzCd4qjzLgYP7mAsVHrg4HlKblp5kBC845zl/4Ryj8R633nIzeq5AJPDKm1/J5nCLXBvWTl9k9aHH8U1AotDpCNZQVDmtdxhJ4ToRQ9ApwHSiNsiyhqrcj8LT6THBZQS/GxSoveaJTw3byRvmR4d6WdVJdF68rkSi84cG10rr3vq/wD3vWWKJFVZYWVnx0zf/E8ATAMvLqOl9/A9e3MvLy7J6y6rc/MiawB2srq7Gr2cBaV6iSBf5X/vv+r4/9fY/+e03/0J+oLur1eOSUeN8zFSYjsu8OJxxBOlI8zqNYCEY2s7jTMdgQbPvSI9vuvpa3lAeRVw6C3gfab3H1zXjZszioQMpycl58AHvWjY2LvD4Y4+wt3WRQVVRFEWiYJiM3twcpihQWT6dNKu0gqikgByN99ja3cLaHKOTMEh0Ui1aSRP8K/Yd4Xy7y6M7p9lrG7bbRJNxmTwvJopEcq2xxlBPajY2tunN9+j3K6yS5wmFBw8eYGd3h82tEZpER8EqFIHMKBSCa5M10aAssAZcbMndNezvvY6iqBABR0CRea+H6tntL/7lznVfWJy/7D02DkLwXikrEJ3SIZOJ23lF1tt6/z/77X+2eckq9JKz5qFDS2p1dZX/1FnixIkTcXVlNZ44cTKcOHEizNq8/wW4994l/bf/9k+GP/NDb/1Hh64Z/LwZTK4YNyPngpIYRU+ko5MWkaRawwldUPiYIs4CPjF1Y7LncS7Qxo4FUbymdyU6JHZuG5InVgiOzdEuO7vbaNdRT4Zc3N7gzPlTPPv0E4y2t+nnBUVeUJQ9RCX7od78IiYvMTbpJy6FbQoKrRSjnW3Wd9dRSHr4jEUZndKpleAy6OtkD/TVySm88rR1IHSRblzjmg6dWWyeT9nGisxYOt9x/tw5ijJjMDcg02mFUgbm9y/w7KkzhCYkm6DgwUfiJcJh1JRVTq9XoZXB+wbrrmBf/jqqKocoxNBF762qw1q9Fh/88V/44E9+7JqrD4/7vX3fnoWF4F0ryig0EFUnE7P30199+P6Ld9xxh1zy0j1xgviNnJC/bLdYS/cu6TvvXPHf84Pf9gNHXlH9kz23HfzYJeV3DDjlyTwor/BdCtj00aNDSFPhEMCRnMYlDd20Sk7qZ8d7nO32uM6U7AVPHgLKB9x06Hb64gVOnXuax9jkqF3ggBnQBUfV62HRmCzD2ArX1SARmxVonU99eA0o0BIRNFFFWtfR6ciun5C5mqrKUImJhVeC1cl+9OreEa5bOMyju6fBgQupuBvXUnc11aBP3i8TjT94rNFEF3joKw8hWnHtVZcjUeGjZ3FxnisvP8yTF59D26RBiYBrOybjDmsscTojKasBRdbRsk3wHUiGqJxMd4hpZK/enTz11NfOTmnoP/Y3lg6Vr7zs0PF26HwjovJqIM1ktPmVRz5xFuTrlunxRwn1UttW3bt0b3jXe9/yhoOHq5+LcdyFxomADi9IeU3SziT4STpujVeCS69mlImJuKdT9oYLHgmei3HI5/aexhPQXnAijJQw0oIj0unAx5pn+e2dxyl6JVW0VHlJXlTYqkDnOUqnYE8XA9patFaISk7tSifjM5SgFey1E5SLeC2sNzsE3yVBlUkxDSoziM3Io2E+2GRXlGt8aFA2hc4ordkbDtnZ2KRpG6JSBFGIMQQfeeqxJ9iuR3Qkv1yjFIcOHcDj8QYaCThCIjEbhZdAM24YXtxl/ewa585eZHPvHE23RexCsgdqupAVEWdGn//CF74w/Gt/7R6zvBzV6rO/e89m/WxjMqt93TkvMe64Z+9/6KGHtuJyUN9o4uHLvUBk9ZZVEZF45MoDP1nsR40nIyXBiPeXrPa7FNkMaK2fT3uVaZEoScbIqGS972NAkThKatrF+vf105zYW6VhROgaygYKJ3S0fHV0ki80J9lvCw7aRUzeoyoHiVeU99AmJyjBhY7WeYKo36N3wJQflaSyXXB0bYNzDieBs+0u290QJxGvIVpFMApvFZ2K7PkJsYhklSErklFCJCImuYJoFKPhiL3dXULrCCJkRcF4OObMqdPp+rQdddtgCo3JE3HRPL/1UyidJMmmsGRlTj4dYo7adba3N9i8uMmk2cKHlp1wkSHDnwPCkcfOxrvvJp744m9ddLhHJQYktmF98jV54sKX/ikgd67e+VLsmL50tlhLS0tq5c4V/xf+6jv/0cJB88ad0Y73Xms3tShFpXjoGGOKQCbiWpeSmUJAhYgOgS5OGdRqynyVNFPoRGFiQNvIx5rH+Vq3xrWyn31dySS2POnXeMytoXVgvuzRKxaSqTIO4yM6gI9ACLjQ4TB0XZsCKQlolagfISSzg729XYbjXSa5og0tj7gNmiEcKxZwMakWtY8o6Tg5vsCFsIMMFFmwCAXD8QStpo4rknyAtdLEGGnHDRINRZkjEtg4e46DCwtUvZLhcIQPHmsNxiuMJDKkqIgoklLRRJSKGCI602QCk26L8eggJjbUYRtz6CzKnzpKRLj7+dvk63EtjXRkvS5/4vyXP/ihD3/gM9OulZ8VyB/jSreyshK+47vfdvXiwfJHOmlicCjXpYSlFAmuEq0vQLKtSvpwCTJ1bIeoIjHK8+ZwKqbcdCXJlkYpTVGWBB94tr7I4/58evC9xxEodOqAbfshQ92wTw0IaJSPKUi0jcR2RKMiO/mQy0brGLkMn2m6qNEhJl+oSeSZpx5nQ2p65YDn2g0eqp/jTHeOA1Jyw/6rKbxlguOJnZN8dOdBxrqhJE/nnEs2Pc6lopAUNYeAUakb5YPQjBoG/YKm7dja3KKqKkIXGe+MktGCtkTxaM2UU0ZKEVaSnPRVTAf1bI+t/BOobghRMfeaIQdeNeLsJzf/IsL/QSSsrKwowNf+/CNdOX/rsxcf+emf+dUf+7vT4oi8RPGS6GItLx/TJ06cDG++/TV/b+Gwefv2cMN3rdeQ5LCJXhSnYZgkD6ZprgcxwtR2J8SYNsEBwtTO85JGXSQZpyltEnNWBDU1YFAIRl2ahGtC13LF/GVcUx0luEum2AHlAnt+zGbV8NELDzNqJlxe7ifvUhIUDnZ3t/jaU1/lzPYFsqxHLBSfGD7ObthlUjq+7M6xPl7nbHORT+8+yse2H+K5sA4aTJZj8gyrNdZquq6dylzToV9pjVaSzj1aIxJQSsBaQvSUZR6VUjx36pwMd8cYYwkSk6hK1PS8ppJjilJoBdoaKD0x36S1zzAsH8ZVT6vNza0w2WkOXHP1VZ943/f83GlAVldX4ytv3HdfE9d+/qd++f/6OcCdOHGCl+LZ4yW1gtx9/IT/2TdfUca8/fMXdze7pnZRKeMvMatCjEqBuiTwkeQpMC2QtFePMaZCitO3ZUjJsiqCC4G8ysmLHFd3BIk4UoagU4mQqIiI1VhlENNw/+YjHM4XOaoXsU7ogNp2POd2eNZv8HDc4ImzF7lYD7lpcJhFU2EmgdHeiM0woShzygzuu/gQ58N55vdVdAYker7cnKQZOqqqwCwIpS9wk4agQWUGEyI2r+hcQ920aA1KJaEVIaTsQ0k8L2MFZcH7OrTtWLX1hL2dUcgyq5QIUZI8WE2N6ZRSqdVsUtZhICBthspzfDbE0XHxbCCyExfnyYtF+/eB77l0r/7Nr/3aBrAxpZfEl3JxvCRWkKWlJX3n6mp4+1u++Y6Fw9nfc3GsreprhVZKjLLWKqVFYvCEGJ0PAQkihKQOZFoABCEmtVCKGA7JkQQRggjloMJoQULKJEmrjUoPpbFT/bXFiCJYzzDUnGm3wSQx0lPji9y//QRP2x3G0rI3GbPXTXimuchXRid5YPwMj9ZnaTTslwV2dMeHt77CF7ce58DVi+RzFZnO0Vl6UK3WKAlkRYEuimRcLVD1SpRWZFmGzS2+68hUesi1KKw1zx+6tVYoLRR5FXt5T7V78fzuemvrrrYIHiUqKjDThoY2Oh3SrSHXmjKz6ayiQSxkvQqTFRhlMcYrH7Qf9Kpbrrry8q988Jd+59Gle5f06srqdIj7tsDLAPIS+Rnjn/2z77yinJe/GlSrQ8soL4svjuoardU78x7vCKa71ZbQtBMmdRtUCMFNndWTj25MrunBpWXEa1zs8BIQcr1/37zEEGm6CdEFok+pVkggYhHp0EGSXeZUtdd2jnbUQAeN8xAci4MBVhu29nZpo0OZpOxTSoME8qjptQXbkyFr7S6FFW583dWUvQEqRurYUG83FCajcTWdd5R5ibGGcT2mN+iR2Tx16XTGztZ2UkEqaCc1bdOmtrLWGGvBiO/1S1018599+oHz30VfH+kthPerrHt97UfORVEZubJWISYiojHapFgCnXTsogWxBokRk5u0rYsdBAm5tVJv+ae+9un69Z///Of3BCFpll8ekJfLL/Jd3/v2N1R9+5d9HL5LjLvGm0SJCLFDXVoRYjqwE9JBXZtIcBGlDWWlaTpP4zuY9ne0dkqpQOgyYuhQ6KkFTs1wOGI0muBc8rNVeup+2KXJm1iT9vMhoFTiYWXG4n2gbjyhcUgHUgo333YdRb/EqMBoOMbXgUxndL5j7BuiixgMG1s7aBO44YZrUVphM0vXOsbjCeg0Se8mDVsbW7Rdh7E5eZ6FQTVQfqJvWXnfZ1cBbr/99sXB0d1/rvrdf9cGIRKcNlFybZVWmTAtCms0euoDrERhTBpjYgxWa7QKQHQ9W5ndU+GHf/ZffOQnLjF2ZwXyDfhZl5ePaUim94emzE+AlV9e8ZfeWW9+85vLxSP2m4tedoXz/ptNrrTGEaNE54I043Zda/tgEK6bX+xdN9lrQt63t/cW5VWjeuKwQVurRJzGu9jtjTbsZBiom5rgA67ztK3D+yRhNUYxncsTQ2odR0LawlmTlIBT02Yj04QkH/DjFuU0emB49Zuvp+wXGBXZ3RtjgmCVwQcYti07G9tcPLdO2wWMDhw9eoAbbroBnaVBaN20uBiwxpDptO165ulT1KMWRIXS5ErqwS889sDCX5n/1ovhgXse6ADesfQn/1LVa37EVNygrRBjhxblvdIxSMQaI0orpZUgxGS2qJNYzCqN0gERfFXkql4Pv/Mv/8lH3hXjshI5HmYF8iKcsq/esiord/7hmZ5Ld337Ly8eke8OQaQZR3wrv9iMJj/bNPU/H7v1Wze3hyFqUTpOXd5F4V2avRibVpU4jUn2pNBP5VP3S0yaTQjJKFophXWeUePwYsmN59W33cjc4j5811K7ln6e09Utp8+scfHsNvVwknTpxpBbS/ANB47s4+Zbb6LfL/E+DT0lJv8uk+fsbY9YfehRiBofO79YLmgZ9b/nQ7/4mQ++/q7X23cfecAfP054xztu7RX75n+wNyj+nK3Cm7K+ZGICUSU/MIiE6IlEL1FwQbQyCqtVNEaCqEyKzKpmM6zd/+GvveKBB57eubQtfjk8V+blUiAvEM7I0tKSWltbE+74//jC+9KHsiz15LaJz76s3npwcfG97WSPesRnt9d3f/Q3P/CZjwJm6W+97Ug7LmLhGzGin++G4aFzEaMzYky0kY6I8x0qqKmnbaTzARNc2opEnagm0RNtms8wbohaMRyOWdi3gACZzjh3dp2zp84x3BkTUFg7pajENO/J8j4bF3d48IFHuOmW6zl8+aFEpwmOaTA8Ry4/zPrFTS6evUBhLEHqoIy6C/iVdx95tz9+/IEw1WaMgH8B/Ivv/u/efmO9a9+oVXMsr/RBNPu0lVfoLD9c9K0WA+NuTOdbZ2xuqjzXzoOP3hdVcejy6665/IEHnt5ZXl6Wl/Ls42W5gvzXrDjHjx8Px95x7NX7DlRvHO9tffV3fvP+LwPc/p23Lx66XP92KIe37e7tBi2iVFCJtBjSNosQiWISWzgkq3HnO7zrksVODESfZjIigahStLMNKXjTBaHbqrH9goUjfa659gounrnI2toWo+EINaWvP09Rmb6SM5tcDLVWBB8REzl4eB9Hjx5l0O+hTKKxtM5z9rmzjHdHaGOiqCiF6w/ZnL/+V3/1Y2skmlEA5NixY/q++05cSmn4fXj9699dXXV9c125YG6p5rO/0puTt/cWMnY2293QxQdtZt68cEAZOh0f+8rmn//Az3/0A8eWj5kTL5NziPlvtUAurTgnPnbiYeBhgOVPLRvuIzx45sT37b/G3La13bp5W5noSZEEIdK1LWrKYHM+RSaKj2k7NTVfwAWEdD7wQeh8JEypHCKSSJSiEKOw1tJMWr728BPsbY0xwVAWVZr6q4iOKSskQAqdEZe6S0pjTMoy2V4bs3H+MYxR2MxgTJrx5FlGaS2tFhEVXFVl/dGk/W7g/z62fEydOH4iAPHEiRNOJAmX7rvvmOIOOHTLoXjv0r1BRMYPPMCla/SB7/3B77it31ffubPT/ebK+z/8he9a+tabr7iu/7f279v3N622+wDuAE68TJ6T/2YL5IWr6LFjx/ShQ4fi6sXVuHJ8hR/44XctSbEX8jKXQEb0HhUcbRtQKuCNgijYLlFUQoy0MaJdRMTQSTqTBO8RHVBtwKiILfN0iI8hmYxKyn/HJd5YlpfpwK+S5acoeZ6NzNRRXklI8wqVZhwigsnLqcYlTgM/DZkKmNxiMk0hGlSQLBfUfPl24H0vbHL83kuDACfCpad7GtMjy8vLsrq6KjfffHM8fvz454HPAyzHZXVcjq8Cf+s73vuO9/fmFp5O/88J/7J5OGb18fvnLbfddttlr33X4AkG9aBuYhSUqAjedTRNBwG61hFDhC4mp8GYCJO+S/yotmtxPsW1KR9phi1ehHJukJKYgiN4aHdrslyjM4UPEIOezkyYTrVTTLW26aCvA0jwySrImES/MhqlLDLVrCQqvU66kxjolSU2y4hKYplZCSO1/tyDF6/52MceHP3XHKaXl5cV3KfgjnD8+PGwvIy65ZYlufPOFf9yfShmIE3sV1ZW/Hv/8ju/7cpb5XdamQQflIJ0KB/ujVAqrRyuc8m8wSc1ogsRXKBpPc63dG5M6DwhgArCZHdM7aFamEcbIAb8pKXZa0ErTGFJjrpmyqiV51cHrRKlPRDRIsQuBYzaXKKIEW00VgsqCkEDKuW/i1IpSg0oqh5iNDYzIQvGrz8b3njvz330q3+UriDT6xdeLt2r2RbrP7jBsLICg/nwZ4teSWxcMDrlptW+xWQpazyEqfeQiYQugPaIj4jWeKWCb1sVuglaCcbkEARrFY1vibGD3JBrQ+NaRAW6AErFVBRoogpTL6tpgQjJDUVpgoJoFNE10VotSutglJLMWImplFMOo1FEiVidoUMAXArd0URT5rY/p64Gvrq6uvpH9oJ8MTmRzArkjwGPLN0cARYP5regOzRKUEI3DejJyjw5v/uISCT4gBJNDCppur2LfZ2rUA9pgyMGweZVioG2gm5B4elnOcZovImI8ijvyXSGENES8FM2bgrrhKiZRlKnIuliGzNTipoU47mDZRWNI0QVokZZpTCkFQRzKSNE03QOUVDmWSzLnM3R8A3Ar99889psB/GfgZpdgrTVPC7H46233tpz0h32IRKnuQfO+SmZT6N0xFiPzSSF05gMrA8262LPDGS8Hn9CeTPRWvDOIzqiTdouGSPgU6pubvVUgxFSQA8OUyTefaYUmQiZSkVhsgxtwFAiQqhKK5b9z+08a17TbNm/X8pc7M9ZZbPolFVR5wZlBZtpjNWIUZS9HKVJsWmZRavZi3FWIH8ITK0a41ve8paeCFf6LiIi4r0nepIlD4kPJapA6TxFQhvn+3lf9dU+aTfUT/3Gz3/xh0PIzmW5hRiDMNVj6EheWFBh6m4oWAQdE0nFS0RnEWUUYgQxU/N4nfx1YxSi7ryxRul2X+239Z/67Ge/9PSv/Pyn//nuGfet7M4/c7B3xAwKK7kN3lobMm3IdY4hwypDVhQE0SCGXq84O7vrswL5Q8NaG0XRhZBYwN4n+a5EMFHQCDpmgEF0282VhQ5b/Se2nyu+/d/91Cf/ZpKQmH9fFn2UioGg0EZARWyp0DYF0yijsUZhBZRKFBGrBKMcrQSCFkQlJ0bRkbYjih7pPPZdc3Huf//wr3z6iWPHjpljy8fMB//tifu++qnhmzZPuh9j2N+YLw/oxUGpqkKRZd7bLDhjlMsz64xW3ofgbZGfBli95VCc3fVZgfxnceedSwrg5JnV10Lsee+890Gcd8kWfequLsQocewznB/Ifjs8a375/k8+8y0fuOc3P/rOv/POHCFa3b/P6gwh4F3ATLdXulBkuUIIYIHCgBVyESQGREdMAdlUr5Jyp0G8D1o8ujvwjKF6/W//6u/86NLSkj5x4oQ7cfyEW15eVg88cGL9F37qw//wkS9vv2rtpP+R0bp6wnQLlNminu/tM/vLg+ZA/4BZHAzywoq2WTme3fXZIf0PjbkDZam1U955T9QQNKJSiLuP4rXWptS5bjctZ0+Pf/QX3vfx/xXg2LFjZvLgxAOMtpqmHBiyTIPvEJWjM0U0IErjfEswfaSy6EIjYUo0TLI+dJsGfilIFLxzsd/LlOwt/pNf+tlPPHbXXa+399yz8jyNY9qmlaV7l9TKnSsXP/sR/jfgJ37gr7z32mJOvbo3Zxa6pq7advzNc/vL6NruyvOn6/MANz9y82wFmRXIf0mPF1iBciF3ybm9IQQVUCrE2KncGmV1bkbbvh4Ow4c3np385K/+0sc/GWMUuVskvclRJ07AwNgHYyTozOjYNhHVF6UErQzkhnY8wejEyjVWcLlKk/OoQYFXNQSLJUuuKwrdmxfHJPzo9/25t2/fc8/Hf+XSzOaFx6gpi/mSX/H4/T/zwUeAR17wNT/xB3/tP25n9FmBvEyQjJFBufY1Is652JBnoq1BxbqiuWhO7gy7Xzr3bPuvf+vXPv41SIOxaW7373sLzy0e2GlkB5tbaX0bRSQlSoVIkedsDIdoH6iyjEmW0TroIijvMZmllWScjXhERaq5LOaDTl95qDpqNq54Cj7OzTf/R9/8cSpWkuXlZbmP+9Qdz//THdxyy2pcSvwqeJkN9GYF8seKOwKc0Jm235cbMaOdCuf06u6Izzfj+oOf+tDafRcuPDiC5Au8svIfH4x5FwwkJZ6xiS+ljSLEiCosUUPb1lRZhS4Mse2SX1YMQHKdDzGiTcToQF5ExBqpZXNvsfeaUwB33308Hv9PB1rGKd08/B5p8NLfZqOPWYH8IXH8+PFw8803Zxvr3b8Zd/zGeC//jV/82eoB+L0iWF4+ZuBE+M9xjsaTYdffnzHxUDcTTNsQNSm/3QrGaJq6pl/2MLlFTIOES0xdyKyh9i1apy2YsYJWfYZj7z/xwY9pYCpkmmFWIF9HrK6utqurqz/+ws+9YLUI/zmd9erqksAK6PyWK6/sy2Xkfn1zW7fO4ZuO0WiEuIgINJMJYT559xJBYqSd1GRFBjFip3pwmxl6xXzMyMQ7s7FvXz6ZLQGzAvmG4dixY+aOO2B19VBcWVkJ/zUMVZ2pMGnb2OnIgcsup8xKlAg+evbGI4reHE3TkhUVJQaHxoQU1FP1e8nMTjRa5wQf2d6N0m3uoltzaGHhxgoYzYpkViDfEJw4ccKd+P+p9CmKbKffK9RmHeP6xm40siUiimgEa3MW+/vQ85au7chNRX+wD2qHbxxN6/Ah0DQt4/Hu8+ZvC/sXMV6PvvSZx7tZccwK5CWJlZWVIAL12nB1byeePHTkyNVh8XAI3knbtuw1NcPJkN1mGxFNZjLapqMd1vjGE7zgY6QwltL2KQZQljnKRsbdLltb9eDWW79Jf/WrX50ac82u+axAXlqIH/jAkr7zzpWdH7j6T9w35tm/NJmYkNlClWWPIptn7kAfJRl4IbYdurO4ckLdNtP0K4V0jkDHpAtsbF1ge7QOuo6L1UBiXs8BG3G2jMwK5CUIufPOlXDbba++rBrYb9/YPh1PPrWrF/fldG1gMhLKUlH1+hhV0C9y3DigTMSHjvG4wXXJCXZ7Z5Ph0GHyiM6iDA6UPihfTdyZW4FnEjXm5am/eLFhxsX6I8LU1C7e8Ib5H95/RX7YR+eLKpO5hYK5+RytOly7y3h4gdNnn2R99znObD7BbnOOVtYZNRdY3z7FxK2DaXBxgrWahbk+WqsYjSeorW8CWJvpOGYF8lJbPe6++4R/7WuPLfT61Q9EHaIY9L6D8+jcYsuMKJHBXJ/eoELnFtPLKBYKbKVZPDBg38F5ssxSZcL++YqyLKi7DmOSTWoxyMkr/U0Ad3BiRhGZFchLafVYThHo270jw0k9dmEiEjJ6vYzcKBQKoiLrTfPQgwYRjILgoOhXzB8cUPQMATBFRlkpfB1oGo9RUZkoFFW45eabl7Lj/5hZgcwK5KWD48ePRwSePXnh7P7Li1NN1yJBBVHJBNoFCFowpSUYmT7dEas1vu3IrGXfwoADB3pEAjpT9PoZSgL1pENppZquDkVfXXPLmzdfT0xcsNmVnxXISwcRbvnOiyqr/J/Y2RlibaZC8ETROBeTACrXyaI0pigGYw1N0+C6QF5kLO7vo3QEPL1BTlEKdT0hRiEQgu07WVh03wMw05PPCuQltcUCuPHyq16h7Hh+PG6j0VpC12GiIrSBwhhKq6H14FJ+u84y6g6G446AougX5LkFOvLCMBjkSIj42pPrnvKuo6qabwPh+D9++UQMzArkZY/7FBGJC+qdPrYxdvggisY3RDRd6zCFQhuF6xxOktuuzhTRwtbeCEfA5DlZYVEuYi3oKoXVjOoaZbS4JsSQTW5651947c3EZBU6u/azAnnRd7DgRECIpsd3bw83RSESOo+rGwiRrmsoK0OMHu9C8uUNEaOEwiia4YTgPCYzVHN5MrzWQl5YMg2x64hdJyLiVeXsFVeWt6dvfWx2/2YF8uLG0tKSOn6c8N6/8tZvyea6Vw+bYbDW6HY0QQdLDIHQtZR5kuDiAxqeDxotTEazM6GbOIJEirkKJ5EQk5O7sgpUZNzUxNymnHevDs2u/KxAXiIFkj4evEL/vXwwUuKyKGKouwaT5XgcQaVsPxc7XAw4Ip6IIyC5pW4c9agmxoCpMiTLcN6TGY1oqMqcUNcYhCI3EGXWwZoVyEvhdI66884V//alt1+1eDT7tsl4LyrRCqVpGoeyKbZAFNhS4UMg+oBRaQ4SfUBZRfSBvd0J3geM0RRlhqsblCEFf9qcQmX4nVqVmSEr5E44Zu6++4RnRsuaFciLtz6OKUAuv5bvLxe7Xj3sQpkb8T7Q1J68MNAlq1KdC66L4CP4gGiF945MK4wW9nbGOOcRpch7Oa7rUErIrGbSNJTz82yPJ6ruHOUgvur7f+jwjSLESx20GWYF8uLD3XcEIM4dqP/MpNmhqyOlzekmLToTiiJjsjfCGIUyhtoFHOAlghEcngBkhWUyHlFPOloCdlDhNSgR5rMMV4+xZYk3hr3RyPXmRezgwrel1eO+2T2cFciL8nCuj8vx+J6/+C1vqfbLrRfXt0PQ6GAUbdtSlBavYNw0yXY0BqILBJ+CafLMAJHOO6w1eO+ZDBuUh7Is0VmGD56syggmUrctB3r7GG/WRD2mmqu/DYi3zNwRZwXyYsR0kh0PXh1/yFQ+G+7UQecZbfR4H+j1C2Js6YInLzOUj4iX1L2S5OCuUUj0KBuJROrRGNU6rFJUVUXTdEiuKIqS8XCH+bkBXRP1zmhENsdt7373sQNTWfDsPs4K5EUFOX73CX/TTW8Z9C/T7xzubkc/caqwfXAe5wPlIIM4QdmIKQ1d26aEXECiYJQgUSHBY0sFStGOarqpYKrX79G1Aa1hkBc03RByoSgHsrm164sF2X/ZjfH7SGZxs/s4K5AX0eF8+ZhGiH/yuwZ/ff6gObq9vhskogoNoY2goehbJp0jKEFnhg5HxGGjwmDQCKKg9pAVGVqEdtjhW49zHUVlQYN3ESnBW02YTLj2smsZ7Y3pQs38EfU9QJyehWaYFciL5Gw+ba8Wffn+1q/FvZ1OkseVZ1x78iojt5F21KElI88KCElIrpVGaUs0iqywEBVKB6y1TEaBZtIRvUdbyMucLgQKE5nLSrZHWywu9inVIb25sxFsr37L9//dY7cfl+Nhxu6dFciLDXFSb3TD4ZZINGRlRpCID5HBfI8YWtpJQ88O2N8/ROgSxcRNL3uUiK1yRDTRQ5Ybmg7Gow4ICJ7eoI8TIdORQgy1ckwYcvVlr2R3ay/EstVlT/5BahrMbsisQF4k5w8B3vzmN5ex5/ePJo5SaxZ7PXAKayK9eaHuamrX0I9zzOkDNLFBtAIUVhlMFKwF5yJhkqFsIM8K6glIcISuozco6WU9vAoEPLlSrO9tc8ORK5FJqTdHw9gbhDve8c3vOHTnnSueOBsazgrkG4ylpSWFEC+7vv+W3qJcPdz14fqjr1ELvT5NN8bkgjVC0zW4FvbPXUHA4YNCa5MSp4wQBHJrySJ04xZQKKuYTFqChxjTAX2h6JP7HlocBBiPh6jccXjxStm9MA52oZ07etveOwDuXVma3c9ZgXxjcUmoNLhsvKTLOlrXD1dfdjWda2m7jirLsDHiW4it5aqD1yOmIQgYrUBAjAGt0EajMkXdRXwQREW8F9ouAIIoT9HrE/UckkXqzuOjY23nNK+8+nX4vS50DEN/rvcPjx07ZpaWVmaH9VmBfGPxj5NQSar5+K2T8VgWqoOqX2g6HN4Lg7xEdRE6g/aWQTnAxTHKpMxBpTUms8i0i0WhaH0E0WgdETRN3QEQQkeRFezrHaHSiipo6BoubJ6jUovxiv1X2HpTq8k25y5evFhMTa1n26xZgXxjsLyMihHe8Z63vLZY4Prh7jheve8qZRTEqBFlya2i7RqcC2hTMN8vaVxLrkHrDJUVFDqShYxgA/NVQeaTJDcqj840k9H0xgi0MubI3A0IPXRh6epA59v46LNfDuPTh59df8T8T//q//zEO1dXV4ekzI/ZZH1WIN8opIHc9a8p3lMuAkHaV+67hlHnidFQRSHPCzrnaZpAZeaoqoKma8hNngaEWiPWE1UgeM9NV17PK697Na1riUbIJKMbRaIHpYWR7NAbZFzd+yYECMp0kQk1m+7X/+3Xblv5xQf+6azFOyuQF0X3iuRHpY2S789Mqy7vvTo/NLiWYbuNayM9k2FEh7r1rp7EOJfvD8pqV3djn0tOdCGGcQw6SyKoXFkOzh2OVxy6wXvXRWIMi705l6syjocdIRK7GMJee9G/+VXH/FxmGPTFxvEBaYb9n14bP7N2112vtysrs7PHHxdm1qP/5bhkiRt21sLP2HLuL6w/bTZ/Y+3ztx15zaZ2XSd5nimrtFJilPM1c/0FQURpq1CtDTqzan9ppY2ToNEyX/Yiyqh+tU8XmUK8lvleplzI2ds76/PFTM+VudRqxPp6h95+hfNx7dfPPal/7Ffvve9+QN1zzwPd7Nb8sb4VZ/ivhAb8X/obx973lnccvuuhJx7k8OFFmovzJx/72qkvN0xuj5PB+uXzN/5U2Hf21de/Vt/13DN7W5uPDTZ61+3coLPAjVddw/ZauPD4V+oPFvvW/+xo3Oxk3dyjnYlv23/dznw3KUa2XniysgfXHrn/wi/tntv93c899NBj6Ty0rGYhnLMCeVFiaWlJ33vvSribZfl/vvcjVx29ct8PtW701oXF6tVrZ5vv/zfv+9RvHfuOY4fHzYXui594dOM7b7998cZ36k9t7/jx/b/R/Ok3f0fx01p1N2+vq796cP8VW//3j9/78I//+L3lv/t3H3cPPHBP923fe/M7r7q29/dOPd584KMffPBf/cFGwerqkvzHMhJnmOFFi8XF6+YBlu79vUPzXXfdZV/wIqouff7NVyyVv/fQL6sXFt/ve4MJLMdldezYMTOz+ZnhJbkKLy8fM3FK83hBwKa8oDBEfu8f5NLXLi0t6RcUx/Nfv7yMWrp3SU8LYrbKz/DfzJZVZtvbGWaYYYYZZphhhhlmmGGGGWaYYYYZZphhhhlmmGGGGWaYYYYZZphhhhlmmGGGGWaYYYYZZphhhhlmmGGGGWb448P/C+jE4PBJG1BpAAAAAElFTkSuQmCC' alt="bouquet" style={{ width: 38, height: 38, objectFit: 'contain', mixBlendMode: 'screen' }} />,
                  color: '#2a5a1a',
                  title: 'Le Jardin de soutien',
                  desc: "Offrez un élan à un jardin fragile — un geste bienveillant, sans attente de retour, comme de la lumière partagée. Chaque élan renforce l'énergie collective du groupe.",
                },
                {
                  icon: <span style={{ fontSize:'var(--fs-emoji-lg, 28px)', lineHeight: 1 }}>🌻</span>,
                  color: '#7a2020',
                  title: 'Mes ami(e)s',
                  desc: "Retrouvez ici les jardiniers avec lesquels vous avez créé un lien particulier. Cet espace favorise les interactions, l'attention mutuelle et la bienveillance, pour avancer ensemble dans un climat de confiance.",
                },
              ].map((item, i) => (
                <div key={item.title} style={{ display: 'flex', gap: 12, paddingTop: i > 0 ? 14 : 0, borderTop: i > 0 ? '1px solid var(--surface-2)' : 'none' }}>
                  <div style={{ flexShrink: 0, width: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize:16, color: item.color, marginBottom: 4, fontWeight: 700 }}>{item.title}</div>
                    <div style={{ fontSize:'var(--fs-h5, 11px)', color: '#1a1208', lineHeight: 1.7 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Messages éphémères */}
          {messages.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize:'var(--fs-h5, 9px)', color: '#1a1208', letterSpacing: '.12em', textTransform: 'uppercase' }}>✦ Des petites attentions à votre égard !</div>
              {messages.map((c, i) => {
                const z = ZONE_MAP[c.zone]
                const sender = flowerName(c.sender)
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(var(--red-rgb),.04)', border: '1px solid rgba(var(--red-rgb),.1)', borderRadius: 14, animation: `fadeInUp .3s ease ${i * 0.05}s both` }}>
                    <span style={{ fontSize:'var(--fs-emoji-md, 20px)', flexShrink: 0 }}>💐</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize:'var(--fs-h5, 11px)', color: '#1a1208', marginBottom: 2 }}>{sender}</div>
                      <div style={{ fontSize:'var(--fs-h5, 11px)', color: '#1a1208', fontStyle: 'italic', lineHeight: 1.55 }}>"{c.message_ia}"</div>
                      <div style={{ fontSize:'var(--fs-h5, 9px)', color: z?.color ?? 'var(--green)', marginTop: 3 }}>{z?.icon} {z?.name} · {timeAgo(c.created_at)}</div>
                    </div>
                    <div onClick={() => isPremium ? handleMerci(c.id, c.sender_id) : onUpgrade?.()} style={{ flexShrink: 0, minHeight: 32, padding: '0 14px', borderRadius: 100, fontSize:'var(--fs-h5, 10px)', background: 'rgba(var(--gold-rgb),.1)', border: '1px solid rgba(var(--gold-rgb),.25)', color: isPremium ? 'rgba(var(--gold-rgb),.9)' : 'rgba(var(--gold-rgb),.35)', cursor: isPremium ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', WebkitTapHighlightColor: 'transparent' }}>{isPremium ? '🙏 Merci' : '🔒 Merci'}</div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>

      {createPortal(
        particles.map(p => (
          <Particle key={p.id} x={p.x} y={p.y} color={p.color} char={p.char} vx={p.vx} vy={p.vy} dur={p.dur}
            onDone={() => setParticles(prev => prev.filter(q => q.id !== p.id))} />
        )),
        document.body
      )}
    </>
  )
}

export { ScreenClubJardiniers }
