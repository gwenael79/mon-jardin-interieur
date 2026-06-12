// src/pages/AmbianceChoiceScreen.jsx
import { useState } from 'react'
import { supabase } from '../core/supabaseClient'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@200;300;400;500;600&display=swap');

.amb-overlay {
  width: 100%;
  font-family: 'Jost', sans-serif;
}
.amb-root {
  min-height: 100vh; width: 100%;
  background: #faf5f2;
  display: flex; flex-direction: column; align-items: center;
  padding: 56px 24px 60px;
  font-family: 'Jost', sans-serif;
}
.amb-deco {
  font-size: 22px; color: rgba(46,104,8,.45);
  display: inline-block; transform: scaleX(-1);
}
.amb-deco.right { transform: none; }
.amb-title-row {
  display: flex; align-items: center; justify-content: center;
  gap: 18px; margin-bottom: 14px;
}
.amb-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(32px, 5vw, 48px); font-weight: 400;
  color: #1a3a08; letter-spacing: .01em; text-align: center;
}
.amb-sep {
  display: flex; align-items: center; gap: 14px;
  margin: 0 auto 18px; max-width: 420px; width: 100%;
}
.amb-sep::before, .amb-sep::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(to var(--dir, right), transparent, rgba(46,104,8,.25));
}
.amb-sep::after { --dir: left; }
.amb-heart { color: #2e6808; font-size: 16px; }
.amb-subtitle {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(24px, 3.6vw, 34px); font-style: italic;
  color: rgba(26,18,8,.55); text-align: center;
  line-height: 1.6; margin-bottom: 44px; max-width: 640px;
}
.amb-subtitle br { display: block; }
.amb-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;
  width: 100%; max-width: 1000px;
}
.amb-card {
  position: relative; border-radius: 22px; overflow: hidden;
  aspect-ratio: 4/5; cursor: pointer; border: none; padding: 0;
  display: flex; flex-direction: column; justify-content: flex-end;
  transition: transform .25s ease, box-shadow .25s ease;
  box-shadow: 0 8px 28px rgba(30,60,10,.12);
}
.amb-card:hover { transform: translateY(-4px); box-shadow: 0 14px 38px rgba(30,60,10,.20); }
.amb-card:disabled { opacity: .6; cursor: not-allowed; transform: none; }
.amb-card-img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover;
}
.amb-card-overlay {
  position: absolute; inset: 0;
  background: rgba(26,58,8,.18);
}
.amb-skip {
  margin-top: 36px; background: none; border: none; cursor: pointer;
  font-size: 13px; color: rgba(26,18,8,.35);
  text-decoration: underline; text-underline-offset: 3px;
  font-family: 'Jost', sans-serif;
}

@media (max-width: 640px) {
  .amb-root { padding: 32px 20px 32px; }
  .amb-subtitle { margin-bottom: 24px; }
  .amb-grid { grid-template-columns: 1fr; gap: 14px; max-width: 180px; }
  .amb-card { aspect-ratio: 4/5; }
  .amb-card-img { object-position: center top; }
  .amb-deco { font-size: 16px; }
}

@media (min-width: 641px) {
  .amb-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(26,30,10,.45);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }
  .amb-root {
    min-height: 0; width: auto; max-width: 760px; max-height: 90vh;
    border-radius: 28px; overflow-y: auto;
    padding: 44px 48px 48px;
    box-shadow: 0 24px 60px rgba(20,30,10,.30);
  }
}
`

const AMBIANCES = [
  { id: 'zen',      title: 'Ambiance Zen',    image: '/ambiance-zen.png' },
  { id: 'feerique', title: 'Ambiance Ludique', image: '/ambiance-feerique.png' },
]

export default function AmbianceChoiceScreen({ userId, onChoose, onSkip }) {
  const [saving, setSaving] = useState(null)

  async function handleChoose(id) {
    if (saving) return
    setSaving(id)
    try {
      if (userId) {
        await supabase.from('users').update({ ambiance: id }).eq('id', userId)
      }
      onChoose?.(id)
    } catch (e) {
      console.warn('[AmbianceChoiceScreen] save error', e)
      onChoose?.(id)
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="amb-overlay">
      <div className="amb-root">
        <div className="amb-title-row">
          <span className="amb-deco">🌿</span>
          <h1 className="amb-title">Choisis ton ambiance</h1>
          <span className="amb-deco right">🌿</span>
        </div>
        <div className="amb-sep"><span className="amb-heart">♥</span></div>
        <p className="amb-subtitle">
          Sélectionne l'univers qui te correspond<br/>pour personnaliser ton jardin intérieur
        </p>

        <div className="amb-grid">
          {AMBIANCES.map(a => (
            <button
              key={a.id}
              className="amb-card"
              disabled={!!saving}
              onClick={() => handleChoose(a.id)}
            >
              <img className="amb-card-img" src={a.image} alt={a.title} />
              {saving === a.id && <div className="amb-card-overlay" />}
            </button>
          ))}
        </div>

        {onSkip && (
          <button className="amb-skip" onClick={onSkip}>Décider plus tard, dans mes paramètres</button>
        )}
      </div>
      </div>
    </>
  )
}
