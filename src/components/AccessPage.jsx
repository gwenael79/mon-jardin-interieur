import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../core/supabaseClient'
import { PRODUCTS, DUR_LABELS, DUR_DAYS } from '../hooks/useSubscription'

/* ══════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

:root {
  --bg:           #09100a;
  --surface:      #111a0f;
  --surface-2:    #162014;
  --accent:       #9ddc3e;
  --accent-dim:   rgba(157,220,62,0.12);
  --accent-glow:  rgba(157,220,62,0.25);
  --gold:         #c9a84c;
  --text:         #ddd8cc;
  --text-muted:   rgba(221,216,204,0.55);
  --border:       rgba(255,255,255,0.07);
  --border-hover: rgba(157,220,62,0.4);
  --radius:       18px;
  --radius-sm:    10px;
  --tr:           0.35s cubic-bezier(0.4,0,0.2,1);
}

.ap-root {
  font-family: 'DM Sans', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px 60px;
  overflow-x: hidden;
  position: relative;
}

.ap-root::before {
  content: '';
  position: fixed; inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 20% 10%, rgba(80,140,20,0.10) 0%, transparent 60%),
    radial-gradient(ellipse 50% 60% at 80% 90%, rgba(50,100,10,0.08) 0%, transparent 60%);
  pointer-events: none; z-index: 0;
}

/* ── Header ── */
.ap-header {
  width: 100%; max-width: 900px;
  padding: 48px 0 0;
  text-align: center;
  position: relative; z-index: 1;
  animation: ap-fadeUp 0.7s ease both;
}

.ap-logo {
  width: 52px; height: 52px;
  margin: 0 auto 20px;
  filter: drop-shadow(0 0 12px var(--accent-glow));
}

.ap-eyebrow {
  font-weight: 300; font-size: 11px;
  letter-spacing: 3.5px; text-transform: uppercase;
  color: var(--accent); margin-bottom: 14px; opacity: 0.85;
}

.ap-h1 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(30px, 5vw, 46px);
  font-weight: 400; line-height: 1.2;
  letter-spacing: -0.5px; color: var(--text);
  margin-bottom: 14px;
}

.ap-h1 em { font-style: italic; color: var(--accent); }

.ap-subtitle {
  font-size: 14px; color: var(--text-muted);
  max-width: 420px; margin: 0 auto 50px;
  line-height: 1.7;
}

/* ── Cards ── */
.ap-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px; max-width: 900px; width: 100%;
  position: relative; z-index: 1;
}

.ap-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 36px 32px 32px;
  cursor: pointer; position: relative;
  overflow: hidden;
  transition: transform var(--tr), border-color var(--tr), box-shadow var(--tr);
  animation: ap-fadeUp 0.7s ease both;
}
.ap-card:nth-child(2) { animation-delay: 0.1s; }
.ap-card:nth-child(3) { animation-delay: 0.2s; }

.ap-card::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, var(--accent-dim), transparent 70%);
  opacity: 0; transition: opacity var(--tr);
}
.ap-card:hover { transform: translateY(-8px); border-color: var(--border-hover); box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px var(--accent-dim); }
.ap-card:hover::before { opacity: 1; }
.ap-card.ap-disabled { opacity: 0.75; pointer-events: none; }

.ap-card-line {
  position: absolute; top: 0; left: 32px; right: 32px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0; transition: opacity var(--tr);
}
.ap-card:hover .ap-card-line { opacity: 1; }

.ap-badge {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 500;
  letter-spacing: 1.5px; text-transform: uppercase;
  padding: 5px 12px; border-radius: 30px; margin-bottom: 22px;
}
.ap-badge-free     { background: rgba(255,255,255,0.06); color: var(--text-muted); border: 1px solid var(--border); }
.ap-badge-premium  { background: var(--accent-dim); color: var(--accent); border: 1px solid rgba(157,220,62,0.25); }
.ap-badge-ent      { background: rgba(201,168,76,0.10); color: var(--gold); border: 1px solid rgba(201,168,76,0.25); }

.ap-card-icon { font-size: 32px; margin-bottom: 16px; display: block; }

.ap-card-h2 {
  font-family: 'Playfair Display', serif;
  font-size: 26px; font-weight: 600;
  margin-bottom: 12px; letter-spacing: -0.3px;
}

