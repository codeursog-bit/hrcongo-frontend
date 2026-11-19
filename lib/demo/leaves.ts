import { employees } from './employees';
export const leaves = [
  { id: 'demo-leave-1', employeeId: employees[2].id, employee: employees[2], type: 'ANNUAL', status: 'PENDING', startDate: '2026-11-16', endDate: '2026-11-20', daysCount: 5, reason: 'Congé annuel', createdAt: '2026-11-12T08:00:00+01:00' },
  ...employees.map(employee=>({id:`demo-leave-${employee.id}`,employeeId:employee.id,employee,type:'ANNUAL',status:'APPROVED',startDate:'2026-10-19',endDate:'2026-10-27',daysCount:8,reason:'Repos annuel',createdAt:'2026-10-01T08:00:00+01:00'})),
];
export const leaveBalance = { annualRemaining: 18, annualAcquired: 26, annualTaken: 8, base: { acquired: 26, max: 26 }, seniority: { days: 0 }, totals: { remaining: 18, acquired: 26, taken: 8 }, periods: [], details: [] };
