// RitualSuggestionModal.jsx — rituel suggéré + guided steps + évaluation + Ma Fleur
import { useState } from 'react'
import { useIsMobile } from '../pages/dashboardShared'

// ─── Un rituel par besoin ────────────────────────────────────────────────────

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
  },
  emotions: {
    title:    "L'accueil de l'émotion",
    subtitle: 'Le rituel de la présence bienveillante',
    duration: '7 min',
    intro:    'Accueillir une émotion sans la juger ni l\'effacer — c\'est le seul chemin pour qu\'elle se dissolve.',
    steps: [
      { num:'1', label:'Nommez-la',             text:'Fermez les yeux. Quelle émotion est là ? Tristesse, colère, peur… Donnez-lui un nom.' },
      { num:'2', label:'Localisez-la',          text:'Où la ressentez-vous dans le corps ? Gorge, poitrine, ventre ?' },
      { num:'3', label:'Accueillez sans lutter', text:'Dites intérieurement : "Je vois que tu es là. Je t\'accueille."' },
      { num:'4', label:'Respirez avec elle',    text:'Trois respirations lentes. Imaginez que chaque expir l\'apaise doucement.' },
    ],
    tip: 'Il n\'y a rien à faire. Juste être là avec ce qui est.',
    icon: '💗',
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
  },
  thoughts: {
    title:    "La méditation de l'observateur",
    subtitle: 'Le rituel du silence intérieur',
    duration: '8 min',
    intro:    'Vous n\'êtes pas vos pensées. Cet exercice crée de l\'espace entre vous et le flux mental.',
    steps: [
      { num:'1', label:'Asseyez-vous',          text:'Fermez les yeux, dos droit, mains posées sur les genoux.' },
      { num:'2', label:'Observez le flux',      text:'Laissez les pensées passer comme des nuages. Ne les suivez pas.' },
      { num:'3', label:'Nommez sans juger',     text:'Si une pensée s\'impose, dites "pensée" et revenez à votre souffle.' },
      { num:'4', label:'Ancrez-vous au souffle', text:'À chaque expir, répétez intérieurement : "Je suis ici."' },
    ],
    tip: 'Les pensées reviendront — c\'est normal. Revenir au souffle, c\'est le rituel.',
    icon: '✨',
  },
  energy: {
    title:    'Activation corps & souffle',
    subtitle: 'Le rituel du réveil énergétique',
    duration: '6 min',
    intro:    'Quelques mouvements doux combinés à la respiration suffisent à raviver l\'élan vital.',
    steps: [
      { num:'1', label:'Debout, étirez-vous',   text:'Levez les bras au-dessus de la tête, inspirez profondément.' },
      { num:'2', label:'Secouez doucement',     text:'Laissez les mains, les épaules, puis tout le corps se secouer librement 30 sec.' },
      { num:'3', label:'Respiration kapalabhati', text:'Expirez par le nez de façon rythmée et courte (20x). Puis respirez normalement.' },
      { num:'4', label:'Ancrez l\'élan',        text:'Posez les mains sur le ventre. Ressentez la chaleur et l\'énergie qui circule.' },
    ],
    tip: 'Faites-le debout, si possible pieds nus sur le sol.',
    icon: '⚡',
  },
  selfconnect: {
    title:    'Journaling express',
    subtitle: 'Le rituel de la reconnexion à soi',
    duration: '10 min',
    intro:    'Trois questions simples pour retrouver le fil de soi, même dans les journées les plus chargées.',
    steps: [
      { num:'1', label:'Qu\'est-ce que je ressens vraiment ?',  text:'Sans filtre. Joyeux·se, épuisé·e, confus·e… Écrivez ce qui vient.' },
      { num:'2', label:'De quoi ai-je besoin là, maintenant ?', text:'Repos ? Contact ? Mouvement ? Un mot d\'encouragement ?' },
      { num:'3', label:'Une chose que j\'ai bien faite aujourd\'hui', text:'Une chose, même petite. Prenez le temps de la reconnaître.' },
      { num:'4', label:'Un geste de soin pour la suite',        text:'Quelle petite action ferait du bien dans les prochaines heures ?' },
    ],
    tip: 'Carnet et stylo de préférence — l\'écriture manuelle connecte davantage.',
    icon: '🌿',
  },
  softness: {
    title:    'Auto-massage douceur',
    subtitle: 'Le rituel de la tendresse envers soi',
    duration: '7 min',
    intro:    'Le toucher bienveillant active l\'ocytocine et apaise le système nerveux en quelques minutes.',
    steps: [
      { num:'1', label:'Mains',               text:'Massez chaque main lentement : paume, pouce, chaque doigt. Prenez votre temps.' },
      { num:'2', label:'Tempes et front',     text:'Cercles doux avec les pouces sur les tempes, puis le front. Expirez en massant.' },
      { num:'3', label:'Nuque et épaules',    text:'Pétrissez doucement la nuque avec les deux mains. Roulez les épaules.' },
      { num:'4', label:'Main sur le cœur',    text:'Posez une main sur le sternum. Respirez 3 fois en sentant cette chaleur.' },
    ],
    tip: 'Faites-le yeux fermés, en silence. C\'est un moment rien que pour vous.',
    icon: '🌸',
  },
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  @keyframes rs_in     { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes rs_stepIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes rs_pulse  { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.12);opacity:1} }
  @keyframes rs_pop    { 0%{transform:scale(.85);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
  @keyframes rs_fleur  { 0%{transform:scale(.9) rotate(-4deg);opacity:0} 100%{transform:scale(1) rotate(0deg);opacity:1} }
  @keyframes rs_eval   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
`

// ─── Phase : vue du rituel ────────────────────────────────────────────────────

function PhaseView({ ritual, need, isMobile, onStart, onBack, onClose }) {
  const { g1, g2, glow } = need
  return (
    <>
      {/* Header */}
      <div style={{ flexShrink:0, padding: isMobile ? '18px 18px 0' : '28px 32px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.55)', border:'1px solid rgba(180,160,140,0.25)', borderRadius:100, padding:'7px 16px', cursor:'pointer', color:'rgba(50,35,20,0.65)', fontSize:13, fontFamily:"'Jost',sans-serif" }}>‹ Autre besoin</button>
        <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.55)', border:'1px solid rgba(180,160,140,0.25)', cursor:'pointer', color:'rgba(50,35,20,0.45)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
      </div>
      {/* Corps */}
      <div style={{ flex:1, overflowY:'auto', padding: isMobile ? '24px 20px 32px' : '28px 32px 32px', boxSizing:'border-box' }}>
        {/* Badge */}
        <div style={{ animation:'rs_in .35s ease both', marginBottom:18 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:100, background:`linear-gradient(135deg,${g1},${g2})`, boxShadow:`0 4px 16px ${glow}` }}>
            <span style={{ fontSize:18 }}>{ritual.icon}</span>
            <span style={{ fontFamily:"'Jost',sans-serif", fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.95)', letterSpacing:'.08em', textTransform:'uppercase' }}>{need.label}</span>
          </div>
        </div>
        {/* Titre */}
        <div style={{ animation:'rs_in .38s ease .05s both', marginBottom:20 }}>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 34 : 44, fontWeight:400, color:'#2A1F18', margin:'0 0 6px', lineHeight:1.15 }}>{ritual.title}</h2>
          <p style={{ fontFamily:"'Jost',sans-serif", fontSize: isMobile ? 14 : 16, color:'rgba(50,35,20,0.50)', margin:'0 0 4px' }}>{ritual.subtitle}</p>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:`linear-gradient(135deg,${g1},${g2})`, animation:'rs_pulse 2s ease-in-out infinite' }}/>
            <span style={{ fontFamily:"'Jost',sans-serif", fontSize:14, color:'rgba(50,35,20,0.45)' }}>{ritual.duration}</span>
          </div>
        </div>
        {/* Intro */}
        <div style={{ padding:'16px 20px', borderRadius:16, background:'rgba(255,255,255,0.55)', border:'1px solid rgba(180,160,140,0.20)', marginBottom:24, animation:'rs_in .4s ease .1s both' }}>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 19 : 22, fontStyle:'italic', color:'rgba(50,35,20,0.70)', margin:0, lineHeight:1.6 }}>{ritual.intro}</p>
        </div>
        {/* Étapes */}
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
        {/* Tip */}
        <div style={{ padding:'14px 18px', borderRadius:14, background:`linear-gradient(135deg,${g1}18,${g2}10)`, border:`1px solid ${g1}28`, marginBottom:28, animation:'rs_in .4s ease .42s both' }}>
          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
            <p style={{ fontFamily:"'Jost',sans-serif", fontSize:14, color:'rgba(50,35,20,0.65)', margin:0, lineHeight:1.6 }}>{ritual.tip}</p>
          </div>
        </div>
        {/* CTA */}
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

// ─── Phase : exécution guidée ─────────────────────────────────────────────────

function PhaseDoing({ ritual, need, isMobile, onDone, onClose }) {
  const [stepIdx, setStepIdx] = useState(0)
  const { g1, g2, glow } = need
  const isLast = stepIdx === ritual.steps.length - 1
  const step   = ritual.steps[stepIdx]

  return (
    <>
      <div style={{ flexShrink:0, padding: isMobile ? '18px 18px 0' : '28px 32px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:'rgba(50,35,20,0.45)' }}>
          Étape {stepIdx + 1} / {ritual.steps.length}
        </div>
        <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.55)', border:'1px solid rgba(180,160,140,0.25)', cursor:'pointer', color:'rgba(50,35,20,0.45)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
      </div>

      {/* Barre progression */}
      <div style={{ flexShrink:0, padding:'12px 20px 0', display:'flex', gap:6 }}>
        {ritual.steps.map((_, i) => (
          <div key={i} style={{ flex:1, height:4, borderRadius:4, background: i <= stepIdx ? `linear-gradient(90deg,${g1},${g2})` : 'rgba(180,160,140,0.20)', transition:'background .3s' }}/>
        ))}
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: isMobile ? '32px 24px' : '40px 48px', textAlign:'center', animation:'rs_in .35s ease both' }}>
        {/* Numéro */}
        <div style={{ width:72, height:72, borderRadius:'50%', background:`linear-gradient(135deg,${g1},${g2})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 8px 24px ${glow}`, marginBottom:28, animation:'rs_pop .4s ease both' }}>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:26, fontWeight:700, color:'#fff' }}>{step.num}</span>
        </div>
        {/* Label */}
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 28 : 36, fontWeight:400, color:'#2A1F18', margin:'0 0 16px', lineHeight:1.2 }}>{step.label}</h2>
        {/* Texte */}
        <p style={{ fontFamily:"'Jost',sans-serif", fontSize: isMobile ? 16 : 18, color:'rgba(50,35,20,0.75)', lineHeight:1.7, margin:'0 0 40px', maxWidth:440 }}>{step.text}</p>
        {/* Bouton */}
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

function PhaseEvaluate({ ritual, need, isMobile, onEval, onClose }) {
  const { g1, g2, glow } = need
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
        <button onClick={() => onEval(true)} style={{
          flex:1, padding:'20px 0', borderRadius:20, border:'2px solid rgba(80,180,100,0.25)', cursor:'pointer',
          background:'rgba(80,200,100,0.08)', transition:'all .18s ease',
          display:'flex', flexDirection:'column', alignItems:'center', gap:8,
        }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(80,200,100,0.18)'; e.currentTarget.style.borderColor='rgba(80,180,100,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(80,200,100,0.08)'; e.currentTarget.style.borderColor='rgba(80,180,100,0.25)' }}
        >
          <span style={{ fontSize:36 }}>💚</span>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:600, color:'#2a6a30' }}>J'aime</span>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:'rgba(50,35,20,0.45)' }}>Ce rituel me convient</span>
        </button>
        <button onClick={() => onEval(false)} style={{
          flex:1, padding:'20px 0', borderRadius:20, border:'2px solid rgba(200,80,80,0.22)', cursor:'pointer',
          background:'rgba(200,80,80,0.07)', transition:'all .18s ease',
          display:'flex', flexDirection:'column', alignItems:'center', gap:8,
        }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(200,80,80,0.15)'; e.currentTarget.style.borderColor='rgba(200,80,80,0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(200,80,80,0.07)'; e.currentTarget.style.borderColor='rgba(200,80,80,0.22)' }}
        >
          <span style={{ fontSize:36 }}>🔴</span>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:600, color:'#8a2a2a' }}>Pas pour moi</span>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:'rgba(50,35,20,0.45)' }}>Proposer un autre</span>
        </button>
      </div>
    </div>
  )
}

// ─── Phase : résultat + Ma Fleur ─────────────────────────────────────────────

function PhaseResult({ ritual, need, liked, isMobile, onSeeFlower, onClose }) {
  const { g1, g2, glow } = need
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: isMobile ? '32px 24px' : '40px 48px', textAlign:'center', animation:'rs_eval .4s ease both' }}>
      {/* Fleur animée */}
      <div style={{ fontSize: isMobile ? 80 : 100, marginBottom:16, animation:'rs_fleur .6s cubic-bezier(.34,1.56,.64,1) both' }}>🌸</div>

      <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 30 : 40, fontWeight:400, color:'#2A1F18', margin:'0 0 10px', lineHeight:1.2 }}>
        {liked ? 'Votre fleur s\'épanouit !' : 'Merci pour votre retour !'}
      </h2>
      <p style={{ fontFamily:"'Jost',sans-serif", fontSize: isMobile ? 15 : 16, color:'rgba(50,35,20,0.60)', margin:'0 0 10px', maxWidth:380, lineHeight:1.6 }}>
        {liked
          ? `Ce rituel "${ritual.title}" sera mémorisé pour vos prochaines sessions sur ce besoin.`
          : `Nous vous proposerons une alternative la prochaine fois pour "${need.label}".`
        }
      </p>
      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 16 : 18, fontStyle:'italic', color:`${g1}cc`, margin:'0 0 36px' }}>
        Prendre soin de soi, c'est déjà nourrir sa fleur.
      </p>

      {/* Boutons */}
      <div style={{ display:'flex', flexDirection:'column', gap:12, width:'100%', maxWidth:340 }}>
        <button
          onClick={onSeeFlower}
          style={{ padding:'17px 0', borderRadius:100, border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:17, fontWeight:700, color:'#fff', background:`linear-gradient(135deg,${g1},${g2})`, boxShadow:`0 10px 28px ${glow}`, transition:'transform .18s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform='none'}
        >
          🌸 Voir ma fleur évoluer
        </button>
        <button
          onClick={onClose}
          style={{ padding:'14px 0', borderRadius:100, cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:500, color:'rgba(50,35,20,0.55)', background:'rgba(255,255,255,0.60)', border:'1px solid rgba(180,160,140,0.28)' }}
        >
          Fermer
        </button>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function RitualSuggestionModal({ need, onBack, onClose, onSeeFlower, onCompleteRitual }) {
  const isMobile = useIsMobile()
  const [phase, setPhase] = useState('view')   // 'view' | 'doing' | 'evaluate' | 'result'
  const [liked, setLiked] = useState(null)
  const ritual = RITUALS[need.id]
  if (!ritual) return null

  const { g1, g2, glow } = need
  const bg = 'radial-gradient(circle at 50% 18%, #f5efe6, #e8dfd2 58%, #e0d4c0)'

  function handleEval(isLiked) {
    setLiked(isLiked)
    onCompleteRitual?.(need.id, isLiked)
    setPhase('result')
  }

  const inner = (
    <div style={{ position:'relative', zIndex:1, width:'100%', height:'100%', background:bg, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Halos */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-10%', left:'-8%', width:400, height:400, borderRadius:'50%', background:`radial-gradient(circle,${g1}14 0%,transparent 65%)` }}/>
        <div style={{ position:'absolute', bottom:'-8%', right:'-8%', width:320, height:320, borderRadius:'50%', background:`radial-gradient(circle,${g2}12 0%,transparent 65%)` }}/>
      </div>

      {phase === 'view' && (
        <PhaseView ritual={ritual} need={need} isMobile={isMobile}
          onStart={() => setPhase('doing')} onBack={onBack} onClose={onClose}/>
      )}
      {phase === 'doing' && (
        <PhaseDoing ritual={ritual} need={need} isMobile={isMobile}
          onDone={() => setPhase('evaluate')} onClose={onClose}/>
      )}
      {phase === 'evaluate' && (
        <PhaseEvaluate ritual={ritual} need={need} isMobile={isMobile}
          onEval={handleEval} onClose={onClose}/>
      )}
      {phase === 'result' && (
        <PhaseResult ritual={ritual} need={need} liked={liked} isMobile={isMobile}
          onSeeFlower={onSeeFlower ?? onClose} onClose={onClose}/>
      )}
    </div>
  )

  if (!isMobile) return (
    <>
      <style>{CSS}</style>
      <div style={{ position:'fixed', inset:0, zIndex:270, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div onClick={phase === 'view' ? onClose : undefined} style={{ position:'absolute', inset:0, background:'rgba(20,12,5,0.55)', backdropFilter:'blur(8px)' }}/>
        <div style={{ position:'relative', zIndex:1, width:'min(680px, 95vw)', maxHeight:'92vh', borderRadius:24, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.32)' }}>
          {inner}
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{CSS}</style>
      <div style={{ position:'fixed', inset:0, zIndex:270 }}>{inner}</div>
    </>
  )
}
