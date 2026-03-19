// ─────────────────────────────────────────────────────────────────────────────
//  ScreenJardinotheque.jsx  —  La Jardinothèque
//  Digital · Partenaires · Occasion
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../core/supabaseClient'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');

.jt-root { font-family:'Jost',sans-serif; color:#f2ede0; width:100%; }

/* ── Tabs ── */
.jt-tabs { display:flex; gap:0; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:28px; }
.jt-tab  { padding:10px 22px; font-size:11px; letter-spacing:.08em; text-transform:uppercase;
           color:rgba(242,237,224,0.38); cursor:pointer; border-bottom:2px solid transparent;
           margin-bottom:-1px; transition:all .2s; font-family:'Jost',sans-serif; background:none; border-top:none; border-left:none; border-right:none; }
.jt-tab.active { color:#f2ede0; border-bottom-color:currentColor; }

/* ── Filtres ── */
.jt-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:24px; }
.jt-filter  { padding:5px 14px; border-radius:20px; font-size:11px; cursor:pointer;
              border:1px solid rgba(255,255,255,0.10); background:transparent;
              color:rgba(242,237,224,0.40); font-family:'Jost',sans-serif;
              transition:all .15s; }
.jt-filter.active { background:rgba(255,255,255,0.08); color:#f2ede0;
                    border-color:rgba(255,255,255,0.25); }

/* ── Grille ── */
.jt-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:12px; }

/* ── Card ── */
.jt-card { border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,0.07);
           background:rgba(255,255,255,0.03); transition:all .2s; cursor:pointer; display:flex; flex-direction:column; }
.jt-card:hover { background:rgba(255,255,255,0.055); border-color:rgba(255,255,255,0.14);
                 transform:translateY(-2px); }
.jt-card-img { width:100%; aspect-ratio:3/2; background:rgba(255,255,255,0.04);
               display:flex; align-items:center; justify-content:center; font-size:32px; max-height:120px; overflow:hidden; position:relative; }
.jt-card-img img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
.jt-card-body { padding:10px 14px 14px; flex:1; display:flex; flex-direction:column; gap:4px; }
.jt-card-cat  { font-size:9px; letter-spacing:.12em; text-transform:uppercase;
                color:rgba(242,237,224,0.35); }
