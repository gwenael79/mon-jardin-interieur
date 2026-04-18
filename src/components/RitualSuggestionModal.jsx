// RitualSuggestionModal.jsx — rituel suggéré + breathing + évaluation + Ma Fleur
import { useState, useEffect, useRef } from 'react'
import { useIsMobile } from '../pages/dashboardShared'
// ─── NEEDS (reprise pour les alternatives) ───────────────────────────────────
const NEEDS = [
  { id:'sleep',       label:'Mieux dormir',           g1:'#5B3FA0', g2:'#8B6FD0', glow:'rgba(107,75,200,0.32)' },
  { id:'stress',      label:'Apaiser le stress',       g1:'#2058B0', g2:'#5090E0', glow:'rgba(48,112,200,0.28)' },
  { id:'emotions',    label:'Apaiser mes émotions',    g1:'#B83070', g2:'#E870A8', glow:'rgba(200,60,120,0.28)' },
  { id:'grounding',   label:'Me sentir ancré',         g1:'#1A6645', g2:'#38A870', glow:'rgba(40,140,90,0.28)' },
  { id:'thoughts',    label:'Calmer mes pensées',      g1:'#2A4468', g2:'#4A70A0', glow:'rgba(58,96,148,0.28)' },
  { id:'energy',      label:"Retrouver de l'énergie",  g1:'#A06010', g2:'#D8A030', glow:'rgba(190,140,30,0.28)' },
  { id:'selfconnect', label:'Me reconnecter à moi',    g1:'#0E5250', g2:'#28B0A8', glow:'rgba(20,160,150,0.28)' },
  { id:'softness',    label:'Retrouver de la douceur', g1:'#902060', g2:'#E090B8', glow:'rgba(190,80,140,0.25)' },
]

// ─── Alternatives par besoin ─────────────────────────────────────────────────
const ALTERNATIVES = {
  sleep:       'softness',
  stress:      'grounding',
  emotions:    'softness',
  grounding:   'stress',
  thoughts:    'grounding',
  energy:      'sleep',
  selfconnect: 'emotions',
  softness:    'selfconnect',
}

