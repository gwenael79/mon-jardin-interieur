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
        onMouseEnter={e => { if (!compact) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
        onMouseLeave={e => { if (!compact) e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ fontSize: compact ? 12 : 14 }}>{isSubscribed ? '🔔' : '🔕'}</span>
        <span style={{ fontSize: 10, color: 'rgba(242,237,224,0.45)', fontFamily: 'Jost,sans-serif' }}>
          {isSubscribed ? 'Notifications' : 'Notifications'}
        </span>
        {isSubscribed && (
          <span style={{ fontSize: 9, color: 'rgba(150,212,133,0.6)', fontFamily: 'Jost,sans-serif' }}>activées</span>
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
            background: '#1a2a1a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '28px 24px',
            width: '100%', maxWidth: 360,
            fontFamily: 'Jost, sans-serif',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 300, color: '#f2ede0' }}>
                  Notifications
                </div>
                <div style={{ fontSize: 10, color: 'rgba(242,237,224,0.35)', letterSpacing: '.08em', marginTop: 2 }}>
                  RAPPELS DOUX POUR VOTRE JARDIN
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(242,237,224,0.3)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Horaires */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: '.1em', color: 'rgba(242,237,224,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>
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
                        background: active ? 'rgba(150,212,133,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? 'rgba(150,212,133,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        transition: 'all .2s',
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{h.emoji}</div>
                      <div style={{ fontSize: 11, color: active ? '#c8f0b8' : 'rgba(242,237,224,0.5)', fontWeight: active ? 500 : 300 }}>{h.label}</div>
                      <div style={{ fontSize: 9, color: 'rgba(242,237,224,0.25)', marginTop: 2 }}>{h.heure}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(242,237,224,0.2)', marginTop: 8, fontStyle: 'italic' }}>
                Optionnel — sélectionnez un ou plusieurs créneaux
              </div>
            </div>

            {/* Son */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: '.1em', color: 'rgba(242,237,224,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>
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
                        background: active ? 'rgba(150,212,133,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? 'rgba(150,212,133,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        transition: 'all .2s',
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{s.emoji}</div>
                      <div style={{ fontSize: 10, color: active ? '#c8f0b8' : 'rgba(242,237,224,0.5)', fontWeight: active ? 500 : 300, lineHeight: 1.3 }}>{s.label}</div>
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
                background: saved ? 'rgba(150,212,133,0.3)' : 'rgba(150,212,133,0.2)',
                border: '1px solid rgba(150,212,133,0.4)',
                color: '#c8f0b8', fontSize: 11, letterSpacing: '.08em',
                fontFamily: 'Jost,sans-serif', cursor: saving ? 'wait' : 'pointer',
                transition: 'all .2s', marginBottom: 8,
              }}
            >
              {saved ? '✓ Enregistré' : saving ? '…' : isSubscribed ? 'Enregistrer les préférences' : 'Activer les notifications'}
            </button>

            {isSubscribed && (
              <button
                onClick={handleDisable}
                style={{
                  width: '100%', padding: '10px', borderRadius: 100,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(242,237,224,0.25)', fontSize: 10, letterSpacing: '.08em',
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
