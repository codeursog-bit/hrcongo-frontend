'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, AlertTriangle, AlertCircle, CheckCircle2,
  Loader2, TrendingUp, Users, Wallet, Calendar,
  ChevronRight, Info, RefreshCw, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import CongeSubNav from '@/components/CongeSubNav';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProvisionDetail {
  employeeId:    string;
  employeeName:  string;
  remainingDays: number;
  dailyRate:     number;
  provision:     number;
  alertLevel:    'OK' | 'WARNING' | 'CRITICAL';
  yearsWithoutLeave: number;
  maxCumulYears: number;
}

interface ProvisionResult {
  totalProvision: number;
  currency:       string;
  details:        ProvisionDetail[];
}

interface LeaveBalance {
  employeeId:      string;
  year:            number;
  annualEntitled:  number;
  annualTaken:     number;
  annualRemaining: number;
  carriedForward:  number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n));

const ALERT_CONFIG = {
  CRITICAL: {
    label:     'Critique',
    bg:        'bg-red-50 dark:bg-red-900/20',
    border:    'border-red-200 dark:border-red-800',
    text:      'text-red-700 dark:text-red-300',
    badge:     'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    icon:      AlertTriangle,
    iconColor: 'text-red-500',
  },
  WARNING: {
    label:     'Attention',
    bg:        'bg-amber-50 dark:bg-amber-900/20',
    border:    'border-amber-200 dark:border-amber-800',
    text:      'text-amber-700 dark:text-amber-300',
    badge:     'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    icon:      AlertCircle,
    iconColor: 'text-amber-500',
  },
  OK: {
    label:     'Normal',
    bg:        'bg-emerald-50 dark:bg-emerald-900/20',
    border:    'border-emerald-200 dark:border-emerald-800',
    text:      'text-emerald-700 dark:text-emerald-300',
    badge:     'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    icon:      CheckCircle2,
    iconColor: 'text-emerald-500',
  },
};

// ─── Composant principal ─────────────────────────────────────────────────────

