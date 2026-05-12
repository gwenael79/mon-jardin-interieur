import { useRef, useState, useEffect, useCallback } from 'react'

// src   : chemin dans public/video/
// delay : ms entre la fin de la vidéo et le fondu sortant
const VIDEOS = [
  { src: '/video/video1.mp4',  delay: 10000 },
  { src: '/video/video2.mp4',  delay: 0 },
  { src: '/video/video3.mp4',  delay: 0 },
  { src: '/video/video4.mp4',  delay: 0 },
  { src: '/video/video5.mp4',  delay: 0 },
  { src: '/video/video6.mp4',  delay: 0 },
  { src: '/video/video7.mp4',  delay: 0 },
  { src: '/video/video8.mp4',  delay: 0 },
  { src: '/video/video9.mp4',  delay: 0 },
  { src: '/video/video10.mp4', delay: 0 },
  { src: '/video/video11.mp4', delay: 0 },
  { src: '/video/video12.mp4', delay: 0 },
  { src: '/video/video13.mp4', delay: 0 },
  { src: '/video/video14.mp4', delay: 0 },
  { src: '/video/video15.mp4', delay: 0 },
  { src: '/video/video16.mp4', delay: 0 },
  { src: '/video/video17.mp4', delay: 0 },
  { src: '/video/video18.mp4', delay: 0 },
  { src: '/video/video19.mp4', delay: 0 },
  { src: '/video/video20.mp4', delay: 0 },
]

const MIN_GAP = 5  // jours minimum avant de revoir la même vidéo
const HISTORY_KEY  = uid => `video_intro_history__${uid}`

export function pickVideo(userId) {
  if (import.meta.env.DEV) return VIDEOS[0]

  let history = []
  try { history = JSON.parse(localStorage.getItem(HISTORY_KEY(userId)) || '[]') } catch { /* */ }

  // Indices des vidéos diffusées lors des MIN_GAP derniers jours
  const recentSet = new Set(history.slice(-MIN_GAP))

  // Pool : toutes les vidéos sauf celles trop récentes
  const pool = VIDEOS
    .map((_, i) => i)
    .filter(i => !recentSet.has(i))

  // Fallback si le pool est vide (< MIN_GAP vidéos dispo)
  const eligible = pool.length > 0 ? pool : VIDEOS.map((_, i) => i)

  const idx = eligible[Math.floor(Math.random() * eligible.length)]

  // Sauvegarde l'historique (on ne garde que les MIN_GAP dernières entrées)
  history.push(idx)
  if (history.length > MIN_GAP) history = history.slice(-MIN_GAP)
  try { localStorage.setItem(HISTORY_KEY(userId), JSON.stringify(history)) } catch { /* */ }

  return VIDEOS[idx]
}

// video : objet { src, delay } pré-sélectionné par DashboardV2 (déjà chargé)
export function VideoIntro({ video, withSound = false, onDone }) {
  const videoRef   = useRef(null)
  const [muted,    setMuted]    = useState(!withSound)
  const [visible,  setVisible]  = useState(false)
  const [ready,    setReady]    = useState(false)
  const [fading,   setFading]   = useState(false)  // cache la vidéo pendant la transition
  const [whiteOut, setWhiteOut] = useState(false)

  // Fondu entrant du conteneur dès le montage
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  // useCallback vide = appelé une seule fois au montage, jamais sur les re-renders
  const setVideoRef = useCallback((el) => {
    videoRef.current = el
    if (el) el.muted = !withSound
  }, [withSound])

  const audioFadingRef = useRef(false)

  // Fondu audio sur les 3 dernières secondes de lecture (pendant que l'audio joue encore)
  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v || v.muted || audioFadingRef.current || !v.duration) return
    const timeLeft = v.duration - v.currentTime
    if (timeLeft > 3) return

    audioFadingRef.current = true
    const STEP_MS   = 50
    const totalSteps = Math.round((timeLeft * 1000) / STEP_MS)
    const startVol   = v.volume
    let   step       = 0

    const timer = setInterval(() => {
      const el = videoRef.current
      if (!el || step >= totalSteps) { clearInterval(timer); return }
      el.volume = Math.max(0, startVol * (1 - step / totalSteps))
      step++
    }, STEP_MS)
  }

  const dismiss = () => {
    if (whiteOut) return
    // Fondu audio rapide (0.5s) puis voile blanc
    const v = videoRef.current
    if (v && !v.muted && v.volume > 0) {
      const STEP_MS = 50
      const steps   = Math.round(500 / STEP_MS)
      const start   = v.volume
      let   s       = 0
      const timer   = setInterval(() => {
        const el = videoRef.current
        if (!el || s >= steps) { clearInterval(timer); return }
        el.volume = Math.max(0, start * (1 - s / steps))
        s++
      }, STEP_MS)
      setTimeout(() => { setFading(true); setWhiteOut(true); setTimeout(onDone, 800) }, 500)
    } else {
      setFading(true); setWhiteOut(true); setTimeout(onDone, 800)
    }
  }

  const handleEnded = () => {
    if (whiteOut) return
    setTimeout(() => { setFading(true); setWhiteOut(true); setTimeout(onDone, 800) }, video.delay)
  }

  const handleSound = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = false   // DOM direct — React ne réappliquera plus muted
    v.currentTime = 0
    v.play()
    setMuted(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0a1205',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Spinner affiché tant que la vidéo n'est pas prête */}
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.15)',
            borderTop: '2px solid rgba(255,255,255,0.55)',
            animation: 'viSpin 0.9s linear infinite',
          }} />
          <style>{`@keyframes viSpin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      <video
        ref={setVideoRef}
        src={video.src}
        autoPlay
        playsInline
        style={{
          maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', display: 'block',
          opacity: (!fading && ready) ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
        onCanPlay={() => setReady(true)}
        onError={() => onDone()}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {muted && (
        <button
          onClick={handleSound}
          style={{
            position: 'absolute', bottom: 88, left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.28)',
            borderRadius: 40, padding: '13px 30px',
            color: '#fff', fontSize: 15, cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            fontFamily: "'Jost', sans-serif",
            letterSpacing: '.03em',
            whiteSpace: 'nowrap',
          }}
        >
          🔊 Activer le son
        </button>
      )}

      <button
        onClick={dismiss}
        style={{
          position: 'absolute', bottom: 26, right: 22,
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.38)', fontSize: 13,
          cursor: 'pointer',
          fontFamily: "'Jost', sans-serif",
          letterSpacing: '.05em',
        }}
      >
        Passer →
      </button>

      {/* Voile noir d'entrée — se dissipe au chargement */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#000',
        opacity: visible ? 0 : 1,
        transition: 'opacity 0.7s ease',
        pointerEvents: 'none',
      }} />

      {/* Voile blanc de sortie */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#fff',
        opacity: whiteOut ? 1 : 0,
        transition: 'opacity 0.8s ease',
        pointerEvents: 'none',
      }} />
    </div>
  )
}
