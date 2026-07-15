-- Remplacement des " — " (tiret cadratin espacé) par une ponctuation adaptée
-- selon le contexte de chaque phrase (deux-points, virgule, parenthèses).
-- 23 fiches concernées, 36 occurrences au total.

-- 4 · Manque de confiance en soi
UPDATE problematiques SET
  exercice_texte = $$Note 3 choses (même petites) que tu as accomplies cette semaine. Le cerveau retient plus facilement l'échec que la réussite : cet exercice rééquilibre la balance.$$,
  coaching_texte = $$La confiance en soi ne se décrète pas : elle se construit par l'accumulation de preuves concrètes que l'on est capable. Le manque de confiance vient souvent d'un biais de mémoire : le cerveau retient davantage les échecs (pour nous protéger d'un danger perçu) que les réussites. Ce déséquilibre crée un dialogue intérieur critique qui se nourrit lui-même. Inverser la tendance demande de créer volontairement des preuves inverses, d'où l'intérêt de noter concrètement ses réussites, même minimes, de façon répétée.$$
WHERE id = '5ae9381f-3f3f-4daf-bc1e-4c696aca6e91';

-- 5 · Colère & irritabilité
UPDATE problematiques SET
  description = $$La colère est souvent un signal, pas un problème en soi. Apprendre à la décharger sans qu'elle déborde permet d'en comprendre le message.$$,
  coaching_texte = $$La colère est une émotion de protection : elle signale qu'une limite a été franchie (besoin non respecté, injustice, épuisement). Le problème n'est pas la colère elle-même mais ce qu'on en fait quand elle n'a pas d'espace pour s'exprimer sainement : elle s'accumule et ressort de façon disproportionnée sur un petit déclencheur. Apprendre à la repérer tôt (tension dans la mâchoire, chaleur, envie de couper la parole) permet de la décharger avant le débordement, puis de se demander calmement quelle limite elle vient de signaler.$$
WHERE id = 'f8a74137-c967-48c5-a8f8-9b610d454b6d';

-- 7 · Submersion émotionnelle
UPDATE problematiques SET
  description = $$La submersion émotionnelle survient quand une émotion dépasse ce que le corps peut contenir sur l'instant : elle déborde avant même d'avoir été identifiée. Voici de quoi retrouver un point d'appui tout de suite, et mieux comprendre ce mécanisme.$$,
  coaching_texte = $$Une émotion submergeante n'est pas un dérèglement : c'est un signal envoyé trop fort, trop vite, parce qu'il n'a pas eu d'espace pour s'exprimer avant. Le cerveau émotionnel prend momentanément le pas sur le raisonnement, d'où cette impression de perdre le contrôle. Ce n'est jamais disproportionné par rapport à ce qui a été accumulé en amont, même si la cause immédiate semble minime. La sortie ne passe pas par "se retenir" mais par des micro-pauses régulières qui laissent l'émotion s'exprimer avant qu'elle ne déborde : c'est ce que travaille l'ancrage sensoriel ci-dessus.$$
WHERE id = '86938f59-a27e-4030-8f53-1b52281d9e6a';

-- 8 · Vide émotionnel
UPDATE problematiques SET
  coaching_texte = $$Ne plus rien ressentir n'est pas l'absence d'émotions : c'est une mise en pause protectrice, une forme d'anesthésie que le corps déclenche après une surcharge prolongée (stress accumulé, deuil, épuisement). Ça n'est ni un signe de froideur, ni un manque de sensibilité ; c'est l'inverse : le système a été tellement sollicité qu'il a coupé le son pour se préserver. Le retour se fait rarement d'un coup : il commence souvent par le corps (goût, toucher, mouvement) avant de rejoindre les émotions elles-mêmes. D'où l'exercice sensoriel ci-dessus, à répéter sans attendre un résultat immédiat.$$
WHERE id = '192bcb1c-7f63-4552-9883-e39dd1dddb59';

-- 9 · Vague à l'âme sans cause
UPDATE problematiques SET
  coaching_texte = $$Une tristesse diffuse est souvent la somme de plusieurs petites choses non digérées, plutôt que la conséquence d'un seul événement identifiable, ce qui la rend difficile à "expliquer", mais pas moins réelle. Chercher absolument sa cause peut même l'entretenir, en ajoutant de la frustration à la tristesse initiale. Les émotions n'ont pas toujours besoin d'être comprises pour être traversées : elles ont surtout besoin d'espace et de présence. Accueillir la tristesse sans exiger d'elle une explication est souvent ce qui permet qu'elle circule, plutôt que de s'installer.$$
WHERE id = 'ad5319e0-0900-4b14-94f0-34e730762bc7';

