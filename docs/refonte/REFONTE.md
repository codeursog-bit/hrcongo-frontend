# REFONTE VISUELLE KONZA RH — BRIEF MAÎTRE

> Ce fichier est la source de vérité de la refonte. Lis-le EN ENTIER au début de chaque session, puis lis `PROGRESS.md` pour savoir où on en est, puis continue à la première page non terminée. Ne demande pas de relire le brief à l'utilisateur : tout est ici.

---

## 1. Mission

Konza RH est un SaaS RH / paie pour le Congo-Brazzaville (Next.js côté front, NestJS/Prisma/PostgreSQL côté back).
Des clients trouvent que le rendu « se voit fait par une IA ». On refait **toute l'interface, de A à Z, page par page**, avec une identité visuelle unique, soignée, chaleureuse, qui donne un effet « waouh » sans jamais sentir le template IA.

**Seul le visuel change** : couleurs, mise en page, composants, animations, icônes, états (vide, chargement, succès, erreur), dark mode.

---

## 2. Règles absolues (jamais enfreintes)

1. **Ne modifie AUCUN appel API, hook de données, permission, validation, calcul ni route.** Mêmes endpoints, mêmes champs, mêmes noms de données. Là où la page affiche « nombre d'employés », elle continue d'afficher exactement la donnée que le back envoie. On peut AJOUTER des éléments d'interface, jamais changer le contrat existant.
2. **Aucun recalcul côté front.** Toutes les valeurs de calcul (paie, cotisations, totaux) viennent du back, comme aujourd'hui.
3. **Lis le code existant avant de toucher une page.** Ne suppose jamais la structure. Si un fichier n'est pas fourni ou introuvable, dis-le au lieu d'inventer.
4. **Fichiers complets, prêts à copier-coller** (pas de diffs partiels), sauf `prisma/schema.prisma` : pour ce fichier, donne seulement ce qu'il faut ajouter/modifier.
5. **Une page à la fois.** À la fin de chaque page : compte rendu (format §12), mise à jour de `PROGRESS.md`, puis ATTENDS le feu vert avant la suivante.
6. **Ne code pas d'abord quand un point est flou** : propose, aligne, puis implémente.
7. **Documents imprimables et exports officiels : on n'y touche pas.** Bulletins de paie, factures de paie, documents de congé/absence, DGC, formulaires et exports CNSS / DAS / Excel officiels gardent leur rendu actuel (fond blanc fixe, fidélité au modèle). La refonte concerne l'application, pas ces documents.
8. **Garde-fous techniques** : pas de régression de performance (pas de lib lourde ajoutée sans raison), pas de `.toLowerCase()` ni d'accès sans garde sur des champs qui peuvent être vides (toujours `|| ''`), accessibilité respectée (contrastes, focus visibles, navigation clavier, `prefers-reduced-motion`).

---

## 3. Références visuelles (dossier `docs/refonte/refs/`)

| Fichier | À utiliser pour | À NE PAS reprendre |
|---|---|---|
| `ref-kit-fond-et-graphiques.webp` | **LA référence** : le gris-blanc des ÉCRANS de téléphone (fond), cartes sans bordure, ombres douces, style des courbes / donut / barres, densité, palette orange-vert-moutarde | Le beige-pêche de l'affiche autour des téléphones (décor), les textes lorem, le contenu |
| `ref-bizneo-contenu-seulement.webp` | **Idées de contenu** pour « Ma journée » (chrono, tâches, calendrier, anniversaires, horaires) | **Leur design** (bleu, ombres, typographie) : un seul style dans l'app, le nôtre |
| `ref-maquette-gpt-disposition-seulement.png` | Idée d'organisation des blocs du dashboard Pilotage RH | Le fond, les bordures et les courbes sont FAUX (trop plats, trop « SaaS générique »). Le kit prime toujours |

Quand deux références se contredisent, **le kit gagne**.

---

## 4. Identité visuelle

### 4.1 Le ressenti à obtenir
Doux, aéré, chaleureux, premium. **Le fond de l'app est le gris-blanc des ÉCRANS DE TÉLÉPHONE du kit** (neutre, très clair), PAS le beige-pêche de l'affiche autour des téléphones (celui-ci n'est qu'un décor de présentation : ne jamais l'utiliser comme fond d'écran). Les cartes semblent poser sur ce fond comme des galets légèrement relevés. L'orange ponctue les actions et les points clés, il ne sature pas l'écran. Peu de couleurs vives en même temps.

