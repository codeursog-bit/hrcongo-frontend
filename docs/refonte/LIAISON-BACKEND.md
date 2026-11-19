# Liaison des ajouts front avec le back — 19 novembre 2026

Les six contrats actuellement consommés par le front ont une implémentation Nest/Prisma et un adaptateur HTTP réel. Le chantier Assistant reste séparé et non commencé.

## Routes et droits

| Contrat | Routes | Règles serveur |
|---|---|---|
| Tâches | `GET /tasks/me`, `GET /tasks/admin`, `POST /tasks`, `POST /tasks/assign`, `PATCH /tasks/:id`, `POST /tasks/:id/comments` | Perso : propriétaire seul, même face à un admin. Assignation/suivi équipe : ADMIN/RH. Statut : destinataire individuel ou département. Commentaire : destinataire ou ADMIN/RH sur une tâche assignée. |
| Événements/réactions | `GET /day-events`, `POST /day-events/:id/reactions` | Entreprise active vérifiée. Anniversaire/bienvenue issus des employés actifs, jour/mois sans âge ni date de naissance. Expiration, cinq réactions autorisées, bascule atomique et unicité par personne/emoji. |
| Annonces | `GET /announcements`, `POST /announcements` | Lecture dans l’entreprise ; création ADMIN/RH. Carte événement pendant 24 h ; liste des annonces conservée. |
| Ancienneté | `GET /anniversaries/notifications`, `PATCH /anniversaries/notifications/:id/read` | Notification privée à la personne et aux ADMIN/RH. Lecture marquée uniquement par le destinataire. Messages par palier, signature entreprise, génération idempotente à la lecture et à 8 h au Congo. |
| Aperçu de journée | `GET /day-overview/me` | Fériés configurés, collègues en congé/absence approuvée sans motif privé ; même département pour les employés, entreprise pour les RH. Horaire spécifique, puis récurrent, puis paramètres réellement configurés ; aucun horaire fictif. |
| Apparence | `GET /appearance/me`, `PATCH /users/me/appearance`, `PATCH /companies/:id/appearance` | Politique entreprise : ADMIN uniquement et audit. Choix personnels conservés mais ignorés si verrouillés. Mode toujours personnel ; couleurs/ambiances validées. |

Toutes les routes utilisent la session JWT existante (cookie HttpOnly ou Bearer), relisent le rôle en base et vérifient l’accès à l’entreprise active. Un identifiant ou un rôle transmis par le front ne suffit pas. Les tâches personnelles et les contenus des nouvelles routes sont masqués dans les corps/query des journaux d’audit et d’erreurs ; les erreurs internes privées ne conservent pas leur pile/contenu.

## Stockage et activation

- Migration additive : `backend/prisma/migrations/20261119000000_daily_workspace/migration.sql` : sept tables, préférences JSON utilisateur/entreprise et booléen d’autorisation. Appliquée et enregistrée sur PostgreSQL **local** uniquement ; les autres migrations en attente n’ont pas été exécutées.
- Aucun changement des calculs de paie, documents officiels ou champs documentaires `primaryColor`/`secondaryColor`.
- Hors démo, les six drapeaux `NEXT_PUBLIC_FEATURE_{TASKS,DAYEVENTS,ANNOUNCEMENTS,ANNIVERSARIES,DAYOVERVIEW,APPEARANCE}_API` sont désormais actifs par défaut ; une valeur explicite `false` désactive la fonction concernée. Déployer la migration et le back avant le front. Un ancien déploiement qui fixe ces drapeaux à `false` doit les réactiver.
- `NEXT_PUBLIC_DEMO_MODE=true` continue de sélectionner les adaptateurs démo. La configuration locale existante est conservée : les données de démonstration ne prouvent pas une liaison réelle. Pour utiliser les données serveur dans l’app : mode démo désactivé, redémarrage Next et vraie connexion.
- Le mode clair/sombre/auto se restaure depuis le serveur ; les sauvegardes successives sont ordonnées et une réponse tardive ne remplace pas un choix récent. Les ambiances/couleurs effectives sont toujours rendues par les tokens et le correcteur de contraste existants.

## Vérifications reproductibles

Depuis `backend` :

```text
node scripts/check-daily-workspace.cjs
node scripts/check-daily-privacy.cjs
npm run check-types
```

Le premier test exige PostgreSQL local et utilise de vraies sessions, Nest HTTP et la base, puis exécute les six adaptateurs front avec le client HTTP partagé et des cookies. 64 contrôles HTTP plus assertions de contrats/persistance : deux entreprises, droits, tâches privées, rôles périmés, session révoquée, réactions concurrentes/expirées, ancienneté sans doublon, congés sans motif et verrouillage/réactivation des couleurs. Les entreprises/utilisateurs fictifs créés par ce test sont supprimés par leurs UUID exacts ; aucune donnée existante n’est nettoyée. Aucun mail, push ni cron global n’est lancé par le test.

Depuis `frontend` : `node scripts/check-refonte-foundations.cjs`, `node scripts/check-appearance.cjs`, `node scripts/check-appearance-preparation.cjs`, `node scripts/check-appearance-server-sync.cjs`, contrôle TypeScript sans cache et directives client : réussis. Sans navigateur ; la revue visuelle générale reste à faire.

## Limite du lot

Ce lot termine les six contrats des vues existantes. Les extensions du brief qui n’ont pas encore d’interface/contrat — page admin de gestion des tâches, échéances/priorités éditables, push et rappels de tâches, réglage de visibilité des anniversaires et notification groupée des réactions — restent des fonctions futures, pas des parcours présentés comme livrés. Le 29 février suit actuellement la date exacte, sans report automatique les années non bissextiles. La cloche générale conserve son flux de notifications existant ; l’ancienneté est reliée dans Ma journée.
