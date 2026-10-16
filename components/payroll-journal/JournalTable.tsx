'use client';

// ============================================================================
// 📁 components/payroll-journal/JournalTable.tsx
// ✅ Tableau du journal de paie à l'écran — du plus payé au moins payé.
//    Colonnes générées par lib/payroll-journal-columns.ts (mêmes colonnes que
//    le document imprimable). Les expatriés portent un badge avec leurs pays ;
//    le bouton globe ouvre la saisie de leur paie étrangère.
// ============================================================================

import React, { useMemo } from 'react';
import { Globe2 } from 'lucide-react';
import type { JournalRow, PayrollJournal } from '@/types/payroll-journal';
import {
  GROUP_LABEL, buildJournalColumns, fmtMoney, groupSpans,
  type JournalGroup,
} from '@/lib/payroll-journal-columns';

// Teinte d'en-tête par groupe — uniquement les variables du thème de l'app.
const GROUP_HEAD: Record<JournalGroup, string> = {
  REMUNERATION: 'bg-[var(--brand-soft)] text-[var(--brand-strong)]',
  CHARGES: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  INDEMNITES: 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300',
  RETENUES: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  NET: 'bg-[var(--brand)] text-white',
  ETRANGER: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300',
  TOTAL: 'bg-[var(--text)] text-[var(--surface)]',
};

interface Props {
  journal: PayrollJournal;
  onEditForeign?: (row: JournalRow) => void;
}

export default function JournalTable({ journal, onEditForeign }: Props) {
  const cols = useMemo(() => buildJournalColumns(journal), [journal]);
  const spans = useMemo(() => groupSpans(cols), [cols]);
  const canEdit = !!onEditForeign;

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            {/* Ligne 1 : groupes */}
            <tr>
              <th rowSpan={2} className="sticky left-0 z-20 bg-[var(--surface-2)] px-3 py-2 text-left text-[11px] font-semibold uppercase text-[var(--text-muted)] border-b border-[var(--border)] w-8">
                N°
              </th>
              <th rowSpan={2} className="sticky left-8 z-20 bg-[var(--surface-2)] px-3 py-2 text-left text-[11px] font-semibold uppercase text-[var(--text-muted)] border-b border-[var(--border)] min-w-[200px]">
                Employé
              </th>
              {spans.map((s, i) => (
                <th
                  key={`${s.group}-${i}`}
                  colSpan={s.span}
                  className={`px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide border-l border-[var(--border)] ${GROUP_HEAD[s.group]}`}
                >
                  {GROUP_LABEL[s.group]}
                </th>
              ))}
              {canEdit && (
                <th rowSpan={2} className="bg-[var(--surface-2)] px-2 py-2 border-b border-[var(--border)] w-10 print:hidden" />
              )}
            </tr>
            {/* Ligne 2 : colonnes */}
            <tr className="bg-[var(--surface-2)]">
              {cols.map((c) => (
                <th
                  key={c.id}
                  className={`px-2 py-2 text-right text-[11px] font-semibold text-[var(--text-muted)] border-b border-l border-[var(--border)] whitespace-nowrap ${c.strong ? 'text-[var(--text)]' : ''}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {journal.rows.map((r) => (
              <tr key={r.employeeId} className="group hover:bg-[var(--surface-2)] transition-colors">
                <td className="sticky left-0 z-10 bg-[var(--surface)] group-hover:bg-[var(--surface-2)] px-3 py-2 text-[var(--text-muted)] border-b border-[var(--border)]">
                  {r.rank}
                </td>
                <td className="sticky left-8 z-10 bg-[var(--surface)] group-hover:bg-[var(--surface-2)] px-3 py-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-[var(--text)]">{r.employeeName}</span>
                    {r.isExpat && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 text-[10px] font-semibold">
                        <Globe2 className="w-3 h-3" />
                        Expat · {r.foreign.map((f) => f.countryCode).join(', ')}
                      </span>
                    )}
                    {r.status === 'ETRANGER_SEUL' && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] font-semibold">
                        Sans bulletin Congo
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">{r.position}</div>
                </td>
                {cols.map((c) => {
                  const v = c.get(r);
                  return (
                    <td
                      key={c.id}
                      className={`px-2 py-2 text-right tabular-nums border-b border-l border-[var(--border)] whitespace-nowrap ${
                        c.strong ? 'font-bold text-[var(--text)]' : 'text-[var(--text)]'
                      } ${c.negative && v ? 'text-red-600 dark:text-red-400' : ''}`}
                    >
                      {fmtMoney(v)}
                    </td>
                  );
                })}
                {canEdit && (
                  <td className="px-2 py-2 border-b border-[var(--border)] text-center print:hidden">
                    <button
                      onClick={() => onEditForeign?.(r)}
                      title="Paie à l'étranger (expatrié)"
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
                    >
                      <Globe2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="bg-[var(--surface-2)] font-bold">
              <td className="sticky left-0 z-10 bg-[var(--surface-2)] px-3 py-2.5" />
              <td className="sticky left-8 z-10 bg-[var(--surface-2)] px-3 py-2.5 text-[var(--text)] uppercase">
                Total ({journal.rows.length})
              </td>
              {cols.map((c) => (
                <td key={c.id} className="px-2 py-2.5 text-right tabular-nums text-[var(--text)] border-l border-[var(--border)] whitespace-nowrap">
                  {fmtMoney(c.total(journal.totals))}
                </td>
              ))}
              {canEdit && <td className="print:hidden" />}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}