### 4.2 Tokens (point de départ, à ajuster à l'œil face au kit)

**Garde les NOMS de tokens déjà présents dans `app/globals.css`** (`--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--brand`, `--brand-soft`, `--accent-2`) et change leurs VALEURS : une grande partie de l'app se recolore ainsi automatiquement, puis on affine page par page. Vérifie d'abord ce qui existe réellement ; ajoute les tokens manquants ci-dessous. Remplace ensuite progressivement les couleurs en dur (`gray-*`, `slate-*`, etc.) par les tokens.

Clair :
```
--bg:            #F3F4F4   /* gris-blanc des écrans de téléphone du kit (mesuré ~#F1F1F1 à #F8F9F9) */
--surface:       #FAFAFA   /* cartes : à peine plus claires que le fond */
--surface-2:     #ECEEEE   /* zones en creux, pistes de graphiques, champs */
--border:        rgba(20,20,20,0.06)    /* quasi invisible, à utiliser rarement */
--text:          #26282A
--text-muted:    #8A8F94
--brand:         #F7874B   /* beau orange léger, pas fluo */
--brand-strong:  #E96F32   /* survol / actif */
--brand-soft:    #FDE6D8   /* le pêche vit ici : halos, pastilles actives, survols — jamais en fond de page */
--lime:          #A8D83F   /* vert citron : second pilier de la marque */
--green:         #2FBF8F   /* vert/teal des graphiques et statuts positifs */
--mustard:       #E8B23A   /* 3e couleur de graphique, avertissements doux */
--danger:        #E5484D   /* rouge : erreurs, danger, passages seulement */
--shadow-card:   0 10px 30px rgba(30,30,30,0.07), 0 2px 6px rgba(30,30,30,0.04)   /* ombres NEUTRES, pas teintées */
--shadow-pop:    0 18px 48px rgba(30,30,30,0.14)
--radius-card:   20px
--radius-control:14px
```
Sombre (même noms, gris anthracite neutre — PAS de noir-bleu froid) :
```
--bg: #171717   --surface: #212121   --surface-2: #2A2A2A
--border: rgba(255,255,255,0.07)
--text: #F2F2F2   --text-muted: #A3A3A3
--brand: #FF9A62   --brand-soft: rgba(255,154,98,0.14)
--shadow-card: 0 10px 30px rgba(0,0,0,0.35)
```
Les couleurs `--lime`, `--green`, `--mustard`, `--danger` gardent leur teinte en sombre, légèrement éclaircies si besoin pour le contraste.

### 4.3 Usage des couleurs
- **Orange** : bouton principal, élément actif de la sidebar, point de la courbe, chiffre clé. Jamais un fond orange plein sur plus d'UNE carte par écran (la carte « héro »).
- **Vert citron / vert** : validation, présence, positif, second bouton de marque, deuxième série de graphique.
- **Moutarde** : troisième série, avertissement doux, « en attente ».
- **Rouge** : erreur, danger, absence non justifiée uniquement.
- Statuts clos / annulés / inactifs : gris neutre.
- Graphiques : variations orange / vert / moutarde, **jamais d'arc-en-ciel**.

### 4.4 Typographie
Une seule famille sans-serif géométrique et légèrement ronde (proposition : **Plus Jakarta Sans** ; équivalent accepté : Manrope, DM Sans) chargée une seule fois. Chiffres tabulaires (`font-variant-numeric: tabular-nums`) pour les montants FCFA et les tableaux. Titres en poids 600-700, corps 400-500. Pas de tout-en-capitales sauf micro-labels.

### 4.5 Forme et espace
Cartes `--radius-card`, **sans bordure**, détachées par `--shadow-card`. Contrôles `--radius-control`. Gouttières généreuses (24-32 px entre cartes sur desktop). Beaucoup d'air : si un écran paraît dense, retire un élément plutôt que de rétrécir.