.jt-card-title { font-family:'Cormorant Garamond',serif; font-size:15px; font-weight:300;
                 color:#f2ede0; line-height:1.25; }
.jt-card-desc  { display:none; }
.jt-card-footer { display:flex; align-items:center; justify-content:space-between; margin-top:4px; }
.jt-card-price { font-family:'Cormorant Garamond',serif; font-size:16px; font-weight:300; }
.jt-card-btn   { padding:5px 12px; border-radius:20px; font-size:10px; font-family:'Jost',sans-serif;
                 cursor:pointer; transition:all .2s; font-weight:500; }

/* ── Badge vendeur ── */
.jt-vendeur { display:flex; align-items:center; gap:6px; padding:5px 0 0;
              border-top:1px solid rgba(255,255,255,0.06); margin-top:2px; }
.jt-vendeur-av { width:18px; height:18px; border-radius:50%; background:rgba(255,255,255,0.10);
                 display:flex; align-items:center; justify-content:center;
                 font-size:9px; font-weight:500; flex-shrink:0; }
.jt-vendeur-name { font-size:10px; color:rgba(242,237,224,0.45); }

/* ── Empty ── */
.jt-empty { text-align:center; padding:60px 20px; }
.jt-empty-icon { font-size:40px; opacity:.25; margin-bottom:16px; }
.jt-empty-text { font-size:13px; color:rgba(242,237,224,0.30); font-style:italic; }

/* ── Modal ── */
.jt-overlay { position:fixed; inset:0; z-index:400; display:flex; align-items:center;
              justify-content:center; background:rgba(0,0,0,0.70); backdrop-filter:blur(12px); padding:20px; }
.jt-modal   { width:100%; max-width:520px; border-radius:18px;
              background:var(--bg);
              border:1px solid rgba(255,255,255,0.08); border-bottom:none;
              padding:28px 24px 48px; max-height:90vh; overflow-y:auto;
              animation:slideUp .35s cubic-bezier(.34,1.4,.64,1); }
@keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes fadeIn { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
.jt-modal-img { width:100%; border-radius:12px; aspect-ratio:16/9; object-fit:cover;
                background:rgba(255,255,255,0.04); display:flex; align-items:center;
                justify-content:center; font-size:64px; margin-bottom:20px; }
.jt-modal-cat   { font-size:9px; letter-spacing:.14em; text-transform:uppercase;
                  color:rgba(242,237,224,0.35); margin-bottom:6px; }
.jt-modal-title { font-family:'Cormorant Garamond',serif; font-size:26px; font-weight:300;
                  color:#f2ede0; line-height:1.2; margin-bottom:12px; }
.jt-modal-desc  { font-size:13px; color:rgba(242,237,224,0.62); line-height:1.85;
                  margin-bottom:20px; }
.jt-modal-price { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:300;
                  margin-bottom:20px; }
.jt-modal-btn   { width:100%; padding:14px; border-radius:12px; font-size:13px;
                  font-family:'Jost',sans-serif; cursor:pointer; font-weight:500;
                  letter-spacing:.06em; transition:all .2s; }

@media(max-width:640px) {
  .jt-grid { grid-template-columns:1fr 1fr; gap:8px; }
  .jt-tab  { padding:10px 14px; font-size:10px; }
}
`

// ── Couleurs par type ────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  digital:  { label:'Contenus digitaux',          color:'#b4a0f0', bg:'rgba(180,160,240,0.10)', icon:'🎧' },
  physique: { label:'Articles de nos partenaires', color:'#82c8a0', bg:'rgba(130,200,160,0.10)', icon:'🤝' },
  occasion: { label:"Produits d'occasion",         color:'#e8c060', bg:'rgba(232,192,96,0.10)',  icon:'🛍' },
}

// ── Catégories par type ──────────────────────────────────────────────────────
const CATEGORIES = {
  digital:  ['Tous', 'Audio', 'Formation', 'E-book'],
  physique: ['Tous', 'Livres', 'Bijoux', 'Pierres', 'Huiles essentielles', 'Autres'],
  occasion: ['Tous', 'Livres', 'Bijoux', 'Pierres', 'Accessoires', 'Autres'],
}

// ── Emoji par catégorie ──────────────────────────────────────────────────────
const CAT_EMOJI = {
  'Audio':'🎧', 'Formation':'📚', 'E-book':'📖', 'Méditation':'🧘', 'Guide':'📖',
  'Livres':'📕', 'Bijoux':'💍', 'Pierres':'💎', 'Huiles essentielles':'🌸',
  'Accessoires':'🎀', 'Autres':'✨',
}

// ── Produits de démo (affichés si la table est vide) ─────────────────────────
const DEMO_PRODUITS = [
  { id:'d1', type:'digital', categorie:'Audio', titre:'Méditation des Racines', description:'Une guidance sonore de 20 minutes pour ancrer votre énergie et retrouver votre centre. Voix douce, sons de nature.', prix:9.90, image_url:null, statut:'actif', vendeur_nom:null },
  { id:'d2', type:'digital', categorie:'Formation', titre:'Formation : Cultiver sa Sérénité', description:'6 semaines pour transformer votre rapport au stress. Vidéos, exercices pratiques, journal de bord guidé.', prix:49.00, image_url:null, statut:'actif', vendeur_nom:null },
  { id:'d3', type:'digital', categorie:'Guide', titre:'Guide des Rituels du Matin', description:'30 pages de rituels sensoriels pour commencer chaque journée depuis l\'intérieur. PDF illustré.', prix:7.50, image_url:null, statut:'actif', vendeur_nom:null },
  { id:'p1', type:'physique', categorie:'Livre', titre:'Les Chemins du Dedans', description:'Un livre de référence sur la pleine conscience au quotidien. Édition reliée, 240 pages.', prix:22.00, image_url:null, statut:'actif', vendeur_nom:'Éditions Silence' },
  { id:'p2', type:'physique', categorie:'Pierre', titre:'Quartz Rose Brut', description:'Pierre naturelle de qualité, idéale pour la méditation et l\'équilibre émotionnel. Poids : 80–120g.', prix:14.00, image_url:null, statut:'actif', vendeur_nom:'Cristaux & Racines' },
  { id:'p3', type:'physique', categorie:'Bijou', titre:'Bracelet Lune & Racines', description:'Bracelet artisanal en argent 925 avec pierre de lune. Créé par une artisane partenaire.', prix:38.00, image_url:null, statut:'actif', vendeur_nom:'Atelier Lunaire' },
  { id:'o1', type:'occasion', categorie:'Livre', titre:'Lot de 3 livres bien-être', description:'3 ouvrages en très bon état : La Pleine Conscience au Quotidien + 2 autres. Vendu ensemble.', prix:15.00, image_url:null, statut:'actif', vendeur_nom:'Marie L.', vendeur_contact:'via messagerie' },
  { id:'o2', type:'occasion', categorie:'Pierre', titre:'Collection de pierres', description:'12 pierres variées : améthyste, obsidienne, citrine... Utilisées avec soin, bon état général.', prix:25.00, image_url:null, statut:'actif', vendeur_nom:'Sophie M.', vendeur_contact:'via messagerie' },
]

// ── Composant principal ──────────────────────────────────────────────────────
export function ScreenJardinotheque({ userId, isPremium = false, onUpgrade }) {
  const [tab,           setTab]           = useState('digital')
  const [cat,           setCat]           = useState('Tous')
  const [produits,      setProduits]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [selected,      setSelected]      = useState(null)
  const [showPartenaire, setShowPartenaire] = useState(false)
  const [partenaire,     setPartenaire]     = useState(null)
  const [achatIds,      setAchatIds]      = useState(new Set()) // produits déjà achetés

  useEffect(() => {
    if (!userId) return
    supabase.from('achats').select('produit_id').eq('user_id', userId).eq('statut', 'complete')
      .then(({ data }) => setAchatIds(new Set((data || []).map(a => a.produit_id))))
  }, [userId])

  const loadProduits = () => {
    setLoading(true)
    supabase.from('produits').select('*')
      .eq('statut', 'actif')
      .order('ordre', { ascending: true })
      .then(({ data, error }) => {
        setLoading(false)
        if (error || !data || data.length === 0) {
          setProduits(DEMO_PRODUITS)
        } else {
          setProduits(data)
        }
      })
  }

  useEffect(() => {
    loadProduits()
    // Recharge quand la page redevient visible (retour depuis Stripe par ex.)
    const onVisible = () => { if (document.visibilityState === 'visible') loadProduits() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Reset catégorie au changement d'onglet
  useEffect(() => { setCat('Tous') }, [tab])

  const filtered = useMemo(() =>
    produits.filter(p =>
      p.type === tab &&
      (cat === 'Tous' || p.categorie === cat)
    ), [produits, tab, cat]
  )

  const tc = TYPE_CONFIG[tab]

  return (
    <div className="jt-root" style={{ padding:'0 0 40px', overflowY:'auto', height:'100%' }}>
      <style>{css}</style>

      {/* ── En-tête ── */}
      <div style={{ padding:'24px 24px 0', marginBottom:24, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:300, lineHeight:1, marginBottom:6 }}>
            La <em style={{ fontStyle:'italic', color:tc.color }}>Jardinothèque</em>
          </div>
          <p style={{ fontSize:12, color:'rgba(242,237,224,0.40)', lineHeight:1.6, maxWidth:480 }}>
            Ressources, créations de partenaires et échanges de la communauté — tout ce qui nourrit votre jardin intérieur.
          </p>
        </div>
        <button onClick={() => setShowPartenaire(true)}
          style={{ flexShrink:0, padding:'9px 18px', borderRadius:20, border:'1px solid rgba(150,212,133,0.35)', background:'rgba(150,212,133,0.08)', color:'#96d485', fontSize:12, fontFamily:"'Jost',sans-serif", cursor:'pointer', fontWeight:500, letterSpacing:'.04em', transition:'all .2s', marginTop:6 }}>
          🌿 Partenaires
        </button>
      </div>

      {/* ── Onglets ── */}
      <div style={{ padding:'0 24px' }}>
        <div className="jt-tabs">
          {Object.entries(TYPE_CONFIG).filter(([k]) => k === 'digital').map(([k, v]) => (
            <button key={k} className={'jt-tab' + (tab===k ? ' active' : '')}
              onClick={() => setTab(k)}
              style={{ color: tab===k ? v.color : undefined, borderBottomColor: tab===k ? v.color : undefined }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        {/* ── Filtres catégories ── */}
        <div className="jt-filters">
          {CATEGORIES[tab].map(c => (
            <button key={c} className={'jt-filter' + (cat===c ? ' active' : '')} onClick={() => setCat(c)}
              style={cat===c ? { background:`${tc.bg}`, borderColor:`${tc.color}50`, color:tc.color } : {}}>
              {c !== 'Tous' ? (CAT_EMOJI[c] ?? '') + ' ' : ''}{c}
            </button>
          ))}
        </div>

        {/* ── Grille ── */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(242,237,224,0.25)', fontSize:13, fontStyle:'italic' }}>
            Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div className="jt-empty">
            <div className="jt-empty-icon">{tc.icon}</div>
            <div className="jt-empty-text">Aucun produit dans cette catégorie pour le moment.</div>
          </div>
        ) : (
          <div className="jt-grid">
            {filtered.map(p => (
              <ProductCard key={p.id} produit={p} tc={tc} onOpen={() => setSelected(p)} hasBought={achatIds.has(p.id)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal détail ── */}
      {selected && (
        <ProductModal produit={selected} tc={TYPE_CONFIG[selected.type]} onClose={() => setSelected(null)} hasBought={achatIds.has(selected.id)} userId={userId} isPremium={isPremium} onUpgrade={onUpgrade} onAchatLumens={() => { setAchatIds(s => new Set([...s, selected.id])); setSelected(null) }} />
      )}

      {/* ── Modal Partenaires ── */}
      {showPartenaire && (
        <PartenaireModal
          partenaire={partenaire}
          onLogin={f => setPartenaire(f)}
          onLogout={() => setPartenaire(null)}
          onClose={() => setShowPartenaire(false)}
          onProductAdded={() => {
            setShowPartenaire(false)
            // Recharge les produits
            setLoading(true)
            supabase.from('produits').select('*').eq('statut','actif').order('ordre')
              .then(({ data }) => { setProduits(data || DEMO_PRODUITS); setLoading(false) })
          }}
        />
      )}
    </div>
  )
}

// ── Card produit ─────────────────────────────────────────────────────────────
function ProductCard({ produit: p, tc, onOpen, hasBought }) {
  const emoji = CAT_EMOJI[p.categorie] ?? tc.icon

  return (
    <div className="jt-card" onClick={onOpen}>
      {/* Image / emoji fallback */}
      <div className="jt-card-img" style={{ position:'relative', overflow:'hidden', aspectRatio:'3/2', maxHeight:120, background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {p.image_url
          ? <img src={p.image_url} alt={p.titre} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          : <span style={{ fontSize:28, opacity:.35 }}>{emoji}</span>
        }
      </div>

      <div className="jt-card-body">
        <div className="jt-card-cat">{p.categorie}</div>
        <div className="jt-card-title">{p.titre}</div>
        <div className="jt-card-desc">{p.description?.slice(0, 90)}{p.description?.length > 90 ? '…' : ''}</div>

        {/* Vendeur (occasion + partenaires) */}
        {p.vendeur_nom && (
          <div className="jt-vendeur">
            <div className="jt-vendeur-av">{p.vendeur_nom.charAt(0).toUpperCase()}</div>
            <div className="jt-vendeur-name">{p.vendeur_nom}</div>
          </div>
        )}

        <div className="jt-card-footer">
          <div className="jt-card-price" style={{ color: tc.color }}>
            {p.prix != null ? `${Number(p.prix).toFixed(2).replace('.', ',')} €` : 'Prix sur demande'}
          </div>
          <div className="jt-card-btn"
            style={{ background: tc.bg, border:`1px solid ${tc.color}40`, color: tc.color }}>
            {hasBought ? '✓ Acheté' : p.type === 'digital' ? 'Acheter' : p.type === 'occasion' ? 'Contacter' : 'Voir'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Modal détail produit ──────────────────────────────────────────────────────
function ProductModal({ produit: p, tc, onClose, hasBought, userId, onAchatLumens, isPremium = false, onUpgrade }) {
  const emoji = CAT_EMOJI[p.categorie] ?? tc.icon
  const isDigital  = p.type === 'digital'
  const isOccasion = p.type === 'occasion'
  const [paying,      setPaying]      = useState(false)
  const [payingLumens, setPayingLumens] = useState(false)
  const [payErr,       setPayErr]       = useState('')

  const CHECKOUT_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '') + '/functions/v1/stripe-checkout'

  const handleAction = async () => {
    setPayErr('')
    // Partenaires physiques → lien externe uniquement
    if (!isDigital) {
      if (p.lien_externe) window.open(p.lien_externe, '_blank')
      return
    }
    // Digital → toujours par Stripe, jamais de lien direct
    if (!p.stripe_price_id) {
      setPayErr('Ce produit n\'est pas encore disponible à l\'achat.')
      return
    }
    setPaying(true)
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      if (!token) { setPayErr('Connectez-vous pour acheter.'); setPaying(false); return }
      const res = await fetch(CHECKOUT_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ produitId: p.id }),
      })
      console.log('[checkout] produitId envoyé:', p.id, '— status:', res.status)
      const data = await res.json()
      if (!res.ok) { setPayErr(data.error || 'Erreur paiement'); setPaying(false); return }
      window.location.href = data.url
    } catch {
      setPayErr('Erreur réseau'); setPaying(false)
    }
  }

  const handlePayLumens = async () => {
    setPayErr('')
    setPayingLumens(true)
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      if (!token) { setPayErr('Connectez-vous pour acheter.'); setPayingLumens(false); return }

      // Vérifie que l'acheteur a assez de Lumens
      const { data: lumenData } = await supabase.from('lumen_transactions').select('amount').eq('user_id', userId)
      const total = (lumenData || []).reduce((s, t) => s + Number(t.amount), 0)
      if (total < p.prix_lumens) { setPayErr(`Lumens insuffisants — vous avez ${total} ✦, il faut ${p.prix_lumens} ✦`); setPayingLumens(false); return }

      // Récupère le user_id du vendeur via le partenaire
      const { data: produitData } = await supabase.from('produits').select('partenaire_id, partenaires(user_id)').eq('id', p.id).maybeSingle()
      const vendeurUserId = produitData?.partenaires?.user_id ?? null

      // Débite l'acheteur
      await supabase.rpc('award_lumens', { p_user_id: userId, p_amount: -p.prix_lumens, p_reason: 'achat_produit', p_meta: { produit_id: p.id, produit_titre: p.titre } })

      // Crédite le vendeur si lié à un compte MaFleur
      if (vendeurUserId) {
        await supabase.rpc('award_lumens', { p_user_id: vendeurUserId, p_amount: p.prix_lumens, p_reason: 'vente_produit', p_meta: { produit_id: p.id, produit_titre: p.titre, acheteur_id: userId } })
      }

      // Enregistre l'achat
      await supabase.from('achats').upsert({ user_id: userId, produit_id: p.id, statut: 'complete', montant: 0 }, { onConflict: 'user_id,produit_id' })

      setPayingLumens(false)
      onAchatLumens?.()
    } catch(e) { setPayErr('Erreur : ' + e.message); setPayingLumens(false) }
  }

  const handleContact = () => {
    alert(`Contacter ${p.vendeur_nom} — messagerie à brancher`)
  }

  return (
    <div className="jt-overlay" onClick={onClose}>
      <div className="jt-modal" onClick={e => e.stopPropagation()}>

        {/* Handle + fermer */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ width:36, height:3, background:'rgba(255,255,255,0.18)', borderRadius:100 }} />
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(242,237,224,0.35)', fontSize:18, cursor:'pointer', lineHeight:1 }}>✕</button>
        </div>

        {/* Image */}
        <div className="jt-modal-img">
          {p.image_url
            ? <img src={p.image_url} alt={p.titre} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:12 }} />
            : <span style={{ opacity:.3 }}>{emoji}</span>
          }
        </div>

        {/* Catégorie */}
        <div className="jt-modal-cat" style={{ color: tc.color }}>
          {tc.label} · {p.categorie}
        </div>

        {/* Titre */}
        <div className="jt-modal-title">{p.titre}</div>

        {/* Description */}
        <div className="jt-modal-desc">{p.description}</div>

        {/* Vendeur */}
        {p.vendeur_nom && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, marginBottom:20 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:`${tc.bg}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:500, color:tc.color, flexShrink:0 }}>
              {p.vendeur_nom.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:12, color:'rgba(242,237,224,0.80)', fontWeight:500 }}>{p.vendeur_nom}</div>
              {p.type === 'physique' && <div style={{ fontSize:10, color:'rgba(242,237,224,0.35)' }}>Partenaire officiel</div>}
              {p.type === 'occasion' && <div style={{ fontSize:10, color:'rgba(242,237,224,0.35)' }}>Membre de la communauté</div>}
            </div>
          </div>
        )}

        {/* Prix */}
        <div className="jt-modal-price" style={{ color: tc.color }}>
          {p.prix != null ? `${Number(p.prix).toFixed(2).replace('.', ',')} €` : 'Prix sur demande'}
        </div>

        {/* CTA */}
        {isOccasion ? (
          <button className="jt-modal-btn" onClick={handleContact}
            style={{ background: tc.bg, border:`1px solid ${tc.color}50`, color: tc.color }}>
            ✉ Contacter le vendeur
          </button>
        ) : isDigital && hasBought ? (
          <div style={{ padding:'14px', borderRadius:12, background:'rgba(150,212,133,0.08)', border:'1px solid rgba(150,212,133,0.30)', textAlign:'center' }}>
            <div style={{ fontSize:13, color:'#96d485', fontWeight:500, marginBottom:6 }}>✓ Vous possédez ce produit</div>
            <div style={{ fontSize:11, color:'rgba(242,237,224,0.45)' }}>Retrouvez-le dans Mon profil → 🎧 Ma bibliothèque</div>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button className="jt-modal-btn" onClick={isPremium ? handleAction : onUpgrade} disabled={paying}
                style={{ background: tc.bg, border:`1px solid ${tc.color}50`, color: tc.color, opacity: paying ? 0.7 : 1 }}>
                {paying ? '⏳ Redirection…' : !isPremium ? '🔒 Premium requis — Découvrir' : isDigital ? '💳 Acheter — paiement sécurisé' : '🛍 Voir chez le partenaire'}
              </button>
              {p.accepte_lumens && p.prix_lumens && (
                <button className="jt-modal-btn" onClick={handlePayLumens} disabled={payingLumens}
                  style={{ background:'rgba(232,192,96,0.10)', border:'1px solid rgba(232,192,96,0.40)', color:'#e8c060', opacity: payingLumens ? 0.7 : 1 }}>
                  {payingLumens ? '⏳ Traitement…' : `✦ Payer ${p.prix_lumens} Lumens`}
                </button>
              )}
            </div>
            {payErr && <div style={{ fontSize:12, color:'#e87060', marginTop:8, textAlign:'center' }}>{payErr}</div>}
          </>
        )}

        {/* Mention légale discrète */}
        <div style={{ fontSize:10, color:'rgba(242,237,224,0.20)', textAlign:'center', marginTop:14, lineHeight:1.6 }}>
          {isDigital && 'Paiement sécurisé via Stripe · Accès immédiat après achat'}
          {p.type === 'physique' && 'Lien vers le site partenaire · Mon Jardin Intérieur ne perçoit pas de commission'}
          {isOccasion && 'Vente entre particuliers · Mon Jardin Intérieur n\'intervient pas dans la transaction'}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  VentesDashboard — visible par le partenaire pro
