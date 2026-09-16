// ============================================================================
// 🪝 HOOK USESUBSCRIPTION - VERSION CORRIGÉE TYPESCRIPT
// ============================================================================
// Fichier: hooks/useSubscription.ts
// ============================================================================
// 🐛 FIX (2026-09-16) : les deux requêtes ci-dessous partaient AUTOMATIQUEMENT
// au montage du composant, même pour un visiteur anonyme (page d'accueil
// publique incluse, via SubscriptionReminderProvider monté dans le layout
// racine). Un visiteur non connecté recevait donc un 401 du backend, ce qui
// déclenchait handle401() dans services/api.ts → redirection surprise vers
// /auth/login sur une page qui n'en a pourtant pas besoin.
// Fix : on n'exécute ces requêtes que si un utilisateur est réellement
// connecté (présence de `user` en localStorage), via `enabled: authenticated`.
// ============================================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

// ============================================================================
// 🔑 HELPER : l'utilisateur est-il authentifié ?
// ============================================================================
// Les tokens JWT voyagent en cookie HttpOnly (illisibles en JS) — on se base
// donc sur la présence de l'objet `user` en localStorage, écrit à la
// connexion, comme le fait déjà CompanyReminderProvider.
function isUserAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('user');
}

// ============================================================================
// 📝 TYPES
// ============================================================================

export interface PlanLimits {
  maxEmployees: number;
  maxUsers: number;
  maxDepartments: number;
  maxJobOffers: number;
  maxStorageMB: number;

  // Features
  hasEmployeeImportExcel: boolean;
  hasAttendanceGPS: boolean;
  hasLeaveManagement: boolean;
  hasPayrollBulk: boolean;
  hasPayrollAccountingExport: boolean;
  hasRecruitmentManual: boolean;
  hasRecruitmentAI: boolean;
  hasDocumentManagement: boolean;
  hasAssetManagement: boolean;
  hasPerformanceReviews: boolean;
  hasTraining: boolean;
  hasReportsAnalytics: boolean;
  hasEmailAutomation: boolean;
  hasAPIAccess: boolean;
  hasMultiCompany: boolean;
  hasWhiteLabel: boolean;
}

export interface Plan {
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  popular: boolean;
  limits: PlanLimits;
}

export interface Subscription {
  id: string;
  companyId: string;
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'PAUSED';
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt?: string | null;
  trialEndsAt?: string | null;
  pricePerMonth: number;
  currency: string;
  planDetails: Plan;
  daysLeftInTrial?: number;
  /** Jours restants avant la fin de la période EN COURS (essai OU payant) */
  daysLeftInPeriod?: number | null;
  /** false si l'entreprise est volontairement sur le plan Gratuit (rien à renouveler) */
  willRevertToFree?: boolean;
  /** Renseigné si l'entreprise vient d'être rétrogradée faute de renouvellement (null si jamais payé) */
  downgradedAt?: string | null;
}

export interface UsageStats {
  plan: string;
  status: string;
  limits: {
    employees: { current: number; max: number; percentage: number };
    users: { current: number; max: number; percentage: number };
    departments: { current: number; max: number; percentage: number };
    jobOffers: { current: number; max: number; percentage: number };
  };
  features: Partial<PlanLimits>;
}

// ============================================================================
// 🪝 HOOK PRINCIPAL
// ============================================================================

