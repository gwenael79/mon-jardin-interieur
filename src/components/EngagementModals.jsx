// src/components/EngagementModals.jsx
import { useState, useEffect } from 'react'
import { usePushNotification } from '../hooks/usePushNotification'
import { supabase } from '../core/supabaseClient'

const KEY_NOTIF   = 'mji_notif_asked'
const KEY_INSTALL = 'mji_install_asked'
const isIOS       = /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

const NOTIF_TEXTS = {
  1: { title: 'Tu peux reprendre ce moment pour toi demain matin.', sub: 'Juste un rappel, au bon moment.' },
  2: { title: 'Un petit rappel pour retrouver ce calme demain matin.', sub: 'Juste un rappel, au bon moment.' },
  3: { title: 'On peut continuer ensemble demain matin.', sub: 'Juste un rappel, au bon moment.' },
}

// ── Icône cloche + cœur ───────────────────────────────────────────────────────
function BellIcon() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ fontSize: 18, opacity: 0.45 }}>🌿</span>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(90,120,60,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 4C13.03 4 9 8.03 9 13v7l-2 3h22l-2-3v-7c0-4.97-4.03-9-9-9z" fill="none" stroke="#3a5a20" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M15.5 27a2.5 2.5 0 005 0" stroke="#3a5a20" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div style={{ position: 'absolute', bottom: 12, right: 10, width: 16, height: 16, borderRadius: '50%', background: '#e8a030', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="10" height="9" viewBox="0 0 10 9" fill="white"><path d="M5 8S1 5.5 1 3a2 2 0 014-1 2 2 0 014 1c0 2.5-4 5-4 5z"/></svg>
        </div>
      </div>
      <span style={{ fontSize: 18, opacity: 0.45 }}>🌿</span>
    </div>
  )
}

