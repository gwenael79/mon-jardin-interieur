// ─────────────────────────────────────────────────────────────────────────────
//  DashboardPage.jsx  —  Coque principale du dashboard
//  Gère : sidebar, topbar, routing entre écrans, lumens, profil
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from "react"
import { useAuth }   from '../hooks/useAuth'
import { usePlant }  from '../hooks/usePlant'
import { useCircle } from '../hooks/useCircle'
import { useDefi }   from '../hooks/useDefi'
import { supabase }  from '../core/supabaseClient'
import '../styles/dashboard.css'

import { useIsMobile, useProfile, useLumens, LumenBadge, LumenOrb, LumensCard } from './dashboardShared'
import { useAnalytics } from '../hooks/useAnalytics'
import { logActivity } from '../utils/logActivity'
import PushNotificationButton from '../components/PushNotificationButton'
import { ScreenMonJardin, DailyQuizModal } from './ScreenMonJardin'
import { WelcomeScreen }   from './WelcomeScreen'
import { ScreenJardinCollectif, ScreenDefis } from './ScreenDefis'
import { ScreenClubJardiniers } from './ScreenClubJardiniers'
import { ScreenAteliers }       from './ScreenAteliers'
import { MaBibliotheque }       from './MaBibliotheque'
import { ScreenJardinotheque }  from './ScreenJardinotheque'
import { HelpModal }            from './HelpModal'
import PremiumGate              from '../components/PremiumGate'

// ── Navigation ───────────────────────────────────────────────────────────────
const SCREENS = [
  { id:'jardin',   icon:'🌸', label:'Ma Fleur',            Component: ScreenMonJardin        },
  { id:'champ',    icon:'🌻', label:'Jardin Collectif',    Component: ScreenJardinCollectif   },
  { id:'club',     icon:'👨‍👩‍👧‍👦', label:'Club des Jardiniers', Component: ScreenClubJardiniers    },
  { id:'ateliers', icon:'📖', label:'Ateliers',            Component: ScreenAteliers           },
  { id:'defis',       icon:'✨', label:'Défis',               Component: ScreenDefis              },
  { id:'jardinotheque', icon:'🌿', label:'Jardinothèque',       Component: ScreenJardinotheque      },
]

