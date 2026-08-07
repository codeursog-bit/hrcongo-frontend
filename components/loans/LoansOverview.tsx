'use client';

// ============================================================================
// 📁 components/loans/LoansOverview.tsx
// ✅ Onglet "Vue d'ensemble" de la page Gestion des prêts & avances.
//    KPI du mois + de la période, 10 dernières demandes avec filtres, et
//    graphiques (courbe mensuelle emprunté/remboursé, répartition par type,
//    top départements par montant de dette).
// ✅ Ne fait AUCUN appel réseau : reçoit les listes déjà chargées par la page
//    parente (`loans`, `advances`) et travaille dessus — reste synchronisé
//    automatiquement après chaque décision/paiement.
// ============================================================================

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useBasePath } from '@/hooks/useBasePath';
import {
  TrendingUp, Wallet, Banknote, PiggyBank, Filter, ChevronRight, Users2,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const TYPE_LABEL: Record<string, string> = { ARGENT: 'Prêt argent', MARCHANDISE: 'Marchandise', AUTRE: 'Autre prêt', AVANCE: 'Avance sur salaire' };
const CHART_COLORS = ['#0ea5e9', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444'];

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';

type Props = {
  loans: any[];
  advances: any[];
  onSelectEmployee: (emp: any) => void;
  onGoToRequest: (kind: 'loan' | 'advance', id: string) => void;
};

export default function LoansOverview({ loans, advances, onSelectEmployee, onGoToRequest }: Props) {
  const { bp } = useBasePath();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [typeFilter, setTypeFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showAll, setShowAll] = useState(false);

  // ── Unifier prêts + avances en une seule liste de "demandes" ──────────────
  const allRequests = useMemo(() => {
    const l = loans.map(x => ({
      ...x, kind: 'loan' as const,
      requestType: x.type ?? 'ARGENT',
      monthlyAmount: Number(x.monthlyRepayment ?? 0),
    }));
    const a = advances.map(x => ({
      ...x, kind: 'advance' as const,
      requestType: 'AVANCE',
      monthlyAmount: Number(x.amount ?? 0),
    }));
    return [...l, ...a].sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime());
  }, [loans, advances]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    allRequests.forEach(r => { if (r.employee?.department?.name) set.add(r.employee.department.name); });
    return Array.from(set).sort();
  }, [allRequests]);

  const filtered = useMemo(() => allRequests.filter(r =>
    (!typeFilter || r.requestType === typeFilter) &&
    (!deptFilter || r.employee?.department?.name === deptFilter),
  ), [allRequests, typeFilter, deptFilter]);

  // ── KPI ─────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const thisMonth = allRequests.filter(r => {
      const d = new Date(r.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const countThisMonth = thisMonth.length;
    const totalThisMonth = thisMonth.reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const totalAllTime = allRequests.reduce((s, r) => s + Number(r.amount ?? 0), 0);

    // Reste à recouvrer : solde restant des prêts actifs + avances approuvées non déduites
    const outstandingLoans = loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + Number(l.remainingBalance ?? 0), 0);
    const outstandingAdvances = advances.filter(a => a.status === 'APPROVED').reduce((s, a) => s + Number(a.amount ?? 0), 0);
    const outstanding = outstandingLoans + outstandingAdvances;

    return { countThisMonth, totalThisMonth, totalAllTime, outstanding };
  }, [allRequests, loans, advances, now]);

  // ── Courbe mensuelle : montant emprunté/avancé vs remboursé, par mois de l'année sélectionnée ──
  const monthlySeries = useMemo(() => {
    return MONTHS_FR.map((label, idx) => {
      const monthNum = idx + 1;
      const emprunte = allRequests
        .filter(r => { const d = new Date(r.createdAt); return d.getFullYear() === year && d.getMonth() === idx; })
        .reduce((s, r) => s + Number(r.amount ?? 0), 0);

      // Remboursé : déductions/paiements en espèces enregistrés ce mois-là (logs de prêts) + avances déduites/payées créées ce mois-là (proxy simple)
      const rembourseLoans = loans
        .flatMap(l => l.repaymentLogs ?? [])
        .filter((log: any) => log.year === year && log.month === monthNum)
        .reduce((s: number, log: any) => s + Number(log.amount ?? 0), 0);
      const rembourseAdvances = advances
        .filter(a => ['DEDUCTED', 'PAID'].includes(a.status) && a.deductYear === year && a.deductMonth === monthNum)
        .reduce((s, a) => s + Number(a.amount ?? 0), 0);

      return { mois: label, Emprunté: Math.round(emprunte), Remboursé: Math.round(rembourseLoans + rembourseAdvances) };
    });
  }, [allRequests, loans, advances, year]);

  const availableYears = useMemo(() => {
    const set = new Set<number>([now.getFullYear()]);
    allRequests.forEach(r => set.add(new Date(r.createdAt).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [allRequests, now]);

  // ── Répartition par type (montant) ─────────────────────────────────────
  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    allRequests.forEach(r => { map[r.requestType] = (map[r.requestType] ?? 0) + Number(r.amount ?? 0); });
    return Object.entries(map).map(([type, value]) => ({ name: TYPE_LABEL[type] ?? type, value }));
  }, [allRequests]);

  // ── Top départements par montant de dette ───────────────────────────────
  const byDept = useMemo(() => {
    const map: Record<string, number> = {};
    allRequests.forEach(r => {
      const name = r.employee?.department?.name || 'Sans département';
      map[name] = (map[name] ?? 0) + Number(r.amount ?? 0);
    });
    return Object.entries(map)
      .map(([departement, montant]) => ({ departement, montant: Math.round(montant) }))
      .sort((a, b) => b.montant - a.montant)
      .slice(0, 5);
  }, [allRequests]);

  const displayedRequests = showAll ? filtered : filtered.slice(0, 10);

  const recentlyValidatedLoans = useMemo(() =>
    loans.filter(l => ['ACTIVE', 'PAID'].includes(l.status))
      .sort((a, b) => new Date(b.approvedAt ?? b.createdAt).getTime() - new Date(a.approvedAt ?? a.createdAt).getTime())
      .slice(0, 5),
  [loans]);

  return (
    <div className="space-y-6">
      {/* ══════════════════ KPI ══════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Banknote} label="Demandes ce mois-ci" value={String(kpis.countThisMonth)} color="sky" />
        <KpiCard icon={TrendingUp} label="Total accordé ce mois-ci" value={fmt(kpis.totalThisMonth)} color="emerald" />
        <KpiCard icon={PiggyBank} label="Total accordé (toutes périodes)" value={fmt(kpis.totalAllTime)} color="violet" />
        <KpiCard icon={Wallet} label="Reste à recouvrer" value={fmt(kpis.outstanding)} color="amber" />
      </div>

      {/* ══════════════════ DERNIÈRES DEMANDES ══════════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{showAll ? 'Toutes les demandes' : 'Dernières demandes'}</p>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect icon={Filter} value={typeFilter} onChange={setTypeFilter} placeholder="Tous les types" options={Object.entries(TYPE_LABEL)} />
            {departments.length > 0 && (
              <FilterSelect icon={Users2} value={deptFilter} onChange={setDeptFilter} placeholder="Tous les départements" options={departments.map(d => [d, d] as [string, string])} />
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>{['Employé', 'Type', 'Montant', 'Mensualité', 'Date', 'Statut', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {displayedRequests.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Aucune demande pour ce filtre.</td></tr>
              ) : displayedRequests.map(r => (
                <tr key={`${r.kind}-${r.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3">
                    <button onClick={() => onSelectEmployee(r.employee)} className="font-semibold text-gray-800 dark:text-gray-100 hover:text-sky-600 hover:underline">
                      {r.employee?.firstName} {r.employee?.lastName}
                    </button>
                    {r.employee?.department?.name && <p className="text-xs text-gray-400">{r.employee.department.name}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{TYPE_LABEL[r.requestType] ?? r.requestType}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">{fmt(Number(r.amount ?? 0))}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.monthlyAmount ? fmt(r.monthlyAmount) : '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onGoToRequest(r.kind, r.id)} className="text-sky-600 hover:underline text-xs font-semibold flex items-center gap-0.5 ml-auto">
                      Détail <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 10 && (
          <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex justify-center">
            <button onClick={() => setShowAll(s => !s)} className="text-xs font-semibold text-sky-600 hover:underline">
              {showAll ? 'Réduire à 10 demandes' : `Voir les ${filtered.length} demandes`}
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════ DERNIERS PRÊTS VALIDÉS ══════════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Derniers prêts validés</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {recentlyValidatedLoans.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">Aucun prêt validé pour le moment.</p>
          ) : recentlyValidatedLoans.map(l => (
            <button key={l.id} onClick={() => onSelectEmployee(l.employee)} className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 text-left">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{l.employee?.firstName} {l.employee?.lastName}</p>
                <p className="text-xs text-gray-400">{TYPE_LABEL[l.type] ?? l.type} · validé le {new Date(l.approvedAt ?? l.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <span className="font-semibold text-sm text-emerald-600 whitespace-nowrap">{fmt(Number(l.amount))}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════ NAVIGATION ══════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href={bp('/loans/suivi-dettes')} className="group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 transition-all">
          <TrendingUp className="absolute -right-3 -bottom-3 opacity-20 group-hover:scale-110 transition-transform" size={110} />
          <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Suivi</p>
          <p className="text-lg font-bold mb-1">Suivi des dettes →</p>
          <p className="text-xs opacity-80">Qui doit combien, par employé, avec historique et paiement</p>
        </Link>
        <Link href={bp('/loans/validations')} className="group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all">
          <Filter className="absolute -right-3 -bottom-3 opacity-20 group-hover:scale-110 transition-transform" size={110} />
          <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Décisions</p>
          <p className="text-lg font-bold mb-1">Validations →</p>
          <p className="text-xs opacity-80">Toutes les demandes, valider ou refuser en un clic</p>
        </Link>
      </div>

      {/* ══════════════════ GRAPHIQUES ══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Montants empruntés vs remboursés par mois</p>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900">
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="mois" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Line type="monotone" dataKey="Emprunté" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="Remboursé" stroke="#10b981" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Répartition par type de dette</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byType} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {byType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Top 5 départements par montant de dette</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byDept} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
              <XAxis type="number" fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <YAxis type="category" dataKey="departement" fontSize={12} width={110} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="montant" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: 'sky' | 'emerald' | 'violet' | 'amber' }) {
  const cls: Record<string, string> = {
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cls[color]}`}><Icon size={18} /></div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{value}</p>
    </div>
  );
}

function FilterSelect({ icon: Icon, value, onChange, placeholder, options }: { icon: any; value: string; onChange: (v: string) => void; placeholder: string; options: [string, string][] }) {
  return (
    <div className="relative">
      <Icon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <select value={value} onChange={e => onChange(e.target.value)} className="pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-xs">
        <option value="">{placeholder}</option>
        {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
      </select>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    PENDING: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' },
    PENDING_DG: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' },
    ACTIVE: { label: 'Actif', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' },
    APPROVED: { label: 'Approuvée', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' },
    PAID: { label: 'Remboursé(e)', cls: 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300' },
    DEDUCTED: { label: 'Déduite', cls: 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300' },
    REJECTED: { label: 'Refusé(e)', cls: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' },
    CANCELLED: { label: 'Annulé(e)', cls: 'bg-gray-50 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
  };
  const c = cfg[status] ?? { label: status, cls: 'bg-gray-50 text-gray-500' };
  return <span className={`text-xs font-semibold px-2 py-1 rounded-md ${c.cls}`}>{c.label}</span>;
}