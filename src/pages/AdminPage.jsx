import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../core/supabaseClient'

// ── Votre userId admin — remplacez par le vôtre ──
const ADMIN_IDS = ['aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7']

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;width:100%}
:root{
  --bg:#1a2e1a;--bg2:#213d21;--bg3:#274827;
  --border:rgba(255,255,255,0.18);--border2:rgba(255,255,255,0.10);
  --text:#f2ede0;--text2:rgba(242,237,224,0.88);--text3:rgba(242,237,224,0.60);
  --green:#96d485;--green2:rgba(150,212,133,0.25);--green3:rgba(150,212,133,0.12);--greenT:rgba(150,212,133,0.50);
  --gold:#e8d4a8;--red:rgba(210,80,80,0.85);--red2:rgba(210,80,80,0.12);--redT:rgba(210,80,80,0.35);
}
.adm-root{font-family:'Jost',sans-serif;background:var(--bg);min-height:100vh;width:100vw;color:var(--text);display:flex;flex-direction:column}
.adm-topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 40px;border-bottom:1px solid var(--border2);background:rgba(20,45,20,0.97);backdrop-filter:blur(10px);position:sticky;top:0;z-index:10}
.adm-logo{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:300;letter-spacing:.05em;color:var(--gold)}
.adm-logo em{font-style:italic;color:var(--green)}
.adm-badge{font-size:9px;letter-spacing:.15em;text-transform:uppercase;padding:4px 12px;border-radius:100px;background:rgba(210,80,80,0.12);border:1px solid rgba(210,80,80,0.3);color:rgba(255,160,160,0.9)}
.adm-body{flex:1;padding:32px 40px;width:100%}
.adm-section{margin-bottom:32px}
.adm-empty{font-size:12px;color:var(--text3);font-style:italic;padding:28px;text-align:center;background:rgba(255,255,255,0.02);border-radius:12px;border:1px dashed var(--border2)}
/* STATS */
.adm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:32px}
.adm-stat{background:rgba(255,255,255,0.04);border:1px solid var(--border2);border-radius:14px;padding:20px 24px;display:flex;flex-direction:column;gap:6px}
.adm-stat-val{font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:300;color:var(--text);line-height:1}
.adm-stat-lbl{font-size:10px;color:var(--text3);letter-spacing:.08em;text-transform:uppercase}
/* TABS */
.adm-tabs{display:flex;gap:0;margin-bottom:24px;border-bottom:1px solid var(--border2)}
.adm-tab{padding:10px 24px;font-size:11px;letter-spacing:.08em;color:var(--text3);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .2s}
.adm-tab.active{color:#c8f0b8;border-bottom-color:var(--green)}
/* TABLE */
.adm-table{width:100%;border-collapse:collapse;background:rgba(255,255,255,0.02);border-radius:12px;overflow:hidden;border:1px solid var(--border2)}
.adm-th{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);padding:12px 16px;text-align:left;background:rgba(255,255,255,0.03);border-bottom:1px solid var(--border2)}
.adm-td{font-size:12px;color:var(--text2);padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.03);vertical-align:middle}
.adm-tr:last-child .adm-td{border-bottom:none}
.adm-tr:hover .adm-td{background:rgba(255,255,255,0.02)}
/* REPORTS */
.adm-grid{display:grid;gap:10px}
.adm-report-card{background:rgba(255,255,255,0.04);border:1px solid var(--border2);border-radius:12px;padding:16px 20px;display:flex;align-items:flex-start;gap:14px}
.adm-report-card.resolved{opacity:.4}
.adm-report-flag{font-size:18px;flex-shrink:0;margin-top:2px}
.adm-report-body{flex:1}
.adm-report-graine{font-size:13px;font-weight:400;color:var(--text);margin-bottom:3px}
.adm-report-meta{font-size:10px;color:var(--text3);letter-spacing:.03em;margin-bottom:10px}
.adm-report-actions{display:flex;gap:8px}
/* BOUTONS */
.adm-btn{padding:7px 16px;border-radius:8px;font-size:11px;letter-spacing:.06em;cursor:pointer;border:none;font-family:'Jost',sans-serif;transition:all .2s;white-space:nowrap}
.adm-btn.danger{background:var(--red2);border:1px solid var(--redT);color:rgba(255,160,160,0.9)}
.adm-btn.danger:hover{background:rgba(210,80,80,0.22)}
.adm-btn.ghost{background:rgba(255,255,255,0.07);border:1px solid var(--border);color:var(--text2)}
.adm-btn.ghost:hover{background:rgba(255,255,255,0.12);color:var(--text)}
.adm-btn.success{background:var(--green3);border:1px solid var(--greenT);color:#c8f0b8}
.adm-btn.success:hover{background:rgba(150,212,133,0.18)}
/* TOAST */
.adm-toast{position:fixed;bottom:24px;right:24px;background:rgba(30,60,30,0.97);border:1px solid var(--greenT);border-radius:10px;padding:10px 20px;font-size:12px;color:#c8f0b8;z-index:999;animation:fadeInUp .3s ease}
@keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
`

export function AdminPage() {
  const { user, signOut } = useAuth()
  const [tab,       setTab]       = useState('reports')
  const [reports,   setReports]   = useState([])
  const [circles,   setCircles]   = useState([])
  const [applications, setApplications] = useState([])
  const [lumensData,   setLumensData]   = useState([])
  const [lumenAward,   setLumenAward]   = useState({ userId:'', amount:5, reason:'participation' })
  const [allUsers,     setAllUsers]     = useState([])
  const [stats,     setStats]     = useState({})
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState(null)

  const isAdmin = ADMIN_IDS.includes(user?.id)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2800) }

  useEffect(() => { if (isAdmin) { loadAll() } }, [isAdmin])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadReports(), loadCircles(), loadStats(), loadApplications(), loadLumensData(), loadAllUsers()])
    setLoading(false)
  }

  async function loadReports() {
    const { data: reps } = await supabase
      .from('reports')
      .select('id, reason, created_at, resolved, circle_id, reported_by')
      .order('created_at', { ascending: false })
      .limit(50)
    if (!reps?.length) { setReports([]); return }

    const circleIds = [...new Set(reps.map(r => r.circle_id).filter(Boolean))]
    const { data: circlesData } = await supabase
      .from('circles').select('id, name, theme').in('id', circleIds)
    const circleMap = Object.fromEntries((circlesData ?? []).map(c => [c.id, c]))

    const reporterIds = [...new Set(reps.map(r => r.reported_by).filter(Boolean))]
    const { data: usersData } = await supabase
      .from('users').select('id, display_name, email').in('id', reporterIds)
    const userMap = Object.fromEntries((usersData ?? []).map(u => [u.id, u]))

    setReports(reps.map(r => ({
      ...r,
      circles: circleMap[r.circle_id] ?? null,
      reporter: userMap[r.reported_by] ?? null
    })))
  }

  async function loadAllUsers() {
    const { data } = await supabase.from('users').select('id, display_name, email').order('display_name')
    setAllUsers(data ?? [])
  }

  async function loadLumensData() {
    const { data } = await supabase
      .from('lumens')
      .select('*, users:user_id(display_name, email)')
      .order('total', { ascending: false })
      .limit(20)
    setLumensData(data ?? [])
  }

  async function handleAwardLumens() {
    if (!lumenAward.userId || !lumenAward.amount) return
    await supabase.rpc('award_lumens', {
      p_user_id: lumenAward.userId,
      p_amount: Number(lumenAward.amount),
      p_reason: lumenAward.reason,
      p_meta: null
    })
    showToast(`✦ ${lumenAward.amount} Lumens attribués !`)
    loadLumensData()
  }

  async function loadApplications() {
    const { data } = await supabase
      .from('animator_applications')
      .select('id, motivation, experience, status, created_at, user_id')
      .order('created_at', { ascending: false })
    if (data?.length) {
      const ids = data.map(a => a.user_id)
      const { data: usersData } = await supabase.from('users').select('id, display_name, email').in('id', ids)
      const userMap = Object.fromEntries((usersData ?? []).map(u => [u.id, u]))
      setApplications(data.map(a => ({ ...a, user: userMap[a.user_id] ?? null })))
    } else {
      setApplications([])
    }
  }

  async function loadCircles() {
    const { data } = await supabase
      .from('circles')
      .select('id, name, theme, is_open, expires_at, created_at, created_by, circle_members(count)')
      .order('created_at', { ascending: false })
      .limit(50)
    setCircles((data ?? []).map(c => ({ ...c, memberCount: c.circle_members?.[0]?.count ?? 0 })))
  }

  async function loadStats() {
    const [{ count: totalUsers }, { count: totalCircles }, { count: totalReports }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('circles').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }),
    ])
    setStats({ totalUsers, totalCircles, totalReports })
  }

  async function handleApproveAnimator(appId, userId) {
    await supabase.from('animator_applications').update({ status: 'approved' }).eq('id', appId)
    await supabase.from('users').update({ is_animator: true }).eq('id', userId)
    showToast('✅ Animateur validé !')
    loadApplications()
  }

  async function handleRejectAnimator(appId) {
    await supabase.from('animator_applications').update({ status: 'rejected' }).eq('id', appId)
    showToast('❌ Candidature refusée')
    loadApplications()
  }

  async function handleDeleteCircle(circleId, circleName) {
    if (!confirm(`Supprimer la graine "${circleName}" ?`)) return
    await supabase.from('circle_members').delete().eq('circle_id', circleId)
    await supabase.from('circles').delete().eq('id', circleId)
    showToast('🗑️ Graine supprimée')
    loadAll()
  }

  async function handleResolveReport(reportId) {
    await supabase.from('reports').update({ resolved: true }).eq('id', reportId)
    showToast('✅ Signalement résolu')
    loadReports()
  }

  async function handleDeleteFromReport(report) {
    if (!report.circles?.id) return
    await handleDeleteCircle(report.circles.id, report.circles.name)
    await supabase.from('reports').update({ resolved: true }).eq('id', report.id)
    loadReports()
  }

  if (!isAdmin) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', color:'var(--text3)', fontFamily:'Jost,sans-serif', fontSize:13 }}>
      <style>{css}</style>
      🚫 Accès non autorisé
    </div>
  )

  const pendingReports = reports.filter(r => !r.resolved)
  const resolvedReports = reports.filter(r => r.resolved)
  const pendingApplications = applications.filter(a => a.status === 'pending' || !a.status)

  return (
    <div className="adm-root">
      <style>{css}</style>

      {/* TOPBAR */}
      <div className="adm-topbar">
        <div className="adm-logo">Mon <em>Jardin</em> — <span style={{ fontFamily:'Jost', fontSize:12, color:'var(--text3)', letterSpacing:'.2em' }}>ADMIN</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {pendingReports.length > 0 && (
            <div className="adm-badge">🚩 {pendingReports.length} signalement{pendingReports.length > 1 ? 's' : ''}</div>
          )}
          <div className="adm-btn ghost" onClick={() => window.location.hash = ''}>← Retour</div>
          <div className="adm-btn ghost" onClick={signOut}>Déconnexion</div>
        </div>
      </div>

      <div className="adm-body">

        {/* STATS */}
        <div className="adm-stats">
          {[
            { val: stats.totalUsers ?? '—',   lbl: 'Utilisateurs' },
            { val: stats.totalCircles ?? '—', lbl: 'Graines actives' },
            { val: pendingReports.length,     lbl: 'Signalements en attente' },
            { val: stats.totalReports ?? '—', lbl: 'Total signalements' },
          ].map((s, i) => (
            <div key={i} className="adm-stat">
              <div className="adm-stat-val">{s.val}</div>
              <div className="adm-stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="adm-tabs">
          <div className={`adm-tab${tab === 'reports' ? ' active' : ''}`} onClick={() => setTab('reports')}>
            🚩 Signalements {pendingReports.length > 0 && `(${pendingReports.length})`}
          </div>
          <div className={`adm-tab${tab === 'circles' ? ' active' : ''}`} onClick={() => setTab('circles')}>
            🌱 Graines ({circles.length})
          </div>
          <div className={`adm-tab${tab === 'applications' ? ' active' : ''}`} onClick={() => setTab('applications')}>
            🌿 Animateurs {applications.length > 0 && `(${applications.length})`}
          </div>
          <div className={`adm-tab${tab === 'lumens' ? ' active' : ''}`} onClick={() => setTab('lumens')}>
            ✦ Lumens
          </div>
        </div>

        {/* ── SIGNALEMENTS ── */}
        {tab === 'reports' && (
          <div className="adm-section">
            {loading ? (
              <div className="adm-empty">Chargement…</div>
            ) : pendingReports.length === 0 ? (
              <div className="adm-empty">✅ Aucun signalement en attente</div>
            ) : (
              <div className="adm-grid">
                {pendingReports.map(r => (
                  <div key={r.id} className="adm-report-card">
                    <div className="adm-report-flag">🚩</div>
                    <div className="adm-report-body">
                      <div className="adm-report-graine">
                        {r.circles?.name ?? 'Graine inconnue'}
                        <span style={{ marginLeft:8, fontSize:10, color:'var(--text3)' }}>{r.circles?.theme}</span>
                      </div>
                      <div className="adm-report-meta">
                        Signalé par {r.reporter?.display_name ?? r.reporter?.email ?? 'anonyme'} · {new Date(r.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })}
                      </div>
                      <div className="adm-report-actions">
                        <button className="adm-btn danger" onClick={() => handleDeleteFromReport(r)}>
                          🗑️ Supprimer la graine
                        </button>
                        <button className="adm-btn success" onClick={() => handleResolveReport(r.id)}>
                          ✓ Marquer résolu
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resolvedReports.length > 0 && (
              <div style={{ marginTop:32 }}>
                <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>Signalements résolus</div>
                <div className="adm-grid">
                  {resolvedReports.map(r => (
                    <div key={r.id} className="adm-report-card resolved">
                      <div className="adm-report-flag">✅</div>
                      <div className="adm-report-body">
                        <div className="adm-report-graine">{r.circles?.name ?? 'Graine supprimée'}</div>
                        <div className="adm-report-meta">Résolu · {new Date(r.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── GRAINES ── */}
        {tab === 'circles' && (
          <div className="adm-section">
            {loading ? (
              <div className="adm-empty">Chargement…</div>
            ) : (
              <table className="adm-table">
                <thead>
                  <tr>
                    <th className="adm-th">Nom</th>
                    <th className="adm-th">Thème</th>
                    <th className="adm-th">Membres</th>
                    <th className="adm-th">Visibilité</th>
                    <th className="adm-th">Expiration</th>
                    <th className="adm-th">Créée le</th>
                    <th className="adm-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {circles.map(c => {
                    const expired = c.expires_at && new Date(c.expires_at) < new Date()
                    const remaining = c.expires_at ? Math.ceil((new Date(c.expires_at) - Date.now()) / 86400000) : null
                    return (
                      <tr key={c.id} className="adm-tr">
                        <td className="adm-td" style={{ color: expired ? 'var(--text3)' : 'var(--text)', maxWidth:200 }}>{c.name}</td>
                        <td className="adm-td">{c.theme ?? '—'}</td>
                        <td className="adm-td">{c.memberCount}</td>
                        <td className="adm-td">{c.is_open ? '🌍 Public' : '🔒 Privé'}</td>
                        <td className="adm-td" style={{ color: expired ? 'rgba(210,80,80,0.7)' : remaining !== null && remaining <= 2 ? 'rgba(255,160,100,0.8)' : 'var(--text3)' }}>
                          {expired ? 'Expirée' : remaining !== null ? `${remaining}j` : '—'}
                        </td>
                        <td className="adm-td">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                        <td className="adm-td">
                          <button className="adm-btn danger" onClick={() => handleDeleteCircle(c.id, c.name)}>Supprimer</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── ANIMATEURS ── */}
        {tab === 'applications' && (
          <div className="adm-section">
            {loading ? (
              <div className="adm-empty">Chargement…</div>
            ) : applications.length === 0 ? (
              <div className="adm-empty">Aucune candidature pour l'instant.</div>
            ) : (
              <>
                {pendingApplications.length > 0 && (
                  <div style={{ marginBottom:24 }}>
                    <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>
                      En attente · {pendingApplications.length}
                    </div>
                    <div className="adm-grid">
                      {pendingApplications.map(a => (
                        <div key={a.id} className="adm-report-card">
                          <div className="adm-report-flag">🌿</div>
                          <div className="adm-report-body">
                            <div className="adm-report-graine">
                              {a.user?.display_name ?? a.user?.email ?? a.user_id?.slice(0,8)}
                              <span style={{ marginLeft:8, fontSize:10, color:'var(--text3)' }}>{a.user?.email}</span>
                            </div>
                            <div className="adm-report-meta">
                              Candidature du {new Date(a.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long' })}
                            </div>
                            {a.motivation && (
                              <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6, marginBottom:8, fontStyle:'italic' }}>
                                "{a.motivation}"
                              </div>
                            )}
                            {a.experience && (
                              <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.5, marginBottom:10 }}>
                                Expérience : {a.experience}
                              </div>
                            )}
                            <div className="adm-report-actions">
                              <button className="adm-btn success" onClick={() => handleApproveAnimator(a.id, a.user_id)}>
                                ✅ Valider
                              </button>
                              <button className="adm-btn danger" onClick={() => handleRejectAnimator(a.id)}>
                                ✕ Refuser
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {applications.filter(a => a.status === 'approved' || a.status === 'rejected').length > 0 && (
                  <div>
                    <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>
                      Traitées
                    </div>
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th className="adm-th">Candidat</th>
                          <th className="adm-th">Email</th>
                          <th className="adm-th">Date</th>
                          <th className="adm-th">Statut</th>
                          <th className="adm-th">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.filter(a => a.status === 'approved' || a.status === 'rejected').map(a => (
                          <tr key={a.id} className="adm-tr">
                            <td className="adm-td">{a.user?.display_name ?? a.user_id?.slice(0,8)}</td>
                            <td className="adm-td" style={{ color:'var(--text3)' }}>{a.user?.email ?? '—'}</td>
                            <td className="adm-td">{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                            <td className="adm-td">
                              <span style={{
                                fontSize:10, padding:'3px 10px', borderRadius:100,
                                background: a.status === 'approved' ? 'var(--green3)' : 'var(--red2)',
                                border: `1px solid ${a.status === 'approved' ? 'var(--greenT)' : 'var(--redT)'}`,
                                color: a.status === 'approved' ? '#c8f0b8' : 'rgba(255,160,160,0.9)',
                              }}>
                                {a.status === 'approved' ? '✅ Validé' : '✕ Refusé'}
                              </span>
                            </td>
                            <td className="adm-td">
                              {a.status === 'approved' && (
                                <button className="adm-btn danger" onClick={() => handleRejectAnimator(a.id)}>
                                  Révoquer
                                </button>
                              )}
                              {a.status === 'rejected' && (
                                <button className="adm-btn success" onClick={() => handleApproveAnimator(a.id, a.user_id)}>
                                  Valider
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── LUMENS ── */}
        {tab === 'lumens' && (
          <div className="adm-section">
            {/* Attribution */}
            <div style={{ background:'rgba(246,196,83,0.06)', border:'1px solid rgba(246,196,83,0.2)', borderRadius:12, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:13, color:'#F6C453', fontFamily:'Cormorant Garamond,serif', marginBottom:14 }}>✦ Attribuer des Lumens</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                <select value={lumenAward.userId} onChange={e=>setLumenAward(p=>({...p,userId:e.target.value}))} style={{ flex:2, minWidth:160, padding:'8px 10px', background:'#1e3a1e', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, fontSize:11, color:'#f2ede0', fontFamily:'Jost,sans-serif' }}>
                  <option value="">— Choisir un utilisateur —</option>
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.display_name ?? u.email}</option>)}
                </select>
                <input type="number" placeholder="Lumens" value={lumenAward.amount} onChange={e=>setLumenAward(p=>({...p,amount:e.target.value}))} style={{ width:90, padding:'8px 10px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, fontSize:11, color:'#f2ede0', fontFamily:'Jost,sans-serif' }} />
                <select value={lumenAward.reason} onChange={e=>setLumenAward(p=>({...p,reason:e.target.value}))} style={{ padding:'8px 10px', background:'#1e3a1e', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, fontSize:11, color:'#f2ede0', fontFamily:'Jost,sans-serif' }}>
                  <option value="participation">Participation validée (+3)</option>
                  <option value="ritual">Rituel complété (+2)</option>
                  <option value="questionnaire_daily">Questionnaire (+1)</option>
                  <option value="streak_7">Streak 7 jours (+5)</option>
                  <option value="streak_30">Streak 30 jours (+15)</option>
                  <option value="admin_award">Attribution admin</option>
                </select>
                <button onClick={handleAwardLumens} style={{ padding:'8px 18px', background:'rgba(246,196,83,0.15)', border:'1px solid rgba(246,196,83,0.35)', borderRadius:8, color:'#F6C453', fontSize:12, cursor:'pointer', fontFamily:'Jost,sans-serif', whiteSpace:'nowrap' }}>
                  ✦ Attribuer
                </button>
              </div>
            </div>

            {/* Classement utilisateurs */}
            <div style={{ fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(242,237,224,0.4)', marginBottom:10 }}>Classement des membres</div>
            {lumensData.length === 0 ? (
              <div className="adm-empty">Aucun Lumen attribué pour l'instant. Utilisez le formulaire ci-dessus pour commencer.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {lumensData.map((l, i) => (
                  <div key={l.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'rgba(246,196,83,0.04)', border:'1px solid rgba(246,196,83,0.12)', borderRadius:10 }}>
                    <div style={{ fontSize:16, fontFamily:'Cormorant Garamond,serif', color:'rgba(246,196,83,0.4)', width:24, textAlign:'center' }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:'#f2ede0' }}>{l.users?.display_name ?? l.users?.email ?? l.user_id?.slice(0,8)}</div>
                      <div style={{ fontSize:9, color:'rgba(242,237,224,0.4)', textTransform:'uppercase', letterSpacing:'.05em', marginTop:2 }}>{l.level === 'faible' ? 'Lumière faible' : l.level === 'halo' ? 'Halo visible' : l.level === 'aura' ? 'Aura douce' : 'Rayonnement actif'}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:16, fontFamily:'Cormorant Garamond,serif', color:'#F6C453' }}>{l.total} ✦</div>
                      <div style={{ fontSize:9, color:'rgba(242,237,224,0.35)' }}>{l.available} disponibles</div>
                    </div>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#F6C453', boxShadow:`0 0 ${l.total >= 200 ? 12 : l.total >= 80 ? 8 : l.total >= 20 ? 4 : 2}px rgba(246,196,83,0.6)` }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  )
}
