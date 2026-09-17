'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Search, Loader2, AlertTriangle, AlertCircle,
  CheckCircle2, Lock, TrendingUp, Filter, ChevronRight, RefreshCw, Pencil, X, Check,
  History, Trash2, Umbrella, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import CongeSubNav from '@/components/CongeSubNav';

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
  seniorityDays:       number;
  cycleEndDate?:       string | null;
  year:                number;
  loadError?:          string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// ✅ CORRECTIF : utilisait un dénominateur fixe de 78j (plafond légal de
// cumul sur 3 cycles, jamais atteignable en pratique sur un seul cycle) —
// l'alerte ne se déclenchait donc quasiment jamais ici, contrairement à la
// page Provision qui calcule (côté backend) sur le vrai plafond du cycle en
// cours (26j + ancienneté). Un même employé pouvait ainsi apparaître
// "Critique" sur Provision et "Normal" sur Soldes. Aligné sur la même
// formule que LeavesIndemnityService.getLeaveProvision().
const cycleMaxFor = (bal: EmployeeBalance) => 26 + Number(bal.seniorityDays || 0);

const alertLevel = (bal: EmployeeBalance): 'CRITICAL' | 'WARNING' | 'OK' | 'LOCKED' => {
  if (!bal.canTakeAnnualLeave) return 'LOCKED';
  const cycleMax = cycleMaxFor(bal);
  const ratio = cycleMax > 0 ? bal.annualRemaining / cycleMax : 0;
  if (ratio >= 0.9)  return 'CRITICAL';
  if (ratio >= 0.75) return 'WARNING';
  return 'OK';
};

