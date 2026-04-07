import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../core/supabaseClient'

const FLOWER_NAMES = [
  'Aubépine','Cèdre','Pivoine','Iris','Verveine','Jasmin','Glycine',
  'Lilas','Noisetier','Pervenche','Sauge','Lavande','Magnolia','Acacia',
  'Clématite','Bruyère','Capucine','Gentiane','Muguet','Orchidée','Tilleul',
  'Violette','Camélia','Renoncule','Mimosa','Angélique','Bouleau','Eglantine',
  'Chèvrefeuille','Coquelicot',
]

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;width:100%}

@keyframes authFadeIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes authSlideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
@keyframes authImgOut { from{opacity:1} to{opacity:0;transform:scale(1.04)} }
@keyframes authFormIn { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }

.auth-wrap {
  position:fixed; inset:0; font-family:'Jost',sans-serif; overflow:hidden;
}
.auth-bg {
  position:absolute; inset:0;
  background:#c8dfa0;
}
.auth-bg img {
  width:100%; height:100%; object-fit:cover; object-position:center top; opacity:1;
}

/* ── Layout 2 colonnes ── */
.auth-layout {
  position:relative; z-index:1;
  width:100%; height:100%;
  display:flex; align-items:center; justify-content:center;
  gap:48px; padding:40px;
}

/* Colonne gauche — contenu */
.auth-left-col {
  flex:0 0 auto;
  width:min(400px,44%);
  height:100%;
  display:flex; flex-direction:column;
  justify-content:flex-start; gap:28px;
  padding:20px 0 32px;
  animation:authFadeIn .7s cubic-bezier(.22,1,.36,1) both;
}

/* Colonne droite — cadre */
.auth-right-col {
  flex:0 0 auto;
  display:flex; align-items:center; justify-content:center;
}
.auth-frame {
  width:420px; height:600px;
  border-radius:28px;
  overflow:hidden;
  position:relative;
  box-shadow:none; border:none;
  mask-image:radial-gradient(ellipse 90% 90% at 50% 50%, black 60%, transparent 100%);
  -webkit-mask-image:radial-gradient(ellipse 90% 90% at 50% 50%, black 60%, transparent 100%);
}
.auth-frame-img {
  position:absolute; inset:0;
  width:100%; height:100%;
  object-fit:cover; object-position:center 20%;
  animation:authFadeIn .5s ease both;
}
.auth-frame-form {
  position:absolute; inset:0;
  overflow-y:auto;
  padding:36px 32px;
  background:rgba(252,248,242,.97);
  animation:authFormIn .4s cubic-bezier(.22,1,.36,1) both;
}

