import { useState, useEffect, useRef } from 'react'
import { useAuthInit, useAuth } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import AccessModal from './components/AccessModal'
import { useSubscription } from './hooks/useSubscription'

export default function App() {
  // ── Auth init (une seule fois) ───────────────────────────
  useAuthInit()
  const { user, isLoading: authLoading } = useAuth()

  // ── Abonnements ──────────────────────────────────────────
  const {
    isFirstConnection,
    activateFree,
    saveSubscriptions,
    refresh
  } = useSubscription()

  const [modalOpen, setModalOpen]       = useState(false)
  const [renewProduct, setRenewProduct] = useState(null)
  const [toast, setToast]               = useState(null)
  const toastTimer                      = useRef(null)

  // ── Ouvrir automatiquement à la 1ère connexion ──────────
  useEffect(() => {
    if (isFirstConnection) setModalOpen(true)
  }, [isFirstConnection])

  // ── Exposer openAccessModal globalement ─────────────────
  // Permet d'appeler window.openAccessModal('cercle') depuis n'importe où
  useEffect(() => {
    window.openAccessModal = (productId = null) => {
      setRenewProduct(productId)
      setModalOpen(true)
    }
    return () => { delete window.openAccessModal }
  }, [])

  // ── Callback après paiement / activation ────────────────
  const handleSuccess = async (items) => {
    if (items === null) {
      await activateFree()
      showToast('🌱', 'Accès Ma Fleur activé !')
    } else {
      // En production : déclenché par webhook Stripe
      const ok = await saveSubscriptions(items)
      if (ok) showToast('✨', `${items.length} accès activé${items.length > 1 ? 's' : ''} !`)
    }
    setRenewProduct(null)
    await refresh()
  }

  // ── Renouvellement (appelé depuis DashboardPage) ─────────
  const handleRenew = (productId) => {
    setRenewProduct(productId)
    setModalOpen(true)
  }

  // ── Toast ────────────────────────────────────────────────
  const showToast = (icon, msg) => {
    clearTimeout(toastTimer.current)
    setToast({ icon, msg })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  // ── Loading auth ─────────────────────────────────────────
  if (authLoading) return (
    <div style={styles.loading}>
      <span style={styles.loadingDot}>🌱</span>
    </div>
  )

  return (
    <>
      {/* ── PAGE PRINCIPALE ── */}
      {user ? <DashboardPage /> : <AuthPage />}

      {/* ── MODAL ABONNEMENT — par-dessus tout ── */}
      <AccessModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setRenewProduct(null) }}
        onSuccess={handleSuccess}
        preOpenProduct={renewProduct}
      />

      {/* ── TOAST ── */}
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
      `}</style>
    </>
  )
}

const styles = {
  loading: {
    minHeight: '100vh',
    background: '#080f07',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    fontSize: 32,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  toast: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#132010',
    border: '1px solid rgba(168,224,64,0.25)',
    borderRadius: 30,
    padding: '12px 22px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13.5,
    color: '#e2ddd3',
    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    zIndex: 9998,
    whiteSpace: 'nowrap',
    animation: 'toastIn .4s cubic-bezier(0.34,1.56,0.64,1) both',
  }
}
