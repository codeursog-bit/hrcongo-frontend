# Performance — 18 novembre 2026

**Correctifs Rapports/toasts et Performance — 18 novembre :** variation de paie absente affichée « — » sans plantage ; accueil Rapports recomposé en pleine largeur avec trois entrées d’analyse, indicateurs et sections lisibles, absence de données distincte de zéro. Toasts sans surface défilante, secondes et barre de temps restant ; durées de fermeture conservées et pause clavier/survol des toasts maintenue. Ancien widget Bienvenue retiré des coquilles entreprise/PME, cabinet inchangé. Les onze routes Performance et leurs deux variantes PME sont livrées : évaluations en lignes, indicateurs prioritaires, campagnes/grilles plus lisibles, objectifs et dossiers individuels, fenêtres natives. API, autorisations, pondérations, calculs et fiche imprimable conservés sur 23 sources ; palette 2014 → 165, solde réservé au document et à ses dépendances ; audit global 10 014 → 8 165. Démo Performance de lecture seule ajoutée, aucune notation/décision simulée. Tests et TypeScript réussis ; HTTP 200 et 22 scripts contrôlés. Cases [~], revue visuelle utilisateur et impression comparée encore attendues.

## Périmètre et protections

Onze routes, douze composants/helpers partagés, deux variantes PME par réexport. Les noms de champs, appels API, états, permissions, pondérations, formules et commandes sont contrôlés par `check-performance-review.cjs`. Le seul changement des fonctions de calcul de rapport concerne le formatage d’une valeur absente (aucun montant calculé). Les deux durées des providers d’alerte/notification restent 4 s par défaut et 12 s ; un horodatage d’affichage est ajouté pour synchroniser le décompte. Les titres historiques des événements restent identiques.

La fiche est un document natif imprimable : seuls les contrôles `print:hidden` sont migrés dans son code. `sheet-types.ts` et `ScorePicker.tsx` gardent leurs styles imprimables ; aucune modification du modèle officiel. Les icônes de choix du formulaire sont remplacées par Lucide, en conservant identifiants et libellés. Les fenêtres conservent leurs enfants et leurs callbacks ; Échap et retour du focus sont fournis par le dialogue natif.

## Contrôles

- Onze vues avec données fictives et cinq états de fenêtres, aucun appel réel ni notation exécutée.
- Tests du dialogue natif, du compteur de toast (progression, pause, reprise), des pourcentages absents et de la comparaison de paie manquante.
- Garde-fous Performance, Rapports et providers ; TypeScript intégral sans cache puis vérification ciblée des dernières modifications.
- HTTP 200 sur Rapports, Paie & Coûts, Performance, détail campagne et fiche ; 22 scripts référencés vérifiés.
- Aucune revue visuelle par navigateur ni comparaison d’impression réelle : à faire par l’utilisateur, cases [~].
