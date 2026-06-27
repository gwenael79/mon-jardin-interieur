import { useState, useRef, useEffect } from 'react'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

@keyframes prpFadeUp   { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
@keyframes prpPulse    { 0%,100% { transform:scale(1) } 50% { transform:scale(1.06) } }
@keyframes prpSlideUp  { from { opacity:0; transform:scale(.94) translateY(16px) } to { opacity:1; transform:scale(1) translateY(0) } }
@keyframes prpWaveOut  { 0% { transform:scale(.42); opacity:1 } 60% { opacity:.55 } 100% { transform:scale(2.2); opacity:0 } }

/* ── ROOT — plein écran avec fond ── */
.prp-root {
  position: fixed; inset: 0;
  font-family: 'Jost', sans-serif;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.prp-bg {
  position: absolute; inset: 0; z-index: 0;
}
.prp-bg img {
  width: 100%; height: 100%;
  object-fit: cover; object-position: center top;
}
.prp-bg::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(160deg, rgba(252,246,240,.88), rgba(224,200,210,.82));
}

/* ── CARD — modal sur desktop, plein écran sur mobile ── */
.prp-card {
  position: relative; z-index: 1;
  width: 100%; max-width: 460px;
  display: flex; flex-direction: column; align-items: center;
  text-align: center;
  padding: 52px 40px 48px;
}

@media (min-width: 769px) {
  .prp-card {
    background: rgba(252,248,244,.97);
    border-radius: 28px;
    box-shadow: 0 24px 80px rgba(0,0,0,.13);
    border: 1px solid rgba(200,180,160,.22);
  }
}

@media (max-width: 768px) {
  .prp-card {
    max-width: 100%;
    min-height: 100vh;
    padding: 56px 28px 52px;
    justify-content: center;
  }
}

/* ── LANDING ── */
.prp-logo {
  width: 68px; height: 68px; border-radius: 50%;
  box-shadow: 0 4px 18px rgba(60,100,20,.16);
  margin-bottom: 22px;
  animation: prpFadeUp .6s ease both, prpPulse 3.5s ease-in-out 1s infinite;
}
.prp-eyebrow {
  font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase;
  color: #c8a0b0; font-weight: 500; margin-bottom: 18px;
  animation: prpFadeUp .6s .06s ease both;
}
.prp-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(34px, 8vw, 50px); font-weight: 300;
  color: #000; line-height: 1.2; margin-bottom: 14px;
  animation: prpFadeUp .6s .12s ease both;
}
.prp-title em { font-style: italic; color: #a07888; }
.prp-sub {
  font-size: 18px; color: #000; line-height: 1.78;
  margin-bottom: 38px; font-weight: 300; max-width: 340px;
  animation: prpFadeUp .6s .18s ease both;
}
.prp-listen-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 38px; border-radius: 100px; border: none;
  background: linear-gradient(135deg, #c8a0b0, #a07888);
  color: #fff; font-family: 'Jost', sans-serif;
  font-size: 15px; font-weight: 500; letter-spacing: .05em;
  cursor: pointer; box-shadow: 0 8px 28px rgba(160,100,130,.30);
  transition: filter .2s, transform .15s;
  margin-bottom: 16px;
  animation: prpFadeUp .6s .26s ease both;
}
.prp-listen-btn:hover  { filter: brightness(1.08); transform: translateY(-2px); }
.prp-listen-btn:active { transform: translateY(0); }
.prp-free-note {
  font-size: 18px; color: #000; letter-spacing: .04em;
  animation: prpFadeUp .6s .34s ease both;
}

/* ── PLAYING — icône son ── */
.prp-sound-wrap {
  position: relative; width: 200px; height: 200px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 36px;
}
.prp-wave-ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 4px solid #c8a0b0;
  box-shadow: 0 0 12px rgba(200,160,176,.45);
  animation: prpWaveOut 2.6s ease-out infinite;
}
.prp-wave-ring:nth-child(2) { animation-delay: .86s; }
.prp-wave-ring:nth-child(3) { animation-delay: 1.72s; }
.prp-speaker-bg {
  position: relative; z-index: 1;
  width: 110px; height: 110px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(200,160,176,.22), rgba(160,120,136,.14));
  border: 2px solid rgba(200,160,176,.42);
  display: flex; align-items: center; justify-content: center;
  animation: prpPulse 2.6s ease-in-out infinite;
}
.prp-playing-label {
  font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase;
  color: #c8a0b0; font-weight: 500; margin-bottom: 10px;
}
.prp-playing-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px; font-weight: 300;
  color: #000; font-style: italic; margin-bottom: 8px;
}
.prp-playing-hint {
  font-size: 18px; color: #000;
  margin-bottom: 44px; letter-spacing: .05em;
}
.prp-progress-wrap { width: 100%; max-width: 270px; }
.prp-progress-bg {
  width: 100%; height: 2px;
  background: rgba(200,160,176,.22);
  border-radius: 4px; overflow: hidden; margin-bottom: 8px;
}
.prp-progress-bar {
  height: 2px;
  background: linear-gradient(90deg, #c8a0b0, #a07888);
  border-radius: 4px; transition: width .8s linear;
}
.prp-time {
  font-size: 18px; color: #000;
  display: flex; justify-content: space-between;
}
.prp-controls {
  display: flex; gap: 14px; justify-content: center;
  margin-top: 28px;
}
.prp-btn-pause {
  display: flex; align-items: center; gap: 8px;
  padding: 13px 30px; border-radius: 100px;
  border: 2px solid #c8a0b0; background: transparent;
  color: #c8a0b0; font-family: 'Jost', sans-serif;
  font-size: 15px; font-weight: 500; cursor: pointer;
  transition: all .2s;
}
.prp-btn-pause:hover { background: rgba(200,160,176,.12); }
.prp-btn-restart {
  display: flex; align-items: center; gap: 8px;
  padding: 13px 30px; border-radius: 100px;
  border: 2px solid rgba(0,0,0,.18); background: transparent;
  color: #000; font-family: 'Jost', sans-serif;
  font-size: 15px; font-weight: 500; cursor: pointer;
  transition: all .2s;
}
.prp-btn-restart:hover { border-color: rgba(0,0,0,.40); }
/* Ondes figées quand en pause */
.prp-sound-wrap--paused .prp-wave-ring { animation-play-state: paused; }
.prp-sound-wrap--paused .prp-speaker-bg { animation-play-state: paused; }

/* ── MODAL FIN ── */
.prp-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,.55); backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: prpFadeUp .3s ease both;
}
.prp-modal {
  background: #faf7f3;
  border: 1px solid rgba(200,180,160,.25);
  border-radius: 28px; width: 100%; max-width: 420px;
  padding: 52px 36px 42px; position: relative; text-align: center;
  box-shadow: 0 28px 80px rgba(0,0,0,.18);
  font-family: 'Jost', sans-serif;
  animation: prpSlideUp .4s cubic-bezier(.22,1,.36,1) both;
}
.prp-modal-close {
  position: absolute; top: 16px; right: 18px;
  width: 30px; height: 30px; border-radius: 50%;
  background: rgba(0,0,0,.06); border: none;
  color: rgba(0,0,0,.32); cursor: pointer; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
  transition: all .18s;
}
.prp-modal-close:hover { background: rgba(0,0,0,.11); color: rgba(0,0,0,.60); }
.prp-modal-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 27px; font-weight: 300;
  color: #000; line-height: 1.28; margin-bottom: 16px;
  animation: prpFadeUp .4s .12s ease both;
}
.prp-modal-title em { font-style: italic; color: #a07888; }
.prp-modal-body {
  font-family: 'Jost', sans-serif;
  font-size: 18px; color: #000; line-height: 1.82;
  margin-bottom: 30px;
  animation: prpFadeUp .4s .18s ease both;
}
.prp-modal-cta {
  width: 100%; padding: 16px; border-radius: 100px; border: none;
  background: linear-gradient(135deg, #5a9a28, #3a7a18);
  color: #fff; font-family: 'Jost', sans-serif;
  font-size: 18px; font-weight: 500; letter-spacing: .04em;
  cursor: pointer; box-shadow: 0 6px 24px rgba(60,120,20,.26);
  transition: filter .2s, transform .15s;
  margin-bottom: 12px;
  animation: prpFadeUp .4s .24s ease both;
}
.prp-modal-cta:hover  { filter: brightness(1.08); transform: translateY(-1px); }
.prp-modal-cta:active { transform: translateY(0); }
.prp-modal-secondary {
  font-family: 'Jost', sans-serif;
  font-size: 18px; color: #000;
  animation: prpFadeUp .4s .30s ease both;
}

/* Mobile : modal en bottom sheet */
@media (max-width: 480px) {
  .prp-modal {
    border-radius: 24px 24px 0 0;
    position: fixed; bottom: 0; left: 0; right: 0;
    max-width: 100%; padding: 36px 24px 48px;
  }
  .prp-overlay { align-items: flex-end; padding: 0; }
}
`

function formatTime(secs) {
  if (!isFinite(secs) || secs < 0) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function PublicRituelPage({ onRegister }) {
  const [state,       setState]       = useState('landing') // 'landing' | 'playing' | 'done'
  const [showModal,   setShowModal]   = useState(false)
  const [paused,      setPaused]      = useState(false)
  const [progress,    setProgress]    = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration,    setDuration]    = useState(0)
  const audioRef = useRef(null)

  useEffect(() => () => { audioRef.current?.pause() }, [])

  function handleListen() {
    const audio = new Audio('/audio/Rituelaccueil.mp3')
    audioRef.current = audio
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime)
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    })
    audio.addEventListener('ended', () => {
      setState('done')
      setShowModal(true)
    })
    audio.play().catch(() => {})
    setState('playing')
    setPaused(false)
  }

  function handlePause() {
    audioRef.current?.pause()
    setPaused(true)
  }

  function handleResume() {
    audioRef.current?.play().catch(() => {})
    setPaused(false)
  }

  function handleRestart() {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    audio.play().catch(() => {})
    setPaused(false)
    setState('playing')
  }

  function handleSignUp() {
    localStorage.setItem('mji_decouverte_done', '1')
    onRegister()
  }

  function handleClose() {
    onRegister()
  }

  return (
    <>
      <style>{css}</style>
      <div className="prp-root">

        <div className="prp-bg">
          <img src="/fond1.png" alt="" />
        </div>

        <div className="prp-card">

          {/* ── LANDING ── */}
          {state === 'landing' && (
            <>
              <img src="/icons/icon-192.png" alt="logo" className="prp-logo" />
              <div className="prp-eyebrow">Mon Jardin Intérieur</div>
              <h1 className="prp-title">
                Un rituel pour<br />retrouver tes <em>racines</em>
              </h1>
              <p className="prp-sub">
                2 minutes offertes pour t'ancrer,<br />
                respirer et revenir à toi.
              </p>
              <button className="prp-listen-btn" onClick={handleListen}>
                <span>🎧</span>
                <span>Écouter le rituel</span>
              </button>
              <p className="prp-free-note">Sans inscription · Gratuit</p>
            </>
          )}

          {/* ── PLAYING ── */}
          {(state === 'playing' || state === 'done') && !showModal && (
            <>
              <img src="/icons/icon-192.png" alt="logo" className="prp-logo" style={{ marginBottom: 24 }} />
              <div className={`prp-sound-wrap${paused ? ' prp-sound-wrap--paused' : ''}`}>
                <div className="prp-wave-ring" />
                <div className="prp-wave-ring" />
                <div className="prp-wave-ring" />
                <div className="prp-speaker-bg">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" fill="#c8a0b0"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="#c8a0b0" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="#c8a0b0" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                  </svg>
                </div>
              </div>
              <div className="prp-playing-label">Rituel d'accueil</div>
              <div className="prp-playing-title">Retrouver ses racines…</div>
              <div className="prp-playing-hint">Ferme les yeux · laisse venir</div>
              <div className="prp-progress-wrap">
                <div className="prp-progress-bg">
                  <div className="prp-progress-bar" style={{ width: `${progress}%` }} />
                </div>
                <div className="prp-time">
                  <span>{formatTime(currentTime)}</span>
                  <span>{duration ? formatTime(duration) : '--:--'}</span>
                </div>
              </div>
              <div className="prp-controls">
                <button className="prp-btn-pause" onClick={paused ? handleResume : handlePause}>
                  {paused ? (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="#c8a0b0"><polygon points="5,3 19,12 5,21"/></svg> Reprendre</>
                  ) : (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="#c8a0b0"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg> Pause</>
                  )}
                </button>
                <button className="prp-btn-restart" onClick={handleRestart}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round">
                    <polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
                  </svg>
                  Recommencer
                </button>
              </div>
            </>
          )}

        </div>

        {/* ── MODAL DE CONVERSION ── */}
        {showModal && (
          <div className="prp-overlay">
            <div className="prp-modal">
              <button className="prp-modal-close" onClick={handleClose}>✕</button>
              <img src="/icons/icon-192.png" alt="logo" className="prp-logo" style={{ marginBottom: 20 }} />
              <h2 className="prp-modal-title">
                Ce que tu viens de ressentir,<br />
                <em>c'est une attention à toi-même.</em>
              </h2>
              <p className="prp-modal-body">
                Mon Jardin Intérieur t'aide à la cultiver chaque jour,
                avec des rituels simples et rapides.<br /><br />
                Si tu le souhaites, viens découvrir l'application.
              </p>
              <button className="prp-modal-cta" onClick={handleSignUp}>
                Créer mon espace · C'est gratuit
              </button>
              <p className="prp-modal-secondary">
                Accès immédiat · Sans carte bancaire
              </p>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
