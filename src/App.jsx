import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthInit, useAuth } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import AccessPage from './pages/AccessPage'
import { useSubscription } from './hooks/useSubscription'
import { AdminPage } from './pages/AdminPage'
import { query, supabase } from './core/supabaseClient'
import { OnboardingScreen } from './pages/OnboardingScreen'
import { WeekOneFlow }      from './pages/WeekOneFlow'
import InstallPrompt from './components/InstallPrompt'

// ── Notifications jardin ──────────────────────────────────
import { useGardenNotification, getPlantStateIndex, PLANT_STATES } from './hooks/useGardenNotification'
import { useLastVisit }          from './hooks/useLastVisit'
import GardenNotificationBanner  from './components/GardenNotificationBanner'
import PlantIcon                 from './components/PlantIcon'

const ADMIN_IDS = ['aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7']

export default function App() {
  // ── Auth init (une seule fois) ───────────────────────────
  useAuthInit()
  const { user, isLoading: authLoading } = useAuth()

  // ── Abonnements ──────────────────────────────────────────
  const { activateFree, saveSubscriptions, refresh } = useSubscription()

  // ── État onboarding ──────────────────────────────────────
  const [onboarded,       setOnboarded]       = useState(null)
  const [checkingOnboard, setCheckingOnboard] = useState(false)
  const [showSlides,      setShowSlides]      = useState(false)

  // ── État WeekOneFlow ─────────────────────────────────────
  const [showWeekOne, setShowWeekOne] = useState(false)

  // Détecter immédiatement si on revient d'un lien reset
  const [isRecovery, setIsRecovery] = useState(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', '?'))
    const type = params.get('type')
    const error = params.get('error')
    const errorDesc = params.get('error_description')
    // Erreur OTP expiré → afficher le formulaire reset avec message d'erreur
    if (error === 'access_denied' && errorDesc?.includes('expired')) return 'expired'
    return type === 'recovery' ? true : false
  })
  const [toast,    setToast]    = useState(null)
  const [hash,     setHash]     = useState(window.location.hash)
  const toastTimer              = useRef(null)

  // ── État notifications jardin ────────────────────────────
  const [banner,     setBanner]     = useState(null)   // message bannière | null
  const [plantState, setPlantState] = useState(0)      // 0 → 3
  const [badge,      setBadge]      = useState(false)

  // ── Dernière visite Supabase (seulement si connecté et onboardé) ──────────
  const { daysSince } = useLastVisit(onboarded === true ? user?.id : null)

  // ── Séquence de notifications (son + plante + bannière + badge + onglet) ──
  useGardenNotification({
    daysSince,
    onShowBanner: useCallback((msg) => setBanner(msg), []),
    onSetBadge:   useCallback((v)   => setBadge(v),   []),
    onSetPlant:   useCallback((idx) => setPlantState(idx), []),
  })

  // ── Vérifier le profil dès que l'user est connu ──────────
  useEffect(() => {
    if (!user) { setOnboarded(null); setShowWeekOne(false); return }
    setCheckingOnboard(true)
    supabase
      .from('users')
      .select('onboarded')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const isOnboarded = data?.onboarded === true
        setOnboarded(isOnboarded)
        if (!isOnboarded) setShowSlides(true)
        setCheckingOnboard(false)
      })
  }, [user?.id])

  // ── Vérifier si WeekOneFlow doit s'afficher ───────────────
  useEffect(() => {
    if (!user || onboarded !== true) return
    const daysSinceReg = Math.floor((Date.now() - new Date(user.created_at)) / 86400000)
    if (daysSinceReg >= 7) return
    supabase
      .from('profiles')
      .select('week_one_data')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const completedDays = data?.week_one_data?.completedDays ?? []
        if (completedDays.length < 7) setShowWeekOne(true)
      })
  }, [user?.id, onboarded])

  // ── Écouter les changements de hash ─────────────────────
  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // ── Intercepter PASSWORD_RECOVERY (retour lien email reset) ──
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Exposer openAccessModal globalement ─────────────────
  useEffect(() => {
    window.openAccessModal = () => setOnboarded(false)
    return () => { delete window.openAccessModal }
  }, [])

  // ── Retour au dashboard depuis AccessPage ────────────────
  const handleBackToDashboard = () => setOnboarded(true)

  // ── Toast ────────────────────────────────────────────────
  const showToast = (icon, msg) => {
    clearTimeout(toastTimer.current)
    setToast({ icon, msg })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  // ── Callbacks AccessPage ─────────────────────────────────
  const handleActivateFree = async () => {
    await activateFree()
    // Marquer comme onboardé en DB
    await supabase.from('users').update({ onboarded: true }).eq('id', user.id)
    showToast('🌱', 'Bienvenue dans votre jardin !')
    await refresh()
    setOnboarded(true)
  }

  const handlePaySuccess = async ({ plan }) => {
    await query(
      supabase.from('users')
        .update({ onboarded: true, plan: 'premium' })
        .eq('id', user.id),
      'handlePaySuccess'
    )
    showToast('✨', `Abonnement ${plan.label} activé !`)
    await refresh()
    setOnboarded(true)
  }

  // ── Chargement ───────────────────────────────────────────
  // Si on est en mode recovery, ne pas bloquer sur le spinner
  if (!isRecovery && (authLoading || checkingOnboard)) return (
    <div style={styles.loading}>
      <span>🌱</span>
    </div>
  )

  // ── Routing ──────────────────────────────────────────────

  // 🧪 TEST — accès direct via ?test-weekone dans l'URL (retirer avant prod)
  const isTestWeekOne = new URLSearchParams(window.location.search).has('test-weekone')
  if (isTestWeekOne) return (
    <WeekOneFlow
      userId={user?.id ?? null}
      onComplete={() => {
        window.history.replaceState({}, '', window.location.pathname)
        window.location.reload()
      }}
    />
  )

  // 🧪 TEST — accès direct au GardenDashboard via ?test-garden (retirer avant prod)
  const isTestGarden = new URLSearchParams(window.location.search).has('test-garden')
  if (isTestGarden) return (
    <WeekOneFlow
      userId={user?.id ?? null}
      forceGarden
      onComplete={() => {
        window.history.replaceState({}, '', window.location.pathname)
        window.location.reload()
      }}
    />
  )

  // 🧪 TEST — accès direct via ?test-onboarding dans l'URL (retirer avant prod)
  const isTestOnboarding = new URLSearchParams(window.location.search).has('test-onboarding')
  if (isTestOnboarding) return (
    <OnboardingScreen
      userId={null}
      onComplete={() => {
        window.history.replaceState({}, '', window.location.pathname)
        window.location.reload()
      }}
    />
  )

  // 0. Retour depuis lien email reset
  if (isRecovery === 'expired') return <AuthPage initialView="reset" resetError="Votre lien a expiré. Demandez un nouveau lien." onPasswordUpdated={() => setIsRecovery(false)} />
  if (isRecovery) return <AuthPage initialView="newpassword" onPasswordUpdated={() => setIsRecovery(false)} />

  // 1. Non connecté → AuthPage (pas de notifications)
  if (!user) return <AuthPage />

  // 2a. Nouvel utilisateur → slides de présentation d'abord
  if (onboarded === false && showSlides) return (
    <OnboardingScreen
      userId={user?.id}
      onComplete={() => setShowSlides(false)}
    />
  )

  // 2b. Slides terminées → AccessPage (choix plan)
  if (onboarded === false) return (
    <>
      <AccessPage
        onActivateFree={handleActivateFree}
        onSuccess={handlePaySuccess}
        onBack={handleBackToDashboard}
      />
      {toast && <div style={styles.toast}><span>{toast.icon}</span><span>{toast.msg}</span></div>}
    </>
  )

  // 3. Admin
  if (ADMIN_IDS.includes(user?.id) && hash === '#admin') return <AdminPage />

  // 4. Dashboard normal + notifications jardin
  return (
    <>
      <DashboardPage />

      {/* ── WeekOneFlow — 7 premiers jours ── */}
      {showWeekOne && (
        <WeekOneFlow
          userId={user.id}
          onComplete={() => setShowWeekOne(false)}
        />
      )}

      {/* ── Bannière de notification jardin ── */}
      <GardenNotificationBanner
        message={banner}
        onClose={() => setBanner(null)}
      />

      {/* ── Icône plante flottante (coin bas-gauche) ── */}
      {plantState > 0 && (
        <div style={styles.plantFloat}>
          <PlantIcon
            stateIndex={plantState}
            showBadge={badge}
            size={36}
          />
          <span style={styles.plantLabel}>
            {PLANT_STATES[plantState].label}
          </span>
        </div>
      )}

      {/* ── Invitation installation PWA ── */}
      <InstallPrompt />

      {/* ── Toast existant ── */}
      {toast && (
        <div style={styles.toast}>
          <span>{toast.icon}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateX(-50%) translateY(16px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        @keyframes plantFloatIn {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </>
  )
}

const styles = {
  loading: {
    minHeight: '100vh', background: '#080f07',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 32,
  },
  toast: {
    position: 'fixed', bottom: 24, left: '50%',
    transform: 'translateX(-50%)',
    background: '#132010', border: '1px solid rgba(168,224,64,0.25)',
    borderRadius: 30, padding: '12px 22px',
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 13.5, color: '#e2ddd3',
    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    zIndex: 9998, whiteSpace: 'nowrap',
    animation: 'toastIn .4s cubic-bezier(0.34,1.56,0.64,1) both',
  },
  plantFloat: {
    position: 'fixed', bottom: 80, right: 24,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    animation: 'plantFloatIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
    zIndex: 9000,
  },
  plantLabel: {
    fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
    color: 'rgba(226,221,211,0.45)', fontWeight: 300,
  }
}
