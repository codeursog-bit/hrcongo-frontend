# Utiliser les fondations de la refonte

Pour le fonctionnement habituel, laisser `NEXT_PUBLIC_DEMO_MODE` absent ou à `false`.

Pour explorer sans backend, définir `NEXT_PUBLIC_DEMO_MODE=true` dans la configuration locale puis redémarrer Next. Ouvrir `/dashboard` pour la coquille et `/design-system` pour les cinq gabarits et le parcours de demande. Le badge « Mode démo » permet de basculer entre un compte Admin/RH et Employé. Les permissions et gardes de routes existants continuent de fonctionner.

Une couche unique intercepte les requêtes destinées à l’URL API configurée, y compris l’authentification fictive. Elle est installée avant les consommateurs et ne modifie aucun client ni appel métier existant. Les ressources du front restent servies normalement. Les requêtes API non couvertes échouent explicitement avec un message de démonstration ; elles ne partent jamais vers le vrai serveur. Les sorties officielles et paiements ne sont pas simulés. Les sockets de notification sont désactivées dans la démo, hors zones reportées.

Les fixtures actuelles couvrent la session, la société, les employés/départements, la synthèse dashboard, la paie en lecture, les prêts/avances, congés, présence, absences/permissions, notifications et abonnement. Elles partagent les mêmes personnes et montants. Les écritures métier ne sont pas simulées tant que le module correspondant n’a pas été intégré. Leur couverture sera complétée page par page à l’étape 3.

Les tâches, événements/réactions, annonces, notifications d’ancienneté, aperçu de journée et apparence ont chacun un contrat, un adaptateur démo et un adaptateur HTTP réel depuis le 19 novembre. Les hooks existants restent les points d’entrée. Hors démo, les fonctions sont actives par défaut ; une valeur explicite `false` de leur drapeau les rend indisponibles.

Les drapeaux `NEXT_PUBLIC_FEATURE_TASKS_API`, `NEXT_PUBLIC_FEATURE_DAYEVENTS_API`, `NEXT_PUBLIC_FEATURE_ANNOUNCEMENTS_API`, `NEXT_PUBLIC_FEATURE_ANNIVERSARIES_API`, `NEXT_PUBLIC_FEATURE_DAYOVERVIEW_API` et `NEXT_PUBLIC_FEATURE_APPEARANCE_API` peuvent être fixés à `false` pour suspendre un module. Déployer le back et la migration avant le front ; voir [LIAISON-BACKEND.md](LIAISON-BACKEND.md). La sélection est centralisée dans chaque fichier de domaine `.ts`. La démo locale existante reste activée ; une vraie connexion et un redémarrage sans `NEXT_PUBLIC_DEMO_MODE=true` sont nécessaires pour utiliser les données serveur dans l’app.

Les mutations de démonstration restent en mémoire et disparaissent au rechargement. Les tâches personnelles sont invisibles à l’administration. Les affectations et réactions sont bornées à la société. En mode réel, les données et lectures persistent en base ; ancienneté et messages sont préparés par le back. Push, rappels et extensions sans interface actuelle restent futurs.

La session d’affichage précédente est sauvegardée dans sessionStorage avant activation de la démo, puis restaurée en revenant sur une zone reportée ou lors d’un redémarrage sans démo. Ne pas prendre la session fictive pour une authentification réelle : aucun cookie réel ni permission serveur n’est créé.

Vérifications : `npm run check-types`, `npm run check-client-directives`, puis `node scripts/check-refonte-foundations.cjs`.

## Serveurs de vérification

Garder `npm run dev` pour le serveur principal (port 3000, dossier `.next`). Utiliser **`npm run dev:check`** pour une vérification simultanée (port 3100, dossier `.next-check`). Ne jamais lancer un second `next dev` ou `next build` dans le même dossier de sortie que le serveur actif : les pages HTML et les chunks JavaScript peuvent se désynchroniser. Pour une vérification du chargement, contrôler aussi les scripts référencés dans le HTML, pas seulement le statut de la page.

## Ma journée

Ouvrir `/dashboard` : la vue Employé affiche Ma journée seule ; la vue Admin/RH propose les onglets Pilotage RH et Ma journée. La carte de pointage ouvre la pointeuse existante ; le chrono du dashboard ne remplace pas le calcul métier des heures. En démo, tâches/réactions sont mutables et horaires/absents/fériés viennent de `lib/demo/day-overview.ts`. En mode réel, ces six contrats utilisent les routes Nest et PostgreSQL. Les notifications d’ancienneté restent privées, dans Ma journée.

