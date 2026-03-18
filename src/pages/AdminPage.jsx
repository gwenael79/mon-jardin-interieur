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

@media(max-width:700px){
  /* Topbar */
  .adm-topbar{padding:10px 16px;gap:8px;flex-wrap:wrap}
  .adm-logo{font-size:15px;flex:1}
  .adm-topbar > div:last-child{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
  .adm-badge{font-size:8px;padding:3px 8px}
  .adm-btn{padding:6px 10px;font-size:10px}

  /* Body */
  .adm-body{padding:16px 14px}

  /* Stats — 2 colonnes sur mobile */
  .adm-stats{grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px}
  .adm-stat{padding:14px 16px}
  .adm-stat-val{font-size:28px}
  .adm-stat-lbl{font-size:9px}

  /* Tabs — scrollables */
  .adm-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap;gap:0;padding-bottom:0;scrollbar-width:none}
  .adm-tabs::-webkit-scrollbar{display:none}
  .adm-tab{padding:10px 14px;font-size:10px;white-space:nowrap;flex-shrink:0}

  /* Table — scroll horizontal */
  .adm-section{overflow-x:auto}
  .adm-table{min-width:540px}
  .adm-th,.adm-td{padding:10px 12px;font-size:11px}

  /* Report cards */
  .adm-report-card{padding:12px 14px;gap:10px}
  .adm-report-graine{font-size:12px}
  .adm-report-actions{flex-wrap:wrap;gap:6px}
  .adm-report-actions .adm-btn{flex:1;text-align:center;padding:8px 10px;font-size:10px}

  /* Toast */
  .adm-toast{bottom:16px;right:12px;left:12px;text-align:center}
}
`


const ZONES_RITUELS = {
  roots:   { name: "Racines",  color: "#C8894A" },
  stem:    { name: "Tige",     color: "#5AAF78" },
  leaves:  { name: "Feuilles", color: "#4A9E5C" },
  flowers: { name: "Fleurs",   color: "#D4779A" },
  breath:  { name: "Souffle",  color: "#6ABBE4" },
}

function RituelsEditor({ showToast }) {
  // ── Filtres cascade ──────────────────────────────────────
  const [zone,    setZone]    = useState('')
  const [rituel,  setRituel]  = useState('')
  const [title,   setTitle]   = useState('')

  // ── Options calculées depuis Supabase ────────────────────
  const [optRituels, setOptRituels] = useState([])
  const [optTitles,  setOptTitles]  = useState([])

  // ── Exercice chargé ──────────────────────────────────────
  const [exercise,  setExercise]  = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)

  // ── Form state ───────────────────────────────────────────
  const [desc,    setDesc]    = useState('')
  const [dur,     setDur]     = useState('')
  const [toolType,setToolType]= useState('none')
  const [toolObj, setToolObj] = useState({ inhale:5, hold:0, exhale:5, holdEmpty:0, cycles:5 })

  const zColors = { roots:'#C8894A', stem:'#5AAF78', leaves:'#4A9E5C', flowers:'#D4779A', breath:'#6ABBE4' }
  const inp = { padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'#1a2e1a', color:'rgba(242,237,224,0.85)', fontSize:13, fontFamily:"'Jost',sans-serif", outline:'none', width:'100%', boxSizing:'border-box', appearance:'none', WebkitAppearance:'none' }

  // Quand la zone change → charge les rituels disponibles
  useEffect(() => {
    setRituel(''); setTitle(''); setOptRituels([]); setOptTitles([]); setExercise(null)
    if (!zone) return
    supabase.from('rituels').select('rituel').eq('zone', zone)
      .then(({ data }) => {
        if (!data) return
        const unique = [...new Set(data.map(r => r.rituel))]
        setOptRituels(unique)
      })
  }, [zone])

  // Quand le rituel change → charge les titres
  useEffect(() => {
    setTitle(''); setOptTitles([]); setExercise(null)
    if (!zone || !rituel) return
    supabase.from('rituels').select('title, mode').eq('zone', zone).eq('rituel', rituel).order('n')
      .then(({ data }) => {
        if (!data) return
        setOptTitles(data.map(r => ({ title: r.title, mode: r.mode })))
      })
  }, [rituel])

  // Quand le titre change → charge l'exercice complet
  useEffect(() => {
    setExercise(null)
    if (!zone || !rituel || !title) return
    setLoading(true)
    supabase.from('rituels').select('*').eq('zone', zone).eq('rituel', rituel).eq('title', title).single()
      .then(({ data }) => {
        setLoading(false)
        if (!data) return
        setExercise(data)
        setDesc(data.desc || '')
        setDur(data.dur || '')
        const t = data.tool
        if (!t) { setToolType('none'); return }
        setToolType(t.type || 'none')
        if (t.type === 'breath') setToolObj({ inhale: t.inhale||5, hold: t.hold||0, exhale: t.exhale||5, holdEmpty: t.holdEmpty||0, cycles: t.cycles||5 })
      })
  }, [title])

  const handleSave = async () => {
    if (!exercise) return
    setSaving(true)
    const tool = toolType === 'none' ? null
      : toolType === 'breath' ? { type:'breath', ...toolObj }
      : { type: toolType }
    const { error } = await supabase.from('rituels')
      .update({ rituel: editRituel, title: editTitle, "desc": desc, dur, tool, updated_at: new Date().toISOString() })
      .eq('n', exercise.n)
    setSaving(false)
    if (error) { showToast('✗ Erreur : ' + error.message); return }
    if (window.__PLANT_RITUALS_CACHE__) delete window.__PLANT_RITUALS_CACHE__
    showToast('✓ Enregistré — MaFleur se mettra à jour au prochain chargement')
  }

  // ── State accordéon ─────────────────────────────────────
  const [openZone, setOpenZone] = useState('')

  const toggleZone = (k) => {
    const next = openZone === k ? '' : k
    setOpenZone(next)
    if (next !== zone) { setZone(next); setRituel(''); setTitle(''); setExercise(null) }
  }

  const zc = zColors[zone] || '#96d485'
  const label = { fontSize:10, color:'rgba(242,237,224,0.38)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8, display:'block' }

  // ── Champs éditables titre rituel + titre exercice ───────
  const [editRituel, setEditRituel] = useState('')
  const [editTitle,  setEditTitle]  = useState('')
  useEffect(() => { setEditRituel(exercise?.rituel || '') }, [exercise])
  useEffect(() => { setEditTitle(exercise?.title  || '') }, [exercise])

  return (
    <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:24, alignItems:'start' }}>

      {/* ── Colonne gauche : accordéon ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:2, position:'sticky', top:20 }}>
        <div style={{ fontSize:10, color:'rgba(242,237,224,0.35)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:12, paddingBottom:10, borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          Sélectionner un exercice
        </div>

        {Object.entries(ZONES_RITUELS).map(([k, v]) => {
          const isOpen = openZone === k
          return (
            <div key={k} style={{ borderRadius:10, overflow:'hidden', border: isOpen ? `1px solid ${v.color}35` : '1px solid transparent', background: isOpen ? `${v.color}08` : 'transparent', transition:'all .2s' }}>

              {/* ── En-tête zone ── */}
              <button onClick={() => toggleZone(k)} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 14px', background:'none', border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:13, textAlign:'left', color: isOpen ? v.color : 'rgba(242,237,224,0.55)', transition:'color .15s' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background: isOpen ? v.color : 'rgba(255,255,255,0.18)', flexShrink:0, transition:'background .15s' }}/>
                <span style={{ flex:1 }}>{v.name}</span>
                <span style={{ fontSize:10, opacity:.5, transition:'transform .2s', display:'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
              </button>

              {/* ── Rituels ── */}
              {isOpen && optRituels.length > 0 && (
                <div style={{ padding:'0 8px 8px' }}>
                  {optRituels.map(r => {
                    const isRituelOpen = rituel === r
                    return (
                      <div key={r}>
                        <button onClick={() => { setRituel(isRituelOpen ? '' : r); setTitle(''); setExercise(null) }}
                          style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 10px', borderRadius:8, background: isRituelOpen ? `${v.color}12` : 'transparent', border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:12, textAlign:'left', color: isRituelOpen ? 'rgba(242,237,224,0.88)' : 'rgba(242,237,224,0.45)', transition:'all .15s' }}>
                          <span style={{ fontSize:9, opacity:.4, transition:'transform .2s', display:'inline-block', transform: isRituelOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
                          {r}
                        </button>

                        {/* ── Exercices ── */}
                        {isRituelOpen && optTitles.length > 0 && (
                          <div style={{ paddingLeft:16, display:'flex', flexDirection:'column', gap:1, marginTop:2 }}>
                            {optTitles.map(ex => (
                              <button key={ex.title} onClick={() => setTitle(ex.title)}
                                style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 10px', borderRadius:7, background: title===ex.title ? `${v.color}15` : 'transparent', border: title===ex.title ? `1px solid ${v.color}30` : '1px solid transparent', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:11, textAlign:'left', color: title===ex.title ? 'rgba(242,237,224,0.88)' : 'rgba(242,237,224,0.40)', transition:'all .15s', lineHeight:1.4 }}>
                                <span style={{ fontSize:9, padding:'1px 5px', borderRadius:5, flexShrink:0, background: ex.mode==='quick' ? 'rgba(232,192,96,0.10)' : 'rgba(130,200,240,0.10)', color: ex.mode==='quick' ? '#e8c060' : '#82c8f0', border: ex.mode==='quick' ? '1px solid rgba(232,192,96,0.20)' : '1px solid rgba(130,200,240,0.20)' }}>
                                  {ex.mode === 'quick' ? '⚡' : '🌊'}
                                </span>
                                {ex.title}
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

      {/* ── Colonne droite : form ── */}
      <div>
        {!exercise && !loading && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:320, border:'1px dashed rgba(255,255,255,0.07)', borderRadius:14, flexDirection:'column', gap:12 }}>
            <div style={{ fontSize:32, opacity:.3 }}>✦</div>
            <div style={{ fontSize:12, color:'rgba(242,237,224,0.25)', fontStyle:'italic' }}>
              {!zone ? 'Ouvrez une zone pour commencer' : !rituel ? 'Choisissez un rituel' : 'Choisissez un exercice'}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200 }}>
            <div style={{ fontSize:12, color:'rgba(242,237,224,0.30)', fontStyle:'italic' }}>Chargement…</div>
          </div>
        )}

        {exercise && !loading && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Header exercice */}
            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', background:`${zc}08`, border:`1px solid ${zc}25`, borderRadius:14 }}>
              <span style={{ fontSize:28, lineHeight:1, flexShrink:0 }}>{exercise.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:'rgba(242,237,224,0.88)', fontWeight:300, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{editTitle || exercise.title}</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:5 }}>
                  <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20, background:`${zc}15`, border:`1px solid ${zc}30`, color:zc }}>{ZONES_RITUELS[exercise.zone]?.name}</span>
                  <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(242,237,224,0.40)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{editRituel || exercise.rituel}</span>
                  <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20, background: exercise.mode==='quick' ? 'rgba(232,192,96,0.08)' : 'rgba(130,200,240,0.08)', border: exercise.mode==='quick' ? '1px solid rgba(232,192,96,0.20)' : '1px solid rgba(130,200,240,0.20)', color: exercise.mode==='quick' ? '#e8c060' : '#82c8f0' }}>
                    {exercise.mode === 'quick' ? '⚡ Rapide' : '🌊 Profond'}
                  </span>
                </div>
              </div>
            </div>

            {/* Titre rituel + Titre exercice */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <span style={label}>Titre du rituel</span>
                <input value={editRituel} onChange={e => setEditRituel(e.target.value)} style={{ ...inp }}/>
              </div>
              <div>
                <span style={label}>Titre de l'exercice</span>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ ...inp }}/>
              </div>
            </div>

            {/* Durée + Outil */}
            <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', gap:16 }}>
              <div>
                <span style={label}>Durée</span>
                <input value={dur} onChange={e => setDur(e.target.value)} style={{ ...inp }}/>
              </div>
              <div>
                <span style={label}>Outil interactif</span>
                <select value={toolType} onChange={e => setToolType(e.target.value)} style={{ ...inp }}>
                  <option value="none">Aucun outil</option>
                  <option value="breath">🫁 Respiration (breath)</option>
                </select>
              </div>
            </div>

            {/* Paramètres breath */}
            {toolType === 'breath' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, padding:'16px', background:'rgba(106,187,228,0.05)', border:'1px solid rgba(106,187,228,0.15)', borderRadius:10 }}>
                {[['inhale','Inspir (s)'],['hold','Rétention (s)'],['exhale','Expir (s)'],['holdEmpty','Vide (s)'],['cycles','Cycles']].map(([k,lbl]) => (
                  <div key={k} style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    <label style={{ fontSize:9, color:'rgba(106,187,228,0.60)', textTransform:'uppercase', letterSpacing:'.06em' }}>{lbl}</label>
                    <input type="number" min="0" max="120" value={toolObj[k]||0}
                      onChange={e => setToolObj(p => ({ ...p, [k]: parseInt(e.target.value)||0 }))}
                      style={{ ...inp, padding:'8px', textAlign:'center', fontSize:18, fontFamily:"'Cormorant Garamond',serif", fontWeight:300 }}/>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <div>
              <span style={label}>Description</span>
              <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 350))} rows={7}
                style={{ ...inp, resize:'vertical', lineHeight:1.9, fontSize:14 }}/>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                <span style={{ fontSize:10, color: desc.length > 320 ? (desc.length >= 350 ? '#e87060' : '#e8c060') : 'rgba(242,237,224,0.22)', fontWeight: desc.length > 320 ? 500 : 400 }}>{desc.length} / 350</span>
                <button
                  onClick={() => {
                    const text = `${editRituel}, ${editTitle}, ${desc}`
                    navigator.clipboard.writeText(text).then(() => showToast('✓ Copié'))
                  }}
                  style={{ padding:'5px 14px', borderRadius:20, border:'1px solid rgba(255,255,255,0.10)', background:'rgba(255,255,255,0.04)', color:'rgba(242,237,224,0.45)', fontSize:11, fontFamily:"'Jost',sans-serif", cursor:'pointer', letterSpacing:'.04em', transition:'all .15s' }}
                >
                  ⎘ Copier
                </button>
              </div>
            </div>

            {/* Save */}
            <button onClick={handleSave} disabled={saving}
              style={{ padding:'14px', borderRadius:10, border:`1px solid ${zc}50`, background:`${zc}18`,
                color:zc, fontSize:13, fontWeight:500, cursor: saving ? 'wait' : 'pointer',
                fontFamily:"'Jost',sans-serif", letterSpacing:'.06em', opacity: saving ? 0.6 : 1,
                transition:'all .2s' }}>
              {saving ? 'Enregistrement…' : '✓ Enregistrer dans Supabase'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
//  FleuristesAdmin
// ═══════════════════════════════════════════════════════════
function FleuristesAdmin({ showToast }) {
  const [fleuristes, setFleuristes] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('en_attente')

  const load = () => {
    setLoading(true)
    supabase.from('fleuristes').select('*').order('created_at', { ascending:false })
      .then(({ data }) => { setFleuristes(data || []); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? fleuristes : fleuristes.filter(f => f.statut === filter)
  const pending = fleuristes.filter(f => f.statut === 'en_attente').length

  const update = async (id, patch, msg) => {
    const { error } = await supabase.from('fleuristes').update(patch).eq('id', id)
    if (error) { showToast('✗ ' + error.message); return }
    showToast(msg); load()
  }

  const sColors = { en_attente:'#e8c060', actif:'#96d485', suspendu:'rgba(255,140,140,0.7)' }

  return (
    <div style={{ marginTop:32, paddingTop:24, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:10, color:'rgba(242,237,224,0.38)', letterSpacing:'.12em', textTransform:'uppercase' }}>
          Fleuristes
        </div>
        {pending > 0 && (
          <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'rgba(232,192,96,0.12)', border:'1px solid rgba(232,192,96,0.30)', color:'#e8c060', fontWeight:500 }}>
            {pending} en attente de validation
          </span>
        )}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {['en_attente','actif','suspendu','all'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding:'4px 12px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:"'Jost',sans-serif",
              border: filter===s ? `1px solid ${sColors[s]||'#96d485'}55` : '1px solid rgba(255,255,255,0.08)',
              background: filter===s ? `${sColors[s]||'#96d485'}15` : 'transparent',
              color: filter===s ? (sColors[s]||'#96d485') : 'rgba(242,237,224,0.35)' }}>
            {s==='all' ? 'Tous' : s==='en_attente' ? '⏳ En attente' : s==='actif' ? '✓ Actifs' : '⛔ Suspendus'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ fontSize:12, color:'rgba(242,237,224,0.25)', fontStyle:'italic' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ fontSize:12, color:'rgba(242,237,224,0.25)', fontStyle:'italic', textAlign:'center', padding:'20px 0' }}>
          Aucun fleuriste dans cette catégorie
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(f => (
            <div key={f.id} style={{ padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,0.025)', border:`1px solid rgba(255,255,255,0.06)` }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:14, color:'rgba(242,237,224,0.88)', fontWeight:500 }}>
                    {f.nom_boutique}
                    <span style={{ marginLeft:8, fontSize:10, color:'rgba(242,237,224,0.30)', fontWeight:400 }}>
                      {f.type_vendeur === 'professionnel' ? '🏪 Pro' : '🌱 Particulier'}
                    </span>
                  </div>
                  <div style={{ fontSize:10, color:'rgba(242,237,224,0.35)', marginTop:3 }}>
                    Code : <span style={{ fontFamily:'monospace', color:'rgba(242,237,224,0.55)' }}>{f.code_vendeur}</span>
                    {f.email ? ` · ${f.email}` : ''}
                    {f.telephone ? ` · ${f.telephone}` : ''}
                  </div>
                  {f.nom_entreprise && <div style={{ fontSize:10, color:'rgba(242,237,224,0.30)', marginTop:2 }}>{f.nom_entreprise}{f.siret ? ` · SIRET ${f.siret}` : ''}</div>}
                  {f.description && <div style={{ fontSize:11, color:'rgba(242,237,224,0.40)', marginTop:5, lineHeight:1.6, fontStyle:'italic' }}>{f.description}</div>}
                </div>
                <span style={{ fontSize:9, padding:'3px 10px', borderRadius:20, flexShrink:0,
                  background:`${sColors[f.statut]||'rgba(255,255,255,0.05)'}15`,
                  border:`1px solid ${sColors[f.statut]||'rgba(255,255,255,0.08)'}40`,
                  color:sColors[f.statut]||'rgba(242,237,224,0.35)' }}>
                  {f.statut}
                </span>
              </div>

              {/* Mode publication */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <span style={{ fontSize:10, color:'rgba(242,237,224,0.30)' }}>Publication :</span>
                <button onClick={() => update(f.id, { publication_mode:'direct' }, '✓ Accès direct')}
                  style={{ padding:'3px 10px', borderRadius:6, fontSize:10, cursor:'pointer', fontFamily:"'Jost',sans-serif",
                    background: f.publication_mode==='direct' ? 'rgba(150,212,133,0.15)' : 'rgba(255,255,255,0.04)',
                    border: f.publication_mode==='direct' ? '1px solid rgba(150,212,133,0.35)' : '1px solid rgba(255,255,255,0.08)',
                    color: f.publication_mode==='direct' ? '#96d485' : 'rgba(242,237,224,0.35)' }}>⚡ Direct</button>
                <button onClick={() => update(f.id, { publication_mode:'validation' }, '✓ Validation activée')}
                  style={{ padding:'3px 10px', borderRadius:6, fontSize:10, cursor:'pointer', fontFamily:"'Jost',sans-serif",
                    background: f.publication_mode==='validation' ? 'rgba(232,192,96,0.15)' : 'rgba(255,255,255,0.04)',
                    border: f.publication_mode==='validation' ? '1px solid rgba(232,192,96,0.35)' : '1px solid rgba(255,255,255,0.08)',
                    color: f.publication_mode==='validation' ? '#e8c060' : 'rgba(242,237,224,0.35)' }}>✋ Validation</button>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:6 }}>
                {f.statut !== 'actif' && (
                  <button onClick={() => update(f.id, { statut:'actif' }, `✓ ${f.nom_boutique} activé`)}
                    style={{ padding:'6px 14px', borderRadius:8, fontSize:11, cursor:'pointer', fontFamily:"'Jost',sans-serif", background:'rgba(150,212,133,0.12)', border:'1px solid rgba(150,212,133,0.30)', color:'#96d485' }}>
                    ✓ Valider
                  </button>
                )}
                {f.statut !== 'suspendu' && (
                  <button onClick={() => update(f.id, { statut:'suspendu' }, `✓ Suspendu`)}
                    style={{ padding:'6px 14px', borderRadius:8, fontSize:11, cursor:'pointer', fontFamily:"'Jost',sans-serif", background:'rgba(210,80,80,0.08)', border:'1px solid rgba(210,80,80,0.25)', color:'rgba(255,140,140,0.70)' }}>
                    ⛔ Suspendre
                  </button>
                )}
                {f.statut !== 'en_attente' && (
                  <button onClick={() => update(f.id, { statut:'en_attente' }, '✓ Remis en attente')}
                    style={{ padding:'6px 14px', borderRadius:8, fontSize:11, cursor:'pointer', fontFamily:"'Jost',sans-serif", background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)', color:'rgba(242,237,224,0.45)' }}>
                    ↺ En attente
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  BoutiqueEditor — Gestion des produits de la Jardinothèque
// ═══════════════════════════════════════════════════════════
const TYPE_OPTS = [
  { val:'digital',  label:'🎧 Digital',     color:'#b4a0f0' },
  { val:'physique', label:'🌿 Partenaires',  color:'#82c8a0' },
  { val:'occasion', label:'🤝 Occasion',     color:'#e8c060' },
]
const CAT_OPTS = {
  digital:  ['Audio','Formation','Méditation','Guide'],
  physique: ['Livre','Bijou','Pierre','Huile essentielle','Autre'],
  occasion: ['Livre','Bijou','Pierre','Accessoire','Autre'],
}
const EMPTY_FORM = {
  type:'digital', categorie:'Audio', titre:'', description:'',
  prix:'', image_url:'', lien_externe:'', stripe_price_id:'',
  vendeur_nom:'', vendeur_contact:'', statut:'actif', ordre:0, storage_path:'',
}

function BoutiqueEditor({ showToast }) {
  const [produits,   setProduits]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [editId,     setEditId]     = useState(null)
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)

  const inp = { padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'#1a2e1a', color:'rgba(242,237,224,0.85)', fontSize:13, fontFamily:"'Jost',sans-serif", outline:'none', width:'100%', boxSizing:'border-box', appearance:'none', WebkitAppearance:'none' }
  const lbl = { fontSize:10, color:'rgba(242,237,224,0.38)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:6, display:'block' }
  const zColors = { digital:'#b4a0f0', physique:'#82c8a0', occasion:'#e8c060', all:'#96d485' }

  const load = () => {
    setLoading(true)
    supabase.from('produits').select('*').order('ordre').order('created_at', { ascending:false })
      .then(({ data }) => { setProduits(data || []); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const filtered = filterType === 'all' ? produits : produits.filter(p => p.type === filterType)

  const openNew  = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
  const openEdit = (p) => {
    setForm({ type:p.type, categorie:p.categorie||'', titre:p.titre||'', description:p.description||'', prix:p.prix??'', image_url:p.image_url||'', lien_externe:p.lien_externe||'', stripe_price_id:p.stripe_price_id||'', vendeur_nom:p.vendeur_nom||'', vendeur_contact:p.vendeur_contact||'', statut:p.statut||'actif', ordre:p.ordre||0, storage_path:p.storage_path||'' })
    setEditId(p.id); setShowForm(true)
  }

  const [audioUploading, setAudioUploading] = useState(false)
  const [attribuerProduit, setAttribuerProduit] = useState(null) // produit à attribuer
  const [users,            setUsers]            = useState([])
  const [usersLoaded,      setUsersLoaded]      = useState(false)
  const [attribuant,       setAttribuant]       = useState(false)

  const loadUsers = () => {
    if (usersLoaded) return
    supabase.from('users').select('id, display_name, email').order('display_name')
      .then(({ data }) => { setUsers(data || []); setUsersLoaded(true) })
  }

  const handleAttribuer = async (userId) => {
    if (!attribuerProduit || !userId) return
    setAttribuant(true)
    const { error } = await supabase.from('achats').upsert(
      { user_id: userId, produit_id: attribuerProduit.id, statut: 'offert', montant: 0 },
      { onConflict: 'user_id,produit_id' }
    )
    setAttribuant(false)
    if (error) { showToast('✗ ' + error.message); return }
    showToast(`✓ "${attribuerProduit.titre}" attribué`)
    setAttribuerProduit(null)
  }

  const handleAudioUpload = async (file) => {
    if (!file) return
    setAudioUploading(true)
    const path = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await supabase.storage.from('audio-produits').upload(path, file, { upsert: true })
    setAudioUploading(false)
    if (error) { showToast('✗ Upload : ' + error.message); return }
    setForm(f => ({ ...f, storage_path: path }))
    showToast('✓ Fichier audio uploadé')
  }

  const STRIPE_PRODUCT_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '') + '/functions/v1/stripe-product'

  const handleSave = async () => {
    if (!form.titre.trim()) { showToast('✗ Titre obligatoire'); return }
    setSaving(true)
    const payload = { ...form, prix: form.prix !== '' ? parseFloat(form.prix) : null, ordre: parseInt(form.ordre)||0, updated_at: new Date().toISOString() }
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

    // Création automatique du produit Stripe pour les produits digitaux sans price_id
    if (form.type === 'digital' && form.prix && !form.stripe_price_id && savedId) {
      try {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token
        const res = await fetch(STRIPE_PRODUCT_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ produit_id: savedId, titre: form.titre, description: form.description, prix: form.prix, image_url: form.image_url }),
        })
        const data = await res.json()
        if (res.ok) {
          showToast(`✓ Produit créé — Stripe Price ID : ${data.price_id}`)
        } else {
          showToast('✓ Produit sauvegardé — ⚠ Stripe : ' + (data.error || 'erreur'))
        }
      } catch {
        showToast('✓ Produit sauvegardé — ⚠ Stripe non joignable')
      }
    } else {
      showToast(editId ? '✓ Produit mis à jour' : '✓ Produit ajouté')
    }

    setSaving(false)
    setShowForm(false); load()
  }

  const handleDelete = async (id, titre) => {
    if (!window.confirm(`Supprimer "${titre}" ?`)) return
    const { error } = await supabase.from('produits').delete().eq('id', id)
    if (error) { showToast('✗ ' + error.message); return }
    showToast('✓ Supprimé'); load()
  }

  const toggleStatut = async (p) => {
    const next = p.statut === 'actif' ? 'inactif' : 'actif'
    await supabase.from('produits').update({ statut: next }).eq('id', p.id)
    load()
  }

  const tc = zColors[form.type] || '#96d485'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Toolbar */}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', paddingBottom:14, borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        {['all','digital','physique','occasion'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            style={{ padding:'5px 14px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:"'Jost',sans-serif", border: filterType===t ? `1px solid ${zColors[t]}55` : '1px solid rgba(255,255,255,0.10)', background: filterType===t ? `${zColors[t]}15` : 'transparent', color: filterType===t ? zColors[t] : 'rgba(242,237,224,0.38)' }}>
            {t==='all' ? 'Tous' : t==='digital' ? '🎧 Digital' : t==='physique' ? '🌿 Partenaires' : '🤝 Occasion'}
          </button>
        ))}
        <div style={{ marginLeft:'auto' }}>
          <button onClick={openNew}
            style={{ padding:'8px 18px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:"'Jost',sans-serif", background:'rgba(150,212,133,0.12)', border:'1px solid rgba(150,212,133,0.35)', color:'#96d485', fontWeight:500 }}>
            + Ajouter un produit
          </button>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ fontSize:12, color:'rgba(242,237,224,0.30)', fontStyle:'italic', padding:'20px 0' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ fontSize:12, color:'rgba(242,237,224,0.25)', fontStyle:'italic', textAlign:'center', padding:'40px 0' }}>
          Aucun produit — cliquez sur "+ Ajouter"
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {filtered.map(p => {
            const c = zColors[p.type] || '#96d485'
            return (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', borderRadius:10, border:`1px solid ${p.statut==='actif' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)'}`, background: p.statut==='actif' ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.01)', opacity: p.statut==='actif' ? 1 : 0.5 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:c, flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, color:'rgba(242,237,224,0.88)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.titre}</div>
                  <div style={{ fontSize:10, color:'rgba(242,237,224,0.30)', marginTop:2 }}>
                    {p.categorie} · {p.prix != null ? `${Number(p.prix).toFixed(2)} €` : 'prix libre'}
                    {p.vendeur_nom ? ` · ${p.vendeur_nom}` : ''}
                  </div>
                </div>
                <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20, flexShrink:0, background: p.statut==='actif' ? 'rgba(150,212,133,0.10)' : 'rgba(255,255,255,0.05)', border: p.statut==='actif' ? '1px solid rgba(150,212,133,0.25)' : '1px solid rgba(255,255,255,0.07)', color: p.statut==='actif' ? '#96d485' : 'rgba(242,237,224,0.30)' }}>
                  {p.statut}
                </span>
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  <button onClick={() => toggleStatut(p)}
                    style={{ padding:'5px 10px', borderRadius:7, fontSize:10, cursor:'pointer', fontFamily:"'Jost',sans-serif", background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)', color:'rgba(242,237,224,0.45)' }}>
                    {p.statut==='actif' ? 'Désactiver' : 'Activer'}
                  </button>
                  {p.type === 'digital' && p.storage_path && (
                    <button onClick={() => { setAttribuerProduit(p); loadUsers() }}
                      style={{ padding:'5px 10px', borderRadius:7, fontSize:10, cursor:'pointer', fontFamily:"'Jost',sans-serif", background:'rgba(180,160,240,0.10)', border:'1px solid rgba(180,160,240,0.30)', color:'#b4a0f0' }}>
                      🎁 Attribuer
                    </button>
                  )}
                  <button onClick={() => openEdit(p)}
                    style={{ padding:'5px 10px', borderRadius:7, fontSize:10, cursor:'pointer', fontFamily:"'Jost',sans-serif", background:`${c}12`, border:`1px solid ${c}35`, color:c }}>
                    ✏ Modifier
                  </button>
                  <button onClick={() => handleDelete(p.id, p.titre)}
                    style={{ padding:'5px 10px', borderRadius:7, fontSize:10, cursor:'pointer', fontFamily:"'Jost',sans-serif", background:'rgba(210,80,80,0.08)', border:'1px solid rgba(210,80,80,0.25)', color:'rgba(255,140,140,0.7)' }}>
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <FleuristesAdmin showToast={showToast} />


      {/* ── Modal attribution accès ── */}
      {attribuerProduit && (
        <div style={{ position:'fixed', inset:0, zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(10px)', padding:'20px' }}
          onClick={() => setAttribuerProduit(null)}>
          <div style={{ width:'100%', maxWidth:480, borderRadius:18, background:'#12201a', border:'1px solid rgba(255,255,255,0.09)', padding:'24px 28px', maxHeight:'80vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:300, color:'rgba(242,237,224,0.88)' }}>
                Attribuer l'accès
              </div>
              <button onClick={() => setAttribuerProduit(null)} style={{ background:'none', border:'none', color:'rgba(242,237,224,0.35)', fontSize:18, cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize:12, color:'rgba(180,160,240,0.70)', marginBottom:16, padding:'8px 12px', background:'rgba(180,160,240,0.06)', border:'1px solid rgba(180,160,240,0.20)', borderRadius:8 }}>
              🎧 {attribuerProduit.titre}
            </div>
            <div style={{ fontSize:10, color:'rgba(242,237,224,0.38)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:10 }}>
              Choisir un utilisateur
            </div>
            {!usersLoaded ? (
              <div style={{ fontSize:12, color:'rgba(242,237,224,0.30)', fontStyle:'italic' }}>Chargement…</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:360, overflowY:'auto' }}>
                {users.map(u => (
                  <button key={u.id} onClick={() => handleAttribuer(u.id)} disabled={attribuant}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:9, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', cursor:'pointer', fontFamily:"'Jost',sans-serif", textAlign:'left', transition:'background .15s', opacity: attribuant ? 0.6 : 1 }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(180,160,240,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.025)'}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(180,160,240,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#b4a0f0', flexShrink:0, fontWeight:500 }}>
                      {(u.display_name || u.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, color:'rgba(242,237,224,0.80)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {u.display_name || u.email}
                      </div>
                      {u.display_name && <div style={{ fontSize:10, color:'rgba(242,237,224,0.30)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>}
                    </div>
                    <span style={{ fontSize:11, color:'rgba(180,160,240,0.50)' }}>Attribuer →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulaire modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'flex-end', justifyContent:'center', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(10px)' }}
          onClick={() => setShowForm(false)}>
          <div style={{ width:'100%', maxWidth:640, borderRadius:'22px 22px 0 0', background:'#12201a', border:'1px solid rgba(255,255,255,0.09)', borderBottom:'none', padding:'24px 28px 48px', maxHeight:'90vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:300, color:'rgba(242,237,224,0.88)' }}>
                {editId ? 'Modifier le produit' : 'Nouveau produit'}
              </div>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', color:'rgba(242,237,224,0.35)', fontSize:18, cursor:'pointer' }}>✕</button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Type + Catégorie */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <span style={lbl}>Type</span>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type:e.target.value, categorie:CAT_OPTS[e.target.value][0] }))} style={{ ...inp }}>
                    {TYPE_OPTS.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <span style={lbl}>Catégorie</span>
                  <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie:e.target.value }))} style={{ ...inp }}>
                    {(CAT_OPTS[form.type]||[]).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Titre */}
              <div>
                <span style={lbl}>Titre *</span>
                <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre:e.target.value }))} placeholder="Nom du produit" style={{ ...inp }}/>
              </div>

              {/* Description */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={lbl}>Description</span>
                  <span style={{ fontSize:10, color: form.description.length > 320 ? '#e87060' : 'rgba(242,237,224,0.22)' }}>{form.description.length} / 350</span>
                </div>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value.slice(0,350) }))} rows={4} style={{ ...inp, resize:'vertical', lineHeight:1.8 }}/>
              </div>

              {/* Prix + Ordre */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <span style={lbl}>Prix (€)</span>
                  <input type="number" min="0" step="0.01" value={form.prix} onChange={e => setForm(f => ({ ...f, prix:e.target.value }))} placeholder="0.00" style={{ ...inp }}/>
                </div>
                <div>
                  <span style={lbl}>Ordre d'affichage</span>
                  <input type="number" min="0" value={form.ordre} onChange={e => setForm(f => ({ ...f, ordre:e.target.value }))} style={{ ...inp }}/>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <span style={lbl}>URL de l'image</span>
                <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url:e.target.value }))} placeholder="https://..." style={{ ...inp }}/>
              </div>

              {/* Fichier audio — seulement pour les produits digitaux */}
              {form.type === 'digital' && (
                <div>
                  <span style={lbl}>Fichier audio</span>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <label style={{ flex:1, padding:'9px 12px', borderRadius:8, border:'1px dashed rgba(180,160,240,0.35)', background:'rgba(180,160,240,0.06)', color: form.storage_path ? '#b4a0f0' : 'rgba(242,237,224,0.40)', fontSize:12, cursor:'pointer', fontFamily:"'Jost',sans-serif", textAlign:'center', display:'block' }}>
                      <input type="file" accept="audio/*" style={{ display:'none' }} onChange={e => handleAudioUpload(e.target.files[0])}/>
                      {audioUploading ? '⏳ Upload en cours…' : form.storage_path ? `✓ ${form.storage_path}` : '📁 Choisir un fichier audio'}
                    </label>
                    {form.storage_path && (
                      <button onClick={() => setForm(f => ({ ...f, storage_path:'' }))}
                        style={{ padding:'6px 10px', borderRadius:7, fontSize:11, cursor:'pointer', background:'rgba(210,80,80,0.08)', border:'1px solid rgba(210,80,80,0.25)', color:'rgba(255,140,140,0.7)', fontFamily:"'Jost',sans-serif" }}>✕</button>
                    )}
                  </div>
                  <div style={{ fontSize:10, color:'rgba(242,237,224,0.35)', marginTop:5 }}>MP3, WAV, AAC — max 500 MB. Le fichier sera protégé et non téléchargeable.</div>
                </div>
              )}

              {/* Lien + Stripe (pas occasion) */}
              {form.type !== 'occasion' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <span style={lbl}>Lien externe</span>
                    <input value={form.lien_externe} onChange={e => setForm(f => ({ ...f, lien_externe:e.target.value }))} placeholder="https://..." style={{ ...inp }}/>
                  </div>
                  <div>
                    <span style={lbl}>Stripe Price ID</span>
                    {form.stripe_price_id ? (
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <input value={form.stripe_price_id} onChange={e => setForm(f => ({ ...f, stripe_price_id:e.target.value }))} style={{ ...inp, flex:1, color:'#96d485', fontSize:11 }}/>
                        <button onClick={() => setForm(f => ({ ...f, stripe_price_id:'' }))}
                          style={{ padding:'8px 10px', borderRadius:7, fontSize:11, cursor:'pointer', background:'rgba(210,80,80,0.08)', border:'1px solid rgba(210,80,80,0.20)', color:'rgba(255,140,140,0.65)', fontFamily:"'Jost',sans-serif", flexShrink:0 }}>✕</button>
                      </div>
                    ) : (
                      <button onClick={async () => {
                        if (!editId && !form.titre.trim()) { showToast('Sauvegardez d\'abord le produit'); return }
                        const targetId = editId
                        if (!targetId) { showToast('Sauvegardez d\'abord le produit pour créer le Price Stripe'); return }
                        if (!form.prix) { showToast('Renseignez le prix avant de créer dans Stripe'); return }
                        showToast('⏳ Création dans Stripe…')
                        try {
                          const session = await supabase.auth.getSession()
                          const token = session.data.session?.access_token
                          const res = await fetch(STRIPE_PRODUCT_URL, {
                            method:'POST',
                            headers:{ 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' },
                            body: JSON.stringify({ produit_id:targetId, titre:form.titre, description:form.description, prix:form.prix, image_url:form.image_url })
                          })
                          const data = await res.json()
                          if (!res.ok) { showToast('✗ Stripe : ' + (data.error||'erreur')); return }
                          setForm(f => ({ ...f, stripe_price_id: data.price_id }))
                          showToast('✓ Produit Stripe créé : ' + data.price_id)
                        } catch { showToast('✗ Erreur réseau') }
                      }}
                        style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px dashed rgba(150,212,133,0.35)', background:'rgba(150,212,133,0.06)', color:'#96d485', fontSize:12, fontFamily:"'Jost',sans-serif", cursor:'pointer', textAlign:'center' }}>
                        ⚡ Créer automatiquement dans Stripe
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Vendeur (partenaires + occasion) */}
              {form.type !== 'digital' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <span style={lbl}>Nom du vendeur</span>
                    <input value={form.vendeur_nom} onChange={e => setForm(f => ({ ...f, vendeur_nom:e.target.value }))} placeholder="Nom ou enseigne" style={{ ...inp }}/>
                  </div>
                  <div>
                    <span style={lbl}>Contact</span>
                    <input value={form.vendeur_contact} onChange={e => setForm(f => ({ ...f, vendeur_contact:e.target.value }))} placeholder="email, lien..." style={{ ...inp }}/>
                  </div>
                </div>
              )}

              {/* Statut */}
              <div>
                <span style={lbl}>Statut</span>
                <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut:e.target.value }))} style={{ ...inp, maxWidth:220 }}>
                  <option value="actif">Actif — visible</option>
                  <option value="inactif">Inactif — masqué</option>
                  <option value="vendu">Vendu (occasion)</option>
                </select>
              </div>

              {/* Save */}
              <button onClick={handleSave} disabled={saving}
                style={{ padding:'13px', borderRadius:10, border:`1px solid ${tc}50`, background:`${tc}18`, color:tc, fontSize:13, fontWeight:500, cursor: saving ? 'wait' : 'pointer', fontFamily:"'Jost',sans-serif", letterSpacing:'.06em', opacity: saving ? 0.6 : 1, marginTop:4 }}>
                {saving ? 'Enregistrement…' : editId ? '✓ Mettre à jour' : '✓ Créer le produit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminPage() {
  const { user, signOut } = useAuth()
  const [tab,       setTab]       = useState('reports')
  const [pendingReviews, setPendingReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reports,   setReports]   = useState([])
  const [circles,   setCircles]   = useState([])
  const [applications, setApplications] = useState([])
  const [lumensData,   setLumensData]   = useState([])
  const [lumenAward,   setLumenAward]   = useState({ userId:'', amount:5, reason:'participation' })
  const [allUsers,     setAllUsers]     = useState([])
  const [attendance,   setAttendance]   = useState(null)
  const [palmares,     setPalmares]     = useState([])
  const [stats,     setStats]     = useState({})
  const [fullStats, setFullStats] = useState(null)
  const [statsPeriod, setStatsPeriod] = useState('week') // day|week|month|year
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState(null)

  const isAdmin = ADMIN_IDS.includes(user?.id)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2800) }

  async function loadFullStats() {
    const ADMIN_ID = 'aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'
    const now   = new Date()
    const ymd   = d => d.toISOString().slice(0,10)
    const ago   = n => ymd(new Date(Date.now() - n * 86400000))
    const periods = { day: ago(0), week: ago(6), month: ago(29), year: ago(364) }

    // ── Inscriptions (nouveaux users) ─────────────────────────────────────────
    const { data: usersData } = await supabase
      .from('users').select('id, created_at').neq('id', ADMIN_ID)
    const usersByDate = {}
    ;(usersData ?? []).forEach(u => {
      const d = u.created_at?.slice(0,10)
      if (d) usersByDate[d] = (usersByDate[d] ?? 0) + 1
    })

    // ── Connexions (sessions dans analytics_events) ───────────────────────────
    const { data: sessData } = await supabase
      .from('analytics_events')
      .select('user_id, created_at')
      .eq('event_type', 'session_start')
      .neq('user_id', ADMIN_ID)
      .gte('created_at', ago(364))
    const sessByDate = {}
    const sessUsersByDate = {}
    ;(sessData ?? []).forEach(s => {
      const d = s.created_at?.slice(0,10)
      if (!d) return
      sessByDate[d] = (sessByDate[d] ?? 0) + 1
      if (!sessUsersByDate[d]) sessUsersByDate[d] = new Set()
      sessUsersByDate[d].add(s.user_id)
    })

    // ── Activity table ────────────────────────────────────────────────────────
    const { data: actData } = await supabase
      .from('activity')
      .select('user_id, action, zone, created_at')
      .neq('user_id', ADMIN_ID)
      .gte('created_at', ago(364))
    const actByDateAction = {}
    ;(actData ?? []).forEach(a => {
      const d = a.created_at?.slice(0,10)
      if (!d) return
      const key = `${d}__${a.action}`
      actByDateAction[key] = (actByDateAction[key] ?? 0) + 1
    })

    // ── Ateliers créés ────────────────────────────────────────────────────────
    const { data: atelierData } = await supabase
      .from('ateliers').select('id, created_at').neq('animator_id', ADMIN_ID).gte('created_at', ago(364))
    const ateliersByDate = {}
    ;(atelierData ?? []).forEach(a => {
      const d = a.created_at?.slice(0,10)
      if (d) ateliersByDate[d] = (ateliersByDate[d] ?? 0) + 1
    })

    // ── Inscriptions ateliers ─────────────────────────────────────────────────
    const { data: regData } = await supabase
      .from('atelier_registrations').select('user_id, created_at').neq('user_id', ADMIN_ID).gte('created_at', ago(364))
    const regsByDate = {}
    ;(regData ?? []).forEach(r => {
      const d = r.created_at?.slice(0,10)
      if (d) regsByDate[d] = (regsByDate[d] ?? 0) + 1
    })

    // ── Défis rejoints ────────────────────────────────────────────────────────
    const { data: defiData } = await supabase
      .from('analytics_events').select('created_at').eq('event_type', 'defi_join').neq('user_id', ADMIN_ID).gte('created_at', ago(364))
    const defisByDate = {}
    ;(defiData ?? []).forEach(d => {
      const day = d.created_at?.slice(0,10)
      if (day) defisByDate[day] = (defisByDate[day] ?? 0) + 1
    })

    // ── Calcul totaux par période ─────────────────────────────────────────────
    const sumFrom = (map, from) => Object.entries(map).filter(([d]) => d >= from).reduce((s,[,v]) => s + v, 0)
    const uniqUsersFrom = (map, from) => new Set(Object.entries(map).filter(([d]) => d >= from).flatMap(([,s]) => [...s])).size

    const build = (map) => ({
      day:   sumFrom(map, periods.day),
      week:  sumFrom(map, periods.week),
      month: sumFrom(map, periods.month),
      year:  sumFrom(map, periods.year),
    })

    // Connexions uniques par période
    const connUniq = {
      day:   uniqUsersFrom(sessUsersByDate, periods.day),
      week:  uniqUsersFrom(sessUsersByDate, periods.week),
      month: uniqUsersFrom(sessUsersByDate, periods.month),
      year:  uniqUsersFrom(sessUsersByDate, periods.year),
    }

    // Extraire actions depuis actByDateAction
    const actMap = (action) => {
      const m = {}
      Object.entries(actByDateAction).forEach(([key, v]) => {
        const [d, a] = key.split('__')
        if (a === action) m[d] = (m[d] ?? 0) + v
      })
      return m
    }

    // Graphe 30 jours pour chaque métrique
    const chart30 = (map) => {
      const days = []
      for (let i = 29; i >= 0; i--) {
        const d = ago(i)
        days.push({ date: d, count: map[d] ?? 0 })
      }
      return days
    }

    setFullStats({
      inscriptions:   { ...build(usersByDate),   chart: chart30(usersByDate) },
      connexions:     { ...connUniq,             chart: chart30(Object.fromEntries(Object.entries(sessUsersByDate).map(([d,s]) => [d, s.size]))) },
      bilans:         { ...build(actMap('bilan')), chart: chart30(actMap('bilan')) },
      rituels:        { ...build(actMap('ritual')), chart: chart30(actMap('ritual')) },
      coeurs:         { ...build(actMap('coeur')), chart: chart30(actMap('coeur')) },
      ateliers_crees: { ...build(ateliersByDate), chart: chart30(ateliersByDate) },
      ateliers_inscrits: { ...build(regsByDate), chart: chart30(regsByDate) },
      defis:          { ...build(defisByDate),   chart: chart30(defisByDate) },
    })
  }


  async function loadPendingReviews() {
    setReviewsLoading(true)
    const { data, error } = await supabase
      .from('atelier_reviews')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (!error && data) {
      const atelierIds = [...new Set(data.map(r => r.atelier_id))]
      const userIds    = [...new Set(data.map(r => r.user_id))]
      const [{ data: atelierData }, { data: userData }] = await Promise.all([
        supabase.from('ateliers').select('id, title').in('id', atelierIds),
        supabase.from('users').select('id, display_name').in('id', userIds),
      ])
      const atelierMap = Object.fromEntries((atelierData ?? []).map(a => [a.id, a]))
      const userMap    = Object.fromEntries((userData ?? []).map(u => [u.id, u]))
      setPendingReviews(data.map(r => ({
        ...r,
        atelierTitle: atelierMap[r.atelier_id]?.title ?? '—',
        reviewerName: userMap[r.user_id]?.display_name ?? 'Inconnu',
      })))
    }
    setReviewsLoading(false)
  }

  async function handleModerateReview(reviewId, status) {
    await supabase.from('atelier_reviews').update({ status }).eq('id', reviewId)
    setPendingReviews(prev => prev.filter(r => r.id !== reviewId))
    showToast(status === 'approved' ? '✅ Avis approuvé' : '🗑 Avis refusé')
  }

  useEffect(() => { if (isAdmin) { loadAll() } }, [isAdmin])
  useEffect(() => { if (tab === 'statistiques') loadFullStats() }, [tab])
  useEffect(() => { if (tab === 'reviews') loadPendingReviews() }, [tab])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadReports(), loadCircles(), loadStats(), loadApplications(), loadLumensData(), loadAllUsers(), loadAttendance()])
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

  async function loadAttendance() {
    try {
      const { data: att, error: e1 } = await supabase.rpc('get_admin_attendance_stats')
      console.log('[admin] attendance:', JSON.stringify(att), 'err:', e1?.message)
      if (att !== null && att !== undefined) {
        const parsed = typeof att === 'string' ? JSON.parse(att) : att
        setAttendance(parsed)
      } else {
        // Fallback : calcul direct via daily_quiz
        const today = new Date().toISOString().slice(0,10)
        const week  = new Date(Date.now() - 6*86400000).toISOString().slice(0,10)
        const ago13 = new Date(Date.now() - 13*86400000).toISOString().slice(0,10)
        const month = new Date(Date.now() - 29*86400000).toISOString().slice(0,10)
        const ADMIN = 'aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'
        const { data: rows } = await supabase.from('daily_quiz').select('user_id, date').gte('date', ago13).neq('user_id', ADMIN)
        const dayMap = {}, todaySet = new Set(), weekSet = new Set(), monthSet = new Set()
        ;(rows ?? []).forEach(r => {
          dayMap[r.date] = (dayMap[r.date] ?? new Set())
          dayMap[r.date].add(r.user_id)
          if (r.date === today) todaySet.add(r.user_id)
          if (r.date >= week)  weekSet.add(r.user_id)
          if (r.date >= month) monthSet.add(r.user_id)
        })
        const daily_active = Object.entries(dayMap).map(([date, set]) => ({ date, count: set.size })).sort((a,b) => a.date.localeCompare(b.date))
        setAttendance({ active_today: todaySet.size, active_week: weekSet.size, active_month: monthSet.size, daily_active })
      }
    } catch(e) { console.error('[admin] attendance error:', e) }

    try {
      const { data: pal, error: e2 } = await supabase.rpc('get_admin_connexion_palmares')
      console.log('[admin] palmares:', Array.isArray(pal) ? pal.length + ' items' : JSON.stringify(pal), 'err:', e2?.message)
      if (pal !== null && pal !== undefined) {
        const parsed = typeof pal === 'string' ? JSON.parse(pal) : pal
        setPalmares(Array.isArray(parsed) ? parsed : [])
      } else {
        // Fallback direct via daily_quiz
        const ADMIN2 = 'aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'
        const { data: users } = await supabase.from('users').select('id, display_name, email').neq('id', ADMIN2)
        const { data: quizRows } = await supabase.from('daily_quiz').select('user_id, date').neq('user_id', ADMIN2)
        const { data: lumensRows } = await supabase.from('lumens').select('user_id, streak_days').neq('user_id', ADMIN2)
        const countMap = {}, lastMap = {}, streakMap = {}
        ;(quizRows ?? []).forEach(q => {
          countMap[q.user_id] = (countMap[q.user_id] ?? 0) + 1
          if (!lastMap[q.user_id] || q.date > lastMap[q.user_id]) lastMap[q.user_id] = q.date
        })
        ;(lumensRows ?? []).forEach(l => { streakMap[l.user_id] = l.streak_days ?? 0 })
        const palmares = (users ?? []).map(u => ({
          id: u.id, display_name: u.display_name, email: u.email,
          connexions: countMap[u.id] ?? 0,
          last_active: lastMap[u.id] ?? null,
          streak_days: streakMap[u.id] ?? 0,
        })).sort((a,b) => b.connexions - a.connexions).slice(0, 20)
        setPalmares(palmares)
      }
    } catch(e) { console.error('[admin] palmares error:', e) }
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
      supabase.from('users').select('*', { count: 'exact', head: true }).neq('id', 'aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'),
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
        <div className="adm-logo" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <img src="/icons/icon-192.png" alt="logo" style={{ width:28, height:28, borderRadius:'50%' }} />
            Mon <em>Jardin</em> — <span style={{ fontFamily:'Jost', fontSize:12, color:'var(--text3)', letterSpacing:'.2em' }}>ADMIN</span>
          </div>
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

          <div className={`adm-tab${tab === 'applications' ? ' active' : ''}`} onClick={() => setTab('applications')}>
            🌿 Animateurs {applications.length > 0 && `(${applications.length})`}
          </div>
          <div className={`adm-tab${tab === 'lumens' ? ' active' : ''}`} onClick={() => setTab('lumens')}>
            ✦ Lumens
          </div>
          <div className={`adm-tab${tab === 'frequentation' ? ' active' : ''}`} onClick={() => setTab('frequentation')}>
            📊 Fréquentation
          </div>
          <div className={`adm-tab${tab === 'statistiques' ? ' active' : ''}`} onClick={() => setTab('statistiques')}>
            📈 Statistiques
          </div>
          <div className={`adm-tab${tab === 'reviews' ? ' active' : ''}`} onClick={() => setTab('reviews')} style={{ position:'relative' }}>
            ⭐ Avis
            {pendingReviews.length > 0 && (
              <span style={{ position:'absolute', top:2, right:2, background:'rgba(246,196,83,0.35)', border:'1px solid rgba(246,196,83,0.5)', borderRadius:100, fontSize:8, padding:'1px 5px', color:'#F6C453', lineHeight:1.4 }}>{pendingReviews.length}</span>
            )}
          </div>
          <div className={`adm-tab${tab === 'boutique' ? ' active' : ''}`} onClick={() => setTab('boutique')}>
            🌿 Jardinothèque
          </div>
          <div className={`adm-tab${tab === 'parametres' ? ' active' : ''}`} onClick={() => setTab('parametres')}>
            ⚙️ Paramètres
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
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <select value={lumenAward.userId} onChange={e=>setLumenAward(p=>({...p,userId:e.target.value}))} style={{ width:'100%', padding:'10px 12px', background:'#1e3a1e', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, fontSize:12, color:'#f2ede0', fontFamily:'Jost,sans-serif' }}>
                  <option value="">— Choisir un utilisateur —</option>
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.display_name ?? u.email}</option>)}
                </select>
                <div style={{ display:'flex', gap:8 }}>
                  <input type="number" placeholder="Lumens" value={lumenAward.amount} onChange={e=>setLumenAward(p=>({...p,amount:e.target.value}))} style={{ width:90, flexShrink:0, padding:'10px 12px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, fontSize:12, color:'#f2ede0', fontFamily:'Jost,sans-serif' }} />
                  <select value={lumenAward.reason} onChange={e=>setLumenAward(p=>({...p,reason:e.target.value}))} style={{ flex:1, padding:'10px 12px', background:'#1e3a1e', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, fontSize:12, color:'#f2ede0', fontFamily:'Jost,sans-serif' }}>
                    <option value="participation">Participation (+3)</option>
                    <option value="ritual">Rituel (+2)</option>
                    <option value="questionnaire_daily">Questionnaire (+1)</option>
                    <option value="streak_7">Streak 7j (+5)</option>
                    <option value="streak_30">Streak 30j (+15)</option>
                    <option value="admin_award">Attribution admin</option>
                  </select>
                </div>
                <button onClick={handleAwardLumens} style={{ width:'100%', padding:'11px', background:'rgba(246,196,83,0.15)', border:'1px solid rgba(246,196,83,0.35)', borderRadius:8, color:'#F6C453', fontSize:13, cursor:'pointer', fontFamily:'Jost,sans-serif', fontWeight:500 }}>
                  ✦ Attribuer les Lumens
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


        {/* ── FRÉQUENTATION ── */}

        {tab === 'statistiques' && (() => {
          const P = statsPeriod
          const pLabel = { day: "Aujourd'hui", week: '7 derniers jours', month: '30 derniers jours', year: '365 derniers jours' }
          const METRICS = fullStats ? [
            { key:'inscriptions',      icon:'🌱', label:'Inscriptions',         color:'#96d485' },
            { key:'connexions',        icon:'🔗', label:'Connexions uniques',    color:'#7ab5f5' },
            { key:'bilans',            icon:'🌹', label:'Bilans complétés',      color:'#e8d4a8' },
            { key:'rituels',           icon:'✨', label:'Rituels effectués',     color:'#c8a882' },
            { key:'coeurs',            icon:'💚', label:'Cœurs envoyés',         color:'#96d485' },
            { key:'ateliers_crees',    icon:'📖', label:'Ateliers créés',        color:'#b8a0d8' },
            { key:'ateliers_inscrits', icon:'✓',  label:'Inscriptions ateliers', color:'#7ab5f5' },
            { key:'defis',             icon:'🏅', label:'Défis rejoints',        color:'#F6C453' },
          ] : []

          return (
            <div className="adm-section">
              {/* Sélecteur période */}
              <div style={{ display:'flex', gap:6, marginBottom:24, flexWrap:'wrap' }}>
                {['day','week','month','year'].map(p => (
                  <button key={p} onClick={() => setStatsPeriod(p)} style={{ padding:'6px 16px', borderRadius:100, fontSize:10, letterSpacing:'.08em', fontFamily:'Jost,sans-serif', cursor:'pointer', background: P===p ? 'rgba(150,212,133,0.2)' : 'rgba(255,255,255,0.04)', border:`1px solid ${P===p ? 'rgba(150,212,133,0.4)' : 'rgba(255,255,255,0.1)'}`, color: P===p ? '#c8f0b8' : 'var(--text3)', transition:'all .2s' }}>
                    {p==='day'?"Jour":p==='week'?"Semaine":p==='month'?"Mois":"Année"}
                  </button>
                ))}
                <span style={{ fontSize:10, color:'var(--text3)', alignSelf:'center', marginLeft:4, fontStyle:'italic' }}>{pLabel[P]}</span>
              </div>

              {!fullStats ? (
                <div className="adm-empty">Chargement…</div>
              ) : (
                <>
                  {/* Grille des métriques */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10, marginBottom:32 }}>
                    {METRICS.map(m => (
                      <div key={m.key} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border2)', borderRadius:14, padding:'16px 18px' }}>
                        <div style={{ fontSize:18, marginBottom:6 }}>{m.icon}</div>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:300, color:m.color, lineHeight:1 }}>
                          {fullStats[m.key]?.[P] ?? 0}
                        </div>
                        <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'.08em', textTransform:'uppercase', marginTop:6 }}>{m.label}</div>
                        {/* Mini sparkline */}
                        {fullStats[m.key]?.chart && (() => {
                          const data = fullStats[m.key].chart.slice(-14)
                          const max = Math.max(...data.map(d=>d.count), 1)
                          return (
                            <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:24, marginTop:10 }}>
                              {data.map((d,i) => (
                                <div key={i} title={`${d.date}: ${d.count}`} style={{ flex:1, height:`${Math.max(2, Math.round(d.count/max*100))}%`, background:m.color, opacity:0.4, borderRadius:2, minHeight:2 }} />
                              ))}
                            </div>
                          )
                        })()}
                      </div>
                    ))}
                  </div>

                  {/* Graphe détaillé — courbe 30 jours pour la métrique sélectionnée */}
                  <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid var(--border2)', borderRadius:14, padding:20, marginBottom:24 }}>
                    <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:16 }}>
                      Activité quotidienne — 30 derniers jours
                    </div>
                    {/* Légende sélectable */}
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
                      {METRICS.map(m => (
                        <div key={m.key} style={{ fontSize:9, padding:'3px 8px', borderRadius:100, background:`${m.color}22`, border:`1px solid ${m.color}44`, color:m.color, cursor:'default' }}>
                          {m.icon} {m.label}
                        </div>
                      ))}
                    </div>
                    {/* Graphe empilé */}
                    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:100 }}>
                      {fullStats.connexions.chart.map((d, i) => {
                        const vals = METRICS.map(m => fullStats[m.key].chart[i]?.count ?? 0)
                        const total = vals.reduce((a,b)=>a+b,0)
                        const maxTotal = Math.max(...fullStats.connexions.chart.map((_,j) => METRICS.map(m => fullStats[m.key].chart[j]?.count??0).reduce((a,b)=>a+b,0)), 1)
                        const pct = Math.max(3, Math.round(total/maxTotal*100))
                        const isToday = d.date === new Date().toISOString().slice(0,10)
                        return (
                          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                            <div title={`${d.date}\n${METRICS.map((m,j)=>`${m.label}: ${vals[j]}`).join('\n')}`}
                              style={{ width:'100%', height:`${pct}%`, background: isToday ? 'var(--green)' : 'rgba(150,212,133,0.35)', borderRadius:3, minHeight:3, boxShadow: isToday ? '0 0 6px rgba(150,212,133,0.4)' : 'none', transition:'height .3s' }} />
                            {total > 0 && <div style={{ fontSize:7, color:'var(--text3)' }}>{total}</div>}
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                      <div style={{ fontSize:8, color:'var(--text3)' }}>il y a 29 jours</div>
                      <div style={{ fontSize:8, color:'var(--green)' }}>aujourd'hui</div>
                    </div>
                  </div>

                  {/* Tableau récap */}
                  <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>Récapitulatif</div>
                  <div style={{ overflowX:'auto' }}>
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th style={{ padding:'10px 14px', textAlign:'left', fontSize:9, letterSpacing:'.1em', color:'var(--text3)', fontWeight:400 }}>MÉTRIQUE</th>
                          <th style={{ padding:'10px 14px', textAlign:'center', fontSize:9, letterSpacing:'.1em', color:'var(--text3)', fontWeight:400 }}>JOUR</th>
                          <th style={{ padding:'10px 14px', textAlign:'center', fontSize:9, letterSpacing:'.1em', color:'var(--text3)', fontWeight:400 }}>7J</th>
                          <th style={{ padding:'10px 14px', textAlign:'center', fontSize:9, letterSpacing:'.1em', color:'var(--text3)', fontWeight:400 }}>30J</th>
                          <th style={{ padding:'10px 14px', textAlign:'center', fontSize:9, letterSpacing:'.1em', color:'var(--text3)', fontWeight:400 }}>365J</th>
                        </tr>
                      </thead>
                      <tbody>
                        {METRICS.map((m, i) => (
                          <tr key={m.key} style={{ background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                            <td style={{ padding:'10px 14px', fontSize:11, color:'var(--text)' }}>{m.icon} {m.label}</td>
                            <td style={{ padding:'10px 14px', textAlign:'center', fontSize:13, fontFamily:"'Cormorant Garamond',serif", color:m.color }}>{fullStats[m.key]?.day ?? 0}</td>
                            <td style={{ padding:'10px 14px', textAlign:'center', fontSize:13, fontFamily:"'Cormorant Garamond',serif", color:m.color }}>{fullStats[m.key]?.week ?? 0}</td>
                            <td style={{ padding:'10px 14px', textAlign:'center', fontSize:13, fontFamily:"'Cormorant Garamond',serif", color:m.color }}>{fullStats[m.key]?.month ?? 0}</td>
                            <td style={{ padding:'10px 14px', textAlign:'center', fontSize:13, fontFamily:"'Cormorant Garamond',serif", color:m.color }}>{fullStats[m.key]?.year ?? 0}</td>
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

        {tab === 'frequentation' && (
          <div className="adm-section">

            {/* Cards stats rapides */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
              {[
                { val: attendance?.active_today ?? '—', lbl: "Actifs aujourd'hui", icon:'🌱' },
                { val: attendance?.active_week  ?? '—', lbl: 'Actifs cette semaine', icon:'🌿' },
                { val: attendance?.active_month ?? '—', lbl: 'Actifs ce mois', icon:'🌳' },
              ].map((s,i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid var(--border2)', borderRadius:14, padding:'16px 18px', display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ fontSize:22 }}>{s.icon}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:34, fontWeight:300, color:'var(--text)', lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'.08em', textTransform:'uppercase' }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* Graphe 14 jours */}
            {attendance?.daily_active?.length > 0 && (
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid var(--border2)', borderRadius:14, padding:20, marginBottom:24 }}>
                <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:16 }}>Activité quotidienne — 14 derniers jours</div>
                <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:80 }}>
                  {(() => {
                    const days = attendance.daily_active
                    const max = Math.max(...days.map(d => d.count), 1)
                    const allDays = []
                    for (let i = 13; i >= 0; i--) {
                      const d = new Date(); d.setDate(d.getDate() - i)
                      const key = d.toISOString().slice(0,10)
                      const found = days.find(x => x.date === key)
                      allDays.push({ date: key, count: found?.count ?? 0 })
                    }
                    return allDays.map((d, i) => {
                      const pct = Math.max(4, Math.round((d.count / max) * 100))
                      const isToday = d.date === new Date().toISOString().slice(0,10)
                      const label = new Date(d.date).toLocaleDateString('fr-FR', { weekday:'short' })
                      return (
                        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                          <div title={`${d.count} actifs`} style={{
                            width:'100%', height:`${pct}%`,
                            background: isToday ? 'var(--green)' : 'rgba(150,212,133,0.35)',
                            borderRadius:4, minHeight:4,
                            boxShadow: isToday ? '0 0 8px rgba(150,212,133,0.4)' : 'none',
                            transition:'height .3s',
                          }}/>
                          {d.count > 0 && <div style={{ fontSize:8, color:'var(--text3)' }}>{d.count}</div>}
                        </div>
                      )
                    })
                  })()}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                  <div style={{ fontSize:8, color:'var(--text3)' }}>il y a 13 jours</div>
                  <div style={{ fontSize:8, color:'var(--green)' }}>aujourd'hui</div>
                </div>
              </div>
            )}

            {/* Palmarès connexions */}
            <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>
              🏆 Palmarès — jours actifs
            </div>
            {palmares.length === 0 ? (
              <div className="adm-empty">Aucune donnée disponible</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {palmares.map((p, i) => (
                  <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border2)', borderRadius:10 }}>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color: i === 0 ? '#e8c060' : i === 1 ? 'rgba(192,192,192,0.7)' : i === 2 ? 'rgba(205,127,50,0.7)' : 'var(--text3)', width:24, textAlign:'center', flexShrink:0 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {p.display_name ?? p.email ?? p.id?.slice(0,8)}
                      </div>
                      <div style={{ fontSize:9, color:'var(--text3)', marginTop:2 }}>
                        Dernière activité : {p.last_active ? new Date(p.last_active).toLocaleDateString('fr-FR', { day:'numeric', month:'short' }) : '—'}
                        {p.streak_days > 0 && ` · 🔥 ${p.streak_days}j de streak`}
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:'var(--green)', lineHeight:1 }}>{p.connexions}</div>
                      <div style={{ fontSize:9, color:'var(--text3)' }}>jours actifs</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="adm-section">
            <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:16 }}>
              ⭐ Avis en attente de modération ({pendingReviews.length})
            </div>

            {reviewsLoading ? (
              <div className="adm-empty">Chargement…</div>
            ) : pendingReviews.length === 0 ? (
              <div className="adm-empty">Aucun avis en attente 🎉</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {pendingReviews.map(r => (
                  <div key={r.id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border2)', borderRadius:12, padding:'14px 16px' }}>
                    {/* Header */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:12, color:'var(--text)', marginBottom:2 }}>{r.atelierTitle}</div>
                        <div style={{ fontSize:10, color:'var(--text3)' }}>
                          Par <strong style={{ color:'var(--text2)' }}>{r.reviewerName}</strong> · {new Date(r.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </div>
                      </div>
                      {/* Étoiles */}
                      <div style={{ display:'flex', gap:2, flexShrink:0 }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ fontSize:14, color: s <= r.rating ? '#F6C453' : 'rgba(242,237,224,0.15)' }}>★</span>
                        ))}
                      </div>
                    </div>

                    {/* Commentaire */}
                    {r.comment ? (
                      <div style={{ fontSize:11, color:'rgba(242,237,224,0.65)', lineHeight:1.6, fontStyle:'italic', padding:'8px 12px', background:'rgba(255,255,255,0.02)', borderRadius:8, marginBottom:12 }}>
                        « {r.comment} »
                      </div>
                    ) : (
                      <div style={{ fontSize:10, color:'var(--text3)', fontStyle:'italic', marginBottom:12 }}>Note sans commentaire</div>
                    )}

                    {/* Actions */}
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => handleModerateReview(r.id, 'approved')} style={{ flex:1, padding:'7px', background:'rgba(150,212,133,0.1)', border:'1px solid rgba(150,212,133,0.3)', borderRadius:8, fontSize:11, fontFamily:'Jost,sans-serif', color:'#96d485', cursor:'pointer' }}>
                        ✅ Approuver
                      </button>
                      <button onClick={() => handleModerateReview(r.id, 'rejected')} style={{ flex:1, padding:'7px', background:'rgba(210,80,80,0.07)', border:'1px solid rgba(210,80,80,0.2)', borderRadius:8, fontSize:11, fontFamily:'Jost,sans-serif', color:'rgba(255,130,130,0.65)', cursor:'pointer' }}>
                        🗑 Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'boutique' && (
          <div className="adm-section">
            <BoutiqueEditor showToast={showToast} />
          </div>
        )}

        {tab === 'parametres' && (
          <div className="adm-section">
            <RituelsEditor showToast={showToast} />
          </div>
        )}

      </div>
      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  )
}
