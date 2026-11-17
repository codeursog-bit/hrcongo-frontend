# AUDIT DE LA REFONTE (généré)

Généré le 2026-11-17 par `scripts/audit-refonte.mjs` (lecture seule). Exclus : phase 2 (admin, cabinet), documents imprimables et exports, démos, types. 584 fichiers analysés.

## Totaux

| Mesure | Total | Objectif |
|---|---|---|
| palette | 16747 | tendre vers 0 (tokens) |
| hex | 1775 | seulement des constantes de marque ou de graphiques |
| emojis | 448 | 0 comme icône (réactions et contenus utilisateur autorisés) |
| dégradés | 251 | 0 |
| pulse / ping | 69 | 0 |
| flou / verre | 202 | 0 |
| ombres colorées | 27 | 0 |
| texte dégradé | 10 | 0 |

## Par zone

| Zone | Fichiers | palette | hex | emojis | dégradés | pulse / ping | flou / verre | ombres colorées | texte dégradé |
|---|---|---|---|---|---|---|---|---|---|
| dashboard | 173 | 9306 | 426 | 189 | 56 | 28 | 95 | 4 | 4 |
| portefeuille | 18 | 544 | 19 | 0 | 1 | 14 | 11 | 0 | 0 |
| pages publiques | 51 | 2438 | 630 | 127 | 121 | 14 | 59 | 17 | 2 |
| composants, hooks, lib | 280 | 4059 | 692 | 119 | 69 | 13 | 34 | 6 | 4 |
| espace PME | 62 | 400 | 8 | 13 | 4 | 0 | 3 | 0 | 0 |

## Classes de palette Tailwind à convertir en tokens (top 30)

| Nombre | Fichier |
|---|---|
| 405 | `app/(dashboard)/paie/manuel/page.tsx` |
| 369 | `app/simulateur/SimulateurClient.tsx` |
| 355 | `app/(dashboard)/paie/simulateur/page.tsx` |
| 343 | `app/(dashboard)/formation/page.tsx` |
| 310 | `app/(dashboard)/parametres/entreprise/page.tsx` |
| 303 | `app/(dashboard)/cnss-declaration/page.tsx` |
| 261 | `components/absence-analytics/AbsenceAnalyticsBoard.tsx` |
| 259 | `app/(dashboard)/paie/[id]/modifier/page.tsx` |
| 253 | `lib/absence-tracking-colors.ts` |
| 252 | `app/(dashboard)/parametres/paie/page.tsx` |
| 246 | `components/ContractRupturePage.tsx` |
| 214 | `app/(dashboard)/parametres/securite/page.tsx` |
| 203 | `app/(dashboard)/paie/impayes/page.tsx` |
| 198 | `app/(dashboard)/parametres/subscription/page.tsx` |
| 198 | `app/affiliate/dashboard/page.tsx` |
| 196 | `app/pme/[companyId]/rapports/comptabilite/page.tsx` |
| 191 | `app/(dashboard)/loans/page.tsx` |
| 188 | `app/(dashboard)/contrats/page.tsx` |
| 188 | `app/(dashboard)/performance/competences/page.tsx` |
| 187 | `app/(dashboard)/parametres/primes/page.tsx` |
| 184 | `app/(dashboard)/documents/page.tsx` |
| 178 | `app/(dashboard)/performance/page.tsx` |
| 161 | `app/(dashboard)/performance/fiche/[id]/page.tsx` |
| 159 | `app/(dashboard)/contrats/rupture/pse/page.tsx` |
| 154 | `components/performance/CreateReviewModal.tsx` |
| 149 | `app/(dashboard)/performance/objectifs/page.tsx` |
| 147 | `app/(dashboard)/presences/CorrectionsView.tsx` |
| 145 | `components/performance/ReviewDetailModal.tsx` |
| 142 | `app/(dashboard)/success/page.tsx` |
| 141 | `app/jobs/portal/page.tsx` |

## Emojis à remplacer par des icônes en trait fin (top 30)