## Mon compte

Ouvrir `/mon-profil`. La fiche fictive de Laure autorise l’édition des coordonnées : « Modifier mes informations », puis « Enregistrer » en bas de page. Les modifications restent en mémoire jusqu’au rechargement. La situation familiale et les enfants restent en lecture seule. Le thème Clair/Sombre/Auto utilise le réglage existant ; langue et visibilité de l’anniversaire ne sont pas encore modifiables. Les accès paie, signature, notifications et 2FA ouvrent leurs pages existantes. Les écritures sensibles non simulées (mot de passe, signature, etc.) restent explicitement indisponibles en démo. Vérification : `node scripts/check-account.cjs`.

## Prêts · Mon espace

Ouvrir `/loans/mon-espace`. Le filtre En attente montre la demande personnelle de 30 000 FCFA : « Voir ma demande », puis « Annuler la demande » permet de tester l’annulation en mémoire. Toutes permet de retrouver le prêt actif de 300 000 FCFA (200 000 FCFA restants), qui ne peut pas être annulé. Suivi de mes dettes montre l’historique et les deux remboursements de 50 000 FCFA. Les avis de la frise proviennent des données existantes lorsqu’elles sont disponibles ; aucun avis fictif n’est ajouté. Impression et exports officiels restent indisponibles en démo. Vérification : `node scripts/check-loan-space.cjs`.

## Prêts · Nouvelle demande

Ouvrir `/loans/nouveau`, renseigner le motif, puis suivre Quoi → Combien / Quand → Détails → Récapitulatif. Exemple : prêt en argent, 30 000 FCFA, trois mois. Après l’envoi, Voir ma demande ouvre Mon espace où la demande personnelle apparaît en attente. Les créations restent en mémoire jusqu’au rechargement. Admin/RH peut créer pour un employé fictif ; cette demande suit le traitement direct existant et apparaît dans la liste de gestion, pas dans l’espace personnel de l’admin. L’avance intégrée conserve ses propres champs de déduction. Les champs nature/pièce jointe restent limités aux modèles STANDARD/MODERN ; documents officiels et uploads ne sont pas simulés par ce parcours. Vérification : `node scripts/check-loan-form.cjs`.

## Prêts · Validations

Avec la vue Admin/RH, ouvrir `/loans/validations`. Une demande personnelle de prêt et une avance sont en attente. Approuver ouvre d’abord le détail pour choisir Sur la paie ou En espèces ; Refuser demande un motif. La décision est enregistrée en mémoire et se retrouve dans les filtres et Mon espace pour l’employé concerné. L’exemple utilise un circuit d’avis inactif ; aucun avis ni signature fictive n’est inventé. Les documents officiels restent indisponibles. Vérification : `node scripts/check-loan-validations.cjs`.

## Apparence

Activer le mode démo comme décrit plus haut, puis ouvrir `/apparence` (ou la carte Apparence dans Mon compte). Par défaut, les couleurs personnelles sont verrouillées. En vue Admin/RH, ouvrir `/apparence?scope=company` : choisir les couleurs de l’entreprise, autoriser les employés à personnaliser, puis enregistrer. Revenir à Mes couleurs pour tester un choix personnel, les aperçus clair/sombre et les réinitialisations.

Désactiver ensuite l’autorisation dans la vue entreprise : les couleurs personnelles sont conservées et ignorées. Réactiver pour les retrouver. Les réglages d’apparence persistent localement après rechargement, contrairement aux demandes fictives en mémoire. Le mode Clair/Sombre/Auto reste personnel dans tous les cas. La variante PME utilise l’entreprise du chemin. Les documents et les zones legacy sont exclus.

Le backend Apparence est branché et testé : hors démo, la page lit/enregistre la politique entreprise et les préférences personnelles sur le serveur. `NEXT_PUBLIC_FEATURE_APPEARANCE_API=false` permet une suspension explicite. Vérifications : `node scripts/check-appearance.cjs`, `node scripts/check-appearance-server-sync.cjs` et le test HTTP/PostgreSQL côté backend.

## Prêts · Suivi des dettes

