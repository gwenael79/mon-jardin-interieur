// ─────────────────────────────────────────────────────────────────────────────
//  DashboardPage.jsx  —  Coque principale du dashboard
//  Gère : sidebar, topbar, routing entre écrans, lumens, profil
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react"
import { useAuth }   from '../hooks/useAuth'
import { usePlant }  from '../hooks/usePlant'
import { useCircle } from '../hooks/useCircle'
import { useDefi }   from '../hooks/useDefi'
import { supabase }  from '../core/supabaseClient'
import '../styles/dashboard.css'

import { useIsMobile, useProfile, useLumens, LumenBadge, LumenOrb, LumensCard } from './dashboardShared'
import { ScreenMonJardin, DailyQuizModal } from './ScreenMonJardin'
import { ScreenJardinCollectif, ScreenDefis } from './ScreenDefis'
import { ScreenClubJardiniers } from './ScreenClubJardiniers'
import { ScreenAteliers }       from './ScreenAteliers'
import { HelpModal }            from './HelpModal'

// ── Navigation ───────────────────────────────────────────────────────────────
const SCREENS = [
  { id:'jardin',   icon:'🌸', label:'Ma Fleur',            Component: ScreenMonJardin        },
  { id:'champ',    icon:'🌻', label:'Jardin Collectif',    Component: ScreenJardinCollectif   },
  { id:'club',     icon:'🪴', label:'Club des Jardiniers', Component: ScreenClubJardiniers    },
  { id:'ateliers', icon:'🌿', label:'Ateliers',            Component: ScreenAteliers           },
  { id:'defis',    icon:'✨', label:'Défis',               Component: ScreenDefis             },
]

