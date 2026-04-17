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
  corps:         'mon corps',
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
  avec_moi:      'avec vous-même',
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
      pauseSeconds: 1,
    },
    introspection: {
      question: 'Comment vous sentez-vous là, maintenant ?',
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
            "Ce que vous ressentez peut être lourd aujourd'hui.",
            "Et dans ces moments-là,\nce n'est pas ce qui est visible\nqui a le plus besoin d'attention…",
            "mais ce qui soutient tout le reste.",
            "Comme une plante, il existe en vous\nune base invisible\nqui influence votre équilibre.",
            "On va commencer doucement, par là.",
          ],
        }
        if (feel === 'neutre') return {
          ctaLabel: 'Explorer mes racines',
          lines: [
            "Ce que vous ressentez est peut-être\ndifficile à définir aujourd'hui.",
            "Ni vraiment mal…\nni vraiment bien.",
            "C'est souvent dans ces moments-là\nque quelque chose peut commencer à s'éclaircir.",
            "Comme une plante, il existe en vous\nune base invisible\nqui soutient tout le reste.",
            "On va simplement s'en rapprocher.",
          ],
        }
        return {
          ctaLabel: 'Approfondir mes racines',
          lines: [
            "Vous portez quelque chose de plus calme aujourd'hui.",
            "C'est un terrain favorable.",
            "Comme une plante, il existe en vous\nune base invisible\nqui soutient tout le reste.",
            "Quand le terrain est accueillant,\nles racines peuvent s'approfondir.",
            "On va simplement les laisser faire.",
          ],
        }
      },
      isGuided: true,
    },
    guidedValidation: true,
    getTrace: (ans) =>
      `Vous vous sentiez ${labelFor(ans?.j1?.feel)}. Et vous avez quand même pris ce moment.`,
    ouverture: 'Demain, vous découvrirez ce qui vous porte, même quand vous vacillez.',
    helpTexts: {
      accueil:       "Chaque jour commence par un moment d'accueil.\n\nCe n'est pas un test — c'est une invitation à revenir à vous-même.\n\nIl n'y a pas de bonne ou mauvaise façon d'être là.",
      introspection: "Le baromètre n'est pas un jugement — c'est un relevé.\n\nNommer ce que vous ressentez, même vaguement, est déjà un acte de conscience.",
      rituel:        "Les racines sont ce qui ne se voit pas.\n\nElles représentent votre sentiment de sécurité fondamentale — votre rapport au corps, à la terre, au présent.\n\nPrendre soin de ses racines, c'est revenir à l'essentiel : respirer, sentir, être là.",
      trace:         "Ce que vous notez ici ne disparaît pas.\n\nVotre trace devient la mémoire vivante de votre parcours — elle sera là pour vous dans les jours difficiles.",
      ouverture:     "Chaque fin de journée est aussi un seuil.\n\nVous avez posé la première pierre. Demain, une autre vous attend.",
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
      headline: "Vous êtes revenu·e. Votre jardin s'en souvient.",
      subtitle: 'La continuité est une forme de soin.',
      pauseSeconds: 1,
      getPreviousNote: (ans) => {
        const feel = ans?.j1?.feel
        if (feel === 'fatigue')  return "Hier, vous portiez de la fatigue. Vous êtes revenu·e quand même."
        if (feel === 'stresse')  return "Hier, quelque chose vous pesait. Et vous avez choisi de revenir."
        if (feel === 'neutre')   return "Hier, vous étiez dans un entre-deux. Ce retour commence peut-être autrement."
        if (feel === 'calme')    return "Hier, vous étiez calme. Ce terrain mérite qu'on continue de le cultiver."
        if (feel === 'bien')     return "Hier, vous alliez bien. Voyons ce que ce nouveau jour apporte de plus."
        return null
      },
    },
    introspection: {
      question: 'Votre énergie en ce moment est plutôt…',
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
            "Votre énergie est basse aujourd'hui.",
            "La tige ne vous demande pas d'aller loin.",
            "Juste de trouver un appui. Un contact.",
            "Ce qui vous porte, même dans les jours difficiles.",
            "On va commencer par là.",
          ],
        }
        if (energy === 'correcte') return {
          ctaLabel: 'Retrouver mon centre',
          lines: [
            "Vous êtes là. C'est l'essentiel.",
            "La tige est ce qui relie.",
            "Elle n'a pas besoin d'être parfaite pour tenir.",
            "On va simplement y revenir.",
          ],
        }
        return {
          ctaLabel: 'Approfondir mon ancrage',
          lines: [
            "Votre énergie est bien présente aujourd'hui.",
            "C'est un bon moment pour s'ancrer davantage.",
            "La tige grandit quand on lui donne de l'attention.",
            "On va l'utiliser.",
          ],
        }
      },
      isGuided: 'tige',
    },
    getTrace: (ans) => {
      const energy = ans?.j2?.energy
      return energy
        ? `Votre énergie était ${labelFor(energy)} aujourd'hui. Vous êtes revenu·e malgré tout.`
        : "Vous avez été présent·e deux jours de suite. Votre tige commence à tenir."
    },
    ouverture: 'Juste revenir… suffit. À demain.',
    helpTexts: {
      accueil:       "Vous revenez. C'est déjà beaucoup.\n\nChaque retour, même hésitant, construit quelque chose de réel.\n\nLa régularité n'est pas une contrainte — c'est le soin que vous vous offrez.",
      introspection: "Remarquer un changement — même minime — c'est affiner votre capacité d'attention.\n\nVous n'avez pas à ressentir quelque chose de spectaculaire. La subtilité compte autant.",
      rituel:        "La tige est le lien entre le bas et le haut — entre ce qui vous ancre et ce qui vous ouvre.\n\nElle représente votre capacité à vous tenir debout face aux mouvements de la vie, sans rigidité.\n\nUne tige saine est à la fois ferme et souple.",
      trace:         "Écrire après une pratique permet de laisser une empreinte dans la mémoire.\n\nMême quelques mots posés honnêtement ont plus de valeur que de longs discours.",
      ouverture:     "Deux jours. Vous revenez. Votre tige commence à tenir.\n\nDemain, quelque chose de plus délicat vous sera proposé.",
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
      subtitle: "Regarder sans juger — c'est déjà beaucoup.",
      pauseSeconds: 1,
      getNarrativeNote: (ans) => {
        const feel   = ans?.j1?.feel
        const energy = ans?.j2?.energy
        if (!feel && !energy) return null

        const feelPart = {
          fatigue:  "vous portiez de la fatigue",
          stresse:  "quelque chose vous pesait",
          neutre:   "vous étiez dans un entre-deux",
          calme:    "vous étiez calme",
          bien:     "vous alliez bien",
        }[feel]

        const energyPart = {
          vide:     "votre énergie s'est faite absente",
          basse:    "votre énergie est restée discrète",
          correcte: "votre énergie était là",
          bonne:    "votre énergie était bien présente",
          vive:     "vous étiez pleinement vivant·e",
        }[energy]

        if (feelPart && energyPart)
          return `Ces deux derniers jours, ${feelPart}, puis ${energyPart}. Quelque chose commence à se dessiner.`
        if (feelPart)
          return `Avant-hier, ${feelPart}. Aujourd'hui, on regarde un peu plus loin.`
        return `Hier, ${energyPart}. Posons aujourd'hui un regard différent.`
      },
    },
    introspection: {
      question: "Qu'est-ce qui prend le plus de place en vous aujourd'hui ?",
      answerKey: 'space',
      layout: 'column',
      choices: [
        { label: 'Le travail',    emoji: '💼', value: 'travail'   },
        { label: 'Les relations', emoji: '🤝', value: 'relations' },
        { label: 'Mon corps',     emoji: '🧘', value: 'corps'     },
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
          fatigue:  "Vous portez quelque chose de lourd en ce moment.",
          stresse:  "Il y a de l'agitation en vous aujourd'hui.",
          neutre:   "Vous êtes dans un entre-deux.",
          calme:    "Il y a du calme en vous.",
          bien:     "Vous vous sentez bien.",
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
            `Ce qui occupe votre espace… c'est ${labelFor(space)}.`,
            "Les feuilles reçoivent sans juger.",
            "Elles captent la lumière autant que l'ombre.",
            "On va simplement regarder ce qui est là.",
          ],
        }
      },
      isGuided: 'feuilles',
    },
    getTrace: (ans) => {
      const space = ans?.j3?.space
      return space
        ? `Ce qui prenait le plus de place : ${labelFor(space)}. Vous l'avez observé sans le fuir.`
        : "Vous avez nommé quelque chose. C'est plus courageux qu'il n'y paraît."
    },
    ouverture: 'Demain, vous allez vous accorder quelque chose de rare.',
    helpTexts: {
      accueil:       "Regarder sans juger est l'une des choses les plus difficiles… et les plus transformatrices.\n\nCette semaine vous invite à observer ce qui est là, sans chercher à le changer.",
      introspection: "Se voir tel qu'on est demande du courage.\n\nCe n'est pas de la complaisance — c'est le début de toute transformation réelle.",
      rituel:        "Les feuilles sont en perpétuel mouvement — elles reçoivent, filtrent, laissent passer.\n\nElles symbolisent votre capacité à accueillir ce qui arrive sans tout retenir.\n\nLaisser traverser n'est pas de l'indifférence — c'est une forme de sagesse.",
      trace:         "Vous avez nommé quelque chose aujourd'hui.\n\nC'est plus courageux qu'il n'y paraît — mettre des mots sur ce qu'on voit en soi, c'est déjà commencer à le transformer.",
      ouverture:     "Trois jours d'observation.\n\nDemain, vous allez vous accorder quelque chose de rare : de l'espace.",
    },
  },

  /* ── JOUR 4 ─────────────────────────────────────────────────────────────── */
  {
    day: 4,
    title: "Je m'accorde de l'espace",
    color: '#d4a0b0',
    accueil: {
      conditioning: true,
      headline: 'Vous pouvez ralentir ici.',
      subtitle: 'Ce moment vous appartient entièrement.',
      pauseSeconds: 1,
      getNarrativeNote: (ans) => {
        const space  = ans?.j3?.space
        const energy = ans?.j2?.energy

        const spacePart = {
          travail:   "le travail occupait votre espace",
          relations: "les relations prenaient beaucoup de place",
          corps:     "votre corps demandait de l'attention",
          pensees:   "vos pensées tournaient en boucle",
          avenir:    "l'avenir accaparait vos pensées",
        }[space]

        const energyPart = {
          vide:     "à vide",
          basse:    "avec peu d'énergie",
          correcte: "dans un élan correct",
          bonne:    "avec une belle énergie",
          vive:     "avec beaucoup de vivacité",
        }[energy]

        if (spacePart && energyPart)
          return `Hier, ${spacePart}. Vous étiez ${energyPart}. Aujourd'hui, vous pouvez ralentir.`
        if (spacePart)
          return `Hier, ${spacePart}. Ce moment est fait pour déposer tout ça.`
        if (energyPart)
          return `Ces derniers jours, vous avanciez ${energyPart}. Aujourd'hui, c'est différent.`
        return null
      },
    },
    introspection: {
      question: "De quoi auriez-vous besoin aujourd'hui ?",
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
          fatigue:  "Vous portez de la fatigue aujourd'hui.",
          stresse:  "Il y a de la tension en vous.",
          neutre:   "Vous êtes dans un état neutre.",
          calme:    "Il y a du calme en vous.",
          bien:     "Vous vous sentez bien.",
        }[feel]

        const opener = feelLine ? [feelLine] : []

        if (need === 'silence') return {
          ctaLabel: 'Entrer dans le silence',
          lines: [
            ...opener,
            "Vous avez besoin de silence.",
            "Les fleurs s'ouvrent dans le calme.",
            "Ce scan corporel va créer cet espace pour vous.",
            "Rien à produire. Juste à recevoir.",
          ],
        }
        if (need === 'douceur') return {
          ctaLabel: 'Recevoir de la douceur',
          lines: [
            ...opener,
            "Vous avez besoin de douceur.",
            "Les fleurs s'ouvrent quand elles sont accueillies.",
            "Ce moment est entièrement pour vous.",
            "Laissez-vous simplement traverser.",
          ],
        }
        if (need === 'mouvement') return {
          ctaLabel: 'Traverser mon corps',
          lines: [
            ...opener,
            "Vous avez besoin de mouvement.",
            "Ce scan vous invite à parcourir votre corps.",
            "Une façon douce de bouger… de l'intérieur.",
          ],
        }
        if (need === 'clarte') return {
          ctaLabel: 'Chercher la clarté',
          lines: [
            ...opener,
            "Vous cherchez de la clarté.",
            "Parfois, elle vient quand on s'arrête de chercher.",
            "Ce scan va vous ramener dans le corps.",
            "C'est souvent là qu'elle attend.",
          ],
        }
        return {
          ctaLabel: "M'offrir de l'espace",
          lines: [
            ...opener,
            `Vous avez besoin ${labelFor(need)}.`,
            "Les fleurs ne s'ouvrent que quand elles ont de l'espace.",
            "C'est ce que vous allez vous offrir maintenant.",
          ],
        }
      },
      isGuided: 'fleurs',
    },
    getTrace: (ans) => {
      const need = ans?.j4?.need
      return need
        ? `Vous aviez besoin ${labelFor(need)}. Vous vous l'êtes accordé.`
        : "Vous venez de vous accorder de l'espace. Même peu… compte."
    },
    ouverture: 'Demain, quelque chose de nouveau entre dans votre jardin.',
    helpTexts: {
      accueil:       "Ralentir n'est pas reculer.\n\nDans notre culture, nous valorisons l'action. Mais c'est souvent dans le ralentissement que les choses trouvent leur juste place.",
      introspection: "Ce que vous choisissez d'explorer aujourd'hui vous appartient entièrement.\n\nIl n'y a pas de bonne réponse — seulement votre vérité du moment.",
      rituel:        "Les fleurs s'ouvrent quand les conditions sont réunies — elles ne peuvent pas être forcées.\n\nPrendre soin de vos fleurs, c'est créer les conditions de votre propre épanouissement.",
      trace:         "Vous venez de vous accorder de l'espace.\n\nMême peu… compte. Chaque geste de soin envers vous-même laisse une trace que votre corps et votre esprit retiennent.",
      ouverture:     "Quatre jours. Votre jardin intérieur prend forme.\n\nDemain, quelque chose de nouveau entre dans votre espace.",
    },
  },

  /* ── JOUR 5 ─────────────────────────────────────────────────────────────── */
  {
    day: 5,
    title: 'Je crée un lien',
    color: '#c8a870',
    accueil: {
      conditioning: true,
      headline: "Vous n'êtes pas seul·e aujourd'hui.",
      subtitle: 'Le lien commence souvent par un seul geste silencieux.',
      pauseSeconds: 1,
      getNarrativeNote: (ans) => {
        const need  = ans?.j4?.need
        const feel  = ans?.j1?.feel

        const needPart = {
          silence:   "vous aviez besoin de silence",
          mouvement: "votre corps cherchait à bouger",
          douceur:   "vous aviez besoin de douceur",
          clarte:    "vous cherchiez de la clarté",
          connexion: "vous aspiriez à de la connexion",
        }[need]

        const feelPart = {
          fatigue:  "vous étiez fatigué·e",
          stresse:  "quelque chose vous pesait",
          neutre:   "vous étiez dans un entre-deux",
          calme:    "vous étiez calme",
          bien:     "vous alliez bien",
        }[feel]

        if (needPart)
          return `Hier, ${needPart}. Quatre jours que vous revenez. Ce n'est pas rien.`
        if (feelPart)
          return `Au départ, ${feelPart}. Regardez le chemin parcouru depuis.`
        return null
      },
    },
    introspection: {
      question: 'Avez-vous ressenti du lien récemment ?',
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
          fatigue:  "Vous portez de la fatigue aujourd'hui.",
          stresse:  "Il y a de la tension en vous.",
          neutre:   "Vous êtes dans un entre-deux.",
          calme:    "Il y a du calme en vous.",
          bien:     "Vous vous sentez bien.",
        }[feel]

        const opener = feelLine ? [feelLine] : []

        if (connection === 'pas_vraiment') return {
          ctaLabel: 'Créer un geste de lien',
          lines: [
            ...opener,
            "Le lien peut sembler loin en ce moment.",
            "Le souffle ne juge pas.",
            "Il part de vous… et va quelque part.",
            "Ce rituel ne demande rien d'autre que ça.",
          ],
        }
        if (connection === 'un_peu') return {
          ctaLabel: 'Approfondir ce lien',
          lines: [
            ...opener,
            "Vous avez ressenti un peu de lien.",
            "C'est souvent là que tout commence.",
            "Le souffle va l'amplifier doucement.",
          ],
        }
        if (connection === 'avec_quelquun') return {
          ctaLabel: 'Envoyer une pensée douce',
          lines: [
            ...opener,
            "Vous avez ressenti du lien avec quelqu'un.",
            "Ce rituel va prolonger ce geste.",
            "Une pensée envoyée en silence… arrive toujours quelque part.",
          ],
        }
        if (connection === 'avec_moi') return {
          ctaLabel: "Relier vers l'extérieur",
          lines: [
            ...opener,
            "Vous avez ressenti du lien avec vous-même.",
            "C'est la meilleure base qui soit.",
            "Maintenant… envoyons ce lien vers quelqu'un d'autre.",
          ],
        }
        return {
          ctaLabel: 'Laisser le souffle relier',
          lines: [
            ...opener,
            "Vous avez ressenti du lien profondément.",
            "Le souffle est le passage entre l'intérieur et l'extérieur.",
            "Il relie tout. Laissez-le faire.",
          ],
        }
      },
      isGuided: 'souffle',
    },
    getTrace: (ans) => {
      const connection = ans?.j5?.connection
      if (connection === 'pas_vraiment')
        return "Même quand le lien semblait loin… vous avez tendu la main. Les 5 zones sont maintenant actives."
      if (connection === 'avec_moi')
        return "Vous avez pris soin de vous-même, puis de quelqu'un d'autre. Les 5 zones de votre jardin sont actives."
      return "Vous avez pris soin… au-delà de vous. Les 5 zones de votre jardin sont maintenant actives."
    },
    ouverture: "Demain, vous allez voir quelque chose que vous n'avez pas encore vu.",
    helpTexts: {
      accueil:       "Le lien commence souvent par un geste invisible — une attention portée, un espace ouvert.\n\nCe que vous faites ici crée des ondes dans votre façon d'être avec les autres.",
      introspection: "Explorer votre rapport aux autres, c'est aussi mieux vous comprendre vous-même.\n\nLe lien n'est pas une perte de soi — c'est une extension de soi.",
      rituel:        "Le souffle est ce qui relie tout.\n\nIl circule entre vous et le monde, entre vos différentes parties, entre le présent et ce qui vient.\n\nTravailler avec le souffle, c'est apprendre à ne plus lutter contre le cours des choses.",
      trace:         "Vous avez pris soin… au-delà de vous-même.\n\nCe geste, même silencieux, a activé quelque chose dans votre jardin.",
      ouverture:     "Cinq zones. Toutes actives désormais.\n\nDemain, un regard différent vous attend — quelque chose que vous n'avez pas encore vu.",
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
      headline: 'Vos cinq zones sont éveillées.',
      subtitle: 'Votre jardin vous attend maintenant.',
      pauseSeconds: 1,
      getNarrativeNote: (ans) => {
        const connection = ans?.j5?.connection
        const need       = ans?.j4?.need

        const connectionPart = {
          pas_vraiment:  "le lien semblait loin",
          un_peu:        "vous avez ressenti un peu de lien",
          avec_quelquun: "vous avez pensé à quelqu'un",
          avec_moi:      "vous avez pris soin de vous-même",
          profondement:  "vous avez ressenti du lien profondément",
        }[connection]

        const needPart = {
          silence:   "vous cherchiez du silence",
          mouvement: "votre corps demandait à bouger",
          douceur:   "vous aviez besoin de douceur",
          clarte:    "vous cherchiez de la clarté",
          connexion: "vous aspiriez à de la connexion",
        }[need]

        if (connectionPart && needPart)
          return `Hier, ${connectionPart}. Avant-hier, ${needPart}. Cinq jours, cinq zones. Quelque chose s'est éveillé.`
        if (connectionPart)
          return `Hier, ${connectionPart}. Vous avez traversé cinq zones. Votre jardin est prêt.`
        return "Cinq jours. Cinq zones. Ce que vous avez cultivé prend maintenant une forme visible."
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
    getTrace: () =>
      "Aujourd'hui, vous avez rencontré votre fleur. Elle vous attend chaque jour maintenant.",
    ouverture: 'Demain, un dernier regard avant de prendre votre envol.',
    helpTexts: {
      accueil:       "Votre fleur est unique — elle porte votre histoire, vos couleurs, vos nuances.\n\nElle est le reflet de ce que vous avez traversé et de ce que vous portez en vous.",
      introspection: "Certaines choses ne se nomment pas facilement.\n\nPrenez le temps qu'il faut. Ce que vous ressentez est valide, même si les mots manquent.",
      rituel:        "Rencontrer votre fleur, c'est rencontrer une partie de vous-même.\n\nLaissez cette image vous toucher — il n'y a rien à faire, juste à recevoir.",
      trace:         "Vous avez rencontré votre fleur aujourd'hui.\n\nElle vous attend chaque jour maintenant — une présence constante dans votre jardin intérieur.",
      ouverture:     "Six jours. Votre fleur a pris racine.\n\nDemain, un dernier regard — avant de prendre votre envol.",
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
      headline: 'Votre jardin existe.',
      subtitle: 'Mais un jardin ne pousse pas seul.',
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
          ? `Sept jours. Vous avez ressenti ${label}. Il est temps d'aller plus loin.`
          : "Sept jours. Votre fleur a pris racine. Aujourd'hui, elle rencontre les autres."
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
    getTrace: () =>
      "Vous n\u2019\u00eates pas seul\u00b7e dans ce jardin. Le reste du chemin se fait ensemble.",
    ouverture: null,
    isFinal: true,
    finalCTA: 'Entrer dans mon jardin',
    helpTexts: {
      accueil:       "Vous avez traversé sept jours. Chaque jour avait sa couleur, sa texture.\n\nCe que vous avez cultivé ici continue de grandir, à votre rythme.",
      introspection: "Ce que vous avez remarqué cette semaine vous appartient.\n\nAujourd'hui, regardez ce que vous emportez avec vous.",
      rituel:        "Le jardin collectif est une invitation à sortir de l'isolement intérieur.\n\nVotre présence, votre engagement, votre pratique — tout cela rayonne au-delà de vous.\n\nBienvenue dans le jardin partagé.",
      trace:         "Sept jours. Vous n'êtes pas seul·e dans ce jardin.\n\nLe reste du chemin se fait ensemble.",
      ouverture:     "Votre fleur a pris racine. Votre jardin existe.\n\nMaintenant, il rencontre les autres.",
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

function BreathingOrb() {
  const [countdown, setCountdown] = useState(3)   // 3 → 2 → 1 → 0 (started)
  const [isInhale,  setIsInhale]  = useState(true)

  useEffect(() => {
    const t1 = setTimeout(() => setCountdown(2), 1000)
    const t2 = setTimeout(() => setCountdown(1), 2000)
    const t3 = setTimeout(() => setCountdown(0), 3000)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (countdown > 0) return
    const t = setInterval(() => setIsInhale(v => !v), 5000)
    return () => clearInterval(t)
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
        Posez votre main sur le ventre et portez votre attention sur ce rythme lent.
      </p>

    </div>
  )
}

// ── Baromètre émotionnel ───────────────────────────────────────────────────

function EmotionalBarometer({ answerKey, onAnswer }) {
  const [pos,        setPos]        = useState(0.5)
  const [touched,    setTouched]    = useState(false)
  const [ctaVisible, setCtaVisible] = useState(false)
  const trackRef   = useRef(null)
  const dragging   = useRef(false)
  const ctaTimer   = useRef(null)

  function getCursorColor(p) {
    // #d95c5c (rouge doux) → #e8c86a (jaune chaud) → #6aaa7a (vert sauge)
    let r, g, b
    if (p <= 0.5) {
      const t = p * 2
      r = Math.round(217 + (232 - 217) * t)
      g = Math.round(92  + (200 - 92)  * t)
      b = Math.round(92  + (106 - 92)  * t)
    } else {
      const t = (p - 0.5) * 2
      r = Math.round(232 + (106 - 232) * t)
      g = Math.round(200 + (170 - 200) * t)
      b = Math.round(106 + (122 - 106) * t)
    }
    return `rgb(${r},${g},${b})`
  }

  function posFromPointer(e) {
    const rect = trackRef.current.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }

  function handlePointerDown(e) {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    setPos(posFromPointer(e))
    if (!touched) {
      setTouched(true)
      ctaTimer.current = setTimeout(() => setCtaVisible(true), 1400)
    }
  }

  function handlePointerMove(e) {
    if (!dragging.current) return
    setPos(posFromPointer(e))
  }

  function handlePointerUp() { dragging.current = false }

  useEffect(() => () => clearTimeout(ctaTimer.current), [])

  function posToValue(p) {
    if (p < 0.2) return 'fatigue'
    if (p < 0.4) return 'stresse'
    if (p < 0.6) return 'neutre'
    if (p < 0.8) return 'calme'
    return 'bien'
  }

  const color = getCursorColor(pos)

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Phrase d'introduction */}
      <p style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 'clamp(15px, 3.8vw, 18px)',
        fontStyle: 'italic',
        color: '#1a1010',
        lineHeight: 1.7,
        textAlign: 'center',
        margin: '0 0 22px',
      }}>
        Il n'y a pas de bonne réponse.<br />
        Juste ce qui est là aujourd'hui.
      </p>

      {/* Question */}
      <p style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 'clamp(20px, 5.5vw, 26px)',
        fontWeight: 500,
        color: '#0f0808',
        lineHeight: 1.45,
        textAlign: 'center',
        margin: '0 0 44px',
      }}>
        Comment vous vous sentez,<br />là, maintenant&nbsp;?
      </p>

      {/* Slider */}
      <div style={{ width: '100%', padding: '0 2px', boxSizing: 'border-box' }}>

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
            {/* Halo pulsant */}
            <div style={{
              position: 'absolute',
              width: 60,
              height: 60,
              borderRadius: '50%',
              top: -14,
              left: -14,
              backgroundColor: color,
              animation: 'pulseCursor 4.5s ease-in-out infinite',
              transition: 'background-color 0.5s ease',
            }} />
            {/* Orbe principal */}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: color,
              boxShadow: `inset 0 0 14px rgba(255,255,255,0.75), 0 2px 18px 6px ${color}80`,
              transition: 'background-color 0.5s ease',
            }} />
          </div>
        </div>

        {/* Pôles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
          <span style={{ fontSize: 26, lineHeight: 1 }}>😔</span>
          <span style={{ fontSize: 26, lineHeight: 1 }}>😌</span>
        </div>
      </div>

      {/* CTA */}
      {ctaVisible && (
        <div className="wof-soft" style={{ marginTop: 40 }}>
          <PrimaryButton onClick={() => onAnswer(answerKey, posToValue(pos))}>
            Continuer
          </PrimaryButton>
        </div>
      )}

    </div>
  )
}