Ouvrir `/loans/suivi-dettes`. En novembre 2026, Laure a 200 000 FCFA restants et 50 000 FCFA remboursés pendant le mois ; en vue annuelle 2026, les remboursements sont de 100 000 FCFA. Changer de période conserve le solde encore dû. La recherche et les filtres département/type restent disponibles ; Voir la fiche ouvre la fiche refondue. L’export officiel conserve son comportement réel et reste indisponible dans la démo. Vérification : `node scripts/check-debt-tracking.cjs`.

## Prêts · Module complet

Les dix routes sont livrées : gestion `/loans`, `/loans/dashboard`, `/loans/mon-espace`, `/loans/nouveau`, `/loans/validations`, `/loans/suivi-dettes`, sa fiche individuelle, `/loans/rapport`, `/loans/releve` et son relevé individuel. Les variantes `/pme/demo-company/loans` et `/pme/demo-company/loans/dashboard` conservent leur délégation.

En vue Admin/RH, ouvrir `/loans/suivi-dettes/demo-laure` pour la fiche et l’historique, puis `/loans/releve/demo-laure` pour les commandes du relevé. Son contenu imprimable est conservé. Le tableau de bord `/loans/dashboard` présente les données fictives selon la période : année 2026 = 300 000 FCFA accordés, 100 000 remboursés et 200 000 restants ; novembre = 50 000 remboursés et 200 000 restants, même sans prêt accordé ce mois-là.

Les décisions et créations déjà simulées restent mutables en mémoire. Les modifications/suppressions de dettes, remboursements et exports officiels non simulés renvoient un message explicite ; aucun paiement ni document fictif n’est produit. Vérification métier : `node scripts/check-loans-module.cjs`. Chargement des 12 routes et de leurs scripts : `node scripts/check-loans-http.cjs`, avec un serveur démo isolé sur 3101. La revue visuelle clair/sombre/mobile reste à effectuer.

## Congés · Module complet

Les 13 routes du dossier `/conges` et leurs 8 variantes PME existantes sont livrées côté interface. Commencer par `/conges/mon-espace` : les filtres de statut reprennent ceux des Prêts ; choisir Toutes ou Approuvées pour retrouver les 8 jours déjà pris par Laure en octobre. Les données fictives présentent 26 jours acquis, 8 pris et 18 restants par employé. Patrick a également une demande de 5 jours en attente du 16 au 20 novembre 2026.

La page `/conges/nouveau` utilise Quoi → Combien / Quand → Détails → Récapitulatif. Le rôle Employé reste limité au congé annuel anticipé. Les dates, motifs, informations de solde, alertes et simulations existantes sont conservés ; la confirmation réelle passe par le backend. En démo, la création, le calcul de reprise réglementaire, les mutations administratives, les avis et les sorties officielles non simulés répondent explicitement indisponible. Saisir les deux dates permet d’examiner tout le récapitulatif sans inventer un calcul de jours fériés.

Pour explorer les données de lecture, ouvrir `/conges`, `/conges/gestion`, `/conges/calendrier`, `/conges/historique`, `/conges/diagrammes`, `/conges/programme`, `/conges/planning`, `/conges/soldes`, `/conges/provision`, `/conges/analyse` et `/conges/demo-leave-1`. Choisir octobre 2026 pour les départs déjà approuvés, novembre pour la demande en attente. Les comptes et données des zones admin/cabinet/portefeuille restent isolés.

Vérifications : `node scripts/check-leave-module.cjs` (préservation métier/documents, formulaire, états, fixtures) et `node scripts/check-leave-http.cjs` (13 routes, 8 variantes PME et fiche Prêts du remboursement, avec analyse des scripts JavaScript). La modale de remboursement est désormais limitée à la hauteur de la fenêtre, avec défilement interne et champ montant réductible. La revue visuelle reste à faire dès que le contrôle navigateur est accessible.

## Permissions / autorisations de sortie

Les 8 routes de `/presences/permissions` sont livrées : gestion, Mon espace, nouvelle demande, validations, suivi, fiche par employé, historique et rapport. Aucune variante PME dédiée n’existe pour ce dossier ; aucune route supplémentaire n’est créée.

Ouvrir `/presences/permissions/mon-espace` pour Laure : une démarche administrative en attente et une mission avec retour déclaré à valider. Les filtres de statut interviennent avant la pagination. Le formulaire `/presences/permissions/nouveau` reprend Quoi → Combien / Quand → Détails → Récapitulatif, les choix Urgence / Mission / Autre, les horaires et la destination. Le ticket imprimable de l’aperçu reste inchangé.

