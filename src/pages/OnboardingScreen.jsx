// src/pages/OnboardingScreen.jsx
import { useState, useEffect, useRef } from 'react'
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
    body: 'Il ne crie pas. Il s\'installe doucement — une fatigue qui ne part plus, une irritabilité qui grandit, un élan qui s\'efface. Le stress d\'usure s\'accumule en silence, sans que l\'on s\'en rende vraiment compte.',
    bodyDesktop: 'Il ne crie pas. Il ne se voit pas. Il s\'installe comme de l\'eau qui monte — doucement, régulièrement, sans signal d\'alarme. Une fatigue qui ne part plus après le week-end. Une irritabilité qui surprend. Un élan qui s\'efface sans raison apparente. Le stress d\'usure ne ressemble pas au stress qu\'on imagine. Il est subtil, patient, et souvent confondu avec la "normale".',
    highlight: 'Il touche 7 personnes sur 10 dans leur vie quotidienne.',
    extra: [
      { value: '7 / 10', label: 'personnes touchées', sub: 'dans leur quotidien' },
      { value: '2 à 3 ans', label: 'avant d\'en prendre conscience', sub: 'en moyenne' },
      { value: '64 %', label: 'pensent que c\'est normal', sub: 'de se sentir ainsi' },
    ],
    color: '#9ab8c8', visual: 'wave',
  },
  {
    id: 'spectrum', tag: 'Comprendre',
    title: 'D\'où vient\nle stress d\'usure ?',
    body: 'Entre le stress qui nous dynamise et celui qui nous brise, il en existe un troisième — plus discret, plus insidieux. C\'est celui qui vous a amené ici.',
    bodyDesktop: 'Tous les stress ne se ressemblent pas. Il en existe trois grandes familles — et comprendre laquelle vous concerne change tout à la façon d\'y répondre.',
    bullets: [
      { icon: '💥', label: 'Le stress traumatique', desc: 'Intense et visible, il déclenche une réaction immédiate — et pousse habituellement à consulter.',
        descDesktop: 'Un choc, une perte, un événement brutal. Il est douloureux mais identifiable — on sait d\'où il vient, on sait qu\'on a besoin d\'aide. Le corps et l\'esprit réagissent fort, vite.' },
      { icon: '🌊', label: 'Le stress d\'usure', desc: 'Il s\'accumule en silence. Ni assez fort pour alerter, ni assez faible pour disparaître. Il érode sans prévenir.',
        descDesktop: 'C\'est la zone grise. Trop discret pour alarmer, trop présent pour être ignoré. Il s\'installe dans la durée, ronge l\'énergie, efface les envies. On s\'adapte... jusqu\'à ce qu\'on ne puisse plus.' },
      { icon: '⚡', label: 'Le bon stress', desc: 'Court et ciblé, il nous met en mouvement et nous aide à nous dépasser. C\'est le moteur de l\'action.',
        descDesktop: 'Avant une présentation, avant un défi sportif — il accélère le cœur, aiguise les sens. Court et ciblé, il est utile. C\'est lui qui nous fait avancer. Le problème : quand il ne s\'arrête plus.' },
    ],
    color: '#9ab8b0', visual: 'spectrum',
  },
  {
    id: 'impact', tag: 'L\'impact quotidien',
    title: 'Ce que le stress d\'usure change en vous',
    heroImage: '/stress3.png',
    heroPosition: 'center center',
    body: 'Le stress d\'usure ne reste pas dans votre tête. Il déborde — dans votre espace, vos habitudes, vos relations. Souvent sans que vous le remarquiez.',
    bodyDesktop: 'Le stress d\'usure ne reste pas dans votre tête. Il déborde partout — dans votre espace, vos habitudes, votre énergie relationnelle. Et parce qu\'il agit lentement, on finit par croire que c\'est devenu normal.',
    bullets: [
      { label: 'Votre espace se désorganise', desc: 'L\'état intérieur se reflète dans l\'environnement extérieur. Le désordre s\'installe sans qu\'on trouve l\'énergie d\'agir.', example: '→ "Je vais ranger ça ce soir." Ce soir ne vient jamais.',
        descDesktop: 'L\'ordre extérieur demande de l\'énergie intérieure. Quand le réservoir est vide, c\'est l\'environnement qui trinque en premier. Le désordre s\'installe — pas par paresse, mais par épuisement.' },
      { label: 'Vos rituels protecteurs disparaissent', desc: 'Le sport, les sorties, le sommeil régulier — les habitudes ressourçantes sont les premières sacrifiées.', example: '→ "Je n\'ai plus le temps de faire du sport depuis des mois."',
        descDesktop: 'Paradoxe cruel : ce qui nous ferait du bien disparaît en premier. Le sport, la cuisine maison, les moments de calme — ce sont exactement les activités qu\'on abandonne quand on en aurait le plus besoin.' },
      { label: 'Votre élan intérieur s\'étiole', desc: 'La motivation baisse, les plaisirs s\'effacent, on fait ce qu\'il faut sans vraiment y être.', example: '→ "Je fais les choses en automatique. Je ne sais plus ce que je veux."',
        descDesktop: 'Ce n\'est pas de la dépression, ce n\'est pas de la flemme. C\'est une batterie qui se vide. On continue à fonctionner — mais en mode économie d\'énergie. Les projets attendent. Les envies se taisent.' },
    ],
    color: '#7a9ab8', visual: 'impact',
  },
  {
    id: 'freins', tag: 'Pourquoi on attend',
    title: 'Trois raisons pour\nlesquelles on ne fait rien',
    bullets: [
      { icon:'⏱', label: 'Pas le temps', desc: '"Je le ferai quand j\'aurai un moment." Ce moment n\'arrive jamais.',
        descDesktop: '"Je le ferai quand les enfants seront plus grands. Quand ce projet sera terminé. Quand les vacances arriveront." Le problème : ce moment idéal n\'existe pas. Il faut créer l\'espace, pas l\'attendre.' },
      { icon:'👁', label: 'Pas visible', desc: 'Le bien-être intérieur ne se mesure pas dans un miroir.',
        descDesktop: 'On va chez le médecin pour une douleur physique. Mais un épuisement intérieur ? On le minimise. On se dit qu\'on exagère. Pourtant, ce qu\'on ne voit pas peut faire autant de dégâts — sinon plus.' },
      { icon:'📅', label: 'Pas immédiat', desc: 'On abandonne souvent avant de percevoir les bénéfices.',
        descDesktop: 'Le cerveau préfère la récompense immédiate. Les bénéfices du mieux-être, eux, s\'installent progressivement — comme une plante qui pousse. On abandonne souvent trop tôt, juste avant que ça commence à vraiment changer.' },
    ],
    highlightDesktop: { text: 'La bonne nouvelle ? Vous n\'avez pas besoin d\'attendre le bon moment. Deux minutes suffisent pour commencer à changer la donne.', icon: '💡' },
    color: '#c89898', visual: 'barriers',
  },
  {
    id: 'ritualisation', tag: 'La science',
    title: 'Pourquoi la\nritualisation fonctionne',
    body: 'Répéter un geste simple active les mêmes circuits neuronaux chaque jour. Le cerveau apprend à anticiper ce moment de soin, il libère de la dopamine avant même que vous commenciez. Progressivement, le cortisol diminue en quelques semaines, la neuroplasticité s\'active, le cerveau se reconfigure positivement et un effet cumulatif s\'installe : chaque jour renforce votre stabilité et votre résilience.',
    bodyDesktop: 'Votre cerveau est une machine à habitudes. Quand vous répétez un geste au même moment, dans le même contexte, il crée un sillon neuronal — une autoroute qui se renforce à chaque passage. Au bout de quelques jours, il anticipe, libère de la dopamine avant même que vous commenciez. C\'est le secret des rituels : ils ne demandent plus d\'effort, ils deviennent automatiques.',
    mechanisms: [
      { num: '01', icon: '🧠', label: 'Dopamine', color: '#7aaa88', colorBg: 'rgba(122,170,136,0.10)', sub: 'Dès J+3', detail: 'Le cerveau anticipe le rituel et libère la dopamine avant même que vous commenciez. Chaque jour renforce cette récompense automatique.' },
      { num: '02', icon: '📉', label: 'Cortisol ↓', color: '#9ab8c8', colorBg: 'rgba(154,184,200,0.10)', sub: 'Après 3 semaines', detail: 'L\'hormone du stress diminue de façon mesurable. Le système nerveux apprend à se réguler plus vite face aux tensions.' },
      { num: '03', icon: '🌱', label: 'Neuroplasticité', color: '#c8a870', colorBg: 'rgba(200,168,112,0.10)', sub: 'Après 2 mois', detail: 'De nouveaux circuits neuronaux se forment. Votre cerveau se reconfigure littéralement — plus stable, plus résilient.' },
    ],
    color: '#7aaa88', visual: 'brain',
  },
  {
    id: 'benefices', tag: 'Ce qui vous attend',
    title: 'Des bénéfices\nconcrets et progressifs',
    timeline: [
      { period: 'Dès la 1ʳᵉ semaine', desc: 'Un sentiment de structure et de reprise de contrôle sur votre journée.',
        descDesktop: 'Un sentiment de structure apparaît. Vous reprenez le contrôle de votre journée. Ce petit geste quotidien devient un ancrage — quelque chose qui vous appartient.' },
      { period: 'Après 3 semaines', desc: 'Moins de réactivité émotionnelle, meilleure qualité de sommeil.',
        descDesktop: 'La réactivité émotionnelle diminue. Les petites choses agacent moins. Le sommeil s\'améliore. Vous commencez à remarquer des espaces de calme là où il n\'y en avait plus.' },
      { period: 'Après 2 mois', desc: 'Une résilience renforcée face aux imprévus du quotidien.',
        descDesktop: 'Une nouvelle baseline s\'installe. Vous rebondissez plus vite face aux imprévus. L\'élan revient — non pas comme avant, mais mieux : plus stable, plus ancré, plus vous.' },
    ],
    highlightDesktop: { text: 'Ces bénéfices sont documentés par la recherche en neurosciences et confirmés par des milliers de pratiquants. Ils ne dépendent pas de votre motivation du moment — juste de votre régularité.', icon: '🔬' },
    color: '#d4a0b0', visual: 'growth',
  },
  {
    id: 'promise', tag: 'Votre jardin',
    title: '2 minutes par jour\nsuffit pour commencer',
    body: 'Pas de performance. Pas d\'exigence. Juste un espace à vous, chaque jour, pour prendre soin de ce qui compte vraiment.',
    bodyDesktop: 'Pas de performance. Pas de programme à suivre à la lettre. Pas de culpabilité si vous ratez un jour. Juste un espace à vous — deux minutes, chaque jour — pour poser quelque chose de vrai. Ce n\'est pas grand chose. Et c\'est exactement pour ça que ça marche.',
    features: [
      { icon:'⚡', text: 'Des rituels de 2 à 5 minutes, à votre rythme',
        textDesktop: 'Des rituels de 2 à 5 minutes, conçus pour s\'intégrer dans votre vie telle qu\'elle est — pas telle que vous voudriez qu\'elle soit.' },
      { icon:'📊', text: 'Votre progression visible au quotidien',
        textDesktop: 'Votre progression visible jour après jour. Parce que voir que ça avance, même doucement, est ce qui donne envie de continuer.' },
      { icon:'🌿', text: 'Une plante qui grandit avec vous',
        textDesktop: 'Une fleur qui grandit avec vous — reflet vivant de votre engagement. Plus vous prenez soin d\'elle, plus elle révèle qui vous êtes.' },
    ],
    color: '#c8a870', visual: 'flower',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
//  INTRO GWENAËL — modal de présentation avant les slides
// ─────────────────────────────────────────────────────────────────────────────
function IntroGwenael({ onStart }) {
  const [phase, setPhase] = useState(0)
  const [muted, setMuted] = useState(true)
  const videoRef = useRef(null)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600)
    const t2 = setTimeout(() => setPhase(2), 1400)
    const t3 = setTimeout(() => setPhase(3), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const fade = (visible) => ({
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateY(0)' : 'translateY(10px)',
    transition: 'opacity 900ms ease, transform 900ms ease',
  })

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(160deg, #f8f0ec, #e8d8d0)',
      zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '8px 16px',
    }}>
      {/* ── Vidéo ── */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 24px 70px rgba(180,120,110,0.20)',
        position: 'relative',
      }}>
        <video
          ref={videoRef}
          src="/Accueil_lutin.mp4"
          autoPlay
          playsInline
          muted={muted}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        {/* ── Bouton CTA en overlay bas ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '48px 16px 16px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)',
          display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center',
          ...fade(phase >= 3),
          pointerEvents: phase >= 3 ? 'auto' : 'none',
        }}>
          <button
            onClick={() => {
              setMuted(false)
              if (videoRef.current) {
                videoRef.current.muted = false
                videoRef.current.currentTime = 0
                videoRef.current.play()
              }
            }}
            style={{
              width: 72, height: 72, borderRadius: 50,
              background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.5)',
              backdropFilter: 'blur(6px)',
              cursor: 'pointer', fontSize: 32, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
          >{muted ? '🔇' : '🔊'}</button>
          <button
            onClick={onStart}
            style={{
              width: '100%',
              fontFamily: 'Jost, sans-serif',
              fontSize: 15, fontWeight: 500, letterSpacing: '0.04em',
              color: '#fff',
              background: 'linear-gradient(135deg, #c8a0b0, #a07888)',
              border: 'none', borderRadius: 50, padding: '14px 24px',
              cursor: 'pointer', transition: 'transform 0.15s ease',
              boxShadow: '0 8px 24px rgba(160,100,120,0.4)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            Vous êtes prêt ? Allons-y ensemble...
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  STYLES — partagés HelpModal + slides
// ─────────────────────────────────────────────────────────────────────────────
export const ONB_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');

  /* ── Keyframes onboarding ── */
  @keyframes onbIn    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes onbOut   { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-14px)} }
  @keyframes onbPulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.08);opacity:1} }
  @keyframes onbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes growBar  { from{width:0} }
  @keyframes progressBar { from{width:0} to{width:100%} }
  @keyframes modalIn  { from{opacity:0;transform:translateY(14px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }

  /* ── Keyframes WOF (partagés avec WeekOneFlow) ── */
  @keyframes stepIn        { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes softRise      { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fleurFloat    { 0%,100%{transform:translateY(0) rotate(0deg)} 40%{transform:translateY(-8px) rotate(1.5deg)} 70%{transform:translateY(-4px) rotate(-0.8deg)} }
  @keyframes bloom         { from{opacity:0;transform:scale(.25) rotate(-25deg)} 65%{opacity:1;transform:scale(1.08) rotate(3deg)} to{opacity:1;transform:scale(1) rotate(0deg)} }
  @keyframes petalIn       { from{opacity:0;transform:scale(.3)} to{opacity:1;transform:scale(1)} }
  @keyframes breathe       { 0%,100%{transform:scale(1);opacity:.55} 50%{transform:scale(1.55);opacity:1} }
  @keyframes mosaicBloom   { 0%{transform:scale(.88);opacity:.6;filter:brightness(.7)} 55%{transform:scale(1.05);opacity:1;filter:brightness(1.08)} 100%{transform:scale(1);opacity:1;filter:brightness(1)} }
  @keyframes mosaicPulse   { 0%,100%{box-shadow:0 0 0 0 transparent} 50%{box-shadow:0 0 32px 8px rgba(200,160,112,.35)} }
  @keyframes particleFloat   { 0%{transform:translateY(0) scale(1);opacity:0} 15%{opacity:1} 85%{opacity:.8} 100%{transform:translateY(-80px) scale(.5);opacity:0} }
  @keyframes particleTwinkle { 0%,100%{opacity:.2;transform:scale(.8)} 50%{opacity:1;transform:scale(1.3)} }

  /* ── Classes utilitaires ── */
  .onb-in   { animation: onbIn   .4s cubic-bezier(.22,1,.36,1) both }
  .onb-out  { animation: onbOut  .28s ease both }
  .wof-soft { animation: softRise 900ms cubic-bezier(.25,.46,.45,.94) both }
  .wof-in   { animation: stepIn  400ms ease both }
  .wof-fl   { animation: fleurFloat 6s ease-in-out infinite }

  /* ── Particule luciole ── */
  .spark {
    position: absolute; width: 6px; height: 6px; border-radius: 50%;
    background: radial-gradient(circle, #ffe88a 0%, #ffb830 60%, transparent 100%);
    pointer-events: none;
    animation: particleTwinkle var(--dur, 2s) ease-in-out var(--delay, 0s) infinite,
               particleFloat   var(--fdur, 4s) ease-in-out var(--delay, 0s) infinite;
  }

  /* ── Modal desktop ── */
  .onb-backdrop {
    position: absolute; inset: 0; z-index: 1;
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }
  .onb-modal {
    width: min(960px, 97vw); height: calc(100vh - 16px);
    border-radius: 24px; background: #faf5f2;
    box-shadow: 0 24px 70px rgba(180,120,110,.20), 0 0 0 1px rgba(200,160,150,.15);
    display: flex; flex-direction: column; overflow: hidden;
    animation: modalIn .4s cubic-bezier(.22,1,.36,1) both;
    position: relative;
    /* Force les variables de couleur sur fond clair */
    --text:  #1a1208;
    --text2: rgba(35,25,12,0.78);
    --bg:    #faf5f2;
    color: #1a1208;
  }
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

  if (slide.visual === 'spectrum') return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
      {/* Cylindre + labels */}
      <div style={{ position:'relative', display:'flex', alignItems:'center', gap:0 }}>

        {/* Labels gauche */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', marginRight:14, gap:0 }}>
          {[
            { label:'Stress\nTraumatique', color:'#c0392b', top:0,   height:90 },
            { label:'Stress\nd\'usure',    color:'#e07020', top:90,  height:100 },
            { label:'Bon\nStress',         color:'#27ae60', top:190, height:110 },
          ].map(({ label, color }, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, paddingBottom: i<2 ? 8 : 0, animation:`onbIn .5s ease ${i*0.2}s both` }}>
              <div style={{ textAlign:'right' }}>
                {label.split('\n').map((l,j) => (
                  <div key={j} style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'var(--fs-h4,13px)', fontWeight:700, color, lineHeight:1.3, whiteSpace:'nowrap' }}>{l}</div>
                ))}
              </div>
              {/* Flèche */}
              <div style={{ display:'flex', alignItems:'center', gap:0 }}>
                <div style={{ width:20, height:1.5, background:color }} />
                <div style={{ width:0, height:0, borderTop:'4px solid transparent', borderBottom:'4px solid transparent', borderLeft:`6px solid ${color}` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Cylindre */}
        <div style={{ position:'relative', width:72, flexShrink:0 }}>
          {/* Explosion au sommet */}
          <div style={{ position:'absolute', top:-32, left:'50%', transform:'translateX(-50%)', width:80, height:44, animation:'onbPulse 2s ease-in-out infinite' }}>
            {[
              { w:3, h:22, rot:0,   l:38, t:0,  color:'#c0392b' },
              { w:3, h:18, rot:30,  l:52, t:4,  color:'#e05020' },
              { w:3, h:18, rot:-30, l:22, t:4,  color:'#e05020' },
              { w:2, h:14, rot:55,  l:62, t:12, color:'#e08020' },
              { w:2, h:14, rot:-55, l:12, t:12, color:'#e08020' },
              { w:2, h:10, rot:75,  l:70, t:20, color:'#e0a020' },
              { w:2, h:10, rot:-75, l:4,  t:20, color:'#e0a020' },
            ].map((s, i) => (
              <div key={i} style={{
                position:'absolute', left:s.l, top:s.t,
                width:s.w, height:s.h,
                background:s.color,
                borderRadius:2,
                transformOrigin:'bottom center',
                transform:`rotate(${s.rot}deg)`,
                animation:`onbFloat ${1.5+i*0.15}s ease-in-out ${i*0.1}s infinite`,
                opacity:.9,
              }} />
            ))}
            {/* Halo explosion */}
            <div style={{ position:'absolute', left:'50%', top:'60%', transform:'translate(-50%,-50%)', width:28, height:28, borderRadius:'50%', background:'radial-gradient(circle, #ffcc00 0%, #e04000 60%, transparent 100%)', animation:'onbPulse 1.8s ease-in-out infinite' }} />
          </div>

          {/* Corps du cylindre — 3 zones */}
          <div style={{ borderRadius:'36px 36px 4px 4px', overflow:'hidden', boxShadow:'4px 8px 24px rgba(0,0,0,.20), inset -8px 0 16px rgba(0,0,0,.15), inset 4px 0 8px rgba(255,255,255,.25)', animation:`onbIn .6s ease both` }}>
            {/* Zone rouge — traumatique */}
            <div style={{ height:88, background:'linear-gradient(180deg, #c0392b 0%, #e03a1a 40%, #e05a10 100%)', position:'relative' }}>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(255,255,255,.12) 0%, transparent 40%, rgba(0,0,0,.08) 100%)' }} />
            </div>
            {/* Séparateur */}
            <div style={{ height:2, background:'rgba(255,255,255,.35)' }} />
            {/* Zone orange — usure */}
            <div style={{ height:98, background:'linear-gradient(180deg, #e05a10 0%, #e07020 40%, #e8a020 100%)', position:'relative' }}>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(255,255,255,.12) 0%, transparent 40%, rgba(0,0,0,.08) 100%)' }} />
            </div>
            {/* Séparateur */}
            <div style={{ height:2, background:'rgba(255,255,255,.35)' }} />
            {/* Zone verte — bon stress */}
            <div style={{ height:108, background:'linear-gradient(180deg, #e8a020 0%, #8bc34a 30%, #27ae60 100%)', position:'relative' }}>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(255,255,255,.12) 0%, transparent 40%, rgba(0,0,0,.08) 100%)' }} />
            </div>
          </div>
          {/* Reflet fond */}
          <div style={{ height:10, background:'radial-gradient(ellipse, rgba(39,174,96,.35) 0%, transparent 70%)', marginTop:2 }} />
        </div>
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

      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(28px,3.5vw,48px)', fontWeight:300, lineHeight:1.15, color:'var(--text)', marginBottom:28, whiteSpace: isMobile ? 'pre-line' : 'nowrap', letterSpacing:'-0.01em' }}>
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
export function NatureBg() {
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
function ModalShell({ children, onClick, wide = false, cardStyle = {} }) {
  const isMobile = window.innerWidth < 768
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, fontFamily:"'Jost',sans-serif" }}>
      <style>{ANIM_STEPS}</style>
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
          '--text':      '#1a1208',
          '--text2':     'rgba(35,25,12,0.78)',
          '--text3':     '#1a1208',
          '--gold-warm': '#8a6010',
          color: '#1a1208',
          ...cardStyle,
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
    <ModalShell cardStyle={{
      backgroundImage: "url('/champs.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      '--text': '#fff',
      '--text2': 'rgba(255,255,255,0.88)',
      '--text3': '#fff',
      '--gold-warm': '#ffe0a0',
      color: '#fff',
    }}>
      {/* Overlay dégradé pour lisibilité */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg, rgba(20,10,5,0.45) 0%, rgba(10,5,2,0.55) 100%)', pointerEvents:'none', borderRadius:'inherit' }}/>

      <div style={{ position:'relative', zIndex:1, padding:'40px 32px', display:'flex', flexDirection:'column', alignItems:'center', height:'100%' }}>
        <div style={{ maxWidth:400, width:'100%' }}>

        <div className="s1" style={{ textAlign:'center', marginBottom:32 }}>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(20px,3.5vw,28px)', fontWeight:400, lineHeight:1.2, color:'var(--text)', marginBottom:8 }}>
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
                background: sel ? 'rgba(255,220,130,0.22)' : 'rgba(255,255,255,0.12)',
                border: sel
                  ? '2px solid rgba(255,210,100,0.80)'
                  : '2px solid rgba(255,255,255,0.30)',
                backdropFilter: 'blur(6px)',
                cursor:'pointer', textAlign:'left',
                boxShadow: sel ? '0 3px 18px rgba(220,170,60,0.30)' : 'none',
                transform: sel ? 'translateX(4px)' : 'none',
                transition:'all .2s ease', fontFamily:"'Jost',sans-serif",
              }}
                onMouseEnter={e => { if (!sel) { e.currentTarget.style.background='rgba(255,255,255,0.20)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.50)' } }}
                onMouseLeave={e => { if (!sel) { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.30)' } }}
              >
                <span style={{ fontSize:22, flexShrink:0, lineHeight:1 }}>{item.icon}</span>
                <span style={{ fontSize:22, flexShrink:0, lineHeight:1 }}></span>
                <span style={{
                  fontSize:'var(--fs-h4,14px)', fontWeight: sel ? 600 : 400,
                  color: sel ? '#ffe8a0' : 'rgba(255,255,255,0.92)',
                  lineHeight:1.5, flex:1, transition:'color .2s',
                }}>{item.label}</span>
                <span style={{
                  width:22, height:22, borderRadius:'50%', flexShrink:0,
                  border: sel ? 'none' : '2px solid rgba(255,255,255,0.45)',
                  background: sel ? 'rgba(255,200,80,0.90)' : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, color:'#2a1a00', fontWeight:700,
                  transition:'all .2s',
                }}>
                  {sel ? '✓' : ''}
                </span>
              </button>
            )
          })}
        </div>

        <div className="s5" style={{ textAlign:'center', marginTop:24 }}>
          <button onClick={() => onSelect(null)} style={{
            background:'none', border:'1px solid rgba(255,255,255,0.35)', borderRadius:50,
            cursor:'pointer', fontSize:'var(--fs-h5,12px)', color:'rgba(255,255,255,0.75)',
            fontFamily:"'Jost',sans-serif", letterSpacing:'.04em',
            padding:'8px 20px',
            transition:'border-color .2s, color .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.70)'; e.currentTarget.style.color='#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.35)'; e.currentTarget.style.color='rgba(255,255,255,0.75)' }}
          >
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
  const isMobile = window.innerWidth < 768

  return (
    <ModalShell>
      <div style={{ display:'flex', flexDirection:'column', width:'100%', height:'100%' }}>

        {/* Titre */}
        <div className="s0" style={{ padding: isMobile ? '18px 20px 10px' : '24px 32px 16px', textAlign:'center', flexShrink:0 }}>
          <h2 style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize: isMobile ? 32 : 36,
            fontWeight:300, lineHeight:1.2,
            color:'rgba(30,25,15,0.92)', margin:0,
          }}>
            Votre fleur,{' '}
            <em style={{ color:'#b07888', fontStyle:'italic' }}>votre miroir intérieur</em>
          </h2>
        </div>

        {/* Image */}
        <div style={{
          width:'100%',
          height:'clamp(220px, 45vh, 420px)',
          position:'relative',
          overflow:'hidden',
          flexShrink:0,
        }}>
          <img
            src="/miroir2.png"
            alt=""
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}
          />
          {/* Fondu haut et bas */}
          <div style={{
            position:'absolute', inset:0,
            background:'linear-gradient(to bottom, #faf5f2 0%, transparent 18%, transparent 82%, #faf5f2 100%)',
            pointerEvents:'none',
          }}/>
        </div>

        {/* Texte + bouton */}
        <div style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize: isMobile ? 19 : 20,
          fontWeight:300, lineHeight:1.7,
          textAlign:'center', color:'#000',
          padding: isMobile ? '0 20px' : '0 32px',
          margin: isMobile ? '8px 0 20px' : '10px 0 28px',
          maxWidth:500, alignSelf:'center',
        }}>
          <p style={{ margin: isMobile ? '0 0 16px' : '0 0 20px' }}>
            Dans Mon Jardin Intérieur, une fleur devient le reflet de votre état émotionnel.
            Elle grandit quand vous prenez soin de vous.
            Elle vous rappelle, chaque jour, que vous méritez cette attention.
          </p>
          <button onClick={onNext} style={{
            padding: isMobile ? '13px 32px' : '15px 40px', borderRadius:50, border:'none',
            background:'linear-gradient(135deg, #c8a0b0, #a07888)',
            color:'#fff', fontSize: isMobile ? 17 : 15, fontWeight:600,
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
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(18px,3vw,26px)', fontWeight:300, lineHeight:1.2, color:'var(--text)', marginBottom:5 }}>
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
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(18px,4vw,26px)', fontWeight:300, lineHeight:1.35, color:'var(--text)', marginBottom:8 }}>
            En ce moment,<br/>
            <span style={{ color:'var(--green)', fontWeight:400 }}>
              {count !== null ? count : '...'} {count !== null ? (count === 1 ? 'personne cultive' : 'personnes cultivent') : ''}
            </span>
            {count !== null && <><br/>leur jardin intérieur dans notre communauté.</>}
          </h2>
          <p style={{ fontSize:'var(--fs-h4,13px)', color:'var(--text3)', fontStyle:'italic', lineHeight:1.8 }}>
            Pas de noms, pas de paroles intrusives,<br/> pas de réseaux bruyants,<br/>Juste une présence partagée, <br/>une intention de bienveillance.
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', fontFamily:"'Jost',sans-serif" }}>
      <style>{ONB_STYLES}</style>

      {/* Image hero pleine largeur — occupe ~38% de la hauteur */}
      <div style={{
        flexShrink:0, height: isMobile ? '36%' : '40%', position:'relative', overflow:'hidden',
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

        {/* Personnage en overlay hero — mobile uniquement */}
        {isMobile && (() => {
          const charMap = { benefices:'/instructeur3.png', promise:'/zen.png' }
          const src = charMap[slide.id]
          if (!src) return null
          const isLeft = slide.id === 'benefices'
          const isFloat = slide.id === 'promise'
          return (
            <img src={src} alt="" style={{
              position:'absolute', bottom:0, [isLeft ? 'left' : 'right']:'4%',
              height:'92%', width:'auto', objectFit:'contain', objectPosition:'bottom center',
              pointerEvents:'none', zIndex:2,
              filter:'drop-shadow(0 4px 16px rgba(0,0,0,0.18))',
              animation: isFloat ? 'onbFloat 4s ease-in-out infinite' : undefined,
            }}/>
          )
        })()}

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
        flex:1, minHeight:0, display:'flex', flexDirection:'column',
        padding: isMobile ? '16px 24px 0' : '20px 40px 0',
        opacity: leaving ? 0 : 1,
        transform: leaving ? 'translateY(-8px)' : 'none',
        transition:'opacity .28s ease, transform .28s ease',
      }}>

        {(slide.id === 'stress' || slide.id === 'freins' || slide.id === 'benefices' || slide.id === 'promise' || slide.id === 'spectrum') ? (
          /* ── Layout 2 colonnes ── */
          <>
          {/* Titre pleine largeur au-dessus des colonnes */}
          <h2 style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize: isMobile ? 'clamp(22px,6vw,32px)' : 'clamp(26px,3vw,40px)',
            fontWeight: (slide.id === 'stress' || slide.id === 'benefices') ? 300 : 400,
            lineHeight:1.1, color:'var(--text)',
            marginBottom: slide.id === 'benefices' ? 40 : (isMobile ? 8 : 12),
            whiteSpace: isMobile ? 'pre-line' : 'nowrap',
            letterSpacing:'-0.01em', flexShrink:0,
          }}>{slide.title}</h2>
          <div style={{ flex:1, minHeight:0, display:'flex', flexDirection: isMobile ? 'column' : 'row', gap:0, overflow: isMobile ? 'auto' : 'hidden', WebkitOverflowScrolling:'touch' }}>

            {/* Colonne gauche — masquée sur mobile pour les slides image-only */}
            {/* Colonne gauche : image pour stress/benefices, texte pour freins/promise/spectrum */}
            <div style={{
              flex: isMobile ? '1 1 auto' : (slide.id === 'stress' || slide.id === 'benefices') ? '0 0 40%' : '0 0 70%',
              position:'relative', zIndex:2,
              display: (isMobile && (slide.id === 'stress' || slide.id === 'benefices')) ? 'none' : 'flex',
              flexDirection:'column',
              overflowX: 'hidden',
              overflowY: (slide.id === 'freins' || slide.id === 'promise' || slide.id === 'spectrum') ? 'auto' : 'hidden',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: (slide.id === 'freins' || slide.id === 'promise' || slide.id === 'spectrum') ? (isMobile ? 12 : 16) : 0,
              direction: (!isMobile && (slide.id === 'freins' || slide.id === 'promise' || slide.id === 'spectrum')) ? 'rtl' : undefined,
            }}>
              {(slide.id === 'freins' || slide.id === 'promise' || slide.id === 'spectrum') && (
                <div style={{ direction:'ltr', display:'flex', flexDirection:'column', gap: isMobile ? 8 : 10, position:'relative' }}>
                  {slide.id === 'impact' && (
                    <img
                      src="/stress3.png"
                      alt=""
                      style={{ width:'100%', borderRadius:10, objectFit:'cover', maxHeight: isMobile ? 110 : 130, marginBottom:4, boxShadow:'0 4px 14px rgba(0,0,0,0.10)' }}
                    />
                  )}
                  {slide.bullets && (
                    <div style={{ display:'flex', flexDirection:'column', gap:6, position:'relative', zIndex:1, width: (isMobile && slide.id === 'spectrum') ? '70%' : '100%' }}>
                      {slide.bullets.map((b,i) => {
                        const bc = slide.id === 'spectrum'
                          ? ['#c0392b','#e07020','#27ae60'][i]
                          : c
                        return (
                          <div key={i} style={{ display:'flex', gap:0, alignItems:'stretch', borderRadius:12, overflow:'hidden', background:'rgba(255,255,255,0.65)', border:'1px solid rgba(0,0,0,0.09)', boxShadow:'0 2px 6px rgba(0,0,0,0.04)', animation:`onbIn .4s ease ${i*.12+.1}s both` }}>
                            <div style={{ width:4, flexShrink:0, background:bc }}/>
                            <div style={{ width:40, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:`${bc}12`, borderRight:'1px solid rgba(0,0,0,0.06)' }}>
                              {slide.id === 'spectrum'
                                ? <div style={{ width:14, height:14, borderRadius:'50%', background:bc, boxShadow:`0 0 0 3px ${bc}30` }}/>
                                : <span style={{ fontSize:18 }}>{b.icon}</span>
                              }
                            </div>
                            <div style={{ padding:'9px 12px', flex:1 }}>
                              <div style={{ fontSize:'var(--fs-h4,12px)', fontWeight:700, color: slide.id === 'spectrum' ? bc : 'rgba(30,25,15,0.90)', marginBottom:2 }}>{b.label}</div>
                              <div style={{ fontSize:'var(--fs-h5,11px)', fontWeight:300, color:'rgba(30,25,15,0.80)', lineHeight:1.55 }}>{b.descDesktop || b.desc}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {isMobile && slide.id === 'spectrum' && (
                    <img src="/stress2.png" alt="" style={{
                      position:'absolute', top:'5%', right:'-4%',
                      width:'52%', objectFit:'contain', display:'block',
                      zIndex:0, opacity:0.85,
                      filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.10))',
                      pointerEvents:'none',
                    }}/>
                  )}
                  {slide.features && (
                    <>
                      <p style={{ fontSize: isMobile ? 'var(--fs-h4,14px)' : 'var(--fs-h3,15px)', fontWeight:300, color:'var(--text2)', lineHeight:1.7, margin:'0 0 10px' }}>{slide.bodyDesktop || slide.body}</p>
                      <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                        {slide.features.map((f,i) => (
                          <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 14px', borderRadius:12, background:'rgba(255,255,255,0.65)', border:'1px solid rgba(0,0,0,0.08)', boxShadow:'0 2px 6px rgba(0,0,0,0.04)', animation:`onbIn .4s ease ${i*.1+.1}s both` }}>
                            <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:`${c}18`, border:`1.5px solid ${c}35`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{f.icon}</div>
                            <span style={{ fontSize:'var(--fs-h4,13px)', fontWeight:400, color:'rgba(30,25,15,0.92)', lineHeight:1.4 }}>{f.textDesktop || f.text}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              {slide.id === 'stress' && !isMobile && (
                <img src="/stress1.png" alt="" style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'bottom center', marginLeft:'-20%' }}/>
              )}
              {slide.id === 'benefices' && !isMobile && (
                <img src="/instructeur3.png" alt="" style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'bottom center', transform:'translateY(40px)' }}/>
              )}
            </div>

            {/* Colonne droite */}
            <div style={{
              flex: isMobile ? '1 1 auto' : (slide.id === 'stress' || slide.id === 'benefices') ? '0 0 70%' : '0 0 40%',
              marginLeft: isMobile ? 0 : '-10%',
              position:'relative', zIndex:1, display:'flex',
              alignItems: (slide.id === 'stress' || slide.id === 'benefices') ? 'flex-start' : (slide.id === 'promise' || slide.id === 'spectrum') ? 'center' : 'flex-end',
              justifyContent:'center',
              overflowX: 'hidden',
              overflowY: (slide.id === 'stress' || slide.id === 'benefices') ? (isMobile ? 'visible' : 'auto') : (isMobile ? 'visible' : 'hidden'),
              WebkitOverflowScrolling: 'touch',
            }}>
              {slide.id === 'spectrum' && !isMobile && (
                <img src="/stress2.png" alt="" style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'center bottom' }}/>
              )}
              {slide.id === 'freins' && !isMobile && (
                <img src="/instructeur2.png" alt="" style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'bottom center', transform:'translateY(40px)' }}/>
              )}
              {slide.id === 'promise' && !isMobile && (
                <img src="/zen.png" alt="" style={{ width:'100%', height:'auto', objectFit:'contain', display:'block', marginLeft:'20%', animation:'onbFloat 4s ease-in-out infinite' }}/>
              )}
              {slide.id === 'stress' && (
                <div style={{ display:'flex', flexDirection:'column', overflowY:'auto', WebkitOverflowScrolling:'touch', width:'100%', height:'100%' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap: isMobile ? 8 : 10, paddingBottom: isMobile ? 8 : 12 }}>
                    <p style={{ fontSize: isMobile ? 'var(--fs-h4,14px)' : 'var(--fs-h3,15px)', fontWeight:400, color:'var(--text2)', lineHeight:1.7, margin:0 }}>{slide.bodyDesktop || slide.body}</p>
                    {slide.highlight && (
                      <div style={{ padding:'12px 16px', borderRadius:12, background:`${c}10`, border:`1px solid ${c}25`, fontSize:'var(--fs-h4,13px)', fontWeight:500, color:c, lineHeight:1.5 }}>
                         {slide.highlight}
                      </div>
                    )}
                  </div>
                  {isMobile && (
                    <img src="/stress1.png" alt="" style={{ marginTop:'auto', width:'70%', alignSelf:'center', objectFit:'contain', display:'block', filter:'drop-shadow(0 4px 16px rgba(0,0,0,0.15))' }}/>
                  )}
                </div>
              )}
              {slide.id === 'benefices' && (
                <div style={{ display:'flex', flexDirection:'column', overflowY:'auto', WebkitOverflowScrolling:'touch', paddingBottom: isMobile ? 12 : 16, width:'100%' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                    {slide.timeline.map((t,i) => (
                      <div key={i} style={{ display:'flex', gap:0, alignItems:'stretch', animation:`onbIn .4s ease ${i*.14+.1}s both` }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:28, flexShrink:0, paddingTop:4 }}>
                          <div style={{ width:12, height:12, borderRadius:'50%', flexShrink:0, background:c, border:`3px solid ${c}30` }}/>
                        </div>
                        <div style={{ flex:1, paddingLeft:14, paddingBottom: i < slide.timeline.length-1 ? 16 : 0 }}>
                          <div style={{ display:'inline-block', fontSize:'var(--fs-h5,10px)', fontWeight:700, color:c, letterSpacing:'.08em', textTransform:'uppercase', padding:'2px 8px', borderRadius:50, background:`${c}12`, border:`1px solid ${c}30`, marginBottom:4 }}>{t.period}</div>
                          <div style={{ fontSize:'var(--fs-h4,12px)', fontWeight:300, color:'rgba(30,25,15,0.85)', lineHeight:1.6 }}>{t.descDesktop || t.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          </>
        ) : (
        <>
        {/* Titre — grand */}
        <h2 style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize: isMobile ? 'clamp(22px,6vw,32px)' : 'clamp(26px,3vw,40px)',
          fontWeight:300, lineHeight:1.1,
          color:'var(--text)', marginBottom: isMobile ? 8 : 12,
          whiteSpace: isMobile ? 'pre-line' : 'nowrap', letterSpacing:'-0.01em',
          flexShrink:0,
        }}>{slide.title}</h2>

        {/* Contenu selon type */}

        {/* ── Contenu compacté selon type ── */}
        <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', justifyContent:'flex-start', overflowY:'auto', WebkitOverflowScrolling:'touch', gap: isMobile ? 8 : 10, paddingBottom: isMobile ? 12 : 16 }}>

          {slide.id === 'impact' && (
            <div style={{ display:'flex', justifyContent:'center' }}>
              <img
                src="/stress3.png"
                alt=""
                style={{ width: isMobile ? '90%' : '52%', borderRadius:10, objectFit:'contain', boxShadow:'0 4px 14px rgba(0,0,0,0.10)', flexShrink:0, display:'block' }}
              />
            </div>
          )}

          {slide.body && !slide.bullets && !slide.points && !slide.timeline && !slide.features && (
            <>
              <p style={{ fontSize: isMobile ? 'var(--fs-h4,14px)' : 'var(--fs-h3,15px)', fontWeight:400, color:'var(--text2)', lineHeight:1.8, margin:0 }}>
                {slide.bodyDesktop || slide.body}
              </p>
              {slide.highlight && (
                <div style={{ padding:'12px 16px', borderRadius:12, background:`${c}10`, border:`1px solid ${c}25`, fontSize:'var(--fs-h4,13px)', fontWeight:500, color:c, lineHeight:1.5 }}>
                   {slide.highlight}
                </div>
              )}
              {!isMobile && slide.extra && (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {slide.extra.map((e,i) => (
                    <div key={i} style={{ flex:'1 1 0', minWidth:90, padding:'10px 14px', borderRadius:12, background:`${c}0e`, border:`1px solid ${c}28`, animation:`onbIn .4s ease ${i*.12+.3}s both` }}>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:600, color:c, lineHeight:1 }}>{e.value}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:'rgba(30,25,15,0.80)', marginTop:4, lineHeight:1.3 }}>{e.label}</div>
                      <div style={{ fontSize:10, color:'rgba(30,25,15,0.45)', marginTop:2, fontStyle:'italic' }}>{e.sub}</div>
                    </div>
                  ))}
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
                    <div style={{ fontSize:'var(--fs-h5,11px)', fontWeight:300, color:'rgba(30,25,15,0.80)', lineHeight:1.55 }}>{b.descDesktop || b.desc}</div>
                    {b.example && (
                      <div style={{ marginTop:5, fontSize:'var(--fs-h5,11px)', fontStyle:'italic', color:c, fontWeight:400, lineHeight:1.4 }}>{b.example}</div>
                    )}
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
                    <div style={{ fontSize:'var(--fs-h4,12px)', fontWeight:300, color:'rgba(30,25,15,0.85)', lineHeight:1.6 }}>{t.descDesktop || t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {slide.highlightDesktop && (
            <div style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'12px 16px', borderRadius:12, background:`${c}10`, border:`1px solid ${c}28`, animation:'onbIn .4s ease .5s both' }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{slide.highlightDesktop.icon}</span>
              <span style={{ fontSize:'var(--fs-h4,13px)', fontWeight:400, color:c, lineHeight:1.6, fontStyle:'italic' }}>{slide.highlightDesktop.text}</span>
            </div>
          )}
          {slide.mechanisms && (
            <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 12 }}>
              {slide.mechanisms.map((m, i) => (
                <div key={i} style={{ flex: isMobile ? 'none' : '1 1 0', borderRadius:16, overflow:'hidden', background:'#fff', border:`1.5px solid ${m.color}40`, boxShadow:`0 6px 24px ${m.color}18`, animation:`onbIn .5s ease ${i*.15+.2}s both` }}>
                  <div style={{ background:`linear-gradient(135deg, ${m.color}28 0%, ${m.color}12 100%)`, borderBottom:`1.5px solid ${m.color}28`, padding:'14px 16px 12px', display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:'#fff', border:`2px solid ${m.color}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, boxShadow:`0 2px 8px ${m.color}20` }}>{m.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:700, color:'rgba(15,25,10,0.92)', lineHeight:1.2 }}>{m.label}</div>
                      <div style={{ display:'inline-block', marginTop:4, fontFamily:"'Jost',sans-serif", fontSize:10.5, fontWeight:600, color:m.color, letterSpacing:'.10em', textTransform:'uppercase', background:`${m.color}14`, border:`1px solid ${m.color}30`, borderRadius:100, padding:'2px 8px' }}>{m.sub}</div>
                    </div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:300, color:`${m.color}35`, lineHeight:1, flexShrink:0 }}>{m.num}</div>
                  </div>
                  <div style={{ padding:'14px 16px' }}>
                    <p style={{ fontFamily:"'Jost',sans-serif", fontSize:13, fontWeight:400, color:'rgba(15,25,10,0.78)', lineHeight:1.75, margin:0 }}>{m.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {slide.features && (
            <>
              <p style={{ fontSize:'var(--fs-h4,13px)', fontWeight:300, color:'rgba(30,25,15,0.65)', lineHeight:1.7, margin:0 }}>{slide.bodyDesktop || slide.body}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {slide.features.map((f,i) => (
                  <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 14px', borderRadius:12, background:'rgba(255,255,255,0.65)', border:'1px solid rgba(0,0,0,0.08)', boxShadow:'0 2px 6px rgba(0,0,0,0.04)', animation:`onbIn .4s ease ${i*.1+.1}s both` }}>
                    <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:`${c}18`, border:`1.5px solid ${c}35`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{f.icon}</div>
                    <span style={{ fontSize:'var(--fs-h4,13px)', fontWeight:400, color:'rgba(30,25,15,0.92)', lineHeight:1.4 }}>{f.textDesktop || f.text}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        </>
        )}

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
      <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#faf5f2', display:'flex', flexDirection:'column', overflow:'hidden', '--text':'#1a1208', '--text2':'rgba(35,25,12,0.78)' }}>
        {inner}
      </div>
    )
  }

  const SPARKS = [
    { left:'12%', top:'18%', dur:'2.4s', fdur:'5s',  delay:'0s'    },
    { left:'28%', top:'72%', dur:'1.8s', fdur:'4.2s', delay:'.6s'  },
    { left:'68%', top:'25%', dur:'2.8s', fdur:'6s',  delay:'1.1s'  },
    { left:'82%', top:'60%', dur:'2s',   fdur:'4.6s', delay:'.3s'  },
    { left:'48%', top:'85%', dur:'3.2s', fdur:'5.5s', delay:'1.7s' },
    { left:'58%', top:'10%', dur:'2.1s', fdur:'4s',  delay:'.9s'   },
  ]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999 }}>
      <style>{ONB_STYLES}</style>
      <NatureBg />
      {SPARKS.map((s, i) => (
        <div key={i} className="spark" style={{
          left: s.left, top: s.top,
          '--dur': s.dur, '--fdur': s.fdur, '--delay': s.delay,
        }}/>
      ))}
      <div className="onb-backdrop">
        <div className="onb-modal">
          {inner}
        </div>
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────
//  ÉTAPE ÉQUIPE — crédibilité professionnelle, ton chaleureux
// ─────────────────────────────────────────────────────────────────────────────
const EQUIPE = [
  {
    initiales: 'GJ',
    photo:      '/equipe/Gwenael.jpg', // ex: '/equipe/Gwenael.jpg'
    nom:        'Gwenaël J.',
    role:       'Hypnothérapeute',
    detail:     '15 ans d\'accompagnement individuel. Spécialiste du stress et des émotions.',
    color:      '#d4a0b0',
  },
  {
    initiales: 'MR',
    photo:      null, // ex: '/equipe/marc.jpg'
    nom:        'Marc R.',
    role:       'Thérapeute corps-esprit',
    detail:     'Formé en pleine conscience et cohérence cardiaque. Praticien certifié.',
    color:      '#7aaa88',
  },
  {
    initiales: 'CJ',
    photo:      null, // ex: '/equipe/claire.jpg'
    nom:        'Claire J.',
    role:       'Coach en régulation émotionnelle',
    detail:     'Accompagne les hypersensibles depuis 8 ans. Auteure de deux guides pratiques.',
    color:      '#9ab8c8',
  },
]

function StepEquipe({ onNext, onSkip }) {
  const isMobile = window.innerWidth < 768
  return (
    <ModalShell>
      <div style={{ padding: isMobile ? '24px 20px' : '40px 32px', display:'flex', flexDirection:'column', alignItems:'center', height: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-start' : 'flex-start', overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
        <div style={{ maxWidth:400, width:'100%', display:'flex', flexDirection:'column', gap: isMobile ? 16 : 28 }}>

          {/* En-tête */}
          <div className="s0" style={{ textAlign:'center' }}>
            <p style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize:'clamp(20px,3vw,26px)', fontWeight:300, lineHeight:1.4,
              color:'rgba(30,25,15,0.88)', margin:0,
            }}>
              Vous n'êtes pas seul·e<br/>
              <em style={{ color:'#c07878', fontStyle:'italic' }}>dans ce jardin.</em>
            </p>
            <p style={{ fontSize:'var(--fs-h5,12px)', color:'rgba(30,25,15,0.45)', marginTop:10, fontStyle:'italic' }}>
              Une équipe de professionnels a conçu chaque rituel proposé ici.
            </p>
          </div>

          {/* Cartes équipe */}
          <div className="s1" style={{ display:'flex', flexDirection:'column', gap: isMobile ? 8 : 10 }}>
            {EQUIPE.map((p, i) => (
              <div key={i} style={{
                display:'flex', gap:14, alignItems:'center',
                padding: isMobile ? '10px 14px' : '14px 18px', borderRadius:16,
                background:'rgba(255,255,255,0.60)',
                border:'1px solid rgba(0,0,0,0.08)',
                boxShadow:'0 2px 10px rgba(0,0,0,0.05)',
                animation:`stepIn .45s cubic-bezier(.22,1,.36,1) ${i*0.12}s both`,
              }}>
                {/* Avatar photo ou initiales */}
                <div style={{
                  width:46, height:46, borderRadius:'50%', flexShrink:0,
                  background:`radial-gradient(circle at 38% 38%, ${p.color}88, ${p.color})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  overflow:'hidden',
                  boxShadow:`0 0 0 2px ${p.color}55`,
                }}>
                  {p.photo
                    ? <img src={p.photo} alt={p.nom} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                    : <span style={{ fontFamily:"'Jost',sans-serif", fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.92)', letterSpacing:'.04em' }}>{p.initiales}</span>
                  }
                </div>
                {/* Texte */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:'var(--fs-h4,14px)', fontWeight:600, color:'rgba(30,25,15,0.88)' }}>{p.nom}</span>
                    <span style={{ fontSize:'var(--fs-h5,11px)', color:p.color, fontWeight:500 }}>{p.role}</span>
                  </div>
                  <p style={{ fontSize:'var(--fs-h5,11px)', color:'rgba(30,25,15,0.52)', margin:'3px 0 0', lineHeight:1.5, fontStyle:'italic' }}>
                    {p.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Note de bas */}
          <div className="s2" style={{ textAlign:'center' }}>
            <p style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize:'clamp(14px,2vw,17px)', fontWeight:300, lineHeight:1.7,
              color:'rgba(30,25,15,0.58)', margin: isMobile ? '0 0 14px' : '0 0 24px',
              fontStyle:'italic',
            }}>
              Chaque exercice a été pensé pour être court,<br/>
              doux, et réellement utile.
            </p>
            <button onClick={onNext} style={{
              width:'100%', padding: isMobile ? '13px 20px' : '16px 28px', borderRadius:50,
              border:'none',
              background:'linear-gradient(135deg, #c8a0b0, #a07888)',
              color:'#fff', fontSize:'var(--fs-h4,14px)', fontWeight:600,
              letterSpacing:'.08em', cursor:'pointer',
              fontFamily:"'Jost',sans-serif",
              boxShadow:'0 6px 22px rgba(160,120,136,0.38)',
              transition:'all .28s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 28px rgba(160,120,136,0.46)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 6px 22px rgba(160,120,136,0.38)' }}
            >
              Bien accompagné, j'avance 🌱
            </button>

          </div>

        </div>
      </div>
    </ModalShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  QCM — questionnaire de validation produit (résonance, besoin, univers)
//  Pas de bonne/mauvaise réponse — la récompense est liée à la complétion.
//  Les réponses sont sauvegardées en base pour analyse produit.
//
//  Structure de chaque question :
//    q       : texte de la question
//    tag     : catégorie affichée discrètement (pour analyse interne)
//    choices : tableau de libellés
//    — pas de champ `correct` --
// ─────────────────────────────────────────────────────────────────────────────
const QCM_QUESTIONS = [

  // ── BLOC 1 : Contexte & besoin (questions 1-6) ──
  {
    tag: 'contexte',
    q: 'Pour mieux comprendre ce qui vous a amené ici, quelle phrase décrit le mieux votre quotidien en ce moment ?',
    choices: [
      'Je jongle entre travail, famille et obligations — peu de temps pour moi',
      'Je traverse une période difficile et je cherche des ressources',
      'Je vais bien mais je veux prendre soin de moi de façon plus régulière',
      'Je suis dans une démarche de développement personnel depuis un moment',
    ],
  },
  {
    tag: 'besoin',
    q: 'En ce moment, comment décririez-vous votre niveau de stress au quotidien ?',
    choices: [
      'Très élevé — je me sens souvent débordé(e) ou à bout',
      'Modéré — certains jours sont difficiles mais je tiens',
      'Faible — je gère plutôt bien, c\'est plus la prévention qui m\'intéresse',
      'Variable — des pics intenses suivis de périodes plus calmes',
    ],
  },
  {
    tag: 'besoin',
    q: 'Avez-vous déjà eu l\'impression que votre fatigue s\'accumule sans vraiment repartir, même après une nuit de sommeil ?',
    choices: [
      'Oui, c\'est exactement ce que je vis en ce moment',
      'Oui, ça m\'est arrivé par périodes — et ça peut revenir',
      'Rarement, mais je veux éviter d\'en arriver là',
      'Non, ce n\'est pas quelque chose que j\'ai ressenti',
    ],
  },
  {
    tag: 'besoin',
    q: 'Avez-vous déjà essayé de mettre en place une routine de bien-être (méditation, journal, respiration...) ?',
    choices: [
      'Oui, et ça a duré — j\'ai encore cette pratique',
      'Oui, mais j\'ai arrêté au bout de quelques semaines',
      'J\'ai essayé une ou deux fois, sans vraiment m\'y tenir',
      'Non, je n\'ai jamais vraiment tenté',
    ],
  },
  {
    tag: 'besoin',
    q: 'Qu\'est-ce qui vous a fait abandonner — ou pourrait vous faire abandonner — une pratique de bien-être ?',
    choices: [
      'Ne pas voir de résultats concrets assez vite',
      'La sensation que c\'est artificiel ou que ça ne me ressemble pas',
      'Le manque de temps ou une mauvaise organisation',
      'Le coût — si le rapport valeur/prix ne me convainc pas',
    ],
  },
  {
    tag: 'besoin',
    q: 'Quand vous pensez à "prendre soin de vous", qu\'est-ce qui vous vient spontanément en tête ?',
    choices: [
      'Du mouvement — sport, marche, corps',
      'Du calme — silence, respiration, méditation',
      'Du lien — retrouver des proches, partager',
      'Rien de précis — c\'est justement ce que je cherche',
    ],
  },

  // ── BLOC 2 : L'univers (questions 7-12) ──
  {
    tag: 'univers',
    q: 'L\'idée de prendre soin de soi comme on cultive un jardin — doucement, régulièrement, sans forcer — vous parle-t-elle ?',
    choices: [
      'Oui, c\'est exactement l\'image qu\'il me faut',
      'Plutôt oui — c\'est poétique et ça change',
      'Un peu — mais je ne suis pas sûr(e) que ça me motive durablement',
      'Pas vraiment — ce n\'est pas une image qui me touche',
    ],
  },
  {
    tag: 'univers',
    q: 'L\'univers visuel que vous venez de découvrir — doux, naturel, sans badges ni classements — vous donne plutôt envie de...',
    choices: [
      'Revenir souvent — cette douceur est exactement ce qu\'il me faut',
      'Essayer, même si j\'aurais aimé quelque chose de plus dynamique',
      'Hésiter — je ne sais pas si cette atmosphère me tiendra sur la durée',
      'Chercher autre chose — je fonctionne mieux avec des repères plus structurés',
    ],
  },
  {
    tag: 'univers',
    q: 'Le fait de voir une plante évoluer en fonction de vos rituels quotidiens vous semblerait...',
    choices: [
      'Motivant — voir quelque chose pousser me donnerait envie de continuer',
      'Sympa, sans être déterminant dans mon engagement',
      'Neutre — je n\'ai pas besoin d\'élément visuel pour me motiver',
      'Enfantin ou trop ludique pour ce type de sujet',
    ],
  },
  {
    tag: 'univers',
    q: 'L\'idée qu\'une application de bien-être puisse être "sans performance ni jugement" vous semble-t-elle...',
    choices: [
      'Essentielle — c\'est exactement ce dont j\'ai besoin',
      'Rassurante — j\'ai parfois peur de "mal faire"',
      'Normale — toute bonne appli devrait être ainsi',
      'Insuffisante — j\'ai besoin de métriques pour me sentir progresser',
    ],
  },
  {
    tag: 'univers',
    q: 'Vous imaginez utiliser cette application plutôt...',
    choices: [
      'Le matin, pour bien démarrer la journée',
      'Le soir, pour décompresser avant de dormir',
      'Dans les moments de creux ou de tension dans la journée',
      'À heure fixe, comme une habitude ancrée dans ma routine',
    ],
  },
  {
    tag: 'univers',
    q: 'Si vous deviez recommander cette application à quelqu\'un de proche, vous diriez que c\'est...',
    choices: [
      'Un espace de pause et de reconnexion à soi',
      'Un outil concret pour gérer le stress du quotidien',
      'Une façon douce d\'entrer dans le développement personnel',
      'Je ne saurais pas encore comment la présenter',
    ],
  },

  // ── BLOC 3 : Pertinence & crédibilité (questions 13-18) ──
  {
    tag: 'pertinence',
    q: 'Franchement — avant d\'avoir essayé — à quel point croyez-vous qu\'un rituel de 2 à 5 minutes par jour peut changer quelque chose ?',
    choices: [
      'J\'y crois vraiment — la régularité compte plus que la durée',
      'Je suis ouvert(e) — je réserve mon jugement à l\'usage',
      'Je suis sceptique — ça me semble trop court pour être impactant',
      'Je n\'y crois pas encore — il faudrait me le prouver',
    ],
  },
  {
    tag: 'pertinence',
    q: 'Les éléments scientifiques présentés (neuroplasticité, cortisol, dopamine) vous ont-ils semblé...',
    choices: [
      'Crédibles et rassurants — ça donne du sens à la démarche',
      'Intéressants, mais je ne les ai pas vraiment évalués',
      'Un peu trop techniques — j\'aurais préféré des exemples concrets',
      'Marketing — ce genre d\'argument me rend méfiant(e)',
    ],
  },
  {
    tag: 'pertinence',
    q: 'Une application qui adapte les rituels à votre état du jour (fatigue, tension, besoin de douceur) vous semblerait...',
    choices: [
      'Très utile — c\'est ce qui manque à la plupart des applis',
      'Intéressante, mais je ne sais pas si je l\'utiliserais vraiment',
      'Agréable, sans être indispensable',
      'Inutile — je préfère décider moi-même ce que je fais',
    ],
  },
  {
    tag: 'pertinence',
    q: 'Est-ce qu\'une application comme celle-ci répond à quelque chose que vous n\'avez pas trouvé ailleurs ?',
    choices: [
      'Oui — l\'approche douce et sans pression est rare',
      'En partie — il me manque encore des éléments pour en être sûr(e)',
      'Pas vraiment — j\'ai déjà des outils qui me conviennent',
      'Je ne sais pas encore — il faudrait que j\'essaie vraiment',
    ],
  },
  {
    tag: 'pertinence',
    q: 'Pensez-vous que votre entourage (ami(e), partenaire, collègue) pourrait aussi bénéficier de cette application ?',
    choices: [
      'Oui, je pense à quelqu\'un en particulier en ce moment',
      'Probablement — le stress d\'usure touche tout le monde',
      'Peut-être, pour certaines personnes',
      'Non, c\'est quelque chose de très personnel',
    ],
  },
  {
    tag: 'valeur',
    q: 'Si cette application tient ses promesses, quel tarif mensuel vous semblerait juste ?',
    choices: [
      'Moins de 5 € — c\'est un service que je ne valorise pas encore très haut',
      '5 à 9 € — raisonnable pour quelque chose d\'utile au quotidien',
      '10 à 14 € — comparable à d\'autres abonnements bien-être que j\'utilise',
      '15 € ou plus — si l\'impact est réel, ça vaut le prix d\'une séance',
    ],
  },

  // ── BLOC 4 : Projection & ressenti libre (questions 19-22) ──
  {
    tag: 'projection',
    q: 'Dans 3 mois, si vous utilisiez cette application régulièrement, ce que vous espéreriez le plus, c\'est...',
    choices: [
      'Dormir mieux et me sentir moins épuisé(e)',
      'Réagir avec plus de recul face au stress et aux imprévus',
      'Avoir un rituel stable qui structure et apaise ma journée',
      'Simplement me sentir un peu mieux dans ma peau, durablement',
    ],
  },
  {
    tag: 'projection',
    q: 'Quelle est la chose qui vous a le plus surpris(e) ou intrigué(e) dans ce que vous venez de découvrir ?',
    choices: [
      'La simplicité — 2 minutes, sans culpabilité ni performance',
      'La métaphore du jardin — je ne l\'attendais pas du tout',
      'La dimension scientifique derrière quelque chose d\'aussi doux',
      'Le fait qu\'il n\'y ait aucune pression, aucun classement',
    ],
  },
  {
    tag: 'projection',
    q: 'En toute honnêteté, à ce stade, quelle est votre envie de commencer à utiliser cette application ?',
    choices: [
      'Forte — j\'ai hâte de voir ce que ça donne concrètement',
      'Présente — je suis curieux(se) et prêt(e) à essayer sérieusement',
      'Timide — il me faudra quelques jours pour me faire un vrai avis',
      'Faible — quelque chose ne m\'a pas encore convaincu(e)',
    ],
  },
  {
    tag: 'verbatim',
    q: 'En un mot ou une courte phrase, qu\'est-ce que cette découverte vous a laissé comme sentiment ?',
    choices: [
      'De la curiosité — j\'ai envie d\'en voir plus',
      'De la douceur — ça m\'a fait du bien rien qu\'à découvrir',
      'De la méfiance — je reste prudent(e) avant de juger',
      'De l\'espoir — c\'est peut-être ce qu\'il me fallait',
    ],
  },
]

// Libellés affichés pour chaque tag (blocs de questions)
const TAG_LABELS = {
  besoin:      'Votre vécu',
  univers:     'L\'univers de l\'appli',
  pertinence:  'Ce que ça vous apporte',
  projection:  'Et maintenant...',
}

function StepQuestionnaire({ userId, onComplete, onSkip }) {
  const [qIndex, setQIndex]     = useState(0)
  const [answers, setAnswers]   = useState({})   // { qIndex: choiceIndex }
  const [selected, setSelected] = useState(null)
  const [finished, setFinished] = useState(false)
  const [leaving, setLeaving]   = useState(false)
  const isMobile = window.innerWidth < 768

  const total   = QCM_QUESTIONS.length
  const current = QCM_QUESTIONS[qIndex]

  // Sauvegarde les réponses + active le mois premium à la fin
  async function saveAndFinish(finalAnswers) {
    if (!userId) return
    try {
      // On stocke les réponses sous forme lisible pour analyse produit
      const payload = QCM_QUESTIONS.map((q, i) => ({
        tag:      q.tag,
        question: q.q,
        answer:   q.choices[finalAnswers[i] ?? -1] ?? null,
      }))
      await supabase.from('profiles').update({
        quiz_answers:        payload,
        quiz_completed_at:   new Date().toISOString(),   // ← marque "déjà fait" pour les connexions suivantes
        premium_trial_until: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
      }).eq('id', userId)
    } catch (e) {
      console.warn('[quiz] save error', e)
    }
  }

  function handleSelect(idx) {
    if (leaving) return
    setSelected(idx)
  }

  function handleNext() {
    if (selected === null) return
    const newAnswers = { ...answers, [qIndex]: selected }
    setAnswers(newAnswers)

    if (qIndex < total - 1) {
      setLeaving(true)
      setTimeout(() => {
        setQIndex(q => q + 1)
        setSelected(null)
        setLeaving(false)
      }, 280)
    } else {
      saveAndFinish(newAnswers)
      setFinished(true)
    }
  }

  const accentColor = '#c8a0b0'

  // ── Écran résultat final — affiché dès que les 20 questions sont répondues ──
  if (finished) {
    return (
      <ModalShell>
        <div style={{
          padding: isMobile ? '32px 24px' : '48px 40px',
          display:'flex', flexDirection:'column', alignItems:'center',
          gap:24, textAlign:'center',
        }}>

          <div style={{
            width:96, height:96, borderRadius:'50%',
            background:'linear-gradient(135deg, #f0c860, #c8a030)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:44,
            boxShadow:'0 8px 32px rgba(200,160,48,0.40)',
            animation:'modalIn .5s cubic-bezier(.22,1,.36,1) both',
          }}>🎁</div>

          <div className="s0">
            <h2 style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize: isMobile ? 32 : 38, fontWeight:400,
              color:'rgba(30,25,15,0.95)', lineHeight:1.15, margin:0,
            }}>
              Merci pour votre sincérité
            </h2>
            <p style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize: isMobile ? 20 : 23, fontWeight:300,
              color:'rgba(30,25,15,0.75)', marginTop:12, fontStyle:'italic', lineHeight:1.6,
            }}>
              Vos réponses nous aident à construire quelque chose qui vous ressemble vraiment.
            </p>
          </div>

          <div className="s1" style={{
            padding: isMobile ? '22px 24px' : '24px 28px', borderRadius:18,
            background:'linear-gradient(135deg, #fef9e8, #fdf0c0)',
            border:'1.5px solid rgba(200,160,48,0.35)',
            boxShadow:'0 4px 20px rgba(200,160,48,0.15)',
            width:'100%', maxWidth:400,
          }}>
            <p style={{
              fontFamily:"'Jost',sans-serif",
              fontSize: isMobile ? 20 : 20, fontWeight:600,
              color:'#7a5a08', margin:'0 0 10px',
            }}>
              🎉 1 mois Premium offert
            </p>
            <p style={{
              fontSize: isMobile ? 16 : 16, fontWeight:400,
              color:'rgba(80,60,10,0.88)', margin:0, lineHeight:1.75,
            }}>
              Accès complet à tous les rituels, méditations et contenus pendant 30 jours. Aucune carte bancaire requise.
            </p>
          </div>

          <div className="s2" style={{ width:'100%', maxWidth:400 }}>
            <button onClick={onComplete} style={{
              width:'100%', padding: isMobile ? '18px 28px' : '17px 28px', borderRadius:50, border:'none',
              background:'linear-gradient(135deg, #e8b830, #c8900a)',
              color:'#fff', fontSize: isMobile ? 19 : 17, fontWeight:600,
              letterSpacing:'.08em', cursor:'pointer',
              fontFamily:"'Jost',sans-serif",
              boxShadow:'0 6px 22px rgba(200,144,10,0.40)',
              transition:'all .28s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.opacity='.9' }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.opacity='1' }}
            >
              On continue ! →
            </button>
          </div>

        </div>
      </ModalShell>
    )
  }

  // ── Question en cours ──
  const tagLabel = TAG_LABELS[current.tag] || ''

  return (
    <ModalShell>
      <div style={{
        padding: isMobile ? '24px 20px' : '36px 32px',
        display:'flex', flexDirection:'column',
        height: isMobile ? '100%' : 'auto',
        minHeight: isMobile ? '100%' : 560,
        gap:0,
        opacity: leaving ? 0 : 1,
        transform: leaving ? 'translateY(-10px)' : 'none',
        transition:'opacity .28s ease, transform .28s ease',
      }}>

        {/* En-tête progress */}
        <div style={{ marginBottom:20, flexShrink:0 }}>
          <div style={{ height:4, borderRadius:100, background:'rgba(0,0,0,0.07)', overflow:'hidden', marginBottom:12 }}>
            <div style={{
              height:'100%', borderRadius:100,
              background:`linear-gradient(90deg, ${accentColor}88, ${accentColor})`,
              width:`${(qIndex / total) * 100}%`,
              transition:'width .4s ease',
            }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{
              fontSize:'var(--fs-h5,11px)', letterSpacing:'.10em',
              color:'rgba(30,25,15,0.40)', fontWeight:400,
              fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic',
            }}>
              {tagLabel} · {qIndex + 1} / {total}
            </span>
            <button onClick={onSkip} style={{
              background:'none', border:'none', cursor:'pointer',
              fontSize:'var(--fs-h5,11px)', color:'rgba(30,25,15,0.30)',
              fontFamily:"'Jost',sans-serif", padding:'4px 8px',
              transition:'color .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color='rgba(30,25,15,0.55)' }}
              onMouseLeave={e => { e.currentTarget.style.color='rgba(30,25,15,0.30)' }}
            >
              Passer →
            </button>
          </div>
        </div>

        {/* Question */}
        <div className="s0" style={{ marginBottom:22, flexShrink:0 }}>
          <p style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize: isMobile ? 'clamp(17px,4.5vw,22px)' : 'clamp(18px,2.5vw,24px)',
            fontWeight:400, lineHeight:1.45,
            color:'rgba(30,25,15,0.92)', margin:0,
          }}>
            {current.q}
          </p>
        </div>

        {/* Choix */}
        <div className="s1" style={{ display:'flex', flexDirection:'column', gap:9, flex:1 }}>
          {current.choices.map((choice, i) => {
            const isSelected = selected === i
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'12px 16px', borderRadius:14, textAlign:'left',
                  fontFamily:"'Jost',sans-serif",
                  background: isSelected ? `${accentColor}14` : 'rgba(255,255,255,0.65)',
                  border: isSelected ? `2px solid ${accentColor}70` : '1px solid rgba(0,0,0,0.09)',
                  cursor:'pointer',
                  transition:'all .18s ease',
                  animation:`stepIn .35s cubic-bezier(.22,1,.36,1) ${i*.07}s both`,
                }}
                onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background='rgba(255,255,255,0.88)'; e.currentTarget.style.borderColor='rgba(0,0,0,0.16)' } }}
                onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background='rgba(255,255,255,0.65)'; e.currentTarget.style.borderColor='rgba(0,0,0,0.09)' } }}
              >
                <div style={{
                  width:26, height:26, borderRadius:'50%', flexShrink:0,
                  border: isSelected ? `2px solid ${accentColor}` : '2px solid rgba(0,0,0,0.18)',
                  background: isSelected ? `${accentColor}22` : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:700,
                  color: isSelected ? accentColor : 'rgba(0,0,0,0.35)',
                  transition:'all .18s',
                }}>
                  {String.fromCharCode(65+i)}
                </div>
                <span style={{
                  fontSize:'var(--fs-h4,13px)',
                  fontWeight: isSelected ? 500 : 400,
                  color: isSelected ? 'rgba(30,25,15,0.92)' : 'rgba(30,25,15,0.78)',
                  lineHeight:1.5, flex:1,
                }}>
                  {choice}
                </span>
              </button>
            )
          })}
        </div>

        {/* Bouton suivant */}
        <div style={{ marginTop:20, flexShrink:0 }}>
          <button
            onClick={handleNext}
            disabled={selected === null}
            style={{
              width:'100%', padding:'14px', borderRadius:50, border:'none',
              background: selected !== null
                ? `linear-gradient(135deg, ${accentColor}, #a07888)`
                : 'rgba(0,0,0,0.07)',
              color: selected !== null ? '#fff' : 'rgba(0,0,0,0.30)',
              fontSize:'var(--fs-h4,14px)', fontWeight:600, letterSpacing:'.06em',
              cursor: selected !== null ? 'pointer' : 'default',
              fontFamily:"'Jost',sans-serif",
              boxShadow: selected !== null ? '0 5px 18px rgba(160,120,136,0.32)' : 'none',
              transition:'all .22s ease',
            }}
          >
            {qIndex < total - 1 ? 'Question suivante →' : 'Voir mon résultat ✨'}
          </button>
        </div>

      </div>
    </ModalShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  INTRO QUESTIONNAIRE — slide optionnelle avant le QCM
// ─────────────────────────────────────────────────────────────────────────────
function StepQuizIntro({ onStart, onSkip, onGoWeekOne }) {
  const isMobile = window.innerWidth < 768
  return (
    <ModalShell>
      <div style={{
        padding: isMobile ? '40px 24px' : '48px 40px',
        display:'flex', flexDirection:'column', alignItems:'center',
        gap:24, textAlign:'center',
        height: isMobile ? '100%' : 'auto',
        justifyContent:'center',
      }}>

        <div className="s0" style={{ fontSize:64, lineHeight:1 }}>🎁</div>

        <div className="s1">
          <h2 style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:'clamp(22px,3.5vw,30px)', fontWeight:300,
            color:'rgba(30,25,15,0.92)', lineHeight:1.2, margin:'0 0 10px',
          }}>
            Un cadeau pour votre curiosité
          </h2>
          <p style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:'clamp(16px,2.5vw,20px)', fontWeight:300,
            color:'rgba(30,25,15,0.55)', fontStyle:'italic', margin:0,
          }}>
            Avant d'entrer dans votre jardin...
          </p>
        </div>

        <div className="s2" style={{
          padding:'20px 24px', borderRadius:18,
          background:'linear-gradient(135deg, #fef9e8, #fdf0c0)',
          border:'1.5px solid rgba(200,160,48,0.35)',
          maxWidth:380,
        }}>
          <p style={{
            fontSize:'var(--fs-h3,15px)', fontWeight:400,
            color:'rgba(60,45,10,0.88)', margin:0, lineHeight:1.7,
          }}>
            Répondez à <strong>22 questions</strong> sur ce que vous avez ressenti, ce qui vous a parlé, ce qui vous laisse sceptique. En retour, obtenez <strong style={{ color:'#c8900a' }}>1 mois de Premium offert</strong> — sans carte bancaire.
          </p>
        </div>

        <div className="s3" style={{ width:'100%', maxWidth:380, display:'flex', flexDirection:'column', gap:10 }}>
          <button onClick={onStart} style={{
            width:'100%', padding:'15px 28px', borderRadius:50,
            border:'none',
            background:'linear-gradient(135deg, #e8b830, #c8900a)',
            color:'#fff', fontSize:'var(--fs-h4,14px)', fontWeight:600,
            letterSpacing:'.08em', cursor:'pointer',
            fontFamily:"'Jost',sans-serif",
            boxShadow:'0 6px 22px rgba(200,144,10,0.40)',
            transition:'all .28s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.opacity='.9' }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.opacity='1' }}
          >
            🌿 J'apporte mon aide
          </button>
          <button onClick={onGoWeekOne ?? onSkip} style={{
            width:'100%', padding:'11px', borderRadius:50,
            border:'1px solid rgba(0,0,0,0.12)', background:'transparent',
            color:'rgba(30,25,15,0.45)', fontSize:'var(--fs-h5,12px)',
            cursor:'pointer', fontFamily:"'Jost',sans-serif",
            transition:'all .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(0,0,0,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent' }}
          >
            Non merci, commencer mon parcours
          </button>
        </div>

        <p className="s4" style={{
          fontSize:'var(--fs-h5,11px)', color:'rgba(30,25,15,0.30)',
          fontStyle:'italic', margin:0, maxWidth:320,
        }}>
          Questionnaire optionnel · 22 questions · ~4 minutes · pas de bonne ou mauvaise réponse
        </p>

      </div>
    </ModalShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  OnboardingScreen — orchestration complète
//  Flow : intro → 5 slides → intention → métaphore → graine → communauté →
//         équipe → [quiz intro → quiz (1 seule fois)] → WeekOneFlow
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  VEIL SCREEN — écran de transition avant le MP4
// ─────────────────────────────────────────────────────────────────────────────
function VeilScreen({ onDone }) {
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    // Précharger le MP4 en parallèle
    const video = document.createElement('video')
    video.src = '/Accueil_lutin.mp4'
    video.preload = 'auto'

    // Dissoudre le voile après 1.8s
    const t1 = setTimeout(() => setOpacity(0), 4000)
    // Appeler onDone après la fin du fondu (1.2s de transition)
    const t2 = setTimeout(() => onDone(), 5200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'linear-gradient(160deg, #0c1a0a, #1a2e10)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity, transition: 'opacity 1.2s ease',
    }}>
      {/* Particules flottantes */}
      <style>{`
        @keyframes veilFloat {
          0%   { opacity:0; transform:translateY(0) scale(0.8); }
          30%  { opacity:0.6; }
          70%  { opacity:0.3; }
          100% { opacity:0; transform:translateY(-80px) scale(1.1); }
        }
        @keyframes veilPulse {
          0%,100% { opacity:0.15; transform:scale(1); }
          50%     { opacity:0.35; transform:scale(1.08); }
        }
        @keyframes veilLogoIn {
          from { opacity:0; transform:translateY(12px) scale(0.92); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .veil-spark { position:absolute; border-radius:50%; pointer-events:none; }
      `}</style>

      {/* Lueur centrale */}
      <div style={{
        position:'absolute', width:300, height:300, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(168,224,64,0.12) 0%, transparent 70%)',
        animation:'veilPulse 2.8s ease-in-out infinite',
      }}/>

      {/* Particules */}
      {[
        { left:'20%', top:'25%', size:6, delay:'0s',   dur:'3.2s' },
        { left:'75%', top:'20%', size:4, delay:'.6s',  dur:'2.8s' },
        { left:'50%', top:'70%', size:5, delay:'1.1s', dur:'3.5s' },
        { left:'30%', top:'65%', size:3, delay:'.3s',  dur:'2.5s' },
        { left:'80%', top:'55%', size:7, delay:'1.4s', dur:'4s'   },
        { left:'15%', top:'50%', size:4, delay:'.8s',  dur:'3s'   },
      ].map((p, i) => (
        <div key={i} className="veil-spark" style={{
          left:p.left, top:p.top,
          width:p.size, height:p.size,
          background:'rgba(168,224,64,0.55)',
          animation:`veilFloat ${p.dur} ease-out ${p.delay} infinite`,
        }}/>
      ))}

      {/* Logo + nom */}
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center', gap:16,
        animation:'veilLogoIn 1s cubic-bezier(.22,1,.36,1) .2s both',
        position:'relative', zIndex:1,
      }}>
        <img
          src="/icons/icon-192.png"
          alt=""
          style={{ width:72, height:72, borderRadius:'50%', boxShadow:'0 0 40px rgba(168,224,64,0.25)' }}
        />
        <div style={{ textAlign:'center' }}>
          <div style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:28, fontWeight:300, fontStyle:'italic',
            color:'rgba(230,220,200,0.90)', letterSpacing:'.02em', lineHeight:1.2,
          }}>
            Mon <em style={{ color:'rgba(168,224,64,0.80)', fontStyle:'normal' }}>Jardin</em>
          </div>
          <div style={{
            fontSize:10, letterSpacing:'.22em', textTransform:'uppercase',
            color:'rgba(230,220,200,0.35)', marginTop:6,
            fontFamily:"'Jost',sans-serif",
          }}>
            Intérieur
          </div>
        </div>
      </div>
    </div>
  )
}

