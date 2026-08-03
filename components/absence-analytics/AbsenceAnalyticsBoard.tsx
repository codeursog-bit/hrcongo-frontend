'use client';

// ============================================================================
// 📁 components/absence-analytics/AbsenceAnalyticsBoard.tsx
// ✅ Bloc RÉUTILISÉ par 4 pages :
//    - /presences/absences/suivi        (scope="all",   dans le module Présences)
//    - /rapports/absences                (scope="all",   dans le module Rapports)
//    - /conges/analyse                   (scope="leave", dans le module Congés)
//    - /rapports/observatoire-conges      (scope="leave", dans le module Rapports)
//
//    Toute la donnée vient de /absence-tracking (module backend dédié).
//    Mise en page et intitulés volontairement réorganisés par rapport au
//    fichier Excel de référence (rien n'est au même endroit ni sous le même
//    nom) — uniquement la palette et les composants déjà utilisés dans
//    Konza RH.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  Loader2, Users, CalendarDays, TrendingUp, TrendingDown, Flame,
  ChevronLeft, ChevronRight, Building2, Filter, X, Medal,
  Radar, LineChart as LineChartIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from 'recharts';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';
import { colorFor, CHART_PALETTE } from '@/lib/absence-tracking-colors';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const TOOLTIP_STYLE = { backgroundColor: '#1f2937', color: '#fff', borderRadius: '12px', border: 'none' };

function currentYear() { return new Date().getFullYear(); }

export interface AbsenceAnalyticsBoardProps {
  /** 'all' = congés + permissions + absences injustifiées. 'leave' = uniquement les congés (module Leave). */
  scope: 'all' | 'leave';
}