La création, les décisions RH avec motif de refus et l’annulation d’une demande personnelle en attente sont simulées en mémoire. La vue Employé est limitée à ses tickets ; la création pour autrui et les décisions sont réservées à la vue Admin/RH. Les exemples distinguent retour déclaré et retour validé ; la validation réelle du retour, les corrections d’heures et les suppressions non simulées renvoient explicitement indisponible. Aucun retour n’est automatiquement validé ni utilisé pour inventer un calcul de paie.

Pour les rapports et le suivi, choisir novembre 2026. La fiche de Laure est `/presences/permissions/suivi/demo-laure`. Les tickets et événements fictifs sont partagés entre les écrans et disparaissent au rechargement.

Vérifications : `node scripts/check-permission-module.cjs` (préservation API/droits/calculs/documents, formulaire, pagination, états et démo mutable), puis `node scripts/check-permission-http.cjs` avec un serveur démo isolé sur 3101. La revue visuelle clair/sombre/mobile reste à effectuer.


### Absences

Six routes disponibles dans /presences/absences. Pour essayer une création : départ le **16/11/2026**, reprise le **17/11/2026** et motif renseigné. Exemple fixe ; les autres calculs réglementaires et décisions nécessitent le backend. Création et annulation personnelle en mémoire ; justificatifs sur leur service existant.

### Matériel, Formation et Notifications

- /materiel : quatre équipements fictifs. Avec le rôle Admin, créer, modifier, attribuer, retirer l’attribution, changer le statut et supprimer. Changements en mémoire ; suppression d’un matériel attribué refusée.
- /formation : tableau de bord, catalogue, mes formations, demandes et plan annuel. Budgets fictifs fixes. L’employé peut envoyer une demande en quatre étapes et la retrouver dans Mes formations. Inscription, certification, décisions et budgets nécessitent le backend.
- /notifications : filtres et lecture individuelle/globale sur les notifications fictives existantes. Droits et alertes contrat conservés.

### Pricing, Succès, Documents et CNSS

/pricing affiche des **tarifs indisponibles**, sans prix commercial inventé ni paiement. /success conserve les états attente/vérification/succès/échec et ses contrôles existants ; aucun paiement exécuté pendant les tests.

/documents affiche des métadonnées fictives, limitées aux pièces personnelles pour l’employé. Fichiers, uploads, téléchargements et générations nécessitent leurs services existants. Les bibliothèques /documents/generate et /documents/legal sont consultables.

/cnss-declaration conserve ses quatre onglets et affiche une indisponibilité explicite pour les montants sans backend. Aucun calcul, dépôt ou export officiel inventé. Historique de démonstration vide.

Contrôles : node scripts/check-service-pages.cjs et node scripts/check-services-http.cjs avec serveur isolé sur 3101. Quinze routes vérifiées ; revue visuelle générale reportée à la fin.

### Gestion des employés

Ouvrir /employes avec le rôle Admin : total actif et contrats, puis **Déclarés à la CNSS / Non déclarés — à déclarer / Statut à vérifier**. Ces compteurs utilisent un statut administratif explicitement renseigné par les RH. Les exemples montrent volontairement un employé déclaré sans numéro, un non déclaré avec numéro et un dossier à vérifier : le numéro et les retenues ne déterminent jamais ce statut.

Sur la fiche /employes/demo-laure, choisir le statut et cliquer sur **Enregistrer le statut CNSS**. La modification fonctionne en mémoire ; revenir à la liste pour consulter les compteurs. Le champ existe aussi dans création/modification et le récapitulatif. Aucun formulaire n’est envoyé à la CNSS. Les dossiers réels antérieurs à la migration restent « À vérifier » jusqu’à confirmation par les RH.

La liste, la recherche et les filtres utilisent les mêmes employés actifs. Création et désactivation en mémoire ; aucun email ni invitation envoyé en démo. Les autres écritures contractuelles/fiscales, imports et calculs de salaire nécessitent le backend. Les réglages « Cotisation CNSS en paie » et « Retenue ITS / IRPP en paie » restent séparés.

Le dashboard effectifs en bas de page utilise le nouveau style à l’écran. En démo, sélectionner **novembre 2026** pour son instantané ORCA ; les autres périodes et exports officiels ne sont pas simulés. Les fichiers Excel officiels et les zones phase 2 gardent leur rendu d’origine.

