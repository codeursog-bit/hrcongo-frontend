# REVUE GÉNÉRALE ET REPRISE — DIRECTIVES POUR L'AGENT

> Ce fichier est la **feuille de route de reprise**. Ordre de lecture à chaque session : `PROGRESS.md` (court) → ce fichier → les sections utiles de `REFONTE.md` (§2 règles absolues, §14 décisions) → `AUDIT.md` (mesures). N'ouvre `INVENTAIRE.md` et `JOURNAL.md` que pour chercher une ligne précise.
> Les règles de `REFONTE.md` §2 s'appliquent partout : **aucun appel API, permission, calcul ni document officiel ne change**.
>
> **Priorités fixées par l'utilisateur (16 nov. 2026)** : 1) la refonte, sur **toutes** les pages de l'espace entreprise et de l'espace multi-entreprises (portefeuille), avec un vrai bon design, y compris les cartes anniversaire, événements, ancienneté, tâches et annonces de « Ma journée » ; 2) ensuite l'alignement du back avec le front ; 3) ensuite l'assistant. **Cabinet et super admin restent tels quels pour l'instant.**

---

## 1. Où on en est (à lire une fois)

Trois intervenants ont travaillé, **sans qu'aucun n'ait pu voir l'écran** (pas de navigateur disponible). Tout est donc à vérifier visuellement.

| Intervenant | Période | Ce qu'il a fait |
|---|---|---|
| **Codex** | jusqu'au 13 nov. | Étapes 0 à 2 : inventaire, design system (`/design-system`), tokens, coquille, thème Clair/Sombre/Auto, mode démo, gabarits, kit des demandes (`ModulePageFrame`), puis Pilotage RH, Ma journée, Mon compte, Apparence, Prêts, Congés, Permissions, Absences, Employés, Présences, Documents, CNSS, Pricing… |
| **Copilot** | 13 nov. | Paie (9 routes), Recrutement (11), vue d'ensemble des Rapports, Messages, quelques pages de Présences. |
| **Claude** (14 nov., lots 1 à 6) | 14 nov. | **Cadre commun posé par enveloppe** (`ModulePageFrame`, le contenu intérieur n'a pas été réécrit) sur ~65 pages : Rapports, Paramètres, Contrats, Performance, Avis, Audit, Finances, Primes, Demandes, Onboarding, Ma signature, RH-blog, pages à documents (DAS, récaps, journal de paie, fiche de performance, Ma paie, contrats), 5 pages PME, 14 pages Portefeuille. Plus : sidebar, topbar, recherche Ctrl/⌘ + K, menu Apparence, logo d'entreprise, `ModuleNav` (sous-menus), famille de sélecteurs, composants `ui`, layout Portefeuille. Détail exact : `JOURNAL.md`. |

### Trois niveaux de finition (à connaître)
- **Niveau A — refondu à la main** : utilise les primitives et les tokens. Exemples : Pilotage RH, Ma journée, Prêts, Congés, Recrutement, vue d'ensemble des Rapports.
- **Niveau B — cadre commun seulement** : la page est enveloppée dans `ModulePageFrame`, dont le CSS **remappe à l'exécution** les classes Tailwind (`bg-white`, `text-gray-500`, `emerald`…). Le code intérieur contient encore des milliers de classes de palette, des emojis, des dégradés. C'est le cas de la grande majorité des pages privées.
- **Niveau C — non commencé** : pages publiques (accueil, à propos, contact, auth, blog…), cabinet, super admin.

**Le niveau B n'est pas fini.** Il masque les couleurs, mais les pages ne sont pas « vraiment » alignées : couleurs restantes, icônes à bannir, effets décoratifs, graphiques avec des couleurs en dur, titres et boutons qui ne suivent pas le même gabarit. C'est l'objet de la revue ci-dessous.

---

## 2. Mission 1 — Reprendre là où tu t'étais arrêté, et isoler le travail des autres

1. **Isole ce que les autres ont fait.** Repère ton dernier commit (celui de la fin de ta dernière session, avant les travaux de Copilot et de Claude), puis liste les fichiers modifiés depuis :
   ```
   git log --oneline -n 40
   git diff --stat <dernier-commit-de-GPT>..HEAD
   git diff --name-only <dernier-commit-de-GPT>..HEAD
   ```
   Cette liste est ton **périmètre de contrôle** : tout ce qui y figure doit être relu avec la grille de conformité (section 3, fin). Si l'historique Git ne permet pas de séparer les travaux, appuie-toi sur `JOURNAL.md` (qui dit qui a fait quoi, lot par lot).
2. Vérifie que les six lots de Claude ont bien été appliqués (liste dans `JOURNAL.md`). Si un fichier d'un lot manque ou diffère, signale-le ; ne le réécris pas de mémoire.
3. Ajoute dans `package.json` (front) : `"audit:refonte": "node scripts/audit-refonte.mjs"`.
4. Lance, **une seule fois** : `npm run check-types` puis les scripts `check-*` existants. Corrige uniquement ce qui casse. Compte rendu en 10 lignes.
5. Lance `npm run audit:refonte -- --write` et commite `docs/refonte/AUDIT.md` : c'est la mesure de départ.

---

## 3. Mission 2 — Revue générale en 7 passes (sans repartir de zéro)

Travaille **une passe à la fois**, module par module, dans l'ordre de `AUDIT.md` (les fichiers les plus chargés d'abord). Après chaque lot de fichiers : `npm run audit:refonte`, compte rendu court avec avant/après, puis feu vert. Ne touche jamais aux documents imprimables ni aux exports officiels (liste dans `INVENTAIRE.md`, « NE PAS TOUCHER »).

