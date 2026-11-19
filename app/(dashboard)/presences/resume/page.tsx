'use client';
import { AttendanceSelect } from '@/components/attendance/AttendanceSelect';

import { AttendanceLoadError } from '@/components/attendance/AttendanceLoadError';
import { AttendanceModuleFrame } from '@/components/attendance/AttendanceModuleFrame';
import { useModuleVisuals } from '@/components/requests/ModulePageFrame';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText, Download, Filter, Search, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Printer, Mail, Lock, ArrowRight,
  Calendar, Clock, Users, TrendingUp, MoreHorizontal, Loader2,
  FileSpreadsheet, ArrowUpRight, ArrowDownRight, Send, Moon,
  UserX, CalendarOff, CalendarCheck, Percent, BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, AreaChart, Area,
} from 'recharts';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import PresenceSubNav from '@/components/PresenceSubNav';

// ============================================================================
// ✅ Interface alignée sur MonthlyReportItem  — Décret 78-360
// ============================================================================
interface DayDetail {
  date:         string;
  status?:      string;
  in:           string;
  out:          string;
  total:        string;
  ot10?:        string;
  ot25?:        string;
  ot50?:        string;
  ot100?:       string;
  type:         string;
  leaveType?:   string;
  absenceType?: string;
  isPaid?:      boolean;
}

interface AttendanceSummary {
  id: string;
  employeeId: string;
  name: string;
  matricule: string;
  avatar: string;
  department: string;
  daysPresent: number;
  daysWorked?: number;            // 🆕 jours où l'employé a réellement pointé
  daysWorkedOnRest?: number;      // dont jours de repos / fériés travaillés
  daysWorkedDuringLeave?: number; // dont jours pointés pendant un congé
  daysLate: number;
  daysRemote: number;
  daysOnLeave: number;
  daysHoliday: number;
  daysOffDay: number;
  daysAbsentUnpaid: number;
  daysAbsentPaid: number;
  normalHours: number;
  overtime10: number;
  overtime25: number;
  overtime50: number;
  overtime100: number;
  extraHoursInfo?: number; // 🆕 heures en plus à titre informatif (non payées)
  overtimeEnabled?: boolean; // 🔒 false = HS désactivées : aucune HS affichée
  totalHours: number;
  status: 'perfect' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  details: DayDetail[];
}

// ─── Libellés français ───────────────────────────────────────────────────────
const MONTHS = [
  { value: '01', label: 'Janvier' }, { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },    { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },     { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' }, { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' }, { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' },
];

const STATUS_LABELS: Record<string, string> = {
  PRESENT:       'Présent',
  ABSENT:        'Absent',
  LEAVE:         'Congé',
  HOLIDAY:       'Jour férié',
  OFF_DAY:       'Repos',
  ABSENT_UNPAID: 'Absence non payée',
  ABSENT_PAID:   'Absence payée',
  REMOTE:        'Télétravail',
  LATE:          'Retard',
  FUTURE:        'À venir',
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL:       'Congé annuel',
  SICK:         'Congé maladie',
  MATERNITY:    'Congé maternité',
  PATERNITY:    'Congé paternité',
  UNPAID:       'Congé sans solde',
  COMPENSATORY: 'Récupération',
};

const ABSENCE_TYPE_LABELS: Record<string, string> = {
  MALADIE:         'Maladie',
  CONVENTIONNELLE: 'Conventionnelle',
  EXCEPTIONNELLE:  'Exceptionnelle',
};

function getTypeLabel(det: DayDetail): string {
  if (det.type === 'LEAVE' && det.leaveType) {
    return LEAVE_TYPE_LABELS[det.leaveType] || STATUS_LABELS.LEAVE;
  }
  if ((det.type === 'ABSENT_PAID' || det.type === 'ABSENT_UNPAID') && det.absenceType) {
    return `${STATUS_LABELS[det.type]} · ${ABSENCE_TYPE_LABELS[det.absenceType] || det.absenceType}`;
  }
  return STATUS_LABELS[det.type] || det.type;
}

function getTypeBadgeColor(type: string): string {
  switch (type) {
    case 'PRESENT':       return 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]  ';
    case 'REMOTE':        return 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]  ';
    case 'LATE':          return 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]  ';
    case 'LEAVE':         return 'bg-[var(--surface-2)] text-[var(--text-muted)]';
    case 'HOLIDAY':       return 'bg-[var(--surface-2)] text-[var(--text-muted)]';
    case 'OFF_DAY':       return 'bg-[var(--surface-2)] text-[var(--text-muted)]';
    case 'ABSENT_PAID':   return 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]  ';
    case 'ABSENT_UNPAID':
    case 'ABSENT':        return 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)]  ';
    case 'FUTURE':         return 'bg-[var(--surface-2)] text-[var(--text-muted)]';
    default:               return 'bg-[var(--surface-2)] text-[var(--text-muted)]';
  }
}

