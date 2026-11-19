'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle, Banknote, Users, Clock, CheckCircle2,
  ChevronDown, XCircle, ShieldAlert, RefreshCw,
  AlertCircle, Calendar, TrendingDown, Bell, FileWarning,
  FileX, CreditCard, Info, ChevronRight, Building2,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/services/api';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { ModulePageFrame, ModulePageSkeleton } from '@/components/requests/ModulePageFrame';

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
  estimateSource: 'BULLETIN' | 'SIMULATION' | 'BASE_SALARY';
  bulletinStatus: 'NONE' | 'DRAFT' | 'VALIDATED' | 'TO_PAY';
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
  hasFallback:    boolean;
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
  totalFallback:           number;
  hasApproximateData:      boolean;
  hasFallbackData:         boolean;
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
  INFO:     { bg: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] ', border: 'border-[var(--border)] ', text: 'text-[var(--success-text)] ', badge: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]  ', dot: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]', icon: AlertCircle  },
  WARNING:  { bg: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] ', border: 'border-[var(--border)] ', text: 'text-[var(--warning-text)] ', badge: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]  ', dot: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]', icon: AlertTriangle },
  CRITIQUE: { bg: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] ',     border: 'border-[var(--border)] ',     text: 'text-[var(--danger-text)] ',     badge: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)]  ',     dot: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]',   icon: ShieldAlert  },
};

