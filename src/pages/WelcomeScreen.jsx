// src/pages/WelcomeScreen.jsx
import { useMemo } from 'react'

const PHRASES_MATIN = [
  'Votre jardin est prêt pour aujourd\'hui.',
  'Un beau jour commence dans votre jardin.',
  'Votre plante n\'attend que vous.',
  'Prenez soin de votre jardin ce matin.',
  'Une belle journée commence ici.',
  'Votre jardin vous tend les bras.',
  'Ce matin, votre jardin grandit avec vous.',
  'Un nouveau départ pour votre jardin intérieur.',
]

const PHRASES_RETOUR = [
  'Chaque retour est une graine plantée.',
  'Votre jardin garde votre place.',
  'La régularité, c\'est déjà un rituel.',
  'Beau de vous revoir par ici.',
  'Votre plante a grandi depuis votre départ.',
  'Chaque visite compte pour votre jardin.',
  'Vous faites du bien à votre jardin en revenant.',
  'Votre présence nourrit votre jardin.',
]

const PHRASES_SOIR = [
  'Une belle façon de finir la journée.',
  'Votre jardin vous attend pour ce soir.',
  'Prenez ce moment pour vous, ce soir.',
  'Un instant de calme dans votre jardin.',
  'Ce soir, votre jardin est là pour vous.',
  'Finissons bien cette journée ensemble.',
  'Votre jardin vous offre un instant de paix.',
]

function getGreeting(firstName, isFirstToday) {
  const hour = new Date().getHours()
  const isMorning = hour >= 5 && hour < 18

  const welcome = isFirstToday ? 'Bonjour' : 'Content de vous revoir'
  const timeGreet = isMorning ? 'Bonjour' : 'Bonsoir'

  // Combinaison naturelle
  if (!isFirstToday) {
    return isMorning
      ? `Content de vous revoir, ${firstName}`
      : `Bonsoir ${firstName}, content de vous revoir`
  }
  return `${timeGreet}, ${firstName}`
}

function getPhrase(isFirstToday) {
  const hour = new Date().getHours()
  const isMorning = hour >= 5 && hour < 18
  const pool = !isFirstToday
    ? PHRASES_RETOUR
    : isMorning ? PHRASES_MATIN : PHRASES_SOIR
  // Stable par demi-journée
  const seed = parseInt(new Date().toISOString().slice(0, 13).replace(/\D/g, ''))
  return pool[seed % pool.length]
}

export function WelcomeScreen({ profile, isFirstToday, onQuick, onFull }) {
  const firstName = (profile?.display_name ?? '').split(' ')[0] || 'ami(e)'
  const greeting  = useMemo(() => getGreeting(firstName, isFirstToday), [firstName, isFirstToday])
  const phrase    = useMemo(() => getPhrase(isFirstToday),              [isFirstToday])

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9998,
      background:'linear-gradient(160deg, #0e1c12 0%, #162a18 55%, #0a1510 100%)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      fontFamily:"'Jost',sans-serif", padding:'32px 28px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');
        @keyframes wcIn    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes wcPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        .wc-a1 { animation: wcIn .5s cubic-bezier(.22,1,.36,1) .0s both }
        .wc-a2 { animation: wcIn .5s cubic-bezier(.22,1,.36,1) .12s both }
        .wc-a3 { animation: wcIn .5s cubic-bezier(.22,1,.36,1) .24s both }
        .wc-a4 { animation: wcIn .5s cubic-bezier(.22,1,.36,1) .36s both }
        .wc-btn:hover { opacity:.88; transform:translateY(-1px) }
        .wc-btn { transition: opacity .18s, transform .18s }
      `}</style>

      <div style={{ maxWidth:440, width:'100%', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>

        {/* Logo */}
        <div className="wc-a1" style={{ marginBottom:28, animation:'wcIn .5s ease both, wcPulse 3.5s ease-in-out .6s infinite' }}>
          <img src="/icons/icon-192.png" alt="logo" style={{ width:72, height:72, mixBlendMode:'screen' }} />
        </div>

        {/* Salutation */}
        <div className="wc-a2" style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize:'clamp(28px,6vw,38px)',
          fontWeight:300, lineHeight:1.15,
          color:'rgba(242,237,224,0.92)',
          marginBottom:10,
        }}>
          {(() => {
            // Colorise le prénom dans le greeting
            const idx = greeting.lastIndexOf(firstName)
            if (idx === -1) return greeting
            return <>
              {greeting.slice(0, idx)}
              <span style={{ color:'#96d485', fontWeight:500 }}>{firstName}</span>
              {greeting.slice(idx + firstName.length)}
            </>
          })()}
        </div>

        {/* Phrase incitative */}
        <div className="wc-a3" style={{
          fontSize:13, fontWeight:300,
          color:'rgba(242,237,224,0.50)',
          fontStyle:'italic', lineHeight:1.7,
          marginBottom:44,
        }}>
          {phrase}
        </div>

        {/* 2 boutons */}
        <div className="wc-a4" style={{ width:'100%', display:'flex', flexDirection:'column', gap:12 }}>

          {/* ⚡ Rapide */}
          <button className="wc-btn" onClick={onQuick} style={{
            width:'100%', padding:'18px 22px', borderRadius:16, cursor:'pointer',
            background:'linear-gradient(135deg,rgba(232,192,96,0.12),rgba(232,192,96,0.06))',
            border:'1px solid rgba(232,192,96,0.28)',
            display:'flex', alignItems:'center', gap:16, textAlign:'left',
            fontFamily:"'Jost',sans-serif",
          }}>
            <span style={{ fontSize:26, flexShrink:0 }}>⚡</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:500, color:'#e8c060', marginBottom:3, letterSpacing:'.02em' }}>
                Je vais vite
              </div>
              <div style={{ fontSize:11.5, fontWeight:300, color:'rgba(242,237,224,0.45)', lineHeight:1.5 }}>
                2 minutes · l'essentiel de mon jardin
              </div>
            </div>
            <span style={{ fontSize:16, color:'rgba(232,192,96,0.40)', flexShrink:0 }}>›</span>
          </button>

          {/* 🌿 Complet */}
          <button className="wc-btn" onClick={onFull} style={{
            width:'100%', padding:'18px 22px', borderRadius:16, cursor:'pointer',
            background:'linear-gradient(135deg,rgba(150,212,133,0.10),rgba(150,212,133,0.05))',
            border:'1px solid rgba(150,212,133,0.22)',
            display:'flex', alignItems:'center', gap:16, textAlign:'left',
            fontFamily:"'Jost',sans-serif",
          }}>
            <span style={{ fontSize:26, flexShrink:0 }}>🌿</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:500, color:'#96d485', marginBottom:3, letterSpacing:'.02em' }}>
                Je prends du temps
              </div>
              <div style={{ fontSize:11.5, fontWeight:300, color:'rgba(242,237,224,0.45)', lineHeight:1.5 }}>
                Mon bilan complet · prendre soin de moi
              </div>
            </div>
            <span style={{ fontSize:16, color:'rgba(150,212,133,0.35)', flexShrink:0 }}>›</span>
          </button>
        </div>

      </div>
    </div>
  )
}
