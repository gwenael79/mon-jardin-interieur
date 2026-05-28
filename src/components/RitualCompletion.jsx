import React, { useEffect, useRef, useState } from 'react'
import { PlantSVG, DEFAULT_GARDEN_SETTINGS } from './PlantSVG'

function getStage(health) {
  const r = Math.max(0, Math.min(1, health / 100))
  if (r < 0.08) return 'seed'
  if (r < 0.25) return 'sprout'
  if (r < 0.45) return 'young'
  if (r < 0.65) return 'bud'
  return 'flower'
}

const STAGE_LABELS = {
  seed: 'Graine', sprout: 'Pousse', young: 'Jeune plante', bud: 'Bourgeon', flower: 'Floraison',
}

const COMPLETION_TEXTS = {
  sleep: {
    seed:   { title: 'Le calme commence ici.', body: 'Votre corps a entendu l\'invitation au repos. La graine du sommeil se prépare doucement.' },
    sprout: { title: 'Le souffle ralentit.', body: 'Quelque chose s\'est posé en vous. Cette nuit, votre corps se souviendra de ce moment de paix.' },
    young:  { title: 'Le soir devient sanctuaire.', body: 'Vous apprenez à donner à votre corps la permission de se déposer. C\'est un acte de tendresse rare.' },
    bud:    { title: 'La nuit vous appartient.', body: 'Votre système nerveux reconnaît ce rituel. La transition vers le sommeil devient plus naturelle chaque fois.' },
    flower: { title: 'Vous habitez le repos.', body: 'Ce n\'est plus un effort — c\'est un retour. Votre corps sait maintenant où aller pour trouver la paix.' },
  },
  stress: {
    seed:   { title: 'Le premier souffle.', body: 'Même une seule respiration consciente change quelque chose. Vous avez planté une graine de calme.' },
    sprout: { title: 'L\'espace s\'ouvre.', body: 'Votre système nerveux a reçu un signal de sécurité. Le tumulte s\'apaise, un souffle à la fois.' },
    young:  { title: 'Le stress trouve sa place.', body: 'Vous ne fuyez plus — vous traversez. C\'est cette différence qui change tout.' },
    bud:    { title: 'Le calme est en vous.', body: 'Votre corps commence à reconnaître cet espace de paix comme un lieu familier et accessible.' },
    flower: { title: 'Vous portez votre ancre.', body: 'Cette cohérence que vous cultivez est maintenant une ressource réelle, disponible dans les moments difficiles.' },
  },
  emotions: {
    seed:   { title: 'L\'émotion a été entendue.', body: 'Vous avez osé regarder ce qui était là. C\'est plus courageux qu\'il n\'y paraît.' },
    sprout: { title: 'L\'accueil commence.', body: 'Vous apprenez à ne plus fuir ce qui se passe en vous. Cette douceur envers vous-même est précieuse.' },
    young:  { title: 'Les émotions sont des messagères.', body: 'En les accueillant sans les juger, vous commencez à comprendre ce qu\'elles portent pour vous.' },
    bud:    { title: 'La paix avec soi.', body: 'Vous n\'avez plus besoin que les émotions disparaissent pour aller bien. Elles peuvent être là — et vous, aussi.' },
    flower: { title: 'Vous êtes votre propre témoin bienveillant.', body: 'Cette relation à vos états intérieurs est un cadeau que vous vous faites — et que vous offrez aussi aux autres.' },
  },
  grounding: {
    seed:   { title: 'Le sol sous vos pieds.', body: 'Quelque chose vous a ramené ici, maintenant. C\'est exactement là qu\'il fallait être.' },
    sprout: { title: 'Présent·e.', body: 'Vos sens vous ont ramené dans le moment. Le présent est plus vaste qu\'il n\'y paraît.' },
    young:  { title: 'Enraciné·e dans le réel.', body: 'Chaque fois que vous revenez à vos sens, vous vous rappelez que le corps est une maison sûre.' },
    bud:    { title: 'L\'ancrage est une pratique.', body: 'Vous savez maintenant comment vous retrouver. Cette boussole intérieure devient de plus en plus fiable.' },
    flower: { title: 'Vous habitez votre corps.', body: 'Présence, enracinement, sécurité — vous les portez en vous, disponibles à chaque instant de retour.' },
  },
  thoughts: {
    seed:   { title: 'Observer sans suivre.', body: 'Vous avez fait quelque chose de subtil et puissant : vous avez remarqué vos pensées sans les croire.' },
    sprout: { title: 'L\'espace entre le penseur et la pensée.', body: 'Cet espace que vous avez touché — si court soit-il — est la liberté que vous cherchez.' },
    young:  { title: 'Les pensées passent.', body: 'Vous n\'êtes pas vos pensées. Vous êtes ce qui les observe. Cette clarté change tout.' },
    bud:    { title: 'Le mental se pose.', body: 'Votre esprit a appris à se reposer de lui-même. Ce détachement bienveillant est une vraie compétence.' },
    flower: { title: 'Vous êtes l\'espace, pas le bruit.', body: 'La paix n\'est pas l\'absence de pensées — c\'est la capacité de les laisser traverser sans vous emporter.' },
  },
  energy: {
    seed:   { title: 'Le mouvement réveille.', body: 'Votre corps a bougé, votre énergie a circulé. Même un tout petit peu, ça change quelque chose.' },
    sprout: { title: 'La vitalité s\'éveille.', body: 'Chaque souffle actif nourrit votre énergie vitale. Vous commencez à ressentir cette ressource en vous.' },
    young:  { title: 'Le corps sait se recharger.', body: 'Vous avez donné à votre corps ce dont il avait besoin pour se revitaliser. Il s\'en souvient.' },
    bud:    { title: 'L\'élan est là.', body: 'Votre énergie ne dépend plus seulement de l\'extérieur. Vous savez comment l\'allumer de l\'intérieur.' },
    flower: { title: 'Vivant·e et présent·e.', body: 'Cette vitalité que vous cultivez rayonne. Votre corps est votre allié le plus fidèle.' },
  },
  selfconnect: {
    seed:   { title: 'Vous vous êtes écouté·e.', body: 'Ces quelques lignes écrites honnêtement valent plus que des pages. Vous avez commencé à vous rencontrer.' },
    sprout: { title: 'La plume et l\'âme.', body: 'En écrivant, vous avez donné une forme à ce qui était flou. C\'est un acte de clarté et de courage.' },
    young:  { title: 'Vous vous connaissez mieux.', body: 'Chaque page est un miroir bienveillant. Vous construisez une relation plus honnête avec vous-même.' },
    bud:    { title: 'L\'écriture comme boussole.', body: 'Vos mots éclairent ce que vous voulez vraiment. Cette clarté vous guide, doucement mais sûrement.' },
    flower: { title: 'Vous êtes votre propre auteur·e.', body: 'Vous racontez votre histoire consciemment. Cette maîtrise intérieure est un chemin de liberté profonde.' },
  },
  softness: {
    seed:   { title: 'La douceur commence.', body: 'Vous avez posé vos mains sur vous avec soin. C\'est un premier acte d\'amour envers vous-même.' },
    sprout: { title: 'Le corps mérite d\'être choyé.', body: 'Ce toucher bienveillant dit à votre corps : tu comptes. Il l\'entend, même si vous ne le sentez pas encore.' },
    young:  { title: 'Prendre soin de soi, vraiment.', body: 'Vous apprenez que la douceur envers soi n\'est pas un luxe — c\'est une nécessité.' },
    bud:    { title: 'La tendresse cultivée.', body: 'Votre relation avec votre corps change. Il y a moins de jugement, plus d\'écoute. C\'est beau.' },
    flower: { title: 'Vous êtes votre propre jardinier·e.', body: 'Cette douceur que vous vous offrez fleurit — dans votre corps, dans votre regard sur vous-même, et au-delà.' },
  },
}