const ALERT_CONFIG = {
  CRITICAL: { label: 'Plafond proche', icon: AlertTriangle,  color: 'text-red-500',    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',    bar: 'bg-red-500' },
  WARNING:  { label: 'À surveiller',   icon: AlertCircle,    color: 'text-amber-500',  badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' },
  OK:       { label: 'Normal',         icon: CheckCircle2,   color: 'text-emerald-500',badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500' },
  LOCKED:   { label: 'Pas encore éligible', icon: Lock,      color: 'text-[var(--text-muted)]',   badge: 'bg-[var(--surface-2)] text-[var(--text-muted)]', bar: 'bg-[var(--border)]' },
};

// ✅ Historique par employé (panneau) — mêmes libellés que /conges/gestion,
// pour une lecture cohérente d'une page à l'autre.
const TYPE_LABELS: Record<string, string> = { ANNUAL: 'Annuel', ANNUAL_ANTICIPATED: 'Annuel anticipé' };
const TYPE_ICONS: Record<string, any> = { ANNUAL: Umbrella, ANNUAL_ANTICIPATED: Zap };
const STATUS_LABELS: Record<string, string> = { PENDING: 'En attente', APPROVED: 'Approuvé', REJECTED: 'Refusé', CANCELLED: 'Annulé' };
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  APPROVED: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  REJECTED: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  CANCELLED: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
};
function fmtDate(d: string) { return new Date(d).toLocaleDateString('fr-FR'); }

// ─── Composant principal ─────────────────────────────────────────────────────

export default function LeaveBalancesAdminPage() {
  const router = useRouter();
  const { bp } = useBasePath();
  const [balances, setBalances]    = useState<EmployeeBalance[]>([]);
  const [isLoading, setIsLoading]  = useState(true);
  const [search, setSearch]        = useState('');
  const [filterAlert, setFilterAlert] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'LOCKED'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [adjusting, setAdjusting] = useState<EmployeeBalance | null>(null);
  const [lastLeaveType, setLastLeaveType] = useState<'ANNUAL' | 'ANNUAL_ANTICIPATED'>('ANNUAL');
  const [lastLeaveStart, setLastLeaveStart] = useState('');
  const [lastLeaveEnd, setLastLeaveEnd] = useState('');
  const [remainingDays, setRemainingDays] = useState('');
  const [isSavingAdjust, setIsSavingAdjust] = useState(false);

  // ✅ Historique par employé + modifier/supprimer un congé directement
  // depuis cette page — cohérent avec /conges/gestion et /conges/[id] :
  // même panneau, mêmes endpoints (PATCH/DELETE /leaves/:id).
  const [historyEmployee, setHistoryEmployee] = useState<EmployeeBalance | null>(null);
  const [history, setHistory] = useState<any>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editForm, setEditForm] = useState({ type: 'ANNUAL' as 'ANNUAL' | 'ANNUAL_ANTICIPATED', startDate: '', endDate: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const canAdjust = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(userRole);

  const openAdjust = (bal: EmployeeBalance) => {
    setAdjusting(bal);
    setLastLeaveType('ANNUAL');
    setLastLeaveStart('');
    setLastLeaveEnd('');
    setRemainingDays('');
  };

  const saveAdjust = async () => {
    if (!adjusting) return;
    if (!lastLeaveStart || !lastLeaveEnd) { alert('Renseigne les dates de départ et de retour du dernier congé'); return; }
    if (lastLeaveType === 'ANNUAL_ANTICIPATED' && remainingDays === '') {
      alert('Renseigne le solde de jours restants pour un congé anticipé'); return;
    }
    setIsSavingAdjust(true);
    try {
      await api.post(`/leaves/employee/${adjusting.employeeId}/seed-from-last-leave`, {
        lastLeaveType,
        startDate: lastLeaveStart,
        endDate: lastLeaveEnd,
        remainingDays: lastLeaveType === 'ANNUAL_ANTICIPATED' ? parseFloat(remainingDays) : undefined,
      });
      setAdjusting(null);
      await load();
    } catch (e: any) {
      alert(e?.message || "Erreur lors de la reprise du solde");
    } finally {
      setIsSavingAdjust(false);
    }
  };

  // ✅ Ouvre l'historique des congés de l'employé — pour corriger le solde à
  // la source (modifier/supprimer le congé en cause) plutôt que d'écraser le
  // solde à la main.
  const openHistory = async (bal: EmployeeBalance) => {
    setHistoryEmployee(bal);
    setIsLoadingHistory(true);
    try {
      const data = await api.get(`/leaves/employee-history/${bal.employeeId}`);
      setHistory(data);
    } catch (e) {
      console.error('Erreur historique employé', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const openEditItem = (item: any) => {
    setEditError('');
    setEditingItem(item);
    setEditForm({
      type: item.type === 'ANNUAL_ANTICIPATED' ? 'ANNUAL_ANTICIPATED' : 'ANNUAL',
      startDate: new Date(item.startDate).toISOString().slice(0, 10),
      endDate: new Date(item.endDate).toISOString().slice(0, 10),
    });
  };

  const saveEditItem = async () => {
    if (!editingItem) return;
    setIsSavingEdit(true);
    setEditError('');
    try {
      await api.patch(`/leaves/${editingItem.id}`, {
        type: editForm.type,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      });
      setEditingItem(null);
      if (historyEmployee) await openHistory(historyEmployee);
      await load();
    } catch (e: any) {
      setEditError(e?.message || 'Erreur lors de la modification du congé');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const confirmDeleteItem = async () => {
    if (!deletingItem) return;
    setIsDeletingItem(true);
    setDeleteError('');
    try {
      await api.delete(`/leaves/${deletingItem.id}`);
      setDeletingItem(null);
      if (historyEmployee) await openHistory(historyEmployee);
      await load();
    } catch (e: any) {
      setDeleteError(e?.message || 'Erreur lors de la suppression du congé');
    } finally {
      setIsDeletingItem(false);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
  }, []);

  const load = async () => {
    try {
      // ✅ Un seul appel serveur qui calcule tout — avant : 1 requête
      // /employees/simple + N requêtes /leaves/balance/:id en parallèle,
      // ce qui déclenchait le rate-limiter du serveur (429 Too Many Requests)
      // dès qu'il y avait une centaine d'employés.
      const results: any[] = await api.get('/leaves/balances');

      const valid: EmployeeBalance[] = results.map((r) => ({
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        position: r.position,
        departmentName: r.departmentName,
        hireDate: r.hireDate,
        monthsWorked: r.monthsWorked ?? 0,
        canTakeAnnualLeave: r.canTakeAnnualLeave ?? true,
        monthsUntilEligible: r.monthsUntilEligible ?? 0,
        annualEntitled: Number(r.annualEntitled ?? 0),
        annualTaken: Number(r.annualTaken ?? 0),
        annualRemaining: Number(r.annualRemaining ?? 0),
        carriedForward: Number(r.carriedForward ?? 0),
        seniorityDays: Number(r.seniorityDays ?? 0),
        cycleEndDate: r.cycleEndDate ?? null,
        year: r.year ?? new Date().getFullYear(),
        loadError: r.loadError,
      }));

      const failedCount = valid.filter((v) => v.loadError).length;
      if (failedCount > 0) {
        console.warn(`⚠️ ${failedCount} employé(s) sur ${valid.length} ont un solde en erreur — voir les avertissements côté serveur (logs backend) pour le détail.`);
      }

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
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-24 space-y-8">
      <CongeSubNav userRole={userRole} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2.5 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
            <ArrowLeft size={18} className="text-[var(--text-muted)]" />
          </button>
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase mb-1">Congés · Vue Admin</p>
            <h1 className="text-3xl font-bold text-[var(--text)]">Soldes des Employés</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Année {new Date().getFullYear()} · {balances.length} employés</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={refresh} disabled={isRefreshing} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2 disabled:opacity-50">
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} /> Actualiser
          </button>
          <Link href={bp('/conges/provision')} className="px-4 py-2.5 rounded-xl bg-[var(--text)] text-[var(--bg)] text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity">
            <TrendingUp size={16} /> Voir la Provision
          </Link>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Critique (plafond proche)', value: stats.critical, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800', click: () => setFilterAlert('CRITICAL') },
          { label: 'À surveiller (>75%)',        value: stats.warning,  color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800', click: () => setFilterAlert('WARNING') },
          { label: 'Pas encore éligibles',        value: stats.locked,   color: 'text-[var(--text-muted)]', bg: 'bg-[var(--surface-2)]', border: 'border-[var(--border)]', click: () => setFilterAlert('LOCKED') },
          { label: 'Total jours restants',        value: `${stats.totalDays.toFixed(0)}j`, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800', click: () => setFilterAlert('ALL') },
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
            <p className="text-xs text-[var(--text-muted)] mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── ALERTE : employés dont le solde n'a pas pu être calculé ── */}
      {balances.some(b => b.loadError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold text-red-700 dark:text-red-300">
              {balances.filter(b => b.loadError).length} employé(s) sur {balances.length} ont un solde en erreur
            </p>
            <p className="text-red-600/80 dark:text-red-400/80 mt-0.5">
              Ils restent affichés ci-dessous avec un badge "Erreur" — voir les logs backend (Coolify) pour le détail exact de chaque erreur.
            </p>
          </div>
        </div>
      )}

      {/* ── FILTRES ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Rechercher un employé, département..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex gap-1 bg-[var(--surface-2)] p-1 rounded-xl">
          {(['ALL', 'CRITICAL', 'WARNING', 'LOCKED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterAlert(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filterAlert === f
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {f === 'ALL' ? 'Tous' : f === 'CRITICAL' ? 'Critique' : f === 'WARNING' ? 'Alerte' : 'Verrouillé'}
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-[var(--surface-2)] border-b border-[var(--border)]">
            <tr>
              {['Employé', 'Département', 'Ancienneté', 'Acquis / Pris / Restant', 'Report', 'Statut', ''].map(h => (
                <th key={h} className="px-5 py-4 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-[var(--text-muted)] text-sm">
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
                  className="hover:bg-[var(--surface-2)]/30 transition-colors"
                >
                  {/* Employé */}
                  <td className="px-5 py-4">
                    <p className="font-semibold text-sm text-[var(--text)]">{bal.employeeName}</p>
                    <p className="text-xs text-[var(--text-muted)]">{bal.position}</p>
                  </td>

                  {/* Département */}
                  <td className="px-5 py-4 text-sm text-[var(--text-muted)]">
                    {bal.departmentName ?? '—'}
                  </td>

                  {/* Ancienneté */}
                  <td className="px-5 py-4">
                    <p className="text-sm font-mono text-[var(--text-muted)]">
                      {Math.round(bal.monthsWorked)}m
                    </p>
                    {!bal.canTakeAnnualLeave && (
                      <p className="text-xs text-amber-500">{Math.round(bal.monthsUntilEligible)}m restants</p>
                    )}
                  </td>

                  {/* Solde */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cfg.bar}`}
                          style={{ width: `${Math.min(100, (bal.annualRemaining / cycleMaxFor(bal)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono text-[var(--text-muted)] whitespace-nowrap">
                        {Math.round(bal.annualRemaining)}j restant
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Acquis {Math.round(bal.annualEntitled)}j · Pris {Math.round(bal.annualTaken)}j
                      {bal.seniorityDays > 0 && <span> (dont {Math.round(bal.seniorityDays)}j ancienneté)</span>}
                    </p>
                    {(() => {
                      // ✅ Progression vers le plafond légal de base (26j/an,
                      // hors bonus ancienneté qui s'ajoute par-dessus) — utile
                      // pour savoir à quel moment son solde sera "complet".
                      const baseAccrued = Number(bal.annualEntitled) - Number(bal.seniorityDays || 0);
                      const gapToFullBase = Math.max(0, 26 - baseAccrued);
                      if (gapToFullBase <= 0) return null;
                      return (
                        <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-0.5">
                          Encore {Math.round(gapToFullBase * 10) / 10}j avant d'atteindre les 26j légaux
                        </p>
                      );
                    })()}
                    {bal.cycleEndDate && (
                      <p className="text-xs text-[var(--text-muted)]">
                        Fin de cycle prévue : {new Date(bal.cycleEndDate).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </td>

                  {/* Report */}
                  <td className="px-5 py-4">
                    {bal.carriedForward > 0 ? (
                      <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                        +{Math.round(bal.carriedForward)}j reportés
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">—</span>
                    )}
                  </td>

                  {/* Statut */}
                  <td className="px-5 py-4">
                    {bal.loadError ? (
                      <span
                        title={bal.loadError}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 cursor-help"
                      >
                        <AlertTriangle size={12} /> Erreur
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.badge}`}>
                        <Icon size={12} />
                        {cfg.label}
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {canAdjust && (
                        <button
                          onClick={() => openHistory(bal)}
                          title="Voir l'historique de ses congés (modifier / supprimer)"
                          className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors flex items-center"
                        >
                          <History size={14} className="text-[var(--text-muted)]" />
                        </button>
                      )}
                      {canAdjust && (
                        <button
                          onClick={() => openAdjust(bal)}
                          title="Ajuster le solde"
                          className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors flex items-center"
                        >
                          <Pencil size={14} className="text-[var(--text-muted)]" />
                        </button>
                      )}
                      <Link
                        href={bp(`/employes/${bal.employeeId}`)}
                        className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors flex items-center"
                      >
                        <ChevronRight size={14} className="text-[var(--text-muted)]" />
                      </Link>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modale de reprise du solde (dernier congé connu) ── */}
      {adjusting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Reprendre le solde</h3>
            <p className="text-sm text-[var(--text-muted)] mb-5">
              {adjusting.employeeName} — indique son dernier congé connu avant Konza RH. Le système calcule ensuite le solde réel lui-même à partir de cette date, au lieu d'un chiffre figé.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block">Type de ce dernier congé</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLastLeaveType('ANNUAL')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${lastLeaveType === 'ANNUAL' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-[var(--border)] text-[var(--text-muted)]'}`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setLastLeaveType('ANNUAL_ANTICIPATED')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${lastLeaveType === 'ANNUAL_ANTICIPATED' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-[var(--border)] text-[var(--text-muted)]'}`}
                  >
                    Anticipé
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  {lastLeaveType === 'ANNUAL'
                    ? "Congé normal : il clôturait son cycle, le compteur repart de 0 à sa date de retour."
                    : "Congé pris avant la fin de son cycle : le cycle en cours continue, seul le solde restant doit être précisé."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block">Date de départ</label>
                  <input
                    type="date"
                    value={lastLeaveStart}
                    onChange={(e) => setLastLeaveStart(e.target.value)}
                    className="w-full p-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block">Date de retour</label>
                  <input
                    type="date"
                    value={lastLeaveEnd}
                    onChange={(e) => setLastLeaveEnd(e.target.value)}
                    className="w-full p-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)]"
                  />
                </div>
              </div>
              {lastLeaveType === 'ANNUAL_ANTICIPATED' && (
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block">Jours restants après ce congé anticipé</label>
                  <input
                    type="number" step="0.5" min="0"
                    value={remainingDays}
                    onChange={(e) => setRemainingDays(e.target.value)}
                    placeholder="Ex. : 14"
                    className="w-full p-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)]"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setAdjusting(null)}
                disabled={isSavingAdjust}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-sm font-semibold disabled:opacity-50"
              >
                <X size={15} className="inline mr-1" /> Annuler
              </button>
              <button
                onClick={saveAdjust}
                disabled={isSavingAdjust}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingAdjust ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Panneau historique des congés de l'employé (modifier / supprimer) ── */}
      <AnimatePresence>
        {historyEmployee && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex justify-end"
            onClick={() => setHistoryEmployee(null)}
          >
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="w-full max-w-md h-full bg-[var(--surface)] overflow-y-auto p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)]">{historyEmployee.employeeName}</h2>
                  <p className="text-xs text-[var(--text-muted)]">Historique des congés</p>
                </div>
                <button onClick={() => setHistoryEmployee(null)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                  <X size={20} />
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="animate-spin text-emerald-500" />
                </div>
              ) : !history?.history?.length ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-16">Aucun congé enregistré pour cet employé.</p>
              ) : (
                <div className="space-y-2">
                  {history.history.map((h: any) => {
                    const Icon = TYPE_ICONS[h.type] || Umbrella;
                    return (
                      <div key={`${h.kind}-${h.id}`} className="p-3 border border-[var(--border)] rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text)]">
                            <Icon size={14} className="text-[var(--text-muted)]" />
                            {TYPE_LABELS[h.type] || h.type}
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${STATUS_COLORS[h.status] || ''}`}>
                            {STATUS_LABELS[h.status] || h.status}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">{fmtDate(h.startDate)} → {fmtDate(h.endDate)} · {Math.round(Number(h.daysCount))}j</p>
                        {h.reason && <p className="text-xs text-[var(--text-muted)] mt-1 italic">"{h.reason}"</p>}
                        {h.kind === 'LEAVE' && h.returnConfirmed && Number(h.forfeitedDays) > 0 && (
                          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 inline-block px-1.5 py-0.5 rounded mt-1">
                            ↩ Retour anticipé le {fmtDate(h.actualReturnDate)} · {Math.round(Number(h.forfeitedDays))}j non pris
                          </p>
                        )}
                        {h.kind === 'LEAVE' && h.isCarryover && (
                          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 inline-block px-1.5 py-0.5 rounded mt-1 ml-1">
                            Rattrapage — non payé
                          </p>
                        )}
                        {h.kind === 'LEAVE' && (
                          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[var(--border)]">
                            <button
                              onClick={() => openEditItem(h)}
                              className="text-xs font-semibold px-2 py-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-1"
                            >
                              <Pencil size={12} /> Modifier
                            </button>
                            <button
                              onClick={() => { setDeleteError(''); setDeletingItem(h); }}
                              className="text-xs font-semibold px-2 py-1 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1"
                            >
                              <Trash2 size={12} /> Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {editingItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text)]">Modifier ce congé</h2>
              <button onClick={() => setEditingItem(null)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Modifie directement cette demande — dates/type ajustés sur la même ligne, sans jamais en créer une nouvelle ni impacter le calendrier en double.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)]">Type</label>
                <select
                  value={editForm.type}
                  onChange={e => setEditForm(f => ({ ...f, type: e.target.value as any }))}
                  className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                >
                  <option value="ANNUAL">Annuel</option>
                  <option value="ANNUAL_ANTICIPATED">Annuel anticipé</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Date de départ</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))}
                    className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Date de retour</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))}
                    className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>
            {editError && <div className="text-xs text-red-500">{editError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-sm font-semibold rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                Annuler
              </button>
              <button
                onClick={saveEditItem}
                disabled={isSavingEdit}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 disabled:opacity-40"
              >
                {isSavingEdit ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <h2 className="text-lg font-bold text-[var(--text)]">Supprimer ce congé ?</h2>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Le congé du {fmtDate(deletingItem.startDate)} au {fmtDate(deletingItem.endDate)} sera définitivement supprimé et le solde restauré s'il avait déjà été approuvé. Cette action est irréversible.
            </p>
            {deleteError && <div className="text-xs text-red-500">{deleteError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDeletingItem(null)} className="px-4 py-2 text-sm font-semibold rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                Annuler
              </button>
              <button
                onClick={confirmDeleteItem}
                disabled={isDeletingItem}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 disabled:opacity-40"
              >
                {isDeletingItem ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}