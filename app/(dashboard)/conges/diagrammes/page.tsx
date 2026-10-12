'use client';

// ============================================================================
// 📁 app/(dashboard)/conges/diagrammes/page.tsx
// ✅ Vue en diagrammes des congés — pensée pour la direction :
//    "Qui part, quand ? Combien de personnes manquent chaque jour ? Quels
//    mois sont les plus chargés ?" — sans avoir à lire un tableau.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  Loader2, ChevronLeft, ChevronRight, Printer, Users, Plane, Hourglass, CalendarCheck,
  History, Lightbulb,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import CongeSubNav from '@/components/CongeSubNav';
import {
  LeaveGantt, AbsenceCurve, MonthlyStackedBars, TypeDonut, HorizontalBars, TypeLegend,
  type VisualLeave,
} from '@/components/leave-history/LeaveCharts';
import {
  MONTHS, LEAVE_TYPE_LABELS, fmtDate, fmtDays, dayOfYear, daysInYear,
} from '@/lib/leave-history-utils';

const ZOOMS = [
  { key: 'year', label: 'Année', months: [0, 12] },
  { key: 'q1', label: 'T1', months: [0, 3] },
  { key: 'q2', label: 'T2', months: [3, 6] },
  { key: 'q3', label: 'T3', months: [6, 9] },
  { key: 'q4', label: 'T4', months: [9, 12] },
] as const;

function Kpi({ icon: Icon, tone, value, label, hint }: { icon: any; tone: string; value: React.ReactNode; label: string; hint?: string }) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tone}`}><Icon size={20} /></div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-[var(--text)]">{value}</p>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        {hint && <p className="text-[10px] text-[var(--text-muted)]/80">{hint}</p>}
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 print:break-inside-avoid ${className}`}>
      <h2 className="text-sm font-bold text-[var(--text)]">{title}</h2>
      {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </section>
  );
}