// Ease-out cubique : ralentit progressivement à l'arrivée
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }


const SPARKLE_COLORS = ['#ffe066', '#ffd033', '#ffec80', '#ffc840', '#fff5a0', '#ffda55']
function generateSparkles(count = 18) {
  return Array.from({ length: count }, (_, i) => ({
    id:    `${Date.now()}-${i}`,
    x:     5  + Math.random() * 90,
    y:     5  + Math.random() * 88,
    size:  3  + Math.random() * 7,
    delay: Math.random() * 350,
    dur:   600 + Math.random() * 700,
    color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
  }))
}

const CSS = `
  @keyframes rc_in      { from{opacity:0;transform:scale(0.96) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes rc_up      { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes rc_glow    { 0%{filter:drop-shadow(0 0 0px transparent)} 40%{filter:drop-shadow(0 0 22px rgba(255,220,80,0.70))} 100%{filter:drop-shadow(0 0 6px rgba(200,180,60,0.25))} }
  @keyframes rc_sparkle { 0%{opacity:0;transform:scale(0) rotate(0deg)} 22%{opacity:1;transform:scale(1) rotate(18deg)} 78%{opacity:0.75;transform:scale(0.85) rotate(42deg)} 100%{opacity:0;transform:scale(0.1) rotate(65deg)} }
`

