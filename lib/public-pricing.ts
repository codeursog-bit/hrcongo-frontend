import type { Plan as CatalogPlan } from '@/hooks/useSubscription';

export interface PublicPricingPlan {
  id: string;
  name: string;
  tagline: string;
  price: number | null;
  priceYearly: number | null;
  currency: string;
  priceNote: string;
  employees: string;
  users: string;
  color: string;
  accent: string;
  textAccent: string;
  popular: boolean;
  cta: string;
  ctaHref: string;
  features: { label: string; included: boolean | 'partial'; note?: string }[];
}

const featureLabels = [
  ['hasPayrollIndividual', 'Calcul de paie individuel'],
  ['hasPayrollBulk', 'Paie en masse'],
  ['hasPayrollExport', 'Export des bulletins'],
  ['hasAttendanceGPS', 'Pointage GPS'],
  ['hasLeaveManagement', 'Gestion des congés'],
  ['hasRecruitmentManual', 'Recrutement'],
  ['hasRecruitmentAI', 'Recrutement assisté par IA'],
  ['hasLoansAndAdvances', 'Prêts et avances'],
  ['hasDocumentManagement', 'Gestion documentaire'],
  ['hasAssetManagement', 'Gestion du matériel'],
  ['hasTraining', 'Formations'],
  ['hasPerformanceReviews', 'Évaluations'],
  ['hasPayrollAccountingExport', 'Export comptable'],
] as const;

export function buildPublicPlans(catalog: Record<string, CatalogPlan>): PublicPricingPlan[] {
  return ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'].flatMap(key => {
    const plan = catalog[key];
    if (!plan) return [];
    const configured = plan.priceMonthly !== null && plan.priceYearly !== null;
    const accent = key === 'PRO' ? '#10B981' : key === 'BASIC' ? '#34D399' : '#94A3B8';
    return [{
      id: key.toLowerCase(), name: plan.name, tagline: plan.description,
      price: plan.priceMonthly, priceYearly: plan.priceYearly, currency: plan.currency,
      priceNote: configured ? 'Sans engagement' : 'Tarif en cours de configuration',
      employees: plan.limits.maxEmployees === -1 ? 'Employés illimités' : `Jusqu’à ${plan.limits.maxEmployees} employés`,
      users: plan.limits.maxUsers === -1 ? 'Utilisateurs illimités' : `${plan.limits.maxUsers} utilisateur${plan.limits.maxUsers > 1 ? 's' : ''}`,
      color: `${accent}0D`, accent, textAccent: accent, popular: plan.popular,
      cta: configured ? (key === 'FREE' ? 'Démarrer gratuitement' : 'Essai 30 jours gratuit') : 'Nous contacter',
      ctaHref: configured ? `/auth/register?plan=${key}` : '/contact',
      features: featureLabels.map(([flag, label]) => ({ label, included: plan.limits[flag] === true })),
    }];
  });
}

export function publicPlanAmount(plan: PublicPricingPlan, annual: boolean): number | null {
  return annual ? plan.priceYearly : plan.price;
}
