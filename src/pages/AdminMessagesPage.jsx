import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { supabase } from '../core/supabaseClient'
import { ADMIN_IDS } from './AdminPage'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;width:100%}
:root{
  --bg:#2b2f33;--bg2:#353a3f;--bg3:#3e444a;
  --border:rgba(255,255,255,0.18);--border2:rgba(255,255,255,0.10);
  --green:#96d485;--greenT:rgba(150,212,133,0.50);--green2:rgba(150,212,133,0.12);
  --gold:#e8d4a8;
}
.adm-root{font-family:'Jost',sans-serif;background:#2b2f33!important;min-height:100vh;width:100vw;color:#fff!important;display:flex;flex-direction:column}
.adm-root *{color:#fff!important}
.adm-topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 40px;border-bottom:1px solid var(--border2);background:#353a3f!important;position:sticky;top:0;z-index:10}
.adm-logo{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:300;letter-spacing:.05em}
.adm-logo em{font-style:italic;color:var(--green)}
.adm-body{flex:1;padding:32px 40px;max-width:760px;width:100%}
.adm-btn{padding:7px 16px;border-radius:8px;font-size:12px;letter-spacing:.06em;cursor:pointer;border:none;font-family:'Jost',sans-serif;transition:all .2s;white-space:nowrap}
.adm-btn.ghost{background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.20)}
.adm-btn.ghost:hover{background:rgba(255,255,255,0.16)}
.adm-btn.success{background:rgba(100,180,80,0.20);border:1px solid var(--greenT)}
.adm-btn.success:hover{background:rgba(100,180,80,0.32)}
.adm-btn:disabled{opacity:.4;cursor:not-allowed}
.adm-empty{font-size:14px;color:rgba(255,255,255,0.45);font-style:italic;padding:28px;text-align:center;background:#3d4248;border-radius:12px;border:1px dashed var(--border2)}
.adm-toast{position:fixed;bottom:24px;right:24px;background:#3e444a!important;border:1px solid var(--greenT);border-radius:10px;padding:10px 20px;font-size:14px;z-index:999;animation:fadeUp .3s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

/* Filtres */
.filter-chip{padding:5px 14px;border-radius:20px;font-size:12px;cursor:pointer;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);transition:all .18s;font-family:'Jost',sans-serif}
.filter-chip.active{background:rgba(150,212,133,0.15);border-color:rgba(150,212,133,0.40);color:#c8f0b8}

/* Thread card */
.thread-card{background:#3d4248;border-radius:14px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;transition:border-color .2s}
.thread-card.has-pending{border-color:rgba(232,180,60,0.30)}
.thread-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;cursor:pointer;user-select:none;transition:background .15s;gap:12px}
.thread-head:hover{background:rgba(255,255,255,0.03)}
.thread-head-left{display:flex;flex-direction:column;gap:3px;min-width:0}
.thread-name{font-size:14px;font-weight:500;color:rgba(255,255,255,0.90)}
.thread-meta{font-size:11px;color:rgba(255,255,255,0.40)}
.thread-head-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.thread-badge{padding:2px 9px;border-radius:10px;font-size:10px;font-weight:600;letter-spacing:.06em}
.thread-badge.pending{background:rgba(232,180,60,0.18);border:1px solid rgba(232,180,60,0.35);color:#f0d878}
.thread-badge.done{background:rgba(150,212,133,0.12);border:1px solid rgba(150,212,133,0.25);color:#c8f0b8}
.thread-chevron{font-size:12px;color:rgba(255,255,255,0.35);transition:transform .2s}
.thread-chevron.open{transform:rotate(180deg)}

/* Conversation */
.thread-body{border-top:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;background:#32373c}
.msg-exchange{display:flex;flex-direction:column}
.msg-exchange + .msg-exchange{border-top:1px solid rgba(255,255,255,0.04)}

/* Ligne pro */
.msg-pro-block{padding:14px 20px 10px}
.msg-pro-label{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:6px;display:flex;align-items:center;gap:6px}
.msg-pro-initial{width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,0.12);display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:rgba(255,255,255,0.55)}
.msg-pro-text{font-size:16px;color:rgba(255,255,255,0.88);line-height:1.70;white-space:pre-wrap}

/* Ligne admin */
.msg-admin-block{padding:10px 20px 14px;background:rgba(90,154,40,0.07);border-left:3px solid rgba(150,212,133,0.35)}
.msg-admin-header{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.msg-admin-label{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(150,212,133,0.55)}
.msg-admin-date-line{font-size:11px;color:rgba(150,212,133,0.38)}
.msg-admin-text{font-size:16px;color:rgba(255,255,255,0.88);line-height:1.70;white-space:pre-wrap}

/* Sans réponse + répondre */
.msg-pending-block{padding:10px 20px;display:flex;align-items:center;gap:10px;background:rgba(232,180,60,0.04);border-left:3px solid rgba(232,180,60,0.30)}
.msg-pending-label{font-size:11px;color:rgba(232,180,60,0.60);font-style:italic;flex:1}
.msg-reply-btn{padding:5px 16px;border-radius:20px;border:1px solid rgba(150,212,133,0.35);background:rgba(150,212,133,0.10);color:rgba(150,212,133,0.85);font-size:12px;cursor:pointer;font-family:'Jost',sans-serif;transition:all .15s;white-space:nowrap;font-weight:500}
.msg-reply-btn:hover{background:rgba(150,212,133,0.20);border-color:rgba(150,212,133,0.55)}

/* Formulaire */
.reply-form{padding:14px 20px 16px;background:#2c3035;border-top:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;gap:10px;animation:fadeUp .15s ease}
.reply-textarea{width:100%;padding:10px 14px;border-radius:10px;border:1px solid rgba(150,212,133,0.25);background:#363b40;color:rgba(255,255,255,0.90);font-size:13.5px;font-family:'Jost',sans-serif;resize:none;outline:none;line-height:1.6}
.reply-textarea:focus{border-color:rgba(150,212,133,0.55)}
.reply-actions{display:flex;gap:8px;justify-content:flex-end}

@media(max-width:700px){
  .adm-topbar{padding:10px 12px;gap:8px;flex-wrap:wrap}
  .adm-logo span{display:none}
  .adm-body{padding:12px 12px;max-width:100%}
  .adm-btn{padding:6px 12px;font-size:11px}

  /* Nav : icônes uniquement */
  .nav-label{display:none}
  .nav-icon{display:inline!important}

  /* Threads */
  .thread-head{padding:12px 14px}
  .thread-name{font-size:13px}
  .thread-meta{font-size:10px}
  .thread-badge{font-size:9px;padding:2px 7px}

  /* Messages */
  .msg-pro-block{padding:12px 14px 8px}
  .msg-admin-block{padding:10px 14px 12px}
  .msg-pro-text,.msg-admin-text{font-size:15px}
  .msg-admin-header{flex-wrap:wrap;gap:5px}
  .msg-pending-block{padding:8px 14px;flex-wrap:wrap;gap:8px}
  .msg-reply-btn{width:100%}

  /* Formulaire */
  .reply-form{padding:12px 14px 14px}
  .reply-textarea{font-size:16px}
  .reply-actions{flex-direction:column-reverse}
  .reply-actions .adm-btn{width:100%;text-align:center;padding:10px}

  /* Filtres */
  .filter-chip{font-size:11px;padding:5px 10px}
}
`

function AdminNav({ current, pendingMessages = 0 }) {
  const navItems = [
    { hash: '#admin',    label: 'Admin',    icon: '🛡' },
    { hash: '#clients',  label: 'Clients',  icon: '👥' },
    { hash: '#activite', label: 'Activité', icon: '🌿' },
    { hash: '#pros',     label: 'Pros',     icon: '💼' },
    { hash: '#messages', label: 'Messages', icon: '💬', badge: pendingMessages },
  ]
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {navItems.map(({ hash, label, icon, badge }) => {
        const active = current === hash
        return (
          <a key={hash} href={hash} style={{ position: 'relative', padding: '6px 14px', borderRadius: 8, fontSize: 11, letterSpacing: '.06em', textDecoration: 'none', fontFamily: "'Jost',sans-serif", transition: 'all .2s', background: active ? 'rgba(150,212,133,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${active ? 'rgba(150,212,133,0.4)' : 'rgba(255,255,255,0.10)'}`, color: active ? '#c8f0b8' : 'rgba(242,237,224,0.55)' }}>
            {icon}<span className="nav-label"> {label}</span>
            {badge > 0 && <span style={{ position: 'absolute', top: 3, right: 3, width: 7, height: 7, borderRadius: '50%', background: '#e05a2b' }} />}
          </a>
        )
      })}
    </div>
  )
}

