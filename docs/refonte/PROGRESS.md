# SUIVI DE LA REFONTE — PROGRESS (version courte)

**25 novembre — Finalisation incidents [~] :** décodage local des source maps privées ajouté, 31 tests réussis et TypeScript frontend validé. Préférence e-mail personnelle désactivée par défaut, y compris pour les résumés. Migration et vérification des canaux réels à effectuer au déploiement ; voir `backend/docs/INCIDENTS-ACTIVATION.md`.

> **À lire au début de chaque session : CE FICHIER SEULEMENT** (il est court exprès pour économiser les crédits). Ne relis pas `INVENTAIRE.md` ni `JOURNAL.md` en entier. De `REFONTE.md`, lis seulement §2 (règles absolues), §14 (décisions) et la section utile à la page en cours.

Légende des cases : `[ ]` à faire · `[~]` livrée, revue visuelle en attente · `[x]` validée par l'utilisateur · `[!]` bloquée.

**Documents — 25 novembre [~] :** séparateurs libres superposés (déplacement entre zones, longueur, couleur, épaisseur, alignement sur une ou plusieurs colonnes des cumuls), galerie et édition des trois factures prestataires, défilement des aperçus corrigé. Modèles existants préservés, activation par type, aucune migration. Tests de rendu/validation/isolation exécutés ; gestes souris et défilement à valider visuellement par l’utilisateur, conformément aux règles de vérification locales.

**Bulletins — congés optionnels [~] :** bloc droits/pris/restants activable dans l’éditeur, valeurs figées du bulletin, masqué par défaut. Tests ciblés réussis ; revue visuelle utilisateur attendue.

## Étapes