// ── Illustration téléphone ─────────────────────────────────────────────────────
function PhoneIllustration() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 20px' }}>
      <div style={{ position: 'relative', width: 160, height: 120 }}>
        <div style={{
          width: 140, height: 110, border: '2.5px solid rgba(90,120,60,0.30)',
          borderRadius: 16, background: 'rgba(90,120,60,0.05)',
          position: 'absolute', right: 0, top: 0,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)', gap: 6, padding: '14px 10px 10px',
          boxSizing: 'border-box',
        }}>
          <div style={{ position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)', width: 30, height: 3, borderRadius: 2, background: 'rgba(90,120,60,0.20)' }} />
          {Array(7).fill(0).map((_, i) => (
            <div key={i} style={{ background: 'rgba(90,120,60,0.10)', borderRadius: 8 }} />
          ))}
        </div>
        <div style={{
          position: 'absolute', left: 0, bottom: 8,
          width: 44, height: 44, borderRadius: 10,
          background: '#fff', boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          <img src="/icons/logo.png" alt="" style={{ width: 36, height: 36, borderRadius: 7, objectFit: 'cover' }} />
        </div>
        <svg style={{ position: 'absolute', left: 36, bottom: 18 }} width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M4 28 C8 16, 20 8, 32 12" stroke="rgba(90,120,60,0.50)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          <path d="M28 8 L32 12 L27 14" stroke="rgba(90,120,60,0.50)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
        <div style={{ position: 'absolute', left: 30, bottom: 52, fontSize: 10, color: 'rgba(90,120,60,0.50)', letterSpacing: -2 }}>✦ ✦</div>
      </div>
    </div>
  )
}

// ── Modal notifications ───────────────────────────────────────────────────────
function NotifModal({ userId, day, onClose }) {
  const { subscribe } = usePushNotification(userId)
  const [state, setState] = useState('idle')
  const texts = NOTIF_TEXTS[day] ?? NOTIF_TEXTS[1]

  async function handleAccept() {
    setState('loading')
    try {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        await subscribe()
        await supabase
          .from('push_subscriptions')
          .update({ consented: true, consent_day: day, consented_at: new Date().toISOString(), horaires: ['matin'], timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
          .eq('user_id', userId)
      }
      localStorage.setItem(KEY_NOTIF, 'true')
      onClose()
    } catch (_) {
      localStorage.setItem(KEY_NOTIF, 'true')
      onClose()
    }
  }

  function handleRefuse() {
    if (day >= 3) localStorage.setItem(KEY_NOTIF, 'true')
    onClose()
  }

  return (
    <div onClick={handleRefuse} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#faf8f2', borderRadius: 20, boxShadow: '0 24px 70px rgba(0,0,0,0.35)', padding: '28px 24px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <BellIcon />
          <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(22px, 5.5vw, 28px)', fontWeight: 400, color: '#2a4a18', lineHeight: 1.45, margin: '0 0 10px' }}>
            {texts.title}
          </p>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 300, color: '#5a6840', lineHeight: 1.65, margin: 0 }}>
            {texts.sub}
          </p>
        </div>
        <button onClick={handleAccept} disabled={state === 'loading'} style={{ width: '100%', fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 500, letterSpacing: '0.04em', color: '#fff', background: state === 'loading' ? 'rgba(90,154,46,0.5)' : 'linear-gradient(135deg,#5a9a2e,#3a7a1a)', border: 'none', borderRadius: 100, padding: '14px 28px', cursor: state === 'loading' ? 'default' : 'pointer', marginBottom: 10, boxShadow: '0 6px 22px rgba(60,100,20,.25)' }}>
          {state === 'loading' ? '…' : 'Oui, me le rappeler'}
        </button>
        <button onClick={handleRefuse} style={{ width: '100%', fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 300, color: '#1a1010', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
          Non merci
        </button>
      </div>
    </div>
  )
}

// ── Modal install PWA — J4 ─────────────────────────────────────────────────────
function InstallModal({ onClose }) {
  const [state, setState] = useState('idle')

  async function handleInstall() {
    const prompt = window._installPrompt
    if (!prompt) { localStorage.setItem(KEY_INSTALL, 'true'); onClose(); return }
    setState('loading')
    try {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      window._installPrompt = null
      localStorage.setItem(KEY_INSTALL, 'true')
      if (outcome === 'accepted') { setState('done'); setTimeout(() => onClose(), 1800) }
      else onClose()
    } catch (_) { localStorage.setItem(KEY_INSTALL, 'true'); onClose() }
  }

  function handleRefuse() {
    localStorage.setItem(KEY_INSTALL, 'true')
    onClose()
  }

  if (isIOS && isStandalone) return null

  const FEATURES = [
    { icon: '🍃', title: 'Accès rapide',  sub: 'en un geste'        },
    { icon: '☀️', title: 'Votre rituel',  sub: 'chaque matin'       },
    { icon: '🛡️', title: 'Votre jardin', sub: 'toujours avec vous'  },
  ]

  return (
    <div onClick={handleRefuse} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: '#f5f2eb', borderRadius: 24, boxShadow: '0 24px 70px rgba(0,0,0,0.35)', overflow: 'hidden' }}>

        {state === 'done' ? (
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <img src="/icons/logo.png" alt="" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 16 }} />
            <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(20px, 5vw, 26px)', color: '#2a4a18', lineHeight: 1.5, margin: 0 }}>
              Votre jardin est sur votre écran.
            </p>
          </div>
        ) : (
          <>
            {/* Header logo */}
            <div style={{ textAlign: 'center', padding: '28px 24px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src="/icons/logo.png" alt="" style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover' }} />
              </div>
              <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: 600, color: '#2a3a18', lineHeight: 1.4, margin: '0 0 6px' }}>
                {isIOS ? "Ajoutez l'app à votre écran d'accueil." : 'Quatre jours.\nVotre jardin mérite une place sur votre écran.'}
              </p>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 300, color: '#6a7a50', lineHeight: 1.6, margin: 0 }}>
                Retrouvez-le en un geste, chaque matin.
              </p>
            </div>

            {/* Illustration ou guide iOS */}
            {isIOS ? (
              <div style={{ margin: '16px 24px', background: 'rgba(90,120,60,0.07)', borderRadius: 14, padding: '14px 16px' }}>
                {[
                  { n: '1', text: <span>Appuyez sur <strong>Partager</strong> ⎙ en bas de Safari</span> },
                  { n: '2', text: <span>Choisissez <strong>"Sur l'écran d'accueil"</strong></span> },
                  { n: '3', text: <span>Appuyez sur <strong>"Ajouter"</strong></span> },
                ].map(({ n, text }) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: n !== '3' ? '1px solid rgba(90,120,60,0.12)' : 'none' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(90,120,60,0.15)', border: '1px solid rgba(90,120,60,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#3a5a20', fontFamily: 'Jost, sans-serif' }}>{n}</div>
                    <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, color: '#3a4a30', lineHeight: 1.5, margin: 0 }}>{text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <PhoneIllustration />
            )}

            {/* Boutons */}
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={isIOS ? handleRefuse : handleInstall}
                disabled={state === 'loading'}
                style={{ width: '100%', fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 600, letterSpacing: '0.04em', color: '#fff', background: state === 'loading' ? 'rgba(60,100,30,0.5)' : '#3a6a1a', border: 'none', borderRadius: 100, padding: '15px 28px', cursor: state === 'loading' ? 'default' : 'pointer', boxShadow: '0 6px 22px rgba(60,100,20,.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {!isIOS && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                )}
                {state === 'loading' ? '…' : isIOS ? 'Fermer' : 'Ajouter à mon écran'}
              </button>
              {!isIOS && (
                <button onClick={handleRefuse} style={{ width: '100%', fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 400, color: '#4a5a38', background: 'rgba(90,120,60,0.10)', border: 'none', borderRadius: 100, padding: '13px 28px', cursor: 'pointer' }}>
                  Pas maintenant
                </button>
              )}
            </div>

            {/* Features */}
            <div style={{ display: 'flex', margin: '20px 16px 24px', borderTop: '1px solid rgba(90,120,60,0.12)', paddingTop: 16 }}>
              {FEATURES.map((f, i) => (
                <div key={f.title} style={{ flex: 1, textAlign: 'center', padding: '0 4px', borderRight: i < 2 ? '1px solid rgba(90,120,60,0.12)' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(90,120,60,0.10)', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{f.icon}</div>
                  <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, fontWeight: 600, color: '#2a3a18', margin: '0 0 2px' }}>{f.title}</p>
                  <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 300, color: '#6a7a50', margin: 0 }}>{f.sub}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Orchestrateur ─────────────────────────────────────────────────────────────
export function EngagementModals({ completedDays = [], userId }) {
  const [active,   setActive]   = useState(null)
  const [notifDay, setNotifDay] = useState(1)

  useEffect(() => {
    const notifAsked   = localStorage.getItem(KEY_NOTIF)   === 'true'
    const installAsked = localStorage.getItem(KEY_INSTALL) === 'true'

    const hasJ1 = completedDays.includes(1)
    const hasJ2 = completedDays.includes(2)
    const hasJ3 = completedDays.includes(3)
    const hasJ4 = completedDays.includes(4)

    const t = setTimeout(() => {
      if (hasJ4 && !installAsked && (window._installPrompt || isIOS)) {
        setActive('install')
        return
      }
      if (!notifAsked) {
        if (hasJ3)      { setNotifDay(3); setActive('notif') }
        else if (hasJ2) { setNotifDay(2); setActive('notif') }
        else if (hasJ1) { setNotifDay(1); setActive('notif') }
      }
    }, 1500)

    return () => clearTimeout(t)
  }, [completedDays])

  if (active === 'notif')
    return <NotifModal userId={userId} day={notifDay} onClose={() => setActive(null)} />

  if (active === 'install')
    return <InstallModal onClose={() => setActive(null)} />

  return null
}
