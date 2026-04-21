// ─────────────────────────────────────────────────────────────
//  MaBibliotheque.jsx
//  Section "Ma Bibliothèque" dans le profil utilisateur
//  Lecture audio sécurisée — pas de téléchargement, pas d'URL visible
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../core/supabaseClient'

// ── Constantes ──────────────────────────────────────────────
const EDGE_FN_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '') + '/functions/v1/audio-stream'

// ═══════════════════════════════════════════════════════════
//  Hook : useAchats — charge les achats de l'utilisateur
// ═══════════════════════════════════════════════════════════
export function useAchats(userId) {
  const [achats,  setAchats]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('achats')
      .select(`
        id, created_at, statut,
        produits (id, titre, categorie, type, image_url, description, storage_path)
      `)
      .eq('user_id', userId)
      .eq('statut', 'complete')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAchats(data || [])
        setLoading(false)
      })
  }, [userId])

  return { achats, loading }
}

// ═══════════════════════════════════════════════════════════
//  MaBibliotheque — composant principal
// ═══════════════════════════════════════════════════════════
export function MaBibliotheque({ userId, onGoToJardinotheque }) {
  const { achats, loading } = useAchats(userId)
  const [playing, setPlaying] = useState(null) // produit_id en cours

  const audioAchats = achats.filter(a => a.produits?.type === 'digital')

  if (loading) return (
    <div style={{ fontSize:'var(--fs-h5, 12px)', color:'rgba(var(--text-on-dark-rgb),0.30)', fontStyle:'italic', padding:'20px 0' }}>
      Chargement de votre bibliothèque…
    </div>
  )

  if (audioAchats.length === 0) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center', gap:16 }}>
      <div style={{ fontSize:48, opacity:.25 }}>🎧</div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:400, color:'#1a1208', lineHeight:1.3 }}>
        Votre bibliothèque est vide
      </div>
      <div style={{ fontSize:18, color:'#1a1208', lineHeight:1.75, maxWidth:340 }}>
        Retrouvez ici tous vos achats de la <strong style={{ fontWeight:700 }}>Jardinothèque</strong> — méditations, séances d'hypnose, e-books et vidéos de développement personnel.
      </div>
      <div style={{ fontSize:18, color:'#1a1208', lineHeight:1.7, maxWidth:320, fontStyle:'italic' }}>
        Chaque contenu acheté avec vos lumens ou par paiement direct apparaîtra ici, prêt à être écouté ou consulté.
      </div>
      <div
        onClick={onGoToJardinotheque}
        style={{ marginTop:8, padding:'10px 22px', borderRadius:20, background:'rgba(var(--lumens-rgb),0.10)', border:'1px solid rgba(var(--lumens-rgb),0.25)', fontSize:18, color:'#1a1208', letterSpacing:'.04em', cursor: onGoToJardinotheque ? 'pointer' : 'default', transition:'background .15s' }}
        onMouseEnter={e => { if(onGoToJardinotheque) e.currentTarget.style.background='rgba(var(--lumens-rgb),0.20)' }}
        onMouseLeave={e => { e.currentTarget.style.background='rgba(var(--lumens-rgb),0.10)' }}
      >
        🌿 Explorez la <strong style={{ fontWeight:700, textDecoration: onGoToJardinotheque ? 'underline' : 'none', textUnderlineOffset:3 }}>Jardinothèque</strong> pour commencer
      </div>
    </div>
  )

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:12, padding:10 }}>
      {audioAchats.map(a => {
        const p = a.produits
        const isPlaying_ = playing === p.id
        return (
          <div key={a.id} style={{
            borderRadius:14, overflow:'hidden',
            border:`1px solid ${isPlaying_ ? 'rgba(var(--lumens-rgb),0.45)' : 'var(--track)'}`,
            background:'var(--surface-1)',
            display:'flex', flexDirection:'column',
            transition:'border-color .2s',
          }}>
            {/* Image carrée */}
            <div style={{
              width:'100%', aspectRatio:'1/1',
              background:'rgba(var(--lumens-rgb),0.08)',
              display:'flex', alignItems:'center', justifyContent:'center',
              overflow:'hidden', flexShrink:0,
            }}>
              {p.image_url
                ? <img src={p.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontSize:36, opacity:.3 }}>🎧</span>
              }
            </div>

            {/* Infos + bouton */}
            <div style={{ padding:'12px 20px 20px', display:'flex', flexDirection:'column', gap:6, flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#1a1208', lineHeight:1.3, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.titre}</div>
              <div style={{ fontSize:10, color:'rgba(var(--lumens-rgb),0.60)', textTransform:'uppercase', letterSpacing:'.06em' }}>{p.categorie}</div>
              <button
                onClick={() => setPlaying(isPlaying_ ? null : p.id)}
                style={{
                  marginTop:'auto', width:'100%', padding:'7px 0', borderRadius:20,
                  background: isPlaying_ ? 'rgba(var(--lumens-rgb),0.22)' : 'rgba(var(--lumens-rgb),0.10)',
                  border:`1px solid ${isPlaying_ ? 'rgba(var(--lumens-rgb),0.50)' : 'rgba(var(--lumens-rgb),0.22)'}`,
                  color:'var(--lumens)', fontSize:14, cursor:'pointer', transition:'all .2s',
                }}
              >
                {isPlaying_ ? '⏹' : '▶'}
              </button>
            </div>

            {/* Lecteur sécurisé */}
            {isPlaying_ && (
              <SecureAudioPlayer
                produitId={p.id}
                userId={userId}
                titre={p.titre}
                onClose={() => setPlaying(null)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  SecureAudioPlayer
//  - Récupère une URL signée via Edge Function
//  - La convertit en Blob URL (jamais visible dans le DOM)
//  - Bloque le clic droit et le téléchargement
// ═══════════════════════════════════════════════════════════
function SecureAudioPlayer({ produitId, userId, titre, onClose }) {
  const audioRef  = useRef(null)
  const blobRef   = useRef(null)  // stocke le Blob URL pour le révoquer
  const [status,   setStatus]   = useState('loading') // loading | ready | error
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [duration,  setDuration]  = useState(0)
  const [volume,    setVolume]    = useState(0.8)
  const [errMsg,    setErrMsg]    = useState('')

  // Charge le fichier via Edge Function → Blob URL
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setStatus('loading')
      try {
        // Attend que la session soit disponible (jusqu'à 3s après redirect Stripe)
        let token = null
        for (let i = 0; i < 6; i++) {
          const { data } = await supabase.auth.getSession()
          token = data.session?.access_token ?? null
          if (token) break
          await new Promise(r => setTimeout(r, 500))
        }
        if (!token) throw new Error('Session expirée — reconnectez-vous')

        console.log('[audio-stream] URL:', EDGE_FN_URL)
        console.log('[audio-stream] produit_id:', produitId)
        console.log('[audio-stream] token présent:', !!token)

        const res = await fetch(EDGE_FN_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ produit_id: produitId }),
        })
        const json = await res.json()
        console.log('[audio-stream] status:', res.status, 'response:', json)
        if (!res.ok) throw new Error(json.error || 'Erreur serveur')

        // Télécharge le fichier audio en mémoire → Blob URL
        const audioRes = await fetch(json.url)
        const blob = await audioRes.blob()
        if (cancelled) return

        const blobUrl = URL.createObjectURL(blob)
        blobRef.current = blobUrl

        if (audioRef.current) {
          audioRef.current.src = blobUrl
          audioRef.current.volume = volume
          await audioRef.current.play()
          if (!cancelled) setStatus('ready'); setIsPlaying(true)
        }
      } catch (e) {
        if (!cancelled) { setStatus('error'); setErrMsg(e.message) }
      }
    }

    load()

    return () => {
      cancelled = true
      // Révoque le Blob URL à la fermeture — le fichier disparaît de la mémoire
      if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null }
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
    }
  }, [produitId])

  const togglePlay = () => {
    if (!audioRef.current || status !== 'ready') return
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false) }
    else           { audioRef.current.play();  setIsPlaying(true)  }
  }

  const seek = (e) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = pct * duration
  }

  const fmt = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`

  return (
    <div
      style={{ padding:'0 16px 16px', userSelect:'none' }}
      onContextMenu={e => e.preventDefault()} // bloque clic droit
    >
      {/* Audio tag caché — src en Blob URL */}
      <audio
        ref={audioRef}
        style={{ display:'none' }}
        onTimeUpdate={e => setProgress(e.target.currentTime)}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onEnded={() => setIsPlaying(false)}
        onError={() => { setStatus('error'); setErrMsg('Erreur de lecture') }}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
      />

      {status === 'loading' && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 0' }}>
          <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid rgba(var(--lumens-rgb),0.30)', borderTop:'2px solid var(--lumens)', animation:'spin 1s linear infinite' }}/>
          <div style={{ fontSize:'var(--fs-h5, 12px)', color:'rgba(var(--text-on-dark-rgb),0.40)', fontStyle:'italic' }}>Chargement sécurisé…</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {status === 'error' && (
        <div style={{ fontSize:'var(--fs-h5, 12px)', color:'var(--red)', padding:'10px 0' }}>✗ {errMsg}</div>
      )}

      {status === 'ready' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {/* Barre de progression cliquable */}
          <div
            onClick={seek}
            style={{ height:4, background:'var(--surface-3)', borderRadius:2, cursor:'pointer', position:'relative' }}>
            <div style={{ height:'100%', width:`${duration ? (progress/duration)*100 : 0}%`, background:'var(--lumens)', borderRadius:2, transition:'width .5s linear' }}/>
          </div>

          {/* Contrôles */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {/* Rewind 10s */}
            <button onClick={() => audioRef.current && (audioRef.current.currentTime -= 10)}
              style={{ background:'none', border:'none', color:'rgba(var(--lumens-rgb),0.55)', fontSize:'var(--fs-emoji-sm, 18px)', cursor:'pointer', padding:0 }}>⏮</button>

            {/* Play/Pause */}
            <button onClick={togglePlay}
              style={{ width:36, height:36, borderRadius:'50%', background:'rgba(var(--lumens-rgb),0.15)', border:'1px solid rgba(var(--lumens-rgb),0.35)', color:'var(--lumens)', fontSize:'var(--fs-emoji-sm, 16px)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Forward 10s */}
            <button onClick={() => audioRef.current && (audioRef.current.currentTime += 10)}
              style={{ background:'none', border:'none', color:'rgba(var(--lumens-rgb),0.55)', fontSize:'var(--fs-emoji-sm, 18px)', cursor:'pointer', padding:0 }}>⏭</button>

            {/* Temps */}
            <div style={{ fontSize:'var(--fs-h5, 11px)', color:'rgba(var(--text-on-dark-rgb),0.40)', flex:1 }}>
              {fmt(progress)} / {fmt(duration)}
            </div>

            {/* Volume */}
            <input type="range" min="0" max="1" step="0.05" value={volume}
              onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if(audioRef.current) audioRef.current.volume = v }}
              style={{ width:64, accentColor:'var(--lumens)' }}
            />
          </div>

          {/* Mention anti-download */}
          <div style={{ fontSize:'var(--fs-h5, 9px)', color:'rgba(var(--text-on-dark-rgb),0.18)', letterSpacing:'.04em', textAlign:'center' }}>
            Lecture protégée · Téléchargement non autorisé
          </div>
        </div>
      )}
    </div>
  )
}