// ═══════════════════════════════════════════════════════════
function VentesDashboard({ partenaireId }) {
  const [ventes,  setVentes]  = useState([])
  const [loading, setLoading] = useState(true)
  const [mois,    setMois]    = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  })

  useEffect(() => {
    setLoading(true)
    supabase.from('ventes_partenaires')
      .select('*, produits(titre, type, categorie)')
      .eq('partenaire_id', partenaireId)
      .eq('mois_facturation', mois)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        console.log('[ventes] data:', data, 'error:', error, 'partenaireId:', partenaireId, 'mois:', mois)
        setVentes(data || [])
        setLoading(false)
      })
  }, [partenaireId, mois])

  const totalBrut = ventes.reduce((s, v) => s + Number(v.montant_brut), 0)
  const totalNet  = ventes.reduce((s, v) => s + Number(v.montant_net), 0)
  const fmt = (n) => `${Number(n).toFixed(2).replace('.', ',')} €`
  const inp = { padding:'5px 8px', borderRadius:6, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.04)', color:'rgba(242,237,224,0.80)', fontSize:12, fontFamily:"'Jost',sans-serif", outline:'none' }

  return (
    <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontSize:10, color:'rgba(242,237,224,0.38)', letterSpacing:'.10em', textTransform:'uppercase' }}>Mes ventes</div>
        <input type="month" value={mois} onChange={e => setMois(e.target.value)} style={{ ...inp }}/>
      </div>
      {loading ? (
        <div style={{ fontSize:12, color:'rgba(242,237,224,0.25)', fontStyle:'italic' }}>Chargement…</div>
      ) : ventes.length === 0 ? (
        <div style={{ fontSize:12, color:'rgba(242,237,224,0.25)', fontStyle:'italic' }}>Aucune vente ce mois.</div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
            {[
              { lbl:'Ventes brutes', val: fmt(totalBrut), color:'rgba(242,237,224,0.70)' },
              { lbl:'Commission 15%', val: fmt(totalBrut - totalNet), color:'#e8c060' },
              { lbl:'Net à reverser', val: fmt(totalNet), color:'#96d485' },
            ].map(({ lbl, val, color }) => (
              <div key={lbl} style={{ padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:9, color:'rgba(242,237,224,0.30)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>{lbl}</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:300, color }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {ventes.map(v => (
              <div key={v.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:7, background:'rgba(255,255,255,0.02)' }}>
                <div style={{ flex:1, fontSize:11, color:'rgba(242,237,224,0.65)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.produits?.titre || 'Produit'}</div>
                <div style={{ fontSize:11, color:'rgba(242,237,224,0.40)' }}>{fmt(v.montant_brut)}</div>
                <div style={{ fontSize:11, color:'#96d485', fontWeight:500 }}>{fmt(v.montant_net)} net</div>
                <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20,
                  background: v.statut==="reverse" ? "rgba(150,212,133,0.10)" : "rgba(232,192,96,0.10)",
                  border: v.statut==="reverse" ? "1px solid rgba(150,212,133,0.25)" : "1px solid rgba(232,192,96,0.25)",
                  color: v.statut==="reverse" ? "#96d485" : "#e8c060" }}>
                  {v.statut === "reverse" ? "✓ reversé" : "⏳ en attente"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  PartenaireModal
//  3 vues : accueil → inscription / connexion → espace vendeur
// ═══════════════════════════════════════════════════════════
function PartenaireModal({ partenaire, onLogin, onLogout, onClose, onProductAdded }) {
  const [view,         setView]         = useState(partenaire ? 'espace' : 'accueil')
  const [typeVendeur,  setTypeVendeur]  = useState(null) // 'particulier' | 'professionnel'
  // 'accueil' | 'choix' | 'form_particulier' | 'form_pro' | 'verification' | 'connexion' | 'espace'
  const [pendingEmail, setPendingEmail] = useState('')
  const [pendingData,  setPendingData]  = useState(null)

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(14px)', padding:'20px' }}
      onClick={onClose}>
      <div style={{ width:'100%', maxWidth:520, borderRadius:18, background:'var(--bg)', border:'1px solid var(--border2)', padding:'0 0 32px', maxHeight:'90vh', overflowY:'auto', animation:'fadeIn .25s ease both' }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 24px 0' }}>
          <div style={{ width:36, height:3, background:'rgba(255,255,255,0.18)', borderRadius:100 }} />
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(242,237,224,0.35)', fontSize:18, cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ padding:'20px 24px 0' }}>
          {view === 'accueil'          && <VueAccueil        onInscription={() => setView('choix')} onConnexion={() => setView('connexion')} />}
          {view === 'choix'            && <VueChoixType      onChoix={t => { setTypeVendeur(t); setView(t === 'particulier' ? 'form_particulier' : 'form_pro') }} onBack={() => setView('accueil')} />}
          {view === 'form_particulier' && <VueFormParticulier onSuccess={(d,e) => { setPendingData(d); setPendingEmail(e); setView('verification') }} onBack={() => setView('choix')} />}
          {view === 'form_pro'         && <VueFormPro         onSuccess={(d,e) => { setPendingData(d); setPendingEmail(e); setView('verification') }} onBack={() => setView('choix')} />}
          {view === 'verification'     && <VueVerification    email={pendingEmail} pendingData={pendingData} onSuccess={() => setView('connexion')} onBack={() => setView(typeVendeur === 'particulier' ? 'form_particulier' : 'form_pro')} />}
          {view === 'connexion'        && <VueConnexion       onSuccess={f => { onLogin(p); setView('espace') }} onBack={() => setView('accueil')} />}
          {view === 'espace'           && <VueEspace          partenaire={partenaire} onLogout={() => { onLogout(); setView('accueil') }} onProductAdded={onProductAdded} />}
        </div>
      </div>
    </div>
  )
}

// ── Vue accueil ──────────────────────────────────────────────
function VueAccueil({ onInscription, onConnexion }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:300, color:'#f2ede0', marginBottom:8 }}>
          Espace <em style={{ fontStyle:'italic', color:'#96d485' }}>Partenaires</em>
        </div>
        <p style={{ fontSize:12, color:'rgba(242,237,224,0.45)', lineHeight:1.8 }}>
          Partagez vos créations, ressources et produits avec la communauté de Mon Jardin Intérieur. Chaque vendeur reçoit un code unique pour gérer sa boutique.
        </p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <button onClick={onInscription}
          style={{ padding:'14px', borderRadius:12, border:'1px solid rgba(150,212,133,0.40)', background:'rgba(150,212,133,0.10)', color:'#96d485', fontSize:13, fontFamily:"'Jost',sans-serif", cursor:'pointer', fontWeight:500, letterSpacing:'.04em' }}>
          🌱 Devenir Partenaire
        </button>
        <button onClick={onConnexion}
          style={{ padding:'14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.10)', background:'rgba(255,255,255,0.03)', color:'rgba(242,237,224,0.60)', fontSize:13, fontFamily:"'Jost',sans-serif", cursor:'pointer', letterSpacing:'.04em' }}>
          🔑 J'ai déjà un code — me connecter
        </button>
      </div>

      <div style={{ padding:'12px 16px', background:'rgba(232,192,96,0.08)', border:'1px solid rgba(232,192,96,0.25)', borderRadius:12 }}>
        <div style={{ fontSize:12, color:'#e8c060', fontWeight:500, marginBottom:4 }}>⏳ Validation requise</div>
        <div style={{ fontSize:11, color:'rgba(242,237,224,0.55)', lineHeight:1.7 }}>
          Après inscription, votre compte est examiné par notre équipe sous 48h. Vous pourrez vous connecter et vendre dès validation.
        </div>
      </div>
    </div>
  )
}

// ── Vue choix type ───────────────────────────────────────────
function VueChoixType({ onChoix, onBack }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(242,237,224,0.35)', fontSize:12, cursor:'pointer', padding:0 }}>← Retour</button>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:300, color:'#f2ede0' }}>Créer mon compte</div>
      </div>
      <p style={{ fontSize:12, color:'rgba(242,237,224,0.45)', lineHeight:1.75 }}>Quel type de vendeur êtes-vous ?</p>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <button onClick={() => onChoix('particulier')}
          style={{ padding:'18px 20px', borderRadius:14, border:'1px solid rgba(150,212,133,0.30)', background:'rgba(150,212,133,0.06)', cursor:'pointer', textAlign:'left', display:'flex', flexDirection:'column', gap:5 }}>
          <div style={{ fontSize:20 }}>🌱</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:19, color:'#f2ede0', fontWeight:300 }}>Particulier</div>
          <div style={{ fontSize:11, color:'rgba(242,237,224,0.40)', lineHeight:1.6 }}>Créations personnelles, objets d'occasion, produits artisanaux faits maison.</div>
        </button>
        <button onClick={() => onChoix('professionnel')}
          style={{ padding:'18px 20px', borderRadius:14, border:'1px solid rgba(130,200,240,0.30)', background:'rgba(130,200,240,0.05)', cursor:'pointer', textAlign:'left', display:'flex', flexDirection:'column', gap:5 }}>
          <div style={{ fontSize:20 }}>🏪</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:19, color:'#f2ede0', fontWeight:300 }}>Professionnel</div>
          <div style={{ fontSize:11, color:'rgba(242,237,224,0.40)', lineHeight:1.6 }}>Entreprise, marque ou activité commerciale déclarée.</div>
        </button>
      </div>
    </div>
  )
}