- [x] Étape 0 — Inventaire validé (12 nov. 2026)
- [~] Étape 1 — Design system livré (`/design-system`) ; revue visuelle en attente
- [~] Étape 2 — Coquille, thème Clair/Sombre/Auto, mode démo, 5 gabarits et kit de demande livrés ; revue visuelle en attente
- [~] Étape 3 — En cours (état par module ci-dessous). Livré : Pilotage RH, Ma journée, Mon compte, Apparence, Prêts, Congés, Permissions, Absences, Employés, Présences, Paie, Recrutement, Matériel, Formation, Notifications, Messages, Documents, CNSS, Pricing ; cadre commun posé le 14 nov. sur Rapports, Paramètres, Contrats (liste), Performance et pages annexes. Revue visuelle générale reportée à la fin, sur instruction de l'utilisateur
- [ ] Étape 4 — Passe finale (cohérence, dark mode, mobile, accessibilité, performance, nettoyage ; **inclut une 2e passe sur l'intérieur des pages Paie**, où seul le cadre commun a été intégré par prudence)

## Prochaine action

**Nouveaux briefs — paie et incidents (25 novembre) :** audit paie écrit dans `backend/docs/PAYROLL-REPORT-AUDIT.md` ; premier lot « synthèse et définitions » livré au journal existant : agrégats en base, brut/retenues/patronal/chargé/coût/net distincts, hors brut, brouillons signalés, étranger séparé et écarts agrégés explicites. Calculateur, bulletins et exports existants inchangés. Sept tests backend et contrôle de rendu réussis ; TypeScript front/back réussi. Pas de comparaison sur base réelle (configuration backend absente). **Suite paie :** charges détaillées et contrôles individuels → répartition/évolution → détail paginé/cache → exports. **Incidents :** audit et plan dans `backend/docs/INCIDENTS-DELIVERY.md` ; les lots A–E restent à implémenter, aucun capteur ni canal activé. Le brief les place après le chantier des modèles de documents.

**Dernière passe publique — 25 novembre [~] :** accueil, À propos, tarifs, blog, Contact, documentation et auth contrôlés en clair/sombre aux formats 1917 × 823, 1366 × 768 et mobile. Dashboard auth complet (fin du recadrage), bulletin moins large et chevauchement limité ; titre et phrase utilisateur conservés. Tarifs harmonisés avec le site, montants/limites toujours issus du catalogue serveur ; bascule mensuel/annuel et FAQ testées avec catalogue simulé. Création entreprise livrée : quatre étapes, récapitulatif, conventions thématiques et boutons de détail séparés. Validation, champs, payload et taux existants conservés ; aucune entreprise créée pendant les tests. TypeScript et contrôles navigateur réussis. Lot public livré, validation visuelle utilisateur attendue ; outils toujours reportés en dernier.

**Authentification — 24 novembre [~] :** connexion, inscription, récupération/réinitialisation, deux invitations et alias /register harmonisés. Deux colonnes pleine hauteur : présentation fixe à gauche, formulaire large à droite, sans carte intérieure ; logo unique et formulaire seul sur mobile ; carrousel, halos et captures vides retirés. Titre et phrase utilisateur conservés exactement : « Le futur de la gestion RH » et « Connectez-vous à l’écosystème le plus avancé pour les entreprises congolaises. » Coquille fixe à 100dvh, aucun défilement de page ; colonne formulaire entière défilante pour les formulaires longs (pas de défilement sur .au-form), contrôlés de 390 × 650 à 1440 × 900. Capture dashboard et pointeuse mobile fournies par l’utilisateur intégrées telles quelles à la vitrine ; dashboard également utilisé sur l’auth. Validation des formulaires, ouverture 2FA, récupération et invitations contrôlées avec réponses simulées, sans compte créé ni email envoyé. Revue visuelle utilisateur attendue.

**Pages publiques — 24 novembre [~] :** accueil, À propos, blog (liste + article), Contact et documentation repris. Présentation éditoriale, navigation et pied de page communs, captures réelles du produit (dashboard fourni, employés, paie, bulletin complet). Pas de photo fictive ni de cadre vide ; pas de modification des modèles imprimables. Recherche/réactions du blog et formulaire/suivi Contact conservés. Revue utilisateur attendue avant la suite ; pages outils reportées en dernier.

**Priorité utilisateur — cohérence des rapports et turnover (24 novembre) :** corrections front/back livrées ; suppressions de fiches séparées des départs réels, historique de paie conservé. Effectifs alignés sur les employés actifs, périodes sélectionnées propagées, paie hors annulations et coûts employeur issus des montants enregistrés ; ITS/BNC distingués. 19 tests ciblés, rendu des 16 routes et TypeScript front/back réussis. Appliquer la migration `20261124120000_employee_record_deletion` sur la base cible puis comparer les chiffres réels : aucune connexion de base disponible dans ce checkout. Les anciennes fins de contrat sans preuve restent « à confirmer », sans faux départ ; module Ruptures non finalisé par ce lot.

**Priorité utilisateur — abonnements (19 novembre) :** logo mis en pause. Catalogue BASIC 50 employés, PRO 100 employés / 4 administrateurs / 2 offres créées par mois civil, ENTERPRISE au-delà / tous modules ; besoin spécifique sur devis. Prix mensuels et annuels exclusivement issus des valeurs enregistrées par le superadmin : les exemples 35 000 / 45 000 / 65 000 FCFA ne sont pas injectés en base. Pages tarifs et abonnement harmonisées ; renouvellement du plan courant réactivé. Barrière serveur globale après authentification : expiration immédiate, essai terminé, statut suspendu et rétrogradation FREE restent bloqués pour les actions métier. Tableau de bord et paiement (y compris devis et retour prestataire) restent accessibles ; documents officiels inchangés. Interface : page métier non montée avant vérification, modale Renouveler / Tableau de bord, nouvelles vérifications périodiques et rafraîchissement après paiement. Contrôles des paliers et quotas alignés ; support/cabinet/superadmin non concernés par cette barrière entreprise. Voir `ABONNEMENTS.md` pour les vérifications et limites de validation.

**Assistant — effet d’écriture [~] :** file de présentation progressive sur les réponses, démo et API, curseur et mention Konza écrit. Ordre des événements/cartes/fin conservé, texte et sauts de ligne inchangés, annulation et mode mouvement réduit testés. Variables ASSISTANT documentées dans backend/.env.example, aucun secret réel modifié. Tests UI/provider et file d’écriture réussis. La démo reste configurée comme avant ; pour un fournisseur réel : démo false, clé serveur, licence et réglages /admin/assistant.


**Correctif lisibilité Assistant sur capture [~] :** priorité au fil de messages ; titre répété retiré, confidentialité/préférences/outils/quota regroupés à gauche. Questions suggérées dans le contenu défilant, saisie compacte, zone de lecture minimale et repli défilant sur écran court. Nouvelle conversation remise en haut ; réponse ouverte par son début sans tirer la lecture en bas pendant le flux. Tests UI, défilement et Support réussis. Aucun changement API, connecteur ou secret. Revue visuelle utilisateur encore attendue.


**Ajustement utilisateur — Suggestions et Assistant [~] :** raccourci « Suggérer une fonctionnalité » dans le Pilotage Admin/RH, formulaire dédié /suggestions avec confirmation serveur et reprise idempotente, sans ouvrir le chat. Catégorie SUGGESTION conservée à la réception. Dans le chat, choix explicite du motif obligatoire et motif visible dans l’en-tête. Assistant : historique à gauche, échanges à droite, nouvelle conversation dans la colonne de gauche ; empilement mobile. Tests UI/support, types et HTTP 200 + scripts vérifiés. Fournisseurs testables par clé serveur, premier raccordement borné inchangé ; aucune vraie clé utilisée par l’agent. Revue visuelle utilisateur attendue.


**Conversation, connecteurs et retours produit — 19 novembre [~] :** accueil dans le fil, trois raccourcis au-dessus de la saisie, fin du centrage qui coupait les suggestions. Quatre transports IA et réglages de licence/test fictif superadmin reliés. Premier lot borné : sélection de phrases vérifiées, sans question libre ni données RH envoyées. 122 contrôles HTTP Assistant, tests des quatre protocoles et 55 contrôles Support ; types front/back. Suggestions et retours produit via les catégories SUGGESTION/FEEDBACK du chat Support. Migration additive locale uniquement. Aucun fournisseur activé ni clé réelle testée. **Suite : test d’une clé depuis /admin/assistant et validation visuelle ; C2 complet reste partiel.** Voir [documentation connecteurs](../../../backend/docs/ASSISTANT-MODELS.md).


**Ajustements Aide/Assistant et Portefeuille — 19 novembre [~] :** conversation, saisie et pied de fenêtre séparés, guides alignés. Revue des 17 routes Portefeuille : synthèse, entreprises, tableaux, graphiques et onze fenêtres ; Messages conservé. Palette locale 544 → 0 ; audit global 8165 → 7621, hex 1438 → 1419. Invariants conservés sur 20 sources, tests et TypeScript réussis. Revue visuelle complète encore attendue. Situation antérieure au lot Connecteurs ci-dessus : seul le moteur intégré était raccordé. Voir [PORTFOLIO-REVUE.md](PORTFOLIO-REVUE.md).


**Conversations, support et analyses livrés `[~]` le 19 novembre :** Aide et Assistant séparés dans des fenêtres centrées ; chat Support Konza dans Messages, Contact sans compte avec suivi privé, boîte `/admin/support`, agents SUPPORT créés/désactivés par le superadmin. Neuf outils d’analyse connectés et bornés, sélection explicite de l’employé, historique chiffré et lecture seule. 49 contrôles HTTP support + véritable adaptateur front, 108 contrôles HTTP assistant, 90 questions, tests UI/guides/SSE/confidentialité et types front/back. Audit inchangé : 8165 palette / 1438 hex / 375 emojis ; garde-fous Paie/Présences conservés. Migration additive locale seulement, démo conservée, analyses désactivées par défaut. **Suite : contrôle final visuel/fonctionnel, puis suggestions de fonctionnalités et retours clients (demandés en dernier).** C2 externe reste conditionné à la licence. Détails et limites : [SUPPORT-ANALYSES.md](SUPPORT-ANALYSES.md).

Liaison back précédente : six contrats reliés et testés sur PostgreSQL local (64 contrôles HTTP + six adaptateurs). Migration appliquée localement uniquement ; démo locale conservée. Voir [LIAISON-BACKEND.md](LIAISON-BACKEND.md).

_Directives complètes : `REVUE.md` (à lire juste après ce fichier). Mesures : `AUDIT.md` ou `npm run audit:refonte`._

Priorités fixées par l'utilisateur (16 nov. 2026) : **1) la refonte partout dans l'espace entreprise et l'espace Portefeuille, avec un vrai bon design (y compris anniversaires, événements, ancienneté, tâches, annonces) ; 2) puis l'alignement du back avec le front ; 3) puis l'assistant.** Cabinet et super admin : inchangés pour l'instant.

