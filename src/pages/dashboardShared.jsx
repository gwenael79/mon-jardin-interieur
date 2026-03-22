// ─────────────────────────────────────────────────────────────────────────────
//  dashboardShared.jsx
//  Utilitaires, hooks, constantes et composants UI partagés entre tous les écrans
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react"
import { supabase } from '../core/supabaseClient'
import '../styles/dashboard.css'

// ── Hook responsive ──────────────────────────────────────────────────────────
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

// ── Edge Function Supabase ───────────────────────────────────────────────────
export async function callModerateCircle(payload) {
  console.log('[moderate-circle] appel:', payload)
  const { data, error } = await supabase.functions.invoke('Moderate-circle', { body: payload })
  console.log('[moderate-circle] réponse:', data, 'erreur:', error)
  if (error) throw new Error(error.message)
  return data
}

// ── Hook profil utilisateur ──────────────────────────────────────────────────
const PROFILE_CACHE_TTL = 5 * 60 * 1000 // 5 min

function profileCacheKey(userId) { return `mji_profile_${userId}` }

export function clearProfileCache(userId) {
  try { localStorage.removeItem(profileCacheKey(userId)) } catch {}
}

export function useProfile(userId) {
  // Initialise depuis le cache localStorage → rendu immédiat, pas de flash
  const [profile, setProfile] = useState(() => {
    if (!userId) return null
    try {
      const raw = localStorage.getItem(profileCacheKey(userId))
      if (raw) {
        const { data, ts } = JSON.parse(raw)
        if (data) return data
      }
    } catch {}
    return null
  })

  useEffect(() => {
    if (!userId) return

    // Vérifier si le cache est encore frais
    try {
      const raw = localStorage.getItem(profileCacheKey(userId))
      if (raw) {
        const { ts } = JSON.parse(raw)
        if (ts && Date.now() - ts < PROFILE_CACHE_TTL) return // frais → pas de fetch
      }
    } catch {}

    // Fetch Supabase en arrière-plan
    supabase
      .from('users')
      .select('display_name, level, xp, xp_next_level, plan, email, premium_until, flower_name')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error('useProfile error:', error.message); return }
        if (!data) return
        setProfile(data)
        // Mettre à jour le cache
        try {
          localStorage.setItem(profileCacheKey(userId), JSON.stringify({ data, ts: Date.now() }))
        } catch {}
      })
  }, [userId])

  return profile
}

