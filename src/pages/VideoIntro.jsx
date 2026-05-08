import { useRef, useState } from 'react'

const VIDEOS = [
  '/video/video1.mp4',
  '/video/video2.mp4',
  '/video/video3.mp4',
  '/video/video4.mp4',
  '/video/video5.mp4',
  '/video/video6.mp4',
  '/video/video7.mp4',
  '/video/video8.mp4',
  '/video/video9.mp4',
  '/video/video10.mp4',
  '/video/video11.mp4',
  '/video/video12.mp4',
  '/video/video13.mp4',
  '/video/video14.mp4',
  '/video/video15.mp4',
  '/video/video16.mp4',
  '/video/video17.mp4',
  '/video/video18.mp4',
  '/video/video19.mp4',
  '/video/video20.mp4',
]

const MIN_GAP      = 5   // jours minimum avant de revoir la même vidéo
const HISTORY_KEY  = uid => `video_intro_history__${uid}`

function pickVideo(userId) {
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

export function VideoIntro({ userId, onDone }) {
  // Appel unique à l'initialisation du composant
  const [src]      = useState(() => pickVideo(userId))
  const videoRef   = useRef(null)
  const [muted,    setMuted]    = useState(true)
  const [exiting,  setExiting]  = useState(false)

  const dismiss = () => {
    if (exiting) return
    setExiting(true)
    setTimeout(onDone, 600)
  }

  const handleEnded = () => {
    if (exiting) return
    setTimeout(() => {
      setExiting(true)
      setTimeout(onDone, 600)
    }, 10000)
  }

  const handleSound = () => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    v.muted = false
    v.play()
    setMuted(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0a1205',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity:    exiting ? 0 : 1,
      transition: exiting ? 'opacity 0.6s ease' : 'opacity 0.5s ease',
      animation:  exiting ? 'none' : 'viIntroIn 0.5s ease both',
    }}>
      <style>{`@keyframes viIntroIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        playsInline
        style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', display: 'block' }}
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
    </div>
  )
}
