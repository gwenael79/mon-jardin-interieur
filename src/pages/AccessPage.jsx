import { useState, useEffect, useRef } from 'react'
import { supabase } from '../core/supabaseClient'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Epilogue:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.ap-root {
  font-family: 'Epilogue', sans-serif;
  background: #06100a;
  color: #e2ddd3;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  position: relative;
}

.ap-bg {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(ellipse 70% 80% at 15% 50%, rgba(40,90,15,0.18) 0%, transparent 55%),
    radial-gradient(ellipse 50% 60% at 85% 20%, rgba(20,60,8,0.14) 0%, transparent 55%),
    radial-gradient(ellipse 40% 50% at 50% 100%, rgba(60,110,20,0.10) 0%, transparent 55%);
}
.ap-bg::after {
  content: '';
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.028'/%3E%3C/svg%3E");
  opacity: 1; pointer-events: none;
}

.ap-root::before {
  content: '';
  position: fixed; inset: 0; pointer-events: none; z-index: 1;
  background:
    linear-gradient(to right, transparent calc(33.33% - 0.5px), rgba(255,255,255,0.06) calc(33.33% - 0.5px), rgba(255,255,255,0.06) calc(33.33% + 0.5px), transparent calc(33.33% + 0.5px)),
    linear-gradient(to right, transparent calc(66.66% - 0.5px), rgba(255,255,255,0.06) calc(66.66% - 0.5px), rgba(255,255,255,0.06) calc(66.66% + 0.5px), transparent calc(66.66% + 0.5px));
}

.ap-col {
  position: relative; z-index: 2;
  display: flex; flex-direction: column;
  padding: clamp(28px, 3.5vh, 52px) clamp(24px, 3vw, 44px) clamp(40px, 5vh, 80px);
  overflow-y: auto; overflow-x: hidden;
  transition: background 0.5s ease;
  scrollbar-width: none;
}
.ap-col::-webkit-scrollbar { display: none; }
.ap-col::before {
  content: ''; position: absolute; inset: 0;
  opacity: 0; transition: opacity 0.5s ease; pointer-events: none;
}
.ap-col-free::before   { background: radial-gradient(ellipse 100% 80% at 50% 0%, rgba(168,224,64,0.05) 0%, transparent 60%); }
.ap-col-prem::before   { background: radial-gradient(ellipse 100% 80% at 50% 0%, rgba(157,220,62,0.09) 0%, transparent 60%); }
.ap-col-ent::before    { background: radial-gradient(ellipse 100% 80% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 60%); }
.ap-col:hover::before  { opacity: 1; }
.ap-col-prem           { background: rgba(255,255,255,0.012); }

/* accent top line on premium */
.ap-accent-line {
  position: absolute; top: 0; left: 44px; right: 44px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(168,224,64,0.4), transparent);
}