### 4.6 Icônes
**Une seule famille, en trait fin** (comme sur l'image Bizneo : contour 1.5 px, extrémités arrondies). Garde la lib déjà présente si elle est en trait (ex. Lucide, `strokeWidth` 1.5 uniforme), sinon Phosphor « Light » ou Tabler. Interdit : emojis comme icônes d'interface, mélange de styles, pastilles colorées autour de chaque icône. (Les emojis restent autorisés comme CONTENU : réactions, messages.)

---

## 5. Composants — spécifications

- **Carte** : fond `--surface`, ombre douce, pas de bordure, titre discret + action à droite (« Voir tout »).
- **Boutons** : principal = orange `--brand` (texte blanc), secondaire = fond `--surface-2`, texte `--text`, tertiaire = texte seul. Hauteur confortable, rayon capsule ou `--radius-control`, état focus visible, état chargement (spinner + texte), état désactivé lisible.
- **Champs** : fond `--surface-2`, pas de bordure dure, focus = halo orange léger. Labels au-dessus, messages d'erreur en rouge sobre.
- **Tableaux** : lignes aérées, pas de grille, survol doux, en-têtes discrets, tri/filtre visibles, version mobile en cartes.
- **Badges de statut** : fond pastel + texte de la couleur, jamais plus de 3 couleurs par tableau.
- **Sidebar** : fond `--surface`, élément actif = pastille `--brand-soft` + icône/texte orange, groupes séparés par de l'espace (pas de traits), repliable, pastille de notification compacte.
- **Topbar** : recherche, notifications, thème clair/sombre, avatar. Légère, sans bordure basse.
- **Modales / panneaux** : ombre `--shadow-pop`, ouverture avec légère montée + fondu, fermeture par Échap et clic extérieur.
- **Toasts** : coin supérieur droit (bas centré sur mobile), succès / erreur / info / avertissement, icône animée, barre de progression discrète, empilables, fermables, 4 s par défaut (erreurs plus longues).
- **États vides** : petite illustration simple dans la palette ou icône grande en trait fin + phrase utile + action. Jamais « Aucune donnée ».
- **Chargement** : skeletons à la forme exacte du contenu (pas de spinner plein écran), loader de marque `KonzaLoader` quand il existe déjà.

### Graphiques (reproduire le kit)
Garde la bibliothèque déjà utilisée dans l'app. Réglages :
- **Courbes** : interpolation lisse (monotone), trait fin 2-2,5 px, **dégradé sous la courbe** de la couleur vers transparent, **pas de grille ni d'axes lourds**, point actif avec bulle de valeur (tooltip arrondi), points masqués sauf au survol.
- **Donut** : anneau épais, extrémités arrondies, petit espace entre segments, gros chiffre + libellé au centre, légende petite et discrète à côté.
- **Barres** : capsules fines à sommet arrondi, par paires (orange / vert), sur une piste `--surface-2`.
- Animations d'entrée sobres (dessin de la courbe, montée des barres, 600-800 ms, une seule fois).
- **Lisibilité en mode sombre** : les chiffres/étiquettes des graphiques doivent être parfaitement lisibles (contrôler le contraste dans les deux thèmes, notamment sur les graphes de la liste des employés).

---

## 6. Animations et retours d'action

- Durées 150-250 ms (interactions), 400-800 ms (entrées de graphique, confettis). Easing doux (`cubic-bezier(.2,.8,.2,1)`).
- Succès d'une action (pointage, validation, création, tâche cochée, paiement) : toast + micro-animation sur l'élément concerné (coche qui se dessine, légère pulsation). Sobre, pas de feux d'artifice.
- **Confettis** : réservés aux vrais moments de joie (carte d'anniversaire, onboarding terminé). **Une seule fois par personne et par carte**, jamais à chaque rechargement.
- Transitions de page : fondu léger. Listes : entrée échelonnée discrète.
- `prefers-reduced-motion` : toutes les animations non essentielles désactivées.

---

## 7. Anti-« rendu IA » — liste de contrôle (à passer sur CHAQUE page)

- [ ] Pas de dégradés violets/bleus, pas de dégradé de fond « aurore ».
- [ ] Pas de bordures sur toutes les cartes (ombre douce seulement).
- [ ] Pas de glassmorphism gratuit, pas de grosses ombres colorées.
- [ ] Pas d'icône dans une pastille colorée devant chaque ligne/titre.
- [ ] Pas de grille de 3 cartes identiques avec icône + titre + phrase (le motif « landing IA »). Varier les tailles et les hiérarchies.
- [ ] Pas de textes génériques (« Gérez vos talents », « Boostez votre productivité »). Textes courts, concrets, en français, vocabulaire RH/paie congolais (FCFA, CNSS, bulletin, etc.).
- [ ] Une seule famille d'icônes, une seule typographie, une seule palette.
- [ ] Hiérarchie claire : UNE chose principale par écran, le reste en retrait.
- [ ] Alignements et espacements cohérents (échelle de 4/8 px), pas de valeurs arbitraires.
- [ ] Contenu réaliste (noms congolais, montants plausibles en FCFA) dans les démos.
- [ ] Les états vide / chargement / erreur / succès existent et sont soignés.
- [ ] Mode sombre vérifié, mobile vérifié.

---

## 8. Mode démo et couche de données (OBLIGATOIRE)

Objectif : voir tout le rendu sans que le back tourne, et brancher les nouvelles fonctions plus tard sans retoucher les pages.

1. **Interrupteur démo** : `NEXT_PUBLIC_DEMO_MODE=true` remplace les données par des jeux fictifs crédibles. En mode normal, le comportement actuel est strictement inchangé. Quand il est actif, afficher un petit badge discret « Mode démo ».
2. **Fixtures** dans `lib/demo/` (une par domaine : employés, présences, paie, congés, prêts, tâches, événements…), cohérentes entre elles (mêmes employés partout, totaux qui concordent).
3. **Pour les fonctions DÉJÀ servies par l'API** : ne change rien à l'appel existant ; en mode démo seulement, intercepte au niveau d'une couche unique (client API / hook de données) pour renvoyer la fixture. Les pages ne doivent pas contenir de `if (demo)` dispersés.
4. **Pour les fonctions PAS ENCORE servies par le back** (§9) : crée un **adaptateur** par fonctionnalité. Les pages n'appellent QUE l'adaptateur (`useTasks()`, `useDayEvents()`…), jamais `fetch` directement.
   - `lib/data/<feature>.demo.ts` : implémentation fictive (stockage en mémoire, qui bouge vraiment : on peut cocher, réagir, créer).
   - `lib/data/<feature>.api.ts` : implémentation réelle, **laissée en squelette** (lève `NotImplemented`) avec les routes proposées en commentaire.
   - `lib/data/<feature>.ts` : choisit démo ou API via `NEXT_PUBLIC_DEMO_MODE` et un drapeau par fonction (`NEXT_PUBLIC_FEATURE_TASKS_API`, etc.).
   - Types du contrat dans `types/contracts/<feature>.ts` : ce sont eux qui servent de spécification au futur back.
   - **Quand le back sera prêt** : on remplit le seul fichier `<feature>.api.ts`, on active le drapeau, et toute l'interface fonctionne sans retoucher une page.
5. Quand une fonction n'est pas disponible (drapeau éteint, mode normal), l'interface correspondante est **masquée proprement ou affichée en état « bientôt disponible »** sans erreur ni donnée fausse.

---

## 9. Fonctions à venir (interfaces prévues maintenant, back plus tard)

Contrats proposés (le back pourra ajuster, on suivra). Tout est borné par entreprise.

### 9.1 Tâches
- **Personnelles** : créées par l'employé pour lui-même, **privées** (invisibles pour tous, admin compris).
- **Assignées** : créées par ADMIN / HR_MANAGER pour un ou plusieurs employés ou un département. L'employé peut cocher, commenter, signaler un blocage ; il ne peut ni supprimer ni modifier le titre.
- **Admin** : ne voit que les tâches assignées (jamais les personnelles), avec suivi et filtres.

```ts
type TaskScope = 'PERSONAL' | 'ASSIGNED';
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'; // « en retard » = calculé à l'affichage
interface Task {
  id: string; scope: TaskScope; title: string; description?: string;
  dueDate?: string; priority: 'LOW' | 'NORMAL' | 'HIGH'; status: TaskStatus;
  assignedBy?: { id: string; name: string };
  assigneeIds?: string[]; departmentId?: string;
  completedAt?: string; blockedReason?: string;
  comments?: { id: string; authorId: string; text: string; createdAt: string }[];
}
```
Routes proposées : `GET /tasks/me` · `POST /tasks` (perso) · `PATCH /tasks/:id` · `POST /tasks/:id/complete` · `POST /tasks/:id/comments` · `POST /tasks/assign` (admin) · `GET /tasks/admin` (admin, filtres).
Notifications (push existant) : assignation → employé ; terminée → assigneur ; rappel la veille de l'échéance.
Interfaces : « Mes tâches » dans Ma journée (étiquettes **Perso** / **Assignée par X**, création rapide, coche animée, filtres Aujourd'hui / À venir / Terminées) + page admin « Tâches » (créer/assigner à un ou plusieurs employés ou à un département, suivi des statuts, filtres par employé).

### 9.2 Événements de la journée (anniversaires, bienvenue, annonces) et réactions
```ts
type DayEventType = 'BIRTHDAY' | 'WELCOME' | 'ANNOUNCEMENT';
interface DayEvent {
  id: string; type: DayEventType; subject?: { id: string; name: string; photoUrl?: string };
  title?: string; body?: string; day: number; month: number; // jamais l'âge
  expiresAt: string; reactions: { emoji: string; count: number; mine: boolean; userNames?: string[] }[];
}
```
Routes proposées : `GET /day-events` · `POST /day-events/:id/reactions` `{ emoji }` (bascule on/off).
Règles : visible uniquement pour la MÊME entreprise ; carte visible 24 h ; emojis 🎉 👏 ❤️ 🎂 👍 ; une réaction par personne et par emoji ; la personne fêtée reçoit UNE notification groupée ; réglage employé « afficher mon anniversaire » (activé par défaut).

### 9.3 Ancienneté
Le jour de l'anniversaire d'embauche : notification privée à l'employé concerné + aux ADMIN/HR_MANAGER (pas de carte publique). Message signé « Konza RH, au nom de [Entreprise] », choisi dans une bibliothèque écrite à la main (plusieurs variantes par palier : 1, 2, 3, 5, 10+ ans), sans répétition d'une année sur l'autre. Côté front : le rendu de ces notifications dans la cloche et dans Ma journée, avec un bouton « Lui écrire » (chat) pour l'admin.

---

### 9.4 Apparence (couleurs d'entreprise et personnalisation)

Voir [docs/refonte/PERSONNALISATION.md](PERSONNALISATION.md).

## 10. Pages de référence : contenu attendu

### 10.1 Pilotage RH (dashboard admin)
Reprendre EXACTEMENT les données actuellement servies (total employés, masse salariale, taux de présence, demandes en attente, congés du mois, prêts/avances, départements, évolution de la masse salariale, répartition par département, derniers bulletins, activité récente, raccourcis). On peut réorganiser et ajouter, pas retirer ni renommer une donnée. Une carte héro (orange) maximum.

### 10.2 Ma journée (accueil employé)
Le **contenu** compte, le design est le nôtre :
pointage avec chrono et statut (au bureau / hors site) + animation de succès · Mes tâches (§9.1) · calendrier du mois avec jours de congé/férié · absents du jour · carte d'anniversaire (photo, confettis, réactions, §9.2) · prochain jour férié · annonces de l'admin · accès rapide « Demander une absence/un congé » · mes horaires / mon planning · ressources utiles. Jamais plus de blocs que l'écran n'en supporte confortablement : hiérarchiser.

### 10.3 Mon compte
Profil (photo, infos), signature personnelle, ma paie / mes bulletins, notifications (dont push), préférences : thème clair/sombre/auto, langue, « afficher mon anniversaire à mes collègues », sécurité (mot de passe, 2FA). Regrouper ce qui existe déjà (mon-profil, ma-paie, signature…) sans changer les appels.

---

## 10 bis. Gabarits de pages et parcours de demande unifié (RÈGLE MAJEURE)

**Principe : une seule « langue » d'interface.** Si l'utilisateur comprend comment demander un prêt, il doit comprendre sans réfléchir comment demander une avance, un congé, une permission, une absence, du matériel, etc. Même structure, mêmes emplacements, mêmes mots, mêmes animations. Seuls les champs changent d'un type de demande à l'autre.

### A. Les 5 gabarits de pages
Chaque page de l'app utilise UN de ces gabarits (composants partagés dans `components/templates/`). On ne crée pas de mise en page « sur mesure » sans raison.
1. **Liste** : en-tête (titre + bouton principal à droite), cartes de synthèse en haut, filtres/onglets, liste ou tableau, état vide.
2. **Détail** : en-tête avec statut, informations, frise d'historique, actions en bas ou à droite.
3. **Formulaire / demande** : voir B.
4. **Tableau de bord** : cartes de synthèse, graphiques, activité récente, raccourcis.
5. **Paramètres** : sections empilées, une carte par section, bouton d'enregistrement toujours au même endroit, retour visuel de sauvegarde (toast).

### B. Parcours de demande (prêt, avance, congé, permission/autorisation de sortie, absence, matériel, et toute autre demande — liste à confirmer par l'inventaire)

**1. Page liste « Mes demandes de [type] »**
- Même squelette partout : titre, bouton principal orange « **Nouvelle demande** » en haut à droite, 2-3 cartes de synthèse (ex. solde, en attente, total) propres au type, onglets de statut identiques (**En attente · Approuvées · Refusées · Annulées · Toutes**), liste de cartes avec badge de statut, date, résumé en une ligne.
- Même état vide, même squelette de chargement.

**2. Création : même déroulé en 4 temps** (sur une seule page, avec un fil de progression discret)
   1) **Quoi** : le type / le motif ;
   2) **Combien / Quand** : montants, durées ou dates ;
   3) **Détails** : commentaire, pièces justificatives ;
   4) **Récapitulatif** : tout est relu, puis envoi.
