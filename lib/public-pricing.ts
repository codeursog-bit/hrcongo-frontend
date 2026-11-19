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
  ['hasCNSSDeclaration', 'Déclarations CNSS'],
  ['hasDASDeclaration', 'Déclarations DAS'],
  ['hasAnnualPayroll', 'Bulletins annuels'],
  ['hasContractAlerts', 'Alertes de fin de contrat'],
  ['hasContractGeneration', 'Génération des contrats'],
  ['hasAppearanceCustomization', 'Couleurs personnalisées'],
  ['hasWhiteLabel', 'Logo dans l’application'],
] as const;

export function buildPublicPlans(catalog: Record<string, CatalogPlan>): PublicPricingPlan[] {
  return ['STARTER', 'BASIC', 'PRO', 'ENTERPRISE'].flatMap(key => {
    const plan = catalog[key];
    if (!plan) return [];
    const configured = plan.priceMonthly !== null && plan.priceYearly !== null;
    const accent = 'var(--brand)';
    return [{
      id: key.toLowerCase(), name: plan.name, tagline: plan.description,
      price: plan.priceMonthly, priceYearly: plan.priceYearly, currency: plan.currency,
      priceNote: configured ? 'Sans engagement' : 'Tarif en cours de configuration',
      employees: plan.limits.maxEmployees === -1 ? 'Plus de 100 employés' : `Jusqu’à ${plan.limits.maxEmployees} employés`,
      users: plan.limits.maxUsers === -1 ? 'Administrateurs illimités' : `${plan.limits.maxUsers} administrateur${plan.limits.maxUsers > 1 ? 's' : ''}`,
      color: 'var(--brand-soft)', accent, textAccent: 'var(--action)', popular: plan.popular,
      cta: configured ? (key === 'FREE' ? 'Démarrer gratuitement' : 'Essai 30 jours gratuit') : 'Nous contacter',
      ctaHref: configured ? `/auth/register?plan=${key}` : '/contact',
      features: [
        ...featureLabels.map(([flag, label]) => ({ label, included: plan.limits[flag] === true })),
        ...(['maxLoansAdvances','maxPermissionTickets','maxAbsenceRequests'] as const).flatMap((key,index)=>{
          const value=plan.limits[key];if(typeof value!=='number')return [];
          const label=['prêts et avances','tickets de permission','demandes d’absence'][index];
          return [{label:value===-1?`${label} illimités`:`${value} ${label} / mois`,included:value!==0}];
        }),
      ],
    }];
  });
}

export function publicPlanAmount(plan: PublicPricingPlan, annual: boolean): number | null {
  return annual ? plan.priceYearly : plan.price;
}
