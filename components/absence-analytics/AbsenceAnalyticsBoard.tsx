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
//    ⚠️ Revirement assumé (voir échange client) : la donnée et sa structure
//    (dashboard mensuel + grille employé × jour + Top 20) doivent maintenant
//    reprendre FIDÈLEMENT ce que montre le fichier Excel de référence du
//    client — seule la présentation change (chips/cartes pastel façon Konza
//    RH au lieu des aplats et de la mise en page Excel). La grille dense
//    (MonthlyAbsenceGrid, plus bas) est l'ajout central de ce revirement :
//    avant, seule une vue "chronologie" (barres) existait, la grille
//    case-par-case façon tableur n'était pas rendue du tout.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  Loader2, Users, CalendarDays, TrendingUp, TrendingDown, Flame,
  ChevronLeft, ChevronRight, Building2, Filter, X, Medal,
  Radar, LineChart as LineChartIcon, ShieldAlert, AlertTriangle,
  Stethoscope, HeartPulse, PartyPopper, UserX, ChevronDown, Gauge,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from 'recharts';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';
import { colorFor, CHART_PALETTE, absenteeismRateTone, FRONT_ALERT_THRESHOLDS, CODE_LABELS, FAMILY_META } from '@/lib/absence-tracking-colors';

// Icône représentative par classement ciblé — utilisé pour l'entête des
// mini-podiums "Classements ciblés" et le bandeau d'alertes.
const LEADERBOARD_META: Record<string, { label: string; icon: any; gradient: string }> = {
  maladie: { label: 'Maladie', icon: Stethoscope, gradient: 'from-violet-400 to-purple-500' },
  conventionnelle: { label: 'Conventionnelle (tout motif)', icon: HeartPulse, gradient: 'from-fuchsia-400 to-pink-500' },
  exceptionnelle: { label: 'Exceptionnelle', icon: PartyPopper, gradient: 'from-amber-400 to-orange-500' },
  injustifiee: { label: 'Non justifiée', icon: UserX, gradient: 'from-rose-400 to-red-500' },
};

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
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [focusYear, setFocusYear] = useState(currentYear());
  const [focusDepartmentId, setFocusDepartmentId] = useState('');
  const [compareYears, setCompareYears] = useState<number[]>([currentYear() - 2, currentYear() - 1, currentYear()]);

  const [dashboard, setDashboard] = useState<any>(null);
  const [prevMonthTotal, setPrevMonthTotal] = useState<number | null>(null);
  const [grid, setGrid] = useState<any>(null);
  const [journal, setJournal] = useState<any>(null);
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
    api.get('/companies/mine').then((c: any) => {
      if (c?.settings?.workDays?.length) setWorkDays(c.settings.workDays);
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
      api.get(`/absence-tracking/month-journal?year=${year}&month=${month}${scopeQS}`).catch(() => null),
    ]).then(([d, g, prev, j]) => {
      setDashboard(d); setGrid(g); setJournal(j);
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

        {loadingMonth ? <LoadingBlock /> : (dashboard && grid && <CeMoisPanel dashboard={dashboard} grid={grid} journal={journal} prevMonthTotal={prevMonthTotal} workDays={workDays} onSelectEmployee={setSelectedEmployeeId} />)}
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
function MonthJournal({ journal, onSelectEmployee }: any) {
  const rows = journal.journal ?? [];
  return (
    <div className="bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5">
        <h3 className="font-bold text-slate-800 dark:text-white">Journal du mois</h3>
        <p className="text-xs text-slate-400 mt-0.5">{journal.summary}</p>
      </div>
      {rows.length === 0 ? (
        <div className="p-6 text-sm text-slate-400 text-center">Aucune absence enregistrée ce mois-ci.</div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-white/5">
          {rows.map((r: any, i: number) => {
            const start = new Date(r.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            const end = new Date(r.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            // ✅ Le statut payé/non-payé n'est une info utile QUE quand c'est
            // une vraie décision RH (maladie, exceptionnelle, sans solde,
            // non justifiée). Le congé annuel/anticipé est TOUJOURS payé —
            // ce n'est pas une décision, donc pas la peine de le présenter
            // comme tel ("absent mais payé" laisse croire à une exception).
            const isStatutoryLeave = r.family === 'CONGE_STATUTAIRE' && ['CP', 'CA'].includes(r.code);
            return (
              <div key={i} className="px-5 py-3 flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-[220px]">
                  <button onClick={() => onSelectEmployee(r.employeeId)} className="text-sm font-bold text-slate-800 dark:text-white hover:text-sky-600 dark:hover:text-sky-400">
                    {r.employeeName}
                  </button>
                  <span className="text-xs text-slate-400 ml-2">{r.departmentName}</span>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                    <span className="font-semibold">{r.label}</span>
                    {' '}du {start} au {end} ({r.days} j.)
                  </p>
                  {r.reason && <p className="text-xs text-slate-400 mt-1 italic">« {r.reason} »</p>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {isStatutoryLeave ? (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                      Droit acquis
                    </span>
                  ) : (
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${r.paid ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}>
                      Absent — {r.paid ? 'rémunéré' : 'non rémunéré'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CeMoisPanel({ dashboard, grid, journal, yearly, prevMonthTotal, workDays, onSelectEmployee }: any) {
  const byTypeData = (dashboard.byType ?? []).map((t: any) => ({ name: t.label, code: t.code, value: t.days, colorKey: t.colorKey }));
  const byDeptData = (dashboard.byDepartment ?? []).map((d: any) => ({ name: d.name, value: d.days }));
  const totalDays = byTypeData.reduce((s: number, d: any) => s + d.value, 0);
  const absentTodayEntries = Object.entries(dashboard.absentToday ?? {}) as [string, number][];
  const absentTodayTotal = absentTodayEntries.reduce((s, [, n]) => s + n, 0);
  const todayLabel = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  const isWorkingDay = (year: number, month: number, day: number) => {
    const dow = new Date(year, month - 1, day).getDay();
    const normalized = dow === 0 ? 7 : dow;
    return (workDays ?? [1, 2, 3, 4, 5, 6]).includes(normalized);
  };

  const delta = typeof prevMonthTotal === 'number' ? totalDays - prevMonthTotal : null;
  const rate = dashboard.absenteeismRatePercent ?? 0;
  const rateTone = absenteeismRateTone(rate);
  const employeeAlerts = dashboard.alerts?.employeeAlerts ?? [];
  const departmentAlerts = dashboard.alerts?.departmentAlerts ?? [];
  const alertEmployeeIds = new Set<string>(employeeAlerts.map((a: any) => a.employeeId as string));
  const alertDepartmentIds = new Set<string>(departmentAlerts.map((a: any) => a.departmentId as string));

  return (
    <div className="space-y-5">
      {/* ============ BANDEAU CHIFFRES-CLÉS — "Nombre d'employés" +
          "Absents aujourd'hui", exactement comme l'en-tête du tableau de
          bord Excel. Le reste (volume, taux, service exposé) est SOUS ce
          bandeau, en plus petit — ce ne sont pas des chiffres de l'Excel. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0"><Users size={22} /></div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Nombre d'employés</p>
            <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{dashboard.employeeCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0"><CalendarDays size={22} /></div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Absents aujourd'hui — {todayLabel}</p>
            <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{absentTodayTotal}</p>
          </div>
        </div>
      </div>

      {/* Aujourd'hui — détail par code, complète le chiffre ci-dessus */}
      {absentTodayEntries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {absentTodayEntries.filter(([, n]) => n > 0).map(([code, count]) => {
            const def = (dashboard.byType ?? []).find((t: any) => t.code === code) ?? { colorKey: 'neutral', label: code };
            const t = colorFor(def.colorKey);
            return (
              <div key={code} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${t.chip} border text-[11px] font-bold`}>
                <span>{def.label}</span><span className="opacity-70">· {count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Repères secondaires — volume/taux/service, pas des chiffres Excel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatMini
          label="Volume d'absence (jours)"
          value={String(totalDays)}
          sub={delta === null ? undefined : delta === 0 ? 'Stable vs mois précédent' : `${delta > 0 ? '+' : ''}${delta} j. vs mois précédent`}
          icon={CalendarDays}
          gradient="from-violet-400 to-purple-500"
        />
        <StatMini
          label="Taux d'absentéisme"
          value={`${rate}%`}
          sub={`${rateTone.label} — hors congé annuel`}
          icon={Gauge}
          gradient={rateTone.bg}
        />
        <StatMini label="Service le plus exposé" value={[...byDeptData].sort((a, b) => b.value - a.value)[0]?.name ?? '—'} sub={byDeptData[0] ? `${[...byDeptData].sort((a, b) => b.value - a.value)[0]?.value} j.` : ''} icon={Building2} gradient="from-emerald-400 to-teal-500" />
      </div>

      {/* ============ RÉPARTITION DES ABSENCES — les 2 camemberts, dans
          le même ordre que l'Excel : tous les employés, puis par service. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Répartition des absences — tous les employés">
          {byTypeData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byTypeData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {byTypeData.map((d: any, i: number) => <Cell key={i} fill={colorFor(d.colorKey).hex} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any, p: any) => [`${v} j.`, `${p.payload.code} — ${p.payload.name}`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Répartition des absences — par service">
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
      </div>

      {/* ============ PRÉSENCE — légende des codes, format clé/valeur
          compact façon Excel (code + libellé), juste après les camemberts
          et avant les classements, comme dans le fichier de référence. */}
      {grid.legend?.length > 0 && (
        <div className="bg-white dark:bg-[#0B1121] rounded-2xl p-5 border border-slate-100 dark:border-white/5">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Présence</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
            {grid.legend.filter((l: any) => l.code !== 'LATE').map((l: any) => {
              const t = colorFor(l.colorKey);
              return (
                <div key={l.code} className="flex items-center gap-2">
                  <span className={`w-9 shrink-0 text-center text-[10px] font-extrabold rounded px-1 py-0.5 ${t.cellBg} ${t.cellText}`}>{l.code}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{l.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ TOP 20 — Scores d'absences, mois puis année, comme
          les deux tableaux "Top 20" de l'Excel. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopTable title={`Top 20 — Scores d'absences (${MONTHS[dashboard.month - 1]})`} rows={dashboard.top20Month} onSelect={onSelectEmployee} alertIds={alertEmployeeIds} />
        <TopTable title={`Top 20 — Scores d'absences (Annuel ${yearly?.year ?? ''})`} rows={yearly?.top20Year ?? []} onSelect={onSelectEmployee} />
      </div>

      {/* ============ GRILLE DU MOIS — la vue dense, employé × jour,
          équivalent direct des onglets Janvier→Décembre de l'Excel. */}
      <MonthlyAbsenceGrid grid={grid} workDays={workDays} onSelectEmployee={onSelectEmployee} />

      {/* ============ Ce qui suit n'existe pas dans l'Excel — analyses RH
          complémentaires propres à Konza, clairement à part. ============ */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Analyses RH complémentaires</span>
          <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
        </div>

        <div className="space-y-5">
          {(employeeAlerts.length > 0 || departmentAlerts.length > 0) && (
            <AlertsBanner employeeAlerts={employeeAlerts} departmentAlerts={departmentAlerts} onSelectEmployee={onSelectEmployee} />
          )}

          <ChartCard title="Classements ciblés par motif" subtitle="Qui, et quel service, est le plus concerné par chaque type d'absence">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['maladie', 'conventionnelle', 'exceptionnelle', 'injustifiee'] as const).map((key) => (
                <TargetedLeaderboard
                  key={key}
                  leaderboardKey={key}
                  employees={dashboard.leaderboards?.[key] ?? []}
                  departments={dashboard.departmentLeaderboards?.[key] ?? []}
                  alertEmployeeIds={alertEmployeeIds}
                  alertDepartmentIds={alertDepartmentIds}
                  onSelectEmployee={onSelectEmployee}
                />
              ))}
            </div>
          </ChartCard>

          {journal && <CollapsibleJournal journal={journal} onSelectEmployee={onSelectEmployee} />}

          {journal && (
            <ChronologyPanel
              journal={journal}
              year={grid.year}
              month={grid.month}
              daysInMonth={grid.daysInMonth}
              holidays={grid.holidays}
              isWorkingDay={isWorkingDay}
              legend={grid.legend}
              onSelectEmployee={onSelectEmployee}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// GRILLE MENSUELLE DENSE — employé × jour, la représentation fidèle à
// l'Excel de référence (une ligne par employé, une colonne par jour, un code
// dans chaque case). Seule la présentation change : chips pastel (palette
// Konza) au lieu d'aplats saturés, pour rester lisible sur 30+ lignes sans
// fatiguer l'œil, + colonnes Total/% comme dans le fichier d'origine.
// ============================================================================
function MonthlyAbsenceGrid({ grid, workDays, onSelectEmployee }: any) {
  const daysArray = Array.from({ length: grid.daysInMonth }, (_, i) => i + 1);
  const holidayMap = new Map((grid.holidays ?? []).map((h: any) => [h.day, h.name]));
  const countsAsAbsence = new Map<string, boolean>((grid.legend ?? []).map((l: any) => [l.code, l.countsAsAbsenceDay]));
  countsAsAbsence.set('PRESENT', false);
  countsAsAbsence.set('REMOTE', false);
  countsAsAbsence.set('LATE', false);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === grid.year && today.getMonth() + 1 === grid.month;
  const todayDay = isCurrentMonth ? today.getDate() : null;

  const isWorkingDay = (day: number) => {
    const dow = new Date(grid.year, grid.month - 1, day).getDay();
    const normalized = dow === 0 ? 7 : dow;
    return (workDays ?? [1, 2, 3, 4, 5, 6]).includes(normalized);
  };

  const dayName = (day: number) =>
    new Date(grid.year, grid.month - 1, day).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2).toUpperCase();

  const workingDaysCount = daysArray.filter(isWorkingDay).length;

  return (
    <div className="bg-white dark:bg-[#0B1121] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-white/5">
        <h3 className="font-bold text-slate-800 dark:text-white">
          Grille du mois, jour par jour
          <span className="text-sm font-normal text-slate-400 ml-2">
            {grid.employees?.length ?? 0} employé(s) · {workingDaysCount} j. ouvrables / {grid.daysInMonth} j.
          </span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Case vide = présence normale ce jour-là. Survolez un code pour le détail.</p>
      </div>

      {(!grid.employees || grid.employees.length === 0) ? (
        <div className="p-8 text-sm text-slate-400 text-center">Aucun employé à afficher.</div>
      ) : (
        <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#0ea5e9 transparent' }}>
          <div className="inline-block min-w-full align-middle">
            {/* En-tête jours */}
            <div className="flex border-b border-slate-100 dark:border-white/5">
              <div className="sticky left-0 z-20 w-44 shrink-0 bg-slate-50 dark:bg-white/[0.03] p-2.5 font-bold text-[11px] uppercase border-r border-slate-100 dark:border-white/5 text-slate-400">
                Employé
              </div>
              {daysArray.map((d) => {
                const isToday = d === todayDay;
                const working = isWorkingDay(d);
                const holiday = holidayMap.get(String(d).padStart(2, '0'));
                return (
                  <div
                    key={d}
                    title={holiday ? String(holiday) : undefined}
                    className={`w-7 shrink-0 text-center py-1.5 border-r border-slate-100 dark:border-white/5 ${
                      isToday ? 'bg-sky-100 dark:bg-sky-900/40'
                        : holiday ? 'bg-indigo-50 dark:bg-indigo-900/20'
                        : !working ? 'bg-slate-100 dark:bg-white/[0.04]'
                        : 'bg-slate-50/60 dark:bg-white/[0.02]'
                    }`}
                  >
                    <div className={`text-[8px] font-bold ${isToday ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>{dayName(d)}</div>
                    <div className={`text-[10px] font-bold ${isToday ? 'text-sky-600 dark:text-sky-400' : !working ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>{d}</div>
                  </div>
                );
              })}
              <div className="w-14 shrink-0 text-center py-1.5 border-l border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.03]">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Total</div>
              </div>
              <div className="w-14 shrink-0 text-center py-1.5 bg-slate-50 dark:bg-white/[0.03]">
                <div className="text-[9px] font-bold text-slate-400 uppercase">% Abs.</div>
              </div>
            </div>

            {/* Lignes employés */}
            <div className="divide-y divide-slate-50 dark:divide-white/[0.04]">
              {grid.employees.map((emp: any) => {
                let total = 0;
                daysArray.forEach((d) => {
                  const cell = emp.cells?.[String(d).padStart(2, '0')];
                  if (cell && countsAsAbsence.get(cell.code)) total += 1;
                });
                const pct = workingDaysCount > 0 ? Math.round((total / workingDaysCount) * 100) : 0;
                return (
                  <div key={emp.id} className="flex hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                    <button
                      onClick={() => onSelectEmployee?.(emp)}
                      className="sticky left-0 z-10 w-44 shrink-0 bg-white dark:bg-[#0B1121] p-2.5 border-r border-slate-100 dark:border-white/5 flex items-center gap-2 text-left"
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                        {emp.name?.[0] ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold truncate text-slate-800 dark:text-white">{emp.name}</p>
                        <p className="text-[9px] text-slate-400 truncate">{emp.departmentName ?? '—'}</p>
                      </div>
                    </button>
                    {daysArray.map((d) => {
                      const cell = emp.cells?.[String(d).padStart(2, '0')];
                      const isToday = d === todayDay;
                      const working = isWorkingDay(d);
                      if (!cell) {
                        return (
                          <div
                            key={d}
                            className={`w-7 h-8 shrink-0 border-r border-b border-slate-50 dark:border-white/[0.04] ${
                              !working ? 'bg-slate-100 dark:bg-white/[0.04]' : ''
                            } ${isToday ? 'ring-1 ring-inset ring-sky-400' : ''}`}
                          />
                        );
                      }
                      const t = colorFor(cell.colorKey);
                      return (
                        <div
                          key={d}
                          title={`${cell.label} — ${emp.name}, ${d}`}
                          className={`w-7 h-8 shrink-0 border-r border-b border-slate-50 dark:border-white/[0.04] flex items-center justify-center ${t.cellBg} ${isToday ? 'ring-1 ring-inset ring-sky-400' : ''}`}
                        >
                          <span className={`text-[8px] font-extrabold leading-none ${t.cellText}`}>{cell.code}</span>
                        </div>
                      );
                    })}
                    <div className="w-14 shrink-0 flex items-center justify-center border-l border-slate-50 dark:border-white/[0.04]">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{total}</span>
                    </div>
                    <div className="w-14 shrink-0 flex items-center justify-center">
                      <span className={`text-[11px] font-bold ${pct >= 8 ? 'text-red-500' : pct > 0 ? 'text-amber-500' : 'text-slate-400'}`}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ONGLET 2 — "SUR L'ANNÉE"
// Ordre : Zoom service (en haut désormais) → Tendance annuelle → Poids des
// services dans le temps → Podium annuel
// ============================================================================
function SurAnneePanel({ yearly, deptFocus, departments, focusDepartmentId, onFocusDepartment, onSelectEmployee }: any) {
  const families = Object.keys(FAMILY_META);
  // ✅ Empilé par famille plutôt qu'une seule ligne "total" — on voit
  // directement quel motif pousse la tendance vers le haut, mois par mois.
  const trendData = yearly.months.map((m: any) => {
    const row: any = { month: MONTHS[m.month - 1].slice(0, 3), explanation: m.explanation };
    for (const fam of families) row[fam] = m.byFamily?.[fam] ?? 0;
    return row;
  });

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
      {yearly.peakSummary && (
        <div className="flex items-start gap-3 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-800 rounded-2xl p-4">
          <Radar size={18} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <p className="text-sm text-sky-800 dark:text-sky-200 font-medium">{yearly.peakSummary}</p>
        </div>
      )}

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
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [`${v} j.`, CODE_LABELS[n as string] ?? n]} />
              <Legend formatter={(v: any) => CODE_LABELS[v] ?? v} />
              {focusCodes.map((c, i) => (
                <Area key={c} type="monotone" dataKey={c} stackId="1" stroke={CHART_PALETTE[i % CHART_PALETTE.length]} fill={CHART_PALETTE[i % CHART_PALETTE.length]} fillOpacity={0.5} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
        {deptFocus?.departmentName && <p className="text-xs text-slate-400 mt-2">{deptFocus.employeeCount} personne(s) — {deptFocus.departmentName}</p>}
      </ChartCard>

      <ChartCard title={`Tendance annuelle — ${yearly.year}`} subtitle="Empilée par famille de motif, pour voir ce qui explique chaque mois">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ ...TOOLTIP_STYLE, maxWidth: 240 }} formatter={(v: any, n: any) => [`${v} j.`, FAMILY_META[n as string]?.label ?? n]} />
            <Legend formatter={(v: any) => FAMILY_META[v]?.label ?? v} />
            {families.map((fam) => (
              <Area key={fam} type="monotone" dataKey={fam} stackId="1" stroke={colorFor(FAMILY_META[fam].colorKey).hex} fill={colorFor(FAMILY_META[fam].colorKey).hex} fillOpacity={0.55} />
            ))}
          </AreaChart>
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

      {yearly.leaderboardsYear && (
        <ChartCard title="Classements ciblés — année complète" subtitle="Qui, et quel service, cumule le plus par motif sur l'année">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['maladie', 'conventionnelle', 'exceptionnelle', 'injustifiee'] as const).map((key) => (
              <TargetedLeaderboard
                key={key}
                leaderboardKey={key}
                employees={yearly.leaderboardsYear?.[key] ?? []}
                departments={[]}
                onSelectEmployee={onSelectEmployee}
              />
            ))}
          </div>
        </ChartCard>
      )}

      <TopTable title={`Podium annuel — ${yearly.year}`} rows={yearly.top20Year} onSelect={onSelectEmployee} />
    </div>
  );
}

// ============================================================================
// ONGLET 3 — "COMPARER LES ANNÉES"
// ============================================================================
function ComparerPanel({ comparison }: any) {
  const families = Object.keys(FAMILY_META);
  // ✅ Barres empilées par famille — on voit directement, année par année,
  // POURQUOI le volume a bougé (plus de maladie ? plus d'exceptionnel ?),
  // pas juste que le total a changé.
  const barData = comparison.years.map((y: any) => {
    const row: any = { year: String(y.year) };
    for (const fam of families) row[fam] = y.byFamily?.[fam] ?? 0;
    return row;
  });

  return (
    <div className="space-y-5">
      <ChartCard title="Volume comparé par année" subtitle="Empilé par famille de motif — pour voir immédiatement ce qui pèse le plus, année par année">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" fontSize={12} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [`${v} j.`, FAMILY_META[n as string]?.label ?? n]} />
            <Legend formatter={(v: any) => FAMILY_META[v]?.label ?? v} />
            {families.map((fam) => (
              <Bar key={fam} dataKey={fam} name={fam} stackId="a" fill={colorFor(FAMILY_META[fam].colorKey).hex} radius={fam === families[families.length - 1] ? [8, 8, 0, 0] : [0, 0, 0, 0]} />
            ))}
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
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5">
          <h3 className="font-bold text-slate-800 dark:text-white">Détail par année</h3>
          <p className="text-xs text-slate-400 mt-0.5">Répartition par famille et motifs principaux — pour expliquer chaque total</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Année</th>
                <th className="px-4 py-2 text-right">Effectif</th>
                <th className="px-4 py-2 text-right">Jours totaux</th>
                <th className="px-4 py-2 text-right">Moy. / employé</th>
                {families.map((fam) => <th key={fam} className="px-4 py-2 text-right whitespace-nowrap">{FAMILY_META[fam].label}</th>)}
                <th className="px-4 py-2 text-left">Motifs principaux</th>
              </tr>
            </thead>
            <tbody>
              {comparison.years.map((y: any) => {
                const topCodes = Object.entries(y.byType ?? {})
                  .sort((a: any, b: any) => b[1] - a[1])
                  .slice(0, 3) as [string, number][];
                return (
                  <tr key={y.year} className="border-t border-slate-50 dark:border-white/5 align-top">
                    <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200">{y.year}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">{y.employeeCount}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">{y.totalDays} j.</td>
                    <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">{y.avgDaysPerEmployee} j.</td>
                    {families.map((fam) => (
                      <td key={fam} className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">{y.byFamily?.[fam] ?? 0}</td>
                    ))}
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {topCodes.length === 0 ? <span className="text-xs text-slate-300">—</span> : topCodes.map(([code, days]) => (
                          <span key={code} className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300 whitespace-nowrap">
                            {CODE_LABELS[code] ?? code} · {days} j.
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
          {detail.recurrence && <RecurrenceBlock recurrence={detail.recurrence} />}
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
// BLOC RÉCURRENCE — fiche employé
// ✅ Distingue le CUMUL (jours de maladie sur 12 mois) de la RÉCURRENCE
// (épisodes distincts sur 90 jours glissants) : un employé avec 8 arrêts
// d'1 jour et un employé avec 1 arrêt de 8 jours ont le même cumul, mais un
// signal RH très différent — le premier est un pattern à investiguer.
// ============================================================================
function RecurrenceBlock({ recurrence }: any) {
  const items = [
    {
      label: 'Maladie — cumul 12 mois',
      value: `${recurrence.sickDaysYear} j.`,
      threshold: `seuil ${FRONT_ALERT_THRESHOLDS.employeeSickDaysPerYear} j.`,
      alert: recurrence.alertSickDays,
      icon: Stethoscope,
      explain: 'Total des jours de maladie posés sur les 12 derniers mois.',
    },
    {
      label: 'Maladie — récurrence',
      value: `${recurrence.sickEpisodesRolling90d} épisode${recurrence.sickEpisodesRolling90d > 1 ? 's' : ''}`,
      threshold: `seuil ${FRONT_ALERT_THRESHOLDS.employeeSickEpisodesRolling90d} sur 90j`,
      alert: recurrence.alertSickRecurrence,
      icon: Radar,
      explain: 'Nombre d\u2019arrêts maladie distincts sur 90 jours glissants — un pattern répétitif, même court, mérite un échange RH.',
    },
    {
      label: 'Absentéisme global — 12 mois',
      value: `${recurrence.trackableDaysYear} j.`,
      threshold: `seuil ${FRONT_ALERT_THRESHOLDS.employeeTrackableDaysPerYear} j.`,
      alert: recurrence.alertTrackableDays,
      icon: Gauge,
      explain: 'Tout motif hors congé annuel/anticipé (maladie, exceptionnelle, sans solde, non justifiée) cumulé sur 12 mois.',
    },
  ];

  const hasAnyAlert = items.some((i) => i.alert);

  return (
    <div className={`rounded-2xl p-4 border ${hasAnyAlert ? 'bg-amber-50/60 border-amber-200 dark:bg-amber-500/5 dark:border-amber-800/40' : 'bg-slate-50 border-slate-100 dark:bg-white/[0.02] dark:border-white/5'}`}>
      <div className="flex items-center gap-2 mb-3">
        {hasAnyAlert ? <ShieldAlert size={15} className="text-amber-500" /> : <ShieldAlert size={15} className="text-slate-300" />}
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Récurrence & signaux RH</h4>
      </div>
      <div className="space-y-2.5">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.label} className={`flex items-start gap-3 p-2.5 rounded-xl ${it.alert ? 'bg-white dark:bg-[#0B1121] border border-amber-200 dark:border-amber-800/30' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${it.alert ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-400 dark:bg-white/5'}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{it.label}</span>
                  <span className={`text-xs font-extrabold ${it.alert ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>{it.value}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{it.explain}</p>
                <p className="text-[10px] text-slate-300 mt-0.5">{it.threshold}</p>
              </div>
            </div>
          );
        })}
      </div>
      {!hasAnyAlert && <p className="text-[11px] text-slate-400 mt-3">Aucun signal particulier — situation normale.</p>}
    </div>
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

function ChartCard({ title, subtitle, action, children }: any) {
  return (
    <div className="bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-white/5 rounded-2xl p-5 shadow-xl shadow-slate-200/50 dark:shadow-none">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{title}</h3>
        {action}
      </div>
      {subtitle && <p className="text-[11px] text-slate-400 mb-3">{subtitle}</p>}
      {!subtitle && <div className="mb-2" />}
      {children}
    </div>
  );
}

function EmptyChart() {
  return <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">Aucune donnée sur cette période</div>;
}

// ============================================================================
// CHRONOLOGIE DU MOIS — remplace temporairement la grille calendrier
// (jugée peu lisible). Une ligne par employé concerné, une barre par
// épisode d'absence positionnée sur l'axe du mois, motif écrit dessus.
// On y reviendra pour une version grille plus aboutie une fois le reste
// du module stabilisé.
// ============================================================================
function ChronologyPanel({ journal, year, month, daysInMonth, holidays, isWorkingDay, legend, onSelectEmployee }: any) {
  const rows = journal.journal ?? [];
  const codeDefMap = new Map<string, any>((legend ?? []).map((l: any) => [l.code, l]));
  const defFor = (code: string) => codeDefMap.get(code) ?? { colorKey: 'neutral', countsAsAbsenceDay: true };

  const byEmployee = new Map<string, { name: string; departmentName: string | null; episodes: any[] }>();
  for (const r of rows) {
    if (!defFor(r.code).countsAsAbsenceDay) continue;
    if (!byEmployee.has(r.employeeId)) byEmployee.set(r.employeeId, { name: r.employeeName, departmentName: r.departmentName, episodes: [] });
    byEmployee.get(r.employeeId)!.episodes.push(r);
  }
  const employees = Array.from(byEmployee.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name));

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, daysInMonth);
  const dayWidth = 100 / daysInMonth;

  const clampDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const clamped = d < monthStart ? monthStart : d > monthEnd ? monthEnd : d;
    return clamped.getDate();
  };

  const todayInMonth = new Date().getFullYear() === year && new Date().getMonth() + 1 === month ? new Date().getDate() : null;

  return (
    <div className="bg-white dark:bg-[#0B1121] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-white/5">
        <h3 className="font-bold text-slate-800 dark:text-white">
          Chronologie du mois
          <span className="text-sm font-normal text-slate-400 ml-2">{employees.length} personne(s) concernée(s)</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Chaque barre = une absence, motif indiqué directement dessus</p>
      </div>

      {employees.length === 0 ? (
        <div className="p-8 text-sm text-slate-400 text-center">Aucune absence à positionner ce mois-ci.</div>
      ) : (
        <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#0ea5e9 transparent' }}>
          <div className="min-w-[720px]">
            {/* Axe des jours */}
            <div className="flex border-b border-slate-100 dark:border-white/5">
              <div className="sticky left-0 z-10 w-48 shrink-0 bg-slate-50 dark:bg-white/[0.03] p-2 text-[10px] font-bold uppercase text-slate-400 border-r border-slate-100 dark:border-white/5">
                Collaborateur
              </div>
              <div className="flex-1 relative h-8">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const isHoliday = holidays?.some((h: any) => Number(h.day) === d);
                  const nonWorking = !isWorkingDay(year, month, d);
                  if (d % 5 !== 0 && d !== 1 && d !== daysInMonth) return null;
                  return (
                    <div key={d} className="absolute top-0 h-full flex flex-col items-center justify-center" style={{ left: `${(d - 1) * dayWidth}%`, width: `${dayWidth}%` }}>
                      <span className={`text-[10px] font-bold ${d === todayInMonth ? 'text-sky-600' : isHoliday ? 'text-indigo-500' : nonWorking ? 'text-slate-300' : 'text-slate-400'}`}>{d}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lignes employés */}
            <div className="divide-y divide-slate-50 dark:divide-white/5">
              {employees.map(([employeeId, emp]) => (
                <div key={employeeId} className="flex hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <div className="sticky left-0 z-10 w-48 shrink-0 bg-white dark:bg-[#0B1121] p-2.5 border-r border-slate-100 dark:border-white/5 overflow-hidden">
                    <button onClick={() => onSelectEmployee(employeeId)} title={emp.name} className="text-xs font-bold truncate text-slate-800 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 block w-full text-left">
                      {emp.name}
                    </button>
                    <p className="text-[10px] text-slate-400 truncate">{emp.departmentName || '—'}</p>
                  </div>
                  <div className="flex-1 relative py-2" style={{ minHeight: 40 }}>
                    {emp.episodes.map((ep: any, i: number) => {
                      const startDay = clampDay(ep.startDate);
                      const endDay = clampDay(ep.endDate);
                      const left = (startDay - 1) * dayWidth;
                      const width = Math.max((endDay - startDay + 1) * dayWidth, dayWidth);
                      const t = colorFor(defFor(ep.code).colorKey);
                      const start = new Date(ep.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                      const end = new Date(ep.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                      return (
                        <div
                          key={i}
                          title={`${ep.label} — du ${start} au ${end} (${ep.days} j.)${ep.reason ? ` — « ${ep.reason} »` : ''}`}
                          className={`absolute h-6 rounded-md ${t.solid} flex items-center px-1.5 overflow-hidden shadow-sm`}
                          style={{ left: `${left}%`, width: `${width}%`, top: 4 }}
                        >
                          <span className="text-[10px] font-bold text-white truncate">{ep.code}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// JOURNAL DU MOIS — replié par défaut (peut être une longue liste), avec
// un résumé toujours visible et un bouton pour dérouler le détail.
// ============================================================================
function CollapsibleJournal({ journal, onSelectEmployee }: any) {
  const [open, setOpen] = useState(false);
  const count = journal.journal?.length ?? 0;

  return (
    <div className="bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/[0.02]">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">Journal du mois <span className="text-sm font-normal text-slate-400">({count})</span></h3>
          <p className="text-xs text-slate-400 mt-0.5">{journal.summary}</p>
        </div>
        <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-slate-100 dark:border-white/5"><MonthJournal journal={journal} onSelectEmployee={onSelectEmployee} /></div>}
    </div>
  );
}

// ============================================================================
// BANDEAU D'ALERTES RH
// ✅ Calculé côté backend sur 12 mois glissants (hors congé statutaire).
//    Replié par défaut au-delà de 3 alertes de chaque catégorie pour ne pas
//    noyer le dashboard — combiné avec des badges directement sur les
//    classements/podiums concernés (cf. TargetedLeaderboard / TopTable).
// ============================================================================
function AlertsBanner({ employeeAlerts, departmentAlerts, onSelectEmployee }: any) {
  const [expanded, setExpanded] = useState(false);
  const totalCount = employeeAlerts.length + departmentAlerts.length;
  const visibleEmployeeAlerts = expanded ? employeeAlerts : employeeAlerts.slice(0, 3);
  const visibleDeptAlerts = expanded ? departmentAlerts : departmentAlerts.slice(0, 3);

  const ALERT_LABELS: Record<string, string> = {
    EMPLOYEE_SICK_DAYS: 'Cumul maladie élevé',
    EMPLOYEE_SICK_RECURRENCE: 'Maladie récurrente',
    EMPLOYEE_TRACKABLE_DAYS: 'Absentéisme global élevé',
    DEPARTMENT_ABSENTEEISM_RATE: 'Taux d\u2019absentéisme élevé',
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-800/40 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0"><ShieldAlert size={18} /></div>
          <div>
            <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm">{totalCount} signal{totalCount > 1 ? 'aux' : ''} RH à surveiller</h3>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70">Basé sur 12 mois glissants — hors congé annuel/anticipé</p>
          </div>
        </div>
        {totalCount > 3 && (
          <button onClick={() => setExpanded((e) => !e)} className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline">
            {expanded ? 'Réduire' : 'Tout voir'} <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      <div className="px-5 pb-4 flex flex-wrap gap-2">
        {visibleEmployeeAlerts.map((a: any, i: number) => (
          <button
            key={`e-${i}`}
            onClick={() => onSelectEmployee(a.employeeId)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0B1121] border border-amber-200 dark:border-amber-800/40 text-left hover:border-amber-400"
          >
            <AlertTriangle size={13} className="text-amber-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{a.employeeName}</span>
            <span className="text-[10px] text-slate-400">{ALERT_LABELS[a.type] ?? a.type}</span>
          </button>
        ))}
        {visibleDeptAlerts.map((a: any, i: number) => (
          <div
            key={`d-${i}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0B1121] border border-red-200 dark:border-red-800/40"
          >
            <Building2 size={13} className="text-red-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{a.departmentName}</span>
            <span className="text-[10px] text-red-500 font-semibold">{a.value}% d'absentéisme</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CLASSEMENT CIBLÉ PAR MOTIF (mini-podium employé + mini-classement service)
// ✅ Un bloc par famille "à tracer" (maladie, conventionnelle, exceptionnelle,
//    non justifiée) — répond directement à "qui/quel service en a le plus".
// ============================================================================
function TargetedLeaderboard({ leaderboardKey, employees, departments, alertEmployeeIds, alertDepartmentIds, onSelectEmployee }: any) {
  const meta = LEADERBOARD_META[leaderboardKey];
  const Icon = meta.icon;
  const topEmployees = employees.slice(0, 5);
  const topDepartments = departments.slice(0, 3);
  const isEmpty = topEmployees.length === 0;

  return (
    <div className="border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2.5 bg-slate-50 dark:bg-white/[0.03]">
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white shrink-0`}><Icon size={14} /></div>
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">{meta.label}</h4>
      </div>
      {isEmpty ? (
        <div className="p-4 text-xs text-slate-400 text-center">Aucun cas ce mois-ci</div>
      ) : (
        <div className="p-3 space-y-3">
          <div className="space-y-1">
            {topEmployees.map((e: any, i: number) => (
              <button key={e.employeeId} onClick={() => onSelectEmployee(e.employeeId)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] text-left">
                <span className="w-5 text-[10px] font-bold text-slate-400">{i + 1}.</span>
                <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{e.name}</span>
                {alertEmployeeIds?.has(e.employeeId) && <AlertTriangle size={12} className="text-amber-500 shrink-0" />}
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">{e.days} j.</span>
              </button>
            ))}
          </div>
          {topDepartments.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-1.5">
              {topDepartments.map((d: any) => (
                <span key={d.departmentId} className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg ${alertDepartmentIds?.has(d.departmentId) ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}>
                  {alertDepartmentIds?.has(d.departmentId) && <AlertTriangle size={10} />}
                  {d.name} · {d.days} j.
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const RANK_BADGE = [
  { bg: 'bg-gradient-to-br from-yellow-300 to-amber-500', text: 'text-white', ring: 'ring-2 ring-amber-300/60', emoji: '🥇' },
  { bg: 'bg-gradient-to-br from-slate-300 to-slate-400', text: 'text-white', ring: 'ring-2 ring-slate-300/60', emoji: '🥈' },
  { bg: 'bg-gradient-to-br from-orange-300 to-orange-500', text: 'text-white', ring: 'ring-2 ring-orange-300/60', emoji: '🥉' },
];

function TopTable({ title, rows, onSelect, alertIds }: { title: string; rows: any[]; onSelect: (id: string) => void; alertIds?: Set<string> }) {
  return (
    <div className="bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
        <Medal size={16} className="text-amber-500" />
        <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
      </div>
      {(!rows || rows.length === 0) ? <div className="p-6 text-sm text-slate-400 text-center">Aucune donnée</div> : (
        <div className="divide-y divide-slate-50 dark:divide-white/5">
          {rows.map((r: any, i: number) => {
            const badge = RANK_BADGE[i];
            return (
              <button key={r.employeeId} onClick={() => onSelect(r.employeeId)} className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] text-left">
                {badge ? (
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${badge.bg} ${badge.ring} shrink-0`}>{badge.emoji}</span>
                ) : (
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 shrink-0">{i + 1}</span>
                )}
                <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{r.name}</span>
                {alertIds?.has(r.employeeId) && <AlertTriangle size={13} className="text-amber-500 shrink-0" />}
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{r.days} j.</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}