import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { supabase } from '../core/supabaseClient'
import { ADMIN_IDS } from './AdminPage'
import { useIsMobile } from './dashboardShared'

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
  --zone-roots:#C8894A;--zone-stem:#5AAF78;--zone-leaves:#4A9E5C;--zone-flowers:#D4779A;--zone-breath:#6ABBE4;
}
.adm-root{font-family:'Jost',sans-serif;background:#2b2f33!important;min-height:100vh;width:100vw;color:#ffffff!important;display:flex;flex-direction:column}.adm-root *{color:#ffffff!important;font-size:clamp(13px,3vw,18px)!important}
.adm-topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 40px;border-bottom:1px solid var(--border2);background:#353a3f!important;backdrop-filter:blur(10px);position:sticky;top:0;z-index:10}
.adm-logo{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:300;letter-spacing:.05em;color:#ffffff}
.adm-logo em{font-style:italic;color:var(--green)}
.adm-body{flex:1;padding:32px 40px;width:100%}
.adm-section{margin-bottom:32px}
.adm-empty{font-size:18px;color:rgba(255,255,255,0.55);font-style:italic;padding:28px;text-align:center;background:#3d4248;border-radius:12px;border:1px dashed var(--border2)}
.adm-counter{margin-bottom:32px;background:#0e0e0e;border-radius:24px;border:4px solid #2a2a2a;box-shadow:0 0 60px rgba(0,0,0,0.9),inset 0 0 80px rgba(0,0,0,0.6);position:relative;overflow:hidden;display:flex;align-items:stretch;justify-content:stretch}
.adm-counter-screen{background:#050505;border-radius:20px;margin:12px;flex:1;display:flex;align-items:center;justify-content:center;border:2px solid #1a1a1a;box-shadow:inset 0 4px 60px rgba(0,0,0,0.99),0 0 60px rgba(200,30,30,0.15);padding:clamp(16px,4vw,60px)}
.adm-counter-num{font-family:'Courier New',monospace!important;font-size:clamp(80px,12vw,200px)!important;font-weight:900!important;color:#ff2200!important;line-height:1!important;letter-spacing:.06em!important;text-shadow:0 0 15px rgba(255,40,0,1),0 0 50px rgba(255,40,0,0.6),0 0 100px rgba(255,40,0,0.25)!important;white-space:nowrap}
.adm-counter-num .ghost{color:rgba(130,8,0,0.22)!important;text-shadow:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important}
.adm-counter-num .lit{color:#ff2200!important;text-shadow:0 0 15px rgba(255,40,0,1),0 0 50px rgba(255,40,0,0.6),0 0 100px rgba(255,40,0,0.25)!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important}
.adm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:32px}
.adm-stat{background:#3d4248;border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:20px 24px;display:flex;flex-direction:column;gap:6px}
.adm-stat-card{background:#3d4248;border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:16px 20px;display:flex;flex-direction:column;gap:4px;min-width:160px}
.adm-stat-val{font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:300;color:#ffffff;line-height:1}
.adm-stat-lbl{font-size:18px;color:rgba(255,255,255,0.55);letter-spacing:.08em;text-transform:uppercase}
.adm-tabs{display:flex;gap:0;margin-bottom:24px;border-bottom:1px solid var(--border2)}
.adm-tab{padding:10px 24px;font-size:18px;letter-spacing:.08em;color:rgba(255,255,255,0.55);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .2s}
.adm-tab.active{color:#c8f0b8;border-bottom-color:var(--green)}
.adm-table{width:100%;border-collapse:collapse;background:#3d4248;border-radius:12px;overflow:hidden;border:1px solid var(--border2)}
.adm-th{font-size:18px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,0.55);padding:12px 16px;text-align:left;background:#454b52;border-bottom:1px solid var(--border2)}
.adm-td{font-size:18px;color:rgba(255,255,255,0.85);padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.03);vertical-align:middle}
.adm-tr:last-child .adm-td{border-bottom:none}
.adm-tr:hover .adm-td{background:rgba(255,255,255,0.02)}
.adm-btn{padding:7px 16px;border-radius:8px;font-size:18px;letter-spacing:.06em;cursor:pointer;border:none;font-family:'Jost',sans-serif;transition:all .2s;white-space:nowrap}
.adm-btn.ghost{background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.20);color:#ffffff}
.adm-btn.ghost:hover{background:rgba(255,255,255,0.12);color:var(--text)}
.adm-toast{position:fixed;bottom:24px;right:24px;background:#3e444a!important;border:1px solid var(--greenT);border-radius:10px;padding:10px 20px;font-size:18px;color:#ffffff;z-index:999;animation:fadeInUp .3s ease}
@keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:700px){
  .adm-topbar{padding:10px 16px;gap:8px;flex-wrap:wrap}
  .adm-logo{font-size:16px;flex:1}
  .adm-body{padding:12px 12px}
  .adm-stats{grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
  .adm-stat{padding:12px 14px}
  .adm-stat-val{font-size:clamp(24px,7vw,38px)!important}
  .adm-stat-lbl{font-size:11px!important}
  .adm-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap;gap:0;padding-bottom:0;scrollbar-width:none}
  .adm-tabs::-webkit-scrollbar{display:none}
  .adm-tab{padding:8px 12px;white-space:nowrap;flex-shrink:0}
  .adm-table{font-size:12px!important}
  .adm-th{padding:8px 10px;font-size:10px!important}
  .adm-td{padding:8px 10px;font-size:12px!important}
  .adm-btn{padding:6px 12px;font-size:12px!important}
  .adm-section{overflow-x:auto}
  .adm-counter-num{font-size:clamp(52px,15vw,200px)!important}
}
@media(max-width:400px){
  .adm-stats{grid-template-columns:1fr}
  .adm-body{padding:10px 8px}
  .adm-topbar{padding:8px 10px}
}
`

// ── Navigation partagée ────────────────────────────────────────────────────
function AdminNav({ current }) {
  const navItems = [
    { hash: '#admin',    label: 'Admin',    icon: '🛡' },
    { hash: '#clients',  label: 'Clients',  icon: '👥' },
    { hash: '#activite',      label: 'Activité',      icon: '🌿' },
    { hash: '#jardinotheque', label: 'Jardinothèque', icon: '🌿' },
    { hash: '#pros',          label: 'Pros',          icon: '💼' },
  ]
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {navItems.map(({ hash, label, icon }) => {
        const active = current === hash
        return (
          <a key={hash} href={hash}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, letterSpacing: '.06em', textDecoration: 'none', fontFamily: "'Jost',sans-serif", transition: 'all .2s', background: active ? 'rgba(150,212,133,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${active ? 'rgba(150,212,133,0.4)' : 'rgba(255,255,255,0.10)'}`, color: active ? '#c8f0b8' : 'rgba(242,237,224,0.55)' }}>
            {icon} {label}
          </a>
        )
      })}
    </div>
  )
}

// ── Accordéon détail utilisateurs ─────────────────────────────────────────
function FunnelUserDetail({ users }) {
  const [open, setOpen] = useState(false)
  const sorted = [...users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, marginTop: 4 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', padding: '4px 0' }}
      >
        <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'Jost,sans-serif' }}>
          Détail par utilisateur · {sorted.length}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</div>
      </div>

      {open && (
        <div style={{ marginTop: 14, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Jost,sans-serif' }}>
            <thead>
              <tr>
                {['Utilisateur', 'Inscrit le', 'Onb.', 'J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'Plan', '🔔', '📲'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Utilisateur' ? 'left' : 'center', padding: '6px 8px', fontSize: 9, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((u, i) => {
                const completedDays = (u.completedDays ?? []).map(Number)
                return (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    {/* Nom + Fleur */}
                    <td style={{ padding: '7px 8px', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 11 }}>
                      {u.display_name || u.email || u.id.slice(0, 8)}
                      {u.flower_name && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: 'rgba(200,160,180,0.7)' }}>
                          · {u.flower_name}
                        </span>
                      )}
                    </td>
                    {/* Date inscription */}
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: 'var(--text3)', whiteSpace: 'nowrap', fontSize: 10 }}>
                      {new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </td>
                    {/* Onboarding */}
                    <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                      {u.onboarding_completed
                        ? <span style={{ color: '#a78bf5', fontSize: 14 }}>✓</span>
                        : <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 11 }}>·</span>}
                    </td>
                    {/* J1 → J7 cumulatif : ✓ si ce jour OU un jour supérieur a été complété */}
                    {[1,2,3,4,5,6,7].map(j => {
                      const done = completedDays.some(d => d >= j)
                      return (
                        <td key={j} style={{ padding: '7px 8px', textAlign: 'center' }}>
                          {done
                            ? <span style={{ color: '#78c85e', fontSize: 14 }}>✓</span>
                            : <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 11 }}>·</span>}
                        </td>
                      )
                    })}
                    {/* Plan */}
                    <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 9, padding: '2px 7px', borderRadius: 100,
                        background: u.plan === 'premium' ? 'rgba(246,196,83,0.12)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${u.plan === 'premium' ? 'rgba(246,196,83,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        color: u.plan === 'premium' ? '#F6C453' : 'var(--text3)',
                      }}>
                        {u.plan ?? 'free'}
                      </span>
                    </td>
                    {/* Notifications push */}
                    <td style={{ padding: '7px 8px', textAlign: 'center' }} title={u.has_push ? 'Notifications activées' : 'Pas de notifications'}>
                      {u.has_push
                        ? <span style={{ color: '#78c85e', fontSize: 13 }}>✓</span>
                        : <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 11 }}>·</span>}
                    </td>
                    {/* Installation PWA */}
                    <td style={{ padding: '7px 8px', textAlign: 'center' }} title={u.pwa_installed_at ? `Installé le ${new Date(u.pwa_installed_at).toLocaleDateString('fr-FR')}` : 'Appli non installée'}>
                      {u.pwa_installed_at
                        ? <span style={{ color: '#78c85e', fontSize: 13 }}>✓</span>
                        : <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 11 }}>·</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Statistiques post-J7 ─────────────────────────────────────────────────
