// src/components/EngagementModals.jsx
import { useState, useEffect } from 'react'
import { usePushNotification } from '../hooks/usePushNotification'
import { supabase } from '../core/supabaseClient'

const KEY_NOTIF   = 'mji_notif_asked'
const KEY_INSTALL = 'mji_install_asked'

const NOTIF_TEXTS = {
  1: {
    title: 'Tu peux reprendre ce moment pour toi demain matin.',
    sub:   'Juste un rappel, au bon moment.',
  },
  2: {
    title: "Un petit rappel pour retrouver ce calme demain matin.",
    sub:   'Juste un rappel, au bon moment.',
  },
  3: {
    title: 'On peut continuer ensemble demain matin.',
    sub:   "Juste un rappel, au bon moment.",
  },
}

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
          <svg width="10" height="9" viewBox="0 0 10 9" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 8S1 5.5 1 3a2 2 0 014-1 2 2 0 014 1c0 2.5-4 5-4 5z"/>
          </svg>
        </div>
      </div>
      <span style={{ fontSize: 18, opacity: 0.45 }}>🌿</span>
    </div>
  )
}

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
        // Update ciblé — ne touche pas endpoint/auth/p256dh/horaires/son/platform
        await supabase
          .from('push_subscriptions')
          .update({ consented: true, consent_day: day, consented_at: new Date().toISOString() })
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
    // J1 et J2 : pas de marquage → on repropose au jour suivant
    // J3 : on arrête définitivement
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

        <button
          onClick={handleAccept}
          disabled={state === 'loading'}
          style={{ width: '100%', fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 500, letterSpacing: '0.04em', color: '#fff', background: state === 'loading' ? 'rgba(90,154,46,0.5)' : 'linear-gradient(135deg,#5a9a2e,#3a7a1a)', border: 'none', borderRadius: 100, padding: '14px 28px', cursor: state === 'loading' ? 'default' : 'pointer', marginBottom: 10, boxShadow: '0 6px 22px rgba(60,100,20,.25)' }}
        >
          {state === 'loading' ? '…' : 'Oui, me le rappeler'}
        </button>

        <button
          onClick={handleRefuse}
          style={{ width: '100%', fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 300, color: '#1a1010', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
        >
          Non merci
        </button>
      </div>
    </div>
  )
}

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

  return (
    <div onClick={handleRefuse} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#faf8f2', borderRadius: 20, boxShadow: '0 24px 70px rgba(0,0,0,0.35)', padding: '28px 24px 32px' }}>

        {state === 'done' ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🌿</div>
            <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(20px, 5vw, 26px)', color: '#2a4a18', lineHeight: 1.5, margin: 0 }}>
              Votre jardin est sur votre écran.
            </p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📲</div>
              <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(22px, 5.5vw, 28px)', fontWeight: 400, color: '#2a4a18', lineHeight: 1.45, margin: '0 0 10px' }}>
                Quatre jours. Votre jardin mérite une place sur votre écran.
              </p>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 300, color: '#5a6840', lineHeight: 1.65, margin: 0 }}>
                Retrouvez-le en un geste, chaque matin.
              </p>
            </div>

            <button
              onClick={handleInstall}
              disabled={state === 'loading'}
              style={{ width: '100%', fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 500, letterSpacing: '0.04em', color: '#fff', background: state === 'loading' ? 'rgba(90,154,46,0.5)' : 'linear-gradient(135deg,#5a9a2e,#3a7a1a)', border: 'none', borderRadius: 100, padding: '14px 28px', cursor: state === 'loading' ? 'default' : 'pointer', marginBottom: 10, boxShadow: '0 6px 22px rgba(60,100,20,.25)' }}
            >
              {state === 'loading' ? '…' : 'Ajouter à mon écran'}
            </button>

            <button
              onClick={handleRefuse}
              style={{ width: '100%', fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 300, color: '#1a1010', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
            >
              Pas maintenant
            </button>
          </>
        )}
      </div>
    </div>
  )
}

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
      if (hasJ4 && !installAsked && window._installPrompt) {
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
