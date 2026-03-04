// ─────────────────────────────────────────────────────────────────────────────
//  ScreenClubJardiniers.jsx
//  3 onglets : Égrégore · Mes Fleurs · Le Jardin
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '../core/supabaseClient'
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
  return ZONES.filter(z => (plant?.[z.key] ?? 5) < FRAGILE)
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
            id: Date.now(), icon: '❤️',
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
      setMercisEnvoyes(prev => [...prev, coeurId])
      onFeedRefresh?.()
    } catch(e) { console.error(e) }
  }

  const pendingMercis = myMessages.filter(c => !mercisEnvoyes.includes(c.id))

  const globalVit = Math.round(ZONES.reduce((s, z) => s + (zonesData[z.key] ?? 5), 0) / ZONES.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>

      {/* ── BLOC HAUT : Fleur gauche | Intention droite ── */}
      {/* ── FLEUR CENTRÉE + INTENTION ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

        {/* Titre compact */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? -20 : -30, zIndex: 1 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 18 : 22, fontWeight: 300, color: '#e8d4a8', letterSpacing: '.04em' }}>L'Égrégore</div>
          <div style={{ fontSize: 9, color: 'rgba(238,232,218,0.3)', marginTop: 2, letterSpacing: '.06em' }}>
            <span style={{ color: 'rgba(150,212,133,0.7)' }}>{activeCount}</span> fleur{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''} aujourd'hui
          </div>
        </div>

        {/* Fleur pleine largeur */}
        <div style={{ marginTop: -50, marginBottom: -30 }}>
  <FleurSVG zonesData={zonesData} pulseKey={pulseKey} breathPhase={breathPhase} size={isMobile ? 260 : 60} svgRef={svgRef} />
