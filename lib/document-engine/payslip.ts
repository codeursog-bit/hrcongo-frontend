import type { BulletinPayroll } from '@/types/bulletin-template';
import { REQUIRED_VARIABLES } from '@/types/canvas-block';
import type { DocumentContext, DocumentRow, DocumentValue } from '@/types/document-layout';
import references from '@/docs/modeles-documents/reference-documents.json';
import skins from '@/docs/modeles-documents/skins.json';

const reference = references.PAYSLIP;
const dimensions = skins.bulletinDePaie;
const numberFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 });
const rateFormat = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 4 });
const dateFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC' });
const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'UTC' });

type Decimal = string | number | null | undefined;
type CumulativeKey = 'grossSalary' | 'totalChargesSalariales' | 'totalChargesPatronales'
  | 'its' | 'netImposable' | 'baseConge' | 'congesAcquisMois';

export type PayslipData = BulletinPayroll & Partial<Record<CumulativeKey, Decimal>> & {
  employee: BulletinPayroll['employee'] & { bankName?: string; bankCode?: string; seniority?: string };
  ytd?: Partial<Record<CumulativeKey, Decimal>>;
};

export const payColumns = [
  ['number', 'N°', dimensions.colonnesTableauPaie_unites['N°'], 'center'],
  ['label', 'Désignation', dimensions.colonnesTableauPaie_unites.Désignation, 'left'],
  ['quantity', 'Nombre', dimensions.colonnesTableauPaie_unites.Nombre, 'right'],
  ['base', 'Base', dimensions.colonnesTableauPaie_unites.Base, 'right'],
  ['rate', 'Taux', dimensions.colonnesTableauPaie_unites['Taux (sal.)'], 'right'],
  ['gain', 'Gain', dimensions.colonnesTableauPaie_unites.Gain, 'right'],
  ['deduction', 'Retenue', dimensions.colonnesTableauPaie_unites['Retenue (sal.)'], 'right'],
  ['employerRate', 'Taux', dimensions.colonnesTableauPaie_unites['Taux (pat.)'], 'right'],
  ['employerCost', 'Retenue', dimensions.colonnesTableauPaie_unites['Retenue (pat.)'], 'right'],
] as const;

const { total: cumulativeWidth, ...cumulativeWidths } = dimensions.colonnesCumuls_unites;
const cumulativeKeys = ['period', 'grossSalary', 'totalChargesSalariales', 'totalChargesPatronales',
  'its', 'netImposable', 'baseConge', 'congesAcquisMois', 'netSalary'] as const;
export const cumulativeColumns = Object.values(cumulativeWidths).map((width, index) => ({
  key: cumulativeKeys[index], label: reference.cumuls.colonnes[index], widthPct: width / cumulativeWidth * 100,
}));

const labels = {
  'company.name': 'Entreprise', 'pay.netSalary': 'Net à payer', 'pay.grossSalary': 'Salaire brut',
  'items.deductions': 'Retenues', 'pay.period': 'Période du', 'pay.payment': 'Paie',
  'pay.month': 'Mois de', 'pay.year': 'Année',
};
const fields = [...reference.infosSalarie.gauche, ...reference.infosSalarie.milieu,
  ...reference.infosSalarie.droite, ...Object.entries(labels)];

export const payslipSpec = {
  title: reference.titre,
  fields: fields.map(([key, labelDefaut]) => ({
    key, labelDefaut, kind: 'text' as const, requis: REQUIRED_VARIABLES.some(variable => variable === key),
  })),
};

const paymentMethods: Record<string, string> = {
  BANK_TRANSFER: 'Virement', CASH: 'Espèces', CHECK: 'Chèque', MOBILE_MONEY: 'Mobile Money',
};
const maritalStatuses: Record<string, string> = {
  SINGLE: 'Célibataire', MARRIED: 'Marié(e)', DIVORCED: 'Divorcé(e)', WIDOWED: 'Veuf/Veuve',
};

function formatNumeric(value: Decimal, format = numberFormat): string | undefined {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return undefined;
  return format.format(Number(value)).replace(/\u202f/g, '\u00a0');
}

function formatDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) ? dateFormat.format(date) : undefined;
}

function seniority(hireDate: string | undefined, end: Date): string | undefined {
  if (!hireDate) return undefined;
  const start = new Date(hireDate);
  if (!Number.isFinite(start.valueOf()) || start > end) return undefined;
  const months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12
    + end.getUTCMonth() - start.getUTCMonth() - Number(end.getUTCDate() < start.getUTCDate());
  const years = Math.floor(months / 12);
  return [years ? `${years} an${years > 1 ? 's' : ''}` : '', months % 12 ? `${months % 12} mois` : '']
    .filter(Boolean).join(' ') || '0 mois';
}

const total = (key: string, label: string, cells: Record<string, DocumentValue>): DocumentRow =>
  ({ id: key, key, total: true, required: true, cells: { label, ...cells } });

