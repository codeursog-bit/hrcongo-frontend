import references from '@/docs/modeles-documents/reference-documents.json';
import type { DocumentContext } from '@/types/document-layout';
import { cumulativeColumns } from './payslip';

const { PAYSLIP: example } = references;
const numberSpacing = (value?: string) => value?.replace(/ (?=[\d%])/g, '\u00a0');
const exampleKeys: Record<string, string> = {
  'Salaire de base': 'SAL_BASE', 'Total Brut': 'pay.grossSalary', 'Cotisation CNSS': 'CNSS_SAL',
  'CNSS Pension': 'CNSS_EMP_PENSION', 'CNSS Famille': 'CNSS_EMP_FAM', 'CNSS Accidents': 'CNSS_EMP_AT',
  ITS: 'ITS', 'TUS FISC': 'TUS_DGI', 'TUS CNSS': 'TUS_CNSS', 'Total Cotisations': 'pay.contributions',
  'TOTAL GAINS': 'pay.totalGains', 'TOTAL RETENUES': 'items.deductions',
};

export const payslipExample: DocumentContext = {
  company: { name: example.exemple.entreprise },
  values: {
    'company.name': example.exemple.entreprise,
    'company.collectiveAgreement': 'COMMERCE',
    'company.city': 'Pointe-Noire',
    'employee.employeeNumber': 'EMP-2026-016',
    'employee.fullName': 'Camille Exemple',
    'employee.hireDate': '19/03/2022',
    'employee.seniority': '4 ans 8 mois',
    'employee.position': 'Poste 15',
    'employee.department': 'Département 15',
    'employee.category': '—',
    'employee.cnssNumber': 'EXEMPLE-0000',
    'employee.bankName': 'Banque 15',
    'employee.maritalStatus': 'Veuf/Veuve',
    'employee.numberOfChildren': '2',
    'employee.itsParts': '3',
    'pay.period': example.exemple.periode.replace(' – ', ' au '),
    'pay.payment': 'Le 5 du mois suivant par Virement',
    'pay.month': 'NOVEMBRE',
    'pay.year': 2026,
    'pay.netSalary': numberSpacing(example.cumuls.mensuel.at(-1)),
    ...Object.fromEntries(cumulativeColumns.slice(1, -1).flatMap(({ key }, index) => [
      [`monthly.${key}`, numberSpacing(example.cumuls.mensuel[index])],
      [`annual.${key}`, numberSpacing(example.cumuls.annuel[index])],
    ])),
  },
  items: example.lignesExemple.map((row, index) => ({
    key: exampleKeys[row.label] ?? `exemple-${index}`,
    id: `exemple-${index}`,
    total: row.type === 'total',
    required: row.type === 'total',
    cells: {
      number: row.n, label: row.label, quantity: row.nombre, base: numberSpacing(row.base),
      rate: numberSpacing(row.taux), gain: numberSpacing(row.gain), deduction: numberSpacing(row.retenue),
      employerRate: numberSpacing(row.tauxPat), employerCost: numberSpacing(row.retenuePat),
    },
  })),
};
