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
    { hash: '#activite', label: 'Activité', icon: '🌿' },
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
  const sorted = [...users].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

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
                {['Utilisateur', 'Inscrit le', 'Onb.', 'J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'Plan'].map(h => (
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
                    {/* Nom */}
                    <td style={{ padding: '7px 8px', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 11 }}>
                      {u.display_name || u.email || u.id.slice(0, 8)}
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
export function AdminClientsPage() {
  useTheme()
  const { user, signOut } = useAuth()

  const [tab,           setTab]           = useState('frequentation')
  const [stats,         setStats]         = useState({})
  const [attendance,    setAttendance]    = useState(null)
  const [palmares,      setPalmares]      = useState([])
  const [funnel,        setFunnel]        = useState(null)
  const [funnelUsers,   setFunnelUsers]   = useState([])
  const [subStats,      setSubStats]      = useState(null)
  const [fullStats,     setFullStats]     = useState(null)
  const [statsPeriod,   setStatsPeriod]   = useState('week')
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

  useEffect(() => { if (tab === 'statistiques') loadFullStats() }, [tab])

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
      const { data: pal } = await supabase.rpc('get_admin_connexion_palmares')
      if (pal !== null && pal !== undefined) {
        const parsed = typeof pal === 'string' ? JSON.parse(pal) : pal
        setPalmares(Array.isArray(parsed) ? parsed : [])
      } else {
        const { data: users }      = await supabase.from('users').select('id, display_name, email').not('id', 'in', `(${ADMIN_IDS.join(',')})`)
        const { data: quizRows }   = await supabase.from('daily_quiz').select('user_id, date').not('user_id', 'in', `(${ADMIN_IDS.join(',')})`)
        const { data: lumensRows } = await supabase.from('lumens').select('user_id, streak_days').not('user_id', 'in', `(${ADMIN_IDS.join(',')})`)
        const countMap = {}, lastMap = {}, streakMap = {}
        ;(quizRows ?? []).forEach(q => {
          countMap[q.user_id] = (countMap[q.user_id] ?? 0) + 1
          if (!lastMap[q.user_id] || q.date > lastMap[q.user_id]) lastMap[q.user_id] = q.date
        })
        ;(lumensRows ?? []).forEach(l => { streakMap[l.user_id] = l.streak_days ?? 0 })
        setPalmares((users ?? []).map(u => ({ id: u.id, display_name: u.display_name, email: u.email, connexions: countMap[u.id] ?? 0, last_active: lastMap[u.id] ?? null, streak_days: streakMap[u.id] ?? 0 })).sort((a, b) => b.connexions - a.connexions).slice(0, 20))
      }
    } catch (e) { console.error('[clients] palmares error:', e) }
  }

  async function loadFunnel() {
    try {
      const [
        { data: allUsers, error: e1 },
        { data: profiles, error: e2 },
      ] = await Promise.all([
        supabase.from('users').select('id, email, display_name, created_at, onboarding_completed, plan').not('id', 'in', `(${ADMIN_IDS.join(',')})`),
        supabase.from('profiles').select('id, week_one_data'),
      ])
      if (e1) console.error('[funnel] users:', e1)
      if (e2) console.error('[funnel] profiles:', e2)

      const profileMap = {}
      ;(profiles ?? []).forEach(p => { profileMap[p.id] = p })

      const counts   = { inscrit: 0, onboarding: 0, jour: [0,0,0,0,0,0,0], dashboard: 0 }
      const userList = []

      ;(allUsers ?? []).forEach(u => {
        const completedDays = (profileMap[u.id]?.week_one_data?.completedDays ?? []).map(Number)
        const maxDay        = completedDays.length > 0 ? Math.max(...completedDays) : 0

        userList.push({ id: u.id, email: u.email, display_name: u.display_name, created_at: u.created_at, plan: u.plan, onboarding_completed: u.onboarding_completed, completedDays })

        if (!u.onboarding_completed)    { counts.inscrit++;              return }
        if (completedDays.length === 0) { counts.onboarding++;           return }
        if (maxDay >= 7)                { counts.dashboard++;            return }
        if (maxDay >= 1 && maxDay <= 6)   counts.jour[maxDay - 1]++
      })

      setFunnelUsers(userList)
      setFunnel([
        { label: 'Inscrits',   count: counts.inscrit    },
        { label: 'Onboarding', count: counts.onboarding },
        { label: 'Jour 1',     count: counts.jour[0]    },
        { label: 'Jour 2',     count: counts.jour[1]    },
        { label: 'Jour 3',     count: counts.jour[2]    },
        { label: 'Jour 4',     count: counts.jour[3]    },
        { label: 'Jour 5',     count: counts.jour[4]    },
        { label: 'Jour 6',     count: counts.jour[5]    },
        { label: 'Jour 7',     count: counts.jour[6]    },
        { label: 'Dashboard',  count: counts.dashboard  },
      ])
    } catch (e) {
      console.error('[funnel] exception:', e)
      setFunnel(Array(10).fill(null).map(() => ({ label: '', count: 0 })))
      setFunnelUsers([])
    }
  }

  async function loadFullStats() {
    const ago  = n => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
    const periods = { day: ago(0), week: ago(6), month: ago(29), year: ago(364) }
    const [
      { data: usersData },
      { data: sessData },
      { data: actData },
      { data: atelierData },
      { data: regData },
      { data: defiData },
    ] = await Promise.all([
      supabase.from('users').select('id, created_at').not('id', 'in', `(${ADMIN_IDS.join(',')})`),
      supabase.from('analytics_events').select('user_id, created_at').eq('event_type', 'session_start').not('user_id', 'in', `(${ADMIN_IDS.join(',')})`).gte('created_at', ago(364)),
      supabase.from('activity').select('user_id, action, created_at').not('user_id', 'in', `(${ADMIN_IDS.join(',')})`).gte('created_at', ago(364)),
      supabase.from('ateliers').select('id, created_at').not('animator_id', 'in', `(${ADMIN_IDS.join(',')})`).gte('created_at', ago(364)),
      supabase.from('atelier_registrations').select('created_at').gte('created_at', ago(364)),
      supabase.from('analytics_events').select('created_at').eq('event_type', 'defi_join').not('user_id', 'in', `(${ADMIN_IDS.join(',')})`).gte('created_at', ago(364)),
    ])
    const usersByDate = {}
    ;(usersData ?? []).forEach(u => { const d = u.created_at?.slice(0,10); if (d) usersByDate[d] = (usersByDate[d] ?? 0) + 1 })
    const sessUsersByDate = {}
    ;(sessData ?? []).forEach(s => { const d = s.created_at?.slice(0,10); if (!d) return; if (!sessUsersByDate[d]) sessUsersByDate[d] = new Set(); sessUsersByDate[d].add(s.user_id) })
    const actByDateAction = {}
    ;(actData ?? []).forEach(a => { const d = a.created_at?.slice(0,10); if (!d) return; const key = `${d}__${a.action}`; actByDateAction[key] = (actByDateAction[key] ?? 0) + 1 })
    const ateliersByDate = {}
    ;(atelierData ?? []).forEach(a => { const d = a.created_at?.slice(0,10); if (d) ateliersByDate[d] = (ateliersByDate[d] ?? 0) + 1 })
    const regsByDate = {}
    ;(regData ?? []).forEach(r => { const d = r.created_at?.slice(0,10); if (d) regsByDate[d] = (regsByDate[d] ?? 0) + 1 })
    const defisByDate = {}
    ;(defiData ?? []).forEach(d => { const day = d.created_at?.slice(0,10); if (day) defisByDate[day] = (defisByDate[day] ?? 0) + 1 })
    const sumFrom  = (map, from) => Object.entries(map).filter(([d]) => d >= from).reduce((s, [, v]) => s + v, 0)
    const uniqFrom = (map, from) => new Set(Object.entries(map).filter(([d]) => d >= from).flatMap(([, s]) => [...s])).size
    const build    = (map) => ({ day: sumFrom(map, periods.day), week: sumFrom(map, periods.week), month: sumFrom(map, periods.month), year: sumFrom(map, periods.year) })
    const chart30  = (map) => { const days = []; for (let i = 29; i >= 0; i--) { const d = ago(i); days.push({ date: d, count: map[d] ?? 0 }) }; return days }
    const actMap   = (action) => { const m = {}; Object.entries(actByDateAction).forEach(([key, v]) => { const [d, a] = key.split('__'); if (a === action) m[d] = (m[d] ?? 0) + v }); return m }
    setFullStats({
      inscriptions:      { ...build(usersByDate), chart: chart30(usersByDate) },
      connexions:        { day: uniqFrom(sessUsersByDate, periods.day), week: uniqFrom(sessUsersByDate, periods.week), month: uniqFrom(sessUsersByDate, periods.month), year: uniqFrom(sessUsersByDate, periods.year), chart: chart30(Object.fromEntries(Object.entries(sessUsersByDate).map(([d, s]) => [d, s.size]))) },
      bilans:            { ...build(actMap('bilan')), chart: chart30(actMap('bilan')) },
      rituels:           { ...build(actMap('ritual')), chart: chart30(actMap('ritual')) },
      coeurs:            { ...build(actMap('coeur')), chart: chart30(actMap('coeur')) },
      ateliers_crees:    { ...build(ateliersByDate), chart: chart30(ateliersByDate) },
      ateliers_inscrits: { ...build(regsByDate), chart: chart30(regsByDate) },
      defis:             { ...build(defisByDate), chart: chart30(defisByDate) },
    })
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
            <div style={{ background:'#3d4248', border:'1px solid rgba(255,255,255,0.10)', borderRadius:16, padding:28, marginBottom:24 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', letterSpacing:'.15em', textTransform:'uppercase', marginBottom:24 }}>💳 Abonnements Premium</div>
              {!subStats ? <div className="adm-empty">Chargement…</div> : (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:20 }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:4 }}>
                      {[{ lbl:'Total', val: subStats.nbTotal, color:'#ffffff' }, { lbl:'Actifs', val: subStats.nbActifs, color:'#96d485' }].map((s, i) => (
                        <div key={i} style={{ background:'rgba(0,0,0,0.20)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
                          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:300, color:s.color, lineHeight:1 }}>{s.val}</div>
                          <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:'.08em', textTransform:'uppercase', marginTop:6 }}>{s.lbl}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:'rgba(0,0,0,0.20)', border:'1px solid rgba(246,196,83,0.15)', borderRadius:10, padding:'12px 14px', textAlign:'center', marginBottom:8 }}>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:300, color:'#F6C453', lineHeight:1 }}>{subStats.caTotal.toLocaleString('fr-FR', { style:'currency', currency:'EUR' })}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:'.08em', textTransform:'uppercase', marginTop:6 }}>CA total</div>
                    </div>
                    {subStats.plans.map((p, i) => (
                      <div key={i} style={{ background:'rgba(0,0,0,0.15)', border:`1px solid ${p.total > 0 ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)'}`, borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, opacity: p.total === 0 ? 0.45 : 1 }}>
                        <span style={{ fontSize:18, flexShrink:0 }}>{p.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:500, color:'#ffffff' }}>{p.key}</div>
                          <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{p.actifs} actif{p.actifs !== 1 ? 's' : ''} · {p.total} total</div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:15, fontWeight:600, color: p.total > 0 ? '#F6C453' : 'rgba(255,255,255,0.20)' }}>{p.ca.toLocaleString('fr-FR', { style:'currency', currency:'EUR' })}</div>
                          <div style={{ height:3, background:'rgba(255,255,255,0.07)', borderRadius:100, marginTop:5, width:60, overflow:'hidden' }}>
                            <div style={{ height:'100%', width: subStats.nbTotal > 0 ? `${Math.round((p.total / subStats.nbTotal) * 100)}%` : '0%', background: p.color, borderRadius:100 }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:'rgba(0,0,0,0.15)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'20px 20px 16px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:16 }}>CA mensuel — mars 2026 → févr. 2027 · mensuel 13€ · annuel 108€</div>
                    {(() => {
                      const histo = subStats.histogram ?? [], PLANS = subStats.PLANS ?? [], HEIGHT = 320
                      const maxCA = Math.max(...histo.map(m => m.caTotal), 1), maxActif = Math.max(...histo.map(m => m.actifsTotal), 1)
                      return (
                        <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1 }}>
                          <div style={{ display:'flex', gap:16 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:10, height:10, borderRadius:2, background:'rgba(255,255,255,0.6)' }} /><span style={{ fontSize:10, color:'rgba(255,255,255,0.50)' }}>CA réalisé (€)</span></div>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:10, height:10, borderRadius:2, background:'rgba(255,255,255,0.25)' }} /><span style={{ fontSize:10, color:'rgba(255,255,255,0.50)' }}>Abonnements actifs</span></div>
                          </div>
                          <div style={{ display:'flex', alignItems:'flex-end', gap:4, flex:1, minHeight:HEIGHT }}>
                            {histo.map((m, i) => {
                              const caH = maxCA > 0 ? Math.max(Math.round((m.caTotal / maxCA) * HEIGHT), m.caTotal > 0 ? 4 : 0) : 0
                              const actifH = maxActif > 0 ? Math.max(Math.round((m.actifsTotal / maxActif) * HEIGHT), m.actifsTotal > 0 ? 4 : 0) : 0
                              return (
                                <div key={i} style={{ flex:1, display:'flex', alignItems:'flex-end', justifyContent:'center', gap:2, height:'100%' }}>
                                  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%' }}>
                                    {m.caTotal > 0 && <div style={{ fontSize:8, color:'rgba(255,255,255,0.45)', marginBottom:2 }}>{m.caTotal}€</div>}
                                    <div style={{ width:'100%', height:caH, display:'flex', flexDirection:'column', borderRadius:'3px 3px 0 0', overflow:'hidden' }}>
                                      {PLANS.map((p, pi) => { const ca = m.caByPlan?.[p.key] ?? 0; if (!ca) return null; const segH = m.caTotal > 0 ? Math.max(Math.round((ca / m.caTotal) * caH), 2) : 0; return <div key={pi} style={{ width:'100%', height:segH, background:p.color, flexShrink:0 }} title={`${p.key} · ${ca}€`} /> })}
                                    </div>
                                  </div>
                                  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%' }}>
                                    {m.actifsTotal > 0 && <div style={{ fontSize:8, color:'rgba(255,255,255,0.45)', marginBottom:2 }}>{m.actifsTotal}</div>}
                                    <div style={{ width:'100%', height:actifH, display:'flex', flexDirection:'column', borderRadius:'3px 3px 0 0', overflow:'hidden' }}>
                                      {PLANS.map((p, pi) => { const nb = m.actifsByPlan?.[p.key] ?? 0; if (!nb) return null; const segH = m.actifsTotal > 0 ? Math.max(Math.round((nb / m.actifsTotal) * actifH), 2) : 0; return <div key={pi} style={{ width:'100%', height:segH, background:p.color, flexShrink:0, opacity:0.6 }} title={`${p.key} · ${nb} actifs`} /> })}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          <div style={{ display:'flex', gap:4 }}>{histo.map((m, i) => <div key={i} style={{ flex:1, textAlign:'center', fontSize:9, color:'rgba(255,255,255,0.30)' }}>{m.label}</div>)}</div>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 12px' }}>{PLANS.map((p, i) => <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ width:7, height:7, borderRadius:2, background:p.color, flexShrink:0 }} /><span style={{ fontSize:9, color:'rgba(255,255,255,0.35)' }}>{p.icon} {p.key}</span></div>)}</div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* ── ACTIVITÉ QUOTIDIENNE ── */}
            {attendance?.daily_active?.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border2)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Activité quotidienne — 14 derniers jours</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                  {(() => {
                    const days = attendance.daily_active, max = Math.max(...days.map(d => d.count), 1)
                    const allDays = []
                    for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const key = d.toISOString().slice(0,10); allDays.push({ date: key, count: days.find(x => x.date === key)?.count ?? 0 }) }
                    return allDays.map((d, i) => {
                      const pct = Math.max(4, Math.round((d.count / max) * 100)), isToday = d.date === new Date().toISOString().slice(0,10)
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div title={`${d.count} actifs`} style={{ width: '100%', height: `${pct}%`, background: isToday ? 'var(--green)' : 'rgba(150,212,133,0.35)', borderRadius: 4, minHeight: 4, boxShadow: isToday ? '0 0 8px rgba(150,212,133,0.4)' : 'none', transition: 'height .3s' }} />
                          {d.count > 0 && <div style={{ fontSize: 8, color: 'var(--text3)' }}>{d.count}</div>}
                        </div>
                      )
                    })
                  })()}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <div style={{ fontSize: 8, color: 'var(--text3)' }}>il y a 13 jours</div>
                  <div style={{ fontSize: 8, color: 'var(--green)' }}>aujourd'hui</div>
                </div>
              </div>
            )}

            {/* ── PALMARÈS ── */}
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>🏆 Palmarès — jours actifs</div>
            {loading ? <div className="adm-empty">Chargement…</div> : palmares.length === 0 ? <div className="adm-empty">Aucune donnée disponible</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {palmares.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border2)', borderRadius: 10 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: i === 0 ? '#e8c060' : i === 1 ? 'rgba(192,192,192,0.7)' : i === 2 ? 'rgba(205,127,50,0.7)' : 'var(--text3)', width: 24, textAlign: 'center', flexShrink: 0 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name ?? p.email ?? p.id?.slice(0,8)}</div>
                      <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>Dernière activité : {p.last_active ? new Date(p.last_active).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}{p.streak_days > 0 && ` · 🔥 ${p.streak_days}j de streak`}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: 'var(--green)', lineHeight: 1 }}>{p.connexions}</div>
                      <div style={{ fontSize: 9, color: 'var(--text3)' }}>jours actifs</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STATISTIQUES ── */}
        {tab === 'statistiques' && (() => {
          const P = statsPeriod
          const pLabel = { day: "Aujourd'hui", week: '7 derniers jours', month: '30 derniers jours', year: '365 derniers jours' }
          const METRICS = fullStats ? [
            { key: 'inscriptions',      icon: '🌱', label: 'Inscriptions',         color: '#96d485' },
            { key: 'connexions',        icon: '🔗', label: 'Connexions uniques',    color: '#7ab5f5' },
            { key: 'bilans',            icon: '🌹', label: 'Bilans complétés',      color: '#e8d4a8' },
            { key: 'rituels',           icon: '✨', label: 'Rituels effectués',     color: '#c8a882' },
            { key: 'coeurs',            icon: '💚', label: 'Cœurs envoyés',         color: '#96d485' },
            { key: 'ateliers_crees',    icon: '📖', label: 'Ateliers créés',        color: '#b8a0d8' },
            { key: 'ateliers_inscrits', icon: '✓',  label: 'Inscriptions ateliers', color: '#7ab5f5' },
            { key: 'defis',             icon: '🏅', label: 'Défis rejoints',        color: '#F6C453' },
          ] : []
          return (
            <div className="adm-section">
              <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
                {['day', 'week', 'month', 'year'].map(p => (
                  <button key={p} onClick={() => setStatsPeriod(p)} style={{ padding: '6px 16px', borderRadius: 100, fontSize: 10, letterSpacing: '.08em', fontFamily: 'Jost,sans-serif', cursor: 'pointer', background: P === p ? 'rgba(150,212,133,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${P === p ? 'rgba(150,212,133,0.4)' : 'rgba(255,255,255,0.1)'}`, color: P === p ? '#c8f0b8' : 'var(--text3)', transition: 'all .2s' }}>
                    {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
                  </button>
                ))}
                <span style={{ fontSize: 10, color: 'var(--text3)', alignSelf: 'center', marginLeft: 4, fontStyle: 'italic' }}>{pLabel[P]}</span>
              </div>
              {!fullStats ? <div className="adm-empty">Chargement…</div> : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 32 }}>
                    {METRICS.map(m => (
                      <div key={m.key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border2)', borderRadius: 14, padding: '16px 18px' }}>
                        <div style={{ fontSize: 18, marginBottom: 6 }}>{m.icon}</div>
                        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 300, color: m.color, lineHeight: 1 }}>{fullStats[m.key]?.[P] ?? 0}</div>
                        <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 6 }}>{m.label}</div>
                        {fullStats[m.key]?.chart && (() => { const data = fullStats[m.key].chart.slice(-14), max = Math.max(...data.map(d => d.count), 1); return <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 24, marginTop: 10 }}>{data.map((d, i) => <div key={i} title={`${d.date}: ${d.count}`} style={{ flex: 1, height: `${Math.max(2, Math.round(d.count / max * 100))}%`, background: m.color, opacity: 0.4, borderRadius: 2, minHeight: 2 }} />)}</div> })()}
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border2)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Activité quotidienne — 30 derniers jours</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>{METRICS.map(m => <div key={m.key} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 100, background: `${m.color}22`, border: `1px solid ${m.color}44`, color: m.color }}>{m.icon} {m.label}</div>)}</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 100 }}>
                      {fullStats.connexions.chart.map((d, i) => {
                        const vals = METRICS.map(m => fullStats[m.key].chart[i]?.count ?? 0), total = vals.reduce((a, b) => a + b, 0)
                        const maxTotal = Math.max(...fullStats.connexions.chart.map((_, j) => METRICS.map(m => fullStats[m.key].chart[j]?.count ?? 0).reduce((a, b) => a + b, 0)), 1)
                        const pct = Math.max(3, Math.round(total / maxTotal * 100)), isToday = d.date === new Date().toISOString().slice(0,10)
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <div title={`${d.date}\n${METRICS.map((m, j) => `${m.label}: ${vals[j]}`).join('\n')}`} style={{ width: '100%', height: `${pct}%`, background: isToday ? 'var(--green)' : 'rgba(150,212,133,0.35)', borderRadius: 3, minHeight: 3, boxShadow: isToday ? '0 0 6px rgba(150,212,133,0.4)' : 'none', transition: 'height .3s' }} />
                            {total > 0 && <div style={{ fontSize: 7, color: 'var(--text3)' }}>{total}</div>}
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <div style={{ fontSize: 8, color: 'var(--text3)' }}>il y a 29 jours</div>
                      <div style={{ fontSize: 8, color: 'var(--green)' }}>aujourd'hui</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>Récapitulatif</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="adm-table">
                      <thead>
                        <tr>{['MÉTRIQUE', 'JOUR', '7J', '30J', '365J'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: h === 'MÉTRIQUE' ? 'left' : 'center', fontSize: 9, letterSpacing: '.1em', color: 'var(--text3)', fontWeight: 400 }}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {METRICS.map((m, i) => (
                          <tr key={m.key} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                            <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text)' }}>{m.icon} {m.label}</td>
                            {['day', 'week', 'month', 'year'].map(p => <td key={p} style={{ padding: '10px 14px', textAlign: 'center', fontSize: 13, fontFamily: "'Cormorant Garamond',serif", color: m.color }}>{fullStats[m.key]?.[p] ?? 0}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )
        })()}

        {/* ── QCM ── */}
        {tab === 'qcm' && (
          <div className="adm-section"><TabQCM /></div>
        )}

      </div>
      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  )
}
