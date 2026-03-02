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
  const [stats,     setStats]     = useState({})
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState(null)

  const isAdmin = ADMIN_IDS.includes(user?.id)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2800) }

  useEffect(() => { if (isAdmin) { loadAll() } }, [isAdmin])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadReports(), loadCircles(), loadStats()])
    setLoading(false)
  }

  async function loadReports() {
    const { data: reps, error } = await supabase
      .from('reports')
      .select('id, reason, created_at, resolved, circle_id, reported_by')
      .order('created_at', { ascending: false })
      .limit(50)
    if (!reps?.length) { setReports([]); return }

    // Charger les noms des graines
    const circleIds = [...new Set(reps.map(r => r.circle_id).filter(Boolean))]
    const { data: circlesData } = await supabase
      .from('circles').select('id, name, theme').in('id', circleIds)
    const circleMap = Object.fromEntries((circlesData ?? []).map(c => [c.id, c]))

    // Charger les noms des reporters
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
      </div>

      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  )
}
