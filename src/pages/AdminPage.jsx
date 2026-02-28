// src/pages/AdminPage.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../core/supabaseClient'


const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; width: 100%; }
:root {
  --bg:      #1a2e1a;
  --bg2:     #213d21;
  --bg3:     #274827;
  --border:  rgba(255,255,255,0.14);
  --border2: rgba(255,255,255,0.08);
  --text:    #f2ede0;
  --text2:   rgba(242,237,224,0.85);
  --text3:   rgba(242,237,224,0.55);
  --green:   #96d485;
  --green2:  rgba(150,212,133,0.22);
  --green3:  rgba(150,212,133,0.11);
  --greenT:  rgba(150,212,133,0.48);
  --gold:    #e8d4a8;
  --rose:    rgba(210,130,130,0.7);
  --amber:   rgba(220,180,100,0.7);
}
body { background: var(--bg); font-family: 'Jost', sans-serif; color: var(--text); }

.admin-root {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
}

/* ── HEADER ── */
.admin-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 32px;
  border-bottom: 1px solid var(--border2);
  background: rgba(0,0,0,0.2);
  flex-shrink: 0;
}
.admin-logo {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px;
  font-weight: 300;
  color: var(--gold);
  letter-spacing: 0.02em;
}
.admin-logo em { font-style: italic; color: var(--green); }
.admin-badge {
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--amber);
  background: rgba(220,180,100,0.12);
  border: 1px solid rgba(220,180,100,0.3);
  border-radius: 100px;
  padding: 3px 10px;
}
.admin-header-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.admin-user { font-size: 12px; color: var(--text3); }
.admin-back {
  font-size: 11px;
  color: var(--text3);
  cursor: pointer;
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 100px;
  transition: all 0.2s;
  letter-spacing: 0.04em;
}
.admin-back:hover { color: var(--text); border-color: var(--border); background: rgba(255,255,255,0.05); }

/* ── BODY ── */
.admin-body {
  flex: 1;
  padding: 32px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}

.admin-section-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 26px;
  font-weight: 300;
  color: var(--text);
  margin-bottom: 6px;
}
.admin-section-title em { font-style: italic; color: var(--green); }
.admin-section-sub {
  font-size: 12px;
  color: var(--text3);
  margin-bottom: 28px;
  letter-spacing: 0.03em;
}

/* ── STATS BAR ── */
.admin-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
}
.admin-stat {
  flex: 1;
  padding: 16px 18px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border2);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.admin-stat-val {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px;
  color: var(--text);
  line-height: 1;
}
.admin-stat-label { font-size: 10px; color: var(--text3); letter-spacing: 0.1em; text-transform: uppercase; }

/* ── TABS ── */
.admin-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border2);
  padding-bottom: 0;
}
.admin-tab {
  font-size: 12px;
  letter-spacing: 0.06em;
  padding: 8px 18px 10px;
  cursor: pointer;
  color: var(--text3);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  margin-bottom: -1px;
}
.admin-tab:hover { color: var(--text2); }
.admin-tab.active { color: var(--green); border-bottom-color: var(--green); }
.admin-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 16px;
  background: var(--green2);
  border-radius: 100px;
  font-size: 9px;
  color: var(--green);
  margin-left: 6px;
  padding: 0 4px;
}

/* ── CARDS ── */
.admin-cards { display: flex; flex-direction: column; gap: 14px; }

.admin-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border2);
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.admin-card:hover { border-color: var(--border); }
.admin-card.editing { border-color: var(--greenT); }

.admin-card-top {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 20px 14px;
}
.admin-card-emoji {
  font-size: 28px;
  flex-shrink: 0;
  line-height: 1;
  margin-top: 2px;
}
.admin-card-info { flex: 1; min-width: 0; }
.admin-card-title {
  font-size: 15px;
  font-weight: 400;
  color: var(--text);
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.admin-card-desc {
  font-size: 12px;
  color: var(--text3);
  line-height: 1.6;
  margin-bottom: 8px;
}
.admin-card-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.admin-card-tag {
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--text3);
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border2);
  border-radius: 100px;
  padding: 2px 10px;
}
.admin-card-date {
  font-size: 10px;
  color: var(--text3);
  margin-left: auto;
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 3px;
}

/* ── EDIT FORM ── */
.admin-edit-form {
  padding: 0 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid var(--border2);
  padding-top: 14px;
}
.admin-edit-row { display: flex; gap: 10px; }
.admin-edit-group { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.admin-edit-label { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text3); }
.admin-edit-input {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text);
  font-family: 'Jost', sans-serif;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
}
.admin-edit-input:focus { border-color: var(--greenT); }
.admin-edit-textarea {
  resize: none;
  height: 72px;
}
.admin-edit-select {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text);
  font-family: 'Jost', sans-serif;
  outline: none;
  width: 100%;
  cursor: pointer;
}
.admin-edit-select option { background: #213d21; }

/* ── ACTIONS ── */
.admin-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--border2);
  background: rgba(0,0,0,0.1);
}
.admin-featured-toggle {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  color: var(--text3);
  cursor: pointer;
  user-select: none;
  margin-right: auto;
}
.admin-featured-toggle input { accent-color: var(--amber); cursor: pointer; }
.admin-featured-toggle.on { color: var(--amber); }

