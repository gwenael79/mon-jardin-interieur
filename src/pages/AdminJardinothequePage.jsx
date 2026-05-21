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
.adm-topbar{display:flex;flex-direction:column;border-bottom:1px solid var(--border2);background:#353a3f!important;backdrop-filter:blur(10px);position:sticky;top:0;z-index:10}
.adm-topbar-row1{display:flex;align-items:center;justify-content:space-between;padding:12px 40px;gap:8px}
.adm-topbar-nav{padding:0 40px 10px;overflow:hidden}
.adm-logo{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:300;letter-spacing:.05em;color:#ffffff}
.adm-logo em{font-style:italic;color:var(--green)}
.adm-body{flex:1;padding:32px 40px;width:100%}
.adm-section{margin-bottom:32px}
.adm-empty{font-size:18px;color:rgba(255,255,255,0.55);font-style:italic;padding:28px;text-align:center;background:#3d4248;border-radius:12px;border:1px dashed var(--border2)}
.adm-tabs{display:flex;gap:0;margin-bottom:24px;border-bottom:1px solid var(--border2)}
.adm-tab{padding:10px 24px;font-size:18px;letter-spacing:.08em;color:rgba(255,255,255,0.55);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .2s}
.adm-tab.active{color:#c8f0b8;border-bottom-color:var(--green)}
.adm-btn{padding:7px 16px;border-radius:8px;font-size:18px;letter-spacing:.06em;cursor:pointer;border:none;font-family:'Jost',sans-serif;transition:all .2s;white-space:nowrap}
.adm-btn.ghost{background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.20);color:#ffffff}
.adm-toast{position:fixed;bottom:24px;right:24px;background:#3e444a!important;border:1px solid var(--greenT);border-radius:10px;padding:10px 20px;font-size:18px;color:#ffffff;z-index:999;animation:fadeInUp .3s ease}
@keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes accordionOpen{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.prd-item{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:10px}
.prd-item-row1{display:flex;align-items:center;gap:12px;flex:1;min-width:0}
.prd-item-main{flex:1;min-width:0}
.prd-item-title{font-size:13px;color:rgba(242,237,224,0.88);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.prd-item-meta{display:flex;gap:8px;margin-top:3px;align-items:center;flex-wrap:wrap}
.prd-item-actions{display:flex;gap:4px;flex-shrink:0;align-items:center}
@media(max-width:700px){
  .adm-topbar-row1{padding:10px 12px}
  .adm-topbar-nav{padding:4px 12px 8px;border-top:1px solid rgba(255,255,255,0.06)}
  .adm-body{padding:10px 10px}
  .adm-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap;scrollbar-width:none}
  .adm-tabs::-webkit-scrollbar{display:none}
  .adm-tab{padding:8px 14px;white-space:nowrap;flex-shrink:0}
  .adm-btn{padding:5px 10px;font-size:11px!important}
  .prd-item{flex-direction:column;align-items:stretch;gap:7px;padding:10px 12px}
  .prd-item-row1{gap:8px}
  .prd-item-actions{flex-wrap:wrap;gap:5px;justify-content:flex-start}
}
`

// ═══════════════════════════════════════════════════════════
//  TabDigital — liste des produits digitaux par date de création
// ═══════════════════════════════════════════════════════════
const CAT_DIGITAL = ['Audio', 'Formation', 'E-book']
const EMPTY_FORM = {
  type: 'digital', categorie: 'Audio', titre: '', description: '',
  prix: '', image_url: '', lien_externe: '', stripe_price_id: '',
  statut: 'actif', ordre: 0, storage_path: '',
  accepte_lumens: false, prix_lumens: '',
}

function TabDigital({ showToast }) {
  const [produits,        setProduits]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [form,            setForm]            = useState(EMPTY_FORM)
  const [editId,          setEditId]          = useState(null)
  const [showForm,        setShowForm]        = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [audioUploading,  setAudioUploading]  = useState(false)
  const [attribuerProduit,setAttribuerProduit]= useState(null)
  const [users,           setUsers]           = useState([])
  const [usersLoaded,     setUsersLoaded]     = useState(false)
  const [attribuant,      setAttribuant]      = useState(false)

  const inp = { padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: '#f2ede0', fontSize: 13, fontFamily: "'Jost',sans-serif", outline: 'none', width: '100%', boxSizing: 'border-box' }
  const lbl = { fontSize: 10, color: 'rgba(242,237,224,0.45)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6, display: 'block' }

  const load = () => {
    setLoading(true)
    supabase.from('produits').select('*').eq('type', 'digital')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setProduits(data || []); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const openNew  = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
  const openEdit = (p) => {
    setForm({
      type: 'digital', categorie: p.categorie || 'Audio', titre: p.titre || '',
      description: p.description || '', prix: p.prix ?? '', image_url: p.image_url || '',
      lien_externe: p.lien_externe || '', stripe_price_id: p.stripe_price_id || '',
      statut: p.statut || 'actif', ordre: p.ordre || 0, storage_path: p.storage_path || '',
      accepte_lumens: p.accepte_lumens || false, prix_lumens: p.prix_lumens ?? '',
    })
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
    const { error } = await supabase.from('achats').upsert(
      { user_id: userId, produit_id: attribuerProduit.id, statut: 'offert', montant: 0 },
      { onConflict: 'user_id,produit_id' }
    )
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

  const STRIPE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '') + '/functions/v1/stripe-product'

  const handleSave = async () => {
    if (!form.titre.trim()) { showToast('✗ Titre obligatoire'); return }
    setSaving(true)
    const payload = { ...form, prix: form.prix !== '' ? parseFloat(form.prix) : null, ordre: parseInt(form.ordre) || 0, updated_at: new Date().toISOString() }
    let savedId = editId
    if (editId) {
      const { error } = await supabase.from('produits').update(payload).eq('id', editId)
      if (error) { setSaving(false); showToast('✗ ' + error.message); return }
    } else {
      const { data, error } = await supabase.from('produits').insert({ ...payload, created_at: new Date().toISOString() }).select('id').single()
      if (error) { setSaving(false); showToast('✗ ' + error.message); return }
      savedId = data.id
    }
    if (form.prix && !form.stripe_price_id && savedId) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          const res  = await fetch(STRIPE_URL, { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ produit_id: savedId, titre: form.titre, description: form.description, prix: form.prix, image_url: form.image_url }) })
          const data = await res.json()
          if (res.ok && data.price_id) await supabase.from('produits').update({ stripe_price_id: data.price_id }).eq('id', savedId)
        }
      } catch (e) { console.warn('[stripe]', e) }
    }
    showToast(editId ? '✓ Produit mis à jour' : '✓ Produit ajouté')
    setSaving(false); setShowForm(false); load()
  }

  const handleDelete = async (id, titre) => {
    if (!window.confirm(`Supprimer "${titre}" ?`)) return
    const { error } = await supabase.from('produits').delete().eq('id', id)
    if (error) { showToast('✗ ' + error.message); return }
    showToast('✓ Supprimé'); load()
  }

  const toggleStatut = async (p) => {
    await supabase.from('produits').update({ statut: p.statut === 'actif' ? 'inactif' : 'actif' }).eq('id', p.id); load()
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
          {produits.length} produit{produits.length !== 1 ? 's' : ''} · classés par date de création
        </div>
        <button onClick={openNew} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(180,160,240,0.12)', border: '1px solid rgba(180,160,240,0.35)', color: '#b4a0f0', fontWeight: 500 }}>+ Ajouter</button>
      </div>

      {/* Product list */}
      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Chargement…</div>
      ) : produits.length === 0 ? (
        <div className="adm-empty">Aucun produit digital — cliquez sur "+ Ajouter"</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {produits.map(p => (
            <div key={p.id} className="prd-item" style={{
              border: `1px solid ${p.statut === 'actif' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)'}`,
              background: p.statut === 'actif' ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.01)',
              opacity: p.statut === 'actif' ? 1 : 0.5,
            }}>
              {/* Ligne info : point + titre + badge statut */}
              <div className="prd-item-row1">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#b4a0f0', flexShrink: 0 }} />
                <div className="prd-item-main">
                  <div className="prd-item-title">{p.titre}</div>
                  <div className="prd-item-meta">
                    <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 10, background: 'rgba(180,160,240,0.12)', border: '1px solid rgba(180,160,240,0.20)', color: '#b4a0f0' }}>{p.categorie}</span>
                    {p.prix != null && <span style={{ fontSize: 10, color: 'rgba(242,237,224,0.50)' }}>{Number(p.prix).toFixed(2)} €</span>}
                    {p.storage_path && <span style={{ fontSize: 9, color: 'rgba(130,200,160,0.70)' }}>🎧 audio</span>}
                    {p.stripe_price_id && <span style={{ fontSize: 9, color: 'rgba(150,212,133,0.55)' }}>⚡ Stripe</span>}
                    <span style={{ fontSize: 9, color: 'rgba(242,237,224,0.22)' }}>{fmtDate(p.created_at)}</span>
                  </div>
                </div>
                <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, flexShrink: 0, background: p.statut === 'actif' ? 'rgba(150,212,133,0.10)' : 'rgba(255,255,255,0.05)', border: p.statut === 'actif' ? '1px solid rgba(150,212,133,0.25)' : '1px solid rgba(255,255,255,0.07)', color: p.statut === 'actif' ? '#96d485' : 'rgba(242,237,224,0.30)' }}>{p.statut}</span>
              </div>
              {/* Ligne actions */}
              <div className="prd-item-actions">
                <button onClick={() => toggleStatut(p)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(242,237,224,0.45)' }}>{p.statut === 'actif' ? 'Désactiver' : 'Activer'}</button>
                {p.storage_path && <button onClick={() => { setAttribuerProduit(p); loadUsers() }} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(180,160,240,0.10)', border: '1px solid rgba(180,160,240,0.30)', color: '#b4a0f0' }}>🎁 Attribuer</button>}
                <button onClick={() => openEdit(p)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(180,160,240,0.10)', border: '1px solid rgba(180,160,240,0.35)', color: '#b4a0f0' }}>✏ Modifier</button>
                <button onClick={() => handleDelete(p.id, p.titre)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(210,80,80,0.08)', border: '1px solid rgba(210,80,80,0.25)', color: 'rgba(255,140,140,0.7)' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal attribution */}
      {attribuerProduit && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', padding: 20 }} onClick={() => setAttribuerProduit(null)}>
          <div style={{ width: '100%', maxWidth: 480, borderRadius: 18, background: '#12201a', border: '1px solid rgba(255,255,255,0.09)', padding: '24px 28px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 300, color: 'rgba(242,237,224,0.88)' }}>Attribuer l'accès</div>
              <button onClick={() => setAttribuerProduit(null)} style={{ background: 'none', border: 'none', color: 'rgba(242,237,224,0.35)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(180,160,240,0.70)', marginBottom: 16, padding: '8px 12px', background: 'rgba(180,160,240,0.06)', border: '1px solid rgba(180,160,240,0.20)', borderRadius: 8 }}>🎧 {attribuerProduit.titre}</div>
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
          <div style={{ width: '100%', maxWidth: 640, borderRadius: '22px 22px 0 0', background: '#1a2820', border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none', padding: '24px 28px 48px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 300, color: 'rgba(242,237,224,0.88)' }}>{editId ? 'Modifier le produit' : 'Nouveau produit digital'}</div>
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
                  <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} style={inp}>
                    {CAT_DIGITAL.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div><span style={lbl}>Titre *</span><input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="Nom du produit" style={inp} /></div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={lbl}>Description</span>
                  <span style={{ fontSize: 10, color: form.description.length > 320 ? '#e87060' : 'rgba(242,237,224,0.22)' }}>{form.description.length} / 350</span>
                </div>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value.slice(0, 350) }))} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.8 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><span style={lbl}>Prix (€)</span><input type="number" min="0" step="0.01" value={form.prix} onChange={e => setForm(f => ({ ...f, prix: e.target.value }))} placeholder="0.00" style={inp} /></div>
                <div><span style={lbl}>Ordre d'affichage</span><input type="number" min="0" value={form.ordre} onChange={e => setForm(f => ({ ...f, ordre: e.target.value }))} style={inp} /></div>
              </div>
              <div><span style={lbl}>URL de l'image</span><input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." style={inp} /></div>
              <div>
                <span style={lbl}>Fichier audio</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px dashed rgba(180,160,240,0.35)', background: 'rgba(180,160,240,0.06)', color: form.storage_path ? '#b4a0f0' : 'rgba(242,237,224,0.40)', fontSize: 12, cursor: 'pointer', fontFamily: "'Jost',sans-serif", textAlign: 'center', display: 'block' }}>
                    <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => handleAudioUpload(e.target.files[0])} />
                    {audioUploading ? '⏳ Upload en cours…' : form.storage_path ? `✓ ${form.storage_path}` : '📁 Choisir un fichier audio'}
                  </label>
                  {form.storage_path && <button onClick={() => setForm(f => ({ ...f, storage_path: '' }))} style={{ padding: '6px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer', background: 'rgba(210,80,80,0.08)', border: '1px solid rgba(210,80,80,0.25)', color: 'rgba(255,140,140,0.7)', fontFamily: "'Jost',sans-serif" }}>✕</button>}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(242,237,224,0.30)', marginTop: 5 }}>MP3, WAV, AAC — max 500 MB</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><span style={lbl}>Lien externe</span><input value={form.lien_externe} onChange={e => setForm(f => ({ ...f, lien_externe: e.target.value }))} placeholder="https://..." style={inp} /></div>
                <div>
                  <span style={lbl}>Stripe Price ID</span>
                  <input value={form.stripe_price_id} onChange={e => setForm(f => ({ ...f, stripe_price_id: e.target.value }))} placeholder="price_..." style={{ ...inp, color: form.stripe_price_id ? '#96d485' : undefined }} />
                </div>
              </div>
              <div>
                <span style={lbl}>Statut</span>
                <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} style={{ ...inp, maxWidth: 220 }}>
                  <option value="actif">Actif — visible</option>
                  <option value="inactif">Inactif — masqué</option>
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
                  <div><span style={lbl}>Prix en Lumens ✦</span><input type="number" min="1" value={form.prix_lumens} onChange={e => setForm(f => ({ ...f, prix_lumens: e.target.value }))} placeholder="Ex: 50" style={{ ...inp, maxWidth: 160 }} /></div>
                )}
              </div>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: 13, borderRadius: 10, border: '1px solid rgba(180,160,240,0.40)', background: 'rgba(180,160,240,0.15)', color: '#b4a0f0', fontSize: 13, fontWeight: 500, cursor: saving ? 'wait' : 'pointer', fontFamily: "'Jost',sans-serif", letterSpacing: '.06em', opacity: saving ? 0.6 : 1, marginTop: 4 }}>
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
//  TabPartenaires — liste des partenaires + ventes en accordéon
// ═══════════════════════════════════════════════════════════
function TabPartenaires({ showToast }) {
  const [partenaires, setPartenaires] = useState([])
  const [produits,    setProduits]    = useState([])
  const [ventes,      setVentes]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [expandedId,  setExpandedId]  = useState(null)
  const [mois, setMois] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const load = () => {
    setLoading(true)
    Promise.all([
      supabase.from('partenaires').select('*').order('nom_boutique'),
      supabase.from('produits').select('partenaire_id, statut').not('partenaire_id', 'is', null),
      supabase.from('ventes_partenaires').select('*, produits(titre)').eq('mois_facturation', mois).order('created_at', { ascending: false }),
    ]).then(([pRes, prRes, vRes]) => {
      setPartenaires(pRes.data || [])
      setProduits(prRes.data || [])
      setVentes(vRes.data || [])
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [mois])

  const fmt = (n) => `${Number(n || 0).toFixed(2).replace('.', ',')} €`

  const nbProduitsActifs = (id) => produits.filter(p => p.partenaire_id === id && p.statut === 'actif').length
  const ventesPartenaire = (id) => ventes.filter(v => v.partenaire_id === id)
  const caPartenaire    = (id) => ventesPartenaire(id).reduce((s, v) => s + Number(v.montant_brut || 0), 0)

  const marquerReverses = async (partenaireId) => {
    const ids = ventesPartenaire(partenaireId).filter(v => v.statut === 'en_attente').map(v => v.id)
    if (!ids.length) return
    const { error } = await supabase.from('ventes_partenaires').update({ statut: 'reverse', reverse_le: new Date().toISOString() }).in('id', ids)
    if (error) { showToast('✗ ' + error.message); return }
    showToast('✓ Reversement marqué'); load()
  }

  const inp = { padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#f2ede0', fontSize: 12, fontFamily: "'Jost',sans-serif", outline: 'none' }

  if (loading) return <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Chargement…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header with month selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
          {partenaires.length} partenaire{partenaires.length !== 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.06em' }}>Période</span>
          <input type="month" value={mois} onChange={e => setMois(e.target.value)} style={inp} />
        </div>
      </div>

      {/* Partners list */}
      {partenaires.length === 0 ? (
        <div className="adm-empty">Aucun partenaire enregistré</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {partenaires.map(p => {
            const nb     = nbProduitsActifs(p.id)
            const ca     = caPartenaire(p.id)
            const lignes = ventesPartenaire(p.id)
            const open   = expandedId === p.id
            const aReverser = lignes.some(v => v.statut === 'en_attente')

            return (
              <div key={p.id} style={{ borderRadius: 12, border: `1px solid ${open ? 'rgba(150,212,133,0.20)' : 'rgba(255,255,255,0.06)'}`, background: open ? 'rgba(150,212,133,0.04)' : 'rgba(255,255,255,0.02)', overflow: 'hidden', transition: 'border-color .2s' }}>

                {/* Main accordion row */}
                <div
                  onClick={() => setExpandedId(open ? null : p.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}
                >
                  {/* Statut dot */}
                  <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: p.statut === 'actif' ? '#96d485' : p.statut === 'en_attente' ? '#e8c060' : 'rgba(255,140,140,0.6)' }} />

                  {/* Nom + type */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: 'rgba(242,237,224,0.90)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.nom_boutique}
                      <span style={{ marginLeft: 8, fontSize: 9, padding: '1px 6px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: 'rgba(242,237,224,0.35)', fontWeight: 400 }}>
                        {p.type_vendeur === 'professionnel' ? '🏪 Pro' : '🌱 Particulier'}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(242,237,224,0.35)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.email}{p.code_vendeur ? ` · ${p.code_vendeur}` : ''}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 300, color: nb > 0 ? '#b4a0f0' : 'rgba(242,237,224,0.25)', lineHeight: 1 }}>{nb}</div>
                      <div style={{ fontSize: 9, color: 'rgba(242,237,224,0.30)', letterSpacing: '.06em', textTransform: 'uppercase', marginTop: 2 }}>produits</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 300, color: ca > 0 ? '#96d485' : 'rgba(242,237,224,0.25)', lineHeight: 1 }}>{fmt(ca)}</div>
                      <div style={{ fontSize: 9, color: 'rgba(242,237,224,0.30)', letterSpacing: '.06em', textTransform: 'uppercase', marginTop: 2 }}>CA {mois}</div>
                    </div>
                    {aReverser && (
                      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, background: 'rgba(232,192,96,0.12)', border: '1px solid rgba(232,192,96,0.30)', color: '#e8c060' }}>⏳ à reverser</span>
                    )}
                    <div style={{ fontSize: 12, color: 'rgba(242,237,224,0.30)', marginLeft: 4 }}>{open ? '▲' : '▼'}</div>
                  </div>
                </div>

                {/* Accordion content */}
                {open && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 18px 16px', animation: 'accordionOpen .18s ease both' }}>
                    {lignes.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>Aucune vente sur cette période</div>
                    ) : (
                      <>
                        {/* Sales lines header */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px', gap: 8, padding: '0 8px 8px', marginBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {['Produit', 'Brut', 'Commission', 'Net', 'Statut'].map(h => (
                            <div key={h} style={{ fontSize: 9, color: 'rgba(242,237,224,0.28)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{h}</div>
                          ))}
                        </div>
                        {/* Sales lines */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {lignes.map(v => (
                            <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px', gap: 8, padding: '7px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.02)', alignItems: 'center' }}>
                              <div style={{ fontSize: 12, color: 'rgba(242,237,224,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {v.produits?.titre || 'Produit supprimé'}
                                {v.source === 'atelier' && <span style={{ marginLeft: 6, fontSize: 9, color: '#82c8f0' }}>📖</span>}
                              </div>
                              <div style={{ fontSize: 11, color: 'rgba(242,237,224,0.55)' }}>{fmt(v.montant_brut)}</div>
                              <div style={{ fontSize: 11, color: '#e8c060' }}>−{fmt(v.commission)}</div>
                              <div style={{ fontSize: 11, color: '#96d485', fontWeight: 500 }}>{fmt(v.montant_net)}</div>
                              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: v.statut === 'reverse' ? 'rgba(150,212,133,0.10)' : 'rgba(232,192,96,0.10)', border: v.statut === 'reverse' ? '1px solid rgba(150,212,133,0.25)' : '1px solid rgba(232,192,96,0.25)', color: v.statut === 'reverse' ? '#96d485' : '#e8c060' }}>
                                {v.statut === 'reverse' ? '✓ reversé' : '⏳ attente'}
                              </span>
                            </div>
                          ))}
                        </div>
                        {/* Totals + action */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', gap: 20 }}>
                            <div style={{ fontSize: 11, color: 'rgba(242,237,224,0.45)' }}>
                              Total brut : <span style={{ color: 'rgba(242,237,224,0.70)', fontWeight: 500 }}>{fmt(lignes.reduce((s, v) => s + Number(v.montant_brut || 0), 0))}</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'rgba(242,237,224,0.45)' }}>
                              À reverser : <span style={{ color: '#96d485', fontWeight: 500 }}>{fmt(lignes.filter(v => v.statut === 'en_attente').reduce((s, v) => s + Number(v.montant_net || 0), 0))}</span>
                            </div>
                          </div>
                          {aReverser && (
                            <button onClick={() => marquerReverses(p.id)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: "'Jost',sans-serif", background: 'rgba(150,212,133,0.12)', border: '1px solid var(--greenT)', color: 'var(--green)' }}>
                              ✓ Marquer reversé
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  Page principale AdminJardinothequePage
// ═══════════════════════════════════════════════════════════
export function AdminJardinothequePage() {
  useTheme()
  const { user, signOut } = useAuth()
  const [tab,   setTab]   = useState('digital')
  const [toast, setToast] = useState(null)

  const isAdmin = ADMIN_IDS.includes(user?.id)
  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2800) }

  if (!isAdmin) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text3)', fontFamily: 'Jost,sans-serif', fontSize: 13 }}>
      <style>{css}</style>🚫 Accès non autorisé
    </div>
  )

  return (
    <div className="adm-root">
      <style>{css}</style>

      <div className="adm-topbar">
        <div className="adm-topbar-row1">
          <div className="adm-logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/icons/icon-192.png" alt="logo" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            Mon <em>Jardin</em>
            <span style={{ fontFamily: 'Jost', fontSize: 12, color: 'var(--text3)', letterSpacing: '.2em' }}>JARDINOTHÈQUE</span>
          </div>
          <div className="adm-btn ghost" onClick={() => { signOut(); window.location.href = "/"; }}>Déconnexion</div>
        </div>
        <div className="adm-topbar-nav">
          <AdminNav current="#jardinotheque" />
        </div>
      </div>

      <div className="adm-body">
        <div className="adm-tabs">
          <div className={`adm-tab${tab === 'digital'      ? ' active' : ''}`} onClick={() => setTab('digital')}>🎧 Digital</div>
          <div className={`adm-tab${tab === 'partenaires'  ? ' active' : ''}`} onClick={() => setTab('partenaires')}>🌿 Partenaires</div>
        </div>

        <div className="adm-section">
          {tab === 'digital'     && <TabDigital     showToast={showToast} />}
          {tab === 'partenaires' && <TabPartenaires showToast={showToast} />}
        </div>
      </div>

      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  )
}
