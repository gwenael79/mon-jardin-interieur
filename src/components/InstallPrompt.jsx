// src/components/InstallPrompt.jsx
import { useState, useEffect } from 'react'

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone === true

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show,           setShow]           = useState(false)
  const [showIOS,        setShowIOS]        = useState(false)
  const [animOut,        setAnimOut]        = useState(false)
  const [isMobile,       setIsMobile]       = useState(window.innerWidth < 768)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (isInStandaloneMode) return
    const dismissed = localStorage.getItem('pwa_dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      window._installPrompt = e  // partagé avec EngagementModals
      const visits = parseInt(localStorage.getItem('pwa_visits') || '0') + 1
      localStorage.setItem('pwa_visits', String(visits))
      if (visits >= 3) setTimeout(() => setShow(true), 2000)
      else setTimeout(() => setShow(true), 45000)
    }
    window.addEventListener('beforeinstallprompt', handler)

    if (isIOS) {
      const visits = parseInt(localStorage.getItem('pwa_visits') || '0') + 1
      localStorage.setItem('pwa_visits', String(visits))
      if (visits >= 2) setTimeout(() => setShowIOS(true), 5000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('pwa_dismissed', String(Date.now()))
    setAnimOut(true)
    setTimeout(() => { setShow(false); setShowIOS(false); setAnimOut(false) }, 400)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    dismiss()
  }

  if (!show && !showIOS) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@300;400;500&display=swap');

        @keyframes ipSlideUp   { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ipSlideDown { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(40px)} }
        @keyframes ipSlideIn   { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ipSlideOut  { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(40px)} }
        @keyframes ipFloat     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes ipShimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }

        /* ── MOBILE : bottom-sheet ── */
        .ip-backdrop-mobile {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.50);
          backdrop-filter: blur(6px);
          z-index: 9990;
          display: flex; align-items: flex-end; justify-content: center;
        }
        .ip-card-mobile {
          width: 100%;
          background: var(--card, var(--bg));
          border: 1px solid rgba(var(--green-rgb), 0.20);
          border-bottom: none;
          border-radius: 24px 24px 0 0;
          padding: 8px 20px calc(20px + env(safe-area-inset-bottom, 0px));
          font-family: var(--font-body, 'Jost', sans-serif);
          position: relative; overflow: hidden;
          animation: ipSlideUp .45s cubic-bezier(.22,1,.36,1) both;
          box-sizing: border-box;
        }
        .ip-card-mobile.out { animation: ipSlideDown .35s ease both; }

        /* ── DESKTOP : carte flottante bas-droite ── */
        .ip-card-desktop {
          position: fixed; bottom: 24px; right: 24px;
          width: min(380px, calc(100vw - 32px));
          background: var(--card, var(--bg));
          border: 1px solid rgba(var(--green-rgb), 0.22);
          border-radius: 20px;
          padding: 20px 20px 16px;
          font-family: var(--font-body, 'Jost', sans-serif);
          z-index: 9990;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(var(--green-rgb), 0.08);
          animation: ipSlideIn .4s cubic-bezier(.22,1,.36,1) both;
        }
        .ip-card-desktop.out { animation: ipSlideOut .3s ease both; }

        .ip-handle {
          width: 36px; height: 3px; border-radius: 100px;
          background: rgba(var(--text-rgb), 0.15);
          margin: 10px auto 20px;
        }

        /* ── Desktop header ── */
        .ip-desktop-header {
          display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
          position: relative; z-index: 1;
        }
        .ip-desktop-title {
          font-family: var(--font-serif, 'Cormorant Garamond', serif);
          font-size: 22px; font-weight: 400; line-height: 1.2;
          color: var(--text);
        }
        .ip-desktop-title em { font-style: italic; color: var(--green); }
        .ip-desktop-close {
          position: absolute; top: 0; right: 0;
          background: none; border: none; cursor: pointer;
          color: rgba(var(--text-rgb), 0.30); font-size: 16px; line-height: 1;
          padding: 4px; transition: color .2s;
        }
        .ip-desktop-close:hover { color: rgba(var(--text-rgb), 0.65); }

        .ip-desktop-desc {
          font-size: 14px; font-weight: 400;
          color: var(--text2); line-height: 1.6;
          margin-bottom: 14px; font-style: italic;
          position: relative; z-index: 1;
        }

        .ip-desktop-features {
          display: flex; flex-direction: column; gap: 8px;
          margin-bottom: 16px; position: relative; z-index: 1;
        }
        .ip-desktop-feature {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px;
          background: rgba(var(--text-rgb), 0.04);
          border: 1px solid rgba(var(--text-rgb), 0.08);
          border-radius: 10px;
          font-size: 14px; color: var(--text2);
        }
        .ip-desktop-feature span:first-child { font-size: 18px; }

        /* ── Lutin centré mobile ── */
        .ip-lutin-wrap {
          display: flex; justify-content: center;
          margin-bottom: 2px; position: relative; z-index: 1;
        }
        .ip-lutin {
          width: 160px; height: auto;
          filter: drop-shadow(0 4px 16px rgba(120,80,40,0.22));
          animation: ipFloat 3.5s ease-in-out infinite;
        }

        .ip-title {
          font-family: var(--font-serif, 'Cormorant Garamond', serif);
          font-size: clamp(26px, 7vw, 32px); font-weight: 400; line-height: 1.2;
          color: var(--text);
          text-align: center; margin-bottom: 8px;
          position: relative; z-index: 1;
        }
        .ip-title em { font-style: italic; color: var(--green); }

        .ip-subtitle {
          font-size: 15px; font-weight: 400;
          color: var(--text2);
          text-align: center; line-height: 1.6;
          margin-bottom: 18px; font-style: italic;
          position: relative; z-index: 1;
        }

        .ip-features {
          display: flex; flex-direction: column; gap: 8px;
          margin-bottom: 18px; position: relative; z-index: 1;
        }
        .ip-feature {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          background: rgba(var(--text-rgb), 0.05);
          border: 1px solid rgba(var(--text-rgb), 0.10);
          border-radius: 12px;
        }
        .ip-feature-icon {
          font-size: 20px; flex-shrink: 0;
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(var(--green-rgb), 0.12);
          border: 1px solid rgba(var(--green-rgb), 0.22);
          display: flex; align-items: center; justify-content: center;
        }
        .ip-feature-text { font-size: 14px; font-weight: 400; color: var(--text2); line-height: 1.4; }
        .ip-feature-text strong { display: block; font-weight: 600; color: var(--text); font-size: 15px; margin-bottom: 2px; }

        .ip-btn-install {
          width: 100%; padding: 16px;
          border: none; border-radius: 14px; cursor: pointer;
          font-family: var(--font-body, 'Jost', sans-serif);
          font-size: 15px; font-weight: 600; letter-spacing: .06em;
          color: var(--bg);
          background: linear-gradient(270deg, var(--green), color-mix(in srgb, var(--green) 75%, white), var(--green));
          background-size: 200% auto;
          animation: ipShimmer 3s linear infinite;
          box-shadow: 0 6px 24px rgba(var(--green-rgb), 0.28);
          transition: transform .2s, box-shadow .2s;
          margin-bottom: 6px;
          position: relative; z-index: 1;
          -webkit-tap-highlight-color: transparent;
        }
        .ip-btn-install:active { transform: scale(0.98); }

        .ip-btn-later {
          width: 100%; padding: 12px;
          border: none; background: transparent; cursor: pointer;
          font-family: var(--font-body, 'Jost', sans-serif);
          font-size: 12px; font-weight: 300; letter-spacing: .04em;
          color: rgba(var(--text-rgb), 0.35); transition: color .2s;
          position: relative; z-index: 1;
          -webkit-tap-highlight-color: transparent;
        }
        .ip-btn-later:active { color: rgba(var(--text-rgb), 0.60); }

        /* iOS guide */
        .ip-ios-guide {
          background: rgba(var(--text-rgb), 0.04);
          border: 1px solid rgba(var(--text-rgb), 0.09);
          border-radius: 12px; padding: 12px;
          margin-bottom: 16px; position: relative; z-index: 1;
        }
        .ip-ios-step {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 7px 0;
          border-bottom: 1px solid rgba(var(--text-rgb), 0.07);
        }
        .ip-ios-step:last-child { border-bottom: none; padding-bottom: 0; }
        .ip-ios-num {
          width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
          background: rgba(var(--green-rgb), 0.12);
          border: 1px solid rgba(var(--green-rgb), 0.28);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 600; color: var(--green); margin-top: 1px;
        }
        .ip-ios-text { font-size: 12px; color: var(--text2); line-height: 1.5; }
        .ip-ios-text strong { color: var(--text); }

        /* ── Lutin desktop dans le header ── */
        .ip-desktop-lutin {
          width: 140px; height: auto;
          position: absolute; left: -40px; bottom: -40px;
          filter: drop-shadow(0 2px 10px rgba(120,80,40,0.25));
          animation: ipFloat 3.5s ease-in-out infinite;
        }

        @media (max-width: 380px) {
          .ip-card-mobile { padding-left: 16px; padding-right: 16px; }
          .ip-title { font-size: 24px; }
          .ip-subtitle { font-size: 14px; margin-bottom: 14px; }
          .ip-features { gap: 6px; margin-bottom: 14px; }
          .ip-lutin { width: 130px; }
        }
      `}</style>

      {isMobile ? (
        /* ══ MOBILE : bottom-sheet ══ */
        <div className="ip-backdrop-mobile" onClick={dismiss}>
          <div className={`ip-card-mobile ${animOut ? 'out' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="ip-handle" />
            <div className="ip-lutin-wrap">
              <img src="/lutin-gauche.png" alt="Félin, le lutin des forêts" className="ip-lutin" />
            </div>
            <div className="ip-title">Plante ton <em>jardin</em><br />sur ton téléphone</div>
            <div className="ip-subtitle">Retrouve ton espace intérieur en un geste, chaque jour.</div>

            <div className="ip-features">
              {[
                { icon:'🌱', title:'Accès instantané',  desc:'Sans navigateur, en un geste' },
                { icon:'🔔', title:'Rappels doux',       desc:'Rituels quotidiens à ton rythme' },
                { icon:'✨', title:'Toujours avec toi',  desc:'Ton espace intérieur, partout' },
              ].map(({ icon, title, desc }) => (
                <div className="ip-feature" key={title}>
                  <div className="ip-feature-icon">{icon}</div>
                  <div className="ip-feature-text"><strong>{title}</strong>{desc}</div>
                </div>
              ))}
            </div>

            {showIOS && (
              <div className="ip-ios-guide">
                <div className="ip-ios-step"><div className="ip-ios-num">1</div><div className="ip-ios-text">Appuie sur <strong>Partager</strong> ⎙ en bas de Safari</div></div>
                <div className="ip-ios-step"><div className="ip-ios-num">2</div><div className="ip-ios-text">Choisis <strong>"Sur l'écran d'accueil"</strong></div></div>
                <div className="ip-ios-step"><div className="ip-ios-num">3</div><div className="ip-ios-text">Appuie sur <strong>"Ajouter"</strong></div></div>
              </div>
            )}

            {!showIOS && <button className="ip-btn-install" onClick={handleInstall}>🌿 &nbsp; Installer l'application</button>}
            <button className="ip-btn-later" onClick={dismiss}>{showIOS ? 'Fermer' : 'Plus tard'}</button>
          </div>
        </div>
      ) : (
        /* ══ DESKTOP : carte flottante bas-droite ══ */
        <div className={`ip-card-desktop ${animOut ? 'out' : ''}`}>
          <div className="ip-desktop-header">
            <img src="/lutin-gauche.png" alt="Félin" className="ip-desktop-lutin" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img src="/icons/logo.png" alt="" style={{ width: 72, height: 72, borderRadius: 16, border: '1px solid rgba(var(--green-rgb),0.25)', marginBottom: 8, display: 'block' }} />
              <div className="ip-desktop-title">Mon <em>Jardin</em> Intérieur</div>
            </div>
            <button className="ip-desktop-close" onClick={dismiss}>✕</button>
          </div>

          <div className="ip-desktop-desc">
            Installe l'application pour un accès rapide à ton jardin.
          </div>

          <div className="ip-desktop-features">
            {[
              { icon:'🌱', label:'Accès rapide depuis le bureau' },
              { icon:'🔔', label:'Notifications de rituels' },
              { icon:'✨', label:'Toujours avec toi, partout' },
            ].map(({ icon, label }) => (
              <div className="ip-desktop-feature" key={label}>
                <span>{icon}</span><span>{label}</span>
              </div>
            ))}
          </div>

          <button className="ip-btn-install" onClick={handleInstall}>
            Installer l'application
          </button>
          <button className="ip-btn-later" onClick={dismiss}>Plus tard</button>
        </div>
      )}
    </>
  )
}