// ── ACCUEIL SLIDE 1 ────────────────────────────────────────────────────────

function DayAccueilSlide1({ answerKey, onAnswer }) {
  const [subSlide, setSubSlide] = useState(0)
  const [phase,    setPhase]    = useState(0)

  useEffect(() => {
    setPhase(0)
    let timers
    if (subSlide === 0) {
      // SLIDE 0 — INTRO
      timers = [
        setTimeout(() => setPhase(1), 200),
        setTimeout(() => setPhase(2), 400),
        setTimeout(() => setPhase(3), 600),
        setTimeout(() => setPhase(4), 800),
      ]
    } else if (subSlide === 1) {
      // SLIDE 1 — ARRÊT
      timers = [
        setTimeout(() => setPhase(1), 200),
        setTimeout(() => setPhase(2), 500),
      ]
    } else if (subSlide === 2) {
      // SLIDE 2 — CONNEXION
      timers = [
        setTimeout(() => setPhase(1), 200),
        setTimeout(() => setPhase(2), 600),
      ]
    } else {
      // SLIDE 3 — QUESTION
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
      <div className="wof-soft" style={{ textAlign: 'center', padding: '40px 16px 36px' }}>

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
          Vous n'êtes pas ici par hasard.
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
          Quelque chose en vous<br />
          sait qu'il est temps de ralentir.
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
          Pas pour faire plus.<br />
          Mais pour faire autrement.
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
          Ce que vous allez commencer ici…<br />
          se construit un jour à la fois.
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
      <div className="wof-soft" style={{ textAlign: 'center', padding: '40px 16px 36px' }}>
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
          Vous êtes là.
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
          Et pour une fois…<br />
          vous n'avez rien à faire de plus.
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
      <div className="wof-soft" style={{ textAlign: 'center', padding: '40px 16px 36px' }}>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(22px, 5.5vw, 30px)',
          fontWeight: 400,
          color: '#0f0808',
          lineHeight: 1.5,
          margin: '0 0 36px',
          ...fadeStyle(true),
        }}>
          Prenez simplement un instant.
        </p>

        <div style={{ marginBottom: 36 }}>
          <BreathingOrb />
        </div>

        <div style={{ ...fadeStyle(phase >= 1), pointerEvents: phase >= 1 ? 'auto' : 'none' }}>
          <PrimaryButton onClick={() => setSubSlide(3)}>
            Observer
          </PrimaryButton>
        </div>
      </div>
    )
  }

  /* ── SLIDE 3 — BAROMÈTRE ÉMOTIONNEL ─────────────────────────── */
  return (
    <div className="wof-soft" style={{ padding: '32px 16px 36px' }}>
      <EmotionalBarometer answerKey={answerKey} onAnswer={onAnswer} />
    </div>
  )
}

