# Revue Congés — 18 novembre 2026

13 routes et 3 composants partagés. En-têtes, filtres, tableaux accessibles avec défilement horizontal, légendes et graphiques en tokens. Les hachures des demandes en attente restent un repère fonctionnel. Les documents imprimables et les appels API sont NE PAS TOUCHER.

`node scripts/check-leave-review.cjs` compare les empreintes API/hooks, effets, états, variables métier, droits, contraintes, callbacks et documents à celles relevées avant ce lot. `check-leave-module.cjs` conserve les scénarios métier et les quatre étapes de demande. Les sélecteurs natifs requis par les formulaires sont conservés.

Audit global : palette 13415 → 12254, hex 1675 → 1648, dégradés 243 → 241, pulse 56 → 55, flous 175 → 173. TypeScript sans cache et contrôles ciblés réussis. Revue visuelle clair/sombre/mobile et impression comparée à la production en attente ; cases [~]. Aucun besoin back ajouté.

## Ajustements après captures

Liste À traiter, accents des interfaces alignés sur la couleur principale et Planification des départs en tête du menu. Soldes, droits et URLs conservés. `DocumentReader` remplace uniquement les cadres et échelles fixes des trois aperçus ; les composants et sous-arbres imprimables gardent les mêmes empreintes. Ajustement à la largeur, zoom et plein écran vérifiés par `check-document-reader.cjs`. Revue visuelle réelle toujours attendue.
