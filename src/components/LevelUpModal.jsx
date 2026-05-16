import { useState, useEffect, useRef } from 'react'
import { supabase } from '../core/supabaseClient'

export function LevelUpModal() {
  const [level, setLevel] = useState(null)
  const [plan,  setPlan]  = useState('free')
  const [perks, setPerks] = useState(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { setLevel(e.detail.level); setPlan(e.detail.plan ?? 'free') }
    window.addEventListener('mji:levelup', handler)
    return () => window.removeEventListener('mji:levelup', handler)
  }, [])

  useEffect(() => {
    if (!level) return
    if (videoRef.current) videoRef.current.play().catch(() => {})
    supabase.from('app_settings').select('value').eq('key', 'level_perks').maybeSingle()
      .then(({ data }) => {
        try {
          const all = JSON.parse(data?.value ?? '{}')
          setPerks(all[plan]?.[level] ?? all['free']?.[level] ?? null)
        } catch { setPerks(null) }
      })
  }, [level, plan])

  if (!level) return null

  const accent = level === 3
    ? { color: '#c8894a', border: 'rgba(200,137,74,0.50)', bg: 'rgba(200,137,74,0.18)', grad: 'linear-gradient(135deg,#c8894a,#a06030)', shadow: 'rgba(180,120,60,.40)' }
    : { color: '#96d485', border: 'rgba(150,212,133,0.45)', bg: 'rgba(150,212,133,0.15)', grad: 'linear-gradient(135deg,#78c040,#4a8820)', shadow: 'rgba(90,138,48,.40)' }

  return (
    <>
      <style>{`
        @keyframes lvlFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes lvlSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .lvl-overlay { position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.82);backdrop-filter:blur(12px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;animation:lvlFadeIn .35s ease both;overflow-y:auto }
        .lvl-card    { width:min(400px,100%);display:flex;flex-direction:column;align-items:center;gap:16px;animation:lvlSlideUp .45s cubic-bezier(.22,1,.36,1) both }
        .lvl-video   { width:100%;border-radius:20px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.55);aspect-ratio:9/16;object-fit:cover;background:#000;max-height:52vh }
        .lvl-btn     { padding:14px 40px;border-radius:50px;border:none;font-size:15px;font-family:'Jost',sans-serif;font-weight:600;cursor:pointer;letter-spacing:.06em;transition:filter .2s,transform .15s;width:100% }
        .lvl-btn:hover { filter:brightness(1.08);transform:translateY(-1px) }
      `}</style>

      <div className="lvl-overlay" onClick={() => setLevel(null)}>
        <div className="lvl-card" onClick={e => e.stopPropagation()}>

          <span style={{ padding: '7px 20px', borderRadius: 30, fontSize: 12, fontFamily: "'Jost',sans-serif", fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', background: accent.bg, border: `1px solid ${accent.border}`, color: accent.color }}>
            Niveau {level} atteint ✦
          </span>

          <video ref={videoRef} className="lvl-video" src={`/video/niv${level}.mp4`} autoPlay playsInline controls={false} />

          {/* Avantages */}
          {perks && (
            <div style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: accent.bg, border: `1px solid ${accent.border}` }}>
              {perks.title && (
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 600, color: accent.color, marginBottom: 10, textAlign: 'center' }}>
                  {perks.title}
                </div>
              )}
              {(perks.perks ?? []).length > 0 && (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {perks.perks.map((p, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, fontFamily: "'Jost',sans-serif", color: 'rgba(255,255,255,0.85)' }}>
                      <span style={{ color: accent.color, flexShrink: 0, marginTop: 1 }}>✦</span>
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button className="lvl-btn" style={{ background: accent.grad, color: '#fff', boxShadow: `0 6px 24px ${accent.shadow}` }} onClick={() => setLevel(null)}>
            Continuer mon jardin →
          </button>

        </div>
      </div>
    </>
  )
}
