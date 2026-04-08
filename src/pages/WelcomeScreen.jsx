// src/pages/WelcomeScreen.jsx
import { useMemo, useEffect } from 'react'

function getGreeting(firstName, isNewUser) {
  const h = new Date().getHours()
  if (isNewUser) return 'Bienvenue,'
  if (h >= 0 && h < 18) return 'Bonjour,'
  return 'Bonsoir,'
}

const PHRASES = {
  new: [
    'Votre jardin intérieur vient de naître.',
    'Un nouvel espace pour prendre soin de vous.',
    'Votre voyage intérieur commence ici.',
  ],
  matin: [
    'Votre jardin est prêt pour aujourd\'hui.',
    'Un beau jour commence dans votre jardin.',
    'Votre plante n\'attend que vous.',
    'Prenez soin de votre jardin ce matin.',
    'Ce matin, votre jardin grandit avec vous.',
  ],
  soir: [
    'Une belle façon de finir la journée.',
    'Ce soir, votre jardin est là pour vous.',
    'Un instant de calme dans votre jardin.',
    'Votre jardin vous offre un instant de paix.',
    'Finissons bien cette journée ensemble.',
  ],
}

export function WelcomeScreen({ profile, isNewUser, onDone, prefetchDone }) {
  const firstName = (profile?.display_name ?? '').split(' ')[0] || ''
  const h         = new Date().getHours()
  const timeKey   = isNewUser ? 'new' : (h >= 0 && h < 18 ? 'matin' : 'soir')
  const greeting  = useMemo(() => getGreeting(firstName, isNewUser), [firstName, isNewUser])

  const phrase = useMemo(() => {
    const pool = PHRASES[timeKey]
    const day  = parseInt(new Date().toISOString().slice(0,10).replace(/-/g,''))
    return pool[day % pool.length]
  }, [timeKey])

  // Se ferme quand le prefetch IA est terminé (min 2s garanti côté dashboard)
  // Fallback : 8s max si prefetchDone n'arrive jamais
  useEffect(() => {
    if (prefetchDone) {
      const timer = setTimeout(() => onDone?.(), 600) // léger délai pour la transition
      return () => clearTimeout(timer)
    }
  }, [prefetchDone])

  useEffect(() => {
    const fallback = setTimeout(() => onDone?.(), 8000)
    return () => clearTimeout(fallback)
  }, [])

  return (
    <div
      onClick={() => onDone?.()}
      style={{
        position:'fixed', inset:0, zIndex:9998,
        background:'linear-gradient(160deg,#f8f4ec,#e8f0d8)',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        fontFamily:"'Jost',sans-serif", padding:'32px 28px',
        cursor:'pointer',
      }}>
      <img src="/fond1.png" alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', opacity:.55 }}/>
      <div style={{ position:'absolute', inset:0, background:'rgba(248,244,234,.40)' }}/>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');
        @keyframes wcIn    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes wcPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes wcFadeOut { from{opacity:1} to{opacity:0} }
        .wc-a1 { animation: wcIn .5s cubic-bezier(.22,1,.36,1) .0s both }
        .wc-a2 { animation: wcIn .5s cubic-bezier(.22,1,.36,1) .2s both }
        .wc-a3 { animation: wcIn .5s cubic-bezier(.22,1,.36,1) .4s both }
      `}</style>

      <div style={{ maxWidth:440, width:'100%', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div className="wc-a1" style={{ marginBottom:32, animation:'wcIn .5s ease both, wcPulse 3.5s ease-in-out .6s infinite' }}>
          <img src="/icons/icon-192.png" alt="logo" style={{ width:80, height:80, borderRadius:'50%', boxShadow:'0 4px 20px rgba(60,100,20,.18)' }} />
        </div>

        {/* Salutation */}
        <div className="wc-a2" style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize:'clamp(32px,7vw,48px)',
          fontWeight:300, lineHeight:1.1,
          color:'#0f2a08',
          marginBottom:firstName ? 6 : 16,
        }}>
          {greeting}
          {firstName && (
            <span style={{ color:'var(--green)', fontWeight:500, display:'block' }}>{firstName}</span>
          )}
        </div>

        {/* Phrase */}
        <div className="wc-a3" style={{
          fontSize:'var(--fs-h3, 15px)', fontWeight:300,
          color:'rgba(15,42,8,.62)',
          fontStyle:'italic', lineHeight:1.7,
        }}>
          {phrase}
        </div>

      </div>
    </div>
  )
}
