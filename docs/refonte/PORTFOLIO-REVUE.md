# Aide, Assistant et Portefeuille — 19 novembre 2026

État `[~]` : livré, validation visuelle utilisateur attendue.

## Fenêtres Aide et Assistant

La conversation défile dans sa propre zone ; la saisie et le pied restent dans le flux, sans superposition. L'explication de confidentialité est repliable. Les trois parcours guidés sont alignés sous leur titre, avec une seule colonne sur petit écran.

## Portefeuille

Les 17 routes ont été contrôlées ; Messages conserve son écran partagé existant. Synthèse : indicateurs en premier, graphiques regroupés. Entreprises : cartes adaptatives et tableaux stables. Demandes, congés, absences, employés, équipe, paie et prêts : contrôles cohérents, tokens du thème, onze fenêtres natives avec Échap et restitution du focus. Rapports : regroupement des six graphiques, intitulé Coût employeur corrigé sans modifier ses valeurs. Les vues partagées Présences/Absences et Prêts/Avances activent désormais leur contexte visuel commun.

Les règles visuelles communes sont limitées à l'écran. Aucun appel API, calcul, droit ou contenu officiel imprimable n'a été modifié. Cabinet et superadmin sont hors de ce lot.

| Mesure | Avant | Après |
|---|---:|---:|
| Classes de palette dans les pages Portefeuille | 544 | 0 |
| Palette globale, audit | 8165 | 7621 |
| Hex globaux | 1438 | 1419 |
| Pulse/ping globaux | 53 | 39 |
| Flou/verre global | 122 | 111 |

Validation : `check-portfolio-review.cjs` et empreintes de 20 sources dans `controle-portefeuille/mesures.json` ; API, effets, états, variables de calcul, conditions, contraintes et documents identiques. Seuls deux anciens paramètres de couleur d'avatar et l'alias visible d'une série sont exclus explicitement. Contrôles Assistant UI/provider, Support, Prêts, Présences, rendu des Rapports et TypeScript sans cache réussis.

Le navigateur a permis un contrôle limité de la structure accessible du chat. La revue réelle de toutes les pages en clair, sombre et mobile, ainsi que la comparaison d'impression, reste attendue ; aucun résultat de validation visuelle exhaustive n'est revendiqué.

## Fournisseurs IA

Les neuf outils d'analyse internes communiquent avec le backend. Aucun adaptateur externe GPT, Claude, Gemini ou Mistral n'est raccordé. Ajouter une clé ne suffit donc pas pour tester ces modèles. Le chantier C2 décrit dans `ASSISTANT.md` reste à réaliser : adaptateurs serveur, politique d'activation/licence, pseudonymisation et tests des échanges. Aucune clé ni donnée RH n'a été envoyée à un fournisseur pendant ce lot.
