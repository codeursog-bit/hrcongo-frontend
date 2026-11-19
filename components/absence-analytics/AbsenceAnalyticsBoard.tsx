'use client';
import { ModuleSelect } from '@/components/ui/ModuleSelect';
import { useModuleVisuals, ModulePageSkeleton } from '@/components/requests/ModulePageFrame';

// ============================================================================
// 📁 components/absence-analytics/AbsenceAnalyticsBoard.tsx
// ✅ Moteur d'analyse des absences PARTAGÉ, branché sur /absence-tracking/*
//    (backend en lecture seule). Paramétré par `scope` pour servir 4 pages
//    différentes sans dupliquer la logique :
//      - scope="leave"            → app/(dashboard)/conges/analyse
//                                    app/(dashboard)/rapports/observatoire-conges
//      - scope="all"              → app/(dashboard)/rapports/absences
//      - scope="absence_request"  → app/(dashboard)/presences/absences/suivi
//    Chaque page garde son propre titre / sous-navigation ; ce composant ne
//    rend QUE les onglets (Tableau de bord / Grille / Journal / Comparatif)
//    et leur contenu.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  Users, AlertTriangle, TrendingUp, CalendarClock, ListChecks,
  Percent, ChevronLeft, ChevronRight, Stethoscope, FileCheck2, FileX2,
} from 'lucide-react';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend as RLegend,
} from 'recharts';
import { api } from '@/services/api';
import SlideOver from '@/components/SlideOver';
import { colorFor, LEADERBOARD_LABELS } from '@/components/absences/absenceColors';

const MONTHS_FULL = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const WEEKDAY_ABBR = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const YEAR_PALETTE = ['var(--brand)', 'var(--green)', 'var(--mustard)', 'var(--text-secondary)', 'var(--brand-soft)'];

export type AbsenceScope = 'all' | 'leave' | 'absence_request';
type Tab = 'dashboard' | 'grille' | 'journal' | 'comparatif';
type LeaderboardKey = 'maladie' | 'conventionnelle' | 'exceptionnelle' | 'injustifiee';

