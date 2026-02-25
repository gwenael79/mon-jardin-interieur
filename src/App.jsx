import { useEffect, useState } from 'react'
import supabase from './supabase'

function App() {

  const [session, setSession] = useState(null)
  const [plant, setPlant] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session) {
      loadOrCreatePlant()
    }
  }, [session])

  const loadOrCreatePlant = async () => {
    const userId = session.user.id
    const today = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('plants')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (!data) {
      const { data: newPlant } = await supabase
        .from('plants')
        .insert([{ user_id: userId, health: 50 }])
        .select()
        .single()

      setPlant(newPlant)
    } else {
      setPlant(data)
    }
  }

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) alert(error.message)
    else alert("Vérifiez votre email ✉️")
  }

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) alert(error.message)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Connexion 🌿</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <br /><br />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <br /><br />
        <button onClick={signUp}>S'inscrire</button>
        <button onClick={signIn} style={{ marginLeft: 10 }}>
          Se connecter
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Mon Jardin Intérieur 🌿</h1>
      <p>Bonjour {session.user.email}</p>

      {plant && (
        <div style={{
          marginTop: 20,
          padding: 20,
          border: "1px solid #ccc",
          borderRadius: 10
        }}>
          <h2>Plante du jour</h2>
          <p>Santé : {plant.health} / 100</p>
        </div>
      )}

      <br />
      <button onClick={signOut}>Se déconnecter</button>
    </div>
  )
}

export default App