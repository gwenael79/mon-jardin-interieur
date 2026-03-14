// src/pages/OnboardingScreen.jsx
import { useState } from 'react'
import { supabase } from '../core/supabaseClient'

export const ONBOARDING_SLIDES = [
  {
    id: 'stress',
    emoji: '🌊',
    tag: 'Le saviez-vous ?',
    title: 'Le stress d\'usure,\nun ennemi discret',
    body: 'Contrairement au stress aigu (une urgence, un choc), le stress d\'usure s\'accumule silencieusement. Fatigue, irritabilité, perte d\'élan… il s\'installe sans prévenir et altère notre équilibre sans que l\'on s\'en rende compte.',
    highlight: 'Il touche 7 personnes sur 10 dans leur vie quotidienne.',
    color: '#78B4C8',
  },
  {
    id: 'freins',
    emoji: '🤔',
    tag: 'Pourquoi on attend',
    title: 'Trois raisons pour\nlesquelles on ne fait rien',
    bullets: [
      { icon: '⏱', label: 'Pas le temps', desc: '"Je le ferai quand j\'aurai un moment." Ce moment n\'arrive jamais.' },
      { icon: '👁', label: 'Pas visible', desc: 'Le bien-être intérieur ne se mesure pas dans un miroir. Difficile de prendre soin de ce qu\'on ne voit pas.' },
      { icon: '📅', label: 'Pas immédiat', desc: 'Les bénéfices arrivent progressivement. On abandonne souvent avant de les percevoir.' },
    ],
    color: '#C8894A',
  },
  {
    id: 'ritualisation',
    emoji: '🧠',
    tag: 'La science',
    title: 'Pourquoi la\nritualisation fonctionne',
    body: 'Répéter un geste simple active les mêmes circuits neuronaux chaque jour. Le cerveau apprend à anticiper ce moment de soin — il libère de la dopamine avant même que vous commenciez.',
    points: [
      'Réduit le cortisol (hormone du stress) en 3 à 4 semaines',
      'Renforce la neuroplasticité : le cerveau se reconfigure positivement',
      'Effet cumulatif : chaque jour ajoute une couche de résilience',
    ],
    color: '#96d485',
  },
  {
    id: 'benefices',
    emoji: '🌱',
    tag: 'Ce qui vous attend',
    title: 'Des bénéfices\nconcrets et progressifs',
    timeline: [
      { period: 'Dès la 1ʳᵉ semaine', desc: 'Un sentiment de structure et de reprise de contrôle sur votre journée.' },
      { period: 'Après 3 semaines', desc: 'Moins de réactivité émotionnelle, meilleure qualité de sommeil.' },
      { period: 'Après 2 mois', desc: 'Une résilience renforcée face aux imprévus du quotidien.' },
    ],
    color: '#C878A0',
  },
  {
    id: 'promise',
    emoji: '🌸',
    tag: 'Votre jardin',
    title: '2 minutes par jour\nsuffit pour commencer',
    body: 'Pas de performance. Pas d\'exigence. Juste un espace à vous, chaque jour, pour prendre soin de ce qui compte vraiment.',
    features: [
      { icon: '⚡', text: 'Des rituels de 2 à 5 minutes, à votre rythme' },
      { icon: '📊', text: 'Votre progression visible au quotidien' },
      { icon: '🌿', text: 'Une plante qui grandit avec vous' },
    ],
    color: '#e8c060',
  },
]