État : pages privées, sidebar, topbar, sous-menus (`ModuleNav`), composants `ui`, sélecteurs, logo d'entreprise et Portefeuille ont reçu le cadre commun (niveau B) ou une refonte à la main (niveau A). **Aucun intervenant n'a vu le rendu.** Mesure de départ : 17 750 classes de palette, 1 762 couleurs hex, 467 emojis, 252 dégradés, 73 pulse/ping, 209 flous/verre (hors phase 2 et documents).

À faire, dans l'ordre :

1. **Mission 1 consignée le 17 novembre** : périmètre isolé sans attribution Git possible, six lots retrouvés, compilation corrigée ; 21 tests réussis et 1 réserve Formation/certificats. Voir `CONTROLE-MISSION-1.md`. Audit de départ commité : 17 852 classes, 1 783 hex, 467 emojis, 252 dégradés.
2. **Mission 2 — Employés : les huit routes sont livrées**, variantes PME par réexport conservées. Liste par défaut, grille quatre cartes sur grand écran, statistiques visibles ; salaire au survol/focus avec curseur d’aide, sans second œil ni déplacement. Fiche restructurée ; création et import guidés avec parcours en haut et confirmations animées ; modification en sept rubriques et sauvegarde unique ; primes/quantités prioritaires avec modale saisie/aperçu ; congés employé avec solde et historique. **Aucune route Employés restante à commencer ; revue visuelle générale du module en attente**, cases [~] maintenues. API, effets, handlers, contraintes, calculs et documents conservés ; preuves : `controle-fin-employes/mesures.json`, lots précédents dans JOURNAL.md. Tests Employés et TypeScript sans cache réussis ; huit pages sans classe de palette en dur. Audit global : **16 747 classes**, 1 775 hex, 448 emojis, 251 dégradés. Correction sur capture : fenêtre compacte avant sélection et en cas de catalogue vide, sans aperçu ni attribution inutile ; échec de lecture distingué. Catalogue démo de lecture renseigné, mutations/calculs toujours réservés au serveur. Correction du sélecteur dans la modale native : portail dans le dialog, position suivie, défilement limité aux options, premier Échap limité à la liste. Tests DOM contrôlés et Employés réussis, revue visuelle toujours attendue. Présences repris dans le lot ci-dessous ; cabinet/super admin exclus.
3. **Présences — revue des 23 routes livrée le 18 novembre**, avec les cinq vues internes et les composants Absences/Permissions/Historique/Rapport. Pointeuses réorganisées (navigation pleine largeur, horloge et commandes séparées), saisie manuelle élargie, filtres communs, tableaux stables et dialogues natifs. Indicateurs visibles ; palette thématique, Lucide et effets sobres. API, effets, états, calculs, contraintes, valeurs persistées des shifts et documents conservés sur 40 fichiers (`controle-presences/mesures.json`). Tests Présences, Absences, Permissions, sélecteurs et TypeScript sans cache réussis. Audit global : **15 131 classes**, 1 713 hex, 406 emojis, 243 dégradés. **Revue visuelle clair/sombre/mobile et impression comparée à la production à faire par l’utilisateur** ; cases [~] maintenues. Aucun besoin back ajouté. Attendre le feu vert pour le dossier suivant.

