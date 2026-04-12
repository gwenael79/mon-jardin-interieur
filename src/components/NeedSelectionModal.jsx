// NeedSelectionModal.jsx — premium living cards
import { useRef } from 'react'
import { useIsMobile } from '../pages/dashboardShared'

// ─── Données ────────────────────────────────────────────────────────────────

const NEEDS = [
  { id:'sleep',       icon:'sleep',       label:'Mieux dormir',           description:'Retrouver un sommeil apaisé',
    g1:'#5B3FA0', g2:'#8B6FD0', glow:'rgba(107,75,200,0.32)' },
  { id:'stress',      icon:'stress',      label:'Apaiser le stress',       description:'Relâcher la pression',
    g1:'#2058B0', g2:'#5090E0', glow:'rgba(48,112,200,0.28)' },
  { id:'emotions',    icon:'emotions',    label:'Apaiser mes émotions',    description:'Accueillir ce qui est là',
    g1:'#B83070', g2:'#E870A8', glow:'rgba(200,60,120,0.28)' },
  { id:'grounding',   icon:'grounding',   label:'Me sentir ancré',         description:'Retrouver ma stabilité',
    g1:'#1A6645', g2:'#38A870', glow:'rgba(40,140,90,0.28)' },
  { id:'thoughts',    icon:'thoughts',    label:'Calmer mes pensées',      description:'Faire de la place',
    g1:'#2A4468', g2:'#4A70A0', glow:'rgba(58,96,148,0.28)' },
  { id:'energy',      icon:'energy',      label:"Retrouver de l'énergie",  description:"Revenir à l'élan",
    g1:'#A06010', g2:'#D8A030', glow:'rgba(190,140,30,0.28)' },
  { id:'selfconnect', icon:'selfconnect', label:'Me reconnecter à moi',    description:'Me retrouver',
    g1:'#0E5250', g2:'#28B0A8', glow:'rgba(20,160,150,0.28)' },
  { id:'softness',    icon:'softness',    label:'Retrouver de la douceur', description:"M'apaiser",
    g1:'#902060', g2:'#E090B8', glow:'rgba(190,80,140,0.25)' },
]

// ─── Icônes SVG outline ──────────────────────────────────────────────────────

function Icon({ id, size = 28 }) {
  const s = { fill:'none', stroke:'rgba(255,255,255,0.90)', strokeWidth:1.6, strokeLinecap:'round', strokeLinejoin:'round' }
  const paths = {
    sleep:       <path {...s} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
    stress:      <><path {...s} d="M9.59 4.59A2 2 0 1 1 11 8H2"/><path {...s} d="M10.59 19.41A2 2 0 1 0 14 16H2"/><path {...s} d="M15.73 7.73A2.5 2.5 0 1 1 19.5 12H2"/></>,
    emotions:    <path {...s} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.84-7.84a5.5 5.5 0 0 0 0-7.78z"/>,
    grounding:   <><circle {...s} cx="12" cy="5" r="3"/><line {...s} x1="12" y1="8" x2="12" y2="22"/><path {...s} d="M5 15a7 7 0 0 0 14 0"/></>,
    thoughts:    <><circle {...s} cx="12" cy="12" r="2.5"/><path {...s} d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"/></>,
    energy:      <path {...s} d="M13 2L4.09 12.96A1 1 0 0 0 5 14.5h6.5L10 22l9.5-11.5A1 1 0 0 0 18.5 9H12L13 2z"/>,
    selfconnect: <><circle {...s} cx="12" cy="8" r="4"/><path {...s} d="M4 20c0-3.5 3.6-6.5 8-6.5s8 3 8 6.5"/></>,
    softness:    <><circle {...s} cx="12" cy="12" r="2.5"/><path {...s} d="M12 2a3.5 3.5 0 0 1 0 7"/><path {...s} d="M12 22a3.5 3.5 0 0 1 0-7"/><path {...s} d="M2 12a3.5 3.5 0 0 1 7 0"/><path {...s} d="M22 12a3.5 3.5 0 0 1-7 0"/></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{display:'block',filter:'drop-shadow(0 1px 4px rgba(0,0,0,0.2))'}}>
      {paths[id]}
    </svg>
  )
}

// ─── Particules de fond ──────────────────────────────────────────────────────

