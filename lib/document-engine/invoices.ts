import type { Block, DocLayout, DocumentContext } from '@/types/document-layout';
import type { BulletinPayroll } from '@/types/bulletin-template';
import { createAdministrativeLayout } from './administrative';
import { buildPayslipContext } from './payslip';
import { invoiceGalleryExample } from './gallery-example';
export const invoiceDesigns = [
  { id: 'INVOICE_FORFAIT', name: 'Facture forfait', historic: 'forfait', skin: 'A_CLASSIQUE' },
  { id: 'INVOICE_DETAILED', name: 'Facture détaillée', historic: 'detaillee', skin: 'B_MODERNE' },
  { id: 'INVOICE_PRO', name: 'Facture professionnelle', historic: 'professionnelle', skin: 'C_INSTITUTIONNEL' },
] as const;
export function makeInvoiceDesign(preset = 'INVOICE_FORFAIT', original = false): DocLayout {
  const design = invoiceDesigns.find(item => item.id === preset) ?? invoiceDesigns[0];
  const layout = createAdministrativeLayout('LOAN', design.skin);
  const block = (id: string, type: Block['type'], config: Block['config'], row: number): Block => ({ id, type, config, row, col: 1, span: 12, visible: true, locked: true });
  return { ...layout, docType: 'CONTRACTOR_INVOICE', basePreset: preset, useOriginal: original && preset !== 'BLANK' ? true : undefined,
    blocks: [
      block('header', 'header', { title: 'FACTURE PRESTATAIRE' }, 1),
      block('identity', 'fieldGroup', { type: 'fieldGroup', titre: preset === 'BLANK' ? undefined : 'Prestataire et période', colonnes: 2, champs: [
        ['employee.fullName', 'Prestataire'], ['employee.employeeNumber', 'Matricule'], ['employee.position', 'Fonction'], ['pay.month', 'Mois'], ['pay.year', 'Année'],
      ] }, 2),
      block('services', 'table', { type: 'invoiceTable', titre: preset === 'BLANK' ? undefined : 'Détail des prestations', colonnes: ['Désignation', 'Montant', 'Retenue'] }, 3),
      block('totals', 'fieldGroup', { type: 'fieldGroup', colonnes: 2, champs: [['pay.grossSalary', 'Montant brut'], ['pay.netSalary', 'Net à payer']] }, 4),
      ...(preset === 'BLANK' ? [] : [block('signatures', 'signatures', { type: 'signatures', items: ['Le prestataire', 'Pour l’entreprise'], hauteurRelative: 'grande' }, 5)]),
    ], labels: {}, footer: { text: '', showPageNumber: false },
  };
}
export function invoiceContext(payroll: BulletinPayroll): DocumentContext {
  const context = buildPayslipContext(payroll);
  return { ...context, items: context.items.filter(row => !row.total && (row.cells.gain != null || row.cells.deduction != null)), administrative: {} };
}
export const invoiceExample = () => invoiceContext(invoiceGalleryExample);