// ── Hook Lumens ──────────────────────────────────────────────────────────────
export function useLumens(userId) {
  const [lumens, setLumens] = useState(null)

  // fetchLumens défini une seule fois via useEffect + ref
  async function fetchLumens() {
    if (!userId) return
    const { data } = await supabase
      .from('lumens')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (data) setLumens(data)
  }

  // Chargement initial
  useEffect(() => {
    if (!userId) return
    fetchLumens()
  }, [userId])

  // Polling toutes les 4s — closure stable via userId dans deps
  useEffect(() => {
    if (!userId) return
    const id = setInterval(() => {
      supabase
        .from('lumens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
        .then(({ data }) => { if (data) setLumens(data) })
    }, 4000)
    return () => clearInterval(id)
  }, [userId])

  async function award(amount, reason, meta = null) {
    if (!userId) return
    await supabase.rpc('award_lumens', {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_meta: meta
    })
    // Forcer refresh immédiat après award
    const { data } = await supabase
      .from('lumens').select('*').eq('user_id', userId).maybeSingle()
    if (data) setLumens(data)
  }

  async function refresh() {
    const { data } = await supabase
      .from('lumens').select('*').eq('user_id', userId).maybeSingle()
    if (data) setLumens(data)
  }

  return { lumens, award, refresh }
}

// ── Composant Toast ──────────────────────────────────────────────────────────
export function Toast({ msg }) {
  if (!msg) return null
  return <div className="toast">{msg}</div>
}

// ── Composant LumenBadge ─────────────────────────────────────────────────────
export function LumenBadge({ amount }) {
  const isGain = amount > 0
  return (
    <>
      {/* Keyframes injectés une seule fois */}
      <style>{`
        @keyframes lumenBadgePulse {
          0%, 100% { box-shadow: 0 0 6px color-mix(in srgb, var(--gold) 35%, transparent), 0 0 14px color-mix(in srgb, var(--gold) 12%, transparent); }
          50%       { box-shadow: 0 0 12px color-mix(in srgb, var(--gold) 65%, transparent), 0 0 28px color-mix(in srgb, var(--gold) 25%, transparent); }
        }
        @keyframes lumenOrbPulse {
          0%, 100% { transform: scale(1);    opacity: 0.85; }
          50%       { transform: scale(1.12); opacity: 1;    }
        }
      `}</style>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px 4px 6px', borderRadius: 100,
        background: isGain
          ? 'color-mix(in srgb, var(--gold) 15%, transparent)'
          : 'var(--red2)',
        border: `1px solid ${isGain ? 'color-mix(in srgb, var(--gold) 40%, transparent)' : 'var(--redT)'}`,
        fontSize:'var(--fs-h5, 10px)', fontWeight: 600, letterSpacing: '.04em',
        fontFamily: "'Jost', sans-serif", whiteSpace: 'nowrap',
        color: isGain ? 'var(--gold)' : 'var(--red)',
        pointerEvents: 'none',
        animation: isGain ? 'lumenBadgePulse 3s ease-in-out infinite' : 'none',
      }}>
        {/* Orbe doré — gradient + pulsation */}
        <span style={{
          width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
          background: isGain
            ? 'radial-gradient(circle at 35% 35%, color-mix(in srgb, var(--gold) 90%, white), var(--gold), var(--gold-warm))'
            : 'radial-gradient(circle at 35% 35%, #ffd8d8, #e08080, #c05050)',
          boxShadow: isGain
            ? 'color-mix(in srgb, var(--gold) 70%, transparent) 0 0 5px, color-mix(in srgb, var(--gold) 30%, transparent) 0 0 10px'
            : '0 0 5px var(--redT)',
          display: 'inline-block',
          animation: isGain ? 'lumenOrbPulse 3s ease-in-out infinite' : 'none',
        }} />
        {isGain ? `+${amount}` : amount} ✦
      </span>
    </>
  )
}

// ── Composant LumenOrb ───────────────────────────────────────────────────────
export function LumenOrb({ total = 0, level = 'faible', size = 18 }) {
  return (
    <>
      <style>{`
        @keyframes lumenBadgePulse {
          0%, 100% { box-shadow: 0 0 6px color-mix(in srgb, var(--gold) 35%, transparent), 0 0 14px color-mix(in srgb, var(--gold) 12%, transparent); }
          50%       { box-shadow: 0 0 12px color-mix(in srgb, var(--gold) 65%, transparent), 0 0 28px color-mix(in srgb, var(--gold) 25%, transparent); }
        }
      `}</style>
      <div className={`lumen-orb lumen-halo-${level}`} style={{ width:size, height:size }} />
    </>
  )
}

// ── Constantes thèmes ────────────────────────────────────────────────────────
export const THEMES_LIST = [
  ['🧘', 'Méditation & Souffle'],
  ['🏃', 'Mouvement & Corps'],
  ['🌙', 'Sommeil & Décompression'],
  ['📓', 'Gratitude & Journaling'],
  ['🥗', 'Alimentation consciente'],
  ['🌿', 'Nature & Plein air'],
  ['🎨', 'Créativité & Expression'],
  ['🌸', 'Bien-être général'],
]

export function getThemeEmoji(theme) {
  const found = THEMES_LIST.find(([, label]) => label === theme)
  return found ? found[0] : '🌱'
}

// ── Helpers date ─────────────────────────────────────────────────────────────
export function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (m < 1) return 'à l\'instant'
  if (m < 60) return `il y a ${m} min`
  if (m < 1440) return `il y a ${Math.floor(m/60)}h`
  return 'hier'
}

export function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-FR', { weekday:'short', day:'numeric', month:'short' }).format(new Date(iso))
}