// ── Mise en condition (jours 2-7) ──────────────────────────────────────────

function ConditioningAccueil({ data, answers, onConditioningComplete }) {
  const [subSlide, setSubSlide] = useState(0)
  const [ctaReady, setCtaReady] = useState(false)
  const [breathCta, setBreathCta] = useState(false)

  useEffect(() => {
    setCtaReady(false)
    setBreathCta(false)
    let timer
    if (subSlide === 0) {
      timer = setTimeout(() => setCtaReady(true), data.pauseSeconds * 1000)
    } else if (subSlide === 1) {
      timer = setTimeout(() => setBreathCta(true), 1500)
    }
    return () => clearTimeout(timer)
  }, [subSlide, data.pauseSeconds])

  const prevNote = data.getPreviousNote?.(answers) || data.getNarrativeNote?.(answers)

  /* ── Sub-slide 0 : accueil du jour ─── */
  if (subSlide === 0) {
    return (
      <div className="wof-soft" style={{ textAlign: 'center', padding: '40px 16px 36px' }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(22px, 5.5vw, 30px)',
          fontWeight: 500,
          color: '#0f0808',
          lineHeight: 1.3,
          margin: '0 0 20px',
          letterSpacing: '-0.01em',
        }}>
          {data.headline}
        </h1>

        {prevNote && (
          <p style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 14,
            fontWeight: 300,
            color: '#1a1010',
            lineHeight: 1.65,
            margin: '0 0 12px',
            fontStyle: 'italic',
          }}>
            {prevNote}
          </p>
        )}

        {data.subtitle && (
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(17px, 4vw, 20px)',
            fontStyle: 'italic',
            color: '#4a3838',
            lineHeight: 1.65,
            margin: '0 0 32px',
          }}>
            {data.subtitle}
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
      <div className="wof-soft" style={{ textAlign: 'center', padding: '40px 16px 36px' }}>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(20px, 5vw, 26px)',
          fontWeight: 400,
          color: '#0f0808',
          lineHeight: 1.5,
          margin: '0 0 36px',
        }}>
          Prenez simplement un instant.
        </p>

        <div style={{ marginBottom: 40 }}>
          <BreathingOrb />
        </div>

        {breathCta && (
          <div className="wof-soft">
            <PrimaryButton onClick={() => data.skipBarometer ? onConditioningComplete(null) : setSubSlide(2)}>
              {data.skipBarometer ? 'Ressentir mon énergie' : 'Observer'}
            </PrimaryButton>
          </div>
        )}
      </div>
    )
  }

  /* ── Sub-slide 2 : baromètre émotionnel ─── */
  return (
    <div className="wof-soft" style={{ padding: '32px 16px 36px' }}>
      <EmotionalBarometer
        answerKey="conditioning_feel"
        onAnswer={(_, value) => onConditioningComplete(value)}
      />
    </div>
  )
}

// ── ACCUEIL ────────────────────────────────────────────────────────────────