### Passe 1 — Bannir les emojis et les icônes parasites
- **Règle** : aucun emoji comme icône d'interface, de bouton, de titre, de puce ou d'état vide. Remplace-les par des icônes **Lucide en trait fin** (`strokeWidth={1.5}`, tailles 16, 18 ou 20), sans pastille colorée autour de chaque icône.
- **Autorisés** : les cinq réactions des cartes du jour (🎉 👏 ❤️ 🎂 👍), le contenu saisi par les utilisateurs, les documents et exports officiels.
- **Interdits aussi** : un mélange de familles d'icônes, des icônes dans des cercles colorés répétés devant chaque ligne ou titre, des icônes décoratives sans sens.
- **Ordre** : `AUDIT.md` → section emojis. Les plus chargés : `app/docs/page.tsx`, `CreateReviewModal`, `employes/[id]`, `CanvasEditor`, calculateurs d'outils, `presences/shifts`, `BlogEditor`, `comptabilite` (paie et PME), checklists d'onboarding.
- **Terminé quand** : `emojis` ≈ 0 hors exceptions, et chaque remplacement a un `aria-label` ou un texte visible.

### Passe 2 — Couleurs non synchronisées : classes de palette → tokens
- **Règle** : plus aucune classe `bg|text|border|ring|from|to-<couleur>-<nombre>` dans une page refondue. Utilise les tokens (variables CSS) ou les classes du design system (`k-*`).
- **Table de conversion** :

| Ancien | Nouveau |
|---|---|
| `bg-white`, fonds de carte | `var(--surface)` |
| `bg-gray-50/100`, `bg-slate-50/100`, zones en creux, champs | `var(--surface-2)` |
| fond de page | `var(--bg)` |
| `text-gray-900`, `text-slate-900`, `text-black` | `var(--text)` |
| `text-gray-500/600`, `text-slate-500/600`, textes d'aide | `var(--text-secondary)` |
| `border-*`, `divide-*` | supprime (cartes sans bordure, ombre `var(--shadow-card)`) ; sinon `var(--border)` |
| `emerald-*` utilisé comme marque / action / actif | `var(--brand)`, `var(--action)` (texte), `var(--brand-soft)` (fond léger) |
| `emerald-*` utilisé comme statut positif (validé, présent) | `var(--green)` ou `k-tone-success` |
| `amber-*`, `yellow-*` (en attente, avertissement) | `var(--mustard)` ou `k-tone-warning` |
| `red-*`, `rose-*` (erreur, refusé) | `var(--danger)` ou `k-tone-danger` |
| `blue-*`, `sky-*`, `indigo-*`, `violet-*`, `purple-*`, `teal-*`, `cyan-*`, `pink-*` | `var(--brand)` ou neutre ; **pas de teinte supplémentaire** hors graphiques |
| variantes `dark:*` | supprime : les tokens suivent déjà le mode sombre |

- Une page n'est pas « terminée » tant qu'elle dépend du remap du cadre pour être correcte. Garde le cadre, mais le code doit être juste par lui-même.
- Respecte la sémantique : un même statut a la même couleur partout (moutarde = en attente, vert = approuvé, rouge = refusé, gris = annulé).
- **Ordre** : `AUDIT.md` → section palette (les plus chargés : `paie/manuel`, simulateurs, `employes/[id]`, `formation`, `parametres/entreprise`, `cnss-declaration`, `AbsenceAnalyticsBoard`, `paie/[id]/modifier`, `parametres/paie`, `ContractRupturePage`…). `lib/absence-tracking-colors.ts` : la palette de suivi des absences doit passer à la palette du design system.