export function useSubscription() {
  // ⬇️ Calculé une fois par rendu — évite d'appeler l'API si personne n'est connecté
  const authenticated = isUserAuthenticated();

  // Récupérer l'abonnement actuel
  const { data: subscription, isLoading, error, refetch } = useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: async () => {
      // ✅ TYPER EXPLICITEMENT
      const response = await api.get<Subscription>('/subscriptions/current');
      return response as Subscription; // ✅ Cast explicite
    },
    staleTime: 5 * 60 * 1000,
    enabled: authenticated, // ⬅️ ne tire plus la requête si pas connecté
  });

  // Récupérer les statistiques d'utilisation
  const { data: usage } = useQuery<UsageStats>({
    queryKey: ['subscription-usage'],
    queryFn: async () => {
      // ✅ TYPER EXPLICITEMENT
      const response = await api.get<UsageStats>('/subscriptions/usage');
      return response as UsageStats; // ✅ Cast explicite
    },
    staleTime: 2 * 60 * 1000,
    enabled: authenticated, // ⬅️ pareil ici
  });

  // ✅ Vérifier si une feature est disponible
  const hasFeature = (feature: keyof PlanLimits): boolean => {
    if (!subscription?.planDetails?.limits) return false;
    return !!subscription.planDetails.limits[feature];
  };

  // ✅ Vérifier si on est dans la limite
  const isWithinLimit = (limitType: 'employees' | 'users' | 'departments' | 'jobOffers'): boolean => {
    if (!usage?.limits) return true;
    const limit = usage.limits[limitType];
    if (limit.max === -1) return true;
    return limit.current < limit.max;
  };

  // ✅ Obtenir le pourcentage d'utilisation
  const getUsagePercentage = (limitType: 'employees' | 'users' | 'departments' | 'jobOffers'): number => {
    if (!usage?.limits) return 0;
    return usage.limits[limitType]?.percentage || 0;
  };

  // ✅ Vérifier si en essai gratuit
  const isOnTrial = subscription?.status === 'TRIALING';

  // ✅ Vérifier si le plan est actif
  const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING';

  // ✅ Calculer les jours restants
  // 🐛 CORRIGÉ : avant, `daysLeft` ne comptait que l'essai (daysLeftInTrial).
  // Un abonnement PAYANT (BASIC/PRO/ENTERPRISE) qui approchait de sa fin
  // n'affichait donc jamais de compte à rebours. On utilise maintenant
  // daysLeftInPeriod, qui couvre les deux cas côté backend.
  const daysLeft = subscription?.daysLeftInPeriod ?? subscription?.daysLeftInTrial ?? 0;

  // ✅ Bientôt expiré : essai OU abonnement payant à 7 jours ou moins de la
  // fin, seulement si un retour au Gratuit est effectivement en jeu (pas
  // pertinent si l'entreprise est déjà volontairement sur FREE).
  const isExpiringSoon =
    (subscription?.willRevertToFree ?? isOnTrial) && daysLeft <= 7 && daysLeft >= 0;

  // ✅ Palier de rappel actuel — utile pour choisir le ton du toast/modal
  // (voir SubscriptionReminderProvider) : 'urgent' à J-1, 'warning' à J-3,
  // 'info' à J-7, sinon rien à afficher.
  const renewalUrgency: 'urgent' | 'warning' | 'info' | null = !isExpiringSoon
    ? null
    : daysLeft <= 1
      ? 'urgent'
      : daysLeft <= 3
        ? 'warning'
        : 'info';

  return {
    subscription,
    usage,
    isLoading,
    error,
    refetch,

    // Helpers
    hasFeature,
    isWithinLimit,
    getUsagePercentage,
    isOnTrial,
    isActive,
    daysLeft,
    isExpiringSoon,
    renewalUrgency,

    // Raccourcis
    plan: subscription?.plan || 'FREE',
    status: subscription?.status || 'ACTIVE',
    planName: subscription?.planDetails?.name || 'Gratuit',
  };
}


// ============================================================================
// 🪝 HOOK POUR LES PLANS DISPONIBLES
// ============================================================================

// ✅ TYPE POUR LA RÉPONSE
interface PlansResponse {
  plans: Record<string, Plan>;
}

export function usePlans() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      // ✅ TYPER EXPLICITEMENT
      const response = await api.get<PlansResponse>('/subscriptions/plans');
      return (response as PlansResponse).plans;
    },
    staleTime: 60 * 60 * 1000,
  });

  return {
    plans,
    isLoading,
  };
}


// ============================================================================
// 🪝 HOOK POUR L'HISTORIQUE DES PAIEMENTS
// ============================================================================

export function usePaymentHistory() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payment-history'],
    queryFn: async () => {
      // ✅ TYPER EXPLICITEMENT
      const response = await api.get<any[]>('/subscriptions/payments');
      return response as any[];
    },
  });

  return {
    payments,
    isLoading,
  };
}