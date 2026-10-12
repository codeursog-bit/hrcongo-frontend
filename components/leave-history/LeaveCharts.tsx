'use client';

// ============================================================================
// 📁 components/leave-history/LeaveCharts.tsx
// ✅ Diagrammes des congés — 100 % CSS/SVG (aucune dépendance de graphiques),
//    pensés pour être lus sans explication par un directeur :
//      • LeaveGantt        : "qui est absent, quand" (une barre = un congé)
//      • AbsenceCurve      : "combien de personnes absentes chaque jour"
//      • MonthlyStackedBars: jours de congé par mois, empilés par type
//      • TypeDonut         : répartition par type de congé
//      • HorizontalBars    : classement simple (départements…)
// ============================================================================

import React, { useMemo, useState } from 'react';
import {
  LEAVE_TYPE_COLORS, LEAVE_TYPE_LABELS, MONTHS_SHORT,
  dayOfYear, daysInYear, fmtDate, fmtDays,
} from '@/lib/leave-history-utils';

export interface VisualLeave {
  id: string;
  employeeId: string;
  employeeName: string;
  position?: string;
  departmentId: string | null;
  departmentName: string;
  type: string;
  status: 'APPROVED' | 'PENDING';
  startDate: string;
  endDate: string;
  daysCount: number;
  phase: 'PENDING' | 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
}

const MONTH_STARTS = (year: number) =>
  Array.from({ length: 12 }, (_, m) => dayOfYear(new Date(Date.UTC(year, m, 1))));

// ─── Légende des types ───────────────────────────────────────────────────────

export function TypeLegend({ types }: { types: string[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {types.map(t => (
        <span key={t} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: LEAVE_TYPE_COLORS[t] || '#94a3b8' }} />
          {LEAVE_TYPE_LABELS[t] || t}
        </span>
      ))}
    </div>
  );
}

// ─── 1) Gantt : une ligne par employé, une barre par congé ───────────────────

interface GanttProps {
  leaves: VisualLeave[];
  year: number;
  /** Fenêtre affichée, en jours depuis le 1er janvier (0-based, fin exclue). */
  rangeStart: number;
  rangeEnd: number;
  groupByDepartment?: boolean;
}