.btn {
  font-size: 11px;
  letter-spacing: 0.06em;
  padding: 7px 16px;
  border-radius: 100px;
  border: 1px solid transparent;
  cursor: pointer;
  font-family: 'Jost', sans-serif;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-edit { background: rgba(255,255,255,0.07); border-color: var(--border); color: var(--text2); }
.btn-edit:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
.btn-validate { background: var(--green2); border-color: var(--greenT); color: #c8f0b8; }
.btn-validate:hover:not(:disabled) { background: rgba(150,212,133,0.35); }
.btn-reject { background: rgba(210,130,130,0.1); border-color: rgba(210,130,130,0.3); color: var(--rose); }
.btn-reject:hover:not(:disabled) { background: rgba(210,130,130,0.2); }
.btn-save { background: var(--green2); border-color: var(--greenT); color: #c8f0b8; }
.btn-save:hover:not(:disabled) { background: rgba(150,212,133,0.35); }
.btn-cancel { background: transparent; border-color: var(--border); color: var(--text3); }
.btn-cancel:hover:not(:disabled) { color: var(--text2); }

/* ── EMPTY ── */

.admin-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  background: rgba(220,180,100,0.9); /* doré plus visible */
  border-radius: 100px;
  font-size: 10px;
  font-weight: 600;
  color: #1a2e1a; /* texte foncé */
  margin-left: 8px;
  padding: 0 6px;
}

@keyframes pop {
  0%   { transform: scale(0.8); opacity: 0.5; }
  100% { transform: scale(1);   opacity: 1; }
}

.admin-empty {
  text-align: center;
  padding: 48px 0;
  color: var(--text3);
  font-size: 13px;
  letter-spacing: 0.04em;
}
.admin-empty-icon { font-size: 32px; margin-bottom: 12px; }

/* ── ACCESS DENIED ── */
.admin-denied {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--text3);
}
.admin-denied-icon { font-size: 40px; }
.admin-denied-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; color: var(--text2); }
.admin-denied-sub { font-size: 12px; letter-spacing: 0.04em; }

