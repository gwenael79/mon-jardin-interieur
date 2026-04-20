import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthInit, useAuth } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import DashboardPage from './pages/DashboardV2'
import AccessPage, { FlowerModal, PremiumModal } from './pages/AccessPage'
import { useSubscription } from './hooks/useSubscription'
import { AdminPage } from './pages/AdminPage'
import { AdminClientsPage } from './pages/AdminClientsPage'
import { AdminActivitePage } from './pages/AdminActivitePage'
import { query, supabase } from './core/supabaseClient'
import { OnboardingScreen } from './pages/OnboardingScreen'
import { WeekOneFlow }      from './pages/WeekOneFlow'
import { EndOfWeekScreen }  from './pages/EndOfWeekScreen'
import { ProProfile }       from './pages/ProProfile'
import InstallPrompt from './components/InstallPrompt'

import { useGardenNotification, getPlantStateIndex, PLANT_STATES } from './hooks/useGardenNotification'
import { useLastVisit }          from './hooks/useLastVisit'
import GardenNotificationBanner  from './components/GardenNotificationBanner'
import PlantIcon                 from './components/PlantIcon'

const ADMIN_IDS = ['aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7']

const FLOWER_NAMES = [
  'Aubépine','Cèdre','Pivoine','Iris','Verveine','Jasmin','Glycine',
  'Lilas','Noisetier','Pervenche','Sauge','Lavande','Magnolia','Acacia',
  'Clématite','Bruyère','Capucine','Gentiane','Muguet','Orchidée','Tilleul',
  'Violette','Camélia','Renoncule','Mimosa','Angélique','Bouleau','Eglantine',
  'Chèvrefeuille','Coquelicot',
]

