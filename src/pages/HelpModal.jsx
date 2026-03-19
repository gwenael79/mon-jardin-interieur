// src/pages/HelpModal.jsx
import { useState } from 'react'
import { ONBOARDING_SLIDES, ONB_STYLES } from './OnboardingScreen'

const TABS = [
  { id: 'guide',    label: '🗺 Guide' },
  { id: 'faq',     label: '❓ FAQ' },
  { id: 'zones',   label: '🌸 Les 5 zones' },
  { id: 'science', label: '🧠 Comprendre' },
]

// ── Données ───────────────────────────────────────────────────────────────────

const GUIDE_STEPS = [
  {
    icon: '🌸',
    title: 'Ma Fleur',
    subtitle: 'Votre espace personnel',
    description: 'Chaque jour, prenez soin de votre jardin intérieur en complétant vos rituels quotidiens. Chaque attention à vous-même nourrit vos zones de vie — racines, tige, feuilles, fleurs et souffle.',
    tip: '💡 Complétez au moins un rituel par jour pour maintenir votre vitalité.',
    accent: '#e8c060',
    bg: 'rgba(232,192,96,0.10)',
    border: 'rgba(232,192,96,0.22)',
  },
  {
    icon: '🌻',
    title: 'Jardin Collectif',
    subtitle: 'La communauté en fleurs',
    description: 'Découvrez les fleurs des autres membres. Nous sommes reliés les uns aux autres, et grâce à la bienveillance mutuelle nous grandissons ensemble.',
    tip: '💡 Activez votre visibilité dans votre profil pour apparaître dans le jardin.',
    accent: '#96d485',
    bg: 'rgba(150,212,133,0.10)',
    border: 'rgba(150,212,133,0.22)',
  },
  {
    icon: '🪴',
    title: 'Club des Jardiniers',
    subtitle: 'Partageons nos bonnes ondes',
    description: 'Rejoignez un réseau autour de la bienveillance. Soutenez l\'effort de chacun, nourrissez l\'égrégore collectif, et tissez des liens d\'intentions positives.',
    tip: '💡 Rejoignez un cercle avec un code d\'invitation ou créez le vôtre.',
    accent: '#b496dc',
    bg: 'rgba(180,150,220,0.10)',
    border: 'rgba(180,150,220,0.22)',
  },
  {
    icon: '🌿',
    title: 'Ateliers',
    subtitle: 'Approfondissez votre pratique',
    description: 'Accédez à des séances en visio, groupes de parole, méditations et ateliers audio pour accompagner votre croissance intérieure au quotidien.',
    tip: '💡 Les ateliers sont disponibles avec un abonnement actif.',
    accent: '#64b4a0',
    bg: 'rgba(100,180,160,0.10)',
    border: 'rgba(100,180,160,0.22)',
  },
  {
    icon: '✨',
    title: 'Défis',
    subtitle: 'Grandissez ensemble',
    description: 'Participez aux défis collectifs. Chaque défi est une invitation à explorer une nouvelle intention, partagée avec des centaines de jardiniers.',
    tip: '💡 Vous pouvez aussi proposer vos propres défis à la communauté.',
    accent: '#e8c060',
    bg: 'rgba(232,192,96,0.10)',
    border: 'rgba(232,192,96,0.22)',
  },
  {
    icon: '✦',
    title: 'Lumens',
    subtitle: 'Votre lumière intérieure',
    description: 'Les Lumens mesurent votre rayonnement. Vous en gagnez en complétant des rituels, en participant aux défis et en interagissant chaque jour. Votre aura grandit avec vous.',
    tip: '💡 Consultez vos Lumens depuis le bandeau doré en bas de l\'écran.',
    accent: '#ffd864',
    bg: 'rgba(255,216,100,0.10)',
    border: 'rgba(255,216,100,0.22)',
  },
]

