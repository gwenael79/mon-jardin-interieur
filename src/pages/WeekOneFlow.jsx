// src/pages/WeekOneFlow.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

// Cache module-level pour la personnalisation fraîche (survit aux remounts)
let _freshGardenSettings = null
import { supabase } from '../core/supabaseClient'
import { RitualZoneModal, useRituels, useRitualsState } from './mafleur_rituels'
import { useAuth } from '../hooks/useAuth'
import { PlantSVG, DEFAULT_GARDEN_SETTINGS } from '../components/PlantSVG'
import { GardenSettingsModal } from './ScreenMonJardin'
import { LutinCompagnon, LUTIN_MESSAGES_WEEK_ONE } from '../components/LutinCompagnon'
import RituelMieuxEtre from '../components/RituelMieuxEtre'
import { useAmbiance, ambianceAsset } from '../hooks/useAmbiance'

// ─────────────────────────────────────────────────────────────────────────────
// 1. Styles globaux — keyframes + responsive modal
// ─────────────────────────────────────────────────────────────────────────────

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

      @keyframes stepIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes softRise {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .wof-soft { animation: softRise 900ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
      .wveil-video {
        position: absolute; inset: 0;
        width: 100%; height: 100%;
        object-fit: cover;
      }
      @media (min-width: 768px) {
        .wveil-video {
          position: relative; inset: auto;
          width: auto; height: 100%;
          max-width: 480px; max-height: 100vh;
          object-fit: contain;
        }
      }
      @keyframes pulseCursor {
        0%, 100% { transform: scale(1);    opacity: 0.24; }
        50%       { transform: scale(1.55); opacity: 0.40; }
      }
      @keyframes fleurFloat {
        0%,100% { transform: translateY(0px)   rotate(0deg);    }
        40%     { transform: translateY(-8px)  rotate(1.5deg);  }
        70%     { transform: translateY(-4px)  rotate(-0.8deg); }
      }
      @keyframes bloom {
        from { opacity: 0; transform: scale(0.25) rotate(-25deg); }
        65%  { opacity: 1; transform: scale(1.08) rotate(3deg);   }
        to   { opacity: 1; transform: scale(1)    rotate(0deg);   }
      }
      @keyframes petalIn {
        from { opacity: 0; transform: scale(0.3); }
        to   { opacity: 1; transform: scale(1);   }
      }
      @keyframes breathe {
        0%, 100% { transform: scale(1);    opacity: 0.55; }
        50%       { transform: scale(1.55); opacity: 1;    }
      }

      @keyframes mosaicBloom {
        0%   { transform: scale(0.88); opacity: 0.6; filter: brightness(0.7); }
        55%  { transform: scale(1.05); opacity: 1;   filter: brightness(1.08); }
        100% { transform: scale(1);   opacity: 1;   filter: brightness(1); }
      }
      @keyframes mosaicPulse {
        0%, 100% { box-shadow: 0 0 0 0 transparent; }
        50%      { box-shadow: 0 0 32px 8px rgba(200,160,112,0.35); }
      }

      @keyframes timeBadgePulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(200,160,176,0.0); transform: scale(1); }
        50%      { box-shadow: 0 0 0 6px rgba(200,160,176,0.35); transform: scale(1.06); }
      }
      .time-badge-pulse { animation: timeBadgePulse 2s ease-in-out infinite; }

      @keyframes helpPanelIn {
        from { transform: translateY(100%); }
        to   { transform: translateY(0);    }
      }

      .wof-in { animation: stepIn 400ms ease both; }
      .wof-fl { animation: fleurFloat 6s ease-in-out infinite; }

      @keyframes ctaPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(168,96,124,0.55); transform: scale(1);    }
        50%      { box-shadow: 0 0 0 14px rgba(168,96,124,0); transform: scale(1.045); }
      }
      .wof-cta-pulse {
        animation: ctaPulse 1.4s ease-in-out infinite;
        will-change: transform, box-shadow;
      }
      .wof-cta-pulse:hover, .wof-cta-pulse:focus, .wof-cta-pulse:active {
        animation: none;
        transform: scale(1.03);
      }

      @keyframes particleFloat {
        0%   { transform: translateY(0)    scale(1);   opacity: 0; }
        15%  { opacity: 1; }
        85%  { opacity: 0.8; }
        100% { transform: translateY(-80px) scale(0.5); opacity: 0; }
      }
      @keyframes particleTwinkle {
        0%,100% { opacity: 0.2; transform: scale(0.8); }
        50%     { opacity: 1;   transform: scale(1.3); }
      }

      .wof-modal--garden {
        background: linear-gradient(160deg, #0d2818 0%, #0a1f12 50%, #071510 100%) !important;
        background-image: none !important;
      }
      .wof-modal--garden .garden-overlay {
        position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(ellipse at 50% 0%, rgba(50,140,70,0.15) 0%, transparent 65%);
        z-index: 0;
      }
      .wof-modal--garden > * { position: relative; z-index: 1; }

      .wof-modal--garden p,
      .wof-modal--garden span,
      .wof-modal--garden div { text-shadow: none; }
      .wof-modal--garden h2 {
        text-shadow: none;
        color: #d4f0d8 !important;
      }
      .wof-modal--garden .garden-day-card {
        background: rgba(255,255,255,0.07) !important;
        backdrop-filter: blur(12px) !important;
        border: 1px solid rgba(100,200,120,0.18) !important;
        color: #d4f0d8 !important;
      }
      .wof-modal--garden .garden-day-card * {
        color: #d4f0d8 !important;
        text-shadow: none !important;
      }
      .wof-modal--garden .garden-day-card .badge-accompli,
      .wof-modal--garden .garden-day-card .badge-accompli * {
        color: #0d2818 !important;
        text-shadow: none !important;
        -webkit-text-fill-color: #0d2818 !important;
      }

      .spark {
        position: absolute;
        width: 6px; height: 6px;
        border-radius: 50%;
        background: radial-gradient(circle, #ffe88a 0%, #ffb830 60%, transparent 100%);
        pointer-events: none;
        animation: particleTwinkle var(--dur, 2s) ease-in-out var(--delay, 0s) infinite,
                   particleFloat var(--fdur, 4s) ease-in-out var(--delay, 0s) infinite;
      }

      .wof-backdrop {
        position: fixed; inset: 0;
        display: flex; align-items: flex-start; justify-content: center;
        padding: 24px 16px;
        z-index: 10;
        overflow-y: auto;
      }
      .wof-modal {
        width: 100%;
        max-width: 560px;
        background: #faf5f2;
        border-radius: 24px;
        box-shadow: 0 24px 70px rgba(180,120,110,0.20);
        padding: 0;
        position: relative;
        min-height: 520px;
        height: calc(100dvh - 48px);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      @media (max-width: 600px) {
        .wof-backdrop { padding: 0; align-items: stretch; }
        .wof-modal    { border-radius: 0; min-height: 100dvh; min-height: 100vh; height: 100dvh; height: 100vh; }
      }

      /* ── Override RitualZoneModal — centré au lieu de bottom-sheet ── */
      .ritual-modal-backdrop {
        position: fixed !important;
        inset: 0 !important;
        z-index: 1000 !important;
        display: flex !important;
        align-items: flex-start !important;
        justify-content: center !important;
        padding: 24px 16px 40px !important;
        background: rgba(80,40,30,0.35) !important;
        backdrop-filter: blur(6px) !important;
        overflow-y: auto !important;
      }
      .ritual-modal-sheet {
        position: relative !important;
        inset: auto !important;
        bottom: auto !important;
        transform: none !important;
        width: 100% !important;
        max-width: 500px !important;
        height: auto !important;
        max-height: none !important;
        overflow-y: visible !important;
        border-radius: 22px !important;
        padding: 24px 20px 32px !important;
        box-shadow: 0 24px 60px rgba(80,30,20,0.18) !important;
        animation: stepIn 0.3s ease both !important;
        flex-shrink: 0 !important;
      }
      @keyframes growDown {
        from { transform: scaleY(0); opacity: 0; }
        to   { transform: scaleY(1); opacity: 1;  }
      }
      @keyframes seedPulse {
        0%, 100% { opacity: 0.18; }
        50%       { opacity: 0.40; }
      }
      @keyframes wofSlideUp {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0);    }
      }
      @keyframes radioWave {
        0%   { transform: scale(1);   opacity: 0.55; }
        100% { transform: scale(3.2); opacity: 0;    }
      }
      @keyframes wofSpkFade {
        0%   { opacity: 0; }
        15%  { opacity: 1; }
        70%  { opacity: 0.8; }
        100% { opacity: 0; }
      }

      /* ── Frise de progression du parcours (DiscoveryProgressBar) ── */
      .dpb-bar {
        flex-shrink: 0;
        background: #faf5f2;
        border-bottom: 1px solid rgba(200,160,176,.20);
        padding: 8px 14px 7px;
      }
      .dpb-track {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 6px 5px;
      }
      .dpb-edge {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 5px;
        flex-shrink: 0;
      }
      .dpb-edge-label {
        font-family: 'Jost', sans-serif;
        font-size: 10.5px;
        letter-spacing: .02em;
        color: #1a1208;
        white-space: nowrap;
      }
      .dpb-edge-label.app { color: #1a1208; }
      .dpb-caption {
        text-align: center;
        font-family: 'Cormorant Garamond', serif;
        font-style: italic;
        font-size: 18px;
        color: #000;
        margin-top: 4px;
      }
      .dpb-caption-sub {
        font-size: 12px;
        margin-left: 6px;
      }
      @media (max-width: 480px) {
        .dpb-bar { padding: 6px 8px 5px; }
        .dpb-track { gap: 4px 3px; }
        .dpb-edge-label { display: none; }
        .dpb-arrow { font-size: 10px; }
        .dpb-dot { width: 14px; height: 14px; font-size: 8px; }
        .dpb-day { width: 22px; height: 22px; font-size: 8px; }
        .dpb-day.current { width: 28px; height: 28px; font-size: 9px; }
      }
      @media (min-width: 768px) {
        .dpb-bar { padding: 10px 18px 9px; }
        .dpb-track { gap: 8px 7px; }
        .dpb-edge-label { font-size: 12px; }
        .dpb-arrow { font-size: 13px; }
        .dpb-dot { width: 18px; height: 18px; font-size: 10px; }
        .dpb-day { width: 28px; height: 28px; font-size: 10px; }
        .dpb-day.current { width: 34px; height: 34px; font-size: 11px; }
      }
      @media (max-height: 700px) {
        .dpb-bar { padding: 4px 8px 3px; }
        .dpb-edge-label { font-size: 8.5px; }
        .dpb-arrow { font-size: 9px; }
        .dpb-dot { width: 12px; height: 12px; font-size: 7px; }
        .dpb-day { width: 20px; height: 20px; font-size: 8px; }
        .dpb-day.current { width: 26px; height: 26px; font-size: 9px; }
      }
      .dpb-arrow {
        font-size: 12px;
        color: rgba(200,160,176,.45);
        flex-shrink: 0;
      }
      .dpb-arrow.done { color: #6fae4a; }
      .dpb-dot {
        width: 16px; height: 16px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        font-size: 9px; font-weight: 700; color: #fff;
        transition: all .3s ease;
      }
      .dpb-dot.done { background: #6fae4a; }
      .dpb-dot.current {
        background: #ffd23f;
        box-shadow: 0 0 0 0 rgba(255,210,63,.65), 0 0 8px rgba(255,210,63,.9);
        animation: dpbPulseGold 1.8s ease-out infinite;
      }
      .dpb-dot.locked {
        background: rgba(170,150,120,.10);
        border: 1.5px dashed rgba(170,150,120,.40);
        color: rgba(120,100,70,.50);
        font-size: 8px;
      }
      @keyframes dpbPulseGold {
        0%   { box-shadow: 0 0 0 0 rgba(255,210,63,.65), 0 0 8px rgba(255,210,63,.9); }
        70%  { box-shadow: 0 0 0 8px rgba(255,210,63,0), 0 0 8px rgba(255,210,63,.9); }
        100% { box-shadow: 0 0 0 0 rgba(255,210,63,0), 0 0 8px rgba(255,210,63,.9); }
      }
      .dpb-days {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }
      .dpb-day {
        width: 24px; height: 24px;
        border-radius: 50%;
        background: rgba(200,160,176,.26);
        display: flex; align-items: center; justify-content: center;
        font-family: 'Jost', sans-serif;
        font-size: 9px; font-weight: 700;
        color: rgba(120,80,90,.55);
        transition: all .3s ease;
      }
      .dpb-day.done { background: #6fae4a; color: #fff; }
      .dpb-day.current {
        width: 30px; height: 30px;
        background: #ffd23f;
        color: #5a4400;
        font-size: 10px;
        animation: dpbPulseGoldSmall 1.8s ease-out infinite;
      }
      @keyframes dpbPulseGoldSmall {
        0%   { box-shadow: 0 0 0 0 rgba(255,210,63,.65), 0 0 8px rgba(255,210,63,.9); }
        70%  { box-shadow: 0 0 0 7px rgba(255,210,63,0), 0 0 8px rgba(255,210,63,.9); }
        100% { box-shadow: 0 0 0 0 rgba(255,210,63,0), 0 0 8px rgba(255,210,63,.9); }
      }
      .dpb-tip {
        position: relative;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .dpb-tip::after {
        content: attr(data-tip);
        position: absolute;
        bottom: calc(100% + 9px);
        left: 50%;
        transform: translateX(-50%) translateY(4px);
        background: #1a1208;
        color: #faf5f2;
        font-family: 'Jost', sans-serif;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: .02em;
        padding: 6px 11px;
        border-radius: 8px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity .18s ease, transform .18s ease;
        z-index: 20;
      }
      .dpb-tip::before {
        content: '';
        position: absolute;
        bottom: calc(100% + 4px);
        left: 50%;
        transform: translateX(-50%) translateY(4px);
        border: 5px solid transparent;
        border-top-color: #1a1208;
        opacity: 0;
        pointer-events: none;
        transition: opacity .18s ease, transform .18s ease;
        z-index: 20;
      }
      .dpb-tip:hover::after, .dpb-tip:hover::before,
      .dpb-tip:focus::after, .dpb-tip:focus::before,
      .dpb-tip:active::after, .dpb-tip:active::before {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `}</style>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Frise de progression du parcours de découverte
// ─────────────────────────────────────────────────────────────────────────────

function DiscoveryProgressBar({ completedDays, currentDay }) {
  return (
    <div className="dpb-bar">
      <div className="dpb-track">
        <div className="dpb-edge">
          <span className="dpb-edge-label">Inscription</span>
          <span className="dpb-dot done dpb-tip" tabIndex={0} data-tip="Inscription">✓</span>
        </div>
        <span className="dpb-arrow done">→</span>
        <span className="dpb-dot done dpb-tip" tabIndex={0} data-tip="Rituel d'initiation">✓</span>
        <span className="dpb-arrow done">→</span>
        <span className="dpb-dot done dpb-tip" tabIndex={0} data-tip="Choix du chemin">✓</span>
        <span className="dpb-arrow done">→</span>
        <div className="dpb-days">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const done = (completedDays || []).includes(day)
            const current = !done && day === currentDay
            const cls = done ? 'done' : current ? 'current' : ''
            const label = current ? `Jour ${day} (en cours)` : `Jour ${day}`
            return (
              <div key={day} className={`dpb-day ${cls} dpb-tip`.trim()} tabIndex={0} data-tip={label}>{`J${day}`}</div>
            )
          })}
        </div>
        <span className="dpb-arrow">→</span>
        <div className="dpb-edge">
          <span className="dpb-dot locked dpb-tip" tabIndex={0} data-tip="L'appli t'attend !">🔒</span>
          <span className="dpb-edge-label app">L'appli t'attend !</span>
        </div>
      </div>
      <div className="dpb-caption">
        Visualise où tu en es !
        <span className="dpb-caption-sub">À chaque visite, tu te rapproches de ton jardin intérieur.</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Données : labels, couleurs zones, contenu des 7 jours
// ─────────────────────────────────────────────────────────────────────────────

const LABEL_MAP = {
  // Jour 1 — ressenti
  fatigue:       'Fatigué·e',
  stresse:       'Stressé·e',
  neutre:        'Neutre',
  calme:         'Calme',
  bien:          'Bien',
  // Jour 2 — énergie
  vide:          'Vide',
  basse:         'Basse',
  correcte:      'Correcte',
  bonne:         'Bonne',
  vive:          'Vive',
  // Jour 3 — espace
  travail:       'le travail',
  relations:     'les relations',
  corps:         'ton corps',
  pensees:       'mes pensées',
  avenir:        "l'avenir",
  // Jour 4 — besoin
  silence:       'du silence',
  mouvement:     'du mouvement',
  douceur:       'de la douceur',
  clarte:        'de la clarté',
  connexion:     'de la connexion',
  // Jour 5 — lien
  pas_vraiment:  'Pas vraiment',
  un_peu:        'Un peu',
  avec_quelquun: "avec quelqu'un",
  avec_moi:      'avec toi-même',
  profondement:  'Profondément',
  // Jour 6 — stress
  identique:     'identique',
  legere_moins:  'légèrement moins présent',
  moins_present: 'moins présent',
  beaucoup_moins:'beaucoup moins présent',
  different:     'différent',
  // Jour 7 — observation
  calme_plus:    'plus de calme',
  clarte_plus:   'plus de clarté',
  presence_plus: 'plus de présence',
  energie_plus:  "plus d'énergie",
  indefinissable:"quelque chose d'indéfinissable",
}

function labelFor(v) {
  return LABEL_MAP[v] || v || '…'
}

const ZONE_COLORS = {
  racines:  '#c8a0b0',
  tige:     '#9ab8c8',
  feuilles: '#7aaa88',
  fleurs:   '#d4a0b0',
  souffle:  '#c8a870',
}

const DAY_ZEN_LABELS = ['Les Racines', 'La Tige', 'Les Feuilles', 'Les Fleurs', 'Le Souffle', 'Mon Jardin', 'Le Jardin Ensemble']

export const WEEK_ONE_DATA = [
  /* ── JOUR 1 ─────────────────────────────────────────────────────────────── */
  {
    day: 1,
    title: 'Je commence',
    color: '#c8a0b0',
    accueil: {
      layout: 'slide1',
      timeBadge: '⏱ 6 à 10 min · à ton rythme',
      pauseSeconds: 1,
    },
    introspection: {
      question: 'Comment tu te sens là, maintenant ?',
      answerKey: 'feel',
      choices: [
        { label: '😴 Fatigué·e', value: 'fatigue'  },
        { label: '😰 Stressé·e', value: 'stresse'  },
        { label: '😐 Neutre',    value: 'neutre'   },
        { label: '😌 Calme',     value: 'calme'    },
        { label: '🙂 Bien',      value: 'bien'     },
      ],
    },
    rituel: {
      zone: 'Racines',
      getIntro: (ans) => {
        const feel = ans?.j1?.feel
        if (feel === 'fatigue' || feel === 'stresse') return {
          ctaLabel: 'Revenir à mes racines',
          lines: [
            "Ce que tu ressens peut être lourd aujourd'hui.",
            "Et dans ces moments-là, ce n'est pas ce qui est visible qui a le plus besoin d'attention…",
            "mais ce qui soutient tout le reste.",
            "Comme une plante, il existe en toi une base invisible qui influence ton équilibre.",
            "On va commencer doucement, par là.",
          ],
        }
        if (feel === 'neutre') return {
          ctaLabel: 'Explorer mes racines',
          lines: [
            "Ce que tu ressens est peut-être difficile à définir aujourd'hui.",
            "Ni vraiment mal… ni vraiment bien.",
            "C'est souvent dans ces moments-là que quelque chose peut commencer à s'éclaircir.",
            "Comme une plante, il existe en toi une base invisible qui soutient tout le reste.",
            "On va simplement s'en rapprocher.",
          ],
        }
        return {
          ctaLabel: 'Approfondir mes racines',
          lines: [
            "Tu portes quelque chose de plus calme aujourd'hui.",
            "C'est un terrain favorable.",
            "Comme une plante, il existe en toi une base invisible qui soutient tout le reste.",
            "Quand le terrain est accueillant, les racines peuvent s'approfondir.",
            "On va simplement les laisser faire.",
          ],
        }
      },
      isGuided: true,
    },
    guidedValidation: true,
    // videoAfterRitual: '/racine.mp4',
    getTrace: (ans) =>
      `Tu te sentais ${labelFor(ans?.j1?.feel)}. Et tu as quand même pris ce moment.`,
    ouverture: 'Demain, tu découvriras ce qui te porte, même quand tu vacilles.',
    helpTexts: {
      accueil_intro:       "Ce moment n'exige rien de toi.\n\nPas de performance, pas d'état d'âme particulier à avoir. Juste cette respiration, ce corps, cette seconde qui existe.\n\nC'est suffisant pour commencer.",
      accueil_arret:       "Tu es là. C'est déjà quelque chose.\n\nDans nos journées, on oublie souvent de simplement s'arrêter. Ce moment, tu viens de te l'offrir.",
      accueil_respiration: "Le souffle est toujours disponible.\n\nQuand tout s'accélère, il reste là, fidèle. Quelques secondes à lui accorder suffisent pour revenir à soi.",
      introspection:       "Nommer ce que l'on ressent, c'est déjà sortir du brouillard.\n\nPas besoin d'être précis·e. Une direction suffit. Le corps sait avant les mots.",
      rituel:              "Les racines d'une plante ne cherchent pas la lumière. Elles descendent, s'enfoncent, tiennent.\n\nC'est en t'ancrant dans le bas, le souffle, le sol, le corps, que tu trouves la stabilité pour t'ouvrir vers le haut.\n\nCe rituel nourrit tes racines.",
      validation:          "Ce que tu écris ici ne s'efface pas.\n\nDans un mois, dans un an, ces quelques mots te diront d'où tu viens. C'est une forme de tendresse envers toi-même.",
    },
  },

  /* ── JOUR 2 ─────────────────────────────────────────────────────────────── */
  {
    day: 2,
    title: 'Je reviens',
    color: '#9ab8c8',
    accueil: {
      conditioning: true,
      skipBarometer: true,
      headline: "Tu es revenu·e. Ton jardin s'en souvient.",
      timeBadge: '⏱ 10 à 15 min · à ton rythme',
      subtitle: 'La continuité est une forme de soin.',
      pauseSeconds: 1,
      getPreviousNote: (ans) => {
        const feel = ans?.j1?.feel
        if (feel === 'fatigue')  return "Hier, tu portais de la fatigue. Tu es revenu·e quand même."
        if (feel === 'stresse')  return "Hier, quelque chose te pesait. Et tu as choisi de revenir."
        if (feel === 'neutre')   return "Hier, tu étais dans un entre-deux. Ce retour commence peut-être autrement."
        if (feel === 'calme')    return "Hier, tu étais calme. Ce terrain mérite qu'on continue de le cultiver."
        if (feel === 'bien')     return "Hier, tu allais bien. Voyons ce que ce nouveau jour apporte de plus."
        return null
      },
    },
    introspection: {
      question: 'Ton énergie en ce moment est plutôt…',
      answerKey: 'energy',
      component: 'energy-battery',
    },
    rituel: {
      zone: 'Tige',
      intro: "La tige relie les racines aux feuilles. Elle porte sans s'effondrer.",
      getIntro: (ans) => {
        const energy = ans?.j2?.energy
        if (energy === 'vide' || energy === 'basse') return {
          ctaLabel: 'Trouver mon appui',
          lines: [
            "Ton énergie est basse aujourd'hui.",
            "La tige ne te demande pas d'aller loin.",
            "Juste de trouver un appui. Un contact.",
            "Ce qui te porte, même dans les jours difficiles.",
            "On va commencer par là.",
          ],
        }
        if (energy === 'correcte') return {
          ctaLabel: 'Retrouver mon centre',
          lines: [
            "Tu es là. C'est l'essentiel.",
            "La tige est ce qui relie.",
            "Elle n'a pas besoin d'être parfaite pour tenir.",
            "**On va simplement retrouver un point d'appui.**",
          ],
        }
        return {
          ctaLabel: 'Approfondir mon ancrage',
          lines: [
            "Ton énergie est bien présente aujourd'hui.",
            "C'est un bon moment pour s'ancrer davantage.",
            "La tige grandit quand on lui donne de l'attention.",
            "On va l'utiliser.",
          ],
        }
      },
      isGuided: 'tige',
    },
    ouvertureSlides: [
      "Aujourd'hui, tu as commencé à retrouver ton équilibre.",
      "Mais quelque chose peut encore s'ouvrir.",
      "**Demain, tu vas reconnecter avec ton ressenti. Et ça va changer la manière dont tu te perçois.**",
    ],
    finalCTA: 'Continuer demain',
    // videoAfterRitual: '/tige.mp4',
    helpTexts: {
      accueil_intro:       "Revenir, c'est déjà résister à l'oubli.\n\nLe corps se souvient de ce qu'on lui répète. Chaque retour grave un sillon un peu plus profond, même quand l'envie n'y est pas.",
      accueil_respiration: "Quelques respirations suffisent à changer la qualité de présence.\n\nPas besoin de méditer vingt minutes. Juste ce souffle, maintenant, avant de continuer.",
      introspection:       "Le changement ne s'annonce pas toujours. Parfois, c'est juste une légère différence de teinte.\n\nCe que tu perçois aujourd'hui t'appartient, aussi petit soit-il.",
      rituel:              "La tige porte sans plier. Elle tient la fleur vers le ciel tout en restant enracinée dans la terre.\n\nElle n'est ni rigide ni sans forme. Elle oscille, revient, tient bon.\n\nCe rituel renforce ta tige intérieure.",
      trace:               "Quelques mots honnêtes valent plus que de belles phrases.\n\nEcrire après la pratique, c'est laisser l'expérience se déposer, comme de la terre après la pluie.",
      ouverture:           "Deux jours. Ta tige commence à se dresser.\n\nDemain, quelque chose de plus délicat t'attend : les premières feuilles.",
    },
  },

  /* ── JOUR 3 ─────────────────────────────────────────────────────────────── */
  {
    day: 3,
    title: 'Je me vois',
    color: '#7aaa88',
    accueil: {
      conditioning: true,
      skipBarometer: true,
      headline: 'Quelque chose commence à se dessiner.',
      timeBadge: '⏱ 10 à 15 min · à ton rythme',
      tagLine: 'Et tu es en train de le voir apparaître.',
      subtitle: "Regarder sans juger — c'est déjà beaucoup.",
      subtitleExtra: "Même si ce n'est pas toujours simple.",
      breatheIntro: "Aujourd'hui, laisse-le simplement être là.",
      orbGuidance: "Pose ta main sur le ventre et imagine que c'est ton propre cœur qui se gonfle et se dégonfle au rythme de ta respiration.",
      orbDonePhrase: "Une cohérence s'installe.",
      barometerThankPhrase: "C'est ok de ressentir ça.",
      pauseSeconds: 1,
      getNarrativeNote: (ans) => {
        const feel   = ans?.j1?.feel
        const energy = ans?.j2?.energy
        if (!feel && !energy) return null

        const feelPart = {
          fatigue:  "tu portais de la fatigue",
          stresse:  "quelque chose te pesait",
          neutre:   "tu étais dans un entre-deux",
          calme:    "tu étais calme",
          bien:     "tu allais bien",
        }[feel]

        const energyPart = {
          vide:     "ton énergie s'est faite absente",
          basse:    "ton énergie est restée discrète",
          correcte: "ton énergie était là",
          bonne:    "ton énergie était bien présente",
          vive:     "tu étais pleinement vivant·e",
        }[energy]

        if (feelPart && energyPart)
          return `Ces deux derniers jours, ${feelPart}, puis ${energyPart}. Quelque chose commence à se dessiner.`
        if (feelPart)
          return `Avant-hier, ${feelPart}. Aujourd'hui, on regarde un peu plus loin.`
        return `Hier, ${energyPart}. Posons aujourd'hui un regard différent.`
      },
    },
    introspection: {
      question: "Qu'est-ce qui prend le plus de place en toi aujourd'hui ?",
      subQuestion: "sans chercher à le changer…",
      answerKey: 'space',
      layout: 'column',
      autoAdvance: true,
      choices: [
        { label: 'Le travail',    emoji: '💼', value: 'travail'   },
        { label: 'Les relations', emoji: '🤝', value: 'relations' },
        { label: 'Ton corps',     emoji: '🧘', value: 'corps'     },
        { label: 'Mes pensées',   emoji: '🌀', value: 'pensees'   },
        { label: "L'avenir",      emoji: '🔭', value: 'avenir'    },
      ],
    },
    rituel: {
      zone: 'Feuilles',
      intro: "Les feuilles captent la lumière. Elles reçoivent sans retenir.",
      getIntro: (ans) => {
        const space = ans?.j3?.space
        const feel  = ans?.j3?.conditioning_feel

        const feelLine = {
          fatigue:  "Tu portes quelque chose de lourd en ce moment.",
          stresse:  "Il y a de l'agitation en toi aujourd'hui.",
          neutre:   "Tu es dans un entre-deux.",
          calme:    "Il y a du calme en toi.",
          bien:     "Tu te sens bien.",
        }[feel]

        const opener = feelLine ? [feelLine] : []

        if (space === 'travail' || space === 'avenir') return {
          ctaLabel: 'Observer sans retenir',
          lines: [
            ...opener,
            `Ce qui prend le plus de place… c'est ${labelFor(space)}.`,
            "Les feuilles ne retiennent pas.",
            "Elles reçoivent, laissent traverser, et lâchent.",
            "C'est exactement ce qu'on va pratiquer.",
          ],
        }
        if (space === 'relations') return {
          ctaLabel: 'Laisser circuler',
          lines: [
            ...opener,
            "Les relations prennent beaucoup d'espace.",
            "Les feuilles captent tout ce qui arrive…",
            "mais elles savent aussi laisser passer.",
            "On va s'en inspirer.",
          ],
        }
        if (space === 'pensees') return {
          ctaLabel: 'Regarder sans me perdre',
          lines: [
            ...opener,
            "Les pensées prennent beaucoup de place.",
            "Comme des feuilles agitées par le vent.",
            "On ne cherche pas à les arrêter.",
            "Juste à les regarder passer.",
          ],
        }
        return {
          ctaLabel: 'Observer ce qui est là',
          lines: [
            ...opener,
            `Ce qui occupe ton espace… c'est ${labelFor(space)}.`,
            "Les feuilles reçoivent sans juger.",
            "Elles captent la lumière autant que l'ombre.",
            "On va simplement regarder ce qui est là.",
          ],
        }
      },
      isGuided: 'feuilles',
    },
    ouvertureSlides: [
      "Aujourd'hui, tu as commencé à regarder ce qui était en toi.",
      "Sans le fuir.",
      "**Demain, tu vas t'accorder quelque chose de plus profond. Et ça va changer ton rapport à toi-même.**",
    ],
    finalCTA: 'Continuer demain',
    helpTexts: {
      accueil_intro:       "Observer sans intervenir, c'est l'une des postures les plus difficiles qui soit.\n\nPas pour changer ce que tu vois, mais pour le voir vraiment. Ce regard honnête est déjà un acte de courage.",
      accueil_respiration: "Ce souffle avant de plonger dans la journée.\n\nIl crée un espace entre ce que tu étais hier et ce que tu choisis d'observer aujourd'hui.",
      accueil_barometer:   "Nommer ce que tu ressens, c'est déjà sortir du brouillard.\n\nPas besoin d'être précis·e. Une direction suffit. Le corps sait avant les mots.",
      introspection:       "Ce que tu vois en toi aujourd'hui n'est pas un verdict.\n\nC'est une photographie du moment. Les photos changent. Et regarder franchement, c'est déjà voir autrement.",
      rituel:              "Les feuilles d'une plante respirent. Elles absorbent, transforment, relâchent, en permanence.\n\nElles ne retiennent rien. Ce que le vent apporte, elles le laissent repartir.\n\nCe rituel travaille ta capacité à laisser circuler ce qui traverse.",
      trace:               "Tu as nommé quelque chose aujourd'hui, peut-être pour la première fois.\n\nLes mots que tu poses ici ne jugent pas. Ils témoignent. C'est différent.",
      ouverture:           "Trois jours. Tu observes. Tu nommes.\n\nDemain, une nouvelle invitation : t'accorder ce qui manquait.",
    },
  },

  /* ── JOUR 4 ─────────────────────────────────────────────────────────────── */
  {
    day: 4,
    title: "Je m'accorde de l'espace",
    color: '#d4a0b0',
    accueil: {
      conditioning: true,
      skipBarometer: true,
      timeBadge: '⏱ 10 à 15 min · à ton rythme',
      headline: 'Tu peux ralentir ici.',
      tagLine: 'Ici, tu peux vraiment te déposer.',
      subtitle: "Ce moment t'appartient entièrement.",
      breatheIntro: "Laisse le rythme venir à toi.",
      orbGuidance: "Pose ta main sur le ventre et imagine que tu inspires l'énergie qui t'entoure. La lumière, les rayons du soleil…",
      orbDonePhrase: "Tu te remplis de cette énergie bienveillante.",
      barometerThankPhrase: "C'est ok d'en être là.",
      pauseSeconds: 1,
      getNarrativeNote: (ans) => {
        const space  = ans?.j3?.space
        const energy = ans?.j2?.energy

        const spacePart = {
          travail:   "le travail occupait ton espace",
          relations: "les relations prenaient beaucoup de place",
          corps:     "ton corps demandait de l'attention",
          pensees:   "tes pensées tournaient en boucle",
          avenir:    "l'avenir accaparait tes pensées",
        }[space]

        const energyPart = {
          vide:     "à vide",
          basse:    "avec peu d'énergie",
          correcte: "dans un élan correct",
          bonne:    "avec une belle énergie",
          vive:     "avec beaucoup de vivacité",
        }[energy]

        if (spacePart && energyPart)
          return `Hier, ${spacePart}. Tu étais ${energyPart}. Aujourd'hui, tu peux ralentir.`
        if (spacePart)
          return `Hier, ${spacePart}. Ce moment est fait pour déposer tout ça.`
        if (energyPart)
          return `Ces derniers jours, tu avançais ${energyPart}. Aujourd'hui, c'est différent.`
        return null
      },
    },
    introspection: {
      question: "De quoi aurais-tu besoin aujourd'hui ?",
      subQuestion: "Sans te juger.",
      answerKey: 'need',
      layout: 'column',
      choices: [
        { label: 'De silence',   emoji: '🤫', value: 'silence'   },
        { label: 'De mouvement', emoji: '🚶', value: 'mouvement' },
        { label: 'De douceur',   emoji: '🫶', value: 'douceur'   },
        { label: 'De clarté',    emoji: '💡', value: 'clarte'    },
        { label: 'De connexion', emoji: '🌱', value: 'connexion' },
      ],
    },
    rituel: {
      zone: 'Fleurs',
      intro: "Les fleurs s'ouvrent quand elles sont prêtes. Pas avant.",
      getIntro: (ans) => {
        const need = ans?.j4?.need
        const feel = ans?.j4?.conditioning_feel

        const feelLine = {
          fatigue:  "Tu portes de la fatigue aujourd'hui.",
          stresse:  "Il y a de la tension en toi.",
          neutre:   "Tu es dans un état neutre.",
          calme:    "Il y a du calme en toi.",
          bien:     "Tu te sens bien.",
        }[feel]

        const opener = feelLine ? [feelLine] : []

        if (need === 'silence') return {
          ctaLabel: 'Entrer dans le silence',
          lines: [
            ...opener,
            "Tu as besoin de silence.",
            "Les fleurs s'ouvrent dans le calme.",
            "Ce scan corporel va créer cet espace pour toi.",
            "Rien à produire. Juste à recevoir.",
          ],
        }
        if (need === 'douceur') return {
          ctaLabel: 'Recevoir de la douceur',
          lines: [
            ...opener,
            "Tu as besoin de douceur.",
            "Les fleurs ne s'ouvrent jamais dans la contrainte.",
            "Ce moment est entièrement pour toi.",
            "Laisse-toi simplement traverser.",
          ],
        }
        if (need === 'mouvement') return {
          ctaLabel: 'Traverser mon corps',
          lines: [
            ...opener,
            "Tu as besoin de mouvement.",
            "Ce scan t'invite à parcourir ton corps.",
            "Une façon douce de bouger… de l'intérieur.",
          ],
        }
        if (need === 'clarte') return {
          ctaLabel: 'Chercher la clarté',
          lines: [
            ...opener,
            "Tu cherches de la clarté.",
            "Parfois, elle vient quand on s'arrête de chercher.",
            "Ce scan va te ramener dans le corps.",
            "C'est souvent là qu'elle attend.",
          ],
        }
        return {
          ctaLabel: "M'offrir de l'espace",
          lines: [
            ...opener,
            `Tu as besoin ${labelFor(need)}.`,
            "Les fleurs ne s'ouvrent que quand elles ont de l'espace.",
            "C'est ce que tu vas t'offrir maintenant.",
          ],
        }
      },
      isGuided: 'fleurs',
    },
    getTrace: null,
    traceSlides: (ans) => {
      const need = ans?.j4?.need
      const needLabel = need ? labelFor(need) : "de quelque chose"
      return [
        `Aujourd'hui, tu avais besoin ${needLabel}. Et tu t'es autorisé à te le donner.`,
        "Et quelque chose est déjà en train de changer.",
      ]
    },
    ouvertureSlides: [
      "Aujourd'hui, tu t'es accordé quelque chose.",
      "Et ça, ton jardin le ressent.",
      "**Demain, quelque chose va commencer à se révéler. Et tu vas pouvoir le voir.**",
    ],
    finalCTA: 'Continuer demain',
    helpTexts: {
      accueil_intro:       "Ralentir demande plus d'audace qu'accélérer.\n\nDans un monde qui valorise la vitesse, s'arrêter est un acte presque subversif. Et pourtant, c'est souvent là que tout se remet en ordre.",
      accueil_respiration: "Avant d'explorer, juste s'installer.\n\nCe souffle crée le sol sur lequel tu vas poser ce qui vient ensuite.",
      accueil_barometer:   "Nommer ce que tu ressens, c'est déjà sortir du brouillard.\n\nPas besoin d'être précis·e. Une direction suffit. Le corps sait avant les mots.",
      introspection:       "Il n'y a pas de bonne réponse à ce que tu explores ici.\n\nSeulement la tienne, toujours en mouvement, toujours juste pour ce moment.",
      rituel:              "Une fleur ne s'ouvre pas sur commande.\n\nElle attend que la lumière soit là, que la chaleur soit suffisante. Elle ne se force pas.\n\nCe rituel t'invite à créer ces conditions pour toi, sans effort, juste en ouvrant l'espace.",
      trace:               "L'espace que tu viens de t'accorder a laissé une empreinte.\n\nTon système nerveux l'a enregistré, même si tu n'en as pas conscience. Même peu compte.",
      ouverture:           "Quatre jours. Tes fleurs commencent à s'ouvrir.\n\nDemain, quelque chose de nouveau entre dans ton jardin : la dimension du lien.",
    },
  },

  /* ── JOUR 5 ─────────────────────────────────────────────────────────────── */
  {
    day: 5,
    title: 'Je crée un lien',
    color: '#c8a870',
    accueil: {
      conditioning: true,
      skipBarometer: true,
      timeBadge: '⏱ 10 à 15 min · à ton rythme',
      headline: "Tu n'es pas seul·e aujourd'hui.",
      tagLine: "Même quand ça peut en donner l'impression.",
      subtitle: 'Le lien commence souvent par un seul geste silencieux.',
      breatheIntro: "Aujourd'hui, laisse-le te relier.",
      orbGuidance: "Pose ta main sur le ventre et pense à une personne que tu aimes, ou à laquelle tu peux envoyer une pensée d'amour ou d'amitié.",
      orbDonePhrase: "Ton souffle propulse ton intention bienveillante.",
      barometerThankPhrase: "C'est ok de ressentir ça.",
      pauseSeconds: 1,
      getNarrativeNote: (ans) => {
        const need  = ans?.j4?.need
        const feel  = ans?.j1?.feel

        const needPart = {
          silence:   "tu avais besoin de silence",
          mouvement: "ton corps cherchait à bouger",
          douceur:   "tu avais besoin de douceur",
          clarte:    "tu cherchais de la clarté",
          connexion: "tu aspirais à de la connexion",
        }[need]

        const feelPart = {
          fatigue:  "tu étais fatigué·e",
          stresse:  "quelque chose te pesait",
          neutre:   "tu étais dans un entre-deux",
          calme:    "tu étais calme",
          bien:     "tu allais bien",
        }[feel]

        if (needPart)
          return `Hier, ${needPart}. Quatre jours que tu reviens. Ce n'est pas rien.`
        if (feelPart)
          return `Au départ, ${feelPart}. Regardez le chemin parcouru depuis.`
        return null
      },
    },
    introspection: {
      question: 'As-tu ressenti du lien récemment ?',
      subQuestion: 'Même de façon très légère.',
      answerKey: 'connection',
      layout: 'column',
      choices: [
        { label: 'Pas vraiment',        emoji: '🫥', value: 'pas_vraiment'  },
        { label: 'Un peu',              emoji: '🌿', value: 'un_peu'        },
        { label: "Oui, avec quelqu'un", emoji: '🤗', value: 'avec_quelquun' },
        { label: 'Oui, avec moi-même',  emoji: '💛', value: 'avec_moi'      },
        { label: 'Profondément',        emoji: '🌊', value: 'profondement'  },
      ],
    },
    rituel: {
      zone: 'Souffle',
      intro: "Le souffle relie l'intérieur à l'extérieur. Il traverse tout.",
      getIntro: (ans) => {
        const connection = ans?.j5?.connection
        const feel       = ans?.j5?.conditioning_feel

        const feelLine = {
          fatigue:  "Tu portes de la fatigue aujourd'hui.",
          stresse:  "Il y a de la tension en toi.",
          neutre:   "Tu es dans un entre-deux.",
          calme:    "Il y a du calme en toi.",
          bien:     "Tu te sens bien.",
        }[feel]

        const opener = feelLine ? [feelLine] : []

        const closing = "**Le lien n'a pas besoin d'être visible pour exister.**"
        if (connection === 'pas_vraiment') return {
          ctaLabel: 'Créer un geste de lien',
          lines: [
            ...opener,
            "Le lien peut sembler loin en ce moment.",
            "Le souffle ne juge pas.",
            "Il part de toi… et va quelque part.",
            "Ce rituel ne demande rien d'autre que ça.",
            closing,
          ],
        }
        if (connection === 'un_peu') return {
          ctaLabel: 'Approfondir ce lien',
          lines: [
            ...opener,
            "Tu as ressenti un peu de lien.",
            "C'est souvent là que tout commence.",
            "Le souffle va l'amplifier doucement.",
            closing,
          ],
        }
        if (connection === 'avec_quelquun') return {
          ctaLabel: 'Envoyer une pensée douce',
          lines: [
            ...opener,
            "Tu as ressenti du lien avec quelqu'un.",
            "Ce rituel va prolonger ce geste.",
            "Une pensée envoyée en silence… arrive toujours quelque part.",
            closing,
          ],
        }
        if (connection === 'avec_moi') return {
          ctaLabel: "Relier vers l'extérieur",
          lines: [
            ...opener,
            "Tu as ressenti du lien avec toi-même.",
            "C'est la meilleure base qui soit.",
            "Maintenant… envoyons ce lien vers quelqu'un d'autre.",
            closing,
          ],
        }
        return {
          ctaLabel: 'Laisser le souffle relier',
          lines: [
            ...opener,
            "Tu as ressenti du lien profondément.",
            "Le souffle est le passage entre l'intérieur et l'extérieur.",
            "Il relie tout. Laisse-le faire.",
            closing,
          ],
        }
      },
      isGuided: 'souffle',
    },
    getTrace: null,
    traceSlides: [
      "Même quand le lien semblait loin… tu as relié quelque chose.",
      "Et ça existe.",
    ],
    ouvertureSlides: [
      "Aujourd'hui, tu as recréé du lien.",
      "Même discret… il est là.",
      "**Demain, tu vas commencer à voir ton jardin autrement. Et quelque chose va apparaître.**",
    ],
    finalCTA: 'Continuer demain',
    helpTexts: {
      accueil_intro:       "Le lien ne se fabrique pas. Il s'ouvre.\n\nUne présence plus attentive, un regard moins pressé. Ce que tu cultives ici change imperceptiblement la façon dont tu habites tes relations.",
      accueil_respiration: "Ce souffle avant de rencontrer l'autre.\n\nOn oublie souvent que la qualité de notre présence commence dans notre propre corps.",
      accueil_barometer:   "Nommer ce que tu ressens, c'est déjà sortir du brouillard.\n\nPas besoin d'être précis·e. Une direction suffit. Le corps sait avant les mots.",
      introspection:       "Te dire quelque chose sur ton rapport aux autres, c'est aussi t'en apprendre sur toi-même.\n\nLe lien est un miroir. Ce qu'il te renvoie aujourd'hui est précieux.",
      rituel:              "Le souffle tisse un fil invisible entre toi et le reste du vivant.\n\nIl entre, il sort. Il relie ton monde intérieur à ce qui t'entoure.\n\nTravailler avec le souffle, c'est apprendre à habiter cet entre-deux.",
      trace:               "Ce geste vers l'autre, ou vers toi-même, a résonné dans ton jardin.\n\nLe lien laisse toujours une trace, même quand on ne sait pas encore la nommer.",
      ouverture:           "Cinq zones éveillées. Ton jardin prend sa forme.\n\nDemain, pour la première fois, tu vas le voir en entier.",
    },
  },

  /* ── JOUR 6 ─────────────────────────────────────────────────────────────── */
  {
    day: 6,
    title: 'Je rencontre mon jardin',
    color: '#1a1010',
    accueil: {
      conditioning: true,
      skipBarometer: true,
      timeBadge: '⏱ 4 à 6 min · à ton rythme',
      headline: 'Tes cinq zones sont éveillées.',
      tagLine: "Elles ont commencé à s'exprimer.",
      subtitleExtra: "Ton jardin commence à apparaître.",
      subtitleFinal: "Et ça compte.",
      breatheIntro: "Juste pour être là.",
      timerDuration: 180,
      pauseSeconds: 1,
      getNarrativeNote: (ans) => {
        const connection = ans?.j5?.connection
        const need       = ans?.j4?.need

        const connectionPart = {
          pas_vraiment:  "le lien semblait loin",
          un_peu:        "tu as ressenti un peu de lien",
          avec_quelquun: "tu as pensé à quelqu'un",
          avec_moi:      "tu as pris soin de toi-même",
          profondement:  "tu as ressenti du lien profondément",
        }[connection]

        const needPart = {
          silence:   "tu cherchais du silence",
          mouvement: "ton corps demandait à bouger",
          douceur:   "tu avais besoin de douceur",
          clarte:    "tu cherchais de la clarté",
          connexion: "tu aspirais à de la connexion",
        }[need]

        if (connectionPart && needPart)
          return `Hier, ${connectionPart}. Avant-hier, ${needPart}. Cinq jours, cinq zones. Quelque chose s'est éveillé.`
        if (connectionPart)
          return `Hier, ${connectionPart}. Tu as traversé cinq zones. Ton jardin est prêt.`
        return "Cinq jours. Cinq zones. Ce que tu as cultivé prend maintenant une forme visible."
      },
    },
    introspection: {
      question: '',
      answerKey: 'discovery',
      component: 'mafleur-discovery',
    },
    rituel: {
      zone: 'Mon Jardin',
      isGuided: 'jardin',
    },
    getTrace: null,
    traceName: 'citation',
    typewriterTrace: true,
    traceTypewriterFrom: 2,
    traceSlides: [
      "Aujourd'hui, tu as rencontré ta fleur. Elle est là maintenant.",
      "Et elle évolue avec toi.",
      "**« Mais, si tu m'apprivoises, nous aurons besoin l'un de l'autre.",
      "**Tu seras pour moi unique au monde.",
      "**Je serai pour toi unique au monde… »",
      "— Antoine de Saint-Exupéry",
    ],
    ouvertureSlides: [
      "Aujourd'hui, tu as compris quelque chose d'essentiel.",
      "Ta fleur est vivante.",
      "**Demain, tu vas apprendre à avancer avec elle.**",
    ],
    finalCTA: 'Continuer',
    helpTexts: {
      accueil_intro:       "Ta fleur ne ressemble à aucune autre.\n\nElle porte les couleurs de ce que tu as traversé, les saisons difficiles autant que les belles lumières. Elle est fidèle à ta vérité.",
      accueil_respiration: "Avant de la rencontrer, juste s'installer.\n\nCe souffle prépare l'espace intérieur pour accueillir ce qui arrive.",
      introspection:       "Certaines choses résistent aux mots.\n\nC'est normal. Laisse venir ce qui vient : une image, une sensation, un silence. Ce sont aussi des réponses.",
      rituel:              "Rencontrer ta fleur, c'est rencontrer ce que tu as cultivé.\n\nElle n'est pas un idéal. Elle est toi, maintenant, dans toute ta complexité. Laisse-la te toucher sans chercher à l'interpréter.",
      citation:            "Ces mots d'Antoine de Saint-Exupéry résonnent avec ce que tu viens de vivre.\n\nApprivoiser, c'est créer des liens. Et ton jardin, tu l'apprivoises chaque jour.",
      ouverture:           "Six jours. Ta fleur a pris racine, ta tige se tient.\n\nDemain, un dernier jour avant d'entrer dans quelque chose de plus grand.",
    },
  },

  /* ── JOUR 7 ─────────────────────────────────────────────────────────────── */
  {
    day: 7,
    title: 'Je fais partie',
    color: '#7a9ab8',
    gradient: 'linear-gradient(135deg, #c8a0b0 0%, #9ab8c8 35%, #7aaa88 65%, #c8a870 100%)',
    accueil: {
      conditioning: true,
      skipBarometer: true,
      timeBadge: '⏱ 2 à 3 min · à ton rythme',
      headline: 'Ton jardin existe.',
      tagLine: "Et tu as commencé à le faire vivre.",
      subtitle: 'Mais un jardin ne pousse pas seul.',
      subtitleExtra: "Tu peux continuer à en prendre soin. À ton rythme.",
      breatheIntro: "Comme tu sais déjà le faire.",
      timerDuration: 300,
      timerButtonAfter: 60,
      orbGuidanceList: [
        "La main sur le ventre",
        "Ventre (2 min) : un ballon qui respire",
        "Cœur (1 min) : s'ouvre et se ferme",
        "Ciel (1 min) : lumière et énergie du soleil",
        "Lien (1 min) : recevoir et donner l'amour",
      ],
      pauseSeconds: 1,
      getNarrativeNote: (ans) => {
        const notice = ans?.j7?.notice
        const map = {
          calme_plus:     'du calme',
          clarte_plus:    'de la clarté',
          presence_plus:  'de la présence',
          energie_plus:   "de l'énergie",
          indefinissable: "quelque chose d\u2019ind\u00e9finissable",
        }
        const label = map[notice]
        return label
          ? `Sept jours. Tu as ressenti ${label}. Il est temps d'aller plus loin.`
          : "Sept jours. Ta fleur a pris racine. Aujourd'hui, elle rencontre les autres."
      },
    },
    introspection: {
      question: '',
      answerKey: 'communaute',
      component: 'communaute-discovery',
    },
    rituel: {
      zone: 'Le Jardin Ensemble',
      isGuided: 'communaute',
    },
    isFinal: true,
    rituelFirst: true,
    finalCTA: 'Entrer dans mon jardin',
    helpTexts: {
      accueil_intro:       "Sept jours. Chaque jour avait sa lumière, sa résistance, sa couleur.\n\nCe que tu as traversé n'est pas derrière toi. C'est en toi, désormais. Quelque chose a changé de forme.",
      accueil_respiration: "Un dernier souffle avant d'entrer dans le jardin partagé.\n\nCe que tu portes aujourd'hui, tu vas le retrouver dans les autres aussi.",
      rituel:              "Un jardin partagé n'efface pas le tien. Il l'enrichit.\n\nTa pratique, ta présence, ton engagement cette semaine ont une résonance au-delà de toi.\n\nEntrer dans le jardin collectif, c'est continuer de grandir autrement.",
      introspection:       "Ce que tu emportes de cette semaine ne tient pas toujours dans un mot.\n\nPeut-être une sensation. Une image. Un peu plus de douceur envers toi-même. C'est suffisant.",
    },
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// 3. Composants partagés
// ─────────────────────────────────────────────────────────────────────────────


// ── Bouton principal ───────────────────────────────────────────────────────

function PrimaryButton({ onClick, disabled, children, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={disabled ? '' : 'wof-cta-pulse'}
      style={{
        fontFamily: 'Jost, sans-serif',
        fontSize: 15,
        fontWeight: 500,
        letterSpacing: '0.04em',
        color: '#fff',
        background: disabled
          ? '#d8c8c4'
          : 'linear-gradient(135deg, #c8a0b0, #a07888)',
        border: 'none',
        borderRadius: 50,
        padding: '16px 40px',
        minHeight: 44,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'transform 0.15s ease, opacity 0.2s',
        ...style,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(1.03)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {children}
    </button>
  )
}

// ── Bouton retour ──────────────────────────────────────────────────────────

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(255,255,255,0.55)',
        border: '1px solid rgba(180,160,140,0.25)',
        borderRadius: 100,
        padding: '7px 16px',
        cursor: 'pointer',
        color: 'rgba(50,35,20,0.65)',
        fontSize: 13,
        fontFamily: "'Jost', sans-serif",
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      ‹ Retour
    </button>
  )
}

// ── Lumières organiques en fond ────────────────────────────────────────────

function OrganicLights() {
  const blobs = [
    { top: '8%',  left: '12%',             size: 300, color: '#e8c8c0', delay: '0s',   dur: '9s'  },
    { top: '55%', right: '8%', left: 'auto', size: 220, color: '#c8d8e0', delay: '2s',   dur: '11s' },
    { top: '38%', left: '55%',             size: 180, color: '#c8d8b8', delay: '1.5s', dur: '8s'  },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: b.top, left: b.left, right: b.right,
            width: b.size, height: b.size,
            borderRadius: '50%',
            background: b.color,
            opacity: 0.22,
            filter: 'blur(64px)',
            animation: `fleurFloat ${b.dur} ease-in-out infinite`,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  )
}

// ── Fleur SVG ──────────────────────────────────────────────────────────────

function FlowerSVG({ size = 140, animated = false, style: extraStyle, completedZones, petalColor }) {
  const petals = [
    { zone: 'racines',  color: ZONE_COLORS.racines,  angle: 270 },
    { zone: 'tige',     color: ZONE_COLORS.tige,     angle: 54  },
    { zone: 'feuilles', color: ZONE_COLORS.feuilles, angle: 126 },
    { zone: 'fleurs',   color: ZONE_COLORS.fleurs,   angle: 198 },
    { zone: 'souffle',  color: ZONE_COLORS.souffle,  angle: 342 },
  ]
  const cx      = size / 2
  const petalRx = size * 0.155  // largeur pétale
  const petalRy = size * 0.265  // longueur pétale (vers l'extérieur)
  const dist    = size * 0.175  // distance centre → milieu pétale

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        display: 'block',
        overflow: 'visible',
        ...(animated ? { animation: 'bloom 1.4s cubic-bezier(.25,.8,.25,1) both' } : {}),
        ...extraStyle,
      }}
    >
      <defs>
        {petals.map((p) => {
          const done = !completedZones || completedZones.includes(p.zone)
          return (
            <radialGradient key={`pg-${p.zone}`} id={`pg-${p.zone}`} cx="50%" cy="30%" r="70%" gradientTransform={`rotate(${p.angle + 90}, 0.5, 0.5)`}>
              <stop offset="0%"   stopColor="#ffffff" stopOpacity={done ? "0.7" : "0"} />
              <stop offset="35%"  stopColor={done ? (petalColor || p.color) : '#cfc4c0'} stopOpacity={done ? "1" : "0.45"} />
              <stop offset="100%" stopColor={done ? (petalColor || p.color) : '#c0b8b5'} stopOpacity={done ? "0.75" : "0.3"} />
            </radialGradient>
          )
        })}
        <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="pistilGrad" cx="38%" cy="32%" r="68%">
          <stop offset="0%"   stopColor="#fff9f0" />
          <stop offset="60%"  stopColor="#f2d8b8" />
          <stop offset="100%" stopColor="#ddb888" />
        </radialGradient>
      </defs>

      {/* Couche halo (pétales complétés seulement) */}
      {petals.map((p) => {
        const done = !completedZones || completedZones.includes(p.zone)
        if (!done) return null
        const rad = (p.angle * Math.PI) / 180
        const px  = cx + dist * Math.cos(rad)
        const py  = cx + dist * Math.sin(rad)
        return (
          <ellipse
            key={`halo-${p.zone}`}
            cx={px} cy={py}
            rx={petalRx * 1.2} ry={petalRy * 1.2}
            fill={petalColor || p.color}
            opacity={0.18}
            filter="url(#softGlow)"
            transform={`rotate(${p.angle + 90}, ${px}, ${py})`}
          />
        )
      })}

      {/* Pétales */}
      {petals.map((p, i) => {
        const rad  = (p.angle * Math.PI) / 180
        const px   = cx + dist * Math.cos(rad)
        const py   = cx + dist * Math.sin(rad)
        const done = !completedZones || completedZones.includes(p.zone)
        return (
          <ellipse
            key={p.zone}
            cx={px} cy={py}
            rx={petalRx} ry={petalRy}
            fill={`url(#pg-${p.zone})`}
            stroke={done ? (petalColor || p.color) : '#c8b8b4'}
            strokeWidth={done ? 0.6 : 0.3}
            strokeOpacity={done ? 0.45 : 0.2}
            transform={`rotate(${p.angle + 90}, ${px}, ${py})`}
            style={animated ? {
              animation: 'petalIn 0.55s ease both',
              animationDelay: `${0.15 + i * 0.1}s`,
            } : {}}
          />
        )
      })}

      {/* Pistil */}
      <circle cx={cx} cy={cx} r={size * 0.12}  fill="url(#pistilGrad)" />
      <circle cx={cx} cy={cx} r={size * 0.072} fill="#f8e8d0" opacity={0.65} />
      <circle cx={cx - size * 0.03} cy={cx - size * 0.03} r={size * 0.03} fill="#fffaf4" opacity={0.5} />
    </svg>
  )
}


// ── Illustration botanique (top-view flower) ──────────────────────────────

function FlowerIllustration({ size, color1 = '#e888a8', color2 = '#fce8f0' }) {
  const cx = size / 2
  const s  = size / 280   // scale factor, designed at 280px

  const outerAngles = Array.from({ length: 8 }, (_, i) => i * 45)
  const innerAngles = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5)

  // Petal paths pointing in -Y (upward), to be rotated into place
  const outerPath = [
    `M 0 ${-9*s}`,
    `C ${-27*s} ${-32*s}, ${-31*s} ${-78*s}, 0 ${-118*s}`,
    `C ${31*s} ${-78*s}, ${27*s} ${-32*s}, 0 ${-9*s}`,
    'Z',
  ].join(' ')

  const innerPath = [
    `M 0 ${-7*s}`,
    `C ${-16*s} ${-25*s}, ${-19*s} ${-58*s}, 0 ${-75*s}`,
    `C ${19*s} ${-58*s}, ${16*s} ${-25*s}, 0 ${-7*s}`,
    'Z',
  ].join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <defs>
        <radialGradient id="wof-opg" cx="50%" cy="82%" r="75%">
          <stop offset="0%"   stopColor={color2} stopOpacity="0.45" />
          <stop offset="30%"  stopColor={color2} />
          <stop offset="75%"  stopColor={color1} />
          <stop offset="100%" stopColor={color1} stopOpacity="0.80" />
        </radialGradient>
        <radialGradient id="wof-ipg" cx="50%" cy="82%" r="75%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="40%"  stopColor={color2} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color2} />
        </radialGradient>
        <radialGradient id="wof-ctr" cx="35%" cy="30%" r="68%">
          <stop offset="0%"   stopColor="#fffde8" />
          <stop offset="42%"  stopColor="#f8d454" />
          <stop offset="100%" stopColor="#d4940c" />
        </radialGradient>
        <filter id="wof-ps" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.8" floodColor={color1} floodOpacity="0.18"/>
        </filter>
      </defs>

      {/* Outer petals */}
      {outerAngles.map(a => (
        <path
          key={`op${a}`}
          d={outerPath}
          fill="url(#wof-opg)"
          stroke={color1}
          strokeWidth={0.5}
          strokeOpacity={0.3}
          transform={`translate(${cx},${cx}) rotate(${a})`}
          filter="url(#wof-ps)"
        />
      ))}

      {/* Inner petals */}
      {innerAngles.map(a => (
        <path
          key={`ip${a}`}
          d={innerPath}
          fill="url(#wof-ipg)"
          stroke={color2}
          strokeWidth={0.4}
          strokeOpacity={0.25}
          transform={`translate(${cx},${cx}) rotate(${a})`}
        />
      ))}

      {/* Stamen ring */}
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * 2 * Math.PI
        const d = size * 0.093
        return (
          <circle key={`st${i}`}
            cx={cx + d * Math.cos(a)} cy={cx + d * Math.sin(a)}
            r={size * 0.012} fill="#c07818" opacity={0.72}
          />
        )
      })}

      {/* Pistil */}
      <circle cx={cx} cy={cx} r={size * 0.086} fill="url(#wof-ctr)" />
      <circle cx={cx} cy={cx} r={size * 0.052} fill="#fdf4c0" opacity={0.55} />
      <circle cx={cx - size*0.026} cy={cx - size*0.026} r={size * 0.02} fill="white" opacity={0.32} />
    </svg>
  )
}

// ── Mosaïque fleur 4 quadrants (B&W → couleur par zone) ───────────────────

function FlowerMosaic({ completedZones, size = 248, petalColor1, petalColor2 }) {
  const gap  = 1
  const cell = (size - gap) / 2

  const PIECES = [
    { id: 'tl', zone: 'racines',  color: ZONE_COLORS.racines,  label: 'Racines',  dx: 0,           dy: 0            },
    { id: 'tr', zone: 'tige',     color: ZONE_COLORS.tige,     label: 'Tige',     dx: -(cell+gap),  dy: 0            },
    { id: 'bl', zone: 'feuilles', color: ZONE_COLORS.feuilles, label: 'Feuilles', dx: 0,            dy: -(cell+gap)  },
    { id: 'br', zone: 'fleurs',   color: ZONE_COLORS.fleurs,   label: 'Fleurs',   dx: -(cell+gap),  dy: -(cell+gap)  },
  ]

  const souffleActive = completedZones?.includes('souffle')
  const allRevealed   = souffleActive && PIECES.every(p => completedZones?.includes(p.zone))

  const cornerRadius = { tl: '16px 3px 3px 3px', tr: '3px 16px 3px 3px', bl: '3px 3px 3px 16px', br: '3px 3px 16px 3px' }
  const labelPos     = { tl: { top: 7, left: 7 }, tr: { top: 7, right: 7 }, bl: { bottom: 7, left: 7 }, br: { bottom: 7, right: 7 } }

  return (
    <div style={{
      position: 'relative', width: size, height: size,
      animation: allRevealed ? 'mosaicBloom 1.4s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
      borderRadius: 18,
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `${cell}px ${cell}px`,
        gridTemplateRows: `${cell}px ${cell}px`,
        gap,
        animation: allRevealed ? 'mosaicPulse 3s ease-in-out 1.4s 2' : 'none',
      }}>
        {PIECES.map(p => {
          const active = completedZones?.includes(p.zone)
          return (
            <div key={p.id} style={{
              width: cell, height: cell,
              overflow: 'hidden',
              borderRadius: cornerRadius[p.id],
              position: 'relative',
              filter: active
                ? 'none'
                : 'grayscale(1) brightness(0.68) contrast(1.08)',
              transition: 'filter 1.6s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: active ? `inset 0 0 0 1.5px ${p.color}55` : 'inset 0 0 0 1px rgba(140,110,100,0.18)',
            }}>
              {/* Tranche de la fleur */}
              <div style={{
                position: 'absolute',
                left: p.dx, top: p.dy,
                width: size, height: size,
                pointerEvents: 'none',
              }}>
                <FlowerIllustration size={size} color1={petalColor1 ?? undefined} color2={petalColor2 ?? undefined} />
              </div>

              {/* Label de zone (apparaît à l'activation) */}
              <div style={{
                position: 'absolute',
                ...labelPos[p.id],
                fontFamily: 'Jost, sans-serif',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#1a1010',
                background: 'rgba(255,255,255,0.92)',
                padding: '2px 8px',
                borderRadius: 100,
                boxShadow: '0 1px 6px rgba(0,0,0,0.25)',
                opacity: active ? 1 : 0,
                transition: 'opacity 0.8s ease 1s',
                pointerEvents: 'none',
              }}>
                {p.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Séparateur central (croix) */}
      <div style={{ position: 'absolute', top: cell, left: 0, right: 0, height: gap, background: '#faf5f2', pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ position: 'absolute', left: cell, top: 0, bottom: 0, width: gap, background: '#faf5f2', pointerEvents: 'none', zIndex: 2 }} />

      {/* Centre — zone Souffle */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: cell * 0.30, height: cell * 0.30,
        borderRadius: '50%',
        background: souffleActive
          ? 'radial-gradient(circle at 38% 32%, #ffffff 0%, #fff9c4 30%, #ffd600 100%)'
          : 'radial-gradient(circle at 35% 30%, #e0d8d4, #b8a8a4)',
        boxShadow: souffleActive
          ? `0 0 0 ${gap}px #faf5f2, 0 0 22px 6px #ffd60077, 0 0 44px 16px #ffd60033`
          : `0 0 0 ${gap}px #faf5f2`,
        filter: souffleActive ? 'none' : 'grayscale(1) brightness(0.68)',
        transition: 'all 1.6s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 3,
      }} />
    </div>
  )
}

// ── Timer de rituel ────────────────────────────────────────────────────────

function RituelTimer({ duration, label, color, onComplete }) {
  const [started,   setStarted]   = useState(false)
  const [remaining, setRemaining] = useState(duration)
  const [done,      setDone]      = useState(false)
  const intervalRef = useRef(null)

  const CIRC = 2 * Math.PI * 40   // rayon 40

  function start() {
    setStarted(true)
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current)
          setDone(true)
          onComplete?.()
          return 0
        }
        return r - 1
      })
    }, 1000)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const progress    = started ? (duration - remaining) / duration : 0
  const dashOffset  = CIRC * (1 - progress)
  const mins        = Math.floor(remaining / 60)
  const secs        = remaining % 60
  const displayTime = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')}`
    : `${secs}s`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, margin: '20px 0' }}>
      <p style={{
        fontFamily: 'Jost, sans-serif',
        fontSize: 12,
        color: '#1a1010',
        margin: 0,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        {label}
      </p>

      <div style={{ position: 'relative', width: 96, height: 96 }}>
        <svg width={96} height={96} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={48} cy={48} r={40} fill="none" stroke="#ede8e4" strokeWidth={5} />
          <circle
            cx={48} cy={48} r={40}
            fill="none"
            stroke={color || '#c8a0b0'}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {done ? (
            <span style={{ fontSize: 20, color: color || '#c8a0b0' }}>✓</span>
          ) : (
            <span style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: started ? 17 : 13,
              fontWeight: 300,
              color: '#806868',
            }}>
              {started ? displayTime : '—'}
            </span>
          )}
        </div>
      </div>

      {!started && (
        <button
          onClick={start}
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            color: color || '#c8a0b0',
            background: 'transparent',
            border: `1.5px solid ${color || '#c8a0b0'}`,
            borderRadius: 50,
            padding: '8px 24px',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
        >
          Commencer
        </button>
      )}

      {done && (
        <p style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 13,
          color: '#1a1010',
          margin: 0,
          fontStyle: 'italic',
        }}>
          Bien. Prenez un instant avant de continuer.
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Composants d'étapes
// ─────────────────────────────────────────────────────────────────────────────

// ── Orbe respiratoire ──────────────────────────────────────────────────────

function BreathingOrb({ maxCycles, onComplete, guidanceText }) {
  const [countdown, setCountdown] = useState(3)
  const [isInhale,  setIsInhale]  = useState(true)
  const [finished,  setFinished]  = useState(false)
  const halfCycles  = useRef(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    const t1 = setTimeout(() => setCountdown(2), 1000)
    const t2 = setTimeout(() => setCountdown(1), 2000)
    const t3 = setTimeout(() => setCountdown(0), 3000)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (countdown > 0) return
    intervalRef.current = setInterval(() => {
      halfCycles.current += 1
      setIsInhale(v => !v)
      if (maxCycles && halfCycles.current >= maxCycles * 2) {
        clearInterval(intervalRef.current)
        setFinished(true)
        onComplete?.()
      }
    }, 5000)
    return () => clearInterval(intervalRef.current)
  }, [countdown])

  const started = countdown === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

      {/* Orbe */}
      <div style={{ position: 'relative', width: 72, height: 72, isolation: 'isolate' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 42% 38%, #fff6f2 0%, #f0c8b4 38%, #9a6070 100%)',
          transform: started && isInhale ? 'scale(1.7)' : 'scale(1)',
          boxShadow: started && isInhale
            ? '0 0 55px 22px rgba(240,175,145,0.52), 0 0 90px 36px rgba(200,130,110,0.22)'
            : '0 0 14px 4px rgba(200,140,120,0.18)',
          transition: started ? 'transform 5s ease-in-out, box-shadow 5s ease-in-out' : 'none',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2,
          willChange: 'transform', transform: 'translateZ(0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {!started ? (
            <p key={countdown} style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 26, fontWeight: 700,
              color: '#3a1818',
              margin: 0,
              animation: 'stepIn 0.25s ease both',
            }}>{countdown}</p>
          ) : (
            <p style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 11, fontWeight: 500,
              color: '#3a1818',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: 0,
              transition: 'opacity 0.8s ease',
              whiteSpace: 'nowrap',
            }}>
              {isInhale ? 'Inspirez' : 'Expirez'}
            </p>
          )}
        </div>
      </div>

      {/* Guidance */}
      <p style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 'clamp(16px, 4vw, 20px)',
        fontStyle: 'italic',
        fontWeight: 400,
        color: '#2a1e1e',
        lineHeight: 1.65,
        margin: 0,
        maxWidth: 320,
        textAlign: 'center',
      }}>
        {guidanceText ?? 'Pose ta main sur le ventre et imagine que tu gonfles un ballon de couleur.'}
      </p>

    </div>
  )
}

// ── Compte à rebours (Jour 6+) ────────────────────────────────────────────

function CountdownTimer({ duration, buttonAfter, guidanceText, guidanceList, onComplete }) {
  const [phase,         setPhase]         = useState('idle')
  const [preCount,      setPreCount]      = useState(3)
  const [remaining,     setRemaining]     = useState(duration)
  const [isInhale,      setIsInhale]      = useState(true)
  const [btnVisible,    setBtnVisible]    = useState(false)
  const [earlyFinish,   setEarlyFinish]   = useState(false)

  useEffect(() => {
    if (phase !== 'starting') return
    const t1 = setTimeout(() => setPreCount(2), 1000)
    const t2 = setTimeout(() => setPreCount(1), 2000)
    const t3 = setTimeout(() => { setPhase('running'); setIsInhale(true) }, 3000)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [phase])

  useEffect(() => {
    if (phase !== 'running') return
    const interval = setInterval(() => setIsInhale(v => !v), 5000)
    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => {
    if (phase !== 'running') return
    if (remaining <= 0) {
      setPhase('done')
      setTimeout(() => onComplete?.(), 2200)
      return
    }
    // bouton anticipé
    if (buttonAfter && !btnVisible && (duration - remaining) >= buttonAfter) {
      setBtnVisible(true)
    }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, remaining])

  function handleEarlyFinish() {
    setEarlyFinish(true)
    setPhase('done')
    setTimeout(() => onComplete?.(), 3500)
  }

  const ORB       = 130
  const isRunning = phase === 'running'
  const mins      = Math.floor(remaining / 60)
  const secs      = remaining % 60

  if (phase === 'done') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <style>{`
          @keyframes checkZoom {
            0%, 100% { transform: scale(1); }
            50%       { transform: scale(1.55); }
          }
        `}</style>
        <div style={{
          width: 110, height: 110, borderRadius: '50%',
          background: 'rgba(80,180,100,0.13)',
          border: '3px solid #50b464',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'checkZoom 0.75s ease-in-out 3 forwards',
        }}>
          <span style={{ fontSize: 50, color: '#50b464', lineHeight: 1 }}>✓</span>
        </div>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(20px, 5.5vw, 28px)',
          fontWeight: 700, color: '#0f0808', lineHeight: 1.4,
          margin: 0, textAlign: 'center',
        }}>
          {earlyFinish
            ? "C'est déjà bien, tu peux recommencer quand tu voudras."
            : 'Bravo ! Tu as pris soin de toi.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

      {/* Orbe */}
      <div style={{ position: 'relative', width: ORB, height: ORB, isolation: 'isolate' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 42% 38%, #fff6f2 0%, #f0c8b4 38%, #9a6070 100%)',
          transform: isRunning && isInhale ? 'scale(1.55)' : 'scale(1)',
          boxShadow: isRunning && isInhale
            ? '0 0 55px 22px rgba(240,175,145,0.52), 0 0 90px 36px rgba(200,130,110,0.22)'
            : '0 0 14px 4px rgba(200,140,120,0.18)',
          transition: isRunning ? 'transform 5s ease-in-out, box-shadow 5s ease-in-out' : 'none',
        }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2, willChange: 'transform', transform: 'translateZ(0)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {phase === 'starting' ? (
            <p key={preCount} style={{ fontFamily: 'Jost, sans-serif', fontSize: 36, fontWeight: 700, color: '#3a1818', margin: 0, animation: 'stepIn 0.25s ease both' }}>{preCount}</p>
          ) : (
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: isRunning ? 24 : 22, fontWeight: 700, color: '#1a0808', margin: 0, letterSpacing: '0.04em' }}>
              {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
            </p>
          )}
        </div>
      </div>

      {/* Guidance — liste ou texte */}
      {guidanceList ? (
        <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {guidanceList.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #d4e840, #7aaa88)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#1a1010',
                marginTop: 2,
              }}>{i + 1}</span>
              <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(15px, 3.8vw, 18px)', fontStyle: 'italic', color: '#2a1e1e', lineHeight: 1.55, margin: 0 }}>
                {item}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(16px, 4vw, 20px)', fontStyle: 'italic', color: '#2a1e1e', lineHeight: 1.65, margin: 0, maxWidth: 320, textAlign: 'center' }}>
          {guidanceText ?? 'Pose ta main sur le ventre et laisse ton souffle venir naturellement.'}
        </p>
      )}

      {/* Bouton Commencer (idle) ou Continuer anticipé (running) */}
      {phase === 'idle' && (
        <PrimaryButton onClick={() => { setPhase('starting'); setPreCount(3) }}>Commencer</PrimaryButton>
      )}
      {isRunning && btnVisible && (
        <div className="wof-soft">
          <PrimaryButton onClick={handleEarlyFinish}>Continuer</PrimaryButton>
        </div>
      )}
    </div>
  )
}

/// ═══════════════════════════════════════════════════════════════════════════
// PATCH 1 : remplacer EmotionalBarometer (lignes 1508–1669)
// ═══════════════════════════════════════════════════════════════════════════
 
// ── Baromètre émotionnel ───────────────────────────────────────────────────
 
const BAROMETER_STOPS = [
  { min: 0.00, max: 0.20, value: 'fatigue', label: 'Fatigué·e', emoji: '😔', color: '#d95c5c', fixedIdx: 0 },
  { min: 0.20, max: 0.40, value: 'stresse', label: 'Stressé·e', emoji: '😰', color: '#e07550', fixedIdx: 0 },
  { min: 0.40, max: 0.60, value: 'neutre',  label: 'Neutre',    emoji: '😐', color: '#e8c86a', fixedIdx: 1 },
  { min: 0.60, max: 0.80, value: 'calme',   label: 'Calme',     emoji: '😌', color: '#9acc7a', fixedIdx: 2 },
  { min: 0.80, max: 1.01, value: 'bien',    label: 'Bien',      emoji: '🙂', color: '#6aaa7a', fixedIdx: 2 },
]
 
const FIXED_LABELS = [
  { emoji: '😔', label: 'Fatigué·e' },
  { emoji: '😐', label: 'Neutre'    },
  { emoji: '😌', label: 'Bien'      },
]
 
function EmotionalBarometer({ answerKey, onAnswer, thankPhrase }) {
  const [pos,        setPos]        = useState(0.5)
  const [touched,    setTouched]    = useState(false)
  const [ctaVisible, setCtaVisible] = useState(false)
  const [leaving,    setLeaving]    = useState(false)
  const trackRef  = useRef(null)
  const dragging  = useRef(false)
  const ctaTimer  = useRef(null)
  const stopRef   = useRef(null)

  useEffect(() => () => clearTimeout(ctaTimer.current), [])

  useEffect(() => {
    if (!ctaVisible) return
    const t = setTimeout(() => {
      setLeaving(true)
      setTimeout(() => onAnswer(answerKey, stopRef.current.value), 700)
    }, 2000)
    return () => clearTimeout(t)
  }, [ctaVisible])
 
  function getStop(p) {
    return BAROMETER_STOPS.find(s => p >= s.min && p < s.max) ?? BAROMETER_STOPS[4]
  }
 
  function posFromPointer(e) {
    const rect = trackRef.current.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }
 
  function handlePointerDown(e) {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = posFromPointer(e)
    setPos(p)
    if (!touched) {
      setTouched(true)
      ctaTimer.current = setTimeout(() => setCtaVisible(true), 800)
    }
  }
 
  function handlePointerMove(e) {
    if (!dragging.current) return
    setPos(posFromPointer(e))
  }
 
  function handlePointerUp() { dragging.current = false }
 
  const stop = getStop(pos)
  stopRef.current = stop
 
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: leaving ? 0 : 1, transition: 'opacity 700ms ease' }}>
 
      {/* Phrase intro */}
      <p style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 'clamp(15px, 3.8vw, 18px)',
        fontStyle: 'italic',
        color: '#1a1010',
        lineHeight: 1.7,
        textAlign: 'center',
        margin: '0 0 16px',
      }}>
        Il n'y a pas de bonne réponse. Juste ce qui est là aujourd'hui.
      </p>
 
      {/* Question */}
      <p style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 'clamp(20px, 5.5vw, 26px)',
        fontWeight: 500,
        color: '#0f0808',
        lineHeight: 1.45,
        textAlign: 'center',
        margin: '0 0 36px',
      }}>
        Comment tu te sens, là, maintenant&nbsp;?
      </p>

      {/* Slider */}
      <div style={{ width: '100%', padding: '0 4px', boxSizing: 'border-box', marginTop: 20 }}>
 
        {/* Track */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            position: 'relative',
            height: 10,
            borderRadius: 10,
            background: 'linear-gradient(to right, #d95c5c, #e8c86a 50%, #6aaa7a)',
            cursor: 'pointer',
            userSelect: 'none',
            touchAction: 'none',
          }}
        >
          {/* Curseur */}
          <div style={{
            position: 'absolute',
            left: `${pos * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            width: 32,
            height: 32,
          }}>
            {/* Bulle label dynamique */}
            <div style={{
              position: 'absolute',
              bottom: 38,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ffffff',
              border: `1px solid ${stop.color}55`,
              borderRadius: 8,
              padding: '4px 12px',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'Jost, sans-serif',
              color: '#1a1010',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
              transition: 'border-color 0.3s ease',
            }}>
              {stop.emoji} {stop.label}
              {/* Petite flèche vers le bas */}
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: `5px solid ${stop.color}55`,
              }} />
            </div>
 
            {/* Halo pulsant */}
            <div style={{
              position: 'absolute',
              width: 60, height: 60,
              borderRadius: '50%',
              top: -14, left: -14,
              backgroundColor: stop.color,
              animation: 'pulseCursor 4.5s ease-in-out infinite',
              transition: 'background-color 0.4s ease',
            }} />
 
            {/* Orbe principal */}
            <div style={{
              width: 32, height: 32,
              borderRadius: '50%',
              backgroundColor: stop.color,
              boxShadow: `inset 0 0 14px rgba(255,255,255,0.75), 0 2px 18px 6px ${stop.color}80`,
              transition: 'background-color 0.4s ease',
            }} />
          </div>
        </div>
 
        {/* Labels fixes — 3 positions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          {FIXED_LABELS.map((f, i) => {
            const isActive = stop.fixedIdx === i
            return (
              <div key={f.label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'opacity 0.3s ease',
                opacity: isActive ? 1 : 0.38,
              }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{f.emoji}</span>
                <span style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 11, fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#1a1010' : '#8a7070',
                  letterSpacing: '0.02em',
                  transition: 'color 0.3s ease, font-weight 0.3s ease',
                }}>
                  {f.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
 
      {/* CTA */}
      {ctaVisible && (
        <div className="wof-soft" style={{ marginTop: 28 }}>
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(18px, 4.5vw, 22px)',
            fontWeight: 600,
            color: '#0f0808',
            margin: 0,
            textAlign: 'center',
          }}>
            {thankPhrase ?? 'Merci pour cette honnêteté.'}
          </p>
        </div>
      )}
 
    </div>
  )
}

// ── ACCUEIL SLIDE 1 ────────────────────────────────────────────────────────

function DayAccueilSlide1({ answerKey, onAnswer, onScreenChange }) {
  const [subSlide, setSubSlide] = useState(0)
  const [phase,    setPhase]    = useState(0)
  const [orbDone,  setOrbDone]  = useState(false)

  useEffect(() => { setOrbDone(false) }, [subSlide])

  useEffect(() => {
    if (!orbDone) return
    const t = setTimeout(() => onAnswer(answerKey, 'neutre'), 3500)
    return () => clearTimeout(t)
  }, [orbDone])

  useEffect(() => {
    const screens = ['accueil_intro', 'accueil_arret', 'accueil_respiration', 'introspection']
    onScreenChange?.(screens[subSlide] ?? 'accueil_intro')
  }, [subSlide])

  useEffect(() => {
    setPhase(0)
    let timers
    if (subSlide === 0) {
      timers = [
        setTimeout(() => setPhase(1), 200),
        setTimeout(() => setPhase(2), 400),
        setTimeout(() => setPhase(3), 600),
        setTimeout(() => setPhase(4), 800),
      ]
    } else if (subSlide === 1) {
      timers = [
        setTimeout(() => setPhase(1), 200),
        setTimeout(() => setPhase(2), 500),
      ]
    } else if (subSlide === 2) {
      timers = [
        setTimeout(() => setPhase(1), 200),
        setTimeout(() => setPhase(2), 600),
      ]
    } else {
      timers = [
        setTimeout(() => setPhase(1), 150),
      ]
    }
    return () => timers.forEach(clearTimeout)
  }, [subSlide])

/* ── SLIDE 0 — INTRO ─────────────────────────────────────────── */
  const T = 'opacity 920ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 920ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'

  function fadeStyle(visible) {
    return {
      opacity:    visible ? 1 : 0,
      transition: T,
    }
  }

  if (subSlide === 0) {
    return (
      <div className="wof-soft" style={{ textAlign: 'center', padding: '24px 20px 24px' }}>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(19px, 4.8vw, 26px)',
          fontWeight: 500,
          color: '#0f0808',
          lineHeight: 1.3,
          margin: '0 0 16px',
          letterSpacing: '-0.01em',
          ...fadeStyle(true),
        }}>
          Tu n'es pas ici par hasard.
        </p>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(19px, 4.8vw, 26px)',
          fontStyle: 'italic',
          color: '#2a1e1e',
          lineHeight: 1.5,
          margin: '0 0 14px',
          ...fadeStyle(phase >= 1),
        }}>
          Quelque chose en toi sait qu'il est temps de ralentir.
        </p>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(19px, 4.8vw, 26px)',
          fontStyle: 'italic',
          color: '#2a1e1e',
          lineHeight: 1.5,
          margin: '0 0 14px',
          ...fadeStyle(phase >= 2),
        }}>
          Pas pour faire plus. Mais pour faire autrement.
        </p>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(19px, 4.8vw, 26px)',
          fontStyle: 'italic',
          color: '#2a1e1e',
          lineHeight: 1.5,
          margin: '0 0 20px',
          ...fadeStyle(phase >= 3),
        }}>
          Ce que tu vas commencer ici… se construit un jour à la fois.
        </p>

        <div style={{ ...fadeStyle(phase >= 4), pointerEvents: phase >= 4 ? 'auto' : 'none' }}>
          <PrimaryButton onClick={() => onAnswer(answerKey, 'neutre')}>
            Commencer
          </PrimaryButton>
        </div>

      </div>
    )
  }

  /* ── SLIDE 1 — ARRÊT ─────────────────────────────────────────── */
  if (subSlide === 1) {
    return (
      <div className="wof-soft" style={{ textAlign: 'center', padding: '24px 20px 24px' }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(28px, 7vw, 46px)',
          fontWeight: 500,
          color: '#0f0808',
          lineHeight: 1.15,
          margin: '0 0 20px',
          letterSpacing: '-0.01em',
          ...fadeStyle(true),
        }}>
          Tu es là.
        </h1>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(19px, 5vw, 28px)',
          fontStyle: 'italic',
          color: '#2a1e1e',
          lineHeight: 1.5,
          margin: '0 0 24px',
          ...fadeStyle(phase >= 1),
        }}>
          Et pour une fois… tu n'as rien à faire de plus.
        </p>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(19px, 5vw, 28px)',
          fontWeight: 600,
          color: '#0f0808',
          lineHeight: 1.5,
          margin: '0 0 24px',
          ...fadeStyle(phase >= 1),
        }}>
          Juste être là.
        </p>

        <div style={{ ...fadeStyle(phase >= 2), pointerEvents: phase >= 2 ? 'auto' : 'none' }}>
          <PrimaryButton onClick={() => setSubSlide(2)}>
            Prendre un instant
          </PrimaryButton>
        </div>
      </div>
    )
  }

  /* ── SLIDE 2 — CONNEXION ──────────────────────────────────────── */
  if (subSlide === 2) {
    return (
      <div className="wof-soft" style={{ textAlign: 'center', padding: '24px 20px 24px' }}>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(20px, 5.2vw, 30px)',
          fontWeight: 400,
          color: '#0f0808',
          lineHeight: 1.4,
          margin: '0 0 24px',
          ...fadeStyle(true),
        }}>
          Prends simplement un instant.
        </p>

        <div style={{ marginBottom: orbDone ? 28 : 36 }}>
          <BreathingOrb maxCycles={3} onComplete={() => setOrbDone(true)} />
        </div>

        {orbDone && (
          <div className="wof-soft" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
            <p style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(20px, 5.5vw, 26px)',
              fontWeight: 600,
              color: '#0f0808',
              lineHeight: 1.65,
              margin: 0,
              textAlign: 'center',
            }}>
              C'est déjà suffisant. Ton corps commence à ralentir.
            </p>
            <PrimaryButton onClick={() => onAnswer(answerKey, 'neutre')}>
              Continuer →
            </PrimaryButton>
          </div>
        )}
      </div>
    )
  }

  /* ── SLIDE 3 — BAROMÈTRE ÉMOTIONNEL ─────────────────────────── */
  return (
    <div className="wof-soft" style={{ padding: '16px 20px 20px' }}>
      <EmotionalBarometer answerKey={answerKey} onAnswer={onAnswer} />
    </div>
  )
}

// ── Mise en condition (jours 2-7) ──────────────────────────────────────────

function ConditioningAccueil({ data, answers, onConditioningComplete, onScreenChange }) {
  const [subSlide,   setSubSlide]   = useState(0)
  const [ctaReady,   setCtaReady]   = useState(false)
  const [tagVisible, setTagVisible] = useState(false)
  const [orbDone,    setOrbDone]    = useState(false)
  const orbPhraseRef = useRef(null)

  useEffect(() => {
    const screens = ['accueil_intro', 'accueil_respiration', 'accueil_barometer']
    onScreenChange?.(screens[subSlide] ?? 'accueil_intro')
  }, [subSlide])

  useEffect(() => {
    setCtaReady(false)
    setTagVisible(false)
    setOrbDone(false)
    let t1, t2
    if (subSlide === 0) {
      t1 = setTimeout(() => setTagVisible(true), 1000)
      t2 = setTimeout(() => setCtaReady(true), data.pauseSeconds * 1000)
    }
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [subSlide, data.pauseSeconds])

  const prevNote = data.getPreviousNote?.(answers) || data.getNarrativeNote?.(answers)

  /* ── Sub-slide 0 : accueil du jour ─── */
  if (subSlide === 0) {
    return (
      <div className="wof-soft" style={{ textAlign: 'center', padding: '24px 20px 24px' }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(22px, 6vw, 34px)',
          fontWeight: 500,
          color: '#0f0808',
          lineHeight: 1.25,
          margin: '0 0 14px',
          letterSpacing: '-0.01em',
        }}>
          {data.headline}
        </h1>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(19px, 5vw, 26px)',
          fontWeight: 700,
          color: '#0f0808',
          margin: '0 0 14px',
          opacity: tagVisible ? 1 : 0,
          transform: tagVisible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 700ms ease, transform 700ms ease',
        }}>
          {data.tagLine ?? 'Et ça compte.'}
        </p>

        {prevNote && (
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(19px, 5vw, 28px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: '#2a1e1e',
            lineHeight: 1.4,
            margin: '0 0 10px',
          }}>
            {prevNote}
          </p>
        )}

        {data.subtitle && (
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(19px, 5vw, 28px)',
            fontStyle: 'italic',
            color: '#2a1e1e',
            lineHeight: 1.4,
            margin: data.subtitleExtra ? '0 0 6px' : '0 0 20px',
          }}>
            {data.subtitle}
          </p>
        )}

        {data.subtitleExtra && (
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(19px, 5vw, 28px)',
            fontWeight: 700,
            color: '#0f0808',
            lineHeight: 1.4,
            margin: data.subtitleFinal ? '0 0 6px' : '0 0 20px',
          }}>
            {data.subtitleExtra}
          </p>
        )}

        {data.subtitleFinal && (
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(24px, 6.5vw, 36px)',
            fontWeight: 700,
            color: '#0f0808',
            lineHeight: 1.3,
            margin: '0 0 20px',
          }}>
            {data.subtitleFinal}
          </p>
        )}

        {ctaReady && (
          <div className="wof-soft">
            <PrimaryButton onClick={() => data.skipBarometer ? onConditioningComplete(null) : setSubSlide(2)}>
              Commencer
            </PrimaryButton>
          </div>
        )}
      </div>
    )
  }

  /* ── Sub-slide 1 : respiration ─── */
  if (subSlide === 1) {
    return (
      <div className="wof-soft" style={{ textAlign: 'center', padding: '24px 20px 24px' }}>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(19px, 5vw, 28px)',
          fontWeight: 400,
          fontStyle: 'italic',
          color: '#0f0808',
          lineHeight: 1.4,
          margin: '0 0 10px',
        }}>
          Reviens à ton souffle.
        </p>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(19px, 5vw, 28px)',
          fontWeight: 700,
          color: '#0f0808',
          lineHeight: 1.4,
          margin: '0 0 20px',
        }}>
          {data.breatheIntro ?? "Aujourd'hui, observe-le un peu plus finement."}
        </p>

        <div style={{ marginBottom: orbDone ? 16 : 24 }}>
          {data.timerDuration ? (
            <CountdownTimer duration={data.timerDuration} buttonAfter={data.timerButtonAfter} guidanceText={data.orbGuidance} guidanceList={data.orbGuidanceList} onComplete={() => setOrbDone(true)} />
          ) : (
            <BreathingOrb maxCycles={4} onComplete={() => setOrbDone(true)} guidanceText={data.orbGuidance} />
          )}
        </div>

        {orbDone && (
          <div ref={el => {
            orbPhraseRef.current = el
            if (el) setTimeout(() => {
              const scroll = document.getElementById('wof-scroll')
              if (scroll) scroll.scrollTo({ top: scroll.scrollHeight, behavior: 'smooth' })
            }, 100)
          }}>
            {!data.timerDuration && (
              <p className="wof-soft" style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: 'clamp(19px, 5vw, 28px)',
                fontWeight: 700,
                color: '#0f0808',
                lineHeight: 1.4,
                margin: '0 0 16px',
              }}>
                {data.orbDonePhrase ?? 'Ton souffle devient plus stable.'}
              </p>
            )}
            <div className="wof-soft" style={{ marginTop: data.timerDuration ? 16 : 0 }}>
              <PrimaryButton onClick={() => data.skipBarometer ? onConditioningComplete(null) : setSubSlide(2)}>
                {data.timerDuration ? 'Continuer' : data.skipBarometer ? 'Ressentir mon énergie' : 'Observer'}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ── Sub-slide 2 : baromètre émotionnel ─── */
  return (
    <div className="wof-soft" style={{ padding: '16px 20px 20px' }}>
      <EmotionalBarometer
        answerKey="conditioning_feel"
        onAnswer={(_, value) => onConditioningComplete(value)}
        thankPhrase={data.barometerThankPhrase}
      />
    </div>
  )
}

// ── ACCUEIL ────────────────────────────────────────────────────────────────

function DayAccueil({ data, introspectionData, answers, onAnswerFromAccueil, onConditioningComplete, onNext, onScreenChange }) {
  const isSlide1       = data.layout === 'slide1'
  const isConditioning = data.conditioning === true

  const [ctaReady,      setCtaReady]      = useState(false)
  const [flowerVisible, setFlowerVisible] = useState(false)

  useEffect(() => {
    if (isSlide1 || isConditioning) return
    const t1 = setTimeout(() => setCtaReady(true), data.pauseSeconds * 1000)
    const t2 = (data.showFlowerReveal || data.showFlowerFull)
      ? setTimeout(() => setFlowerVisible(true), (data.pauseSeconds + 0.2) * 1000)
      : null
    return () => { clearTimeout(t1); if (t2) clearTimeout(t2) }
  }, [isSlide1, isConditioning, data.pauseSeconds, data.showFlowerReveal, data.showFlowerFull])

  if (isSlide1) {
    return (
      <DayAccueilSlide1
        answerKey={introspectionData?.answerKey}
        onAnswer={onAnswerFromAccueil}
        onScreenChange={onScreenChange}
      />
    )
  }

  if (isConditioning) {
    return (
      <ConditioningAccueil
        data={data}
        answers={answers}
        onConditioningComplete={onConditioningComplete}
        onScreenChange={onScreenChange}
      />
    )
  }


  return (
    <div className="wof-in" style={{ textAlign: 'center', padding: '28px 20px 16px' }}>
      <h1 style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 'clamp(22px, 5vw, 32px)',
        fontWeight: 400,
        color: '#000',
        lineHeight: 1.3,
        margin: '0 0 16px',
        letterSpacing: '-0.01em',
      }}>
        {data.headline}
      </h1>

      {(data.showFlowerReveal || data.showFlowerFull) && flowerVisible && (
        <div className="wof-in" style={{ margin: '20px auto' }}>
          <div className="wof-fl">
            <FlowerSVG size={data.showFlowerFull ? 160 : 140} animated />
          </div>
        </div>
      )}

      {ctaReady && (
        <div className="wof-in" style={{ marginTop: 28 }}>
          <PrimaryButton onClick={onNext}>
            {data.showFlowerReveal || data.showFlowerFull ? 'Continuer' : 'Je suis prêt·e'}
          </PrimaryButton>
        </div>
      )}
    </div>
  )
}

// ── Batterie d'énergie ─────────────────────────────────────────────────────

const BATTERY_LEVELS = [
  { value: 'vive',     label: 'Vive',     color: '#78d458', glow: 'rgba(120,212,88,0.55)'  },
  { value: 'bonne',    label: 'Bonne',    color: '#c4d830', glow: 'rgba(196,216,48,0.45)'  },
  { value: 'correcte', label: 'Correcte', color: '#e8b828', glow: 'rgba(232,184,40,0.4)'   },
  { value: 'basse',    label: 'Basse',    color: '#d07030', glow: 'rgba(208,112,48,0.4)'   },
  { value: 'vide',     label: 'Vide',     color: '#b03838', glow: 'rgba(176,56,56,0.35)'   },
]

function EnergyBattery({ answerKey, onAnswer, onBack }) {
  const [selected, setSelected] = useState(null)
  const [leaving,  setLeaving]  = useState(false)
  const selectedIdx = selected ? BATTERY_LEVELS.findIndex(l => l.value === selected) : -1

  function handleSelect(value) {
    if (selected) return
    setSelected(value)
    setTimeout(() => setLeaving(true),             4000)
    setTimeout(() => onAnswer(answerKey, value),   4700)
  }

  return (
    <div className="wof-in" style={{ padding: '8px 20px 16px' }}>
      <BackButton onClick={onBack} />

      <h2 style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 'clamp(18px, 4.5vw, 24px)',
        fontWeight: 400,
        color: '#000',
        lineHeight: 1.45,
        margin: '8px 0 40px',
        textAlign: 'center',
        opacity: leaving ? 0 : 1, transition: 'opacity 700ms ease',
      }}>
        Ton énergie en ce moment est plutôt…
      </h2>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 28, alignItems: 'center' }}>

        {/* Corps de la pile */}
        <div>
          {/* Borne + */}
          <div style={{
            width: 26, height: 8,
            background: 'linear-gradient(to bottom, #aaa 0%, #666 100%)',
            borderRadius: '4px 4px 0 0',
            margin: '0 auto',
          }} />
          {/* Corps */}
          <div style={{
            width: 68,
            borderRadius: 22,
            overflow: 'hidden',
            border: '2px solid rgba(60,40,40,0.22)',
            boxShadow: '0 8px 36px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.06)',
          }}>
            {BATTERY_LEVELS.map((level, i) => {
              const isFilled  = selectedIdx !== -1 && i >= selectedIdx
              const isSelected = selected === level.value
              return (
                <div
                  key={level.value}
                  onClick={() => handleSelect(level.value)}
                  style={{
                    height: 36,
                    background: isFilled
                      ? isSelected
                        ? `linear-gradient(to bottom, ${level.color}ff, ${level.color}cc)`
                        : `${level.color}88`
                      : 'rgba(18,10,10,0.88)',
                    borderBottom: i < BATTERY_LEVELS.length - 1
                      ? '1px solid rgba(255,255,255,0.05)'
                      : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.4s ease',
                    boxShadow: isSelected ? `inset 0 0 20px ${level.glow}` : 'none',
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* Étiquettes */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {BATTERY_LEVELS.map((level, i) => {
            const isFilled   = selectedIdx !== -1 && i >= selectedIdx
            const isSelected = selected === level.value
            return (
              <div
                key={level.value}
                onClick={() => handleSelect(level.value)}
                style={{
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  paddingLeft: 8,
                }}
              >
                <span style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  color: isFilled ? level.color : 'rgba(80,55,55,0.38)',
                  transition: 'color 0.35s ease, opacity 0.35s ease',
                  opacity: isSelected ? 1 : isFilled ? 0.75 : 0.45,
                  letterSpacing: '0.02em',
                }}>
                  {level.label}
                </span>
              </div>
            )
          })}
        </div>

      </div>

      {selected && (
        <div className="wof-soft" style={{ marginTop: 36, textAlign: 'center' }}>
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(20px, 5.5vw, 26px)',
            fontWeight: 700,
            color: '#0f0808',
            margin: 0,
          }}>
            Merci pour cette justesse.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Découverte Ma Fleur (Jour 6) ───────────────────────────────────────────

// ── Modal Ma Fleur — données réelles Supabase ──────────────────────────────

function MaFleurLiveModal({ onClose }) {
  const { user } = useAuth()
  const userId   = user?.id

  const [plantData,   setPlantData]   = useState(null)
  const [settings,    setSettings]    = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [openInfo,    setOpenInfo]    = useState(null)

  const ZONE_KEYS = [
    { key: 'zone_racines',  label: 'Racines',  emoji: '🌱', color: ZONE_COLORS.racines,
      info: "Ton ancrage fondamental. Elle évalue ta stabilité, ton sentiment de sécurité et ton connexion à l'essentiel du quotidien." },
    { key: 'zone_tige',     label: 'Tige',     emoji: '🌿', color: ZONE_COLORS.tige,
      info: "Ton structure intérieure. Elle mesure ta posture mentale et ta capacité à tenir debout, même sous la pression." },
    { key: 'zone_feuilles', label: 'Feuilles', emoji: '🍃', color: ZONE_COLORS.feuilles,
      info: "Ta capacité à laisser passer. Elle évalue comment tu accueilles et relâches les émotions sans t'y accrocher." },
    { key: 'zone_fleurs',   label: 'Fleurs',   emoji: '🌸', color: ZONE_COLORS.fleurs,
      info: "Ton ouverture et ton vitalité. Elle reflète ta capacité à t'offrir de l'espace et à recevoir ce qui est bon pour toi." },
    { key: 'zone_souffle',  label: 'Souffle',  emoji: '🌬️', color: ZONE_COLORS.souffle,
      info: "Ton lien au monde. Il mesure ton connexion aux autres et à ce qui te dépasse — le fil invisible entre toi et le reste." },
  ]

  async function fetchData() {
    if (!userId) { setLoading(false); return }
    setLoading(true)

    try {
      const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // Promise.allSettled : une requête qui échoue ne bloque pas les autres
      const [plantRes, settingsRes, ritualsRes, profileRes] = await Promise.allSettled([
        supabase
          .from('plants')
          .select('health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle, date')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('garden_settings')
          .select('petal_color1, petal_color2, petal_shape, sunrise_h, sunrise_m, sunset_h, sunset_m')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('rituals')
          .select('zone, health_delta')
          .eq('user_id', userId)
          .gte('completed_at', since7),
        supabase
          .from('profiles')
          .select('week_one_data')
          .eq('id', userId)
          .maybeSingle(),
      ])

      const plant0   = plantRes.status   === 'fulfilled' ? (plantRes.value.data   ?? null) : null
      const settings0= settingsRes.status === 'fulfilled' ? (settingsRes.value.data ?? null) : null
      const rituals  = ritualsRes.status  === 'fulfilled' ? (ritualsRes.value.data  ?? [])  : []
      const profile0 = profileRes.status  === 'fulfilled' ? (profileRes.value.data  ?? null) : null

      let plant = plant0

      // Fallback : si la santé en base est inférieure à l'attendu (jours faits sur
      // des dates séparées avant le fix d'accumulation), on restitue le minimum.
      // Règle : chaque jour complété = 35% sur sa zone (Math.max, pas +35).
      // Les rituels (+5% chacun) sont déjà stockés dans plants via handleToggleRitual
      // et ne sont pas recalculés ici (ils restent dans la valeur base si la table
      // est correcte, et sont perdus uniquement en cas de corruption — acceptable).
      const completed = profile0?.week_one_data?.completedDays ?? []
      if (completed.length > 0) {
        const DAY_ZONE = { 1: 'zone_racines', 2: 'zone_tige', 3: 'zone_feuilles', 4: 'zone_fleurs', 5: 'zone_souffle' }
        const DAY_MIN  = { 1: 40, 2: 48, 3: 55, 4: 60, 5: 65 }
        const base = plant ?? { zone_racines: 0, zone_tige: 0, zone_feuilles: 0, zone_fleurs: 0, zone_souffle: 0 }
        const zones = {
          zone_racines:  base.zone_racines  ?? 0,
          zone_tige:     base.zone_tige     ?? 0,
          zone_feuilles: base.zone_feuilles ?? 0,
          zone_fleurs:   base.zone_fleurs   ?? 0,
          zone_souffle:  base.zone_souffle  ?? 0,
        }
        completed.forEach(d => {
          const key = DAY_ZONE[d]
          const min = DAY_MIN[d] ?? 35
          if (key) zones[key] = Math.min(100, Math.max(zones[key], min))
          if (d === 6) Object.keys(zones).forEach(k => { zones[k] = Math.min(100, Math.max(zones[k], 65)) })
          if (d === 7) Object.keys(zones).forEach(k => { zones[k] = Math.min(100, Math.max(zones[k], 75)) })
        })
        const RITUAL_ZONE_MAP = { racines: 'zone_racines', tige: 'zone_tige', feuilles: 'zone_feuilles', fleurs: 'zone_fleurs', souffle: 'zone_souffle' }
        rituals.forEach(r => {
          const key = RITUAL_ZONE_MAP[r.zone]
          if (key && r.health_delta > 0) zones[key] = Math.min(100, zones[key] + r.health_delta)
        })
        const newHealth = Math.round(Object.values(zones).reduce((a, b) => a + b, 0) / 5)
        if (newHealth > (plant?.health ?? 0)) {
          plant = { ...zones, health: newHealth, date: plant?.date ?? null, _fromWeekData: !plant }
          const today = new Date().toISOString().split('T')[0]
          Promise.resolve(supabase.from('plants')
            .upsert({ user_id: userId, date: today, ...zones, health: newHealth }, { onConflict: 'user_id,date' }))
            .catch(() => {})
        }
      }

      setPlantData(plant)
      setSettings(settings0)
    } catch (_) {
      // En cas d'erreur inattendue, on affiche quand même le modal sans data
    }

    setLastRefresh(new Date())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [userId])

  const health = plantData?.health ?? 65

  const gardenSettings = settings ? {
    petalColor1: settings.petal_color1 || DEFAULT_GARDEN_SETTINGS.petalColor1,
    petalColor2: settings.petal_color2 || DEFAULT_GARDEN_SETTINGS.petalColor2,
    petalShape:  settings.petal_shape  || DEFAULT_GARDEN_SETTINGS.petalShape,
    sunriseH:    settings.sunrise_h    ?? DEFAULT_GARDEN_SETTINGS.sunriseH,
    sunriseM:    settings.sunrise_m    ?? DEFAULT_GARDEN_SETTINGS.sunriseM,
    sunsetH:     settings.sunset_h     ?? DEFAULT_GARDEN_SETTINGS.sunsetH,
    sunsetM:     settings.sunset_m     ?? DEFAULT_GARDEN_SETTINGS.sunsetM,
  } : DEFAULT_GARDEN_SETTINGS

  const stageLabel =
    health < 8  ? 'Graine'      :
    health < 25 ? 'Pousse'      :
    health < 50 ? 'Jeune plant' :
    health < 75 ? 'En bouton'   :
                  'En fleur'

  const healthColor =
    health < 30 ? '#c8a070' :
    health < 60 ? '#a0b870' :
                  '#70b888'

  const dateLabel = plantData?._fromWeekData
    ? 'Calculé depuis ta semaine'
    : plantData?._fromRituals
      ? 'Calculé depuis tes rituels'
      : plantData?.date
        ? new Date(plantData.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
        : new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,8,18,0.65)',
        backdropFilter: 'blur(10px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="wof-in"
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#faf5f2',
          borderRadius: '24px 24px 0 0',
          padding: '20px 0 52px',
          maxHeight: '92dvh',
          overflowY: 'auto',
          boxShadow: '0 -8px 40px rgba(80,30,60,0.22)',
        }}
      >
        {/* Poignée */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#d8c4cc', margin: '0 auto 18px' }} />

        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 16, padding: '0 24px' }}>
          <p style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 11, fontWeight: 500,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#1a1010', margin: '0 0 4px',
          }}>
            Ma Fleur
          </p>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(26px, 6.5vw, 32px)',
            fontWeight: 400, fontStyle: 'italic',
            color: '#2a1828', margin: '0 0 4px',
          }}>
            Mon Jardin Intérieur
          </h2>
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center', padding: '56px 0',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 18, fontStyle: 'italic', color: '#1a1010',
          }}>
            Ta fleur arrive…
          </div>
        ) : !plantData ? (
          <div style={{
            textAlign: 'center', padding: '48px 32px',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 18, fontStyle: 'italic', color: '#1a1010', lineHeight: 1.7,
          }}>
            Ta fleur prend racine.<br />
            Commencez ton bilan demain matin<br />pour la voir grandir.
          </div>
        ) : (
          <>
            {/* ── PlantSVG bord-à-bord ── */}
            <div style={{
              position: 'relative',
              overflow: 'hidden',
              minHeight: 340,
              borderRadius: '18px 18px 0 0',
            }}>
              {/* Info overlay */}
              <div style={{
                position: 'absolute', top: 14, left: 16, zIndex: 3,
                color: 'rgba(255,255,255,0.92)',
              }}>
                <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                  {Math.round(health)}<span style={{ fontSize: 13, fontWeight: 400 }}>%</span>
                </div>
                <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7, marginTop: 2 }}>
                  Vitalité
                </div>
                <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, opacity: 0.55, marginTop: 4, textTransform: 'capitalize' }}>
                  {dateLabel}
                </div>
              </div>

              {/* Stade badge */}
              <div style={{
                position: 'absolute', top: 14, right: 16, zIndex: 3,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: 100, padding: '4px 12px',
                fontFamily: 'Jost, sans-serif', fontSize: 12,
                color: 'rgba(255,255,255,0.88)',
                letterSpacing: '0.06em',
              }}>
                {stageLabel}
              </div>

              {/* PlantSVG */}
              <div style={{ width: '100%', minHeight: 340, lineHeight: 0 }}>
                <PlantSVG
                  health={health}
                  gardenSettings={gardenSettings}
                  lumensLevel="halo"
                  clearSky={true}
                />
              </div>

              {/* Dégradé de fondu vers le background du modal */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 90,
                background: 'linear-gradient(to bottom, transparent, #faf5f2)',
                zIndex: 2,
                pointerEvents: 'none',
              }} />
            </div>

            {/* ── 3 boutons features ── */}
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                {
                  icon: '🌹',
                  label: 'Bilan du matin',
                  desc: 'Évaluez tes 5 zones en quelques minutes',
                  color: '#a07060',
                  bg: 'rgba(184,120,100,0.08)',
                  border: 'rgba(184,120,100,0.22)',
                  info: "Chaque matin, répondez à dix questions sur tes cinq zones. En quelques minutes, ta fleur s'adapte et reflète fidèlement ton état du jour.",
                },
                {
                  icon: '⚡',
                  label: 'Action rapide',
                  desc: 'Un rituel ciblé en 1 minute',
                  color: '#5878a8',
                  bg: 'rgba(88,120,168,0.08)',
                  border: 'rgba(88,120,168,0.22)',
                  info: "Quand le temps manque, un rituel d'une minute reste toujours disponible. Il cible la zone qui en a le plus besoin et maintient ton jardin vivant, même les jours chargés.",
                },
                {
                  icon: '🌱',
                  label: 'Boîte à Graines',
                  desc: "Notez ce qui s\u2019est bien pass\u00e9 aujourd\u2019hui",
                  color: '#507860',
                  bg: 'rgba(80,120,96,0.08)',
                  border: 'rgba(80,120,96,0.22)',
                  info: "Le soir, notez une chose positive de ton journée. Chaque graine plantée nourrit ton estime de toi-même et renforce ton ancrage dans le positif.",
                },
              ].map(f => (
                <div key={f.label}
                  onClick={() => setOpenInfo(openInfo === f.label ? null : f.label)}
                  style={{
                    padding: '13px 16px',
                    background: f.bg,
                    border: `1.5px solid ${f.border}`,
                    borderRadius: 14,
                    cursor: 'pointer',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{f.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 17, fontWeight: 700, color: '#1a1010', marginBottom: 3 }}>
                        {f.label}
                      </div>
                      <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 16, fontStyle: 'italic', color: '#3a2828', lineHeight: 1.35 }}>
                        {f.desc}
                      </div>
                    </div>
                    <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: f.color, background: `${f.bg}`, border: `1px solid ${f.border}`, borderRadius: 100, padding: '4px 9px', flexShrink: 0 }}>
                      INFOS
                    </span>
                  </div>
                  {openInfo === f.label && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${f.border}`, fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 16, fontStyle: 'italic', color: '#1a1010', lineHeight: 1.6 }}>
                      {f.info}
                    </div>
                  )}
                </div>
              ))}
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#1a1010', textAlign: 'center', margin: '4px 0 0', letterSpacing: '0.04em' }}>
                Disponibles dans Mon Jardin → Ma Fleur
              </p>
            </div>

            {/* ── Cards zones — grille 2 colonnes (flip 3D) ── */}
            <div style={{
              padding: '0 16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}>
              {ZONE_KEYS.map(z => {
                const val = Math.round(plantData[z.key] ?? 0)
                const flipped = openInfo === z.key
                return (
                  <div
                    key={z.key}
                    onClick={() => setOpenInfo(flipped ? null : z.key)}
                    style={{
                      perspective: 600,
                      height: 160,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
                      transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}>
                      {/* ── RECTO ── */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        background: `${z.color}14`,
                        border: `1.5px solid ${z.color}44`,
                        borderRadius: 16,
                        padding: '14px 14px 12px',
                        display: 'flex', flexDirection: 'column',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: `${z.color}28`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 19,
                          }}>
                            {z.emoji}
                          </div>
                          <span style={{
                            fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 700,
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            color: z.color, background: `${z.color}20`,
                            border: `1px solid ${z.color}44`,
                            borderRadius: 100, padding: '3px 8px',
                          }}>
                            INFOS
                          </span>
                        </div>
                        <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 17, fontWeight: 700, color: '#1a1010', marginBottom: 2 }}>
                          {z.label}
                        </div>
                        <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 26, fontWeight: 700, color: z.color, lineHeight: 1, marginBottom: 8 }}>
                          {val}<span style={{ fontSize: 15, fontWeight: 500 }}> %</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: `${z.color}22`, overflow: 'hidden', marginTop: 'auto' }}>
                          <div style={{ height: '100%', width: `${val}%`, borderRadius: 3, background: z.color, transition: 'width 1.4s cubic-bezier(0.4,0,0.2,1)' }} />
                        </div>
                      </div>

                      {/* ── VERSO ── */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: `${z.color}22`,
                        border: `1.5px solid ${z.color}66`,
                        borderRadius: 16,
                        padding: '14px 14px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                        }}>
                          <span style={{ fontSize: 16 }}>{z.emoji}</span>
                          <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 700, color: z.color }}>
                            {z.label}
                          </span>
                        </div>
                        <div style={{
                          fontFamily: 'Cormorant Garamond, Georgia, serif',
                          fontSize: 14, fontStyle: 'italic',
                          color: '#1a1010', lineHeight: 1.55,
                          flex: 1,
                        }}>
                          {z.info}
                        </div>
                        <div style={{
                          fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 600,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: z.color, opacity: 0.6, marginTop: 8, textAlign: 'right',
                        }}>
                          ↩ retourner
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Actualiser */}
            <div style={{ textAlign: 'center', marginTop: 24, padding: '0 24px' }}>
              <button
                onClick={fetchData}
                style={{
                  fontFamily: 'Jost, sans-serif', fontSize: 12,
                  color: '#1a1010', background: 'rgba(136,120,168,0.10)',
                  border: '1px solid rgba(136,120,168,0.28)',
                  borderRadius: 100, padding: '6px 18px',
                  cursor: 'pointer', letterSpacing: '0.06em',
                }}
              >
                ↺ Actualiser
              </button>
              {lastRefresh && (
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#1a1010', marginTop: 6 }}>
                  Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </>
        )}

        {/* Fermer */}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <button
            onClick={onClose}
            style={{
              fontFamily: 'Jost, sans-serif', fontSize: 13,
              color: '#a09098', background: 'none',
              border: 'none', cursor: 'pointer', letterSpacing: '0.04em',
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Découverte Ma Fleur (Jour 6) ───────────────────────────────────────────

function MaFleurDiscovery({ answerKey, onAnswer, onBack }) {
  const ambiance = useAmbiance()
  const { user } = useAuth()
  const userId   = user?.id
  const [plantData, setPlantData] = useState(null)
  const [settings,  setSettings]  = useState(null)
  const [phase,     setPhase]     = useState(0)
  const [showPerso, setShowPerso] = useState(false)

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const [plantRes, settingsRes, profileRes] = await Promise.allSettled([
        supabase.from('plants')
          .select('health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
          .eq('user_id', userId).order('date', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('garden_settings')
          .select('petal_color1, petal_color2, petal_shape')
          .eq('user_id', userId).maybeSingle(),
        supabase.from('profiles')
          .select('week_one_data')
          .eq('id', userId).maybeSingle(),
      ])

      let plant       = plantRes.status    === 'fulfilled' ? (plantRes.value.data    ?? null) : null
      const settings0 = settingsRes.status === 'fulfilled' ? (settingsRes.value.data ?? null) : null
      const profile0  = profileRes.status  === 'fulfilled' ? (profileRes.value.data  ?? null) : null

      const DAY_ZONE = { 1: 'zone_racines', 2: 'zone_tige', 3: 'zone_feuilles', 4: 'zone_fleurs', 5: 'zone_souffle' }
      const DAY_MIN  = { 1: 40, 2: 48, 3: 55, 4: 60, 5: 65 }
      const completed = profile0?.week_one_data?.completedDays ?? []

      if (completed.length > 0) {
        const base = plant ?? { zone_racines: 0, zone_tige: 0, zone_feuilles: 0, zone_fleurs: 0, zone_souffle: 0 }
        const zones = {
          zone_racines:  base.zone_racines  ?? 0,
          zone_tige:     base.zone_tige     ?? 0,
          zone_feuilles: base.zone_feuilles ?? 0,
          zone_fleurs:   base.zone_fleurs   ?? 0,
          zone_souffle:  base.zone_souffle  ?? 0,
        }
        completed.forEach(d => {
          const key = DAY_ZONE[d]
          const min = DAY_MIN[d] ?? 35
          if (key) zones[key] = Math.min(100, Math.max(zones[key], min))
          if (d === 7) Object.keys(zones).forEach(k => { zones[k] = Math.min(100, Math.max(zones[k], 75)) })
        })
        // MaFleurDiscovery s'affiche pendant J6 — J6 pas encore dans completedDays → forcer 65% min
        if (!completed.includes(7)) {
          Object.keys(zones).forEach(k => { zones[k] = Math.min(100, Math.max(zones[k], 65)) })
        }
        const newHealth = Math.round(Object.values(zones).reduce((a, b) => a + b, 0) / 5)
        if (newHealth > (plant?.health ?? 0)) {
          plant = { ...zones, health: newHealth }
          const today = new Date().toISOString().split('T')[0]
          Promise.resolve(supabase.from('plants')
            .upsert({ user_id: userId, date: today, ...zones, health: newHealth }, { onConflict: 'user_id,date' }))
            .catch(() => {})
        }
      }

      setPlantData(plant)
      setSettings(settings0)
    })()
  }, [userId])

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 4400),
      setTimeout(() => setPhase(4), 6800),
      setTimeout(() => setPhase(5), 13000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const health = plantData?.health ?? 65
  const [gardenSettings, setGardenSettings] = useState(DEFAULT_GARDEN_SETTINGS)

  useEffect(() => {
    if (!settings) return
    setGardenSettings({
      ...DEFAULT_GARDEN_SETTINGS,
      petalColor1: settings.petal_color1 ?? DEFAULT_GARDEN_SETTINGS.petalColor1,
      petalColor2: settings.petal_color2 ?? DEFAULT_GARDEN_SETTINGS.petalColor2,
      petalShape:  settings.petal_shape  ?? DEFAULT_GARDEN_SETTINGS.petalShape,
    })
  }, [settings])

  async function saveGardenSettings(s) {
    setGardenSettings(s)
    setShowPerso(false)
    _freshGardenSettings = { petal_color1: s.petalColor1, petal_color2: s.petalColor2, petal_shape: s.petalShape }
    window.dispatchEvent(new CustomEvent('garden:settings:updated', {
      detail: { petalColor1: s.petalColor1, petalColor2: s.petalColor2, petalShape: s.petalShape }
    }))
    if (!userId) return
    const { error } = await supabase.from('garden_settings').upsert({
      user_id:      userId,
      petal_color1: s.petalColor1,
      petal_color2: s.petalColor2,
      petal_shape:  s.petalShape,
    }, { onConflict: 'user_id' })
    if (error) console.warn('[saveGardenSettings]', error.message)
  }

  const S = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle: 'italic',
    fontSize: 'clamp(19px, 4.8vw, 23px)',
    color: '#0f0808',
    textAlign: 'center',
    lineHeight: 1.85,
    margin: 0,
  }

  return (
    <div className="wof-in" style={{ padding: '8px 20px 60px', textAlign: 'center' }}>
      <BackButton onClick={onBack} />

      {/* Phase 1 — intro */}
      <div style={{ ...fadeIn(phase >= 1), margin: '24px 0 36px' }}>
        <p style={{ ...S, margin: '0 0 4px' }}>
          Ce que tu as ressenti ces derniers jours…
        </p>
        <p style={{ ...S, fontStyle: 'normal', fontWeight: 700, fontSize: 'clamp(20px, 5.5vw, 28px)' }}>
          commence à prendre forme.
        </p>
      </div>

      {/* Phase 2 — bulle PlantSVG + blur qui s'éclaircit */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        margin: '0 0 28px',
        opacity:   phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'scale(1)' : 'scale(0.75)',
        transition: 'opacity 1200ms ease, transform 1200ms cubic-bezier(0.34,1.3,0.64,1)',
      }}>
        <style>{`
          @keyframes flowerWind {
            0%   { transform: translate(-50%,-50%) translateX(0) translateY(0) rotate(0deg) scale(0.4); opacity: 0; }
            12%  { opacity: 1; transform: translate(-50%,-50%) translateX(calc(var(--dx)*0.1)) translateY(calc(var(--dy)*0.1)) rotate(calc(var(--rot)*0.1)) scale(1.1); }
            50%  { opacity: 0.85; transform: translate(-50%,-50%) translateX(calc(var(--dx)*0.5 + var(--sx))) translateY(calc(var(--dy)*0.5 + var(--sy))) rotate(calc(var(--rot)*0.55)) scale(0.95); }
            100% { transform: translate(-50%,-50%) translateX(var(--dx)) translateY(var(--dy)) rotate(var(--rot)) scale(0.4); opacity: 0; }
          }
        `}</style>

        {/* Conteneur relatif pour bulle + couronne + burst */}
        <div style={{ position: 'relative', width: 260, height: 260 }}>

          {/* Bulle */}
          <div style={{
            width: 260, height: 260,
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            background: '#0a1628',
            boxShadow: '0 0 48px rgba(180,150,200,0.2)',
            filter: phase >= 3 ? 'blur(0px)' : 'blur(20px)',
            transition: 'filter 2600ms ease',
          }}>
            <div style={{ position: 'absolute', inset: -20, transform: 'translateY(6.5%)' }}>
              <PlantSVG
                health={health}
                gardenSettings={gardenSettings}
                lumensLevel="halo"
                clearSky={true}
                compact={true}
              />
            </div>
          </div>

          {/* Fleurs qui s'envolent doucement au vent */}
          {phase >= 3 && (() => {
            const emojis = ['🌸', '🌺', '🌼', '🌻', '🌷']
            const sizes  = [16, 18, 20, 22, 24, 20, 18, 16, 22, 19]
            const dists  = [160, 180, 200, 170, 190, 210, 165, 185, 175, 195]
            const durs   = [3.8, 4.2, 3.5, 4.6, 3.9, 4.4, 3.6, 5.0, 4.1, 4.7]
            return Array.from({ length: 30 }, (_, i) => {
              const angle = i * 12
              const rad   = angle * Math.PI / 180
              const dist  = dists[i % dists.length]
              const dx    = Math.cos(rad) * dist
              const dy    = Math.sin(rad) * dist
              // dérive perpendiculaire pour courber la trajectoire
              const sideDir = i % 2 === 0 ? 1 : -1
              const sideAmt = 18 + (i % 5) * 10
              const sx    = -Math.sin(rad) * sideDir * sideAmt
              const sy    =  Math.cos(rad) * sideDir * sideAmt
              const rot   = (i % 2 === 0 ? 120 : -150) + (i % 3) * 40
              const dur   = durs[i % durs.length]
              const delay = i * 0.06
              return (
                <div key={i} style={{
                  position: 'absolute',
                  left: '50%', top: '50%',
                  fontSize: sizes[i % sizes.length],
                  lineHeight: 1,
                  '--dx':  `${dx}px`,
                  '--dy':  `${dy}px`,
                  '--sx':  `${sx}px`,
                  '--sy':  `${sy}px`,
                  '--rot': `${rot}deg`,
                  animation: `flowerWind ${dur}s ease-in-out ${delay}s both`,
                  pointerEvents: 'none',
                  zIndex: 15,
                }}>
                  {emojis[i % emojis.length]}
                </div>
              )
            })
          })()}

          {/* Couronne superposée */}
          <img
            src={ambianceAsset('/couronne.png', ambiance)}
            alt=""
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 380, height: 380,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        </div>
      </div>

      {/* Phase 3 — "Voici ta fleur." */}
      <div style={{ ...fadeIn(phase >= 3), margin: '0 0 16px' }}>
        <p style={{ ...S, fontStyle: 'normal', fontWeight: 700, fontSize: 'clamp(22px, 6vw, 32px)' }}>
          Voici ta fleur.
        </p>
      </div>

      {/* Bouton personnalisation — entre titre et texte */}
      <div style={{ ...fadeIn(phase >= 3), margin: '0 0 20px', display: 'flex', justifyContent: 'center', pointerEvents: phase >= 3 ? 'auto' : 'none' }}>
        <button
          onClick={() => setShowPerso(true)}
          style={{
            padding: '10px 28px',
            borderRadius: 100,
            border: '1.5px solid rgba(200,160,176,0.35)',
            background: 'rgba(200,160,176,0.10)',
            color: '#c8a0b0',
            fontFamily: "'Jost',sans-serif",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '.10em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          🌸 Personnaliser ma fleur
        </button>
      </div>

      {/* Phase 4 — contemplation */}
      <div style={{ ...fadeIn(phase >= 4), margin: '0 0 48px' }}>
        <p style={{ ...S }}>Elle reflète ce qui a commencé à se développer en toi par ces attentions quotidiennes.</p>
      </div>

      {/* Phase 5 — bouton continuer */}
      <div style={{ ...fadeIn(phase >= 5), pointerEvents: phase >= 5 ? 'auto' : 'none', display: 'flex', justifyContent: 'center' }}>
        <PrimaryButton onClick={() => onAnswer(answerKey, 'vu')}>
          Continuer
        </PrimaryButton>
      </div>

      {showPerso && (
        <GardenSettingsModal
          settings={gardenSettings}
          onSave={saveGardenSettings}
          onClose={() => setShowPerso(false)}
          level={1}
          tier={1}
        />
      )}
    </div>
  )
}

// ── INTROSPECTION ──────────────────────────────────────────────────────────

function DayIntrospection({ data, onAnswer, onBack, onScreenChange }) {
  useEffect(() => { onScreenChange?.('introspection') }, [])
  const [selected,      setSelected]      = useState(null)
  const [subQVisible,   setSubQVisible]   = useState(false)

  useEffect(() => {
    if (!data.subQuestion) return
    const t = setTimeout(() => setSubQVisible(true), 2000)
    return () => clearTimeout(t)
  }, [])

  function handleColumnSelect(value) {
    setSelected(value)
    if (data.autoAdvance) {
      setTimeout(() => onAnswer(data.answerKey, value), 600)
    }
  }

  if (data.component === 'energy-battery') {
    return <EnergyBattery answerKey={data.answerKey} onAnswer={onAnswer} onBack={onBack} />
  }

  if (data.component === 'mafleur-discovery') {
    return <MaFleurDiscovery answerKey={data.answerKey} onAnswer={onAnswer} onBack={onBack} />
  }

  if (data.component === 'communaute-discovery') {
    return <CommunauteDiscovery answerKey={data.answerKey} onAnswer={onAnswer} onBack={onBack} />
  }

  function confirm() {
    if (selected) onAnswer(data.answerKey, selected)
  }

  return (
    <div className="wof-in" style={{ padding: '8px 20px 16px' }}>
      <BackButton onClick={onBack} />

      <h2 style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 'clamp(18px, 4.5vw, 24px)',
        fontWeight: 400,
        color: '#000',
        lineHeight: 1.45,
        margin: '8px 0 8px',
        textAlign: 'center',
      }}>
        {data.question}
      </h2>

      {data.subQuestion && (
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(18px, 4.5vw, 22px)',
          fontWeight: 700,
          color: '#0f0808',
          textAlign: 'center',
          margin: '0 0 24px',
          opacity: subQVisible ? 1 : 0,
          transform: subQVisible ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 700ms ease, transform 700ms ease',
        }}>
          {data.subQuestion}
        </p>
      )}

      {data.layout === 'column' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, margin: '0 auto 32px' }}>
          {data.choices.map((c) => {
            const isSelected = selected === c.value
            return (
              <button
                key={c.value}
                onClick={() => handleColumnSelect(c.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 20px',
                  borderRadius: 16,
                  border: isSelected
                    ? '1.5px solid rgba(160,100,120,0.5)'
                    : '1.5px solid rgba(180,140,130,0.22)',
                  background: isSelected
                    ? 'linear-gradient(135deg, #c8a0b0ee, #a07888ee)'
                    : 'rgba(255,255,255,0.72)',
                  boxShadow: isSelected ? '0 4px 18px rgba(160,100,120,0.22)' : '0 1px 4px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.22s ease',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: isSelected ? 'rgba(255,255,255,0.22)' : 'rgba(180,140,130,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                  transition: 'background 0.22s ease',
                }}>
                  {c.emoji}
                </span>
                <span style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: 'clamp(18px, 4.5vw, 22px)',
                  fontWeight: isSelected ? 500 : 400,
                  fontStyle: 'italic',
                  color: isSelected ? '#fff' : '#3a2828',
                  letterSpacing: '0.01em',
                  transition: 'color 0.22s ease',
                }}>
                  {c.label}
                </span>
                {isSelected && (
                  <span style={{ marginLeft: 'auto', fontSize: 14, opacity: 0.85 }}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          justifyContent: 'center',
          marginBottom: 32,
        }}>
          {data.choices.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelected(c.value)}
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: 14,
                fontWeight: selected === c.value ? 500 : 300,
                color: selected === c.value ? '#fff' : '#5a4848',
                background: selected === c.value
                  ? 'linear-gradient(135deg, #c8a0b0, #a07888)'
                  : '#f0e8e4',
                border: 'none',
                borderRadius: 50,
                padding: '11px 22px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selected === c.value ? '0 4px 14px rgba(160,100,120,0.25)' : 'none',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {!data.autoAdvance && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <PrimaryButton onClick={confirm} disabled={!selected}>
            Continuer
          </PrimaryButton>
        </div>
      )}
    </div>
  )
}

// ── Slide de transition vers le rituel ────────────────────────────────────

const TRANS = 'opacity 950ms cubic-bezier(0.25,0.46,0.45,0.94), transform 950ms cubic-bezier(0.25,0.46,0.45,0.94)'

function fadeIn(visible) {
  return {
    opacity:    visible ? 1 : 0,
    transition: TRANS,
  }
}

function RituelTransition({ introData, dayColor, onStart, onBack }) {
  const { lines, ctaLabel } = introData
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = lines.map((_, i) =>
      setTimeout(() => setPhase(i + 1), i * 200)
    )
    timers.push(setTimeout(() => setPhase(lines.length + 1), lines.length * 200))
    return () => timers.forEach(clearTimeout)
  }, [lines])

  function handleStart() {
    const el = document.querySelector('.wof-modal > div:nth-child(3)')
    if (el) el.scrollTop = 0
    onStart()
  }

  return (
    <div style={{ textAlign: 'center', padding: '40px 20px 40px' }}>
      <BackButton onClick={onBack} />

      {lines.map((line, i) => {
        const isBold = line.startsWith('**') && line.endsWith('**')
        const text   = isBold ? line.slice(2, -2) : line
        return (
          <p key={i} style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(18px, 4.5vw, 24px)',
            fontStyle: (i === 0 || isBold) ? 'normal' : 'italic',
            fontWeight: isBold ? 700 : i === 0 ? 500 : 400,
            color: i === 0 ? '#0f0808' : '#3a2828',
            lineHeight: 1.65,
            whiteSpace: 'pre-line',
            margin: '0 0 20px',
            ...fadeIn(phase > i),
          }}>
            {text}
          </p>
        )
      })}

      <div style={{
        marginTop: 16,
        ...fadeIn(phase > lines.length),
        pointerEvents: phase > lines.length ? 'auto' : 'none',
      }}>
        <PrimaryButton onClick={handleStart} style={{ background: `linear-gradient(135deg, ${dayColor}, ${dayColor}cc)` }}>
          {ctaLabel}
        </PrimaryButton>
      </div>
    </div>
  )
}

// ── Rituel guidé — Racines ─────────────────────────────────────────────────

function RacinesGuidedRituel({ onNext, onBack, onAudio }) {
  const [phase, setPhase] = useState(0)
  const phaseRefs = useRef({})

  useEffect(() => {
    const T = [0, 150, 300, 450, 600, 750, 900, 1050, 1200]
    const timers = T.map((ms, i) => setTimeout(() => setPhase(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [])

  const S = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle:  'italic',
    fontSize:   'clamp(19px, 4.8vw, 23px)',
    color:      '#0f0808',
    textAlign:  'center',
    lineHeight: 1.85,
    margin:     '0 0 32px',
  }

  function B({ children }) {
    return <strong style={{ fontWeight: 600, fontStyle: 'inherit' }}>{children}</strong>
  }

  function block(n, content) {
    return (
      <div ref={el => { phaseRefs.current[n] = el }} style={{ scrollMarginTop: '72px', ...fadeIn(phase >= n) }}>
        {content}
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 20px 80px' }}>
      <BackButton onClick={onBack} />

      {/* Titre */}
      <div style={{ textAlign: 'center', margin: '12px 0 40px' }}>
        <p style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 'clamp(11px, 2.8vw, 13px)',
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#1a1010',
          margin: '0 0 8px',
        }}>
          Ton premier rituel
        </p>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(30px, 7.5vw, 40px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#2a1010',
          lineHeight: 1.15,
          margin: '0 0 10px',
        }}>
          tes racines
        </h2>
        <div style={{
          width: 48,
          height: 2,
          background: 'linear-gradient(to right, transparent, #b87c5a, transparent)',
          margin: '0 auto',
        }} />
      </div>

      {block(1, <>
        <p style={S}><B>Bonjour.</B></p>
        <p style={S}>Aujourd'hui, je vous invite à prendre quelques instants pour revenir à l'essentiel.</p>
      </>)}
      {block(2, <>
        <p style={S}>Installez-vous confortablement…</p>
        <p style={S}>Puis prenez une <B>profonde inspiration</B>…</p>
        <p style={S}>Et soufflez lentement.</p>
        <p style={S}>Encore une fois…</p>
        <p style={S}><B>Inspirez</B>…</p>
        <p style={S}>Et <B>expirez</B> doucement.</p>
        <p style={S}>Très bien.</p>
      </>)}
      {block(3, <>
        <p style={S}>Maintenant, portez votre attention sur <B>vos pieds</B>.</p>
        <p style={S}>Ressentez leur contact avec le sol.</p>
        <p style={S}>Imaginez que sous chacun d'eux apparaissent de fines <B>racines</B>.</p>
        <p style={S}>Des racines souples et vivantes qui <B>s'enfoncent lentement</B> dans la terre.</p>
      </>)}
      {block(4, <>
        <p style={S}>À chaque respiration…</p>
        <p style={S}>Elles descendent un peu plus profondément.</p>
        <p style={S}>Elles trouvent un sol <B>stable</B>.</p>
        <p style={S}><B>Solide.</B></p>
        <p style={S}><B>Sécurisant.</B></p>
      </>)}
      {block(5, <>
        <p style={S}>Et tandis que ces racines s'enfoncent dans la terre…</p>
        <p style={S}>Vous pouvez ressentir votre corps devenir plus <B>présent</B>.</p>
        <p style={S}>Plus <B>calme</B>.</p>
        <p style={S}>Plus <B>stable</B>.</p>
        <p style={S}>Comme un arbre qui reste debout malgré le vent.</p>
      </>)}
      {block(6, <>
        <p style={S}>Prenez un instant pour accueillir cette sensation.</p>
        <p style={S}>Puis répétez intérieurement :</p>
        <p style={{ ...S, fontStyle: 'normal', fontWeight: 600, fontSize: 'clamp(20px,5vw,26px)', margin: '0 0 8px' }}>Je suis ici.</p>
        <p style={{ ...S, fontSize: 'clamp(14px,3.5vw,17px)', opacity: 0.4, margin: '0 0 24px' }}>…</p>
        <p style={{ ...S, fontStyle: 'normal', fontWeight: 600, fontSize: 'clamp(20px,5vw,26px)', margin: '0 0 8px' }}>Je suis en sécurité.</p>
        <p style={{ ...S, fontSize: 'clamp(14px,3.5vw,17px)', opacity: 0.4, margin: '0 0 24px' }}>…</p>
        <p style={{ ...S, fontStyle: 'normal', fontWeight: 600, fontSize: 'clamp(20px,5vw,26px)', margin: '0 0 8px' }}>Je peux prendre ma place.</p>
        <p style={{ ...S, fontSize: 'clamp(14px,3.5vw,17px)', opacity: 0.4, margin: '0 0 24px' }}>…</p>
        <p style={{ ...S, fontStyle: 'normal', fontWeight: 600, fontSize: 'clamp(20px,5vw,26px)', margin: '0 0 32px' }}>Je suis profondément enraciné(e).</p>
      </>)}
      {block(7, <>
        <p style={S}>Et maintenant, imaginez que la terre vous transmet une <B>énergie douce et apaisante</B>.</p>
        <p style={S}>Une énergie qui remonte à travers vos racines.</p>
        <p style={S}>Qui nourrit votre corps.</p>
        <p style={S}>Qui renforce votre <B>stabilité intérieure</B>.</p>
        <p style={S}>Qui vous rappelle que vous n'avez pas besoin d'aller vite.</p>
        <p style={S}>Pas besoin d'être parfait.</p>
        <p style={S}>Seulement d'avancer, <B>un pas après l'autre</B>.</p>
      </>)}
      {block(8, <>
        <p style={S}>Prenez une dernière <B>inspiration profonde</B>…</p>
        <p style={S}>Puis expirez lentement.</p>
        <p style={S}>Et gardez avec vous cette <B>sensation d'ancrage</B> tout au long de votre journée.</p>
        <p style={S}>Comme une racine invisible qui vous accompagne à chaque instant.</p>
        <p style={{ ...S, fontStyle: 'normal', fontSize: 'clamp(17px,4.5vw,21px)', margin: '0 0 40px', opacity: 0.75 }}>🌱 Prenez soin de vos racines, et votre fleur saura naturellement s'épanouir.</p>
      </>)}

      {/* CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, ...fadeIn(phase >= 9), pointerEvents: phase >= 9 ? 'auto' : 'none' }}>
        <PrimaryButton onClick={onNext}>Je continue</PrimaryButton>
        {onAudio && (
          <button onClick={onAudio} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontSize: 14, color: 'rgba(50,35,20,0.45)', textDecoration: 'underline', textUnderlineOffset: 3, padding: 0 }}>
            🔊 écouter l'audio à la place
          </button>
        )}
      </div>
    </div>
  )
}

// ── Rituel guidé — Tige ────────────────────────────────────────────────────

function TigeGuidedRituel({ onNext, onBack, onAudio }) {
  const S = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle: 'italic',
    fontSize: 'clamp(17px, 4.4vw, 21px)',
    color: '#1a1010',
    textAlign: 'center',
    lineHeight: 1.9,
    margin: '0 0 8px',
  }
  const Pause = () => (
    <div style={{ textAlign: 'center', margin: '24px 0 20px', color: '#9ab8c8', letterSpacing: 8, fontSize: 14 }}>· · ·</div>
  )
  const Affirmation = ({ children }) => (
    <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(19px, 4.8vw, 23px)', color: '#3a5a6a', textAlign: 'center', lineHeight: 1.75, margin: '0 0 14px' }}>
      {children}
    </p>
  )

  return (
    <div style={{ background: 'radial-gradient(circle at 50% 18%, #eef4f7, #deeaf0 58%, #d4e2ea)', minHeight: '100%', padding: '16px 20px 80px', boxSizing: 'border-box' }}>
      <BackButton onClick={onBack} />

      <div style={{ textAlign: 'center', margin: '16px 0 36px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 100, background: 'linear-gradient(135deg,#9ab8c8,#7a98a8)', boxShadow: '0 4px 16px rgba(154,184,200,0.40)', marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>🌿</span>
          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.95)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Tige · Le texte du rituel</span>
        </div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: 400, fontStyle: 'italic', color: '#1a2a3a', lineHeight: 1.2, margin: '0 0 6px' }}>Me tenir debout</h2>
        <div style={{ width: 48, height: 1, background: 'linear-gradient(to right, transparent, #9ab8c8, transparent)', margin: '0 auto' }} />
      </div>

      <p style={S}>Aujourd'hui, je vous invite à prendre un moment<br/>pour vous reconnecter à votre tige.</p>
      <p style={{ ...S, margin: '0 0 20px' }}>Après avoir pris soin de vos racines, il est temps de porter votre attention à cette partie de la plante qui lui permet de grandir.</p>

      <p style={{ ...S, fontWeight: 700, fontSize: 'clamp(20px, 5vw, 24px)', margin: '0 0 8px' }}>La tige.</p>
      <p style={S}>Celle qui relie les profondeurs de la terre à la lumière du ciel.</p>
      <p style={S}>Celle qui soutient.</p>
      <p style={S}>Celle qui porte.</p>
      <p style={{ ...S, margin: '0 0 20px' }}>Celle qui avance.</p>

      <p style={S}>Alors prenez une profonde inspiration...</p>
      <p style={S}>Et soufflez doucement.</p>
      <p style={S}>Puis une seconde fois...</p>
      <p style={S}>Inspirez...</p>
      <p style={S}>Et expirez lentement.</p>
      <p style={{ ...S, fontWeight: 700 }}>Très bien.</p>
      <p style={S}>Laissez maintenant votre respiration trouver son propre rythme.</p>
      <p style={S}>Naturellement.</p>
      <p style={S}>Sans effort.</p>

      <Pause />

      <p style={S}>Imaginez devant vous une magnifique plante.</p>
      <p style={S}>Votre plante.</p>
      <p style={S}>Votre jardin intérieur.</p>
      <p style={S}>Sous la terre, ses racines sont présentes.</p>
      <p style={S}>Solides.</p>
      <p style={S}>Profondes.</p>
      <p style={{ ...S, fontWeight: 700, margin: '0 0 20px' }}>Elles sont là.</p>

      <p style={S}>Et maintenant, votre attention se porte sur la tige.</p>
      <p style={S}>Cette tige qui s'élève depuis la terre.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Cette tige qui relie tout.</p>

      <p style={S}>Prenez quelques instants pour l'observer.</p>
      <p style={S}>Quelle est sa forme ?</p>
      <p style={S}>Quelle est sa couleur ?</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Comment vous semble-t-elle aujourd'hui ?</p>

      <p style={S}>Peut-être droite.</p>
      <p style={S}>Peut-être légèrement courbée.</p>
      <p style={S}>Peut-être fine.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Peut-être robuste.</p>

      <p style={S}>Et peu importe ce que vous observez.</p>
      <p style={S}>Car il n'y a rien à juger.</p>
      <p style={S}>Simplement quelque chose à découvrir.</p>

      <Pause />

      <p style={S}>La tige n'a jamais besoin d'être parfaite.</p>
      <p style={S}>Elle a seulement besoin d'être vivante.</p>
      <p style={{ ...S, fontWeight: 700 }}>Comme vous.</p>

      <Pause />

      <p style={S}>Et tandis que vous l'observez...</p>
      <p style={S}>Imaginez qu'une douce énergie monte depuis les racines.</p>
      <p style={S}>Une énergie calme.</p>
      <p style={S}>Stable.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Bienveillante.</p>

      <p style={S}>Cette énergie remonte lentement à travers la tige.</p>
      <p style={S}>Comme une sève nourricière.</p>
      <p style={S}>Elle circule librement.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Elle apporte force et souplesse.</p>

      <p style={S}>Solidité et mouvement.</p>
      <p style={S}>Car une belle tige n'est pas celle qui résiste à tout.</p>
      <p style={S}>C'est celle qui sait s'adapter au vent.</p>

      <Pause />

      <p style={S}>Et peut-être qu'en ce moment même, vous pouvez penser à certaines situations de votre vie.</p>
      <p style={S}>Des projets.</p>
      <p style={S}>Des décisions.</p>
      <p style={S}>Des changements.</p>
      <p style={S}>Des défis.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Ou simplement les nombreuses choses qui occupent votre esprit.</p>

      <p style={S}>Et parfois...</p>
      <p style={S}>Lorsque l'on regarde tout ce qu'il reste à parcourir...</p>
      <p style={S}>On peut avoir l'impression que le chemin est immense.</p>
      <p style={S}>Que l'on n'avance pas assez vite.</p>
      <p style={S}>Que l'on devrait déjà être ailleurs.</p>
      <p style={S}>Plus loin.</p>
      <p style={S}>Plus fort.</p>
      <p style={S}>Plus serein.</p>

      <Pause />

      <p style={{ ...S, fontWeight: 700 }}>Pourtant...</p>
      <p style={S}>Aucune plante ne pousse en tirant sur sa tige.</p>
      <p style={S}>Aucune fleur ne s'ouvre parce qu'on l'oblige à grandir.</p>
      <p style={S}>Tout dans la nature évolue à son rythme.</p>
      <p style={{ ...S, fontWeight: 700 }}>Et vous aussi.</p>

      <Pause />

      <p style={S}>Prenez un instant pour accueillir cette idée.</p>
      <p style={S}>Vous avez le droit d'avancer à votre rythme.</p>
      <p style={S}>Vous avez le droit d'apprendre à votre rythme.</p>
      <p style={S}>Vous avez le droit de construire à votre rythme.</p>
      <p style={{ ...S, fontWeight: 700, margin: '0 0 20px' }}>Vous avez le droit d'être exactement là où vous êtes aujourd'hui.</p>

      <Pause />

      <p style={S}>Et tandis que cette idée s'installe doucement en vous...</p>
      <p style={S}>Imaginez maintenant que votre tige s'oriente naturellement vers la lumière.</p>
      <p style={S}>Elle ne sait pas exactement où elle va.</p>
      <p style={S}>Elle ne connaît pas tout le chemin.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Mais elle avance malgré tout.</p>

      <p style={S}>Simplement parce qu'elle est attirée par ce qui lui fait du bien.</p>
      <p style={S}>Par ce qui la nourrit.</p>
      <p style={S}>Par ce qui lui permet de grandir.</p>

      <Pause />

      <p style={{ ...S, margin: '0 0 16px' }}>Et vous pouvez vous demander intérieurement :</p>
      <p style={{ ...S, fontWeight: 700, fontSize: 'clamp(19px, 4.8vw, 23px)', margin: '0 0 16px' }}>Quelle est la lumière que je souhaite suivre aujourd'hui ?</p>
      <p style={S}>Pas demain.</p>
      <p style={S}>Pas dans un an.</p>
      <p style={{ ...S, fontWeight: 700, margin: '0 0 16px' }}>Aujourd'hui.</p>

      <p style={S}>Quel est ce petit pas qui pourrait nourrir ma croissance ?</p>
      <p style={S}>Un appel ?</p>
      <p style={S}>Une décision ?</p>
      <p style={S}>Un moment de repos ?</p>
      <p style={S}>Un projet à commencer ?</p>
      <p style={S}>Une promenade ?</p>
      <p style={S}>Une respiration ?</p>

      <Pause />

      <p style={S}>Peut-être qu'une réponse apparaît.</p>
      <p style={S}>Peut-être pas encore.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Et c'est très bien ainsi.</p>
      <p style={S}>Car parfois, il suffit simplement de rester tourné vers la lumière pour que les réponses apparaissent naturellement.</p>

      <Pause />

      <p style={S}>Maintenant, imaginez que votre tige devient un peu plus solide.</p>
      <p style={S}>Un peu plus souple aussi.</p>
      <p style={S}>Comme si elle comprenait qu'elle n'a pas besoin d'être rigide pour être forte.</p>
      <p style={S}>Qu'elle peut rester stable tout en restant vivante.</p>

      <Pause />

      <div style={{ background: 'rgba(154,184,200,0.12)', border: '1px solid rgba(154,184,200,0.30)', borderRadius: 16, padding: '24px 20px 16px', margin: '4px 0 24px' }}>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7a98a8', textAlign: 'center', margin: '0 0 18px' }}>Répétez intérieurement</p>
        <Affirmation>Je peux avancer à mon rythme.</Affirmation>
        <Affirmation>Je fais confiance à mon chemin.</Affirmation>
        <Affirmation>Je possède déjà les ressources dont j'ai besoin.</Affirmation>
        <Affirmation>Chaque petit pas compte.</Affirmation>
        <Affirmation>Je grandis jour après jour.</Affirmation>
      </div>

      <p style={S}>Laissez ces mots descendre doucement à l'intérieur de vous.</p>
      <p style={S}>Comme des gouttes d'eau qui nourrissent votre jardin.</p>

      <Pause />

      <p style={S}>Prenez maintenant une profonde inspiration.</p>
      <p style={S}>Et ressentez cette énergie qui circule librement dans toute votre plante.</p>
      <p style={S}>Depuis les racines.</p>
      <p style={S}>Jusqu'à la tige.</p>
      <p style={S}>Et bientôt jusqu'aux feuilles et à la fleur.</p>

      <Pause />

      <p style={S}>Car tout est déjà en mouvement.</p>
      <p style={S}>Même lorsque cela ne se voit pas encore.</p>
      <p style={S}>Même lorsque les résultats ne sont pas encore visibles.</p>
      <p style={S}>La croissance continue.</p>
      <p style={S}>Silencieusement.</p>
      <p style={S}>Naturellement.</p>
      <p style={S}>Jour après jour.</p>

      <Pause />

      <p style={S}>Prenez une dernière respiration profonde.</p>
      <p style={S}>Et gardez avec vous cette image de votre tige.</p>
      <p style={S}>Stable.</p>
      <p style={S}>Vivante.</p>
      <p style={{ ...S, margin: '0 0 20px' }}>Tournée vers la lumière.</p>

      <p style={S}>Et rappelez-vous aujourd'hui :</p>
      <p style={S}>Vous n'avez pas besoin de tout accomplir.</p>
      <p style={{ ...S, fontWeight: 700, fontSize: 'clamp(20px, 5vw, 24px)', margin: '0 0 48px' }}>Vous avez simplement besoin de continuer à grandir.<br/>Un pas après l'autre.</p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <PrimaryButton onClick={onNext}>Je continue</PrimaryButton>
        {onAudio && (
          <button
            onClick={onAudio}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontSize: 14, color: 'rgba(50,35,20,0.45)', textDecoration: 'underline', textUnderlineOffset: 3, padding: 0 }}
          >
            🔊 écouter l'audio à la place
          </button>
        )}
      </div>
    </div>
  )
}

// ── Rituel guidé — Feuilles ────────────────────────────────────────────────

function FeuillesGuidedRituel({ onNext, onBack, onAudio }) {
  const S = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle: 'italic',
    fontSize: 'clamp(17px, 4.4vw, 21px)',
    color: '#1a1010',
    textAlign: 'center',
    lineHeight: 1.9,
    margin: '0 0 8px',
  }
  const Pause = () => (
    <div style={{ textAlign: 'center', margin: '24px 0 20px', color: '#7aaa88', letterSpacing: 8, fontSize: 14 }}>· · ·</div>
  )
  const Affirmation = ({ children }) => (
    <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(19px, 4.8vw, 23px)', color: '#3a6a4a', textAlign: 'center', lineHeight: 1.75, margin: '0 0 14px' }}>
      {children}
    </p>
  )

  return (
    <div style={{ background: 'radial-gradient(circle at 50% 18%, #eef6ee, #deeedd 58%, #d4ead4)', minHeight: '100%', padding: '16px 20px 80px', boxSizing: 'border-box' }}>
      <BackButton onClick={onBack} />

      <div style={{ textAlign: 'center', margin: '16px 0 36px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 100, background: 'linear-gradient(135deg,#7aaa88,#5e8456)', boxShadow: '0 4px 16px rgba(122,170,136,0.40)', marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>🍃</span>
          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.95)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Feuilles · Le texte du rituel</span>
        </div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: 400, fontStyle: 'italic', color: '#1a2a1a', lineHeight: 1.2, margin: '0 0 6px' }}>Observer ce qui traverse</h2>
        <div style={{ width: 48, height: 1, background: 'linear-gradient(to right, transparent, #7aaa88, transparent)', margin: '0 auto' }} />
      </div>

      <p style={S}>Aujourd'hui, je vous invite à prendre quelques instants<br/>pour vous connecter à vos feuilles.</p>
      <p style={S}>Après les racines qui vous nourrissent...</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Après la tige qui vous permet d'avancer...</p>
      <p style={{ ...S, fontWeight: 700, fontSize: 'clamp(20px, 5vw, 24px)', margin: '0 0 16px' }}>Viennent les feuilles.</p>
      <p style={S}>Les feuilles sont les grandes capteuses de lumière.</p>
      <p style={S}>Elles s'ouvrent au soleil.</p>
      <p style={S}>À l'air.</p>
      <p style={S}>À la pluie.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Au monde qui les entoure.</p>
      <p style={S}>Elles représentent cette partie de vous qui ressent.</p>
      <p style={S}>Qui échange.</p>
      <p style={{ ...S, margin: '0 0 20px' }}>Qui entre en relation avec la vie.</p>

      <p style={S}>Alors prenez une profonde inspiration...</p>
      <p style={S}>Puis expirez lentement.</p>
      <p style={S}>Encore une fois...</p>
      <p style={S}>Inspirez profondément...</p>
      <p style={S}>Et soufflez doucement.</p>
      <p style={{ ...S, fontWeight: 700 }}>Très bien.</p>
      <p style={S}>Laissez maintenant votre respiration devenir naturelle.</p>
      <p style={S}>Simple.</p>
      <p style={S}>Paisible.</p>

      <Pause />

      <p style={S}>Imaginez votre plante.</p>
      <p style={S}>Votre jardin intérieur.</p>
      <p style={S}>Vous voyez ses racines profondément ancrées dans la terre.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Sa tige solide qui s'élève vers le ciel.</p>
      <p style={S}>Et maintenant...</p>
      <p style={{ ...S, fontWeight: 700 }}>Vous remarquez ses feuilles.</p>
      <p style={S}>De nombreuses feuilles.</p>
      <p style={S}>Toutes différentes.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Toutes vivantes.</p>
      <p style={S}>Certaines grandes.</p>
      <p style={S}>Certaines plus petites.</p>
      <p style={S}>Certaines tournées vers la lumière.</p>
      <p style={S}>D'autres encore en train de se déployer.</p>

      <Pause />

      <p style={S}>Prenez quelques instants pour les observer.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Comment sont-elles aujourd'hui ?</p>
      <p style={S}>Peut-être lumineuses.</p>
      <p style={S}>Peut-être un peu ternes.</p>
      <p style={S}>Peut-être agitées par le vent.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Peut-être paisibles.</p>
      <p style={S}>Et quelle que soit leur apparence...</p>
      <p style={{ ...S, fontWeight: 700 }}>Tout est parfaitement acceptable.</p>

      <Pause />

      <p style={S}>Car les feuilles vivent au rythme des saisons.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Comme les émotions vivent au rythme de nos journées.</p>
      <p style={S}>Parfois nous nous sentons légers.</p>
      <p style={S}>Parfois joyeux.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Parfois enthousiastes.</p>
      <p style={S}>Et parfois nous nous sentons fatigués.</p>
      <p style={S}>Préoccupés.</p>
      <p style={S}>Tristes.</p>
      <p style={S}>Ou simplement un peu perdus.</p>

      <Pause />

      <p style={S}>Comme les feuilles d'un arbre qui bougent sous le vent.</p>
      <p style={S}>Les émotions viennent.</p>
      <p style={S}>Puis elles repartent.</p>
      <p style={S}>Elles circulent.</p>
      <p style={S}>Elles évoluent.</p>
      <p style={S}>Elles ne sont jamais figées.</p>

      <Pause />

      <p style={S}>Et aujourd'hui...</p>
      <p style={S}>Je vous invite à ne rien changer.</p>
      <p style={S}>À ne rien corriger.</p>
      <p style={S}>Simplement à observer ce qui est présent.</p>

      <Pause />

      <p style={S}>Peut-être qu'une émotion attire votre attention.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Une émotion que vous avez ressentie récemment.</p>
      <p style={S}>Sans chercher à l'analyser.</p>
      <p style={S}>Sans chercher à la comprendre.</p>
      <p style={S}>Simplement la reconnaître.</p>
      <p style={S}>Comme un jardinier qui remarque une feuille particulière dans son jardin.</p>

      <Pause />

      <p style={S}>Et imaginez maintenant que cette émotion prend doucement la forme d'une feuille.</p>
      <p style={S}>Une feuille unique.</p>
      <p style={S}>Avec sa couleur.</p>
      <p style={S}>Sa texture.</p>
      <p style={S}>Sa forme.</p>

      <Pause />

      <p style={S}>Puis imaginez que vous la regardez avec curiosité.</p>
      <p style={S}>Sans jugement.</p>
      <p style={S}>Avec bienveillance.</p>

      <Pause />

      <p style={S}>Car chaque émotion porte un message.</p>
      <p style={S}>Même celles que nous n'aimons pas.</p>
      <p style={S}>Même celles qui nous dérangent.</p>
      <p style={S}>Même celles que nous préférerions éviter.</p>

      <Pause />

      <p style={S}>La tristesse peut nous parler d'un besoin de réconfort.</p>
      <p style={S}>La colère peut nous montrer qu'une limite a été dépassée.</p>
      <p style={S}>La peur peut chercher à nous protéger.</p>
      <p style={S}>La joie peut nous indiquer ce qui nourrit notre cœur.</p>

      <Pause />

      <p style={S}>Chaque émotion est une feuille sur l'arbre de notre vie.</p>
      <p style={S}>Aucune n'est inutile.</p>
      <p style={{ ...S, fontWeight: 700 }}>Aucune n'est mauvaise.</p>

      <Pause />

      <p style={S}>Et tandis que vous observez cette feuille particulière...</p>
      <p style={S}>Imaginez qu'un souffle léger traverse votre jardin.</p>
      <p style={S}>Une brise douce.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Apaisante.</p>
      <p style={S}>Cette brise passe entre les feuilles.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Les fait danser doucement.</p>
      <p style={S}>Puis emporte ce qui n'a plus besoin de rester.</p>
      <p style={S}>Les tensions.</p>
      <p style={S}>Les préoccupations.</p>
      <p style={S}>Les pensées qui tournent en boucle.</p>

      <Pause />

      <p style={S}>Comme dans la nature.</p>
      <p style={S}>Les feuilles savent naturellement lâcher ce qui doit partir.</p>

      <Pause />

      <p style={S}>Et vous pouvez peut-être vous autoriser à faire la même chose.</p>
      <p style={S}>Juste pour quelques instants.</p>

      <Pause />

      <p style={S}>Imaginez maintenant que le soleil éclaire votre plante.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Une lumière douce et chaleureuse.</p>
      <p style={S}>Cette lumière touche chacune de vos feuilles.</p>
      <p style={S}>Même celles qui semblaient fragiles.</p>
      <p style={S}>Même celles qui semblaient fatiguées.</p>

      <Pause />

      <p style={S}>Et peu à peu...</p>
      <p style={S}>Les feuilles absorbent cette lumière.</p>
      <p style={S}>Comme elles savent si bien le faire.</p>
      <p style={S}>Elles se nourrissent.</p>
      <p style={S}>Elles respirent.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Elles se renforcent.</p>

      <Pause />

      <p style={S}>Et vous pouvez ressentir que vous aussi...</p>
      <p style={S}>Vous avez le droit de recevoir.</p>
      <p style={S}>Recevoir de l'attention.</p>
      <p style={S}>Recevoir du soutien.</p>
      <p style={S}>Recevoir de la douceur.</p>
      <p style={S}>Recevoir de la lumière.</p>

      <Pause />

      <div style={{ background: 'rgba(122,170,136,0.12)', border: '1px solid rgba(122,170,136,0.30)', borderRadius: 16, padding: '24px 20px 16px', margin: '4px 0 24px' }}>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5e8456', textAlign: 'center', margin: '0 0 18px' }}>Répétez intérieurement</p>
        <Affirmation>J'accueille ce que je ressens.</Affirmation>
        <Affirmation>Mes émotions ont le droit d'exister.</Affirmation>
        <Affirmation>Je peux écouter ce qui se passe en moi avec bienveillance.</Affirmation>
        <Affirmation>Je reste ouvert à la vie.</Affirmation>
        <Affirmation>Je me relie au monde avec confiance.</Affirmation>
      </div>

      <p style={S}>Prenez maintenant quelques instants pour ressentir votre jardin dans son ensemble.</p>
      <p style={S}>Les racines.</p>
      <p style={S}>La tige.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Les feuilles.</p>
      <p style={S}>Tout fonctionne ensemble.</p>
      <p style={S}>Tout participe à votre équilibre.</p>

      <Pause />

      <p style={S}>Et même lorsque certaines feuilles traversent une période plus difficile...</p>
      <p style={S}>L'ensemble de la plante continue de vivre.</p>
      <p style={S}>De grandir.</p>
      <p style={S}>D'évoluer.</p>

      <Pause />

      <p style={S}>Prenez une dernière inspiration profonde.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Et lorsque vous expirez...</p>
      <p style={S}>Imaginez que toutes vos feuilles frémissent doucement sous une brise légère.</p>
      <p style={S}>Comme un signe de vie.</p>
      <p style={S}>Comme un signe de mouvement.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Comme un rappel que vous êtes vivant.</p>
      <p style={S}>Connecté.</p>
      <p style={S}>En relation avec vous-même.</p>
      <p style={{ ...S, margin: '0 0 20px' }}>Et avec le monde qui vous entoure.</p>

      <Pause />

      <p style={S}>Aujourd'hui, prenez simplement le temps d'observer ce que vous ressentez.</p>
      <p style={S}>Comme on observe les feuilles d'un jardin.</p>
      <p style={S}>Avec curiosité.</p>
      <p style={S}>Avec douceur.</p>
      <p style={{ ...S, fontWeight: 700, fontSize: 'clamp(20px, 5vw, 24px)', margin: '0 0 48px' }}>Avec respect.</p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <PrimaryButton onClick={onNext}>Je continue</PrimaryButton>
        {onAudio && (
          <button onClick={onAudio} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontSize: 14, color: 'rgba(50,35,20,0.45)', textDecoration: 'underline', textUnderlineOffset: 3, padding: 0 }}>
            🔊 écouter l'audio à la place
          </button>
        )}
      </div>
    </div>
  )
}

// ── Rituel guidé — Fleurs ──────────────────────────────────────────────────

function FleursGuidedRituel({ onNext, onBack }) {
  const [phase, setPhase] = useState(0)
  const phaseRefs = useRef({})

  useEffect(() => {
    const T = [0, 1000, 2000, 3000, 4000, 5000, 5500]
    const timers = T.map((ms, i) => setTimeout(() => setPhase(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [])

  const S = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle:  'italic',
    fontSize:   'clamp(19px, 4.8vw, 23px)',
    color:      '#0f0808',
    textAlign:  'center',
    lineHeight: 1.85,
    margin:     '0 0 32px',
  }

  function B({ children }) {
    return <strong style={{ fontWeight: 600, fontStyle: 'inherit' }}>{children}</strong>
  }

  function block(n, content) {
    return (
      <div ref={el => { phaseRefs.current[n] = el }} style={{ scrollMarginTop: '72px', ...fadeIn(phase >= n) }}>
        {content}
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 20px 80px' }}>
      <BackButton onClick={onBack} />

      <div style={{ textAlign: 'center', margin: '12px 0 40px' }}>
        <p style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 'clamp(11px, 2.8vw, 13px)',
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#1a1010',
          margin: '0 0 8px',
        }}>
          Ton quatrième rituel
        </p>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(30px, 7.5vw, 40px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#2a1020',
          lineHeight: 1.15,
          margin: '0 0 10px',
        }}>
          tes fleurs
        </h2>
        <div style={{
          width: 48, height: 2,
          background: 'linear-gradient(to right, transparent, #d4a0b0, transparent)',
          margin: '0 auto',
        }} />
      </div>

      {block(1, <p style={S}>Installe-toi <B>confortablement</B>.<br />Si tu veux, ferme les yeux.</p>)}
      {block(2, <p style={S}>Laisse ton attention <B>descendre doucement</B>…<br />de la tête jusqu'aux pieds.</p>)}
      {block(3, <p style={S}>Observe ce qui est là.<br />Les zones <B>tendues</B>.<br />Les zones plus calmes.</p>)}
      {block(4, <p style={S}>Tu n'as rien à changer.<br />Juste… <B>être avec</B>.</p>)}
      {block(5, <p style={S}>Comme si tu traversais <B>un espace en toi</B>.</p>)}
      {block(6, <p style={{ ...S, fontStyle: 'normal', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 25px)', margin: '0 0 40px' }}>Tu viens de t'offrir quelque chose de <B>rare</B>.</p>)}

      <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= 7), pointerEvents: phase >= 7 ? 'auto' : 'none' }}>
        <PrimaryButton onClick={onNext}>Je continue</PrimaryButton>
      </div>
    </div>
  )
}

// ── Rituel guidé — Souffle ─────────────────────────────────────────────────

function SouffleGuidedRituel({ onNext, onBack, onAudio }) {
  const S = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle: 'italic',
    fontSize: 'clamp(17px, 4.4vw, 21px)',
    color: '#1a1010',
    textAlign: 'center',
    lineHeight: 1.9,
    margin: '0 0 8px',
  }
  const Pause = () => (
    <div style={{ textAlign: 'center', margin: '24px 0 20px', color: '#c8a870', letterSpacing: 8, fontSize: 14 }}>· · ·</div>
  )
  const Affirmation = ({ children }) => (
    <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(19px, 4.8vw, 23px)', color: '#7a6030', textAlign: 'center', lineHeight: 1.75, margin: '0 0 14px' }}>
      {children}
    </p>
  )

  return (
    <div style={{ background: 'radial-gradient(circle at 50% 18%, #fdf8ee, #f5ead8 58%, #ede0c8)', minHeight: '100%', padding: '16px 20px 80px', boxSizing: 'border-box' }}>
      <BackButton onClick={onBack} />

      <div style={{ textAlign: 'center', margin: '16px 0 36px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 100, background: 'linear-gradient(135deg,#c8a870,#a08040)', boxShadow: '0 4px 16px rgba(200,168,112,0.40)', marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>🌬️</span>
          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.95)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Souffle · Le texte du rituel</span>
        </div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: 400, fontStyle: 'italic', color: '#2a1a08', lineHeight: 1.2, margin: '0 0 6px' }}>Le souffle qui relie</h2>
        <div style={{ width: 48, height: 1, background: 'linear-gradient(to right, transparent, #c8a870, transparent)', margin: '0 auto' }} />
      </div>

      <p style={S}>Aujourd'hui, je vous invite à prendre un moment pour découvrir le souffle.</p>
      <p style={{ ...S, fontWeight: 700 }}>Le souffle est discret.</p>
      <p style={S}>Invisible.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>On ne le voit pas.</p>
      <p style={S}>Et pourtant, il est partout.</p>
      <p style={S}>Il traverse les racines.</p>
      <p style={S}>Il accompagne la tige.</p>
      <p style={S}>Il caresse les feuilles.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Il entoure la fleur.</p>
      <p style={{ ...S, fontWeight: 700 }}>Il relie toutes les parties du jardin.</p>
      <p style={S}>Comme dans la nature, le souffle représente cette présence silencieuse qui circule en vous à chaque instant.</p>
      <p style={S}>Votre respiration.</p>
      <p style={S}>Votre capacité à être ici.</p>
      <p style={S}>Maintenant.</p>

      <p style={{ ...S, margin: '16px 0 8px' }}>Alors prenez une profonde inspiration...</p>
      <p style={S}>Puis laissez l'air ressortir lentement.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Sans effort.</p>
      <p style={S}>Encore une fois.</p>
      <p style={S}>Inspirez profondément...</p>
      <p style={{ ...S, fontWeight: 700 }}>Et expirez doucement.</p>
      <p style={{ ...S, fontWeight: 700 }}>Très bien.</p>
      <p style={S}>Et maintenant...</p>
      <p style={S}>Pendant quelques instants, il n'y a rien à faire.</p>
      <p style={S}>Rien à comprendre.</p>
      <p style={S}>Rien à réussir.</p>
      <p style={S}>Simplement être là.</p>

      <Pause />

      <p style={S}>Observez votre respiration.</p>
      <p style={S}>L'air qui entre.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>L'air qui ressort.</p>
      <p style={S}>Naturellement.</p>
      <p style={S}>Comme il le fait depuis toujours.</p>
      <p style={S}>Sans que vous ayez besoin d'y penser.</p>

      <Pause />

      <p style={S}>Peut-être remarquez-vous que lorsque vous portez votre attention sur votre souffle...</p>
      <p style={S}>Quelque chose ralentit déjà à l'intérieur de vous.</p>
      <p style={S}>Comme si votre esprit comprenait qu'il peut se reposer quelques instants.</p>

      <Pause />

      <p style={S}>Imaginez maintenant votre jardin intérieur.</p>
      <p style={S}>Vous voyez les racines profondément ancrées dans la terre.</p>
      <p style={S}>La tige qui s'élève avec confiance.</p>
      <p style={S}>Les feuilles qui s'ouvrent à la lumière.</p>
      <p style={S}>La fleur qui rayonne doucement.</p>

      <Pause />

      <p style={S}>Et soudain...</p>
      <p style={{ ...S, fontWeight: 700 }}>Une légère brise apparaît.</p>
      <p style={S}>Un souffle doux.</p>
      <p style={S}>Paisible.</p>
      <p style={S}>Bienveillant.</p>

      <Pause />

      <p style={S}>Cette brise traverse lentement votre jardin.</p>
      <p style={S}>Elle fait doucement danser les feuilles.</p>
      <p style={S}>Elle effleure les pétales.</p>
      <p style={S}>Elle accompagne chaque mouvement de la plante.</p>

      <Pause />

      <p style={S}>Et vous comprenez que cette brise représente votre respiration.</p>
      <p style={S}>Toujours présente.</p>
      <p style={S}>Toujours disponible.</p>
      <p style={S}>Toujours capable de vous ramener à l'essentiel.</p>

      <Pause />

      <p style={S}>Car parfois...</p>
      <p style={S}>Nous passons beaucoup de temps dans nos pensées.</p>
      <p style={S}>Nous pensons à demain.</p>
      <p style={S}>À ce qu'il faut faire.</p>
      <p style={S}>À ce qui pourrait arriver.</p>
      <p style={S}>À ce qui aurait dû se passer autrement.</p>

      <Pause />

      <p style={S}>Et sans nous en rendre compte...</p>
      <p style={S}>Nous quittons le moment présent.</p>
      <p style={{ ...S, fontWeight: 700 }}>Nous quittons le jardin.</p>

      <Pause />

      <p style={{ ...S, fontWeight: 700 }}>Pourtant...</p>
      <p style={S}>La vie se déroule ici.</p>
      <p style={S}>Maintenant.</p>
      <p style={S}>Dans cet instant précis.</p>
      <p style={S}>Dans cette respiration.</p>

      <Pause />

      <p style={S}>Prenez un moment pour ressentir cela.</p>
      <p style={S}>Cette respiration qui entre.</p>
      <p style={S}>Cette respiration qui ressort.</p>

      <Pause />

      <p style={{ ...S, fontWeight: 700 }}>Rien d'autre n'est nécessaire.</p>

      <Pause />

      <p style={S}>Imaginez maintenant que chaque inspiration apporte de la lumière dans votre jardin.</p>
      <p style={S}>Une lumière douce.</p>
      <p style={S}>Paisible.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Réconfortante.</p>
      <p style={S}>Et qu'à chaque expiration...</p>
      <p style={S}>Vous relâchez ce qui n'a plus besoin d'être porté.</p>
      <p style={S}>Les tensions.</p>
      <p style={S}>Les inquiétudes.</p>
      <p style={S}>Les pensées répétitives.</p>

      <Pause />

      <p style={S}>Comme le vent qui emporte quelques feuilles devenues inutiles.</p>

      <Pause />

      <p style={S}>À chaque respiration...</p>
      <p style={S}>Vous créez davantage d'espace.</p>
      <p style={S}>Davantage de calme.</p>
      <p style={S}>Davantage de présence.</p>

      <Pause />

      <p style={S}>Et tandis que ce calme s'installe...</p>
      <p style={S}>Imaginez que le temps ralentit.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Quelques instants seulement.</p>
      <p style={S}>Comme si votre jardin entier respirait avec vous.</p>

      <Pause />

      <p style={S}>Les racines respirent.</p>
      <p style={S}>La tige respire.</p>
      <p style={S}>Les feuilles respirent.</p>
      <p style={S}>La fleur respire.</p>
      <p style={{ ...S, fontWeight: 700 }}>Et vous respirez avec elles.</p>

      <Pause />

      <p style={S}>Peut-être pouvez-vous ressentir une profonde connexion.</p>
      <p style={S}>Une sensation d'unité.</p>
      <p style={S}>Comme si tout était déjà là.</p>
      <p style={{ ...S, fontWeight: 700 }}>Comme si rien ne manquait.</p>

      <Pause />

      <div style={{ background: 'rgba(200,168,112,0.12)', border: '1px solid rgba(200,168,112,0.30)', borderRadius: 16, padding: '24px 20px 16px', margin: '4px 0 24px' }}>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a08040', textAlign: 'center', margin: '0 0 18px' }}>Répétez intérieurement</p>
        <Affirmation>Je suis ici.</Affirmation>
        <Affirmation>Je suis présent à cet instant.</Affirmation>
        <Affirmation>Je peux revenir à mon souffle quand j'en ai besoin.</Affirmation>
        <Affirmation>Je laisse circuler la vie en moi.</Affirmation>
        <Affirmation>Je m'accorde le droit de ralentir.</Affirmation>
      </div>

      <p style={S}>Laissez ces mots résonner doucement.</p>
      <p style={S}>Comme un écho dans votre jardin intérieur.</p>

      <Pause />

      <p style={S}>Imaginez maintenant que la brise devient légèrement plus lumineuse.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Comme si elle transportait de petites particules dorées.</p>
      <p style={S}>Chaque inspiration les fait entrer en vous.</p>
      <p style={S}>Chaque expiration les diffuse dans tout votre jardin.</p>

      <Pause />

      <p style={S}>Peu à peu...</p>
      <p style={S}>Les racines s'illuminent.</p>
      <p style={S}>La tige s'illumine.</p>
      <p style={S}>Les feuilles s'illuminent.</p>
      <p style={{ ...S, fontWeight: 700, margin: '0 0 16px' }}>La fleur s'illumine.</p>

      <Pause />

      <p style={S}>Et vous comprenez peut-être quelque chose de simple.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Le souffle n'est pas seulement ce qui circule dans le jardin.</p>
      <p style={{ ...S, fontWeight: 700 }}>Le souffle est ce qui relie tout.</p>
      <p style={S}>Il relie votre corps à votre esprit.</p>
      <p style={S}>Votre intérieur au monde extérieur.</p>
      <p style={S}>Le passé au présent.</p>
      <p style={S}>Le mouvement au calme.</p>

      <Pause />

      <p style={S}>Et chaque fois que vous aurez besoin de retrouver votre équilibre...</p>
      <p style={S}>Vous pourrez revenir ici.</p>
      <p style={S}>À votre souffle.</p>
      <p style={S}>À cette respiration.</p>
      <p style={S}>À ce jardin.</p>

      <Pause />

      <p style={S}>Prenez maintenant une dernière inspiration profonde.</p>
      <p style={S}>Laissez l'air remplir doucement votre poitrine.</p>
      <p style={S}>Puis expirez lentement.</p>
      <p style={S}>Très lentement.</p>

      <Pause />

      <p style={S}>Et observez le calme qui est là.</p>
      <p style={S}>Peut-être discret.</p>
      <p style={S}>Peut-être plus présent qu'au début.</p>

      <Pause />

      <p style={S}>Gardez avec vous cette sensation tout au long de votre journée.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Et souvenez-vous :</p>
      <p style={S}>Vous n'avez pas besoin de contrôler le vent.</p>
      <p style={{ ...S, fontWeight: 700, margin: '0 0 16px' }}>Vous avez simplement besoin de respirer avec lui.</p>
      <p style={{ ...S, fontWeight: 700, fontSize: 'clamp(20px, 5vw, 24px)', margin: '0 0 48px' }}>Car parfois, prendre soin de soi commence simplement par une respiration consciente.</p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <PrimaryButton onClick={onNext}>Je continue</PrimaryButton>
        {onAudio && (
          <button onClick={onAudio} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontSize: 14, color: 'rgba(50,35,20,0.45)', textDecoration: 'underline', textUnderlineOffset: 3, padding: 0 }}>
            🔊 écouter l'audio à la place
          </button>
        )}
      </div>
    </div>
  )
}

// ── Transition fleur — Jour 6 (slide 4) ───────────────────────────────────

function JardinFleurTransition({ onStart, onBack }) {
  const { user } = useAuth()
  const userId   = user?.id
  const [plantData, setPlantData] = useState(null)
  const [settings,  setSettings]  = useState(null)
  const [phase,     setPhase]     = useState(0)
  const [leaving,   setLeaving]   = useState(false)

  // Fetch plant data
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const [plantRes, settingsRes] = await Promise.allSettled([
        supabase.from('plants')
          .select('health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
          .eq('user_id', userId).order('date', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('garden_settings')
          .select('petal_color1, petal_color2, petal_shape')
          .eq('user_id', userId).maybeSingle(),
      ])
      setPlantData(plantRes.status === 'fulfilled' ? (plantRes.value.data ?? null) : null)
      setSettings(settingsRes.status === 'fulfilled' ? (settingsRes.value.data ?? null) : null)
    })()
  }, [userId])

  // Séquence de phases
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),   // ligne 1
      setTimeout(() => setPhase(2), 700),   // ligne 2
      setTimeout(() => setPhase(3), 1500),  // glow burst
      setTimeout(() => setPhase(4), 1800),  // fleur apparaît
      setTimeout(() => setPhase(5), 3400),  // contemplation (respiration active)
      setTimeout(() => setPhase(6), 5000),  // "Voici ton jardin."
      setTimeout(() => setPhase(7), 6300),  // "Il reflète..."
      setTimeout(() => setPhase(8), 7800),  // bouton
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  function handleContinue() {
    setLeaving(true)
    setTimeout(() => onStart(), 750)
  }

  const health = plantData?.health ?? 65
  const gardenSettings = settings ? {
    ...DEFAULT_GARDEN_SETTINGS,
    petalColor1: settings.petal_color1 ?? DEFAULT_GARDEN_SETTINGS.petalColor1,
    petalColor2: settings.petal_color2 ?? DEFAULT_GARDEN_SETTINGS.petalColor2,
    petalShape:  settings.petal_shape  ?? DEFAULT_GARDEN_SETTINGS.petalShape,
  } : DEFAULT_GARDEN_SETTINGS

  const ST = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle:  'italic',
    fontSize:   'clamp(19px, 4.8vw, 23px)',
    color:      '#0f0808',
    textAlign:  'center',
    lineHeight: 1.85,
    margin:     0,
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px 60px',
      position: 'relative', overflow: 'hidden',
      opacity:    leaving ? 0 : 1,
      transition: leaving ? 'opacity 650ms ease-in' : 'none',
    }}>

      <style>{`
        @keyframes glowBurst {
          0%   { opacity: 0; transform: scale(0.08); }
          30%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(3); }
        }
        @keyframes flowerBreathe {
          0%, 100% { transform: scale(0.97); }
          50%       { transform: scale(1.015); }
        }
        @keyframes cardFleurBreathe {
          0%, 100% { transform: translateY(15%) scale(1.1); }
          50%       { transform: translateY(13%) scale(1.12); }
        }
      `}</style>

      {/* Bouton retour discret */}
      <div style={{ position: 'absolute', top: 16, left: 20 }}>
        <BackButton onClick={onBack} />
      </div>

      {/* PHASE 1 — Intro texte */}
      <div style={{
        textAlign: 'center', marginBottom: 36,
        opacity:    phase >= 6 ? 0 : 1,
        transition: 'opacity 900ms ease',
        pointerEvents: 'none',
      }}>
        <p style={{ ...ST, ...fadeIn(phase >= 1), margin: '0 0 6px' }}>
          Ce que tu as ressenti ces derniers jours…
        </p>
        <p style={{ ...ST, fontStyle: 'normal', fontWeight: 700, fontSize: 'clamp(20px, 5.5vw, 28px)', ...fadeIn(phase >= 2), margin: 0 }}>
          commence à prendre forme.
        </p>
      </div>

      {/* PHASE 2 — Glow central */}
      {phase === 3 && (
        <div style={{
          position: 'absolute',
          width: 110, height: 110, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,90,0.95) 0%, rgba(255,170,50,0.5) 40%, transparent 70%)',
          animation: 'glowBurst 1s ease-out forwards',
          pointerEvents: 'none', zIndex: 10,
        }} />
      )}

      {/* PHASE 2-3 — Fleur vivante (3 wrappers pour séparer les transforms) */}
      {/* Wrapper A : zoom leaving */}
      <div style={{
        transform:  leaving ? 'scale(1.28)' : 'scale(1)',
        transition: leaving ? 'transform 700ms ease-in' : 'none',
      }}>
        {/* Wrapper B : respiration loop */}
        <div style={{
          animation: phase >= 5 && !leaving ? 'flowerBreathe 3.8s ease-in-out infinite' : 'none',
        }}>
          {/* Wrapper C : reveal (clip-path + scale-up + fade) */}
          <div style={{
            opacity:   phase >= 4 ? 1 : 0,
            clipPath:  phase >= 4 ? 'circle(100% at 50% 50%)' : 'circle(0% at 50% 50%)',
            transform: phase >= 4 ? 'scale(1)' : 'scale(0.45)',
            transition: [
              'opacity 1300ms ease',
              'clip-path 1800ms cubic-bezier(0.22,1,0.36,1)',
              'transform 1400ms cubic-bezier(0.34,1.15,0.64,1)',
            ].join(', '),
            maxWidth: 320,
          }}>
            <PlantSVG
              health={health}
              gardenSettings={gardenSettings}
              lumensLevel="moyen"
              lumensTotal={0}
              compact={true}
            />
          </div>
        </div>
      </div>

      {/* PHASE 4 — Ancrage texte */}
      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <p style={{ ...ST, fontStyle: 'normal', fontWeight: 700, fontSize: 'clamp(22px, 6vw, 30px)', margin: '0 0 10px', ...fadeIn(phase >= 6) }}>
          Voici ton jardin.
        </p>
        <p style={{ ...ST, margin: '0 0 4px', ...fadeIn(phase >= 7) }}>Il reflète ce que tu vis.</p>
        <p style={{ ...ST, margin: 0, ...fadeIn(phase >= 7) }}>Sans jugement.</p>
      </div>

      {/* Bouton */}
      <div style={{ marginTop: 40, ...fadeIn(phase >= 8), pointerEvents: phase >= 8 ? 'auto' : 'none' }}>
        <PrimaryButton onClick={handleContinue}>Continuer</PrimaryButton>
      </div>
    </div>
  )
}

// ── Rituel guidé — Mon Jardin (Jour 6) ────────────────────────────────────

function JardinGuidedRituel({ onNext, onBack }) {
  const [phase, setPhase] = useState(0)
  const phaseRefs = useRef({})

  useEffect(() => {
    const T = [0, 150, 300, 450, 600, 750, 900]
    const timers = T.map((ms, i) => setTimeout(() => setPhase(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [])

  const S = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle:  'italic',
    fontSize:   'clamp(20px, 5.5vw, 28px)',
    color:      '#0f0808',
    textAlign:  'center',
    lineHeight: 1.7,
    margin:     '0 0 20px',
  }

  function B({ children }) {
    return <strong style={{ fontWeight: 600, fontStyle: 'inherit' }}>{children}</strong>
  }

  function FeatureBadge({ label, color, bg, border }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 16px' }}>
        <span style={{
          display: 'inline-block',
          fontSize: 'clamp(11px, 2.8vw, 13px)',
          fontFamily: 'Jost, sans-serif',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color,
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 100,
          padding: '5px 16px',
        }}>
          {label}
        </span>
      </div>
    )
  }

  function block(n, content) {
    return (
      <div ref={el => { phaseRefs.current[n] = el }} style={{ scrollMarginTop: '72px', ...fadeIn(phase >= n) }}>
        {content}
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 20px 80px' }}>
      <BackButton onClick={onBack} />

      {/* Titre */}
      <div style={{ textAlign: 'center', margin: '12px 0 32px' }}>
        <p style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 'clamp(11px, 2.8vw, 13px)',
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#1a1010',
          margin: '0 0 8px',
        }}>
          Laisse-moi te présenter
        </p>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(30px, 7.5vw, 40px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#1a0a28',
          lineHeight: 1.15,
          margin: '0 0 10px',
        }}>
          ta fleur
        </h2>
        <div style={{
          width: 48, height: 2,
          background: 'linear-gradient(to right, transparent, #8878a8, transparent)',
          margin: '0 auto',
        }} />
      </div>

      {block(1, <p style={{ ...S, fontStyle: 'normal', fontWeight: 500, margin: '0 0 28px' }}>Ce jardin <B>évolue avec toi</B>.</p>)}

      {block(2, <>
        <FeatureBadge label="Ma Fleur" color="#8878a8" bg="rgba(136,120,168,0.10)" border="rgba(136,120,168,0.28)" />
        <p style={S}>Elle change selon ton <B>état intérieur</B>.<br />Elle te montre ce que tu ne vois pas toujours.</p>
      </>)}

      {block(3, <>
        <FeatureBadge label="Bilan du matin" color="#a07060" bg="rgba(184,120,100,0.10)" border="rgba(184,120,100,0.28)" />
        <p style={S}>Quelques minutes suffisent.<br />Et ton jardin <B>s'ajuste</B>.</p>
      </>)}

      {block(4, <>
        <FeatureBadge label="Action rapide" color="#5878a8" bg="rgba(88,120,168,0.10)" border="rgba(88,120,168,0.28)" />
        <p style={S}>Même un instant compte.<br />Ton jardin <B>reste vivant</B>.</p>
      </>)}

      {block(5, <>
        <FeatureBadge label="Boîte à Graines" color="#507860" bg="rgba(80,120,96,0.10)" border="rgba(80,120,96,0.28)" />
        <p style={S}>Note ce qui a <B>compté</B> aujourd'hui.</p>
      </>)}

      {block(6, <p style={{ ...S, fontStyle: 'normal', fontWeight: 700, fontSize: 'clamp(20px, 5.5vw, 26px)', margin: '12px 0 32px' }}>
        Tu n'as rien à réussir.<br />Juste à <B>observer</B>.
      </p>)}

      <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= 7), pointerEvents: phase >= 7 ? 'auto' : 'none' }}>
        <PrimaryButton onClick={onNext}>J'ai compris</PrimaryButton>
      </div>
    </div>
  )
}

// ── Découverte Communauté (Jour 7) ────────────────────────────────────────

function PhoneMockupModal({ feature, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(10,8,6,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 220, height: 440, borderRadius: 36,
          background: '#1a1a1a',
          boxShadow: '0 0 0 6px #2a2a2a, 0 24px 60px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 60, height: 8, background: '#111', borderRadius: 8, zIndex: 2 }} />
          <div style={{ flex: 1, margin: 4, borderRadius: 32, overflow: 'hidden', background: '#0a1628', position: 'relative' }}>
            {feature.image ? (
              <>
                <img src={feature.image} alt={feature.label} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'top', display: 'block', background: '#fff' }} />
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none', overflow: 'hidden',
                }}>
                  <span style={{
                    fontFamily: 'Jost, sans-serif',
                    fontSize: 38,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'rgba(80,40,20,0.18)',
                    transform: 'rotate(-35deg)',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}>
                    EXEMPLE
                  </span>
                </div>
              </>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
                <span style={{ fontSize: 52 }}>{feature.emoji}</span>
                <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 16, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>{feature.label}</p>
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Bient&#244;t disponible</p>
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 18, fontWeight: 600, fontStyle: 'italic', color: '#fff', margin: '0 0 12px' }}>{feature.label}</p>
          <button onClick={onClose} style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100, padding: '8px 24px', cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
function CommunauteDiscovery({ answerKey, onAnswer, onBack }) {
  const [phase,       setPhase]       = useState(0)
  const [openFeature, setOpenFeature] = useState(null)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const features = [
    { emoji: '🌍', label: 'Le Jardin Collectif',    desc: "Un espace partagé où chaque fleur contribue au jardin commun par sa présence",                                                color: '#1a1010', image: '/screens/jardin-collectif.jpeg' },
    { emoji: '🤝', label: 'Le Club des Jardiniers', desc: "Une communauté qui avance ensemble, se soutient et partage des ondes positives",                                              color: '#9a78b0', image: '/screens/club-jardiniers.jpeg' },
    { emoji: '🎯', label: 'Les Défis',              desc: "Des challenges pour partager ensemble des mises en action et s\u2019encourager",                                              color: '#b07860', image: '/screens/defis.jpeg' },
    { emoji: '🌿', label: 'Les Ateliers',           desc: "Des sessions guidées pour approfondir ton mieux-\u00eatre, accompagné par des professionnels",                              color: '#607860', image: '/screens/ateliers.jpeg' },
    { emoji: '✨', label: 'Les Lumens',             desc: "L\u2019\u00e9nergie de ton engagement, visible et partageable",                                                             color: '#a8a030', image: '/screens/lumens.jpeg' },
    { emoji: '📚', label: 'La Jardinoth\èque', desc: "Un ensemble d\u2019outils pour t'accompagner dans ton bien-\u00eatre",                                                    color: '#1a1010', image: '/screens/jardinotheque.jpeg' },
  ]

  return (
    <>
      {openFeature && <PhoneMockupModal feature={openFeature} onClose={() => setOpenFeature(null)} />}
      <div className="wof-in" style={{ padding: '8px 20px 40px' }}>
        <BackButton onClick={onBack} />

        <div style={{ textAlign: 'center', margin: '8px 0 28px', ...fadeIn(phase >= 1) }}>
          <p style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 'clamp(11px, 2.8vw, 13px)',
            fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#1a1010', margin: '0 0 8px',
          }}>
            Le jardin s'ouvre
          </p>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(24px, 6vw, 32px)',
          fontWeight: 400, fontStyle: 'italic',
          color: '#2a1828', lineHeight: 1.25, margin: '0 0 6px',
        }}>
          Tu n'es pas seul·e
        </h2>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(19px, 4.8vw, 23px)',
          fontStyle: 'italic', color: '#1a1010', margin: 0,
        }}>
          D'autres espaces du jardin t'attendent
        </p>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(19px, 4.8vw, 23px)',
          fontWeight: 700, fontStyle: 'normal',
          color: '#0f0808', margin: '12px 0 16px',
        }}>
          Laisse-moi te les présenter.
        </p>
      </div>

      <div style={{ maxWidth: 340, margin: '24px auto 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {features.map((f, i) => (
          <div key={f.label}
            onClick={() => setOpenFeature(f)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 18px',
              background: 'rgba(255,255,255,0.72)',
              borderRadius: 14,
              border: `1.5px solid ${f.color}55`,
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? 'translateY(0)' : 'translateY(8px)',
              transition: `opacity 600ms ease ${i * 120}ms, transform 600ms ease ${i * 120}ms`,
              cursor: 'pointer',
            }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: `${f.color}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>
              {f.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 600, color: '#2a1828', marginBottom: 2 }}>
                {f.label}
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(14px, 3.5vw, 17px)', fontStyle: 'italic', color: '#1a1010', lineHeight: 1.3 }}>
                {f.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        maxWidth: 340, margin: '0 auto 32px',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 18px',
        background: 'rgba(255,255,255,0.72)',
        borderRadius: 14,
        border: '1.5px solid rgba(58,154,40,.35)',
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 600ms ease 740ms, transform 600ms ease 740ms',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Badge Bientôt disponible */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: 'linear-gradient(135deg, #3a9a28, #2a7a18)',
          color: '#fff',
          fontSize: 9, fontWeight: 700, fontFamily: 'Jost, sans-serif',
          letterSpacing: '0.10em', textTransform: 'uppercase',
          padding: '4px 12px', borderRadius: '0 14px 0 10px',
        }}>
          Bientôt disponible
        </div>
        <div style={{ flexShrink: 0 }}>
          <img src="/peps1.png" alt="Pep's" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px rgba(58,154,40,.30)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 600, color: '#2a1828' }}>Pep's</div>
          </div>
          <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(14px, 3.5vw, 17px)', fontStyle: 'italic', color: '#1a1010', lineHeight: 1.3 }}>
            L'app mobile pour cultiver ton bien-être partout.
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center',
        opacity: phase >= 3 ? 1 : 0,
        transition: 'opacity 600ms ease 700ms',
      }}>
        <PrimaryButton onClick={() => onAnswer(answerKey, 'vu')}>
          Entre dans l'expérience
        </PrimaryButton>
      </div>
    </div>
    </>
  )
}

// ── Rituel guidé — Communauté (Jour 7) ────────────────────────────────────

function PepsPage({ onNext }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const T = [0, 200, 500, 900, 1400]
    const timers = T.map((ms, i) => setTimeout(() => setPhase(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f6fdf4 0%, #eaf5e6 40%, #f0fbe8 100%)', padding: '0 0 80px', overflowX: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 0', ...fadeIn(phase >= 1) }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(58,154,40,.10)', border: '1px solid rgba(58,154,40,.25)', borderRadius: 100, padding: '4px 14px', marginBottom: 18 }}>
          <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#3a9a28', fontStyle: 'italic' }}>Bientôt disponible</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 10 }}>
          <img src="/icon_iOs.jpg" alt="Pep's app" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', transform: 'rotate(-8deg)', boxShadow: '0 6px 18px rgba(58,154,40,.30)' }} />
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(34px, 8vw, 48px)', fontWeight: 700, fontStyle: 'italic', color: '#0a1808', margin: 0, lineHeight: 1.1 }}>Pep's</h2>
        </div>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 'clamp(13px, 3.5vw, 15px)', color: 'rgba(20,50,10,.55)', letterSpacing: '.06em', margin: 0 }}>L'application mobile de ton mieux-être</p>
      </div>

      {/* Phone mockup + mascot */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 0, margin: '32px 0 0', ...fadeIn(phase >= 2), position: 'relative' }}>
        {/* Phone */}
        <div style={{ position: 'relative', width: 200, height: 390, borderRadius: 36, background: 'linear-gradient(160deg, #3a9a28 0%, #2a7a18 55%, #1e6010 100%)', boxShadow: '0 24px 60px rgba(58,154,40,.38), 0 6px 20px rgba(0,0,0,.18)', border: '6px solid rgba(255,255,255,.18)', flexShrink: 0 }}>
          {/* Notch */}
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 64, height: 10, background: 'rgba(0,0,0,.30)', borderRadius: 8 }} />
          {/* Screen content */}
          <div style={{ position: 'absolute', inset: '28px 10px 10px', borderRadius: 24, background: 'rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '18px 12px 12px', gap: 10, overflow: 'hidden' }}>
            <img src="/peps1.png" alt="Pep's mascot" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 16px rgba(0,0,0,.25)', flexShrink: 0 }} />
            <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '.06em' }}>Bonjour ! 🌿</div>
            <div style={{ width: '100%', background: 'rgba(255,255,255,.15)', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: 'rgba(255,255,255,.70)', marginBottom: 4 }}>Inspiration du jour</div>
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 13, fontStyle: 'italic', color: '#fff', lineHeight: 1.4 }}>"Chaque petit pas compte dans ton jardin intérieur."</div>
            </div>
            {[
              { label: '🔔 Rappels bien-être', v: 78 },
              { label: '🌸 Ma Fleur', v: 92 },
            ].map(item => (
              <div key={item.label} style={{ width: '100%', background: 'rgba(255,255,255,.12)', borderRadius: 10, padding: '8px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, color: 'rgba(255,255,255,.80)' }}>{item.label}</span>
                  <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, color: 'rgba(255,255,255,.60)' }}>{item.v}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,.18)', borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${item.v}%`, background: 'rgba(255,255,255,.75)', borderRadius: 4 }} />
                </div>
              </div>
            ))}
            {/* Bottom nav dots */}
            <div style={{ marginTop: 'auto', display: 'flex', gap: 6 }}>
              {[1,2,3,4].map(i => <div key={i} style={{ width: i === 1 ? 20 : 6, height: 6, borderRadius: 4, background: i === 1 ? 'rgba(255,255,255,.90)' : 'rgba(255,255,255,.30)' }} />)}
            </div>
          </div>
        </div>
        {/* peps2.png overlapping to the right */}
        <img src="/peps2.png" alt="Pep's" style={{ position: 'absolute', right: 'calc(50% - 200px)', bottom: 0, width: 140, height: 'auto', filter: 'drop-shadow(0 8px 24px rgba(58,154,40,.35))' }} />
      </div>

      {/* Citation mascot */}
      <div style={{ padding: '36px 24px 0', maxWidth: 380, margin: '0 auto', ...fadeIn(phase >= 3) }}>
        <blockquote style={{ margin: 0, padding: '24px 22px', background: 'rgba(255,255,255,.75)', borderRadius: 18, border: '1.5px solid rgba(58,154,40,.20)', boxShadow: '0 4px 20px rgba(58,154,40,.08)' }}>
          <div style={{ fontSize: 48, lineHeight: 1, color: '#3a9a28', fontFamily: 'Georgia, serif', marginBottom: 4, opacity: .6 }}>"</div>
          <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(20px, 5.5vw, 26px)', fontWeight: 700, fontStyle: 'italic', color: '#0a1808', lineHeight: 1.55, margin: '0 0 18px' }}>
            Je suis là pour t'aider à prendre soin de ton jardin… sans te compliquer la vie.
          </p>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 'clamp(15px, 4vw, 18px)', fontWeight: 500, color: '#1a3a10', lineHeight: 1.65, margin: '0 0 18px' }}>
            Pas besoin de réfléchir longtemps.<br />
            On fait simple. On fait court. On commence maintenant.
          </p>
          <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(20px, 5.5vw, 26px)', fontWeight: 700, fontStyle: 'italic', color: '#3a9a28', lineHeight: 1.4, margin: 0 }}>
            Tu viens ?
          </p>
        </blockquote>
      </div>

      {/* Features */}
      <div style={{ padding: '36px 24px 0', maxWidth: 380, margin: '0 auto', ...fadeIn(phase >= 3) }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '🔔', title: 'Rappels personnalisés', sub: 'Reçois un rappel au moment idéal pour toi', desc: 'On te relance au bon moment, juste ce qu\'il faut, quand il faut' },
            { icon: '🌸', title: 'Ma fleur, partout', sub: 'Ton équilibre à portée de main', desc: 'Accédez à ton jardin, où que tu sois' },
            { icon: '☀️', title: 'Infos positives', sub: 'Nourris ton esprit autrement', desc: 'Un flux simple, inspirant et ressourçant' },
            { icon: '🌿', title: 'Espace média sain', sub: 'Respire loin du bruit', desc: "Des contenus choisis pour t'apaiser" },
            { icon: '📚', title: 'Jardinothèque', sub: 'Explore, pratique, évolue', desc: 'Des outils concrets pour avancer à ton rythme' },
            { icon: '💎', title: 'Inclus Premium', sub: "Accède à l'expérience complète", desc: "Toutes les ressources dès l'ouverture de l'app" },
          ].map(f => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,.72)', borderRadius: 14, border: '1px solid rgba(58,154,40,.18)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 22 }}>{f.icon}</div>
              <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, fontWeight: 700, color: '#1a3a10', lineHeight: 1.3 }}>{f.title}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 13, fontStyle: 'italic', fontWeight: 600, color: '#2a5a18', lineHeight: 1.35 }}>{f.sub}</div>
              <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 10.5, color: 'rgba(20,50,10,.52)', lineHeight: 1.45 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '36px 24px 0', textAlign: 'center', ...fadeIn(phase >= 4) }}>
        <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(17px, 4.5vw, 20px)', fontStyle: 'italic', color: 'rgba(10,30,8,.65)', margin: '0 0 24px', lineHeight: 1.6 }}>
          Pep's sera disponible <strong style={{ fontWeight: 600, fontStyle: 'inherit' }}>prochainement</strong>.<br />Ton abonnement Premium te donnera accès dès sa sortie.
        </p>
        <PrimaryButton onClick={onNext}>Commencer mon jardin</PrimaryButton>
      </div>
    </div>
  )
}

function CommunauteGuidedRituel({ onNext, onBack }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const T = [0, 800, 1600, 2600, 3800, 4600]
    const timers = T.map((ms, i) => setTimeout(() => setPhase(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [])

  const S = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle: 'italic',
    fontSize: 'clamp(19px, 4.8vw, 23px)',
    color: '#0f0808',
    textAlign: 'center',
    lineHeight: 1.85,
    margin: '0 0 28px',
  }

  const FLOWERS = [
    {
      label: 'Fleur en chemin', labelColor: '#c87888',
      bg: 'linear-gradient(135deg, #fdf0f4 0%, #f8dce4 100%)',
      phrase: "Aujourd'hui… j'avance doucement.",
      health: 22,
      gs: { ...DEFAULT_GARDEN_SETTINGS, petalColor1: '#e87898', petalColor2: '#f0a8c0' },
    },
    {
      label: 'Fleur en équilibre', labelColor: '#9878b8',
      bg: 'linear-gradient(135deg, #f4f0fa 0%, #e4d8f4 100%)',
      phrase: "Je retrouve… un peu d'équilibre.",
      health: 55,
      gs: { ...DEFAULT_GARDEN_SETTINGS, petalColor1: '#a878c8', petalColor2: '#c8a8e8' },
    },
    {
      label: 'Fleur en élan', labelColor: '#b89028',
      bg: 'linear-gradient(135deg, #fdf8e8 0%, #f4e8c0 100%)',
      phrase: 'Je me sens plus léger.',
      health: 82,
      gs: { ...DEFAULT_GARDEN_SETTINGS, petalColor1: '#e8c058', petalColor2: '#f4d888' },
    },
  ]

  return (
    <div style={{ padding: '16px 20px 80px' }}>
      <BackButton onClick={onBack} />

      {/* Ligne 1 */}
      <p style={{ ...S, ...fadeIn(phase >= 1) }}>
        Ta fleur <strong style={{ fontWeight: 600, fontStyle: 'inherit' }}>existe</strong>.
      </p>

      {/* Ligne 2 — après pause */}
      <p style={{ ...S, ...fadeIn(phase >= 2) }}>
        Et d'autres <strong style={{ fontWeight: 600, fontStyle: 'inherit' }}>évoluent</strong> aussi.
      </p>

      {/* 3 cartes — apparition une par une */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, margin: '8px auto 32px', maxWidth: '78%' }}>
        {FLOWERS.map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'stretch',
            background: f.bg,
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 4px 18px rgba(0,0,0,0.08)',
            minHeight: 150,
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0)' : 'translateY(9px)',
            transition: `opacity 950ms cubic-bezier(0.25,0.46,0.45,0.94) ${i * 380}ms, transform 950ms cubic-bezier(0.25,0.46,0.45,0.94) ${i * 380}ms`,
          }}>
            {/* Fleur avec légère respiration */}
            <div style={{ width: 130, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: -10,
                transform: 'translateY(15%) scale(1.1)',
                animation: 'cardFleurBreathe 4s ease-in-out infinite',
                animationDelay: `${i * 1.2}s`,
              }}>
                <PlantSVG health={f.health} gardenSettings={f.gs} lumensLevel="halo" clearSky={true} />
              </div>
            </div>

            {/* Contenu */}
            <div style={{ flex: 1, padding: '16px 14px 14px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 13 }}>🌸</span>
                <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 600, color: f.labelColor, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {f.label}
                </span>
              </div>
              <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(16px, 4vw, 19px)', fontStyle: 'italic', color: '#1a1010', lineHeight: 1.45, margin: 0 }}>
                «&nbsp;{f.phrase}&nbsp;»
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Phrase intermédiaire — après les cards */}
      <p style={{ ...S, ...fadeIn(phase >= 4) }}>
        D'autres vivent aussi des moments comme celui-ci.
      </p>

      {/* Bas de page */}
      <p style={{ ...S, fontStyle: 'normal', color: '#0f0808', margin: '0 0 28px', ...fadeIn(phase >= 5) }}>
        Chaque fleur a son histoire.<br />La tienne compte aussi.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= 6), pointerEvents: phase >= 6 ? 'auto' : 'none' }}>
        <PrimaryButton onClick={onNext}>Retrouver mon jardin</PrimaryButton>
      </div>
    </div>
  )
}

// ── RITUEL ─────────────────────────────────────────────────────────────────

function DayRituel({ data, answers, dayColor, onNext, onBack, onScreenChange }) {
  const [showTransition, setShowTransition] = useState(!!data.getIntro)
  const [freeChoice,     setFreeChoice]     = useState(null)
  const [choiceStarted,  setChoiceStarted]  = useState(false)
  const [timerDone,      setTimerDone]      = useState(false)

  useEffect(() => {
    onScreenChange?.(showTransition ? 'rituel_transition' : 'rituel')
    if (!showTransition) {
      document.getElementById('wof-scroll').scrollTop = 0
    }
  }, [showTransition])

  if (showTransition) {
    const introData = data.getIntro(answers)
    if (introData.showFleur) {
      return <JardinFleurTransition onStart={() => setShowTransition(false)} onBack={onBack} />
    }
    return (
      <RituelTransition
        introData={introData}
        dayColor={dayColor}
        onStart={() => setShowTransition(false)}
        onBack={onBack}
      />
    )
  }
  if (data.isGuided === 'tige')       return <TigeGuidedRituel      onNext={onNext} onBack={onBack} />
  if (data.isGuided === 'feuilles')   return <FeuillesGuidedRituel  onNext={onNext} onBack={onBack} />
  if (data.isGuided === 'fleurs')     return <FleursGuidedRituel    onNext={onNext} onBack={onBack} />
  if (data.isGuided === 'souffle')    return <SouffleGuidedRituel   onNext={onNext} onBack={onBack} />
  if (data.isGuided === 'jardin')     return <JardinGuidedRituel    onNext={onNext} onBack={onBack} />
  if (data.isGuided === 'communaute') return <CommunauteGuidedRituel onNext={onNext} onBack={onBack} />
  if (data.isGuided)                  return <RacinesGuidedRituel   onNext={onNext} onBack={onBack} />

  const isFree      = !!data.isFreeChoice
  const activeLines = isFree && freeChoice ? freeChoice.lines        : data.lines
  const activeDur   = isFree && freeChoice ? freeChoice.timerDuration : data.timerDuration
  const activeLabel = isFree && freeChoice ? freeChoice.label        : data.timerLabel
  const canContinue = isFree
    ? (!choiceStarted || timerDone)
    : (!data.hasTimer || timerDone)

  return (
    <div className="wof-in" style={{ padding: '8px 20px 16px' }}>
      <BackButton onClick={onBack} />

      <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 500, color: dayColor || '#c8a0b0', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '8px 0 6px', textAlign: 'center' }}>
        {data.zone}
      </p>

      {[data.intro].filter(Boolean).map((line, i) => (
        <p key={i} style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(15px, 3.5vw, 18px)', fontStyle: 'italic', color: '#000', textAlign: 'center', lineHeight: 1.7, margin: '0 0 12px' }}>
          {line}
        </p>
      ))}

      {isFree && !choiceStarted && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {data.freeChoices.map((fc) => (
            <button
              key={fc.label}
              onClick={() => { setFreeChoice(fc); setChoiceStarted(true) }}
              style={{ fontFamily: 'Jost, sans-serif', fontSize: 14, color: '#000', background: '#f4eee8', border: 'none', borderRadius: 14, padding: '14px 20px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ede4de' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f4eee8' }}
            >
              <span style={{ fontWeight: 500 }}>{fc.label}</span>
              <span style={{ fontSize: 12, color: '#a09090' }}>{fc.desc}</span>
            </button>
          ))}
        </div>
      )}

      {(!isFree || choiceStarted) && activeLines && (
        <div style={{ background: '#f4eee8', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
          {activeLines.map((line, i) =>
            line === '' ? (
              <div key={i} style={{ height: 7 }} />
            ) : (
              <p key={i} style={{ fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 300, color: '#000', lineHeight: 1.75, margin: 0 }}>
                {line}
              </p>
            )
          )}
        </div>
      )}

      {(!isFree || choiceStarted) && data.hasTimer && (
        <RituelTimer
          duration={activeDur}
          label={activeLabel}
          color={dayColor}
          onComplete={() => setTimerDone(true)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <PrimaryButton onClick={onNext} disabled={!canContinue && choiceStarted}>
          Continuer
        </PrimaryButton>
      </div>
    </div>
  )
}

// ── TRACE ──────────────────────────────────────────────────────────────────

function DayTrace({ text, onNext, onBack, onFleur, onScreenChange }) {
  useEffect(() => { onScreenChange?.('trace') }, [])
  return (
    <div className="wof-in" style={{ padding: '8px 20px 16px', textAlign: 'center' }}>
      <BackButton onClick={onBack} />

      <div style={{
        margin: '16px auto 0',
        maxWidth: 380,
        padding: '26px 28px',
        background: 'linear-gradient(145deg, #f8f0ec, #f0e8e4)',
        borderRadius: 18,
        boxShadow: '0 8px 28px rgba(180,120,110,0.13)',
      }}>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(17px, 4vw, 21px)',
          fontWeight: 400,
          fontStyle: 'italic',
          color: '#000',
          lineHeight: 1.7,
          margin: 0,
        }}>
          "{text}"
        </p>
      </div>

      {onFleur && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={onFleur}
            style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              color: '#fff',
              background: 'linear-gradient(135deg, #8878a8, #a890c8)',
              border: 'none',
              borderRadius: 100,
              padding: '13px 32px',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(136,120,168,0.35)',
              letterSpacing: '0.04em',
            }}
          >
            🌸 Je découvre ma fleur
          </button>
        </div>
      )}

      <div style={{ marginTop: onFleur ? 16 : 32 }}>
        <PrimaryButton onClick={onNext}>Continuer</PrimaryButton>
      </div>
    </div>
  )
}

// ── OUVERTURE ──────────────────────────────────────────────────────────────

function MultiPhaseOuverture({ slides, ctaLabel, onNext, onScreenChange, screenName = 'ouverture' }) {
  useEffect(() => { onScreenChange?.(screenName) }, [])
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = slides.map((_, i) => setTimeout(() => setPhase(i + 1), i * 1600))
    return () => timers.forEach(clearTimeout)
  }, [])

  const S = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle: 'italic',
    fontSize: 'clamp(20px, 5.5vw, 28px)',
    color: '#0f0808',
    textAlign: 'center',
    lineHeight: 1.6,
    margin: '0 0 10px',
  }

  return (
    <div style={{ padding: '24px 20px 60px', textAlign: 'center' }}>
      {slides.map((line, i) => {
        const isBold = line.startsWith('**') && line.endsWith('**')
        const text   = isBold ? line.slice(2, -2) : line
        return (
          <p key={i} style={{
            ...S,
            fontWeight: isBold ? 700 : 400,
            fontStyle: isBold ? 'normal' : 'italic',
            ...fadeIn(phase > i),
          }}>
            {text}
          </p>
        )
      })}

      <div style={{
        display: 'flex', justifyContent: 'center', marginTop: 24,
        ...fadeIn(phase >= slides.length),
        pointerEvents: phase >= slides.length ? 'auto' : 'none',
      }}>
        <PrimaryButton onClick={onNext}>{ctaLabel || 'Continuer demain'}</PrimaryButton>
      </div>
    </div>
  )
}

function TypewriterSlides({ slides, typewriterFrom = 0, ctaLabel, onNext, onScreenChange, screenName = 'trace' }) {
  useEffect(() => { onScreenChange?.(screenName) }, [])

  const normalSlides = slides.slice(0, typewriterFrom)
  const twSlides     = slides.slice(typewriterFrom)

  // Phases pour les slides normaux (fondu + respiration, 1600ms entre chaque)
  const [normalPhase, setNormalPhase] = useState(0)
  const [twStarted,   setTwStarted]   = useState(typewriterFrom === 0)

  useEffect(() => {
    if (normalPhase >= normalSlides.length) {
      const t = setTimeout(() => setTwStarted(true), 900)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setNormalPhase(p => p + 1), normalPhase === 0 ? 300 : 1600)
    return () => clearTimeout(t)
  }, [normalPhase])

  // Machine à écrire pour les slides suivants
  const [twIdx,    setTwIdx]    = useState(0)
  const [charIdx,  setCharIdx]  = useState(0)
  const [pausing,  setPausing]  = useState(false)
  const [done,     setDone]     = useState(false)

  const stripBold = (s) => s.startsWith('**') ? s.slice(2) : s
  const currentTwText = stripBold(twSlides[twIdx] ?? '')

  useEffect(() => {
    if (!twStarted || done) return
    if (pausing) {
      const t = setTimeout(() => {
        setPausing(false)
        if (twIdx < twSlides.length - 1) { setTwIdx(i => i + 1); setCharIdx(0) }
        else setDone(true)
      }, 1100)
      return () => clearTimeout(t)
    }
    if (charIdx < currentTwText.length) {
      const t = setTimeout(() => setCharIdx(i => i + 1), 50)
      return () => clearTimeout(t)
    } else {
      setPausing(true)
    }
  }, [twStarted, charIdx, pausing, done, twIdx, currentTwText])

  const PS = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle:  'italic',
    fontSize:   'clamp(19px, 4.8vw, 24px)',
    color:      '#0f0808',
    lineHeight: 1.85,
    margin:     '0 0 16px',
    textAlign:  'center',
  }

  return (
    <div style={{ padding: '32px 20px 60px', textAlign: 'center' }}>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

      {/* Slides en fondu (respiration) */}
      {normalSlides.map((slide, i) => (
        <p key={i} style={{ ...PS, ...fadeIn(normalPhase > i), marginBottom: 20 }}>
          {slide}
        </p>
      ))}

      {/* Séparateur visuel avant la citation */}
      {twStarted && normalSlides.length > 0 && (
        <div style={{ width: 40, height: 1, background: 'rgba(30,20,8,0.2)', margin: '4px auto 20px' }} />
      )}

      {/* Slides machine à écrire */}
      {twStarted && twSlides.slice(0, twIdx + 1).map((slide, i) => {
        const isBold        = slide.startsWith('**')
        const actual        = isBold ? slide.slice(2) : slide
        const text          = i < twIdx ? actual : actual.slice(0, charIdx)
        const isAttribution = slide.startsWith('—')
        const isTyping      = i === twIdx && !done && !pausing
        return (
          <p key={typewriterFrom + i} style={{
            ...PS,
            fontStyle:     isAttribution ? 'normal' : 'italic',
            fontSize:      isAttribution ? 'clamp(11px, 2.8vw, 13px)' : PS.fontSize,
            fontWeight:    isBold ? 700 : isAttribution ? 500 : 400,
            letterSpacing: isAttribution ? '0.14em' : 'normal',
            textTransform: isAttribution ? 'uppercase' : 'none',
            color:         isAttribution ? 'rgba(30,20,8,0.4)' : '#0f0808',
            margin:        isAttribution ? '8px 0 0' : '0 0 12px',
          }}>
            {text}
            {isTyping && <span style={{ animation: 'blink 0.9s ease-in-out infinite', marginLeft: 1, fontStyle: 'normal' }}>|</span>}
          </p>
        )
      })}

      {done && (
        <div style={{ marginTop: 36, ...fadeIn(true) }}>
          <PrimaryButton onClick={onNext}>{ctaLabel ?? 'Continuer'}</PrimaryButton>
        </div>
      )}
    </div>
  )
}

function DayOuverture({ text, isFinal, ctaLabel, onNext, onBack, onScreenChange }) {
  useEffect(() => { onScreenChange?.('ouverture') }, [])
  return (
    <div className="wof-in" style={{ padding: '8px 20px 16px', textAlign: 'center' }}>
      {!isFinal && <BackButton onClick={onBack} />}

      {isFinal ? (
        <>
          <div className="wof-fl" style={{ margin: '20px auto 20px', display: 'flex', justifyContent: 'center' }}>
            <FlowerSVG size={110} animated={false} />
          </div>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(18px, 4.5vw, 24px)',
            fontWeight: 400,
            color: '#000',
            lineHeight: 1.5,
            margin: '0 0 10px',
          }}>
            Ce jardin peut continuer à grandir avec toi.
          </h2>
          <p style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 14,
            fontWeight: 300,
            color: '#000',
            lineHeight: 1.65,
            margin: '0 0 36px',
          }}>
            Ta fleur t'attend.
          </p>
        </>
      ) : (
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(17px, 4vw, 22px)',
          fontStyle: 'italic',
          color: '#000',
          lineHeight: 1.7,
          margin: '20px 0 36px',
        }}>
          {text}
        </p>
      )}

      <PrimaryButton onClick={onNext}>
        {isFinal ? ctaLabel : 'À demain'}
      </PrimaryButton>
    </div>
  )
}

// ── VALIDATION GUIDÉE JOUR 1 ───────────────────────────────────────────────

// ── Modal bonus rituel — centré, couleurs de la zone du jour ─────────────────
function BonusRitualModal({ zoneId, color = '#c8a0b0', onClose }) {
  const { user }                                    = useAuth()
  const { rituals: plantRituals }                   = useRituels()
  const { completedRituals, handleToggleRitual }    = useRitualsState(user?.id)

  const STORAGE_KEY = 'mafleur-rituels-v1'
  const todayKey    = new Date().toISOString().slice(0, 10)

  // Handler enrichi : fixe la date + sauvegarde Supabase
  async function handleBonusToggle(ritualId) {
    handleToggleRitual(ritualId)  // localStorage + event dispatch

    // Fixe la date pour que le rechargement retrouve les données
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      if (!existing.date) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, date: todayKey }))
      }
    } catch (_) {}

    // Sauvegarde Supabase
    if (!user?.id) return
    const wasCompleted = !!completedRituals[ritualId]
    if (!wasCompleted) {
      // Cherche le rituel pour avoir son nom et sa zone
      const ritualObj = Object.values(plantRituals || {}).flat().find(r => r?.id === ritualId)
      const ZONE_MAP = { roots: 'racines', stem: 'tige', leaves: 'feuilles', flowers: 'fleurs', breath: 'souffle' }
      await Promise.resolve(supabase.from('rituals').upsert({
        user_id:      user.id,
        name:         ritualObj?.text ?? ritualId,
        zone:         ZONE_MAP[zoneId] ?? zoneId,
        health_delta: 0.5,
        ritual_id:    ritualId,
      }, { onConflict: 'user_id,ritual_id' })).catch(() => {})
    }
  }
  // Hex → RGB pour les variables CSS
  const h2r = h => { const v = parseInt((h || '#c8a0b0').replace('#',''), 16); return `${(v>>16)&255},${(v>>8)&255},${v&255}` }
  const rgb = h2r(color)
  return (
    <div style={{
      /* Fond */
      '--ritual-modal-bg-start':  '#fffaf7',
      '--ritual-modal-bg-end':    '#faf5f2',
      /* Texte noir + RGB pour les rgba() */
      '--ritual-modal-text':      '#0f0808',
      '--ritual-modal-text-rgb':  '15,8,8',
      /* Surfaces claires (boutons internes, bordures) */
      '--surface-1':              '#ffffff',
      '--surface-2':              '#f5ede8',
      '--surface-3':              'rgba(180,150,130,0.28)',
      '--track':                  '#ede5e0',
      /* Polices — tailles uniformes */
      '--fs-h1':  '26px',
      '--fs-h2':  '22px',
      '--fs-h3':  '20px',
      '--fs-h4':  '16px',
      '--fs-h5':  '13px',
      '--fs-emoji-md': '24px',
      '--fs-emoji-sm': '18px',
      /* Accent zone */
      '--ritual-modal-accent':    color,
      '--gold':                   color,
      '--zone-breath':            color,
    }}>
      <style>{`
        .ritual-modal-backdrop {
          align-items: center !important;
          background: rgba(${rgb},0.20) !important;
          backdrop-filter: blur(10px) !important;
        }
        .ritual-modal-sheet {
          box-shadow: 0 24px 60px rgba(${rgb},0.26) !important;
          border-radius: 22px !important;
          border: 1px solid rgba(${rgb},0.20) !important;
        }
        .ritual-item-text {
          font-size: 16px !important;
          color: #0f0808 !important;
          font-weight: 400 !important;
          line-height: 1.45 !important;
        }
        .ritual-item-hint {
          font-size: 13px !important;
          color: rgba(15,8,8,0.50) !important;
        }
        .ritual-modal-title { color: #0f0808 !important; }
        .ritual-modal-pct-count { color: #0f0808 !important; }
      `}</style>
      <RitualZoneModal
        zoneId={zoneId}
        completed={completedRituals}
        onToggle={handleBonusToggle}
        onClose={onClose}
        plantRituals={plantRituals}
      />
    </div>
  )
}

function CalendrierButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', maxWidth: 340, marginTop: 12,
        padding: '13px 24px', borderRadius: 18,
        border: '1.5px solid rgba(125,155,134,.45)',
        background: 'linear-gradient(135deg,rgba(125,155,134,.14),rgba(94,126,105,.08))',
        cursor: 'pointer', textAlign: 'center', transition: 'all .22s ease',
        boxShadow: '0 4px 14px rgba(125,155,134,.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(125,155,134,.22)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(125,155,134,.30)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(125,155,134,.14),rgba(94,126,105,.08))'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(125,155,134,.18)' }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="#5e7e69" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 17, height: 17, flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <span>
        <span style={{ display: 'block', fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(16px,4.2vw,19px)', fontStyle: 'italic', fontWeight: 500, color: '#2a1010', lineHeight: 1.2 }}>
          Programmer mon rappel quotidien
        </span>
        <span style={{ display: 'block', fontFamily: "'Jost',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.10em', textTransform: 'uppercase', color: '#7d9b86', marginTop: 3 }}>
          Ajouter au calendrier →
        </span>
      </span>
    </button>
  )
}

function BonusButton({ color = '#c8a0b0', zoneName = 'racines', onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        maxWidth: 340,
        marginTop: 20,
        padding: '16px 24px',
        borderRadius: 18,
        border: `1.5px solid ${color}55`,
        background: `linear-gradient(135deg, ${color}22, ${color}12)`,
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.22s ease',
        boxShadow: `0 4px 18px ${color}28`,
        border: `1.5px solid ${color}70`,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${color}35, ${color}22)`; e.currentTarget.style.boxShadow = `0 6px 24px ${color}40` }}
      onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${color}22, ${color}12)`; e.currentTarget.style.boxShadow = `0 4px 18px ${color}28` }}
    >
      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(17px,4.5vw,20px)', fontStyle: 'italic', fontWeight: 500, color: '#2a1010', lineHeight: 1.3, margin: '0 0 5px' }}>
        Découvre d'autres rituels
      </p>
      <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color, margin: 0 }}>
        spéciale {zoneName} →
      </p>
    </button>
  )
}

function RacinesValidation({ answers, onNext, onBack, onScreenChange, onCalendrier }) {
  useEffect(() => { onScreenChange?.('validation') }, [])
  const [subSlide,   setSubSlide]   = useState(0)
  const [phase,      setPhase]      = useState(0)
  const [showBonus,  setShowBonus]  = useState(false)
  const phaseRefs  = useRef({})
  const hasBarometer = !!answers?.j1?.feel

  useEffect(() => {
    setPhase(0)
    if (subSlide === 0) {
      const T = [0, 150, 300, hasBarometer ? 450 : 99999, 600, 1600]
      const timers = T.map((ms, i) => setTimeout(() => setPhase(i + 1), ms))
      return () => timers.forEach(clearTimeout)
    } else {
      const T = [0, 400, 1600, 3200]
      const timers = T.map((ms, i) => setTimeout(() => setPhase(i + 1), ms))
      return () => timers.forEach(clearTimeout)
    }
  }, [subSlide, hasBarometer])

  const S = { /* RacinesValidation */
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle: 'italic',
    fontSize: 'clamp(19px, 4.8vw, 23px)',
    color: '#0f0808',
    textAlign: 'center',
    lineHeight: 1.45,
    margin: '0 0 16px',
  }

  function B({ children }) {
    return <strong style={{ fontWeight: 600, fontStyle: 'inherit' }}>{children}</strong>
  }

  function block(n, content) {
    return (
      <div ref={el => { phaseRefs.current[n] = el }} style={{ scrollMarginTop: '72px', ...fadeIn(phase >= n) }}>
        {content}
      </div>
    )
  }

  /* ── Slide 7 ── */
  if (subSlide === 0) {
    const ctaPhase = hasBarometer ? 6 : 5
    return (
      <div style={{ padding: '16px 20px 24px' }}>
        <div style={{ textAlign: 'center', margin: '8px 0 24px' }}>
          <p style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 'clamp(11px, 2.8vw, 13px)',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#1a1010',
            margin: '0 0 8px',
          }}>
            Ce qui vient de se passer
          </p>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(26px, 6.5vw, 40px)',
            fontWeight: 700,
            fontStyle: 'italic',
            color: '#2a1010',
            lineHeight: 1.15,
            margin: '0 0 10px',
          }}>
            Un retour aux racines
          </h2>
          <div style={{
            width: 48, height: 2,
            background: 'linear-gradient(to right, transparent, #b87c5a, transparent)',
            margin: '0 auto',
          }} />
        </div>

        {block(1, <p style={S}>Tu viens de revenir à quelque chose de <B>simple</B>. Et souvent… c'est là que tout <B>commence</B>.</p>)}
        {block(2, <p style={S}>Quand les racines trouvent un peu plus de <B>stabilité</B>, le reste suit… <B>naturellement</B>.</p>)}
        {hasBarometer && block(3, <p style={S}>Et déjà, quelque chose est <B>légèrement différent</B>.</p>)}

        {block(hasBarometer ? 4 : 3, <>
          <div style={{
            width: 40, height: 1,
            background: 'rgba(180,130,100,0.3)',
            margin: '8px auto 24px',
          }} />
        </>)}

        {block(hasBarometer ? 5 : 4, (
          <p style={{ ...S, fontStyle: 'normal', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 26px)', margin: '0 0 24px' }}>
            Et ce n'est que le début.
          </p>
        ))}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%', ...fadeIn(phase >= ctaPhase), pointerEvents: phase >= ctaPhase ? 'auto' : 'none' }}>
          <div style={{ justifySelf: 'start', marginLeft: -10 }}><BackButton onClick={onBack} /></div>
          <PrimaryButton onClick={() => { setSubSlide(1) }}>Je continue…</PrimaryButton>
          <div />
        </div>
      </div>
    )
  }

  /* ── Slide 8 ── */
  const S8 = { ...S, fontSize: 'clamp(20px, 5.5vw, 28px)', lineHeight: 1.4, margin: '0 0 8px' }
  return (
    <div style={{ padding: '24px 20px 60px', textAlign: 'center' }}>

      {block(1, <p style={S8}>Aujourd'hui, tu as commencé à <B>t'écouter</B>.</p>)}
      {block(2, <p style={S8}>Mais ton équilibre ne peut pas encore <B>apparaître</B>.</p>)}
      {block(3, <p style={{ ...S8, margin: '0 0 24px' }}>
        Demain, tu vas activer une autre partie de toi.<br /><B>Et c'est là que quelque chose évolue.</B>
      </p>)}

      {showBonus && <BonusRitualModal zoneId="roots" color="#c8a0b0" onClose={() => setShowBonus(false)} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%', ...fadeIn(phase >= 4), pointerEvents: phase >= 4 ? 'auto' : 'none' }}>
        <div style={{ justifySelf: 'start', marginLeft: -10 }}><BackButton onClick={() => setSubSlide(0)} /></div>
        <PrimaryButton onClick={onNext}>Continuer</PrimaryButton>
        <div />
      </div>
      {phase >= 4 && <div style={{ display: 'flex', justifyContent: 'center' }}><BonusButton color="#c8a0b0" zoneName="racines" onClick={() => setShowBonus(true)} /></div>}
      {phase >= 4 && onCalendrier && <div style={{ display: 'flex', justifyContent: 'center' }}><CalendrierButton onClick={onCalendrier} /></div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TigeValidation — équivalent J2 de RacinesValidation
// ─────────────────────────────────────────────────────────────────────────────

function FeuillesValidation({ onNext, onBack, onScreenChange, onCalendrier }) {
  useEffect(() => { onScreenChange?.('validation') }, [])
  const [subSlide,  setSubSlide]  = useState(0)
  const [phase,     setPhase]     = useState(0)
  const [showBonus, setShowBonus] = useState(false)

  useEffect(() => {
    setPhase(0)
    const T = subSlide === 0 ? [0, 150, 350, 600, 900, 1600] : [0, 400, 1800, 3400]
    const timers = T.map((ms, i) => setTimeout(() => setPhase(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [subSlide])

  const S = { fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(17px, 4.4vw, 23px)', color: '#0f0808', textAlign: 'center', lineHeight: 1.4, margin: '0 0 12px' }
  function B({ children }) { return <strong style={{ fontWeight: 600, fontStyle: 'inherit' }}>{children}</strong> }
  function block(n, content) { return <div style={{ ...fadeIn(phase >= n) }}>{content}</div> }

  if (subSlide === 0) return (
    <div style={{ padding: '16px 20px 24px' }}>
      <div style={{ textAlign: 'center', margin: '8px 0 24px' }}>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 'clamp(11px, 2.8vw, 13px)', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#1a1010', margin: '0 0 8px' }}>
          Ce qui vient de se passer
        </p>
        <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(26px, 6.5vw, 40px)', fontWeight: 700, fontStyle: 'italic', color: '#2a1010', lineHeight: 1.15, margin: '0 0 10px' }}>
          Tes feuilles s'ouvrent
        </h2>
        <div style={{ width: 48, height: 2, background: 'linear-gradient(to right, transparent, #5e8456, transparent)', margin: '0 auto' }} />
      </div>
      {block(1, <p style={S}>Tu viens de laisser quelque chose <B>traverser</B>. Sans le retenir.</p>)}
      {block(2, <p style={S}>Les feuilles ne gardent pas la lumière. Elles la <B>transforment</B>.</p>)}
      {block(3, <p style={S}>Ce que tu as observé aujourd'hui <B>change déjà de forme</B>.</p>)}
      {block(4, <p style={{ ...S, fontStyle: 'normal', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 26px)', margin: '0 0 24px' }}>
        Ce qui circule en toi devient de la lumière.
      </p>)}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%', ...fadeIn(phase >= 6), pointerEvents: phase >= 6 ? 'auto' : 'none' }}>
        <div style={{ justifySelf: 'start', marginLeft: -10 }}><BackButton onClick={onBack} /></div>
        <PrimaryButton onClick={() => setSubSlide(1)}>Je continue…</PrimaryButton>
        <div />
      </div>
    </div>
  )

  const S2 = { ...S, fontSize: 'clamp(20px, 5.5vw, 28px)', lineHeight: 1.6, margin: '0 0 10px' }
  return (
    <div style={{ padding: '24px 20px 60px', textAlign: 'center' }}>
      {block(1, <p style={S2}>Trois jours. Tu <B>observes</B>. Tu <B>nommes</B>.</p>)}
      {block(2, <p style={S2}>Demain, une nouvelle invitation :</p>)}
      {block(3, <p style={{ ...S2, margin: '0 0 24px' }}><B>t'accorder ce qui manquait.</B></p>)}
      {showBonus && <BonusRitualModal zoneId="leaves" color="#7aaa88" onClose={() => setShowBonus(false)} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%', ...fadeIn(phase >= 4), pointerEvents: phase >= 4 ? 'auto' : 'none' }}>
        <div style={{ justifySelf: 'start', marginLeft: -10 }}><BackButton onClick={() => setSubSlide(0)} /></div>
        <PrimaryButton onClick={onNext}>Continuer</PrimaryButton>
        <div />
      </div>
      {phase >= 4 && <div style={{ display: 'flex', justifyContent: 'center' }}><BonusButton color="#7aaa88" zoneName="feuilles" onClick={() => setShowBonus(true)} /></div>}
      {phase >= 4 && onCalendrier && <div style={{ display: 'flex', justifyContent: 'center' }}><CalendrierButton onClick={onCalendrier} /></div>}
    </div>
  )
}

function J3TeaserScreen({ onNext }) {
  return <DayTeaserScreen videoSrc="/video/fleur.mp4" label="Demain," teaser="ça s'épanouit." accentColor="#d4a0b0" onNext={onNext} />
}

// ── J4 — Les Fleurs ───────────────────────────────────────────────────────────
const J4_G1   = '#d4a0b0'
const J4_G2   = '#a07888'
const J4_GLOW = 'rgba(212,160,176,0.40)'
const J4_BG   = 'radial-gradient(circle at 50% 18%, #fdf5f7, #f5e8ec 58%, #ede0e4)'

const J4_RITUAL_DATA = {
  badge:    { icon: '🌸', label: 'FLEURS · OUVERTURE' },
  title:    "M'accorder de l'espace",
  subtitle: "Le rituel de l'ouverture intérieure",
  duration: '10 à 15 min',
  intro:    "Les fleurs s'ouvrent quand elles sont prêtes. Pas avant.",
  steps: [
    { num: '1', label: 'Accueille ce qui est là',  text: "Sans chercher à le changer. Juste recevoir ce qui se présente." },
    { num: '2', label: 'Scanne ton corps',         text: "De la tête aux pieds. Un regard intérieur, lent et bienveillant." },
    { num: '3', label: 'Offre-toi de l\'espace',   text: "Là où tu sens de la tension, inspire et laisse de la place." },
    { num: '4', label: 'La fleur s\'ouvre',        text: "Imagine une fleur qui s'ouvre doucement en toi. Sans forcer." },
  ],
  tip: "Une fleur ne s'ouvre pas sur commande. Elle attend la lumière.",
}

function j4InvitationText(answers) {
  const need = answers?.j4?.need   // clé sauvegardée par DayIntrospection
  if (!need) return "Les fleurs s'ouvrent quand elles sont prêtes. Ce rituel crée cet espace pour toi."
  if (need === 'silence')   return "Tu as besoin de silence. Les fleurs s'ouvrent dans le calme. Ce rituel va créer cet espace pour toi."
  if (need === 'mouvement') return "Tu as besoin de mouvement. Ce scan t'invite à parcourir ton corps — une façon douce de bouger de l'intérieur."
  if (need === 'douceur')   return "Tu as besoin de douceur. Les fleurs ne s'ouvrent jamais dans la contrainte. Ce moment est entièrement pour toi."
  if (need === 'clarte')    return "Tu cherches de la clarté. Elle vient souvent quand on s'arrête de chercher. Ce rituel va te ramener dans le corps."
  if (need === 'connexion') return "Tu aspires à de la connexion. Ce rituel va t'offrir l'espace pour accueillir ce qui est là."
  return "Les fleurs s'ouvrent quand elles sont prêtes. Ce rituel crée cet espace pour toi."
}

// ── WOFFleursSVG — J4 : feuilles J3 statiques → zoom + fleur qui s'ouvre ────
function WOFFleursSVG() {
  const [zoom,         setZoom]         = useState(false)
  const [health,       setHealth]       = useState(56)   // fin J3 exacte
  const [sparkVisible, setSparkVisible] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    const t1 = setTimeout(() => setZoom(true), 2000)
    const t2 = setTimeout(() => {
      const audio = new Audio('/harpe.mp3')
      audio.volume = 0.65
      audioRef.current = audio
      audio.play().catch(() => {})
      setSparkVisible(true)
      setTimeout(() => setSparkVisible(false), 3000)
      const start = Date.now()
      let raf
      const tick = () => {
        const p = Math.min(1, (Date.now() - start) / 7000)
        setHealth(56 + 14 * p)   // 56% → 70% (bouton → fleur qui s'ouvre)
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); audioRef.current?.pause() }
  }, [])

  const gs = { sunriseH: 7, sunriseM: 0, sunsetH: 20, sunsetM: 0, petalColor1: '#d4a0b0', petalColor2: '#e0b8c5', petalShape: 'round' }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        transform: zoom ? 'scale(1.9)' : 'scale(1)',
        transformOrigin: '50% 35%',   // zone fleur (haut de la tige)
        transition: zoom ? 'transform 4.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
      }}>
        <PlantSVG health={health} gardenSettings={gs} clearSky={true} lumensLevel="faible" celebrate={health >= 68} />
        {sparkVisible && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" fill="none">
            <defs><style>{`@keyframes svgSpk{0%{opacity:0;transform:scale(0.3) rotate(0deg)}35%{opacity:1;transform:scale(1.15) rotate(20deg)}65%{opacity:0.6;transform:scale(0.9) rotate(35deg)}100%{opacity:0;transform:scale(0.3) rotate(60deg)}}@keyframes svgSpkR{0%{opacity:0;transform:scale(0)}30%{opacity:0.5}70%{opacity:0.1}100%{opacity:0;transform:scale(1.8)}}`}</style></defs>
            {sparkleAt(200, 105, 4, 'rgba(255,222,60,0.90)', 14, 10, 0.0)}
            {sparkleAt(185, 120, 3, 'rgba(255,222,60,0.90)', 10,  7, 0.3)}
            {sparkleAt(215, 120, 3, 'rgba(255,222,60,0.90)', 10,  7, 0.6)}
            {sparkleAt(200, 135, 3, 'rgba(255,222,60,0.90)',  8,  6, 0.9)}
          </svg>
        )}
      </div>
    </div>
  )
}

function DayFourRituelView({ onComplete, onBack, dayNumber = 4, answers }) {
  return (
    <DayWOFRituelView
      ritualData={J4_RITUAL_DATA} audioSrc="/audio/fleur.mp3" audioTitle="M'accorder de l'espace"
      g1={J4_G1} g2={J4_G2} glow={J4_GLOW} bg={J4_BG}
      GuidedFallback={FleursScanGuidedRituel}
      dayNumber={dayNumber} invitationText={j4InvitationText(answers)} darkAt={120}
      onComplete={onComplete} onBack={onBack}
    />
  )
}

function FleursScanGuidedRituel({ onNext, onBack, onAudio }) {
  const S = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle: 'italic',
    fontSize: 'clamp(17px, 4.4vw, 21px)',
    color: '#1a1010',
    textAlign: 'center',
    lineHeight: 1.9,
    margin: '0 0 8px',
  }
  const Pause = () => (
    <div style={{ textAlign: 'center', margin: '24px 0 20px', color: '#d4a0b0', letterSpacing: 8, fontSize: 14 }}>· · ·</div>
  )
  const Affirmation = ({ children }) => (
    <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(19px, 4.8vw, 23px)', color: '#8a5868', textAlign: 'center', lineHeight: 1.75, margin: '0 0 14px' }}>
      {children}
    </p>
  )

  return (
    <div style={{ background: 'radial-gradient(circle at 50% 18%, #fdf5f7, #f5e8ec 58%, #ede0e4)', minHeight: '100%', padding: '16px 20px 80px', boxSizing: 'border-box' }}>
      <BackButton onClick={onBack} />

      <div style={{ textAlign: 'center', margin: '16px 0 36px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 100, background: 'linear-gradient(135deg,#d4a0b0,#a07888)', boxShadow: '0 4px 16px rgba(212,160,176,0.40)', marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>🌸</span>
          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.95)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Fleur · Le texte du rituel</span>
        </div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: 400, fontStyle: 'italic', color: '#2a1a20', lineHeight: 1.2, margin: '0 0 6px' }}>M'accorder de l'espace</h2>
        <div style={{ width: 48, height: 1, background: 'linear-gradient(to right, transparent, #d4a0b0, transparent)', margin: '0 auto' }} />
      </div>

      <p style={S}>Aujourd'hui, je vous invite à porter votre attention sur la fleur.</p>
      <p style={S}>La fleur est la partie la plus visible de la plante.</p>
      <p style={S}>Celle que l'on remarque immédiatement.</p>
      <p style={S}>Celle qui attire la lumière.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Celle qui révèle toute la beauté du chemin parcouru.</p>
      <p style={{ ...S, fontWeight: 700 }}>Pourtant...</p>
      <p style={{ ...S, margin: '0 0 16px' }}>La fleur n'existe jamais seule.</p>
      <p style={S}>Elle est le résultat des racines qui ont nourri.</p>
      <p style={S}>De la tige qui a porté.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Des feuilles qui ont capté la lumière.</p>
      <p style={S}>Et aujourd'hui, je vous invite à prendre quelques instants pour vous reconnecter à cette partie de vous qui aspire naturellement à s'épanouir.</p>

      <p style={{ ...S, margin: '16px 0 8px' }}>Prenez une profonde inspiration...</p>
      <p style={S}>Puis soufflez lentement.</p>
      <p style={S}>Encore une fois...</p>
      <p style={S}>Inspirez profondément...</p>
      <p style={S}>Et relâchez.</p>
      <p style={{ ...S, fontWeight: 700 }}>Très bien.</p>
      <p style={S}>Laissez maintenant votre respiration devenir calme et naturelle.</p>

      <Pause />

      <p style={S}>Imaginez votre jardin intérieur.</p>
      <p style={S}>Vous apercevez les racines profondément ancrées dans la terre.</p>
      <p style={S}>La tige qui s'élève avec confiance.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Les feuilles qui dansent doucement sous une légère brise.</p>
      <p style={S}>Et tout en haut...</p>
      <p style={{ ...S, fontWeight: 700 }}>Vous découvrez une magnifique fleur.</p>
      <p style={S}>Votre fleur.</p>
      <p style={S}>Unique.</p>
      <p style={S}>Différente de toutes les autres.</p>

      <Pause />

      <p style={S}>Prenez quelques instants pour l'observer.</p>
      <p style={S}>Sa couleur.</p>
      <p style={S}>Ses pétales.</p>
      <p style={S}>Sa lumière.</p>
      <p style={S}>Sa présence.</p>

      <Pause />

      <p style={S}>Et peut-être remarquez-vous qu'elle reflète quelque chose de vous.</p>
      <p style={S}>Quelque chose de votre histoire.</p>
      <p style={S}>De votre sensibilité.</p>
      <p style={S}>De votre personnalité.</p>
      <p style={S}>De ce que vous êtes profondément.</p>

      <Pause />

      <p style={S}>Car chaque fleur possède sa propre manière de s'épanouir.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Aucune ne ressemble à une autre.</p>
      <p style={S}>Et pourtant...</p>
      <p style={{ ...S, fontWeight: 700 }}>Elles sont toutes magnifiques lorsqu'elles osent devenir pleinement elles-mêmes.</p>

      <Pause />

      <p style={S}>Imaginez maintenant que vous vous approchez doucement de cette fleur.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Et que vous observez chacun de ses pétales.</p>
      <p style={S}>Certains sont déjà largement ouverts.</p>
      <p style={S}>D'autres sont encore en train de s'ouvrir.</p>
      <p style={{ ...S, fontWeight: 700 }}>Et cela est parfaitement normal.</p>

      <Pause />

      <p style={S}>Dans la nature, aucune fleur n'ouvre tous ses pétales le même jour.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Certaines parties de nous sont déjà prêtes à rayonner.</p>
      <p style={S}>D'autres ont encore besoin de temps.</p>
      <p style={S}>De confiance.</p>
      <p style={S}>De douceur.</p>

      <Pause />

      <p style={S}>Et aujourd'hui, vous pouvez simplement accueillir cela.</p>
      <p style={S}>Sans pression.</p>
      <p style={S}>Sans comparaison.</p>
      <p style={S}>Sans exigence.</p>

      <Pause />

      <p style={S}>Prenez un instant pour réfléchir à tout ce que vous avez déjà traversé.</p>
      <p style={S}>Les difficultés.</p>
      <p style={S}>Les défis.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Les périodes de doute.</p>
      <p style={S}>Les moments où vous avez continué malgré la fatigue.</p>
      <p style={S}>Malgré les peurs.</p>
      <p style={S}>Malgré les incertitudes.</p>

      <Pause />

      <p style={S}>Comme votre fleur.</p>
      <p style={S}>Vous avez grandi.</p>
      <p style={S}>Peut-être plus lentement que vous l'auriez souhaité.</p>
      <p style={{ ...S, fontWeight: 700 }}>Mais vous avez grandi.</p>

      <Pause />

      <p style={S}>Et parfois, nous oublions de reconnaître le chemin parcouru.</p>
      <p style={S}>Nous regardons ce qui manque encore.</p>
      <p style={S}>Nous regardons ce qui reste à accomplir.</p>
      <p style={S}>Sans voir tout ce qui a déjà été construit.</p>

      <Pause />

      <p style={S}>Aujourd'hui, je vous invite à porter un regard différent sur vous-même.</p>
      <p style={S}>Un regard plus doux.</p>
      <p style={S}>Plus juste.</p>
      <p style={S}>Plus bienveillant.</p>

      <Pause />

      <p style={S}>Imaginez maintenant qu'une lumière chaude et lumineuse descend doucement du ciel.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Une lumière douce comme un soleil de printemps.</p>
      <p style={S}>Cette lumière vient se poser sur votre fleur.</p>
      <p style={S}>Elle réchauffe chacun de ses pétales.</p>
      <p style={S}>Elle révèle ses couleurs.</p>
      <p style={S}>Sa beauté.</p>
      <p style={S}>Sa singularité.</p>

      <Pause />

      <p style={S}>Et à mesure que cette lumière la touche...</p>
      <p style={S}>La fleur commence à s'ouvrir davantage.</p>
      <p style={S}>Naturellement.</p>
      <p style={S}>Sans effort.</p>

      <Pause />

      <p style={S}>Comme si elle se souvenait qu'elle avait le droit d'exister pleinement.</p>
      <p style={S}>Le droit de prendre sa place.</p>
      <p style={S}>Le droit d'être vue.</p>
      <p style={S}>Le droit de rayonner.</p>

      <Pause />

      <p style={S}>Et peut-être que vous aussi...</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Vous pouvez vous autoriser cela.</p>
      <p style={S}>Vous autoriser à être fier de certaines choses.</p>
      <p style={S}>Vous autoriser à apprécier vos qualités.</p>
      <p style={S}>Vous autoriser à reconnaître votre valeur.</p>
      <p style={S}>Sans arrogance.</p>
      <p style={S}>Sans culpabilité.</p>
      <p style={S}>Simplement parce qu'elle existe déjà.</p>

      <Pause />

      <div style={{ background: 'rgba(212,160,176,0.12)', border: '1px solid rgba(212,160,176,0.30)', borderRadius: 16, padding: '24px 20px 16px', margin: '4px 0 24px' }}>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a07888', textAlign: 'center', margin: '0 0 18px' }}>Répétez intérieurement</p>
        <Affirmation>J'ai le droit de m'épanouir.</Affirmation>
        <Affirmation>Je peux prendre ma place avec confiance.</Affirmation>
        <Affirmation>Je reconnais mes forces et mes qualités.</Affirmation>
        <Affirmation>Je mérite de recevoir la lumière.</Affirmation>
        <Affirmation>Je m'autorise à fleurir à mon rythme.</Affirmation>
      </div>

      <p style={S}>Laissez ces mots descendre doucement à l'intérieur de vous.</p>
      <p style={S}>Comme des rayons de soleil qui nourrissent votre jardin.</p>

      <Pause />

      <p style={S}>Et imaginez maintenant que votre fleur diffuse autour d'elle une douce lumière.</p>
      <p style={S}>Une lumière qui ne cherche pas à impressionner.</p>
      <p style={S}>Une lumière qui ne cherche pas à prouver quoi que ce soit.</p>
      <p style={S}>Une lumière qui existe simplement parce qu'elle est là.</p>

      <Pause />

      <p style={S}>Comme une fleur dans un jardin.</p>
      <p style={S}>Elle ne se compare pas aux autres fleurs.</p>
      <p style={S}>Elle ne se demande pas si elle est suffisamment belle.</p>
      <p style={{ ...S, fontWeight: 700 }}>Elle fleurit simplement.</p>

      <Pause />

      <p style={{ ...S, fontWeight: 700 }}>Et c'est précisément cela qui la rend magnifique.</p>

      <Pause />

      <p style={S}>Prenez maintenant quelques instants pour ressentir votre jardin dans son ensemble.</p>
      <p style={S}>Les racines.</p>
      <p style={S}>La tige.</p>
      <p style={S}>Les feuilles.</p>
      <p style={{ ...S, fontWeight: 700, margin: '0 0 16px' }}>La fleur.</p>
      <p style={S}>Tout est relié.</p>
      <p style={S}>Tout travaille ensemble.</p>
      <p style={S}>Tout participe à votre épanouissement.</p>

      <Pause />

      <p style={S}>Prenez une dernière inspiration profonde.</p>
      <p style={{ ...S, margin: '0 0 16px' }}>Et lorsque vous expirez...</p>
      <p style={S}>Imaginez votre fleur pleinement ouverte sous la lumière.</p>
      <p style={S}>Vivante.</p>
      <p style={S}>Rayonnante.</p>
      <p style={S}>Paisible.</p>

      <Pause />

      <p style={S}>Et gardez avec vous cette idée tout au long de votre journée :</p>
      <p style={S}>Vous n'avez pas besoin de devenir quelqu'un d'autre.</p>
      <p style={S}>Vous n'avez pas besoin d'être parfait.</p>
      <p style={{ ...S, fontWeight: 700, fontSize: 'clamp(20px, 5vw, 24px)', margin: '0 0 48px' }}>Vous avez simplement le droit de vous ouvrir à ce que vous êtes déjà.<br/>Et de laisser votre propre fleur s'épanouir, un pétale après l'autre.</p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <PrimaryButton onClick={onNext}>Je continue</PrimaryButton>
        {onAudio && (
          <button onClick={onAudio} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontSize: 14, color: 'rgba(50,35,20,0.45)', textDecoration: 'underline', textUnderlineOffset: 3, padding: 0 }}>
            🔊 écouter l'audio à la place
          </button>
        )}
      </div>
    </div>
  )
}

function FleurValidation({ onNext, onBack, onScreenChange, onCalendrier }) {
  useEffect(() => { onScreenChange?.('validation') }, [])
  const [subSlide,  setSubSlide]  = useState(0)
  const [phase,     setPhase]     = useState(0)
  const [showBonus, setShowBonus] = useState(false)
  useEffect(() => {
    setPhase(0)
    const T = subSlide === 0 ? [0,150,350,600,900,1600] : [0,400,1800,3400]
    const timers = T.map((ms,i) => setTimeout(() => setPhase(i+1), ms))
    return () => timers.forEach(clearTimeout)
  }, [subSlide])
  const S = {fontFamily:'Cormorant Garamond, Georgia, serif',fontStyle:'italic',fontSize:'clamp(17px,4.4vw,23px)',color:'#0f0808',textAlign:'center',lineHeight:1.4,margin:'0 0 12px'}
  function B({children}) { return <strong style={{fontWeight:600,fontStyle:'inherit'}}>{children}</strong> }
  function block(n,c) { return <div style={{...fadeIn(phase>=n)}}>{c}</div> }
  if (subSlide === 0) return (
    <div style={{padding:'16px 20px 24px'}}>
      <div style={{textAlign:'center',margin:'8px 0 24px'}}>
        <p style={{fontFamily:'Jost,sans-serif',fontSize:'clamp(11px,2.8vw,13px)',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',color:'#1a1010',margin:'0 0 8px'}}>Ce qui vient de se passer</p>
        <h2 style={{fontFamily:'Cormorant Garamond,Georgia,serif',fontSize:'clamp(26px,6.5vw,40px)',fontWeight:700,fontStyle:'italic',color:'#2a1010',lineHeight:1.15,margin:'0 0 10px'}}>Ta fleur s'entrouvre</h2>
        <div style={{width:48,height:2,background:'linear-gradient(to right,transparent,#d4a0b0,transparent)',margin:'0 auto'}}/>
      </div>
      {block(1,<p style={S}>Tu viens de t'accorder quelque chose de <B>rare</B> : de l'espace.</p>)}
      {block(2,<p style={S}>Les fleurs ne s'ouvrent pas sur commande. Elles attendent <B>les conditions</B>.</p>)}
      {block(3,<p style={S}>Tu viens de les <B>créer</B>.</p>)}
      {block(4,<p style={{...S,fontStyle:'normal',fontWeight:700,fontSize:'clamp(20px,5vw,26px)',margin:'0 0 24px'}}>Et quelque chose en toi s'est ouvert.</p>)}
      <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',width:'100%',...fadeIn(phase>=6),pointerEvents:phase>=6?'auto':'none'}}>
        <div style={{justifySelf:'start',marginLeft:-10}}><BackButton onClick={onBack}/></div>
        <PrimaryButton onClick={() => setSubSlide(1)}>Je continue…</PrimaryButton>
        <div />
      </div>
    </div>
  )
  const S2 = {...S,fontSize:'clamp(20px,5.5vw,28px)',lineHeight:1.6,margin:'0 0 10px'}
  return (
    <div style={{padding:'24px 20px 60px',textAlign:'center'}}>
      {block(1,<p style={S2}>Quatre jours. Tes fleurs <B>commencent à s'ouvrir</B>.</p>)}
      {block(2,<p style={S2}>Demain, une nouvelle dimension entre dans ton jardin :</p>)}
      {block(3,<p style={{...S2,margin:'0 0 24px'}}><B>la dimension du lien.</B></p>)}
      {showBonus && <BonusRitualModal zoneId="flowers" color="#d4a0b0" onClose={() => setShowBonus(false)} />}
      <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',width:'100%',...fadeIn(phase>=4),pointerEvents:phase>=4?'auto':'none'}}>
        <div style={{justifySelf:'start',marginLeft:-10}}><BackButton onClick={() => setSubSlide(0)}/></div>
        <PrimaryButton onClick={onNext}>Continuer</PrimaryButton>
        <div />
      </div>
      {phase >= 4 && <div style={{display:'flex',justifyContent:'center'}}><BonusButton color="#d4a0b0" zoneName="fleurs" onClick={() => setShowBonus(true)} /></div>}
      {phase >= 4 && onCalendrier && <div style={{display:'flex',justifyContent:'center'}}><CalendrierButton onClick={onCalendrier} /></div>}
    </div>
  )
}

function J4TeaserScreen({ onNext }) {
  return <DayTeaserScreen videoSrc="/video/vent.mp4" label="Demain," teaser="ça relie." accentColor="#c8a870" onNext={onNext} />
}

// ── J5 — Le Souffle ───────────────────────────────────────────────────────────
const J5_G1   = '#c8a870'
const J5_G2   = '#a08040'
const J5_GLOW = 'rgba(200,168,112,0.40)'
const J5_BG   = 'radial-gradient(circle at 50% 18%, #fdf8ee, #f5ead8 58%, #ede0c8)'

const J5_RITUAL_DATA = {
  badge:    { icon: '🌬️', label: 'SOUFFLE · CONNEXION' },
  title:    'Le souffle qui relie',
  subtitle: 'Le rituel du lien',
  duration: '10 à 15 min',
  intro:    "Le souffle relie l'intérieur à l'extérieur. Il traverse tout.",
  steps: [
    { num: '1', label: 'Inspire',              text: "Imagine que tu respires la lumière de ce qui t'entoure." },
    { num: '2', label: 'Expire et envoie',     text: "À chaque expiration, envoie une pensée douce à quelqu'un que tu aimes." },
    { num: '3', label: 'Reste dans le lien',   text: "Ton souffle est le fil invisible. Il part de toi… et va quelque part." },
    { num: '4', label: 'Accueille le retour',  text: "Ce que tu envoies revient toujours, transformé. Reste ouvert·e." },
  ],
  tip: "Le lien n'a pas besoin d'être visible pour exister.",
}

function j5InvitationText(answers) {
  const connection = answers?.j5?.connection   // clé sauvegardée par DayIntrospection
  if (!connection) return "Le souffle relie. Ce rituel va créer ce fil invisible entre toi et les autres."
  if (connection === 'pas_vraiment') return "Le lien peut sembler loin. Le souffle ne juge pas — il part de toi et va quelque part."
  if (connection === 'un_peu')       return "Tu as ressenti un peu de lien. C'est souvent là que tout commence. Ce rituel va l'amplifier."
  if (connection === 'avec_quelquun') return "Tu as ressenti du lien avec quelqu'un. Ce rituel va prolonger ce geste — une pensée envoyée en silence arrive toujours quelque part."
  if (connection === 'avec_moi')     return "Tu as ressenti du lien avec toi-même. C'est la meilleure base. Ce rituel va maintenant envoyer ça vers l'extérieur."
  if (connection === 'profondement') return "Tu as ressenti du lien profondément. Le souffle relie l'intérieur à l'extérieur. Laisse-le faire."
  return "Le souffle relie. Ce rituel va créer ce fil invisible entre toi et les autres."
}

function WOFSouffleSVG() {
  const [panY,            setPanY]            = useState(-38)   // fleur au-dessus → descend dans le cadre
  const [health,          setHealth]          = useState(70)
  const [sparkVisible,    setSparkVisible]    = useState(false)
  const [companionsShown, setCompanionsShown] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    // Scroll de bas vers le haut pour révéler la fleur
    const panStart = Date.now()
    const panDur   = 2500
    let rafPan
    const tickPan = () => {
      const p    = Math.min(1, (Date.now() - panStart) / panDur)
      const ease = 1 - Math.pow(1 - p, 3)   // ease-out cubic
      setPanY(-38 * (1 - ease))   // -38 → 0 : la fleur descend dans le cadre
      if (p < 1) rafPan = requestAnimationFrame(tickPan)
    }
    rafPan = requestAnimationFrame(tickPan)

    const t1 = setTimeout(() => {}, 0)  // placeholder pour cohérence
    const t2 = setTimeout(() => {
      const audio = new Audio('/harpe.mp3')
      audio.volume = 0.65
      audioRef.current = audio
      audio.play().catch(() => {})
      setSparkVisible(true)
      setCompanionsShown(true)            // fleurs compagnes — restent visibles
      setTimeout(() => setSparkVisible(false), 3000)
      const start = Date.now()
      let raf
      const tick = () => {
        const p = Math.min(1, (Date.now() - start) / 7000)
        setHealth(70 + 25 * p)   // 70% (fin J4) → 95% (épanouissement plein + pollen)
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); audioRef.current?.pause() }
  }, [])

  const gs = { sunriseH: 7, sunriseM: 0, sunsetH: 20, sunsetM: 0, petalColor1: '#d4a0b0', petalColor2: '#e0b8c5', petalShape: 'round' }

  // Fleur compagne simple — dessinée dans l'overlay SVG (viewBox 0 0 400 260, gY=188)
  function simpleFlower(cx, topY, col, colDark, sz, stemW, del = '0s') {
    const gY = 188
    const petals = [0,60,120,180,240,300].map((deg,i) => {
      const r = deg * Math.PI / 180
      const px = cx + Math.cos(r) * sz * 1.1
      const py = topY + Math.sin(r) * sz * 1.1
      return (
        <ellipse key={deg} cx={px} cy={py} rx={sz} ry={sz*0.48} fill={col} opacity={0.82}
          style={{ transformBox:'fill-box', transformOrigin:'center', transform:`rotate(${deg}deg)`,
            animation:`petalIn 0.7s ${del} ease-out both` }} />
      )
    })
    return (
      <g>
        <line x1={cx} y1={gY} x2={cx} y2={topY} stroke="#5e8456" strokeWidth={stemW} strokeLinecap="round"
          style={{ animation:`flowerGrow 1.2s ${del} ease-out both`, transformOrigin:`${cx}px ${gY}px`, transformBox:'fill-box' }}/>
        {petals}
        <circle cx={cx} cy={topY} r={sz*0.55} fill="#f0c070"
          style={{ animation:`petalIn 0.5s ${parseFloat(del)+0.3}s ease-out both` }}/>
      </g>
    )
  }

  const companionOpacity = companionsShown ? 1 : 0

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Fleur principale — pan vertical bas→haut */}
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${panY}%)`, transition: 'none' }}>
        <PlantSVG health={health} gardenSettings={gs} clearSky={true} lumensLevel="faible" celebrate={health >= 88} />
      </div>

      {/* Fleurs compagnes + scintillements — même viewBox */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" fill="none">
        <defs>
          <style>{`
            @keyframes svgSpk{0%{opacity:0;transform:scale(0.3) rotate(0deg)}35%{opacity:1;transform:scale(1.15) rotate(20deg)}65%{opacity:0.6;transform:scale(0.9) rotate(35deg)}100%{opacity:0;transform:scale(0.3) rotate(60deg)}}
            @keyframes svgSpkR{0%{opacity:0;transform:scale(0)}30%{opacity:0.5}70%{opacity:0.1}100%{opacity:0;transform:scale(1.8)}}
          `}</style>
        </defs>

        {/* Fleurs compagnes — apparaissent avec les scintillements */}
        <g opacity={companionOpacity} style={{ transition: 'opacity 1.5s ease' }}>
          {simpleFlower(80,  112, '#c8a0b0', '#a07888', 11, 2.5, '0.2s')}
          {simpleFlower(135, 130, '#d4b0a0', '#b08868', 9,  2,   '0.5s')}
          {simpleFlower(265, 125, '#b8c8a0', '#90a878', 10, 2,   '0.7s')}
          {simpleFlower(320, 108, '#c8a0b0', '#a07888', 12, 2.5, '0.9s')}
        </g>

        {/* Scintillements sur la fleur centrale */}
        {sparkVisible && (
          <g>
            {sparkleAt(200,  88, 5, 'rgba(255,222,60,0.90)', 18, 13, 0.0)}
            {sparkleAt(178, 100, 3, 'rgba(255,222,60,0.90)', 12,  8, 0.3)}
            {sparkleAt(222, 100, 3, 'rgba(255,222,60,0.90)', 12,  8, 0.6)}
            {sparkleAt(200, 112, 3, 'rgba(255,222,60,0.90)', 10,  7, 0.9)}
          </g>
        )}
      </svg>
    </div>
  )
}

function DayFiveRituelView({ onComplete, onBack, dayNumber = 5, answers }) {
  return (
    <DayWOFRituelView
      ritualData={J5_RITUAL_DATA} audioSrc="/audio/souffle.mp3" audioTitle="Le souffle qui relie"
      g1={J5_G1} g2={J5_G2} glow={J5_GLOW} bg={J5_BG}
      GuidedFallback={SouffleGuidedRituel}
      dayNumber={dayNumber} invitationText={j5InvitationText(answers)} darkAt={120}
      onComplete={onComplete} onBack={onBack}
    />
  )
}

function SouffleValidation({ onNext, onBack, onScreenChange, onCalendrier }) {
  useEffect(() => { onScreenChange?.('validation') }, [])
  const [subSlide,  setSubSlide]  = useState(0)
  const [phase,     setPhase]     = useState(0)
  const [showBonus, setShowBonus] = useState(false)
  useEffect(() => {
    setPhase(0)
    const T = subSlide === 0 ? [0,150,350,600,900,1600] : [0,400,1800,3400]
    const timers = T.map((ms,i) => setTimeout(() => setPhase(i+1), ms))
    return () => timers.forEach(clearTimeout)
  }, [subSlide])
  const S = {fontFamily:'Cormorant Garamond, Georgia, serif',fontStyle:'italic',fontSize:'clamp(17px,4.4vw,23px)',color:'#0f0808',textAlign:'center',lineHeight:1.4,margin:'0 0 12px'}
  function B({children}) { return <strong style={{fontWeight:600,fontStyle:'inherit'}}>{children}</strong> }
  function block(n,c) { return <div style={{...fadeIn(phase>=n)}}>{c}</div> }
  if (subSlide === 0) return (
    <div style={{padding:'16px 20px 24px'}}>
      <div style={{textAlign:'center',margin:'8px 0 24px'}}>
        <p style={{fontFamily:'Jost,sans-serif',fontSize:'clamp(11px,2.8vw,13px)',fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',color:'#1a1010',margin:'0 0 8px'}}>Ce qui vient de se passer</p>
        <h2 style={{fontFamily:'Cormorant Garamond,Georgia,serif',fontSize:'clamp(26px,6.5vw,40px)',fontWeight:700,fontStyle:'italic',color:'#2a1010',lineHeight:1.15,margin:'0 0 10px'}}>Ton souffle a créé du lien</h2>
        <div style={{width:48,height:2,background:'linear-gradient(to right,transparent,#c8a870,transparent)',margin:'0 auto'}}/>
      </div>
      {block(1,<p style={S}>Même quand le lien semblait loin… tu as <B>relié quelque chose</B>.</p>)}
      {block(2,<p style={S}>Le souffle tisse un fil invisible entre toi et le reste du <B>vivant</B>.</p>)}
      {block(3,<p style={S}>Ce geste vers l'autre a résonné <B>dans ton jardin</B>.</p>)}
      {block(4,<p style={{...S,fontStyle:'normal',fontWeight:700,fontSize:'clamp(20px,5vw,26px)',margin:'0 0 24px'}}>Et ça existe.</p>)}
      <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',width:'100%',...fadeIn(phase>=6),pointerEvents:phase>=6?'auto':'none'}}>
        <div style={{justifySelf:'start',marginLeft:-10}}><BackButton onClick={onBack}/></div>
        <PrimaryButton onClick={() => setSubSlide(1)}>Je continue…</PrimaryButton>
        <div />
      </div>
    </div>
  )
  const S2 = {...S,fontSize:'clamp(20px,5.5vw,28px)',lineHeight:1.6,margin:'0 0 10px'}
  return (
    <div style={{padding:'24px 20px 60px',textAlign:'center'}}>
      {block(1,<p style={S2}>Cinq zones éveillées. Ta fleur <B>prend sa place</B>.</p>)}
      {block(2,<p style={S2}>Demain, pour la première fois,</p>)}
      {block(3,<p style={{...S2,margin:'0 0 24px'}}><B>tu vas à sa rencontre.</B></p>)}
      {showBonus && <BonusRitualModal zoneId="breath" color="#c8a870" onClose={() => setShowBonus(false)} />}
      <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',width:'100%',...fadeIn(phase>=4),pointerEvents:phase>=4?'auto':'none'}}>
        <div style={{justifySelf:'start',marginLeft:-10}}><BackButton onClick={() => setSubSlide(0)}/></div>
        <PrimaryButton onClick={onNext}>Continuer</PrimaryButton>
        <div />
      </div>
      {phase >= 4 && <div style={{display:'flex',justifyContent:'center'}}><BonusButton color="#c8a870" zoneName="souffle" onClick={() => setShowBonus(true)} /></div>}
      {phase >= 4 && onCalendrier && <div style={{display:'flex',justifyContent:'center'}}><CalendrierButton onClick={onCalendrier} /></div>}
    </div>
  )
}

function J5TeaserScreen({ onNext }) {
  return <DayTeaserScreen videoSrc="/video/fleur2.mp4" label="Demain," teaser="ta fleur t'attend." accentColor="#1a6a2a" onNext={onNext} />
}

function TigeValidation({ onNext, onBack, onScreenChange, onCalendrier }) {
  useEffect(() => { onScreenChange?.('validation') }, [])
  const [subSlide,  setSubSlide]  = useState(0)
  const [showBonus, setShowBonus] = useState(false)
  const [phase,    setPhase]    = useState(0)

  useEffect(() => {
    setPhase(0)
    const T = subSlide === 0
      ? [0, 150, 350, 600, 1600]
      : [0, 400, 1800, 3400]
    const timers = T.map((ms, i) => setTimeout(() => setPhase(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [subSlide])

  const S = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle: 'italic',
    fontSize: 'clamp(17px, 4.4vw, 23px)',
    color: '#0f0808',
    textAlign: 'center',
    lineHeight: 1.4,
    margin: '0 0 12px',
  }
  function B({ children }) { return <strong style={{ fontWeight: 600, fontStyle: 'inherit' }}>{children}</strong> }
  function block(n, content) {
    return <div style={{ ...fadeIn(phase >= n) }}>{content}</div>
  }

  if (subSlide === 0) return (
    <div style={{ padding: '16px 20px 24px' }}>
      <div style={{ textAlign: 'center', margin: '8px 0 24px' }}>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 'clamp(11px, 2.8vw, 13px)', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#1a1010', margin: '0 0 8px' }}>
          Ce qui vient de se passer
        </p>
        <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(26px, 6.5vw, 40px)', fontWeight: 700, fontStyle: 'italic', color: '#2a1010', lineHeight: 1.15, margin: '0 0 10px' }}>
          Ta tige se redresse
        </h2>
        <div style={{ width: 48, height: 2, background: 'linear-gradient(to right, transparent, #7a9ab0, transparent)', margin: '0 auto' }} />
      </div>

      {block(1, <p style={S}>Tu viens de prendre soin de ton <B>axe intérieur</B>.</p>)}
      {block(2, <p style={S}>La tige porte sans plier. Elle <B>oscille</B>, revient, <B>tient bon</B>.</p>)}
      {block(3, <p style={S}>C'est ce que tu viens de <B>nourrir</B>.</p>)}
      {block(4, <p style={{ ...S, fontStyle: 'normal', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 26px)', margin: '0 0 24px' }}>
        Et ce qui tient en toi s'affermit.
      </p>)}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%', ...fadeIn(phase >= 5), pointerEvents: phase >= 5 ? 'auto' : 'none' }}>
        <div style={{ justifySelf: 'start', marginLeft: -10 }}><BackButton onClick={onBack} /></div>
        <PrimaryButton onClick={() => setSubSlide(1)}>Je continue…</PrimaryButton>
        <div />
      </div>
    </div>
  )

  // Slide 2 — ouverture vers J3
  const S2 = { ...S, fontSize: 'clamp(20px, 5.5vw, 28px)', lineHeight: 1.6, margin: '0 0 10px' }
  return (
    <div style={{ padding: '24px 20px 60px', textAlign: 'center' }}>
      {block(1, <p style={S2}>Deux jours. Ta tige commence à se <B>dresser</B>.</p>)}
      {block(2, <p style={S2}>Demain, quelque chose de plus délicat t'attend :</p>)}
      {block(3, <p style={{ ...S2, margin: '0 0 24px' }}><B>les feuilles s'épanouissent.</B></p>)}
      {showBonus && <BonusRitualModal zoneId="stem" color="#9ab8c8" onClose={() => setShowBonus(false)} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%', ...fadeIn(phase >= 4), pointerEvents: phase >= 4 ? 'auto' : 'none' }}>
        <div style={{ justifySelf: 'start', marginLeft: -10 }}><BackButton onClick={() => setSubSlide(0)} /></div>
        <PrimaryButton onClick={onNext}>Continuer</PrimaryButton>
        <div />
      </div>
      {phase >= 4 && <div style={{ display: 'flex', justifyContent: 'center' }}><BonusButton color="#9ab8c8" zoneName="tige" onClick={() => setShowBonus(true)} /></div>}
      {phase >= 4 && onCalendrier && <div style={{ display: 'flex', justifyContent: 'center' }}><CalendrierButton onClick={onCalendrier} /></div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4b. HelpBandeau — bandeau bas + panneau d'aide qui glisse vers le haut
//     Position : 3ème enfant flex du wof-modal (après hero + scroll)
//     Overlay/panneau en position:absolute dans le modal (position:relative)
// ─────────────────────────────────────────────────────────────────────────────

function HelpBandeau({ helpText }) {
  const ambiance = useAmbiance()
  const [open, setOpen] = useState(false)
  const bandeauRef = useRef(null)
  const [panelRect, setPanelRect] = useState(null)
  const [pulse, setPulse] = useState(false)

  // Ferme le panneau et pulse le bandeau quand l'étape change
  useEffect(() => {
    setOpen(false)
    setPulse(true)
    const t = setTimeout(() => setPulse(false), 800)
    return () => clearTimeout(t)
  }, [helpText])

  function handleOpen() {
    // Récupère les dimensions du wof-modal (ancêtre position:relative)
    const modal = bandeauRef.current?.closest('.wof-modal')
    if (modal) {
      const r = modal.getBoundingClientRect()
      setPanelRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    setOpen(true)
  }

  return (
    <>
      {/* ── Overlay + panneau en fixed, calé sur le modal ── */}
      {open && panelRect && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              top: panelRect.top, left: panelRect.left,
              width: panelRect.width, height: panelRect.height,
              background: 'rgba(20,8,4,0.32)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              zIndex: 400,
              borderRadius: 'inherit',
            }}
          />
          <div style={{
            position: 'fixed',
            left: panelRect.left,
            width: panelRect.width,
            bottom: window.innerHeight - panelRect.top - panelRect.height,
            zIndex: 401,
            animation: 'helpPanelIn 380ms cubic-bezier(0.25,0.46,0.45,0.94) both',
          }}>
            {/* Poignée fermeture */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 6 }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.88)',
                  border: 'none', borderRadius: 100,
                  padding: '5px 22px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 11, fontWeight: 500,
                  color: '#7a5a4a', letterSpacing: '0.08em', textTransform: 'uppercase',
                  backdropFilter: 'blur(6px)',
                  boxShadow: '0 2px 14px rgba(80,30,20,0.16)',
                }}
              >
                ╲╱ Fermer
              </button>
            </div>

            {/* Panneau */}
            <div style={{
              background: '#fffaf7',
              borderRadius: '22px 22px 0 0',
              boxShadow: '0 -8px 40px rgba(140,80,60,0.18)',
              maxHeight: panelRect.height * 0.65,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              {/* Zone scrollable */}
              <div style={{ padding: '28px 28px 24px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#d4a0b0,#c8a870)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>?</div>
                  <div>
                    <p style={{
                      fontFamily: 'Jost, sans-serif', fontSize: 10, fontWeight: 500,
                      letterSpacing: '0.16em', textTransform: 'uppercase',
                      color: '#b8907a', margin: '0 0 2px',
                    }}>Espace d'enseignement</p>
                    <p style={{
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      fontSize: 18, fontWeight: 600, color: '#2a1010',
                      margin: 0, lineHeight: 1.2,
                    }}>Pour aller plus loin</p>
                  </div>
                </div>

                <div style={{
                  width: '100%', height: 1,
                  background: 'linear-gradient(to right,transparent,rgba(180,130,100,0.3),transparent)',
                  marginBottom: 20,
                }} />

                {/* Texte à gauche — avec padding droit pour laisser place au personnage */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 180 }}>
                  {(helpText || "Un espace pour approfondir ce que tu viens de vivre.\n\nPrends le temps de ressentir ce qui s'est passé en toi pendant cette étape.\n\nIl n'y a rien à forcer, laisse juste la pratique continuer de résonner.")
                    .split('\n\n')
                    .map((para, i) => (
                      <p key={i} style={{
                        fontFamily: 'Cormorant Garamond, Georgia, serif',
                        fontSize: i === 0 ? 'clamp(17px,4.4vw,20px)' : 'clamp(14px,3.6vw,17px)',
                        fontStyle: i === 0 ? 'normal' : 'italic',
                        fontWeight: i === 0 ? 500 : 400,
                        color: i === 0 ? '#1a1010' : '#5a3838',
                        lineHeight: 1.75,
                        margin: 0,
                        paddingLeft: i > 0 ? 12 : 0,
                        borderLeft: i > 0 ? '2px solid rgba(180,130,100,0.25)' : 'none',
                      }}>
                        {para}
                      </p>
                    ))
                  }
                </div>
              </div>

              {/* Bandeau vert + personnage en absolute par-dessus */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {/* Bandeau vert */}
                <div style={{
                  width: '100%',
                  height: 10,
                  background: 'linear-gradient(to right, #4a7c4e, #2d5a30)',
                }} />
                {/* Personnage posé sur le bandeau */}
                <img
                  src={ambianceAsset('/instructeur1.png', ambiance)}
                  alt="Instructeur"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 20,
                    width: 170,
                    height: 240,
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    borderRadius: '60px 60px 0 0',
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Bandeau image — dans le flux scroll, après le contenu ── */}
      <div
        ref={bandeauRef}
        onClick={handleOpen}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          height: 150,
          overflow: 'hidden',
          flexShrink: 0,
          width: '80%',
          margin: '0 auto -16px',
          borderRadius: 16,
          transition: 'filter 0.3s ease, transform 0.3s ease',
          filter: pulse ? 'brightness(1.15)' : 'brightness(1)',
          transform: pulse ? 'scale(1.01)' : 'scale(1)',
        }}
      >
        <img
          src={ambianceAsset('/bandeau2.png', ambiance)}
          alt="Espace d'aide"
          style={{
            width: '100%', height: '100%', display: 'block',
            objectFit: 'cover', objectPosition: 'center center',
            transition: 'filter 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.07)' }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}
        />
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4b. DayOneRituelView — Jour 1 slide 2 : présentation + rituel Racines
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// WOFAudioPlayer — lecteur audio indépendant pour le WeekOneFlow
// Fond chaud (doré-rosé), 3 états : ready / playing / ended
// ─────────────────────────────────────────────────────────────────────────────

export function WOFAudioPlayer({ audioSrc, title, g1 = '#c8a0b0', g2 = '#9a7890', glow = 'rgba(200,160,176,0.45)', darkAt = 50, onDone, onClose, bg: bgProp, hideReadyText = false, preloadedAudio = null }) {
  const [state,    setState]    = useState(preloadedAudio ? 'playing' : 'ready')
  const audioRef = useRef(preloadedAudio)

  const BG   = bgProp ?? 'linear-gradient(160deg, #fdf0e6 0%, #f5e6d8 45%, #ede0d0 100%)'
  const TEXT = '#0f0808'
  const TXTS = 'rgba(15,8,8,0.50)'

  function stopAll() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
  }

  function startAudio() {
    const audio = new Audio(audioSrc)
    audio.onended = () => { setState('ended'); setTimeout(onDone, 800) }
    audio.addEventListener('timeupdate', () => {
      if (!audio.duration || brighteningRef.current) return
      if (audio.duration - audio.currentTime <= 3) {
        brighteningRef.current = true
        cancelAnimationFrame(darkRafRef.current)
        setBrightening(true)
      }
    })
    audioRef.current = audio
    audio.play()
      .then(() => setState('playing'))
      .catch(() => { setState('ended'); setTimeout(onDone, 400) })
  }

  const [paused,      setPaused]      = useState(false)
  const [elapsed,     setElapsed]     = useState(0)
  const [darkMode,    setDarkMode]    = useState(false)
  const [darkOpacity, setDarkOpacity] = useState(0)
  const [brightening, setBrightening] = useState(false)
  const pausedRef       = useRef(false)
  const darkRafRef      = useRef(null)
  const brightRafRef    = useRef(null)
  const brighteningRef  = useRef(false)
  const darkOpacityRef  = useRef(0)
  const [muted, setMuted] = useState(false)


  function toggleMute() {
    if (!audioRef.current) return
    audioRef.current.muted = !muted
    setMuted(m => !m)
  }

  function restartAudio() {
    if (!audioRef.current) return
    audioRef.current.currentTime = 0
    if (paused) { audioRef.current.play(); setPaused(false) }
    // Reset dark mode
    cancelAnimationFrame(darkRafRef.current)
    cancelAnimationFrame(brightRafRef.current)
    brighteningRef.current = false
    darkOpacityRef.current = 0
    setElapsed(0)
    setDarkMode(false)
    setDarkOpacity(0)
    setBrightening(false)
  }

  // Attach listeners si audio pré-lancé depuis l'extérieur
  useEffect(() => {
    if (!preloadedAudio) return
    const audio = preloadedAudio
    audio.onended = () => { setState('ended'); setTimeout(onDone, 800) }
    audio.addEventListener('timeupdate', () => {
      if (!audio.duration || brighteningRef.current) return
      if (audio.duration - audio.currentTime <= 3) {
        brighteningRef.current = true
        cancelAnimationFrame(darkRafRef.current)
        setBrightening(true)
      }
    })
  }, [])

  // Sync ref pour l'interval
  useEffect(() => { pausedRef.current = paused }, [paused])

  // Timer elapsed (pause respectée)
  useEffect(() => {
    if (state !== 'playing') return
    const id = setInterval(() => {
      if (!pausedRef.current) setElapsed(e => e + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [state])

  // Déclenche le mode sombre au seuil darkAt
  useEffect(() => {
    if (elapsed >= darkAt && !darkMode) setDarkMode(true)
  }, [elapsed, darkMode, darkAt])

  // Animation fondu sombre (6s)
  useEffect(() => {
    if (!darkMode) return
    const start = Date.now()
    const tick = () => {
      if (brighteningRef.current) return
      const p = Math.min(1, (Date.now() - start) / 6000)
      darkOpacityRef.current = p
      setDarkOpacity(p)
      if (p < 1) darkRafRef.current = requestAnimationFrame(tick)
    }
    darkRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(darkRafRef.current)
  }, [darkMode])

  // Éclaircissement progressif sur 3s (à 3s de la fin du MP3)
  useEffect(() => {
    if (!brightening) return
    const startOpacity = darkOpacityRef.current
    const start = Date.now()
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / 3000)
      const next = startOpacity * (1 - p)
      darkOpacityRef.current = next
      setDarkOpacity(next)
      if (p < 1) brightRafRef.current = requestAnimationFrame(tick)
      else { setDarkMode(false); setBrightening(false) }
    }
    brightRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(brightRafRef.current)
  }, [brightening])

  useEffect(() => () => stopAll(), [])

  function togglePause() {
    if (!audioRef.current) return
    if (paused) { audioRef.current.play(); setPaused(false) }
    else        { audioRef.current.pause(); setPaused(true)  }
  }

  // ✕ discret — quitter uniquement
  const quitBtn = (
    <button
      onClick={() => { stopAll(); onClose?.() }}
      style={{ position: 'absolute', top: 16, right: 16, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', border: `1px solid ${g1}22`, cursor: 'pointer', color: TXTS, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.65, zIndex: 20 }}
    >✕</button>
  )

  const BASE = { minHeight: 'max(100%, calc(64dvh))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: BG, padding: '40px 28px', textAlign: 'center', position: 'relative' }

  if (state === 'ready') return (
    <div style={BASE}>
      {quitBtn}
      <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, letterSpacing: '.20em', textTransform: 'uppercase', color: TXTS, marginBottom: 52 }}>
        {title}
      </p>
      <button
        onClick={startAudio}
        style={{ width: 160, height: 160, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 62, background: `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.55), ${g1}bb, ${g2}aa)`, boxShadow: `0 0 0 22px ${g1}20, 0 0 0 44px ${g1}0a, 0 20px 60px ${glow}`, marginBottom: 48, animation: 'breathe 10s ease-in-out infinite' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >🔊</button>
      {!hideReadyText && (
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(20px,5.2vw,26px)', fontStyle: 'italic', color: TEXT, margin: 0, lineHeight: 1.65, maxWidth: 320 }}>
          Installe-toi confortablement, dans un endroit calme, assure-toi d'avoir du son ou d'utiliser un casque, et appuie pour commencer
        </p>
      )}
    </div>
  )

  if (state === 'playing') return (
    <div style={{ ...BASE, cursor: 'pointer', overflow: 'hidden', justifyContent: 'center', padding: darkMode ? '40px 28px' : '12% 28px 4%' }} onClick={togglePause}>
      {quitBtn}


      {/* Orbe + ondes radio */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: darkMode ? 0 : 64, zIndex: 10, width: 130, height: 130 }}>
        {/* 4 ondes concentriques décalées */}
        {!paused && [0, 2.5, 5, 7.5].map((delay, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 130, height: 130, borderRadius: '50%',
            border: `1.5px solid ${g1}`,
            animation: `radioWave 10s ${delay}s ease-out infinite`,
            pointerEvents: 'none',
          }} />
        ))}
        {/* Orbe */}
        <div style={{
          width: 130, height: 130, borderRadius: '50%',
          background: `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.45), ${g1}aa, ${g2}88)`,
          boxShadow: `0 0 0 20px ${g1}18, 0 0 0 40px ${g1}08`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
          animation: paused ? 'none' : 'breathe 10s ease-in-out infinite',
          opacity: paused ? 0.55 : 1,
          transition: 'opacity 0.4s ease',
          position: 'relative', flexShrink: 0,
        }}>
          {paused ? '▶' : ''}
        </div>
      </div>

      {/* Texte — phases 1 et 2 (disparaît en mode sombre) */}
      {!darkMode && (
        <>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(20px,5.2vw,26px)', fontStyle: 'italic', color: '#0f0808', margin: '0 0 28px', lineHeight: 1.65, maxWidth: 320, transition: 'opacity 1s ease', position: 'relative', zIndex: 10 }}>
            {paused
              ? 'Touche pour reprendre'
              : elapsed >= 30
                ? "Maintenant respire profondément et laisse le mouvement porter ton souffle."
                : 'Concentre-toi sur ce mouvement lent, et respire à son rythme par le ventre.'}
          </p>

          {/* Boutons son + recommencer côte à côte */}
          <div style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 10 }}>
            <button
              onClick={e => { e.stopPropagation(); toggleMute() }}
              style={{
                width: 52, height: 52, borderRadius: '50%',
                background: muted ? 'rgba(200,100,80,0.18)' : 'rgba(255,255,255,0.50)',
                border: `2px solid ${muted ? 'rgba(200,100,80,0.55)' : `${g1}50`}`,
                cursor: 'pointer', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s ease, border-color 0.2s ease',
                boxShadow: `0 4px 12px rgba(0,0,0,0.08)`,
              }}
              title={muted ? 'Réactiver le son' : 'Couper le son'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={e => { e.stopPropagation(); restartAudio() }}
              style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(255,255,255,0.40)',
                border: `2px solid ${g1}40`,
                cursor: 'pointer', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s ease',
                boxShadow: `0 4px 12px rgba(0,0,0,0.08)`,
              }}
              title="Recommencer depuis le début"
            >
              ↺
            </button>

            {/* Bouton Passé — dev uniquement */}
            {import.meta.env.DEV && (
              <button
                onClick={e => { e.stopPropagation(); stopAll(); setState('ended'); setTimeout(onDone, 200) }}
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(255,160,60,0.18)',
                  border: '2px solid rgba(255,160,60,0.45)',
                  cursor: 'pointer', fontSize: 11, fontFamily: "'Jost',sans-serif",
                  fontWeight: 600, color: 'rgba(180,90,20,0.80)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  letterSpacing: '.04em',
                }}
                title="Passer (dev)"
              >
                Passé
              </button>
            )}
          </div>
        </>
      )}

      {/* Phase 3 — voile sombre de l'extérieur vers l'intérieur */}
      {darkMode && (
        <>
          {/* Paupières qui se ferment — le trou se rétrécit progressivement */}
          {(() => {
            // Le rayon transparent passe de 350px (tout visible) à 70px (juste l'orbe)
            const eased   = darkOpacity < 0.5
              ? 2 * darkOpacity * darkOpacity
              : 1 - Math.pow(-2 * darkOpacity + 2, 2) / 2   // ease-in-out
            const hole    = Math.round(350 * (1 - eased))
            const soft    = Math.round(hole * 1.25)
            const edge    = Math.round(hole * 2.2)
            return (
              <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(circle at 50% 42%, transparent 0px, transparent ${hole}px, rgba(0,0,0,0.96) ${soft}px, black ${edge}px)`,
                opacity: darkOpacity,
                pointerEvents: 'none',
                zIndex: 5,
              }} />
            )
          })()}
          {/* Texte final — dans le flux, 100px sous l'orbe */}
          <p style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 'clamp(20px,5.2vw,26px)',
            fontStyle: 'italic',
            color: `rgba(255,255,255,${Math.min(1, Math.max(0, (darkOpacity - 0.4) / 0.6))})`,
            lineHeight: 1.65,
            margin: '100px 0 0',
            padding: '0 28px',
            textAlign: 'center',
            position: 'relative', zIndex: 12,
            pointerEvents: 'none',
          }}>
            Maintenant, ferme les yeux.
          </p>
        </>
      )}
    </div>
  )

  return (
    <div style={{ ...BASE, position: 'relative' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg,${g1},${g2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 32, boxShadow: `0 8px 24px ${glow}` }}>✓</div>
      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(19px,5vw,23px)', fontStyle: 'italic', color: TEXT, margin: 0, lineHeight: 1.65, maxWidth: 300 }}>
        Prends un instant pour remarquer comment tu te sens maintenant.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WOFDayProgressionScreen — écran de clôture : fleur par jour (J1→J7)
// Indépendant du module onboarding — basé sur le numéro de jour, pas les rituels
// ─────────────────────────────────────────────────────────────────────────────

const WOF_DAY_META = [
  { day: 1, zone: 'Racines',  badge: 'JOUR 1 · RACINES',  text: "Tu as pris soin de toi.\nTes racines, elles, le savent." },
  { day: 2, zone: 'Tige',     badge: 'JOUR 2 · TIGE',     text: "Tu es revenu·e.\nQuelque chose commence à se tenir debout." },
  { day: 3, zone: 'Feuilles', badge: 'JOUR 3 · FEUILLES', text: "Ce qui circule en toi\ncommence à trouver son chemin." },
  { day: 4, zone: 'Fleurs',   badge: 'JOUR 4 · FLEURS',   text: "Tu t'es accordé de l'espace.\nTon jardin l'a ressenti." },
  { day: 5, zone: 'Souffle',  badge: 'JOUR 5 · SOUFFLE',  text: "Le lien, même discret,\nest là. Tu l'as créé." },
  { day: 6, zone: 'Ta fleur', badge: 'JOUR 6 · TA FLEUR', text: "Ta fleur commence à s'ouvrir.\nElle attendait ce moment." },
  { day: 7, zone: 'Ensemble', badge: 'JOUR 7 · ENSEMBLE', text: "Ton jardin est vivant.\nEt toi avec lui." },
]

// ── Table santé + palette par jour — alimente PlantSVG ──────────────────────
// from → to : plage de health animée pour chaque jour (PlantSVG : seed<8%, sprout 8-25%, young 25-45%, bud 45-65%, flower 65-100%)
const WOF_DAY_PLANT = [
  { from:  5, to:  8, petalColor1: '#c8a0b0', petalColor2: '#d4b5c3', petalShape: 'round'  }, // J1 — WOFRacinesSVG remplace PlantSVG
  { from:  9, to: 23, petalColor1: '#8abb96', petalColor2: '#7aaa88', petalShape: 'round'  }, // J2 — tige + petites feuilles
  { from: 32, to: 56, petalColor1: '#6fa87a', petalColor2: '#8abb96', petalShape: 'round'  }, // J3 — feuilles × 3 paires
  { from: 43, to: 60, petalColor1: '#cc6860', petalColor2: '#dd9080', petalShape: 'tulip'  }, // J4 — bouton floral, rougit
  { from: 63, to: 76, petalColor1: '#c87898', petalColor2: '#d890b0', petalShape: 'round'  }, // J5 — fleur s'épanouit
  { from: 87, to: 97, petalColor1: '#d06888', petalColor2: '#e090b0', petalShape: 'round'  }, // J6 — fleur épanouie dès le départ
  { from: 88, to: 100,petalColor1: '#e0709a', petalColor2: '#f090b8', petalShape: 'round'  }, // J7
]

// dead code kept only for reference — replaced by PlantSVG below
function WOFPlantSVG_UNUSED({ day = 1, color = '#c8a0b0', animate = false }) {
  const W = 220, H = 260, cx = 110, gY = 148

  const springIn = (delay = '0s') => animate
    ? { animation: `flowerGrow 1.4s ${delay} cubic-bezier(0.25,0.46,0.45,0.94) both` }
    : {}

  const SH   = [0, 0, 36, 64, 90, 108, 118, 120]
  const sh   = SH[Math.min(day, 7)]
  const topY = gY - sh

  const s    = n => day >= n
  const only = (mn, mx) => day >= mn && day <= mx

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" style={{ display: 'block', overflow: 'visible' }}>

      {/* Ciel */}
      <rect x={0} y={0} width={W} height={gY} fill="url(#skyGrad)" rx={0} />
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8f4f8" />
          <stop offset="100%" stopColor="#f5efe6" />
        </linearGradient>
        <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b3d1e" />
          <stop offset="100%" stopColor="#3a1e0a" />
        </linearGradient>
      </defs>

      {/* Sol */}
      <rect x={0} y={gY} width={W} height={H - gY} fill="url(#soilGrad)" />
      {/* Ligne sol */}
      <rect x={0} y={gY - 1} width={W} height={3} fill="#8b5a2b" opacity={0.6} />

      {/* ── Jour 1 : graine + RACINES qui descendent ── */}
      {only(1, 1) && <>
        {/* Graine au-dessus du sol */}
        <ellipse cx={cx} cy={gY - 6} rx={13} ry={8} fill="#8a6520" opacity={0.9} />
        <ellipse cx={cx} cy={gY - 6} rx={22} ry={14} fill={color} opacity={0.2} style={{ animation: 'seedGlow 3s ease-in-out infinite' }} />

        {/* Racine centrale */}
        <line x1={cx} y1={gY} x2={cx} y2={gY + 64} stroke="#c8a06a" strokeWidth={3} strokeLinecap="round"
          style={animate ? { animation: 'flowerGrow 1.2s 0.2s ease-out both', transformOrigin: `${cx}px ${gY}px` } : {}} />
        {/* Racines latérales */}
        {[[-28, 28, 40], [28, 28, 40], [-44, 48, 28], [44, 48, 28]].map(([dx, dy, len], i) => (
          <line key={i}
            x1={cx + dx * 0.1} y1={gY + dy * 0.4}
            x2={cx + dx} y2={gY + dy}
            stroke="#c8a06a" strokeWidth={2} strokeLinecap="round" opacity={0.75}
            style={animate ? { animation: `flowerGrow 1s ${0.4 + i * 0.15}s ease-out both`, transformOrigin: `${cx}px ${gY + dy * 0.3}px` } : {}}
          />
        ))}
        {/* Radicelles */}
        {[[-14, 72], [14, 72], [-28, 58], [28, 58]].map(([dx, dy], i) => (
          <line key={i}
            x1={cx + dx * 0.5} y1={gY + dy - 10}
            x2={cx + dx} y2={gY + dy}
            stroke="#c8a06a" strokeWidth={1.2} strokeLinecap="round" opacity={0.5}
            style={animate ? { animation: `flowerGrow 0.8s ${0.7 + i * 0.1}s ease-out both`, transformOrigin: `${cx + dx * 0.5}px ${gY + dy - 10}px` } : {}}
          />
        ))}
      </>}

      {/* ── Jours 2+ : tige ── */}
      {s(2) && (
        <path d={`M ${cx} ${gY} Q ${cx + 6} ${topY + sh * 0.52} ${cx} ${topY}`}
          stroke="#5e8456" strokeWidth={3.5} strokeLinecap="round"
          style={springIn('0s')} />
      )}

      {/* Feuille gauche (jours 2+) */}
      {s(2) && (
        <ellipse cx={cx - 22} cy={topY + 18} rx={20} ry={9} fill="#7aaa88"
          style={{ transformBox: 'fill-box', transformOrigin: 'right center', transform: 'rotate(-36deg)', ...(animate ? { animation: 'leafIn 0.9s 0.4s ease-out both' } : {}) }} />
      )}

      {/* Feuille droite (jours 4+) */}
      {s(4) && (
        <ellipse cx={cx + 22} cy={topY + 34} rx={20} ry={9} fill="#7aaa88"
          style={{ transformBox: 'fill-box', transformOrigin: 'left center', transform: 'rotate(36deg)', ...(animate ? { animation: 'leafIn 0.9s 0.7s ease-out both' } : {}) }} />
      )}

      {/* Bouton (jour 5) */}
      {only(5, 5) && (
        <ellipse cx={cx} cy={topY} rx={11} ry={15} fill={color}
          style={animate ? { animation: 'budIn 0.9s ease-out both' } : {}} />
      )}

      {/* Pétales (jours 6-7) */}
      {s(6) && [0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = deg * Math.PI / 180
        const dist = day >= 7 ? 18 : 12
        const rx   = day >= 7 ? 21 : 14
        return (
          <ellipse key={deg}
            cx={cx + Math.cos(rad) * dist} cy={topY + Math.sin(rad) * dist}
            rx={rx} ry={rx * 0.52} fill={color} opacity={0.88}
            style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: `rotate(${deg}deg)`, ...(animate ? { animation: `petalIn 0.7s ${0.08 * i}s ease-out both` } : {}) }}
          />
        )
      })}

      {/* Cœur fleur (jours 6-7) */}
      {s(6) && <circle cx={cx} cy={topY} r={9} fill="#f0c070"
        style={animate ? { animation: 'petalIn 0.6s 0.5s ease-out both' } : {}} />}

      {/* Racines visibles sous sol (jours 2+, discret) */}
      {s(2) && (
        <g opacity={0.35}>
          <line x1={cx} y1={gY + 2} x2={cx} y2={gY + 40} stroke="#c8a06a" strokeWidth={2} strokeLinecap="round" />
          <line x1={cx} y1={gY + 14} x2={cx - 22} y2={gY + 36} stroke="#c8a06a" strokeWidth={1.5} strokeLinecap="round" />
          <line x1={cx} y1={gY + 14} x2={cx + 22} y2={gY + 36} stroke="#c8a06a" strokeWidth={1.5} strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}

const WOF_DAY_COLORS = ['#c8a0b0','#9ab8c8','#7aaa88','#d4a0b0','#c8a870','#b8a090','#a09080']

// ── sparkleAt — partagé entre WOFRacinesSVG et WOFTigeSVG ──────────────────
function sparkleAt(px, py, count, col, spreadX, spreadY, baseDelay = 0) {
  const pts = Array.from({ length: count }, (_, i) => {
    const ang = (i / count) * Math.PI * 2 + i * 1.37
    const dx  = Math.cos(ang) * spreadX * (0.35 + (((i * 7919) % 100) / 100) * 0.65)
    const dy  = Math.sin(ang) * spreadY * (0.35 + (((i * 6271) % 100) / 100) * 0.65)
    const dur = (1.6 + (i % 4) * 0.55).toFixed(2)
    const del = (baseDelay + (i * 0.38) % 2.2).toFixed(2)
    const sz  = 1.8 + (i % 3) * 0.9
    return { x: px + dx, y: py + dy, dur, del, sz }
  })
  return (
    <g pointerEvents="none">
      {pts.map((p, i) => (
        <g key={i} style={{ transformOrigin: `${p.x}px ${p.y}px`, animation: `svgSpk ${p.dur}s ease-in-out infinite ${p.del}s` }}>
          <line x1={p.x-p.sz} y1={p.y} x2={p.x+p.sz} y2={p.y} stroke={col} strokeWidth={0.9} strokeLinecap="round" opacity={0.85}/>
          <line x1={p.x} y1={p.y-p.sz} x2={p.x} y2={p.y+p.sz} stroke={col} strokeWidth={0.9} strokeLinecap="round" opacity={0.85}/>
          <line x1={p.x-p.sz*.6} y1={p.y-p.sz*.6} x2={p.x+p.sz*.6} y2={p.y+p.sz*.6} stroke={col} strokeWidth={0.6} strokeLinecap="round" opacity={0.6}/>
          <line x1={p.x+p.sz*.6} y1={p.y-p.sz*.6} x2={p.x-p.sz*.6} y2={p.y+p.sz*.6} stroke={col} strokeWidth={0.6} strokeLinecap="round" opacity={0.6}/>
          <circle cx={p.x} cy={p.y} r={p.sz*.55} fill={col} opacity={0.35}
            style={{ transformOrigin: `${p.x}px ${p.y}px`, animation: `svgSpkR ${p.dur}s ease-out infinite ${p.del}s` }}/>
        </g>
      ))}
    </g>
  )
}

// ── WOFRacinesSVG — PlantSVG seed stage + overlay racines fractal récursif ───
function WOFRacinesSVG({ animate = false }) {
  const [health,    setHealth]    = useState(animate ? 5 : 7.8)
  const [rootPhase, setRootPhase] = useState(animate ? 0 : 1)  // 0→1 ; 1 = racines déjà déployées

  useEffect(() => {
    if (!animate) return
    const start    = Date.now()
    const hDur     = 3000
    const rDur     = 12000  // 12s : évolution lente, bien lisible

    let raf
    const tick = () => {
      const now = Date.now()
      setHealth(5 + 2.8 * Math.min(1, (now - start) / hDur))
      setRootPhase(Math.min(1, (now - start) / rDur))
      if (now - start < rDur) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [animate])

  // Génère récursivement les segments racinaires (algorithme fractal)
  const rootPathsRef = useRef(null)
  if (!rootPathsRef.current) {
    const MAX_DEPTH = 9
    const paths = []

    // Stockage en coordonnées pour permettre le mirroring
    function createRoot(x, y, angle, length, depth) {
      if (depth <= 0 || length < 1.5) return
      const x2 = x + Math.cos(angle) * length
      const y2 = y + Math.sin(angle) * length
      if (y2 < 190 || y2 > 258 || x2 < 20 || x2 > 380) return
      const cpx = (x + x2) / 2 + (Math.random() - 0.5) * 8
      const cpy = (y + y2) / 2 + (Math.random() - 0.5) * 5
      paths.push({ x1: x, y1: y, cpx, cpy, x2, y2, sw: Math.max(0.25, depth * 0.18), depth })
      const branches = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < branches; i++) {
        createRoot(
          x2, y2,
          angle + (Math.random() - 0.5) * 1.2,
          length * (0.65 + Math.random() * 0.15),
          depth - 1
        )
      }
    }

    // Pivot central
    createRoot(200, 196, Math.PI / 2, 36, MAX_DEPTH)
    // Latérales côté GAUCHE seulement (PI/2 + offset > PI/2 → va vers la gauche)
    for (let i = 0; i < 5; i++) {
      const offset = 0.15 + Math.random() * 1.15  // 0.15 à 1.30 rad
      createRoot(200, 196, Math.PI / 2 + offset, 42, MAX_DEPTH - 1)
    }
    // Fines racines centrales côté gauche (depth=1, pas de branchement)
    for (let i = 0; i < 7; i++) {
      createRoot(200, 196, Math.PI / 2 + Math.random() * 0.20, 18, 1)
    }

    // Miroir parfait autour de x=200 — symétrie garantie
    const mirrored = paths.map(p => ({
      ...p,
      x1:  400 - p.x1,
      cpx: 400 - p.cpx,
      x2:  400 - p.x2,
    }))

    rootPathsRef.current = [...paths, ...mirrored]
  }

  const rootPaths = rootPathsRef.current
  const MAX_DEPTH = 9

  // Positions des scintillements — calculées une fois, delay CSS = synchronisation
  const sparklePointsRef = useRef(null)
  if (!sparklePointsRef.current) {
    const pts = []
    const depthConfig = [
      { depth: 8, count: 3, spread: 14, skip: 4, max: 5  },
      { depth: 7, count: 2, spread: 10, skip: 5, max: 6  },
      { depth: 6, count: 2, spread: 8,  skip: 5, max: 6  },
      { depth: 4, count: 2, spread: 6,  skip: 6, max: 8  },
      { depth: 2, count: 2, spread: 5,  skip: 6, max: 8  },
    ]
    depthConfig.forEach(({ depth, count, spread, skip, max }) => {
      const level  = MAX_DEPTH - depth
      const delay  = (level / MAX_DEPTH) * 0.85 * 12  // délai en secondes
      rootPaths
        .filter(p => p.depth === depth)
        .filter((_, i) => i % skip === 0)
        .slice(0, max)
        .forEach(p => pts.push({ x: p.x2, y: p.y2, count, spread, delay }))
    })
    sparklePointsRef.current = pts
  }

  // Son harpe — ref stable pour survivre au StrictMode double-mount
  const audioRef = useRef(null)
  useEffect(() => {
    if (audioRef.current) return   // déjà lancé (StrictMode)
    const audio = new Audio('/harpe.mp3')
    audio.volume = 0.7
    audioRef.current = audio
    audio.play().catch(() => {})
    const fade = setTimeout(() => {
      const step = setInterval(() => {
        if (!audioRef.current) { clearInterval(step); return }
        audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.02)
        if (audioRef.current.volume === 0) { clearInterval(step); audioRef.current.pause() }
      }, 100)
    }, 18000)
    return () => { clearTimeout(fade) }
  }, [])

  function pathProgress(depth) {
    const level = MAX_DEPTH - depth
    const start = (level / MAX_DEPTH) * 0.85
    return Math.max(0, Math.min(1, (rootPhase - start) / 0.15))
  }

  // Génère les points de scintillement SVG (identique à PlantSVG.sparkleAt)
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>

      {/* PlantSVG — seed stage (health 5→7.8%) */}
      <PlantSVG
        health={health}
        gardenSettings={{
          sunriseH: 7, sunriseM: 0, sunsetH: 20, sunsetM: 0,
          petalColor1: '#c8a0b0',
          petalColor2: '#d4b5c3',
          petalShape:  'round',
        }}
        clearSky={true}
        lumensLevel="faible"
        celebrate={false}
      />

      {/* Overlay racines fractales — même viewBox que PlantSVG */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox="0 0 400 260"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <style>{`
            @keyframes svgSpk  { 0%{opacity:0;transform:scale(0.3) rotate(0deg)} 35%{opacity:1;transform:scale(1.15) rotate(20deg)} 65%{opacity:0.6;transform:scale(0.9) rotate(35deg)} 100%{opacity:0;transform:scale(0.3) rotate(60deg)} }
            @keyframes svgSpkR { 0%{opacity:0;transform:scale(0)} 30%{opacity:0.5} 70%{opacity:0.1} 100%{opacity:0;transform:scale(1.8)} }
          `}</style>
          <clipPath id="wrf_clip">
            <rect x={0} y={189} width={400} height={71} />
          </clipPath>
        </defs>
        <g clipPath="url(#wrf_clip)">
          {rootPaths.map((p, i) => {
            const prog = pathProgress(p.depth)
            if (prog <= 0) return null
            return (
              <path
                key={i}
                d={`M${p.x1.toFixed(1)},${p.y1.toFixed(1)} Q${p.cpx.toFixed(1)},${p.cpy.toFixed(1)} ${p.x2.toFixed(1)},${p.y2.toFixed(1)}`}
                fill="none"
                stroke="#c49a6c"
                strokeWidth={p.sw * prog}
                strokeLinecap="round"
                opacity={0.75 + 0.25 * (p.depth / MAX_DEPTH)}
              />
            )
          })}
        </g>

        {/* Scintillements — positions pré-calculées, animations CSS pures */}
        <g clipPath="url(#wrf_clip)">
          {sparklePointsRef.current.map((s, i) => (
            <g key={i}
              style={{
                opacity: 0,
                animation: `wofSpkFade 3s ${s.delay}s ease-out forwards`,
              }}
            >
              {sparkleAt(s.x, s.y, s.count, 'rgba(255,222,60,0.90)', s.spread, s.spread * 0.65, i * 0.18)}
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

// ── WOFTigeSVG — J2 : racines J1 statiques + zoom sur tige qui grandit ────────
function WOFTigeSVG() {
  const [zoom,         setZoom]         = useState(false)
  const [health,       setHealth]       = useState(7.8)
  const [sparkVisible, setSparkVisible] = useState(false)  // scintillements 3s
  const audioRef = useRef(null)

  // Chemins racinaires statiques — rootPhase = 1 (déjà déployés)
  const rootPathsRef = useRef(null)
  if (!rootPathsRef.current) {
    const paths = []
    function cr(x, y, angle, length, depth) {
      if (depth <= 0 || length < 1.5) return
      const x2 = x + Math.cos(angle) * length
      const y2 = y + Math.sin(angle) * length
      if (y2 < 190 || y2 > 258 || x2 < 20 || x2 > 380) return
      const cpx = (x + x2) / 2 + (Math.random() - 0.5) * 8
      const cpy = (y + y2) / 2 + (Math.random() - 0.5) * 5
      paths.push({ x1: x, y1: y, cpx, cpy, x2, y2, sw: Math.max(0.25, depth * 0.18), depth })
      const b = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < b; i++) cr(x2, y2, angle + (Math.random() - 0.5) * 1.2, length * (0.65 + Math.random() * 0.15), depth - 1)
    }
    cr(200, 196, Math.PI / 2, 36, 9)
    for (let i = 0; i < 5; i++) { const o = 0.15 + Math.random() * 1.15; cr(200, 196, Math.PI / 2 + o, 42, 8) }
    for (let i = 0; i < 7; i++) cr(200, 196, Math.PI / 2 + Math.random() * 0.20, 18, 1)
    const m = paths.map(p => ({ ...p, x1: 400 - p.x1, cpx: 400 - p.cpx, x2: 400 - p.x2 }))
    rootPathsRef.current = [...paths, ...m]
  }

  useEffect(() => {
    const t1 = setTimeout(() => setZoom(true), 2000)
    const t2 = setTimeout(() => {
      // Harpe + scintillements au démarrage de la tige
      const audio = new Audio('/harpe.mp3')
      audio.volume = 0.65
      audioRef.current = audio
      audio.play().catch(() => {})
      setSparkVisible(true)
      setTimeout(() => setSparkVisible(false), 3000)  // scintillements 3s

      // Tige grandit
      const start = Date.now()
      let raf
      const tick = () => {
        const p = Math.min(1, (Date.now() - start) / 5500)
        setHealth(7.8 + 24.2 * p)
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); audioRef.current?.pause() }
  }, [])

  const gs = { sunriseH: 7, sunriseM: 0, sunsetH: 20, sunsetM: 0, petalColor1: '#9ab8c8', petalColor2: '#b0ccd8', petalShape: 'round' }
  const MAX_DEPTH = 9

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        transform: zoom ? 'scale(2.2)' : 'scale(1)',
        transformOrigin: '50% 52%',   // sol (72%) apparaît à ~5% du bas après zoom
        transition: zoom ? 'transform 4.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
      }}>
        {/* PlantSVG — health croît de 7.8% (graine) à 32% (tige + 3 feuilles) */}
        <PlantSVG health={health} gardenSettings={gs} clearSky={true} lumensLevel="faible" celebrate={false} />

        {/* Racines J1 + scintillements tige — même overlay SVG */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" fill="none">
          <defs>
            <clipPath id="j2_rclip"><rect x={0} y={189} width={400} height={71} /></clipPath>
            <filter id="j2_rf"><feGaussianBlur stdDeviation="0.45"/></filter>
            <style>{`
              @keyframes svgSpk{0%{opacity:0;transform:scale(0.3) rotate(0deg)}35%{opacity:1;transform:scale(1.15) rotate(20deg)}65%{opacity:0.6;transform:scale(0.9) rotate(35deg)}100%{opacity:0;transform:scale(0.3) rotate(60deg)}}
              @keyframes svgSpkR{0%{opacity:0;transform:scale(0)}30%{opacity:0.5}70%{opacity:0.1}100%{opacity:0;transform:scale(1.8)}}
            `}</style>
          </defs>

          {/* Racines */}
          <g clipPath="url(#j2_rclip)" filter="url(#j2_rf)">
            {rootPathsRef.current.map((p, i) => (
              <path key={i}
                d={`M${p.x1.toFixed(1)},${p.y1.toFixed(1)} Q${p.cpx.toFixed(1)},${p.cpy.toFixed(1)} ${p.x2.toFixed(1)},${p.y2.toFixed(1)}`}
                fill="none" stroke="#c49a6c" strokeWidth={p.sw} strokeLinecap="round"
                opacity={0.75 + 0.25 * (p.depth / MAX_DEPTH)}
              />
            ))}
          </g>

          {/* Scintillements le long de la tige (3s) */}
          {sparkVisible && (
            <g opacity={1} style={{ transition: 'opacity 0.5s ease' }}>
              {sparkleAt(200, 183, 3, 'rgba(255,222,60,0.90)', 10, 7,  0.0)}
              {sparkleAt(200, 168, 3, 'rgba(255,222,60,0.90)',  8, 6,  0.3)}
              {sparkleAt(200, 153, 3, 'rgba(255,222,60,0.90)',  7, 5,  0.6)}
              {sparkleAt(200, 140, 2, 'rgba(255,222,60,0.90)',  6, 4,  0.9)}
              {sparkleAt(195, 175, 2, 'rgba(255,222,60,0.90)',  5, 4,  0.4)}
              {sparkleAt(205, 175, 2, 'rgba(255,222,60,0.90)',  5, 4,  0.7)}
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}

// ── Texte en arc avec effet machine à écrire ─────────────────────────────────
function ArcTypewriterText({ text, startDelay = 3500, charDelay = 75 }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const t0 = setTimeout(() => {
      let i = 0
      const interval = setInterval(() => {
        i++
        setCount(i)
        if (i >= text.length) clearInterval(interval)
      }, charDelay)
      return () => clearInterval(interval)
    }, startDelay)
    return () => clearTimeout(t0)
  }, [])

  if (count === 0) return null

  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}
      viewBox="0 0 300 340"
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
    >
      <defs>
        <path id="arcPath" d="M -30,185 Q 150,148 330,185" fill="none" />
        <filter id="arcShadow" x="-10%" y="-40%" width="120%" height="180%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.55)" />
        </filter>
      </defs>
      <text
        fontFamily="Cormorant Garamond, Georgia, serif"
        fontSize="30"
        fontStyle="italic"
        fontWeight="500"
        fill="rgba(255,255,255,0.95)"
        filter="url(#arcShadow)"
        letterSpacing="0.5"
      >
        <textPath href="#arcPath" startOffset="50%" textAnchor="middle">
          {text.slice(0, count)}
        </textPath>
      </text>
    </svg>
  )
}

function WOFDayProgressionScreen({ dayNumber = 1, onContinue, onBack }) {
  const idx      = Math.min(dayNumber - 1, 6)
  const meta     = WOF_DAY_META[idx]
  const color    = WOF_DAY_COLORS[idx]
  const dayPlant = WOF_DAY_PLANT[idx]

  const [health,     setHealth]     = useState(dayPlant.from)
  const [textVisible, setTextVisible] = useState(false)
  const [ctaVisible,  setCtaVisible]  = useState(false)

  useEffect(() => {
    const start = Date.now()
    const dur   = 3500
    let raf
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / dur)
      setHealth(dayPlant.from + (dayPlant.to - dayPlant.from) * p)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const t1 = setTimeout(() => setTextVisible(true), 1600)
    const t2 = setTimeout(() => setCtaVisible(true),  3200)
    return () => { cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const gardenSettings = {
    sunriseH: 7, sunriseM: 0, sunsetH: 20, sunsetM: 0,
    petalColor1: dayPlant.petalColor1,
    petalColor2: dayPlant.petalColor2,
    petalShape:  dayPlant.petalShape,
  }

  return (
    <div style={{ minHeight: 'calc(54dvh)', display: 'flex', flexDirection: 'column', background: '#faf5f2', textAlign: 'center' }}>

      {/* Zone plante plein largeur avec fondus */}
      <div style={{ position: 'relative', width: 'calc(100% - 48px)', margin: '0 auto', flexShrink: 0 }}>
        <div style={{ position: 'relative', borderRadius: 20, height: dayNumber <= 5 ? 'min(340px, 38vh)' : 'min(260px, 32vh)', overflow: 'hidden' }}>
        {dayNumber === 1 ? (
          <WOFRacinesSVG animate={true} />
        ) : dayNumber === 2 ? (
          <WOFTigeSVG />
        ) : dayNumber === 3 ? (
          <WOFFeuillesSVG />
        ) : dayNumber === 4 ? (
          <WOFFleursSVG />
        ) : dayNumber === 5 ? (
          <WOFSouffleSVG />
        ) : (
          <PlantSVG
            health={health}
            gardenSettings={gardenSettings}
            clearSky={true}
            lumensLevel="faible"
            celebrate={dayNumber >= 5}
          />
        )}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to bottom, #faf5f2, transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 72, background: 'linear-gradient(to top, #faf5f2, transparent)', pointerEvents: 'none' }} />
        </div>
        {dayNumber === 1 && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
            <ArcTypewriterText text="chaque jour ta fleur grandit" startDelay={3500} charDelay={75} />
          </div>
        )}
      </div>

      {/* Badge + texte + CTA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 24px 24px' }}>

        {/* Texte de clôture */}
        <p style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: 'clamp(18px,4.6vw,26px)',
          fontStyle: 'italic',
          fontWeight: 500,
          color: '#2a1010',
          lineHeight: 1.5,
          margin: '0 0 20px',
          whiteSpace: 'pre-line',
          maxWidth: 340,
          opacity: textVisible ? 1 : 0,
          transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 1.2s ease, transform 1.2s ease',
        }}>
          {meta.text}
        </p>

        {/* CTA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%', opacity: ctaVisible ? 1 : 0, transform: ctaVisible ? 'translateY(0)' : 'translateY(10px)', transition: 'opacity 0.9s ease, transform 0.9s ease', pointerEvents: ctaVisible ? 'auto' : 'none' }}>
          <div style={{ justifySelf: 'start' }}>{onBack && <BackButton onClick={onBack} />}</div>
          <button
            onClick={onContinue}
            className={ctaVisible ? 'wof-cta-pulse' : ''}
            style={{
              padding: '14px 44px',
              borderRadius: 100,
              border: 'none',
              background: `linear-gradient(135deg, ${color}, ${WOF_DAY_COLORS[Math.min(dayNumber, 6)]})`,
              color: '#fff',
              fontFamily: "'Jost',sans-serif",
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: `0 8px 28px ${color}40`,
            }}
          >
            Continuer
          </button>
          <div />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Ressenti avant / après — J1
// ─────────────────────────────────────────────────────────────────────────────

const J1_FEELINGS = [
  { key: 'epuise',  label: 'Épuisé·e',  color: '#c98a86', v: 0 },
  { key: 'fatigue', label: 'Fatigué·e', color: '#d6a98f', v: 1 },
  { key: 'neutre',  label: 'Neutre',    color: '#e3cba0', v: 2 },
  { key: 'apaise',  label: 'Apaisé·e',  color: '#bcc79a', v: 3 },
  { key: 'bien',    label: 'Bien',      color: '#9fbf86', v: 4 },
]

// 9 positions — du plus éprouvé (bas, v=0) au plus épanoui (haut, v=4)
const J1_FEELINGS_FULL = [
  { key: 'abouts',   emoji: '🥵', label: 'À bout de souffle', color: '#b96866', v: 0,   main: true },
  { key: 'eprouve',  emoji: '😔', label: 'Éprouvé·e',         color: '#c98a86', v: 0.5, main: true },
  { key: 'tendu',    emoji: '😣', label: 'Tendu·e',            color: '#cc9080', v: 1,   main: true },
  { key: 'preoc',    emoji: '😟', label: 'Préoccupé·e',        color: '#d6a98f', v: 1.5, main: true },
  { key: 'mitige',   emoji: '🤔', label: 'Mitigé·e',           color: '#e0b890', v: 2,   main: true },
  { key: 'stable',   emoji: '😐', label: 'Stable',             color: '#e3cba0', v: 2.5, main: true },
  { key: 'plutser',  emoji: '🙂', label: 'Plutôt serein·e',    color: '#bcc79a', v: 3,   main: true },
  { key: 'serein',   emoji: '😊', label: 'Serein·e',           color: '#9fbf86', v: 3.5, main: true },
  { key: 'epanoui',  emoji: '☀️', label: 'Épanoui·e',          color: '#8bc34a', v: 4,   main: true },
]

function RessentiScreen({ phase, onAnswer, onBack }) {
  const [pos, setPos]     = useState(null)   // 0.0 (bas=Épuisé) → 1.0 (haut=Bien)
  const trackRef          = useRef(null)
  const dragging          = useRef(false)
  const isBefore          = phase === 'before'
  const C                 = '#c8a0b0'
  const TRACK_H           = 'clamp(160px, 38vh, 260px)'

  const STAGES = J1_FEELINGS_FULL  // 9 positions

  function getNearestFeel(p) {
    const v = p * 4
    return STAGES.reduce((a, b) => Math.abs(b.v - v) < Math.abs(a.v - v) ? b : a)
  }

  function posFromPointer(e) {
    const rect = trackRef.current.getBoundingClientRect()
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height))
  }

  function handlePointerDown(e) {
    dragging.current = true
    trackRef.current.setPointerCapture?.(e.pointerId)
    setPos(posFromPointer(e))
  }
  function handlePointerMove(e) {
    if (!dragging.current) return
    setPos(posFromPointer(e))
  }
  function handlePointerUp() { dragging.current = false }

  const feel     = pos !== null ? getNearestFeel(pos) : null
  const thumbTop = pos !== null ? `${(1 - pos) * 100}%` : null

  return (
    <div className="wof-in" style={{ padding: '12px 20px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(18px,4.8vw,24px)', fontWeight: 300, fontStyle: 'italic', color: '#2a1c1c', lineHeight: 1.3, marginBottom: 5, marginTop: 4 }}>
        {isBefore ? 'Comment te sens-tu, là, maintenant ?' : 'Et maintenant ?'}
      </h2>
      <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 12.5, fontWeight: 300, color: '#6e5852', lineHeight: 1.5, marginBottom: 18 }}>
        {isBefore ? "Glisse le curseur jusqu'à ce qui te correspond." : 'Remarque simplement ce qui a bougé.'}
      </p>

      {/* Slider : track + labels */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, height: TRACK_H, marginBottom: 22, width: '100%', maxWidth: 300 }}>

        {/* Track draggable */}
        <div
          ref={trackRef}
          style={{ position: 'relative', width: 40, height: '100%', borderRadius: 20, flexShrink: 0, cursor: 'pointer',
            background: 'linear-gradient(to bottom, #8bc34a, #9fbf86, #bcc79a, #e3cba0, #e0b890, #d6a98f, #cc9080, #c98a86, #b96866)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.12)', userSelect: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Thumb */}
          {thumbTop && (
            <div style={{
              position: 'absolute', left: '50%', top: thumbTop,
              transform: 'translate(-50%, -50%)',
              width: 34, height: 34, borderRadius: '50%',
              background: feel?.color || '#c8a0b0',
              border: '3px solid #fff',
              boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
              transition: 'background 0.2s ease',
              pointerEvents: 'none',
            }} />
          )}
          {/* Ligne guide si pas encore touché */}
          {thumbTop === null && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'Jost', fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>
              ↕
            </div>
          )}
        </div>

        {/* Labels — du haut (Bien) vers le bas (Épuisé), 9 positions */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', flex: 1 }}>
          {[...STAGES].reverse().map(f => {
            const isActive = feel?.key === f.key
            const isMain   = f.main
            return (
              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: isActive ? 1 : isMain ? 0.60 : 0.38, transition: 'opacity 0.2s ease' }}>
                <span style={{
                  width: isActive ? (isMain ? 13 : 10) : (isMain ? 10 : 7),
                  height: isActive ? (isMain ? 13 : 10) : (isMain ? 10 : 7),
                  borderRadius: '50%', background: f.color, flexShrink: 0,
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 2px 8px ${f.color}88` : 'none',
                }} />
                <span style={{ fontSize: isActive ? 16 : 13, lineHeight: 1, transition: 'all 0.2s ease', flexShrink: 0 }}>
                  {f.emoji}
                </span>
                <span style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: isActive ? 13.5 : 11.5,
                  fontWeight: isActive ? 500 : 300,
                  color: isActive ? '#2a1c1c' : '#6e5852',
                  transition: 'all 0.2s ease',
                }}>
                  {f.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%' }}>
        <div style={{ justifySelf: 'start', marginLeft: -10 }}><BackButton onClick={onBack} /></div>
        <button
          onClick={() => { if (feel) onAnswer(feel) }}
          disabled={!feel}
          className={feel ? 'wof-cta-pulse' : ''}
          style={{
            fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 500, letterSpacing: '.04em',
            color: '#fff', border: 'none', cursor: feel ? 'pointer' : 'default',
            padding: '0 32px', height: 48, borderRadius: 100,
            background: `linear-gradient(135deg, ${C}, #a87f90)`,
            boxShadow: feel ? '0 8px 22px rgba(200,160,176,0.45)' : 'none',
            opacity: feel ? 1 : 0.40, transition: 'opacity 0.3s ease',
          }}
        >
          {isBefore ? 'Commencer le rituel' : 'Voir ce qui a bougé'}
        </button>
        <div />
      </div>
    </div>
  )
}

// Teaser générique — reçoit video, texte et couleur accent
function DayTeaserScreen({ videoSrc, label, teaser, accentColor = '#9ab8c8', onNext }) {
  const [ended,      setEnded]      = useState(false)
  const [ctaVisible, setCtaVisible] = useState(false)

  function handleEnded() { setEnded(true); setTimeout(() => setCtaVisible(true), 800) }

  const style = window.innerWidth > 600
    ? { position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: 560, height: 'calc(100dvh - 48px)', zIndex: 300, background: '#000', overflow: 'hidden', borderRadius: 24 }
    : { position: 'fixed', inset: 0, zIndex: 300, background: '#000', overflow: 'hidden' }

  return (
    <div style={style}>
      <video src={videoSrc} autoPlay playsInline muted={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onEnded={handleEnded}
      />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '48px 28px 48px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.40) 60%, transparent 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        opacity: ended ? 1 : 0, transition: 'opacity 1.4s ease',
      }}>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(28px,7vw,40px)', fontWeight: 400, fontStyle: 'italic', color: '#fff', marginBottom: 4, textShadow: '0 2px 12px rgba(0,0,0,0.35)' }}>{label}</p>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(44px,12vw,64px)', fontWeight: 400, fontStyle: 'italic', color: '#fff', lineHeight: 1.05, margin: '0 0 36px', textShadow: '0 2px 16px rgba(0,0,0,0.40)' }}>{teaser}</h2>
        <button onClick={onNext} style={{ fontFamily: "'Jost',sans-serif", fontSize: 15, fontWeight: 500, color: '#fff', border: '1.5px solid rgba(255,255,255,0.55)', cursor: 'pointer', padding: '0 40px', height: 50, borderRadius: 100, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', opacity: ctaVisible ? 1 : 0, transition: 'opacity 0.9s ease', pointerEvents: ctaVisible ? 'auto' : 'none' }}>
          À demain
        </button>
      </div>
    </div>
  )
}

function J1TeaserScreen({ onNext }) {
  return <DayTeaserScreen videoSrc="/video/tige.mp4" label="Demain," teaser="ça grandit." accentColor="#9ab8c8" onNext={onNext} />
}

function J2TeaserScreen({ onNext }) {
  return <DayTeaserScreen videoSrc="/video/tige2.mp4" label="Demain," teaser="ça s'étoffe." accentColor="#7aaa88" onNext={onNext} />
}


function DeltaScreen({ answers, onNext }) {
  const before = J1_FEELINGS_FULL.find(f => f.key === answers?.j1?.feelBefore)
  const after  = J1_FEELINGS_FULL.find(f => f.key === answers?.j1?.feelAfter)

  useEffect(() => { if (!before || !after) onNext() }, [])
  if (!before || !after) return null

  const d = after.v - before.v
  const text = d > 0
    ? `Tu arrivais plutôt ${before.label.toLowerCase()}… et quelque chose s'est apaisé.`
    : d === 0
      ? `Tu es resté·e dans le même état. Et c'est très bien aussi — être là, simplement.`
      : `Quelque chose a remué. Ce n'est pas un échec : tu as accueilli ce qui était là.`

  const C = '#c8a0b0'

  const Pill = ({ f, label }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 44, height: 44, borderRadius: '50%', background: f.color, display: 'block', boxShadow: 'inset 0 0 0 5px rgba(255,255,255,0.50), 0 4px 12px rgba(0,0,0,0.10)' }} />
      <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, color: '#6e5852', letterSpacing: '.03em' }}>{f.label}</span>
    </div>
  )

  return (
    <div className="wof-in" style={{ padding: '40px 28px 56px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', boxSizing: 'border-box' }}>
      <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase', color: '#a87f90', marginBottom: 32 }}>
        Ce qui a bougé
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, margin: '0 0 32px' }}>
        <Pill f={before} />
        <span style={{ color: '#a87f90', fontSize: 24 }}>→</span>
        <Pill f={after} />
      </div>

      <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(20px,5.2vw,26px)', fontStyle: 'italic', color: '#2a1c1c', lineHeight: 1.65, maxWidth: 320, marginBottom: 40 }}>
        {text}
      </p>

      <button
        onClick={onNext}
        className="wof-cta-pulse"
        style={{
          fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 500, color: '#fff',
          border: 'none', cursor: 'pointer', padding: '0 36px', height: 52, borderRadius: 100,
          background: `linear-gradient(135deg, ${C}, #a87f90)`,
          boxShadow: '0 10px 26px rgba(200,160,176,0.45)',
        }}
      >
        Continuer
      </button>
    </div>
  )
}

const J1_RITUAL_DATA = {
  badge:    { icon: '🌱', label: 'RACINES · ANCRAGE' },
  title:    'Revenir à mes racines',
  subtitle: "Le rituel de l'ancrage profond",
  duration: '6 à 10 min',
  intro:    "Sous chaque agitation, tes racines sont là — silencieuses, solides, toujours disponibles.",
  steps: [
    { num: '1', label: 'Installe-toi',        text: "Pieds bien à plat sur le sol, dos naturellement droit. Laisse ton corps trouver sa place." },
    { num: '2', label: 'Sens le contact',     text: "Remarque tes pieds, leur poids, leur chaleur. Ce contact est réel — il est là maintenant." },
    { num: '3', label: 'Inspire et descends', text: "À chaque expiration, laisse quelque chose descendre doucement en toi. Pas d'effort." },
    { num: '4', label: 'Les racines s\'enfoncent', text: "Comme une plante qui trouve son ancrage. Tranquillement. Sans forcer." },
  ],
  tip: "Il n'y a rien à faire. Juste sentir. Juste être là.",
}

const J1_G1   = '#c8a0b0'
const J1_G2   = '#9a7890'
const J1_GLOW = 'rgba(200,160,176,0.40)'
const J1_BG   = 'radial-gradient(circle at 50% 18%, #f5efe6, #e8dfd2 58%, #e0d4c0)'

// ── J2 — La Tige ─────────────────────────────────────────────────────────────
const J2_G1   = '#9ab8c8'
const J2_G2   = '#7a98a8'
const J2_GLOW = 'rgba(154,184,200,0.40)'
const J2_BG   = 'radial-gradient(circle at 50% 18%, #eef4f7, #deeaf0 58%, #d4e2ea)'

const J2_RITUAL_DATA = {
  badge:    { icon: '🌿', label: 'TIGE · ANCRAGE VERTICAL' },
  title:    'Me tenir debout',
  subtitle: "Le rituel de la tige",
  duration: '10 à 15 min',
  intro:    "Une tige ne pousse pas malgré la pesanteur. Elle pousse grâce à elle.",
  steps: [
    { num: '1', label: 'Tiens-toi debout',   text: "Assis·e ou debout, dos naturellement droit. Sens la ligne qui te tient." },
    { num: '2', label: 'Imagine une tige',   text: "Une ligne fine qui monte du bassin jusqu'au sommet de la tête. Légère, souple." },
    { num: '3', label: 'Inspire et grandit', text: "À chaque inspiration, laisse cette ligne s'étirer doucement vers le haut." },
    { num: '4', label: 'Ton axe tient',      text: "Même sous tension, une tige revient à son axe. Sens le tien." },
  ],
  tip: "Tu n'as pas besoin de te forcer. La tige pousse simplement.",
}

function j2InvitationText(answers, dayKey = 'j2') {
  const feel = J1_FEELINGS_FULL.find(f => f.key === answers?.[dayKey]?.feelBefore)
  if (!feel) return "Ton axe est là. Ce rituel t'invite à le sentir."
  if (feel.v <= 0.5) return "Tu portes quelque chose de très lourd. Ce rituel va t'aider à trouver ton axe."
  if (feel.v <= 1)   return "Il y a de la tension en toi. La tige se redresse même sous le vent."
  if (feel.v <= 1.5) return "Quelque chose t'alourdit. Ce rituel va t'inviter à te redresser doucement."
  if (feel.v <= 2)   return "Tu cherches ton équilibre. Ce rituel va te montrer ton axe intérieur."
  if (feel.v <= 2.5) return "Tu tiens. Ce rituel va t'aider à tenir encore mieux."
  if (feel.v <= 3)   return "Il y a de la stabilité en toi. Ce rituel va l'approfondir."
  if (feel.v <= 3.5) return "Tu te sens assez bien. Ce rituel va solidifier cet élan."
  return "Tu rayonnes. Laisse cette énergie monter le long de ta tige."
}

// ── Composant générique — réutilisé par J1 et J2 ─────────────────────────────
function DayWOFRituelView({ ritualData, audioSrc, audioTitle, g1, g2, glow, bg, GuidedFallback, dayNumber, invitationText, darkAt, onComplete, onBack }) {
  const [phase,          setPhase]          = useState('view')
  const [audioAvailable, setAudioAvailable] = useState(false)
  const r = ritualData

  useEffect(() => {
    const audio = new Audio()
    audio.addEventListener('loadedmetadata', () => setAudioAvailable(true), { once: true })
    audio.addEventListener('error',          () => setAudioAvailable(false), { once: true })
    audio.src  = audioSrc
    audio.load()
  }, [audioSrc])

  if (phase === 'audio') return (
    <WOFAudioPlayer audioSrc={audioSrc} title={audioTitle || r.title} g1={g1} g2={g2} glow={glow}
      darkAt={darkAt} onDone={() => setPhase('flower')} onClose={() => setPhase('view')} />
  )
  if (phase === 'guided') return (
    <GuidedFallback onNext={() => setPhase('flower')} onBack={() => setPhase('view')} onAudio={audioAvailable ? () => setPhase('audio') : null} />
  )
  if (phase === 'flower') return (
    <WOFDayProgressionScreen dayNumber={dayNumber} onContinue={onComplete} onBack={() => setPhase('view')} />
  )

  return (
    <div style={{ position: 'relative', background: bg, minHeight: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-8%', width: 380, height: 380, borderRadius: '50%', background: `radial-gradient(circle,${g1}18 0%,transparent 65%)` }} />
        <div style={{ position: 'absolute', bottom: '-8%', right: '-8%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle,${g2}14 0%,transparent 65%)` }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '32px 28px 48px', boxSizing: 'border-box', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ animation: 'stepIn .38s ease .05s both', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(28px,7vw,38px)', fontWeight: 400, color: '#2A1F18', margin: '0 0 6px', lineHeight: 1.15 }}>{r.title}</h2>
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 14, color: 'rgba(50,35,20,0.50)', margin: '0 0 6px' }}>{r.subtitle}</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: `linear-gradient(135deg,${g1},${g2})`, animation: 'timeBadgePulse 2s ease-in-out infinite' }} />
            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 14, color: 'rgba(50,35,20,0.45)' }}>{r.duration}</span>
          </div>
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(20px,5.2vw,26px)', fontStyle: 'italic', color: '#1a0f0a', lineHeight: 1.6, margin: '0 0 52px', maxWidth: 340, animation: 'stepIn .4s ease .15s both' }}>
          {invitationText}
        </p>
        <div style={{ animation: 'stepIn .4s ease .35s both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
          <button
            onClick={() => setPhase(audioAvailable ? 'audio' : 'guided')}
            className="wof-cta-pulse"
            style={{ padding: 'clamp(12px, 3.5vw, 18px) clamp(18px, 5vw, 32px)', width: '100%', maxWidth: 340, borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontSize: 'clamp(13px, 3.8vw, 17px)', fontWeight: 700, color: '#fff', background: `linear-gradient(135deg,${g1},${g2})`, boxShadow: `0 8px 32px ${glow}`, transition: 'transform .18s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(6px, 2vw, 10px)', whiteSpace: 'nowrap', boxSizing: 'border-box' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <span style={{ fontSize: 'clamp(16px, 4.5vw, 24px)', flexShrink: 0 }}>🔊</span> Commencer le rituel
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%' }}>
            <div style={{ justifySelf: 'start', marginLeft: -18 }}><BackButton onClick={onBack} /></div>
            <button
              onClick={() => setPhase('guided')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontSize: 14, color: `rgba(50,35,20,0.45)`, textDecoration: 'underline', textUnderlineOffset: 3, padding: 0, whiteSpace: 'nowrap' }}
            >
              tu préfères lire ?
            </button>
            <div />
          </div>
        </div>
      </div>
    </div>
  )
}

function DayOneRituelView({ onComplete, onBack, dayNumber = 1, answers }) {
  const feel = J1_FEELINGS_FULL.find(f => f.key === answers?.j1?.feelBefore)
  const invText = (() => {
    if (!feel) return "Tes racines sont là. Ce rituel te guide — ferme les yeux et laisse venir."
    if (feel.v <= 0.5) return "Tu portes quelque chose de très lourd. Les racines absorbent ça — sans effort, sans jugement."
    if (feel.v <= 1)   return "Il y a de la tension en toi. Les racines descendent même sous la tempête."
    if (feel.v <= 1.5) return "Quelque chose occupe ton espace intérieur. Ce rituel va créer de l'espace."
    if (feel.v <= 2)   return "Tu es dans un entre-deux. Ce rituel va t'inviter à descendre plus loin."
    if (feel.v <= 2.5) return "Tu es stable. Ce rituel va t'aider à approfondir encore."
    if (feel.v <= 3)   return "Tu portes quelque chose de plutôt calme. Ce rituel va l'ancrer plus profondément."
    if (feel.v <= 3.5) return "Tu te sens serein·e. Ce rituel est le moment d'approfondir cette tranquillité."
    return "Tu rayonnes. Ce rituel va laisser cette énergie descendre jusqu'aux racines."
  })()
  return (
    <DayWOFRituelView
      ritualData={J1_RITUAL_DATA} audioSrc="/audio/ancrage.mp3" audioTitle="Revenir à mes racines"
      g1={J1_G1} g2={J1_G2} glow={J1_GLOW} bg={J1_BG}
      GuidedFallback={RacinesGuidedRituel}
      dayNumber={dayNumber} invitationText={invText}
      onComplete={onComplete} onBack={onBack}
    />
  )
}

function DayTwoRituelView({ onComplete, onBack, dayNumber = 2, answers }) {
  return (
    <DayWOFRituelView
      ritualData={J2_RITUAL_DATA} audioSrc="/audio/tige.mp3" audioTitle="Me tenir debout"
      g1={J2_G1} g2={J2_G2} glow={J2_GLOW} bg={J2_BG}
      GuidedFallback={TigeGuidedRituel}
      dayNumber={dayNumber} invitationText={j2InvitationText(answers, 'j2')} darkAt={100}
      onComplete={onComplete} onBack={onBack}
    />
  )
}

// ── J3 — Les Feuilles ────────────────────────────────────────────────────────
const J3_G1   = '#7aaa88'
const J3_G2   = '#5e8456'
const J3_GLOW = 'rgba(122,170,136,0.40)'
const J3_BG   = 'radial-gradient(circle at 50% 18%, #eef6ee, #deeedd 58%, #d4ead4)'

const J3_RITUAL_DATA = {
  badge:    { icon: '🍃', label: 'FEUILLES · CIRCULATION' },
  title:    'Observer ce qui traverse',
  subtitle: 'Le rituel du regard sans retenir',
  duration: '10 à 15 min',
  intro:    "Les feuilles captent la lumière. Elles reçoivent sans retenir.",
  steps: [
    { num: '1', label: 'Ferme les yeux',         text: "Laisse ce qui est là, être là. Pas besoin de changer quoi que ce soit." },
    { num: '2', label: 'Observe ce qui traverse', text: "Pensées, sensations, images… Regarde-les comme des feuilles dans le vent." },
    { num: '3', label: 'Ne retiens rien',         text: "À chaque expiration, laisse partir ce qui veut partir. Rien à retenir." },
    { num: '4', label: 'Reçois la lumière',       text: "Chaque inspiration t'apporte un peu plus de clarté." },
  ],
  tip: "Les feuilles ne jugent pas ce qui les traverse. Toi non plus.",
}

function j3InvitationText(answers) {
  const feel = J1_FEELINGS_FULL.find(f => f.key === answers?.j3?.feelBefore)
  if (!feel) return "Tes feuilles s'ouvrent. Ce rituel t'invite à observer ce qui traverse."
  if (feel.v <= 0.5) return "Tu portes quelque chose de lourd. Les feuilles ne retiennent pas. Ce rituel non plus."
  if (feel.v <= 1)   return "Il y a de la tension. Les feuilles la laissent passer. Ce rituel aussi."
  if (feel.v <= 1.5) return "Quelque chose t'occupe. Ce rituel t'aide à l'observer sans te perdre."
  if (feel.v <= 2)   return "Tu es dans un entre-deux. Les feuilles accueillent tout. Ce rituel aussi."
  if (feel.v <= 2.5) return "Tu es stable. C'est un bon moment pour observer ce qui circule."
  if (feel.v <= 3)   return "Il y a du calme. Ce rituel va l'approfondir en observant ce qui traverse."
  if (feel.v <= 3.5) return "Tu te sens plutôt serein·e. Ce rituel va laisser la lumière circuler."
  return "Tu rayonnes. Les feuilles transforment la lumière. Ce rituel aussi."
}

// ── WOFFeuillesSVG — J3 : tige J2 statique + zoom + feuilles qui poussent ───
function WOFFeuillesSVG() {
  const [zoom,         setZoom]         = useState(false)
  const [health,       setHealth]       = useState(32)   // exactement fin J2 — continuité
  const [sparkVisible, setSparkVisible] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    const t1 = setTimeout(() => setZoom(true), 2000)
    const t2 = setTimeout(() => {
      const audio = new Audio('/harpe.mp3')
      audio.volume = 0.65
      audioRef.current = audio
      audio.play().catch(() => {})
      setSparkVisible(true)
      setTimeout(() => setSparkVisible(false), 3000)
      const start = Date.now()
      let raf
      const tick = () => {
        const p = Math.min(1, (Date.now() - start) / 8000)  // 8s — croissance lente et visible
        setHealth(32 + 24 * p)   // 32% → 56% — 3 paires de feuilles + début bouton
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); audioRef.current?.pause() }
  }, [])

  const gs = { sunriseH: 7, sunriseM: 0, sunsetH: 20, sunsetM: 0, petalColor1: '#7aaa88', petalColor2: '#8abb96', petalShape: 'round' }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        transform: zoom ? 'scale(1.8)' : 'scale(1)',
        transformOrigin: '50% 45%',
        transition: zoom ? 'transform 4.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
      }}>
        <PlantSVG health={health} gardenSettings={gs} clearSky={true} lumensLevel="faible" celebrate={false} />

        {/* Scintillements sur les feuilles émergentes */}
        {sparkVisible && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" fill="none">
            <defs><style>{`@keyframes svgSpk{0%{opacity:0;transform:scale(0.3) rotate(0deg)}35%{opacity:1;transform:scale(1.15) rotate(20deg)}65%{opacity:0.6;transform:scale(0.9) rotate(35deg)}100%{opacity:0;transform:scale(0.3) rotate(60deg)}}@keyframes svgSpkR{0%{opacity:0;transform:scale(0)}30%{opacity:0.5}70%{opacity:0.1}100%{opacity:0;transform:scale(1.8)}}`}</style></defs>
            {sparkleAt(175, 148, 3, 'rgba(255,222,60,0.90)', 10, 7, 0.0)}
            {sparkleAt(225, 148, 3, 'rgba(255,222,60,0.90)',  9, 6, 0.3)}
            {sparkleAt(165, 135, 2, 'rgba(255,222,60,0.90)',  7, 5, 0.6)}
            {sparkleAt(235, 135, 2, 'rgba(255,222,60,0.90)',  7, 5, 0.9)}
            {sparkleAt(200, 125, 3, 'rgba(255,222,60,0.90)',  8, 6, 0.4)}
          </svg>
        )}
      </div>
    </div>
  )
}

function DayThreeRituelView({ onComplete, onBack, dayNumber = 3, answers }) {
  return (
    <DayWOFRituelView
      ritualData={J3_RITUAL_DATA} audioSrc="/audio/feuille.mp3" audioTitle="Observer ce qui traverse"
      g1={J3_G1} g2={J3_G2} glow={J3_GLOW} bg={J3_BG}
      GuidedFallback={FeuillesGuidedRituel}
      dayNumber={dayNumber} invitationText={j3InvitationText(answers)} darkAt={88}
      onComplete={onComplete} onBack={onBack}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4c. DayOneContentMenu — Jour 1 slide 3 : 6 portes d'exploration + terminer
// ─────────────────────────────────────────────────────────────────────────────

const J1_MENU_ITEMS = [
  { n: 1, label: 'Pourquoi les racines ?'              },
  { n: 2, label: 'Mes racines · mon ancrage'           },
  { n: 3, label: 'Mon rituel · ma fleur'               },
  { n: 4, label: 'Mon mantra racines'                  },
  { n: 5, label: 'Mon mandala · racines'               },
  { n: 6, label: "MP3 d'ancrage"                       },
]

function J1ItemModal({ item, dayColor, onClose }) {
  const C = dayColor || '#c8a0b0'
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,8,4,0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 200,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 0 0',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#faf5f2',
          borderRadius: '24px 24px 0 0',
          width: '100%',
          maxWidth: 560,
          maxHeight: '85dvh',
          overflowY: 'auto',
          padding: '28px 24px 48px',
          animation: 'stepIn 0.3s ease both',
          boxSizing: 'border-box',
        }}
      >
        {/* Poignée */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'rgba(180,130,100,0.25)',
          margin: '0 auto 24px',
        }} />

        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: '50%',
            background: C, color: '#fff',
            fontFamily: 'Jost, sans-serif', fontSize: 12, fontWeight: 600,
            flexShrink: 0,
          }}>
            {item.n}
          </span>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(20px, 5vw, 24px)',
            fontWeight: 600,
            color: '#1a0808',
            margin: 0,
            lineHeight: 1.25,
          }}>
            {item.label}
          </h2>
        </div>

        {/* Séparateur */}
        <div style={{ height: 1, background: `rgba(200,160,176,0.25)`, marginBottom: 24 }} />

        {/* Contenu — à personnaliser par item */}
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(17px, 4.5vw, 20px)',
          fontStyle: 'italic',
          color: '#5a3838',
          lineHeight: 1.75,
          margin: '0 0 32px',
        }}>
          {item.content || 'Contenu à venir…'}
        </p>

        {/* Bouton fermer */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: C,
            border: 'none',
            borderRadius: 100,
            padding: '14px 24px',
            fontFamily: 'Jost, sans-serif',
            fontSize: 14,
            fontWeight: 500,
            color: '#fff',
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  )
}

function DayOneContentMenu({ onComplete, onBack, dayColor }) {
  const C = dayColor || '#c8a0b0'
  const [openItem, setOpenItem] = useState(null)

  return (
    <div className="wof-in" style={{ padding: '12px 16px 40px' }}>
      <BackButton onClick={onBack} />

      {/* En-tête */}
      <div style={{ textAlign: 'center', margin: '4px 0 24px' }}>
        <p style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: C,
          margin: '0 0 8px',
        }}>
          Jour 1 · Racines
        </p>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(20px, 5vw, 26px)',
          fontWeight: 500,
          fontStyle: 'italic',
          color: '#1a0808',
          lineHeight: 1.3,
          margin: 0,
        }}>
          Explore ton espace du jour
        </h2>
      </div>

      {/* Grille responsive : 1 col mobile, 2 col desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 9,
        marginBottom: 20,
      }}>
        {openItem && (
          <J1ItemModal
            item={openItem}
            dayColor={C}
            onClose={() => setOpenItem(null)}
          />
        )}

        {J1_MENU_ITEMS.map(({ n, label }) => (
          <button
            key={n}
            onClick={() => setOpenItem(J1_MENU_ITEMS.find(i => i.n === n))}
            style={{
              background: '#fff',
              border: `1px solid rgba(200,160,176,0.28)`,
              borderRadius: 13,
              padding: '11px 14px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 1px 6px rgba(180,120,110,0.07)',
              transition: 'box-shadow 0.18s ease, border-color 0.18s ease',
              width: '100%',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow   = `0 4px 14px rgba(200,160,176,0.20)`
              e.currentTarget.style.borderColor = C
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow   = '0 1px 6px rgba(180,120,110,0.07)'
              e.currentTarget.style.borderColor = 'rgba(200,160,176,0.28)'
            }}
          >
            {/* Badge numéro */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: C,
              color: '#fff',
              fontFamily: 'Jost, sans-serif',
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
            }}>
              {n}
            </span>

            {/* Titre sur une ligne */}
            <span style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(15px, 4vw, 17px)',
              fontWeight: 500,
              color: '#2a1010',
              flex: 1,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}>
              {label}
            </span>

            {/* Flèche */}
            <span style={{ color: C, fontSize: 16, opacity: 0.55, flexShrink: 0 }}>›</span>
          </button>
        ))}
      </div>

      {/* CTA Terminer */}
      <button
        onClick={onComplete}
        className="wof-cta-pulse"
        style={{
          width: '100%',
          background: C,
          border: 'none',
          borderRadius: 100,
          padding: '16px 24px',
          fontFamily: 'Jost, sans-serif',
          fontSize: 15,
          fontWeight: 500,
          color: '#fff',
          cursor: 'pointer',
          letterSpacing: '0.05em',
          boxShadow: `0 8px 24px rgba(200,160,176,0.30)`,
        }}
      >
        Terminer pour aujourd'hui
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. DayShell — orchestre les 5 étapes d'un jour
// ─────────────────────────────────────────────────────────────────────────────

const STEP_THEMES = [
  'accueil et découverte de l\'intention du jour',
  'introspection et questionnement intérieur',
  'rituel et pratique de pleine conscience',
  'intégration et trace de ce qui vient d\'être vécu',
  'ouverture vers la suite du parcours',
]

function DayShell({ dayIndex, answers, completedDays, onDayComplete, onStepChange }) {
  const [step, setStep] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [showFleurModal, setShowFleurModal] = useState(false)
  const [showRitualVideo, setShowRitualVideo] = useState(false)
  const [screen, setScreen] = useState('accueil_intro')
  const [calendrierOnClose, setCalendrierOnClose] = useState(null)

  const dayConfig = WEEK_ONE_DATA[dayIndex]

  useEffect(() => {
    document.getElementById('wof-scroll').scrollTop = 0
  }, [step, animKey])


  function notifyScreen(screenId) {
    setScreen(screenId)
    onStepChange?.(screenId, screenId, dayConfig)
  }

  useEffect(() => {
    notifyScreen('accueil_intro')
  }, [])

  function advance() {
    const next = step + 1
    setStep(next)
    setAnimKey((k) => k + 1)
  }

  function goBack() {
    const skip = dayIndex !== 0 && dayConfig.accueil?.layout === 'slide1' && step === 2
    const prev = skip ? 0 : Math.max(0, step - 1)
    setStep(prev)
    setAnimKey((k) => k + 1)
  }

  function handleAnswer(answerKey, value) {
    onDayComplete({ type: 'answer', dayKey: `j${dayConfig.day}`, answerKey, value })
    advance()
  }

  function handleConditioningComplete(value) {
    onDayComplete({ type: 'answer', dayKey: `j${dayConfig.day}`, answerKey: 'conditioning_feel', value })
    advance()
  }

  function handleAnswerFromAccueil(answerKey, value) {
    onDayComplete({ type: 'answer', dayKey: `j${dayConfig.day}`, answerKey, value })
    if (dayIndex === 0) {
      setStep(1)
      setAnimKey((k) => k + 1)
      notifyScreen('contenu')
    } else {
      setStep(2)
      setAnimKey((k) => k + 1)
      notifyScreen('rituel_transition')
    }
  }

  function handleDayDone() {
    onDayComplete({ type: 'complete' })
  }

  const completedWithCurrent = completedDays.includes(dayConfig.day)
    ? completedDays
    : [...completedDays, dayConfig.day]

  const traceText = typeof dayConfig.getTrace === 'function' ? dayConfig.getTrace(answers, completedWithCurrent) : null

  return (
    <div key={animKey}>
      {showFleurModal && <MaFleurLiveModal onClose={() => setShowFleurModal(false)} />}
      {step === 0 && (
        <DayAccueil
          data={dayConfig.accueil}
          introspectionData={dayConfig.introspection}
          answers={answers}
          onAnswerFromAccueil={handleAnswerFromAccueil}
          onConditioningComplete={handleConditioningComplete}
          onNext={advance}
          onScreenChange={notifyScreen}
        />
      )}
      {/* ── Jour 1 : accueil → ressenti avant → rituel → ressenti après → delta ── */}
      {step === 1 && dayIndex === 0 && (
        <RessentiScreen
          phase="before"
          onAnswer={f => { onDayComplete({ type: 'answer', dayKey: 'j1', answerKey: 'feelBefore', value: f.key }); advance() }}
          onBack={goBack}
        />
      )}
      {step === 2 && dayIndex === 0 && (
        <DayOneRituelView
          onComplete={advance}
          onBack={goBack}
          dayNumber={dayConfig.day}
          answers={answers}
        />
      )}
      {step === 3 && dayIndex === 0 && (
        <RessentiScreen
          phase="after"
          onAnswer={f => { onDayComplete({ type: 'answer', dayKey: 'j1', answerKey: 'feelAfter', value: f.key }); advance() }}
          onBack={goBack}
        />
      )}
      {step === 4 && dayIndex === 0 && (
        <DeltaScreen
          answers={answers}
          onNext={advance}
        />
      )}
      {step === 5 && dayIndex === 0 && (
        <RacinesValidation
          answers={answers}
          onNext={() => {
            if (!localStorage.getItem('mji_calendrier_rituel_shown')) {
              setCalendrierOnClose(() => () => {
                localStorage.setItem('mji_calendrier_rituel_shown', '1')
                setCalendrierOnClose(null)
                advance()
              })
            } else { advance() }
          }}
          onBack={goBack}
          onScreenChange={notifyScreen}
          onCalendrier={() => setCalendrierOnClose(() => () => setCalendrierOnClose(null))}
        />
      )}
      {calendrierOnClose && createPortal(<RituelMieuxEtre onClose={calendrierOnClose} />, document.body)}
      {step === 6 && dayIndex === 0 && (
        <J1TeaserScreen onNext={handleDayDone} />
      )}

      {/* ── Jour 2 : même trame que J1, thème Tige ── */}
      {step === 1 && dayIndex === 1 && (
        <RessentiScreen phase="before"
          onAnswer={f => { onDayComplete({ type: 'answer', dayKey: 'j2', answerKey: 'feelBefore', value: f.key }); advance() }}
          onBack={goBack} />
      )}
      {step === 2 && dayIndex === 1 && (
        <DayTwoRituelView onComplete={advance} onBack={goBack} dayNumber={dayConfig.day} answers={answers} />
      )}
      {step === 3 && dayIndex === 1 && (
        <RessentiScreen phase="after"
          onAnswer={f => { onDayComplete({ type: 'answer', dayKey: 'j2', answerKey: 'feelAfter', value: f.key }); advance() }}
          onBack={goBack} />
      )}
      {step === 4 && dayIndex === 1 && (
        <DeltaScreen answers={{ ...answers, j1: answers?.j2 }} onNext={advance} />
      )}
      {step === 5 && dayIndex === 1 && (
        <TigeValidation onNext={advance} onBack={goBack} onScreenChange={notifyScreen} onCalendrier={() => setCalendrierOnClose(() => () => setCalendrierOnClose(null))} />
      )}
      {step === 6 && dayIndex === 1 && (
        <J2TeaserScreen onNext={handleDayDone} />
      )}

      {/* ── Jour 3 : même trame — Les Feuilles ── */}
      {step === 1 && dayIndex === 2 && (
        <RessentiScreen phase="before"
          onAnswer={f => { onDayComplete({ type: 'answer', dayKey: 'j3', answerKey: 'feelBefore', value: f.key }); advance() }}
          onBack={goBack} />
      )}
      {step === 2 && dayIndex === 2 && (
        <DayThreeRituelView onComplete={advance} onBack={goBack} dayNumber={dayConfig.day} answers={answers} />
      )}
      {step === 3 && dayIndex === 2 && (
        <RessentiScreen phase="after"
          onAnswer={f => { onDayComplete({ type: 'answer', dayKey: 'j3', answerKey: 'feelAfter', value: f.key }); advance() }}
          onBack={goBack} />
      )}
      {step === 4 && dayIndex === 2 && (
        <DeltaScreen answers={{ ...answers, j1: answers?.j3 }} onNext={advance} />
      )}
      {step === 5 && dayIndex === 2 && (
        <FeuillesValidation onNext={advance} onBack={goBack} onScreenChange={notifyScreen} onCalendrier={() => setCalendrierOnClose(() => () => setCalendrierOnClose(null))} />
      )}
      {step === 6 && dayIndex === 2 && (
        <J3TeaserScreen onNext={handleDayDone} />
      )}

      {/* ── Jour 4 : Les Fleurs ── */}
      {step === 1 && dayIndex === 3 && (
        <DayIntrospection
          data={{ ...dayConfig.introspection, autoAdvance: true }}
          onAnswer={(key, val) => { onDayComplete({ type: 'answer', dayKey: 'j4', answerKey: key, value: val }); advance() }}
          onBack={goBack}
          onScreenChange={notifyScreen}
        />
      )}
      {step === 2 && dayIndex === 3 && (
        <DayFourRituelView onComplete={advance} onBack={goBack} dayNumber={dayConfig.day} answers={answers} />
      )}
      {step === 3 && dayIndex === 3 && (
        <FleurValidation onNext={advance} onBack={goBack} onScreenChange={notifyScreen} onCalendrier={() => setCalendrierOnClose(() => () => setCalendrierOnClose(null))} />
      )}
      {step === 4 && dayIndex === 3 && (
        <J4TeaserScreen onNext={handleDayDone} />
      )}

      {/* ── Jour 5 : Le Souffle ── */}
      {step === 1 && dayIndex === 4 && (
        <DayIntrospection
          data={{ ...dayConfig.introspection, autoAdvance: true }}
          onAnswer={(key, val) => { onDayComplete({ type: 'answer', dayKey: 'j5', answerKey: key, value: val }); advance() }}
          onBack={goBack}
          onScreenChange={notifyScreen}
        />
      )}
      {step === 2 && dayIndex === 4 && (
        <DayFiveRituelView onComplete={advance} onBack={goBack} dayNumber={dayConfig.day} answers={answers} />
      )}
      {step === 3 && dayIndex === 4 && (
        <SouffleValidation onNext={advance} onBack={goBack} onScreenChange={notifyScreen} onCalendrier={() => setCalendrierOnClose(() => () => setCalendrierOnClose(null))} />
      )}
      {step === 4 && dayIndex === 4 && (
        <J5TeaserScreen onNext={handleDayDone} />
      )}

      {step === 1 && dayIndex > 4 && !dayConfig.rituelFirst && (
        <DayIntrospection
          data={dayConfig.introspection}
          onAnswer={handleAnswer}
          onBack={goBack}
          onScreenChange={notifyScreen}
        />
      )}
      {step === 1 && dayIndex > 4 && dayConfig.rituelFirst && (
        <DayRituel
          data={dayConfig.rituel}
          answers={answers}
          dayColor={dayConfig.color}
          onNext={advance}
          onBack={goBack}
          onScreenChange={notifyScreen}
        />
      )}
      {step === 2 && dayIndex > 4 && dayConfig.rituelFirst && (
        <DayIntrospection
          data={dayConfig.introspection}
          onAnswer={(key, val) => {
            onDayComplete({ type: 'answer', dayKey: `j${dayConfig.day}`, answerKey: key, value: val })
            if (dayConfig.isFinal) handleDayDone()
            else advance()
          }}
          onBack={goBack}
          onScreenChange={notifyScreen}
        />
      )}
      {step === 2 && dayIndex > 4 && !dayConfig.rituelFirst && showRitualVideo && (
        <RitualVideoSlide
          src={dayConfig.videoAfterRitual}
          onContinue={advance}
        />
      )}
      {step === 2 && dayIndex > 4 && !dayConfig.rituelFirst && !showRitualVideo && (
        <DayRituel
          data={dayConfig.rituel}
          answers={answers}
          dayColor={dayConfig.color}
          onNext={() => {
            if (dayConfig.videoAfterRitual) {
              setShowRitualVideo(true)
            } else if (dayConfig.isFinal) {
              handleDayDone()
            } else {
              advance()
            }
          }}
          onBack={goBack}
          onScreenChange={notifyScreen}
        />
      )}
      {step === 3 && dayIndex > 4 && dayConfig.guidedValidation && (
        <RacinesValidation
          answers={answers}
          onNext={handleDayDone}
          onBack={goBack}
          onScreenChange={notifyScreen}
        />
      )}
      {step === 3 && dayIndex > 4 && !dayConfig.guidedValidation && dayConfig.traceSlides && dayConfig.typewriterTrace && (
        <TypewriterSlides
          slides={typeof dayConfig.traceSlides === 'function' ? dayConfig.traceSlides(answers) : dayConfig.traceSlides}
          typewriterFrom={dayConfig.traceTypewriterFrom ?? 0}
          ctaLabel="Continuer"
          onNext={advance}
          onScreenChange={notifyScreen}
          screenName={dayConfig.traceName ?? 'trace'}
        />
      )}
      {step === 3 && dayIndex > 4 && !dayConfig.guidedValidation && dayConfig.traceSlides && !dayConfig.typewriterTrace && (
        <MultiPhaseOuverture
          slides={typeof dayConfig.traceSlides === 'function' ? dayConfig.traceSlides(answers) : dayConfig.traceSlides}
          ctaLabel="Continuer"
          onNext={advance}
          onScreenChange={notifyScreen}
          screenName={dayConfig.traceName ?? 'trace'}
        />
      )}
      {step === 3 && dayIndex > 4 && !dayConfig.guidedValidation && !dayConfig.traceSlides && (
        <DayTrace
          text={traceText}
          onNext={advance}
          onBack={goBack}
          onFleur={undefined}
          onScreenChange={notifyScreen}
        />
      )}
      {step === 4 && dayIndex > 4 && dayConfig.ouvertureSlides && (
        <MultiPhaseOuverture
          slides={dayConfig.ouvertureSlides}
          ctaLabel={dayConfig.finalCTA}
          onNext={handleDayDone}
          onScreenChange={notifyScreen}
        />
      )}
      {step === 4 && dayIndex > 4 && !dayConfig.ouvertureSlides && (
        <DayOuverture
          text={dayConfig.ouverture}
          isFinal={!!dayConfig.isFinal}
          ctaLabel={dayConfig.finalCTA}
          onNext={handleDayDone}
          onBack={goBack}
          onScreenChange={notifyScreen}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. GardenDashboard — tableau de bord "Ma Fleur"
// ─────────────────────────────────────────────────────────────────────────────

const ZONE_DAYS = [
  { day: 1, zone: 'racines',  zoneId: 'roots',   emoji: '🌱', label: 'Racines',  desc: 'Une base qui se stabilise',    color: ZONE_COLORS.racines  },
  { day: 2, zone: 'tige',     zoneId: 'stem',    emoji: '🌿', label: 'Tige',     desc: 'Ce qui te tient debout',     color: ZONE_COLORS.tige     },
  { day: 3, zone: 'feuilles', zoneId: 'leaves',  emoji: '🍃', label: 'Feuilles', desc: 'Ce qui circule en toi',       color: ZONE_COLORS.feuilles },
  { day: 4, zone: 'fleurs',   zoneId: 'flowers', emoji: '🌸', label: 'Fleurs',   desc: "Ce qui s'ouvre",               color: ZONE_COLORS.fleurs   },
  { day: 5, zone: 'souffle',  zoneId: 'breath',  emoji: '🌬️', label: 'Souffle',  desc: 'Ce qui relie tout',            color: ZONE_COLORS.souffle  },
  { day: 6, zone: null,       zoneId: null,      emoji: '✨', label: 'Ta fleur', desc: 'La naissance',         color: '#b8a090'            },
  { day: 7, zone: null,       zoneId: null,      emoji: '🌻', label: 'Le jardin ensemble',   desc: 'La communauté',       color: '#a09080'            },
]

// ── FleurDiscoveryModal — présentation fleur jour 6 ──────────────────────────
function FleurDiscoveryModal({ onClose, initialPetalColor1, initialPetalColor2, initialPetalShape }) {
  const { user } = useAuth()
  const userId   = user?.id
  const [plantData, setPlantData] = useState(null)
  const [settings,  setSettings]  = useState(null)
  const [phase,     setPhase]     = useState(0)

  const ZONE_KEYS_DISC = [
    { key: 'zone_racines',  label: 'Racines',  emoji: '🌱', color: ZONE_COLORS.racines  },
    { key: 'zone_tige',     label: 'Tige',     emoji: '🌿', color: ZONE_COLORS.tige     },
    { key: 'zone_feuilles', label: 'Feuilles', emoji: '🍃', color: ZONE_COLORS.feuilles },
    { key: 'zone_fleurs',   label: 'Fleurs',   emoji: '🌸', color: ZONE_COLORS.fleurs   },
    { key: 'zone_souffle',  label: 'Souffle',  emoji: '🌬️', color: ZONE_COLORS.souffle  },
  ]

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => setPhase(3), 1400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      try {
        const [plantRes, settingsRes, profileRes] = await Promise.allSettled([
          supabase.from('plants')
            .select('health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
            .eq('user_id', userId).order('date', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('garden_settings')
            .select('petal_color1, petal_color2, petal_shape')
            .eq('user_id', userId).maybeSingle(),
          supabase.from('profiles')
            .select('week_one_data')
            .eq('id', userId).maybeSingle(),
        ])
        let plant      = plantRes.status    === 'fulfilled' ? (plantRes.value.data    ?? null) : null
        const profile0 = profileRes.status  === 'fulfilled' ? (profileRes.value.data  ?? null) : null
        const completed = profile0?.week_one_data?.completedDays ?? []
        if (completed.length > 0) {
          const DAY_ZONE = { 1: 'zone_racines', 2: 'zone_tige', 3: 'zone_feuilles', 4: 'zone_fleurs', 5: 'zone_souffle' }
          const DAY_MIN  = { 1: 40, 2: 48, 3: 55, 4: 60, 5: 65 }
          const base = plant ?? { zone_racines: 0, zone_tige: 0, zone_feuilles: 0, zone_fleurs: 0, zone_souffle: 0 }
          const zones = {
            zone_racines:  base.zone_racines  ?? 0,
            zone_tige:     base.zone_tige     ?? 0,
            zone_feuilles: base.zone_feuilles ?? 0,
            zone_fleurs:   base.zone_fleurs   ?? 0,
            zone_souffle:  base.zone_souffle  ?? 0,
          }
          completed.forEach(d => {
            const key = DAY_ZONE[d]
            const min = DAY_MIN[d] ?? 35
            if (key) zones[key] = Math.min(100, Math.max(zones[key], min))
            if (d === 7) Object.keys(zones).forEach(k => { zones[k] = Math.min(100, Math.max(zones[k], 75)) })
          })
          // FleurDiscoveryModal accessible depuis J6+ → garantir 65% min sur toutes les zones
          if (!completed.includes(7)) {
            Object.keys(zones).forEach(k => { zones[k] = Math.min(100, Math.max(zones[k], 65)) })
          }
          const newHealth = Math.round(Object.values(zones).reduce((a, b) => a + b, 0) / 5)
          if (newHealth > (plant?.health ?? 0)) {
            plant = { ...zones, health: newHealth }
          }
        }
        setPlantData(plant)
        setSettings(settingsRes.status === 'fulfilled' ? (settingsRes.value.data ?? null) : null)
      } catch (_) {}
    })()
  }, [userId])

  const health = plantData?.health ?? 65
  const fresh  = _freshGardenSettings
  const gardenSettings = {
    ...DEFAULT_GARDEN_SETTINGS,
    petalColor1: settings?.petal_color1 ?? fresh?.petal_color1 ?? initialPetalColor1 ?? DEFAULT_GARDEN_SETTINGS.petalColor1,
    petalColor2: settings?.petal_color2 ?? fresh?.petal_color2 ?? initialPetalColor2 ?? DEFAULT_GARDEN_SETTINGS.petalColor2,
    petalShape:  settings?.petal_shape  ?? fresh?.petal_shape  ?? initialPetalShape  ?? DEFAULT_GARDEN_SETTINGS.petalShape,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(10,8,6,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 400, maxHeight: '90vh',
        background: 'linear-gradient(160deg, #faf5f0, #f0ebe4)',
        borderRadius: 24, overflow: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        padding: '24px 20px 32px',
        WebkitBackdropFilter: 'none', backdropFilter: 'none',
      }}>
        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: 20, ...fadeIn(phase >= 1) }}>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#000000', WebkitTextFillColor: '#000000', margin: '0 0 6px', background: 'none' }}>
            Ta fleur intérieure
          </p>
          <h2 style={{ fontFamily: 'Jost, sans-serif', fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 700, color: '#000000', WebkitTextFillColor: '#000000', lineHeight: 1.25, margin: 0, background: 'none', backgroundClip: 'unset', WebkitBackgroundClip: 'unset' }}>
            Elle reflète ce que tu as cultivé pendant 7 jours
          </h2>
        </div>

        {/* Carte fleur fond sombre */}
        <div style={{
          borderRadius: 18, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(10,22,40,0.3)',
          background: 'linear-gradient(180deg, #0a1628 0%, #0d1f10 100%)',
          position: 'relative', marginBottom: 16,
          ...fadeIn(phase >= 2),
        }}>
          <PlantSVG health={health} gardenSettings={gardenSettings} lumensLevel="moyen" lumensTotal={0} compact={true} clearSky={true} />
          <div style={{
            position: 'absolute', bottom: 12, right: 12,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            borderRadius: 10, padding: '7px 11px',
            border: '1px solid rgba(124,184,124,0.35)',
          }}>
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 8, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(124,184,124,0.8)', marginBottom: 2 }}>Vitalité</span>
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 20, fontWeight: 700, color: '#7cb87c', lineHeight: 1 }}>{health}%</span>
          </div>
        </div>

        {/* Phrase */}
        <p style={{ ...fadeIn(phase >= 2), fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 600, color: '#1a1208', lineHeight: 1.6, textAlign: 'center', margin: '0 0 24px' }}>
          Chaque rituel nourrit une partie de toi — et fait évoluer ta fleur.
        </p>

        {/* Bouton fermer */}
        <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= 2) }}>
          <button
            onClick={onClose}
            style={{
              fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 600,
              color: '#fff', background: 'linear-gradient(135deg, #8878a8, #a890c8)',
              border: 'none', borderRadius: 100, padding: '14px 40px',
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(136,120,168,0.35)',
              letterSpacing: '0.04em',
            }}
          >
            J'ai compris →
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PATCH A — dans WeekOneFlow (composant principal, ~ligne 6129)
// Ajouter onReplayDay au GardenDashboard
//
// Remplacer :
//   onContinue={() => setView('day')}
// Par :
//   onContinue={() => setView('day')}
//   onReplayDay={(day) => {
//     setWeekData(d => ({ ...d, currentDay: day }))
//     setView('day')
//   }}
// ═══════════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════════════
// PATCH B — remplacer GardenDashboard (lignes 5028–5370)
// Ajout prop onReplayDay + bouton "Revoir" sur chaque carte accomplie
// ═══════════════════════════════════════════════════════════════════════════

const _isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const _isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

function InstallModal({ onClose, onInstalled }) {
  const [done, setDone] = useState(false)

  async function handleInstall() {
    const prompt = window._installPrompt
    if (prompt) {
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') { onInstalled?.(); setDone(true); return }
    }
    setDone(true)
  }

  if (done) return (
    <div style={{ position:'fixed', inset:0, zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 20px' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.45)', backdropFilter:'blur(8px)' }} onClick={onClose} />
      <div style={{ position:'relative', background:'linear-gradient(160deg,#f4ede4,#ece3d6)', borderRadius:24, padding:'32px 24px', maxWidth:360, width:'100%', textAlign:'center', border:'1px solid rgba(200,180,140,.35)', boxShadow:'0 32px 80px rgba(0,0,0,.25)', fontFamily:"'Jost',sans-serif" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🌱</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:400, color:'#2a1e0a', marginBottom:8 }}>Votre jardin est installé !</div>
        <p style={{ fontSize:12, fontWeight:300, color:'rgba(60,40,10,.60)', lineHeight:1.7, marginBottom:20 }}>Retrouvez-le depuis votre écran d'accueil, chaque jour.</p>
        <button onClick={onClose} style={{ width:'100%', padding:'13px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#78c040,#4a8820)', color:'#fff', fontSize:14, fontWeight:500, cursor:'pointer' }}>✨ Continuer</button>
      </div>
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.45)', backdropFilter:'blur(8px)' }} onClick={onClose} />
      <div style={{ position:'relative', width:'100%', maxWidth:480, background:'linear-gradient(170deg,#f4ede4,#ece3d6)', borderRadius:'24px 24px 0 0', padding:'8px 24px calc(28px + env(safe-area-inset-bottom, 0px))', border:'1px solid rgba(200,180,140,.30)', borderBottom:'none', boxShadow:'0 -16px 60px rgba(0,0,0,.20)', fontFamily:"'Jost',sans-serif" }}>
        <div style={{ width:32, height:3, borderRadius:100, background:'rgba(60,40,10,.15)', margin:'12px auto 20px' }} />

        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
          <div style={{ width:48, height:48, borderRadius:13, background:'linear-gradient(135deg,#78c040,#4a8820)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>📲</div>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:400, color:'#2a1e0a', lineHeight:1.15 }}>Installer l'application</div>
            <div style={{ fontSize:11, color:'rgba(60,40,10,.50)', marginTop:3 }}>Accès rapide depuis votre écran d'accueil</div>
          </div>
        </div>

        {_isIOS ? (
          <div style={{ background:'rgba(60,40,10,.05)', border:'1px solid rgba(60,40,10,.10)', borderRadius:14, padding:'14px 16px', marginBottom:18, display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { n:1, text: <>Appuyez sur <strong>Partager</strong> ⎙ en bas de Safari</> },
              { n:2, text: <>Choisissez <strong>"Sur l'écran d'accueil"</strong></> },
              { n:3, text: <>Appuyez sur <strong>"Ajouter"</strong></> },
            ].map(({ n, text }) => (
              <div key={n} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(90,154,40,.15)', border:'1px solid rgba(90,154,40,.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:600, color:'#4a8820', flexShrink:0 }}>{n}</div>
                <span style={{ fontSize:13, fontWeight:300, color:'rgba(40,28,10,.72)', lineHeight:1.55 }}>{text}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:18 }}>
            {[['🌱','Accès instantané','Sans navigateur, en un geste'],['🔔','Rappels doux','Rituels quotidiens à votre rythme'],['✨','Toujours avec vous','Votre espace intérieur, partout']].map(([icon, title, desc]) => (
              <div key={title} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 12px', background:'rgba(60,40,10,.05)', border:'1px solid rgba(60,40,10,.09)', borderRadius:11 }}>
                <span style={{ fontSize:18, width:34, height:34, borderRadius:9, background:'rgba(90,154,40,.12)', border:'1px solid rgba(90,154,40,.20)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#2a1e0a' }}>{title}</div>
                  <div style={{ fontSize:11, fontWeight:300, color:'rgba(40,28,10,.55)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!_isIOS && (
          <button onClick={handleInstall} style={{ width:'100%', padding:'14px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#78c040,#4a8820)', color:'#fff', fontSize:14, fontWeight:500, cursor:'pointer', marginBottom:8 }}>
            🌿 Installer l'application
          </button>
        )}
        <button onClick={onClose} style={{ width:'100%', padding:'11px', borderRadius:14, border:'none', background:'transparent', color:'rgba(60,40,10,.38)', fontSize:12, cursor:'pointer' }}>
          {_isIOS ? 'Fermer' : 'Plus tard'}
        </button>
      </div>
    </div>
  )
}

function GardenDashboard({ completedDays: completedDaysProp, completionDates = {}, onContinue, onOpenZone, onClose, onSignOut, petalColor1, petalColor2, plantHealth, isPro, onOpenProProfile, onReplayDay }) {
  const completedDays = completedDaysProp ?? []
  const [showFleurModal,   setShowFleurModal]   = useState(false)
  const [showRituelHint,   setShowRituelHint]   = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [installed,        setInstalled]        = useState(false)

  useEffect(() => {
    const handler = () => setInstalled(true)
    window.addEventListener('appinstalled', handler)
    return () => window.removeEventListener('appinstalled', handler)
  }, [])

  const completedZones = ZONE_DAYS
    .filter(z => completedDays.includes(z.day) && z.zone)
    .map(z => z.zone)

  const today         = new Date().toISOString().split('T')[0]
  const lastCompleted = Math.max(...completedDays, 0)
  const nextDay       = Math.min(lastCompleted + 1, 7)

  const daysWithRituels = ZONE_DAYS.filter(z => completedDays.includes(z.day) && z.zoneId)
  const hintTargetDay   = daysWithRituels.length > 0
    ? daysWithRituels[daysWithRituels.length - 1].day
    : null

  useEffect(() => {
    if (daysWithRituels.length === 0) return
    const t = setTimeout(() => setShowRituelHint(true), 3000)
    return () => clearTimeout(t)
  }, [])

  function isUnlocked(day) {
    if (day === 1) return true
    const prevDate = completionDates[day - 1]
    if (!prevDate) return false
    return today > prevDate
  }

  return (
    <div style={{ padding: '32px 24px 80px', maxWidth: 480, margin: '0 auto', minHeight: '100%', background: 'linear-gradient(160deg, #0d2818, #071510)' }}>
      <style>{`
        @keyframes hintPulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.55); }
          50%  { box-shadow: 0 0 0 6px rgba(255,255,255,0.10); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.00); }
        }
        .garden-card-pulse { animation: hintPulse 1.6s ease-in-out infinite; }
      `}</style>

      {showFleurModal && <FleurDiscoveryModal onClose={() => setShowFleurModal(false)} initialPetalColor1={petalColor1} initialPetalColor2={petalColor2} />}

      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: 40, background: 'rgba(0,0,0,0.22)', borderRadius: 16, padding: '20px 16px 12px', backdropFilter: 'blur(2px)' }}>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 'clamp(11px, 2.8vw, 13px)', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ffe8c0', margin: '0 0 8px', textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
          Ce qui prend forme
        </p>
        <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: 700, fontStyle: 'italic', color: '#ffffff', lineHeight: 1.15, margin: '0 0 10px' }}>
          Ma Fleur
        </h2>
        <div style={{ width: 48, height: 2, background: 'linear-gradient(to right, transparent, #b87c5a, transparent)', margin: '0 auto 20px' }} />
        <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(22px, 5.5vw, 28px)', fontWeight: 500, color: '#ffffff', margin: '0 0 14px', lineHeight: 1.5 }}>
          Ce que tu as commencé… continue de grandir.
        </p>
        <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(20px, 5vw, 25px)', fontWeight: 400, color: '#ffffff', margin: '0 0 12px', lineHeight: 1.5 }}>
          Ta fleur se révèle.
        </p>
        <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'normal', fontSize: 'clamp(16px, 4vw, 19px)', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.65 }}>
          Chaque jour, une partie s'éveille. Chaque zone a un rôle pour toi.
        </p>
      </div>

      {/* Fleur mosaïque */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40, gap: 20 }}>
        <FlowerMosaic completedZones={completedZones} size={248} petalColor1={petalColor1} petalColor2={petalColor2} />
        {completedZones.length >= 5 && (() => {
          const h = plantHealth ?? 30
          const phrase =
            h < 40 ? { text: 'Ta fleur vient de naître. Chaque jour qui passe l\'ancre un peu plus.', sub: 'Continuez, prendre soin d\'elle c\'est prendre soin de vous.' } :
            h < 55 ? { text: 'Ta fleur prend racine. On sent qu\'elle cherche la lumière.', sub: 'Les rituels l\'aident à grandir.' } :
            h < 65 ? { text: 'Ta fleur est en bouton. L\'éclosion est toute proche.', sub: 'Encore quelques soins et elle s\'ouvrira pleinement.' } :
            h < 78 ? { text: 'Ta fleur s\'épanouit. Elle reflète ta constance.', sub: 'Vous prenez soin d\'elle avec régularité.' } :
            h < 90 ? { text: 'Ta fleur rayonne. Elle est le reflet de ton engagement.', sub: 'Continuez — elle le ressent.' } :
                     { text: 'Ta fleur est en pleine éclosion.', sub: 'Elle reflète toute la vitalité que tu lui as offerte.' }
          return (
            <div style={{ textAlign: 'center', maxWidth: 260, animation: 'softRise 900ms 1.6s cubic-bezier(0.25,0.46,0.45,0.94) both', opacity: 0, animationFillMode: 'forwards' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(20px, 5vw, 25px)', fontWeight: 500, color: '#ffffff', margin: '0 0 8px', lineHeight: 1.5 }}>{phrase.text}</p>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.80)', margin: 0, letterSpacing: '0.03em' }}>{phrase.sub}</p>
            </div>
          )
        })()}
      </div>

      {/* Cartes zones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ZONE_DAYS.map((z, i) => {
          const done         = completedDays.includes(z.day)
          const unlocked     = isUnlocked(z.day)
          const isCurrent    = z.day === nextDay && unlocked && !done
          const locked       = !done && !isCurrent
          const isHintTarget = showRituelHint && z.day === hintTargetDay

          // Clic sur la carte : ouvre les rituels si disponibles, sinon continue
          const clickable = done && z.zoneId ? () => onOpenZone(z.zoneId)
                          : isCurrent        ? onContinue
                          : undefined

          return (
            <div key={z.day}>
              {/* Carte principale */}
              <div
                onClick={clickable}
                className={`garden-day-card${isHintTarget ? ' garden-card-pulse' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 18px',
                  borderRadius: isHintTarget ? '14px 14px 0 0' : 14,
                  background: done ? 'rgba(20,10,5,0.58)' : isCurrent ? 'rgba(20,10,5,0.72)' : 'rgba(20,10,5,0.35)',
                  border: done
                    ? `1.5px solid ${z.color}88`
                    : isCurrent
                      ? `1.5px solid ${z.color}`
                      : '1.5px solid rgba(255,220,150,0.15)',
                  borderBottom: isHintTarget ? 'none' : undefined,
                  boxShadow: isCurrent ? `0 4px 20px ${z.color}44` : 'none',
                  cursor: clickable ? 'pointer' : 'default',
                  filter: locked ? 'blur(1.5px)' : 'none',
                  opacity: locked ? 0.5 : 1,
                  transition: 'all 0.3s ease',
                  animation: `softRise 600ms ${i * 80}ms cubic-bezier(0.25,0.46,0.45,0.94) both`,
                }}
              >
                {/* Emoji */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: done ? `${z.color}22` : isCurrent ? `${z.color}18` : 'rgba(200,180,170,0.15)',
                  border: `1.5px solid ${done || isCurrent ? z.color + '55' : 'rgba(180,140,120,0.18)'}`,
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, opacity: locked ? 0.4 : 1,
                }}>
                  {z.emoji}
                </div>

                {/* Texte */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600, fontSize: 'clamp(13px, 3.2vw, 15px)', color: '#ffffff', margin: '0 0 3px', letterSpacing: '0.02em' }}>
                    Jour {z.day} — {z.label}
                  </p>
                  <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(13px, 3vw, 15px)', color: 'rgba(255,255,255,0.70)', margin: 0 }}>
                    {z.desc}
                  </p>
                </div>

                {/* Badge statut + bouton Revoir */}
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
  {done && z.day === 6 && (
    <button
      onClick={e => { e.stopPropagation(); setShowFleurModal(true) }}
      style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#fff', background: 'linear-gradient(135deg, #8878a8, #a890c8)', border: 'none', borderRadius: 100, padding: '6px 14px', cursor: 'pointer', boxShadow: '0 3px 12px rgba(136,120,168,0.35)' }}
    >
      🌸 Je découvre ma fleur
    </button>
  )}

  {done && z.day !== 6 && (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      <span className="badge-accompli" style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1010', background: 'rgba(255,255,255,0.85)', border: `1px solid ${z.color}88`, borderRadius: 100, padding: '3px 10px' }}>
        accompli
      </span>
      <button
  className="btn-revoir"
  onClick={e => { e.stopPropagation(); onReplayDay?.(z.day) }}
  style={{ 
    fontFamily: 'Jost, sans-serif', 
    fontSize: 11, 
    fontWeight: 700, 
    letterSpacing: '0.1em', 
    textTransform: 'uppercase', 
    color: '#1a1010', 
    WebkitTextFillColor: '#1a1010',
    background: 'rgba(255,255,255,0.85)', 
    border: `1px solid ${z.color}88`, 
    borderRadius: 100, 
    padding: '3px 10px', 
    cursor: 'pointer' 
  }}
>
  Revoir
</button>
    </div>
  )}

  {z.zoneId && done && (
    <span style={{
      fontFamily: 'Jost, sans-serif',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#7ecb8f',
      background: 'rgba(126,203,143,0.12)',
      border: '1px solid rgba(126,203,143,0.45)',
      borderRadius: 100,
      padding: '3px 10px',
      cursor: 'pointer',
    }}>
      Voir les rituels →
    </span>
  )}

  {isCurrent && (
    <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', background: z.color, borderRadius: 100, padding: '3px 10px' }}>
      À vivre aujourd'hui
    </span>
  )}

  {locked && (
    <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 16, color: '#b8a090' }}>🔒</span>
  )}
</div>
</div>

              {/* Popup hint rituels — collé sous la carte cible */}
              {isHintTarget && (
                <div style={{
                  background: '#ffffff',
                  border: `1.5px solid ${z.color}55`,
                  borderTop: 'none',
                  borderRadius: '0 0 14px 14px',
                  padding: '12px 16px 14px',
                  animation: 'softRise 400ms cubic-bezier(0.25,0.46,0.45,0.94) both',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>✨</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, fontWeight: 600, color: '#1a1010', margin: '0 0 2px', lineHeight: 1.4 }}>
                      Tu peux aller plus loin.
                    </p>
                    <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 400, color: 'rgba(30,20,10,0.60)', margin: 0, lineHeight: 1.5 }}>
                      Appuyez sur <strong style={{ color: '#1a1010' }}>Voir les rituels →</strong> ci-dessus pour découvrir les exercices de cette zone.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRituelHint(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(30,20,10,0.30)', fontSize: 16, lineHeight: 1, padding: 4, flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bouton fermeture + installation */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
          <button
            onClick={onClose}
            style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(16px, 4vw, 19px)', color: '#1a1010', background: 'rgba(255,255,255,0.90)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 100, padding: '11px 32px', cursor: 'pointer', letterSpacing: '0.04em', transition: 'all 0.2s ease', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
          >
            {lastCompleted >= 7 ? 'À très bientôt' : 'À demain'}
          </button>
          {!_isStandalone && !installed && (
            <button
              onClick={() => setShowInstallModal(true)}
              style={{ fontFamily: 'Jost, sans-serif', fontSize: 'clamp(13px, 3.5vw, 15px)', color: '#fff', background: 'linear-gradient(135deg,#c8a040,#a07820)', border: 'none', borderRadius: 100, padding: '11px 22px', cursor: 'pointer', letterSpacing: '0.03em', boxShadow: '0 2px 12px rgba(180,140,40,0.35)', display:'flex', alignItems:'center', gap:7 }}
            >
              📲 Installer l'appli
            </button>
          )}
        </div>
        {onSignOut && (
          <div style={{ marginTop: 20 }}>
            <button
              onClick={onSignOut}
              style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, fontWeight: 400, color: 'rgba(120,80,60,0.45)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em', padding: '4px 8px' }}
            >
              ⎋ Se déconnecter
            </button>
          </div>
        )}
      </div>
      {showInstallModal && <InstallModal onClose={() => setShowInstallModal(false)} onInstalled={() => { setInstalled(true); setShowInstallModal(false) }} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. WeekOneFlow — export principal
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_WEEK_DATA = {
  currentDay:      1,
  completedDays:   [],
  completionDates: {}, // { [dayNum]: 'YYYY-MM-DD' }
  answers:         {},
  startDate:       new Date().toISOString().split('T')[0],
}

// Réponses fictives pour le mode test (?test-day=N)
const TEST_ANSWERS = {
  j1: { feel: 'neutre'       },
  j2: { energy: 'basse'      },
  j3: { space: 'pensees'     },
  j4: { need: 'douceur'      },
  j5: { connection: 'un_peu' },
  j6: { stress: 'legere_moins' },
}

const LUTIN_SLOTS = ['right', 'left']


// ─────────────────────────────────────────────────────────────────────────────
// Voile de transition avant le MP4 WeekOne
// ─────────────────────────────────────────────────────────────────────────────
function WelcomeVeil({ onDone, isReturn = false }) {
  const ambiance = useAmbiance()
  const videoRef = useRef(null)
  const readyFired = useRef(false)
  const [muted,      setMuted]      = useState(true)
  const [ctaVisible, setCtaVisible] = useState(false)
  const [showVideo,  setShowVideo]  = useState(false)
  const [showEndText, setShowEndText] = useState(false)

  function handleSound() {
    const v = videoRef.current
    if (!v) return
    setMuted(false)
    v.muted = false
    v.currentTime = 0
    v.play()
  }

  function handleTimeUpdate() {
    if (ambiance !== 'zen') return
    const v = videoRef.current
    if (!v || !v.duration) return
    if (v.duration - v.currentTime <= 5) setShowEndText(true)
  }

  function handleVideoReady() {
    if (readyFired.current) return
    readyFired.current = true
    // Délai de 3s après le chargement avant de passer à la vidéo
    setTimeout(() => setShowVideo(true), 3000)
  }

  useEffect(() => {
    // Filet de sécurité : sur iPhone, l'autoplay peut être bloqué (mode économie de données…)
    // et la vidéo ne déclenche jamais loadeddata/canplaythrough. On débloque l'écran après 8s.
    const t = setTimeout(() => {
      setShowVideo(true)
      setCtaVisible(true)
    }, 8000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!showVideo) return
    // Certains navigateurs mobiles n'enclenchent pas l'autoplay tant que la vidéo est masquée (opacity 0)
    videoRef.current?.play().catch(() => {})
  }, [showVideo])

  const overlayVisible = showVideo

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, background: '#0c1a0a' }}>

      {/* Barrière — plein écran, objectFit contain */}
      <img
        src={ambianceAsset('/barriere.png', ambiance)}
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'contain', objectPosition: 'center',
          opacity: showVideo ? 0 : 1,
          transition: 'opacity 1.2s ease',
        }}
      />

      {/* Texte overlay — visible avec l'image */}
      <div style={{
        position: 'absolute', bottom: '6%', left: 0, right: 0,
        textAlign: 'center', padding: '0 24px',
        opacity: showVideo ? 0 : 1,
        transition: 'opacity 1.2s ease',
        pointerEvents: 'none',
      }}>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: ambiance === 'zen' ? 'clamp(30px, 9vw, 48px)' : 'clamp(24px, 7vw, 38px)',
          fontStyle: 'italic', fontWeight: ambiance === 'zen' ? 700 : 300,
          color: 'rgba(255,255,255,0.92)',
          lineHeight: 1.4, margin: 0,
          textShadow: '0 2px 16px rgba(0,0,0,0.7)',
          display: 'inline-block',
          background: ambiance === 'zen' ? 'rgba(0,0,0,0.42)' : 'transparent',
          borderRadius: ambiance === 'zen' ? 16 : 0,
          padding: ambiance === 'zen' ? '10px 22px' : 0,
        }}>
          {ambiance === 'zen' ? <>Ouvrons ensemble<br />cette petite barrière</> : 'Ouvrons ensemble cette petite barrière'}
        </p>
      </div>

      {/* Vidéo — plein écran mobile, centrée sur desktop */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: showVideo ? 1 : 0,
        transition: 'opacity 1.2s ease',
      }}>
        <video
          ref={videoRef}
          src={ambianceAsset('/video/cheminjours.mp4', ambiance)}
          autoPlay playsInline muted
          preload="auto"
          className="wveil-video"
          onLoadedData={handleVideoReady}
          onCanPlayThrough={handleVideoReady}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setCtaVisible(true)}
          onError={onDone}
        />
      </div>

      {/* Texte de fin de vidéo — uniquement ambiance zen, 5 dernières secondes */}
      <div style={{
        position: 'absolute', bottom: 130, left: 0, right: 0, zIndex: 2,
        textAlign: 'center', padding: '0 24px',
        opacity: showEndText ? 1 : 0,
        transition: 'opacity 1s ease',
        pointerEvents: 'none',
      }}>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 48,
          fontStyle: 'italic', fontWeight: 700,
          color: 'rgba(255,255,255,0.95)',
          margin: 0,
          textShadow: '0 2px 16px rgba(0,0,0,0.7)',
          display: 'inline-block',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 16,
          padding: '10px 22px',
        }}>
          Un pas à la fois…
        </p>
      </div>

      {/* Overlay bas — son + bouton CTA */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1,
        padding: '80px 24px 40px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.60) 0%, transparent 100%)',
        display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center',
        opacity: overlayVisible ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}>
        {!ctaVisible && (
          <button onClick={handleSound} style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.45)',
            backdropFilter: 'blur(6px)', cursor: 'pointer', fontSize: 22, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            {muted ? '🔇' : '🔊'}
          </button>
        )}
        <div style={{
          width: '100%', maxWidth: 400,
          opacity: ctaVisible ? 1 : 0,
          transform: ctaVisible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 600ms ease, transform 600ms ease',
          pointerEvents: ctaVisible ? 'auto' : 'none',
        }}>
          <button onClick={onDone} className={ctaVisible ? 'wof-cta-pulse' : ''} style={{
            width: '100%', fontFamily: 'Jost, sans-serif',
            fontSize: 15, fontWeight: 500, letterSpacing: '0.04em', color: '#fff',
            background: 'linear-gradient(135deg, #a8c098, #7a9870)',
            border: 'none', borderRadius: 50, padding: '14px 24px', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(122,152,112,0.4)',
          }}>
            {isReturn ? 'Continuer →' : 'Commencer mon premier jour →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Écran d'accueil WeekOne — vidéo + bouton démarrer
// ─────────────────────────────────────────────────────────────────────────────
function RitualVideoSlide({ src, onContinue }) {
  const [muted,      setMuted]      = useState(true)
  const [ctaVisible, setCtaVisible] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setCtaVisible(true), 2000)
    return () => clearTimeout(t)
  }, [])

  function handleSound() {
    setMuted(false)
    if (videoRef.current) {
      videoRef.current.muted = false
      videoRef.current.currentTime = 0
      videoRef.current.play()
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000',
      zIndex: 150,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        playsInline
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      {/* Overlay bas */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '64px 20px 32px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)',
        display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end',
        opacity: ctaVisible ? 1 : 0,
        transition: 'opacity 700ms ease',
        pointerEvents: ctaVisible ? 'auto' : 'none',
      }}>
        {/* Bouton son */}
        <button
          onClick={handleSound}
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(255,255,255,0.20)',
            border: '2px solid rgba(255,255,255,0.45)',
            backdropFilter: 'blur(6px)',
            cursor: 'pointer', fontSize: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        {/* Bouton continuer */}
        <button
          onClick={onContinue}
          className="wof-cta-pulse"
          style={{
            width: '100%',
            fontFamily: 'Jost, sans-serif',
            fontSize: 15, fontWeight: 500, letterSpacing: '0.04em',
            color: '#fff',
            background: 'linear-gradient(135deg, #c8a0b0, #a07888)',
            border: 'none', borderRadius: 50, padding: '14px 24px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(200,160,176,0.35)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          Continuer →
        </button>
      </div>
    </div>
  )
}

function WelcomeWeekOne({ onStart }) {
  const ambiance = useAmbiance()
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 2200)
    return () => clearTimeout(t)
  }, [])

  const fade = (visible) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 700ms ease, transform 700ms ease',
    pointerEvents: visible ? 'auto' : 'none',
  })

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(160deg, #0d2818, #071510)',
      zIndex: 200,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '8px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 24px 70px rgba(180,120,110,0.20)',
        position: 'relative',
      }}>
        <img
          src={ambianceAsset('/barriere.png', ambiance)}
          alt=""
          style={{ width: '100%', height: 'auto', display: 'block', minHeight: 260, objectFit: 'cover' }}
          onError={e => { e.target.onerror = null; e.target.style.minHeight = '320px'; e.target.style.background = '#0d2818' }}
        />

        {/* Bouton démarrer en overlay bas */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '48px 16px 16px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)',
          display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end',
          ...fade(phase >= 1),
        }}>
          <button
            onClick={onStart}
            style={{
              width: '100%',
              fontFamily: 'Jost, sans-serif',
              fontSize: 15, fontWeight: 500, letterSpacing: '0.04em',
              color: '#fff',
              background: 'linear-gradient(135deg, #a8c098, #7a9870)',
              border: 'none', borderRadius: 50, padding: '14px 24px',
              cursor: 'pointer', transition: 'transform 0.15s ease',
              boxShadow: '0 8px 24px rgba(122,152,112,0.4)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            Commencer mon premier jour →
          </button>
        </div>
      </div>
    </div>
  )
}

export function WeekOneFlow({ userId, onComplete, onAllDone, forceGarden, forceDay, isPro: isProProp, onOpenProProfile }) {
  const ambiance = useAmbiance()
  const { signOut } = useAuth()
  const [loading,     setLoading]     = useState(true)

  // Déconnexion fiable : on tente signOut puis on force le rechargement
  // peu importe le résultat (évite les états bloqués)
  async function handleSignOut() {
    try { await signOut() } catch (_) {}
    window.location.href = '/'
  }
  const [plantHealth, setPlantHealth] = useState(null)
  const [petalColor1, setPetalColor1] = useState(null)
  const [petalColor2, setPetalColor2] = useState(null)

  // Données initiales selon le mode
  const initData = (() => {
    if (forceDay) {
      const day = Math.min(Math.max(forceDay, 1), 7)
      const prevDays = Array.from({ length: day - 1 }, (_, i) => i + 1)
      const dates = Object.fromEntries(prevDays.map(d => [d, '2026-01-01']))
      return {
        ...INITIAL_WEEK_DATA,
        currentDay: day,
        completedDays: prevDays,
        completionDates: dates,
        answers: TEST_ANSWERS,
      }
    }
    if (forceGarden)
      return { ...INITIAL_WEEK_DATA, currentDay: 2, completedDays: [1], completionDates: { 1: '2026-01-01' } }
    return INITIAL_WEEK_DATA
  })()

  const [weekData, setWeekData] = useState(initData)
  const weekDataRef = useRef(initData)
  const [showWelcome, setShowWelcome] = useState(
    !forceDay && !forceGarden && initData.currentDay === 1 && initData.completedDays.length === 0
  )
  const [showVeil, setShowVeil] = useState(
    !forceDay && !forceGarden && initData.currentDay === 1 && initData.completedDays.length === 0
  )
  const [view, setView] = useState(
    forceDay > 1 || forceGarden ? 'garden' : 'day'
  )
  const [isReplay, setIsReplay] = useState(false)
  const [activeZoneId, setActiveZoneId] = useState(null)
  const [completedRituals, setCompletedRituals] = useState({})
  const { rituals: plantRituals } = useRituels()
  const [currentScreen, setCurrentScreen] = useState('accueil_intro')

  // Lutin compagnon
  const [lutinVisible,   setLutinVisible]  = useState(false)
  const [bubbleOpen,     setBubbleOpen]    = useState(false)
  const [lutinMessage,   setLutinMessage]  = useState(null)
  const [lutinLoading,   setLutinLoading]  = useState(false)
  const [lutinSlotIdx,   setLutinSlotIdx]  = useState(0)
  const lutinShowTimer   = useRef(null)
  const lutinHideTimer   = useRef(null)

  function pickSlotIdx(currentIdx) {
    return currentIdx === 0 ? 1 : 0
  }

  function fetchAndShow(stepTheme, dayCfg, ans, isClick = false) {
    const dayKey = `j${dayCfg.day}`
    setLutinLoading(true)
    if (!isClick) setLutinMessage(null)
    supabase.functions.invoke('compagnon', {
      body: {
        day:       dayCfg.day,
        dayTitle:  dayCfg.title,
        zone:      dayCfg.rituel?.zone ?? '',
        stepTheme: stepTheme,
        feel:      ans?.j1?.feel ?? ans?.[dayKey]?.feel ?? null,
        energy:    ans?.[dayKey]?.energy ?? null,
      },
    }).then(({ data }) => {
      if (data?.message) setLutinMessage(data.message)
    }).catch(() => {}).finally(() => setLutinLoading(false))
  }

  // Déclenché à chaque changement de screen (via DayShell)
  function handleStepChange(screen, stepTheme, dayCfg) {
    setCurrentScreen(screen)
    clearTimeout(lutinShowTimer.current)
    clearTimeout(lutinHideTimer.current)
    setBubbleOpen(false)
    setLutinVisible(false)

    setLutinSlotIdx(prev => pickSlotIdx(prev))

    const ans = weekData.answers ?? {}
    fetchAndShow(stepTheme, dayCfg, ans)

    lutinShowTimer.current = setTimeout(() => {
      setLutinVisible(true)
      setBubbleOpen(true)
      lutinHideTimer.current = setTimeout(() => setBubbleOpen(false), 10000)
    }, 2000)
  }

  // Reset quand le jour change ou quand on quitte la vue day
  useEffect(() => {
    clearTimeout(lutinShowTimer.current)
    clearTimeout(lutinHideTimer.current)
    setLutinVisible(false)
    setBubbleOpen(false)
    setLutinMessage(null)
  }, [weekData.currentDay, view])

  useEffect(() => () => {
    clearTimeout(lutinShowTimer.current)
    clearTimeout(lutinHideTimer.current)
  }, [])

  function handleLutinClick() {
    const dayIdx = Math.min(Math.max((weekData.currentDay || 1) - 1, 0), 6)
    const dayCfg = WEEK_ONE_DATA[dayIdx]
    const ans    = weekData.answers ?? {}
    fetchAndShow('encouragement et accompagnement libre', dayCfg, ans, true)
    setBubbleOpen(true)
    clearTimeout(lutinHideTimer.current)
    lutinHideTimer.current = setTimeout(() => setBubbleOpen(false), 10000)
  }

  // Zone DB ciblée par chaque jour de la semaine 1
  const DAY_ZONE_KEY = {
    1: 'zone_racines',
    2: 'zone_tige',
    3: 'zone_feuilles',
    4: 'zone_fleurs',
    5: 'zone_souffle',
  }

  async function handleToggleRitual(ritualId) {
    const wasOn = !!completedRituals[ritualId]
    setCompletedRituals(prev => ({ ...prev, [ritualId]: !wasOn }))

    // +5% sur la zone du jour uniquement (pas de déduction si décoché — 1 seul sens)
    if (!wasOn && userId) {
      const dayNum  = weekDataRef.current?.currentDay ?? 1
      const zoneKey = DAY_ZONE_KEY[dayNum]
      if (!zoneKey) return  // jours 6 & 7 : pas de zone spécifique
      const today   = new Date().toISOString().split('T')[0]
      try {
        let { data: existing } = await supabase
          .from('plants')
          .select('health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle()
        if (!existing) {
          const { data: latest } = await supabase
            .from('plants')
            .select('health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle()
          existing = latest
        }
        const base = existing || { zone_racines: 0, zone_tige: 0, zone_feuilles: 0, zone_fleurs: 0, zone_souffle: 0 }
        const newZoneVal = Math.min(100, (base[zoneKey] ?? 0) + 5)
        const zones = {
          zone_racines:  base.zone_racines  ?? 0,
          zone_tige:     base.zone_tige     ?? 0,
          zone_feuilles: base.zone_feuilles ?? 0,
          zone_fleurs:   base.zone_fleurs   ?? 0,
          zone_souffle:  base.zone_souffle  ?? 0,
          [zoneKey]: newZoneVal,
        }
        const health = Math.round(Object.values(zones).reduce((a, b) => a + b, 0) / 5)
        await supabase
          .from('plants')
          .upsert({ user_id: userId, date: today, ...zones, health }, { onConflict: 'user_id,date' })
      } catch (_) {}
    }
  }

  // Chargement depuis Supabase
  useEffect(() => {
  if (forceGarden || forceDay) { setLoading(false); return }
  if (!userId) { setLoading(false); return }

  let cancelled = false  // ← 1. flag d'annulation

  const timeout = setTimeout(() => {  // ← 2. garde-fou 8s
    if (!cancelled) {
      weekDataRef.current = INITIAL_WEEK_DATA
      setLoading(false)
    }
  }, 8000)

  ;(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('week_one_data')
      .eq('id', userId)
      .single()

    if (!error && data?.week_one_data) {
      const saved = data.week_one_data
      const normalized = {
        ...INITIAL_WEEK_DATA,
        ...saved,
        currentDay: saved.currentDay ?? 1,
        completedDays: (saved.completedDays ?? []).filter(d => typeof d === 'number' && !isNaN(d)),
      }
      setWeekData(normalized)
      weekDataRef.current = normalized
      if (normalized.completedDays.length > 0) {
        setView('garden')
        setShowWelcome(false)
      }
    } else {
      weekDataRef.current = INITIAL_WEEK_DATA
    }

    clearTimeout(timeout)   // ← 3. on annule le garde-fou si fetch réussi
    if (!cancelled) setLoading(false)
  })()

  return () => {   // ← 4. cleanup si le composant démonte pendant le fetch
    cancelled = true
    clearTimeout(timeout)
  }
}, [userId])

  // Charger la vitalité du jour (table plants)
  useEffect(() => {
    if (!userId) return
    const today = new Date().toISOString().split('T')[0]
    supabase
      .from('plants')
      .select('health')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()
      .then(({ data }) => { if (data?.health != null) setPlantHealth(data.health) })
  }, [userId])

  // Charger la couleur de fleur choisie à l'onboarding
  useEffect(() => {
    if (!userId) return
    supabase
      .from('garden_settings')
      .select('petal_color1, petal_color2')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.petal_color1) {
          setPetalColor1(data.petal_color1)
          setPetalColor2(data.petal_color2 ?? data.petal_color1)
        }
      })
  }, [userId])

  // Mise à jour temps réel après personnalisation (MaFleurDiscovery → GardenDashboard)
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.petalColor1) setPetalColor1(e.detail.petalColor1)
      if (e.detail?.petalColor2) setPetalColor2(e.detail.petalColor2)
    }
    window.addEventListener('garden:settings:updated', handler)
    return () => window.removeEventListener('garden:settings:updated', handler)
  }, [])

  // Sauvegarde dans Supabase
const saveWeekData = useCallback(async (updated) => {
  weekDataRef.current = updated
  setWeekData(updated)
  if (!userId) return
  await supabase
    .from('profiles')
    .update({ week_one_data: updated })
    .eq('id', userId)
}, [userId])

async function handleDayEvent(event) {
  const current = weekDataRef.current

  if (event.type === 'answer') {
  // Mode replay — on ne sauvegarde pas les réponses
  if (isReplay) return

  const updated = {
    ...current,
    answers: {
      ...current.answers,
      [event.dayKey]: {
        ...(current.answers[event.dayKey] || {}),
        [event.answerKey]: event.value,
      },
    },
  }
  await saveWeekData(updated)
}

  if (event.type === 'complete') {
    // Mode replay — retour au garden sans toucher aux données
    if (isReplay) {
      setIsReplay(false)
      setWeekData(d => ({
        ...d,
        currentDay: (d.completedDays ?? []).length > 0
          ? Math.min(Math.max(...(d.completedDays ?? [])) + 1, 7)
          : 1
      }))
      setView('garden')
      return
    }

    const dayNum      = current.currentDay
    const nextDay     = Math.min(dayNum + 1, 7)
    const today       = new Date().toISOString().split('T')[0]
    const prevDays    = current.completedDays ?? []
    const updated = {
      ...current,
      currentDay:    nextDay,
      completedDays: prevDays.includes(dayNum) ? prevDays : [...prevDays, dayNum],
      completionDates: {
        ...(current.completionDates || {}),
        [dayNum]: today,
      },
    }

      // Lumens (non-bloquant)
      if (userId) {
        const lumenAmount = dayNum === 7 ? 15 : dayNum === 5 ? 10 : 5
        ;(async () => { try { await supabase.rpc('award_lumens', { p_user_id: userId, p_amount: lumenAmount, p_reason: `week_one_day_${dayNum}`, p_meta: { day: dayNum } }) } catch (_) {} })()
      }

      // ── Mise à jour plante à la fin du jour — garantit 35% minimum sur la zone ──
      if (userId) {
        // Zone ciblée par jour (jours 6 & 7 = toutes les zones)
        const DAY_ZONE_KEY = {
          1: 'zone_racines',
          2: 'zone_tige',
          3: 'zone_feuilles',
          4: 'zone_fleurs',
          5: 'zone_souffle',
        }
        const MINIMUM = 35
        ;(async () => {
          try {
            // Cherche d'abord le record d'aujourd'hui, sinon prend le dernier
            // connu pour ne pas perdre les zones des jours précédents
            let { data: existing } = await supabase
              .from('plants')
              .select('health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
              .eq('user_id', userId)
              .eq('date', today)
              .maybeSingle()

            if (!existing) {
              const { data: latest } = await supabase
                .from('plants')
                .select('health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .limit(1)
                .maybeSingle()
              existing = latest
            }

            const base = existing || { zone_racines: 0, zone_tige: 0, zone_feuilles: 0, zone_fleurs: 0, zone_souffle: 0 }
            const zoneKey = DAY_ZONE_KEY[dayNum]

            let zones = {
              zone_racines:  base.zone_racines  ?? 0,
              zone_tige:     base.zone_tige     ?? 0,
              zone_feuilles: base.zone_feuilles ?? 0,
              zone_fleurs:   base.zone_fleurs   ?? 0,
              zone_souffle:  base.zone_souffle  ?? 0,
            }

            if (zoneKey) {
              // Jours 1-5 : forcer le minimum sur la zone du jour
              zones[zoneKey] = Math.max(zones[zoneKey], MINIMUM)
            } else {
              // Jours 6 & 7 : toutes les zones à 35% minimum
              Object.keys(zones).forEach(k => { zones[k] = Math.max(zones[k], MINIMUM) })
            }

            const health = Math.round(Object.values(zones).reduce((a, b) => a + b, 0) / 5)
            await supabase
              .from('plants')
              .upsert({ user_id: userId, date: today, ...zones, health }, { onConflict: 'user_id,date' })
          } catch (_) {}
        })()
      }

      // Mise à jour synchrone : weekDataRef + les deux setState dans le même
      // appel pour garantir le batching React (évite tout flash du jour suivant)
      weekDataRef.current = updated
      setWeekData(updated)

      if (dayNum === 7) {
        if (userId) {
          ;(async () => {
            try { await supabase.from('profiles').update({ week_one_data: updated }).eq('id', userId) } catch (_) {}
            try { await supabase.from('users').update({ week_one_completed: true }).eq('id', userId) } catch (_) {}
          })()
        }
        // onAllDone = tous les 7 jours validés → aller au dashboard
        // onComplete = fallback (compatibilité test-weekone)
        ;(onAllDone ?? onComplete)?.(updated.completedDays)
      } else {
        setView('garden')
        if (userId) {
          ;(async () => { try { await supabase.from('profiles').update({ week_one_data: updated }).eq('id', userId) } catch (_) {} })()
        }
      }
    }
  }

  // ── Écran de chargement ────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <GlobalStyles />
        <div style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(160deg, #0d2818, #071510)',
        }}>
          <p style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 14,
            fontWeight: 300,
            color: '#a09090',
            letterSpacing: '0.04em',
          }}>
            Ton jardin se prépare…
          </p>
        </div>
      </>
    )
  }

  if (showWelcome || showVeil) {
    return (
      <>
        <GlobalStyles />
        {/* Voile avec barriere.png — à la fin, passe directement au jour 1 */}
        {showVeil && <WelcomeVeil onDone={() => { setShowVeil(false); setShowWelcome(false) }} isReturn={weekData.completedDays.length > 0} />}
      </>
    )
  }

  const dayIndex      = Math.min(Math.max((weekData.currentDay || 1) - 1, 0), 6)
  const currentConfig = WEEK_ONE_DATA[dayIndex]
  const accentColor   = currentConfig.color || '#c8a0b0'

  // ── Rendu principal ────────────────────────────────────────────────────

  const isMobile = window.innerWidth < 600

  return (
    <>
      <GlobalStyles />

      {/* Fond desktop */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(160deg, #f8f0ec, #e8d8d0)',
        zIndex: 1,
      }} />

      <OrganicLights />

      {/* Conteneur modal */}
      <div className="wof-backdrop" style={{ zIndex: 10 }}>
        <div className={`wof-modal${view === 'garden' ? ' wof-modal--garden' : ''}`} style={view === 'garden' ? { background: 'linear-gradient(160deg, #0d2818 0%, #0a1f12 50%, #071510 100%)' } : {}}>

          {/* ── Bouton Compte Pro — vue garden uniquement ── */}
          {isProProp && view === 'garden' && (
            <div
              onClick={() => onOpenProProfile?.()}
              style={{
                position: 'absolute', top: 12, right: 12, zIndex: 50,
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 14px', borderRadius: 100,
                background: 'linear-gradient(135deg,rgba(122,64,16,.90),rgba(90,46,8,.85))',
                border: '1px solid rgba(255,255,255,.20)',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer', fontFamily: 'Jost, sans-serif',
                fontSize: 11, fontWeight: 600, color: '#fff',
                letterSpacing: '.05em', boxShadow: '0 2px 12px rgba(0,0,0,.25)',
              }}
            >
              ✦ Compte Pro
            </div>
          )}
          {view === 'garden' && (
            <>
              <div className="garden-overlay" />
              {[
                { top:'12%', left:'8%',  dur:'2.4s', fdur:'5s',   delay:'0s'    },
                { top:'25%', left:'72%', dur:'1.8s', fdur:'4.2s', delay:'0.6s'  },
                { top:'40%', left:'18%', dur:'2.8s', fdur:'6s',   delay:'1.1s'  },
                { top:'55%', left:'85%', dur:'2.1s', fdur:'4.8s', delay:'0.3s'  },
                { top:'65%', left:'45%', dur:'3s',   fdur:'5.5s', delay:'1.7s'  },
                { top:'30%', left:'55%', dur:'2.2s', fdur:'4.5s', delay:'0.9s'  },
                { top:'72%', left:'25%', dur:'1.9s', fdur:'3.8s', delay:'2.1s'  },
                { top:'18%', left:'38%', dur:'2.6s', fdur:'5.2s', delay:'1.4s'  },
              ].map((p, i) => (
                <div key={i} className="spark" style={{
                  top: p.top, left: p.left,
                  '--dur': p.dur, '--fdur': p.fdur, '--delay': p.delay,
                }} />
              ))}
            </>
          )}

          {/* ── Image hero — cachée en vue garden ── */}
          <div style={{
            flexShrink: 0,
            height: view === 'garden' ? 0 : isMobile ? '28%' : '40%',
            minHeight: view === 'garden' ? 0 : undefined,
            position: 'relative',
            overflow: 'hidden',
            visibility: view === 'garden' ? 'hidden' : 'visible',
          }}>
            <img
              src={ambianceAsset(dayIndex === 0 ? '/racines.png' : dayIndex === 1 ? '/tige.png' : dayIndex === 2 ? '/feuilles.png' : dayIndex === 3 ? '/fleur2.png' : dayIndex === 4 ? '/souffle.png' : '/champs.png', ambiance)}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: isMobile ? 'center center' : 'center 30%', display: 'block' }}
            />

            {/* Fondu bas */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 50%, #faf5f2 100%)',
              pointerEvents: 'none',
            }}/>

            {/* Overlay ambiance zen — libellé du jour */}
            {ambiance === 'zen' && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(20,20,20,0.25)',
                pointerEvents: 'none',
              }}>
                <div style={{
                  fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontWeight: 700,
                  fontSize: isMobile ? 32 : 44, color: '#fff',
                  textShadow: '0 2px 12px rgba(0,0,0,0.45)',
                  textAlign: 'center', letterSpacing: '.02em',
                }}>
                  Jour {dayIndex + 1} – {DAY_ZEN_LABELS[dayIndex]}
                </div>
              </div>
            )}


            {/* ── Lutin Félin dans le hero ── */}
            {view === 'day' && (
              <LutinCompagnon
                contained
                message={lutinLoading ? '...' : lutinMessage ?? LUTIN_MESSAGES_WEEK_ONE[weekData.currentDay] ?? LUTIN_MESSAGES_WEEK_ONE[1]}
                visible={lutinVisible}
                bubbleOpen={bubbleOpen}
                onCloseBubble={() => setBubbleOpen(false)}
                onClickImage={handleLutinClick}
                position={LUTIN_SLOTS[lutinSlotIdx]}
              />
            )}

          </div>

          {/* ── Frise de progression du parcours — remplace les badges position/timing ── */}
          {view === 'day' && (
            <DiscoveryProgressBar
              completedDays={weekData.completedDays}
              currentDay={weekData.currentDay}
            />
          )}

   {/* ── Contenu (scrollable) ── */}
<div id="wof-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'scroll', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', background: view === 'garden' ? 'linear-gradient(160deg, #0d2818, #071510)' : 'transparent', }}>
  {view === 'garden' ? (
    <GardenDashboard
      completedDays={weekData.completedDays}
      completionDates={weekData.completionDates || {}}
      onContinue={() => setView('day')}
      onReplayDay={(day) => {
        setWeekData(d => ({ ...d, currentDay: day }))
        setIsReplay(true)
        setView('day')
        document.getElementById('wof-scroll').scrollTop = 0
      }}
                onOpenZone={setActiveZoneId}
                onClose={() => onComplete?.(weekData.completedDays)}
                onSignOut={handleSignOut}
                petalColor1={petalColor1}
                petalColor2={petalColor2}
                plantHealth={plantHealth}
                isPro={isProProp}
                onOpenProProfile={onOpenProProfile}
              />
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <DayShell
                  key={weekData.currentDay}
                  dayIndex={dayIndex}
                  answers={weekData.answers}
                  completedDays={weekData.completedDays}
                  onDayComplete={handleDayEvent}
                  onStepChange={handleStepChange}
                />
              </div>
            )}
          </div>

          {/* HelpBandeau retiré */}

        </div>
      </div>


      {/* ── Modal rituels — rendu hors du backdrop pour position: fixed correct ── */}
      {activeZoneId && (
        <div style={{
          '--ritual-modal-bg-start': '#fffaf7',
          '--ritual-modal-bg-end':   '#f5ede8',
          '--ritual-modal-text':     '#2a1010',
          '--ritual-modal-text-rgb': '42,16,16',
          '--surface-1':  'rgba(255,255,255,0.7)',
          '--surface-2':  'rgba(200,170,160,0.18)',
          '--surface-3':  'rgba(180,130,110,0.25)',
          '--track':      'rgba(180,130,110,0.12)',
          '--separator':  'rgba(150,100,80,0.35)',
          '--ritual-item-border': 'rgba(180,130,100,0.20)',
          '--ritual-item-bg':     'rgba(255,255,255,0.65)',
        }}>
          <RitualZoneModal
            zoneId={activeZoneId}
            completed={completedRituals}
            onToggle={handleToggleRitual}
            onClose={() => setActiveZoneId(null)}
            plantRituals={plantRituals}
            closeOnComplete
          />
        </div>
      )}



    </>
  )
}