export default function AbsenceAnalyticsBoard({ scope = 'all' }: { scope?: AbsenceScope }) {
  const now = new Date();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  function shiftMonth(delta: number) {
    let m = month + delta, y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m); setYear(y);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap gap-1 bg-[var(--surface-2)]  p-1 rounded-xl w-fit">
          {([
            ['dashboard', 'Tableau de bord'],
            ['grille', 'Grille mensuelle'],
            ['journal', 'Journal'],
            ['comparatif', 'Comparatif'],
          ] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${tab === key ? 'bg-[var(--brand)] text-[var(--on-brand)] shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] '}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[var(--surface-2)]  rounded-xl px-1 py-1 leave-period-bar">
            <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-lg hover:bg-[var(--surface)]  text-[var(--text-secondary)]"><ChevronLeft size={15} /></button>
            <ModuleSelect value={month} onChange={e => setMonth(Number(e.target.value))} className="bg-transparent text-xs font-semibold px-1 py-1 border-0">
              {MONTHS_FULL.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </ModuleSelect>
            <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-lg hover:bg-[var(--surface)]  text-[var(--text-secondary)]"><ChevronRight size={15} /></button>
          </div>
          <div className="flex items-center gap-1 bg-[var(--surface-2)]  rounded-xl px-2 py-1.5">
            <button onClick={() => setYear(y => y - 1)} className="p-1 text-[var(--text-secondary)]"><ChevronLeft size={13} /></button>
            <span className="text-xs font-semibold px-1">{year}</span>
            <button onClick={() => setYear(y => y + 1)} className="p-1 text-[var(--text-secondary)]"><ChevronRight size={13} /></button>
          </div>
        </div>
      </div>

      {tab === 'dashboard' && <DashboardTab year={year} month={month} scope={scope} />}
      {tab === 'grille' && <GrilleTab year={year} month={month} scope={scope} />}
      {tab === 'journal' && <JournalTab year={year} month={month} scope={scope} />}
      {tab === 'comparatif' && <ComparatifTab anchorYear={year} scope={scope} />}
    </div>
  );
}

function qs(params: Record<string, string | number | undefined>) {
  const parts = Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}=${v}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

// ============================================================================
// ONGLET 1 — TABLEAU DE BORD
// ============================================================================
function DashboardTab({ year, month, scope }: { year: number; month: number; scope: AbsenceScope }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardKey, setLeaderboardKey] = useState<LeaderboardKey>('maladie');
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    api.get(`/absence-tracking/dashboard${qs({ year, month, scope })}`)
      .then(setData)
      .catch(e => { console.error('Erreur chargement tableau de bord absences', e); setData(null); })
      .finally(() => setIsLoading(false));
  }, [year, month, scope]);

  if (isLoading) return <LoadingBlock />;
  if (!data) return <ErrorBlock />;

  const absentTodayTotal: number = Object.values(data.absentToday as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
  const totalAbsenceDays = data.byType.reduce((s: number, t: any) => s + t.days, 0);
  const trackableDays = data.byType.filter((t: any) => t.trackable).reduce((s: number, t: any) => s + t.days, 0);

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 leave-metrics">
        <KpiCard icon={Users} label={`${MONTHS_FULL[month - 1]} ${year}`} value={String(data.employeeCount)} sub="employé(s) actifs" tone="sky" />
        <KpiCard icon={AlertTriangle} label="Absents aujourd'hui" value={String(absentTodayTotal)} sub={`sur ${data.employeeCount}`} tone="rose" />
        <KpiCard icon={TrendingUp} label="Jours d'absence" value={String(totalAbsenceDays)} sub="cumulés ce mois" tone="amber" />
        <KpiCard icon={ListChecks} label="Jours à surveiller" value={String(trackableDays)} sub="hors congé statutaire" tone="violet" />
        <KpiCard icon={Percent} label="Taux d'absentéisme" value={`${data.absenteeismRatePercent}%`} sub="jours ouvrés × effectif" tone="rose" />
        <KpiCard icon={CalendarClock} label="Jours ouvrés" value={String(data.workingDaysInMonth)} sub="dans le mois" tone="sky" />
      </div>

      {/* alertes RH */}
      {(data.alerts?.employeeAlerts?.length > 0 || data.alerts?.departmentAlerts?.length > 0) && (
        <div className="bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  border border-[var(--border)]  rounded-2xl p-4">
          <p className="text-sm font-semibold text-[var(--danger-text)]  flex items-center gap-2 mb-3"><AlertTriangle size={16} /> Alertes RH — 12 derniers mois</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.alerts.employeeAlerts.map((a: any, i: number) => (
              <button key={i} onClick={() => setDetailEmployeeId(a.employeeId)} className="text-left text-xs bg-[var(--surface)]  rounded-xl px-3 py-2.5 border border-[var(--border)]  hover:border-[var(--border)]">
                <span className="font-semibold text-[var(--text)] ">{a.employeeName}</span>
                {a.departmentName && <span className="text-[var(--text-secondary)]"> · {a.departmentName}</span>}
                <p className="text-[var(--danger-text)]  mt-0.5">{a.message}</p>
              </button>
            ))}
            {data.alerts.departmentAlerts.map((a: any, i: number) => (
              <div key={i} className="text-xs bg-[var(--surface)]  rounded-xl px-3 py-2.5 border border-[var(--border)] ">
                <span className="font-semibold text-[var(--text)] ">{a.departmentName}</span>
                <p className="text-[var(--danger-text)]  mt-0.5">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* répartition par motif + par département */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--surface)]  rounded-2xl border border-[var(--border)]  p-5">
          <p className="text-sm font-semibold text-[var(--text-secondary)]  mb-4">Répartition par motif — {MONTHS_FULL[month - 1]}</p>
          <div className="space-y-3">
            {data.byType.length === 0 ? <EmptyLine /> : data.byType
              .sort((a: any, b: any) => b.days - a.days)
              .map((t: any) => {
                const c = colorFor(t.colorKey);
                const pct = totalAbsenceDays ? Math.round((t.days / totalAbsenceDays) * 1000) / 10 : 0;
                return (
                  <div key={t.code}>
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: c.hex }} />
                      <span className="font-medium text-[var(--text-secondary)]  flex-1">{t.label}</span>
                      {!t.trackable && <span className="text-[10px] text-[var(--text-secondary)]">droit acquis</span>}
                      <span className="text-[var(--text-secondary)] text-xs w-10 text-right">{t.days} j</span>
                      <span className="text-[var(--text-secondary)] text-xs w-10 text-right">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--surface-2)]  overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.hex }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-[var(--surface)]  rounded-2xl border border-[var(--border)]  p-5">
          <p className="text-sm font-semibold text-[var(--text-secondary)]  mb-4">Par département — taux d&apos;absentéisme</p>
          <div className="space-y-3">
            {data.byDepartment.length === 0 ? <EmptyLine /> : data.byDepartment.map((d: any) => (
              <div key={d.departmentId}>
                <div className="flex items-center gap-2 text-sm mb-1">
                  <span className="font-medium text-[var(--text-secondary)]  flex-1">{d.name}</span>
                  <span className="text-[var(--text-secondary)] text-xs">{d.days} j</span>
                  <span className={`text-xs font-semibold w-14 text-right ${d.absenteeismRatePercent >= 8 ? 'text-[var(--danger-text)]' : 'text-[var(--text-secondary)]'}`}>{d.absenteeismRatePercent}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--surface-2)]  overflow-hidden">
                  <div className={`h-full rounded-full ${d.absenteeismRatePercent >= 8 ? 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]' : 'bg-[var(--brand)]'}`} style={{ width: `${Math.min(d.absenteeismRatePercent * 4, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* classement par motif : employé + département */}
      <div className="bg-[var(--surface)]  rounded-2xl border border-[var(--border)]  p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2 leave-period-bar">
          <p className="text-sm font-semibold text-[var(--text-secondary)] ">Classement par motif — qui, quel département</p>
          <ModuleSelect value={leaderboardKey} onChange={e => setLeaderboardKey(e.target.value as LeaderboardKey)} className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)]  ">
            {Object.entries(LEADERBOARD_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </ModuleSelect>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Top employés</p>
            {data.leaderboards[leaderboardKey].length === 0 ? <EmptyLine /> : data.leaderboards[leaderboardKey].map((e: any, i: number) => (
              <button key={e.employeeId} onClick={() => setDetailEmployeeId(e.employeeId)} className="w-full flex items-center gap-3 py-2 border-b border-[var(--border)]  last:border-0 text-left hover:bg-[var(--surface-2)]  rounded-lg px-1">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-semibold shrink-0 ${i === 0 ? 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]' : 'bg-[var(--surface-2)]  text-[var(--text-secondary)]'}`}>{i + 1}</span>
                <span className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)]  truncate">{e.name}</p>
                  {e.departmentName && <p className="text-[11px] text-[var(--text-secondary)]">{e.departmentName}</p>}
                </span>
                <span className="text-sm font-semibold text-[var(--text-secondary)] ">{e.days} j</span>
              </button>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Top départements</p>
            {data.departmentLeaderboards[leaderboardKey].length === 0 ? <EmptyLine /> : data.departmentLeaderboards[leaderboardKey].map((d: any) => {
              const max = data.departmentLeaderboards[leaderboardKey][0]?.days || 1;
              return (
                <div key={d.departmentId} className="py-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-[var(--text-secondary)] ">{d.name}</span>
                    <span className="font-semibold text-[var(--text-secondary)] ">{d.days} j</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--surface-2)]  overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${(d.days / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* top 20 */}
      <div className="bg-[var(--surface)]  rounded-2xl border border-[var(--border)]  overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] ">
          <p className="text-sm font-semibold text-[var(--text-secondary)] ">Top 20 — {MONTHS_FULL[month - 1]}</p>
        </div>
        <div className="leave-table-scroll" tabIndex={0} role="region" aria-label="Tableau des congés défilant horizontalement"><table data-leave-table="true" className="w-full text-sm">
          <thead className="bg-[var(--surface-2)] ">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] font-semibold text-[var(--text-secondary)] uppercase w-10">#</th>
              <th className="px-4 py-2 text-left text-[10px] font-semibold text-[var(--text-secondary)] uppercase">Employé</th>
              <th className="px-4 py-2 text-right text-[10px] font-semibold text-[var(--text-secondary)] uppercase">Jours d&apos;absence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {data.top20Month.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-10 text-[var(--text-secondary)]">Aucune donnée pour cette période.</td></tr>
            ) : data.top20Month.map((e: any, i: number) => (
              <tr key={e.employeeId} className="hover:bg-[var(--surface-2)]  cursor-pointer" onClick={() => setDetailEmployeeId(e.employeeId)}>
                <td className="px-4 py-2 text-[var(--text-secondary)] font-semibold">{i + 1}</td>
                <td className="px-4 py-2">
                  <span className="font-semibold text-[var(--text)] ">{e.name}</span>
                  {e.departmentName && <span className="text-[var(--text-secondary)] text-xs"> · {e.departmentName}</span>}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-[var(--text)] dark:text-[var(--on-brand)]">{e.days} j</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      <EmployeeDetailSlideOver employeeId={detailEmployeeId} year={year} month={month} scope={scope} onClose={() => setDetailEmployeeId(null)} />
    </div>
  );
}

// ============================================================================
// ONGLET 2 — GRILLE MENSUELLE
// ============================================================================
function GrilleTab({ year, month, scope }: { year: number; month: number; scope: AbsenceScope }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('');
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    api.get(`/absence-tracking/grid${qs({ year, month, scope })}`)
      .then(setData)
      .catch(e => { console.error('Erreur chargement grille absences', e); setData(null); })
      .finally(() => setIsLoading(false));
  }, [year, month, scope]);

  const departments = useMemo(() => Array.from(new Set((data?.employees ?? []).map((e: any) => e.departmentName).filter(Boolean))).sort() as string[], [data]);
  const filteredEmployees = useMemo(() => !deptFilter ? (data?.employees ?? []) : (data?.employees ?? []).filter((e: any) => e.departmentName === deptFilter), [data, deptFilter]);

  if (isLoading) return <LoadingBlock />;
  if (!data) return <ErrorBlock />;

  const days = Array.from({ length: data.daysInMonth }, (_, i) => i + 1);
  const holidayByDay = new Map(data.holidays.map((h: any) => [h.day, h.name]));

  return (
    <div className="space-y-6">
      <div className="bg-[var(--surface)]  rounded-2xl border border-[var(--border)]  p-4">
        <p className="text-sm font-semibold text-[var(--text-secondary)]  mb-3">Légende</p>
        <div className="flex flex-wrap gap-3">
          {data.legend.map((l: any) => {
            const c = colorFor(l.colorKey);
            return (
              <span key={l.code} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border}`}>
                <span className="w-2 h-2 rounded-sm" style={{ background: c.hex }} /> {l.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="bg-[var(--surface)]  rounded-2xl border border-[var(--border)]  overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-[var(--border)]  flex-wrap gap-2">
          <p className="text-sm font-semibold text-[var(--text-secondary)] ">Grille — {MONTHS_FULL[month - 1]} {year}</p>
          {departments.length > 0 && (
            <ModuleSelect value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)]  ">
              <option value="">Tous les départements</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </ModuleSelect>
          )}
        </div>
        <div className="overflow-x-auto">
          <div style={{ minWidth: 900 }}>
            <div className="flex sticky top-0 z-10 bg-[var(--surface)] ">
              <div className="w-56 shrink-0 px-2 py-1.5 text-[10px] font-semibold text-[var(--text-secondary)] uppercase">Employé</div>
              {days.map(d => {
                const dayStr = String(d).padStart(2, '0');
                const wd = new Date(year, month - 1, d).getDay();
                const weekend = wd === 0 || wd === 6;
                const holidayName = holidayByDay.get(dayStr) as string | undefined;
                return (
                  <div key={d} title={holidayName ?? ''} className={`w-7 shrink-0 text-center py-1 ${weekend ? 'bg-[var(--surface-2)] ' : ''} ${holidayName ? 'bg-[var(--brand-soft)] ' : ''}`}>
                    <div className="text-[8px] text-[var(--text-secondary)] font-semibold">{WEEKDAY_ABBR[wd]}</div>
                    <div className="text-[10px] font-semibold text-[var(--text-secondary)] ">{d}</div>
                  </div>
                );
              })}
            </div>
            {filteredEmployees.length === 0 ? (
              <div className="py-10 text-center text-[var(--text-secondary)] text-sm">Aucun employé pour ce filtre.</div>
            ) : filteredEmployees.map((emp: any) => (
              <div key={emp.id} className="flex items-center border-t border-[var(--border)] ">
                <button onClick={() => setDetailEmployeeId(emp.id)} className="w-56 shrink-0 text-left px-2 py-1.5 hover:text-[var(--action)]">
                  <p className="text-xs font-semibold text-[var(--text)]  truncate">{emp.name}</p>
                  {emp.departmentName && <p className="text-[10px] text-[var(--text-secondary)] truncate">{emp.departmentName}</p>}
                </button>
                {days.map(d => {
                  const dayStr = String(d).padStart(2, '0');
                  const cell = emp.cells[dayStr];
                  const c = cell ? colorFor(cell.colorKey) : null;
                  return (
                    <div key={d} className="w-7 h-8 shrink-0 flex items-center justify-center">
                      <div
                        title={cell?.label ?? ''}
                        className="w-6 h-6 rounded-md"
                        style={{ background: c ? c.hex : 'transparent', border: c ? `1px solid ${c.hex}` : '1px dashed var(--border)' }}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <EmployeeDetailSlideOver employeeId={detailEmployeeId} year={year} month={month} scope={scope} onClose={() => setDetailEmployeeId(null)} />
    </div>
  );
}

// ============================================================================
// ONGLET 3 — JOURNAL DÉTAILLÉ (registre des absences)
// ============================================================================
function JournalTab({ year, month, scope }: { year: number; month: number; scope: AbsenceScope }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [familyFilter, setFamilyFilter] = useState('');
  const [paidFilter, setPaidFilter] = useState('');

  useEffect(() => {
    setIsLoading(true);
    api.get(`/absence-tracking/month-journal${qs({ year, month, scope })}`)
      .then(setData)
      .catch(e => { console.error('Erreur chargement journal absences', e); setData(null); })
      .finally(() => setIsLoading(false));
  }, [year, month, scope]);

  const families = useMemo(() => Array.from(new Set((data?.journal ?? []).map((j: any) => j.familyLabel))) as string[], [data]);
  const filtered = useMemo(() => (data?.journal ?? []).filter((j: any) =>
    (!familyFilter || j.familyLabel === familyFilter) &&
    (!paidFilter || (paidFilter === 'paid' ? j.paid : !j.paid)),
  ), [data, familyFilter, paidFilter]);

  if (isLoading) return <LoadingBlock />;
  if (!data) return <ErrorBlock />;

  return (
    <div className="space-y-6">
      <div className="bg-[var(--brand-soft)]  border border-[var(--border)]  rounded-2xl p-4">
        <p className="text-sm text-[var(--action)] ">{data.summary}</p>
      </div>

      <div className="bg-[var(--surface)]  rounded-2xl border border-[var(--border)]  overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-[var(--border)]  flex-wrap gap-2">
          <p className="text-sm font-semibold text-[var(--text-secondary)] ">Journal — {MONTHS_FULL[month - 1]} {year}</p>
          <div className="flex gap-2 leave-period-bar">
            <ModuleSelect value={familyFilter} onChange={e => setFamilyFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)]  ">
              <option value="">Toutes catégories</option>
              {families.map(f => <option key={f} value={f}>{f}</option>)}
            </ModuleSelect>
            <ModuleSelect value={paidFilter} onChange={e => setPaidFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)]  ">
              <option value="">Payé et non payé</option>
              <option value="paid">Payé</option>
              <option value="unpaid">Non payé</option>
            </ModuleSelect>
          </div>
        </div>
        <div className="overflow-x-auto leave-table-scroll" tabIndex={0} role="region" aria-label="Tableau des congés défilant horizontalement">
          <table data-leave-table="true" className="w-full text-sm">
            <thead className="bg-[var(--surface-2)] ">
              <tr>{['Employé', 'Motif', 'Catégorie', 'Période', 'Durée', 'Paie', 'Détail'].map(h => <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-[var(--text-secondary)] uppercase whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-[var(--text-secondary)]">Aucune absence pour ce filtre.</td></tr>
              ) : filtered.map((j: any, i: number) => (
                <tr key={i} className="hover:bg-[var(--surface-2)] ">
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-[var(--text)] ">{j.employeeName}</p>
                    {j.departmentName && <p className="text-[11px] text-[var(--text-secondary)]">{j.departmentName}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)] ">{j.label}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--surface-2)]  text-[var(--text-secondary)] ">{j.familyLabel}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)] whitespace-nowrap text-xs">
                    {new Date(j.startDate).toLocaleDateString('fr-FR')} → {new Date(j.endDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-[var(--text)] ">{j.days} j</td>
                  <td className="px-3 py-2.5">
                    {j.paid ? (
                      <span className="flex items-center gap-1 text-[var(--success-text)] text-xs font-semibold"><FileCheck2 size={13} /> Payé</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[var(--danger-text)] text-xs font-semibold"><FileX2 size={13} /> Non payé</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)] text-xs max-w-[220px] truncate" title={j.reason ?? ''}>{j.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ONGLET 4 — COMPARATIF PLURIANNUEL
// ============================================================================
function ComparatifTab({ anchorYear, scope }: { anchorYear: number; scope: AbsenceScope }) {
 const {refonte:uiRefonte,motion:uiMotion}=useModuleVisuals();
  const candidateYears = useMemo(() => [anchorYear, anchorYear - 1, anchorYear - 2, anchorYear - 3, anchorYear - 4], [anchorYear]);
  const [selectedYears, setSelectedYears] = useState<number[]>([anchorYear, anchorYear - 1, anchorYear - 2]);
  const [compareData, setCompareData] = useState<any>(null);
  const [monthlyByYear, setMonthlyByYear] = useState<Record<number, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const sortedAsc = useMemo(() => [...selectedYears].sort((a, b) => a - b), [selectedYears]);
  const sortedDesc = useMemo(() => [...selectedYears].sort((a, b) => b - a), [selectedYears]);

  function toggleYear(y: number) {
    setSelectedYears(prev => {
      if (prev.includes(y)) { if (prev.length <= 1) return prev; return prev.filter(x => x !== y); }
      return [...prev, y];
    });
  }

  useEffect(() => {
    if (sortedAsc.length < 2) return;
    setIsLoading(true);
    Promise.all([
      api.get(`/absence-tracking/compare${qs({ years: sortedAsc.join(','), scope })}`),
      Promise.all(sortedAsc.map(y => api.get(`/absence-tracking/yearly-overview${qs({ year: y, scope })}`))),
    ])
      .then(([cmp, yearlies]: [any, any[]]) => {
        setCompareData(cmp);
        const map: Record<number, any[]> = {};
        yearlies.forEach((yy, i) => { map[sortedAsc[i]] = yy.months; });
        setMonthlyByYear(map);
      })
      .catch(e => { console.error('Erreur chargement comparatif absences', e); setCompareData(null); })
      .finally(() => setIsLoading(false));
  }, [sortedAsc.join(','), scope]);

  const yearColor = (y: number) => uiRefonte ? `var(--loan-chart-${sortedDesc.indexOf(y)%3+1})` : YEAR_PALETTE[sortedDesc.indexOf(y) % YEAR_PALETTE.length];

  const monthlyComparison = useMemo(() => MONTHS_FR.map((label, idx) => {
    const row: any = { mois: label };
    sortedAsc.forEach(y => { row[String(y)] = monthlyByYear[y]?.[idx]?.totalDays ?? 0; });
    return row;
  }), [monthlyByYear, sortedAsc.join(',')]);

  const familyRows = useMemo(() => {
    if (!compareData) return [];
    const families = new Set<string>();
    compareData.years.forEach((y: any) => Object.keys(y.byFamily).forEach(f => families.add(f)));
    return Array.from(families).map(fam => {
      const values: Record<number, number> = {};
      compareData.years.forEach((y: any) => { values[y.year] = y.byFamily[fam] ?? 0; });
      return { label: fam, values };
    });
  }, [compareData]);

  const deptRows = useMemo(() => {
    if (!compareData) return [];
    const depts = new Set<string>();
    compareData.years.forEach((y: any) => Object.keys(y.byDepartment).forEach(d => depts.add(d)));
    return Array.from(depts).map(dep => {
      const values: Record<number, number> = {};
      compareData.years.forEach((y: any) => { values[y.year] = y.byDepartment[dep] ?? 0; });
      return { label: dep, values };
    });
  }, [compareData]);

  return (
    <div className="space-y-6">
      <div className="bg-[var(--surface)]  rounded-2xl border border-[var(--border)]  p-4">
        <p className="text-sm font-semibold text-[var(--text-secondary)]  mb-3">Comparer plusieurs années</p>
        <div className="flex flex-wrap gap-2">
          {candidateYears.map(y => {
            const active = selectedYears.includes(y);
            return (
              <button key={y} onClick={() => toggleYear(y)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${active ? 'text-[var(--on-brand)] border-transparent' : 'text-[var(--text-secondary)] border-[var(--border)] '}`} style={active ? { background: yearColor(y) } : {}}>
                {y}
              </button>
            );
          })}
        </div>
      </div>

      {sortedAsc.length < 2 ? (
        <div className="text-center py-10 text-[var(--text-secondary)] text-sm">Sélectionne au moins 2 années pour comparer.</div>
      ) : isLoading || !compareData ? <LoadingBlock /> : (
        <>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compareData.years.length}, minmax(0, 1fr))` }}>
            {compareData.years.map((y: any) => {
              const t = compareData.trend.find((d: any) => d.year === y.year);
              return (
                <div key={y.year} className="bg-[var(--surface)]  rounded-2xl border p-4" style={{ borderColor: uiRefonte ? 'transparent' : `${yearColor(y.year)}55` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: yearColor(y.year) }}>{y.year}</span>
                    {t?.deltaPercent != null && (
                      <span className={`text-[10px] font-semibold ${t.deltaDays > 0 ? 'text-[var(--danger-text)]' : t.deltaDays < 0 ? 'text-[var(--success-text)]' : 'text-[var(--text-secondary)]'}`}>
                        {t.deltaDays === 0 ? '=' : `${t.deltaDays > 0 ? '▲' : '▼'} ${Math.abs(t.deltaPercent)}%`}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-semibold text-[var(--text)] dark:text-[var(--on-brand)]">{y.totalDays} <span className="text-sm font-medium text-[var(--text-secondary)]">jours</span></p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{y.employeeCount} employés · {y.avgDaysPerEmployee} j/employé</p>
                  <p className="text-xs text-[var(--action)] mt-1">{y.trackableDays} j à surveiller</p>
                </div>
              );
            })}
          </div>

          <div className="bg-[var(--surface)]  rounded-2xl border border-[var(--border)]  p-5">
            <p className="text-sm font-semibold text-[var(--text-secondary)]  mb-4">Évolution mensuelle — comparaison</p>
            <ResponsiveContainer width="100%" height={260}>
              {uiRefonte ? (<AreaChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="mois" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <RLegend />
                {sortedAsc.map(y => <Area key={y} type="monotone" dataKey={String(y)} name={String(y)} stroke={yearColor(y)} strokeWidth={2.5} dot={false} fill={`var(--loan-gradient-${sortedDesc.indexOf(y)%3+1})`} fillOpacity={1} animationDuration={700} isAnimationActive={uiMotion} />)}
              </AreaChart>) : (<LineChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="mois" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <RLegend />
                {sortedAsc.map(y => <Line key={y} type="monotone" dataKey={String(y)} name={String(y)} stroke={yearColor(y)} strokeWidth={2.5} dot={{ r: 2.5 }} />)}
              </LineChart>)}
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--surface)]  rounded-2xl border border-[var(--border)]  p-5">
            <p className="text-sm font-semibold text-[var(--text-secondary)]  mb-4">Par département — comparaison</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptRows.map(r => ({ department: r.label, ...Object.fromEntries(sortedAsc.map(y => [String(y), r.values[y] ?? 0])) }))} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="department" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <RLegend />
                {sortedAsc.map(y => <Bar key={y} dataKey={String(y)} name={String(y)} fill={yearColor(y)} radius={uiRefonte ? [10,10,0,0] : [4,4,0,0]} maxBarSize={uiRefonte ? 16 : undefined} background={uiRefonte ? {fill:"var(--surface-2)",radius:10} : undefined} animationDuration={uiRefonte ? 700 : undefined} isAnimationActive={uiRefonte ? uiMotion : undefined} />)}
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 pt-3 border-t border-[var(--border)] ">
              <CompareTable rows={deptRows} years={sortedDesc} label="Département" />
            </div>
          </div>

          <div className="bg-[var(--surface)]  rounded-2xl border border-[var(--border)]  p-5">
            <p className="text-sm font-semibold text-[var(--text-secondary)]  mb-4">Par catégorie de motif — comparaison précise</p>
            <CompareTable rows={familyRows} years={sortedDesc} label="Catégorie" />
          </div>
        </>
      )}
    </div>
  );
}

function CompareTable({ rows, years, label }: { rows: { label: string; values: Record<number, number> }[]; years: number[]; label: string }) {
  const newest = years[0], oldest = years[years.length - 1];
  return (
    <div className="overflow-x-auto leave-table-scroll" tabIndex={0} role="region" aria-label="Tableau des congés défilant horizontalement">
      <table data-leave-table="true" className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] ">
            <th className="text-left px-2 py-2 text-[10px] font-semibold text-[var(--text-secondary)] uppercase">{label}</th>
            {years.map(y => <th key={y} className="text-right px-2 py-2 text-[10px] font-semibold text-[var(--text-secondary)] uppercase">{y}</th>)}
            {years.length > 1 && <th className="text-right px-2 py-2 text-[10px] font-semibold text-[var(--text-secondary)] uppercase">Var. {oldest}→{newest}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const oldVal = r.values[oldest] ?? 0, newVal = r.values[newest] ?? 0;
            const delta = newVal - oldVal;
            const pct = oldVal ? Math.round((delta / oldVal) * 1000) / 10 : (newVal > 0 ? 100 : 0);
            return (
              <tr key={r.label} className="border-b border-[var(--border)] ">
                <td className="px-2 py-2 font-medium text-[var(--text-secondary)]  whitespace-nowrap">{r.label}</td>
                {years.map(y => <td key={y} className="text-right px-2 py-2 text-[var(--text-secondary)]">{r.values[y] ?? 0} j</td>)}
                {years.length > 1 && (
                  <td className={`text-right px-2 py-2 font-semibold ${delta > 0 ? 'text-[var(--danger-text)]' : delta < 0 ? 'text-[var(--success-text)]' : 'text-[var(--text-secondary)]'}`}>
                    {delta === 0 ? '=' : `${delta > 0 ? '+' : ''}${pct}%`}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// PANNEAU DÉTAIL EMPLOYÉ (réutilisable, alimenté par /absence-tracking/employee/:id)
// ============================================================================
function EmployeeDetailSlideOver({ employeeId, year, month, scope, onClose }: { employeeId: string | null; year: number; month: number; scope: AbsenceScope; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!employeeId) { setData(null); return; }
    setIsLoading(true);
    api.get(`/absence-tracking/employee/${employeeId}${qs({ year, month, scope })}`)
      .then(setData)
      .catch(e => { console.error('Erreur chargement détail employé', e); setData(null); })
      .finally(() => setIsLoading(false));
  }, [employeeId, year, month, scope]);

  return (
    <SlideOver open={!!employeeId} onClose={onClose} title={data?.employee?.name ?? '…'} subtitle={data?.employee?.departmentName}>
      {isLoading || !data ? <LoadingBlock /> : (
        <div className="space-y-5">
          {(data.recurrence.alertSickRecurrence || data.recurrence.alertSickDays || data.recurrence.alertTrackableDays) && (
            <div className="bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  border border-[var(--border)]  rounded-xl p-3 space-y-1">
              {data.recurrence.alertSickRecurrence && <p className="text-xs text-[var(--danger-text)]  flex items-center gap-1.5"><Stethoscope size={13} /> {data.recurrence.sickEpisodesRolling90d} épisodes de maladie distincts sur 90 jours</p>}
              {data.recurrence.alertSickDays && <p className="text-xs text-[var(--danger-text)] ">{data.recurrence.sickDaysYear} jours de maladie sur l&apos;année</p>}
              {data.recurrence.alertTrackableDays && <p className="text-xs text-[var(--danger-text)] ">{data.recurrence.trackableDaysYear} jours d&apos;absence à surveiller sur l&apos;année</p>}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Répartition — {MONTHS_FULL[month - 1]}</p>
            {data.pieByType.length === 0 ? <EmptyLine /> : (
              <div className="space-y-2">
                {data.pieByType.map((t: any) => {
                  const c = colorFor(t.colorKey);
                  return (
                    <div key={t.code} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: c.hex }} />
                      <span className="flex-1 text-[var(--text-secondary)] ">{t.label}</span>
                      <span className="font-semibold text-[var(--text)] ">{t.days} j</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Vue annuelle {year}</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.yearOverview.map((m: any) => ({ mois: MONTHS_FR[m.month - 1], jours: m.totalDays }))}>
                <XAxis dataKey="mois" fontSize={10} />
                <YAxis fontSize={10} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="jours" fill="var(--brand)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </SlideOver>
  );
}

// ============================================================================
// PETITS UTILITAIRES D'AFFICHAGE
// ============================================================================
function KpiCard({ icon: Icon, label, value, sub, tone }: { icon: any; label: string; value: string; sub?: string; tone: 'sky' | 'rose' | 'amber' | 'violet' }) {
  const cls: Record<string, string> = {
    sky: 'bg-[var(--brand-soft)] text-[var(--action)]  ',
    rose: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)]  ',
    amber: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]  ',
    violet: 'bg-[var(--brand-soft)] text-[var(--action)]  ',
  };
  return (
    <div className="bg-[var(--surface)]  rounded-2xl border border-[var(--border)]  p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cls[tone]}`}><Icon size={18} /></div>
      <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-semibold text-[var(--text)] dark:text-[var(--on-brand)] truncate">{value}</p>
      {sub && <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{sub}</p>}
    </div>
  );
}

function LoadingBlock() {
  const {refonte:uiRefonte}=useModuleVisuals();
  return uiRefonte ? <ModulePageSkeleton /> : <KonzaLoader variant="section" />;
}
function ErrorBlock() {
  return <div className="text-center py-20 text-[var(--text-secondary)] text-sm">Impossible de charger ces données pour le moment.</div>;
}
function EmptyLine() {
  return <p className="text-xs text-[var(--text-secondary)] py-2">Aucune donnée pour cette période.</p>;
}