function DayAccueil({ data, introspectionData, answers, onAnswerFromAccueil, onConditioningComplete, onNext }) {
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
      />
    )
  }

  if (isConditioning) {
    return (
      <ConditioningAccueil
        data={data}
        answers={answers}
        onConditioningComplete={onConditioningComplete}
      />
    )
  }


  return (
    <div className="wof-in" style={{ textAlign: 'center', padding: '28px 24px 16px' }}>
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
  const selectedIdx = selected ? BATTERY_LEVELS.findIndex(l => l.value === selected) : -1

  return (
    <div className="wof-in" style={{ padding: '8px 0 16px' }}>
      <BackButton onClick={onBack} />

      <h2 style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 'clamp(18px, 4.5vw, 24px)',
        fontWeight: 400,
        color: '#000',
        lineHeight: 1.45,
        margin: '8px 0 40px',
        textAlign: 'center',
      }}>
        Votre énergie en ce moment est plutôt…
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
                  onClick={() => setSelected(level.value)}
                  style={{
                    height: 54,
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
                onClick={() => setSelected(level.value)}
                style={{
                  height: 54,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  paddingLeft: 6,
                }}
              >
                <span style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 15,
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
        <div className="wof-soft" style={{ marginTop: 36, display: 'flex', justifyContent: 'center' }}>
          <PrimaryButton onClick={() => onAnswer(answerKey, selected)}>
            Continuer
          </PrimaryButton>
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
      info: "Votre ancrage fondamental. Elle évalue votre stabilité, votre sentiment de sécurité et votre connexion à l'essentiel du quotidien." },
    { key: 'zone_tige',     label: 'Tige',     emoji: '🌿', color: ZONE_COLORS.tige,
      info: "Votre structure intérieure. Elle mesure votre posture mentale et votre capacité à tenir debout, même sous la pression." },
    { key: 'zone_feuilles', label: 'Feuilles', emoji: '🍃', color: ZONE_COLORS.feuilles,
      info: "Votre capacité à laisser passer. Elle évalue comment vous accueillez et relâchez les émotions sans vous y accrocher." },
    { key: 'zone_fleurs',   label: 'Fleurs',   emoji: '🌸', color: ZONE_COLORS.fleurs,
      info: "Votre ouverture et votre vitalité. Elle reflète votre capacité à vous offrir de l'espace et à recevoir ce qui est bon pour vous." },
    { key: 'zone_souffle',  label: 'Souffle',  emoji: '🌬️', color: ZONE_COLORS.souffle,
      info: "Votre lien au monde. Il mesure votre connexion aux autres et à ce qui vous dépasse — le fil invisible entre vous et le reste." },
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
    ? 'Calculé depuis votre semaine'
    : plantData?._fromRituals
      ? 'Calculé depuis vos rituels'
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
            Votre fleur arrive…
          </div>
        ) : !plantData ? (
          <div style={{
            textAlign: 'center', padding: '48px 32px',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 18, fontStyle: 'italic', color: '#1a1010', lineHeight: 1.7,
          }}>
            Votre fleur prend racine.<br />
            Commencez votre bilan demain matin<br />pour la voir grandir.
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
                  desc: 'Évaluez vos 5 zones en quelques minutes',
                  color: '#a07060',
                  bg: 'rgba(184,120,100,0.08)',
                  border: 'rgba(184,120,100,0.22)',
                  info: "Chaque matin, répondez à dix questions sur vos cinq zones. En quelques minutes, votre fleur s'adapte et reflète fidèlement votre état du jour.",
                },
                {
                  icon: '⚡',
                  label: 'Action rapide',
                  desc: 'Un rituel ciblé en 1 minute',
                  color: '#5878a8',
                  bg: 'rgba(88,120,168,0.08)',
                  border: 'rgba(88,120,168,0.22)',
                  info: "Quand le temps manque, un rituel d'une minute reste toujours disponible. Il cible la zone qui en a le plus besoin et maintient votre jardin vivant, même les jours chargés.",
                },
                {
                  icon: '🌱',
                  label: 'Boîte à Graines',
                  desc: "Notez ce qui s\u2019est bien pass\u00e9 aujourd\u2019hui",
                  color: '#507860',
                  bg: 'rgba(80,120,96,0.08)',
                  border: 'rgba(80,120,96,0.22)',
                  info: "Le soir, notez une chose positive de votre journée. Chaque graine plantée nourrit votre estime de vous-même et renforce votre ancrage dans le positif.",
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
  const [phase,      setPhase]      = useState(0)
  const [showLive,   setShowLive]   = useState(false)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1100),
      setTimeout(() => setPhase(3), 2200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const allZones = ['racines', 'tige', 'feuilles', 'fleurs', 'souffle']

  const zones = [
    { zone: 'racines',  label: 'Racines',  desc: "Ce qui vous ancre au quotidien",       color: ZONE_COLORS.racines  },
    { zone: 'tige',     label: 'Tige',     desc: "Ce qui vous structure et vous tient",   color: ZONE_COLORS.tige     },
    { zone: 'feuilles', label: 'Feuilles', desc: "Ce qui traverse et se libère en vous",  color: ZONE_COLORS.feuilles },
    { zone: 'fleurs',   label: 'Fleurs',   desc: "Ce qui vous ouvre à vous-même",         color: ZONE_COLORS.fleurs   },
    { zone: 'souffle',  label: 'Souffle',  desc: "Ce qui vous relie au-delà de vous",     color: ZONE_COLORS.souffle  },
  ]

  return (
    <>
      {showLive && <MaFleurLiveModal onClose={() => setShowLive(false)} />}

      <div className="wof-in" style={{ padding: '8px 0 40px' }}>
        <BackButton onClick={onBack} />

        <div style={{ textAlign: 'center', margin: '8px 0 28px', ...fadeIn(phase >= 1) }}>
          <p style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 'clamp(11px, 2.8vw, 13px)',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#1a1010',
            margin: '0 0 8px',
          }}>
            Votre fleur
          </p>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(24px, 6vw, 32px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: '#2a1828',
            lineHeight: 1.25,
            margin: '0 0 6px',
          }}>
            Cinq zones éveillées
          </h2>
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(14px, 3.5vw, 17px)',
            fontStyle: 'italic',
            color: '#1a1010',
            margin: 0,
          }}>
            Elle vous attend dans votre jardin intérieur
          </p>
        </div>

        {/* Fleur cliquable → ouvre le modal live */}
        <div
          style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, ...fadeIn(phase >= 2), cursor: 'pointer' }}
          onClick={() => setShowLive(true)}
          title="Voir ma vraie fleur"
        >
          <FlowerMosaic completedZones={allZones} size={200} />
        </div>

        <div style={{ marginBottom: 24 }} />

        <div style={{ maxWidth: 340, margin: '0 auto 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {zones.map((z, i) => (
            <div
              key={z.zone}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '13px 18px',
                background: 'rgba(255,255,255,0.72)',
                borderRadius: 14,
                border: `1.5px solid ${z.color}55`,
                opacity: phase >= 3 ? 1 : 0,
                transform: phase >= 3 ? 'translateY(0)' : 'translateY(8px)',
                transition: `opacity 600ms ease ${i * 130}ms, transform 600ms ease ${i * 130}ms`,
              }}
            >
              <div style={{
                width: 12, height: 12,
                borderRadius: '50%',
                background: z.color,
                flexShrink: 0,
                boxShadow: `0 0 6px ${z.color}88`,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#2a1828',
                  letterSpacing: '0.03em',
                  marginBottom: 2,
                }}>
                  {z.label}
                </div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: 'clamp(16px, 4vw, 19px)',
                  fontStyle: 'italic',
                  color: '#1a1010',
                  lineHeight: 1.3,
                }}>
                  {z.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          opacity: phase >= 3 ? 1 : 0,
          transition: 'opacity 600ms ease 700ms',
        }}>
          <PrimaryButton onClick={() => onAnswer(answerKey, 'vu')}>
            Découvrir mon jardin
          </PrimaryButton>
        </div>
      </div>
    </>
  )
}

// ── INTROSPECTION ──────────────────────────────────────────────────────────

