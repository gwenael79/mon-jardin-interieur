// ─────────────────────────────────────────────────────────────────────────────
//  ScreenAteliers.jsx  —  Écran "Ateliers"
//  Contient : CreateAtelierModal, useCountdown, CountdownDisplay,
//             AtelierCard, ScreenAteliers, ApplyAnimatorModal
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react"
import { logActivity } from '../utils/logActivity'
import { useAnalytics } from '../hooks/useAnalytics'
import { supabase } from '../core/supabaseClient'
import { useIsMobile, LumenBadge, getThemeEmoji, THEMES_LIST, callModerateCircle } from './dashboardShared'

// ═══════════════════════════════════════════════════════
//  SCREEN ATELIERS
// ═══════════════════════════════════════════════════════

function AtelierFormModal({ onClose, onCreate, onEdit, initialData }) {
  const isRepublish = !!initialData?._isRepublish
  const isEdit = !!initialData && !isRepublish
  const sourceId = initialData?._sourceId ?? null
  const [title,      setTitle]      = useState(initialData?.title ?? '')
  const [rawDesc,    setRawDesc]    = useState(initialData?.description ?? '')
  const [aiDesc,     setAiDesc]     = useState('')
  const [aiLoading,  setAiLoading]  = useState(false)
  const [theme,      setTheme]      = useState(initialData?.theme ?? '')
  const [startsAt,   setStartsAt]   = useState(initialData?.starts_at ? initialData.starts_at.slice(0,16) : '')
  const [duration,   setDuration]   = useState(initialData?.duration_minutes ?? 60)
  const [maxP,       setMaxP]       = useState(initialData?.max_participants ?? 10)
  const [format,     setFormat]     = useState(initialData?.format ?? 'online')
  const [location,   setLocation]   = useState(initialData?.location ?? '')
  const [price,      setPrice]      = useState(initialData?.price ?? 0)
  const [lumenPrice, setLumenPrice] = useState(initialData?.lumen_price ?? 0)
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
    const fields = { title: title.trim(), description: aiDesc || rawDesc, theme, starts_at: startsAt, duration_minutes: Number(duration), max_participants: Number(maxP), format, location, price: Number(price), lumen_price: lumenPrice ? Number(lumenPrice) : null, ...(isRepublish && sourceId ? { parent_id: sourceId } : {}) }
    try {
      if (isEdit) await onEdit(initialData.id, fields)
      else await onCreate(fields)
    } finally { setLoading(false) }
  }

  const fStyle = { marginBottom:14 }
  const lStyle = { fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(242,237,224,0.5)', marginBottom:5, display:'block' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#1e3a1e', border:'1px solid rgba(255,255,255,0.15)', borderRadius:16, padding:28, width:500, maxHeight:'92vh', overflowY:'auto' }}>
        <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, color:'#e8d4a8', marginBottom:20 }}>{isEdit ? '✏️ Modifier l\'atelier' : isRepublish ? '🔄 Republier l\'atelier' : '✨ Créer un atelier'}</div>

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
            {loading ? '…' : isEdit ? '✏️ Enregistrer les modifications' : isRepublish ? '🔄 Republier' : "✨ Créer l'atelier"}
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