.ap-tag {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase;
  font-weight: 500; padding: 5px 13px; border-radius: 30px;
  margin-bottom: clamp(20px, 3vh, 44px); width: fit-content;
  animation: ap-fadeUp 0.7s ease both;
}
.ap-tag-free { background: rgba(255,255,255,0.05); color: rgba(226,221,211,0.45); border: 1px solid rgba(255,255,255,0.08); }
.ap-tag-prem { background: rgba(157,220,62,0.10); color: #a8e040; border: 1px solid rgba(157,220,62,0.22); }
.ap-tag-ent  { background: rgba(201,168,76,0.08); color: #c9a84c; border: 1px solid rgba(201,168,76,0.20); }
.ap-col:nth-child(2) .ap-tag { animation-delay: 0.12s; }
.ap-col:nth-child(3) .ap-tag { animation-delay: 0.24s; }

.ap-soon {
  font-size: 10px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;
  color: #c9a84c; background: rgba(201,168,76,0.10); border: 1px solid rgba(201,168,76,0.18);
  padding: 3px 10px; border-radius: 20px;
  display: inline-block; margin-bottom: 12px;
  animation: ap-fadeUp 0.7s 0.24s ease both;
}

.ap-icon {
  font-size: clamp(26px, 2.8vw, 36px); margin-bottom: clamp(10px, 1.5vh, 18px); display: block;
  animation: ap-fadeUp 0.7s ease both;
}
.ap-col:nth-child(2) .ap-icon { animation-delay: 0.10s; }
.ap-col:nth-child(3) .ap-icon { animation-delay: 0.20s; }

.ap-col-h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(22px, 2vw, 34px); font-weight: 300;
  line-height: 1.15; letter-spacing: -0.5px; color: #e2ddd3;
  margin-bottom: 10px;
  animation: ap-fadeUp 0.7s ease both;
}
.ap-col:nth-child(2) .ap-col-h2 { animation-delay: 0.14s; }
.ap-col:nth-child(3) .ap-col-h2 { animation-delay: 0.28s; }

.ap-col-desc {
  font-size: clamp(11px, 1.1vw, 13px); color: rgba(226,221,211,0.48);
  line-height: 1.7; margin-bottom: clamp(14px, 2vh, 28px); max-width: 260px;
  animation: ap-fadeUp 0.7s ease both;
}
.ap-col:nth-child(2) .ap-col-desc { animation-delay: 0.18s; }
.ap-col:nth-child(3) .ap-col-desc { animation-delay: 0.36s; }

.ap-features { list-style: none; flex: 1; animation: ap-fadeUp 0.7s ease both; }
.ap-col:nth-child(2) .ap-features { animation-delay: 0.22s; }
.ap-col:nth-child(3) .ap-features { animation-delay: 0.44s; }

.ap-features li {
  font-size: 12.5px; color: rgba(226,221,211,0.5);
  padding: 8px 0; display: flex; align-items: center; gap: 11px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.ap-features li:last-child { border-bottom: none; }
.ap-features li.ap-locked  { opacity: 0.32; }

.ap-check {
  width: 14px; height: 14px; flex-shrink: 0; border-radius: 50%;
  background: rgba(168,224,64,0.12); border: 1px solid rgba(168,224,64,0.3);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'%3E%3Cpath d='M2.5 7l3 3 6-6' stroke='%23a8e040' stroke-width='1.3' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-size: contain;
}
.ap-check-gold {
  width: 14px; height: 14px; flex-shrink: 0; border-radius: 50%;
  background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.3);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'%3E%3Cpath d='M2.5 7l3 3 6-6' stroke='%23c9a84c' stroke-width='1.3' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-size: contain;
}
.ap-check-lock {
  width: 14px; height: 14px; flex-shrink: 0; border-radius: 50%;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'%3E%3Crect x='3.5' y='6.5' width='7' height='5.5' rx='1' stroke='rgba(255,255,255,0.2)' stroke-width='1' fill='none'/%3E%3Cpath d='M4.5 6.5V5a2.5 2.5 0 015 0v1.5' stroke='rgba(255,255,255,0.2)' stroke-width='1' fill='none'/%3E%3C/svg%3E");
  background-size: contain;
}

.ap-btn-wrap { margin-top: clamp(16px, 2.5vh, 36px); animation: ap-fadeUp 0.7s ease both; }
.ap-col:nth-child(2) .ap-btn-wrap { animation-delay: 0.28s; }
.ap-col:nth-child(3) .ap-btn-wrap { animation-delay: 0.56s; }

.ap-btn {
  width: 100%; padding: 14px 24px; border-radius: 30px; border: none;
  font-family: 'Epilogue', sans-serif; font-size: 13.5px; font-weight: 500;
  letter-spacing: 0.3px; cursor: pointer; transition: all 0.3s ease;
  position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.ap-btn::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%);
  transform: translateX(-100%); transition: transform 0.5s ease;
}
.ap-btn:hover::after { transform: translateX(100%); }
.ap-btn-outline { background: transparent; color: rgba(226,221,211,0.65); border: 1px solid rgba(255,255,255,0.10); }
.ap-btn-outline:hover { border-color: rgba(168,224,64,0.35); background: rgba(168,224,64,0.06); color: #a8e040; }
.ap-btn-accent  { background: #a8e040; color: #071204; }
.ap-btn-accent:hover { background: #bff055; box-shadow: 0 10px 32px rgba(168,224,64,0.28); }
.ap-btn-gold    { background: transparent; color: rgba(201,168,76,0.5); border: 1px solid rgba(201,168,76,0.16); cursor: not-allowed; }

/* bouton retour */
.ap-back {
  position: fixed; top: 20px; left: 24px; z-index: 10;
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; letter-spacing: 0.06em;
  color: rgba(226,221,211,0.35); cursor: pointer;
  padding: 7px 14px; border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03);
  transition: all 0.2s;
}
.ap-back:hover { color: rgba(226,221,211,0.75); border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); }

/* branding bas */
.ap-brand {
  position: fixed; bottom: 26px; left: 50%; transform: translateX(-50%);
  z-index: 10; display: flex; align-items: center; gap: 10px;
  animation: ap-fadeUp 0.7s 0.5s ease both;
}
.ap-brand-name { font-family: 'Cormorant Garamond', serif; font-size: 13px; font-weight: 400; color: rgba(226,221,211,0.22); letter-spacing: 1px; }
.ap-brand-dot  { width: 3px; height: 3px; border-radius: 50%; background: rgba(168,224,64,0.35); }

/* Modal */
.ap-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: ap-fadeIn 0.3s ease;
}
.ap-modal {
  background: #0e1a0c; border: 1px solid rgba(255,255,255,0.09);
  border-radius: 20px; width: 100%; max-width: 420px;
  padding: 40px 36px 36px; position: relative;
  max-height: 92vh; overflow-y: auto;
  animation: ap-slideUp 0.38s cubic-bezier(0.34,1.56,0.64,1) both;
}
.ap-modal-close {
  position: absolute; top: 16px; right: 18px;
  width: 32px; height: 32px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.09); background: none;
  color: rgba(226,221,211,0.4); cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center; transition: all 0.25s;
}
.ap-modal-close:hover { border-color: rgba(168,224,64,0.35); color: #a8e040; background: rgba(168,224,64,0.06); }
.ap-modal-eyebrow { font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase; color: #a8e040; margin-bottom: 10px; }
.ap-modal-h2 {
  font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 300;
  color: #e2ddd3; margin-bottom: 6px; letter-spacing: -0.3px;
}
.ap-modal-sub { font-size: 13px; color: rgba(226,221,211,0.42); line-height: 1.6; margin-bottom: 28px; }

.ap-plans { display: flex; flex-direction: column; gap: 10px; margin-bottom: 26px; }
.ap-plan {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.07);
  cursor: pointer; transition: all 0.25s; position: relative; overflow: hidden;
}
.ap-plan:hover { border-color: rgba(168,224,64,0.25); background: rgba(168,224,64,0.04); }
.ap-plan.ap-sel { border-color: rgba(168,224,64,0.5); background: rgba(168,224,64,0.07); }
.ap-plan-popular {
  position: absolute; top: -1px; right: -1px;
  font-size: 9px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase;
  background: #a8e040; color: #071204; padding: 3px 9px; border-radius: 0 12px 0 8px;
}
.ap-plan-label { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 400; display: block; margin-bottom: 2px; color: #e2ddd3; }
.ap-plan-desc  { font-size: 11.5px; color: rgba(226,221,211,0.38); }
.ap-plan-price { font-size: 17px; font-weight: 500; color: #e2ddd3; display: block; text-align: right; }
.ap-plan-note  { font-size: 10.5px; color: rgba(226,221,211,0.38); text-align: right; }
.ap-plan-check-o {
  width: 20px; height: 20px; border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,0.15);
  margin-left: 12px; flex-shrink: 0; transition: all 0.25s;
  display: flex; align-items: center; justify-content: center;
}
.ap-plan.ap-sel .ap-plan-check-o { background: #a8e040; border-color: #a8e040; }
.ap-plan.ap-sel .ap-plan-check-o::after {
  content: ''; display: block; width: 9px; height: 9px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9'%3E%3Cpath d='M1.5 4.5l2 2 4-4' stroke='%23071204' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-size: contain; background-repeat: no-repeat; background-position: center;
}

.ap-modal-cta {
  width: 100%; padding: 14px; border-radius: 30px;
  font-family: 'Epilogue', sans-serif; font-size: 14px; font-weight: 500;
  border: none; background: #a8e040; color: #071204;
  cursor: pointer; transition: all 0.25s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  position: relative; overflow: hidden;
}
.ap-modal-cta::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
  transform: translateX(-100%); transition: transform 0.5s ease;
}
.ap-modal-cta:hover::after { transform: translateX(100%); }
.ap-modal-cta:hover { background: #bff055; box-shadow: 0 8px 28px rgba(168,224,64,0.25); }
.ap-modal-cta:disabled { opacity: 0.35; cursor: not-allowed; }
.ap-modal-note {
  font-size: 11px; color: rgba(226,221,211,0.28);
  text-align: center; margin-top: 12px;
  display: flex; align-items: center; justify-content: center; gap: 5px;
}

/* Toast */
.ap-toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  background: #0e1a0c; border: 1px solid rgba(168,224,64,0.28);
  border-radius: 30px; padding: 12px 22px;
  font-size: 13.5px; color: #e2ddd3;
  display: flex; align-items: center; gap: 10px;
  z-index: 9999; white-space: nowrap;
  box-shadow: 0 16px 48px rgba(0,0,0,0.5);
  animation: ap-toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
}

@keyframes ap-fadeUp  { from { opacity:0; transform:translateY(22px) } to { opacity:1; transform:translateY(0) } }
@keyframes ap-fadeIn  { from { opacity:0 } to { opacity:1 } }
@keyframes ap-slideUp { from { opacity:0; transform:scale(0.93) translateY(18px) } to { opacity:1; transform:scale(1) translateY(0) } }
@keyframes ap-toastIn { from { opacity:0; transform:translateX(-50%) translateY(14px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }

@media (max-width: 768px) {
  .ap-root { grid-template-columns: 1fr; height: auto; min-height: 100vh; overflow-y: auto; }
  .ap-col  { padding: 36px 28px 48px; height: auto; overflow: visible; }
  .ap-root::before { display: none; }
}
`

const PLANS = [
  { id: '1m',  label: '1 mois',  desc: 'Sans engagement',            price: '5,00 €',  note: '/ mois',   popular: false },
  { id: '3m',  label: '3 mois',  desc: 'Économisez 17 %',            price: '12,00 €', note: '/ 3 mois', popular: false },
  { id: '6m',  label: '6 mois',  desc: '3,00 € / mois · -40 %',     price: '18,00 €', note: '/ 6 mois', popular: true  },
  { id: '12m', label: '12 mois', desc: '2,50 € / mois · -50 %',     price: '30,00 €', note: '/ an',     popular: false },
]

function FleurLogoTiny() {
  return (
    <svg width="16" height="16" viewBox="0 0 52 52" fill="none">
      {[0,60,120,180,240,300].map((deg,i) => (
        <ellipse key={deg} cx="26" cy="14" rx="5" ry="11"
          fill={i<3 ? 'rgba(168,224,64,0.15)' : 'rgba(168,224,64,0.07)'}
          stroke={i<3 ? '#a8e040' : 'rgba(168,224,64,0.35)'} strokeWidth="1"
          transform={deg ? `rotate(${deg} 26 26)` : undefined}
        />
      ))}
      <circle cx="26" cy="26" r="5" fill="#a8e040"/>
      <line x1="26" y1="31" x2="26" y2="46" stroke="#a8e040" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

export default function AccessPage({ onActivateFree, onSuccess, onBack }) {
  const [modalOpen,    setModalOpen]    = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paying,       setPaying]       = useState(false)
  const [toast,        setToast]        = useState(null)
  const toastTimer = useRef(null)

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') setModalOpen(false) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  const showToast = (icon, msg) => {
    clearTimeout(toastTimer.current)
    setToast({ icon, msg })
    toastTimer.current = setTimeout(() => setToast(null), 3400)
  }

  const handleFree = async () => {
    showToast('🌱', 'Accès Ma Fleur activé !')
    onActivateFree?.()
  }

  const handlePay = async () => {
    if (!selectedPlan) return
    setPaying(true)
    try {
      // const { data: { session } } = await supabase.auth.getSession()
      // Stripe checkout call here...
      await new Promise(r => setTimeout(r, 1200))
      setModalOpen(false)
      setSelectedPlan(null)
      showToast('✨', `Abonnement ${selectedPlan.label} activé !`)
      onSuccess?.({ plan: selectedPlan })
    } catch {
      showToast('⚠️', 'Une erreur est survenue.')
    } finally {
      setPaying(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      {onBack && (
        <div className="ap-back" onClick={onBack}>
          ← Retour au jardin
        </div>
      )}
      <div className="ap-root">
        <div className="ap-bg"/>

        {/* ── COL 1 : GRATUIT ── */}
        <div className="ap-col ap-col-free">
          <div className="ap-tag ap-tag-free">✦ Gratuit</div>
          <span className="ap-icon">🌱</span>
          <h2 className="ap-col-h2">Ma Fleur</h2>
          <p className="ap-col-desc">Votre espace personnel pour observer, nourrir et faire grandir votre fleur intérieure au quotidien.</p>
          <ul className="ap-features">
            <li><span className="ap-check"/><span>Suivi personnel quotidien</span></li>
            <li><span className="ap-check"/><span>Tableau de bord d'évolution</span></li>
            <li><span className="ap-check"/><span>Bilan hebdomadaire</span></li>
            <li><span className="ap-check"/><span>Journal de croissance</span></li>
            <li className="ap-locked"><span className="ap-check-lock"/><span>Cercles communautaires</span></li>
            <li className="ap-locked"><span className="ap-check-lock"/><span>Ateliers collectifs</span></li>
          </ul>
          <div className="ap-btn-wrap">
            <button className="ap-btn ap-btn-outline" onClick={handleFree}>Activer gratuitement</button>
          </div>
        </div>

        {/* ── COL 2 : PREMIUM ── */}
        <div className="ap-col ap-col-prem">
          <div className="ap-accent-line"/>
          <div className="ap-tag ap-tag-prem">✦ Premium</div>
          <span className="ap-icon">🌸</span>
          <h2 className="ap-col-h2">Communauté<br/>& Espaces</h2>
          <p className="ap-col-desc">Accédez aux espaces vivants, aux cercles d'échange et aux ateliers guidés de la communauté.</p>
          <ul className="ap-features">
            <li><span className="ap-check"/><span>Tout l'espace Ma Fleur</span></li>
            <li><span className="ap-check"/><span>Espaces communautaires</span></li>
            <li><span className="ap-check"/><span>Cercles d'échange actifs</span></li>
            <li><span className="ap-check"/><span>Contenus exclusifs guidés</span></li>
            <li><span className="ap-check"/><span>Ateliers & accompagnements</span></li>
            <li><span className="ap-check"/><span>Accès prioritaire nouveautés</span></li>
          </ul>
          <div className="ap-btn-wrap">
            <button className="ap-btn ap-btn-accent" onClick={() => { setModalOpen(true); setSelectedPlan(null) }}>
              Choisir un abonnement →
            </button>
          </div>
        </div>

        {/* ── COL 3 : ENTREPRISE ── */}
        <div className="ap-col ap-col-ent">
          <div className="ap-tag ap-tag-ent">✦ Entreprise</div>
          <span className="ap-soon">Bientôt disponible</span>
          <span className="ap-icon">🌳</span>
          <h2 className="ap-col-h2">Affiliation<br/>& Groupes</h2>
          <p className="ap-col-desc">Un espace dédié aux organisations, facilitateurs et programmes collectifs sur mesure.</p>
          <ul className="ap-features">
            <li><span className="ap-check-gold"/><span>Gestion multi-utilisateurs</span></li>
            <li><span className="ap-check-gold"/><span>Tableau de bord équipe</span></li>
            <li><span className="ap-check-gold"/><span>Ateliers privatisés</span></li>
            <li><span className="ap-check-gold"/><span>API & intégrations</span></li>
            <li><span className="ap-check-gold"/><span>Accompagnement dédié</span></li>
            <li><span className="ap-check-gold"/><span>Facturation personnalisée</span></li>
          </ul>
          <div className="ap-btn-wrap">
            <button className="ap-btn ap-btn-gold" disabled>Rejoindre la liste d'attente</button>
          </div>
        </div>

        {/* ── Branding bas ── */}
        <div className="ap-brand">
          <FleurLogoTiny/>
          <span className="ap-brand-dot"/>
          <span className="ap-brand-name">Fleur Intérieure</span>
          <span className="ap-brand-dot"/>
          <span className="ap-brand-name" style={{fontSize:'11px', opacity:0.6}}>Paiement sécurisé · Sans engagement</span>
        </div>
      </div>

      {/* ── MODAL ── */}
      {modalOpen && (
        <div className="ap-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="ap-modal">
            <button className="ap-modal-close" onClick={() => setModalOpen(false)}>✕</button>
            <p className="ap-modal-eyebrow">Communauté & Espaces</p>
            <h2 className="ap-modal-h2">Votre abonnement</h2>
            <p className="ap-modal-sub">Choisissez la durée qui vous correspond. Résiliable à tout moment.</p>
            <div className="ap-plans">
              {PLANS.map(p => (
                <div key={p.id}
                  className={`ap-plan${selectedPlan?.id === p.id ? ' ap-sel' : ''}`}
                  onClick={() => setSelectedPlan(p)}
                >
                  {p.popular && <div className="ap-plan-popular">Populaire</div>}
                  <div>
                    <span className="ap-plan-label">{p.label}</span>
                    <span className="ap-plan-desc">{p.desc}</span>
                  </div>
                  <div>
                    <span className="ap-plan-price">{p.price}</span>
                    <span className="ap-plan-note">{p.note}</span>
                  </div>
                  <div className="ap-plan-check-o"/>
                </div>
              ))}
            </div>
            <button className="ap-modal-cta" onClick={handlePay} disabled={!selectedPlan || paying}>
              <span>{paying ? 'Redirection…' : selectedPlan ? `Continuer · ${selectedPlan.price}` : 'Sélectionnez une formule'}</span>
              {!paying && selectedPlan && <span>→</span>}
            </button>
            <p className="ap-modal-note"><span>🔒</span><span>Paiement sécurisé via Stripe</span></p>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="ap-toast">
          <span>{toast.icon}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </>
  )
}
