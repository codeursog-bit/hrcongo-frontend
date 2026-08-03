'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/rapport/page.tsx
// ✅ Page "Rapport" — même modèle de tableau de bord que les rapports
//    congés/absences (onglets mois, camemberts, courbe annuelle, top 20),
//    mais pour les prêts/avances/retenues — avec le style et les couleurs de
//    l'app (pas ceux du fichier Excel).
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Users2 } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { api } from '@/services/api';
import FinanceSubNav from '@/components/FinanceSubNav';

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const MONTHS_FULL = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const TYPE_LABEL: Record<string, string> = { ARGENT: 'Prêt argent', MARCHANDISE: 'Marchandise', AUTRE: 'Autre prêt', AVANCE: 'Avance sur salaire' };
// Palette de l'app (sky / emerald / amber / violet / rose) — pas les couleurs du fichier Excel
const TYPE_COLOR: Record<string, string> = { ARGENT: '#0ea5e9', MARCHANDISE: '#8b5cf6', AUTRE: '#f59e0b', AVANCE: '#10b981' };
const DEPT_COLORS = ['#0ea5e9', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#ec4899', '#14b8a6'];
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';

export default function LoansReportPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
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
      try {
        const [l, a]: any = await Promise.all([api.get('/loans'), api.get('/loans/advances')]);
        setLoans(l || []); setAdvances(a || []);
      } catch (e) { console.error('Erreur chargement rapport', e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  // ── Dettes validées uniquement (prêts actifs/soldés + avances approuvées/déduites/payées) ──
  const allDebts = useMemo(() => {
    const l = loans.filter(x => ['ACTIVE', 'PAID'].includes(x.status)).map(x => ({ ...x, requestType: x.type ?? 'ARGENT' }));
    const a = advances.filter(x => ['APPROVED', 'DEDUCTED', 'PAID'].includes(x.status)).map(x => ({ ...x, requestType: 'AVANCE' }));
    return [...l, ...a];
  }, [loans, advances]);

  const availableYears = useMemo(() => {
    const set = new Set<number>([now.getFullYear()]);
    allDebts.forEach(r => set.add(new Date(r.createdAt).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [allDebts, now]);

  const departments = useMemo(() => Array.from(new Set(allDebts.map(r => r.employee?.department?.name).filter(Boolean))).sort(), [allDebts]);

  // ── Données du mois sélectionné ──────────────────────────────────────────
  const monthDebts = useMemo(() => allDebts.filter(r => {
    const d = new Date(r.createdAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  }), [allDebts, month, year]);

  const employeesConcerned = useMemo(() => new Set(monthDebts.map(r => r.employeeId)).size, [monthDebts]);
  const monthTotal = useMemo(() => monthDebts.reduce((s, r) => s + Number(r.amount), 0), [monthDebts]);

  const byTypeMonth = useMemo(() => {
    const map: Record<string, number> = {};
    monthDebts.forEach(r => { map[r.requestType] = (map[r.requestType] ?? 0) + Number(r.amount); });
    return Object.entries(map).map(([type, montant]) => ({ type, label: TYPE_LABEL[type] ?? type, montant, pct: monthTotal ? Math.round((montant / monthTotal) * 1000) / 10 : 0 }));
  }, [monthDebts, monthTotal]);

  const byDeptMonth = useMemo(() => {
    const map: Record<string, number> = {};
    monthDebts.forEach(r => { const n = r.employee?.department?.name || 'Sans département'; map[n] = (map[n] ?? 0) + Number(r.amount); });
    return Object.entries(map).map(([name, montant], i) => ({ name, montant, pct: monthTotal ? Math.round((montant / monthTotal) * 1000) / 10 : 0, color: DEPT_COLORS[i % DEPT_COLORS.length] }));
  }, [monthDebts, monthTotal]);

  // ── Vue annuelle : montants par mois et par type ─────────────────────────
  const annualSeries = useMemo(() => MONTHS_FR.map((label, idx) => {
    const monthNum = idx + 1;
    const row: any = { mois: label };
    Object.keys(TYPE_LABEL).forEach(t => { row[TYPE_LABEL[t]] = 0; });
    allDebts.filter(r => { const d = new Date(r.createdAt); return d.getFullYear() === year && d.getMonth() + 1 === monthNum; })
      .forEach(r => { row[TYPE_LABEL[r.requestType] ?? r.requestType] += Number(r.amount); });
    return row;
  }), [allDebts, year]);

  const annualSeriesByDept = useMemo(() => MONTHS_FR.map((label, idx) => {
    const monthNum = idx + 1;
    const montant = allDebts.filter(r => {
      const d = new Date(r.createdAt);
      return d.getFullYear() === year && d.getMonth() + 1 === monthNum && (!deptFilterAnnual || r.employee?.department?.name === deptFilterAnnual);
    }).reduce((s, r) => s + Number(r.amount), 0);
    return { mois: label, Montant: Math.round(montant) };
  }), [allDebts, year, deptFilterAnnual]);

  // ── Top 20 — employés avec le plus de dettes ─────────────────────────────
  const top20 = useMemo(() => {
    const source = top20Mode === 'mois' ? monthDebts : allDebts.filter(r => new Date(r.createdAt).getFullYear() === year);
    const map = new Map<string, { name: string; montant: number }>();
    source.forEach(r => {
      const key = r.employeeId;
      const name = `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}`.trim() || '—';
      const entry = map.get(key) ?? { name, montant: 0 };
      entry.montant += Number(r.amount);
      map.set(key, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.montant - a.montant).slice(0, 20);
  }, [monthDebts, allDebts, top20Mode, year]);

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;

  return (
    <div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <FinanceSubNav userRole={userRole} />
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Rapport — Prêts, avances & retenues</h1>
        <p className="text-sm text-gray-500">Vue d'ensemble mensuelle et annuelle des dettes des employés.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ══════════════════ COLONNE GAUCHE : légende + tableau ══════════════════ */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{MONTHS_FULL[month - 1]} {year}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{employeesConcerned}</p>
            <p className="text-xs text-gray-400">employé(s) avec une dette ce mois</p>
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
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-400 uppercase">Montant</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-400 uppercase">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {byTypeMonth.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-6 text-gray-400 text-xs">Aucune dette ce mois-ci.</td></tr>
                ) : byTypeMonth.map(t => (
                  <tr key={t.type}>
                    <td className="px-3 py-2 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: TYPE_COLOR[t.type] }} />{t.label}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">{fmt(t.montant)}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{t.pct}%</td>
                  </tr>
                ))}
                {byTypeMonth.length > 0 && (
                  <tr className="bg-gray-50 dark:bg-gray-900 font-bold">
                    <td className="px-3 py-2">Total</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{fmt(monthTotal)}</td>
                    <td className="px-3 py-2 text-right">100%</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ══════════════════ COLONNE DROITE : camemberts ══════════════════ */}
        <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Répartition des dettes par type — {MONTHS_FULL[month - 1]}</p>
            {byTypeMonth.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byTypeMonth} dataKey="montant" nameKey="label" innerRadius={0} outerRadius={95} label={(d: any) => `${d.pct}%`}>
                    {byTypeMonth.map((t, i) => <Cell key={i} fill={TYPE_COLOR[t.type]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Répartition par département — {MONTHS_FULL[month - 1]}</p>
            {byDeptMonth.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byDeptMonth} dataKey="montant" nameKey="name" innerRadius={55} outerRadius={95} label={(d: any) => `${d.pct}%`}>
                    {byDeptMonth.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ══════════════════ VUE ANNUELLE — TOUS LES EMPLOYÉS ══════════════════ */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 md:col-span-2">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Vue annuelle des montants — tous les employés ({year})</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={annualSeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="mois" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                {Object.entries(TYPE_LABEL).map(([type, label]) => (
                  <Area key={type} type="monotone" dataKey={label} stackId="1" stroke={TYPE_COLOR[type]} fill={TYPE_COLOR[type]} fillOpacity={0.55} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ══════════════════ VUE ANNUELLE — PAR DÉPARTEMENT ══════════════════ */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Vue annuelle des montants — par département ({year})</p>
              <select value={deptFilterAnnual} onChange={e => setDeptFilterAnnual(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                <option value="">Tous les départements</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={annualSeriesByDept}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="mois" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="Montant" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.35} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ══════════════════ TOP 20 ══════════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2"><Users2 size={16} /> Top 20 — employés avec le plus de dettes</p>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
            <button onClick={() => setTop20Mode('mois')} className={`px-3 py-1 rounded-md text-xs font-semibold ${top20Mode === 'mois' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`}>{MONTHS_FULL[month - 1]}</button>
            <button onClick={() => setTop20Mode('annee')} className={`px-3 py-1 rounded-md text-xs font-semibold ${top20Mode === 'annee' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`}>Annuel {year}</button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase w-10">#</th>
              <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase">Employé</th>
              <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-400 uppercase">Montant total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {top20.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-10 text-gray-400">Aucune donnée pour cette période.</td></tr>
            ) : top20.map((e, i) => (
              <tr key={e.name + i} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <td className="px-4 py-2 text-gray-400 font-semibold">{i + 1}</td>
                <td className="px-4 py-2 font-semibold text-gray-800 dark:text-gray-100">{e.name}</td>
                <td className="px-4 py-2 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap">{fmt(e.montant)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyChart() {
  return <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">Aucune donnée pour cette période.</div>;
}