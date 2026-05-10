import { useState, useEffect } from 'react'
import { supabase } from '../core/supabaseClient'

export function AppAvisModal({ userId, displayName: displayNameProp, onClose }) {
  const [rating,      setRating]      = useState(0)
  const [hovered,     setHovered]     = useState(0)
  const [comment,     setComment]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [done,        setDone]        = useState(false)
  const [existing,    setExisting]    = useState(null)
  const [checking,    setChecking]    = useState(true)
  const [displayName, setDisplayName] = useState(displayNameProp || '')

  const mois = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    const init = async () => {
      // Récupère le prénom si non fourni en prop
      if (!displayNameProp) {
        const { data: u } = await supabase.from('users').select('display_name').eq('id', userId).maybeSingle()
        if (u?.display_name) setDisplayName(u.display_name)
      }
      // Cherche un avis existant ce mois
      const { data } = await supabase.from('app_reviews').select('id, rating, comment, status')
        .eq('user_id', userId).eq('mois', mois).maybeSingle()
      if (data) { setExisting(data); setRating(data.rating); setComment(data.comment || '') }
      setChecking(false)
    }
    init()
  }, [userId])

  const handleSubmit = async () => {
    if (!rating) return
    setSaving(true)
    if (existing) {
      await supabase.from('app_reviews').update({ rating, comment, display_name: displayName, status: 'pending' }).eq('id', existing.id)
    } else {
      await supabase.from('app_reviews').insert({ user_id: userId, rating, comment, display_name: displayName, status: 'pending', mois })
    }
    setSaving(false)
    setDone(true)
  }

  const labels = ['', 'Pas du tout satisfait·e', 'Peu satisfait·e', 'Plutôt satisfait·e', 'Très satisfait·e', 'Absolument ravi·e !']

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:440, borderRadius:24, background:'#faf8f4', padding:'32px 28px', boxShadow:'0 20px 60px rgba(30,60,10,.20)', border:'1px solid rgba(180,210,140,.30)' }} onClick={e => e.stopPropagation()}>
        {done ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🌿</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#1a1208', marginBottom:8 }}>Merci pour votre avis !</div>
            <div style={{ fontSize:13, color:'rgba(30,20,8,.50)', marginBottom:24, lineHeight:1.7 }}>Votre retour nous aide à faire grandir l'application.</div>
            <button onClick={onClose} style={{ padding:'11px 28px', borderRadius:100, border:'none', background:'linear-gradient(135deg,#5a9a2e,#3a7a1a)', color:'#fff', fontSize:13, fontFamily:"'Jost',sans-serif", cursor:'pointer' }}>Fermer</button>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'#1a1208', marginBottom:4 }}>Votre avis sur l'application</div>
                <div style={{ fontSize:12, color:'rgba(30,20,8,.45)', lineHeight:1.6 }}>Partagez votre expérience avec Mon Jardin Intérieur</div>
              </div>
              <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'rgba(30,20,8,.35)', padding:4, flexShrink:0 }}>✕</button>
            </div>

            {checking ? (
              <div style={{ textAlign:'center', padding:'20px 0', fontSize:13, color:'rgba(30,20,8,.45)', fontStyle:'italic' }}>Chargement…</div>
            ) : (
              <>
                <div style={{ marginBottom:22 }}>
                  <div style={{ fontSize:11, color:'rgba(30,20,8,.40)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:14, textAlign:'center' }}>Votre satisfaction</div>
                  <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                    {[1,2,3,4,5].map(n => (
                      <div key={n}
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHovered(n)}
                        onMouseLeave={() => setHovered(0)}
                        style={{ fontSize:42, cursor:'pointer', transition:'transform .15s, color .1s', transform:(hovered||rating) >= n ? 'scale(1.18)' : 'scale(1)', color:(hovered||rating) >= n ? '#e8c060' : 'rgba(30,20,8,.12)', userSelect:'none', lineHeight:1 }}>
                        ★
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign:'center', fontSize:12, color:'rgba(30,20,8,.50)', marginTop:10, minHeight:18, fontStyle:'italic' }}>
                    {rating > 0 ? labels[rating] : ''}
                  </div>
                </div>

                <div style={{ marginBottom:22 }}>
                  <div style={{ fontSize:11, color:'rgba(30,20,8,.40)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8 }}>
                    Votre message <span style={{ opacity:.5, textTransform:'none', letterSpacing:0 }}>(facultatif)</span>
                  </div>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value.slice(0, 500))}
                    rows={4}
                    placeholder="Ce que vous aimez, ce qui pourrait être amélioré…"
                    style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(90,154,40,.25)', background:'rgba(90,154,40,.04)', fontSize:13, fontFamily:"'Jost',sans-serif", color:'#1a1208', resize:'none', outline:'none', lineHeight:1.7, boxSizing:'border-box' }}
                  />
                  <div style={{ textAlign:'right', fontSize:10, color:'rgba(30,20,8,.28)', marginTop:4 }}>{comment.length} / 500</div>
                </div>

                <button onClick={handleSubmit} disabled={!rating || saving}
                  style={{ width:'100%', padding:13, borderRadius:100, border:'none', background: rating ? 'linear-gradient(135deg,#5a9a2e,#3a7a1a)' : 'rgba(30,20,8,.08)', color: rating ? '#fff' : 'rgba(30,20,8,.28)', fontSize:13, fontWeight:500, fontFamily:"'Jost',sans-serif", cursor: rating ? 'pointer' : 'not-allowed', transition:'all .2s', letterSpacing:'.03em' }}>
                  {saving ? 'Envoi en cours…' : existing ? '↻ Mettre à jour mon avis' : '✓ Envoyer mon avis'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