.ap-card-p {
  font-size: 13.5px; color: var(--text-muted);
  line-height: 1.75; margin-bottom: 24px;
}

.ap-features { list-style: none; margin-bottom: 28px; }
.ap-features li {
  font-size: 13px; color: var(--text-muted);
  padding: 7px 0; display: flex; align-items: center; gap: 10px;
  border-bottom: 1px solid var(--border);
}
.ap-features li:last-child { border-bottom: none; }
.ap-features li::before {
  content: '';
  display: inline-block; width: 16px; height: 16px;
  background: var(--accent-dim);
  border: 1px solid var(--border-hover);
  border-radius: 50%; flex-shrink: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3 8l3.5 3.5L13 5' stroke='%239ddc3e' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-size: contain;
}
.ap-features li.ap-locked { opacity: 0.45; }
.ap-features li.ap-locked::before {
  background: rgba(255,255,255,0.05); border-color: var(--border);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect x='4' y='7' width='8' height='7' rx='1.5' stroke='%23ffffff40' stroke-width='1.2' fill='none'/%3E%3Cpath d='M5.5 7V5a2.5 2.5 0 015 0v2' stroke='%23ffffff40' stroke-width='1.2' fill='none'/%3E%3C/svg%3E");
  background-size: contain;
}

.ap-coming-soon {
  position: absolute; top: 16px; right: 16px;
  font-size: 10px; font-weight: 500;
  letter-spacing: 1px; text-transform: uppercase;
  color: var(--gold);
  background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.2);
  padding: 3px 9px; border-radius: 20px;
}

/* ── Buttons ── */
.ap-btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 8px; width: 100%; padding: 13px 24px;
  border: none; border-radius: 30px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all var(--tr);
  position: relative; overflow: hidden; letter-spacing: 0.3px;
}
.ap-btn::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%);
  transform: translateX(-100%); transition: transform 0.5s ease;
}
.ap-btn:hover::after { transform: translateX(100%); }

.ap-btn-accent { background: var(--accent); color: #0e1a04; }
.ap-btn-accent:hover { background: #b0ef47; box-shadow: 0 8px 24px var(--accent-glow); }

.ap-btn-outline { background: transparent; color: var(--text); border: 1px solid var(--border); }
.ap-btn-outline:hover { border-color: var(--border-hover); background: var(--accent-dim); color: var(--accent); }

.ap-btn-gold { background: transparent; color: var(--gold); border: 1px solid rgba(201,168,76,0.3); }
.ap-btn-gold:hover { background: rgba(201,168,76,0.10); box-shadow: 0 8px 24px rgba(201,168,76,0.15); }
.ap-btn-gold:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Footer ── */
.ap-footer {
  position: relative; z-index: 1;
  margin-top: 40px; text-align: center;
  font-size: 12px; color: var(--text-muted);
  animation: ap-fadeUp 0.7s 0.3s ease both;
}
.ap-footer a { color: var(--accent); text-decoration: none; opacity: 0.8; }

/* ── Modal overlay ── */
.ap-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex; justify-content: center; align-items: center;
  padding: 20px; z-index: 100;
  animation: ap-fadeIn 0.3s ease both;
}

.ap-modal {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  width: 100%; max-width: 440px;
  padding: 40px 36px 36px;
  position: relative;
  max-height: 92vh; overflow-y: auto;
  animation: ap-slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
}

.ap-modal-close {
  position: absolute; top: 16px; right: 18px;
  width: 32px; height: 32px;
  border: 1px solid var(--border); border-radius: 50%;
  background: transparent; color: var(--text-muted);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 15px; transition: all var(--tr);
}
.ap-modal-close:hover { border-color: var(--border-hover); color: var(--text); background: var(--accent-dim); }

.ap-modal-eyebrow {
  font-size: 11px; letter-spacing: 2.5px;
  text-transform: uppercase; color: var(--accent); margin-bottom: 10px;
}

.ap-modal-h2 {
  font-family: 'Playfair Display', serif;
  font-size: 26px; font-weight: 400; margin-bottom: 6px;
}

.ap-modal-sub {
  font-size: 13px; color: var(--text-muted);
  margin-bottom: 28px; line-height: 1.6;
}

/* ── Plans ── */
.ap-plans { display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }

.ap-plan {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  cursor: pointer; transition: all var(--tr);
  position: relative; overflow: hidden;
}
.ap-plan::before {
  content: ''; position: absolute; inset: 0;
  background: var(--accent-dim); opacity: 0; transition: opacity var(--tr);
}
.ap-plan:hover { border-color: var(--border-hover); }
.ap-plan:hover::before { opacity: 1; }

.ap-plan.ap-selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent-dim), inset 0 0 0 9999px var(--accent-dim);
}
.ap-plan.ap-selected::before { opacity: 1; }

