import type { PlanLimits, Subscription, UsageStats } from '@/hooks/useSubscription';
const limits: PlanLimits = {
  maxEmployees: 100, maxUsers: 10, maxDepartments: 10, maxJobOffers: 5, maxStorageMB: 100,
  hasEmployeeImportExcel: true, hasAttendanceGPS: true, hasLeaveManagement: true, hasPayrollBulk: true,
  hasPayrollIndividual: true, hasPayrollExport: false, hasLoansAndAdvances: true, hasPayrollAccountingExport: false,
  hasRecruitmentManual: true, hasRecruitmentAI: false, hasDocumentManagement: true, hasAssetManagement: true,
  hasPerformanceReviews: true, hasTraining: true, hasReportsAnalytics: true, hasEmailAutomation: false,
  hasAPIAccess: false, hasMultiCompany: false, hasWhiteLabel: true,
  hasCNSSDeclaration:true,hasDASDeclaration:true,hasAnnualPayroll:true,hasContractAlerts:true,
  hasContractGeneration:true,hasAppearanceCustomization:true,hasTemplateCustomization:true,hasInternalMessaging:true,
  maxLoansAdvances:50,maxPermissionTickets:200,maxAbsenceRequests:100,maxLeaveRequests:300,
};
export const subscription: Subscription = {
  id: 'demo-subscription', companyId: 'demo-company', plan: 'PRO', status: 'ACTIVE', startDate: '2026-01-01',
  currentPeriodStart: '2026-11-01', currentPeriodEnd: '2099-12-31', trialEndsAt: null,
  pricePerMonth: 0, currency: 'XAF', daysLeftInPeriod: 365, willRevertToFree: false,
  planDetails: { name: 'Démo', description: 'Données fictives', priceMonthly: 0, priceYearly: 0, isPriceConfigured: true, currency: 'XAF', popular: false, limits },
};
export const usage: UsageStats = { plan: 'PRO', status: 'ACTIVE', limits: {
  employees: { current: 3, max: 100, percentage: 3 }, users: { current: 1, max: 10, percentage: 10 },
  departments: { current: 3, max: 10, percentage: 30 }, jobOffers: { current: 0, max: 5, percentage: 0 },
}, features: limits };
