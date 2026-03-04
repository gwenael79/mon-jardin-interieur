// ─────────────────────────────────────────────────────────────────────────────
//  ScreenAteliers.jsx  —  Écran "Ateliers"
//  Contient : CreateAtelierModal, useCountdown, CountdownDisplay,
//             AtelierCard, ScreenAteliers, ApplyAnimatorModal
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react"
import { supabase } from '../core/supabaseClient'
import { useIsMobile, LumenBadge, getThemeEmoji, THEMES_LIST, callModerateCircle } from './dashboardShared'

// ═══════════════════════════════════════════════════════
//  SCREEN ATELIERS
// ═══════════════════════════════════════════════════════

function CreateAtelierModal({ onClose, onCreate }) {
  const [title,      setTitle]      = useState('')
  const [rawDesc,    setRawDesc]    = useState('')
  const [aiDesc,     setAiDesc]     = useState('')
  const [aiLoading,  setAiLoading]  = useState(false)
  const [theme,      setTheme]      = useState('')
  const [startsAt,   setStartsAt]   = useState('')
  const [duration,   setDuration]   = useState(60)
  const [maxP,       setMaxP]       = useState(10)
  const [format,     setFormat]     = useState('online')
  const [location,   setLocation]   = useState('')
  const [price,      setPrice]      = useState(0)
  const [lumenPrice, setLumenPrice] = useState(0)
  const [loading,    setLoading]    = useState(false)

  async function generateDesc() {
    if (!rawDesc.trim()) return
    setAiLoading(true)
    try {
      const data = await callModerateCircle({
        action: 'rewrite_atelier',
        name: title,
        theme,
        description: rawDesc
      })
      setAiDesc(data.description ?? '')
    } catch(e) { console.error(e) }
    finally { setAiLoading(false) }
  }

  async function handleSubmit() {
    if (!title.trim() || !startsAt) return
    setLoading(true)
    try { await onCreate({ title: title.trim(), description: aiDesc || rawDesc, theme, starts_at: startsAt, duration_minutes: Number(duration), max_participants: Number(maxP), format, location, price: Number(price), lumen_price: lumenPrice ? Number(lumenPrice) : null }) }
    finally { setLoading(false) }
  }

  const fStyle = { marginBottom:14 }
  const lStyle = { fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(242,237,224,0.5)', marginBottom:5, display:'block' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#1e3a1e', border:'1px solid rgba(255,255,255,0.15)', borderRadius:16, padding:28, width:500, maxHeight:'92vh', overflowY:'auto' }}>
        <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, color:'#e8d4a8', marginBottom:20 }}>✨ Créer un atelier</div>

        {/* Titre */}
        <div style={fStyle}>
          <label style={lStyle}>Titre</label>
          <input style={iStyle} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Nom de l'atelier" maxLength={80} />
        </div>

        {/* Thème */}
        <div style={fStyle}>
          <label style={lStyle}>Thème</label>
          <select style={iStyle} value={theme} onChange={e=>setTheme(e.target.value)}>
            <option value="">Choisir un thème</option>
            {THEMES_LIST.map(([emoji,label]) => <option key={label} value={label}>{emoji} {label}</option>)}
          </select>
        </div>

        {/* Description brute */}
        <div style={fStyle}>
          <label style={lStyle}>Votre description (brouillon)</label>
          <textarea style={{...iStyle, height:80, resize:'none'}} value={rawDesc} onChange={e=>setRawDesc(e.target.value)} placeholder="Décrivez votre atelier en quelques phrases, même imparfait..." />
          <button onClick={generateDesc} disabled={aiLoading || !rawDesc.trim()} style={{ marginTop:6, padding:'6px 14px', borderRadius:8, background:'rgba(150,212,133,0.1)', border:'1px solid rgba(150,212,133,0.25)', color:'#96d485', fontSize:11, cursor:'pointer', fontFamily:'Jost,sans-serif', opacity: !rawDesc.trim() ? 0.4 : 1 }}>
            {aiLoading ? '✨ Reformulation…' : '✨ Reformuler par IA'}
          </button>
        </div>

        {/* Description reformulée */}
        {aiDesc && (
          <div style={{ marginBottom:14, padding:'12px 14px', background:'rgba(150,212,133,0.06)', border:'1px solid rgba(150,212,133,0.2)', borderRadius:10 }}>
            <div style={{ fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(150,212,133,0.6)', marginBottom:6 }}>✨ Version publique (reformulée par IA)</div>
            <div style={{ fontSize:12, color:'rgba(242,237,224,0.8)', lineHeight:1.7, fontStyle:'italic' }}>{aiDesc}</div>
            <button onClick={() => setAiDesc('')} style={{ marginTop:8, fontSize:10, color:'rgba(242,237,224,0.35)', background:'none', border:'none', cursor:'pointer', fontFamily:'Jost,sans-serif' }}>✕ Effacer et réécrire</button>
          </div>
        )}

        {/* Autres champs */}
        <div style={fStyle}>
          <label style={lStyle}>Date & heure</label>
          <input style={iStyle} type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label style={lStyle}>Durée (minutes)</label>
            <input style={iStyle} type="number" value={duration} onChange={e=>setDuration(e.target.value)} min={15} max={240} />
          </div>
          <div>
            <label style={lStyle}>Places max</label>
            <input style={iStyle} type="number" value={maxP} onChange={e=>setMaxP(e.target.value)} min={2} max={100} />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label style={lStyle}>Format</label>
            <select style={iStyle} value={format} onChange={e=>setFormat(e.target.value)}>
              <option value="online">🌐 En ligne</option>
              <option value="presentiel">📍 Présentiel</option>
            </select>
          </div>
          <div>
            <label style={lStyle}>Prix (€, 0 = gratuit)</label>
            <input style={iStyle} type="number" value={price} onChange={e=>setPrice(e.target.value)} min={0} />
          </div>
        </div>
        {price > 0 && (
          <div style={fStyle}>
            <label style={lStyle}>Prix alternatif en Lumens ✦ (optionnel)</label>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input style={iStyle} type="number" value={lumenPrice} onChange={e=>setLumenPrice(e.target.value)} min={0} placeholder={`ex. ${price * 10} Lumens`} />
              <div style={{ fontSize:10, color:'rgba(246,196,83,0.6)', whiteSpace:'nowrap' }}>1€ = 10 ✦</div>
            </div>
          </div>
        )}

        <div style={fStyle}>
          <label style={lStyle}>{format==='online' ? 'Lien visio' : 'Adresse'}</label>
          <input style={iStyle} value={location} onChange={e=>setLocation(e.target.value)} placeholder={format==='online' ? 'https://meet.google.com/...' : 'Adresse complète'} />
        </div>
        

        <div style={{ display:'flex', gap:10, marginTop:8 }}>
          <button onClick={onClose} style={{ ...btnStyle, background:'rgba(255,255,255,0.05)', color:'rgba(242,237,224,0.6)', flex:1 }}>Annuler</button>
          <button onClick={handleSubmit} disabled={loading || !title.trim() || !startsAt} style={{ ...btnStyle, flex:2, opacity: (!title.trim()||!startsAt) ? 0.4 : 1 }}>
            {loading ? '…' : "✨ Créer l'atelier"}
          </button>
        </div>
      </div>
    </div>
  )
}

