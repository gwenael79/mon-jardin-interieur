import { useEffect } from 'react'
import { useAuthStore } from '../store/auth.store'
import { supabase } from '../core/supabaseClient' // votre chemin existant

// ─── INIT (appelé une seule fois dans App.jsx) ────────────
export function useAuthInit() {
  const { setSession, setLoading, reset } = useAuthStore()

  useEffect(() => {
    // Récupère la session existante au démarrage
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Écoute les changements en temps réel
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) reset()
    })

    return () => listener.subscription.unsubscribe()
  }, []) // eslint-disable-line
}

// ─── HOOK CONSOMMABLE DANS LES COMPOSANTS ────────────────
export function useAuth() {
  const session  = useAuthStore(s => s.session)
  const isLoading = useAuthStore(s => s.isLoading)

  const user = session?.user ?? null

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  return { session, user, isLoading, signIn, signUp, signOut }
}