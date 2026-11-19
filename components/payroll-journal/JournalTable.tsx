'use client';


// ============================================================================
// 📁 components/payroll-journal/JournalTable.tsx
// ✅ Tableau du journal de paie — rendu "feuille de comptabilité" (même
//    palette que l'export Excel : bleu marine, rouge brique, vert, ambre,
//    violet, or ; grille fine, lignes zébrées, ligne TOTAL dorée).
//    Du plus payé au moins payé. Colonnes = lib/payroll-journal-columns.ts.
//
//    ✅ CORRECTIF "noms transparents au scroll horizontal" : les cellules
//    figées (N° + Employé) utilisent désormais des fonds OPAQUES (hex pleins,
//    clair + sombre). Avant, elles utilisaient var(--surface-2) qui est
//    semi-transparent en mode sombre → on voyait les colonnes défiler dessous.
// ============================================================================

import React, { useMemo } from 'react';
import { Globe2 } from 'lucide-react';
import type { JournalRow, PayrollJournal } from '@/types/payroll-journal';
import {
  GROUP_COLOR, GROUP_LABEL, buildJournalColumns, fmtMoney, groupSpans,
} from '@/lib/payroll-journal-columns';

// Fonds pleins (jamais de transparence sur une cellule figée)
const BG_EVEN = 'bg-[var(--surface)]';
const BG_ODD = 'bg-[var(--surface-2)]';
const BG_HOVER = 'group-hover:bg-[var(--surface-2)]';
const GRID = 'border border-[var(--border)]';

interface Props {
  journal: PayrollJournal;
  onEditForeign?: (row: JournalRow) => void;
}

export default function JournalTable({ journal, onEditForeign }: Props) {
  const cols = useMemo(() => buildJournalColumns(journal), [journal]);
  const spans = useMemo(() => groupSpans(cols), [cols]);
  const canEdit = !!onEditForeign;

  return (
    <div className="rounded-xl border border-[var(--border)] shadow-sm overflow-hidden bg-[var(--surface)]">
      {/* Bandeau titre façon Excel */}
      <div className="px-4 py-2.5 text-center text-sm font-semibold  text-[var(--text)] bg-[var(--surface-2)]">
        JOURNAL DE PAIE — {journal.company.name.toUpperCase()}
      </div>

      <div className="overflow-x-auto">
        <div className="reports-table-region" role="region" aria-label="Données du rapport" tabIndex={0}><table data-report-table className="w-full text-[12px] border-separate border-spacing-0 text-[var(--text)] reports-table reports-journal-table">
          <thead>
            {/* Ligne 1 : groupes */}
            <tr>
              <th
                rowSpan={2}
                className={`sticky left-0 z-30 w-10 min-w-[40px] px-2 py-2 text-center text-[11px] font-semibold text-[var(--text)] bg-[var(--surface-2)] ${GRID}`}
              >
                N°
              </th>
              <th
                rowSpan={2}
                className={`sticky left-10 z-30 min-w-[210px] px-3 py-2 text-left text-[11px] font-semibold text-[var(--text)] bg-[var(--surface-2)] ${GRID} shadow-[3px_0_4px_-2px_rgba(0,0,0,0.25)]`}
              >
                Employé
              </th>
              {spans.map((s, i) => (
                <th
                  key={`${s.group}-${i}`}
                  colSpan={s.span}
                  style={{ background: 'var(--surface-2)' }}
                  className={`px-2 py-1.5 text-center text-[10px] font-semibold   text-[var(--text)] ${GRID}`}
                >
                  {GROUP_LABEL[s.group]}
                </th>
              ))}
              {canEdit && (
                <th rowSpan={2} className={`w-10 bg-[var(--surface-2)] ${GRID} print:hidden`} />
              )}
            </tr>
            {/* Ligne 2 : colonnes */}
            <tr>
              {cols.map((c) => (
                <th
                  key={c.id}
                  style={{ background: 'var(--surface-2)' }}
                  className={`px-2 py-2 text-center text-[11px] font-semibold leading-tight text-[var(--text)] ${GRID} min-w-[92px]`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {journal.rows.map((r, idx) => {
              const bg = idx % 2 === 0 ? BG_EVEN : BG_ODD;
              return (
                <tr key={r.employeeId} className="group">
                  <td className={`sticky left-0 z-20 w-10 min-w-[40px] px-2 py-1.5 text-center text-[var(--text-secondary)] ${bg}  ${BG_HOVER}  ${GRID}`}>
                    {r.rank}
                  </td>
                  <td
                    className={`sticky left-10 z-20 min-w-[210px] px-3 py-1.5 ${bg}  ${BG_HOVER}  ${GRID} shadow-[3px_0_4px_-2px_rgba(0,0,0,0.18)]`}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-[var(--text)]">{r.employeeName}</span>
                      {r.isExpat && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text)] text-[10px] font-semibold">
                          <Globe2 strokeWidth={1.5} className="w-3 h-3" />
                          {r.foreign.map((f) => f.countryCode).join(' / ')}
                        </span>
                      )}
                      {r.status === 'ETRANGER_SEUL' && (
                        <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text)] text-[10px] font-semibold">
                          Sans bulletin Congo
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">{r.position}</div>
                  </td>

                  {cols.map((c) => {
                    const v = c.get(r);
                    return (
                      <td
                        key={c.id}
                        className={`px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${bg}  ${BG_HOVER}  ${GRID}  ${
                          c.strong ? 'font-semibold text-[var(--text)]' : ''
                        }  ${v ? '' : 'text-[var(--text-secondary)]'}`}
                      >
                        {fmtMoney(v)}
                      </td>
                    );
                  })}

                  {canEdit && (
                    <td className={`px-1 py-1.5 text-center ${bg}  ${BG_HOVER}  ${GRID} print:hidden`}>
                      <button
                        onClick={() => onEditForeign?.(r)}
                        title="Paie à l'étranger (expatrié)"
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                      >
                        <Globe2 strokeWidth={1.5} className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="font-semibold text-[var(--text)]">
              <td className="sticky left-0 z-20 bg-[var(--surface-2)] border border-[var(--border)] border-t-[3px] border-t-[var(--border)] px-2 py-2" />
              <td className="sticky left-10 z-20 bg-[var(--surface-2)] border border-[var(--border)] border-t-[3px] border-t-[var(--border)] px-3 py-2  shadow-[3px_0_4px_-2px_rgba(0,0,0,0.18)]">
                Total ({journal.rows.length})
              </td>
              {cols.map((c) => (
                <td
                  key={c.id}
                  className="px-2 py-2 text-right tabular-nums whitespace-nowrap bg-[var(--surface-2)] border border-[var(--border)] border-t-[3px] border-t-[var(--border)]"
                >
                  {fmtMoney(c.total(journal.totals))}
                </td>
              ))}
              {canEdit && <td className="bg-[var(--surface-2)] border border-[var(--border)] border-t-[3px] border-t-[var(--border)] print:hidden" />}
            </tr>
          </tfoot>
        </table></div>
      </div>
    </div>
  );
}