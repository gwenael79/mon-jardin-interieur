import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]       = useState(null)
  const [view, setView]         = useState('login') // 'login' | 'register'
  const [success, setSuccess]   = useState(false)

  async function handleSignIn(e) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await signUp(email, password)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Vérifiez votre email ✉️</h2>
        <p>Un lien de confirmation a été envoyé à <strong>{email}</strong>.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>{view === 'login' ? 'Connexion 🌿' : 'Inscription 🌱'}</h2>

      <form onSubmit={view === 'login' ? handleSignIn : handleSignUp}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <br /><br />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <br /><br />

        {error && (
          <p style={{ color: 'red', marginBottom: 10 }}>{error}</p>
        )}

        <button type="submit" disabled={isLoading}>
          {isLoading ? '...' : view === 'login' ? 'Se connecter' : "S'inscrire"}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 13 }}>
        {view === 'login' ? "Pas encore de compte ? " : "Déjà un compte ? "}
        <button
          onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError(null) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {view === 'login' ? "S'inscrire" : 'Se connecter'}
        </button>
      </p>
    </div>
  )
}