import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { supabase } from '../core/supabaseClient'
import { ADMIN_IDS, AdminNav } from './AdminPage'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;width:100%}
:root{
  --bg:#2b2f33;--bg2:#353a3f;--bg3:#3e444a;
  --border:rgba(255,255,255,0.18);--border2:rgba(255,255,255,0.10);
  --text:#ffffff;--text2:rgba(255,255,255,0.85);--text3:rgba(255,255,255,0.50);
  --cream:#ffffff;
  --green:#96d485;--green2:rgba(150,212,133,0.25);--green3:rgba(150,212,133,0.12);--greenT:rgba(150,212,133,0.50);
  --gold:#e8d4a8;--gold-warm:#C8A882;
  --red:rgba(210,80,80,0.85);--red2:rgba(210,80,80,0.12);--redT:rgba(210,80,80,0.35);
}
.adm-root{font-family:'Jost',sans-serif;background:#2b2f33!important;min-height:100vh;width:100vw;color:#ffffff!important;display:flex;flex-direction:column}.adm-root *{color:#ffffff!important;font-size:clamp(13px,3vw,18px)!important}
.adm-topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 40px;border-bottom:1px solid var(--border2);background:#353a3f!important;backdrop-filter:blur(10px);position:sticky;top:0;z-index:10}
.adm-logo{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:300;letter-spacing:.05em;color:#ffffff}
.adm-logo em{font-style:italic;color:var(--green)}
.adm-body{flex:1;padding:32px 40px;width:100%}
.adm-section{margin-bottom:32px}
.adm-empty{font-size:18px;color:rgba(255,255,255,0.55);font-style:italic;padding:28px;text-align:center;background:#3d4248;border-radius:12px;border:1px dashed var(--border2)}
.adm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:32px}
.adm-stat{background:#3d4248;border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:20px 24px;display:flex;flex-direction:column;gap:6px}
.adm-stat-val{font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:300;color:#ffffff;line-height:1}
.adm-stat-lbl{font-size:18px;color:rgba(255,255,255,0.55);letter-spacing:.08em;text-transform:uppercase}
.adm-table{width:100%;border-collapse:collapse;background:#3d4248;border-radius:12px;overflow:hidden;border:1px solid var(--border2)}
.adm-th{font-size:18px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,0.55);padding:12px 16px;text-align:left;background:#454b52;border-bottom:1px solid var(--border2)}
.adm-td{font-size:18px;color:rgba(255,255,255,0.85);padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.03);vertical-align:middle}
.adm-tr:last-child .adm-td{border-bottom:none}
.adm-tr:hover .adm-td{background:rgba(255,255,255,0.02)}
.adm-btn{padding:7px 16px;border-radius:8px;font-size:18px;letter-spacing:.06em;cursor:pointer;border:none;font-family:'Jost',sans-serif;transition:all .2s;white-space:nowrap}
.adm-btn.ghost{background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.20);color:#ffffff}
.adm-btn.ghost:hover{background:rgba(255,255,255,0.12)}
.adm-btn.danger{background:var(--red);border:1px solid var(--redT)}
.adm-btn.danger:hover{background:rgba(210,80,80,1)}
.adm-btn.danger2{background:rgba(180,40,40,0.95);border:1px solid rgba(210,80,80,0.6)}
.adm-btn.success{background:rgba(100,180,80,0.25);border:1px solid var(--greenT)}
.adm-btn.success:hover{background:rgba(100,180,80,0.35)}
.adm-toast{position:fixed;bottom:24px;right:24px;background:#3e444a!important;border:1px solid var(--greenT);border-radius:10px;padding:10px 20px;font-size:18px;color:#ffffff;z-index:999;animation:fadeInUp .3s ease}
@keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.toggle-btn{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;border:none;cursor:pointer;font-family:'Jost',sans-serif;font-size:13px;letter-spacing:.06em;font-weight:500;transition:all .2s}
.toggle-btn.on{background:rgba(150,212,133,0.2);border:1px solid rgba(150,212,133,0.4);color:#c8f0b8}
.toggle-btn.off{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.45)}
.badge-status{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:500;letter-spacing:.04em}
.badge-status.ok{background:rgba(150,212,133,0.15);border:1px solid rgba(150,212,133,0.3);color:#c8f0b8}
.badge-status.warn{background:rgba(232,180,60,0.15);border:1px solid rgba(232,180,60,0.3);color:#f0d878}
.badge-plan{display:inline-flex;padding:3px 10px;border-radius:12px;font-size:12px;letter-spacing:.05em}
.badge-plan.free{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.5)}
.badge-plan.premium{background:rgba(232,212,168,0.15);border:1px solid rgba(232,212,168,0.35);color:#e8d4a8}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}
.modal-box{background:#353a3f;border:1px solid var(--border);border-radius:18px;width:100%;max-width:560px;max-height:85vh;overflow-y:auto;padding:32px}
.modal-title{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:300;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid var(--border2)}
.fiche-row{display:flex;gap:8px;margin-bottom:10px;align-items:flex-start}
.fiche-lbl{color:rgba(255,255,255,0.45);min-width:140px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;padding-top:2px}
.fiche-val{color:rgba(255,255,255,0.9);word-break:break-all}
.fiche-code{font-family:'Courier New',monospace;background:#2b2f33;padding:3px 10px;border-radius:6px;font-size:13px;letter-spacing:.1em;color:#c8f0b8}
.confirm-box{background:rgba(210,80,80,0.1);border:1px solid var(--redT);border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
@media(max-width:700px){
  .adm-topbar{padding:10px 16px;gap:8px;flex-wrap:wrap}
  .adm-logo{font-size:16px;flex:1}
  .adm-body{padding:12px 12px}
  .adm-stats{grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
  .adm-th{padding:8px 10px;font-size:10px!important}
  .adm-td{padding:8px 10px;font-size:12px!important}
  .adm-btn{padding:6px 12px;font-size:12px!important}
  .modal-box{padding:20px}
  .fiche-lbl{min-width:110px}
}
`

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

const AFFICHES = [
  { img: '/affiche-pub.png',  pdf: '/mon-jardin-affiche-1.pdf', label: 'Affiche 1', filename: 'mon-jardin-affiche-1.pdf' },
  { img: '/affiche-pub2.png', pdf: '/mon-jardin-affiche-2.pdf', label: 'Affiche 2', filename: 'mon-jardin-affiche-2.pdf' },
  { img: '/affiche-pub3.png', pdf: '/mon-jardin-affiche-3.pdf', label: 'Affiche 3', filename: 'mon-jardin-affiche-3.pdf' },
]

function AfficheModalAdmin({ onClose }) {
  const [idx, setIdx] = useState(0)
  const current = AFFICHES[idx]
  const arrow = { flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .18s', fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1 }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 600, color: '#111', alignSelf: 'flex-start' }}>Affiches publicitaires</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
          <button style={arrow} onClick={() => setIdx(i => (i - 1 + AFFICHES.length) % AFFICHES.length)}>❮</button>
          <img src={current.img} alt={current.label} style={{ flex: 1, borderRadius: 10, border: '1px solid #e5e2dc', objectFit: 'contain', maxHeight: 380, background: '#f9f7f4' }} />
          <button style={arrow} onClick={() => setIdx(i => (i + 1) % AFFICHES.length)}>❯</button>
        </div>

        <div style={{ display: 'flex', gap: 7, justifyContent: 'center' }}>
          {AFFICHES.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: i === idx ? '#111' : '#ddd', transition: 'background .18s' }} />
          ))}
        </div>

        <button onClick={() => forcedDownload(current.pdf, current.filename)}
          style={{ width: '100%', padding: 13, borderRadius: 10, background: '#111', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: "'Jost',sans-serif", textAlign: 'center', border: 'none', cursor: 'pointer' }}>
          ⬇ Télécharger {current.label} (PDF)
        </button>
        <button onClick={onClose}
          style={{ fontSize: 12, color: '#999', cursor: 'pointer', background: 'none', border: 'none', fontFamily: "'Jost',sans-serif", textDecoration: 'underline', padding: 0 }}>
          Fermer
        </button>
      </div>
    </div>
  )
}

function FichePro({ pro, onClose, onEmailSent }) {
  const fmt = (v) => v || <span style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>—</span>
  const [showAffiche,  setShowAffiche]  = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailDone,    setEmailDone]    = useState(false)

  async function sendWelcomeEmail() {
    if (!pro.email || emailLoading) return
    setEmailLoading(true)
    try {
      await supabase.functions.invoke('send-one-email', { body: { to: pro.email } })
      setEmailDone(true)
      onEmailSent?.(`Email envoyé à ${pro.email}`)
    } catch(e) {
      onEmailSent?.('Erreur lors de l\'envoi')
    } finally {
      setEmailLoading(false)
    }
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">
          {pro.prenom} {pro.nom}
          {pro.entreprise ? <span style={{ color: 'rgba(255,255,255,0.45)', marginLeft: 10, fontSize: 16 }}>{pro.entreprise}</span> : null}
        </div>

        <div className="fiche-row">
          <span className="fiche-lbl">Code pro</span>
          <span className="fiche-val">
            {pro.pro_id
              ? <span className="fiche-code">{pro.pro_id}</span>
              : <span style={{ color: '#f0d878', fontSize: 13 }}>⚠ Non généré — doit visiter son profil</span>}
          </span>
        </div>
        <div className="fiche-row"><span className="fiche-lbl">Email</span><span className="fiche-val">{fmt(pro.email)}</span></div>
        <div className="fiche-row"><span className="fiche-lbl">Activité</span><span className="fiche-val">{fmt(pro.activite)}</span></div>
        <div className="fiche-row"><span className="fiche-lbl">Téléphone</span><span className="fiche-val">{fmt(pro.telephone)}</span></div>
        <div className="fiche-row"><span className="fiche-lbl">Adresse</span><span className="fiche-val">{pro.adresse ? `${pro.adresse}, ${pro.cp} ${pro.ville}` : fmt(null)}</span></div>
        <div className="fiche-row"><span className="fiche-lbl">SIRET</span><span className="fiche-val">{fmt(pro.siret)}</span></div>
        <div className="fiche-row"><span className="fiche-lbl">Plan</span><span className="fiche-val"><span className={`badge-plan ${pro.pro_plan === 'premium' ? 'premium' : 'free'}`}>{pro.pro_plan || 'free'}</span></span></div>
        {pro.pro_premium_until && <div className="fiche-row"><span className="fiche-lbl">Premium jusqu'au</span><span className="fiche-val">{new Date(pro.pro_premium_until).toLocaleDateString('fr-FR')}</span></div>}
        <div className="fiche-row"><span className="fiche-lbl">Site web</span><span className="fiche-val">{fmt(pro.site_web)}</span></div>
        <div className="fiche-row"><span className="fiche-lbl">Instagram</span><span className="fiche-val">{fmt(pro.instagram)}</span></div>
        <div className="fiche-row"><span className="fiche-lbl">Facebook</span><span className="fiche-val">{fmt(pro.facebook)}</span></div>
        <div className="fiche-row"><span className="fiche-lbl">LinkedIn</span><span className="fiche-val">{fmt(pro.linkedin)}</span></div>
        <div className="fiche-row"><span className="fiche-lbl">Commission</span><span className="fiche-val">{((pro.commission_balance_cents || 0) / 100).toFixed(2)} €</span></div>
        <div className="fiche-row"><span className="fiche-lbl">Total gagné</span><span className="fiche-val">{((pro.total_earned_cents || 0) / 100).toFixed(2)} €</span></div>
        <div className="fiche-row"><span className="fiche-lbl">Inscrit le</span><span className="fiche-val">{new Date(pro.created_at).toLocaleDateString('fr-FR')}</span></div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAffiche(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 20, background: 'rgba(232,212,168,0.12)', border: '1px solid rgba(232,212,168,0.3)', color: '#e8d4a8', fontSize: 12, letterSpacing: '.08em', fontFamily: "'Jost',sans-serif", cursor: 'pointer', fontWeight: 600 }}>
              📄 Affiches Pub
            </button>
            <button
              onClick={sendWelcomeEmail}
              disabled={emailLoading || emailDone || !pro.email}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 20, background: emailDone ? 'rgba(150,212,133,0.15)' : 'rgba(74,124,69,0.15)', border: `1px solid ${emailDone ? 'rgba(150,212,133,0.4)' : 'rgba(74,124,69,0.35)'}`, color: emailDone ? '#c8f0b8' : '#a8c5b5', fontSize: 12, letterSpacing: '.08em', fontFamily: "'Jost',sans-serif", cursor: emailLoading || emailDone ? 'default' : 'pointer', fontWeight: 600, opacity: !pro.email ? 0.4 : 1 }}>
              {emailDone ? '✓ Email envoyé' : emailLoading ? '…' : '✉ Email de bienvenue'}
            </button>
          </div>
          <button className="adm-btn ghost" onClick={onClose}>Fermer</button>
        </div>
      </div>

      {showAffiche && <AfficheModalAdmin onClose={() => setShowAffiche(false)} />}
    </div>
  )
}

export function AdminProsPage() {
  useTheme()
  const { user, signOut } = useAuth()

  const [pros,         setPros]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [toast,        setToast]        = useState(null)
  const [fiche,        setFiche]        = useState(null)
  const [deleteId,     setDeleteId]     = useState(null)
  const [deleteStep,   setDeleteStep]   = useState(1)

  const isAdmin = ADMIN_IDS.includes(user?.id)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2800) }

  async function loadPros() {
    const { data } = await supabase
      .from('users_pro')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setPros(data)
    setLoading(false)
  }

  useEffect(() => {
    if (!isAdmin) return
    loadPros()
  }, [isAdmin])

  async function toggleVisible(pro) {
    const next = !pro.visible_jardinotheque
    const { error } = await supabase
      .from('users_pro')
      .update({ visible_jardinotheque: next })
      .eq('id', pro.id)
    if (error) { showToast('Erreur lors de la mise à jour'); return }
    setPros(prev => prev.map(p => p.id === pro.id ? { ...p, visible_jardinotheque: next } : p))
    showToast(next ? 'Visible dans la jardinothèque' : 'Masqué de la jardinothèque')
  }

  function startDelete(id) {
    setDeleteId(id)
    setDeleteStep(1)
  }

  function cancelDelete() {
    setDeleteId(null)
    setDeleteStep(1)
  }

  async function confirmDelete() {
    if (deleteStep === 1) { setDeleteStep(2); return }
    const { error } = await supabase.from('users_pro').delete().eq('id', deleteId)
    if (error) { showToast('Erreur lors de la suppression'); return }
    setPros(prev => prev.filter(p => p.id !== deleteId))
    setDeleteId(null)
    setDeleteStep(1)
    showToast('Compte pro supprimé')
  }

  const total     = pros.length
  const configures = pros.filter(p => p.pro_id).length
  const visibles  = pros.filter(p => p.visible_jardinotheque).length
  const premiums  = pros.filter(p => p.pro_plan === 'premium').length

  if (!isAdmin) return null

  return (
    <div className="adm-root">
      <style>{css}</style>

      <div className="adm-topbar">
        <div className="adm-logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/icons/icon-192.png" alt="logo" style={{ width: 28, height: 28, borderRadius: '50%' }} />
          Mon <em>Jardin</em> — <span style={{ fontFamily: 'Jost', fontSize: 12, color: 'var(--text3)', letterSpacing: '.2em' }}>PROS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AdminNav current="#pros" />
          <div className="adm-btn ghost" onClick={() => { signOut(); window.location.href = '/' }}>Déconnexion</div>
        </div>
      </div>

      <div className="adm-body">

        {/* STATS */}
        <div className="adm-stats">
          <div className="adm-stat">
            <div className="adm-stat-val">{total}</div>
            <div className="adm-stat-lbl">Pros inscrits</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-val" style={{ color: configures === total ? 'var(--green)' : '#f0d878' }}>{configures}</div>
            <div className="adm-stat-lbl">Configurés</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-val">{visibles}</div>
            <div className="adm-stat-lbl">Visibles jardinothèque</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-val" style={{ color: premiums > 0 ? '#e8d4a8' : 'inherit' }}>{premiums}</div>
            <div className="adm-stat-lbl">Premium</div>
          </div>
        </div>

        {/* LISTE */}
        {loading ? (
          <div className="adm-empty">Chargement…</div>
        ) : pros.length === 0 ? (
          <div className="adm-empty">Aucun compte pro inscrit.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th className="adm-th">Thérapeute</th>
                  <th className="adm-th">Activité</th>
                  <th className="adm-th">Statut</th>
                  <th className="adm-th">Plan</th>
                  <th className="adm-th">Jardinothèque</th>
                  <th className="adm-th">Inscrit</th>
                  <th className="adm-th"></th>
                </tr>
              </thead>
              <tbody>
                {pros.map(pro => (
                  <tr key={pro.id} className="adm-tr">
                    <td className="adm-td">
                      <div style={{ fontWeight: 500 }}>{pro.prenom} {pro.nom}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{pro.email}</div>
                      {pro.entreprise && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{pro.entreprise}</div>}
                    </td>
                    <td className="adm-td" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{pro.activite || '—'}</td>
                    <td className="adm-td">
                      {pro.pro_id
                        ? <span className="badge-status ok">✓ Configuré</span>
                        : <span className="badge-status warn">⚠ En attente</span>}
                    </td>
                    <td className="adm-td">
                      <span className={`badge-plan ${pro.pro_plan === 'premium' ? 'premium' : 'free'}`}>
                        {pro.pro_plan === 'premium' ? '✨ Premium' : 'Free'}
                      </span>
                    </td>
                    <td className="adm-td">
                      <button
                        className={`toggle-btn ${pro.visible_jardinotheque ? 'on' : 'off'}`}
                        onClick={() => toggleVisible(pro)}
                      >
                        {pro.visible_jardinotheque ? '● O' : '○ N'}
                      </button>
                    </td>
                    <td className="adm-td" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                      {new Date(pro.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="adm-td">
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button className="adm-btn ghost" onClick={() => setFiche(pro)}>Fiche</button>
                        {deleteId === pro.id ? (
                          <div className="confirm-box">
                            <span style={{ fontSize: 13, color: 'rgba(255,180,180,0.9)' }}>
                              {deleteStep === 1 ? 'Supprimer ce pro ?' : '⚠ Confirmer définitivement ?'}
                            </span>
                            <button className="adm-btn danger2" onClick={confirmDelete}>
                              {deleteStep === 1 ? 'Oui' : 'Supprimer'}
                            </button>
                            <button className="adm-btn ghost" onClick={cancelDelete}>Annuler</button>
                          </div>
                        ) : (
                          <button className="adm-btn danger" onClick={() => startDelete(pro.id)}>Supprimer</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {fiche && <FichePro pro={fiche} onClose={() => setFiche(null)} onEmailSent={showToast} />}
      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  )
}