const INP_STYLE = { padding:'10px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg2)', color:'rgba(242,237,224,0.92)', fontSize:13, fontFamily:"'Jost',sans-serif", outline:'none', width:'100%', boxSizing:'border-box', appearance:'none', WebkitAppearance:'none' }
const LBL_STYLE = { fontSize:11, color:'rgba(242,237,224,0.70)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:7, display:'block', fontWeight:500 }

function ErrBox({ msg }) {
  if (!msg) return null
  const isPending = msg.includes('en attente') || msg.includes('vérifié ✓')
  return (
    <div style={{ fontSize:12, lineHeight:1.7, borderRadius:8, padding:'10px 14px',
      color: isPending ? '#e8c060' : '#e87060',
      background: isPending ? 'rgba(232,192,96,0.08)' : 'rgba(232,96,96,0.08)',
      border: isPending ? '1px solid rgba(232,192,96,0.25)' : '1px solid rgba(232,96,96,0.25)',
      whiteSpace: 'pre-line' }}>
      {msg}
    </div>
  )
}

async function sendOtp(email) {
  return supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
}

// ── Vue formulaire Particulier ───────────────────────────────
function VueFormParticulier({ onSuccess, onBack }) {
  const [prenom,    setPrenom]    = useState('')
  const [nom,       setNom]       = useState('')
  const [age,       setAge]       = useState('')
  const [code,      setCode]      = useState('')
  const [email,     setEmail]     = useState('')
  const [telephone, setTelephone] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState('')

  const codeOk = code.length >= 8 && /[A-Z]/.test(code) && /[a-z]/.test(code) && /[0-9]/.test(code)
  const codeHints = [
    { ok: code.length >= 8,   label: '8 caractères min' },
    { ok: /[A-Z]/.test(code), label: '1 majuscule' },
    { ok: /[a-z]/.test(code), label: '1 minuscule' },
    { ok: /[0-9]/.test(code), label: '1 chiffre' },
  ]

  const handleSubmit = async () => {
    setErr('')
    if (!prenom.trim()) { setErr('Le prénom est obligatoire.'); return }
    if (!nom.trim())    { setErr('Le nom est obligatoire.'); return }
    const ageNum = parseInt(age)
    if (!age || isNaN(ageNum))  { setErr("L'âge est obligatoire."); return }
    if (ageNum < 18)  { setErr('Vous devez avoir au moins 18 ans.'); return }
    if (ageNum > 120) { setErr('Âge invalide.'); return }
    if (!codeOk) { setErr('Le code vendeur ne respecte pas les critères de sécurité.'); return }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('Adresse email invalide.'); return }
    setSaving(true)
    const { data: existing } = await supabase.from('partenaires').select('id').eq('code_vendeur', code).maybeSingle()
    if (existing) { setSaving(false); setErr('Ce code vendeur est déjà pris.'); return }
    const { error: otpErr } = await sendOtp(email.trim())
    setSaving(false)
    if (otpErr) { setErr("Envoi impossible : " + otpErr.message); return }
    onSuccess({
      prenom: prenom.trim(), nom: nom.trim(), age: ageNum,
      nom_boutique: prenom.trim() + ' ' + nom.trim(),
      code_vendeur: code,
      email: email.trim(), telephone: telephone.trim() || null,
      type_vendeur: 'particulier', statut: 'en_attente', publication_mode: 'validation',
    }, email.trim())
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(242,237,224,0.35)', fontSize:12, cursor:'pointer', padding:0 }}>← Retour</button>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:300, color:'#f2ede0' }}>Compte Particulier</div>
          <div style={{ fontSize:10, color:'rgba(150,212,133,0.60)', marginTop:2 }}>🌱 Vente d'articles d'occasion uniquement</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div><span style={LBL_STYLE}>Prénom *</span><input value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prénom" style={{ ...INP_STYLE }}/></div>
        <div><span style={LBL_STYLE}>Nom *</span><input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom" style={{ ...INP_STYLE }}/></div>
      </div>

      <div style={{ maxWidth:160 }}>
        <span style={LBL_STYLE}>Âge * <span style={{ color:'rgba(242,237,224,0.42)', textTransform:'none', letterSpacing:0 }}>(18 ans minimum)</span></span>
        <input type="number" min="18" max="120" value={age} onChange={e => setAge(e.target.value)} placeholder="Votre âge"
          style={{ ...INP_STYLE, borderColor: age && parseInt(age) < 18 ? '#e87060' : undefined }}/>
        {age && parseInt(age) < 18 && <div style={{ fontSize:10, color:'#e87060', marginTop:4 }}>Accès réservé aux +18 ans.</div>}
      </div>

      <div>
        <span style={LBL_STYLE}>Code vendeur * <span style={{ color:'rgba(242,237,224,0.42)', textTransform:'none', letterSpacing:0 }}>(votre clé de connexion)</span></span>
        <input value={code} onChange={e => setCode(e.target.value.replace(/\s/g, ''))} placeholder="Ex : MonCode42" style={{ ...INP_STYLE, borderColor: code.length > 0 ? (codeOk ? 'rgba(150,212,133,0.40)' : 'rgba(232,192,96,0.35)') : undefined }}/>
        {code.length > 0 && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
            {codeHints.map(h => (
              <span key={h.label} style={{ fontSize:10, padding:'2px 8px', borderRadius:20,
                background: h.ok ? 'rgba(150,212,133,0.10)' : 'rgba(255,255,255,0.03)',
                border: h.ok ? '1px solid rgba(150,212,133,0.28)' : '1px solid rgba(255,255,255,0.07)',
                color: h.ok ? '#96d485' : 'rgba(242,237,224,0.28)' }}>
                {h.ok ? '✓' : '·'} {h.label}
              </span>
            ))}
          </div>
        )}
        <div style={{ fontSize:10, color:'rgba(242,237,224,0.45)', marginTop:6 }}>Conservez-le soigneusement — c'est votre seul accès.</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <span style={LBL_STYLE}>Email * <span style={{ color:'rgba(242,237,224,0.42)', textTransform:'none', letterSpacing:0 }}>(vérification)</span></span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" style={{ ...INP_STYLE }}/>
        </div>
        <div>
          <span style={LBL_STYLE}>Téléphone <span style={{ color:'rgba(242,237,224,0.42)', textTransform:'none', letterSpacing:0 }}>(optionnel)</span></span>
          <input value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="06 XX XX XX XX" style={{ ...INP_STYLE }}/>
        </div>
      </div>

      <ErrBox msg={err} />

      <button onClick={handleSubmit} disabled={saving}
        style={{ padding:'13px', borderRadius:12, border:'1px solid rgba(150,212,133,0.40)', background:'rgba(150,212,133,0.10)', color:'#96d485', fontSize:13, fontFamily:"'Jost',sans-serif", cursor: saving ? 'wait' : 'pointer', fontWeight:500, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Envoi…' : '→ Recevoir mon code de vérification'}
      </button>
    </div>
  )
}

// ── Vue formulaire Professionnel ─────────────────────────────
function VueFormPro({ onSuccess, onBack }) {
  const [nomBoutique,   setNomBoutique]   = useState('')
  const [nomEntreprise, setNomEntreprise] = useState('')
  const [siret,         setSiret]         = useState('')
  const [telephone,     setTelephone]     = useState('')
  const [siteWeb,       setSiteWeb]       = useState('')
  const [code,          setCode]          = useState('')
  const [email,         setEmail]         = useState('')
  const [desc,          setDesc]          = useState('')
  const [saving,        setSaving]        = useState(false)
  const [err,           setErr]           = useState('')

  const codeOk = code.length >= 8 && /[A-Z]/.test(code) && /[a-z]/.test(code) && /[0-9]/.test(code)
  const codeHints = [
    { ok: code.length >= 8,   label: '8 caractères min' },
    { ok: /[A-Z]/.test(code), label: '1 majuscule' },
    { ok: /[a-z]/.test(code), label: '1 minuscule' },
    { ok: /[0-9]/.test(code), label: '1 chiffre' },
  ]
  const siretOk = /^\d{14}$/.test(siret)

  const handleSubmit = async () => {
    setErr('')
    if (!nomBoutique.trim())   { setErr("Le nom de la boutique est obligatoire."); return }
    if (!nomEntreprise.trim()) { setErr("Le nom de l'entreprise est obligatoire."); return }
    if (!siret.trim())         { setErr('Le numéro SIRET est obligatoire.'); return }
    if (!siretOk)              { setErr('Le SIRET doit contenir exactement 14 chiffres.'); return }
    if (!codeOk)               { setErr('Le code vendeur ne respecte pas les critères de sécurité.'); return }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('Adresse email invalide.'); return }
    setSaving(true)
    const { data: existing } = await supabase.from('partenaires').select('id').eq('code_vendeur', code).maybeSingle()
    if (existing) { setSaving(false); setErr('Ce code vendeur est déjà pris.'); return }
    const { error: otpErr } = await sendOtp(email.trim())
    setSaving(false)
    if (otpErr) { setErr("Envoi impossible : " + otpErr.message); return }
    onSuccess({
      nom_boutique: nomBoutique.trim(), code_vendeur: code,
      email: email.trim(), description: desc.trim() || null,
      nom_entreprise: nomEntreprise.trim(),
      siret: siret.trim(), telephone: telephone.trim() || null,
      site_web: siteWeb.trim() || null,
      type_vendeur: 'professionnel', statut: 'en_attente', publication_mode: 'validation',
    }, email.trim())
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(242,237,224,0.35)', fontSize:12, cursor:'pointer', padding:0 }}>← Retour</button>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:300, color:'#f2ede0' }}>Compte Professionnel</div>
          <div style={{ fontSize:10, color:'rgba(130,200,240,0.60)', marginTop:2 }}>🏪 Vendeur professionnel</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div><span style={LBL_STYLE}>Nom de la boutique *</span><input value={nomBoutique} onChange={e => setNomBoutique(e.target.value)} placeholder="Nom visible" style={{ ...INP_STYLE }}/></div>
        <div><span style={LBL_STYLE}>Nom de l'entreprise *</span><input value={nomEntreprise} onChange={e => setNomEntreprise(e.target.value)} placeholder="Raison sociale" style={{ ...INP_STYLE }}/></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <span style={LBL_STYLE}>SIRET * <span style={{ color:'rgba(242,237,224,0.42)', textTransform:'none', letterSpacing:0 }}>(14 chiffres)</span></span>
          <input value={siret} onChange={e => setSiret(e.target.value.replace(/\D/g,'').slice(0,14))} placeholder="00000000000000" maxLength={14}
            style={{ ...INP_STYLE, borderColor: siret.length > 0 ? (siretOk ? 'rgba(150,212,133,0.40)' : 'rgba(232,192,96,0.35)') : undefined }}/>
          {siret.length > 0 && !siretOk && <div style={{ fontSize:10, color:'rgba(232,192,96,0.70)', marginTop:4 }}>{siret.length}/14 chiffres</div>}
        </div>
        <div><span style={LBL_STYLE}>Téléphone</span><input value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="06 XX XX XX XX" style={{ ...INP_STYLE }}/></div>
      </div>

      <div><span style={LBL_STYLE}>Site web</span><input value={siteWeb} onChange={e => setSiteWeb(e.target.value)} placeholder="https://..." style={{ ...INP_STYLE }}/></div>

      <div>
        <span style={LBL_STYLE}>Code vendeur * <span style={{ color:'rgba(242,237,224,0.42)', textTransform:'none', letterSpacing:0 }}>(votre clé de connexion)</span></span>
        <input value={code} onChange={e => setCode(e.target.value.replace(/\s/g,''))} placeholder="Ex : MaBoutique42"
          style={{ ...INP_STYLE, borderColor: code.length > 0 ? (codeOk ? 'rgba(150,212,133,0.40)' : 'rgba(232,192,96,0.35)') : undefined }}/>
        {code.length > 0 && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
            {codeHints.map(h => (
              <span key={h.label} style={{ fontSize:10, padding:'2px 8px', borderRadius:20,
                background: h.ok ? 'rgba(150,212,133,0.10)' : 'rgba(255,255,255,0.03)',
                border: h.ok ? '1px solid rgba(150,212,133,0.28)' : '1px solid rgba(255,255,255,0.07)',
                color: h.ok ? '#96d485' : 'rgba(242,237,224,0.28)' }}>
                {h.ok ? '✓' : '·'} {h.label}
              </span>
            ))}
          </div>
        )}
        <div style={{ fontSize:10, color:'rgba(242,237,224,0.45)', marginTop:6 }}>Conservez-le soigneusement — c'est votre seul accès.</div>
      </div>

      <div>
        <span style={LBL_STYLE}>Email professionnel * <span style={{ color:'rgba(242,237,224,0.42)', textTransform:'none', letterSpacing:0 }}>(vérification requise)</span></span>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@entreprise.com" style={{ ...INP_STYLE }}/>
      </div>

      <div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><span style={LBL_STYLE}>Description</span><span style={{ fontSize:10, color:'rgba(242,237,224,0.22)' }}>{desc.length}/250</span></div>
        <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0,250))} rows={3} placeholder="Décrivez vos produits et votre activité…" style={{ ...INP_STYLE, resize:'none', lineHeight:1.7 }}/>
      </div>

      <ErrBox msg={err} />

      <button onClick={handleSubmit} disabled={saving}
        style={{ padding:'13px', borderRadius:12, border:'1px solid rgba(130,200,240,0.35)', background:'rgba(130,200,240,0.08)', color:'#82c8f0', fontSize:13, fontFamily:"'Jost',sans-serif", cursor: saving ? 'wait' : 'pointer', fontWeight:500, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Envoi…' : '→ Recevoir mon code de vérification'}
      </button>
    </div>
  )
}