// ── NavHub mobile ────────────────────────────────────────────────────────────
function NavHub({ active, onNavigate, onBilan, onLumens, lumens, todayPlant, stats, communityStats, gardenFlowerCount, hasDegradation, unreadMessages, pendingInvitations }) {
  const bilanDone = hasDegradation
  const NAV_ITEMS = [
    { id:'bilan',    icon:'🌹', label:'Bilan du matin',     sub: bilanDone ? 'Demain nous ferons le point ensemble ✦' : 'Prendre soin de soi commence ici', action:'bilan',   color: bilanDone ? 'rgba(255,255,255,0.02)' : 'rgba(200,168,130,0.15)', border: bilanDone ? 'rgba(255,255,255,0.06)' : 'rgba(200,168,130,0.35)', done: bilanDone },
    { id:'jardin',   icon:'🌸', label:'Ma Fleur',           sub: todayPlant?.health != null ? `Vitalité ${todayPlant.health}%` : 'Votre plante du jour', action:'screen', color:'rgba(150,212,133,0.10)', border:'rgba(150,212,133,0.25)' },
    { id:'champ',    icon:'🌻', label:'Jardin Collectif',   sub: gardenFlowerCount != null ? `${gardenFlowerCount} fleurs actives` : 'La communauté',     action:'screen', color:'rgba(255,200,80,0.08)',  border:'rgba(255,200,80,0.20)'  },
    { id:'club',     icon:'🪴', label:'Club des Jardiniers',sub: stats?.myCircleCount > 0 ? `${stats.myCircleCount} cercles` : 'Vos cercles',             action:'screen', color:'rgba(130,200,160,0.08)', border:'rgba(130,200,160,0.20)' },
    { id:'ateliers', icon:'🌿', label:'Ateliers',           sub:'Pratiques & exercices',       action:'screen', color:'rgba(100,180,140,0.08)', border:'rgba(100,180,140,0.20)' },
    { id:'defis',    icon:'✨', label:'Défis',              sub: communityStats?.totalDefis > 0 ? `${communityStats.totalDefis} défis` : 'Challenges',     action:'screen', color:'rgba(180,140,255,0.08)', border:'rgba(180,140,255,0.20)' },
    { id:'lumens',   icon:'✦',  label:'Lumens',             sub: lumens ? `${lumens.available} disponibles · ${lumens.level}` : 'Votre lumière',          action:'lumens', color:'rgba(232,192,96,0.10)',  border:'rgba(232,192,96,0.28)'  },
  ]

  // Badge value par item
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
      flex:1, padding:'10px 16px 12px',
      display:'flex', flexDirection:'column', justifyContent:'space-between',
      overflow:'hidden',
    }}>
      {/* 7 boutons — remplissent toute la hauteur */}
      {NAV_ITEMS.map(item => {
        const badge = badges[item.id]
        return (
          <div
            key={item.id}
            onClick={() => {
              if (item.done) return
              if (item.action === 'bilan')  { onBilan() }
              if (item.action === 'lumens') { onLumens() }
              if (item.action === 'screen') { onNavigate(item.id) }
            }}
            style={{
              display:'flex', alignItems:'center', gap:14,
              padding:'0 16px',
              flex:1,
              background: item.id === active && item.action === 'screen' ? item.color.replace('0.10','0.20').replace('0.08','0.18').replace('0.15','0.25') : item.color,
              border:`1px solid ${item.border}`,
              borderRadius:14, cursor: item.done ? 'default' : 'pointer',
              WebkitTapHighlightColor:'transparent',
              transition:'all .18s',
              opacity: item.done ? 0.5 : 1,
              minHeight:0,
            }}
          >
            {/* Icône */}
            <div style={{
              width:56, height:56, borderRadius:16, flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize: item.id === 'lumens' ? 26 : 32,
              background:'rgba(255,255,255,0.04)',
              border:`1px solid ${item.border}`,
              color: item.id === 'lumens' ? '#e8c060' : 'inherit',
              filter: item.done ? 'grayscale(1)' : 'none',
            }}>
              {item.icon}
            </div>
            {/* Texte */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{
                fontSize:17, fontWeight:600,
                fontFamily:"'Jost', 'Inter', sans-serif",
                color: item.done ? 'rgba(242,237,224,0.30)' : 'var(--cream)',
                marginBottom:3, letterSpacing:'-0.01em',
              }}>{item.label}</div>
              {item.id === 'bilan' && !item.done ? (
                <div style={{
                  fontSize:11, color:'rgba(200,168,130,0.80)',
                  animation:'navPulse 2.5s ease-in-out infinite',
                  fontStyle:'italic',
                }}>{item.sub}</div>
              ) : (
                <div style={{ fontSize:11, color: item.done ? 'rgba(242,237,224,0.20)' : 'rgba(242,237,224,0.42)', letterSpacing:'0.01em' }}>{item.sub}</div>
              )}
            </div>
            {/* Badge compteur */}
            {badge && !item.done && (
              <div style={{
                flexShrink:0,
                padding:'5px 13px', borderRadius:100,
                background: item.id === 'lumens' || item.id === 'ateliers' ? 'rgba(232,192,96,0.15)' : item.id === 'club' ? 'rgba(210,80,80,0.15)' : 'rgba(150,212,133,0.15)',
                border: `1px solid ${item.id === 'lumens' || item.id === 'ateliers' ? 'rgba(232,192,96,0.38)' : item.id === 'club' ? 'rgba(210,80,80,0.38)' : 'rgba(150,212,133,0.32)'}`,
                fontSize:13, fontWeight:700,
                color: item.id === 'lumens' || item.id === 'ateliers' ? '#e8c060' : item.id === 'club' ? 'rgba(255,110,110,0.95)' : '#96d485',
                fontFamily:"'Jost', 'Inter', sans-serif",
                letterSpacing:'-0.01em',
                whiteSpace:'nowrap',
              }}>
                {badge}
              </div>
            )}
            {item.done && <div style={{ fontSize:18, color:'rgba(150,212,133,0.35)', flexShrink:0 }}>✓</div>}
            {!badge && !item.done && <div style={{ fontSize:18, color:'rgba(242,237,224,0.15)', flexShrink:0 }}>›</div>}
          </div>
        )
      })}
    </div>
  )
}

