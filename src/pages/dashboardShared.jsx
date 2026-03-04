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
export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    if (!userId) return
    supabase
      .from('users')
      .select('display_name, level, xp, xp_next_level, plan, email')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('useProfile error:', error.message)
        else setProfile(data)
      })
  }, [userId])
  return profile
}

// ── Hook Lumens ──────────────────────────────────────────────────────────────
export function useLumens(userId) {
  const [lumens, setLumens] = useState(null)
  useEffect(() => {
    if (!userId) return
    supabase.from('lumens').select('*').eq('user_id', userId).maybeSingle()
      .then(({ data }) => setLumens(data))
  }, [userId])

  async function award(amount, reason, meta = null) {
    if (!userId) return
    await supabase.rpc('award_lumens', {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_meta: meta
    })
    const { data } = await supabase.from('lumens').select('*').eq('user_id', userId).maybeSingle()
    setLumens(data)
  }

  return { lumens, award }
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
    <span className={`lumen-badge ${isGain ? 'gain' : 'loss'}`}>
      <span className="lumen-badge-dot" />
      {isGain ? `+${amount}` : amount} ✦
    </span>
  )
}

// ── Composant LumenOrb ───────────────────────────────────────────────────────
export function LumenOrb({ total = 0, level = 'faible', size = 18 }) {
  return (
    <div className={`lumen-orb lumen-halo-${level}`} style={{ width:size, height:size }} />
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
  { key:'zone_racines',  icon:'🌱', name:'Racines',  color:'#96d485' },
  { key:'zone_tige',     icon:'🌿', name:'Tige',     color:'#7ad490' },
  { key:'zone_feuilles', icon:'🍃', name:'Feuilles', color:'#60d475' },
  { key:'zone_fleurs',   icon:'🌸', name:'Fleurs',   color:'#e088a8' },
  { key:'zone_souffle',  icon:'🌬️', name:'Souffle',  color:'#88b8e8' },
]

// ── Composant LumensCard ─────────────────────────────────────────────────────
const LUMEN_PACKS = [
  { lumens: 50,  price: 20, label: 'Graine',      icon: '🌱' },
  { lumens: 100, price: 40, label: 'Floraison',   icon: '🌸' },
  { lumens: 150, price: 80, label: 'Rayonnement', icon: '✦'  },
]

export function LumensCard({ lumens, userId, awardLumens }) {
  const [tab, setTab]               = useState('history')
  const [history, setHistory]       = useState([])
  const [loadingH, setLoadingH]     = useState(false)
  const [transferAmt, setTransferAmt] = useState(10)
  const [exportCode, setExportCode] = useState(null)
  const [importInput, setImportInput] = useState('')
  const [importStatus, setImportStatus] = useState(null)
  const [loading, setLoading]       = useState(false)

  const total = lumens?.total ?? 0
  const level = lumens?.level ?? 'faible'

  const LEVEL_LABELS = { faible:'Lumière faible', halo:'Halo visible', aura:'Aura douce', rayonnement:'Rayonnement actif' }
  const LEVEL_COLOR  = { faible:'#aaaaaa', halo:'#d4c060', aura:'#e8c060', rayonnement:'#f8e090' }

  // Charge l'historique quand on arrive sur l'onglet
  useEffect(() => {
    if (tab !== 'history' || !userId) return
    setLoadingH(true)
    supabase
      .from('lumens_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { setHistory(data ?? []); setLoadingH(false) })
  }, [tab, userId])

  // Génère un code de transfert sortant
  async function handleExport() {
    if (transferAmt < 1 || transferAmt > total) return
    setLoading(true)
    try {
      const { data } = await supabase.rpc('create_lumen_transfer', {
        p_user_id: userId, p_amount: transferAmt
      })
      setExportCode(data?.code ?? null)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  // Consomme un code de transfert entrant
  async function handleImport() {
    const code = importInput.trim()
    if (!code) return
    setLoading(true); setImportStatus(null)
    try {
      const { data } = await supabase.rpc('redeem_lumen_transfer', {
        p_user_id: userId, p_code: code
      })
      if (data?.ok) { setImportStatus('success'); setImportInput('') }
      else setImportStatus('error')
    } catch { setImportStatus('error') }
    finally { setLoading(false) }
  }

  const tabStyle = (id) => ({
    flex:1, textAlign:'center', padding:'7px', borderRadius:9, fontSize:11, cursor:'pointer',
    background: tab===id ? 'rgba(232,192,96,0.15)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${tab===id ? 'rgba(232,192,96,0.35)' : 'rgba(255,255,255,0.08)'}`,
    color: tab===id ? '#e8c060' : 'rgba(238,232,218,0.45)',
    transition:'all .2s',
  })

  const inputStyle = {
    width:'100%', boxSizing:'border-box',
    background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:8, padding:'8px 10px', color:'rgba(238,232,218,0.85)',
    fontSize:13, outline:'none',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* ── En-tête orbe + total ── */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px', background:'rgba(232,192,96,0.07)', borderRadius:12, border:'1px solid rgba(232,192,96,0.18)' }}>
        <LumenOrb total={total} level={level} size={36} />
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:'#e8c060', lineHeight:1 }}>
            {total} <span style={{ fontSize:14 }}>✦</span>
          </div>
          <div style={{ fontSize:10, color: LEVEL_COLOR[level] ?? '#e8c060', marginTop:3, letterSpacing:'.06em' }}>
            {LEVEL_LABELS[level] ?? level}
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
            <div style={{ fontSize:11, color:'rgba(238,232,218,0.3)', textAlign:'center', padding:12 }}>Chargement…</div>
          )}
          {!loadingH && history.length === 0 && (
            <div style={{ fontSize:11, color:'rgba(238,232,218,0.3)', fontStyle:'italic', padding:'8px 0' }}>Aucune activité pour l'instant</div>
          )}
          {history.map((h, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:9, border:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize:13, fontWeight:600, minWidth:44, color: h.amount > 0 ? '#96d485' : 'rgba(255,140,140,0.8)' }}>
                {h.amount > 0 ? `+${h.amount}` : h.amount} ✦
              </span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, color:'rgba(238,232,218,0.7)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{h.reason ?? '—'}</div>
                <div style={{ fontSize:9, color:'rgba(238,232,218,0.28)', marginTop:2 }}>{timeAgo(h.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ ONGLET ACHETER ══ */}
      {tab === 'buy' && (
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          <div style={{ fontSize:11, color:'rgba(238,232,218,0.4)', fontStyle:'italic', marginBottom:2 }}>
            Chaque pack crédite votre soleil en Lumens ✦
          </div>
          {LUMEN_PACKS.map(p => (
            <div
              key={p.lumens}
              onClick={() => window.openAccessModal?.()}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, cursor:'pointer', transition:'all .2s', gap:8 }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(232,192,96,0.09)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
            >
              <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
                <span style={{ fontSize:20 }}>{p.icon}</span>
                <div>
                  <div style={{ fontSize:12, color:'rgba(238,232,218,0.85)', fontWeight:500 }}>{p.label}</div>
                  <div style={{ fontSize:11, color:'rgba(232,192,96,0.7)', marginTop:1 }}>{p.lumens} ✦</div>
                </div>
              </div>
              <div style={{ flexShrink:0, padding:'6px 14px', borderRadius:100, fontSize:12, fontWeight:600, color:'#e8c060', background:'rgba(232,192,96,0.12)', border:'1px solid rgba(232,192,96,0.30)' }}>
                {p.price} €
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ ONGLET TRANSFÉRER ══ */}
      {tab === 'transfer' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

          {/* Envoyer */}
          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'12px', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize:11, color:'rgba(238,232,218,0.5)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8 }}>Envoyer des Lumens</div>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
              <input
                type="number" min={1} max={total} value={transferAmt}
                onChange={e => setTransferAmt(Number(e.target.value))}
                style={{ ...inputStyle, flex:1 }}
              />
              <span style={{ fontSize:12, color:'#e8c060' }}>✦</span>
            </div>
            {exportCode ? (
              <div style={{ background:'rgba(232,192,96,0.10)', border:'1px solid rgba(232,192,96,0.3)', borderRadius:8, padding:'10px', textAlign:'center' }}>
                <div style={{ fontSize:10, color:'rgba(238,232,218,0.45)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:4 }}>Code de transfert</div>
                <div style={{ fontSize:22, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:'#e8c060', letterSpacing:'4px' }}>{exportCode}</div>
                <div style={{ fontSize:10, color:'rgba(238,232,218,0.35)', marginTop:4 }}>Valable 48h</div>
                <div style={{ fontSize:11, color:'rgba(238,232,218,0.5)', marginTop:6, cursor:'pointer', textDecoration:'underline' }}
                  onClick={() => navigator.clipboard.writeText(exportCode)}>Copier</div>
              </div>
            ) : (
              <div onClick={!loading ? handleExport : undefined}
                style={{ textAlign:'center', padding:'8px', background:'rgba(232,192,96,0.10)', border:'1px solid rgba(232,192,96,0.25)', borderRadius:8, fontSize:12, color:'#e8c060', cursor:loading?'default':'pointer', opacity: transferAmt > total ? 0.4 : 1 }}>
                {loading ? '…' : 'Générer un code'}
              </div>
            )}
            {exportCode && (
              <div style={{ fontSize:11, color:'rgba(238,232,218,0.35)', textAlign:'center', marginTop:6, cursor:'pointer' }}
                onClick={() => setExportCode(null)}>Nouveau code</div>
            )}
          </div>

          {/* Recevoir */}
          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'12px', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize:11, color:'rgba(238,232,218,0.5)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8 }}>Recevoir des Lumens</div>
            <input
              value={importInput}
              onChange={e => setImportInput(e.target.value.toUpperCase())}
              placeholder='Code de transfert'
              style={{ ...inputStyle, letterSpacing:'3px', marginBottom:8 }}
            />
            <div onClick={handleImport}
              style={{ textAlign:'center', padding:'9px', background: importInput.trim().length > 0 ? 'rgba(130,200,240,0.18)' : 'rgba(130,200,240,0.06)', border:'1px solid rgba(130,200,240,0.30)', borderRadius:8, fontSize:12, color:'#82c8f0', cursor: importInput.trim().length > 0 ? 'pointer' : 'default', transition:'all .2s' }}>
              {loading ? '…' : 'Utiliser ce code'}
            </div>
            {importStatus === 'success' && <div style={{ fontSize:12, color:'#96d48a', marginTop:8 }}>✓ Lumens reçus avec succès</div>}
            {importStatus === 'error'   && <div style={{ fontSize:12, color:'rgba(220,100,100,0.8)', marginTop:8 }}>Code invalide ou expiré</div>}
          </div>
        </div>
      )}

    </div>
  )
}
