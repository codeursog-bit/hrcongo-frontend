'use client';

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
  Tooltip, Legend, LineChart, Line,
} from 'recharts';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import PresenceSubNav from '@/components/PresenceSubNav';

// ============================================================================
// ✅ Interface alignée sur MonthlyReportItem (backend) — Décret 78-360
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
    case 'PRESENT':       return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'REMOTE':        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300';
    case 'LATE':          return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    case 'LEAVE':         return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'HOLIDAY':       return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'OFF_DAY':       return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
    case 'ABSENT_PAID':   return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    case 'ABSENT_UNPAID':
    case 'ABSENT':        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    case 'FUTURE':         return 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-600';
    default:               return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  }
}

export default function AttendanceResumePage() {
  const { bp } = useBasePath();
  const router = useRouter();

  const [userRole, setUserRole] = useState('');
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
  }, []);

  // ✅ Par défaut : mois et année en cours
  const now = new Date();
  const currentYear = now.getFullYear();
  const YEARS = [currentYear - 1, currentYear, currentYear + 1];

  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(currentYear);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState<AttendanceSummary[] | null>(null);
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
      }, 500);
    } catch (e) {
      clearInterval(interval);
      setIsGenerating(false);
      alert("Erreur lors de la génération du rapport");
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
        'Retards':              r.daysLate,
        'Télétravail':          r.daysRemote,
        'Congés':               r.daysOnLeave,
        'Absences payées':      r.daysAbsentPaid,
        'Absences non payées':  r.daysAbsentUnpaid,
        'Repos':                r.daysOffDay,
        'Jours fériés':         r.daysHoliday,
        'Heures normales':      r.normalHours,
        'HS +10%':              r.overtime10,
        'HS +25%':              r.overtime25,
        'HS Nuit +50%':         r.overtime50,
        'HS Nuit +100%':        r.overtime100,
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
      daysLate:          acc.daysLate + r.daysLate,
      daysRemote:        acc.daysRemote + r.daysRemote,
      daysOnLeave:       acc.daysOnLeave + r.daysOnLeave,
      daysAbsentUnpaid:  acc.daysAbsentUnpaid + r.daysAbsentUnpaid,
      daysAbsentPaid:    acc.daysAbsentPaid + r.daysAbsentPaid,
      workingDays:       acc.workingDays + r.daysPresent + r.daysLate + r.daysRemote + r.daysAbsentUnpaid + r.daysAbsentPaid,
    }), { daysPresent: 0, daysLate: 0, daysRemote: 0, daysOnLeave: 0, daysAbsentUnpaid: 0, daysAbsentPaid: 0, workingDays: 0 });
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
      perfect: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'OK' },
      warning: { color: 'bg-orange-100 text-orange-700', icon: Clock, label: 'À vérifier' },
      critical: { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Anomalie' },
    };
    const { color, icon: Icon, label } = config[status as keyof typeof config] || config.perfect;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
        <Icon size={12} /> {label}
      </span>
    );
  };

  const fmt = (n: number) => n % 1 === 0 ? n.toString() : n.toFixed(1);

  return (
    <div className="max-w-[1600px] mx-auto pb-24 space-y-8">

      <PresenceSubNav userRole={userRole} />

      {/* HEADER & CONTROLS */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
           <Link href={bp('/presences')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowRight className="rotate-180 text-gray-500" size={20} />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Résumés de Présences</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-11">Consolidez et exportez les heures pour la paie.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 pl-2">
            <Calendar size={18} className="text-gray-400 shrink-0" />

            <div className="relative">
              <select
                value={month}
                onChange={e => handlePeriodChange(e.target.value, year)}
                className="appearance-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-bold text-sm rounded-lg pl-3 pr-8 py-2.5 outline-none cursor-pointer border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 transition-shadow"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="relative">
              <select
                value={year}
                onChange={e => handlePeriodChange(month, Number(e.target.value))}
                className="appearance-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-bold text-sm rounded-lg pl-3 pr-8 py-2.5 outline-none cursor-pointer border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 transition-shadow"
              >
                {YEARS.map(y => (
                  <option key={y} value={y} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

          <button
            onClick={generateReport}
            disabled={isGenerating || isValidated}
            className={`
              px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2
              ${isValidated
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:scale-105 active:scale-95'}
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
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700 shadow-sm"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Traitement des pointages en cours...</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Calcul des heures supplémentaires et vérification des anomalies.</p>
            <div className="max-w-md mx-auto h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm font-mono text-emerald-600 dark:text-emerald-400">{Math.round(progress)}%</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Employés Traités</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.length}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center">
                <Users size={24} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Taux de Présence</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(tauxPresenceGlobal)}%</h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl flex items-center justify-center">
                <Percent size={24} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-orange-100 dark:border-orange-900/30 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase mb-1">HS Normales</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {fmt(data.reduce((s, r) => s + (r.overtime10 || 0) + (r.overtime25 || 0), 0))} <span className="text-sm text-gray-400">h</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">+10% · +25%</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-xl flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/30 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase mb-1 flex items-center gap-1"><Moon size={11} /> HS Nuit</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {fmt(data.reduce((s, r) => s + (r.overtime50 || 0) + (r.overtime100 || 0), 0))} <span className="text-sm text-gray-400">h</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">+50% · +100%</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-xl flex items-center justify-center">
                <Moon size={24} />
              </div>
            </div>
          </div>

          {/* OVERVIEW CARDS — LIGNE 2 : absences & congés */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Retards</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totals?.daysLate || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-xl flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-orange-100 dark:border-orange-900/30 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase mb-1">Absences Payées</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totals?.daysAbsentPaid || 0} <span className="text-sm text-gray-400">j</span></h3>
              </div>
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-xl flex items-center justify-center">
                <UserX size={24} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-600 uppercase mb-1">Absences Non Payées</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totals?.daysAbsentUnpaid || 0} <span className="text-sm text-gray-400">j</span></h3>
              </div>
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl flex items-center justify-center">
                <CalendarOff size={24} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase mb-1">En Congé</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totals?.daysOnLeave || 0} <span className="text-sm text-gray-400">j</span></h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center">
                <CalendarCheck size={24} />
              </div>
            </div>
          </div>

          {/* MAIN TABLE */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Employé</th>
                    <th className="px-6 py-3 text-center">Jours Prés.</th>
                    <th className="px-6 py-3 text-center">Retards</th>
                    <th className="px-6 py-3 text-center">Absences</th>
                    <th className="px-6 py-3 text-center">Congés</th>
                    <th className="px-6 py-3 text-right">Heures Norm.</th>
                    <th className="px-6 py-3 text-right text-amber-600">HS +10%</th>
                    <th className="px-6 py-3 text-right text-orange-600">HS +25%</th>
                    <th className="px-6 py-3 text-right text-purple-600">
                      <span className="flex items-center justify-end gap-1"><Moon size={11} /> +50%</span>
                    </th>
                    <th className="px-6 py-3 text-right text-red-600">
                      <span className="flex items-center justify-end gap-1"><Moon size={11} /> +100%</span>
                    </th>
                    <th className="px-6 py-3 text-center">Statut</th>
                    <th className="px-6 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredData.map(row => (
                    <React.Fragment key={row.id}>
                      <tr
                        onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${expandedRow === row.id ? 'bg-sky-50/50 dark:bg-sky-900/10' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={row.avatar || `https://ui-avatars.com/api/?name=${row.name}&background=random`} className="w-8 h-8 rounded-full" alt="" />
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{row.name}</p>
                              <p className="text-xs text-gray-500">{row.matricule}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-medium">{row.daysPresent}</td>
                        <td className={`px-6 py-4 text-center font-bold ${row.daysLate > 2 ? 'text-orange-500' : 'text-gray-400'}`}>{row.daysLate}</td>
                        <td className="px-6 py-4 text-center font-medium text-gray-600 dark:text-gray-300">
                          {row.daysAbsentUnpaid + row.daysAbsentPaid}
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-600 dark:text-gray-300">{row.daysOnLeave}</td>
                        <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-gray-400">{row.normalHours}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          {(row.overtime10 || 0) > 0 ? fmt(row.overtime10) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-orange-600 dark:text-orange-400">
                          {(row.overtime25 || 0) > 0 ? fmt(row.overtime25) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                          {(row.overtime50 || 0) > 0 ? fmt(row.overtime50) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-red-600 dark:text-red-400">
                          {(row.overtime100 || 0) > 0 ? fmt(row.overtime100) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-6 py-4 text-center"><StatusBadge status={row.status} /></td>
                        <td className="px-6 py-4 text-gray-400">{expandedRow === row.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td>
                      </tr>

                      {/* EXPANDED DETAILS */}
                      {expandedRow === row.id && (
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td colSpan={11} className="p-0">
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-6 border-b border-gray-100 dark:border-gray-700">
                              {/* Badges HS */}
                              {((row.overtime10 || 0) + (row.overtime25 || 0) + (row.overtime50 || 0) + (row.overtime100 || 0)) > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {(row.overtime10 || 0) > 0 && (
                                    <span className="text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full font-bold">
                                      {fmt(row.overtime10)}h +10%
                                    </span>
                                  )}
                                  {(row.overtime25 || 0) > 0 && (
                                    <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2.5 py-1 rounded-full font-bold">
                                      {fmt(row.overtime25)}h +25%
                                    </span>
                                  )}
                                  {(row.overtime50 || 0) > 0 && (
                                    <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full font-bold">
                                      🌙 {fmt(row.overtime50)}h +50%
                                    </span>
                                  )}
                                  {(row.overtime100 || 0) > 0 && (
                                    <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-full font-bold">
                                      🌙 {fmt(row.overtime100)}h +100%
                                    </span>
                                  )}
                                </div>
                              )}
                              <table className="w-full text-xs text-left">
                                <thead className="text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-600">
                                  <tr>
                                    <th className="py-2">Date</th>
                                    <th className="py-2">Entrée</th>
                                    <th className="py-2">Sortie</th>
                                    <th className="py-2">Total</th>
                                    <th className="py-2">Type</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                  {row.details.map((det, i) => (
                                    <tr key={i}>
                                      <td className="py-2 font-mono">{det.date}</td>
                                      <td className="py-2">{det.in}</td>
                                      <td className="py-2">{det.out}</td>
                                      <td className="py-2 font-bold">{det.total}h</td>
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Taux de présence / absence / congé par département */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-emerald-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Taux par Département</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="Présence" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Absence" stackId="a" fill="#ef4444" />
                  <Bar dataKey="Congé" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Évolution quotidienne du taux de présence */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-emerald-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Évolution Quotidienne du Taux de Présence</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} labelFormatter={(l) => `Jour ${l}`} />
                  <Line type="monotone" dataKey="Taux de présence" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Répartition des motifs d'absence */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 xl:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <UserX size={18} className="text-red-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Motifs d'Absence (Maladie · Conventionnelle · Exceptionnelle)</h3>
              </div>
              {absenceReasons.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={absenceReasons} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="motif" tick={{ fontSize: 12 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="jours" name="Jours" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 py-8 text-center">Aucune absence enregistrée sur cette période.</p>
              )}
            </div>
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 sticky bottom-6 z-20">
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                disabled={isExporting || !data || data.length === 0}
                className="px-5 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
                {isExporting ? 'Export...' : 'Exporter en Excel'}
              </button>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              {!isValidated ? (
                <button onClick={() => setIsValidated(true)} className="flex-1 md:flex-none px-6 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> Valider ce Résumé
                </button>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm px-4 bg-emerald-50 dark:bg-emerald-900/20 py-3 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <Lock size={16} /> Validé
                </div>
              )}

              <button onClick={handleSendToPayroll} disabled={!isValidated} className="flex-1 md:flex-none px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                Envoyer à la Paie <ArrowRight size={18} />
              </button>
            </div>
          </div>

        </motion.div>
      )}

    </div>
  );
}