export function OnboardingScreen({ userId, onComplete }) {
  useTheme()
  // phase : -2=voile -1=intro 0=slides 1=intention 2=metaphore 3=graine 4=communauté 5=équipe 6=quizIntro 7=quiz
  const [phase,        setPhase]        = useState(-2)
  const [intention,    setIntention]    = useState(null)
  const [quizChecked,  setQuizChecked]  = useState(false)  // true une fois la vérification Supabase faite
  const [quizAlready,  setQuizAlready]  = useState(false)  // true si le quiz a déjà été complété

  // ── Vérifie si le quiz a déjà été fait lors du passage en phase 5→6 ──
  useEffect(() => {
    if (phase !== 5 || quizChecked || !userId) return
    supabase
      .from('profiles')
      .select('quiz_completed_at')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setQuizAlready(!!data?.quiz_completed_at)
        setQuizChecked(true)
      })
      .catch(() => setQuizChecked(true)) // en cas d'erreur, on laisse le quiz accessible
  }, [phase, quizChecked, userId])

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

  // Appelé quand StepEquipe clique "Suivant" → on va au quiz sauf si déjà fait
  function handleEquipeNext() {
    if (quizAlready) {
      onComplete()  // quiz déjà fait → directement WeekOneFlow
    } else {
      setPhase(6)
    }
  }

  if (phase === -2 || phase === -1) return (
    <>
      {/* IntroGwenael monte en arrière-plan pendant le voile — les timeouts démarrent immédiatement */}
      <IntroGwenael onStart={() => setPhase(0)} />
      {/* Voile par-dessus — se dissout et laisse apparaître le MP4 avec boutons déjà prêts */}
      {phase === -2 && <VeilScreen onDone={() => setPhase(-1)} />}
    </>
  )
  if (phase === 0)  return <SlidesEducatives onComplete={() => setPhase(1)} />
  if (phase === 1)  return <StepIntention onSelect={handleIntention} />
  if (phase === 2)  return <StepMetaphore onNext={() => setPhase(3)} />
  if (phase === 3)  return <StepGraine intention={intention} onPlant={handlePlant} />
  if (phase === 4)  return <StepCommunaute onComplete={() => setPhase(5)} />
  if (phase === 5)  return <StepEquipe onNext={handleEquipeNext} onSkip={onComplete} />
  if (phase === 6)  return <StepQuizIntro onStart={() => setPhase(7)} onSkip={onComplete} onGoWeekOne={onComplete} />
  if (phase === 7)  return (
    <StepQuestionnaire
      userId={userId}
      onComplete={onComplete}   // → WeekOneFlow
      onSkip={onComplete}       // → WeekOneFlow aussi (abandon en cours de route)
    />
  )
  return null
}
