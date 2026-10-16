// ============================================================================
// 📁 types/payroll-journal.ts
// Miroir EXACT de src/payroll-journal/payroll-journal.service.ts (backend).
// Tout changement de forme côté backend doit être reporté ici.
// ============================================================================

export interface ForeignPay {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  countryCode: string;
  countryName: string;
  payerName: string | null;
  grossAmount: number; // FCFA
  netAmount: number; // FCFA
  note: string | null;
}

export interface JournalColumnDef {
  key: string;
  label: string;
}

export interface JournalRow {
  rank: number;
  employeeId: string;
  employeeName: string;
  matricule: string | null;
  position: string;
  departmentName: string;
  contractType: string;
  payrollId: string | null;
  payrollStatus: string | null;
  status: 'PAYE' | 'ETRANGER_SEUL';

  baseSalary: number;
  primes: Record<string, number>;
  anciennete: number;
  conges: number;
  overtime: number;
  absences: number;
  grossCongo: number;

  cnss: number;
  its: number;
  itsLabel: string;
  taxes: Record<string, number>;

  indemnites: Record<string, number>;

  loan: number;
  advance: number;
  otherDeductions: number;
  netCongo: number;

  isExpat: boolean;
  foreign: ForeignPay[];
  foreignGross: number;
  foreignNet: number;

  totalGross: number;
  totalNet: number;
}

export interface JournalTotals {
  baseSalary: number;
  primes: Record<string, number>;
  anciennete: number;
  conges: number;
  overtime: number;
  absences: number;
  grossCongo: number;
  cnss: number;
  its: number;
  taxes: Record<string, number>;
  indemnites: Record<string, number>;
  loan: number;
  advance: number;
  otherDeductions: number;
  netCongo: number;
  foreignGross: number;
  foreignNet: number;
  totalGross: number;
  totalNet: number;
}

export interface PayrollJournal {
  month: number;
  year: number;
  generatedAt: string;
  company: {
    id: string;
    name: string;
    legalName: string;
    legalForm: string | null;
    logo: string | null;
    address: string;
    city: string;
    phone: string;
    email: string;
    rccm: string;
    cnssNumber: string | null;
    taxNumber: string | null;
    primaryColor: string;
  };
  options: {
    overtimeEnabled: boolean;
    showOvertime: boolean;
    showAnciennete: boolean;
    showConges: boolean;
    showAbsences: boolean;
    showLoan: boolean;
    showAdvance: boolean;
    showOtherDeductions: boolean;
    hasExpat: boolean;
  };
  columns: {
    primes: JournalColumnDef[];
    taxes: JournalColumnDef[];
    indemnites: JournalColumnDef[];
  };
  rows: JournalRow[];
  totals: JournalTotals;
  summary: {
    headcount: number;
    expatCount: number;
    grossCongo: number;
    netCongo: number;
    foreignGross: number;
    foreignNet: number;
    totalGross: number;
    totalNet: number;
    cnssSalarial: number;
    its: number;
    customTaxes: number;
    retenues: number;
    totalChargesCongo: number;
    cnssEmployer: number;
    employerCostCongo: number;
    totalCompanyCost: number;
    avgGrossCongo: number;
    avgNetCongo: number;
    netToGrossRatio: number;
    chargesRatio: number;
    foreignShare: number;
  };
  charts: {
    distribution: { label: string; value: number }[];
    grossToNet: { label: string; value: number }[];
    topEarners: { name: string; totalNet: number; totalGross: number }[];
    byDepartment: { name: string; headcount: number; totalGross: number; totalNet: number }[];
    byCountry: { countryCode: string; countryName: string; headcount: number; gross: number; net: number }[];
    chargesBreakdown: { label: string; value: number }[];
  };
}

export interface UpsertForeignPayPayload {
  employeeId: string;
  month: number;
  year: number;
  countryCode: string;
  countryName: string;
  payerName?: string;
  grossAmount: number;
  netAmount: number;
  note?: string;
}