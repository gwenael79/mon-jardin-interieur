import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;width:100%}
:root{
  --bg:#1a2e1a;--bg2:#213d21;--bg3:#274827;
  --border:rgba(255,255,255,0.18);--border2:rgba(255,255,255,0.10);
  --text:#f2ede0;--text2:rgba(242,237,224,0.88);--text3:rgba(242,237,224,0.60);
  --green:#96d485;--green2:rgba(150,212,133,0.25);--green3:rgba(150,212,133,0.12);--greenT:rgba(150,212,133,0.50);
  --gold:#e8d4a8;
}
.auth-root{font-family:'Jost',sans-serif;background:var(--bg);min-height:100vh;width:100vw;color:var(--text);display:flex;overflow:hidden}

/* LEFT — présentation */
.auth-left{flex:1;display:flex;flex-direction:column;justify-content:center;padding:60px 64px;position:relative;overflow:hidden}
.auth-left-bg{position:absolute;inset:0;background:radial-gradient(ellipse at 30% 50%,rgba(150,212,133,0.12),transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(122,173,110,0.04),transparent 50%);pointer-events:none}
.auth-logo{font-family:'Cormorant Garamond',serif;font-size:13px;font-weight:300;letter-spacing:.3em;text-transform:uppercase;color:var(--text3);margin-bottom:60px}
.auth-logo em{font-style:normal;color:var(--green)}
.auth-hero-title{font-family:'Cormorant Garamond',serif;font-size:56px;font-weight:300;line-height:1.15;color:var(--text);margin-bottom:24px}
.auth-hero-title em{font-style:italic;color:var(--green)}
.auth-hero-desc{font-size:14px;font-weight:300;color:var(--text2);line-height:1.8;max-width:420px;margin-bottom:48px}
.auth-features{display:flex;flex-direction:column;gap:16px}
.auth-feat{display:flex;align-items:flex-start;gap:14px}
.af-icon{font-size:18px;flex-shrink:0;margin-top:1px}
.af-text{font-size:14px;font-weight:300;color:var(--text2);line-height:1.6}
.af-text b{color:var(--text);font-weight:400;display:block;margin-bottom:2px}
.auth-tagline{margin-top:56px;font-size:11px;letter-spacing:.12em;color:var(--text3);font-style:italic}

/* Deco plants */
.deco-plant{position:absolute;opacity:.12;pointer-events:none}