export function AdminMessagesPage() {
  useTheme()
  const { user, signOut } = useAuth()
  const isAdmin = ADMIN_IDS.includes(user?.id)

  const [messages,     setMessages]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState('all')
  const [openThreads,  setOpenThreads]  = useState(new Set())
  const [responding,   setResponding]   = useState(null)
  const [replyText,    setReplyText]    = useState('')
  const [replySending, setReplySending] = useState(false)
  const [toast,        setToast]        = useState(null)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2800) }

  async function loadMessages() {
    setLoading(true)
    const { data } = await supabase
      .from('pro_messages')
      .select('*, users_pro(id, prenom, nom, email)')
      .order('created_at', { ascending: true })
    const msgs = data ?? []
    setMessages(msgs)
    setLoading(false)
    // Ouvrir automatiquement les threads avec des messages en attente
    const pendingProIds = new Set(msgs.filter(m => !m.response).map(m => m.users_pro_id))
    setOpenThreads(pendingProIds)
  }

  useEffect(() => { if (!isAdmin) return; loadMessages() }, [isAdmin])

  async function sendReply(msgId) {
    if (!replyText.trim()) return
    setReplySending(true)
    const { error } = await supabase.from('pro_messages').update({
      response: replyText.trim(), responded_at: new Date().toISOString(), read_by_pro: false,
    }).eq('id', msgId)
    if (error) { showToast("Erreur lors de l'envoi"); setReplySending(false); return }
    setMessages(prev => prev.map(m => m.id === msgId
      ? { ...m, response: replyText.trim(), responded_at: new Date().toISOString(), read_by_pro: false }
      : m))
    setResponding(null)
    setReplyText('')
    setReplySending(false)
    showToast('Réponse envoyée ✓')
  }

  function toggleThread(proId) {
    setOpenThreads(prev => {
      const next = new Set(prev)
      next.has(proId) ? next.delete(proId) : next.add(proId)
      return next
    })
  }

  const fmt = d => new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  // Grouper par pro
  const threads = Object.values(
    messages.reduce((acc, m) => {
      const pid = m.users_pro_id
      if (!acc[pid]) acc[pid] = { proId: pid, pro: m.users_pro, msgs: [] }
      acc[pid].msgs.push(m)
      return acc
    }, {})
  ).sort((a, b) => {
    const aPending = a.msgs.some(m => !m.response)
    const bPending = b.msgs.some(m => !m.response)
    if (aPending !== bPending) return aPending ? -1 : 1
    const aLast = a.msgs[a.msgs.length - 1]?.created_at ?? ''
    const bLast = b.msgs[b.msgs.length - 1]?.created_at ?? ''
    return bLast.localeCompare(aLast)
  })

  const filteredThreads = threads.filter(t => {
    if (filter === 'pending') return t.msgs.some(m => !m.response)
    if (filter === 'done')    return t.msgs.every(m => !!m.response)
    return true
  })

  const pendingCount = messages.filter(m => !m.response).length

  if (!isAdmin) return null

  return (
    <div className="adm-root">
      <style>{css}</style>

      <div className="adm-topbar">
        <div className="adm-logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/icons/icon-192.png" alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
          Mon <em>Jardin</em> — <span style={{ fontFamily: 'Jost', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '.2em' }}>MESSAGES</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AdminNav current="#messages" pendingMessages={pendingCount} />
          <button className="adm-btn ghost" onClick={() => { signOut(); window.location.href = '/' }}>
            <span className="nav-label">Déconnexion</span><span style={{ display:'none' }} className="nav-icon">✕</span>
          </button>
        </div>
      </div>

      <div className="adm-body">

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, marginBottom: 6 }}>
            💬 Messagerie pros
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            {threads.length} conversation{threads.length !== 1 ? 's' : ''}
            {pendingCount > 0 && <span style={{ marginLeft: 10, color: '#f0d878', fontWeight: 500 }}>· {pendingCount} sans réponse</span>}
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { key: 'all',     label: 'Toutes' },
            { key: 'pending', label: `En attente${pendingCount ? ` (${pendingCount})` : ''}` },
            { key: 'done',    label: 'Traitées' },
          ].map(f => (
            <button key={f.key} className={`filter-chip${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
          <button className="adm-btn ghost" onClick={loadMessages} style={{ marginLeft: 'auto', fontSize: 11 }}>↺ Actualiser</button>
        </div>

        {/* Threads */}
        {loading ? (
          <div className="adm-empty">Chargement…</div>
        ) : filteredThreads.length === 0 ? (
          <div className="adm-empty">Aucune conversation{filter !== 'all' ? ' dans cette catégorie' : ''}.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredThreads.map(({ proId, pro, msgs }) => {
              const isOpen   = openThreads.has(proId)
              const pending  = msgs.filter(m => !m.response).length
              const lastMsg  = msgs[msgs.length - 1]
              return (
                <div key={proId} className={`thread-card${pending > 0 ? ' has-pending' : ''}`}>

                  {/* En-tête cliquable */}
                  <div className="thread-head" onClick={() => toggleThread(proId)}>
                    <div className="thread-head-left">
                      <div className="thread-name">{pro?.prenom} {pro?.nom}</div>
                      <div className="thread-meta">
                        {pro?.email} · {msgs.length} message{msgs.length > 1 ? 's' : ''}
                        {!isOpen && lastMsg && <span style={{ opacity: .6 }}> · {fmt(lastMsg.created_at)}</span>}
                      </div>
                    </div>
                    <div className="thread-head-right">
                      {pending > 0
                        ? <span className="thread-badge pending">{pending} en attente</span>
                        : <span className="thread-badge done">✓ Traité</span>
                      }
                      <span className={`thread-chevron${isOpen ? ' open' : ''}`}>▼</span>
                    </div>
                  </div>

                  {/* Corps de la conversation */}
                  {isOpen && (
                    <div className="thread-body">
                      {msgs.map(m => {
                        const initials = ((pro?.prenom?.[0] ?? '') + (pro?.nom?.[0] ?? '')).toUpperCase()
                        const isReplying = responding === m.id
                        return (
                          <div key={m.id} className="msg-exchange">

                            {/* Message du pro */}
                            <div className="msg-pro-block">
                              <div className="msg-pro-label">
                                <span className="msg-pro-initial">{initials}</span>
                                {pro?.prenom} {pro?.nom}
                                <span style={{ fontWeight: 400, opacity: .6, marginLeft: 4 }}>· {fmt(m.created_at)}</span>
                              </div>
                              <div className="msg-pro-text">{m.content}</div>
                            </div>

                            {/* Réponse admin */}
                            {m.response && !isReplying && (
                              <div className="msg-admin-block">
                                <div className="msg-admin-header">
                                  <span className="msg-admin-label">🌿 Mon Jardin Intérieur</span>
                                  <span className="msg-admin-date-line">{m.responded_at ? fmt(m.responded_at) : ''}</span>
                                </div>
                                <div className="msg-admin-text">{m.response}</div>
                              </div>
                            )}

                            {/* Sans réponse */}
                            {!m.response && !isReplying && (
                              <div className="msg-pending-block">
                                <span className="msg-pending-label">En attente de réponse…</span>
                                <button className="msg-reply-btn" onClick={() => { setResponding(m.id); setReplyText('') }}>
                                  ↩ Répondre
                                </button>
                              </div>
                            )}

                            {/* Formulaire */}
                            {isReplying && (
                              <div className="reply-form">
                                <textarea className="reply-textarea" rows={3} autoFocus
                                  value={replyText} onChange={e => setReplyText(e.target.value)}
                                  placeholder={m.response ? 'Modifier la réponse…' : 'Votre réponse au pro…'}
                                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) sendReply(m.id) }}
                                />
                                <div className="reply-actions">
                                  <button className="adm-btn ghost" onClick={() => setResponding(null)}>Annuler</button>
                                  <button className="adm-btn success" disabled={replySending || !replyText.trim()} onClick={() => sendReply(m.id)}>
                                    {replySending ? '…' : m.response ? 'Mettre à jour' : 'Envoyer'}
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}

      </div>

      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  )
}
