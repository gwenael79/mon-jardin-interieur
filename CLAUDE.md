# Mon Jardin Intérieur — contexte projet

> Fichier de passation. À placer à la racine du dépôt : Claude Code le lit
> automatiquement à chaque session. Éditable librement.
> Dernière mise à jour : refonte du Jour 1 du parcours d'initiation.

## Le projet

Application de bien-être **front-end uniquement** (React, HTML/JS, pas de backend serveur ; Supabase pour l'auth/données).
Une **fleur** reflète l'état émotionnel : elle grandit quand on prend soin de soi (rituels), se fane sans entretien.

- **Univers visuel — IMPORTANT :** lumineux, plein jour, **chaud**. Crème `#faf5f2`, rose poudré `#c8a0b0` (couleur du Jour 1), lumière dorée, prairie ensoleillée, cadre mauve. Police : Cormorant Garamond (titres + italique) et Jost (petits libellés UI). Un petit lutin/compagnon fait partie de l'univers.
  - ⚠️ **Ne jamais partir sur du sombre / nocturne.** Une première tentative de rituel en fond vert-nuit a été rejetée : « ça ne ressemble pas à mon univers ». Le monde est diurne et doux.
- **Deux chemins :** *Agir* (rituels libres, ~10 rituels → bascule sur l'app) et *Parcours d'initiation* (7 jours, un rituel/jour, thèmes anatomiques : racines → tige → feuilles → fleurs → souffle → rencontre avec ma fleur → jardin ensemble).
- **Premium :** abonnement ~7,99 €/mois (ou 59 €/an).

## Diagnostic (rappel)

~70 inscrits, ~60 % inactifs, **0 achat**, **~50 % de départ au jour 1**. Cause racine : **les rituels sont plats** — livrés en texte + petite animation, on lit/regarde, rien n'est vécu dans le corps. Le problème n'est ni l'acquisition, ni le prix, ni les e-mails (20 % d'ouverture). Ce sont **les premiers jours vides** qui font fuir.

## Décisions produit (stables)

1. **Profondeur avant personnalisation.** Le frein n'est pas la simplicité de l'acte ni le manque de perso — c'est le manque d'immersion. Lever n°1 : transformer le rituel en **audio guidé par la voix de la créatrice** (hypnothérapeute). Non-DIY-able, donc payable, et ça n'alourdit pas l'UI.
2. **Progression visible dès le jour 1.** Ne plus cacher la fleur jusqu'au J6. Montrer la graine/les racines qui poussent dès la première séance. La floraison reste un cap, pas la première apparition.
3. **Rythme du parcours :** un rituel par jour, pas de « tout enchaîner ». On peut aller **plus loin** (rester dans le thème du jour) mais pas **plus vite** (sauter au lendemain). Limite formulée comme un soin (« à demain »), jamais comme une serrure.

## Identité de marque vs personnalisation interne (2 décisions distinctes, chantiers séparés)

Constat de départ : « le bien-être doit être sérieux, car mon mal-être est sérieux ». Le logo actuel (`/icons/icon-192.png` et `/icons/icon-512.png` — personnage 3D type lutin/jeu pour enfants) est utilisé comme **icône PWA, favicon, badge de notification et logo dans ~17 fichiers** (toutes les pages, y compris admin). C'est le premier signal vu, avant tout texte — et il contredit le positionnement adulte/bien-être ("stress d'usure", "comment va votre jardin intérieur ?").

1. **Décision marque (prioritaire, non encore actée) — remplacer le logo/icône.** Le lutin reste un bon **compagnon interne** (cf. `LutinCompagnon.jsx`, déjà cantonné à l'onboarding J1-J7), mais ne doit plus être la *vitrine* de la marque. Cherche un symbole chaleureux mais adulte (ex. la fleur lumineuse de `fond1.png`, ou un motif floral abstrait) pour icône PWA / favicon / logo d'app. Chantier à fort impact (touche le premier contact mobile) mais surface de code large.
2. **Décision personnalisation interne (secondaire, complémentaire) — toggle d'ambiance post-inscription.** Après le choix de l'identité florale (StepGraine), proposer un choix « zen / florale » vs « ludique / féérique ». Implémentation légère envisagée : binaire d'affichage du lutin compagnon (zen = masqué, féérique = visible), pas deux univers graphiques à maintenir. Nécessite un réglage persistant par utilisateur (n'existe pas encore — `useTheme`/`app_settings` est un thème global admin, pas par compte).

⚠️ Les deux ne sont **pas substituables** : le toggle personnalise l'expérience *après* inscription, mais ne corrige pas le signal envoyé par l'icône/logo *avant* inscription (écran d'accueil téléphone, favicon). Traiter la décision 1 même si la décision 2 est mise en œuvre.

## Jour 1 « Racines » — structure VERROUILLÉE (chantier en cours)

Flux retenu (remplace les ~8 écrans de lecture actuels) :

**accueil court → rituel guidé (audio) → la graine/les racines qui poussent à vue d'œil → « ton espace du jour » (hub, optionnel) → terminer pour aujourd'hui**

Détails :
- **Accueil :** garder le texte existant (« Tu n'es pas ici par hasard… ») mais court. Une seule marche.
- **Ressenti :** garder *une* question de ressenti (slider/boutons), avant l'audio.
- **Rituel = audio.** L'expérience par défaut. Le téléphone guide puis s'efface. Le « retrait » de l'écran se fait dans une **lumière chaude** (doré-rosé, yeux fermés face au soleil), PAS dans le noir. Pas de barre de progression, pas d'avance rapide. Toucher l'écran = pause. Lancement par un geste (obligatoire navigateur : pas d'autoplay) avec un fondu d'entrée de ~2,4 s avant la voix.
- **Fin du rituel :** la graine se plante et **les racines descendent à vue d'œil** (thème ancrage = vers le bas). Texte de clôture chaleureux : « Tu as pris soin de toi. Tes racines, elles, le savent. » — PAS « ton équilibre ne peut pas encore apparaître » (ancien écran, à supprimer).
- **Hub « Explore ton espace du jour » :** placé **APRÈS** le rituel, pas avant. Raison : le hub à 6 entrées (Pourquoi les racines / Mes racines · mon ancrage / Mon rituel · ma fleur / Mon mantra / Mon mandala / MP3 d'ancrage) est parfait pour quelqu'un d'engagé, mais écrase un inconnu au jour 1 (vertige du choix). Après le rituel, la personne est touchée et curieuse : c'est là que l'exploration optionnelle prend sa force. Le jour 1 doit *porter*, pas tendre un buffet.
- **Bonus :** ce même hub pourra devenir le **premier** écran aux jours 3-7, quand la personne connaît déjà l'univers.

Principe directeur : **le jour 1 a un autre métier que les autres jours** — activation. Son seul but : qu'un inconnu ressente *une* chose vraie et ait envie de revenir. Donc le porter sur des rails jusqu'au moment ressenti, friction minimale.

## Code — points d'ancrage (fichier `WeekOneFlow.jsx`)

- `WEEK_ONE_DATA` (~l.264) : config par jour (Jour 1 ~l.266). Le rituel a déjà `isGuided: true`, `zone: 'Racines'`.
- `DayShell` (~l.5566) : orchestrateur des étapes (step 0→4 : accueil / introspection / rituel / validation / ouverture). C'est ici que se fera l'allègement du flux et l'ajout du hub après rituel.
- `DayRituel` (~l.4855) : gère phases `view`/`audio`/`guided`. Convention audio déjà en place.
- `DayAudioPlayer` (~l.4780) : **le lecteur à refondre** dans l'univers chaud (cf. ci-dessus). Une refonte existe en brouillon hors dépôt (`DayAudioPlayer.refonte.jsx`) — à reprendre en l'adaptant à la lumière diurne, pas la version sombre.
- **Audio attendu :** `/public/audio/racines.mp3`. Tant qu'absent, prévoir un mode « script minuté » (sous-titres rythmés) pour tester le flux.
- Script du rituel Racines : écrit, dans `jour1-racines-script-audio.md` (hors dépôt).

## Prochains chantiers (ordre)

1. **Enregistrer le MP3 « racines »** avec la vraie voix (= la vraie valeur du produit).
2. Refondre `DayAudioPlayer` en lumière chaude (seuil → écoute → racines qui poussent).
3. Alléger `DayShell` pour le jour 1 (accueil court, 1 question, audio, fleur) et placer le hub APRÈS.
4. Plus tard : décliner sur les jours 2-7 ; envisager le hub en écran d'entrée pour J3-J7.

## Questions encore ouvertes

- La fleur finale diffère-t-elle par chemin/jour, ou reste-t-elle la fleur signature avec une teinte ?
- Clôture du jour 1 : finir sur l'image qui pousse seule, ou ajouter un « à demain » textuel ?
- Devenir des données du hub (mantra, mandala, checklist) : exploitées plus tard, ou simples moments de présence ?
