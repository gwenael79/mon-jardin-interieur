// ─────────────────────────────────────────────────────────────────────────────
//  AdminFondateursPage.jsx — Gestion des Fondateurs du Cercle
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../core/supabaseClient'
import { AdminNav } from './AdminPage'
import { useAuth } from '../hooks/useAuth'

const LEVEL_LABEL = { ami:'Ami du Jardin', compagnon:'Compagnon de route', fondateur:'Fondateur' }
const LEVEL_COLOR = { ami:'#7ea870', compagnon:'#4a9a60', fondateur:'#2D7F4F' }
const LEVEL_ICON  = { ami:'🌱', compagnon:'🌿', fondateur:'🌳' }

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function fmt(n) { return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', minimumFractionDigits:0 }).format(n) }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—' }

// ─────────────────────────────────────────────────────────────────────────────
//  BADGE NIVEAU
// ─────────────────────────────────────────────────────────────────────────────
function NiveauBadge({ niveau }) {
  const c = LEVEL_COLOR[niveau] ?? '#7ea870'
  return (
    <span style={{ padding:'2px 10px', borderRadius:100, background:`${c}22`, border:`1px solid ${c}55`, color:c, fontSize:11, fontWeight:600, letterSpacing:'.05em', whiteSpace:'nowrap' }}>
      {LEVEL_ICON[niveau]} {LEVEL_LABEL[niveau]}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODAL ÉDITION
// ─────────────────────────────────────────────────────────────────────────────
function EditModal({ fondateur, onClose, onSaved }) {
  const [form, setForm] = useState({
    display_name:    fondateur.display_name ?? '',
    citation:        fondateur.citation ?? '',
    niveau:          fondateur.niveau ?? 'ami',
    montant:         fondateur.montant ?? 0,
    affichage_public: fondateur.affichage_public ?? true,
    message_prive:   fondateur.message_prive ?? '',
    fleur_variant:   fondateur.fleur_variant ?? 1,
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await supabase.from('fondateurs').update({
      display_name:    form.display_name,
      citation:        form.citation || null,
      niveau:          form.niveau,
      montant:         Number(form.montant),
      affichage_public: form.affichage_public,
      message_prive:   form.message_prive || null,
      fleur_variant:   Number(form.fleur_variant),
    }).eq('id', fondateur.id)
    setSaving(false)
    onSaved()
    onClose()
  }

  const inp = { background:'#454b52', border:'1px solid rgba(255,255,255,.15)', borderRadius:8, padding:'8px 12px', color:'#fff', fontFamily:"'Jost',sans-serif", fontSize:14, width:'100%', boxSizing:'border-box', outline:'none' }
  const lbl = { fontSize:11, letterSpacing:'.08em', textTransform:'uppercase', color:'rgba(255,255,255,.45)', display:'block', marginBottom:5 }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(0,0,0,.65)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'#353a3f', borderRadius:20, width:'min(520px,100%)', padding:'32px 28px', boxShadow:'0 20px 60px rgba(0,0,0,.5)', border:'1px solid rgba(255,255,255,.10)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:300, marginBottom:22 }}>
          Modifier le fondateur
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={lbl}>Nom affiché</label>
            <input style={inp} value={form.display_name} onChange={e => setForm(p=>({...p,display_name:e.target.value}))}/>
          </div>
          <div>
            <label style={lbl}>Citation (80 car. max)</label>
            <input style={inp} value={form.citation} maxLength={80} onChange={e => setForm(p=>({...p,citation:e.target.value}))}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <div>
              <label style={lbl}>Niveau</label>
              <select style={inp} value={form.niveau} onChange={e => setForm(p=>({...p,niveau:e.target.value}))}>
                <option value="ami">Ami du Jardin</option>
                <option value="compagnon">Compagnon</option>
                <option value="fondateur">Fondateur</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Montant (€)</label>
              <input style={inp} type="number" value={form.montant} onChange={e => setForm(p=>({...p,montant:e.target.value}))}/>
            </div>
            <div>
              <label style={lbl}>Variante fleur (1-12)</label>
              <input style={inp} type="number" min={1} max={12} value={form.fleur_variant} onChange={e => setForm(p=>({...p,fleur_variant:e.target.value}))}/>
            </div>
          </div>
          <div>
            <label style={lbl}>Message privé (non visible)</label>
            <textarea style={{...inp, resize:'vertical', minHeight:60}} value={form.message_prive} onChange={e => setForm(p=>({...p,message_prive:e.target.value}))}/>
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
            <input type="checkbox" checked={form.affichage_public} onChange={e => setForm(p=>({...p,affichage_public:e.target.checked}))}/>
            <span style={{ fontSize:13, color:'rgba(255,255,255,.75)' }}>Visible publiquement dans le Cercle</span>
          </label>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
          <button className="adm-btn ghost" onClick={onClose}>Annuler</button>
          <button className="adm-btn success" onClick={save} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  CARTE FONDATEUR ADMIN
// ─────────────────────────────────────────────────────────────────────────────
function FondateurCard({ f, onEdit, onToggle, onDelete }) {
  const c = LEVEL_COLOR[f.niveau] ?? '#7ea870'

  return (
    <div style={{ background:'#3d4248', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, overflow:'hidden', display:'flex', flexDirection:'column' }}>

      {/* Barre colorée top */}
      <div style={{ height:3, background:`linear-gradient(90deg, ${c}, ${c}88)` }}/>

      <div style={{ padding:'18px 20px', display:'flex', gap:16, alignItems:'flex-start' }}>

        {/* Fleur / image */}
        <div style={{ width:80, height:80, borderRadius:12, overflow:'hidden', flexShrink:0, background:'#454b52', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {f.fleur_image
            ? <img src={f.fleur_image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : <span style={{ fontSize:32, opacity:.5 }}>🌸</span>
          }
        </div>

        {/* Infos */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, color:'#fff' }}>
              {f.display_name}
            </span>
            <NiveauBadge niveau={f.niveau}/>
            {!f.affichage_public && (
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:'rgba(210,120,50,.15)', border:'1px solid rgba(210,120,50,.35)', color:'rgba(210,180,120,.80)' }}>
                masqué
              </span>
            )}
          </div>

          {f.citation && (
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:14, color:'rgba(255,255,255,.55)', marginBottom:6, lineHeight:1.5 }}>
              "{f.citation}"
            </div>
          )}

          <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:12, color:'rgba(255,255,255,.45)' }}>
            {f.email && <span>✉ {f.email}</span>}
            {f.telephone && <span>📞 {f.telephone}</span>}
            <span>📅 {fmtDate(f.date_contribution)}</span>
            {f.paiement_ref && <span style={{ fontFamily:'monospace', fontSize:11, background:'rgba(255,255,255,.06)', padding:'1px 6px', borderRadius:4 }}>#{f.paiement_ref.slice(-8)}</span>}
          </div>
        </div>

        {/* Montant */}
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, color:c, lineHeight:1 }}>
            {fmt(f.montant)}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.30)', marginTop:2 }}>{f.devise ?? 'EUR'}</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'10px 20px', display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button className="adm-btn ghost" onClick={() => onToggle(f)} style={{ fontSize:11 }}>
          {f.affichage_public ? '👁 Masquer' : '👁 Afficher'}
        </button>
        <button className="adm-btn ghost" onClick={() => onEdit(f)} style={{ fontSize:11 }}>✏️ Modifier</button>
        <button className="adm-btn danger" onClick={() => onDelete(f)} style={{ fontSize:11 }}>🗑 Supprimer</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────