export function LeaveGantt({ leaves, year, rangeStart, rangeEnd, groupByDepartment = true }: GanttProps) {
  const [hover, setHover] = useState<VisualLeave | null>(null);
  const span = Math.max(rangeEnd - rangeStart, 1);
  const todayIdx = dayOfYear(new Date()) ;
  const showToday = new Date().getUTCFullYear() === year && todayIdx >= rangeStart && todayIdx < rangeEnd;
  const monthStarts = MONTH_STARTS(year);

  const pct = (day: number) => ((day - rangeStart) / span) * 100;

  // Employés ayant au moins un congé visible dans la fenêtre
  const groups = useMemo(() => {
    const visible = leaves.filter(l => {
      const s = dayOfYear(l.startDate);
      const e = dayOfYear(l.endDate);
      return e >= rangeStart && s < rangeEnd;
    });
    const byEmp = new Map<string, { name: string; dept: string; leaves: VisualLeave[] }>();
    for (const l of visible) {
      const cur = byEmp.get(l.employeeId) ?? { name: l.employeeName, dept: l.departmentName, leaves: [] };
      cur.leaves.push(l);
      byEmp.set(l.employeeId, cur);
    }
    const emps: { id: string; name: string; dept: string; leaves: VisualLeave[] }[] = Array.from(byEmp.entries()).map(([id, v]) => ({ id, ...v }));
    if (!groupByDepartment) return [{ dept: '', emps: emps.sort((a, b) => a.name.localeCompare(b.name)) }];
    type EmpRow = { id: string; name: string; dept: string; leaves: VisualLeave[] };
    const byDept = new Map<string, EmpRow[]>();
    for (const e of emps) byDept.set(e.dept, [...(byDept.get(e.dept) ?? []), e]);
    return Array.from(byDept.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dept, list]) => ({ dept, emps: list.sort((a, b) => a.name.localeCompare(b.name)) }));
  }, [leaves, rangeStart, rangeEnd, groupByDepartment]);

  if (groups.length === 0) {
    return <p className="text-sm text-[var(--text-muted)] py-10 text-center">Aucun congé sur cette période.</p>;
  }

  const visibleMonths = monthStarts
    .map((start, m) => ({ m, start }))
    .filter(({ start }) => start >= rangeStart && start < rangeEnd);

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <div style={{ minWidth: 760 }}>
          {/* En-tête des mois */}
          <div className="flex">
            <div className="w-44 shrink-0" />
            <div className="relative flex-1 h-7 border-b border-[var(--border)]">
              {visibleMonths.map(({ m, start }) => (
                <span
                  key={m}
                  className="absolute text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] pl-1"
                  style={{ left: `${pct(start)}%` }}
                >
                  {MONTHS_SHORT[m]}
                </span>
              ))}
            </div>
          </div>

          {groups.map(g => (
            <div key={g.dept || 'all'}>
              {groupByDepartment && (
                <div className="flex items-center bg-[var(--surface-2)] border-b border-[var(--border)]">
                  <div className="px-2 py-1 text-[11px] font-bold text-[var(--text)] truncate">{g.dept}</div>
                </div>
              )}
              {g.emps.map(emp => (
                <div key={emp.id} className="flex items-center border-b border-[var(--border)]/60 hover:bg-[var(--surface-2)]/50">
                  <div className="w-44 shrink-0 px-2 py-2 text-xs font-medium text-[var(--text)] truncate" title={emp.name}>
                    {emp.name}
                  </div>
                  <div className="relative flex-1 h-8">
                    {/* lignes de mois */}
                    {visibleMonths.map(({ m, start }) => (
                      <div key={m} className="absolute top-0 bottom-0 border-l border-[var(--border)]/50" style={{ left: `${pct(start)}%` }} />
                    ))}
                    {showToday && (
                      <div className="absolute top-0 bottom-0 w-px bg-red-500 z-10" style={{ left: `${pct(todayIdx)}%` }} />
                    )}
                    {emp.leaves.map(l => {
                      const s = Math.max(dayOfYear(l.startDate), rangeStart);
                      const e = Math.min(dayOfYear(l.endDate) + 1, rangeEnd);
                      const color = LEAVE_TYPE_COLORS[l.type] || '#94a3b8';
                      const pending = l.status === 'PENDING';
                      return (
                        <div
                          key={l.id}
                          onMouseEnter={() => setHover(l)}
                          onMouseLeave={() => setHover(null)}
                          className="absolute top-1.5 h-5 rounded-md cursor-default"
                          style={{
                            left: `${pct(s)}%`,
                            width: `${Math.max(pct(e) - pct(s), 0.6)}%`,
                            background: pending
                              ? `repeating-linear-gradient(45deg, ${color}55, ${color}55 4px, ${color}22 4px, ${color}22 8px)`
                              : color,
                            border: pending ? `1px dashed ${color}` : 'none',
                            opacity: l.phase === 'COMPLETED' ? 0.55 : 1,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Info-bulle fixe en bas (plus fiable sur mobile que le survol positionné) */}
      <div className="mt-3 min-h-[2.25rem] text-xs text-[var(--text-muted)]">
        {hover ? (
          <span>
            <strong className="text-[var(--text)]">{hover.employeeName}</strong> — {LEAVE_TYPE_LABELS[hover.type] || hover.type}
            {' · '}du {fmtDate(hover.startDate)} au {fmtDate(hover.endDate)} ({fmtDays(hover.daysCount)})
            {hover.status === 'PENDING' ? ' · en attente de validation' : ''}
          </span>
        ) : (
          <span>Passez la souris sur une barre pour voir le détail. Barres hachurées = demande pas encore validée. Trait rouge = aujourd&apos;hui.</span>
        )}
      </div>
    </div>
  );
}

// ─── 2) Courbe : nombre de personnes absentes chaque jour ────────────────────

interface CurveProps {
  leaves: VisualLeave[]; // uniquement APPROVED à passer ici
  year: number;
  headcount: number;
  alertPercent?: number; // seuil d'alerte (défaut 20 %)
}

export function AbsenceCurve({ leaves, year, headcount, alertPercent = 20 }: CurveProps) {
  const total = daysInYear(year);

  const { counts, peak, peakDay } = useMemo(() => {
    // Un employé absent un jour donné compte une fois (même s'il a 2 congés qui se chevauchent).
    const perDay: Set<string>[] = Array.from({ length: total }, () => new Set<string>());
    for (const l of leaves) {
      const s = Math.max(dayOfYear(l.startDate), 0);
      const e = Math.min(dayOfYear(l.endDate), total - 1);
      for (let d = s; d <= e; d++) perDay[d].add(l.employeeId);
    }
    const counts = perDay.map(s => s.size);
    let peak = 0, peakDay = 0;
    counts.forEach((c, i) => { if (c > peak) { peak = c; peakDay = i; } });
    return { counts, peak, peakDay };
  }, [leaves, total]);

  const W = 1000, H = 220, PL = 34, PB = 24, PT = 12, PR = 8;
  const yMax = Math.max(peak, Math.ceil((headcount * alertPercent) / 100), 1) + 1;
  const x = (d: number) => PL + (d / (total - 1)) * (W - PL - PR);
  const y = (v: number) => PT + (1 - v / yMax) * (H - PT - PB);

  const path = counts.map((c, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(c).toFixed(1)}`).join(' ');
  const area = `${path} L${x(total - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const threshold = (headcount * alertPercent) / 100;
  const monthStarts = MONTH_STARTS(year);
  const todayIdx = dayOfYear(new Date());
  const showToday = new Date().getUTCFullYear() === year;

  const peakDate = new Date(Date.UTC(year, 0, 1 + peakDay));
  const ticks = Array.from(new Set([0, Math.ceil(yMax / 2), yMax - 1]));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Nombre de personnes absentes par jour">
        {ticks.map(t => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
            <text x={PL - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill="var(--text-muted)">{t}</text>
          </g>
        ))}
        {monthStarts.map((s, m) => (
          <text key={m} x={x(s) + 2} y={H - 6} fontSize="10" fill="var(--text-muted)">{MONTHS_SHORT[m]}</text>
        ))}
        {headcount > 0 && (
          <g>
            <line x1={PL} x2={W - PR} y1={y(threshold)} y2={y(threshold)} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4" />
            <text x={W - PR} y={y(threshold) - 4} textAnchor="end" fontSize="10" fill="#d97706">
              Seuil d&apos;alerte {alertPercent} % de l&apos;effectif
            </text>
          </g>
        )}
        <path d={area} fill="#10b981" fillOpacity="0.18" />
        <path d={path} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
        {showToday && <line x1={x(todayIdx)} x2={x(todayIdx)} y1={PT} y2={H - PB} stroke="#ef4444" strokeWidth="1.5" />}
        {peak > 0 && (
          <g>
            <circle cx={x(peakDay)} cy={y(peak)} r="4.5" fill="#ef4444" />
          </g>
        )}
      </svg>
      <p className="text-xs text-[var(--text-muted)] mt-2">
        {peak > 0 ? (
          <>
            Pic d&apos;absence : <strong className="text-[var(--text)]">{peak} personne{peak > 1 ? 's' : ''}</strong> en même temps, autour du{' '}
            <strong className="text-[var(--text)]">{peakDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })}</strong>
            {headcount > 0 && <> ({Math.round((peak / headcount) * 100)} % de l&apos;effectif)</>}.
          </>
        ) : 'Aucune absence approuvée sur cette année.'}
      </p>
    </div>
  );
}

// ─── 3) Barres mensuelles empilées par type ──────────────────────────────────

export function MonthlyStackedBars({ leaves, year }: { leaves: VisualLeave[]; year: number }) {
  const data = useMemo(() => {
    // Les jours ouvrables du congé (daysCount) sont répartis entre les mois au prorata
    // des jours calendaires — ainsi le total du graphique = le total des KPI.
    const months = Array.from({ length: 12 }, () => new Map<string, number>());
    for (const l of leaves) {
      const perMonth = new Array(12).fill(0);
      let cal = 0;
      const s = new Date(l.startDate), e = new Date(l.endDate);
      for (let d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 1)) {
        cal++;
        if (d.getUTCFullYear() === year) perMonth[d.getUTCMonth()]++;
      }
      if (cal === 0) continue;
      perMonth.forEach((n, m) => {
        if (n > 0) months[m].set(l.type, (months[m].get(l.type) ?? 0) + l.daysCount * (n / cal));
      });
    }
    return months.map(mp => ({
      total: Math.round(Array.from(mp.values()).reduce((a, b) => a + b, 0)),
      parts: Array.from(mp.entries()).map(([t, n]) => [t, Math.round(n * 10) / 10] as [string, number]),
    }));
  }, [leaves, year]);

  const max = Math.max(...data.map(d => d.total), 1);
  const currentMonth = new Date().getUTCFullYear() === year ? new Date().getUTCMonth() : -1;

  return (
    <div className="flex items-end gap-2 h-56">
      {data.map((d, m) => (
        <div key={m} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
          <span className="text-[10px] font-semibold text-[var(--text-muted)]">{d.total > 0 ? d.total : ''}</span>
          <div className="w-full flex flex-col-reverse rounded-t-md overflow-hidden" style={{ height: `${(d.total / max) * 82}%` }}>
            {d.parts.map(([type, n]) => (
              <div
                key={type}
                title={`${LEAVE_TYPE_LABELS[type] || type} : ${n} jour(s)`}
                style={{ height: `${(n / d.parts.reduce((a, [, v]) => a + v, 0)) * 100}%`, background: LEAVE_TYPE_COLORS[type] || '#94a3b8' }}
              />
            ))}
          </div>
          <span className={`text-[10px] font-semibold ${m === currentMonth ? 'text-emerald-600' : 'text-[var(--text-muted)]'}`}>
            {MONTHS_SHORT[m]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── 4) Donut par type ───────────────────────────────────────────────────────

export function TypeDonut({ data }: { data: { type: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 52, C = 2 * Math.PI * R;
  let offset = 0;
  if (total === 0) return <p className="text-sm text-[var(--text-muted)] py-8 text-center">Aucune donnée.</p>;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="w-36 h-36 shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--border)" strokeWidth="18" />
        {data.map(d => {
          const len = (d.value / total) * C;
          const el = (
            <circle
              key={d.type} cx="70" cy="70" r={R} fill="none"
              stroke={LEAVE_TYPE_COLORS[d.type] || '#94a3b8'} strokeWidth="18"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <ul className="space-y-1.5 text-xs min-w-0">
        {data.map(d => (
          <li key={d.type} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: LEAVE_TYPE_COLORS[d.type] || '#94a3b8' }} />
            <span className="text-[var(--text-muted)] truncate">{LEAVE_TYPE_LABELS[d.type] || d.type}</span>
            <span className="font-bold text-[var(--text)] ml-auto pl-2">{Math.round((d.value / total) * 100)} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── 5) Barres horizontales (classement) ─────────────────────────────────────

export function HorizontalBars({
  data, unit = 'j', color = '#f59e0b',
}: { data: { name: string; value: number }[]; unit?: string; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  if (data.length === 0) return <p className="text-sm text-[var(--text-muted)] py-8 text-center">Aucune donnée.</p>;
  return (
    <div className="space-y-3">
      {data.map(d => (
        <div key={d.name}>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-[var(--text-muted)] truncate">{d.name}</span>
            <span className="text-[var(--text)] font-semibold shrink-0 ml-2">{Math.round(d.value * 10) / 10}{unit}</span>
          </div>
          <div className="h-2.5 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}