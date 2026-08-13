'use client';

// ============================================================================
// 📁 app/(dashboard)/absences-employe/page.tsx
// ✅ PAGE UNIQUE ET CONSOLIDÉE — remplace conges/analyse, rapports/absences,
//    rapports/observatoire-conges et presences/absences/suivi (à supprimer).
//    Tout est ici : congé annuel, congé anticipé, maladie, maternité,
//    paternité, mariage, décès, naissance, non justifiée — plus aucune
//    séparation par scope, tout est chargé avec scope="all" (comportement
//    par défaut du backend, donc aucun paramètre à envoyer).
//    Rendu repris du prototype validé (donuts, cartes KPI, onglets par mois,
//    grille à badges colorés) — 100% branché sur /absence-tracking/*.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  Loader2, Users, AlertTriangle, TrendingUp, CalendarClock, ListChecks,
  Percent, ChevronLeft, ChevronRight, Stethoscope, FileCheck2, FileX2, Trophy,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend as RLegend,
} from 'recharts';
import { api } from '@/services/api';
import SlideOver from '@/components/SlideOver';
import { colorFor, LEADERBOARD_LABELS } from '@/components/absences/absenceColors';

const MONTHS = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];
const MONTHS_FULL = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const WEEKDAY_ABBR = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const YEAR_PALETTE = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
const DEPT_PALETTE = ['#ec4899', '#f59e0b', '#3b82f6', '#10b981', '#22d3ee', '#8b5cf6', '#f97316', '#f43f5e', '#14b8a6', '#a78bfa'];

type Tab = 'dashboard' | 'grille' | 'journal' | 'comparatif';
type LeaderboardKey = 'maladie' | 'conventionnelle' | 'exceptionnelle' | 'injustifiee';

