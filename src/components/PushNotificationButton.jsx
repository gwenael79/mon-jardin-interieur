// components/PushNotificationButton.jsx
import { useState, useEffect } from 'react'
import { usePushNotification } from '../hooks/usePushNotification'
import { supabase } from '../core/supabaseClient'
import { useGardenSound } from '../hooks/useGardenSound'

const HORAIRES = [
  { id: 'matin',  label: 'Matin',  emoji: '🌅', heure: '08:00' },
  { id: 'midi',   label: 'Midi',   emoji: '☀️', heure: '12:00' },
  { id: 'soir',   label: 'Soir',   emoji: '🌙', heure: '20:00' },
]

const SONS = [
  { id: 'chime', label: 'Carillon zen',  emoji: '🔔' },
  { id: 'drop',  label: 'Goutte d\'eau', emoji: '💧' },
  { id: 'wind',  label: 'Souffle doux',  emoji: '🌬️' },
]

export default function PushNotificationButton({ userId, compact = false }) {
  const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotification(userId)
  const { playChime, playPulse, playDrop } = useGardenSound()
  const [showModal, setShowModal] = useState(false)
  const [prefs, setPrefs] = useState({ horaires: ['soir'], son: 'chime' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Charger les préférences existantes
  useEffect(() => {
    if (!userId || !showModal) return
    supabase.from('push_subscriptions')
      .select('horaires, son')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.horaires || data?.son) {
          setPrefs({
            horaires: data.horaires ?? ['soir'],
            son:      data.son      ?? 'chime',
          })
        }
      })
  }, [userId, showModal])

  const playSound = (id) => {
    if (id === 'chime') playChime()
    if (id === 'drop')  playDrop()
    if (id === 'wind')  playPulse()
  }

  const toggleHoraire = (id) => {
    setPrefs(p => {
      const already = p.horaires.includes(id)
      // Au moins 1 horaire si abonné
      if (already && p.horaires.length === 1) return p
      return { ...p, horaires: already ? p.horaires.filter(h => h !== id) : [...p.horaires, id] }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    if (!isSubscribed) await subscribe()
    // Sauvegarder les préfs dans la colonne json de push_subscriptions
    await supabase.from('push_subscriptions')
      .update({ horaires: prefs.horaires, son: prefs.son })
      .eq('user_id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); setShowModal(false) }, 1200)
  }

  const handleDisable = async () => {
    await unsubscribe()
    setShowModal(false)
  }

  const handlePreview = async () => {
    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return
    }
    const sw = await navigator.serviceWorker.ready
    sw.showNotification('Mon Jardin Intérieur', {
      body: 'Ton jardin t\'attend… prends un moment pour toi aujourd\'hui.',
      icon: '/icons/logo.png',
      badge: '/icons/icon-192.png',
    })
  }

  // iOS Safari ne supporte pas les push en dehors de la PWA installée
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  if (isIOS && !isStandalone) return null

  if (!isSupported) return null
  if (permission === 'denied') return null

  return (
    <>
      {/* ── Bouton discret ── */}
      <div
        onClick={() => setShowModal(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: compact ? '2px 0' : '8px 12px',
          borderRadius: 8, cursor: 'pointer',
          background: 'transparent', transition: 'background .2s',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => { if (!compact) e.currentTarget.style.background = 'var(--surface-2)' }}
        onMouseLeave={e => { if (!compact) e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ fontSize: compact ? 12 : 14 }}>{isSubscribed ? '🔔' : '🔕'}</span>
        <span style={{ fontSize: 'var(--fs-h5, 10px)', color: 'var(--text3)', fontFamily: 'Jost,sans-serif' }}>
          {isSubscribed ? 'Notifications' : 'Notifications'}
        </span>
        {isSubscribed && (
          <span style={{ fontSize: 'var(--fs-h5, 10px)', color: 'var(--green)', fontFamily: 'Jost,sans-serif' }}>activées</span>
        )}
      </div>

      {/* ── Modal préférences ── */}
      {showModal && (
        <div
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(20,30,20,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border2)',
            borderRadius: 20, padding: '28px 24px',
            width: '100%', maxWidth: 380,
            fontFamily: 'Jost, sans-serif',
            position: 'relative', overflow: 'hidden',
          }}>
            <style>{`@keyframes lutinFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }`}</style>

            {/* Header : logo gauche | titre centre | lutin droite */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, position: 'relative', gap: 12 }}>
              <img src="/icons/logo.png" alt="" style={{ width: 64, height: 64, borderRadius: 14, border: '1px solid rgba(var(--green-rgb),0.25)', flexShrink: 0 }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 400, color: 'var(--text)' }}>
                  Notifications
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', letterSpacing: '.08em', marginTop: 4 }}>
                  Rappels doux pour votre jardin
                </div>
              </div>
              <img
                src="/lutin-gauche.png"
                alt=""
                style={{
                  width: 80, height: 'auto', flexShrink: 0,
                  filter: 'drop-shadow(0 2px 10px rgba(120,80,40,0.25))',
                  animation: 'lutinFloat 3.5s ease-in-out infinite',
                }}
              />
              <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Horaires */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--text2)', textTransform: 'uppercase', marginBottom: 10 }}>
                Horaire de rappel
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {HORAIRES.map(h => {
                  const active = prefs.horaires.includes(h.id)
                  return (
                    <div
                      key={h.id}
                      onClick={() => toggleHoraire(h.id)}
                      style={{
                        flex: 1, textAlign: 'center', padding: '12px 8px',
                        borderRadius: 12, cursor: 'pointer',
                        background: active ? 'rgba(var(--green-rgb),0.15)' : 'var(--surface-1)',
                        border: `1px solid ${active ? 'rgba(var(--green-rgb),0.4)' : 'var(--border2)'}`,
                        transition: 'all .2s',
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{h.emoji}</div>
                      <div style={{ fontSize: 13, color: active ? '#c8f0b8' : 'rgba(242,237,224,0.5)', fontWeight: active ? 500 : 300 }}>{h.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{h.heure}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 8, fontStyle: 'italic' }}>
                Optionnel — sélectionnez un ou plusieurs créneaux
              </div>
            </div>

            {/* Son */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--text2)', textTransform: 'uppercase', marginBottom: 10 }}>
                Son de notification
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {SONS.map(s => {
                  const active = prefs.son === s.id
                  return (
                    <div
                      key={s.id}
                      onClick={() => { setPrefs(p => ({ ...p, son: s.id })); playSound(s.id) }}
                      style={{
                        flex: 1, textAlign: 'center', padding: '12px 8px',
                        borderRadius: 12, cursor: 'pointer',
                        background: active ? 'rgba(var(--green-rgb),0.15)' : 'var(--surface-1)',
                        border: `1px solid ${active ? 'rgba(var(--green-rgb),0.4)' : 'var(--border2)'}`,
                        transition: 'all .2s',
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{s.emoji}</div>
                      <div style={{ fontSize: 12, color: active ? '#c8f0b8' : 'rgba(242,237,224,0.5)', fontWeight: active ? 500 : 300, lineHeight: 1.3 }}>{s.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                width: '100%', padding: '13px', borderRadius: 100,
                background: saved ? 'rgba(var(--green-rgb),0.3)' : 'rgba(var(--green-rgb),0.2)',
                border: '1px solid rgba(var(--green-rgb),0.4)',
                color: 'var(--green)', fontSize: 14, letterSpacing: '.08em',
                fontFamily: 'Jost,sans-serif', cursor: saving ? 'wait' : 'pointer',
                transition: 'all .2s', marginBottom: 8,
              }}
            >
              {saved ? '✓ Enregistré' : saving ? '…' : isSubscribed ? 'Enregistrer les préférences' : 'Activer les notifications'}
            </button>

            <button
              onClick={handlePreview}
              style={{
                width: '100%', padding: '10px', borderRadius: 100,
                background: 'transparent', border: '1px solid var(--border2)',
                color: 'var(--text2)', fontSize: 12, letterSpacing: '.06em',
                fontFamily: 'Jost,sans-serif', cursor: 'pointer', marginBottom: 8,
              }}
            >
              Prévisualiser la notification
            </button>

            {isSubscribed && (
              <button
                onClick={handleDisable}
                style={{
                  width: '100%', padding: '10px', borderRadius: 100,
                  background: 'transparent', border: '1px solid var(--border2)',
                  color: 'var(--text3)', fontSize: 10, letterSpacing: '.08em',
                  fontFamily: 'Jost,sans-serif', cursor: 'pointer',
                }}
              >
                Désactiver les notifications
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
