# Présences — revue du module complet, 18 novembre 2026

23 routes contrôlées : 9 pages Présences, 6 Absences et 8 Permissions, avec les cinq vues internes et les composants délégués. Les variantes PME continuent à déléguer aux mêmes pages. Cabinet et super admin exclus.

| Passe | Résultat |
|---|---|
| 1 — Icônes | Lucide ; emojis retirés des commandes, états et exemples de shifts. Les derniers signalements de l’audit concernent des logs/commentaires. |
| 2 — Couleurs | 1 616 → 0 classes de palette dans les 40 sources contrôlées. Contrôles et graphiques suivent le thème ; statuts fixes. Les valeurs hex des presets et du choix de couleur des shifts sont des données persistées : elles sont conservées, les badges utilisent les tokens. |
| 3 — Effets | Dégradés décoratifs 8 → 0, pulse/ping 13 → 0, flous 23 → 0, ombres colorées 3 → 0. Pas de déplacement des lignes au survol. |
| 4 — Graphiques | Couleurs de thème, courbes lisses, anneaux épais et barres arrondies existants conservés. Valeurs, séries et exports identiques. |
| 5 — UX | Navigation pleine largeur sur la pointeuse ; horloge et commandes séparées ; saisie manuelle élargie ; navigation ajoutée aux shifts ; filtres communs ; périodes contextualisées ; indicateurs visibles ; tableaux stables avec défilement au clavier ; dialogues natifs et sélecteurs dans la couche modale. Parcours unifié des demandes conservé. |
| 6 — Vérifications | TypeScript sans cache réussi. Démo/SSR Présences, six routes Absences, huit Permissions, formulaires/payloads, rôles/isolation, états et sélecteurs contrôlés. Revue réelle clair/sombre/mobile et comparaison des impressions à la production **en attente de l’utilisateur**. |
| 7 — Cartes Ma journée | Hors de ce lot Présences ; aucune carte anniversaire/événement/tâche modifiée. |

Les empreintes `mesures.json` comparent l’état de travail avant la revue et le résultat : API exactes, effets, états, variables sans JSX, conditions, contraintes des champs, couleurs de shifts persistées et sous-arbres des documents. Seules les chaînes de présentation (CSS, couleurs, emojis) sont neutralisées pour les variables/effets ; API, états initiaux et documents restent comparés strictement.

Les tests historiques ne comparent plus tout le HTML avec HEAD : ils réutilisent cette référence figée, puis exécutent leurs scénarios de rendu et de soumission existants. Les trois fichiers de rapport Présences/export restent également comparés intégralement avec HEAD. Aucun calcul ni appel ajouté, aucun nouveau besoin back. Les scans, la géolocalisation, le jumelage et les téléchargements réels nécessitent toujours leur environnement habituel.

Les 23 cases restent `[~]`. Tester visuellement la pointeuse et la saisie manuelle, les tableaux à plusieurs employés, les fenêtres de correction/attribution, puis les pages Absences/Permissions avec dossier sélectionné et sans données, en clair/sombre et sur mobile. Vérifier les rapports imprimés sans nouvelle mise en forme.

## Correctif « Plus » sur capture — 18 novembre

Le menu était aligné sur le bord gauche de son bouton, à droite de la barre : sa largeur dépassait la zone disponible. Le comptage des onglets ne tenait pas non plus compte de la largeur réelle d’un onglet actif remonté depuis le menu ni de tous les espaces autour des séparateurs.

Position fixe calculée dans les limites de la colonne et de l’écran, portail dans le body (ou le dialog natif), hauteur limitée à l’espace restant, ouverture possible vers le haut, défilement interne et libellés pouvant revenir à la ligne. Recalcul au redimensionnement, fermeture lors du défilement de la page, focus et Échap conservés, navigation par flèches et menu masqué à l’impression. Le cas très étroit peut afficher seulement « Plus », avec l’onglet actif signalé à l’intérieur.

`check-module-nav-layout.cjs` : géométrie de 280 à 1920 px, positions basses, colonnes étroites et onglets actifs longs. `check-module-nav-menu.cjs` : composant réel avec DOM contrôlé, portail, clics internes/externes, défilement, focus, clavier et nettoyage. TypeScript strict ciblé et `check-presences-review.cjs` réussis. Audit global avant/après inchangé : 15 131 classes, 1 713 hex, 406 emojis, 243 dégradés. Vérification effectuée sans navigateur sur autorisation de l’utilisateur ; aucune validation visuelle réelle revendiquée.
