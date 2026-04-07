import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthInit, useAuth } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import DashboardPage from './pages/DashboardV2'
import AccessPage from './pages/AccessPage'
import { useSubscription } from './hooks/useSubscription'
import { AdminPage } from './pages/AdminPage'
import { query, supabase } from './core/supabaseClient'
import { OnboardingScreen } from './pages/OnboardingScreen'
import { WeekOneFlow }      from './pages/WeekOneFlow'
import { EndOfWeekScreen }  from './pages/EndOfWeekScreen'
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
  const [pendingOnboarding, setPendingOnboarding] = useState(
    () => sessionStorage.getItem('pendingOnboarding') === 'true'
  )

  // ── État WeekOneFlow ─────────────────────────────────────
  const [showWeekOne,          setShowWeekOne]          = useState(false)
  const [comingFromOnboarding, setComingFromOnboarding] = useState(false)
  const [showEndOfWeek,        setShowEndOfWeek]        = useState(false)
  const [autoActivating,       setAutoActivating]       = useState(false)
  const [weekOneClosed,  setWeekOneClosed]  = useState(false)
  const [weekOneChecked, setWeekOneChecked] = useState(false)
  const daysSinceReg = user ? Math.floor((Date.now() - new Date(user.created_at)) / 86400000) : 99

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
    if (!user) {
      setOnboarded(null)
      setShowWeekOne(false)
      setWeekOneClosed(false)
      setWeekOneChecked(false)
      return
    }
    setCheckingOnboard(true)
    supabase
      .from('users')
      .select('onboarded')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const isOnboarded = data?.onboarded === true
        setOnboarded(isOnboarded)
        if (!isOnboarded) {
          // Pas encore onboardé → activation gratuite automatique + onboarding
          setShowSlides(false)
        } else if (sessionStorage.getItem('pendingOnboarding') === 'true') {
          // Retour après paiement Stripe → enchaîner sur l'onboarding
          sessionStorage.removeItem('pendingOnboarding')
          setPendingOnboarding(false)
          setShowSlides(true)
        }
        setCheckingOnboard(false)
      })
  }, [user?.id])

  // ── Vérifier si WeekOneFlow doit s'afficher ───────────────
  useEffect(() => {
    if (!user || onboarded !== true) return
    if (daysSinceReg >= 7) { setWeekOneChecked(true); return }
    supabase
      .from('profiles')
      .select('week_one_data')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const completedDays = data?.week_one_data?.completedDays ?? []
        if (completedDays.length < 7) setShowWeekOne(true)
        // Si les 7 jours sont déjà validés : aller directement au dashboard
        // (ne pas passer par la page de repos)
        setWeekOneChecked(true)
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
    await supabase.from('users').update({ onboarded: true }).eq('id', user.id)
    showToast('🌱', 'Bienvenue dans votre jardin !')
    await refresh()
    setOnboarded(true)
    setShowSlides(true)  // → enchaîner sur l'onboarding (Gwenaël)
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
    setShowSlides(true)  // → enchaîner sur l'onboarding (Gwenaël)
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
        setWeekOneClosed(true); setShowWeekOne(false)
      }}
      onAllDone={() => {
        // Navigation propre — setShowWeekOne(false) serait un no-op si déjà false
        // (cas test5 : 7 jours déjà faits, showWeekOne n'a jamais été mis à true)
        window.location.href = window.location.pathname
      }}
    />
  )

  // 🧪 TEST — accès direct à un jour précis via ?test-day=N (retirer avant prod)
  const testDayParam = new URLSearchParams(window.location.search).get('test-day')
  const testDayNum   = testDayParam ? Math.min(Math.max(parseInt(testDayParam, 10), 1), 7) : null
  if (testDayNum) return (
    <WeekOneFlow
      userId={user?.id ?? null}
      forceDay={testDayNum}
      onComplete={() => {
        window.history.replaceState({}, '', window.location.pathname)
        setWeekOneClosed(true); setShowWeekOne(false)
      }}
      onAllDone={() => {
        window.location.href = window.location.pathname
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
        setWeekOneClosed(true); setShowWeekOne(false)
      }}
      onAllDone={() => {
        window.location.href = window.location.pathname
      }}
    />
  )

  // 🧪 TEST — accès direct via ?test-onboarding dans l'URL (retirer avant prod)
  const isTestOnboarding = new URLSearchParams(window.location.search).has('test-onboarding')
  if (isTestOnboarding) return (
    <OnboardingScreen
      userId={user?.id ?? null}
      onComplete={() => {
        window.history.replaceState({}, '', window.location.pathname)
        setComingFromOnboarding(true)
        setShowWeekOne(true)
      }}
    />
  )

  // 0. Retour depuis lien email reset
  if (isRecovery === 'expired') return <AuthPage initialView="reset" resetError="Votre lien a expiré. Demandez un nouveau lien." onPasswordUpdated={() => setIsRecovery(false)} />
  if (isRecovery) return <AuthPage initialView="newpassword" onPasswordUpdated={() => setIsRecovery(false)} />

  // 1. Non connecté → AuthPage (pas de notifications)
  if (!user) return <AuthPage />

  // 2. Profil en cours de chargement → écran blanc (évite le flash DashboardPage)
  if (onboarded === null) return null

  // 2c. WeekOne check en cours (< 7 jours) → on attend avant d'afficher quoi que ce soit
  if (onboarded === true && daysSinceReg < 7 && !weekOneChecked && !comingFromOnboarding) return null

  // 2a. Nouvel utilisateur → activation gratuite automatique + onboarding direct
  if (onboarded === false) {
    if (!autoActivating) {
      setAutoActivating(true)
      ;(async () => {
        try {
          await activateFree()
          await supabase.from('users').update({ onboarded: true }).eq('id', user.id)
          await refresh()
        } catch (e) {
          console.warn('[auto-activate]', e)
        }
        setOnboarded(true)
        setAutoActivating(false)
        setShowSlides(true)
      })()
    }
    return (
      <div style={styles.loading}>
        <span>🌱</span>
      </div>
    )
  }

  // 2b. AccessPage terminé → OnboardingScreen (Gwenaël + slides)
  if (onboarded === true && showSlides) return (
    <OnboardingScreen
      userId={user?.id}
      onComplete={() => { setShowSlides(false); setComingFromOnboarding(true); setShowWeekOne(true) }}
    />
  )

  // 3. Admin
  if (ADMIN_IDS.includes(user?.id) && hash === '#admin') return <AdminPage />

  // 3b. WeekOneFlow fermé → écran de repos (seulement dans les 7 premiers jours)
  if (weekOneClosed && (daysSinceReg < 7 || comingFromOnboarding)) return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(12,28,8,0.60)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <style>{`
        @keyframes floatZ {
          0%   { opacity: 0;    transform: translateY(0px) scale(0.85); }
          18%  { opacity: 0.92; }
          80%  { opacity: 0.35; }
          100% { opacity: 0;    transform: translateY(-72px) scale(1.08); }
        }
        .fz1 { animation: floatZ 3.2s ease-out infinite 0s; }
        .fz2 { animation: floatZ 3.2s ease-out infinite 1.05s; }
        .fz3 { animation: floatZ 3.2s ease-out infinite 2.1s; }
      `}</style>

      {/* ── Carte modal ── */}
      <div style={{
        width: '100%', maxWidth: 440,
        borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 28px 90px rgba(0,0,0,0.50)',
        display: 'flex', flexDirection: 'column',
        height: 'min(580px, calc(100dvh - 32px))',
      }}>

        {/* Zone image */}
        <div style={{ position: 'relative', flex: '1 1 0', minHeight: 0, overflow: 'hidden' }}>
          <img
            src="/jardinier-repos.png"
            alt=""
            style={{
              width: '100%', height: '100%', display: 'block',
              objectFit: 'cover', objectPosition: 'center 15%',
            }}
          />
          {/* Z animés au-dessus de la tête */}
          <span className="fz1" style={{
            position: 'absolute', left: '54%', top: '24%',
            fontFamily: 'Georgia,serif', fontSize: 22, fontStyle: 'italic', fontWeight: 'bold',
            color: '#3a5080', pointerEvents: 'none',
          }}>z</span>
          <span className="fz2" style={{
            position: 'absolute', left: '60%', top: '16%',
            fontFamily: 'Georgia,serif', fontSize: 29, fontStyle: 'italic', fontWeight: 'bold',
            color: '#3a5080', pointerEvents: 'none',
          }}>z</span>
          <span className="fz3" style={{
            position: 'absolute', left: '66%', top: '7%',
            fontFamily: 'Georgia,serif', fontSize: 38, fontStyle: 'italic', fontWeight: 'bold',
            color: '#3a5080', pointerEvents: 'none',
          }}>Z</span>
          {/* Fondu bas */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 72,
            background: 'linear-gradient(to bottom, transparent, #faf8f2)',
            pointerEvents: 'none',
          }}/>
        </div>

        {/* Zone texte + bouton */}
        <div style={{
          background: '#faf8f2',
          padding: '18px 28px 30px',
          textAlign: 'center', flexShrink: 0,
        }}>
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(20px, 4.5vw, 25px)',
            fontWeight: 600, fontStyle: 'italic',
            color: '#2a4a18', margin: '0 0 8px', lineHeight: 1.35,
          }}>
            Le jardinier aussi<br/>a besoin de repos.
          </p>
          <p style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 13.5, color: '#5a6840',
            margin: '0 0 22px', lineHeight: 1.65, letterSpacing: '0.02em',
          }}>
            Votre jardin intérieur a été semé.<br/>Laissez-le grandir en silence.
          </p>
          <button
            onClick={() => { setWeekOneClosed(false); setShowWeekOne(true) }}
            style={{
              width: '100%',
              fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 500,
              color: '#fff',
              background: 'linear-gradient(135deg, #5a9a2e, #3a7a1a)',
              border: 'none', borderRadius: 100,
              padding: '14px 28px', cursor: 'pointer',
              letterSpacing: '0.06em',
              boxShadow: '0 6px 22px rgba(60,100,20,0.35)',
            }}
          >
            Revenir sur mon jardin intérieur
          </button>
        </div>
      </div>
    </div>
  )

  // 3c. Fin du WeekOneFlow — écran de choix de plan
  if (showEndOfWeek) return (
    <EndOfWeekScreen
      userId={user?.id}
      onContinue={(choice) => {
        setShowEndOfWeek(false)
        setComingFromOnboarding(false)
        if (choice === 'premium') setOnboarded(false) // → AccessPage
        // 'free' → dashboard
      }}
    />
  )

  // 4. Dashboard normal + notifications jardin
  return (
    <>
      {!showWeekOne && <DashboardPage />}

      {/* ── WeekOneFlow — 7 premiers jours ── */}
      {showWeekOne && (daysSinceReg < 7 || comingFromOnboarding) && (
        <WeekOneFlow
          userId={user.id}
          onComplete={() => { setWeekOneClosed(true); setShowWeekOne(false) }}
          onAllDone={() => { setShowWeekOne(false); setShowEndOfWeek(true) }}
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
