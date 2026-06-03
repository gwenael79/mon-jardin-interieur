// AudioRitualsModal.jsx — 5 rituels guidés en audio
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { WOFAudioPlayer } from '../pages/WeekOneFlow'
import { PhaseResult } from './RitualSuggestionModal'
import RitualCompletion from './RitualCompletion'
import { supabase } from '../core/supabaseClient'

const AUDIO_DAYS = [
  { title:'Revenir à mes racines',     color:'#c8a0b0', g2:'#9a7890', glow:'rgba(200,160,176,0.45)', audio:'/audio/ancrage.mp3',  emoji:'🌱', darkAt:  50, needId:'grounding'   },
  { title:'Retrouver mon appui',       color:'#9ab8c8', g2:'#7898b0', glow:'rgba(154,184,200,0.45)', audio:'/audio/tige.mp3',     emoji:'🌿', darkAt: 100, needId:'stress'      },
  { title:'Laisser circuler',          color:'#7aaa88', g2:'#5a8870', glow:'rgba(122,170,136,0.45)', audio:'/audio/feuille.mp3',  emoji:'🍃', darkAt:  88, needId:'emotions'    },
  { title:'Recevoir de la douceur',    color:'#d4a0b0', g2:'#b07890', glow:'rgba(212,160,176,0.45)', audio:'/audio/fleur.mp3',    emoji:'🌸', darkAt: 120, needId:'softness'    },
  { title:'Laisser le souffle relier', color:'#c8a870', g2:'#a08050', glow:'rgba(200,168,112,0.45)', audio:'/audio/souffle.mp3',  emoji:'🌬️', darkAt: 120, needId:'selfconnect' },
]

const CSS = `
  @keyframes breathe {
    0%, 100% { transform: scale(1);    opacity: 0.55; }
    50%       { transform: scale(1.55); opacity: 1;    }
  }
  @keyframes radioWave {
    0%   { transform: scale(1);   opacity: 0.55; }
    100% { transform: scale(3.2); opacity: 0;    }
  }
  @keyframes arm_cardIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes arm_fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`