-- 10 · Culpabilité permanente
UPDATE problematiques SET
  coaching_texte = $$Une culpabilité qui apparaît sans faute réelle vient rarement d'une erreur commise : elle vient d'un standard intérieur trop exigeant, souvent hérité (éducation, comparaison, besoin d'être irréprochable pour se sentir légitime). Le cerveau confond alors "je n'ai pas été parfait·e" avec "j'ai mal fait", ce qui entretient un sentiment de faute permanent, disproportionné par rapport aux actes réels. Se traiter avec la même bienveillance qu'on offrirait à un proche, comme dans l'exercice ci-dessus, est l'un des leviers les plus efficaces pour desserrer cette exigence excessive envers soi-même.$$
WHERE id = '10c3e037-613a-4119-8477-ea36e3480631';

-- 11 · Montagnes russes émotionnelles
UPDATE problematiques SET
  description = $$Quand l'humeur bascule sans prévenir, le corps est souvent en état de réactivité accrue : chaque stimulus prend plus de place qu'il ne devrait. Voici de quoi te stabiliser tout de suite, et mieux comprendre ce qui alimente ces variations.$$,
  coaching_texte = $$Une réactivité émotionnelle élevée n'est pas un manque de maîtrise : c'est souvent le signe d'un système nerveux déjà sollicité (fatigue, stress accumulé, manque de récupération), qui réagit alors avec plus d'intensité au moindre stimulus. Chaque variation d'humeur n'est pas le problème en soi : c'est l'absence de sas entre le ressenti et la réaction qui épuise. Introduire une pause, même très courte, avant de répondre à l'émotion redonne au système nerveux le temps de retrouver son équilibre, plutôt que d'enchaîner les pics sans répit.$$
WHERE id = '823881b0-7562-4ae2-9bcf-8d4179df4f59';

-- 12 · Émotions refoulées
UPDATE problematiques SET
  coaching_texte = $$Refouler une émotion ne la fait pas disparaître : elle reste stockée dans le corps (tensions, fatigue, troubles digestifs) en attendant un espace pour s'exprimer. Ce mécanisme se met souvent en place tôt, quand exprimer ses émotions n'était pas sûr ou pas accueilli : on apprend alors à les taire pour se protéger. Le problème n'est pas l'émotion elle-même, mais l'absence d'exutoire : à force d'être mise de côté, elle devient plus difficile à identifier, jusqu'à ne plus savoir ce qu'on ressent vraiment. Se donner un espace sans jugement pour la laisser sortir (même sur le papier) est souvent le premier pas pour la retrouver.$$
WHERE id = '60ca46ce-aedd-45fc-8808-378e22d5a401';

-- 13 · Ruminations nocturnes
UPDATE problematiques SET
  coaching_texte = $$Le soir est souvent le premier moment de la journée sans sollicitation extérieure : le cerveau, enfin disponible, se met alors à traiter ce qui a été mis de côté pendant la journée. Ce n'est donc pas un hasard si les pensées s'intensifient précisément au coucher : ce n'est pas le bon moment qui pose problème, c'est l'absence de moment de "digestion mentale" plus tôt dans la journée. Externaliser ces pensées par écrit, avant de dormir, permet au cerveau de les considérer comme traitées plutôt que comme en attente, ce qui réduit la tentation d'y revenir sous la couette.$$
WHERE id = '514e4594-eef2-4afa-93e4-aadb776dd834';

-- 14 · Réveils précoces
UPDATE problematiques SET
  exercice_texte = $$Allongé·e, les yeux fermés, allonge ton expiration : inspire sur 4 temps, expire sur 8. Répète pendant quelques minutes, sans objectif de te rendormir, juste de rester au calme.$$,
  coaching_texte = $$En fin de nuit, le sommeil devient naturellement plus léger : c'est la phase où l'on est le plus sensible aux stimulis (lumière, bruit, stress) et donc le plus susceptible de se réveiller. Vouloir absolument se rendormir crée souvent une tension qui, elle-même, empêche le sommeil de revenir : c'est le piège de "l'effort de dormir". Rester allongé·e dans le calme, sans objectif de performance, sans regarder l'heure, laisse au corps la possibilité de replonger sans la pression qui l'en empêche.$$
WHERE id = 'b739e409-2f2e-4647-8ea4-6398db1b2ed5';

-- 15 · Anxiété du coucher
UPDATE problematiques SET
  coaching_texte = $$Le sommeil est un processus qui ne répond pas à la volonté : plus on essaie de le forcer, plus le corps reste en état de vigilance, incompatible avec l'endormissement. L'anxiété du coucher s'auto-entretient ainsi : une mauvaise nuit nourrit la peur de la suivante, qui elle-même retarde l'endormissement, confirmant la peur initiale. Sortir de ce cercle demande de retirer l'enjeu : remplacer "il faut que je dorme" par "je me repose, quoi qu'il arrive" désactive la pression qui entretient l'éveil.$$
WHERE id = '9fe1da1b-5445-4254-80e6-0525b50672db';

-- 16 · Rythme décalé
UPDATE problematiques SET
  coaching_texte = $$L'horloge biologique se régule surtout par l'heure du réveil et l'exposition à la lumière du matin, bien plus que par l'heure du coucher, c'est pourquoi des horaires de lever irréguliers dérèglent le rythme même quand la durée de sommeil est correcte. Ce décalage crée un état proche du jet-lag : le corps ne sait plus à quel moment anticiper le sommeil ni l'éveil, ce qui entretient la fatigue. Fixer une heure de lever stable, jour après jour, est le levier le plus efficace pour resynchroniser l'horloge interne, plus efficace que d'essayer de forcer une heure de coucher fixe.$$
WHERE id = '77a751c5-414e-48e7-8e40-964ac823ad02';

-- 17 · Réveil difficile
UPDATE problematiques SET
  coaching_texte = $$Ce brouillard au réveil porte un nom : l'inertie du sommeil. Il survient surtout quand l'alarme interrompt une phase de sommeil profond plutôt qu'une phase légère : le cerveau n'a alors pas eu le temps de repasser en mode éveil avant d'être sollicité. Le bouton snooze aggrave souvent le problème : il replonge brièvement dans un nouveau cycle qui sera, lui aussi, interrompu en phase profonde. Se lever dès la première alarme, même fatigué·e, et laisser un sas de quelques respirations avant de bouger, limite cette confusion et réduit la durée du brouillard.$$
WHERE id = 'f05400d4-25da-4ca7-8ca1-d3e9dfffba59';

-- 18 · Difficulté à poser ses limites
UPDATE problematiques SET
  coaching_texte = $$Dire non est souvent vécu, inconsciemment, comme un risque de perdre l'affection ou l'approbation de l'autre, un réflexe qui se construit tôt, quand poser une limite n'était pas bien accueilli. Le corps associe alors le refus à un danger relationnel, et déclenche une réponse de soumission automatique, avant même que la réflexion n'intervienne. Ce n'est pas un manque de caractère : c'est un automatisme appris, qui peut être désappris. Introduire un délai avant de répondre, comme dans l'exercice ci-dessus, casse ce réflexe immédiat et redonne de l'espace pour choisir plutôt que réagir.$$
WHERE id = 'b83bccb9-527d-4921-bd29-f4fd37c7cc1c';

-- 19 · Conflits répétés
UPDATE problematiques SET
  coaching_texte = $$Un conflit qui revient à l'identique n'a généralement pas été résolu la première fois, souvent parce qu'il portait sur un besoin non formulé, masqué derrière un reproche ou une accusation. Le reproche déclenche la défense de l'autre, ce qui empêche justement d'entendre le besoin réel, et la dispute se rejoue alors sans jamais avancer. Formuler le besoin plutôt que le grief change la nature de l'échange : il devient plus difficile de se défendre contre un besoin que contre une accusation, ce qui ouvre la porte à une vraie résolution plutôt qu'à une répétition.$$
WHERE id = '94cbb149-2128-4a21-a373-dcf3d9cea2f1';

-- 21 · Tensions familiales
UPDATE problematiques SET
  coaching_texte = $$Les relations familiales activent souvent des rôles et des réflexes installés dans l'enfance, bien avant qu'on ait pu les choisir, ce qui explique pourquoi on peut se sentir redevenir "petit·e" face à certains proches, même adulte et autonome par ailleurs. Ce n'est pas un manque de maturité : c'est la mémoire relationnelle du corps qui rejoue un schéma ancien, plus vite que la pensée consciente. Se rappeler concrètement son âge et sa situation actuelle, comme dans l'exercice ci-dessus, aide à sortir de l'ancien rôle et à répondre depuis la personne qu'on est devenue, plutôt que depuis celle qu'on était.$$
WHERE id = '9d308471-7732-42c3-be31-0ec1b5a33673';

-- 22 · Difficulté à faire confiance
UPDATE problematiques SET
  coaching_texte = $$La méfiance n'est pas un trait de caractère fixe : c'est une stratégie de protection, mise en place après une expérience où la confiance a été trahie ou déçue. Le corps généralise alors cette prudence à toutes les relations, même celles qui ne présentent pas le même risque, par sécurité. Ce mécanisme est utile à court terme, mais coûteux à long terme : il empêche aussi les relations sûres de se construire pleinement. Reconstruire la confiance ne se fait pas d'un bloc, mais par petites preuves accumulées, d'où l'intérêt de risques mesurés et progressifs, comme dans l'exercice ci-dessus, plutôt qu'un "tout ou rien".$$
WHERE id = 'f1d941a5-b57e-4d80-aeb1-99fa30892391';

-- 26 · Comparaison aux autres
UPDATE problematiques SET
  coaching_texte = $$La comparaison est structurellement biaisée : elle met en regard tout ce qu'on sait de soi (doutes, efforts, coulisses) avec ce que l'autre montre volontairement (résultats, réussites, façade), un déséquilibre qui joue systématiquement en défaveur de qui compare. Ce mécanisme s'intensifie avec l'exposition aux réseaux sociaux, où la façade est la norme plutôt que l'exception. Se comparer n'est donc jamais un jugement objectif de sa propre valeur, mais la mise en scène de deux réalités différentes. Revenir à son propre chemin, comme dans l'exercice ci-dessus, réancre l'attention sur des faits concrets plutôt que sur une image partielle d'autrui.$$
WHERE id = 'e567e638-432c-47ac-bc13-55977a5eae3d';

-- 27 · Perfectionnisme paralysant
UPDATE problematiques SET
  coaching_texte = $$Le perfectionnisme paralysant ne vient pas d'un manque de confiance en sa capacité à réussir, mais d'une équation intérieure où seul le résultat parfait est acceptable, tout le reste étant vécu comme un échec, quel que soit le niveau réel de qualité atteint. Cette exigence rend le début même de l'action risqué, puisque toute tentative imparfaite est perçue comme une preuve d'échec anticipée. Autoriser explicitement une version imparfaite, comme dans l'exercice ci-dessus, dissocie le fait de commencer du fait d'être jugé·e, et permet à l'action de redevenir possible avant que la perfection ne soit exigée.$$
WHERE id = 'd15f2a11-f3e0-44a1-ab02-e1f29c659526';

-- 29 · Stress anticipatoire
UPDATE problematiques SET
  description = $$Le stress anticipatoire réagit à une menace imaginée, pas encore réelle, mais le corps, lui, y répond déjà pleinement. Voici de quoi désamorcer cette tension tout de suite, et mieux comprendre pourquoi l'attente est parfois pire que l'événement.$$
WHERE id = 'bacaf262-0336-462b-8103-9b74b1386c22';

-- 30 · Stress professionnel
UPDATE problematiques SET
  coaching_texte = $$Sans rituel de transition clair, le cerveau ne reçoit jamais le signal que la journée de travail est terminée : il reste alors en alerte, prêt à reprendre, même en soirée. Ce débordement n'est pas qu'une question de charge de travail réelle : c'est souvent l'absence de frontière nette entre les rôles (professionnel / personnel) qui empêche le système nerveux de basculer en mode récupération. Créer un geste de clôture explicite, comme dans l'exercice ci-dessus, donne au corps un signal clair de transition, là où l'esprit seul n'y arrive pas toujours.$$
WHERE id = 'ccd98758-dff6-4df0-95f5-58ec34736350';

-- 31 · Stress de dernière minute
UPDATE problematiques SET
  coaching_texte = $$Repousser une tâche jusqu'à l'urgence n'est pas un problème de gestion du temps, mais souvent une stratégie inconsciente pour éviter l'inconfort du démarrage : l'urgence finit par fournir l'élan que la motivation seule ne donnait pas. Le problème, c'est que ce mode de fonctionnement entretient un stress répété et évitable, et renforce l'idée qu'on "a besoin" de la pression pour agir, ce qui n'est vrai qu'en apparence. Réduire le seuil de démarrage à un engagement minime, comme dans l'exercice ci-dessus, permet de commencer sans attendre l'urgence pour trouver l'élan.$$
WHERE id = '41ad834c-bb05-40ae-bb20-740f9cef3151';

-- 32 · Stress face à l'imprévu
UPDATE problematiques SET
  coaching_texte = $$Un imprévu déstabilise d'autant plus que le fonctionnement quotidien s'appuie sur beaucoup de contrôle et d'anticipation : plus l'organisation est serrée, plus l'écart avec ce qui était prévu se ressent comme une perte de repères. Ce n'est pas un manque d'adaptabilité personnelle : c'est le contraste entre un système très planifié et un événement qui, par définition, ne pouvait pas l'être. Marquer un point d'arrêt avant de réagir, comme dans l'exercice ci-dessus, empêche la sidération de prendre toute la place et permet de retrouver, étape par étape, un sentiment de prise sur la situation.$$
WHERE id = '0dc87660-8230-47fd-8f01-fa3a2e09e934';