### Passe 3 — Effets décoratifs (« look IA »)
- **À supprimer** : `bg-gradient-to-*`, `linear-gradient(` décoratifs, `animate-pulse`, `animate-ping`, `animate-bounce`, `blur-*` et `backdrop-blur` décoratifs, halos et ombres colorées, texte en dégradé (`bg-clip-text`), badges lumineux.
- **À garder** : les squelettes de chargement, un fondu discret, les micro-animations de succès du design system, `prefers-reduced-motion` respecté.
- **Remplacement** : surface unie (`var(--surface)`), ombre `var(--shadow-card)`, couleur d'accent unie (`var(--brand-soft)` pour un fond léger).
- **Ordre** : `AUDIT.md` (dégradés, pulse/ping, flou/verre). Les plus chargés : offres d'emploi IA (`jobs/ia/*`), `success`, `TrialBadge`, `SubscriptionReminderProvider`, pointage, `presences/shifts`, `formation`, `rapports/complet`.

### Passe 4 — Graphiques et rapports
- **Constat** : les pages de rapports utilisent Recharts avec des couleurs hexadécimales en dur (`rapports/effectifs`, `indicateurs`, `analyse-conges`, `analyse-paie`, `complet`, `departements`, `mouvements-effectifs`, `portefeuille/rapports`).
- **À faire** : crée **un seul** assistant de thème de graphiques (ex. `lib/chart-theme.ts` ou un hook qui lit les variables CSS `--brand`, `--green`, `--mustard`, `--text-secondary`, `--surface-2`) et remplace les hex des pages. Réutilise le style du design system : courbes lisses avec dégradé sous la courbe, **pas de grille**, point actif avec bulle de valeur, donut à anneau épais, barres en capsules sur piste claire.
- Les séries utilisent orange, vert, moutarde puis neutres ; jamais d'arc-en-ciel. Vérifie le contraste des chiffres et des légendes en **mode sombre**.
- Les exports (Excel, PDF) et les impressions restent inchangés.

### Passe 5 — Cohérence UX des pages (gabarits)
- **En-tête de page unifié** : titre en `font-semibold` (24 à 28 px, **pas de gras lourd**), sous-titre en `var(--text-secondary)`, l'action principale à droite (un seul bouton primaire). **Supprime** les petits titres en capitales espacées (ex. « RESSOURCES HUMAINES ») et les boutons d'en-tête qui **répètent** les liens du sous-menu `ModuleNav` (ex. Mon espace, Nouvelle demande, Calendrier, Soldes, Provision en doublon).
- **Gabarits** : toute page utilise l'un des cinq gabarits (`components/templates`) ; toute page de demande suit le parcours unifié (REFONTE.md §10 bis).
- **Sélecteurs** : remplace les listes déroulantes faites à la main par `FancySelect` / `SearchSelect` (même rendu partout), et les groupes de choix courts par `.k-segmented`.
- **Sous-menus** : tout module passe par `ModuleNav` (déjà en place pour Congés, Présences, Absences, Permissions, Prêts, Rapports, Performance). Cherche tout autre sous-menu fait à la main et unifie-le.
- **Boutons** : `k-button k-button-primary` pour l'action principale, `k-button-secondary` ensuite, jamais plus d'un primaire par écran. Pas de boutons géants.
- **États** : vide, chargement (squelette), erreur et succès soignés sur chaque page.

### Passe 6 — Revue visuelle avec navigateur (si disponible) et impression
- Ouvre en **mode démo**, clair puis sombre, bureau puis mobile, les pages principales de chaque module. Corrige débordements, contrastes, éléments coupés, doublons, textes en capitales.
- **Tests d'impression** (obligatoires, documents officiels) : DAS, récap des bulletins, récap du personnel, fiche de performance, journal de paie, Ma paie (modale bulletin, impression et PDF). Compare avec la production ; si un document change d'aspect, **retire** l'enveloppe de cette page et signale-le.
- Si aucun navigateur n'est disponible : ne tente pas d'en lancer ; liste ce qui reste à vérifier à la main dans `PROGRESS.md`.

---

