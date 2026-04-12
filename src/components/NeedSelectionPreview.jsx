// NeedSelectionPreview.jsx
// Preview des 3 variantes visuelles — switcher intégré
// Pour activer : remplacer NeedSelectionModal par NeedSelectionPreview dans ScreenMonJardin
import { useState, useRef } from 'react'

// ─── Données partagées ───────────────────────────────────────────────────────

const NEEDS = [
  { id:'sleep',       emoji:'😴', label:'Mieux dormir',          description:'Retrouver un sommeil apaisé',
    grad:'linear-gradient(145deg,#5B4B8A,#7A6FAF)', vivid:'linear-gradient(145deg,#6B21A8,#A855F7)', glow:'#7C3AED', tag:'#E9D5FF', tagText:'#5B21B6' },
  { id:'stress',      emoji:'🌬️', label:'Apaiser le stress',      description:'Relâcher la pression',
    grad:'linear-gradient(145deg,#3A7CA5,#5FA8D3)', vivid:'linear-gradient(145deg,#1E40AF,#3B82F6)', glow:'#2563EB', tag:'#DBEAFE', tagText:'#1E40AF' },
  { id:'emotions',    emoji:'💛', label:'Apaiser mes émotions',   description:'Accueillir ce qui est là',
    grad:'linear-gradient(145deg,#D88C9A,#F2B5C4)', vivid:'linear-gradient(145deg,#BE185D,#EC4899)', glow:'#DB2777', tag:'#FCE7F3', tagText:'#9D174D' },
  { id:'grounding',   emoji:'🌳', label:'Me sentir ancré',        description:'Retrouver stabilité',
    grad:'linear-gradient(145deg,#3E6B48,#6FAF7B)', vivid:'linear-gradient(145deg,#065F46,#10B981)', glow:'#059669', tag:'#D1FAE5', tagText:'#065F46' },
  { id:'thoughts',    emoji:'🧠', label:'Calmer mes pensées',     description:'Faire de la place',
    grad:'linear-gradient(145deg,#4A5568,#718096)', vivid:'linear-gradient(145deg,#1E3A5F,#3B6DA8)', glow:'#3B6DA8', tag:'#DBEAFE', tagText:'#1E3A5F' },
  { id:'energy',      emoji:'🌱', label:'Retrouver de l\'énergie',description:'Revenir à l\'élan',
    grad:'linear-gradient(145deg,#C9A96E,#E6C98F)', vivid:'linear-gradient(145deg,#92400E,#F59E0B)', glow:'#D97706', tag:'#FEF3C7', tagText:'#92400E' },
  { id:'selfconnect', emoji:'🤍', label:'Me reconnecter à moi',   description:'Me retrouver',
    grad:'linear-gradient(145deg,#7BAE9E,#A8D5C2)', vivid:'linear-gradient(145deg,#134E4A,#2DD4BF)', glow:'#0D9488', tag:'#CCFBF1', tagText:'#134E4A' },
  { id:'softness',    emoji:'🌸', label:'Retrouver de la douceur',description:'M\'apaiser',
    grad:'linear-gradient(145deg,#E8CFCF,#F5E6E6)', vivid:'linear-gradient(145deg,#831843,#F9A8D4)', glow:'#DB2777', tag:'#FCE7F3', tagText:'#831843' },
]

// ─── CSS commun ──────────────────────────────────────────────────────────────

const SHARED_CSS = `
  @keyframes _float {
    0%,100%{ transform:translateY(0) scale(1); opacity:.5; }
    50%     { transform:translateY(-10px) scale(1.25); opacity:.9; }
  }
  @keyframes _fadeUp {
    from{ opacity:0; transform:translateY(14px); }
    to  { opacity:1; transform:translateY(0); }
  }
  @keyframes _cardIn {
    from{ opacity:0; transform:translateY(18px) scale(.97); }
    to  { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes _ripple {
    from{ transform:scale(0); opacity:.4; }
    to  { transform:scale(4); opacity:0; }
  }
  @keyframes _bgShift {
    0%  { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100%{ background-position: 0% 50%; }
  }
  .nsv-card:active{
    transform:scale(0.96) !important;
    transition:transform .08s ease !important;
  }
`

