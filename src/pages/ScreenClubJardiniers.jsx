// ─────────────────────────────────────────────────────────────────────────────
//  ScreenClubJardiniers.jsx
//  3 onglets : Égrégore · Mes Fleurs · Le Jardin
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAnalytics } from '../hooks/useAnalytics'
import { supabase } from '../core/supabaseClient'
import { logActivity } from '../utils/logActivity'
import { useIsMobile, Toast, timeAgo } from './dashboardShared'

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────
const ZONES = [
  { key: 'zone_souffle',  name: 'Souffle',  icon: '🌬️', color: '#88b8e8', angle: 90  },
  { key: 'zone_feuilles', name: 'Feuilles', icon: '🍃', color: '#60d475', angle: 18  },
  { key: 'zone_fleurs',   name: 'Fleurs',   icon: '🌸', color: '#e088a8', angle: 306 },
  { key: 'zone_racines',  name: 'Racines',  icon: '🌱', color: '#96d485', angle: 234 },
  { key: 'zone_tige',     name: 'Tige',     icon: '🌿', color: '#7ad490', angle: 162 },
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

function petalPath(angleDeg, pct, cx = 130, cy = 130) {
  const minR = 22, maxR = 78
  const r    = minR + (pct / 100) * (maxR - minR)
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
      fontSize: 18, opacity: pos.o, pointerEvents: 'none', zIndex: 9999,
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
function FleurSVG({ zonesData, pulseKey, breathPhase, size = 260, svgRef }) {
  const cx = 130, cy = 130

  const globalVit = Math.round(
    ZONES.reduce((s, z) => s + (zonesData[z.key] ?? 5), 0) / ZONES.length
  )


  return (
    <svg ref={svgRef} viewBox="0 0 260 260" width={size} height={size} style={{ overflow: 'visible' }}>
      <defs>
        {ZONES.map(z => (
          <radialGradient key={z.key} id={`pg-${z.key}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={z.color} stopOpacity={pulseKey === z.key ? '.9' : '.65'} />
            <stop offset="100%" stopColor={z.color} stopOpacity=".05" />
          </radialGradient>
        ))}
        <radialGradient id="core-g" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ede0c0" stopOpacity="1" />
          <stop offset="100%" stopColor="#b88030" stopOpacity=".5" />
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
                <path d={petalPath(z.angle, Math.min(100, pct + 10), cx, cy)}
                  fill={z.color} opacity=".14" filter="url(#glow2)"
                  style={{ animation: 'petal-pulse .7s ease-out forwards' }} />
              )}
              <path
                d={petalPath(z.angle, pct, cx, cy)}
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
        fill="rgba(8,14,10,.92)" fontWeight="500">
        {globalVit}%
      </text>
      {/* label vitalité */}
      <text x={cx} y={cy + 8} textAnchor="middle" dominantBaseline="middle"
        fontSize="5.5" fontFamily="Jost, sans-serif"
        fill="rgba(8,14,10,.55)" letterSpacing=".08em">
        VITALITÉ
      </text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONGLET ÉGRÉGORE
// ─────────────────────────────────────────────────────────────────────────────
function TabEgregore({ userId, myName, feedKey, onFeedRefresh, onParticleBurst }) {
  const isMobile                      = useIsMobile()
  const [zonesData, setZonesData]     = useState(Object.fromEntries(ZONES.map(z => [z.key, 50])))
  const [activeCount, setActiveCount] = useState(0)
  const [pulseKey, setPulseKey]       = useState(null)
  const svgRef = useRef(null)
  const [breathPhase, setBreath]      = useState(0)
  const [intention, setIntention]     = useState(null)
  const [joined, setJoined]           = useState(false)
  const [resonance, setResonance]     = useState(null)
  const [flux, setFlux]               = useState([])
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
          // Ajouter au flux
          const zInfo = ZONE_MAP[z]
          setFlux(prev => [{
            id: Date.now(), icon: '💐',
            text: `Une fleur vient d'envoyer de la lumière sur les ${zInfo?.name ?? z}`,
            color: zInfo?.color ?? '#96d485', t: 'à l\'instant',
          }, ...prev.slice(0, 8)])
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
    setIntention(int ?? { text: 'Paix intérieure', description: 'Chaque rituel complété, chaque ❤️ envoyé nourrit cette énergie collective.' })

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
    const today = new Date().toISOString().slice(0, 10)
    if (joined) {
      await supabase.from('intentions_joined').delete().eq('user_id', userId).eq('date', today)
      setJoined(false)
    } else {
      window.dispatchEvent(new CustomEvent('analytics_track', { detail: { event: 'intention_join', props: {}, page: 'club', cat: 'social' } }))
      await supabase.from('intentions_joined').insert({ user_id: userId, date: today })
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
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 28 : 36, fontWeight: 300, color: '#e8d4a8', letterSpacing: '.04em', lineHeight: 1 }}>L'Égrégore</div>
          <div style={{ fontSize: isMobile ? 13 : 14, color: 'rgba(238,232,218,0.50)', marginTop: 6, letterSpacing: '.04em' }}>
            <span style={{ color: 'rgba(150,212,133,0.85)', fontWeight: 500 }}>{activeCount}</span>
            {' '}fleur{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''} aujourd'hui
          </div>
        </div>

        {/* Fleur */}
        <FleurSVG zonesData={zonesData} pulseKey={pulseKey} breathPhase={breathPhase} size={isMobile ? 300 : 380} svgRef={svgRef} />

        {/* Intention + bouton + résonance */}
        {intention && (
          <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 14, marginTop: isMobile ? -8 : -16 }}>

            {/* Label */}
            <div style={{ fontSize: isMobile ? 11 : 12, color: 'rgba(232,196,100,0.65)', letterSpacing: '.12em', textTransform: 'uppercase', textAlign: 'center' }}>✦ Intention collective du jour</div>

            {/* Texte de l'intention — hero */}
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 28 : 36, fontWeight: 300, color: '#f0e8d0', lineHeight: 1.15, textAlign: 'center', letterSpacing: '-.01em' }}>{intention.text}</div>

            {/* Description */}
            <div style={{ fontSize: isMobile ? 14 : 15, color: 'rgba(238,232,218,0.60)', lineHeight: 1.7, textAlign: 'center' }}>{intention.description}</div>

            {/* Bouton rejoindre */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div onClick={handleJoinIntention} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                minHeight: isMobile ? 44 : 40, padding: '0 28px',
                borderRadius: 100, fontSize: isMobile ? 14 : 13,
                cursor: 'pointer',
                background: joined ? 'rgba(232,196,100,0.14)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${joined ? 'rgba(232,196,100,0.45)' : 'rgba(255,255,255,0.14)'}`,
                color: joined ? '#e8d4a8' : 'rgba(238,232,218,0.60)',
                transition: 'all .2s', WebkitTapHighlightColor: 'transparent',
                fontWeight: joined ? 500 : 300,
              }}>
                {joined ? '✓ Vous nourrissez l\'intention' : '🌿 Rejoindre l\'intention'}
              </div>
            </div>

            {/* Résonance */}
            {resonance && (() => {
              const z = ZONE_MAP[resonance.zone]
              const pct = (resonance.current / resonance.threshold) * 100
              return (
                <div style={{ background: `${z?.color}0a`, border: `1px solid ${z?.color}28`, borderRadius: 14, padding: isMobile ? '14px 16px' : '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>🔥</span>
                      <div style={{ fontSize: isMobile ? 14 : 13, color: z?.color, fontWeight: 500 }}>Résonance {z?.name}</div>
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 22 : 20, color: z?.color, fontWeight: 300 }}>{resonance.current}<span style={{ fontSize: 12, opacity: .6 }}>%</span></div>
                  </div>
                  <div style={{ height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 100, width: `${pct}%`, background: `linear-gradient(90deg,${z?.color}88,${z?.color})`, transition: 'width .6s ease' }} />
                  </div>
                  <div style={{ fontSize: isMobile ? 12 : 11, color: 'rgba(238,232,218,0.38)' }}>Seuil {resonance.threshold}% · encore <strong style={{ color: z?.color }}>{resonance.threshold - resonance.current} points</strong></div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* ── MESSAGES REÇUS ── */}
      {pendingMercis.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: isMobile ? 12 : 11, color: 'rgba(238,232,218,0.45)', letterSpacing: '.10em', textTransform: 'uppercase' }}>✦ Messages reçus pour vous</div>
          {pendingMercis.slice(0, 3).map(c => {
            const z      = ZONE_MAP[c.zone]
            const sender = flowerName(c.sender)
            return (
              <div key={c.id} style={{ background: 'rgba(255,100,100,0.05)', border: '1px solid rgba(255,100,100,0.16)', borderRadius: 14, padding: isMobile ? '16px' : '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>💐</span>
                  <div>
                    <div style={{ fontSize: isMobile ? 15 : 14, color: 'rgba(238,232,218,0.90)', fontWeight: 500 }}>{sender}</div>
                    <div style={{ fontSize: isMobile ? 12 : 11, color: z?.color ?? '#96d485', marginTop: 2 }}>{z?.icon} {z?.name} · {timeAgo(c.created_at)}</div>
                  </div>
                </div>
                <div style={{ fontSize: isMobile ? 14 : 13, color: 'rgba(238,232,218,0.70)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 12 }}>"{c.message_ia}"</div>
                <div onClick={() => handleMerci(c.id, c.sender_id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: isMobile ? '8px 20px' : '7px 18px', borderRadius: 100, fontSize: isMobile ? 14 : 13, background: 'rgba(255,200,100,0.10)', border: '1px solid rgba(255,200,100,0.30)', color: 'rgba(255,220,140,0.9)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>🙏 Remercier</div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── FLUX ÉNERGIE ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: isMobile ? 12 : 11, color: 'rgba(238,232,218,0.38)', letterSpacing: '.10em', textTransform: 'uppercase', marginBottom: 2 }}>Flux d'énergie</div>
        {flux.length === 0 && (
          <div style={{ fontSize: isMobile ? 14 : 13, color: 'rgba(238,232,218,0.30)', fontStyle: 'italic' }}>Le flux s'animera dès que des fleurs interagissent…</div>
        )}
        {flux.map((item, i) => (
          <div key={item.id ?? i} style={{ display: 'flex', gap: 12, padding: isMobile ? '12px 14px' : '10px 14px', borderRadius: 12, background: `${item.color}07`, border: `1px solid ${item.color}15` }}>
            <span style={{ fontSize: isMobile ? 18 : 16, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: isMobile ? 14 : 13, color: 'rgba(238,232,218,0.72)', lineHeight: 1.55 }}>{item.text}</div>
              <div style={{ fontSize: isMobile ? 12 : 11, color: 'rgba(238,232,218,0.30)', marginTop: 3 }}>{item.t}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  CARTE FLEUR — format card pour la grille
// ─────────────────────────────────────────────────────────────────────────────
function FleurCard({ fleur, userId, senderName, alreadySent, bouquetMember, badge, onBadgeClick, onCoeurSent, expanded, pendingMercisForFleur, onMerci }) {
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

  return (
    <div style={{
      background: isFragile ? 'rgba(255,120,60,.05)' : 'rgba(255,255,255,.025)',
      border: `1px solid ${isFragile ? 'rgba(255,140,80,.18)' : 'rgba(255,255,255,.07)'}`,
      borderRadius: 14, padding: 'clamp(10px, 2.5vw, 14px) clamp(8px, 2vw, 12px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      position: 'relative', transition: 'border-color .2s',
    }}>

      {/* Badge bouquet */}
      {bouquetMember && (
        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 10 }}>💚</div>
      )}

      {/* Badge merci */}
      {badge > 0 && (
        <div onClick={onBadgeClick} style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 9, cursor: 'pointer',
          background: 'rgba(255,200,100,.15)', border: '1px solid rgba(255,200,100,.3)',
          borderRadius: 100, padding: '2px 6px', color: 'rgba(255,220,140,.9)',
          WebkitTapHighlightColor: 'transparent',
        }}>🙏{badge}</div>
      )}

      {/* Anneau vitalité */}
      <div style={{
        width: 'clamp(40px, 8vw, 52px)', height: 'clamp(40px, 8vw, 52px)', borderRadius: '50%', flexShrink: 0,
        background: `conic-gradient(${isFragile ? 'rgba(255,140,60,.85)' : '#96d485'} ${vit * 3.6}deg, rgba(255,255,255,.07) 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 'clamp(30px, 6vw, 40px)', height: 'clamp(30px, 6vw, 40px)', borderRadius: '50%',
          background: 'linear-gradient(160deg,#0d1f0d,#0a130a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Cormorant Garamond',serif", fontSize: 12,
          color: isFragile ? 'rgba(255,160,80,.9)' : 'rgba(200,240,184,.8)',
        }}>{vit}%</div>
      </div>

      {/* Nom */}
      <div style={{
        fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(11px, 2.8vw, 13px)',
        color: isFragile ? '#e8c8a0' : '#e8d4a8', textAlign: 'center',
        lineHeight: 1.3, width: '100%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{name}</div>

      {/* Zones fragiles */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', minHeight: 18 }}>
        {fragile.length > 0
          ? fragile.map(z => (
              <span key={z.key} style={{ fontSize: 13 }} title={`${z.name} : ${Math.round(plant[z.key]??0)}%`}>{z.icon}</span>
            ))
          : <span style={{ fontSize: 9, color: 'rgba(150,212,133,.35)' }}>✓ bonne santé</span>
        }
      </div>

      {/* Bouton 💐 intention */}
      <div
        onClick={handleSend}
        style={{
          width: 'clamp(38px, 8vw, 36px)', height: 'clamp(38px, 8vw, 36px)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: alreadySent || sending ? 'default' : 'pointer',
          background: alreadySent ? 'rgba(255,255,255,.04)' : 'rgba(150,212,133,.12)',
          border: `1px solid ${alreadySent ? 'rgba(255,255,255,.07)' : 'rgba(150,212,133,.3)'}`,
          fontSize: 16, opacity: sending ? .5 : 1,
          transition: 'transform .15s, background .2s',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => { if (!alreadySent && !sending) e.currentTarget.style.transform = 'scale(1.15)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        {sending ? '…' : alreadySent ? '✓' : '💐'}
      </div>

      {/* Messages dépliés */}
      {expanded && badge > 0 && (
        <div style={{ width: '100%', borderTop: '1px solid rgba(255,200,100,.12)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(pendingMercisForFleur ?? []).map(c => {
            const z = ZONE_MAP[c.zone]
            return (
              <div key={c.id} style={{ fontSize: 10, color: 'rgba(238,232,218,.55)', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{c.message_ia}"
                <div style={{ fontSize: 9, color: z?.color, marginTop: 2, fontStyle: 'normal' }}>{z?.icon} {z?.name}</div>
                <div onClick={() => onMerci?.(c.id, c.sender_id)} style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 100, fontSize: 9, background: 'rgba(255,200,100,.1)', border: '1px solid rgba(255,200,100,.22)', color: 'rgba(255,220,140,.9)', cursor: 'pointer' }}>🙏 Merci</div>
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
function BouquetCard({ fleur, userId, senderName, alreadySent, onCoeurSent, badge, onBadgeClick, expanded, pendingMercisForFleur, onMerci, intentionMode }) {
  const [sending, setSending] = useState(false)
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
      setSentAt(Date.now())
      onCoeurSent?.({ receiverName: name, zone: weakest.key, receiverId: fleur.id })
    } catch(e) { console.error(e) }
    finally { setSending(false) }
  }

  const isSent = alreadySent || sentAt !== null

  return (
    <div style={{
      background: isFragile ? 'rgba(255,120,60,.05)' : 'rgba(255,255,255,.02)',
      border: `1px solid ${isFragile ? 'rgba(255,140,80,.16)' : 'rgba(255,255,255,.06)'}`,
      borderRadius: 12, padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {/* Anneau vitalité */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: `conic-gradient(${isFragile ? 'rgba(255,140,60,.85)' : '#96d485'} ${vit * 3.6}deg, rgba(255,255,255,.07) 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 27, height: 27, borderRadius: '50%',
          background: 'linear-gradient(160deg,#0d1f0d,#0a130a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontFamily: "'Cormorant Garamond',serif",
          color: isFragile ? 'rgba(255,160,80,.9)' : 'rgba(200,240,184,.7)',
        }}>{vit}%</div>
      </div>

      {/* Nom + zones fragiles */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Cormorant Garamond',serif", fontSize: 13,
          color: isFragile ? '#e8c8a0' : '#e8d4a8',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</div>
        <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
          {fragile.length > 0
            ? fragile.slice(0, 3).map(z => <span key={z.key} style={{ fontSize: 11 }}>{z.icon}</span>)
            : <span style={{ fontSize: 9, color: 'rgba(150,212,133,.35)' }}>✓</span>
          }
        </div>
      </div>

      {/* Badge merci */}
      {badge > 0 && (
        <div onClick={onBadgeClick} style={{ fontSize: 10, cursor: 'pointer', background: 'rgba(255,200,100,.12)', border: '1px solid rgba(255,200,100,.25)', borderRadius: 100, padding: '2px 6px', color: 'rgba(255,220,140,.85)', flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>🙏{badge}</div>
      )}

      {/* Bouton ❤️ / 💐 */}
      <div
        onClick={handleSend}
        style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: isSent || sending ? 'default' : 'pointer',
          background: isSent ? 'rgba(255,255,255,.04)' : intentionMode ? 'rgba(150,212,133,.15)' : 'rgba(232,80,80,.15)',
          border: `1px solid ${isSent ? 'rgba(255,255,255,.07)' : intentionMode ? 'rgba(150,212,133,.4)' : 'rgba(232,80,80,.4)'}`,
          boxShadow: isSent ? 'none' : intentionMode ? '0 0 8px rgba(150,212,133,.25)' : '0 0 8px rgba(232,80,80,.25)',
          opacity: sending ? .5 : 1, transition: 'all .2s',
          WebkitTapHighlightColor: 'transparent', position: 'relative',
          gap: 1,
        }}
        onMouseEnter={e => { if (!isSent && !sending) e.currentTarget.style.transform = 'scale(1.12)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        title={isSent ? `Disponible dans ${cooldown ?? '…'}` : intentionMode ? `Envoyer 💐 sur ${weakest.name}` : `Envoyer ❤️ sur ${weakest.name}`}
      >
        <div style={{ fontSize: isSent ? 13 : 15, filter: isSent ? 'none' : intentionMode ? 'drop-shadow(0 0 4px rgba(150,212,133,.5))' : 'drop-shadow(0 0 4px rgba(255,80,80,.5))', opacity: isSent ? .25 : 1, lineHeight: 1 }}>
          {sending ? '…' : intentionMode ? '💐' : '❤️'}
        </div>
        {isSent && cooldown && null}
      </div>

      {/* Messages dépliés */}
      {expanded && badge > 0 && (
        <div style={{ width: '100%', borderTop: '1px solid rgba(255,200,100,.1)', paddingTop: 8, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(pendingMercisForFleur ?? []).map(c => {
            const z = ZONE_MAP[c.zone]
            return (
              <div key={c.id}>
                <div style={{ fontSize: 10, color: 'rgba(238,232,218,.55)', fontStyle: 'italic', lineHeight: 1.5 }}>"{c.message_ia}"</div>
                <div onClick={() => onMerci?.(c.id, c.sender_id)} style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 100, fontSize: 9, background: 'rgba(255,200,100,.1)', border: '1px solid rgba(255,200,100,.2)', color: 'rgba(255,220,140,.9)', cursor: 'pointer' }}>🙏 Merci</div>
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', zIndex: 400, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(160deg,#0d200d,#091209)', border: '1px solid rgba(150,212,133,.15)', borderRadius: isMobile ? '20px 20px 0 0' : 20, width: '100%', maxWidth: isMobile ? '100%' : maxWidth, maxHeight: isMobile ? '92vh' : '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {isMobile && <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.18)' }} /></div>}
        {children}
        <div onClick={onClose} style={{ textAlign: 'center', padding: '12px 0 20px', fontSize: isMobile ? 14 : 13, color: 'rgba(238,232,218,.45)', cursor: 'pointer', letterSpacing: '.04em' }}>Fermer</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODAL 1 — EGREGORE
// ─────────────────────────────────────────────────────────────────────────────
function ModalEgregore({ userId, onClose, onParticleBurst }) {
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
    else setIntention({ text: 'Prendre soin de soi', description: 'Chaque rituel complété, chaque ❤️ envoyé nourrit cette énergie collective et renforce le groupe.' })
  }

  function spawnParticles() {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = rect.width/260, scaleY = rect.height/260
    const PETALS = ['🌸','🌺','🌼','🌷','💮'], STARS = ['✨','⭐','🌟','💫','✦']
    const ps = []
    ZONES.forEach(z => {
      const pct = zonesData[z.key] ?? 50
      const pos = polarToXY(z.angle, (28+(pct/100)*95)*.6, 130, 130)
      const bx = rect.left+pos.x*scaleX, by = rect.top+pos.y*scaleY
      for (let i=0;i<3;i++) ps.push({ id:`${z.key}-p-${i}-${Date.now()}-${Math.random()}`, x:bx+(Math.random()-.5)*20, y:by+(Math.random()-.5)*20, char:PETALS[Math.floor(Math.random()*PETALS.length)], vx:.35+Math.random()*.5, vy:-(.35+Math.random()*.5), dur:3200+Math.random()*1400, color:null })
      for (let i=0;i<2;i++) { const a=Math.random()*Math.PI*2, s=.9+Math.random()*1.1; ps.push({ id:`${z.key}-s-${i}-${Date.now()}-${Math.random()}`, x:bx+(Math.random()-.5)*14, y:by+(Math.random()-.5)*14, char:STARS[Math.floor(Math.random()*STARS.length)], vx:Math.cos(a)*s, vy:Math.sin(a)*s, dur:900+Math.random()*500, color:null }) }
    })
    onParticleBurst?.(ps)
  }

  async function handleJoin() {
    const today = new Date().toISOString().slice(0,10)
    if (joined) {
      await supabase.from('intentions_joined').delete().eq('user_id', userId).eq('date', today)
      setJoined(false)
    } else {
      await supabase.from('intentions_joined').insert({ user_id: userId, date: today })
      setJoined(true)
      ZONES.forEach((z,i) => setTimeout(() => { setPulseKey(z.key); setTimeout(() => setPulseKey(null), 1800) }, i*160))
      spawnParticles()
    }
  }

  return (
    <Modal onClose={onClose} maxWidth={500}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '8px 24px 16px' }}>

        {/* Fleur — grand format, sans vide */}
        <div style={{ marginTop: -20, marginBottom: -28 }}>
          <FleurSVG zonesData={zonesData} pulseKey={pulseKey} breathPhase={breathPhase} size={isMobile ? 340 : 420} svgRef={svgRef} />
        </div>

        {/* Compteur fleurs */}
        <div style={{ fontSize: isMobile ? 13 : 13, color: 'rgba(238,232,218,.55)', letterSpacing: '.06em' }}>
          Collectif de <span style={{ color: 'rgba(150,212,133,.95)', fontWeight: 600 }}>{activeCount}</span> fleur{activeCount > 1 ? 's' : ''} actives
        </div>

        {intention && (<>
          {/* Label */}
          <div style={{ fontSize: isMobile ? 11 : 11, color: 'rgba(232,196,100,.70)', letterSpacing: '.12em', textTransform: 'uppercase' }}>✦ Intention collective du jour</div>

          {/* Titre de l'intention — hero */}
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 32 : 36, fontWeight: 300, color: '#f0e8d0', lineHeight: 1.1, textAlign: 'center', letterSpacing: '-.01em' }}>{intention.text}</div>

          {/* Description */}
          <div style={{ fontSize: isMobile ? 14 : 14, color: 'rgba(238,232,218,.62)', lineHeight: 1.7, textAlign: 'center' }}>{intention.description}</div>
        </>)}

        {/* Bouton rejoindre */}
        <div onClick={handleJoin} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          minHeight: isMobile ? 48 : 44, padding: '0 28px',
          borderRadius: 100, fontSize: isMobile ? 15 : 14,
          cursor: 'pointer',
          background: joined ? 'rgba(232,196,100,.15)' : 'rgba(150,212,133,.10)',
          border: `1px solid ${joined ? 'rgba(232,196,100,.50)' : 'rgba(150,212,133,.35)'}`,
          color: joined ? '#e8d4a8' : '#c8f0b8',
          fontWeight: joined ? 500 : 300,
          transition: 'all .2s', WebkitTapHighlightColor: 'transparent',
          width: '100%', justifyContent: 'center',
        }}>
          {joined ? '✓ Vous nourrissez l\'intention' : '🌸 Rejoindre l\'intention collective'}
        </div>

        {/* Résonance */}
        {resonance && (() => {
          const z = ZONE_MAP[resonance.zone]
          const pct = (resonance.current / resonance.threshold) * 100
          return (
            <div style={{ width: '100%', background: `${z?.color}0a`, border: `1px solid ${z?.color}28`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🔥</span>
                  <div style={{ fontSize: isMobile ? 14 : 13, color: z?.color, fontWeight: 500 }}>Résonance {z?.name}</div>
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 22 : 20, color: z?.color }}>
                  {resonance.current}<span style={{ fontSize: 12, opacity: .6 }}>%</span>
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 100, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 100, background: `linear-gradient(90deg,${z?.color}88,${z?.color})`, transition: 'width .6s ease' }} />
              </div>
              <div style={{ fontSize: isMobile ? 12 : 12, color: 'rgba(238,232,218,.40)' }}>
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
function ModalJardin({ userId, myName, bouquetIds, onClose, onCoeurSent }) {
  const [list, setList]     = useState([])
  const [ready, setReady]   = useState(false)
  const [excluded, setExcluded] = useState(new Set())

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 24px 12px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <img src='data:image/png;base64,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pmENzt9VRyHPCJ4izixzxnn9EM4aNNERDAREQBei/wAGVjop6u7X+ZoNRA5tPET+kEZOPf8AsF50XVfwzajqrVr1lpZMW01xY8OZvu9rHEY8ts/YLSxPa8FrROKvju9z278fE1gZFISQMZ8lsU9Y0sAadlRaetdxg52Klaat/Mb4uaoJ5PXPTqHBc4agFo32Xmv8bVmqa21WqupYnSmCU8TWgkkHbYAeZXeaasB24uSp3atFTVTaGaeNkndlxAdjntj98LdT2fM/Qoa2rNEjwRU089LO6CphkglbjiZI0tcMjO4KxLrP4jLWW3O33tgJEsZp5TtgFvib65ILv+VcmVumz4kFL3PLyWHgIiKQwEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBfrGue8MY0uc44AAySV+LqX4ZX2xnaNH/EYmyExEMBGcDqccs8lhvCybQjuko+5n7LuwjWGs5YqieE2u3uILpJm/mObschvsevXovWvZb2RaL0TQMjprfFV14aA+qmbmR58z9c+is1DdqGkgZBSh/CB1K3Y7jFLuWtB8+qqSucjv0+OjWsyWWSkFHDG1oZCxrW8gByVf7SdAaf1zpqotN0ooS57D3UoaA6N3Qg9FO01Y3YcfEPXmP81tmVpj42uBHotoyN518bWuD+ZPaXo256G1TUWS5MdlhJikxs9vvyyqwvbnb/oa26+oZOBghulM53w0oG+SRkHcbHHL+68VXCjqaCtmoqyF0NRC8skjdzaQp4TUkcjW6KelniS4fRgREW5SCktL3WSyaioLtEXZpZ2yEAAktB8Q323GR9VGohlNp5R7foa+OppYqiCQPie0OY4dQeqlqSr5b7riPYDqv+Jab/glTJ/pNuAYzP6oj8p5dPl+g811SCox1XOlHbLB7rT6haiqNiLnR1YLc52UJ2gOdNboZGnIa/BHvj/Ja9LVubnidt0WPUFZG+0TNeceHOfXKNblgj1EN9Uk/Y5T2q2Ko1HpaWioYHT1scjJqeNvNzgcEf8AK5y0tBfhpuddTuqtXXE25hALIaUhz8f4iRgLq+grZJU1LK6QHAPgz/VXm/VElNRYE4y/YNB5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1K+EVqMIw4isGwREWwCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgP/9k='
          alt="bouquet" style={{ width: 90, height: 90, objectFit: 'contain', mixBlendMode: 'screen' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 300, color: '#e8d4a8', marginBottom: 6 }}>Offrir un bouquet</div>
          <div style={{ fontSize: 11, color: 'rgba(238,232,218,.45)', lineHeight: 1.65, maxWidth: 320 }}>
            Envoyez un bouquet de fleurs pour faire parvenir une attention, un soutien, un petit geste amical…
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 300, color: 'rgba(232,212,168,.7)' }}>Fleurs qui ont besoin de soutien</div>
        <div style={{ fontSize: 9, color: 'rgba(238,232,218,.25)', flexShrink: 0, marginLeft: 8 }}>{list.length}/20</div>
      </div>
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {!ready
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ height: 62, borderRadius: 12, background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)', opacity: 1 - i * 0.12 }} />)
          : list.length === 0
            ? <div style={{ textAlign: 'center', padding: 32, color: 'rgba(238,232,218,.2)', fontSize: 12 }}>Toutes les fleurs sont en bonne santé 🌿</div>
            : list.map(fleur => (
                <BouquetCard
                  key={fleur.id}
                  fleur={fleur}
                  userId={userId}
                  senderName={myName}
                  alreadySent={excluded.has(fleur.id)}
                  bouquetMember={bouquetIds?.has(fleur.id)}
                  badge={0}
                  onCoeurSent={handleCoeurSent}
                  intentionMode
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
function ModalBouquet({ userId, myName, onClose }) {
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 24px 12px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ fontSize: 64, lineHeight: 1, filter: 'drop-shadow(0 0 18px rgba(232,60,60,.5))' }}>❤️</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 300, color: '#e8d4a8', marginBottom: 6 }}>Mes ami(e)s jardinier(e)s</div>
          <div style={{ fontSize: 11, color: 'rgba(238,232,218,.45)', lineHeight: 1.65, maxWidth: 300 }}>
            Envoyez une attention précieuse à vos ami(e)s, pour les soutenir et leur offrir une belle pensée.
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 300, color: 'rgba(232,212,168,.7)' }}>Mes ami(e)s jardinier(e)s</div>
        <div style={{ fontSize: 9, color: 'rgba(238,232,218,.25)', flexShrink: 0, marginLeft: 8 }}>{bouquet.length} jardinier{bouquet.length !== 1 ? 's' : ''}</div>
      </div>
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: 54, borderRadius: 12, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', opacity: 1 - i * 0.18 }} />)
          : bouquet.length === 0
            ? (
              <div style={{ background: 'rgba(150,212,133,.03)', border: '1px solid rgba(150,212,133,.1)', borderRadius: 14, padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <div style={{ fontSize: 26 }}>🌱</div>
                <div style={{ fontSize: 11, color: 'rgba(238,232,218,.35)', lineHeight: 1.65 }}>Envoyez des 💐 dans le jardin — quand un(e) ami(e) vous remercie, il/elle rejoint vos ami(e)s jardinier(e)s.</div>
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
function ScreenClubJardiniers({ userId, awardLumens, onCoeurSeen }) {
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
    try {
      await supabase.from('mercis').insert({ sender_id: userId, receiver_id: senderId, coeur_id: coeurId })
      logActivity({ userId, action: 'merci' })
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
      emoji: '❤️', label: 'Mes ami(e)s', sub: `${bouquetIds.size} jardinier${bouquetIds.size !== 1 ? 's' : ''}`,
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

      {showEgregore && <ModalEgregore userId={userId} onClose={() => setShowEgregore(false)} onParticleBurst={ps => setParticles(prev => [...prev, ...ps])} />}
      {showJardin   && <ModalJardin userId={userId} myName={myName} bouquetIds={bouquetIds} onClose={() => { setShowJardin(false); loadMessages() }} onCoeurSent={({ receiverName, zone }) => { showToast(`💐 Envoyé à ${receiverName} !`); awardLumens?.(1, 'coeur_envoye', { zone }); loadMessages() }} />}
      {showBouquet  && <ModalBouquet userId={userId} myName={myName} onClose={() => { setShowBouquet(false); loadMessages() }} />}

      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px 14px' : '36px 40px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Titre */}
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 34 : 50, fontWeight: 300, color: '#e8d4a8', lineHeight: 1.0, letterSpacing: '.02em' }}>
              Club des<br /><em style={{ color: 'rgba(150,212,133,.85)' }}>Jardiniers</em>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(238,232,218,.28)', marginTop: 7 }}>{todayStr}</div>
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
                  background: b.glow ? 'linear-gradient(135deg, rgba(232,196,100,.16), rgba(150,212,133,.1))' : 'rgba(255,255,255,.025)',
                  border: `1px solid ${b.glow ? 'rgba(232,196,100,.42)' : 'rgba(255,255,255,.07)'}`,
                  boxShadow: b.glow ? '0 0 22px rgba(232,196,100,.2), 0 0 50px rgba(150,212,133,.07)' : 'none',
                  transition: 'all .2s', WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = b.glow ? 'rgba(232,196,100,.7)' : 'rgba(255,255,255,.18)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = b.glow ? 'rgba(232,196,100,.42)' : 'rgba(255,255,255,.07)' }}
              >
                <div style={{ fontSize: isMobile ? 28 : 34, lineHeight: 1, filter: b.glow ? 'drop-shadow(0 0 10px rgba(232,196,100,.65))' : 'none' }}>{b.emoji}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 14 : 17, color: b.glow ? '#e8d4a8' : 'rgba(238,232,218,.7)', textAlign: 'center', lineHeight: 1.2 }}>{b.label}</div>
                <div style={{ fontSize: 9, color: b.glow ? 'rgba(232,196,100,.6)' : 'rgba(238,232,218,.28)', textAlign: 'center' }}>{b.sub}</div>
              </div>
            ))}
          </div>

          {/* Messages éphémères */}
          {messages.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 9, color: 'rgba(238,232,218,.28)', letterSpacing: '.12em', textTransform: 'uppercase' }}>✦ Cœurs reçus pour vous</div>
              {messages.map((c, i) => {
                const z = ZONE_MAP[c.zone]
                const sender = flowerName(c.sender)
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,100,100,.04)', border: '1px solid rgba(255,100,100,.1)', borderRadius: 14, animation: `fadeInUp .3s ease ${i * 0.05}s both` }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>💐</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: 'rgba(238,232,218,.5)', marginBottom: 2 }}>{sender}</div>
                      <div style={{ fontSize: 11, color: 'rgba(238,232,218,.6)', fontStyle: 'italic', lineHeight: 1.55 }}>"{c.message_ia}"</div>
                      <div style={{ fontSize: 9, color: z?.color ?? '#96d485', marginTop: 3 }}>{z?.icon} {z?.name} · {timeAgo(c.created_at)}</div>
                    </div>
                    <div onClick={() => handleMerci(c.id, c.sender_id)} style={{ flexShrink: 0, minHeight: 32, padding: '0 14px', borderRadius: 100, fontSize: 10, background: 'rgba(255,200,100,.1)', border: '1px solid rgba(255,200,100,.25)', color: 'rgba(255,220,140,.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', WebkitTapHighlightColor: 'transparent' }}>🙏 Merci</div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>

      {particles.map(p => (
        <Particle key={p.id} x={p.x} y={p.y} color={p.color} char={p.char} vx={p.vx} vy={p.vy} dur={p.dur}
          onDone={() => setParticles(prev => prev.filter(q => q.id !== p.id))} />
      ))}
    </>
  )
}

export { ScreenClubJardiniers }