- Mise en page identique : formulaire à gauche, **carte « Récapitulatif » à droite** qui se remplit en direct (sur mobile : sous le formulaire). Cette carte n'affiche que ce que l'utilisateur saisit ou ce que le back renvoie, **jamais un calcul refait côté front**.
- Boutons toujours au même endroit : « Annuler » (secondaire, à gauche), « **Envoyer la demande** » (orange, à droite). Mêmes messages d'erreur, même ton.
- Après l'envoi : toast de succès + écran de confirmation (coche animée) qui dit **qui va traiter la demande et ce qui se passe ensuite**, avec « Voir ma demande » et « Faire une autre demande ».

**3. Page détail d'une demande**
- En-tête avec badge de statut ; informations ; **frise d'historique identique** (Envoyée → Avis → Décision) qui affiche le circuit d'avis existant quand il y en a un ; pièces jointes ; actions : « Annuler la demande » (si en attente), « Contacter l'administration » (si en attente ou refusée). Mêmes emplacements pour tous les types.

**4. Côté admin / RH : même langue pour traiter**
- Page « Demandes à traiter » avec le même squelette ; panneau de détail identique ; boutons toujours nommés pareil : « **Donner mon avis** » (si fonction attribuée) et « **Approuver** » / « **Refuser** » (ADMIN ou HR_MANAGER), refus avec motif, commentaire facultatif. Le fonctionnement des avis et des décisions ne change pas : on ne touche que l'affichage.

