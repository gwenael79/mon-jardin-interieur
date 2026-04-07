// src/pages/EndOfWeekScreen.jsx
// ─────────────────────────────────────────────────────────────────────────────
//  Écran de transition à la fin des 7 jours du WeekOneFlow.
//  Affiché une seule fois, présente 3 cartes :
//    1. Mois premium offert (si quiz complété)
//    2. Version gratuite (par défaut, rien à faire)
//    3. Abonnement premium (pour tout débloquer)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { supabase } from '../core/supabaseClient'
import { PremiumModal } from './AccessPage'
import { useTheme } from '../hooks/useTheme'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');

@keyframes eow-in  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
@keyframes eow-glow{ 0%,100%{box-shadow:0 0 0 0 transparent} 50%{box-shadow:0 0 32px 8px rgba(200,160,48,0.18)} }

.eow-root {
  position: fixed; inset: 0; z-index: 200;
  background: linear-gradient(160deg, #f8f0ec, #ede5de);
  display: flex; flex-direction: column;
  align-items: center; justify-content: flex-start;
  overflow-y: auto; overflow-x: hidden;
  padding: 48px 20px 60px;
  font-family: 'Jost', sans-serif;
}

/* ── Header ── */
.eow-header {
  text-align: center;
  margin-bottom: 36px;
  animation: eow-in .7s cubic-bezier(.22,1,.36,1) both;
}
.eow-eyebrow {
  font-size: 10px; letter-spacing: .22em; text-transform: uppercase;
  color: rgba(30,20,8,.55); margin-bottom: 12px;
}
.eow-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(26px, 5vw, 38px); font-weight: 300;
  color: rgba(30,20,8,.92); line-height: 1.2; margin-bottom: 10px;
}
.eow-title em { font-style: italic; color: #7a4030; }
.eow-sub {
  font-size: 14px; font-weight: 300;
  color: rgba(30,20,8,.65); line-height: 1.7; max-width: 380px; margin: 0 auto;
}

/* ── Cards ── */
.eow-cards {
  display: flex; flex-direction: column;
  gap: 14px; width: 100%; max-width: 480px;
}

.eow-card {
  border-radius: 20px; padding: 24px 24px 22px;
  position: relative; overflow: hidden;
  transition: transform .2s ease, box-shadow .2s ease;
}
.eow-card:hover { transform: translateY(-2px); }

/* Card 1 — mois offert */
.eow-card-trial {
  background: linear-gradient(135deg, #fef9e8, #fdf0c0);
  border: 1.5px solid rgba(200,160,48,.40);
  box-shadow: 0 6px 28px rgba(200,160,48,.12);
  animation: eow-in .6s cubic-bezier(.22,1,.36,1) .05s both, eow-glow 3s ease-in-out 1.2s infinite;
}
/* Card 2 — gratuit */
.eow-card-free {
  background: rgba(255,255,255,.70);
  border: 1px solid rgba(0,0,0,.09);
  box-shadow: 0 4px 18px rgba(0,0,0,.06);
  animation: eow-in .6s cubic-bezier(.22,1,.36,1) .15s both;
}
/* Card 3 — premium */
.eow-card-prem {
  background: linear-gradient(135deg, #1a2f12, #243818);
  border: 1.5px solid rgba(122,170,80,.30);
  box-shadow: 0 8px 32px rgba(20,40,10,.25);
  animation: eow-in .6s cubic-bezier(.22,1,.36,1) .25s both;
}

.eow-card-badge {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 9px; letter-spacing: .18em; text-transform: uppercase; font-weight: 600;
  padding: 4px 12px; border-radius: 100px; margin-bottom: 14px;
}
.eow-badge-trial { background: rgba(200,144,10,.15); color: #c8900a; border: 1px solid rgba(200,144,10,.30); }
.eow-badge-free  { background: rgba(0,0,0,.07); color: rgba(26,18,8,.65); border: 1px solid rgba(0,0,0,.18); }
.eow-badge-prem  { background: rgba(122,200,64,.12); color: #8ad048; border: 1px solid rgba(122,200,64,.25); }

.eow-card-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(22px, 5vw, 28px); font-weight: 400; line-height: 1.2;
  margin-bottom: 10px;
}
.eow-card-trial .eow-card-title  { color: #1a1208; }
.eow-card-free  .eow-card-title  { color: #1a1208; }
.eow-card-prem  .eow-card-title  { color: #ffffff; }

.eow-card-body {
  font-size: 14px; font-weight: 300; line-height: 1.75; margin-bottom: 20px;
}
.eow-card-trial .eow-card-body  { color: rgba(26,18,8,.80); }
.eow-card-free  .eow-card-body  { color: rgba(26,18,8,.72); }
.eow-card-prem  .eow-card-body  { color: rgba(255,255,255,.80); }

.eow-features {
  list-style: none; margin: 0 0 20px; padding: 0;
  display: flex; flex-direction: column; gap: 7px;
}
.eow-features li {
  display: flex; align-items: center; gap: 9px;
  font-size: 13.5px; font-weight: 300;
}
.eow-card-trial .eow-features li  { color: rgba(26,18,8,.88); }
.eow-card-free  .eow-features li  { color: rgba(26,18,8,.80); }
.eow-card-prem  .eow-features li  { color: rgba(255,255,255,.90); }

.eow-check {
  width: 16px; height: 16px; flex-shrink: 0; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px;
}
.eow-check-gold  { background: rgba(200,144,10,.18); color: #c8900a; border: 1px solid rgba(200,144,10,.35); }
.eow-check-green { background: rgba(80,150,40,.14); color: #5a9a28; border: 1px solid rgba(80,150,40,.30); }
.eow-check-light { background: rgba(122,200,64,.12); color: #8ad048; border: 1px solid rgba(122,200,64,.28); }

.eow-btn {
  width: 100%; padding: 14px 20px; border-radius: 50px; border: none;
  font-family: 'Jost', sans-serif; font-size: 13.5px; font-weight: 500;
  letter-spacing: .05em; cursor: pointer;
  transition: transform .18s ease, opacity .18s ease;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.eow-btn:hover { transform: translateY(-1px); opacity: .92; }
.eow-btn:active { transform: none; }

.eow-btn-trial {
  background: linear-gradient(135deg, #e8b830, #c8900a);
  color: #fff;
  box-shadow: 0 6px 20px rgba(200,144,10,.38);
}
.eow-btn-free {
  background: rgba(0,0,0,.06);
  color: rgba(30,20,8,.65);
  border: 1px solid rgba(0,0,0,.12);
}
.eow-btn-prem {
  background: linear-gradient(135deg, #78c040, #4a8820);
  color: #fff;
  box-shadow: 0 6px 20px rgba(80,150,40,.35);
}

.eow-timer {
  font-size: 11px; color: rgba(60,40,10,.55);
  text-align: center; margin-top: 10px;
  font-style: italic;
}

.eow-note {
  font-size: 11px; color: rgba(30,20,8,.45);
  text-align: center; margin-top: 28px;
  font-style: italic; animation: eow-in .6s .4s both;
}

@media (min-width: 640px) {
  .eow-root { padding: 64px 32px 80px; }
}
`

function CheckGold()  { return <span className="eow-check eow-check-gold">✓</span>  }
function CheckGreen() { return <span className="eow-check eow-check-green">✓</span> }
function CheckLight() { return <span className="eow-check eow-check-light">✓</span> }

export function EndOfWeekScreen({ userId, onContinue }) {
  useTheme()
  const [hasTrial, setHasTrial]       = useState(false)
  const [showPremium, setShowPremium]  = useState(false)
  const [trialUntil, setTrialUntil]   = useState(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    supabase
      .from('profiles')
      .select('premium_trial_until, quiz_completed_at')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data?.premium_trial_until) {
          const until = new Date(data.premium_trial_until)
          if (until > new Date()) {
            setHasTrial(true)
            setTrialUntil(until)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  if (loading) return null

  // Calcul des jours restants du trial
  const daysLeft = trialUntil
    ? Math.ceil((trialUntil - new Date()) / (1000 * 60 * 60 * 24))
    : 0

  const handleFreePlan = () => onContinue('free')
  const handlePremium  = () => setShowPremium(true)

  if (showPremium) return (
    <PremiumModal
      onSuccess={() => { setShowPremium(false); onContinue('free') }}
      onClose={() => setShowPremium(false)}
    />
  )

  return (
    <>
      <style>{css}</style>
      <div className="eow-root">

        {/* ── Header ── */}
        <div className="eow-header">
          <div className="eow-eyebrow">7 jours ensemble</div>
          <h1 className="eow-title">
            Votre jardin a<br/><em>commencé à pousser.</em>
          </h1>
          <p className="eow-sub">
            Voici ce qui s'offre à vous maintenant. Prenez le temps de choisir ce qui vous correspond.
          </p>
        </div>

        {/* ── Cards ── */}
        <div className="eow-cards">

          {/* ── CARD 1 : Mois premium offert (si quiz complété) ── */}
          {hasTrial && (
            <div className="eow-card eow-card-trial">
              <div className="eow-card-badge eow-badge-trial">🎁 Cadeau · Déjà actif</div>
              <div className="eow-card-title">
                Votre mois Premium<br/>est offert — profitez-en.
              </div>
              <div className="eow-card-body">
                En répondant au questionnaire lors de votre découverte, vous avez débloqué un mois complet sans restriction. Tout est accessible, sans carte bancaire.
              </div>
              <ul className="eow-features">
                <li><CheckGold/>Tous les espaces et rituels débloqués</li>
                <li><CheckGold/>Club des jardiniers & jardin collectif</li>
                <li><CheckGold/>Jardinothèque — méditations, hypnoses, e-books</li>
                <li><CheckGold/>Défis communautaires complets</li>
                <li><CheckGold/>Aucune carte bancaire requise</li>
              </ul>
              <button className="eow-btn eow-btn-trial" onClick={handleFreePlan}>
                ✨ Entrer dans mon jardin
              </button>
              {daysLeft > 0 && (
                <div className="eow-timer">
                  Votre période Premium se termine dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}.
                </div>
              )}
            </div>
          )}

          {/* ── CARD 2 : Version gratuite ── */}
          <div className="eow-card eow-card-free">
            <div className="eow-card-badge eow-badge-free">🌱 Gratuit · Par défaut</div>
            <div className="eow-card-title">
              Continuez comme vous êtes.<br/>Vous n'avez rien à faire.
            </div>
            <div className="eow-card-body">
              Votre espace personnel reste actif. Votre fleur continue de pousser avec vous, chaque jour, à votre rythme.
            </div>
            <ul className="eow-features">
              <li><CheckGreen/>Suivi quotidien &amp; bilan personnel</li>
              <li><CheckGreen/>Votre fleur intérieure &amp; tableau de bord</li>
              <li><CheckGreen/>Rituels de base — racines &amp; souffle</li>
              <li><CheckGreen/>Journal de croissance personnel</li>
            </ul>
            <button className="eow-btn eow-btn-free" onClick={handleFreePlan}>
              Rester sur la version gratuite →
            </button>
          </div>

          {/* ── CARD 3 : Premium ── */}
          <div className="eow-card eow-card-prem">
            <div className="eow-card-badge eow-badge-prem">🌸 Premium · Tout débloquer</div>
            <div className="eow-card-title">
              Vivez l'expérience complète —<br/>sans aucune limite.
            </div>
            <div className="eow-card-body">
              Accédez à tous les espaces, toutes les interactions et toute la jardinothèque. Pour ceux qui veulent aller au bout de leur transformation.
            </div>
            <ul className="eow-features">
              <li><CheckLight/>Tout le plan gratuit inclus</li>
              <li><CheckLight/>Club des jardiniers &amp; jardin collectif</li>
              <li><CheckLight/>Défis communautaires — toutes les zones</li>
              <li><CheckLight/>Jardinothèque complète (audio, vidéo, e-books)</li>
              <li><CheckLight/>Ateliers guidés &amp; accompagnements</li>
              <li><CheckLight/>Accès prioritaire aux nouveautés</li>
            </ul>
            <button className="eow-btn eow-btn-prem" onClick={handlePremium}>
              Choisir Premium →
            </button>
          </div>

        </div>

        <p className="eow-note">
          Vous pouvez changer d'avis à tout moment depuis vos paramètres.
        </p>

      </div>
    </>
  )
}