### Passe 7 — « Ma journée » vivante : cartes anniversaire, événements, ancienneté, tâches, annonces
Le design de ces écrans doit être **beau et soigné**, pas seulement conforme. Contrôle et corrige, dans `/dashboard` (vue employé « Ma journée »), les composants des fonctions à venir :
- **Carte d'anniversaire** : photo en grand (initiales élégantes si pas de photo), confettis **une seule fois** par personne et par carte, message court, rangée de réactions (🎉 👏 ❤️ 🎂 👍) avec compteurs, liste des réacteurs au survol ou au toucher, état « j'ai réagi » clair. Jour et mois seulement, **jamais l'âge**.
- **Carte de bienvenue** et **annonces de l'administrateur** : même famille visuelle que l'anniversaire (même carte, même réactions).
- **Message d'ancienneté** (privé) : carte sobre et chaleureuse signée « Konza RH, au nom de [Entreprise] » ; côté administrateur, la même carte avec le bouton « Lui écrire ».
- **Tâches** : étiquettes « Perso » / « Assignée par X », coche animée, filtres, création rapide ; côté admin, la page de suivi des tâches assignées.
- **Aperçu de la journée** : jours fériés, collègues absents (libellé neutre), horaires, pointage avec chrono.
- Vérifie : états vides soignés, mode sombre, mobile, `prefers-reduced-motion`, aucun emoji hors réactions et contenus, couleurs en tokens, aucune donnée inventée en mode normal.
- Ces écrans lisent leurs données via les adaptateurs `lib/data/*` (démo aujourd'hui, API plus tard) : **ne change pas les contrats** (`types/contracts/*`), le back doit s'y aligner.

### Grille de conformité par page (à appliquer à tout ce que Copilot et Claude ont touché)
Une page n'est « conforme » que si toutes ces cases sont vraies. Elles reprennent les normes de `REFONTE.md` (§2, §4 à §7, §10 bis, §13, §14) et de `PERSONNALISATION.md`.
1. Tokens uniquement : aucune classe de palette Tailwind, aucun hex de marque en dur (hors graphiques passés par l'assistant de thème).
2. Fond gris-blanc, cartes **sans bordure**, ombre `var(--shadow-card)`, rayons `var(--radius-card)` / `var(--radius-control)`.
3. Une seule famille d'icônes (Lucide, trait fin), aucun emoji d'interface, pas de pastille colorée par icône.
4. Aucun dégradé décoratif, aucune pulsation, aucun flou ni halo, aucune ombre colorée.
5. En-tête de page unifié (titre sobre, sous-titre muted, une action primaire), sans petit titre en capitales, sans bouton qui répète le sous-menu.
6. Gabarit de page respecté (liste, détail, formulaire/demande, tableau de bord, paramètres) ; parcours de demande identique pour prêt, avance, congé, permission, absence.
7. Sous-menu via `ModuleNav` ; sélecteurs via `FancySelect` / `SearchSelect` / `.k-segmented` ; boutons `k-button` (un seul primaire par écran).
8. États vide, chargement (squelette), erreur et succès présents ; toasts du design system.
9. Mode sombre et mobile vérifiés ; contraste suffisant ; navigation clavier et libellés d'accessibilité.
10. Aucun appel API, permission, route ni calcul modifié ; documents imprimables et exports intacts ; mode démo fonctionnel.
Chaque page contrôlée est notée dans `INVENTAIRE.md` : `[~]` livrée, `[x]` seulement quand l'utilisateur a validé le rendu.

---

## 4. Mission 3 — Terminer la refonte (espace entreprise et multi-entreprises d'abord)

Ordre, fixé par l'utilisateur :
1. **Tout l'espace entreprise et l'espace Portefeuille** : fini quand les passes 1 à 7 sont faites et validées sur toutes leurs pages (`/dashboard`, présences, congés, prêts, paie, rapports, recrutement, employés, paramètres, contrats, performance, formation, matériel, messages, notifications, mon compte… et `/portefeuille/*`, ainsi que les variantes `/pme/…`).
2. **Pages publiques** : Accueil (`/`), À propos (`/qui-sommes-nous`), Contact, Authentification (`/auth/*`, `/register`), Blog (`/blog`) et détail (`/blog/[slug]`) ; ensuite tarifs, outils (calculateurs), annuaire d'entreprises, offres d'emploi. Hors coque dashboard : en-tête et pied de page publics sur les tokens, un titre fort mais sobre, aucune illustration générique, aucun dégradé violet, textes concrets en français. Accueil : 88 couleurs hex, 6 dégradés et 8 emojis à éliminer.
3. **Cabinet** (`/cabinet/[cabinetId]/*`) et **super admin** (`/admin/*`) : **ne pas y toucher pour l'instant.** Ils gardent `theme-legacy` et leur ancien aspect (zones peu utilisées). Le super admin pourra être confié à Claude plus tard ; ne le commence pas.

Pour chaque nouvelle zone : propose d'abord (3 à 5 lignes), attends le feu vert, livre une page à la fois.

---

## 5. Mission 4 — Back (dépôt séparé), **seulement après validation de la refonte**

Quand l'utilisateur a validé la refonte (missions 1 à 3), le back s'aligne sur le front. Les directives détaillées sont dans **`BACKEND.md`** (à copier dans le dépôt du back). Résumé de la conduite :

1. Lis `BACKEND.md` en entier. Lots dans l'ordre : B1 Apparence, B2 Tâches, B3 Événements du jour, réactions et annonces, B4 Anniversaires et ancienneté, B5 Aperçu de la journée.
2. **Un lot = proposer le schéma Prisma (ajouts uniquement) et les routes → attendre le feu vert → implémenter avec tests → compte rendu de 10 lignes.**
3. Additif seulement. Ne modifie ni ne supprime rien d'existant. Lis le schéma réel avant de proposer des modèles (le brief ne l'a pas vu : type des identifiants, relations à adapter).
4. Après chaque lot livré : côté front, remplis le fichier `lib/data/<fonction>.api.ts` correspondant (le squelette liste les routes) et active le drapeau `NEXT_PUBLIC_FEATURE_*_API`. Aucune page ne change : **si une page doit changer pour que ça marche, le contrat est faux, corrige le back ou le contrat, pas la page**.
5. Respecte les règles de vie privée de `BACKEND.md` §2 (tâches personnelles invisibles, jamais d'âge, aucun motif d'absence).
6. Front et back doivent marcher **parfaitement ensemble** : teste chaque fonction de bout en bout (anniversaires, événements, ancienneté, tâches, annonces, apparence, aperçu de la journée) avant de passer au lot suivant.

## 5 bis. Mission 5 — Assistant Konza (en dernier)

Spécification dans `ASSISTANT.md`. **Ne rien construire** tant que l'utilisateur n'a pas validé la refonte ET l'alignement du back. Le chat entre l'utilisateur et l'assistant est prévu dans cette spécification (panneau latéral de conversation).

---

## 6. Règles d'économie et de compte rendu

- Lis `PROGRESS.md` seulement, pas `INVENTAIRE.md` ni `JOURNAL.md` en entier. Pour trouver du travail : `npm run audit:refonte` ou les `| [ ]` d'un module.
- Ne tente pas d'ouvrir un navigateur si l'environnement n'en fournit pas. Un seul contrôle de types par lot. Modifie les fichiers en place, garde leurs fins de ligne.
- **Un commit par passe et par module** (ex. « refonte: passe 2 couleurs, paie »), pour pouvoir revenir en arrière.
- Compte rendu en 10 lignes : pages ou fichiers touchés, mesures avant/après (`audit:refonte`), points d'attention, ce qui reste, besoins back. Ajoute une entrée courte (8 lignes) à `JOURNAL.md` et mets à jour `PROGRESS.md`.
- En cas de doute sur un document officiel ou une règle de paie : **ne touche pas** et pose la question.

---

## 7. Messages de lancement (à copier-coller)

**Front : à envoyer maintenant**
```
Lis docs/refonte/PROGRESS.md, puis docs/refonte/REVUE.md en entier, puis REFONTE.md §2 et §14 et PERSONNALISATION.md. Tu reprends là où tu t'étais arrêté. D'abord, isole ce que Copilot et Claude ont fait depuis ton dernier commit (git diff --name-only, voir Mission 1) : c'est ton périmètre de contrôle. Contrôle-le avec la grille de conformité de la section 3 et corrige tout ce qui ne respecte pas nos normes (couleurs hors tokens, emojis, dégradés, en-têtes, doublons de menus, sélecteurs, graphiques). Lance npm run audit:refonte pour mesurer l'état. Exécute la Mission 1, puis les passes 1 à 7 une par une, module par module, en commençant par l'espace entreprise et le portefeuille. Un lot de fichiers à la fois, compte rendu en 10 lignes avec les mesures avant/après, puis attends mon feu vert. Cabinet et super admin : ne pas toucher. Ne touche ni aux appels API ni aux documents imprimables.
```

**Back : à n'envoyer qu'une fois la refonte validée**
```
Dans le dépôt du back, lis docs/front-alignement/BACKEND.md en entier. Commence par le lot B1 (Apparence) : propose-moi d'abord le schéma Prisma (ajouts uniquement, adapté à mes conventions réelles) et la liste des routes, puis attends mon feu vert avant d'implémenter. Additif seulement, rien d'existant ne change. Un lot à la fois, compte rendu en 10 lignes.
```
