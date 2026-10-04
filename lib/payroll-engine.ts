// ============================================================================
// 📁 lib/payroll-engine.ts
// 🇨🇬 MOTEUR DE CALCUL PAIE — CÔTÉ NAVIGATEUR (simulateur PUBLIC, sans compte)
//
// ⚠️ COPIE FIDÈLE du calculateur du backend :
//    - src/payrolls/services/payroll-calculator.service.ts  (calculate)
//    - src/payroll/fiscal/irpp-calculator.service.ts        (ITS / IRPP)
//    - src/payroll/fiscal/fiscal-parts.service.ts           (parts fiscales)
//    - src/company-taxes/custom-tax.calculator.ts           (TOL + taxes entreprise)
//
// Le résultat a EXACTEMENT la même forme que la réponse de
// POST /payrolls/simulate-free → le même composant d'affichage
// (components/payroll/PayslipBreakdown.tsx) sert le simulateur public, le
// simulateur privé et les aperçus de paie.
//
// Toute modification de règle de calcul côté backend doit être reportée ici.
// ============================================================================

// ── Constantes (identiques au backend) ──────────────────────────────────────
export const CNSS_SALARIAL_RATE = 0.04;
export const CNSS_PENSION_CEILING = 1_200_000;
export const CNSS_SOCIAL_CEILING = 600_000;
const CNSS_EMPLOYER_PENSION_RATE = 0.08;
const CNSS_EMPLOYER_FAMILY_RATE = 0.1003;
const CNSS_EMPLOYER_ACCIDENT_RATE = 0.0225;
const TUS_RATE_DGI = 0.02025; // 2,025 % → État
const TUS_RATE_CNSS = 0.05475; // 5,475 % → CNSS
const ABATTEMENT_RATE = 0.2;
const MAX_FISCAL_PARTS = 6.5;
const LEGAL_WORK_HOURS_PER_MONTH = 173.33;
const BNC_RATE_CONGOLAIS = 0.1;
const BNC_RATE_ETRANGER = 0.2;
export const SMIG = 70_400;
export const SALARIED_CONTRACTS = ['CDI', 'CDD', 'STAGE'];
export const TOL_CONTRACTS = ['CDI', 'CDD'];

export type FiscalModeInput = 'AUTO' | 'ITS_2026' | 'IRPP_LEGACY' | 'FORFAIT';
export type MaritalStatusInput = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
export type FiscalCategory = 'TAXABLE_CNSS' | 'TAXABLE_NO_CNSS' | 'NON_TAXABLE';

interface Bracket { min: number; max: number; rate: number; fixed: number }

const ITS_BRACKETS_2026: Bracket[] = [
  { min: 0, max: 615_000, rate: 0, fixed: 1_200 },
  { min: 615_000, max: 1_500_000, rate: 0.1, fixed: 0 },
  { min: 1_500_000, max: 3_500_000, rate: 0.15, fixed: 0 },
  { min: 3_500_000, max: 5_000_000, rate: 0.2, fixed: 0 },
  { min: 5_000_000, max: Infinity, rate: 0.3, fixed: 0 },
];
const IRPP_BRACKETS_LEGACY: Bracket[] = [
  { min: 0, max: 464_000, rate: 0.01, fixed: 0 },
  { min: 464_000, max: 1_000_000, rate: 0.1, fixed: 0 },
  { min: 1_000_000, max: 3_000_000, rate: 0.25, fixed: 0 },
  { min: 3_000_000, max: Infinity, rate: 0.4, fixed: 0 },
];

// ── Classification fiscale d'une prime / indemnité (identique au backend) ───
export const getBonusCategory = (b: {
  fiscalType?: string | null;
  isTaxable?: boolean | null;
  isCnss?: boolean | null;
}): FiscalCategory => {
  if (b.fiscalType === 'NON_TAXABLE') return 'NON_TAXABLE';
  if (b.fiscalType === 'TAXABLE_NO_CNSS') return 'TAXABLE_NO_CNSS';
  if (b.fiscalType === 'TAXABLE_CNSS') return 'TAXABLE_CNSS';
  if (b.isTaxable === false) return 'NON_TAXABLE';
  if (b.isCnss === false) return 'TAXABLE_NO_CNSS';
  return 'TAXABLE_CNSS';
};