Correctif Présences du 18 novembre sur capture : **menu « Plus » contenu dans la colonne et l’écran**, hauteur défilante et ouverture vers le haut si nécessaire ; calcul des onglets corrigé pour un actif long et une barre étroite. Portail hors des zones qui coupent le menu, clavier/Échap/focus et impression vérifiés par tests. Deux tests dédiés et TypeScript ciblé réussis ; invariants des 40 fichiers Présences conservés. Correction sans navigateur, autorisée par l’utilisateur ; revue visuelle réelle toujours en attente. Audit global inchangé.

**Coquille et Paie — 18 novembre :** topbar flottante et sidebar harmonisées entreprise/portefeuille, navigation directement sous le logo et carte de compte en bas (disposition white-label conservée). Identité partagée : logo entreprise plus grand, Konza en repli, erreur d’image et mise à jour gérées ; loaders de page/section/écran cohérents, comportement admin/cabinet conservé. Détail de paie restructuré : brut/retenues/net visibles, commandes regroupées, aperçu officiel isolé et confirmation native ; retouches sur les neuf routes et menus de ligne hors de la zone de découpe du tableau. Paie : **0 classe de palette dans les interfaces** (35 conservées dans le composant imprimable protégé). Empreintes avant/après sur 31 sources, scénarios de statuts/droits/actions/logos et TypeScript sans cache réussis ; documents et calculs conservés. Voir `controle-coquille-paie/`. Audit global : **13 415 classes**, 1 675 hex. Cases [~] maintenues ; revue visuelle réelle en attente. Messages et Notifications déjà validés par l’utilisateur : ces pages restent inchangées. Voir le lot Congés ci-dessous.

