# Rapports — 18 novembre 2026

**Utilisateurs, Rapports et composants communs — 18 novembre :** utilisateurs en liste par défaut, grille quatre colonnes sur grand écran, pagination 10/20/30/40/50 et retour en première page après filtrage. Les seize routes Rapports et la comptabilité PME dédiée sont revues ; cinq autres variantes PME héritent par réexport. Rubriques accessibles sur les analyses longues, tableaux défilants, graphiques thématiques sans grille et suppression des commandes sans action. Alertes, notifications temps réel, rappels et blocages d’abonnement harmonisés ; piles coordonnées et panneau de détail natif. Rôles, appels API/sockets, minuteries, exports et documents conservés ; cabinet/super admin conservent leur rendu. Palette du lot Rapports : 601 → 46 (reste protégé imprimable) ; audit global : 10 740 → 10 014. Tests de rendu des 17 vues, interactions utilisateurs, feedback, panneau et TypeScript réussis ; HTTP 200 + 19 scripts vérifiés. Cases [~] maintenues : revue visuelle réelle et comparaison d’impression à faire par l’utilisateur. Attendre son retour avant le prochain module.

## Vérifications

- `check-reports-review.cjs` : empreintes sur 22 sources métier ; commandes, API, effets, états, conditions et exports conservés. Les zones natives imprimables sont comparées après exclusion de leurs seuls contrôles `print:hidden`.
- `check-reports-views.cjs` : 16 routes + comptabilité PME, sans exécuter les effets/API. Les observatoires réutilisent le composant partagé, remplacé par une doublure dans ces tests.
- `check-user-collection.cjs` : pagination, recherche, limites, modes et vide.
- TypeScript intégral sans cache réussi ; contrôle ciblé complémentaire du panneau et des composants feedback réussi.
- HTTP 200 : utilisateurs, accueil Rapports, Effectifs et Comptabilité ; 19 scripts référencés également en 200.
- Aucune revue visuelle par navigateur ni comparaison d’impression réelle effectuée. Les cases restent [~].

Les couleurs propres aux documents natifs DAS/personnel et au logo ne sont pas migrées. Le journal à l’écran est thématique ; `JournalPrintable` et les exports gardent leurs couleurs officielles.