// ── Rendu d'une slide (partagé entre OnboardingScreen et HelpModal) ──────────
export function SlideBody({ slide, leaving }) {
  return (
    <div className={leaving ? 'onb-out' : 'onb-in'} style={{
      flex:1, display:'flex', flexDirection:'column',
      padding:'24px 32px 0', maxWidth:580, width:'100%',
      margin:'0 auto', overflowY:'auto',
    }}>
      {/* Tag + emoji */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <span style={{ fontSize:34, animation:'onbPulse 3s ease-in-out infinite', display:'inline-block' }}>{slide.emoji}</span>
        <span style={{
          fontSize:10, letterSpacing:'.14em', textTransform:'uppercase',
          color:slide.color, fontWeight:500,
          padding:'3px 10px', borderRadius:20,
          background:`${slide.color}15`, border:`1px solid ${slide.color}30`,
        }}>{slide.tag}</span>
      </div>

      {/* Titre */}
      <div style={{
        fontFamily:"'Cormorant Garamond',serif",
        fontSize:'clamp(24px,4.5vw,32px)',
        fontWeight:300, lineHeight:1.22,
        color:'rgba(242,237,224,0.95)',
        marginBottom:22, whiteSpace:'pre-line',
      }}>{slide.title}</div>

      {/* Body + highlight */}
      {slide.body && !slide.bullets && !slide.points && !slide.timeline && !slide.features && (
        <>
          <p style={{ fontSize:13.5, fontWeight:300, color:'rgba(242,237,224,0.70)', lineHeight:1.82, margin:'0 0 18px' }}>
            {slide.body}
          </p>
          {slide.highlight && (
            <div style={{
              padding:'12px 16px', borderRadius:12,
              background:`${slide.color}10`, border:`1px solid ${slide.color}25`,
              fontSize:13, fontWeight:500, color:slide.color, lineHeight:1.6,
            }}>💡 {slide.highlight}</div>
          )}
        </>
      )}

      {/* 3 freins */}
      {slide.bullets && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {slide.bullets.map((b,i) => (
            <div key={i} style={{
              display:'flex', gap:14, alignItems:'flex-start',
              padding:'13px 15px', borderRadius:13,
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
              animation:`onbIn .4s ease ${i*.1+.1}s both`,
            }}>
              <span style={{ fontSize:20, flexShrink:0, marginTop:1 }}>{b.icon}</span>
              <div>
                <div style={{ fontSize:12.5, fontWeight:600, color:slide.color, marginBottom:3 }}>{b.label}</div>
                <div style={{ fontSize:12, fontWeight:300, color:'rgba(242,237,224,0.58)', lineHeight:1.72 }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ritualisation */}
      {slide.points && (
        <>
          <p style={{ fontSize:13.5, fontWeight:300, color:'rgba(242,237,224,0.70)', lineHeight:1.82, margin:'0 0 16px' }}>
            {slide.body}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {slide.points.map((p,i) => (
              <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', animation:`onbIn .4s ease ${i*.1+.15}s both` }}>
                <span style={{ color:slide.color, fontSize:13, flexShrink:0, marginTop:3 }}>✦</span>
                <span style={{ fontSize:13, fontWeight:300, color:'rgba(242,237,224,0.68)', lineHeight:1.72 }}>{p}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Timeline bénéfices */}
      {slide.timeline && (
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {slide.timeline.map((t,i) => (
            <div key={i} style={{ display:'flex', gap:0, animation:`onbIn .4s ease ${i*.12+.1}s both` }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginRight:14 }}>
                <div style={{ width:9, height:9, borderRadius:'50%', background:slide.color, flexShrink:0, marginTop:5 }} />
                {i < slide.timeline.length-1 && (
                  <div style={{ width:1, flex:1, minHeight:28, background:`${slide.color}30` }} />
                )}
              </div>
              <div style={{ paddingBottom:20 }}>
                <div style={{ fontSize:10.5, fontWeight:600, color:slide.color, letterSpacing:'.06em', marginBottom:4, textTransform:'uppercase' }}>{t.period}</div>
                <div style={{ fontSize:13, fontWeight:300, color:'rgba(242,237,224,0.66)', lineHeight:1.72 }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Features (slide finale) */}
      {slide.features && (
        <>
          <p style={{ fontSize:14, fontWeight:300, color:'rgba(242,237,224,0.78)', lineHeight:1.82, margin:'0 0 22px' }}>
            {slide.body}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
            {slide.features.map((f,i) => (
              <div key={i} style={{ display:'flex', gap:13, alignItems:'center', animation:`onbIn .4s ease ${i*.1+.1}s both` }}>
                <span style={{
                  fontSize:17, width:36, height:36, borderRadius:'50%', flexShrink:0,
                  background:`${slide.color}15`, border:`1px solid ${slide.color}25`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>{f.icon}</span>
                <span style={{ fontSize:13, fontWeight:400, color:'rgba(242,237,224,0.78)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Styles partagés ───────────────────────────────────────────────────────────
export const ONB_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');
  @keyframes onbIn    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes onbOut   { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-12px)} }
  @keyframes onbPulse { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.1);opacity:1} }
  .onb-in  { animation: onbIn  .35s cubic-bezier(.22,1,.36,1) both }
  .onb-out { animation: onbOut .28s ease both }
`

// ── Écran complet — première connexion ───────────────────────────────────────
export function OnboardingScreen({ userId, onComplete }) {
  const [step,    setStep]    = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const slide  = ONBOARDING_SLIDES[step]
  const isLast = step === ONBOARDING_SLIDES.length - 1

  async function next() {
    if (leaving) return
    if (isLast) {
      setLoading(true)
      // onboarded:true sera mis après le choix du plan dans App.jsx
      onComplete()
      return
    }
    setLeaving(true)
    setTimeout(() => { setStep(s => s + 1); setLeaving(false) }, 300)
  }

  function prev() {
    if (step === 0 || leaving) return
    setLeaving(true)
    setTimeout(() => { setStep(s => s - 1); setLeaving(false) }, 300)
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'linear-gradient(160deg, #0e1c12 0%, #162a18 50%, #0a1510 100%)',
      display:'flex', flexDirection:'column',
      fontFamily:"'Jost',sans-serif", overflow:'hidden',
    }}>
      <style>{ONB_STYLES}</style>

      {/* Barre de progression */}
      <div style={{ padding:'20px 28px 0', display:'flex', gap:6, flexShrink:0 }}>
        {ONBOARDING_SLIDES.map((s,i) => (
          <div key={s.id} style={{
            flex:1, height:2, borderRadius:2,
            background: i <= step ? slide.color : 'rgba(255,255,255,0.10)',
            transition:'background .4s ease',
          }} />
        ))}
      </div>

      <SlideBody slide={slide} leaving={leaving} />

      {/* Navigation */}
      <div style={{
        padding:'18px 32px 38px', maxWidth:580, width:'100%', margin:'0 auto',
        display:'flex', alignItems:'center', gap:10, flexShrink:0,
      }}>
        {step > 0 && (
          <button onClick={prev} style={{
            padding:'13px 18px', borderRadius:12, border:'1px solid rgba(255,255,255,0.10)',
            background:'rgba(255,255,255,0.04)', color:'rgba(242,237,224,0.40)',
            fontSize:13, cursor:'pointer', fontFamily:"'Jost',sans-serif", flexShrink:0,
          }}>←</button>
        )}
        <button onClick={next} disabled={loading} style={{
          flex:1, padding:'14px 20px', borderRadius:12,
          border:`1px solid ${isLast ? slide.color+'60' : 'rgba(255,255,255,0.12)'}`,
          background: isLast
            ? `linear-gradient(135deg,${slide.color}28,${slide.color}12)`
            : 'rgba(255,255,255,0.05)',
          color: isLast ? slide.color : 'rgba(242,237,224,0.75)',
          fontSize: isLast ? 14 : 13, fontWeight: isLast ? 500 : 400,
          letterSpacing: isLast ? '.07em' : '.03em',
          cursor:'pointer', fontFamily:"'Jost',sans-serif", transition:'all .2s',
        }}>
          {loading ? '…' : isLast ? '🌱  Commencer mon jardin' : 'Continuer →'}
        </button>
      </div>
    </div>
  )
}
