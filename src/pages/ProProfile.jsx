import { useState, useEffect, useRef } from 'react'
import { supabase } from '../core/supabaseClient'

function generateProId() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let id = ''
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return 'mj-' + id
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

@keyframes ppFadeUp  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes ppFadeIn  {from{opacity:0}to{opacity:1}}
@keyframes ppPulse   {0%,100%{opacity:1}50%{opacity:.45}}

.pp-wrap {
  min-height:100vh; font-family:'Jost',sans-serif;
  background:#f4f1ec; padding:28px 20px 64px;
}
.pp-header {
  display:flex; align-items:center; justify-content:space-between;
  max-width:840px; margin:0 auto 24px;
  animation:ppFadeUp .45s cubic-bezier(.22,1,.36,1) both;
}
.pp-back {
  display:flex; align-items:center; gap:7px; font-size:13px; color:#666;
  cursor:pointer; background:none; border:none; font-family:'Jost',sans-serif;
  transition:color .18s; padding:0;
}
.pp-back:hover { color:#111; }
.pp-back svg { width:15px; height:15px; }
.pp-header-tag {
  font-size:10px; font-weight:600; letter-spacing:.16em; text-transform:uppercase;
  color:#888; background:#ede9e2; padding:4px 12px; border-radius:20px;
}
.pp-card {
  max-width:840px; margin:0 auto 0;
  background:#fff; border:1px solid #e0ddd6; border-radius:20px 20px 0 0;
  overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,.06);
  animation:ppFadeUp .45s cubic-bezier(.22,1,.36,1) .04s both;
}
.pp-card-banner {
  background:linear-gradient(135deg,#1c1c1c 0%,#2a2a2a 100%);
  padding:24px 28px 22px;
  display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap;
}
.pp-badge-pro {
  display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px;
  background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.18);
  color:rgba(255,255,255,.80); font-size:10px; font-weight:600;
  letter-spacing:.12em; text-transform:uppercase; margin-bottom:10px;
}
.pp-name {
  font-family:'Cormorant Garamond',serif; font-size:30px; font-weight:600;
  color:#fff; line-height:1.15; margin-bottom:5px;
}
.pp-flower {
  font-family:'Cormorant Garamond',serif; font-size:15px; font-style:italic;
  color:rgba(255,255,255,.50);
}
.pp-id-block { display:flex; flex-direction:column; align-items:flex-end; gap:5px; flex-shrink:0; }
.pp-id-label { font-size:9px; letter-spacing:.16em; text-transform:uppercase; color:rgba(255,255,255,.35); font-weight:600; }
.pp-id-chip {
  display:flex; align-items:center; gap:10px;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15);
  border-radius:10px; padding:9px 16px; cursor:pointer; transition:background .18s;
}
.pp-id-chip:hover { background:rgba(255,255,255,.14); }
.pp-id-value { font-family:'Jost',sans-serif; font-size:17px; font-weight:600; letter-spacing:.14em; color:#fff; user-select:all; }
.pp-id-copy-icon { font-size:12px; color:rgba(255,255,255,.40); }
.pp-id-hint { font-size:10px; color:rgba(255,255,255,.25); }
.pp-id-copied { font-size:11px; color:#7dd45a; font-weight:500; animation:ppFadeIn .2s ease; }

.pp-info-zone { padding:22px 28px 20px; }
.pp-info-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(185px,1fr)); gap:15px 22px; margin-bottom:20px; }
.pp-info-label { font-size:9.5px; letter-spacing:.12em; text-transform:uppercase; color:#aaa; margin-bottom:3px; font-weight:600; }
.pp-info-value { font-size:14px; color:#111; font-weight:400; line-height:1.45; }
.pp-info-value.empty { color:#ccc; font-style:italic; font-size:13px; }
.pp-edit-btn {
  display:inline-flex; align-items:center; gap:6px; padding:8px 18px; border-radius:8px;
  border:1px solid #ddd; background:#fafafa; color:#333; font-size:12.5px; font-weight:500;
  font-family:'Jost',sans-serif; cursor:pointer; transition:all .18s;
}
.pp-edit-btn:hover { background:#f0ede8; border-color:#ccc; color:#111; }

/* ── Onglets ── */
.pp-tabs {
  max-width:840px; margin:0 auto 0;
  display:flex; background:#f9f7f4;
  border-left:1px solid #e0ddd6; border-right:1px solid #e0ddd6;
  animation:ppFadeUp .45s cubic-bezier(.22,1,.36,1) .07s both;
}
.pp-tab {
  flex:1; padding:15px 10px 13px; display:flex; flex-direction:column; align-items:center; gap:5px;
  cursor:pointer; border:none; background:transparent; font-family:'Jost',sans-serif;
  font-size:11.5px; font-weight:500; color:#888; position:relative; transition:all .18s;
  border-bottom:2px solid transparent; border-right:1px solid #ece9e2;
}
.pp-tab:last-child { border-right:none; }
.pp-tab:hover { background:#f4f1ec; color:#333; }
.pp-tab.active { background:#fff; color:#111; font-weight:600; border-bottom-color:#111; }
.pp-tab-icon { font-size:19px; }

.pp-tab-panel {
  max-width:840px; margin:0 auto 24px;
  background:#fff; border:1px solid #e0ddd6; border-top:none; border-radius:0 0 20px 20px;
  box-shadow:0 4px 20px rgba(0,0,0,.05);
  animation:ppFadeUp .45s cubic-bezier(.22,1,.36,1) .07s both;
}
.pp-tab-body { padding:32px 28px; }

.pp-empty { text-align:center; padding:36px 20px 28px; }
.pp-empty-icon { font-size:38px; margin-bottom:14px; opacity:.40; }
.pp-empty-title { font-family:'Cormorant Garamond',serif; font-size:20px; color:#444; margin-bottom:8px; }
.pp-empty-text { font-size:13px; color:#888; line-height:1.72; }
.pp-empty-btn {
  margin-top:20px; display:inline-flex; align-items:center; gap:6px;
  padding:10px 22px; border-radius:8px; border:none; background:#111;
  color:#fff; font-size:13px; font-weight:500; font-family:'Jost',sans-serif; cursor:pointer;
}

.pp-loader { display:flex; align-items:center; justify-content:center; min-height:200px; }
.pp-loader-dot { width:7px; height:7px; border-radius:50%; background:#bbb; margin:0 4px; animation:ppPulse 1.2s ease infinite; }
.pp-loader-dot:nth-child(2) { animation-delay:.2s; }
.pp-loader-dot:nth-child(3) { animation-delay:.4s; }

.pp-modal-overlay {
  position:fixed; inset:0; z-index:999; background:rgba(0,0,0,.45); backdrop-filter:blur(6px);
  display:flex; align-items:center; justify-content:center; padding:20px; animation:ppFadeIn .2s ease both;
}
.pp-modal {
  background:#fff; border-radius:18px; width:min(520px,100%); max-height:88vh; overflow-y:auto;
  padding:32px; position:relative; box-shadow:0 24px 60px rgba(0,0,0,.18);
  border:1px solid #e5e2da; animation:ppFadeUp .3s cubic-bezier(.22,1,.36,1) both;
}
.pp-modal-close {
  position:absolute; top:14px; right:14px; background:#f5f5f5; border:none; border-radius:50%;
  width:28px; height:28px; font-size:14px; cursor:pointer; color:#666;
  display:flex; align-items:center; justify-content:center; transition:background .15s;
}
.pp-modal-close:hover { background:#eee; color:#111; }
.pp-modal-title { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:600; color:#111; margin-bottom:4px; }
.pp-modal-sub { font-size:13px; color:#888; margin-bottom:24px; }
.pp-field { margin-bottom:14px; }
.pp-label { font-size:10px; letter-spacing:.10em; text-transform:uppercase; color:#999; margin-bottom:5px; display:block; font-weight:600; }
.pp-input {
  width:100%; padding:11px 14px; background:#fafafa; border:1px solid #e0ddd6;
  border-radius:10px; font-size:14px; font-family:'Jost',sans-serif; color:#111; outline:none; transition:border-color .18s;
}
.pp-input:focus { border-color:#999; background:#fff; }
.pp-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.pp-save-btn {
  width:100%; padding:13px; border-radius:10px; border:none; background:#111;
  color:#fff; font-size:14px; font-weight:600; font-family:'Jost',sans-serif;
  cursor:pointer; transition:background .18s; margin-top:8px;
}
.pp-save-btn:hover { background:#333; }
.pp-save-btn:disabled { opacity:.35; cursor:not-allowed; }
.pp-error { font-size:12px; color:#c04040; padding:10px 14px; background:#fef2f2; border:1px solid #fca5a5; border-radius:9px; margin-bottom:12px; }

@media(max-width:600px) {
  .pp-wrap { padding:16px 12px 50px; }
  .pp-card-banner { flex-direction:column-reverse; padding:18px 16px; }
  .pp-id-block { align-items:flex-start; }
  .pp-info-zone { padding:18px 16px; }
  .pp-tab-body { padding:22px 16px; }
  .pp-tab { padding:12px 6px 10px; font-size:10.5px; }
  .pp-tab-icon { font-size:17px; }
  .pp-row { grid-template-columns:1fr; }
  .pp-modal { padding:24px 16px; }
}
`

export function ProProfile({ onBack }) {
  const [proData,    setProData]    = useState(null)
  const [userData,   setUserData]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [copied,     setCopied]     = useState(false)
  const [activeTab,  setActiveTab]  = useState('ateliers')
  const [showEdit,   setShowEdit]   = useState(false)
  const [editForm,   setEditForm]   = useState({})
  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState(null)
  const [referrals,  setReferrals]  = useState([])
  const [commissions,setCommissions]= useState([])
  const promoInitialized = useRef(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      console.log('[ProProfile] user.id:', user.id, '| user.email:', user.email)

      const { data: u } = await supabase
        .from('users').select('id, display_name, flower_name, role')
        .eq('id', user.id).single()
      setUserData(u)

      // 1. Chercher par user_id (si la colonne existe)
      let pro = null
      try {
        const { data } = await supabase
          .from('users_pro').select('*').eq('user_id', user.id).maybeSingle()
        pro = data ?? null
      } catch(_) {}

      // 2. Fallback : récupérer toutes les lignes et matcher par nom/prénom
      if (!pro) {
        try {
          const { data: rows } = await supabase.from('users_pro').select('*')
          if (rows?.length) {
            // Essayer de matcher avec le display_name (prenom nom ou nom prenom)
            const parts = (u?.display_name ?? '').trim().toLowerCase().split(/\s+/)
            pro = rows.find(r => {
              const rp = (r.prenom ?? '').toLowerCase()
              const rn = (r.nom ?? '').toLowerCase()
              return parts.includes(rp) && parts.includes(rn)
            }) ?? rows[0] // si un seul pro dans la base, on le prend
            // Lier user_id si la colonne existe
            if (pro) {
              try { await supabase.from('users_pro').update({ user_id: user.id }).eq('id', pro.id) } catch(_) {}
              pro = { ...pro, user_id: user.id }
            }
          }
        } catch(_) {}
      }

      // 3. Générer pro_id si absent
      if (pro && !pro.pro_id) {
        const newId = generateProId()
        try {
          const { data: updated } = await supabase
            .from('users_pro').update({ pro_id: newId }).eq('id', pro.id).select().single()
          pro = updated ?? { ...pro, pro_id: newId }
        } catch(_) { pro = { ...pro, pro_id: newId } }
      }

      setProData(pro)

      // Initialiser le code promo Stripe si pas encore fait (une seule fois par mount)
      if (pro && !pro.stripe_promo_code_id && !promoInitialized.current) {
        promoInitialized.current = true
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            await supabase.functions.invoke('init-pro-promo', {
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
            // Recharger pour avoir le stripe_promo_code_id
            const { data: refreshed } = await supabase.from('users_pro').select('*').eq('id', pro.id).single()
            if (refreshed) setProData(refreshed)
          }
        } catch (e) { console.warn('[ProProfile] init-pro-promo:', e) }
      }

      // Charger referrals et commissions
      if (pro) {
        const [{ data: refs }, { data: comms }] = await Promise.all([
          supabase.from('pro_referrals')
            .select('*, users(display_name, flower_name)')
            .eq('pro_id', pro.id)
            .order('created_at', { ascending: false }),
          supabase.from('pro_commissions')
            .select('*')
            .eq('pro_id', pro.id)
            .order('created_at', { ascending: false }),
        ])
        setReferrals(refs ?? [])
        setCommissions(comms ?? [])
      }
    } catch (e) { console.error('[ProProfile]', e) }
    finally { setLoading(false) }
  }

  function copyId() {
    if (!proData?.pro_id) return
    navigator.clipboard.writeText(proData.pro_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openEdit() {
    setEditForm({
      nom: proData?.nom ?? '', prenom: proData?.prenom ?? '',
      entreprise: proData?.entreprise ?? '', activite: proData?.activite ?? '',
      adresse: proData?.adresse ?? '',
      cp: proData?.cp ?? '', ville: proData?.ville ?? '',
      telephone: proData?.telephone ?? '', siret: proData?.siret ?? '',
    })
    setSaveError(null); setShowEdit(true)
  }

  async function handleSave(e) {
    e.preventDefault(); setSaveError(null); setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const payload = {
        nom: editForm.nom.trim(), prenom: editForm.prenom.trim(),
        entreprise: editForm.entreprise.trim() || null,
        activite: editForm.activite.trim() || null,
        adresse: editForm.adresse.trim() || null,
        cp: editForm.cp.trim() || null, ville: editForm.ville.trim() || null,
        telephone: editForm.telephone.trim(),
        siret: editForm.siret.replace(/\s/g, ''),
      }
      console.log('[ProProfile] save payload:', payload, '| user_id:', user.id, '| proData.id:', proData?.id)
      const { data: saved, error } = await supabase.from('users_pro').update(payload)
        .eq('id', proData.id).select().single()
      console.log('[ProProfile] save result:', saved, '| error:', error)
      if (error) throw new Error(error.message)
      await loadData(); setShowEdit(false)
    } catch (err) { setSaveError(err.message) }
    finally { setSaving(false) }
  }

  const upd = f => e => setEditForm(p => ({ ...p, [f]: e.target.value }))
  const val = v => v
    ? <span className="pp-info-value">{v}</span>
    : <span className="pp-info-value empty">—</span>

  const TABS = [
    { id:'ateliers',    icon:'🌿', label:'Mes ateliers'  },
    { id:'outils',      icon:'🪴', label:'Mes outils'    },
    { id:'commissions', icon:'💰', label:'Commissions'   },
  ]

  if (loading) return (
    <div className="pp-wrap"><style>{css}</style>
      <div className="pp-loader">
        <div className="pp-loader-dot"/><div className="pp-loader-dot"/><div className="pp-loader-dot"/>
      </div>
    </div>
  )

  return (
    <div className="pp-wrap">
      <style>{css}</style>

      <div className="pp-header">
        <button className="pp-back" onClick={onBack}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Mon profil
        </button>
        <div className="pp-header-tag">Espace professionnel</div>
      </div>

      <div className="pp-card">
        <div className="pp-card-banner">
          <div>
            <div className="pp-badge-pro">✦ Compte Pro</div>
            <div className="pp-name">{userData?.display_name ?? '—'}</div>
            {userData?.flower_name && <div className="pp-flower">🌸 {userData.flower_name}</div>}
          </div>
          <div className="pp-id-block">
            <div className="pp-id-label">Identifiant partenaire</div>
            {proData?.pro_id ? (
              <>
                <div className="pp-id-chip" onClick={copyId}>
                  <span className="pp-id-value">{proData.pro_id}</span>
                  <span className="pp-id-copy-icon">⎘</span>
                </div>
                {copied
                  ? <span className="pp-id-copied">✓ Copié !</span>
                  : <span className="pp-id-hint">Cliquer pour copier</span>}
              </>
            ) : <span style={{fontSize:12,color:'rgba(255,255,255,.35)'}}>En cours…</span>}
          </div>
        </div>

        <div className="pp-info-zone">
          <div className="pp-info-grid">
            {[
              { label:'Nom',        value: proData?.nom },
              { label:'Prénom',     value: proData?.prenom },
              { label:'Entreprise', value: proData?.entreprise },
              { label:'Activité',   value: proData?.activite },
              { label:'Téléphone',  value: proData?.telephone },
              { label:'Adresse',    value: proData?.adresse },
              { label:'CP / Ville', value: proData?.cp || proData?.ville ? `${proData?.cp ?? ''} ${proData?.ville ?? ''}`.trim() : null },
              { label:'SIRET',      value: proData?.siret },
            ].map(({ label, value }) => (
              <div key={label} className="pp-info-item">
                <div className="pp-info-label">{label}</div>
                {val(value)}
              </div>
            ))}
          </div>
          <button className="pp-edit-btn" onClick={openEdit}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Modifier mes informations
          </button>
        </div>
      </div>

      {/* Onglets — collés sous la carte */}
      <div className="pp-tabs">
        {TABS.map(tab => (
          <button key={tab.id} className={`pp-tab${activeTab===tab.id?' active':''}`} onClick={() => setActiveTab(tab.id)}>
            <span className="pp-tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="pp-tab-panel">
        <div className="pp-tab-body">
          {activeTab === 'ateliers' && (
            <div className="pp-empty">
              <div className="pp-empty-icon">🌱</div>
              <div className="pp-empty-title">Aucun atelier pour le moment</div>
              <div className="pp-empty-text">Proposez vos ateliers bien-être à la communauté.<br/>Ils seront liés à votre identifiant <strong>{proData?.pro_id ?? '…'}</strong>.</div>
              <button className="pp-empty-btn" disabled style={{opacity:.4,cursor:'not-allowed'}}>+ Créer un atelier <span style={{fontSize:10,opacity:.7}}>(bientôt)</span></button>
            </div>
          )}
          {activeTab === 'outils' && (
            <div className="pp-empty">
              <div className="pp-empty-icon">🛍️</div>
              <div className="pp-empty-title">Aucun outil en vente</div>
              <div className="pp-empty-text">Mettez en avant vos ressources dans la jardinothèque.<br/>Tracés via votre identifiant <strong>{proData?.pro_id ?? '…'}</strong>.</div>
              <button className="pp-empty-btn" disabled style={{opacity:.4,cursor:'not-allowed'}}>+ Ajouter un outil <span style={{fontSize:10,opacity:.7}}>(bientôt)</span></button>
            </div>
          )}
          {activeTab === 'commissions' && (
            <div>
              {/* Solde + code promo */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
                <div style={{ background:'#f9f7f4', border:'1px solid #e0ddd6', borderRadius:14, padding:'18px 20px' }}>
                  <div style={{ fontSize:9.5, letterSpacing:'.12em', textTransform:'uppercase', color:'#aaa', marginBottom:6, fontWeight:600 }}>Solde disponible</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:300, color:'#111', lineHeight:1 }}>
                    {((proData?.commission_balance_cents ?? 0) / 100).toFixed(2)} <span style={{ fontSize:16 }}>€</span>
                  </div>
                  <div style={{ fontSize:11, color:'#aaa', marginTop:5 }}>
                    Total cumulé : {((proData?.total_earned_cents ?? 0) / 100).toFixed(2)} €
                  </div>
                </div>
                <div style={{ background:'#f9f7f4', border:'1px solid #e0ddd6', borderRadius:14, padding:'18px 20px' }}>
                  <div style={{ fontSize:9.5, letterSpacing:'.12em', textTransform:'uppercase', color:'#aaa', marginBottom:6, fontWeight:600 }}>Code promo client</div>
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:18, fontWeight:600, letterSpacing:'.10em', color:'#111' }}>
                    {proData?.pro_id ?? '…'}
                  </div>
                  <div style={{ fontSize:11, color:'#aaa', marginTop:5 }}>−10 % · commission 10 % / mois</div>
                </div>
              </div>

              {/* Clients affiliés */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'#aaa', fontWeight:600, marginBottom:12 }}>
                  Clients affiliés ({referrals.length})
                </div>
                {referrals.length === 0 ? (
                  <div style={{ fontSize:13, color:'#bbb', fontStyle:'italic', padding:'12px 0' }}>
                    Aucun client pour le moment — partagez votre code <strong style={{ color:'#888' }}>{proData?.pro_id}</strong>
                  </div>
                ) : referrals.map(ref => (
                  <div key={ref.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f0ede8' }}>
                    <div>
                      <div style={{ fontSize:13.5, color:'#111', fontWeight:500 }}>
                        {ref.users?.display_name ?? 'Anonyme'}
                        {ref.users?.flower_name && <span style={{ color:'#aaa', fontWeight:400 }}> · {ref.users.flower_name}</span>}
                      </div>
                      <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>
                        Depuis le {new Date(ref.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20,
                      background: ref.status === 'active' ? 'rgba(90,154,40,.10)' : 'rgba(0,0,0,.05)',
                      color: ref.status === 'active' ? '#5a9a28' : '#aaa',
                    }}>
                      {ref.status === 'active' ? '✓ Actif' : '✕ Résilié'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Historique commissions */}
              <div>
                <div style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'#aaa', fontWeight:600, marginBottom:12 }}>
                  Historique ({commissions.length})
                </div>
                {commissions.length === 0 ? (
                  <div style={{ fontSize:13, color:'#bbb', fontStyle:'italic', padding:'12px 0' }}>
                    Les commissions apparaîtront ici à chaque renouvellement.
                  </div>
                ) : commissions.map(c => (
                  <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #f0ede8' }}>
                    <div style={{ fontSize:12.5, color:'#555' }}>
                      {new Date(c.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                    </div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#5a9a28' }}>
                      +{(c.amount_cents / 100).toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal modification */}
      {showEdit && (
        <div className="pp-modal-overlay" onClick={e => e.target===e.currentTarget && setShowEdit(false)}>
          <div className="pp-modal">
            <button className="pp-modal-close" onClick={() => setShowEdit(false)}>✕</button>
            <div className="pp-modal-title">Modifier mes informations</div>
            <div className="pp-modal-sub">Visibles sur votre espace partenaire.</div>
            <form onSubmit={handleSave}>
              <div className="pp-row">
                <div className="pp-field"><label className="pp-label">Nom</label><input className="pp-input" value={editForm.nom} onChange={upd('nom')} required maxLength={80}/></div>
                <div className="pp-field"><label className="pp-label">Prénom</label><input className="pp-input" value={editForm.prenom} onChange={upd('prenom')} required maxLength={80}/></div>
              </div>
              <div className="pp-field"><label className="pp-label">Entreprise</label><input className="pp-input" value={editForm.entreprise} onChange={upd('entreprise')} maxLength={120}/></div>
              <div className="pp-field"><label className="pp-label">Nature de l'activité <span style={{color:'#aaa',fontWeight:400}}>(ex: hypnothérapeute, coach, naturopathe…)</span></label><input className="pp-input" value={editForm.activite} onChange={upd('activite')} placeholder="Décrivez votre activité de mieux-être" maxLength={160}/></div>
              <div className="pp-field"><label className="pp-label">Adresse</label><input className="pp-input" value={editForm.adresse} onChange={upd('adresse')} maxLength={200}/></div>
              <div className="pp-row">
                <div className="pp-field"><label className="pp-label">Code postal</label><input className="pp-input" value={editForm.cp} onChange={upd('cp')} maxLength={10}/></div>
                <div className="pp-field"><label className="pp-label">Ville</label><input className="pp-input" value={editForm.ville} onChange={upd('ville')} maxLength={80}/></div>
              </div>
              <div className="pp-field"><label className="pp-label">Téléphone</label><input className="pp-input" value={editForm.telephone} onChange={upd('telephone')} required maxLength={20}/></div>
              <div className="pp-field"><label className="pp-label">SIRET</label><input className="pp-input" value={editForm.siret} onChange={upd('siret')} required maxLength={18}/></div>
              {saveError && <div className="pp-error">{saveError}</div>}
              <button className="pp-save-btn" type="submit" disabled={saving}>{saving ? '…' : '✓ Enregistrer'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