// ── Vue vérification email OTP ───────────────────────────────
function VueVerification({ email, pendingData, onSuccess, onBack }) {
  const [otp,      setOtp]      = useState('')
  const [loading,  setLoading]  = useState(false)
  const [resending,setResending]= useState(false)
  const [sent,     setSent]     = useState(false)
  const [err,      setErr]      = useState('')

  const handleVerify = async () => {
    setErr('')
    if (otp.length !== 8) { setErr('Le code fait 8 chiffres.'); return }
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'magiclink' })
    if (error) { setLoading(false); setErr('Code invalide ou expiré. Vérifiez votre boîte mail.'); return }
    const { error: insErr } = await supabase.from('partenaires').insert({ ...pendingData, email_verified: true })
    setLoading(false)
    if (insErr) {
      if (insErr.code === '23505') setErr('Ce code vendeur est déjà pris.')
      else setErr('Erreur : ' + insErr.message)
      return
    }
    onSuccess()
  }

  const handleResend = async () => {
    setResending(true)
    await sendOtp(email)
    setResending(false); setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(242,237,224,0.35)', fontSize:12, cursor:'pointer', padding:0 }}>← Retour</button>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:300, color:'#f2ede0' }}>Vérification email</div>
      </div>

      <div style={{ padding:'14px 16px', background:'rgba(150,212,133,0.06)', border:'1px solid rgba(150,212,133,0.20)', borderRadius:12 }}>
        <div style={{ fontSize:12, color:'rgba(242,237,224,0.70)', lineHeight:1.75 }}>
          Un code à 6 chiffres a été envoyé à<br/><strong style={{ color:'#96d485' }}>{email}</strong>
        </div>
        <div style={{ fontSize:11, color:'rgba(242,237,224,0.35)', marginTop:8 }}>Vérifiez vos spams. Expire dans 1h.</div>
      </div>

      <div>
        <span style={LBL_STYLE}>Code de vérification</span>
        <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,8))}
          onKeyDown={e => e.key === 'Enter' && otp.length === 8 && handleVerify()}
          placeholder="00000000" maxLength={8}
          style={{ ...INP_STYLE, fontSize:24, letterSpacing:'0.4em', textAlign:'center', fontFamily:"'Cormorant Garamond',serif", fontWeight:300 }}/>
      </div>

      <ErrBox msg={err} />

      <button onClick={handleVerify} disabled={loading || otp.length !== 8}
        style={{ padding:'13px', borderRadius:12, border:'1px solid rgba(150,212,133,0.40)', background:'rgba(150,212,133,0.10)', color:'#96d485', fontSize:13, fontFamily:"'Jost',sans-serif", cursor:(loading||otp.length!==8)?'not-allowed':'pointer', fontWeight:500, opacity:(loading||otp.length!==8)?0.5:1 }}>
        {loading ? 'Vérification…' : '✓ Valider et créer mon compte'}
      </button>

      <div style={{ textAlign:'center' }}>
        <button onClick={handleResend} disabled={resending}
          style={{ background:'none', border:'none', color:'rgba(242,237,224,0.35)', fontSize:11, cursor:'pointer', fontFamily:"'Jost',sans-serif", textDecoration:'underline' }}>
          {resending ? 'Envoi…' : sent ? '✓ Code renvoyé !' : 'Renvoyer le code'}
        </button>
      </div>

      <p style={{ fontSize:10, color:'rgba(242,237,224,0.22)', lineHeight:1.7, textAlign:'center' }}>
        Compte créé après vérification.<br/>Activé par l'équipe sous 48h.
      </p>
    </div>
  )
}


