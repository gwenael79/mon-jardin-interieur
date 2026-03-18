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
export function MaBibliotheque({ userId }) {
  const { achats, loading } = useAchats(userId)
  const [playing, setPlaying] = useState(null) // produit_id en cours

  const audioAchats = achats.filter(a => a.produits?.type === 'digital')

  if (loading) return (
    <div style={{ fontSize:12, color:'rgba(242,237,224,0.30)', fontStyle:'italic', padding:'20px 0' }}>
      Chargement de votre bibliothèque…
    </div>
  )

  if (audioAchats.length === 0) return (
    <div style={{ textAlign:'center', padding:'32px 0' }}>
      <div style={{ fontSize:32, opacity:.2, marginBottom:12 }}>🎧</div>
      <div style={{ fontSize:12, color:'rgba(242,237,224,0.30)', fontStyle:'italic' }}>
        Votre bibliothèque est vide.<br/>Vos achats apparaîtront ici.
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {audioAchats.map(a => {
        const p = a.produits
        return (
          <div key={a.id} style={{
            borderRadius:14, overflow:'hidden',
            border:'1px solid rgba(255,255,255,0.07)',
            background:'rgba(255,255,255,0.03)',
          }}>
            {/* Info produit */}
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px' }}>
              {/* Pochette */}
              <div style={{
                width:52, height:52, borderRadius:10, flexShrink:0,
                background:'rgba(180,160,240,0.10)',
                border:'1px solid rgba(180,160,240,0.20)',
                display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
              }}>
                {p.image_url
                  ? <img src={p.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontSize:22, opacity:.5 }}>🎧</span>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, color:'rgba(242,237,224,0.88)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.titre}</div>
                <div style={{ fontSize:10, color:'rgba(180,160,240,0.60)', marginTop:2, textTransform:'uppercase', letterSpacing:'.06em' }}>{p.categorie}</div>
              </div>
              {/* Bouton play/stop */}
              <button
                onClick={() => setPlaying(playing === p.id ? null : p.id)}
                style={{
                  width:40, height:40, borderRadius:'50%', flexShrink:0,
                  background: playing === p.id ? 'rgba(180,160,240,0.25)' : 'rgba(180,160,240,0.10)',
                  border:`1px solid ${playing === p.id ? 'rgba(180,160,240,0.50)' : 'rgba(180,160,240,0.25)'}`,
                  color:'#b4a0f0', fontSize:16, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all .2s',
                }}
              >
                {playing === p.id ? '⏹' : '▶'}
              </button>
            </div>

            {/* Lecteur sécurisé */}
            {playing === p.id && (
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
          <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid rgba(180,160,240,0.30)', borderTop:'2px solid #b4a0f0', animation:'spin 1s linear infinite' }}/>
          <div style={{ fontSize:12, color:'rgba(242,237,224,0.40)', fontStyle:'italic' }}>Chargement sécurisé…</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {status === 'error' && (
        <div style={{ fontSize:12, color:'#e87060', padding:'10px 0' }}>✗ {errMsg}</div>
      )}

      {status === 'ready' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {/* Barre de progression cliquable */}
          <div
            onClick={seek}
            style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, cursor:'pointer', position:'relative' }}>
            <div style={{ height:'100%', width:`${duration ? (progress/duration)*100 : 0}%`, background:'#b4a0f0', borderRadius:2, transition:'width .5s linear' }}/>
          </div>

          {/* Contrôles */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {/* Rewind 10s */}
            <button onClick={() => audioRef.current && (audioRef.current.currentTime -= 10)}
              style={{ background:'none', border:'none', color:'rgba(180,160,240,0.55)', fontSize:18, cursor:'pointer', padding:0 }}>⏮</button>

            {/* Play/Pause */}
            <button onClick={togglePlay}
              style={{ width:36, height:36, borderRadius:'50%', background:'rgba(180,160,240,0.15)', border:'1px solid rgba(180,160,240,0.35)', color:'#b4a0f0', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Forward 10s */}
            <button onClick={() => audioRef.current && (audioRef.current.currentTime += 10)}
              style={{ background:'none', border:'none', color:'rgba(180,160,240,0.55)', fontSize:18, cursor:'pointer', padding:0 }}>⏭</button>

            {/* Temps */}
            <div style={{ fontSize:11, color:'rgba(242,237,224,0.40)', flex:1 }}>
              {fmt(progress)} / {fmt(duration)}
            </div>

            {/* Volume */}
            <input type="range" min="0" max="1" step="0.05" value={volume}
              onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if(audioRef.current) audioRef.current.volume = v }}
              style={{ width:64, accentColor:'#b4a0f0' }}
            />
          </div>

          {/* Mention anti-download */}
          <div style={{ fontSize:9, color:'rgba(242,237,224,0.18)', letterSpacing:'.04em', textAlign:'center' }}>
            Lecture protégée · Téléchargement non autorisé
          </div>
        </div>
      )}
    </div>
  )
}