.ap-plan-left  { position: relative; z-index: 1; }
.ap-plan-right { display: flex; flex-direction: column; align-items: flex-end; position: relative; z-index: 1; }

.ap-plan-duration {
  font-family: 'Playfair Display', serif;
  font-size: 17px; display: block; margin-bottom: 3px;
}
.ap-plan-desc  { font-size: 12px; color: var(--text-muted); }
.ap-plan-price { font-size: 18px; font-weight: 500; color: var(--text); }
.ap-plan-note  { font-size: 11px; color: var(--text-muted); }

.ap-plan-tag {
  position: absolute; top: -1px; right: -1px;
  font-size: 10px; font-weight: 500; letter-spacing: 0.8px; text-transform: uppercase;
  background: var(--accent); color: #0e1a04;
  padding: 3px 9px; border-radius: 0 var(--radius-sm) 0 var(--radius-sm);
}

.ap-plan-check {
  width: 22px; height: 22px;
  border: 1.5px solid var(--border); border-radius: 50%;
  position: relative; z-index: 1; flex-shrink: 0;
  transition: all var(--tr); margin-left: 14px;
  display: flex; align-items: center; justify-content: center;
}
.ap-plan.ap-selected .ap-plan-check {
  background: var(--accent); border-color: var(--accent);
}
.ap-plan.ap-selected .ap-plan-check::after {
  content: '';
  display: block; width: 10px; height: 10px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M1.5 5l2.5 2.5 4.5-4' stroke='%230e1a04' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-size: contain; background-repeat: no-repeat; background-position: center;
}