// ── Parts fiscales (identique à FiscalPartsService) ─────────────────────────
export function calcFiscalParts(marital: string, children: number): number {
  const n = Math.max(0, children || 0);
  let parts: number;
  switch (marital) {
    case 'MARRIED':
      parts = 2 + n * 0.5;
      break;
    case 'WIDOWED':
      parts = n === 0 ? 1 : 2.5 + (n - 1) * 0.5;
      break;
    default: // SINGLE, DIVORCED
      parts = n === 0 ? 1 : 2 + (n - 1) * 0.5;
  }
  return Math.min(parts, MAX_FISCAL_PARTS);
}

// ── ITS / IRPP (identique à IrppCalculatorService) ──────────────────────────
export interface IrppResult {
  baseImposable: number;
  abattement: number;
  revenuNetImposable: number;
  rniAnnuel: number;
  fiscalParts: number;
  revenuParPart: number;
  irppBeforeMultiplier: number;
  irppTotal: number;
  effectiveRate: number;
  fiscalMode: string;
  details: { tranche: string; base: number; taux: number; montant: number }[];
}

// Même libellé que IrppCalculatorService.formatBracket
const formatBracket = (b: Bracket) =>
  `${b.min.toLocaleString('fr-FR')} – ${b.max === Infinity ? '∞' : b.max.toLocaleString('fr-FR')} FCFA`;

function calcIrpp(
  grossSalary: number,
  cnssSalarial: number, // valeur NON arrondie (comme l'Excel)
  marital: string,
  children: number,
  fiscalMode: 'ITS_2026' | 'IRPP_LEGACY',
): IrppResult {
  const baseImposable = grossSalary - cnssSalarial;
  const abattement = baseImposable * ABATTEMENT_RATE;
  const revenuNetImposable = baseImposable - abattement;
  const rniAnnuel = revenuNetImposable * 12;
  const fiscalParts = calcFiscalParts(marital, children);
  const revenuParPart = rniAnnuel / fiscalParts;
  const brackets = fiscalMode === 'IRPP_LEGACY' ? IRPP_BRACKETS_LEGACY : ITS_BRACKETS_2026;

  let irppBeforeMultiplier = 0;
  const details: IrppResult['details'] = [];
  for (const bracket of brackets) {
    if (revenuParPart <= bracket.min) break;
    if (bracket.fixed > 0) {
      irppBeforeMultiplier += bracket.fixed;
      details.push({
        tranche: formatBracket(bracket),
        base: Math.round(Math.min(revenuParPart, bracket.max)),
        taux: 0,
        montant: bracket.fixed,
      });
      continue;
    }
    const taxableInBracket = Math.min(revenuParPart, bracket.max) - bracket.min;
    if (taxableInBracket <= 0) continue;
    const impotTranche = taxableInBracket * bracket.rate;
    irppBeforeMultiplier += impotTranche;
    details.push({
      tranche: formatBracket(bracket),
      base: Math.round(taxableInBracket),
      taux: bracket.rate * 100,
      montant: Math.round(impotTranche),
    });
  }
  const irppAnnuel = irppBeforeMultiplier * fiscalParts;
  const irppTotal = Math.round(irppAnnuel / 12); // arrondi au plus proche
  const effectiveRate =
    baseImposable > 0 ? parseFloat(((irppTotal / baseImposable) * 100).toFixed(2)) : 0;

  return {
    baseImposable: Math.round(baseImposable),
    abattement: Math.round(abattement),
    revenuNetImposable: Math.round(revenuNetImposable),
    rniAnnuel: Math.round(rniAnnuel),
    fiscalParts,
    revenuParPart: Math.floor(revenuParPart),
    irppBeforeMultiplier: Math.round(irppBeforeMultiplier),
    irppTotal,
    effectiveRate,
    fiscalMode,
    details,
  };
}

// ── TOL + taxes de l'entreprise (identique à custom-tax.calculator.ts) ──────
export const tolAmountForZone = (zone?: string | null): number =>
  zone === 'PERIPHERIE' ? 1000 : 5000;

export interface CustomTaxInput {
  id?: string;
  name: string;
  code: string;
  baseType: 'GROSS' | 'TAXABLE' | 'NET_IMPOSABLE' | 'FIXED' | string;
  /** Taux en DÉCIMAL (0.0227 = 2,27 %) */
  employeeRate?: number | null;
  employerRate?: number | null;
  fixedEmployee?: number | null;
  fixedEmployer?: number | null;
  hasCeiling?: boolean;
  ceiling?: number | null;
  minSalaryThreshold?: number | null;
  thresholdType?: 'ELIGIBILITY' | 'EXCESS_ONLY' | string;
  applicableContractTypes?: string[];
}

