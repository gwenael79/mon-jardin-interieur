// ─────────────────────────────────────────────────────────────────────────────
import { useAnalytics } from '../hooks/useAnalytics'
//  ScreenDefis.jsx  —  Écran "Défis"
//  Contient : ProposeModal, ScreenDefis, ScreenJardinCollectif
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react"
import { useDefi } from '../hooks/useDefi'
import CommunityGarden from '../components/CommunityGarden'
import { useIsMobile, LumenBadge } from './dashboardShared'

/* ─────────────────────────────────────────
   SCREEN 4 — DÉFIS
───────────────────────────────────────── */
// DEFIS_DATA → now in Supabase via useDefi

function ProposeModal({ onClose, onSubmit }) {
  const [title, setTitle]   = useState('')
  const [desc, setDesc]     = useState('')
  const [zone, setZone]     = useState('Souffle')
  const [dur, setDur]       = useState(7)
  const [emoji, setEmoji]   = useState('🌿')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const zones = ['Souffle','Racines','Feuilles','Tige','Fleurs','Toutes']
  const durs  = [7,14,21,30]

  async function handleSubmit() {
    if (!title.trim()) return
    setLoading(true)
    try { await onSubmit({ title, description:desc, zone, duration_days:dur, emoji }); setSent(true); setTimeout(onClose,1800) }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Proposer un défi ✨</div>

        {sent ? (
          <div style={{ textAlign:'center', padding:'28px 0' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🌿</div>
            <div style={{ fontSize:13, color:'rgba(150,212,133,0.9)', letterSpacing:'.04em' }}>Proposition envoyée !</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>Elle sera examinée par notre équipe.</div>
          </div>
        ) : (
          <>
            {/* Emoji picker + titre */}
            <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <div className="modal-label">Emoji</div>
                <div
                  style={{ width:54, height:46, borderRadius:11, border:'1px solid var(--border)', background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, cursor:'text', position:'relative' }}
                  onClick={() => document.getElementById('pm-emoji').focus()}
                >
                  {emoji || '🌿'}
                  <input
                    id="pm-emoji"
                    value={emoji}
                    onChange={e => setEmoji(e.target.value)}
                    style={{ position:'absolute', inset:0, opacity:0, width:'100%', cursor:'text' }}
                  />
                </div>
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                <div className="modal-label">Nom du défi</div>
                <input
                  className="modal-input"
                  placeholder="Ex: 5 min de marche chaque matin"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ width:'100%' }}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <div className="modal-label">Description</div>
              <textarea
                className="modal-input"
                rows={3}
                placeholder="Décris l'intention du défi…"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                style={{ resize:'none', width:'100%' }}
              />
            </div>

            {/* Zone + Durée */}
            <div style={{ display:'flex', gap:10 }}>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                <div className="modal-label">Zone</div>
                <select className="modal-input" value={zone} onChange={e => setZone(e.target.value)} style={{ width:'100%' }}>
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                <div className="modal-label">Durée</div>
                <select className="modal-input" value={dur} onChange={e => setDur(Number(e.target.value))} style={{ width:'100%' }}>
                  {durs.map(d => <option key={d} value={d}>{d} jours</option>)}
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-cancel" onClick={onClose}>Annuler</button>
              <button className="modal-submit" onClick={handleSubmit} disabled={!title.trim() || loading}>
                {loading ? 'Envoi…' : 'Envoyer la proposition'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const ZONE_COLORS = { Souffle:'var(--zone-breath)', Racines:'var(--zone-roots)', Feuilles:'var(--zone-leaves)', Tige:'var(--zone-stem)', Fleurs:'var(--zone-flowers)', Toutes:'var(--green)' }

function ScreenDefis({ userId, awardLumens, isPremium = false, onUpgrade }) {
  const { track } = useAnalytics(userId)
  const isMobile = useIsMobile()
  const [cat, setCat] = useState('Tous')
  const [showPropose, setShowPropose] = useState(false)
  const cats = ['Tous','Souffle','Racines','Feuilles','Tige','Fleurs']
  const { defis, featured, myDefis, joinedIds, communityStats, isLoading, toggleJoin, proposeDefi } = useDefi(userId)
  const filtered = cat === 'Tous'
  ? defis.filter(d => !d.is_featured)
  : defis.filter(d => d.zone === cat && !d.is_featured)
  const visibleDefis = isPremium ? filtered : filtered.slice(0, 1)
  const featuredJoined = featured ? joinedIds.has(featured.id) : false

  useEffect(() => {
    const handler = () => setShowPropose(true)
    document.addEventListener('openPropose', handler)
    return () => document.removeEventListener('openPropose', handler)
  }, [])

  return (
    <div className="content">
      {showPropose && <ProposeModal onClose={() => setShowPropose(false)} onSubmit={proposeDefi} />}
      <div className="col" style={{ flex:1 }}>
        <div className="defi-featured">
          <div className="df-glow" />
          {featured ? (
  <>
    <div className="df-tag">
      Défi communauté · {featuredJoined ? '✓ En cours' : 'Rejoins-nous'}
    </div>

    <div className="df-title">{featured.title}</div>

    <div className="df-desc">{featured.description}</div>

    <div className="df-meta">
      <div className="dfm-item"><span>📅</span> {featured.duration_days} jours</div>
      <div className="dfm-item"><span>🌿</span> {featured.zone}</div>
      <div className="dfm-item">
        <span>👥</span> {(featured.participantCount ?? 0).toLocaleString()} participants
      </div>
    </div>

    {featuredJoined && (
      <>
        <div className="df-progress">
          <div className="dfp-fill" style={{ width:(featured.progress ?? 0) + '%' }} />
        </div>
        <div className="df-progress-label">
          <span>Progression</span>
          <span>{featured.progress ?? 0}%</span>
        </div>
      </>
    )}

    <div className="df-actions">
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:4 }}>
        {!featuredJoined && <LumenBadge amount={2} />}
        <div
          className={featuredJoined ? 'df-join df-join-active' : 'df-join'}
          onClick={() => { const joining = !joinedIds.has(featured.id); toggleJoin(featured.id); if (joining) { awardLumens?.(2, 'join_defi', { defi_id: featured.id }); track('defi_join', { defi_id: featured.id }, 'defis', 'defis') } else { awardLumens?.(-2, 'leave_defi', { defi_id: featured.id }) } }}
        >
          {featuredJoined ? '✓ En cours' : 'Je rejoins'}
        </div>
      </div>

      <div className="df-learn" onClick={isPremium ? () => setShowPropose(true) : onUpgrade} style={{ opacity: isPremium ? 1 : 0.4, cursor: isPremium ? 'pointer' : 'not-allowed' }}>
        {isPremium ? 'Proposer un défi' : '🔒 Proposer un défi'}
      </div>
    </div>
  </>
) : (
  <>
    {/* 🌿 CARTE INSPIRATIONNELLE */}

    <div className="df-tag">
      Inspiration du moment
    </div>

    <div className="df-title">
      🌸 Le Rituel des 5 Minutes
    </div>

    <div className="df-desc">
      Même sans défi officiel, votre jardin peut évoluer.
      Aujourd’hui, prenez 5 minutes pour respirer,
      écrire une gratitude ou simplement marcher en conscience.
    </div>

    <div className="df-meta">
      <div className="dfm-item"><span>✨</span> Micro-rituel libre</div>
      <div className="dfm-item"><span>🌿</span> Toutes zones</div>
      <div className="dfm-item"><span>🕊</span> Sans engagement</div>
    </div>

    <div className="df-actions">
      <div
  className="df-join"
  onClick={() => {
    document.querySelector('.defis-grid')?.scrollIntoView({ behavior: 'smooth' })
  }}
>
  🌱 Trouvez votre défi du jour
</div>

      <div className="df-learn" onClick={isPremium ? () => setShowPropose(true) : onUpgrade} style={{ opacity: isPremium ? 1 : 0.4, cursor: isPremium ? 'pointer' : 'not-allowed' }}>
        {isPremium ? 'Proposer un défi à la communauté' : '🔒 Proposer un défi'}
      </div>
    </div>
  </>
)}
        </div>
        {isLoading && <div style={{ fontSize:13, color:'var(--text3)', padding:'20px 0' }}>Chargement des défis…</div>}
        <div className="cat-filter">
          {cats.map(c => {
            const locked = !isPremium && ['Racines','Feuilles','Tige','Fleurs'].includes(c)
            return (
              <div key={c}
                className={'cat-btn'+(cat===c?' active':'')}
                onClick={() => locked ? onUpgrade?.() : setCat(c)}
                style={{ opacity: locked ? 0.35 : 1, cursor: locked ? 'not-allowed' : 'pointer', position:'relative' }}>
                {locked ? '🔒 ' : ''}{c}
              </div>
            )
          })}
        </div>
        <div className="slabel">{cat==='Tous'?'Tous les défis':`Zone ${cat}`} · {filtered.length} disponibles</div>
        <div className="defis-grid">
          {visibleDefis.map((d,i) => {
            const isJoined = joinedIds.has(d.id)
            const color = ZONE_COLORS[d.zone] ?? 'var(--green)'
            return (
              <div key={d.id??i} className="defi-card">
                <div className="dc-top">
                  <div className="dc-emoji">{d.emoji}</div>
                  <div className="dc-info">
                    <div className="dc-title">{d.title}</div>
                    <div className="dc-zone">{d.zone}</div>
                  </div>
                  <div className="dc-dur">{d.duration_days} j</div>
                </div>
                <div className="dc-desc">{d.description}</div>
                <div className="dc-foot">
                  <div className="dc-participants">{(d.participantCount??0).toLocaleString()} pers.</div>
                  <div className="dc-bar"><div className="dc-bar-fill" style={{ width:`${d.progress??0}%`, background:color+'88' }} /></div>
                  {isJoined
                    ? <div className="dc-joined" onClick={() => { toggleJoin(d.id); awardLumens?.(-2, 'leave_defi', { defi_id: d.id }) }} style={{ cursor:'pointer' }}>✓ En cours</div>
                    : <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <LumenBadge amount={2} />
                        <div className="dc-join-btn" onClick={() => { toggleJoin(d.id); if (!joinedIds.has(d.id)) { awardLumens?.(2, 'join_defi', { defi_id: d.id }); track('defi_join', { defi_id: d.id }, 'defis', 'defis') } }}>Rejoindre</div>
                      </div>}
                </div>
              </div>
            )
          })}
        </div>
        {/* Verrou premium — défis masqués */}
        {!isPremium && filtered.length > 1 && (
          <div style={{ marginTop: 12 }}>
            <div onClick={onUpgrade} style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '8px 14px', borderRadius: 20, cursor: 'pointer',
              background: 'rgba(232,192,96,0.08)', border: '1px solid rgba(232,192,96,0.25)',
            }}>
              <span style={{ fontSize: 13 }}>🔒</span>
              <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 500 }}>{filtered.length - 1} défis Premium</span>
              <span style={{ fontSize: 11, color: 'var(--gold-warm)' }}>→</span>
            </div>
          </div>
        )}
      </div>

      <div className="rpanel" style={{ display: isMobile ? "none" : undefined }}>
        <div className="rp-section">
          <div className="rp-slabel">Mes défis actifs</div>
          {myDefis.length === 0 && <div style={{ fontSize:12, color:'var(--text3)', padding:'8px 0' }}>Aucun défi en cours</div>}
          {myDefis.map((d,i) => (
            <div key={i} style={{ marginBottom:11, padding:'11px 13px', background:'var(--green3)', border:'1px solid rgba(150,212,133,0.18)', borderRadius:13 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:7 }}>
                <span style={{ fontSize:17 }}>{d.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:'var(--text)' }}>{d.title}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{d.zone} · {d.duration_days} j</div>
                </div>
              </div>
              <div style={{ height:3, background:'rgba(255,255,255,0.09)', borderRadius:100, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${d.progress??0}%`, background:(ZONE_COLORS[d.zone]??'var(--green)'), borderRadius:100 }} />
              </div>
              <div style={{ fontSize:10, color:'var(--text3)', marginTop:5, display:'flex', justifyContent:'space-between' }}>
                <span>Progression</span><span>{d.progress??0}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="rp-section">
          <div className="rp-slabel">Pouls de la communauté</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>🌿</span>
              <div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'var(--text)', lineHeight:1 }}>{communityStats.activeGardens}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>jardins actifs</div></div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>✅</span>
              <div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'var(--text)', lineHeight:1 }}>{communityStats.completedRituals}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>rituels complétés</div></div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>✨</span>
              <div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'var(--text)', lineHeight:1 }}>{communityStats.totalDefis}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>défis actifs</div></div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>👥</span>
              <div><div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:'var(--text)', lineHeight:1 }}>{communityStats.totalParticipants.toLocaleString()}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>participations</div></div>
            </div>
          </div>
        </div>
        <div className="rp-section" style={{ marginTop:'auto' }}>
          <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.6, fontStyle:'italic' }}>
            "Ce dimanche dans mon jardin" · données en temps réel
          </div>
        </div>
      </div>
    </div>
  )
}


function ScreenJardinCollectif({ userId, isPremium = false, onUpgrade }) {
  const isMobile = useIsMobile()
  return (
    <div className="content" style={{ flex:1, overflow:'hidden', paddingBottom: isMobile ? 64 : 0, position:'relative' }}>
      <CommunityGarden currentUserId={userId} embedded isPremium={isPremium} />

      {/* Overlay flou pour les non-premium — masque les fleurs éloignées */}
      {!isPremium && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(circle at center, transparent 5%, rgba(14,26,14,0.40) 25%, rgba(14,26,14,0.75) 45%, rgba(14,26,14,0.96) 65%)',
          zIndex: 10,
        }} />
      )}

      {/* Badge premium */}
      {!isPremium && (
        <div style={{
          position: 'absolute', bottom: isMobile ? 80 : 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20,
        }}>
          <div onClick={onUpgrade} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            padding: '8px 18px', borderRadius: 20,
            background: 'rgba(180,160,240,0.12)', border: '1px solid rgba(180,160,240,0.30)',
          }}>
            <span style={{ fontSize: 13 }}>🔒</span>
            <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>Voir tout le jardin — Premium</span>
            <span style={{ fontSize: 11, color: 'rgba(180,160,240,0.60)' }}>→</span>
          </div>
        </div>
      )}
    </div>
  )
}


export { ScreenDefis, ScreenJardinCollectif }
