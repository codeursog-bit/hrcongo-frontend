import { employees } from './employees';
/** Frozen fixture values stand in for backend output; no payroll calculation. */
export const payrolls = employees.map((e, i) => ({ id: `demo-payroll-${i}`, employeeId: e.id, employee: e, company: e.company, year: 2026, month: 11, baseSalary: e.baseSalary, grossSalary: e.baseSalary, netSalary: e.netSalary, totalDeductions: [40000, 80000, 45000][i], cnssSalarial: [15200, 26000, 17000][i], its: [24800, 54000, 28000][i], workDays: 26, workedDays: 26, absenceDays: 0, periodStart: '2026-11-01', periodEnd: '2026-11-30',
  cnssEmployerPension: [30400, 48000, 34000][i], cnssEmployerFamily: [38114, 60180, 42628][i], cnssEmployerAccident: [8550, 13500, 9563][i],
  cnssEmployer: [77064, 121680, 86191][i], tusDgiAmount: [7695, 13163, 8606][i], tusCnssAmount: [20805, 35588, 23269][i], tusTotal: [28500, 48751, 31875][i], totalEmployerCost: [485564, 820431, 543066][i],
  items: [
    { code: 'SAL_BASE', label: 'Salaire de base', type: 'GAIN', base: e.baseSalary, quantity: 26, amount: e.baseSalary, isTaxable: true, isCnss: true, order: 1 },
    { code: 'CNSS_SAL', label: 'Cotisation CNSS salariale', type: 'DEDUCTION', base: e.baseSalary, rate: 4, amount: [15200, 26000, 17000][i], isTaxable: false, isCnss: false, order: 2 },
    { code: 'ITS', label: 'ITS Mois', type: 'DEDUCTION', amount: [24800, 54000, 28000][i], isTaxable: false, isCnss: false, order: 3 },
    { code: 'CNSS_EMP_PENSION', label: 'CNSS patronale — Pension', type: 'EMPLOYER_COST', amount: [30400, 48000, 34000][i], isTaxable: false, isCnss: false, order: 4 },
    { code: 'CNSS_EMP_FAM', label: 'CNSS patronale — Famille', type: 'EMPLOYER_COST', amount: [38114, 60180, 42628][i], isTaxable: false, isCnss: false, order: 5 },
    { code: 'CNSS_EMP_AT', label: 'CNSS patronale — Accidents', type: 'EMPLOYER_COST', amount: [8550, 13500, 9563][i], isTaxable: false, isCnss: false, order: 6 },
    { code: 'TUS_DGI', label: 'TUS — État', type: 'EMPLOYER_COST', amount: [7695, 13163, 8606][i], isTaxable: false, isCnss: false, order: 7 },
    { code: 'TUS_CNSS', label: 'TUS — CNSS', type: 'EMPLOYER_COST', amount: [20805, 35588, 23269][i], isTaxable: false, isCnss: false, order: 8 },
  ], status: 'VALIDATED', createdAt: '2026-11-12T08:00:00+01:00' }));
export const salaryTrend = [
  { name: 'Juin', masseSalariale: 1400000, value: 1250000 }, { name: 'Juil.', masseSalariale: 1430000, value: 1270000 },
  { name: 'Août', masseSalariale: 1430000, value: 1270000 }, { name: 'Sept.', masseSalariale: 1455000, value: 1290000 },
  { name: 'Oct.', masseSalariale: 1455000, value: 1290000 }, { name: 'Nov.', masseSalariale: 1455000, value: 1290000 },
];