export interface CustomTaxDetail {
  id: string;
  name: string;
  code: string;
  employeeAmount: number;
  employerAmount: number;
  base: number;
  baseType: string;
  employeeRate: number | null;
  employerRate: number | null;
}

export function computeCustomTaxes(
  taxes: CustomTaxInput[],
  ctx: {
    contractType: string;
    grossSalary: number;
    cnssSalarial: number;
    revenuNetImposable?: number | null;
    isSubjectToIrpp?: boolean | null;
    tolZone?: string | null;
  },
): { employeeTotal: number; employerTotal: number; details: CustomTaxDetail[] } {
  const { contractType, grossSalary, cnssSalarial } = ctx;
  let employeeTotal = 0;
  let employerTotal = 0;
  const details: CustomTaxDetail[] = [];

  for (const tax of taxes ?? []) {
    const allowedContracts: string[] = tax.applicableContractTypes?.length
      ? tax.applicableContractTypes
      : ['CDI', 'CDD'];
    if (!allowedContracts.includes(contractType)) continue;
    if (tax.code === 'TOL' && !TOL_CONTRACTS.includes(contractType)) continue;
    if (tax.minSalaryThreshold && grossSalary < Number(tax.minSalaryThreshold)) continue;

    const isExemptIts = ctx.isSubjectToIrpp === false;
    if (tax.baseType === 'NET_IMPOSABLE' && isExemptIts) continue;

    const taxableBase = grossSalary - cnssSalarial;
    const netImposable = ctx.revenuNetImposable ?? grossSalary;

    let base = 0;
    if (tax.baseType === 'GROSS') base = grossSalary;
    else if (tax.baseType === 'TAXABLE') base = taxableBase;
    else if (tax.baseType === 'NET_IMPOSABLE') base = netImposable;

    if (tax.thresholdType === 'EXCESS_ONLY' && tax.minSalaryThreshold) {
      base = Math.max(0, base - Number(tax.minSalaryThreshold));
    }
    if (tax.hasCeiling && tax.ceiling) base = Math.min(base, Number(tax.ceiling));

    let employeeAmount = 0;
    let employerAmount = 0;
    if (tax.baseType === 'FIXED') {
      employeeAmount =
        tax.code === 'TOL' ? tolAmountForZone(ctx.tolZone) : Number(tax.fixedEmployee ?? 0);
      employerAmount = Number(tax.fixedEmployer ?? 0);
    } else {
      employeeAmount =
        Math.round(base * Number(tax.employeeRate ?? 0)) + Number(tax.fixedEmployee ?? 0);
      employerAmount =
        Math.round(base * Number(tax.employerRate ?? 0)) + Number(tax.fixedEmployer ?? 0);
    }

    employeeTotal += employeeAmount;
    employerTotal += employerAmount;
    details.push({
      id: tax.id ?? tax.code,
      name: tax.name,
      code: tax.code,
      employeeAmount,
      employerAmount,
      base,
      baseType: tax.baseType,
      employeeRate: tax.baseType === 'FIXED' ? null : Number(tax.employeeRate ?? 0),
      employerRate: tax.baseType === 'FIXED' ? null : Number(tax.employerRate ?? 0),
    });
  }

  // TOL NATIVE — obligatoire pour CDI/CDD, sauf si déjà configurée
  const hasTol = (taxes ?? []).some((t) => t.code === 'TOL');
  if (!hasTol && TOL_CONTRACTS.includes(contractType)) {
    const tolAmount = tolAmountForZone(ctx.tolZone);
    employeeTotal += tolAmount;
    details.push({
      id: 'TOL_NATIVE',
      name: "Taxe d'Occupation des Locaux (TOL)",
      code: 'TOL',
      employeeAmount: tolAmount,
      employerAmount: 0,
      base: tolAmount,
      baseType: 'FIXED',
      employeeRate: null,
      employerRate: null,
    });
  }
  return { employeeTotal, employerTotal, details };
}

// ── Entrée / sortie du moteur ───────────────────────────────────────────────
export interface EngineBonusInput {
  bonusType: string;
  amount: number;
  isTaxable?: boolean;
  isCnss?: boolean;
  fiscalType?: FiscalCategory | null;
}