function DayIntrospection({ data, onAnswer, onBack }) {
  const [selected, setSelected] = useState(null)

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
    <div className="wof-in" style={{ padding: '8px 0 16px' }}>
      <BackButton onClick={onBack} />

      <h2 style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 'clamp(18px, 4.5vw, 24px)',
        fontWeight: 400,
        color: '#000',
        lineHeight: 1.45,
        margin: '8px 0 28px',
        textAlign: 'center',
      }}>
        {data.question}
      </h2>

      {data.layout === 'column' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, margin: '0 auto 32px' }}>
          {data.choices.map((c) => {
            const isSelected = selected === c.value
            return (
              <button
                key={c.value}
                onClick={() => setSelected(c.value)}
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

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <PrimaryButton onClick={confirm} disabled={!selected}>
          Continuer
        </PrimaryButton>
      </div>
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

  return (
    <div style={{ textAlign: 'center', padding: '40px 16px 40px' }}>
      <BackButton onClick={onBack} />

      {lines.map((line, i) => (
        <p key={i} style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(18px, 4.5vw, 24px)',
          fontStyle: i === 0 ? 'normal' : 'italic',
          fontWeight: i === 0 ? 500 : 400,
          color: i === 0 ? '#0f0808' : '#3a2828',
          lineHeight: 1.65,
          whiteSpace: 'pre-line',
          margin: '0 0 20px',
          ...fadeIn(phase > i),
        }}>
          {line}
        </p>
      ))}

      <div style={{
        marginTop: 16,
        ...fadeIn(phase > lines.length),
        pointerEvents: phase > lines.length ? 'auto' : 'none',
      }}>
        <PrimaryButton onClick={onStart} style={{ background: `linear-gradient(135deg, ${dayColor}, ${dayColor}cc)` }}>
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
    <div style={{ padding: '16px 24px 80px' }}>
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
          Votre premier rituel
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
          vos racines
        </h2>
        <div style={{
          width: 48,
          height: 2,
          background: 'linear-gradient(to right, transparent, #b87c5a, transparent)',
          margin: '0 auto',
        }} />
      </div>

      {block(1, <p style={S}>Vous pouvez simplement <B>rester là</B>… quelques instants.</p>)}
      {block(2, <p style={S}><B>Sentez</B> vos pieds. Leur <B>contact</B> avec le sol.</p>)}
      {block(3, <p style={S}>Sans chercher à changer quoi que ce soit.</p>)}
      {block(4, <>
        <p style={S}><B>Inspirez</B> doucement… et laissez l'air <B>sortir</B>.</p>
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
      {block(5, <p style={S}><B>Imaginez</B> maintenant… quelque chose qui <B>descend</B> doucement sous vous.</p>)}
      {block(6, <p style={S}>Comme des <B>racines</B>. Elles <B>s'enfoncent</B>… tranquillement.</p>)}
      {block(7, <p style={S}>Et à chaque <B>expiration</B>… vous pouvez laisser votre <B>poids descendre</B> un peu plus.</p>)}
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
    <div style={{ padding: '16px 24px 80px' }}>
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
          Votre deuxième rituel
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
          votre tige
        </h2>
        <div style={{
          width: 48,
          height: 2,
          background: 'linear-gradient(to right, transparent, #7a9ab0, transparent)',
          margin: '0 auto',
        }} />
      </div>

      {block(1, <p style={S}>Tenez-vous <B>debout</B>, ou assis·e, le dos naturellement <B>droit</B>. Sans forcer.</p>)}
      {block(2, <>
        <p style={S}>Imaginez une <B>ligne</B> qui part de votre bassin jusqu'au sommet de votre <B>tête</B>.</p>
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
      {block(3, <p style={S}>À chaque <B>inspiration</B>, laissez cette ligne s'étirer <B>légèrement</B>.</p>)}
      {block(4, <p style={S}>À chaque <B>expiration</B>, relâchez toute <B>tension inutile</B>.</p>)}
      {block(5, <p style={S}>Balancez doucement votre corps de quelques millimètres, <B>d'avant en arrière</B>…</p>)}
      {block(6, <p style={S}>puis trouvez votre <B>point d'équilibre</B>.</p>)}
      {block(7, <p style={{ ...S, fontStyle: 'normal', fontWeight: 500, fontSize: 'clamp(20px, 5vw, 25px)', margin: '0 0 40px' }}><B>Stable…</B> mais <B>vivant·e.</B></p>)}

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
    <div style={{ padding: '16px 24px 80px' }}>
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
          Votre troisième rituel
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
          vos feuilles
        </h2>
        <div style={{
          width: 48, height: 2,
          background: 'linear-gradient(to right, transparent, #7aaa88, transparent)',
          margin: '0 auto',
        }} />
      </div>

      {block(1, <p style={S}>Prenez un instant. <B>Qu'est-ce qui est là</B>, en ce moment ?</p>)}
      {block(2, <p style={S}>Une émotion. Une sensation. Une pensée qui tourne.</p>)}
      {block(3, <>
        <p style={S}><B>Nommez-la</B> intérieurement. Sans la juger.</p>
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
      {block(4, <p style={S}>Maintenant, <B>observez-la</B>.</p>)}
      {block(5, <p style={S}>Comme un <B>nuage qui passe</B> dans le ciel.</p>)}
      {block(6, <p style={S}>Ne cherchez pas à la changer. Ne la retenez pas. <B>Laissez-la traverser.</B></p>)}
      {block(7, <p style={{ ...S, fontStyle: 'normal', fontWeight: 500, fontSize: 'clamp(20px, 5vw, 25px)', margin: '0 0 40px' }}>Les feuilles <B>reçoivent</B>. Et elles <B>lâchent</B>.</p>)}

      <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= 8), pointerEvents: phase >= 8 ? 'auto' : 'none' }}>
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
    <div style={{ padding: '16px 24px 80px' }}>
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
          Votre quatrième rituel
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
          vos fleurs
        </h2>
        <div style={{
          width: 48, height: 2,
          background: 'linear-gradient(to right, transparent, #d4a0b0, transparent)',
          margin: '0 auto',
        }} />
      </div>

      {block(1, <p style={S}>Installez-vous <B>confortablement</B>.</p>)}
      {block(2, <p style={S}>Fermez les yeux si vous le souhaitez.</p>)}
      {block(3, <>
        <p style={S}>Scannez votre corps <B>doucement</B>, de la tête aux pieds.</p>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '-16px 0 32px' }}>
          <span style={{
            display: 'inline-block',
            fontSize: 'clamp(11px, 2.8vw, 13px)',
            fontFamily: 'Jost, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#1a1010',
            background: 'rgba(180,120,140,0.10)',
            border: '1px solid rgba(180,120,140,0.28)',
            borderRadius: 100,
            padding: '5px 14px',
          }}>
            de haut en bas
          </span>
        </div>
      </>)}
      {block(4, <p style={S}>Remarquez les zones <B>tendues</B>. Les zones <B>douces</B>.</p>)}
      {block(5, <p style={S}>Ne cherchez pas à <B>changer</B> quoi que ce soit.</p>)}
      {block(6, <p style={S}>Juste… <B>passer en revue</B>. Comme on traverse un jardin.</p>)}
      {block(7, <p style={{ ...S, fontStyle: 'normal', fontWeight: 500, fontSize: 'clamp(20px, 5vw, 25px)', margin: '0 0 40px' }}>Vous venez de vous <B>offrir de l'espace</B>.</p>)}

      <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= 8), pointerEvents: phase >= 8 ? 'auto' : 'none' }}>
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
    <div style={{ padding: '16px 24px 80px' }}>
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
          Votre cinquième rituel
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
          votre souffle
        </h2>
        <div style={{
          width: 48, height: 2,
          background: 'linear-gradient(to right, transparent, #c8a870, transparent)',
          margin: '0 auto',
        }} />
      </div>

      {block(1, <p style={S}>Pensez à <B>quelqu'un</B> — proche ou lointain.</p>)}
      {block(2, <p style={S}>Quelqu'un à qui vous voudriez envoyer <B>quelque chose de doux</B>.</p>)}
      {block(3, <>
        <p style={S}>Gardez cette personne <B>en tête</B>.</p>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '-16px 0 32px' }}>
          <span style={{
            display: 'inline-block',
            fontSize: 'clamp(11px, 2.8vw, 13px)',
            fontFamily: 'Jost, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#1a1010',
            background: 'rgba(180,150,90,0.10)',
            border: '1px solid rgba(180,150,90,0.28)',
            borderRadius: 100,
            padding: '5px 14px',
          }}>
            pas de mots nécessaires
          </span>
        </div>
      </>)}
      {block(4, <p style={S}>Inspirez doucement. Sur l'<B>expiration</B>…</p>)}
      {block(5, <p style={S}>…dirigez votre <B>attention</B> vers elle.</p>)}
      {block(6, <p style={S}>Ce <B>geste invisible</B> est réel. Il suffit de l'intention.</p>)}
      {block(7, <p style={{ ...S, fontStyle: 'normal', fontWeight: 500, fontSize: 'clamp(20px, 5vw, 25px)', margin: '0 0 40px' }}>Votre souffle <B>relie</B>. Toujours.</p>)}

      <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= 8), pointerEvents: phase >= 8 ? 'auto' : 'none' }}>
        <PrimaryButton onClick={onNext}>Je continue</PrimaryButton>
      </div>
    </div>
  )
}

// ── Rituel guidé — Mon Jardin (Jour 6) ────────────────────────────────────

function JardinGuidedRituel({ onNext, onBack }) {
  const { user } = useAuth()
  const userId   = user?.id
  const [phase, setPhase] = useState(0)
  const phaseRefs = useRef({})
  const [plantData, setPlantData] = useState(null)
  const [settings,  setSettings]  = useState(null)

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

  const ZONE_KEYS_J6 = [
    { key: 'zone_racines',  label: 'Racines',  emoji: '🌱', color: ZONE_COLORS.racines  },
    { key: 'zone_tige',     label: 'Tige',     emoji: '🌿', color: ZONE_COLORS.tige     },
    { key: 'zone_feuilles', label: 'Feuilles', emoji: '🍃', color: ZONE_COLORS.feuilles },
    { key: 'zone_fleurs',   label: 'Fleurs',   emoji: '🌸', color: ZONE_COLORS.fleurs   },
    { key: 'zone_souffle',  label: 'Souffle',  emoji: '🌬️', color: ZONE_COLORS.souffle  },
  ]

  const health = plantData?.health ?? 35
  const gardenSettings = settings ? {
    ...DEFAULT_GARDEN_SETTINGS,
    petalColor1: settings.petal_color1 ?? DEFAULT_GARDEN_SETTINGS.petalColor1,
    petalColor2: settings.petal_color2 ?? DEFAULT_GARDEN_SETTINGS.petalColor2,
    petalShape:  settings.petal_shape  ?? DEFAULT_GARDEN_SETTINGS.petalShape,
  } : DEFAULT_GARDEN_SETTINGS

  useEffect(() => {
    const T = [0, 150, 300, 450, 600, 750, 900]
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

  function FeatureBadge({ label, color, bg, border }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-8px 0 32px' }}>
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
    <div style={{ padding: '16px 24px 80px' }}>
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
Laissez-moi vous présenter         </p>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(30px, 7.5vw, 40px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#1a0a28',
          lineHeight: 1.15,
          margin: '0 0 10px',
        }}>
          votre jardin
        </h2>
        <div style={{
          width: 48, height: 2,
          background: 'linear-gradient(to right, transparent, #8878a8, transparent)',
          margin: '0 auto',
        }} />
      </div>

      {block(1, <p style={S}>Vos cinq zones sont <B>éveillées</B>.<br />Elles font partie de votre jardin.</p>)}

      {block(2, <>
        <p style={S}>Lorsque vous ouvrez votre jardin intérieur, vous trouverez <B>votre fleur</B>.</p>
        <FeatureBadge
          label="Ma Fleur"
          color="#8878a8"
          bg="rgba(136,120,168,0.10)"
          border="rgba(136,120,168,0.28)"
        />
        <p style={S}>Elle grandit à chaque soin que vous vous <B>apportez</B>.<br />Elle reflète votre état d'être <B>en temps réel</B>.</p>
      </>)}

      {block(3, <>
        <p style={S}>Chaque matin, un <B>bilan rapide</B> vous attend.</p>
        <FeatureBadge
          label="Bilan du matin"
          color="#a07060"
          bg="rgba(184,120,100,0.10)"
          border="rgba(184,120,100,0.28)"
        />
        <p style={S}>Dix questions. Quelques minutes.<br />Cinq ressenti <B>évalués</B>… et votre fleur s'adapte.</p>
      </>)}

      {block(4, <>
        <p style={S}>Quand le temps <B>manque</B>…</p>
        <FeatureBadge
          label="Action rapide"
          color="#5878a8"
          bg="rgba(88,120,168,0.10)"
          border="rgba(88,120,168,0.28)"
        />
        <p style={S}>Un rituel en une minute est <B>toujours disponible</B>.<br />Votre jardin reste vivant, même les jours <B>chargés</B>.</p>
      </>)}

      {block(5, <>
        <p style={S}>Le soir, une habitude <B>simple</B>.</p>
        <FeatureBadge
          label="Boîte à Graines"
          color="#507860"
          bg="rgba(80,120,96,0.10)"
          border="rgba(80,120,96,0.28)"
        />
        <p style={S}>Notez ce qui s'est bien passé aujourd'hui.<br />Chaque graine plantée nourrit votre <B>estime de vous même</B>.</p>
      </>)}

      {block(6, (
        <div style={{ margin: '0 0 32px' }}>
          <p style={{ ...S, fontStyle: 'normal', fontWeight: 500, fontSize: 'clamp(20px, 5vw, 25px)', margin: '0 0 24px' }}>
            <B>Votre fleur existe.</B> Voici où elle en est.
          </p>
          <div style={{
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(10,22,40,0.28)',
            background: 'linear-gradient(180deg, #0a1628 0%, #0d1f10 100%)',
            position: 'relative', marginBottom: 16,
          }}>
            <PlantSVG health={health} gardenSettings={gardenSettings} lumensLevel="moyen" lumensTotal={0} compact={true} />
            <div style={{
              position: 'absolute', bottom: 14, right: 14,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
              borderRadius: 12, padding: '8px 12px',
              border: '1px solid rgba(124,184,124,0.35)',
            }}>
              <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(124,184,124,0.8)', marginBottom: 2 }}>Vitalité</span>
              <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 22, fontWeight: 700, color: '#7cb87c', lineHeight: 1 }}>{health}%</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ZONE_KEYS_J6.map((z, i) => {
              const pct = plantData?.[z.key] ?? 35
              return (
                <div key={z.key}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 14 }}>{z.emoji}</span>
                      <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 600, color: '#2a1828', letterSpacing: '0.04em' }}>{z.label}</span>
                    </div>
                    <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 800, color: z.color, textShadow: 'none' }}>{Math.round(pct)}%</span>
                  </div>
                  <div style={{ height: 9, borderRadius: 6, background: 'rgba(0,0,0,0.10)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 6,
                      background: `linear-gradient(90deg, ${z.color}88, ${z.color})`,
                      width: `${pct}%`,
                      transition: `width 900ms cubic-bezier(0.34,1.2,0.64,1) ${500 + i * 120}ms`,
                      boxShadow: `0 0 8px ${z.color}55`,
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
          <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(15px, 4vw, 18px)', fontStyle: 'italic', color: 'rgba(30,20,8,.65)', lineHeight: 1.6, textAlign: 'center', margin: '20px 0 0' }}>
            Chaque rituel que vous faites nourrit une zone — et change la forme de votre fleur.
          </p>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= 7), pointerEvents: phase >= 7 ? 'auto' : 'none' }}>
        <PrimaryButton onClick={onNext}>J'ai compris →</PrimaryButton>
      </div>
    </div>
  )
}

// ── Découverte Communauté (Jour 7) ────────────────────────────────────────

function CommunauteDiscovery({ answerKey, onAnswer, onBack }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1100),
      setTimeout(() => setPhase(3), 2200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const features = [
    { emoji: '🌍', label: 'Le Jardin Collectif',    desc: "Un espace partagé où chaque fleur contribue au jardin commun par sa présence",                                                color: '#1a1010' },
    { emoji: '🤝', label: 'Le Club des Jardiniers', desc: "Une communauté qui avance ensemble, se soutient et partage des ondes positives",                                              color: '#9a78b0' },
    { emoji: '🎯', label: 'Les Défis',              desc: "Des challenges pour partager ensemble des mises en action et s\u2019encourager",                                              color: '#b07860' },
    { emoji: '🌿', label: 'Les Ateliers',           desc: "Des sessions guidées pour approfondir votre mieux-\u00eatre, accompagné par des professionnels",                              color: '#607860' },
    { emoji: '✨', label: 'Les Lumens',             desc: "L\u2019\u00e9nergie de votre engagement, visible et partageable",                                                             color: '#a8a030' },
    { emoji: '📚', label: 'La Jardinoth\èque', desc: "Un ensemble d\u2019outils pour vous accompagner dans votre bien-\u00eatre",                                                    color: '#1a1010' },
  ]

  return (
    <div className="wof-in" style={{ padding: '8px 0 40px' }}>
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
          Vous n'êtes pas seul·e
        </h2>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(14px, 3.5vw, 17px)',
          fontStyle: 'italic', color: '#1a1010', margin: 0,
        }}>
          D'autres jardins vous attendent
        </p>
      </div>

      <div style={{ maxWidth: 340, margin: '0 auto 32px', display: 'flex', flexDirection: 'column', gap: 8, ...fadeIn(phase >= 2) }}>
        {features.map((f, i) => (
          <div key={f.label} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '13px 18px',
            background: 'rgba(255,255,255,0.72)',
            borderRadius: 14,
            border: `1.5px solid ${f.color}55`,
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0)' : 'translateY(8px)',
            transition: `opacity 600ms ease ${i * 120}ms, transform 600ms ease ${i * 120}ms`,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {i < 4 && (
              <div style={{
                position: 'absolute', top: 0, right: 0,
                fontSize: 8, fontWeight: 700, letterSpacing: '.10em', textTransform: 'uppercase',
                color: '#fff', background: 'linear-gradient(135deg, #3a9a28, #2a7a18)',
                padding: '3px 10px', borderRadius: '0 14px 0 8px',
              }}>
                Accès limité · Premium
              </div>
            )}
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

      {/* ── Card Pep's ── */}
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
      }}>
        <div style={{ flexShrink: 0 }}>
          <img src="/peps1.png" alt="Pep's" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px rgba(58,154,40,.30)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 600, color: '#2a1828' }}>Pep's</div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.10em', textTransform: 'uppercase', color: '#fff', background: 'linear-gradient(135deg, #3a9a28, #2a7a18)', borderRadius: 100, padding: '2px 7px' }}>Accès suivant abonnement</div>
          </div>
          <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(14px, 3.5vw, 17px)', fontStyle: 'italic', color: '#1a1010', lineHeight: 1.3 }}>
            L'app mobile pour cultiver votre bien-être partout — rappels, inspirations positives et accès à votre Fleur, où que vous soyez.
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center',
        opacity: phase >= 3 ? 1 : 0,
        transition: 'opacity 600ms ease 700ms',
      }}>
        <PrimaryButton onClick={() => onAnswer(answerKey, 'vu')}>
          Découvrir le jardin ensemble
        </PrimaryButton>
      </div>
    </div>
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
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 'clamp(13px, 3.5vw, 15px)', color: 'rgba(20,50,10,.55)', letterSpacing: '.06em', margin: 0 }}>L'application mobile de votre mieux-être</p>
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
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 13, fontStyle: 'italic', color: '#fff', lineHeight: 1.4 }}>"Chaque petit pas compte dans votre jardin intérieur."</div>
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
            { icon: '🔔', title: 'Rappels personnalisés', sub: 'Recevez un rappel au moment idéal pour vous', desc: 'On vous relance au bon moment, juste ce qu\'il faut, quand il faut' },
            { icon: '🌸', title: 'Ma fleur, partout', sub: 'Votre équilibre à portée de main', desc: 'Accédez à votre jardin, où que vous soyez' },
            { icon: '☀️', title: 'Infos positives', sub: 'Nourrissez votre esprit autrement', desc: 'Un flux simple, inspirant et ressourçant' },
            { icon: '🌿', title: 'Espace média sain', sub: 'Respirez loin du bruit', desc: 'Des contenus choisis pour vous apaiser' },
            { icon: '📚', title: 'Jardinothèque', sub: 'Explorez, pratiquez, évoluez', desc: 'Des outils concrets pour avancer à votre rythme' },
            { icon: '💎', title: 'Inclus Premium', sub: 'Accédez à l\'expérience complète', desc: 'Toutes les ressources dès l\'ouverture de l\'app' },
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
          Pep's sera disponible <strong style={{ fontWeight: 600, fontStyle: 'inherit' }}>prochainement</strong>.<br />Votre abonnement Premium vous donnera accès dès sa sortie.
        </p>
        <PrimaryButton onClick={onNext}>Commencer mon jardin</PrimaryButton>
      </div>
    </div>
  )
}

