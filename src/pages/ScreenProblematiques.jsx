// ─────────────────────────────────────────────────────────────────────────────
//  ScreenProblematiques.jsx  —  Écran "Trouve une réponse à ce que tu vis !"
//  Cartes de problématiques du quotidien (anxiété, sommeil, stress…)
//  Chaque carte ouvre une fiche solution : audio hypnose immédiat,
//  exercice express, et un outil de compréhension (texte ou vidéo coaching).
//
//  Table Supabase attendue : `problematiques`
//    id, ordre, statut ('actif'|'inactif'), categorie, emoji, titre, accroche,
//    symptomes (text[], 3 items), description,
//    audio_titre, audio_url, audio_duree_min, audio_is_premium (bool),
//    exercice_titre, exercice_texte, exercice_duree_min, exercice_is_premium (bool),
//    coaching_type ('texte'|'video'|'pdf' — onglet ouvert par défaut),
//    coaching_titre, coaching_texte, coaching_video_url, coaching_pdf_url, coaching_is_premium (bool)
//  → chaque outil (audio / exercice / compréhension) a son propre verrou premium,
//    indépendant des deux autres — une fiche peut mélanger free et premium.
//  → au moins un des 3 champs coaching_texte / coaching_video_url / coaching_pdf_url
//    doit être renseigné pour que la section "Pour mieux comprendre" affiche du contenu.
//  → gérable depuis l'admin : AdminActivitePage.jsx, onglet "🧭 Ce que tu vis".
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../core/supabaseClient'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');

.pbm-root { font-family:'Jost',sans-serif; color:#000; width:100%; }

.pbm-intro-text { font-size:18px; }

/* ── Filtres ── */
.pbm-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:24px; }
.pbm-filter  { padding:6px 16px; border-radius:20px; font-size:11.5px; font-weight:500; cursor:pointer;
              border:1px solid var(--surface-3); background:var(--surface-1);
              color:#000; font-family:'Jost',sans-serif; transition:all .18s ease; }
.pbm-filter:hover { transform:translateY(-1px); }

/* ── Grille ── */
.pbm-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:14px; }

/* ── Card ── */
.pbm-card { position:relative; border-radius:18px; padding:8px;
           border:1.5px solid color-mix(in srgb, var(--pbm-accent, var(--gold)) 45%, transparent);
           background:color-mix(in srgb, var(--pbm-accent, var(--gold)) 30%, var(--bg));
           transition:all .22s cubic-bezier(.22,1,.36,1); cursor:pointer; display:flex; }
.pbm-card:hover { transform:translateY(-3px);
           box-shadow:0 16px 32px -14px color-mix(in srgb, var(--pbm-accent, var(--gold)) 55%, transparent);
           border-color:color-mix(in srgb, var(--pbm-accent, var(--gold)) 70%, transparent); }
.pbm-card-content { flex:1; min-height:165px; border-radius:13px; background:rgba(255,255,255,.82);
           padding:17px 16px 15px; display:flex; flex-direction:column; gap:10px; }