export default function AbsenceAnalyticsBoard({ scope }: AbsenceAnalyticsBoardProps) {
  const scopeQS = scope !== 'all' ? `&scope=${scope}` : '';

  const [year, setYear] = useState(currentYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [focusYear, setFocusYear] = useState(currentYear());
  const [focusDepartmentId, setFocusDepartmentId] = useState('');
  const [compareYears, setCompareYears] = useState<number[]>([currentYear() - 2, currentYear() - 1, currentYear()]);

  const [dashboard, setDashboard] = useState<any>(null);
  const [prevMonthTotal, setPrevMonthTotal] = useState<number | null>(null);
  const [grid, setGrid] = useState<any>(null);
  const [yearly, setYearly] = useState<any>(null);
  const [deptFocus, setDeptFocus] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [loadingMonth, setLoadingMonth] = useState(true);
  const [loadingYear, setLoadingYear] = useState(true);
  const [loadingCompare, setLoadingCompare] = useState(true);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeDetail, setEmployeeDetail] = useState<any>(null);

  useEffect(() => {
    api.get('/departments').then((d: any) => {
      setDepartments(d || []);
      if (d?.length) setFocusDepartmentId(d[0].id);
    }).catch(() => {});
  }, []);

  // ── Section 1 : le mois sélectionné ────────────────────────────────────
  useEffect(() => {
    setLoadingMonth(true);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    Promise.all([
      api.get(`/absence-tracking/dashboard?year=${year}&month=${month}${scopeQS}`),
      api.get(`/absence-tracking/grid?year=${year}&month=${month}${departmentId ? `&departmentId=${departmentId}` : ''}${scopeQS}`),
      api.get(`/absence-tracking/dashboard?year=${prevYear}&month=${prevMonth}${scopeQS}`).catch(() => null),
    ]).then(([d, g, prev]) => {
      setDashboard(d); setGrid(g);
      const prevTotal = prev ? ((prev as any).byType ?? []).reduce((s: number, t: any) => s + t.days, 0) : null;
      setPrevMonthTotal(prevTotal);
    })
      .catch((e) => console.error(e))
      .finally(() => setLoadingMonth(false));
  }, [year, month, departmentId]);

  // ── Section 2 : trajectoire annuelle ───────────────────────────────────
  useEffect(() => {
    setLoadingYear(true);
    api.get(`/absence-tracking/yearly-overview?year=${focusYear}${scopeQS}`)
      .then(setYearly)
      .catch((e) => console.error(e))
      .finally(() => setLoadingYear(false));
  }, [focusYear]);

  useEffect(() => {
    if (!focusDepartmentId) return;
    api.get(`/absence-tracking/yearly-department-focus?year=${focusYear}&departmentId=${focusDepartmentId}${scopeQS}`)
      .then(setDeptFocus).catch(() => {});
  }, [focusYear, focusDepartmentId]);

  // ── Section 3 : comparaison pluriannuelle ──────────────────────────────
  useEffect(() => {
    if (compareYears.length < 2) return;
    setLoadingCompare(true);
    api.get(`/absence-tracking/compare?years=${compareYears.join(',')}${scopeQS}`)
      .then(setComparison)
      .catch((e) => console.error(e))
      .finally(() => setLoadingCompare(false));
  }, [compareYears]);

  useEffect(() => {
    if (!selectedEmployeeId) { setEmployeeDetail(null); return; }
    api.get(`/absence-tracking/employee/${selectedEmployeeId}?year=${year}&month=${month}${scopeQS}`)
      .then(setEmployeeDetail).catch(() => {});
  }, [selectedEmployeeId, year, month]);

  const monthOptions = MONTHS.map((m, i) => ({ value: String(i + 1), label: m }));
  const deptOptions = [{ value: '', label: 'Tous les services' }, ...departments.map((d: any) => ({ value: d.id, label: d.name }))];

  function toggleCompareYear(y: number) {
    setCompareYears((prev) => {
      if (prev.includes(y)) return prev.filter((p) => p !== y);
      if (prev.length >= 5) return prev;
      return [...prev, y].sort();
    });
  }

  return (
    <div className="space-y-10">
      {/* ================= SECTION 1 — LE MOIS EN COURS ================= */}
      <section className="space-y-4">
        <SectionHeader icon={CalendarDays} title="Portrait du mois" subtitle="Répartition, alertes et calendrier collaborateurs pour la période sélectionnée" />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-white/5 rounded-xl px-2 py-1.5">
            <button onClick={() => setYear((y) => y - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500"><ChevronLeft size={16} /></button>
            <span className="font-bold text-sm text-slate-800 dark:text-white w-12 text-center">{year}</span>
            <button onClick={() => setYear((y) => y + 1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500"><ChevronRight size={16} /></button>
          </div>
          <div className="w-44"><FancySelect value={String(month)} onChange={(v) => setMonth(Number(v))} options={monthOptions} icon={CalendarDays} /></div>
          <div className="w-52"><FancySelect value={departmentId} onChange={setDepartmentId} options={deptOptions} icon={Building2} /></div>
        </div>

        {loadingMonth ? <LoadingBlock /> : (dashboard && grid && <CeMoisPanel dashboard={dashboard} grid={grid} prevMonthTotal={prevMonthTotal} onSelectEmployee={setSelectedEmployeeId} />)}
      </section>

      <SectionDivider />

      {/* ================= SECTION 2 — TRAJECTOIRE ANNUELLE ================= */}
      <section className="space-y-4">
        <SectionHeader icon={Radar} title="Trajectoire annuelle" subtitle="Évolution mois par mois, zoom par service et classement de l'année" />

        <div className="flex items-center gap-1 bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-white/5 rounded-xl px-2 py-1.5 w-fit">
          <button onClick={() => setFocusYear((y) => y - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500"><ChevronLeft size={16} /></button>
          <span className="font-bold text-sm text-slate-800 dark:text-white w-12 text-center">{focusYear}</span>
          <button onClick={() => setFocusYear((y) => y + 1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500"><ChevronRight size={16} /></button>
        </div>

        {loadingYear ? <LoadingBlock /> : (yearly && (
          <SurAnneePanel
            yearly={yearly} deptFocus={deptFocus}
            departments={departments} focusDepartmentId={focusDepartmentId} onFocusDepartment={setFocusDepartmentId}
            onSelectEmployee={setSelectedEmployeeId}
          />
        ))}
      </section>

      <SectionDivider />

      {/* ================= SECTION 3 — COMPARAISON PLURIANNUELLE ================= */}
      <section className="space-y-4">
        <SectionHeader icon={Medal} title="Comparaison pluriannuelle" subtitle="De 2 à 5 années côte à côte, pour comprendre une tendance de fond" />

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Années à comparer (max 5) :</span>
          {Array.from({ length: 8 }, (_, i) => currentYear() - 6 + i).map((y) => (
            <button key={y} onClick={() => toggleCompareYear(y)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${compareYears.includes(y) ? 'bg-sky-500 border-sky-500 text-white' : 'bg-white dark:bg-[#0B1121] border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-sky-300'}`}>
              {y}
            </button>
          ))}
        </div>

        {loadingCompare ? <LoadingBlock /> : (comparison && <ComparerPanel comparison={comparison} />)}
      </section>

      <AnimatePresence>
        {selectedEmployeeId && employeeDetail && <EmployeeDrawer detail={employeeDetail} onClose={() => setSelectedEmployeeId(null)} />}
      </AnimatePresence>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">{title}</h2>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function SectionDivider() {
  return <div className="border-t-2 border-dashed border-slate-100 dark:border-white/5" />;
}

function LoadingBlock() {
  return <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="animate-spin mr-2" size={20} /> Chargement…</div>;
}

// ============================================================================
// ONGLET 1 — "CE MOIS-CI"
// Ordre : KPI → Photographie du jour → Donuts (service d'abord) → Podium → Calendrier
// ============================================================================
function CeMoisPanel({ dashboard, grid, prevMonthTotal, onSelectEmployee }: any) {
  const byTypeData = (dashboard.byType ?? []).map((t: any) => ({ name: t.code, fullLabel: t.label, value: t.days, colorKey: t.colorKey }));
  const byDeptData = (dashboard.byDepartment ?? []).map((d: any) => ({ name: d.name, value: d.days }));
  const totalDays = byTypeData.reduce((s: number, d: any) => s + d.value, 0);
  const topDept = [...byDeptData].sort((a, b) => b.value - a.value)[0];
  const absentTodayEntries = Object.entries(dashboard.absentToday ?? {}) as [string, number][];
  const absentTodayTotal = absentTodayEntries.reduce((s, [, n]) => s + n, 0);

  const delta = typeof prevMonthTotal === 'number' ? totalDays - prevMonthTotal : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMini label="Effectif suivi" value={String(dashboard.employeeCount)} icon={Users} gradient="from-sky-400 to-blue-500" />
        <StatMini
          label="Volume d'absence (jours)"
          value={String(totalDays)}
          sub={delta === null ? undefined : delta === 0 ? 'Stable vs mois précédent' : `${delta > 0 ? '+' : ''}${delta} j. vs mois précédent`}
          icon={CalendarDays}
          gradient="from-violet-400 to-purple-500"
        />
        <StatMini label="Alertes du jour" value={String(absentTodayTotal)} icon={Flame} gradient="from-amber-400 to-orange-500" />
        <StatMini label="Service le plus exposé" value={topDept?.name ?? '—'} sub={topDept ? `${topDept.value} j.` : ''} icon={Building2} gradient="from-emerald-400 to-teal-500" />
      </div>

      {/* Photographie du jour — compteurs par code, même langage visuel que la légende */}
      {absentTodayEntries.length > 0 && (
        <ChartCard title="Photographie du jour">
          <div className="flex flex-wrap gap-3">
            {absentTodayEntries.map(([code, count]) => {
              const def = (dashboard.byType ?? []).find((t: any) => t.code === code) ?? { colorKey: 'neutral', label: code };
              const t = colorFor(def.colorKey);
              return (
                <div key={code} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className={`w-6 h-6 rounded ${t.solid} flex items-center justify-center text-white text-[11px] font-extrabold shrink-0`}>{count}</div>
                  <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">{def.label}</span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Poids de chaque service">
          {byDeptData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byDeptData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {byDeptData.map((_: any, i: number) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`${v} j.`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Nature des absences">
          {byTypeData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byTypeData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {byTypeData.map((d: any, i: number) => <Cell key={i} fill={colorFor(d.colorKey).hex} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any, p: any) => [`${v} j.`, p.payload.fullLabel]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <TopTable title="Podium du mois" rows={dashboard.top20Month} onSelect={onSelectEmployee} />

      {/* Légende — même format que le calendrier de Présences : carré plein + libellé */}
      {grid.legend?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Légende</h4>
          <div className="flex flex-wrap gap-4">
            {grid.legend.map((l: any) => {
              const t = colorFor(l.colorKey);
              return (
                <div key={l.code} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded ${t.solid}`} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{l.code} — {l.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Calendrier collaborateurs
            <span className="text-sm font-normal text-gray-500 ml-2">{grid.employees.length} personne(s)</span>
          </h3>
        </div>

        <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#0ea5e9 transparent' }}>
          <div className="inline-block min-w-full align-middle">
            {/* En-tête jours */}
            <div className="border-b border-gray-200 dark:border-gray-700 flex">
              <div className="sticky left-0 z-20 w-48 shrink-0 bg-gray-100 dark:bg-gray-800 p-3 font-bold text-xs uppercase border-r text-gray-500">
                Collaborateur
              </div>
              {Array.from({ length: grid.daysInMonth }, (_, i) => i + 1).map((d) => {
                const dayDate = new Date(grid.year, grid.month - 1, d);
                const dayName = dayDate.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3).toUpperCase();
                const isToday = grid.year === new Date().getFullYear() && grid.month === new Date().getMonth() + 1 && d === new Date().getDate();
                const isHoliday = grid.holidays?.some((h: any) => Number(h.day) === d);
                return (
                  <div key={d} className={`w-10 shrink-0 text-center p-2 border-r ${isToday ? 'bg-sky-100 dark:bg-sky-900/50' : isHoliday ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <div className={`text-[10px] font-bold ${isToday ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400'}`}>{dayName}</div>
                    <div className={`text-xs font-bold ${isToday ? 'text-sky-600 dark:text-sky-400' : isHoliday ? 'text-indigo-500' : 'text-gray-600 dark:text-gray-300'}`}>{d}</div>
                    {isToday && <div className="w-1.5 h-1.5 bg-sky-500 rounded-full mx-auto mt-0.5" />}
                  </div>
                );
              })}
            </div>

            {/* Lignes collaborateurs */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {grid.employees.map((emp: any) => (
                <div key={emp.id} className="flex hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <div className="sticky left-0 z-10 w-48 shrink-0 bg-white dark:bg-gray-800 p-3 border-r flex items-center gap-3">
                    <button onClick={() => onSelectEmployee(emp.id)} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0">
                      {emp.name?.[0] ?? '?'}
                    </button>
                    <div className="min-w-0">
                      <button onClick={() => onSelectEmployee(emp.id)} className="text-sm font-bold truncate text-gray-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 block">
                        {emp.name}
                      </button>
                      <p className="text-[10px] text-gray-500 truncate">{emp.departmentName || '—'}</p>
                    </div>
                  </div>
                  {Array.from({ length: grid.daysInMonth }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => {
                    const cell = emp.cells?.[d];
                    const isToday = grid.year === new Date().getFullYear() && grid.month === new Date().getMonth() + 1 && Number(d) === new Date().getDate();
                    const t = cell ? colorFor(cell.colorKey) : null;
                    return (
                      <div key={d} className="w-10 shrink-0">
                        <div
                          title={cell ? cell.label : ''}
                          className={`w-full h-full min-h-[32px] border-b border-r border-gray-100 dark:border-gray-800 ${cell ? t!.solid : 'bg-gray-50 dark:bg-gray-900'} ${isToday ? 'ring-2 ring-sky-500 ring-inset' : ''}`}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ONGLET 2 — "SUR L'ANNÉE"
// Ordre : Zoom service (en haut désormais) → Tendance annuelle → Poids des
// services dans le temps → Podium annuel
// ============================================================================
function SurAnneePanel({ yearly, deptFocus, departments, focusDepartmentId, onFocusDepartment, onSelectEmployee }: any) {
  const lineData = yearly.months.map((m: any) => ({ month: MONTHS[m.month - 1].slice(0, 3), total: m.totalDays }));

  const focusCodes = deptFocus ? Array.from(new Set(deptFocus.months.flatMap((m: any) => Object.keys(m.byType)))) as string[] : [];
  const focusData = deptFocus ? deptFocus.months.map((m: any) => {
    const row: any = { month: MONTHS[m.month - 1].slice(0, 3) };
    focusCodes.forEach((c) => { row[c] = m.byType[c] ?? 0; });
    return row;
  }) : [];

  const deptNames = Array.from(new Set(yearly.months.flatMap((m: any) => Object.keys(m.byDepartment)))) as string[];
  const percentData = yearly.months.map((m: any) => {
    const total = deptNames.reduce((s, n) => s + (m.byDepartment[n] ?? 0), 0) || 1;
    const row: any = { month: MONTHS[m.month - 1].slice(0, 3) };
    deptNames.forEach((n) => { row[n] = Math.round(((m.byDepartment[n] ?? 0) / total) * 100); });
    return row;
  });

  return (
    <div className="space-y-5">
      <ChartCard
        title="Zoom sur un service"
        action={<div className="w-48"><FancySelect value={focusDepartmentId} onChange={onFocusDepartment} options={departments.map((d: any) => ({ value: d.id, label: d.name }))} icon={Building2} /></div>}
      >
        {!deptFocus || focusData.every((r: any) => focusCodes.every((c) => !r[c])) ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={focusData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              {focusCodes.map((c, i) => (
                <Area key={c} type="monotone" dataKey={c} stackId="1" stroke={CHART_PALETTE[i % CHART_PALETTE.length]} fill={CHART_PALETTE[i % CHART_PALETTE.length]} fillOpacity={0.5} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
        {deptFocus?.departmentName && <p className="text-xs text-slate-400 mt-2">{deptFocus.employeeCount} personne(s) — {deptFocus.departmentName}</p>}
      </ChartCard>

      <ChartCard title={`Tendance annuelle — ${yearly.year}`}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="total" stroke="#0EA5E9" strokeWidth={3} dot={{ r: 4 }} name="Jours d'absence" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Poids des services dans le temps">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={percentData} stackOffset="expand">
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${v}%`} />
            <Legend />
            {deptNames.map((n, i) => <Bar key={n} dataKey={n} stackId="a" fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <TopTable title={`Podium annuel — ${yearly.year}`} rows={yearly.top20Year} onSelect={onSelectEmployee} />
    </div>
  );
}

// ============================================================================
// ONGLET 3 — "COMPARER LES ANNÉES"
// ============================================================================
function ComparerPanel({ comparison }: any) {
  const barData = comparison.years.map((y: any) => ({ year: String(y.year), total: y.totalDays }));

  return (
    <div className="space-y-5">
      <ChartCard title="Volume comparé par année">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" fontSize={12} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="total" name="Jours d'absence" radius={[8, 8, 0, 0]}>
              {barData.map((_: any, i: number) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {comparison.trend.map((t: any) => (
          <div key={t.year} className="bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-white/5 rounded-2xl p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Écart {t.year}</p>
            {t.deltaPercent === null ? <p className="text-sm text-slate-400">Année de référence</p> : (
              <div className={`flex items-center gap-2 font-bold text-lg ${t.deltaDays >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {t.deltaDays >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                {t.deltaDays >= 0 ? '+' : ''}{t.deltaDays} j. ({t.deltaPercent >= 0 ? '+' : ''}{t.deltaPercent}%)
                <span className="text-xs font-medium text-slate-400 ml-1">vs {t.year - 1}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5"><h3 className="font-bold text-slate-800 dark:text-white">Détail par année</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
              <tr><th className="px-4 py-2 text-left">Année</th><th className="px-4 py-2 text-right">Effectif</th><th className="px-4 py-2 text-right">Jours</th><th className="px-4 py-2 text-right">Moyenne / employé</th></tr>
            </thead>
            <tbody>
              {comparison.years.map((y: any) => (
                <tr key={y.year} className="border-t border-slate-50 dark:border-white/5">
                  <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200">{y.year}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">{y.employeeCount}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">{y.totalDays} j.</td>
                  <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">{y.avgDaysPerEmployee} j.</td>
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
// FICHE INDIVIDUELLE (panneau latéral)
// ============================================================================
function EmployeeDrawer({ detail, onClose }: any) {
  const pieData = detail.pieByType.map((t: any) => ({ name: t.code, fullLabel: t.label, value: t.days, colorKey: t.colorKey }));
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }} className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white dark:bg-[#0B1121] z-50 shadow-2xl overflow-y-auto">
        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{detail.employee.name}</h3>
            {detail.employee.departmentName && <p className="text-xs text-slate-400">{detail.employee.departmentName}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Fiche du mois</h4>
            {pieData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {pieData.map((d: any, i: number) => <Cell key={i} fill={colorFor(d.colorKey).hex} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any, p: any) => [`${v} j.`, p.payload.fullLabel]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Fil de l'année</h4>
            <div className="space-y-1.5">
              {detail.yearOverview.map((m: any) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="w-8 text-[11px] font-semibold text-slate-400">{MONTHS[m.month - 1].slice(0, 3)}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full" style={{ width: `${Math.min(m.totalDays * 10, 100)}%` }} />
                  </div>
                  <span className="w-8 text-right text-[11px] font-bold text-slate-600 dark:text-slate-300">{m.totalDays}j</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ============================================================================
// PETITS COMPOSANTS RÉUTILISABLES
// ============================================================================
function StatMini({ label, value, sub, icon: Icon, gradient }: any) {
  return (
    <div className="relative bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-white/5 rounded-2xl p-5 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl -mr-8 -mt-8`} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white truncate max-w-[140px]">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg shrink-0`}><Icon size={18} strokeWidth={2.5} /></div>
      </div>
    </div>
  );
}

function ChartCard({ title, action, children }: any) {
  return (
    <div className="bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-white/5 rounded-2xl p-5 shadow-xl shadow-slate-200/50 dark:shadow-none">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">Aucune donnée sur cette période</div>;
}

function TopTable({ title, rows, onSelect }: { title: string; rows: any[]; onSelect: (id: string) => void }) {
  return (
    <div className="bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
        <Medal size={16} className="text-amber-500" />
        <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
      </div>
      {(!rows || rows.length === 0) ? <div className="p-6 text-sm text-slate-400 text-center">Aucune donnée</div> : (
        <div className="divide-y divide-slate-50 dark:divide-white/5">
          {rows.map((r: any, i: number) => (
            <button key={r.employeeId} onClick={() => onSelect(r.employeeId)} className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] text-left">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${i < 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}>{i + 1}</span>
              <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{r.name}</span>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{r.days} j.</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}