function CommunauteGuidedRituel({ onNext, onBack }) {
  const [phase, setPhase] = useState(0)
  const [showPeps, setShowPeps] = useState(false)
  const phaseRefs = useRef({})

  useEffect(() => {
    const T = [0, 150, 300, 450, 600, 750, 900, 1050, 1200]
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
    margin: '0 0 32px',
  }

  function B({ children }) {
    return <strong style={{ fontWeight: 600, fontStyle: 'inherit' }}>{children}</strong>
  }

  function FeatureBadge({ label, color, bg, border }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-8px 0 32px' }}>
        <span style={{
          display: 'inline-block',
          fontSize: 'clamp(11px, 2.8vw, 13px)',
          fontFamily: 'Jost, sans-serif',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color, background: bg,
          border: `1px solid ${border}`,
          borderRadius: 100,
          padding: '5px 16px',
        }}>
          {label}
        </span>
      </div>
    )
  }

  function FeatureCard({ accent, accentBg, intro, label, desc }) {
    return (
      <div style={{ marginBottom: 8 }}>
        <p style={{ ...S, margin: '0 0 14px' }}>{intro}</p>
        <div style={{ borderRadius: 16, border: `1.5px solid ${accent}44`, background: accentBg, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '10px 18px', borderBottom: `1px solid ${accent}22`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, height: 20, borderRadius: 4, background: accent, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 600, letterSpacing: '.10em', textTransform: 'uppercase', color: accent }}>{label}</span>
          </div>
          <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(16px, 4.2vw, 19px)', color: '#0f0808', lineHeight: 1.7, margin: 0, padding: '14px 18px' }}>{desc}</p>
        </div>
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

  if (showPeps) return <PepsPage onNext={onNext} />

  return (
    <div style={{ padding: '16px 24px 80px' }}>
      <BackButton onClick={onBack} />

      <div style={{ textAlign: 'center', margin: '12px 0 40px' }}>
        <p style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 'clamp(11px, 2.8vw, 13px)',
          fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: '#1a1010', margin: '0 0 8px',
        }}>
          Laissez-moi vous présenter
        </p>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(30px, 7.5vw, 40px)',
          fontWeight: 700, fontStyle: 'italic',
          color: '#0a1828', lineHeight: 1.15, margin: '0 0 10px',
        }}>
          le jardin ensemble
        </h2>
        <div style={{
          width: 48, height: 2,
          background: 'linear-gradient(to right, transparent, #7a9ab8, transparent)',
          margin: '0 auto',
        }} />
      </div>

      {block(1, <p style={S}>Votre fleur <B>existe</B>.<br />Et elle n'est pas seule.</p>)}

      {block(2, <FeatureCard
        accent="#7a9ab8"
        accentBg="rgba(122,154,184,0.08)"
        intro={<>Autour de vous, d'autres jardiniers <B>cultivent</B> leur espace intérieur.</>}
        label="Le Jardin Collectif"
        desc={<>Un espace partagé où chaque fleur <B>contribue</B> au jardin commun par sa seule <B>présence</B>.</>}
      />)}

      {block(3, <FeatureCard
        accent="#9a78b0"
        accentBg="rgba(154,120,176,0.08)"
        intro={<>Vous n'avancez pas <B>seul·e</B>.</>}
        label="Le Club des Jardiniers"
        desc={<>Une communauté qui avance <B>ensemble</B>, se soutient et partage des <B>ondes positives</B>.</>}
      />)}

      {block(4, <FeatureCard
        accent="#b07860"
        accentBg="rgba(176,120,96,0.08)"
        intro={<>Pour ceux qui aiment <B>agir</B>…</>}
        label="Les Défis"
        desc={<>Des challenges pour partager des <B>mises en action</B> et <B>s'encourager</B> mutuellement.</>}
      />)}

      {block(5, <FeatureCard
        accent="#607860"
        accentBg="rgba(96,120,96,0.08)"
        intro={<>Pour aller plus <B>loin</B>…</>}
        label="Les Ateliers"
        desc={<>Des sessions guidées pour approfondir votre <B>mieux-être</B>, accompagné par des <B>professionnels</B>.</>}
      />)}

      {block(6, <FeatureCard
        accent="#a8a030"
        accentBg="rgba(168,160,48,0.08)"
        intro={<>Et enfin, une <B>énergie</B> qui se voit.</>}
        label="Les Lumens"
        desc={<>L'énergie de votre <B>engagement</B>, visible et <B>partageable</B>.</>}
      />)}

      {block(7, <FeatureCard
        accent="#8878a8"
        accentBg="rgba(136,120,168,0.08)"
        intro={<>Et pour ne jamais <B>avancer seul·e</B>…</>}
        label="La Jardinothèque"
        desc={<>Un ensemble d'outils pour vous <B>accompagner</B> dans votre <B>bien-être</B> au quotidien.</>}
      />)}

      {block(8, <>
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(122,154,184,.30), transparent)', margin: '8px 0 36px' }} />
        <p style={{ ...S, fontStyle: 'normal', fontWeight: 500, fontSize: 'clamp(20px, 5vw, 25px)', margin: '0 0 40px', textAlign: 'center' }}>
          <B>Votre jardin vous attend.</B><br />Et les autres jardiniers aussi.
        </p>
      </>)}

      <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= 9), pointerEvents: phase >= 9 ? 'auto' : 'none' }}>
        <PrimaryButton onClick={onNext}>Je rejoins le jardin</PrimaryButton>
      </div>
    </div>
  )
}

// ── RITUEL ─────────────────────────────────────────────────────────────────

function DayRituel({ data, answers, dayColor, onNext, onBack }) {
  const [showTransition, setShowTransition] = useState(!!data.getIntro)
  const [freeChoice,     setFreeChoice]     = useState(null)
  const [choiceStarted,  setChoiceStarted]  = useState(false)
  const [timerDone,      setTimerDone]      = useState(false)

  if (showTransition) {
    return (
      <RituelTransition
        introData={data.getIntro(answers)}
        dayColor={dayColor}
        onStart={() => setShowTransition(false)}
        onBack={onBack}
      />
    )
  }

  if (data.isGuided === 'tige')     return <TigeGuidedRituel     onNext={onNext} onBack={onBack} />
  if (data.isGuided === 'feuilles') return <FeuillesGuidedRituel onNext={onNext} onBack={onBack} />
  if (data.isGuided === 'fleurs')   return <FleursGuidedRituel   onNext={onNext} onBack={onBack} />
  if (data.isGuided === 'souffle')  return <SouffleGuidedRituel  onNext={onNext} onBack={onBack} />
  if (data.isGuided === 'jardin')      return <JardinGuidedRituel      onNext={onNext} onBack={onBack} />
  if (data.isGuided === 'communaute') return <CommunauteGuidedRituel  onNext={onNext} onBack={onBack} />
  if (data.isGuided)                  return <RacinesGuidedRituel     onNext={onNext} onBack={onBack} />

  const isFree       = !!data.isFreeChoice
  const activeLines  = isFree && freeChoice ? freeChoice.lines    : data.lines
  const activeDur    = isFree && freeChoice ? freeChoice.timerDuration : data.timerDuration
  const activeLabel  = isFree && freeChoice ? freeChoice.label    : data.timerLabel

  // Si rituel libre, on ne bloque pas tant qu'un choix n'est pas fait + timer démarré
  const canContinue  = isFree
    ? (!choiceStarted || timerDone)
    : (!data.hasTimer || timerDone)

  return (
    <div className="wof-in" style={{ padding: '8px 0 16px' }}>
      <BackButton onClick={onBack} />

      <p style={{
        fontFamily: 'Jost, sans-serif',
        fontSize: 11,
        fontWeight: 500,
        color: dayColor || '#c8a0b0',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        margin: '8px 0 6px',
        textAlign: 'center',
      }}>
        {data.zone}
      </p>

      {[data.intro].filter(Boolean).map((line, i) => (
        <p key={i} style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(15px, 3.5vw, 18px)',
          fontStyle: 'italic',
          color: '#000',
          textAlign: 'center',
          lineHeight: 1.7,
          margin: i === 0 ? '0 0 12px' : '0 0 12px',
        }}>
          {line}
        </p>
      ))}

      {/* Choix libre — Jour 7 */}
      {isFree && !choiceStarted && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {data.freeChoices.map((fc) => (
            <button
              key={fc.label}
              onClick={() => { setFreeChoice(fc); setChoiceStarted(true) }}
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: 14,
                color: '#000',
                background: '#f4eee8',
                border: 'none',
                borderRadius: 14,
                padding: '14px 20px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ede4de' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f4eee8' }}
            >
              <span style={{ fontWeight: 500 }}>{fc.label}</span>
              <span style={{ fontSize: 12, color: '#a09090' }}>{fc.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Lignes d'instructions */}
      {(!isFree || choiceStarted) && activeLines && (
        <div style={{
          background: '#f4eee8',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 20,
        }}>
          {activeLines.map((line, i) =>
            line === '' ? (
              <div key={i} style={{ height: 7 }} />
            ) : (
              <p key={i} style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: 14,
                fontWeight: 300,
                color: '#000',
                lineHeight: 1.75,
                margin: 0,
              }}>
                {line}
              </p>
            )
          )}
        </div>
      )}

      {/* Timer */}
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

function DayTrace({ text, onNext, onBack, onFleur }) {
  return (
    <div className="wof-in" style={{ padding: '8px 0 16px', textAlign: 'center' }}>
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

function DayOuverture({ text, isFinal, ctaLabel, onNext, onBack }) {
  return (
    <div className="wof-in" style={{ padding: '8px 0 16px', textAlign: 'center' }}>
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
            Ce jardin peut continuer à grandir avec vous.
          </h2>
          <p style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 14,
            fontWeight: 300,
            color: '#000',
            lineHeight: 1.65,
            margin: '0 0 36px',
          }}>
            Votre fleur vous attend.
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

function RacinesValidation({ answers, onNext, onBack }) {
  const [phase, setPhase] = useState(0)
  const phaseRefs = useRef({})
  const hasBarometer = !!answers?.j1?.feel

  useEffect(() => {
    const T = [0, 150, 300, hasBarometer ? 450 : 99999, 600]
    const timers = T.map((ms, i) => setTimeout(() => setPhase(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [hasBarometer])

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

  const ctaPhase = hasBarometer ? 5 : 4

  return (
    <div style={{ padding: '16px 24px 80px' }}>
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

      {block(1, <p style={S}>Vous venez de revenir à quelque chose de <B>simple</B>. Et souvent… c'est là que tout <B>commence</B>.</p>)}
      {block(2, <p style={S}>Quand les racines trouvent un peu plus de <B>stabilité</B>, le reste suit… <B>naturellement</B>.</p>)}
      {hasBarometer && block(3, <p style={S}>Et déjà, quelque chose est <B>légèrement différent</B>.</p>)}

      {block(hasBarometer ? 4 : 3, <>
        <div style={{
          width: 40, height: 1,
          background: 'rgba(180,130,100,0.3)',
          margin: '8px auto 40px',
        }} />
        <p style={{ ...S, fontStyle: 'normal', fontWeight: 500, fontSize: 'clamp(20px, 5vw, 24px)', margin: '0 0 12px' }}>
          <B>Demain</B>, vous allez découvrir ce qui vous tient debout…<br />même quand tout vacille.
        </p>
        <p style={{ ...S, margin: '0 0 48px' }}>
          Et vous pourriez voir les choses <B>autrement</B>.
        </p>
      </>)}

      <div style={{ display: 'flex', justifyContent: 'center', ...fadeIn(phase >= ctaPhase), pointerEvents: phase >= ctaPhase ? 'auto' : 'none' }}>
        <PrimaryButton onClick={onNext}>Je reviens demain</PrimaryButton>
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
                  {(helpText || "Un espace pour approfondir ce que vous venez de vivre.\n\nPrenez le temps de ressentir ce qui s'est passé en vous pendant cette étape.\n\nIl n'y a rien à forcer — juste à laisser la pratique continuer de résonner.")
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

  const dayConfig = WEEK_ONE_DATA[dayIndex]

  useEffect(() => {
    onStepChange?.(0, STEP_THEMES[0], dayConfig)
  }, [])

  function advance() {
    const next = step + 1
    setStep(next)
    setAnimKey((k) => k + 1)
    onStepChange?.(next, STEP_THEMES[next] ?? '', dayConfig)
  }

  function goBack() {
    const prev = Math.max(0, step - 1)
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
  }

  function handleDayDone() {
    onDayComplete({ type: 'complete' })
  }

  // Pour le getTrace de J6, on passe les jours complétés en incluant le jour courant
  const completedWithCurrent = completedDays.includes(dayConfig.day)
    ? completedDays
    : [...completedDays, dayConfig.day]

  const traceText = dayConfig.getTrace(answers, completedWithCurrent)

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
        />
      )}
      {step === 1 && (
        <DayIntrospection
          data={dayConfig.introspection}
          onAnswer={handleAnswer}
          onBack={goBack}
        />
      )}
      {step === 2 && (
        <DayRituel
          data={dayConfig.rituel}
          answers={answers}
          dayColor={dayConfig.color}
          onNext={advance}
          onBack={goBack}
        />
      )}
      {step === 3 && dayConfig.guidedValidation && (
        <RacinesValidation
          answers={answers}
          onNext={handleDayDone}
          onBack={goBack}
        />
      )}
      {step === 3 && !dayConfig.guidedValidation && (
        <DayTrace
          text={traceText}
          onNext={advance}
          onBack={goBack}
          onFleur={dayConfig.day === 6 ? () => setShowFleurModal(true) : undefined}
        />
      )}
      {step === 4 && (
        <DayOuverture
          text={dayConfig.ouverture}
          isFinal={!!dayConfig.isFinal}
          ctaLabel={dayConfig.finalCTA}
          onNext={handleDayDone}
          onBack={goBack}
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
  { day: 2, zone: 'tige',     zoneId: 'stem',    emoji: '🌿', label: 'Tige',     desc: 'Ce qui vous tient debout',     color: ZONE_COLORS.tige     },
  { day: 3, zone: 'feuilles', zoneId: 'leaves',  emoji: '🍃', label: 'Feuilles', desc: 'Ce qui circule en vous',       color: ZONE_COLORS.feuilles },
  { day: 4, zone: 'fleurs',   zoneId: 'flowers', emoji: '🌸', label: 'Fleurs',   desc: "Ce qui s'ouvre",               color: ZONE_COLORS.fleurs   },
  { day: 5, zone: 'souffle',  zoneId: 'breath',  emoji: '🌬️', label: 'Souffle',  desc: 'Ce qui relie tout',            color: ZONE_COLORS.souffle  },
  { day: 6, zone: null,       zoneId: null,      emoji: '✨', label: 'Votre fleur', desc: 'La naissance',         color: '#b8a090'            },
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
            Votre fleur intérieure
          </p>
          <h2 style={{ fontFamily: 'Jost, sans-serif', fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 700, color: '#000000', WebkitTextFillColor: '#000000', lineHeight: 1.25, margin: 0, background: 'none', backgroundClip: 'unset', WebkitBackgroundClip: 'unset' }}>
            Elle reflète ce que vous avez cultivé pendant 7 jours
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
          <PlantSVG health={health} gardenSettings={gardenSettings} lumensLevel="moyen" lumensTotal={0} compact={true} />
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
          Chaque rituel nourrit une zone — et change la forme de votre fleur.
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

function GardenDashboard({ completedDays, completionDates = {}, onContinue, onOpenZone, onClose, onSignOut, petalColor1, petalColor2, plantHealth }) {
  const [showFleurModal, setShowFleurModal] = useState(false)

  const completedZones = ZONE_DAYS
    .filter(z => completedDays.includes(z.day) && z.zone)
    .map(z => z.zone)

  const today   = new Date().toISOString().split('T')[0]
  const lastCompleted = Math.max(...completedDays, 0)
  const nextDay = Math.min(lastCompleted + 1, 7)

  // Jour suivant accessible seulement le lendemain de la complétion du précédent
  function isUnlocked(day) {
    if (day === 1) return true
    const prevDate = completionDates[day - 1]
    if (!prevDate) return false
    return today > prevDate // strict : lendemain à partir de 0h01
  }

  return (
    <div style={{ padding: '32px 24px 80px', maxWidth: 480, margin: '0 auto', minHeight: '100%', background: 'linear-gradient(160deg, #0d2818, #071510)' }}>
      {showFleurModal && <FleurDiscoveryModal onClose={() => setShowFleurModal(false)} />}

      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: 40, background: 'rgba(0,0,0,0.22)', borderRadius: 16, padding: '20px 16px 12px', backdropFilter: 'blur(2px)' }}>
        <p style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 'clamp(11px, 2.8vw, 13px)',
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#ffe8c0',
          margin: '0 0 8px',
          textShadow: '0 1px 6px rgba(0,0,0,0.7)',
        }}>
          Ce qui prend forme
        </p>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(28px, 7vw, 36px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#ffffff',
          lineHeight: 1.15,
          margin: '0 0 10px',
        }}>
          Ma Fleur
        </h2>
        <div style={{
          width: 48, height: 2,
          background: 'linear-gradient(to right, transparent, #b87c5a, transparent)',
          margin: '0 auto 20px',
        }} />
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontStyle: 'italic',
          fontSize: 'clamp(22px, 5.5vw, 28px)',
          fontWeight: 500,
          color: '#ffffff',
          margin: '0 0 14px',
          lineHeight: 1.5,
        }}>
          Ce que vous avez commencé… continue de grandir.
        </p>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontStyle: 'italic',
          fontSize: 'clamp(20px, 5vw, 25px)',
          fontWeight: 400,
          color: '#ffffff',
          margin: '0 0 12px',
          lineHeight: 1.5,
        }}>
          Votre fleur se révèle.
        </p>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontStyle: 'normal',
          fontSize: 'clamp(16px, 4vw, 19px)',
          color: 'rgba(255,255,255,0.85)',
          margin: 0,
          lineHeight: 1.65,
        }}>
          Chaque jour, une partie s'éveille. Chaque zone a un rôle pour vous.
        </p>
      </div>

      {/* Fleur mosaïque */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40, gap: 20 }}>
        <FlowerMosaic completedZones={completedZones} size={248} petalColor1={petalColor1} petalColor2={petalColor2} />

        {/* Phrase d'encouragement — apparaît juste après l'éclosion complète */}
        {completedZones.length >= 5 && (() => {
          const h = plantHealth ?? 30
          const phrase =
            h < 40 ? { text: 'Votre fleur vient de naître. Chaque jour qui passe l\'ancre un peu plus.', sub: 'Continuez, prendre soin d\'elle c\'est prendre soin de vous.' } :
            h < 55 ? { text: 'Votre fleur prend racine. On sent qu\'elle cherche la lumière.', sub: 'Les rituels l\'aident à grandir.' } :
            h < 65 ? { text: 'Votre fleur est en bouton. L\'éclosion est toute proche.', sub: 'Encore quelques soins et elle s\'ouvrira pleinement.' } :
            h < 78 ? { text: 'Votre fleur s\'épanouit. Elle reflète votre constance.', sub: 'Vous prenez soin d\'elle avec régularité.' } :
            h < 90 ? { text: 'Votre fleur rayonne. Elle est le reflet de votre engagement.', sub: 'Continuez — elle le ressent.' } :
                     { text: 'Votre fleur est en pleine éclosion.', sub: 'Elle reflète toute la vitalité que vous lui avez offerte.' }
          return (
            <div style={{
              textAlign: 'center', maxWidth: 260,
              animation: 'softRise 900ms 1.6s cubic-bezier(0.25,0.46,0.45,0.94) both',
              opacity: 0,
              animationFillMode: 'forwards',
            }}>
              <p style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontStyle: 'italic',
                fontSize: 'clamp(20px, 5vw, 25px)',
                fontWeight: 500,
                color: '#ffffff',
                margin: '0 0 8px',
                lineHeight: 1.5,
              }}>
                {phrase.text}
              </p>
              <p style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: 16,
                fontWeight: 400,
                color: 'rgba(255,255,255,0.80)',
                margin: 0,
                letterSpacing: '0.03em',
              }}>
                {phrase.sub}
              </p>
            </div>
          )
        })()}
      </div>

      {/* Cartes zones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ZONE_DAYS.map((z, i) => {
          const done      = completedDays.includes(z.day)
          const unlocked  = isUnlocked(z.day)
          const isCurrent = z.day === nextDay && unlocked && !done
          const locked    = !done && !isCurrent
          const clickable = done && z.zoneId ? () => onOpenZone(z.zoneId)
                          : isCurrent        ? onContinue
                          : undefined

          return (
            <div
              key={z.day}
              onClick={clickable}
              className="garden-day-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 18px',
                borderRadius: 14,
                background: done
                  ? 'rgba(20,10,5,0.58)'
                  : isCurrent
                    ? 'rgba(20,10,5,0.72)'
                    : 'rgba(20,10,5,0.35)',
                border: done
                  ? `1.5px solid ${z.color}88`
                  : isCurrent
                    ? `1.5px solid ${z.color}`
                    : '1.5px solid rgba(255,220,150,0.15)',
                boxShadow: isCurrent
                  ? `0 4px 20px ${z.color}44`
                  : 'none',
                cursor: clickable ? 'pointer' : 'default',
                filter: locked ? 'blur(1.5px)' : 'none',
                opacity: locked ? 0.5 : 1,
                transition: 'all 0.3s ease',
                animation: `softRise 600ms ${i * 80}ms cubic-bezier(0.25,0.46,0.45,0.94) both`,
              }}
            >
              {/* Emoji + pastille */}
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: done ? `${z.color}22` : isCurrent ? `${z.color}18` : 'rgba(200,180,170,0.15)',
                border: `1.5px solid ${done || isCurrent ? z.color + '55' : 'rgba(180,140,120,0.18)'}`,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                opacity: locked ? 0.4 : 1,
              }}>
                {z.emoji}
              </div>

              {/* Texte */}
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: 'Jost, sans-serif',
                  fontWeight: 600,
                  fontSize: 'clamp(13px, 3.2vw, 15px)',
                  color: '#ffffff',
                  margin: '0 0 3px',
                  letterSpacing: '0.02em',
                }}>
                  Jour {z.day} — {z.label}
                </p>
                <p style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 'clamp(13px, 3vw, 15px)',
                  color: 'rgba(255,255,255,0.70)',
                  margin: 0,
                }}>
                  {z.desc}
                </p>
              </div>

              {/* Badge statut */}
              {done && z.day === 6 && (
                <button
                  onClick={e => { e.stopPropagation(); setShowFleurModal(true) }}
                  style={{
                    fontFamily: 'Jost, sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#fff',
                    background: 'linear-gradient(135deg, #8878a8, #a890c8)',
                    border: 'none',
                    borderRadius: 100,
                    padding: '6px 14px',
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: '0 3px 12px rgba(136,120,168,0.35)',
                  }}
                >
                  🌸 Je découvre ma fleur
                </button>
              )}
              {done && z.day !== 6 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span className="badge-accompli" style={{
                    fontFamily: 'Jost, sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#1a1010',
                    background: 'rgba(255,255,255,0.85)',
                    border: `1px solid ${z.color}88`,
                    borderRadius: 100,
                    padding: '3px 10px',
                  }}>
                    accompli
                  </span>
                  {z.zoneId && (
                    <span style={{
                      fontFamily: 'Jost, sans-serif',
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.45)',
                      letterSpacing: '0.04em',
                    }}>
                      Voir les rituels →
                    </span>
                  )}
                </div>
              )}
              {isCurrent && (
                <span style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#fff',
                  background: z.color,
                  borderRadius: 100,
                  padding: '3px 10px',
                  flexShrink: 0,
                }}>
                  À vivre aujourd'hui
                </span>
              )}
              {locked && (
                <span style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 16,
                  color: '#b8a090',
                  flexShrink: 0,
                }}>
                  🔒
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Bouton fermeture */}
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <button
          onClick={onClose}
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontStyle: 'italic',
            fontSize: 'clamp(16px, 4vw, 19px)',
            color: '#1a1010',
            background: 'rgba(255,255,255,0.90)',
            border: '1px solid rgba(255,255,255,0.6)',
            borderRadius: 100,
            padding: '11px 32px',
            cursor: 'pointer',
            letterSpacing: '0.04em',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}
        >
          {lastCompleted >= 7 ? 'À très bientôt' : 'À demain'}
        </button>

        {onSignOut && (
          <div style={{ marginTop: 20 }}>
            <button
              onClick={onSignOut}
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: 12,
                fontWeight: 400,
                color: 'rgba(120,80,60,0.45)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.06em',
                padding: '4px 8px',
              }}
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