function AttendanceResumePageContent() {
  const [uiLoadError,setUiLoadError]=useState('');
  const {motion:uiMotion}=useModuleVisuals();
  const { bp } = useBasePath();
  const router = useRouter();

  const [userRole, setUserRole] = useState('');
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
  }, []);
  const canManage = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(userRole);

  // ✅ Par défaut : mois et année en cours
  const now = new Date();
  const currentYear = now.getFullYear();
  const YEARS = [currentYear - 1, currentYear, currentYear + 1];

  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(currentYear);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState<AttendanceSummary[] | null>(null);
  // 🔒 HS désactivées pour l'entreprise : on ne montre AUCUNE heure sup (cartes, colonnes, badges, export)
  const otOn = !(data ?? []).some(r => r.overtimeEnabled === false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const [isValidated, setIsValidated] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    setProgress(10);
    setData(null);
    setIsValidated(false);

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + Math.random() * 20;
      });
    }, 200);

    try {
      const reportData = await api.get<AttendanceSummary[]>(`/attendance/report?month=${month}&year=${year}`);
      setProgress(100);
      setTimeout(() => {
        clearInterval(interval);
        setIsGenerating(false);
        setData(reportData);
      setUiLoadError('');
      }, 500);
    } catch (e) {
      clearInterval(interval);
      setIsGenerating(false);
      alert("Erreur lors de la génération du rapport");
      setUiLoadError('Impossible de charger les pr\u00e9sences. R\u00e9essayez.');
    }
  };

  // ✅ Génération automatique du résumé du mois en cours à l'ouverture de la page
  useEffect(() => {
    generateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePeriodChange = (nextMonth: string, nextYear: number) => {
    setMonth(nextMonth);
    setYear(nextYear);
    setData(null);
    setIsValidated(false);
  };

  const handleSendToPayroll = () => {
    router.push(bp('/paie/nouveau'));
  };

  const handleExport = async () => {
    if (!data || data.length === 0) return;
    setIsExporting(true);
    try {
      const XLSX = await import('xlsx');
      const monthLabel = MONTHS.find(m => m.value === month)?.label || month;

      const summaryRows = data.map(r => ({
        'Employé':              r.name,
        'Matricule':            r.matricule,
        'Département':          r.department,
        'Jours présents':       r.daysPresent,
        'Jours travaillés (pointés)': r.daysWorked ?? (r.daysPresent + r.daysLate + r.daysRemote),
        'Dont repos/férié travaillés': r.daysWorkedOnRest ?? 0,
        'Retards':              r.daysLate,
        'Télétravail':          r.daysRemote,
        'Congés':               r.daysOnLeave,
        'Absences payées':      r.daysAbsentPaid,
        'Absences non payées':  r.daysAbsentUnpaid,
        'Repos':                r.daysOffDay,
        'Jours fériés':         r.daysHoliday,
        'Heures normales':      r.normalHours,
        ...(otOn ? {
          'HS +10%':              r.overtime10,
          'HS +25%':              r.overtime25,
          'HS Nuit +50%':         r.overtime50,
          'HS Nuit +100%':        r.overtime100,
        } : {}),
        'Heures en plus (info)': r.extraHoursInfo || 0,
        'Heures totales':       r.totalHours,
        'Statut':               r.status === 'perfect' ? 'OK' : r.status === 'critical' ? 'Anomalie' : 'À vérifier',
      }));

      const detailRows: Record<string, string | number>[] = [];
      data.forEach(r => {
        r.details.forEach(d => {
          detailRows.push({
            'Employé':   r.name,
            'Matricule': r.matricule,
            'Date':      d.date,
            'Entrée':    d.in,
            'Sortie':    d.out,
            'Heures':    d.total,
            'Type':      getTypeLabel(d),
            'Payé':      d.type === 'ABSENT_PAID' ? 'Oui' : d.type === 'ABSENT_UNPAID' ? 'Non' : '—',
          });
        });
      });

      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      wsSummary['!cols'] = [
        { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 13 }, { wch: 9 }, { wch: 11 },
        { wch: 9 }, { wch: 15 }, { wch: 18 }, { wch: 8 }, { wch: 12 }, { wch: 14 },
        { wch: 9 }, { wch: 9 }, { wch: 12 }, { wch: 13 }, { wch: 14 }, { wch: 11 },
      ];

      const wsDetail = XLSX.utils.json_to_sheet(detailRows);
      wsDetail['!cols'] = [
        { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 26 }, { wch: 8 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Détail journalier');
      XLSX.writeFile(wb, `Resume_Presences_${monthLabel}_${year}.xlsx`);
    } catch (e) {
      alert("Erreur lors de l'export Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(d => {
      if (filter === 'All') return true;
      return d.status === filter.toLowerCase();
    });
  }, [data, filter]);

  // ── Agrégats globaux ────────────────────────────────────────────────────
  const totals = useMemo(() => {
    if (!data) return null;
    return data.reduce((acc, r) => ({
      daysPresent:       acc.daysPresent + r.daysPresent,
      daysWorked:        acc.daysWorked + (r.daysWorked ?? (r.daysPresent + r.daysLate + r.daysRemote)),
      daysWorkedOnRest:  acc.daysWorkedOnRest + (r.daysWorkedOnRest ?? 0),
      daysLate:          acc.daysLate + r.daysLate,
      daysRemote:        acc.daysRemote + r.daysRemote,
      daysOnLeave:       acc.daysOnLeave + r.daysOnLeave,
      daysAbsentUnpaid:  acc.daysAbsentUnpaid + r.daysAbsentUnpaid,
      daysAbsentPaid:    acc.daysAbsentPaid + r.daysAbsentPaid,
      workingDays:       acc.workingDays + r.daysPresent + r.daysLate + r.daysRemote + r.daysAbsentUnpaid + r.daysAbsentPaid,
    }), { daysPresent: 0, daysWorked: 0, daysWorkedOnRest: 0, daysLate: 0, daysRemote: 0, daysOnLeave: 0, daysAbsentUnpaid: 0, daysAbsentPaid: 0, workingDays: 0 });
  }, [data]);

  const tauxPresenceGlobal = totals && totals.workingDays > 0
    ? Math.round(((totals.daysPresent + totals.daysLate + totals.daysRemote) / totals.workingDays) * 1000) / 10
    : 0;

  // ── Taux de présence / absence / congé par département ─────────────────
  const departmentStats = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { present: number; absent: number; leave: number; total: number }>();
    data.forEach(r => {
      const key = r.department || 'N/A';
      if (!map.has(key)) map.set(key, { present: 0, absent: 0, leave: 0, total: 0 });
      const s = map.get(key)!;
      const present = r.daysPresent + r.daysLate + r.daysRemote;
      const absent  = r.daysAbsentUnpaid + r.daysAbsentPaid;
      s.present += present;
      s.absent  += absent;
      s.leave   += r.daysOnLeave;
      s.total   += present + absent + r.daysOnLeave;
    });
    return Array.from(map.entries())
      .map(([department, s]) => ({
        department,
        'Présence': s.total > 0 ? Math.round((s.present / s.total) * 1000) / 10 : 0,
        'Absence':  s.total > 0 ? Math.round((s.absent / s.total) * 1000) / 10 : 0,
        'Congé':    s.total > 0 ? Math.round((s.leave / s.total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b['Présence'] - a['Présence']);
  }, [data]);

  // ── Évolution quotidienne du taux de présence (toute l'entreprise) ──────
  const dailyTrend = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { present: number; total: number }>();
    data.forEach(r => {
      r.details.forEach(d => {
        if (d.type === 'OFF_DAY' || d.type === 'HOLIDAY' || d.type === 'FUTURE') return;
        if (!map.has(d.date)) map.set(d.date, { present: 0, total: 0 });
        const s = map.get(d.date)!;
        s.total += 1;
        if (d.type === 'PRESENT' || d.type === 'LATE' || d.type === 'REMOTE') s.present += 1;
      });
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, s]) => ({
        jour: date.slice(8, 10),
        'Taux de présence': s.total > 0 ? Math.round((s.present / s.total) * 1000) / 10 : 0,
      }));
  }, [data]);

  // ── Répartition des motifs d'absence (maladie / conventionnelle / exceptionnelle / non justifiée) ──
  const absenceReasons = useMemo(() => {
    if (!data) return [];
    const counts: Record<string, number> = { 'Maladie': 0, 'Conventionnelle': 0, 'Exceptionnelle': 0, 'Non justifiée': 0 };
    data.forEach(r => r.details.forEach(d => {
      if (d.type === 'ABSENT_PAID' || d.type === 'ABSENT_UNPAID' || d.type === 'ABSENT') {
        const label = d.absenceType ? (ABSENCE_TYPE_LABELS[d.absenceType] || d.absenceType) : 'Non justifiée';
        counts[label] = (counts[label] || 0) + 1;
      }
    }));
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([motif, jours]) => ({ motif, jours }));
  }, [data]);

  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      perfect: { color: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]', icon: CheckCircle2, label: 'OK' },
      warning: { color: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]', icon: Clock, label: 'À vérifier' },
      critical: { color: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)]', icon: AlertTriangle, label: 'Anomalie' },
    };
    const { color, icon: Icon, label } = config[status as keyof typeof config] || config.perfect;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
        <Icon size={12} /> {label}
      </span>
    );
  };

  const fmt = (n: number) => n % 1 === 0 ? n.toString() : n.toFixed(1);

  return (
    <div className="max-w-[1600px] mx-auto pb-24 space-y-8">

      <PresenceSubNav userRole={userRole} />
      <AttendanceLoadError message={uiLoadError} retry={generateReport} />

      {/* HEADER & CONTROLS */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1 attendance-page-header">
           <Link href={bp('/presences')} className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors">
              <ArrowRight className="rotate-180 text-[var(--text-muted)]" size={20} />
            </Link>
            <h1 className="text-3xl font-semibold text-[var(--text)] tracking-tight">{canManage ? 'Résumés de Présences' : 'Mon Résumé de Présence'}</h1>
          </div>
          <p className="text-[var(--text-muted)] ml-11">{canManage ? 'Consolidez et exportez les heures pour la paie.' : 'Retrouvez vos heures, retards et absences du mois.'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-[var(--surface)] p-2 rounded-2xl shadow-sm border border-[var(--border)]">
          <div className="flex items-center gap-2 pl-2">
            <Calendar size={18} className="text-[var(--text-muted)] shrink-0" />

            <div className="relative">
              <AttendanceSelect
                value={month}
                onChange={e => handlePeriodChange(e.target.value, year)}
                className="appearance-none bg-[var(--surface-2)] text-[var(--text)] font-semibold text-sm rounded-lg pl-3 pr-8 py-2.5 outline-none cursor-pointer border border-[var(--border)] focus:ring-2 focus:ring-[var(--focus)] transition-shadow"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value} className="bg-[var(--surface)] text-[var(--text)]">
                    {m.label}
                  </option>
                ))}
              </AttendanceSelect>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            </div>

            <div className="relative">
              <AttendanceSelect
                value={year}
                onChange={e => handlePeriodChange(month, Number(e.target.value))}
                className="appearance-none bg-[var(--surface-2)] text-[var(--text)] font-semibold text-sm rounded-lg pl-3 pr-8 py-2.5 outline-none cursor-pointer border border-[var(--border)] focus:ring-2 focus:ring-[var(--focus)] transition-shadow"
              >
                {YEARS.map(y => (
                  <option key={y} value={y} className="bg-[var(--surface)] text-[var(--text)]">
                    {y}
                  </option>
                ))}
              </AttendanceSelect>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            </div>
          </div>

          <div className="h-8 w-px bg-[var(--border)]"></div>

          <button
            onClick={generateReport}
            disabled={isGenerating || isValidated}
            className={`
              px-6 py-2.5 rounded-xl font-semibold bg-[var(--brand)] text-[var(--on-brand)] shadow-lg transition-colors flex items-center gap-2
              ${isValidated
                ? 'bg-[var(--text-muted)] cursor-not-allowed'
                : 'bg-[var(--brand)] hover:bg-[var(--brand)]  active:scale-95'}
            `}
          >
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
            {isGenerating ? 'Calcul...' : isValidated ? 'Validé' : 'Générer Résumé'}
          </button>
        </div>
      </div>

      {/* LOADING STATE */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[var(--surface)] rounded-2xl p-8 text-center border border-[var(--border)] shadow-sm"
          >
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Traitement des pointages en cours...</h3>
            <p className="text-[var(--text-muted)] mb-6">{otOn ? 'Calcul des heures supplémentaires et vérification des anomalies.' : 'Heures travaillées et vérification des anomalies.'}</p>
            <div className="max-w-md mx-auto h-3 bg-[var(--surface-2)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--brand)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm font-mono text-[var(--success-text)] ">{Math.round(progress)}%</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REPORT CONTENT */}
      {data && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* OVERVIEW CARDS — LIGNE 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 attendance-metrics">
            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)]  mb-1">{canManage ? 'Employés Traités' : 'Jours travaillés'}</p>
                <h3 className="text-2xl font-semibold text-[var(--text)]">{canManage ? data.length : (totals?.daysWorked || 0)}</h3>
                {!canManage && (
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Jours où vous avez pointé{(totals?.daysWorkedOnRest || 0) > 0 ? ` (dont ${totals?.daysWorkedOnRest} de repos ou férié)` : ''}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-[var(--surface-2)] text-[var(--text-muted)] rounded-xl flex items-center justify-center">
                <Users size={24} />
              </div>
            </div>
            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)]  mb-1">Taux de Présence</p>
                <h3 className="text-2xl font-semibold text-[var(--text)]">{fmt(tauxPresenceGlobal)}%</h3>
              </div>
              <div className="w-12 h-12 bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  text-[var(--success-text)] rounded-xl flex items-center justify-center">
                <Percent size={24} />
              </div>
            </div>
            {otOn && (
              <>
            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)]  shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--warning-text)]  mb-1">HS Normales</p>
                <h3 className="text-2xl font-semibold text-[var(--text)]">
                  {fmt(data.reduce((s, r) => s + (r.overtime10 || 0) + (r.overtime25 || 0), 0))} <span className="text-sm text-[var(--text-muted)]">h</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">+10% · +25%</p>
              </div>
              <div className="w-12 h-12 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  text-[var(--warning-text)] rounded-xl flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>
            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)]  shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--warning-text)]  mb-1 flex items-center gap-1"><Moon size={11} /> HS Nuit</p>
                <h3 className="text-2xl font-semibold text-[var(--text)]">
                  {fmt(data.reduce((s, r) => s + (r.overtime50 || 0) + (r.overtime100 || 0), 0))} <span className="text-sm text-[var(--text-muted)]">h</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">+50% · +100%</p>
              </div>
              <div className="w-12 h-12 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  text-[var(--warning-text)] rounded-xl flex items-center justify-center">
                <Moon size={24} />
              </div>
            </div>
              </>
            )}
          </div>

          {/* 🆕 Heures en plus (à titre informatif — n'impactent pas la paie) */}
          {data.reduce((sum, r) => sum + (r.extraHoursInfo || 0), 0) > 0 && (
            <div className="bg-[var(--brand-soft)]  border border-[var(--border)]  rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[var(--action)]   mb-1">Heures en plus (info)</p>
                <h3 className="text-2xl font-semibold text-[var(--text)]">
                  {fmt(data.reduce((sum, r) => sum + (r.extraHoursInfo || 0), 0))} <span className="text-sm text-[var(--text-muted)]">h</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Travaillées au-delà de l'horaire. À titre informatif : non comptées dans la paie.</p>
              </div>
              <div className="w-12 h-12 bg-[var(--brand-soft)]  text-[var(--action)] rounded-xl flex items-center justify-center shrink-0">
                <Clock size={24} />
              </div>
            </div>
          )}

          {/* OVERVIEW CARDS — LIGNE 2 : absences & congés */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 attendance-metrics">
            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)]  mb-1">Retards</p>
                <h3 className="text-2xl font-semibold text-[var(--text)]">{totals?.daysLate || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  text-[var(--warning-text)] rounded-xl flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>
            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)]  shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--warning-text)]  mb-1">Absences Payées</p>
                <h3 className="text-2xl font-semibold text-[var(--text)]">{totals?.daysAbsentPaid || 0} <span className="text-sm text-[var(--text-muted)]">j</span></h3>
              </div>
              <div className="w-12 h-12 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  text-[var(--warning-text)] rounded-xl flex items-center justify-center">
                <UserX size={24} />
              </div>
            </div>
            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)]  shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--danger-text)]  mb-1">Absences Non Payées</p>
                <h3 className="text-2xl font-semibold text-[var(--text)]">{totals?.daysAbsentUnpaid || 0} <span className="text-sm text-[var(--text-muted)]">j</span></h3>
              </div>
              <div className="w-12 h-12 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  text-[var(--danger-text)] rounded-xl flex items-center justify-center">
                <CalendarOff size={24} />
              </div>
            </div>
            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)]  mb-1">En Congé</p>
                <h3 className="text-2xl font-semibold text-[var(--text)]">{totals?.daysOnLeave || 0} <span className="text-sm text-[var(--text-muted)]">j</span></h3>
              </div>
              <div className="w-12 h-12 bg-[var(--surface-2)] text-[var(--text-muted)] rounded-xl flex items-center justify-center">
                <CalendarCheck size={24} />
              </div>
            </div>
          </div>

          {/* MAIN TABLE */}
          <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto attendance-table-scroll" tabIndex={0} role="region" aria-label="Tableau défilant horizontalement">
              <table className="w-full text-left text-sm attendance-table">
                <thead className="bg-[var(--surface-2)] text-[var(--text-muted)] font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Employé</th>
                    <th className="px-6 py-3 text-center">Jours Prés.</th>
                    <th className="px-6 py-3 text-center">Retards</th>
                    <th className="px-6 py-3 text-center">Absences</th>
                    <th className="px-6 py-3 text-center">Congés</th>
                    <th className="px-6 py-3 text-right">Heures Norm.</th>
                    {otOn && (<>
                    <th className="px-6 py-3 text-right text-[var(--warning-text)]">HS +10%</th>
                    <th className="px-6 py-3 text-right text-[var(--warning-text)]">HS +25%</th>
                    <th className="px-6 py-3 text-right text-[var(--warning-text)]">
                      <span className="flex items-center justify-end gap-1"><Moon size={11} /> +50%</span>
                    </th>
                    <th className="px-6 py-3 text-right text-[var(--danger-text)]">
                      <span className="flex items-center justify-end gap-1"><Moon size={11} /> +100%</span>
                    </th>
                    </>)}
                    <th className="px-6 py-3 text-right text-[var(--action)]">H. en plus (info)</th>
                    <th className="px-6 py-3 text-center">Statut</th>
                    <th className="px-6 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredData.map(row => (
                    <React.Fragment key={row.id}>
                      <tr
                        onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                        className={`cursor-pointer hover:bg-[var(--surface-2)] transition-colors ${expandedRow === row.id ? 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] ' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={row.avatar || `https://ui-avatars.com/api/?name=${row.name}&background=random`} className="w-8 h-8 rounded-full" alt="" />
                            <div>
                              <p className="font-semibold text-[var(--text)]">{row.name}</p>
                              <p className="text-xs text-[var(--text-muted)]">{row.matricule}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-medium">
                          {row.daysPresent}
                          {(row.daysWorkedOnRest ?? 0) > 0 && (
                            <span className="block text-[10px] font-semibold text-[var(--warning-text)]" title="Pointés un jour de repos ou férié (hors jours présents)">
                              +{row.daysWorkedOnRest} repos/férié
                            </span>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-center font-semibold ${row.daysLate > 2 ? 'text-[var(--warning-text)]' : 'text-[var(--text-muted)]'}`}>{row.daysLate}</td>
                        <td className="px-6 py-4 text-center font-medium text-[var(--text-muted)]">
                          {row.daysAbsentUnpaid + row.daysAbsentPaid}
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-[var(--text-muted)]">{row.daysOnLeave}</td>
                        <td className="px-6 py-4 text-right font-mono text-[var(--text-muted)]">{row.normalHours}</td>
                        {otOn && (<>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-[var(--warning-text)] ">
                          {(row.overtime10 || 0) > 0 ? fmt(row.overtime10) : <span className="text-[var(--text-muted)]">—</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-[var(--warning-text)] ">
                          {(row.overtime25 || 0) > 0 ? fmt(row.overtime25) : <span className="text-[var(--text-muted)]">—</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-[var(--warning-text)] ">
                          {(row.overtime50 || 0) > 0 ? fmt(row.overtime50) : <span className="text-[var(--text-muted)]">—</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-[var(--danger-text)] ">
                          {(row.overtime100 || 0) > 0 ? fmt(row.overtime100) : <span className="text-[var(--text-muted)]">—</span>}
                        </td>
                        </>)}
                        <td className="px-6 py-4 text-right font-mono font-semibold text-[var(--action)] ">
                          {(row.extraHoursInfo || 0) > 0 ? fmt(row.extraHoursInfo || 0) : <span className="text-[var(--text-muted)]">—</span>}
                        </td>
                        <td className="px-6 py-4 text-center"><StatusBadge status={row.status} /></td>
                        <td className="px-6 py-4 text-[var(--text-muted)]">{expandedRow === row.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td>
                      </tr>

                      {/* EXPANDED DETAILS */}
                      {expandedRow === row.id && (
                        <tr className="bg-[var(--surface-2)]">
                          <td colSpan={otOn ? 12 : 8} className="p-0">
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-6 border-b border-[var(--border)]">
                              {/* Badges HS */}
                              {otOn && ((row.overtime10 || 0) + (row.overtime25 || 0) + (row.overtime50 || 0) + (row.overtime100 || 0)) > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {(row.overtime10 || 0) > 0 && (
                                    <span className="text-xs bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  text-[var(--warning-text)]  px-2.5 py-1 rounded-full font-semibold">
                                      {fmt(row.overtime10)}h +10%
                                    </span>
                                  )}
                                  {(row.overtime25 || 0) > 0 && (
                                    <span className="text-xs bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  text-[var(--warning-text)]  px-2.5 py-1 rounded-full font-semibold">
                                      {fmt(row.overtime25)}h +25%
                                    </span>
                                  )}
                                  {(row.overtime50 || 0) > 0 && (
                                    <span className="text-xs bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  text-[var(--warning-text)]  px-2.5 py-1 rounded-full font-semibold">
                                       {fmt(row.overtime50)}h +50%
                                    </span>
                                  )}
                                  {(row.overtime100 || 0) > 0 && (
                                    <span className="text-xs bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  text-[var(--danger-text)]  px-2.5 py-1 rounded-full font-semibold">
                                       {fmt(row.overtime100)}h +100%
                                    </span>
                                  )}
                                </div>
                              )}
                              <table className="w-full text-xs text-left attendance-table">
                                <thead className="text-[var(--text-muted)] font-semibold border-b border-[var(--border)]">
                                  <tr>
                                    <th className="py-2">Date</th>
                                    <th className="py-2">Entrée</th>
                                    <th className="py-2">Sortie</th>
                                    <th className="py-2">Total</th>
                                    <th className="py-2">Type</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                  {row.details.map((det, i) => (
                                    <tr key={i}>
                                      <td className="py-2 font-mono">{det.date}</td>
                                      <td className="py-2">{det.in}</td>
                                      <td className="py-2">{det.out}</td>
                                      <td className="py-2 font-semibold">{det.total}h</td>
                                      <td className="py-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getTypeBadgeColor(det.type)}`}>
                                          {getTypeLabel(det)}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CHARTS */}
          <div className={`grid grid-cols-1 ${canManage ? 'xl:grid-cols-2' : ''} gap-6`}>
            {/* Taux de présence / absence / congé par département — réservé aux managers/RH */}
            {canManage && (
            <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-[var(--success-text)]" />
                <h3 className="font-semibold text-[var(--text)]">Taux par Département</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="Présence" stackId="a" fill="var(--green)" isAnimationActive={uiMotion} animationDuration={700} maxBarSize={22} />
                  <Bar dataKey="Absence" stackId="a" fill="var(--danger)" isAnimationActive={uiMotion} animationDuration={700} maxBarSize={22} />
                  <Bar dataKey="Congé" stackId="a" fill="var(--mustard)" radius={[12,12,0,0]} isAnimationActive={uiMotion} animationDuration={700} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            )}

            {/* Évolution quotidienne du taux de présence */}
            <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-[var(--success-text)]" />
                <h3 className="font-semibold text-[var(--text)]">{canManage ? 'Évolution Quotidienne du Taux de Présence' : 'Mon Évolution Quotidienne'}</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={dailyTrend}>
                  <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} labelFormatter={(l) => `Jour ${l}`} />
                  <Area type="monotone" dataKey="Taux de présence" stroke="var(--brand)" fill="var(--loan-gradient-1)" strokeWidth={2.5} dot={false} isAnimationActive={uiMotion} animationDuration={700} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Répartition des motifs d'absence */}
            <div className={`bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6 ${canManage ? 'xl:col-span-2' : ''}`}>
              <div className="flex items-center gap-2 mb-4">
                <UserX size={18} className="text-[var(--danger-text)]" />
                <h3 className="font-semibold text-[var(--text)]">Motifs d'Absence (Maladie · Conventionnelle · Exceptionnelle)</h3>
              </div>
              {absenceReasons.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={absenceReasons} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="motif" tick={{ fontSize: 12 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="jours" name="Jours" fill="var(--brand)" radius={[12,12,12,12]} maxBarSize={18} isAnimationActive={uiMotion} animationDuration={700} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-[var(--text-muted)] py-8 text-center">Aucune absence enregistrée sur cette période.</p>
              )}
            </div>
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-[var(--surface)] rounded-2xl shadow-lg border border-[var(--border)] sticky bottom-6 z-20">
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                disabled={isExporting || !data || data.length === 0}
                className="px-5 py-3 bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)] font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
                {isExporting ? 'Export...' : 'Exporter en Excel'}
              </button>
            </div>

            {canManage && (
            <div className="flex items-center gap-4 w-full md:w-auto">
              {!isValidated ? (
                <button onClick={() => setIsValidated(true)} className="flex-1 md:flex-none px-6 py-3 bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> Valider ce Résumé
                </button>
              ) : (
                <div className="flex items-center gap-2 text-[var(--success-text)] font-semibold text-sm px-4 bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  py-3 rounded-xl border border-[var(--border)] ">
                  <Lock size={16} /> Validé
                </div>
              )}

              <button onClick={handleSendToPayroll} disabled={!isValidated} className="flex-1 md:flex-none px-8 py-3 bg-[var(--text)] text-[var(--bg)] font-semibold rounded-xl  transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                Envoyer à la Paie <ArrowRight size={18} />
              </button>
            </div>
            )}
          </div>

        </motion.div>
      )}

    </div>
  );
}

export default function AttendanceResumePage() {
  return <AttendanceModuleFrame kind="dashboard"><AttendanceResumePageContent /></AttendanceModuleFrame>;
}