function TabStatistiques({ funnelUsers }) {
  const isMobile = useIsMobile()
  const [period, setPeriod] = useState(30)
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  const PERIODS = [
    { val: 0,  label: "Aujourd'hui" },
    { val: 7,  label: '7j' },
    { val: 15, label: '15j' },
    { val: 30, label: '30j' },
    { val: 60, label: '60j' },
    { val: 90, label: '90j' },
  ]

  useEffect(() => {
    const j7Ids = funnelUsers
      .filter(u => (u.completedDays ?? []).some(d => Number(d) >= 7))
      .map(u => u.id)
    load(j7Ids)
  }, [period, funnelUsers.length])

  async function load(j7Ids) {
    setLoading(true)
    if (j7Ids.length === 0) { setData(null); setLoading(false); return }

    const today   = new Date().toISOString().slice(0, 10)
    const ago     = n => new Date(Date.now() - n * 86400000)
    const fromDate = period === 0 ? today : ago(period - 1).toISOString().slice(0, 10)
    const fromISO  = fromDate + 'T00:00:00'
    const dates    = period === 0
      ? [today]
      : Array.from({ length: period }, (_, i) => ago(period - 1 - i).toISOString().slice(0, 10))

    const [{ data: eventsData }] =
      await Promise.all([
        supabase.from('analytics_events').select('user_id, event_type, page, created_at').in('user_id', j7Ids).gte('created_at', fromISO),
      ])

    // ── Visiteurs de slides par jour (basé sur page_view)
    const visitorsByDay = Object.fromEntries(dates.map(d => [d, new Set()]))
    ;(eventsData ?? []).forEach(r => {
      if (r.event_type !== 'page_view' || !r.page) return
      const d = r.created_at.slice(0, 10)
      if (visitorsByDay[d]) visitorsByDay[d].add(r.user_id)
    })
    const dailyActive = dates.map(d => ({ date: d, count: visitorsByDay[d].size }))

    // ── Utilisateurs uniques par slide (page_view events, champ page = slide id)
    const SLIDE_DEFS = [
      { key: 'bilan',        label: 'Bilan',              icon: '🌅', color: '#d49040', verb: 'ont ouvert le bilan' },
      { key: 'jardin',       label: 'Ma Fleur',           icon: '🌸', color: '#b090c8', verb: 'ont visité Ma Fleur' },
      { key: 'champ',        label: 'Jardin Collectif',   icon: '🌼', color: '#c8a040', verb: 'ont visité le Jardin Collectif' },
      { key: 'defis',        label: 'Défis',              icon: '✨', color: '#9080c0', verb: 'ont visité les Défis' },
      { key: 'club',         label: 'Club des Jardiniers',icon: '👥', color: '#6898c0', verb: 'ont visité le Club' },
      { key: 'ateliers',     label: 'Ateliers',           icon: '📘', color: '#60a870', verb: 'ont visité les Ateliers' },
      { key: 'jardinotheque',label: 'Jardinothèque',      icon: '🌿', color: '#5890a0', verb: 'ont visité la Jardinothèque' },
      { key: 'boite_graine', label: 'Boîte à Graines',   icon: '🌱', color: '#4a8060', verb: 'ont ouvert la Boîte à Graines' },
    ]

    // Grouper les page_view par slide
    const slideUserMap = {}
    ;(eventsData ?? []).forEach(r => {
      if (r.event_type !== 'page_view' || !r.page) return
      if (!slideUserMap[r.page]) slideUserMap[r.page] = new Set()
      slideUserMap[r.page].add(r.user_id)
    })

    const sections = SLIDE_DEFS.map(s => {
      const count = slideUserMap[s.key]?.size ?? 0
      return {
        ...s,
        count,
        pctOfJ7: j7Ids.length > 0 ? Math.round((count / j7Ids.length) * 100) : 0,
      }
    }).sort((a, b) => b.count - a.count)

    const totalSessions  = (eventsData ?? []).filter(r => r.event_type === 'session_start').length
    // Visiteurs = J7 users ayant visité au moins un slide sur la période
    const slideVisitors  = new Set(
      (eventsData ?? []).filter(r => r.event_type === 'page_view' && r.page).map(r => r.user_id)
    )

    setData({
      j7Count:           j7Ids.length,
      slideVisitors:     slideVisitors.size,
      retentionRate:     j7Ids.length > 0 ? Math.round((slideVisitors.size / j7Ids.length) * 100) : 0,
      totalSessions,
      sessionsPerVisitor: slideVisitors.size > 0 ? (totalSessions / slideVisitors.size).toFixed(1) : '–',
      dailyActive,
      sections,
    })
    setLoading(false)
  }

  if (loading) return <div className="adm-empty">Chargement…</div>
  if (!data)   return <div className="adm-empty">Aucun utilisateur n'a encore terminé les 7 jours.</div>

  const maxDaily = Math.max(...data.dailyActive.map(d => d.count), 1)
  const periodLbl = PERIODS.find(p => p.val === period)?.label ?? `${period}j`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Sélecteur période ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {PERIODS.map(p => (
          <button key={p.val} onClick={() => setPeriod(p.val)}
            style={{ padding: '6px 16px', borderRadius: 100, fontSize: 11, cursor: 'pointer', fontFamily: "'Jost',sans-serif",
              background: period === p.val ? 'rgba(150,212,133,0.18)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${period === p.val ? 'rgba(150,212,133,0.40)' : 'rgba(255,255,255,0.09)'}`,
              color: period === p.val ? '#c8f0b8' : 'var(--text3)', transition: 'all .18s' }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Bloc 1 : Vue d'ensemble de la période ── */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border2)', borderRadius: 16, padding: isMobile ? '16px' : '22px 26px' }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 18 }}>
          Activité · {periodLbl}
        </div>

        {/* 3 KPIs fiables */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10, marginBottom: period > 0 ? 20 : 0 }}>
          {[
            { lbl: 'Ont terminé J7',  val: data.j7Count,            color: 'rgba(255,255,255,0.75)', sub: 'base totale des utilisateurs' },
            { lbl: `Ont ouvert l'app · ${periodLbl}`, val: data.slideVisitors, color: '#7ab5f5', sub: `${data.retentionRate}% de retour` },
            { lbl: 'Sessions · total',val: data.totalSessions,       color: '#b4a0f0',               sub: `moy. ${data.sessionsPerVisitor} par personne` },
          ].map((k, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 28 : 36, fontWeight: 300, color: k.color, lineHeight: 1, marginBottom: 6 }}>{k.val}</div>
              <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 500, marginBottom: 2 }}>{k.lbl}</div>
              <div style={{ fontSize: 9, color: 'var(--text3)' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Courbe actifs / jour (masquée pour "aujourd'hui") */}
        {period > 0 && (
          <>
            <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>Ouvertures de l'app · par jour</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: period > 30 ? 1 : 2, height: 56 }}>
              {data.dailyActive.map((d, i) => {
                const h = Math.max(3, Math.round((d.count / maxDaily) * 100))
                const isToday = d.date === new Date().toISOString().slice(0, 10)
                const lbl = new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                return (
                  <div key={i} title={`${lbl} : ${d.count} actif${d.count > 1 ? 's' : ''}`}
                    style={{ flex: 1, height: `${h}%`, minHeight: 3, borderRadius: '2px 2px 0 0',
                      background: isToday ? '#96d485' : 'rgba(150,212,133,0.28)',
                      boxShadow: isToday ? '0 0 8px rgba(150,212,133,0.45)' : 'none' }} />
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
              <span>−{period - 1}j</span>
              <span style={{ color: '#96d485' }}>aujourd'hui</span>
            </div>
          </>
        )}
      </div>

      {/* ── Bloc 2 : Qui fait quoi ? ── */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border2)', borderRadius: 16, padding: isMobile ? '16px' : '22px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.14em', textTransform: 'uppercase', flex: 1 }}>
            Visites par slide · {periodLbl}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>sur {data.j7Count} utilisateurs J7</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
          {data.sections.map(s => {
            const pct = s.pctOfJ7
            const pctColor = pct >= 60 ? '#96d485' : pct >= 30 ? s.color : '#e8c060'
            return (
              <div key={s.key} style={{ padding: '14px 16px', borderRadius: 14,
                background: `linear-gradient(145deg, ${s.color}08 0%, rgba(255,255,255,0.02) 100%)`,
                border: `1px solid ${s.color}22` }}>

                {/* En-tête */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                  <span style={{ fontSize: 15 }}>{s.icon}</span>
                  <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>{s.label}</span>
                </div>

                {/* Nombre + % côte à côte */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 38, fontWeight: 300, color: s.color, lineHeight: 1 }}>{s.count}</div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 3 }}>personnes</div>
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: pctColor, lineHeight: 1, textAlign: 'right' }}>
                    {pct}%
                  </div>
                </div>

                {/* Barre unique */}
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 2, transition: 'width .5s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Note ── */}
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', padding: '10px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.07)', lineHeight: 1.8 }}>
        💡 Les données proviennent des événements <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3, fontSize: 9 }}>page_view</code> tracés dans DashboardV2 à chaque changement de slide. Les données historiques (avant le déploiement de ce tracking) apparaîtront à 0.
      </div>
    </div>
  )
}