export interface EngineInput {
  baseSalary: number;
  workedDays?: number;
  workDays?: number; // défaut 26
  month?: number;
  year?: number;
  overtimeHours10?: number;
  overtimeHours25?: number;
  overtimeHours50?: number;
  overtimeHours100?: number;
  bonuses?: EngineBonusInput[];
  advances?: { label: string; amount: number }[];
  firstName?: string;
  lastName?: string;
  contractType?: string; // défaut CDI
  maritalStatus?: MaritalStatusInput;
  numberOfChildren?: number;
  isSubjectToCnss?: boolean;
  isSubjectToIrpp?: boolean;
  isResident?: boolean;
  tolZone?: 'VILLE' | 'PERIPHERIE' | null;
  fiscalMode?: FiscalModeInput;
  forfaitItsRate?: number;
  companyTaxes?: CustomTaxInput[];
}

export interface SimulationBonus {
  id: string;
  bonusType: string;
  amount: number;
  isTaxable: boolean;
  isCnss: boolean;
  fiscalType: FiscalCategory;
  source: string;
}

/** Même forme que la réponse de POST /payrolls/simulate-free. */
export interface EngineResult {
  employee: any;
  month?: number;
  year?: number;
  daysToPay: number;
  workDays: number;
  overtime: {
    hours10: number; amount10: number; hours25: number; amount25: number;
    hours50: number; amount50: number; hours100: number; amount100: number; total: number;
  };
  bonuses: SimulationBonus[];
  totalBonuses: number;
  adjustedBaseSalary: number;
  absenceDeduction: number;
  grossSalary: number;
  cnssSalarial: number;
  cnssEmployer: number;
  cnssEmployerPension: number;
  cnssEmployerFamily: number;
  cnssEmployerAccident: number;
  tusDgiAmount: number;
  tusCnssAmount: number;
  tusTotal: number;
  its: number;
  irppDetails: any;
  customTaxes: CustomTaxDetail[];
  employeeCustomTaxTotal: number;
  employerCustomTaxTotal: number;
  loans: any[];
  advances: { id: string; label: string; amount: number }[];
  totalLoanDeduction: number;
  totalAdvanceDeduction: number;
  totalDeductions: number;
  netSalary: number;
  totalEmployerCost: number;
  contractType: string;
  isBncWorker: boolean;
  bncAmount: number;
  bncTaux: number;
  bncLabel: string;
  settings: any;
  simulationMode: string;
}