// Badge montant : exact = montant normal ; simulation = « ≈ » ; repli = « ≈ » rouge « base » (salaire de base seulement)
function MontantBadge({ montant, isApproximate, source, className = '' }: { montant: number; isApproximate: boolean; source?: 'BULLETIN' | 'SIMULATION' | 'BASE_SALARY'; className?: string }) {
  const isFallback = isApproximate && source === 'BASE_SALARY';
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${className}`}>
      {isApproximate
        ? <span className="flex items-center gap-1">
            <span className={`text-xs font-normal ${isFallback ? 'text-[var(--danger-text)]' : 'text-[var(--text-secondary)]'}`}>≈</span>
            {fmtN(montant)} FCFA
            {isFallback
              ? <span title="Estimation de secours : seul le salaire de base est affiché (le calcul détaillé — présences, primes, retenues — n'a pas pu être fait). Cliquez sur Actualiser pour réessayer."
                  className="inline-flex items-center justify-center px-1 h-3.5 rounded-full bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  text-[var(--danger-text)]  cursor-help text-[9px] font-semibold leading-none">base</span>
              : <span title="Montant calculé comme la paie le ferait (salaire, primes, heures sup si activées, indemnités, retenues). Le bulletin n'a pas encore été généré."
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  text-[var(--warning-text)]  cursor-help text-[9px] font-semibold leading-none">?</span>
            }
          </span>
        : <span>{fmtN(montant)} FCFA</span>
      }
    </span>
  );
}

// Badge statut bulletin
function BulletinStatusBadge({ status }: { status: 'NONE' | 'DRAFT' | 'VALIDATED' | 'TO_PAY' }) {
  const styles = {
    NONE:      'bg-[var(--surface-2)] text-[var(--text-muted)]',
    DRAFT:     'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]  ',
    VALIDATED: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]  ',
    TO_PAY:    'bg-[var(--brand-soft)] text-[var(--action)]  ',
  };
  const labels = { NONE: 'Pas de bulletin', DRAFT: 'Brouillon', VALIDATED: 'Validé', TO_PAY: 'À payer' };
  return (
    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// Badge phase employé
function PhaseBadge({ phase }: { phase: Phase }) {
  if (phase === 'NO_BULLETIN') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]  ">
      <FileX className="w-3 h-3" /> Paie non lancée
    </span>
  );
  if (phase === 'UNPAID_BULLETIN') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]  ">
      <CreditCard className="w-3 h-3" /> Bulletin non payé
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)]  ">
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

  // force = true (bouton « Actualiser ») : recalcule les estimations au lieu de lire le cache serveur
  const loadDashboard = useCallback((force = false) => {
    setLoading(true); setError(null);
    api.get<DashboardData>(force ? '/unpaid-salary/dashboard?refresh=1' : '/unpaid-salary/dashboard')
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

  if (loading) return <ModulePageSkeleton label="Analyse des salaires en cours…" />;

  return (
    <ModulePageFrame kind="list">
      <div className="min-h-screen bg-[var(--surface-2)] p-4 md:p-6 max-w-5xl mx-auto space-y-5">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shadow-lg ${hasAnyAlert ? 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] ' : 'bg-[var(--brand)] '}`}>
            <Banknote className="w-6 h-6 text-[var(--on-brand)]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text)]">Suivi Salaires Impayés</h1>
            <p className="text-xs text-[var(--text-muted)]">Détection automatique basée sur la date de paiement prévue</p>
          </div>
        </div>
        <button onClick={() => loadDashboard(true)} disabled={loading} title="Actualiser (recalcule les estimations)"
          className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── ERREUR ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  border border-[var(--border)]  rounded-2xl">
          <XCircle className="w-5 h-5 text-[var(--danger-text)] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-[var(--danger-text)] ">Erreur de chargement</p>
            <p className="text-xs text-[var(--danger-text)] mt-0.5">{error}</p>
            <button onClick={() => loadDashboard(true)} className="mt-2 text-xs font-semibold text-[var(--danger-text)]  underline">Réessayer</button>
          </div>
        </div>
      )}

      {/* ── PHASE 1&2 — Alerte préventive ── */}
      {hasUpcoming && data?.upcomingDue && (
        <div className="flex items-start gap-3 p-4 bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  border border-[var(--border)]  rounded-2xl">
          <Bell className="w-5 h-5 text-[var(--success-text)] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-[var(--success-text)] ">
              {data.upcomingDue.daysUntilDue === 0 ? `💰 Paiement des salaires prévu aujourd'hui`
                : `📅 Dans ${data.upcomingDue.daysUntilDue} jour(s) — date de paiement des salaires`}
            </p>
            <p className="text-xs text-[var(--success-text)]  mt-1">
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
        <div className="flex items-center gap-3 p-5 bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  border border-[var(--border)]  rounded-2xl">
          <CheckCircle2 className="w-6 h-6 text-[var(--success-text)] shrink-0" />
          <div>
            <p className="font-semibold text-[var(--success-text)] ">Tous les salaires sont à jour ✅</p>
            <p className="text-sm text-[var(--success-text)]">Aucun retard ni paiement imminent détecté.</p>
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
            color={data.noBulletinEmployees.length > 0 ? 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]' : 'bg-[var(--surface-2)]'}
            onClick={() => setPhaseFilter(phaseFilter === 'NO_BULLETIN' ? 'ALL' : 'NO_BULLETIN')}
            active={phaseFilter === 'NO_BULLETIN'}
          />
          <StatCard
            label="Bulletins non payés"
            value={String(data.unpaidBulletinEmployees.length + data.mixedEmployees.length)}
            sub="Généré mais non payé"
            icon={CreditCard}
            color={data.unpaidBulletinEmployees.length > 0 ? 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]' : 'bg-[var(--surface-2)]'}
            onClick={() => setPhaseFilter(phaseFilter === 'UNPAID_BULLETIN' ? 'ALL' : 'UNPAID_BULLETIN')}
            active={phaseFilter === 'UNPAID_BULLETIN'}
          />
          <StatCard
            label="Mois de retard max"
            value={`${data.maxMonthsLate} mois`}
            sub={data.maxMonthsLate >= 3 ? '⚠️ Risque légal' : data.maxMonthsLate >= 2 ? 'À surveiller' : 'Acceptable'}
            icon={Clock}
            color={data.maxMonthsLate >= 3 ? 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]' : data.maxMonthsLate >= 2 ? 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]' : 'bg-[var(--brand)]'}
          />
          <StatCard
            label="Total estimé dû"
            value={fmt(data.totalDu)}
            sub={data.hasApproximateData ? `≈ dont ${fmt(data.totalApproximate)} approx.` : 'Montants exacts'}
            icon={TrendingDown}
            color="bg-[var(--surface-2)]"
          />
        </div>
      )}

      {/* ── EXPLICATION MONTANTS APPROXIMATIFS ── */}
      {data?.hasApproximateData && hasRetards && (
        <div className="flex items-start gap-2.5 p-3 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)]  rounded-xl text-xs">
          <Info className="w-4 h-4 text-[var(--warning-text)] shrink-0 mt-0.5" />
          <div className="text-[var(--warning-text)] ">
            <strong>Montants estimés (≈) :</strong> Pour les employés sans bulletin généré, le montant affiché est calculé <strong>comme le fait la paie</strong> (salaire, primes au prorata, heures sup si activées, indemnités, retenues).
            Il devient définitif dès que le bulletin est généré dans <strong>Paie → Générer</strong>.
          </div>
        </div>
      )}

      {/* ── ALERTE : montants de secours (salaire de base seulement) ── */}
      {data?.hasFallbackData && hasRetards && (
        <div className="flex items-start gap-2.5 p-3 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  border border-[var(--border)]  rounded-xl text-xs">
          <AlertTriangle className="w-4 h-4 text-[var(--danger-text)] shrink-0 mt-0.5" />
          <div className="text-[var(--danger-text)] ">
            <strong>Total partiellement sous-estimé :</strong> {fmt(data.totalFallback)} de ce total sont de simples salaires de base (badge « base »),
            car le calcul détaillé n'a pas pu être fait pour ces mois. Cliquez sur <strong>Actualiser</strong> pour réessayer.
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
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Filtres</p>

          {/* Filtre alerte */}
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-1.5">Niveau d'alerte</p>
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
            <p className="text-xs text-[var(--text-secondary)] mb-1.5">Situation</p>
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
              <p className="text-xs text-[var(--text-secondary)] mb-1.5">Mois concerné</p>
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
        <p className="text-xs text-[var(--text-secondary)] -mt-2 px-1">
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
            <div className="text-center py-10 text-[var(--text-secondary)]">
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${s.badge}`}>
                    {initials(emp.nom)}
                  </div>

                  {/* Infos principales */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[var(--text)] text-sm">{emp.nom}</span>
                      <PhaseBadge phase={emp.phase} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-[var(--text-secondary)]">{emp.poste}</span>
                      {emp.department && (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                          <Building2 className="w-3 h-3" />{emp.department}
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-secondary)]">#{emp.matricule}</span>
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
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Mois</p>
                      <p className={`font-semibold text-xl leading-tight ${s.text}`}>{emp.monthsLate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Total dû</p>
                      <p className="font-semibold text-[var(--text)] text-sm">
                        {emp.hasApproximate && <span className="text-[var(--warning-text)] mr-0.5 text-xs">≈</span>}
                        {fmtN(emp.totalDu)}
                        <span className="text-xs font-normal text-[var(--text-secondary)] ml-0.5">FCFA</span>
                      </p>
                      {emp.hasApproximate && (
                        <p className="text-[10px] text-[var(--warning-text)]">approximatif</p>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* ── Détail déplié ── */}
                {isOpen && (
                  <div className="bg-[var(--surface)] border-t border-[var(--border)]">

                    {/* Pills mois */}
                    <div className="p-4 pb-0">
                      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                        Détail par mois
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {emp.moisNonPayes.map(m => (
                          <div key={`${m.month}-${m.year}`}
                            className={`flex items-center justify-between p-3 rounded-xl border text-sm ${
                              m.phase === 'NO_BULLETIN'
                                ? 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] border-[var(--border)]  '
                                : 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] border-[var(--border)]  '
                            }`}>
                            <div>
                              <p className="font-semibold text-[var(--text)] text-xs">
                                {MONTHS_FR[m.month - 1]} {m.year}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <BulletinStatusBadge status={m.bulletinStatus} />
                                {m.daysOverdue > 0 && (
                                  <span className="text-[10px] text-[var(--danger-text)] font-semibold">+{m.daysOverdue}j</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <MontantBadge
                                montant={m.montant}
                                isApproximate={m.isApproximate}
                                source={m.estimateSource}
                                className={`text-xs ${m.phase === 'NO_BULLETIN' ? 'text-[var(--warning-text)] ' : 'text-[var(--warning-text)] '}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Message action selon phase */}
                    <div className="px-4 pt-3">
                      {emp.phase === 'NO_BULLETIN' && (
                        <div className="flex items-center gap-2 p-3 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)]  rounded-xl text-xs text-[var(--warning-text)] ">
                          <FileX className="w-4 h-4 shrink-0" />
                          <span>Aucun bulletin généré pour ces périodes. Les montants sont calculés comme la paie le ferait.</span>
                          <ArrowRight className="w-3 h-3 shrink-0 ml-auto" />
                          <strong>Paie → Générer</strong>
                        </div>
                      )}
                      {emp.phase === 'UNPAID_BULLETIN' && (
                        <div className="flex items-center gap-2 p-3 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)]  rounded-xl text-xs text-[var(--warning-text)] ">
                          <CreditCard className="w-4 h-4 shrink-0" />
                          <span>Bulletins générés mais paiement non effectué. Marquez comme payé après virement.</span>
                          <ArrowRight className="w-3 h-3 shrink-0 ml-auto" />
                          <strong>Paie → Bulletins</strong>
                        </div>
                      )}
                      {emp.phase === 'MIXED' && (
                        <div className="flex items-center gap-2 p-3 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  border border-[var(--border)]  rounded-xl text-xs text-[var(--danger-text)] ">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <span>Situation mixte : certains mois sans bulletin + d'autres non payés. Action double requise.</span>
                        </div>
                      )}
                    </div>

                    {/* Timeline bulletins (phase 4 uniquement) */}
                    {(emp.phase === 'UNPAID_BULLETIN' || emp.phase === 'MIXED') && (
                      <div className="px-4 pt-3">
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Historique des paiements</p>
                        {tlLoading === emp.employeeId && (
                          <KonzaLoader variant="inline" />
                        )}
                        {tlErr && (
                          <div className="flex items-center gap-2 p-3 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] border border-[var(--border)] rounded-xl text-xs text-[var(--danger-text)]">
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
                                  isLate ? 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  border border-[var(--border)] ' :
                                  !isPaid ? 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)] ' :
                                  'bg-[var(--surface-2)]/40'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    {isPaid ? <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success-text)]" />
                                     : isLate ? <XCircle className="w-3.5 h-3.5 text-[var(--danger-text)]" />
                                              : <Clock className="w-3.5 h-3.5 text-[var(--warning-text)]" />}
                                    <span className="font-medium text-[var(--text)]">{t.mois}</span>
                                    <BulletinStatusBadge status={t.bulletinStatus as any} />
                                    {isLate && t.daysOverdue > 0 && <span className="text-[var(--danger-text)] font-semibold">· {t.daysOverdue}j</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-[var(--text)]">{fmtN(t.netSalary)} FCFA</span>
                                    {isPaid && t.paidAt && (
                                      <span className="text-[var(--text-secondary)] hidden sm:inline">
                                        Payé le {new Date(t.paidAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                      </span>
                                    )}
                                    <span className={`px-1.5 py-0.5 rounded-md font-semibold hidden sm:inline ${
                                      isPaid ? 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]  ' :
                                      isLate ? 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)]  ' :
                                               'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]  '
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
                        <p className="text-xs text-[var(--text-secondary)]">
                          {emp.monthsLate} mois · depuis {MONTHS_FR[emp.oldestUnpaid.month - 1]} {emp.oldestUnpaid.year}
                          {emp.hasApproximate && ' · dont montants approximatifs'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold text-lg ${s.text}`}>
                          {emp.hasApproximate && <span className="text-[var(--warning-text)] mr-1 text-sm">≈</span>}
                          {fmt(emp.totalDu)}
                        </p>
                        {emp.hasApproximate && (
                          <p className="text-[10px] text-[var(--warning-text)] font-medium">montant approx.</p>
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
        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
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
    </ModulePageFrame>
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
        <div className={`p-2 rounded-lg shrink-0 ${color}`}><Icon className="w-4 h-4 text-[var(--on-brand)]" /></div>
        <div className="min-w-0">
          <p className="text-xs text-[var(--text-muted)] font-medium leading-tight">{label}</p>
          <p className="font-semibold text-[var(--text)] text-sm mt-0.5 truncate">{value}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{sub}</p>
        </div>
      </div>
    </div>
  );
}