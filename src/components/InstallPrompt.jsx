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
        @keyframes ipGlow      { 0%,100%{opacity:.4} 50%{opacity:.9} }
        @keyframes ipShimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes ipFadeIn    { from{opacity:0} to{opacity:1} }

        /* ── MOBILE : bottom-sheet ── */
        .ip-backdrop-mobile {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(6px);
          z-index: 9990;
          display: flex; align-items: flex-end; justify-content: center;
        }
        .ip-card-mobile {
          width: 100%; max-width: 480px;
          background: linear-gradient(160deg, var(--bg) 0%, var(--bg2) 60%, var(--bg3) 100%);
          border: 1px solid rgba(var(--green-rgb), 0.18);
          border-bottom: none;
          border-radius: 28px 28px 0 0;
          padding: 10px 28px 40px;
          font-family: 'Jost', sans-serif;
          position: relative; overflow: hidden;
          animation: ipSlideUp .45s cubic-bezier(.22,1,.36,1) both;
        }
        .ip-card-mobile.out { animation: ipSlideDown .35s ease both; }

        /* ── DESKTOP : carte flottante bas-droite ── */
        .ip-card-desktop {
          position: fixed; bottom: 28px; right: 28px;
          width: 320px;
          background: linear-gradient(160deg, var(--bg) 0%, var(--bg2) 60%, var(--bg3) 100%);
          border: 1px solid rgba(var(--green-rgb), 0.22);
          border-radius: 20px;
          padding: 22px 22px 18px;
          font-family: 'Jost', sans-serif;
          z-index: 9990;
          box-shadow: 0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(var(--green-rgb), 0.08);
          animation: ipSlideIn .4s cubic-bezier(.22,1,.36,1) both;
        }
        .ip-card-desktop.out { animation: ipSlideOut .3s ease both; }

        /* ── Grain commun ── */
        .ip-card-mobile::before, .ip-card-desktop::before {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.5; border-radius: inherit;
        }

        .ip-handle {
          width: 36px; height: 3px; border-radius: 100px;
          background: rgba(255,255,255,0.15);
          margin: 14px auto 24px;
        }

        /* ── Desktop header ── */
        .ip-desktop-header {
          display: flex; align-items: center; gap: 12px; margin-bottom: 14px;
          position: relative; z-index: 1;
        }
        .ip-desktop-logo {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          border: 1px solid rgba(var(--green-rgb), 0.25);
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }
        .ip-desktop-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px; font-weight: 300; line-height: 1.2;
          color: rgba(var(--text-on-dark-rgb), 0.95);
        }
        .ip-desktop-title em { font-style: italic; color: var(--green); }
        .ip-desktop-close {
          position: absolute; top: 0; right: 0;
          background: none; border: none; cursor: pointer;
          color: rgba(var(--text-on-dark-rgb), 0.25); font-size: 16px; line-height: 1;
          padding: 0; transition: color .2s;
        }
        .ip-desktop-close:hover { color: rgba(var(--text-on-dark-rgb), 0.6); }

        .ip-desktop-desc {
          font-size: 12px; font-weight: 300;
          color: rgba(var(--text-on-dark-rgb), 0.45); line-height: 1.6;
          margin-bottom: 14px; font-style: italic;
          position: relative; z-index: 1;
        }

        .ip-desktop-features {
          display: flex; flex-direction: column; gap: 7px;
          margin-bottom: 16px; position: relative; z-index: 1;
        }
        .ip-desktop-feature {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; color: rgba(var(--text-on-dark-rgb), 0.65);
        }
        .ip-desktop-feature span:first-child { font-size: 14px; }

        /* ── Logo centré mobile ── */
        .ip-logo-wrap { display: flex; justify-content: center; margin-bottom: 18px; position: relative; z-index: 1; }
        .ip-logo {
          width: 68px; height: 68px; border-radius: 18px;
          border: 1px solid rgba(var(--green-rgb), 0.25);
          box-shadow: 0 0 0 6px rgba(var(--green-rgb), 0.05), 0 12px 40px rgba(0,0,0,0.4);
          animation: ipFloat 3.5s ease-in-out infinite;
        }

        .ip-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 300; line-height: 1.2;
          color: rgba(var(--text-on-dark-rgb), 0.95);
          text-align: center; margin-bottom: 8px;
          position: relative; z-index: 1;
        }
        .ip-title em { font-style: italic; color: var(--green); }

        .ip-subtitle {
          font-size: 13px; font-weight: 300;
          color: rgba(var(--text-on-dark-rgb), 0.45);
          text-align: center; line-height: 1.7;
          margin-bottom: 22px; font-style: italic;
          position: relative; z-index: 1;
        }

        .ip-features {
          display: flex; flex-direction: column; gap: 9px;
          margin-bottom: 22px; position: relative; z-index: 1;
        }
        .ip-feature {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 11px;
        }
        .ip-feature-icon {
          font-size: 18px; flex-shrink: 0;
          width: 34px; height: 34px; border-radius: 9px;
          background: rgba(var(--green-rgb), 0.08);
          border: 1px solid rgba(var(--green-rgb), 0.15);
          display: flex; align-items: center; justify-content: center;
        }
        .ip-feature-text { font-size: 12.5px; font-weight: 400; color: rgba(var(--text-on-dark-rgb), 0.75); line-height: 1.4; }
        .ip-feature-text strong { display: block; font-weight: 500; color: rgba(var(--text-on-dark-rgb), 0.90); margin-bottom: 1px; }

        .ip-btn-install {
          width: 100%; padding: 15px;
          border: none; border-radius: 12px; cursor: pointer;
          font-family: 'Jost', sans-serif;
          font-size: 13px; font-weight: 500; letter-spacing: .06em;
          color: var(--bg2);
          background: linear-gradient(270deg, var(--green), color-mix(in srgb, var(--green) 75%, white), var(--green));
          background-size: 200% auto;
          animation: ipShimmer 3s linear infinite;
          box-shadow: 0 8px 28px rgba(var(--green-rgb), 0.22);
          transition: transform .2s, box-shadow .2s;
          margin-bottom: 8px;
          position: relative; z-index: 1;
        }
        .ip-btn-install:hover { transform: translateY(-1px); box-shadow: 0 12px 36px rgba(var(--green-rgb), 0.32); }

        .ip-btn-later {
          width: 100%; padding: 11px;
          border: none; background: transparent; cursor: pointer;
          font-family: 'Jost', sans-serif;
          font-size: 11px; font-weight: 300; letter-spacing: .04em;
          color: rgba(var(--text-on-dark-rgb), 0.25); transition: color .2s;
          position: relative; z-index: 1;
        }
        .ip-btn-later:hover { color: rgba(var(--text-on-dark-rgb), 0.50); }

        /* iOS guide */
        .ip-ios-guide { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px; margin-bottom: 18px; position: relative; z-index: 1; }
        .ip-ios-step { display: flex; align-items: flex-start; gap: 10px; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .ip-ios-step:last-child { border-bottom: none; padding-bottom: 0; }
        .ip-ios-num { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; background: rgba(var(--green-rgb), 0.15); border: 1px solid rgba(var(--green-rgb), 0.3); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; color: var(--green); margin-top: 1px; }
        .ip-ios-text { font-size: 12px; color: rgba(var(--text-on-dark-rgb), 0.65); line-height: 1.5; }
        .ip-ios-text strong { color: rgba(var(--text-on-dark-rgb), 0.90); }
      `}</style>

      {isMobile ? (
        /* ══ MOBILE : bottom-sheet ══ */
        <div className="ip-backdrop-mobile" onClick={dismiss}>
          <div className={`ip-card-mobile ${animOut ? 'out' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="ip-handle" />
            <div className="ip-logo-wrap">
              <img src="/icons/icon-192.png" alt="Mon Jardin Intérieur" className="ip-logo" />
            </div>
            <div className="ip-title">Plante ton <em>jardin</em><br />sur ton téléphone</div>
            <div className="ip-subtitle">Retrouve ton espace intérieur en un geste, chaque jour.</div>

            <div className="ip-features">
              {[
                { icon:'🌱', title:'Accès instantané',     desc:'Sans navigateur, en un geste' },
                { icon:'🔔', title:'Rappels doux',          desc:'Rituels quotidiens à ton rythme' },
                { icon:'🌿', title:'Fonctionne hors ligne', desc:'Ton espace, même sans connexion' },
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
            <img src="/icons/icon-192.png" alt="" className="ip-desktop-logo" />
            <div>
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
              { icon:'🌿', label:'Fonctionne hors ligne' },
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
