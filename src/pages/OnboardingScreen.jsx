// src/pages/OnboardingScreen.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../core/supabaseClient'
import { useTheme } from '../hooks/useTheme'

// ─────────────────────────────────────────────────────────────────────────────
//  DONNÉES SLIDES
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
//  ICÔNES SVG — remplacent les emojis pour un rendu cohérent partout
// ─────────────────────────────────────────────────────────────────────────────
export const ONBOARDING_SLIDES = [
  {
    id: 'stress', tag: 'Le saviez-vous ?',
    title: 'Le stress d\'usure,\nun ennemi discret',
    body: 'Contrairement au stress aigu, le stress d\'usure s\'accumule silencieusement. Fatigue, irritabilité, perte d\'élan… il s\'installe sans prévenir et altère notre équilibre sans que l\'on s\'en rende compte.',
    highlight: 'Il touche 7 personnes sur 10 dans leur vie quotidienne.',
    color: '#9ab8c8', visual: 'wave',
  },
  {
    id: 'freins', tag: 'Pourquoi on attend',
    title: 'Trois raisons pour\nlesquelles on ne fait rien',
    bullets: [
      { icon:'⏱', label: 'Pas le temps', desc: '"Je le ferai quand j\'aurai un moment." Ce moment n\'arrive jamais.' },
      { icon:'👁', label: 'Pas visible', desc: 'Le bien-être intérieur ne se mesure pas dans un miroir.' },
      { icon:'📅', label: 'Pas immédiat', desc: 'On abandonne souvent avant de percevoir les bénéfices.' },
    ],
    color: '#c89898', visual: 'barriers',
  },
  {
    id: 'ritualisation', tag: 'La science',
    title: 'Pourquoi la\nritualisation fonctionne',
    body: 'Répéter un geste simple active les mêmes circuits neuronaux chaque jour. Le cerveau apprend à anticiper ce moment de soin, il libère de la dopamine avant même que vous commenciez. Progressivement, le cortisol diminue en quelques semaines, la neuroplasticité s’active , le cerveau se reconfigure positivement et un effet cumulatif s’installe : chaque jour renforce votre stabilité et votre résilience.',
        color: '#7aaa88', visual: 'brain',
  },
  {
    id: 'benefices', tag: 'Ce qui vous attend',
    title: 'Des bénéfices\nconcrets et progressifs',
    timeline: [
      { period: 'Dès la 1ʳᵉ semaine', desc: 'Un sentiment de structure et de reprise de contrôle sur votre journée.' },
      { period: 'Après 3 semaines',   desc: 'Moins de réactivité émotionnelle, meilleure qualité de sommeil.' },
      { period: 'Après 2 mois',       desc: 'Une résilience renforcée face aux imprévus du quotidien.' },
    ],
    color: '#d4a0b0', visual: 'growth',
  },
  {
    id: 'promise', tag: 'Votre jardin',
    title: '2 minutes par jour\nsuffit pour commencer',
    body: 'Pas de performance. Pas d\'exigence. Juste un espace à vous, chaque jour, pour prendre soin de ce qui compte vraiment.',
    features: [
      { icon:'⚡', text: 'Des rituels de 2 à 5 minutes, à votre rythme' },
      { icon:'📊', text: 'Votre progression visible au quotidien' },
      { icon:'🌿', text: 'Une plante qui grandit avec vous' },
    ],
    color: '#c8a870', visual: 'flower',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
//  STYLES — partagés HelpModal + slides
// ─────────────────────────────────────────────────────────────────────────────
export const ONB_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');
  @keyframes onbIn    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes onbOut   { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-14px)} }
  @keyframes onbPulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.08);opacity:1} }
  @keyframes onbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes growBar  { from{width:0} }
  @keyframes progressBar { from{width:0} to{width:100%} }
  .onb-in  { animation: onbIn  .4s cubic-bezier(.22,1,.36,1) both }
  .onb-out { animation: onbOut .28s ease both }