/* ── TOAST ── */
.admin-toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg3);
  border: 1px solid var(--greenT);
  border-radius: 100px;
  padding: 10px 22px;
  font-size: 12px;
  color: #c8f0b8;
  letter-spacing: 0.04em;
  z-index: 999;
  pointer-events: none;
  animation: fadeInUp 0.3s ease;
}
.admin-toast.error { border-color: rgba(210,130,130,0.5); color: var(--rose); }
@keyframes fadeInUp {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--greenT); border-radius: 100px; }
`

const ZONES = ['Souffle', 'Racines', 'Feuilles', 'Tige', 'Fleurs', 'Toutes']

// ── Edit Form inline ────────────────────────────────────
function EditForm({ defi, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    title: defi.title,
    description: defi.description || '',
    zone: defi.zone,
    duration_days: defi.duration_days,
    emoji: defi.emoji || '🌿',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="admin-edit-form">
      <div className="admin-edit-row">
        <div className="admin-edit-group" style={{ maxWidth: 70 }}>
          <div className="admin-edit-label">Emoji</div>
          <input className="admin-edit-input" value={form.emoji} onChange={e => set('emoji', e.target.value)} style={{ textAlign: 'center', fontSize: 18 }} />
        </div>
        <div className="admin-edit-group">
          <div className="admin-edit-label">Titre</div>
          <input className="admin-edit-input" value={form.title} onChange={e => set('title', e.target.value)} />
        </div>
      </div>
      <div className="admin-edit-group">
        <div className="admin-edit-label">Description</div>
        <textarea className="admin-edit-input admin-edit-textarea" value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="admin-edit-row">
        <div className="admin-edit-group">
          <div className="admin-edit-label">Zone</div>
          <select className="admin-edit-select" value={form.zone} onChange={e => set('zone', e.target.value)}>
            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div className="admin-edit-group">
          <div className="admin-edit-label">Durée (jours)</div>
          <input className="admin-edit-input" type="number" min={1} max={365} value={form.duration_days} onChange={e => set('duration_days', Number(e.target.value))} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button className="btn btn-cancel" onClick={onCancel}>Annuler</button>
        <button className="btn btn-save" onClick={() => onSave(form)} disabled={saving || !form.title.trim()}>
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}

// ── Defi Card ───────────────────────────────────────────
function DefiCard({ defi, onValidate, onReject, onSave, isActive, onToggleFeatured }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = async (form) => {
    setLoading(true)
    await onSave(defi.id, { ...form, is_featured: defi.is_featured })
    setEditing(false)
    setLoading(false)
  }

  const handleValidate = async () => {
    setLoading(true)
await onValidate(defi.id, defi.is_featured) 
   setLoading(false)
  }

  const handleReject = async () => {
    if (!confirm(`Supprimer le défi "${defi.title}" ?`)) return
    setLoading(true)
    await onReject(defi.id)
    setLoading(false)
  }

  const date = new Date(defi.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className={`admin-card${editing ? ' editing' : ''}`}>
      <div className="admin-card-top">
        <div className="admin-card-emoji">{defi.emoji || '🌿'}</div>
        <div className="admin-card-info">
          <div className="admin-card-title">
            {defi.title}
            {defi.is_featured && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(220,180,100,0.15)', border: '1px solid rgba(220,180,100,0.3)', color: 'var(--amber)', letterSpacing: '0.06em' }}>★ Featured</span>}
          </div>
          <div className="admin-card-desc">{defi.description || <em style={{ opacity: 0.4 }}>Pas de description</em>}</div>
          <div className="admin-card-meta">
            <span className="admin-card-tag">📍 {defi.zone}</span>
            <span className="admin-card-tag">📅 {defi.duration_days} jours</span>
            {isActive && <span className="admin-card-tag">👥 {defi.participantCount ?? 0} participants</span>}
          </div>
        </div>
        <div className="admin-card-date">{date}</div>
      </div>

      {editing && (
        <EditForm
          defi={defi}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          saving={loading}
        />
      )}

      {!editing && (
        <div className="admin-card-actions">
          <label className={`admin-featured-toggle${defi.is_featured ? ' on' : ''}`}>
            <input
  type="checkbox"
  checked={defi.is_featured}
  onChange={() => onToggleFeatured(defi)}
/>
            ★ Mettre en featured
          </label>
          <button className="btn btn-edit" onClick={() => setEditing(true)} disabled={loading}>Modifier</button>
          {!isActive && (
            <button className="btn btn-validate" onClick={handleValidate} disabled={loading}>
              {loading ? '…' : '✓ Valider'}
            </button>
          )}
          <button className="btn btn-reject" onClick={handleReject} disabled={loading}>
            {loading ? '…' : isActive ? 'Désactiver' : 'Rejeter'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main AdminPage ──────────────────────────────────────
export default function AdminPage() {
  const [user, setUser]             = useState(null)
  const [isAdmin, setIsAdmin]       = useState(null) // null = loading
  const [pending, setPending]       = useState([])
  const [active, setActive]         = useState([])
  const [tab, setTab]               = useState('pending')
  const [loading, setLoading]       = useState(true)
  const [toast, setToast]           = useState(null)

  // ── Auth check ──────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { setIsAdmin(false); setLoading(false); return }
      setUser(session.user)
      checkAdmin(session.user.id)
    })
  }, [])
useEffect(() => {
  if (isAdmin !== true) return

  const channel = supabase
    .channel('admin-defis')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'defis',
        filter: 'is_active=eq.false',
      },
      () => {
        loadDefis()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [isAdmin])
useEffect(() => {
  if (isAdmin !== true) return
  if (tab !== 'pending') return
  if (!pending.length) return

  const markAsSeen = async () => {
    await supabase
      .from('defis')
      .update({ is_seen_by_admin: true })
      .eq('is_active', false)
      .eq('is_seen_by_admin', false)
  }

  markAsSeen()
}, [tab, pending.length, isAdmin])

  async function checkAdmin(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('checkAdmin error:', error)
    setIsAdmin(false)
    setLoading(false)
    return
  }

  setIsAdmin(data?.role === 'admin')
  setLoading(false)
}

  useEffect(() => {
    if (isAdmin) loadDefis()
  }, [isAdmin])

  async function loadDefis() {
    setLoading(true)
    const [{ data: pend }, { data: act }] = await Promise.all([
      supabase.from('defis').select('*, defi_participants(count)').eq('is_active', false).order('created_at', { ascending: false }),
      supabase.from('defis').select('*, defi_participants(count)').eq('is_active', true).order('created_at', { ascending: false }),
    ])
    setPending((pend ?? []).map(d => ({ ...d, participantCount: d.defi_participants?.[0]?.count ?? 0 })))
    setActive((act ?? []).map(d => ({ ...d, participantCount: d.defi_participants?.[0]?.count ?? 0 })))
    setLoading(false)
  }

  function showToast(msg, type = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Actions ─────────────────────────────────────────
  async function handleValidate(id, isFeatured) {
    const { error } = await supabase
      .from('defis')
      .update({ is_active: true, is_featured: isFeatured })
      .eq('id', id)
    if (error) { showToast('Erreur : ' + error.message, 'error'); return }
    showToast('Défi validé ✓')
    await loadDefis()
  }

  async function handleReject(id) {
    const { error } = await supabase.from('defis').delete().eq('id', id)
    if (error) { showToast('Erreur : ' + error.message, 'error'); return }
    showToast('Défi supprimé')
    await loadDefis()
  }

  async function handleSave(id, form) {
    const { error } = await supabase
      .from('defis')
      .update({
        title: form.title,
        description: form.description,
        zone: form.zone,
        duration_days: form.duration_days,
        emoji: form.emoji,
        is_featured: form.is_featured,
      })
      .eq('id', id)
    if (error) { showToast('Erreur : ' + error.message, 'error'); return }
    showToast('Modifications sauvegardées ✓')
    await loadDefis()
  }

  async function handleDeactivate(id) {
    const { error } = await supabase.from('defis').update({ is_active: false }).eq('id', id)
    if (error) { showToast('Erreur : ' + error.message, 'error'); return }
    showToast('Défi désactivé')
    await loadDefis()
  }
async function handleToggleFeatured(defi) {
  // Si on active un nouveau featured
  if (!defi.is_featured) {
    await supabase
      .from('defis')
      .update({ is_featured: false })
      .eq('is_featured', true)
  }

  const { error } = await supabase
    .from('defis')
    .update({ is_featured: !defi.is_featured })
    .eq('id', defi.id)

  if (error) {
    showToast('Erreur : ' + error.message, 'error')
    return
  }

  await loadDefis()
}
  // ── Render ───────────────────────────────────────────
  const displayed = tab === 'pending' ? pending : active
const unseenCount = pending.filter(d => !d.is_seen_by_admin).length
  return (
    <div className="admin-root">
      <style>{css}</style>

      <div className="admin-header">
        <div className="admin-logo">Mon <em>Jardin</em> Intérieur</div>
        <div className="admin-badge">Administration</div>
        <div className="admin-header-right">
          {user && <div className="admin-user">{user.email}</div>}
          <div className="admin-back" onClick={() => window.location.href = '/'}>← Retour</div>
        </div>
      </div>

      {isAdmin === null || (loading && isAdmin === null) ? (
        <div className="admin-denied">
          <div className="admin-denied-icon">⏳</div>
          <div className="admin-denied-title">Chargement…</div>
        </div>
      ) : !isAdmin ? (
        <div className="admin-denied">
          <div className="admin-denied-icon">🔒</div>
          <div className="admin-denied-title">Accès refusé</div>
          <div className="admin-denied-sub">Vous n'avez pas les droits administrateur.</div>
        </div>
      ) : (
        <div className="admin-body">
          <div className="admin-section-title">Gestion des <em>Défis</em></div>
          <div className="admin-section-sub">Valider, modifier ou rejeter les propositions de la communauté</div>

          <div className="admin-stats">
            <div className="admin-stat">
              <div className="admin-stat-val">{pending.length}</div>
              <div className="admin-stat-label">En attente</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-val">{active.length}</div>
              <div className="admin-stat-label">Défis actifs</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-val">{active.filter(d => d.is_featured).length}</div>
              <div className="admin-stat-label">En featured</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-val">{active.reduce((s, d) => s + (d.participantCount ?? 0), 0).toLocaleString()}</div>
              <div className="admin-stat-label">Participations</div>
            </div>
          </div>

          <div className="admin-tabs">
            <div className={`admin-tab${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>
              Propositions
     {unseenCount > 0 && (
  <span className="admin-tab-count">
    {unseenCount}
  </span>
)}
            </div>
            <div className={`admin-tab${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>
              Défis actifs
              {active.length > 0 && <span className="admin-tab-count">{active.length}</span>}
            </div>
          </div>

          {loading ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">⏳</div>
              Chargement…
            </div>
          ) : displayed.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">{tab === 'pending' ? '✨' : '🌿'}</div>
              {tab === 'pending' ? 'Aucune proposition en attente' : 'Aucun défi actif'}
            </div>
          ) : (
            <div className="admin-cards">
              {displayed.map(d => (
               <DefiCard
  key={d.id}
  defi={d}
  isActive={tab === 'active'}
  onValidate={handleValidate}
  onReject={tab === 'active' ? handleDeactivate : handleReject}
  onSave={handleSave}
  onToggleFeatured={handleToggleFeatured}
/>
              ))}
            </div>
          )}
        </div>
      )}

      {toast && <div className={`admin-toast${toast.type === 'error' ? ' error' : ''}`}>{toast.msg}</div>}
    </div>
  )
}
