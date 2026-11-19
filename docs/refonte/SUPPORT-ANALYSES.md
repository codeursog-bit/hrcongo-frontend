# Conversations, support et analyses — 19 novembre 2026

Livré `[~]` ; contrôle visuel final encore attendu. Aucun navigateur lancé pour ce lot.

## Décisions et présentation

- Aide et Assistant restent distincts, mais s’ouvrent maintenant dans deux fenêtres natives **centrées**, adaptées au mobile, avec Échap, fermeture extérieure et restitution du focus. Aide conserve ses articles et les trois orientations. Assistant présente la conversation, les bulles, la saisie et l’historique ; un volet compact permet de choisir une analyse précise.
- Les pages Messages conservent le chat entre collègues dans « Équipe ». Un espace « Support Konza » séparé permet de contacter notre équipe ; accessible depuis l’aide et l’assistant. Badge des conversations support non lues dans Messages. Aucun contenu du support n’est envoyé à l’assistant.
- Le support est un chantier autorisé explicitement côté superadmin par l’utilisateur. Les autres écrans admin/cabinet ne sont pas refondus.

## Support réellement connecté

- `/messages?support=1` et `/portefeuille/messages?support=1` : conversations privées rattachées au compte, pas à une obligation d’avoir une entreprise. `/assistance` offre le même accès indépendant de la coquille métier, y compris pour un compte sans entreprise et les rôles redirigés vers leur espace spécialisé ; lien depuis Contact et les notifications e-mail. Questions, incidents, réclamations ; historique, pagination, réponse et réouverture automatique après un nouveau message client.
- `/admin/support` : boîte commune des agents et du superadmin, filtres, pagination, attribution, priorité, états À traiter/En cours/Résolue, réponses et notes internes. La lecture est partagée par l’équipe ; le superadmin garde la vue sur toutes les demandes. Les anciens messages Contact sont importés progressivement par lots de cent lors de l’ouverture de la boîte.
- Seul le superadmin crée/désactive les agents dans « Agents support ». Rôle PostgreSQL `SUPPORT`, sans entreprise, mot de passe provisoire haché et changement obligatoire par le flux d’authentification existant. Connexion via `/auth/login`, redirection vers `/admin/support`. Désactivation : sessions révoquées. Les agents n’ont pas accès aux autres fonctions superadmin ni aux API d’entreprise : restriction du rôle dès la stratégie JWT, avec rôle courant de la base. Cela couvre aussi les anciennes routes protégées uniquement par JWT.
- Contact public : enregistrement transactionnel du message et de la conversation, sans faux succès si la persistance échoue. Lien privé personnel de trente jours envoyé par e-mail et disponible à l’écran. `/contact/suivi` lit le secret depuis le fragment, l’enlève de l’adresse et le garde dans le stockage de session ; le serveur ne conserve que son empreinte. Le nom/e-mail du visiteur sont déclaratifs, pas une preuve d’identité. Aucun rattachement automatique par e-mail à un compte existant.
- Réponses notifiées par e-mail. Échec de notification signalé à l’agent sans perdre le message. Un ancien contact sans lien, ou un lien expiré, reçoit un nouveau lien à la prochaine réponse. Le bouton de renvoi demande confirmation car il remplace le lien précédent. Les liens et les notes internes ne figurent pas dans la vue client.
- Texte du chat chiffré AES-GCM avec la clé de messagerie existante et l’identifiant de conversation comme contexte. Corps et secrets masqués dans les journaux d’audit/erreur. Limites de saisie et de débit, identifiants de message pour reprendre un envoi sans doublon. Pas de pièce jointe dans ce premier lot.
- Mise à jour toutes les cinq secondes sur une conversation ouverte, ralentie sur la liste et sur erreur ; pas de lecture en arrière-plan. Ce n’est pas une connexion WebSocket. Le mode démo ne transmet aucun faux message client à l’équipe réelle.

## Analyses intégrées : neuf outils, limites explicites

ADMIN/RH uniquement, entreprise vérifiée au serveur. Choix explicite de la période et recherche d’employé avec matricule pour lever les homonymes. Aucune donnée salariale calculée par le front.

