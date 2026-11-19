# Mission 1 — reprise du 17 novembre 2026

## Périmètre et attribution

Base technique : `fa79326` (11 novembre 2026). Aucun commit de refonte distinct n’existe dans les 40 derniers commits : il est impossible d’attribuer chaque différence à Codex, Copilot ou Claude par Git. Les modifications locales ne sont pas présentées comme le travail exclusif des deux autres intervenants.

La capture initiale compte **234 fichiers suivis modifiés**, **155 sources non suivies** et **382 sources dans le périmètre de contrôle** après exclusion des deux layouts cabinet/super admin. Les documents, archives et fichiers générés ne sont pas des cibles de remplacement global. Références détaillées : [périmètre](controle-mission-1/perimetre.json), [lots annoncés](controle-mission-1/lots-claude.json), [indicateurs statiques](controle-mission-1/grille-statique.json).

Les six lots de Claude sont présents : 42/42, 9/9, 9/9, 6/6, 13/13 et 18/18 fichiers repérés selon le journal. Présence ne signifie pas conformité visuelle. Écart du lot 2 : `/ma-paie` était supprimée alors que sa variante PME la réexporte ; elle a été restaurée **octet pour octet depuis la base Git**, sans cadre ni changement du bulletin. Le cadre annoncé reste donc à revoir séparément, avec l’impression.

## Corrections et vérifications

- Ajout de `npm run audit:refonte`, en utilisant le script d’audit existant.
- Cible TypeScript explicite `ES2017` : corrige les itérations Map/chaînes signalées dans Entretiens et les certificats, sans modifier ces fichiers ni leurs calculs. Contrôle complet réussi avec `npm run check-types -- --incremental false` après un premier contrôle incrémental encore en échec.
- **21 scripts réussis, 1 en échec** ; [résultats](controle-mission-1/tests.json). Les sept contrôles HTTP ne sont pas exécutés : aucun serveur ni navigateur lancé pour ce lot, conformément aux directives d’économie.
- Échec conservé : `check-service-pages.cjs` détecte des différences fonctionnelles préexistantes dans Formation, notamment le choix de modèles et le générateur de certificats, ainsi que les sessions. Le test n’a pas été affaibli et ces éléments n’ont pas été modifiés. Cet écart exige un arbitrage distinct du nettoyage visuel.
- Les fichiers cabinet/super admin, les appels API, les permissions, les calculs et les documents n’ont pas été retouchés par ce lot. La restauration de Ma paie remet exactement le fichier Git existant. Aucun travail backend, démo ou assistant.

## Mesure avant / après

| Indicateur | Avant restauration | Après restauration |
|---|---:|---:|
| Classes de palette | 17 827 | 17 852 |
| Couleurs hex | 1 768 | 1 783 |
| Emojis | 465 | 467 |
| Dégradés | 252 | 252 |
| Pulse / ping | 73 | 73 |
| Flou / verre | 209 | 209 |

La hausse correspond exclusivement au retour de la page manquante dans le comptage. Cette mission établit la mesure ; elle ne constitue pas une passe de nettoyage. L’audit reste un indicateur lexical : réactions autorisées, couleurs documentaires dans les pages mixtes et composants partagés exigent une lecture sémantique avant correction.

## Suite et grille de conformité

Les fichiers repérés ne sont pas déclarés conformes : cartes, en-têtes, doublons de menus, sélecteurs, états, graphiques, clavier, contraste et rendu mobile/sombre restent à contrôler passe par passe. Les indicateurs statiques ne remplacent pas cette lecture ni les tests d’impression.

Prochain lot, après feu vert : **passe 1, module Employés**, en commençant par la fiche (17 occurrences d’emojis selon l’audit), puis ses composants associés. Le Portefeuille a zéro emoji dans les pages comptées ; ses autres écarts (544 classes de palette, 19 hex, 1 dégradé, 14 pulse/ping et 11 flous) seront traités dans les passes suivantes. Cabinet et super admin restent exclus. Aucune validation visuelle utilisateur n’est ajoutée.
