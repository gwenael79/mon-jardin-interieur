/**
import { useAnalytics } from '../hooks/useAnalytics'
 * ─────────────────────────────────────────────────────────────
 *  FICHIER D'INTÉGRATION — ScreenMonJardin · Section Rituels
 *  Basé sur plantself_v3 : zones, rituels, exercices quick/deep
 *  + quiz de dégradation quotidien
 * ─────────────────────────────────────────────────────────────
 *
 *  INSTRUCTIONS D'INTÉGRATION
 *  ──────────────────────────
 *  1. Copiez PLANT_ZONES, PLANT_RITUALS, PLANT_QUESTIONS,
 *     computeDegradation, computePlantHealth dans votre
 *     fichier (ou dans ritual.service.js)
 *
 *  2. Remplacez la section "Rituels du jour" de ScreenMonJardin
 *     par le JSX contenu dans <RitualsSection />
 *
 *  3. Ajoutez DailyQuizModal et RitualZoneModal comme composants
 *     locaux dans votre DashboardPage.jsx
 *
 *  4. Dans le state de ScreenMonJardin, ajoutez :
 *     const [degradation, setDegradation] = useState(null);
 *     const [completedRituals, setCompletedRituals] = useState({});
 *     const [showQuiz, setShowQuiz] = useState(false);
 *     const [activeZone, setActiveZone] = useState(null);
 *
 *  5. Au mount, chargez depuis localStorage (clé "mafleur-quiz-today")
 *     et déclenchez le quiz si la date ne correspond pas à aujourd'hui.
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════
//  DONNÉES — Zones, Rituels, Questions
// ═══════════════════════════════════════════════════════════

export const PLANT_ZONES = {
  roots:   { name: "Racines",  subtitle: "Ancrage & Énergie",    color: "#C8894A", accent: "#EDBE87", bg: "#120A03" },
  stem:    { name: "Tige",     subtitle: "Flexibilité & Corps",  color: "#5AAF78", accent: "#9DDBB4", bg: "#060F08" },
  leaves:  { name: "Feuilles", subtitle: "Liens & Humeur",       color: "#4A9E5C", accent: "#88D4A0", bg: "#060C08" },
  flowers: { name: "Fleurs",   subtitle: "Soin de Soi",          color: "#D4779A", accent: "#F2B8CC", bg: "#0E0508" },
  breath:  { name: "Souffle",  subtitle: "Présence & Sérénité",  color: "#6ABBE4", accent: "#B0DEFA", bg: "#03090E" },
};

export const PLANT_RITUALS = {
  roots: [
    {
      id: "r1", text: "Un repas qui me nourrit vraiment", icon: "🍃",
      quick: [
        { title: "La pause avant de manger", dur: "2 min", icon: "🍽️", desc: "Avant de prendre votre repas, posez les mains à plat sur la table. Fermez les yeux 30 secondes. Inspirez par le nez, ressentez l'odeur de ce que vous allez manger. Mangez la première bouchée en silence, en mâchant lentement 15 fois." },
        { title: "Scan des couleurs dans l'assiette", dur: "1 min", icon: "🌈", desc: "Regardez votre repas comme si vous le voyiez pour la première fois. Identifiez chaque couleur, chaque texture. Nommez mentalement ce que chaque aliment va apporter à votre corps. Remerciez votre corps de recevoir ce soin." },
        { title: "Bilan nutritionnel intuitif", dur: "3 min", icon: "⚡", desc: "Demandez-vous honnêtement : mon corps a-t-il faim d'énergie (glucides), de force (protéines), ou de légèreté (légumes) ? Choisissez un seul ingrédient à ajouter ou privilégier dans votre prochain repas." },
      ],
      deep: [
        { title: "Préparation d'un repas en pleine conscience", dur: "20–30 min", icon: "🥗", desc: "Choisissez de cuisiner un plat simple avec 3–5 ingrédients que vous aimez. Pendant la préparation, éteignez les écrans. Sentez chaque aliment avant de le couper. Observez les transformations — la chaleur, les textures qui changent. Mangez ensuite dans le silence ou avec de la musique douce." },
        { title: "Journal alimentaire intuitif", dur: "15 min", icon: "📓", desc: "Écrivez dans un carnet : quels aliments vous manquent vraiment en ce moment ? Quels aliments vous lourdissent ? Y a-t-il un lien entre ce que vous mangez et votre humeur ? Identifiez 2 changements simples et réalistes pour cette semaine." },
        { title: "Rituels autour des repas", dur: "10 min", icon: "🕯️", desc: "Créez un petit rituel pour votre prochain repas : mettez une belle assiette, allumez une bougie, mettez une musique qui vous fait du bien. Posez votre téléphone dans une autre pièce. Mangez assis, sans regarder un écran." },
      ],
    },
    {
      id: "r2", text: "5 min de centrage, pieds au sol", icon: "🧘",
      quick: [
        { title: "Ancrage 5-4-3-2-1", dur: "2 min", icon: "🌍", desc: "Debout ou assis, pieds bien à plat. Nommez mentalement : 5 choses que vous voyez, 4 que vous entendez, 3 que vous pouvez toucher, 2 odeurs, 1 goût. Terminez par 3 respirations profondes ventre gonflé à l'inspire, ventre rentré à l'expire." },
        { title: "Les pieds comme racines", dur: "2 min", icon: "🌳", desc: "Asseyez-vous et posez les deux pieds à plat sur le sol. Sentez le contact avec le sol. Imaginez des racines qui partent de vos plantes de pieds et s'enfoncent profondément dans la terre. À chaque expiration, laissez votre poids descendre un peu plus." },
        { title: "Scan corporel express", dur: "3 min", icon: "🔍", desc: "Fermez les yeux. Parcourez mentalement votre corps de la tête aux pieds. À chaque zone, expirez en relâchant la tension. Si une zone est douloureuse, respirez dedans sans chercher à la supprimer." },
      ],
      deep: [
        { title: "Méditation d'ancrage guidée", dur: "15–20 min", icon: "🧘", desc: "Asseyez-vous confortablement. Fermez les yeux. Sentez votre poids dans le siège. Suivez votre respiration pendant 5 minutes — inspirez en comptant 4, retenez 2, expirez en comptant 6. Puis laissez votre respiration retrouver son rythme naturel. Restez 10 minutes à simplement observer." },
        { title: "Marche pieds nus dans la nature", dur: "20–30 min", icon: "🌿", desc: "Si possible, retirez vos chaussures dehors. Marchez très lentement, en sentant chaque surface sous vos pieds. Posez d'abord le talon, puis le milieu, puis l'avant du pied. Cette pratique (earthing) est reconnue pour réduire le cortisol." },
        { title: "Yoga des racines (série courte)", dur: "20 min", icon: "🌱", desc: "Enchaînez ces postures en maintenant chacune 2–3 minutes : (1) Montagne — debout immobile. (2) Enfant — à genoux, front au sol. (3) Demi-pont — couché sur le dos, hanches soulevées. (4) Cadavre final — allongé, relâchez pendant 5 min." },
      ],
    },
    {
      id: "r3", text: "Hydratation consciente", icon: "💧",
      quick: [
        { title: "Le verre d'eau rituel", dur: "1 min", icon: "🥛", desc: "Prenez un grand verre d'eau à température ambiante. Avant de le boire, posez les deux mains autour. Respirez une fois profondément. Buvez lentement, en 5 à 7 gorgées, en ressentant chaque gorgée descendre dans votre gorge et votre poitrine." },
        { title: "Bilan hydratation", dur: "2 min", icon: "📊", desc: "Posez-vous ces questions : de quelle couleur étaient vos dernières urines ? Avez-vous bu au moins 1,5L hier ? Ressentez-vous des tensions dans la nuque ? Décidez d'un nombre de verres à boire avant midi." },
        { title: "Infusion consciente", dur: "3 min", icon: "🍵", desc: "Préparez une infusion (menthe, camomille, gingembre…). Pendant qu'elle infuse, posez vos mains autour de la tasse et sentez la chaleur. Inspirez la vapeur parfumée. Buvez la première gorgée en fermant les yeux." },
      ],
      deep: [
        { title: "Détox hydratante sur 1 journée", dur: "Journée entière", icon: "🌊", desc: "Posez une bouteille d'eau de 1,5L visible sur votre bureau. Planifiez 3 moments dans la journée pour boire : matin, avant chaque repas, avant le coucher. Remplacez café de l'après-midi par une infusion." },
        { title: "Rituel beauté intérieure", dur: "15 min", icon: "✨", desc: "Commencez par boire 2 grands verres d'eau citronnée. Préparez une infusion beauté (hibiscus, rose, romarin). Pendant qu'elle refroidit, faites un masque visage naturel. Restez allongé·e 10 min. Buvez l'infusion." },
        { title: "Journée sans boissons sucrées", dur: "Journée entière", icon: "🚫", desc: "Engagement pour aujourd'hui : remplacez toutes les boissons sucrées par de l'eau, des infusions ou des eaux aromatisées maison (concombre-menthe, citron-gingembre). Notez le soir votre niveau d'énergie." },
      ],
    },
    {
      id: "r4", text: "Coucher avant minuit ce soir", icon: "🌙",
      quick: [
        { title: "Protocole extinction lumières", dur: "3 min", icon: "💡", desc: "À 30 minutes de l'heure souhaitée de coucher, mettez votre téléphone en mode avion et posez-le hors de portée. Baissez tous les éclairages au maximum ou allumez une bougie. Votre cerveau reçoit alors le signal que la nuit commence." },
        { title: "Scan de fin de journée", dur: "2 min", icon: "🌙", desc: "Allongez-vous et fermez les yeux. Passez mentalement en revue votre journée : 1 chose qui s'est bien passée, 1 chose à lâcher pour cette nuit, 1 intention pour demain. C'est tout. Laissez votre corps peser dans le matelas." },
        { title: "Respiration 4-7-8", dur: "2 min", icon: "😴", desc: "Cette respiration active le système nerveux parasympathique. Inspirez par le nez en comptant 4, retenez en comptant 7, expirez lentement par la bouche en comptant 8. Répétez 4 fois." },
      ],
      deep: [
        { title: "Rituel de décompression du soir", dur: "30 min", icon: "🛁", desc: "1h avant de dormir : prenez une douche ou un bain chaud. Enfilez des vêtements confortables. Lisez un livre physique 20 min. Éteignez tous les écrans. Notez 3 pensées qui tournent dans votre tête dans un carnet." },
        { title: "Yoga nidra (yoga du sommeil)", dur: "20 min", icon: "🌌", desc: "Allongez-vous dans votre lit. Fermez les yeux. Portez votre attention successivement sur chaque partie de votre corps pendant 15–20 secondes. À la fin, ne faites plus rien — laissez le sommeil venir." },
        { title: "Écriture de décompression", dur: "15 min", icon: "📝", desc: "Prenez un carnet. Écrivez sans filtre tout ce qui tourne dans votre tête. Puis, sur une nouvelle page, écrivez 3 choses positives de la journée. Enfin, écrivez 1 seule priorité pour demain. Fermez le carnet." },
      ],
    },
  ],
  stem: [
    {
      id: "s1", text: "Bouger mon corps (marche, danse…)", icon: "🚶",
      quick: [
        { title: "1 minute de saut", dur: "1 min", icon: "⚡", desc: "Levez-vous et sautez sur place pendant 60 secondes — pas besoin de force, juste rebondir légèrement. Les sauts stimulent le système lymphatique, augmentent immédiatement le flux sanguin et libèrent des endorphines." },
        { title: "Marche de 3 minutes", dur: "3 min", icon: "🚶", desc: "Sortez ou marchez dans votre espace. Pendant les 3 minutes, concentrez-vous sur les sensations dans vos pieds, vos jambes, votre balancement naturel. Marchez un peu plus lentement que d'habitude, en ressentant chaque pas." },
        { title: "Étirements debout", dur: "2 min", icon: "🙆", desc: "Levez les bras au-dessus de la tête et étirez-vous vers le plafond. Puis penchez-vous sur le côté gauche, puis droit. Roulez les épaules 5 fois en arrière, 5 fois en avant. Tournez la tête lentement. Terminez par 3 grandes inspirations bras ouverts." },
      ],
      deep: [
        { title: "Marche méditée en nature", dur: "25–30 min", icon: "🌲", desc: "Partez marcher dehors. Laissez votre téléphone en mode silencieux. Marchez sans destination précise. Observez 3 choses belles sur votre chemin. Modifiez votre rythme : 5 min lentement, 5 min plus vite, 5 min lentement." },
        { title: "Session danse libre", dur: "15–20 min", icon: "💃", desc: "Mettez vos 5 chansons préférées. Commencez debout, les yeux fermés. Laissez votre corps bouger spontanément — pas de 'bien faire', juste répondre à la musique. À la 3ème chanson, votre corps aura trouvé son propre langage." },
        { title: "Marche + intention", dur: "20 min", icon: "🎯", desc: "Avant de partir marcher, définissez une intention. À chaque expiration, imaginez que vous déposez quelque chose. À chaque inspiration, vous recevez quelque chose — énergie, clarté, légèreté." },
      ],
    },
    {
      id: "s2", text: "Accueillir un imprévu sans résister", icon: "🌊",
      quick: [
        { title: "La pause STOP", dur: "2 min", icon: "✋", desc: "Face à une situation stressante : Stop — arrêtez tout 10 secondes. Respirez — 1 inspiration profonde, 1 longue expiration. Observez — nommez ce que vous ressentez. Puis choisissez — quelle est la réponse la plus utile ?" },
        { title: "Reformulation mentale", dur: "2 min", icon: "🔄", desc: "Prenez un imprévu de votre journée. Formulez : 'Cela m'oblige à…' (contrainte). Puis reformulez : 'Cela me permet de…' (opportunité). La flexibilité mentale se muscle comme un muscle." },
        { title: "Le corps d'abord", dur: "1 min", icon: "🌊", desc: "Quand une résistance surgit, posez une main sur votre sternum. Sentez la chaleur de votre main. Expirez lentement en disant intérieurement 'je peux accueillir ça'. Répétez 3 fois." },
      ],
      deep: [
        { title: "Journal des résistances", dur: "15 min", icon: "📓", desc: "Écrivez sur ce qui vous résiste en ce moment. Pas d'analyse — juste écrire librement pendant 8 minutes. Puis relisez et soulignez ce que vous n'acceptez pas. Pour chacun, écrivez : 'Si j'acceptais vraiment cela, je pourrais…'" },
        { title: "Méditation du fleuve", dur: "15–20 min", icon: "🏞️", desc: "Asseyez-vous. Imaginez que vous êtes au bord d'un fleuve tranquille. Chaque pensée est une feuille portée par le courant. Observez-la passer, sans la retenir, sans la repousser. Vous êtes la rive — stable, présent·e." },
        { title: "L'obstacle comme chemin", dur: "20 min", icon: "🧩", desc: "Prenez la situation qui vous résiste le plus. Notez : 1/ Ce que je veux. 2/ L'obstacle. 3/ Ce que l'obstacle m'apprend. 4/ Ce que je peux faire avec les ressources disponibles. Concluez en définissant 1 action concrète." },
      ],
    },
    {
      id: "s3", text: "Étirements ou pause corporelle", icon: "🤸",
      quick: [
        { title: "Détente nuque et épaules", dur: "2 min", icon: "🙆", desc: "Penchez doucement la tête vers l'épaule gauche, maintenez 20 secondes. Roulez la tête vers l'avant. Épaule droite. Puis roulez les deux épaules vers l'arrière, 5 fois lentement. Croisez les bras derrière le dos et ouvrez la poitrine." },
        { title: "Torsion assise", dur: "2 min", icon: "🔄", desc: "Assis, pieds à plat. Inspirez en grandissant. À l'expiration, tournez vers la droite, maintenez 5 respirations. Revenez au centre. Recommencez à gauche. Cette torsion libère les tensions du dos et stimule la digestion." },
        { title: "Posture de l'enfant", dur: "2 min", icon: "🧘", desc: "À genoux au sol, pliez-vous vers l'avant, front vers les genoux. Laissez votre dos s'arrondir, vos épaules se relâcher. Respirez profondément dans le bas du dos. Cette posture active le système nerveux parasympathique." },
      ],
      deep: [
        { title: "Séquence yoga du dos", dur: "20 min", icon: "🌱", desc: "Enchaînez ces postures, 3 minutes chacune : (1) Chat-Vache. (2) Chien tête en bas. (3) Cobra. (4) Pigeon. (5) Demi-bridge. (6) Savasana." },
        { title: "Automassage guidé", dur: "15 min", icon: "✋", desc: "Commencez par les pieds (roulez-les sur une balle). Remontez vers les mollets, cuisses, ventre (cercles dans le sens horaire), épaules, crâne. L'automassage réduit le cortisol et améliore la qualité du sommeil." },
        { title: "Marche nordique ou Qi gong", dur: "25–30 min", icon: "🌿", desc: "Si vous pouvez sortir : marchez en oscillant les bras en opposition aux jambes. Si vous restez : cherchez une vidéo de Qi gong débutant de 20 min. Ces mouvements libèrent les tensions accumulées." },
      ],
    },
    {
      id: "s4", text: "Respiration abdominale 3 min", icon: "🌬️",
      quick: [
        { title: "Cohérence cardiaque", dur: "3 min", icon: "💚", desc: "Inspirez lentement par le nez en comptant jusqu'à 5 — le ventre gonfle. Expirez lentement en comptant jusqu'à 5 — le ventre rentre. Répétez pendant 3 minutes (18 cycles). Pratiquée 3x/jour, cette technique réduit le cortisol de 20% en 6 semaines." },
        { title: "Respiration en carré", dur: "2 min", icon: "🔲", desc: "Inspirez (4s) · Retenez (4s) · Expirez (4s) · Vide (4s). Répétez 5 fois. Cette respiration est utilisée par les Navy SEALs pour revenir au calme en situation de stress intense." },
        { title: "Expiration longue anti-stress", dur: "2 min", icon: "🌬️", desc: "Inspirez par le nez en 4 secondes. Expirez très lentement par la bouche en 8 secondes, comme si vous souffliez sur une flamme sans l'éteindre. La clé est l'expiration longue — elle active le nerf vague. Répétez 6 fois." },
      ],
      deep: [
        { title: "Pranayama — respiration alternée", dur: "15 min", icon: "☯️", desc: "Assis, dos droit. Inspirez par la gauche (4s). Fermez les deux (2s). Expirez par la droite (8s). Inspirez par la droite (4s). Fermez (2s). Expirez par la gauche (8s). Faites 10 cycles. Cette pratique équilibre les deux hémisphères." },
        { title: "Cohérence cardiaque 3-6-5", dur: "15 min", icon: "❤️", desc: "3 fois par jour, 6 respirations par minute, pendant 5 minutes. Matin au réveil, avant le déjeuner, avant le soir. Maintenez un journal de votre ressenti avant/après pendant une semaine." },
        { title: "Respiration rebirthing douce", dur: "20–25 min", icon: "🌊", desc: "Allongez-vous. Respirez en cycle continu : inspir et expir reliés sans pause, par le nez. Maintenez ce cycle 20 minutes en laissant les émotions traverser votre corps sans les retenir. À la fin, restez 5 minutes en silence." },
      ],
    },
  ],
  leaves: [
    {
      id: "l1", text: "Un sourire sincère offert", icon: "😊",
      quick: [
        { title: "Le demi-sourire bouddhiste", dur: "1 min", icon: "🙂", desc: "Relevez très légèrement les coins de votre bouche — à peine perceptible, comme un secret intérieur. Fermez les yeux. Même un sourire volontaire minimal active les mêmes circuits que le sourire spontané et libère de la sérotonine." },
        { title: "Sourire mémorisé", dur: "2 min", icon: "💛", desc: "Fermez les yeux. Pensez à un moment récent où vous avez vraiment souri. Laissez le souvenir remplir tout votre corps. Sentez la chaleur dans la poitrine. Ouvrez les yeux en portant cette sensation." },
        { title: "Gratitude rapide", dur: "2 min", icon: "🙏", desc: "Pensez à une personne dans votre vie qui vous a apporté quelque chose de positif récemment. Nommez ce qu'elle a fait. Sentez la chaleur de cette gratitude dans votre corps." },
      ],
      deep: [
        { title: "Lettre de gratitude", dur: "20 min", icon: "✉️", desc: "Choisissez quelqu'un qui a eu un impact positif et à qui vous n'avez jamais dit merci. Écrivez-lui une lettre à la main — précis sur ce qu'il a fait, comment cela vous a affecté, et ce que ça a changé. Vous n'êtes pas obligé·e de l'envoyer." },
        { title: "Méditation Metta", dur: "15–20 min", icon: "💖", desc: "Envoyez mentalement ces 4 phrases : 'Puisses-tu être heureux·se. Puisses-tu être en bonne santé. Puisses-tu être en sécurité. Puisses-tu vivre avec légèreté.' Commencez par vous-même, puis quelqu'un que vous aimez, puis quelqu'un difficile." },
        { title: "Acte de gentillesse aléatoire", dur: "Variable", icon: "🌟", desc: "Choisissez aujourd'hui de faire une chose gentille sans que personne ne sache que c'est vous. Ces actes anonymes augmentent le plus le sentiment de sens et de bonheur." },
      ],
    },
    {
      id: "l2", text: "Un moment de rire partagé", icon: "😄",
      quick: [
        { title: "Yoga du rire — 1 min", dur: "1 min", icon: "😂", desc: "Commencez par rire de manière forcée — 'Ha ha ha, Ho ho ho'. Après 30–45 secondes, votre corps prend le relais et le rire devient naturel. 60 secondes suffisent pour libérer des endorphines." },
        { title: "La liste des choses absurdes", dur: "3 min", icon: "🤣", desc: "Notez toutes les situations légèrement cocasses de votre semaine — vos propres maladresses, les situations bizarres, les quiproquos. Relisez-les en cherchant ce qu'il y a de drôle." },
        { title: "Mème ou vidéo qui vous fait rire", dur: "2 min", icon: "📱", desc: "Permettez-vous 2 minutes de contenus qui vous font vraiment sourire. Mais faites-le intentionnellement — pas par habitude de scroll. Choisissez quelque chose, riez vraiment, puis fermez l'application." },
      ],
      deep: [
        { title: "Soirée comédie ou spectacle", dur: "60–90 min", icon: "🎭", desc: "Planifiez pour ce soir un spectacle d'humour (stand-up, comédie, film comique) que vous avez envie de voir depuis longtemps — ou appelez un ami pour le faire ensemble." },
        { title: "Jeu en famille ou entre amis", dur: "30–60 min", icon: "🎮", desc: "Proposez à des proches un jeu qui fait rire. La condition : pas d'écrans individuels pendant ce temps. Les moments de jeu collectif libèrent de l'ocytocine et créent des souvenirs partagés." },
        { title: "Cours d'improvisation", dur: "2h", icon: "🎪", desc: "Trouvez un cours d'improvisation théâtrale dans votre ville. L'improvisation développe simultanément la flexibilité mentale, le lien aux autres, l'humour et la confiance en soi." },
      ],
    },
    {
      id: "l3", text: "Prendre des nouvelles de quelqu'un", icon: "💬",
      quick: [
        { title: "Le message en 2 phrases", dur: "1 min", icon: "📱", desc: "Pensez à une personne à qui vous n'avez pas parlé depuis un moment. Envoyez-lui : ce que vous avez pensé d'elle récemment + une question sincère sur sa vie. Deux phrases suffisent pour maintenir un lien." },
        { title: "Appel de 3 minutes", dur: "3 min", icon: "📞", desc: "Appelez quelqu'un (pas un message — un appel). Dites-lui que vous pensiez à lui/elle. Posez une vraie question et écoutez vraiment la réponse. Un appel court mais sincère a plus de valeur qu'une longue conversation superficielle." },
        { title: "Observation attentive", dur: "2 min", icon: "👁️", desc: "Regardez quelqu'un dans votre entourage proche aujourd'hui avec une vraie attention. Qu'est-ce qui a l'air de le peser ? Qu'est-ce qui lui fait du bien ? Observez sans projeter." },
      ],
      deep: [
        { title: "Dîner intentionnel", dur: "1–2h", icon: "🍽️", desc: "Invitez quelqu'un à partager un repas. Proposez une règle : les téléphones restent dans les poches. Posez des questions inhabituelles : 'Qu'est-ce qui t'enthousiasme en ce moment ?'" },
        { title: "Lettre de reconnexion", dur: "20 min", icon: "✉️", desc: "Pensez à quelqu'un dont vous vous êtes éloigné·e. Écrivez-lui : comment vous êtes, ce que vous avez traversé, ce que vous appréciez chez lui/elle, et votre envie de reconnecter." },
        { title: "Conversation de qualité", dur: "45–60 min", icon: "🗣️", desc: "Organisez un appel pour avoir une vraie conversation. Commencez par : 'Si tu pouvais changer une chose dans ta vie cette année, ce serait quoi ?' Et partagez votre propre réponse honnêtement." },
      ],
    },
    {
      id: "l4", text: "Exprimer ma gratitude", icon: "🙏",
      quick: [
        { title: "3 gratitudes en 3 minutes", dur: "2 min", icon: "✨", desc: "Écrivez ou pensez à 3 choses pour lesquelles vous êtes reconnaissant·e aujourd'hui. La règle : elles doivent être spécifiques et nouvelles. La spécificité active beaucoup plus le circuit de récompense du cerveau." },
        { title: "Le remerciement silencieux", dur: "1 min", icon: "🌸", desc: "Fermez les yeux. Pensez à 1 personne qui vous a aidé·e cette semaine. Ressentez dans votre corps ce que sa présence vous a apporté. Laissez ce sentiment de chaleur rayonner dans votre poitrine." },
        { title: "Gratitude envers votre corps", dur: "2 min", icon: "💪", desc: "Fermez les yeux et remerciez votre corps : vos poumons, votre cœur, vos mains, vos jambes. Pour chaque partie, prenez 10 secondes. Si une partie vous fait souffrir, envoyez-lui de la gratitude aussi." },
      ],
      deep: [
        { title: "Journal de gratitude — 1 semaine", dur: "10 min/soir", icon: "📓", desc: "Engagez-vous 7 jours à écrire chaque soir 5 gratitudes spécifiques avec au moins 2 nouvelles chaque jour. En 7 jours, cette pratique recalibre le biais de négativité naturel du cerveau." },
        { title: "Visite de gratitude", dur: "30–60 min", icon: "🚶", desc: "Choisissez quelqu'un à qui vous êtes sincèrement reconnaissant·e. Écrivez une lettre précise (5–10 minutes). Puis allez la lui lire en personne. C'est l'intervention de psychologie positive au plus grand effet sur le bonheur." },
        { title: "Gratitude des difficultés", dur: "20 min", icon: "🌱", desc: "Choisissez une difficulté actuelle. Écrivez comment elle vous a forcé·e à grandir. Qu'auriez-vous raté si tout avait été facile ? Trouvez au moins 3 choses que cette épreuve vous a apportées." },
      ],
    },
  ],
  flowers: [
    {
      id: "f1", text: "Quelque chose rien que pour moi", icon: "🎁",
      quick: [
        { title: "5 minutes de rien", dur: "3 min", icon: "☁️", desc: "Posez tout. Asseyez-vous dans un endroit confortable. Ne faites rien d'utile — pas de liste, pas de planification. Juste exister. Ces minutes de 'non-productivité' volontaire sont l'un des actes les plus régénérateurs." },
        { title: "Plaisir sensoriel en 2 min", dur: "2 min", icon: "✨", desc: "Choisissez quelque chose de délicieux pour vos sens : une crème sur vos mains, un carré de chocolat mangé lentement, une musique adorée écoutée yeux fermés. L'acte de s'offrir un plaisir conscient recalibre la bienveillance envers soi." },
        { title: "Question de désir", dur: "2 min", icon: "💫", desc: "Posez-vous : 'Si personne ne me regardait et que rien n'était jugé, qu'est-ce que j'aurais vraiment envie de faire en ce moment ?' Notez la première réponse. Elle contient une information sur ce dont vous avez vraiment besoin." },
      ],
      deep: [
        { title: "Après-midi libre sans obligation", dur: "3–4h", icon: "🌅", desc: "Bloquez un après-midi dans votre agenda avec un seul critère : faire uniquement ce que vous avez envie de faire. Pas de 'devrait', pas de productivité." },
        { title: "Rituel beauté ou soin profond", dur: "45–60 min", icon: "🛁", desc: "Préparez-vous un vrai soin pour vous seul·e : bain aux huiles essentielles, masque visage maison, automassage. Allumez une bougie. Éteignez les notifications." },
        { title: "Initiation à une passion oubliée", dur: "1–2h", icon: "🎨", desc: "Pensez à quelque chose que vous aimiez faire enfant — dessiner, chanter, cuisiner, jardiner — et que vous avez abandonné. Consacrez-y 1 heure sans objectif de résultat." },
      ],
    },
    {
      id: "f2", text: "Prendre soin de mon apparence", icon: "💆",
      quick: [
        { title: "1 minute de soin intentionnel", dur: "1 min", icon: "✨", desc: "Choisissez un geste de soin que vous faites d'habitude en pilote automatique et faites-le cette fois avec une attention totale. L'intentionnalité transforme un geste banal en acte de soin envers soi-même." },
        { title: "Posture et regard dans le miroir", dur: "2 min", icon: "🪞", desc: "Tenez-vous devant un miroir. Redressez-vous : pieds ancrés, épaules en arrière. Regardez-vous dans les yeux. Maintenez 30 secondes. Choisissez 1 chose que vous appréciez dans votre apparence aujourd'hui." },
        { title: "Habillage intentionnel", dur: "3 min", icon: "👗", desc: "Choisissez ce que vous portez en fonction de comment vous voulez vous sentir — pas de comment vous voulez que les autres vous voient. Un vêtement qui vous fait vous sentir bien est un acte d'intelligence émotionnelle." },
      ],
      deep: [
        { title: "Rituel beauté complet", dur: "30–45 min", icon: "🌸", desc: "Consacrez un moment de qualité à votre apparence — pas pour les autres, pour vous. Douche, soin du visage, coiffure soignée. Pendant tout ce temps, parlez-vous intérieurement avec douceur." },
        { title: "Nettoyage et tri de sa garde-robe", dur: "1–2h", icon: "👘", desc: "Pour chaque vêtement : 'Est-ce que je me sens bien quand je porte ça ?' Si non — même neuf, même cher — mettez-le de côté. Ne garder que ce qui vous fait vous sentir bien est une forme de respect envers soi." },
        { title: "Journée de soin complet", dur: "Journée", icon: "💆", desc: "Planifiez une journée : coiffeur, massage, soin esthétique. Non pas comme récompense, mais parce que votre corps mérite une attention régulière." },
      ],
    },
    {
      id: "f3", text: "Une activité créative ou joyeuse", icon: "🎨",
      quick: [
        { title: "Dessin libre 3 min", dur: "3 min", icon: "✏️", desc: "Prenez une feuille et un stylo. Dessinez pendant 3 minutes sans but — juste ce que la main a envie de faire. L'évaluation est interdite. Cette pratique désactive temporairement l'amygdale (réactivité au stress)." },
        { title: "Playlist joie", dur: "2 min", icon: "🎵", desc: "Créez une playlist de 5 chansons qui vous donnent de la joie. Mettez-en une maintenant, à fond. Laissez votre corps répondre à la musique comme il veut." },
        { title: "La question créative", dur: "2 min", icon: "💡", desc: "Posez-vous une question absurde : 'Si ma journée était une peinture, de quelle couleur serait-elle ?' 'Si mon état intérieur était une météo ?' La métaphore créative donne accès à des émotions que le langage direct ne touche pas." },
      ],
      deep: [
        { title: "Session créative de 1h", dur: "60 min", icon: "🎨", desc: "Choisissez un medium créatif — dessin, peinture, écriture, musique. Consacrez-y 1 heure complète avec ce seul objectif : le plaisir du processus, pas le résultat." },
        { title: "Atelier ou cours découverte", dur: "2–3h", icon: "🏺", desc: "Inscrivez-vous à un atelier dans quelque chose que vous avez toujours voulu essayer. Être débutant·e volontaire recalibre la relation à l'erreur et ouvre la curiosité." },
        { title: "Journée de création", dur: "Demi-journée", icon: "🌟", desc: "Prenez une demi-journée avec une seule règle : créer quelque chose qui n'existait pas avant que vous le fassiez. Peu importe quoi, peu importe la qualité." },
      ],
    },
    {
      id: "f4", text: "Poser une limite qui me respecte", icon: "🛡️",
      quick: [
        { title: "La phrase-limite", dur: "2 min", icon: "🛡️", desc: "Pensez à une situation où vous avez du mal à dire non. Formulez mentalement : 'J'ai besoin de…', 'Je ne suis pas disponible pour…'. Préparer ses mots est déjà la moitié du chemin." },
        { title: "Le non sans explication", dur: "1 min", icon: "✋", desc: "Rappel : vous n'avez pas besoin de justifier un refus. 'Non, ça ne me convient pas' est une réponse complète. Choisissez quelque chose de petit à refuser aujourd'hui sans explication détaillée." },
        { title: "Scan de surengagement", dur: "3 min", icon: "📋", desc: "Regardez votre agenda de la semaine. Y a-t-il un engagement accepté à contrecœur ? Que pourriez-vous décliner, déléguer ou réduire ? Identifier les surengagements est la première étape pour se libérer." },
      ],
      deep: [
        { title: "Cartographie de mes limites", dur: "20 min", icon: "🗺️", desc: "Écrivez : 1/ Ce que je tolère actuellement et qui m'épuise. 2/ Ce dont j'ai besoin mais que je n'ose pas demander. 3/ Une relation dans laquelle mes limites ne sont pas respectées. Pour chaque point, notez 1 action concrète." },
        { title: "La conversation difficile", dur: "Variable", icon: "🗣️", desc: "Il y a souvent une conversation repoussée depuis des semaines. Préparez-la : ce que vous voulez dire, les mots exacts, le moment et le lieu. Puis faites-la. La peur est presque toujours plus grande que la conversation." },
        { title: "Coaching sur les limites", dur: "45–60 min", icon: "💬", desc: "Prenez rendez-vous avec un thérapeute ou coach pour explorer votre rapport aux limites. Si les difficultés à dire non sont récurrentes, elles ont souvent une origine — et la comprendre est plus transformateur que des techniques." },
      ],
    },
  ],
  breath: [
    {
      id: "b1", text: "Session de respiration consciente", icon: "🫁",
      quick: [
        { title: "Cohérence cardiaque express", dur: "3 min", icon: "💚", desc: "Inspirez par le nez en 5 secondes (ventre qui gonfle), expirez en 5 secondes (ventre qui rentre). Répétez 3 minutes — 18 cycles. Validée par des centaines d'études, réduit le cortisol et améliore la clarté mentale." },
        { title: "Respiration 4-7-8", dur: "2 min", icon: "😴", desc: "Inspirez en 4 secondes. Retenez en 7 secondes. Expirez lentement en 8 secondes. Répétez 4 fois. Cette technique active le système nerveux parasympathique — recommandée pour l'anxiété aiguë et l'insomnie." },
        { title: "Ventilation cellulaire", dur: "2 min", icon: "🌬️", desc: "Prenez 5 grandes inspirations (poumons pleins à 100%), puis 5 grandes expirations (poumons vides à 100%). Cette technique chasse le CO2 résiduel — sensation de légèreté et de clarté garantie." },
      ],
      deep: [
        { title: "Méthode Wim Hof — 3 cycles", dur: "15–20 min", icon: "❄️", desc: "Allongez-vous. 30 respirations rapides et profondes. Après la 30ème, expirez tout et retenez votre souffle le plus longtemps possible. Puis inspirez et retenez 15 secondes. C'est 1 cycle. Faites-en 3. Pratiquer allongé uniquement, jamais dans l'eau." },
        { title: "Pranayama — Nadi Shodhana", dur: "15 min", icon: "☯️", desc: "Respiration alternée. Inspirez par la gauche (4s). Fermez les deux (2s). Expirez par la droite (8s). Inspirez par la droite (4s). Fermez (2s). Expirez par la gauche (8s). Répétez 10 cycles." },
        { title: "Breath work accompagné", dur: "30–45 min", icon: "🌊", desc: "Cherchez une séance guidée de breathwork en ligne ou un praticien local. Ces sessions permettent d'aller plus loin dans la libération des tensions accumulées, souvent ancrées dans le corps avant le mental." },
      ],
    },
    {
      id: "b2", text: "5 min sans écran, juste présent·e", icon: "🌀",
      quick: [
        { title: "Micro-pause sensorielle", dur: "2 min", icon: "👁️", desc: "Posez votre téléphone. Nommez : 5 choses que vous voyez, 3 sons que vous entendez, 1 sensation dans votre corps. Les sens sont la porte d'entrée vers le présent — le mental est la porte vers le passé et le futur." },
        { title: "Fenêtre ou ciel", dur: "2 min", icon: "☁️", desc: "Levez les yeux vers une fenêtre ou sortez. Regardez le ciel pendant 2 minutes. Ne pensez à rien en particulier. Le regard vers l'horizon active un mode de conscience élargie." },
        { title: "Pose du téléphone — règle", dur: "1 min", icon: "📵", desc: "Choisissez un moment précis dans votre journée et posez votre téléphone dans une autre pièce. La simple présence d'un téléphone visible (même éteint) réduit de 20% les capacités cognitives disponibles." },
      ],
      deep: [
        { title: "Heure sans écran le matin", dur: "60 min", icon: "🌅", desc: "Engagez-vous pour demain matin : ne touchez pas à un écran pendant la première heure. Buvez un verre d'eau, étirez-vous, lisez, regardez par la fenêtre. Ce seul changement modifie profondément la qualité de toute la journée." },
        { title: "Digital detox d'une demi-journée", dur: "3–4h", icon: "🌲", desc: "Planifiez une demi-journée sans écran. Choisissez des activités analogiques — marche, lecture, cuisine, jardinage. Notez votre inconfort au début et comment il évolue." },
        { title: "Retraite silencieuse d'1 jour", dur: "Journée", icon: "🏔️", desc: "Passez une journée complète sans téléphone, sans parler, sans médias. Marchez, lisez, dessinez, reposez-vous. Ce n'est pas une punition — c'est un nettoyage profond du système nerveux." },
      ],
    },
    {
      id: "b3", text: "Observer mes pensées sans les suivre", icon: "🔮",
      quick: [
        { title: "La rivière de pensées", dur: "3 min", icon: "🏞️", desc: "Fermez les yeux. Imaginez que vos pensées sont des feuilles sur une rivière. Vous êtes assis·e sur la rive. Observez chaque pensée arriver, passer et s'éloigner. La méditation n'est pas l'absence de pensées — c'est l'art de ne plus les confondre avec soi." },
        { title: "Nomme et lâche", dur: "2 min", icon: "🏷️", desc: "Fermez les yeux 2 minutes. Pour chaque contenu mental, donnez-lui une étiquette : 'planification', 'souvenir', 'inquiétude', 'jugement'. Puis laissez-le passer. Nommer une pensée diminue son emprise émotionnelle." },
        { title: "Retour au souffle", dur: "2 min", icon: "🌬️", desc: "Fermez les yeux. Chaque fois qu'une pensée surgit, ramenez doucement votre attention sur votre respiration. La respiration est toujours dans le présent — elle est une ancre vers le maintenant." },
      ],
      deep: [
        { title: "Méditation Vipassana — 20 min", dur: "20 min", icon: "💎", desc: "Asseyez-vous dans une posture stable. Portez votre attention sur les sensations physiques — d'abord la respiration, puis les sensations dans chaque partie du corps. Quand l'esprit part, notez-le sans jugement et revenez." },
        { title: "Retraite de méditation guidée", dur: "2–3h", icon: "🧘", desc: "Rejoignez une séance de méditation collective dans votre ville. La méditation en groupe crée une énergie de présence collective et permet d'aller plus loin que seul·e." },
        { title: "Pratique MBSR (Mindfulness)", dur: "Variable", icon: "🌱", desc: "Le programme MBSR de Jon Kabat-Zinn est la méthode de pleine conscience la plus validée scientifiquement. Il existe des versions gratuites en ligne — engagez-vous pour 8 semaines, 45 min par jour." },
      ],
    },
    {
      id: "b4", text: "Un instant de silence choisi", icon: "☁️",
      quick: [
        { title: "2 minutes de silence absolu", dur: "2 min", icon: "🤫", desc: "Trouvez le lieu le plus silencieux accessible. Asseyez-vous. Fermez les yeux. Ne faites rien. N'essayez pas de méditer — juste être dans le silence. Le silence révèle ce qui était couvert par le bruit." },
        { title: "Silence dans la nature", dur: "3 min", icon: "🌿", desc: "Sortez si vous le pouvez. Fermez les yeux. Écoutez ce qu'il reste : vent, oiseaux, feuilles, votre souffle. Les sons naturels activent le système nerveux parasympathique." },
        { title: "Pause obligatoire", dur: "2 min", icon: "⏸️", desc: "Posez tout ce que vous faites. Éloignez-vous de votre poste. Ne vérifiez aucun écran. Restez debout, les mains libres, sans rien faire 2 minutes. C'est le muscle de la présence qui se réveille." },
      ],
      deep: [
        { title: "Bain de forêt (Shinrin-yoku)", dur: "2–3h", icon: "🌳", desc: "La pratique japonaise du Shinrin-yoku : s'immerger dans une forêt avec tous ses sens. Marchez très lentement, sans destination. Touchez les écorces. Sentez la mousse. Les effets perdurent plusieurs jours." },
        { title: "Journée de silence partielle", dur: "Demi-journée", icon: "🔕", desc: "Passez une demi-journée sans musique, sans podcast, sans télévision. Cuisinez en silence, marchez en silence. Observez comment votre rapport à vous-même change sans le fond sonore habituel." },
        { title: "Retraite de silence guidée", dur: "1–2 jours", icon: "⛩️", desc: "Trouvez un lieu de retraite proposant des journées de silence. Le silence prolongé avec un cadre bienveillant est l'une des expériences les plus transformatrices accessible sans engagement spirituel." },
      ],
    },
  ],
};

// ─── QUESTIONS QUIZ ──────────────────────────────────────
export const PLANT_QUESTIONS = [
  { id: "q1", zone: "roots",   theme: "Énergie vitale",  icon: "⚡", text: "Comment est votre énergie physique en ce moment ?", sub: "Fermez les yeux. Scannez votre corps de la tête aux pieds.", answers: [{ label: "Vidé·e", emoji: "🪫", stress: 95 }, { label: "Épuisé·e", emoji: "😴", stress: 72 }, { label: "Passable", emoji: "😐", stress: 48 }, { label: "Bien", emoji: "🌱", stress: 20 }, { label: "Plein·e d'élan", emoji: "✨", stress: 0 }] },
  { id: "q2", zone: "roots",   theme: "Sommeil",         icon: "🌙", text: "Quelle qualité avait votre sommeil cette nuit ?", sub: "Nuit agitée, fragments de rêves, réveil difficile…", answers: [{ label: "Cauchemardesque", emoji: "😩", stress: 95 }, { label: "Agité·e", emoji: "😣", stress: 72 }, { label: "Moyen", emoji: "😶", stress: 45 }, { label: "Reposant", emoji: "😌", stress: 15 }, { label: "Profond & doux", emoji: "🌟", stress: 0 }] },
  { id: "q3", zone: "stem",    theme: "Corps",           icon: "🤸", text: "Où en est votre corps en ce début de journée ?", sub: "Tensions, lourdeurs, contractures… ou légèreté.", answers: [{ label: "Douloureux", emoji: "😖", stress: 95 }, { label: "Contracté", emoji: "😬", stress: 70 }, { label: "Neutre", emoji: "😑", stress: 45 }, { label: "Détendu", emoji: "😊", stress: 18 }, { label: "Léger & libre", emoji: "🕊️", stress: 0 }] },
  { id: "q4", zone: "stem",    theme: "Flexibilité",     icon: "🌊", text: "Face à un imprévu, votre posture intérieure est…", sub: "Ce que vous portez avant même qu'il arrive.", answers: [{ label: "Effondrement", emoji: "😤", stress: 95 }, { label: "Résistance", emoji: "😰", stress: 70 }, { label: "Hésitation", emoji: "🤔", stress: 48 }, { label: "Adaptation", emoji: "🙆", stress: 20 }, { label: "Fluidité totale", emoji: "🌿", stress: 0 }] },
  { id: "q5", zone: "leaves",  theme: "Lien aux autres", icon: "🤝", text: "Votre désir de connexion avec les autres ce matin ?", sub: "Envie de partager, d'échanger, de rire ensemble…", answers: [{ label: "Retrait total", emoji: "🙈", stress: 95 }, { label: "Isolé·e", emoji: "🫥", stress: 72 }, { label: "Neutre", emoji: "🙂", stress: 48 }, { label: "Présent·e", emoji: "😄", stress: 20 }, { label: "Rayonnant·e", emoji: "🌞", stress: 0 }] },
  { id: "q6", zone: "leaves",  theme: "Humeur",          icon: "🎨", text: "Quelle couleur peindrait votre humeur en ce moment ?", sub: "Une teinte émotionnelle, pas un jugement.", answers: [{ label: "Noir profond", emoji: "🌑", stress: 95 }, { label: "Gris lourd", emoji: "🌥️", stress: 72 }, { label: "Beige terne", emoji: "🌤️", stress: 48 }, { label: "Jaune doux", emoji: "🌼", stress: 18 }, { label: "Or lumineux", emoji: "☀️", stress: 0 }] },
  { id: "q7", zone: "flowers", theme: "Rapport à soi",   icon: "💆", text: "Comment vous sentez-vous vis-à-vis de vous-même ?", sub: "Bienveillance, indifférence, critique intérieure…", answers: [{ label: "Très dur·e", emoji: "😞", stress: 95 }, { label: "Déconnecté·e", emoji: "😕", stress: 70 }, { label: "Neutre", emoji: "😌", stress: 45 }, { label: "Avec douceur", emoji: "🌸", stress: 18 }, { label: "Avec amour", emoji: "💖", stress: 0 }] },
  { id: "q8", zone: "flowers", theme: "Anticipation",    icon: "🌅", text: "Face à la journée qui s'ouvre, votre ressenti est…", sub: "Ce que vous portez avant même qu'elle commence.", answers: [{ label: "Angoisse", emoji: "😨", stress: 95 }, { label: "Préoccupation", emoji: "😟", stress: 70 }, { label: "Neutralité", emoji: "😐", stress: 45 }, { label: "Sérénité", emoji: "🙂", stress: 18 }, { label: "Joie anticipée", emoji: "🌟", stress: 0 }] },
  { id: "q9", zone: "breath",  theme: "Stress intérieur",icon: "🌀", text: "Quel est le niveau de tension que vous portez là, maintenant ?", sub: "Pas dans les idées — dans le ventre, la gorge, les épaules.", answers: [{ label: "Insupportable", emoji: "🔥", stress: 100 }, { label: "Élevé", emoji: "⚠️", stress: 75 }, { label: "Gérable", emoji: "💛", stress: 48 }, { label: "Faible", emoji: "💚", stress: 18 }, { label: "Absent", emoji: "🌬️", stress: 0 }] },
  { id: "q10",zone: "breath",  theme: "Présence",        icon: "🔮", text: "Êtes-vous dans votre corps, ou perdu·e dans vos pensées ?", sub: "Le fil entre le mental et le vivant.", answers: [{ label: "Tourbillon mental", emoji: "🌪️", stress: 95 }, { label: "Plutôt dans la tête", emoji: "💭", stress: 70 }, { label: "Entre les deux", emoji: "⚖️", stress: 45 }, { label: "Ancré·e", emoji: "🌱", stress: 15 }, { label: "Pleinement ici", emoji: "🧘", stress: 0 }] },
];

// ─── FONCTIONS DE CALCUL ─────────────────────────────────
export function computeDegradation(answers) {
  const acc = {};
  Object.keys(PLANT_ZONES).forEach(z => { acc[z] = { w: 0, s: 0 }; });
  PLANT_QUESTIONS.forEach(q => {
    if (answers[q.id] === undefined) return;
    acc[q.zone].s += q.answers[answers[q.id]].stress;
    acc[q.zone].w += 1;
  });
  const deg = {};
  Object.keys(PLANT_ZONES).forEach(z => {
    deg[z] = acc[z].w > 0 ? Math.round(acc[z].s / acc[z].w) : 50;
  });
  return deg;
}

export function computePlantHealth(degradation, completed, previousHealth) {
  const health = {};
  Object.keys(PLANT_ZONES).forEach(z => {
    const prev = previousHealth?.[z] ?? 72;
    const floor = Math.max(5, 100 - degradation[z]);
    const baseline = Math.round(prev * 0.25 + floor * 0.75);
    const rituals = Object.values(PLANT_RITUALS[z] || []);
    const done = rituals.filter(r => completed[r.id]).length;
    const healPct = rituals.length > 0 ? done / rituals.length : 0;
    health[z] = Math.round(baseline + (Math.min(100, baseline + 45) - baseline) * healPct);
  });
  return health;
}

// ═══════════════════════════════════════════════════════════
//  COMPOSANT : DailyQuizModal
//  Quiz de dégradation quotidien (10 questions)
//  Props : onComplete(degradation) | onSkip()
// ═══════════════════════════════════════════════════════════
export function DailyQuizModal({ onComplete, onSkip }) {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [visible, setVisible] = useState(true);

  const startQuiz = () => {
    setVisible(false);
    setTimeout(() => { setStep(0); setVisible(true); }, 250);
  };

  const choose = (idx) => {
    if (!transitioning) setSelected(idx);
  };

  const next = () => {
    if (selected === null || transitioning) return;
    setTransitioning(true);
    setVisible(false);
    const q = PLANT_QUESTIONS[step];
    const newAnswers = { ...answers, [q.id]: selected };
    setTimeout(() => {
      if (step < PLANT_QUESTIONS.length - 1) {
        setStep(step + 1);
        setAnswers(newAnswers);
        setSelected(null);
        setTransitioning(false);
        setVisible(true);
      } else {
        const deg = computeDegradation(newAnswers);
        onComplete(deg, newAnswers);
      }
    }, 280);
  };

  // Écran d'accueil du quiz
  if (step === -1) return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(6, 14, 7, 0.96)", backdropFilter: "blur(16px)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "40px 28px",
    }}>
      <div style={{
        textAlign: "center", maxWidth: 340,
        opacity: visible ? 1 : 0, transition: "opacity 0.5s ease",
      }}>
        <div style={{ fontSize: 52, marginBottom: 24, display: "inline-block", animation: "pulse 3s ease-in-out infinite" }}>🌹</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif", fontSize: 36, color: "#EEF0E8", fontWeight: 300, lineHeight: 1.1, marginBottom: 12 }}>
          Comment vous<br /><em style={{ fontStyle: "italic", color: "#C8A882" }}>sentez-vous</em> aujourd'hui ?
        </h2>
        <div style={{ width: 40, height: 1, background: "rgba(200,168,130,0.3)", margin: "16px auto" }} />
        <p style={{ color: "rgba(180,200,180,0.5)", fontSize: 13, lineHeight: 1.7, marginBottom: 6 }}>
          Dix questions pour prendre votre pouls intérieur.
        </p>
        <p style={{ color: "rgba(180,200,180,0.3)", fontSize: 11.5, lineHeight: 1.7, marginBottom: 32 }}>
          Votre plante reflétera votre état et vous révèlera les zones à soigner en priorité.
        </p>
        <button
          onClick={startQuiz}
          style={{ padding: "13px 40px", borderRadius: 50, border: "1px solid rgba(200,168,130,0.35)", background: "rgba(200,168,130,0.1)", color: "#C8A882", fontSize: 13, cursor: "pointer", letterSpacing: "0.08em", display: "block", width: "100%", marginBottom: 10 }}
        >
          Commencer le bilan
        </button>
        <button
          onClick={onSkip}
          style={{ padding: "10px", borderRadius: 50, border: "none", background: "none", color: "rgba(180,200,180,0.3)", fontSize: 12, cursor: "pointer", letterSpacing: "0.05em", width: "100%" }}
        >
          Passer pour aujourd'hui
        </button>
        <p style={{ color: "rgba(180,200,180,0.2)", fontSize: 10, marginTop: 12 }}>Environ 2 minutes · Confidentiel</p>
      </div>
    </div>
  );

  const q = PLANT_QUESTIONS[step];
  const zone = PLANT_ZONES[q.zone];
  const progress = (step + 1) / PLANT_QUESTIONS.length;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "linear-gradient(170deg, #060E07 0%, #080E0A 60%, #060810 100%)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Barre de progression */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.05)", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: `linear-gradient(90deg, ${zone.color}, ${zone.accent})`, borderRadius: "0 1px 1px 0", transition: "width 0.5s ease" }} />
      </div>

      {/* Header zone */}
      <div style={{ padding: "16px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: zone.color, opacity: 0.8, fontWeight: 500 }}>
          {zone.name} · {q.theme}
        </span>
        <span style={{ fontSize: 11, color: "rgba(180,200,180,0.3)" }}>
          {step + 1} <span style={{ opacity: 0.4 }}>/ 10</span>
        </span>
      </div>

      {/* Question */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 24px", maxWidth: 440, width: "100%", margin: "0 auto",
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.28s ease, transform 0.28s ease",
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>{q.icon}</div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif", fontSize: 24, color: "#EEF0E8", fontWeight: 400, lineHeight: 1.25, marginBottom: 6 }}>{q.text}</h3>
        <p style={{ fontSize: 12, color: "rgba(180,200,180,0.4)", lineHeight: 1.6, marginBottom: 20, fontStyle: "italic" }}>{q.sub}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {q.answers.map((ans, i) => {
            const sel = selected === i;
            return (
              <button key={i} onClick={() => choose(i)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", borderRadius: 12, textAlign: "left", cursor: "pointer",
                border: `1px solid ${sel ? `${zone.color}55` : "rgba(255,255,255,0.07)"}`,
                background: sel ? "rgba(60,160,80,0.08)" : "rgba(255,255,255,0.025)",
                boxShadow: sel ? `0 0 0 1px ${zone.color}30` : "none",
                transition: "all 0.18s ease",
              }}>
                <span style={{ fontSize: 18 }}>{ans.emoji}</span>
                <span style={{ flex: 1, fontSize: 13, color: sel ? "#D8EED8" : "rgba(190,210,190,0.6)", fontWeight: sel ? 500 : 300 }}>{ans.label}</span>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${sel ? zone.color : "rgba(255,255,255,0.15)"}`, background: sel ? `${zone.color}30` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s", flexShrink: 0 }}>
                  {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: zone.accent }} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bouton suivant */}
      <div style={{ padding: "0 24px 40px", maxWidth: 440, width: "100%", margin: "0 auto" }}>
        <button onClick={next} disabled={selected === null} style={{
          width: "100%", padding: "14px", borderRadius: 12,
          border: `1px solid ${selected !== null ? `${zone.color}40` : "rgba(255,255,255,0.06)"}`,
          background: selected !== null ? "rgba(60,160,80,0.12)" : "rgba(255,255,255,0.03)",
          color: selected !== null ? zone.accent : "rgba(255,255,255,0.2)",
          fontSize: 13, cursor: selected !== null ? "pointer" : "not-allowed",
          fontWeight: 500, letterSpacing: "0.06em", transition: "all 0.25s",
        }}>
          {step === PLANT_QUESTIONS.length - 1 ? "Voir mes rituels →" : "Suivant →"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  COMPOSANT : ExerciseDetail
//  Sous-vue du modal rituel : détail d'un exercice
// ═══════════════════════════════════════════════════════════
function ExerciseDetail({ exercise, zone, onDone, onBack }) {
  const [done, setDone] = useState(false);

  const handleDone = () => {
    setDone(true);
    setTimeout(onDone, 500);
  };

  return (
    <div style={{ animation: "fadeUp 0.28s ease both" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "rgba(180,200,180,0.45)", fontSize: 12, cursor: "pointer", marginBottom: 20, padding: 0, letterSpacing: "0.05em" }}>
        ← Retour
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 26 }}>{exercise.icon}</span>
        <div>
          <h3 style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", fontSize: 20, color: "#EEF0E8", fontWeight: 400, lineHeight: 1.15 }}>{exercise.title}</h3>
          <span style={{ fontSize: 10, color: zone.accent, fontWeight: 500, letterSpacing: "0.06em" }}>⏱ {exercise.dur}</span>
        </div>
      </div>
      <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "14px 0" }} />
      <p style={{ fontSize: 13, color: "rgba(200,220,200,0.7)", lineHeight: 1.85, marginBottom: 28, fontWeight: 300 }}>
        {exercise.desc}
      </p>
      <button onClick={handleDone} style={{
        width: "100%", padding: "15px", borderRadius: 12, border: "none",
        background: done ? "rgba(88,200,120,0.25)" : `linear-gradient(135deg, ${zone.color}28, ${zone.accent}18)`,
        color: done ? "#88D4A0" : zone.accent,
        fontSize: 13, cursor: "pointer", fontWeight: 500, letterSpacing: "0.06em",
        boxShadow: `0 0 0 1px ${done ? "rgba(88,200,120,0.4)" : zone.color + "35"}`,
        transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        {done ? "✓ Rituel accompli" : "J'ai fait cet exercice"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  COMPOSANT : RitualExercises
//  Choix quick/deep + liste des exercices
// ═══════════════════════════════════════════════════════════
function RitualExercises({ ritual, zone, onComplete, onBack }) {
  const [mode, setMode] = useState(null); // null | "quick" | "deep"
  const [activeEx, setActiveEx] = useState(null);

  if (activeEx) return (
    <ExerciseDetail
      exercise={activeEx}
      zone={zone}
      onDone={onComplete}
      onBack={() => setActiveEx(null)}
    />
  );

  // Choix du mode
  if (!mode) return (
    <div style={{ animation: "fadeUp 0.3s ease both" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "rgba(180,200,180,0.45)", fontSize: 12, cursor: "pointer", marginBottom: 20, padding: 0, letterSpacing: "0.05em" }}>
        ← Retour
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 26 }}>{ritual.icon}</span>
        <h3 style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", fontSize: 20, color: "#EEF0E8", fontWeight: 400, lineHeight: 1.1 }}>{ritual.text}</h3>
      </div>
      <p style={{ fontSize: 11.5, color: "rgba(180,200,180,0.35)", fontStyle: "italic", marginBottom: 22, lineHeight: 1.5 }}>
        Comment souhaitez-vous aborder ce rituel aujourd'hui ?
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {/* Je sais quoi faire */}
        <button onClick={onComplete} style={{ padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer", border: `1px solid ${zone.color}35`, background: `${zone.color}0C`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>✅</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: zone.accent, fontWeight: 500, marginBottom: 2 }}>Je sais quoi faire</div>
            <div style={{ fontSize: 11, color: "rgba(180,200,180,0.4)" }}>Je le marque comme accompli directement.</div>
          </div>
          <span style={{ color: "rgba(180,200,180,0.25)", fontSize: 14 }}>→</span>
        </button>

        {/* Coup de pouce */}
        <button onClick={() => setMode("quick")} style={{ padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>💡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#EEF0E8", fontWeight: 500, marginBottom: 2 }}>J'ai besoin d'un coup de pouce</div>
            <div style={{ fontSize: 11, color: "rgba(180,200,180,0.4)" }}>3 exercices rapides · 1 à 3 minutes</div>
          </div>
          <span style={{ color: "rgba(180,200,180,0.25)", fontSize: 14 }}>→</span>
        </button>

        {/* Je prends du temps */}
        <button onClick={() => setMode("deep")} style={{ padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🌿</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#EEF0E8", fontWeight: 500, marginBottom: 2 }}>Je prends du temps pour ça</div>
            <div style={{ fontSize: 11, color: "rgba(180,200,180,0.4)" }}>3 pratiques profondes · 10 à 30 minutes</div>
          </div>
          <span style={{ color: "rgba(180,200,180,0.25)", fontSize: 14 }}>→</span>
        </button>
      </div>
    </div>
  );

  // Liste des exercices
  const exercises = mode === "quick" ? ritual.quick : ritual.deep;
  const modeLabel = mode === "quick" ? "Coup de pouce · 1–3 min" : "Pratique profonde · 10–30 min";
  const modeColor = mode === "quick" ? "#FFD080" : "#B0DEFA";

  return (
    <div style={{ animation: "fadeUp 0.28s ease both" }}>
      <button onClick={() => setMode(null)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "rgba(180,200,180,0.45)", fontSize: 12, cursor: "pointer", marginBottom: 20, padding: 0, letterSpacing: "0.05em" }}>
        ← Retour
      </button>
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: modeColor, fontWeight: 500 }}>{modeLabel}</span>
      </div>
      <h3 style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", fontSize: 18, color: "#EEF0E8", fontWeight: 400, marginBottom: 18, lineHeight: 1.2 }}>Choisissez un exercice</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {exercises.map((ex, i) => (
          <button key={i} onClick={() => setActiveEx(ex)} style={{
            padding: "14px 15px", borderRadius: 12, textAlign: "left", cursor: "pointer",
            border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{ex.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#D8EED8", fontWeight: 500, marginBottom: 2 }}>{ex.title}</div>
              <span style={{ fontSize: 10, color: modeColor, fontWeight: 500, background: `${modeColor}18`, padding: "2px 8px", borderRadius: 10 }}>⏱ {ex.dur}</span>
            </div>
            <span style={{ color: "rgba(180,200,180,0.25)", fontSize: 14 }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  COMPOSANT : RitualZoneModal
//  Modal d'une zone (liste des rituels + exercices)
//  Props : zoneId | completed | onToggle(ritualId) | onClose
// ═══════════════════════════════════════════════════════════
export function RitualZoneModal({ zoneId, completed, onToggle, onClose }) {
  const zone = PLANT_ZONES[zoneId];
  const rituals = PLANT_RITUALS[zoneId] || [];
  const done = rituals.filter(r => completed[r.id]).length;
  const pct = done / rituals.length * 100;
  const [activeRitual, setActiveRitual] = useState(null);

  const handleComplete = (ritualId) => {
    track('ritual_complete', { ritual_id: ritualId }, 'jardin', 'engagement')
    onToggle(ritualId);
    setActiveRitual(null);
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(12px)" }}
      onClick={!activeRitual ? onClose : undefined}
    >
      <div
        style={{ width: "100%", maxWidth: 440, borderRadius: "22px 22px 0 0", padding: "28px 24px 48px", border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none", background: `linear-gradient(175deg, ${zone.bg} 0%, #080E0A 100%)`, maxHeight: "88vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 440, borderRadius: "22px 22px 0 0", padding: "28px 24px 48px", border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none", background: `linear-gradient(175deg, ${zone.bg} 0%, #080E0A 100%)`, maxHeight: "88vh", overflowY: "auto", animation: "slideUp 0.4s cubic-bezier(0.34,1.4,0.64,1)" }}
      >
        {activeRitual ? (
          <RitualExercises
            ritual={activeRitual}
            zone={zone}
            onComplete={() => handleComplete(activeRitual.id)}
            onBack={() => setActiveRitual(null)}
          />
        ) : (
          <>
            {/* Header zone */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: zone.color, fontWeight: 500, display: "block", marginBottom: 4 }}>{zone.subtitle}</span>
                <h2 style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", fontSize: 28, color: "#EEF0E8", fontWeight: 300, lineHeight: 1.05 }}>{zone.name}</h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 10, color: "rgba(180,200,180,0.3)", display: "block", marginBottom: 4 }}>{done}/{rituals.length} rituels</span>
                <span style={{ fontSize: 22, color: zone.accent, fontWeight: 300 }}>{Math.round(pct)}<span style={{ fontSize: 12, opacity: 0.6 }}>%</span></span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", marginBottom: 22, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${zone.color}, ${zone.accent})`, width: `${pct}%`, transition: "width 0.7s ease" }} />
            </div>

            {/* Liste des rituels */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {rituals.map(r => {
                const isDone = !!completed[r.id];
                return (
                  <button
                    key={r.id}
                    onClick={() => { if (!isDone) setActiveRitual(r); else onToggle(r.id); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "14px 15px", borderRadius: 12,
                      border: `1px solid ${isDone ? `${zone.color}45` : "rgba(255,255,255,0.06)"}`,
                      background: isDone ? `${zone.color}10` : "rgba(255,255,255,0.025)",
                      cursor: "pointer", textAlign: "left", transition: "all 0.22s",
                    }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: isDone ? "#D8EED8" : "rgba(180,200,180,0.58)", fontWeight: isDone ? 500 : 300, lineHeight: 1.3 }}>{r.text}</div>
                      {!isDone && <div style={{ fontSize: 10, color: "rgba(180,200,180,0.28)", marginTop: 2 }}>Toucher pour explorer →</div>}
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${isDone ? zone.color : "rgba(255,255,255,0.18)"}`, background: isDone ? `${zone.color}30` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}>
                      {isDone && <span style={{ fontSize: 9, color: zone.accent, fontWeight: 700 }}>✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  COMPOSANT : RitualsSection
//  Section "Rituels du jour" complète
//  À insérer dans ScreenMonJardin à la place de l'ancienne section
//
//  Props :
//    degradation       : { roots, stem, leaves, flowers, breath } | null
//    completedRituals  : { [ritualId]: boolean }
//    onToggleRitual    : (ritualId) => void
//    onQuizComplete    : (degradation) => void  (appelé après quiz)
// ═══════════════════════════════════════════════════════════
export function RitualsSection({ degradation, completedRituals, onToggleRitual, onQuizComplete }) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeZone, setActiveZone] = useState(null);

  // Si pas encore de dégradation, proposer le quiz
  const hasDegradation = degradation !== null && degradation !== undefined;

  // Trier les zones par dégradation décroissante (prioritaire en premier)
  const sortedZones = Object.keys(PLANT_ZONES).sort((a, b) => {
    if (!hasDegradation) return 0;
    return (degradation[b] ?? 50) - (degradation[a] ?? 50);
  });

  const handleQuizComplete = (deg) => {
    setShowQuiz(false);
    onQuizComplete(deg);
  };

  const handleQuizSkip = () => {
    setShowQuiz(false);
    // Dégradation par défaut à 50 pour toutes les zones
    onQuizComplete({ roots: 50, stem: 50, leaves: 50, flowers: 50, breath: 50 });
  };

  return (
    <>
      {/* ── Quiz modal si besoin ── */}
      {showQuiz && (
        <DailyQuizModal
          onComplete={handleQuizComplete}
          onSkip={handleQuizSkip}
        />
      )}

      {/* ── Modal zone active ── */}
      {activeZone && (
        <RitualZoneModal
          zoneId={activeZone}
          completed={completedRituals}
          onToggle={onToggleRitual}
          onClose={() => setActiveZone(null)}
        />
      )}

      {/* ── Section principale ── */}
      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* Titre section */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(180,200,180,0.3)", marginBottom: 3 }}>Rituels du jour</p>
            <p style={{ fontSize: 12, color: "rgba(180,200,180,0.45)", lineHeight: 1.4 }}>
              {hasDegradation ? "Zones triées par priorité" : "Prenez votre bilan intérieur"}
            </p>
          </div>
          {hasDegradation && (
            <button
              onClick={() => setShowQuiz(true)}
              style={{ fontSize: 10, color: "rgba(180,200,180,0.3)", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "5px 12px", cursor: "pointer", letterSpacing: "0.05em" }}
            >
              ↺ Refaire le bilan
            </button>
          )}
        </div>

        {/* Bouton quiz si pas encore fait */}
        {!hasDegradation && (
          <button
            onClick={() => setShowQuiz(true)}
            style={{
              width: "100%", padding: "18px 20px", borderRadius: 16, marginBottom: 16,
              border: "1px solid rgba(200,168,130,0.25)", background: "rgba(200,168,130,0.07)",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left",
            }}
          >
            <span style={{ fontSize: 28 }}>🌹</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#C8A882", fontWeight: 500, marginBottom: 3 }}>Prendre mon bilan du jour</div>
              <div style={{ fontSize: 11, color: "rgba(180,200,180,0.4)" }}>10 questions · 2 minutes · révèle vos zones prioritaires</div>
            </div>
            <span style={{ color: "rgba(200,168,130,0.4)", fontSize: 16 }}>→</span>
          </button>
        )}

        {/* Grille des zones */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
          {sortedZones.map((zoneId, index) => {
            const zone = PLANT_ZONES[zoneId];
            const rituals = PLANT_RITUALS[zoneId] || [];
            const doneCount = rituals.filter(r => completedRituals[r.id]).length;
            const deg = hasDegradation ? (degradation[zoneId] ?? 50) : 50;
            const health = Math.max(5, 100 - deg);
            const isPriority = hasDegradation && deg >= 65 && doneCount === 0;
            const isFirst = hasDegradation && index === 0 && deg >= 60;

            return (
              <button
                key={zoneId}
                onClick={() => setActiveZone(zoneId)}
                style={{
                  padding: "13px 14px", borderRadius: 13, textAlign: "left", cursor: "pointer",
                  border: `1px solid ${doneCount > 0 ? `${zone.color}35` : isPriority ? `${zone.color}40` : "rgba(255,255,255,0.06)"}`,
                  background: doneCount > 0 ? `${zone.color}08` : isPriority ? `${zone.color}06` : "rgba(255,255,255,0.025)",
                  transition: "all 0.25s ease",
                  gridColumn: isFirst ? "1 / -1" : "auto", // zone la plus urgente en pleine largeur
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: zone.color, fontWeight: 500, letterSpacing: "0.03em" }}>{zone.name}</span>
                  <span style={{ fontSize: 12, color: zone.accent, fontWeight: 500 }}>{health}%</span>
                </div>
                <div style={{ height: 2.5, borderRadius: 2, background: "rgba(255,255,255,0.06)", marginBottom: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${health}%`, background: `linear-gradient(90deg, ${zone.color}, ${zone.accent})`, borderRadius: 2, transition: "width 1.2s ease" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, color: "rgba(180,200,180,0.28)" }}>
                    {doneCount}/{rituals.length} rituel{doneCount !== 1 ? "s" : ""}
                    {isPriority && !isFirst ? " · prioritaire" : ""}
                  </span>
                  {isPriority && (
                    <span style={{ fontSize: 9, color: zone.color, background: `${zone.color}20`, padding: "2px 7px", borderRadius: 8, fontWeight: 500 }}>
                      {isFirst ? "🔴 Prioritaire" : "⚡"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
//  HOOK : useRitualsState
//  Gère le state rituals + persistence localStorage
//  À utiliser dans ScreenMonJardin
// ═══════════════════════════════════════════════════════════
export function useRitualsState() {
  const [degradation, setDegradation] = useState(null);
  const [completedRituals, setCompletedRituals] = useState({});
  const [showQuiz, setShowQuiz] = useState(false);

  const STORAGE_KEY = "mafleur-rituels-v1";
  const todayKey = new Date().toISOString().slice(0, 10);

  // Chargement au mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.date === todayKey) {
          if (data.degradation) setDegradation(data.degradation);
          if (data.completed) setCompletedRituals(data.completed);
          return; // données d'aujourd'hui trouvées, pas de quiz
        }
      }
      // Pas de données ou date différente → quiz à faire
      setShowQuiz(true);
    } catch (e) {
      setShowQuiz(true);
    }
  }, []);

  const handleQuizComplete = (deg) => {
    setDegradation(deg);
    setShowQuiz(false);
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, date: todayKey, degradation: deg }));
    } catch (e) {}
  };

  const handleToggleRitual = (ritualId) => {
    const updated = { ...completedRituals, [ritualId]: !completedRituals[ritualId] };
    setCompletedRituals(updated);
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, completed: updated }));
    } catch (e) {}
  };

  return {
    degradation,
    completedRituals,
    showQuiz,
    handleQuizComplete,
    handleToggleRitual,
  };
}

// ═══════════════════════════════════════════════════════════
//  EXEMPLE D'UTILISATION dans ScreenMonJardin
//  (copier dans votre composant existant)
// ═══════════════════════════════════════════════════════════
/*

function ScreenMonJardin() {
  const {
    degradation,
    completedRituals,
    showQuiz,
    handleQuizComplete,
    handleToggleRitual,
  } = useRitualsState();

  return (
    <div>
      // ... reste de votre ScreenMonJardin

      // Remplacez votre section "Rituels du jour" par :
      <RitualsSection
        degradation={degradation}
        completedRituals={completedRituals}
        onToggleRitual={handleToggleRitual}
        onQuizComplete={handleQuizComplete}
      />

      // Le quiz s'affiche automatiquement si showQuiz === true
      // (géré en interne par RitualsSection)
    </div>
  );
}

*/
