// src/pages/OnboardingScreen.jsx
import { useState } from 'react'
import { supabase } from '../core/supabaseClient'

export const ONBOARDING_SLIDES = [
  {
    id: 'stress',
    emoji: '🌊',
    tag: 'Le saviez-vous ?',
    title: 'Le stress d\'usure,\nun ennemi discret',
    body: 'Contrairement au stress aigu, le stress d\'usure s\'accumule silencieusement. Fatigue, irritabilité, perte d\'élan… il s\'installe sans prévenir et altère notre équilibre sans que l\'on s\'en rende compte.',
    highlight: 'Il touche 7 personnes sur 10 dans leur vie quotidienne.',
    color: 'var(--zone-breath)',
    visual: 'wave',
  },
  {
    id: 'freins',
    emoji: '🤔',
    tag: 'Pourquoi on attend',
    title: 'Trois raisons pour\nlesquelles on ne fait rien',
    bullets: [
      { icon: '⏱', label: 'Pas le temps', desc: '"Je le ferai quand j\'aurai un moment." Ce moment n\'arrive jamais.' },
      { icon: '👁', label: 'Pas visible', desc: 'Le bien-être intérieur ne se mesure pas dans un miroir.' },
      { icon: '📅', label: 'Pas immédiat', desc: 'On abandonne souvent avant de percevoir les bénéfices.' },
    ],
    color: 'var(--zone-roots)',
    visual: 'barriers',
  },
  {
    id: 'ritualisation',
    emoji: '🧠',
    tag: 'La science',
    title: 'Pourquoi la\nritualisation fonctionne',
    body: 'Répéter un geste simple active les mêmes circuits neuronaux chaque jour. Le cerveau apprend à anticiper ce moment de soin — il libère de la dopamine avant même que vous commenciez.',
    points: [
      'Réduit le cortisol en 3 à 4 semaines',
      'Renforce la neuroplasticité : le cerveau se reconfigure positivement',
      'Effet cumulatif : chaque jour ajoute une couche de résilience',
    ],
    color: 'var(--green)',
    visual: 'brain',
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
    color: 'var(--zone-flowers)',
    visual: 'growth',
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
    color: 'var(--gold)',
    visual: 'flower',
  },
]