4. **Mission 3** : finir la refonte de l'espace entreprise et du Portefeuille, puis les pages publiques (Accueil, À propos, Contact, Auth, Blog et détail).
5. **Mission 4 : liaison back** des six contrats existants livrée le 19 novembre sur autorisation utilisateur ; voir `LIAISON-BACKEND.md`. `BACKEND.md` référencé historiquement est absent du dépôt : contrats TypeScript, REFONTE et PERSONNALISATION utilisés. Déploiement distant et extensions sans interface actuelle restent séparés.
6. **Mission 5 : assistant Konza** selon `ASSISTANT.md`. En dernier.
7. Cabinet et super admin : plus tard (le super admin pourra être traité par Claude).

**Lot du 18 novembre — cloche, navigation et Congés :** Messages et Notifications validés par l’utilisateur, sans modification de leurs pages. Popup des cinq notifications récentes ; Demandes et compteurs aux couleurs du thème, groupes de navigation clarifiés entreprise/portefeuille. Treize routes Congés et trois composants revus : filtres, tableaux défilants, graphiques et en-têtes ; raccourcis redondants retirés. API, règles, callbacks et documents conservés (empreintes `controle-conges/mesures.json`). Tests et TypeScript sans cache réussis. Audit : 13 415 → 12 254 classes de palette ; 1 675 → 1 648 hex. Congés reste [~] : revue visuelle utilisateur en attente. Attendre le feu vert ; suite proposée : Matériel et Formation, selon le suivi.

**Ajustements sur captures — 18 novembre :** sidebar entreprise/portefeuille réduite à 244 px (68 px repliée), espace supérieur resserré, double K clair/sombre corrigé. Compte et déconnexion réunis dans le pied : nom, rôle, e-mail de session et bouton explicite. Congés : liste À traiter, couleur principale à la place des accents verts concernés, Planification des départs en premier ; Soldes reste accessible. Lecteur de documents sur détail/suivi/programme : ajustement à la largeur, zoom et plein écran, originaux et exports conservés. Tests fonctionnels et TypeScript sans cache réussis ; audit global inchangé (12 254 classes, 1 648 hex). Revue visuelle attendue, cases [~] maintenues.

**Priorité utilisateur — aperçu bulletin avant généralisation :** ajustements sidebar/Congés acceptés. Bouton de réduction ancré en haut à droite dans les deux états. Démo du bulletin courant accessible sur `/paie/demo-payroll-0` (Laure), via les composants officiels inchangés ; détail de lecture et configuration démo complétés, aucune écriture/export simulé. HTTP 200 et dix scripts contrôlés, tests démo/navigation/invariants réussis. Démo acceptée ; lecteur généralisé dans le lot ci-dessous. Ne pas modifier les documents officiels.

**Lecteurs de documents — 18 novembre :** démo bulletin acceptée ; affichage initial du bulletin entier corrigé (ajustement largeur + hauteur). Lecteur étendu à Paie/Ma paie, aperçus Absences, modales communes Prêts/Permissions, rapports Présences journalier/hebdomadaire, journal de paie, modèles bulletin/facture et feuille d’émargement Formation. Zoom, plein écran, clavier/Échap/focus ; contenu A4 et identifiants conservés. Empreintes métier/documentaires sur dix sources (`controle-lecteurs-documents/mesures.json`), contrôles existants et TypeScript sans cache réussis. Audit : 12 254 → 12 253 classes, 1 648 → 1 647 hex. Cabinet/super admin et sorties officielles inchangés. Revue visuelle utilisateur attendue, cases [~]. Suite proposée après retour : Matériel/Formation selon le suivi.