**5. Vocabulaire et statuts unifiés (affichage seulement)**
- Libellés visibles : *En attente · Approuvée · Refusée · Annulée* (et *Avis donné* quand le circuit existe). Associe-les visuellement à une seule couleur par statut, partout (moutarde = en attente, vert = approuvée, rouge = refusée, gris = annulée).
- **Ne change JAMAIS les valeurs de statut envoyées ou reçues de l'API** : fais un simple mapping d'affichage dans un seul fichier (`lib/request-status.ts`).
- Mêmes verbes partout : « Demander », « Envoyer la demande », « Annuler la demande », « Voir ma demande ».

**6. Composants partagés à créer (une fois) et réutiliser**
`RequestListPage`, `RequestStepper`/`RequestForm`, `RequestSummaryCard`, `RequestStatusBadge`, `RequestTimeline`, `RequestDecisionPanel`, `RequestEmptyState`, `RequestSuccessScreen`.
Chaque module (prêts, avances, congés, permissions, absences, matériel…) ne fournit que **ses champs et ses textes**. Les règles métier propres à un type (soldes, plafonds, jours ouvrés, motifs, pièces) restent dans le code existant, inchangées.

**7. Ordre pour y arriver sans se tromper**
- Construire et faire valider le parcours sur **deux cas opposés** : **Prêts** (montant, durée, mensualité) et **Congés** (dates, solde). Si le gabarit tient pour les deux, il tiendra pour les autres.
- Seulement ensuite, décliner sur avances, permissions, absences, matériel, etc. en réutilisant les composants : ces pages doivent devenir rapides à faire.
- Appliquer la même logique aux autres familles de pages (listes, détails, paramètres) via les gabarits de A.

