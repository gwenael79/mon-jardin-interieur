// src/pages/WeekOneFlow.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../core/supabaseClient'
import { RitualZoneModal, useRituels } from './mafleur_rituels'
import { useAuth } from '../hooks/useAuth'
import { PlantSVG, DEFAULT_GARDEN_SETTINGS } from '../components/PlantSVG'
import { LutinCompagnon, LUTIN_MESSAGES_WEEK_ONE } from '../components/LutinCompagnon'

// ─────────────────────────────────────────────────────────────────────────────
// 1. Styles globaux — keyframes + responsive modal
// ─────────────────────────────────────────────────────────────────────────────

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

      @keyframes stepIn {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0);    }
      }
      @keyframes softRise {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0);    }
      }
      .wof-soft { animation: softRise 900ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
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
    `}</style>
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

export const WEEK_ONE_DATA = [
  /* ── JOUR 1 ─────────────────────────────────────────────────────────────── */
  {
    day: 1,
    title: 'Je commence',
    color: '#c8a0b0',
    accueil: {
      layout: 'slide1',
      timeBadge: '⏱ 3 à 5 min · à ton rythme',
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
      timeBadge: '⏱ 2 à 3 min · à ton rythme',
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
      headline: 'Quelque chose commence à se dessiner.',
      timeBadge: '⏱ 2 à 3 min · à ton rythme',
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
      timeBadge: '⏱ 2 à 3 min · à ton rythme',
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
      timeBadge: '⏱ 2 à 3 min · à ton rythme',
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
      "« Mais, si tu m'apprivoises, nous aurons besoin l'un de l'autre.",
      "Tu seras pour moi unique au monde.",
      "Je serai pour toi unique au monde… »",
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
      timerDuration: 3,
      timerButtonAfter: 2,
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
    finalCTA: 'Entrer dans mon jardin',
    helpTexts: {
      accueil_intro:       "Sept jours. Chaque jour avait sa lumière, sa résistance, sa couleur.\n\nCe que tu as traversé n'est pas derrière toi. C'est en toi, désormais. Quelque chose a changé de forme.",
      accueil_respiration: "Un dernier souffle avant d'entrer dans le jardin partagé.\n\nCe que tu portes aujourd'hui, tu vas le retrouver dans les autres aussi.",
      introspection:       "Ce que tu emportes de cette semaine ne tient pas toujours dans un mot.\n\nPeut-être une sensation. Une image. Un peu plus de douceur envers toi-même. C'est suffisant.",
      rituel:              "Un jardin partagé n'efface pas le tien. Il l'enrichit.\n\nTa pratique, ta présence, ton engagement cette semaine ont une résonance au-delà de toi.\n\nEntrer dans le jardin collectif, c'est continuer de grandir autrement.",
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
        padding: '14px 40px',
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
        fontFamily: 'Jost, sans-serif',
        fontSize: 13,
        color: '#1a1010',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 0 12px',
        letterSpacing: '0.02em',
      }}
    >
      ← Revenir
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
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <div style={{
          width: 72, height: 72,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 42% 38%, #fff6f2 0%, #f0c8b4 38%, #9a6070 100%)',
          transform: started && isInhale ? 'scale(1.7)' : 'scale(1)',
          boxShadow: started && isInhale
            ? '0 0 55px 22px rgba(240,175,145,0.52), 0 0 90px 36px rgba(200,130,110,0.22)'
            : '0 0 14px 4px rgba(200,140,120,0.18)',
          transition: started ? 'transform 5s ease-in-out, box-shadow 5s ease-in-out' : 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
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
      <div style={{ position: 'relative', width: ORB, height: ORB }}>
        <div style={{
          width: ORB, height: ORB, borderRadius: '50%',
          background: 'radial-gradient(circle at 42% 38%, #fff6f2 0%, #f0c8b4 38%, #9a6070 100%)',
          transform: isRunning && isInhale ? 'scale(1.55)' : 'scale(1)',
          boxShadow: isRunning && isInhale
            ? '0 0 55px 22px rgba(240,175,145,0.52), 0 0 90px 36px rgba(200,130,110,0.22)'
            : '0 0 14px 4px rgba(200,140,120,0.18)',
          transition: isRunning ? 'transform 5s ease-in-out, box-shadow 5s ease-in-out' : 'none',
        }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {phase === 'starting' ? (
            <p key={preCount} style={{ fontFamily: 'Jost, sans-serif', fontSize: 36, fontWeight: 700, color: '#3a1818', margin: 0, animation: 'stepIn 0.25s ease both' }}>{preCount}</p>
          ) : (
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: isRunning ? 22 : 20, fontWeight: 700, color: '#3a1818', margin: 0, letterSpacing: '0.04em' }}>
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
    const t = setTimeout(() => setSubSlide(3), 4000)
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
      transform:  visible ? 'translateY(0)' : 'translateY(10px)',
      transition: T,
    }
  }

  if (subSlide === 0) {
    return (
      <div className="wof-soft" style={{ textAlign: 'center', padding: '40px 20px 36px' }}>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(24px, 6.5vw, 34px)',
          fontWeight: 500,
          color: '#0f0808',
          lineHeight: 1.35,
          margin: '0 0 32px',
          letterSpacing: '-0.01em',
          ...fadeStyle(true),
        }}>
          Tu n'es pas ici par hasard.
        </p>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(20px, 5.5vw, 28px)',
          fontStyle: 'italic',
          color: '#2a1e1e',
          lineHeight: 1.6,
          margin: '0 0 28px',
          ...fadeStyle(phase >= 1),
        }}>
          Quelque chose en toi sait qu'il est temps de ralentir.
        </p>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(20px, 5.5vw, 28px)',
          fontStyle: 'italic',
          color: '#2a1e1e',
          lineHeight: 1.6,
          margin: '0 0 28px',
          ...fadeStyle(phase >= 2),
        }}>
          Pas pour faire plus. Mais pour faire autrement.
        </p>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(20px, 5.5vw, 28px)',
          fontStyle: 'italic',
          color: '#2a1e1e',
          lineHeight: 1.6,
          margin: '0 0 44px',
          ...fadeStyle(phase >= 3),
        }}>
          Ce que tu vas commencer ici… se construit un jour à la fois.
        </p>

        <div style={{ ...fadeStyle(phase >= 4), pointerEvents: phase >= 4 ? 'auto' : 'none' }}>
          <PrimaryButton onClick={() => setSubSlide(1)}>
            Commencer
          </PrimaryButton>
        </div>

      </div>
    )
  }

  /* ── SLIDE 1 — ARRÊT ─────────────────────────────────────────── */
  if (subSlide === 1) {
    return (
      <div className="wof-soft" style={{ textAlign: 'center', padding: '40px 20px 36px' }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(30px, 7.5vw, 46px)',
          fontWeight: 500,
          color: '#0f0808',
          lineHeight: 1.15,
          margin: '0 0 32px',
          letterSpacing: '-0.01em',
          ...fadeStyle(true),
        }}>
          Tu es là.
        </h1>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(20px, 5.5vw, 28px)',
          fontStyle: 'italic',
          color: '#2a1e1e',
          lineHeight: 1.6,
          margin: '0 0 44px',
          ...fadeStyle(phase >= 1),
        }}>
          Et pour une fois… tu n'as rien à faire de plus.
        </p>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(20px, 5.5vw, 28px)',
          fontWeight: 600,
          color: '#0f0808',
          lineHeight: 1.6,
          margin: '0 0 44px',
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
      <div className="wof-soft" style={{ textAlign: 'center', padding: '40px 20px 36px' }}>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(22px, 5.5vw, 30px)',
          fontWeight: 400,
          color: '#0f0808',
          lineHeight: 1.5,
          margin: '0 0 36px',
          ...fadeStyle(true),
        }}>
          Prends simplement un instant.
        </p>

        <div style={{ marginBottom: orbDone ? 28 : 36 }}>
          <BreathingOrb maxCycles={3} onComplete={() => setOrbDone(true)} />
        </div>

        {orbDone && (
          <div className="wof-soft">
            <p style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(20px, 5.5vw, 26px)',
              fontWeight: 600,
              color: '#0f0808',
              lineHeight: 1.65,
              margin: 0,
            }}>
              C'est déjà suffisant. Ton corps commence à ralentir.
            </p>
          </div>
        )}
      </div>
    )
  }

  /* ── SLIDE 3 — BAROMÈTRE ÉMOTIONNEL ─────────────────────────── */
  return (
    <div className="wof-soft" style={{ padding: '32px 20px 36px' }}>
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
      <div className="wof-soft" style={{ textAlign: 'center', padding: '40px 20px 36px' }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(24px, 6.5vw, 34px)',
          fontWeight: 500,
          color: '#0f0808',
          lineHeight: 1.3,
          margin: '0 0 20px',
          letterSpacing: '-0.01em',
        }}>
          {data.headline}
        </h1>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(20px, 5.5vw, 26px)',
          fontWeight: 700,
          color: '#0f0808',
          margin: '0 0 20px',
          opacity: tagVisible ? 1 : 0,
          transform: tagVisible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 700ms ease, transform 700ms ease',
        }}>
          {data.tagLine ?? 'Et ça compte.'}
        </p>

        {prevNote && (
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(20px, 5.5vw, 28px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: '#2a1e1e',
            lineHeight: 1.6,
            margin: '0 0 12px',
          }}>
            {prevNote}
          </p>
        )}

        {data.subtitle && (
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(20px, 5.5vw, 28px)',
            fontStyle: 'italic',
            color: '#2a1e1e',
            lineHeight: 1.6,
            margin: data.subtitleExtra ? '0 0 8px' : '0 0 32px',
          }}>
            {data.subtitle}
          </p>
        )}

        {data.subtitleExtra && (
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(20px, 5.5vw, 28px)',
            fontWeight: 700,
            color: '#0f0808',
            lineHeight: 1.6,
            margin: data.subtitleFinal ? '0 0 8px' : '0 0 32px',
          }}>
            {data.subtitleExtra}
          </p>
        )}

        {data.subtitleFinal && (
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(26px, 7vw, 36px)',
            fontWeight: 700,
            color: '#0f0808',
            lineHeight: 1.3,
            margin: '0 0 32px',
          }}>
            {data.subtitleFinal}
          </p>
        )}

        {ctaReady && (
          <div className="wof-soft">
            <PrimaryButton onClick={() => setSubSlide(1)}>
              Prendre un instant
            </PrimaryButton>
          </div>
        )}
      </div>
    )
  }

  /* ── Sub-slide 1 : respiration ─── */
  if (subSlide === 1) {
    return (
      <div className="wof-soft" style={{ textAlign: 'center', padding: '40px 20px 36px' }}>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(20px, 5.5vw, 28px)',
          fontWeight: 400,
          fontStyle: 'italic',
          color: '#0f0808',
          lineHeight: 1.6,
          margin: '0 0 12px',
        }}>
          Reviens à ton souffle.
        </p>

        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(20px, 5.5vw, 28px)',
          fontWeight: 700,
          color: '#0f0808',
          lineHeight: 1.6,
          margin: '0 0 32px',
        }}>
          {data.breatheIntro ?? "Aujourd'hui, observe-le un peu plus finement."}
        </p>

        <div style={{ marginBottom: orbDone ? 24 : 40 }}>
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
                fontSize: 'clamp(20px, 5.5vw, 28px)',
                fontWeight: 700,
                color: '#0f0808',
                lineHeight: 1.6,
                margin: '0 0 28px',
              }}>
                {data.orbDonePhrase ?? 'Ton souffle devient plus stable.'}
              </p>
            )}
            <div className="wof-soft" style={{ marginTop: data.timerDuration ? 28 : 0 }}>
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
    <div className="wof-soft" style={{ padding: '32px 20px 36px' }}>
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

      // Cumul semaine — applique les bonus des jours complétés si la table plants
      // ne les intègre pas encore (health < completedDays * 35 / 5)
      const completed = profile0?.week_one_data?.completedDays ?? []
      if (completed.length > 0) {
        const DAY_ZONE = { 1: 'zone_racines', 2: 'zone_tige', 3: 'zone_feuilles', 4: 'zone_fleurs', 5: 'zone_souffle' }
        const expectedMin = Math.round(completed.filter(d => d <= 5).length * 35 / 5)
        const currentHealth = plant?.health ?? 0

        if (currentHealth < expectedMin) {
          // La base existante ou zéro si aucun record
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
            if (key) zones[key] = Math.min(100, zones[key] + 35)
            if (d === 6) Object.keys(zones).forEach(k => { zones[k] = Math.min(100, zones[k] + 10) })
            if (d === 7) Object.keys(zones).forEach(k => { zones[k] = Math.min(100, zones[k] + 15) })
          })
          const health = Math.round(Object.values(zones).reduce((a, b) => a + b, 0) / 5)
          plant = { ...zones, health, date: plant?.date ?? null, _fromWeekData: !plant }
          // Écrire dans plants pour les prochaines consultations
          const today = new Date().toISOString().split('T')[0]
          supabase.from('plants')
            .upsert({ user_id: userId, date: today, ...zones, health }, { onConflict: 'user_id,date' })
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

  const health = plantData?.health ?? 0

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
  const { user } = useAuth()
  const userId   = user?.id
  const [plantData, setPlantData] = useState(null)
  const [settings,  setSettings]  = useState(null)
  const [phase,     setPhase]     = useState(0)

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

  const health = plantData?.health ?? 35
  const gardenSettings = settings ? {
    ...DEFAULT_GARDEN_SETTINGS,
    petalColor1: settings.petal_color1 ?? DEFAULT_GARDEN_SETTINGS.petalColor1,
    petalColor2: settings.petal_color2 ?? DEFAULT_GARDEN_SETTINGS.petalColor2,
    petalShape:  settings.petal_shape  ?? DEFAULT_GARDEN_SETTINGS.petalShape,
  } : DEFAULT_GARDEN_SETTINGS

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
            src="/couronne.png"
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

      {/* Phase 4 — contemplation */}
      <div style={{ ...fadeIn(phase >= 4), margin: '0 0 48px' }}>
        <p style={{ ...S }}>Elle reflète ce qui a commencé à se développer en toi par ces attentions quotidiennes.</p>
      </div>

      {/* Phase 5 — bouton */}
      <div style={{ ...fadeIn(phase >= 5), pointerEvents: phase >= 5 ? 'auto' : 'none' }}>
        <PrimaryButton onClick={() => onAnswer(answerKey, 'vu')}>
          Continuer
        </PrimaryButton>
      </div>
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
    transform:  visible ? 'translateY(0)' : 'translateY(9px)',
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

function RacinesGuidedRituel({ onNext, onBack }) {
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

      {block(1, <p style={S}>Tu peux simplement <B>rester là</B>… quelques instants.</p>)}
      {block(2, <p style={S}><B>Sens</B> tes pieds. Leur <B>contact</B> avec le sol.</p>)}
      {block(3, <p style={S}>Sans chercher à changer quoi que ce soit.</p>)}
      {block(4, <>
        <p style={S}><B>Inspire</B> doucement… et laisse l'air <B>sortir</B>.</p>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '-16px 0 32px' }}>
          <span style={{
            display: 'inline-block',
            fontSize: 'clamp(11px, 2.8vw, 13px)',
            fontFamily: 'Jost, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#1a1010',
            background: 'rgba(180,130,100,0.12)',
            border: '1px solid rgba(180,130,100,0.30)',
            borderRadius: 100,
            padding: '5px 14px',
          }}>
            2 cycles suffisent
          </span>
        </div>
      </>)}
      {block(5, <p style={S}><B>Imagine</B> maintenant… quelque chose qui <B>descend</B> doucement sous toi.</p>)}
      {block(6, <p style={S}>Comme des <B>racines</B>. Elles <B>s'enfoncent</B>… tranquillement.</p>)}
      {block(7, <p style={S}>Et à chaque <B>expiration</B>… tu peux laisser ton <B>poids descendre</B> un peu plus.</p>)}
      {block(8, <p style={{ ...S, fontStyle: 'normal', fontWeight: 500, fontSize: 'clamp(20px, 5vw, 25px)', margin: '0 0 40px' }}><B>Rien à faire</B> de plus. <B>Juste resentir.</B></p>)}

      {/* CTA */}
      <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= 9), pointerEvents: phase >= 9 ? 'auto' : 'none' }}>
        <PrimaryButton onClick={onNext}>Je continue</PrimaryButton>
      </div>
    </div>
  )
}

// ── Rituel guidé — Tige ────────────────────────────────────────────────────

function TigeGuidedRituel({ onNext, onBack }) {
  const [phase, setPhase] = useState(0)
  const phaseRefs = useRef({})

  useEffect(() => {
    const T = [0, 150, 300, 450, 600, 750, 900, 1050]
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
          Ton deuxième rituel
        </p>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(30px, 7.5vw, 40px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#1a1a2a',
          lineHeight: 1.15,
          margin: '0 0 10px',
        }}>
          ta tige
        </h2>
        <div style={{
          width: 48,
          height: 2,
          background: 'linear-gradient(to right, transparent, #7a9ab0, transparent)',
          margin: '0 auto',
        }} />
      </div>

      {block(1, <p style={S}>Tiens-toi <B>debout</B>, ou assis·e, le dos naturellement <B>droit</B>. Sans forcer.</p>)}
      {block(2, <>
        <p style={S}>Imagine une <B>ligne</B> qui part de ton bassin jusqu'au sommet de ta <B>tête</B>.</p>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '-16px 0 32px' }}>
          <span style={{
            display: 'inline-block',
            fontSize: 'clamp(11px, 2.8vw, 13px)',
            fontFamily: 'Jost, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#1a1010',
            background: 'rgba(100,150,180,0.10)',
            border: '1px solid rgba(100,150,180,0.28)',
            borderRadius: 100,
            padding: '5px 14px',
          }}>
            comme une tige
          </span>
        </div>
      </>)}
      {block(3, <p style={S}>À chaque <B>inspiration</B>, laisse cette ligne s'étirer <B>légèrement</B>.</p>)}
      {block(4, <p style={S}>À chaque <B>expiration</B>, relâche toute <B>tension inutile</B>.</p>)}
      {block(5, <p style={S}>Balance doucement ton corps de quelques millimètres, <B>d'avant en arrière</B>…</p>)}
      {block(6, <p style={S}>puis trouve ton <B>point d'équilibre</B>.</p>)}
      {block(7, <p style={{ ...S, fontStyle: 'normal', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 25px)', margin: '0 0 40px' }}>Ton corps retrouve son axe.</p>)}

      {/* CTA */}
      <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= 8), pointerEvents: phase >= 8 ? 'auto' : 'none' }}>
        <PrimaryButton onClick={onNext}>Je continue</PrimaryButton>
      </div>
    </div>
  )
}

// ── Rituel guidé — Feuilles ────────────────────────────────────────────────

function FeuillesGuidedRituel({ onNext, onBack }) {
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
          Ton troisième rituel
        </p>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(30px, 7.5vw, 40px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#1a2a1a',
          lineHeight: 1.15,
          margin: '0 0 10px',
        }}>
          tes feuilles
        </h2>
        <div style={{
          width: 48, height: 2,
          background: 'linear-gradient(to right, transparent, #7aaa88, transparent)',
          margin: '0 auto',
        }} />
      </div>

      {block(1, <p style={S}>Prends un instant. <B>Qu'est-ce qui est là</B>, en ce moment ?</p>)}
      {block(2, <p style={S}>Une émotion. Une sensation. Une pensée qui tourne.</p>)}
      {block(3, <>
        <p style={S}><B>Nomme-la</B> intérieurement. Sans la juger.</p>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '-16px 0 32px' }}>
          <span style={{
            display: 'inline-block',
            fontSize: 'clamp(11px, 2.8vw, 13px)',
            fontFamily: 'Jost, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#1a1010',
            background: 'rgba(90,160,110,0.10)',
            border: '1px solid rgba(90,160,110,0.28)',
            borderRadius: 100,
            padding: '5px 14px',
          }}>
            juste un mot suffit
          </span>
        </div>
      </>)}
      {block(4, <p style={S}>Maintenant, <B>observe-la</B>.</p>)}
      {block(5, <p style={S}>Comme un <B>nuage qui passe</B> dans le ciel.</p>)}
      {block(6, <p style={S}>Ne cherche pas à la changer. Ne la retiens pas. <B>Laisse-la traverser.</B></p>)}
      {block(7, <p style={{ ...S, fontStyle: 'normal', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 25px)', margin: '0 0 20px' }}>Ce que tu ressens peut passer.</p>)}
      {block(8, <p style={{ ...S, fontStyle: 'normal', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 25px)', margin: '0 0 40px' }}>Tu n'as rien à retenir.</p>)}

      <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= 9), pointerEvents: phase >= 9 ? 'auto' : 'none' }}>
        <PrimaryButton onClick={onNext}>Je continue</PrimaryButton>
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

function SouffleGuidedRituel({ onNext, onBack }) {
  const [phase, setPhase] = useState(0)
  const phaseRefs = useRef({})

  useEffect(() => {
    const T = [0, 2000, 4000, 6000, 8000, 10000, 12000, 15000, 15500]
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
          Ton cinquième rituel
        </p>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(30px, 7.5vw, 40px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#2a1a08',
          lineHeight: 1.15,
          margin: '0 0 10px',
        }}>
          ton souffle
        </h2>
        <div style={{
          width: 48, height: 2,
          background: 'linear-gradient(to right, transparent, #c8a870, transparent)',
          margin: '0 auto',
        }} />
      </div>

      {block(1, <p style={S}>Pense à <B>quelqu'un</B>.<br />Proche… ou plus lointain.</p>)}
      {block(2, <p style={S}>Quelqu'un à qui tu pourrais envoyer <B>quelque chose de doux</B>.</p>)}
      {block(3, <p style={S}>Garde cette personne <B>en tête</B>.</p>)}
      {block(4, <p style={S}>Inspire <B>doucement</B>.</p>)}
      {block(5, <p style={S}>Et à l'expiration…<br />laisse ton attention <B>aller vers elle</B>.</p>)}
      {block(6, <p style={S}>Sans mots.<br />Juste une <B>intention</B>.</p>)}
      {block(7, <p style={S}>Ce <B>geste invisible</B> est réel.</p>)}
      {block(8, <p style={{ ...S, fontStyle: 'normal', fontWeight: 700, fontSize: 'clamp(20px, 5vw, 25px)', margin: '0 0 40px' }}>Ton souffle <B>relie</B>. Toujours.</p>)}

      <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= 9), pointerEvents: phase >= 9 ? 'auto' : 'none' }}>
        <PrimaryButton onClick={onNext}>Je continue</PrimaryButton>
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

  const health = plantData?.health ?? 35
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
          <div style={{ flex: 1, margin: 4, borderRadius: 32, overflow: 'hidden', background: '#0a1628' }}>
            {feature.image ? (
              <img src={feature.image} alt={feature.label} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'top', display: 'block', background: '#fff' }} />
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

      {/* Phrase intermédiaire */}
      <p style={{ ...S, ...fadeIn(phase >= 3) }}>
        D'autres vivent aussi des moments comme celui-ci.
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
            opacity: phase >= 4 ? 1 : 0,
            transform: phase >= 4 ? 'translateY(0)' : 'translateY(9px)',
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

  const currentTwText = twSlides[twIdx] ?? ''

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
        const text          = i < twIdx ? slide : slide.slice(0, charIdx)
        const isAttribution = slide.startsWith('—')
        const isTyping      = i === twIdx && !done && !pausing
        return (
          <p key={typewriterFrom + i} style={{
            ...PS,
            fontStyle:     isAttribution ? 'normal' : 'italic',
            fontSize:      isAttribution ? 'clamp(11px, 2.8vw, 13px)' : PS.fontSize,
            fontWeight:    isAttribution ? 500 : 400,
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

function RacinesValidation({ answers, onNext, onBack, onScreenChange }) {
  useEffect(() => { onScreenChange?.('validation') }, [])
  const [subSlide, setSubSlide] = useState(0)
  const [phase,    setPhase]    = useState(0)
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

  const S = {
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontStyle: 'italic',
    fontSize: 'clamp(19px, 4.8vw, 23px)',
    color: '#0f0808',
    textAlign: 'center',
    lineHeight: 1.85,
    margin: '0 0 32px',
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
            Ce qui vient de se passer
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
            margin: '8px auto 40px',
          }} />
        </>)}

        {block(hasBarometer ? 5 : 4, (
          <p style={{ ...S, fontStyle: 'normal', fontWeight: 700, fontSize: 'clamp(21px, 5.2vw, 26px)', margin: '0 0 48px' }}>
            Et ce n'est que le début.
          </p>
        ))}

        <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= ctaPhase), pointerEvents: phase >= ctaPhase ? 'auto' : 'none' }}>
          <PrimaryButton onClick={() => { setSubSlide(1) }}>Je continue…</PrimaryButton>
        </div>
      </div>
    )
  }

  /* ── Slide 8 ── */
  const S8 = { ...S, fontSize: 'clamp(20px, 5.5vw, 28px)', lineHeight: 1.6, margin: '0 0 10px' }
  return (
    <div style={{ padding: '24px 20px 60px', textAlign: 'center' }}>

      {block(1, <p style={S8}>Aujourd'hui, tu as commencé à <B>t'écouter</B>.</p>)}
      {block(2, <p style={S8}>Mais ton équilibre ne peut pas encore <B>apparaître</B>.</p>)}
      {block(3, <p style={{ ...S8, margin: '0 0 24px' }}>
        Demain, tu vas activer une autre partie de toi.<br /><B>Et c'est là que quelque chose évolue.</B>
      </p>)}

      <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= 4), pointerEvents: phase >= 4 ? 'auto' : 'none' }}>
        <PrimaryButton onClick={onNext}>Continuer demain</PrimaryButton>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4b. HelpBandeau — bandeau bas + panneau d'aide qui glisse vers le haut
//     Position : 3ème enfant flex du wof-modal (après hero + scroll)
//     Overlay/panneau en position:absolute dans le modal (position:relative)
// ─────────────────────────────────────────────────────────────────────────────

function HelpBandeau({ helpText }) {
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
                  src="/instructeur1.png"
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
          src="/bandeau2.png"
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
    const skip = dayConfig.accueil?.layout === 'slide1' && step === 2
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
    setStep(2)
    setAnimKey((k) => k + 1)
    notifyScreen('rituel_transition')
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
      {step === 1 && (
        <DayIntrospection
          data={dayConfig.introspection}
          onAnswer={handleAnswer}
          onBack={goBack}
          onScreenChange={notifyScreen}
        />
      )}
      {step === 2 && showRitualVideo && (
        <RitualVideoSlide
          src={dayConfig.videoAfterRitual}
          onContinue={advance}
        />
      )}
      {step === 2 && !showRitualVideo && (
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
      {step === 3 && dayConfig.guidedValidation && (
        <RacinesValidation
          answers={answers}
          onNext={handleDayDone}
          onBack={goBack}
          onScreenChange={notifyScreen}
        />
      )}
      {step === 3 && !dayConfig.guidedValidation && dayConfig.traceSlides && dayConfig.typewriterTrace && (
        <TypewriterSlides
          slides={typeof dayConfig.traceSlides === 'function' ? dayConfig.traceSlides(answers) : dayConfig.traceSlides}
          typewriterFrom={dayConfig.traceTypewriterFrom ?? 0}
          ctaLabel="Continuer"
          onNext={advance}
          onScreenChange={notifyScreen}
          screenName={dayConfig.traceName ?? 'trace'}
        />
      )}
      {step === 3 && !dayConfig.guidedValidation && dayConfig.traceSlides && !dayConfig.typewriterTrace && (
        <MultiPhaseOuverture
          slides={typeof dayConfig.traceSlides === 'function' ? dayConfig.traceSlides(answers) : dayConfig.traceSlides}
          ctaLabel="Continuer"
          onNext={advance}
          onScreenChange={notifyScreen}
          screenName={dayConfig.traceName ?? 'trace'}
        />
      )}
      {step === 3 && !dayConfig.guidedValidation && !dayConfig.traceSlides && (
        <DayTrace
          text={traceText}
          onNext={advance}
          onBack={goBack}
          onFleur={undefined}
          onScreenChange={notifyScreen}
        />
      )}
      {step === 4 && dayConfig.ouvertureSlides && (
        <MultiPhaseOuverture
          slides={dayConfig.ouvertureSlides}
          ctaLabel={dayConfig.finalCTA}
          onNext={handleDayDone}
          onScreenChange={notifyScreen}
        />
      )}
      {step === 4 && !dayConfig.ouvertureSlides && (
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
function FleurDiscoveryModal({ onClose }) {
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
      } catch (_) {}
    })()
  }, [userId])

  const health = plantData?.health ?? 35
  const gardenSettings = settings ? {
    ...DEFAULT_GARDEN_SETTINGS,
    petalColor1: settings.petal_color1 ?? DEFAULT_GARDEN_SETTINGS.petalColor1,
    petalColor2: settings.petal_color2 ?? DEFAULT_GARDEN_SETTINGS.petalColor2,
    petalShape:  settings.petal_shape  ?? DEFAULT_GARDEN_SETTINGS.petalShape,
  } : DEFAULT_GARDEN_SETTINGS

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
        <p style={{ ...fadeIn(phase >= 2), fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 600, color: '#1a1208', lineHeight: 1.6, textAlign: 'center', margin: '0 0 16px' }}>
          Chaque rituel nourrit une zone — et change la forme de ta fleur.
        </p>

        {/* Barres de zones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, ...fadeIn(phase >= 3) }}>
          {ZONE_KEYS_DISC.map((z, i) => {
            const pct = plantData?.[z.key] ?? 35
            return (
              <div key={z.key} style={{
                opacity: phase >= 3 ? 1 : 0,
                transform: phase >= 3 ? 'translateY(0)' : 'translateY(6px)',
                transition: `opacity 400ms ease ${i * 80}ms, transform 400ms ease ${i * 80}ms`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13 }}>{z.emoji}</span>
                    <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 700, color: '#000', letterSpacing: '0.03em' }}>{z.label}</span>
                  </div>
                  <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 800, color: z.color, textShadow: 'none' }}>{Math.round(pct)}%</span>
                </div>
                <div style={{ height: 9, borderRadius: 6, background: 'rgba(0,0,0,0.10)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 6,
                    background: `linear-gradient(90deg, ${z.color}bb, ${z.color})`,
                    width: `${pct}%`,
                    transition: `width 800ms cubic-bezier(0.34,1.2,0.64,1) ${400 + i * 100}ms`,
                    boxShadow: `0 0 8px ${z.color}55`,
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Bouton fermer */}
        <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= 3) }}>
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

function GardenDashboard({ completedDays, completionDates = {}, onContinue, onOpenZone, onClose, onSignOut, petalColor1, petalColor2, plantHealth, isPro, onOpenProProfile, onReplayDay }) {
  const [showFleurModal, setShowFleurModal] = useState(false)
  const [showRituelHint, setShowRituelHint] = useState(false)

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

      {showFleurModal && <FleurDiscoveryModal onClose={() => setShowFleurModal(false)} />}

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
    <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
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

      {/* Bouton fermeture */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          onClick={onClose}
          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(16px, 4vw, 19px)', color: '#1a1010', background: 'rgba(255,255,255,0.90)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 100, padding: '11px 32px', cursor: 'pointer', letterSpacing: '0.04em', transition: 'all 0.2s ease', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
        >
          {lastCompleted >= 7 ? 'À très bientôt' : 'À demain'}
        </button>
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
function WelcomeVeil({ onDone }) {
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    // Précharger le MP4 en parallèle
    const video = document.createElement('video')
    video.src = '/accueil2.mp4'
    video.preload = 'auto'

    const t1 = setTimeout(() => setOpacity(0), 4000)
    const t2 = setTimeout(() => onDone(), 5200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 250,
      background: 'linear-gradient(160deg, #0c1a0a, #1a2e10)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity, transition: 'opacity 1.2s ease',
      padding: '32px 24px',
    }}>
      <style>{`
        @keyframes wvFloat {
          0%   { opacity:0; transform:translateY(0) scale(0.8); }
          30%  { opacity:0.6; }
          70%  { opacity:0.3; }
          100% { opacity:0; transform:translateY(-80px) scale(1.1); }
        }
        @keyframes wvPulse {
          0%,100% { opacity:0.12; transform:scale(1); }
          50%     { opacity:0.28; transform:scale(1.08); }
        }
        @keyframes wvTextIn {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .wv-spark { position:absolute; border-radius:50%; pointer-events:none; }
      `}</style>

      {/* Lueur centrale */}
      <div style={{
        position:'absolute', width:320, height:320, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(168,224,64,0.10) 0%, transparent 70%)',
        animation:'wvPulse 3s ease-in-out infinite',
      }}/>

      {/* Particules */}
      {[
        { left:'18%', top:'22%', size:5, delay:'0s',   dur:'3.2s' },
        { left:'78%', top:'18%', size:4, delay:'.7s',  dur:'2.8s' },
        { left:'55%', top:'72%', size:6, delay:'1.2s', dur:'3.5s' },
        { left:'28%', top:'68%', size:3, delay:'.4s',  dur:'2.6s' },
        { left:'82%', top:'52%', size:5, delay:'1.5s', dur:'4s'   },
        { left:'12%', top:'48%', size:4, delay:'.9s',  dur:'3s'   },
      ].map((p, i) => (
        <div key={i} className="wv-spark" style={{
          left:p.left, top:p.top,
          width:p.size, height:p.size,
          background:'rgba(168,224,64,0.50)',
          animation:`wvFloat ${p.dur} ease-out ${p.delay} infinite`,
        }}/>
      ))}

      {/* Image + Phrase */}
      <div style={{
        position:'relative', zIndex:1, textAlign:'center', maxWidth:340,
        animation:'wvTextIn 1.2s cubic-bezier(.22,1,.36,1) .4s both',
        display:'flex', flexDirection:'column', alignItems:'center', gap:20,
      }}>
        <img
          src="/barriere.png"
          alt=""
          style={{ width:'clamp(180px, 55vw, 280px)', height:'auto', objectFit:'contain', filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.35))' }}
        />
        <div style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize: 'clamp(24px, 6vw, 32px)',
          fontWeight:300, fontStyle:'italic',
          color:'rgba(230,220,200,0.88)',
          lineHeight:1.4,
        }}>
          Poussons ensemble la petite barrière de ce jardin…
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
  const [phase, setPhase] = useState(0)
  const [muted, setMuted] = useState(true)
  const videoRef = useRef(null)

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
        <video
          ref={videoRef}
          src="/accueil2.mp4"
          autoPlay
          playsInline
          muted
          loop
          style={{ width: '100%', height: 'auto', display: 'block' }}
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
            onClick={() => {
              setMuted(false)
              if (videoRef.current) {
                videoRef.current.muted = false
                videoRef.current.currentTime = 0
                videoRef.current.play()
              }
            }}
            style={{
              width: 72, height: 72, borderRadius: 50,
              background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.5)',
              backdropFilter: 'blur(6px)',
              cursor: 'pointer', fontSize: 32, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
          >{muted ? '🔇' : '🔊'}</button>
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
        const { data: existing } = await supabase
          .from('plants')
          .select('health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle()
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
 console.log('🔍 WeekOneFlow useEffect — userId:', userId)

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
console.log('✅ Données chargées:', data.week_one_data)
  console.log('✅ completedDays:', data.week_one_data.completedDays)

      const saved = data.week_one_data
      setWeekData(saved)
      weekDataRef.current = saved
      if (saved.completedDays?.length > 0) {
        setView('garden')
        setShowWelcome(false)
      }
    } else {
console.log('❌ Pas de données ou erreur:', error)

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
        currentDay: d.completedDays.length > 0
          ? Math.min(Math.max(...d.completedDays) + 1, 7)
          : 1
      }))
      setView('garden')
      return
    }

    const dayNum  = current.currentDay
    const nextDay = Math.min(dayNum + 1, 7)
    const today   = new Date().toISOString().split('T')[0]
    const updated = {
      ...current,
      currentDay:    nextDay,
      completedDays: current.completedDays.includes(dayNum)
        ? current.completedDays
        : [...current.completedDays, dayNum],
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
            const { data: existing } = await supabase
              .from('plants')
              .select('health, zone_racines, zone_tige, zone_feuilles, zone_fleurs, zone_souffle')
              .eq('user_id', userId)
              .eq('date', today)
              .maybeSingle()

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
          ;(async () => { try { await supabase.from('profiles').update({ week_one_data: updated }).eq('id', userId) } catch (_) {} })()
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
        {/* WelcomeWeekOne monte sous le voile — timers démarrent immédiatement */}
        {showWelcome && <WelcomeWeekOne onStart={() => setShowWelcome(false)} />}
        {/* Voile par-dessus — se dissout quand les boutons sont prêts */}
        {showVeil && <WelcomeVeil onDone={() => setShowVeil(false)} />}
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
            height: view === 'garden' ? 0 : isMobile ? '36%' : '40%',
            minHeight: view === 'garden' ? 0 : undefined,
            position: 'relative',
            overflow: 'hidden',
            visibility: view === 'garden' ? 'hidden' : 'visible',
          }}>
            <img
              src="/champs.png"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }}
            />

            {/* Fondu bas */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 50%, #faf5f2 100%)',
              pointerEvents: 'none',
            }}/>

            {/* Barre de progression en overlay haut */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', gap: 3 }}>
              {WEEK_ONE_DATA.map((d) => {
                const done   = weekData.completedDays.includes(d.day)
                const active = d.day === weekData.currentDay
                return (
                  <div key={d.day} style={{
                    flex: 1, height: 3,
                    background: done ? (d.color || accentColor) : active ? `${d.color || accentColor}88` : 'rgba(255,255,255,0.35)',
                    transition: 'background .4s ease',
                  }}>
                    {active && <div style={{ height: '100%', background: d.color || accentColor, animation: 'progressBar .3s ease both' }}/>}
                  </div>
                )
              })}
            </div>


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

            {/* Tag jour + compteur en overlay bas */}
            <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase',
                color: accentColor, fontWeight: 600, padding: '4px 12px', borderRadius: 100,
                background: 'rgba(255,255,255,0.82)', border: `1px solid ${accentColor}40`,
                backdropFilter: 'blur(6px)', fontFamily: 'Jost, sans-serif',
              }}>
                {currentConfig.title}
              </span>
              {currentScreen === 'accueil_intro' && currentConfig.accueil?.timeBadge ? (
                <span className="time-badge-pulse" style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 12, fontWeight: 600,
                  color: '#7a4858',
                  background: 'rgba(255,255,255,0.92)',
                  border: '1.5px solid rgba(200,160,176,0.5)',
                  padding: '5px 14px', borderRadius: 100,
                  backdropFilter: 'blur(4px)',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}>
                  {currentConfig.accueil.timeBadge}
                </span>
              ) : (() => {
                const slideKeys = Object.keys(currentConfig.helpTexts || {})
                const slideIdx  = slideKeys.indexOf(currentScreen)
                const slideNum  = slideIdx >= 0 ? slideIdx + 1 : 1
                const total     = slideKeys.length || 1
                return (
                  <span style={{
                    fontSize: 11, color: 'rgba(60,50,40,0.55)', letterSpacing: '.08em',
                    background: 'rgba(255,255,255,0.70)', padding: '3px 10px', borderRadius: 100,
                    backdropFilter: 'blur(4px)', fontFamily: 'Jost, sans-serif',
                  }}>
                    {String(slideNum).padStart(2,'0')} / {String(total).padStart(2,'0')}
                  </span>
                )
              })()}
            </div>
          </div>

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

          {/* ── HelpBandeau — dernier enfant flex du modal, collé en bas ── */}
          {view !== 'garden' && (() => {
            const helpText = currentConfig.helpTexts?.[currentScreen]
            return <HelpBandeau key={`${currentConfig.day}-${currentScreen}`} helpText={helpText} />
          })()}

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