const PARTICLES = [
  { x:'6%',  y:'9%',  s:2.5, d:0,   dur:4.2 },
  { x:'88%', y:'6%',  s:2,   d:0.8, dur:3.8 },
  { x:'18%', y:'38%', s:1.5, d:1.5, dur:5.1 },
  { x:'80%', y:'30%', s:2.5, d:0.3, dur:4.5 },
  { x:'50%', y:'14%', s:1.5, d:2.0, dur:3.5 },
  { x:'92%', y:'58%', s:2,   d:1.1, dur:4.8 },
  { x:'4%',  y:'68%', s:1.5, d:0.6, dur:3.9 },
  { x:'62%', y:'90%', s:2.5, d:1.8, dur:4.3 },
]

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  @keyframes nm_float {
    0%,100%{ transform:translateY(0) scale(1); opacity:.4; }
    50%     { transform:translateY(-10px) scale(1.3); opacity:.8; }
  }
  @keyframes nm_fadeUp {
    from{ opacity:0; transform:translateY(12px); }
    to  { opacity:1; transform:translateY(0); }
  }
  @keyframes nm_cardIn {
    from{ opacity:0; transform:translateY(18px) scale(.96); }
    to  { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes nm_ripple {
    from{ transform:scale(0); opacity:.4; }
    to  { transform:scale(4); opacity:0; }
  }
  @keyframes nm_shimmer {
    0%,100% { opacity:.55; transform:translate(0%,0%); }
    50%      { opacity:.85; transform:translate(18%,10%); }
  }
  @keyframes nm_breathe {
    0%  { transform:scale(1); }
    25% { transform:scale(0.96); }
    70% { transform:scale(1.015); }
    100%{ transform:scale(1); }
  }
  .nm-card {
    -webkit-tap-highlight-color:transparent;
    transition: transform .18s ease, box-shadow .18s ease !important;
  }
  .nm-card:active {
    animation: nm_breathe .38s ease forwards !important;
  }
`

// ─── Card ────────────────────────────────────────────────────────────────────

function NeedCard({ need, index, onSelect, isMobile }) {
  const btnRef = useRef(null)

  function handleClick(e) {
    const btn  = btnRef.current
    if (!btn) { onSelect(need); return }
    const rect = btn.getBoundingClientRect()
    const rip  = document.createElement('span')
    const size = Math.max(rect.width, rect.height)
    Object.assign(rip.style, {
      position:'absolute',
      left:`${e.clientX - rect.left - size/2}px`,
      top:`${e.clientY - rect.top  - size/2}px`,
      width:`${size}px`, height:`${size}px`,
      borderRadius:'50%',
      background:'rgba(255,255,255,0.28)',
      animation:'nm_ripple .55s ease-out forwards',
      pointerEvents:'none', zIndex:6,
    })
    btn.appendChild(rip)
    setTimeout(() => rip.remove(), 580)
    setTimeout(() => onSelect(need), 240)
  }

  const cardH   = isMobile ? 130 : 155
  const iconSz  = isMobile ? 26  : 32
  const titleFz = isMobile ? 16  : 22
  const descFz  = isMobile ? 12  : 15
  const pad     = isMobile ? '14px' : '20px'

  // Dégradé enrichi : lumière interne + couleurs
  const bg = `radial-gradient(circle at 28% 18%, rgba(255,255,255,0.26), transparent 58%),
               linear-gradient(145deg, ${need.g1}, ${need.g2})`

  return (
    <button
      ref={btnRef}
      className="nm-card"
      onClick={handleClick}
      style={{
        display:'flex', flexDirection:'column', justifyContent:'space-between',
        padding:pad, height:cardH, width:'100%',
        borderRadius:20,
        background:bg,
        border:'1px solid rgba(255,255,255,0.18)',
        cursor:'pointer', textAlign:'left',
        position:'relative', overflow:'hidden',
        boxShadow:`0 10px 25px ${need.glow}, inset 0 1px 2px rgba(255,255,255,0.30)`,
        animation:`nm_cardIn .42s ease ${index*.058}s both`,
        boxSizing:'border-box',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.015)'
        e.currentTarget.style.boxShadow = `0 18px 36px ${need.glow}, inset 0 1px 2px rgba(255,255,255,0.35)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = `0 10px 25px ${need.glow}, inset 0 1px 2px rgba(255,255,255,0.30)`
      }}
    >
      {/* Lumière interne animée (shimmer lent) */}
      <div style={{
        position:'absolute', inset:0,
        background:'radial-gradient(circle at 22% 14%, rgba(255,255,255,0.18), transparent 52%)',
        animation:`nm_shimmer ${4.2 + index * 0.35}s ease-in-out infinite`,
        pointerEvents:'none', zIndex:0,
      }}/>

      {/* Reflet statique haut */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:'38%',
        background:'linear-gradient(180deg,rgba(255,255,255,0.14) 0%,transparent 100%)',
        borderRadius:'20px 20px 0 0', pointerEvents:'none', zIndex:1,
      }}/>

      {/* Icône SVG */}
      <div style={{position:'relative', zIndex:2}}>
        <Icon id={need.icon} size={iconSz}/>
      </div>

      {/* Texte */}
      <div style={{position:'relative', zIndex:2}}>
        <div style={{
          fontFamily:"'Inter','Jost',sans-serif",
          fontSize:titleFz, fontWeight:500,
          color:'rgba(255,255,255,0.97)',
          lineHeight:1.22, letterSpacing:'-.01em',
          textShadow:'0 1px 4px rgba(0,0,0,0.20)',
        }}>
          {need.label}
        </div>
        <div style={{
          fontFamily:"'Inter','Jost',sans-serif",
          fontSize:descFz, fontWeight:300,
          color:'rgba(255,255,255,0.68)',
          marginTop:isMobile ? 3 : 6, lineHeight:1.35,
        }}>
          {need.description}
        </div>
      </div>
    </button>
  )
}