// ─── Rituels ─────────────────────────────────────────────────────────────────
const RITUALS = {
  sleep: {
    title:    'Respiration 4-7-8',
    subtitle: 'Le rituel du sommeil apaisé',
    duration: '5 min',
    intro:    'Cette technique active le système nerveux parasympathique et prépare le corps au sommeil en quelques cycles.',
    steps: [
      { num:'1', label:'Expirez complètement',  text:'Videz vos poumons par la bouche, lèvres légèrement ouvertes.' },
      { num:'2', label:'Inspirez 4 secondes',   text:'Bouche fermée, respirez lentement par le nez en comptant jusqu\'à 4.' },
      { num:'3', label:'Retenez 7 secondes',    text:'Bloquez doucement l\'air, mâchoire détendue.' },
      { num:'4', label:'Expirez 8 secondes',    text:'Expirez lentement par la bouche. Répétez 4 cycles.' },
    ],
    tip: 'Allongez-vous, yeux fermés. Après 4 cycles, laissez votre corps s\'endormir naturellement.',
    icon: '🌙',
    breathing: { inhale:4, hold:7, exhale:8, cycles:4 },
    delta: 2,
  },
  stress: {
    title:    'Cohérence cardiaque',
    subtitle: 'Le rituel anti-stress immédiat',
    duration: '5 min',
    intro:    'Cinq respirations par minute synchronisent le cœur et le cerveau, effaçant le stress en quelques minutes.',
    steps: [
      { num:'1', label:'Installez-vous',        text:'Assis·e confortablement, dos droit, pieds à plat sur le sol.' },
      { num:'2', label:'Inspirez 5 secondes',   text:'Gonflez doucement le ventre, puis la poitrine.' },
      { num:'3', label:'Expirez 5 secondes',    text:'Relâchez la poitrine, puis le ventre. Sans pause entre.' },
      { num:'4', label:'Maintenez 5 minutes',   text:'Ce rythme de 6 respirations/minute apaise le système nerveux.' },
    ],
    tip: 'Posez une main sur le cœur pour sentir son rythme se stabiliser.',
    icon: '💨',
    breathing: { inhale:5, hold:0, exhale:5, cycles:18 },
    delta: 2,
  },
  emotions: {
    title:    "L'accueil de l'émotion",
    subtitle: 'Le rituel de la présence bienveillante',
    duration: '7 min',
    intro:    'Accueillir une émotion sans la juger ni l\'effacer — c\'est le seul chemin pour qu\'elle se dissolve.',
    steps: [
      { num:'1', label:'Nommez-la',              text:'Fermez les yeux. Quelle émotion est là ? Tristesse, colère, peur… Donnez-lui un nom.' },
      { num:'2', label:'Localisez-la',           text:'Où la ressentez-vous dans le corps ? Gorge, poitrine, ventre ?' },
      { num:'3', label:'Accueillez sans lutter', text:'Dites intérieurement : "Je vois que tu es là. Je t\'accueille."' },
      { num:'4', label:'Respirez avec elle',     text:'Trois respirations lentes. Imaginez que chaque expir l\'apaise doucement.' },
    ],
    tip: 'Il n\'y a rien à faire. Juste être là avec ce qui est.',
    icon: '💗',
    delta: 2,
  },
  grounding: {
    title:    'Ancrage 5-4-3-2-1',
    subtitle: 'Le rituel du retour au présent',
    duration: '5 min',
    intro:    'Cette technique sensorielle ramène instantanément le mental dans le moment présent et apaise l\'anxiété.',
    steps: [
      { num:'5', label:'5 choses que vous voyez',    text:'Regardez autour de vous. Nommez 5 objets, formes ou couleurs.' },
      { num:'4', label:'4 choses que vous touchez',  text:'Sentez vos pieds sur le sol, vos mains, vos vêtements, un objet proche.' },
      { num:'3', label:'3 choses que vous entendez', text:'Écoutez attentivement. Sons proches, lointains, subtils.' },
      { num:'2', label:'2 choses que vous sentez',   text:'Odeur de la pièce, de votre peau, d\'un tissu.' },
    ],
    tip: 'Terminez en prenant 3 respirations profondes. Vous êtes ici, maintenant.',
    icon: '⚓',
    delta: 2,
  },
  thoughts: {
    title:    "La méditation de l'observateur",
    subtitle: 'Le rituel du silence intérieur',
    duration: '8 min',
    intro:    'Vous n\'êtes pas vos pensées. Cet exercice crée de l\'espace entre vous et le flux mental.',
    steps: [
      { num:'1', label:'Asseyez-vous',           text:'Fermez les yeux, dos droit, mains posées sur les genoux.' },
      { num:'2', label:'Observez le flux',       text:'Laissez les pensées passer comme des nuages. Ne les suivez pas.' },
      { num:'3', label:'Nommez sans juger',      text:'Si une pensée s\'impose, dites "pensée" et revenez à votre souffle.' },
      { num:'4', label:'Ancrez-vous au souffle', text:'À chaque expir, répétez intérieurement : "Je suis ici."' },
    ],
    tip: 'Les pensées reviendront — c\'est normal. Revenir au souffle, c\'est le rituel.',
    icon: '✨',
    delta: 2,
  },
  energy: {
    title:    'Activation corps & souffle',
    subtitle: 'Le rituel du réveil énergétique',
    duration: '6 min',
    intro:    'Quelques mouvements doux combinés à la respiration suffisent à raviver l\'élan vital.',
    steps: [
      { num:'1', label:'Debout, étirez-vous',      text:'Levez les bras au-dessus de la tête, inspirez profondément.' },
      { num:'2', label:'Secouez doucement',        text:'Laissez les mains, les épaules, puis tout le corps se secouer librement 30 sec.' },
      { num:'3', label:'Respiration kapalabhati',  text:'Expirez par le nez de façon rythmée et courte (20x). Puis respirez normalement.' },
      { num:'4', label:'Ancrez l\'élan',           text:'Posez les mains sur le ventre. Ressentez la chaleur et l\'énergie qui circule.' },
    ],
    tip: 'Faites-le debout, si possible pieds nus sur le sol.',
    icon: '⚡',
    delta: 2,
  },
  selfconnect: {
    title:    'Journaling express',
    subtitle: 'Le rituel de la reconnexion à soi',
    duration: '10 min',
    intro:    'Trois questions simples pour retrouver le fil de soi, même dans les journées les plus chargées.',
    steps: [
      { num:'1', label:'Qu\'est-ce que je ressens vraiment ?',   text:'Sans filtre. Joyeux·se, épuisé·e, confus·e… Écrivez ce qui vient.' },
      { num:'2', label:'De quoi ai-je besoin là, maintenant ?',  text:'Repos ? Contact ? Mouvement ? Un mot d\'encouragement ?' },
      { num:'3', label:'Une chose que j\'ai bien faite',         text:'Une chose, même petite. Prenez le temps de la reconnaître.' },
      { num:'4', label:'Un geste de soin pour la suite',         text:'Quelle petite action ferait du bien dans les prochaines heures ?' },
    ],
    tip: 'Carnet et stylo de préférence — l\'écriture manuelle connecte davantage.',
    icon: '🌿',
    delta: 2,
  },
  softness: {
    title:    'Auto-massage douceur',
    subtitle: 'Le rituel de la tendresse envers soi',
    duration: '7 min',
    intro:    'Le toucher bienveillant active l\'ocytocine et apaise le système nerveux en quelques minutes.',
    steps: [
      { num:'1', label:'Mains',             text:'Massez chaque main lentement : paume, pouce, chaque doigt. Prenez votre temps.' },
      { num:'2', label:'Tempes et front',   text:'Cercles doux avec les pouces sur les tempes, puis le front. Expirez en massant.' },
      { num:'3', label:'Nuque et épaules', text:'Pétrissez doucement la nuque avec les deux mains. Roulez les épaules.' },
      { num:'4', label:'Main sur le cœur', text:'Posez une main sur le sternum. Respirez 3 fois en sentant cette chaleur.' },
    ],
    tip: 'Faites-le yeux fermés, en silence. C\'est un moment rien que pour vous.',
    icon: '🌸',
    delta: 2,
  },
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes rs_in     { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes rs_stepIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes rs_pulse  { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.12);opacity:1} }
  @keyframes rs_pop    { 0%{transform:scale(.85);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
  @keyframes rs_fleur  { 0%{transform:scale(.7) rotate(-6deg);opacity:0} 70%{transform:scale(1.12) rotate(2deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
  @keyframes rs_eval   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes rs_star_out { 0%{opacity:1;transform:translate(-50%,-50%) translateX(0) scale(0.2) rotate(0deg)} 60%{opacity:1} 100%{opacity:0;transform:translate(-50%,-50%) translateX(110px) scale(1.1) rotate(200deg)} }
  @keyframes rs_glow   { 0%,100%{box-shadow:0 0 20px rgba(255,210,100,0.3)} 50%{box-shadow:0 0 50px rgba(255,210,100,0.7),0 0 90px rgba(255,180,80,0.3)} }
  @keyframes rs_bloom  { 0%{transform:scale(1)} 30%{transform:scale(1.18)} 60%{transform:scale(0.96)} 100%{transform:scale(1.08)} }
  @keyframes rs_label_in  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes rs_delta_pop { 0%{transform:scale(0) rotate(-15deg);opacity:0} 65%{transform:scale(1.25) rotate(5deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
  @keyframes rs_bar_fill  { from{width:0%} to{width:var(--bar-w)} }
  @keyframes rs_plant_in  { from{transform:scale(0.88) translateY(12px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
  @keyframes rs_confetti  { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(-120px) rotate(360deg);opacity:0} }
  @keyframes bub_inhale   { from{transform:scale(0.60)} to{transform:scale(1.0)} }
  @keyframes bub_hold     { 0%,100%{transform:scale(1.0)} 50%{transform:scale(1.022)} }
  @keyframes bub_exhale   { from{transform:scale(1.0)} to{transform:scale(0.60)} }
  @keyframes bub_ring     { 0%{transform:scale(1);opacity:0.55} 100%{transform:scale(2.9);opacity:0} }
  @keyframes countdown_pop { 0%{transform:scale(1.9);opacity:0} 55%{transform:scale(0.88)} 100%{transform:scale(1);opacity:1} }
`

// ─── Phase : vue du rituel ────────────────────────────────────────────────────
function PhaseView({ ritual, need, isMobile, onStart, onBack, onClose }) {
  const { g1, g2, glow } = need
  return (
    <>
      <div style={{ flexShrink:0, padding: isMobile ? '18px 18px 0' : '28px 32px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.55)', border:'1px solid rgba(180,160,140,0.25)', borderRadius:100, padding:'7px 16px', cursor:'pointer', color:'rgba(50,35,20,0.65)', fontSize:13, fontFamily:"'Jost',sans-serif" }}>‹ Autre besoin</button>
        <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.55)', border:'1px solid rgba(180,160,140,0.25)', cursor:'pointer', color:'rgba(50,35,20,0.45)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
      </div>
      <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', padding: isMobile ? '24px 20px calc(env(safe-area-inset-bottom, 0px) + 40px)' : '28px 32px 32px', boxSizing:'border-box' }}>
        <div style={{ animation:'rs_in .35s ease both', marginBottom:18 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:100, background:`linear-gradient(135deg,${g1},${g2})`, boxShadow:`0 4px 16px ${glow}` }}>
            <span style={{ fontSize:18 }}>{ritual.icon}</span>
            <span style={{ fontFamily:"'Jost',sans-serif", fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.95)', letterSpacing:'.08em', textTransform:'uppercase' }}>{need.label}</span>
          </div>
        </div>
        <div style={{ animation:'rs_in .38s ease .05s both', marginBottom:20 }}>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 34 : 44, fontWeight:400, color:'#2A1F18', margin:'0 0 6px', lineHeight:1.15 }}>{ritual.title}</h2>
          <p style={{ fontFamily:"'Jost',sans-serif", fontSize: isMobile ? 14 : 16, color:'rgba(50,35,20,0.50)', margin:'0 0 4px' }}>{ritual.subtitle}</p>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:`linear-gradient(135deg,${g1},${g2})`, animation:'rs_pulse 2s ease-in-out infinite' }}/>
            <span style={{ fontFamily:"'Jost',sans-serif", fontSize:14, color:'rgba(50,35,20,0.45)' }}>{ritual.duration}</span>
          </div>
        </div>
        <div style={{ padding:'16px 20px', borderRadius:16, background:'rgba(255,255,255,0.55)', border:'1px solid rgba(180,160,140,0.20)', marginBottom:24, animation:'rs_in .4s ease .1s both' }}>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 19 : 22, fontStyle:'italic', color:'rgba(50,35,20,0.70)', margin:0, lineHeight:1.6 }}>{ritual.intro}</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
          {ritual.steps.map((step, i) => (
            <div key={i} style={{ display:'flex', gap:14, alignItems:'flex-start', animation:`rs_stepIn .36s ease ${.15 + i * .07}s both` }}>
              <div style={{ flexShrink:0, width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${g1},${g2})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 12px ${glow}` }}>
                <span style={{ fontFamily:"'Jost',sans-serif", fontSize:14, fontWeight:700, color:'#fff' }}>{step.num}</span>
              </div>
              <div style={{ paddingTop:4 }}>
                <div style={{ fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:600, color:'#2A1F18', marginBottom:4 }}>{step.label}</div>
                <div style={{ fontFamily:"'Jost',sans-serif", fontSize:14, fontWeight:300, color:'rgba(50,35,20,0.82)', lineHeight:1.55 }}>{step.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:'14px 18px', borderRadius:14, background:`linear-gradient(135deg,${g1}18,${g2}10)`, border:`1px solid ${g1}28`, marginBottom:28, animation:'rs_in .4s ease .42s both' }}>
          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
            <p style={{ fontFamily:"'Jost',sans-serif", fontSize:14, color:'rgba(50,35,20,0.65)', margin:0, lineHeight:1.6 }}>{ritual.tip}</p>
          </div>
        </div>
        <div style={{ textAlign:'center', animation:'rs_in .4s ease .5s both' }}>
          <button onClick={onStart}
            style={{ padding: isMobile ? '17px 0' : '17px 60px', width: isMobile ? '100%' : 'auto', borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:18, fontWeight:700, color:'#fff', letterSpacing:'.04em', background:`linear-gradient(135deg,${g1},${g2})`, boxShadow:`0 10px 30px ${glow}`, transition:'transform .18s ease' }}
            onMouseEnter={e => e.currentTarget.style.transform='translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform='none'}
          >
            Commencer ce rituel
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Phase : bulle de respiration ────────────────────────────────────────────
// Palette par phase
const PHASE_PALETTE = {
  inhale: { from:'#a78bfa', to:'#6d28d9', glow:'rgba(139,92,246,0.55)', label:'Inspirez', sub:'par le nez' },
  hold:   { from:'#818cf8', to:'#3730a3', glow:'rgba(99,102,241,0.50)',  label:'Retenez',  sub:'doucement' },
  exhale: { from:'#34d399', to:'#065f46', glow:'rgba(52,211,153,0.50)',  label:'Expirez',  sub:'par la bouche' },
}

function PhaseBreathing({ ritual, need, isMobile, onDone, onClose }) {
  const { inhale, hold, exhale, cycles } = ritual.breathing
  const PHASES = [
    ...(inhale > 0 ? [{ key:'inhale', duration:inhale }] : []),
    ...(hold   > 0 ? [{ key:'hold',   duration:hold   }] : []),
    ...(exhale > 0 ? [{ key:'exhale', duration:exhale  }] : []),
  ]

  const [countdown, setCountdown] = useState(3)
  const [started,   setStarted]   = useState(false)
  const [phaseIdx,  setPhaseIdx]  = useState(0)
  const [timeLeft,  setTimeLeft]  = useState(PHASES[0].duration)
  const [cycleNum,  setCycleNum]  = useState(1)
  const [finished,  setFinished]  = useState(false)
  const [phaseKey,  setPhaseKey]  = useState(0)
  const stateRef = useRef({ phaseIdx:0, timeLeft:PHASES[0].duration, cycleNum:1, phaseKey:0 })

  // ── Compte à rebours 3-2-1 ──
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); setStarted(true); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Timer respiration (démarre après countdown) ──
  useEffect(() => {
    if (!started) return
    const s = { phaseIdx:0, timeLeft:PHASES[0].duration, cycleNum:1, phaseKey:0 }
    stateRef.current = s
    setPhaseIdx(0); setTimeLeft(PHASES[0].duration); setCycleNum(1); setPhaseKey(0)

    const id = setInterval(() => {
      const cur = stateRef.current
      if (cur.timeLeft > 1) {
        const tl = cur.timeLeft - 1
        stateRef.current.timeLeft = tl
        setTimeLeft(tl)
        return
      }
      const nextPi = cur.phaseIdx + 1
      if (nextPi < PHASES.length) {
        const pk = cur.phaseKey + 1
        stateRef.current = { ...cur, phaseIdx:nextPi, timeLeft:PHASES[nextPi].duration, phaseKey:pk }
        setPhaseIdx(nextPi); setTimeLeft(PHASES[nextPi].duration); setPhaseKey(pk)
        return
      }
      if (cur.cycleNum >= cycles) {
        clearInterval(id); setFinished(true); return
      }
      const pk = cur.phaseKey + 1
      const cn = cur.cycleNum + 1
      stateRef.current = { phaseIdx:0, timeLeft:PHASES[0].duration, cycleNum:cn, phaseKey:pk }
      setPhaseIdx(0); setTimeLeft(PHASES[0].duration); setCycleNum(cn); setPhaseKey(pk)
    }, 1000)
    return () => clearInterval(id)
  }, [started])

  const currentPhase = PHASES[phaseIdx] ?? PHASES[0]
  const palette      = PHASE_PALETTE[currentPhase.key] ?? PHASE_PALETTE.inhale
  const bubbleSize   = isMobile ? 168 : 210

  // ── Écran compte à rebours ──
  if (!started) {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg,#d8d0f0 0%,#c8bfe8 100%)', position:'relative', overflow:'hidden' }}>
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, width:32, height:32, borderRadius:'50%', background:'rgba(100,80,160,0.10)', border:'1px solid rgba(100,80,160,0.18)', cursor:'pointer', color:'rgba(60,40,100,0.50)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}>✕</button>
        {/* Halo ambiant */}
        <div style={{ position:'absolute', width:340, height:340, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:13, letterSpacing:'.18em', textTransform:'uppercase', color:'rgba(40,20,80,0.70)', marginBottom:48, fontWeight:500 }}>
          {ritual.title}
        </div>
        <div key={countdown} style={{ animation:'countdown_pop .55s cubic-bezier(0.34,1.56,0.64,1) both', lineHeight:1 }}>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize: isMobile ? 148 : 190, fontWeight:200, color:'rgba(40,20,80,0.82)', letterSpacing:'-.04em' }}>
            {countdown}
          </span>
        </div>
        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:15, color:'rgba(40,20,80,0.60)', letterSpacing:'.16em', textTransform:'uppercase', marginTop:36, fontWeight:400 }}>
          Préparez-vous
        </div>
      </div>
    )
  }

  // ── Écran terminé ──
  if (finished) {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg,#d8d0f0 0%,#c8bfe8 100%)', padding:'24px', textAlign:'center', position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, width:32, height:32, borderRadius:'50%', background:'rgba(100,80,160,0.10)', border:'1px solid rgba(100,80,160,0.18)', cursor:'pointer', color:'rgba(60,40,100,0.50)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        <div style={{ position:'relative', width: bubbleSize * 0.72, height: bubbleSize * 0.72, borderRadius:'50%', background:'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.55) 0%, #a78bfacc 38%, #6d28d9 100%)', boxShadow:'0 0 60px rgba(139,92,246,0.35), 0 0 130px rgba(139,92,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:36, animation:'rs_pop .5s ease both' }}>
          <div style={{ position:'absolute', width:28, height:28, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 45%, transparent 100%)', filter:'blur(3px)' }}/>
          <span style={{ position:'relative', zIndex:2, fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 54 : 68, fontWeight:300, color:'rgba(255,255,255,0.95)' }}>✓</span>
        </div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 36 : 44, fontWeight:300, color:'rgba(40,20,80,0.82)', marginBottom:8 }}>Respiration terminée</div>
        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:'rgba(10,5,20,0.80)', letterSpacing:'.08em', marginBottom:32 }}>{cycles} cycles effectués</div>
        <div style={{ display:'flex', gap:6, marginBottom:40 }}>
          {Array.from({ length:cycles }).map((_, i) => (
            <div key={i} style={{ width:24, height:4, borderRadius:4, background:'linear-gradient(90deg,#a78bfa,#6d28d9)' }}/>
          ))}
        </div>
        <button onClick={onDone} style={{ padding: isMobile ? '16px 0' : '16px 56px', width: isMobile ? '88%' : 'auto', maxWidth:300, borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:16, fontWeight:600, color:'#fff', background:'linear-gradient(135deg,#a78bfa,#6d28d9)', boxShadow:'0 8px 30px rgba(139,92,246,0.35)' }}>
          Continuer →
        </button>
      </div>
    )
  }

  // ── Écran respiration ──
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: isMobile ? '20px 16px' : '32px 48px', textAlign:'center', position:'relative', background:'linear-gradient(180deg,#d8d0f0 0%,#c8bfe8 100%)', overflow:'hidden' }}>

      <button onClick={onClose} style={{ position:'absolute', top:16, right:16, width:32, height:32, borderRadius:'50%', background:'rgba(100,80,160,0.10)', border:'1px solid rgba(100,80,160,0.18)', cursor:'pointer', color:'rgba(60,40,100,0.50)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}>✕</button>

      {/* Titre */}
      <div style={{ fontFamily:"'Jost',sans-serif", fontSize:13, letterSpacing:'.18em', textTransform:'uppercase', color:'rgba(40,20,80,0.75)', marginBottom:28, flexShrink:0, fontWeight:500 }}>
        {ritual.title}
      </div>

      {/* Zone bulle */}
      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width: bubbleSize + 90, height: bubbleSize + 90 }}>

        {/* Halo ambiant — change de couleur avec la phase */}
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:`radial-gradient(circle, ${palette.glow} 0%, transparent 68%)`, transition:'background 1.4s ease', pointerEvents:'none' }}/>

        {/* Anneaux — blancs à l'inspire (expansion), noirs à l'expire (contraction) */}
        {(currentPhase.key === 'inhale' || currentPhase.key === 'exhale') && [0, 1].map(i => (
          <div key={`ring-${phaseKey}-${i}`} style={{
            position:'absolute',
            width: bubbleSize, height: bubbleSize,
            borderRadius:'50%',
            border: currentPhase.key === 'inhale'
              ? '2px solid rgba(255,255,255,0.85)'
              : '2px solid rgba(10,5,30,0.65)',
            animation:`bub_ring ${currentPhase.duration * 0.95}s ease-out ${i * 1.6}s both`,
            pointerEvents:'none',
          }}/>
        ))}

        {/* Bulle principale — key force le redémarrage de l'animation à chaque phase */}
        <div key={`bubble-${phaseKey}`} style={{
          position:'relative',
          width: bubbleSize, height: bubbleSize, borderRadius:'50%',
          background:`radial-gradient(circle at 38% 32%, rgba(255,255,255,0.35) 0%, ${palette.from}ee 40%, ${palette.to} 100%)`,
          boxShadow:`0 0 55px ${palette.glow}, 0 0 110px ${palette.glow}66, inset 0 2px 10px rgba(255,255,255,0.25)`,
          animation:`bub_${currentPhase.key} ${currentPhase.duration}s ${currentPhase.key === 'hold' ? 'ease-in-out infinite' : 'cubic-bezier(0.37,0,0.63,1) forwards'}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:`box-shadow 1.2s ease`,
          zIndex:1,
        }}>
          {/* Point lumineux central — toujours visible */}
          <div style={{ position:'absolute', width:30, height:30, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.08) 75%, transparent 100%)', filter:'blur(2.5px)', zIndex:2, pointerEvents:'none' }}/>
          {/* Compte à rebours */}
          <span key={`tl-${timeLeft}`} style={{ position:'relative', zIndex:3, fontFamily:"'Jost',sans-serif", fontSize: isMobile ? 52 : 64, fontWeight:300, color:'rgba(255,255,255,1)', lineHeight:1, letterSpacing:'-.02em', animation:'rs_label_in .35s ease both', textShadow:'0 2px 12px rgba(30,10,70,0.50)' }}>
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Label phase */}
      <div key={`label-${phaseKey}`} style={{ animation:'rs_label_in .5s ease both', flexShrink:0 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 42 : 50, fontWeight:400, color:'rgba(25,10,60,0.92)', letterSpacing:'.02em', lineHeight:1.1 }}>
          {palette.label}
        </div>
        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:500, color:'rgba(50,30,100,0.70)', letterSpacing:'.14em', textTransform:'uppercase', marginTop:10 }}>
          {palette.sub}
        </div>
      </div>

      {/* Cycles */}
      <div style={{ display:'flex', gap:6, marginTop:24, marginBottom:22, flexShrink:0 }}>
        {Array.from({ length:cycles }).map((_, i) => (
          <div key={i} style={{ width: i < cycleNum - 1 ? 24 : 8, height:5, borderRadius:4, background: i < cycleNum - 1 ? `linear-gradient(90deg,${palette.from},${palette.to})` : 'rgba(60,30,120,0.28)', transition:'all .5s ease' }}/>
        ))}
      </div>

      <button onClick={onDone} style={{ padding:'11px 32px', borderRadius:100, border:'1px solid rgba(50,30,100,0.35)', background:'rgba(50,30,100,0.10)', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:500, color:'rgba(30,10,70,0.65)', flexShrink:0, letterSpacing:'.06em' }}>
        Passer
      </button>
    </div>
  )
}

// ─── Phase : exécution guidée (rituels non-respiration) ──────────────────────
function PhaseDoing({ ritual, need, isMobile, onDone, onClose }) {
  const [stepIdx, setStepIdx] = useState(0)
  const { g1, g2, glow } = need
  const isLast = stepIdx === ritual.steps.length - 1
  const step   = ritual.steps[stepIdx]

  return (
    <>
      <div style={{ flexShrink:0, padding: isMobile ? '18px 18px 0' : '28px 32px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:'rgba(50,35,20,0.45)' }}>Étape {stepIdx + 1} / {ritual.steps.length}</div>
        <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.55)', border:'1px solid rgba(180,160,140,0.25)', cursor:'pointer', color:'rgba(50,35,20,0.45)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
      </div>
      <div style={{ flexShrink:0, padding:'12px 20px 0', display:'flex', gap:6 }}>
        {ritual.steps.map((_, i) => (
          <div key={i} style={{ flex:1, height:4, borderRadius:4, background: i <= stepIdx ? `linear-gradient(90deg,${g1},${g2})` : 'rgba(180,160,140,0.20)', transition:'background .3s' }}/>
        ))}
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: isMobile ? '32px 24px' : '40px 48px', textAlign:'center', animation:'rs_in .35s ease both' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:`linear-gradient(135deg,${g1},${g2})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 8px 24px ${glow}`, marginBottom:28, animation:'rs_pop .4s ease both' }}>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:26, fontWeight:700, color:'#fff' }}>{step.num}</span>
        </div>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 28 : 36, fontWeight:400, color:'#2A1F18', margin:'0 0 16px', lineHeight:1.2 }}>{step.label}</h2>
        <p style={{ fontFamily:"'Jost',sans-serif", fontSize: isMobile ? 16 : 18, color:'rgba(50,35,20,0.75)', lineHeight:1.7, margin:'0 0 40px', maxWidth:440 }}>{step.text}</p>
        <button
          onClick={() => isLast ? onDone() : setStepIdx(i => i + 1)}
          style={{ padding: isMobile ? '16px 0' : '16px 52px', width: isMobile ? '100%' : 'auto', maxWidth:340, borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:17, fontWeight:700, color:'#fff', background:`linear-gradient(135deg,${g1},${g2})`, boxShadow:`0 8px 24px ${glow}`, transition:'transform .18s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform='none'}
        >
          {isLast ? "J'ai terminé ✓" : 'Étape suivante →'}
        </button>
      </div>
    </>
  )
}

// ─── Phase : évaluation ───────────────────────────────────────────────────────
function PhaseEvaluate({ ritual, need, isMobile, onLiked, onNotLiked, onClose }) {
  const { g1, g2 } = need
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: isMobile ? '32px 24px' : '40px 48px', textAlign:'center', animation:'rs_eval .4s ease both' }}>
      <span style={{ fontSize:48, marginBottom:20 }}>{ritual.icon}</span>
      <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 28 : 36, fontWeight:400, color:'#2A1F18', margin:'0 0 10px', lineHeight:1.2 }}>
        Comment s'est passé ce rituel ?
      </h2>
      <p style={{ fontFamily:"'Jost',sans-serif", fontSize: isMobile ? 15 : 16, color:'rgba(50,35,20,0.50)', margin:'0 0 36px' }}>
        Votre retour nous aide à affiner les prochaines suggestions
      </p>
      <div style={{ display:'flex', gap:16, width:'100%', maxWidth:380 }}>
        <button onClick={onLiked} style={{ flex:1, padding:'20px 0', borderRadius:20, border:'2px solid rgba(80,180,100,0.25)', cursor:'pointer', background:'rgba(80,200,100,0.08)', transition:'all .18s ease', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(80,200,100,0.18)'; e.currentTarget.style.borderColor='rgba(80,180,100,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(80,200,100,0.08)'; e.currentTarget.style.borderColor='rgba(80,180,100,0.25)' }}
        >
          <span style={{ fontSize:36 }}>💚</span>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:600, color:'#2a6a30' }}>C'est parfait</span>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:'rgba(50,35,20,0.45)' }}>Je garde ce rituel</span>
        </button>
        <button onClick={onNotLiked} style={{ flex:1, padding:'20px 0', borderRadius:20, border:'2px solid rgba(200,80,80,0.22)', cursor:'pointer', background:'rgba(200,80,80,0.07)', transition:'all .18s ease', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(200,80,80,0.15)'; e.currentTarget.style.borderColor='rgba(200,80,80,0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(200,80,80,0.07)'; e.currentTarget.style.borderColor='rgba(200,80,80,0.22)' }}
        >
          <span style={{ fontSize:36 }}>🔄</span>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:600, color:'#8a2a2a' }}>Pas pour moi</span>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:'rgba(50,35,20,0.45)' }}>Voir une alternative</span>
        </button>
      </div>
    </div>
  )
}

// ─── Phase : alternative ─────────────────────────────────────────────────────
function PhaseAlternative({ originalNeed, isMobile, onStart, onSkip, onClose }) {
  const altId    = ALTERNATIVES[originalNeed.id] ?? 'grounding'
  const altNeed  = NEEDS.find(n => n.id === altId) ?? NEEDS[0]
  const altRitual = RITUALS[altId]
  const { g1, g2, glow } = altNeed

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: isMobile ? '32px 24px' : '40px 48px', textAlign:'center', animation:'rs_eval .4s ease both' }}>
      <button onClick={onClose} style={{ position:'absolute', top:16, right:16, width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.55)', border:'1px solid rgba(180,160,140,0.25)', cursor:'pointer', color:'rgba(50,35,20,0.45)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

      <div style={{ fontSize:14, fontFamily:"'Jost',sans-serif", color:'rgba(50,35,20,0.45)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:16 }}>
        Voici une alternative
      </div>

      {/* Card alternative */}
      <div style={{ width:'100%', maxWidth:360, background:'rgba(255,255,255,0.60)', backdropFilter:'blur(8px)', borderRadius:20, padding:'24px 20px', border:'1px solid rgba(180,160,140,0.22)', marginBottom:28, boxShadow:`0 8px 32px ${glow}22` }}>
        <div style={{ fontSize:36, marginBottom:12 }}>{altRitual.icon}</div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 14px', borderRadius:100, background:`linear-gradient(135deg,${g1},${g2})`, marginBottom:14 }}>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:600, color:'#fff', letterSpacing:'.06em', textTransform:'uppercase' }}>{altNeed.label}</span>
        </div>
        <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:400, color:'#2A1F18', margin:'0 0 8px', lineHeight:1.2 }}>{altRitual.title}</h3>
        <p style={{ fontFamily:"'Jost',sans-serif", fontSize:14, color:'rgba(50,35,20,0.55)', margin:'0 0 4px' }}>{altRitual.subtitle}</p>
        <p style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:'rgba(50,35,20,0.40)' }}>⏱ {altRitual.duration}</p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12, width:'100%', maxWidth:340 }}>
        <button onClick={() => onStart(altNeed, altRitual)}
          style={{ padding:'16px 0', borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:16, fontWeight:700, color:'#fff', background:`linear-gradient(135deg,${g1},${g2})`, boxShadow:`0 8px 24px ${glow}` }}
        >
          Essayer ce rituel
        </button>
        <button onClick={onSkip}
          style={{ padding:'12px 0', borderRadius:100, border:'1px solid rgba(180,160,140,0.28)', background:'rgba(255,255,255,0.55)', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:14, color:'rgba(50,35,20,0.55)' }}
        >
          Terminer quand même →
        </button>
      </div>
    </div>
  )
}

// ─── Phase : résultat + Ma Fleur ─────────────────────────────────────────────
function PhaseResult({ need, isMobile, onSeeFlower, onClose, healthBefore, healthAfter }) {
  const { g1, g2, glow } = need

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: isMobile ? '40px 28px' : '52px 48px', textAlign:'center', animation:'rs_eval .4s ease both', position:'relative', overflow:'hidden', background:'radial-gradient(circle at 50% 18%, #f5efe6, #e8dfd2 58%, #e0d4c0)', gap:32 }}>

      {/* Halos décoratifs */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'-5%', left:'-10%', width:280, height:280, borderRadius:'50%', background:`radial-gradient(circle,${g1}18 0%,transparent 65%)` }}/>
        <div style={{ position:'absolute', bottom:'-5%', right:'-8%', width:220, height:220, borderRadius:'50%', background:`radial-gradient(circle,${g2}15 0%,transparent 65%)` }}/>
      </div>

      {/* Titre + message */}
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 52 : 66, fontWeight:700, color:'#2A1F18', margin:0, lineHeight:1.05, animation:'rs_pop .5s cubic-bezier(.34,1.56,.64,1) both' }}>
          Bravo !
        </h2>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 20 : 24, fontStyle:'italic', fontWeight:400, color:'rgba(50,35,20,0.75)', margin:0, lineHeight:1.65, maxWidth:380, animation:'rs_in .5s ease .2s both' }}>
          En prenant soin de toi, tu as permis à ta fleur de gagner en vitalité,
          passant ainsi de{' '}
          <span style={{ fontWeight:600, fontStyle:'normal', color:'rgba(50,35,20,0.55)' }}>{healthBefore}%</span>
          {' '}à{' '}
          <span style={{ fontWeight:700, fontStyle:'normal', color:`${g1}`, fontSize: isMobile ? 22 : 26 }}>
            {healthAfter !== null ? `${healthAfter}%` : '…'}
          </span>.
        </p>
      </div>

      {/* Boutons */}
      <div style={{ display:'flex', flexDirection:'column', gap:12, width:'100%', maxWidth:320, position:'relative', zIndex:1, animation:'rs_in .5s ease .4s both' }}>
        <button onClick={onSeeFlower}
          style={{ padding:'17px 0', borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:17, fontWeight:700, color:'#fff', background:`linear-gradient(135deg,${g1},${g2})`, boxShadow:`0 8px 28px ${glow}`, transition:'transform .18s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform='none'}
        >
          🌸 Voir ma fleur
        </button>
        <button onClick={onClose}
          style={{ padding:'13px 0', borderRadius:100, cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:500, color:'rgba(50,35,20,0.55)', background:'rgba(255,255,255,0.60)', border:'1px solid rgba(180,160,140,0.28)' }}
        >
          Fermer
        </button>
      </div>
    </div>
  )
}
// ─── Guard anti-double eval (survit aux remounts StrictMode) ─────────────────
let _evalInProgress = false
export function resetEvalGuard() { _evalInProgress = false }
// ─── Composant principal ──────────────────────────────────────────────────────
export default function RitualSuggestionModal({ need, onBack, onClose, onSeeFlower, onCompleteRitual, plantHealth, plantId }) {
  const isMobile = useIsMobile()
  const [phase,            setPhase]            = useState('view')
  const [liked,            setLiked]            = useState(null)
  const [activeNeed,       setActiveNeed]       = useState(need)
  const [activeRitual,     setActiveRitual]     = useState(RITUALS[need.id])
  const [healthSnapshot,   setHealthSnapshot]   = useState(null)

// Reset du guard à chaque ouverture du modal
  useEffect(() => {
    _evalInProgress = false
  }, [])


  if (!activeRitual) return null

  const { g1, g2 } = activeNeed
  const bg = 'radial-gradient(circle at 50% 18%, #f5efe6, #e8dfd2 58%, #e0d4c0)'

  function handleEval(isLiked) {
  if (_evalInProgress) return
  _evalInProgress = true
  setLiked(isLiked)
  setHealthSnapshot({
    before: plantHealth ?? 0,
    after: Math.min(100, (plantHealth ?? 0) + (activeRitual.delta ?? 2))
  })
  onCompleteRitual?.(activeNeed.id, isLiked, activeRitual.delta ?? 2)
  if (isLiked) { setPhase('result') }
  else         { setPhase('alternative') }
}

  function handleStartAlternative(altNeed, altRitual) {
    setActiveNeed(altNeed)
    setActiveRitual(altRitual)
    setPhase(altRitual.breathing ? 'breathing' : 'doing')
  }

  const inner = (
    <div style={{ position:'relative', zIndex:1, width:'100%', flex:1, minHeight:0, background:bg, display:'flex', flexDirection:'column', overflow: isMobile ? 'auto' : 'hidden' }}>
      {/* Halos */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-10%', left:'-8%', width:400, height:400, borderRadius:'50%', background:`radial-gradient(circle,${g1}14 0%,transparent 65%)` }}/>
        <div style={{ position:'absolute', bottom:'-8%', right:'-8%', width:320, height:320, borderRadius:'50%', background:`radial-gradient(circle,${g2}12 0%,transparent 65%)` }}/>
      </div>

      {phase === 'view' && (
        <PhaseView ritual={activeRitual} need={activeNeed} isMobile={isMobile}
          onStart={() => setPhase(activeRitual.breathing ? 'breathing' : 'doing')}
          onBack={onBack} onClose={onClose}/>
      )}
      {phase === 'breathing' && (
        <PhaseBreathing ritual={activeRitual} need={activeNeed} isMobile={isMobile}
          onDone={() => setPhase('evaluate')} onClose={onClose}/>
      )}
      {phase === 'doing' && (
        <PhaseDoing ritual={activeRitual} need={activeNeed} isMobile={isMobile}
          onDone={() => setPhase('evaluate')} onClose={onClose}/>
      )}
      {phase === 'evaluate' && (
        <PhaseEvaluate ritual={activeRitual} need={activeNeed} isMobile={isMobile}
          onLiked={() => handleEval(true)} onNotLiked={() => handleEval(false)} onClose={onClose}/>
      )}
      {phase === 'alternative' && (
        <div style={{ position:'relative', width:'100%', height:'100%', display:'flex', flexDirection:'column' }}>
          <PhaseAlternative originalNeed={need} isMobile={isMobile}
            onStart={handleStartAlternative}
            onSkip={() => { setLiked(false); setPhase('result') }}
            onClose={onClose}/>
        </div>
      )}
      {phase === 'result' && (
  <PhaseResult need={activeNeed} isMobile={isMobile}
    onSeeFlower={onSeeFlower ?? onClose} onClose={onClose}
    healthBefore={healthSnapshot?.before ?? plantHealth ?? 0}
    healthAfter={healthSnapshot?.after ?? plantHealth ?? 0}/>
)}
    </div>
  )

  if (!isMobile) return (
    <>
      <style>{CSS}</style>
      <div style={{ position:'fixed', inset:0, zIndex:270, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div onClick={phase === 'view' ? onClose : undefined} style={{ position:'absolute', inset:0, background:'rgba(20,12,5,0.55)', backdropFilter:'blur(8px)' }}/>
        <div style={{ position:'relative', zIndex:1, width:'min(680px, 95vw)', maxHeight:'92vh', borderRadius:24, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.32)', display:'flex', flexDirection:'column' }}>
          {inner}
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{CSS}</style>
      <div style={{ position:'fixed', inset:0, zIndex:270, display:'flex', flexDirection:'column' }}>{inner}</div>
    </>
  )
}
