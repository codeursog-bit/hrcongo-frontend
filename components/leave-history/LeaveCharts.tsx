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

// ─── Légende des situations (Gantt) ──────────────────────────────────────────

export const PHASE_COLORS: Record<string, string> = {
  COMPLETED: '#94a3b8',   // déjà pris
  IN_PROGRESS: '#2563eb', // en congé en ce moment
  UPCOMING: '#10b981',    // prévu, validé
  PENDING: '#f59e0b',     // demandé, pas encore validé
};

export function PhaseLegend() {
  const items: [string, string, boolean][] = [
    ['COMPLETED', 'Déjà pris', false],
    ['IN_PROGRESS', 'En congé en ce moment', false],
    ['UPCOMING', 'À venir (validé)', false],
    ['PENDING', 'Demandé, pas encore validé', true],
  ];
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5">
      {items.map(([k, label, hatched]) => (
        <span key={k} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <span
            className="w-4 h-2.5 rounded-sm"
            style={{
              background: hatched
                ? `repeating-linear-gradient(45deg, ${PHASE_COLORS[k]}88, ${PHASE_COLORS[k]}88 3px, ${PHASE_COLORS[k]}33 3px, ${PHASE_COLORS[k]}33 6px)`
                : PHASE_COLORS[k],
              border: hatched ? `1px dashed ${PHASE_COLORS[k]}` : 'none',
            }}
          />
          {label}
        </span>
      ))}
      <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <span className="w-px h-3 bg-red-500" /> Aujourd&apos;hui
      </span>
    </div>
  );
}

