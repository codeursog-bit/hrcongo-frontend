import React from 'react';

type Item = { id?: string; code?: string; label: string; type: string; amount: number | string; isTaxable?: boolean };
type Amounts = { items?: Item[]; grossSalary?: number; cnssEmployerPension?: number; cnssEmployerFamily?: number; cnssEmployerAccident?: number; tusDgiAmount?: number; tusCnssAmount?: number; employerCustomTaxTotal?: number };
const format = (value: number | string) => Number(value).toLocaleString('fr-FR');

/** Display server lines verbatim. Totals remain the server's totals; no tax calculation. */
export function PayrollAmounts({ payroll, side }: { payroll: Amounts; side: 'employee' | 'employer' }) {
  const rows = (payroll.items || []).filter(item => item.type === (side === 'employee' ? 'DEDUCTION' : 'EMPLOYER_COST'));
  const indemnities = side === 'employer' ? (payroll.items || []).filter(item => item.type === 'GAIN' && item.isTaxable === false) : [];
  const fallback = side === 'employer' && !rows.length ? [
    ['CNSS Pensions', payroll.cnssEmployerPension], ['CNSS Famille', payroll.cnssEmployerFamily], ['CNSS Accident', payroll.cnssEmployerAccident],
    ['TUS FISC', payroll.tusDgiAmount], ['TUS CNSS', payroll.tusCnssAmount], ['Autres taxes employeur', payroll.employerCustomTaxTotal],
  ] as const : [];
  return <dl className="payroll-amount-lines">
    {side === 'employer' && payroll.grossSalary !== undefined && <div><dt>Salaire brut</dt><dd>{format(payroll.grossSalary)} F</dd></div>}
    {rows.map((item,index) => <div key={item.id || `${item.code}-${index}`}><dt>{item.label}</dt><dd>{format(item.amount)} F</dd></div>)}
    {fallback.filter(([,amount]) => amount !== undefined && amount !== null).map(([label,amount]) => <div key={label}><dt>{label}</dt><dd>{format(amount!)} F</dd></div>)}
    {indemnities.map((item,index) => <div key={`indemnity-${index}`}><dt>{item.label}</dt><dd>{format(item.amount)} F</dd></div>)}
    {side === 'employee' && !rows.length && <div><dt>Détail des retenues non fourni pour ce bulletin.</dt></div>}
  </dl>;
}
