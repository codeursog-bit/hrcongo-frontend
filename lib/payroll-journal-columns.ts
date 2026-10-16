// ============================================================================
// 📁 lib/payroll-journal-columns.ts
// ✅ UNE SEULE définition des colonnes du journal de paie, partagée par le
//    tableau à l'écran (JournalTable) ET le document imprimable
//    (JournalPrintable) → les deux affichent toujours exactement la même chose.
//
//    Ordre d'une feuille de paie : rémunération → brut → charges salariales →
//    indemnités non imposables → retenues → net → (expatriés) étranger → total.
//    Les colonnes sans aucune valeur ne sont jamais créées (cf. options du
//    backend : showOvertime, showAnciennete, showLoan...).
// ============================================================================
import type { JournalRow, JournalTotals, PayrollJournal } from '@/types/payroll-journal';

export type JournalGroup =
  | 'REMUNERATION'
  | 'CHARGES'
  | 'INDEMNITES'
  | 'RETENUES'
  | 'NET'
  | 'ETRANGER'
  | 'TOTAL';

export const GROUP_LABEL: Record<JournalGroup, string> = {
  REMUNERATION: 'Rémunération',
  CHARGES: 'Charges salariales',
  INDEMNITES: 'Indemnités non imposables',
  RETENUES: 'Retenues',
  NET: 'Net',
  ETRANGER: 'Expatriés — pays étranger',
  TOTAL: 'Total Congo + étranger',
};

export interface JournalCol {
  id: string;
  group: JournalGroup;
  label: string;
  get: (r: JournalRow) => number;
  total: (t: JournalTotals) => number;
  /** Colonne mise en avant (brut, net, totaux) */
  strong?: boolean;
  /** Retenue / charge : affichée comme une déduction */
  negative?: boolean;
}

export function buildJournalColumns(j: PayrollJournal): JournalCol[] {
  const cols: JournalCol[] = [];
  const o = j.options;

  cols.push({
    id: 'base', group: 'REMUNERATION', label: 'Salaire de base',
    get: (r) => r.baseSalary, total: (t) => t.baseSalary,
  });

  for (const c of j.columns.primes) {
    cols.push({
      id: `prime:${c.key}`, group: 'REMUNERATION', label: c.label,
      get: (r) => r.primes[c.key] ?? 0, total: (t) => t.primes[c.key] ?? 0,
    });
  }
  if (o.showAnciennete) {
    cols.push({
      id: 'anciennete', group: 'REMUNERATION', label: 'Ancienneté',
      get: (r) => r.anciennete, total: (t) => t.anciennete,
    });
  }
  if (o.showConges) {
    cols.push({
      id: 'conges', group: 'REMUNERATION', label: 'Indemnité de congé',
      get: (r) => r.conges, total: (t) => t.conges,
    });
  }
  // Heures sup : uniquement si l'entreprise les a activées (et qu'il y en a)
  if (o.showOvertime) {
    cols.push({
      id: 'overtime', group: 'REMUNERATION', label: 'Heures sup.',
      get: (r) => r.overtime, total: (t) => t.overtime,
    });
  }
  if (o.showAbsences) {
    cols.push({
      id: 'absences', group: 'REMUNERATION', label: 'Absences (−)',
      get: (r) => r.absences, total: (t) => t.absences, negative: true,
    });
  }
  cols.push({
    id: 'grossCongo', group: 'REMUNERATION', label: 'Brut',
    get: (r) => r.grossCongo, total: (t) => t.grossCongo, strong: true,
  });

  // ── Charges salariales ──
  const hasBnc = j.rows.some((r) => r.itsLabel === 'BNC');
  const hasIts = j.rows.some((r) => r.itsLabel !== 'BNC' && r.its > 0);
  const itsLabel = hasBnc && hasIts ? 'ITS / BNC' : hasBnc ? 'BNC' : 'ITS';
  cols.push({
    id: 'cnss', group: 'CHARGES', label: 'CNSS',
    get: (r) => r.cnss, total: (t) => t.cnss, negative: true,
  });
  cols.push({
    id: 'its', group: 'CHARGES', label: itsLabel,
    get: (r) => r.its, total: (t) => t.its, negative: true,
  });
  for (const c of j.columns.taxes) {
    cols.push({
      id: `tax:${c.key}`, group: 'CHARGES', label: c.label,
      get: (r) => r.taxes[c.key] ?? 0, total: (t) => t.taxes[c.key] ?? 0, negative: true,
    });
  }

  // ── Indemnités non imposables (après les charges, comme sur le papier) ──
  for (const c of j.columns.indemnites) {
    cols.push({
      id: `ind:${c.key}`, group: 'INDEMNITES', label: c.label,
      get: (r) => r.indemnites[c.key] ?? 0, total: (t) => t.indemnites[c.key] ?? 0,
    });
  }

  // ── Retenues ──
  if (o.showLoan) {
    cols.push({
      id: 'loan', group: 'RETENUES', label: 'Prêt',
      get: (r) => r.loan, total: (t) => t.loan, negative: true,
    });
  }
  if (o.showAdvance) {
    cols.push({
      id: 'advance', group: 'RETENUES', label: 'Avance',
      get: (r) => r.advance, total: (t) => t.advance, negative: true,
    });
  }
  if (o.showOtherDeductions) {
    cols.push({
      id: 'otherDeductions', group: 'RETENUES', label: 'Autres retenues',
      get: (r) => r.otherDeductions, total: (t) => t.otherDeductions, negative: true,
    });
  }

  cols.push({
    id: 'netCongo', group: 'NET', label: o.hasExpat ? 'Net Congo' : 'Net à payer',
    get: (r) => r.netCongo, total: (t) => t.netCongo, strong: true,
  });

  // ── Expatriés : uniquement si au moins un employé a une paie étrangère ──
  if (o.hasExpat) {
    cols.push({
      id: 'foreignGross', group: 'ETRANGER', label: 'Brut étranger',
      get: (r) => r.foreignGross, total: (t) => t.foreignGross,
    });
    cols.push({
      id: 'foreignNet', group: 'ETRANGER', label: 'Net étranger',
      get: (r) => r.foreignNet, total: (t) => t.foreignNet,
    });
    cols.push({
      id: 'totalGross', group: 'TOTAL', label: 'Brut total',
      get: (r) => r.totalGross, total: (t) => t.totalGross, strong: true,
    });
    cols.push({
      id: 'totalNet', group: 'TOTAL', label: 'Net total',
      get: (r) => r.totalNet, total: (t) => t.totalNet, strong: true,
    });
  }

  return cols;
}

/** Regroupe les colonnes consécutives d'un même groupe (pour la 1re ligne d'en-tête). */
export function groupSpans(cols: JournalCol[]): { group: JournalGroup; span: number }[] {
  const spans: { group: JournalGroup; span: number }[] = [];
  for (const c of cols) {
    const last = spans[spans.length - 1];
    if (last && last.group === c.group) last.span += 1;
    else spans.push({ group: c.group, span: 1 });
  }
  return spans;
}

export function fmtMoney(v: number | undefined | null): string {
  const n = Number(v ?? 0);
  if (!n) return '—';
  return Math.round(n).toLocaleString('fr-FR');
}

export const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];