| Nombre | Fichier |
|---|---|
| 24 | `app/docs/page.tsx` |
| 18 | `components/performance/CreateReviewModal.tsx` |
| 16 | `app/outils/calcul-cnss-congo/CnssCalculatorClient.tsx` |
| 16 | `components/CanvasEditor/index.tsx` |
| 14 | `app/(dashboard)/presences/shifts/page.tsx` |
| 13 | `app/(dashboard)/paie/comptabilite/page.tsx` |
| 13 | `app/pme/[companyId]/rapports/comptabilite/page.tsx` |
| 13 | `components/blog/BlogEditor.tsx` |
| 11 | `app/(dashboard)/presences/CorrectionsView.tsx` |
| 11 | `components/onboarding/CabinetOnboardingChecklist.tsx` |
| 10 | `app/outils/calcul-camu-congo/CamuCalculatorClient.tsx` |
| 10 | `components/onboarding/OnboardingChecklist.tsx` |
| 9 | `app/(dashboard)/paie/impayes/page.tsx` |
| 9 | `app/(dashboard)/parametres/entreprise/page.tsx` |
| 9 | `app/(dashboard)/presences/pointage/page.tsx` |
| 9 | `app/companies/create/page.tsx` |
| 8 | `app/(dashboard)/formation/page.tsx` |
| 8 | `app/outils/calcul-heures-supplementaires-congo/HeuresSupClient.tsx` |
| 8 | `app/page.tsx` |
| 7 | `app/(dashboard)/paie/manuel/page.tsx` |
| 7 | `app/(dashboard)/paie/masse/page.tsx` |
| 7 | `app/(dashboard)/paie/page.tsx` |
| 7 | `app/(dashboard)/rapports/comptabilite/page.tsx` |
| 6 | `app/(dashboard)/presences/page.tsx` |
| 6 | `app/auth/login/page.tsx` |
| 6 | `app/outils/calcul-its-congo/ItsCalculatorClient.tsx` |
| 6 | `app/outils/calcul-tus-congo/TusCalculatorClient.tsx` |
| 5 | `app/not-found.tsx` |
| 5 | `app/outils/page.tsx` |
| 4 | `app/(dashboard)/employes/[id]/edit/page.tsx` |

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
| 50 | `components/payroll-journal/JournalTable.tsx` |
| 40 | `app/(dashboard)/paie/[id]/components/PayslipBreakdown.tsx` |
| 37 | `app/(dashboard)/paie/[id]/page.tsx` |
| 35 | `app/(dashboard)/rapports/effectifs/page.tsx` |
| 35 | `app/(dashboard)/rapports/indicateurs/page.tsx` |
| 34 | `app/blog/[slug]/BlogPostClient.tsx` |
| 34 | `components/ConventionGuard.tsx` |
| 32 | `app/(dashboard)/parametres/bulletin/page.tsx` |
| 28 | `app/(dashboard)/paie/[id]/components/PayslipEmployeeInfo.tsx` |
| 28 | `lib/absence-tracking-colors.ts` |
| 27 | `components/workforce/WorkforceDashboard.tsx` |
| 24 | `app/verify/[ref]/page.tsx` |
| 23 | `components/blog/BlogEditor.tsx` |
| 23 | `components/landing/Hero.tsx` |
| 23 | `components/leave-history/LeaveCharts.tsx` |
| 22 | `app/(dashboard)/paie/[id]/components/PayslipFooter.tsx` |
| 22 | `app/(dashboard)/rapports/analyse-paie/page.tsx` |
| 22 | `components/loans/LoansDashboard.tsx` |
| 22 | `components/onboarding/OnboardingChecklist.tsx` |
| 19 | `components/attendance/AttendanceDashboard.tsx` |
| 19 | `components/payroll-journal/JournalDashboard.tsx` |
| 19 | `lib/certificate-templates.ts` |
| 18 | `app/(dashboard)/formation/page.tsx` |

## Dégradés à supprimer (top 30)