**Lot Recrutement et ajustements Paie — 18 novembre :** bulletin à 72 % par défaut, commande de sidebar alignée avec le logo dans les deux états. Liste Paie : correction du récap qui additionnait seulement CNSS + ITS ; affichage désormais fondé sur `totalDeductions` du serveur, intitulé Retenues salariales. Détail des retenues et charges employeur issu des lignes du bulletin, y compris taxes configurées et indemnités ; aucun recalcul de paie. Recrutement : **17 routes revues**, dont six routes récentes réintégrées à l’inventaire ; offres en étapes, agenda, dossier candidat, formulaires avec rubriques, éditeur/aperçu des e-mails et navigation commune. API/effets/états/droits/validations/callbacks/exports préservés sur les vingt sources initiales (`controle-recrutement/mesures.json`). Palette du lot : 59 → 0 ; audit global : 12 253 → 12 194, emojis 406 → 405. Tests, neuf vues SSR avec fixtures, TypeScript et chargement HTTP/scripts réussis. Démo lecture seule disponible ; aucun backend ni document officiel modifié. Cases [~], revue visuelle utilisateur attendue ; attendre le retour sur ce lot avant le suivant.

**Correctif Contrat/démo et récapitulatif Paie — 18 novembre :** historique `/contracts/generation/employee/demo-patrick` couvert en lecture seule (liste vide, aucun faux contrat créé), inconnus et accès employés bornés. Fiche contrat : erreur de chargement gérée et bouton Réessayer au lieu d’un rejet non traité. Carte Total des retenues limitée au total ; lignes détaillées uniquement dans Récapitulatif, sans doubler CNSS/ITS. Coût employeur de démo complété avec montants et lignes patronales figés cohérents ; total affiché depuis la donnée, sans calcul runtime. Tests démo/chargement contrat/récapitulatif, garde-fous Paie/documents et TypeScript sans cache réussis. Backend et documents officiels inchangés ; revue visuelle attendue.

**Paramètres — 18 novembre :** onze routes restructurées : accueil par domaines, navigation commune, listes départements/utilisateurs, rubriques et tableaux adaptés aux écrans étroits. Sélection des modèles bulletin/facture ouvrant le lecteur (zoom initial 72 %, plein écran), couleurs et blocs conservés ; éditeur et documents officiels inchangés. Démo des données complémentaires en lecture seule, sans invitation ni paiement simulé. Palette des treize sources : 1454 → 0 ; audit global : 12 194 → 10 740 classes, 1 647 → 1 646 hex, 405 → 399 emojis. Onze vues et interactions des modèles testées ; empreintes métier/documentaires conservées. Cases [~], revue visuelle clair/sombre/mobile par l’utilisateur encore attendue ; aucun backend modifié.

**Utilisateurs, Rapports et composants communs — 18 novembre :** utilisateurs en liste par défaut, grille quatre colonnes sur grand écran, pagination 10/20/30/40/50 et retour en première page après filtrage. Les seize routes Rapports et la comptabilité PME dédiée sont revues ; cinq autres variantes PME héritent par réexport. Rubriques accessibles sur les analyses longues, tableaux défilants, graphiques thématiques sans grille et suppression des commandes sans action. Alertes, notifications temps réel, rappels et blocages d’abonnement harmonisés ; piles coordonnées et panneau de détail natif. Rôles, appels API/sockets, minuteries, exports et documents conservés ; cabinet/super admin conservent leur rendu. Palette du lot Rapports : 601 → 46 (reste protégé imprimable) ; audit global : 10 740 → 10 014. Tests de rendu des 17 vues, interactions utilisateurs, feedback, panneau et TypeScript réussis ; HTTP 200 + 19 scripts vérifiés. Cases [~] maintenues : revue visuelle réelle et comparaison d’impression à faire par l’utilisateur. Attendre son retour avant le prochain module.