// ── Modal Profil ─────────────────────────────────────────────────────────────
function ProfileModal({ user, onClose }) {
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
        <div className="profile-modal-title">Mon profil</div>
        <div className="profile-modal-sub">Votre prénom ou pseudo visible dans les cercles.</div>
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
      </div>
    </div>
  )
}


// ── Composant StreakMessage (utilisé dans la topbar) ─────────────────────────
function StreakMessage({ streak }) {
  if (!streak || streak < 2) return null
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:6,
      padding:'4px 12px', borderRadius:20,
      background:'rgba(232,192,96,0.10)', border:'1px solid rgba(232,192,96,0.22)',
      fontSize:11, color:'#e8c060',
    }}>
      🔥 {streak} jours de suite
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
  const [active, setActive]                 = useState('nav')
  const [showNavHub,         setShowNavHub]         = useState(false)
  const [showBilanModal,     setShowBilanModal]     = useState(false)
  const [bilanCompleted,     setBilanCompleted]     = useState(false)
  const { user, signOut }                   = useAuth()
  const { todayPlant, stats: plantStats }   = usePlant(user?.id)
  const { communityStats }                  = useDefi(user?.id)
  const { stats, circleMembers, activeCircle } = useCircle(user?.id)

  const profile                       = useProfile(user?.id)
  const { lumens, award: awardLumens, refresh } = useLumens(user?.id)

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
  const [showMjRight,        setShowMjRight]        = useState(false)
  const [showLumensModal,    setShowLumensModal]    = useState(false)
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false)
  const [showHelp,           setShowHelp]           = useState(false)

  // Sur desktop, 'nav' n'existe pas — rediriger vers jardin
  const effectiveActive = (!isMobile && active === 'nav') ? 'jardin' : active
  // Recharge le compteur coeurs quand on revient sur le NavHub
  useEffect(() => { if (effectiveActive === 'nav') refreshCoeurs() }, [effectiveActive])


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
  }[effectiveActive] ?? { title: <><em>Navigation</em></>, btn: null }

  return (
    <div className="root">
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
              setShowBilanModal(false)
              setBilanDoneToday(true)
              // Transmettre au ScreenMonJardin via event custom
              window.dispatchEvent(new CustomEvent('bilanComplete', { detail: deg }))
            }}
            onSkip={() => {
              setShowBilanModal(false)
              window.dispatchEvent(new CustomEvent('bilanComplete', { detail: { roots:50, stem:50, leaves:50, flowers:50, breath:50 } }))
            }}
          />
        )}

        {/* ── SIDEBAR ── */}
        <div className="sidebar">
          <div className="sb-logo">Mon <em>Jardin</em><br />Intérieur</div>
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
              if (s.id === 'club')     badgeVal = stats?.myCircleCount > 0 ? stats.myCircleCount : null
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
            <div className="sb-subscribe" onClick={() => window.openAccessModal?.()}>
              <span>🌸</span> Abonnement
            </div>
            {['aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7'].includes(user?.id) && (
              <div className="sb-logout" style={{ color:'rgba(255,200,100,0.7)', borderColor:'rgba(255,200,100,0.2)', position:'relative' }}
                onClick={() => window.location.hash = 'admin'}>
                <span>⚙️</span> Admin
                {pendingReports > 0 && (
                  <div style={{ position:'absolute', top:-6, right:-6, background:'rgba(210,80,80,0.9)', color:'#fff', fontSize:9, fontWeight:600, minWidth:16, height:16, borderRadius:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>
                    {pendingReports}
                  </div>
                )}
              </div>
            )}
            <div className="sb-logout" onClick={signOut}>
              <span>⎋</span> Se déconnecter
            </div>
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
            {active === 'jardin' && !isMobile && <StreakMessage streak={plantStats?.streak ?? 0} />}
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
