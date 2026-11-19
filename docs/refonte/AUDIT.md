# AUDIT DE LA REFONTE (généré)

Généré le 2026-11-18 par `scripts/audit-refonte.mjs` (lecture seule). Exclus : phase 2 (admin, cabinet), documents imprimables et exports, démos, types. 612 fichiers analysés.

## Totaux

| Mesure | Total | Objectif |
|---|---|---|
| palette | 8165 | tendre vers 0 (tokens) |
| hex | 1438 | seulement des constantes de marque ou de graphiques |
| emojis | 375 | 0 comme icône (réactions et contenus utilisateur autorisés) |
| dégradés | 210 | 0 |
| pulse / ping | 53 | 0 |
| flou / verre | 122 | 0 |
| ombres colorées | 24 | 0 |
| texte dégradé | 10 | 0 |

## Par zone

| Zone | Fichiers | palette | hex | emojis | dégradés | pulse / ping | flou / verre | ombres colorées | texte dégradé |
|---|---|---|---|---|---|---|---|---|---|
| dashboard | 175 | 2524 | 229 | 134 | 38 | 12 | 25 | 1 | 4 |
| portefeuille | 18 | 544 | 19 | 0 | 1 | 14 | 11 | 0 | 0 |
| pages publiques | 51 | 2438 | 630 | 127 | 121 | 14 | 59 | 17 | 2 |
| composants, hooks, lib | 306 | 2455 | 552 | 103 | 47 | 13 | 24 | 6 | 4 |
| espace PME | 62 | 204 | 8 | 11 | 3 | 0 | 3 | 0 | 0 |

## Classes de palette Tailwind à convertir en tokens (top 30)

| Nombre | Fichier |
|---|---|
| 369 | `app/simulateur/SimulateurClient.tsx` |
| 343 | `app/(dashboard)/formation/page.tsx` |
| 303 | `app/(dashboard)/cnss-declaration/page.tsx` |
| 253 | `lib/absence-tracking-colors.ts` |
| 246 | `components/ContractRupturePage.tsx` |
| 198 | `app/affiliate/dashboard/page.tsx` |
| 191 | `app/(dashboard)/loans/page.tsx` |
| 188 | `app/(dashboard)/contrats/page.tsx` |
| 184 | `app/(dashboard)/documents/page.tsx` |
| 159 | `app/(dashboard)/contrats/rupture/pse/page.tsx` |
| 142 | `app/(dashboard)/success/page.tsx` |
| 141 | `app/jobs/portal/page.tsx` |
| 131 | `app/outils/calcul-its-congo/ItsCalculatorClient.tsx` |
| 125 | `app/auth/register/page.tsx` |
| 125 | `app/jobs/ia/[id]/page.tsx` |
| 124 | `app/jobs/ia/[id]/test/[candidateId]/page.tsx` |
| 121 | `app/(dashboard)/performance/fiche/[id]/page.tsx` |
| 114 | `app/(dashboard)/onboarding/page.tsx` |
| 112 | `components/employees/create/Step4UserAccount.tsx` |
| 107 | `components/blog/BlogEditor.tsx` |
| 107 | `components/JobFilterSelect.tsx` |
| 106 | `app/jobs/[id]/page.tsx` |
| 101 | `app/outils/calcul-heures-supplementaires-congo/HeuresSupClient.tsx` |
| 99 | `app/auth/login/page.tsx` |
| 99 | `app/outils/calcul-camu-congo/CamuCalculatorClient.tsx` |
| 97 | `app/outils/calcul-cnss-congo/CnssCalculatorClient.tsx` |
| 89 | `app/(dashboard)/primes/attribuer/page.tsx` |
| 88 | `app/(dashboard)/rh-blog/page.tsx` |
| 86 | `app/companies/create/page.tsx` |
| 85 | `components/payment/ChariowCheckoutModal.tsx` |

## Emojis à remplacer par des icônes en trait fin (top 30)