// ── Constantes zones plante ──────────────────────────────────────────────────
export const ZONES = [
  { key:'zone_racines',  icon:'🌱', name:'Racines',  color:'var(--zone-roots)' },
  { key:'zone_tige',     icon:'🌿', name:'Tige',     color:'var(--zone-stem)' },
  { key:'zone_feuilles', icon:'🍃', name:'Feuilles', color:'var(--zone-leaves)' },
  { key:'zone_fleurs',   icon:'🌸', name:'Fleurs',   color:'var(--zone-flowers)' },
  { key:'zone_souffle',  icon:'🌬️', name:'Souffle',  color:'var(--zone-breath)' },
]

// ── Composant LumensCard ─────────────────────────────────────────────────────
const LUMEN_PACKS = [
  { lumens: 50,  price: 20, label: 'Lumens Graines', icon: '🌱', priceId: 'price_1TAs4GFtS3pnlbfxqzSKAWIt' },
  { lumens: 100, price: 40, label: 'Floraison',      icon: '🌸', priceId: 'price_1TAs5bFtS3pnlbfxy4wQAfOE' },
  { lumens: 150, price: 80, label: 'Rayonnement',    icon: '✦',  priceId: 'price_1TAs60FtS3pnlbfxayTbh2gH' },
]

export function LumensCard({ lumens, userId, awardLumens, onRefresh }) {
  const [buyingPack, setBuyingPack] = useState(null)

  async function handleBuyLumens(pack) {
    if (buyingPack) return
    setBuyingPack(pack.priceId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Non connecté')
      const origin = window.location.origin
      const res = await supabase.functions.invoke('stripe-checkout', {
        body: {
          priceId:    pack.priceId,
          successUrl: origin + '/?lumens=success',
          cancelUrl:  origin + '/?lumens=cancel',
        },
        headers: { Authorization: 'Bearer ' + token },
      })
      if (res.error) throw res.error
      if (res.data?.url) window.location.href = res.data.url
    } catch (e) {
      console.error('[LumensCard] Erreur achat:', e)
      alert('Une erreur est survenue, veuillez réessayer.')
    } finally {
      setBuyingPack(null)
    }
  }
  const [tab, setTab]               = useState('history')
  const [history, setHistory]       = useState([])
  const [loadingH, setLoadingH]     = useState(false)
  const [transferAmt, setTransferAmt] = useState(10)
  const [exportCode, setExportCode] = useState(null)
  const [importInput, setImportInput] = useState('')
  const [importStatus, setImportStatus] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  const total     = lumens?.total     ?? 0
  const available  = lumens?.available  ?? 0
  const level      = lumens?.level      ?? 'faible'

  const LEVEL_LABELS = { faible:'Lumière faible', halo:'Halo visible', aura:'Aura douce', rayonnement:'Rayonnement actif' }
  const LEVEL_COLOR  = { faible:'var(--text3)', halo:'var(--gold)', aura:'var(--gold)', rayonnement:'var(--gold)' }

  // Charge l'historique quand on arrive sur l'onglet ou sur refresh
  function loadHistory() {
    if (!userId) return
    supabase
      .from('lumen_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { setHistory(data ?? []); setLoadingH(false) })
  }

  useEffect(() => {
    if (tab !== 'history' || !userId) return
    setLoadingH(true)
    loadHistory()
  }, [tab, userId, refreshTick])

  // Polling historique toutes les 5s quand l'onglet est actif
  useEffect(() => {
    if (tab !== 'history' || !userId) return
    const id = setInterval(loadHistory, 5000)
    return () => clearInterval(id)
  }, [tab, userId])

  // Génère un code de transfert sortant
  async function handleExport() {
    if (transferAmt < 1 || transferAmt > available) return
    setLoading(true)
    setExportCode(null)
    try {
      const { data, error } = await supabase.rpc('create_lumen_transfer', {
        p_user_id: userId, p_amount: transferAmt
      })
      if (error) { console.error('[handleExport]', error.message); return }
      // Le RPC retourne soit la string directement, soit un objet { code }
      const code = typeof data === 'string' ? data : (data?.code ?? null)
      setExportCode(code)
      // Rafraîchir le compteur immédiatement après le débit
      if (onRefresh) onRefresh()
      setRefreshTick(t => t + 1)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  // Consomme un code de transfert entrant
  async function handleImport() {
    const code = importInput.trim()
    if (!code) return
    setLoading(true); setImportStatus(null)
    try {
      const { data, error } = await supabase.rpc('redeem_lumen_transfer', {
        p_user_id: userId, p_code: code
      })
      if (error) { setImportStatus('error'); return }
      // Le RPC retourne soit true/false directement, soit { ok: true }
      const ok = data === true || data?.ok === true
      if (ok) {
        setImportStatus('success')
        setImportInput('')
        // Recharge l'historique et le compteur
        const { data: newHistory } = await supabase
          .from('lumen_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)
        setHistory(newHistory ?? [])
        if (onRefresh) onRefresh()
        setRefreshTick(t => t + 1)
      } else {
        setImportStatus('error')
      }
    } catch { setImportStatus('error') }
    finally { setLoading(false) }
  }

  const tabStyle = (id) => ({
    flex:1, textAlign:'center', padding:'7px', borderRadius:9, fontSize:'var(--fs-h5, 11px)', cursor:'pointer',
    background: tab===id ? 'color-mix(in srgb, var(--gold) 15%, transparent)' : 'var(--surface-2)',
    border: `1px solid ${tab===id ? 'color-mix(in srgb, var(--gold) 35%, transparent)' : 'var(--surface-3)'}`,
    color: tab===id ? 'var(--gold)' : 'var(--text3)',
    transition:'all .2s',
  })

  const inputStyle = {
    width:'100%', boxSizing:'border-box',
    background:'rgba(0,0,0,0.3)', border:'1px solid var(--border2)',
    borderRadius:8, padding:'8px 10px', color:'var(--text2)',
    fontSize:'var(--fs-h4, 13px)', outline:'none',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* ── En-tête orbe + total ── */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px', background:'color-mix(in srgb, var(--gold) 7%, transparent)', borderRadius:12, border:'1px solid color-mix(in srgb, var(--gold) 18%, transparent)' }}>
        <LumenOrb total={available} level={level} size={36} />
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'var(--fs-h2, 26px)', color:'var(--gold)', lineHeight:1 }}>
            {available} <span style={{ fontSize:'var(--fs-emoji-sm, 14px)' }}>✦</span>
          </div>
          <div style={{ fontSize:'var(--fs-h5, 10px)', color: LEVEL_COLOR[level] ?? 'var(--gold)', marginTop:3, letterSpacing:'.06em' }}>
            {LEVEL_LABELS[level] ?? level}
          </div>
          <div style={{ fontSize:'var(--fs-h5, 9px)', color:'var(--gold-warm)', marginTop:2 }}>
            {total} ✦ total
          </div>
        </div>
      </div>

      {/* ── Bloc info Lumens ── */}
      <div style={{ background:'color-mix(in srgb, var(--gold) 5%, transparent)', border:'1px solid color-mix(in srgb, var(--gold) 15%, transparent)', borderRadius:10, padding:'10px 12px', display:'flex', flexDirection:'column', gap:5 }}>
        <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--gold)', letterSpacing:'.06em', fontWeight:500, marginBottom:2 }}>✦ À quoi servent les Lumens ?</div>
        <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text2)', lineHeight:1.6 }}>
          Gagnez des Lumens chaque jour en vous connectant, en complétant vos rituels et en participant à la communauté.
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4, marginTop:2 }}>
          <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text2)', display:'flex', alignItems:'center', gap:6 }}>
            <span>📖</span><span>Accéder à des <span style={{ color:'var(--gold)', fontWeight:500 }}>ateliers exclusifs</span></span>
          </div>
          <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text2)', display:'flex', alignItems:'center', gap:6 }}>
            <span>🌿</span><span>Débloquer des produits dans la <span style={{ color:'var(--gold)', fontWeight:500 }}>Jardinothèque</span></span>
          </div>
          <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text2)', display:'flex', alignItems:'center', gap:6 }}>
            <span>✨</span><span>Faire <span style={{ color:'var(--gold)', fontWeight:500 }}>rayonner votre aura</span> dans le jardin collectif</span>
          </div>
        </div>
      </div>

      {/* ── Onglets ── */}
      <div style={{ display:'flex', gap:6 }}>
        <div style={tabStyle('history')}   onClick={() => setTab('history')}>Historique</div>
        <div style={tabStyle('buy')}       onClick={() => setTab('buy')}>Acheter</div>
        <div style={tabStyle('transfer')}  onClick={() => setTab('transfer')}>Transférer</div>
      </div>

      {/* ══ ONGLET HISTORIQUE ══ */}
      {tab === 'history' && (
        <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:220, overflowY:'auto' }}>
          {loadingH && (
            <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', textAlign:'center', padding:12 }}>Chargement…</div>
          )}
          {!loadingH && history.length === 0 && (
            <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', fontStyle:'italic', padding:'8px 0' }}>Aucune activité pour l'instant</div>
          )}
          {history.map((h, i) => {
            const amt    = h.amount ?? h.delta ?? h.lumens ?? 0
            const reason = h.reason ?? h.label ?? h.type ?? h.description ?? '—'
            const date   = h.created_at ?? h.inserted_at ?? h.date ?? null
            const meta   = h.meta ?? {}

            // Traduction française des raisons
            const REASON_LABELS = {
              daily_login:            '🌅 Connexion quotidienne',
              bilan_matin:            '🌹 Bilan du matin complété',
              ritual_complete:        '🌿 Rituel accompli',
              join_defi:              '✨ Défi rejoint',
              leave_defi:             '✨ Défi quitté',
              inscription_atelier:    '📖 Inscription à un atelier',
              desinscription_atelier: '📖 Désinscription d\'un atelier',
              atelier_payment:        '📖 Paiement atelier en Lumens',
              atelier_refund:         '📖 Remboursement atelier',
              lumen_purchase:         '✦ Achat de Lumens',
              lumen_transfer_sent:    '↗ Lumens envoyés',
              lumen_transfer_received:'↙ Lumens reçus',
              coeur_envoye:           '💐 Bouquet envoyé',
              merci:                  '🙏 Remerciement',
              transfer_out:           '↗ Transfert envoyé',
              transfer_in:            '↙ Transfert reçu',
            }

            // Label enrichi selon les metadata
            let label = REASON_LABELS[reason] ?? reason
            if (reason === 'lumen_purchase' && meta?.lumen_amount) {
              label = `✦ Achat de ${meta.lumen_amount} Lumens`
            }
            if (reason === 'inscription_atelier' && meta?.atelier_id) {
              label = '📖 Inscription à un atelier'
            }

            // Icône selon signe
            const icon = amt > 0 ? '🌱' : '🍂'

            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'var(--surface-1)', borderRadius:9, border:'1px solid var(--border2)' }}>
                <span style={{ fontSize:'var(--fs-h4, 13px)', fontWeight:600, minWidth:44, color: amt > 0 ? 'var(--green)' : 'var(--red)', flexShrink:0 }}>
                  {amt > 0 ? `+${amt}` : amt} ✦
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{label}</div>
                  {date && <div style={{ fontSize:'var(--fs-h5, 9px)', color:'var(--text3)', opacity:0.5, marginTop:2 }}>{timeAgo(date)}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══ ONGLET ACHETER ══ */}
      {tab === 'buy' && (
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', fontStyle:'italic', marginBottom:2 }}>
            Chaque pack crédite votre soleil en Lumens ✦
          </div>
          {LUMEN_PACKS.map(p => {
            const isLoading = buyingPack === p.priceId
            return (
              <div
                key={p.lumens}
                onClick={() => !buyingPack && handleBuyLumens(p)}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'var(--surface-2)', border:'1px solid var(--border2)', borderRadius:10, cursor: buyingPack ? 'default' : 'pointer', transition:'all .2s', gap:8, opacity: buyingPack && !isLoading ? 0.5 : 1 }}
                onMouseEnter={e => { if (!buyingPack) e.currentTarget.style.background='color-mix(in srgb, var(--gold) 9%, transparent)' }}
                onMouseLeave={e => e.currentTarget.style.background='var(--surface-2)'}
              >
                <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
                  <span style={{ fontSize:'var(--fs-emoji-md, 20px)' }}>{p.icon}</span>
                  <div>
                    <div style={{ fontSize:'var(--fs-h5, 12px)', color:'var(--text2)', fontWeight:500 }}>{p.label}</div>
                    <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--gold-warm)', marginTop:1 }}>{p.lumens} ✦</div>
                  </div>
                </div>
                <div style={{ flexShrink:0, padding:'6px 14px', borderRadius:100, fontSize:'var(--fs-h5, 12px)', fontWeight:600, color:'var(--gold)', background:'color-mix(in srgb, var(--gold) 12%, transparent)', border:'1px solid color-mix(in srgb, var(--gold) 30%, transparent)' }}>
                  {isLoading ? '…' : p.price + ' €'}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══ ONGLET TRANSFÉRER ══ */}
      {tab === 'transfer' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

          {/* Envoyer */}
          <div style={{ background:'var(--surface-1)', borderRadius:10, padding:'12px', border:'1px solid var(--border2)' }}>
            <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8 }}>Envoyer des Lumens</div>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
              <input
                type="number" min={1} max={available} value={transferAmt}
                onChange={e => setTransferAmt(Number(e.target.value))}
                style={{ ...inputStyle, flex:1 }}
              />
              <span style={{ fontSize:'var(--fs-h5, 12px)', color:'var(--gold)' }}>✦</span>
            </div>
            {exportCode ? (
              <div style={{ background:'color-mix(in srgb, var(--gold) 10%, transparent)', border:'1px solid color-mix(in srgb, var(--gold) 30%, transparent)', borderRadius:8, padding:'10px', textAlign:'center' }}>
                <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:4 }}>Code de transfert</div>
                <div style={{ fontSize:'var(--fs-h2, 22px)', fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:'var(--gold)', letterSpacing:'4px' }}>{exportCode}</div>
                <div style={{ fontSize:'var(--fs-h5, 10px)', color:'var(--text3)', marginTop:4 }}>Valable 48h</div>
                <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', marginTop:6, cursor:'pointer', textDecoration:'underline' }}
                  onClick={() => navigator.clipboard.writeText(exportCode)}>Copier</div>
              </div>
            ) : (
              <div onClick={!loading ? handleExport : undefined}
                style={{ textAlign:'center', padding:'8px', background:'color-mix(in srgb, var(--gold) 10%, transparent)', border:'1px solid color-mix(in srgb, var(--gold) 25%, transparent)', borderRadius:8, fontSize:'var(--fs-h5, 12px)', color:'var(--gold)', cursor:loading?'default':'pointer', opacity: transferAmt > available ? 0.4 : 1 }}>
                {loading ? '…' : 'Générer un code'}
              </div>
            )}
            {exportCode && (
              <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', textAlign:'center', marginTop:6, cursor:'pointer' }}
                onClick={() => setExportCode(null)}>Nouveau code</div>
            )}
          </div>

          {/* Recevoir */}
          <div style={{ background:'var(--surface-1)', borderRadius:10, padding:'12px', border:'1px solid var(--border2)' }}>
            <div style={{ fontSize:'var(--fs-h5, 11px)', color:'var(--text3)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8 }}>Recevoir des Lumens</div>
            <input
              value={importInput}
              onChange={e => setImportInput(e.target.value.toUpperCase())}
              placeholder='Code de transfert'
              style={{ ...inputStyle, letterSpacing:'3px', marginBottom:8 }}
            />
            <div onClick={handleImport}
              style={{ textAlign:'center', padding:'9px', background: importInput.trim().length > 0 ? 'color-mix(in srgb, var(--green) 18%, transparent)' : 'color-mix(in srgb, var(--green) 6%, transparent)', border:'1px solid color-mix(in srgb, var(--green) 30%, transparent)', borderRadius:8, fontSize:'var(--fs-h5, 12px)', color:'var(--green)', cursor: importInput.trim().length > 0 ? 'pointer' : 'default', transition:'all .2s' }}>
              {loading ? '…' : 'Utiliser ce code'}
            </div>
            {importStatus === 'success' && <div style={{ fontSize:'var(--fs-h5, 12px)', color:'var(--green)', marginTop:8 }}>✓ Lumens reçus avec succès</div>}
            {importStatus === 'error'   && <div style={{ fontSize:'var(--fs-h5, 12px)', color:'var(--red)', marginTop:8 }}>Code invalide ou expiré</div>}
          </div>
        </div>
      )}

    </div>
  )
}
