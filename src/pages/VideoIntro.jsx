import { useRef, useState } from 'react'

const VIDEOS = [
  '/video/video1.mp4',
]

// Même vidéo toute la journée, tourne chaque jour
function pickVideo() {
  const day = Math.floor(Date.now() / 86_400_000)
  return VIDEOS[day % VIDEOS.length]
}

export function VideoIntro({ onDone }) {
  const src        = pickVideo()
  const videoRef   = useRef(null)
  const [muted,    setMuted]    = useState(true)
  const [exiting,  setExiting]  = useState(false)

  const dismiss = () => {
    if (exiting) return
    setExiting(true)
    setTimeout(onDone, 1600) // 1s pause + 0.6s fondu
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

      {/* Bouton son — disparaît après activation */}
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

      {/* Passer */}
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