// ─── Utilitaire ripple ────────────────────────────────────────────────────────

function fireRipple(e, color = 'rgba(255,255,255,0.4)') {
  const btn  = e.currentTarget
  const rect = btn.getBoundingClientRect()
  const x    = e.clientX - rect.left
  const y    = e.clientY - rect.top
  const size = Math.max(rect.width, rect.height)
  const rip  = document.createElement('span')
  Object.assign(rip.style, {
    position:'absolute', borderRadius:'50%',
    left:`${x - size/2}px`, top:`${y - size/2}px`,
    width:`${size}px`, height:`${size}px`,
    background: color,
    animation:'_ripple .55s ease-out forwards',
    pointerEvents:'none', zIndex:5,
  })
  btn.appendChild(rip)
  setTimeout(() => rip.remove(), 580)
}

// ════════════════════════════════════════════════════════════════════════════
//  VARIANTE A — "Nuit Profonde"  (Audacieuse)
// ════════════════════════════════════════════════════════════════════════════

const PARTICLES_DARK = [
  {x:'8%',y:'9%',s:3,d:0,dur:4.2,c:'rgba(167,139,250,.8)'},
  {x:'88%',y:'6%',s:2,d:.8,dur:3.8,c:'rgba(251,191,36,.8)'},
  {x:'20%',y:'40%',s:1.5,d:1.5,dur:5.1,c:'rgba(167,139,250,.6)'},
  {x:'80%',y:'32%',s:2.5,d:.3,dur:4.5,c:'rgba(56,189,248,.7)'},
  {x:'50%',y:'15%',s:1.5,d:2,dur:3.5,c:'rgba(251,191,36,.6)'},
  {x:'93%',y:'60%',s:2,d:1.1,dur:4.8,c:'rgba(167,139,250,.7)'},
  {x:'5%',y:'70%',s:1.5,d:.6,dur:3.9,c:'rgba(56,189,248,.6)'},
  {x:'60%',y:'90%',s:2,d:1.8,dur:4.3,c:'rgba(251,191,36,.7)'},
]