Vérifications : node scripts/check-cnss-registration.cjs, node scripts/check-employee-summary.cjs, node scripts/check-employees-module.cjs et node scripts/check-employees-http.cjs. Migration locale appliquée et colonne nullable vérifiée ; migration à appliquer normalement sur les autres environnements. Revue visuelle générale prévue à la fin.

### Présences / Pointage

Activer le mode démo puis ouvrir `/presences`. L’instantané commun montre trois employés pour les 12 et 13 novembre 2026 : Laure et Sandrine ont des pointages fictifs ; Patrick illustre deux absences non justifiées. Les autres journées ne sont pas renseignées. `/presences/dashboard` et `/presences/resume` présentent le même instantané ; le résumé, les graphiques et l’export réel ne sont pas recalculés côté client.

Utiliser le badge « Mode démo » pour basculer Admin/RH ↔ Employé. La vue Employé ne reçoit que les données de Laure ; les fonctions réservées aux RH restent bloquées. Shifts, appareils, pointages, retards et rapports sont des données de consultation fixes. Les saisies manuelles, GPS, scans QR, synchronisations, corrections et exports officiels ne sont pas exécutés : les actions non simulées répondent indisponible.

Ouvrir `/ecran` ou `/kiosk` pour parcourir les états QR, configuration, appairage, succès, refus et veille. Le QR et le code d’appairage sont fictifs : aucune caméra, NFC ou donnée RH n’est utilisée.

Le parcours réel des pointeuses utilise un code de jumelage à usage unique fourni par l’administration : installer l’agent, saisir le code dans son assistant, puis configurer la pointeuse. Le code affiché dans l’aperçu `/ecran` n’est pas un code réel.

Vérifications : `node scripts/check-presence-demo.cjs`, `node scripts/check-attendance-module.cjs`, `node scripts/check-attendance-http.cjs`, `npx jest src/device-sync/pairing.spec.ts --runInBand` côté backend et `npm test` dans `konza-sync-agent/konza-sync-agent`. La revue visuelle générale reste reportée à la fin.

## Bulletin courant — aperçu avant extension du lecteur

Ouvrir **http://localhost:3100/paie/demo-payroll-0** en mode démo : bulletin de Laure, novembre 2026, brut 380 000 FCFA, retenues 40 000 FCFA, net 340 000 FCFA. Les lignes et montants sont des fixtures figées, sans calcul de paie simulé. Le gabarit officiel actuel est conservé. La configuration de démonstration charge le modèle par défaut, indépendamment d’un ancien réglage local. Les écritures, PDF et sorties officielles restent indisponibles. Vérification : `node scripts/check-payroll-preview-demo.cjs`. L’utilisateur souhaite consulter cet aperçu avant la généralisation du lecteur aux autres écrans.

## Recrutement — lecture seule

Ouvrir `/recrutement/tableau-de-bord`, `/recrutement`, `/recrutement/pipeline` et `/recrutement/candidat/demo-candidate-2` en vue Admin/RH. Une offre, quatre candidats, un entretien et deux besoins fictifs illustrent les vues. Recherche, source et filtre des demandes sont couverts. Les modèles et la page carrière se consultent ; toute mutation reste explicitement refusée (publication, IA, déplacement, e-mails, embauche, sauvegarde). Aucun message n’est envoyé. L’espace est refusé à la vue Employé. Vérification : `node scripts/check-recruitment-views.cjs`. Les bulletins démarrent désormais à 72 % ; le bouton Page entière conserve l’ajustement automatique.

## Correctif contrat employé et coût employeur

`/contrats/employe/demo-patrick` charge désormais un historique vide explicite : aucun contrat officiel n’est inventé ni généré. L’API de démo refuse les employés inconnus et protège l’accès individuel. La fiche gère aussi un échec réseau avec un message et un bouton de réessai.

Les trois bulletins fictifs comprennent maintenant des lignes patronales et un coût employeur total figé. Pour Laure (`/paie/demo-payroll-0`) : 485 564 FCFA. Il s’agit de données d’exemple, sans simulation/calcul runtime. La carte des retenues du haut affiche uniquement le total ; le détail complet reste dans Récapitulatif. Vérifications : `check-payroll-preview-demo.cjs`, `check-contract-demo-load.cjs`, `check-shell-payroll-demo.cjs`.


### Paramètres — 18 novembre