// ── Vue connexion ────────────────────────────────────────────
function VueConnexion({ onSuccess, onBack }) {
  const [code,  setCode]  = useState('')
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  const inp = { padding:'12px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.04)', color:'rgba(242,237,224,0.85)', fontSize:14, fontFamily:"'Jost',sans-serif", outline:'none', width:'100%', boxSizing:'border-box', letterSpacing:'.04em' }

  const handleLogin = async () => {
    setErr('')
    if (!code.trim()) { setErr('Entrez votre code vendeur.'); return }
    setLoading(true)
    const { data, error } = await supabase.from('partenaires')
      .select('*').eq('code_vendeur', code.trim()).single()
    setLoading(false)
    if (error || !data) { setErr('Code vendeur introuvable. Vérifiez votre saisie.'); return }
    if (data.statut === 'en_attente') {
      setErr('Votre compte a bien été créé et votre email vérifié ✓\nIl est en attente de validation par l\'équipe (sous 48h). Vous recevrez un email dès son activation.')
      return
    }
    if (data.statut === 'suspendu')   { setErr('Votre compte a été suspendu. Contactez l\'administrateur.'); return }
    onSuccess(data)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(242,237,224,0.35)', fontSize:12, cursor:'pointer', padding:0 }}>← Retour</button>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:300, color:'#f2ede0' }}>Connexion Partenaire</div>
      </div>

      <div>
        <div style={{ fontSize:11, color:'rgba(242,237,224,0.70)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8, fontWeight:500 }}>Code vendeur</div>
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="votre-code-vendeur"
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ ...inp }}/>
      </div>

      {err && <div style={{ fontSize:12, color:'#e87060', background:'rgba(232,96,96,0.08)', border:'1px solid rgba(232,96,96,0.25)', borderRadius:8, padding:'10px 14px' }}>{err}</div>}

      <button onClick={handleLogin} disabled={loading}
        style={{ padding:'13px', borderRadius:12, border:'1px solid rgba(150,212,133,0.40)', background:'rgba(150,212,133,0.10)', color:'#96d485', fontSize:13, fontFamily:"'Jost',sans-serif", cursor: loading ? 'wait' : 'pointer', fontWeight:500, opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Connexion…' : '→ Accéder à mon espace'}
      </button>
    </div>
  )
}

// ── Vue espace vendeur ───────────────────────────────────────
function VueEspace({ partenaire, onLogout, onProductAdded }) {
  const [produits,  setProduits]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editId,    setEditId]    = useState(null) // null = création, sinon UUID
  const [saving,    setSaving]    = useState(false)
  const [form,      setForm]      = useState({ type:'physique', categorie:'Autre', titre:'', description:'', prix:'', image_url:'', lien_externe:'' })

  const EMPTY_FORM = { type:'digital', categorie:'Audio', titre:'', description:'', prix:'', image_url:'', lien_externe:'', storage_path:'', accepte_lumens:false, prix_lumens:'' }
  const CAT_OPTS = { digital:['Audio','Formation','E-book'], physique:['Livre','Bijou','Pierre','Huile essentielle','Autre'], occasion:['Livre','Bijou','Pierre','Accessoire','Autre'] }
  const inp = { padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:13, fontFamily:"'Jost',sans-serif", outline:'none', width:'100%', boxSizing:'border-box', appearance:'none', WebkitAppearance:'none' }
  const lbl = { fontSize:11, color:'rgba(242,237,224,0.70)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:7, display:'block', fontWeight:500 }

  const [audioUploading, setAudioUploading] = useState(false)

  const UPLOAD_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '') + '/functions/v1/partenaire-upload'

  const handleAudioUpload = async (file) => {
    if (!file) return
    console.log('[upload] partenaire:', partenaire)
    console.log('[upload] code_vendeur:', partenaire.code_vendeur)
    setAudioUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('code_vendeur', partenaire.code_vendeur)
    try {
      const res = await fetch(UPLOAD_URL, { method:'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { alert('Upload : ' + (data.error || 'erreur')); setAudioUploading(false); return }
      setForm(f => ({ ...f, storage_path: data.storage_path }))
    } catch (e) { alert('Erreur réseau : ' + e.message) }
    setAudioUploading(false)
  }

  const loadProduits = () => {
    setLoading(true)
    supabase.from('produits').select('*').eq('partenaire_id', partenaire.id).order('created_at', { ascending:false })
      .then(({ data }) => { setProduits(data || []); setLoading(false) })
  }
  useEffect(() => { loadProduits() }, [])

  const openEdit = (p) => {
    setForm({ type:p.type, categorie:p.categorie||'Autre', titre:p.titre||'', description:p.description||'', prix:p.prix??'', image_url:p.image_url||'', lien_externe:p.lien_externe||'', storage_path:p.storage_path||'', accepte_lumens:p.accepte_lumens||false, prix_lumens:p.prix_lumens??'' })
    setEditId(p.id)
    setShowForm(true)
  }

  const openNew = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowForm(true)
  }

  const PARTENAIRE_STRIPE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '') + '/functions/v1/partenaire-stripe'

  const handleSubmit = async () => {
    if (!form.titre.trim()) { alert('Titre obligatoire'); return }
    setSaving(true)
    const statut = partenaire.publication_mode === 'direct' ? 'actif' : 'en_attente'
    const payload = { ...form, prix: form.prix !== '' ? parseFloat(form.prix) : null, updated_at: new Date().toISOString() }

    let savedId = editId
    if (editId) {
      const { error } = await supabase.from('produits').update(payload).eq('id', editId).eq('partenaire_id', partenaire.id)
      setSaving(false)
      if (error) { alert('Erreur : ' + error.message); return }
    } else {
      const { data, error } = await supabase.from('produits')
        .insert({ ...payload, partenaire_id: partenaire.id, vendeur_nom: partenaire.nom_boutique, statut, created_at: new Date().toISOString() })
        .select('id').single()
      if (error) { setSaving(false); alert('Erreur : ' + error.message); return }
      savedId = data.id
      if (partenaire.publication_mode === 'direct') onProductAdded()
    }

    // Création Stripe automatique uniquement si publication directe
    if (form.type === 'digital' && form.prix && partenaire.publication_mode === 'direct' && savedId) {
      try {
        const res = await fetch(PARTENAIRE_STRIPE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produit_id: savedId, code_vendeur: partenaire.code_vendeur,
            titre: form.titre, description: form.description,
            prix: form.prix, image_url: form.image_url,
          }),
        })
        const data = await res.json()
        if (!res.ok) console.warn('[partenaire-stripe] erreur:', data.error)
      } catch (e) { console.warn('[partenaire-stripe] réseau:', e) }
    }

    setSaving(false)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    loadProduits()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return
    await supabase.from('produits').delete().eq('id', id).eq('partenaire_id', partenaire.id)
    loadProduits()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:300, color:'#f2ede0' }}>{partenaire.nom_boutique}</div>
          <div style={{ fontSize:10, color:'rgba(242,237,224,0.35)', marginTop:3 }}>
            {partenaire.publication_mode === 'direct'
              ? '✓ Publication directe activée'
              : '⏳ Vos produits sont soumis à validation avant publication'}
          </div>
        </div>
        <button onClick={onLogout} style={{ background:'none', border:'1px solid rgba(255,255,255,0.10)', borderRadius:8, color:'rgba(242,237,224,0.35)', fontSize:11, cursor:'pointer', padding:'6px 12px', fontFamily:"'Jost',sans-serif" }}>
          Déconnexion
        </button>
      </div>

      {/* Bouton ajouter */}
      {!showForm && (
        <button onClick={openNew}
          style={{ padding:'12px', borderRadius:12, border:'1px solid rgba(150,212,133,0.35)', background:'rgba(150,212,133,0.08)', color:'#96d485', fontSize:13, fontFamily:"'Jost',sans-serif", cursor:'pointer', fontWeight:500 }}>
          + Proposer un nouveau produit
        </button>
      )}

      {/* Formulaire ajout/édition */}
      {showForm && (
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:'rgba(242,237,224,0.80)' }}>
              {editId ? 'Modifier le produit' : 'Nouveau produit'}
            </div>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }}
              style={{ background:'none', border:'none', color:'rgba(242,237,224,0.35)', fontSize:16, cursor:'pointer' }}>✕</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <span style={lbl}>Choix du support</span>
              <div style={{ padding:'9px 12px', borderRadius:8, border:'1px solid rgba(180,160,240,0.30)', background:'rgba(180,160,240,0.08)', color:'#b4a0f0', fontSize:13, fontFamily:"'Jost',sans-serif" }}>
                🎧 Digital
              </div>
            </div>
            <div>
              <span style={lbl}>Catégorie</span>
              <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie:e.target.value }))} style={{ ...inp, appearance:'none' }}>
                {(CAT_OPTS['digital']||[]).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <span style={lbl}>Titre *</span>
            <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre:e.target.value }))} placeholder="Nom du produit" style={{ ...inp }}/>
          </div>

          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={lbl}>Description</span>
              <span style={{ fontSize:10, color:'rgba(242,237,224,0.22)' }}>{form.description.length} / 350</span>
            </div>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value.slice(0,350) }))} rows={3} style={{ ...inp, resize:'none', lineHeight:1.7 }}/>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <span style={lbl}>Prix (€)</span>
              <input type="number" min="0" step="0.01" value={form.prix} onChange={e => setForm(f => ({ ...f, prix:e.target.value }))} placeholder="0.00" style={{ ...inp }}/>
            </div>
            <div>
              <span style={lbl}>URL image</span>
              <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url:e.target.value }))} placeholder="https://..." style={{ ...inp }}/>
            </div>
          </div>

          <div>
            <span style={lbl}>Lien de téléchargement / boutique</span>
            <input value={form.lien_externe} onChange={e => setForm(f => ({ ...f, lien_externe:e.target.value }))} placeholder="Ex: gumroad.com/l/votre-produit, drive.google.com/…" style={{ ...inp }}/>
            <div style={{ fontSize:10, color:'rgba(242,237,224,0.45)', marginTop:5, lineHeight:1.6 }}>Lien où vos acheteurs accèderont au fichier ou à la boutique. Peut être Gumroad, Google Drive, votre site…</div>
          </div>

          {/* Paiement en Lumens */}
          <div style={{ padding:'12px 14px', background:'rgba(232,192,96,0.06)', border:'1px solid rgba(232,192,96,0.18)', borderRadius:10 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: form.accepte_lumens ? 10 : 0 }}>
              <div>
                <div style={{ fontSize:12, color:'rgba(242,237,224,0.80)', fontWeight:500 }}>✦ Accepter les Lumens</div>
                <div style={{ fontSize:10, color:'rgba(242,237,224,0.35)', marginTop:2 }}>L'acheteur pourra payer en Lumens ou en euros</div>
              </div>
              <div onClick={() => setForm(f => ({ ...f, accepte_lumens:!f.accepte_lumens }))}
                style={{ width:40, height:22, borderRadius:100, cursor:'pointer', flexShrink:0,
                  background: form.accepte_lumens ? 'rgba(232,192,96,0.35)' : 'rgba(255,255,255,0.08)',
                  border:`1px solid ${form.accepte_lumens ? 'rgba(232,192,96,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  position:'relative', transition:'all .25s' }}>
                <div style={{ position:'absolute', top:3, left: form.accepte_lumens ? 20 : 3, width:14, height:14, borderRadius:'50%',
                  background: form.accepte_lumens ? '#e8c060' : 'rgba(255,255,255,0.25)', transition:'left .25s' }}/>
              </div>
            </div>
            {form.accepte_lumens && (
              <div>
                <span style={lbl}>Prix en Lumens ✦</span>
                <input type="number" min="1" value={form.prix_lumens} onChange={e => setForm(f => ({ ...f, prix_lumens:e.target.value }))}
                  placeholder="Ex: 50" style={{ ...inp, maxWidth:140 }}/>
              </div>
            )}
          </div>

          {/* Upload audio — uniquement pour les produits digitaux */}
          {form.type === 'digital' && (
            <div>
              <span style={lbl}>Fichier audio <span style={{ color:'rgba(242,237,224,0.35)', textTransform:'none', letterSpacing:0, fontWeight:300 }}>(lecture sécurisée dans l'app)</span></span>
              <label style={{ display:'block', padding:'12px 14px', borderRadius:8, border:`1px dashed ${form.storage_path ? 'rgba(150,212,133,0.40)' : 'rgba(255,255,255,0.15)'}`, background: form.storage_path ? 'rgba(150,212,133,0.06)' : 'rgba(255,255,255,0.03)', color: form.storage_path ? '#96d485' : 'rgba(242,237,224,0.45)', fontSize:12, cursor: audioUploading ? 'wait' : 'pointer', fontFamily:"'Jost',sans-serif", textAlign:'center', transition:'all .2s' }}>
                <input type="file" accept="audio/*" style={{ display:'none' }} onChange={e => handleAudioUpload(e.target.files[0])} disabled={audioUploading}/>
                {audioUploading ? '⏳ Upload en cours…' : form.storage_path ? '✓ Fichier audio chargé' : '📁 Choisir un fichier audio (MP3, WAV, AAC…)'}
              </label>
              {form.storage_path && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                  <div style={{ fontSize:10, color:'rgba(242,237,224,0.35)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                    {form.storage_path.split('/').pop()}
                  </div>
                  <button onClick={() => setForm(f => ({ ...f, storage_path:'' }))}
                    style={{ background:'none', border:'none', color:'rgba(255,140,140,0.60)', fontSize:11, cursor:'pointer', flexShrink:0, marginLeft:8 }}>
                    ✕ Supprimer
                  </button>
                </div>
              )}
              <div style={{ fontSize:10, color:'rgba(242,237,224,0.28)', marginTop:5 }}>Non téléchargeable · Accès limité aux acheteurs</div>
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={handleSubmit} disabled={saving}
              style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid rgba(150,212,133,0.40)', background:'rgba(150,212,133,0.10)', color:'#96d485', fontSize:13, fontFamily:"'Jost',sans-serif", cursor: saving ? 'wait' : 'pointer', fontWeight:500, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Envoi…' : editId ? '✓ Mettre à jour' : partenaire.publication_mode === 'direct' ? '✓ Publier' : '✓ Soumettre pour validation'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ padding:'11px 18px', borderRadius:10, border:'1px solid rgba(255,255,255,0.10)', background:'transparent', color:'rgba(242,237,224,0.40)', fontSize:13, fontFamily:"'Jost',sans-serif", cursor:'pointer' }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste produits */}
      <div>
        <div style={{ fontSize:10, color:'rgba(242,237,224,0.30)', letterSpacing:'.10em', textTransform:'uppercase', marginBottom:10 }}>
          Mes produits ({produits.length})
        </div>
        {loading ? (
          <div style={{ fontSize:12, color:'rgba(242,237,224,0.25)', fontStyle:'italic' }}>Chargement…</div>
        ) : produits.length === 0 ? (
          <div style={{ fontSize:12, color:'rgba(242,237,224,0.25)', fontStyle:'italic', padding:'16px 0' }}>Aucun produit pour l'instant.</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {produits.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, color:'rgba(242,237,224,0.80)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.titre}</div>
                  <div style={{ fontSize:10, color:'rgba(242,237,224,0.30)', marginTop:2 }}>
                    {p.categorie} · {p.prix != null ? `${Number(p.prix).toFixed(2)} €` : 'prix libre'}
                  </div>
                </div>
                <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20, flexShrink:0,
                  background: p.statut==='actif' ? 'rgba(150,212,133,0.10)' : p.statut==='en_attente' ? 'rgba(232,192,96,0.10)' : 'rgba(255,255,255,0.04)',
                  border: p.statut==='actif' ? '1px solid rgba(150,212,133,0.25)' : p.statut==='en_attente' ? '1px solid rgba(232,192,96,0.25)' : '1px solid rgba(255,255,255,0.08)',
                  color: p.statut==='actif' ? '#96d485' : p.statut==='en_attente' ? '#e8c060' : 'rgba(242,237,224,0.30)' }}>
                  {p.statut === 'en_attente' ? '⏳ en attente' : p.statut}
                </span>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={() => openEdit(p)}
                    style={{ padding:'4px 10px', borderRadius:7, fontSize:10, cursor:'pointer', fontFamily:"'Jost',sans-serif", background:'rgba(130,200,240,0.08)', border:'1px solid rgba(130,200,240,0.20)', color:'#82c8f0' }}>
                    ✏ Modifier
                  </button>
                  <button onClick={() => handleDelete(p.id)}
                    style={{ padding:'4px 10px', borderRadius:7, fontSize:10, cursor:'pointer', fontFamily:"'Jost',sans-serif", background:'rgba(210,80,80,0.08)', border:'1px solid rgba(210,80,80,0.20)', color:'rgba(255,140,140,0.65)' }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dashboard ventes — pros uniquement */}
      {partenaire.type_vendeur === 'professionnel' && (
        <VentesDashboard partenaireId={partenaire.id} />
      )}
    </div>
  )
}