function ReviewModal({ atelier, userId, existingReview, onClose, onSubmit }) {
  const [rating,  setRating]  = useState(existingReview?.rating ?? 0)
  const [comment, setComment] = useState(existingReview?.comment ?? '')
  const [hover,   setHover]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  async function handleSubmit() {
    if (!rating) return
    setLoading(true)
    await onSubmit(atelier.id, rating, comment.trim())
    setLoading(false)
    setDone(true)
    setTimeout(onClose, 1800)
  }

  const lStyle = { fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(242,237,224,0.45)', marginBottom:6, display:'block' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 16px' }}>
      <div style={{ background:'#1a2e1a', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, padding:28, width:'100%', maxWidth:420 }}>
        {done ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🌿</div>
            <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#e8d4a8' }}>Merci pour votre avis !</div>
            <div style={{ fontSize:11, color:'rgba(242,237,224,0.45)', marginTop:8 }}>Il sera visible après validation.</div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:20, color:'#e8d4a8', marginBottom:6 }}>
              ⭐ Évaluer l'atelier
            </div>
            <div style={{ fontSize:11, color:'rgba(242,237,224,0.45)', marginBottom:20, fontStyle:'italic' }}>{atelier.title}</div>

            {/* Étoiles */}
            <div style={{ marginBottom:20 }}>
              <label style={lStyle}>Votre note</label>
              <div style={{ display:'flex', gap:8 }}>
                {[1,2,3,4,5].map(s => (
                  <span key={s}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(s)}
                    style={{ fontSize:28, cursor:'pointer', color: s <= (hover || rating) ? '#F6C453' : 'rgba(242,237,224,0.15)', transition:'color .1s', userSelect:'none' }}>
                    ★
                  </span>
                ))}
                {rating > 0 && (
                  <span style={{ fontSize:11, color:'rgba(242,237,224,0.45)', alignSelf:'center', marginLeft:4 }}>
                    {['','Décevant','Passable','Bien','Très bien','Excellent'][rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Commentaire */}
            <div style={{ marginBottom:20 }}>
              <label style={lStyle}>Votre avis (optionnel)</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Partagez votre expérience…"
                maxLength={500}
                style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:9, fontSize:12, fontFamily:'Jost,sans-serif', color:'#f2ede0', outline:'none', resize:'none', height:90, boxSizing:'border-box', colorScheme:'dark' }}
              />
              <div style={{ fontSize:9, color:'rgba(242,237,224,0.25)', textAlign:'right', marginTop:3 }}>{comment.length}/500</div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onClose} style={{ flex:1, padding:'9px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, fontSize:12, fontFamily:'Jost,sans-serif', color:'rgba(242,237,224,0.5)', cursor:'pointer' }}>
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={!rating || loading} style={{ flex:2, padding:'9px', background: rating ? 'linear-gradient(135deg,rgba(246,196,83,.25),rgba(246,196,83,.15))' : 'rgba(255,255,255,0.04)', border:`1px solid ${rating ? 'rgba(246,196,83,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius:9, fontSize:12, fontFamily:'Jost,sans-serif', color: rating ? '#F6C453' : 'rgba(242,237,224,0.25)', cursor: rating ? 'pointer' : 'default', transition:'all .2s' }}>
                {loading ? '…' : existingReview ? '✏️ Modifier mon avis' : '⭐ Publier mon avis'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ReviewsPanel({ atelier, reviews, totalCount }) {
  const [open, setOpen] = useState(false)
  if (!reviews?.length && totalCount === 0) return null
  const avg = reviews.length ? reviews.reduce((s,r) => s + r.rating, 0) / reviews.length : 0

  return (
    <div style={{ marginTop:4 }}>
      <button onClick={() => setOpen(v => !v)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ display:'flex', gap:2 }}>
          {[1,2,3,4,5].map(s => (
            <span key={s} style={{ fontSize:11, color: s <= Math.round(avg) ? '#F6C453' : 'rgba(242,237,224,0.15)' }}>★</span>
          ))}
        </div>
        <span style={{ fontSize:10, color:'rgba(242,237,224,0.5)', fontFamily:'Jost,sans-serif' }}>
          {avg.toFixed(1)} · {totalCount} avis
        </span>
        <span style={{ fontSize:9, color:'rgba(242,237,224,0.3)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8, paddingLeft:4, borderLeft:'2px solid rgba(246,196,83,0.15)' }}>
          {reviews.map(r => (
            <div key={r.id} style={{ fontSize:11 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                <div style={{ display:'flex', gap:1 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize:10, color: s <= r.rating ? '#F6C453' : 'rgba(242,237,224,0.15)' }}>★</span>
                  ))}
                </div>
                <span style={{ fontSize:9, color:'rgba(242,237,224,0.3)', fontFamily:'Jost,sans-serif' }}>
                  {r.reviewer?.display_name ?? 'Participant'} · {new Date(r.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
                </span>
              </div>
              {r.comment && <div style={{ color:'rgba(242,237,224,0.6)', lineHeight:1.5, fontStyle:'italic' }}>{r.comment}</div>}
            </div>
          ))}
          {totalCount > reviews.length && (
            <div style={{ fontSize:10, color:'rgba(242,237,224,0.3)', fontStyle:'italic' }}>+{totalCount - reviews.length} autre(s) avis</div>
          )}
        </div>
      )}
    </div>
  )
}

function AtelierCard({ atelier, onInscrit, onDesinscrit, isInscrit, isAnimator, isMine, onDelete, onEditAtelier, onRepublish, userId, onInvite, onPayLumens, lumens, reviews, myReview, onReview }) {
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

      {/* AVIS — panel public */}
      <ReviewsPanel atelier={atelier} reviews={reviews ?? []} totalCount={reviews?.length ?? 0} />

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
        {/* BOUTON AVIS — participant d'un atelier passé */}
        {isPast && isInscrit && !isMine && (
          <button onClick={() => onReview?.(atelier)} style={{ fontSize:10, padding:'6px 12px', borderRadius:8, background: myReview ? 'rgba(246,196,83,0.08)' : 'rgba(246,196,83,0.12)', border:`1px solid ${myReview ? 'rgba(246,196,83,0.2)' : 'rgba(246,196,83,0.35)'}`, color:'#F6C453', cursor:'pointer', fontFamily:'Jost,sans-serif', display:'flex', alignItems:'center', gap:5 }}>
            {myReview ? `✏️ Mon avis (${myReview.rating}★)` : '⭐ Laisser un avis'}
          </button>
        )}

        {/* LIEN VISIO — visible si inscrit OU animateur, atelier en ligne, pas encore terminé */}
        {!isPast && atelier.format === 'online' && atelier.location && (isMine || isInscrit) && (
          <a href={atelier.location} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, background:'rgba(150,212,133,0.1)', border:'1px solid rgba(150,212,133,0.25)', color:'#c8f0b8', fontSize:11, fontFamily:'Jost,sans-serif', textDecoration:'none', width:'fit-content' }}>
            🌐 Accéder à l&apos;atelier
          </a>
        )}
        {isMine && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {!isPast && (
              <button onClick={() => onInvite?.(atelier.id, atelier.theme, atelier.format)} style={{ fontSize:10, padding:'6px 12px', borderRadius:8, background:'rgba(150,212,133,0.08)', border:'1px solid rgba(150,212,133,0.2)', color:'#96d485', cursor:'pointer', fontFamily:'Jost,sans-serif' }}>
                ✉️ Inviter
              </button>
            )}
            <button onClick={() => onEditAtelier?.(atelier)} style={{ fontSize:10, padding:'6px 12px', borderRadius:8, background:'rgba(232,212,168,0.07)', border:'1px solid rgba(232,212,168,0.2)', color:'#e8d4a8', cursor:'pointer', fontFamily:'Jost,sans-serif' }}>
              ✏️ Modifier
            </button>
            {isPast && (
              <button onClick={() => onRepublish?.(atelier)} style={{ fontSize:10, padding:'6px 12px', borderRadius:8, background:'rgba(150,212,133,0.08)', border:'1px solid rgba(150,212,133,0.25)', color:'#96d485', cursor:'pointer', fontFamily:'Jost,sans-serif' }}>
                🔄 Republier
              </button>
            )}
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
  const { track } = useAnalytics(userId)
  const isMobile = useIsMobile()
  const [showFilter, setShowFilter] = useState(false)
  const [ateliers,    setAteliers]    = useState([])
  const [myReg,       setMyReg]       = useState([]) // ids des ateliers où je suis inscrit
  const [isAnimator,  setIsAnimator]  = useState(false)
  const [showCreate,   setShowCreate]  = useState(false)
  const [editAtelier,  setEditAtelier] = useState(null)   // atelier à éditer (ou template republication)
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
  const [reviewModal,    setReviewModal]    = useState(null)  // atelier en cours d'évaluation
  const [reviewsByAtelier, setReviewsByAtelier] = useState({}) // atelierID → reviews[]
  const [myReviews,      setMyReviews]      = useState({})    // atelierID → mon review
  const [showInvitePanel, setShowInvitePanel] = useState(false)

  function showToastLocal(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { loadAll() }, [userId])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadAteliers(), loadMyReg(), checkAnimator(), checkApplication(), loadAnimators(), loadPrefs(), loadInvitations(), loadTopAteliers(), loadReviews()])
    setLoading(false)
  }

  async function loadTopAteliers() {
    // Tous les ateliers publiés (passés et à venir) avec leurs avis approuvés
    const { data: atelierData } = await supabase
      .from('ateliers')
      .select('id, title, theme, starts_at, format, max_participants, atelier_registrations(count)')
      .eq('is_published', true)
      .order('starts_at', { ascending: false })
      .limit(50)
    if (!atelierData) return

    const { data: reviewData } = await supabase
      .from('atelier_reviews')
      .select('atelier_id, rating')
      .eq('status', 'approved')

    // Remonter parent_id pour agréger
    const { data: links } = await supabase.from('ateliers').select('id, parent_id')
    const pMap = Object.fromEntries((links ?? []).map(a => [a.id, a.parent_id]))
    const getRoot2 = (id) => { let c = id; const s = new Set(); while (pMap[c] && !s.has(c)) { s.add(c); c = pMap[c] } return c }

    // Calculer moyenne par atelier (en agrégeant toute la famille)
    const reviewMap = {}
    ;(reviewData ?? []).forEach(r => {
      const root = getRoot2(r.atelier_id)
      ;[r.atelier_id, root].forEach(key => {
        if (!reviewMap[key]) reviewMap[key] = []
        if (!reviewMap[key].includes(r.rating)) reviewMap[key].push(r.rating)
      })
    })

    const scored = atelierData.map(a => {
      const ratings = reviewMap[a.id] ?? []
      const avg = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0
      const count = a.atelier_registrations?.[0]?.count ?? 0
      return { ...a, registrationCount: count, avgRating: avg, reviewCount: ratings.length }
    })
    .filter(a => a.reviewCount > 0)   // seulement les ateliers avec avis
    .sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount)
    .slice(0, 5)
    setTopAteliers(scored)
  }



  async function loadReviews() {
    const { data } = await supabase
      .from('atelier_reviews')
      .select('id, atelier_id, rating, comment, created_at, status, reviewer:user_id(display_name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    if (!data) return

    // Récupère les parent_id pour agréger les avis de toute la famille (sans filtre is_published ni date)
    const { data: atelierLinks } = await supabase
      .from('ateliers')
      .select('id, parent_id')

    // Construire : parentMap (enfant → parent) + childrenMap (parent → [enfants])
    const parentMap  = {}
    const childrenMap = {}
    ;(atelierLinks ?? []).forEach(a => {
      parentMap[a.id] = a.parent_id
      if (a.parent_id) {
        if (!childrenMap[a.parent_id]) childrenMap[a.parent_id] = []
        childrenMap[a.parent_id].push(a.id)
      }
    })

    // Tous les IDs de la même famille (ancêtres + descendants)
    const getFamily = (id) => {
      const family = new Set([id])
      // Remonte vers la racine
      let cur = id
      while (parentMap[cur]) { cur = parentMap[cur]; family.add(cur) }
      // Descend vers tous les enfants récursivement
      const addChildren = (pid) => {
        ;(childrenMap[pid] ?? []).forEach(cid => { family.add(cid); addChildren(cid) })
      }
      addChildren(id)
      // Descend aussi depuis la racine
      addChildren(cur)
      return family
    }

    // Chaque avis est distribué à tous les membres de la famille
    const byAtelier = {}
    data.forEach(r => {
      getFamily(r.atelier_id).forEach(key => {
        if (!byAtelier[key]) byAtelier[key] = []
        if (!byAtelier[key].find(x => x.id === r.id)) byAtelier[key].push(r)
      })
    })
    setReviewsByAtelier(byAtelier)

    // Mes propres avis (pending ou approved)
    const { data: mine } = await supabase
      .from('atelier_reviews')
      .select('id, atelier_id, rating, comment, status')
      .eq('user_id', userId)
    const myMap = {}
    ;(mine ?? []).forEach(r => { myMap[r.atelier_id] = r })
    setMyReviews(myMap)
  }

  async function handleSubmitReview(atelierIdVal, rating, comment) {
    const existing = myReviews[atelierIdVal]
    if (existing) {
      await supabase.from('atelier_reviews').update({ rating, comment, status: 'pending' }).eq('id', existing.id)
    } else {
      await supabase.from('atelier_reviews').insert({ atelier_id: atelierIdVal, user_id: userId, rating, comment, status: 'pending' })
    }
    track('atelier_review', { atelier_id: atelierIdVal, rating }, 'ateliers', 'ateliers')
    await loadReviews()
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
    track('atelier_register', { atelier_id: atelierIdVal }, 'ateliers', 'ateliers')
    logActivity({ userId, action: 'atelier' })
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
    if (!error) { track('atelier_create', { atelier_id: data?.id }, 'ateliers', 'ateliers'); setShowCreate(false); loadAteliers(); showToastLocal('✨ Atelier créé !') }
  }

  async function handleEdit(atelierIdVal, fields) {
    const { error } = await supabase.from('ateliers').update(fields).eq('id', atelierIdVal).eq('animator_id', userId)
    if (!error) { track('atelier_edit', { atelier_id: atelierIdVal }, 'ateliers', 'ateliers'); setEditAtelier(null); loadAteliers(); showToastLocal('✏️ Atelier modifié !') }
  }

  async function handleRepublish(atelier) {
    // Pré-remplit le formulaire avec les données de l'atelier passé, sans l'id → création d'un nouveau
    // _sourceId = id de l'atelier original pour lier les avis
    const sourceId = atelier.parent_id ?? atelier.id
    setEditAtelier({ ...atelier, _isRepublish: true, _sourceId: sourceId, id: null, starts_at: '' })
    setShowCreate(true)
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
    track('animator_apply', {}, 'ateliers', 'ateliers')
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
          <div style={{ fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(242,237,224,0.4)', marginBottom:10 }}>⭐ Ateliers les mieux notés</div>
          {topAteliers.length === 0 ? (
            <div style={{ fontSize:11, color:'rgba(242,237,224,0.25)', fontStyle:'italic' }}>Les avis apparaîtront ici une fois approuvés</div>
          ) : topAteliers.map(a => (
            <div key={a.id} onClick={() => { setTab('past') }} style={{ padding:'9px 10px', borderRadius:9, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', marginBottom:7, cursor:'pointer', transition:'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
              <div style={{ fontSize:12, color:'#f2ede0', marginBottom:2, lineHeight:1.3 }}>{a.title}</div>
              <div style={{ fontSize:9, color:'rgba(242,237,224,0.4)', marginBottom:5 }}>{getThemeEmoji(a.theme)} {a.theme}</div>
              <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:3 }}>
                {[1,2,3,4,5].map(s => (
                  <span key={s} style={{ fontSize:10, color: s <= Math.round(a.avgRating) ? '#F6C453' : 'rgba(242,237,224,0.15)' }}>★</span>
                ))}
                <span style={{ fontSize:9, color:'rgba(246,196,83,0.7)', marginLeft:2 }}>{a.avgRating.toFixed(1)}</span>
                <span style={{ fontSize:9, color:'rgba(242,237,224,0.3)' }}>· {a.reviewCount} avis</span>
              </div>
              <div style={{ fontSize:9, color:'rgba(242,237,224,0.3)' }}>{a.registrationCount} participant{a.registrationCount > 1 ? 's' : ''}</div>
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
          { id:'mine', label: isAnimator
        ? <span style={{display:'flex',alignItems:'center',gap:6}}>
            Mes ateliers ({mine.length})
            {mine.some(a => (reviewsByAtelier[a.id] ?? []).length > 0) && (
              <span style={{ background:'rgba(246,196,83,0.25)', border:'1px solid rgba(246,196,83,0.4)', borderRadius:100, fontSize:8, padding:'1px 5px', color:'#F6C453' }}>★ avis</span>
            )}
          </span>
        : `Mes inscriptions (${myInscriptions.length})` },
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
              <AtelierCard key={a.id} atelier={a} isInscrit={myReg.includes(a.id)} isAnimator={isAnimator} isMine={a.animator_id === userId} onInscrit={handleInscrire} onDesinscrit={handleDesinscrire} onDelete={handleDelete} onEditAtelier={a => setEditAtelier(a)} onRepublish={handleRepublish} userId={userId} onInvite={handleInviteMatching} onPayLumens={handlePayLumens} lumens={lumens} reviews={reviewsByAtelier[a.id] ?? []} myReview={myReviews[a.id]} onReview={atelier => setReviewModal(atelier)} />
            ))}
          </div>
        )}
        </>
      )}

      {/* MODAL CRÉER */}
      {(showCreate || editAtelier) && (
        <AtelierFormModal
          onClose={() => { setShowCreate(false); setEditAtelier(null) }}
          onCreate={handleCreate}
          onEdit={handleEdit}
          initialData={editAtelier?._isRepublish ? { ...editAtelier, id: null } : editAtelier}
        />
      )}

      {/* MODAL CANDIDATURE */}
      {showApply && <ApplyAnimatorModal userId={userId} onClose={() => setShowApply(false)} onSubmit={handleApply} />}
      {reviewModal && (
        <ReviewModal
          atelier={reviewModal}
          userId={userId}
          existingReview={myReviews[reviewModal.id]}
          onClose={() => setReviewModal(null)}
          onSubmit={handleSubmitReview}
        />
      )}

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
