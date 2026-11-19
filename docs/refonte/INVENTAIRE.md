# INVENTAIRE DES PAGES ET COMPOSANTS

> Fichier de référence, **gros**. Ne le lis pas en entier. Pour trouver les prochaines pages : cherche les lignes `| [ ]` du module concerné (grep). Après chaque page livrée, change uniquement la case de CETTE page (`[ ]` → `[~]`) et ajoute une note courte (une ligne). `[~]` = livrée, revue visuelle en attente ; `[x]` = validée par l'utilisateur.

Inventaire du 12 novembre 2026 : **308 pages**. Cases de suivi de la future refonte ; validation utilisateur en attente.

Les trois images sont désormais dans `docs/refonte/refs/` (déplacées depuis le dossier historique). Le kit prime : fond gris-blanc des téléphones, cartes douces, orange/vert/moutarde.

Relevé statique : couleurs en dur = classes de palette ou couleurs littérales dans le fichier. Les imports des pages déléguées restent à vérifier visuellement. Toutes les routes héritent aussi du layout racine hors tokens (fonds slate, halos bleu/indigo). Les couleurs fixes des documents protégés sont à conserver.

### Module : admin

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [ ] | `/admin` | `admin/(protected)/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/actions` | `admin/(protected)/actions/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/affiliates` | `admin/(protected)/affiliates/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/analytics` | `admin/(protected)/analytics/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/billing` | `admin/(protected)/billing/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/blog` | `admin/(protected)/blog/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/blog/[slug]/edit` | `admin/(protected)/blog/[slug]/edit/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/blog/nouveau` | `admin/(protected)/blog/nouveau/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/cabinets` | `admin/(protected)/cabinets/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/companies` | `admin/companies/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/companies/[id]` | `admin/companies/[id]/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/companies/[id]/gestion` | `admin/companies/[id]/gestion/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/comptes` | `admin/(protected)/comptes/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/errors` | `admin/(protected)/errors/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/facturation` | `admin/(protected)/facturation/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/login` | `admin/login/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/mes-logs` | `admin/mes-logs/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/monitoring` | `admin/(protected)/monitoring/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/paiements` | `admin/(protected)/paiements/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/portefeuilles` | `admin/(protected)/portefeuilles/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/push-notifications` | `admin/(protected)/push-notifications/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/register` | `admin/register/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/serveur` | `admin/(protected)/serveur/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/settings` | `admin/(protected)/settings/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/subscriptions` | `admin/(protected)/subscriptions/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/user-activity` | `admin/(protected)/user-activity/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/admin/users` | `admin/(protected)/users/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
### Module : apparence (ajoutée pendant la refonte)

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/apparence` | `(dashboard)/apparence/page.tsx` | Page personnelle et vue entreprise via `?scope=company` livrées en démo ; revue visuelle en attente |
| [~] | `/pme/[companyId]/apparence` | `pme/[companyId]/apparence/page.tsx` | Même page, entreprise active bornée au contexte PME |

### Module : suggestions produit

| État | Route | Source | Notes |
|---|---|---|---|
| [~] | `/suggestions` | `(dashboard)/suggestions/page.tsx` | Formulaire dédié depuis les raccourcis du Pilotage Admin/RH ; envoi réel catégorisé, démo sans envoi ; revue visuelle attendue. |

### Module : audit

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/audit` | `(dashboard)/audit/page.tsx` | Cadre commun intégré (Claude, 14 nov.) : couleurs, champs, tableaux et accessibilité via ModulePageFrame ; logique, API et permissions inchangées. Revue visuelle en attente. |

### Module : avis

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/avis` | `(dashboard)/avis/page.tsx` | Cadre commun intégré (Claude, 14 nov.) : couleurs, champs, tableaux et accessibilité via ModulePageFrame ; logique, API et permissions inchangées. Revue visuelle en attente. |