Les onze routes sont accessibles en compte Admin de démonstration. Utilisateurs, circuits, sécurité et factures d’abonnement disposent de réponses de lecture seules ou vides explicites. Aucune modification de sécurité, invitation ou paiement n’est simulé. Sur `/parametres/bulletin`, choisir un gabarit ouvre son aperçu ; le sélecteur Salarié/Prestataire reste accessible lorsque le lecteur est masqué. Les couleurs et blocs configurés sont conservés ; enregistrer reste une action distincte.


### Performance — 18 novembre

Exemples en lecture seule : `/performance`, `/performance/cycles/demo-cycle`, `/performance/fiche/demo-review-laure`, `/performance/competences/employe/demo-laure`, `/performance/carriere/employe/demo-laure`. Évaluation fictive finalisée et objectif associé, campagne clôturée, modèle de grille, équipe et historique de carrière. Pas de faux succès pour les notes, décisions, créations ou suppressions : ces mutations restent bloquées en démonstration. La vue Employé est limitée à ses données.

## Assistant — premiers guides (19 novembre)

Dans l’espace entreprise, en vue Admin/RH : ouvrir **Assistant → Aide** (sur mobile, menu du compte → Assistant et aide). Trois parcours proposés : paie, offre de recrutement, ajout d’employé. Cliquer sur les vrais menus et choix signalés ; le guide suit les variantes et s’arrête aux consignes du formulaire, sans rien saisir ni créer. Échap quitte le guide ; les parcours peuvent être relancés. En démo, les restrictions habituelles sur les écritures restent actives.

Les guides ne dépendent pas d’un modèle IA. Ils sont désormais réunis avec le panneau d’aide et le chat connecté ; aucun outil d’analyse ni compteur fictif n’est ajouté. Les variantes PME restent reportées. Vérification : `npm run check-guides`. Le rendu réel clair/sombre/mobile reste à relire par l’utilisateur.

### Aide et conversation intégrée

Dans **Aide**, rechercher un sujet et ouvrir une réponse ou l’un des trois guides. Dans **Conversation**, essayer « Comment faire la paie ? » en Admin/RH ou « Où consulter mes bulletins de paie ? » en Employé. Les réponses viennent du catalogue versionné ; une demande de salaire ou une question non couverte est refusée ou précisée par suggestions. Les boutons Me guider restent réservés aux guides autorisés.

L’onglet **Historique** permet de relire et supprimer ses conversations ; les pouces enregistrent l’avis sur une réponse. En démo : stockage local séparé par compte/entreprise, questions normalisées, aucun envoi au serveur réel. En mode réel : même interface, endpoints Nest/PostgreSQL, session HttpOnly, flux SSE, confidentialité et droits vérifiés. Le chat n’est pas un modèle généraliste et ne lance aucune opération métier.

La configuration locale `NEXT_PUBLIC_DEMO_MODE=true` est conservée. Pour utiliser le serveur réel dans l’app : désactiver ce mode, redémarrer Next et utiliser une vraie session, après livraison du back et de sa migration. Hors démo, `NEXT_PUBLIC_FEATURE_ASSISTANT_API` est actif par défaut (`false` suspend ce nouveau panneau). Les interrupteurs serveur peuvent couper le chat indépendamment des guides ; aucune UI super admin existante n’est modifiée. Tests : `npm run check-assistant` dans chaque dépôt ; détails : `ASSISTANT.md` §13 et `backend/docs/ASSISTANT.md`.


Assistant, 19 novembre : aide et conversation séparées ; C1 et outil effectifs connectés. Détails et limites : [ASSISTANT-C1.md](ASSISTANT-C1.md). Mode démo conservé, analyses réelles uniquement avec le back et la politique activée.


## 19 novembre - Conversations, support et analyses

Aide et Assistant dans des fenêtres centrées ; Support Konza dans Messages et boîte `/admin/support`, agents créés par le superadmin, Contact avec suivi privé. Neuf outils d’analyse connectés, historique chiffré, aucune mutation métier. Tests : 49 HTTP support + adaptateur front, 108 HTTP assistant, 90 questions et UI/guides. Mode démo conservé, aucun faux envoi au support. Analyses réelles activables dans `/admin/assistant`. Migration support appliquée localement seulement. Revue visuelle et dernière passe de retours produit encore attendues. Détails : [SUPPORT-ANALYSES.md](SUPPORT-ANALYSES.md).
