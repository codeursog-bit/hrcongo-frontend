# Coquille et Paie — 18 novembre 2026

La topbar et la sidebar utilisent la même présentation entreprise/portefeuille : barre supérieure flottante, recherche adaptée à la largeur disponible, navigation sous le logo et compte en bas. La position de la carte de compte et le rendu des loaders white-label/admin/cabinet sont conservés dans leurs branches dédiées.

L’identité d’entreprise est lue par le hook existant `useCompanyLogo` et partagée par contexte : pas de requête par loader. Le portefeuille réutilise cette lecture de `/companies/mine`. Logo d’entreprise en `object-fit: contain`, plus grand (194 × 76 px disponibles dans le menu), logo Konza si absent ou défectueux, adaptation du logo Konza au sombre. Les images HTTP de développement sont acceptées, les schémas non-images restent refusés. Le loader moderne garde le logo immobile et utilise une piste indéterminée ; la réduction des animations est respectée. Les champs `primaryColor` / `secondaryColor` des documents ne sont pas réutilisés.

Le détail de paie sépare désormais trois montants **issus du serveur** (brut, retenues, net), une seule zone de commandes, le contexte de gestion et l’aperçu officiel. Les boutons de modification répétés ont été retirés. Les confirmations utilisent la modale native du design system. Les menus des lignes de paie passent en portail pour éviter leur découpe par le tableau ; les transitions de statut et droits restent identiques.

Les neuf routes Paie et leurs composants d’interface ont reçu des retouches de palette, contrastes et typographie. Les 35 classes de palette restantes dans ce dossier appartiennent au composant imprimable **PayslipHeader — NE PAS TOUCHER**, laissé identique. Aucun rendu officiel, style d’impression, export, taux ni calcul n’a été remanié. Les parcours de génération et de masse conservent leurs dépendances aux données serveur ; la limite connue de la démo de masse n’est pas levée par ce lot.

Vérifications :

- `check-shell-payroll-review.cjs` : empreintes avant/après sur 31 sources, API, effets, états, conditions, contraintes, variables métier et documents. Seules les chaînes CSS et la référence DOM du menu sont exclues des variables métier ; les objets de présentation des statuts/confirmations sont distingués des données de paie.
- `check-shell-payroll-demo.cjs` : rendu SSR des cinq statuts, rôles employé/admin, chargement/absence, confirmations avec charges utiles inchangées, menus par statut, préservation des données du bulletin, logos app/entreprise/erreur/mise à jour, loaders entreprise/portefeuille et branche legacy.
- TypeScript complet sans cache : réussi ; contrôle de géométrie des menus et régression Présences : réussis.

Audit global : 15 131 → 13 415 classes de palette ; 1 713 → 1 675 hex ; 179 → 175 flous. Les effets signalés dans les branches legacy sont conservés pour isoler la phase 2.

La revue réelle clair/sombre/mobile et la comparaison des impressions à la production restent à faire. Les cases demeurent `[~]`. Après validation : Notifications et Messagerie, puis Formation/Matériel/Recrutement selon l’ordre du brief.