// ── Questionnaires QCM ────────────────────────────────────────────────────
function TabQCM() {
  const [rows,      setRows]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [filter,    setFilter]    = useState('tous')
  const [analysis,  setAnalysis]  = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [anaError,  setAnaError]  = useState(null)

  const TAG_LABELS = {
    contexte:   '🧭 Votre situation',
    besoin:     '🌱 Votre vécu',
    univers:    "🌸 L'univers de l'appli",
    pertinence: '✨ Ce que ça vous apporte',
    valeur:     '💰 La valeur perçue',
    projection: '🌿 Et maintenant…',
    verbatim:   '💬 Votre ressenti',
  }

  useEffect(() => {
    supabase
      .from('quiz_responses')
      .select('user_id, quiz_completed_at, tag, question, answer')
      .order('quiz_completed_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) { setError(err.message) } else { setRows(data ?? []) }
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return <div className="adm-empty">Chargement…</div>
  if (error)   return <div className="adm-empty" style={{ color: 'var(--red)' }}>⚠️ Erreur Supabase : {error}</div>
  if (rows.length === 0) return <div className="adm-empty">Aucun questionnaire complété pour l'instant.</div>

  const uniqueUsers = new Set(rows.map(r => r.user_id)).size
  const byQuestion = {}
  rows.forEach(r => {
    if (!r.question) return
    if (!byQuestion[r.question]) byQuestion[r.question] = { tag: r.tag, question: r.question, counts: {} }
    const ans = r.answer ?? '(sans réponse)'
    byQuestion[r.question].counts[ans] = (byQuestion[r.question].counts[ans] ?? 0) + 1
  })
  const questions = Object.values(byQuestion).filter(q => filter === 'tous' || q.tag === filter)
  const total = uniqueUsers

  async function generateAnalysis() {
    setAnalyzing(true); setAnaError(null); setAnalysis(null)
    const summary = Object.values(byQuestion).map(q => {
      const entries = Object.entries(q.counts).sort((a, b) => b[1] - a[1])
      const topAnswers = entries.slice(0, 4).map(([ans, count]) =>
        `  - "${ans}" : ${count} réponse(s) (${Math.round((count / total) * 100)}%)`
      ).join('\n')
      return `[${q.tag.toUpperCase()}] ${q.question}\n${topAnswers}`
    }).join('\n\n')
    try {
      const { data, error } = await supabase.functions.invoke('analyze-quiz', {
        body: { summary, totalUsers: total, totalResponses: rows.length },
      })
      if (error) throw new Error(error.message)
      if (!data?.analysis) throw new Error("Réponse vide de l'Edge Function")
      setAnalysis(data.analysis)
    } catch (e) { setAnaError(e.message) }
    setAnalyzing(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        {[
          { lbl: 'Questionnaires complétés', val: total },
          { lbl: 'Réponses collectées',      val: rows.length },
          { lbl: 'Questions analysées',      val: Object.keys(byQuestion).length },
        ].map(s => (
          <div key={s.lbl} className="adm-stat-card">
            <div className="adm-stat-val">{s.val}</div>
            <div className="adm-stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <button onClick={generateAnalysis} disabled={analyzing || rows.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 22px', borderRadius: 10, border: 'none', background: analyzing ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#4a7a8a,#2a5a6a)', color: analyzing ? 'var(--text3)' : 'var(--cream)', fontSize: 13, fontWeight: 500, letterSpacing: '.04em', fontFamily: "'Jost',sans-serif", cursor: analyzing || rows.length === 0 ? 'default' : 'pointer', boxShadow: analyzing ? 'none' : '0 4px 16px rgba(40,80,100,0.35)', transition: 'all .2s' }}>
          {analyzing ? '⏳ Analyse en cours…' : "🤖 Générer l'analyse stratégique"}
        </button>
        {anaError && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--red)', fontFamily: "'Jost',sans-serif" }}>⚠️ {anaError}</div>}
        {analysis && (
          <div style={{ marginTop: 16, padding: '24px 28px', background: 'rgba(74,122,138,0.08)', border: '1px solid rgba(74,122,138,0.25)', borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🤖</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: "'Jost',sans-serif" }}>Analyse stratégique — Claude</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'Jost',sans-serif" }}>Basée sur {total} questionnaire(s) · {rows.length} réponses</div>
                </div>
              </div>
              <button onClick={() => setAnalysis(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, padding: '4px 8px' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, lineHeight: 1.8, color: 'var(--text2)' }}>
              {analysis.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <div key={i} style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 400, color: 'var(--text)', margin: '20px 0 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6 }}>{line.replace('## ', '')}</div>
                if (line.startsWith('- ') || line.startsWith('• ')) return <div key={i} style={{ paddingLeft: 16, marginBottom: 4, color: 'var(--text2)' }}>· {line.slice(2)}</div>
                if (line.trim() === '') return <div key={i} style={{ height: 8 }} />
                return <div key={i} style={{ marginBottom: 4 }}>{line}</div>
              })}
            </div>
          </div>
        )}
      </div>

      <div className="adm-tabs" style={{ marginBottom: 20 }}>
        {['tous', 'contexte', 'besoin', 'univers', 'pertinence', 'valeur', 'projection', 'verbatim'].map(f => (
          <div key={f} className={`adm-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'tous' ? '📋 Tous' : TAG_LABELS[f]}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {questions.map((q, qi) => {
          const entries = Object.entries(q.counts).sort((a, b) => b[1] - a[1])
          const max = entries[0]?.[1] ?? 1
          return (
            <div key={qi} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border2)', borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 6 }}>{TAG_LABELS[q.tag] ?? q.tag}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 400, color: 'var(--text)', marginBottom: 14, lineHeight: 1.4 }}>{q.question}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {entries.map(([ans, count], i) => {
                  const pct = Math.round((count / total) * 100)
                  const isTop = i === 0
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: isTop ? 'var(--text)' : 'var(--text2)', fontWeight: isTop ? 500 : 300, fontFamily: "'Jost',sans-serif", flex: 1, paddingRight: 12 }}>{ans}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'Jost',sans-serif", whiteSpace: 'nowrap' }}>{count} · {pct}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 100, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 100, width: `${(count / max) * 100}%`, background: isTop ? 'linear-gradient(90deg, #78c088, #48a868)' : 'rgba(255,255,255,0.18)', transition: 'width .4s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
//  TabAvisClients — avis des ateliers avec modération
// ═══════════════════════════════════════════════════════════
function TabAvisClients({ onPendingCount }) {
  const [avis,      setAvis]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editText,  setEditText]  = useState('')
  const [saving,    setSaving]    = useState(false)

  const load = async () => {
    setLoading(true)
    const { data: reviews } = await supabase
      .from('app_reviews')
      .select('id, user_id, rating, comment, display_name, status, created_at')
      .order('created_at', { ascending: false })

    if (!reviews?.length) { setAvis([]); setLoading(false); onPendingCount?.(0); return }

    const userIds = [...new Set(reviews.map(r => r.user_id))]
    const { data: users } = await supabase
      .from('users').select('id, email').in('id', userIds)
    const emailMap = Object.fromEntries((users ?? []).map(u => [u.id, u.email ?? '']))

    const mapped = reviews.map(r => ({
      ...r,
      reviewerName:  r.display_name || 'Anonyme',
      reviewerEmail: emailMap[r.user_id] ?? '',
    }))
    setAvis(mapped)
    onPendingCount?.(mapped.filter(a => a.status === 'pending').length)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const moderate = async (id, status) => {
    await supabase.from('app_reviews').update({ status }).eq('id', id)
    setAvis(prev => {
      const next = prev.map(a => a.id === id ? { ...a, status } : a)
      onPendingCount?.(next.filter(a => a.status === 'pending').length)
      return next
    })
  }

  const saveEdit = async (id) => {
    setSaving(true)
    await supabase.from('app_reviews').update({ comment: editText }).eq('id', id)
    setAvis(prev => prev.map(a => a.id === id ? { ...a, comment: editText } : a))
    setSaving(false)
    setEditingId(null)
  }

  const filtered = filter === 'all' ? avis : avis.filter(a => a.status === filter)
  const counts   = { pending: avis.filter(a => a.status === 'pending').length, approved: avis.filter(a => a.status === 'approved').length, rejected: avis.filter(a => a.status === 'rejected').length }

  const STARS  = (n) => '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0))
  const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

  const statusStyle = {
    pending:  { bg: 'rgba(232,192,96,0.12)',  border: 'rgba(232,192,96,0.30)',  color: '#e8c060', label: '⏳ En attente' },
    approved: { bg: 'rgba(150,212,133,0.10)', border: 'rgba(150,212,133,0.25)', color: '#96d485', label: '✓ Approuvé'   },
    rejected: { bg: 'rgba(210,80,80,0.08)',   border: 'rgba(210,80,80,0.25)',   color: 'rgba(255,140,140,0.7)', label: '✕ Refusé' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['all', 'Tous', avis.length], ['pending', '⏳ En attente', counts.pending], ['approved', '✓ Approuvés', counts.approved], ['rejected', '✕ Refusés', counts.rejected]].map(([key, label, count]) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{ padding: '5px 14px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: "'Jost',sans-serif", border: filter === key ? '1px solid rgba(150,212,133,0.40)' : '1px solid rgba(255,255,255,0.08)', background: filter === key ? 'rgba(150,212,133,0.12)' : 'transparent', color: filter === key ? '#96d485' : 'rgba(242,237,224,0.40)' }}>
            {label} <span style={{ opacity: 0.6 }}>({count})</span>
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="adm-empty">Aucun avis dans cette catégorie</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(a => {
            const ss = statusStyle[a.status] || statusStyle.pending
            const isEditing = editingId === a.id
            return (
              <div key={a.id} style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: `1px solid ${a.status === 'pending' ? 'rgba(232,192,96,0.20)' : 'rgba(255,255,255,0.06)'}` }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'rgba(242,237,224,0.88)', fontWeight: 500 }}>{a.reviewerName}</div>
                    <div style={{ fontSize: 10, color: 'rgba(242,237,224,0.35)', marginTop: 3 }}>
                      {a.reviewerEmail && <span style={{ marginRight: 6 }}>{a.reviewerEmail} ·</span>}{fmtDate(a.created_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {a.rating != null && <span style={{ fontSize: 13, color: '#e8c060', letterSpacing: 1 }}>{STARS(a.rating)}</span>}
                    <span style={{ fontSize: 9, padding: '3px 10px', borderRadius: 20, background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color }}>{ss.label}</span>
                  </div>
                </div>

                {/* Commentaire — éditable si pending */}
                {isEditing ? (
                  <div style={{ marginBottom: 12 }}>
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={3}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(232,192,96,0.35)', background: 'rgba(232,192,96,0.06)', color: '#f2ede0', fontSize: 12, fontFamily: "'Jost',sans-serif", resize: 'vertical', outline: 'none', lineHeight: 1.7, boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button onClick={() => saveEdit(a.id)} disabled={saving} style={{ padding: '5px 14px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(150,212,133,0.12)', border: '1px solid rgba(150,212,133,0.35)', color: '#96d485' }}>{saving ? '…' : '✓ Enregistrer'}</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(242,237,224,0.40)' }}>Annuler</button>
                    </div>
                  </div>
                ) : (
                  a.comment && (
                    <div style={{ fontSize: 12, color: 'rgba(242,237,224,0.60)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: '2px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <span>« {a.comment} »</span>
                      {a.status === 'pending' && (
                        <button onClick={() => { setEditingId(a.id); setEditText(a.comment) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#e8c060', flexShrink: 0, padding: '0 2px' }}>✏ Modifier</button>
                      )}
                    </div>
                  )
                )}

                {/* Pas de commentaire + pending → bouton ajouter */}
                {!a.comment && a.status === 'pending' && !isEditing && (
                  <button onClick={() => { setEditingId(a.id); setEditText('') }} style={{ fontSize: 11, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'none', border: 'none', color: 'rgba(232,192,96,0.55)', marginBottom: 10, padding: 0 }}>✏ Ajouter un commentaire</button>
                )}

                {/* Actions modération */}
                {a.status === 'pending' && !isEditing && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => moderate(a.id, 'approved')} style={{ padding: '6px 16px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(150,212,133,0.12)', border: '1px solid rgba(150,212,133,0.35)', color: '#96d485' }}>✓ Approuver</button>
                    <button onClick={() => moderate(a.id, 'rejected')} style={{ padding: '6px 16px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(210,80,80,0.08)', border: '1px solid rgba(210,80,80,0.25)', color: 'rgba(255,140,140,0.7)' }}>✕ Refuser</button>
                  </div>
                )}
                {a.status !== 'pending' && (
                  <button onClick={() => moderate(a.id, 'pending')} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 10, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(242,237,224,0.35)' }}>↺ Remettre en attente</button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function AdminClientsPage() {
  useTheme()
  const { user, signOut } = useAuth()
  const isMobile = useIsMobile()

  const [tab,           setTab]           = useState('frequentation')
  const [pendingAvis,   setPendingAvis]   = useState(0)
  const [stats,         setStats]         = useState({})
  const [attendance,    setAttendance]    = useState(null)
  const [palmares,      setPalmares]      = useState([])
  const [funnel,        setFunnel]        = useState(null)
  const [funnelUsers,   setFunnelUsers]   = useState([])
  const [subStats,      setSubStats]      = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [toast,         setToast]         = useState(null)
  const [inscriptions,  setInscriptions]  = useState(null)
  const [lastRefresh,   setLastRefresh]   = useState(null)

  const isAdmin = ADMIN_IDS.includes(user?.id)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2800) }

  async function loadInscriptions() {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('id', 'in', `(${ADMIN_IDS.join(',')})`)
    setInscriptions(count)
    setLastRefresh(new Date())
  }

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    Promise.all([loadStats(), loadAttendance(), loadFunnel(), loadSubscriptions()]).finally(() => setLoading(false))
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    loadInscriptions()
    const interval = setInterval(loadInscriptions, 60000)
    return () => clearInterval(interval)
  }, [isAdmin])


  async function loadStats() {
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('id', 'in', `(${ADMIN_IDS.join(',')})`)
    setStats({ totalUsers })
  }

  async function loadSubscriptions() {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('user_id, product_id, product_name, product_icon, months, price, is_active, purchased_at, expires_at')
      if (error) { console.error('[subscriptions]', error); return }
      const rows = data ?? []
      const PLANS = [
        { key: '1 mois',         icon: '🌱', months: 1,  price: 13,  color: '#7ab5f5' },
        { key: '1 an',           icon: '✨', months: 12, price: 108, color: '#e8a020' },
        { key: '1 an solidaire', icon: '💚', months: 12, price: null, color: '#d4779a' },
      ]
      const knownKeys = PLANS.map(p => p.key)
      const plans = PLANS.map(p => {
        const matching = rows.filter(r => r.product_name === p.key)
        return { ...p, total: matching.length, actifs: matching.filter(r => r.is_active).length, ca: matching.reduce((s, r) => s + Number(r.price ?? 0), 0) }
      })
      const legacyRows = rows.filter(r => !knownKeys.includes(r.product_name) && r.product_name !== 'Inconnu')
      if (legacyRows.length > 0) {
        plans.push({ key: 'Anciens tarifs', icon: '📦', months: null, price: null, color: '#888888', total: legacyRows.length, actifs: legacyRows.filter(r => r.is_active).length, ca: legacyRows.reduce((s, r) => s + Number(r.price ?? 0), 0) })
      }
      const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(2026, 2 + i, 1)
        return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) }
      })
      const histogram = months.map(m => {
        const monthStart = new Date(m.key + '-01')
        const monthEnd   = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
        const caByPlan = {}
        PLANS.forEach(p => { caByPlan[p.key] = rows.filter(r => r.product_name === p.key && r.purchased_at && r.purchased_at.startsWith(m.key)).reduce((s, r) => s + Number(r.price ?? 0), 0) })
        const caTotal = Object.values(caByPlan).reduce((s, v) => s + v, 0)
        const actifsByPlan = {}
        PLANS.forEach(p => { actifsByPlan[p.key] = rows.filter(r => r.product_name === p.key && r.purchased_at && new Date(r.purchased_at) <= monthEnd && r.expires_at && new Date(r.expires_at) >= monthStart).length })
        const actifsTotal = Object.values(actifsByPlan).reduce((s, v) => s + v, 0)
        return { ...m, caByPlan, caTotal, actifsByPlan, actifsTotal }
      })
      const caTotal  = rows.filter(r => r.product_name !== 'Inconnu').reduce((s, r) => s + Number(r.price ?? 0), 0)
      setSubStats({ plans, caTotal, nbTotal: rows.length, nbActifs: rows.filter(r => r.is_active).length, histogram, PLANS })
    } catch (e) { console.error('[subscriptions] exception:', e) }
  }

  async function loadAttendance() {
    try {
      const { data: att } = await supabase.rpc('get_admin_attendance_stats')
      if (att !== null && att !== undefined) {
        setAttendance(typeof att === 'string' ? JSON.parse(att) : att)
      } else {
        const today = new Date().toISOString().slice(0, 10)
        const week  = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
        const ago13 = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10)
        const month = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)
        const { data: rows } = await supabase.from('daily_quiz').select('user_id, date').gte('date', ago13).not('user_id', 'in', `(${ADMIN_IDS.join(',')})`)
        const dayMap = {}, todaySet = new Set(), weekSet = new Set(), monthSet = new Set()
        ;(rows ?? []).forEach(r => {
          dayMap[r.date] = dayMap[r.date] ?? new Set()
          dayMap[r.date].add(r.user_id)
          if (r.date === today) todaySet.add(r.user_id)
          if (r.date >= week)  weekSet.add(r.user_id)
          if (r.date >= month) monthSet.add(r.user_id)
        })
        const daily_active = Object.entries(dayMap).map(([date, set]) => ({ date, count: set.size })).sort((a, b) => a.date.localeCompare(b.date))
        setAttendance({ active_today: todaySet.size, active_week: weekSet.size, active_month: monthSet.size, daily_active })
      }
    } catch (e) { console.error('[clients] attendance error:', e) }

    try {
      // Charge tous les inscrits + leurs profils pour filtrer les J7 complétés
      const [{ data: allUsers }, { data: profiles }] = await Promise.all([
        supabase.from('users').select('id, display_name, email, created_at')
          .not('id', 'in', `(${ADMIN_IDS.join(',')})`)
          .limit(1000),
        supabase.from('profiles').select('id, week_one_data'),
      ])

      // Seuls les utilisateurs ayant terminé les 7 jours apparaissent dans le palmarès
      const j7Set = new Set(
        (profiles ?? [])
          .filter(p => (p.week_one_data?.completedDays ?? []).some(d => Number(d) >= 7))
          .map(p => p.id)
      )
      const j7Users = (allUsers ?? []).filter(u => j7Set.has(u.id))

      // Pagine session_start + page_view ensemble
      // session_start = ouverture de l'app (fiable depuis le début)
      // page_view = navigation entre slides (depuis le déploiement du tracking)
      let evtRows = [], offset = 0
      while (true) {
        const { data: batch } = await supabase
          .from('analytics_events').select('user_id, created_at')
          .in('event_type', ['session_start', 'page_view'])
          .not('user_id', 'in', `(${ADMIN_IDS.join(',')})`)
          .range(offset, offset + 999)
        if (!batch?.length) break
        evtRows = evtRows.concat(batch)
        if (batch.length < 1000) break
        offset += 1000
      }

      // Grouper les jours uniques par utilisateur (union session_start + page_view)
      const userDaysMap = {}
      evtRows.forEach(r => {
        const d = r.created_at.slice(0, 10)
        if (!userDaysMap[r.user_id]) userDaysMap[r.user_id] = new Set()
        userDaysMap[r.user_id].add(d)
      })

      // Streak : jours consécutifs depuis aujourd'hui (ou hier si pas encore ouvert)
      function calcStreak(datesSet) {
        if (!datesSet?.size) return 0
        const today  = new Date().toISOString().slice(0, 10)
        const sorted = [...datesSet].sort((a, b) => b.localeCompare(a))
        let cursor = sorted[0] >= today ? today : sorted[0]
        let streak = 0
        for (const d of sorted) {
          if (d === cursor) {
            streak++
            const prev = new Date(cursor)
            prev.setDate(prev.getDate() - 1)
            cursor = prev.toISOString().slice(0, 10)
          } else if (d < cursor) {
            break
          }
        }
        return streak
      }

      const pal = j7Users.map(u => {
        const days   = userDaysMap[u.id]
        const sorted = days ? [...days].sort() : []
        return {
          id:           u.id,
          display_name: u.display_name ?? null,
          email:        u.email ?? null,
          connexions:   days?.size ?? 0,
          last_active:  sorted[sorted.length - 1] ?? null,
          streak_days:  calcStreak(days),
        }
      }).sort((a, b) => b.connexions - a.connexions || b.streak_days - a.streak_days)

      setPalmares(pal)
    } catch (e) { console.error('[clients] palmares error:', e) }
  }

  async function loadFunnel() {
    try {
      const [
        { data: allUsers, error: e1 },
        { data: profiles, error: e2 },
        { data: pushSubs, error: e3 },
      ] = await Promise.all([
        supabase.from('users').select('id, email, display_name, flower_name, created_at, onboarding_completed, plan, pwa_installed_at').not('id', 'in', `(${ADMIN_IDS.join(',')})`),
        supabase.from('profiles').select('id, week_one_data'),
        supabase.from('push_subscriptions').select('user_id'),
      ])
      if (e1) console.error('[funnel] users:', e1)
      if (e2) console.error('[funnel] profiles:', e2)

      const profileMap  = {}
      ;(profiles ?? []).forEach(p => { profileMap[p.id] = p })
      const pushUserIds = new Set((pushSubs ?? []).map(s => s.user_id))

      const counts   = { inscrit: 0, onboarding: 0, jour: [0,0,0,0,0,0,0], dashboard: 0 }
      const userList = []

      ;(allUsers ?? []).forEach(u => {
        const completedDays = (profileMap[u.id]?.week_one_data?.completedDays ?? []).map(Number)
        const maxDay        = completedDays.length > 0 ? Math.max(...completedDays) : 0

        userList.push({ id: u.id, email: u.email, display_name: u.display_name, flower_name: u.flower_name ?? null, created_at: u.created_at, plan: u.plan, onboarding_completed: u.onboarding_completed, pwa_installed_at: u.pwa_installed_at ?? null, has_push: pushUserIds.has(u.id), completedDays })

        const daysSinceReg = Math.floor((Date.now() - new Date(u.created_at)) / 86400000)

        if (!u.onboarding_completed)    { counts.inscrit++;   return }
        if (completedDays.length === 0) { counts.onboarding++;return }
        if (maxDay >= 7)                { counts.jour[6]++;   return } // Semaine complète → Jour 7
        if (maxDay >= 1 && maxDay <= 6) { counts.jour[maxDay - 1]++; return }
        if (daysSinceReg >= 7)          { counts.dashboard++; return } // > 7 jours sans progresser
      })

      setFunnelUsers(userList)
      setFunnel([
        { label: 'Inscrits',        count: counts.inscrit    },
        { label: 'Onboarding',      count: counts.onboarding },
        { label: 'Jour 1',          count: counts.jour[0]    },
        { label: 'Jour 2',          count: counts.jour[1]    },
        { label: 'Jour 3',          count: counts.jour[2]    },
        { label: 'Jour 4',          count: counts.jour[3]    },
        { label: 'Jour 5',          count: counts.jour[4]    },
        { label: 'Jour 6',          count: counts.jour[5]    },
        { label: 'J7',    count: counts.jour[6]   },
        { label: 'Fini',  count: counts.dashboard },
      ])
    } catch (e) {
      console.error('[funnel] exception:', e)
      setFunnel(Array(10).fill(null).map(() => ({ label: '', count: 0 })))
      setFunnelUsers([])
    }
  }


  if (!isAdmin) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text3)', fontFamily: 'Jost,sans-serif', fontSize: 13 }}>
      <style>{css}</style>🚫 Accès non autorisé
    </div>
  )

  return (
    <div className="adm-root">
      <style>{css}</style>

      <div className="adm-topbar">
        <div className="adm-logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/icons/icon-192.png" alt="logo" style={{ width: 28, height: 28, borderRadius: '50%' }} />
          Mon <em>Jardin</em> — <span style={{ fontFamily: 'Jost', fontSize: 12, color: 'var(--text3)', letterSpacing: '.2em' }}>CLIENTS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AdminNav current="#clients" />
          <div className="adm-btn ghost" onClick={() => { signOut(); window.location.href = "/"; }}>Déconnexion</div>
        </div>
      </div>

      <div className="adm-body">

        {/* COMPTEUR LED */}
        <div className="adm-counter">
          <div className="adm-counter-screen">
            <div className="adm-counter-num">
              {inscriptions !== null ? (() => {
                const str = String(inscriptions).padStart(7, '0')
                const firstLit = str.search(/[^0]/)
                return str.split('').map((d, i) => (
                  <span key={i} className={i < firstLit && inscriptions > 0 ? 'ghost' : 'lit'}>{d}</span>
                ))
              })() : <span className="ghost">0000000</span>}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="adm-tabs">
          <div className={`adm-tab${tab === 'frequentation' ? ' active' : ''}`} onClick={() => setTab('frequentation')}>📊 Fréquentation</div>
          <div className={`adm-tab${tab === 'statistiques'  ? ' active' : ''}`} onClick={() => setTab('statistiques')}>📈 Statistiques</div>
          <div className={`adm-tab${tab === 'qcm'           ? ' active' : ''}`} onClick={() => setTab('qcm')}>📋 QCM</div>
          <div className={`adm-tab${tab === 'avis'          ? ' active' : ''}`} onClick={() => setTab('avis')} style={{ position: 'relative' }}>
            ⭐ Avis clients
            {pendingAvis > 0 && <span style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(232,192,96,0.35)', border: '1px solid rgba(232,192,96,0.5)', borderRadius: 100, fontSize: 8, padding: '1px 5px', color: '#e8c060', lineHeight: 1.4 }}>{pendingAvis}</span>}
          </div>
        </div>

        {/* ── FRÉQUENTATION ── */}
        {tab === 'frequentation' && (
          <div className="adm-section">

            {/* ── FUNNEL ── */}
            {!funnel ? (
              <div className="adm-empty">Chargement…</div>
            ) : (() => {
              const get = (i) => funnel[i]?.count ?? 0
              const totalInscrits = funnel.reduce((s, f) => s + f.count, 0)
              const steps = [
                { label: 'Onboarding', short: 'Onb.',  count: get(1), color: '#a78bf5' },
                { label: 'Jour 1',     short: 'J1',    count: get(2), color: '#90d07a' },
                { label: 'Jour 2',     short: 'J2',    count: get(3), color: '#84cc6c' },
                { label: 'Jour 3',     short: 'J3',    count: get(4), color: '#78c85e' },
                { label: 'Jour 4',     short: 'J4',    count: get(5), color: '#6cc450' },
                { label: 'Jour 5',     short: 'J5',    count: get(6), color: '#60c044' },
                { label: 'Jour 6',     short: 'J6',    count: get(7), color: '#54bc3a' },
                { label: 'Jour 7',     short: 'J7',    count: get(8), color: '#48b830' },
                { label: 'Complet',  short: 'Fini',  count: get(9), color: '#7ab5f5' },
              ]
              const max = Math.max(...steps.map(s => s.count), 1)
              return (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border2)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                      Funnel d'engagement — parcours utilisateurs
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'Jost,sans-serif' }}>
                      <span style={{ color: '#fff', fontWeight: 500 }}>{totalInscrits}</span> utilisateurs au total
                      {get(0) > 0 && <span style={{ marginLeft: 8, color: 'rgba(255,200,100,0.7)' }}>· {get(0)} n'ont pas démarré</span>}
                    </div>
                  </div>

                  {/* Histogramme */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180 }}>
                    {steps.map((step) => {
                      const barPct = Math.max(2, Math.round((step.count / max) * 100))
                      return (
                        <div key={step.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontWeight: 300, color: step.count > 0 ? '#fff' : 'rgba(255,255,255,0.2)', lineHeight: 1, marginBottom: 5 }}>
                            {step.count}
                          </div>
                          <div style={{ width: '78%', height: `${barPct}%`, minHeight: 4, background: step.color, borderRadius: '4px 4px 0 0', opacity: step.count > 0 ? 1 : 0.15, transition: 'height .5s ease' }} />
                        </div>
                      )
                    })}
                  </div>

                  {/* Axe X */}
                  <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--border2)', paddingTop: 10, marginBottom: 4 }}>
                    {steps.map((step) => (
                      <div key={step.label} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '.02em', fontFamily: 'Jost,sans-serif' }}>{step.short}</div>
                      </div>
                    ))}
                  </div>

                  {/* Accordéon détail utilisateurs */}
                  <FunnelUserDetail users={funnelUsers} />

                  <div style={{ marginTop: 10, fontSize: 9, color: 'rgba(255,255,255,0.18)', fontFamily: 'Jost,sans-serif', textAlign: 'right' }}>
                    Chaque utilisateur compté une seule fois à son étape actuelle · plan ignoré · comptes admin exclus
                  </div>
                </div>
              )
            })()}

            {/* ── ABONNEMENTS PREMIUM ── */}
            <div style={{ background:'#3d4248', border:'1px solid rgba(255,255,255,0.10)', borderRadius:16, padding: isMobile ? '14px 12px' : 28, marginBottom:24 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', letterSpacing:'.15em', textTransform:'uppercase', marginBottom: isMobile ? 12 : 24 }}>💳 Abonnements Premium</div>
              {!subStats ? <div className="adm-empty">Chargement…</div> : (<>

                {/* KPIs — 3 tuiles sur 1 ligne, compactes */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: isMobile ? 8 : 12, marginBottom: isMobile ? 12 : 20 }}>
                  {[
                    { lbl:'Total', val: subStats.nbTotal, color:'#fff' },
                    { lbl:'Actifs', val: subStats.nbActifs, color:'#96d485' },
                    { lbl:'CA', val: subStats.caTotal.toLocaleString('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}), color:'#F6C453' },
                  ].map((s,i) => (
                    <div key={i} style={{ background:'rgba(0,0,0,0.22)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding: isMobile ? '10px 8px' : '12px 14px', textAlign:'center' }}>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize: isMobile ? 'clamp(18px,6vw,28px)' : 34, fontWeight:300, color:s.color, lineHeight:1 }}>{s.val}</div>
                      <div style={{ fontSize: isMobile ? 9 : 10, color:'rgba(255,255,255,0.35)', letterSpacing:'.08em', textTransform:'uppercase', marginTop:5 }}>{s.lbl}</div>
                    </div>
                  ))}
                </div>

                {/* Plans — liste compacte */}
                <div style={{ display:'flex', flexDirection:'column', gap: isMobile ? 6 : 8, marginBottom: isMobile ? 14 : 20 }}>
                  {subStats.plans.map((p,i) => (
                    <div key={i} style={{ background:'rgba(0,0,0,0.15)', border:`1px solid ${p.total>0?'rgba(255,255,255,0.10)':'rgba(255,255,255,0.04)'}`, borderRadius:10, padding: isMobile ? '8px 10px' : '10px 14px', display:'flex', alignItems:'center', gap: isMobile ? 8 : 10, opacity: p.total===0 ? 0.4 : 1 }}>
                      <span style={{ fontSize: isMobile ? 15 : 18, flexShrink:0 }}>{p.icon}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize: isMobile ? 12 : 13, fontWeight:500, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.key}</div>
                        <div style={{ fontSize: isMobile ? 9 : 10, color:'rgba(255,255,255,0.35)', marginTop:1 }}>{p.actifs} actif{p.actifs!==1?'s':''} · {p.total} total</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize: isMobile ? 12 : 14, fontWeight:600, color: p.total>0 ? '#F6C453' : 'rgba(255,255,255,0.18)' }}>{p.ca.toLocaleString('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0})}</div>
                        <div style={{ height:3, background:'rgba(255,255,255,0.07)', borderRadius:100, marginTop:4, width: isMobile ? 44 : 60, overflow:'hidden' }}>
                          <div style={{ height:'100%', width: subStats.nbTotal>0 ? `${Math.round((p.total/subStats.nbTotal)*100)}%` : '0%', background:p.color, borderRadius:100 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Graphique — scrollable sur mobile */}
                <div style={{ background:'rgba(0,0,0,0.15)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding: isMobile ? '10px 10px 8px' : '18px 18px 14px' }}>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.30)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:10 }}>CA mensuel · mensuel 13€ · annuel 108€</div>
                  <div style={{ display:'flex', gap: isMobile ? 10 : 14, marginBottom:10, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:8, height:8, borderRadius:2, background:'rgba(255,255,255,0.6)' }} /><span style={{ fontSize:9, color:'rgba(255,255,255,0.45)' }}>CA (€)</span></div>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:8, height:8, borderRadius:2, background:'rgba(255,255,255,0.25)' }} /><span style={{ fontSize:9, color:'rgba(255,255,255,0.45)' }}>Actifs</span></div>
                  </div>
                  {(() => {
                    const histo = subStats.histogram ?? [], PLANS = subStats.PLANS ?? [], HEIGHT = isMobile ? 100 : 200
                    const maxCA = Math.max(...histo.map(m => m.caTotal), 1), maxActif = Math.max(...histo.map(m => m.actifsTotal), 1)
                    return (
                      <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
                        <div style={{ minWidth: isMobile ? 520 : 'auto' }}>
                          <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:HEIGHT }}>
                            {histo.map((m,i) => {
                              const caH = maxCA>0 ? Math.max(Math.round((m.caTotal/maxCA)*HEIGHT), m.caTotal>0?3:0) : 0
                              const actifH = maxActif>0 ? Math.max(Math.round((m.actifsTotal/maxActif)*HEIGHT), m.actifsTotal>0?3:0) : 0
                              return (
                                <div key={i} style={{ flex:1, display:'flex', alignItems:'flex-end', justifyContent:'center', gap:2, height:'100%' }}>
                                  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%' }}>
                                    {m.caTotal>0 && <div style={{ fontSize:7, color:'rgba(255,255,255,0.4)', marginBottom:1 }}>{m.caTotal}€</div>}
                                    <div style={{ width:'100%', height:caH, display:'flex', flexDirection:'column', borderRadius:'2px 2px 0 0', overflow:'hidden' }}>
                                      {PLANS.map((p,pi) => { const ca=m.caByPlan?.[p.key]??0; if(!ca) return null; const segH=m.caTotal>0?Math.max(Math.round((ca/m.caTotal)*caH),2):0; return <div key={pi} style={{ width:'100%', height:segH, background:p.color, flexShrink:0 }} title={`${p.key} · ${ca}€`} /> })}
                                    </div>
                                  </div>
                                  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%' }}>
                                    {m.actifsTotal>0 && <div style={{ fontSize:7, color:'rgba(255,255,255,0.4)', marginBottom:1 }}>{m.actifsTotal}</div>}
                                    <div style={{ width:'100%', height:actifH, display:'flex', flexDirection:'column', borderRadius:'2px 2px 0 0', overflow:'hidden' }}>
                                      {PLANS.map((p,pi) => { const nb=m.actifsByPlan?.[p.key]??0; if(!nb) return null; const segH=m.actifsTotal>0?Math.max(Math.round((nb/m.actifsTotal)*actifH),2):0; return <div key={pi} style={{ width:'100%', height:segH, background:p.color, flexShrink:0, opacity:0.6 }} title={`${p.key} · ${nb} actifs`} /> })}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          <div style={{ display:'flex', gap:3, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:5, marginTop:4 }}>
                            {histo.map((m,i) => <div key={i} style={{ flex:1, textAlign:'center', fontSize:8, color:'rgba(255,255,255,0.28)' }}>{m.label}</div>)}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 10px', marginTop:10 }}>
                    {(subStats.PLANS??[]).map((p,i) => <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ width:6, height:6, borderRadius:2, background:p.color }} /><span style={{ fontSize:9, color:'rgba(255,255,255,0.32)' }}>{p.icon} {p.key}</span></div>)}
                  </div>
                </div>
              </>)}
            </div>

            {/* ── PALMARÈS ── */}
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>🏆 Palmarès post-J7 — jours d'ouverture</div>
            {loading ? <div className="adm-empty">Chargement…</div> : palmares.length === 0 ? <div className="adm-empty">Aucune donnée disponible</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {palmares.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border2)', borderRadius: 10 }}>
                    {/* Rang */}
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: i === 0 ? '#e8c060' : i === 1 ? 'rgba(192,192,192,0.7)' : i === 2 ? 'rgba(205,127,50,0.7)' : 'var(--text3)', width: 22, textAlign: 'center', flexShrink: 0 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </div>
                    {/* Nom + dernière ouverture */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.display_name ?? p.email ?? p.id?.slice(0, 8)}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 1 }}>
                        {p.last_active
                          ? `Dernière ouverture : ${new Date(p.last_active).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                          : 'Aucune ouverture trackée'}
                      </div>
                    </div>
                    {/* Streak */}
                    <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 40 }}>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: p.streak_days >= 7 ? '#e8c060' : p.streak_days >= 3 ? '#96d485' : 'var(--text3)', lineHeight: 1 }}>
                        {p.streak_days > 0 ? p.streak_days : '—'}
                      </div>
                      <div style={{ fontSize: 7, color: 'var(--text3)', marginTop: 1 }}>🔥 streak</div>
                    </div>
                    {/* Jours totaux */}
                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 44 }}>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: 'var(--green)', lineHeight: 1 }}>
                        {p.connexions > 0 ? p.connexions : '—'}
                      </div>
                      <div style={{ fontSize: 7, color: 'var(--text3)', marginTop: 1 }}>jours</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STATISTIQUES ── */}
        {tab === 'statistiques' && (
          <div className="adm-section">
            <TabStatistiques funnelUsers={funnelUsers} />
          </div>
        )}

        {/* ── QCM ── */}
        {tab === 'qcm' && (
          <div className="adm-section"><TabQCM /></div>
        )}

        {/* ── AVIS CLIENTS ── */}
        {tab === 'avis' && (
          <div className="adm-section"><TabAvisClients onPendingCount={setPendingAvis} /></div>
        )}

      </div>
      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  )
}