export function computeSimulation(input: EngineInput): EngineResult {
  const baseSalary = Number(input.baseSalary) || 0;
  const workDays = input.workDays ?? 26;
  const daysToPay = input.workedDays ?? workDays;
  const contractType = input.contractType ?? 'CDI';
  const fiscalModeInput: FiscalModeInput = input.fiscalMode ?? 'AUTO';
  const forfaitItsRate = input.forfaitItsRate ?? 0.08;
  const ot10h = input.overtimeHours10 ?? 0;
  const ot25h = input.overtimeHours25 ?? 0;
  const ot50h = input.overtimeHours50 ?? 0;
  const ot100h = input.overtimeHours100 ?? 0;

  // ── Jours / absence ───────────────────────────────────────────────────────
  const paidDays = Math.max(0, daysToPay);
  const absenceDays = Math.max(0, workDays - paidDays);
  const adjustedBase =
    absenceDays > 0 ? Math.round((baseSalary * paidDays) / workDays + 1e-9) : baseSalary;
  const absenceDeduction = baseSalary - adjustedBase;

  // ── Heures supplémentaires (sur salaire contractuel) ──────────────────────
  const hourlyRate = baseSalary / LEGAL_WORK_HOURS_PER_MONTH;
  const ot10Amount = Math.floor(ot10h * hourlyRate * 1.1);
  const ot25Amount = Math.floor(ot25h * hourlyRate * 1.25);
  const ot50Amount = Math.floor(ot50h * hourlyRate * 1.5);
  const ot100Amount = Math.floor(ot100h * hourlyRate * 2);
  const totalOvertimeAmount = ot10Amount + ot25Amount + ot50Amount + ot100Amount;

  // ── Primes & indemnités ───────────────────────────────────────────────────
  const bonuses: SimulationBonus[] = (input.bonuses ?? [])
    .filter((b) => b.bonusType && Number(b.amount) > 0)
    .map((b, i) => {
      const cat = getBonusCategory(b);
      return {
        id: `sim-bonus-${i}`,
        bonusType: b.bonusType,
        amount: Number(b.amount),
        isTaxable: cat !== 'NON_TAXABLE',
        isCnss: cat === 'TAXABLE_CNSS',
        fiscalType: cat,
        source: 'MANUAL',
      };
    });
  const sum = (cat: FiscalCategory) =>
    bonuses.filter((b) => b.fiscalType === cat).reduce((a, b) => a + b.amount, 0);
  const taxableAndCnssBonuses = sum('TAXABLE_CNSS');
  const taxableNotCnssBonuses = sum('TAXABLE_NO_CNSS');
  const nonTaxableBonuses = sum('NON_TAXABLE');
  const totalBonuses = taxableAndCnssBonuses + taxableNotCnssBonuses + nonTaxableBonuses;

  // Brut imposable (ITS) et brut CNSS — les indemnités non imposables n'y sont pas
  const grossSalary =
    adjustedBase + totalOvertimeAmount + taxableAndCnssBonuses + taxableNotCnssBonuses;
  const grossSalaryCnss = adjustedBase + totalOvertimeAmount + taxableAndCnssBonuses;

  // ── Régime selon le type de contrat ───────────────────────────────────────
  const isStagiaire = contractType === 'STAGE';
  const isBncWorker = contractType === 'CONSULTANT' || contractType === 'PRESTATAIRE';
  const isInterim = contractType === 'INTERIM';
  const isSalaried = SALARIED_CONTRACTS.includes(contractType);

  // ── CNSS salariale (arrondie pour la retenue, exacte pour l'ITS) ──────────
  let cnssSalarial = 0;
  let cnssSalarialExact = 0;
  if (isSalaried && !isStagiaire && input.isSubjectToCnss !== false) {
    const base = Math.min(Math.max(0, grossSalaryCnss), CNSS_PENSION_CEILING);
    cnssSalarialExact = base * CNSS_SALARIAL_RATE;
    cnssSalarial = Math.round(cnssSalarialExact);
  }

  // ── CNSS patronale ────────────────────────────────────────────────────────
  let cnssEmployerPension = 0, cnssEmployerFamily = 0, cnssEmployerAccident = 0, cnssEmployer = 0;
  if (isSalaried) {
    const cnssBase = Math.max(0, grossSalaryCnss);
    const pensionBase = Math.min(cnssBase, CNSS_PENSION_CEILING);
    const socialBase = Math.min(cnssBase, CNSS_SOCIAL_CEILING);
    if (isStagiaire) {
      cnssEmployerAccident = Math.round(socialBase * CNSS_EMPLOYER_ACCIDENT_RATE);
      cnssEmployer = cnssEmployerAccident;
    } else {
      cnssEmployerPension = Math.round(pensionBase * CNSS_EMPLOYER_PENSION_RATE);
      cnssEmployerFamily = Math.round(socialBase * CNSS_EMPLOYER_FAMILY_RATE);
      cnssEmployerAccident = Math.round(socialBase * CNSS_EMPLOYER_ACCIDENT_RATE);
      cnssEmployer = cnssEmployerPension + cnssEmployerFamily + cnssEmployerAccident;
    }
  }

  // ── TUS (100 % patronal, sur le brut imposable) ───────────────────────────
  let tusDgiAmount = 0, tusCnssAmount = 0, tusTotal = 0;
  if (isSalaried && !isStagiaire) {
    tusDgiAmount = Math.round(grossSalary * TUS_RATE_DGI);
    tusCnssAmount = Math.round(grossSalary * TUS_RATE_CNSS);
    tusTotal = tusDgiAmount + tusCnssAmount;
  }

  // ── ITS / IRPP / Forfait ──────────────────────────────────────────────────
  let its = 0;
  let irppResult: any = null;
  const canApplyIts =
    isSalaried && !isStagiaire && !isBncWorker && !isInterim && input.isSubjectToIrpp !== false;
  if (canApplyIts) {
    const payrollYear = input.year ?? new Date().getFullYear();
    let mode: string;
    if (fiscalModeInput === 'FORFAIT') mode = 'FORFAIT';
    else if (fiscalModeInput === 'IRPP_LEGACY') mode = 'IRPP_LEGACY';
    else if (fiscalModeInput === 'ITS_2026') mode = 'ITS_2026';
    else mode = payrollYear < 2026 ? 'IRPP_LEGACY' : 'ITS_2026';

    if (mode === 'FORFAIT') {
      its = Math.ceil(grossSalary * forfaitItsRate);
      irppResult = {
        mode: 'FORFAIT', fiscalMode: 'FORFAIT', forfaitRate: forfaitItsRate,
        baseImposable: grossSalary, abattement: 0, revenuNetImposable: grossSalary,
        fiscalParts: 1, irppTotal: its,
        effectiveRate: Number((forfaitItsRate * 100).toFixed(2)),
      };
    } else {
      irppResult = calcIrpp(
        grossSalary, cnssSalarialExact,
        input.maritalStatus ?? 'SINGLE', input.numberOfChildren ?? 0,
        mode as 'ITS_2026' | 'IRPP_LEGACY',
      );
      its = irppResult.irppTotal;
    }
  }

  // ── BNC (consultant / prestataire) ────────────────────────────────────────
  let bncAmount = 0, bncTaux = 0, bncLabel = '';
  if (isBncWorker) {
    bncTaux = input.isResident !== false ? BNC_RATE_CONGOLAIS : BNC_RATE_ETRANGER;
    bncAmount = Math.round(grossSalary * bncTaux);
    bncLabel = `BNC ${bncTaux * 100}% retenu à la source`;
    its = bncAmount;
  }

  // ── TOL + taxes configurées ───────────────────────────────────────────────
  const custom = computeCustomTaxes(input.companyTaxes ?? [], {
    contractType, grossSalary, cnssSalarial,
    revenuNetImposable: irppResult?.revenuNetImposable,
    isSubjectToIrpp: input.isSubjectToIrpp,
    tolZone: input.tolZone,
  });

  // ── Avances saisies (retenues autres) ─────────────────────────────────────
  const advances = (input.advances ?? [])
    .filter((a) => Number(a.amount) > 0)
    .map((a, i) => ({ id: `sim-adv-${i}`, label: a.label, amount: Number(a.amount) }));
  const totalAdvanceDeduction = advances.reduce((s, a) => s + a.amount, 0);

  // ── Totaux (même formule que le bulletin) ─────────────────────────────────
  const totalDeductions = cnssSalarial + its + custom.employeeTotal + totalAdvanceDeduction;
  const netSalary = Math.floor(grossSalary - totalDeductions + nonTaxableBonuses);
  const totalEmployerCost = grossSalary + cnssEmployer + tusTotal + custom.employerTotal;

  return {
    employee: {
      id: 'public-sim',
      firstName: input.firstName ?? 'Anonyme',
      lastName: input.lastName ?? '',
      baseSalary,
      effectiveBaseSalary: adjustedBase,
      isSubjectToCnss: input.isSubjectToCnss !== false,
      isSubjectToIrpp: input.isSubjectToIrpp !== false,
      isSubjectToTus: true,
      taxExemptionReason: null,
    },
    month: input.month,
    year: input.year,
    daysToPay,
    workDays,
    overtime: {
      hours10: ot10h, amount10: ot10Amount, hours25: ot25h, amount25: ot25Amount,
      hours50: ot50h, amount50: ot50Amount, hours100: ot100h, amount100: ot100Amount,
      total: totalOvertimeAmount,
    },
    bonuses,
    totalBonuses,
    adjustedBaseSalary: adjustedBase,
    absenceDeduction,
    grossSalary,
    cnssSalarial,
    cnssEmployer,
    cnssEmployerPension,
    cnssEmployerFamily,
    cnssEmployerAccident,
    tusDgiAmount,
    tusCnssAmount,
    tusTotal,
    its,
    irppDetails: {
      ...(irppResult ?? {}),
      cnssEmployerDetail: {
        pension: cnssEmployerPension, famille: cnssEmployerFamily,
        accident: cnssEmployerAccident, total: cnssEmployer,
      },
      tusDetail: { dgi: tusDgiAmount, cnss: tusCnssAmount, total: tusTotal },
      bonusDetail: {
        taxableAndCnss: taxableAndCnssBonuses,
        taxableNoCnss: taxableNotCnssBonuses,
        nonTaxable: nonTaxableBonuses,
      },
      customTaxes: custom.details,
    },
    customTaxes: custom.details,
    employeeCustomTaxTotal: custom.employeeTotal,
    employerCustomTaxTotal: custom.employerTotal,
    loans: [],
    advances,
    totalLoanDeduction: 0,
    totalAdvanceDeduction,
    totalDeductions,
    netSalary,
    totalEmployerCost,
    contractType,
    isBncWorker,
    bncAmount,
    bncTaux,
    bncLabel,
    settings: {
      cnssSalarialRate: CNSS_SALARIAL_RATE * 100,
      cnssEmployerRate: 20.25,
      overtimeRate10: 10, overtimeRate25: 25, overtimeRate50: 50, overtimeRate100: 100,
      fiscalMode: fiscalModeInput,
      forfaitItsRate,
    },
    simulationMode: 'FREE_SIMULATION',
  };
}