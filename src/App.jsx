import { useAuthInit, useAuth } from './hooks/useAuth'
import { AuthPage }             from './pages/AuthPage'
import  DashboardPage        from './pages/DashboardPage'

export default function App() {
  useAuthInit()
  const { session, isLoading } = useAuth()

  if (isLoading) return <div style={{ padding: 40 }}>Chargement...</div>
  return session ? <DashboardPage /> : <AuthPage />
}