export function buildPayslipContext(payroll: PayslipData): DocumentContext {
  const { employee, company, month, year, ytd } = payroll;
  const name = company?.legalName || company?.tradeName || '';
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));
  const paymentMethod = employee?.paymentMethod;
  const maritalStatus = employee?.maritalStatus;
  const values: DocumentContext['values'] = {
    'company.name': name,
    'company.collectiveAgreement': company?.collectiveAgreement,
    'company.city': company?.city,
    'employee.hireDate': formatDate(employee?.hireDate),
    'employee.seniority': employee?.seniority ?? seniority(employee?.hireDate, lastDay),
    'employee.position': employee?.position,
    'employee.department': employee?.department?.name,
    'employee.category': [employee?.professionalCategory, employee?.echelon].filter(Boolean).join(' - '),
    'employee.bankCode': employee?.bankCode,
    'employee.bankName': employee?.bankName,
    'employee.employeeNumber': employee?.employeeNumber,
    'employee.fullName': [employee?.firstName, employee?.lastName].filter(Boolean).join(' '),
    'employee.cnssNumber': employee?.cnssNumber,
    'employee.maritalStatus': maritalStatus && (maritalStatuses[maritalStatus] ?? maritalStatus),
    'employee.numberOfChildren': formatNumeric(employee?.numberOfChildren),
    'employee.itsParts': formatNumeric(payroll.irppFiscalParts),
    'pay.period': [formatDate(payroll.periodStart) ?? dateFormat.format(firstDay),
      formatDate(payroll.periodEnd) ?? dateFormat.format(lastDay)].join(' au '),
    'pay.payment': [formatDate(payroll.paymentDate), paymentMethod && (paymentMethods[paymentMethod] ?? paymentMethod)]
      .filter(Boolean).join(' par '),
    'pay.month': monthFormat.format(firstDay).toLocaleUpperCase('fr-FR'),
    'pay.year': year,
    'pay.grossSalary': formatNumeric(payroll.grossSalary),
    'pay.netSalary': formatNumeric(payroll.netSalary),
  };
  // Les compteurs INFO sont figés lors de la génération du bulletin.
  // Ne pas reprendre un solde courant ni déduire un solde absent.
  for (const [key, code] of [['entitled', 'LEAVE_DROITS'], ['taken', 'LEAVE_PRIS'], ['remaining', 'LEAVE_SOLDE']]) {
    const snapshot = payroll.items?.find(item => item.code === code);
    values['leave.' + key] = formatNumeric(snapshot?.amount) ?? '—';
  }
  for (const { key } of cumulativeColumns) {
    if (key === 'period' || key === 'netSalary') continue;
    values[`monthly.${key}`] = formatNumeric(payroll[key]);
    values[`annual.${key}`] = formatNumeric(ytd?.[key]);
  }

  const gains: DocumentRow[] = [];
  const charges: DocumentRow[] = [];
  for (const item of [...(payroll.items ?? [])].sort((a, b) => a.order - b.order)) {
    if (['LEAVE_DROITS', 'LEAVE_PRIS', 'LEAVE_SOLDE'].includes(item.code)) continue;
    const isGain = item.type === 'GAIN';
    const isDeduction = item.type === 'DEDUCTION';
    const isEmployer = item.type === 'EMPLOYER_COST';
    const rate = formatNumeric(item.rate, rateFormat);
    const amount = formatNumeric(item.amount);
    const row = { id: item.id || `${item.code}:${item.order}`, key: item.code, cells: {
      number: item.code === 'SAL_BASE' ? '100' : /^\d+$/.test(item.code) ? item.code : undefined,
      label: item.label,
      quantity: formatNumeric(item.quantity) ?? (!isGain && !isDeduction && !isEmployer ? amount : undefined),
      base: formatNumeric(item.base),
      rate: isEmployer ? undefined : rate,
      gain: isGain ? amount : undefined,
      deduction: isDeduction ? amount : undefined,
      employerRate: isEmployer ? rate : undefined,
      employerCost: isEmployer ? amount : undefined,
    } };
    (isGain ? gains : charges).push(row);
  }
  return {
    values,
    company: { name, logo: company?.logo || undefined },
    items: [
      ...gains,
      total('pay.grossSalary', 'Total Brut', { gain: values['pay.grossSalary'] }),
      ...charges,
      ...(payroll.totalChargesSalariales == null ? [] : [
        total('pay.contributions', 'Total Cotisations', { deduction: formatNumeric(payroll.totalChargesSalariales) }),
      ]),
      total('pay.totalGains', 'TOTAL GAINS', { number: '9900', gain: values['pay.grossSalary'] }),
      total('items.deductions', 'TOTAL RETENUES', { number: '9950', deduction: formatNumeric(payroll.totalDeductions) }),
    ],
  };
}