---

## 11. Plan de travail

**Étape 0 — Inventaire (avant tout code).** Parcours `app/` et liste TOUTES les routes/pages et les composants partagés, regroupés par module. Écris-les dans `PROGRESS.md` (section « Inventaire ») avec une case par page. Signale les pages qui ne respectent pas encore les tokens et les documents imprimables à ne pas toucher.

**Étape 1 — Design system.** Mets à jour `app/globals.css` (tokens clair + sombre), la typographie, les composants de base (carte, bouton, champ, badge, tableau, modale, toast, états vides, skeletons, graphiques), puis une **page `/design-system`** qui les montre tous, clair et sombre. Compare au kit. **Attends la validation de l'utilisateur.**

**Étape 2 — Coquille de l'app et gabarits.** Sidebar, topbar, layout dashboard, thème clair/sombre, mode démo (§8), puis les 5 gabarits de pages et les composants du parcours de demande (§10 bis).

**Étape 3 — Pages, dans cet ordre (à confirmer par l'inventaire) :**
Pilotage RH → Ma journée → Mon compte → **parcours de demande modèle (Prêts puis Congés, validés ensemble)** → avances, permissions, absences, matériel et autres demandes (en réutilisant les composants) → employés → présences/pointage → paie (hors documents imprimables) → notifications / messagerie → formation / matériel / recrutement / rapports / documents → paramètres → pages publiques (accueil, tarifs, connexion, inscription, docs).

**Phase 2 (plus tard, PAS maintenant) :** `/admin/*` (super admin), `/cabinet/[cabinetId]/*` et `/portefeuille/*` avec leurs composants dédiés (`admin/Sidebar`, `admin/LayoutWrapper`, `admin/Charts`, `CabinetSidebar`, `PortfolioSidebar`, `PortfolioTopNav`…). Ces zones sont isolées pour garder leur aspect actuel (voir §14, points 11 et 12).

**Étape 4 — Passe finale.** Cohérence globale, dark mode intégral, mobile, accessibilité, performance, nettoyage du code mort et des couleurs hors palette (recherche par grep).

---

## 12. Déroulé pour CHAQUE page

1. Lis la page et ses composants (code réel).
2. Liste en 3-5 lignes ce que tu vas changer visuellement et ce que tu NE touches PAS (API/logique).
3. Implémente avec les tokens, **les gabarits (§10 bis)** et les composants du design system (pas de style isolé). Si la page est une demande, elle suit le parcours unifié à l'identique.
4. Passe la liste anti-IA (§7), teste clair + sombre + mobile, état vide/chargement/erreur/succès.
5. Vérifie que les appels API, props de données et permissions sont identiques à avant.
6. Livre les fichiers complets.
7. **Compte rendu** : pages/fichiers modifiés · ce qui a changé visuellement · points d'attention · ce qui reste · tâches ou données démo ajoutées · tout élément qui nécessitera du back.
8. Mets à jour `PROGRESS.md` (case cochée, journal daté, décisions).
9. **Attends le feu vert.**

---

## 13. Définition de « terminé » pour une page

Visuellement fidèle au kit · tokens uniquement · clair et sombre OK · mobile OK · états vide/chargement/erreur/succès OK · toasts et micro-animations en place · aucun appel API modifié · mode démo fonctionnel · liste anti-IA validée · compte rendu fourni · `PROGRESS.md` à jour.

---

## 14. Décisions de cadrage après l'inventaire (12 novembre 2026)

Ces décisions complètent le brief et priment sur tout ce qui les contredit plus haut.

1. **Images de référence** : le dossier officiel est `docs/refonte/refs/`. Déplace-les depuis `docs/refs/` et garde ce chemin partout.
2. **« Ma journée » = vue employé de `/dashboard`.** Pas de nouvelle route. Pour un employé : seulement « Ma journée ». Pour un admin/RH : deux onglets sur `/dashboard`, « Pilotage RH » et « Ma journée ». Les deux vues partent de `DashboardContent` sans changer ses appels de données.
3. **Thème : Clair / Sombre / Auto.** Par défaut = **Auto** (suit le système, repli sur le clair). Respecter le choix déjà enregistré, suivre les changements du système en direct, et retirer le sombre forcé des pages d'authentification. `/kiosk` et `/ecran` (écrans d'affichage) : décision au moment de leur page. Le réglage se trouve dans Mon compte → préférences et dans la topbar. (À faire à l'étape 2.)
4. **Tokens** : garder les 11 noms existants et changer leurs valeurs selon §4.2. `--brand` et ses variantes passent de l'émeraude à l'orange ; `--accent-2` / `--accent-2-soft` passent à la moutarde. Ajouter `--lime`, `--green`, `--mustard`, `--danger`, `--shadow-card`, `--shadow-pop`, `--radius-card`, `--radius-control`.
5. **Transition** : à l'étape 1, ne PAS remplacer en masse les couleurs en dur (emerald, slate, etc.). La migration se fait page par page. L'app aura donc un aspect mélangé jusqu'à la fin : c'est normal. Seule la page `/design-system` sert de juge à l'étape 1.
6. **Typographie** : remplacer Inter par **Plus Jakarta Sans**, chargée localement comme aujourd'hui. Garder JetBrains Mono uniquement pour les codes et numéros techniques.
7. **Layout racine** (fonds slate, halos bleu/indigo) : à nettoyer à l'étape 2, car il touche toutes les routes.
8. **Variantes `/pme/[companyId]/*`** : elles délèguent surtout à des composants partagés. On refond d'abord la version principale et les composants partagés, puis on vérifie les variantes (souvent rien ou presque à changer). Routes et permissions inchangées. (Les variantes cabinet sont en phase 2, voir points 11 et 12.)
9. **Modules de demande (prêts/avances, congés, permissions, absences)** : chacun a les mêmes 5 rôles de page, qui doivent avoir la même structure et les mêmes noms partout :
   - **Mon espace** (vue employé) ;
   - **Nouvelle demande** (formulaire, §10 bis) ;
   - **Validations** (admin / RH / avis) ;
   - **Suivi / historique** ;
   - **Rapport**.
   Unifier visuellement `CongeSubNav`, `AbsenceSubNav`, `PermissionsSubNav` et `RequestModuleNav` en une seule sous-navigation. **Réutiliser et restyler l'existant** (`RequestHistoryView`, `ApprovalPanel`, `AvisInbox`, `PermissionTimeline`, `request-reports/*`, `LoansForm`, `LoansList`) plutôt que le reconstruire.
10. **Ordre des pages** : confirmé tel que proposé dans PROGRESS.md, sans le côté cabinet / portefeuille / super admin (phase 2).
11. **Phase 2 (reportée)** : `/admin/*` (super admin, utilisé seulement par le propriétaire), `/cabinet/[cabinetId]/*` (peu utilisé) et `/portefeuille/*`, avec leurs composants dédiés. On ne les redessine pas maintenant. Dans PROGRESS.md, leurs pages sont marquées « reporté — phase 2 » (cases conservées).
12. **Isolation : ces zones ne doivent PAS changer d'aspect pendant la phase 1.** Les nouveaux tokens ne doivent pas « manger » leurs pages. Méthode :
    - Avant de modifier `app/globals.css`, **copie les anciennes valeurs des 11 tokens** (clair ET sombre) dans un bloc dédié, par exemple `.theme-legacy` et `.dark .theme-legacy`. Les nouvelles valeurs vont dans `:root` / `.dark`.
    - Ajoute la classe `theme-legacy` sur le conteneur racine de `app/admin/layout.tsx`, `app/(dashboard)/cabinet/[cabinetId]/layout.tsx` et `app/(dashboard)/portefeuille/layout.tsx`.
    - **Vérifie** que ces layouts remplacent bien la coquille commune (`DashboardShell` / `Sidebar` / `TopNav`). Si un parent commun enveloppe ces zones avec la nouvelle coquille, dis-le-moi avant d'aller plus loin : on décidera ensemble (c'est le seul point où la coquille pourrait changer).
    - Contrôle final de l'étape 2 : ouvre quelques pages admin, cabinet et portefeuille et confirme qu'elles sont **identiques à avant** (couleurs, sidebar, graphiques). Seul un correctif minimal est autorisé si quelque chose est cassé.
    - En phase 2, on retirera `theme-legacy` page par page au moment de les refondre.