| Outil | Résultat et limite |
|---|---|
| Effectifs | Moteur du rapport existant : début, entrées, sorties, fin, par département. |
| Évolution de masse salariale | Comparaison au mois précédent : brut, net, coût employeur enregistré, écarts de primes/heures supplémentaires et reste de l’écart. Tous les statuts sont inclus comme dans le rapport comparatif ; pas de causalité individuelle inventée. L’analyse complète de toutes les causes demeure limitée aux éléments attestés. |
| Rémunérations les plus élevées | Jusqu’à cinq bulletins validés/à payer/payés, triés par net ; composition brute, primes et heures supplémentaires. |
| Paie d’un employé | Bulletin enregistré, base/primes/heures supplémentaires/brut/retenues/net/coût employeur ; écart net avec le mois précédent s’il existe. Les totaux enregistrés incluent les taxes du bulletin. |
| Permissions | Cinq premiers employés par nombre de permissions approuvées du mois ; pas une durée d’absence. |
| Départs de congé | Congés approuvés du mois sélectionné. |
| Retours de congé | Retours confirmés datés ou retours prévus avec le calendrier de travail existant ; prévision distincte d’une présence confirmée. |
| Solde de congé | Moteur existant, lecture uniquement. Un cycle manquant ou un débit à appliquer entraîne un refus, sans actualisation par l’assistant. |
| Allocation de congé | Appel du moteur existant avec employé, période et jours explicites ; aperçu à confirmer dans le dossier, sans paiement ni bulletin. |

- Requêtes mensuelles bornées ; classement limité à cinq, calendrier limité à cent congés (refus au-delà). Pas de plage libre multimois pour ce premier lot. Questions locales hors catalogue refusées ; le sélecteur donne accès à l’ensemble des outils. Pas de conseil juridique ni de prévision inventée.
- Transactions PostgreSQL `READ ONLY`, avec barrière supplémentaire bloquant les mutations ORM avant Prisma pour les moteurs de congés. Les services métier et les documents restent inchangés. Test d’écriture SQL volontaire bloqué, test de création de cycle refusé, empreinte des données métier identique avant/après les neuf outils.
- Chaque carte affiche période/source et accès au dossier. Cartes d’analyses chiffrées chiffrées dans l’historique ; questions normalisées, pas de texte libre ni de nom réel enregistré dans les messages assistant. Les noms des cartes sont résolus à l’affichage à partir des identifiants autorisés dans l’entreprise courante. Aucun fournisseur IA externe.
- Quotas C1 conservés ; aide, guides, refus et listes sans résultat ne consomment pas d’analyse. Doublons du même outil/période pendant dix minutes sans nouvelle consommation. L’activation globale des analyses reste désactivée par défaut.

## Vérifications et déploiement

- Tests : 49 contrôles HTTP support et véritable adaptateur front, UI client/agent/visiteur, notes internes, reprise d’envoi, reprise des anciens contacts et renouvellement des liens ; 108 contrôles HTTP assistant avec les neuf outils sur fixtures réelles, exactitude du moteur d’allocation, chiffrement, droits/isolation, quotas et refus ; 90 questions de référence, tests guides, SSE et fenêtres natives. Types front/back et garde-fous Paie/Présences.
- Audit inchangé : 8 165 palette, 1 438 hex, 375 emojis, 210 dégradés. Revue visuelle clair/sombre/mobile en attente.
- Migration **additive** `20261119030000_support_workspace`, appliquée et enregistrée localement seulement. Déployer cette migration avec le back et le front ; conserver la clé `CHAT_ENCRYPTION_KEY` pour pouvoir relire les conversations et les cartes d’analyses. Ne pas appliquer aveuglément les autres migrations en attente.
- Le mode démo local est conservé. Tester les véritables échanges avec une session et un back réels ; aucune boîte support ni paie fictive n’est présentée comme une réponse réelle.

## Dernier lot demandé, encore à faire

Après ce lot et le contrôle final : suggestions de fonctionnalités et retours clients sur difficultés, dysfonctionnements, irritants et améliorations souhaitées. La réclamation support est déjà disponible ; ce futur espace de retours produit reste séparé. Le mode IA externe C2 reste conditionné à la licence sans entraînement/rétention et à sa suite de confidentialité ; il n’est pas activé.