export function WeekOneFlow({ userId, onComplete, onAllDone, forceGarden, forceDay }) {
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
  ) // 'day' | 'garden'
  const [activeZoneId, setActiveZoneId] = useState(null)
  const [completedRituals, setCompletedRituals] = useState({})
  const { rituals: plantRituals } = useRituels()
  const [currentStep, setCurrentStep] = useState(0)

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

  // Déclenché à chaque changement de step (via DayShell)
  function handleStepChange(step, stepTheme, dayCfg) {
    setCurrentStep(step)
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
        ;(onAllDone ?? onComplete)?.()
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
            Votre jardin se prépare…
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
              <span style={{
                fontSize: 11, color: 'rgba(60,50,40,0.55)', letterSpacing: '.08em',
                background: 'rgba(255,255,255,0.70)', padding: '3px 10px', borderRadius: 100,
                backdropFilter: 'blur(4px)', fontFamily: 'Jost, sans-serif',
              }}>
                {String(weekData.currentDay).padStart(2,'0')} / 07
              </span>
            </div>
          </div>

          {/* ── Contenu (scrollable) ── */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'scroll', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', background: view === 'garden' ? 'linear-gradient(160deg, #0d2818, #071510)' : 'transparent' }}>
            {view === 'garden' ? (
              <GardenDashboard
                completedDays={weekData.completedDays}
                completionDates={weekData.completionDates || {}}
                onContinue={() => setView('day')}
                onOpenZone={setActiveZoneId}
                onClose={onComplete}
                onSignOut={handleSignOut}
                petalColor1={petalColor1}
                petalColor2={petalColor2}
                plantHealth={plantHealth}
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
            const STEP_KEYS = ['accueil', 'introspection', 'rituel', 'trace', 'ouverture']
            const helpText = currentConfig.helpTexts?.[STEP_KEYS[currentStep]]
            return <HelpBandeau helpText={helpText} />
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