/* ── Textes colonne gauche ── */
.auth-logo-block {
  display:flex; flex-direction:column; align-items:center;
  gap:5px; margin-bottom:16px; text-align:center;
}
.auth-logo-circle {
  width:90px; height:90px; border-radius:50%;
  border:1.5px solid rgba(26,58,18,.28);
  background:rgba(255,255,255,.88);
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 16px rgba(60,100,20,.14);
}
.auth-logo-name { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:600; color:#0f2a08; }
.auth-logo-sub  { font-family:'Cormorant Garamond',serif; font-size:19px; font-style:italic; color:#2e7010; }

.auth-title {
  font-family:'Cormorant Garamond',serif;
  font-size:clamp(32px,3.5vw,50px); font-weight:600;
  line-height:1.18; color:#0f2a08; margin-bottom:10px; text-align:center;
}
.auth-title em { font-style:italic; color:#2e7010; }
.auth-sep { width:38px; height:2px; background:linear-gradient(to right,transparent,#4a8820,transparent); margin:0 auto 14px; }
.auth-subtitle {
  font-family:'Cormorant Garamond',serif;
  font-size:clamp(15px,1.6vw,19px); font-weight:400;
  line-height:1.65; color:rgba(15,42,8,.88); text-align:center; margin-bottom:0;
}



/* Boutons */
.auth-btn-primary {
  width:100%; padding:12px 20px; border-radius:50px; border:none;
  background:linear-gradient(135deg,#4a8a20,#2e6808);
  color:#fff; font-size:15px; font-weight:600; letter-spacing:.02em;
  font-family:'Jost',sans-serif; cursor:pointer;
  box-shadow:0 5px 18px rgba(42,104,8,.28);
  transition:filter .2s; margin-bottom:8px;
}
.auth-btn-primary:hover { filter:brightness(1.08); }
.auth-btn-ghost {
  width:100%; padding:11px 20px; border-radius:50px;
  border:1.5px solid rgba(15,42,8,.22); background:rgba(255,255,255,.65);
  color:rgba(15,42,8,.85); font-size:14px; font-weight:400;
  font-family:'Jost',sans-serif; cursor:pointer;
  transition:background .2s; margin-bottom:14px;
}
.auth-btn-ghost:hover { background:rgba(255,255,255,.90); }
.auth-tagline { text-align:center; font-size:12px; color:rgba(15,42,8,.45); letter-spacing:.06em; }

/* ── Formulaires dans le cadre ── */
.auth-back-btn {
  position:absolute; top:14px; left:14px;
  width:32px; height:32px; border-radius:50%; border:none; padding:0;
  background:rgba(0,0,0,.07); color:rgba(30,20,8,.50);
  font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:background .2s;
}
.auth-back-btn:hover { background:rgba(0,0,0,.14); }
.auth-form-title { font-family:'Cormorant Garamond',serif; font-size:26px; font-weight:400; color:#1a1208; margin-bottom:6px; }
.auth-form-sub   { font-size:13.5px; color:rgba(30,20,8,.50); margin-bottom:24px; line-height:1.6; }
.auth-field { margin-bottom:16px; }
.auth-label { font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:rgba(30,20,8,.42); margin-bottom:6px; display:block; }
.auth-input {
  width:100%; padding:12px 15px;
  background:rgba(255,255,255,.75); border:1.5px solid rgba(200,160,150,.28);
  border-radius:12px; font-size:14.5px; font-family:'Jost',sans-serif;
  color:#1a1208; outline:none; transition:border-color .2s;
}
.auth-input:focus { border-color:rgba(90,154,40,.50); background:rgba(255,255,255,.98); }
.auth-input::placeholder { color:rgba(30,20,8,.28); }
.auth-hint   { font-size:11px; color:rgba(30,20,8,.38); margin-top:4px; }
.auth-error  { font-size:12px; color:rgba(180,60,60,.90); padding:10px 14px; background:rgba(180,60,60,.07); border:1px solid rgba(180,60,60,.18); border-radius:10px; margin-bottom:12px; }
.auth-submit {
  width:100%; padding:14px; border-radius:50px; border:none;
  background:linear-gradient(135deg,#4a8a20,#2e6808);
  color:#fff; font-size:15px; font-weight:600; letter-spacing:.03em;
  font-family:'Jost',sans-serif; cursor:pointer;
  box-shadow:0 5px 18px rgba(42,104,8,.28); transition:filter .2s; margin-top:6px;
}
.auth-submit:hover { filter:brightness(1.08); }
.auth-submit:disabled { opacity:.4; cursor:not-allowed; filter:none; }
.auth-forgot { font-size:12px; color:rgba(30,20,8,.38); text-align:right; margin-top:5px; cursor:pointer; text-decoration:underline; }
.auth-switch { margin-top:18px; font-size:13px; color:rgba(30,20,8,.45); text-align:center; }
.auth-switch span { color:#4a8a20; cursor:pointer; font-weight:500; text-decoration:underline; }
.auth-footer { margin-top:14px; font-size:11px; color:rgba(30,20,8,.30); text-align:center; line-height:1.7; }

/* Fleur picker */
.auth-flower-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; max-height:200px; overflow-y:auto; margin-bottom:18px; }
.auth-flower-pill { padding:8px 4px; border-radius:20px; font-size:12px; text-align:center; border:1.5px solid rgba(200,160,150,.20); cursor:pointer; color:rgba(30,20,8,.55); transition:all .15s; background:rgba(255,255,255,.55); }
.auth-flower-pill:hover { border-color:rgba(90,154,40,.40); color:rgba(30,20,8,.85); }
.auth-flower-pill.sel { border-color:rgba(90,154,40,.55); background:rgba(90,154,40,.10); color:#2e6808; font-weight:500; }
.auth-flower-preview { text-align:center; padding:10px 0 12px; font-family:'Cormorant Garamond',serif; font-size:18px; color:rgba(30,20,8,.50); min-height:42px; }
.auth-flower-preview span { color:#1a1208; }

.auth-success { text-align:center; padding:20px 0; }
.auth-success-icon { font-size:48px; margin-bottom:16px; }
.auth-success-title { font-family:'Cormorant Garamond',serif; font-size:24px; color:#7a5a08; margin-bottom:10px; }
.auth-success-text { font-size:14px; font-weight:300; color:rgba(30,20,8,.60); line-height:1.75; }

/* Mobile */
@media(max-width:767px) {
  .auth-right-col { display:none; }
  .auth-layout { flex-direction:column; }
  .auth-left-col {
    width:100%; padding:20px 24px 32px;
    align-items:center; text-align:center;
    justify-content:flex-start; gap:20px;
  }
  .auth-logo-circle { width:72px; height:72px; }
  .auth-logo-circle img { width:52px; height:52px; }
  .auth-logo-name { font-size:19px; }
  .auth-title { font-size:clamp(38px,10vw,54px); }
  .auth-subtitle-wrap { display:none; }
  .auth-sep { display:none; }
  .auth-btn-primary { font-size:14px; padding:11px 20px; }
  .auth-btn-ghost { font-size:13px; padding:9px 20px; }
  .auth-tagline { font-size:13px; }
}
`

export function AuthPage({ initialView = 'login', resetError, onPasswordUpdated }) {
  const { signIn } = useAuth()

  // 'welcome' | 'login' | 'register' | 'flower' | 'reset' | 'newpassword'
  const [rightPanel, setRightPanel] = useState(
    initialView !== 'login' ? initialView : 'image'
  )
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [displayName,  setDisplayName]  = useState('')
  const [birthdate,    setBirthdate]    = useState('')
  const [newPassword,  setNewPassword]  = useState('')
  const [isLoading,    setIsLoading]    = useState(false)
  const [error,        setError]        = useState(resetError ?? null)
  const [resetSent,    setResetSent]    = useState(false)
  const [success,      setSuccess]      = useState(false)
  const [selFlower,    setSelFlower]    = useState(null)
  const [savingFlower, setSavingFlower] = useState(false)
  const [newUserId,    setNewUserId]    = useState(null)
  const [isMobile,     setIsMobile]     = useState(() => window.innerWidth < 768)

  const hasLoggedInBefore = !!localStorage.getItem('mji_has_logged_in')

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRightPanel('newpassword')
    })
    return () => subscription.unsubscribe()
  }, [])

  const goTo = (panel) => { setRightPanel(panel); setError(null); setResetSent(false) }

  async function handleSignIn(e) {
    e.preventDefault()
    setError(null); setIsLoading(true)
    try {
      await signIn(email, password)
      localStorage.setItem('mji_has_logged_in', '1')
    } catch (err) { setError(err.message) }
    finally { setIsLoading(false) }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    if (!displayName.trim()) { setError('Veuillez choisir un prénom ou pseudo.'); return }
    if (!birthdate) { setError('Veuillez indiquer votre date de naissance.'); return }
    const age = Math.floor((Date.now() - new Date(birthdate)) / 31557600000)
    if (age < 16) { setError('Vous devez avoir au moins 16 ans.'); return }
    setError(null); setIsLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { display_name: displayName.trim(), birthdate } }
      })
      if (signUpError) throw new Error(signUpError.message)
      if (data?.user && data.session) {
        await supabase.from('users').upsert({
          id: data.user.id, email: data.user.email,
          display_name: displayName.trim(), birthdate,
        }, { onConflict: 'id' })
        setNewUserId(data.user.id)
        goTo('flower')
      } else { setSuccess(true) }
    } catch (err) { setError(err.message) }
    finally { setIsLoading(false) }
  }

  async function handleConfirmFlower() {
    if (!selFlower || savingFlower) return
    setSavingFlower(true)
    try {
      const uid = newUserId ?? (await supabase.auth.getUser()).data?.user?.id
      if (uid) await supabase.from('users').update({ flower_name: selFlower }).eq('id', uid)
    } catch(e) { console.warn('[AuthPage] flower', e) }
    setSavingFlower(false)
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    if (!email.trim()) { setError('Veuillez saisir votre email.'); return }
    setError(null); setIsLoading(true)
    try {
      const { error: re } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/?reset=true' })
      if (re) throw new Error(re.message)
      setResetSent(true)
    } catch (err) { setError(err.message) }
    finally { setIsLoading(false) }
  }

  async function handleSetNewPassword(e) {
    e.preventDefault()
    if (newPassword.length < 8) { setError('8 caractères minimum.'); return }
    if (!/[A-Z]/.test(newPassword)) { setError('Au moins une majuscule.'); return }
    if (!/[a-z]/.test(newPassword)) { setError('Au moins une minuscule.'); return }
    setError(null); setIsLoading(true)
    try {
      const { error: ue } = await supabase.auth.updateUser({ password: newPassword })
      if (ue) throw new Error(ue.message)
      if (onPasswordUpdated) onPasswordUpdated()
      else { goTo('login'); setNewPassword('') }
    } catch (err) { setError(err.message) }
    finally { setIsLoading(false) }
  }

  // Sur mobile, les formulaires s'affichent en plein écran à la place de la colonne gauche
  const mobileForm = isMobile && rightPanel !== 'image'

  return (
    <div className="auth-wrap">
      <style>{css}</style>
      <div className="auth-bg">
        <img src="/fond1.png" alt=""/>
      </div>
      <div style={{ position:'absolute', inset:0, background:'rgba(240,236,220,.35)', zIndex:0 }}/>

      {/* Logo mobile — absolu en haut de l'écran */}
      {isMobile && (
        <div style={{ position:'absolute', top:60, left:0, right:0, zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <div className="auth-logo-circle" style={{ width:80, height:80 }}>
            <img src="/icons/icon-192.png" alt="" style={{ width:62, height:62, borderRadius:'50%' }}/>
          </div>
          <div className="auth-logo-name" style={{ fontSize:20 }}>Mon <em style={{ fontStyle:'normal', color:'#2e7010' }}>Jardin</em> Intérieur</div>
        </div>
      )}

      <div className="auth-layout">
        <div style={{ display:'flex', alignItems:'center', gap:48, background: isMobile ? 'transparent' : 'rgba(252,250,244,.78)', backdropFilter: isMobile ? 'none' : 'blur(16px)', borderRadius: isMobile ? 0 : 28, border: isMobile ? 'none' : '1.5px solid rgba(180,210,140,.35)', padding: isMobile ? '40px 22px 28px' : '40px 40px', boxShadow: isMobile ? 'none' : '0 8px 40px rgba(60,100,20,.10)' }}>

        {/* ── COLONNE GAUCHE — contenu de présentation ── */}
        {(!mobileForm) && (
          <div className="auth-left-col">
            {/* Logo — visible sur PC dans la colonne, caché sur mobile */}
            {!isMobile && (
              <div className="auth-logo-block">
                <div className="auth-logo-circle">
                  <img src="/icons/icon-192.png" alt="" style={{ width:68, height:68, borderRadius:'50%' }}/>
                </div>
                <div className="auth-logo-name">Mon <em style={{ fontStyle:'normal', color:'#2e7010' }}>Jardin</em> Intérieur</div>
              </div>
            )}

            {/* Titre */}
            <div>
              <h1 className="auth-title">
                Aujourd&rsquo;hui&hellip;<br/>comment va votre<br/><em>jardin intérieur</em> ?
              </h1>
              <div className="auth-subtitle-wrap">
                <div className="auth-sep"/>
                <p className="auth-subtitle">
                  Un espace doux pour comprendre,<br/>apaiser et faire évoluer ce que vous ressentez.
                </p>
              </div>
            </div>

            {/* Boutons — poussés en bas sur PC */}
            <div style={{ marginTop:'auto' }}>
              <button className="auth-btn-primary" onClick={() => goTo('register')}>
                Commencer mon jardin →
              </button>
              <button className="auth-btn-ghost" onClick={() => goTo('login')}>
                Retrouver mon jardin
              </button>
              <div className="auth-tagline">Chaque geste de soin est une graine. — 🌿</div>
            </div>
          </div>
        )}

        {/* ── COLONNE DROITE — cadre image / formulaire ── */}
        <div className={isMobile && !mobileForm ? '' : 'auth-right-col'} style={mobileForm ? { position:'fixed', inset:0, zIndex:10, display:'flex', alignItems:'center', justifyContent:'center', padding:20 } : {}}>
          <div className="auth-frame" style={mobileForm ? { maxWidth:440, maxHeight:'90vh', width:'100%' } : {}}>

            {/* Image par défaut */}
            {rightPanel === 'image' && (
              <img key="img" src="/fond1.png" alt="" className="auth-frame-img"/>
            )}

            {/* ── FORMULAIRE CONNEXION ── */}
            {rightPanel === 'login' && (
              <div className="auth-frame-form">
                <button className="auth-back-btn" onClick={() => goTo('image')}>←</button>
                <div className="auth-form-title">{hasLoggedInBefore ? 'Bon retour 🌿' : 'Bienvenue 🌱'}</div>
                <div className="auth-form-sub">Votre jardin vous attend</div>
                <form onSubmit={handleSignIn}>
                  <div className="auth-field">
                    <label className="auth-label">Email</label>
                    <input className="auth-input" type="email" placeholder="votre@email.com" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus/>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Mot de passe</label>
                    <input className="auth-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required/>
                    <div className="auth-forgot" onClick={() => goTo('reset')}>Mot de passe oublié ?</div>
                  </div>
                  {error && <div className="auth-error">{error}</div>}
                  <button className="auth-submit" type="submit" disabled={isLoading}>{isLoading ? '…' : 'Entrer dans mon jardin'}</button>
                </form>
                <div className="auth-switch">Pas encore de compte ? <span onClick={() => goTo('register')}>Créer mon jardin</span></div>
                <div className="auth-footer">Votre jardin est privé par défaut.</div>
              </div>
            )}

            {/* ── FORMULAIRE INSCRIPTION ── */}
            {rightPanel === 'register' && !success && (
              <div className="auth-frame-form">
                <button className="auth-back-btn" onClick={() => goTo('image')}>←</button>
                <div className="auth-form-title">Planter une graine 🌱</div>
                <div className="auth-form-sub">Créez votre espace de bien-être</div>
                <form onSubmit={handleSignUp}>
                  <div className="auth-field">
                    <label className="auth-label">Prénom ou pseudo</label>
                    <input className="auth-input" type="text" placeholder="Comment souhaitez-vous être appelé·e ?" value={displayName} onChange={e=>setDisplayName(e.target.value)} required maxLength={40} autoFocus/>
                    <div className="auth-hint">Visible dans le club · modifiable plus tard</div>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Date de naissance</label>
                    <input className="auth-input" type="date" value={birthdate} onChange={e=>setBirthdate(e.target.value)} max={new Date(Date.now()-16*31557600000).toISOString().split('T')[0]} required/>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Email</label>
                    <input className="auth-input" type="email" placeholder="votre@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Mot de passe</label>
                    <input className="auth-input" type="password" placeholder="8 caractères min." value={password} onChange={e=>setPassword(e.target.value)} required minLength={8}/>
                  </div>
                  {error && <div className="auth-error">{error}</div>}
                  <button className="auth-submit" type="submit" disabled={isLoading}>{isLoading ? '…' : 'Créer mon jardin'}</button>
                </form>
                <div className="auth-switch">Déjà un compte ? <span onClick={() => goTo('login')}>Me connecter</span></div>
              </div>
            )}

            {/* Confirmation email */}
            {rightPanel === 'register' && success && (
              <div className="auth-frame-form">
                <div className="auth-success">
                  <div className="auth-success-icon">✉️</div>
                  <div className="auth-success-title">Vérifiez votre email</div>
                  <div className="auth-success-text">Un lien de confirmation a été envoyé à<br/><strong style={{color:'#1a1208'}}>{email}</strong></div>
                </div>
              </div>
            )}

            {/* ── CHOIX DE LA FLEUR ── */}
            {rightPanel === 'flower' && (
              <div className="auth-frame-form">
                <div className="auth-form-title">Votre identité florale 🌸</div>
                <div className="auth-form-sub">{displayName} · <em style={{fontStyle:'italic',color:'rgba(30,20,8,.55)'}}>{selFlower ?? '…'}</em></div>
                <div className="auth-flower-preview">
                  {selFlower ? <><span>🌸</span> {displayName} · <span>{selFlower}</span></> : 'Choisissez votre fleur ci-dessous'}
                </div>
                <div className="auth-flower-grid">
                  {FLOWER_NAMES.map(n => (
                    <div key={n} className={'auth-flower-pill' + (selFlower===n?' sel':'')} onClick={() => setSelFlower(n)}>{n}</div>
                  ))}
                </div>
                {error && <div className="auth-error">{error}</div>}
                <button className="auth-submit" onClick={handleConfirmFlower} disabled={!selFlower||savingFlower}>
                  {savingFlower ? '…' : selFlower ? `Entrer dans mon jardin · ${selFlower} →` : 'Choisissez une fleur'}
                </button>
                <div className="auth-footer">Modifiable dans vos paramètres.</div>
              </div>
            )}

            {/* ── RESET MOT DE PASSE ── */}
            {rightPanel === 'reset' && (
              <div className="auth-frame-form">
                <button className="auth-back-btn" onClick={() => goTo('login')}>←</button>
                <div className="auth-form-title">Réinitialiser 🔑</div>
                <div className="auth-form-sub">Recevez un lien par email</div>
                {resetSent ? (
                  <div className="auth-success">
                    <div className="auth-success-icon">📬</div>
                    <div className="auth-success-title">Email envoyé !</div>
                    <div className="auth-success-text">Vérifiez vos spams si besoin.</div>
                    <div className="auth-forgot" style={{textAlign:'center',marginTop:16}} onClick={() => goTo('login')}>← Retour à la connexion</div>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword}>
                    <div className="auth-field">
                      <label className="auth-label">Email</label>
                      <input className="auth-input" type="email" placeholder="votre@email.com" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus/>
                    </div>
                    {error && <div className="auth-error">{error}</div>}
                    <button className="auth-submit" type="submit" disabled={isLoading}>{isLoading ? '…' : 'Envoyer le lien'}</button>
                  </form>
                )}
              </div>
            )}

            {/* ── NOUVEAU MOT DE PASSE ── */}
            {rightPanel === 'newpassword' && (
              <div className="auth-frame-form">
                <div className="auth-form-title">Nouveau mot de passe 🔑</div>
                <div className="auth-form-sub">Choisissez un mot de passe sécurisé</div>
                <form onSubmit={handleSetNewPassword}>
                  <div className="auth-field">
                    <label className="auth-label">Nouveau mot de passe</label>
                    <input className="auth-input" type="password" placeholder="8 caractères minimum" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required autoFocus minLength={8}/>
                    <div className="auth-hint">
                      8 caractères min · 1 majuscule · 1 minuscule
                      {newPassword.length > 0 && (
                        <span style={{marginLeft:6, color:/[A-Z]/.test(newPassword)&&/[a-z]/.test(newPassword)&&newPassword.length>=8?'#4a8a20':'#c04a4a'}}>
                          {/[A-Z]/.test(newPassword)&&/[a-z]/.test(newPassword)&&newPassword.length>=8?' ✓ Valide':''}
                        </span>
                      )}
                    </div>
                  </div>
                  {error && <div className="auth-error">{error}</div>}
                  <button className="auth-submit" type="submit" disabled={isLoading||!(newPassword.length>=8&&/[A-Z]/.test(newPassword)&&/[a-z]/.test(newPassword))}>
                    {isLoading ? '…' : '✓ Mettre à jour'}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
