'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle, Banknote, Users, Clock, CheckCircle2,
  ChevronDown, Loader2, XCircle, ShieldAlert, RefreshCw,
  AlertCircle, Calendar, TrendingDown, Bell, FileWarning,
  FileX, CreditCard, Info, ChevronRight, Building2,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/services/api';

const MONTHS_FR    = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertLevel  = 'INFO' | 'WARNING' | 'CRITIQUE';
type Phase       = 'NO_BULLETIN' | 'UNPAID_BULLETIN' | 'MIXED';
type PhaseFilter = Phase | 'ALL';
type MonthFilter = string; // "3-2026" ou "ALL"

interface MoisNonPaye {
  id:             string | null;
  month:          number;
  year:           number;
  montant:        number;
  isApproximate:  boolean;
  bulletinStatus: 'NONE' | 'DRAFT' | 'VALIDATED';
  dueDate:        string;
  daysOverdue:    number;
  phase:          'NO_BULLETIN' | 'UNPAID_BULLETIN';
}

interface UnpaidEmployee {
  employeeId:     string;
  nom:            string;
  matricule:      string;
  poste:          string;
  department:     string | null;
  monthsLate:     number;
  maxDaysOverdue: number;
  totalDu:        number;
  hasApproximate: boolean;
  alertLevel:     AlertLevel;
  moisNonPayes:   MoisNonPaye[];
  oldestUnpaid:   MoisNonPaye;
  phase:          Phase;
}

interface UpcomingDue {
  hasDue:        boolean;
  count:         number;
  totalEstimate: number;
  daysUntilDue:  number;
  month:         number;
  year:          number;
}

interface DashboardData {
  companyId:               string;
  unpaidCount:             number;
  employeeCount:           number;
  totalDu:                 number;
  totalApproximate:        number;
  totalExact:              number;
  hasApproximateData:      boolean;
  maxMonthsLate:           number;
  alertLevel:              AlertLevel;
  employees:               UnpaidEmployee[];
  noBulletinEmployees:     UnpaidEmployee[];
  unpaidBulletinEmployees: UnpaidEmployee[];
  mixedEmployees:          UnpaidEmployee[];
  upcomingDue:             UpcomingDue;
}

