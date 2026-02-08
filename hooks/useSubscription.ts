// ============================================================================
// 🪝 HOOK USESUBSCRIPTION - LIRE L'ABONNEMENT ACTUEL
// ============================================================================
// Fichier: hooks/useSubscription.ts

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
  // Récupérer l'abonnement actuel
  const { data: subscription, isLoading, error, refetch } = useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/current');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  // Récupérer les statistiques d'utilisation
  const { data: usage } = useQuery<UsageStats>({
    queryKey: ['subscription-usage'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/usage');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // Cache 2 minutes
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
    if (limit.max === -1) return true; // Illimité
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
  const daysLeft = subscription?.daysLeftInTrial || 0;

  // ✅ Vérifier si bientôt expiré (moins de 7 jours)
  const isExpiringSoon = isOnTrial && daysLeft <= 7;

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
    
    // Raccourcis
    plan: subscription?.plan || 'FREE',
    status: subscription?.status || 'ACTIVE',
    planName: subscription?.planDetails?.name || 'Gratuit',
  };
}


// ============================================================================
// 🪝 HOOK POUR LES PLANS DISPONIBLES
// ============================================================================

export function usePlans() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/plans');
      return response.data.plans;
    },
    staleTime: 60 * 60 * 1000, // Cache 1 heure (les plans changent rarement)
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
      const response = await api.get('/subscriptions/payments');
      return response.data;
    },
  });

  return {
    payments,
    isLoading,
  };
}