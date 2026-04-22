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
  width:420px; height:640px;
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
  width:100%; padding:13px 24px; border-radius:50px;
  border:1.5px solid rgba(42,104,8,.55);
  background:rgba(42,104,8,.55);
  backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
  color:#fff; font-size:15px; font-weight:600; letter-spacing:.02em;
  font-family:'Jost',sans-serif; cursor:pointer;
  box-shadow:0 4px 16px rgba(42,104,8,.20);
  transition:all .2s; margin-bottom:8px;
}
.auth-btn-primary:hover { background:rgba(42,104,8,.72); border-color:rgba(42,104,8,.72); }
.auth-btn-ghost {
  width:100%; padding:12px 24px; border-radius:50px;
  border:1.5px solid rgba(255,255,255,.55);
  background:rgba(255,255,255,.28);
  backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
  color:rgba(15,42,8,.90); font-size:14px; font-weight:400;
  font-family:'Jost',sans-serif; cursor:pointer;
  outline:none;
  transition:all .2s; margin-bottom:14px;
}
.auth-btn-ghost:hover { background:rgba(255,255,255,.48); border-color:rgba(42,104,8,.55); }
.auth-btn-ghost:focus { outline:2px solid rgba(42,104,8,.50); outline-offset:2px; }
.auth-tagline { text-align:center; font-size:18px; color:rgba(15,42,8,.70); letter-spacing:.03em; font-family:'Cormorant Garamond',serif; font-style:italic; }

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