export default function AbsencesEmployePage() {
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
    <div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Absences employés</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Congés, maladie, maternité, paternité, mariage, décès, naissance, non justifiée — tout au même endroit.</p>
      </div>

      {/* mois + année */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {MONTHS.map((m, i) => (
            <button
              key={m}
              onClick={() => setMonth(i + 1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${month === i + 1 ? 'bg-sky-500 border-sky-500 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-sky-300'}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {([
              ['dashboard', 'Tableau de bord'],
              ['grille', 'Grille mensuelle'],
              ['journal', 'Journal'],
              ['comparatif', 'Comparatif'],
            ] as [Tab, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === key ? 'bg-sky-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-2 py-1.5">
            <button onClick={() => setYear(y => y - 1)} className="p-1 text-gray-500"><ChevronLeft size={14} /></button>
            <span className="text-xs font-bold px-1">{year}</span>
            <button onClick={() => setYear(y => y + 1)} className="p-1 text-gray-500"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {tab === 'dashboard' && <DashboardTab year={year} month={month} shiftMonth={shiftMonth} />}
      {tab === 'grille' && <GrilleTab year={year} month={month} shiftMonth={shiftMonth} />}
      {tab === 'journal' && <JournalTab year={year} month={month} />}
      {tab === 'comparatif' && <ComparatifTab anchorYear={year} />}
    </div>
  );
}

function qs(params: Record<string, string | number | undefined>) {
  const parts = Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}=${v}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

// ============================================================================
// ONGLET 1 — TABLEAU DE BORD (donuts + KPI + vue annuelle + top scores)
// ============================================================================
function DashboardTab({ year, month }: { year: number; month: number; shiftMonth: (d: number) => void }) {
  const [data, setData] = useState<any>(null);
  const [yearOverview, setYearOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardKey, setLeaderboardKey] = useState<LeaderboardKey>('maladie');
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get(`/absence-tracking/dashboard${qs({ year, month })}`),
      api.get(`/absence-tracking/yearly-overview${qs({ year })}`),
    ])
      .then(([d, y]) => { setData(d); setYearOverview(y); })
      .catch(e => { console.error('Erreur chargement tableau de bord absences', e); setData(null); })
      .finally(() => setIsLoading(false));
  }, [year, month]);

  if (isLoading) return <LoadingBlock />;
  if (!data) return <ErrorBlock />;

  const absentTodayTotal: number = Object.values(data.absentToday as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
  const totalAbsenceDays = data.byType.reduce((s: number, t: any) => s + t.days, 0);
  const trackableDays = data.byType.filter((t: any) => t.trackable).reduce((s: number, t: any) => s + t.days, 0);

  const typeDonut = [...data.byType].sort((a: any, b: any) => b.days - a.days).map((t: any) => ({
    name: t.label, value: t.days, color: colorFor(t.colorKey).hex,
    pct: totalAbsenceDays ? Math.round((t.days / totalAbsenceDays) * 1000) / 10 : 0,
  }));
  const deptTotal = data.byDepartment.reduce((s: number, d: any) => s + d.days, 0) || 1;
  const deptDonut = [...data.byDepartment].sort((a: any, b: any) => b.days - a.days).map((d: any, i: number) => ({
    name: d.name, value: d.days, color: DEPT_PALETTE[i % DEPT_PALETTE.length],
    pct: Math.round((d.days / deptTotal) * 1000) / 10,
  }));
  const annualSeries = (yearOverview?.months ?? []).map((m: any) => ({ mois: MONTHS_FR[m.month - 1], total: m.totalDays, isCurrent: m.month === month }));

  const trackableTotal = data.byType.filter((t: any) => t.trackable).reduce((s: number, t: any) => s + t.days, 0) || 1;
  const trackableDonut = [...data.byType].filter((t: any) => t.trackable).sort((a: any, b: any) => b.days - a.days).map((t: any) => ({
    name: t.label, value: t.days, color: colorFor(t.colorKey).hex,
    pct: Math.round((t.days / trackableTotal) * 1000) / 10,
  }));
  const topMotif = trackableDonut[0];
  // Département le plus concerné — même filtre "hors congé statutaire/férié/présence"
  // que le donut, via la ventilation par famille déjà fournie par département.
  const EXCLUDED_FAMILIES = ['CONGE_STATUTAIRE', 'FERIE', 'PRESENCE'];
  const deptTrackable = data.byDepartment
    .map((d: any) => ({
      name: d.name,
      days: (d.byFamily ?? []).filter((f: any) => !EXCLUDED_FAMILIES.includes(f.family)).reduce((s: number, f: any) => s + f.days, 0),
    }))
    .filter((d: any) => d.days > 0)
    .sort((a: any, b: any) => b.days - a.days);
  const topDept = deptTrackable[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} label={`${MONTHS_FULL[month - 1]} ${year}`} value={String(data.employeeCount)} sub="employé(s) suivis" tone="sky" />
        <KpiCard icon={AlertTriangle} label="Absents aujourd'hui" value={String(absentTodayTotal)} sub={`sur ${data.employeeCount}`} tone="rose" />
        <KpiCard icon={TrendingUp} label="Jours d'absence" value={String(totalAbsenceDays)} sub="cumulés ce mois" tone="amber" />
        <KpiCard icon={Trophy} label="Le plus concerné" value={data.top20Month[0]?.name?.split(' ')[0] ?? '—'} sub={data.top20Month[0] ? `${data.top20Month[0].days} jour(s) d'absence` : '—'} tone="violet" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={ListChecks} label="Jours à surveiller" value={String(trackableDays)} sub="hors congé statutaire" tone="violet" small />
        <KpiCard icon={Percent} label="Taux d'absentéisme" value={`${data.absenteeismRatePercent}%`} sub="jours ouvrés × effectif" tone="rose" small />
        <KpiCard icon={CalendarClock} label="Jours ouvrés" value={String(data.workingDaysInMonth)} sub="dans le mois" tone="sky" small />
      </div>

      {/* absences à surveiller : uniquement les motifs qui comptent pour le suivi RH
          (maladie, maternité, paternité, mariage, décès, naissance, non justifiée,
          congé sans solde) — le congé annuel/anticipé (droit acquis) en est
          volontairement exclu, ce n'est pas un sujet de suivi RH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Absences à surveiller par catégorie — {MONTHS_FULL[month - 1]}</p>
          <p className="text-[11px] text-gray-400 mb-4">Hors congé annuel/anticipé (droit acquis, pas un sujet RH)</p>
          {trackableDonut.length === 0 ? <EmptyLine /> : (
            <div className="flex items-center gap-5">
              <div className="w-[130px] h-[130px] relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={trackableDonut} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={2} stroke="none">
                      {trackableDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any, n: any) => [`${v} j`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base font-bold text-gray-900 dark:text-white">{trackableTotal}</span>
                  <span className="text-[8.5px] text-gray-400 text-center max-w-[55px]">jours à surveiller</span>
                </div>
              </div>
              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                {trackableDonut.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: d.color }} />
                    <span className="text-gray-500 dark:text-gray-400 flex-1 truncate">{d.name}</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Motif dominant</p>
            {topMotif ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: topMotif.color }} />
                  <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{topMotif.name}</span>
                </div>
                <p className="text-xs text-gray-400">{topMotif.value} j · {topMotif.pct}% des absences suivies</p>
              </>
            ) : <EmptyLine />}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Département le plus concerné</p>
            {topDept ? (
              <>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{topDept.name}</p>
                <p className="text-xs text-gray-400">{topDept.days} j à surveiller ce mois</p>
              </>
            ) : <EmptyLine />}
          </div>
        </div>
      </div>

      {/* deux donuts, comme la maquette */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutCard title={`Répartition des absences par type — ${MONTHS_FULL[month - 1]}`} data={typeDonut} centerLabel="jours d'absence" centerValue={totalAbsenceDays} />
        <DonutCard title={`Répartition par département — ${MONTHS_FULL[month - 1]}`} data={deptDonut} centerLabel="jours cumulés" centerValue={deptTotal} />
      </div>

      {/* classement par motif */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Classement par motif — qui, quel département</p>
          <select value={leaderboardKey} onChange={e => setLeaderboardKey(e.target.value as LeaderboardKey)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900">
            {Object.entries(LEADERBOARD_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Top employés</p>
            {data.leaderboards[leaderboardKey].length === 0 ? <EmptyLine /> : data.leaderboards[leaderboardKey].map((e: any, i: number) => (
              <button key={e.employeeId} onClick={() => setDetailEmployeeId(e.employeeId)} className="w-full flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg px-1">
                <RankBadge i={i} />
                <span className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{e.name}</p>
                  {e.departmentName && <p className="text-[11px] text-gray-400">{e.departmentName}</p>}
                </span>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{e.days} j</span>
              </button>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Top départements</p>
            {data.departmentLeaderboards[leaderboardKey].length === 0 ? <EmptyLine /> : data.departmentLeaderboards[leaderboardKey].map((d: any) => {
              const max = data.departmentLeaderboards[leaderboardKey][0]?.days || 1;
              return (
                <div key={d.departmentId} className="py-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{d.name}</span>
                    <span className="font-bold text-gray-700 dark:text-gray-200">{d.days} j</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${(d.days / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* vue annuelle + top scores, comme la maquette */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Vue annuelle des jours d&apos;absence — tous les employés</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={annualSeries} barSize={18}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="mois" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip formatter={(v: any) => [`${v} j`, 'Absences']} />
              <Bar dataKey="total" radius={[5, 5, 0, 0]}>
                {annualSeries.map((d: any, i: number) => <Cell key={i} fill={d.isCurrent ? '#0ea5e9' : '#0ea5e955'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Top scores d&apos;absences</p>
            <span className="text-xs text-gray-400">{MONTHS_FULL[month - 1]}</span>
          </div>
          <div className="space-y-0.5 max-h-[260px] overflow-y-auto">
            {data.top20Month.length === 0 ? <EmptyLine /> : data.top20Month.map((e: any, i: number) => (
              <button key={e.employeeId} onClick={() => setDetailEmployeeId(e.employeeId)} className="w-full flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg px-1">
                <RankBadge i={i} />
                <span className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{e.name}</p>
                  {e.departmentName && <p className="text-[11px] text-gray-400">{e.departmentName}</p>}
                </span>
                <span className={`text-sm font-bold ${e.days > 6 ? 'text-rose-500' : e.days > 2 ? 'text-amber-500' : 'text-gray-400'}`}>{e.days}j</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <EmployeeDetailSlideOver employeeId={detailEmployeeId} year={year} month={month} onClose={() => setDetailEmployeeId(null)} />
    </div>
  );
}

// ============================================================================
// ONGLET 2 — GRILLE MENSUELLE (badges colorés, comme la maquette)
// ============================================================================
function GrilleTab({ year, month }: { year: number; month: number; shiftMonth: (d: number) => void }) {
  const today = useMemo(() => new Date(), []);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('');
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    api.get(`/absence-tracking/grid${qs({ year, month })}`)
      .then(setData)
      .catch(e => { console.error('Erreur chargement grille absences', e); setData(null); })
      .finally(() => setIsLoading(false));
  }, [year, month]);

  const departments = useMemo(() => Array.from(new Set((data?.employees ?? []).map((e: any) => e.departmentName).filter(Boolean))).sort() as string[], [data]);
  const filteredEmployees = useMemo(() => !deptFilter ? (data?.employees ?? []) : (data?.employees ?? []).filter((e: any) => e.departmentName === deptFilter), [data, deptFilter]);

  if (isLoading) return <LoadingBlock />;
  if (!data) return <ErrorBlock />;

  const days = Array.from({ length: data.daysInMonth }, (_, i) => i + 1);
  const holidayByDay = new Map(data.holidays.map((h: any) => [h.day, h.name]));
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const currentDay = isCurrentMonth ? today.getDate() : null;
  const workingDaysCount = days.filter(d => {
    const wd = new Date(year, month - 1, d).getDay();
    return wd !== 0 && wd !== 6 && !holidayByDay.has(String(d).padStart(2, '0'));
  }).length;
  const getDayName = (d: number) => new Date(year, month - 1, d).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3).toUpperCase();

  return (
    <div className="space-y-4">
      {/* bandeau "aujourd'hui", identique au module Présences */}
      {currentDay && (
        <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
          <div className="flex-1">
            <p className="text-sm text-sky-700 dark:text-sky-300">
              📅 <strong>Aujourd&apos;hui :</strong> {currentDay} {MONTHS_FULL[month - 1]} {year}
            </p>
            <p className="text-xs text-sky-600 dark:text-sky-400 mt-1">
              Jours ouvrables : {workingDaysCount} ce mois-ci
            </p>
          </div>
        </div>
      )}

      {/* légende — blocs de couleur pleine, comme le module Présences */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Légende</h4>
        <div className="flex flex-wrap gap-4">
          {data.legend.map((l: any) => {
            const c = colorFor(l.colorKey);
            return (
              <div key={l.code} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded" style={{ background: c.hex }} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{l.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* grille */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[600px]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Grille mensuelle
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({workingDaysCount} jours ouvrables / {data.daysInMonth} jours au total)
            </span>
          </h3>
          {departments.length > 0 && (
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900">
              <option value="">Tous les départements</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="flex items-center justify-center py-32 text-gray-400 dark:text-gray-600">
            <p className="text-sm">Aucun employé à afficher.</p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#0ea5e9 transparent' }}>
            <div className="inline-block min-w-full align-middle">
              {/* en-tête jours */}
              <div className="border-b border-gray-200 dark:border-gray-700 flex">
                <div className="sticky left-0 z-20 w-48 shrink-0 bg-gray-100 dark:bg-gray-800 p-3 font-bold text-xs uppercase border-r text-gray-500">
                  Employé
                </div>
                {days.map(d => {
                  const isToday = d === currentDay;
                  const wd = new Date(year, month - 1, d).getDay();
                  const isWorking = wd !== 0 && wd !== 6;
                  const holidayName = holidayByDay.get(String(d).padStart(2, '0')) as string | undefined;
                  return (
                    <div key={d} title={holidayName ?? ''} className={`w-10 shrink-0 text-center p-2 border-r ${
                      isToday ? 'bg-sky-100 dark:bg-sky-900/50'
                      : !isWorking || holidayName ? 'bg-gray-300 dark:bg-gray-700'
                      : 'bg-gray-50 dark:bg-gray-800'
                    }`}>
                      <div className={`text-[10px] font-bold ${isToday ? 'text-sky-600 dark:text-sky-400' : !isWorking || holidayName ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                        {getDayName(d)}
                      </div>
                      <div className={`text-xs font-bold ${isToday ? 'text-sky-600 dark:text-sky-400' : !isWorking || holidayName ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                        {d}
                      </div>
                      {isToday && <div className="w-1.5 h-1.5 bg-sky-500 rounded-full mx-auto mt-0.5" />}
                    </div>
                  );
                })}
              </div>

              {/* lignes employés */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredEmployees.map((emp: any) => (
                  <div key={emp.id} className="flex hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <button onClick={() => setDetailEmployeeId(emp.id)} className="sticky left-0 z-10 w-48 shrink-0 bg-white dark:bg-gray-800 p-3 border-r flex items-center gap-3 text-left hover:text-sky-600">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                        {emp.name?.[0] ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate text-gray-900 dark:text-white">{emp.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{emp.departmentName || '—'}</p>
                      </div>
                    </button>
                    {days.map(d => {
                      const dayStr = String(d).padStart(2, '0');
                      const cell = emp.cells[dayStr];
                      const c = cell ? colorFor(cell.colorKey) : null;
                      const isToday = d === currentDay;
                      const wd = new Date(year, month - 1, d).getDay();
                      const isWorking = wd !== 0 && wd !== 6;
                      const holidayName = holidayByDay.get(dayStr) as string | undefined;
                      return (
                        <div
                          key={d}
                          title={cell?.label ?? (holidayName || (!isWorking ? 'Jour non ouvrable' : ''))}
                          className={`w-10 shrink-0 min-h-[32px] border-b border-r border-gray-100 dark:border-gray-800 ${isToday ? 'ring-2 ring-sky-500 ring-inset' : ''} ${!cell && (!isWorking || holidayName) ? 'bg-gray-300 dark:bg-gray-700' : ''}`}
                          style={cell ? { background: c!.hex } : undefined}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <EmployeeDetailSlideOver employeeId={detailEmployeeId} year={year} month={month} onClose={() => setDetailEmployeeId(null)} />
    </div>
  );
}

// ============================================================================
// ONGLET 3 — JOURNAL DÉTAILLÉ
// ============================================================================
function JournalTab({ year, month }: { year: number; month: number }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [familyFilter, setFamilyFilter] = useState('');
  const [paidFilter, setPaidFilter] = useState('');

  useEffect(() => {
    setIsLoading(true);
    api.get(`/absence-tracking/month-journal${qs({ year, month })}`)
      .then(setData)
      .catch(e => { console.error('Erreur chargement journal absences', e); setData(null); })
      .finally(() => setIsLoading(false));
  }, [year, month]);

  const families = useMemo(() => Array.from(new Set((data?.journal ?? []).map((j: any) => j.familyLabel))) as string[], [data]);
  const filtered = useMemo(() => (data?.journal ?? []).filter((j: any) =>
    (!familyFilter || j.familyLabel === familyFilter) &&
    (!paidFilter || (paidFilter === 'paid' ? j.paid : !j.paid)),
  ), [data, familyFilter, paidFilter]);

  if (isLoading) return <LoadingBlock />;
  if (!data) return <ErrorBlock />;

  return (
    <div className="space-y-6">
      <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/40 rounded-2xl p-4">
        <p className="text-sm text-sky-800 dark:text-sky-200">{data.summary}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 flex-wrap gap-2">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Journal — {MONTHS_FULL[month - 1]} {year}</p>
          <div className="flex gap-2">
            <select value={familyFilter} onChange={e => setFamilyFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900">
              <option value="">Toutes catégories</option>
              {families.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={paidFilter} onChange={e => setPaidFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900">
              <option value="">Payé et non payé</option>
              <option value="paid">Payé</option>
              <option value="unpaid">Non payé</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>{['Employé', 'Motif', 'Catégorie', 'Période', 'Durée', 'Paie', 'Détail'].map(h => <th key={h} className="px-3 py-2 text-left text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Aucune absence pour ce filtre.</td></tr>
              ) : filtered.map((j: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{j.employeeName}</p>
                    {j.departmentName && <p className="text-[11px] text-gray-400">{j.departmentName}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{j.label}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{j.familyLabel}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(j.startDate).toLocaleDateString('fr-FR')} → {new Date(j.endDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-3 py-2.5 font-bold text-gray-800 dark:text-gray-100">{j.days} j</td>
                  <td className="px-3 py-2.5">
                    {j.family === 'CONGE_STATUTAIRE' && !j.trackable ? (
                      // ✅ Congé annuel/anticipé = droit acquis, toujours payé par définition —
                      // afficher un badge "Payé" ici serait trivial et sans intérêt. Seul le cas
                      // "congé payé travaillé" (CPT, visible dans la grille) a une info à donner.
                      <span className="text-[11px] text-gray-400">Droit acquis</span>
                    ) : j.paid ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold"><FileCheck2 size={13} /> Payé</span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-500 text-xs font-semibold"><FileX2 size={13} /> Non payé</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 text-xs max-w-[220px] truncate" title={j.reason ?? ''}>{j.reason ?? '—'}</td>
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
function ComparatifTab({ anchorYear }: { anchorYear: number }) {
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
      api.get(`/absence-tracking/compare${qs({ years: sortedAsc.join(',') })}`),
      Promise.all(sortedAsc.map(y => api.get(`/absence-tracking/yearly-overview${qs({ year: y })}`))),
    ])
      .then(([cmp, yearlies]: [any, any[]]) => {
        setCompareData(cmp);
        const map: Record<number, any[]> = {};
        yearlies.forEach((yy, i) => { map[sortedAsc[i]] = yy.months; });
        setMonthlyByYear(map);
      })
      .catch(e => { console.error('Erreur chargement comparatif absences', e); setCompareData(null); })
      .finally(() => setIsLoading(false));
  }, [sortedAsc.join(',')]);

  const yearColor = (y: number) => YEAR_PALETTE[sortedDesc.indexOf(y) % YEAR_PALETTE.length];

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
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
        <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Comparer plusieurs années</p>
        <div className="flex flex-wrap gap-2">
          {candidateYears.map(y => {
            const active = selectedYears.includes(y);
            return (
              <button key={y} onClick={() => toggleYear(y)} className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${active ? 'text-white border-transparent' : 'text-gray-500 border-gray-200 dark:border-gray-700'}`} style={active ? { background: yearColor(y) } : {}}>
                {y}
              </button>
            );
          })}
        </div>
      </div>

      {sortedAsc.length < 2 ? (
        <div className="text-center py-10 text-gray-400 text-sm">Sélectionne au moins 2 années pour comparer.</div>
      ) : isLoading || !compareData ? <LoadingBlock /> : (
        <>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compareData.years.length}, minmax(0, 1fr))` }}>
            {compareData.years.map((y: any) => {
              const t = compareData.trend.find((d: any) => d.year === y.year);
              return (
                <div key={y.year} className="bg-white dark:bg-gray-800 rounded-2xl border p-4" style={{ borderColor: `${yearColor(y.year)}55` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: yearColor(y.year) }}>{y.year}</span>
                    {t?.deltaPercent != null && (
                      <span className={`text-[10px] font-bold ${t.deltaDays > 0 ? 'text-rose-500' : t.deltaDays < 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                        {t.deltaDays === 0 ? '=' : `${t.deltaDays > 0 ? '▲' : '▼'} ${Math.abs(t.deltaPercent)}%`}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{y.totalDays} <span className="text-sm font-medium text-gray-400">jours</span></p>
                  <p className="text-xs text-gray-400 mt-1">{y.employeeCount} employés · {y.avgDaysPerEmployee} j/employé</p>
                  <p className="text-xs text-violet-500 mt-1">{y.trackableDays} j à surveiller</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Évolution mensuelle — comparaison</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="mois" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <RLegend />
                {sortedAsc.map(y => <Line key={y} type="monotone" dataKey={String(y)} name={String(y)} stroke={yearColor(y)} strokeWidth={2.5} dot={{ r: 2.5 }} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Par département — comparaison</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptRows.map(r => ({ department: r.label, ...Object.fromEntries(sortedAsc.map(y => [String(y), r.values[y] ?? 0])) }))} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="department" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <RLegend />
                {sortedAsc.map(y => <Bar key={y} dataKey={String(y)} name={String(y)} fill={yearColor(y)} radius={[4, 4, 0, 0]} />)}
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              <CompareTable rows={deptRows} years={sortedDesc} label="Département" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Par catégorie de motif — comparaison précise</p>
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700">
            <th className="text-left px-2 py-2 text-[10px] font-bold text-gray-400 uppercase">{label}</th>
            {years.map(y => <th key={y} className="text-right px-2 py-2 text-[10px] font-bold text-gray-400 uppercase">{y}</th>)}
            {years.length > 1 && <th className="text-right px-2 py-2 text-[10px] font-bold text-gray-400 uppercase">Var. {oldest}→{newest}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const oldVal = r.values[oldest] ?? 0, newVal = r.values[newest] ?? 0;
            const delta = newVal - oldVal;
            const pct = oldVal ? Math.round((delta / oldVal) * 1000) / 10 : (newVal > 0 ? 100 : 0);
            return (
              <tr key={r.label} className="border-b border-gray-50 dark:border-gray-700/50">
                <td className="px-2 py-2 font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">{r.label}</td>
                {years.map(y => <td key={y} className="text-right px-2 py-2 text-gray-500">{r.values[y] ?? 0} j</td>)}
                {years.length > 1 && (
                  <td className={`text-right px-2 py-2 font-bold ${delta > 0 ? 'text-rose-500' : delta < 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
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
// PANNEAU DÉTAIL EMPLOYÉ
// ============================================================================
function EmployeeDetailSlideOver({ employeeId, year, month, onClose }: { employeeId: string | null; year: number; month: number; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!employeeId) { setData(null); return; }
    setIsLoading(true);
    api.get(`/absence-tracking/employee/${employeeId}${qs({ year, month })}`)
      .then(setData)
      .catch(e => { console.error('Erreur chargement détail employé', e); setData(null); })
      .finally(() => setIsLoading(false));
  }, [employeeId, year, month]);

  return (
    <SlideOver open={!!employeeId} onClose={onClose} title={data?.employee?.name ?? '…'} subtitle={data?.employee?.departmentName}>
      {isLoading || !data ? <LoadingBlock /> : (
        <div className="space-y-5">
          {(data.recurrence.alertSickRecurrence || data.recurrence.alertSickDays || data.recurrence.alertTrackableDays) && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3 space-y-1">
              {data.recurrence.alertSickRecurrence && <p className="text-xs text-rose-700 dark:text-rose-300 flex items-center gap-1.5"><Stethoscope size={13} /> {data.recurrence.sickEpisodesRolling90d} épisodes de maladie distincts sur 90 jours</p>}
              {data.recurrence.alertSickDays && <p className="text-xs text-rose-700 dark:text-rose-300">{data.recurrence.sickDaysYear} jours de maladie sur l&apos;année</p>}
              {data.recurrence.alertTrackableDays && <p className="text-xs text-rose-700 dark:text-rose-300">{data.recurrence.trackableDaysYear} jours d&apos;absence à surveiller sur l&apos;année</p>}
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Répartition — {MONTHS_FULL[month - 1]}</p>
            {data.pieByType.length === 0 ? <EmptyLine /> : (
              <div className="space-y-2">
                {data.pieByType.map((t: any) => {
                  const c = colorFor(t.colorKey);
                  return (
                    <div key={t.code} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: c.hex }} />
                      <span className="flex-1 text-gray-700 dark:text-gray-200">{t.label}</span>
                      <span className="font-bold text-gray-800 dark:text-gray-100">{t.days} j</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Vue annuelle {year}</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.yearOverview.map((m: any) => ({ mois: MONTHS_FR[m.month - 1], jours: m.totalDays }))}>
                <XAxis dataKey="mois" fontSize={10} />
                <YAxis fontSize={10} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="jours" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
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
function DonutCard({ title, data, centerLabel, centerValue }: { title: string; data: { name: string; value: number; color: string; pct: number }[]; centerLabel: string; centerValue: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">{title}</p>
      {data.length === 0 ? <EmptyLine /> : (
        <div className="flex items-center gap-5">
          <div className="w-[150px] h-[150px] relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2} stroke="none">
                  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [`${v} j`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{centerValue}</span>
              <span className="text-[9px] text-gray-400 text-center max-w-[60px]">{centerLabel}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: d.color }} />
                <span className="text-gray-500 dark:text-gray-400 flex-1 truncate">{d.name}</span>
                <span className="font-bold text-gray-800 dark:text-gray-100">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RankBadge({ i }: { i: number }) {
  return (
    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${i === 0 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
      {i + 1}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, sub, tone, small }: { icon: any; label: string; value: string; sub?: string; tone: 'sky' | 'rose' | 'amber' | 'violet'; small?: boolean }) {
  const cls: Record<string, string> = {
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cls[tone]}`}><Icon size={18} /></div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`${small ? 'text-base' : 'text-lg'} font-bold text-gray-900 dark:text-white truncate`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function LoadingBlock() {
  return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={32} /></div>;
}
function ErrorBlock() {
  return <div className="text-center py-20 text-gray-400 text-sm">Impossible de charger ces données pour le moment.</div>;
}
function EmptyLine() {
  return <p className="text-xs text-gray-400 py-2">Aucune donnée pour cette période.</p>;
}