// ── NavHub mobile ────────────────────────────────────────────────────────────
function NavHub({ active, onNavigate, onBilan, onLumens, lumens, todayPlant, stats, communityStats, gardenFlowerCount, hasDegradation, unreadMessages, pendingInvitations }) {
  const bilanDone = hasDegradation

  const NAV_ITEMS = [
    { id:'bilan',    icon:'🌹', label:'Bilan du matin',      sub: bilanDone ? `Complété aujourd'hui ✦` : 'Prendre soin de soi commence ici', action:'bilan',
      accent:'#C8A882', accentBg:'rgba(200,168,130,0.12)', done: bilanDone },
    { id:'jardin',   icon:'🌸', label:'Ma Fleur',             sub: todayPlant?.health != null ? `Vitalité ${todayPlant.health}%` : 'Votre plante du jour', action:'screen',
      accent:'#96d485', accentBg:'rgba(150,212,133,0.10)' },
    { id:'champ',    icon:'🌻', label:'Jardin Collectif',     sub: gardenFlowerCount != null ? `${gardenFlowerCount} fleurs actives` : 'La communauté', action:'screen',
      accent:'#e8c060', accentBg:'rgba(255,200,80,0.09)' },
    { id:'club',     icon:'👨‍👩‍👧‍👦', label:'Club des Jardiniers',  sub: stats?.myCircleCount > 0 ? `${stats.myCircleCount} groupes` : 'Vos groupes', action:'screen',
      accent:'#82c8a0', accentBg:'rgba(130,200,160,0.10)' },
    { id:'ateliers', icon:'📖', label:'Ateliers',             sub: 'Pratiques & exercices', action:'screen',
      accent:'#78c4a0', accentBg:'rgba(100,180,140,0.09)' },
    { id:'defis',    icon:'✨', label:'Défis',                sub: communityStats?.totalDefis > 0 ? `${communityStats.totalDefis} défis actifs` : 'Challenges du moment', action:'screen',
      accent:'#b4a0f0', accentBg:'rgba(180,140,255,0.09)' },
    { id:'jardinotheque', icon:'🌿', label:'Jardinothèque', sub:'Ressources & boutique', action:'screen',
      accent:'#82c8a0', accentBg:'rgba(130,200,160,0.09)' },
    { id:'lumens',   icon:'✦',  label:'Lumens',               sub: lumens ? `${lumens.available} disponibles` : 'Votre lumière', action:'lumens',
      accent:'#e8c060', accentBg:'rgba(232,192,96,0.10)' },
  ]

  const badges = {
    jardin:   todayPlant?.health != null ? `${todayPlant.health}%` : null,
    champ:    gardenFlowerCount != null ? `${gardenFlowerCount}` : null,
    club:     unreadMessages > 0 ? `${unreadMessages} 💌` : null,
    ateliers: pendingInvitations > 0 ? `${pendingInvitations} invitation${pendingInvitations > 1 ? 's' : ''}` : null,
    defis:    communityStats?.totalDefis > 0 ? `${communityStats.totalDefis}` : null,
    lumens:   lumens ? `${lumens.available} ✦` : null,
  }

  return (
    <div style={{
      flex:1,
      display:'flex', flexDirection:'column',
      padding:'6px 14px 10px',
      gap:5,
      overflow:'hidden',
    }}>
      {/* Titre discret */}
      <div style={{
        fontSize:9, letterSpacing:'0.18em', color:'rgba(242,237,224,0.20)',
        fontFamily:"'Jost', sans-serif", textTransform:'uppercase',
        paddingLeft:4, paddingBottom:2, flexShrink:0,
      }}>Mon Jardin</div>

      {NAV_ITEMS.map((item, idx) => {
        const badge = badges[item.id]
        const isActive = item.id === active && item.action === 'screen'
        return (
          <div
            key={item.id}
            onClick={() => {
              if (item.done) return
              if (item.action === 'bilan')  onBilan()
              if (item.action === 'lumens') onLumens()
              if (item.action === 'screen') onNavigate(item.id)
            }}
            style={{
              flex:1, minHeight:0,
              display:'flex', alignItems:'center', gap:12,
              padding:'0 14px 0 12px',
              borderRadius:13,
              background: isActive
                ? `${item.accentBg.replace(/[\d.]+\)$/, '0.22)')} `
                : item.done ? 'rgba(255,255,255,0.015)' : item.accentBg,
              border: `1px solid ${isActive ? item.accent + '55' : item.done ? 'rgba(255,255,255,0.05)' : item.accent + '33'}`,
              cursor: item.done ? 'default' : 'pointer',
              WebkitTapHighlightColor:'transparent',
              transition:'all .15s ease',
              position:'relative',
              overflow:'hidden',
            }}
          >
            {/* Accent bar gauche */}
            <div style={{
              position:'absolute', left:0, top:'18%', bottom:'18%', width:2,
              borderRadius:2,
              background: item.done ? 'transparent' : isActive ? item.accent : item.accent + '60',
              transition:'all .15s',
            }}/>

            {/* Emoji */}
            <div style={{
              flexShrink:0,
              fontSize: item.id === 'lumens' ? 22 : 26,
              width:36, height:36,
              display:'flex', alignItems:'center', justifyContent:'center',
              color: item.id === 'lumens' ? item.accent : 'inherit',
              filter: item.done ? 'grayscale(1) opacity(0.35)' : 'none',
              transition:'filter .15s',
            }}>
              {item.icon}
            </div>

            {/* Texte */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{
                fontSize:15, fontWeight:600,
                fontFamily:"'Cormorant Garamond', 'Georgia', serif",
                letterSpacing:'0.01em',
                color: item.done ? 'rgba(242,237,224,0.25)' : isActive ? 'var(--cream)' : 'rgba(242,237,224,0.88)',
                lineHeight:1.2,
                marginBottom:1,
              }}>{item.label}</div>
              <div style={{
                fontSize:10,
                fontFamily:"'Jost', sans-serif",
                color: item.done ? 'rgba(242,237,224,0.18)' : 'rgba(242,237,224,0.38)',
                letterSpacing:'0.02em',
                animation: item.id === 'bilan' && !item.done ? 'navPulse 2.5s ease-in-out infinite' : 'none',
                fontStyle: item.id === 'bilan' && !item.done ? 'italic' : 'normal',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>{item.sub}</div>
            </div>

            {/* Badge */}
            {badge && !item.done && (
              <div style={{
                flexShrink:0,
                padding:'3px 9px', borderRadius:100,
                background: `${item.accent}18`,
                border:`1px solid ${item.accent}50`,
                fontSize:11, fontWeight:700,
                color: item.accent,
                fontFamily:"'Jost', sans-serif",
                letterSpacing:'-0.01em',
                whiteSpace:'nowrap',
              }}>{badge}</div>
            )}
            {item.done && (
              <div style={{
                flexShrink:0, width:20, height:20, borderRadius:'50%',
                background:'rgba(150,212,133,0.12)',
                border:'1px solid rgba(150,212,133,0.30)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, color:'rgba(150,212,133,0.60)',
              }}>✓</div>
            )}
            {!badge && !item.done && (
              <div style={{ flexShrink:0, fontSize:14, color:`${item.accent}40` }}>›</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Modal Profil ─────────────────────────────────────────────────────────────
function ProfileModal({ user, onClose }) {
  const [tab,         setTab]         = useState('profil') // 'profil' | 'bibliotheque'
  const [name,        setName]        = useState('')
  const [profession,  setProfession]  = useState('')
  const [flowerName,  setFlowerName]  = useState('')
  const [visibility,  setVisibility]  = useState(false)
  const [isAnimator,  setIsAnimator]  = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [saved,       setSaved]       = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('users').select('display_name, profession, is_animator, flower_name').eq('id', user.id).maybeSingle(),
      supabase.from('user_privacy').select('visibility_flower').eq('user_id', user.id).maybeSingle(),
    ]).then(([{ data: u }, { data: priv }]) => {
      setName(u?.display_name ?? '')
      setProfession(u?.profession ?? '')
      setFlowerName(u?.flower_name ?? '')
      setIsAnimator(u?.is_animator === true)
      setVisibility(priv?.visibility_flower ?? false)
      setLoading(false)
    })
  }, [user.id])

  async function handleSave() {
    if (!name.trim()) { setError('Le prénom ou pseudo ne peut pas être vide.'); return }
    setSaving(true); setError(null)
    const [{ error: err }] = await Promise.all([
      supabase.from('users')
        .update({ display_name: name.trim(), profession: profession.trim(), flower_name: flowerName.trim() || null })
        .eq('id', user.id),
      supabase.from('user_privacy')
        .upsert({ user_id: user.id, visibility_flower: visibility }, { onConflict: 'user_id' }),
    ])
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1200)
  }

  return (
    <div className="profile-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="profile-modal">
        <button className="profile-modal-close" onClick={onClose}>✕</button>
        <div className="profile-modal-title">Mon espace</div>
        {/* Onglets */}
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid rgba(255,255,255,0.08)', marginBottom:16, marginTop:4 }}>
          {[['profil','🌸 Mon profil'],['bibliotheque','🎧 Ma bibliothèque']].map(([id,lbl]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding:'8px 16px', fontSize:11, letterSpacing:'.06em', background:'none', border:'none',
                borderBottom: tab===id ? '2px solid #96d485' : '2px solid transparent',
                color: tab===id ? '#96d485' : 'rgba(242,237,224,0.40)', cursor:'pointer',
                fontFamily:"'Jost',sans-serif", marginBottom:-1, transition:'all .2s' }}>
              {lbl}
            </button>
          ))}
        </div>
        {tab === 'profil' && <>
        <div className="profile-field">
          <label className="profile-label">Prénom ou pseudo</label>
          <input
            className="profile-input"
            type="text"
            value={loading ? '' : name}
            onChange={e => { setName(e.target.value); setError(null) }}
            placeholder={loading ? 'Chargement…' : 'Votre prénom ou pseudo'}
            maxLength={40}
            autoFocus={!loading}
            disabled={loading}
            onKeyDown={e => e.key === 'Enter' && !loading && handleSave()}
          />
        </div>
        {/* Nom de fleur */}
        <div className="profile-field" style={{ marginTop:12 }}>
          <label className="profile-label">Nom de fleur</label>
          <input
            className="profile-input"
            type="text"
            value={loading ? '' : flowerName}
            onChange={e => setFlowerName(e.target.value)}
            placeholder="ex. Aubépine, Pivoine, Cèdre…"
            maxLength={30}
            disabled={loading}
          />
          <div style={{ fontSize:10, color:'rgba(242,237,224,0.3)', marginTop:4 }}>
            Votre identité dans la communauté · {name && flowerName ? `${name}·${flowerName}` : 'Prénom·NomDeFleur'}
          </div>
        </div>

        {/* Toggle visibilité Le Jardin */}
        <div style={{
          marginTop:16, padding:'12px 14px',
          background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:10, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12
        }}>
          <div>
            <div style={{ fontSize:12, color:'rgba(242,237,224,0.8)' }}>🌿 Visible dans Le Jardin</div>
            <div style={{ fontSize:10, color:'rgba(242,237,224,0.35)', marginTop:3 }}>
              Les autres personnes peuvent vous envoyer un ❤️
            </div>
          </div>
          <div
            onClick={() => !loading && setVisibility(v => !v)}
            style={{
              width:44, height:24, borderRadius:100, flexShrink:0, cursor:'pointer',
              background: visibility ? 'rgba(150,212,133,0.35)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${visibility ? 'rgba(150,212,133,0.5)' : 'rgba(255,255,255,0.12)'}`,
              position:'relative', transition:'all .25s',
              WebkitTapHighlightColor:'transparent',
            }}
          >
            <div style={{
              position:'absolute', top:3, left: visibility ? 22 : 3,
              width:16, height:16, borderRadius:'50%',
              background: visibility ? '#96d485' : 'rgba(255,255,255,0.25)',
              transition:'left .25s, background .25s',
            }} />
          </div>
        </div>

        {isAnimator && (
          <div className="profile-field" style={{ marginTop:12 }}>
            <label className="profile-label">Profession</label>
            <input
              className="profile-input"
              type="text"
              value={loading ? '' : profession}
              onChange={e => setProfession(e.target.value)}
              placeholder="ex. Hypnothérapeute, Coach bien-être…"
              maxLength={60}
              disabled={loading}
            />
          </div>
        )}
        {error && <div className="profile-error">{error}</div>}
        <button className="profile-save" onClick={handleSave} disabled={saving || loading || !name.trim()}>
          {saving ? '…' : 'Sauvegarder'}
        </button>
        {saved && <div className="profile-saved">✓ Profil mis à jour</div>}
        </>}
        {tab === 'bibliotheque' && (
          <MaBibliotheque userId={user?.id} />
        )}
      </div>
    </div>
  )
}


// ── DashboardPage principal ──────────────────────────────────────────────────
export default function DashboardPage() {
  const isMobile = useIsMobile()

  // Charger Playfair Display pour le compteur de streak
  useEffect(() => {
    if (!document.getElementById('gf-playfair')) {
      const l = document.createElement('link')
      l.id = 'gf-playfair'
      l.rel = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&display=swap'
      document.head.appendChild(l)
    }
  }, [])

  const [pendingReports, setPendingReports] = useState(0)
  const [active, setActive]                 = useState('jardin')
  const [showNavHub,         setShowNavHub]         = useState(false)
  const [showBilanModal,     setShowBilanModal]     = useState(false)
  const [bilanCompleted,     setBilanCompleted]     = useState(false)
  const { user, signOut }                   = useAuth()
  const { todayPlant, stats: plantStats }   = usePlant(user?.id)
  const { communityStats }                  = useDefi(user?.id)
  const { stats, circleMembers, activeCircle } = useCircle(user?.id)

  const profile                       = useProfile(user?.id)
  const { lumens, award: awardLumens, refresh } = useLumens(user?.id)
  const { track } = useAnalytics(user?.id)

  // ── Onboarding (première connexion) + WelcomeScreen (connexions suivantes) ──
  const [showWelcome,    setShowWelcome]    = useState(false)
  const [welcomeReady,   setWelcomeReady]   = useState(false)
  const [isNewUser,      setIsNewUser]      = useState(false)

  // Détecter retour depuis Stripe (skip WelcomeScreen)
  const isStripeReturn = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const isReturn = params.has('lumens') || params.has('premium')
    if (isReturn) window.history.replaceState({}, '', window.location.pathname)
    return isReturn
  }, [])

  // Détecter première visite du jour
  const isFirstToday = useMemo(() => {
    const today = new Date().toISOString().slice(0,10)
    const key   = `last_welcome_${user?.id}`
    const last  = localStorage.getItem(key)
    if (last !== today) { localStorage.setItem(key, today); return true }
    return false
  }, [user?.id])

  // Lire onboarded directement depuis users (useProfile lit profiles, pas users)
  useEffect(() => {
    if (!user?.id || welcomeReady) return
    supabase
      .from('users')
      .select('onboarded, created_at')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setWelcomeReady(true)
        if (!data?.onboarded) return // géré par App.jsx

        // Retour Stripe → pas de WelcomeScreen
        if (isStripeReturn) return

        // Détecter nouvelle inscription (< 10 min)
        const createdAt = data?.created_at ? new Date(data.created_at) : null
        const isJustCreated = createdAt && (Date.now() - createdAt.getTime()) < 10 * 60 * 1000
        setIsNewUser(!!isJustCreated)
        setShowWelcome(true)
      })
  }, [user?.id])

  // Nombre de fleurs visibles dans le Jardin Collectif
  const [gardenFlowerCount, setGardenFlowerCount] = useState(null)
  const [bilanDoneToday,    setBilanDoneToday]    = useState(false)
  const [pendingInvitations, setPendingInvitations] = useState(0)
  const [unreadCoeurs,       setUnreadCoeurs]       = useState(0)
  useEffect(() => {
    const since = new Date(); since.setDate(since.getDate() - 7)
    Promise.all([
      supabase.from('plants').select('user_id, health, date').gte('date', since.toISOString().split('T')[0]).order('date', { ascending: false }),
      supabase.from('privacy_settings').select('user_id').eq('show_health', false),
    ]).then(([plantsRes, privacyRes]) => {
      if (plantsRes.error) return
      const hidden = new Set((privacyRes.data || []).map(p => p.user_id))
      const byUser = {}
      for (const row of (plantsRes.data || [])) { if (!byUser[row.user_id]) byUser[row.user_id] = row }
      setGardenFlowerCount(Object.values(byUser).filter(p => !hidden.has(p.user_id) && p.health > 0).length)
    })
  }, [])

  // Coeurs non vus — rechargé à chaque fois qu'on revient sur le NavHub
  function refreshCoeurs() {
    if (!user?.id) return
    supabase.from('coeurs').select('id', { count:'exact', head:true })
      .eq('receiver_id', user.id).eq('seen', false)
      .then(({ count }) => setUnreadCoeurs(count ?? 0))
  }
  useEffect(() => { refreshCoeurs() }, [user?.id])

  // Invitations ateliers non vues
  useEffect(() => {
    if (!user?.id) return
    supabase.from('atelier_invitations').select('id', { count:'exact', head:true })
      .eq('user_id', user.id).eq('seen', false)
      .then(({ count }) => setPendingInvitations(count ?? 0))
  }, [user?.id])

  // Vérifie si le bilan a été fait aujourd'hui
  useEffect(() => {
    if (!user?.id) return
    const today = new Date().toISOString().split('T')[0]
    supabase.from('daily_quiz').select('id').eq('user_id', user.id).eq('date', today).maybeSingle()
      .then(({ data }) => setBilanDoneToday(!!data))
  }, [user?.id])

  // Rapports admin
  useEffect(() => {
    if (['aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'].includes(user?.id)) {
      supabase.from('reports').select('*', { count:'exact', head:true }).eq('resolved', false)
        .then(({ count }) => setPendingReports(count ?? 0))
    }
  }, [user?.id])

  function refreshPendingReports() {
    supabase.from('reports').select('*', { count:'exact', head:true }).eq('resolved', false)
      .then(({ count }) => setPendingReports(count ?? 0))
  }

  // Connexion quotidienne — +1 Lumen/jour
  useEffect(() => {
    if (!user?.id || !awardLumens) return
    const today = new Date().toISOString().split('T')[0]
    const lastLogin = localStorage.getItem(`last_login_${user.id}`)
    if (lastLogin !== today) {
      localStorage.setItem(`last_login_${user.id}`, today)
      awardLumens(1, 'daily_login', { date: today })
    }
  }, [user?.id])

  const [showCreateCircle,   setShowCreateCircle]   = useState(false)
  const [showInviteModal,    setShowInviteModal]    = useState(false)
  const [showProfileModal,   setShowProfileModal]   = useState(false)
  const [showPrefsAccordion, setShowPrefsAccordion] = useState(false)
  const [showMjRight,        setShowMjRight]        = useState(false)
  const [showLumensModal,    setShowLumensModal]    = useState(false)
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false)
  const [showHelp,           setShowHelp]           = useState(false)

  // Sur desktop, 'nav' n'existe pas — rediriger vers jardin
  const effectiveActive = (!isMobile && active === 'nav') ? 'jardin' : active
  // Recharge le compteur coeurs quand on revient sur le NavHub
  useEffect(() => { if (effectiveActive === 'nav') refreshCoeurs() }, [effectiveActive])

  // Track navigation
  useEffect(() => {
    if (effectiveActive && effectiveActive !== 'nav') track('page_view', {}, effectiveActive, 'navigation')
  }, [effectiveActive])

  // Écoute les events analytics des sous-composants (FleurCard, etc.)
  useEffect(() => {
    const handler = (e) => {
      const { event, props, page, cat } = e.detail ?? {}
      if (event) track(event, props ?? {}, page, cat)
    }
    window.addEventListener('analytics_track', handler)
    return () => window.removeEventListener('analytics_track', handler)
  }, [track])


  const screenData = SCREENS.find(s => s.id === effectiveActive)
  const Component = screenData?.Component ?? null

  // ── Config topbar par écran ──────────────────────────────────────────────
  const topbar = {
    nav: {
      title: <><em>Navigation</em></>,
      btn: null,
    },
    jardin: {
      title: <>Ma <em>Fleur</em></>,
      btn: null,
    },
    champ: {
      title: <>Jardin <em>Collectif</em></>,
      btn: null,
    },
    club: {
      title: <>Club des <em>Jardiniers</em></>,
      btn: null,
    },
    ateliers: {
      title: <><em>Ateliers</em></>,
      btn: null,
    },
    defis: {
      title: <><em>Défis</em></>,
      btn: 'Proposer',
      onBtn: () => document.dispatchEvent(new CustomEvent('openPropose')),
    },
    jardinotheque: {
      title: <>La <em>Jardinothèque</em></>,
      btn: null,
    },
  }[effectiveActive] ?? { title: <><em>Navigation</em></>, btn: null }

  return (
    <div className="root">

      {/* ── WELCOME SCREEN (transition 3s) ── */}
      {showWelcome && (
        <WelcomeScreen
          profile={profile}
          isNewUser={isNewUser}
          onDone={() => { setShowWelcome(false); setActive('jardin') }}
        />
      )}

      <div className="app-layout">

        {/* ── MODAL LUMENS (accessible via NavHub) ── */}
        {showLumensModal && (
          <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }} onClick={() => setShowLumensModal(false)} />
            <div style={{ position:'relative', background:'#1a2e1a', borderRadius:'20px 20px 0 0', padding:'20px 18px 40px', maxHeight:'85vh', overflowY:'auto', border:'1px solid rgba(255,255,255,0.10)', borderBottom:'none' }}>
              <div style={{ width:36, height:3, background:'rgba(255,255,255,0.2)', borderRadius:100, margin:'0 auto 18px' }} />
              <LumensCard
                lumens={lumens}
                userId={user?.id}
                awardLumens={awardLumens}
                onRefresh={refresh}
              />
            </div>
          </div>
        )}

        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

        {/* ── BILAN MODAL — rendu directement ici pour fonctionner depuis NavHub ── */}
        {showBilanModal && (
          <DailyQuizModal
            onComplete={(deg) => {
              // Sauvegarde SANS fermer — l'écran résultat s'affiche d'abord
              // La fermeture se fait via onDismiss depuis le bouton "Voir mes rituels"
              setBilanDoneToday(true)
              track('bilan_complete', { degradation: deg }, 'jardin', 'engagement')
              logActivity({ userId: user?.id, action: 'bilan' })
              window.dispatchEvent(new CustomEvent('bilanComplete', { detail: deg }))
            }}
            onDismiss={() => setShowBilanModal(false)}
            onSkip={() => {
              setShowBilanModal(false)
              track('bilan_skip', {}, 'jardin', 'engagement')
              window.dispatchEvent(new CustomEvent('bilanComplete', { detail: { roots:50, stem:50, leaves:50, flowers:50, breath:50 } }))
            }}
          />
        )}

        {/* ── SIDEBAR ── */}
        <div className="sidebar">
          <div className="sb-logo" style={{ display:'flex', alignItems:'center', gap:10 }}>
            <img src="/icons/icon-192.png" alt="logo" style={{ width:36, height:36, borderRadius:'50%' }} />
            <span>Mon <em>Jardin</em><br />Intérieur</span>
          </div>
          <div className="sb-section" style={{ marginBottom:4 }}>Navigation</div>
          {isMobile ? (
            /* ── Mobile : bouton Navigation (caché sur le NavHub) ── */
            effectiveActive !== 'nav' ? (
              <div
                className="sb-item"
                onClick={() => setActive('nav')}
                style={{ flexDirection:'column', gap:4, padding:'8px 18px', fontSize:11, minWidth:72, letterSpacing:'0.04em' }}
              >
                <span style={{ fontSize:22 }}>🧭</span>
                Navigation
              </div>
            ) : null
          ) : (
            /* ── Desktop : tous les écrans ── */
            SCREENS.map(s => {
              let badgeVal = null
              if (s.id === 'jardin')   badgeVal = todayPlant?.health != null ? `${todayPlant.health}%` : null
              if (s.id === 'champ')    badgeVal = gardenFlowerCount ?? null
              if (s.id === 'club')     badgeVal = unreadCoeurs > 0 ? unreadCoeurs : null
              if (s.id === 'defis')    badgeVal = communityStats?.totalDefis > 0 ? communityStats.totalDefis : null
              return (
                <div key={s.id} className={'sb-item' + (effectiveActive===s.id ? ' active' : '')} onClick={() => setActive(s.id)}>
                  <span className="sb-icon">{s.icon}</span>
                  {s.label}
                  {badgeVal != null && <div className="sb-badge">{badgeVal}</div>}
                </div>
              )
            })
          )}
          <div className="sb-divider" />

          {/* ── USER CARD ── */}
          {showProfileModal && (
            <ProfileModal user={user} onClose={() => setShowProfileModal(false)} />
          )}
          {(() => {
            const name    = profile?.display_name ?? user?.display_name ?? null
            const email   = user?.email ?? ''
            const initial = (name ?? email).charAt(0).toUpperCase()
            const level   = profile?.level ?? 1
            const xp      = profile?.xp ?? 0
            const xpNext  = profile?.xp_next_level ?? 100
            const xpPct   = Math.min(100, Math.round((xp / xpNext) * 100))
            return (
              <div className="sb-user-card" onClick={() => setShowProfileModal(true)} title="Modifier mon profil">
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div className="sb-user-avatar">{initial}</div>
                  <div className="sb-user-info">
                    <div className="sb-user-name">{name ?? email}</div>
                    {name && <div className="sb-user-email">{email}</div>}
                  </div>
                </div>
                <div className="sb-user-level">
                  <span className="sb-user-level-label">Niveau</span>
                  <span className="sb-user-level-val">{level}</span>
                </div>
                <div className="sb-user-xp-bar">
                  <div className="sb-user-xp-fill" style={{ width: xpPct + '%' }}/>
                </div>
              </div>
            )
          })()}

          {/* ── LUMENS ── */}
          {lumens && (
            <div className="sb-lumen-bar" onClick={() => setShowLumensModal(true)} style={{ cursor:'pointer' }}>
              <LumenOrb total={lumens.available} level={lumens.level} size={22} />
              <div style={{ flex:1 }}>
                <div className="sb-lumen-label">Lumens</div>
                <div className="sb-lumen-level">{lumens.level === 'faible' ? 'Lumière faible' : lumens.level === 'halo' ? 'Halo visible' : lumens.level === 'aura' ? 'Aura douce' : 'Rayonnement actif'}</div>
              </div>
              <div className="sb-lumen-count">{lumens.available} ✦</div>
            </div>
          )}

          {/* ── MODAL LUMENS DESKTOP ── */}
          {!isMobile && showLumensModal && (
            <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }} onClick={() => setShowLumensModal(false)} />
              <div style={{ position:'relative', background:'#1a2e1a', borderRadius:20, padding:'28px 24px', width:'100%', maxWidth:460, maxHeight:'85vh', overflowY:'auto', border:'1px solid rgba(255,255,255,0.10)', boxShadow:'0 24px 80px rgba(0,0,0,0.5)' }}>
                <button onClick={() => setShowLumensModal(false)} style={{ position:'absolute', top:14, right:16, background:'none', border:'none', color:'rgba(242,237,224,0.4)', fontSize:18, cursor:'pointer', lineHeight:1 }}>✕</button>
                <LumensCard
                  lumens={lumens}
                  userId={user?.id}
                  awardLumens={awardLumens}
                  onRefresh={refresh}
                />
              </div>
            </div>
          )}

          {/* ── FOOTER BUTTONS ── */}
          <div className="sb-footer-btns">

            {/* Bouton accordéon */}
            <div
              onClick={() => setShowPrefsAccordion(p => !p)}
              style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'9px 14px', borderRadius:10, cursor:'pointer',
                background: showPrefsAccordion ? 'rgba(255,255,255,0.06)' : 'transparent',
                border:'1px solid rgba(255,255,255,0.07)',
                transition:'all .2s', WebkitTapHighlightColor:'transparent',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13 }}>⚙️</span>
                <span style={{ fontSize:10, color:'rgba(242,237,224,0.5)', letterSpacing:'.05em', fontFamily:'Jost,sans-serif' }}>Gérer mes préférences</span>
              </div>
              <span style={{ fontSize:10, color:'rgba(242,237,224,0.25)', transition:'transform .2s', display:'inline-block', transform: showPrefsAccordion ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
            </div>

            {/* Contenu accordéon */}
            {showPrefsAccordion && (
              <div style={{ display:'flex', flexDirection:'column', gap:2, paddingLeft:8, borderLeft:'1px solid rgba(255,255,255,0.06)', marginLeft:6 }}>

                {/* Modifier profil */}
                <div
                  onClick={() => { setShowPrefsAccordion(false); setShowProfileModal(true) }}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer', WebkitTapHighlightColor:'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <span style={{ fontSize:12 }}>✏️</span>
                  <span style={{ fontSize:10, color:'rgba(242,237,224,0.5)', fontFamily:'Jost,sans-serif' }}>Modifier mon profil</span>
                </div>

                {/* Abonnement */}
                <div
                  onClick={() => { setShowPrefsAccordion(false); window.openAccessModal?.() }}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer', WebkitTapHighlightColor:'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <span style={{ fontSize:12 }}>🌸</span>
                  <span style={{ fontSize:10, color:'rgba(242,237,224,0.5)', fontFamily:'Jost,sans-serif' }}>Abonnement</span>
                </div>

                {/* Notifications */}
                <div style={{ padding:'4px 10px' }}>
                  <PushNotificationButton userId={user?.id} compact />
                </div>

                {/* Admin */}
                {['aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'].includes(user?.id) && (
                  <div
                    onClick={() => { setShowPrefsAccordion(false); window.location.hash = 'admin' }}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer', position:'relative', WebkitTapHighlightColor:'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <span style={{ fontSize:12 }}>🛡️</span>
                    <span style={{ fontSize:10, color:'rgba(255,200,100,0.6)', fontFamily:'Jost,sans-serif' }}>Administration</span>
                    {pendingReports > 0 && (
                      <div style={{ background:'rgba(210,80,80,0.9)', color:'#fff', fontSize:9, fontWeight:600, minWidth:16, height:16, borderRadius:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>
                        {pendingReports}
                      </div>
                    )}
                  </div>
                )}

                {/* Déconnexion */}
                <div
                  onClick={signOut}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer', WebkitTapHighlightColor:'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <span style={{ fontSize:12 }}>⎋</span>
                  <span style={{ fontSize:10, color:'rgba(242,237,224,0.3)', fontFamily:'Jost,sans-serif' }}>Se déconnecter</span>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* ── MAIN ── */}
        <div className="main">
          <div className="topbar">
            {isMobile ? (
              <div style={{ display:'flex', flexDirection:'column', gap:2, marginTop:20, padding:'8px 0 10px' }}>
                <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:28, fontWeight:300, color:'var(--cream)', letterSpacing:'0.01em', lineHeight:1 }}>
                  Mon <em style={{ fontStyle:'italic', color:'var(--gold)' }}>Jardin</em> Intérieur
                </div>
                {effectiveActive !== 'nav' && (
                  <div style={{ fontSize:11, color:'var(--gold)', opacity:0.6, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                    {topbar.title}
                  </div>
                )}
              </div>
            ) : (
              <div className="tb-title">{topbar.title}</div>
            )}
            
            <div style={{ flex:1 }} />
            <div className="tb-btn ghost" style={{ marginRight:5 }} onClick={() => setShowHelp(true)}>Aide</div>
            {topbar.btn && <div className="tb-btn" onClick={topbar.onBtn ?? undefined}>{topbar.btn}</div>}
            {isMobile ? (
              <div
                onClick={() => setShowSettingsDrawer(true)}
                style={{
                  width:36, height:36, borderRadius:'50%', flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)',
                  fontSize:17, WebkitTapHighlightColor:'transparent',
                  transition:'background .2s',
                }}
              >⚙️</div>
            ) : null}
          </div>

          <div style={{ flex:1, overflow:'hidden', display:'flex', minHeight:0 }}>
            {(isMobile && effectiveActive === 'nav') ? (
              <NavHub
                active={active}
                onNavigate={id => setActive(id)}
                onBilan={() => setShowBilanModal(true)}
                onLumens={() => setShowLumensModal(true)}
                lumens={lumens}
                todayPlant={todayPlant}
                stats={stats}
                communityStats={communityStats}
                gardenFlowerCount={gardenFlowerCount}
                hasDegradation={bilanDoneToday}
                unreadMessages={unreadCoeurs}
                pendingInvitations={pendingInvitations}
              />
            ) : Component ? (
              (() => {
                const PREMIUM_SCREENS = {
                  club:     'le Club des Jardiniers',
                  ateliers: 'les Ateliers',
                  defis:    'les Défis',
                  champ:    'le Jardin Collectif',
                }
                const featureName = PREMIUM_SCREENS[effectiveActive]
                const inner = (
                  <Component
                    userId={user?.id}
                    openCreate={showCreateCircle}
                    onCreateClose={() => setShowCreateCircle(false)}
                    openInvite={showInviteModal}
                    onInviteClose={() => setShowInviteModal(false)}
                    onReport={refreshPendingReports}
                    awardLumens={awardLumens}
                    lumens={lumens}
                    onCoeurSeen={() => setUnreadCoeurs(n => Math.max(0, n - 1))}
                    bilanDoneToday={bilanDoneToday}
                    onOpenBilan={() => setShowBilanModal(true)}
                  />
                )
                if (featureName) {
                  return (
                    <PremiumGate
                      featureName={featureName}
                      onUpgrade={() => window.openAccessModal?.()}
                    >
                      {inner}
                    </PremiumGate>
                  )
                }
                return inner
              })()
            ) : null}
          </div>

          {/* ── FAB mobile — accès Lumens (écran Ma Fleur) ── */}
          {active === 'jardin' && (
            <>
              <div
                onClick={() => setShowMjRight(true)}
                style={{ display:'none' }}
                className="mobile-fab"
              >
                ✦
              </div>
              {showMjRight && (
                <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                  <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }} onClick={() => setShowMjRight(false)} />
                  <div style={{ position:'relative', background:'#1a2e1a', borderRadius:'20px 20px 0 0', padding:'20px 18px 40px', maxHeight:'85vh', overflowY:'auto', border:'1px solid rgba(255,255,255,0.10)', borderBottom:'none' }}>
                    <div style={{ width:36, height:3, background:'rgba(255,255,255,0.2)', borderRadius:100, margin:'0 auto 18px' }} />
                    <LumensCard
                      lumens={lumens}
                      userId={user?.id}
                      awardLumens={awardLumens}
                      onRefresh={refresh}
                    />
                    <div className="slabel" style={{ marginTop:20 }}>Confidentialité</div>
                    <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.6, marginBottom:10 }}>Souhaitez-vous apparaître dans le jardin collectif ?</div>
                  </div>
                </div>
              )}
            </>
          )}
          {/* ── DRAWER PARAMÈTRES MOBILE ── */}
          {isMobile && showSettingsDrawer && (
            <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
              {/* Backdrop */}
              <div
                style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.60)', backdropFilter:'blur(4px)' }}
                onClick={() => setShowSettingsDrawer(false)}
              />
              {/* Panel */}
              <div style={{
                position:'relative', background:'#16261a',
                borderRadius:'22px 22px 0 0', padding:'0 0 40px',
                border:'1px solid rgba(255,255,255,0.10)', borderBottom:'none',
                maxHeight:'90vh', overflowY:'auto',
              }}>
                {/* Handle */}
                <div style={{ width:36, height:3, background:'rgba(255,255,255,0.18)', borderRadius:100, margin:'14px auto 0' }} />

                {/* ─ Carte profil ─ */}
                {(() => {
                  const name    = profile?.display_name ?? user?.display_name ?? null
                  const email   = user?.email ?? ''
                  const initial = (name ?? email).charAt(0).toUpperCase()
                  const level   = profile?.level ?? 1
                  const xp      = profile?.xp ?? 0
                  const xpNext  = profile?.xp_next_level ?? 100
                  const xpPct   = Math.min(100, Math.round((xp / xpNext) * 100))
                  const flowerName = profile?.flower_name ?? null
                  return (
                    <div style={{ margin:'18px 18px 0', padding:'14px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        {/* Avatar */}
                        <div style={{
                          width:46, height:46, borderRadius:'50%', flexShrink:0,
                          background:'linear-gradient(135deg,rgba(232,192,96,0.25),rgba(150,212,133,0.15))',
                          border:'1px solid rgba(232,192,96,0.30)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:20, color:'var(--gold)', fontWeight:600,
                        }}>{initial}</div>
                        {/* Infos */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:15, color:'var(--cream)', fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {name ?? email}
                          </div>
                          {flowerName && (
                            <div style={{ fontSize:11, color:'rgba(232,192,96,0.60)', marginTop:1 }}>🌸 {flowerName}</div>
                          )}
                          {name && (
                            <div style={{ fontSize:10, color:'rgba(242,237,224,0.30)', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{email}</div>
                          )}
                        </div>
                        {/* Niveau */}
                        <div style={{ textAlign:'center', flexShrink:0 }}>
                          <div style={{ fontSize:18, fontWeight:600, color:'var(--gold)', lineHeight:1 }}>{level}</div>
                          <div style={{ fontSize:9, color:'rgba(242,237,224,0.35)', textTransform:'uppercase', letterSpacing:'.06em' }}>Niveau</div>
                        </div>
                      </div>
                      {/* Barre XP */}
                      <div style={{ marginTop:10, height:3, background:'rgba(255,255,255,0.07)', borderRadius:100, overflow:'hidden' }}>
                        <div style={{ height:'100%', width: xpPct + '%', background:'linear-gradient(90deg,#96d485,#e8c060)', borderRadius:100, transition:'width .4s' }} />
                      </div>
                      <div style={{ fontSize:9, color:'rgba(242,237,224,0.25)', marginTop:3, textAlign:'right' }}>{xp} / {xpNext} XP</div>
                    </div>
                  )
                })()}

                {/* ─ Actions ─ */}
                <div style={{ margin:'14px 18px 0', display:'flex', flexDirection:'column', gap:10 }}>

                  {/* Modifier le profil */}
                  <div
                    onClick={() => { setShowSettingsDrawer(false); setTimeout(() => setShowProfileModal(true), 180) }}
                    style={{
                      display:'flex', alignItems:'center', gap:12, padding:'13px 16px',
                      background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                      borderRadius:12, cursor:'pointer', WebkitTapHighlightColor:'transparent',
                    }}
                  >
                    <span style={{ fontSize:18 }}>✏️</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:'var(--cream)', fontWeight:500 }}>Modifier mon profil</div>
                      <div style={{ fontSize:10, color:'rgba(242,237,224,0.35)', marginTop:1 }}>Nom, fleur, visibilité…</div>
                    </div>
                    <span style={{ fontSize:12, color:'rgba(242,237,224,0.25)' }}>›</span>
                  </div>

                  {/* Notifications push — masqué sur iOS hors PWA */}
                  {!(/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches) && (
                    <div style={{
                      padding:'13px 16px',
                      background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                      borderRadius:12,
                    }}>
                      <PushNotificationButton userId={user?.id} />
                    </div>
                  )}

                  {/* Abonnement */}
                  <div
                    onClick={() => { setShowSettingsDrawer(false); window.openAccessModal?.() }}
                    style={{
                      display:'flex', alignItems:'center', gap:12, padding:'13px 16px',
                      background:'rgba(232,192,96,0.07)', border:'1px solid rgba(232,192,96,0.18)',
                      borderRadius:12, cursor:'pointer', WebkitTapHighlightColor:'transparent',
                    }}
                  >
                    <span style={{ fontSize:18 }}>🌸</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:'#e8c060', fontWeight:500 }}>Abonnement</div>
                      <div style={{ fontSize:10, color:'rgba(232,192,96,0.45)', marginTop:1 }}>Gérer votre accès</div>
                    </div>
                    <span style={{ fontSize:12, color:'rgba(232,192,96,0.30)' }}>›</span>
                  </div>

                  {/* Administration (admin uniquement) */}
                  {['aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'].includes(user?.id) && (
                    <div
                      onClick={() => { setShowSettingsDrawer(false); window.location.hash = 'admin' }}
                      style={{
                        display:'flex', alignItems:'center', gap:12, padding:'13px 16px',
                        background:'rgba(255,200,100,0.07)', border:'1px solid rgba(255,200,100,0.20)',
                        borderRadius:12, cursor:'pointer', WebkitTapHighlightColor:'transparent',
                        position:'relative',
                      }}
                    >
                      <span style={{ fontSize:18 }}>⚙️</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, color:'rgba(255,200,100,0.85)', fontWeight:500 }}>Administration</div>
                        <div style={{ fontSize:10, color:'rgba(255,200,100,0.40)', marginTop:1 }}>Gestion de la plateforme</div>
                      </div>
                      {pendingReports > 0 && (
                        <div style={{ background:'rgba(210,80,80,0.9)', color:'#fff', fontSize:9, fontWeight:600, minWidth:16, height:16, borderRadius:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>
                          {pendingReports}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Se déconnecter */}
                  <div
                    onClick={() => { setShowSettingsDrawer(false); signOut() }}
                    style={{
                      display:'flex', alignItems:'center', gap:12, padding:'13px 16px',
                      background:'rgba(210,80,80,0.06)', border:'1px solid rgba(210,80,80,0.15)',
                      borderRadius:12, cursor:'pointer', WebkitTapHighlightColor:'transparent',
                    }}
                  >
                    <span style={{ fontSize:18 }}>⎋</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:'rgba(242,100,100,0.80)', fontWeight:500 }}>Se déconnecter</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
