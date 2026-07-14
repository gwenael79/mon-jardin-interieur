// AudioRitualsModal.jsx — 5 rituels guidés en audio
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { WOFAudioPlayer } from '../pages/WeekOneFlow'
import { PhaseResult } from './RitualSuggestionModal'
import RitualCompletion from './RitualCompletion'
import { supabase } from '../core/supabaseClient'
import { completeRitualHealth } from '../utils/completeRitualHealth'

// Les 5 audios sont rangés par besoin (needId), pas par zone — mapping identique
// à NEED_TO_ZONE (DashboardV2.jsx) pour rester cohérent avec le reste de l'app.
const NEED_TO_ZONE = {
  grounding:   'roots',
  stress:      'roots',
  emotions:    'flowers',
  softness:    'breath',
  selfconnect: 'flowers',
}
const ZONE_LABELS = { roots: 'Racines', stem: 'Tige', leaves: 'Feuilles', flowers: 'Fleurs', breath: 'Souffle' }

const AUDIO_DAYS = [
  {
    title:'Revenir à mes racines', color:'#c8a0b0', g2:'#9a7890', glow:'rgba(200,160,176,0.45)', audio:'/audio/ancrage.mp3', emoji:'🌱', darkAt: 50, needId:'grounding',
    intro: 'Cet audio d\'ancrage vous invite à ralentir quelques instants pour retrouver stabilité et présence. Grâce à la respiration et à la visualisation de racines profondes, vous renforcez votre sentiment de sécurité intérieure, apaisez le mental et revenez à l\'instant présent. Un moment simple pour cultiver calme, équilibre et confiance.',
  },
  {
    title:'Retrouver mon appui', color:'#9ab8c8', g2:'#7898b0', glow:'rgba(154,184,200,0.45)', audio:'/audio/tige.mp3', emoji:'🌿', darkAt: 100, needId:'stress',
    intro: 'La tige symbolise votre capacité à avancer, à grandir et à vous adapter. Cet audio vous invite à renforcer votre confiance, votre persévérance et votre élan intérieur. Prenez quelques minutes pour vous reconnecter à vos ressources et retrouver la force tranquille qui vous permet d\'avancer, un pas après l\'autre.',
  },
  {
    title:'Laisser circuler', color:'#7aaa88', g2:'#5a8870', glow:'rgba(122,170,136,0.45)', audio:'/audio/feuille.mp3', emoji:'🍃', darkAt: 88, needId:'emotions',
    intro: 'Les feuilles symbolisent notre relation au monde, à nos émotions et à ce que nous recevons de notre environnement. Cet audio vous invite à ralentir, à accueillir ce qui est présent en vous avec bienveillance et à retrouver une circulation plus fluide de vos ressentis. Un moment de calme pour respirer, observer et vous reconnecter à vous-même.',
  },
  {
    title:'Recevoir de la douceur', color:'#d4a0b0', g2:'#b07890', glow:'rgba(212,160,176,0.45)', audio:'/audio/fleur.mp3', emoji:'🌸', darkAt: 120, needId:'softness',
    intro: 'Cet audio vous invite à vous reconnecter à votre fleur intérieure, symbole de votre épanouissement personnel. À travers une visualisation douce et apaisante, vous apprendrez à reconnaître votre valeur, accueillir votre singularité et vous autoriser à rayonner davantage. Un moment de bienveillance pour cultiver confiance, estime de soi et ouverture à la vie.',
  },
  {
    title:'Laisser le souffle relier', color:'#c8a870', g2:'#a08050', glow:'rgba(200,168,112,0.45)', audio:'/audio/souffle.mp3', emoji:'🌬️', darkAt: 120, needId:'selfconnect',
    intro: 'Cet audio vous invite à ralentir et à revenir à l\'essentiel : votre souffle. À travers une visualisation douce inspirée de la nature, vous apprendrez à relâcher les tensions, apaiser le mental et retrouver votre présence intérieure. Quelques minutes suffisent pour vous reconnecter à vous-même et cultiver un sentiment durable de calme et d\'équilibre.',
  },
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

const FREE_AUDIO_COUNT = 2

// phase: 'list' | 'intro' | 'audio' | 'evaluate' | 'result'
export default function AudioRitualsModal({ onClose, userId, plantId, plantHealth, onHealthUpdate, onSeeFlower, onboarding, onCompleteRitual, vitalityTotal, vitalityGain = 5, isPremium, onUpgrade }) {
  const [phase,         setPhase]        = useState('list')
  const [activeDay,     setActiveDay]    = useState(null)
  const [healthData,    setHealthData]   = useState(null)
  const [launchedAudio, setLaunchedAudio] = useState(null)

  function openAudio(day, index) {
    if (index >= FREE_AUDIO_COUNT && !isPremium) { onUpgrade?.(); return }
    setActiveDay(day)
    setPhase('intro')
  }

  function handleLaunchAudio() {
    const audio = new Audio(activeDay.audio)
    audio.play()
      .then(() => { setLaunchedAudio(audio); setPhase('audio') })
      .catch(() => { setLaunchedAudio(null); setPhase('audio') })
  }

  async function handleAudioDone() {
    if (onboarding) {
      // ── Capturer AVANT l'await (vitalityTotal peut changer pendant l'async) ──
      const v      = vitalityTotal ?? 0
      const g      = vitalityGain  ?? 5
      const before = Math.min(100, v + 5)   // health_DB avant ritual = vitality + 5
      const after  = Math.min(100, before + g)
      // needId + isLiked + delta — même signature que RitualSuggestionModal.PhaseFelt,
      // sinon le log dans `rituals` est silencieusement sauté côté OnboardingScreen.
      await onCompleteRitual?.(activeDay?.needId, true, g)
      // Appeler setHealthData APRÈS l'await avec les variables figées
      setHealthData({ before, after })
      setPhase('result')
    } else {
      // ── Mode dashboard : passe par completeRitualHealth comme tous les autres
      // points d'entrée rituels (retrouve la plante du jour via userId si plantId
      // n'est pas encore chargé, au lieu de sauter l'écriture en silence) ──
      const before = plantHealth ?? 5
      const zoneId = NEED_TO_ZONE[activeDay?.needId] ?? 'roots'
      const after  = await completeRitualHealth({ plantId, zoneId, onHealthUpdate, userId })
      setHealthData({ before, after: after ?? before })
      if (after != null && userId) {
        try {
          await supabase.from('rituals').insert({ user_id: userId, plant_id: plantId, name: activeDay?.title ?? 'Rituel audio', zone: ZONE_LABELS[zoneId] ?? zoneId, health_delta: after - before })
        } catch (e) { console.error('[audioRitual] log failed:', e) }
      }
      setPhase('result')
    }
  }

  // need + ritual synthétiques pour PhaseEvaluate / PhaseResult
  const syntheticNeed = activeDay ? { id: activeDay.needId, g1: activeDay.color, g2: activeDay.g2, glow: activeDay.glow } : null

  const isFullHeight = phase === 'audio' || phase === 'intro'
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

          {/* ── Intro avant audio ── */}
          {phase === 'intro' && activeDay && (() => {
            const intro = activeDay.intro ?? ''
            const { color: g1, g2, glow } = activeDay
            return (
              <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
                <div style={{ flexShrink:0, padding:'18px 18px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <button onClick={() => setPhase('list')} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.55)', border:'1px solid rgba(180,160,140,0.25)', borderRadius:100, padding:'7px 16px', cursor:'pointer', color:'rgba(50,35,20,0.65)', fontSize:13, fontFamily:"'Jost',sans-serif" }}>‹ Retour</button>
                  <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.55)', border:'1px solid rgba(180,160,140,0.25)', cursor:'pointer', color:'rgba(50,35,20,0.45)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                </div>
                <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', display:'flex', flexDirection:'column', justifyContent:'center', padding:'28px 22px calc(env(safe-area-inset-bottom,0px) + 32px)', gap:22 }}>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:100, background:`linear-gradient(135deg,${g1},${g2})`, boxShadow:`0 4px 16px ${glow}`, alignSelf:'flex-start', animation:'arm_cardIn .3s ease both' }}>
                    <span style={{ fontSize:18 }}>{activeDay.emoji}</span>
                    <span style={{ fontFamily:"'Jost',sans-serif", fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.95)', letterSpacing:'.08em', textTransform:'uppercase' }}>{activeDay.title}</span>
                  </div>
                  {intro && (
                    <div style={{ padding:'22px 20px', borderRadius:20, background:'rgba(255,255,255,0.75)', border:'1px solid rgba(180,160,140,0.22)', animation:'arm_cardIn .38s ease .06s both' }}>
                      <p style={{ fontFamily:"'Jost',sans-serif", fontSize:22, fontWeight:300, color:'rgba(50,35,20,0.88)', margin:0, lineHeight:1.65, letterSpacing:'-.01em' }}>
                        {intro}
                      </p>
                    </div>
                  )}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, animation:'arm_cardIn .4s ease .12s both' }}>
                    <button onClick={handleLaunchAudio}
                      style={{ padding:'18px 0', width:'100%', maxWidth:320, borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:17, fontWeight:700, color:'#fff', background:`linear-gradient(135deg,${g1},${g2})`, boxShadow:`0 8px 32px ${glow}`, transition:'transform .18s ease' }}
                      onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform='none'}
                    >
                      🔊 Lancer l'audio
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}

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
              preloadedAudio={launchedAudio}
              onDone={() => { setLaunchedAudio(null); handleAudioDone() }}
              onClose={() => { setLaunchedAudio(null); setPhase('list') }}
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
                {AUDIO_DAYS.map((day, i) => {
                  const locked = i >= FREE_AUDIO_COUNT && !isPremium
                  return (
                  <button
                    key={i}
                    onClick={() => openAudio(day, i)}
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
                      opacity: locked ? 0.78 : 1,
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
                    {locked ? (
                      <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                        <span style={{ fontSize:17 }}>🔒</span>
                        <span style={{ fontFamily:"'Jost',sans-serif", fontSize:9, fontWeight:600, letterSpacing:'.07em', color:'rgba(255,255,255,0.90)', textTransform:'uppercase' }}>Premium</span>
                      </div>
                    ) : (
                      <div style={{ color:'rgba(255,255,255,0.70)', fontSize:17, flexShrink:0 }}>▶</div>
                    )}
                  </button>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </>,
    document.body
  )
}
