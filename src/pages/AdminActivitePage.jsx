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
.adm-root{font-family:'Jost',sans-serif;background:#2b2f33!important;min-height:100vh;width:100vw;color:#ffffff!important;display:flex;flex-direction:column}.adm-root *{color:#ffffff!important;font-size:18px!important}
.adm-topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 40px;border-bottom:1px solid var(--border2);background:#353a3f!important;backdrop-filter:blur(10px);position:sticky;top:0;z-index:10}
.adm-logo{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:300;letter-spacing:.05em;color:#ffffff}
.adm-logo em{font-style:italic;color:var(--green)}
.adm-body{flex:1;padding:32px 40px;width:100%}
.adm-section{margin-bottom:32px}
.adm-empty{font-size:18px;color:rgba(255,255,255,0.55);font-style:italic;padding:28px;text-align:center;background:#3d4248;border-radius:12px;border:1px dashed var(--border2)}
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
.adm-grid{display:grid;gap:10px}
.adm-btn{padding:7px 16px;border-radius:8px;font-size:18px;letter-spacing:.06em;cursor:pointer;border:none;font-family:'Jost',sans-serif;transition:all .2s;white-space:nowrap}
.adm-btn.ghost{background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.20);color:#ffffff}
.adm-btn.ghost:hover{background:rgba(255,255,255,0.12);color:var(--text)}
.adm-btn.success{background:var(--green3);border:1px solid var(--greenT);color:var(--cream)}
.adm-btn.success:hover{background:var(--green2)}
.adm-btn.danger{background:var(--red2);border:1px solid var(--redT);color:rgba(255,160,160,0.9)}
.adm-toast{position:fixed;bottom:24px;right:24px;background:#3e444a!important;border:1px solid var(--greenT);border-radius:10px;padding:10px 20px;font-size:18px;color:#ffffff;z-index:999;animation:fadeInUp .3s ease}
@keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:700px){
  .adm-topbar{padding:10px 16px;gap:8px;flex-wrap:wrap}
  .adm-logo{font-size:18px;flex:1}
  .adm-body{padding:16px 14px}
  .adm-stats{grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px}
  .adm-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap;gap:0;padding-bottom:0;scrollbar-width:none}
  .adm-tabs::-webkit-scrollbar{display:none}
  .adm-tab{padding:10px 14px;font-size:18px;white-space:nowrap;flex-shrink:0}
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

// ═══════════════════════════════════════════════════════════
//  RituelsEditor
// ═══════════════════════════════════════════════════════════
const ZONES_RITUELS = {
  roots:   { name: 'Racines',  color: '#C8894A' },
  stem:    { name: 'Tige',     color: '#5AAF78' },
  leaves:  { name: 'Feuilles', color: '#4A9E5C' },
  flowers: { name: 'Fleurs',   color: '#D4779A' },
  breath:  { name: 'Souffle',  color: '#6ABBE4' },
}

function RituelsEditor({ showToast }) {
  const [zone,      setZone]      = useState('')
  const [rituel,    setRituel]    = useState('')
  const [title,     setTitle]     = useState('')
  const [optRituels,setOptRituels]= useState([])
  const [optTitles, setOptTitles] = useState([])
  const [exercise,  setExercise]  = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [desc,      setDesc]      = useState('')
  const [dur,       setDur]       = useState('')
  const [toolType,  setToolType]  = useState('none')
  const [toolObj,   setToolObj]   = useState({ inhale: 5, hold: 0, exhale: 5, holdEmpty: 0, cycles: 5 })
  const [openZone,  setOpenZone]  = useState('')
  const [editRituel,setEditRituel]= useState('')
  const [editTitle, setEditTitle] = useState('')

  const zColors = { roots: '#C8894A', stem: '#5AAF78', leaves: '#4A9E5C', flowers: '#D4779A', breath: '#6ABBE4' }
  const inp = { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg)', color: 'var(--text2)', fontSize: 13, fontFamily: "'Jost',sans-serif", outline: 'none', width: '100%', boxSizing: 'border-box', appearance: 'none', WebkitAppearance: 'none' }
  const label = { fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8, display: 'block' }

  useEffect(() => {
    setRituel(''); setTitle(''); setOptRituels([]); setOptTitles([]); setExercise(null)
    if (!zone) return
    supabase.from('rituels').select('rituel').eq('zone', zone)
      .then(({ data }) => { if (data) setOptRituels([...new Set(data.map(r => r.rituel))]) })
  }, [zone])

  useEffect(() => {
    setTitle(''); setOptTitles([]); setExercise(null)
    if (!zone || !rituel) return
    supabase.from('rituels').select('title, mode').eq('zone', zone).eq('rituel', rituel).order('n')
      .then(({ data }) => { if (data) setOptTitles(data.map(r => ({ title: r.title, mode: r.mode }))) })
  }, [rituel])

  useEffect(() => {
    setExercise(null)
    if (!zone || !rituel || !title) return
    setLoading(true)
    supabase.from('rituels').select('*').eq('zone', zone).eq('rituel', rituel).eq('title', title).single()
      .then(({ data }) => {
        setLoading(false)
        if (!data) return
        setExercise(data); setDesc(data.desc || ''); setDur(data.dur || '')
        const t = data.tool
        if (!t) { setToolType('none'); return }
        setToolType(t.type || 'none')
        if (t.type === 'breath') setToolObj({ inhale: t.inhale || 5, hold: t.hold || 0, exhale: t.exhale || 5, holdEmpty: t.holdEmpty || 0, cycles: t.cycles || 5 })
      })
  }, [title])

  useEffect(() => { setEditRituel(exercise?.rituel || '') }, [exercise])
  useEffect(() => { setEditTitle(exercise?.title   || '') }, [exercise])

  const toggleZone = (k) => {
    const next = openZone === k ? '' : k
    setOpenZone(next)
    if (next !== zone) { setZone(next); setRituel(''); setTitle(''); setExercise(null) }
  }

  const handleSave = async () => {
    if (!exercise) return
    setSaving(true)
    const tool = toolType === 'none' ? null : toolType === 'breath' ? { type: 'breath', ...toolObj } : { type: toolType }
    const { error } = await supabase.from('rituels')
      .update({ rituel: editRituel, title: editTitle, desc, dur, tool, updated_at: new Date().toISOString() })
      .eq('n', exercise.n)
    setSaving(false)
    if (error) { showToast('✗ Erreur : ' + error.message); return }
    if (window.__PLANT_RITUALS_CACHE__) delete window.__PLANT_RITUALS_CACHE__
    showToast('✓ Enregistré — MaFleur se mettra à jour au prochain chargement')
  }

  const zc = zColors[zone] || '#96d485'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
      {/* ── Colonne gauche : accordéon ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 20 }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border2)' }}>
          Sélectionner un exercice
        </div>
        {Object.entries(ZONES_RITUELS).map(([k, v]) => {
          const isOpen = openZone === k
          return (
            <div key={k} style={{ borderRadius: 10, overflow: 'hidden', border: isOpen ? `1px solid ${v.color}35` : '1px solid transparent', background: isOpen ? `${v.color}08` : 'transparent', transition: 'all .2s' }}>
              <button onClick={() => toggleZone(k)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontSize: 13, textAlign: 'left', color: isOpen ? v.color : 'var(--text3)', transition: 'color .15s' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOpen ? v.color : 'rgba(255,255,255,0.18)', flexShrink: 0, transition: 'background .15s' }} />
                <span style={{ flex: 1 }}>{v.name}</span>
                <span style={{ fontSize: 10, opacity: .5, transition: 'transform .2s', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
              </button>
              {isOpen && optRituels.length > 0 && (
                <div style={{ padding: '0 8px 8px' }}>
                  {optRituels.map(r => {
                    const isRituelOpen = rituel === r
                    return (
                      <div key={r}>
                        <button onClick={() => { setRituel(isRituelOpen ? '' : r); setTitle(''); setExercise(null) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 8, background: isRituelOpen ? `${v.color}12` : 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontSize: 12, textAlign: 'left', color: isRituelOpen ? 'var(--text2)' : 'var(--text3)', transition: 'all .15s' }}>
                          <span style={{ fontSize: 9, opacity: .4, transition: 'transform .2s', display: 'inline-block', transform: isRituelOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
                          {r}
                        </button>
                        {isRituelOpen && optTitles.length > 0 && (
                          <div style={{ marginLeft: 16, marginBottom: 4 }}>
                            {optTitles.map(({ title: t, mode }) => (
                              <button key={t} onClick={() => setTitle(t)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 8px', borderRadius: 6, background: title === t ? `${v.color}18` : 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontSize: 11, textAlign: 'left', color: title === t ? v.color : 'var(--text3)', transition: 'all .15s' }}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: title === t ? v.color : 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                                {t}
                                {mode && <span style={{ marginLeft: 'auto', fontSize: 9, opacity: .4 }}>{mode}</span>}
                              </button>
                            ))}
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

      {/* ── Colonne droite : éditeur ── */}
      <div>
        {!exercise && !loading && (
          <div className="adm-empty">Sélectionnez un exercice dans le panneau gauche</div>
        )}
        {loading && <div className="adm-empty">Chargement…</div>}
        {exercise && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: `${zc}10`, border: `1px solid ${zc}30` }}>
              <div style={{ fontSize: 10, color: zc, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                {ZONES_RITUELS[zone]?.name} — Exercice #{exercise.n}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{exercise.rituel} / {exercise.title}</div>
            </div>
            <div>
              <span style={label}>Nom du rituel</span>
              <input value={editRituel} onChange={e => setEditRituel(e.target.value)} style={inp} />
            </div>
            <div>
              <span style={label}>Titre de l'exercice</span>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={inp} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={label}>Description</span>
                <span style={{ fontSize: 10, color: desc.length > 450 ? '#e87060' : 'rgba(242,237,224,0.22)' }}>{desc.length} / 500</span>
              </div>
              <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 500))} rows={6} style={{ ...inp, resize: 'vertical', lineHeight: 1.8 }} />
            </div>
            <div>
              <span style={label}>Durée (ex: "5 min")</span>
              <input value={dur} onChange={e => setDur(e.target.value)} placeholder="5 min" style={{ ...inp, maxWidth: 160 }} />
            </div>
            <div>
              <span style={label}>Outil interactif</span>
              <select value={toolType} onChange={e => setToolType(e.target.value)} style={{ ...inp, maxWidth: 220 }}>
                <option value="none">Aucun</option>
                <option value="breath">Respiration guidée</option>
                <option value="timer">Minuteur simple</option>
              </select>
            </div>
            {toolType === 'breath' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, padding: '14px 16px', background: 'rgba(106,187,228,0.07)', border: '1px solid rgba(106,187,228,0.20)', borderRadius: 10 }}>
                {[['inhale', 'Inspire (s)'], ['hold', 'Rétention (s)'], ['exhale', 'Expire (s)'], ['holdEmpty', 'Vide (s)'], ['cycles', 'Cycles']].map(([k, lbl]) => (
                  <div key={k}>
                    <span style={label}>{lbl}</span>
                    <input type="number" min="0" max="60" value={toolObj[k]} onChange={e => setToolObj(o => ({ ...o, [k]: Number(e.target.value) }))} style={inp} />
                  </div>
                ))}
              </div>
            )}
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '12px 24px', borderRadius: 10, border: `1px solid ${zc}50`, background: `${zc}18`, color: zc, fontSize: 13, fontWeight: 500, cursor: saving ? 'wait' : 'pointer', fontFamily: "'Jost',sans-serif", letterSpacing: '.06em', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enregistrement…' : '✓ Enregistrer'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  VentesPartenairesAdmin
// ═══════════════════════════════════════════════════════════
function VentesPartenairesAdmin({ showToast }) {
  const [ventes,  setVentes]  = useState([])
  const [loading, setLoading] = useState(true)
  const [mois,    setMois]    = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const load = () => {
    setLoading(true)
    supabase.from('ventes_partenaires')
      .select('*, partenaires(nom_boutique, email, code_vendeur, user_id, type_vendeur), produits(titre, type, categorie)')
      .eq('mois_facturation', mois).order('created_at', { ascending: false })
      .then(({ data }) => { setVentes(data || []); setLoading(false) })
  }
  useEffect(() => { load() }, [mois])

  const byPro = ventes.reduce((acc, v) => {
    const key = v.partenaires?.user_id || v.partenaire_id
    if (!acc[key]) acc[key] = { partenaire: v.partenaires, user_id: v.partenaires?.user_id || null, ventes: [], total_brut: 0, total_commission: 0, total_net: 0, all_reverse: true }
    acc[key].ventes.push(v)
    acc[key].total_brut       += Number(v.montant_brut)
    acc[key].total_commission += Number(v.commission)
    acc[key].total_net        += Number(v.montant_net)
    if (v.statut !== 'reverse') acc[key].all_reverse = false
    return acc
  }, {})

  const marquerReverses = async (key) => {
    const partenaireIds = [...new Set(byPro[key].ventes.map(v => v.partenaire_id))]
    const ids = ventes.filter(v => partenaireIds.includes(v.partenaire_id) && v.statut === 'en_attente').map(v => v.id)
    if (!ids.length) return
    const { error } = await supabase.from('ventes_partenaires').update({ statut: 'reverse', reverse_le: new Date().toISOString() }).in('id', ids)
    if (error) { showToast('✗ ' + error.message); return }
    showToast('✓ Reversement marqué'); load()
  }

  const fmt = (n) => `${Number(n).toFixed(2).replace('.', ',')} €`
  const inp = { padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border2)', background: 'var(--bg)', color: 'var(--text2)', fontSize: 12, fontFamily: "'Jost',sans-serif", outline: 'none' }

  return (
    <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Ventes partenaires</div>
        <input type="month" value={mois} onChange={e => setMois(e.target.value)} style={inp} />
      </div>
      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Chargement…</div>
      ) : Object.keys(byPro).length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Aucune vente ce mois</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(byPro).map(([proKey, data]) => (
            <div key={proKey} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>
                    {data.partenaire?.nom_boutique}
                    {data.user_id && <span style={{ marginLeft: 8, fontSize: 9, padding: '1px 6px', borderRadius: 10, background: 'rgba(180,160,240,0.12)', border: '1px solid rgba(180,160,240,0.25)', color: '#b4a0f0' }}>🔗 MaFleur</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{data.partenaire?.email} · {data.ventes.length} vente{data.ventes.length > 1 ? 's' : ''}</div>
                </div>
                {!data.all_reverse ? (
                  <button onClick={() => marquerReverses(proKey)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(150,212,133,0.12)', border: '1px solid var(--greenT)', color: 'var(--green)' }}>✓ Marquer reversé</button>
                ) : (
                  <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: 'rgba(150,212,133,0.10)', border: '1px solid var(--greenT)', color: 'var(--green)' }}>✓ Reversé</span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                {[{ lbl: 'Total brut', val: fmt(data.total_brut), color: 'var(--text2)' }, { lbl: 'Commission 15%', val: fmt(data.total_commission), color: 'var(--gold)' }, { lbl: 'À reverser', val: fmt(data.total_net), color: '#96d485' }].map(({ lbl, val, color }) => (
                  <div key={lbl} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{lbl}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 300, color }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {data.ventes.map(v => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ flex: 1, fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.produits?.titre || 'Produit supprimé'}
                      {v.source === 'atelier' && <span style={{ marginLeft: 6, fontSize: 9, color: '#82c8f0' }}>📖 Atelier</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{fmt(v.montant_brut)}</div>
                    <div style={{ fontSize: 11, color: 'var(--gold)', whiteSpace: 'nowrap' }}>-{fmt(v.commission)}</div>
                    <div style={{ fontSize: 11, color: '#96d485', whiteSpace: 'nowrap', fontWeight: 500 }}>{fmt(v.montant_net)}</div>
                    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, flexShrink: 0, background: v.statut === 'reverse' ? 'rgba(150,212,133,0.10)' : 'rgba(232,192,96,0.10)', border: v.statut === 'reverse' ? '1px solid rgba(150,212,133,0.25)' : '1px solid rgba(232,192,96,0.25)', color: v.statut === 'reverse' ? '#96d485' : '#e8c060' }}>
                      {v.statut === 'reverse' ? '✓ reversé' : '⏳ en attente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  ProWallet — Solde + historique inline dans la fiche pro
// ═══════════════════════════════════════════════════════════
function ProWallet({ userId, partenaireId }) {
  const [lumens,      setLumens]      = useState(null)
  const [ventesE,     setVentesE]     = useState([])
  const [ventesL,     setVentesL]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('euros')
  const [openReverse, setOpenReverse] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.from('lumen_transactions').select('amount').eq('user_id', userId),
      supabase.from('ventes_partenaires').select('montant_brut, commission, montant_net, statut, mois_facturation, source, reverse_le, produits(titre)').eq('partenaire_id', partenaireId).order('created_at', { ascending: false }).limit(20),
      supabase.from('lumen_transactions').select('amount, reason, meta, created_at').eq('user_id', userId).in('reason', ['vente_produit', 'vente_atelier']).order('created_at', { ascending: false }).limit(20),
    ]).then(([lumenRes, ventesRes, lumensVentesRes]) => {
      setLumens((lumenRes.data || []).reduce((s, t) => s + Number(t.amount), 0))
      setVentesE(ventesRes.data || [])
      setVentesL(lumensVentesRes.data || [])
      setLoading(false)
    })
  }, [userId, partenaireId])

  const fmt = (n) => `${Number(n).toFixed(2).replace('.', ',')} €`
  const totalNet    = ventesE.filter(v => v.statut === 'en_attente').reduce((s, v) => s + Number(v.montant_net), 0)
  const totalLumens = ventesL.reduce((s, v) => s + Number(v.amount), 0)

  if (loading) return <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>Chargement…</div>

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[{ bg: 'rgba(150,212,133,0.06)', border: 'rgba(150,212,133,0.15)', lbl: 'À reverser ce mois', val: fmt(totalNet), color: '#96d485' }, { bg: 'rgba(232,192,96,0.06)', border: 'rgba(232,192,96,0.15)', lbl: 'Lumens reçus (ventes)', val: `${totalLumens} ✦`, color: '#e8c060' }, { bg: 'rgba(180,160,240,0.06)', border: 'rgba(180,160,240,0.15)', lbl: 'Solde Lumens total', val: `${lumens ?? '…'} ✦`, color: '#b4a0f0' }].map(({ bg, border, lbl, val, color }) => (
          <div key={lbl} style={{ padding: '10px 12px', borderRadius: 8, background: bg, border: `1px solid ${border}` }}>
            <div style={{ fontSize: 9, color, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3, opacity: 0.7 }}>{lbl}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 300, color }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 10 }}>
        {[['euros', '💶 Ventes €'], ['lumens', '✦ Ventes Lumens']].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '5px 14px', fontSize: 10, background: 'none', border: 'none', borderBottom: tab === id ? '2px solid #e8c060' : '2px solid transparent', color: tab === id ? '#e8c060' : 'rgba(242,237,224,0.35)', cursor: 'pointer', fontFamily: "'Jost',sans-serif", marginBottom: -1, letterSpacing: '.04em' }}>
            {lbl}
          </button>
        ))}
      </div>
      {tab === 'euros' && (ventesE.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>Aucune vente enregistrée.</div>
      ) : (() => {
        const enAttente  = ventesE.filter(v => v.statut !== 'reverse')
        const reversees  = ventesE.filter(v => v.statut === 'reverse')
        const totalRev   = reversees.reduce((s, v) => s + Number(v.montant_net), 0)
        const lastDate   = reversees.filter(v => v.reverse_le).sort((a, b) => new Date(b.reverse_le) - new Date(a.reverse_le))[0]?.reverse_le
        const LigneVente = ({ v, showStatut }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: 9, color: 'rgba(242,237,224,0.25)', flexShrink: 0 }}>{v.mois_facturation}</div>
            <div style={{ flex: 1, fontSize: 11, color: 'rgba(242,237,224,0.60)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.produits?.titre || 'Produit'}{v.source === 'atelier' && <span style={{ marginLeft: 5, fontSize: 9, color: '#82c8f0' }}>📖</span>}</div>
            <div style={{ fontSize: 11, color: '#96d485', fontWeight: 500, flexShrink: 0 }}>{fmt(v.montant_net)}</div>
            {showStatut && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, flexShrink: 0, background: 'rgba(150,212,133,0.10)', color: '#96d485' }}>reversé</span>}
          </div>
        )
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 280, overflowY: 'auto' }}>
            {enAttente.map((v, i) => <LigneVente key={i} v={v} showStatut={false} />)}
            {reversees.length > 0 && (
              <div style={{ marginTop: enAttente.length ? 6 : 0 }}>
                <div onClick={() => setOpenReverse(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: 'rgba(150,212,133,0.06)', border: '1px solid rgba(150,212,133,0.15)', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ flex: 1, fontSize: 11, color: '#96d485', fontWeight: 500 }}>Total reversé</div>
                  <div style={{ fontSize: 12, color: '#96d485', fontWeight: 600 }}>{fmt(totalRev)}</div>
                  {lastDate && <div style={{ fontSize: 10, color: 'rgba(150,212,133,0.55)' }}>{new Date(lastDate).toLocaleDateString('fr-FR')}</div>}
                  <div style={{ fontSize: 10, color: 'rgba(150,212,133,0.50)', marginLeft: 4 }}>{openReverse ? '▲' : '▼'}</div>
                </div>
                {openReverse && <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 3, paddingLeft: 8 }}>{reversees.map((v, i) => <LigneVente key={i} v={v} showStatut={true} />)}</div>}
              </div>
            )}
          </div>
        )
      })())}
      {tab === 'lumens' && (ventesL.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>Aucune vente en Lumens.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
          {ventesL.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: 9, color: 'rgba(242,237,224,0.25)', flexShrink: 0 }}>{new Date(v.created_at).toLocaleDateString('fr-FR')}</div>
              <div style={{ flex: 1, fontSize: 11, color: 'rgba(242,237,224,0.60)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.meta?.produit_titre || v.reason}</div>
              <div style={{ fontSize: 12, color: '#e8c060', fontWeight: 500, flexShrink: 0 }}>+{v.amount} ✦</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  PartenairesAdmin
// ═══════════════════════════════════════════════════════════
function PartenairesAdmin({ showToast }) {
  const [partenaires, setPartenaires] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState('en_attente')
  const [allUsers,    setAllUsers]    = useState([])
  const [linkingId,   setLinkingId]   = useState(null)
  const [expandedId,  setExpandedId]  = useState(null)

  const load = () => {
    setLoading(true)
    supabase.from('partenaires').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setPartenaires(data || []); setLoading(false) })
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    supabase.from('users').select('id, display_name, email').order('display_name')
      .then(({ data }) => setAllUsers(data || []))
  }, [])

  const linkUser = async (partenaireId, userId) => {
    const { error } = await supabase.from('partenaires').update({ user_id: userId || null }).eq('id', partenaireId)
    if (error) { showToast('✗ ' + error.message); return }
    showToast(userId ? '✓ Compte MaFleur lié' : '✓ Lien supprimé'); setLinkingId(null); load()
  }

  const filtered = filter === 'all' ? partenaires : partenaires.filter(f => f.statut === filter)
  const pending   = partenaires.filter(f => f.statut === 'en_attente').length
  const PARTENAIRE_STRIPE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '') + '/functions/v1/partenaire-stripe'

  const update = async (id, patch, msg) => {
    const { error } = await supabase.from('partenaires').update(patch).eq('id', id)
    if (error) { showToast('✗ ' + error.message); return }
    if (patch.statut === 'actif') {
      const { data: produits } = await supabase.from('produits').select('id, titre, description, prix, image_url, stripe_price_id, type').eq('partenaire_id', id).eq('type', 'digital').is('stripe_price_id', null)
      const partenaireData = partenaires.find(f => f.id === id)
      if (produits?.length && partenaireData?.code_vendeur) {
        for (const p of produits) {
          if (!p.prix) continue
          try {
            await fetch(PARTENAIRE_STRIPE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ produit_id: p.id, code_vendeur: partenaireData.code_vendeur, titre: p.titre, description: p.description, prix: p.prix, image_url: p.image_url }) })
          } catch (e) { console.warn('[stripe] produit', p.id, e) }
        }
        await supabase.from('produits').update({ statut: 'actif' }).eq('partenaire_id', id).eq('statut', 'en_attente')
      }
    }
    showToast(msg); load()
  }

  const sColors = { en_attente: '#e8c060', actif: '#96d485', suspendu: 'rgba(255,140,140,0.7)' }

  return (
    <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Partenaires</div>
        {pending > 0 && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(232,192,96,0.12)', border: '1px solid rgba(232,192,96,0.30)', color: '#e8c060', fontWeight: 500 }}>{pending} en attente de validation</span>}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['en_attente', 'actif', 'suspendu', 'all'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: "'Jost',sans-serif", border: filter === s ? `1px solid ${sColors[s] || '#96d485'}55` : '1px solid rgba(255,255,255,0.08)', background: filter === s ? `${sColors[s] || '#96d485'}15` : 'transparent', color: filter === s ? (sColors[s] || '#96d485') : 'rgba(242,237,224,0.35)' }}>
            {s === 'all' ? 'Tous' : s === 'en_attente' ? '⏳ En attente' : s === 'actif' ? '✓ Actifs' : '⛔ Suspendus'}
          </button>
        ))}
      </div>
      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Aucun partenaire dans cette catégorie</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 12 }}>
          {filtered.map(f => (
            <div key={f.id} style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>
                    {f.nom_boutique}
                    <span style={{ marginLeft: 8, fontSize: 10, color: 'rgba(242,237,224,0.30)', fontWeight: 400 }}>{f.type_vendeur === 'professionnel' ? '🏪 Pro' : '🌱 Particulier'}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(242,237,224,0.35)', marginTop: 3 }}>
                    Code : <span style={{ fontFamily: 'monospace', color: 'rgba(242,237,224,0.55)' }}>{f.code_vendeur}</span>
                    {f.email ? ` · ${f.email}` : ''}{f.telephone ? ` · ${f.telephone}` : ''}
                  </div>
                  {f.nom_entreprise && <div style={{ fontSize: 10, color: 'rgba(242,237,224,0.30)', marginTop: 2 }}>{f.nom_entreprise}{f.siret ? ` · SIRET ${f.siret}` : ''}</div>}
                  {f.description && <div style={{ fontSize: 11, color: 'rgba(242,237,224,0.40)', marginTop: 5, lineHeight: 1.6, fontStyle: 'italic' }}>{f.description}</div>}
                </div>
                <span style={{ fontSize: 9, padding: '3px 10px', borderRadius: 20, flexShrink: 0, background: `${sColors[f.statut] || 'rgba(255,255,255,0.05)'}15`, border: `1px solid ${sColors[f.statut] || 'rgba(255,255,255,0.08)'}40`, color: sColors[f.statut] || 'rgba(242,237,224,0.35)' }}>{f.statut}</span>
              </div>
              {f.type_vendeur === 'professionnel' && (
                <div style={{ marginBottom: 8, padding: '8px 12px', background: 'rgba(180,160,240,0.06)', border: '1px solid rgba(180,160,240,0.18)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'rgba(180,160,240,0.80)', fontWeight: 500, flexShrink: 0 }}>🔗</span>
                    {linkingId === f.id ? (
                      <>
                        <select onChange={e => linkUser(f.id, e.target.value)} defaultValue=""
                          style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: '#0e1a0e', color: 'rgba(242,237,224,0.85)', fontSize: 11, fontFamily: "'Jost',sans-serif", outline: 'none' }}>
                          <option value="" disabled>Choisir…</option>
                          <option value="">— Délier</option>
                          {allUsers.map(u => <option key={u.id} value={u.id}>{u.display_name ? `${u.display_name} — ${u.email}` : u.email}</option>)}
                        </select>
                        <button onClick={() => setLinkingId(null)} style={{ background: 'none', border: 'none', color: 'rgba(242,237,224,0.35)', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>✕</button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontSize: 11, color: f.user_id ? 'rgba(242,237,224,0.60)' : 'rgba(242,237,224,0.28)', fontStyle: f.user_id ? 'normal' : 'italic' }}>
                          {f.user_id ? (() => { const u = allUsers.find(u => u.id === f.user_id); return u ? `${u.display_name || ''} ${u.email}`.trim() : f.user_id.slice(0, 8) })() : 'Non lié à un compte MaFleur'}
                        </span>
                        <button onClick={() => setLinkingId(f.id)} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(180,160,240,0.10)', border: '1px solid rgba(180,160,240,0.25)', color: '#b4a0f0', flexShrink: 0 }}>{f.user_id ? '↻' : '+ Lier'}</button>
                      </>
                    )}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 10, color: 'rgba(242,237,224,0.30)' }}>Publication :</span>
                {[['direct', '⚡ Direct', 'rgba(150,212,133,0.15)', 'rgba(150,212,133,0.35)', '#96d485'], ['validation', '✋ Validation', 'rgba(232,192,96,0.15)', 'rgba(232,192,96,0.35)', '#e8c060']].map(([mode, lbl, bgA, borderA, colorA]) => (
                  <button key={mode} onClick={() => update(f.id, { publication_mode: mode }, `✓ ${lbl} activé`)}
                    style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: f.publication_mode === mode ? bgA : 'rgba(255,255,255,0.04)', border: `1px solid ${f.publication_mode === mode ? borderA : 'rgba(255,255,255,0.08)'}`, color: f.publication_mode === mode ? colorA : 'rgba(242,237,224,0.35)' }}>
                    {lbl}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {f.statut !== 'actif'     && <button onClick={() => update(f.id, { statut: 'actif' },      `✓ ${f.nom_boutique} activé`)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(150,212,133,0.12)', border: '1px solid var(--greenT)', color: 'var(--green)' }}>✓ Valider</button>}
                {f.statut !== 'suspendu'  && <button onClick={() => update(f.id, { statut: 'suspendu' },  '✓ Suspendu')} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(210,80,80,0.08)', border: '1px solid rgba(210,80,80,0.25)', color: 'rgba(255,140,140,0.70)' }}>⛔ Suspendre</button>}
                {f.statut !== 'en_attente' && <button onClick={() => update(f.id, { statut: 'en_attente' }, '✓ Remis en attente')} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(242,237,224,0.45)' }}>↺ En attente</button>}
                {f.type_vendeur === 'professionnel' && <button onClick={() => setExpandedId(expandedId === f.id ? null : f.id)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: expandedId === f.id ? 'rgba(232,192,96,0.15)' : 'rgba(232,192,96,0.06)', border: '1px solid rgba(232,192,96,0.25)', color: '#e8c060' }}>{expandedId === f.id ? '▲ Fermer' : '✦ Solde & Historique'}</button>}
              </div>
              {expandedId === f.id && f.user_id && <ProWallet userId={f.user_id} partenaireId={f.id} />}
              {expandedId === f.id && !f.user_id && <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(232,192,96,0.60)', fontStyle: 'italic' }}>Liez d'abord ce partenaire à un compte MaFleur pour voir son solde.</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  BoutiqueEditor
// ═══════════════════════════════════════════════════════════
const TYPE_OPTS = [
  { val: 'digital',  label: '🎧 Digital',    color: '#b4a0f0' },
  { val: 'physique', label: '🌿 Partenaires', color: '#82c8a0' },
  { val: 'occasion', label: '🤝 Occasion',    color: '#e8c060' },
]
const CAT_OPTS = {
  digital:  ['Audio', 'Formation', 'E-book'],
  physique: ['Livre', 'Bijou', 'Pierre', 'Huile essentielle', 'Autre'],
  occasion: ['Livres', 'Bijoux', 'Pierres', 'Accessoires', 'Autres'],
}
const EMPTY_FORM = {
  type: 'digital', categorie: 'Audio', titre: '', description: '',
  prix: '', image_url: '', lien_externe: '', stripe_price_id: '',
  vendeur_nom: '', vendeur_contact: '', statut: 'actif', ordre: 0, storage_path: '',
  accepte_lumens: false, prix_lumens: '',
}

function BoutiqueEditor({ showToast }) {
  const [produits,        setProduits]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [filterType,      setFilterType]      = useState('all')
  const [form,            setForm]            = useState(EMPTY_FORM)
  const [editId,          setEditId]          = useState(null)
  const [showForm,        setShowForm]        = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [audioUploading,  setAudioUploading]  = useState(false)
  const [attribuerProduit,setAttribuerProduit]= useState(null)
  const [users,           setUsers]           = useState([])
  const [usersLoaded,     setUsersLoaded]     = useState(false)
  const [attribuant,      setAttribuant]      = useState(false)

  const inp = { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg)', color: 'var(--text2)', fontSize: 13, fontFamily: "'Jost',sans-serif", outline: 'none', width: '100%', boxSizing: 'border-box', appearance: 'none', WebkitAppearance: 'none' }
  const lbl = { fontSize: 10, color: 'rgba(242,237,224,0.38)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6, display: 'block' }
  const zColors = { digital: '#b4a0f0', physique: '#82c8a0', occasion: '#e8c060', all: '#96d485' }

  const load = () => {
    setLoading(true)
    supabase.from('produits').select('*').order('ordre').order('created_at', { ascending: false })
      .then(({ data }) => { setProduits(data || []); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const filtered  = filterType === 'all' ? produits : produits.filter(p => p.type === filterType)
  const openNew   = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
  const openEdit  = (p) => {
    setForm({ type: p.type, categorie: p.categorie || '', titre: p.titre || '', description: p.description || '', prix: p.prix ?? '', image_url: p.image_url || '', lien_externe: p.lien_externe || '', stripe_price_id: p.stripe_price_id || '', vendeur_nom: p.vendeur_nom || '', vendeur_contact: p.vendeur_contact || '', statut: p.statut || 'actif', ordre: p.ordre || 0, storage_path: p.storage_path || '', accepte_lumens: p.accepte_lumens || false, prix_lumens: p.prix_lumens ?? '' })
    setEditId(p.id); setShowForm(true)
  }

  const loadUsers = () => {
    if (usersLoaded) return
    supabase.from('users').select('id, display_name, email').order('display_name')
      .then(({ data }) => { setUsers(data || []); setUsersLoaded(true) })
  }

  const handleAttribuer = async (userId) => {
    if (!attribuerProduit || !userId) return
    setAttribuant(true)
    const { error } = await supabase.from('achats').upsert({ user_id: userId, produit_id: attribuerProduit.id, statut: 'offert', montant: 0 }, { onConflict: 'user_id,produit_id' })
    setAttribuant(false)
    if (error) { showToast('✗ ' + error.message); return }
    showToast(`✓ "${attribuerProduit.titre}" attribué`); setAttribuerProduit(null)
  }

  const handleAudioUpload = async (file) => {
    if (!file) return
    setAudioUploading(true)
    const path = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await supabase.storage.from('audio-produits').upload(path, file, { upsert: true })
    setAudioUploading(false)
    if (error) { showToast('✗ Upload : ' + error.message); return }
    setForm(f => ({ ...f, storage_path: path })); showToast('✓ Fichier audio uploadé')
  }

  const STRIPE_PRODUCT_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '') + '/functions/v1/stripe-product'

  const handleSave = async () => {
    if (!form.titre.trim()) { showToast('✗ Titre obligatoire'); return }
    setSaving(true)
    const payload = { ...form, prix: form.prix !== '' ? parseFloat(form.prix) : null, ordre: parseInt(form.ordre) || 0, updated_at: new Date().toISOString() }
    delete payload._audioFile
    let savedId = editId
    if (editId) {
      const { error } = await supabase.from('produits').update(payload).eq('id', editId)
      if (error) { setSaving(false); showToast('✗ ' + error.message); return }
    } else {
      const { data, error } = await supabase.from('produits').insert({ ...payload, created_at: new Date().toISOString() }).select('id').single()
      if (error) { setSaving(false); showToast('✗ ' + error.message); return }
      savedId = data.id
    }
    if (form.type === 'digital' && form.prix && !form.stripe_price_id && savedId) {
      try {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token
        if (!token) { showToast('✓ Produit sauvegardé — ⚠ Stripe : session expirée'); setSaving(false); setShowForm(false); load(); return }
        const res  = await fetch(STRIPE_PRODUCT_URL, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ produit_id: savedId, titre: form.titre, description: form.description, prix: form.prix, image_url: form.image_url }) })
        const data = await res.json()
        if (res.ok && data.price_id) {
          await supabase.from('produits').update({ stripe_price_id: data.price_id }).eq('id', savedId)
          showToast(`✓ Produit + Stripe créés — ${data.price_id}`)
        } else {
          showToast(`✓ Sauvegardé — ⚠ Stripe (${res.status}) : ${data.error || JSON.stringify(data)}`)
        }
      } catch (e) { showToast('✓ Sauvegardé — ⚠ Stripe : ' + (e instanceof Error ? e.message : String(e))) }
    } else {
      showToast(editId ? '✓ Produit mis à jour' : '✓ Produit ajouté')
    }
    setSaving(false); setShowForm(false); load()
  }

  const handleDelete   = async (id, titre) => {
    if (!window.confirm(`Supprimer "${titre}" ?`)) return
    const { error } = await supabase.from('produits').delete().eq('id', id)
    if (error) { showToast('✗ ' + error.message); return }
    showToast('✓ Supprimé'); load()
  }
  const toggleStatut = async (p) => {
    await supabase.from('produits').update({ statut: p.statut === 'actif' ? 'inactif' : 'actif' }).eq('id', p.id); load()
  }

  const tc = zColors[form.type] || '#96d485'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {['all', 'digital', 'physique', 'occasion'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            style={{ padding: '5px 14px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: "'Jost',sans-serif", border: filterType === t ? `1px solid ${zColors[t]}55` : '1px solid rgba(255,255,255,0.10)', background: filterType === t ? `${zColors[t]}15` : 'transparent', color: filterType === t ? zColors[t] : 'rgba(242,237,224,0.38)' }}>
            {t === 'all' ? 'Tous' : t === 'digital' ? '🎧 Digital' : t === 'physique' ? '🌿 Partenaires' : '🤝 Occasion'}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={openNew} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(150,212,133,0.12)', border: '1px solid rgba(150,212,133,0.35)', color: '#96d485', fontWeight: 500 }}>+ Ajouter un produit</button>
        </div>
      </div>

      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', padding: '20px 0' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>Aucun produit — cliquez sur "+ Ajouter"</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map(p => {
            const c = zColors[p.type] || '#96d485'
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 10, border: `1px solid ${p.statut === 'actif' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)'}`, background: p.statut === 'actif' ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.01)', opacity: p.statut === 'actif' ? 1 : 0.5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'rgba(242,237,224,0.88)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titre}</div>
                  <div style={{ fontSize: 10, color: 'rgba(242,237,224,0.30)', marginTop: 2 }}>{p.categorie} · {p.prix != null ? `${Number(p.prix).toFixed(2)} €` : 'prix libre'}{p.vendeur_nom ? ` · ${p.vendeur_nom}` : ''}</div>
                </div>
                <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, flexShrink: 0, background: p.statut === 'actif' ? 'rgba(150,212,133,0.10)' : 'rgba(255,255,255,0.05)', border: p.statut === 'actif' ? '1px solid rgba(150,212,133,0.25)' : '1px solid rgba(255,255,255,0.07)', color: p.statut === 'actif' ? '#96d485' : 'rgba(242,237,224,0.30)' }}>{p.statut}</span>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => toggleStatut(p)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(242,237,224,0.45)' }}>{p.statut === 'actif' ? 'Désactiver' : 'Activer'}</button>
                  {p.type === 'digital' && p.storage_path && <button onClick={() => { setAttribuerProduit(p); loadUsers() }} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(180,160,240,0.10)', border: '1px solid rgba(180,160,240,0.30)', color: '#b4a0f0' }}>🎁 Attribuer</button>}
                  <button onClick={() => openEdit(p)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: `${c}12`, border: `1px solid ${c}35`, color: c }}>✏ Modifier</button>
                  <button onClick={() => handleDelete(p.id, p.titre)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(210,80,80,0.08)', border: '1px solid rgba(210,80,80,0.25)', color: 'rgba(255,140,140,0.7)' }}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <VentesPartenairesAdmin showToast={showToast} />
      <PartenairesAdmin showToast={showToast} />

      {/* Modal attribution */}
      {attribuerProduit && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', padding: 20 }} onClick={() => setAttribuerProduit(null)}>
          <div style={{ width: '100%', maxWidth: 480, borderRadius: 18, background: '#12201a', border: '1px solid rgba(255,255,255,0.09)', padding: '24px 28px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 300, color: 'rgba(242,237,224,0.88)' }}>Attribuer l'accès</div>
              <button onClick={() => setAttribuerProduit(null)} style={{ background: 'none', border: 'none', color: 'rgba(242,237,224,0.35)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(180,160,240,0.70)', marginBottom: 16, padding: '8px 12px', background: 'rgba(180,160,240,0.06)', border: '1px solid rgba(180,160,240,0.20)', borderRadius: 8 }}>🎧 {attribuerProduit.titre}</div>
            <div style={{ fontSize: 10, color: 'rgba(242,237,224,0.38)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Choisir un utilisateur</div>
            {!usersLoaded ? (
              <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Chargement…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 360, overflowY: 'auto' }}>
                {users.map(u => (
                  <button key={u.id} onClick={() => handleAttribuer(u.id)} disabled={attribuant}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontFamily: "'Jost',sans-serif", textAlign: 'left', opacity: attribuant ? 0.6 : 1 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(180,160,240,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#b4a0f0', flexShrink: 0, fontWeight: 500 }}>{(u.display_name || u.email || '?').charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'rgba(242,237,224,0.80)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.display_name || u.email}</div>
                      {u.display_name && <div style={{ fontSize: 10, color: 'rgba(242,237,224,0.30)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>}
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(180,160,240,0.50)' }}>Attribuer →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulaire produit */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }} onClick={() => setShowForm(false)}>
          <div style={{ width: '100%', maxWidth: 640, borderRadius: '22px 22px 0 0', background: '#12201a', border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none', padding: '24px 28px 48px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 300, color: 'rgba(242,237,224,0.88)' }}>{editId ? 'Modifier le produit' : 'Nouveau produit'}</div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(242,237,224,0.35)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <span style={lbl}>Type</span>
                  <div style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(180,160,240,0.30)', background: 'rgba(180,160,240,0.08)', color: '#b4a0f0', fontSize: 13, fontFamily: "'Jost',sans-serif" }}>🎧 Digital</div>
                </div>
                <div>
                  <span style={lbl}>Catégorie</span>
                  <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} style={inp}>{(CAT_OPTS[form.type] || []).map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
              </div>
              <div><span style={lbl}>Titre *</span><input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="Nom du produit" style={inp} /></div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={lbl}>Description</span>
                  <span style={{ fontSize: 10, color: form.description.length > 320 ? '#e87060' : 'rgba(242,237,224,0.22)' }}>{form.description.length} / 350</span>
                </div>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value.slice(0, 350) }))} rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.8 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><span style={lbl}>Prix (€)</span><input type="number" min="0" step="0.01" value={form.prix} onChange={e => setForm(f => ({ ...f, prix: e.target.value }))} placeholder="0.00" style={inp} /></div>
                <div><span style={lbl}>Ordre d'affichage</span><input type="number" min="0" value={form.ordre} onChange={e => setForm(f => ({ ...f, ordre: e.target.value }))} style={inp} /></div>
              </div>
              <div><span style={lbl}>URL de l'image</span><input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." style={inp} /></div>
              {form.type === 'digital' && (
                <div>
                  <span style={lbl}>Fichier audio</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px dashed rgba(180,160,240,0.35)', background: 'rgba(180,160,240,0.06)', color: form.storage_path ? '#b4a0f0' : 'rgba(242,237,224,0.40)', fontSize: 12, cursor: 'pointer', fontFamily: "'Jost',sans-serif", textAlign: 'center', display: 'block' }}>
                      <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => handleAudioUpload(e.target.files[0])} />
                      {audioUploading ? '⏳ Upload en cours…' : form.storage_path ? `✓ ${form.storage_path}` : '📁 Choisir un fichier audio'}
                    </label>
                    {form.storage_path && <button onClick={() => setForm(f => ({ ...f, storage_path: '' }))} style={{ padding: '6px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer', background: 'rgba(210,80,80,0.08)', border: '1px solid rgba(210,80,80,0.25)', color: 'rgba(255,140,140,0.7)', fontFamily: "'Jost',sans-serif" }}>✕</button>}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(242,237,224,0.35)', marginTop: 5 }}>MP3, WAV, AAC — max 500 MB</div>
                </div>
              )}
              {form.type !== 'occasion' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><span style={lbl}>Lien externe</span><input value={form.lien_externe} onChange={e => setForm(f => ({ ...f, lien_externe: e.target.value }))} placeholder="https://..." style={inp} /></div>
                  <div>
                    <span style={lbl}>Stripe Price ID</span>
                    <input value={form.stripe_price_id} onChange={e => setForm(f => ({ ...f, stripe_price_id: e.target.value }))} placeholder="price_..." style={{ ...inp, color: form.stripe_price_id ? '#96d485' : undefined }} />
                    {!form.stripe_price_id && (
                      <button onClick={async () => {
                        const targetId = editId
                        if (!targetId) { showToast("Sauvegardez d'abord le produit"); return }
                        if (!form.prix) { showToast('Renseignez le prix avant de créer dans Stripe'); return }
                        showToast('⏳ Création dans Stripe…')
                        try {
                          const session = await supabase.auth.getSession()
                          const token = session.data.session?.access_token
                          if (!token) { showToast('✗ Non connecté'); return }
                          const res  = await fetch((import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '') + '/functions/v1/stripe-product', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ produit_id: targetId, titre: form.titre, description: form.description, prix: form.prix, image_url: form.image_url }) })
                          const data = await res.json()
                          if (!res.ok) { showToast('✗ Stripe (' + res.status + ') : ' + (data.error || JSON.stringify(data))); return }
                          setForm(f => ({ ...f, stripe_price_id: data.price_id })); showToast('✓ Stripe Price ID : ' + data.price_id)
                        } catch (e) { showToast('✗ Erreur réseau : ' + e.message) }
                      }} style={{ marginTop: 6, width: '100%', padding: '7px 12px', borderRadius: 8, border: '1px dashed rgba(150,212,133,0.30)', background: 'rgba(150,212,133,0.05)', color: 'rgba(150,212,133,0.60)', fontSize: 11, fontFamily: "'Jost',sans-serif", cursor: 'pointer', textAlign: 'center' }}>
                        ⚡ Créer automatiquement dans Stripe
                      </button>
                    )}
                  </div>
                </div>
              )}
              {form.type !== 'digital' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><span style={lbl}>Nom du vendeur</span><input value={form.vendeur_nom} onChange={e => setForm(f => ({ ...f, vendeur_nom: e.target.value }))} placeholder="Nom ou enseigne" style={inp} /></div>
                  <div><span style={lbl}>Contact</span><input value={form.vendeur_contact} onChange={e => setForm(f => ({ ...f, vendeur_contact: e.target.value }))} placeholder="email, lien..." style={inp} /></div>
                </div>
              )}
              <div>
                <span style={lbl}>Statut</span>
                <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} style={{ ...inp, maxWidth: 220 }}>
                  <option value="actif">Actif — visible</option>
                  <option value="inactif">Inactif — masqué</option>
                  <option value="vendu">Vendu (occasion)</option>
                </select>
              </div>
              <div style={{ padding: '14px 16px', background: 'rgba(232,192,96,0.06)', border: '1px solid rgba(232,192,96,0.20)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.accepte_lumens ? 12 : 0 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(242,237,224,0.80)', fontWeight: 500 }}>✦ Accepter les Lumens</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>L'acheteur pourra payer en Lumens ou en euros</div>
                  </div>
                  <div onClick={() => setForm(f => ({ ...f, accepte_lumens: !f.accepte_lumens }))}
                    style={{ width: 44, height: 24, borderRadius: 100, cursor: 'pointer', flexShrink: 0, background: form.accepte_lumens ? 'rgba(232,192,96,0.35)' : 'rgba(255,255,255,0.08)', border: `1px solid ${form.accepte_lumens ? 'rgba(232,192,96,0.5)' : 'rgba(255,255,255,0.12)'}`, position: 'relative', transition: 'all .25s' }}>
                    <div style={{ position: 'absolute', top: 3, left: form.accepte_lumens ? 22 : 3, width: 16, height: 16, borderRadius: '50%', background: form.accepte_lumens ? '#e8c060' : 'rgba(255,255,255,0.25)', transition: 'left .25s, background .25s' }} />
                  </div>
                </div>
                {form.accepte_lumens && (
                  <div>
                    <span style={lbl}>Prix en Lumens ✦</span>
                    <input type="number" min="1" value={form.prix_lumens} onChange={e => setForm(f => ({ ...f, prix_lumens: e.target.value }))} placeholder="Ex: 50" style={{ ...inp, maxWidth: 160 }} />
                  </div>
                )}
              </div>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: 13, borderRadius: 10, border: `1px solid ${tc}50`, background: `${tc}18`, color: tc, fontSize: 13, fontWeight: 500, cursor: saving ? 'wait' : 'pointer', fontFamily: "'Jost',sans-serif", letterSpacing: '.06em', opacity: saving ? 0.6 : 1, marginTop: 4 }}>
                {saving ? 'Enregistrement…' : editId ? '✓ Mettre à jour' : '✓ Créer le produit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  Page principale AdminActivitePage
// ═══════════════════════════════════════════════════════════
export function AdminActivitePage() {
  useTheme()
  const { user, signOut } = useAuth()

  const [tab,             setTab]             = useState('boutique')
  const [pendingReviews,  setPendingReviews]  = useState([])
  const [reviewsLoading,  setReviewsLoading]  = useState(false)
  const [lumensData,      setLumensData]      = useState([])
  const [lumenAward,      setLumenAward]      = useState({ userId: '', amount: 5, reason: 'participation' })
  const [allUsers,        setAllUsers]        = useState([])
  const [loading,         setLoading]         = useState(false)
  const [toast,           setToast]           = useState(null)

  const isAdmin = ADMIN_IDS.includes(user?.id)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2800) }

  useEffect(() => {
    if (!isAdmin) return
    loadLumensData(); loadAllUsers()
  }, [isAdmin])

  useEffect(() => { if (tab === 'avis') loadPendingReviews() }, [tab])

  async function loadAllUsers() {
    const { data } = await supabase.from('users').select('id, display_name, email').order('display_name')
    setAllUsers(data ?? [])
  }

  async function loadLumensData() {
    const { data } = await supabase.from('lumens').select('*, users:user_id(display_name, email)').order('total', { ascending: false }).limit(20)
    setLumensData(data ?? [])
  }

  async function handleAwardLumens() {
    if (!lumenAward.userId || !lumenAward.amount) return
    await supabase.rpc('award_lumens', { p_user_id: lumenAward.userId, p_amount: Number(lumenAward.amount), p_reason: lumenAward.reason, p_meta: null })
    showToast(`✦ ${lumenAward.amount} Lumens attribués !`); loadLumensData()
  }

  async function loadPendingReviews() {
    setReviewsLoading(true)
    const { data, error } = await supabase.from('atelier_reviews').select('*').eq('status', 'pending').order('created_at', { ascending: false })
    if (!error && data) {
      const atelierIds = [...new Set(data.map(r => r.atelier_id))]
      const userIds    = [...new Set(data.map(r => r.user_id))]
      const [{ data: atelierData }, { data: userData }] = await Promise.all([
        supabase.from('ateliers').select('id, title').in('id', atelierIds),
        supabase.from('users').select('id, display_name').in('id', userIds),
      ])
      const atelierMap = Object.fromEntries((atelierData ?? []).map(a => [a.id, a]))
      const userMap    = Object.fromEntries((userData ?? []).map(u => [u.id, u]))
      setPendingReviews(data.map(r => ({ ...r, atelierTitle: atelierMap[r.atelier_id]?.title ?? '—', reviewerName: userMap[r.user_id]?.display_name ?? 'Inconnu' })))
    }
    setReviewsLoading(false)
  }

  async function handleModerateReview(reviewId, status) {
    await supabase.from('atelier_reviews').update({ status }).eq('id', reviewId)
    setPendingReviews(prev => prev.filter(r => r.id !== reviewId))
    showToast(status === 'approved' ? '✅ Avis approuvé' : '🗑 Avis refusé')
  }

  if (!isAdmin) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text3)', fontFamily: 'Jost,sans-serif', fontSize: 13 }}>
      <style>{css}</style>🚫 Accès non autorisé
    </div>
  )

  return (
    <div className="adm-root">
      <style>{css}</style>

      {/* TOPBAR */}
      <div className="adm-topbar">
        <div className="adm-logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/icons/icon-192.png" alt="logo" style={{ width: 28, height: 28, borderRadius: '50%' }} />
          Mon <em>Jardin</em> — <span style={{ fontFamily: 'Jost', fontSize: 12, color: 'var(--text3)', letterSpacing: '.2em' }}>ACTIVITÉ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AdminNav current="#activite" />
          <div className="adm-btn ghost" onClick={() => { signOut(); window.location.href = "/"; }}>Déconnexion</div>
        </div>
      </div>

      <div className="adm-body">

        {/* TABS */}
        <div className="adm-tabs">
          <div className={`adm-tab${tab === 'boutique' ? ' active' : ''}`} onClick={() => setTab('boutique')}>🌿 Jardinothèque</div>
          <div className={`adm-tab${tab === 'rituels'  ? ' active' : ''}`} onClick={() => setTab('rituels')}>✨ Rituels</div>
          <div className={`adm-tab${tab === 'lumens'   ? ' active' : ''}`} onClick={() => setTab('lumens')}>✦ Lumens</div>
          <div className={`adm-tab${tab === 'avis'     ? ' active' : ''}`} onClick={() => setTab('avis')} style={{ position: 'relative' }}>
            ⭐ Avis
            {pendingReviews.length > 0 && (
              <span style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(246,196,83,0.35)', border: '1px solid rgba(246,196,83,0.5)', borderRadius: 100, fontSize: 8, padding: '1px 5px', color: '#F6C453', lineHeight: 1.4 }}>{pendingReviews.length}</span>
            )}
          </div>
        </div>

        {/* ── JARDINOTHÈQUE / BOUTIQUE ── */}
        {tab === 'boutique' && (
          <div className="adm-section">
            <BoutiqueEditor showToast={showToast} />
          </div>
        )}

        {/* ── RITUELS ── */}
        {tab === 'rituels' && (
          <div className="adm-section">
            <RituelsEditor showToast={showToast} />
          </div>
        )}

        {/* ── LUMENS ── */}
        {tab === 'lumens' && (
          <div className="adm-section">
            <div style={{ background: 'rgba(246,196,83,0.06)', border: '1px solid rgba(246,196,83,0.2)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: '#F6C453', fontFamily: 'Cormorant Garamond,serif', marginBottom: 14 }}>✦ Attribuer des Lumens</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <select value={lumenAward.userId} onChange={e => setLumenAward(p => ({ ...p, userId: e.target.value }))} style={{ width: '100%', padding: '10px 12px', background: '#1e3a1e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 12, color: '#f2ede0', fontFamily: 'Jost,sans-serif' }}>
                  <option value="">— Choisir un utilisateur —</option>
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.display_name ?? u.email}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" placeholder="Lumens" value={lumenAward.amount} onChange={e => setLumenAward(p => ({ ...p, amount: e.target.value }))} style={{ width: 90, flexShrink: 0, padding: '10px 12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 12, color: '#f2ede0', fontFamily: 'Jost,sans-serif' }} />
                  <select value={lumenAward.reason} onChange={e => setLumenAward(p => ({ ...p, reason: e.target.value }))} style={{ flex: 1, padding: '10px 12px', background: '#1e3a1e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 12, color: '#f2ede0', fontFamily: 'Jost,sans-serif' }}>
                    <option value="participation">Participation (+3)</option>
                    <option value="ritual">Rituel (+2)</option>
                    <option value="questionnaire_daily">Questionnaire (+1)</option>
                    <option value="streak_7">Streak 7j (+5)</option>
                    <option value="streak_30">Streak 30j (+15)</option>
                    <option value="admin_award">Attribution admin</option>
                  </select>
                </div>
                <button onClick={handleAwardLumens} style={{ width: '100%', padding: 11, background: 'rgba(246,196,83,0.15)', border: '1px solid rgba(246,196,83,0.35)', borderRadius: 8, color: '#F6C453', fontSize: 13, cursor: 'pointer', fontFamily: 'Jost,sans-serif', fontWeight: 500 }}>
                  ✦ Attribuer les Lumens
                </button>
              </div>
            </div>
            <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(242,237,224,0.4)', marginBottom: 10 }}>Classement des membres</div>
            {lumensData.length === 0 ? (
              <div className="adm-empty">Aucun Lumen attribué pour l'instant.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lumensData.map((l, i) => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(246,196,83,0.04)', border: '1px solid rgba(246,196,83,0.12)', borderRadius: 10 }}>
                    <div style={{ fontSize: 16, fontFamily: 'Cormorant Garamond,serif', color: 'rgba(246,196,83,0.4)', width: 24, textAlign: 'center' }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: '#f2ede0' }}>{l.users?.display_name ?? l.users?.email ?? l.user_id?.slice(0, 8)}</div>
                      <div style={{ fontSize: 9, color: 'rgba(242,237,224,0.4)', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>{l.level === 'faible' ? 'Lumière faible' : l.level === 'halo' ? 'Halo visible' : l.level === 'aura' ? 'Aura douce' : 'Rayonnement actif'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontFamily: 'Cormorant Garamond,serif', color: '#F6C453' }}>{l.total} ✦</div>
                      <div style={{ fontSize: 9, color: 'rgba(242,237,224,0.35)' }}>{l.available} disponibles</div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F6C453', boxShadow: `0 0 ${l.total >= 200 ? 12 : l.total >= 80 ? 8 : l.total >= 20 ? 4 : 2}px rgba(246,196,83,0.6)` }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── AVIS ── */}
        {tab === 'avis' && (
          <div className="adm-section">
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              ⭐ Avis en attente de modération ({pendingReviews.length})
            </div>
            {reviewsLoading ? (
              <div className="adm-empty">Chargement…</div>
            ) : pendingReviews.length === 0 ? (
              <div className="adm-empty">Aucun avis en attente 🎉</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingReviews.map(r => (
                  <div key={r.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border2)', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 2 }}>{r.atelierTitle}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>Par <strong style={{ color: 'var(--text2)' }}>{r.reviewerName}</strong> · {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                        {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ fontSize: 14, color: s <= r.rating ? '#F6C453' : 'rgba(242,237,224,0.15)' }}>★</span>)}
                      </div>
                    </div>
                    {r.comment ? (
                      <div style={{ fontSize: 11, color: 'rgba(242,237,224,0.65)', lineHeight: 1.6, fontStyle: 'italic', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, marginBottom: 12 }}>« {r.comment} »</div>
                    ) : (
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontStyle: 'italic', marginBottom: 12 }}>Note sans commentaire</div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleModerateReview(r.id, 'approved')} style={{ flex: 1, padding: 7, background: 'rgba(150,212,133,0.1)', border: '1px solid rgba(150,212,133,0.3)', borderRadius: 8, fontSize: 11, fontFamily: 'Jost,sans-serif', color: '#96d485', cursor: 'pointer' }}>✅ Approuver</button>
                      <button onClick={() => handleModerateReview(r.id, 'rejected')} style={{ flex: 1, padding: 7, background: 'rgba(210,80,80,0.07)', border: '1px solid rgba(210,80,80,0.2)', borderRadius: 8, fontSize: 11, fontFamily: 'Jost,sans-serif', color: 'rgba(255,130,130,0.65)', cursor: 'pointer' }}>🗑 Refuser</button>
                    </div>
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