`

// ─────────────────────────────────────────────────────────────────────────────
//  VISUELS GAUCHE (desktop)
// ─────────────────────────────────────────────────────────────────────────────
function SlideVisual({ slide }) {
  const c = slide.color

  if (slide.visual === 'wave') return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          position:'absolute',
          width:`${280+i*80}px`, height:`${280+i*80}px`, borderRadius:'50%',
          border:`1px solid ${c}${Math.round(40-i*8).toString(16).padStart(2,'0')}`,
          animation:`onbPulse ${3+i*0.5}s ease-in-out ${i*0.3}s infinite`,
        }}/>
      ))}
      <div style={{ fontSize:100, animation:'onbFloat 4s ease-in-out infinite', zIndex:1 }}></div>
      <div style={{ position:'absolute', bottom:'15%', left:'50%', transform:'translateX(-50%)', textAlign:'center' }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'var(--fs-h1,42px)', fontWeight:300, color:c, lineHeight:1 }}>7/10</div>
        <div style={{ fontSize:'var(--fs-h5,11px)', color:c+'99', letterSpacing:'.12em', textTransform:'uppercase', marginTop:4 }}>personnes touchées</div>
      </div>
    </div>
  )

  if (slide.visual === 'barriers') return (
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:'0 10%' }}>
      {['⏱ Pas le temps',' Pas visible',' Pas immédiat'].map((label,i) => (
        <div key={i} style={{
          width:'100%', padding:'18px 24px',
          background:`${c}0a`, border:`1px solid ${c}22`, borderLeft:`3px solid ${c}`,
          borderRadius:'0 12px 12px 0',
          fontFamily:"'Cormorant Garamond',serif", fontSize:'var(--fs-h2,22px)', fontWeight:300,
          color:'var(--text2)', animation:`onbIn .5s ease ${i*0.15}s both`,
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg, ${c}08, transparent)` }}/>
          {label}
        </div>
      ))}
    </div>
  )

  if (slide.visual === 'brain') return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
      <div style={{ position:'relative', textAlign:'center' }}>
        <div style={{ fontSize:110, animation:'onbFloat 3s ease-in-out infinite', lineHeight:1 }}></div>
        {[{ label:'Dopamine', angle:-60, dist:140 },{ label:'Cortisol ↓', angle:0, dist:155 },{ label:'Résilience', angle:60, dist:140 }].map(({label,angle,dist},i) => {
          const rad = (angle-90)*Math.PI/180
          return (
            <div key={i} style={{
              position:'absolute',
              left:`calc(50% + ${Math.cos(rad)*dist}px)`, top:`calc(50% + ${Math.sin(rad)*dist}px)`,
              transform:'translate(-50%,-50%)',
              padding:'6px 14px', background:`${c}18`, border:`1px solid ${c}40`,
              borderRadius:100, fontSize:'var(--fs-h5,12px)', color:c, fontWeight:500,
              animation:`onbIn .4s ease ${i*0.2+0.3}s both`, whiteSpace:'nowrap',
            }}>{label}</div>
          )
        })}
      </div>
    </div>
  )

  if (slide.visual === 'growth') return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'70%' }}>
        {[{ label:'1ʳᵉ semaine', pct:25 },{ label:'3 semaines', pct:55 },{ label:'2 mois', pct:90 }].map(({label,pct,emoji},i) => (
          <div key={i} style={{ width:'100%', marginBottom:28, animation:`onbIn .5s ease ${i*0.2}s both` }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:'var(--fs-h5,12px)', color:'var(--text3)', letterSpacing:'.05em' }}>{emoji} {label}</span>
              <span style={{ fontSize:'var(--fs-h5,12px)', color:c, fontWeight:600 }}>{pct}%</span>
            </div>
            <div style={{ height:6, borderRadius:100, background:'var(--track)', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, borderRadius:100, background:`linear-gradient(90deg, ${c}88, ${c})`, animation:`growBar .8s ease ${i*0.25+0.3}s both` }}/>
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
          position:'absolute', width:`${200+i*100}px`, height:`${200+i*100}px`, borderRadius:'50%',
          background: i===0 ? `radial-gradient(circle, ${c}18, transparent)` : 'transparent',
          border: i>0 ? `1px solid ${c}${i===1?'22':'11'}` : 'none',
          animation:`onbPulse ${4+i}s ease-in-out ${i*0.4}s infinite`,
        }}/>
      ))}
      <div style={{ textAlign:'center', zIndex:1 }}>
        <div style={{ fontSize:120, animation:'onbFloat 3.5s ease-in-out infinite', lineHeight:1 }}></div>
        <div style={{ marginTop:20, fontFamily:"'Cormorant Garamond',serif", fontSize:'var(--fs-h3,18px)', fontWeight:300, color:'var(--text3)', fontStyle:'italic' }}>
          Votre jardin intérieur vous attend
        </div>
      </div>
    </div>
  )

  return <div style={{ fontSize:80, display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}></div>
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONTENU TEXTE SLIDE
// ─────────────────────────────────────────────────────────────────────────────
function SlideContent({ slide, leaving }) {
  const c = slide.color
  return (
    <div className={leaving ? 'onb-out' : 'onb-in'} style={{ display:'flex', flexDirection:'column', height:'100%', justifyContent:'center' }}>

      <div style={{ marginBottom:28 }}>
        <span style={{ fontSize:'var(--fs-h5,11px)', letterSpacing:'.16em', textTransform:'uppercase', color:c, fontWeight:600, padding:'5px 14px', borderRadius:100, background:`${c}15`, border:`1px solid ${c}30` }}>
          {slide.tag}
        </span>
      </div>

      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(28px,3.5vw,48px)', fontWeight:300, lineHeight:1.15, color:'var(--text)', marginBottom:28, whiteSpace:'pre-line', letterSpacing:'-0.01em' }}>
        {slide.title}
      </div>

      {slide.body && !slide.bullets && !slide.points && !slide.timeline && !slide.features && (
        <>
          <p style={{ fontSize:'var(--fs-h3,16px)', fontWeight:300, color:'var(--text2)', lineHeight:1.85, margin:'0 0 24px', maxWidth:480 }}>{slide.body}</p>
          {slide.highlight && (
            <div style={{ padding:'16px 20px', borderRadius:14, background:`${c}12`, border:`1px solid ${c}28`, fontSize:'var(--fs-h3,15px)', fontWeight:500, color:c, lineHeight:1.6, maxWidth:480 }}>
               {slide.highlight}
            </div>
          )}
        </>
      )}

      {slide.bullets && (
        <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:480 }}>
          {slide.bullets.map((b,i) => (
            <div key={i} style={{ display:'flex', gap:0, alignItems:'stretch', borderRadius:14, overflow:'hidden', border:'1px solid var(--surface-3)', background:'var(--surface-2)', animation:`onbIn .4s ease ${i*.12+.1}s both`, boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
              <div style={{ width:52, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface-3)', fontSize:'var(--fs-emoji-md,20px)', borderRight:'1px solid var(--surface-3)' }}>
                {b.icon}
              </div>
              <div style={{ padding:'14px 18px' }}>
                <div style={{ fontSize:'var(--fs-h4,13px)', fontWeight:700, color:c, marginBottom:4, letterSpacing:'.02em' }}>{b.label}</div>
                <div style={{ fontSize:'var(--fs-h5,12px)', fontWeight:300, color:'var(--text2)', lineHeight:1.75, fontStyle:'italic' }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {slide.points && (
        <>
          <p style={{ fontSize:'var(--fs-h3,15px)', fontWeight:300, color:'var(--text2)', lineHeight:1.85, margin:'0 0 20px', maxWidth:480 }}>{slide.body}</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:480 }}>
            {slide.points.map((p,i) => (
              <div key={i} style={{ display:'flex', gap:14, alignItems:'center', padding:'12px 16px', borderRadius:12, background:'var(--surface-2)', borderLeft:`3px solid ${c}`, animation:`onbIn .4s ease ${i*.1+.15}s both`, boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
                <span style={{ width:22, height:22, borderRadius:'50%', background:'var(--surface-3)', border:`1.5px solid ${c}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:10, fontWeight:700, color:c }}>{i+1}</span>
                <span style={{ fontSize:'var(--fs-h4,13px)', fontWeight:400, color:'var(--text2)', lineHeight:1.65 }}>{p}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {slide.timeline && (
        <div style={{ display:'flex', flexDirection:'column', maxWidth:480 }}>
          {slide.timeline.map((t,i) => (
            <div key={i} style={{ display:'flex', gap:0, animation:`onbIn .4s ease ${i*.12+.1}s both` }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginRight:16 }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:c, flexShrink:0, marginTop:7, outline:`3px solid var(--surface-3)`, outlineOffset:2 }}/>
                {i < slide.timeline.length-1 && <div style={{ width:2, flex:1, minHeight:28, background:'var(--surface-3)', marginTop:4 }}/>}
              </div>
              <div style={{ paddingBottom:22, paddingTop:2 }}>
                <div style={{ display:'inline-block', fontSize:'var(--fs-h5,10px)', fontWeight:700, color:c, letterSpacing:'.1em', textTransform:'uppercase', background:'var(--surface-2)', border:`1px solid ${c}`, borderRadius:100, padding:'3px 10px', marginBottom:8 }}>{t.period}</div>
                <div style={{ fontSize:'var(--fs-h4,13px)', fontWeight:300, color:'var(--text2)', lineHeight:1.8 }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {slide.features && (
        <>
          <p style={{ fontSize:'var(--fs-h3,16px)', fontWeight:300, color:'var(--text2)', lineHeight:1.85, margin:'0 0 24px', maxWidth:480 }}>{slide.body}</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:480 }}>
            {slide.features.map((f,i) => (
              <div key={i} style={{ display:'flex', gap:14, alignItems:'center', padding:'12px 16px', borderRadius:14, background:'var(--surface-2)', border:'1px solid var(--surface-3)', animation:`onbIn .4s ease ${i*.1+.1}s both`, boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
                <span style={{ fontSize:'var(--fs-h2,18px)', width:40, height:40, borderRadius:12, flexShrink:0, background:'var(--surface-3)', border:`1.5px solid ${c}`, display:'flex', alignItems:'center', justifyContent:'center' }}>{f.icon}</span>
                <span style={{ fontSize:'var(--fs-h4,13px)', fontWeight:400, color:'var(--text2)', lineHeight:1.5 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function SlideBody({ slide, leaving }) {
  return <SlideContent slide={slide} leaving={leaving} />
}

// ─────────────────────────────────────────────────────────────────────────────
//  ÉTAPES ÉMOTIONNELLES — données
// ─────────────────────────────────────────────────────────────────────────────
const ANIM_STEPS = `
  @keyframes stepIn    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes floatY    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
  @keyframes fleurFloat{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
  @keyframes dotPop    { from{opacity:0;transform:scale(0)} to{opacity:1;transform:scale(1)} }
  @keyframes pulse3    { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.9;transform:scale(1.1)} }
  @keyframes modalIn   { from{opacity:0;transform:translateY(14px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
  .s0{animation:stepIn .5s cubic-bezier(.22,1,.36,1) both}
  .s1{animation:stepIn .5s cubic-bezier(.22,1,.36,1) .10s both}
  .s2{animation:stepIn .5s cubic-bezier(.22,1,.36,1) .18s both}
  .s3{animation:stepIn .5s cubic-bezier(.22,1,.36,1) .26s both}
  .s4{animation:stepIn .5s cubic-bezier(.22,1,.36,1) .34s both}
  .s5{animation:stepIn .5s cubic-bezier(.22,1,.36,1) .42s both}
`

const INTENTIONS = [
  { icon:'😮‍💨', label:'Je suis fatigué·e du bruit et j\'ai besoin de silence' },
  { icon:'🌱',   label:'J\'ai envie de prendre soin de moi autrement' },
  { icon:'🔍',   label:'Je cherche quelque chose de différent' },
  { icon:'💛',   label:'Je veux m\'occuper de moi même quand tout va bien' },
  { icon:'🤝',   label:'J\'ai besoin d\'un appui pour tenir dans la durée' },
]

const SEED_COLORS = [
  { label:'Rose',     hex:'#e8789a', hex2:'#f0a8bb' },
  { label:'Soleil',   hex:'#e89038', hex2:'#f0b860' },
  { label:'Émeraude', hex:'#48c878', hex2:'#88e8a8' },
  { label:'Océan',    hex:'#1890d8', hex2:'#50c8f8' },
  { label:'Lilas',    hex:'#b4a0f0', hex2:'#c8b8f8' },
  { label:'Nuit',     hex:'#5870b8', hex2:'#7890d8' },
]

// ─────────────────────────────────────────────────────────────────────────────
//  NATURE BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────
function NatureBg() {
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
      {/* Fond crème rosé — inspiré de l'ambiance des images */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg, #f8f0ec 0%, #f0e4e8 30%, #e8d8d0 60%, #e0d0c8 100%)' }}/>
      {/* Lumière fenêtre haut gauche */}
      <div style={{ position:'absolute', top:'-15%', left:'-10%', width:'60%', height:'65%', borderRadius:'50%', background:'radial-gradient(ellipse, rgba(255,248,240,0.80) 0%, transparent 65%)', filter:'blur(50px)' }}/>
      {/* Touche rose poudré */}
      <div style={{ position:'absolute', top:'10%', right:'-5%', width:'45%', height:'50%', borderRadius:'50%', background:'radial-gradient(ellipse, rgba(240,200,210,0.45) 0%, transparent 65%)', filter:'blur(45px)' }}/>
      {/* Vert doux bas */}
      <div style={{ position:'absolute', bottom:'-5%', left:'10%', width:'50%', height:'45%', borderRadius:'50%', background:'radial-gradient(ellipse, rgba(180,210,170,0.40) 0%, transparent 65%)', filter:'blur(40px)' }}/>
      {/* Grain texture très léger */}
      <div style={{ position:'absolute', inset:0, opacity:.18, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")` }}/>
      {/* Silhouettes herbes douces en bas */}
      <svg style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'30%', opacity:.15 }} viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path d="M0,290 Q120,220 240,255 Q360,290 480,235 Q600,175 720,215 Q840,255 960,195 Q1080,135 1200,175 Q1320,215 1440,165 L1440,320 L0,320 Z" fill="#8aaa78"/>
        <path d="M0,305 Q180,255 360,278 Q540,305 720,262 Q900,215 1080,255 Q1260,295 1440,248 L1440,320 L0,320 Z" fill="#c0a898" opacity=".5"/>
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODAL SHELL — wrapper responsive pour toutes les étapes
// ─────────────────────────────────────────────────────────────────────────────
function ModalShell({ children, onClick, wide = false }) {
  const isMobile = window.innerWidth < 768
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, fontFamily:"'Jost',sans-serif" }}>
      {!isMobile && <NatureBg />}
      <div onClick={onClick} style={{
        position:'absolute', inset:0, zIndex:1,
        background: isMobile ? '#faf5f2' : 'transparent',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding: isMobile ? 0 : 24,
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          width: isMobile ? '100%' : (wide ? 860 : 480),
          height: isMobile ? '100%' : 'auto',
          maxHeight: isMobile ? '100%' : '90vh',
          borderRadius: isMobile ? 0 : 24,
          background:'#faf5f2',
          boxShadow: isMobile ? 'none' : '0 24px 70px rgba(180,120,110,0.20), 0 0 0 1px rgba(200,160,150,0.18)',
          display:'flex', flexDirection:'column',
          overflowY:'auto',
          animation: isMobile ? 'none' : 'modalIn .4s cubic-bezier(.22,1,.36,1) both',
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  ÉTAPE INTENTION
// ─────────────────────────────────────────────────────────────────────────────
function StepIntention({ onSelect }) {
  const [selected, setSelected] = useState(null)

  function choose(i) {
    setSelected(i)
    setTimeout(() => onSelect(i), 380)
  }

  return (
    <ModalShell>
      <div style={{ padding:'40px 32px', display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ maxWidth:400, width:'100%' }}>

        <div className="s0" style={{ textAlign:'center', marginBottom:36 }}>
          <img src="/icons/icon-192.png" alt="" style={{ width:48, height:48, mixBlendMode:'luminosity', opacity:.55 }}/>
        </div>

        <div className="s1" style={{ textAlign:'center', marginBottom:32 }}>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(26px,4.5vw,38px)', fontWeight:300, lineHeight:1.2, color:'var(--text)', marginBottom:10 }}>
            Qu'est-ce qui vous<br/>
            <em style={{ color:'var(--gold-warm)', fontStyle:'italic' }}>amène ici aujourd'hui ?</em>
          </h1>
          <p style={{ fontSize:'var(--fs-h5,12px)', color:'var(--text3)', fontStyle:'italic' }}>
            La réponse qui vous parle le plus — sans jugement
          </p>
        </div>

        <div className="s2" style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {INTENTIONS.map((item,i) => {
            const sel = selected === i
            return (
              <button key={i} onClick={() => choose(i)} style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'15px 20px', borderRadius:14,
                background: sel ? 'rgba(184,140,60,0.14)' : 'rgba(0,0,0,0.04)',
                border: sel
                  ? '2px solid rgba(184,140,60,0.65)'
                  : '2px solid rgba(0,0,0,0.13)',
                cursor:'pointer', textAlign:'left',
                boxShadow: sel ? '0 3px 14px rgba(184,140,60,0.18)' : 'none',
                transform: sel ? 'translateX(4px)' : 'none',
                transition:'all .2s ease', fontFamily:"'Jost',sans-serif",
              }}
                onMouseEnter={e => { if (!sel) { e.currentTarget.style.background='rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor='rgba(0,0,0,0.22)' } }}
                onMouseLeave={e => { if (!sel) { e.currentTarget.style.background='rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor='rgba(0,0,0,0.13)' } }}
              >
                <span style={{ fontSize:22, flexShrink:0, lineHeight:1 }}>{item.icon}</span>
                <span style={{ fontSize:22, flexShrink:0, lineHeight:1 }}></span>
                <span style={{
                  fontSize:'var(--fs-h4,14px)', fontWeight: sel ? 600 : 400,
                  color: sel ? 'rgba(140,100,30,0.95)' : 'rgba(40,36,28,0.82)',
                  lineHeight:1.5, flex:1, transition:'color .2s',
                }}>{item.label}</span>
                <span style={{
                  width:22, height:22, borderRadius:'50%', flexShrink:0,
                  border: sel ? 'none' : '2px solid rgba(0,0,0,0.18)',
                  background: sel ? 'rgba(184,140,60,0.85)' : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, color:'#fff', fontWeight:700,
                  transition:'all .2s',
                }}>
                  {sel ? '' : ''}
                </span>
              </button>
            )
          })}
        </div>

        <div className="s5" style={{ textAlign:'center', marginTop:24 }}>
          <button onClick={() => onSelect(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'var(--fs-h5,11px)', color:'var(--text3)', fontFamily:"'Jost',sans-serif", letterSpacing:'.04em', opacity:.6 }}>
            Passer cette étape
          </button>
        </div>

        </div>
      </div>
    </ModalShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  ÉTAPE MÉTAPHORE — pont entre l'intention et la fleur
// ─────────────────────────────────────────────────────────────────────────────
function StepMetaphore({ onNext }) {
  const [showOverlay, setShowOverlay] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowOverlay(true), 5000)
    return () => clearTimeout(t)
  }, [])

  return (
    <ModalShell>
      <div style={{ display:'flex', flexDirection:'column', width:'100%', height:'100%' }}>

        {/* Titre */}
        <div className="s0" style={{ padding:'24px 32px 16px', textAlign:'center', flexShrink:0 }}>
          <h2 style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:'clamp(22px,3.5vw,30px)',
            fontWeight:300, lineHeight:1.2,
            color:'rgba(30,25,15,0.92)', margin:0,
          }}>
            Votre fleur,{' '}
            <em style={{ color:'#b07888', fontStyle:'italic' }}>votre miroir intérieur</em>
          </h2>
        </div>

        {/* Image + overlay */}
        <div style={{ 
  width:'100%',
  height:'clamp(220px, 45vh, 420px)',   // 🔥 solution parfaite
  position:'relative',
  overflow:'hidden'
}}>
          <img
            src="/miroir2.png"
            alt="Votre reflet intérieur"
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', display:'block' }}
          />

          {/* Overlay après 3s */}
          <div style={{
            position:'absolute', inset:0,
            background:'rgba(255,252,248,0.84)',
            backdropFilter:'blur(2px)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            padding:'28px 36px', gap:24,
            opacity: showOverlay ? 1 : 0,
            transform: showOverlay ? 'none' : 'translateY(10px)',
            transition:'opacity .8s ease, transform .8s ease',
          }}>

            <p style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize:'clamp(17px,2vw,22px)', fontWeight:300, lineHeight:1.85,
              color:'rgba(30,25,15,0.78)', margin:0, textAlign:'center',
            }}>
              Dans Mon Jardin Intérieur, une fleur devient le reflet de votre état émotionnel.
              Elle grandit quand vous prenez soin de vous.
              Elle vous rappelle, chaque jour, que vous méritez cette attention.
            </p>

            <button onClick={onNext} style={{
              padding:'15px 40px', borderRadius:50, border:'none',
              background:'linear-gradient(135deg, #c8a0b0, #a07888)',
              color:'#fff', fontSize:'var(--fs-h4,14px)', fontWeight:600,
              letterSpacing:'.08em', cursor:'pointer',
              fontFamily:"'Jost',sans-serif",
              boxShadow:'0 6px 22px rgba(160,120,136,0.40)',
              transition:'all .28s ease', whiteSpace:'nowrap',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 28px rgba(160,120,136,0.48)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 6px 22px rgba(160,120,136,0.40)' }}
            >
              Je choisis ma fleur →
            </button>

          </div>
        </div>

      </div>
    </ModalShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  ÉTAPE GRAINE
// ─────────────────────────────────────────────────────────────────────────────
function StepGraine({ intention, onPlant }) {
  const [selected, setSelected] = useState(0)
  const color = SEED_COLORS[selected]

  return (
    <ModalShell>
      <div style={{ padding:'40px 32px', display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ maxWidth:380, width:'100%', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>

        {intention !== null && (
          <div className="s0" style={{ padding:'7px 16px', borderRadius:50, background:'var(--surface-2)', border:'1px solid var(--surface-3)', fontSize:'var(--fs-h5,11px)', color:'var(--text3)', fontStyle:'italic' }}>
            {INTENTIONS[intention]?.label}
          </div>
        )}

        <div className="s1" style={{ width:88, height:88, borderRadius:'50%', background:`radial-gradient(circle at 38% 38%, ${color.hex2}, ${color.hex})`, boxShadow:`0 0 40px ${color.hex}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, animation:'fleurFloat 4s ease-in-out infinite', transition:'all .4s ease' }}>🌸</div>

        <div className="s2">
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(22px,3.8vw,32px)', fontWeight:300, lineHeight:1.25, color:'var(--text)', marginBottom:7 }}>
            Choisissez la couleur<br/>
            <em style={{ color: color.hex, fontStyle:'italic', transition:'color .4s' }}>de votre première fleur</em>
          </h2>
          <p style={{ fontSize:'var(--fs-h5,11px)', color:'var(--text3)', fontStyle:'italic' }}>
            Vous pourrez la modifier à tout moment
          </p>
        </div>

        <div className="s3" style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          {SEED_COLORS.map((col,i) => (
            <button key={i} onClick={() => setSelected(i)} title={col.label} style={{
              width:42, height:42, borderRadius:'50%', cursor:'pointer', padding:0,
              background:`radial-gradient(circle at 38% 38%, ${col.hex2}, ${col.hex})`,
              border: selected === i ? '2px solid var(--text)' : '2px solid var(--surface-3)',
              boxShadow: selected === i ? `0 0 0 3px ${col.hex}40` : 'none',
              transform: selected === i ? 'scale(1.18)' : 'scale(1)',
              transition:'all .22s ease',
            }}/>
          ))}
        </div>

        <div style={{ fontSize:'var(--fs-h5,10px)', letterSpacing:'.14em', textTransform:'uppercase', color: color.hex, opacity:.80, transition:'color .4s' }}>
          {color.label}
        </div>

        <div className="s4" style={{ width:'100%' }}>
          <button onClick={() => onPlant(selected)} style={{
            width:'100%', padding:'17px 28px', borderRadius:50,
            border:'none',
            background:`linear-gradient(135deg, ${color.hex}, ${color.hex}bb)`,
            color:'rgba(30,20,10,0.82)',
            fontSize:'var(--fs-h3,15px)', fontWeight:500,
            letterSpacing:'.06em', cursor:'pointer',
            fontFamily:"'Jost',sans-serif",
            boxShadow:`0 6px 24px ${color.hex}50`,
            transition:'all .3s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 10px 28px ${color.hex}60` }}
            onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=`0 6px 24px ${color.hex}50` }}
          >
             Il est temps de semer votre graine
          </button>
        </div>

        </div>
      </div>
    </ModalShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  ÉTAPE COMMUNAUTÉ
// ─────────────────────────────────────────────────────────────────────────────
function StepCommunaute({ onComplete }) {
  const [count, setCount] = useState(null)

  useEffect(() => {
    supabase
      .from('plants')
      .select('user_id', { count:'exact', head:false })
      .gte('date', new Date(Date.now()-30*86400000).toISOString().slice(0,10))
      .then(({ data }) => {
        // Compter les users distincts (pas les lignes — 1 ligne par jour par user)
        const distinct = new Set((data ?? []).map(r => r.user_id)).size
        setCount(distinct)
      })
      .catch(() => setCount(null))
  }, [])

  const n    = count !== null ? count : '…'
  const verb = count === 1 ? 'cultive' : 'cultivent'

  return (
    <ModalShell onClick={null}>
      <div style={{ padding:'40px 32px', display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ maxWidth:380, width:'100%', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:28 }}>

        {/* Champ de fleurs SVG */}
        <div className="s0" style={{ width:'100%', maxWidth:320, height:160, position:'relative', overflow:'hidden' }}>
          <svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%', height:'100%' }}>
            {/* Sol */}
            <ellipse cx="160" cy="155" rx="165" ry="12" fill="rgba(var(--green-rgb),0.12)"/>
            {/* Tiges */}
            {[
              [40,155,45,95],[80,155,83,88],[120,155,118,80],[160,155,162,72],
              [200,155,198,82],[240,155,243,90],[280,155,278,98],
              [60,155,62,108],[100,155,104,96],[140,155,138,86],
              [180,155,182,90],[220,155,218,100],[260,155,264,110],
            ].map(([x1,y1,x2,y2],i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" opacity=".55"
                style={{ animation:`cgSway ${2.2+(i%5)*0.35}s ease-in-out infinite ${(i%7)*0.2}s`, transformOrigin:`${x1}px ${y1}px` }}
              />
            ))}
            {/* Fleurs — rangée arrière */}
            {[
              [40,95,'#f0b8c8'],[80,88,'#d4a888'],[120,80,'#c8b0d8'],
              [160,72,'#f0b8c8'],[200,82,'#90c898'],[240,90,'#98c0d8'],[280,98,'#d4a888'],
            ].map(([cx,cy,col],i) => (
              <g key={i} style={{ animation:`floatY ${2.8+(i%4)*0.4}s ease-in-out infinite ${i*0.22}s` }}>
                {[0,60,120,180,240,300].map((a,j) => {
                  const rad = a*Math.PI/180
                  const px = cx + Math.cos(rad)*5.5
                  const py = cy + Math.sin(rad)*5.5
                  return <ellipse key={j} cx={px} cy={py} rx="4.5" ry="3" fill={col} opacity=".80"
                    transform={`rotate(${a+90},${px},${py})`}/>
                })}
                <circle cx={cx} cy={cy} r="3.2" fill="rgba(255,230,180,0.95)"/>
              </g>
            ))}
            {/* Fleurs — rangée avant (plus grandes) */}
            {[
              [60,108,'#f0b8c8'],[100,96,'#d4a888'],[140,86,'#90c898'],
              [180,90,'#c8b0d8'],[220,100,'#f0b8c8'],[260,110,'#98c0d8'],
            ].map(([cx,cy,col],i) => (
              <g key={i} style={{ animation:`floatY ${2.5+(i%3)*0.45}s ease-in-out infinite ${i*0.18+0.1}s` }}>
                {[0,45,90,135,180,225,270,315].map((a,j) => {
                  const rad = a*Math.PI/180
                  const px = cx + Math.cos(rad)*7
                  const py = cy + Math.sin(rad)*7
                  return <ellipse key={j} cx={px} cy={py} rx="5.5" ry="3.2" fill={col} opacity=".88"
                    transform={`rotate(${a+90},${px},${py})`}/>
                })}
                <circle cx={cx} cy={cy} r="3.8" fill="rgba(255,230,180,0.98)"/>
              </g>
            ))}
          </svg>
          <style>{`
            @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
            @keyframes cgSway { 0%,100%{transform:rotate(0deg)} 40%{transform:rotate(2.5deg)} 75%{transform:rotate(-1.8deg)} }
          `}</style>
        </div>

        <div className="s2">
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(24px,4.5vw,36px)', fontWeight:300, lineHeight:1.4, color:'var(--text)', marginBottom:14 }}>
            En ce moment,<br/>
            <span style={{ color:'var(--green)', fontWeight:400 }}>
              {count !== null ? count : '…'} {count !== null ? (count === 1 ? 'personne cultive' : 'personnes cultivent') : ''}
            </span>
            {count !== null && <><br/>leur jardin intérieur dans notre communauté.</>}
          </h2>
          <p style={{ fontSize:'var(--fs-h4,13px)', color:'var(--text3)', fontStyle:'italic', lineHeight:1.8 }}>
            Pas de profils. Pas de noms.<br/>Juste une présence partagée.
          </p>
        </div>

        <div className="s4" style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>
          <button onClick={onComplete} style={{
            padding:'18px 52px', borderRadius:50,
            border:'none',
            background:'linear-gradient(135deg, #c8a0b0, #a07888)',
            color:'#fff',
            fontSize:'var(--fs-h3,16px)', fontWeight:600,
            letterSpacing:'.10em',
            cursor:'pointer', fontFamily:"'Jost',sans-serif",
            boxShadow:'0 8px 28px rgba(160,120,136,0.42), 0 2px 8px rgba(160,120,136,0.22)',
            transition:'all .28s ease',
            position:'relative', overflow:'hidden',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 14px 36px rgba(160,120,136,0.50), 0 4px 10px rgba(160,120,136,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 8px 28px rgba(160,120,136,0.42), 0 2px 8px rgba(160,120,136,0.22)' }}
          >
            Entrez dans votre jardin →
          </button>
          <div style={{ fontSize:'var(--fs-h5,11px)', color:'rgba(0,0,0,0.30)', marginTop:14, fontStyle:'italic', letterSpacing:'.03em' }}>
            Votre graine vous attend
          </div>
        </div>

        </div>
      </div>
    </ModalShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  SLIDES ÉDUCATIVES — layout colonne unique, propre
// ─────────────────────────────────────────────────────────────────────────────
function SlidesEducatives({ onComplete }) {
  const [step,    setStep]    = useState(0)
  const [leaving, setLeaving] = useState(false)
  const isMobile = window.innerWidth < 768

  const slide  = ONBOARDING_SLIDES[step]
  const isLast = step === ONBOARDING_SLIDES.length - 1
  const c      = slide.color

  function next() {
    if (leaving) return
    if (isLast) { onComplete(); return }
    setLeaving(true)
    setTimeout(() => { setStep(s => s+1); setLeaving(false) }, 300)
  }
  function prev() {
    if (step === 0 || leaving) return
    setLeaving(true)
    setTimeout(() => { setStep(s => s-1); setLeaving(false) }, 300)
  }

  const inner = (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'visible', fontFamily:"'Jost',sans-serif" }}>
      <style>{ONB_STYLES}</style>

      {/* Image hero pleine largeur — occupe ~38% de la hauteur */}
      <div style={{
        flexShrink:0, height: isMobile ? '30%' : '40%', position:'relative', overflow:'hidden',
        opacity: leaving ? 0 : 1,
        transition:'opacity .28s ease',
      }}>
        <img
          src="/champs.png"
          alt=""
          style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 30%', display:'block' }}
        />
        {/* Dégradé bas pour fondu avec le fond */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 50%, #faf5f2 100%)' }}/>

        {/* Barre progression en overlay haut */}
        <div style={{ position:'absolute', top:0, left:0, right:0, display:'flex', gap:3 }}>
          {ONBOARDING_SLIDES.map((s,i) => (
            <div key={s.id} style={{
              flex:1, height:3,
              background: i < step ? c : i === step ? c+'88' : 'rgba(255,255,255,0.35)',
              transition:'background .4s ease',
            }}>
              {i === step && <div style={{ height:'100%', background:c, animation:'progressBar .3s ease both' }}/>}
            </div>
          ))}
        </div>

        {/* Tag + numéro en overlay bas */}
        <div style={{ position:'absolute', bottom:12, left:16, right:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{
            fontSize:'var(--fs-h5,11px)', letterSpacing:'.14em', textTransform:'uppercase',
            color:c, fontWeight:600, padding:'4px 12px', borderRadius:100,
            background:'rgba(255,255,255,0.82)', border:`1px solid ${c}40`,
            backdropFilter:'blur(6px)',
          }}>{slide.tag}</span>
          <span style={{ fontSize:'var(--fs-h5,11px)', color:'rgba(60,50,40,0.55)', letterSpacing:'.08em', background:'rgba(255,255,255,0.70)', padding:'3px 10px', borderRadius:100, backdropFilter:'blur(4px)' }}>
            {String(step+1).padStart(2,'0')} / {String(ONBOARDING_SLIDES.length).padStart(2,'0')}
          </span>
        </div>
      </div>

      {/* Zone texte + bouton — flex colonne, no overflow */}
      <div style={{
  flex:1,
  display:'flex',
  flexDirection:'column',
  padding: isMobile ? '16px 24px 0' : '20px 40px 0',
  overflowY:'auto',                  // ✅ scroll activé
  WebkitOverflowScrolling:'touch',   // ✅ fluide sur mobile
}}>

        {/* Titre — grand */}
        <h2 style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize: isMobile ? 'clamp(20px,5.5vw,26px)' : 'clamp(26px,2.5vw,36px)',
          fontWeight:300, lineHeight:1.15,
          color:'var(--text)', marginBottom: isMobile ? 10 : 12,
          whiteSpace:'pre-line', letterSpacing:'-0.01em',
          flexShrink:0,
        }}>{slide.title}</h2>

        {/* Contenu selon type */}

        {/* ── Contenu compacté selon type ── */}
        <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', justifyContent:'cenflex-start', overflowY:'auto', WebkitOverflowScrolling:'touch',  gap: isMobile ? 6 : 10, paddingBottom:'12px'  }}>

          {slide.body && !slide.bullets && !slide.points && !slide.timeline && !slide.features && (
            <>
              <p style={{ fontSize: isMobile ? 'var(--fs-h4,14px)' : 'var(--fs-h3,15px)', fontWeight:300, color:'var(--text2)', lineHeight:1.7, margin:0 }}>
                {slide.body}
              </p>
              {slide.highlight && (
                <div style={{ padding:'12px 16px', borderRadius:12, background:`${c}10`, border:`1px solid ${c}25`, fontSize:'var(--fs-h4,13px)', fontWeight:500, color:c, lineHeight:1.5 }}>
                   {slide.highlight}
                </div>
              )}
            </>
          )}

          {slide.bullets && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {slide.bullets.map((b,i) => (
                <div key={i} style={{
                  display:'flex', gap:0, alignItems:'stretch',
                  borderRadius:12, overflow:'hidden',
                  background:'rgba(255,255,255,0.65)',
                  border:'1px solid rgba(0,0,0,0.09)',
                  boxShadow:'0 2px 6px rgba(0,0,0,0.04)',
                  animation:`onbIn .4s ease ${i*.12+.1}s both`,
                }}>
                  <div style={{ width:4, flexShrink:0, background:c }}/>
                  <div style={{ width:40, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, background:`${c}12`, borderRight:'1px solid rgba(0,0,0,0.06)' }}>{b.icon}</div>
                  <div style={{ padding:'9px 12px', flex:1 }}>
                    <div style={{ fontSize:'var(--fs-h4,12px)', fontWeight:700, color:'rgba(30,25,15,0.90)', marginBottom:2 }}>{b.label}</div>
                    <div style={{ fontSize:'var(--fs-h5,11px)', fontWeight:300, color:'rgba(55, 43, 19, 0.55)', lineHeight:1.45 }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {slide.points && (
            <>
              <p style={{ fontSize:'var(--fs-h4,13px)', fontWeight:300, color:'rgba(30,25,15,0.65)', lineHeight:1.7, margin:0 }}>{slide.body}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:0, borderRadius:14, overflow:'hidden', border:'1px solid rgba(0,0,0,0.09)', background:'rgba(255,255,255,0.55)' }}>
                {slide.points.map((p,i) => (
                  <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'11px 14px', borderBottom: i < slide.points.length-1 ? '1px solid rgba(0,0,0,0.07)' : 'none', animation:`onbIn .4s ease ${i*.1+.15}s both` }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, background:`${c}18`, border:`1.5px solid ${c}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:c }}>{i+1}</div>
                    <span style={{ fontSize:'var(--fs-h4,12px)', fontWeight:400, color:'rgba(30,25,15,0.80)', lineHeight:1.5 }}>{p}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {slide.timeline && (
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {slide.timeline.map((t,i) => (
                <div key={i} style={{ display:'flex', gap:0, alignItems:'stretch', animation:`onbIn .4s ease ${i*.14+.1}s both` }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:28, flexShrink:0, paddingTop:4 }}>
                    <div style={{ width:12, height:12, borderRadius:'50%', flexShrink:0, background:c, border:`3px solid ${c}30` }}/>
                    {i < slide.timeline.length-1 && <div style={{ width:2, flex:1, minHeight:20, background:`linear-gradient(${c}60, ${c}18)`, margin:'3px 0' }}/>}
                  </div>
                  <div style={{ flex:1, paddingLeft:14, paddingBottom: i < slide.timeline.length-1 ? 16 : 0 }}>
                    <div style={{ display:'inline-block', fontSize:'var(--fs-h5,10px)', fontWeight:700, color:c, letterSpacing:'.08em', textTransform:'uppercase', padding:'2px 8px', borderRadius:50, background:`${c}12`, border:`1px solid ${c}30`, marginBottom:4 }}>{t.period}</div>
                    <div style={{ fontSize:'var(--fs-h4,12px)', fontWeight:300, color:'rgba(30,25,15,0.70)', lineHeight:1.6 }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {slide.features && (
            <>
              <p style={{ fontSize:'var(--fs-h4,13px)', fontWeight:300, color:'rgba(30,25,15,0.65)', lineHeight:1.7, margin:0 }}>{slide.body}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {slide.features.map((f,i) => (
                  <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 14px', borderRadius:12, background:'rgba(255,255,255,0.65)', border:'1px solid rgba(0,0,0,0.08)', boxShadow:'0 2px 6px rgba(0,0,0,0.04)', animation:`onbIn .4s ease ${i*.1+.1}s both` }}>
                    <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:`${c}18`, border:`1.5px solid ${c}35`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{f.icon}</div>
                    <span style={{ fontSize:'var(--fs-h4,13px)', fontWeight:400, color:'rgba(30,25,15,0.82)', lineHeight:1.4 }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Navigation — fixée en bas, compacte */}
      <div style={{ padding: isMobile ? '10px 24px 20px' : '12px 40px 20px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        {step > 0 && (
          <button onClick={prev} style={{
            width:44, height:44, borderRadius:50, flexShrink:0,
            border:'2px solid rgba(0,0,0,0.14)', background:'transparent',
            color:'rgba(0,0,0,0.45)', fontSize:18, cursor:'pointer',
            fontFamily:"'Jost',sans-serif",
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(0,0,0,0.06)'; e.currentTarget.style.color='rgba(0,0,0,0.70)'; e.currentTarget.style.borderColor='rgba(0,0,0,0.28)' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(0,0,0,0.45)'; e.currentTarget.style.borderColor='rgba(0,0,0,0.14)' }}
          >←</button>
        )}
        <button onClick={next} style={{
          flex:1, padding:'14px 28px', borderRadius:50,
          border:'none',
          background: isLast
            ? 'linear-gradient(135deg, #c8a0b0, #a07888)'
            : 'linear-gradient(135deg, #a8c098, #7a9870)',
          color:'#fff',
          fontSize:'var(--fs-h4,14px)', fontWeight:600,
          letterSpacing:'.08em',
          cursor:'pointer', fontFamily:"'Jost',sans-serif",
          boxShadow: isLast
            ? '0 6px 22px rgba(160,120,136,0.40)'
            : '0 4px 16px rgba(122,152,112,0.38)',
          transition:'all .25s ease',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.opacity='.9' }}
          onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.opacity='1' }}
        >
          {isLast ? '🌸 Et vous ?' : 'Continuer →'}
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div style={{ position:'fixed', inset:0, zIndex:9999, background:'var(--bg)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {inner}
      </div>
    )
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999 }}>
      <NatureBg />
      <div style={{ position:'absolute', inset:0, zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{
          width:'min(640px, 96vw)',
          height:'min(680px, 88vh)',
          borderRadius:24, background:'#faf5f2',
          boxShadow:'0 24px 70px rgba(180,120,110,0.20), 0 0 0 1px rgba(200,160,150,0.15)',
          display:'flex', flexDirection:'column', overflow:'hidden',
          animation:'modalIn .4s cubic-bezier(.22,1,.36,1) both',
        }}>
          {inner}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  OnboardingScreen — orchestration complète
//  Flow : 5 slides éducatives → intention → graine → communauté
// ─────────────────────────────────────────────────────────────────────────────
export function OnboardingScreen({ userId, onComplete }) {
  useTheme() // applique les CSS vars du thème dès l'onboarding
  // phase 0=slides 1=intention 2=metaphore 3=graine 4=communauté
  const [phase,     setPhase]     = useState(0)
  const [intention, setIntention] = useState(null)

  async function handleIntention(idx) {
    setIntention(idx)
    setPhase(2)
  }

  async function handlePlant(colorIdx) {
    const color = SEED_COLORS[colorIdx]
    try {
      if (userId) {
        await supabase.from('garden_settings').upsert({
          user_id:      userId,
          petal_color1: color.hex,
          petal_color2: color.hex2,
          petal_shape:  'round',
        }, { onConflict: 'user_id' })
        if (intention !== null) {
          await supabase.from('profiles').update({ onboarding_intention: intention }).eq('id', userId)
        }
      }
    } catch (e) {
      console.warn('[onboarding] save error', e)
    }
    setPhase(4)
  }

  if (phase === 0) return <SlidesEducatives onComplete={() => setPhase(1)} />
  if (phase === 1) return <StepIntention onSelect={handleIntention} />
  if (phase === 2) return <StepMetaphore onNext={() => setPhase(3)} />
  if (phase === 3) return <StepGraine intention={intention} onPlant={handlePlant} />
  if (phase === 4) return <StepCommunaute onComplete={onComplete} />
  return null
}