const FAQ = [
  { q: 'À quelle fréquence dois-je utiliser l\'app ?',   a: 'Idéalement chaque jour — même 2 minutes suffisent. C\'est la régularité, pas la durée, qui produit les effets.' },
  { q: 'Que se passe-t-il si je saute un jour ?',         a: 'Votre plante perd légèrement de sa vitalité, mais elle ne disparaît pas. Revenez quand vous pouvez, sans culpabilité.' },
  { q: 'À quoi servent les Lumens ?',                     a: 'Les Lumens récompensent votre régularité. Ils reflètent votre engagement dans l\'app et débloquent des badges au fil du temps.' },
  { q: 'Mes données sont-elles privées ?',                a: 'Oui. Par défaut, votre jardin est privé. Vous choisissez ce que vous partagez dans les paramètres de confidentialité.' },
  { q: 'Comment fonctionne le bilan quotidien ?',         a: 'Le bilan évalue vos 5 zones intérieures. Il guide la progression de votre plante et vos rituels du jour.' },
]

const ZONES = [
  { emoji: '🌱', name: 'Racines', color: '#96d485', desc: 'La stabilité, le sentiment de sécurité et d\'ancrage dans votre quotidien.' },
  { emoji: '🌿', name: 'Tige',    color: '#78B4C8', desc: 'L\'énergie, la vitalité physique, votre capacité à agir.' },
  { emoji: '🍃', name: 'Feuilles',color: '#C8894A', desc: 'Les relations, les connexions sociales et votre sentiment d\'appartenance.' },
  { emoji: '🌸', name: 'Fleurs',  color: '#C878A0', desc: 'La créativité, l\'expression de soi, ce qui vous donne de la joie.' },
  { emoji: '💨', name: 'Souffle', color: '#e8c060', desc: 'La clarté mentale, le recul, votre capacité à vous recentrer.' },
]

// ── Onglet Guide ──────────────────────────────────────────────────────────────
function GuideTab() {
  const [step,      setStep]      = useState(0)
  const [animating, setAnimating] = useState(false)
  const [dir,       setDir]       = useState(1)

  const s = GUIDE_STEPS[step]

  function goTo(next, d = 1) {
    if (animating || next < 0 || next >= GUIDE_STEPS.length) return
    setAnimating(true); setDir(d)
    setTimeout(() => { setStep(next); setAnimating(false) }, 200)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>
      {/* Barre de progression */}
      <div style={{ display:'flex', gap:5, marginBottom:18 }}>
        {GUIDE_STEPS.map((_,i) => (
          <div key={i} onClick={() => goTo(i, i>step?1:-1)} style={{
            flex:1, height:2, borderRadius:2, cursor:'pointer',
            background: i <= step ? s.accent : 'rgba(255,255,255,0.10)',
            transition:'background .35s ease',
          }} />
        ))}
      </div>

      {/* Contenu animé */}
      <div style={{
        flex:1, overflowY:'auto',
        opacity: animating ? 0 : 1,
        transform: animating ? `translateX(${dir*20}px)` : 'translateX(0)',
        transition: animating ? 'none' : 'opacity .2s ease, transform .2s cubic-bezier(.16,1,.3,1)',
      }}>
        {/* Icône + titre */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
          <div style={{
            width:56, height:56, borderRadius:16, flexShrink:0,
            background:s.bg, border:`1px solid ${s.border}`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
          }}>{s.icon}</div>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:400, color:'rgba(242,237,224,0.92)', lineHeight:1.1 }}>{s.title}</div>
            <div style={{ fontSize:11, color:s.accent, marginTop:3, letterSpacing:'.04em' }}>{s.subtitle}</div>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize:13, fontWeight:300, color:'rgba(242,237,224,0.70)', lineHeight:1.80, margin:'0 0 14px' }}>
          {s.description}
        </p>

        {/* Tip */}
        <div style={{
          padding:'10px 13px', borderRadius:10,
          background:s.bg, border:`1px solid ${s.border}`,
          fontSize:12, color:'rgba(242,237,224,0.58)', lineHeight:1.55,
        }}>{s.tip}</div>
      </div>

      {/* Navigation */}
      <div style={{ display:'flex', alignItems:'center', gap:10, paddingTop:14, flexShrink:0 }}>
        <button onClick={() => goTo(step-1, -1)} disabled={step===0} style={{
          width:36, height:36, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.10)',
          background:'rgba(255,255,255,0.04)', color:'rgba(242,237,224,0.50)',
          cursor: step===0 ? 'default' : 'pointer', opacity: step===0 ? 0.3 : 1,
          fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>‹</button>
        <div style={{ flex:1, textAlign:'center', fontSize:11, color:'rgba(242,237,224,0.25)', letterSpacing:'.08em' }}>
          {step+1} / {GUIDE_STEPS.length}
        </div>
        <button onClick={() => goTo(step+1, 1)} disabled={step===GUIDE_STEPS.length-1} style={{
          padding:'9px 18px', borderRadius:20,
          border:'none', cursor: step===GUIDE_STEPS.length-1 ? 'default' : 'pointer',
          background: step===GUIDE_STEPS.length-1
            ? 'rgba(255,255,255,0.06)'
            : `linear-gradient(135deg, ${s.accent}, rgba(150,212,133,0.9))`,
          color: step===GUIDE_STEPS.length-1 ? 'rgba(242,237,224,0.25)' : '#0f1f12',
          fontSize:12, fontWeight:600, flexShrink:0,
          opacity: step===GUIDE_STEPS.length-1 ? 0.5 : 1,
        }}>{step===GUIDE_STEPS.length-1 ? '✓ Compris' : 'Suivant ›'}</button>
      </div>
    </div>
  )
}