interface TimelineEntry {
  id:               string;
  mois:             string;
  netSalary:        number;
  grossSalary:      number;
  status:           'PAID' | 'LATE' | 'PENDING';
  bulletinStatus:   string;
  paidAt:           string | null;
  paymentReference: string | null;
  dueDate:          string;
  daysOverdue:      number;
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmt  = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';
const fmtN = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

const ALERT_STYLES: Record<AlertLevel, { bg: string; border: string; text: string; badge: string; dot: string; icon: React.ElementType }> = {
  INFO:     { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', dot: 'bg-emerald-400', icon: AlertCircle  },
  WARNING:  { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', dot: 'bg-amber-400', icon: AlertTriangle },
  CRITIQUE: { bg: 'bg-red-50 dark:bg-red-950/30',     border: 'border-red-200 dark:border-red-800',     text: 'text-red-700 dark:text-red-400',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',     dot: 'bg-red-500',   icon: ShieldAlert  },
};

// Badge montant : approx = tiret + mention, exact = montant normal
function MontantBadge({ montant, isApproximate, className = '' }: { montant: number; isApproximate: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 font-bold ${className}`}>
      {isApproximate
        ? <span className="flex items-center gap-1">
            <span className="text-gray-400 text-xs font-normal">≈</span>
            {fmtN(montant)} FCFA
            <span title="Montant approximatif basé sur le salaire de base. Le bulletin n'a pas encore été généré."
              className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 cursor-help text-[9px] font-bold leading-none">?</span>
          </span>
        : <span>{fmtN(montant)} FCFA</span>
      }
    </span>
  );
}

// Badge statut bulletin
function BulletinStatusBadge({ status }: { status: 'NONE' | 'DRAFT' | 'VALIDATED' }) {
  const styles = {
    NONE:      'bg-[var(--surface-2)] text-[var(--text-muted)]',
    DRAFT:     'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    VALIDATED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  };
  const labels = { NONE: 'Pas de bulletin', DRAFT: 'Brouillon', VALIDATED: 'Validé' };
  return (
    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// Badge phase employé
function PhaseBadge({ phase }: { phase: Phase }) {
  if (phase === 'NO_BULLETIN') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
      <FileX className="w-3 h-3" /> Paie non lancée
    </span>
  );
  if (phase === 'UNPAID_BULLETIN') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
      <CreditCard className="w-3 h-3" /> Bulletin non payé
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
      <AlertTriangle className="w-3 h-3" /> Mixte
    </span>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function UnpaidSalaryPage() {
  const [data,        setData]        = useState<DashboardData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [timelines,   setTimelines]   = useState<Record<string, TimelineEntry[]>>({});
  const [tlLoading,   setTlLoading]   = useState<string | null>(null);
  const [tlError,     setTlError]     = useState<Record<string, string>>({});
  const [alertFilter, setAlertFilter] = useState<AlertLevel | 'ALL'>('ALL');
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('ALL');
  const [monthFilter, setMonthFilter] = useState<MonthFilter>('ALL');

  const loadDashboard = useCallback(() => {
    setLoading(true); setError(null);
    api.get<DashboardData>('/unpaid-salary/dashboard')
      .then(d => setData(d))
      .catch(err => setError(err.message ?? 'Impossible de charger les données.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Mois disponibles pour le filtre
  const availableMonths = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const emp of data.employees)
      for (const m of emp.moisNonPayes)
        set.add(`${m.month}-${m.year}`);
    return Array.from(set).sort((a, b) => {
      const [ma, ya] = a.split('-').map(Number);
      const [mb, yb] = b.split('-').map(Number);
      return ya !== yb ? yb - ya : mb - ma;
    });
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.employees.filter(e => {
      if (alertFilter !== 'ALL' && e.alertLevel !== alertFilter) return false;
      if (phaseFilter !== 'ALL' && e.phase !== phaseFilter) return false;
      if (monthFilter !== 'ALL') {
        const [m, y] = monthFilter.split('-').map(Number);
        if (!e.moisNonPayes.some(mn => mn.month === m && mn.year === y)) return false;
      }
      return true;
    });
  }, [data, alertFilter, phaseFilter, monthFilter]);

  const toggleEmployee = async (emp: UnpaidEmployee) => {
    if (expanded === emp.employeeId) { setExpanded(null); return; }
    setExpanded(emp.employeeId);
    if (emp.phase === 'NO_BULLETIN' || timelines[emp.employeeId]) return;
    setTlLoading(emp.employeeId);
    setTlError(prev => ({ ...prev, [emp.employeeId]: '' }));
    try {
      const tl = await api.get<TimelineEntry[]>(`/unpaid-salary/employee/${emp.employeeId}/timeline`);
      setTimelines(prev => ({ ...prev, [emp.employeeId]: tl }));
    } catch (err: any) {
      setTlError(prev => ({ ...prev, [emp.employeeId]: err.message ?? 'Erreur.' }));
    } finally { setTlLoading(null); }
  };

  const hasRetards   = (data?.unpaidCount ?? 0) > 0;
  const hasUpcoming  = data?.upcomingDue?.hasDue ?? false;
  const hasAnyAlert  = hasRetards || hasUpcoming;
  const initials     = (nom: string) => nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const byLevel      = (l: AlertLevel) => (data?.employees ?? []).filter(e => e.alertLevel === l).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm text-gray-500">Analyse des salaires en cours…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--surface-2)] p-4 md:p-6 max-w-5xl mx-auto space-y-5">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shadow-lg ${hasAnyAlert ? 'bg-amber-500 shadow-amber-500/30' : 'bg-emerald-600 shadow-emerald-500/30'}`}>
            <Banknote className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">Suivi Salaires Impayés</h1>
            <p className="text-xs text-[var(--text-muted)]">Détection automatique basée sur la date de paiement prévue</p>
          </div>
        </div>
        <button onClick={loadDashboard} disabled={loading}
          className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── ERREUR ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl">
          <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-red-700">Erreur de chargement</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
            <button onClick={loadDashboard} className="mt-2 text-xs font-semibold text-red-700 underline">Réessayer</button>
          </div>
        </div>
      )}

      {/* ── PHASE 1&2 — Alerte préventive ── */}
      {hasUpcoming && data?.upcomingDue && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
          <Bell className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
              {data.upcomingDue.daysUntilDue === 0 ? `💰 Paiement des salaires prévu aujourd'hui`
                : `📅 Dans ${data.upcomingDue.daysUntilDue} jour(s) — date de paiement des salaires`}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              <strong>{data.upcomingDue.count} employé(s)</strong> pour{' '}
              <strong>{MONTHS_FR[data.upcomingDue.month - 1]} {data.upcomingDue.year}</strong> à payer.{' '}
              Total estimé : <strong>{fmt(data.upcomingDue.totalEstimate)}</strong>.
              {data.upcomingDue.daysUntilDue > 0 && ' Pensez à préparer les virements.'}
            </p>
          </div>
        </div>
      )}

      {/* ── TOUT À JOUR ── */}
      {!error && !hasAnyAlert && data && (
        <div className="flex items-center gap-3 p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-700">Tous les salaires sont à jour ✅</p>
            <p className="text-sm text-emerald-600">Aucun retard ni paiement imminent détecté.</p>
          </div>
        </div>
      )}

      {/* ── STAT CARDS — Vue d'ensemble claire ── */}
      {hasRetards && data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Paie non lancée"
            value={String(data.noBulletinEmployees.length + data.mixedEmployees.length)}
            sub="Aucun bulletin généré"
            icon={FileX}
            color={data.noBulletinEmployees.length > 0 ? 'bg-amber-600' : 'bg-gray-400'}
            onClick={() => setPhaseFilter(phaseFilter === 'NO_BULLETIN' ? 'ALL' : 'NO_BULLETIN')}
            active={phaseFilter === 'NO_BULLETIN'}
          />
          <StatCard
            label="Bulletins non payés"
            value={String(data.unpaidBulletinEmployees.length + data.mixedEmployees.length)}
            sub="Généré mais non payé"
            icon={CreditCard}
            color={data.unpaidBulletinEmployees.length > 0 ? 'bg-amber-500' : 'bg-gray-400'}
            onClick={() => setPhaseFilter(phaseFilter === 'UNPAID_BULLETIN' ? 'ALL' : 'UNPAID_BULLETIN')}
            active={phaseFilter === 'UNPAID_BULLETIN'}
          />
          <StatCard
            label="Mois de retard max"
            value={`${data.maxMonthsLate} mois`}
            sub={data.maxMonthsLate >= 3 ? '⚠️ Risque légal' : data.maxMonthsLate >= 2 ? 'À surveiller' : 'Acceptable'}
            icon={Clock}
            color={data.maxMonthsLate >= 3 ? 'bg-red-600' : data.maxMonthsLate >= 2 ? 'bg-amber-500' : 'bg-emerald-500'}
          />
          <StatCard
            label="Total estimé dû"
            value={fmt(data.totalDu)}
            sub={data.hasApproximateData ? `≈ dont ${fmt(data.totalApproximate)} approx.` : 'Montants exacts'}
            icon={TrendingDown}
            color="bg-gray-700"
          />
        </div>
      )}

