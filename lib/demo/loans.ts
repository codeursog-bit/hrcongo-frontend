import { employees } from './employees';
export const loans = [
  { id: 'demo-loan-1', employeeId: employees[0].id, employee: employees[0], type: 'ARGENT', amount: 300000, remainingBalance: 200000, monthlyRepayment: 50000, monthlyPayment: 50000, durationMonths: 6, status: 'ACTIVE', nature: 'SOCIAL', reason: 'Projet familial', startMonth: 10, startYear: 2026, startDate: '2026-10-01', recoverViaPayroll: true, printAuthorized: false, createdAt: '2026-09-20T08:00:00+01:00' },
  { id: 'demo-loan-pending', employeeId: employees[0].id, employee: employees[0], type: 'ARGENT', amount: 30000, remainingBalance: 30000, monthlyRepayment: 10000, monthlyPayment: 10000, durationMonths: 3, status: 'PENDING', nature: 'SOCIAL', reason: 'Réparation du logement', startMonth: 12, startYear: 2026, startDate: '2026-12-01', recoverViaPayroll: true, printAuthorized: false, createdAt: '2026-11-12T08:00:00+01:00' },
];
export const loanHistory = [
  { id: 'demo-repayment-oct', loanId: 'demo-loan-1', amount: 50000, month: 10, year: 2026 },
  { id: 'demo-repayment-nov', loanId: 'demo-loan-1', amount: 50000, month: 11, year: 2026 },
];
export const advances = [{ id: 'demo-advance-1', employeeId: employees[1].id, employee: employees[1], amount: 75000, status: 'PENDING', month: 11, year: 2026, reason: 'Dépense imprévue', createdAt: '2026-11-12T09:00:00+01:00' }];