**Correctifs Rapports/toasts et Performance — 18 novembre :** variation de paie absente affichée « — » sans plantage ; accueil Rapports recomposé en pleine largeur avec trois entrées d’analyse, indicateurs et sections lisibles, absence de données distincte de zéro. Toasts sans surface défilante, secondes et barre de temps restant ; durées de fermeture conservées et pause clavier/survol des toasts maintenue. Ancien widget Bienvenue retiré des coquilles entreprise/PME, cabinet inchangé. Les onze routes Performance et leurs deux variantes PME sont livrées : évaluations en lignes, indicateurs prioritaires, campagnes/grilles plus lisibles, objectifs et dossiers individuels, fenêtres natives. API, autorisations, pondérations, calculs et fiche imprimable conservés sur 23 sources ; palette 2014 → 165, solde réservé au document et à ses dépendances ; audit global 10 014 → 8 165. Démo Performance de lecture seule ajoutée, aucune notation/décision simulée. Tests et TypeScript réussis ; HTTP 200 et 22 scripts contrôlés. Cases [~], revue visuelle utilisateur et impression comparée encore attendues.

## État par module (détail page par page : `INVENTAIRE.md`)

| Module | Validées `[x]` | Livrées `[~]` | À faire `[ ]` |
|---|---|---|---|
| admin (phase 2) | 0 | 0 | 27 |
| apparence | 0 | 2 | 0 |
| audit | 0 | 1 | 0 |
| avis | 0 | 1 | 0 |
| cabinet (phase 2) | 0 | 0 | 30 |
| cnss-declaration | 0 | 1 | 0 |
| conges | 0 | 13 | 0 |
| contrats | 0 | 5 | 0 |
| dashboard | 0 | 1 | 0 |
| demandes | 0 | 1 | 0 |
| documents | 0 | 3 | 0 |
| employes | 0 | 8 | 0 |
| finances | 0 | 1 | 0 |
| forbidden | 0 | 1 | 0 |
| formation | 0 | 1 | 0 |
| loans | 0 | 10 | 0 |
| ma-paie | 0 | 1 | 0 |
| ma-signature | 0 | 1 | 0 |
| materiel | 0 | 1 | 0 |
| messages | 1 | 0 | 0 |
| mon-profil | 0 | 1 | 0 |
| notifications | 1 | 0 | 0 |
| offline | 0 | 1 | 0 |
| onboarding | 0 | 1 | 0 |
| paie | 0 | 9 | 0 |
| parametres | 0 | 11 | 0 |
| performance | 0 | 11 | 0 |
| pme | 0 | 55 | 0 |
| portefeuille | 0 | 17 | 0 |
| presences | 0 | 23 | 0 |
| pricing | 0 | 1 | 0 |
| primes | 0 | 1 | 0 |
| Public, authentification et portails | 0 | 15 | 22 |
| rapports | 0 | 16 | 0 |
| recrutement | 0 | 17 | 0 |
| rh-blog | 0 | 3 | 0 |
| success | 0 | 1 | 0 |

## Fonctions récentes — liaison front/back

> Les six adaptateurs réels sont implémentés et testés le 19 novembre. État ci-dessous limité aux contrats des vues existantes ; extensions, déploiement et fonctionnement hors démo décrits dans `LIAISON-BACKEND.md`. Le fichier `BACKEND.md` anciennement référencé n’est pas présent dans ce dépôt.

| Fonction | Interface | Adaptateur démo | Adaptateur API | Drapeau | État |
|---|---|---|---|---|---|
| Tâches (perso + assignées) | [~] intégrée à Ma journée et aperçu design-system | [~] livré et testé | [~] HTTP réel testé | `NEXT_PUBLIC_FEATURE_TASKS_API` | branché/testé localement |
| Événements du jour + réactions | [~] intégrée à Ma journée et aperçu design-system | [~] livré et testé | [~] HTTP réel testé | `NEXT_PUBLIC_FEATURE_DAYEVENTS_API` | branché/testé localement |
| Ancienneté (notifications) | [~] intégrée à Ma journée | [~] livré et testé | [~] HTTP réel testé | `NEXT_PUBLIC_FEATURE_ANNIVERSARIES_API` | branché/testé localement |
| Annonces admin / Bienvenue | [~] lecture dans Ma journée / événements | [~] livré et testé | [~] HTTP réel testé | `NEXT_PUBLIC_FEATURE_ANNOUNCEMENTS_API` | branché/testé localement |
| Aperçu de journée | [~] horaires, fériés, absents dans Ma journée | [~] livré et testé | [~] HTTP réel testé | `NEXT_PUBLIC_FEATURE_DAYOVERVIEW_API` | branché/testé localement |
| Apparence (couleurs entreprise + personnalisation) | [~] page dédiée, liens Mon compte / Entreprise, moteur et aperçu livrés | [~] stockage local, politique et contrastes testés | [~] HTTP réel + mode serveur testés | `NEXT_PUBLIC_FEATURE_APPEARANCE_API` | branché/testé localement |