function VariantBold({ onSelectNeed, onClose }) {
  function handleCard(e, need) {
    fireRipple(e, 'rgba(255,255,255,0.25)')
    setTimeout(() => onSelectNeed(need), 220)
  }
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:261,
      background:'#080B1A',
      display:'flex', flexDirection:'column', overflowY:'auto',
    }}>
      {/* Halos de fond */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none'}}>
        <div style={{position:'absolute',top:'-10%',left:'-5%',width:340,height:340,borderRadius:'50%',background:'radial-gradient(circle,rgba(109,40,217,.28) 0%,transparent 70%)'}}/>
        <div style={{position:'absolute',bottom:'5%',right:'-8%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(13,148,136,.22) 0%,transparent 70%)'}}/>
        <div style={{position:'absolute',top:'42%',right:'10%',width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(219,39,119,.18) 0%,transparent 70%)'}}/>
        {PARTICLES_DARK.map((p,i)=>(
          <div key={i} style={{
            position:'absolute', left:p.x, top:p.y,
            width:p.s, height:p.s, borderRadius:'50%',
            background:p.c,
            boxShadow:`0 0 ${p.s*5}px ${p.s*2}px ${p.c}`,
            animation:`_float ${p.dur}s ease-in-out ${p.d}s infinite`,
          }}/>
        ))}
      </div>

      <button onClick={onClose} style={{position:'absolute',top:16,right:16,zIndex:10,width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',cursor:'pointer',fontSize:13,color:'rgba(255,255,255,.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>

      <div style={{position:'relative',zIndex:1,padding:'24px 20px 24px',display:'flex',flexDirection:'column',minHeight:'100%',boxSizing:'border-box'}}>

        {/* Header */}
        <div style={{textAlign:'center',marginBottom:'28px',animation:'_fadeUp .45s ease both'}}>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:400,color:'#F5F0FF',lineHeight:1.3,margin:'0 0 10px',letterSpacing:'-.01em',textShadow:'0 0 40px rgba(167,139,250,.4)'}}>
            Quel est votre besoin<br/><em style={{fontStyle:'italic',fontWeight:300}}>en ce moment ?</em>
          </h1>
          <p style={{fontFamily:"'Inter','Jost',sans-serif",fontSize:13,color:'rgba(200,185,240,.55)',margin:0,letterSpacing:'.04em'}}>
            Écoutez simplement ce qui appelle en vous
          </p>
        </div>

        {/* Grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14,flex:1}}>
          {NEEDS.map((need,i)=>(
            <button key={need.id} className="nsv-card"
              onClick={e=>handleCard(e,need)}
              style={{
                display:'flex', flexDirection:'column', justifyContent:'space-between',
                padding:'16px', height:140, width:'100%', borderRadius:20,
                background:need.vivid,
                border:'1px solid rgba(255,255,255,0.12)',
                cursor:'pointer', textAlign:'left', position:'relative', overflow:'hidden',
                boxShadow:`0 8px 32px ${need.glow}55, inset 0 1px 0 rgba(255,255,255,.15)`,
                transition:'transform .18s ease, box-shadow .18s ease',
                animation:`_cardIn .42s ease ${i*.06}s both`,
                boxSizing:'border-box',
              }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow=`0 16px 40px ${need.glow}77, inset 0 1px 0 rgba(255,255,255,.2)`}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=`0 8px 32px ${need.glow}55, inset 0 1px 0 rgba(255,255,255,.15)`}}
            >
              <div style={{position:'absolute',top:0,left:0,right:0,height:'40%',background:'linear-gradient(180deg,rgba(255,255,255,.15) 0%,transparent 100%)',borderRadius:'20px 20px 0 0',pointerEvents:'none'}}/>
              <div style={{fontSize:28,lineHeight:1,opacity:.9,position:'relative',zIndex:1,filter:'drop-shadow(0 2px 8px rgba(0,0,0,.3))'}}>
                {need.emoji}
              </div>
              <div style={{position:'relative',zIndex:1}}>
                <div style={{fontFamily:"'Inter','Jost',sans-serif",fontSize:15,fontWeight:600,color:'#fff',lineHeight:1.2,textShadow:'0 1px 4px rgba(0,0,0,.25)'}}>
                  {need.label}
                </div>
                <div style={{fontFamily:"'Inter','Jost',sans-serif",fontSize:11,fontWeight:300,color:'rgba(255,255,255,.72)',marginTop:4,lineHeight:1.3}}>
                  {need.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{textAlign:'center',marginTop:24,animation:'_fadeUp .5s ease .35s both'}}>
          <p style={{fontFamily:"'Inter','Jost',sans-serif",fontSize:12,fontWeight:300,color:'rgba(180,160,240,.35)',margin:0,letterSpacing:'.05em'}}>
            Un seul choix suffit pour commencer
          </p>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  VARIANTE B — "Papier"  (Minimaliste)
// ════════════════════════════════════════════════════════════════════════════

function VariantMinimal({ onSelectNeed, onClose }) {
  function handleCard(e, need) {
    fireRipple(e, `${need.glow}22`)
    setTimeout(() => onSelectNeed(need), 220)
  }
  return (
    <div style={{position:'fixed',inset:0,zIndex:261,background:'#FAFAFA',display:'flex',flexDirection:'column',overflowY:'auto'}}>

      <button onClick={onClose} style={{position:'absolute',top:16,right:16,zIndex:10,width:32,height:32,borderRadius:'50%',background:'rgba(0,0,0,.05)',border:'1px solid rgba(0,0,0,.08)',cursor:'pointer',fontSize:13,color:'rgba(0,0,0,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>

      <div style={{position:'relative',zIndex:1,padding:'24px 20px 24px',display:'flex',flexDirection:'column',minHeight:'100%',boxSizing:'border-box'}}>

        {/* Header */}
        <div style={{textAlign:'center',marginBottom:'28px',animation:'_fadeUp .4s ease both'}}>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:400,color:'#1E1E1E',lineHeight:1.3,margin:'0 0 8px',letterSpacing:'-.01em'}}>
            Quel est votre besoin<br/><em style={{fontStyle:'italic',fontWeight:300,color:'#555'}}>en ce moment ?</em>
          </h1>
          <p style={{fontFamily:"'Inter','Jost',sans-serif",fontSize:13,color:'rgba(30,30,30,.45)',margin:0,letterSpacing:'.02em'}}>
            Écoutez simplement ce qui appelle en vous
          </p>
        </div>

        {/* Grid — cartes épurées */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,flex:1}}>
          {NEEDS.map((need,i)=>(
            <button key={need.id} className="nsv-card"
              onClick={e=>handleCard(e,need)}
              style={{
                display:'flex', flexDirection:'column', justifyContent:'space-between',
                padding:'16px', height:140, width:'100%',
                borderRadius:18,
                background:'#FFFFFF',
                border:`1.5px solid ${need.tag}`,
                cursor:'pointer', textAlign:'left', position:'relative', overflow:'hidden',
                boxShadow:'0 2px 12px rgba(0,0,0,.05)',
                transition:'transform .18s ease, box-shadow .18s ease, border-color .18s',
                animation:`_cardIn .4s ease ${i*.055}s both`,
                boxSizing:'border-box',
              }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 24px ${need.glow}18`;e.currentTarget.style.borderColor=`${need.glow}50`}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,.05)';e.currentTarget.style.borderColor=need.tag}}
            >
              {/* Bande colorée en haut */}
              <div style={{position:'absolute',top:0,left:0,right:0,height:4,background:need.grad,borderRadius:'18px 18px 0 0',pointerEvents:'none'}}/>

              {/* Pastille icône */}
              <div style={{width:40,height:40,borderRadius:12,background:need.tag,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginTop:4,flexShrink:0}}>
                {need.emoji}
              </div>

              {/* Texte */}
              <div>
                <div style={{fontFamily:"'Inter','Jost',sans-serif",fontSize:14,fontWeight:600,color:'#1E1E1E',lineHeight:1.2,letterSpacing:'-.01em'}}>
                  {need.label}
                </div>
                <div style={{fontFamily:"'Inter','Jost',sans-serif",fontSize:11,fontWeight:400,color:'rgba(30,30,30,.45)',marginTop:3,lineHeight:1.3}}>
                  {need.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{textAlign:'center',marginTop:24,animation:'_fadeUp .5s ease .35s both'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8}}>
            <div style={{height:1,width:32,background:'rgba(0,0,0,.12)'}}/>
            <p style={{fontFamily:"'Inter','Jost',sans-serif",fontSize:11,color:'rgba(30,30,30,.3)',margin:0,letterSpacing:'.05em'}}>
              Un seul choix suffit pour commencer
            </p>
            <div style={{height:1,width:32,background:'rgba(0,0,0,.12)'}}/>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  VARIANTE C — "Cosmos"  (Immersive · glassmorphism)
// ════════════════════════════════════════════════════════════════════════════

const CSS_IMMERSIVE = `
  @keyframes _bgAnim {
    0%  { background-position:0% 50%; }
    50% { background-position:100% 50%; }
    100%{ background-position:0% 50%; }
  }
  .nsv-imm-bg {
    background: linear-gradient(130deg,#0F0C29,#302B63,#24243E,#0D1B2A,#1B0036,#0a2342);
    background-size: 400% 400%;
    animation: _bgAnim 14s ease infinite;
  }
`

const PARTICLES_COSMOS = [
  {x:'12%',y:'8%',s:2.5,d:0,dur:4.5,c:'rgba(255,255,255,.8)'},{x:'82%',y:'5%',s:1.5,d:.9,dur:3.7,c:'rgba(255,255,255,.7)'},
  {x:'25%',y:'22%',s:1,d:1.6,dur:5.2,c:'rgba(255,255,255,.6)'},{x:'72%',y:'28%',s:2,d:.4,dur:4.1,c:'rgba(200,180,255,.8)'},
  {x:'45%',y:'12%',s:1.5,d:2.1,dur:3.8,c:'rgba(255,255,255,.7)'},{x:'90%',y:'55%',s:1,d:1.2,dur:4.9,c:'rgba(180,220,255,.7)'},
  {x:'8%',y:'65%',s:2,d:.7,dur:4.0,c:'rgba(255,255,255,.6)'},{x:'58%',y:'88%',s:1.5,d:1.9,dur:4.4,c:'rgba(255,200,200,.7)'},
  {x:'30%',y:'78%',s:1,d:.5,dur:5.1,c:'rgba(255,255,255,.5)'},{x:'70%',y:'70%',s:2.5,d:2.3,dur:3.6,c:'rgba(200,255,220,.7)'},
]

function VariantImmersive({ onSelectNeed, onClose }) {
  function handleCard(e, need) {
    fireRipple(e, 'rgba(255,255,255,0.2)')
    setTimeout(() => onSelectNeed(need), 220)
  }
  return (
    <>
      <style>{CSS_IMMERSIVE}</style>
      <div className="nsv-imm-bg" style={{position:'fixed',inset:0,zIndex:261,display:'flex',flexDirection:'column',overflowY:'auto'}}>

        {/* Étoiles */}
        <div style={{position:'fixed',inset:0,pointerEvents:'none'}}>
          {PARTICLES_COSMOS.map((p,i)=>(
            <div key={i} style={{
              position:'absolute',left:p.x,top:p.y,
              width:p.s,height:p.s,borderRadius:'50%',
              background:p.c,
              boxShadow:`0 0 ${p.s*4}px ${p.s*2}px ${p.c}`,
              animation:`_float ${p.dur}s ease-in-out ${p.d}s infinite`,
            }}/>
          ))}
        </div>

        <button onClick={onClose} style={{position:'absolute',top:16,right:16,zIndex:10,width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',cursor:'pointer',fontSize:13,color:'rgba(255,255,255,.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>

        <div style={{position:'relative',zIndex:1,padding:'24px 20px 24px',display:'flex',flexDirection:'column',minHeight:'100%',boxSizing:'border-box'}}>

          {/* Header */}
          <div style={{textAlign:'center',marginBottom:'28px',animation:'_fadeUp .45s ease both'}}>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:400,color:'rgba(255,255,255,.95)',lineHeight:1.3,margin:'0 0 10px',letterSpacing:'-.01em',textShadow:'0 0 60px rgba(180,140,255,.5)'}}>
              Quel est votre besoin<br/><em style={{fontStyle:'italic',fontWeight:300,color:'rgba(200,180,255,.85)'}}>en ce moment ?</em>
            </h1>
            <p style={{fontFamily:"'Inter','Jost',sans-serif",fontSize:13,color:'rgba(200,185,255,.5)',margin:0,letterSpacing:'.04em'}}>
              Écoutez simplement ce qui appelle en vous
            </p>
          </div>

          {/* Grid — glassmorphism */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14,flex:1}}>
            {NEEDS.map((need,i)=>(
              <button key={need.id} className="nsv-card"
                onClick={e=>handleCard(e,need)}
                style={{
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  gap:12,
                  padding:'16px 12px', height:140, width:'100%',
                  borderRadius:22,
                  background:'rgba(255,255,255,0.08)',
                  backdropFilter:'blur(18px)',
                  WebkitBackdropFilter:'blur(18px)',
                  border:'1px solid rgba(255,255,255,0.18)',
                  cursor:'pointer', textAlign:'center', position:'relative', overflow:'hidden',
                  boxShadow:`0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.12)`,
                  transition:'transform .18s ease, box-shadow .18s ease, background .2s ease',
                  animation:`_cardIn .42s ease ${i*.06}s both`,
                  boxSizing:'border-box',
                }}
                onMouseEnter={e=>{
                  e.currentTarget.style.transform='translateY(-4px) scale(1.02)'
                  e.currentTarget.style.background=`rgba(255,255,255,0.14)`
                  e.currentTarget.style.boxShadow=`0 16px 48px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.2), 0 0 0 1px ${need.glow}40`
                }}
                onMouseLeave={e=>{
                  e.currentTarget.style.transform='none'
                  e.currentTarget.style.background='rgba(255,255,255,0.08)'
                  e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.12)'
                }}
              >
                {/* Halo coloré derrière */}
                <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:80,height:80,borderRadius:'50%',background:`radial-gradient(circle,${need.glow}30 0%,transparent 70%)`,pointerEvents:'none'}}/>

                <div style={{fontSize:32,lineHeight:1,filter:`drop-shadow(0 0 10px ${need.glow}80)`,position:'relative',zIndex:1}}>
                  {need.emoji}
                </div>
                <div style={{position:'relative',zIndex:1}}>
                  <div style={{fontFamily:"'Inter','Jost',sans-serif",fontSize:14,fontWeight:500,color:'rgba(255,255,255,.92)',lineHeight:1.2,textShadow:'0 1px 4px rgba(0,0,0,.3)'}}>
                    {need.label}
                  </div>
                  <div style={{fontFamily:"'Inter','Jost',sans-serif",fontSize:11,fontWeight:300,color:'rgba(255,255,255,.5)',marginTop:4,lineHeight:1.3}}>
                    {need.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div style={{textAlign:'center',marginTop:24,animation:'_fadeUp .5s ease .35s both'}}>
            <p style={{fontFamily:"'Inter','Jost',sans-serif",fontSize:12,fontWeight:300,color:'rgba(200,185,255,.3)',margin:0,letterSpacing:'.05em'}}>
              Un seul choix suffit pour commencer
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  SWITCHER — composant principal exporté
// ════════════════════════════════════════════════════════════════════════════

const VARIANTS = [
  { id:'bold',     label:'Audacieuse',  emoji:'🔥' },
  { id:'minimal',  label:'Minimaliste', emoji:'🤍' },
  { id:'immersive',label:'Immersive',   emoji:'🌌' },
]

const CSS_SWITCHER = `
  .nsv-tab { transition: background .15s, color .15s, transform .1s; }
  .nsv-tab:hover { transform: translateY(-1px); }
  .nsv-tab:active { transform: scale(0.95); }
`

export default function NeedSelectionPreview({ onSelectNeed, onClose }) {
  const [active, setActive] = useState('bold')

  const sharedProps = { onSelectNeed, onClose }

  return (
    <>
      <style>{SHARED_CSS + CSS_SWITCHER}</style>

      {/* Rendu de la variante active */}
      {active === 'bold'      && <VariantBold      {...sharedProps} />}
      {active === 'minimal'   && <VariantMinimal   {...sharedProps} />}
      {active === 'immersive' && <VariantImmersive {...sharedProps} />}

      {/* Barre switcher flottante — toujours au-dessus */}
      <div style={{
        position:       'fixed',
        bottom:         24,
        left:           '50%',
        transform:      'translateX(-50%)',
        zIndex:         999,
        display:        'flex',
        gap:            6,
        background:     'rgba(10,8,20,.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter:'blur(16px)',
        border:         '1px solid rgba(255,255,255,.12)',
        borderRadius:   100,
        padding:        '5px 6px',
        boxShadow:      '0 8px 32px rgba(0,0,0,.35)',
      }}>
        {VARIANTS.map(v => (
          <button
            key={v.id}
            className="nsv-tab"
            onClick={() => setActive(v.id)}
            style={{
              display:        'flex', alignItems:'center', gap:5,
              padding:        '7px 14px',
              borderRadius:   100,
              border:         'none',
              cursor:         'pointer',
              fontFamily:     "'Inter','Jost',sans-serif",
              fontSize:       12,
              fontWeight:     active === v.id ? 600 : 400,
              background:     active === v.id ? 'rgba(255,255,255,0.95)' : 'transparent',
              color:          active === v.id ? '#1a1208' : 'rgba(255,255,255,.55)',
              letterSpacing:  '.02em',
              whiteSpace:     'nowrap',
            }}
          >
            <span style={{ fontSize:13 }}>{v.emoji}</span>
            {v.label}
          </button>
        ))}
      </div>
    </>
  )
}
