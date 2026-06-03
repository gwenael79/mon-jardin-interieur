// RitualSuggestionModalOnboarding.jsx — rituel onboarding : vue + audio/respiration + completion
import { useState, useEffect } from 'react'
import { useIsMobile } from '../pages/dashboardShared'
import RitualCompletion from './RitualCompletion'
import {
  NEEDS, RITUALS, CSS, PHASE_PALETTE,
  PhaseBreathing, PhaseAudio,
} from './RitualSuggestionModal'

// ─── Conversion vitalité → santé (même formule qu'OnboardingScreen) ───────────
function vitalityToHealth(v) {
  if (v <= 0)  return 0
  if (v >= 50) return 100
  const pts  = [0, 3.5, 6.5, 12, 20, 30, 43, 56, 69, 83, 100]
  const step = v / 5
  const lo   = Math.floor(step)
  const hi   = Math.ceil(step)
  if (lo === hi) return pts[lo]
  return pts[lo] + (pts[hi] - pts[lo]) * (step - lo)
}

// ─── Phase : vue initiale du rituel (onboarding) ─────────────────────────────
function PhaseViewOnboarding({ ritual, need, isMobile, startMode, onStart, onBack, onClose }) {
  const { g1, g2, glow } = need

  const buttonLabel =
    startMode === 'audio'     ? '🔊 Écouter le rituel guidé'  :
    startMode === 'breathing' ? 'Faire le rituel'              :
                                'J\'ai fait ce rituel ✓'

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
        <div style={{ textAlign:'center', animation:'rs_in .4s ease .5s both', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <button onClick={onStart}
            style={{ padding:'18px 0', width:'100%', maxWidth:340, borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:17, fontWeight:700, color:'#fff', background:`linear-gradient(135deg,${g1},${g2})`, boxShadow:`0 8px 32px ${glow}`, transition:'transform .18s ease' }}
            onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform='none'}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Guard anti-double (survit aux remounts StrictMode) ───────────────────────
let _evalInProgress = false

// ─── Composant principal ──────────────────────────────────────────────────────
export default function RitualSuggestionModalOnboarding({
  need, onBack, onClose, onSeeFlower, onCompleteRitual, vitalityTotal, vitalityGain = 5,
}) {
  const isMobile    = useIsMobile()
  const activeNeed  = NEEDS.find(n => n.id === (need?.id ?? need)) ?? NEEDS[0]
  const activeRitual = RITUALS[activeNeed.id]

  const [phase,          setPhase]          = useState('view')
  const [audioAvailable, setAudioAvailable] = useState(false)
  const [healthSnapshot, setHealthSnapshot] = useState(null)

  // Reset guard on mount
  useEffect(() => { _evalInProgress = false }, [])

  // Détection audio via élément Audio (le fallback SPA de Vite retourne 200 sur HEAD)
  useEffect(() => {
    if (!activeNeed?.id) return
    const audio = new Audio()
    const ok  = () => setAudioAvailable(true)
    const err = () => setAudioAvailable(false)
    audio.addEventListener('loadedmetadata', ok,  { once: true })
    audio.addEventListener('error',          err, { once: true })
    audio.src  = `/audio/${activeNeed.id}.mp3`
    audio.load()
    return () => { audio.removeEventListener('loadedmetadata', ok); audio.removeEventListener('error', err) }
  }, [activeNeed?.id])

  if (!activeRitual) return null

  const startMode =
    audioAvailable          ? 'audio'     :
    activeRitual.breathing  ? 'breathing' :
                              'done'

  function handleViewStart() {
    if      (startMode === 'audio')     setPhase('audio')
    else if (startMode === 'breathing') setPhase('ritual-breathing')
    else                                handleDone()
  }

  function handleDone() {
    if (_evalInProgress) return
    _evalInProgress = true
    const beforeHealth  = vitalityToHealth(Math.max(0, vitalityTotal ?? 0))
    const displayHealth = vitalityToHealth(Math.min(50, (vitalityTotal ?? 0) + (vitalityGain ?? 5)))
    setHealthSnapshot({ beforeHealth, displayHealth })
    onCompleteRitual?.(activeNeed.id, true, activeRitual.delta ?? 2)
    setPhase('completion')
  }

  const { g1, g2 } = activeNeed
  const bg = 'radial-gradient(circle at 50% 18%, #f5efe6, #e8dfd2 58%, #e0d4c0)'

  if (phase === 'completion') {
    return (
      <>
        <style>{CSS}</style>
        <RitualCompletion
          need={activeNeed}
          beforeHealth={healthSnapshot?.beforeHealth ?? 0}
          displayHealth={healthSnapshot?.displayHealth ?? 0}
          vitalityGain={vitalityGain}
          vitalityTotal={vitalityTotal}
          isMobile={isMobile}
          onContinue={() => {
            if (healthSnapshot) window.dispatchEvent(new CustomEvent('ritualCompleteSnapshot', { detail: { before: healthSnapshot.beforeHealth, after: healthSnapshot.displayHealth } }))
            ;(onSeeFlower ?? onClose)()
          }}
        />
      </>
    )
  }

  const inner = (
    <div style={{ position:'relative', zIndex:1, width:'100%', flex:1, minHeight:0, background:bg, display:'flex', flexDirection:'column', overflow: isMobile ? 'auto' : 'hidden' }}>
      {/* Halos */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-10%', left:'-8%', width:400, height:400, borderRadius:'50%', background:`radial-gradient(circle,${g1}14 0%,transparent 65%)` }}/>
        <div style={{ position:'absolute', bottom:'-8%', right:'-8%', width:320, height:320, borderRadius:'50%', background:`radial-gradient(circle,${g2}12 0%,transparent 65%)` }}/>
      </div>

      {phase === 'view' && (
        <PhaseViewOnboarding
          ritual={activeRitual} need={activeNeed} isMobile={isMobile}
          startMode={startMode}
          onStart={handleViewStart}
          onBack={onBack} onClose={onClose}
        />
      )}
      {phase === 'audio' && (
        <PhaseAudio
          ritual={activeRitual} need={activeNeed} isMobile={isMobile}
          onValidate={handleDone} onClose={onClose}
        />
      )}
      {phase === 'ritual-breathing' && (
        <PhaseBreathing
          ritual={activeRitual} need={activeNeed} isMobile={isMobile}
          onDone={handleDone} onClose={onClose}
        />
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
