# Abonnements — 19 novembre 2026

Demande utilisateur : tarifs décidés par le superadmin, blocage après expiration avec accès au tableau de bord et au paiement.

## Catalogue

| Clé conservée | Offre | Particularités |
|---|---|---|
| BASIC | Jusqu’à 50 employés | Effectifs, présence, congés/absences, paie, espaces employé/manager |
| PRO | Jusqu’à 100 employés | Avances/prêts, rapports, exports, contrats, messagerie ; 4 administrateurs ADMIN/HR_MANAGER ; 2 offres créées par mois civil |
| ENTERPRISE | Plus de 100 employés | Tous modules ; recrutement illimité, formation, déclarations CNSS/DAS et annuel |
| Devis existant | Besoin spécifique | Proposition établie par le superadmin |

Les prix d’exemple 35 000 / 45 000 / 65 000 FCFA ne deviennent pas des valeurs de repli. La table `plan_prices`, administrée depuis `/admin/billing`, reste la seule source des prix. Aucun prix existant ni facture n’a été modifié. Un prix absent reste indisponible. FREE reste une clé technique pour les anciens comptes ; il ne figure plus dans le catalogue commercial.

## Expiration

- Intercepteur global Nest après les guards : vérification de l’entreprise et de l’abonnement pour les requêtes authentifiées ; refus avant exécution d’une action métier.
- Échéance payante ou essai : blocage immédiat sans attendre le cron. Le marqueur `downgradedAt` empêche la réouverture automatique après rétrogradation FREE. Activation confirmée : effacement existant du marqueur conservé.
- Tableau de bord et ses lectures, session/authentification et paiement sont maintenus. Aucun changement des droits de paiement : un employé doit contacter son administrateur.
- Page de paiement principale `/parametres/subscription` ; `/pricing` conserve le paiement sur devis, `/success` le retour prestataire. Il s’agit des étapes du paiement, pas d’un accès aux modules.
- La page métier n’est pas montée pendant la vérification ni après refus. Une erreur de vérification propose Réessayer et Tableau de bord. Les refus des lectures automatiques de la coquille sur dashboard/paiement restent des erreurs HTTP sans ouvrir continuellement une modale ; une action refusée ouvre la modale.
- Les PME gérées par cabinet conservent leur mécanisme existant. Aucune page cabinet/superadmin ni document imprimable modifié.

## Vérification

Tests `backend/src/subscriptions/subscription-access*.spec.ts` : échéances, rétrogradation, paiement, mutations refusées, paliers ; test HTTP Nest avec contrôleur témoin pour vérifier qu’une écriture bloquée n’est jamais exécutée et qu’elle redevient possible après renouvellement confirmé.

`frontend/scripts/check-subscription-access.cjs` : 11 scénarios de rendu (chargement, panne, expiration, dashboard/paiement, rôle employé, exemption cabinet). `qa-pricing-display.cjs` : prix superadmin, remplacement du catalogue, indisponibilité et rendu public.

Vérifications TypeScript sans cache front/back effectuées. Tests sans paiement réel et sans changement de base de production. Une validation manuelle du parcours sur le compte de test avec le prestataire configuré reste à faire ; aucun paiement réel déclenché.