// ── Onglet FAQ ────────────────────────────────────────────────────────────────
function FaqTab() {
  const [open, setOpen] = useState(null)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
      {FAQ.map((item, i) => (
        <div key={i} style={{
          borderRadius:11, overflow:'hidden',
          border:'1px solid rgba(255,255,255,0.07)',
          background: open===i ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
          transition:'background .2s',
        }}>
          <button onClick={() => setOpen(open===i ? null : i)} style={{
            width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'12px 14px', background:'none', border:'none', cursor:'pointer',
            fontFamily:"'Jost',sans-serif", textAlign:'left', gap:10,
          }}>
            <span style={{ fontSize:12.5, fontWeight:400, color:'rgba(242,237,224,0.78)', lineHeight:1.5 }}>{item.q}</span>
            <span style={{ fontSize:13, color:'rgba(242,237,224,0.28)', flexShrink:0, transition:'transform .2s', transform: open===i ? 'rotate(180deg)' : 'none' }}>▾</span>
          </button>
          {open===i && (
            <div style={{ padding:'0 14px 13px', fontSize:12, fontWeight:300, color:'rgba(242,237,224,0.54)', lineHeight:1.75 }}>
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Onglet Zones ──────────────────────────────────────────────────────────────
function ZonesTab() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
      {ZONES.map((z,i) => (
        <div key={i} style={{
          display:'flex', gap:13, alignItems:'flex-start',
          padding:'12px 14px', borderRadius:12,
          background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{ fontSize:20, flexShrink:0 }}>{z.emoji}</span>
          <div>
            <div style={{ fontSize:12.5, fontWeight:600, color:z.color, marginBottom:3 }}>{z.name}</div>
            <div style={{ fontSize:12, fontWeight:300, color:'rgba(242,237,224,0.54)', lineHeight:1.72 }}>{z.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Onglet Comprendre (slides pédagogiques) ───────────────────────────────────
function ScienceTab() {
  const [step,    setStep]    = useState(0)
  const [leaving, setLeaving] = useState(false)

  const slide  = ONBOARDING_SLIDES[step]
  const isLast = step === ONBOARDING_SLIDES.length - 1

  function go(dir) {
    if (leaving) return
    const next = step + dir
    if (next < 0 || next >= ONBOARDING_SLIDES.length) return
    setLeaving(true)
    setTimeout(() => { setStep(next); setLeaving(false) }, 260)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>
      {/* Barre de progression */}
      <div style={{ display:'flex', gap:5, marginBottom:16 }}>
        {ONBOARDING_SLIDES.map((s,i) => (
          <div key={s.id} onClick={() => { setLeaving(true); setTimeout(()=>{ setStep(i); setLeaving(false) }, 260) }} style={{
            flex:1, height:2, borderRadius:2, cursor:'pointer',
            background: i <= step ? slide.color : 'rgba(255,255,255,0.10)',
            transition:'background .4s ease',
          }} />
        ))}
      </div>

      <div className={leaving ? 'onb-out' : 'onb-in'} style={{ flex:1, overflowY:'auto', paddingBottom:8 }}>
        {/* Tag + emoji */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <span style={{ fontSize:26 }}>{slide.emoji}</span>
          <span style={{
            fontSize:9, letterSpacing:'.14em', textTransform:'uppercase',
            color:slide.color, fontWeight:500, padding:'3px 9px', borderRadius:20,
            background:`${slide.color}15`, border:`1px solid ${slide.color}30`,
          }}>{slide.tag}</span>
        </div>

        <div style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize:'clamp(18px,3.5vw,24px)', fontWeight:300, lineHeight:1.22,
          color:'rgba(242,237,224,0.93)', marginBottom:16, whiteSpace:'pre-line',
        }}>{slide.title}</div>

        {/* Body simple */}
        {slide.body && !slide.bullets && !slide.points && !slide.timeline && !slide.features && (
          <>
            <p style={{ fontSize:12.5, fontWeight:300, color:'rgba(242,237,224,0.66)', lineHeight:1.82, margin:'0 0 13px' }}>{slide.body}</p>
            {slide.highlight && (
              <div style={{ padding:'9px 13px', borderRadius:9, background:`${slide.color}10`, border:`1px solid ${slide.color}25`, fontSize:11.5, fontWeight:500, color:slide.color, lineHeight:1.6 }}>
                💡 {slide.highlight}
              </div>
            )}
          </>
        )}

        {/* Freins */}
        {slide.bullets && (
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {slide.bullets.map((b,i) => (
              <div key={i} style={{ display:'flex', gap:11, alignItems:'flex-start', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontSize:17, flexShrink:0 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize:11.5, fontWeight:600, color:slide.color, marginBottom:2 }}>{b.label}</div>
                  <div style={{ fontSize:11, fontWeight:300, color:'rgba(242,237,224,0.53)', lineHeight:1.7 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Points */}
        {slide.points && (
          <>
            <p style={{ fontSize:12.5, fontWeight:300, color:'rgba(242,237,224,0.66)', lineHeight:1.82, margin:'0 0 13px' }}>{slide.body}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {slide.points.map((p,i) => (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                  <span style={{ color:slide.color, fontSize:11, flexShrink:0, marginTop:3 }}>✦</span>
                  <span style={{ fontSize:12, fontWeight:300, color:'rgba(242,237,224,0.64)', lineHeight:1.72 }}>{p}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Timeline */}
        {slide.timeline && (
          <div style={{ display:'flex', flexDirection:'column' }}>
            {slide.timeline.map((t,i) => (
              <div key={i} style={{ display:'flex' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginRight:11 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:slide.color, flexShrink:0, marginTop:4 }} />
                  {i < slide.timeline.length-1 && <div style={{ width:1, flex:1, minHeight:22, background:`${slide.color}30` }} />}
                </div>
                <div style={{ paddingBottom:14 }}>
                  <div style={{ fontSize:9.5, fontWeight:600, color:slide.color, letterSpacing:'.06em', marginBottom:3, textTransform:'uppercase' }}>{t.period}</div>
                  <div style={{ fontSize:12, fontWeight:300, color:'rgba(242,237,224,0.60)', lineHeight:1.7 }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Features */}
        {slide.features && (
          <>
            <p style={{ fontSize:12.5, fontWeight:300, color:'rgba(242,237,224,0.73)', lineHeight:1.82, margin:'0 0 16px' }}>{slide.body}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {slide.features.map((f,i) => (
                <div key={i} style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <span style={{ fontSize:14, width:30, height:30, borderRadius:'50%', flexShrink:0, background:`${slide.color}15`, border:`1px solid ${slide.color}25`, display:'flex', alignItems:'center', justifyContent:'center' }}>{f.icon}</span>
                  <span style={{ fontSize:12, fontWeight:400, color:'rgba(242,237,224,0.73)' }}>{f.text}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display:'flex', gap:7, paddingTop:12, flexShrink:0 }}>
        <button onClick={() => go(-1)} disabled={step===0} style={{
          padding:'10px 14px', borderRadius:9, border:'1px solid rgba(255,255,255,0.10)',
          background:'rgba(255,255,255,0.04)', color:'rgba(242,237,224,0.32)',
          fontSize:12, cursor: step===0 ? 'default' : 'pointer',
          opacity: step===0 ? 0.3 : 1, fontFamily:"'Jost',sans-serif",
        }}>←</button>
        <button onClick={() => go(1)} disabled={isLast} style={{
          flex:1, padding:'10px', borderRadius:9,
          border:`1px solid ${isLast ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)'}`,
          background:'rgba(255,255,255,0.04)',
          color: isLast ? 'rgba(242,237,224,0.18)' : 'rgba(242,237,224,0.62)',
          fontSize:12, cursor: isLast ? 'default' : 'pointer',
          fontFamily:"'Jost',sans-serif",
        }}>{isLast ? '✓ Fin du parcours' : 'Suivant →'}</button>
      </div>
    </div>
  )
}

// ── HelpModal principal ───────────────────────────────────────────────────────
export function HelpModal({ onClose }) {
  const [tab, setTab] = useState('guide')

  const scrollable = tab !== 'guide' && tab !== 'science'

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:500,
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'0 16px',
    }}>
      <style>{ONB_STYLES}</style>

      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}
           onClick={onClose} />

      <div style={{
        position:'relative', background:'var(--bg)',
        borderRadius:22, padding:'0 0 24px',
        maxHeight:'88vh', width:'100%', maxWidth:420,
        display:'flex', flexDirection:'column',
        border:'1px solid rgba(255,255,255,0.10)',
        boxShadow:'0 32px 80px rgba(0,0,0,0.55)',
        fontFamily:"'Jost',sans-serif",
      }}>
        {/* Poignée */}
        <div style={{ width:32, height:3, background:'rgba(255,255,255,0.15)', borderRadius:100, margin:'14px auto 0' }} />

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px 0' }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:21, fontWeight:300, color:'rgba(242,237,224,0.88)' }}>
            Aide
          </div>
          <button onClick={onClose} style={{
            background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.10)',
            borderRadius:'50%', width:28, height:28, cursor:'pointer',
            color:'rgba(242,237,224,0.50)', fontSize:13,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>✕</button>
        </div>

        {/* Onglets */}
        <div style={{ display:'flex', gap:5, padding:'12px 20px 0', flexShrink:0, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'6px 12px', borderRadius:20, cursor:'pointer',
              fontFamily:"'Jost',sans-serif", fontSize:11.5, fontWeight: tab===t.id ? 500 : 300,
              whiteSpace:'nowrap',
              background: tab===t.id ? 'rgba(150,212,133,0.14)' : 'rgba(255,255,255,0.04)',
              color: tab===t.id ? '#96d485' : 'rgba(242,237,224,0.42)',
              border: tab===t.id ? '1px solid rgba(150,212,133,0.25)' : '1px solid rgba(255,255,255,0.07)',
              transition:'all .18s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Contenu */}
        <div style={{
          flex:1, overflowY: scrollable ? 'auto' : 'hidden',
          padding:'14px 20px 0',
          display:'flex', flexDirection:'column', minHeight:0,
        }}>
          {tab === 'guide'   && <GuideTab />}
          {tab === 'faq'     && <FaqTab />}
          {tab === 'zones'   && <ZonesTab />}
          {tab === 'science' && <ScienceTab />}
        </div>
      </div>
    </div>
  )
}