| Nombre | Fichier |
|---|---|
| 24 | `app/docs/page.tsx` |
| 16 | `app/outils/calcul-cnss-congo/CnssCalculatorClient.tsx` |
| 16 | `components/CanvasEditor/index.tsx` |
| 13 | `app/(dashboard)/paie/comptabilite/page.tsx` |
| 13 | `components/blog/BlogEditor.tsx` |
| 11 | `app/pme/[companyId]/rapports/comptabilite/page.tsx` |
| 11 | `components/onboarding/CabinetOnboardingChecklist.tsx` |
| 10 | `app/outils/calcul-camu-congo/CamuCalculatorClient.tsx` |
| 10 | `components/onboarding/OnboardingChecklist.tsx` |
| 9 | `app/(dashboard)/paie/impayes/page.tsx` |
| 9 | `app/companies/create/page.tsx` |
| 8 | `app/(dashboard)/formation/page.tsx` |
| 8 | `app/outils/calcul-heures-supplementaires-congo/HeuresSupClient.tsx` |
| 8 | `app/page.tsx` |
| 7 | `app/(dashboard)/paie/manuel/page.tsx` |
| 7 | `app/(dashboard)/paie/masse/page.tsx` |
| 7 | `app/(dashboard)/paie/page.tsx` |
| 6 | `app/(dashboard)/parametres/entreprise/page.tsx` |
| 6 | `app/(dashboard)/presences/page.tsx` |
| 6 | `app/auth/login/page.tsx` |
| 6 | `app/outils/calcul-its-congo/ItsCalculatorClient.tsx` |
| 6 | `app/outils/calcul-tus-congo/TusCalculatorClient.tsx` |
| 5 | `app/(dashboard)/rapports/comptabilite/page.tsx` |
| 5 | `app/not-found.tsx` |
| 5 | `app/outils/page.tsx` |
| 4 | `app/(dashboard)/employes/[id]/edit/page.tsx` |
| 4 | `app/(dashboard)/paie/nouveau/page.tsx` |
| 4 | `app/(dashboard)/paie/simulateur/page.tsx` |
| 4 | `app/(dashboard)/paie/[id]/components/PayslipFooter.tsx` |
| 4 | `app/(dashboard)/parametres/primes/page.tsx` |

## Couleurs hexadécimales en dur (dont graphiques) (top 30)

| Nombre | Fichier |
|---|---|
| 227 | `app/docs/page.tsx` |
| 88 | `app/page.tsx` |
| 85 | `components/CanvasEditor/index.tsx` |
| 75 | `app/blog/BlogClient.tsx` |
| 58 | `app/tarifs/TarifsClient.tsx` |
| 54 | `lib/appearance.ts` |
| 50 | `components/onboarding/CabinetOnboardingChecklist.tsx` |
| 40 | `app/(dashboard)/paie/[id]/components/PayslipBreakdown.tsx` |
| 34 | `app/blog/[slug]/BlogPostClient.tsx` |
| 34 | `components/ConventionGuard.tsx` |
| 30 | `app/(dashboard)/parametres/bulletin/page.tsx` |
| 28 | `app/(dashboard)/paie/[id]/components/PayslipEmployeeInfo.tsx` |
| 28 | `lib/absence-tracking-colors.ts` |
| 27 | `components/workforce/WorkforceDashboard.tsx` |
| 24 | `app/verify/[ref]/page.tsx` |
| 23 | `components/blog/BlogEditor.tsx` |
| 23 | `components/landing/Hero.tsx` |
| 22 | `app/(dashboard)/paie/[id]/components/PayslipFooter.tsx` |
| 22 | `components/loans/LoansDashboard.tsx` |
| 22 | `components/onboarding/OnboardingChecklist.tsx` |
| 19 | `lib/certificate-templates.ts` |
| 18 | `app/(dashboard)/formation/page.tsx` |
| 18 | `lib/request-history.ts` |
| 17 | `app/qui-sommes-nous/page.tsx` |
| 17 | `components/landing/Footer.tsx` |
| 15 | `app/(dashboard)/ma-paie/page.tsx` |
| 14 | `app/(dashboard)/loans/rapport/page.tsx` |
| 14 | `app/(dashboard)/portefeuille/rapports/page.tsx` |
| 14 | `components/auth/FormElements.tsx` |
| 14 | `components/landing/Features.tsx` |

## Dégradés à supprimer (top 30)

| Nombre | Fichier |
|---|---|
| 18 | `app/jobs/ia/[id]/test/[candidateId]/page.tsx` |
| 16 | `app/jobs/ia/[id]/page.tsx` |
| 13 | `app/(dashboard)/success/page.tsx` |
| 10 | `components/subscriptions/TrialBadge.tsx` |
| 7 | `app/blog/BlogClient.tsx` |
| 6 | `app/(dashboard)/rh-blog/page.tsx` |
| 6 | `app/auth/login/page.tsx` |
| 6 | `app/auth/register/page.tsx` |
| 6 | `app/docs/page.tsx` |
| 6 | `app/page.tsx` |
| 6 | `app/simulateur/SimulateurClient.tsx` |
| 6 | `app/verify/[ref]/page.tsx` |
| 5 | `app/(dashboard)/formation/page.tsx` |
| 5 | `app/(dashboard)/pricing/page.tsx` |
| 5 | `app/blog/[slug]/BlogPostClient.tsx` |
| 5 | `app/jobs/portal/page.tsx` |
| 5 | `components/onboarding/OnboardingChecklist.tsx` |
| 4 | `app/kiosk/page.tsx` |
| 4 | `app/tarifs/TarifsClient.tsx` |
| 4 | `components/loans/CashPaymentModal.tsx` |
| 4 | `components/onboarding/CabinetOnboardingChecklist.tsx` |
| 4 | `components/subscriptions/FeatureGate.tsx` |
| 3 | `app/(dashboard)/loans/page.tsx` |
| 3 | `app/companies/create/page.tsx` |
| 3 | `components/landing/Hero.tsx` |
| 3 | `components/loans/LoansForm.tsx` |
| 2 | `app/(dashboard)/performance/fiche/[id]/page.tsx` |
| 2 | `app/affiliate/dashboard/page.tsx` |
| 2 | `app/affiliate/login/page.tsx` |
| 2 | `app/auth/accept-invitation/[token]/page.tsx` |