13. **L'apparence est un chantier séparé décrit dans [PERSONNALISATION.md](PERSONNALISATION.md)** ; le moteur de thème (ThemeProvider étendu, mode Auto) fait partie de l'étape 2, la section Apparence de Mon compte arrive avec cette page, la carte Apparence de Paramètres → Entreprise arrive avec cette page, le back plus tard. La préparation technique de la section 6 commence dès l'étape 1 ; la fonction complète reste à construire séparément.

14. **Déclaration administrative des employés à la CNSS (13 novembre 2026)** : statut explicite confirmé par les RH, distinct du numéro CNSS, des retenues et du dépôt mensuel. Champ nullable cnssEmployeeDeclared : déclaré / non déclaré / à vérifier, sans inférence ni reclassement automatique des anciens dossiers. Le dashboard des effectifs utilise le kit à l’écran ; les fichiers/modèles Excel conservent leur rendu officiel et les zones phase 2 leur apparence.

15. **Refonte de l’organisation et de l’UX (retour utilisateur du 17 novembre 2026)** : remplacer les couleurs et icônes, ou poser une enveloppe, ne suffit pas. Repenser la composition, les priorités d’information, la densité, l’emplacement et le nombre des actions, les regroupements et la facilité du parcours. L’utilisateur doit percevoir une amélioration nette de l’utilisation. La fiche employé sert de correction concrète : abandon du grand bandeau décoratif, identité compacte, actions explicites et dossier structuré. Les API, droits, calculs et documents restent inchangés ; la conformité technique ne vaut pas validation du rendu.