</div>

        {/* Intention + Résonance sous la fleur */}
        {intention && (
          <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 10, marginTop: isMobile ? -10 : -20 }}>
            <div style={{ fontSize: 9, color: 'rgba(232,196,100,0.5)', letterSpacing: '.14em', textTransform: 'uppercase', textAlign: 'center' }}>✦ Intention collective du jour</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 26 : 32, fontWeight: 300, color: '#e8d4a8', lineHeight: 1.1, textAlign: 'center' }}>{intention.text}</div>
            <div style={{ fontSize: 11, color: 'rgba(238,232,218,0.4)', lineHeight: 1.65, textAlign: 'center' }}>{intention.description}</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div onClick={handleJoinIntention} style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 36, padding: '0 20px', borderRadius: 100, fontSize: 11, cursor: 'pointer', background: joined ? 'rgba(232,196,100,0.14)' : 'rgba(255,255,255,0.05)', border: `1px solid ${joined ? 'rgba(232,196,100,0.42)' : 'rgba(255,255,255,0.1)'}`, color: joined ? '#e8d4a8' : 'rgba(238,232,218,0.4)', transition: 'all .2s', WebkitTapHighlightColor: 'transparent' }}>
                {joined ? '✓ Vous nourrissez l\'intention' : 'Rejoindre l\'intention'}
              </div>
            </div>
            {resonance && (() => {
              const z = ZONE_MAP[resonance.zone]
              const pct = (resonance.current / resonance.threshold) * 100
              return (
                <div style={{ background: `${z?.color}08`, border: `1px solid ${z?.color}22`, borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ fontSize: 15 }}>🔥</span><div style={{ fontSize: 11, color: z?.color, fontWeight: 500 }}>Résonance {z?.name}</div></div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: z?.color }}>{resonance.current}%</div>
                  </div>
                  <div style={{ height: 3, borderRadius: 100, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 100, width: `${pct}%`, background: `linear-gradient(90deg,${z?.color}88,${z?.color})`, transition: 'width .6s ease' }} />
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(238,232,218,0.25)' }}>Seuil {resonance.threshold}% · encore {resonance.threshold - resonance.current} points</div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* ── PHRASES POSITIVES — Messages reçus ── */}
      {pendingMercis.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 9, color: 'rgba(238,232,218,0.3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>✦ Messages reçus pour vous</div>
          {pendingMercis.slice(0, 3).map(c => {
            const z      = ZONE_MAP[c.zone]
            const sender = flowerName(c.sender)
            return (
              <div key={c.id} style={{ background: 'rgba(255,100,100,0.05)', border: '1px solid rgba(255,100,100,0.14)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>❤️</span>
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(238,232,218,0.85)', fontWeight: 500 }}>{sender}</div>
                    <div style={{ fontSize: 9, color: z?.color ?? '#96d485', marginTop: 1 }}>{z?.icon} {z?.name} · {timeAgo(c.created_at)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(238,232,218,0.65)', lineHeight: 1.65, fontStyle: 'italic', marginBottom: 10 }}>"{c.message_ia}"</div>
                <div onClick={() => handleMerci(c.id, c.sender_id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 16px', borderRadius: 100, fontSize: 12, background: 'rgba(255,200,100,0.10)', border: '1px solid rgba(255,200,100,0.28)', color: 'rgba(255,220,140,0.9)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>🙏 Remercier</div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── FLUX ÉNERGIE ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 9, color: 'rgba(238,232,218,0.25)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 2 }}>Flux d'énergie</div>
        {flux.length === 0 && (
          <div style={{ fontSize: 11, color: 'rgba(238,232,218,0.22)', fontStyle: 'italic' }}>Le flux s'animera dès que des fleurs interagissent…</div>
        )}
        {flux.map((item, i) => (
          <div key={item.id ?? i} style={{ display: 'flex', gap: 9, padding: '8px 12px', borderRadius: 10, background: `${item.color}06`, border: `1px solid ${item.color}12` }}>
            <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'rgba(238,232,218,0.6)', lineHeight: 1.5 }}>{item.text}</div>
              <div style={{ fontSize: 9, color: 'rgba(238,232,218,0.22)', marginTop: 2 }}>{item.t}</div>
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
      onCoeurSent?.({ receiverName: name, zone: weakest.key, receiverId: fleur.id })
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

      {/* Bouton ❤️ */}
      <div
        onClick={handleSend}
        style={{
          width: 'clamp(38px, 8vw, 36px)', height: 'clamp(38px, 8vw, 36px)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: alreadySent || sending ? 'default' : 'pointer',
          background: alreadySent ? 'rgba(255,255,255,.04)' : 'rgba(232,136,168,.12)',
          border: `1px solid ${alreadySent ? 'rgba(255,255,255,.07)' : 'rgba(232,136,168,.3)'}`,
          fontSize: 16, opacity: sending ? .5 : 1,
          transition: 'transform .15s, background .2s',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => { if (!alreadySent && !sending) e.currentTarget.style.transform = 'scale(1.15)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        {sending ? '…' : alreadySent ? '✓' : '❤️'}
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
function BouquetCard({ fleur, userId, senderName, alreadySent, onCoeurSent, badge, onBadgeClick, expanded, pendingMercisForFleur, onMerci }) {
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

      {/* Bouton ❤️ */}
      <div
        onClick={handleSend}
        style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: isSent || sending ? 'default' : 'pointer',
          background: isSent ? 'rgba(255,255,255,.04)' : 'rgba(232,80,80,.15)',
          border: `1px solid ${isSent ? 'rgba(255,255,255,.07)' : 'rgba(232,80,80,.4)'}`,
          boxShadow: isSent ? 'none' : '0 0 8px rgba(232,80,80,.25)',
          opacity: sending ? .5 : 1, transition: 'all .2s',
          WebkitTapHighlightColor: 'transparent', position: 'relative',
          gap: 1,
        }}
        onMouseEnter={e => { if (!isSent && !sending) e.currentTarget.style.transform = 'scale(1.12)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        title={isSent ? `Disponible dans ${cooldown ?? '…'}` : `Envoyer ❤️ sur ${weakest.name}`}
      >
        <div style={{ fontSize: isSent ? 13 : 15, filter: isSent ? 'none' : 'drop-shadow(0 0 4px rgba(255,80,80,.5))', opacity: isSent ? .25 : 1, lineHeight: 1 }}>
          {sending ? '…' : '❤️'}
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
function ModalEgregore({ userId, myName, onClose, onParticleBurst }) {
  const isMobile = useIsMobile()
  // Réutilise toute la logique de TabEgregore
  const [zonesData, setZonesData]   = useState(Object.fromEntries(ZONES.map(z => [z.key, 50])))
  const [activeCount, setActiveCount] = useState(0)
  const [intention, setIntention]   = useState(null)
  const [joined, setJoined]         = useState(false)
  const [resonance, setResonance]   = useState(null)
  const [pulseKey, setPulseKey]     = useState(null)
  const [breathPhase, setBreath]    = useState(0)
  const svgRef = useRef(null)

  // Respiration
  useEffect(() => {
    let frame, start = Date.now()
    function tick() { setBreath(Math.sin(((Date.now() - start) / 3200) * Math.PI * 2) * .5 + .5); frame = requestAnimationFrame(tick) }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!userId) return
    setJoined(false) // reset d'abord, puis vérifier
    loadData()
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('intentions_joined').select('id').eq('user_id', userId).eq('date', today).maybeSingle()
      .then(({ data }) => setJoined(!!data))
  }, [userId])

  async function loadData() {
    const today = new Date().toISOString().slice(0, 10)
    const [{ data: plants }, { data: intent }] = await Promise.all([
      supabase.from('plants').select('zone_racines,zone_tige,zone_feuilles,zone_fleurs,zone_souffle').gte('date', today),
      supabase.from('intentions').select('text,description').eq('date', today).maybeSingle(),
    ])
    if (plants?.length) {
      const sums = Object.fromEntries(ZONES.map(z => [z.key, 0]))
      plants.forEach(p => ZONES.forEach(z => { sums[z.key] += (p[z.key] ?? 5) }))
      const avgs = Object.fromEntries(ZONES.map(z => [z.key, Math.round(sums[z.key] / plants.length)]))
      setZonesData(avgs); setActiveCount(plants.length)
      const r = ZONES.map(z => ({ ...z, pct: avgs[z.key], dist: Math.abs(80 - avgs[z.key]) }))
        .filter(z => z.pct >= 60 && z.pct < 80).sort((a, b) => a.dist - b.dist)[0]
      if (r) setResonance({ zone: r.key, current: r.pct, threshold: 80 })
    }
    if (intent) setIntention(intent)
  }

  function spawnParticles() {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = rect.width / 260, scaleY = rect.height / 260
    const PETALS = ['🌸','🌺','🌼','🌷','💮'], STARS = ['✨','⭐','🌟','💫','✦']
    const ps = []
    ZONES.forEach(z => {
      const pct = zonesData[z.key] ?? 50
      const pos = polarToXY(z.angle, (28 + (pct/100)*95) * .6, 130, 130)
      const bx = rect.left + pos.x * scaleX, by = rect.top + pos.y * scaleY
      for (let i = 0; i < 3; i++) ps.push({ id: `${z.key}-p-${i}-${Date.now()}-${Math.random()}`, x: bx + (Math.random()-.5)*20, y: by + (Math.random()-.5)*20, char: PETALS[Math.floor(Math.random()*PETALS.length)], vx: .35+Math.random()*.5, vy: -(.35+Math.random()*.5), dur: 3200+Math.random()*1400, color: null })
      for (let i = 0; i < 2; i++) { const a = Math.random()*Math.PI*2, s = .9+Math.random()*1.1; ps.push({ id: `${z.key}-s-${i}-${Date.now()}-${Math.random()}`, x: bx+(Math.random()-.5)*14, y: by+(Math.random()-.5)*14, char: STARS[Math.floor(Math.random()*STARS.length)], vx: Math.cos(a)*s, vy: Math.sin(a)*s, dur: 900+Math.random()*500, color: null }) }
    })
    onParticleBurst?.(ps)
  }

  async function handleJoin() {
    const today = new Date().toISOString().slice(0, 10)
    if (joined) {
      await supabase.from('intentions_joined').delete().eq('user_id', userId).eq('date', today)
      setJoined(false)
    } else {
      await supabase.from('intentions_joined').insert({ user_id: userId, date: today })
      setJoined(true)
      ZONES.forEach((z, i) => setTimeout(() => { setPulseKey(z.key); setTimeout(() => setPulseKey(null), 1800) }, i * 160))
      spawnParticles()
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 400, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(160deg,#0d200d,#091209)', border: '1px solid rgba(150,212,133,.15)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '24px 20px 36px' : '36px 40px', width: '100%', maxWidth: isMobile ? '100%' : 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {isMobile && <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.15)', marginBottom: 4 }} />}

        {/* Fleur */}
        <FleurSVG zonesData={zonesData} pulseKey={pulseKey} breathPhase={breathPhase} size={isMobile ? 260 : 560} svgRef={svgRef} />

        <div style={{ fontSize: 9, color: 'rgba(238,232,218,.3)', letterSpacing: '.1em', marginTop: -175}}>
          <span style={{ color: 'rgba(150,212,133,.7)' }}>{activeCount}</span> fleurs actives aujourd'hui
        </div>

        {intention && (<>
          <div style={{ fontSize: 9, color: 'rgba(232,196,100,.5)', letterSpacing: '.14em', textTransform: 'uppercase' }}>✦ Intention collective du jour</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 26 : 30, fontWeight: 300, color: '#e8d4a8', lineHeight: 1.1, textAlign: 'center' }}>{intention.text}</div>
          <div style={{ fontSize: 11, color: 'rgba(238,232,218,.4)', lineHeight: 1.65, textAlign: 'center', maxWidth: 380 }}>{intention.description}</div>
        </>)}

        <div onClick={handleJoin} style={{ display: 'flex', alignItems: 'center', gap: 7, minHeight: 42, padding: '0 24px', borderRadius: 100, fontSize: 12, cursor: 'pointer', background: joined ? 'rgba(232,196,100,.14)' : 'rgba(150,212,133,.1)', border: `1px solid ${joined ? 'rgba(232,196,100,.42)' : 'rgba(150,212,133,.3)'}`, color: joined ? '#e8d4a8' : '#c8f0b8', transition: 'all .2s', WebkitTapHighlightColor: 'transparent' }}>
          {joined ? '✓ Vous nourrissez l\'intention' : '🌸 Rejoindre l\'intention collective'}
        </div>

        {resonance && (() => {
          const z = ZONE_MAP[resonance.zone]
          const pct = (resonance.current / resonance.threshold) * 100
          return (
            <div style={{ width: '100%', background: `${z?.color}08`, border: `1px solid ${z?.color}22`, borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span>🔥</span><div style={{ fontSize: 11, color: z?.color }}>Résonance {z?.name}</div></div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, color: z?.color }}>{resonance.current}%</div>
              </div>
              <div style={{ height: 3, borderRadius: 100, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 100, width: `${pct}%`, background: `linear-gradient(90deg,${z?.color}88,${z?.color})` }} />
              </div>
              <div style={{ fontSize: 9, color: 'rgba(238,232,218,.25)' }}>Seuil {resonance.threshold}% · encore {resonance.threshold - resonance.current} pts</div>
            </div>
          )
        })()}

        <div onClick={onClose} style={{ fontSize: 11, color: 'rgba(238,232,218,.3)', cursor: 'pointer', marginTop: 4 }}>Fermer</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  SCREEN PRINCIPAL — 2 colonnes 80/20
// ─────────────────────────────────────────────────────────────────────────────
function ScreenClubJardiniers({ userId, awardLumens }) {
  const isMobile = useIsMobile()

  // ── State global ──
  const [myName, setMyName]             = useState('Vous')
  const [toast, setToast]               = useState(null)
  const [particles, setParticles]       = useState([])
  const [showEgregore, setShowEgregore] = useState(false)

  // ── Jardin (colonne gauche) ──
  const [list, setList]                   = useState([])
  const [loadingJardin, setLoadingJardin] = useState(true)
  const [readyJardin, setReadyJardin]     = useState(false)
  const [excluded, setExcluded]           = useState(new Set())
  const [pendingMercis, setPendingMercis] = useState([])
  const [mercisEnvoyes, setMercisEnvoyes] = useState(new Set())
  const [expandedId, setExpandedId]       = useState(null)

  // ── Bouquet (colonne droite) ──
  const [bouquet, setBouquet]               = useState([])
  const [bouquetIds, setBouquetIds]         = useState(new Set())
  const [loadingBouquet, setLoadingBouquet] = useState(true)
  const [excludedBouquet, setExcludedBouquet] = useState(new Set())
  const [pendingBouquet, setPendingBouquet] = useState([])
  const [expandedBouquet, setExpandedBouquet] = useState(null)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  // ── Init user ──
  useEffect(() => {
    if (!userId) return
    supabase.from('users').select('display_name, flower_name').eq('id', userId).maybeSingle()
      .then(({ data }) => { if (data) setMyName(flowerName(data)) })
    initJardin()
    initBouquet()
  }, [userId])

  // ── JARDIN ──
  async function initJardin() {
    setLoadingJardin(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const { data: sentToday } = await supabase.from('coeurs').select('receiver_id').eq('sender_id', userId).gte('created_at', today + 'T00:00:00')
      const alreadySent = new Set((sentToday ?? []).map(c => c.receiver_id))
      setExcluded(alreadySent)

      const [{ data: coeurs }, { data: mercis }] = await Promise.all([
        supabase.from('coeurs').select('id, sender_id, zone, message_ia, created_at').eq('receiver_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('mercis').select('coeur_id').eq('sender_id', userId),
      ])
      const done = new Set((mercis ?? []).map(m => m.coeur_id))
      setMercisEnvoyes(done)
      setPendingMercis((coeurs ?? []).filter(c => !done.has(c.id)))

      await loadJardinList(alreadySent)
      setReadyJardin(true)
    } catch(e) { console.error(e) } finally { setLoadingJardin(false) }
  }

  async function loadJardinList(excludeSet) {
    const exIds = [...(excludeSet ?? excluded), userId].filter(Boolean)
    let q = supabase.from('users').select('id, display_name, flower_name, level')
    exIds.forEach(id => { q = q.neq('id', id) })
    const { data: users } = await q
    if (!users?.length) { setList([]); return }
    const { data: plants } = await supabase.from('plants').select('user_id, health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle, date').in('user_id', users.map(u => u.id)).order('date', { ascending: false })
    const plantMap = {}
    ;(plants ?? []).forEach(p => { if (!plantMap[p.user_id]) plantMap[p.user_id] = p })
    setList(users.map(u => ({ ...u, plant: plantMap[u.id] ?? {} })).filter(u => u.display_name).sort((a, b) => vitality(a.plant) - vitality(b.plant)).slice(0, 20))
  }

  async function handleJardinCoeur({ receiverName, zone, receiverId }) {
    setList(prev => prev.filter(f => f.id !== receiverId))
    const newEx = new Set([...excluded, receiverId])
    setExcluded(newEx)
    showToast(`❤️ Envoyé à ${receiverName} !`)
    awardLumens?.(1, 'coeur_envoye', { zone })

    // Remplaçant
    const currentIds = list.filter(f => f.id !== receiverId).map(f => f.id)
    const exIds = [...newEx, userId, ...currentIds].filter(Boolean)
    let q = supabase.from('users').select('id, display_name, flower_name, level')
    exIds.forEach(id => { q = q.neq('id', id) })
    const { data: users } = await q
    if (!users?.length) return
    const { data: plants } = await supabase.from('plants').select('user_id, health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle, date').in('user_id', users.map(u => u.id)).order('date', { ascending: false })
    const plantMap = {}
    ;(plants ?? []).forEach(p => { if (!plantMap[p.user_id]) plantMap[p.user_id] = p })
    const next = users.map(u => ({ ...u, plant: plantMap[u.id] ?? {} })).filter(u => u.display_name).sort((a, b) => vitality(a.plant) - vitality(b.plant))[0]
    if (next) setList(prev => [...prev, next])
  }

  async function handleMerci(coeurId, senderId) {
    try {
      await supabase.from('mercis').insert({ sender_id: userId, receiver_id: senderId, coeur_id: coeurId })
      setMercisEnvoyes(prev => new Set([...prev, coeurId]))
      setPendingMercis(prev => prev.filter(c => c.id !== coeurId))
    } catch(e) { console.error(e) }
  }

  // ── BOUQUET ──
  async function initBouquet() {
    setLoadingBouquet(true)
    try {
      const [{ data: sent }, { data: recv }] = await Promise.all([
        supabase.from('coeurs').select('receiver_id').eq('sender_id', userId),
        supabase.from('mercis').select('sender_id').eq('receiver_id', userId),
      ])
      const sentIds  = new Set((sent  ?? []).map(c => c.receiver_id))
      const recvIds  = new Set((recv  ?? []).map(m => m.sender_id))
      const ids      = [...sentIds].filter(id => recvIds.has(id))
      setBouquetIds(new Set(ids))
      if (!ids.length) { setBouquet([]); setLoadingBouquet(false); return }

      const today = new Date().toISOString().slice(0, 10)
      const [{ data: users }, { data: plants }, { data: sentToday }] = await Promise.all([
        supabase.from('users').select('id, display_name, flower_name, level').in('id', ids),
        supabase.from('plants').select('user_id, health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle, date').in('user_id', ids).order('date', { ascending: false }),
        supabase.from('coeurs').select('receiver_id').eq('sender_id', userId).gte('created_at', today + 'T00:00:00'),
      ])
      const plantMap = {}
      ;(plants ?? []).forEach(p => { if (!plantMap[p.user_id]) plantMap[p.user_id] = p })
      setExcludedBouquet(new Set((sentToday ?? []).map(c => c.receiver_id)))
      setBouquet((users ?? []).map(u => ({ ...u, plant: plantMap[u.id] ?? {} })).sort((a, b) => vitality(a.plant) - vitality(b.plant)))

      const [{ data: coeurs }, { data: mercis }] = await Promise.all([
        supabase.from('coeurs').select('id, sender_id, zone, message_ia, created_at').eq('receiver_id', userId).in('sender_id', ids).order('created_at', { ascending: false }),
        supabase.from('mercis').select('coeur_id').eq('sender_id', userId),
      ])
      const done = new Set((mercis ?? []).map(m => m.coeur_id))
      setPendingBouquet((coeurs ?? []).filter(c => !done.has(c.id)))
    } finally { setLoadingBouquet(false) }
  }

  async function handleBouquetCoeur({ receiverId }) {
    setExcludedBouquet(prev => new Set([...prev, receiverId]))
  }

  async function handleBouquetMerci(coeurId, senderId) {
    try {
      await supabase.from('mercis').insert({ sender_id: userId, receiver_id: senderId, coeur_id: coeurId })
      setPendingBouquet(prev => prev.filter(c => c.id !== coeurId))
    } catch(e) { console.error(e) }
  }

  // ── RENDER ──
  const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <style>{`
        @keyframes petal-pulse { 0%{transform:scale(.85);opacity:.9} 100%{transform:scale(2.2);opacity:0} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <Toast msg={toast} />

      {showEgregore && (
        <ModalEgregore
          userId={userId} myName={myName}
          onClose={() => setShowEgregore(false)}
          onParticleBurst={ps => setParticles(prev => [...prev, ...ps])}
        />
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 12px' : '24px 28px' }}>
        <div style={{ display: 'flex', gap: isMobile ? 16 : 24, alignItems: 'flex-start', maxWidth: 1400, margin: '0 auto' }}>

          {/* ══ COLONNE GAUCHE 80% ══ */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Grand titre + bouton Égrégore */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 50 }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 32 : 44, fontWeight: 300, color: '#e8d4a8', lineHeight: 1.05, letterSpacing: '.02em' }}>
                  Le Jardin<br /><em style={{ color: 'rgba(150,212,133,.8)' }}>du Monde</em>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(238,232,218,.28)', marginTop: 6 }}>{todayStr}</div>
              </div>

              {/* Bouton Égrégore + texte explicatif */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingTop: 6 }}>
                <div
                  onClick={() => setShowEgregore(true)}
                  style={{
                    flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '12px 16px', borderRadius: 16, cursor: 'pointer',
                    background: 'linear-gradient(135deg, rgba(232,196,100,.18), rgba(150,212,133,.12))',
                    border: '1px solid rgba(232,196,100,.45)',
                    boxShadow: '0 0 18px rgba(232,196,100,.2), 0 0 40px rgba(150,212,133,.08)',
                    transition: 'all .2s',
                    WebkitTapHighlightColor: 'transparent',
                    maxWidth: isMobile ? 110 : 140,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 28px rgba(232,196,100,.4), 0 0 60px rgba(150,212,133,.15)'; e.currentTarget.style.borderColor = 'rgba(232,196,100,.7)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 18px rgba(232,196,100,.2), 0 0 40px rgba(150,212,133,.08)'; e.currentTarget.style.borderColor = 'rgba(232,196,100,.45)' }}
                >
                  <div style={{ fontSize: isMobile ? 22 : 26, lineHeight: 1, filter: 'drop-shadow(0 0 8px rgba(232,196,100,.6))' }}>✦</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 12 : 13, color: '#e8d4a8', textAlign: 'center', lineHeight: 1.2 }}>L'Égrégore</div>
                  <div style={{ fontSize: 9, color: 'rgba(232,196,100,.6)', textAlign: 'center', lineHeight: 1.4 }}>
                    {isMobile ? 'Fleur collective' : 'La fleur vivante\ndu groupe'}
                  </div>
                </div>

                {!isMobile && (
                  <div style={{ maxWidth: 220, paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, color: 'rgba(232,196,100,.8)', letterSpacing: '.03em' }}>Qu'est-ce que l'Égrégore ?</div>
                    <div style={{ fontSize: 11, color: 'rgba(238,232,218,.42)', lineHeight: 1.7 }}>
                      Une entité vivante née de l'énergie collective du groupe. Plus les membres prennent soin d'eux et s'entraident, plus la fleur commune s'épanouit — et cette beauté partagée renforce chacun en retour.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Messages positifs reçus */}
            {pendingMercis.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 9, color: 'rgba(238,232,218,.28)', letterSpacing: '.12em', textTransform: 'uppercase' }}>✦ Cœurs reçus pour vous</div>
                {pendingMercis.slice(0, 5).map(c => {
                  const z = ZONE_MAP[c.zone]
                  const already = mercisEnvoyes.has(c.id)
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,100,100,.04)', border: '1px solid rgba(255,100,100,.1)', borderRadius: 12, animation: 'fadeInUp .3s ease' }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>❤️</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: 'rgba(238,232,218,.65)', fontStyle: 'italic', lineHeight: 1.55 }}>"{c.message_ia}"</div>
                        <div style={{ fontSize: 9, color: z?.color ?? '#96d485', marginTop: 2 }}>{z?.icon} {z?.name} · {timeAgo(c.created_at)}</div>
                      </div>
                      {!already
                        ? <div onClick={() => handleMerci(c.id, c.sender_id)} style={{ flexShrink: 0, minHeight: 30, padding: '0 12px', borderRadius: 100, fontSize: 10, background: 'rgba(255,200,100,.1)', border: '1px solid rgba(255,200,100,.25)', color: 'rgba(255,220,140,.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', WebkitTapHighlightColor: 'transparent' }}>🙏 Merci</div>
                        : <span style={{ fontSize: 9, color: 'rgba(238,232,218,.2)', flexShrink: 0 }}>🙏</span>
                      }
                    </div>
                  )
                })}
              </div>
            )}

            {/* Section 20 fleurs fragiles */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 18 : 22, fontWeight: 300, color: '#e8d4a8' }}>Fleurs qui ont besoin de soutien</div>
                <div style={{ fontSize: 9, color: 'rgba(238,232,218,.25)' }}>{list.length} / 20 · renouvelé à minuit</div>
              </div>

              {!readyJardin ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(130px, calc(50% - 6px)), 1fr))', gap: 10 }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} style={{ borderRadius: 14, padding: '14px 12px', background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: 1 - i * 0.05 }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
                      <div style={{ width: '70%', height: 10, borderRadius: 4, background: 'rgba(255,255,255,.06)' }} />
                      <div style={{ width: '40%', height: 8, borderRadius: 4, background: 'rgba(255,255,255,.04)' }} />
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
                    </div>
                  ))}
                </div>
              ) : list.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(238,232,218,.2)', fontSize: 12 }}>Toutes les fleurs sont en bonne santé 🌿</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(130px, calc(50% - 6px)), 1fr))', gap: 10 }}>
                  {list.map(fleur => {
                    const badge = pendingMercis.filter(c => c.sender_id === fleur.id).length
                    return (
                      <FleurCard
                        key={fleur.id}
                        fleur={fleur}
                        userId={userId}
                        senderName={myName}
                        alreadySent={excluded.has(fleur.id)}
                        bouquetMember={bouquetIds.has(fleur.id)}
                        badge={badge}
                        onBadgeClick={() => setExpandedId(expandedId === fleur.id ? null : fleur.id)}
                        onCoeurSent={handleJardinCoeur}
                        expanded={expandedId === fleur.id}
                        pendingMercisForFleur={pendingMercis.filter(c => c.sender_id === fleur.id)}
                        onMerci={handleMerci}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ══ COLONNE DROITE 20% — MON BOUQUET ══ */}
          {!isMobile && (
            <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 300, color: '#e8d4a8' }}>Mon Bouquet</div>
                <div style={{ fontSize: 9, color: 'rgba(238,232,218,.28)', marginTop: 3 }}>
                  {bouquet.length} lien{bouquet.length !== 1 ? 's' : ''} · échanges mutuels
                </div>
              </div>

              {loadingBouquet ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ height: 58, borderRadius: 12, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', opacity: 1 - i * 0.15 }} />
                ))
              ) : bouquet.length === 0 ? (
                <div style={{ background: 'rgba(150,212,133,.03)', border: '1px solid rgba(150,212,133,.1)', borderRadius: 14, padding: '20px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 22 }}>🌱</div>
                  <div style={{ fontSize: 11, color: 'rgba(238,232,218,.35)', lineHeight: 1.6 }}>Envoyez des ❤️ dans le jardin — quand une fleur vous remercie, elle rejoint votre bouquet.</div>
                </div>
              ) : (
                bouquet.map(fleur => {
                  const badge = pendingBouquet.filter(c => c.sender_id === fleur.id).length
                  return (
                    <BouquetCard
                      key={fleur.id}
                      fleur={fleur}
                      userId={userId}
                      senderName={myName}
                      alreadySent={excludedBouquet.has(fleur.id)}
                      badge={badge}
                      onBadgeClick={() => setExpandedBouquet(expandedBouquet === fleur.id ? null : fleur.id)}
                      onCoeurSent={handleBouquetCoeur}
                      expanded={expandedBouquet === fleur.id}
                      pendingMercisForFleur={pendingBouquet.filter(c => c.sender_id === fleur.id)}
                      onMerci={handleBouquetMerci}
                    />
                  )
                })
              )}
            </div>
          )}

          {/* Bouquet mobile — sous la liste */}
          {isMobile && bouquet.length > 0 && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 300, color: '#e8d4a8' }}>Mon Bouquet</div>
              {bouquet.map(fleur => {
                const badge = pendingBouquet.filter(c => c.sender_id === fleur.id).length
                return (
                  <BouquetCard
                    key={fleur.id}
                    fleur={fleur}
                    userId={userId}
                    senderName={myName}
                    alreadySent={excludedBouquet.has(fleur.id)}
                    badge={badge}
                    onBadgeClick={() => setExpandedBouquet(expandedBouquet === fleur.id ? null : fleur.id)}
                    onCoeurSent={handleBouquetCoeur}
                    expanded={expandedBouquet === fleur.id}
                    pendingMercisForFleur={pendingBouquet.filter(c => c.sender_id === fleur.id)}
                    onMerci={handleBouquetMerci}
                  />
                )
              })}
            </div>
          )}

        </div>
      </div>

      {/* Particules */}
      {particles.map(p => (
        <Particle key={p.id} x={p.x} y={p.y} color={p.color} char={p.char}
          vx={p.vx} vy={p.vy} dur={p.dur}
          onDone={() => setParticles(prev => prev.filter(q => q.id !== p.id))} />
      ))}
    </>
  )
}

export { ScreenClubJardiniers }
