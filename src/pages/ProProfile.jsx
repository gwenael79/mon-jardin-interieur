import { useState, useEffect, useRef } from 'react'
import { supabase } from '../core/supabaseClient'
import { VueEspace } from './ScreenJardinotheque'
import { AtelierFormModal } from './ScreenAteliers'

function generateProId() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let id = ''
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return 'mj-' + id
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

@keyframes ppFadeUp  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes ppFadeIn  {from{opacity:0}to{opacity:1}}
@keyframes ppPulse   {0%,100%{opacity:1}50%{opacity:.45}}
@keyframes ppSpin    {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

.pp-wrap {
  min-height:100vh; font-family:'Jost',sans-serif;
  background:#f4f1ec; padding:28px 20px 64px;
}
.pp-header {
  display:flex; align-items:center; justify-content:space-between;
  max-width:840px; margin:0 auto 24px;
  animation:ppFadeUp .45s cubic-bezier(.22,1,.36,1) both;
}
.pp-back {
  display:flex; align-items:center; gap:7px; font-size:13px; color:#666;
  cursor:pointer; background:none; border:none; font-family:'Jost',sans-serif;
  transition:color .18s; padding:0;
}
.pp-back:hover { color:#111; }
.pp-back svg { width:15px; height:15px; }
.pp-header-tag {
  font-size:10px; font-weight:600; letter-spacing:.16em; text-transform:uppercase;
  color:#888; background:#ede9e2; padding:4px 12px; border-radius:20px;
}
.pp-card {
  max-width:840px; margin:0 auto 0;
  background:#fff; border:1px solid #e0ddd6; border-radius:20px 20px 0 0;
  overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,.06);
  animation:ppFadeUp .45s cubic-bezier(.22,1,.36,1) .04s both;
}
.pp-card-banner {
  background:linear-gradient(135deg,#1c1c1c 0%,#2a2a2a 100%);
  padding:24px 28px 22px;
  display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap;
}
.pp-badge-pro {
  display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px;
  background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.18);
  color:rgba(255,255,255,.80); font-size:10px; font-weight:600;
  letter-spacing:.12em; text-transform:uppercase; margin-bottom:10px;
}
.pp-badge-pro.premium {
  background:rgba(120,200,80,.18); border-color:rgba(150,220,100,.45);
  color:#a8e87a;
}
.pp-name {
  font-family:'Cormorant Garamond',serif; font-size:30px; font-weight:600;
  color:#fff; line-height:1.15; margin-bottom:5px;
}
.pp-flower {
  font-family:'Cormorant Garamond',serif; font-size:15px; font-style:italic;
  color:rgba(255,255,255,.50);
}
.pp-id-block { display:flex; flex-direction:column; align-items:flex-end; gap:5px; flex-shrink:0; }
.pp-id-label { font-size:9px; letter-spacing:.16em; text-transform:uppercase; color:rgba(255,255,255,.35); font-weight:600; }
.pp-id-chip {
  display:flex; align-items:center; gap:10px;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15);
  border-radius:10px; padding:9px 16px; cursor:pointer; transition:background .18s;
}
.pp-id-chip:hover { background:rgba(255,255,255,.14); }
.pp-id-value { font-family:'Jost',sans-serif; font-size:17px; font-weight:600; letter-spacing:.14em; color:#fff; user-select:all; }
.pp-id-copy-icon { font-size:12px; color:rgba(255,255,255,.40); }
.pp-id-hint { font-size:10px; color:rgba(255,255,255,.25); }
.pp-id-copied { font-size:11px; color:#7dd45a; font-weight:500; animation:ppFadeIn .2s ease; }

.pp-info-zone { padding:22px 28px 20px; }
.pp-info-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(185px,1fr)); gap:15px 22px; margin-bottom:20px; }
.pp-info-label { font-size:9.5px; letter-spacing:.12em; text-transform:uppercase; color:#aaa; margin-bottom:3px; font-weight:600; }
.pp-info-value { font-size:14px; color:#111; font-weight:400; line-height:1.45; }
.pp-info-value.empty { color:#ccc; font-style:italic; font-size:13px; }
.pp-edit-btn {
  display:inline-flex; align-items:center; gap:6px; padding:8px 18px; border-radius:8px;
  border:1px solid #ddd; background:#fafafa; color:#333; font-size:12.5px; font-weight:500;
  font-family:'Jost',sans-serif; cursor:pointer; transition:all .18s;
}
.pp-edit-btn:hover { background:#f0ede8; border-color:#ccc; color:#111; }

/* ── Onglets ── */
.pp-tabs {
  max-width:840px; margin:0 auto 0;
  display:flex; background:#f9f7f4;
  border-left:1px solid #e0ddd6; border-right:1px solid #e0ddd6;
  animation:ppFadeUp .45s cubic-bezier(.22,1,.36,1) .07s both;
}
.pp-tab {
  flex:1; padding:15px 10px 13px; display:flex; flex-direction:column; align-items:center; gap:5px;
  cursor:pointer; border:none; background:transparent; font-family:'Jost',sans-serif;
  font-size:11.5px; font-weight:500; color:#888; position:relative; transition:all .18s;
  border-bottom:2px solid transparent; border-right:1px solid #ece9e2;
}
.pp-tab:last-child { border-right:none; }
.pp-tab:hover { background:#f4f1ec; color:#333; }
.pp-tab.active { background:#fff; color:#111; font-weight:600; border-bottom-color:#111; }
.pp-tab-icon { font-size:19px; }

.pp-tab-panel {
  max-width:840px; margin:0 auto 24px;
  background:#fff; border:1px solid #e0ddd6; border-top:none; border-radius:0 0 20px 20px;
  box-shadow:0 4px 20px rgba(0,0,0,.05);
  animation:ppFadeUp .45s cubic-bezier(.22,1,.36,1) .07s both;
}
.pp-tab-body { padding:32px 28px; }

.pp-empty { text-align:center; padding:36px 20px 28px; }
.pp-empty-icon { font-size:38px; margin-bottom:14px; opacity:.40; }
.pp-empty-title { font-family:'Cormorant Garamond',serif; font-size:20px; color:#444; margin-bottom:8px; }
.pp-empty-text { font-size:13px; color:#888; line-height:1.72; }
.pp-empty-btn {
  margin-top:20px; display:inline-flex; align-items:center; gap:6px;
  padding:10px 22px; border-radius:8px; border:none; background:#111;
  color:#fff; font-size:13px; font-weight:500; font-family:'Jost',sans-serif; cursor:pointer;
}

.pp-loader { display:flex; align-items:center; justify-content:center; min-height:200px; }
.pp-loader-dot { width:7px; height:7px; border-radius:50%; background:#bbb; margin:0 4px; animation:ppPulse 1.2s ease infinite; }
.pp-loader-dot:nth-child(2) { animation-delay:.2s; }
.pp-loader-dot:nth-child(3) { animation-delay:.4s; }

.pp-modal-overlay {
  position:fixed; inset:0; z-index:999; background:rgba(0,0,0,.45); backdrop-filter:blur(6px);
  display:flex; align-items:center; justify-content:center; padding:20px; animation:ppFadeIn .2s ease both;
}
.pp-modal {
  background:#fff; border-radius:18px; width:min(520px,100%); max-height:88vh; overflow-y:auto;
  padding:32px; position:relative; box-shadow:0 24px 60px rgba(0,0,0,.18);
  border:1px solid #e5e2da; animation:ppFadeUp .3s cubic-bezier(.22,1,.36,1) both;
}
.pp-modal-close {
  position:absolute; top:14px; right:14px; background:#f5f5f5; border:none; border-radius:50%;
  width:28px; height:28px; font-size:14px; cursor:pointer; color:#666;
  display:flex; align-items:center; justify-content:center; transition:background .15s;
}
.pp-modal-close:hover { background:#eee; color:#111; }
.pp-modal-title { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:600; color:#111; margin-bottom:4px; }
.pp-modal-sub { font-size:13px; color:#444; margin-bottom:24px; }
.pp-field { margin-bottom:14px; }
.pp-label { font-size:10px; letter-spacing:.10em; text-transform:uppercase; color:#555; margin-bottom:5px; display:block; font-weight:600; }
.pp-input {
  width:100%; padding:11px 14px; background:#fafafa; border:1px solid #e0ddd6;
  border-radius:10px; font-size:14px; font-family:'Jost',sans-serif; color:#111; outline:none; transition:border-color .18s;
}
.pp-input:focus { border-color:#999; background:#fff; }
.pp-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.pp-save-btn {
  width:100%; padding:13px; border-radius:10px; border:none; background:#111;
  color:#fff; font-size:14px; font-weight:600; font-family:'Jost',sans-serif;
  cursor:pointer; transition:background .18s; margin-top:8px;
}
.pp-save-btn:hover { background:#333; }
.pp-save-btn:disabled { opacity:.35; cursor:not-allowed; }
.pp-error { font-size:12px; color:#c04040; padding:10px 14px; background:#fef2f2; border:1px solid #fca5a5; border-radius:9px; margin-bottom:12px; }

.pp-badge-affiche {
  display:inline-flex; align-items:center; gap:6px; padding:8px 18px; border-radius:8px;
  background:rgba(232,212,168,0.10); border:1px solid rgba(232,212,168,0.35);
  color:#9a7c3f; font-size:12.5px; font-weight:500;
  font-family:'Jost',sans-serif; cursor:pointer; transition:all .18s;
}
.pp-badge-affiche:hover { background:rgba(232,212,168,0.20); border-color:rgba(232,212,168,0.55); }
.pp-affiche-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:200;
  display:flex; align-items:center; justify-content:center; padding:20px;
  animation:ppFadeIn .2s ease;
}
.pp-affiche-box {
  background:#fff; border-radius:16px; width:100%; max-width:480px;
  max-height:90vh; overflow-y:auto; padding:24px;
  display:flex; flex-direction:column; align-items:center; gap:16px;
  box-shadow:0 20px 60px rgba(0,0,0,0.4);
}
.pp-affiche-title {
  font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:600;
  color:#111; align-self:flex-start;
}
.pp-affiche-img {
  width:100%; border-radius:10px; border:1px solid #e5e2dc;
  object-fit:contain; max-height:420px; background:#f9f7f4;
}
.pp-affiche-dl {
  width:100%; padding:13px; border-radius:10px; border:none; background:#111;
  color:#fff; font-size:13px; font-weight:600; font-family:'Jost',sans-serif;
  cursor:pointer; transition:background .18s; text-align:center;
  text-decoration:none; display:block;
}
.pp-affiche-dl:hover { background:#333; }
.pp-affiche-nav {
  display:flex; align-items:center; gap:10px; width:100%;
}
.pp-affiche-arrow {
  flex-shrink:0; width:36px; height:36px; border-radius:50%;
  border:1px solid #ccc; background:#111; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:all .18s; font-size:16px; font-weight:700;
  color:#fff !important; line-height:1;
}
.pp-affiche-arrow:hover { background:#333; }
.pp-affiche-dots {
  display:flex; gap:7px; justify-content:center; width:100%;
}
.pp-affiche-dot {
  width:8px; height:8px; border-radius:50%; border:none; cursor:pointer;
  background:#ddd; transition:background .18s; padding:0;
}
.pp-affiche-dot.active { background:#111; }
.pp-affiche-close {
  align-self:flex-end; font-size:12px; color:#999; cursor:pointer;
  background:none; border:none; font-family:'Jost',sans-serif;
  text-decoration:underline; padding:0;
}

@media(max-width:600px) {
  .pp-wrap { padding:16px 12px 50px; }
  .pp-card-banner { flex-direction:column-reverse; padding:18px 16px; }
  .pp-id-block { align-items:flex-start; }
  .pp-info-zone { padding:18px 16px; }
  .pp-tab-body { padding:22px 16px; }
  .pp-tab { padding:12px 6px 10px; font-size:10.5px; }
  .pp-tab-icon { font-size:17px; }
  .pp-row { grid-template-columns:1fr; }
  .pp-modal { padding:24px 16px; }
}

/* ── Messagerie ── */
.pp-msg-overlay { position:fixed;inset:0;background:rgba(10,20,5,.55);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px; }
.pp-msg-box { background:#fff;border-radius:20px;width:100%;max-width:520px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 16px 48px rgba(30,60,10,.18); }
.pp-msg-head { display:flex;align-items:center;justify-content:space-between;padding:18px 22px 14px;border-bottom:1px solid rgba(0,0,0,.07); }
.pp-msg-title { font-family:'Cormorant Garamond',serif;font-size:21px;font-weight:600;color:#1a1208; }
.pp-msg-close { background:none;border:none;font-size:20px;cursor:pointer;color:#999;line-height:1; }
.pp-msg-list { flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:14px; }
.pp-msg-empty { text-align:center;padding:32px 0;font-size:13px;color:rgba(30,20,8,.40);font-style:italic; }
.pp-msg-item { display:flex;flex-direction:column;gap:8px; }
.pp-msg-bubble { background:rgba(90,154,40,.08);border:1px solid rgba(90,154,40,.18);border-radius:12px 12px 12px 2px;padding:10px 14px; }
.pp-msg-bubble-text { font-size:13.5px;color:#1a1208;line-height:1.55; }
.pp-msg-bubble-date { font-size:10px;color:rgba(30,20,8,.35);margin-top:5px; }
.pp-msg-reply { background:rgba(240,236,220,.70);border:1px solid rgba(200,160,100,.25);border-radius:12px 12px 2px 12px;padding:10px 14px;margin-left:20px; }
.pp-msg-reply-label { font-size:9.5px;letter-spacing:.10em;text-transform:uppercase;color:rgba(30,20,8,.40);margin-bottom:4px;font-weight:600; }
.pp-msg-reply-text { font-size:13.5px;color:#1a1208;line-height:1.55; }
.pp-msg-form { padding:14px 20px 18px;border-top:1px solid rgba(0,0,0,.07);display:flex;flex-direction:column;gap:10px; }
.pp-msg-textarea { width:100%;padding:10px 13px;border-radius:10px;border:1px solid rgba(90,154,40,.30);background:rgba(90,154,40,.04);font-size:13.5px;font-family:'Jost',sans-serif;color:#1a1208;resize:none;outline:none;line-height:1.5; }
.pp-msg-textarea:focus { border-color:rgba(90,154,40,.55); }
.pp-msg-send { align-self:flex-end;padding:9px 22px;border-radius:20px;border:none;background:linear-gradient(135deg,#5a9a28,#3a7a18);color:#fff;font-size:13px;font-weight:600;font-family:'Jost',sans-serif;cursor:pointer;transition:opacity .15s; }
.pp-msg-send:disabled { opacity:.45;cursor:not-allowed; }
.pp-msg-badge { position:absolute;top:-5px;right:-5px;width:16px;height:16px;background:#e05a2b;border-radius:50%;font-size:9px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700; }
`

const AFFICHES = [
  { img: '/affiche-pub.png',  pdf: '/mon-jardin-affiche-1.pdf', label: 'Affiche 1', filename: 'mon-jardin-affiche-1.pdf' },
  { img: '/affiche-pub2.png', pdf: '/mon-jardin-affiche-2.pdf', label: 'Affiche 2', filename: 'mon-jardin-affiche-2.pdf' },
  { img: '/affiche-pub3.png', pdf: '/mon-jardin-affiche-3.pdf', label: 'Affiche 3', filename: 'mon-jardin-affiche-3.pdf' },
]

async function forcedDownload(url, filename) {
  const res = await fetch(url)
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' }))
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}

function AfficheModal({ onClose }) {
  const [idx, setIdx] = useState(0)
  const current = AFFICHES[idx]
  return (
    <div className="pp-affiche-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pp-affiche-box">
        <div className="pp-affiche-title">Affiches publicitaires</div>

        <div className="pp-affiche-nav">
          <button className="pp-affiche-arrow" onClick={() => setIdx(i => (i - 1 + AFFICHES.length) % AFFICHES.length)}>❮</button>
          <img className="pp-affiche-img" src={current.img} alt={current.label} />
          <button className="pp-affiche-arrow" onClick={() => setIdx(i => (i + 1) % AFFICHES.length)}>❯</button>
        </div>

        <div className="pp-affiche-dots">
          {AFFICHES.map((_, i) => (
            <button key={i} className={`pp-affiche-dot${i === idx ? ' active' : ''}`} onClick={() => setIdx(i)} />
          ))}
        </div>

        <button className="pp-affiche-dl" onClick={() => forcedDownload(current.pdf, current.filename)}>
          ⬇ Télécharger {current.label} (PDF)
        </button>
        <button className="pp-affiche-close" onClick={onClose}>Fermer</button>
      </div>
    </div>
  )
}

function MessagingModal({ proId, onClose }) {
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [newMsg,   setNewMsg]   = useState('')
  const [sending,  setSending]  = useState(false)

  useEffect(() => {
    if (!proId) return
    supabase.from('pro_messages').select('*').eq('users_pro_id', proId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? [])
        setLoading(false)
        // Marquer les réponses comme lues
        const unread = (data ?? []).filter(m => m.response && !m.read_by_pro).map(m => m.id)
        if (unread.length) {
          supabase.from('pro_messages').update({ read_by_pro: true }).in('id', unread).then(() => {})
        }
      })
  }, [proId])

  async function send() {
    if (!newMsg.trim() || !proId) return
    setSending(true)
    const { data } = await supabase.from('pro_messages')
      .insert({ users_pro_id: proId, content: newMsg.trim() })
      .select().single()
    if (data) setMessages(m => [...m, data])
    setNewMsg('')
    setSending(false)
  }

  const fmt = d => new Date(d).toLocaleString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })

  return (
    <div className="pp-msg-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pp-msg-box">
        <div className="pp-msg-head">
          <div className="pp-msg-title">💬 Messagerie</div>
          <button className="pp-msg-close" onClick={onClose}>✕</button>
        </div>
        <div className="pp-msg-list">
          {loading ? (
            <div className="pp-msg-empty">Chargement…</div>
          ) : messages.length === 0 ? (
            <div className="pp-msg-empty">Aucun message pour l'instant.<br/>Posez votre première question ci-dessous.</div>
          ) : messages.map(m => (
            <div key={m.id} className="pp-msg-item">
              <div className="pp-msg-bubble">
                <div className="pp-msg-bubble-text">{m.content}</div>
                <div className="pp-msg-bubble-date">{fmt(m.created_at)}</div>
              </div>
              {m.response && (
                <div className="pp-msg-reply">
                  <div className="pp-msg-reply-label">Réponse Mon Jardin</div>
                  <div className="pp-msg-reply-text">{m.response}</div>
                  <div className="pp-msg-bubble-date" style={{marginTop:4}}>{m.responded_at ? fmt(m.responded_at) : ''}</div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="pp-msg-form">
          <textarea className="pp-msg-textarea" rows={3}
            placeholder="Votre message à l'équipe Mon Jardin Intérieur…"
            value={newMsg} onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) send() }}
          />
          <button className="pp-msg-send" onClick={send} disabled={sending || !newMsg.trim()}>
            {sending ? '…' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ApplyCandidatureForm({ onClose, onSubmit }) {
  const [motivation, setMotivation] = useState('')
  const [experience, setExperience] = useState('')
  const [loading,    setLoading]    = useState(false)
  async function handleSend() {
    if (!motivation.trim()) return
    setLoading(true)
    await onSubmit(motivation.trim(), experience.trim())
    setLoading(false)
  }
  const ta = { width:'100%', padding:'11px 14px', background:'#fafafa', border:'1px solid #e0ddd6', borderRadius:10, fontSize:14, fontFamily:"'Jost',sans-serif", color:'#111', outline:'none', resize:'none', boxSizing:'border-box' }
  return (
    <div>
      <div className="pp-field">
        <label className="pp-label">Votre motivation *</label>
        <textarea style={{...ta, height:90}} value={motivation} onChange={e=>setMotivation(e.target.value)} placeholder="Pourquoi souhaitez-vous animer des ateliers bien-être ?" />
      </div>
      <div className="pp-field">
        <label className="pp-label">Expérience (optionnel)</label>
        <textarea style={{...ta, height:70}} value={experience} onChange={e=>setExperience(e.target.value)} placeholder="Formation, pratique, certifications…" />
      </div>
      <div style={{display:'flex',gap:10,marginTop:8}}>
        <button type="button" onClick={onClose} style={{flex:1,padding:'11px',borderRadius:10,border:'1px solid #ddd',background:'#fafafa',color:'#555',fontSize:13,fontFamily:"'Jost',sans-serif",cursor:'pointer'}}>Annuler</button>
        <button type="button" onClick={handleSend} disabled={loading||!motivation.trim()} style={{flex:2,padding:'11px',borderRadius:10,border:'none',background:'#111',color:'#fff',fontSize:13,fontWeight:600,fontFamily:"'Jost',sans-serif",cursor:'pointer',opacity:!motivation.trim()?0.4:1}}>
          {loading ? '…' : '📩 Envoyer ma candidature'}
        </button>
      </div>
    </div>
  )
}

export function ProProfile({ onBack }) {
  const [proData,    setProData]    = useState(null)
  const [userData,   setUserData]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [copied,     setCopied]     = useState(false)
  const [activeTab,  setActiveTab]  = useState('ateliers')
  const [showEdit,   setShowEdit]   = useState(false)
  const [editForm,   setEditForm]   = useState({})
  const [saving,     setSaving]     = useState(false)
  const [refreshing,  setRefreshing]  = useState(false)
  const [openMonths,   setOpenMonths]   = useState({})
  const [saveError,  setSaveError]  = useState(null)
  const [referrals,  setReferrals]  = useState([])
  const [commissions,setCommissions]= useState([])
  const [ateliers,         setAteliers]         = useState([])
  const [showAtelierModal, setShowAtelierModal] = useState(false)
  const [editAtelierModal, setEditAtelierModal] = useState(null)
  const [showAffiche,      setShowAffiche]      = useState(false)
  const [showMessaging,    setShowMessaging]    = useState(false)
  const [unreadMessages,   setUnreadMessages]   = useState(0)
  const [partenaireData,   setPartenaireData]   = useState(null)
  const [isAnimator,       setIsAnimator]       = useState(false)
  const [hasApplied,       setHasApplied]       = useState(false)
  const [applyStatus,      setApplyStatus]      = useState(null)
  const [showApplyModal,   setShowApplyModal]   = useState(false)
  const [inscriptions,  setInscriptions]  = useState([])
  const [ventesProduits,setVentesProduits]= useState([])
  const promoInitialized = useRef(false)

  useEffect(() => { loadData() }, [])

  async function refreshData() {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  async function loadData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      console.log('[ProProfile] user.id:', user.id, '| user.email:', user.email)

      const { data: u } = await supabase
        .from('users').select('id, display_name, flower_name, role, is_animator, premium_until')
        .eq('id', user.id).single()
      setUserData(u)
      const animator = u?.is_animator === true
      setIsAnimator(animator)
      const { data: appData } = await supabase.from('animator_applications').select('id, status').eq('user_id', user.id).maybeSingle()
      setHasApplied(!!appData)
      setApplyStatus(appData?.status ?? null)

      // 1. Chercher par user_id (si la colonne existe)
      let pro = null
      try {
        const { data } = await supabase
          .from('users_pro').select('*').eq('user_id', user.id).maybeSingle()
        pro = data ?? null
      } catch(_) {}

      // 2. Générer pro_id si absent
      if (pro && !pro.pro_id) {
        const newId = generateProId()
        try {
          const { data: updated } = await supabase
            .from('users_pro').update({ pro_id: newId }).eq('id', pro.id).select().single()
          pro = updated ?? { ...pro, pro_id: newId }
        } catch(_) { pro = { ...pro, pro_id: newId } }
      }

      setProData(pro)

      // Initialiser le code promo Stripe si pas encore fait (une seule fois par mount)
      if (pro && !pro.stripe_promo_code_id && !promoInitialized.current) {
        promoInitialized.current = true
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            await supabase.functions.invoke('init-pro-promo', {
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
            // Recharger pour avoir le stripe_promo_code_id
            const { data: refreshed } = await supabase.from('users_pro').select('*').eq('id', pro.id).single()
            if (refreshed) setProData(refreshed)
          }
        } catch (e) { console.warn('[ProProfile] init-pro-promo:', e) }
      }

      // Compter les réponses non lues
      if (pro) {
        const { count } = await supabase.from('pro_messages')
          .select('id', { count: 'exact', head: true })
          .eq('users_pro_id', pro.id).eq('read_by_pro', false).not('response', 'is', null)
        setUnreadMessages(count ?? 0)
      }

      // Charger referrals, commissions, ateliers, produits
      if (pro) {
        const baseQueries = [
          supabase.from('pro_referrals')
            .select('*, users!client_user_id(display_name, email)')
            .eq('pro_id', pro.id)
            .order('created_at', { ascending: false }),
          supabase.from('pro_commissions')
            .select('*')
            .eq('pro_id', pro.id)
            .order('created_at', { ascending: false }),
        ]
        const [{ data: refs }, { data: comms }] = await Promise.all(baseQueries)
        setReferrals(refs ?? [])
        setCommissions(comms ?? [])

        // Ateliers : seulement si is_animator = true (RLS l'exige)
        let atelData = []
        if (animator) {
          const { data } = await supabase
            .from('ateliers')
            .select('*, atelier_registrations(count)')
            .eq('animator_id', user.id)
            .order('starts_at', { ascending: false })
          atelData = data ?? []
        }
        setAteliers(atelData)

        // Inscriptions ateliers payantes (Stripe uniquement)
        if (atelData.length) {
          const atelIds = atelData.map(a => a.id)
          const { data: inscData } = await supabase
            .from('atelier_registrations')
            .select('*, ateliers(title, starts_at, price), users(display_name)')
            .in('atelier_id', atelIds)
            .not('stripe_session_id', 'is', null)
            .order('registered_at', { ascending: false })
          setInscriptions(inscData ?? [])
        } else {
          setInscriptions([])
        }

        // Partenaire + ventes
        const { data: partenaire } = await supabase
          .from('partenaires').select('*').eq('user_id', user.id).maybeSingle()
        setPartenaireData(partenaire ?? null)

        // Ventes : ateliers insérés avec users_pro_id, produits avec partenaire_id
        const orParts = [`users_pro_id.eq.${pro.id}`]
        if (partenaire) orParts.push(`partenaire_id.eq.${partenaire.id}`)
        const { data: ventesData } = await supabase
          .from('ventes_partenaires')
          .select('*, produits(titre), ateliers(title, starts_at)')
          .or(orParts.join(','))
          .order('created_at', { ascending: false })
        setVentesProduits(ventesData ?? [])
      }
    } catch (e) { console.error('[ProProfile]', e) }
    finally { setLoading(false) }
  }

  async function handleCreateAtelier(fields) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('ateliers').insert({ ...fields, animator_id: user.id, is_published: true })
    setShowAtelierModal(false)
    setEditAtelierModal(null)
    await loadData()
  }

  async function handleEditAtelier(id, fields) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('ateliers').update(fields).eq('id', id).eq('animator_id', user.id)
    setShowAtelierModal(false)
    setEditAtelierModal(null)
    await loadData()
  }

  async function handleDeleteAtelier(id, title) {
    if (!window.confirm(`Supprimer l'atelier "${title}" ?`)) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('atelier_registrations').delete().eq('atelier_id', id)
    await supabase.from('ateliers').delete().eq('id', id).eq('animator_id', user.id)
    await loadData()
  }

  function handleRepublishAtelier(atelier) {
    const sourceId = atelier.parent_id ?? atelier.id
    setEditAtelierModal({ ...atelier, _isRepublish: true, _sourceId: sourceId, id: null, starts_at: '' })
    setShowAtelierModal(true)
  }

  async function handleCreatePartenaire() {
    const { data: { user } } = await supabase.auth.getUser()
    const nomBoutique = proData?.entreprise || `${proData?.prenom ?? ''} ${proData?.nom ?? ''}`.trim() || userData?.display_name || 'Ma boutique'
    const { data, error } = await supabase.from('partenaires').insert({
      user_id: user.id,
      nom_boutique: nomBoutique,
      code_vendeur: proData?.pro_id ?? `pro-${user.id.slice(0, 8)}`,
      email: user.email,
      type_vendeur: 'professionnel',
      statut: 'actif',
      publication_mode: 'direct',
      email_verified: true,
    }).select().single()
    if (!error && data) setPartenaireData(data)
  }

  async function handleApply(motivation, experience) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('animator_applications').insert({ user_id: user.id, motivation, experience })
    setHasApplied(true)
    setShowApplyModal(false)
  }

  async function handleUpgradePro(priceId) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { priceId },
      })
      if (error || !data?.url) throw new Error(error?.message ?? 'Erreur Stripe')
      window.location.href = data.url
    } catch (e) { alert('Erreur : ' + e.message) }
  }

  function copyId() {
    if (!proData?.pro_id) return
    navigator.clipboard.writeText(proData.pro_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openEdit() {
    setEditForm({
      nom: proData?.nom ?? '', prenom: proData?.prenom ?? '',
      entreprise: proData?.entreprise ?? '', activite: proData?.activite ?? '',
      adresse: proData?.adresse ?? '',
      cp: proData?.cp ?? '', ville: proData?.ville ?? '',
      telephone: proData?.telephone ?? '', siret: proData?.siret ?? '',
      site_web: proData?.site_web ?? '',
      facebook: proData?.facebook ?? '',
      instagram: proData?.instagram ?? '',
      linkedin: proData?.linkedin ?? '',
    })
    setSaveError(null); setShowEdit(true)
  }

  async function handleSave(e) {
    e.preventDefault(); setSaveError(null); setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const payload = {
        nom: editForm.nom.trim(), prenom: editForm.prenom.trim(),
        entreprise: editForm.entreprise.trim() || null,
        activite: editForm.activite.trim() || null,
        adresse: editForm.adresse.trim() || null,
        cp: editForm.cp.trim() || null, ville: editForm.ville.trim() || null,
        telephone: editForm.telephone.trim(),
        siret: editForm.siret.replace(/\s/g, ''),
        site_web:  editForm.site_web.trim()  || null,
        facebook:  editForm.facebook.trim()  || null,
        instagram: editForm.instagram.trim() || null,
        linkedin:  editForm.linkedin.trim()  || null,
      }
      console.log('[ProProfile] save payload:', payload, '| user_id:', user.id, '| proData.id:', proData?.id)
      const { data: saved, error } = await supabase.from('users_pro').update(payload)
        .eq('id', proData.id).select().single()
      console.log('[ProProfile] save result:', saved, '| error:', error)
      if (error) throw new Error(error.message)
      await loadData(); setShowEdit(false)
    } catch (err) { setSaveError(err.message) }
    finally { setSaving(false) }
  }

  const upd = f => e => setEditForm(p => ({ ...p, [f]: e.target.value }))
  const val = v => v
    ? <span className="pp-info-value">{v}</span>
    : <span className="pp-info-value empty">—</span>

  const TABS = [
    { id:'ateliers',    icon:'🌿', label:'Mes ateliers'  },
    { id:'outils',      icon:'🪴', label:'Mes outils'    },
    { id:'ventes',      icon:'🧾', label:'Gestion des ventes'      },
    { id:'commissions', icon:'💰', label:'Commissions abonnements' },
  ]

  if (loading) return (
    <div className="pp-wrap"><style>{css}</style>
      <div className="pp-loader">
        <div className="pp-loader-dot"/><div className="pp-loader-dot"/><div className="pp-loader-dot"/>
      </div>
    </div>
  )

  const isProPremium = !!(proData?.pro_premium_until && new Date(proData.pro_premium_until) > new Date())
  const now = new Date()
  const ateliersThisMonth = ateliers.filter(a => {
    if (!a.created_at) return false
    const d = new Date(a.created_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
  const atelierAtLimit = !isProPremium && ateliersThisMonth >= 1

  return (
    <div className="pp-wrap">
      <style>{css}</style>

      <div className="pp-header">
        <button className="pp-back" onClick={onBack}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Mon profil
        </button>
        <div className="pp-header-tag">Espace professionnel</div>
      </div>

      <div className="pp-card">
        <div className="pp-card-banner">
          <div>
            <div className={`pp-badge-pro${isProPremium ? ' premium' : ''}`}>
              {isProPremium ? '✦ Compte Pro Premium' : '✦ Compte Pro'}
            </div>
            <div className="pp-name">{userData?.display_name ?? '—'}</div>
            {userData?.flower_name && <div className="pp-flower">🌸 {userData.flower_name}</div>}
          </div>
          <div className="pp-id-block">
            <div className="pp-id-label">Identifiant partenaire</div>
            {proData?.pro_id ? (
              <>
                <div className="pp-id-chip" onClick={copyId}>
                  <span className="pp-id-value">{proData.pro_id}</span>
                  <span className="pp-id-copy-icon">⎘</span>
                </div>
                {copied
                  ? <span className="pp-id-copied">✓ Copié !</span>
                  : <span className="pp-id-hint">Cliquer pour copier</span>}
              </>
            ) : <span style={{fontSize:12,color:'rgba(255,255,255,.35)'}}>En cours…</span>}
          </div>
        </div>

        <div className="pp-info-zone">
          <div className="pp-info-grid">
            {[
              { label:'Nom',        value: proData?.nom },
              { label:'Prénom',     value: proData?.prenom },
              { label:'Entreprise', value: proData?.entreprise },
              { label:'Activité',   value: proData?.activite },
              { label:'Téléphone',  value: proData?.telephone },
              { label:'Adresse',    value: proData?.adresse },
              { label:'CP / Ville', value: proData?.cp || proData?.ville ? `${proData?.cp ?? ''} ${proData?.ville ?? ''}`.trim() : null },
              { label:'SIRET',      value: proData?.siret },
              { label:'Site internet', value: proData?.site_web },
              { label:'Facebook',      value: proData?.facebook },
              { label:'Instagram',     value: proData?.instagram },
              { label:'LinkedIn',      value: proData?.linkedin },
            ].map(({ label, value }) => (
              <div key={label} className="pp-info-item">
                <div className="pp-info-label">{label}</div>
                {val(value)}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button className="pp-edit-btn" onClick={openEdit}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Modifier mes informations
            </button>
            <button className="pp-badge-affiche" onClick={() => setShowAffiche(true)}>📄 Affiches Pub</button>
            <button className="pp-badge-affiche" onClick={() => { setShowMessaging(true); setUnreadMessages(0) }} style={{ position:'relative' }}>
              💬 Messagerie
              {unreadMessages > 0 && <span className="pp-msg-badge">{unreadMessages}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Onglets — collés sous la carte */}
      <div className="pp-tabs">
        {TABS.map(tab => (
          <button key={tab.id} className={`pp-tab${activeTab===tab.id?' active':''}`} onClick={() => setActiveTab(tab.id)}>
            <span className="pp-tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {!isProPremium && (
        <div style={{maxWidth:840,margin:'0 auto',background:'linear-gradient(135deg,#1c1c1c,#2a2a2a)',borderLeft:'1px solid #333',borderRight:'1px solid #333',padding:'16px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(255,255,255,.45)',marginBottom:4}}>Plan Free</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,.75)'}}>1 atelier/mois · 1 produit en Jardinothèque — Pro Premium pour tout débloquer.</div>
          </div>
          <div style={{flexShrink:0,display:'flex',gap:8,flexWrap:'wrap'}}>
            <button onClick={() => handleUpgradePro('price_1TTjumCIpPVJTaopIY2O2o5K')}
              style={{padding:'8px 20px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#5a9a28,#3a7a18)',color:'#fff',fontSize:12,fontWeight:600,fontFamily:"'Jost',sans-serif",cursor:'pointer'}}>
              Pro Premium — 50 €/an
            </button>
          </div>
        </div>
      )}

      <div className="pp-tab-panel">
        <div className="pp-tab-body">
          {activeTab === 'ateliers' && (
            !isAnimator ? (
              <div className="pp-empty">
                <div className="pp-empty-icon">🌿</div>
                <div className="pp-empty-title">Devenez animateur</div>
                <div className="pp-empty-text">
                  La création d'ateliers est réservée aux praticiens validés par l'équipe Mon Jardin.
                  {applyStatus === 'approved'
                    ? <><br/><br/><strong style={{color:'#5a9a28'}}>✅ Candidature approuvée !</strong> Rechargez pour accéder à vos ateliers.</>
                    : applyStatus === 'rejected'
                    ? <><br/><br/><strong style={{color:'#c04040'}}>Candidature non retenue.</strong> Contactez l'équipe Mon Jardin pour plus d'informations.</>
                    : hasApplied
                    ? <><br/><br/><strong style={{color:'#888'}}>📩 Candidature en cours d'examen.</strong> Nous reviendrons vers vous prochainement.</>
                    : <><br/><br/>Envoyez votre candidature pour faire valider votre profil.</>
                  }
                </div>
                <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:20,flexWrap:'wrap'}}>
                  {!hasApplied && (
                    <button className="pp-empty-btn" onClick={() => setShowApplyModal(true)}>
                      Soumettre ma candidature
                    </button>
                  )}
                  {hasApplied && (
                    <button onClick={refreshData} disabled={refreshing}
                      style={{display:'inline-flex',alignItems:'center',gap:6,padding:'10px 22px',borderRadius:8,border:'1px solid #ddd',background:'#fafafa',color:'#555',fontSize:13,fontFamily:"'Jost',sans-serif",cursor:'pointer'}}>
                      <span style={{display:'inline-block',animation:refreshing?'ppSpin 1s linear infinite':'none'}}>↻</span>
                      {refreshing ? 'Vérification…' : 'Vérifier le statut'}
                    </button>
                  )}
                </div>
              </div>
            ) :
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {atelierAtLimit ? (
                <div style={{padding:'12px 16px',borderRadius:12,border:'1px solid rgba(200,150,0,.30)',background:'rgba(200,150,0,.06)',color:'#7a5c00',fontSize:13,fontFamily:"'Jost',sans-serif",display:'flex',alignItems:'center',gap:8}}>
                  🔒 Plan Free — 1 atelier par mois. Passez en Pro Premium pour créer sans limite.
                </div>
              ) : (
                <button
                  onClick={() => { setEditAtelierModal(null); setShowAtelierModal(true) }}
                  style={{padding:'12px',borderRadius:12,border:'1px solid rgba(90,154,40,0.35)',background:'rgba(90,154,40,0.08)',color:'#3d7a12',fontSize:13,fontFamily:"'Jost',sans-serif",cursor:'pointer',fontWeight:600}}>
                  + Créer un atelier
                </button>
              )}
              {ateliers.length === 0 ? (
                <div className="pp-empty">
                  <div className="pp-empty-icon">🌱</div>
                  <div className="pp-empty-title">Aucun atelier pour le moment</div>
                  <div className="pp-empty-text">Créez votre premier atelier bien-être pour votre communauté.</div>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {ateliers.map(a => {
                    const date = a.starts_at ? new Date(a.starts_at) : null
                    const count = a.atelier_registrations?.[0]?.count ?? 0
                    const isPast = date && date < new Date()
                    return (
                      <div key={a.id} style={{border:'1px solid #e0ddd6',borderRadius:12,padding:'12px 16px',background:'#fafaf8'}}>
                        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:8}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:14,fontWeight:600,color:'#111',marginBottom:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.title}</div>
                            <div style={{fontSize:11,color:'#888',display:'flex',gap:10,flexWrap:'wrap'}}>
                              {date && <span>{date.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})} · {date.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>}
                              {a.format && <span style={{textTransform:'capitalize'}}>{a.format === 'online' ? '🌐 En ligne' : '📍 Présentiel'}</span>}
                              {a.price > 0 && <span>{Number(a.price).toFixed(2)} €</span>}
                              <span>{count} inscrit{count>1?'s':''}</span>
                            </div>
                          </div>
                          <span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,flexShrink:0,
                            background: a.is_published ? 'rgba(90,154,40,.10)' : 'rgba(0,0,0,.06)',
                            color: a.is_published ? '#5a9a28' : '#888'}}>
                            {a.is_published ? '✓ Publié' : 'Brouillon'}
                          </span>
                        </div>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          <button onClick={() => { setEditAtelierModal(a); setShowAtelierModal(true) }}
                            style={{padding:'4px 12px',borderRadius:7,fontSize:11,cursor:'pointer',fontFamily:"'Jost',sans-serif",background:'rgba(74,123,165,0.08)',border:'1px solid rgba(74,123,165,0.25)',color:'#4a7ba5'}}>
                            ✏ Modifier
                          </button>
                          {isPast && (
                            <button onClick={() => handleRepublishAtelier(a)}
                              style={{padding:'4px 12px',borderRadius:7,fontSize:11,cursor:'pointer',fontFamily:"'Jost',sans-serif",background:'rgba(90,154,40,0.08)',border:'1px solid rgba(90,154,40,0.25)',color:'#3d7a12'}}>
                              🔄 Republier
                            </button>
                          )}
                          <button onClick={() => handleDeleteAtelier(a.id, a.title)}
                            style={{padding:'4px 12px',borderRadius:7,fontSize:11,cursor:'pointer',fontFamily:"'Jost',sans-serif",background:'rgba(180,60,60,0.07)',border:'1px solid rgba(180,60,60,0.22)',color:'rgba(180,60,60,0.80)'}}>
                            ✕ Supprimer
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          {activeTab === 'outils' && (
            partenaireData ? (
              <VueEspace
                partenaire={partenaireData}
                onProductAdded={refreshData}
                isProPremium={isProPremium}
              />
            ) : (
              <div className="pp-empty">
                <div className="pp-empty-icon">🌿</div>
                <div className="pp-empty-title">Activez votre espace boutique</div>
                <div className="pp-empty-text">
                  Proposez vos ressources numériques (méditations, formations, guides…) directement dans la Jardinothèque.
                </div>
                <button className="pp-empty-btn" onClick={handleCreatePartenaire}>
                  Activer mon espace boutique
                </button>
              </div>
            )
          )}
          {activeTab === 'ventes' && (() => {
            const TVA = 20
            const COMM_RATE = 0.15

            const allVentes = ventesProduits.map(v => {
                const isAtelier = !!v.atelier_id
                const ttc  = Number(v.montant_brut ?? 0)
                const ht   = ttc / (1 + TVA / 100)
                const comm = Number(v.commission ?? ht * COMM_RATE)
                const net  = Number(v.montant_net  ?? ht * (1 - COMM_RATE))
                const date = v.created_at ? new Date(v.created_at) : null
                const label = isAtelier ? (v.ateliers?.title ?? 'Atelier') : (v.produits?.titre ?? 'Produit')
                return { id: v.id, type: isAtelier ? 'atelier' : 'produit', label, date, ttc, tva: TVA, ht, comm, net }
              }).filter(v => v.date).sort((a, b) => b.date - a.date)

            const soldeNet = allVentes.reduce((s, v) => s + v.net, 0)

            if (allVentes.length === 0) return (
              <div className="pp-empty">
                <div className="pp-empty-icon">🧾</div>
                <div className="pp-empty-title">Aucune vente</div>
                <div className="pp-empty-text">Vos ventes d'ateliers et produits numériques apparaîtront ici, regroupées par mois.</div>
              </div>
            )

            const byMonth = {}
            allVentes.forEach(v => {
              const key   = `${v.date.getFullYear()}-${String(v.date.getMonth()+1).padStart(2,'0')}`
              const label = v.date.toLocaleDateString('fr-FR', { month:'long', year:'numeric' })
              if (!byMonth[key]) byMonth[key] = { label, items:[], ttc:0, ht:0, comm:0, net:0 }
              byMonth[key].items.push(v)
              byMonth[key].ttc  += v.ttc
              byMonth[key].ht   += v.ht
              byMonth[key].comm += v.comm
              byMonth[key].net  += v.net
            })

            const COLS = '2fr 1fr 1fr 1fr 1fr 1fr'
            const COL_HEADS = ['Désignation','TTC','TVA','HT','Comm. 15 %','Net pro']

            return (
              <div>
              {/* Solde + bouton Solder */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:24}}>
                <div style={{background:'#f9f7f4',border:'1px solid #e0ddd6',borderRadius:14,padding:'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{flex:1,textAlign:'center'}}>
                    <div style={{fontSize:9.5,letterSpacing:'.12em',textTransform:'uppercase',color:'#aaa',marginBottom:8,fontWeight:600}}>Solde disponible</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:48,fontWeight:600,color:'#111',lineHeight:1}}>
                      {soldeNet.toFixed(2)} <span style={{fontSize:24}}>€</span>
                    </div>
                  </div>
                  <button
                    disabled={soldeNet <= 0}
                    onClick={() => alert('Demande de virement envoyée à Wize. Notre équipe traitera le paiement sous 3–5 jours ouvrés.')}
                    style={{
                      alignSelf:'stretch',margin:'10px 10px 10px 0',padding:'0 24px',
                      borderRadius:10,border:'none',
                      background: soldeNet > 0 ? 'linear-gradient(160deg,#1c1c1c,#333)' : 'rgba(0,0,0,.08)',
                      color: soldeNet > 0 ? '#fff' : '#bbb',
                      fontSize:14,fontWeight:700,fontFamily:"'Jost',sans-serif",
                      cursor: soldeNet > 0 ? 'pointer' : 'not-allowed',
                      letterSpacing:'.05em',whiteSpace:'nowrap',
                    }}
                  >Solder</button>
                </div>
                {/* Paiement Wize — désactivé temporairement */}
              </div>

              {/* Accordéon par mois */}
              <div style={{border:'1px solid #ece9e2',borderRadius:14,overflow:'hidden'}}>
                {Object.entries(byMonth).sort((a,b) => b[0].localeCompare(a[0])).map(([key, month], mi, arr) => (
                  <div key={key} style={{borderBottom: mi < arr.length-1 ? '1px solid #ece9e2' : 'none'}}>
                    {/* Accordéon header */}
                    <div
                      onClick={() => setOpenMonths(prev => ({...prev, [key]: !prev[key]}))}
                      style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',cursor:'pointer',
                        background: openMonths[key] ? '#f4f1ec' : '#fafaf8',userSelect:'none',transition:'background .15s'}}
                    >
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontSize:13.5,fontWeight:600,color:'#222',textTransform:'capitalize'}}>{month.label}</span>
                        <span style={{fontSize:11,color:'#bbb'}}>({month.items.length} vente{month.items.length>1?'s':''})</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:20}}>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:9,letterSpacing:'.10em',textTransform:'uppercase',color:'#bbb',marginBottom:2}}>Comm. MJ</div>
                          <div style={{fontSize:12,fontWeight:600,color:'#e07040'}}>−{month.comm.toFixed(2)} €</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:9,letterSpacing:'.10em',textTransform:'uppercase',color:'#bbb',marginBottom:2}}>Net pro</div>
                          <div style={{fontSize:14,fontWeight:700,color:'#5a9a28'}}>{month.net.toFixed(2)} €</div>
                        </div>
                        <span style={{fontSize:11,color:'#bbb',display:'inline-block',
                          transform: openMonths[key] ? 'rotate(180deg)' : 'none',transition:'transform .2s'}}>▾</span>
                      </div>
                    </div>

                    {openMonths[key] && (
                      <div>
                        {/* En-têtes colonnes */}
                        <div style={{display:'grid',gridTemplateColumns:COLS,padding:'8px 20px',
                          background:'#f9f7f4',borderTop:'1px solid #ece9e2',borderBottom:'1px solid #ece9e2',gap:10}}>
                          {COL_HEADS.map(h => (
                            <span key={h} style={{fontSize:9.5,letterSpacing:'.09em',textTransform:'uppercase',color:'#bbb',fontWeight:600}}>{h}</span>
                          ))}
                        </div>

                        {/* Lignes */}
                        {month.items.map(v => (
                          <div key={v.id} style={{display:'grid',gridTemplateColumns:COLS,padding:'11px 20px',
                            borderBottom:'1px solid #f5f2ee',gap:10,alignItems:'center',background:'#fff'}}>
                            <div style={{minWidth:0}}>
                              <div style={{fontSize:10.5,color:'#bbb',marginBottom:2}}>
                                {v.type === 'atelier' ? '🌿 Atelier' : '🛍️ Produit numérique'}
                              </div>
                              <div style={{fontSize:13,fontWeight:500,color:'#111',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{v.label}</div>
                              <div style={{fontSize:11,color:'#ccc',marginTop:1}}>
                                {v.date.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
                              </div>
                            </div>
                            <span style={{fontSize:13,color:'#333'}}>{v.ttc.toFixed(2)} €</span>
                            <span style={{fontSize:12,color:'#888'}}>{v.tva} %</span>
                            <span style={{fontSize:13,color:'#555'}}>{v.ht.toFixed(2)} €</span>
                            <span style={{fontSize:12,fontWeight:600,color:'#e07040'}}>−{v.comm.toFixed(2)} €</span>
                            <span style={{fontSize:13,fontWeight:700,color:'#5a9a28'}}>{v.net.toFixed(2)} €</span>
                          </div>
                        ))}

                        {/* Total du mois */}
                        <div style={{display:'grid',gridTemplateColumns:COLS,padding:'10px 20px',
                          background:'#f9f7f4',borderTop:'1px solid #ece9e2',gap:10,alignItems:'center'}}>
                          <span style={{fontSize:10,fontWeight:700,color:'#999',letterSpacing:'.08em',textTransform:'uppercase'}}>
                            Total {month.label}
                          </span>
                          <span style={{fontSize:13,fontWeight:600,color:'#333'}}>{month.ttc.toFixed(2)} €</span>
                          <span/>
                          <span style={{fontSize:13,fontWeight:600,color:'#333'}}>{month.ht.toFixed(2)} €</span>
                          <span style={{fontSize:12,fontWeight:700,color:'#e07040'}}>−{month.comm.toFixed(2)} €</span>
                          <span style={{fontSize:13,fontWeight:700,color:'#5a9a28'}}>{month.net.toFixed(2)} €</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              </div>
            )
          })()}
          {activeTab === 'commissions' && (
            <div>
              {/* Bouton actualiser */}
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
                <button onClick={refreshData} disabled={refreshing} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, border:'1px solid #e0ddd6', background:'#fafaf8', color:'#666', fontSize:12, fontFamily:"'Jost',sans-serif", cursor:'pointer' }}>
                  <span style={{ display:'inline-block', animation: refreshing ? 'ppSpin 1s linear infinite' : 'none' }}>↻</span>
                  {refreshing ? 'Actualisation…' : 'Actualiser'}
                </button>
              </div>

              {/* Solde + code promo */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
                <div style={{ background:'#f9f7f4', border:'1px solid #e0ddd6', borderRadius:14, padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ flex:1, textAlign:'center' }}>
                    <div style={{ fontSize:9.5, letterSpacing:'.12em', textTransform:'uppercase', color:'#aaa', marginBottom:8, fontWeight:600 }}>Solde disponible</div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:48, fontWeight:600, color:'#111', lineHeight:1 }}>
                      {((proData?.commission_balance_cents ?? 0) / 100).toFixed(2)} <span style={{ fontSize:24 }}>€</span>
                    </div>
                  </div>
                  <button
                    disabled={(proData?.commission_balance_cents ?? 0) === 0}
                    onClick={() => alert('La demande de solde sera traitée par notre équipe. Fonctionnalité bientôt disponible.')}
                    style={{
                      alignSelf:'stretch', margin:'10px 10px 10px 0', padding:'0 24px',
                      borderRadius:10, border:'none',
                      background: (proData?.commission_balance_cents ?? 0) > 0 ? 'linear-gradient(160deg,#1c1c1c,#333)' : 'rgba(0,0,0,.08)',
                      color: (proData?.commission_balance_cents ?? 0) > 0 ? '#fff' : '#bbb',
                      fontSize:14, fontWeight:700, fontFamily:"'Jost',sans-serif",
                      cursor: (proData?.commission_balance_cents ?? 0) > 0 ? 'pointer' : 'not-allowed',
                      letterSpacing:'.05em', whiteSpace:'nowrap',
                    }}
                  >Solder</button>
                </div>
                {/* Paiement Wize — désactivé temporairement */}
              </div>

              {/* 2 colonnes : clients affiliés + historique CA */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

                {/* Colonne gauche — Clients affiliés */}
                <div style={{ border:'1px solid #ece9e2', borderRadius:14, overflow:'hidden' }}>
                  <div style={{ padding:'12px 16px', background:'#fafaf8', borderBottom:'1px solid #ece9e2' }}>
                    <span style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'#aaa', fontWeight:600 }}>Clients affiliés ({referrals.length})</span>
                  </div>
                  <div style={{ padding:'0 16px' }}>
                    {referrals.length === 0 ? (
                      <div style={{ fontSize:13, color:'#bbb', fontStyle:'italic', padding:'16px 0' }}>
                        Aucun client — partagez votre code <strong style={{ color:'#888' }}>{proData?.pro_id}</strong>
                      </div>
                    ) : referrals.map(ref => (
                      <div key={ref.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f5f2ee' }}>
                        <div>
                          <div style={{ fontSize:13, color:'#111', fontWeight:500 }}>
                            {(ref.users ?? ref['users!client_user_id'])?.display_name ?? 'Anonyme'}
                          </div>
                          {(ref.users ?? ref['users!client_user_id'])?.email && (
                            <div style={{ fontSize:11, color:'#555', marginTop:1 }}>
                              {(ref.users ?? ref['users!client_user_id']).email}
                            </div>
                          )}
                          <div style={{ fontSize:11, color:'#999', marginTop:2 }}>
                            Depuis le {new Date(ref.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <div style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, flexShrink:0,
                          background: ref.status === 'active' ? 'rgba(90,154,40,.10)' : 'rgba(0,0,0,.05)',
                          color: ref.status === 'active' ? '#5a9a28' : '#aaa',
                        }}>
                          {ref.status === 'active' ? '✓ Actif' : '✕ Résilié'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Colonne droite — Historique CA accordéon par mois */}
                <div style={{ border:'1px solid #ece9e2', borderRadius:14, overflow:'hidden' }}>
                  <div style={{ padding:'12px 16px', background:'#fafaf8', borderBottom:'1px solid #ece9e2' }}>
                    <span style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'#aaa', fontWeight:600 }}>Historique CA ({commissions.length})</span>
                  </div>
                  <div>
                    {commissions.length === 0 ? (
                      <div style={{ fontSize:13, color:'#bbb', fontStyle:'italic', padding:'16px' }}>
                        Les commissions apparaîtront ici à chaque renouvellement.
                      </div>
                    ) : (() => {
                      const byMonth = commissions.reduce((acc, c) => {
                        const d = new Date(c.created_at)
                        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
                        const label = d.toLocaleDateString('fr-FR', { month:'long', year:'numeric' })
                        if (!acc[key]) acc[key] = { label, total:0, items:[] }
                        acc[key].total += c.amount_cents
                        acc[key].items.push(c)
                        return acc
                      }, {})
                      return Object.entries(byMonth).sort((a,b) => b[0].localeCompare(a[0])).map(([key, month]) => (
                        <div key={key} style={{ borderBottom:'1px solid #f5f2ee' }}>
                          <div onClick={() => setOpenMonths(prev => ({ ...prev, [key]: !prev[key] }))}
                            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 16px', cursor:'pointer', background: openMonths[key] ? '#f5f2ee' : '#fff', userSelect:'none' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ fontSize:12.5, fontWeight:600, color:'#333', textTransform:'capitalize' }}>{month.label}</span>
                              <span style={{ fontSize:10.5, color:'#bbb' }}>({month.items.length})</span>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ fontSize:13, fontWeight:700, color:'#5a9a28' }}>+{(month.total/100).toFixed(2)} €</span>
                              <span style={{ fontSize:11, color:'#bbb', display:'inline-block', transform: openMonths[key] ? 'rotate(180deg)' : 'none' }}>▾</span>
                            </div>
                          </div>
                          {openMonths[key] && (
                            <div style={{ background:'#fafaf8', padding:'0 16px 6px' }}>
                              {month.items.map(c => (
                                <div key={c.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f0ede8' }}>
                                  <span style={{ fontSize:12, color:'#888' }}>{new Date(c.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long' })}</span>
                                  <span style={{ fontSize:12, fontWeight:600, color:'#5a9a28' }}>+{(c.amount_cents/100).toFixed(2)} €</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    })()}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal modification */}
      {showEdit && (
        <div className="pp-modal-overlay" onClick={e => e.target===e.currentTarget && setShowEdit(false)}>
          <div className="pp-modal">
            <button className="pp-modal-close" onClick={() => setShowEdit(false)}>✕</button>
            <div className="pp-modal-title">Modifier mes informations</div>
            <div className="pp-modal-sub">Visibles sur votre espace partenaire.</div>
            <form onSubmit={handleSave}>
              <div className="pp-row">
                <div className="pp-field"><label className="pp-label">Nom</label><input className="pp-input" value={editForm.nom} onChange={upd('nom')} required maxLength={80}/></div>
                <div className="pp-field"><label className="pp-label">Prénom</label><input className="pp-input" value={editForm.prenom} onChange={upd('prenom')} required maxLength={80}/></div>
              </div>
              <div className="pp-field"><label className="pp-label">Entreprise</label><input className="pp-input" value={editForm.entreprise} onChange={upd('entreprise')} maxLength={120}/></div>
              <div className="pp-field"><label className="pp-label">Nature de l'activité <span style={{color:'#666',fontWeight:400}}>(ex: hypnothérapeute, coach, naturopathe…)</span></label><input className="pp-input" value={editForm.activite} onChange={upd('activite')} placeholder="Décrivez votre activité de mieux-être" maxLength={160}/></div>
              <div className="pp-field"><label className="pp-label">Adresse</label><input className="pp-input" value={editForm.adresse} onChange={upd('adresse')} maxLength={200}/></div>
              <div className="pp-row">
                <div className="pp-field"><label className="pp-label">Code postal</label><input className="pp-input" value={editForm.cp} onChange={upd('cp')} maxLength={10}/></div>
                <div className="pp-field"><label className="pp-label">Ville</label><input className="pp-input" value={editForm.ville} onChange={upd('ville')} maxLength={80}/></div>
              </div>
              <div className="pp-field"><label className="pp-label">Téléphone</label><input className="pp-input" value={editForm.telephone} onChange={upd('telephone')} required maxLength={20}/></div>
              <div className="pp-field"><label className="pp-label">SIRET</label><input className="pp-input" value={editForm.siret} onChange={upd('siret')} required maxLength={18}/></div>

              <div style={{ margin:'16px 0 10px', fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'#aaa', fontWeight:600 }}>Présence en ligne <span style={{ textTransform:'none', letterSpacing:0, fontWeight:400, color:'#bbb' }}>(optionnel)</span></div>
              <div className="pp-field"><label className="pp-label">🌐 Site internet</label><input className="pp-input" value={editForm.site_web} onChange={upd('site_web')} placeholder="https://monsite.fr" maxLength={200}/></div>
              <div className="pp-field"><label className="pp-label">📘 Facebook</label><input className="pp-input" value={editForm.facebook} onChange={upd('facebook')} placeholder="https://facebook.com/mapages" maxLength={200}/></div>
              <div className="pp-field"><label className="pp-label">📸 Instagram</label><input className="pp-input" value={editForm.instagram} onChange={upd('instagram')} placeholder="https://instagram.com/moncompte" maxLength={200}/></div>
              <div className="pp-field"><label className="pp-label">💼 LinkedIn</label><input className="pp-input" value={editForm.linkedin} onChange={upd('linkedin')} placeholder="https://linkedin.com/in/monprofil" maxLength={200}/></div>

              {saveError && <div className="pp-error">{saveError}</div>}
              <button className="pp-save-btn" type="submit" disabled={saving}>{saving ? '…' : '✓ Enregistrer'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal candidature animateur */}
      {showApplyModal && (
        <div className="pp-modal-overlay" onClick={e => e.target===e.currentTarget && setShowApplyModal(false)}>
          <div className="pp-modal">
            <button className="pp-modal-close" onClick={() => setShowApplyModal(false)}>✕</button>
            <div className="pp-modal-title">Devenir animateur</div>
            <div className="pp-modal-sub">Votre candidature sera examinée par l'équipe Mon Jardin.</div>
            <ApplyCandidatureForm onClose={() => setShowApplyModal(false)} onSubmit={handleApply} />
          </div>
        </div>
      )}

      {/* Modal création / édition atelier */}
      {showAtelierModal && (
        <AtelierFormModal
          initialData={editAtelierModal?._isRepublish ? { ...editAtelierModal, id: null } : editAtelierModal}
          onClose={() => { setShowAtelierModal(false); setEditAtelierModal(null) }}
          onCreate={handleCreateAtelier}
          onEdit={handleEditAtelier}
        />
      )}

      {showAffiche && <AfficheModal onClose={() => setShowAffiche(false)} />}
      {showMessaging && <MessagingModal proId={proData?.id} onClose={() => setShowMessaging(false)} />}
    </div>
  )
}
