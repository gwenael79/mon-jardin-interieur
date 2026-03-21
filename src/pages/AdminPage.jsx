import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { supabase } from '../core/supabaseClient'

// ── IDs des administrateurs ─────────────────────────────────────────────────
// Ajoutez ici les UUIDs des utilisateurs ayant accès à l'interface admin.
// Ces IDs sont aussi exclus des statistiques pour ne pas fausser les données.
export const ADMIN_IDS = [
  'aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7', // Gwenaël (fondateur)
  'fbcfb88f-0280-40ab-98d3-bcf750c5764d', // Co-admin
]

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;width:100%}
:root{
  --bg:#1a2e1a;--bg2:#213d21;--bg3:#274827;
  --border:rgba(255,255,255,0.18);--border2:rgba(255,255,255,0.10);
  --text:#f2ede0;--text2:rgba(242,237,224,0.88);--text3:rgba(242,237,224,0.60);
  --cream:#f2ede0;
  --green:#96d485;--green2:rgba(150,212,133,0.25);--green3:rgba(150,212,133,0.12);--greenT:rgba(150,212,133,0.50);
  --gold:#e8d4a8;--gold-warm:#C8A882;
  --red:rgba(210,80,80,0.85);--red2:rgba(210,80,80,0.12);--redT:rgba(210,80,80,0.35);
  --zone-roots:#C8894A;--zone-stem:#5AAF78;--zone-leaves:#4A9E5C;--zone-flowers:#D4779A;--zone-breath:#6ABBE4;
}
.adm-root{font-family:'Jost',sans-serif;background:var(--bg);min-height:100vh;width:100vw;color:var(--text);display:flex;flex-direction:column}
.adm-topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 40px;border-bottom:1px solid var(--border2);background:var(--bg2);backdrop-filter:blur(10px);position:sticky;top:0;z-index:10}
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
.adm-btn.success{background:var(--green3);border:1px solid var(--greenT);color:var(--cream)}
.adm-btn.success:hover{background:var(--green2)}
/* TOAST */
.adm-toast{position:fixed;bottom:24px;right:24px;background:var(--bg3);border:1px solid var(--greenT);border-radius:10px;padding:10px 20px;font-size:12px;color:var(--cream);z-index:999;animation:fadeInUp .3s ease}
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
  const inp = { padding:'8px 10px', borderRadius:8, border:'1px solid var(--border2)', background:'var(--bg)', color:'var(--text2)', fontSize:13, fontFamily:"'Jost',sans-serif", outline:'none', width:'100%', boxSizing:'border-box', appearance:'none', WebkitAppearance:'none' }

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
  const label = { fontSize:10, color:'var(--text3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8, display:'block' }

  // ── Champs éditables titre rituel + titre exercice ───────
  const [editRituel, setEditRituel] = useState('')
  const [editTitle,  setEditTitle]  = useState('')
  useEffect(() => { setEditRituel(exercise?.rituel || '') }, [exercise])
  useEffect(() => { setEditTitle(exercise?.title  || '') }, [exercise])

  return (
    <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:24, alignItems:'start' }}>

      {/* ── Colonne gauche : accordéon ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:2, position:'sticky', top:20 }}>
        <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:12, paddingBottom:10, borderBottom:'1px solid var(--border2)' }}>
          Sélectionner un exercice
        </div>

        {Object.entries(ZONES_RITUELS).map(([k, v]) => {
          const isOpen = openZone === k
          return (
            <div key={k} style={{ borderRadius:10, overflow:'hidden', border: isOpen ? `1px solid ${v.color}35` : '1px solid transparent', background: isOpen ? `${v.color}08` : 'transparent', transition:'all .2s' }}>

              {/* ── En-tête zone ── */}
              <button onClick={() => toggleZone(k)} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 14px', background:'none', border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:13, textAlign:'left', color: isOpen ? v.color : 'var(--text3)', transition:'color .15s' }}>
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
                          style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 10px', borderRadius:8, background: isRituelOpen ? `${v.color}12` : 'transparent', border:'none', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:12, textAlign:'left', color: isRituelOpen ? 'var(--text2)' : 'var(--text3)', transition:'all .15s' }}>
                          <span style={{ fontSize:9, opacity:.4, transition:'transform .2s', display:'inline-block', transform: isRituelOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
                          {r}
                        </button>

                        {/* ── Exercices ── */}
                        {isRituelOpen && optTitles.length > 0 && (
                          <div style={{ paddingLeft:16, display:'flex', flexDirection:'column', gap:1, marginTop:2 }}>
                            {optTitles.map(ex => (
                              <button key={ex.title} onClick={() => setTitle(ex.title)}
                                style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 10px', borderRadius:7, background: title===ex.title ? `${v.color}15` : 'transparent', border: title===ex.title ? `1px solid ${v.color}30` : '1px solid transparent', cursor:'pointer', fontFamily:"'Jost',sans-serif", fontSize:11, textAlign:'left', color: title===ex.title ? 'var(--text2)' : 'var(--text3)', transition:'all .15s', lineHeight:1.4 }}>
                                <span style={{ fontSize:9, padding:'1px 5px', borderRadius:5, flexShrink:0, background: ex.mode==='quick' ? 'rgba(232,192,96,0.10)' : 'rgba(130,200,240,0.10)', color: ex.mode==='quick' ? 'var(--gold)' : 'var(--green)', border: ex.mode==='quick' ? '1px solid rgba(232,192,96,0.20)' : '1px solid rgba(130,200,240,0.20)' }}>
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
            <div style={{ fontSize:12, color:'var(--text3)', fontStyle:'italic' }}>
              {!zone ? 'Ouvrez une zone pour commencer' : !rituel ? 'Choisissez un rituel' : 'Choisissez un exercice'}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200 }}>
            <div style={{ fontSize:12, color:'var(--text3)', fontStyle:'italic' }}>Chargement…</div>
          </div>
        )}

        {exercise && !loading && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Header exercice */}
            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', background:`${zc}08`, border:`1px solid ${zc}25`, borderRadius:14 }}>
              <span style={{ fontSize:28, lineHeight:1, flexShrink:0 }}>{exercise.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:'var(--text2)', fontWeight:300, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{editTitle || exercise.title}</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:5 }}>
                  <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20, background:`${zc}15`, border:`1px solid ${zc}30`, color:zc }}>{ZONES_RITUELS[exercise.zone]?.name}</span>
                  <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--text3)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{editRituel || exercise.rituel}</span>
                  <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20, background: exercise.mode==='quick' ? 'rgba(232,192,96,0.08)' : 'rgba(130,200,240,0.08)', border: exercise.mode==='quick' ? '1px solid rgba(232,192,96,0.20)' : '1px solid rgba(130,200,240,0.20)', color: exercise.mode==='quick' ? 'var(--gold)' : 'var(--green)' }}>
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
                <span style={{ fontSize:10, color: desc.length > 320 ? (desc.length >= 350 ? 'var(--red)' : 'var(--gold)') : 'var(--text3)', fontWeight: desc.length > 320 ? 500 : 400 }}>{desc.length} / 350</span>
                <button
                  onClick={() => {
                    const text = `${editRituel}, ${editTitle}, ${desc}`
                    navigator.clipboard.writeText(text).then(() => showToast('✓ Copié'))
                  }}
                  style={{ padding:'5px 14px', borderRadius:20, border:'1px solid rgba(255,255,255,0.10)', background:'rgba(255,255,255,0.04)', color:'var(--text3)', fontSize:11, fontFamily:"'Jost',sans-serif", cursor:'pointer', letterSpacing:'.04em', transition:'all .15s' }}
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
//  VentesPartenairesAdmin
// ═══════════════════════════════════════════════════════════
function VentesPartenairesAdmin({ showToast }) {
  const [ventes,   setVentes]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [mois,     setMois]     = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  })

  const load = () => {
    setLoading(true)
    supabase.from('ventes_partenaires')
      .select('*, partenaires(nom_boutique, email, code_vendeur, user_id, type_vendeur), produits(titre, type, categorie)')
      .eq('mois_facturation', mois)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setVentes(data || []); setLoading(false) })
  }
  useEffect(() => { load() }, [mois])

  // Grouper par user_id MaFleur si dispo, sinon par partenaire_id
  const byPro = ventes.reduce((acc, v) => {
    const key = v.partenaires?.user_id || v.partenaire_id
    if (!acc[key]) acc[key] = {
      partenaire: v.partenaires,
      user_id: v.partenaires?.user_id || null,
      ventes: [], total_brut: 0, total_commission: 0, total_net: 0, all_reverse: true
    }
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
    const { error } = await supabase.from('ventes_partenaires')
      .update({ statut: 'reverse', reverse_le: new Date().toISOString() })
      .in('id', ids)
    if (error) { showToast('✗ ' + error.message); return }
    showToast('✓ Reversement marqué')
    load()
  }

  const fmt = (n) => `${Number(n).toFixed(2).replace('.', ',')} €`
  const inp = { padding:'6px 10px', borderRadius:6, border:'1px solid var(--border2)', background:'var(--bg)', color:'var(--text2)', fontSize:12, fontFamily:"'Jost',sans-serif", outline:'none' }

  return (
    <div style={{ marginTop:32, paddingTop:24, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'.12em', textTransform:'uppercase' }}>
          Ventes partenaires
        </div>
        <input type="month" value={mois} onChange={e => setMois(e.target.value)} style={{ ...inp }}/>
      </div>

      {loading ? (
        <div style={{ fontSize:12, color:'var(--text3)', fontStyle:'italic' }}>Chargement…</div>
      ) : Object.keys(byPro).length === 0 ? (
        <div style={{ fontSize:12, color:'var(--text3)', fontStyle:'italic', textAlign:'center', padding:'20px 0' }}>
          Aucune vente ce mois
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {Object.entries(byPro).map(([proKey, data]) => (
            <div key={proKey} style={{ padding:'16px', borderRadius:12, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)' }}>
              {/* Header partenaire */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:14, color:'var(--text2)', fontWeight:500 }}>
                    {data.partenaire?.nom_boutique}
                    {data.user_id && <span style={{ marginLeft:8, fontSize:9, padding:'1px 6px', borderRadius:10, background:'rgba(180,160,240,0.12)', border:'1px solid rgba(180,160,240,0.25)', color:'#b4a0f0' }}>🔗 MaFleur</span>}
                  </div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{data.partenaire?.email} · {data.ventes.length} vente{data.ventes.length > 1 ? 's' : ''}</div>
                </div>
                {!data.all_reverse && (
                  <button onClick={() => marquerReverses(proKey)}
                    style={{ padding:'6px 14px', borderRadius:8, fontSize:11, cursor:'pointer', fontFamily:"'Jost',sans-serif", background:'rgba(150,212,133,0.12)', border:'1px solid var(--greenT)', color:'var(--green)' }}>
                    ✓ Marquer reversé
                  </button>
                )}
                {data.all_reverse && (
                  <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:'rgba(150,212,133,0.10)', border:'1px solid var(--greenT)', color:'var(--green)' }}>✓ Reversé</span>
                )}
              </div>

              {/* Totaux */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 }}>
                {[
                  { lbl:'Total brut', val: fmt(data.total_brut), color:'var(--text2)' },
                  { lbl:'Commission 15%', val: fmt(data.total_commission), color:'var(--gold)' },
                  { lbl:'À reverser', val: fmt(data.total_net), color:'#96d485' },
                ].map(({ lbl, val, color }) => (
                  <div key={lbl} style={{ padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>{lbl}</div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:300, color }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Liste des ventes */}
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {data.ventes.map(v => (
                  <div key={v.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px', borderRadius:7, background:'rgba(255,255,255,0.02)' }}>
                    <div style={{ flex:1, fontSize:12, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {v.produits?.titre || 'Produit supprimé'}
                      {v.source === 'atelier' && <span style={{ marginLeft:6, fontSize:9, color:'#82c8f0' }}>📖 Atelier</span>}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text3)', whiteSpace:'nowrap' }}>{fmt(v.montant_brut)}</div>
                    <div style={{ fontSize:11, color:'var(--gold)', whiteSpace:'nowrap' }}>-{fmt(v.commission)}</div>
                    <div style={{ fontSize:11, color:'#96d485', whiteSpace:'nowrap', fontWeight:500 }}>{fmt(v.montant_net)}</div>
                    <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20, flexShrink:0,
                      background: v.statut==='reverse' ? 'rgba(150,212,133,0.10)' : 'rgba(232,192,96,0.10)',
                      border: v.statut==='reverse' ? '1px solid rgba(150,212,133,0.25)' : '1px solid rgba(232,192,96,0.25)',
                      color: v.statut==='reverse' ? '#96d485' : '#e8c060' }}>
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
//  PartenairesAdmin
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
//  ProWallet — Solde + historique inline dans la fiche pro
// ═══════════════════════════════════════════════════════════
function ProWallet({ userId, partenaireId }) {
  const [lumens,   setLumens]   = useState(null)
  const [ventesE,  setVentesE]  = useState([])
  const [ventesL,  setVentesL]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('euros') // euros | lumens

  useEffect(() => {
    setLoading(true)
    Promise.all([
      // Solde Lumens
      supabase.from('lumen_transactions').select('amount').eq('user_id', userId),
      // Ventes euros (3 derniers mois)
      supabase.from('ventes_partenaires')
        .select('montant_brut, commission, montant_net, statut, mois_facturation, source, reverse_le, produits(titre)')
        .eq('partenaire_id', partenaireId)
        .order('created_at', { ascending: false })
        .limit(20),
      // Ventes Lumens
      supabase.from('lumen_transactions')
        .select('amount, reason, meta, created_at')
        .eq('user_id', userId)
        .in('reason', ['vente_produit', 'vente_atelier'])
        .order('created_at', { ascending: false })
        .limit(20),
    ]).then(([lumenRes, ventesRes, lumensVentesRes]) => {
      const total = (lumenRes.data || []).reduce((s, t) => s + Number(t.amount), 0)
      setLumens(total)
      setVentesE(ventesRes.data || [])
      setVentesL(lumensVentesRes.data || [])
      setLoading(false)
    })
  }, [userId, partenaireId])

  const fmt = (n) => `${Number(n).toFixed(2).replace('.', ',')} €`
  const totalNet = ventesE.filter(v => v.statut === 'en_attente').reduce((s, v) => s + Number(v.montant_net), 0)
  const totalLumens = ventesL.reduce((s, v) => s + Number(v.amount), 0)
  const [openReverse, setOpenReverse] = useState(false)

  if (loading) return <div style={{ marginTop:12, fontSize:11, color:'var(--text3)', fontStyle:'italic' }}>Chargement…</div>

  return (
    <div style={{ marginTop:12, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:12 }}>
      {/* Soldes */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
        <div style={{ padding:'10px 12px', borderRadius:8, background:'rgba(150,212,133,0.06)', border:'1px solid rgba(150,212,133,0.15)' }}>
          <div style={{ fontSize:9, color:'rgba(150,212,133,0.60)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>À reverser ce mois</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:300, color:'#96d485' }}>{fmt(totalNet)}</div>
        </div>
        <div style={{ padding:'10px 12px', borderRadius:8, background:'rgba(232,192,96,0.06)', border:'1px solid rgba(232,192,96,0.15)' }}>
          <div style={{ fontSize:9, color:'rgba(232,192,96,0.60)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>Lumens reçus (ventes)</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:300, color:'#e8c060' }}>{totalLumens} ✦</div>
        </div>
        <div style={{ padding:'10px 12px', borderRadius:8, background:'rgba(180,160,240,0.06)', border:'1px solid rgba(180,160,240,0.15)' }}>
          <div style={{ fontSize:9, color:'rgba(180,160,240,0.60)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>Solde Lumens total</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:300, color:'#b4a0f0' }}>{lumens ?? '…'} ✦</div>
        </div>
      </div>

      {/* Onglets historique */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid rgba(255,255,255,0.07)', marginBottom:10 }}>
        {[['euros','💶 Ventes €'],['lumens','✦ Ventes Lumens']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'5px 14px', fontSize:10, background:'none', border:'none',
              borderBottom: tab===id ? '2px solid #e8c060' : '2px solid transparent',
              color: tab===id ? '#e8c060' : 'rgba(242,237,224,0.35)', cursor:'pointer',
              fontFamily:"'Jost',sans-serif", marginBottom:-1, letterSpacing:'.04em' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Euros */}
      {tab === 'euros' && (
        ventesE.length === 0 ? (
          <div style={{ fontSize:11, color:'var(--text3)', fontStyle:'italic' }}>Aucune vente enregistrée.</div>
        ) : (() => {
          const enAttente = ventesE.filter(v => v.statut !== 'reverse')
          const reversees  = ventesE.filter(v => v.statut === 'reverse')
          const totalReverse = reversees.reduce((s, v) => s + Number(v.montant_net), 0)
          const lastDate = reversees.filter(v => v.reverse_le).sort((a,b) => new Date(b.reverse_le) - new Date(a.reverse_le))[0]?.reverse_le

          const LigneVente = ({ v, showStatut }) => (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', borderRadius:6, background:'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize:9, color:'rgba(242,237,224,0.25)', flexShrink:0 }}>{v.mois_facturation}</div>
              <div style={{ flex:1, fontSize:11, color:'rgba(242,237,224,0.60)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {v.produits?.titre || 'Produit'}
                {v.source === 'atelier' && <span style={{ marginLeft:5, fontSize:9, color:'#82c8f0' }}>📖</span>}
              </div>
              <div style={{ fontSize:11, color:'#96d485', fontWeight:500, flexShrink:0 }}>{fmt(v.montant_net)}</div>
              {showStatut && (
                <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, flexShrink:0, background:'rgba(150,212,133,0.10)', color:'#96d485' }}>
                  reversé
                </span>
              )}
            </div>
          )

          return (
            <div style={{ display:'flex', flexDirection:'column', gap:3, maxHeight:280, overflowY:'auto' }}>
              {/* Lignes en attente — sans badge */}
              {enAttente.map((v, i) => <LigneVente key={i} v={v} showStatut={false} />)}

              {/* Accordéon reversées */}
              {reversees.length > 0 && (
                <div style={{ marginTop: enAttente.length ? 6 : 0 }}>
                  <div onClick={() => setOpenReverse(o => !o)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:6,
                      background:'rgba(150,212,133,0.06)', border:'1px solid rgba(150,212,133,0.15)', cursor:'pointer', userSelect:'none' }}>
                    <div style={{ flex:1, fontSize:11, color:'#96d485', fontWeight:500 }}>Total reversé</div>
                    <div style={{ fontSize:12, color:'#96d485', fontWeight:600 }}>{fmt(totalReverse)}</div>
                    {lastDate && <div style={{ fontSize:10, color:'rgba(150,212,133,0.55)' }}>{new Date(lastDate).toLocaleDateString('fr-FR')}</div>}
                    <div style={{ fontSize:10, color:'rgba(150,212,133,0.50)', marginLeft:4 }}>{openReverse ? '▲' : '▼'}</div>
                  </div>
                  {openReverse && (
                    <div style={{ display:'flex', flexDirection:'column', gap:2, marginTop:3, paddingLeft:8 }}>
                      {reversees.map((v, i) => <LigneVente key={i} v={v} showStatut={true} />)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })()
      )}

      {/* Lumens */}
      {tab === 'lumens' && (
        ventesL.length === 0 ? (
          <div style={{ fontSize:11, color:'var(--text3)', fontStyle:'italic' }}>Aucune vente en Lumens.</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:3, maxHeight:200, overflowY:'auto' }}>
            {ventesL.map((v, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', borderRadius:6, background:'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize:9, color:'rgba(242,237,224,0.25)', flexShrink:0 }}>{new Date(v.created_at).toLocaleDateString('fr-FR')}</div>
                <div style={{ flex:1, fontSize:11, color:'rgba(242,237,224,0.60)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {v.meta?.produit_titre || v.reason}
                </div>
                <div style={{ fontSize:12, color:'#e8c060', fontWeight:500, flexShrink:0 }}>+{v.amount} ✦</div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

function PartenairesAdmin({ showToast }) {
  const [partenaires, setPartenaires] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('en_attente')
  const [allUsers,   setAllUsers]   = useState([])
  const [linkingId,  setLinkingId]  = useState(null)
  const [expandedId, setExpandedId] = useState(null) // fiche ouverte pour historique

  const load = () => {
    setLoading(true)
    supabase.from('partenaires').select('*').order('created_at', { ascending:false })
      .then(({ data }) => { setPartenaires(data || []); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  // Charge les users MaFleur pour la liaison
  useEffect(() => {
    supabase.from('users').select('id, display_name, email').order('display_name')
      .then(({ data }) => setAllUsers(data || []))
  }, [])

  const linkUser = async (partenaireId, userId) => {
    const { error } = await supabase.from('partenaires').update({ user_id: userId || null }).eq('id', partenaireId)
    if (error) { showToast('✗ ' + error.message); return }
    showToast(userId ? '✓ Compte MaFleur lié' : '✓ Lien supprimé')
    setLinkingId(null)
    load()
  }

  const filtered = filter === 'all' ? partenaires : partenaires.filter(f => f.statut === filter)
  const pending = partenaires.filter(f => f.statut === 'en_attente').length

  const PARTENAIRE_STRIPE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '') + '/functions/v1/partenaire-stripe'

  const update = async (id, patch, msg) => {
    const { error } = await supabase.from('partenaires').update(patch).eq('id', id)
    if (error) { showToast('✗ ' + error.message); return }

    // Si on active un partenaire, créer les Price Stripe pour ses produits digitaux en attente
    if (patch.statut === 'actif') {
      const { data: produits } = await supabase.from('produits')
        .select('id, titre, description, prix, image_url, stripe_price_id, type')
        .eq('partenaire_id', id)
        .eq('type', 'digital')
        .is('stripe_price_id', null)

      const partenaireData = partenaires.find(f => f.id === id)
      if (produits?.length && partenaireData?.code_vendeur) {
        for (const p of produits) {
          if (!p.prix) continue
          try {
            await fetch(PARTENAIRE_STRIPE_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ produit_id: p.id, code_vendeur: partenaireData.code_vendeur, titre: p.titre, description: p.description, prix: p.prix, image_url: p.image_url }),
            })
          } catch (e) { console.warn('[stripe] produit', p.id, e) }
        }
        // Active aussi les produits en attente
        await supabase.from('produits').update({ statut: 'actif' }).eq('partenaire_id', id).eq('statut', 'en_attente')
      }
    }

    showToast(msg); load()
  }

  const sColors = { en_attente:'#e8c060', actif:'#96d485', suspendu:'rgba(255,140,140,0.7)' }

  return (
    <div style={{ marginTop:32, paddingTop:24, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'.12em', textTransform:'uppercase' }}>
          Partenaires
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
        <div style={{ fontSize:12, color:'var(--text3)', fontStyle:'italic' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ fontSize:12, color:'var(--text3)', fontStyle:'italic', textAlign:'center', padding:'20px 0' }}>
          Aucun partenaire dans cette catégorie
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(420px, 1fr))', gap:12 }}>
          {filtered.map(f => (
            <div key={f.id} style={{ padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,0.025)', border:`1px solid rgba(255,255,255,0.06)` }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:14, color:'var(--text2)', fontWeight:500 }}>
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

              {/* Lien compte MaFleur — pros uniquement */}
              {f.type_vendeur === 'professionnel' && (
                <div style={{ marginBottom:8, padding:'8px 12px', background:'rgba(180,160,240,0.06)', border:'1px solid rgba(180,160,240,0.18)', borderRadius:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:10, color:'rgba(180,160,240,0.80)', fontWeight:500, flexShrink:0 }}>🔗</span>
                    {linkingId === f.id ? (
                      <>
                        <select onChange={e => linkUser(f.id, e.target.value)} defaultValue=""
                          style={{ flex:1, padding:'5px 8px', borderRadius:6, border:'1px solid rgba(255,255,255,0.12)', background:'#0e1a0e', color:'rgba(242,237,224,0.85)', fontSize:11, fontFamily:"'Jost',sans-serif", outline:'none' }}>
                          <option value="" disabled>Choisir…</option>
                          <option value="">— Délier</option>
                          {allUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.display_name ? `${u.display_name} — ${u.email}` : u.email}</option>
                          ))}
                        </select>
                        <button onClick={() => setLinkingId(null)}
                          style={{ background:'none', border:'none', color:'rgba(242,237,224,0.35)', fontSize:11, cursor:'pointer', flexShrink:0 }}>✕</button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex:1, fontSize:11, color: f.user_id ? 'rgba(242,237,224,0.60)' : 'rgba(242,237,224,0.28)', fontStyle: f.user_id ? 'normal' : 'italic' }}>
                          {f.user_id
                            ? (() => { const u = allUsers.find(u => u.id === f.user_id); return u ? `${u.display_name || ''} ${u.email}`.trim() : f.user_id.slice(0,8) })()
                            : 'Non lié à un compte MaFleur'}
                        </span>
                        <button onClick={() => setLinkingId(f.id)}
                          style={{ padding:'3px 8px', borderRadius:5, fontSize:10, cursor:'pointer', fontFamily:"'Jost',sans-serif", background:'rgba(180,160,240,0.10)', border:'1px solid rgba(180,160,240,0.25)', color:'#b4a0f0', flexShrink:0 }}>
                          {f.user_id ? '↻' : '+ Lier'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

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
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {f.statut !== 'actif' && (
                  <button onClick={() => update(f.id, { statut:'actif' }, `✓ ${f.nom_boutique} activé`)}
                    style={{ padding:'6px 14px', borderRadius:8, fontSize:11, cursor:'pointer', fontFamily:"'Jost',sans-serif", background:'rgba(150,212,133,0.12)', border:'1px solid var(--greenT)', color:'var(--green)' }}>
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
                {f.type_vendeur === 'professionnel' && (
                  <button onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                    style={{ padding:'6px 14px', borderRadius:8, fontSize:11, cursor:'pointer', fontFamily:"'Jost',sans-serif", background: expandedId===f.id ? 'rgba(232,192,96,0.15)' : 'rgba(232,192,96,0.06)', border:'1px solid rgba(232,192,96,0.25)', color:'#e8c060' }}>
                    {expandedId === f.id ? '▲ Fermer' : '✦ Solde & Historique'}
                  </button>
                )}
              </div>

              {/* Portefeuille pro — inline */}
              {expandedId === f.id && f.user_id && (
                <ProWallet userId={f.user_id} partenaireId={f.id} />
              )}
              {expandedId === f.id && !f.user_id && (
                <div style={{ marginTop:10, fontSize:11, color:'rgba(232,192,96,0.60)', fontStyle:'italic' }}>
                  Liez d'abord ce partenaire à un compte MaFleur pour voir son solde.
                </div>
              )}
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
  digital:  ['Audio','Formation','E-book'],
  physique: ['Livre','Bijou','Pierre','Huile essentielle','Autre'],
  occasion: ['Livres','Bijoux','Pierres','Accessoires','Autres'],
}
const EMPTY_FORM = {
  type:'digital', categorie:'Audio', titre:'', description:'',
  prix:'', image_url:'', lien_externe:'', stripe_price_id:'',
  vendeur_nom:'', vendeur_contact:'', statut:'actif', ordre:0, storage_path:'',
  accepte_lumens:false, prix_lumens:'',
}

function BoutiqueEditor({ showToast }) {
  const [produits,   setProduits]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [editId,     setEditId]     = useState(null)
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)

  const inp = { padding:'8px 10px', borderRadius:8, border:'1px solid var(--border2)', background:'var(--bg)', color:'var(--text2)', fontSize:13, fontFamily:"'Jost',sans-serif", outline:'none', width:'100%', boxSizing:'border-box', appearance:'none', WebkitAppearance:'none' }
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
    setForm({ type:p.type, categorie:p.categorie||'', titre:p.titre||'', description:p.description||'', prix:p.prix??'', image_url:p.image_url||'', lien_externe:p.lien_externe||'', stripe_price_id:p.stripe_price_id||'', vendeur_nom:p.vendeur_nom||'', vendeur_contact:p.vendeur_contact||'', statut:p.statut||'actif', ordre:p.ordre||0, storage_path:p.storage_path||'', accepte_lumens:p.accepte_lumens||false, prix_lumens:p.prix_lumens??'' })
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
    console.log('[save] type:', form.type, '— prix:', form.prix, '— stripe_price_id:', JSON.stringify(form.stripe_price_id), '— savedId:', savedId)
    if (form.type === 'digital' && form.prix && !form.stripe_price_id && savedId) {
      console.log('[save] → appel Stripe en cours…')
      try {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token
        console.log('[save] token:', token ? 'ok' : 'ABSENT')
        if (!token) { showToast('✓ Produit sauvegardé — ⚠ Stripe : session expirée'); setSaving(false); setShowForm(false); load(); return }
        console.log('[save] URL:', STRIPE_PRODUCT_URL)
        const res = await fetch(STRIPE_PRODUCT_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ produit_id: savedId, titre: form.titre, description: form.description, prix: form.prix, image_url: form.image_url }),
        })
        const data = await res.json()
        if (res.ok && data.price_id) {
          // Double sécurité — on met aussi à jour depuis le front
          await supabase.from('produits').update({ stripe_price_id: data.price_id }).eq('id', savedId)
          showToast(`✓ Produit + Stripe créés — ${data.price_id}`)
        } else {
          showToast(`✓ Sauvegardé — ⚠ Stripe (${res.status}) : ${data.error || JSON.stringify(data)}`)
        }
      } catch(e) {
        showToast('✓ Sauvegardé — ⚠ Stripe : ' + (e instanceof Error ? e.message : String(e)))
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
        <div style={{ fontSize:12, color:'var(--text3)', fontStyle:'italic', padding:'20px 0' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ fontSize:12, color:'var(--text3)', fontStyle:'italic', textAlign:'center', padding:'40px 0' }}>
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

      <VentesPartenairesAdmin showToast={showToast} />
      <PartenairesAdmin showToast={showToast} />


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
              <div style={{ fontSize:12, color:'var(--text3)', fontStyle:'italic' }}>Chargement…</div>
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
                {/* Type — forcé à Digital pour l'instant */}
              <div style={{ display:'none' }}>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type:e.target.value, categorie:CAT_OPTS[e.target.value][0] }))} style={{ ...inp }}>
                  {TYPE_OPTS.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <span style={lbl}>Type</span>
                <div style={{ padding:'9px 12px', borderRadius:8, border:'1px solid rgba(180,160,240,0.30)', background:'rgba(180,160,240,0.08)', color:'#b4a0f0', fontSize:13, fontFamily:"'Jost',sans-serif" }}>
                  🎧 Digital
                </div>
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
                    <input value={form.stripe_price_id} onChange={e => setForm(f => ({ ...f, stripe_price_id:e.target.value }))} placeholder="price_..." style={{ ...inp, color: form.stripe_price_id ? '#96d485' : undefined }}/>
                    {!form.stripe_price_id && (
                      <button onClick={async () => {
                        const targetId = editId
                        if (!targetId) { showToast('Sauvegardez d\'abord le produit'); return }
                        if (!form.prix) { showToast('Renseignez le prix avant de créer dans Stripe'); return }
                        showToast('⏳ Création dans Stripe…')
                        try {
                          const session = await supabase.auth.getSession()
                          const token = session.data.session?.access_token
                          if (!token) { showToast('✗ Non connecté'); return }
                          const url = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '') + '/functions/v1/stripe-product'
                          const res = await fetch(url, {
                            method:'POST',
                            headers:{ 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' },
                            body: JSON.stringify({ produit_id:targetId, titre:form.titre, description:form.description, prix:form.prix, image_url:form.image_url })
                          })
                          const data = await res.json()
                          if (!res.ok) { showToast('✗ Stripe (' + res.status + ') : ' + (data.error || JSON.stringify(data))); return }
                          setForm(f => ({ ...f, stripe_price_id: data.price_id }))
                          showToast('✓ Stripe Price ID : ' + data.price_id)
                        } catch(e) { showToast('✗ Erreur réseau : ' + e.message) }
                      }}
                        style={{ marginTop:6, width:'100%', padding:'7px 12px', borderRadius:8, border:'1px dashed rgba(150,212,133,0.30)', background:'rgba(150,212,133,0.05)', color:'rgba(150,212,133,0.60)', fontSize:11, fontFamily:"'Jost',sans-serif", cursor:'pointer', textAlign:'center' }}>
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

              {/* Paiement en Lumens */}
              <div style={{ padding:'14px 16px', background:'rgba(232,192,96,0.06)', border:'1px solid rgba(232,192,96,0.20)', borderRadius:10 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: form.accepte_lumens ? 12 : 0 }}>
                  <div>
                    <div style={{ fontSize:12, color:'rgba(242,237,224,0.80)', fontWeight:500 }}>✦ Accepter les Lumens</div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>L'acheteur pourra payer en Lumens ou en euros</div>
                  </div>
                  <div onClick={() => setForm(f => ({ ...f, accepte_lumens:!f.accepte_lumens }))}
                    style={{ width:44, height:24, borderRadius:100, cursor:'pointer', flexShrink:0,
                      background: form.accepte_lumens ? 'rgba(232,192,96,0.35)' : 'rgba(255,255,255,0.08)',
                      border:`1px solid ${form.accepte_lumens ? 'rgba(232,192,96,0.5)' : 'rgba(255,255,255,0.12)'}`,
                      position:'relative', transition:'all .25s' }}>
                    <div style={{ position:'absolute', top:3, left: form.accepte_lumens ? 22 : 3, width:16, height:16, borderRadius:'50%',
                      background: form.accepte_lumens ? '#e8c060' : 'rgba(255,255,255,0.25)', transition:'left .25s, background .25s' }}/>
                  </div>
                </div>
                {form.accepte_lumens && (
                  <div>
                    <span style={lbl}>Prix en Lumens ✦</span>
                    <input type="number" min="1" value={form.prix_lumens} onChange={e => setForm(f => ({ ...f, prix_lumens:e.target.value }))}
                      placeholder="Ex: 50" style={{ ...inp, maxWidth:160 }}/>
                  </div>
                )}
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

// ThemeEditor — à intégrer dans AdminPage.jsx
// Composant autonome, appelle supabase directement

const CUSTOM_PRESETS_KEY = 'mji_custom_presets'

// ── Presets sombres ────────────────────────────────────────────────────────
const PRESETS_DARK = [
  { name:'Forêt',  emoji:'🌿', vars:{ '--bg':'#1a2e1a','--sidebar-bg':'rgba(0,0,0,0.18)','--topbar-bg':'rgba(0,0,0,0.08)','--nav-fs-logo':'18px','--nav-fs-section':'10px','--nav-fs-item':'13px','--nav-fs-icon':'15px','--nav-fs-badge':'9px','--nav-item-active-bg':'rgba(150,212,133,0.11)','--nav-item-active-color':'#96d485','--nav-item-hover-bg':'rgba(255,255,255,0.05)','--nav-item-hover-color':'rgba(242,237,224,0.85)','--bg2':'#213d21','--bg3':'#274827','--text':'#f2ede0','--text2':'rgba(242,237,224,0.85)','--text3':'rgba(242,237,224,0.55)','--cream':'#f2ede0','--green':'#96d485','--gold':'#e8d4a8','--gold-warm':'#C8A882','--red':'#e05050','--border':'rgba(255,255,255,0.14)','--border2':'rgba(255,255,255,0.08)','--surface-1':'rgba(255,255,255,0.03)','--surface-2':'rgba(255,255,255,0.05)','--surface-3':'rgba(255,255,255,0.08)','--surface-hover':'rgba(255,255,255,0.05)','--overlay':'rgba(0,0,0,0.65)','--overlay-dark':'rgba(6,14,7,0.97)','--modal-bg':'linear-gradient(170deg,#213d21 0%,#1a2e1a 100%)','--modal-surface':'linear-gradient(160deg,#0e1a0f 0%,#060d07 100%)','--separator':'rgba(255,255,255,0.18)','--track':'rgba(255,255,255,0.07)','--shadow-sm':'0 1px 3px rgba(0,0,0,0.30)','--shadow':'0 4px 16px rgba(0,0,0,0.45)','--lumens':'#b4a0f0','--text-on-dark':'#f2ede0','--zone-roots-bg':'#120A03','--zone-stem-bg':'#060F08','--zone-leaves-bg':'#060C08','--zone-flowers-bg':'#0E0508','--zone-breath-bg':'#03090E','--zone-card-bg':'var(--bg3)','--zone-card-text':'var(--text)','--zone-card-text-sub':'var(--text3)','--zone-roots':'#C8894A','--zone-stem':'#5AAF78','--zone-leaves':'#4A9E5C','--zone-flowers':'#D4779A','--zone-breath':'#6ABBE4','--badge-lvl1':'#C8F0B8','--badge-lvl2':'#82C8F0','--badge-lvl3':'#F6C453' } },
  { name:'Nuit',   emoji:'🌙', vars:{ '--bg':'#0d1520','--sidebar-bg':'rgba(0,0,0,0.18)','--topbar-bg':'rgba(0,0,0,0.08)','--nav-fs-logo':'18px','--nav-fs-section':'10px','--nav-fs-item':'13px','--nav-fs-icon':'15px','--nav-fs-badge':'9px','--nav-item-active-bg':'rgba(150,212,133,0.11)','--nav-item-active-color':'#96d485','--nav-item-hover-bg':'rgba(255,255,255,0.05)','--nav-item-hover-color':'rgba(242,237,224,0.85)','--bg2':'#131d2e','--bg3':'#1a2640','--text':'#e8eaf0','--text2':'rgba(232,234,240,0.85)','--text3':'rgba(232,234,240,0.50)','--cream':'#e8eaf0','--green':'#7eb8f7','--gold':'#c9d4f0','--gold-warm':'#a8b8d8','--red':'#e07070','--border':'rgba(255,255,255,0.12)','--border2':'rgba(255,255,255,0.07)','--surface-1':'rgba(255,255,255,0.03)','--surface-2':'rgba(255,255,255,0.05)','--surface-3':'rgba(255,255,255,0.08)','--surface-hover':'rgba(255,255,255,0.05)','--overlay':'rgba(0,0,0,0.70)','--overlay-dark':'rgba(4,8,18,0.97)','--modal-bg':'linear-gradient(170deg,#131d2e 0%,#0d1520 100%)','--modal-surface':'linear-gradient(160deg,#080d18 0%,#040810 100%)','--separator':'rgba(255,255,255,0.18)','--track':'rgba(255,255,255,0.07)','--shadow-sm':'0 1px 3px rgba(0,0,0,0.40)','--shadow':'0 4px 16px rgba(0,0,0,0.55)','--lumens':'#a090e8','--text-on-dark':'#e8eaf0','--zone-roots-bg':'#120A03','--zone-stem-bg':'#060F08','--zone-leaves-bg':'#060C08','--zone-flowers-bg':'#0E0508','--zone-breath-bg':'#03090E','--zone-card-bg':'var(--bg3)','--zone-card-text':'var(--text)','--zone-card-text-sub':'var(--text3)','--zone-roots':'#C8894A','--zone-stem':'#5AAF78','--zone-leaves':'#4A9E5C','--zone-flowers':'#D4779A','--zone-breath':'#6ABBE4','--badge-lvl1':'#C8F0B8','--badge-lvl2':'#82C8F0','--badge-lvl3':'#F6C453' } },
  { name:'Aube',   emoji:'🌸', vars:{ '--bg':'#2a1a1e','--sidebar-bg':'rgba(0,0,0,0.18)','--topbar-bg':'rgba(0,0,0,0.08)','--nav-fs-logo':'18px','--nav-fs-section':'10px','--nav-fs-item':'13px','--nav-fs-icon':'15px','--nav-fs-badge':'9px','--nav-item-active-bg':'rgba(150,212,133,0.11)','--nav-item-active-color':'#96d485','--nav-item-hover-bg':'rgba(255,255,255,0.05)','--nav-item-hover-color':'rgba(242,237,224,0.85)','--bg2':'#3d2128','--bg3':'#4a2730','--text':'#f5ede8','--text2':'rgba(245,237,232,0.85)','--text3':'rgba(245,237,232,0.50)','--cream':'#f5ede8','--green':'#e8a0a8','--gold':'#f0d4c0','--gold-warm':'#d4a882','--red':'#e08080','--border':'rgba(255,255,255,0.13)','--border2':'rgba(255,255,255,0.07)','--surface-1':'rgba(255,255,255,0.03)','--surface-2':'rgba(255,255,255,0.05)','--surface-3':'rgba(255,255,255,0.08)','--surface-hover':'rgba(255,255,255,0.05)','--overlay':'rgba(0,0,0,0.65)','--overlay-dark':'rgba(16,6,8,0.97)','--modal-bg':'linear-gradient(170deg,#3d2128 0%,#2a1a1e 100%)','--modal-surface':'linear-gradient(160deg,#1a0c10 0%,#0e0608 100%)','--separator':'rgba(255,255,255,0.18)','--track':'rgba(255,255,255,0.07)','--shadow-sm':'0 1px 3px rgba(0,0,0,0.35)','--shadow':'0 4px 16px rgba(0,0,0,0.50)','--lumens':'#c8a0d0','--text-on-dark':'#f5ede8','--zone-roots-bg':'#120A03','--zone-stem-bg':'#060F08','--zone-leaves-bg':'#060C08','--zone-flowers-bg':'#0E0508','--zone-breath-bg':'#03090E','--zone-card-bg':'var(--bg3)','--zone-card-text':'var(--text)','--zone-card-text-sub':'var(--text3)','--zone-roots':'#C8894A','--zone-stem':'#5AAF78','--zone-leaves':'#4A9E5C','--zone-flowers':'#D4779A','--zone-breath':'#6ABBE4','--badge-lvl1':'#C8F0B8','--badge-lvl2':'#82C8F0','--badge-lvl3':'#F6C453' } },
  { name:'Terre',  emoji:'🏜️', vars:{ '--bg':'#1e1a0e','--sidebar-bg':'rgba(0,0,0,0.18)','--topbar-bg':'rgba(0,0,0,0.08)','--nav-fs-logo':'18px','--nav-fs-section':'10px','--nav-fs-item':'13px','--nav-fs-icon':'15px','--nav-fs-badge':'9px','--nav-item-active-bg':'rgba(150,212,133,0.11)','--nav-item-active-color':'#96d485','--nav-item-hover-bg':'rgba(255,255,255,0.05)','--nav-item-hover-color':'rgba(242,237,224,0.85)','--bg2':'#2a2410','--bg3':'#352e14','--text':'#f0ead8','--text2':'rgba(240,234,216,0.85)','--text3':'rgba(240,234,216,0.50)','--cream':'#f0ead8','--green':'#d4a855','--gold':'#e8d4a8','--gold-warm':'#c8944a','--red':'#d06040','--border':'rgba(255,255,255,0.13)','--border2':'rgba(255,255,255,0.07)','--surface-1':'rgba(255,255,255,0.03)','--surface-2':'rgba(255,255,255,0.05)','--surface-3':'rgba(255,255,255,0.08)','--surface-hover':'rgba(255,255,255,0.05)','--overlay':'rgba(0,0,0,0.65)','--overlay-dark':'rgba(10,8,4,0.97)','--modal-bg':'linear-gradient(170deg,#2a2410 0%,#1e1a0e 100%)','--modal-surface':'linear-gradient(160deg,#100e06 0%,#080604 100%)','--separator':'rgba(255,255,255,0.18)','--track':'rgba(255,255,255,0.07)','--shadow-sm':'0 1px 3px rgba(0,0,0,0.35)','--shadow':'0 4px 16px rgba(0,0,0,0.50)','--lumens':'#a0b8e0','--text-on-dark':'#f0ead8','--zone-roots-bg':'#120A03','--zone-stem-bg':'#060F08','--zone-leaves-bg':'#060C08','--zone-flowers-bg':'#0E0508','--zone-breath-bg':'#03090E','--zone-card-bg':'var(--bg3)','--zone-card-text':'var(--text)','--zone-card-text-sub':'var(--text3)','--zone-roots':'#C8894A','--zone-stem':'#5AAF78','--zone-leaves':'#4A9E5C','--zone-flowers':'#D4779A','--zone-breath':'#6ABBE4','--badge-lvl1':'#C8F0B8','--badge-lvl2':'#82C8F0','--badge-lvl3':'#F6C453' } },
  { name:'Océan',  emoji:'🌊', vars:{ '--bg':'#0a1a22','--sidebar-bg':'rgba(0,0,0,0.18)','--topbar-bg':'rgba(0,0,0,0.08)','--nav-fs-logo':'18px','--nav-fs-section':'10px','--nav-fs-item':'13px','--nav-fs-icon':'15px','--nav-fs-badge':'9px','--nav-item-active-bg':'rgba(150,212,133,0.11)','--nav-item-active-color':'#96d485','--nav-item-hover-bg':'rgba(255,255,255,0.05)','--nav-item-hover-color':'rgba(242,237,224,0.85)','--bg2':'#0f2530','--bg3':'#14303e','--text':'#e0eff5','--text2':'rgba(224,239,245,0.85)','--text3':'rgba(224,239,245,0.50)','--cream':'#e0eff5','--green':'#5bc8d8','--gold':'#a8d4e8','--gold-warm':'#78b4cc','--red':'#e08080','--border':'rgba(255,255,255,0.12)','--border2':'rgba(255,255,255,0.07)','--surface-1':'rgba(255,255,255,0.03)','--surface-2':'rgba(255,255,255,0.05)','--surface-3':'rgba(255,255,255,0.08)','--surface-hover':'rgba(255,255,255,0.05)','--overlay':'rgba(0,0,0,0.70)','--overlay-dark':'rgba(4,10,14,0.97)','--modal-bg':'linear-gradient(170deg,#0f2530 0%,#0a1a22 100%)','--modal-surface':'linear-gradient(160deg,#061018 0%,#040810 100%)','--separator':'rgba(255,255,255,0.18)','--track':'rgba(255,255,255,0.07)','--shadow-sm':'0 1px 3px rgba(0,0,0,0.40)','--shadow':'0 4px 16px rgba(0,0,0,0.55)','--lumens':'#88c8d8','--text-on-dark':'#e0eff5','--zone-roots-bg':'#120A03','--zone-stem-bg':'#060F08','--zone-leaves-bg':'#060C08','--zone-flowers-bg':'#0E0508','--zone-breath-bg':'#03090E','--zone-card-bg':'var(--bg3)','--zone-card-text':'var(--text)','--zone-card-text-sub':'var(--text3)','--zone-roots':'#C8894A','--zone-stem':'#5AAF78','--zone-leaves':'#4A9E5C','--zone-flowers':'#D4779A','--zone-breath':'#6ABBE4','--badge-lvl1':'#C8F0B8','--badge-lvl2':'#82C8F0','--badge-lvl3':'#F6C453' } },
  { name:'Ambre',  emoji:'🍂', vars:{ '--bg':'#1e1408','--sidebar-bg':'rgba(0,0,0,0.18)','--topbar-bg':'rgba(0,0,0,0.08)','--nav-fs-logo':'18px','--nav-fs-section':'10px','--nav-fs-item':'13px','--nav-fs-icon':'15px','--nav-fs-badge':'9px','--nav-item-active-bg':'rgba(150,212,133,0.11)','--nav-item-active-color':'#96d485','--nav-item-hover-bg':'rgba(255,255,255,0.05)','--nav-item-hover-color':'rgba(242,237,224,0.85)','--bg2':'#2a1c0c','--bg3':'#352412','--text':'#f5e8d0','--text2':'rgba(245,232,208,0.88)','--text3':'rgba(245,232,208,0.52)','--cream':'#f5e8d0','--green':'#e8a040','--gold':'#f0cc80','--gold-warm':'#d48030','--red':'#e06030','--border':'rgba(255,255,255,0.13)','--border2':'rgba(255,255,255,0.07)','--surface-1':'rgba(255,255,255,0.03)','--surface-2':'rgba(255,255,255,0.05)','--surface-3':'rgba(255,255,255,0.08)','--surface-hover':'rgba(255,255,255,0.05)','--overlay':'rgba(0,0,0,0.65)','--overlay-dark':'rgba(10,6,2,0.97)','--modal-bg':'linear-gradient(170deg,#2a1c0c 0%,#1e1408 100%)','--modal-surface':'linear-gradient(160deg,#100a04 0%,#080402 100%)','--separator':'rgba(255,255,255,0.18)','--track':'rgba(255,255,255,0.07)','--shadow-sm':'0 1px 3px rgba(0,0,0,0.35)','--shadow':'0 4px 16px rgba(0,0,0,0.50)','--lumens':'#d0a860','--text-on-dark':'#f5e8d0','--zone-roots-bg':'#120A03','--zone-stem-bg':'#060F08','--zone-leaves-bg':'#060C08','--zone-flowers-bg':'#0E0508','--zone-breath-bg':'#03090E','--zone-card-bg':'var(--bg3)','--zone-card-text':'var(--text)','--zone-card-text-sub':'var(--text3)','--zone-roots':'#C8894A','--zone-stem':'#5AAF78','--zone-leaves':'#4A9E5C','--zone-flowers':'#D4779A','--zone-breath':'#6ABBE4','--badge-lvl1':'#C8F0B8','--badge-lvl2':'#82C8F0','--badge-lvl3':'#F6C453' } },
  { name:'Minuit', emoji:'🔮', vars:{ '--bg':'#100c1e','--sidebar-bg':'rgba(0,0,0,0.18)','--topbar-bg':'rgba(0,0,0,0.08)','--nav-fs-logo':'18px','--nav-fs-section':'10px','--nav-fs-item':'13px','--nav-fs-icon':'15px','--nav-fs-badge':'9px','--nav-item-active-bg':'rgba(150,212,133,0.11)','--nav-item-active-color':'#96d485','--nav-item-hover-bg':'rgba(255,255,255,0.05)','--nav-item-hover-color':'rgba(242,237,224,0.85)','--bg2':'#18142c','--bg3':'#201a38','--text':'#ece8f8','--text2':'rgba(236,232,248,0.85)','--text3':'rgba(236,232,248,0.48)','--cream':'#ece8f8','--green':'#b090f0','--gold':'#e0c8f8','--gold-warm':'#c8a0e0','--red':'#e090c0','--border':'rgba(255,255,255,0.13)','--border2':'rgba(255,255,255,0.07)','--surface-1':'rgba(255,255,255,0.03)','--surface-2':'rgba(255,255,255,0.05)','--surface-3':'rgba(255,255,255,0.08)','--surface-hover':'rgba(255,255,255,0.05)','--overlay':'rgba(0,0,0,0.72)','--overlay-dark':'rgba(6,4,14,0.97)','--modal-bg':'linear-gradient(170deg,#18142c 0%,#100c1e 100%)','--modal-surface':'linear-gradient(160deg,#0c0818 0%,#060410 100%)','--separator':'rgba(255,255,255,0.18)','--track':'rgba(255,255,255,0.07)','--shadow-sm':'0 1px 3px rgba(0,0,0,0.45)','--shadow':'0 4px 16px rgba(0,0,0,0.60)','--lumens':'#c8a8f8','--text-on-dark':'#ece8f8','--zone-roots-bg':'#120A03','--zone-stem-bg':'#060F08','--zone-leaves-bg':'#060C08','--zone-flowers-bg':'#0E0508','--zone-breath-bg':'#03090E','--zone-card-bg':'var(--bg3)','--zone-card-text':'var(--text)','--zone-card-text-sub':'var(--text3)','--zone-roots':'#C8894A','--zone-stem':'#5AAF78','--zone-leaves':'#4A9E5C','--zone-flowers':'#D4779A','--zone-breath':'#6ABBE4','--badge-lvl1':'#C8F0B8','--badge-lvl2':'#82C8F0','--badge-lvl3':'#F6C453' } },
]

// ── Presets clairs ─────────────────────────────────────────────────────────
const PRESETS_LIGHT = [
  { name:'Kaki',       emoji:'🌾', vars:{ '--bg':'#EEEACB','--sidebar-bg':'rgba(0,0,0,0.06)','--topbar-bg':'rgba(0,0,0,0.04)','--nav-fs-logo':'18px','--nav-fs-section':'10px','--nav-fs-item':'13px','--nav-fs-icon':'15px','--nav-fs-badge':'9px','--nav-item-active-bg':'rgba(80,120,60,0.12)','--nav-item-active-color':'#3a6830','--nav-item-hover-bg':'rgba(0,0,0,0.05)','--nav-item-hover-color':'rgba(40,40,30,0.75)','--bg2':'#f7f5e4','--bg3':'#e4e0b8','--text':'#2e3020','--text2':'rgba(46,48,32,0.78)','--text3':'rgba(46,48,32,0.45)','--cream':'#2e3020','--green':'#5a7a3a','--gold':'#8a6030','--gold-warm':'#a07840','--red':'#b84040','--border':'rgba(46,48,32,0.18)','--border2':'rgba(46,48,32,0.10)','--surface-1':'rgba(46,48,32,0.04)','--surface-2':'rgba(46,48,32,0.07)','--surface-3':'rgba(46,48,32,0.11)','--surface-hover':'rgba(46,48,32,0.06)','--overlay':'rgba(20,22,10,0.55)','--overlay-dark':'rgba(20,22,10,0.92)','--modal-bg':'linear-gradient(170deg,#f7f5e4 0%,#EEEACB 100%)','--modal-surface':'linear-gradient(160deg,#d8d4a0 0%,#c8c490 100%)','--separator':'rgba(46,48,32,0.15)','--track':'rgba(46,48,32,0.10)','--shadow-sm':'0 1px 3px rgba(46,48,32,0.08)','--shadow':'0 4px 14px rgba(46,48,32,0.12)','--lumens':'#7060b0','--text-on-dark':'#2e3020','--zone-roots-bg':'#f8f0e8','--zone-stem-bg':'#eef5ee','--zone-leaves-bg':'#edf5ed','--zone-flowers-bg':'#f8eef4','--zone-breath-bg':'#eef2f8','--zone-card-bg':'var(--bg3)','--zone-card-text':'var(--text)','--zone-card-text-sub':'var(--text3)','--zone-roots':'#B86A30','--zone-stem':'#4A8C58','--zone-leaves':'#3A8048','--zone-flowers':'#C05888','--zone-breath':'#4090B8','--badge-lvl1':'#4A9E5C','--badge-lvl2':'#3A7FB0','--badge-lvl3':'#A07820' } },
  { name:'Crème',      emoji:'☁️',  vars:{ '--bg':'#f9f6ed','--sidebar-bg':'rgba(0,0,0,0.06)','--topbar-bg':'rgba(0,0,0,0.04)','--nav-fs-logo':'18px','--nav-fs-section':'10px','--nav-fs-item':'13px','--nav-fs-icon':'15px','--nav-fs-badge':'9px','--nav-item-active-bg':'rgba(80,120,60,0.12)','--nav-item-active-color':'#3a6830','--nav-item-hover-bg':'rgba(0,0,0,0.05)','--nav-item-hover-color':'rgba(40,40,30,0.75)','--bg2':'#ffffff','--bg3':'#f0ece0','--text':'#2a2820','--text2':'rgba(42,40,32,0.75)','--text3':'rgba(42,40,32,0.42)','--cream':'#2a2820','--green':'#4a7c50','--gold':'#8c6828','--gold-warm':'#a07838','--red':'#b84038','--border':'rgba(42,40,32,0.14)','--border2':'rgba(42,40,32,0.08)','--surface-1':'rgba(42,40,32,0.04)','--surface-2':'rgba(42,40,32,0.06)','--surface-3':'rgba(42,40,32,0.10)','--surface-hover':'rgba(42,40,32,0.05)','--overlay':'rgba(20,18,10,0.55)','--overlay-dark':'rgba(20,18,10,0.92)','--modal-bg':'linear-gradient(170deg,#ffffff 0%,#f9f6ed 100%)','--modal-surface':'linear-gradient(160deg,#e8e4d8 0%,#d8d4c8 100%)','--separator':'rgba(42,40,32,0.14)','--track':'rgba(42,40,32,0.09)','--shadow-sm':'0 1px 3px rgba(42,40,32,0.07)','--shadow':'0 4px 14px rgba(42,40,32,0.11)','--lumens':'#6858a8','--text-on-dark':'#2a2820','--zone-roots-bg':'#f8f0e8','--zone-stem-bg':'#eef5ee','--zone-leaves-bg':'#edf5ed','--zone-flowers-bg':'#f8eef4','--zone-breath-bg':'#eef2f8','--zone-card-bg':'var(--bg3)','--zone-card-text':'var(--text)','--zone-card-text-sub':'var(--text3)','--zone-roots':'#B87040','--zone-stem':'#4A9060','--zone-leaves':'#3A8850','--zone-flowers':'#C06090','--zone-breath':'#4898C0','--badge-lvl1':'#4A9E5C','--badge-lvl2':'#3A7FB0','--badge-lvl3':'#A07820' } },
  { name:'Sable',      emoji:'🏖️', vars:{ '--bg':'#f0e8d8','--sidebar-bg':'rgba(0,0,0,0.06)','--topbar-bg':'rgba(0,0,0,0.04)','--nav-fs-logo':'18px','--nav-fs-section':'10px','--nav-fs-item':'13px','--nav-fs-icon':'15px','--nav-fs-badge':'9px','--nav-item-active-bg':'rgba(80,120,60,0.12)','--nav-item-active-color':'#3a6830','--nav-item-hover-bg':'rgba(0,0,0,0.05)','--nav-item-hover-color':'rgba(40,40,30,0.75)','--bg2':'#f8f2e8','--bg3':'#e6dcc8','--text':'#2c2618','--text2':'rgba(44,38,24,0.76)','--text3':'rgba(44,38,24,0.44)','--cream':'#2c2618','--green':'#607840','--gold':'#906030','--gold-warm':'#a87040','--red':'#a83828','--border':'rgba(44,38,24,0.15)','--border2':'rgba(44,38,24,0.08)','--surface-1':'rgba(44,38,24,0.04)','--surface-2':'rgba(44,38,24,0.07)','--surface-3':'rgba(44,38,24,0.11)','--surface-hover':'rgba(44,38,24,0.06)','--overlay':'rgba(20,14,8,0.55)','--overlay-dark':'rgba(20,14,8,0.93)','--modal-bg':'linear-gradient(170deg,#f8f2e8 0%,#f0e8d8 100%)','--modal-surface':'linear-gradient(160deg,#d8cdb8 0%,#c8bda8 100%)','--separator':'rgba(44,38,24,0.15)','--track':'rgba(44,38,24,0.09)','--shadow-sm':'0 1px 3px rgba(44,38,24,0.08)','--shadow':'0 4px 14px rgba(44,38,24,0.13)','--lumens':'#806898','--text-on-dark':'#2c2618','--zone-roots-bg':'#f8f0e8','--zone-stem-bg':'#eef5ee','--zone-leaves-bg':'#edf5ed','--zone-flowers-bg':'#f8eef4','--zone-breath-bg':'#eef2f8','--zone-card-bg':'var(--bg3)','--zone-card-text':'var(--text)','--zone-card-text-sub':'var(--text3)','--zone-roots':'#C07840','--zone-stem':'#508050','--zone-leaves':'#407848','--zone-flowers':'#B85880','--zone-breath':'#4888B0','--badge-lvl1':'#4A9E5C','--badge-lvl2':'#3A7FB0','--badge-lvl3':'#A07820' } },
  { name:'Terracotta', emoji:'🏺', vars:{ '--bg':'#f2e8e0','--sidebar-bg':'rgba(0,0,0,0.06)','--topbar-bg':'rgba(0,0,0,0.04)','--nav-fs-logo':'18px','--nav-fs-section':'10px','--nav-fs-item':'13px','--nav-fs-icon':'15px','--nav-fs-badge':'9px','--nav-item-active-bg':'rgba(80,120,60,0.12)','--nav-item-active-color':'#3a6830','--nav-item-hover-bg':'rgba(0,0,0,0.05)','--nav-item-hover-color':'rgba(40,40,30,0.75)','--bg2':'#faf4ef','--bg3':'#e8dbd0','--text':'#2e2018','--text2':'rgba(46,32,24,0.76)','--text3':'rgba(46,32,24,0.44)','--cream':'#2e2018','--green':'#D7A28C','--gold':'#BA8383','--gold-warm':'#c07060','--red':'#a83828','--border':'rgba(46,32,24,0.14)','--border2':'rgba(46,32,24,0.08)','--surface-1':'rgba(46,32,24,0.04)','--surface-2':'rgba(46,32,24,0.07)','--surface-3':'rgba(46,32,24,0.11)','--surface-hover':'rgba(46,32,24,0.06)','--overlay':'rgba(20,10,6,0.55)','--overlay-dark':'rgba(20,10,6,0.93)','--modal-bg':'linear-gradient(170deg,#faf4ef 0%,#f2e8e0 100%)','--modal-surface':'linear-gradient(160deg,#d8c8c0 0%,#c8b8b0 100%)','--separator':'rgba(46,32,24,0.14)','--track':'rgba(46,32,24,0.09)','--shadow-sm':'0 1px 3px rgba(46,32,24,0.08)','--shadow':'0 4px 14px rgba(46,32,24,0.13)','--lumens':'#907080','--text-on-dark':'#2e2018','--zone-roots-bg':'#f8f0e8','--zone-stem-bg':'#eef5ee','--zone-leaves-bg':'#edf5ed','--zone-flowers-bg':'#f8eef4','--zone-breath-bg':'#eef2f8','--zone-card-bg':'var(--bg3)','--zone-card-text':'var(--text)','--zone-card-text-sub':'var(--text3)','--zone-roots':'#D7A28C','--zone-stem':'#A1A27E','--zone-leaves':'#8a9068','--zone-flowers':'#BA8383','--zone-breath':'#A1A27E','--badge-lvl1':'#4A9E5C','--badge-lvl2':'#3A7FB0','--badge-lvl3':'#A07820' } },
  { name:'Olive',      emoji:'🫒', vars:{ '--bg':'#edecd8','--sidebar-bg':'rgba(0,0,0,0.06)','--topbar-bg':'rgba(0,0,0,0.04)','--nav-fs-logo':'18px','--nav-fs-section':'10px','--nav-fs-item':'13px','--nav-fs-icon':'15px','--nav-fs-badge':'9px','--nav-item-active-bg':'rgba(80,120,60,0.12)','--nav-item-active-color':'#3a6830','--nav-item-hover-bg':'rgba(0,0,0,0.05)','--nav-item-hover-color':'rgba(40,40,30,0.75)','--bg2':'#f5f4e8','--bg3':'#e0dec8','--text':'#282c18','--text2':'rgba(40,44,24,0.76)','--text3':'rgba(40,44,24,0.44)','--cream':'#282c18','--green':'#A1A27E','--gold':'#8c7830','--gold-warm':'#a08840','--red':'#a83828','--border':'rgba(40,44,24,0.15)','--border2':'rgba(40,44,24,0.08)','--surface-1':'rgba(40,44,24,0.04)','--surface-2':'rgba(40,44,24,0.07)','--surface-3':'rgba(40,44,24,0.11)','--surface-hover':'rgba(40,44,24,0.06)','--overlay':'rgba(16,18,8,0.55)','--overlay-dark':'rgba(16,18,8,0.93)','--modal-bg':'linear-gradient(170deg,#f5f4e8 0%,#edecd8 100%)','--modal-surface':'linear-gradient(160deg,#d4d2c0 0%,#c4c2b0 100%)','--separator':'rgba(40,44,24,0.15)','--track':'rgba(40,44,24,0.09)','--shadow-sm':'0 1px 3px rgba(40,44,24,0.08)','--shadow':'0 4px 14px rgba(40,44,24,0.12)','--lumens':'#806898','--text-on-dark':'#282c18','--zone-roots-bg':'#f8f0e8','--zone-stem-bg':'#eef5ee','--zone-leaves-bg':'#edf5ed','--zone-flowers-bg':'#f8eef4','--zone-breath-bg':'#eef2f8','--zone-card-bg':'var(--bg3)','--zone-card-text':'var(--text)','--zone-card-text-sub':'var(--text3)','--zone-roots':'#C8894A','--zone-stem':'#6a8858','--zone-leaves':'#588050','--zone-flowers':'#C06888','--zone-breath':'#5090B0','--badge-lvl1':'#4A9E5C','--badge-lvl2':'#3A7FB0','--badge-lvl3':'#A07820' } },
  { name:'Brume',      emoji:'🌫️', vars:{ '--bg':'#eeeef4','--sidebar-bg':'rgba(0,0,0,0.06)','--topbar-bg':'rgba(0,0,0,0.04)','--nav-fs-logo':'18px','--nav-fs-section':'10px','--nav-fs-item':'13px','--nav-fs-icon':'15px','--nav-fs-badge':'9px','--nav-item-active-bg':'rgba(80,120,60,0.12)','--nav-item-active-color':'#3a6830','--nav-item-hover-bg':'rgba(0,0,0,0.05)','--nav-item-hover-color':'rgba(40,40,30,0.75)','--bg2':'#f8f8fc','--bg3':'#e4e4ec','--text':'#222230','--text2':'rgba(34,34,48,0.74)','--text3':'rgba(34,34,48,0.42)','--cream':'#222230','--green':'#5870a0','--gold':'#806848','--gold-warm':'#907858','--red':'#a03848','--border':'rgba(34,34,48,0.13)','--border2':'rgba(34,34,48,0.07)','--surface-1':'rgba(34,34,48,0.04)','--surface-2':'rgba(34,34,48,0.06)','--surface-3':'rgba(34,34,48,0.10)','--surface-hover':'rgba(34,34,48,0.05)','--overlay':'rgba(14,14,24,0.55)','--overlay-dark':'rgba(14,14,24,0.92)','--modal-bg':'linear-gradient(170deg,#f8f8fc 0%,#eeeef4 100%)','--modal-surface':'linear-gradient(160deg,#d8d8e4 0%,#c8c8d8 100%)','--separator':'rgba(34,34,48,0.13)','--track':'rgba(34,34,48,0.08)','--shadow-sm':'0 1px 3px rgba(34,34,48,0.07)','--shadow':'0 4px 14px rgba(34,34,48,0.11)','--lumens':'#7060a8','--text-on-dark':'#222230','--zone-roots-bg':'#f8f0e8','--zone-stem-bg':'#eef5ee','--zone-leaves-bg':'#edf5ed','--zone-flowers-bg':'#f8eef4','--zone-breath-bg':'#eef2f8','--zone-card-bg':'var(--bg3)','--zone-card-text':'var(--text)','--zone-card-text-sub':'var(--text3)','--zone-roots':'#C08060','--zone-stem':'#5898A0','--zone-leaves':'#489080','--zone-flowers':'#B068A0','--zone-breath':'#5888C0','--badge-lvl1':'#4A9E5C','--badge-lvl2':'#3A7FB0','--badge-lvl3':'#A07820' } },
  { name:'Zen',        emoji:'🍃', vars:{ '--bg':'#F5F2EC','--sidebar-bg':'rgba(0,0,0,0.06)','--topbar-bg':'rgba(0,0,0,0.04)','--nav-fs-logo':'18px','--nav-fs-section':'10px','--nav-fs-item':'13px','--nav-fs-icon':'15px','--nav-fs-badge':'9px','--nav-item-active-bg':'rgba(80,120,60,0.12)','--nav-item-active-color':'#3a6830','--nav-item-hover-bg':'rgba(0,0,0,0.05)','--nav-item-hover-color':'rgba(40,40,30,0.75)','--bg2':'#FDFBF8','--bg3':'#EDE9E1','--text':'#3C3028','--text2':'rgba(60,48,40,0.78)','--text3':'rgba(60,48,40,0.44)','--cream':'#3C3028','--green':'#6B8F71','--gold':'#A08060','--gold-warm':'#B8906A','--red':'#B05850','--border':'rgba(60,48,40,0.16)','--border2':'rgba(60,48,40,0.09)','--surface-1':'rgba(60,48,40,0.04)','--surface-2':'rgba(60,48,40,0.07)','--surface-3':'rgba(60,48,40,0.11)','--surface-hover':'rgba(60,48,40,0.06)','--overlay':'rgba(30,24,18,0.52)','--overlay-dark':'rgba(30,24,18,0.92)','--modal-bg':'linear-gradient(170deg,#FDFBF8 0%,#F5F2EC 100%)','--modal-surface':'linear-gradient(160deg,#E8E4DC 0%,#D8D4CC 100%)','--separator':'rgba(60,48,40,0.12)','--track':'rgba(60,48,40,0.08)','--shadow-sm':'0 1px 3px rgba(60,48,40,0.07)','--shadow':'0 4px 14px rgba(60,48,40,0.10)','--lumens':'#8878B8','--text-on-dark':'#F0ECE4','--zone-roots-bg':'#f8f0e8','--zone-stem-bg':'#eef5ee','--zone-leaves-bg':'#edf5ed','--zone-flowers-bg':'#f8eef4','--zone-breath-bg':'#eef2f8','--zone-card-bg':'var(--bg3)','--zone-card-text':'var(--text)','--zone-card-text-sub':'var(--text3)','--zone-roots':'#C07848','--zone-stem':'#5A9068','--zone-leaves':'#488860','--zone-flowers':'#B86880','--zone-breath':'#5898B8','--badge-lvl1':'#4A9E5C','--badge-lvl2':'#3A7FB0','--badge-lvl3':'#A07820' } },
]

const PRESETS = [...PRESETS_DARK, ...PRESETS_LIGHT]
const VAR_LABELS = {
  // ── Fonds structuraux ──
  '--bg':              { label: 'Fond page',                group: 'Fonds',          usage: 'Fond principal de toutes les pages' },
  '--sidebar-bg':      { label: 'Fond sidebar',             group: 'Fonds',          usage: 'Fond de la navigation gauche (PC)' },
  '--topbar-bg':       { label: 'Fond topbar',              group: 'Fonds',          usage: 'Fond de la barre de titre en haut' },
  '--nav-item-active-bg':    { label: 'Nav — fond actif',   group: 'Fonds',          usage: 'Fond du bouton de navigation actif' },
  '--nav-item-active-color': { label: 'Nav — texte actif',  group: 'Textes',         usage: 'Texte et bordure du bouton de navigation actif' },
  '--nav-item-hover-bg':     { label: 'Nav — fond survol',  group: 'Fonds',          usage: 'Fond du bouton de navigation au survol' },
  '--nav-item-hover-color':  { label: 'Nav — texte survol', group: 'Textes',         usage: 'Texte du bouton de navigation au survol' },
  '--nav-fs-logo':           { label: 'Nav — taille logo',     group: 'Navigation',  usage: 'Titre "Mon Jardin Intérieur" dans la sidebar' },
  '--nav-fs-section':        { label: 'Nav — label section',   group: 'Navigation',  usage: 'Label uppercase "NAVIGATION"' },
  '--nav-fs-item':           { label: 'Nav — taille item',     group: 'Navigation',  usage: 'Texte des boutons de navigation' },
  '--nav-fs-icon':           { label: 'Nav — taille icône',    group: 'Navigation',  usage: 'Emojis des boutons de navigation' },
  '--nav-fs-badge':          { label: 'Nav — taille badge',    group: 'Navigation',  usage: 'Compteurs de la navigation (10, 6…)' },
  '--bg2':             { label: 'Fond app-bar',             group: 'Fonds',          usage: 'Topbar, sidebar, navigation' },
  '--bg3':             { label: 'Fond tertiaire',           group: 'Fonds',          usage: 'En-têtes de tableau, zones séparées' },
  '--card':            { label: 'Fond carte',               group: 'Fonds',          usage: 'Cartes isolées et widgets' },
  // ── Surfaces superposées ──
  '--surface-1':       { label: 'Surface légère',           group: 'Surfaces',       usage: 'Cartes discrètes, listes de fond' },
  '--surface-2':       { label: 'Surface médium',           group: 'Surfaces',       usage: 'Cartes interactives, items sélectionnables' },
  '--surface-3':       { label: 'Surface forte',            group: 'Surfaces',       usage: 'Boutons ghost, inputs, tags' },
  '--surface-hover':   { label: 'Survol',                   group: 'Surfaces',       usage: 'Hover sur items de menu et listes' },
  '--separator':       { label: 'Séparateur',               group: 'Surfaces',       usage: 'Drag handles, lignes de séparation' },
  '--track':           { label: 'Piste progress',           group: 'Surfaces',       usage: 'Fond des barres de progression / vitalité' },
  // ── Overlays & modals ──
  '--overlay':         { label: 'Fond modal',               group: 'Overlays',       usage: 'Fond semi-transparent derrière modals et bottom sheets' },
  '--overlay-dark':    { label: 'Fond plein écran',         group: 'Overlays',       usage: 'Bilan du jour, écran de bienvenue (WelcomeScreen)' },
  '--modal-bg':        { label: 'Surface modal général',    group: 'Overlays',       usage: 'Fond du modal Lumens, préférences, aide' },
  '--modal-surface':   { label: 'Surface modal rituel',     group: 'Overlays',       usage: 'Fond du drawer de rituel et quiz de bilan' },
  // ── Textes ──
  '--text':            { label: 'Texte principal',          group: 'Textes',         usage: 'Corps de texte, titres de cartes' },
  '--text2':           { label: 'Texte secondaire',         group: 'Textes',         usage: 'Sous-titres, descriptions, métadonnées' },
  '--text3':           { label: 'Texte atténué',            group: 'Textes',         usage: 'Labels, dates, infos périphériques' },
  '--cream':           { label: 'Texte titre UI',           group: 'Textes',         usage: 'Titre "Mon Jardin Intérieur" dans la topbar' },
  '--text-on-dark':    { label: 'Texte sur fond sombre',    group: 'Textes',         usage: 'Tout texte dans les modals et rituels à fond sombre' },
  // ── Accents ──
  '--green':           { label: 'Accent principal',         group: 'Accents',        usage: 'Bouton primaire, tab actif, badge succès, Ma Fleur nav' },
  '--green2':          { label: 'Fond accent médium',       group: 'Accents',        usage: 'Fond de badge vert, fond de bouton secondaire' },
  '--green3':          { label: 'Fond accent léger',        group: 'Accents',        usage: 'Fond très léger sur cartes actives' },
  '--greenT':          { label: 'Bordure accent',           group: 'Accents',        usage: 'Bordure des éléments à accent vert' },
  '--gold':            { label: 'Accent doré',              group: 'Accents',        usage: 'Titre serif, prix, Lumens, Jardin Collectif nav' },
  '--gold-warm':       { label: 'Doré chaud',               group: 'Accents',        usage: 'Bilan du jour, CTA principal, card premium' },
  '--red':             { label: 'Danger / erreur',          group: 'Accents',        usage: 'Messages d\'erreur, suppression, signalement' },
  '--lumens':          { label: 'Lumens (violet)',          group: 'Accents',        usage: 'Icône Lumens, badge violet, Défis nav, lecteur audio' },
  // ── Bordures & ombres ──
  '--border':          { label: 'Bordure forte',            group: 'Bordures',       usage: 'Bordure des modals, cartes mises en avant' },
  '--border2':         { label: 'Bordure légère',           group: 'Bordures',       usage: 'Séparation entre éléments de liste, grilles' },
  '--shadow-sm':       { label: 'Ombre légère',             group: 'Bordures',       usage: 'Élévation légère sur cartes et boutons' },
  '--shadow':          { label: 'Ombre forte',              group: 'Bordures',       usage: 'Élévation forte : modals, drawers, toasts' },
  // ── Zones rituels ──
  '--zone-roots':      { label: 'Zone Racines',             group: 'Zones rituels',  usage: 'Cartes, badges et barres de la zone Racines' },
  '--zone-stem':       { label: 'Zone Tige',                group: 'Zones rituels',  usage: 'Cartes, badges et barres de la zone Tige' },
  '--zone-leaves':     { label: 'Zone Feuilles',            group: 'Zones rituels',  usage: 'Cartes, badges et barres de la zone Feuilles' },
  '--zone-flowers':    { label: 'Zone Fleurs',              group: 'Zones rituels',  usage: 'Cartes, badges et barres de la zone Fleurs' },
  '--zone-breath':     { label: 'Zone Souffle',             group: 'Zones rituels',  usage: 'Cartes, badges et barres de la zone Souffle' },
  '--zone-roots-bg':   { label: 'Modal Racines — fond',    group: 'Zones rituels',  usage: 'Fond du modal de rituel Racines (plein écran)' },
  '--zone-stem-bg':    { label: 'Modal Tige — fond',       group: 'Zones rituels',  usage: 'Fond du modal de rituel Tige (plein écran)' },
  '--zone-leaves-bg':  { label: 'Modal Feuilles — fond',   group: 'Zones rituels',  usage: 'Fond du modal de rituel Feuilles (plein écran)' },
  '--zone-flowers-bg': { label: 'Modal Fleurs — fond',     group: 'Zones rituels',  usage: 'Fond du modal de rituel Fleurs (plein écran)' },
  '--zone-breath-bg':  { label: 'Modal Souffle — fond',    group: 'Zones rituels',  usage: 'Fond du modal de rituel Souffle (plein écran)' },
  '--zone-card-bg':    { label: 'Cards zones — fond',      group: 'Zones rituels',  usage: 'Fond de toutes les cards de zone (Racines, Tige, Feuilles, Fleurs, Souffle)' },
  '--zone-card-text':  { label: 'Cards zones — titre',     group: 'Zones rituels',  usage: 'Couleur du titre (RACINES) et du pourcentage sur les cards' },
  '--zone-card-text-sub': { label: 'Cards zones — texte sec.', group: 'Zones rituels', usage: 'Sous-titre, compteur de rituels, flèche sur les cards' },
  // ── Tailles de titres ──
  '--fs-h1':           { label: 'H1 — Grand titre',         group: 'Tailles',        usage: '"Mon Jardin Intérieur", titres de section majeurs' },
  '--fs-h2':           { label: 'H2 — Titre section',       group: 'Tailles',        usage: '"Prenez soin de vous", titres d\'écran' },
  '--fs-h3':           { label: 'H3 — Sous-titre',          group: 'Tailles',        usage: 'Titres de rituels, noms de zones' },
  '--fs-h4':           { label: 'H4 — Titre carte',         group: 'Tailles',        usage: 'Noms d\'exercices, titres de cartes' },
  '--fs-h5':           { label: 'H5 — Label renforcé',      group: 'Tailles',        usage: 'Labels uppercase, navigation, badges texte' },
  // ── Badges niveaux ──
  '--badge-lvl1':      { label: 'Badge Basique',            group: 'Badges',         usage: 'Badge niveau 1 🌱 Basique (vert clair)' },
  '--badge-lvl2':      { label: 'Badge Cool',               group: 'Badges',         usage: 'Badge niveau 2 🌿 Cool (bleu clair)' },
  '--badge-lvl3':      { label: 'Badge Extra',              group: 'Badges',         usage: 'Badge niveau 3 🌟 Extra (or)' },
}

function ThemeEditor({ showToast }) {
  const [vars,     setVars]     = useState({})
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [changed,  setChanged]  = useState(false)
  const [preview,  setPreview]  = useState(null)

  // ── Presets custom (stockés en localStorage) ────────────────────────────
  const [customPresets,  setCustomPresets]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(CUSTOM_PRESETS_KEY) || '[]') } catch { return [] }
  })
  const [showSavePreset, setShowSavePreset] = useState(false)
  const [newPresetName,  setNewPresetName]  = useState('')
  const [newPresetEmoji, setNewPresetEmoji] = useState('✨')
  const [presetTab,      setPresetTab]      = useState('dark') // 'dark' | 'light' | 'custom'

  // Charge les valeurs actuelles
  useEffect(() => {
    supabase.from('app_settings').select('key,value')
      .then(({ data }) => {
        if (!data) return
        const map = Object.fromEntries(data.map(r => [r.key, r.value]))
        setVars(map)
        setLoading(false)
      })
  }, [])

  // hoverVars : vars temporaires lors du survol d'un preset (preview uniquement)
  const [hoverVars, setHoverVars] = useState(null)

  // ── Google Fonts — chargement dynamique ────────────────────────────────────
  const FONT_URLS = {
    "'Jost',sans-serif":                 'https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;500&display=swap',
    "'Inter',sans-serif":                'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap',
    "'Lato',sans-serif":                 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
    "'Nunito',sans-serif":               'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500&display=swap',
    "'DM Sans',sans-serif":              'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap',
    "'Cormorant Garamond',serif":        'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&display=swap',
    "'Playfair Display',serif":          'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap',
    "'Lora',serif":                      'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&display=swap',
    "'Libre Baskerville',serif":         'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap',
    "'EB Garamond',serif":               'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap',
  }

  const loadFont = (val) => {
    const url = FONT_URLS[val]
    if (!url || document.querySelector(`link[data-mji-font="${val}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    link.setAttribute('data-mji-font', val)
    document.head.appendChild(link)
  }

  // ── Application immédiate sur :root ────────────────────────────────────────
  // Gère aussi les polices (body / serif) en temps réel
  const applyToRoot = (updates) => {
    const root = document.documentElement
    Object.entries(updates).forEach(([k, v]) => {
      if (!k.startsWith('--')) return
      root.style.setProperty(k, v)
      if (k === '--font-body') {
        document.body.style.fontFamily = v
        let s = document.getElementById('mji-font-body-override')
        if (!s) { s = document.createElement('style'); s.id = 'mji-font-body-override'; document.head.appendChild(s) }
        s.textContent = `body, .adm-root, button, input, select, textarea { font-family: ${v} !important; }`
        loadFont(v)
      }
      if (k === '--font-serif') {
        let s = document.getElementById('mji-font-serif-override')
        if (!s) { s = document.createElement('style'); s.id = 'mji-font-serif-override'; document.head.appendChild(s) }
        s.textContent = `.adm-logo, .adm-stat-val, [style*="Cormorant"], [style*="serif"] { font-family: ${v} !important; }`
        loadFont(v)
      }
    })
    // Dériver les RGB automatiquement
    const rgbPairs = [
      ['--green','--green-rgb'],['--gold','--gold-rgb'],['--gold-warm','--gold-warm-rgb'],
      ['--red','--red-rgb'],['--lumens','--lumens-rgb'],['--text-on-dark','--text-on-dark-rgb'],
    ]
    rgbPairs.forEach(([hexVar, rgbVar]) => {
      const hex = updates[hexVar]
      if (hex?.startsWith('#') && hex.length === 7) {
        const rgb = [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)].join(',')
        root.style.setProperty(rgbVar, rgb)
      }
    })
  }

  const deriveFromGreen = (g) => {
    if (!g || !g.startsWith('#') || g.length !== 7) return {}
    const rgb = parseInt(g.slice(1,3),16)+','+parseInt(g.slice(3,5),16)+','+parseInt(g.slice(5,7),16)
    return { '--green2':`rgba(${rgb},0.22)`, '--green3':`rgba(${rgb},0.11)`, '--greenT':`rgba(${rgb},0.48)` }
  }

  const updateVar = (key, val) => {
    const updates = { [key]: val }
    if (key === '--green') Object.assign(updates, deriveFromGreen(val))
    setVars(v => ({ ...v, ...updates }))
    setChanged(true)
    // Polices : charger le fichier Google Fonts silencieusement pour que la preview fonctionne
    if (key === '--font-body' || key === '--font-serif') loadFont(val)
    // ⚠ PAS d'applyToRoot ici — les changements restent dans la preview uniquement
  }

  const applyPreset = (preset) => {
    const derived = deriveFromGreen(preset.vars['--green'])
    const full = { ...preset.vars, ...derived, theme_name: preset.name }
    setVars(v => ({ ...v, ...full }))
    setHoverVars(null)
    setChanged(true)
    // Charger les polices du preset pour la preview
    if (preset.vars['--font-body'])  loadFont(preset.vars['--font-body'])
    if (preset.vars['--font-serif']) loadFont(preset.vars['--font-serif'])
    // ⚠ PAS d'applyToRoot ici — visible dans la preview uniquement
  }

  // Survol preset : mise à jour du preview scopé uniquement
  const previewPreset = (preset) => {
    if (!preset) { setHoverVars(null); setPreview(null); return }
    setPreview(preset.name)
    const derived = deriveFromGreen(preset.vars['--green'])
    setHoverVars({ ...preset.vars, ...derived })
  }

  const save = async () => {
    setSaving(true)
    const derived = deriveFromGreen(vars['--green'])
    const allVars = { ...vars, ...derived }
    // Appliquer immédiatement (polices, couleurs)
    applyToRoot(allVars)

    // ── 2. Persister en base ─────────────────────────────────────────────────
    // On upserte chaque clé individuellement pour éviter les erreurs de batch
    // (colonnes manquantes, RLS, etc.)
    let dbError = null
    try {
      const cssEntries = Object.entries(allVars)
        .filter(([k]) => k !== null && k !== undefined)
        .map(([key, value]) => ({ key, value }))

      const { error } = await supabase
        .from('app_settings')
        .upsert(cssEntries, { onConflict: 'key' })

      if (error) {
        // Fallback : tenter update + insert séparément
        dbError = error
        let fallbackOk = true
        for (const [key, value] of Object.entries(allVars)) {
          const { error: e1 } = await supabase
            .from('app_settings')
            .update({ value })
            .eq('key', key)
          if (e1) {
            const { error: e2 } = await supabase
              .from('app_settings')
              .insert({ key, value })
            if (e2) { fallbackOk = false; break }
          }
        }
        dbError = fallbackOk ? null : dbError
      }
    } catch (e) {
      dbError = e
      console.error('[ThemeEditor] save error:', e)
    }

    setSaving(false)
    setVars(v => ({ ...v, ...derived }))
    setChanged(false)

    if (dbError) {
      showToast('⚠ Thème appliqué localement — erreur DB : ' + (dbError.message || dbError))
    } else {
      // ── 3. Mettre à jour le cache localStorage de useTheme ───────────────
      // Sans ça, au prochain chargement useTheme réappliquerait l'ancien thème
      try {
        const cssVars = Object.fromEntries(
          Object.entries(allVars).filter(([k]) => k.startsWith('--'))
        )
        localStorage.setItem('mji_theme_vars', JSON.stringify({ vars: cssVars, ts: Date.now() }))
      } catch {}
      showToast('✓ Thème sauvegardé et appliqué')
    }
  }

  const lbl = { fontSize:10, color:'rgba(242,237,224,0.50)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:6, display:'block', fontWeight:500 }
  const groups = ['Fonds','Surfaces','Overlays','Textes','Accents','Bordures','Zones rituels','Tailles','Badges','Navigation']

  if (loading) return <div style={{ fontSize:12, color:'var(--text3)', fontStyle:'italic', padding:'20px 0' }}>Chargement du thème…</div>

  return (
    <div style={{ marginTop:32, paddingTop:24, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:32, alignItems:'start' }}>

        {/* ══ Colonne gauche : éditeur ══ */}
        <div>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'.12em', textTransform:'uppercase' }}>Thème & Couleurs</div>
              <div style={{ fontSize:12, color:'rgba(242,237,224,0.40)', marginTop:3 }}>
                Thème actuel : <span style={{ color:'var(--green)' }}>{vars.theme_name || 'Personnalisé'}</span>
              </div>
            </div>
            {changed && (
              <button onClick={save} disabled={saving}
                style={{ padding:'8px 18px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:"'Jost',sans-serif", fontWeight:500, background:'rgba(150,212,133,0.15)', border:'1px solid rgba(150,212,133,0.35)', color:'#96d485', opacity: saving ? 0.6 : 1 }}>
                {saving ? '⏳ Sauvegarde…' : '✓ Sauvegarder'}
              </button>
            )}
          </div>

          {/* ── Presets avec onglets ── */}
          <div style={{ marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <span style={lbl}>Thèmes prédéfinis</span>
              <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1px solid var(--border2)' }}>
                {[['dark','🌙 Sombres'],['light','☀️ Clairs'],['custom','⭐ Mes thèmes']].map(([id, label]) => (
                  <button key={id} onClick={() => setPresetTab(id)}
                    style={{ padding:'4px 12px', fontSize:10, cursor:'pointer', fontFamily:"'Jost',sans-serif",
                      border:'none', borderRight: id !== 'custom' ? '1px solid var(--border2)' : 'none',
                      background: presetTab === id ? 'var(--green)' : 'var(--bg3,rgba(255,255,255,0.04))',
                      color: presetTab === id ? '#fff' : 'var(--text3)',
                      fontWeight: presetTab === id ? 500 : 400, transition:'all .15s' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grille de presets */}
            {(() => {
              const list = presetTab === 'dark' ? PRESETS_DARK : presetTab === 'light' ? PRESETS_LIGHT : customPresets
              if (presetTab === 'custom' && list.length === 0) return (
                <div style={{ fontSize:11, color:'var(--text3)', fontStyle:'italic', padding:'12px 0' }}>
                  Aucun thème custom — modifiez le thème et cliquez « Enregistrer comme thème »
                </div>
              )
              return (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {list.map(p => {
                    const isActive = vars.theme_name === p.name
                    const isPreviewing = preview === p.name
                    return (
                      <div key={p.name} style={{ position:'relative' }}>
                        <div onClick={() => applyPreset(p)}
                          onMouseEnter={() => previewPreset(p)}
                          onMouseLeave={() => previewPreset(null)}
                          style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px',
                            borderRadius:10, cursor:'pointer', transition:'all .18s',
                            background: isActive ? 'var(--green3,rgba(150,212,133,0.11))' : isPreviewing ? 'var(--surface-2,rgba(255,255,255,0.05))' : 'var(--surface-1,rgba(255,255,255,0.03))',
                            border: `1px solid ${isActive ? 'var(--greenT,rgba(150,212,133,0.45))' : isPreviewing ? 'var(--border)' : 'var(--border2)'}`,
                          }}>
                          <div style={{ display:'flex', gap:3 }}>
                            {['--bg','--green','--gold','--zone-flowers'].map(k => (
                              <div key={k} style={{ width:10, height:10, borderRadius:'50%', background: p.vars[k] || '#888', border:'1px solid rgba(128,128,128,0.2)' }} />
                            ))}
                          </div>
                          <span style={{ fontSize:11, color: isActive ? 'var(--green)' : 'var(--text2)', whiteSpace:'nowrap' }}>
                            {p.emoji} {p.name}
                          </span>
                        </div>
                        {presetTab === 'custom' && (
                          <button onClick={() => {
                              const updated = customPresets.filter(x => x.name !== p.name)
                              setCustomPresets(updated)
                              try { localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(updated)) } catch {}
                            }}
                            style={{ position:'absolute', top:-5, right:-5, width:16, height:16, borderRadius:'50%',
                              background:'var(--red2,rgba(190,55,55,0.12))', border:'1px solid var(--redT,rgba(190,55,55,0.3))',
                              color:'var(--red)', fontSize:9, cursor:'pointer', display:'flex', alignItems:'center',
                              justifyContent:'center', lineHeight:1, padding:0 }}>✕</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {/* Enregistrer comme thème custom */}
            <div style={{ marginTop:12 }}>
              {!showSavePreset ? (
                <button onClick={() => setShowSavePreset(true)}
                  style={{ fontSize:11, padding:'5px 12px', borderRadius:7, cursor:'pointer',
                    fontFamily:"'Jost',sans-serif", border:'1px solid var(--border2)',
                    background:'var(--surface-1,rgba(255,255,255,0.03))', color:'var(--text3)' }}>
                  + Enregistrer le thème actuel
                </button>
              ) : (
                <div style={{ display:'flex', gap:8, alignItems:'center', padding:'10px 12px', borderRadius:10,
                  background:'var(--surface-1,rgba(255,255,255,0.03))', border:'1px solid var(--border2)' }}>
                  <input value={newPresetEmoji} onChange={e => setNewPresetEmoji(e.target.value)}
                    maxLength={4} placeholder="✨"
                    style={{ width:38, padding:'5px 6px', borderRadius:6, border:'1px solid var(--border2)',
                      background:'var(--bg)', color:'var(--text)', fontSize:16, textAlign:'center', outline:'none' }} />
                  <input value={newPresetName} onChange={e => setNewPresetName(e.target.value)}
                    placeholder="Nom du thème…"
                    onKeyDown={e => {
                      if (e.key !== 'Enter' || !newPresetName.trim()) return
                      const p = { name: newPresetName.trim(), emoji: newPresetEmoji || '✨', custom: true,
                        vars: Object.fromEntries(Object.entries(vars).filter(([k]) => k.startsWith('--'))) }
                      const updated = [...customPresets, p]
                      setCustomPresets(updated)
                      try { localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(updated)) } catch {}
                      setShowSavePreset(false); setNewPresetName(''); setPresetTab('custom')
                      showToast(`✓ Thème "${p.emoji} ${p.name}" sauvegardé`)
                    }}
                    style={{ flex:1, padding:'6px 10px', borderRadius:6, border:'1px solid var(--border2)',
                      background:'var(--bg)', color:'var(--text)', fontSize:12,
                      fontFamily:"'Jost',sans-serif", outline:'none' }} />
                  <button onClick={() => {
                      if (!newPresetName.trim()) return
                      const p = { name: newPresetName.trim(), emoji: newPresetEmoji || '✨', custom: true,
                        vars: Object.fromEntries(Object.entries(vars).filter(([k]) => k.startsWith('--'))) }
                      const updated = [...customPresets, p]
                      setCustomPresets(updated)
                      try { localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(updated)) } catch {}
                      setShowSavePreset(false); setNewPresetName(''); setPresetTab('custom')
                      showToast(`✓ Thème "${p.emoji} ${p.name}" sauvegardé`)
                    }}
                    disabled={!newPresetName.trim()}
                    style={{ padding:'6px 14px', borderRadius:7, fontSize:11, cursor:'pointer',
                      fontFamily:"'Jost',sans-serif", background:'var(--green3,rgba(150,212,133,0.11))',
                      border:'1px solid var(--greenT,rgba(150,212,133,0.35))', color:'var(--green)',
                      opacity: newPresetName.trim() ? 1 : 0.4 }}>✓ Sauver</button>
                  <button onClick={() => setShowSavePreset(false)}
                    style={{ padding:'6px 10px', borderRadius:7, fontSize:11, cursor:'pointer',
                      fontFamily:"'Jost',sans-serif", background:'transparent',
                      border:'1px solid var(--border2)', color:'var(--text3)' }}>Annuler</button>
                </div>
              )}
            </div>
          </div>

          {/* ── Typographie ── */}
          <div style={{ marginBottom:20 }}>
            <span style={lbl}>Typographie</span>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>

              {/* Police corps */}
              <div style={{ borderRadius:9, background:'var(--surface-1,rgba(255,255,255,0.03))', border:'1px solid var(--border2)', padding:'12px 14px' }}>
                <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>Police corps</div>
                <select
                  value={vars['--font-body'] || "'Jost',sans-serif"}
                  onChange={e => updateVar('--font-body', e.target.value)}
                  style={{ width:'100%', padding:'6px 8px', borderRadius:6, border:'1px solid var(--border2)', background:'var(--bg)', color:'var(--text)', fontSize:12, outline:'none', cursor:'pointer', fontFamily: vars['--font-body'] || "'Jost',sans-serif" }}
                >
                  <option value="'Jost',sans-serif">Jost</option>
                  <option value="'Inter',sans-serif">Inter</option>
                  <option value="'Lato',sans-serif">Lato</option>
                  <option value="'Nunito',sans-serif">Nunito</option>
                  <option value="'DM Sans',sans-serif">DM Sans</option>
                </select>
                <div style={{ marginTop:10, padding:'8px 10px', background:'var(--bg)', border:'1px solid var(--border2)', borderRadius:7 }}>
                  <div style={{ fontSize:13, color:'var(--text)', fontFamily: vars['--font-body'] || "'Jost',sans-serif", lineHeight:1.6 }}>
                    Corps du texte — labels navigation
                  </div>
                  <div style={{ fontSize:10, color:'var(--text3)', fontFamily: vars['--font-body'] || "'Jost',sans-serif", marginTop:3, letterSpacing:'.08em', textTransform:'uppercase' }}>
                    UPPERCASE LABEL · 10PX
                  </div>
                </div>
              </div>

              {/* Police titres */}
              <div style={{ borderRadius:9, background:'var(--surface-1,rgba(255,255,255,0.03))', border:'1px solid var(--border2)', padding:'12px 14px' }}>
                <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>Police titres (serif)</div>
                <select
                  value={vars['--font-serif'] || "'Cormorant Garamond',serif"}
                  onChange={e => updateVar('--font-serif', e.target.value)}
                  style={{ width:'100%', padding:'6px 8px', borderRadius:6, border:'1px solid var(--border2)', background:'var(--bg)', color:'var(--text)', fontSize:12, outline:'none', cursor:'pointer', fontFamily: vars['--font-serif'] || "'Cormorant Garamond',serif" }}
                >
                  <option value="'Cormorant Garamond',serif">Cormorant Garamond</option>
                  <option value="'Playfair Display',serif">Playfair Display</option>
                  <option value="'Lora',serif">Lora</option>
                  <option value="'Libre Baskerville',serif">Libre Baskerville</option>
                  <option value="'EB Garamond',serif">EB Garamond</option>
                </select>
                <div style={{ marginTop:10, padding:'8px 10px', background:'var(--bg)', border:'1px solid var(--border2)', borderRadius:7 }}>
                  <div style={{ fontSize:22, color:'var(--gold)', fontFamily: vars['--font-serif'] || "'Cormorant Garamond',serif", fontWeight:300, lineHeight:1.2, fontStyle:'italic' }}>
                    Mon <em>Jardin</em> Intérieur
                  </div>
                  <div style={{ fontSize:14, color:'var(--text2)', fontFamily: vars['--font-serif'] || "'Cormorant Garamond',serif", fontWeight:300, marginTop:4 }}>
                    Prenez soin de vous
                  </div>
                </div>
              </div>

            </div>

            {/* ── Tailles de titres H1 → H5 ── */}
            <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:6 }}>
              {[
                { key:'--fs-h1', label:'H1', def:'32', min:22, max:56, weight:300, serif:true,  sample:'Mon Jardin Intérieur' },
                { key:'--fs-h2', label:'H2', def:'24', min:18, max:40, weight:300, serif:true,  sample:'Prenez soin de vous' },
                { key:'--fs-h3', label:'H3', def:'18', min:14, max:28, weight:300, serif:true,  sample:'Rituel du matin' },
                { key:'--fs-h4', label:'H4', def:'14', min:11, max:20, weight:500, serif:false, sample:'Gratitude florale' },
                { key:'--fs-h5', label:'H5', def:'11', min:9,  max:14, weight:500, serif:false, sample:'LABELS · NAVIGATION' },
              ].map(({ key, label, def, min, max, weight, serif, sample }) => {
                const num = parseInt(vars[key] || def) || parseInt(def)
                const ff = serif
                  ? (vars['--font-serif'] || "'Cormorant Garamond',serif")
                  : (vars['--font-body']  || "'Jost',sans-serif")
                const col = serif ? 'var(--gold)' : 'var(--text)'
                return (
                  <div key={key} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 12px',
                    borderRadius:9, background:'var(--surface-1,rgba(255,255,255,0.03))', border:'1px solid var(--border2)' }}>
                    {/* Tag */}
                    <span style={{ fontSize:9, fontWeight:600, color:'var(--text3)', letterSpacing:'.08em',
                      width:20, flexShrink:0, textTransform:'uppercase' }}>{label}</span>
                    {/* Slider */}
                    <input type="range" min={min} max={max} value={num} step={1}
                      onChange={e => updateVar(key, e.target.value + 'px')}
                      style={{ flex:'0 0 120px', accentColor:'var(--green,#96d485)', cursor:'pointer' }} />
                    {/* Valeur px */}
                    <span style={{ fontSize:10, color:'var(--text3)', width:28, textAlign:'right', flexShrink:0 }}>{num}px</span>
                    {/* Aperçu live */}
                    <div style={{ flex:1, fontSize:num, fontFamily:ff, fontWeight:weight,
                      color:col, lineHeight:1.2, overflow:'hidden', whiteSpace:'nowrap',
                      textOverflow:'ellipsis', letterSpacing: serif ? '0.01em' : label==='H5' ? '.1em' : '0' }}>
                      {sample}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Tailles navigation ── */}
            <div style={{ marginTop:6, display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'.12em', textTransform:'uppercase',
                padding:'6px 0 4px', borderBottom:'1px solid var(--border2)', marginBottom:2 }}>
                Navigation
              </div>
              {[
                { key:'--nav-fs-logo',    label:'Logo',    def:'18', min:13, max:26, sample:'Mon Jardin Intérieur', serif:true  },
                { key:'--nav-fs-item',    label:'Item',    def:'13', min:9,  max:18, sample:'Ma Fleur · Défis',     serif:false },
                { key:'--nav-fs-icon',    label:'Icône',   def:'15', min:10, max:24, sample:'🌸 🌻 🌿 ✨',          serif:false },
                { key:'--nav-fs-section', label:'Section', def:'10', min:7,  max:13, sample:'NAVIGATION',           serif:false },
                { key:'--nav-fs-badge',   label:'Badge',   def:'9',  min:6,  max:12, sample:'10 · 6 · 25',          serif:false },
              ].map(({ key, label, def, min, max, sample, serif }) => {
                const num = parseInt(vars[key] || def) || parseInt(def)
                const ff = serif
                  ? (vars['--font-serif'] || "'Cormorant Garamond',serif")
                  : (vars['--font-body']  || "'Jost',sans-serif")
                return (
                  <div key={key} style={{ display:'flex', alignItems:'center', gap:12, padding:'7px 12px',
                    borderRadius:9, background:'var(--surface-1,rgba(255,255,255,0.03))', border:'1px solid var(--border2)' }}>
                    <span style={{ fontSize:9, fontWeight:600, color:'var(--text3)', letterSpacing:'.06em',
                      width:44, flexShrink:0, textTransform:'uppercase' }}>{label}</span>
                    <input type="range" min={min} max={max} value={num} step={1}
                      onChange={e => updateVar(key, e.target.value + 'px')}
                      style={{ flex:'0 0 120px', accentColor:'var(--green,#96d485)', cursor:'pointer' }} />
                    <span style={{ fontSize:10, color:'var(--text3)', width:28, textAlign:'right', flexShrink:0 }}>{num}px</span>
                    <div style={{ flex:1, fontSize:num, fontFamily:ff,
                      color: serif ? 'var(--gold)' : 'var(--text2)', lineHeight:1.3,
                      overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis',
                      letterSpacing: label === 'Section' ? '.15em' : '0' }}>
                      {sample}
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:6 }}>
            {groups.map(group => {
              const groupVars = Object.entries(VAR_LABELS).filter(([, v]) => v.group === group)
              return (
                <div key={group} style={{ borderRadius:9, background:'var(--surface-1,rgba(255,255,255,0.03))', border:'1px solid var(--border2)', overflow:'hidden' }}>
                  {/* En-tête groupe */}
                  <div style={{ padding:'5px 10px', borderBottom:'1px solid var(--border2)', background:'var(--surface-2,rgba(255,255,255,0.04))' }}>
                    <span style={{ fontSize:8, color:'var(--text3)', letterSpacing:'.12em', textTransform:'uppercase', fontWeight:500 }}>{group}</span>
                  </div>
                  {/* Lignes */}
                  <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                    {groupVars.map(([key, meta], i) => {
                      const val = vars[key] || ''
                      const isHex = val.startsWith('#')
                      return (
                        <div key={key} title={meta.usage}
                          style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px',
                            borderBottom: i < groupVars.length-1 ? '1px solid var(--border2)' : 'none',
                            cursor:'default' }}>
                          {/* Swatch cliquable */}
                          <div style={{ width:18, height:18, borderRadius:4, background: val,
                            border:'1px solid var(--border)', flexShrink:0, position:'relative',
                            overflow:'hidden', cursor: isHex ? 'pointer' : 'default' }}>
                            {isHex && (
                              <input type="color" value={val} onChange={e => updateVar(key, e.target.value)}
                                style={{ position:'absolute', inset:0, width:'150%', height:'150%', opacity:0, cursor:'pointer', transform:'translate(-10%,-10%)' }} />
                            )}
                          </div>
                          {/* Label + var name + usage */}
                          <div style={{ flex:1, minWidth:0, overflow:'hidden' }}>
                            <div style={{ fontSize:10, color:'var(--text2)', fontWeight:500,
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {meta.label}
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:1 }}>
                              <span style={{ fontSize:8, color:'var(--green,#96d485)', fontFamily:'monospace',
                                background:'var(--surface-2,rgba(255,255,255,0.04))',
                                padding:'1px 4px', borderRadius:3, flexShrink:0, letterSpacing:0 }}>
                                {key}
                              </span>
                              {meta.usage && (
                                <span style={{ fontSize:8, color:'var(--text3)', overflow:'hidden',
                                  textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                                  {meta.usage}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Input valeur */}
                          <input value={val} onChange={e => updateVar(key, e.target.value)}
                            style={{ width:72, padding:'3px 6px', borderRadius:4, border:'1px solid var(--border2)',
                              background:'var(--bg)', color:'var(--text3)', fontSize:9,
                              fontFamily:'monospace', outline:'none', flexShrink:0 }} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {changed && (
            <div style={{ marginTop:16, display:'flex', justifyContent:'flex-end' }}>
              <button onClick={save} disabled={saving}
                style={{ padding:'10px 24px', borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:"'Jost',sans-serif", fontWeight:500, background:'rgba(150,212,133,0.15)', border:'1px solid rgba(150,212,133,0.35)', color:'#96d485', opacity: saving ? 0.6 : 1 }}>
                {saving ? '⏳ Sauvegarde…' : '✓ Sauvegarder le thème'}
              </button>
            </div>
          )}
        </div>

        {/* ══ Colonne droite : preview navigable ══ */}
        <ThemePreview vars={hoverVars || vars} />

      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  ThemePreview — mini-app navigable, fidèle aux vraies pages
// ═══════════════════════════════════════════════════════════

const PREVIEW_NAV = [
  { id:'jardin',        icon:'🌸', label:'Ma Fleur',           accent:'#96d485', accentBg:'rgba(150,212,133,0.10)' },
  { id:'champ',         icon:'🌻', label:'Jardin Collectif',   accent:'#e8c060', accentBg:'rgba(255,200,80,0.09)'  },
  { id:'club',          icon:'👥', label:'Club Jardiniers',    accent:'#82c8a0', accentBg:'rgba(130,200,160,0.10)' },
  { id:'ateliers',      icon:'📖', label:'Ateliers',           accent:'#78c4a0', accentBg:'rgba(100,180,140,0.09)' },
  { id:'defis',         icon:'✨', label:'Défis',              accent:'#b4a0f0', accentBg:'rgba(180,140,255,0.09)' },
  { id:'jardinotheque', icon:'🌿', label:'Jardinothèque',      accent:'#82c8a0', accentBg:'rgba(130,200,160,0.09)' },
]

const ZONE_VARS = [
  { key:'--zone-roots',   label:'Racines',  icon:'🌱' },
  { key:'--zone-stem',    label:'Tige',     icon:'🌿' },
  { key:'--zone-leaves',  label:'Feuilles', icon:'🍃' },
  { key:'--zone-flowers', label:'Fleurs',   icon:'🌸' },
  { key:'--zone-breath',  label:'Souffle',  icon:'🌬️' },
]

function cv(key) {
  return getComputedStyle(document.documentElement).getPropertyValue(key).trim() || 'transparent'
}

/* ── Mini fleur SVG ── */
function MiniFleur({ size = 80, pcts = [82,68,74,55,78] }) {
  const cx = size/2, cy = size/2
  const angles = [90,18,306,234,162]
  const zoneKeys = ['--zone-breath','--zone-leaves','--zone-flowers','--zone-roots','--zone-stem']
  function petal(angleDeg, pct, i) {
    const minR = size*0.17, maxR = size*0.40
    const r = minR + (pct/100)*(maxR-minR)
    const rad = ((angleDeg-90)*Math.PI)/180
    const tx = cx+r*Math.cos(rad), ty = cy+r*Math.sin(rad)
    const w = size*0.09 + (pct/100)*size*0.07
    const lr = rad-Math.PI/2
    const c1x=cx+r*.42*Math.cos(rad)+w*Math.cos(lr), c1y=cy+r*.42*Math.sin(rad)+w*Math.sin(lr)
    const c2x=cx+r*.42*Math.cos(rad)-w*Math.cos(lr), c2y=cy+r*.42*Math.sin(rad)-w*Math.sin(lr)
    const color = cv(zoneKeys[i])
    return <path key={i} d={`M${cx} ${cy} Q${c1x} ${c1y} ${tx} ${ty} Q${c2x} ${c2y} ${cx} ${cy} Z`}
      fill={color} fillOpacity={0.72} stroke={color} strokeOpacity={0.3} strokeWidth={0.5} />
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {angles.map((a,i) => petal(a, pcts[i], i))}
      <circle cx={cx} cy={cy} r={size*0.065} fill={cv('--gold')} fillOpacity={0.9}/>
    </svg>
  )
}

/* ── Écran : Ma Fleur ── */
function PvJardin() {
  const s = { fontFamily:"'Jost',sans-serif", fontSize:10, color:'var(--text)' }
  return (
    <div style={s}>
      {/* Message contextuel */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px 6px', borderBottom:'1px solid var(--border2)' }}>
        <span style={{ fontSize:16 }}>🌅</span>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, fontWeight:300, fontStyle:'italic', color:'var(--text2)', lineHeight:1.2 }}>
          Un beau matin commence dans votre jardin.
        </span>
      </div>

      {/* Layout fleur + bilan */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border2)' }}>
        {/* Colonne fleur */}
        <div style={{ flex:'0 0 48%', background:'var(--bg)', position:'relative', minHeight:130, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderRight:'1px solid var(--border2)' }}>
          {/* Vitalité overlay */}
          <div style={{ position:'absolute', top:8, left:10 }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:1 }}>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:300, color:'#e8f5e0', lineHeight:1 }}>72</span>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, color:'var(--text3)' }}>%</span>
            </div>
            <div style={{ fontSize:6, letterSpacing:'.25em', textTransform:'uppercase', color:'rgba(150,212,133,0.55)', marginTop:1 }}>Vitalité</div>
          </div>
          <MiniFleur size={88} />
          {/* Niveaux badges */}
          <div style={{ position:'absolute', bottom:5, left:8, display:'flex', gap:3 }}>
            {[['🌱','Basique','#96d48a','rgba(80,160,60,0.14)'],['🌿','Cool','#82c8f0','rgba(60,140,200,0.14)'],['🌟','Extra','#e8c060','rgba(200,160,40,0.14)']].map(([b,l,c,bg],i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:2, padding:'1px 4px', borderRadius:10, background:bg, border:`1px solid ${c}40`, fontSize:6 }}>
                <span>{b}</span><span style={{ color:c }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Colonne droite */}
        <div style={{ flex:1, background:'var(--bg2)', padding:'10px 10px 8px', display:'flex', flexDirection:'column', gap:7 }}>
          {/* Bilan */}
          <div style={{ padding:'8px 10px', borderRadius:10, border:'1px solid rgba(200,168,130,0.25)', background:'rgba(200,168,130,0.07)', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>🌹</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, color:'#C8A882', fontWeight:500 }}>Faire mon bilan du jour</div>
              <div style={{ fontSize:8, color:'rgba(180,200,180,0.4)', fontStyle:'italic' }}>Prendre soin de soi</div>
            </div>
            <div style={{ padding:'2px 6px', borderRadius:20, background:'rgba(232,192,96,0.12)', border:'1px solid rgba(232,192,96,0.30)', fontSize:9, color:'#e8c060', fontWeight:600 }}>+3 ✦</div>
          </div>
          {/* Action rapide */}
          <div style={{ padding:'6px 10px', borderRadius:9, border:'1px solid rgba(232,192,96,0.25)', background:'linear-gradient(135deg,rgba(232,192,96,0.12),rgba(232,192,96,0.05))', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:11 }}>⚡</span>
            <span style={{ fontSize:10, fontWeight:500, color:'#e8c060' }}>Démarrer ma matinée</span>
          </div>
          {/* Message logo */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'6px 4px', textAlign:'center' }}>
            <div style={{ fontSize:26, marginBottom:4, opacity:.4 }}>🌿</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, fontWeight:700, fontStyle:'italic', lineHeight:1.3 }}>
              <span style={{ color:'#96d485' }}>Élise,</span>
              <span style={{ color:'var(--text)' }}> votre jardin vous attend.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rituels section */}
      <div style={{ padding:'8px 12px' }}>
        <div style={{ fontSize:8, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:6 }}>Rituels du jour</div>
        {[
          { icon:'🌬️', label:'Respiration 4-7-8', zone:'Souffle', dur:'5 min', done:true, col:'--zone-breath' },
          { icon:'🌱', label:'Ancrage matinal', zone:'Racines', dur:'8 min', done:false, col:'--zone-roots' },
          { icon:'🌸', label:'Gratitude florale', zone:'Fleurs', dur:'3 min', done:false, col:'--zone-flowers' },
        ].map((r,i) => {
          const c = cv(r.col)
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', borderRadius:8, marginBottom:3,
              background: r.done ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
              border:`1px solid ${r.done ? 'rgba(255,255,255,0.04)' : 'var(--border2)'}`,
              opacity: r.done ? 0.5 : 1 }}>
              <div style={{ width:16, height:16, borderRadius:4, background:`${c}20`, border:`1px solid ${c}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, flexShrink:0 }}>
                {r.done ? '✓' : r.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:9, color:'var(--text)', lineHeight:1 }}>{r.label}</div>
                <div style={{ fontSize:7, color:'var(--text3)', marginTop:1 }}>{r.zone} · {r.dur}</div>
              </div>
              <div style={{ fontSize:8, padding:'1px 6px', borderRadius:10, background:`${c}15`, color:c }}>{r.zone}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Écran : Jardin Collectif ── */
function PvChamp() {
  const zkeys = ['--zone-roots','--zone-stem','--zone-leaves','--zone-flowers','--zone-breath']
  return (
    <div style={{ fontFamily:"'Jost',sans-serif", position:'relative', minHeight:280, background:'var(--bg)', overflow:'hidden' }}>
      {/* Grille de mini-fleurs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, padding:'10px' }}>
        {Array.from({length:35}).map((_,i) => {
          const k = zkeys[i%5]
          const c = cv(k)
          const pct = 35 + ((i*13+7)%50)
          const size = 28
          const cx=14,cy=14
          const angles=[90,162,234,306,18]
          return (
            <svg key={i} width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity: 0.5+((i*7)%5)*0.1 }}>
              {angles.map((a,j) => {
                const r2=4+pct*0.08, rad=((a-90)*Math.PI)/180
                const tx=cx+r2*Math.cos(rad), ty=cy+r2*Math.sin(rad)
                const w=3.5, lr=rad-Math.PI/2
                const c1x=cx+r2*.42*Math.cos(rad)+w*Math.cos(lr), c1y=cy+r2*.42*Math.sin(rad)+w*Math.sin(lr)
                const c2x=cx+r2*.42*Math.cos(rad)-w*Math.cos(lr), c2y=cy+r2*.42*Math.sin(rad)-w*Math.sin(lr)
                return <path key={j} d={`M${cx} ${cy} Q${c1x} ${c1y} ${tx} ${ty} Q${c2x} ${c2y} ${cx} ${cy} Z`} fill={c} fillOpacity={0.7}/>
              })}
              <circle cx={cx} cy={cy} r={2} fill={cv('--gold')} fillOpacity={0.85}/>
            </svg>
          )
        })}
      </div>

      {/* Radial overlay premium */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none',
        background:'radial-gradient(circle at center, transparent 20%, rgba(14,26,14,0.3) 45%, rgba(14,26,14,0.85) 70%)'
      }}/>

      {/* Badge premium */}
      <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', zIndex:10 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20,
          background:'rgba(180,160,240,0.12)', border:'1px solid rgba(180,160,240,0.30)', whiteSpace:'nowrap' }}>
          <span style={{ fontSize:10 }}>🔒</span>
          <span style={{ fontSize:9, color:'var(--green)', fontWeight:500 }}>Voir tout le jardin — Premium</span>
          <span style={{ fontSize:8, color:'rgba(180,160,240,0.60)' }}>→</span>
        </div>
      </div>
    </div>
  )
}

/* ── Écran : Club des Jardiniers ── */
function PvClub() {
  const btns = [
    { emoji:'✦', label:"L'Égrégore", sub:'Fleur collective', glow:true },
    { emoji:'🌿', label:'Le Jardin', sub:'20 fleurs à soutenir', glow:false },
    { emoji:'🌻', label:'Mes ami(e)s', sub:'3 jardiniers', glow:false },
  ]
  const msgs = [
    { who:'Mia', msg:'Belle journée ! 🌸', zone:'Fleurs', col:'--zone-flowers', t:'2 h' },
    { who:'Léa', msg:'Rituel fait ce matin ✨', zone:'Souffle', col:'--zone-breath', t:'4 h' },
  ]
  return (
    <div style={{ fontFamily:"'Jost',sans-serif", padding:'14px 14px 10px' }}>
      {/* Titre */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:300, color:'var(--gold)', lineHeight:1 }}>
          Club des<br/><em style={{ color:'rgba(150,212,133,.85)' }}>Jardiniers</em>
        </div>
        <div style={{ fontSize:8, color:'var(--text3)', marginTop:4 }}>vendredi 20 mars 2026</div>
      </div>

      {/* 3 boutons */}
      <div style={{ display:'flex', gap:7, marginBottom:12 }}>
        {btns.map(b => (
          <div key={b.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5,
            padding:'12px 6px', borderRadius:13, cursor:'pointer',
            background: b.glow ? 'linear-gradient(135deg,rgba(232,196,100,.16),rgba(150,212,133,.1))' : 'rgba(255,255,255,.025)',
            border:`1px solid ${b.glow ? 'rgba(232,196,100,.42)' : 'rgba(255,255,255,.07)'}`,
            boxShadow: b.glow ? '0 0 16px rgba(232,196,100,.18)' : 'none' }}>
            <div style={{ fontSize:22, lineHeight:1, filter: b.glow ? 'drop-shadow(0 0 8px rgba(232,196,100,.6))' : 'none' }}>{b.emoji}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:12, color: b.glow ? 'var(--gold)' : 'var(--text2)', textAlign:'center', lineHeight:1.2 }}>{b.label}</div>
            <div style={{ fontSize:7, color: b.glow ? 'var(--gold-warm)' : 'var(--text3)', textAlign:'center' }}>{b.sub}</div>
          </div>
        ))}
      </div>

      {/* Messages éphémères */}
      <div style={{ fontSize:8, color:'var(--text3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:6 }}>✦ Des attentions pour vous</div>
      {msgs.map((m,i) => {
        const c = cv(m.col)
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
            background:'rgba(255,100,100,.04)', border:'1px solid rgba(255,100,100,.10)',
            borderRadius:10, marginBottom:5 }}>
            <span style={{ fontSize:16, flexShrink:0 }}>💐</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:8, color:'var(--text3)', marginBottom:1 }}>{m.who} · {m.t}</div>
              <div style={{ fontSize:9, color:'var(--text2)', fontStyle:'italic', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.msg}</div>
              <div style={{ fontSize:7, color:c, marginTop:2 }}>{m.zone}</div>
            </div>
            <div style={{ padding:'3px 8px', borderRadius:20, fontSize:8,
              background:'rgba(255,200,100,.1)', border:'1px solid rgba(255,200,100,.25)', color:'rgba(255,220,140,.9)', flexShrink:0 }}>🙏 Merci</div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Écran : Ateliers ── */
function PvAteliers() {
  const ateliers = [
    { title:'Méditation des Racines', theme:'Racines', date:'Sam 22 mars · 10h', host:'Marie T.', spots:4, total:12, price:'12 €', col:'--zone-roots', fmt:'🌐 En ligne' },
    { title:'Respiration Souffle Libre', theme:'Souffle', date:'Dim 23 · 14h', host:'Lucas V.', spots:2, total:8, price:'Gratuit', col:'--zone-breath', fmt:'📍 Présentiel' },
    { title:'Rituel des Fleurs', theme:'Fleurs', date:'Mar 25 · 18h30', host:'Élise M.', spots:7, total:10, price:'8 €', col:'--zone-flowers', fmt:'🌐 En ligne' },
  ]
  return (
    <div style={{ fontFamily:"'Jost',sans-serif", padding:'10px 12px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ fontSize:8, color:'var(--text3)', letterSpacing:'.08em', textTransform:'uppercase' }}>Ateliers à venir</div>
        <div style={{ fontSize:8, padding:'3px 9px', borderRadius:20, background:'rgba(150,212,133,0.1)', border:'1px solid var(--greenT)', color:'var(--green)', cursor:'pointer' }}>+ Créer</div>
      </div>
      {ateliers.map((a,i) => {
        const c = cv(a.col)
        const pct = Math.round((1 - a.spots/a.total)*100)
        return (
          <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid var(--border2)', borderRadius:10, padding:'8px 10px', marginBottom:6 }}>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ width:3, borderRadius:2, background:c, flexShrink:0, alignSelf:'stretch' }}/>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:3 }}>
                  <div style={{ fontSize:10, color:'var(--text)', lineHeight:1.2, fontWeight:500 }}>{a.title}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:12, color:'var(--gold)', flexShrink:0, marginLeft:6 }}>{a.price}</div>
                </div>
                <div style={{ fontSize:7, color:'var(--text3)', marginBottom:5 }}>{a.date} · par {a.host} · {a.fmt}</div>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ fontSize:7, padding:'1px 5px', borderRadius:10, background:`${c}15`, border:`1px solid ${c}40`, color:c }}>{a.theme}</span>
                  <span style={{ fontSize:7, color:'var(--text3)' }}>{a.spots} places</span>
                  <div style={{ flex:1, height:2, borderRadius:1, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:c, opacity:.75 }}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Écran : Défis ── */
function PvDefis() {
  const cats = ['Tous','Souffle','Racines','Feuilles','Tige','Fleurs']
  const defis = [
    { emoji:'🌬️', title:'5 min de souffle chaque matin', zone:'Souffle', col:'--zone-breath', days:14, n:38, prog:60, joined:true },
    { emoji:'🌱', title:'Journal des racines — 21 jours', zone:'Racines', col:'--zone-roots', days:21, n:62, prog:33, joined:false },
    { emoji:'🌸', title:'Gratitude florale quotidienne', zone:'Fleurs', col:'--zone-flowers', days:7, n:91, prog:85, joined:false },
  ]
  return (
    <div style={{ fontFamily:"'Jost',sans-serif" }}>
      {/* Hero */}
      <div style={{ padding:'10px 12px 8px', borderBottom:'1px solid var(--border2)', background:'linear-gradient(135deg,rgba(150,212,133,0.04),var(--bg))' }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:'var(--gold)', marginBottom:4 }}>🌸 Le Rituel des 5 Minutes</div>
        <div style={{ fontSize:8, color:'var(--text3)', lineHeight:1.6, marginBottom:6 }}>Même sans défi officiel, votre jardin peut évoluer. Prenez 5 minutes pour respirer, écrire une gratitude ou marcher en conscience.</div>
        <div style={{ display:'flex', gap:8, marginBottom:8 }}>
          {['✨ Micro-rituel','🌿 Toutes zones','🕊 Sans engagement'].map(m => (
            <div key={m} style={{ fontSize:7, padding:'2px 7px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border2)', color:'var(--text3)' }}>{m}</div>
          ))}
        </div>
        <div style={{ display:'flex', gap:7 }}>
          <div style={{ padding:'5px 12px', borderRadius:20, fontSize:8, background:'rgba(150,212,133,0.10)', border:'1px solid rgba(150,212,133,.25)', color:'var(--green)' }}>🌱 Trouver mon défi</div>
          <div style={{ padding:'5px 12px', borderRadius:20, fontSize:8, background:'rgba(232,192,96,0.08)', border:'1px solid rgba(232,192,96,0.20)', color:'var(--gold)', opacity:.5 }}>🔒 Proposer un défi</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:4, padding:'7px 12px', borderBottom:'1px solid var(--border2)', overflowX:'auto' }}>
        {cats.map((c,i) => (
          <div key={c} style={{ padding:'3px 8px', borderRadius:20, fontSize:8, whiteSpace:'nowrap', cursor:'pointer',
            background: i===0 ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: i===0 ? 'var(--text)' : 'var(--text3)',
            border: i===0 ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.10)' }}>{c}</div>
        ))}
      </div>

      {/* Cards */}
      <div style={{ padding:'8px 12px' }}>
        <div style={{ fontSize:8, color:'var(--text3)', marginBottom:6 }}>Tous les défis · {defis.length} disponibles</div>
        {defis.map((d,i) => {
          const c = cv(d.col)
          return (
            <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid var(--border2)', borderRadius:9, padding:'7px 9px', marginBottom:5 }}>
              <div style={{ display:'flex', gap:7, alignItems:'flex-start' }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{d.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9, color:'var(--text)', lineHeight:1.3, marginBottom:3 }}>{d.title}</div>
                  <div style={{ display:'flex', gap:4, alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontSize:7, padding:'1px 5px', borderRadius:10, background:`${c}15`, border:`1px solid ${c}40`, color:c }}>{d.zone}</span>
                    <span style={{ fontSize:7, color:'var(--text3)' }}>{d.days}j · {d.n} pers.</span>
                  </div>
                  <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.07)' }}>
                    <div style={{ width:`${d.prog}%`, height:'100%', borderRadius:2, background:c, opacity:.8 }}/>
                  </div>
                </div>
                <div style={{ fontSize:8, padding:'3px 7px', borderRadius:20, flexShrink:0,
                  background: d.joined ? 'rgba(150,212,133,0.15)' : `${c}15`,
                  border: d.joined ? '1px solid rgba(150,212,133,0.35)' : `1px solid ${c}40`,
                  color: d.joined ? 'var(--green)' : c, whiteSpace:'nowrap' }}>
                  {d.joined ? '✓ En cours' : 'Rejoindre'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Écran : Jardinothèque ── */
function PvJardinotheque() {
  const tabs = [['🎧','Digital'],['🤝','Partenaires'],['🛍','Occasion']]
  const cats = ['Tous','Audio','Formation','E-book']
  const produits = [
    { title:'Méditation des Racines', cat:'Audio', price:'9,90 €', emoji:'🎧', col:'var(--green)' },
    { title:'Cultiver sa Sérénité', cat:'Formation', price:'49 €', emoji:'📚', col:'#b4a0f0' },
    { title:'Guide des Rituels', cat:'E-book', price:'7,50 €', emoji:'📖', col:'var(--gold)' },
    { title:'Pierres de Lumière', cat:'Pierres', price:'22 €', emoji:'💎', col:'var(--gold-warm)' },
  ]
  return (
    <div style={{ fontFamily:"'Jost',sans-serif" }}>
      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        {tabs.map(([ic,t],i) => (
          <div key={t} style={{ padding:'7px 12px', fontSize:9, cursor:'pointer',
            color: i===0 ? 'var(--text)' : 'var(--text3)',
            borderBottom: i===0 ? '2px solid currentColor' : '2px solid transparent',
            marginBottom:-1, display:'flex', alignItems:'center', gap:3, letterSpacing:'.06em', textTransform:'uppercase' }}>
            <span>{ic}</span><span>{t}</span>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:5, padding:'7px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {cats.map((c,i) => (
          <div key={c} style={{ padding:'3px 8px', borderRadius:20, fontSize:8, cursor:'pointer',
            background: i===0 ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: i===0 ? 'var(--text)' : 'var(--text3)',
            border: i===0 ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.10)' }}>{c}</div>
        ))}
      </div>

      {/* Grille */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7, padding:'8px 12px' }}>
        {produits.map((p,i) => (
          <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid var(--border2)', borderRadius:10, overflow:'hidden' }}>
            <div style={{ height:44, background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{p.emoji}</div>
            <div style={{ padding:'6px 8px' }}>
              <div style={{ fontSize:7, color:'var(--text3)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:2 }}>{p.cat}</div>
              <div style={{ fontSize:9, color:'var(--text)', lineHeight:1.2, marginBottom:5 }}>{p.title}</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, color:'var(--gold)' }}>{p.price}</span>
                <span style={{ fontSize:7, padding:'2px 6px', borderRadius:10, background:'rgba(150,212,133,0.10)', border:'1px solid var(--greenT)', color:'var(--green)', cursor:'pointer' }}>Voir</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Composant principal ThemePreview ── */
// ═══════════════════════════════════════════════════════════
//  ThemePreview — vue mobile unique, fidèle au rendu réel
// ═══════════════════════════════════════════════════════════

const ZONES_DATA = [
  { id:'roots',   icon:'🌱', name:'Racines', cssVar:'--zone-roots',   health:55, accent:'#C8894A', color:'rgba(200,137,74,1)',  bg:'rgba(200,137,74,0.06)'  },
  { id:'stem',    icon:'🌿', name:'Tige',    cssVar:'--zone-stem',    health:78, accent:'#5AAF78', color:'rgba(90,175,120,1)',  bg:'rgba(90,175,120,0.06)'  },
  { id:'leaves',  icon:'🍃', name:'Feuilles',cssVar:'--zone-leaves',  health:68, accent:'#4A9E5C', color:'rgba(74,158,92,1)',   bg:'rgba(74,158,92,0.06)'   },
  { id:'flowers', icon:'🌸', name:'Fleurs',  cssVar:'--zone-flowers', health:74, accent:'#D4779A', color:'rgba(212,119,154,1)', bg:'rgba(212,119,154,0.06)' },
  { id:'breath',  icon:'🌬️', name:'Souffle', cssVar:'--zone-breath',  health:82, accent:'#6ABBE4', color:'rgba(106,187,228,1)', bg:'rgba(106,187,228,0.06)' },
]

const NAV_MOBILE = [
  { id:'bilan',         icon:'🌹', label:'Bilan du matin',     sub:"Prendre soin de soi commence ici", accent:'#C8A882', accentBg:'rgba(200,168,130,0.12)', screen:false },
  { id:'jardin',        icon:'🌸', label:'Ma Fleur',            sub:'Vitalité 72%',                    accent:'#96d485', accentBg:'rgba(150,212,133,0.10)', screen:true  },
  { id:'champ',         icon:'🌻', label:'Jardin Collectif',    sub:'248 fleurs actives',               accent:'#e8c060', accentBg:'rgba(255,200,80,0.09)',  screen:true  },
  { id:'club',          icon:'👥', label:'Club des Jardiniers', sub:'3 groupes',                        accent:'#82c8a0', accentBg:'rgba(130,200,160,0.10)', screen:true  },
  { id:'ateliers',      icon:'📖', label:'Ateliers',            sub:'Pratiques & exercices',            accent:'#78c4a0', accentBg:'rgba(100,180,140,0.09)', screen:true  },
  { id:'defis',         icon:'✨', label:'Défis',               sub:'12 défis actifs',                  accent:'#b4a0f0', accentBg:'rgba(180,140,255,0.09)', screen:true  },
  { id:'jardinotheque', icon:'🌿', label:'Jardinothèque',       sub:'Ressources & boutique',            accent:'#82c8a0', accentBg:'rgba(130,200,160,0.09)', screen:true  },
  { id:'lumens',        icon:'✦',  label:'Lumens',              sub:'340 disponibles',                  accent:'#e8c060', accentBg:'rgba(232,192,96,0.10)',  screen:false },
]

// cr() lit depuis vars (preview scopé) ou depuis document.documentElement (fallback)
function cr(key, vars) {
  if (vars) {
    const v = vars[key]
    if (v) return v
  }
  return getComputedStyle(document.documentElement).getPropertyValue(key).trim() || 'transparent'
}

/* ── Fleur SVG ── */
function FleurSVG({ size=110, zonesData=ZONES_DATA, vars }) {
  const cx=size/2, cy=size/2
  const angles=[234,162,18,306,90] // roots,stem,leaves,flowers,breath
  function petal(a,pct,color) {
    const minR=size*.16, maxR=size*.41
    const r=minR+(pct/100)*(maxR-minR)
    const rad=((a-90)*Math.PI)/180
    const tx=cx+r*Math.cos(rad), ty=cy+r*Math.sin(rad)
    const w=size*.09+(pct/100)*size*.07
    const lr=rad-Math.PI/2
    const c1x=cx+r*.42*Math.cos(rad)+w*Math.cos(lr), c1y=cy+r*.42*Math.sin(rad)+w*Math.sin(lr)
    const c2x=cx+r*.42*Math.cos(rad)-w*Math.cos(lr), c2y=cy+r*.42*Math.sin(rad)-w*Math.sin(lr)
    const c=cr(color, vars)
    return {path:`M${cx} ${cy} Q${c1x} ${c1y} ${tx} ${ty} Q${c2x} ${c2y} ${cx} ${cy} Z`, color:c}
  }
  const petals=zonesData.map((z,i)=>petal(angles[i],z.health,z.cssVar))
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {petals.map((p,i)=>(
        <path key={i} d={p.path} fill={p.color} fillOpacity={.72} stroke={p.color} strokeOpacity={.3} strokeWidth={.6}/>
      ))}
      <circle cx={cx} cy={cy} r={size*.06} fill={cr('--gold', vars)} fillOpacity={.92}/>
      <circle cx={cx} cy={cy} r={size*.025} fill="rgba(255,255,255,0.6)"/>
    </svg>
  )
}

/* ════════════════════ ÉCRANS ════════════════════ */

/* ── Ma Fleur (mobile) ── */
function ScreenJardin({ vars }) {
  const S=.72 // scale factor pour adapter les tailles
  return (
    <div style={{fontFamily:"'Jost',sans-serif", padding:'12px 14px', display:'flex', flexDirection:'column', gap:8}}>
      {/* Message contextuel */}
      <div style={{display:'flex',alignItems:'center',gap:10,paddingBottom:6}}>
        <span style={{fontSize:22,flexShrink:0}}>🌅</span>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:300,fontStyle:'italic',color:'var(--text2)',lineHeight:1.25}}>
          Un beau matin commence dans votre jardin.
        </span>
      </div>

      {/* Bouton action rapide */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'11px 16px',borderRadius:13,background:'linear-gradient(135deg,rgba(232,192,96,0.15),rgba(232,192,96,0.06))',border:'1px solid rgba(232,192,96,0.30)'}}>
        <span style={{fontSize:15}}>⚡</span>
        <span style={{fontSize:13,fontWeight:500,letterSpacing:'.04em',color:'#e8c060'}}>Démarrer ma matinée</span>
      </div>

      {/* Layout matin : fleur colonne + bilan colonne, empilés sur mobile */}
      <div style={{borderRadius:14,overflow:'hidden',border:'1px solid var(--border2)',background:'var(--bg)'}}>
        {/* Colonne fleur */}
        <div style={{position:'relative',minHeight:200,borderBottom:'1px solid var(--border2)',background:'var(--bg)'}}>
          <div style={{position:'absolute',top:12,left:14,zIndex:10}}>
            <div style={{display:'flex',alignItems:'baseline',gap:2,lineHeight:1}}>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:300,color:'#e8f5e0',letterSpacing:-2,lineHeight:1}}>72</span>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:300,color:'var(--text3)'}}>%</span>
            </div>
            <div style={{fontSize:8,letterSpacing:'.28em',textTransform:'uppercase',color:'rgba(150,212,133,0.55)',fontWeight:500,marginTop:2}}>Vitalité</div>
            <div style={{fontSize:9,letterSpacing:'.08em',color:'rgba(255,255,255,0.28)',marginTop:3}}>vendredi</div>
          </div>
          {/* Streak badge */}
          <div style={{position:'absolute',top:10,right:10,zIndex:10,padding:'3px 7px',borderRadius:9,background:'rgba(10,20,12,0.65)',border:'1px solid rgba(150,212,133,0.15)'}}>
            <span style={{fontSize:11,color:'rgba(150,212,133,0.85)',fontFamily:"'Jost',sans-serif",lineHeight:1.4}}>👍 7 jours</span>
            <br/><span style={{fontSize:8,color:'rgba(150,212,133,0.4)',letterSpacing:'.05em'}}>CONSÉCUTIFS</span>
          </div>
          <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:200}}>
            <FleurSVG size={170} vars={vars}/>
          </div>
          {/* Badges personnalisation */}
          <div style={{display:'flex',alignItems:'center',gap:4,padding:'6px 10px',borderTop:'1px solid var(--border2)',background:'var(--bg)',flexWrap:'wrap'}}>
            <span style={{fontSize:8,color:'var(--text3)',letterSpacing:'.06em',whiteSpace:'nowrap'}}>✦ Personnalisez :</span>
            {[['🌱','Basique','#96d48a','rgba(80,160,60,0.14)','rgba(100,180,80,0.30)'],
              ['🌿','Cool','#82c8f0','rgba(60,140,200,0.14)','rgba(80,160,220,0.30)'],
              ['🌟','Extra','#e8c060','rgba(200,160,40,0.14)','rgba(220,180,60,0.30)']].map(([b,l,c,bg,bd])=>(
              <div key={l} style={{display:'inline-flex',alignItems:'center',gap:2,padding:'1px 5px',borderRadius:20,background:bg,border:`1px solid ${bd}`,fontSize:7}}>
                <span>{b}</span><span style={{color:c}}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne bilan */}
        <div style={{padding:'14px 16px',background:'var(--bg2)',display:'flex',flexDirection:'column',gap:8}}>
          <button style={{width:'100%',padding:'13px 16px',borderRadius:13,border:'1px solid rgba(200,168,130,0.25)',background:'rgba(200,168,130,0.07)',cursor:'pointer',display:'flex',alignItems:'center',gap:12,textAlign:'left'}}>
            <span style={{fontSize:24}}>🌹</span>
            <div style={{flex:1}}>
              <div style={{fontSize:14,color:'#C8A882',fontWeight:500,marginBottom:2}}>Faire mon bilan du jour</div>
              <div style={{fontSize:11,color:'rgba(180,200,180,0.4)',fontStyle:'italic'}}>Prendre soin de soi commence ici</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:20,background:'rgba(232,192,96,0.12)',border:'1px solid rgba(232,192,96,0.30)',fontSize:11,color:'#e8c060',fontWeight:600,flexShrink:0}}>+3 ✦</div>
          </button>
          {/* MessageJardin */}
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px 12px',textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:10,opacity:.25}}>🌿</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,fontStyle:'italic',lineHeight:1.35,maxWidth:280}}>
              <span style={{color:'#96d485'}}>Élise,</span>
              <span style={{color:'var(--text)'}}> votre jardin vous attend.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section rituels */}
      <div style={{width:'100%'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <div>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:400,color:'var(--text2)',marginBottom:4}}>Prenez soin de vous</p>
            <p style={{fontSize:11,color:'var(--text3)',lineHeight:1.5}}>Agissez au quotidien avec vos rituels · <span style={{opacity:.55}}>1/10 accomplis</span></p>
          </div>
        </div>
        {/* Grille 2 colonnes */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
          {ZONES_DATA.map(z=>{
            const c=cr(z.cssVar, vars)
            const doneCnt = z.id==='breath' ? 1 : 0
            const done = doneCnt>0
            return (
              <div key={z.id} style={{position:'relative',overflow:'hidden',padding:'12px 12px 10px',borderRadius:14,cursor:'pointer',
                background:`linear-gradient(145deg, ${c}12 0%, ${z.bg} 60%)`,
                border:`1px solid ${done?c+'35':'rgba(255,255,255,0.07)'}`,
                boxShadow: done?`0 0 12px ${c}18`:'none',display:'flex',flexDirection:'column',gap:0}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:7,flex:1,minWidth:0}}>
                    <span style={{fontSize:22,lineHeight:1,flexShrink:0}}>{z.icon}</span>
                    <span style={{fontSize:13,color:z.accent,fontWeight:700,letterSpacing:'.04em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{z.name}</span>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2,flexShrink:0,paddingLeft:6}}>
                    <span style={{fontSize:18,fontFamily:"'Cormorant Garamond',serif",color:z.accent,fontWeight:600,lineHeight:1}}>{z.health}<span style={{fontSize:10,opacity:.6}}>%</span></span>
                    {done&&<span style={{fontSize:12,color:z.accent}}>✓</span>}
                  </div>
                </div>
                <div style={{height:3,borderRadius:3,background:'rgba(255,255,255,0.06)',overflow:'hidden',marginBottom:7}}>
                  <div style={{height:'100%',width:`${z.health}%`,background:`linear-gradient(90deg,${c}70,${c})`,borderRadius:3,boxShadow:z.health>50?`0 0 6px ${c}80`:'none'}}/>
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:11,color:'rgba(255,255,255,0.28)'}}>
                    {done?<span style={{color:c+'cc'}}>{doneCnt}</span>:<span>{doneCnt}</span>}
                    <span style={{color:'rgba(255,255,255,0.18)'}}>/2</span>
                  </span>
                  <span style={{fontSize:12,color:'rgba(255,255,255,0.20)'}}>›</span>
                </div>
              </div>
            )
          })}
          {/* Card action rapide */}
          <div style={{position:'relative',overflow:'hidden',padding:'12px 12px 10px',borderRadius:14,cursor:'pointer',
            background:'linear-gradient(160deg,rgba(44,34,8,0.97)0%,rgba(28,22,6,0.99)100%)',
            border:'1px solid rgba(232,196,100,0.45)',
            boxShadow:'0 2px 24px rgba(232,196,100,0.14),0 1px 0 rgba(255,230,120,0.12) inset',
            display:'flex',flexDirection:'column',gap:0}}>
            <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 0%,rgba(232,196,100,0.14)0%,transparent 65%)',pointerEvents:'none'}}/>
            <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(255,222,100,0.35),transparent)',pointerEvents:'none'}}/>
            <div style={{marginBottom:6}}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                <div style={{width:26,height:26,borderRadius:'50%',flexShrink:0,background:'rgba(232,196,100,0.14)',border:'1px solid rgba(232,196,100,0.40)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8.5" stroke="rgba(255,222,100,0.85)" strokeWidth="1.4"/>
                    <circle cx="10" cy="10" r="1.2" fill="rgba(255,222,100,0.90)"/>
                    <line x1="10" y1="10" x2="10" y2="4.5" stroke="rgba(255,222,100,0.90)" strokeWidth="1.4" strokeLinecap="round"/>
                    <line x1="10" y1="10" x2="13.8" y2="12.2" stroke="rgba(255,222,100,0.70)" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{fontSize:11,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--gold)',lineHeight:1.2}}>Une action rapide</span>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:12,fontWeight:600,color:'var(--gold-warm)'}}>Souffle</span>
                <span style={{fontSize:9,color:'rgba(232,196,100,0.45)',letterSpacing:'.04em'}}>4/5 restantes</span>
              </div>
            </div>
            <div style={{height:1,background:'rgba(232,196,100,0.18)',borderRadius:1}}/>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Jardin Collectif ── */
function ScreenChamp({ vars }) {
  const zkeys=['--zone-roots','--zone-stem','--zone-leaves','--zone-flowers','--zone-breath']
  return (
    <div style={{position:'relative',minHeight:320,background:'var(--bg)',overflow:'hidden'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,padding:'12px'}}>
        {Array.from({length:42}).map((_,i)=>{
          const k=zkeys[i%5], c=cr(k, vars)
          const pct=35+((i*13+7)%55)
          const sz=28,cx=14,cy=14
          return (
            <svg key={i} width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{opacity:.45+((i*7)%5)*.12}}>
              {[90,162,234,306,18].map((a,j)=>{
                const minR=3.5,maxR=10,r=minR+(pct/100)*(maxR-minR)
                const rad=((a-90)*Math.PI)/180
                const tx=cx+r*Math.cos(rad),ty=cy+r*Math.sin(rad)
                const w=2.8,lr=rad-Math.PI/2
                const c1x=cx+r*.42*Math.cos(rad)+w*Math.cos(lr),c1y=cy+r*.42*Math.sin(rad)+w*Math.sin(lr)
                const c2x=cx+r*.42*Math.cos(rad)-w*Math.cos(lr),c2y=cy+r*.42*Math.sin(rad)-w*Math.sin(lr)
                return <path key={j} d={`M${cx} ${cy} Q${c1x} ${c1y} ${tx} ${ty} Q${c2x} ${c2y} ${cx} ${cy} Z`} fill={c} fillOpacity={.72}/>
              })}
              <circle cx={cx} cy={cy} r={2} fill={cr('--gold', vars)} fillOpacity={.88}/>
            </svg>
          )
        })}
      </div>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'radial-gradient(circle at center,transparent 15%,rgba(14,26,14,0.35)40%,rgba(14,26,14,0.88)70%)'}}/>
      <div style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',zIndex:10}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'7px 16px',borderRadius:20,background:'rgba(180,160,240,0.12)',border:'1px solid rgba(180,160,240,0.30)',whiteSpace:'nowrap'}}>
          <span style={{fontSize:12}}>🔒</span>
          <span style={{fontSize:11,color:'var(--green)',fontWeight:500}}>Voir tout le jardin — Premium</span>
          <span style={{fontSize:10,color:'rgba(180,160,240,0.60)'}}>→</span>
        </div>
      </div>
    </div>
  )
}

/* ── Club Jardiniers ── */
function ScreenClub({ vars }) {
  const btns=[
    {emoji:'✦',label:"L'Égrégore",sub:'Fleur collective du groupe',glow:true},
    {emoji:'🌿',label:'Le Jardin',sub:'20 fleurs à soutenir',glow:false},
    {emoji:'🌻',label:'Mes ami(e)s',sub:'3 jardiniers',glow:false},
  ]
  const msgs=[
    {who:'Mia·Pivoine',msg:'Belle journée à toutes 🌸',zone:'Fleurs',col:'--zone-flowers',t:'2 h'},
    {who:'Léa·Cèdre',msg:"J'ai fait mon rituel ce matin ✨",zone:'Souffle',col:'--zone-breath',t:'4 h'},
  ]
  return (
    <div style={{fontFamily:"'Jost',sans-serif",padding:'20px 14px 14px',overflowY:'auto'}}>
      {/* Titre */}
      <div style={{marginBottom:18}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:300,color:'var(--gold)',lineHeight:1,letterSpacing:'.02em'}}>
          Club des<br/><em style={{color:'rgba(150,212,133,.85)'}}>Jardiniers</em>
        </div>
        <div style={{fontSize:10,color:'var(--text3)',marginTop:7}}>vendredi 20 mars 2026</div>
      </div>

      {/* 3 boutons */}
      <div style={{display:'flex',gap:10,marginBottom:20}}>
        {btns.map(b=>(
          <div key={b.label} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:7,
            padding:'16px 8px',borderRadius:16,cursor:'pointer',
            background:b.glow?'linear-gradient(135deg,rgba(232,196,100,.16),rgba(150,212,133,.1))':'rgba(255,255,255,.025)',
            border:`1px solid ${b.glow?'rgba(232,196,100,.42)':'rgba(255,255,255,.07)'}`,
            boxShadow:b.glow?'0 0 22px rgba(232,196,100,.20),0 0 50px rgba(150,212,133,.07)':'none'}}>
            <div style={{fontSize:28,lineHeight:1,filter:b.glow?'drop-shadow(0 0 10px rgba(232,196,100,.65))':'none'}}>{b.emoji}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:b.glow?'var(--gold)':'var(--text2)',textAlign:'center',lineHeight:1.2}}>{b.label}</div>
            <div style={{fontSize:9,color:b.glow?'var(--gold-warm)':'var(--text3)',textAlign:'center'}}>{b.sub}</div>
          </div>
        ))}
      </div>

      {/* Texte bienvenue */}
      <div style={{padding:'16px 18px',borderRadius:14,background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.06)',marginBottom:16}}>
        <p style={{margin:'0 0 14px',fontSize:12,color:'var(--text3)',lineHeight:1.75,textAlign:'center',fontStyle:'italic'}}>
          Bienvenue dans le Club des Jardiniers. Cet espace vous permet de vous relier aux autres membres et de partager une présence bienveillante.
        </p>
        {[
          {icon:'✦',color:'rgba(232,196,100,.9)',title:"L'Égrégore",desc:"L'énergie du groupe. Chaque rituel nourrit la fleur collective."},
          {icon:'🌿',color:'rgba(150,212,133,.9)',title:'Le Jardin de soutien',desc:"Offrez un élan à un jardin fragile — un geste bienveillant."},
          {icon:'🌻',color:'rgba(232,100,100,.9)',title:"Mes ami(e)s",desc:"Les jardiniers avec lesquels vous avez créé un lien particulier."},
        ].map((item,i)=>(
          <div key={item.title} style={{display:'flex',gap:12,paddingTop:i>0?14:0,borderTop:i>0?'1px solid rgba(255,255,255,.05)':'none'}}>
            <div style={{flexShrink:0,width:36,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:item.color}}>{item.icon}</div>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:item.color,marginBottom:4}}>{item.title}</div>
              <div style={{fontSize:11,color:'var(--text3)',lineHeight:1.7}}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Messages éphémères */}
      {msgs.length>0&&(
        <div style={{display:'flex',flexDirection:'column',gap:7}}>
          <div style={{fontSize:9,color:'var(--text3)',letterSpacing:'.12em',textTransform:'uppercase'}}>✦ Des petites attentions à votre égard !</div>
          {msgs.map((m,i)=>{
            const c=cr(m.col, vars)
            return (
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'rgba(255,100,100,.04)',border:'1px solid rgba(255,100,100,.10)',borderRadius:13}}>
                <span style={{fontSize:20,flexShrink:0}}>💐</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,color:'var(--text3)',marginBottom:2}}>{m.who}</div>
                  <div style={{fontSize:11,color:'var(--text3)',fontStyle:'italic',lineHeight:1.55,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.msg}</div>
                  <div style={{fontSize:9,color:c,marginTop:3}}>{m.zone} · {m.t}</div>
                </div>
                <div style={{flexShrink:0,minHeight:32,padding:'0 12px',borderRadius:100,fontSize:10,background:'rgba(255,200,100,.1)',border:'1px solid rgba(255,200,100,.25)',color:'rgba(255,220,140,.9)',cursor:'pointer',display:'flex',alignItems:'center'}}>🙏 Merci</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Ateliers ── */
function ScreenAteliers({ vars }) {
  const ateliers=[
    {title:'Méditation des Racines',theme:'Racines',date:'Sam 22 mars · 10h00',host:'Marie T.',spots:4,total:12,price:'12 €',col:'--zone-roots',fmt:'🌐 En ligne'},
    {title:'Respiration Souffle Libre',theme:'Souffle',date:'Dim 23 mars · 14h00',host:'Lucas V.',spots:2,total:8,price:'Gratuit',col:'--zone-breath',fmt:'📍 Présentiel'},
    {title:'Rituel des Fleurs',theme:'Fleurs',date:'Mar 25 mars · 18h30',host:'Élise M.',spots:7,total:10,price:'8 €',col:'--zone-flowers',fmt:'🌐 En ligne'},
    {title:'Ancrage dans les Racines',theme:'Racines',date:'Jeu 27 mars · 10h00',host:'Anna B.',spots:5,total:15,price:'15 €',col:'--zone-roots',fmt:'📍 Présentiel'},
  ]
  return (
    <div style={{fontFamily:"'Jost',sans-serif",flex:1,overflowY:'auto',padding:'14px 14px 80px'}}>
      {/* Filter button */}
      <button style={{fontSize:10,padding:'6px 12px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:20,color:'var(--text3)',cursor:'pointer',marginBottom:10,display:'block'}}>⚙ Filtrer</button>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:26,fontWeight:300,color:'var(--gold)'}}>Ateliers</div>
          <div style={{fontSize:11,color:'var(--text3)',letterSpacing:'.05em',marginTop:2}}>Moments partagés, guidés par des animateurs</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid var(--border2)',marginBottom:16}}>
        {[['upcoming','À venir'],['mine','Mes ateliers'],['past','Passés']].map(([id,lbl],i)=>(
          <div key={id} style={{padding:'8px 14px',fontSize:11,letterSpacing:'.05em',color:i===0?'var(--text)':'var(--text3)',borderBottom:i===0?'2px solid var(--green)':'2px solid transparent',marginBottom:-1,cursor:'pointer'}}>
            {lbl}
          </div>
        ))}
      </div>

      {/* Cards */}
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {ateliers.map((a,i)=>{
          const c=cr(a.col, vars)
          const pct=Math.round((1-a.spots/a.total)*100)
          const isReg=i===0
          return (
            <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border2)',borderRadius:14,padding:'14px 16px',cursor:'pointer',transition:'all .2s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,color:'var(--text)',lineHeight:1.3,fontWeight:500,marginBottom:3}}>{a.title}</div>
                  <div style={{fontSize:10,color:'var(--text3)',marginBottom:6}}>{a.date} · {a.fmt}</div>
                  <div style={{fontSize:10,color:'var(--text3)'}}>par <span style={{color:'var(--text2)'}}>{a.host}</span></div>
                </div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:300,color:'var(--gold)',flexShrink:0,marginLeft:12}}>{a.price}</div>
              </div>
              {/* Barre remplissage */}
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <div style={{flex:1,height:3,borderRadius:2,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                  <div style={{width:`${pct}%`,height:'100%',background:c,opacity:.8,borderRadius:2}}/>
                </div>
                <span style={{fontSize:9,color:'var(--text3)',whiteSpace:'nowrap'}}>{a.spots} place{a.spots>1?'s':''}</span>
              </div>
              <div style={{display:'flex',gap:7,alignItems:'center'}}>
                <span style={{fontSize:9,padding:'2px 7px',borderRadius:10,background:`${c}15`,border:`1px solid ${c}40`,color:c}}>{a.theme}</span>
                {isReg?(
                  <div style={{marginLeft:'auto',fontSize:10,padding:'5px 12px',borderRadius:20,background:'rgba(150,212,133,0.12)',border:'1px solid rgba(150,212,133,0.30)',color:'var(--green)'}}>✓ Inscrit</div>
                ):(
                  <div style={{marginLeft:'auto',fontSize:10,padding:'5px 14px',borderRadius:20,background:'rgba(255,255,255,0.06)',border:'1px solid var(--border)',color:'var(--text2)',cursor:'pointer'}}>S'inscrire</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Défis ── */
function ScreenDefis({ vars }) {
  const cats=['Tous','Souffle','Racines','Feuilles','Tige','Fleurs']
  const defis=[
    {emoji:'🌬️',title:'5 min de souffle chaque matin',zone:'Souffle',col:'--zone-breath',days:14,n:38,prog:60,joined:true},
    {emoji:'🌱',title:'Journal des racines — 21 jours',zone:'Racines',col:'--zone-roots',days:21,n:62,prog:33,joined:false},
    {emoji:'🌸',title:'Gratitude florale quotidienne',zone:'Fleurs',col:'--zone-flowers',days:7,n:91,prog:85,joined:false},
    {emoji:'🍃',title:'Marche consciente en nature',zone:'Feuilles',col:'--zone-leaves',days:14,n:24,prog:50,joined:false},
  ]
  return (
    <div style={{fontFamily:"'Jost',sans-serif",flex:1,overflowY:'auto',padding:'0 0 80px'}}>
      {/* Défi featured */}
      <div style={{position:'relative',margin:'0',padding:'20px 16px 16px',borderBottom:'1px solid var(--border2)',background:'linear-gradient(160deg,rgba(150,212,133,0.05)0%,var(--bg)100%)'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(150,212,133,0.3),transparent)'}}/>
        <div style={{fontSize:9,letterSpacing:'.14em',textTransform:'uppercase',color:'rgba(150,212,133,0.55)',marginBottom:8}}>Défi communauté · Rejoins-nous</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:300,color:'var(--text)',marginBottom:8,lineHeight:1.2}}>🌸 Le Rituel des 5 Minutes</div>
        <div style={{fontSize:12,color:'var(--text3)',lineHeight:1.75,marginBottom:12}}>Même sans défi officiel, votre jardin peut évoluer. Prenez 5 minutes pour respirer, écrire ou marcher en conscience.</div>
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          {['📅 14 jours','🌿 Toutes zones','👥 248 participants'].map(m=>(
            <div key={m} style={{fontSize:9,padding:'2px 8px',borderRadius:10,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border2)',color:'var(--text3)'}}>{m}</div>
          ))}
        </div>
        <div style={{display:'flex',gap:8}}>
          <div style={{padding:'9px 18px',borderRadius:20,fontSize:12,background:'rgba(150,212,133,0.15)',border:'1px solid rgba(150,212,133,0.35)',color:'var(--green)',cursor:'pointer',fontWeight:500}}>🌱 Trouver mon défi</div>
          <div style={{padding:'9px 14px',borderRadius:20,fontSize:11,background:'rgba(232,192,96,0.08)',border:'1px solid rgba(232,192,96,0.20)',color:'var(--gold)',opacity:.45,cursor:'not-allowed'}}>🔒 Proposer</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{display:'flex',gap:5,padding:'10px 14px',borderBottom:'1px solid var(--border2)',overflowX:'auto'}}>
        {cats.map((c,i)=>(
          <div key={c} style={{padding:'4px 12px',borderRadius:20,fontSize:11,whiteSpace:'nowrap',cursor:'pointer',
            background:i===0?'rgba(255,255,255,0.08)':'transparent',
            color:i===0?'var(--text)':'var(--text3)',
            border:i===0?'1px solid rgba(255,255,255,0.25)':'1px solid rgba(255,255,255,0.10)'}}>{c}</div>
        ))}
      </div>

      {/* Label */}
      <div style={{fontSize:11,color:'var(--text3)',padding:'10px 14px 6px',letterSpacing:'.02em'}}>
        Tous les défis · {defis.length} disponibles
      </div>

      {/* Cards grille */}
      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:8,padding:'0 14px 0'}}>
        {defis.map((d,i)=>{
          const c=cr(d.col, vars)
          return (
            <div key={i} style={{background:'rgba(255,255,255,0.04)',border:'1px solid var(--border2)',borderRadius:13,padding:'12px 14px',cursor:'pointer'}}>
              <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                <span style={{fontSize:22,flexShrink:0,marginTop:1}}>{d.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,color:'var(--text)',lineHeight:1.3,marginBottom:6,fontWeight:400}}>{d.title}</div>
                  <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:8}}>
                    <span style={{fontSize:9,padding:'2px 7px',borderRadius:10,background:`${c}15`,border:`1px solid ${c}40`,color:c}}>{d.zone}</span>
                    <span style={{fontSize:10,color:'var(--text3)'}}>{d.days}j</span>
                    <span style={{fontSize:10,color:'var(--text3)'}}>· {d.n} participants</span>
                  </div>
                  <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,0.07)'}}>
                    <div style={{width:`${d.prog}%`,height:'100%',borderRadius:2,background:c,opacity:.82}}/>
                  </div>
                </div>
                <div style={{flexShrink:0,fontSize:11,padding:'5px 10px',borderRadius:20,
                  background:d.joined?'rgba(150,212,133,0.15)':`${c}15`,
                  border:d.joined?'1px solid rgba(150,212,133,0.35)':`1px solid ${c}40`,
                  color:d.joined?'var(--green)':c,whiteSpace:'nowrap',marginTop:1}}>
                  {d.joined?'✓ En cours':'Rejoindre'}
                </div>
              </div>
            </div>
          )
        })}
        {/* Verrou premium */}
        <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'7px 13px',borderRadius:20,cursor:'pointer',background:'rgba(232,192,96,0.08)',border:'1px solid rgba(232,192,96,0.25)'}}>
          <span style={{fontSize:13}}>🔒</span>
          <span style={{fontSize:12,color:'var(--gold)',fontWeight:500}}>8 défis Premium</span>
          <span style={{fontSize:11,color:'var(--gold-warm)'}}>→</span>
        </div>
      </div>
    </div>
  )
}

/* ── Jardinothèque ── */
function ScreenJardinotheque({ vars }) {
  const tabs=[['🎧','Digital'],['🤝','Partenaires'],['🛍','Occasion']]
  const cats=['Tous','Audio','Formation','E-book']
  const produits=[
    {title:'Méditation des Racines',cat:'Audio',price:'9,90 €',emoji:'🎧'},
    {title:'Cultiver sa Sérénité',cat:'Formation',price:'49 €',emoji:'📚'},
    {title:'Guide des Rituels du Matin',cat:'E-book',price:'7,50 €',emoji:'📖'},
    {title:'Pierres de Lumière',cat:'Pierres',price:'22 €',emoji:'💎'},
    {title:'Huile Essentielle Lavande',cat:'Huiles',price:'18 €',emoji:'🌸'},
    {title:'Bracelet Racines',cat:'Bijoux',price:'34 €',emoji:'📿'},
  ]
  return (
    <div style={{fontFamily:"'Jost',sans-serif",flex:1,overflowY:'auto'}}>
      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        {tabs.map(([ic,t],i)=>(
          <div key={t} style={{padding:'10px 14px',fontSize:11,letterSpacing:'.08em',textTransform:'uppercase',cursor:'pointer',
            color:i===0?'var(--text)':'var(--text3)',
            borderBottom:i===0?'2px solid currentColor':'2px solid transparent',
            marginBottom:-1,display:'flex',alignItems:'center',gap:4,fontFamily:"'Jost',sans-serif",background:'none'}}>
            <span>{ic}</span><span>{t}</span>
          </div>
        ))}
      </div>
      {/* Filtres */}
      <div style={{display:'flex',gap:6,padding:'8px 12px',borderBottom:'1px solid rgba(255,255,255,0.06)',overflowX:'auto'}}>
        {cats.map((c,i)=>(
          <div key={c} style={{padding:'4px 12px',borderRadius:20,fontSize:11,cursor:'pointer',whiteSpace:'nowrap',
            background:i===0?'rgba(255,255,255,0.08)':'transparent',
            color:i===0?'var(--text)':'var(--text3)',
            border:i===0?'1px solid rgba(255,255,255,0.25)':'1px solid rgba(255,255,255,0.10)'}}>{c}</div>
        ))}
      </div>
      {/* Grille */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,padding:'10px 12px'}}>
        {produits.map((p,i)=>(
          <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border2)',borderRadius:14,overflow:'hidden',cursor:'pointer',transition:'all .2s'}}>
            <div style={{height:64,background:'rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>{p.emoji}</div>
            <div style={{padding:'8px 10px'}}>
              <div style={{fontSize:8,color:'var(--text3)',letterSpacing:'.10em',textTransform:'uppercase',marginBottom:3}}>{p.cat}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontWeight:300,color:'var(--text)',lineHeight:1.2,marginBottom:7}}>{p.title}</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontWeight:300,color:'var(--gold)'}}>{p.price}</span>
                <span style={{fontSize:9,padding:'3px 9px',borderRadius:20,background:'rgba(150,212,133,0.10)',border:'1px solid var(--greenT)',color:'var(--green)',cursor:'pointer',fontWeight:500}}>Voir</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════ THEME PREVIEW ════════════════════ */
function ThemePreview({ vars = {} }) {
  const [activePage, setActivePage] = useState('nav')

  // Génère le bloc <style> scopé au cadre preview uniquement
  const scopedStyle = Object.entries(vars)
    .filter(([k]) => k.startsWith('--'))
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')

  const activeScreen = PREVIEW_NAV.find(n=>n.id===activePage)

  function renderScreen() {
    if (activePage==='jardin')        return <ScreenJardin vars={vars}/>
    if (activePage==='champ')         return <ScreenChamp vars={vars}/>
    if (activePage==='club')          return <ScreenClub vars={vars}/>
    if (activePage==='ateliers')      return <ScreenAteliers vars={vars}/>
    if (activePage==='defis')         return <ScreenDefis vars={vars}/>
    if (activePage==='jardinotheque') return <ScreenJardinotheque vars={vars}/>
    return null
  }

  return (
    <div style={{ position:'sticky', top:20, fontFamily:"'Jost',sans-serif" }}>

      {/* Label */}
      <div style={{ fontSize:9, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(242,237,224,0.35)', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ flex:1 }}>Aperçu mobile en direct</span>
        <span style={{ width:7, height:7, borderRadius:'50%', background: cr('--green', vars) || 'var(--green)', boxShadow:`0 0 6px ${cr('--green', vars) || 'var(--green)'}`, animation:'pvPulse 2s ease-in-out infinite', display:'inline-block' }}/>
      </div>
      <style>{`@keyframes pvPulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

      {/* Style scopé — les vars n'affectent QUE le cadre preview */}
      <style>{`#theme-preview-root {\n${scopedStyle}\n}`}</style>

      {/* Cadre téléphone */}
      <div id="theme-preview-root" style={{
        width: 280, margin: '0 auto',
        borderRadius: 36,
        border: '2.5px solid rgba(255,255,255,0.14)',
        boxShadow: '0 24px 72px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.3)',
        background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* Status bar */}
        <div style={{ height:28, background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', flexShrink:0 }}>
          <span style={{ fontSize:10, color:'var(--text2)', fontWeight:600 }}>9:41</span>
          <div style={{ width:72, height:18, borderRadius:10, background:'rgba(0,0,0,0.6)', border:'2px solid rgba(255,255,255,0.12)', position:'absolute', left:'50%', transform:'translateX(-50%)', top:4 }}/>
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            <span style={{ fontSize:9, color:'var(--text2)' }}>●●●</span>
            <span style={{ fontSize:10, color:'var(--text2)' }}>100%</span>
          </div>
        </div>

        {/* Topbar app */}
        <div style={{ background:'var(--bg)', padding: activePage==='nav'?'7px 14px 8px':'6px 14px 7px', flexShrink:0, borderBottom:'1px solid var(--border2)' }}>
          {activePage==='nav' ? (
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:24, fontWeight:300, color:'var(--cream)', letterSpacing:'0.01em', lineHeight:1 }}>
                Mon <em style={{ fontStyle:'italic', color:'var(--gold)' }}>Jardin</em> Intérieur
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:24, fontWeight:300, color:'var(--cream)', lineHeight:1 }}>
                Mon <em style={{ fontStyle:'italic', color:'var(--gold)' }}>Jardin</em> Intérieur
              </div>
              <div style={{ fontSize:10, color:'var(--gold)', opacity:.6, letterSpacing:'.08em', textTransform:'uppercase' }}>
                {activeScreen?.label || ''}
              </div>
            </div>
          )}
          <div style={{ position:'absolute', right:14, top: activePage==='nav'?'calc(28px + 12px)':'calc(28px + 10px)', display:'flex', gap:6, alignItems:'center' }}>
            <div style={{ fontSize:10, padding:'4px 10px', borderRadius:6, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)', color:'var(--text3)', cursor:'pointer' }}>Aide</div>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, cursor:'pointer' }}>⚙️</div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', maxHeight:520, minHeight:400, WebkitOverflowScrolling:'touch' }}>
          {activePage === 'nav' ? (
            /* ── NavHub réel ── */
            <div style={{ display:'flex', flexDirection:'column', padding:'6px 12px 10px', gap:5 }}>
              <div style={{ fontSize:8, letterSpacing:'0.18em', color:'var(--text3)', textTransform:'uppercase', paddingLeft:3, paddingBottom:2, flexShrink:0 }}>Mon Jardin</div>
              {NAV_MOBILE.map(item => (
                <div key={item.id}
                  onClick={() => item.screen && setActivePage(item.id)}
                  style={{
                    flex:'1 1 0', minHeight:52,
                    display:'flex', alignItems:'center', gap:12,
                    padding:'0 14px 0 10px', borderRadius:13,
                    background: item.accentBg,
                    border:`1px solid ${item.accent}33`,
                    cursor: item.screen ? 'pointer' : 'default',
                    position:'relative', overflow:'hidden', transition:'all .15s ease',
                  }}>
                  {/* Accent bar */}
                  <div style={{ position:'absolute', left:0, top:'18%', bottom:'18%', width:2, borderRadius:2, background:`${item.accent}60` }}/>
                  {/* Emoji */}
                  <div style={{ flexShrink:0, fontSize: item.id==='lumens'?20:24, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', color: item.id==='lumens'?item.accent:'inherit' }}>
                    {item.icon}
                  </div>
                  {/* Texte */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, fontFamily:"'Cormorant Garamond','Georgia',serif", letterSpacing:'0.01em', color:'var(--text2)', lineHeight:1.2, marginBottom:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.02em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.sub}</div>
                  </div>
                  {/* Badge ou flèche */}
                  {item.id==='lumens' ? (
                    <div style={{ flexShrink:0, padding:'3px 9px', borderRadius:100, background:`${item.accent}18`, border:`1px solid ${item.accent}50`, fontSize:11, fontWeight:700, color:item.accent, whiteSpace:'nowrap' }}>{item.sub.split(' ')[0]} ✦</div>
                  ) : item.id==='club' ? (
                    <div style={{ flexShrink:0, padding:'3px 9px', borderRadius:100, background:`${item.accent}18`, border:`1px solid ${item.accent}50`, fontSize:11, fontWeight:700, color:item.accent }}>2 💌</div>
                  ) : item.screen ? (
                    <div style={{ flexShrink:0, fontSize:14, color:`${item.accent}40` }}>›</div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            /* ── Écran actif ── */
            <div>
              {/* Bouton retour nav */}
              <div onClick={() => setActivePage('nav')} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', cursor:'pointer', borderBottom:'1px solid var(--border2)', background:'rgba(255,255,255,0.015)' }}>
                <span style={{ fontSize:14, color:'var(--text3)' }}>‹</span>
                <span style={{ fontSize:11, color:'var(--text3)' }}>Navigation</span>
              </div>
              {renderScreen()}
            </div>
          )}
        </div>

        {/* Home indicator */}
        <div style={{ height:20, background:'var(--bg2)', display:'flex', alignItems:'center', justifyContent:'center', borderTop:'1px solid var(--border2)', flexShrink:0 }}>
          <div style={{ width:60, height:4, borderRadius:2, background:'rgba(255,255,255,0.18)' }}/>
        </div>
      </div>

      {/* Note */}
      <div style={{ marginTop:10, fontSize:8, color:'rgba(242,237,224,0.20)', textAlign:'center', fontStyle:'italic' }}>
        Mise à jour en temps réel · cliquer pour naviguer
      </div>
    </div>
  )
}


export function AdminPage() {
  useTheme()
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
    const ADMIN_ID = ADMIN_IDS[0] // utilise le tableau source
    const now   = new Date()
    const ymd   = d => d.toISOString().slice(0,10)
    const ago   = n => ymd(new Date(Date.now() - n * 86400000))
    const periods = { day: ago(0), week: ago(6), month: ago(29), year: ago(364) }

    // ── Inscriptions (nouveaux users) ─────────────────────────────────────────
    const { data: usersData } = await supabase
      .from('users').select('id, created_at').not('id', 'in', `(${ADMIN_IDS.join(',')})`)
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
      .not('user_id', 'in', `(${ADMIN_IDS.join(',')})`)
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
      .not('user_id', 'in', `(${ADMIN_IDS.join(',')})`)
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
      .from('ateliers').select('id, created_at').not('animator_id', 'in', `(${ADMIN_IDS.join(',')})`).gte('created_at', ago(364))
    const ateliersByDate = {}
    ;(atelierData ?? []).forEach(a => {
      const d = a.created_at?.slice(0,10)
      if (d) ateliersByDate[d] = (ateliersByDate[d] ?? 0) + 1
    })

    // ── Inscriptions ateliers ─────────────────────────────────────────────────
    const { data: regData } = await supabase
      .from('atelier_registrations').select('user_id, created_at').not('user_id', 'in', `(${ADMIN_IDS.join(',')})`).gte('created_at', ago(364))
    const regsByDate = {}
    ;(regData ?? []).forEach(r => {
      const d = r.created_at?.slice(0,10)
      if (d) regsByDate[d] = (regsByDate[d] ?? 0) + 1
    })

    // ── Défis rejoints ────────────────────────────────────────────────────────
    const { data: defiData } = await supabase
      .from('analytics_events').select('created_at').eq('event_type', 'defi_join').not('user_id', 'in', `(${ADMIN_IDS.join(',')})`).gte('created_at', ago(364))
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
        const { data: rows } = await supabase.from('daily_quiz').select('user_id, date').gte('date', ago13).not('user_id', 'in', `(${ADMIN_IDS.join(',')})`)
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
        const { data: users } = await supabase.from('users').select('id, display_name, email').not('id', 'in', `(${ADMIN_IDS.join(',')})`)
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
      supabase.from('users').select('*', { count: 'exact', head: true }).not('id', 'in', `(${ADMIN_IDS.join(',')})`),
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
          <div className={`adm-tab${tab === 'theme' ? ' active' : ''}`} onClick={() => setTab('theme')}>
            🎨 Thème
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

        {tab === 'theme' && (
          <div className="adm-section">
            <ThemeEditor showToast={showToast} />
          </div>
        )}

      </div>
      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  )
}