const PHASE_LABEL: Record<string, string> = { COMPLETED: 'déjà pris', IN_PROGRESS: 'en cours', UPCOMING: 'à venir', PENDING: 'en attente' };
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

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
    // Phrase simple sous le nom : où en est cette personne ?
    const summarize = (ls: VisualLeave[]) => {
      const inProg = ls.find(l => l.phase === 'IN_PROGRESS');
      if (inProg) return `En congé jusqu'au ${shortDate(inProg.endDate)}`;
      const up = ls.filter(l => l.phase === 'UPCOMING').sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
      if (up) return `Part le ${shortDate(up.startDate)}`;
      const pend = ls.find(l => l.phase === 'PENDING');
      if (pend) return `Demande du ${shortDate(pend.startDate)} en attente`;
      const done = ls.filter(l => l.phase === 'COMPLETED').sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
      return done ? `Revenu le ${shortDate(done.endDate)}` : '';
    };
    const emps: { id: string; name: string; dept: string; leaves: VisualLeave[]; summary: string }[] =
      Array.from(byEmp.entries()).map(([id, v]) => ({ id, ...v, summary: summarize(v.leaves) }));
    if (!groupByDepartment) return [{ dept: '', emps: emps.sort((a, b) => a.name.localeCompare(b.name)) }];
    const byDept = new Map<string, any[]>();
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
            <div className="w-48 shrink-0" />
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
                  <div className="w-48 shrink-0 px-2 py-1.5 min-w-0" title={emp.name}>
                    <p className="text-xs font-semibold text-[var(--text)] truncate">{emp.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{emp.summary}</p>
                  </div>
                  <div className="relative flex-1 h-10">
                    {/* lignes de mois */}
                    {visibleMonths.map(({ m, start }) => (
                      <div key={m} className="absolute top-0 bottom-0 border-l border-[var(--border)]/50" style={{ left: `${pct(start)}%` }} />
                    ))}
                    {showToday && (
                      <div className="absolute top-0 bottom-0 w-px bg-red-500 z-10" style={{ left: `${pct(todayIdx)}%` }} />
                    )}
                    {emp.leaves.map((l: VisualLeave) => {
                      const s = Math.max(dayOfYear(l.startDate), rangeStart);
                      const e = Math.min(dayOfYear(l.endDate) + 1, rangeEnd);
                      const color = PHASE_COLORS[l.phase] || '#94a3b8';
                      const pending = l.status === 'PENDING';
                      const widthPct = pct(e) - pct(s);
                      return (
                        <div
                          key={l.id}
                          onMouseEnter={() => setHover(l)}
                          onMouseLeave={() => setHover(null)}
                          className="absolute top-2 h-6 rounded-md cursor-default flex items-center justify-center overflow-hidden"
                          style={{
                            left: `${pct(s)}%`,
                            width: `${Math.max(pct(e) - pct(s), 0.6)}%`,
                            background: pending
                              ? `repeating-linear-gradient(45deg, ${color}55, ${color}55 4px, ${color}22 4px, ${color}22 8px)`
                              : color,
                            border: pending ? `1px dashed ${color}` : 'none',
                          }}
                        >
                          {widthPct > 9 && (
                            <span className="text-[10px] font-semibold text-white whitespace-nowrap px-1 drop-shadow-sm">
                              {shortDate(l.startDate)} → {shortDate(l.endDate)}
                            </span>
                          )}
                        </div>
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
            {' · '}{PHASE_LABEL[hover.phase]}{' · '}du {fmtDate(hover.startDate)} au {fmtDate(hover.endDate)} ({fmtDays(hover.daysCount)})
            {hover.status === 'PENDING' ? ' · en attente de validation' : ''}
          </span>
        ) : (
          <span>Passez la souris sur une barre pour voir le détail du congé.</span>
        )}
      </div>
    </div>
  );
}

// ─── 2) Courbe explicite : combien de personnes sont absentes, jour après jour ──

interface CurveProps {
  leaves: VisualLeave[]; // uniquement APPROVED
  year: number;
  headcount: number;
}

export function AbsenceCurve({ leaves, year, headcount }: CurveProps) {
  const total = daysInYear(year);
  const dateOf = (d: number) => new Date(Date.UTC(year, 0, 1 + d));
  const fmtD = (d: number) => dateOf(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' });

  const { counts, names, peak, peakDay, periods } = useMemo(() => {
    const perDay: Map<string, string>[] = Array.from({ length: total }, () => new Map<string, string>());
    for (const l of leaves) {
      const s0 = Math.max(dayOfYear(l.startDate), 0);
      const e0 = Math.min(dayOfYear(l.endDate), total - 1);
      for (let d = s0; d <= e0; d++) perDay[d].set(l.employeeId, l.employeeName);
    }
    const counts = perDay.map(m => m.size);
    let peak = 0, peakDay = 0;
    counts.forEach((c, i) => { if (c > peak) { peak = c; peakDay = i; } });

    // Périodes les plus chargées : jours consécutifs avec au moins 70 % du pic
    const limit = peak <= 1 ? 1 : Math.max(2, Math.ceil(peak * 0.7));
    const periods: { start: number; end: number; max: number; people: string[] }[] = [];
    let cur: { start: number; end: number; max: number; people: Map<string, string> } | null = null;
    for (let d = 0; d < total; d++) {
      if (counts[d] >= limit && peak > 0) {
        if (!cur) cur = { start: d, end: d, max: counts[d], people: new Map() };
        cur.end = d;
        cur.max = Math.max(cur.max, counts[d]);
        perDay[d].forEach((n, id) => cur!.people.set(id, n));
      } else if (cur) {
        periods.push({ ...cur, people: Array.from(cur.people.values()) });
        cur = null;
      }
    }
    if (cur) periods.push({ ...cur, people: Array.from(cur.people.values()) });
    periods.sort((a, b) => b.max - a.max || (b.end - b.start) - (a.end - a.start));
    return { counts, names: perDay, peak, peakDay, periods: periods.slice(0, 3) };
  }, [leaves, total]);

  const W = 1000, H = 260, PL = 44, PB = 28, PT = 28, PR = 12;
  const yMax = Math.max(peak + 1, 3);
  const x = (d: number) => PL + (d / (total - 1)) * (W - PL - PR);
  const y = (v: number) => PT + (1 - v / yMax) * (H - PT - PB);

  // Courbe en marches : le nombre ne change qu'aux départs / retours
  let path = '';
  counts.forEach((c, i) => { path += `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(c).toFixed(1)} `; });
  const area = `${path} L${x(total - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const monthStarts = MONTH_STARTS(year);
  const todayIdx = dayOfYear(new Date());
  const showToday = new Date().getUTCFullYear() === year;
  const todayCount = showToday ? counts[Math.min(Math.max(todayIdx, 0), total - 1)] : 0;
  const ticks = Array.from({ length: yMax + 1 }, (_, i) => i).filter(i => yMax <= 8 || i % 2 === 0);
  const badge = ['①', '②', '③'];

  return (
    <div>
      <p className="text-sm text-[var(--text-muted)] mb-3">
        <strong className="text-[var(--text)]">Comment lire ce graphique :</strong> la courbe monte quand des collègues partent en congé,
        et redescend quand ils reviennent. Plus elle est haute, moins l&apos;équipe est au complet ce jour-là.
      </p>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Nombre de personnes absentes chaque jour">
        {/* grille + axe vertical */}
        {ticks.map(t => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
            <text x={PL - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill="var(--text-muted)">{t}</text>
          </g>
        ))}
        <text x={12} y={PT - 12} fontSize="12" fontWeight="600" fill="var(--text-muted)">Personnes absentes</text>

        {/* périodes les plus chargées */}
        {periods.map((p, i) => (
          <g key={i}>
            <rect x={x(p.start)} y={PT} width={Math.max(x(p.end) - x(p.start), 3)} height={H - PT - PB} fill="#f59e0b" fillOpacity="0.14" />
            <text x={(x(p.start) + x(p.end)) / 2} y={PT + 14} textAnchor="middle" fontSize="15" fontWeight="700" fill="#b45309">{badge[i]}</text>
          </g>
        ))}

        {/* mois */}
        {monthStarts.map((s0, m) => (
          <g key={m}>
            <line x1={x(s0)} x2={x(s0)} y1={H - PB} y2={H - PB + 4} stroke="var(--border)" />
            <text x={x(s0) + 3} y={H - 8} fontSize="12" fill="var(--text-muted)">{MONTHS_SHORT[m]}</text>
          </g>
        ))}

        <path d={area} fill="#10b981" fillOpacity="0.22" />
        <path d={path} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinejoin="round" />

        {/* aujourd'hui */}
        {showToday && (
          <g>
            <line x1={x(todayIdx)} x2={x(todayIdx)} y1={PT} y2={H - PB} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" />
            <rect x={Math.min(x(todayIdx) - 38, W - 90)} y={H - PB - 22} width="76" height="18" rx="9" fill="#ef4444" />
            <text x={Math.min(x(todayIdx), W - 52)} y={H - PB - 9} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">Aujourd&apos;hui</text>
          </g>
        )}

        {/* pic */}
        {peak > 0 && (
          <g>
            <circle cx={x(peakDay)} cy={y(peak)} r="6" fill="#ef4444" stroke="#fff" strokeWidth="2" />
            <text
              x={Math.min(Math.max(x(peakDay), PL + 70), W - 90)}
              y={y(peak) - 12}
              textAnchor="middle" fontSize="13" fontWeight="700" fill="#dc2626"
            >
              Pic : {peak} absent{peak > 1 ? 's' : ''}
            </text>
          </g>
        )}
      </svg>

      {/* Ce que dit la courbe, en phrases */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-[var(--surface-2)] p-4 text-sm text-[var(--text)] space-y-1.5">
          {showToday && (
            <p>
              <span className="text-red-500 font-bold">●</span> Aujourd&apos;hui : <strong>{todayCount === 0 ? 'personne' : `${todayCount} personne${todayCount > 1 ? 's' : ''}`}</strong> en congé
              {headcount > 0 && todayCount > 0 && <> sur {headcount} ({Math.round((todayCount / headcount) * 100)} % de l&apos;effectif)</>}.
            </p>
          )}
          {peak > 0 ? (
            <p>
              <span className="text-red-500 font-bold">●</span> Le jour le plus chargé est le <strong>{fmtD(peakDay)}</strong> :{' '}
              <strong>{peak} personne{peak > 1 ? 's' : ''}</strong> absente{peak > 1 ? 's' : ''} en même temps
              {names[peakDay].size > 0 && <> ({Array.from(names[peakDay].values()).join(', ')})</>}.
            </p>
          ) : (
            <p>Aucun congé approuvé sur cette année.</p>
          )}
        </div>

        {periods.length > 0 && (
          <div className="rounded-xl bg-amber-50/70 dark:bg-amber-900/10 border border-amber-200/70 dark:border-amber-800/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300 mb-2">Les périodes où l&apos;équipe est la plus réduite</p>
            <ul className="space-y-2 text-sm text-[var(--text)]">
              {periods.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-bold text-amber-700 dark:text-amber-300">{badge[i]}</span>
                  <span>
                    {p.start === p.end ? <>Le <strong>{fmtD(p.start)}</strong></> : <>Du <strong>{fmtD(p.start)}</strong> au <strong>{fmtD(p.end)}</strong></>}
                    {' '}: jusqu&apos;à <strong>{p.max}</strong> absent{p.max > 1 ? 's' : ''}
                    <span className="block text-xs text-[var(--text-muted)]">{p.people.slice(0, 6).join(', ')}{p.people.length > 6 ? '…' : ''}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
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

// ─── 6) Simple : combien de personnes sont absentes, mois par mois ───────────

export function PeoplePerMonthBars({ leaves, year, headcount }: { leaves: VisualLeave[]; year: number; headcount: number }) {
  const months = useMemo(() => {
    const res = Array.from({ length: 12 }, () => new Map<string, string>()); // employeeId -> nom
    for (const l of leaves) {
      const s = new Date(l.startDate), e = new Date(l.endDate);
      for (let m = 0; m < 12; m++) {
        const mStart = Date.UTC(year, m, 1), mEnd = Date.UTC(year, m + 1, 0);
        if (s.getTime() <= mEnd && e.getTime() >= mStart) res[m].set(l.employeeId, l.employeeName);
      }
    }
    return res.map(mp => Array.from(mp.values()));
  }, [leaves, year]);

  const now = new Date();
  const currentMonth = now.getUTCFullYear() === year ? now.getUTCMonth() : now.getUTCFullYear() > year ? 12 : -1;
  const max = Math.max(...months.map(m => m.length), 1);

  return (
    <div>
      <div className="flex items-end gap-1.5 sm:gap-2 h-52">
        {months.map((names, m) => {
          const isNow = m === currentMonth;
          const isPast = currentMonth === 12 || (currentMonth >= 0 && m < currentMonth);
          return (
            <div key={m} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={names.length ? names.join(', ') : 'Personne'}>
              <span className="text-xs font-bold text-[var(--text)]">{names.length || ''}</span>
              <div
                className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${(names.length / max) * 78}%`,
                  minHeight: names.length ? 6 : 0,
                  background: isNow ? '#059669' : isPast ? '#94a3b8' : '#6ee7b7',
                }}
              />
              <span className={`text-[10px] sm:text-xs font-semibold ${isNow ? 'text-emerald-600' : 'text-[var(--text-muted)]'}`}>{MONTHS_SHORT[m]}</span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#94a3b8' }} />Mois passés</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#059669' }} />Mois en cours</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#6ee7b7' }} />Mois à venir</span>
        {headcount > 0 && <span className="ml-auto">Effectif total : {headcount} personnes</span>}
      </div>
    </div>
  );
}