export function AdminFondateursPage() {
  const { signOut } = useAuth()
  const [fondateurs, setFondateurs] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [toast,      setToast]      = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [filter,     setFilter]     = useState('tous') // tous | ami | compagnon | fondateur
  const [search,     setSearch]     = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3200) }

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('fondateurs')
      .select('*')
      .order('date_contribution', { ascending: false })
    setFondateurs(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Polling : nouvelle donation détectée ──
  useEffect(() => {
    const channel = supabase
      .channel('fondateurs-admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fondateurs' }, (payload) => {
        setFondateurs(prev => [payload.new, ...prev])
        showToast(`🌸 Nouveau fondateur : ${payload.new.display_name} · ${fmt(payload.new.montant)}`)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const handleToggle = async (f) => {
    await supabase.from('fondateurs').update({ affichage_public: !f.affichage_public }).eq('id', f.id)
    setFondateurs(prev => prev.map(x => x.id === f.id ? { ...x, affichage_public: !x.affichage_public } : x))
    showToast(f.affichage_public ? 'Fondateur masqué' : 'Fondateur visible')
  }

  const handleDelete = async (f) => {
    if (!confirm(`Supprimer ${f.display_name} ? Cette action est irréversible.`)) return
    await supabase.from('fondateurs').delete().eq('id', f.id)
    setFondateurs(prev => prev.filter(x => x.id !== f.id))
    showToast('Fondateur supprimé')
  }

  // ── Stats ──
  const total     = fondateurs.reduce((s, f) => s + Number(f.montant), 0)
  const byNiveau  = { ami: 0, compagnon: 0, fondateur: 0 }
  fondateurs.forEach(f => { if (byNiveau[f.niveau] !== undefined) byNiveau[f.niveau]++ })

  // ── Filtre + recherche ──
  const visible = fondateurs
    .filter(f => filter === 'tous' || f.niveau === filter)
    .filter(f => !search || f.display_name?.toLowerCase().includes(search.toLowerCase()) || f.email?.toLowerCase().includes(search.toLowerCase()))

  const inp = { background:'#454b52', border:'1px solid rgba(255,255,255,.15)', borderRadius:8, padding:'8px 14px', color:'#fff', fontFamily:"'Jost',sans-serif", fontSize:13, outline:'none' }

  return (
    <div className="adm-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--bg:#2b2f33;--bg2:#353a3f;--bg3:#3e444a;--border:rgba(255,255,255,0.18);--border2:rgba(255,255,255,0.10);--text:#ffffff;--text2:rgba(255,255,255,0.85);--text3:rgba(255,255,255,0.50);--green:#96d485;--green2:rgba(150,212,133,0.25);--green3:rgba(150,212,133,0.12);--greenT:rgba(150,212,133,0.50);--gold:#e8d4a8;--red:rgba(210,80,80,0.85);--red2:rgba(210,80,80,0.12);--redT:rgba(210,80,80,0.35)}
        .adm-root{font-family:'Jost',sans-serif;background:#2b2f33;min-height:100vh;width:100vw;color:#fff;display:flex;flex-direction:column}
        .adm-topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 40px;border-bottom:1px solid rgba(255,255,255,.10);background:#353a3f;position:sticky;top:0;z-index:10}
        .adm-btn{padding:7px 16px;border-radius:8px;font-size:12px;letter-spacing:.06em;cursor:pointer;border:none;font-family:'Jost',sans-serif;transition:all .2s;white-space:nowrap;color:#fff}
        .adm-btn.ghost{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15)}
        .adm-btn.ghost:hover{background:rgba(255,255,255,.14)}
        .adm-btn.success{background:rgba(150,212,133,.15);border:1px solid rgba(150,212,133,.40);color:#c8f0b8}
        .adm-btn.success:hover{background:rgba(150,212,133,.25)}
        .adm-btn.danger{background:rgba(210,80,80,.10);border:1px solid rgba(210,80,80,.30);color:rgba(255,160,160,.85)}
        .adm-btn.danger:hover{background:rgba(210,80,80,.20)}
        .adm-toast{position:fixed;bottom:24px;right:24px;background:#3e444a;border:1px solid rgba(150,212,133,.50);border-radius:10px;padding:12px 20px;font-size:14px;color:#fff;z-index:9999;animation:fadeInUp .3s ease;max-width:380px}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Topbar */}
      <div className="adm-topbar">
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:300, color:'#fff' }}>
          Mon <em style={{ fontStyle:'italic', color:'#96d485' }}>Jardin</em>
          <span style={{ fontFamily:'Jost', fontSize:12, color:'rgba(255,255,255,.40)', letterSpacing:'.2em', marginLeft:8 }}>ADMIN</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <AdminNav current="#fondateurs"/>
          <button className="adm-btn ghost" onClick={() => { signOut(); window.location.href = '/' }}>Déconnexion</button>
        </div>
      </div>

      <div style={{ flex:1, padding:'32px 40px', maxWidth:1100, width:'100%', margin:'0 auto' }}>

        {/* Titre */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:300, color:'#fff', marginBottom:4 }}>
            Le Cercle des Fondateurs
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.40)' }}>
            Gestion des contributeurs · mises à jour en temps réel
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:28 }}>
          {[
            { label:'Total collecté', val:fmt(total), color:'#c8f0b8' },
            { label:'Fondateurs', val:fondateurs.length, color:'#fff' },
            { label:'🌱 Amis', val:byNiveau.ami, color:LEVEL_COLOR.ami },
            { label:'🌿 Compagnons', val:byNiveau.compagnon, color:LEVEL_COLOR.compagnon },
            { label:'🌳 Fondateurs', val:byNiveau.fondateur, color:LEVEL_COLOR.fondateur },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background:'#3d4248', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, fontWeight:300, color, lineHeight:1, marginBottom:4 }}>{val}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.40)', letterSpacing:'.08em', textTransform:'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20, alignItems:'center' }}>
          {['tous','ami','compagnon','fondateur'].map(n => (
            <button key={n} className="adm-btn ghost" onClick={() => setFilter(n)}
              style={{ background: filter===n ? 'rgba(150,212,133,.18)' : undefined, borderColor: filter===n ? 'rgba(150,212,133,.50)' : undefined, color: filter===n ? '#c8f0b8' : undefined }}>
              {n === 'tous' ? 'Tous' : `${LEVEL_ICON[n]} ${LEVEL_LABEL[n]}`}
            </button>
          ))}
          <input
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inp, marginLeft:'auto', width:200 }}
          />
        </div>

        {/* Liste */}
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'rgba(255,255,255,.35)', fontSize:14 }}>Chargement…</div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, color:'rgba(255,255,255,.35)', fontSize:14, fontStyle:'italic', fontFamily:"'Cormorant Garamond',serif" }}>
            Aucun fondateur {filter !== 'tous' ? `de niveau ${LEVEL_LABEL[filter]}` : ''} pour le moment.
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(440px, 1fr))', gap:14 }}>
            {visible.map(f => (
              <FondateurCard
                key={f.id}
                f={f}
                onEdit={() => setEditTarget(f)}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {editTarget && (
        <EditModal
          fondateur={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { load(); showToast('Fondateur mis à jour') }}
        />
      )}

      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  )
}