function useCountdown(startsAt) {
  const [remaining, setRemaining] = useState(() => new Date(startsAt) - new Date())
  useEffect(() => {
    if (remaining <= 0) return
    const t = setInterval(() => setRemaining(new Date(startsAt) - new Date()), 60000)
    return () => clearInterval(t)
  }, [startsAt])
  return remaining
}

function CountdownDisplay({ startsAt, isPast }) {
  const remaining = useCountdown(startsAt)
  if (isPast) return <div style={{ fontSize:11, color:'rgba(242,237,224,0.25)', letterSpacing:'.05em' }}>Terminé</div>
  const totalMins = Math.floor(remaining / 60000)
  const days = Math.floor(totalMins / 1440)
  const hours = Math.floor((totalMins % 1440) / 60)
  const mins = totalMins % 60
  const urgent = totalMins < 60
  const sameDay = days === 0
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 }}>
      <div style={{ fontSize:18, fontFamily:'Cormorant Garamond,serif', fontWeight:300, color: urgent ? 'rgba(255,180,80,0.95)' : sameDay ? 'rgba(255,210,100,0.8)' : 'rgba(150,212,133,0.8)', lineHeight:1 }}>
        {days > 0 ? (hours > 0 ? `${days}j ${hours}h` : `${days}j`) : hours > 0 ? `${hours}h ${mins}min` : `${mins}min`}
      </div>
      <div style={{ fontSize:9, color:'rgba(242,237,224,0.35)', letterSpacing:'.06em' }}>
        {urgent ? 'BIENTÔT' : sameDay ? "AUJOURD'HUI" : 'AVANT LE DÉBUT'}
      </div>
    </div>
  )
}