      {/* ── EXPLICATION MONTANTS APPROXIMATIFS ── */}
      {data?.hasApproximateData && hasRetards && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-amber-700 dark:text-amber-400">
            <strong>Montants approximatifs (≈) :</strong> Pour les employés sans bulletin généré, le montant affiché est basé sur leur <strong>salaire de base</strong>.
            Le montant réel peut varier selon les heures sup, primes et absences.
            Générez les bulletins dans <strong>Paie → Générer</strong> pour obtenir les montants exacts.
          </div>
        </div>
      )}

      {/* ── BANNIÈRE ALERTE GLOBALE ── */}
      {data && data.maxMonthsLate >= 2 && (() => {
        const s = ALERT_STYLES[data.alertLevel];
        const Icon = s.icon;
        return (
          <div className={`flex items-start gap-3 p-4 ${s.bg} border ${s.border} rounded-2xl`}>
            <Icon className={`w-5 h-5 ${s.text} shrink-0 mt-0.5`} />
            <div>
              <p className={`font-semibold text-sm ${s.text}`}>
                {data.alertLevel === 'CRITIQUE'
                  ? `🔴 Situation critique — ${byLevel('CRITIQUE')} employé(s) avec 3+ mois de retard`
                  : `🟠 Retards de paiement — ${data.employeeCount} employé(s) concerné(s)`}
              </p>
              <p className={`text-xs mt-0.5 ${s.text} opacity-80`}>
                Art. 95 CT Congo : paiement à date fixe obligatoire.
                3 mois de retard = droit pour l'employé de saisir l'Inspection du Travail.
              </p>
            </div>
          </div>
        );
      })()}

      {/* ── FILTRES ── */}
      {hasRetards && (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filtres</p>

          {/* Filtre alerte */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Niveau d'alerte</p>
            <div className="flex gap-1.5 flex-wrap">
              {(['ALL', 'CRITIQUE', 'WARNING', 'INFO'] as const).map(f => (
                <button key={f} onClick={() => setAlertFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    alertFilter === f
                      ? 'bg-[var(--text)] text-[var(--bg)]'
                      : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)]'
                  }`}>
                  {f === 'ALL' ? `Tous (${data?.employees.length ?? 0})`
                    : <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${ALERT_STYLES[f].dot}`} />
                        {f} ({byLevel(f)})
                      </span>}
                </button>
              ))}
            </div>
          </div>

          {/* Filtre phase */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Situation</p>
            <div className="flex gap-1.5 flex-wrap">
              {([
                ['ALL',              'Toutes situations',    null],
                ['NO_BULLETIN',      '🚨 Paie non lancée',  data?.noBulletinEmployees.length ?? 0],
                ['UNPAID_BULLETIN',  '⚠️ Bulletin non payé', data?.unpaidBulletinEmployees.length ?? 0],
                ['MIXED',            '🔀 Mixte',             data?.mixedEmployees.length ?? 0],
              ] as [PhaseFilter, string, number | null][]).map(([f, label, count]) => (
                count !== 0 && (
                  <button key={f} onClick={() => setPhaseFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      phaseFilter === f
                        ? 'bg-[var(--text)] text-[var(--bg)]'
                        : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)]'
                    }`}>
                    {label}{count !== null ? ` (${count})` : ''}
                  </button>
                )
              ))}
            </div>
          </div>

          {/* Filtre par mois */}
          {availableMonths.length > 1 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Mois concerné</p>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => setMonthFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    monthFilter === 'ALL'
                      ? 'bg-[var(--text)] text-[var(--bg)]'
                      : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)]'
                  }`}>
                  Tous les mois
                </button>
                {availableMonths.map(key => {
                  const [m, y] = key.split('-').map(Number);
                  const label = `${MONTHS_FR[m - 1]} ${y}`;
                  const count = (data?.employees ?? []).filter(e =>
                    e.moisNonPayes.some(mn => mn.month === m && mn.year === y)
                  ).length;
                  return (
                    <button key={key} onClick={() => setMonthFilter(monthFilter === key ? 'ALL' : key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        monthFilter === key
                          ? 'bg-[var(--text)] text-[var(--bg)]'
                          : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)]'
                      }`}>
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RÉSUMÉ DU FILTRE ── */}
      {hasRetards && (alertFilter !== 'ALL' || phaseFilter !== 'ALL' || monthFilter !== 'ALL') && (
        <p className="text-xs text-gray-400 -mt-2 px-1">
          {filtered.length} employé(s) affiché(s) sur {data?.employees.length ?? 0}
          {monthFilter !== 'ALL' && (() => {
            const [m, y] = monthFilter.split('-').map(Number);
            return ` · ${MONTHS_FR[m - 1]} ${y}`;
          })()}
        </p>
      )}

      {/* ── LISTE EMPLOYÉS ── */}
      {hasRetards && (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun employé dans cette catégorie.</p>
            </div>
          )}
          {filtered.map(emp => {
            const s      = ALERT_STYLES[emp.alertLevel];
            const Icon   = s.icon;
            const isOpen = expanded === emp.employeeId;
            const tl     = timelines[emp.employeeId];
            const tlErr  = tlError[emp.employeeId];

            return (
              <div key={emp.employeeId} className={`rounded-2xl border ${s.border} overflow-hidden transition-shadow hover:shadow-md`}>

                {/* ── En-tête employé ── */}
                <button onClick={() => toggleEmployee(emp)}
                  className={`w-full flex items-center gap-3 p-4 ${s.bg} hover:brightness-[0.97] dark:hover:brightness-110 transition-all text-left`}>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${s.badge}`}>
                    {initials(emp.nom)}
                  </div>

                  {/* Infos principales */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[var(--text)] text-sm">{emp.nom}</span>
                      <PhaseBadge phase={emp.phase} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500">{emp.poste}</span>
                      {emp.department && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <Building2 className="w-3 h-3" />{emp.department}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">#{emp.matricule}</span>
                    </div>
                    {emp.maxDaysOverdue > 0 && (
                      <p className={`text-xs font-medium mt-0.5 ${s.text}`}>
                        {emp.maxDaysOverdue}j de retard (mois le plus ancien)
                      </p>
                    )}
                  </div>

                  {/* Métriques droite */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Mois</p>
                      <p className={`font-bold text-xl leading-tight ${s.text}`}>{emp.monthsLate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total dû</p>
                      <p className="font-bold text-[var(--text)] text-sm">
                        {emp.hasApproximate && <span className="text-amber-500 mr-0.5 text-xs">≈</span>}
                        {fmtN(emp.totalDu)}
                        <span className="text-xs font-normal text-gray-400 ml-0.5">FCFA</span>
                      </p>
                      {emp.hasApproximate && (
                        <p className="text-[10px] text-amber-500">approximatif</p>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* ── Détail déplié ── */}
                {isOpen && (
                  <div className="bg-[var(--surface)] border-t border-[var(--border)]">

                    {/* Pills mois */}
                    <div className="p-4 pb-0">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Détail par mois
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {emp.moisNonPayes.map(m => (
                          <div key={`${m.month}-${m.year}`}
                            className={`flex items-center justify-between p-3 rounded-xl border text-sm ${
                              m.phase === 'NO_BULLETIN'
                                ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                                : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/50'
                            }`}>
                            <div>
                              <p className="font-semibold text-[var(--text)] text-xs">
                                {MONTHS_FR[m.month - 1]} {m.year}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <BulletinStatusBadge status={m.bulletinStatus} />
                                {m.daysOverdue > 0 && (
                                  <span className="text-[10px] text-red-500 font-semibold">+{m.daysOverdue}j</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <MontantBadge
                                montant={m.montant}
                                isApproximate={m.isApproximate}
                                className={`text-xs ${m.phase === 'NO_BULLETIN' ? 'text-amber-700 dark:text-amber-300' : 'text-amber-700 dark:text-amber-300'}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Message action selon phase */}
                    <div className="px-4 pt-3">
                      {emp.phase === 'NO_BULLETIN' && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                          <FileX className="w-4 h-4 shrink-0" />
                          <span>Aucun bulletin généré pour ces périodes. Les montants sont basés sur le salaire de base.</span>
                          <ArrowRight className="w-3 h-3 shrink-0 ml-auto" />
                          <strong>Paie → Générer</strong>
                        </div>
                      )}
                      {emp.phase === 'UNPAID_BULLETIN' && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                          <CreditCard className="w-4 h-4 shrink-0" />
                          <span>Bulletins générés mais paiement non effectué. Marquez comme payé après virement.</span>
                          <ArrowRight className="w-3 h-3 shrink-0 ml-auto" />
                          <strong>Paie → Bulletins</strong>
                        </div>
                      )}
                      {emp.phase === 'MIXED' && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <span>Situation mixte : certains mois sans bulletin + d'autres non payés. Action double requise.</span>
                        </div>
                      )}
                    </div>

                    {/* Timeline bulletins (phase 4 uniquement) */}
                    {(emp.phase === 'UNPAID_BULLETIN' || emp.phase === 'MIXED') && (
                      <div className="px-4 pt-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Historique des paiements</p>
                        {tlLoading === emp.employeeId && (
                          <div className="flex justify-center py-3"><Loader2 className="w-5 h-5 text-gray-400 animate-spin" /></div>
                        )}
                        {tlErr && (
                          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                            <XCircle className="w-4 h-4 shrink-0" />{tlErr}
                          </div>
                        )}
                        {tl && tl.length > 0 && (
                          <div className="space-y-1 max-h-56 overflow-y-auto">
                            {tl.map(t => {
                              const isPaid = t.status === 'PAID';
                              const isLate = t.status === 'LATE';
                              return (
                                <div key={t.id} className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                                  isLate ? 'bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900' :
                                  !isPaid ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50' :
                                  'bg-[var(--surface-2)]/40'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    {isPaid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                     : isLate ? <XCircle className="w-3.5 h-3.5 text-red-500" />
                                              : <Clock className="w-3.5 h-3.5 text-amber-500" />}
                                    <span className="font-medium text-[var(--text)]">{t.mois}</span>
                                    <BulletinStatusBadge status={t.bulletinStatus as any} />
                                    {isLate && t.daysOverdue > 0 && <span className="text-red-500 font-bold">· {t.daysOverdue}j</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-[var(--text)]">{fmtN(t.netSalary)} FCFA</span>
                                    {isPaid && t.paidAt && (
                                      <span className="text-gray-400 hidden sm:inline">
                                        Payé le {new Date(t.paidAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                      </span>
                                    )}
                                    <span className={`px-1.5 py-0.5 rounded-md font-semibold hidden sm:inline ${
                                      isPaid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                      isLate ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                               'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                      {isPaid ? 'Payé' : isLate ? 'En retard' : 'En attente'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Récap total */}
                    <div className={`m-4 flex items-center justify-between p-3 ${s.bg} rounded-xl border ${s.border}`}>
                      <div>
                        <p className={`font-semibold text-sm ${s.text}`}>{emp.nom.split(' ')[0]} — récapitulatif</p>
                        <p className="text-xs text-gray-400">
                          {emp.monthsLate} mois · depuis {MONTHS_FR[emp.oldestUnpaid.month - 1]} {emp.oldestUnpaid.year}
                          {emp.hasApproximate && ' · dont montants approximatifs'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${s.text}`}>
                          {emp.hasApproximate && <span className="text-amber-500 mr-1 text-sm">≈</span>}
                          {fmt(emp.totalDu)}
                        </p>
                        {emp.hasApproximate && (
                          <p className="text-[10px] text-amber-500 font-medium">montant approx.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── RAPPEL LÉGAL ── */}
      <div className="p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> Rappel légal — Code du Travail Congo
        </p>
        <div className="space-y-1 text-xs text-[var(--text-muted)]">
          <p><strong className="text-[var(--text)]">Art. 95 CT</strong> — Salaires payés à intervalles réguliers et à date fixe convenue.</p>
          <p><strong className="text-[var(--text)]">3+ mois impayés</strong> — L'employé peut saisir l'Inspecteur du Travail.</p>
          <p><strong className="text-[var(--text)]">Sanctions</strong> — Amende + dommages-intérêts en cas de retard injustifié.</p>
          <p><strong className="text-[var(--text)]">Conseil</strong> — En cas de difficulté, documenter un accord de paiement échelonné.</p>
        </div>
      </div>

    </div>
  );
}

// ─── Composant StatCard cliquable ─────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color, onClick, active,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; color: string;
  onClick?: () => void; active?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--surface)] rounded-2xl border p-4 shadow-sm transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } ${active ? 'border-[var(--text)] ring-1 ring-[var(--text)]' : 'border-[var(--border)]'}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${color}`}><Icon className="w-4 h-4 text-white" /></div>
        <div className="min-w-0">
          <p className="text-xs text-[var(--text-muted)] font-medium leading-tight">{label}</p>
          <p className="font-bold text-[var(--text)] text-sm mt-0.5 truncate">{value}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>
        </div>
      </div>
    </div>
  );
}