export default function RitualCompletion({
  need, beforeHealth, displayHealth, vitalityGain = 5, vitalityTotal = 10,
  isMobile = false, onContinue, gardenSettings,
}) {
  const from   = beforeHealth ?? displayHealth
  const to     = displayHealth ?? from

  // État animé de la santé (part de `from`, arrive à `to`)
  const [animHealth, setAnimHealth] = useState(from)
  // Carte visible après que l'animation est bien engagée
  const [cardVisible, setCardVisible] = useState(false)
  // Halo doré au pic de la transition (1 s, visuel seulement)
  const [glowing,    setGlowing]    = useState(false)
  // Déclenche harpe + scintillements — reste true une fois activé
  const [celebrated, setCelebrated] = useState(false)
  // Modal visible (fade-in)
  const [modalIn, setModalIn] = useState(false)

  const [sparkles, setSparkles] = useState([])

  const rafRef              = useRef(null)
  const startRef            = useRef(null)
  const sparkleTRef         = useRef(null)
  const sparkleTriggeredRef = useRef(false)
  const harpeTriggeredRef   = useRef(false)

  useEffect(() => {
    // 1. Fade-in du modal (fleur + partie basse ensemble)
    const t0 = setTimeout(() => { setModalIn(true); setCardVisible(true) }, 60)

    // 2. Démarrage de l'animation de croissance
    const GROW_DELAY    = 500   // ms après montage
    const GROW_DURATION = 2200  // ms

    const t1 = setTimeout(() => {
      startRef.current = performance.now()

      function tick(now) {
        const elapsed = now - startRef.current
        const progress = Math.min(1, elapsed / GROW_DURATION)
        const eased = easeOutCubic(progress)
        setAnimHealth(from + (to - from) * eased)

        // Harpe + scintillements dès 10%
        if (progress >= 0.10 && !harpeTriggeredRef.current) {
          harpeTriggeredRef.current = true
          setCelebrated(true)
        }

        // Premier burst de scintillements à 35%
        if (progress >= 0.35 && !sparkleTriggeredRef.current) {
          sparkleTriggeredRef.current = true
          setSparkles(generateSparkles(12))
        }

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          setGlowing(true)
          setSparkles(generateSparkles(22))
          setTimeout(() => setGlowing(false), 1000)
          sparkleTRef.current = setTimeout(() => setSparkles([]), 2400)
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }, GROW_DELAY)

    return () => {
      clearTimeout(t0); clearTimeout(t1)
      if (sparkleTRef.current) clearTimeout(sparkleTRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const needId  = need?.id || 'stress'
  const stage   = getStage(to)                           // stade final pour les textes
  const texts   = COMPLETION_TEXTS[needId]?.[stage] || COMPLETION_TEXTS.stress.sprout
  const gs      = gardenSettings || DEFAULT_GARDEN_SETTINGS

  // Badge stade animé — change quand animHealth franchit un seuil
  const currentStage = getStage(animHealth)

  const inner = (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      {/* ── Moitié haute : PlantSVG ── */}
      <div style={{
        flex: isMobile ? '0 0 42%' : '0 0 52%',
        position:'relative', overflow:'hidden', minHeight:0,
        transition: glowing ? 'none' : undefined,
      }}>
        <div style={{
          width:'100%', height:'100%',
          animation: glowing ? 'rc_glow .9s ease forwards' : 'none',
        }}>
          <PlantSVG
            health={animHealth}
            gardenSettings={gs}
            clearSky={true}
            celebrate={celebrated}
          />
        </div>

        {/* Badge stade — suit l'état courant pendant l'animation */}
        <div style={{
          position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)',
          fontSize:10, letterSpacing:'.18em', textTransform:'uppercase',
          color:'rgba(255,255,255,0.95)', fontFamily:"'Jost',sans-serif", fontWeight:600,
          background:'rgba(0,0,0,0.28)', backdropFilter:'blur(6px)',
          padding:'4px 14px', borderRadius:20, whiteSpace:'nowrap',
          border:'1px solid rgba(255,255,255,0.20)',
          transition:'opacity 0.4s ease',
        }}>
          {STAGE_LABELS[currentStage]}
        </div>

        {/* Scintillements */}
        {sparkles.map(s => (
          <div key={s.id} style={{
            position:'absolute', pointerEvents:'none',
            left:`${s.x}%`, top:`${s.y}%`,
            width:s.size, height:s.size,
            borderRadius:'50%',
            background:s.color,
            boxShadow:`0 0 ${(s.size*0.9).toFixed(1)}px ${s.color}, 0 0 ${(s.size*2).toFixed(1)}px ${s.color}88`,
            transformOrigin:'center center',
            animation:`rc_sparkle ${s.dur}ms ease-out ${s.delay}ms both`,
          }}/>
        ))}
      </div>

      {/* ── Moitié basse : texte + vitalité + bouton ── */}
      <div style={{
        flex:1, minHeight:0,
        overflowY:'auto', WebkitOverflowScrolling:'touch',
        background:'radial-gradient(circle at 50% 0%, #f5efe6, #e8dfd2 70%, #e0d4c0)',
        padding: isMobile
          ? `18px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)`
          : '24px 30px 28px',
        display:'flex', flexDirection:'column', alignItems:'center',
        textAlign:'center',
        opacity: cardVisible ? 1 : 0,
        transform: cardVisible ? 'translateY(0)' : 'translateY(10px)',
        transition:'opacity 0.55s ease, transform 0.55s ease',
      }}>
        <p style={{
          fontFamily:"'Cormorant Garamond',Georgia,serif",
          fontStyle:'italic', fontWeight:600,
          fontSize: isMobile ? 19 : 26,
          color:'#000', margin:'0 0 8px', lineHeight:1.25,
        }}>
          {texts.title}
        </p>

        <p style={{
          fontFamily:"'Jost',sans-serif", fontWeight:300,
          fontSize: isMobile ? 13 : 15,
          color:'#000', margin: isMobile ? '0 0 14px' : '0 0 20px', lineHeight:1.6,
          maxWidth:360,
        }}>
          {texts.body}
        </p>

        {/* Bulle de vitalité */}
        {(() => {
          const sz = isMobile ? 88 : 106
          const pct = Math.min(100, vitalityTotal)
          const filled = pct / 100 * 270
          const c = d => Math.min(filled, d)
          const arc = `conic-gradient(from -135deg, #5eae78 0deg, #90c83e ${c(120)}deg, #d4aa22 ${c(200)}deg, #c87840 ${filled}deg, rgba(255,255,255,0.06) ${filled}deg, rgba(255,255,255,0.06) 270deg, transparent 270deg)`
          return (
            <div style={{ width:sz, height:sz, borderRadius:'50%', background:arc, padding:isMobile?6:8, boxSizing:'border-box', margin: isMobile ? '0 auto 16px' : '0 auto 22px' }}>
              <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'rgba(16,11,7,0.92)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1 }}>
                <span style={{ fontFamily:"'Jost',sans-serif", fontSize:7, fontWeight:600, letterSpacing:'0.15em', color:'rgba(255,255,255,0.42)', textTransform:'uppercase' }}>Vitalité</span>
                <span style={{ fontFamily:"'Jost',sans-serif", fontSize: isMobile ? 22 : 26, fontWeight:700, color:'#fff', lineHeight:1.05 }}>{pct}%</span>
                {vitalityGain > 0 && (
                  <span style={{ fontFamily:"'Jost',sans-serif", fontSize:8, fontWeight:500, color:'rgba(144,200,62,0.78)', marginTop:1 }}>+{vitalityGain}%</span>
                )}
              </div>
            </div>
          )
        })()}

        <button
          onClick={onContinue}
          style={{
            display:'block', width:'100%', maxWidth:340,
            padding:'15px 24px',
            background:'linear-gradient(135deg,#5e8456 0%,#4a7040 100%)',
            color:'#fff', border:'none', borderRadius:50,
            fontFamily:"'Jost',sans-serif", fontWeight:600,
            fontSize:16, letterSpacing:'.04em', cursor:'pointer',
            boxShadow:'0 6px 20px rgba(74,112,64,0.38)',
            transition:'transform .15s ease, box-shadow .15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 26px rgba(74,112,64,0.50)' }}
          onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(74,112,64,0.38)' }}
        >
          Continuer
        </button>
      </div>
    </div>
  )

  // ── Mobile : plein écran ──
  if (isMobile) return (
    <>
      <style>{CSS}</style>
      <div style={{
        position:'fixed', inset:0, zIndex:300,
        display:'flex', flexDirection:'column',
        opacity: modalIn ? 1 : 0, transition:'opacity 0.55s ease',
      }}>
        {inner}
      </div>
    </>
  )

  // ── Desktop : modal centré ──
  return (
    <>
      <style>{CSS}</style>
      <div style={{
        position:'fixed', inset:0, zIndex:300,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <div style={{
          position:'absolute', inset:0,
          background:'rgba(20,12,5,0.58)', backdropFilter:'blur(8px)',
        }} />
        <div style={{
          position:'relative', zIndex:1,
          width:'min(560px, 95vw)',
          maxHeight:'92vh',
          borderRadius:24, overflow:'hidden',
          boxShadow:'0 32px 80px rgba(0,0,0,0.35)',
          display:'flex', flexDirection:'column',
          animation: modalIn ? 'rc_in .45s cubic-bezier(0.16,1,0.3,1) both' : 'none',
        }}>
          {inner}
        </div>
      </div>
    </>
  )
}
