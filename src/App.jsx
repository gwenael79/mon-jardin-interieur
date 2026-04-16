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
import InstallPrompt from './components/InstallPrompt'

import { useGardenNotification, getPlantStateIndex, PLANT_STATES } from './hooks/useGardenNotification'
import { useLastVisit }          from './hooks/useLastVisit'
import GardenNotificationBanner  from './components/GardenNotificationBanner'
import PlantIcon                 from './components/PlantIcon'

const ADMIN_IDS = ['aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7']

export default function App() {
  useAuthInit()
  const { user, isLoading: authLoading } = useAuth()
  const { activateFree, refresh } = useSubscription()

  const [screen,        setScreen]        = useState('loading')
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

    // Retour depuis Stripe — annulation → rouvrir le modal premium
    if (params.get('premium') === 'cancel') {
      window.history.replaceState({}, '', window.location.pathname)
      setScreen('dashboard')
      // On ouvre le PremiumModal via un state qu'on pose après le chargement
      sessionStorage.setItem('reopen_premium', '1')
      return
    }

    setScreen('loading')
    ;(async () => {
      const { data: userData } = await supabase
        .from('users').select('onboarded, onboarding_completed').eq('id', user.id).maybeSingle()

      const isOnboarded = userData?.onboarded === true

      if (isOnboarded && sessionStorage.getItem('pendingOnboarding') === 'true') {
        sessionStorage.removeItem('pendingOnboarding')
        setScreen('onboarding'); return
      }

      if (!isOnboarded) {
        setScreen('activating')
        try {
          await activateFree()
          await supabase.from('users').update({ onboarded: true }).eq('id', user.id)
          await refresh()
        } catch (e) { console.warn('[auto-activate]', e) }
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
    setScreen('onboarding')
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

  if (screen === 'onboarding') {
    return <OnboardingScreen userId={user.id} onComplete={async () => {
      // Marquer l'onboarding comme terminé en base
      await supabase.from('users').update({ onboarding_completed: true }).eq('id', user.id)
      setScreen('weekone')
    }} />
  }

  if (screen === 'weekone') {
    return (
      <WeekOneFlow
        userId={user.id}
        onComplete={() => setScreen('weekone_rest')}
        onAllDone={() => setScreen('endofweek')}
      />
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