export default function LeaveDiagramsPage() {
  const { bp } = useBasePath();
  const [userRole, setUserRole] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [departmentId, setDepartmentId] = useState('');
  const [showPending, setShowPending] = useState(true);
  const [zoom, setZoom] = useState<(typeof ZOOMS)[number]['key']>('year');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUserRole(JSON.parse(raw)?.role || '');
    } catch {}
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get<any>(`/leaves/visual-overview?year=${year}`);
        if (alive) setData(res);
      } catch (e: any) {
        if (alive) { setError(e?.message || 'Impossible de charger les données.'); setData(null); }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [year]);

  // ── Filtrage par département ──
  const allLeaves: VisualLeave[] = useMemo(() => {
    const l: VisualLeave[] = data?.leaves ?? [];
    return departmentId ? l.filter(x => x.departmentId === departmentId) : l;
  }, [data, departmentId]);

  const approved = useMemo(() => allLeaves.filter(l => l.status === 'APPROVED'), [allLeaves]);
  const pending = useMemo(() => allLeaves.filter(l => l.status === 'PENDING'), [allLeaves]);
  const ganttLeaves = showPending ? allLeaves : approved;

  const headcount = useMemo(() => {
    const depts: any[] = data?.departments ?? [];
    return departmentId
      ? depts.find(d => d.id === departmentId)?.headcount ?? 0
      : data?.totalHeadcount ?? 0;
  }, [data, departmentId]);

  // ── Chiffres clés + phrases d'analyse ──
  const insights = useMemo(() => {
    const todayIso = data?.today ? new Date(data.today) : new Date();
    const todayMs = Date.UTC(todayIso.getUTCFullYear(), todayIso.getUTCMonth(), todayIso.getUTCDate());
    const ms = (iso: string) => new Date(iso).getTime();

    const onLeaveNow = approved.filter(l => ms(l.startDate) <= todayMs && ms(l.endDate) >= todayMs);
    const in30 = approved
      .filter(l => ms(l.startDate) > todayMs && ms(l.startDate) <= todayMs + 30 * 86400000)
      .sort((a, b) => ms(a.startDate) - ms(b.startDate));
    const nextDeparture = approved
      .filter(l => ms(l.startDate) > todayMs)
      .sort((a, b) => ms(a.startDate) - ms(b.startDate))[0];

    const totalDays = approved.reduce((s, l) => s + l.daysCount, 0);
    const people = new Set(approved.map(l => l.employeeId)).size;

    // Mois le plus chargé = celui qui contient le plus de départs (simple à expliquer)
    const startsPerMonth = new Array(12).fill(0);
    for (const l of approved) {
      const d = new Date(l.startDate);
      if (d.getUTCFullYear() === year) startsPerMonth[d.getUTCMonth()]++;
    }
    const maxStarts = Math.max(...startsPerMonth);
    const busiestMonth = maxStarts > 0 ? startsPerMonth.indexOf(maxStarts) : -1;

    return { onLeaveNow, in30, nextDeparture, totalDays, people, busiestMonth, maxStarts };
  }, [approved, data, year]);

  const typeData = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of approved) m.set(l.type, (m.get(l.type) ?? 0) + l.daysCount);
    return Array.from(m.entries()).map(([type, value]) => ({ type, value })).sort((a, b) => b.value - a.value);
  }, [approved]);

  const deptData = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of approved) m.set(l.departmentName, (m.get(l.departmentName) ?? 0) + l.daysCount);
    return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [approved]);

  const usedTypes = useMemo(() => Array.from(new Set(allLeaves.map(l => l.type))), [allLeaves]);

  const zoomDef = ZOOMS.find(z => z.key === zoom)!;
  const rangeStart = dayOfYear(new Date(Date.UTC(year, zoomDef.months[0], 1)));
  const rangeEnd = zoomDef.months[1] === 12
    ? daysInYear(year)
    : dayOfYear(new Date(Date.UTC(year, zoomDef.months[1], 1)));

  const departments: any[] = data?.departments ?? [];

  return (
    <div className="max-w-[1400px] mx-auto pb-24 space-y-6">
      <div className="print:hidden"><CongeSubNav userRole={userRole} /></div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase mb-1">Congés</p>
          <h1 className="text-3xl font-bold text-[var(--text)]">Vue en diagrammes</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Qui part, quand, et combien de personnes manquent à chaque période.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <div className="flex items-center gap-1.5">
            <button onClick={() => setYear(y => y - 1)} className="p-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)]"><ChevronLeft size={18} /></button>
            <span className="px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] font-semibold text-sm min-w-[90px] text-center">{year}</span>
            <button onClick={() => setYear(y => y + 1)} className="p-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)]"><ChevronRight size={18} /></button>
          </div>
          {departments.length > 1 && (
            <select
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)]"
            >
              <option value="">Tous les départements</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <button onClick={() => window.print()} className="px-4 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)] flex items-center gap-2 hover:bg-[var(--surface-2)]">
            <Printer size={16} /> Imprimer
          </button>
          <Link href={bp('/conges/historique')} className="px-4 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)] flex items-center gap-2 hover:bg-[var(--surface-2)]">
            <History size={16} /> Historique
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/10 text-red-600 rounded-2xl p-5 text-sm">{error}</div>
      ) : (
        <>
          {/* Résumé en langage simple */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/10 p-5 flex gap-3">
            <Lightbulb size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm text-[var(--text)] space-y-1">
              <p>
                En <strong>{year}</strong>, <strong>{insights.people}</strong> employé{insights.people > 1 ? 's' : ''} {insights.people > 1 ? 'ont' : 'a'} un congé approuvé,
                pour un total de <strong>{fmtDays(Math.round(insights.totalDays * 10) / 10)}</strong>.
              </p>
              <p>
                {insights.onLeaveNow.length > 0
                  ? <>Aujourd&apos;hui, <strong>{insights.onLeaveNow.length}</strong> personne{insights.onLeaveNow.length > 1 ? 's sont' : ' est'} en congé{headcount > 0 && <> sur {headcount} ({Math.round((insights.onLeaveNow.length / headcount) * 100)} % de l&apos;effectif)</>}. </>
                  : <>Personne n&apos;est en congé aujourd&apos;hui. </>}
                {insights.nextDeparture && <>Prochain départ : <strong>{insights.nextDeparture.employeeName}</strong> le {fmtDate(insights.nextDeparture.startDate)}. </>}
                {insights.busiestMonth >= 0 && <>Le mois avec le plus de départs est <strong>{MONTHS[insights.busiestMonth].toLowerCase()}</strong> ({insights.maxStarts} départ{insights.maxStarts > 1 ? 's' : ''}).</>}
              </p>
              {pending.length > 0 && (
                <p className="text-amber-700 dark:text-amber-400">
                  {pending.length} demande{pending.length > 1 ? 's' : ''} en attente de validation (affichée{pending.length > 1 ? 's' : ''} en hachuré sur le planning).
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi icon={Users} tone="bg-blue-100 dark:bg-blue-900/30 text-blue-600" value={insights.onLeaveNow.length} label="En congé aujourd’hui" hint={headcount ? `sur ${headcount} employés actifs` : undefined} />
            <Kpi icon={Plane} tone="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" value={insights.in30.length} label="Départs dans les 30 jours" />
            <Kpi icon={Hourglass} tone="bg-amber-100 dark:bg-amber-900/30 text-amber-600" value={pending.length} label="Demandes en attente" />
            <Kpi icon={CalendarCheck} tone="bg-violet-100 dark:bg-violet-900/30 text-violet-600" value={fmtDays(Math.round(insights.totalDays * 10) / 10)} label={`Jours de congé approuvés ${year}`} />
          </div>

          {/* Gantt */}
          <Panel
            title="Qui part, et quand ?"
            subtitle="Une ligne par employé, une barre par congé. Le trait rouge indique aujourd’hui."
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 print:hidden">
              <div className="flex gap-1 bg-[var(--surface-2)] p-1 rounded-xl">
                {ZOOMS.map(z => (
                  <button
                    key={z.key}
                    onClick={() => setZoom(z.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${zoom === z.key ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
                <input type="checkbox" checked={showPending} onChange={e => setShowPending(e.target.checked)} className="accent-emerald-500" />
                Afficher les demandes en attente
              </label>
            </div>
            <div className="mb-3"><TypeLegend types={usedTypes} /></div>
            <div className="max-h-[560px] overflow-y-auto print:max-h-none">
              <LeaveGantt leaves={ganttLeaves} year={year} rangeStart={rangeStart} rangeEnd={rangeEnd} />
            </div>
          </Panel>

          {/* Courbe d'absences */}
          <Panel
            title="Combien de personnes sont absentes chaque jour ?"
            subtitle="Plus la courbe monte, plus l’équipe est réduite. Au-dessus du trait orange, l’organisation du travail peut être tendue."
          >
            <AbsenceCurve leaves={approved} year={year} headcount={headcount} />
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Charge par mois" subtitle="Jours de congé par mois, par type." className="lg:col-span-2">
              <MonthlyStackedBars leaves={approved} year={year} />
              <div className="mt-4"><TypeLegend types={usedTypes} /></div>
            </Panel>

            <Panel title="Répartition par type" subtitle="Part de chaque type dans les jours posés.">
              <TypeDonut data={typeData} />
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Jours de congé par département" subtitle="Les départements qui s’absentent le plus.">
              <HorizontalBars data={deptData} />
            </Panel>

            <Panel title="Prochains départs (30 jours)" subtitle="Pour anticiper les remplacements.">
              {insights.in30.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] py-8 text-center">Aucun départ prévu dans les 30 prochains jours.</p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {insights.in30.slice(0, 8).map(l => (
                    <li key={l.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--text)] truncate">{l.employeeName}</p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">{l.departmentName} · {LEAVE_TYPE_LABELS[l.type] || l.type}</p>
                      </div>
                      <div className="text-right text-xs shrink-0">
                        <p className="font-semibold text-[var(--text)]">{fmtDate(l.startDate)}</p>
                        <p className="text-[var(--text-muted)]">{fmtDays(l.daysCount)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}