## Animations pulse / ping à supprimer (top 30)

| Nombre | Fichier |
|---|---|
| 5 | `app/jobs/ia/[id]/test/[candidateId]/page.tsx` |
| 5 | `components/layout/Sidebar.tsx` |
| 4 | `app/(dashboard)/success/page.tsx` |
| 3 | `app/(dashboard)/portefeuille/dashboard/page.tsx` |
| 3 | `app/jobs/ia/[id]/page.tsx` |
| 3 | `components/subscriptions/FeatureGate.tsx` |
| 2 | `app/(dashboard)/pricing/page.tsx` |
| 2 | `app/auth/accept-invitation/[token]/page.tsx` |
| 2 | `app/auth/login/page.tsx` |
| 2 | `components/subscriptions/TrialBadge.tsx` |
| 1 | `app/(dashboard)/cnss-declaration/page.tsx` |
| 1 | `app/(dashboard)/contrats/page.tsx` |
| 1 | `app/(dashboard)/contrats/rupture/pse/page.tsx` |
| 1 | `app/(dashboard)/demandes/page.tsx` |
| 1 | `app/(dashboard)/documents/page.tsx` |
| 1 | `app/(dashboard)/materiel/page.tsx` |
| 1 | `app/(dashboard)/portefeuille/absences/page.tsx` |
| 1 | `app/(dashboard)/portefeuille/conges/page.tsx` |
| 1 | `app/(dashboard)/portefeuille/demandes/page.tsx` |
| 1 | `app/(dashboard)/portefeuille/employes/page.tsx` |
| 1 | `app/(dashboard)/portefeuille/equipe/page.tsx` |
| 1 | `app/(dashboard)/portefeuille/mes-entreprises/page.tsx` |
| 1 | `app/(dashboard)/portefeuille/paie/liste/page.tsx` |
| 1 | `app/(dashboard)/portefeuille/paie/page.tsx` |
| 1 | `app/(dashboard)/portefeuille/presences/page.tsx` |
| 1 | `app/(dashboard)/portefeuille/prets/page.tsx` |
| 1 | `app/(dashboard)/portefeuille/rapports/page.tsx` |
| 1 | `app/contact/ContactClient.tsx` |
| 1 | `app/jobs/manuel/[id]/page.tsx` |
| 1 | `components/chat/ChatPage.tsx` |

## Flou et effets de verre à supprimer (top 30)

| Nombre | Fichier |
|---|---|
| 14 | `app/jobs/ia/[id]/page.tsx` |
| 14 | `app/jobs/ia/[id]/test/[candidateId]/page.tsx` |
| 8 | `app/(dashboard)/formation/page.tsx` |
| 6 | `app/companies/create/page.tsx` |
| 3 | `app/(dashboard)/loans/page.tsx` |
| 3 | `app/docs/page.tsx` |
| 3 | `app/jobs/manuel/[id]/page.tsx` |
| 3 | `app/jobs/portal/page.tsx` |
| 3 | `app/page.tsx` |
| 3 | `components/ContractRupturePage.tsx` |
| 3 | `components/loans/CashPaymentModal.tsx` |
| 2 | `app/(dashboard)/contrats/page.tsx` |
| 2 | `app/(dashboard)/contrats/rupture/pse/page.tsx` |
| 2 | `app/(dashboard)/materiel/page.tsx` |
| 2 | `app/(dashboard)/portefeuille/absences/page.tsx` |
| 2 | `app/(dashboard)/portefeuille/conges/page.tsx` |
| 2 | `app/(dashboard)/portefeuille/prets/page.tsx` |
| 2 | `app/(dashboard)/pricing/page.tsx` |
| 2 | `app/(dashboard)/rh-blog/page.tsx` |
| 2 | `app/auth/login/page.tsx` |
| 2 | `app/entreprises/EntreprisesClient.tsx` |
| 2 | `app/entreprises/[slug]/page.tsx` |
| 2 | `app/jobs/[id]/page.tsx` |
| 2 | `app/kiosk/page.tsx` |
| 2 | `app/pme/[companyId]/parametres/page.tsx` |
| 2 | `components/blog/BlogEditor.tsx` |
| 2 | `components/landing/Hero.tsx` |
| 1 | `app/(dashboard)/conges/mon-espace/page.tsx` |
| 1 | `app/(dashboard)/finances/page.tsx` |
| 1 | `app/(dashboard)/onboarding/page.tsx` |