// ─── Modal principal ─────────────────────────────────────────────────────────

function NeedModalInner({ onSelectNeed, onClose, isMobile }) {
  return (
    <>
      {/* Grain subtil */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none', zIndex:0, opacity:.018,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat:'repeat', backgroundSize:'128px',
      }}/>
      {/* Halos */}
      <div style={{position:'absolute', inset:0, pointerEvents:'none', zIndex:0}}>
        <div style={{position:'absolute',top:'-10%',left:'-8%',width:360,height:360,borderRadius:'50%',background:'radial-gradient(circle,rgba(160,130,220,.10) 0%,transparent 70%)'}}/>
        <div style={{position:'absolute',bottom:'5%',right:'-8%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(20,150,140,.08) 0%,transparent 70%)'}}/>
      </div>
      {/* Particules */}
      <div style={{position:'absolute', inset:0, pointerEvents:'none', zIndex:0}}>
        {PARTICLES.map((p,i) => (
          <div key={i} style={{
            position:'absolute', left:p.x, top:p.y,
            width:p.s, height:p.s, borderRadius:'50%',
            background:'rgba(255,255,255,0.9)',
            boxShadow:`0 0 ${p.s*4}px ${p.s*2}px rgba(210,190,255,0.35)`,
            animation:`nm_float ${p.dur}s ease-in-out ${p.d}s infinite`,
          }}/>
        ))}
      </div>
      {/* Bouton fermer */}
      <button onClick={onClose} style={{
        position:'absolute', top:16, right:16, zIndex:10,
        width:32, height:32, borderRadius:'50%',
        background:'rgba(255,255,255,0.50)', border:'1px solid rgba(180,160,200,.30)',
        backdropFilter:'blur(8px)', cursor:'pointer', fontSize:13, color:'rgba(50,35,70,.45)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>✕</button>
      {/* Contenu */}
      <div style={{
        position:'relative', zIndex:1, flex:1, overflowY:'auto',
        width:'100%', margin:'0 auto',
        padding: isMobile ? '12px 16px 0' : '32px 32px 0',
        boxSizing:'border-box', display:'flex', flexDirection:'column',
      }}>
        {/* Header */}
        <div style={{textAlign:'center', marginBottom:'20px', animation:'nm_fadeUp .45s ease both', flexShrink:0}}>
          <h1 style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize: isMobile ? 28 : 38,
            fontWeight:400, color:'#2A1F18', lineHeight:1.3,
            margin:'0 0 8px', letterSpacing:'-.01em',
          }}>
            Quel est votre besoin<br/>
            <em style={{fontStyle:'italic', fontWeight:300, color:'#4a3860'}}>en ce moment ?</em>
          </h1>
          <p style={{
            fontFamily:"'Inter','Jost',sans-serif",
            fontSize: isMobile ? 13 : 16,
            fontWeight:300, color:'rgba(50,35,20,.50)',
            margin:0, letterSpacing:'.02em',
          }}>Suivez ce qui résonne en vous</p>
        </div>
        {/* Grille */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap: isMobile ? 12 : 18, flexShrink:0 }}>
          {NEEDS.map((need,i) => (
            <NeedCard key={need.id} need={need} index={i} onSelect={onSelectNeed} isMobile={isMobile}/>
          ))}
        </div>
        {/* Footer */}
        <div style={{
          textAlign:'center', padding: isMobile ? '16px 0 20px' : '20px 0 24px',
          flexShrink:0, animation:'nm_fadeUp .5s ease .35s both',
        }}>
          <p style={{ fontFamily:"'Inter','Jost',sans-serif", fontSize:18, fontWeight:400, color:'#1E1E1E', margin:0 }}>
            Un seul choix suffit pour commencer
          </p>
        </div>
      </div>
    </>
  )
}

export default function NeedSelectionModal({ onSelectNeed, onClose }) {
  const isMobile = useIsMobile()
  const bg = 'radial-gradient(circle at 50% 18%, #f5efe6, #e8dfd2 58%, #e0d4c0)'

  if (!isMobile) return (
    <>
      <style>{CSS}</style>
      <div style={{ position:'fixed', inset:0, zIndex:260, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(20,12,5,0.55)', backdropFilter:'blur(8px)' }}/>
        <div style={{
          position:'relative', zIndex:1,
          width:'min(780px, 95vw)', maxHeight:'92vh',
          borderRadius:24, overflow:'hidden', background:bg,
          display:'flex', flexDirection:'column',
          boxShadow:'0 32px 80px rgba(0,0,0,0.32)',
        }}>
          <NeedModalInner onSelectNeed={onSelectNeed} onClose={onClose} isMobile={false}/>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{CSS}</style>
      <div style={{ position:'fixed', inset:0, zIndex:260, background:bg, display:'flex', flexDirection:'column' }}>
        <NeedModalInner onSelectNeed={onSelectNeed} onClose={onClose} isMobile={true}/>
      </div>
    </>
  )
}