.pbm-card-title { font-family:'Cormorant Garamond',serif; font-size:23px; font-weight:700;
                  color:#000; line-height:1.22; }
.pbm-card-accroche { font-size:16.5px; color:#000; line-height:1.5; font-style:italic; }
.pbm-card-symptomes { list-style:none; margin:0; padding:0; flex:1; display:flex; flex-direction:column; gap:7px; }
.pbm-card-symptomes li { font-size:14.5px; color:#000; line-height:1.55; padding-left:15px; position:relative; }
.pbm-card-symptomes li::before { content:'—'; position:absolute; left:0; top:0; color:var(--pbm-accent, var(--gold)); opacity:.9; font-weight:700; }

/* ── Empty ── */
.pbm-empty { text-align:center; padding:60px 20px; }
.pbm-empty-icon { font-size:40px; opacity:.3; margin-bottom:16px; }
.pbm-empty-text { font-size:13px; color:#000; font-style:italic; }

/* ── Modal ── */
.pbm-overlay { position:fixed; inset:0; z-index:400; display:flex; align-items:center;
              justify-content:center; background:rgba(20,12,5,0.55); backdrop-filter:blur(14px); padding:20px; }
.pbm-modal   { width:100%; max-width:720px; border-radius:22px; background:var(--bg);
              border:1px solid var(--surface-3); max-height:90vh; overflow-y:auto; overflow-x:hidden;
              animation:pbmSlideUp .38s cubic-bezier(.22,1,.36,1) both;
              box-shadow:0 32px 80px rgba(0,0,0,.30); }
@keyframes pbmSlideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }

.pbm-hero  { position:relative; padding:30px 26px 22px; }
.pbm-close { position:absolute; top:16px; right:16px; width:30px; height:30px; border-radius:50%;
             border:1px solid var(--surface-3); background:rgba(255,255,255,.65); color:var(--text3);
             font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; }

.pbm-section-head { display:flex; align-items:center; gap:11px; margin-bottom:12px; }
.pbm-section-icon { width:36px; height:36px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:16px; }
.pbm-section-label { font-size:14px; letter-spacing:.10em; text-transform:uppercase; font-weight:800; }
.pbm-section-meta  { font-size:14px; color:#000; margin-top:2px; font-weight:500; }

/* ── Cartes outils (audio + exercice) ── */
.pbm-tools { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin:0 24px 22px; }
.pbm-tool-card { padding:17px 17px; border-radius:16px; border-width:1.5px; border-style:solid;
                 display:flex; flex-direction:column; gap:10px; }
.pbm-tool-card audio { width:100%; }

/* ── Texte de coaching (sans carte) ── */
.pbm-coaching-block { margin:0 24px 28px; padding-left:16px; border-left:3px solid var(--pbm-accent, var(--gold)); }

.pbm-coaching-tabs { display:flex; gap:6px; margin-bottom:12px; }
.pbm-coaching-tab { padding:7px 15px; border-radius:20px; font-size:14px; font-weight:500; cursor:pointer;
                    border:1px solid var(--surface-3); background:transparent; color:#000; transition:all .15s ease; }

/* ── Verrou premium ── */
.pbm-locked { padding:18px; border-radius:14px; text-align:center;
              background:linear-gradient(160deg, rgba(232,192,96,.14), rgba(200,150,40,.05));
              border:1px solid rgba(232,192,96,.32); }
.pbm-locked-icon { width:36px; height:36px; border-radius:50%; margin:0 auto 10px; display:flex; align-items:center; justify-content:center;
                    font-size:16px; background:rgba(232,192,96,.20); border:1px solid rgba(232,192,96,.38); }
.pbm-locked-text { font-size:16px; color:#000; margin-bottom:12px; line-height:1.6; }
.pbm-locked-btn { padding:10px 26px; border-radius:100px; border:none; cursor:pointer;
                   background:linear-gradient(135deg,#d4b050,#a87c28); color:#fff; font-size:15px; font-weight:600;
                   font-family:'Jost',sans-serif; letter-spacing:.03em; box-shadow:0 8px 20px rgba(180,140,40,.30); transition:transform .15s ease; }
.pbm-locked-btn:hover { transform:translateY(-1px); }

/* ── Badge "bientôt disponible" ── */
.pbm-soon { padding:18px; border-radius:14px; text-align:center;
            background:linear-gradient(160deg, rgba(120,120,120,.12), rgba(90,90,90,.04));
            border:1px solid rgba(120,120,120,.25); }
.pbm-soon-icon { width:36px; height:36px; border-radius:50%; margin:0 auto 10px; display:flex; align-items:center; justify-content:center;
                 font-size:16px; background:rgba(120,120,120,.16); border:1px solid rgba(120,120,120,.3); }
.pbm-soon-text { font-size:15px; color:#000; font-style:italic; }

@media(max-width:640px) {
  .pbm-grid { grid-template-columns:1fr; gap:10px; }
  .pbm-hero { padding:26px 20px 18px; }
  .pbm-coaching-block { margin:0 16px 24px; }
  .pbm-intro-text { font-size:14px; }
}
@media(max-width:520px) {
  .pbm-tools { grid-template-columns:1fr; margin:0 16px 20px; }
}
`

// ── Catégories ────────────────────────────────────────────────────────────────
// Exportée pour être réutilisée par l'éditeur admin (AdminActivitePage.jsx) — source unique.
export const PROBLEMATIQUE_CATEGORIES = ['Émotions', 'Sommeil', 'Stress', 'Confiance', 'Relations']
const CATEGORIES = ['Tous', ...PROBLEMATIQUE_CATEGORIES]

// ── Couleur par catégorie (teinte des badges/cards) ──────────────────────────
export const CAT_COLOR = {
  'Émotions':  'var(--zone-flowers)',
  'Sommeil':   'var(--zone-roots)',
  'Stress':    'var(--zone-breath)',
  'Confiance': 'var(--zone-flowers)',
  'Relations': 'var(--zone-leaves)',
}

// ── Composant principal ──────────────────────────────────────────────────────
export function ScreenProblematiques({ track, isPremium = false, onUpgrade }) {
  const [cat, setCat] = useState('Tous')
  const [problematiques, setProblematiques] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setLoading(true)
    supabase.from('problematiques').select('*')
      .eq('statut', 'actif')
      .order('ordre', { ascending: true })
      .then(({ data, error }) => {
        setLoading(false)
        if (!error) setProblematiques(data ?? [])
      })
  }, [])

  const filtered = useMemo(() =>
    cat === 'Tous' ? problematiques : problematiques.filter(p => p.categorie === cat)
  , [problematiques, cat])

  function openCard(p) {
    setSelected(p)
    track?.('problematique_open', { problematique_id: p.id, titre: p.titre }, 'problematiques', 'engagement')
  }

  return (
    <div className="pbm-root" style={{ padding:'0 0 40px', overflowY:'auto', height:'100%' }}>
      <style>{css}</style>

      {/* ── En-tête ── */}
      <div style={{ padding:'24px 24px 0', marginBottom:22 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'var(--fs-emoji-lg, 30px)', fontWeight:300, lineHeight:1.15, marginBottom:8, color:'#000' }}>
          Trouve une réponse <em style={{ fontStyle:'italic', color:'#000' }}>à ce que tu vis</em> !
        </div>
        <div style={{ width:40, height:2, background:'linear-gradient(90deg,#5c7c96,transparent)', marginBottom:12 }} />
        <p className="pbm-intro-text" style={{ color:'#000', lineHeight:1.7 }}>
          Choisis ce qui te perturbe en ce moment — tu recevras une réponse immédiate : un audio guidé, un exercice express, et de quoi mieux comprendre ce que tu traverses.
        </p>
      </div>

      {/* ── Filtres ── */}
      <div style={{ padding:'0 24px' }}>
        <div className="pbm-filters">
          {CATEGORIES.map(c => {
            const color = c === 'Tous' ? '#5c7c96' : (CAT_COLOR[c] ?? 'var(--green)')
            const active = cat === c
            return (
              <button key={c} className="pbm-filter" onClick={() => setCat(c)}
                style={active ? { background:`color-mix(in srgb, ${color} 16%, transparent)`, borderColor:`color-mix(in srgb, ${color} 45%, transparent)`, color:'#000' } : undefined}>
                {c}
              </button>
            )
          })}
        </div>

        {/* ── Grille ── */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#000', fontSize:'var(--fs-h4, 13px)', fontStyle:'italic' }}>
            Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div className="pbm-empty">
            <div className="pbm-empty-icon">🧭</div>
            <div className="pbm-empty-text">Aucune fiche dans cette catégorie pour le moment.</div>
          </div>
        ) : (
          <div className="pbm-grid">
            {filtered.map(p => {
              const color = CAT_COLOR[p.categorie] ?? 'var(--green)'
              return (
                <div key={p.id} className="pbm-card" onClick={() => openCard(p)} style={{ '--pbm-accent': color }}>
                  <div className="pbm-card-content">
                    <div className="pbm-card-title">{p.titre}</div>
                    {p.accroche && <div className="pbm-card-accroche">{p.accroche}</div>}
                    <ul className="pbm-card-symptomes">
                      {(p.symptomes ?? []).filter(Boolean).slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modal détail / solution ── */}
      {selected && (
        <ProblematiqueModal problematique={selected} onClose={() => setSelected(null)} track={track} isPremium={isPremium} onUpgrade={onUpgrade} />
      )}
    </div>
  )
}

// ── Modal fiche solution ──────────────────────────────────────────────────────
const COACHING_FORMATS = [
  { id: 'texte', label: '📝 Texte', field: 'coaching_texte' },
  { id: 'video', label: '🎬 Vidéo', field: 'coaching_video_url' },
  { id: 'pdf',   label: '📄 PDF',   field: 'coaching_pdf_url' },
]

function LockedTool({ onUpgrade }) {
  return (
    <div className="pbm-locked">
      <div className="pbm-locked-icon">🔒</div>
      <div className="pbm-locked-text">Réservé aux membres Premium</div>
      <button className="pbm-locked-btn" onClick={onUpgrade}>Débloquer</button>
    </div>
  )
}

function SectionHead({ icon, color, label, meta }) {
  return (
    <div className="pbm-section-head">
      <div className="pbm-section-icon" style={{ background:`color-mix(in srgb, ${color} 90%, black)`, boxShadow:`0 4px 12px color-mix(in srgb, ${color} 45%, transparent)`, color:'#fff' }}>{icon}</div>
      <div>
        <div className="pbm-section-label" style={{ color: `color-mix(in srgb, ${color} 80%, black)` }}>{label}</div>
        {meta && <div className="pbm-section-meta">{meta}</div>}
      </div>
    </div>
  )
}

function ProblematiqueModal({ problematique: p, onClose, track, isPremium = false, onUpgrade }) {
  const availableFormats = COACHING_FORMATS.filter(f => p[f.field])
  const [coachingTab, setCoachingTab] = useState(
    availableFormats.find(f => f.id === p.coaching_type)?.id ?? availableFormats[0]?.id ?? 'texte'
  )
  const color = CAT_COLOR[p.categorie] ?? 'var(--green)'
  const audioLocked    = p.audio_is_premium    && !isPremium
  const exerciceLocked = p.exercice_is_premium && !isPremium
  const coachingLocked = p.coaching_is_premium && !isPremium
  const toolCardStyle = {
    background: `color-mix(in srgb, ${color} 15%, var(--bg))`,
    borderColor: `color-mix(in srgb, ${color} 38%, transparent)`,
    '--pbm-accent': color,
  }

  return (
    <div className="pbm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pbm-modal">

        {/* ── Hero ── */}
        <div className="pbm-hero" style={{ background:`linear-gradient(160deg, color-mix(in srgb, ${color} 30%, transparent) 0%, color-mix(in srgb, ${color} 6%, transparent) 65%, transparent 100%)` }}>
          <button className="pbm-close" onClick={onClose}>✕</button>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:60, height:60, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, background:`color-mix(in srgb, ${color} 40%, transparent)`, border:`2px solid color-mix(in srgb, ${color} 65%, transparent)`, boxShadow:`0 8px 20px color-mix(in srgb, ${color} 40%, transparent)` }}>{p.emoji}</div>
            <div>
              <div style={{ fontSize:13, letterSpacing:'.14em', textTransform:'uppercase', color:`color-mix(in srgb, ${color} 80%, black)`, fontWeight:800, marginBottom:4 }}>{p.categorie}</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:33, fontWeight:700, color:'#000', lineHeight:1.15 }}>{p.titre}</div>
            </div>
          </div>
          <p style={{ fontSize:17, color:'#000', lineHeight:1.8, marginTop:14 }}>{p.description}</p>
        </div>

        {/* ── Cartes outils : audio hypnose + exercice express ── */}
        <div className="pbm-tools">
          <div className="pbm-tool-card" style={toolCardStyle}>
            <SectionHead icon="🎧" color={color} label="Écoute immédiate" meta={`${p.audio_duree_min ?? '—'} min${p.audio_titre ? ' · ' + p.audio_titre : ''}`} />
            {!p.audio_url ? (
              <div className="pbm-soon">
                <div className="pbm-soon-icon">⏳</div>
                <div className="pbm-soon-text">Audio bientôt disponible</div>
              </div>
            ) : audioLocked ? (
              <LockedTool onUpgrade={onUpgrade} />
            ) : (
              <audio controls controlsList="nodownload" onContextMenu={e => e.preventDefault()} src={p.audio_url}
                onPlay={() => track?.('problematique_audio_play', { problematique_id: p.id }, 'problematiques', 'engagement')} />
            )}
          </div>

          <div className="pbm-tool-card" style={toolCardStyle}>
            <SectionHead icon="🧘" color={color} label="Exercice express" meta={`${p.exercice_duree_min ?? '—'} min${p.exercice_titre ? ' · ' + p.exercice_titre : ''}`} />
            {exerciceLocked ? (
              <LockedTool onUpgrade={onUpgrade} />
            ) : (
              <p style={{ fontSize:16, color:'#000', lineHeight:1.7, margin:0 }}>{p.exercice_texte}</p>
            )}
          </div>
        </div>

        {/* ── Texte de coaching : outil de compréhension (texte / vidéo / pdf), sans carte ── */}
        <div className="pbm-coaching-block" style={{ '--pbm-accent': color }}>
          <SectionHead icon="📖" color={color} label="Pour mieux comprendre" meta={p.coaching_titre} />
          {coachingLocked ? (
            <LockedTool onUpgrade={onUpgrade} />
          ) : (
            <>
              {availableFormats.length > 1 && (
                <div className="pbm-coaching-tabs">
                  {availableFormats.map(f => (
                    <button key={f.id} className="pbm-coaching-tab"
                      onClick={() => setCoachingTab(f.id)}
                      style={coachingTab === f.id ? { background:`color-mix(in srgb, ${color} 85%, black)`, color:'#fff', borderColor:'transparent' } : undefined}>
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
              {availableFormats.length === 0 ? (
                <div style={{ fontSize:16, color:'#000', fontStyle:'italic' }}>Contenu bientôt disponible.</div>
              ) : coachingTab === 'video' ? (
                <video controls controlsList="nodownload" onContextMenu={e => e.preventDefault()} src={p.coaching_video_url} style={{ width:'100%', borderRadius:10, background:'#000' }}
                  onPlay={() => track?.('problematique_coaching_play', { problematique_id: p.id, type: 'video' }, 'problematiques', 'engagement')} />
              ) : coachingTab === 'pdf' ? (
                <a href={p.coaching_pdf_url} target="_blank" rel="noreferrer"
                  onClick={() => track?.('problematique_coaching_play', { problematique_id: p.id, type: 'pdf' }, 'problematiques', 'engagement')}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', borderRadius:10, background:`color-mix(in srgb, ${color} 10%, transparent)`, border:`1px solid color-mix(in srgb, ${color} 30%, transparent)`, color:'#000', fontSize:16.5, fontWeight:500, textDecoration:'none' }}>
                  📄 Ouvrir le PDF
                </a>
              ) : (
                <p style={{ fontSize:16.5, color:'#000', lineHeight:1.85, margin:0 }}>{p.coaching_texte}</p>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}
