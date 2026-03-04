// ─────────────────────────────────────────────────────────────────────────────
//  ScreenClubJardiniers.jsx  —  Écran "Club des Jardiniers" (ex Graines de vie)
//  Contient : Toast, getThemeEmoji, EditCircleModal, CreateCircleModal,
//             helpers CSV/PDF, ScreenClubJardiniers
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react"
import { supabase } from '../core/supabaseClient'
import { useCircle } from '../hooks/useCircle'
import { useIsMobile, LumenBadge, Toast, getThemeEmoji, THEMES_LIST, callModerateCircle } from './dashboardShared'

/* ─────────────────────────────────────────
   MODAL MODIFIER UNE GRAINE
───────────────────────────────────────── */
function EditCircleModal({ circle, onClose, onSave }) {
  const [name,        setName]       = useState(circle.name ?? '')
  const [theme,       setTheme]      = useState(circle.theme ?? '')
  const [description, setDescription] = useState(circle.description ?? '')
  const [isOpen,      setIsOpen]     = useState(circle.is_open ?? false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleSubmit() {
    if (!name.trim()) { setError('Le nom est requis.'); return }
    setLoading(true); setError(null)
    try { await onSave(name.trim(), theme.trim() || 'Bien-être général', isOpen, description.trim()) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Modifier la graine ✏️</div>
        <div className="modal-field">
          <label className="modal-label">Nom de la graine</label>
          <input className="modal-input" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="modal-field">
          <label className="modal-label">Thème</label>
          <select value={theme} onChange={e => setTheme(e.target.value)}
            style={{ width:'100%', padding:'9px 13px', background:'#1e2e1e', border:'1px solid var(--border)', borderRadius:10, fontSize:12, color: theme ? 'var(--text2)' : 'var(--text3)', outline:'none', cursor:'pointer', appearance:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center' }}>
            <option value="">— Choisir un thème —</option>
            {THEMES_LIST.map(([emoji, label]) => (
              <option key={label} value={label}>{emoji} {label}</option>
            ))}
          </select>
        </div>
        <div className="modal-field">
          <label className="modal-label">Intention / Description</label>
          <textarea className="modal-input" value={description} onChange={e => setDescription(e.target.value)}
            style={{ resize:'vertical', minHeight:70, lineHeight:1.6 }} />
        </div>
        <div className="modal-row" style={{ flexDirection:'column', alignItems:'flex-start', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
            <span className="modal-toggle-lbl" style={{ fontWeight: isOpen ? 500 : 400, color: isOpen ? 'var(--text)' : 'var(--text3)' }}>
              {isOpen ? '🌍 Graine publique' : '🔒 Sur invitation uniquement'}
            </span>
            <div className={'priv-toggle ' + (isOpen ? 'on' : 'off')} onClick={() => setIsOpen(v => !v)}>
              <div className="pt-knob" />
            </div>
          </div>
          <div style={{ fontSize:10, color:'var(--text3)', lineHeight:1.5 }}>
            {isOpen
              ? "Visible dans Découvrir — n'importe qui peut rejoindre sans code"
              : "Invisible publiquement — accès uniquement via code d'invitation"}
          </div>
        </div>
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Annuler</button>
          <button className="modal-submit" disabled={loading} onClick={handleSubmit}>
            {loading ? '…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MODAL CRÉER UN CERCLE
───────────────────────────────────────── */
function CreateCircleModal({ onClose, onCreate }) {
  const [name,        setName]       = useState('')
  const [theme,       setTheme]      = useState('')
  const [isOpen,      setIsOpen]      = useState(false)
  const [duration,    setDuration]    = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [aiLoading,   setAiLoading]   = useState(false)
  const [aiDesc,      setAiDesc]      = useState('')
  const [error,       setError]       = useState(null)

  async function handleSubmit() {
    if (!name.trim()) { setError('Le nom de la graine est requis.'); return }
    setLoading(true); setError(null)
    try {
      await onCreate(name.trim(), theme.trim() || 'Bien-être général', isOpen, duration, aiDesc)
      onClose()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const durations = [
    { label:'1 jour',    value:1  },
    { label:'1 semaine', value:7  },
    { label:'15 jours',  value:15 },
  ]

  async function generateDescription() {
    if (!name.trim() && !theme) return
    setAiLoading(true)
    try {
      const data = await callModerateCircle({ action: 'generate', name: name.trim(), theme })
      setAiDesc(data.description ?? '')
    } catch(e) { console.error(e) }
    finally { setAiLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Nouvelle Graine 🌱</div>
        <div className="modal-field">
          <label className="modal-label">Nom de la graine</label>
          <input className="modal-input" placeholder="ex. Rituels du Matin" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="modal-field">
          <label className="modal-label">Thème</label>
          <select value={theme} onChange={e => setTheme(e.target.value)}
            style={{ width:'100%', padding:'9px 13px', background:'#1e2e1e', border:'1px solid var(--border)', borderRadius:10, fontSize:12, color: theme ? 'var(--text2)' : 'var(--text3)', outline:'none', cursor:'pointer', appearance:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center' }}>
            <option value="">— Choisir un thème —</option>
            {THEMES_LIST.map(([emoji, label]) => (
              <option key={label} value={label}>{emoji} {label}</option>
            ))}
          </select>
        </div>
        <div className="modal-field">
          <label className="modal-label" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>Description générée par IA</span>
            {(name.trim() || theme) && (
              <div onClick={generateDescription}
                style={{ fontSize:10, padding:'3px 10px', borderRadius:100, border:'1px solid var(--greenT)', color:'#c8f0b8', background:'var(--green3)', cursor: aiLoading ? 'default' : 'pointer', opacity: aiLoading ? .5 : 1 }}>
                {aiLoading ? '✨ Génération…' : '✨ Générer'}
              </div>
            )}
          </label>
          {aiDesc
            ? <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.8, fontStyle:'italic', padding:'10px 13px', background:'rgba(150,212,133,0.05)', borderRadius:10, border:'1px solid rgba(150,212,133,0.15)' }}>
                "{aiDesc}"
                <span onClick={() => setAiDesc('')} style={{ marginLeft:8, fontSize:10, color:'var(--text3)', cursor:'pointer', fontStyle:'normal' }}>✕</span>
              </div>
            : <div style={{ fontSize:11, color:'var(--text3)', fontStyle:'italic', padding:'8px 0' }}>
                {name.trim() || theme ? "Cliquez sur ✨ Générer pour créer une description." : "Renseignez d'abord le nom et le thème."}
              </div>
          }
        </div>
        <div className="modal-field">
          <label className="modal-label">Durée de vie</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
            {durations.map(opt => (
              <div key={String(opt.value)}
                onClick={() => setDuration(opt.value)}
                style={{
                  padding:'6px 14px', borderRadius:100, fontSize:11, cursor:'pointer',
                  border: duration === opt.value ? '1px solid var(--greenT)' : '1px solid var(--border)',
                  background: duration === opt.value ? 'rgba(150,212,133,0.12)' : 'rgba(255,255,255,0.04)',
                  color: duration === opt.value ? '#c8f0b8' : 'var(--text3)',
                  transition:'all .15s'
                }}
              >{opt.label}</div>
            ))}
          </div>
        </div>
        <div className="modal-row" style={{ flexDirection:'column', alignItems:'flex-start', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
            <span className="modal-toggle-lbl" style={{ fontWeight: isOpen ? 500 : 400, color: isOpen ? 'var(--text)' : 'var(--text3)' }}>
              {isOpen ? '🌍 Graine publique' : '🔒 Sur invitation uniquement'}
            </span>
            <div className={'priv-toggle ' + (isOpen ? 'on' : 'off')} onClick={() => setIsOpen(v => !v)}>
              <div className="pt-knob" />
            </div>
          </div>
          <div style={{ fontSize:10, color:'var(--text3)', lineHeight:1.5 }}>
            {isOpen
              ? "Visible dans \"Découvrir\" — n'importe qui peut rejoindre sans code"
              : "Invisible publiquement — accès uniquement via code d'invitation"}
          </div>
        </div>
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Annuler</button>
          <button className="modal-submit" disabled={loading} onClick={handleSubmit}>
            {loading ? '…' : 'Créer la graine'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   EXPORT HELPERS
───────────────────────────────────────── */
function downloadCSV(rows, filename) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
  a.download = filename; a.click(); URL.revokeObjectURL(a.href)
}

function exportPlantCSV(history) {
  downloadCSV((history ?? []).map(p => ({
    Date: p.date,
    'Vitalité (%)': p.health,
    'Racines (%)': p.zone_racines ?? '',
    'Tige (%)': p.zone_tige ?? '',
    'Feuilles (%)': p.zone_feuilles ?? '',
    'Fleurs (%)': p.zone_fleurs ?? '',
    'Souffle (%)': p.zone_souffle ?? '',
  })), `jardin-vitalite-${new Date().toISOString().slice(0,10)}.csv`)
}

function exportJournalCSV(entries) {
  downloadCSV((entries ?? []).map(e => ({
    Date: new Date(e.created_at).toLocaleDateString('fr-FR'),
    Contenu: e.content,
    Zones: (e.zone_tags ?? []).join(' | '),
  })), `jardin-journal-${new Date().toISOString().slice(0,10)}.csv`)
}

function exportPDF(history, entries, userName) {
  const w = window.open('', '_blank')
  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const plantRows = (history ?? []).map(p =>
    `<tr><td>${p.date}</td><td>${p.health}%</td><td>${p.zone_racines??'—'}%</td><td>${p.zone_tige??'—'}%</td><td>${p.zone_feuilles??'—'}%</td><td>${p.zone_fleurs??'—'}%</td><td>${p.zone_souffle??'—'}%</td></tr>`
  ).join('')
  const journalRows = (entries ?? []).map(e =>
    `<tr><td>${new Date(e.created_at).toLocaleDateString('fr-FR')}</td><td>${e.content ?? ''}</td><td>${(e.zone_tags??[]).join(', ')}</td></tr>`
  ).join('')
  w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/>
<title>Mon Jardin Intérieur — Bilan</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia,serif;color:#1a1a1a;padding:40px 48px;max-width:860px;margin:0 auto}
h1{font-size:26px;font-weight:300;color:#2d5a27;margin-bottom:4px}
.sub{font-size:12px;color:#888;margin-bottom:28px}
h2{font-size:14px;font-weight:500;color:#2d5a27;border-bottom:1px solid #ddd;padding-bottom:6px;margin:24px 0 12px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#f0f7ee;text-align:left;padding:7px 9px;color:#2d5a27;font-weight:500}
td{padding:6px 9px;border-bottom:1px solid #eee;color:#333;vertical-align:top;line-height:1.5}
@media print{body{padding:20px}}
</style></head><body>
<h1>Mon Jardin Intérieur</h1>
<div class="sub">Bilan de ${userName ?? 'votre jardin'} — ${today}</div>
<h2>Historique de vitalité</h2>
<table><thead><tr><th>Date</th><th>Vitalité</th><th>Racines</th><th>Tige</th><th>Feuilles</th><th>Fleurs</th><th>Souffle</th></tr></thead>
<tbody>${plantRows || '<tr><td colspan="7" style="color:#999;font-style:italic">Aucune donnée</td></tr>'}</tbody></table>
<h2>Journal personnel</h2>
<table><thead><tr><th>Date</th><th>Entrée</th><th>Zones</th></tr></thead>
<tbody>${journalRows || '<tr><td colspan="3" style="color:#999;font-style:italic">Aucune entrée</td></tr>'}</tbody></table>
<script>window.onload=()=>window.print()<\/script>
</body></html>`)
  w.document.close()
}

/* ─────────────────────────────────────────
   SCREEN 5 — CLUB DES JARDINIERS (ex Graines de vie)
───────────────────────────────────────── */
function ScreenClubJardiniers({ userId, openCreate, onCreateClose, onReport, awardLumens }) {
  const isMobile = useIsMobile()
  const { circles, activeCircle, createCircle, joinByCode, loadCircles, selectCircle } = useCircle(userId)
  const [joinCode, setJoinCode]           = useState('')
  const [joinError, setJoinError]         = useState(null)
  const [joinLoading, setJoinLoading]     = useState(false)
  const [copied, setCopied]               = useState(false)
  const [showCreate, setShowCreate]       = useState(false)
  const [toast, setToast]                 = useState(null)
  const [publicCircles, setPublicCircles]   = useState([])
  const [editCircle, setEditCircle]         = useState(null)  // graine en cours d'édition
  const [deleteConfirm, setDeleteConfirm]   = useState(null)  // graine à supprimer
  const [showDetail, setShowDetail]         = useState(false) // modale détail
  const [creatorNames, setCreatorNames]     = useState({})    // circleId → display_name du jardinier

  // Charger le nom du jardinier via created_by sur circles
  useEffect(() => {
    if (!circles.length) return
    const memberCircles = circles.filter(c => !c.isAdmin)
    if (!memberCircles.length) return
    // Récupérer created_by depuis circles
    supabase
      .from('circles')
      .select('id, created_by')
      .in('id', memberCircles.map(c => c.id))
      .then(async ({ data: circleData }) => {
        if (!circleData?.length) return
        const creatorIds = [...new Set(circleData.map(r => r.created_by).filter(Boolean))]
        if (!creatorIds.length) return
        const { data: usersData } = await supabase
          .from('users')
          .select('id, display_name, email')
          .in('id', creatorIds)
        const userMap = {}
        ;(usersData ?? []).forEach(u => { userMap[u.id] = u.display_name ?? u.email ?? 'Jardinier(e)' })
        const map = {}
        circleData.forEach(r => { if (r.created_by) map[r.id] = userMap[r.created_by] ?? 'Jardinier(e)' })
        setCreatorNames(map)
      })
  }, [circles])

  async function fetchPublicCircles() {
    const { data } = await supabase
      .from('circles')
      .select('id, name, theme, is_open, invite_code, expires_at, max_members, circle_members(count)')
      .eq('is_open', true)
      .order('created_at', { ascending: false })
      .limit(100)
    const mapped = (data ?? []).map(r => ({
      ...r,
      memberCount: r.circle_members?.[0]?.count ?? 0
    }))
    // Masquer les graines pleines et expirées
    const filtered = mapped.filter(r => {
      const full = r.memberCount >= (r.max_members ?? 8)
      const expired = r.expires_at && new Date(r.expires_at) < new Date()
      return !full && !expired
    }).sort(() => Math.random() - 0.5).slice(0, 10)
    setPublicCircles(filtered)
  }

  useEffect(() => { fetchPublicCircles() }, [])
  // Topbar "Créer" button also opens the modal
  const isCreateOpen = showCreate || openCreate
  const EMOJIS = ['🌸','🌿','🌾','🌱','🌺','🍃','🌼','🌷','🌻']

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500) }

  async function handleJoin() {
    if (!joinCode.trim()) return
    setJoinLoading(true); setJoinError(null)
    try {
      const circle = await joinByCode(joinCode.trim())
      setJoinCode(''); showToast(`✅ Vous avez rejoint la graine "${circle.name}"`)
      awardLumens?.(2, 'join_graine', { circle_id: circle.id })
    } catch (e) { setJoinError(e.message) }
    finally { setJoinLoading(false) }
  }

  async function handleJoinPublic(code) {
    if (!code) return
    try {
      const circle = await joinByCode(code)
      showToast(`✅ Vous avez rejoint la graine "${circle.name}"`)
      awardLumens?.(2, 'join_graine', { circle_id: circle.id })
      const { data } = await supabase.from('circles')
        .select('id, name, theme, is_open, invite_code, expires_at, circle_members(count)')
        .eq('is_open', true).limit(10)
      setPublicCircles((data ?? []).map(r => ({ ...r, memberCount: r.circle_members?.[0]?.count ?? 0 })))
    } catch (e) { showToast(`❌ ${e.message}`) }
  }

  function handleCopyCode(code) {
    navigator.clipboard?.writeText(code ?? '').then(() => {
      setCopied(true); showToast('🌿 Code copié dans le presse-papier !')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleCreate(name, theme, isOpen, duration, description) {
    const myOwnGraines = circles.filter(c => c.isAdmin || c.created_by === userId)
    if (myOwnGraines.length >= 6) {
      showToast("🌱 Maximum 6 graines actives — supprimez-en une avant d'en créer une nouvelle.")
      return
    }
    // Validation IA du titre via Edge Function
    try {
      const modResult = await callModerateCircle({ action: 'moderate', name })
      if (!modResult.ok) {
        showToast('❌ Titre refusé : ' + (modResult.reason ?? 'contenu inapproprié'))
        return
      }
    } catch(e) { /* si Edge Function indisponible, on laisse passer */ }
    const circle = await createCircle(name, theme, isOpen)
    const updates = {}
    if (duration != null) updates.expires_at = new Date(Date.now() + duration * 86400000).toISOString()
    if (description) updates.description = description
    if (Object.keys(updates).length) await supabase.from('circles').update(updates).eq('id', circle.id)
    await loadCircles?.()
    fetchPublicCircles()
    showToast(`🌱 Graine "${circle.name}" créée !`)
  }

  async function handleUpdate(id, name, theme, isOpen, description) {
    try {
      await supabase.from('circles').update({ name, theme, is_open: isOpen, description }).eq('id', id)
      setEditCircle(null)
      showToast('✅ Graine mise à jour')
      loadCircles?.()
      fetchPublicCircles()
    } catch (e) { showToast(`❌ ${e.message}`) }
  }

  async function handleSignaler(circleId) {
    try {
      await supabase.from('reports').insert({ circle_id: circleId, reported_by: userId, reason: 'user_report' })
      showToast('🚩 Signalement envoyé — merci !')
      setShowDetail(false)
      onReport?.()
    } catch(e) { showToast("❌ Impossible d'envoyer le signalement") }
  }

  async function handleDelete(id) {
    try {
      await supabase.from('circle_members').delete().eq('circle_id', id)
      await supabase.from('circles').delete().eq('id', id)
      setDeleteConfirm(null)
      showToast('🗑️ Graine supprimée')
      loadCircles?.()
      fetchPublicCircles()
    } catch (e) { showToast(`❌ ${e.message}`) }
  }

  return (
    <>
      {isCreateOpen && <CreateCircleModal onClose={() => { setShowCreate(false); onCreateClose?.() }} onCreate={handleCreate} />}
      {editCircle && (
        <EditCircleModal
          circle={editCircle}
          onClose={() => setEditCircle(null)}
          onSave={(name, theme, isOpen, description) => handleUpdate(editCircle.id, name, theme, isOpen, description)}
        />
      )}
      {showDetail && activeCircle && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:480 }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <div className="modal-title" style={{ marginBottom:4 }}>{activeCircle.name}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>
                  {getThemeEmoji(activeCircle.theme)} {activeCircle.theme} · {activeCircle.memberCount} membre{activeCircle.memberCount > 1 ? 's' : ''}
                </div>
              </div>
              <div onClick={() => setShowDetail(false)} style={{ cursor:'pointer', fontSize:18, opacity:.5, marginTop:2 }}>✕</div>
            </div>

            {/* Description */}
            {activeCircle.description && (
              <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.8, fontStyle:'italic', marginBottom:16, padding:'10px 14px', background:'rgba(150,212,133,0.05)', borderRadius:10, border:'1px solid rgba(150,212,133,0.1)' }}>
                "{activeCircle.description}"
              </div>
            )}



            {/* Code invitation si privée et jardinier */}
            {(activeCircle.isAdmin || activeCircle.created_by === userId) && !activeCircle.is_open && (
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:6 }}>Code d'invitation</div>
                <div className="cd-invite">
                  <div className="cdi-code">{activeCircle.invite_code ?? '——'}</div>
                  <div className="cdi-copy" onClick={() => handleCopyCode(activeCircle.invite_code)}>
                    {copied ? '✓ Copié' : 'Copier'}
                  </div>
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop:20, justifyContent:'space-between' }}>
              <button onClick={() => handleSignaler(activeCircle.id)}
                style={{ padding:'8px 14px', borderRadius:10, border:'1px solid rgba(210,80,80,0.3)', background:'rgba(210,80,80,0.08)', color:'rgba(255,140,140,0.8)', fontSize:11, cursor:'pointer' }}>
                🚩 Signaler
              </button>
              <div style={{ display:'flex', gap:8 }}>
                <button className="modal-cancel" onClick={() => setShowDetail(false)}>Fermer</button>
                {(activeCircle.isAdmin || activeCircle.created_by === userId) && (
                  <button className="modal-submit" onClick={() => { setShowDetail(false); setEditCircle(activeCircle) }}>Modifier</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Supprimer la graine 🗑️</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginBottom:20, lineHeight:1.6 }}>
              Voulez-vous vraiment supprimer <b>{deleteConfirm.name}</b> ? Cette action est irréversible et supprimera tous les membres.
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button className="modal-submit" style={{ background:'rgba(210,80,80,0.18)', borderColor:'rgba(210,80,80,0.4)', color:'rgba(255,160,160,0.9)' }}
                onClick={() => handleDelete(deleteConfirm.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
      <Toast msg={toast} />
      <div className="content">
        {/* ── En-tête Club des Jardiniers ── */}
        <div style={{ gridColumn:'1/-1', marginBottom:0 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:14, padding:'14px 18px',
            background:'linear-gradient(135deg, rgba(120,80,30,0.18), rgba(80,140,60,0.12))',
            border:'1px solid rgba(180,130,60,0.22)', borderRadius:14, marginBottom:16,
          }}>
            <span style={{ fontSize:28 }}>🪴</span>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:18, fontWeight:400, color:'rgba(238,220,170,0.92)', letterSpacing:'.03em' }}>
                Club des Jardiniers
              </div>
              <div style={{ fontSize:10, color:'rgba(238,220,170,0.42)', letterSpacing:'.07em', marginTop:2 }}>
                Anciennement <em>Graines de vie</em> · Vos cercles de partage
              </div>
            </div>
          </div>
        </div>
        <div className="col" style={{ flex:1 }}>
          <div className="slabel">Mes graines · {circles.length} actives</div>
          <div className="circles-grid">
            {circles.map(c => { const creatorName = creatorNames[c.id] ?? null; const isMine = c.isAdmin || c.created_by === userId; return (
              <div key={c.id} className={'circle-card-big' + (c.id===activeCircle?.id ? ' active-circle' : '')}
                style={{ position:'relative', padding:'14px', gap:6 }}
                onClick={() => { selectCircle(c.id); setShowDetail(true) }}>

                {/* LIGNE 1 — 7j haut gauche + badge haut droite */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
                  {c.expires_at ? (() => {
                    const remaining = Math.ceil((new Date(c.expires_at) - Date.now()) / 86400000)
                    return remaining > 0
                      ? <div style={{ fontSize:10, color: remaining <= 2 ? 'rgba(255,140,100,0.85)' : 'var(--text3)', display:'flex', alignItems:'center', gap:4 }}>
                          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, color: remaining <= 2 ? 'rgba(255,140,100,0.9)' : 'var(--text2)' }}>{remaining}j</span>
                          Profitez-en !
                        </div>
                      : <div style={{ fontSize:10, color:'rgba(200,100,100,0.7)' }}>Expirée</div>
                  })() : <div />}
                  {isMine
                    ? <div className="ccb-badge admin">Jardinier(e)</div>
                    : <div className="ccb-badge member">🌱 {creatorName ?? '…'}</div>
                  }
                </div>

                {/* LIGNE 2 — Nom */}
                <div className="ccb-name">{c.name}</div>
                <div className="ccb-theme">{getThemeEmoji(c.theme)} {c.theme}</div>

                {/* LIGNE 3 — Membres + boutons bas droite */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    {Array.from({ length: Math.min(c.memberCount, 5) }).map((_, i) => (
                      <div key={i} className="ccb-member-av" style={{ fontSize:12 }}>👤</div>
                    ))}
                    {c.memberCount > 5 && <div className="ccb-member-count">+{c.memberCount - 5}</div>}
                    <div className="ccb-member-count">{c.memberCount} membre{c.memberCount > 1 ? 's' : ''}</div>
                  </div>
                  {isMine && (
                    <div style={{ display:'flex', gap:10 }}>
                      <div title="Modifier" onClick={e => { e.stopPropagation(); setEditCircle(c) }}
                        style={{ cursor:'pointer', fontSize:13, opacity:.5, transition:'opacity .2s' }}
                        onMouseEnter={e=>e.currentTarget.style.opacity=1}
                        onMouseLeave={e=>e.currentTarget.style.opacity=.5}>✏️</div>
                      <div title="Supprimer" onClick={e => { e.stopPropagation(); setDeleteConfirm(c) }}
                        style={{ cursor:'pointer', fontSize:13, opacity:.4, transition:'opacity .2s' }}
                        onMouseEnter={e=>e.currentTarget.style.opacity=1}
                        onMouseLeave={e=>e.currentTarget.style.opacity=.4}>🗑️</div>
                    </div>
                  )}
                </div>
              </div>
            )})}
            <div className="create-circle-card" onClick={() => setShowCreate(true)}>
              <div className="ccc-icon">＋</div>
              <div className="ccc-text">Créer une graine</div>
            </div>
          </div>


        </div>

        <div className="rpanel" style={{ display: isMobile ? "none" : undefined }}>
          <div className="rp-section">
            <div className="rp-slabel">Rejoindre via code</div>
            <div style={{ display:'flex', gap:7, marginBottom:6 }}>
              <input
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(null) }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="CODE…"
                style={{ flex:1, padding:'9px 13px', background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', borderRadius:10, fontSize:12, color:'var(--text2)', letterSpacing:'.1em', outline:'none' }}
              />
              <div
                onClick={handleJoin}
                style={{ padding:'9px 16px', background: joinLoading?'transparent':'var(--green2)', border:'1px solid var(--greenT)', borderRadius:10, fontSize:14, color:'#c8f0b8', cursor:'pointer', opacity: joinLoading?.6:1, transition:'all .2s' }}
              >{joinLoading ? '…' : '→'}</div>
            </div>
            {joinError && <div style={{ fontSize:10, color:'rgba(210,110,110,.85)', marginBottom:12, padding:'6px 10px', background:'rgba(210,110,110,.07)', borderRadius:8, border:'1px solid rgba(210,110,110,.2)' }}>{joinError}</div>}

            <div className="rp-slabel" style={{ marginTop:14 }}>Découvrir les Graines publiques</div>
            {publicCircles.length === 0
              ? <div style={{ fontSize:11, color:'var(--text3)', fontStyle:'italic', padding:'6px 0' }}>Aucune graine publique pour l'instant.</div>
              : publicCircles.map((c, i) => (
              <div key={c.id ?? i} style={{ marginBottom:11, padding:'11px 13px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:13 }}>
                <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:6 }}>
                  <span style={{ fontSize:17 }}>{c.emoji ?? '🌱'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:'var(--text)' }}>{c.name}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{getThemeEmoji(c.theme)} {c.theme ?? '—'}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{c.memberCount ?? '?'} membre{(c.memberCount ?? 0) > 1 ? 's' : ''}</div>
                  {c.is_open
                    ? <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <LumenBadge amount={2} />
                        <div style={{ fontSize:10, padding:'3px 10px', borderRadius:100, border:'1px solid var(--greenT)', color:'#c8f0b8', background:'var(--green3)', cursor:'pointer' }}
                          onClick={() => handleJoinPublic(c.invite_code)}>Rejoindre</div>
                      </div>
                    : <div style={{ fontSize:10, padding:'3px 10px', borderRadius:100, border:'1px solid var(--border)', color:'var(--text3)' }}>Sur invitation</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}


export { ScreenClubJardiniers }