export default function LeaveProvisionPage() {
  const router = useRouter();
  const { bp } = useBasePath();
  const [provision, setProvision] = useState<ProvisionResult | null>(null);
  const [isLoading, setIsLoading]  = useState(true);
  const [filter, setFilter]        = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'OK'>('ALL');
  const [sortBy, setSortBy]        = useState<'provision' | 'days' | 'name'>('provision');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
  }, []);

  const load = async () => {
    try {
      const data = await api.get<ProvisionResult>('/leaves/provision');
      setProvision(data);
    } catch (e) {
      console.error('Erreur provision:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setIsRefreshing(true);
    await load();
  };

  // Statistiques rapides
  const stats = useMemo(() => {
    if (!provision) return null;
    const critical = provision.details.filter(d => d.alertLevel === 'CRITICAL').length;
    const warning  = provision.details.filter(d => d.alertLevel === 'WARNING').length;
    const ok       = provision.details.filter(d => d.alertLevel === 'OK').length;
    const avgDays  = provision.details.length > 0
      ? provision.details.reduce((s, d) => s + d.remainingDays, 0) / provision.details.length
      : 0;
    return { critical, warning, ok, avgDays, total: provision.details.length };
  }, [provision]);

  // Filtrage + tri
  const filtered = useMemo(() => {
    if (!provision) return [];
    let list = filter === 'ALL'
      ? provision.details
      : provision.details.filter(d => d.alertLevel === filter);

    return [...list].sort((a, b) => {
      if (sortBy === 'provision') return b.provision - a.provision;
      if (sortBy === 'days')      return b.remainingDays - a.remainingDays;
      return a.employeeName.localeCompare(b.employeeName);
    });
  }, [provision, filter, sortBy]);

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto pb-24 space-y-8">
      <CongeSubNav userRole={userRole} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <ArrowLeft size={18} className="text-[var(--text-muted)]" />
          </button>
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase mb-1">
              Congés · Finances RH
            </p>
            <h1 className="text-3xl font-bold text-[var(--text)]">
              Provision pour Congés
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Dette sociale — montant dû si tous les employés prenaient leurs congés demain
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <Link
            href={bp('/conges')}
            className="px-4 py-2.5 rounded-xl bg-[var(--text)] text-[var(--bg)] text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Calendar size={16} /> Gérer les congés
          </Link>
        </div>
      </div>

      {/* ── ENCART EXPLICATION ── */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-5 flex gap-4 items-start">
        <Info size={20} className="text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
          <p className="font-semibold">Qu'est-ce que la provision pour congés ?</p>
          <p>
            Chaque jour de congé non pris représente une dette financière. Si un employé démissionne,
            l'entreprise doit lui payer ses jours restants. Ce tableau calcule cette dette en temps réel,
            basée sur la <strong>moyenne des 12 derniers bulletins</strong> de chaque employé (conforme art. 124 Code du travail congolais).
          </p>
        </div>
      </div>

      {/* ── STATS RAPIDES ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Provision totale */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 bg-[#050607] rounded-2xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={16} className="text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Provision totale
              </span>
            </div>
            <p className="text-3xl font-bold">
              {fmt(provision?.totalProvision ?? 0)}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">F CFA</p>
          </motion.div>

          {/* Critique */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[var(--surface)] rounded-2xl p-6 border border-red-100 dark:border-red-900/50 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setFilter('CRITICAL')}
          >
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle size={18} className="text-red-500" />
              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold px-2 py-0.5 rounded-full">
                Plafond proche
              </span>
            </div>
            <p className="text-3xl font-bold text-[var(--text)]">{stats.critical}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">employé{stats.critical > 1 ? 's' : ''} critique{stats.critical > 1 ? 's' : ''}</p>
          </motion.div>

          {/* Attention */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[var(--surface)] rounded-2xl p-6 border border-amber-100 dark:border-amber-900/50 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setFilter('WARNING')}
          >
            <div className="flex items-center justify-between mb-3">
              <AlertCircle size={18} className="text-amber-500" />
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full">
                À surveiller
              </span>
            </div>
            <p className="text-3xl font-bold text-[var(--text)]">{stats.warning}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">employé{stats.warning > 1 ? 's' : ''} en alerte</p>
          </motion.div>

          {/* Moyenne jours */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-[var(--text)]">
              {Math.round(stats.avgDays)}j
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">solde moyen par employé</p>
          </motion.div>
        </div>
      )}

      {/* ── BARRE DE FILTRES ── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-[var(--surface-2)] p-1 rounded-xl">
          {(['ALL', 'CRITICAL', 'WARNING', 'OK'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === f
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {f === 'ALL' ? `Tous (${provision?.details.length ?? 0})` :
               f === 'CRITICAL' ? `Critique (${stats?.critical})` :
               f === 'WARNING'  ? `Alerte (${stats?.warning})` :
               `Normal (${stats?.ok})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <span>Trier par :</span>
          {(['provision', 'days', 'name'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                sortBy === s
                  ? 'bg-[var(--text)] text-[var(--bg)] font-semibold'
                  : 'border border-[var(--border)] hover:bg-[var(--surface-2)]'
              }`}
            >
              {s === 'provision' ? 'Montant' : s === 'days' ? 'Jours' : 'Nom'}
            </button>
          ))}
        </div>
      </div>

      {/* ── LISTE EMPLOYÉS ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
          <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">Aucun employé dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((emp, i) => {
              const cfg      = ALERT_CONFIG[emp.alertLevel];
              const Icon     = cfg.icon;
              // ✅ CORRECTIF (2e passe) : la jauge doit refléter le vrai
              // critère légal — depuis combien de temps l'employé n'est
              // parti sur AUCUN congé annuel, comparé au plafond de cumul
              // (3 ans) — pas un plafond de jours par cycle, qui n'a rien à
              // voir avec le risque que cette page est censée signaler.
              const pct      = Math.min(100, (emp.yearsWithoutLeave / emp.maxCumulYears) * 100);
              const initials = emp.employeeName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

              return (
                <motion.div
                  key={emp.employeeId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className={`bg-[var(--surface)] rounded-2xl p-5 border shadow-sm hover:shadow-md transition-shadow ${
                    emp.alertLevel !== 'OK'
                      ? `${cfg.border}`
                      : 'border-[var(--border)]'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] flex items-center justify-center font-bold text-[var(--text-muted)] text-sm shrink-0">
                      {initials}
                    </div>

                    {/* Info principale */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-bold text-[var(--text)]">{emp.employeeName}</p>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${cfg.badge}`}>
                          <Icon size={12} />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Barre progression — durée sans congé vs plafond légal de cumul */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: i * 0.02 }}
                            className={`h-full rounded-full ${
                              emp.alertLevel === 'CRITICAL' ? 'bg-red-500' :
                              emp.alertLevel === 'WARNING'  ? 'bg-amber-500' :
                              'bg-emerald-500'
                            }`}
                          />
                        </div>
                        <span className="text-xs text-[var(--text-muted)] font-mono whitespace-nowrap">
                          {emp.yearsWithoutLeave.toFixed(1)} an{emp.yearsWithoutLeave >= 2 ? 's' : ''} sans congé / {emp.maxCumulYears} max
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {Math.round(emp.remainingDays)}j de congé non pris cumulés
                      </p>
                    </div>

                    {/* Métriques */}
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-xs text-[var(--text-muted)] mb-0.5">Taux journalier</p>
                      <p className="text-sm font-semibold text-[var(--text-muted)]">
                        {fmt(emp.dailyRate)} F/j
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs text-[var(--text-muted)] mb-0.5">Provision</p>
                      <p className={`text-xl font-bold ${
                        emp.alertLevel === 'CRITICAL' ? 'text-red-600 dark:text-red-400' :
                        emp.alertLevel === 'WARNING'  ? 'text-amber-600 dark:text-amber-400' :
                        'text-[var(--text)]'
                      }`}>
                        {fmt(emp.provision)} F
                      </p>
                    </div>

                    <Link
                      href={bp(`/employes/${emp.employeeId}/conges`)}
                      className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors shrink-0"
                    >
                      <ChevronRight size={16} className="text-[var(--text-muted)]" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── RÉCAP TOTAL ── */}
      {provision && filtered.length > 0 && (
        <div className="bg-[var(--text)] rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-[var(--text-muted)] text-sm">
              {filter === 'ALL' ? 'Total provision entreprise' : `Total — ${filter === 'CRITICAL' ? 'employés critiques' : filter === 'WARNING' ? 'employés en alerte' : 'employés normaux'}`}
            </p>
            <p className="text-white text-2xl font-bold mt-1">
              {fmt(filtered.reduce((s, d) => s + d.provision, 0))} F CFA
            </p>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
            <Users size={16} />
            <span>{filtered.length} employé{filtered.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
}