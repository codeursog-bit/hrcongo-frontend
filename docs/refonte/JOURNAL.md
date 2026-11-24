# JOURNAL DES LIVRAISONS (archive)

> Ne pas relire à chaque session. On y AJOUTE seulement, en fin de fichier, une entrée COURTE (8 lignes maximum) par lot livré : date, pages, fichiers clés, point d'attention, ce qui reste. Historique complet de la refonte jusqu'au 13 novembre 2026 ci-dessous.

## Historique

_(date — page — fichiers modifiés — points d'attention)_
- 12 novembre 2026 — Étape 0 : 308 pages et composants inventoriés ; tokens, thème et documents protégés relevés. Seul `docs/refonte/PROGRESS.md` modifié. Étape 1 non commencée ; attente du feu vert.

### 12 novembre 2026 — Étape 1 livrée, validation en attente

- Fichiers : `app/globals.css`, `app/layout.tsx`, `tailwind.config.js`, les trois layouts legacy, `package.json` / `package-lock.json`, `components/design-system/{primitives,feedback,charts}.tsx`, `components/design-system/design-system.css`, `app/design-system/page.tsx`, ce suivi et la sauvegarde `docs/refonte/legacy-tokens.css`. Les trois références sont dans `docs/refonte/refs/`.
- Tokens : les 11 noms conservés et recolorés ; 8 tokens demandés ajoutés. Compagnons de texte accessibles ajoutés : `--text-secondary`, `--on-brand`, `--action`, `--success-text`, `--warning-text`, `--danger-text`. Orange du kit conservé pour les accents et graphiques ; bouton principal en orange soutenu `--action` pour garder un contraste lisible avec le blanc (le couple blanc / orange clair du kit ne satisfait pas 4,5:1). Ce choix reste soumis à validation.
- Base UI disponible : carte, bouton principal/secondaire/tertiaire, états chargement/désactivé, input/select/textarea avec labels et messages, badges, tableau triable avec filtre de démonstration et cartes mobiles, modale native avec focus contenu/restauré, fermeture Échap/extérieur, 4 toasts empilables (4 s, erreur 7 s), progression, pause au survol/focus, coche de succès, état vide et skeleton de tableau.
- Graphiques : courbe monotone 2,25 px avec dégradé et tooltip, donut épais avec espaces et centre, barres orange/vert sur pistes. Animations 700 ms et prise en compte de `prefers-reduced-motion`. Libellés textuels des données disponibles aux technologies assistance.
- `/design-system` : données fictives locales, sans appel métier ; bascule clair/sombre indépendante du thème global, formulaire de démonstration, tri, filtre, états vides, skeletons, modale et notifications. Aucun besoin back ajouté. Le mode démo global reste prévu à étape 2.
- Isolation phase 2 : les blocs legacy clair et sombre sont identiques à la sauvegarde des 11 tokens (comparaison automatique passée). Les trois layouts reçoivent la classe et conservent la pile de police historique. Aucune coquille dédiée modifiée. Le contrôle visuel identique avant/après reste à faire à étape 2 comme prévu au brief.
- Vérifications réussies : `npm run check-types`, `npm run check-client-directives` (530 fichiers), compilation Next de `/design-system`, réponse HTTP 200 et contenu attendu, `git diff --check`, comparaison exacte des 11 tokens legacy clair/sombre. Aucun fichier de page existante, API, hook métier, calcul, permission, document imprimable ou export officiel modifié.
- Limite de vérification : accès navigateur et applications natives indisponible dans cette session ; rendu clair/sombre/mobile, focus au clavier, interactions et réduction des mouvements implémentés mais non vérifiés visuellement. Ne pas considérer cette page comme validée avant revue dans le navigateur.
- Étape 2 non commencée : aucun nettoyage des fonds/halos racine, aucun remplacement massif des couleurs, aucun changement du ThemeProvider. Attente du feu vert.
- 12 novembre 2026 — Nouvelle tentative de contrôle navigateur autorisée par utilisateur : ouverture de /design-system refusée par le service avec le message « The browser access host is unavailable ». Aucun contrôle visuel supplémentaire possible ; étape 1 toujours en attente de revue visuelle. Étape 2 non commencée.

### 12 novembre 2026 — Étape 2 livrée, validation en attente

- Périmètre : uniquement les fondations. Aucune refonte de page métier de étape 3, aucun calcul ni droit modifié. Les pages authentification ont reçu les substitutions de couleurs nécessaires pour suivre le thème, sans changer leurs formulaires, validations, requêtes ni redirections.
- Coquille : sidebar sans bordure, actif orange sur fond doux, sous-navigation partagée adaptée aux tokens, icônes en trait 1,5 px, compteurs et menus filtrés par les permissions existantes. Topbar légère, recherche parmi les liens déjà autorisés du menu (Ctrl/Cmd+K), notifications et avatar conservés. Menu mobile : Échap, focus contenu/restauré, menu fermé rendu inerte ; lien pour passer au contenu. Respect des mouvements réduits et mise en page mobile prévus.
- Thème : choix Clair / Sombre / Auto, Auto par défaut avec repli clair, choix enregistré respecté, changements système et inter-onglets suivis en direct. Initialisation avant hydratation. Contrôle en topbar et carte « Mon compte · Préférences » sur le profil, sans modifier la page métier du profil.
- Racine : fonds slate et halos bleu/indigo retirés des routes phase 1. La décoration et les couleurs de body historiques sont conservées pour les routes reportées. Les 11 tokens legacy clair/sombre sont inchangés. Le repli sombre historique reste effectif dans les zones reportées sans choix enregistré ; kiosk/ecran conservent également leur repli antérieur en attendant leur propre page.
- Mode démo : `NEXT_PUBLIC_DEMO_MODE=true`, couche unique `lib/demo/transport.ts` installée avant les consommateurs, session fictive Admin/RH ou Employé, badge discret et restauration de la session précédente. Aucun client API ni appel métier existant changé. Hors démo, la couche ne remplace pas fetch. Les zones admin/cabinet/portefeuille sont exclues de la simulation.
- Fixtures cohérentes : société Mavoula Services, 3 employés, 3 départements, masse salariale 1 455 000 FCFA, net 1 290 000 FCFA, congés, prêts/avances, présences, absences/permissions, notifications et abonnement typé. Même identité dans tous les domaines. Les endpoints non couverts et les écritures métier non intégrées répondent explicitement « indisponible en démonstration », sans fuite vers la vraie API. Les sorties officielles et paiements ne sont pas simulés. Couverture à étendre avec chaque page de étape 3.
- Gabarits dans `components/templates/` : Liste, Détail, Formulaire, Tableau de bord, Paramètres. Kit `components/requests/` : RequestListPage, RequestForm/Stepper, RequestSummaryCard, RequestStatusBadge, RequestTimeline, RequestDecisionPanel, RequestEmptyState, RequestSuccessScreen. Statuts visibles centralisés dans `lib/request-status.ts`, sans changer les valeurs API. Les règles métier, champs et callbacks restent fournis par chaque module ; aucun calcul de mensualité ou de jours ajouté. ApprovalPanel est réutilisable directement dans le panneau, les historiques existants restent intégrables en slots.
- `/design-system` enrichie : sélection des 5 gabarits, parcours fictif Prêt/Congé en 4 temps, récapitulatif, détail, décision et confirmation. Ce sont des démonstrations des gabarits ; les parcours métier Prêts/Congés ne sont pas encore refondus et restent à valider ensemble à étape 3.
- Couche future : contrats `types/contracts/`, adaptateurs `.demo.ts` / `.api.ts` / sélecteurs `.ts`, hooks `useTasks`, `useDayEvents`, `useAnnouncements`, `useAnniversaries`. Démo mutable pour créer/cocher/commenter/assigner, réagir, créer une annonce et lire une notification privée. Les tâches personnelles sont invisibles aux autres comptes, administration comprise ; sociétés et départements isolés. Sans drapeau ni démo : fonction indisponible sans requête. Adaptateurs API volontairement `NotImplemented` ; drapeaux à laisser éteints tant que le back ne les sert pas.
- Besoins backend différés : routes proposées dans les `.api.ts`, gestion serveur des rappels, push groupés, affectations et réactions, calendrier et messages ancienneté. Rien à développer dans le back pour utiliser les gabarits ou cette démo.
- Vérifications : TypeScript OK, directives client OK (541 fichiers), tests `scripts/check-refonte-foundations.cjs` passés (thème, script initial, confidentialité, affectations, isolation sociétés/départements, réactions, annonces, notifications privées, transport sans fuite réseau, sauvegarde exacte des 11 tokens). Comparaison AST : arguments API/fetch inchangés dans Sidebar, TopNav, NotificationProvider et les 4 pages authentification retouchées. `git diff --check` passé.
- Compilation / HTTP en démo : `/design-system`, `/dashboard`, `/auth/login`, `/admin/login` répondent 200. En mode normal : `/design-system`, `/auth/login`, `/cabinet/demo-cabinet/dashboard`, `/portefeuille/dashboard` répondent 200, les nouveaux gabarits figurent dans le HTML de démonstration. Ces contrôles ne prouvent pas une session authentifiée ni une identité visuelle avant/après.
- Réserve : navigateur de contrôle toujours indisponible (« The browser access host is unavailable »), une seule tentative rapide effectuée. Les vérifications visuelles clair/sombre/mobile, interactions clavier réelles et comparaison avant/après des zones reportées ne peuvent donc pas être déclarées réussies. À réaliser dès que le navigateur sera accessible. Les avertissements de cache webpack local ne bloquent pas les compilations.
- Documents protégés : aucun modèle, renderer, composant imprimable, format ou handler export officiel modifié. Aucun fichier dédié admin/cabinet/portefeuille retouché pendant étape 2.
- Documentation de lancement : `docs/refonte/DEMO.md`. Aucun drapeau ajouté aux fichiers `.env`, aucune publication. Attente du feu vert avant étape 3.
### 12 novembre 2026 — Correctif de chargement des pages

- Incident reproduit sur le serveur utilisateur (port 3000) : la page répondait 200 mais son script `/_next/static/chunks/app/(dashboard)/dashboard/page.js` répondait 404. Une réponse HTML 200 ne suffisait donc pas à valider le chargement côté navigateur.
- Cause de désynchronisation identifiée : les serveurs de vérification sur 3100 partageaient le dossier `.next` du serveur 3000. Les scripts de développement non hashés étaient aussi conservés en cache-first par le service worker.
- Serveur 3000 redémarré ; ancien cache généré mis de côté dans `.next-stale-20261112-114208`, sans suppression de code ou données applicatives. Nouveau cache reconstruit.
- Prévention : `NEXT_DIST_DIR` configurable dans `next.config.js`, commande `npm run dev:check` avec sortie `.next-check` et port 3100. Dossiers de vérification/cache mis de côté exclus de Git. Les prochaines vérifications ne doivent plus utiliser le cache du serveur utilisateur.
- Service worker : version de cache v2, seuls les assets Next contenant un hash de contenu sont mis en cache-first ; webpack.js, layout.js et page.js de développement passent au réseau. Mise à jour des workers déjà présents demandée au chargement en développement, avec rechargement à leur activation. Aucun cache utilisateur hors namespace Konza, cookie ou donnée IndexedDB supprimé.
- Vérification après redémarrage : `/auth/login` 200 et 9/9 scripts valides ; `/dashboard` 200 et 10/10 scripts valides ; `/design-system` 200 et 8/8 scripts valides. Chaque script est téléchargé avec succès et analysé comme JavaScript, au-delà du simple contrôle HTML.
- Tests : `check-service-worker-cache.cjs` (régression cache dev/prod et migration v1), `check-refonte-foundations.cjs` passés ; contrôle TypeScript relancé. Pas de nouvelle étape de refonte commencée.

### 12 novembre 2026 — Étape 3, page 1 : Pilotage RH

- Périmètre : uniquement la vue admin/RH de `/dashboard`. Le passage à étape 3 est autorisé par utilisateur ; aucune autre page de cette étape refondue.
- Fichiers : `components/DashboardContent.tsx`, `components/dashboard/PilotageDashboard.tsx`, `components/dashboard/pilotage.css`, `scripts/check-pilotage.cjs`, ce suivi. Le fichier de route reste inchangé. Les composants de base, le gabarit DashboardPage et les trois graphiques Recharts de étape 1 sont réutilisés.
- Visuel : une seule carte héro orange pour la masse salariale ; 7 indicateurs conservés ; courbes avec dégradés, donut orange/vert/moutarde et barres en capsules. Bulletins, activité récente (36 h) et 4 raccourcis réorganisés dans une grille aérée sans bordures de carte. Montants affichés intégralement en FCFA, chiffres tabulaires, icônes Lucide 1,5 px, liens accessibles au clavier. CSS exclusivement scoped à `.pilotage`, avec tokens et dispositions mobile/tablette/desktop.
- Données : mêmes champs, endpoints et valeurs qu’avant. Aucun calcul métier ajouté. Les alias label/primary/secondary adaptent seulement les noms de champs à la présentation des graphiques partagés. Le donut présente chaque département fourni, sans recalculer une somme « Autres ». Les nombres de demandes, congés, prêts/avances et départements reprennent les expressions existantes inchangées.
- États : skeletons à la forme du dashboard pendant le chargement admin, messages utiles si les graphiques/bulletins/activités sont vides, erreur de chargement avec bouton Réessayer (rechargement de la page). Aucun toast de mutation nécessaire pour cette vue de consultation. Noms et dates partiels protégés pour éviter les erreurs de rendu.
- Garde-fous : comparaison AST avec la version précédente réussie — tous les appels API identiques, blocs JSX/contrôle EMPLOYEE et MANAGER strictement conservés. Aucun document imprimable/export, calcul existant, permission, route, fixture ni fichier dédié des zones reportées modifié. Aucun besoin backend ajouté.
- Tests réussis : TypeScript, contrôle des directives client (542 fichiers), `check-pilotage.cjs` (valeurs backend, 7 indicateurs, raccourcis, absence de mutation des données, états vide/erreur/chargement et champs manquants). `/dashboard` répond 200 et tous ses scripts JavaScript sont téléchargés et analysés avec succès.
- Vérification locale : 3100 étant déjà occupé, serveur de test lancé sur 3101 avec dossier `.next-pilotage` distinct, puis arrêté. Aucune utilisation concurrente du cache `.next` ou `.next-check`. Le chemin de types temporaire ajouté automatiquement par Next a été retiré après vérification ; les autres réglages TypeScript conservés.
- Réserve visuelle : tentative navigateur limitée à 12 s, expirée ; clair/sombre/mobile prévus et styles contrôlés statiquement, mais comparaison visuelle réelle non validée. Ne pas déclarer ces contrôles visuels réussis.
- Suite : « Ma journée » sera traitée après feu vert. Les onglets admin/RH « Pilotage RH / Ma journée » seront branchés avec cette vue personnelle ; aucun onglet factice ni nouvel appel de données ajouté dans cette livraison. Arrêt ici en attente de validation.
### 12 novembre 2026 — Étape 3, page 2 : Ma journée

- Autorisation : utilisateur demande de poursuivre après Pilotage RH. Périmètre limité à la vue employé de `/dashboard` et aux onglets nécessaires pour les comptes admin/RH ; aucune nouvelle route. Manager, Mon compte et les autres pages de étape 3 non refondus.
- Rendu : carte de pointage avec chrono, arrivée/départ et lieu fourni par les données ; tâches personnelles/assignées ; calendrier navigable du mois avec les congés approuvés ; anniversaires/réactions et confettis discrets ; annonces ; absents du jour et prochain jour férié ; résumé personnel, horaires, messages privés ancienneté et ressources/raccourcis. Cartes sans bordure, tokens uniquement, styles `.myday`, grilles mobile/tablette/desktop.
- Navigation : employé → seulement Ma journée. Admin/RH → Pilotage RH / Ma journée sur la même route. La vue personnelle admin est chargée à la demande depuis les mêmes endpoints individuels déjà utilisés pour les employés ; le Pilotage conserve ses lectures par défaut. Les comptes sans fiche employé disposent de messages explicites, sans inventer de données.
- Pointage : lien vers `/presences/pointage` pour conserver le parcours GPS/QR, géolocalisation et permissions existants. Aucun check-in/check-out ni contrôle de localisation recréé sur le dashboard. Le chrono indique le temps écoulé entre pointages ; il ne sert ni au calcul des heures payées ni aux pauses/HS. Il se met à jour dans un petit composant isolé et suspend les rafraîchissements quand la page est masquée.
- Tâches : création personnelle, filtres Aujourd’hui / À venir / Terminées, coche/réouverture, commentaires et blocages motivés, badges Perso / Assignée par X, chargement/erreur/vide, toasts de succès et coche. Les tâches assignées ne sont ni renommées ni supprimées par cet écran. Les règles de confidentialité restent dans les adaptateurs déjà testés.
- Événements : photo si fournie, initiale sinon ; réactions basculables avec compteurs, sans âge affiché. Animation anniversaire enregistrée une seule fois par personne/carte dans le navigateur et désactivée si mouvements réduits ou stockage indisponible. Rafraîchissement des événements à leur expiration. Annonces et notifications ancienneté passent par leurs hooks/adaptateurs ; lien vers la messagerie pour un admin/RH souhaitant écrire à une autre personne.
- Données préservées : résumé personnel existant (congés en attente, solde et détails fournis, ancienneté, départ prévu, salaire masqué par défaut, présence mensuelle, remboursé/restant). Les trois fonctions de calcul existantes ont été déplacées telles quelles vers `lib/personal-dashboard-stats.ts` et restent utilisées ; aucun calcul métier ajouté ou corrigé. Les nouveaux calculs concernent uniquement le calendrier d’affichage et le chrono.
- Données pas encore branchées au back : horaires, calendrier des fériés et absents du jour ont un contrat `day-overview`, adaptateur démo borné à la société et adaptateur API NotImplemented (route proposée en commentaire). Drapeau `NEXT_PUBLIC_FEATURE_DAYOVERVIEW_API` à laisser éteint tant que ce contrat ne sera pas branché. En mode normal sans drapeau : messages « bientôt disponible », sans fausses données ni requêtes vers un endpoint inventé. Les jours fériés du fixture sont illustratifs, pas une source légale.
- Démo : deux tâches cohérentes (une personnelle privée et une assignée), une annonce, horaires/jour férié et collègue absent issus du domaine démo ; structure du solde de congés complétée sans changer ses valeurs. Aucun drapeau `.env` modifié. Le backend doit encore fournir les tâches, réactions, annonces, notifications ancienneté et la synthèse de journée selon leurs contrats.
- Fichiers : `DashboardContent.tsx`, `components/dashboard/{MyDay,MyDayWidgets}.tsx`, `day-types.ts`, `day-calendar.ts`, `myday.css`, `hooks/usePersonalDay.ts`, `useDayOverview.ts`, complément de `useDayEvents.ts`, utilitaire personnel de stats, contrat/adaptateurs/fixture day-overview, fixtures tâches/annonce/solde et `scripts/check-myday.cjs`. PilotageDashboard et documents protégés inchangés.
- Vérifications réussies : `check-myday.cjs` (API existantes identiques, calculs identiques, manager identique, nouvelles lectures admin appartenant aux endpoints personnels déjà existants, salaire masqué, éligibilité congés, états, calendrier/chrono et confidentialité), `check-refonte-foundations.cjs`, `check-pilotage.cjs`, TypeScript et directives client (546 fichiers). `/dashboard` HTTP 200, 10 scripts téléchargés avec succès et analysés comme JavaScript.
- Vérification isolée sur 3101 / `.next-myday`, sans toucher au serveur 3100 existant ni à son cache. Le chemin TypeScript temporaire est retiré après arrêt du serveur de test.
- Réserve : accès navigateur toujours indisponible après une seule tentative courte ; clair/sombre/mobile et interactions réelles sont implémentés mais non déclarés validés visuellement. Aucun test visuel fictif.
- Arrêt ici : attendre le feu vert pour Mon compte. Les pages Prêts/Congés restent à traiter ensuite selon le parcours modèle prévu.

### 12 novembre 2026 — Étape 3, page 3 : Mon compte

- Feu vert utilisateur reçu après Ma journée. Périmètre : `/mon-profil` et sa variante PME qui réexporte la même page. Aucune nouvelle route. Aucun document protégé ni page des zones reportées modifié.
- Présentation : gabarit Paramètres, identité/photo en tête, sections aérées sans bordure, champs sur fond en creux, icônes Lucide 1,5 px, navigation par ancres, actions d’édition dans le pied d’enregistrement commun. Tous les champs personnels, familiaux, professionnels, santé/divers et contact d’urgence sont conservés. Situation familiale et enfants restent en lecture seule. Le badge reprend le rôle et le statut fourni au lieu d’afficher systématiquement « Employé actif ».
- Composants partagés : Card, Button, Skeleton, Modal, SuccessMark et toasts. La modale de mot de passe utilise le dialogue commun (Échap, clic extérieur, focus). Libellés reliés aux champs, boutons de visibilité nommés, états erreur/succès annoncés. Mouvements réduits et mises en page mobile prévus.
- Préférences : contrôle Clair/Sombre/Auto déplacé de DashboardShell vers la section Préférences, sans doublon ni modification du ThemeProvider. Français affiché ; autres langues et réglage de visibilité de l’anniversaire explicitement à venir, aucun interrupteur factice ni sauvegarde fictive. Ces deux réglages demandent encore un contrat et une implémentation backend.
- Regroupement : accès aux pages existantes `/ma-paie`, `/ma-signature`, `/notifications`, `/parametres/securite` (2FA), sans embarquer leurs requêtes ni leurs documents. Le droit de signature est toujours contrôlé par la page existante. PushToggleButton réutilisé avec ses permissions et son comportement inchangés ; style adapté uniquement à l’intérieur de Mon compte. Les pages de destination restent à refondre à leur tour.
- Préservation vérifiée par AST avec la version Git précédente : mêmes appels API, payload d’auto-service, exclusion des champs familiaux, rôles autorisés, condition canEdit, fonctions de chargement/édition, validations de mot de passe et calculs existants. Seuls les retours visuels de succès sont ajoutés aux handlers. Aucun appel métier ajouté.
- Démo : la fiche fictive de Laure dispose désormais de l’autorisation RH d’auto-service. PATCH `/employees/me` en mémoire respecte une liste de champs modifiables, refuse les champs familiaux et refuse l’écriture sans autorisation. Rechargement = retour au fixture initial. Mot de passe, upload photo, signature et sorties officielles ne sont pas simulés avec un faux succès. Aucun fichier `.env` modifié.
- Fichiers : `app/(dashboard)/mon-profil/{page.tsx,account.css}`, retrait du contrôle de thème en doublon dans `components/layout/DashboardShell.tsx`, slot optionnel `saveAction` du gabarit SettingsPage (comportement des autres consommateurs conservé), `lib/demo/transport.ts`, `scripts/check-account.cjs`, documentation de suivi/démo.
- Vérifications réussies : TypeScript, directives client (546 fichiers), `check-account.cjs` (préservation métier, rendu, états, édition, données familiales en lecture seule, démo mutable et autorisation), tests fondations/Pilotage/Ma journée, `git diff --check`. `/mon-profil` HTTP 200 avec 10 scripts JavaScript valides ; variante PME HTTP 200 avec 9 scripts valides.
- Serveur de vérification 3101 avec cache isolé `.next-account`, puis arrêté ; serveur utilisateur 3100 et cache inchangés. Inclusion temporaire TypeScript retirée après les tests.
- Réserve : navigateur de contrôle indisponible dans cette session ; les rendus clair/sombre/mobile et les interactions réelles restent à valider visuellement. Aucun résultat visuel déclaré réussi sans observation.
- Arrêt après cette page : attendre le feu vert avant le parcours modèle Prêts, puis Congés. Les deux parcours doivent être validés avant de décliner les autres demandes.

### 12 novembre 2026 — Étape 3, page 4 : Prêts · Mon espace

- Feu vert reçu après Mon compte. Première page du parcours modèle Prêts : uniquement `/loans/mon-espace`. Les avances déjà intégrées à cette page sont conservées. Nouvelle demande, gestion/validations, relevés et rapports non refondus ici. Aucune route ajoutée ; aucune zone reportée retouchée.
- Présentation : RequestListPage et ListPage, cartes de synthèse conservant les quatre indicateurs existants, cinq filtres de statut communs, liste/détail côte à côte puis empilés sur mobile. Pagination de dix éléments après filtrage. Montants FCFA en chiffres tabulaires, skeletons adaptés, erreur de chargement explicite, états vides et succès d’annulation par toast.
- Détail : statut centralisé via RequestStatusBadge ; mêmes montants, nature, solde, mode de remboursement, motif, motif de refus et trace des ajustements. ContactAdminButton et conditions d’annulation inchangés. Frise RequestTimeline avec envoi, avis réellement fournis par le hook existant useDocSignatures (auteur/date/opinion), puis statut actuel. Aucun avis ou horodatage de décision inventé, aucun appel ajouté pour construire cette frise.
- Suivi : quatre KPI conservés, historique complet conservé et graphique lisse orange/vert avec dégradés via SmoothChart. Ajout de libellés optionnels au graphique commun ; ses valeurs et libellés par défaut pour Pilotage RH sont conservés. Les données sont simplement renommées label/primary/secondary pour la présentation ; les calculs de dette et d’évolution existants sont inchangés.
- Composants partagés : RequestListPage accepte un panneau de détail et une pagination optionnels. Les consommateurs sans ces options gardent leur présentation et leur comportement existants. Les filtres sont uniquement visuels et ne sont jamais envoyés à l’API. Les statuts PAID/DEDUCTED restent « Soldée » en gris et consultables dans Toutes.
- Documents protégés : bloc hors écran, aperçu documentaire, composants de documents, props de données, handlers PDF/Excel/impression et autorisations strictement conservés. Les styles sont ciblés sur les éléments d’application, sans sélecteur global visant le contenu imprimable. Aucun renderer ou export officiel modifié.
- Démo : prêt actif de 300 000 FCFA avec 200 000 FCFA restants, deux remboursements fixes de 50 000 FCFA ; demande personnelle en attente de 30 000 FCFA. Type, mode de remboursement et autorisation d’impression précisés dans les fixtures. Annulation en mémoire limitée aux demandes personnelles en attente ; rejet des annulations de prêts actifs et des demandes d’autres employés. Compteurs du Pilotage et montant mensuel démo ajustés pour rester cohérents. Les documents officiels restent indisponibles en démo. Aucun fichier `.env` modifié, aucune modification backend requise.
- Fichiers : `app/(dashboard)/loans/mon-espace/page.tsx`, `components/loans/LoanSpaceView.tsx`, `loan-space.css`, options de `components/requests/index.tsx`, styles du gabarit commun, libellés de `components/design-system/charts.tsx`, fixtures/transport démo et `scripts/check-loan-space.cjs`. Test Pilotage adapté pour vérifier le montant réellement fourni par le fixture, sans figer l’ancienne valeur démo.
- Vérifications : comparaison AST avec Git précédente réussie pour appels API/fetch, calculs, données documentaires, renderers/aperçu/hors-écran, handlers d’export, autorisations et props de contact. Tests des états, détail/avis, pagination après filtrage, annulation autorisée/interdite et cohérence historique démo réussis. TypeScript, directives client (547 fichiers), fondations, Pilotage, Ma journée et Mon compte vérifiés. `/loans/mon-espace` HTTP 200 et dix scripts téléchargés puis analysés comme JavaScript.
- Vérification sur 3101 avec `.next-loan-space` isolé, puis arrêt ; serveur utilisateur 3100 conservé. Inclusion temporaire TypeScript retirée ensuite. Revue visuelle clair/sombre/mobile et interactions navigateur encore en attente : l’accès navigateur de contrôle était indisponible dans cette session, aucun résultat visuel inventé.
- Arrêt après cette page. Prochaine page proposée : `/loans/nouveau` avec le parcours Quoi → Combien / Quand → Détails → Récapitulatif. Attendre le feu vert ; Congés reste à traiter et à valider avec Prêts avant toute déclinaison aux autres demandes.

### 12 novembre 2026 — Étape 3, page 5 : Prêts · Nouvelle demande

- Feu vert reçu après Mon espace. Périmètre : `/loans/nouveau` uniquement. Le formulaire conserve ses quatre types existants (argent, marchandise, avance, autre) ; aucune page dédiée aux avances ni autre module refondu. Aucune route, permission ou API métier ajoutée.
- Parcours : Quoi (bénéficiaire/type/motif), Combien / Quand (montant, durée et date, ou période de déduction de l’avance), Détails (nature et pièce jointe uniquement pour STANDARD/MODERN et hors avance), Récapitulatif avant envoi. Gabarit RequestForm, carte RequestSummaryCard à droite puis sous le formulaire sur mobile ; retour aux étapes précédentes sans perdre la saisie.
- Champs et actions : tous les champs existants conservés, mêmes types/options/callbacks. Droits de création pour autrui, recherche d’employés et choix du remboursement conservés. Input/Select/Textarea/Button partagés, icônes en trait fin sans pastilles, tokens et focus visibles. L’aperçu de la fiche reste accessible à la dernière étape et conserve exactement ses composants et ses données.
- Calculs : aucun nouveau calcul métier. Mensualité estimée, date de fin, dette existante et total projeté reprennent strictement les expressions antérieures. Le récapitulatif latéral contient la saisie ; les estimations déjà présentes restent identifiées dans le corps du formulaire. Le rendu masque uniquement une date de fin invalide au lieu d’afficher Invalid Date.
- Validations : canSubmit et handleSubmit conservés, mêmes endpoints et payloads prêts/avances. Les boutons Continuer réutilisent les mêmes conditions (motif de trois caractères, montant positif, durée positive hors avance, employé sélectionné pour autrui). noValidate évite que le nouveau conteneur form ajoute une validation HTML absente auparavant ; le contrôle métier existant reste la référence.
- Composants communs : RequestForm accepte en option description/navigation, désactivation des étapes/envoi et noValidate ; garde-fou contre un envoi pendant le chargement, focus du titre lors du changement d’étape. RequestSuccessScreen accepte une phrase de confirmation optionnelle pour la création directe RH, sans promettre une validation encore à venir. Options absentes = comportement précédent conservé.
- Retours : erreur d’envoi dans le formulaire, bouton de chargement, toast et coche animée après succès ; Voir ma demande et Faire une autre demande. Les réinitialisations précédentes sont conservées avec remise à zéro de l’étape. Comme auparavant, Voir ma demande ouvre Mon espace, sans nouvel identifiant de réponse consommé ni lien de détail inventé. Chargement des données de contexte non bloquant conservé ; loader existant pour la dette de l’employé sélectionné. Aucune fausse attente plein écran ajoutée.
- Démo : POST prêts/avances stocke la demande en mémoire, disponible ensuite dans Mon espace sans rechargement. Copie des champs saisis sans calcul de paie ni échéancier simulé ; demande personnelle PENDING, création directe ADMIN pour un employé ACTIVE/APPROVED comme le workflow existant vérifié en lecture dans le backend. Employés bornés à la société fictive et création pour autrui refusée à l’employé. Compteurs et montant mensuel de démonstration suivent les demandes en mémoire. Les documents officiels restent non simulés ; upload/aperçu existants inchangés. Aucun fichier `.env` ni backend modifié.
- Fichiers : `app/(dashboard)/loans/nouveau/page.tsx`, `components/loans/loan-form.css`, options des composants partagés dans `components/requests/index.tsx`, `lib/demo/transport.ts`, `scripts/check-loan-form.cjs`, suivi et guide démo. Aucun document protégé ni zone reportée touché.
- Vérifications réussies : comparaison AST API/payloads/calculs/validations/aperçu avec Git précédente ; rendu des quatre étapes, branches prêt/avance, droits RH, données réellement envoyées, erreur serveur sans faux succès, confirmation et démo mutable. TypeScript, directives client (547 fichiers), fondations, Mon espace Prêts, Pilotage, Ma journée et Mon compte. `/loans/nouveau` HTTP 200 avec dix scripts JavaScript téléchargés et analysés avec succès ; git diff --check.
- Vérification isolée sur 3101 / `.next-loan-form`, puis arrêt et retrait du chemin TypeScript temporaire ; serveur utilisateur 3100 inchangé. Réserve : accès navigateur de contrôle indisponible dans cette session ; clair/sombre/mobile et interactions réelles restent à valider visuellement, sans prétendre qu’un contrôle HTTP suffit.
- Arrêt après cette page : attendre le feu vert pour Prêts · Validations. Le parcours Congés reste ensuite à construire et à valider avec Prêts avant de décliner les autres demandes.

### 12 novembre 2026 — Préparation technique de l’apparence, Prêts en pause

- Demande utilisateur : lecture intégrale de `PERSONNALISATION.md`, préparation de sa section 6 uniquement, documentation du chantier séparé. Prêts mis en pause avant `/loans/validations` ; Mon espace et Nouvelle demande restent livrés. Aucune nouvelle page de Prêts commencée pendant cette préparation.
- Étape 1 complétée : `--brand-strong`, `--brand-soft`, `--on-brand`, `--focus` et le compagnon de bouton `--action` dérivent de `--brand` avec `color-mix()`, en clair comme en sombre. Dérivations également déclarées dans la vitrine claire isolée pour éviter d’hériter d’un accent calculé dans un autre contexte. Les boutons communs lisent action/on-brand ; le focus des composants, de la coquille et des pages déjà refondues lit focus. Les surfaces et les accents Konza par défaut restent les sources actuelles.
- Composants et graphiques : audit des composants de base et des trois graphiques Recharts communs, déjà alimentés par les tokens. Aucune couleur de marque ajoutée en dur ; séries orange/vert/moutarde conservées. Les couleurs sémantiques vert/moutarde/rouge et leurs textes de contraste restent fixes, indépendants de brand. Aucun remplacement massif dans les pages non refondues.
- Protection : les onze tokens legacy clair/sombre sont strictement identiques à leur sauvegarde. Aucun renderer, document imprimable, export officiel ou champ `primaryColor`/`secondaryColor` modifié. Aucune API, permission, donnée métier ou calcul changé.
- Hors périmètre maintenant : palettes/ambiances, sélecteurs, règle entreprise/utilisateur, interrupteur d’autorisation, stockage et cache d’apparence, adaptateurs appearance, extension ThemeProvider et cartes Apparence. Ces éléments restent au chantier séparé et aux étapes indiquées dans le nouveau document. Le mode personnel Clair/Sombre/Auto existant est conservé. Aucun drapeau activé et aucun fichier `.env` modifié.
- Documentation : REFONTE §9.4 ajouté et décision §14.13 ajoutée selon le cadrage demandé ; ligne Apparence dans Fonctions à venir avec `NEXT_PUBLIC_FEATURE_APPEARANCE_API`, état « en attente du back », interface/adaptateurs explicitement non construits.
- Vérifications : `check-appearance-preparation.cjs` (dépendances des tokens en clair/sombre, statuts fixes, composants/graphiques sans marque en dur, contraste bouton ≥ 4,5:1 pour les deux accents Konza livrés), tests fondations (dont sauvegarde legacy exacte), TypeScript et git diff --check réussis. Le test ne garantit pas le contraste d’un accent arbitraire : validation et sélection automatique de texte clair/foncé seront faites par le futur moteur d’apparence, sans prétendre le livrer ici. Pas de validation visuelle navigateur supplémentaire.
- Préparation terminée. Point de reprise convenu : **Prêts · Validations (`/loans/validations`)**, après le retour utilisateur. Aucun travail fonctionnel de personnalisation engagé.

### 12 novembre 2026 — Étape 3, page 6 : Prêts · Validations

- Reprise autorisée par utilisateur après la préparation de l’apparence. Prêts n’est plus en pause. Périmètre limité à `/loans/validations` et aux composants de présentation nécessaires ; aucune autre page métier refondue, aucune fonction de personnalisation construite.
- Présentation : gabarit ListPage « Demandes à traiter », quatre indicateurs conservés, deux graphiques horizontaux Recharts en capsules sur pistes neutres (accent/vert, tokens et mouvements réduits). Grille/liste conservées, cartes sans bordure, noms et montants lisibles, boutons Approuver/Refuser séparés du bouton d’ouverture : suppression du HTML invalide de boutons imbriqués.
- Filtres : les cinq statuts communs remplacent le sélecteur local, affichage initial Toutes conservé ; type et département inchangés. Les demandes soldées sont dans Toutes, les annulées dans Annulées. Ce mapping est uniquement visuel. Les calculs originaux des quatre KPI sont conservés : leurs libellés précisent « Approuvées / soldées » et « Refusées / annulées » pour rendre les regroupements existants explicites.
- Détail : panneau avec rôle dialog, titre associé, focus contenu/restauré et Échap ; défilement interne sur petit écran. RequestDecisionPanel accepte un slot contrôlé, contenant le même ApprovalPanel et les contrôles existants. Aucun nouveau champ de commentaire envoyé. Donner mon avis reste fourni par le panneau d’avis lorsque la fonction est attribuée ; décision réservée aux mêmes DRH_ROLES. Remboursement sur paie/espèces, refus motivé, awaitingOpinions et appels de l’orchestrateur strictement conservés. L’ouverture rapide prépare la décision sans l’envoyer, comme avant.
- Superposition : le dialogue de choix « attendre les avis / urgence » est au-dessus du détail ; le contrôle local du focus cède la main à ce dialogue et à l’aperçu documentaire lorsqu’ils sont ouverts. Aucun hook de données ni mécanisme de décision partagé modifié. Les interactions réelles navigateur restent à vérifier.
- États : skeletons adaptés à la page, erreur de lecture explicite, états vides selon les filtres, toasts de décision réussie et d’attente d’avis. CANCELLED de l’orchestrateur ne ferme pas la fiche et ne produit aucun faux succès. Le refus vide reste bloqué par le contrôle original. L’erreur de décision conserve le message fourni par le mécanisme existant.
- Documents : données standard/défaut/ORCA, composants, signatures, bloc hors écran, aperçu et handlers Excel/PDF/impression inchangés, comparaison AST réussie. Aucun renderer ni export officiel modifié ; styles de contrôle ciblés hors contenu documentaire.
- Démo : état d’avis sans circuit actif et décisions via les routes existantes de l’orchestrateur, en mémoire uniquement. ADMIN peut approuver/refuser les demandes fictives en attente ; refus avec motif obligatoire, choix du remboursement conservé. Demande déjà traitée, accès hors société et décision d’un employé sont refusés. Aucun circuit d’avis complexe ni avis fictif simulé ; ces branches sont testées séparément avec les réponses de l’orchestrateur. Documents officiels toujours non simulés, aucun `.env` ou backend modifié.
- Fichiers : `app/(dashboard)/loans/validations/page.tsx`, `components/loans/LoanValidationCharts.tsx`, `loan-validations.css`, slot de `RequestDecisionPanel`, `lib/demo/transport.ts`, `scripts/check-loan-validations.cjs` et documentation.
- Vérifications réussies : AST appels API/fetch/hooks/orchestrateur, décisions, autorisations, calculs, props ApprovalPanel et documents avec la version Git précédente ; tests accord/refus/motif vide, mode de remboursement, WAITING/CANCELLED, filtres, rôle non décideur et démo mutable. TypeScript, directives client (548 fichiers), fondations, apparence, Mon espace, Nouvelle demande, Pilotage, Ma journée et Mon compte. `/loans/validations` HTTP 200 et dix scripts JavaScript téléchargés/analysés. git diff --check.
- Serveur isolé 3101 / `.next-loan-validations`, ensuite arrêté ; serveur utilisateur 3100 conservé et inclusion TypeScript temporaire retirée. Réserve : contrôle visuel clair/sombre/mobile et navigation clavier réels toujours en attente, navigateur de contrôle indisponible dans cette session. Aucun succès visuel déduit du seul statut HTTP.
- Arrêt après cette page. Prochaine page proposée : **Prêts · Suivi des dettes (`/loans/suivi-dettes`)**. Attendre le feu vert avant de continuer ; Congés reste à construire et à valider avec Prêts avant de décliner les autres demandes.

### 12 novembre 2026 — Apparence livrée en démo ; Prêts en pause avant Suivi

- Nouvelle autorisation utilisateur : avancer le chantier de personnalisation maintenant, avant de reprendre Prêts. Réalisation de la page et de son moteur, sans backend. Point de reprise inchangé : `/loans/suivi-dettes`. Aucun autre module de demande modifié.
- Accès : `/apparence` depuis une carte Apparence de Mon compte ; `/apparence?scope=company` depuis Paramètres → Entreprise. Deux vues sur la même page, contrôles entreprise uniquement pour ADMIN. Variante `/pme/[companyId]/apparence` et liens contextualisés ; l’entreprise active pilote les couleurs. Les pages de profil/entreprise ne reçoivent qu’une carte d’accès : leurs appels et formulaires métier sont conservés, la refonte complète de Paramètres → Entreprise reste à faire.
- Interface : dix palettes, sélecteur libre et code hex contrôlé, quatre ambiances claires et trois sombres. Aperçus clair/sombre locaux avant sauvegarde, avec carte, bouton, statuts fixes et courbe de marque. Réinitialisation Konza, retour aux couleurs entreprise, rétablissement admin des couleurs par défaut ; sauvegarde avec toast. État verrouillé sans sélecteur lorsque l’entreprise refuse la personnalisation. Chargement, erreur/réessai et état bientôt disponible hors démo sans service branché.
- Politique : défaut Konza si aucun choix entreprise ; choix entreprise prioritaire sauf autorisation et choix personnel. Désactiver l’autorisation conserve les choix personnels en stockage et les ignore ; réactiver les restaure. Préférences utilisateur communes aux entreprises, réglages entreprise séparés. Mode Clair/Sombre/Auto toujours personnel, avec clé par utilisateur et repli sur l’ancien réglage ; le choix de couleurs ne remplace jamais ce mode.
- Données : contrat `types/contracts/appearance.ts`, sélecteur de domaine, adaptateur démo en localStorage et adaptateur API NotImplemented avec routes proposées en commentaire. Rôle ADMIN vérifié dans l’adaptateur démo pour l’écriture entreprise ; session et entreprise active exigées. La protection serveur, l’audit et la validation de rôle restent à construire dans le backend ; la démo n’est pas une authentification réelle. Aucun champ primaryColor/secondaryColor utilisé ou modifié. Aucun `.env` ni schéma/backend modifié.
- Moteur : ThemeProvider conserve son API et encapsule AppearanceProvider. Application des seuls tokens d’apparence sur html, source et identité contextualisées ; choix obsolète d’une entreprise jamais affiché comme celui de la suivante. Synchronisation sauvegarde, stockage inter-onglets, retour au premier plan et changement de route. Cache effectif clair/sombre avant hydratation, identité et politique démo vérifiées avant application ; variables CSS strictement bornées. Cache distinct démo/API. Routes avant connexion et zones reportées exclues, variables retirées lors du passage vers celles-ci.
- Accessibilité : accent sombre éclairci, action/focus dérivés et textes clair/foncé choisis automatiquement. Contraste bouton ≥ 4,5:1 et focus ≥ 3:1 sur les ambiances proposées ; texte sur la carte héro adapté à l’accent. Les statuts positifs, attente, refus et gris neutre restent fixes. Les ambiances sont centralisées une seule fois dans `lib/appearance.ts` ; couleurs invalides refusées. Les documents gardent leurs couleurs et leurs renderers ; aucun fichier de document protégé/export modifié. Les onze tokens legacy restent exactement identiques à leur sauvegarde.
- Fichiers : contrats/adaptateurs appearance, `lib/appearance.ts`, bootstrap pré-hydratation, AppearanceProvider et intégration ThemeProvider/layout ; page et variante PME ; composants `components/appearance/` ; deux cartes d’accès ; tokens neutres sémantiques et couleur de texte héro ; `scripts/check-appearance.cjs` et documentation. Aucune refonte des pages Prêts pendant cette intervention.
- Vérifications : TypeScript, directives client (553 fichiers), tests apparence (résolution, autorisation, conservation/réactivation, isolation, réinitialisation, contrastes sur palettes et accents extrêmes, cache/identité/politique, exclusions legacy/auth, écrans verrouillés/admin/indisponibles), fondations et préparation apparence, Validations Prêts et Mon compte réussis. Aucun changement API métier dans Mon compte. Documents/exports protégés contrôlés sans modification dans Git ; git diff --check.
- Compilation : `/apparence`, vue entreprise, variante PME, `/mon-profil` et `/parametres/entreprise` répondent 200 ; respectivement 10/10/9/10/10 scripts JavaScript téléchargés et analysés. Serveur de contrôle 3101 avec `.next-appearance` isolé, ensuite arrêté et inclusion TypeScript temporaire retirée. Serveur utilisateur 3100 conservé.
- Réserve : les interactions réelles, les comparaisons visuelles clair/sombre/mobile et l’absence de flash observée dans un navigateur restent à valider ; ces contrôles ne sont pas remplacés par les tests de logique/HTTP. API réelle volontairement non construite : laisser `NEXT_PUBLIC_FEATURE_APPEARANCE_API` éteint. Front fonctionnel en mode démo, état bientôt disponible sinon.
- Personnalisation terminée pour le périmètre front/démo. Attendre le retour utilisateur avant de reprendre **Prêts · Suivi des dettes**.

### 12 novembre 2026 — Étape 3, page 7 : Prêts · Suivi des dettes

- Reprise autorisée après la page Apparence. Périmètre limité à la liste `/loans/suivi-dettes`. La fiche `/loans/suivi-dettes/[employeeId]` n’est pas encore refondue. Aucune autre page ni zone reportée modifiée.
- Présentation : gabarit ListPage, quatre KPI de cumul global, carte de filtres avec labels, puis deux KPI d’activité de la période. Séparation explicite du solde actuel et des mouvements mensuels/annuels. Cartes communes sans bordure, tokens d’apparence, couleurs sémantiques fixes et chiffres tabulaires. Aucun graphique ou calcul supplémentaire ajouté.
- Liste : DataTable partagé avec version desktop et cartes sur mobile. Employé, département, types, accordé/remboursé sur la période et solde restant conservés. Liens vers la même fiche par employé, mêmes chemins contextualisés via bp. Noms partiels protégés pour le rendu. Tous les filtres (nom, période mensuelle/annuelle, mois, année, département, type), leurs valeurs initiales et leurs callbacks sont conservés.
- Logique : availableYears, departments, byEmployee, KPI, états existants et appels API identiques par comparaison AST avec Git précédente. Une dette ancienne reste dans le solde quel que soit le mois ou l’année sélectionné ; seuls les mouvements dépendent de la période. Avances partielles et prêts déjà soldés suivent les mêmes calculs antérieurs. Aucun recalcul métier ajouté ou corrigé.
- États : skeletons à la forme des KPI/filtres/liste, message d’erreur de lecture, état vide utile selon les filtres. Cette page consulte des données et ne fait aucune mutation métier ; pas de faux toast de sauvegarde. Bouton Exporter en Excel réutilisant le chargement et le handler originaux.
- Export protégé : handleExport strictement identique, même endpoint, paramètres, credentials, fichier et gestion d’erreur. Aucun document/renderer ni format Excel modifié ; export toujours explicitement indisponible en démo. Aucun endpoint ni besoin backend ajouté.
- Démo : les deux journaux de remboursement déjà présents dans le domaine prêts sont également fournis dans repaymentLogs de la liste, sans nouvelle valeur ni calcul fictif. Cela donne 50 000 FCFA remboursés en novembre 2026 et 100 000 FCFA sur l’année pour Laure, en cohérence avec 300 000 FCFA accordés et 200 000 FCFA restants. Les demandes en attente restent exclues des dettes accordées par le code existant.
- Fichiers : `app/(dashboard)/loans/suivi-dettes/page.tsx`, `components/loans/debt-tracking.css`, complément de `lib/demo/transport.ts`, `scripts/check-debt-tracking.cjs`, suivi et guide démo. Composants ListPage, Card, Button, Input, Select, DataTable, Skeleton et LoanSpaceKpi réutilisés sans les modifier.
- Vérifications : AST API/états des filtres/calculs/handler export inchangés ; tests de dette ancienne conservée hors période, mouvements mensuels/annuels, recherche, filtres, avances partielles, vide/chargement/erreur et export démo non simulé. TypeScript, directives client (553 fichiers), fondations, Mon espace, Validations et Apparence réussis. `/loans/suivi-dettes` HTTP 200 avec dix scripts JavaScript téléchargés et analysés ; git diff --check.
- Serveur de contrôle sur 3101 avec cache `.next-debt-tracking`, puis arrêté ; serveur utilisateur 3100 conservé et chemin TypeScript temporaire retiré. Réserve : revue visuelle clair/sombre/mobile et interactions clavier réelles toujours à faire dans le navigateur ; les contrôles HTTP ne sont pas présentés comme une validation visuelle.
- Arrêt après cette page. Prochaine page proposée : **fiche de dette d’un employé (`/loans/suivi-dettes/[employeeId]`)**. Attendre le feu vert avant de continuer.

### 12 novembre 2026 — Étape 3, fin du module Prêts et de ses sous-routes

- Périmètre autorisé : les six routes restantes `/loans`, `/loans/dashboard`, `/loans/rapport`, `/loans/releve`, `/loans/releve/[employeeId]` et `/loans/suivi-dettes/[employeeId]`. Les quatre routes précédemment livrées sont conservées : **10 routes Prêts couvertes**, plus les deux délégations PME existantes.
- Présentation : gabarits Liste/Détail/Tableau de bord, boutons du design system, cartes douces, champs et focus sur tokens, tableaux adaptés aux petits écrans, erreurs avec action Réessayer, skeletons, icônes fines, graphiques orange/vert/moutarde, courbes avec dégradés, donuts arrondis et barres en capsules. Mouvement réduit respecté par le cadre et les graphiques. Modale d’édition réutilisant le composant dialog commun pour le clavier, Échap et le retour du focus.
- Les styles sont limités à `LoanModuleFrame`. `LoansDashboard` conserve ses anciennes couleurs en repli et ses anciens réglages hors de ce cadre ; son utilisation portefeuille reste exclue de la refonte. Aucun fichier dédié admin/cabinet/portefeuille ni token legacy modifié dans ce lot.
- Métier conservé : endpoints, hooks, filtres/périodes, états existants, calculs, autorisations DRH/DG/admin, décisions/avis, remboursements, éditions/suppressions et exports. Régression AST contre la version Git précédente pour les six pages et les trois composants de graphiques/pilotage.
- **NE PAS TOUCHER** : renderers, données et handlers des documents/exports inchangés. Le relevé individuel conserve intégralement son contenu imprimable (en-tête, totaux, chronologie) ; seules la coquille et les commandes écran changent. Des zones protégées excluent les documents des styles applicatifs ; les nouveaux conteneurs ne créent pas de mise en page à l’impression.
- Démo : lecture du tableau de bord par période et entreprise, historiques des avances, cohérence avec les employés/prêts existants. Les chiffres restent fictifs et confinés au transport démo ; aucune modification du backend ni des appels réels. Remboursements, éditions/suppressions métier non intégrées et exports officiels restent explicitement indisponibles en démo.
- Fichiers : six pages, `LoanModuleFrame.tsx`, `loan-module.css`, `LoansDashboard.tsx`, `LoansOverview.tsx`, `LoansRequestsPanel.tsx`, `EditDebtModal.tsx`, option d’en-tête des gabarits existants, projection/transport démo, `check-loans-module.cjs`, `check-loans-http.cjs`, documentation.
- Vérifications : tests de conservation métier/documents, états vide/chargement/erreur, quatre onglets de gestion, rôle employé, projection démo et refus d’accès interentreprise. TypeScript, directives client, fondations, préparation/apparence et quatre parcours Prêts précédents vérifiés. Les **12 routes** (10 principales + 2 PME) répondent HTTP 200 ; **44 scripts JavaScript** téléchargés et analysés. Cache `.next-loans-complete` isolé sur 3101 pendant la vérification.
- Réserve : hôte de contrôle du navigateur indisponible, donc aucune validation visuelle clair/sombre/mobile ni comparaison visuelle portefeuille revendiquée. Les cases restent `[~]`. Aucun nouveau backend ni drapeau local requis.
- Prochaine reprise : **Congés, avec toutes ses sous-routes**, après compte rendu de ce lot.

### 12 novembre 2026 — Correction de la modale Prêts et module Congés complet

- Autorisation : corriger d’abord la modale montrée par l’utilisateur, puis passer aux Congés avec leurs sous-routes, conformément au travail par module complet demandé précédemment.

- Remboursement Prêts : hauteur bornée à la fenêtre, défilement interne, dimensions explicites du champ montant, flex réductible et suffixe FCFA conservé dans le champ ; en-tête simplifié et période adaptable sur petit écran. Aucun état, calcul, validation ou callback de remboursement modifié (comparaison AST). Cette correction répond au dépassement visible sur la capture utilisateur, sans prétendre à une revue navigateur inaccessible.

- Congés : les **13 routes** du dossier app/(dashboard)/conges sont livrées : vue d’ensemble, détail [id], analyse, calendrier, diagrammes, gestion, historique, mon-espace, nouveau, planning, programme, provision et soldes. Les **8 variantes PME** existantes continuent de déléguer à ces pages, sans route inventée. Les routes de rapports et de fiche employé hors du dossier Congés restent à leur module respectif ; cabinet et portefeuille restent reportés.

- Réutilisation : gabarits communs Liste/Détail/Tableau de bord et styles de module déjà établis, boutons du design system, champs de hauteur confortable et textes multilignes redimensionnables, tableaux mobiles, skeletons et erreurs lisibles. Hauteur des modales bornée à la fenêtre pour éviter la répétition du problème signalé.

- Mon espace : titre et action Nouvelle demande, onglets partagés En attente / Approuvées / Refusées / Annulées / Toutes, badges communs. Solde expliqué, cycle, prochain départ, ancienneté, reliquats, contact et annulations existantes conservés. Une seule carte héro sur l’accent personnel ; couleurs de statut fixes.

- Nouvelle demande : Quoi → Combien / Quand → Détails → Récapitulatif, mêmes champs et callbacks, récapitulatif permanent et simulation existante conservée. Types autorisés selon le rôle, suggestion du solde, calcul de reprise par API, alertes informatives et motif obligatoire de congé réduit inchangés. Confirmation et toast de succès communs ; redirection automatique de 2,5 s remplacée par Voir ma demande / Faire une autre demande (changement de navigation visuelle explicite). Aucun endpoint, payload ni calcul modifié.

- Graphiques : palette sur tokens dans le cadre refondu, Gantt et légendes lisibles, donut arrondi avec valeur centrale et courbe avec dégradé ; comparaison Recharts sur le même jeu de données. Les composants partagés gardent leur rendu précédent hors du cadre. Les couleurs de repli des graphiques imprimés sont conservées.

- **NE PAS TOUCHER** : formulaires et lettres de congé, planning imprimable, modèles ORCA/STANDARD/MODERN, signatures, données documentaires et handlers d’impression / téléchargement / CSV conservés. Tests AST des sous-arbres documentaires et styles d’impression contre Git. Aucun fichier backend ni document protégé édité.

- Démo : trois congés approuvés de 8 jours en octobre, un congé en attente pour Patrick en novembre ; soldes fictifs cohérents de 26 acquis / 8 pris / 18 restants. Lecture des soldes expliqués, provision, historique, plannings, diagrammes, fiches et vues analytiques. Les calculs réglementaires, reprises de dates, mutations de congés, avis et exports non simulés restent explicitement indisponibles ; aucun moteur RH/paie fictif ajouté. Aucun nouveau besoin API ni drapeau créé.

- Tests : comparaison des 13 pages, de CashPaymentModal et des deux composants de graphiques/analyse pour API, états métier, calculs, droits, validations, actions et documents ; rendu vide/chargement/erreur, quatre statuts, quatre étapes, confirmation et payload réel du formulaire ; fixtures en lecture et isolation des accès. TypeScript, directives client, fondations, apparence, Mon compte et régressions Prêts vérifiés. Chargement des 21 routes Congés (13 principales + 8 PME), de la fiche de remboursement Prêts et de 74 scripts JavaScript contrôlé sur un cache Next isolé (3101), puis serveur arrêté.

- Réserve maintenue : contrôle navigateur indisponible (« browser access host is unavailable ») ; aucune validation visuelle clair/sombre/mobile ni comparaison pixel à pixel des zones phase 2 revendiquée. Les cases restent [~]. Prochaine suite : validation des parcours Prêts/Congés avant les autres modules de demande.

### 13 novembre 2026 — Permissions / autorisations de sortie, module complet

- L’utilisateur autorise la poursuite après les parcours Prêts/Congés. Travail par dossier complet conservé ; les réserves de revue visuelle restent explicites et ne sont pas assimilées à une validation du rendu.
- **8 routes livrées** : gestion, historique, Mon espace, nouvelle demande, rapport, suivi, fiche suivi par employé et validations dans `/presences/permissions`. Aucune variante PME dédiée existante ; aucune route inventée. Les autres modules et les zones reportées ne sont pas refondus dans ce lot.
- Gabarits communs Liste/Détail/Tableau de bord, boutons, champs, skeletons nommés Permissions, focus et tableaux mobiles. Les dates/heures s’empilent sur petit écran ; dimensions des champs et hauteur de modale bornées. Réutilisation de PresenceModuleSwitcher, PermissionsSubNav et RequestModuleNav avec leurs droits et destinations conservés.
- Formulaire : Quoi → Combien / Quand → Détails → Récapitulatif, mêmes choix Urgence/Mission/Autre, sous-types de mission, bénéficiaire, horaires, destination et motif. Validation, payload et création pour autrui inchangés. Aperçu officiel conservé à la dernière étape ; confirmation et toast partagés après succès ; Voir ma demande et Faire une autre demande reprennent les destinations/réinitialisations existantes.
- Mon espace : onglets de statut communs, badges partagés ; filtre avant pagination, remise à la première page et fermeture du détail au changement de filtre. Les KPI et séries continuent de porter sur les mêmes tickets d’origine. Onglets Mes validations / Suivi, déclarations de retour, contact, annulation, aperçu et exports conservés.
- Gestion/validations : mêmes actions et restrictions pour autoriser/refuser, saisir un motif, consulter les événements, déclarer/valider un retour, corriger des heures et supprimer. Aucun changement de lib/permission-return, de PermissionTimeline, ReturnValidationPanel ou EditTimesModal ; le style de leurs conteneurs reste local au cadre applicatif.
- Graphiques : courbes avec dégradés, barres en capsules, donuts arrondis et palette sur tokens dans le cadre refondu. Historique et rapport réutilisent leurs composants partagés ; hors de ce cadre, couleurs de repli et anciens réglages conservés. Calculs, filtres croisés, navigation et export CSV inchangés. Erreur de chargement du rapport affichée dans le cadre refondu.
- **NE PAS TOUCHER** : PermissionTicketPrintable, ticket-print, données des tickets imprimables, aperçus et handlers impression/PDF/CSV inchangés. Comparaison AST des 8 pages et 3 composants de graphique/historique/rapport contre Git pour appels API, états métier, calculs, droits, validations, callbacks et sous-arbres documentaires.
- Démo : une demande personnelle en attente, une mission avec retour déclaré à valider, une sortie avec retour confirmé. Dates/heures et événements cohérents pour les mêmes employés. Création/décision/annulation en mémoire, refus avec motif et accès par entreprise/employé. Retours administratifs, corrections et suppressions non simulés restent explicitement indisponibles ; aucun calcul de paie ni retour automatiquement validé.
- Vérifications : TypeScript et 555 fichiers clients ; tests Permissions (4 étapes, payload personnel/pour autrui, motif trop court, états, filtre avant pagination, droits démo, décisions/annulation/événements), régressions Prêts/Congés, fondations, apparence et Ma journée. Les 8 routes répondent HTTP 200 et leurs **31 scripts JavaScript** sont téléchargés et analysés. Serveur de test isolé sur 3101 avec `.next-permissions-complete`, puis arrêté et inclusion TypeScript temporaire retirée.
- Documentation : inventaire et checklist Permissions marqués `[~]`, guide démo complété. Aucun nouveau besoin backend ni drapeau ajouté. Revue visuelle clair/sombre/mobile toujours à effectuer : l’hôte navigateur demeure indisponible. Prochain module : **Absences, avec ses sous-routes**.


### 13 novembre 2026 — Absences, dossier et sous-routes

- Six routes livrées : gestion, Mon espace, nouvelle demande, historique, rapport et suivi. Gabarits, états, quatre étapes, branches STANDARD/classique/Autre, plafonds et justificatifs conservés. Suivi garde les accès Admin/RH et son périmètre consolidé.
- **NE PAS TOUCHER** : documents STANDARD/MODERN/ORCA, signatures, propriétés et actions impression/PDF/CSV inchangés, contrôlés par comparaison AST. Aucun backend ni zone phase 2 modifié.
- Démo : création et annulation personnelle pour l’exemple fixe du 16 novembre 2026 avec reprise le 17 ; autres calculs et décisions nécessitent le backend. Justificatif sur son service existant ; aucun upload réel pendant les tests.
- TypeScript, directives client et régressions vérifiés ; six routes HTTP 200 et 25 scripts JavaScript contrôlés sur le serveur isolé 3101, ensuite arrêté. Revue visuelle encore à effectuer.

### 13 novembre 2026 — Matériel, Formation, Notifications, Abonnement, Documents et CNSS

- **15 routes** : neuf pages principales (/materiel, /formation, /notifications, /pricing, /success, /documents, /documents/generate, /documents/legal, /cnss-declaration) et six variantes PME existantes. Cabinet, portefeuille et super admin inchangés.
- Matériel : gabarit Liste, cartes, métriques et catégories existantes, champs/boutons communs. Modales natives ajout/modification, attribution et suppression : Échap, clic extérieur et retour du focus ; succès par toasts. Endpoints, payloads, filtres, valeurs et statuts inchangés. Aucun parcours de demande inventé : la page gère un parc.
- Formation : cinq vues existantes conservées, surfaces/titres sur tokens, cartes accessibles au clavier et modales communes. Demande en quatre étapes, dates/durée lues du cours, motif et payload inchangés. Confirmation visible et suivi personnel à partir de la propriété requested déjà reçue. Aucun nouveau calcul.
- Notifications : contrôles tactiles, filtres, états et toasts de lecture. Exclusion des alertes contrat pour l’employé, suppression à la lecture et échelle d’urgence rouge/orange/jaune conservées.
- Pricing/Succès : retrait des halos/dégradés décoratifs, cartes et boutons communs, état de catalogue indisponible. Mensuel/annuel, tarifs serveur, remises, devis, prestataires, polling, verdict d’activation et redirections identiques. Aucun paiement exécuté pendant les tests.
- Documents : statistiques, filtres/tableau mobile et états, bibliothèques génération/juridique avec navigation clavier et modales communes. Contrats de chargement, upload, validation, rejet et suppression conservés ; aperçu isolé des styles applicatifs.
- CNSS : cadre de tableau de bord, synthèse, filtres, historique, tableaux et contrôles adaptés. **NE PAS TOUCHER** : sous-arbre DGC intégralement conservé et isolé, générateur canvas des certificats Formation inchangé, aperçus documentaires, modales de paiement et handlers export/download conservés. Aucun fichier dédié de document, modèle officiel ou backend édité.
- Démo : quatre matériels avec opérations en mémoire et contrôle entreprise/employés ; catalogue et budgets Formation fictifs en lecture, demande personnelle en mémoire. Métadonnées documentaires filtrées par employé. Prix indisponibles et paiements désactivés ; aucun calcul CNSS, sortie officielle ou certificat simulé. Autres mutations Formation, uploads, générations et déclarations nécessitent le backend.
- Tests : TypeScript, directives client (555 fichiers), comparaison AST des neuf pages pour API/hooks, calculs, droits, validations/callbacks ; égalité des composants paiement/aperçu et du sous-arbre DGC ; générateur de certificats inchangé. Rendus SSR des cinq vues Formation, quatre étapes, modales, statuts paiement, listes/vides et accès ; démo CRUD Matériel, demandes Formation, isolation et refus des sorties officielles. Régressions Absences, Permissions, Congés et fondations réussies.
- HTTP : 15 routes HTTP 200 et 53 scripts JavaScript téléchargés/analysés sur le cache isolé .next-services-check, port 3101. Serveur de test arrêté et inclusion TypeScript temporaire retirée ; serveur utilisateur préservé.
- Revue visuelle générale reportée à la fin sur instruction utilisateur. Cases [~] conservées. Reprise de l’ordre du brief : **Employés et sous-routes**, puis présences/pointage, paie hors documents, messagerie et autres modules de l’inventaire.

### 13 novembre 2026 — Gestion des employés et enrichissement des effectifs

- Demande utilisateur : enrichir l’arrivée sur Employés avec le total, les effectifs par contrat et le suivi CNSS, puis poursuivre la création et toutes les sous-routes. Révision des libellés CNSS et ITS/IRPP demandée ; revue visuelle générale toujours reportée à la fin.
- **15 routes livrées** : 8 principales (liste, fiche, modification, primes, congés, choix de création, formulaire guidé, import) et 7 variantes PME existantes, dont /employes/nouveau/import qui délègue à l’import principal. Aucune route inventée et aucune zone phase 2 modifiée.
- En tête de liste : total actif, CDI/CDD/Stage/Intérim/Consultant/Prestataire et éventuels autres types renvoyés par le serveur. Ces cartes respectent les filtres et l’ensemble des pages ; aucun comptage sur les seuls 12 résultats paginés. Absence de données distinguée du zéro. Tableaux, cartes, filtres, graphes et skeletons reprennent les tokens ; actions des cartes visibles au clavier/tactile.
- CNSS : numéros renseignés/manquants, cotisation activée/désactivée et cotisation active sans numéro. ITS/IRPP : retenue activée/désactivée. Un numéro absent ne prouve pas une absence d’immatriculation ; une cotisation active ne prouve pas une déclaration déposée. Lien vers le suivi CNSS existant pour les rôles autorisés. Les agrégats fiscaux ne sont pas retournés au manager et leurs cartes restent masquées pour ce rôle.
- **Extension serveur ciblée autorisée par cette demande d’enrichissement** : GET /employees/summary conserve son endpoint, ses filtres, son périmètre actif/entreprise/département et ses anciennes données. Ajout de registrationSummary calculé côté serveur, en utilisant trois champs supplémentaires dans la requête existante. Aucun schéma/migration, aucune requête de paie ni calcul de cotisations modifié. Fichiers : backend/src/employees/employees.service.ts et registration-summary.ts. Un serveur encore sur l’ancienne version affiche les compteurs CNSS indisponibles plutôt que de faux chiffres.
- Désactivation : rafraîchissement du récapitulatif pour garder les nouveaux KPI synchronisés. Les callbacks et le workflow de désactivation restent identiques ; modales communes avec Échap/clic extérieur et protection pendant une action en cours. Le modèle ORCA et sa période/export restent dans leur composant d’origine, isolé des styles applicatifs.
- Création : parcours de dossier en cinq étapes conservé (ce n’est pas une demande d’absence/prêt). Champs d’identité, famille/fiscalité, contrat, compléments et validation ; pré-remplissage candidat, photo, pièces, validations, payload et appel d’invitation inchangés. Le succès confirme le dossier RH sans affirmer qu’un compte a été activé lorsque l’invitation a échoué. Confettis décoratifs de création retirés.
- Libellés : « Déclaration CNSS en paie » et « Déclaration ITS / IRPP en paie », aides explicites, récapitulatif Activée/Désactivée ; numéro d’immatriculation CNSS séparé. Les champs isSubjectToCnss/isSubjectToIrpp continuent de piloter exactement les mêmes retenues. Aucune valeur de base de données n’est renommée ni interprétée comme un dépôt de déclaration.
- Fiche, modification, primes et congés : mêmes données, onglets, sections, droits, calculs contractuels, quantités et actions. Modale de prime réutilisant le composant commun. Erreur de fiche affichée au lieu d’un chargement sans fin si la lecture échoue. Import : quatre étapes, mapping, confirmation fiscale, validation, exécution et téléchargement de modèle conservés.
- **NE PAS TOUCHER** : FicheEmployePdf et son handler complet, propriétés PDF, WorkforceDashboard, modèle/export Excel ORCA et modèle d’import inchangés. Vérifications AST des huit pages et des composants de champs pour endpoints, handlers, validations, calculs, droits et callbacks ; égalité des sous-arbres PDF/ORCA et du handler PDF.
- Démo : liste paginée et récapitulatif cohérents sur les mêmes employés actifs et filtres, exemples avec numéro CNSS renseigné/manquant et retenue activée/désactivée. Création/désactivation en mémoire, doublons et accès hors entreprise refusés ; les désactivés disparaissent des choix d’employés. Invitation, import réel, calcul de salaire, changement de contrat et de fiscalité nécessitent le backend. Aucun email, upload réel, PDF ou export officiel exécuté.
- Tests : TypeScript front ET backend, 556 fichiers clients, tests serveur des comptes/numéros blancs/filtres/entreprise/manager/rôle employé ; rendu des cinq étapes de création, sept sections d’édition, onglets de fiche, états, listes/tableaux, données manquantes et KPI sur un total supérieur à une page ; isolation démo et création/désactivation. Régressions fondations, Mon compte, Apparence et lot précédent réussies.
- Chargement : 15 routes HTTP 200 et 53 scripts JavaScript téléchargés/analysés sur le port isolé 3101, cache .next-employees-check. Serveur de test arrêté et inclusion TypeScript temporaire retirée ; serveur utilisateur préservé.
- Revue visuelle générale clair/sombre/mobile à effectuer à la fin ; cases [~] maintenues. Prochain dossier selon le brief : **présences / pointage et sous-routes**.

### 13 novembre 2026 — Déclaration administrative CNSS et dashboard effectifs

- L’utilisateur précise que « déclaré à la CNSS » signifie que la CNSS connaît l’employé ; ce n’est ni un numéro renseigné ni une retenue de paie. Cette décision remplace l’interprétation du lot précédent.
- Ajout de **cnssEmployeeDeclared**, booléen nullable distinct : true = déclaré, false = non déclaré/à déclarer, null = à vérifier. Aucune déduction automatique et aucun reclassement des anciens dossiers à partir du numéro, de la paie ou des déclarations mensuelles.
- Stockage réel : champ Prisma + migration additive 20261113100000_employee_cnss_declaration_status ; DTO création/modification validés ; propriété intégrée aux formulaires et au récapitulatif existants. Les endpoints et valeurs de retenues restent inchangés.
- Après vérification que la base configurée était locale (localhost:5432) et que seule cette migration était en attente : migration appliquée avec succès, client Prisma régénéré, présence/type nullable de la colonne vérifiés en lecture. Aucun dossier réel marqué déclaré/non déclaré par le code ; aucune écriture de statut sur des employés réels pendant les tests. Toute autre base nécessitera sa migration normale au déploiement.
- KPI de /employes : **Déclarés à la CNSS · Non déclarés — à déclarer · Statut à vérifier**, calculés côté serveur sur le même périmètre actif et les mêmes filtres. Numéro CNSS et retenues restent indépendants. Les rôles fiscaux/manager conservent leurs restrictions.
- Action rapide sur la fiche employé pour Admin/RH : choisir le statut puis « Enregistrer le statut CNSS », PATCH ciblé du seul champ, contexte entreprise capturé, chargement/erreur/toast. Champ aussi présent dans création et modification ; badge dans liste/cartes et fiche, récapitulatif de création cohérent. Cette saisie ne transmet aucun formulaire à la CNSS.
- Vocabulaire clarifié : les anciens réglages fiscaux s’appellent maintenant « Cotisation CNSS en paie » et « Retenue ITS / IRPP en paie ». Ils ne représentent plus visuellement une déclaration administrative.
- Correction visuelle : l’isolation du dashboard WorkforceDashboard était trop large ; seule la fenêtre d’export reste protégée. À l’écran dans Employés : cartes/ombres et typographie du kit, palette sur tokens, barres arrondies, courbe avec dégradé et animations respectant reduced-motion. Données, période, calculs, props et action d’export inchangés.
- Phase 2 : palettes et typographie d’origine conservées comme repli CSS et branche Recharts legacy inchangée hors cadre refondu. Aucune variable workforce n’est définie globalement ; activation uniquement sous la section dashboard Employés. Aucun écran dédié cabinet/portefeuille/super admin modifié.
- **NE PAS TOUCHER** : génération Excel, modèles ORCA/POWERMAN, WorkforceExportDialog, PDF employé et handlers/propriétés documentaires inchangés. Comparaison AST du dashboard pour API, données, calculs, couleurs de repli, branche courbe legacy et export ; garde-fous PDF/paie des huit pages conservés.
- Démo : un déclaré sans numéro, un non déclaré avec numéro et un statut à vérifier illustrent l’indépendance des données. Sauvegarde rapide du statut en mémoire et compteurs synchronisés à la lecture. Instantané Workforce ORCA consultable pour novembre 2026 avec les mêmes employés actifs ; autres périodes et exports officiels explicitement indisponibles.
- Vérifications : types front/back, validation DTO true/false/null et refus de types invalides, trois états indépendants, sauvegarde ciblée et contrôle entreprise/rôle, agrégats serveur, rendus refonte/legacy ORCA/POWERMAN et invariance des contrats/export. Tests Employés et fondations réussis. Quinze routes HTTP 200 et 53 scripts JavaScript contrôlés sur serveur isolé 3101 (.next-cnss-status-check), puis arrêt et retrait de l’inclusion TypeScript temporaire.
- Documentation REFONTE/PROGRESS/DEMO actualisée. Revue visuelle générale toujours prévue à la fin, sans validation navigateur revendiquée. Ces correctifs précèdent la poursuite vers Présences/Pointage.


### 13 novembre 2026 — Présences / Pointage : intégration du cadre commun

- Neuf écrans principaux et cinq variantes PME existantes : vue d’ensemble, dashboard, pointeuse, saisie manuelle, résumé, shifts, synchronisation, tablettes et écrans QR. Cadre Liste / Détail / Dashboard partagé, champs, surfaces, actions de marque, focus et adaptations mobiles. Le décor de cercles animés de la pointeuse est retiré à l’écran ; mécanismes GPS / QR et actions inchangés.
- Dashboard partagé : palette sur tokens uniquement sous le cadre Présences, couleurs historiques exactes en repli ailleurs, barres capsules, donut arrondi, courbes avec dégradés et reduced-motion. Branche courbe legacy conservée. Aucun fichier cabinet / portefeuille / super admin modifié.
- **NE PAS TOUCHER** : rapports journaliers / hebdomadaires explicitement isolés, sous-arbres et handlers inchangés ; fenêtre et paramètres d’export du dashboard préservés. Comparaison automatique du corps intégral des neuf pages avec Git, des deux vues documentaires et des données / appels / calculs du dashboard.
- Vérifications : TypeScript, 558 fichiers clients, fondations et garde-fous Présences. Les 14 routes répondent HTTP 200 ; leurs 50 scripts JavaScript sont téléchargés et analysés sur le serveur isolé 3101 (.next-attendance-check). Serveur de contrôle arrêté et inclusion TypeScript temporaire retirée.
- **Dossier encore en cours** : harmonisation détaillée des graphiques du résumé, états et modales spécifiques, jeux de démonstration du module et écrans publics /kiosk et /ecran à traiter avant de passer à la Paie. Aucune nouvelle fixture ni action de pointage simulée dans ce lot. Les cases [~] signifient intégration en cours, pas validation du module. Revue visuelle générale clair / sombre / mobile reportée à la fin à la demande utilisateur.

### 13 novembre 2026 — Présences / Pointage : finitions et démo

- Résumé : graphiques, états de chargement/erreur/vide et modales harmonisés sans changer les données de calcul. Rapports imprimables et exports officiels laissés intacts.
- Démo : instantané cohérent des 12–13 novembre, rôles Admin/Employé isolés, consultation des shifts et appareils ; opérations de pointage, scans, écritures, paiements et exports non simulés.
- `/ecran` et `/kiosk` offrent six scénarios tablette (QR, configuration, appairage, succès, refus, veille), sans caméra, NFC ni écriture réelle.
- Jumelage par code conservé à la demande utilisateur ; tests du service backend (usage unique, expiration, codes invalides), de l’assistant d’installation et de son contrat UI ajoutés. Le code est à usage unique et l’agent ne reçoit sa clé qu’après jumelage.
- Contrôles réussis : TypeScript front/back, directives client (561 fichiers), fondations, démonstration Présences et comparaison des contrats/documents ; 16 routes de Présences/PME/écrans et 56 scripts JavaScript contrôlés ; tests ciblés du jumelage backend et `npm test` de `konza-sync-agent`.
- La suite backend complète conserve 14 échecs préexistants dans `PayrollsService` (calculs ITS/CNSS/heures supplémentaires) ; les 19 autres suites passent. Aucun fichier de paie n’a été modifié.
- Les tests de parcours et de chargement passent. Revue visuelle générale clair/sombre/mobile maintenue pour la passe finale ; Paie non commencée.
- Retour utilisateur : `/presences/synchronisation` ne reprenait pas le cadre commun. Correction : enveloppe `AttendanceModuleFrame` de type liste, vérifiée dans le navigateur sur le port 3100 (cadre, styles partagés et notice démo présents). Aucun déploiement effectué ; l’utilisateur a demandé de ne pas déployer pour le moment.
- Audit demandé : les 23 pages du dossier Présences utilisent le cadre `AttendanceModuleFrame` ou `ModulePageFrame` ; les cinq variantes PME réexportent les pages harmonisées, et `/ecran` / `/kiosk` ont leur cadre d’affichage dédié. Les 30 routes Présences, PME et écrans ont répondu HTTP 200, avec leurs scripts contrôlés (56+25+31), ainsi que les tests démo, fondations, droits et contrats.
- Le contrôle navigateur a révélé des boutons HTML imbriqués dans les cartes de `/presences/permissions/validations`, avec avertissement d’hydratation. Correction avec les primitives partagées `Card` et `Button` ; confirmation en grille et en liste : zéro bouton imbriqué, ouverture du détail fonctionnelle, aucun nouvel avertissement. Vérification visuelle exhaustive clair/sombre/mobile toujours à faire lors de la revue finale ; aucun déploiement.
- Rappel utilisateur : `/design-system` et ses composants, tokens et gabarits sont la référence pour éviter les styles et comportements isolés. Brief `REFONTE.md` relu intégralement ; maintenir les variantes et sous-pages dans cette langue d’interface.
- Synchronisation : les onglets « À corriger », « Associations » et « Historique » ont été remplacés par les boutons `Button` partagés (variantes secondaire/inactive) et le badge d’état `Badge`. Test navigateur : chaque onglet devient sélectionné, hauteur 44 px, rayon tokenisé 14 px. Contrat API inchangé ; aucun déploiement.

### 13 novembre 2026 — Messagerie

- `/messages` harmonisée avec le design system : panneau, actions, recherche, rôles, avatars, bulles, saisie et états vides utilisent les tokens et primitives ; animations du squelette respectent `prefers-reduced-motion`.
- Les échecs de chargement des conversations et contacts ne sont plus présentés comme une liste vide ; état explicite et commande « Réessayer ». Endpoints, polling, droits, confidentialité et envoi restent inchangés.
- TypeScript et directives client réussis ; navigateur contrôlé en thème sombre et à 390 px, sans débordement horizontal. Les réponses démo pour `/chat/conversations` et `/chat/contacts` manquent ; la liste réelle reste à vérifier avec le backend ou des fixtures disponibles. Validation visuelle utilisateur en attente ; aucun déploiement.

### 13 novembre 2026 — Rapports : vue d'ensemble

- `/rapports` reprend le gabarit Dashboard et les primitives Card, Button, Select, Badge et EmptyState ; filtres nommés, indicateurs, tableaux et graphiques harmonisés avec les tokens.
- Le tableau des heures supplémentaires et le panneau partagé d'évolution pluriannuelle sont adaptés au mobile ; les graphiques respectent `prefers-reduced-motion`. Appels API, filtres, valeurs et calculs existants restent inchangés.
- Aucun document imprimable ni export officiel modifié. Les données de démonstration Rapports manquent : la page montre actuellement des valeurs à zéro et des états vides, à revoir avec des données disponibles.
- Vérifications : TypeScript, directives client et `git diff --check` réussis ; navigateur en thème sombre à 390 px et 1440 px, sans débordement horizontal. Page livrée en attente de validation utilisateur ; aucun déploiement.


## Décisions archivées (source de vérité du cadrage = REFONTE.md §14)



- 13 novembre 2026 : enrichissement Employés demandé par l’utilisateur. Ajout ciblé des agrégats administratifs CNSS/ITS côté serveur dans le récapitulatif existant, sans migration ni modification des retenues. Les libellés de paie ne constituent pas une preuve d’immatriculation ou de dépôt de déclaration ; les flags métier restent inchangés.

- 13 novembre 2026 : l’utilisateur reporte la revue visuelle générale clair/sombre/mobile à la fin et autorise la poursuite des dossiers selon REFONTE.md, notamment Matériel, Formation, Notifications, Pricing/Succès, Documents et Déclaration CNSS. Les cases restent [~] jusqu’à cette revue.

### 12 novembre 2026 — Avancer par module complet

- L’utilisateur autorise explicitement la fin du dossier Prêts avec toutes ses sous-routes, sans nouvel arrêt entre chaque page. Cette instruction remplace pour ce lot la pause systématique après chaque route.
- Garder les sous-routes et variantes existantes ; ne pas inventer de routes manquantes. Livrer le module puis faire le compte rendu avant de commencer Congés.
- La validation visuelle reste distincte des vérifications de compilation et de chargement ; conserver `[~]` tant que cette revue n’est pas faite.

### 12 novembre 2026 — Cadrage validé (§14)

Les 12 décisions suivantes sont reprises du brief maître :
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

### Vérification des layouts avant modification des tokens

- Admin utilise son propre LayoutWrapper et sa propre navigation, hors du groupe dashboard.
- Le layout dashboard exclut explicitement les chemins cabinet et portefeuille du DashboardShell commun.
- Portefeuille rend PortfolioSidebar et PortfolioTopNav ; cabinet fournit CabinetSidebar dans ses pages et une navigation dédiée dans son layout entreprise.
- Classe theme-legacy ajoutée aux trois conteneurs racines ; les 11 tokens historiques clair/sombre ont été copiés avant modification dans docs/refonte/legacy-tokens.css et dans globals.css. Inter est conservée dans ces zones pour préserver aussi la typographie.
- Aucun écran existant ni document protégé modifié. Les composants historiques ne sont pas remplacés ; nouvelle bibliothèque opt-in dans components/design-system/.

### 14 novembre 2026 — Cadre commun posé sur 42 pages (Claude, sans navigateur)

- Pages : Rapports (analyse-conges, analyse-paie, complet, comptabilite, departements, effectifs, indicateurs, its-bnc, mouvements-effectifs, observatoire-conges), Paramètres (hub, circuits, departements, entreprise, paie, primes, securite, subscription, taxes, users), Contrats (liste, rupture/pse), Performance (11 routes sauf fiche), Avis, Audit, Finances, Primes/attribuer, Demandes, Onboarding, Ma signature, RH-blog (3). 18 variantes `/pme/…` héritent par réexport.
- Méthode : composant d'origine conservé tel quel ; export par défaut enveloppé dans `ModulePageFrame` (import + 10 lignes). Aucune requête, permission, calcul ou fichier de document touché. Fins de ligne conservées.
- Non traitées volontairement : pages avec impression/documents (DAS, journal de paie, récapitulatifs, fiche performance, bulletin, ma paie, contrats générés), `/offline`, `/forbidden`, pages publiques, phase 2.
- Vérifié : syntaxe TypeScript des 42 fichiers, un seul export par défaut, aucune prop de route perdue. Non vérifié : compilation complète du projet, rendu visuel.

### 14 novembre 2026 (lot 2) — Cadre commun sur les pages à impression (Claude, sans navigateur)

- Pages : `/rapports/das-declaration`, `/rapports/journal-paie`, `/rapports/recap-bulletins-annuel`, `/rapports/recap-personnel`, `/performance/fiche/[id]`, `/ma-paie`, `/contrats/generer`, `/contrats/employe/[employeeId]`, `/contrats/rupture`.
- Pourquoi c'est sans risque pour les documents : les remaps de couleur du cadre sont limités à `@media screen` et une règle `@media print` neutralise sa mise en page ; le journal s'imprime dans une iframe isolée (`report-print`) ; les contrats .docx sont générés par le back. Dans Ma paie, la modale du bulletin porte explicitement `loan-document-protected`.
- `/parametres/bulletin` volontairement laissée de côté (éditeur à hauteur fixe).
- Vérifié : syntaxe TypeScript, un seul export par défaut, fins de ligne conservées. Non vérifié : compilation du projet, rendu, impression réelle.

### 14 novembre 2026 (lot 3) — Fin des pages privées (Claude, sans navigateur)

- `/parametres/bulletin` : emojis remplacés par des icônes Lucide en trait fin, couleurs en dur (#ecfdf5, #10B981, #EF4444, #92400e/#fef3c7) remplacées par les tokens, police héritée. Enregistrement, aperçu et rendu des bulletins inchangés ; pas de cadre (éditeur à hauteur fixe).
- `ErrorLayout` redessiné sur les tokens (props conservées, `gradient` ignoré) : touche aussi `error.tsx`, `not-found` et les pages publiques qui l'utilisent. `/offline` : faux compteur « 3 modifications » retiré. `AccessDenied` : liens en tokens.
- Cadre commun posé sur 5 pages PME autonomes (bulletins, paie, paramètres, abonnement, comptabilité).
- Vérifié : syntaxe, fins de ligne. Non vérifié : compilation, rendu.

### 14 novembre 2026 (lot 4) — Sidebar et topbar (Claude, sans navigateur)

- **Recherche** (`ShellSearch`) : palette Ctrl/⌘ + K. Sources : liens du menu (déjà filtrés par droits) + index des sous-pages `lib/shell/page-index.ts`, proposées seulement si le module est dans le menu et si `canAccessPath` l'autorise ; désactivée pour les contextes `/pme`, `/cabinet`, `/portefeuille`, `/admin` (menu seul). Insensible aux accents, récents (5), navigation clavier, bouton icône sur mobile (avant : recherche cachée sous 768 px).
- **Apparence** (`ThemeControl` compact) : bouton + menu Clair / Sombre / Auto avec description (avant : liste déroulante). La page Mon compte garde la liste.
- **Topbar** : rendu en tokens via classes `shell-*` (plus de dépendance aux classes slate/orange/red remappées) ; fil d'Ariane « Accueil › Module › Page » depuis l'index (avant : premier segment de l'URL mis en majuscule, ex. « Conges »). Logique de notifications, profil et déconnexion inchangée.
- **Sidebar** : couleurs d'alerte, pastille « En ligne » (plus de lueur ni de pulsation) et déconnexion aux tokens. Repli, droits, alertes et logique inchangés.
- Vérifié : syntaxe, types stricts des nouveaux fichiers (modules externes simulés). Non vérifié : compilation du projet, rendu.
- Question en suspens : « l'assistant » demandé après la sidebar et la topbar n'existe pas dans le code ; à préciser (messagerie, assistant de démarrage, ou nouvel assistant IA).

### 14 novembre 2026 (lot 5) — Logo d'entreprise, sous-menus unifiés, composants ui et sélecteurs (Claude, sans navigateur)

- **Logo** : nouveau hook `hooks/useCompanyLogo.ts` (GET `/companies/mine`, cache local par entreprise, revalidation, événement `konza:company-updated`). La sidebar affiche le logo de l'entreprise s'il existe, sinon le logo Konza (pastille blanche en mode sombre ; version repliée incluse). Hors white-label seulement. La page Paramètres → Entreprise rafraîchit le menu après envoi ou suppression du logo.
- **ModuleNav** (`components/requests/ModuleNav.tsx` + css) : une seule barre pour tous les sous-menus ; onglets mesurés, excédent dans « Plus » (groupes titrés), onglet actif toujours visible, bouton principal à droite (lien « /nouveau » ou « Nouvelle… »), séparateurs de groupes. Appliqué via `RequestModuleNav` (Congés, Présences, Absences, Permissions, Prêts), `RapportsSubNav` et `PerformanceNav` (avec leur texte d'aide). Sélecteur de module Présences/Absences/Permissions = groupe segmenté. Ancien rendu conservé pour admin, cabinet, portefeuille.
- **Sélecteurs** (`components/ui/select.css`) : famille commune pour `FancySelect`, `SearchSelect`, `PeriodSelector` (groupe segmenté) et base `select` natif hors pages encadrées (poids nul, exclut documents et phase 2). Clavier et attributs ARIA ajoutés ; le menu de `FancySelect` s'ouvre vers le haut si besoin.
- **Composants ui** : `StatCard`, `useToast` (rendu `.k-toast`, API inchangée, erreurs 7 s), `PlaceholderPage`, `ProfileAvatar`, `KonzaLoader` (sans halo), `basic` (non utilisé). `AlertBadge` et `KonzaMark` volontairement inchangés (portefeuille, identité du logo).
- Vérifié : syntaxe, types stricts (modules externes simulés), logique de sélection des onglets sur largeurs d'exemple. Non vérifié : compilation du projet, rendu.

### 14 novembre 2026 (lot 6) — Espace Portefeuille (Claude, sans navigateur)

- **Layout** : coquille commune (`konza-shell`, lien d'évitement, `shell.css`, `select.css`), `theme-legacy` retiré.
- **PortfolioSidebar** : classe `shell-sidebar` (donc mêmes survols, état actif et repli que le dashboard), `aria-current`, pastille « Portefeuille » et déconnexion aux tokens. **PortfolioTopNav** réécrite comme TopNav : fil d'Ariane, recherche Ctrl/⌘ + K sur le menu du portefeuille, Apparence, notifications, profil ; l'avatar externe (ui-avatars) est supprimé au profit des initiales ; notifications téléphone conservées.
- **AlertBadge** : tokens, sans pulsation ni halo (touche aussi la sidebar cabinet).
- **Pages** : cadre commun sur 14 pages (absences, avis, congés, tableau de bord, demandes, effectifs, employés, équipe, mes entreprises, paie, liste de paie, présences, prêts, rapports) ; 3 pages déléguées (présences-absences, prêts-avances, messages) laissées telles quelles car leurs composants sont déjà au nouveau rendu ou en pleine hauteur.
- Vérifié : syntaxe, types stricts (modules externes simulés). Non vérifié : compilation, rendu.

### 14 novembre 2026 — Brief du back rédigé (Claude)

- Nouveau fichier `docs/refonte/BACKEND.md` pour le dépôt du back : 5 lots (apparence, tâches, événements du jour + annonces, anniversaires/ancienneté, aperçu de la journée), calqués sur les contrats du front (`types/contracts/*`) et les règles des adaptateurs de démonstration, avec les conventions réelles du back (modules, `resolveVerifiedCompanyId`, `NotificationsService`, `PUSH_TYPES`, `CronLockService`, modèle `holidays-cron`).
- Décisions à valider au premier feu vert : tâches assignées dupliquées par destinataire (`groupId`), règle de visibilité des messages d'ancienneté plus stricte que la démonstration, annonces visibles 7 jours, exclusion éventuelle des prestataires, emplacement du réglage « afficher mon anniversaire ».
- Le schéma Prisma n'était pas dans l'archive du back : les modèles proposés sont des ajouts à adapter aux conventions réelles (type des identifiants, relations).

### 15 novembre 2026 — Passage de relais et revue générale (Claude)

- Nouveaux fichiers : `docs/refonte/REVUE.md` (feuille de route de reprise : état par intervenant, trois niveaux de finition, 6 passes de revue, suite, back, règles d'économie, messages de lancement), `docs/refonte/AUDIT.md` (mesures générées) et `scripts/audit-refonte.mjs` (script réutilisable, lecture seule, `--write` pour régénérer l'audit).
- Mesure de départ sur l'état fusionné (archive du 13 nov. + lots 1 à 6) : 573 fichiers analysés ; dashboard 10 296 classes de palette, pages publiques 2 438, composants/lib 4 072 ; 467 emojis, 252 dégradés, 73 pulse/ping, 209 flous/verre. Reconstitution de l'état fusionné vérifiée par un script indépendant (mêmes totaux).
- Aucune transformation automatique n'a été appliquée à ces milliers d'occurrences : le sens d'une couleur (marque ou statut) et le rendu demandent une vérification visuelle.

### 15 novembre 2026 — Spécification de l'assistant (Claude)

- Nouveau fichier `docs/refonte/ASSISTANT.md` : deux assistants dans un panneau (Guide pas à pas déterministe avec curseur animé sur l'interface réelle, et Assistant IA en lecture seule), règles non négociables (le modèle n'accède jamais à la base ; outils sans paramètre d'entreprise ; aucun chiffre ne vient du modèle, contrôle des nombres côté serveur ; refus plutôt qu'erreur), catalogue d'outils, droits par rôle, interface, contrat front/back, fournisseur interchangeable par variables d'environnement, quotas, confidentialité, tests obligatoires, 5 phases et 6 décisions à valider.
- Une démonstration interactive du guide a été montrée à l'utilisateur dans la conversation (non livrée en fichier).

### 16 novembre 2026 — Décisions sur l'assistant (Claude)

- Décisions de l'utilisateur intégrées à `ASSISTANT.md` (§11) : modèles externes au départ, analyses réservées à ADMIN et HR_MANAGER, lecture seule, limite de réponses selon le forfait (guides illimités), support WhatsApp en premier, français.
- Nouveau §8 : trois niveaux de confidentialité. **Niveau 1 par défaut** : le modèle externe ne reçoit que le texte de la question (noms masqués) et choisit un outil ; calculs et rédaction restent sur le serveur de Konza. Niveau 2 (agrégats pseudonymisés, optionnel), niveau 3 (modèle local, plus tard). Variable `ASSISTANT_DATA_LEVEL`. Nouveau test de sortie réseau (§9, point 8).

### 16 novembre 2026 (suite) — Quotas et envoi des données (Claude)

- `ASSISTANT.md` §7 : quotas proposés sur les forfaits réels (essai 20, FREE 3, BASIC 30, PRO 150, ENTERPRISE illimité avec plafond d'usage raisonnable), unité = analyse, guides et aide illimités, compteur visible, pas de coupure en cours de conversation. Cabinets : analyse IA désactivée en v1, à trancher plus tard.
- §8 niveau 2 : tableau « on envoie / on n'envoie jamais » ; idée de l'utilisateur (envoyer noms et montants sans identifiants ni nom d'entreprise) retenue en la renforçant : noms remplacés par des pseudonymes, seuil de taille de groupe, dates exactes et intitulés identifiants exclus.

### 16 novembre 2026 (retour de GPT) — Directives de reprise mises à jour (Claude)

- `REVUE.md` révisé selon les priorités de l'utilisateur : refonte complète de l'espace entreprise et du Portefeuille d'abord ; cabinet et super admin en attente ; back puis assistant ensuite. Ajouts : isolation du travail de Copilot et de Claude par `git diff` depuis le dernier commit de GPT (Mission 1), passe 7 « Ma journée vivante » (cartes anniversaire, bienvenue, ancienneté, tâches, annonces), grille de conformité en 10 points, messages de lancement front et back mis à jour.

### 17 novembre 2026 ? Mission 1 : reprise et mesure de depart

- Base fa79326, aucun commit de refonte separable : perimetre mixte de 382 sources consigne dans CONTROLE-MISSION-1.md ; six lots retrouves.
- /ma-paie restauree octet pour octet depuis Git ; cible TypeScript ES2017. Controle complet sans incremental reussi.
- 21 scripts reussis, 1 reserve Formation (sessions/modeles de certificats preexistants) ; test et documents laisses intacts. Sept controles HTTP non lances.
- Audit avant/apres : palette 17827/17852, hex 1768/1783, emojis 465/467, degrades 252/252 ; hausse due au fichier restaure.
- Commande audit:refonte ajoutee. Aucun changement API/backend/cabinet/super admin ; aucun navigateur ni serveur lance.
- Suite apres feu vert : passe 1 Employes, puis poursuite par modules ; aucune page validee visuellement.

### 17 novembre 2026 — Passe 1, module Employés

- Quatre fichiers : fiche, choix de création, primes et ImageUploader ; zéro emoji d’interface dans les sources du module, PDF exclu. Les résidus lexicaux de l’audit dans la fiche sont des commentaires.
- Icônes Lucide 16/20 px et trait 1,5 ; 21 conteneurs décoratifs retirés, badge d’upload épuré. Texte de statut, seuils de contrat, calculs et droits conservés.
- Audit global avant/après : emojis 467/448, palette 17852/17815, pulse/ping 73/72 ; hex 1783 et dégradés 252 inchangés. Pas de passe de recoloration générale dans ce lot.
- PDF employé, handler de téléchargement et composants documentaires inchangés ; tests Employés et contrôle TypeScript du lot. Aucun changement backend, API, cabinet ou super admin.
- Modifications de cette passe isolées dans le commit ; travaux antérieurs des autres intervenants laissés hors index. Inventaire et suivi actualisés, cases [~] conservées.
- Revue visuelle par l’utilisateur à la fin ; prochain lot après feu vert : passe 1 Performance / CreateReviewModal. Réserve Formation de Mission 1 inchangée.

### 17 novembre 2026 — Passe 2 Employés, lot fiche

- L’utilisateur demande de poursuivre Employés avant les autres modules. Fiche et styles locaux : 333 classes de palette → 0, variantes sombres/dynamiques de palette remplacées ; avatar local au lieu du remplacement externe vert figé.
- Marque pour actions/onglets, couleurs fixes de statut, informations neutres ; cartes et encarts sans bordure. Aucun global ni composant cabinet/super admin modifié.
- Contraste contrôlé sur 242 combinaisons : thèmes par défaut et palettes/ambiances proposées, minimum 4,50:1 pour les couples de texte testés. Correction locale du texte d’action clair initialement insuffisant.
- Types et tests Employés : API, droits, états, callbacks, calculs et PDF conservés. Seules les feuilles CSS de trois déclarations visuelles sont normalisées dans le garde-fou ; des mutations de seuil/libellé restent détectées.
- Handler PDF strictement identique avant/après ; aucun document, calcul backend, contrat API ou donnée de paie modifié. Revue visuelle utilisateur toujours en attente.
- Audit global : palette 17815/17482 ; emojis 448, hex 1783, dégradés 252 inchangés. Suite après feu vert : autres pages/composants Employés en passe 2, puis passes 3 à 7 ; aucune validation [x] ajoutée.

### 17 novembre 2026 — Fiche employé : refonte de l’organisation après retour utilisateur

- Le rendu couleurs/icônes est refusé sur captures : priorité à l’UX réelle (REFONTE §14.15). Grand bandeau et badge décoratif retirés ; identité compacte, actions Modifier/PDF nommées, primes/désactivation rangées et dédoublonnées (2 → 1 chacune).
- Synthèse matricule/contrat/embauche/ancienneté, six rubriques dépliables et résumé latéral Contact/Rémunération/CNSS/Accès. Le formulaire CNSS quitte le haut de page ; un bouton ouvre la bonne rubrique. Le brouillon reste monté entre les onglets.
- Documents, paie, congés et matériel réorganisés ; états vides/chargement/erreur contextualisés, onglets utilisables aux flèches/Début/Fin, menu fermé par Échap/clic extérieur, réduction des mouvements respectée.
- 58 champs, droits, callbacks, endpoints, calculs, trois dépendances d’effets et handler PDF conservés. Types et régressions Employés/contrastes passent ; composant CNSS métier inchangé. Aucun navigateur, backend ou document modifié.
- Audit global inchangé (palette 17482, emojis 448) : ces compteurs ne mesurent pas cette réorganisation. Fiche conservée dans son état courant avec ses intégrations antérieures ; preuves avant/après dans controle-dossier-employe/mesures.json.
- Nouveau rendu à valider par l’utilisateur avant déclinaison ; aucune case [x] ajoutée, cabinet et super admin exclus.


### 17 novembre 2026 — Employés : corrections et parcours de création
- Retour utilisateur : fiscalité neutre et brut/net visibles ; poursuivre annuaire et création au-delà des couleurs.
- Fiche : brut/net masqués ou affichés, chargement et indisponibilité explicites. Démo : montants figés existants réutilisés sans calcul local ; prévisualisation de prime réservée au back.
- Annuaire : KPI regroupés, dossiers horizontaux, avatars locaux, actions visibles, analyses repliées et tableau mobile étiqueté ; export ORCA inchangé.
- Création : choix de méthode asymétrique, progression latérale/mobile, photo à côté de l’identité ; confirmation dessinée en 650 ms et double-clic bloqué.
- API, effets complets de données, contraintes des champs et PDF/ORCA comparés au début du lot : identiques ; droits et calculs couverts par les contrôles Employés.
- Audit : palette 17 482 → 17 204 ; hex 1 783 → 1 780 ; dégradés 252 → 251 ; pulse/ping 72 → 69 ; flou/verre 209 → 202.
- Types et tests Employés réussis ; contraste contrôlé sur 242 combinaisons (minimum 4,50:1). Pas de navigateur lancé ; revue visuelle en attente. Import, Modification et Primes restent à reprendre.


### 17 novembre 2026 — Ajustements après captures Employés
- Liste/tableau par défaut ; grille quatre cartes sur grand écran, deux sur tablette, une sur mobile.
- Aperçu des effectifs et tableau de bord ORCA visibles sans repli, mêmes données et droits.
- Fiche : rubriques sur toute la largeur puis résumé réparti en blocs, sans longue colonne latérale qui laisse le bas vide.
- Tokens, champs, API et documents conservés ; contrôles Employés et contraste réussis (242 combinaisons, minimum 4,50:1).
- TypeScript sans cache réussi ; audit inchangé (17 204 classes de palette, 1 780 hex, 251 dégradés).
- Validation visuelle finale à effectuer par l’utilisateur.

### 17 novembre 2026 — Lisibilité et stabilité au survol
- Captures utilisateur : tableau trop comprimé et blocs de synthèse de la fiche déséquilibrés ; grille quatre cartes conservée.
- Tableau avec largeur minimale, colonnes et textes lisibles ; défilement horizontal si nécessaire, adaptation mobile conservée.
- Salaire révélé par bouton accessible, jamais au survol ; espace réservé pour éviter tout changement de largeur. Le clic ne déclenche pas l’ouverture du dossier.
- Fiche : un seul panneau de synthèse à deux colonnes, sans mosaïque de cartes flottantes ; empilement sur mobile et survols sans déplacement.
- Contrôles Employés, visibilité du salaire, contrastes et TypeScript sans cache réussis ; API, droits et documents conservés. Audit inchangé.
- Validation visuelle finale à effectuer par l’utilisateur.

### 17 novembre 2026 — Survol du salaire
- Demande utilisateur : seul l’œil des détails reste ; salaire visible au survol de sa cellule, curseur d’aide « ? », également accessible au focus clavier.
- Largeur réservée conservée, masquage en sortie, aucune navigation au clic sur le salaire. Tests dédiés réussis.


### 17 novembre 2026 — Création et import, parcours en haut
- Demande utilisateur : étapes en haut, disposition plus accueillante, animations encourageantes puis import dans ce même lot.
- Création : progression horizontale, formulaire élargi et photo à droite ; confirmation dessinée, petites particules à chaque étape et célébration de la création réussie. Réduction des mouvements respectée.
- Choix de méthode : deux aperçus illustrés dans les tokens, actions alignées, entrée discrète ; retour au haut de la zone de défilement pour éviter le titre coupé.
- Import : fichier et modèle côte à côte, progression quatre étapes, FancySelect pour les correspondances, résultats/erreurs visibles ; célébration seulement après import réussi et non vide.
- API, payloads, fonctions fiscales et téléchargement du modèle comparés au début du lot : identiques (hors messages UI). Pas de simulation de calcul ni d’import côté démo.
- Tests Employés (cinq étapes, quatre états import dont échec/partiel et catalogue fiscal), styles en tokens et contrastes réussis. Audit palette 17 204 → 17 117 ; hex 1 780 → 1 775. TypeScript sans cache réussi.
- Revue visuelle clair/sombre/mobile à effectuer par l’utilisateur ; aucune page marquée validée. Suite : Modification et Primes.


### 17 novembre 2026 — Fin du dossier Employés : modification, primes, congés
- Autorisation utilisateur : finir toutes les sous-routes Employés sans pause intermédiaire. Les huit routes sont livrées, toutes restent [~] en attente de revue visuelle.
- Modification : sept rubriques horizontales au clavier, en-tête contextualisé et sauvegarde unique ; photo, champs, sélecteurs et accès temporaire remis en forme ; erreur de chargement explicite.
- Primes : attributions/quantités prioritaires, groupes fiscaux et automatiques conservés, ancienneté ensuite ; modale avec saisie et aperçu salarial séparés, sélecteurs communs, quantités et notes nommées.
- Congés employé : solde regroupé, filtre année, historique lisible et état vide ; statuts dans les tokens fixes. Variantes PME : réexports inchangés. Cabinet/super admin exclus.
- Preuves AST avant/après : API, effets, handlers, contraintes des champs et props du récap salarial identiques ; aucun document ou modèle/export modifié.
- Tests : huit routes, sept rubriques, trois fréquences de prime, ancienneté personnalisée/exclue, quantités, absence de suppression des automatiques, filtre congés et palette. Audit 17 117 → 16 747 classes ; hex 1 775 inchangé. TypeScript sans cache réussi.
- Aucun navigateur lancé ; validation clair/sombre/mobile par l’utilisateur avant clôture visuelle. Pas de route Employés restante à commencer.


### 17 novembre 2026 — Correction de la modale de prime sans catalogue
- Capture utilisateur : grande modale vide, aperçu inutile et attribution désactivée ; état mal traité lors de la livraison précédente.
- Avant sélection : fenêtre compacte, aperçu masqué. Catalogue vide : message utile et action vers le catalogue. Lecture échouée : message distinct et rechargement, sans présenter une panne comme un catalogue vide.
- Démo : lectures du catalogue et des attributions désormais couvertes (quatre modèles de présentation et aucune attribution). Écritures et calculs non simulés ; API réelles inchangées.
- Tests : branches vide/échec/pleine, droits entreprise/rôle et refus des mutations démo ; suite Employés et contrastes réussis. Audit inchangé (16 747 classes, 1 775 hex). Contrôle TypeScript complet réussi ; états UI vérifiés par SSR.
- Aucun navigateur lancé ; revue du rendu à effectuer par l’utilisateur.


### 17 novembre 2026 — Sélecteur dans les modales natives
- Capture utilisateur : le menu de primes apparaissait derrière la modale, dans le fond de page. Cause : portail envoyé au body, hors de la couche supérieure du dialog natif.
- FancySelect conserve son API et son aspect ; le portail rejoint le dialog propriétaire, ou reste au body hors modale. Les placements suivent les changements de taille/fin d’animation.
- Le défilement actif ne déplace que la liste, plus le dialog/la page. Échap ferme la liste avant la modale. Ouverture sous le champ privilégiée en modale lorsque trois options tiennent.
- Tests sans navigateur, géométrie DOM contrôlée : hôte modal/body, position, resize, défilement local, choix clavier, Échap, nettoyage et SSR ; suite Employés et TypeScript sans cache réussis.
- Aucune modification API, données, documents ou mise en page des pages. Rendu final à vérifier par l’utilisateur.


### 18 novembre 2026 — Présences : revue des 23 routes et sous-routes
- Pointeuses et saisie manuelle réorganisées ; navigation, planning, filtres, tableaux, KPI et dialogues harmonisés.
- Absences (6) et Permissions (8), vues internes et composants délégués contrôlés ; parcours et récapitulatifs conservés.
- Palette du périmètre : 1616 → 0 ; hex 76 → 14 ; emojis 54 → 12 ; dégradés 8 → 0.
- Audit global : 16 747 → 15 131 classes ; 1 775 → 1 713 hex ; 448 → 406 emojis ; 251 → 243 dégradés.
- Empreintes avant/après sur 40 sources : API, effets, états, variables, conditions, contraintes et documents identiques (styles/textes d’icônes neutralisés). Valeurs de couleurs persistées des shifts inchangées.
- Tests Présences/démo, Absences, Permissions, sélecteurs et TypeScript sans cache réussis. Aucun back ni document modifié.
- Revue visuelle clair/sombre/mobile et impression production en attente ; 23 cases [~], pause avant le dossier suivant.

### 18 novembre 2026 — Menu « Plus » contenu dans la zone visible
- Correction partagée ModuleNav : portail, limites colonne/écran, hauteur défilante, ouverture vers le haut ; largeur de l’actif et séparateurs comptés réellement.
- Bureau/mobile : deux tests dédiés (géométrie et composant réel avec DOM contrôlé), TypeScript strict ciblé et invariants Présences réussis.
- Clics internes, extérieur, clavier/Échap/focus, redimensionnement et masquage à l’impression vérifiés ; API/documents inchangés.
- Audit avant/après identique : 15 131 classes, 1 713 hex, 406 emojis, 243 dégradés. Correction sans navigateur autorisée ; revue visuelle réelle en attente.


### 18 novembre 2026 — Coquille commune, identité et détail de paie
- Topbar flottante, navigation sous le logo, compte en bas : même rendu entreprise/portefeuille ; disposition white-label conservée.
- Logo entreprise agrandi, repli Konza et erreur d’image ; contexte partagé avec les loaders, formats HTTP de développement acceptés via le hook existant.
- Détail de paie : brut/retenues/net, actions regroupées et modale native ; bulletin officiel et exports inchangés.
- Neuf routes de paie retouchées ; menus de ligne en portail, statuts/contrastes harmonisés. Palette Paie : 1752 → 35.
- Empreintes sur 31 sources : API/effets/états/calculs/contraintes/documents conservés ; scénarios de logos, statuts, droits et confirmations réussis. TypeScript sans cache et régression Présences réussis.
- Audit global : 15 131 → 13 415 classes ; 1 713 → 1 675 hex ; 179 → 175 flous. Aucun back ni document officiel modifié.
- Revue visuelle clair/sombre/mobile en attente, cases [~]. Suite proposée : Notifications et Messagerie.

### 18 novembre 2026 — Cloche, navigation et revue Congés
- Pages Messages/Notifications validées par l’utilisateur et conservées ; popup des cinq plus récentes, tri et rafraîchissement vérifiés.
- Demandes neutralisé, compteurs thématiques et groupes Au quotidien/Gestion RH/Mon espace ; liens identiques pour quatre rôles, entreprise et portefeuille.
- Treize routes Congés et trois composants : filtres, tableaux défilants, en-têtes, couleurs/graphiques en tokens ; doublons de liens retirés.
- Empreintes API/effets/états/calculs/contraintes/callbacks/documents conservées ; tests Congés, Présences, sélecteurs et TypeScript sans cache réussis.
- Audit global : palette 13 415 → 12 254 ; hex 1 675 → 1 648 ; dégradés 243 → 241. Aucun back ni document officiel modifié.
- Congés [~], revue visuelle utilisateur en attente ; prochain lot à confirmer : Matériel/Formation.

### 18 novembre 2026 — Ajustements sidebar, Congés et documents
- Sidebar 272 → 244 px, repli 68 px ; haut resserré et double logo clair/sombre corrigé.
- Compte/déconnexion dans un seul pied : nom, rôle, e-mail et bouton explicite ; entreprise et portefeuille.
- Congés : À traiter en liste, accents alignés sur le thème ; Planification des départs premier onglet, Soldes conservé.
- Lecteur des trois aperçus existants : largeur automatique, zoom, plein écran, défilement ; documents et exports inchangés.
- TypeScript sans cache, tests lecteur/navigation/rôles et garde-fous Congés/Paie/Présences réussis ; audit inchangé (12 254 classes / 1 648 hex).
- Revue visuelle utilisateur attendue, cases [~] ; aucun back modifié.

### 18 novembre 2026 — Démo bulletin et bouton de réduction fixe
- Ajustements précédents acceptés ; commande de sidebar ancrée à la même hauteur ouverte/repliée, entreprise et portefeuille.
- Démo `/paie/demo-payroll-0` : détail en lecture, entreprise, lignes et montants figés cohérents, configuration du gabarit actuel.
- Rendu officiel inchangé ; mutations et exports restent refusés en démo, accès employé limité à son bulletin.
- Tests dédiés, navigation et invariants Paie/Présences réussis ; HTML 200 et dix scripts JavaScript accessibles.
- L’utilisateur consulte d’abord le bulletin ; extension du lecteur aux autres aperçus ensuite, déjà autorisée.

### 18 novembre 2026 — Lecteurs de documents généralisés
- Bulletin entier par défaut (largeur/hauteur), zoom et plein écran ; Ma paie et aperçu des modèles alignés.
- Absences, modales Prêts/Permissions, rapports Présences, journal de paie et émargement Formation intégrés.
- Aperçus des rapports repliables, sans dupliquer les identifiants ; sources des exports toujours présentes et inchangées.
- Modale native avec Échap/clic extérieur/focus ; ancien rendu cabinet/super admin conservé.
- Empreintes métier/documents sur dix sources, tests lecteur/modale/démo et TypeScript sans cache réussis.
- Audit : palette 12 254 → 12 253, hex 1 648 → 1 647 ; revue visuelle utilisateur attendue, cases [~].

### 18 novembre 2026 — Recrutement complet, récapitulatifs de paie
- Bulletin à 72 %, réduction sidebar sur la ligne du logo, sans déplacement vertical.
- Retenues de liste : total serveur complet à la place de CNSS + ITS ; détails salarié/employeur alimentés par les lignes, taxes configurées incluses.
- 17 routes Recrutement revues : offres/étapes, priorités/agenda, pipeline, dossiers, rubriques des formulaires, éditeur/aperçu e-mails et carrière mobile.
- 20 empreintes métier conservées ; tests, neuf rendus SSR, TypeScript et cinq pages HTTP/22 scripts réussis.
- Démo de lecture uniquement ; publication, e-mails, embauche et autres mutations refusés. Backend et documents officiels inchangés.
- Palette lot 59 → 0 ; global 12 253 → 12 194, emojis 406 → 405 ; revue visuelle utilisateur attendue, cases [~].

### 18 novembre 2026 — Contrat Patrick et récapitulatif du bulletin
- Historique contrat démo en lecture seule, liste vide explicite ; API réelle inchangée, aucun document généré.
- Échec de chargement contrat géré, réessai disponible ; tests succès/échec et accès employés réussis.
- Détails des retenues déplacés de la carte du haut vers Récapitulatif, sans doublons CNSS/ITS.
- Données patronales de démo complétées ; totaux figés et cohérence des lignes testés sur les trois bulletins.
- TypeScript sans cache et garde-fous Paie/documents réussis ; aucun backend ni document officiel modifié.


**Paramètres — 18 novembre :** onze routes restructurées : accueil par domaines, navigation commune, listes départements/utilisateurs, rubriques et tableaux adaptés aux écrans étroits. Sélection des modèles bulletin/facture ouvrant le lecteur (zoom initial 72 %, plein écran), couleurs et blocs conservés ; éditeur et documents officiels inchangés. Démo des données complémentaires en lecture seule, sans invitation ni paiement simulé. Palette des treize sources : 1454 → 0 ; audit global : 12 194 → 10 740 classes, 1 647 → 1 646 hex, 405 → 399 emojis. Onze vues et interactions des modèles testées ; empreintes métier/documentaires conservées. Cases [~], revue visuelle clair/sombre/mobile par l’utilisateur encore attendue ; aucun backend modifié.


**Utilisateurs, Rapports et composants communs — 18 novembre :** utilisateurs en liste par défaut, grille quatre colonnes sur grand écran, pagination 10/20/30/40/50 et retour en première page après filtrage. Les seize routes Rapports et la comptabilité PME dédiée sont revues ; cinq autres variantes PME héritent par réexport. Rubriques accessibles sur les analyses longues, tableaux défilants, graphiques thématiques sans grille et suppression des commandes sans action. Alertes, notifications temps réel, rappels et blocages d’abonnement harmonisés ; piles coordonnées et panneau de détail natif. Rôles, appels API/sockets, minuteries, exports et documents conservés ; cabinet/super admin conservent leur rendu. Palette du lot Rapports : 601 → 46 (reste protégé imprimable) ; audit global : 10 740 → 10 014. Tests de rendu des 17 vues, interactions utilisateurs, feedback, panneau et TypeScript réussis ; HTTP 200 + 19 scripts vérifiés. Cases [~] maintenues : revue visuelle réelle et comparaison d’impression à faire par l’utilisateur. Attendre son retour avant le prochain module.


**Correctifs Rapports/toasts et Performance — 18 novembre :** variation de paie absente affichée « — » sans plantage ; accueil Rapports recomposé en pleine largeur avec trois entrées d’analyse, indicateurs et sections lisibles, absence de données distincte de zéro. Toasts sans surface défilante, secondes et barre de temps restant ; durées de fermeture conservées et pause clavier/survol des toasts maintenue. Ancien widget Bienvenue retiré des coquilles entreprise/PME, cabinet inchangé. Les onze routes Performance et leurs deux variantes PME sont livrées : évaluations en lignes, indicateurs prioritaires, campagnes/grilles plus lisibles, objectifs et dossiers individuels, fenêtres natives. API, autorisations, pondérations, calculs et fiche imprimable conservés sur 23 sources ; palette 2014 → 165, solde réservé au document et à ses dépendances ; audit global 10 014 → 8 165. Démo Performance de lecture seule ajoutée, aucune notation/décision simulée. Tests et TypeScript réussis ; HTTP 200 et 22 scripts contrôlés. Cases [~], revue visuelle utilisateur et impression comparée encore attendues.

### 19 novembre — Liaison des six contrats récents

- Nest/Prisma + six adaptateurs HTTP : tâches, événements/réactions, annonces, ancienneté, aperçu de journée et apparence.
- Migration additive appliquée et enregistrée sur PostgreSQL local ; aucune migration tierce exécutée, aucun déploiement distant.
- Droits relus en base, isolation entreprise, tâches personnelles privées, réactions atomiques, notifications privées persistantes et messages par palier.
- Apparence séparée des couleurs documentaires ; mode serveur restauré, écritures ordonnées et réponse tardive testées.
- 64 contrôles HTTP réels et six adaptateurs exécutés ; tests confidentialité/thème, types front/back et directives client réussis.
- Hors démo, fonctions actives par défaut (false = suspension). Démo locale conservée. Limites et extensions futures dans LIAISON-BACKEND.md ; assistant non commencé.


### 17 novembre 2026 — Assistant : pseudonymisation réversible (Claude)

- ASSISTANT.md §8, mode IA avancée : le serveur remplace noms et montants par des repères et des marqueurs avant d'appeler le modèle, puis les rétablit à l'affichage ; le modèle converse sans connaître les personnes ni les montants réels. Situation familiale, parts et santé jamais exposées ; historique stocké masqué ; seuil pour les petites équipes ; test de pseudonymisation ajouté.

### 18 novembre 2026 — Assistant : deux modes pilotés par le super admin (Claude)

- ASSISTANT.md : mode A « Intégré » (serveur seul, au démarrage) et mode B « IA avancée » (externe pseudonymisé, après licence de non-entraînement) ; nouvelle section « Interrupteurs du super admin » (mode de la plateforme, licence obligatoire pour le mode B, quotas et disponibilité par forfait, exceptions par entreprise, interrupteur d'urgence, guide pas à pas indépendant). Phases : C1 assistant intégré avant C2 IA avancée.
### 19 novembre — Assistant, premier lot de la phase A

- Guide maison et catalogue : paie, recrutement, ajout employé ; sept variantes, jusqu’aux formulaires et consignes de vérification.
- Boussole dans la topbar ; sur mobile, entrée dans le menu du compte pour conserver la place dans l’en-tête.
- Halo/curseur, clavier/Échap, retour du focus, cible attendue, choix en fenêtre native, menu mobile et navigation arrière.
- Rôles/abonnements respectés ; changement d’identité arrête le guide. Espace entreprise seulement : routes PME différentes, cabinet/super admin exclus.
- Tests des branches/cibles/DOM et non-régressions Employés/Recrutement/Paie réussis ; contrôle des guides ajouté au build.
- Audit inchangé : 8 165 palette, 1 438 hex, 375 emojis. Aucun document, calcul, appel métier ni backend modifié dans ce lot.
- Revue visuelle utilisateur attendue avant phase B ; chat, outils d’analyse, quotas et interrupteurs serveur encore à construire.

### 19 novembre — Assistant : aide et chat connecté

- Panneau Aide/Conversation/Historique, douze articles par rôle, trois guides conservés, réponses SSE, avis et suppression confirmée.
- Nest/Prisma relié : capacités, aide/suggestions, chat et historique privé utilisateur/entreprise ; mode intégré sans fournisseur externe.
- Texte libre non stocké : questions canoniques et refus ; débit/doublons, expiration/purge et permissions contrôlés au serveur.
- Interrupteurs serveur OFF/INTEGRE/guides audités, sans retouche des écrans super admin/cabinet ; chat OFF conserve les guides autorisés.
- 90 questions de référence et 63 contrôles HTTP réels avec le client front ; tests UI, SSE/UTF-8, changement d’identité, types et compilation back réussis.
- Migration additive locale uniquement ; démo locale conservée. Audit inchangé : 8 165 palette, 1 438 hex, 375 emojis ; revue visuelle encore attendue.
- C1 reste partiel : écran des réglages et quotas avant les analyses chiffrées. Aucun modèle externe, résultat salarial ni quota fictif livré.


Assistant, 19 novembre : aide et conversation séparées ; C1 et outil effectifs connectés. Détails et limites : [ASSISTANT-C1.md](ASSISTANT-C1.md). Mode démo conservé, analyses réelles uniquement avec le back et la politique activée.


## 19 novembre - Conversations, support et analyses

Aide et Assistant dans des fenêtres centrées ; Support Konza dans Messages et boîte `/admin/support`, agents créés par le superadmin, Contact avec suivi privé. Neuf outils d’analyse connectés, historique chiffré, aucune mutation métier. Tests : 49 HTTP support + adaptateur front, 108 HTTP assistant, 90 questions et UI/guides. Mode démo conservé, aucun faux envoi au support. Analyses réelles activables dans `/admin/assistant`. Migration support appliquée localement seulement. Revue visuelle et dernière passe de retours produit encore attendues. Détails : [SUPPORT-ANALYSES.md](SUPPORT-ANALYSES.md).


### 19 novembre — conversation, connecteurs IA et retours produit [~]

Fil de chat avec message d’accueil et trois questions compactes, sans centrage tronquant. Premier lot de connecteurs OpenAI, Anthropic, Google et Mistral : configuration serveur, licence et test fictif superadmin, modes par forfait/entreprise et coupure. Sortie strictement bornée à des phrases vérifiées, aucune question libre ni donnée RH sortante. C2 complet non revendiqué. Suggestions et retours clients reliés au Support, relecture et réponse staff existantes. Tests des quatre transports interceptés, 122 HTTP Assistant et 55 HTTP Support, UI et types. Migration appliquée localement seulement ; aucune vraie clé testée. Voir backend/docs/ASSISTANT-MODELS.md.


### 19 novembre — suggestions distinctes et fenêtre de conversation [~]

Sur correction utilisateur : /suggestions et raccourci Pilotage livrés, formulaire distinct du chat, catégorie SUGGESTION transmise au serveur. Motif obligatoire lors de la création d’un chat et visible à la relecture. Assistant en deux colonnes (historique / conversation), choix actif et suppression conservés, nouvelle conversation à gauche. Tests du formulaire/reprise, absence de motif, conversation et historique simultanés, types et HTTP/scripts réussis. Aucun connecteur supplémentaire ni document officiel modifié.


### 19 novembre — lisibilité du fil Assistant [~]

Correction de la capture : commandes secondaires déplacées à gauche, titre redondant retiré, suggestions dans le fil, saisie et en-tête compactés. Réinitialisation du défilement sur conversation vide et lecture au début de la réponse ; pas de saut en bas pendant la diffusion. Tests de ces deux régressions et des vues/actions réussis. Revue visuelle réelle encore attendue ; aucun appel fournisseur ni changement de clé.


### 19 novembre — arrivée progressive des réponses [~]

Animation de présentation pour les textes démo/API, sans modifier leur contenu ni les calculs. File ordonnée, cartes/fin après le texte, arrêt immédiat avant le fragment suivant et affichage direct si mouvement réduit. Tests dédiés et UI/provider réussis. Exemple des trois variables serveur ajouté sans lire/modifier la vraie clé.


### 19 novembre — nom de l’agent

Nom visible harmonisé sur Agent Konza : bouton flottant, fenêtre, auteur des réponses, indicateur d’écriture et page de réglages. Contact humain : Support Konza. Tests des interfaces Assistant et Support réussis ; aucune logique modifiée.

### 19 novembre — abonnements, priorité utilisateur après mise en pause du logo

Trois paliers commerciaux 50 / 100 / plus de 100 employés alignés avec les limites du serveur ; devis séparé. Les prix restent dans plan_prices, sans injection des exemples. Invitations et promotions vers ADMIN/HR_MANAGER comptées dans le quota de quatre administrateurs du PRO ; offres comptées par mois civil. Catalogue public et abonnement lisent les informations serveur, renouvellement du plan courant possible. Protection globale Nest et barrière de navigation : expiration sans attendre le cron, marqueur de rétrogradation maintenu bloquant ; seules les lectures du dashboard/coquille et le paiement/session restent possibles, aucune écriture métier autorisée. Retour de paiement et devis conservés ; exemptions cabinet et plateforme préservées.

Validation : 11 tests Jest dont un vrai parcours HTTP Nest avec contrôleur témoin, 11 scénarios front et 3 tests catalogue/rendu ; TypeScript front/back sans cache. Aucun paiement réel ni changement de tarif en production. Détails : ABONNEMENTS.md. Revue manuelle du prestataire et des comptes réels encore nécessaire.

### 24 novembre — rapports et turnover
Suppression administrative distincte du départ réel, compte associé désactivé et historique conservé. Migration additive avec reprise prudente des suppressions auditées ; cas anciens ambigus à confirmer. Paie hors annulations, périodes propagées, coûts enregistrés et ITS/BNC séparés. 19 tests ciblés et 16 vues de rapports réussis. Migration et comparaison sur données réelles à effectuer : connexion de base absente. Aucun module Ruptures complet ni changement de modèles imprimables.
