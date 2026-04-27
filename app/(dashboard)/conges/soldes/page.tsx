'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Search, Loader2, AlertTriangle, AlertCircle,
  CheckCircle2, Lock, TrendingUp, Filter, ChevronRight, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmployeeBalance {
  employeeId:          string;
  employeeName:        string;
  position?:           string;
  departmentName?:     string;
  hireDate:            string;
  monthsWorked:        number;
  canTakeAnnualLeave:  boolean;
  monthsUntilEligible: number;
  annualEntitled:      number;
  annualTaken:         number;
  annualRemaining:     number;
  carriedForward:      number;
  year:                number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const alertLevel = (bal: EmployeeBalance): 'CRITICAL' | 'WARNING' | 'OK' | 'LOCKED' => {
  if (!bal.canTakeAnnualLeave) return 'LOCKED';
  const ratio = bal.annualRemaining / 78;
  if (ratio >= 0.9)  return 'CRITICAL';
  if (ratio >= 0.75) return 'WARNING';
  return 'OK';
};

const ALERT_CONFIG = {
  CRITICAL: { label: 'Plafond proche', icon: AlertTriangle,  color: 'text-red-500',    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',    bar: 'bg-red-500' },
  WARNING:  { label: 'À surveiller',   icon: AlertCircle,    color: 'text-amber-500',  badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' },
  OK:       { label: 'Normal',         icon: CheckCircle2,   color: 'text-emerald-500',badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500' },
  LOCKED:   { label: 'Pas encore éligible', icon: Lock,      color: 'text-gray-400',   badge: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400', bar: 'bg-gray-300' },
};

// ─── Composant principal ─────────────────────────────────────────────────────

export default function LeaveBalancesAdminPage() {
  const router = useRouter();
  const { bp } = useBasePath();
  const [balances, setBalances]    = useState<EmployeeBalance[]>([]);
  const [isLoading, setIsLoading]  = useState(true);
  const [search, setSearch]        = useState('');
  const [filterAlert, setFilterAlert] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'LOCKED'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = async () => {
    try {
      // Récupérer tous les employés actifs avec leurs soldes
      const employees = await api.get<any[]>('/employees/simple');
      const year = new Date().getFullYear();

      // Charger les soldes en parallèle
      const results = await Promise.allSettled(
        employees.map(async (emp: any) => {
          try {
            const bal = await api.get<any>(`/leaves/balance/${emp.id}?year=${year}`);
            const myBal = await api.get<any>(`/leaves/me/balance`).catch(() => null);
            return {
              employeeId:          emp.id,
              employeeName:        `${emp.firstName} ${emp.lastName}`,
              position:            emp.position,
              departmentName:      emp.department?.name,
              hireDate:            emp.hireDate,
              monthsWorked:        myBal?.monthsWorked ?? 0,
              canTakeAnnualLeave:  myBal?.canTakeAnnualLeave ?? true,
              monthsUntilEligible: myBal?.monthsUntilEligible ?? 0,
              annualEntitled:      Number(bal.annualEntitled  ?? 0),
              annualTaken:         Number(bal.annualTaken     ?? 0),
              annualRemaining:     Number(bal.annualRemaining ?? 0),
              carriedForward:      Number(bal.carriedForward  ?? 0),
              year,
            } as EmployeeBalance;
          } catch {
            return null;
          }
        })
      );

      const valid = results
        .filter(r => r.status === 'fulfilled' && r.value !== null)
        .map(r => (r as any).value as EmployeeBalance);

      setBalances(valid);
    } catch (e) {
      console.error('Erreur chargement soldes:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const refresh = () => { setIsRefreshing(true); load(); };

  // Stats globales
  const stats = useMemo(() => {
    const critical = balances.filter(b => alertLevel(b) === 'CRITICAL').length;
    const warning  = balances.filter(b => alertLevel(b) === 'WARNING').length;
    const locked   = balances.filter(b => alertLevel(b) === 'LOCKED').length;
    const totalDays = balances.reduce((s, b) => s + b.annualRemaining, 0);
    return { critical, warning, locked, totalDays };
  }, [balances]);

  // Filtres
  const filtered = useMemo(() => {
    let list = balances;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.employeeName.toLowerCase().includes(q) ||
        b.departmentName?.toLowerCase().includes(q) ||
        b.position?.toLowerCase().includes(q)
      );
    }
    if (filterAlert !== 'ALL') {
      list = list.filter(b => alertLevel(b) === filterAlert);
    }
    // Tri : CRITICAL first, then WARNING, then OK, then LOCKED
    const order = { CRITICAL: 0, WARNING: 1, OK: 2, LOCKED: 3 };
    return [...list].sort((a, b) => order[alertLevel(a)] - order[alertLevel(b)]);
  }, [balances, search, filterAlert]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-sky-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-24 space-y-8">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Congés · Vue Admin</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Soldes des Employés</h1>
            <p className="text-sm text-gray-400 mt-1">Année {new Date().getFullYear()} · {balances.length} employés</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={refresh} disabled={isRefreshing} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50">
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} /> Actualiser
          </button>
          <Link href={bp('/conges/provision')} className="px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity">
            <TrendingUp size={16} /> Voir la Provision
          </Link>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Critique (plafond proche)', value: stats.critical, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800', click: () => setFilterAlert('CRITICAL') },
          { label: 'À surveiller (>75%)',        value: stats.warning,  color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800', click: () => setFilterAlert('WARNING') },
          { label: 'Pas encore éligibles',        value: stats.locked,   color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-100 dark:border-gray-700', click: () => setFilterAlert('LOCKED') },
          { label: 'Total jours restants',        value: `${stats.totalDays.toFixed(0)}j`, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-100 dark:border-sky-800', click: () => setFilterAlert('ALL') },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={s.click}
            className={`${s.bg} border ${s.border} rounded-2xl p-5 cursor-pointer hover:shadow-md transition-shadow`}
          >
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── FILTRES ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un employé, département..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {(['ALL', 'CRITICAL', 'WARNING', 'LOCKED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterAlert(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filterAlert === f
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'ALL' ? 'Tous' : f === 'CRITICAL' ? 'Critique' : f === 'WARNING' ? 'Alerte' : 'Verrouillé'}
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700">
            <tr>
              {['Employé', 'Département', 'Ancienneté', 'Acquis / Pris / Restant', 'Report', 'Statut', ''].map(h => (
                <th key={h} className="px-5 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-gray-400 text-sm">
                  Aucun employé trouvé.
                </td>
              </tr>
            ) : filtered.map((bal, i) => {
              const level   = alertLevel(bal);
              const cfg     = ALERT_CONFIG[level];
              const Icon    = cfg.icon;
              const pctUsed = bal.annualEntitled > 0
                ? Math.min(100, (bal.annualTaken / bal.annualEntitled) * 100)
                : 0;

              return (
                <motion.tr
                  key={bal.employeeId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.01, 0.2) }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {/* Employé */}
                  <td className="px-5 py-4">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{bal.employeeName}</p>
                    <p className="text-xs text-gray-400">{bal.position}</p>
                  </td>

                  {/* Département */}
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {bal.departmentName ?? '—'}
                  </td>

                  {/* Ancienneté */}
                  <td className="px-5 py-4">
                    <p className="text-sm font-mono text-gray-600 dark:text-gray-300">
                      {bal.monthsWorked}m
                    </p>
                    {!bal.canTakeAnnualLeave && (
                      <p className="text-xs text-amber-500">{bal.monthsUntilEligible}m restants</p>
                    )}
                  </td>

                  {/* Solde */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cfg.bar}`}
                          style={{ width: `${Math.min(100, (bal.annualRemaining / 78) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {bal.annualRemaining.toFixed(1)}j restant
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Acquis {bal.annualEntitled.toFixed(1)}j · Pris {bal.annualTaken.toFixed(1)}j
                    </p>
                  </td>

                  {/* Report */}
                  <td className="px-5 py-4">
                    {bal.carriedForward > 0 ? (
                      <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                        +{bal.carriedForward.toFixed(1)}j reportés
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Statut */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.badge}`}>
                      <Icon size={12} />
                      {cfg.label}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-5 py-4">
                    <Link
                      href={bp(`/employes/${bal.employeeId}`)}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
                    >
                      <ChevronRight size={14} className="text-gray-400" />
                    </Link>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}