/* ── Lien pro sous le formulaire ── */
.auth-pro-link {
  margin-top:14px; font-size:12px; color:rgba(30,20,8,.38); text-align:center; letter-spacing:.01em;
}
.auth-pro-link span {
  color:#6a5020; cursor:pointer; font-weight:500; text-decoration:underline; text-underline-offset:2px;
  transition:color .15s;
}
.auth-pro-link span:hover { color:#4a8a20; }

/* ── Modal PRO ── */
.pro-modal-overlay {
  position:fixed; inset:0; z-index:999;
  background:rgba(10,20,5,.48); backdrop-filter:blur(6px);
  display:flex; align-items:center; justify-content:center; padding:20px;
  animation:authFadeIn .25s ease both;
}
.pro-modal {
  background:rgba(252,248,242,.98); border-radius:24px;
  width:min(520px,100%); max-height:90vh; overflow-y:auto;
  padding:36px 36px 28px; position:relative;
  box-shadow:0 16px 60px rgba(30,60,10,.22);
  border:1.5px solid rgba(180,210,140,.35);
  animation:authFormIn .35s cubic-bezier(.22,1,.36,1) both;
}
.pro-modal-close {
  position:absolute; top:14px; right:16px;
  background:none; border:none; font-size:20px; cursor:pointer;
  color:rgba(30,20,8,.35); line-height:1; padding:4px;
  transition:color .15s;
}
.pro-modal-close:hover { color:rgba(30,20,8,.65); }
.pro-modal-title { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:600; color:#1a1208; margin-bottom:4px; }
.pro-modal-sub   { font-size:13px; color:rgba(30,20,8,.48); margin-bottom:22px; line-height:1.6; }
.pro-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.pro-row .auth-field { margin-bottom:0; }
.pro-req { color:#c04040; margin-left:2px; font-size:12px; }
.pro-section-label {
  font-size:10px; letter-spacing:.14em; text-transform:uppercase;
  color:rgba(30,20,8,.30); margin:18px 0 10px; font-weight:500;
  border-top:1px solid rgba(200,160,150,.18); padding-top:14px;
}
.pro-success { text-align:center; padding:28px 10px; }

/* ── Modal explicatif avantages PRO ── */
.pro-welcome-overlay {
  position:fixed; inset:0; z-index:1100;
  background:rgba(5,15,5,.78); backdrop-filter:blur(12px);
  display:flex; align-items:center; justify-content:center; padding:20px;
  animation:authFadeIn .3s ease both;
}
.pro-welcome-modal {
  background:#faf8f4;
  border:1px solid rgba(180,210,140,.35);
  border-radius:28px; width:min(560px,100%); max-height:92vh; overflow-y:auto;
  padding:0; position:relative;
  box-shadow:0 24px 80px rgba(30,60,10,.18);
  animation:authFormIn .4s cubic-bezier(.22,1,.36,1) both;
  scrollbar-width:thin; scrollbar-color:rgba(90,154,40,.20) transparent;
}
.pro-welcome-header {
  padding:44px 40px 28px;
  text-align:center;
  background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(90,154,40,.06) 0%,transparent 70%);
}
.pro-welcome-icon {
  font-size:44px; margin-bottom:14px;
  display:inline-block;
  filter:drop-shadow(0 4px 12px rgba(90,154,40,.20));
}
.pro-welcome-title {
  font-family:'Cormorant Garamond',serif;
  font-size:30px; font-weight:600; color:#1a1208;
  line-height:1.25; margin-bottom:10px;
  letter-spacing:.01em;
}
.pro-welcome-sub {
  font-size:18px; color:rgba(30,20,8,.55);
  line-height:1.7; margin-bottom:0; max-width:420px; margin-left:auto; margin-right:auto;
}
.pro-welcome-sep {
  height:1px;
  background:linear-gradient(to right,transparent,rgba(90,154,40,.25),transparent);
  margin:24px 40px;
}
.pro-welcome-section {
  padding:0 40px 20px;
}
.pro-welcome-section-title {
  font-size:15px; letter-spacing:.12em; text-transform:uppercase;
  color:rgba(60,120,20,.85); font-weight:700; margin-bottom:16px;
  display:flex; align-items:center; gap:8px;
}
.pro-welcome-section-title::after {
  content:''; flex:1; height:1px;
  background:linear-gradient(to right,rgba(90,154,40,.18),transparent);
}
.pro-welcome-item {
  display:flex; align-items:flex-start; gap:16px;
  margin-bottom:12px;
  padding:16px 18px;
  border-radius:14px;
  background:#fff;
  border:1px solid rgba(200,190,175,.45);
  transition:border-color .2s, box-shadow .2s;
}
.pro-welcome-item:hover { border-color:rgba(90,154,40,.35); box-shadow:0 2px 12px rgba(90,154,40,.08); }
.pro-welcome-item:last-child { margin-bottom:0; }
.pro-welcome-item-icon {
  width:42px; height:42px; border-radius:12px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:22px;
}
.pro-welcome-item-icon.green {
  background:rgba(90,154,40,.12);
  box-shadow:0 0 0 1px rgba(90,154,40,.18);
}
.pro-welcome-item-icon.gold {
  background:rgba(200,160,48,.10);
  box-shadow:0 0 0 1px rgba(200,160,48,.18);
}
.pro-welcome-item-body { flex:1; min-width:0; }
.pro-welcome-item-title {
  font-size:18px; font-weight:600; color:#1a1208;
  margin-bottom:4px; letter-spacing:.01em;
}
.pro-welcome-item-desc {
  font-size:18px; color:rgba(30,20,8,.58); line-height:1.65;
}
.pro-welcome-cta {
  padding:24px 40px 36px; text-align:center;
}
.pro-welcome-btn {
  width:100%; padding:16px; border-radius:50px; border:none;
  background:linear-gradient(135deg,#4a8a20,#2e6808);
  color:#fff; font-size:18px; font-weight:600;
  font-family:'Jost',sans-serif; cursor:pointer;
  box-shadow:0 6px 24px rgba(42,104,8,.28);
  transition:filter .2s, transform .15s; letter-spacing:.03em;
}
.pro-welcome-btn:hover { filter:brightness(1.08); transform:translateY(-1px); }
.pro-welcome-btn:active { transform:translateY(0); }
.pro-welcome-tagline {
  margin-top:14px; font-size:18px;
  color:#1a1208; letter-spacing:.04em;
  font-family:'Cormorant Garamond',serif; font-style:italic;
}
@media(max-width:520px) {
  .pro-welcome-header { padding:32px 24px 20px; }
  .pro-welcome-section { padding:0 24px 18px; }
  .pro-welcome-sep { margin:18px 24px; }
  .pro-welcome-cta { padding:18px 24px 28px; }
  .pro-welcome-item { padding:12px 14px; gap:12px; }
}
.pro-success-icon { font-size:52px; margin-bottom:14px; }
.pro-success-title { font-family:'Cormorant Garamond',serif; font-size:22px; color:#2e6808; margin-bottom:8px; }
.pro-success-text { font-size:13.5px; color:rgba(30,20,8,.55); line-height:1.75; }
@media(max-width:520px) {
  .pro-modal { padding:28px 20px 22px; }
  .pro-row { grid-template-columns:1fr; }
}

/* ── Modal confirmation annulation pro ── */
.pro-cancel-overlay {
  position:fixed; inset:0; z-index:1200;
  background:rgba(10,20,5,.60); backdrop-filter:blur(8px);
  display:flex; align-items:center; justify-content:center; padding:20px;
  animation:authFadeIn .2s ease both;
}
.pro-cancel-modal {
  background:#faf8f4; border-radius:22px;
  width:min(440px,100%);
  padding:36px 32px 28px; position:relative;
  box-shadow:0 20px 60px rgba(30,60,10,.20);
  border:1px solid rgba(180,210,140,.30);
  animation:authFormIn .3s cubic-bezier(.22,1,.36,1) both;
  text-align:center;
}
.pro-cancel-icon { font-size:40px; margin-bottom:14px; }
.pro-cancel-title {
  font-family:'Cormorant Garamond',serif;
  font-size:24px; font-weight:600; color:#1a1208;
  line-height:1.3; margin-bottom:10px;
}
.pro-cancel-text {
  font-size:18px; color:#1a1208; line-height:1.70;
  margin-bottom:26px;
}
.pro-cancel-actions { display:flex; flex-direction:column; gap:10px; }
.pro-cancel-confirm-btn {
  width:100%; padding:14px; border-radius:50px; border:none;
  background:rgba(180,60,60,.10); color:#b03030;
  font-size:18px; font-weight:600; font-family:'Jost',sans-serif;
  cursor:pointer; transition:background .18s;
  border:1px solid rgba(180,60,60,.20);
}
.pro-cancel-confirm-btn:hover { background:rgba(180,60,60,.18); }
.pro-cancel-confirm-btn:disabled { opacity:.4; cursor:not-allowed; }
.pro-cancel-back-btn {
  width:100%; padding:14px; border-radius:50px;
  border:1.5px solid rgba(42,104,8,.40);
  background:linear-gradient(135deg,#4a8a20,#2e6808);
  color:#fff; font-size:18px; font-weight:600;
  font-family:'Jost',sans-serif; cursor:pointer; transition:filter .18s;
}
.pro-cancel-back-btn:hover { filter:brightness(1.08); }

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
    width:100%; padding:32px 24px 28px;
    align-items:center; text-align:center;
    justify-content:flex-start; gap:20px;
  }
  .auth-logo-circle { width:72px; height:72px; }
  .auth-logo-circle img { width:52px; height:52px; }
  .auth-logo-name { font-size:19px; }
  .auth-title { font-size:clamp(38px,10vw,54px); }
  .auth-subtitle-wrap { display:none; }
  .auth-sep { display:none; }
  .auth-btn-primary { font-size:13px; padding:10px 18px; }
  .auth-btn-ghost { font-size:12px; padding:9px 18px; }
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

  // ── Modal PRO ──
  const [showProModal,      setShowProModal]      = useState(false)
  const [proSuccess,        setProSuccess]        = useState(false)
  const [proLoading,        setProLoading]        = useState(false)
  const [proError,          setProError]          = useState(null)
  const [proEmailPending,   setProEmailPending]   = useState(false)
  const [showProWelcome,    setShowProWelcome]     = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelLoading,     setCancelLoading]     = useState(false)
  const [showProFlower,     setShowProFlower]     = useState(false)
  const [showProLaunch,     setShowProLaunch]     = useState(false)
  const [proForm, setProForm] = useState(() => {
    try {
      const saved = localStorage.getItem('mji_pro_draft')
      if (saved) return { ...{ nom:'', prenom:'', entreprise:'', activite:'', adresse:'', cp:'', ville:'', telephone:'', siret:'', proEmail:'', proPassword:'' }, ...JSON.parse(saved) }
    } catch(e) {}
    return { nom:'', prenom:'', entreprise:'', activite:'', adresse:'', cp:'', ville:'', telephone:'', siret:'', proEmail:'', proPassword:'' }
  })

  const hasLoggedInBefore = !!localStorage.getItem('mji_has_logged_in')

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (localStorage.getItem('mji_go_register') === '1') {
      localStorage.removeItem('mji_go_register')
      setRightPanel('register')
    }
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRightPanel('newpassword')
    })
    return () => subscription.unsubscribe()
  }, [])

  const goTo = (panel) => { setRightPanel(panel); setError(null); setResetSent(false) }

  const updatePro = (field) => (e) => {
    const val = e.target.value
    setProForm(f => {
      const next = { ...f, [field]: val }
      // Persiste dans localStorage (sans mot de passe)
      try {
        const { proPassword: _, ...toSave } = next
        localStorage.setItem('mji_pro_draft', JSON.stringify(toSave))
      } catch(e) {}
      return next
    })
  }

  async function handleProSubmit(e) {
    e.preventDefault()
    const { nom, prenom, telephone, siret, proEmail, proPassword } = proForm
    if (!nom.trim())       { setProError('Le nom est obligatoire.'); return }
    if (!prenom.trim())    { setProError('Le prénom est obligatoire.'); return }
    if (!telephone.trim()) { setProError('Le téléphone est obligatoire.'); return }
    if (!siret.trim())     { setProError('Le SIRET est obligatoire.'); return }
    if (!/^\d{14}$/.test(siret.replace(/\s/g,''))) { setProError('Le SIRET doit comporter 14 chiffres.'); return }
    if (!proEmail.trim())  { setProError("L'email est obligatoire."); return }
    if (proPassword.length < 8) { setProError('Mot de passe : 8 caractères minimum.'); return }
    setProError(null); setProLoading(true)
    try {
      // 1. Créer le compte Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: proEmail.trim(),
        password: proPassword,
        options: { data: { display_name: prenom.trim() + ' ' + nom.trim(), role: 'pro' } }
      })
      if (signUpError) throw new Error(signUpError.message)
      const userId = data?.user?.id
      if (!userId) throw new Error('Erreur lors de la création du compte.')

      // 2. Insérer dans users avec role pro (accès immédiat)
      await supabase.from('users').upsert({
        id: userId,
        email: proEmail.trim(),
        display_name: prenom.trim() + ' ' + nom.trim(),
        role: 'pro',
      }, { onConflict: 'id' })

      // 3. Insérer dans users_pro lié au compte
      const { error: dbError } = await supabase.from('users_pro').insert({
        user_id: userId,
        email: proEmail.trim(),
        nom: nom.trim(),
        prenom: prenom.trim(),
        entreprise: proForm.entreprise.trim() || null,
        activite: proForm.activite.trim() || null,
        adresse: proForm.adresse.trim() || null,
        cp: proForm.cp.trim() || null,
        ville: proForm.ville.trim() || null,
        telephone: telephone.trim(),
        siret: siret.replace(/\s/g,''),
        created_at: new Date().toISOString(),
      })
      if (dbError) throw new Error(dbError.message)

      // 4. Connexion : immédiate si email non vérifié requis désactivé,
      //    sinon l'utilisateur devra cliquer sur le lien reçu par email.
      // Succès : vider le draft localStorage
      try { localStorage.removeItem('mji_pro_draft') } catch(e) {}
      if (data?.session) {
        localStorage.setItem('mji_has_logged_in', '1')
        localStorage.setItem('mji_show_pro_welcome', '1')
        localStorage.setItem('mji_show_pro_launch', '1')
        setNewUserId(userId)
        setDisplayName(prenom.trim())
        // Accès immédiat : fermer le modal d'inscription et ouvrir directement la présentation pro
        setShowProModal(false)
        setProForm({ nom:'', prenom:'', entreprise:'', activite:'', adresse:'', cp:'', ville:'', telephone:'', siret:'', proEmail:'', proPassword:'' })
        setShowProWelcome(true)
      } else {
        setProSuccess(true)
        setProEmailPending(true)
      }
    } catch (err) { setProError(err.message) }
    finally { setProLoading(false) }
  }

  function closeProModal() {
    setShowProModal(false)
    setProSuccess(false)
    setProError(null)
    try {
      const saved = localStorage.getItem('mji_pro_draft')
      if (saved) setProForm(f => ({ ...f, ...JSON.parse(saved), proPassword: '' }))
    } catch(e) {}
    setProEmailPending(false)
  }

  // ── Envoi Systeme.io PRO ──
  // Placé ICI intentionnellement : le clic sur "Commencer mon aventure pro"
  // est la dernière étape irréversible. Tout pro ayant cliqué
  // "Je ne souhaite pas créer de compte pro" ne passe jamais par cette fonction.
  async function handleStartProAdventure() {
    try {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession()
      const { data: { user },    error: userErr }    = await supabase.auth.getUser()

      console.log('[Systeme.io pro] session:', !!session, '| sessionErr:', sessionErr)
      console.log('[Systeme.io pro] user:', user?.email, '| userErr:', userErr)
      console.log('[Systeme.io pro] proForm.prenom:', proForm.prenom, '| proForm.nom:', proForm.nom)

      if (session && user) {
        const payload = {
          record: {
            email:  user.email,
            prenom: proForm.prenom?.trim() || displayName?.trim() || '',
            nom:    proForm.nom?.trim()    || '',
            role:   'pro',
          },
        }
        console.log('[Systeme.io pro] payload envoyé:', JSON.stringify(payload))

        const { data: fnData, error: fnError } = await supabase.functions.invoke('register-to-systemeio', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: payload,
        })
        console.log('[Systeme.io pro] réponse fn:', JSON.stringify(fnData), '| erreur:', fnError)
      } else {
        console.warn('[Systeme.io pro] pas de session ou user — envoi annulé')
      }
    } catch(e) {
      console.error('[Systeme.io pro] exception:', e)
    }
    setShowProWelcome(false)
    setShowProFlower(true)
  }

  async function handleCancelPro() {
    setCancelLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('users_pro').delete().eq('user_id', user.id)
        await supabase.from('users').delete().eq('id', user.id)
        localStorage.setItem('mji_go_register', '1')
        await supabase.auth.signOut()
      }
    } catch(e) { console.warn('[CancelPro]', e) }
    finally {
      setCancelLoading(false)
      setShowCancelConfirm(false)
      setShowProWelcome(false)
    }
  }

  async function handleSignIn(e) {
    e.preventDefault()
    setError(null); setIsLoading(true)
    try {
      await signIn(email, password)
      localStorage.setItem('mji_has_logged_in', '1')
    } catch (err) { setError(err.message) }
    finally { setIsLoading(false) }
  }

  // ── Envoi Systeme.io PARTICULIER ──
  // Envoyé après le upsert users réussi avec session active.
  // À ce stade le compte est confirmé, le parcours particulier est irréversible.
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

        // Envoi Systeme.io : email + prénom + tag particulier (SYSTEMEIO_TAG_ID)
        try {
          const payload = {
            record: {
              email:  data.user.email,
              prenom: displayName.trim(),
              role:   'particulier',
            },
          }
          console.log('[Systeme.io particulier] session access_token présent:', !!data.session.access_token)
          console.log('[Systeme.io particulier] payload:', JSON.stringify(payload))

          const { data: fnData, error: fnError } = await supabase.functions.invoke('register-to-systemeio', {
            headers: { Authorization: `Bearer ${data.session.access_token}` },
            body: payload,
          })
          console.log('[Systeme.io particulier] réponse fn:', JSON.stringify(fnData), '| erreur:', fnError)
        } catch(sioErr) {
          console.error('[Systeme.io particulier] exception:', sioErr)
        }

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
    <>
    <div className="auth-wrap">
      <style>{css}</style>
      <div className="auth-bg">
        <img src="/fond1.png" alt=""/>
      </div>
      <div style={{ position:'absolute', inset:0, background:'rgba(240,236,220,.35)', zIndex:0 }}/>

      <div className="auth-layout">
        <div style={{ display:'flex', alignItems:'center', gap:48, background: isMobile ? 'transparent' : 'rgba(252,250,244,.78)', backdropFilter: isMobile ? 'none' : 'blur(16px)', borderRadius: isMobile ? 0 : 28, border: isMobile ? 'none' : '1.5px solid rgba(180,210,140,.35)', padding: isMobile ? '40px 22px 28px' : '40px 40px', boxShadow: isMobile ? 'none' : '0 8px 40px rgba(60,100,20,.10)' }}>

        {/* ── COLONNE GAUCHE — contenu de présentation ── */}
        {(!mobileForm) && (
          <div className="auth-left-col">
            {/* Logo — toujours dans le flux, taille différente selon mobile/PC */}
            <div className="auth-logo-block">
              <div className="auth-logo-circle" style={{ width: isMobile ? 72 : 90, height: isMobile ? 72 : 90 }}>
                <img src="/icons/logo.png" alt="" style={{ width: isMobile ? 54 : 68, height: isMobile ? 54 : 68, borderRadius:'50%' }}/>
              </div>
              <div className="auth-logo-name" style={{ fontSize: isMobile ? 18 : 22 }}>Mon <em style={{ fontStyle:'normal', color:'#2e7010' }}>Jardin</em> Intérieur</div>
            </div>

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
              <div className="auth-tagline">Chaque geste de soin est une graine.</div>

              {/* Entrée pro — séparée visuellement */}
              <div style={{marginTop:20,paddingTop:16,borderTop:'1px solid rgba(42,104,8,.15)',textAlign:'center'}}>
                <div style={{fontSize:18,color:'rgba(15,42,8,.65)',marginBottom:10}}>Vous exercez une activité de bien-être ?</div>
                <button
                  onClick={() => setShowProModal(true)}
                  style={{background:'none',border:'none',padding:0,cursor:'pointer',fontFamily:"'Jost',sans-serif",fontSize:18,fontWeight:600,color:'rgba(90,60,10,.80)',textDecoration:'underline',textUnderlineOffset:3,transition:'color .15s'}}
                  onMouseOver={e=>e.target.style.color='rgba(90,60,10,1)'}
                  onMouseOut={e=>e.target.style.color='rgba(90,60,10,.80)'}
                >
                  Créer un espace professionnel →
                </button>
              </div>

              {import.meta.env.DEV && (
                <button onClick={() => setShowProWelcome(true)} style={{marginTop:12,width:'100%',padding:'10px',borderRadius:8,border:'1px dashed rgba(90,154,40,.40)',background:'transparent',color:'rgba(90,154,40,.80)',fontSize:18,fontFamily:"'Jost',sans-serif",cursor:'pointer'}}>
                  ◎ Aperçu présentation pro
                </button>
              )}
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

      {/* ── MODAL PROFESSIONNEL(LE) ── */}
      {showProModal && (
        <div className="pro-modal-overlay" onClick={e => e.target===e.currentTarget && closeProModal()}>
          <div className="pro-modal">
            <button className="pro-modal-close" onClick={closeProModal} aria-label="Fermer">✕</button>

            {proSuccess ? (
              <div className="pro-success">
                {proEmailPending ? (
                  <>
                    <div className="pro-success-icon">✉️</div>
                    <div className="pro-success-title">Vérifiez votre email !</div>
                    <div className="pro-success-text">
                      Un lien de confirmation a été envoyé à<br/>
                      <strong style={{color:'#1a1208'}}>{proForm.proEmail}</strong>.<br/><br/>
                      Cliquez sur le lien pour activer votre compte pro<br/>
                      et accéder à votre espace avec le badge <strong style={{color:'#2e6808'}}>✦ Pro</strong>.
                    </div>
                    <button className="auth-submit" style={{marginTop:24,maxWidth:280,marginLeft:'auto',marginRight:'auto',display:'block'}} onClick={() => { closeProModal(); goTo('login') }}>
                      Me connecter après confirmation →
                    </button>
                  </>
                ) : (
                  <>
                    <div className="pro-success-icon">🌿</div>
                    <div className="pro-success-title">Bienvenue, professionnel(le) !</div>
                    <div className="pro-success-text">
                      Votre espace pro est prêt.<br/>
                      Vous êtes connecté(e) avec le badge <strong style={{color:'#2e6808'}}>✦ Pro</strong>.
                    </div>
                    <button className="auth-submit" style={{marginTop:24,maxWidth:280,marginLeft:'auto',marginRight:'auto',display:'block'}} onClick={() => { closeProModal(); setShowProWelcome(true) }}>
                      Découvrir mon espace pro →
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="pro-modal-title">Espace Professionnel 🌱</div>
                <div className="pro-modal-sub">Inscrivez votre activité de mieux-être pour rejoindre la communauté pro.</div>

                <form onSubmit={handleProSubmit}>
                  <div className="pro-row">
                    <div className="auth-field">
                      <label className="auth-label">Nom <span className="pro-req">*</span></label>
                      <input className="auth-input" type="text" placeholder="Dupont" value={proForm.nom} onChange={updatePro('nom')} required autoFocus maxLength={80}/>
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Prénom <span className="pro-req">*</span></label>
                      <input className="auth-input" type="text" placeholder="Marie" value={proForm.prenom} onChange={updatePro('prenom')} required maxLength={80}/>
                    </div>
                  </div>

                  <div className="pro-section-label">Entreprise &amp; localisation</div>

                  <div className="auth-field">
                    <label className="auth-label">Nom de l'entreprise</label>
                    <input className="auth-input" type="text" placeholder="Cabinet Marie Dupont" value={proForm.entreprise} onChange={updatePro('entreprise')} maxLength={120}/>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Nature de l'activité</label>
                    <input className="auth-input" type="text" placeholder="Ex : hypnothérapeute, coach bien-être, naturopathe…" value={proForm.activite} onChange={updatePro('activite')} maxLength={160}/>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Adresse</label>
                    <input className="auth-input" type="text" placeholder="12 rue des Lilas" value={proForm.adresse} onChange={updatePro('adresse')} maxLength={200}/>
                  </div>

                  <div className="pro-row">
                    <div className="auth-field">
                      <label className="auth-label">Code postal</label>
                      <input className="auth-input" type="text" placeholder="33000" value={proForm.cp} onChange={updatePro('cp')} maxLength={10}/>
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Ville</label>
                      <input className="auth-input" type="text" placeholder="Bordeaux" value={proForm.ville} onChange={updatePro('ville')} maxLength={80}/>
                    </div>
                  </div>

                  <div style={{fontSize:'12px',fontWeight:'700',color:'#b83030',marginTop:'8px',marginBottom:'4px',textAlign:'center',letterSpacing:'.01em'}}>
                    🇫🇷 Service proposé uniquement en France et DOM-TOM
                  </div>
                  <div className="pro-section-label">Contact &amp; identification</div>

                  <div className="auth-field">
                    <label className="auth-label">Téléphone <span className="pro-req">*</span></label>
                    <input className="auth-input" type="tel" placeholder="06 12 34 56 78" value={proForm.telephone} onChange={updatePro('telephone')} required maxLength={20}/>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">SIRET <span className="pro-req">*</span></label>
                    <input className="auth-input" type="text" placeholder="362 521 879 00034" value={proForm.siret} onChange={updatePro('siret')} required maxLength={18}/>
                    <div className="auth-hint">14 chiffres — visible uniquement par l'équipe MJI</div>
                  </div>

                  <div className="pro-section-label">Accès à l&apos;application</div>

                  <div className="auth-field">
                    <label className="auth-label">Email <span className="pro-req">*</span></label>
                    <input className="auth-input" type="email" placeholder="pro@email.com" value={proForm.proEmail} onChange={updatePro('proEmail')} required maxLength={120}/>
                    <div className="auth-hint">Votre identifiant de connexion</div>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Mot de passe <span className="pro-req">*</span></label>
                    <input className="auth-input" type="password" placeholder="8 caractères min." value={proForm.proPassword} onChange={updatePro('proPassword')} required minLength={8}/>
                    <div className="auth-hint">8 caractères minimum · 1 majuscule · 1 minuscule</div>
                  </div>

                  {proError && <div className="auth-error">{proError}</div>}

                  <button className="auth-submit" type="submit" disabled={proLoading} style={{marginTop:10}}>
                    {proLoading ? '…' : 'Envoyer mon inscription comme professionnel(le)'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL EXPLICATIF AVANTAGES PRO ── */}
      {showProWelcome && (
        <div className="pro-welcome-overlay" onClick={e => e.target===e.currentTarget && setShowProWelcome(false)}>
          <div className="pro-welcome-modal">

            <div className="pro-welcome-header">
              <div className="pro-welcome-icon">🌿</div>
              <div className="pro-welcome-title">Votre jardin professionnel<br/>vient de s'ouvrir</div>
              <div className="pro-welcome-sub">
                En rejoignant Mon Jardin Intérieur en tant que professionnel(le),<br/>
                vous entrez dans un écosystème conçu pour vous soutenir,<br/>vous et vos clients.
              </div>
            </div>

            <div className="pro-welcome-sep"/>

            {/* Ce que vos clients reçoivent */}
            <div className="pro-welcome-section">
              <div className="pro-welcome-section-title">🌱 Ce que vos clients reçoivent</div>

              <div className="pro-welcome-item">
                <div className="pro-welcome-item-icon green">🎁</div>
                <div className="pro-welcome-item-body">
                  <div className="pro-welcome-item-title">−10 % sur leur abonnement</div>
                  <div className="pro-welcome-item-desc">En utilisant votre code, ils bénéficient d'une réduction immédiate et permanente. Une vraie valeur ajoutée à votre accompagnement.</div>
                </div>
              </div>

              <div className="pro-welcome-item">
                <div className="pro-welcome-item-icon green">🌸</div>
                <div className="pro-welcome-item-body">
                  <div className="pro-welcome-item-title">Un outil de soin quotidien</div>
                  <div className="pro-welcome-item-desc">Entre deux séances, Mon Jardin Intérieur les accompagne : bilan émotionnel, rituels, club de soutien. Votre travail continue en dehors du cabinet.</div>
                </div>
              </div>

              <div className="pro-welcome-item">
                <div className="pro-welcome-item-icon green">🤝</div>
                <div className="pro-welcome-item-body">
                  <div className="pro-welcome-item-title">Un lien durable avec vous</div>
                  <div className="pro-welcome-item-desc">Votre code crée un lien traçable et pérenne. Chaque client que vous orientez reste attaché à votre identifiant, pour toujours.</div>
                </div>
              </div>
            </div>

            <div className="pro-welcome-sep"/>

            {/* Partenariat gagnant/gagnant */}
            <div className="pro-welcome-section">
              <div className="pro-welcome-section-title">🤝 Un partenariat gagnant / gagnant</div>

              <div className="pro-welcome-item">
                <div className="pro-welcome-item-icon green">🪴</div>
                <div className="pro-welcome-item-body">
                  <div className="pro-welcome-item-title">Vous recommandez, ils progressent</div>
                  <div className="pro-welcome-item-desc">Chaque client que vous orientez bénéficie d'un outil complémentaire à votre suivi, et vous êtes récompensé(e) à chaque renouvellement.</div>
                </div>
              </div>

              <div className="pro-welcome-item">
                <div className="pro-welcome-item-icon gold">🔗</div>
                <div className="pro-welcome-item-body">
                  <div className="pro-welcome-item-title">Un lien tracé à vie</div>
                  <div className="pro-welcome-item-desc">Même si vous ne suivez plus un client directement, le lien avec votre code reste actif. Votre commission aussi.</div>
                </div>
              </div>
            </div>

            <div className="pro-welcome-sep"/>

            {/* Ce que vous gagnez */}
            <div className="pro-welcome-section">
              <div className="pro-welcome-section-title">✦ Ce que vous gagnez</div>

              <div className="pro-welcome-item">
                <div className="pro-welcome-item-icon gold">🪪</div>
                <div className="pro-welcome-item-body">
                  <div className="pro-welcome-item-title">Un identifiant partenaire unique</div>
                  <div className="pro-welcome-item-desc">Votre code personnel tracera chaque client que vous recommandez, à vie. Même si vous ne les suivez plus directement.</div>
                </div>
              </div>

              <div className="pro-welcome-item">
                <div className="pro-welcome-item-icon gold">💰</div>
                <div className="pro-welcome-item-body">
                  <div className="pro-welcome-item-title">10 % de commission récurrente</div>
                  <div className="pro-welcome-item-desc">À chaque renouvellement d'abonnement de vos clients (mensuel ou annuel), une commission de 10 % est automatiquement créditée sur votre solde. (Contrat portage d'affaires.)</div>
                </div>
              </div>

              <div className="pro-welcome-item">
                <div className="pro-welcome-item-icon gold">📊</div>
                <div className="pro-welcome-item-body">
                  <div className="pro-welcome-item-title">Un tableau de bord transparent</div>
                  <div className="pro-welcome-item-desc">Suivez en temps réel vos clients affiliés, votre historique de CA et votre solde disponible depuis votre espace pro.</div>
                </div>
              </div>
            </div>

            <div className="pro-welcome-sep"/>

            {/* Votre vitrine dans l'application */}
            <div className="pro-welcome-section">
              <div className="pro-welcome-section-title">🛍️ Votre vitrine dans l'application</div>

              <div className="pro-welcome-item">
                <div className="pro-welcome-item-icon green">🌿</div>
                <div className="pro-welcome-item-body">
                  <div className="pro-welcome-item-title">Ateliers & formations en ligne</div>
                  <div className="pro-welcome-item-desc">Proposez vos ateliers bien-être directement aux abonnés de Mon Jardin Intérieur. Séances live, replays, formations à votre rythme.</div>
                </div>
              </div>

              <div className="pro-welcome-item">
                <div className="pro-welcome-item-icon gold">🎧</div>
                <div className="pro-welcome-item-body">
                  <div className="pro-welcome-item-title">Audios & e-books dans la Jardinothèque</div>
                  <div className="pro-welcome-item-desc">Déposez vos créations numériques — méditations guidées, protocoles, guides pratiques — et commercialisez-les auprès de toute la communauté.</div>
                </div>
              </div>

              <div className="pro-welcome-item">
                <div className="pro-welcome-item-icon green">✨</div>
                <div className="pro-welcome-item-body">
                  <div className="pro-welcome-item-title">Une audience déjà là</div>
                  <div className="pro-welcome-item-desc">Pas besoin de construire une liste. Vos ressources sont visibles par des abonnés en recherche active de soutien et d'outils de mieux-être.</div>
                </div>
              </div>
            </div>

            <div className="pro-welcome-cta">
              <div style={{fontSize:16,color:'#1a1208',lineHeight:1.65,marginBottom:16,fontStyle:'italic',fontFamily:"'Cormorant Garamond',serif"}}>
                Un mail vous sera adressé avec plus de précisions dès votre avancement dans l'aventure.
              </div>
              <button className="pro-welcome-btn" onClick={handleStartProAdventure}>
                Commencer mon aventure pro →
              </button>
              <div className="pro-welcome-tagline">Chaque geste de soin est une graine.</div>
              <button
                onClick={() => setShowCancelConfirm(true)}
                style={{marginTop:18,background:'none',border:'none',color:'rgba(30,20,8,.32)',fontSize:18,fontFamily:"'Jost',sans-serif",cursor:'pointer',textDecoration:'underline',textUnderlineOffset:3,letterSpacing:'.01em',transition:'color .15s'}}
                onMouseOver={e=>e.target.style.color='rgba(180,60,60,.70)'}
                onMouseOut={e=>e.target.style.color='rgba(30,20,8,.32)'}
              >
                Je ne souhaite pas créer de compte pro
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Modal confirmation annulation pro ── */}
      {showCancelConfirm && (
        <div className="pro-cancel-overlay">
          <div className="pro-cancel-modal">
            <div className="pro-cancel-icon">🌿</div>
            <div className="pro-cancel-title">Êtes-vous sûr de vouloir annuler votre compte pro ?</div>
            <div className="pro-cancel-text">
              Vous passeriez à côté d'une offre gagnant / gagnant : commissions récurrentes, vitrine dans l'app, et des clients accompagnés entre vos séances.<br/><br/>
              Cette action supprimera définitivement votre inscription professionnelle.
            </div>
            <div className="pro-cancel-actions">
              <button
                className="pro-cancel-back-btn"
                onClick={() => setShowCancelConfirm(false)}
              >
                ← Revenir à mon espace pro
              </button>
              <button
                className="pro-cancel-confirm-btn"
                onClick={handleCancelPro}
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Annulation en cours…' : 'Oui, annuler mon compte pro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal choix de la fleur (parcours pro) ── */}
      {showProFlower && (
        <div style={{position:'fixed',inset:0,zIndex:1200,background:'rgba(10,20,5,.55)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,animation:'authFadeIn .25s ease both'}}>
          <div style={{background:'rgba(252,248,242,.97)',borderRadius:24,width:'min(420px,100%)',maxHeight:'90vh',overflowY:'auto',padding:'36px 32px',position:'relative',boxShadow:'0 20px 60px rgba(30,60,10,.22)',border:'1.5px solid rgba(180,210,140,.35)',animation:'authFormIn .35s cubic-bezier(.22,1,.36,1) both'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:400,color:'#1a1208',marginBottom:8}}>Votre identité florale 🌸</div>
            <div style={{fontSize:18,color:'#1a1208',marginBottom:10,lineHeight:1.65}}>
              Ici pas de nom. Chaque membre du jardin est identifié par son prénom et une fleur.<br/>
              <span style={{fontSize:16,color:'rgba(30,20,8,.40)',fontStyle:'italic'}}>Ex : Marie · Lavande</span>
            </div>

            <div style={{textAlign:'center',padding:'10px 0 14px',fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#1a1208',minHeight:44}}>
              {selFlower
                ? <><span>🌸</span> {displayName} · <span>{selFlower}</span></>
                : 'Choisissez votre fleur ci-dessous'}
            </div>
            <div className="auth-flower-grid" style={{marginBottom:20}}>
              {FLOWER_NAMES.map(n => (
                <div key={n} className={'auth-flower-pill' + (selFlower===n?' sel':'')} style={{fontSize:16}} onClick={() => setSelFlower(n)}>{n}</div>
              ))}
            </div>
            <button className="auth-submit" style={{fontSize:18,lineHeight:1.4,whiteSpace:'normal',padding:'14px 20px'}} onClick={() => { setShowProFlower(false); setShowProLaunch(true) }} disabled={!selFlower || savingFlower}>
              {savingFlower ? '…' : selFlower
                ? <><span style={{display:'block',fontSize:18,fontWeight:600}}>Entrer dans mon jardin</span></>
                : 'Choisissez une fleur'}
            </button>
            <div style={{marginTop:14,fontSize:18,color:'#1a1208',textAlign:'center',lineHeight:1.7}}>Modifiable dans vos paramètres.</div>
          </div>
        </div>
      )}
      {showProLaunch && (
        <div style={{position:'fixed',inset:0,zIndex:1300,background:'rgba(10,20,5,.65)',backdropFilter:'blur(14px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,animation:'authFadeIn .3s ease both'}}>
          <div style={{background:'rgba(252,248,242,.98)',borderRadius:24,width:'min(480px,100%)',maxHeight:'90vh',overflowY:'auto',padding:'40px 32px 36px',position:'relative',boxShadow:'0 24px 70px rgba(30,60,10,.28)',border:'1.5px solid rgba(180,210,140,.40)',animation:'authFormIn .38s cubic-bezier(.22,1,.36,1) both'}}>

            {/* Icône */}
            <div style={{textAlign:'center',fontSize:52,marginBottom:16}}>🌱</div>

            {/* Titre */}
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:400,color:'#1a1208',textAlign:'center',lineHeight:1.2,marginBottom:20}}>
              Bienvenue dans l'aventure,<br/>
              <em style={{fontStyle:'italic',color:'#5a8a30'}}>{displayName || 'cher(e) thérapeute'}</em> 🎉
            </div>

            {/* Séparateur */}
            <div style={{width:48,height:2,background:'linear-gradient(90deg,transparent,#8ab840,transparent)',margin:'0 auto 24px'}}/>

            {/* Texte */}
            <div style={{display:'flex',flexDirection:'column',gap:16,marginBottom:28}}>
              <p style={{fontSize:17,color:'#1a1208',lineHeight:1.8,margin:0}}>
                Votre inscription est complète — vous êtes prêt(e) à entrer dans l'expérience <strong>Mon Jardin Intérieur</strong>.
              </p>
              <p style={{fontSize:17,color:'#1a1208',lineHeight:1.8,margin:0}}>
                Avant tout, nous vous invitons à <strong>vivre le même parcours initiatique que vos futurs clients</strong>. C'est en le traversant vous-même que vous pourrez en parler avec authenticité et guider vos accompagnés avec justesse.
              </p>
              <div style={{padding:'16px 18px',borderRadius:14,background:'rgba(90,138,48,.07)',border:'1px solid rgba(90,138,48,.22)'}}>
                <div style={{fontSize:15,fontWeight:600,color:'#5a8a30',marginBottom:8,letterSpacing:'.04em',textTransform:'uppercase'}}>✦ Votre espace Pro vous attend</div>
                <p style={{fontSize:17,color:'#1a1208',lineHeight:1.75,margin:0}}>
                  À l'issue de votre première étape, un bouton <strong>« Mon compte Pro »</strong> apparaîtra dans votre profil. Vous y trouverez votre tableau de bord, la possibilité de créer des <strong>ateliers</strong>, des <strong>séances en ligne</strong>, et de mettre en vente vos <strong>audios, e-books</strong> et autres contenus — rapidement et simplement.
                </p>
              </div>
              <p style={{fontSize:17,color:'#1a1208',lineHeight:1.8,margin:0,fontStyle:'italic',textAlign:'center'}}>
                À très bientôt, et belle continuation dans cette magnifique aventure 🌿
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={async () => { await handleConfirmFlower(); setShowProLaunch(false); window.location.reload() }}
              style={{width:'100%',padding:'16px 24px',borderRadius:100,border:'none',cursor:'pointer',fontFamily:"'Jost',sans-serif",fontSize:18,fontWeight:600,color:'#fff',background:'linear-gradient(135deg,#78c040,#4a8820)',boxShadow:'0 8px 24px rgba(90,138,48,.35)',transition:'transform .15s,filter .15s',letterSpacing:'.03em'}}
              onMouseEnter={e=>{e.currentTarget.style.filter='brightness(1.08)';e.currentTarget.style.transform='translateY(-1px)'}}
              onMouseLeave={e=>{e.currentTarget.style.filter='none';e.currentTarget.style.transform='none'}}
            >
              Commencer l'aventure
            </button>

            <div style={{marginTop:14,fontSize:14,color:'rgba(30,20,8,.38)',textAlign:'center',lineHeight:1.6}}>
              Votre compte Pro est actif · Profil modifiable dans vos paramètres
            </div>
          </div>
        </div>
      )}

    </>
  )
}
