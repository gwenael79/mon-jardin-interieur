# Mon Jardin Intérieur — contexte projet

> Fichier de passation. Résume les décisions prises lors d'une session de réflexion stratégique.
> À placer à la racine du dépôt : Claude Code le lit automatiquement à chaque session.

## Le projet

Application de bien-être **front-end uniquement** (HTML / JavaScript, pas de backend).
Une **fleur** est le reflet de l'état émotionnel de la personne : elle grandit quand on prend soin de soi (rituels), se fane sans entretien.

- **Univers visuel** : Cormorant Garamond (serif léger, italique), fond crème (`#fffcf8`), verts (`#5e8456` / `#6f9560`), terracotta d'accent (`#c07840`). Doux, lent, contemplatif. La légèreté est une valeur centrale : pas de stats, pas de barres, pas de gamification visible.
- **Deux chemins de progression** :
  - **Agir** — la personne fait des rituels librement ; au bout de **10 rituels**, elle passe sur l'app complète. Chemin libre, sans calendrier.
  - **Parcours d'initiation** — **7 jours, un rituel par jour**. Chemin structuré.
- **Modèle premium** : abonnement ~13 €/mois (« Club des Jardiniers »).

## Diagnostic (le problème central)

Base de ~70 inscrits (réseau perso, salon, Facebook, clientèle du cabinet d'hypnose), ~60 % inactifs, **0 achat**, **~50 % de départ dès le 1er jour**.

La chaîne de causes, du symptôme à la racine :

1. Ce n'est pas un problème d'acquisition (ne pas chercher plus de prospects tant que ça fuit).
2. Les gens « n'y pensent plus » → problème de déclencheur. Les e-mails de rappel (20 % d'ouverture) ne déclenchent pas un geste quotidien : mauvais canal.
3. Plus profond : **l'app ne produit pas d'effet ressenti**. Valeur reproductible seule et gratuitement → « pourquoi payer / pourquoi revenir ».
4. Cause du départ jour 1 + du non-paiement = la même : **les rituels sont plats**. Ils sont livrés en **texte + petite animation de respiration** → on lit, on regarde, rien ne se passe dans le corps.

## Décisions / direction produit

### 1. Profondeur avant personnalisation
Le frein n'est pas la simplicité de l'acte ni le manque de personnalisation — c'est le **manque d'immersion**. Un texte plat personnalisé reste plat.
- **Lever n°1 (profondeur)** : transformer le rituel en **expérience guidée par la voix** (idéalement la voix de la créatrice, hypnothérapeute), avec rythme, son, silence. C'est ce qui tue la platitude. **N'alourdit pas l'interface** (un bouton, une voix).
- **Lever n°2 (personnalisation)** : vient ensuite. Sert à proposer **le bon** rituel guidé selon le bilan du matin / les zones — pas à créer la profondeur. Utilise les données déjà présentes (bilan matin → stress par zone).

### 2. Présentation d'un rituel — arc en 5 temps
Le téléphone guide puis **s'efface**. Mots entendus, pas lus. Le jardin est témoin.
1. **Le seuil** — écran calme, une ligne, un son qui démarre, un geste pour entrer.
2. **La descente** — la voix ralentit le corps ; l'animation de respiration devient le rythme porteur (pas un objet à regarder).
3. **Le geste** — cœur du rituel, porté par la voix ; **l'écran s'assombrit**, invite à fermer les yeux.
4. **L'intégration** — un silence, puis « remarquez comment vous vous sentez maintenant » (nommer le petit changement le rend réel).
5. **La réponse du jardin** — la plante répond visiblement (feuille, lueur) : geste → effet → trace visible.

### 3. Progression visible dès le jour 1 (parcours)
**Problème actuel** : la fleur n'apparaît qu'au 6e jour (« quelque chose se prépare » avant). Or la moitié des gens partent avant. Le mécanisme censé donner envie de revenir est placé après le gouffre.
**Décision** : rendre le processus **visible dès la 1re minute** (graine → pousse → feuille → bouton → floraison). Pas de whaou, mais un micro-progrès visible chaque jour. La floraison reste un cap, pas la première apparition.
*Principe* : montrer ce qui se passe déjà sous le capot ≠ ajouter une fonctionnalité. C'est plus léger, pas plus lourd, que le panneau « patientez ».

### 4. Rythme du parcours 7 jours
Garder **un rituel par jour** — ne PAS ajouter de « tout enchaîner ». L'espacement EST la pratique ; enchaîner optimise la complétion au prix de l'habitude (le retour quotidien est le comportement qu'on veut installer).
- Formuler la limite comme un **soin**, pas comme une serrure : « votre jardin vous attendra demain ».
- Le chemin **Agir** (10 rituels), lui, reste **libre et auto-rythmé** (pas de gate ; « je m'arrête / je continue » y a toute sa place).
- Distinction de fond : Agir = liberté/exploration ; Parcours = installation d'une habitude. Les deux chemins n'ont pas la même règle parce qu'ils n'ont pas le même rôle.

## Maquettes produites (hors dépôt, dans les téléchargements)

Démos autonomes, à intégrer / adapter — formes volontairement simples pour juger le principe :

- `jardin-progression.html` — progression graine→floraison sur 6 jours + bascule « ancienne vs nouvelle approche » pour comparer.
- `jardin-progression-v2.html` — idem, mais avec choix d'un chemin qui colore la fleur, les mots et la palette (à recaler sur les vrais chemins Agir / Parcours).
- `jardin-rituel.html` — un rituel guidé complet (arc en 5 temps). Voix via Web Speech API (placeholder — imaginer la vraie voix), ambiance via Web Audio, bulle de respiration, écran qui s'assombrit, plante qui répond. Bouton pour couper la voix de démo.

Techniques réutilisables : SVG plante animée (CSS transforms + `transform-box: fill-box`), thématisation par variables CSS (`--accent`, `--petalBot`, etc.), `SpeechSynthesisUtterance` (fr-FR, rate ~0.84), oscillateurs Web Audio pour un pad d'ambiance.

## Questions ouvertes / à décider

- La fleur finale doit-elle vraiment différer par chemin, ou rester la fleur signature avec juste une teinte ?
- Intitulés et nombre exacts de « chemins » (les thèmes des maquettes v2 ne sont qu'une hypothèse).
- Curseur philosophique sur le parcours : rythme doux mais ferme (« à demain », point) vs confiance + nudge avec porte discrète.
- Production de la voix : qui enregistre, dans quelles conditions (c'est là qu'est toute la valeur).

## Note de fond

La priorité n'est ni l'acquisition, ni le prix, ni les e-mails : c'est que **les premiers jours sont vides**. Rendre les rituels vivants (voix) + la progression visible dès le jour 1 dénoue en même temps la platitude, le départ au 1er jour et le « pourquoi payer ».