### Module : cabinet

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [ ] | `/cabinet/[cabinetId]` | `(dashboard)/cabinet/[cabinetId]/page.tsx` | Styles délégués : composants importés à vérifier ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/abonnement` | `(dashboard)/cabinet/[cabinetId]/abonnement/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/ajouter-pme` | `(dashboard)/cabinet/[cabinetId]/ajouter-pme/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/cloture` | `(dashboard)/cabinet/[cabinetId]/cloture/page.tsx` | Couleurs en dur ; documents / exports : **NE PAS TOUCHER** (interface autour à distinguer) ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/dashboard` | `(dashboard)/cabinet/[cabinetId]/dashboard/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/page.tsx` | Styles délégués : composants importés à vérifier ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/acces` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/acces/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/bulletins` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/bulletins/page.tsx` | Styles délégués : composants importés à vérifier ; documents / exports : **NE PAS TOUCHER** (interface autour à distinguer) ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/bulletins/[payrollId]` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/bulletins/[payrollId]/page.tsx` | Couleurs en dur ; documents / exports : **NE PAS TOUCHER** (interface autour à distinguer) ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/conges` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/conges/page.tsx` | Styles délégués : composants importés à vérifier ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/contrats` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/contrats/page.tsx` | Styles délégués : composants importés à vérifier ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/dashboard` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/dashboard/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/declarations` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/declarations/page.tsx` | Couleurs en dur ; documents / exports : **NE PAS TOUCHER** (interface autour à distinguer) ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/documents` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/documents/page.tsx` | Styles délégués : composants importés à vérifier ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/employes` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/employes/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/formation` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/formation/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/materiel` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/materiel/page.tsx` | Styles délégués : composants importés à vérifier ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/paie` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/paie/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/parametres` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/parametres/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/performance` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/performance/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/presences` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/presences/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/rapports` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/rapports/page.tsx` | Styles délégués : composants importés à vérifier ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/recrutement` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/recrutement/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/recrutement/[jobId]` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/recrutement/[jobId]/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/recrutement/[jobId]/candidats/[candidateId]` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/recrutement/[jobId]/candidats/[candidateId]/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/recrutement/nouvelle` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/recrutement/nouvelle/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/entreprise/[companyId]/resume-presences` | `(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/resume-presences/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/gestionnaires` | `(dashboard)/cabinet/[cabinetId]/gestionnaires/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/mes-pme` | `(dashboard)/cabinet/[cabinetId]/mes-pme/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
| [ ] | `/cabinet/[cabinetId]/parametres` | `(dashboard)/cabinet/[cabinetId]/parametres/page.tsx` | Couleurs en dur ; **reporté — phase 2** |
### Module : cnss-declaration

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/cnss-declaration` | `(dashboard)/cnss-declaration/page.tsx` | Interface refondue ; revue visuelle finale à effectuer ; documents / exports : **NE PAS TOUCHER** (interface autour à distinguer) |

### Module : conges

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/conges` | `(dashboard)/conges/page.tsx` | À traiter en liste ; accents du thème ; revue visuelle en attente |
| [~] | `/conges/[id]` | `(dashboard)/conges/[id]/page.tsx` | Lecteur ajustable (largeur, zoom, plein écran), documents originaux conservés ; revue visuelle en attente ; documents / exports : **NE PAS TOUCHER** (inchangés) |
| [~] | `/conges/analyse` | `(dashboard)/conges/analyse/page.tsx` | Délégation conservée ; interface livrée ; revue visuelle en attente |
| [~] | `/conges/calendrier` | `(dashboard)/conges/calendrier/page.tsx` | Interface livrée ; revue visuelle en attente |
| [~] | `/conges/diagrammes` | `(dashboard)/conges/diagrammes/page.tsx` | Interface livrée ; revue visuelle en attente ; documents / exports : **NE PAS TOUCHER** (inchangés) |
| [~] | `/conges/gestion` | `(dashboard)/conges/gestion/page.tsx` | Interface livrée ; revue visuelle en attente |
| [~] | `/conges/historique` | `(dashboard)/conges/historique/page.tsx` | Interface livrée ; revue visuelle en attente |
| [~] | `/conges/mon-espace` | `(dashboard)/conges/mon-espace/page.tsx` | Interface livrée ; revue visuelle en attente |
| [~] | `/conges/nouveau` | `(dashboard)/conges/nouveau/page.tsx` | Interface livrée ; revue visuelle en attente |
| [~] | `/conges/planning` | `(dashboard)/conges/planning/page.tsx` | Lecteur ajustable (largeur, zoom, plein écran), documents originaux conservés ; revue visuelle en attente ; documents / exports : **NE PAS TOUCHER** (inchangés) |
| [~] | `/conges/programme` | `(dashboard)/conges/programme/page.tsx` | Lecteur ajustable (largeur, zoom, plein écran), documents originaux conservés ; revue visuelle en attente ; documents / exports : **NE PAS TOUCHER** (inchangés) |
| [~] | `/conges/provision` | `(dashboard)/conges/provision/page.tsx` | Interface livrée ; revue visuelle en attente |
| [~] | `/conges/soldes` | `(dashboard)/conges/soldes/page.tsx` | Interface livrée ; revue visuelle en attente |

### Module : contrats

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/contrats` | `(dashboard)/contrats/page.tsx` | Cadre commun intégré (Claude, 14 nov.) : couleurs, champs, tableaux et accessibilité via ModulePageFrame ; logique, API et permissions inchangées. Revue visuelle en attente. |
| [~] | `/contrats/employe/[employeeId]` | `(dashboard)/contrats/employe/[employeeId]/page.tsx` | Cadre commun intégré (Claude, 14 nov., lot 2) ; logique, API, exports et documents inchangés. Contrat .docx généré par le back : inchangé. Revue visuelle et test d'impression en attente. |
| [~] | `/contrats/generer` | `(dashboard)/contrats/generer/page.tsx` | Cadre commun intégré (Claude, 14 nov., lot 2) ; logique, API, exports et documents inchangés. Contrat .docx généré par le back : inchangé. Revue visuelle et test d'impression en attente. |
| [~] | `/contrats/rupture` | `(dashboard)/contrats/rupture/page.tsx` | Cadre commun intégré (Claude, 14 nov., lot 2) ; logique, API, exports et documents inchangés. Contrat .docx généré par le back : inchangé. Revue visuelle et test d'impression en attente. |
| [~] | `/contrats/rupture/pse` | `(dashboard)/contrats/rupture/pse/page.tsx` | Cadre commun intégré (Claude, 14 nov.) : couleurs, champs, tableaux et accessibilité via ModulePageFrame ; logique, API et permissions inchangées. Revue visuelle en attente. |

### Module : dashboard

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/dashboard` | `(dashboard)/dashboard/page.tsx` | Pilotage RH et Ma journée livrés (Codex, voir JOURNAL). Revue visuelle en attente. |

### Module : demandes

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/demandes` | `(dashboard)/demandes/page.tsx` | Cadre commun intégré (Claude, 14 nov.) : couleurs, champs, tableaux et accessibilité via ModulePageFrame ; logique, API et permissions inchangées. Revue visuelle en attente. |

### Module : documents

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/documents` | `(dashboard)/documents/page.tsx` | Interface refondue ; revue visuelle finale à effectuer |
| [~] | `/documents/generate` | `(dashboard)/documents/generate/page.tsx` | Interface refondue ; revue visuelle finale à effectuer |
| [~] | `/documents/legal` | `(dashboard)/documents/legal/page.tsx` | Interface refondue ; revue visuelle finale à effectuer |

### Module : employes

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/employes` | `(dashboard)/employes/page.tsx` | Annuaire : liste par défaut, grille quatre cartes sur grand écran, actions visibles et statistiques toujours dépliées, tableau mobile étiqueté. Revue visuelle en attente. |
| [~] | `/employes/[id]` | `(dashboard)/employes/[id]/page.tsx` | Réorganisation UX après refus du rendu cosmétique (17 nov.) : en-tête compact, actions explicites uniques, synthèse, six rubriques dépliables, CNSS contextualisée, rémunération et listes revues. 58 champs et brouillon CNSS conservés ; API/droits/calculs/PDF inchangés. Types, clavier, états et contrastes testés ; nouveau rendu à valider par l’utilisateur. Documents : **NE PAS TOUCHER**. |
| [~] | `/employes/[id]/conges` | `(dashboard)/employes/[id]/conges/page.tsx` | Solde du cycle regroupé, filtre année commun, historique et état vide soignés, statuts fixes et responsive. API et calculs du solde conservés ; revue visuelle en attente. |
| [~] | `/employes/[id]/edit` | `(dashboard)/employes/[id]/edit/page.tsx` | Modification restructurée : sept rubriques horizontales au clavier, identité contextualisée, photo et champs alignés, sélecteurs communs, sauvegarde unique et chargement en erreur explicite. Données/droits/API/calculs conservés ; revue visuelle en attente. |
| [~] | `/employes/[id]/primes` | `(dashboard)/employes/[id]/primes/page.tsx` | Primes attribuées et quantités avant les réglages, regroupements fiscaux conservés, modale saisie/aperçu distincts, état sans catalogue compact et erreur distinguée, sélecteurs communs ; ancienneté, fréquences et calculs inchangés. Revue visuelle en attente. |
| [~] | `/employes/import` | `(dashboard)/employes/import/page.tsx` | Parcours horizontal en quatre étapes, fichier et modèle côte à côte, correspondance FancySelect, validation et résultat soignés, erreurs visibles ; revue visuelle en attente. Modèle/export : **NE PAS TOUCHER**, téléchargement strictement inchangé. |
| [~] | `/employes/nouveau` | `(dashboard)/employes/nouveau/page.tsx` | Choix illustré des parcours individuel/collectif, actions alignées, entrées animées et réduction des mouvements ; titre remis en haut. Revue visuelle en attente. |
| [~] | `/employes/nouveau/formulaire` | `(dashboard)/employes/nouveau/formulaire/page.tsx` | Parcours horizontal en haut (demande utilisateur), formulaire élargi, photo à droite, confirmations encourageantes et célébration après création ; mouvements réduits. Champs/validations/API conservés ; revue visuelle en attente. |

### Module : finances

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/finances` | `(dashboard)/finances/page.tsx` | Cadre commun intégré (Claude, 14 nov.) : couleurs, champs, tableaux et accessibilité via ModulePageFrame ; logique, API et permissions inchangées. Revue visuelle en attente. |

### Module : forbidden

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/forbidden` | `(dashboard)/forbidden/page.tsx` | Utilise AccessDenied (liens en tokens) et le nouveau ErrorLayout (Claude, 14 nov., lot 3). Revue visuelle en attente. |

### Module : formation

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/formation` | `(dashboard)/formation/page.tsx` | Interface refondue ; revue visuelle finale à effectuer |

### Module : loans

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/loans` | `(dashboard)/loans/page.tsx` | Gestion complète et onglets livrés ; revue visuelle en attente ; documents / exports : **NE PAS TOUCHER** (inchangés) |
| [~] | `/loans/dashboard` | `(dashboard)/loans/dashboard/page.tsx` | Tableau de bord et graphiques livrés ; revue visuelle en attente ; export : **NE PAS TOUCHER** |
| [~] | `/loans/mon-espace` | `(dashboard)/loans/mon-espace/page.tsx` | Liste/détail/suivi livrés ; revue visuelle en attente ; documents / exports : **NE PAS TOUCHER** (inchangés) |
| [~] | `/loans/nouveau` | `(dashboard)/loans/nouveau/page.tsx` | Parcours en quatre étapes livré ; revue visuelle en attente ; documents / exports : **NE PAS TOUCHER** (aperçu inchangé) |
| [~] | `/loans/rapport` | `(dashboard)/loans/rapport/page.tsx` | Rapport mensuel/annuel et pilotage des demandes livrés ; revue visuelle en attente |
| [~] | `/loans/releve` | `(dashboard)/loans/releve/page.tsx` | Liste et filtres livrés ; revue visuelle en attente |
| [~] | `/loans/releve/[employeeId]` | `(dashboard)/loans/releve/[employeeId]/page.tsx` | Coquille et commandes livrées ; revue visuelle en attente ; contenu du relevé imprimable : **NE PAS TOUCHER** (inchangé) |
| [~] | `/loans/suivi-dettes` | `(dashboard)/loans/suivi-dettes/page.tsx` | Liste et filtres livrés ; revue visuelle en attente ; export : **NE PAS TOUCHER** (handler inchangé) |
| [~] | `/loans/suivi-dettes/[employeeId]` | `(dashboard)/loans/suivi-dettes/[employeeId]/page.tsx` | Fiche, historique, graphique et modales livrés ; revue visuelle en attente |
| [~] | `/loans/validations` | `(dashboard)/loans/validations/page.tsx` | Demandes à traiter livrées ; revue visuelle en attente ; documents / exports : **NE PAS TOUCHER** (inchangés) |

### Module : ma-paie

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/ma-paie` | `(dashboard)/ma-paie/page.tsx` | Mission 1, 17 nov. : page absente restaurée à l’identique depuis Git pour réparer le réexport PME. Le cadre annoncé n’est pas présent ; intégration et test d’impression à reprendre. Bulletin, handlers et exports : **NE PAS TOUCHER**. ; lecteur ajustable, zoom et plein écran ; documents officiels **NE PAS TOUCHER** (conservés) |

### Module : ma-signature

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/ma-signature` | `(dashboard)/ma-signature/page.tsx` | Cadre commun intégré (Claude, 14 nov.) : couleurs, champs, tableaux et accessibilité via ModulePageFrame ; logique, API et permissions inchangées. Revue visuelle en attente. |

### Module : materiel

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/materiel` | `(dashboard)/materiel/page.tsx` | Interface refondue ; revue visuelle finale à effectuer |

### Module : messages

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [x] | `/messages` | `(dashboard)/messages/page.tsx` | Chat harmonisé avec les tokens et primitives ; erreurs de chargement des discussions/contacts distinguées des états vides. API, polling, confidentialité et envoi préservés ; validé par l’utilisateur le 18 novembre 2026 |

### Module : mon-profil

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/mon-profil` | `(dashboard)/mon-profil/page.tsx` | Mon compte livré ; revue visuelle en attente |

### Module : notifications

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [x] | `/notifications` | `(dashboard)/notifications/page.tsx` | Interface refondue ; validé par l’utilisateur le 18 novembre 2026 |

### Module : offline

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/offline` | `(dashboard)/offline/page.tsx` | Refaite avec les tokens et le nouveau ErrorLayout ; faux compteur « 3 modifications » retiré (Claude, 14 nov., lot 3). Revue visuelle en attente. |

### Module : onboarding

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/onboarding` | `(dashboard)/onboarding/page.tsx` | Cadre commun intégré (Claude, 14 nov.) : couleurs, champs, tableaux et accessibilité via ModulePageFrame ; logique, API et permissions inchangées. Revue visuelle en attente. |

### Module : paie

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/paie` | `(dashboard)/paie/page.tsx` | Retouches du 18 nov. : couleurs/titres/contrastes harmonisés, parcours et données conservés. Tests et TypeScript réussis ; revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. |
| [~] | `/paie/[id]` | `(dashboard)/paie/[id]/page.tsx` | Détail restructuré : brut/retenues/net, actions uniques, aperçu officiel séparé et confirmation native. Tests et TypeScript réussis ; revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. ; lecteur ajustable, zoom et plein écran ; documents officiels **NE PAS TOUCHER** (conservés) |
| [~] | `/paie/[id]/modifier` | `(dashboard)/paie/[id]/modifier/page.tsx` | Retouches du 18 nov. : couleurs/titres/contrastes harmonisés, parcours et données conservés. Tests et TypeScript réussis ; revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. |
| [~] | `/paie/comptabilite` | `(dashboard)/paie/comptabilite/page.tsx` | Retouches du 18 nov. : couleurs/titres/contrastes harmonisés, parcours et données conservés. Tests et TypeScript réussis ; revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. |
| [~] | `/paie/impayes` | `(dashboard)/paie/impayes/page.tsx` | Retouches du 18 nov. : couleurs/titres/contrastes harmonisés, parcours et données conservés. Tests et TypeScript réussis ; revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. |
| [~] | `/paie/manuel` | `(dashboard)/paie/manuel/page.tsx` | Retouches du 18 nov. : couleurs/titres/contrastes harmonisés, parcours et données conservés. Tests et TypeScript réussis ; revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. |
| [~] | `/paie/masse` | `(dashboard)/paie/masse/page.tsx` | Retouches du 18 nov. : couleurs/titres/contrastes harmonisés, parcours et données conservés. Tests et TypeScript réussis ; revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. Limite démo existante : liste employé indisponible sans données serveur. |
| [~] | `/paie/nouveau` | `(dashboard)/paie/nouveau/page.tsx` | Retouches du 18 nov. : couleurs/titres/contrastes harmonisés, parcours et données conservés. Tests et TypeScript réussis ; revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. |
| [~] | `/paie/simulateur` | `(dashboard)/paie/simulateur/page.tsx` | Retouches du 18 nov. : couleurs/titres/contrastes harmonisés, parcours et données conservés. Tests et TypeScript réussis ; revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. |

### Module : parametres

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/parametres` | `(dashboard)/parametres/page.tsx` | Revue du 18 novembre : disposition, navigation et composants thématiques repris ; API et permissions conservées. Revue visuelle en attente. |
| [~] | `/parametres/bulletin` | `(dashboard)/parametres/bulletin/page.tsx` | Revue du 18 novembre : disposition, navigation et composants thématiques repris ; API et permissions conservées. Choix des modèles bulletin/facture avec aperçu ; documents officiels **NE PAS TOUCHER**. Revue visuelle en attente. |
| [~] | `/parametres/circuits` | `(dashboard)/parametres/circuits/page.tsx` | Revue du 18 novembre : disposition, navigation et composants thématiques repris ; API et permissions conservées. Revue visuelle en attente. |
| [~] | `/parametres/departements` | `(dashboard)/parametres/departements/page.tsx` | Revue du 18 novembre : disposition, navigation et composants thématiques repris ; API et permissions conservées. Revue visuelle en attente. |
| [~] | `/parametres/entreprise` | `(dashboard)/parametres/entreprise/page.tsx` | Revue du 18 novembre : disposition, navigation et composants thématiques repris ; API et permissions conservées. Revue visuelle en attente. |
| [~] | `/parametres/paie` | `(dashboard)/parametres/paie/page.tsx` | Revue du 18 novembre : disposition, navigation et composants thématiques repris ; API et permissions conservées. Revue visuelle en attente. |
| [~] | `/parametres/primes` | `(dashboard)/parametres/primes/page.tsx` | Revue du 18 novembre : disposition, navigation et composants thématiques repris ; API et permissions conservées. Revue visuelle en attente. |
| [~] | `/parametres/securite` | `(dashboard)/parametres/securite/page.tsx` | Revue du 18 novembre : disposition, navigation et composants thématiques repris ; API et permissions conservées. Revue visuelle en attente. |
| [~] | `/parametres/subscription` | `(dashboard)/parametres/subscription/page.tsx` | Revue du 18 novembre : disposition, navigation et composants thématiques repris ; API et permissions conservées. Revue visuelle en attente. |
| [~] | `/parametres/taxes` | `(dashboard)/parametres/taxes/page.tsx` | Revue du 18 novembre : disposition, navigation et composants thématiques repris ; API et permissions conservées. Revue visuelle en attente. |
| [~] | `/parametres/users` | `(dashboard)/parametres/users/page.tsx` | Liste par défaut, grille quatre colonnes, pagination de 10 en 10, filtres et actions conservés. Revue visuelle en attente. |

### Module : performance

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/performance` | `(dashboard)/performance/page.tsx` | Revue du 18 novembre : présentation et parcours repris, fenêtres natives, tokens, rôles et calculs conservés. Revue visuelle en attente. |
| [~] | `/performance/carriere` | `(dashboard)/performance/carriere/page.tsx` | Revue du 18 novembre : présentation et parcours repris, fenêtres natives, tokens, rôles et calculs conservés. Revue visuelle en attente. |
| [~] | `/performance/carriere/employe/[id]` | `(dashboard)/performance/carriere/employe/[id]/page.tsx` | Revue du 18 novembre : présentation et parcours repris, fenêtres natives, tokens, rôles et calculs conservés. Revue visuelle en attente. |
| [~] | `/performance/competences` | `(dashboard)/performance/competences/page.tsx` | Revue du 18 novembre : présentation et parcours repris, fenêtres natives, tokens, rôles et calculs conservés. Revue visuelle en attente. |
| [~] | `/performance/competences/employe/[id]` | `(dashboard)/performance/competences/employe/[id]/page.tsx` | Revue du 18 novembre : présentation et parcours repris, fenêtres natives, tokens, rôles et calculs conservés. Revue visuelle en attente. |
| [~] | `/performance/cycles` | `(dashboard)/performance/cycles/page.tsx` | Revue du 18 novembre : présentation et parcours repris, fenêtres natives, tokens, rôles et calculs conservés. Revue visuelle en attente. |
| [~] | `/performance/cycles/[id]` | `(dashboard)/performance/cycles/[id]/page.tsx` | Revue du 18 novembre : présentation et parcours repris, fenêtres natives, tokens, rôles et calculs conservés. Revue visuelle en attente. |
| [~] | `/performance/fiche/[id]` | `(dashboard)/performance/fiche/[id]/page.tsx` | Revue du 18 novembre : présentation et parcours repris, fenêtres natives, tokens, rôles et calculs conservés. Fiche imprimable et dépendances **NE PAS TOUCHER** : conservées. Revue visuelle en attente. |
| [~] | `/performance/modeles` | `(dashboard)/performance/modeles/page.tsx` | Revue du 18 novembre : présentation et parcours repris, fenêtres natives, tokens, rôles et calculs conservés. Revue visuelle en attente. |
| [~] | `/performance/mon-espace` | `(dashboard)/performance/mon-espace/page.tsx` | Revue du 18 novembre : présentation et parcours repris, fenêtres natives, tokens, rôles et calculs conservés. Revue visuelle en attente. |
| [~] | `/performance/objectifs` | `(dashboard)/performance/objectifs/page.tsx` | Revue du 18 novembre : présentation et parcours repris, fenêtres natives, tokens, rôles et calculs conservés. Revue visuelle en attente. |

### Module : pme

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/pme/[companyId]/audit` | `pme/[companyId]/audit/page.tsx` | Hérite par réexport de la page principale intégrée ; routes et permissions inchangées. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/bulletins` | `pme/[companyId]/bulletins/page.tsx` | Cadre commun intégré (lot 3) ; téléchargements inchangés. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/cnss-declaration` | `pme/[companyId]/cnss-declaration/page.tsx` | Délégation conservée ; HTTP/JavaScript vérifiés ; revue visuelle finale à effectuer ; documents / exports : **NE PAS TOUCHER** (interface autour à distinguer) |
| [~] | `/pme/[companyId]/conges` | `pme/[companyId]/conges/page.tsx` | Délégation conservée ; interface livrée ; revue visuelle en attente |
| [~] | `/pme/[companyId]/conges/calendrier` | `pme/[companyId]/conges/calendrier/page.tsx` | Délégation conservée ; interface livrée ; revue visuelle en attente |
| [~] | `/pme/[companyId]/conges/diagrammes` | `pme/[companyId]/conges/diagrammes/page.tsx` | Délégation conservée ; interface livrée ; revue visuelle en attente |
| [~] | `/pme/[companyId]/conges/historique` | `pme/[companyId]/conges/historique/page.tsx` | Délégation conservée ; interface livrée ; revue visuelle en attente |
| [~] | `/pme/[companyId]/conges/mon-espace` | `pme/[companyId]/conges/mon-espace/page.tsx` | Délégation conservée ; interface livrée ; revue visuelle en attente |
| [~] | `/pme/[companyId]/conges/nouveau` | `pme/[companyId]/conges/nouveau/page.tsx` | Délégation conservée ; interface livrée ; revue visuelle en attente |
| [~] | `/pme/[companyId]/conges/provision` | `pme/[companyId]/conges/provision/page.tsx` | Délégation conservée ; interface livrée ; revue visuelle en attente |
| [~] | `/pme/[companyId]/conges/soldes` | `pme/[companyId]/conges/soldes/page.tsx` | Délégation conservée ; interface livrée ; revue visuelle en attente |
| [~] | `/pme/[companyId]/contrats` | `pme/[companyId]/contrats/page.tsx` | Hérite par réexport de la page principale intégrée ; routes et permissions inchangées. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/contrats/rupture` | `pme/[companyId]/contrats/rupture/page.tsx` | Hérite par réexport de la page principale intégrée. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/dashboard` | `pme/[companyId]/dashboard/page.tsx` | Réexporte /dashboard (Pilotage RH et Ma journée déjà livrés). Revue visuelle en attente. |
| [~] | `/pme/[companyId]/demandes` | `pme/[companyId]/demandes/page.tsx` | Hérite par réexport de la page principale intégrée ; routes et permissions inchangées. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/documents` | `pme/[companyId]/documents/page.tsx` | Délégation conservée ; HTTP/JavaScript vérifiés ; revue visuelle finale à effectuer |
| [~] | `/pme/[companyId]/documents/generate` | `pme/[companyId]/documents/generate/page.tsx` | Délégation conservée ; HTTP/JavaScript vérifiés ; revue visuelle finale à effectuer |
| [~] | `/pme/[companyId]/employes` | `pme/[companyId]/employes/page.tsx` | Délégation conservée ; HTTP/JavaScript vérifiés ; revue visuelle finale à effectuer |
| [~] | `/pme/[companyId]/employes/[id]` | `pme/[companyId]/employes/[id]/page.tsx` | Hérite de la fiche réorganisée (17 nov.), délégation inchangée. Nouveau rendu à valider ; aucun nouveau contrôle navigateur/HTTP dans ce lot. |
| [~] | `/pme/[companyId]/employes/[id]/edit` | `pme/[companyId]/employes/[id]/edit/page.tsx` | Hérite de la nouvelle organisation de la page principale ; réexport, routes et droits conservés. Revue visuelle en attente, aucun nouveau contrôle navigateur/HTTP dans ce lot. |
| [~] | `/pme/[companyId]/employes/[id]/primes` | `pme/[companyId]/employes/[id]/primes/page.tsx` | Hérite de la nouvelle organisation de la page principale ; réexport, routes et droits conservés. Revue visuelle en attente, aucun nouveau contrôle navigateur/HTTP dans ce lot. |
| [~] | `/pme/[companyId]/employes/nouveau` | `pme/[companyId]/employes/nouveau/page.tsx` | Délégation conservée ; HTTP/JavaScript vérifiés ; revue visuelle finale à effectuer |
| [~] | `/pme/[companyId]/employes/nouveau/formulaire` | `pme/[companyId]/employes/nouveau/formulaire/page.tsx` | Délégation conservée ; HTTP/JavaScript vérifiés ; revue visuelle finale à effectuer |
| [~] | `/pme/[companyId]/employes/nouveau/import` | `pme/[companyId]/employes/nouveau/import/page.tsx` | Délégation conservée ; HTTP/JavaScript vérifiés ; revue visuelle finale à effectuer |
| [~] | `/pme/[companyId]/formation` | `pme/[companyId]/formation/page.tsx` | Délégation conservée ; HTTP/JavaScript vérifiés ; revue visuelle finale à effectuer |
| [~] | `/pme/[companyId]/loans` | `pme/[companyId]/loans/page.tsx` | Délégation conservée ; HTTP/JavaScript vérifiés ; revue visuelle en attente ; documents / exports : **NE PAS TOUCHER** |
| [~] | `/pme/[companyId]/loans/dashboard` | `pme/[companyId]/loans/dashboard/page.tsx` | Délégation conservée ; HTTP/JavaScript vérifiés ; revue visuelle en attente ; export : **NE PAS TOUCHER** |
| [~] | `/pme/[companyId]/ma-paie` | `pme/[companyId]/ma-paie/page.tsx` | Hérite par réexport de la page principale intégrée. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/materiel` | `pme/[companyId]/materiel/page.tsx` | Délégation conservée ; HTTP/JavaScript vérifiés ; revue visuelle finale à effectuer |
| [~] | `/pme/[companyId]/mon-profil` | `pme/[companyId]/mon-profil/page.tsx` | Même page Mon compte ; compilation et scripts vérifiés, revue visuelle en attente |
| [~] | `/pme/[companyId]/notifications` | `pme/[companyId]/notifications/page.tsx` | Délégation conservée ; HTTP/JavaScript vérifiés ; revue visuelle finale à effectuer |
| [~] | `/pme/[companyId]/paie` | `pme/[companyId]/paie/page.tsx` | Cadre commun intégré (lot 3). Revue visuelle en attente. |
| [~] | `/pme/[companyId]/paie/impayes` | `pme/[companyId]/paie/impayes/page.tsx` | Hérite par réexport de la page principale intégrée ; routes et permissions inchangées. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/parametres` | `pme/[companyId]/parametres/page.tsx` | Cadre commun intégré (lot 3). Revue visuelle en attente. |
| [~] | `/pme/[companyId]/parametres/departements` | `pme/[companyId]/parametres/departements/page.tsx` | Hérite par réexport de la page principale intégrée ; routes et permissions inchangées. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/parametres/entreprise` | `pme/[companyId]/parametres/entreprise/page.tsx` | Hérite par réexport de la page principale intégrée ; routes et permissions inchangées. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/parametres/paie` | `pme/[companyId]/parametres/paie/page.tsx` | Hérite par réexport de la page principale intégrée ; routes et permissions inchangées. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/parametres/primes` | `pme/[companyId]/parametres/primes/page.tsx` | Hérite par réexport de la page principale intégrée ; routes et permissions inchangées. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/parametres/subscription` | `pme/[companyId]/parametres/subscription/page.tsx` | Cadre commun intégré (lot 3). Revue visuelle en attente. |
| [~] | `/pme/[companyId]/parametres/taxes` | `pme/[companyId]/parametres/taxes/page.tsx` | Hérite par réexport de la page principale intégrée ; routes et permissions inchangées. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/parametres/users` | `pme/[companyId]/parametres/users/page.tsx` | Hérite par réexport de la page principale intégrée ; routes et permissions inchangées. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/performance` | `pme/[companyId]/performance/page.tsx` | Revue du 18 novembre : présentation et parcours repris, fenêtres natives, tokens, rôles et calculs conservés. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/performance/objectifs` | `pme/[companyId]/performance/objectifs/page.tsx` | Revue du 18 novembre : présentation et parcours repris, fenêtres natives, tokens, rôles et calculs conservés. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/presences` | `pme/[companyId]/presences/page.tsx` | Cadre commun intégré ; finitions et démo en cours ; rapports / exports : **NE PAS TOUCHER** |
| [~] | `/pme/[companyId]/presences/dashboard` | `pme/[companyId]/presences/dashboard/page.tsx` | Cadre commun intégré ; finitions et démo en cours ; rapports / exports : **NE PAS TOUCHER** |
| [~] | `/pme/[companyId]/presences/pointage` | `pme/[companyId]/presences/pointage/page.tsx` | Cadre commun intégré ; finitions et démo en cours ; rapports / exports : **NE PAS TOUCHER** |
| [~] | `/pme/[companyId]/presences/pointage-manuel` | `pme/[companyId]/presences/pointage-manuel/page.tsx` | Cadre commun intégré ; finitions et démo en cours ; rapports / exports : **NE PAS TOUCHER** |
| [~] | `/pme/[companyId]/presences/resume` | `pme/[companyId]/presences/resume/page.tsx` | Cadre commun intégré ; finitions et démo en cours ; rapports / exports : **NE PAS TOUCHER** |
| [~] | `/pme/[companyId]/primes` | `pme/[companyId]/primes/page.tsx` | Hérite par réexport de la page principale intégrée ; routes et permissions inchangées. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/rapports` | `pme/[companyId]/rapports/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/rapports/analyse-conges` | `pme/[companyId]/rapports/analyse-conges/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/rapports/analyse-paie` | `pme/[companyId]/rapports/analyse-paie/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/rapports/complet` | `pme/[companyId]/rapports/complet/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/rapports/comptabilite` | `pme/[companyId]/rapports/comptabilite/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/pme/[companyId]/rapports/effectifs` | `pme/[companyId]/rapports/effectifs/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |

### Module : portefeuille

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/portefeuille/absences` | `(dashboard)/portefeuille/absences/page.tsx` | Revue du 19 novembre : disposition, tableaux, tokens et fenêtres harmonisés ; API, calculs et exports conservés. Revue visuelle en attente. |
| [~] | `/portefeuille/avis` | `(dashboard)/portefeuille/avis/page.tsx` | Revue du 19 novembre : disposition, tableaux, tokens et fenêtres harmonisés ; API, calculs et exports conservés. Revue visuelle en attente. |
| [~] | `/portefeuille/conges` | `(dashboard)/portefeuille/conges/page.tsx` | Revue du 19 novembre : disposition, tableaux, tokens et fenêtres harmonisés ; API, calculs et exports conservés. Revue visuelle en attente. |
| [~] | `/portefeuille/dashboard` | `(dashboard)/portefeuille/dashboard/page.tsx` | Revue du 19 novembre : disposition, tableaux, tokens et fenêtres harmonisés ; API, calculs et exports conservés. Revue visuelle en attente. |
| [~] | `/portefeuille/demandes` | `(dashboard)/portefeuille/demandes/page.tsx` | Revue du 19 novembre : disposition, tableaux, tokens et fenêtres harmonisés ; API, calculs et exports conservés. Revue visuelle en attente. |
| [~] | `/portefeuille/effectifs` | `(dashboard)/portefeuille/effectifs/page.tsx` | Revue du 19 novembre : disposition, tableaux, tokens et fenêtres harmonisés ; API, calculs et exports conservés. Revue visuelle en attente. |
| [~] | `/portefeuille/employes` | `(dashboard)/portefeuille/employes/page.tsx` | Revue du 19 novembre : disposition, tableaux, tokens et fenêtres harmonisés ; API, calculs et exports conservés. Revue visuelle en attente. |
| [~] | `/portefeuille/equipe` | `(dashboard)/portefeuille/equipe/page.tsx` | Revue du 19 novembre : disposition, tableaux, tokens et fenêtres harmonisés ; API, calculs et exports conservés. Revue visuelle en attente. |
| [~] | `/portefeuille/mes-entreprises` | `(dashboard)/portefeuille/mes-entreprises/page.tsx` | Revue du 19 novembre : disposition, tableaux, tokens et fenêtres harmonisés ; API, calculs et exports conservés. Revue visuelle en attente. |
| [~] | `/portefeuille/messages` | `(dashboard)/portefeuille/messages/page.tsx` | Délègue à ChatPage (mise en page plein écran, non encadrée) ; fin de l'isolation theme-legacy (Claude, 14 nov., lot 6). Revue visuelle en attente. |
| [~] | `/portefeuille/paie` | `(dashboard)/portefeuille/paie/page.tsx` | Revue du 19 novembre : disposition, tableaux, tokens et fenêtres harmonisés ; API, calculs et exports conservés. Revue visuelle en attente. |
| [~] | `/portefeuille/paie/liste` | `(dashboard)/portefeuille/paie/liste/page.tsx` | Revue du 19 novembre : disposition, tableaux, tokens et fenêtres harmonisés ; API, calculs et exports conservés. Revue visuelle en attente. |
| [~] | `/portefeuille/presences` | `(dashboard)/portefeuille/presences/page.tsx` | Revue du 19 novembre : disposition, tableaux, tokens et fenêtres harmonisés ; API, calculs et exports conservés. Revue visuelle en attente. |
| [~] | `/portefeuille/presences-absences` | `(dashboard)/portefeuille/presences-absences/page.tsx` | AttendanceDashboard raccordé au rendu commun le 19 novembre ; logique conservée. Revue visuelle en attente. |
| [~] | `/portefeuille/prets` | `(dashboard)/portefeuille/prets/page.tsx` | Revue du 19 novembre : disposition, tableaux, tokens et fenêtres harmonisés ; API, calculs et exports conservés. Revue visuelle en attente. |
| [~] | `/portefeuille/prets-avances` | `(dashboard)/portefeuille/prets-avances/page.tsx` | LoansDashboard raccordé au rendu commun le 19 novembre ; logique conservée. Revue visuelle en attente. |
| [~] | `/portefeuille/rapports` | `(dashboard)/portefeuille/rapports/page.tsx` | Revue du 19 novembre : disposition, tableaux, tokens et fenêtres harmonisés ; API, calculs et exports conservés. Revue visuelle en attente. |
### Module : presences

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/presences` | `(dashboard)/presences/page.tsx` | Revue complète 18 nov. : Vue de travail jour/semaine/mois/corrections, action principale unique et période contextualisée. Revue visuelle en attente. |
| [~] | `/presences/absences` | `(dashboard)/presences/absences/page.tsx` | Revue complète 18 nov. : Gestion et dossier maître/détail harmonisés, filtres et statuts aux tokens. Revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. ; lecteur ajustable, zoom et plein écran ; documents officiels **NE PAS TOUCHER** (conservés) |
| [~] | `/presences/absences/historique` | `(dashboard)/presences/absences/historique/page.tsx` | Revue complète 18 nov. : Historique partagé contrôlé, filtres communs et tableau défilant sur mobile. Revue visuelle en attente. |
| [~] | `/presences/absences/mon-espace` | `(dashboard)/presences/absences/mon-espace/page.tsx` | Revue complète 18 nov. : Demandes et détail harmonisés, solde et statuts conservés. Revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. ; lecteur ajustable, zoom et plein écran ; documents officiels **NE PAS TOUCHER** (conservés) |
| [~] | `/presences/absences/nouveau` | `(dashboard)/presences/absences/nouveau/page.tsx` | Revue complète 18 nov. : Quatre étapes et récapitulatif conservés ; sélection/typographie/contrastes harmonisés. Revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. ; lecteur ajustable, zoom et plein écran ; documents officiels **NE PAS TOUCHER** (conservés) |
| [~] | `/presences/absences/rapport` | `(dashboard)/presences/absences/rapport/page.tsx` | Revue complète 18 nov. : Rapport partagé contrôlé, filtres et KPI lisibles ; séries thématiques. Revue visuelle en attente. |
| [~] | `/presences/absences/suivi` | `(dashboard)/presences/absences/suivi/page.tsx` | Revue complète 18 nov. : Grille, journal, comparaison et classements contrôlés ; palette thématique et codes conservés. Revue visuelle en attente. |
| [~] | `/presences/dashboard` | `(dashboard)/presences/dashboard/page.tsx` | Revue complète 18 nov. : Indicateurs visibles, graphiques aux tokens du thème et lecture par domaine. Revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. |
| [~] | `/presences/ecrans` | `(dashboard)/presences/ecrans/page.tsx` | Revue complète 18 nov. : Configuration et approbation lisibles ; secrets, révocation et droits inchangés. Revue visuelle en attente. |
| [~] | `/presences/permissions` | `(dashboard)/presences/permissions/page.tsx` | Revue complète 18 nov. : Vue de gestion et dossier maître/détail harmonisés, retours et validation conservés. Revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. ; lecteur ajustable, zoom et plein écran ; documents officiels **NE PAS TOUCHER** (conservés) |
| [~] | `/presences/permissions/historique` | `(dashboard)/presences/permissions/historique/page.tsx` | Revue complète 18 nov. : Historique partagé contrôlé, filtres communs et tableau défilant sur mobile. Revue visuelle en attente. |
| [~] | `/presences/permissions/mon-espace` | `(dashboard)/presences/permissions/mon-espace/page.tsx` | Revue complète 18 nov. : Liste et dossier harmonisés ; déclaration du retour et statuts conservés. Revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. ; lecteur ajustable, zoom et plein écran ; documents officiels **NE PAS TOUCHER** (conservés) |
| [~] | `/presences/permissions/nouveau` | `(dashboard)/presences/permissions/nouveau/page.tsx` | Revue complète 18 nov. : Quatre étapes et récapitulatif conservés ; sélecteur commun et contrôles inchangés. Revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. ; lecteur ajustable, zoom et plein écran ; documents officiels **NE PAS TOUCHER** (conservés) |
| [~] | `/presences/permissions/rapport` | `(dashboard)/presences/permissions/rapport/page.tsx` | Revue complète 18 nov. : Rapport partagé contrôlé, filtres et KPI lisibles ; séries thématiques. Revue visuelle en attente. |
| [~] | `/presences/permissions/suivi` | `(dashboard)/presences/permissions/suivi/page.tsx` | Revue complète 18 nov. : Indicateurs visibles et filtres harmonisés ; tableau stable sur mobile. Revue visuelle en attente. |
| [~] | `/presences/permissions/suivi/[employeeId]` | `(dashboard)/presences/permissions/suivi/[employeeId]/page.tsx` | Revue complète 18 nov. : Dossier individuel et période harmonisés ; historique conservé. Revue visuelle en attente. |
| [~] | `/presences/permissions/validations` | `(dashboard)/presences/permissions/validations/page.tsx` | Revue complète 18 nov. : Indicateurs visibles, filtres communs et détail en dialogue natif. Revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. ; lecteur ajustable, zoom et plein écran ; documents officiels **NE PAS TOUCHER** (conservés) |
| [~] | `/presences/pointage` | `(dashboard)/presences/pointage/page.tsx` | Revue complète 18 nov. : Navigation pleine largeur, horloge séparée des commandes, GPS/QR/pauses/hors-ligne conservés. Revue visuelle en attente. |
| [~] | `/presences/pointage-manuel` | `(dashboard)/presences/pointage-manuel/page.tsx` | Revue complète 18 nov. : Formulaire élargi en deux colonnes sur bureau, une sur mobile ; droits et saisies conservés. Revue visuelle en attente. |
| [~] | `/presences/resume` | `(dashboard)/presences/resume/page.tsx` | Revue complète 18 nov. : Période et génération regroupées, indicateurs, détails et graphiques harmonisés. Revue visuelle en attente. Documents / exports : **NE PAS TOUCHER**. |
| [~] | `/presences/shifts` | `(dashboard)/presences/shifts/page.tsx` | Revue complète 18 nov. : Navigation rétablie, planning et actions hiérarchisés, Lucide, fenêtres et filtres communs. Revue visuelle en attente. |
| [~] | `/presences/synchronisation` | `(dashboard)/presences/synchronisation/page.tsx` | Revue complète 18 nov. : Parcours de connexion et fenêtres harmonisés ; jumelage/clé/agent inchangés. Revue visuelle en attente. |
| [~] | `/presences/tablettes` | `(dashboard)/presences/tablettes/page.tsx` | Revue complète 18 nov. : Création et consultation harmonisées ; clé en dialogue natif, NFC/caméra/scans inchangés. Revue visuelle en attente. |

### Module : pricing

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/pricing` | `(dashboard)/pricing/page.tsx` | Interface refondue ; revue visuelle finale à effectuer |

### Module : primes

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/primes/attribuer` | `(dashboard)/primes/attribuer/page.tsx` | Cadre commun intégré (Claude, 14 nov.) : couleurs, champs, tableaux et accessibilité via ModulePageFrame ; logique, API et permissions inchangées. Revue visuelle en attente. |

### Module : Public, authentification et portails

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [ ] | `/` | `page.tsx` | Couleurs en dur |
| [ ] | `/affiliate/dashboard` | `affiliate/dashboard/page.tsx` | Couleurs en dur |
| [ ] | `/affiliate/login` | `affiliate/login/page.tsx` | Couleurs en dur |
| [ ] | `/auth/accept-invitation/[token]` | `auth/accept-invitation/[token]/page.tsx` | Couleurs en dur |
| [ ] | `/auth/accept-portfolio-invitation/[token]` | `auth/accept-portfolio-invitation/[token]/page.tsx` | Couleurs en dur |
| [ ] | `/auth/forgot-password` | `auth/forgot-password/page.tsx` | Couleurs en dur |
| [ ] | `/auth/login` | `auth/login/page.tsx` | Couleurs en dur |
| [ ] | `/auth/register` | `auth/register/page.tsx` | Couleurs en dur |
| [ ] | `/auth/reset-password` | `auth/reset-password/page.tsx` | Couleurs en dur |
| [ ] | `/blog` | `blog/page.tsx` | Styles délégués : composants importés à vérifier |
| [ ] | `/blog/[slug]` | `blog/[slug]/page.tsx` | Styles délégués : composants importés à vérifier |
| [ ] | `/cgu` | `cgu/page.tsx` | Couleurs en dur |
| [ ] | `/companies/create` | `companies/create/page.tsx` | Couleurs en dur |
| [ ] | `/contact` | `contact/page.tsx` | Styles délégués : composants importés à vérifier |
| [ ] | `/docs` | `docs/page.tsx` | Couleurs en dur ; documents / exports : **NE PAS TOUCHER** (interface autour à distinguer) |
| [ ] | `/ecran` | `ecran/page.tsx` | Couleurs en dur |
| [ ] | `/entreprises` | `entreprises/page.tsx` | Styles délégués : composants importés à vérifier |
| [ ] | `/entreprises/[slug]` | `entreprises/[slug]/page.tsx` | Couleurs en dur |
| [ ] | `/inscription-portefeuille` | `inscription-portefeuille/page.tsx` | Couleurs en dur |
| [ ] | `/jobs/[id]` | `jobs/[id]/page.tsx` | Couleurs en dur |
| [ ] | `/jobs/ia/[id]` | `jobs/ia/[id]/page.tsx` | Couleurs en dur ; documents / exports : **NE PAS TOUCHER** (interface autour à distinguer) |
| [ ] | `/jobs/ia/[id]/test/[candidateId]` | `jobs/ia/[id]/test/[candidateId]/page.tsx` | Couleurs en dur |
| [ ] | `/jobs/manuel/[id]` | `jobs/manuel/[id]/page.tsx` | Couleurs en dur ; documents / exports : **NE PAS TOUCHER** (interface autour à distinguer) |
| [ ] | `/jobs/portal` | `jobs/portal/page.tsx` | Couleurs en dur |
| [ ] | `/kiosk` | `kiosk/page.tsx` | Couleurs en dur |
| [ ] | `/outils` | `outils/page.tsx` | Couleurs en dur |
| [ ] | `/outils/calcul-camu-congo` | `outils/calcul-camu-congo/page.tsx` | Styles délégués : composants importés à vérifier |
| [ ] | `/outils/calcul-cnss-congo` | `outils/calcul-cnss-congo/page.tsx` | Styles délégués : composants importés à vérifier |
| [ ] | `/outils/calcul-heures-supplementaires-congo` | `outils/calcul-heures-supplementaires-congo/page.tsx` | Styles délégués : composants importés à vérifier |
| [ ] | `/outils/calcul-its-congo` | `outils/calcul-its-congo/page.tsx` | Styles délégués : composants importés à vérifier |
| [ ] | `/outils/calcul-tus-congo` | `outils/calcul-tus-congo/page.tsx` | Styles délégués : composants importés à vérifier |
| [ ] | `/privacy` | `privacy/page.tsx` | Couleurs en dur |
| [ ] | `/qui-sommes-nous` | `qui-sommes-nous/page.tsx` | Couleurs en dur |
| [ ] | `/register` | `register/page.tsx` | Couleurs en dur |
| [ ] | `/simulateur` | `simulateur/page.tsx` | Styles délégués : composants importés à vérifier |
| [ ] | `/tarifs` | `tarifs/page.tsx` | Styles délégués : composants importés à vérifier |
| [ ] | `/verify/[ref]` | `verify/[ref]/page.tsx` | Couleurs en dur |

### Module : rapports

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/rapports` | `(dashboard)/rapports/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/rapports/absences` | `(dashboard)/rapports/absences/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/rapports/analyse-conges` | `(dashboard)/rapports/analyse-conges/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/rapports/analyse-paie` | `(dashboard)/rapports/analyse-paie/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/rapports/complet` | `(dashboard)/rapports/complet/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/rapports/comptabilite` | `(dashboard)/rapports/comptabilite/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/rapports/das-declaration` | `(dashboard)/rapports/das-declaration/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Documents imprimables **NE PAS TOUCHER** : conservés. Revue visuelle en attente. |
| [~] | `/rapports/departements` | `(dashboard)/rapports/departements/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/rapports/effectifs` | `(dashboard)/rapports/effectifs/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/rapports/indicateurs` | `(dashboard)/rapports/indicateurs/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/rapports/its-bnc` | `(dashboard)/rapports/its-bnc/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/rapports/journal-paie` | `(dashboard)/rapports/journal-paie/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Documents imprimables **NE PAS TOUCHER** : conservés. Revue visuelle en attente. |
| [~] | `/rapports/mouvements-effectifs` | `(dashboard)/rapports/mouvements-effectifs/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/rapports/observatoire-conges` | `(dashboard)/rapports/observatoire-conges/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Revue visuelle en attente. |
| [~] | `/rapports/recap-bulletins-annuel` | `(dashboard)/rapports/recap-bulletins-annuel/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Documents imprimables **NE PAS TOUCHER** : conservés. Revue visuelle en attente. |
| [~] | `/rapports/recap-personnel` | `(dashboard)/rapports/recap-personnel/page.tsx` | Revue du 18 novembre : lecture des indicateurs, dispositions, tableaux et graphiques sur tokens ; API, droits et exports conservés. Documents imprimables **NE PAS TOUCHER** : conservés. Revue visuelle en attente. |

### Module : recrutement

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/recrutement` | `(dashboard)/recrutement/page.tsx` | Offres structurées par étapes, actions distinctes et navigation commune ; revue visuelle en attente |
| [~] | `/recrutement/customize-career-page` | `(dashboard)/recrutement/customize-career-page/page.tsx` | Réglages et aperçu réorganisés, aperçu accessible sur mobile ; paramètres de marque conservés ; revue visuelle en attente |
| [~] | `/recrutement/entretiens` | `(dashboard)/recrutement/entretiens/page.tsx` | Agenda groupé par jour et actions alignées ; planification/évaluation conservées ; revue visuelle en attente |
| [~] | `/recrutement/ia/analytics` | `(dashboard)/recrutement/ia/analytics/page.tsx` | Synthèse et donut en tokens, tableau de comparaison conservé ; revue visuelle en attente |
| [~] | `/recrutement/ia/candidats` | `(dashboard)/recrutement/ia/candidats/page.tsx` | Colonnes défilantes et filtres communs ; données/scoring conservés ; revue visuelle en attente |
| [~] | `/recrutement/ia/candidats/[id]` | `(dashboard)/recrutement/ia/candidats/[id]/page.tsx` | Dossier et identité en panneau latéral, suivi lisible ; scoring/entretiens conservés ; revue visuelle en attente |
| [~] | `/recrutement/ia/create` | `(dashboard)/recrutement/ia/create/page.tsx` | Rubriques accessibles, informations essentielles avant le visuel, publication fixe ; champs/quiz/validation conservés ; revue visuelle en attente |
| [~] | `/recrutement/manuel/candidats` | `(dashboard)/recrutement/manuel/candidats/page.tsx` | Colonnes défilantes et filtres communs ; décisions conservées ; revue visuelle en attente |
| [~] | `/recrutement/manuel/candidats/[id]` | `(dashboard)/recrutement/manuel/candidats/[id]/page.tsx` | Dossier et identité en panneau latéral ; notes/statut/entretiens conservés ; revue visuelle en attente |
| [~] | `/recrutement/manuel/create` | `(dashboard)/recrutement/manuel/create/page.tsx` | Rubriques accessibles, informations essentielles avant le visuel, publication fixe ; champs/validation conservés ; revue visuelle en attente |
| [~] | `/recrutement/offres/[id]/edit` | `(dashboard)/recrutement/offres/[id]/edit/page.tsx` | Édition en rubriques avec sauvegarde fixe ; statut, champs, validation et quiz conservés ; revue visuelle en attente |

| [~] | `/recrutement/tableau-de-bord` | `(dashboard)/recrutement/tableau-de-bord/page.tsx` | Route existante réinventoriée ; Indicateurs, priorités et agenda réorganisés ; métriques serveur conservées ; revue visuelle en attente |
| [~] | `/recrutement/demandes` | `(dashboard)/recrutement/demandes/page.tsx` | Route existante réinventoriée ; Besoins et décisions RH regroupés ; droits et suivi conservés ; revue visuelle en attente |
| [~] | `/recrutement/pipeline` | `(dashboard)/recrutement/pipeline/page.tsx` | Route existante réinventoriée ; Colonnes et cartes lisibles, déplacement clavier/mobile conservé ; revue visuelle en attente |
| [~] | `/recrutement/candidat/[id]` | `(dashboard)/recrutement/candidat/[id]/page.tsx` | Route existante réinventoriée ; Identité/actions et suivi séparés, panneau de contact resserré ; actions métier conservées ; revue visuelle en attente |
| [~] | `/recrutement/comparer` | `(dashboard)/recrutement/comparer/page.tsx` | Route existante réinventoriée ; Critères fixes et comparaison défilante ; calculs et impression conservés ; revue visuelle en attente |
| [~] | `/recrutement/modeles` | `(dashboard)/recrutement/modeles/page.tsx` | Route existante réinventoriée ; Éditeur et aperçu côte à côte ; variables et envoi conservés ; revue visuelle en attente |

### Module : rh-blog

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/rh-blog` | `(dashboard)/rh-blog/page.tsx` | Cadre commun intégré (Claude, 14 nov.) : couleurs, champs, tableaux et accessibilité via ModulePageFrame ; logique, API et permissions inchangées. Revue visuelle en attente. |
| [~] | `/rh-blog/[slug]/edit` | `(dashboard)/rh-blog/[slug]/edit/page.tsx` | Cadre commun intégré (Claude, 14 nov.) : couleurs, champs, tableaux et accessibilité via ModulePageFrame ; logique, API et permissions inchangées. Revue visuelle en attente. |
| [~] | `/rh-blog/nouveau` | `(dashboard)/rh-blog/nouveau/page.tsx` | Cadre commun intégré (Claude, 14 nov.) : couleurs, champs, tableaux et accessibilité via ModulePageFrame ; logique, API et permissions inchangées. Revue visuelle en attente. |

### Module : success

| Suivi | Route | Source dans `app/` | Constat / protection |
|---|---|---|---|
| [~] | `/success` | `(dashboard)/success/page.tsx` | Interface refondue ; revue visuelle finale à effectuer |

### Composants partagés

Chemins relatifs à `frontend/`.

**Structure**

- [ ] `app/error.tsx`.
- [ ] `app/layout.tsx`.
- [ ] `app/not-found.tsx`.
- [ ] `app/(dashboard)/layout.tsx`.
- [ ] `app/(dashboard)/loading.tsx`.
- [ ] `app/(dashboard)/cabinet/[cabinetId]/CabinetSidebar.tsx`.
- [ ] `app/(dashboard)/cabinet/[cabinetId]/layout.tsx`.
- [ ] `app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/layout.tsx`.
- [~] `app/(dashboard)/portefeuille/layout.tsx` (coquille commune : plus de theme-legacy, lien d'évitement, styles du shell).
- [ ] `app/admin/layout.tsx`.
- [ ] `app/auth/layout.tsx`.
- [ ] `app/pme/[companyId]/layout.tsx`.
- [ ] `components/DepartmentDetailSidebar.tsx`.
- [ ] `components/EmployeeDayDetailSidebar.tsx`.
- [ ] `components/EmployeeLoanHistorySidebar.tsx`.
- [ ] `components/EmployeeTicketHistorySidebar.tsx`.
- [ ] `components/admin/LayoutWrapper.tsx`.
- [ ] `components/admin/Sidebar.tsx`.
- [ ] `components/auth/AuthShell.tsx`.
- [ ] `components/auth/layout.tsx`.
- [~] `components/layout/DashboardShell.tsx` (charge les styles de sélecteurs).
- [~] `components/layout/Sidebar.tsx` (couleurs d'alerte et pastille « En ligne » passées aux tokens, déconnexion en classe dédiée ; menu, repli, droits et alertes inchangés).
- [~] `components/layout/TopNav.tsx` (rendu réécrit en tokens (logique de notifications, profil, déconnexion inchangée) ; fil d'Ariane avec le module et le titre exact ; recherche et sélecteur de mode remplacés).
- [~] `components/portfolio/PortfolioSidebar.tsx` (classe shell-sidebar, états actifs et alertes en tokens).
- [~] `components/portfolio/PortfolioTopNav.tsx` (même topbar que le dashboard (recherche Ctrl/⌘ + K, Apparence, notifications, profil)).
- [ ] `components/providers/ThemeProvider.tsx`.

**Base UI et loaders**

- [~] `components/settings/UserCollection.tsx` — vues liste/grille et pagination locale.
- [~] `components/ui/Feedback.tsx` — surfaces communes, piles partagées, animation réduite.
- [~] `components/providers/AlertProvider.tsx`, `NotificationProvider.tsx`, `SubscriptionReminderProvider.tsx`, `SubscriptionEndedBanner.tsx`, `SubscriptionBlockedModal.tsx` — présentation harmonisée ; données et déclenchements conservés.
- [~] `components/ui/useToast.tsx` — pile commune et pause clavier.

- [~] `components/PeriodSelector.tsx` (segmenté + sélecteurs communs).
- [~] `components/SlideOver.tsx` — panneau natif, thème, clavier et retour du focus ; variante legacy conservée.
- [~] `components/ui/AlertBadge.tsx` (tokens, sans pulsation).
- [~] `components/ui/basic.tsx` (aligné sur le design system (non utilisé)).
- [~] `components/ui/ErrorLayout.tsx` (redessiné sur les tokens, props inchangées ; footer « HRCongo System » retiré).
- [~] `components/ui/FancySelect.tsx` (famille de sélecteurs commune (clavier, ouverture vers le haut)).
- [ ] `components/ui/GlobalLoader.tsx`.
- [~] `components/ui/KonzaLoader.tsx` (sans halo, anneau en tokens).
- [ ] `components/ui/KonzaMark.tsx`.
- [~] `components/ui/PlaceholderPage.tsx` (tokens).
- [~] `components/ui/ProfileAvatar.tsx` (tokens).
- [~] `components/ui/SearchSelect.tsx` (même famille de sélecteurs).
- [~] `components/ui/StatCard.tsx` (surface sans bordure, icône en tokens).
- [~] `components/ui/useToast.tsx` (toasts du design system (API inchangée)).

**Graphiques**

- [ ] `app/(dashboard)/cabinet/[cabinetId]/dashboard/page.tsx`.
- [ ] `app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/rapports/page.tsx`.
- [~] `app/(dashboard)/employes/page.tsx`.
- [ ] `app/(dashboard)/finances/page.tsx`.
- [ ] `app/(dashboard)/loans/mon-espace/page.tsx`.
- [ ] `app/(dashboard)/loans/rapport/page.tsx`.
- [ ] `app/(dashboard)/loans/suivi-dettes/[employeeId]/page.tsx`.
- [ ] `app/(dashboard)/loans/validations/page.tsx`.
- [ ] `app/(dashboard)/portefeuille/dashboard/page.tsx`.
- [ ] `app/(dashboard)/portefeuille/rapports/page.tsx`.
- [ ] `app/(dashboard)/presences/WeeklyView.tsx`.
- [~] `app/(dashboard)/presences/absences/suivi/page.tsx`.
- [ ] `app/(dashboard)/presences/permissions/mon-espace/page.tsx`.
- [ ] `app/(dashboard)/presences/permissions/validations/page.tsx`.
- [ ] `app/(dashboard)/presences/resume/page.tsx`.
- [ ] `app/(dashboard)/rapports/page.tsx`.
- [ ] `app/(dashboard)/rapports/analyse-conges/page.tsx`.
- [ ] `app/(dashboard)/rapports/analyse-paie/page.tsx`.
- [ ] `app/(dashboard)/rapports/complet/page.tsx`.
- [ ] `app/(dashboard)/rapports/departements/page.tsx`.
- [ ] `app/(dashboard)/rapports/effectifs/page.tsx`.
- [ ] `app/(dashboard)/rapports/indicateurs/page.tsx`.
- [ ] `app/(dashboard)/rapports/mouvements-effectifs/page.tsx`.
- [~] `app/(dashboard)/recrutement/ia/analytics/page.tsx` : donut/légende en tokens, revue visuelle attendue.
- [ ] `app/admin/(protected)/serveur/page.tsx`.
- [ ] `app/admin/companies/[id]/gestion/page.tsx`.
- [ ] `components/DashboardContent.tsx`.
- [ ] `components/YearlyEvolutionPanel.tsx`.
- [ ] `components/absence-analytics/AbsenceAnalyticsBoard.tsx`.
- [~] `components/absences/AbsencesOverview.tsx`.
- [ ] `components/admin/Charts.tsx`.
- [ ] `components/admin/analytics/AnalyticsCharts.tsx`.
- [ ] `components/admin/billing/RevenueCharts.tsx`.
- [ ] `components/admin/companies/CompanyInsights.tsx`.
- [~] `components/attendance/AttendanceDashboard.tsx` — palette et graphiques refondus sous cadre isolé ; calculs/export inchangés.
- [ ] `components/audit/charts/ActivityPanel.tsx`.
- [ ] `components/audit/charts/TrendCharts.tsx`.
- [ ] `components/loans/LoansDashboard.tsx`.
- [ ] `components/loans/LoansOverview.tsx`.
- [~] `components/payroll-journal/JournalDashboard.tsx` — graphiques thématiques ; données et calculs conservés.
- [ ] `components/permissions/PermissionsOverview.tsx`.
- [ ] `components/request-history/RequestHistoryView.tsx`.
- [ ] `components/request-reports/LoansRequestsPanel.tsx`.
- [ ] `components/request-reports/RequestReportDashboard.tsx`.
- [ ] `components/workforce/WorkforceDashboard.tsx`.

**Navigation et demandes**

- [ ] `components/AbsenceSubNav.tsx`.
- [ ] `components/CongeSubNav.tsx`.
- [ ] `components/DashboardContent.tsx`.
- [ ] `components/FinanceSubNav.tsx`.
- [ ] `components/PermissionsSubNav.tsx`.
- [~] `components/PresenceModuleSwitcher.tsx` — navigation commune réutilisée, routes inchangées.
- [~] `components/PresenceSubNav.tsx` — navigation commune réutilisée, droits inchangés.
- [~] `components/RapportsSubNav.tsx` (ModuleNav).
- [~] `components/RequestModuleNav.tsx` (barre unique ModuleNav hors phase 2).
- [ ] `components/approvals/ApprovalPanel.tsx`.
- [ ] `components/approvals/AvisInbox.tsx`.
- [ ] `components/approvals/ExternalFunctionsSection.tsx`.
- [ ] `components/chat/ChatProvider.tsx`.
- [ ] `components/loans/LoansForm.tsx`.
- [ ] `components/loans/LoansList.tsx`.
- [~] `components/performance/PerformanceNav.tsx` (ModuleNav + texte d'aide).
- [ ] `components/permissions/PermissionTimeline.tsx`.
- [ ] `components/request-history/RequestHistoryView.tsx`.
- [ ] `components/request-reports/LoansRequestsPanel.tsx`.
- [ ] `components/request-reports/ReportKit.tsx`.
- [ ] `components/request-reports/RequestReportDashboard.tsx`.

### Documents et exports officiels — NE PAS TOUCHER

Modèles, styles imprimés, signatures, données, calculs, handlers et formats protégés. Les pages mixtes pourront changer uniquement autour des documents.
- **NE PAS TOUCHER** — `components/AbsenceRequestPrintable.tsx`.
- **NE PAS TOUCHER** — `components/BulletinBatchPrintHidden.tsx`.
- **NE PAS TOUCHER** — `components/DailyAttendanceReportPrintable.tsx`.
- **NE PAS TOUCHER** — `components/LeaveAuthorizationLetterPrintable.tsx`.
- **NE PAS TOUCHER** — `components/LeavePlanningPrintable.tsx`.
- **NE PAS TOUCHER** — `components/LeaveRequestFormPrintable.tsx`.
- **NE PAS TOUCHER** — `components/LoanRequestPrintable.tsx`.
- **NE PAS TOUCHER** — `components/PermissionTicketPrintable.tsx`.
- **NE PAS TOUCHER** — `components/WeeklyAttendanceReportPrintable.tsx`.
- **NE PAS TOUCHER** — `components/attendance/AttendanceExportDialog.tsx`.
- **NE PAS TOUCHER** — `components/BulletinDisplay/index.tsx`.
- **NE PAS TOUCHER** — `components/BulletinRenderer/index.tsx`.
- **NE PAS TOUCHER** — `components/BulletinRendererClarifie/index.tsx`.
- **NE PAS TOUCHER** — `components/BulletinRendererClassique/index.tsx`.
- **NE PAS TOUCHER** — `components/BulletinRendererInf/index.tsx`.
- **NE PAS TOUCHER** — `components/CanvasRenderer/index.tsx`.
- **NE PAS TOUCHER** — `components/documents/docSignatures.tsx`.
- **NE PAS TOUCHER** — `components/documents/RequestDocuments.tsx`.
- **NE PAS TOUCHER** — `components/documents/modern/ModernAbsenceRequestForm.tsx`.
- **NE PAS TOUCHER** — `components/documents/modern/ModernAdvanceRequestForm.tsx`.
- **NE PAS TOUCHER** — `components/documents/modern/ModernDocumentKit.tsx`.
- **NE PAS TOUCHER** — `components/documents/modern/ModernLeaveRequestForm.tsx`.
- **NE PAS TOUCHER** — `components/documents/modern/ModernLoanRequestForm.tsx`.
- **NE PAS TOUCHER** — `components/documents/orca/OrcaAdvanceDocument.tsx`.
- **NE PAS TOUCHER** — `components/documents/orca/OrcaDocumentShell.tsx`.
- **NE PAS TOUCHER** — `components/documents/orca/OrcaLeaveAbsenceDocument.tsx`.
- **NE PAS TOUCHER** — `components/documents/orca/OrcaLoanDocument.tsx`.
- **NE PAS TOUCHER** — `components/documents/standard/StandardAbsenceRequestForm.tsx`.
- **NE PAS TOUCHER** — `components/documents/standard/StandardAdvanceRequestForm.tsx`.
- **NE PAS TOUCHER** — `components/documents/standard/StandardLeaveRequestForm.tsx`.
- **NE PAS TOUCHER** — `components/documents/standard/StandardLoanRequestForm.tsx`.
- **NE PAS TOUCHER** — `components/employees/FicheEmployePdf.tsx`.
- **NE PAS TOUCHER** — `components/FactureRendererDetaillee/index.tsx`.
- **NE PAS TOUCHER** — `components/FactureRendererForfait/index.tsx`.
- **NE PAS TOUCHER** — `components/FactureRendererPro/index.tsx`.
- **NE PAS TOUCHER** — `components/loans/LoansExportDialog.tsx`.
- **NE PAS TOUCHER** — `components/payroll-journal/JournalPrintable.tsx`.
- **NE PAS TOUCHER** — `components/workforce/WorkforceExportDialog.tsx`.
- **NE PAS TOUCHER** — `lib/absence-print.ts`.
- **NE PAS TOUCHER** — `lib/bulletin-print.ts`.
- **NE PAS TOUCHER** — `lib/bulletin-templates.ts`.
- **NE PAS TOUCHER** — `lib/document-template.ts`.
- **NE PAS TOUCHER** — `lib/leave-print.ts`.
- **NE PAS TOUCHER** — `lib/loan-print.ts`.
- **NE PAS TOUCHER** — `lib/payroll-journal-pdf.ts`.
- **NE PAS TOUCHER** — `lib/report-print.ts`.
- **NE PAS TOUCHER** — `lib/ticket-print.ts`.

- **NE PAS TOUCHER** — CNSS / DGC : exports dans `app/(dashboard)/cnss-declaration/page.tsx` (dont DGC `.docx` officiel) et déclarations cabinet.
- **NE PAS TOUCHER** — DAS : impression et exports `.xlsx` / `.zip` dans `app/(dashboard)/rapports/das-declaration/page.tsx`.
- **NE PAS TOUCHER** — bulletins, factures de paie, documents de prêt/avance/congé/absence/permission, contrats générés et exports Excel/PDF officiels intégrés aux pages paie, comptabilité, rapports, personnel et présences.

### Bibliothèques, tokens et dark mode

- Icônes : `lucide-react` `^0.344.0` ; graphiques : `recharts` `^2.12.0` (package et imports effectifs).
- Au moment de inventaire : Inter et JetBrains Mono. Étape 1 : Plus Jakarta Sans locale pour la phase 1 ; pile historique Inter conservée dans les zones legacy, JetBrains Mono pour les codes techniques.

| Token historique sauvegardé avant étape 1 | Clair | Sombre |
|---|---|---|
| `--bg` | `#F7F8F9` | `#050607` |
| `--surface` | `#FFFFFF` | `#0B0C0F` |
| `--surface-2` | `#F1F2F4` | `rgba(255, 255, 255, 0.04)` |
| `--border` | `rgba(15, 23, 42, 0.08)` | `rgba(255, 255, 255, 0.08)` |
| `--text` | `#0F172A` | `#FAFAFA` |
| `--text-muted` | `#64748B` | `#8B8F98` |
| `--brand` | `#10B981` | `#10B981` |
| `--brand-strong` | `#059669` | `#34D399` |
| `--brand-soft` | `rgba(16, 185, 129, 0.1)` | `rgba(16, 185, 129, 0.12)` |
| `--accent-2` | `#F59E0B` | `#F59E0B` |
| `--accent-2-soft` | `rgba(245, 158, 11, 0.1)` | `rgba(245, 158, 11, 0.12)` |

- Manquaient au moment de inventaire (ajoutés à étape 1) : `--lime`, `--green`, `--mustard`, `--danger`, `--shadow-card`, `--shadow-pop`, `--radius-card`, `--radius-control`. Préserver les tokens existants `--accent-2` et `--accent-2-soft`.
- Dark mode global : `components/providers/ThemeProvider.tsx`, classe `light`/`dark` sur `<html>`, persistance `localStorage.theme`, bouton `toggleTheme` dans `components/layout/TopNav.tsx`, Tailwind `darkMode: class`, tokens `.dark` et correctifs Recharts globaux.
- Limite : état initial sombre ; sans choix stocké, le système sombre est reconnu mais une préférence système claire laisse aussi le sombre initial. Aucun choix « auto » ni suivi des changements système. Certaines pages auth imposent le sombre.
- `/dashboard` délègue à `components/DashboardContent.tsx` : Pilotage RH et accueil employé sont deux vues à traiter sans inventer de route « Ma journée ».
- Prêts et avances partagent `loans`. Parcours séparés : congés, permissions, absences. Aucune route `/materiel/nouveau` ; le parcours intégré au module matériel sera à examiner avant déclinaison.
- Variantes PME et cabinet recensées séparément ; conserver routes et permissions. Les gabarits `components/templates/` et `/design-system` restent à créer aux prochaines étapes.

### Ordre confirmé — phase 1

- [~] Pilotage RH (dashboard admin) — livré le 12 novembre 2026, validation utilisateur en attente
- [~] Ma journée (accueil employé) — livrée le 12 novembre 2026, validation utilisateur en attente
- [~] Mon compte livré sur `/mon-profil` ; accès aux pages existantes signature/paie/notifications/sécurité, préférences intégrées ; revue visuelle en attente
- [~] Parcours de demande MODÈLE : Prêts — 10 routes et 2 variantes PME livrées ; revue visuelle en attente
- [~] Parcours de demande MODÈLE : Congés — 13 routes et 8 variantes PME livrées ; parcours en quatre étapes ; revue visuelle et validation avec Prêts en attente
- [ ] Avances (réutilise les composants de demande)
- [~] Permissions / autorisations de sortie — 8 routes livrées ; revue visuelle en attente
- [~] Absences
- [~] Matériel livré ; autres demandes selon inventaire
- [~] Employés
- [~] Présences / pointage — intégration et démo prêtes ; revue visuelle générale reportée à la fin
- [ ] Paie (hors documents imprimables)
- [~] Notifications livrées ; messagerie intégrée sur `/messages`, validation visuelle en attente
- [~] Formation / matériel / documents livrés ; recrutement intégré (11 routes) ; rapports commencés (vue d'ensemble intégrée, autres pages à faire)
- [ ] Paramètres
- [ ] Portefeuille / cabinet / super admin — **reporté — phase 2**
- [ ] Pages publiques (accueil, tarifs, connexion, inscription, docs)