## Décisions actives

- 14 novembre 2026 — **Portefeuille sorti de la phase 2** (demande de l'utilisateur : pages de gestion multi-entreprise prioritaires). `theme-legacy` retiré du layout portefeuille ; il reste sur le cabinet et le super admin.

Les 12 décisions de cadrage sont dans `REFONTE.md` §14 (source de vérité). Décisions récentes :

- 13 novembre 2026 : enrichissement Employés demandé par l’utilisateur. Ajout ciblé des agrégats administratifs CNSS/ITS côté serveur dans le récapitulatif existant, sans migration ni modification des retenues. Les libellés de paie ne constituent pas une preuve d’immatriculation ou de dépôt de déclaration ; les flags métier restent inchangés.

- 13 novembre 2026 : l’utilisateur reporte la revue visuelle générale clair/sombre/mobile à la fin et autorise la poursuite des dossiers selon REFONTE.md, notamment Matériel, Formation, Notifications, Pricing/Succès, Documents et Déclaration CNSS. Les cases restent [~] jusqu’à cette revue.

### 12 novembre 2026 — Avancer par module complet

- L’utilisateur autorise explicitement la fin du dossier Prêts avec toutes ses sous-routes, sans nouvel arrêt entre chaque page. Cette instruction remplace pour ce lot la pause systématique après chaque route.
- Garder les sous-routes et variantes existantes ; ne pas inventer de routes manquantes. Livrer le module puis faire le compte rendu avant de commencer Congés.
- La validation visuelle reste distincte des vérifications de compilation et de chargement ; conserver `[~]` tant que cette revue n’est pas faite.


## Règles d'économie de crédits (à respecter à chaque session)

1. Lis ce fichier seulement. Pour trouver les prochaines pages : cherche les `| [ ]` du module dans `INVENTAIRE.md`.
2. Ne tente PAS d'ouvrir un navigateur ou une application native. L'utilisateur fait la revue visuelle lui-même. Pas de captures, pas de relances de serveur inutiles.
3. Lance le contrôle de types et les tests UNE fois par lot de pages, pas après chaque fichier.
4. Modifie les fichiers en place : ne réécris pas un fichier entier pour changer quelques lignes. Garde les fins de ligne du fichier d'origine (ne convertis pas LF en CRLF).
5. Compte rendu en **10 lignes maximum** : pages livrées, fichiers clés, points d'attention, ce qui reste, besoins back. Ajoute une entrée courte (8 lignes max) en fin de `JOURNAL.md`.
6. Mets à jour seulement : la case de la page dans `INVENTAIRE.md`, le tableau « État par module » et « Prochaine action ».

**25 novembre — Incidents [~] :** capture, regroupement, canaux et écran super admin implémentés ; e-mails sur consentement personnel, désactivés par défaut. Migration additive préparée, non appliquée sur base réelle. Activation et limites : backend/docs/INCIDENTS-ACTIVATION.md. Décodage des source maps privées et webhook optionnel restent à livrer. Rapport de paie : détail des charges, contrôles individuels, évolution et pagination ajoutés ; cache et nouveaux exports restent à terminer.

25 novembre — Sécurité incidents : quatre risques de fuite corrigés (JSON sensible, jetons de routes, identifiants URL de pile, version libre). 35 tests ciblés réussis ; périmètre et limites dans backend/docs/INCIDENTS-SECURITY.md.

25 novembre — Revue sécurité globale ouverte : cache des pages privées, origines WebSocket, import des primes et logs de paiement corrigés. Rapport détaillé backend/docs/APPLICATION-SECURITY-REVIEW.md. 236/250 tests globaux réussis (suite paie mal configurée), 10 tests ciblés après corrections réussis. Base réelle et audit dépendances non validés.

25 novembre — Sécurité deuxième passe : rattachements entreprise/cabinet/portefeuille révalidés, refresh atomique et sessions expirées refusées ; traitement Chariow non signé neutralisé au profit du polling existant. 30 tests ciblés sessions et HTTP réussis. Revue globale encore ouverte.