// phase: 'list' | 'audio' | 'evaluate' | 'result'
export default function AudioRitualsModal({ onClose, plantId, plantHealth, onHealthUpdate, onSeeFlower, onboarding, onCompleteRitual, vitalityTotal, vitalityGain = 5 }) {
  const [phase,        setPhase]        = useState('list')
  const [activeDay,    setActiveDay]    = useState(null)
  const [healthData,   setHealthData]   = useState(null) // { before, after }

  function openAudio(day) {
    setActiveDay(day)
    setPhase('audio')
  }

  async function handleAudioDone() {
    if (onboarding) {
      // ── Capturer AVANT l'await (vitalityTotal peut changer pendant l'async) ──
      const v      = vitalityTotal ?? 0
      const g      = vitalityGain  ?? 5
      const before = Math.min(100, v + 5)   // health_DB avant ritual = vitality + 5
      const after  = Math.min(100, before + g)
      await onCompleteRitual?.()
      // Appeler setHealthData APRÈS l'await avec les variables figées
      setHealthData({ before, after })
      setPhase('result')
    } else {
      // ── Mode dashboard : santé plante +2, PhaseResult ──
      const before = plantHealth ?? 5
      const after  = Math.min(100, before + 2)
      setHealthData({ before, after })
      if (plantId) {
        onHealthUpdate?.(after)
        try {
          await supabase.from('plants').update({ health: after }).eq('id', plantId)
          window.dispatchEvent(new CustomEvent('plantHealthPatched', { detail: { health: after, plantId } }))
        } catch (e) { console.error('[audioRitual] health update failed:', e) }
      }
      setPhase('result')
    }
  }

  // need + ritual synthétiques pour PhaseEvaluate / PhaseResult
  const syntheticNeed = activeDay ? { id: activeDay.needId, g1: activeDay.color, g2: activeDay.g2, glow: activeDay.glow } : null

  const isFullHeight = phase === 'audio'
  const bg = 'linear-gradient(160deg,#fdf0e6 0%,#f5e6d8 45%,#ffffff 100%)'

  return createPortal(
    <>
      <style>{CSS}</style>
      <div style={{
        position:'fixed', inset:0, zIndex:99999,
        background:'rgba(10,5,2,0.72)',
        backdropFilter:'blur(6px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        animation:'arm_fadeIn .2s ease both',
      }}>
        <div style={{
          width:'min(92vw, 480px)',
          height: isFullHeight ? 'min(90dvh, 620px)' : 'auto',
          maxHeight:'90dvh',
          borderRadius:24,
          overflow:'hidden',
          boxShadow:'0 32px 80px rgba(0,0,0,0.30)',
          position:'relative',
          background: bg,
          animation:'arm_fadeIn .25s ease both',
        }}>

          {/* ── Player audio ── */}
          {phase === 'audio' && activeDay && (
            <WOFAudioPlayer
              audioSrc={activeDay.audio}
              title={activeDay.title}
              g1={activeDay.color}
              g2={activeDay.g2}
              glow={activeDay.glow}
              darkAt={activeDay.darkAt}
              bg={bg}
              onDone={handleAudioDone}
              onClose={() => setPhase('list')}
            />
          )}

          {/* ── Résultat : RitualCompletion (onboarding) ou PhaseResult (dashboard) ── */}
          {phase === 'result' && syntheticNeed && healthData && (
            onboarding ? (
              <RitualCompletion
                need={syntheticNeed}
                beforeHealth={healthData.before}
                displayHealth={healthData.after}
                vitalityGain={vitalityGain ?? 5}
                vitalityTotal={healthData.after}
                isMobile={false}
                onContinue={() => { window.dispatchEvent(new CustomEvent('ritualCompleteSnapshot', { detail: { before: healthData.before, after: healthData.after } })); onSeeFlower?.(); onClose() }}
              />
            ) : (
              <PhaseResult
                need={syntheticNeed}
                isMobile={true}
                healthBefore={healthData.before}
                healthAfter={healthData.after}
                onSeeFlower={() => { window.dispatchEvent(new CustomEvent('ritualCompleteSnapshot', { detail: { before: healthData.before, after: healthData.after } })); window.dispatchEvent(new CustomEvent('plantCelebrate')); (onSeeFlower ?? onClose)() }}
                onClose={() => { window.dispatchEvent(new CustomEvent('ritualCompleteSnapshot', { detail: { before: healthData.before, after: healthData.after } })); window.dispatchEvent(new CustomEvent('plantCelebrate')); onClose() }}
              />
            )
          )}

          {/* ── Liste des 5 cards ── */}
          {phase === 'list' && (
            <div style={{
              background: bg,
              padding:'32px 24px 28px',
              overflowY:'auto', maxHeight:'90dvh',
            }}>
              <button
                onClick={onClose}
                style={{
                  position:'absolute', top:14, right:14,
                  width:30, height:30, borderRadius:'50%',
                  background:'rgba(15,8,8,0.08)', border:'none',
                  cursor:'pointer', fontSize:13,
                  color:'rgba(15,8,8,0.50)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  zIndex:10,
                }}
              >✕</button>

              <p style={{ fontFamily:"'Jost',sans-serif", fontSize:11, letterSpacing:'.22em', textTransform:'uppercase', color:'rgba(15,8,8,0.38)', margin:'0 0 6px', textAlign:'center' }}>
                Rituels guidés
              </p>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(22px,6vw,27px)', fontWeight:700, fontStyle:'italic', color:'#1a0a08', margin:'0 0 26px', textAlign:'center', lineHeight:1.25 }}>
                La voix te guide
              </h2>

              <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
                {AUDIO_DAYS.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => openAudio(day)}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', gap:16,
                      padding:'15px 18px',
                      borderRadius:18,
                      border:'1px solid rgba(255,255,255,0.22)',
                      background:`radial-gradient(circle at 20% 38%, rgba(255,255,255,0.26), transparent 55%), linear-gradient(135deg, ${day.color}, ${day.g2})`,
                      boxShadow:`0 8px 22px ${day.glow}, inset 0 1px 2px rgba(255,255,255,0.28)`,
                      cursor:'pointer', textAlign:'left',
                      animation:`arm_cardIn .38s ease ${i * .07}s both`,
                      transition:'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px) scale(1.012)'; e.currentTarget.style.boxShadow=`0 16px 36px ${day.glow}` }}
                    onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=`0 8px 22px ${day.glow}, inset 0 1px 2px rgba(255,255,255,0.28)` }}
                  >
                    <div style={{
                      width:44, height:44, borderRadius:'50%', flexShrink:0,
                      background:`radial-gradient(circle at 38% 32%, rgba(255,255,255,0.42), ${day.color}aa, ${day.g2}88)`,
                      boxShadow:`0 0 0 8px ${day.color}20, 0 0 0 16px ${day.color}08`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:19,
                    }}>
                      {day.emoji}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, fontStyle:'italic', color:'#fff', lineHeight:1.2, textShadow:'0 1px 5px rgba(0,0,0,0.15)' }}>
                        {day.title}
                      </div>
                    </div>
                    <div style={{ color:'rgba(255,255,255,0.70)', fontSize:17, flexShrink:0 }}>▶</div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>,
    document.body
  )
}
