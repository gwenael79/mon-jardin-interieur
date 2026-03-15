// src/components/InstallPrompt.jsx
// Invitation à installer la PWA — style Mon Jardin Intérieur
// Intégration : <InstallPrompt /> dans App.jsx (après le routing principal)

import { useState, useEffect } from 'react'

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone === true

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show,           setShow]           = useState(false)
  const [showIOS,        setShowIOS]        = useState(false)
  const [installed,      setInstalled]      = useState(false)
  const [animOut,        setAnimOut]        = useState(false)

  useEffect(() => {
    // Déjà installée ou déjà refusée récemment → ne pas afficher
    if (isInStandaloneMode) return
    const dismissed = localStorage.getItem('pwa_dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    // Android / Chrome — événement natif
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Afficher après 45 secondes ou 3ème visite
      const visits = parseInt(localStorage.getItem('pwa_visits') || '0') + 1
      localStorage.setItem('pwa_visits', String(visits))
      if (visits >= 3) {
        setTimeout(() => setShow(true), 2000)
      } else {
        setTimeout(() => setShow(true), 45000)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS — guide manuel
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
    if (outcome === 'accepted') setInstalled(true)
    setDeferredPrompt(null)
    dismiss()
  }

  if (!show && !showIOS) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@300;400;500&display=swap');

        @keyframes ipSlideUp   { from { opacity:0; transform:translateY(40px) } to { opacity:1; transform:translateY(0) } }
        @keyframes ipSlideDown { from { opacity:1; transform:translateY(0) } to { opacity:0; transform:translateY(40px) } }
        @keyframes ipFloat     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes ipGlow      { 0%,100%{opacity:.4} 50%{opacity:.9} }
        @keyframes ipShimmer   {
          0%   { background-position: -200% center }
          100% { background-position:  200% center }
        }

        .ip-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(6px);
          z-index: 9990;
          display: flex; align-items: flex-end; justify-content: center;
          padding: 0 0 env(safe-area-inset-bottom, 0);
        }

        .ip-card {
          width: 100%; max-width: 480px;
          background: linear-gradient(160deg, #0f2212 0%, #0a1a0c 60%, #060d07 100%);
          border: 1px solid rgba(150,212,133,0.18);
          border-bottom: none;
          border-radius: 28px 28px 0 0;
          padding: 10px 28px 40px;
          font-family: 'Jost', sans-serif;
          position: relative; overflow: hidden;
          animation: ipSlideUp .45s cubic-bezier(.22,1,.36,1) both;
        }

        .ip-card.out { animation: ipSlideDown .35s ease both; }

        /* Grain texture */
        .ip-card::before {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.5;
        }

        /* Lueur verte en haut */
        .ip-card::after {
          content: '';
          position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
          width: 200px; height: 120px;
          background: radial-gradient(ellipse, rgba(150,212,133,0.12), transparent 70%);
          pointer-events: none;
          animation: ipGlow 4s ease-in-out infinite;
        }

        .ip-handle {
          width: 36px; height: 3px; border-radius: 100px;
          background: rgba(255,255,255,0.15);
          margin: 14px auto 28px;
        }

        .ip-logo-wrap {
          display: flex; justify-content: center; margin-bottom: 20px;
        }

        .ip-logo {
          width: 72px; height: 72px; border-radius: 20px;
          border: 1px solid rgba(150,212,133,0.25);
          box-shadow: 0 0 0 6px rgba(150,212,133,0.05), 0 12px 40px rgba(0,0,0,0.4);
          animation: ipFloat 3.5s ease-in-out infinite;
        }

        .ip-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 300; line-height: 1.2;
          color: rgba(242,237,224,0.95);
          text-align: center; margin-bottom: 10px;
        }

        .ip-title em {
          font-style: italic; color: #96d485;
        }

        .ip-subtitle {
          font-size: 13px; font-weight: 300;
          color: rgba(242,237,224,0.45);
          text-align: center; line-height: 1.7;
          margin-bottom: 28px;
          font-style: italic;
        }

        .ip-features {
          display: flex; flex-direction: column; gap: 10px;
          margin-bottom: 28px;
        }

        .ip-feature {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
        }

        .ip-feature-icon {
          font-size: 20px; flex-shrink: 0;
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(150,212,133,0.08);
          border: 1px solid rgba(150,212,133,0.15);
          display: flex; align-items: center; justify-content: center;
        }

        .ip-feature-text {
          font-size: 13px; font-weight: 400;
          color: rgba(242,237,224,0.75);
          line-height: 1.4;
        }

        .ip-feature-text strong {
          display: block; font-weight: 500;
          color: rgba(242,237,224,0.90);
          margin-bottom: 1px;
        }

        .ip-btn-install {
          width: 100%; padding: 17px;
          border: none; border-radius: 14px; cursor: pointer;
          font-family: 'Jost', sans-serif;
          font-size: 14px; font-weight: 500; letter-spacing: .06em;
          color: #0a1a0c;
          background: linear-gradient(270deg, #96d485, #b8e8a8, #96d485);
          background-size: 200% auto;
          animation: ipShimmer 3s linear infinite;
          box-shadow: 0 8px 32px rgba(150,212,133,0.25);
          transition: transform .2s, box-shadow .2s;
          margin-bottom: 10px;
        }

        .ip-btn-install:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 40px rgba(150,212,133,0.35);
        }

        .ip-btn-later {
          width: 100%; padding: 13px;
          border: none; background: transparent; cursor: pointer;
          font-family: 'Jost', sans-serif;
          font-size: 12px; font-weight: 300; letter-spacing: .04em;
          color: rgba(242,237,224,0.28);
          transition: color .2s;
        }

        .ip-btn-later:hover { color: rgba(242,237,224,0.50); }

        /* ── Guide iOS ── */
        .ip-ios-guide {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 16px;
          margin-bottom: 20px;
        }

        .ip-ios-step {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .ip-ios-step:last-child { border-bottom: none; padding-bottom: 0; }

        .ip-ios-num {
          width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
          background: rgba(150,212,133,0.15); border: 1px solid rgba(150,212,133,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600; color: #96d485;
          margin-top: 1px;
        }

        .ip-ios-text {
          font-size: 13px; color: rgba(242,237,224,0.65); line-height: 1.5;
        }

        .ip-ios-text strong { color: rgba(242,237,224,0.90); }
      `}</style>

      <div className="ip-backdrop" onClick={dismiss}>

        <div className={`ip-card ${animOut ? 'out' : ''}`} onClick={e => e.stopPropagation()}>
          <div className="ip-handle" />

          {/* Logo */}
          <div className="ip-logo-wrap">
            <img src="/icons/icon-192.png" alt="Mon Jardin Intérieur" className="ip-logo" />
          </div>

          {/* Titre */}
          <div className="ip-title">
            Plante ton <em>jardin</em><br />sur ton téléphone
          </div>
          <div className="ip-subtitle">
            Retrouve ton espace intérieur en un geste, chaque jour.
          </div>

          {/* Features */}
          <div className="ip-features">
            {[
              { icon:'🌱', title:'Accès instantané',     desc:'Ouvre ton jardin sans navigateur' },
              { icon:'🔔', title:'Rappels doux',          desc:'Rituels quotidiens à ton rythme' },
              { icon:'🌿', title:'Fonctionne hors ligne', desc:'Ton espace, même sans connexion' },
            ].map(({ icon, title, desc }) => (
              <div className="ip-feature" key={title}>
                <div className="ip-feature-icon">{icon}</div>
                <div className="ip-feature-text">
                  <strong>{title}</strong>
                  {desc}
                </div>
              </div>
            ))}
          </div>

          {/* Guide iOS */}
          {showIOS && (
            <div className="ip-ios-guide">
              <div className="ip-ios-step">
                <div className="ip-ios-num">1</div>
                <div className="ip-ios-text">Appuie sur le bouton <strong>Partager</strong> <span style={{fontSize:16}}>⎙</span> en bas de Safari</div>
              </div>
              <div className="ip-ios-step">
                <div className="ip-ios-num">2</div>
                <div className="ip-ios-text">Choisis <strong>"Sur l'écran d'accueil"</strong></div>
              </div>
              <div className="ip-ios-step">
                <div className="ip-ios-num">3</div>
                <div className="ip-ios-text">Appuie sur <strong>"Ajouter"</strong> en haut à droite</div>
              </div>
            </div>
          )}

          {/* Boutons */}
          {!showIOS && (
            <button className="ip-btn-install" onClick={handleInstall}>
              🌿 &nbsp; Installer l'application
            </button>
          )}

          <button className="ip-btn-later" onClick={dismiss}>
            {showIOS ? 'Fermer' : 'Plus tard'}
          </button>
        </div>
      </div>
    </>
  )
}