function AtelierCard({ atelier, onInscrit, onDesinscrit, isInscrit, isAnimator, isMine, onDelete, userId, onInvite, onPayLumens, lumens }) {
  const now = new Date()
  const starts = new Date(atelier.starts_at)
  const isPast = starts < now
  const spotsLeft = atelier.max_participants - (atelier.registrationCount ?? 0)
  const isFull = spotsLeft <= 0
  const lumensAvailable = lumens?.available ?? 0
  const [hasReminder, setHasReminder] = useState(false)
  const [reminderLoading, setReminderLoading] = useState(false)

  useEffect(() => {
    if (!userId || isPast) return
    supabase.from('atelier_reminders').select('id').eq('atelier_id', atelier.id).eq('user_id', userId).maybeSingle()
      .then(({ data }) => setHasReminder(!!data))
  }, [atelier.id, userId])

  async function toggleReminder() {
    setReminderLoading(true)
    if (hasReminder) {
      await supabase.from('atelier_reminders').delete().eq('atelier_id', atelier.id).eq('user_id', userId)
      setHasReminder(false)
    } else {
      await supabase.from('atelier_reminders').insert({ atelier_id: atelier.id, user_id: userId })
      setHasReminder(true)
    }
    setReminderLoading(false)
  }

  return (
    <div id={`atelier-${atelier.id}`} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${isInscrit ? 'rgba(150,212,133,0.3)' : 'rgba(255,255,255,0.09)'}`, borderRadius:12, padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>

      {/* LIGNE 1 — titre + prix + countdown */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:400, color:'#f2ede0', lineHeight:1.3 }}>{atelier.title}</div>
          <div style={{ fontSize:10, color:'rgba(242,237,224,0.4)', marginTop:3 }}>{getThemeEmoji(atelier.theme)} {atelier.theme}</div>
          {atelier.animator?.display_name && (
            <div style={{ fontSize:11, color:'rgba(242,237,224,0.45)', fontStyle:'italic', marginTop:2 }}>Par {atelier.animator.display_name}{atelier.animator.profession ? ` · ${atelier.animator.profession}` : ''}</div>
          )}
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
          <div style={{ fontSize:12, fontFamily:'Cormorant Garamond,serif', padding:'3px 10px', borderRadius:100, background: atelier.price > 0 ? 'rgba(232,212,168,0.12)' : 'rgba(150,212,133,0.1)', border:`1px solid ${atelier.price > 0 ? 'rgba(232,212,168,0.3)' : 'rgba(150,212,133,0.25)'}`, color: atelier.price > 0 ? '#e8d4a8' : '#96d485', whiteSpace:'nowrap' }}>
            {atelier.price > 0 ? `${atelier.price} €` : 'Gratuit'}
          </div>
          {!isPast && <CountdownDisplay startsAt={atelier.starts_at} isPast={isPast} />}
        </div>
      </div>

      {/* Description */}
      {atelier.description && (
        <div style={{ fontSize:11, color:'rgba(242,237,224,0.55)', lineHeight:1.6, fontStyle:'italic' }}>{atelier.description}</div>
      )}

      {/* LIGNE méta */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, fontSize:10, color:'rgba(242,237,224,0.45)' }}>
        <span>🗓 {new Date(atelier.starts_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
        <span>⏱ {atelier.duration_minutes}min</span>
        <span>{atelier.format === 'online' ? '🌐 En ligne' : '📍 Présentiel'}</span>
        <span style={{ color: isFull ? 'rgba(255,130,130,0.55)' : 'inherit' }}>👥 {atelier.registrationCount ?? 0}/{atelier.max_participants}{isFull ? ' · Complet' : ''}</span>
      </div>

      {/* ACTIONS */}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        {!isPast && !isMine && (
          <>
            {!isInscrit && !isFull && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:4 }}>
                  <LumenBadge amount={3} />
                  <button onClick={() => onInscrit(atelier.id)} style={{ ...btnStyle, padding:'7px 18px', fontSize:12 }}>
                    ✓ S&apos;inscrire{atelier.price > 0 ? ` · ${atelier.price}€` : ''}
                  </button>
                </div>
                {atelier.lumen_price > 0 && (
                  <button onClick={() => onPayLumens?.(atelier.id, atelier.lumen_price)} style={{ padding:'7px 14px', fontSize:11, borderRadius:9, background: lumensAvailable >= atelier.lumen_price ? 'rgba(246,196,83,0.12)' : 'rgba(255,255,255,0.04)', border:`1px solid ${lumensAvailable >= atelier.lumen_price ? 'rgba(246,196,83,0.35)' : 'rgba(255,255,255,0.1)'}`, color: lumensAvailable >= atelier.lumen_price ? '#F6C453' : 'rgba(242,237,224,0.3)', cursor: lumensAvailable >= atelier.lumen_price ? 'pointer' : 'default', fontFamily:'Jost,sans-serif', display:'flex', alignItems:'center', gap:5 }} title={lumensAvailable >= atelier.lumen_price ? `Vous avez ${lumensAvailable} ✦` : `Lumens insuffisants (${lumensAvailable}/${atelier.lumen_price} ✦)`}>
                    ✦ {atelier.lumen_price} Lumens
                  </button>
                )}
              </div>
            )}
            {!isInscrit && isFull && (
              <span style={{ fontSize:11, color:'rgba(255,130,130,0.55)', fontStyle:'italic' }}>Complet</span>
            )}
            {isInscrit && (
              <>
                <div style={{ fontSize:11, padding:'6px 12px', borderRadius:8, background:'rgba(150,212,133,0.08)', border:'1px solid rgba(150,212,133,0.2)', color:'#96d485' }}>✓ Inscrit</div>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <LumenBadge amount={-3} />
                  <button onClick={() => onDesinscrit(atelier.id, atelier.lumen_price ?? 0)} style={{ fontSize:10, padding:'6px 10px', borderRadius:8, background:'none', border:'none', color:'rgba(242,237,224,0.3)', cursor:'pointer', fontFamily:'Jost,sans-serif' }}>
                    {atelier.price > 0 ? "Se désinscrire · contacter l'animateur" : 'Se désinscrire'}
                  </button>
                </div>
              </>
            )}
            {/* CLOCHE RAPPEL */}
            {!isFull && (
              <button onClick={toggleReminder} disabled={reminderLoading} title={hasReminder ? 'Supprimer le rappel' : 'Me rappeler 24h, 2h et 30min avant'} style={{ marginLeft:'auto', fontSize:14, padding:'6px 10px', borderRadius:8, background: hasReminder ? 'rgba(232,212,168,0.1)' : 'rgba(255,255,255,0.04)', border:`1px solid ${hasReminder ? 'rgba(232,212,168,0.3)' : 'rgba(255,255,255,0.1)'}`, color: hasReminder ? '#e8d4a8' : 'rgba(242,237,224,0.35)', cursor:'pointer', transition:'all .2s' }}>
                {hasReminder ? '🔔' : '🔕'}
              </button>
            )}
          </>
        )}
        {/* LIEN VISIO — visible si inscrit OU animateur, atelier en ligne, pas encore terminé */}
        {!isPast && atelier.format === 'online' && atelier.location && (isMine || isInscrit) && (
          <a href={atelier.location} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, background:'rgba(150,212,133,0.1)', border:'1px solid rgba(150,212,133,0.25)', color:'#c8f0b8', fontSize:11, fontFamily:'Jost,sans-serif', textDecoration:'none', width:'fit-content' }}>
            🌐 Accéder à l&apos;atelier
          </a>
        )}
        {isMine && !isPast && (
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => onInvite?.(atelier.id, atelier.theme, atelier.format)} style={{ fontSize:10, padding:'6px 12px', borderRadius:8, background:'rgba(150,212,133,0.08)', border:'1px solid rgba(150,212,133,0.2)', color:'#96d485', cursor:'pointer', fontFamily:'Jost,sans-serif' }}>
              ✉️ Inviter
            </button>
            <button onClick={() => onDelete(atelier.id, atelier.title)} style={{ fontSize:10, padding:'6px 12px', borderRadius:8, background:'rgba(210,80,80,0.07)', border:'1px solid rgba(210,80,80,0.18)', color:'rgba(255,130,130,0.65)', cursor:'pointer', fontFamily:'Jost,sans-serif' }}>
              🗑 Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const iStyle = { width:'100%', padding:'9px 12px', background:'#1e3a1e', border:'1px solid rgba(255,255,255,0.15)', borderRadius:9, fontSize:12, fontFamily:'Jost,sans-serif', color:'#f2ede0', outline:'none', boxSizing:'border-box', colorScheme:'dark' }
const btnStyle = { padding:'9px 18px', background:'linear-gradient(135deg,rgba(122,173,110,.25),rgba(122,173,110,.15))', border:'1px solid rgba(150,212,133,0.4)', borderRadius:9, fontSize:12, fontFamily:'Jost,sans-serif', color:'#c8f0b8', cursor:'pointer', transition:'all .2s' }

function ScreenAteliers({ userId, awardLumens, lumens }) {
  const isMobile = useIsMobile()
  const [showFilter, setShowFilter] = useState(false)
  const [ateliers,    setAteliers]    = useState([])
  const [myReg,       setMyReg]       = useState([]) // ids des ateliers où je suis inscrit
  const [isAnimator,  setIsAnimator]  = useState(false)
  const [showCreate,  setShowCreate]  = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('upcoming') // upcoming | mine | past
  const [showApply,   setShowApply]   = useState(false)
  const [hasApplied,  setHasApplied]  = useState(false)
  const [toast,       setToast]       = useState(null)
  const [searchTheme,  setSearchTheme]  = useState('')
  const [searchAnim,   setSearchAnim]   = useState('')
  const [animators,    setAnimators]    = useState([])
  const [prefs,        setPrefs]        = useState({ themes:[], formats:['online','presentiel'], notify_email:true })
  const [invitations,  setInvitations]  = useState([])
  const [prefsSaved,   setPrefsSaved]   = useState(false)
  const [topAteliers,    setTopAteliers]    = useState([])
  const [myRatings,      setMyRatings]      = useState({}) // atelierID → rating
  const [showInvitePanel, setShowInvitePanel] = useState(false)

  function showToastLocal(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { loadAll() }, [userId])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadAteliers(), loadMyReg(), checkAnimator(), checkApplication(), loadAnimators(), loadPrefs(), loadInvitations(), loadTopAteliers(), loadMyRatings()])
    setLoading(false)
  }

  async function loadTopAteliers() {
    const now = new Date().toISOString()
    // Ateliers à venir avec leur moyenne de notes
    const { data } = await supabase
      .from('ateliers')
      .select('id, title, theme, starts_at, format, atelier_registrations(count), atelier_ratings(rating)')
      .eq('is_published', true)
      .gte('starts_at', now)
      .order('starts_at', { ascending: true })
      .limit(20)
    if (!data) return
    const scored = data.map(a => {
      const ratings = a.atelier_ratings ?? []
      const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0
      const count = a.atelier_registrations?.[0]?.count ?? 0
      return { ...a, avgRating: avg, ratingCount: ratings.length, registrationCount: count, score: avg * 2 + count }
    }).sort((a, b) => b.score - a.score).slice(0, 4)
    setTopAteliers(scored)
  }

  async function loadMyRatings() {
    const { data } = await supabase.from('atelier_ratings').select('atelier_id, rating').eq('user_id', userId)
    const map = {}
    ;(data ?? []).forEach(r => { map[r.atelier_id] = r.rating })
    setMyRatings(map)
  }

  async function handleRate(atelierIdVal, rating) {
    await supabase.from('atelier_ratings').upsert({ atelier_id: atelierIdVal, user_id: userId, rating }, { onConflict: 'atelier_id,user_id' })
    setMyRatings(prev => ({ ...prev, [atelierIdVal]: rating }))
    loadTopAteliers()
  }

  async function loadPrefs() {
    const { data } = await supabase.from('atelier_preferences').select('*').eq('user_id', userId).maybeSingle()
    if (data) setPrefs({ themes: data.themes ?? [], formats: data.formats ?? ['online','presentiel'], notify_email: data.notify_email ?? true })
  }

  async function loadInvitations() {
    const { data } = await supabase.from('atelier_invitations').select('*, atelier:atelier_id(title, starts_at, theme, format)').eq('user_id', userId).eq('seen', false)
    setInvitations(data ?? [])
  }

  async function savePrefs(newPrefs) {
    const p = { ...prefs, ...newPrefs }
    setPrefs(p)
    await supabase.from('atelier_preferences').upsert({ user_id: userId, ...p }, { onConflict: 'user_id' })
    setPrefsSaved(true)
    setTimeout(() => setPrefsSaved(false), 2000)
  }

  async function handleInviteMatching(atelierIdVal, theme, format) {
    // Cherche tous les users dont prefs matchent
    const { data: allPrefs } = await supabase.from('atelier_preferences')
      .select('user_id, themes, formats')
      .contains('themes', [theme])
    const matched = (allPrefs ?? []).filter(p => p.formats?.includes(format) && p.user_id !== userId)
    if (!matched.length) { showToastLocal('Aucun utilisateur correspondant aux critères'); return }
    const invites = matched.map(p => ({ atelier_id: atelierIdVal, user_id: p.user_id }))
    await supabase.from('atelier_invitations').upsert(invites, { onConflict: 'atelier_id,user_id' })
    showToastLocal(`✉️ ${matched.length} invitation${matched.length > 1 ? 's' : ''} envoyée${matched.length > 1 ? 's' : ''} !`)
  }

  async function markInviteSeen(inviteId) {
    await supabase.from('atelier_invitations').update({ seen: true }).eq('id', inviteId)
    setInvitations(prev => prev.filter(i => i.id !== inviteId))
  }

  async function loadAnimators() {
    const { data } = await supabase.from('ateliers').select('animator_id').eq('is_published', true)
    if (!data?.length) return
    const ids = [...new Set(data.map(a => a.animator_id))]
    const { data: usersData } = await supabase.from('users').select('id, display_name').in('id', ids)
    setAnimators(usersData ?? [])
  }

  async function loadAteliers() {
    const { data } = await supabase
      .from('ateliers')
      .select('*, atelier_registrations(count), animator:animator_id(display_name, profession), lumen_price')
      .eq('is_published', true)
      .order('starts_at', { ascending: true })
    setAteliers((data ?? []).map(a => ({ ...a, registrationCount: a.atelier_registrations?.[0]?.count ?? 0 })))
  }

  async function loadMyReg() {
    const { data } = await supabase.from('atelier_registrations').select('atelier_id').eq('user_id', userId)
    setMyReg((data ?? []).map(r => r.atelier_id))
  }

  async function checkAnimator() {
    const { data } = await supabase.from('users').select('is_animator').eq('id', userId).single()
    setIsAnimator(data?.is_animator === true)
  }

  async function checkApplication() {
    const { data } = await supabase.from('animator_applications').select('id').eq('user_id', userId).maybeSingle()
    setHasApplied(!!data)
  }

  async function handleInscrire(atelierIdVal) {
    await supabase.from('atelier_registrations').insert({ atelier_id: atelierIdVal, user_id: userId })
    setMyReg(prev => [...prev, atelierIdVal])
    loadAteliers()
    showToastLocal('✅ Inscription confirmée ! +3 ✦')
    awardLumens?.(3, 'inscription_atelier', { atelier_id: atelierIdVal })
  }

  async function handleDesinscrire(atelierIdVal, lumenPrice = 0) {
    await supabase.from('atelier_registrations').delete().eq('atelier_id', atelierIdVal).eq('user_id', userId)
    setMyReg(prev => prev.filter(id => id !== atelierIdVal))
    loadAteliers()

    // Retirer le bonus d'inscription (+3)
    awardLumens?.(-3, 'desinscription_atelier', { atelier_id: atelierIdVal })

    // Rembourser le paiement en Lumens si applicable
    if (lumenPrice > 0) {
      const { data: tx } = await supabase
        .from('lumen_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('reason', 'atelier_payment')
        .contains('meta', { atelier_id: atelierIdVal })
        .limit(1)
      if (tx?.length > 0) {
        await supabase.from('lumens').update({ available: (lumens?.available ?? 0) + lumenPrice }).eq('user_id', userId)
        await supabase.from('lumen_transactions').insert({ user_id: userId, amount: lumenPrice, reason: 'atelier_refund', meta: { atelier_id: atelierIdVal } })
        showToastLocal(`↩ Désinscription · ${lumenPrice} ✦ remboursés`)
        return
      }
    }
    showToastLocal('↩ Désinscription effectuée · -3 ✦')
  }

  async function handleCreate(fields) {
    const { data, error } = await supabase.from('ateliers').insert({ ...fields, animator_id: userId, is_published: true }).select().single()
    if (!error) { setShowCreate(false); loadAteliers(); showToastLocal('✨ Atelier créé !') }
  }

  async function handlePayLumens(atelierIdVal, lumenPrice) {
    if (!lumens || lumens.available < lumenPrice) {
      showToastLocal(`✦ Lumens insuffisants — il vous faut ${lumenPrice} Lumens (vous en avez ${lumens?.available ?? 0})`)
      return
    }
    if (!confirm(`Payer ${lumenPrice} ✦ Lumens pour cet atelier ?`)) return
    // Déduire les lumens disponibles
    await supabase.from('lumens').update({ available: lumens.available - lumenPrice }).eq('user_id', userId)
    await supabase.from('lumen_transactions').insert({ user_id: userId, amount: -lumenPrice, reason: 'atelier_payment', meta: { atelier_id: atelierIdVal } })
    // Inscrire
    await supabase.from('atelier_registrations').insert({ atelier_id: atelierIdVal, user_id: userId })
    setMyReg(prev => [...prev, atelierIdVal])
    loadAteliers()
    showToastLocal(`✦ Payé ${lumenPrice} Lumens · Inscription confirmée !`)
    awardLumens?.(3, 'inscription_atelier', { atelier_id: atelierIdVal })
  }

  async function handleDelete(atelierIdVal, titleVal) {
    if (!confirm(`Supprimer l'atelier "${titleVal}" ?`)) return
    await supabase.from('atelier_registrations').delete().eq('atelier_id', atelierIdVal)
    await supabase.from('ateliers').delete().eq('id', atelierIdVal)
    loadAteliers()
    showToastLocal('🗑 Atelier supprimé')
  }

  async function handleApply(motivation, experience) {
    await supabase.from('animator_applications').insert({ user_id: userId, motivation, experience })
    setHasApplied(true)
    setShowApply(false)
    showToastLocal('📩 Candidature envoyée !')
  }

  const now = new Date()
  const upcoming = ateliers.filter(a => new Date(a.starts_at) >= now)
  const past = ateliers.filter(a => new Date(a.starts_at) < now)
  const mine = ateliers.filter(a => a.animator_id === userId)
  const myInscriptions = upcoming.filter(a => myReg.includes(a.id) && a.animator_id !== userId)

  const applySearch = (list) => list.filter(a => {
    const themeMatch = !searchTheme || a.theme === searchTheme
    const animMatch = !searchAnim || a.animator_id === searchAnim
    return themeMatch && animMatch
  })
  const displayed = applySearch(tab === 'upcoming' ? upcoming : tab === 'mine' ? (isAnimator ? mine : myInscriptions) : past)

  const sStyle = { width:'100%', padding:'8px 10px', background:'#1a2e1a', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, fontSize:11, fontFamily:'Jost,sans-serif', color:'#f2ede0', outline:'none', colorScheme:'dark' }

  return (
    <div style={{ flex:1, overflow: isMobile ? 'auto' : 'hidden', display:'flex', flexDirection: isMobile ? 'column' : 'row', gap:0 }} className='at-layout'>
      {/* PANNEAU DROITE */}
      <div className='at-right' style={{ width: isMobile ? '100%' : 220, flexShrink:0, borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.07)', borderBottom: isMobile ? '1px solid rgba(255,255,255,0.07)' : 'none', padding: isMobile ? '10px 14px' : '20px 16px', overflowY: isMobile ? 'visible' : 'auto', display: isMobile && !showFilter ? 'none' : 'block', order: isMobile ? -1 : 2 }}>
        
        {/* RECHERCHE */}
        <div>
          <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#e8d4a8', lineHeight:1.3, marginBottom:12 }}>Je recherche<br/><em style={{ color:'#96d485' }}>mon atelier</em></div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div>
              <div style={{ fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(242,237,224,0.4)', marginBottom:4 }}>Thème</div>
              <select style={sStyle} value={searchTheme} onChange={e=>setSearchTheme(e.target.value)}>
                <option value="">Tous les thèmes</option>
                {THEMES_LIST.map(([emoji,label]) => <option key={label} value={label}>{emoji} {label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(242,237,224,0.4)', marginBottom:4 }}>Animateur</div>
              <select style={sStyle} value={searchAnim} onChange={e=>setSearchAnim(e.target.value)}>
                <option value="">Tous les animateurs</option>
                {animators.map(u => <option key={u.id} value={u.id}>{u.display_name ?? 'Anonyme'}</option>)}
              </select>
            </div>
            {(searchTheme || searchAnim) && (
              <button onClick={() => { setSearchTheme(''); setSearchAnim('') }} style={{ fontSize:10, color:'rgba(242,237,224,0.35)', background:'none', border:'none', cursor:'pointer', fontFamily:'Jost,sans-serif', textAlign:'left', padding:0 }}>
                ✕ Effacer
              </button>
            )}
          </div>
        </div>

        <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)' }} />

        {/* INVITATIONS — visible si badge cliqué */}
        {showInvitePanel && invitations.length > 0 && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color:'#e8d4a8' }}>✉️ Invitations</div>
              <button onClick={() => setShowInvitePanel(false)} style={{ fontSize:10, background:'none', border:'none', color:'rgba(242,237,224,0.3)', cursor:'pointer', fontFamily:'Jost,sans-serif' }}>✕</button>
            </div>
            {invitations.map(inv => (
              <div key={inv.id} style={{ padding:'8px 10px', borderRadius:9, background:'rgba(232,212,168,0.06)', border:'1px solid rgba(232,212,168,0.18)', marginBottom:6 }}>
                <div style={{ fontSize:11, color:'#f2ede0', marginBottom:2, lineHeight:1.3 }}>{getThemeEmoji(inv.atelier?.theme)} <b>{inv.atelier?.title}</b></div>
                <div style={{ fontSize:9, color:'rgba(242,237,224,0.4)', marginBottom:6 }}>
                  {inv.atelier?.starts_at ? new Date(inv.atelier.starts_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : ''}
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <button onClick={() => {
                    setTab('upcoming')
                    setShowInvitePanel(false)
                    markInviteSeen(inv.id)
                    setTimeout(() => {
                      const el = document.getElementById(`atelier-${inv.atelier_id}`)
                      if (el) el.scrollIntoView({ behavior:'smooth', block:'center' })
                    }, 150)
                  }} style={{ fontSize:10, padding:'3px 9px', borderRadius:6, background:'rgba(232,212,168,0.15)', border:'1px solid rgba(232,212,168,0.3)', color:'#e8d4a8', cursor:'pointer', fontFamily:'Jost,sans-serif' }}>Voir →</button>
                  <button onClick={() => markInviteSeen(inv.id)} style={{ fontSize:10, padding:'3px 7px', borderRadius:6, background:'none', border:'none', color:'rgba(242,237,224,0.25)', cursor:'pointer', fontFamily:'Jost,sans-serif' }}>✕</button>
                </div>
              </div>
            ))}
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', marginTop:4, paddingTop:4 }}>
              <button onClick={() => { invitations.forEach(inv => markInviteSeen(inv.id)); setShowInvitePanel(false) }} style={{ fontSize:9, color:'rgba(242,237,224,0.25)', background:'none', border:'none', cursor:'pointer', fontFamily:'Jost,sans-serif' }}>Tout ignorer</button>
            </div>
          </div>
        )}

        {/* TOP ATELIERS */}
        <div>
          <div style={{ fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(242,237,224,0.4)', marginBottom:10 }}>✨ Ateliers populaires</div>
          {topAteliers.length === 0 ? (
            <div style={{ fontSize:11, color:'rgba(242,237,224,0.25)', fontStyle:'italic' }}>Aucun atelier noté pour l&apos;instant</div>
          ) : topAteliers.map(a => (
            <div key={a.id} onClick={() => { setSearchTheme(a.theme); setTab('upcoming') }} style={{ padding:'9px 10px', borderRadius:9, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', marginBottom:7, cursor:'pointer', transition:'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
              <div style={{ fontSize:12, color:'#f2ede0', marginBottom:3, lineHeight:1.3 }}>{a.title}</div>
              <div style={{ fontSize:9, color:'rgba(242,237,224,0.4)', marginBottom:6 }}>{getThemeEmoji(a.theme)} {a.theme}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', gap:2 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} onClick={e => { e.stopPropagation(); handleRate(a.id, s) }} style={{ fontSize:11, cursor:'pointer', color: s <= (myRatings[a.id] ?? Math.round(a.avgRating)) ? '#e8d4a8' : 'rgba(242,237,224,0.2)', transition:'color .15s' }}>★</span>
                  ))}
                </div>
                <div style={{ fontSize:9, color:'rgba(242,237,224,0.35)' }}>{a.registrationCount}/{a.max_participants ?? '?'} 👥</div>
              </div>
              {a.ratingCount > 0 && (
                <div style={{ fontSize:9, color:'rgba(232,212,168,0.5)', marginTop:3 }}>{a.avgRating.toFixed(1)}/5 · {a.ratingCount} avis</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CONTENU PRINCIPAL — gauche */}
      <div className='at-main' style={{ flex:1, overflowY:'auto', padding: isMobile ? '14px 14px 80px' : '24px 28px' }}>
      {/* HEADER */}
      {isMobile && <button onClick={() => setShowFilter(f => !f)} style={{ fontSize:10, padding:'6px 12px', background: showFilter ? 'rgba(150,212,133,0.15)' : 'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, color: showFilter ? '#c8f0b8' : 'rgba(242,237,224,0.6)', cursor:'pointer', marginBottom:10, display:'block' }}>{'⚙ ' + (showFilter ? 'Masquer filtres' : 'Filtrer')}</button>}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:26, fontWeight:300, color:'#e8d4a8' }}>Ateliers</div>
          <div style={{ fontSize:11, color:'rgba(242,237,224,0.45)', letterSpacing:'.05em', marginTop:2 }}>Moments partagés, guidés par des animateurs</div>
        </div>
        {isAnimator ? (
          <button onClick={() => setShowCreate(true)} style={btnStyle}>✨ Créer un atelier</button>
        ) : hasApplied ? (
          <div style={{ fontSize:11, color:'rgba(242,237,224,0.4)', fontStyle:'italic' }}>📩 Candidature en cours d'examen</div>
        ) : (
          <button onClick={() => setShowApply(true)} style={{ ...btnStyle, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(242,237,224,0.6)', fontSize:11 }}>
            Devenir animateur
          </button>
        )}
      </div>

      <div style={{ display:'flex', gap:0, borderBottom:'1px solid rgba(255,255,255,0.08)', marginBottom:20, overflowX: isMobile ? 'auto' : 'visible', flexWrap:'nowrap', WebkitOverflowScrolling:'touch' }}>
        {[
          { id:'upcoming', label:`À venir (${upcoming.length})`, short:`(${upcoming.length})` },
          { id:'mine',     label: isAnimator ? `Mes ateliers (${mine.length})` : `Mes inscriptions (${myInscriptions.length})` },
          { id:'past',     label:`Passés (${past.length})` },
          { id:'prefs', label:'⚙ Préférences' },
        ].map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{ padding: isMobile ? '7px 10px' : '8px 16px', fontSize: isMobile ? 10 : 11, whiteSpace:'nowrap', letterSpacing:'.07em', cursor:'pointer', borderBottom:`2px solid ${tab===t.id ? '#96d485' : 'transparent'}`, color: tab===t.id ? '#c8f0b8' : 'rgba(242,237,224,0.5)', marginBottom:-1, transition:'all .2s', display:'flex', alignItems:'center', gap:6, position:'relative' }}>
            {t.label}
            {t.id === 'prefs' && invitations.length > 0 && (
              <div onClick={e => { e.stopPropagation(); setShowInvitePanel(p => !p) }} style={{ fontSize:9, fontWeight:600, borderRadius:100, background:'linear-gradient(135deg,#e8d4a8,#c9a84c)', color:'#1a2e1a', display:'inline-flex', alignItems:'center', padding:'2px 7px', whiteSpace:'nowrap', cursor:'pointer' }}>
                {invitations.length} invitation{invitations.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        ))}
      </div>



      {/* ONGLET PRÉFÉRENCES */}
      {tab === 'prefs' ? (
        <div style={{ maxWidth:420 }}>
          <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#e8d4a8', marginBottom:4 }}>Mes préférences d&apos;atelier</div>
          <div style={{ fontSize:11, color:'rgba(242,237,224,0.45)', marginBottom:20 }}>Les animateurs pourront vous inviter selon ces critères.</div>

          {/* Thèmes */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(242,237,224,0.5)', marginBottom:8 }}>Thèmes qui m&apos;intéressent</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {THEMES_LIST.map(([emoji, label]) => {
                const active = prefs.themes.includes(label)
                return (
                  <div key={label} onClick={() => {
                    const themes = active ? prefs.themes.filter(t => t !== label) : [...prefs.themes, label]
                    savePrefs({ themes })
                  }} style={{ padding:'5px 12px', borderRadius:100, fontSize:11, cursor:'pointer', transition:'all .2s', background: active ? 'rgba(150,212,133,0.15)' : 'rgba(255,255,255,0.04)', border:`1px solid ${active ? 'rgba(150,212,133,0.35)' : 'rgba(255,255,255,0.1)'}`, color: active ? '#c8f0b8' : 'rgba(242,237,224,0.5)' }}>
                    {emoji} {label}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Format */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(242,237,224,0.5)', marginBottom:8 }}>Format</div>
            <div style={{ display:'flex', gap:8 }}>
              {[['online','🌐 En ligne'], ['presentiel','📍 Présentiel']].map(([val, lbl]) => {
                const active = prefs.formats.includes(val)
                return (
                  <div key={val} onClick={() => {
                    const formats = active ? prefs.formats.filter(f => f !== val) : [...prefs.formats, val]
                    if (formats.length === 0) return
                    savePrefs({ formats })
                  }} style={{ padding:'7px 16px', borderRadius:9, fontSize:11, cursor:'pointer', transition:'all .2s', background: active ? 'rgba(150,212,133,0.12)' : 'rgba(255,255,255,0.04)', border:`1px solid ${active ? 'rgba(150,212,133,0.3)' : 'rgba(255,255,255,0.1)'}`, color: active ? '#c8f0b8' : 'rgba(242,237,224,0.5)' }}>
                    {lbl}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Notification email */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(242,237,224,0.5)', marginBottom:8 }}>Notifications</div>
            <div onClick={() => savePrefs({ notify_email: !prefs.notify_email })} style={{ display:'inline-flex', alignItems:'center', gap:8, cursor:'pointer' }}>
              <div style={{ width:32, height:18, borderRadius:100, background: prefs.notify_email ? 'rgba(150,212,133,0.4)' : 'rgba(255,255,255,0.1)', border:`1px solid ${prefs.notify_email ? 'rgba(150,212,133,0.5)' : 'rgba(255,255,255,0.15)'}`, position:'relative', transition:'all .2s' }}>
                <div style={{ position:'absolute', top:2, left: prefs.notify_email ? 14 : 2, width:12, height:12, borderRadius:100, background: prefs.notify_email ? '#96d485' : 'rgba(242,237,224,0.3)', transition:'all .2s' }} />
              </div>
              <span style={{ fontSize:11, color:'rgba(242,237,224,0.6)' }}>Recevoir les invitations par email</span>
            </div>
          </div>

          {prefsSaved && <div style={{ fontSize:11, color:'#96d485' }}>✓ Préférences sauvegardées</div>}
        </div>
      ) : (
        <>
        {loading ? (
          <div style={{ textAlign:'center', color:'rgba(242,237,224,0.3)', fontSize:12, padding:40 }}>Chargement…</div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign:'center', color:'rgba(242,237,224,0.3)', fontSize:12, fontStyle:'italic', padding:40, border:'1px dashed rgba(255,255,255,0.08)', borderRadius:12 }}>
            {tab === 'upcoming' ? "Aucun atelier à venir pour l'instant" : tab === 'mine' ? isAnimator ? "Vous n'avez pas encore créé d'atelier" : "Vous n'êtes inscrit à aucun atelier" : 'Aucun atelier passé'}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap:12 }}>
            {displayed.map(a => (
              <AtelierCard key={a.id} atelier={a} isInscrit={myReg.includes(a.id)} isAnimator={isAnimator} isMine={a.animator_id === userId} onInscrit={handleInscrire} onDesinscrit={handleDesinscrire} onDelete={handleDelete} userId={userId} onInvite={handleInviteMatching} onPayLumens={handlePayLumens} lumens={lumens} />
            ))}
          </div>
        )}
        </>
      )}

      {/* MODAL CRÉER */}
      {showCreate && <CreateAtelierModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}

      {/* MODAL CANDIDATURE */}
      {showApply && <ApplyAnimatorModal userId={userId} onClose={() => setShowApply(false)} onSubmit={handleApply} />}

      {toast && <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'rgba(30,60,30,0.97)', border:'1px solid rgba(150,212,133,0.4)', borderRadius:10, padding:'10px 20px', fontSize:12, color:'#c8f0b8', zIndex:999 }}>{toast}</div>}
      </div>
    </div>
  )
}

function ApplyAnimatorModal({ onClose, onSubmit }) {
  const [motivation,  setMotivation]  = useState('')
  const [experience,  setExperience]  = useState('')
  const [loading,     setLoading]     = useState(false)

  async function handleSend() {
    if (!motivation.trim()) return
    setLoading(true)
    await onSubmit(motivation.trim(), experience.trim())
    setLoading(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#1e3a1e', border:'1px solid rgba(255,255,255,0.15)', borderRadius:16, padding:32, width:440 }}>
        <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, color:'#e8d4a8', marginBottom:6 }}>Devenir animateur</div>
        <div style={{ fontSize:11, color:'rgba(242,237,224,0.45)', marginBottom:24 }}>Votre candidature sera examinée par l'équipe Mon Jardin.</div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(242,237,224,0.5)', marginBottom:5 }}>Votre motivation *</div>
          <textarea style={{...iStyle, height:90, resize:'none'}} value={motivation} onChange={e=>setMotivation(e.target.value)} placeholder="Pourquoi souhaitez-vous animer des ateliers bien-être ?" />
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(242,237,224,0.5)', marginBottom:5 }}>Expérience (optionnel)</div>
          <textarea style={{...iStyle, height:70, resize:'none'}} value={experience} onChange={e=>setExperience(e.target.value)} placeholder="Formation, pratique, certifications…" />
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ ...btnStyle, background:'rgba(255,255,255,0.05)', color:'rgba(242,237,224,0.5)', flex:1 }}>Annuler</button>
          <button onClick={handleSend} disabled={loading || !motivation.trim()} style={{ ...btnStyle, flex:2, opacity:!motivation.trim()?0.4:1 }}>
            {loading ? '…' : '📩 Envoyer ma candidature'}
          </button>
        </div>
      </div>
    </div>
  )
}



export { ScreenAteliers }