/* ── Modal CTA ── */
.ap-modal-cta {
  width: 100%; padding: 15px; border-radius: 30px;
  font-size: 15px; font-weight: 500; border: none;
  background: var(--accent); color: #0e1a04;
  cursor: pointer; transition: all var(--tr);
  font-family: 'DM Sans', sans-serif;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  position: relative; overflow: hidden;
}
.ap-modal-cta::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
  transform: translateX(-100%); transition: transform 0.5s ease;
}
.ap-modal-cta:hover::after { transform: translateX(100%); }
.ap-modal-cta:hover { background: #b0ef47; box-shadow: 0 10px 30px var(--accent-glow); }
.ap-modal-cta:disabled { opacity: 0.4; cursor: not-allowed; }

.ap-modal-note {
  font-size: 11.5px; color: var(--text-muted);
  text-align: center; margin-top: 14px;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}

/* ── Toast ── */
.ap-toast {
  position: fixed; bottom: 30px; left: 50%;
  transform: translateX(-50%);
  background: var(--surface-2); border: 1px solid var(--border-hover);
  border-radius: 30px; padding: 13px 22px;
  font-size: 14px; color: var(--text);
  display: flex; align-items: center; gap: 10px;
  z-index: 9999; white-space: nowrap;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: ap-toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
}

/* ── Animations ── */
@keyframes ap-fadeUp  { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }
@keyframes ap-fadeIn  { from { opacity:0 } to { opacity:1 } }
@keyframes ap-slideUp { from { opacity:0; transform:scale(0.93) translateY(20px) } to { opacity:1; transform:scale(1) translateY(0) } }
@keyframes ap-toastIn { from { opacity:0; transform:translateX(-50%) translateY(16px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }

@media (max-width: 500px) {
  .ap-modal { padding: 30px 22px 24px; }
  .ap-plan-price { font-size: 15px; }
  .ap-cards { gap: 16px; }
  .ap-card { padding: 28px 22px 24px; }
}
`

/* ── Données plans ── */
const PLANS = [
  { id: 'plan_1m',  label: '1 mois',   desc: 'Accès complet, sans engagement',      price: '9,90 €',  note: '/ mois',    popular: false },
  { id: 'plan_3m',  label: '3 mois',   desc: 'Économisez 10 % sur le mensuel',      price: '26,70 €', note: '/ 3 mois',  popular: false },
  { id: 'plan_6m',  label: '6 mois',   desc: 'La formule la plus populaire',        price: '47,40 €', note: '/ 6 mois',  popular: true  },
  { id: 'plan_12m', label: '12 mois',  desc: 'Meilleure valeur · 2 mois offerts',   price: '83,88 €', note: '/ an',      popular: false },
]

/* ── Logo SVG ── */
function FleurLogo() {
  return (
    <svg className="ap-logo" viewBox="0 0 52 52" fill="none">
      <ellipse cx="26" cy="14" rx="5" ry="11" fill="rgba(157,220,62,0.18)" stroke="#9ddc3e" strokeWidth="1"/>
      <ellipse cx="26" cy="14" rx="5" ry="11" fill="rgba(157,220,62,0.18)" stroke="#9ddc3e" strokeWidth="1" transform="rotate(60 26 26)"/>
      <ellipse cx="26" cy="14" rx="5" ry="11" fill="rgba(157,220,62,0.18)" stroke="#9ddc3e" strokeWidth="1" transform="rotate(120 26 26)"/>
      <ellipse cx="26" cy="14" rx="5" ry="11" fill="rgba(157,220,62,0.12)" stroke="rgba(157,220,62,0.5)" strokeWidth="1" transform="rotate(180 26 26)"/>
      <ellipse cx="26" cy="14" rx="5" ry="11" fill="rgba(157,220,62,0.12)" stroke="rgba(157,220,62,0.5)" strokeWidth="1" transform="rotate(240 26 26)"/>
      <ellipse cx="26" cy="14" rx="5" ry="11" fill="rgba(157,220,62,0.12)" stroke="rgba(157,220,62,0.5)" strokeWidth="1" transform="rotate(300 26 26)"/>
      <circle cx="26" cy="26" r="5" fill="#9ddc3e"/>
      <line x1="26" y1="31" x2="26" y2="46" stroke="#9ddc3e" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="26" y1="40" x2="21" y2="36" stroke="#9ddc3e" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function AccessPage({ onActivateFree, onSuccess }) {
  const [modalOpen,    setModalOpen]    = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paying,       setPaying]       = useState(false)
  const [toast,        setToast]        = useState(null)
  const toastTimer = useRef(null)

  // Fermer sur Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const showToast = (icon, msg) => {
    clearTimeout(toastTimer.current)
    setToast({ icon, msg })
    toastTimer.current = setTimeout(() => setToast(null), 3400)
  }

  const openModal  = () => { setModalOpen(true); setSelectedPlan(null) }
  const closeModal = () => { setModalOpen(false); setSelectedPlan(null); setPaying(false) }

  const handleFree = async () => {
    showToast('🌱', 'Votre accès Ma Fleur est activé !')
    onActivateFree?.()
  }

  const handlePay = async () => {
    if (!selectedPlan) return
    setPaying(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      // const token = session?.access_token
      // const res = await fetch('/api/create-checkout-session', { ... })
      // const { sessionUrl } = await res.json()
      // window.location.href = sessionUrl

      // ── Simulation ──
      await new Promise(r => setTimeout(r, 1200))
      closeModal()
      showToast('✨', `Abonnement sélectionné : ${selectedPlan.label}`)
      onSuccess?.({ plan: selectedPlan })
    } catch {
      showToast('⚠️', 'Une erreur est survenue. Réessayez.')
    } finally {
      setPaying(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="ap-root">

        {/* HEADER */}
        <header className="ap-header">
          <FleurLogo/>
          <p className="ap-eyebrow">Fleur Intérieure</p>
          <h1 className="ap-h1">Choisissez votre <em>chemin</em></h1>
          <p className="ap-subtitle">
            Commencez gratuitement ou rejoignez la communauté — chaque espace est conçu pour votre épanouissement.
          </p>
        </header>

        {/* CARDS */}
        <div className="ap-cards">

          {/* FREE */}
          <div className="ap-card" onClick={handleFree}>
            <div className="ap-card-line"/>
            <div className="ap-badge ap-badge-free">✦ Gratuit</div>
            <span className="ap-card-icon">🌱</span>
            <h2 className="ap-card-h2">Ma Fleur</h2>
            <p className="ap-card-p">Votre espace personnel pour observer, nourrir et faire grandir votre fleur intérieure au quotidien.</p>
            <ul className="ap-features">
              <li>Suivi personnel quotidien</li>
              <li>Tableau de bord d'évolution</li>
              <li>Bilan hebdomadaire</li>
              <li>Journal de croissance</li>
              <li className="ap-locked">Cercles communautaires</li>
              <li className="ap-locked">Ateliers collectifs</li>
            </ul>
            <button className="ap-btn ap-btn-outline">Activer gratuitement</button>
          </div>

          {/* PREMIUM */}
          <div className="ap-card" onClick={openModal}>
            <div className="ap-card-line"/>
            <div className="ap-badge ap-badge-premium">✦ Premium</div>
            <span className="ap-card-icon">🌸</span>
            <h2 className="ap-card-h2">Communauté & Espaces</h2>
            <p className="ap-card-p">Accédez aux espaces vivants de la communauté, aux cercles d'échange et aux ateliers guidés.</p>
            <ul className="ap-features">
              <li>Tout l'espace Ma Fleur</li>
              <li>Espaces communautaires</li>
              <li>Cercles d'échange actifs</li>
              <li>Contenus exclusifs guidés</li>
              <li>Ateliers & accompagnements</li>
              <li>Accès prioritaire aux nouveautés</li>
            </ul>
            <button className="ap-btn ap-btn-accent">Choisir un abonnement</button>
          </div>

          {/* ENTERPRISE */}
          <div className="ap-card ap-disabled">
            <div className="ap-card-line"/>
            <span className="ap-coming-soon">Bientôt</span>
            <div className="ap-badge ap-badge-ent">✦ Entreprise</div>
            <span className="ap-card-icon">🌳</span>
            <h2 className="ap-card-h2">Affiliation & Groupes</h2>
            <p className="ap-card-p">Un espace dédié aux organisations, facilitateurs et programmes collectifs sur mesure.</p>
            <ul className="ap-features">
              <li>Gestion multi-utilisateurs</li>
              <li>Tableau de bord équipe</li>
              <li>Ateliers privatisés</li>
              <li>API & intégrations</li>
              <li>Accompagnement dédié</li>
              <li>Facturation personnalisée</li>
            </ul>
            <button className="ap-btn ap-btn-gold" disabled>Rejoindre la liste d'attente</button>
          </div>

        </div>

        {/* FOOTER */}
        <p className="ap-footer">
          Paiement sécurisé · Sans engagement sur la formule mensuelle · <a href="#">Politique de confidentialité</a>
        </p>

        {/* TOAST */}
        {toast && (
          <div className="ap-toast">
            <span>{toast.icon}</span>
            <span>{toast.msg}</span>
          </div>
        )}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="ap-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="ap-modal" role="dialog" aria-modal="true">
            <button className="ap-modal-close" onClick={closeModal} aria-label="Fermer">✕</button>
            <p className="ap-modal-eyebrow">Communauté & Espaces</p>
            <h2 className="ap-modal-h2">Votre abonnement</h2>
            <p className="ap-modal-sub">Choisissez la durée qui vous correspond. Résiliable à tout moment depuis votre profil.</p>

            <div className="ap-plans">
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  className={`ap-plan${selectedPlan?.id === plan.id ? ' ap-selected' : ''}`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {plan.popular && <div className="ap-plan-tag">Populaire</div>}
                  <div className="ap-plan-left">
                    <span className="ap-plan-duration">{plan.label}</span>
                    <span className="ap-plan-desc">{plan.desc}</span>
                  </div>
                  <div className="ap-plan-right">
                    <span className="ap-plan-price">{plan.price}</span>
                    <span className="ap-plan-note">{plan.note}</span>
                  </div>
                  <div className="ap-plan-check"/>
                </div>
              ))}
            </div>

            <button
              className="ap-modal-cta"
              onClick={handlePay}
              disabled={!selectedPlan || paying}
            >
              <span>{paying ? 'Redirection…' : selectedPlan ? `Continuer avec ${selectedPlan.label}` : 'Sélectionnez une formule'}</span>
              {!paying && <span>→</span>}
            </button>

            <p className="ap-modal-note">
              <span>🔒</span>
              <span>Paiement sécurisé via Stripe · Aucun engagement</span>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
