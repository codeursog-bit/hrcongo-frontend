'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/permissions/rapport/page.tsx
// ✅ Page "Rapport" — même modèle à 3 colonnes que le rapport congés/absences
//    (gauche : légende + tableau ; centre : camemberts + courbes annuelles ;
//    droite : mini-tableau "en attente aujourd'hui" + Top 20).
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Users2, Clock } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { api } from '@/services/api';
import PresenceSubNav from '@/components/PresenceSubNav';
import PermissionsSubNav from '@/components/PermissionsSubNav';

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const MONTHS_FULL = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const TYPE_LABEL: Record<string, string> = { URGENCE: 'Urgence', MISSION: 'Mission', AUTRE: 'Autre' };
const TYPE_COLOR: Record<string, string> = { URGENCE: '#ef4444', MISSION: '#8b5cf6', AUTRE: '#6b7280' };
const DEPT_COLORS = ['#0ea5e9', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#ec4899', '#14b8a6'];

export default function PermissionsReportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [deptFilterAnnual, setDeptFilterAnnual] = useState('');
  const [top20Mode, setTop20Mode] = useState<'mois' | 'annee'>('mois');

  useEffect(() => {
    try { const stored = localStorage.getItem('user'); if (stored) setUserRole(JSON.parse(stored).role || ''); } catch {}
    (async () => {
      try { setTickets((await api.get('/permission-tickets')) || []); }
      catch (e) { console.error('Erreur chargement rapport permissions', e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  // ── "En attente aujourd'hui" (par type) — mini-tableau de droite ────────
  const pendingToday = useMemo(() => {
    const pending = tickets.filter(t => t.status === 'PENDING');
    return Object.keys(TYPE_LABEL).map(type => ({ type, label: TYPE_LABEL[type], count: pending.filter(t => t.type === type).length }));
  }, [tickets]);

  const availableYears = useMemo(() => {
    const set = new Set<number>([now.getFullYear()]);
    tickets.forEach(t => set.add(new Date(t.createdAt).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [tickets, now]);

  const departments = useMemo(() => Array.from(new Set(tickets.map(t => t.employee?.department?.name).filter(Boolean))).sort(), [tickets]);

  const monthTickets = useMemo(() => tickets.filter(t => {
    const d = new Date(t.createdAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  }), [tickets, month, year]);

  const employeesConcerned = useMemo(() => new Set(monthTickets.map(t => t.employeeId)).size, [monthTickets]);
  const monthTotal = monthTickets.length;

  const byTypeMonth = useMemo(() => {
    const map: Record<string, number> = {};
    monthTickets.forEach(t => { map[t.type] = (map[t.type] ?? 0) + 1; });
    return Object.entries(map).map(([type, nombre]) => ({ type, label: TYPE_LABEL[type] ?? type, nombre, pct: monthTotal ? Math.round((nombre / monthTotal) * 1000) / 10 : 0 }));
  }, [monthTickets, monthTotal]);

  const byDeptMonth = useMemo(() => {
    const map: Record<string, number> = {};
    monthTickets.forEach(t => { const n = t.employee?.department?.name || 'Sans département'; map[n] = (map[n] ?? 0) + 1; });
    return Object.entries(map).map(([name, nombre], i) => ({ name, nombre, pct: monthTotal ? Math.round((nombre / monthTotal) * 1000) / 10 : 0, color: DEPT_COLORS[i % DEPT_COLORS.length] }));
  }, [monthTickets, monthTotal]);

  const annualSeries = useMemo(() => MONTHS_FR.map((label, idx) => {
    const monthNum = idx + 1;
    const row: any = { mois: label };
    Object.values(TYPE_LABEL).forEach(l => { row[l] = 0; });
    tickets.filter(t => { const d = new Date(t.createdAt); return d.getFullYear() === year && d.getMonth() + 1 === monthNum; })
      .forEach(t => { row[TYPE_LABEL[t.type] ?? t.type] += 1; });
    return row;
  }), [tickets, year]);

  const annualSeriesByDept = useMemo(() => MONTHS_FR.map((label, idx) => {
    const monthNum = idx + 1;
    const nombre = tickets.filter(t => {
      const d = new Date(t.createdAt);
      return d.getFullYear() === year && d.getMonth() + 1 === monthNum && (!deptFilterAnnual || t.employee?.department?.name === deptFilterAnnual);
    }).length;
    return { mois: label, Tickets: nombre };
  }), [tickets, year, deptFilterAnnual]);

  const top20 = useMemo(() => {
    const source = top20Mode === 'mois' ? monthTickets : tickets.filter(t => new Date(t.createdAt).getFullYear() === year);
    const map = new Map<string, { name: string; nombre: number }>();
    source.forEach(t => {
      const key = t.employeeId;
      const name = `${t.employee?.firstName ?? ''} ${t.employee?.lastName ?? ''}`.trim() || '—';
      const entry = map.get(key) ?? { name, nombre: 0 };
      entry.nombre += 1;
      map.set(key, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.nombre - a.nombre).slice(0, 20);
  }, [monthTickets, tickets, top20Mode, year]);

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;

  return (
    <div className="max-w-[1600px] mx-auto pb-24 space-y-6">
      <PresenceSubNav userRole={userRole} />
      <PermissionsSubNav userRole={userRole} />
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Rapport — Permissions</h1>
        <p className="text-sm text-gray-500">Vue d'ensemble mensuelle et annuelle des tickets de permission.</p>
      </div>

      {/* ══════════════════ ONGLETS MOIS ══════════════════ */}
      <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {MONTHS_FR.map((m, i) => (
          <button key={m} onClick={() => setMonth(i + 1)} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${month === i + 1 ? 'bg-sky-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {m}
          </button>
        ))}
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="ml-1 text-xs px-2 rounded-lg border-0 bg-white dark:bg-gray-700 font-bold text-gray-600 dark:text-gray-300">
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* ══════════════════ 3 COLONNES : GAUCHE / CENTRE / DROITE ══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── GAUCHE ── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{MONTHS_FULL[month - 1]} {year}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{employeesConcerned}</p>
            <p className="text-xs text-gray-400">employé(s) avec un ticket ce mois</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Légende</p>
            <div className="space-y-2">
              {Object.entries(TYPE_LABEL).map(([type, label]) => (
                <div key={type} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: TYPE_COLOR[type] }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-400 uppercase">Type</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-400 uppercase">Nb</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-400 uppercase">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {byTypeMonth.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-6 text-gray-400 text-xs">Aucun ticket ce mois-ci.</td></tr>
                ) : byTypeMonth.map(t => (
                  <tr key={t.type}>
                    <td className="px-3 py-2 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: TYPE_COLOR[t.type] }} />{t.label}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800 dark:text-gray-100">{t.nombre}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{t.pct}%</td>
                  </tr>
                ))}
                {byTypeMonth.length > 0 && (
                  <tr className="bg-gray-50 dark:bg-gray-900 font-bold">
                    <td className="px-3 py-2">Total</td>
                    <td className="px-3 py-2 text-right">{monthTotal}</td>
                    <td className="px-3 py-2 text-right">100%</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── CENTRE ── */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Répartition des tickets par type — {MONTHS_FULL[month - 1]}</p>
            {byTypeMonth.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={byTypeMonth} dataKey="nombre" nameKey="label" outerRadius={90} label={(d: any) => `${d.pct}%`}>
                    {byTypeMonth.map((t, i) => <Cell key={i} fill={TYPE_COLOR[t.type]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Répartition par département — {MONTHS_FULL[month - 1]}</p>
            {byDeptMonth.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={byDeptMonth} dataKey="nombre" nameKey="name" innerRadius={50} outerRadius={90} label={(d: any) => `${d.pct}%`}>
                    {byDeptMonth.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Vue annuelle des tickets — tous les employés ({year})</p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={annualSeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="mois" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Legend />
                {Object.values(TYPE_LABEL).map((label, i) => (
                  <Area key={label} type="monotone" dataKey={label} stackId="1" stroke={Object.values(TYPE_COLOR)[i]} fill={Object.values(TYPE_COLOR)[i]} fillOpacity={0.55} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Vue annuelle — par département ({year})</p>
              <select value={deptFilterAnnual} onChange={e => setDeptFilterAnnual(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                <option value="">Tous les départements</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={annualSeriesByDept}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="mois" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Tickets" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.35} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── DROITE : en attente aujourd'hui + Top 20 ── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <Clock size={13} className="text-amber-500" />
              <p className="text-xs font-bold text-gray-700 dark:text-gray-200">En attente aujourd'hui</p>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {pendingToday.map(p => (
                  <tr key={p.type}>
                    <td className="px-3 py-2 flex items-center gap-2 text-gray-600 dark:text-gray-300"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: TYPE_COLOR[p.type] }} />{p.label}</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-white">{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5"><Users2 size={13} /> Top 20</p>
              <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-900 p-0.5 rounded-md">
                <button onClick={() => setTop20Mode('mois')} className={`px-2 py-0.5 rounded text-[10px] font-semibold ${top20Mode === 'mois' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`}>Mois</button>
                <button onClick={() => setTop20Mode('annee')} className={`px-2 py-0.5 rounded text-[10px] font-semibold ${top20Mode === 'annee' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`}>Annuel</button>
              </div>
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {top20.length === 0 ? (
                    <tr><td className="text-center py-8 text-gray-400">Aucune donnée.</td></tr>
                  ) : top20.map((e, i) => (
                    <tr key={e.name + i}>
                      <td className="px-3 py-1.5 text-gray-400 font-semibold w-6">{i + 1}</td>
                      <td className="px-1 py-1.5 font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[110px]">{e.name}</td>
                      <td className="px-3 py-1.5 text-right font-bold text-gray-900 dark:text-white">{e.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">Aucune donnée pour cette période.</div>;
}