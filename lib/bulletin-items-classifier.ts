// ============================================================================
// lib/bulletin-items-classifier.ts
//
// Classification unique des PayrollItems — partagée par les 3 renderers.
// Source de vérité : payroll-items.service.ts
//
// GAIN
//   isTaxable || isCnss                      → gainItems  (soumis brut : SAL_BASE, primes TAXABLE_CNSS/NO_CNSS, HS_*, INDEM_CONGE)
//   !isTaxable && !isCnss                    → indemItems (indemnités hors brut : transport, salissure, panier…)
//
// DEDUCTION
//   CNSS_SAL, ITS, BNC_SOURCE,               → cotisItems (cotisations obligatoires salariales)
//   ABS_CONGE, ABS_DEDUCT, CTAX_*
//
//   LOAN, ADVANCE                            → retenueItems (avances, prêts, retenues diverses)
//
// EMPLOYER_COST
//   CNSS_EMP                                 → empItems (charges patronales)
//   TUS_DGI, TUS_CNSS                        → empItems
//   CTAX_EMP_*                               → empItems
// ============================================================================

import type { PayrollItem } from '@/types/bulletin-template';

export interface ClassifiedItems {
  /** GAIN isTaxable || isCnss → soumis au brut */
  gainItems:    PayrollItem[];
  /** GAIN !isTaxable && !isCnss → indemnités hors brut */
  indemItems:   PayrollItem[];
  /** DEDUCTION cotisations obligatoires : CNSS_SAL, ITS, BNC_SOURCE, ABS_*, CTAX_* */
  cotisItems:   PayrollItem[];
  /** DEDUCTION retenues diverses : LOAN, ADVANCE */
  retenueItems: PayrollItem[];
  /** EMPLOYER_COST : CNSS_EMP, TUS_DGI, TUS_CNSS, CTAX_EMP_* */
  empItems:     PayrollItem[];
}

/** Codes DEDUCTION qui sont des cotisations obligatoires (pas des retenues diverses) */
const COTIS_CODES = new Set([
  'CNSS_SAL',
  'ITS',
  'BNC_SOURCE',
  'ABS_CONGE',
  'ABS_DEDUCT',
  'INDEM_CONGE', // cas particulier : GAIN mais côté déduction pour absence congé
]);

/** Codes DEDUCTION qui sont des retenues diverses (prêts, avances…) */
const RETENUE_CODES = new Set(['LOAN', 'ADVANCE']);

export function classifyItems(items: PayrollItem[]): ClassifiedItems {
  const gainItems:    PayrollItem[] = [];
  const indemItems:   PayrollItem[] = [];
  const cotisItems:   PayrollItem[] = [];
  const retenueItems: PayrollItem[] = [];
  const empItems:     PayrollItem[] = [];

  for (const item of items) {
    // ── EMPLOYER_COST ─────────────────────────────────────────────────────
    if (item.type === 'EMPLOYER_COST') {
      empItems.push(item);
      continue;
    }

    // ── GAIN ──────────────────────────────────────────────────────────────
    if (item.type === 'GAIN') {
      // Indemnité hors brut = non soumise ni ITS ni CNSS
      if (!item.isTaxable && !item.isCnss) {
        indemItems.push(item);
      } else {
        gainItems.push(item);
      }
      continue;
    }

    // ── DEDUCTION ─────────────────────────────────────────────────────────
    if (item.type === 'DEDUCTION') {
      const isRetenue = RETENUE_CODES.has(item.code)
        || item.code.startsWith('LOAN')
        || item.code.startsWith('ADVANCE');

      if (isRetenue) {
        retenueItems.push(item);
      } else {
        // CNSS_SAL, ITS, BNC_SOURCE, ABS_*, CTAX_* → cotisations
        cotisItems.push(item);
      }
    }
  }

  const byOrder = (a: PayrollItem, b: PayrollItem) => a.order - b.order;

  return {
    gainItems:    gainItems.sort(byOrder),
    indemItems:   indemItems.sort(byOrder),
    cotisItems:   cotisItems.sort(byOrder),
    retenueItems: retenueItems.sort(byOrder),
    empItems:     empItems.sort(byOrder),
  };
}

/** Helpers d'accès rapide aux items patronaux */
export function getCnssEmpTotal(empItems: PayrollItem[], payroll: any): number {
  return (payroll.cnssEmployerPension ?? 0)
    + (payroll.cnssEmployerFamily   ?? 0)
    + (payroll.cnssEmployerAccident ?? 0);
}

export function getTusDgi(empItems: PayrollItem[], payroll: any): number {
  return payroll.tusDgiAmount ?? 0;
}

export function getTusCnss(empItems: PayrollItem[], payroll: any): number {
  return payroll.tusCnssAmount ?? 0;
}

export function getCtaxEmpItems(empItems: PayrollItem[]): PayrollItem[] {
  return empItems.filter(i => i.code.startsWith('CTAX_EMP_'));
}

export function getTotalCotisSal(cotisItems: PayrollItem[]): number {
  return cotisItems.reduce((s, i) => s + Number(i.amount), 0);
}

export function getTotalCotisPat(empItems: PayrollItem[], payroll: any): number {
  return getCnssEmpTotal(empItems, payroll)
    + getTusDgi(empItems, payroll)
    + getTusCnss(empItems, payroll)
    + getCtaxEmpItems(empItems).reduce((s, i) => s + Number(i.amount), 0);
}

/** Taux et retenue patronale à afficher sur la même ligne qu'un item coté salarial */
export function getEmpColsForItem(
  item: PayrollItem,
  empItems: PayrollItem[],
  payroll: any
): { tauxPat: string; retPat: string } {
  const fmt = (v: any) => Math.round(Number(v) || 0).toLocaleString('fr-FR');

  if (item.code === 'CNSS_SAL') {
    return { tauxPat: '8%', retPat: fmt(getCnssEmpTotal(empItems, payroll)) };
  }
  // TUS_DGI affiché en ligne dédiée dans la section cotisations → pas ici
  return { tauxPat: '', retPat: '' };
}