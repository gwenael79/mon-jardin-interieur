import { useState, useEffect, useRef } from 'react'
import { useAuthInit, useAuth } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import AccessPage from './pages/AccessPage'
import { useSubscription } from './hooks/useSubscription'
import { AdminPage } from './pages/AdminPage'
import { query, supabase } from './core/supabaseClient'

const ADMIN_IDS = ['aca666ad-c7f9-4a33-81bd-8ea2bd89b0e7']

export default function App() {
  // ── Auth init (une seule fois) ───────────────────────────
  useAuthInit()
  const { user, isLoading: authLoading } = useAuth()

  // ── Abonnements ──────────────────────────────────────────
  const {
    activateFree,
    saveSubscriptions,
    refresh
  } = useSubscription()

  // ── État onboarding ──────────────────────────────────────
  // null = on ne sait pas encore / false = pas encore onboardé / true = déjà fait
  const [onboarded,   setOnboarded]   = useState(null)
  const [checkingOnboard, setCheckingOnboard] = useState(false)

  const [toast,       setToast]       = useState(null)
  const [hash,        setHash]        = useState(window.location.hash)
  const toastTimer                    = useRef(null)

  // ── Vérifier le profil dès que l'user est connu ──────────
  useEffect(() => {
    if (!user) { setOnboarded(null); return }
    setCheckingOnboard(true)
    supabase
      .from('users')
      .select('onboarded')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setOnboarded(data?.onboarded === true)
        setCheckingOnboard(false)
      })
  }, [user?.id])

  // ── Écouter les changements de hash ─────────────────────
  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // ── Exposer openAccessModal globalement ─────────────────
  // Appelé depuis le bouton "Abonnement" de la sidebar
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
    showToast('🌱', 'Bienvenue dans votre jardin !')
    await refresh()
    setOnboarded(true)   // → passe au Dashboard
  }

  const handlePaySuccess = async ({ plan }) => {
    // En prod : déclenché par webhook Stripe
    // Ici on marque juste onboarded pour passer au dashboard
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
  if (authLoading || checkingOnboard) return (
    <div style={styles.loading}>
      <span>🌱</span>
    </div>
  )

  // ── Routing ──────────────────────────────────────────────
  // 1. Non connecté → AuthPage
  if (!user) return <AuthPage />

  // 2. Connecté mais pas encore onboardé → AccessPage (1ère connexion ou via sidebar)
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

  // 3. Admin → AdminPage
  if (ADMIN_IDS.includes(user?.id) && hash === '#admin') return <AdminPage />

  // 4. Onboardé → Dashboard normal
  return (
    <>
      <DashboardPage />
      {toast && <div style={styles.toast}><span>{toast.icon}</span><span>{toast.msg}</span></div>}
      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateX(-50%) translateY(16px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
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
  }
}