export default function App() {
  useAuthInit()
  const { user, isLoading: authLoading } = useAuth()
  const { activateFree, refresh } = useSubscription()

  const [screen,          setScreen]          = useState('loading')
  const [isPro,           setIsPro]           = useState(false)
  const [showProProfile,  setShowProProfile]  = useState(false)
  const [showProWelcome,  setShowProWelcome]  = useState(false)
  const [showProFlower,   setShowProFlower]   = useState(false)
  const [proSelFlower,    setProSelFlower]    = useState(null)
  const [proSavingFlower, setProSavingFlower] = useState(false)
  const [proDisplayName,  setProDisplayName]  = useState('')
  const [showProCancelConfirm, setShowProCancelConfirm] = useState(false)
  const [proCancelLoading,     setProCancelLoading]     = useState(false)
  const [reopenPremium, setReopenPremium] = useState(() => sessionStorage.getItem('reopen_premium') === '1')
  const [toast,  setToast]  = useState(null)
  const [hash,   setHash]   = useState(window.location.hash)
  const toastTimer = useRef(null)

  const [banner,     setBanner]     = useState(null)
  const [plantState, setPlantState] = useState(0)
  const [badge,      setBadge]      = useState(false)
  const { daysSince } = useLastVisit(screen === 'dashboard' ? user?.id : null)
  useGardenNotification({
    daysSince,
    onShowBanner: useCallback((msg) => setBanner(msg), []),
    onSetBadge:   useCallback((v)   => setBadge(v),   []),
    onSetPlant:   useCallback((idx) => setPlantState(idx), []),
  })

  const [isRecovery, setIsRecovery] = useState(() => {
    const params = new URLSearchParams(window.location.hash.replace('#', '?'))
    const error = params.get('error'), errorDesc = params.get('error_description')
    if (error === 'access_denied' && errorDesc?.includes('expired')) return 'expired'
    return params.get('type') === 'recovery' ? true : false
  })

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    window.openAccessModal = () => setScreen('access')
    return () => { delete window.openAccessModal }
  }, [])

  useEffect(() => {
    if (!ADMIN_IDS.includes(user?.id)) return
    if (hash === '#admin')    setScreen('admin')
    if (hash === '#clients')  setScreen('admin-clients')
    if (hash === '#activite') setScreen('admin-activite')
  }, [hash, user?.id])

  // ── Initialisation principale ──────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return

    if (!user) { setScreen('auth'); return }
    if (isRecovery) { setScreen('recovery'); return }

    const params = new URLSearchParams(window.location.search)
    if (params.has('test-onboarding')) { setScreen('onboarding'); return }
    if (params.has('test-weekone') || params.has('test-garden') || params.get('test-day')) { setScreen('weekone'); return }
    if (ADMIN_IDS.includes(user.id) && window.location.hash === '#admin')    { setScreen('admin');          return }
    if (ADMIN_IDS.includes(user.id) && window.location.hash === '#clients')  { setScreen('admin-clients');  return }
    if (ADMIN_IDS.includes(user.id) && window.location.hash === '#activite') { setScreen('admin-activite'); return }

    // Retour depuis Stripe — succès → vider le cache profil + attendre webhook
    if (params.get('premium') === 'success') {
      window.history.replaceState({}, '', window.location.pathname)
      // Vider le cache profil localStorage pour forcer un refetch
      try { localStorage.removeItem(`mji_profile_${user.id}`) } catch {}
      setScreen('loading')
      // Attendre 3s que le webhook ait le temps de mettre à jour users.plan
      setTimeout(async () => {
        await refresh()
        setToast({ icon: '✨', msg: 'Abonnement activé — bienvenue dans Mon Jardin Premium !' })
        setTimeout(() => setToast(null), 3500)
        setScreen('dashboard')
      }, 3000)
      return
    }

    // Retour depuis Stripe — annulation → rouvrir le modal premium
    if (params.get('premium') === 'cancel') {
      window.history.replaceState({}, '', window.location.pathname)
      setScreen('dashboard')
      sessionStorage.setItem('reopen_premium', '1')
      return
    }

    setScreen('loading')
    ;(async () => {
      const { data: userData } = await supabase
        .from('users').select('onboarded, onboarding_completed, role').eq('id', user.id).maybeSingle()

      // Détecter le rôle pro dès le départ
      if (userData?.role === 'pro') {
        setIsPro(true)
        if (localStorage.getItem('mji_show_pro_welcome') === '1') {
          setShowProWelcome(true)
        }
      }

      const isOnboarded = userData?.onboarded === true

      if (isOnboarded && sessionStorage.getItem('pendingOnboarding') === 'true') {
        sessionStorage.removeItem('pendingOnboarding')
        setScreen('dashboard'); return
      }

      if (!isOnboarded) {
        setScreen('activating')
        try {
          await activateFree()
          await supabase.from('users').update({ onboarded: true }).eq('id', user.id)
          await refresh()
        } catch (e) { console.warn('[auto-activate]', e) }
        if (localStorage.getItem('mji_show_pro_welcome') === '1') {
          setProDisplayName(user.user_metadata?.display_name?.split(' ')[0] || '')
          setScreen('pro_welcome'); return
        }
        setScreen('flower'); return
      }

      // Si l'onboarding n'est pas terminé → retourner à l'onboarding
      if (!userData?.onboarding_completed) {
        setScreen('onboarding'); return
      }

      const daysSinceReg = Math.floor((Date.now() - new Date(user.created_at)) / 86400000)
      if (daysSinceReg < 7) {
        const { data: profileData } = await supabase
          .from('profiles').select('week_one_data').eq('id', user.id).maybeSingle()
        const completedDays = profileData?.week_one_data?.completedDays ?? []
        if (completedDays.length < 7) { setScreen('weekone'); return }
      }

      setScreen('dashboard')
    })()
  }, [user?.id, authLoading, isRecovery])

  const showToast = (icon, msg) => {
    clearTimeout(toastTimer.current)
    setToast({ icon, msg })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  const handlePaySuccess = async ({ plan }) => {
    await query(
      supabase.from('users').update({ onboarded: true, plan: 'premium' }).eq('id', user.id),
      'handlePaySuccess'
    )
    showToast('✨', `Abonnement ${plan.label} activé !`)
    await refresh()
    setScreen('dashboard')
  }

  // ── Test URL params ────────────────────────────────────────────────────────
  const params = new URLSearchParams(window.location.search)

  // ── Rendu ─────────────────────────────────────────────────────────────────
  if (screen === 'loading' || screen === 'activating' || authLoading) {
    return <div style={styles.loading}><span>🌱</span></div>
  }

  if (!user || screen === 'auth') return <AuthPage />

  if (screen === 'recovery' || isRecovery) {
    return (
      <AuthPage
        initialView={isRecovery === 'expired' ? 'reset' : 'newpassword'}
        resetError={isRecovery === 'expired' ? 'Votre lien a expiré. Demandez un nouveau lien.' : undefined}
        onPasswordUpdated={() => { setIsRecovery(false); setScreen('dashboard') }}
      />
    )
  }

  if (screen === 'admin')          return <AdminPage />
  if (screen === 'admin-clients')  return <AdminClientsPage />
  if (screen === 'admin-activite') return <AdminActivitePage />

  if (params.has('test-onboarding')) {
    return (
      <OnboardingScreen
        userId={user.id}
        onComplete={() => {
          window.history.replaceState({}, '', window.location.pathname)
          setScreen('weekone')
        }}
      />
    )
  }

  if (params.has('test-weekone') || params.has('test-garden') || params.get('test-day')) {
    const testDayNum = params.get('test-day')
      ? Math.min(Math.max(parseInt(params.get('test-day'), 10), 1), 7) : null
    return (
      <WeekOneFlow
        userId={user.id}
        forceDay={testDayNum ?? undefined}
        forceGarden={params.has('test-garden') || undefined}
        onComplete={() => { window.history.replaceState({}, '', window.location.pathname); setScreen('weekone_rest') }}
        onAllDone={() => { window.history.replaceState({}, '', window.location.pathname); setScreen('endofweek') }}
      />
    )
  }

  if (screen === 'flower') {
    return (
      <FlowerModal
        userId={user.id}
        onDone={() => setScreen('onboarding')}
        onSkip={() => setScreen('onboarding')}
      />
    )
  }

  if (screen === 'pro_welcome') {
    const handleCancelPro = async () => {
      setProCancelLoading(true)
      try {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (u) {
          await supabase.from('users_pro').delete().eq('user_id', u.id)
          await supabase.from('users').delete().eq('id', u.id)
          localStorage.setItem('mji_go_register', '1')
          await supabase.auth.signOut()
        }
      } catch(e) { console.warn('[CancelPro]', e) }
      finally { setProCancelLoading(false); setShowProCancelConfirm(false) }
    }

    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500;600&display=swap');
          @keyframes authFadeIn  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
          @keyframes authFormIn  { from{opacity:0;transform:scale(.97)}       to{opacity:1;transform:scale(1)}     }
          .pw-overlay  { position:fixed;inset:0;z-index:1100;background:rgba(5,15,5,.78);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px;animation:authFadeIn .3s ease both; }
          .pw-modal    { background:#faf8f4;border:1px solid rgba(180,210,140,.35);border-radius:28px;width:min(560px,100%);max-height:92vh;overflow-y:auto;padding:0;position:relative;box-shadow:0 24px 80px rgba(30,60,10,.18);animation:authFormIn .4s cubic-bezier(.22,1,.36,1) both;scrollbar-width:thin;scrollbar-color:rgba(90,154,40,.20) transparent; }
          .pw-header   { padding:44px 40px 28px;text-align:center;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(90,154,40,.06) 0%,transparent 70%); }
          .pw-icon     { font-size:44px;margin-bottom:14px;display:inline-block;filter:drop-shadow(0 4px 12px rgba(90,154,40,.20)); }
          .pw-title    { font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;color:#1a1208;line-height:1.25;margin-bottom:10px;letter-spacing:.01em; }
          .pw-sub      { font-size:18px;color:rgba(30,20,8,.55);line-height:1.7;margin-bottom:0;max-width:420px;margin-left:auto;margin-right:auto; }
          .pw-sep      { height:1px;background:linear-gradient(to right,transparent,rgba(90,154,40,.25),transparent);margin:24px 40px; }
          .pw-section  { padding:0 40px 20px; }
          .pw-sec-title{ font-size:15px;letter-spacing:.12em;text-transform:uppercase;color:rgba(60,120,20,.85);font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px; }
          .pw-sec-title::after{ content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(90,154,40,.18),transparent); }
          .pw-item     { display:flex;align-items:flex-start;gap:16px;margin-bottom:12px;padding:16px 18px;border-radius:14px;background:#fff;border:1px solid rgba(200,190,175,.45);transition:border-color .2s,box-shadow .2s; }
          .pw-item:hover{ border-color:rgba(90,154,40,.35);box-shadow:0 2px 12px rgba(90,154,40,.08); }
          .pw-item:last-child{ margin-bottom:0; }
          .pw-item-icon{ width:42px;height:42px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px; }
          .pw-item-icon.green{ background:rgba(90,154,40,.12);box-shadow:0 0 0 1px rgba(90,154,40,.18); }
          .pw-item-icon.gold { background:rgba(200,160,48,.10);box-shadow:0 0 0 1px rgba(200,160,48,.18); }
          .pw-item-body{ flex:1;min-width:0; }
          .pw-item-title{ font-size:18px;font-weight:600;color:#1a1208;margin-bottom:4px;letter-spacing:.01em; }
          .pw-item-desc { font-size:18px;color:rgba(30,20,8,.58);line-height:1.65; }
          .pw-cta      { padding:24px 40px 36px;text-align:center; }
          .pw-btn      { width:100%;padding:16px;border-radius:50px;border:none;background:linear-gradient(135deg,#4a8a20,#2e6808);color:#fff;font-size:18px;font-weight:600;font-family:'Jost',sans-serif;cursor:pointer;box-shadow:0 6px 24px rgba(42,104,8,.28);transition:filter .2s,transform .15s;letter-spacing:.03em; }
          .pw-btn:hover{ filter:brightness(1.08);transform:translateY(-1px); }
          .pw-btn:active{ transform:translateY(0); }
          .pw-tagline  { margin-top:14px;font-size:18px;color:#1a1208;letter-spacing:.04em;font-family:'Cormorant Garamond',serif;font-style:italic; }
          @media(max-width:520px){ .pw-header{padding:32px 24px 20px} .pw-section{padding:0 24px 18px} .pw-sep{margin:18px 24px} .pw-cta{padding:18px 24px 28px} .pw-item{padding:12px 14px;gap:12px} }
          .pf-grid{ display:grid;grid-template-columns:repeat(3,1fr);gap:7px;max-height:200px;overflow-y:auto;margin-bottom:18px; }
          .pf-pill{ padding:8px 4px;border-radius:20px;font-size:12px;text-align:center;border:1.5px solid rgba(200,160,150,.20);cursor:pointer;color:rgba(30,20,8,.55);transition:all .15s;background:rgba(255,255,255,.55); }
          .pf-pill:hover{ border-color:rgba(90,154,40,.40);color:rgba(30,20,8,.85); }
          .pf-pill.sel { border-color:rgba(90,154,40,.55);background:rgba(90,154,40,.10);color:#2e6808;font-weight:500; }
          .pc-overlay  { position:fixed;inset:0;z-index:1200;background:rgba(10,20,5,.60);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:authFadeIn .2s ease both; }
          .pc-modal    { background:#faf8f4;border-radius:22px;width:min(440px,100%);padding:36px 32px 28px;position:relative;box-shadow:0 20px 60px rgba(30,60,10,.20);border:1px solid rgba(180,210,140,.30);animation:authFormIn .3s cubic-bezier(.22,1,.36,1) both;text-align:center; }
          .pc-confirm-btn{ width:100%;padding:14px;border-radius:50px;border:1px solid rgba(180,60,60,.20);background:rgba(180,60,60,.10);color:#b03030;font-size:18px;font-weight:600;font-family:'Jost',sans-serif;cursor:pointer;transition:background .18s; }
          .pc-confirm-btn:hover{ background:rgba(180,60,60,.18); }
          .pc-confirm-btn:disabled{ opacity:.4;cursor:not-allowed; }
          .pc-back-btn { width:100%;padding:14px;border-radius:50px;border:1.5px solid rgba(42,104,8,.40);background:linear-gradient(135deg,#4a8a20,#2e6808);color:#fff;font-size:18px;font-weight:600;font-family:'Jost',sans-serif;cursor:pointer;transition:filter .18s; }
          .pc-back-btn:hover{ filter:brightness(1.08); }
        `}</style>

        {/* ── Étape 1 : modal d'information pro ── */}
        {!showProFlower && !showProCancelConfirm && (
          <div className="pw-overlay">
            <div className="pw-modal">

              <div className="pw-header">
                <div className="pw-icon">🌿</div>
                <div className="pw-title">Votre jardin professionnel<br/>vient de s'ouvrir</div>
                <div className="pw-sub">
                  En rejoignant Mon Jardin Intérieur en tant que professionnel(le),<br/>
                  vous entrez dans un écosystème conçu pour vous soutenir,<br/>vous et vos clients.
                </div>
              </div>

              <div className="pw-sep"/>

              <div className="pw-section">
                <div className="pw-sec-title">🌱 Ce que vos clients reçoivent</div>
                <div className="pw-item">
                  <div className="pw-item-icon green">🎁</div>
                  <div className="pw-item-body">
                    <div className="pw-item-title">−10 % sur leur abonnement</div>
                    <div className="pw-item-desc">En utilisant votre code, ils bénéficient d'une réduction immédiate et permanente. Une vraie valeur ajoutée à votre accompagnement.</div>
                  </div>
                </div>
                <div className="pw-item">
                  <div className="pw-item-icon green">🌸</div>
                  <div className="pw-item-body">
                    <div className="pw-item-title">Un outil de soin quotidien</div>
                    <div className="pw-item-desc">Entre deux séances, Mon Jardin Intérieur les accompagne : bilan émotionnel, rituels, club de soutien. Votre travail continue en dehors du cabinet.</div>
                  </div>
                </div>
                <div className="pw-item">
                  <div className="pw-item-icon green">🤝</div>
                  <div className="pw-item-body">
                    <div className="pw-item-title">Un lien durable avec vous</div>
                    <div className="pw-item-desc">Votre code crée un lien traçable et pérenne. Chaque client que vous orientez reste attaché à votre identifiant, pour toujours.</div>
                  </div>
                </div>
              </div>

              <div className="pw-sep"/>

              <div className="pw-section">
                <div className="pw-sec-title">🤝 Un partenariat gagnant / gagnant</div>
                <div className="pw-item">
                  <div className="pw-item-icon green">🪴</div>
                  <div className="pw-item-body">
                    <div className="pw-item-title">Vous recommandez, ils progressent</div>
                    <div className="pw-item-desc">Chaque client que vous orientez bénéficie d'un outil complémentaire à votre suivi, et vous êtes récompensé(e) à chaque renouvellement.</div>
                  </div>
                </div>
                <div className="pw-item">
                  <div className="pw-item-icon gold">🔗</div>
                  <div className="pw-item-body">
                    <div className="pw-item-title">Un lien tracé à vie</div>
                    <div className="pw-item-desc">Même si vous ne suivez plus un client directement, le lien avec votre code reste actif. Votre commission aussi.</div>
                  </div>
                </div>
              </div>

              <div className="pw-sep"/>

              <div className="pw-section">
                <div className="pw-sec-title">✦ Ce que vous gagnez</div>
                <div className="pw-item">
                  <div className="pw-item-icon gold">🪪</div>
                  <div className="pw-item-body">
                    <div className="pw-item-title">Un identifiant partenaire unique</div>
                    <div className="pw-item-desc">Votre code personnel tracera chaque client que vous recommandez, à vie. Même si vous ne les suivez plus directement.</div>
                  </div>
                </div>
                <div className="pw-item">
                  <div className="pw-item-icon gold">💰</div>
                  <div className="pw-item-body">
                    <div className="pw-item-title">10 % de commission récurrente</div>
                    <div className="pw-item-desc">À chaque renouvellement d'abonnement de vos clients (mensuel ou annuel), une commission de 10 % est automatiquement créditée sur votre solde. (Contrat portage d'affaires.)</div>
                  </div>
                </div>
                <div className="pw-item">
                  <div className="pw-item-icon gold">📊</div>
                  <div className="pw-item-body">
                    <div className="pw-item-title">Un tableau de bord transparent</div>
                    <div className="pw-item-desc">Suivez en temps réel vos clients affiliés, votre historique de CA et votre solde disponible depuis votre espace pro.</div>
                  </div>
                </div>
              </div>

              <div className="pw-sep"/>

              <div className="pw-section">
                <div className="pw-sec-title">🛍️ Votre vitrine dans l'application</div>
                <div className="pw-item">
                  <div className="pw-item-icon green">🌿</div>
                  <div className="pw-item-body">
                    <div className="pw-item-title">Ateliers &amp; formations en ligne</div>
                    <div className="pw-item-desc">Proposez vos ateliers bien-être directement aux abonnés de Mon Jardin Intérieur. Séances live, replays, formations à votre rythme.</div>
                  </div>
                </div>
                <div className="pw-item">
                  <div className="pw-item-icon gold">🎧</div>
                  <div className="pw-item-body">
                    <div className="pw-item-title">Audios &amp; e-books dans la Jardinothèque</div>
                    <div className="pw-item-desc">Déposez vos créations numériques — méditations guidées, protocoles, guides pratiques — et commercialisez-les auprès de toute la communauté.</div>
                  </div>
                </div>
                <div className="pw-item">
                  <div className="pw-item-icon green">✨</div>
                  <div className="pw-item-body">
                    <div className="pw-item-title">Une audience déjà là</div>
                    <div className="pw-item-desc">Pas besoin de construire une liste. Vos ressources sont visibles par des abonnés en recherche active de soutien et d'outils de mieux-être.</div>
                  </div>
                </div>
              </div>

              <div className="pw-cta">
                <div style={{fontSize:16,color:'#1a1208',lineHeight:1.65,marginBottom:16,fontStyle:'italic',fontFamily:"'Cormorant Garamond',serif"}}>
                  Un mail vous sera adressé avec plus de précisions dès votre avancement dans l'aventure.
                </div>
                <button className="pw-btn" onClick={() => { localStorage.removeItem('mji_show_pro_welcome'); setShowProFlower(true) }}>
                  Commencer mon aventure pro →
                </button>
                <div className="pw-tagline">Chaque geste de soin est une graine.</div>
                <button
                  onClick={() => setShowProCancelConfirm(true)}
                  style={{marginTop:18,background:'none',border:'none',color:'rgba(30,20,8,.32)',fontSize:18,fontFamily:"'Jost',sans-serif",cursor:'pointer',textDecoration:'underline',textUnderlineOffset:3,letterSpacing:'.01em',transition:'color .15s'}}
                  onMouseOver={e=>e.target.style.color='rgba(180,60,60,.70)'}
                  onMouseOut={e=>e.target.style.color='rgba(30,20,8,.32)'}
                >
                  Je ne souhaite pas créer de compte pro
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── Étape 2 : choix de la fleur pro ── */}
        {showProFlower && (
          <div style={{position:'fixed',inset:0,zIndex:1200,background:'rgba(10,20,5,.55)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,animation:'authFadeIn .25s ease both'}}>
            <div style={{background:'rgba(252,248,242,.97)',borderRadius:24,width:'min(420px,100%)',maxHeight:'90vh',overflowY:'auto',padding:'36px 32px',position:'relative',boxShadow:'0 20px 60px rgba(30,60,10,.22)',border:'1.5px solid rgba(180,210,140,.35)',animation:'authFormIn .35s cubic-bezier(.22,1,.36,1) both'}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:400,color:'#1a1208',marginBottom:8}}>Votre identité florale 🌸</div>
              <div style={{fontSize:18,color:'#1a1208',marginBottom:10,lineHeight:1.65}}>
                Ici pas de nom. Chaque membre du jardin est identifié par son prénom et une fleur.<br/>
                <span style={{fontSize:16,color:'rgba(30,20,8,.40)',fontStyle:'italic'}}>Ex : Marie · Lavande</span>
              </div>
              {proDisplayName && (
                <div style={{fontSize:18,color:'#1a1208',marginBottom:20,lineHeight:1.5}}>
                  <em style={{fontStyle:'italic'}}>{proDisplayName}</em> · {proSelFlower ?? '…'}
                </div>
              )}
              <div style={{textAlign:'center',padding:'10px 0 14px',fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1208',minHeight:44}}>
                {proSelFlower
                  ? <><span>🌸</span> {proDisplayName} · <span>{proSelFlower}</span></>
                  : 'Choisissez votre fleur ci-dessous'}
              </div>
              <div className="pf-grid">
                {FLOWER_NAMES.map(n => (
                  <div key={n} className={'pf-pill'+(proSelFlower===n?' sel':'')} style={{fontSize:16}} onClick={()=>setProSelFlower(n)}>{n}</div>
                ))}
              </div>
              <button
                disabled={!proSelFlower || proSavingFlower}
                onClick={async () => {
                  if (!proSelFlower || proSavingFlower) return
                  setProSavingFlower(true)
                  try { await supabase.from('users').update({ flower_name: proSelFlower }).eq('id', user.id) }
                  catch(e) { console.warn('[pro flower]', e) }
                  setProSavingFlower(false)
                  setScreen('onboarding')
                }}
                style={{width:'100%',padding:'14px 20px',borderRadius:50,border:'none',background:'linear-gradient(135deg,#4a8a20,#2e6808)',color:'#fff',fontSize:18,fontWeight:600,fontFamily:"'Jost',sans-serif",cursor:'pointer',boxShadow:'0 5px 18px rgba(42,104,8,.28)',lineHeight:1.4,whiteSpace:'normal'}}
              >
                {proSavingFlower ? '…' : proSelFlower
                  ? <><span style={{display:'block',fontSize:18,fontWeight:600}}>Entrer dans mon jardin</span><span style={{fontSize:13,fontWeight:400,opacity:.80,letterSpacing:'.05em'}}>{proDisplayName ? `${proDisplayName} · ` : ''}{proSelFlower} →</span></>
                  : 'Choisissez une fleur'}
              </button>
              <div style={{marginTop:14,fontSize:18,color:'#1a1208',textAlign:'center',lineHeight:1.7}}>Modifiable dans vos paramètres.</div>
            </div>
          </div>
        )}

        {/* ── Modal confirmation annulation pro ── */}
        {showProCancelConfirm && (
          <div className="pc-overlay">
            <div className="pc-modal">
              <div style={{fontSize:40,marginBottom:14}}>🌿</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:600,color:'#1a1208',lineHeight:1.3,marginBottom:10}}>Êtes-vous sûr de vouloir annuler votre compte pro ?</div>
              <div style={{fontSize:18,color:'#1a1208',lineHeight:1.70,marginBottom:26}}>
                Vous passeriez à côté d'une offre gagnant / gagnant : commissions récurrentes, vitrine dans l'app, et des clients accompagnés entre vos séances.<br/><br/>
                Cette action supprimera définitivement votre inscription professionnelle.
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <button className="pc-back-btn" onClick={() => setShowProCancelConfirm(false)}>
                  ← Revenir à mon espace pro
                </button>
                <button className="pc-confirm-btn" onClick={handleCancelPro} disabled={proCancelLoading}>
                  {proCancelLoading ? 'Annulation en cours…' : 'Oui, annuler mon compte pro'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  if (screen === 'onboarding') {
    return (
      <>
        <OnboardingScreen userId={user.id} onComplete={async () => {
          await supabase.from('users').update({ onboarding_completed: true }).eq('id', user.id)
          setScreen('weekone')
        }} />
      </>
    )
  }

  if (screen === 'weekone') {
    return (
      <>
        <WeekOneFlow
          userId={user.id}
          onComplete={() => setScreen('weekone_rest')}
          onAllDone={() => setScreen('endofweek')}
          onOpenProProfile={() => setShowProProfile(true)}
          isPro={isPro}
        />
        {showProProfile && (
          <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(10,20,5,.60)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ width:'100%', maxWidth:860, maxHeight:'92vh', overflowY:'auto', borderRadius:24, background:'linear-gradient(160deg,#f5f0e8,#dde8d0)', boxShadow:'0 16px 60px rgba(30,60,10,.22)', border:'1.5px solid rgba(180,210,140,.35)' }}>
              <ProProfile onBack={() => setShowProProfile(false)} />
            </div>
          </div>
        )}
      </>
    )
  }

  if (screen === 'weekone_rest') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(12,28,8,0.60)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <style>{`
          @keyframes floatZ { 0%{opacity:0;transform:translateY(0) scale(.85)} 18%{opacity:.92} 80%{opacity:.35} 100%{opacity:0;transform:translateY(-72px) scale(1.08)} }
          .fz1{animation:floatZ 3.2s ease-out infinite 0s}
          .fz2{animation:floatZ 3.2s ease-out infinite 1.05s}
          .fz3{animation:floatZ 3.2s ease-out infinite 2.1s}
        `}</style>
        <div style={{ width: '100%', maxWidth: 440, borderRadius: 24, overflow: 'hidden', boxShadow: '0 28px 90px rgba(0,0,0,.50)', display: 'flex', flexDirection: 'column', height: 'min(580px, calc(100dvh - 32px))' }}>
          <div style={{ position: 'relative', flex: '1 1 0', minHeight: 0, overflow: 'hidden' }}>
            <img src="/jardinier-repos.png" alt="" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: 'center 15%' }} />
            <span className="fz1" style={{ position: 'absolute', left: '54%', top: '24%', fontFamily: 'Georgia,serif', fontSize: 22, fontStyle: 'italic', fontWeight: 'bold', color: '#3a5080', pointerEvents: 'none' }}>z</span>
            <span className="fz2" style={{ position: 'absolute', left: '60%', top: '16%', fontFamily: 'Georgia,serif', fontSize: 29, fontStyle: 'italic', fontWeight: 'bold', color: '#3a5080', pointerEvents: 'none' }}>z</span>
            <span className="fz3" style={{ position: 'absolute', left: '66%', top: '7%',  fontFamily: 'Georgia,serif', fontSize: 38, fontStyle: 'italic', fontWeight: 'bold', color: '#3a5080', pointerEvents: 'none' }}>Z</span>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 72, background: 'linear-gradient(to bottom, transparent, #faf8f2)', pointerEvents: 'none' }}/>
          </div>
          <div style={{ background: '#faf8f2', padding: '18px 28px 30px', textAlign: 'center', flexShrink: 0 }}>
            <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(20px,4.5vw,25px)', fontWeight: 600, fontStyle: 'italic', color: '#2a4a18', margin: '0 0 8px', lineHeight: 1.35 }}>Le jardinier aussi<br/>a besoin de repos.</p>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 13.5, color: '#5a6840', margin: '0 0 22px', lineHeight: 1.65, letterSpacing: '.02em' }}>Votre jardin intérieur a été semé.<br/>Laissez-le grandir en silence.</p>
            <button onClick={() => setScreen('weekone')} style={{ width: '100%', fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 500, color: '#fff', background: 'linear-gradient(135deg,#5a9a2e,#3a7a1a)', border: 'none', borderRadius: 100, padding: '14px 28px', cursor: 'pointer', letterSpacing: '.06em', boxShadow: '0 6px 22px rgba(60,100,20,.35)' }}>
              Revenir sur mon jardin intérieur
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'endofweek') {
    return (
      <EndOfWeekScreen
        userId={user.id}
        onContinue={(choice) => setScreen(choice === 'premium' ? 'access' : 'dashboard')}
      />
    )
  }

  if (screen === 'access') {
    return (
      <>
        <AccessPage
          openModal
          onActivateFree={() => setScreen('dashboard')}
          onSuccess={handlePaySuccess}
          onBack={() => setScreen('dashboard')}
        />
        {toast && <div style={styles.toast}><span>{toast.icon}</span><span>{toast.msg}</span></div>}
      </>
    )
  }

  // dashboard (écran par défaut)
  return (
    <>
      <DashboardPage />
      {reopenPremium && (
        <PremiumModal
          onSuccess={() => { setReopenPremium(false); sessionStorage.removeItem('reopen_premium') }}
          onClose={() => { setReopenPremium(false); sessionStorage.removeItem('reopen_premium') }}
        />
      )}
      <GardenNotificationBanner message={banner} onClose={() => setBanner(null)} />
      {plantState > 0 && (
        <div style={styles.plantFloat}>
          <PlantIcon stateIndex={plantState} showBadge={badge} size={36} />
          <span style={styles.plantLabel}>{PLANT_STATES[plantState].label}</span>
        </div>
      )}
      <InstallPrompt />
      {toast && <div style={styles.toast}><span>{toast.icon}</span><span>{toast.msg}</span></div>}
      <style>{`
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(16px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes plantFloatIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  )
}

const styles = {
  loading:    { minHeight: '100vh', background: '#080f07', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 },
  toast:      { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#132010', border: '1px solid rgba(168,224,64,0.25)', borderRadius: 30, padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#e2ddd3', boxShadow: '0 16px 48px rgba(0,0,0,0.5)', zIndex: 9998, whiteSpace: 'nowrap', animation: 'toastIn .4s cubic-bezier(0.34,1.56,0.64,1) both' },
  plantFloat: { position: 'fixed', bottom: 80, right: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, animation: 'plantFloatIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both', zIndex: 9000 },
  plantLabel: { fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(226,221,211,0.45)', fontWeight: 300 },
}