| Nombre | Fichier |
|---|---|
| 18 | `app/jobs/ia/[id]/test/[candidateId]/page.tsx` |
| 16 | `app/jobs/ia/[id]/page.tsx` |
| 13 | `app/(dashboard)/success/page.tsx` |
| 10 | `components/subscriptions/TrialBadge.tsx` |
| 9 | `components/providers/SubscriptionReminderProvider.tsx` |
| 7 | `app/blog/BlogClient.tsx` |
| 6 | `app/(dashboard)/presences/shifts/page.tsx` |
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
| 5 | `components/providers/SubscriptionBlockedModal.tsx` |
| 4 | `app/kiosk/page.tsx` |
| 4 | `app/tarifs/TarifsClient.tsx` |
| 4 | `components/loans/CashPaymentModal.tsx` |
| 4 | `components/onboarding/CabinetOnboardingChecklist.tsx` |
| 4 | `components/providers/SubscriptionEndedBanner.tsx` |
| 4 | `components/subscriptions/FeatureGate.tsx` |
| 3 | `app/(dashboard)/loans/page.tsx` |
| 3 | `app/companies/create/page.tsx` |
| 3 | `components/landing/Hero.tsx` |
| 3 | `components/loans/LoansForm.tsx` |

## Animations pulse / ping à supprimer (top 30)

| Nombre | Fichier |
|---|---|
| 8 | `app/(dashboard)/presences/pointage/page.tsx` |
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
| 1 | `app/(dashboard)/conges/page.tsx` |
| 1 | `app/(dashboard)/contrats/page.tsx` |
| 1 | `app/(dashboard)/contrats/rupture/pse/page.tsx` |
| 1 | `app/(dashboard)/demandes/page.tsx` |
| 1 | `app/(dashboard)/documents/page.tsx` |
| 1 | `app/(dashboard)/materiel/page.tsx` |
| 1 | `app/(dashboard)/parametres/users/page.tsx` |
| 1 | `app/(dashboard)/performance/page.tsx` |
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

## Flou et effets de verre à supprimer (top 30)

| Nombre | Fichier |
|---|---|
| 14 | `app/jobs/ia/[id]/page.tsx` |
| 14 | `app/jobs/ia/[id]/test/[candidateId]/page.tsx` |
| 10 | `app/(dashboard)/presences/pointage-manuel/page.tsx` |
| 8 | `app/(dashboard)/formation/page.tsx` |
| 7 | `app/(dashboard)/rapports/complet/page.tsx` |
| 6 | `app/companies/create/page.tsx` |
| 5 | `app/(dashboard)/presences/EmployeeView.tsx` |
| 5 | `app/(dashboard)/presences/pointage/page.tsx` |
| 4 | `app/(dashboard)/rapports/analyse-paie/page.tsx` |
| 3 | `app/(dashboard)/loans/page.tsx` |
| 3 | `app/(dashboard)/parametres/departements/page.tsx` |
| 3 | `app/(dashboard)/rapports/analyse-conges/page.tsx` |
| 3 | `app/docs/page.tsx` |
| 3 | `app/jobs/manuel/[id]/page.tsx` |
| 3 | `app/jobs/portal/page.tsx` |
| 3 | `app/page.tsx` |
| 3 | `components/ContractRupturePage.tsx` |
| 3 | `components/loans/CashPaymentModal.tsx` |
| 2 | `app/(dashboard)/contrats/page.tsx` |
| 2 | `app/(dashboard)/contrats/rupture/pse/page.tsx` |
| 2 | `app/(dashboard)/materiel/page.tsx` |
| 2 | `app/(dashboard)/parametres/page.tsx` |
| 2 | `app/(dashboard)/parametres/taxes/page.tsx` |
| 2 | `app/(dashboard)/parametres/users/page.tsx` |
| 2 | `app/(dashboard)/performance/fiche/[id]/page.tsx` |
| 2 | `app/(dashboard)/portefeuille/absences/page.tsx` |
| 2 | `app/(dashboard)/portefeuille/conges/page.tsx` |
| 2 | `app/(dashboard)/portefeuille/prets/page.tsx` |
| 2 | `app/(dashboard)/pricing/page.tsx` |
| 2 | `app/(dashboard)/rapports/effectifs/page.tsx` |