/* RIGHT — formulaire */
.auth-right{width:440px;flex-shrink:0;background:rgba(20,45,20,0.95);border-left:1px solid var(--border);display:flex;flex-direction:column;justify-content:center;padding:60px 48px}
.auth-form-title{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:300;color:var(--gold);margin-bottom:6px}
.auth-form-sub{font-size:11px;color:var(--text3);letter-spacing:.06em;margin-bottom:36px}
.auth-tabs{display:flex;gap:0;margin-bottom:32px;border-bottom:1px solid var(--border2)}
.auth-tab{padding:8px 20px;font-size:11px;letter-spacing:.08em;color:var(--text3);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .2s}
.auth-tab.active{color:#c8f0b8;border-bottom-color:var(--green)}
.auth-field{margin-bottom:16px}
.auth-label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--text3);margin-bottom:6px;display:block}
.auth-input{width:100%;padding:11px 14px;background:rgba(255,255,255,.08);border:1px solid var(--border);border-radius:10px;font-size:12px;font-family:'Jost',sans-serif;color:var(--text);outline:none;transition:border-color .2s}
.auth-input:focus{border-color:var(--greenT);background:rgba(122,173,110,.04)}
.auth-input::placeholder{color:var(--text3)}
.auth-error{font-size:10px;color:rgba(210,110,110,.8);padding:8px 12px;background:rgba(210,110,110,.06);border:1px solid rgba(210,110,110,.15);border-radius:8px;margin-bottom:16px}
.auth-submit{width:100%;padding:13px;background:linear-gradient(135deg,rgba(122,173,110,.25),rgba(122,173,110,.15));border:1px solid var(--greenT);border-radius:10px;font-size:12px;font-family:'Jost',sans-serif;letter-spacing:.1em;color:#c8f0b8;cursor:pointer;transition:all .2s;margin-top:8px}
.auth-submit:hover{background:linear-gradient(135deg,rgba(122,173,110,.35),rgba(122,173,110,.22));border-color:var(--green)}
.auth-submit:disabled{opacity:.5;cursor:default}
.auth-divider{display:flex;align-items:center;gap:12px;margin:20px 0;font-size:9px;color:var(--text3);letter-spacing:.1em}
.auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:var(--border2)}
.auth-success{text-align:center;padding:20px 0}
.as-icon{font-size:40px;margin-bottom:16px}
.as-title{font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--gold);margin-bottom:10px}
.as-text{font-size:13px;font-weight:300;color:var(--text2);line-height:1.7}
.as-email{color:#c8f0b8}
.auth-footer{margin-top:32px;font-size:9px;color:var(--text3);text-align:center;line-height:1.8}
`

export function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]       = useState(null)
  const [view, setView]         = useState('login')
  const [success, setSuccess]   = useState(false)

  async function handleSignIn(e) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try { await signIn(email, password) }
    catch (err) { setError(err.message) }
    finally { setIsLoading(false) }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try { await signUp(email, password); setSuccess(true) }
    catch (err) { setError(err.message) }
    finally { setIsLoading(false) }
  }

  return (
    <div className="auth-root">
      <style>{css}</style>

      {/* ── GAUCHE : présentation ── */}
      <div className="auth-left">
        <div className="auth-left-bg" />

        {/* Plantes déco SVG */}
        <svg className="deco-plant" style={{right:40,bottom:60,width:180}} viewBox="0 0 180 220" fill="none">
          <path d="M90 210 Q85 180 88 160 Q80 140 60 120 Q80 125 88 145 Q87 120 75 95 Q88 112 90 135 Q92 112 105 95 Q93 120 92 145 Q100 125 120 120 Q100 140 92 160 Q95 180 90 210Z" fill="var(--green)" />
        </svg>
        <svg className="deco-plant" style={{left:20,top:80,width:80,opacity:.07}} viewBox="0 0 80 100" fill="none">
          <circle cx="40" cy="40" r="30" fill="var(--green)" />
          <rect x="37" y="40" width="6" height="50" fill="var(--green)" />
        </svg>

        <div className="auth-logo">Mon <em>Jardin</em> Intérieur</div>

        <div className="auth-hero-title">
          Cultivez votre<br />
          <em>bien-être intérieur</em><br />
          chaque jour
        </div>

        <div className="auth-hero-desc">
          Un espace doux pour prendre soin de vous — rituels quotidiens,
          cercles de confiance, et une plante qui grandit avec vous.
        </div>

        <div className="auth-features">
          <div className="auth-feat">
            <div className="af-icon">🌱</div>
            <div className="af-text">
              <b>Votre plante du jour</b>
              Chaque rituel accompli la fait grandir. Observez votre vitalité évoluer au fil des jours.
            </div>
          </div>
          <div className="auth-feat">
            <div className="af-icon">🌿</div>
            <div className="af-text">
              <b>Cercles de confiance</b>
              Partagez votre chemin avec des proches choisis, en préservant votre intimité.
            </div>
          </div>
          <div className="auth-feat">
            <div className="af-icon">✨</div>
            <div className="af-text">
              <b>Rituels & défis</b>
              5 zones de bien-être, des rituels guidés, et des défis communautaires bienveillants.
            </div>
          </div>
        </div>

        <div className="auth-tagline">"Chaque geste de soin est une graine plantée."</div>
      </div>

      {/* ── DROITE : formulaire ── */}
      <div className="auth-right">
        {success ? (
          <div className="auth-success">
            <div className="as-icon">✉️</div>
            <div className="as-title">Vérifiez votre email</div>
            <div className="as-text">
              Un lien de confirmation a été envoyé à<br />
              <span className="as-email">{email}</span><br /><br />
              Cliquez sur le lien pour activer votre jardin.
            </div>
          </div>
        ) : (
          <>
            <div className="auth-form-title">
              {view === 'login' ? 'Bon retour 🌿' : 'Planter une graine 🌱'}
            </div>
            <div className="auth-form-sub">
              {view === 'login' ? 'Votre jardin vous attend' : 'Créez votre espace de bien-être'}
            </div>

            <div className="auth-tabs">
              <div className={`auth-tab${view === 'login' ? ' active' : ''}`} onClick={() => { setView('login'); setError(null) }}>
                Connexion
              </div>
              <div className={`auth-tab${view === 'register' ? ' active' : ''}`} onClick={() => { setView('register'); setError(null) }}>
                Inscription
              </div>
            </div>

            <form onSubmit={view === 'login' ? handleSignIn : handleSignUp}>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Mot de passe</label>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button className="auth-submit" type="submit" disabled={isLoading}>
                {isLoading ? '…' : view === 'login' ? 'Entrer dans mon jardin' : 'Créer mon jardin'}
              </button>
            </form>

            <div className="auth-footer">
              Votre jardin est privé par défaut.<br />
              Vous contrôlez ce que vous partagez.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