// ── Visuel gauche selon la slide ─────────────────────────────────────────────
function SlideVisual({ slide }) {
  const c = slide.color
  const c20 = c + '33'
  const c40 = c + '66'

  if (slide.visual === 'wave') return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          position:'absolute',
          width: `${280 + i*80}px`, height: `${280 + i*80}px`,
          borderRadius:'50%',
          border: `1px solid ${c}${Math.round(40 - i*8).toString(16).padStart(2,'0')}`,
          animation: `onbPulse ${3+i*0.5}s ease-in-out ${i*0.3}s infinite`,
        }} />
      ))}
      <div style={{ fontSize:'var(--fs-emoji-lg, 100px)', animation:'onbFloat 4s ease-in-out infinite', zIndex:1 }}>🌊</div>
      <div style={{ position:'absolute', bottom:'15%', left:'50%', transform:'translateX(-50%)', textAlign:'center' }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'var(--fs-h1, 42px)', fontWeight:300, color:c, lineHeight:1 }}>7/10</div>
        <div style={{ fontSize:'var(--fs-h5, 11px)', color:c+'99', letterSpacing:'.12em', textTransform:'uppercase', marginTop:4 }}>personnes touchées</div>
      </div>
    </div>
  )

  if (slide.visual === 'barriers') return (
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:'0 10%' }}>
      {['⏱ Pas le temps','👁 Pas visible','📅 Pas immédiat'].map((label, i) => (
        <div key={i} style={{
          width:'100%', padding:'18px 24px',
          background:`${c}0a`, border:`1px solid ${c}22`,
          borderLeft:`3px solid ${c}`,
          borderRadius:'0 12px 12px 0',
          fontFamily:"'Cormorant Garamond',serif",
          fontSize:'var(--fs-h2, 22px)', fontWeight:300,
          color:'rgba(var(--text-on-dark-rgb),0.75)',
          animation:`onbIn .5s ease ${i*0.15}s both`,
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg, ${c}08, transparent)` }} />
          {label}
        </div>
      ))}
    </div>
  )

  if (slide.visual === 'brain') return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
      <div style={{ position:'relative', textAlign:'center' }}>
        <div style={{ fontSize:'var(--fs-emoji-lg, 110px)', animation:'onbFloat 3s ease-in-out infinite', lineHeight:1 }}>🧠</div>
        {[
          { label:'Dopamine', angle:-60, dist:140 },
          { label:'Cortisol ↓', angle:0, dist:155 },
          { label:'Résilience', angle:60, dist:140 },
        ].map(({label, angle, dist}, i) => {
          const rad = (angle - 90) * Math.PI / 180
          const x = Math.cos(rad) * dist
          const y = Math.sin(rad) * dist
          return (
            <div key={i} style={{
              position:'absolute',
              left:`calc(50% + ${x}px)`, top:`calc(50% + ${y}px)`,
              transform:'translate(-50%,-50%)',
              padding:'6px 14px',
              background:`${c}18`, border:`1px solid ${c}40`,
              borderRadius:100,
              fontSize:'var(--fs-h5, 12px)', color:c, fontWeight:500,
              animation:`onbIn .4s ease ${i*0.2+0.3}s both`,
              whiteSpace:'nowrap',
            }}>{label}</div>
          )
        })}
      </div>
    </div>
  )

  if (slide.visual === 'growth') return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0, width:'70%' }}>
        {[
          { label:'1ʳᵉ semaine', pct:25, emoji:'🌱' },
          { label:'3 semaines',  pct:55, emoji:'🌿' },
          { label:'2 mois',      pct:90, emoji:'🌸' },
        ].map(({label, pct, emoji}, i) => (
          <div key={i} style={{ width:'100%', marginBottom:28, animation:`onbIn .5s ease ${i*0.2}s both` }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:'var(--fs-h5, 12px)', color:'rgba(var(--text-on-dark-rgb),0.55)', letterSpacing:'.05em' }}>{emoji} {label}</span>
              <span style={{ fontSize:'var(--fs-h5, 12px)', color:c, fontWeight:600 }}>{pct}%</span>
            </div>
            <div style={{ height:6, borderRadius:100, background:'var(--track)', overflow:'hidden' }}>
              <div style={{
                height:'100%', width:`${pct}%`, borderRadius:100,
                background:`linear-gradient(90deg, ${c}88, ${c})`,
                animation:`growBar .8s ease ${i*0.25+0.3}s both`,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (slide.visual === 'flower') return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          position:'absolute',
          width:`${200+i*100}px`, height:`${200+i*100}px`,
          borderRadius:'50%',
          background: i===0 ? `radial-gradient(circle, ${c}18, transparent)` : 'transparent',
          border: i > 0 ? `1px solid ${c}${i===1?'22':'11'}` : 'none',
          animation:`onbPulse ${4+i}s ease-in-out ${i*0.4}s infinite`,
        }} />
      ))}
      <div style={{ textAlign:'center', zIndex:1 }}>
        <div style={{ fontSize:'var(--fs-emoji-lg, 120px)', animation:'onbFloat 3.5s ease-in-out infinite', lineHeight:1 }}>🌸</div>
        <div style={{
          marginTop:20,
          fontFamily:"'Cormorant Garamond',serif",
          fontSize:'var(--fs-h3, 18px)', fontWeight:300,
          color:'rgba(var(--text-on-dark-rgb),0.55)',
          fontStyle:'italic',
        }}>Votre jardin intérieur vous attend</div>
      </div>
    </div>
  )

  return <div style={{ fontSize:'var(--fs-emoji-lg, 80px)', display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>{slide.emoji}</div>
}

// ── Contenu texte droite ──────────────────────────────────────────────────────
function SlideContent({ slide, leaving }) {
  const c = slide.color
  return (
    <div className={leaving ? 'onb-out' : 'onb-in'} style={{ display:'flex', flexDirection:'column', height:'100%', justifyContent:'center' }}>

      {/* Tag */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
        <span style={{ fontSize:'var(--fs-h5, 11px)', letterSpacing:'.16em', textTransform:'uppercase', color:c, fontWeight:600,
          padding:'5px 14px', borderRadius:100, background:`${c}15`, border:`1px solid ${c}30` }}>
          {slide.tag}
        </span>
      </div>

      {/* Titre */}
      <div style={{
        fontFamily:"'Cormorant Garamond',serif",
        fontSize:'clamp(32px, 3.5vw, 52px)',
        fontWeight:300, lineHeight:1.15,
        color:'rgba(var(--text-on-dark-rgb),0.96)',
        marginBottom:32, whiteSpace:'pre-line',
        letterSpacing:'-0.01em',
      }}>{slide.title}</div>

      {/* Body simple */}
      {slide.body && !slide.bullets && !slide.points && !slide.timeline && !slide.features && (
        <>
          <p style={{ fontSize:'var(--fs-h3, 16px)', fontWeight:300, color:'rgba(var(--text-on-dark-rgb),0.62)', lineHeight:1.85, margin:'0 0 24px', maxWidth:480 }}>
            {slide.body}
          </p>
          {slide.highlight && (
            <div style={{
              padding:'16px 20px', borderRadius:14,
              background:`${c}12`, border:`1px solid ${c}28`,
              fontSize:'var(--fs-h3, 15px)', fontWeight:500, color:c, lineHeight:1.6, maxWidth:480,
            }}>💡 {slide.highlight}</div>
          )}
        </>
      )}

      {/* Bullets */}
      {slide.bullets && (
        <div style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:480 }}>
          {slide.bullets.map((b,i) => (
            <div key={i} style={{
              display:'flex', gap:16, alignItems:'flex-start',
              padding:'16px 18px', borderRadius:14,
              background:'var(--surface-2)', border:'1px solid var(--surface-3)',
              animation:`onbIn .4s ease ${i*.1+.1}s both`,
            }}>
              <span style={{ fontSize:'var(--fs-emoji-md, 22px)', flexShrink:0 }}>{b.icon}</span>
              <div>
                <div style={{ fontSize:'var(--fs-h4, 14px)', fontWeight:600, color:c, marginBottom:5 }}>{b.label}</div>
                <div style={{ fontSize:'var(--fs-h4, 13px)', fontWeight:300, color:'rgba(var(--text-on-dark-rgb),0.55)', lineHeight:1.7 }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Points */}
      {slide.points && (
        <>
          <p style={{ fontSize:'var(--fs-h3, 15px)', fontWeight:300, color:'rgba(var(--text-on-dark-rgb),0.62)', lineHeight:1.85, margin:'0 0 20px', maxWidth:480 }}>
            {slide.body}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:480 }}>
            {slide.points.map((p,i) => (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', animation:`onbIn .4s ease ${i*.1+.15}s both` }}>
                <span style={{ color:c, fontSize:'var(--fs-emoji-sm, 14px)', flexShrink:0, marginTop:3 }}>✦</span>
                <span style={{ fontSize:'var(--fs-h4, 14px)', fontWeight:300, color:'rgba(var(--text-on-dark-rgb),0.68)', lineHeight:1.7 }}>{p}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Timeline */}
      {slide.timeline && (
        <div style={{ display:'flex', flexDirection:'column', gap:0, maxWidth:480 }}>
          {slide.timeline.map((t,i) => (
            <div key={i} style={{ display:'flex', gap:0, animation:`onbIn .4s ease ${i*.12+.1}s both` }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginRight:18 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:c, flexShrink:0, marginTop:4 }} />
                {i < slide.timeline.length-1 && (
                  <div style={{ width:1, flex:1, minHeight:32, background:`${c}30` }} />
                )}
              </div>
              <div style={{ paddingBottom:24 }}>
                <div style={{ fontSize:'var(--fs-h5, 11px)', fontWeight:600, color:c, letterSpacing:'.08em', marginBottom:6, textTransform:'uppercase' }}>{t.period}</div>
                <div style={{ fontSize:'var(--fs-h4, 14px)', fontWeight:300, color:'rgba(var(--text-on-dark-rgb),0.62)', lineHeight:1.75 }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Features */}
      {slide.features && (
        <>
          <p style={{ fontSize:'var(--fs-h3, 16px)', fontWeight:300, color:'rgba(var(--text-on-dark-rgb),0.72)', lineHeight:1.85, margin:'0 0 28px', maxWidth:480 }}>
            {slide.body}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:480 }}>
            {slide.features.map((f,i) => (
              <div key={i} style={{ display:'flex', gap:16, alignItems:'center', animation:`onbIn .4s ease ${i*.1+.1}s both` }}>
                <span style={{
                  fontSize:'var(--fs-h2, 20px)', width:44, height:44, borderRadius:14, flexShrink:0,
                  background:`${c}15`, border:`1px solid ${c}28`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>{f.icon}</span>
                <span style={{ fontSize:'var(--fs-h3, 15px)', fontWeight:400, color:'rgba(var(--text-on-dark-rgb),0.80)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export const ONB_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');
  @keyframes onbIn    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes onbOut   { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-14px)} }
  @keyframes onbPulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.08);opacity:1} }
  @keyframes onbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes growBar  { from{width:0} }
  .onb-in  { animation: onbIn  .4s cubic-bezier(.22,1,.36,1) both }
  .onb-out { animation: onbOut .28s ease both }
`

export function SlideBody({ slide, leaving }) {
  return <SlideContent slide={slide} leaving={leaving} />
}

// ── Écran complet ─────────────────────────────────────────────────────────────
export function OnboardingScreen({ userId, onComplete }) {
  const [step,    setStep]    = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const slide  = ONBOARDING_SLIDES[step]
  const isLast = step === ONBOARDING_SLIDES.length - 1
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

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
      background:'linear-gradient(135deg, #0a1a0c 0%, #0e2012 40%, #081510 100%)',
      display:'flex', flexDirection:'column',
      fontFamily:"'Jost',sans-serif", overflow:'hidden',
    }}>
      <style>{ONB_STYLES}</style>

      {/* Barre progression */}
      <div style={{ position:'absolute', top:0, left:0, right:0, display:'flex', gap:4, padding:'0', zIndex:10 }}>
        {ONBOARDING_SLIDES.map((s,i) => (
          <div key={s.id} style={{
            flex:1, height:3,
            background: i < step ? slide.color : i === step ? slide.color+'88' : 'var(--surface-3)',
            transition:'background .4s ease',
          }}>
            {i === step && (
              <div style={{ height:'100%', background:slide.color, animation:'progressBar .3s ease both' }} />
            )}
          </div>
        ))}
      </div>

      {/* Layout principal */}
      {isMobile ? (
        /* ── MOBILE : colonne ── */
        <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'40px 24px 0', overflowY:'auto' }}>
          <div style={{ fontSize:'var(--fs-emoji-lg, 48px)', marginBottom:20, animation:'onbFloat 4s ease-in-out infinite' }}>{slide.emoji}</div>
          <SlideContent slide={slide} leaving={leaving} />
        </div>
      ) : (
        /* ── DESKTOP : 2 colonnes ── */
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:0 }}>

          {/* Colonne gauche — visuel immersif */}
          <div style={{
            position:'relative', overflow:'hidden',
            background:`radial-gradient(ellipse at 50% 50%, ${slide.color}10 0%, transparent 70%)`,
            borderRight:`1px solid ${slide.color}15`,
            transition:'background .6s ease',
          }}>
            {/* Grain texture */}
            <div style={{
              position:'absolute', inset:0,
              backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
              opacity:0.6, pointerEvents:'none',
            }} />

            {/* Numéro de slide discret */}
            <div style={{
              position:'absolute', top:28, left:32,
              fontFamily:"'Cormorant Garamond',serif",
              fontSize:'var(--fs-h4, 13px)', color:`${slide.color}50`,
              letterSpacing:'.12em',
            }}>{String(step+1).padStart(2,'0')} / {String(ONBOARDING_SLIDES.length).padStart(2,'0')}</div>

            <SlideVisual slide={slide} />
          </div>

          {/* Colonne droite — texte */}
          <div style={{
            display:'flex', flexDirection:'column',
            padding:'80px 64px 40px',
            justifyContent:'space-between',
          }}>
            <SlideContent slide={slide} leaving={leaving} />

            {/* Navigation */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:48 }}>
              {step > 0 && (
                <button onClick={prev} style={{
                  width:48, height:48, borderRadius:14, flexShrink:0,
                  border:`1px solid var(--surface-3)`,
                  background:'var(--surface-2)',
                  color:'rgba(var(--text-on-dark-rgb),0.40)', fontSize:'var(--fs-h3, 16px)', cursor:'pointer', fontFamily:"'Jost',sans-serif",
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all .2s',
                }}>←</button>
              )}
              <button onClick={next} disabled={loading} style={{
                flex:1, padding:'16px 28px', borderRadius:14,
                border:`1px solid ${isLast ? slide.color+'70' : 'var(--surface-3)'}`,
                background: isLast
                  ? `linear-gradient(135deg, ${slide.color}30, ${slide.color}15)`
                  : 'var(--surface-2)',
                color: isLast ? slide.color : 'rgba(var(--text-on-dark-rgb),0.80)',
                fontSize:'var(--fs-h3, 15px)', fontWeight: isLast ? 500 : 400,
                letterSpacing: isLast ? '.08em' : '.03em',
                cursor:'pointer', fontFamily:"'Jost',sans-serif",
                transition:'all .25s',
              }}>
                {loading ? '…' : isLast ? '🌱  Commencer mon jardin' : 'Continuer →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation mobile */}
      {isMobile && (
        <div style={{ padding:'16px 24px 36px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          {step > 0 && (
            <button onClick={prev} style={{
              padding:'14px 18px', borderRadius:12, border:'1px solid var(--surface-3)',
              background:'var(--surface-2)', color:'rgba(var(--text-on-dark-rgb),0.40)',
              fontSize:'var(--fs-h4, 13px)', cursor:'pointer', fontFamily:"'Jost',sans-serif", flexShrink:0,
            }}>←</button>
          )}
          <button onClick={next} disabled={loading} style={{
            flex:1, padding:'15px 20px', borderRadius:12,
            border:`1px solid ${isLast ? slide.color+'60' : 'var(--surface-3)'}`,
            background: isLast ? `linear-gradient(135deg,${slide.color}28,${slide.color}12)` : 'var(--surface-2)',
            color: isLast ? slide.color : 'rgba(var(--text-on-dark-rgb),0.75)',
            fontSize: isLast ? 14 : 13, fontWeight: isLast ? 500 : 400,
            cursor:'pointer', fontFamily:"'Jost',sans-serif",
          }}>
            {loading ? '…' : isLast ? '🌱  Commencer mon jardin' : 'Continuer →'}
          </button>
        </div>
      )}
    </div>
  )
}
