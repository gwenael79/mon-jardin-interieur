// src/pages/WeekOneFlow.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../core/supabaseClient'
import { RitualZoneModal, useRituels } from './mafleur_rituels'
import { useAuth } from '../hooks/useAuth'

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

      .wof-in { animation: stepIn 400ms ease both; }
      .wof-fl { animation: fleurFloat 6s ease-in-out infinite; }

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
      pauseSeconds: 2,
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
      pauseSeconds: 2,
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
      choices: [
        { label: '💼 Le travail',    value: 'travail'   },
        { label: '🤝 Les relations', value: 'relations' },
        { label: '🧘 Mon corps',     value: 'corps'     },
        { label: '🌀 Mes pensées',   value: 'pensees'   },
        { label: "🔭 L'avenir",      value: 'avenir'    },
      ],
    },
    rituel: {
      zone: 'Feuilles',
      intro: "Les feuilles captent la lumière. Elles reçoivent sans retenir.",
      getIntro: (ans) => {
        const space = ans?.j3?.space
        if (space === 'travail' || space === 'avenir') return {
          ctaLabel: 'Observer sans retenir',
          lines: [
            `Ce qui prend de la place en vous… c'est ${labelFor(space)}.`,
            "Les feuilles ne retiennent pas.",
            "Elles reçoivent, laissent traverser, et lâchent.",
            "C'est exactement ce qu'on va pratiquer.",
          ],
        }
        if (space === 'relations') return {
          ctaLabel: 'Laisser circuler',
          lines: [
            "Les relations prennent beaucoup d'espace parfois.",
            "Les feuilles captent tout ce qui arrive…",
            "mais elles savent aussi laisser passer.",
            "On va s'en inspirer.",
          ],
        }
        if (space === 'pensees') return {
          ctaLabel: 'Regarder sans me perdre',
          lines: [
            "Les pensées prennent beaucoup de place.",
            "Comme des feuilles agitées par le vent.",
            "On ne cherche pas à les arrêter.",
            "Juste à les regarder passer.",
          ],
        }
        return {
          ctaLabel: 'Observer ce qui est là',
          lines: [
            `Ce qui occupe votre espace… c'est ${labelFor(space)}.`,
            "Les feuilles reçoivent sans juger.",
            "Elles captent la lumière autant que l'ombre.",
            "On va simplement regarder ce qui est là.",
          ],
        }
      },
      lines: [
        'Choisissez une émotion présente en ce moment.',
        'Nommez-la intérieurement.',
        '',
        "Observez-la comme si c'était un nuage qui passe.",
        'Ne cherchez pas à la modifier.',
        '',
        'Juste : observer.',
      ],
      hasTimer: true,
      timerLabel: 'Observation silencieuse',
      timerDuration: 60,
    },
    getTrace: (ans) => {
      const space = ans?.j3?.space
      return space
        ? `Ce qui prenait le plus de place : ${labelFor(space)}. Vous l'avez observé sans le fuir.`
        : "Vous avez nommé quelque chose. C'est plus courageux qu'il n'y paraît."
    },
    ouverture: 'Demain, vous allez vous accorder quelque chose de rare.',
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
      pauseSeconds: 3,
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
      choices: [
        { label: '🤫 De silence',   value: 'silence'   },
        { label: '🚶 De mouvement', value: 'mouvement' },
        { label: '🫶 De douceur',   value: 'douceur'   },
        { label: '💡 De clarté',    value: 'clarte'    },
        { label: '🌱 De connexion', value: 'connexion' },
      ],
    },
    rituel: {
      zone: 'Fleurs',
      intro: "Les fleurs s'ouvrent quand elles sont prêtes. Pas avant.",
      getIntro: (ans) => {
        const need = ans?.j4?.need
        if (need === 'silence') return {
          ctaLabel: 'Entrer dans le silence',
          lines: [
            "Vous avez besoin de silence.",
            "Les fleurs s'ouvrent dans le calme.",
            "Ce scan corporel va créer cet espace pour vous.",
            "Rien à produire. Juste à recevoir.",
          ],
        }
        if (need === 'douceur') return {
          ctaLabel: 'Recevoir de la douceur',
          lines: [
            "Vous avez besoin de douceur aujourd'hui.",
            "Les fleurs s'ouvrent quand elles sont accueillies.",
            "Ce moment est entièrement pour vous.",
            "Laissez-vous simplement traverser.",
          ],
        }
        if (need === 'mouvement') return {
          ctaLabel: 'Traverser mon corps',
          lines: [
            "Vous avez besoin de mouvement.",
            "Ce scan vous invite à parcourir votre corps.",
            "Une façon douce de bouger… de l'intérieur.",
          ],
        }
        if (need === 'clarte') return {
          ctaLabel: 'Chercher la clarté',
          lines: [
            "Vous cherchez de la clarté.",
            "Parfois, elle vient quand on s'arrête de chercher.",
            "Ce scan va vous ramener dans le corps.",
            "C'est souvent là qu'elle attend.",
          ],
        }
        return {
          ctaLabel: "M'offrir de l'espace",
          lines: [
            `Vous avez besoin ${labelFor(need)} aujourd'hui.`,
            "Les fleurs ne s'ouvrent que quand elles ont de l'espace.",
            "C'est ce que vous allez vous offrir maintenant.",
          ],
        }
      },
      lines: [
        'Installez-vous confortablement.',
        '',
        'Scannez votre corps doucement, de la tête aux pieds.',
        'Remarquez les zones tendues, les zones douces.',
        '',
        'Ne cherchez pas à changer quoi que ce soit.',
        'Juste : passer en revue.',
      ],
      hasTimer: true,
      timerLabel: 'Scan corporel',
      timerDuration: 60,
    },
    getTrace: (ans) => {
      const need = ans?.j4?.need
      return need
        ? `Vous aviez besoin ${labelFor(need)}. Vous vous l'êtes accordé.`
        : "Vous venez de vous accorder de l'espace. Même peu… compte."
    },
    ouverture: 'Demain, quelque chose de nouveau entre dans votre jardin.',
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
      pauseSeconds: 2,
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
      choices: [
        { label: '🫥 Pas vraiment',         value: 'pas_vraiment'  },
        { label: '🌿 Un peu',               value: 'un_peu'        },
        { label: "🤗 Oui, avec quelqu'un",  value: 'avec_quelquun' },
        { label: '💛 Oui, avec moi-même',   value: 'avec_moi'      },
        { label: '🌊 Profondément',          value: 'profondement'  },
      ],
    },
    rituel: {
      zone: 'Souffle',
      intro: "Le souffle relie l'intérieur à l'extérieur. Il traverse tout.",
      getIntro: (ans) => {
        const connection = ans?.j5?.connection
        if (connection === 'pas_vraiment') return {
          ctaLabel: 'Créer un geste de lien',
          lines: [
            "Le lien peut sembler loin en ce moment.",
            "Le souffle ne juge pas.",
            "Il part de vous… et va quelque part.",
            "Ce rituel ne demande rien d'autre que ça.",
          ],
        }
        if (connection === 'un_peu') return {
          ctaLabel: 'Approfondir ce lien',
          lines: [
            "Vous avez ressenti un peu de lien.",
            "C'est souvent là que tout commence.",
            "Le souffle va l'amplifier doucement.",
          ],
        }
        if (connection === 'avec_quelquun') return {
          ctaLabel: 'Envoyer une pensée douce',
          lines: [
            "Vous avez ressenti du lien avec quelqu'un.",
            "Ce rituel va prolonger ce geste.",
            "Une pensée envoyée en silence… arrive toujours quelque part.",
          ],
        }
        if (connection === 'avec_moi') return {
          ctaLabel: 'Relier vers l\'extérieur',
          lines: [
            "Vous avez ressenti du lien avec vous-même.",
            "C'est la meilleure base qui soit.",
            "Maintenant… envoyons ce lien vers quelqu'un d'autre.",
          ],
        }
        return {
          ctaLabel: 'Laisser le souffle relier',
          lines: [
            "Vous avez ressenti du lien profondément.",
            "Le souffle est le passage entre l'intérieur et l'extérieur.",
            "Il relie tout. Laissez-le faire.",
          ],
        }
      },
      lines: [
        "Pensez à quelqu'un — proche ou lointain.",
        '',
        'En silence, envoyez-lui une "pensée douce".',
        'Pas de mots nécessaires.',
        'Juste : la direction de votre attention.',
        '',
        '30 secondes de ce geste invisible.',
      ],
      hasTimer: true,
      timerLabel: 'Pensée douce',
      timerDuration: 30,
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
  },

  /* ── JOUR 6 ─────────────────────────────────────────────────────────────── */
  {
    day: 6,
    title: 'Je prends conscience',
    color: '#b888a0',
    accueil: {
      conditioning: true,
      headline: 'Regardez ce qui a changé, même légèrement.',
      subtitle: "La croissance est souvent invisible jusqu'au jour où elle ne l'est plus.",
      pauseSeconds: 3,
    },
    introspection: {
      question: "Votre stress aujourd'hui comparé à il y a 6 jours est…",
      answerKey: 'stress',
      choices: [
        { label: '= Identique',        value: 'identique'      },
        { label: '↘ Légèrement moins', value: 'legere_moins'   },
        { label: '↓ Moins présent',    value: 'moins_present'  },
        { label: '⬇ Beaucoup moins',   value: 'beaucoup_moins' },
        { label: '~ Différent',        value: 'different'      },
      ],
    },
    rituel: {
      zone: 'Les 5 zones',
      intro: 'Toutes les zones sont maintenant actives. Ressentez-les ensemble.',
      lines: [
        'Respirez lentement.',
        '',
        'Portez votre attention successivement sur :',
        '• Vos pieds — racines',
        '• Votre colonne — tige',
        '• Votre poitrine — feuilles',
        '• Votre cœur — fleurs',
        '• Votre souffle — souffle',
        '',
        'Un cercle complet.',
      ],
      hasTimer: true,
      timerLabel: 'Cercle des 5 zones',
      timerDuration: 90,
    },
    getTrace: (ans, completedDays) => {
      const n = completedDays ? completedDays.length : 6
      return `Cette semaine, vous êtes revenu·e ${n} fois. Chaque zone nourrie est visible maintenant.`
    },
    ouverture: 'Demain, ce jardin devient vraiment le vôtre.',
  },

  /* ── JOUR 7 ─────────────────────────────────────────────────────────────── */
  {
    day: 7,
    title: 'Je fais partie',
    color: '#c8a0b0',
    gradient: 'linear-gradient(135deg, #c8a0b0 0%, #9ab8c8 35%, #7aaa88 65%, #c8a870 100%)',
    accueil: {
      conditioning: true,
      headline: 'Cela fait déjà une semaine.',
      subtitle: 'Vous prenez soin de vous.',
      pauseSeconds: 3,
    },
    introspection: {
      question: "Qu'est-ce que vous remarquez chez vous ?",
      answerKey: 'notice',
      choices: [
        { label: '🌊 Plus de calme',                   value: 'calme_plus'     },
        { label: '💡 Plus de clarté',                  value: 'clarte_plus'    },
        { label: '🌱 Plus de présence',                value: 'presence_plus'  },
        { label: "⚡ Plus d'énergie",                  value: 'energie_plus'   },
        { label: "✨ Quelque chose d'indéfinissable",  value: 'indefinissable' },
      ],
    },
    rituel: {
      zone: 'Rituel libre',
      intro: 'Vous connaissez maintenant vos zones. Choisissez ce dont vous avez besoin.',
      isFreeChoice: true,
      freeChoices: [
        {
          label: 'Respiration',
          desc: '3 cycles · Racines',
          timerDuration: 36,
          lines: [
            'Posez les pieds au sol.',
            '',
            '• Inspirez… 4 temps',
            '• Retenez… 2 temps',
            '• Expirez… 6 temps',
          ],
        },
        {
          label: 'Ancrage',
          desc: 'Pieds au sol · Tige',
          timerDuration: 30,
          lines: [
            'Sentez le contact de vos pieds.',
            '',
            'Restez simplement présent·e',
            'à cette sensation pendant 30 secondes.',
          ],
        },
        {
          label: 'Pause consciente',
          desc: 'Corps et souffle · Fleurs',
          timerDuration: 60,
          lines: [
            'Scannez votre corps de la tête aux pieds.',
            '',
            'Puis revenez doucement au souffle.',
            "Laissez s'installer un silence intérieur.",
          ],
        },
      ],
    },
    getTrace: () =>
      "Il y a 7 jours, vous avez commencé. Aujourd'hui… vous êtes toujours là.",
    ouverture: null,
    isFinal: true,
    finalCTA: 'Entrer dans mon jardin',
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
        color: '#b09898',
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
  const gap  = 4
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
                <FlowerIllustration size={size} color1={petalColor1} color2={petalColor2} />
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
                color: p.color,
                background: 'rgba(255,255,255,0.86)',
                padding: '2px 8px',
                borderRadius: 100,
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
          ? `radial-gradient(circle at 35% 30%, #fffde0, ${ZONE_COLORS.souffle})`
          : 'radial-gradient(circle at 35% 30%, #e0d8d4, #b8a8a4)',
        boxShadow: souffleActive
          ? `0 0 0 ${gap}px #faf5f2, 0 0 18px ${ZONE_COLORS.souffle}99`
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
        color: '#a09090',
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
          color: '#9a8888',
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
  const [isInhale, setIsInhale] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setIsInhale((v) => !v), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

      {/* Orbe + texte centré */}
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 42% 38%, #fff6f2 0%, #f0c8b4 38%, #9a6070 100%)',
          transform: isInhale ? 'scale(1.7)' : 'scale(1)',
          boxShadow: isInhale
            ? '0 0 55px 22px rgba(240,175,145,0.52), 0 0 90px 36px rgba(200,130,110,0.22)'
            : '0 0 14px 4px rgba(200,140,120,0.18)',
          transition: 'transform 5s ease-in-out, box-shadow 5s ease-in-out',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <p style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 11,
            fontWeight: 500,
            color: '#3a1818',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            margin: 0,
            transition: 'opacity 0.8s ease',
            whiteSpace: 'nowrap',
          }}>
            {isInhale ? 'Inspirez' : 'Expirez'}
          </p>
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
        color: '#6a5858',
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
        setTimeout(() => setPhase(1), 1800),  // "Quelque chose en vous…"
        setTimeout(() => setPhase(2), 3600),  // "Pas pour faire plus…"
        setTimeout(() => setPhase(3), 5400),  // "Ce que vous allez commencer…"
        setTimeout(() => setPhase(4), 7000),  // CTA
      ]
    } else if (subSlide === 1) {
      // SLIDE 1 — ARRÊT
      timers = [
        setTimeout(() => setPhase(1), 1000),  // "Et pour une fois…"
        setTimeout(() => setPhase(2), 2500),  // CTA "Prendre un instant"
      ]
    } else if (subSlide === 2) {
      // SLIDE 2 — CONNEXION
      timers = [
        setTimeout(() => setPhase(1), 600),   // animation respiration
        setTimeout(() => setPhase(2), 2400),  // CTA "Observer"
      ]
    } else {
      // SLIDE 3 — QUESTION
      timers = [
        setTimeout(() => setPhase(1), 400),   // badges
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
      timer = setTimeout(() => setBreathCta(true), 3200)
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
            color: '#7a6868',
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
                  fontWeight: isSelected ? 600 : 300,
                  color: isFilled ? level.color : 'rgba(80,55,55,0.38)',
                  transition: 'all 0.35s ease',
                  letterSpacing: isSelected ? '0.05em' : '0',
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

// ── INTROSPECTION ──────────────────────────────────────────────────────────

function DayIntrospection({ data, onAnswer, onBack }) {
  const [selected, setSelected] = useState(null)

  if (data.component === 'energy-battery') {
    return <EnergyBattery answerKey={data.answerKey} onAnswer={onAnswer} onBack={onBack} />
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
      setTimeout(() => setPhase(i + 1), (i + 1) * 1800)
    )
    timers.push(setTimeout(() => setPhase(lines.length + 1), (lines.length + 1) * 1800))
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
    const T = [0, 3000, 6200, 9500, 13500, 17000, 20800, 25000, 28500]
    const timers = T.map((ms, i) =>
      setTimeout(() => {
        setPhase(i + 1)
        // skip scroll for phase 1 — already at top
        if (i > 0) {
          setTimeout(() => {
            phaseRefs.current[i + 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 300)
        }
      }, ms)
    )
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
          color: '#9a7060',
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
            color: '#7a5c48',
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
      {block(8, <p style={{ ...S, fontStyle: 'normal', fontWeight: 500, fontSize: 'clamp(20px, 5vw, 25px)', margin: '0 0 40px' }}><B>Rien à faire</B> de plus. <B>Juste sentir.</B></p>)}

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
    const T = [0, 4000, 8500, 13000, 17500, 22000, 26000, 29500]
    const timers = T.map((ms, i) =>
      setTimeout(() => {
        setPhase(i + 1)
        if (i > 0) {
          setTimeout(() => {
            phaseRefs.current[i + 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 300)
        }
      }, ms)
    )
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
          color: '#6a8898',
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
            color: '#5a7888',
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

  if (data.isGuided === 'tige') {
    return <TigeGuidedRituel onNext={onNext} onBack={onBack} />
  }
  if (data.isGuided) {
    return <RacinesGuidedRituel onNext={onNext} onBack={onBack} />
  }

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

function DayTrace({ text, onNext, onBack }) {
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

      <div style={{ marginTop: 32 }}>
        <PrimaryButton onClick={onNext}>Continuer</PrimaryButton>
      </div>
    </div>
  )
}

// ── OUVERTURE ──────────────────────────────────────────────────────────────

function DayOuverture({ text, isFinal, ctaLabel, onNext, onBack }) {
  return (
    <div className="wof-in" style={{ padding: '8px 0 16px', textAlign: 'center' }}>
      <BackButton onClick={onBack} />

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
    const T = [0, 2800, 5800, hasBarometer ? 9000 : 99999, 12500]
    const timers = T.map((ms, i) =>
      setTimeout(() => {
        setPhase(i + 1)
        if (i > 0) {
          setTimeout(() => {
            phaseRefs.current[i + 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 300)
        }
      }, ms)
    )
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
          color: '#9a7060',
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
// 5. DayShell — orchestre les 5 étapes d'un jour
// ─────────────────────────────────────────────────────────────────────────────

function DayShell({ dayIndex, answers, completedDays, onDayComplete }) {
  const [step, setStep] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  const dayConfig = WEEK_ONE_DATA[dayIndex]

  function advance() {
    setStep((s) => s + 1)
    setAnimKey((k) => k + 1)
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1))
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
  { day: 6, zone: null,       zoneId: null,      emoji: '✨', label: 'Synthèse', desc: 'Les 5 zones ensemble',         color: '#b8a090'            },
  { day: 7, zone: null,       zoneId: null,      emoji: '🌻', label: 'Rituel',   desc: 'Votre rituel personnel',       color: '#a09080'            },
]

function GardenDashboard({ completedDays, completionDates = {}, onContinue, onOpenZone, onClose, onSignOut, petalColor1, petalColor2, plantHealth }) {

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
    <div style={{ padding: '32px 24px 80px', maxWidth: 480, margin: '0 auto' }}>

      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 'clamp(11px, 2.8vw, 13px)',
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#9a7060',
          margin: '0 0 8px',
        }}>
          Ce qui prend forme
        </p>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(28px, 7vw, 36px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#2a1010',
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
          fontSize: 'clamp(19px, 5vw, 24px)',
          color: '#5a3a2a',
          margin: '0 0 14px',
          lineHeight: 1.5,
        }}>
          Ce que vous avez commencé… continue de grandir.
        </p>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontStyle: 'italic',
          fontSize: 'clamp(17px, 4.2vw, 21px)',
          color: '#9a7060',
          margin: '0 0 12px',
          lineHeight: 1.5,
        }}>
          Votre fleur se révèle.
        </p>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontStyle: 'normal',
          fontSize: 'clamp(14px, 3.5vw, 16px)',
          color: '#a08878',
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
            h < 40 ? { text: 'Votre fleur vient de naître. Chaque jour qui passe l\'ancre un peu plus.', sub: 'Continuez, elle vous observe.' } :
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
                fontSize: 'clamp(16px, 4vw, 19px)',
                color: '#5a3a2a',
                margin: '0 0 6px',
                lineHeight: 1.5,
              }}>
                {phrase.text}
              </p>
              <p style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: 12,
                fontWeight: 400,
                color: '#a08878',
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 18px',
                borderRadius: 14,
                background: done
                  ? 'rgba(255,255,255,0.75)'
                  : isCurrent
                    ? 'rgba(255,255,255,0.90)'
                    : 'rgba(255,255,255,0.30)',
                border: done
                  ? `1.5px solid ${z.color}55`
                  : isCurrent
                    ? `1.5px solid ${z.color}`
                    : '1.5px solid rgba(180,130,100,0.15)',
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
                  color: done || isCurrent ? '#2a1010' : '#8a7070',
                  margin: '0 0 3px',
                  letterSpacing: '0.02em',
                }}>
                  Jour {z.day} — {z.label}
                </p>
                <p style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 'clamp(13px, 3vw, 15px)',
                  color: done || isCurrent ? '#7a5a4a' : '#9a8a80',
                  margin: 0,
                }}>
                  {z.desc}
                </p>
              </div>

              {/* Badge statut */}
              {done && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{
                    fontFamily: 'Jost, sans-serif',
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: z.color,
                    background: `${z.color}18`,
                    border: `1px solid ${z.color}44`,
                    borderRadius: 100,
                    padding: '3px 10px',
                  }}>
                    accompli
                  </span>
                  {z.zoneId && (
                    <span style={{
                      fontFamily: 'Jost, sans-serif',
                      fontSize: 10,
                      color: 'rgba(100,70,60,0.5)',
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
            color: '#9a7060',
            background: 'none',
            border: '1px solid rgba(180,130,100,0.30)',
            borderRadius: 100,
            padding: '11px 32px',
            cursor: 'pointer',
            letterSpacing: '0.04em',
            transition: 'all 0.2s ease',
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

export function WeekOneFlow({ userId, onComplete, forceGarden, forceDay }) {
  const { signOut } = useAuth()
  const [loading,     setLoading]     = useState(true)
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
  const [view, setView] = useState(
    forceDay > 1 || forceGarden ? 'garden' : 'day'
  ) // 'day' | 'garden'
  const [activeZoneId, setActiveZoneId] = useState(null)
  const [completedRituals, setCompletedRituals] = useState({})
  const { rituals: plantRituals } = useRituels()

  function handleToggleRitual(ritualId) {
    setCompletedRituals(prev => ({ ...prev, [ritualId]: !prev[ritualId] }))
  }

  // Chargement depuis Supabase
  useEffect(() => {
 console.log('🔍 WeekOneFlow useEffect — userId:', userId)

  if (forceGarden || forceDay) { setLoading(false); return }
  if (!userId) return

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
      await saveWeekData(updated)

      // ── Lumens d'évolution par jour complété ──────────────────────────
      if (userId) {
        const lumenAmount = dayNum === 7 ? 15 : dayNum === 5 ? 10 : 5
        supabase.rpc('award_lumens', {
          p_user_id: userId,
          p_amount:  lumenAmount,
          p_reason:  `week_one_day_${dayNum}`,
          p_meta:    { day: dayNum },
        }).catch(() => {})  // non-bloquant
      }

      if (dayNum === 7) {
        onComplete?.()
      } else {
        setView('garden')
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
          background: 'linear-gradient(160deg, #f8f0ec, #e8d8d0)',
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
        <div className="wof-modal">

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
          <div style={{ flex: 1, minHeight: 0, overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }}>
            {view === 'garden' ? (
              <GardenDashboard
                completedDays={weekData.completedDays}
                completionDates={weekData.completionDates || {}}
                onContinue={() => setView('day')}
                onOpenZone={setActiveZoneId}
                onClose={onComplete}
                onSignOut={signOut}
                petalColor1={petalColor1}
                petalColor2={petalColor2}
                plantHealth={plantHealth}
              />
            ) : (
              <DayShell
                key={weekData.currentDay}
                dayIndex={dayIndex}
                answers={weekData.answers}
                completedDays={weekData.completedDays}
                onDayComplete={handleDayEvent}
              />
            )}
          </div>

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
          />
        </div>
      )}
    </>
  )
}
