'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/WeeklyView.tsx
// ✅ v2 — CORRECTIF IMPORTANT : la version précédente appelait bien
//    /attendance?month=&year= mais agrégeait TOUT le mois dans les stats
//    "hebdomadaires", sans jamais filtrer sur la semaine réellement
//    sélectionnée. Cette version calcule la semaine (lundi → dimanche)
//    autour de la date, ne fetch que les mois nécessaires (1 ou 2 si la
//    semaine chevauche un changement de mois), et n'agrège que ces 7 jours.
// ✅ Ajouts : navigation semaine, clic sur un département → sidebar de
//    détail, icônes à la place des emojis, rapport imprimable/PDF.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, ChevronLeft, ChevronRight,
  TrendingUp, Printer,
  Download, Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line,
} from 'recharts';
import { api } from '@/services/api';
import DepartmentDetailSidebar, { DepartmentDetail } from '@/components/DepartmentDetailSidebar';
import WeeklyAttendanceReportPrintable from '@/components/WeeklyAttendanceReportPrintable';
import { printReport, downloadReportPDF } from '@/lib/report-print';

interface WeeklyViewProps {
  userRole: string;
  userDepartment: string;
  date: Date;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

/** Lundi de la semaine ISO contenant `d` */
function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay() === 0 ? 7 : date.getDay();
  date.setDate(date.getDate() - (day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number) {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

export default function WeeklyView({ userRole, userDepartment, date }: WeeklyViewProps) {
  const [weekAnchor, setWeekAnchor] = useState<Date>(date);
  const [company, setCompany] = useState<any>(null);
  const [departmentsMeta, setDepartmentsMeta] = useState<any[]>([]);
  const [employeeMap, setEmployeeMap] = useState<Map<string, { employee: any; statusByDate: Map<string, any> }>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DepartmentDetail | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Recale la semaine affichée quand le parent change de mois/date (ex: onglet Mensuel)
  useEffect(() => { setWeekAnchor(date); }, [date]);

  const monday = useMemo(() => startOfWeek(weekAnchor), [weekAnchor]);
  const sunday = useMemo(() => addDays(monday, 6), [monday]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);

  useEffect(() => {
    (async () => {
      try {
        const me: any = await api.get('/auth/me');
        setCompany(me?.company ?? null);
      } catch {}
      try {
        const depts: any = await api.get('/departments');
        setDepartmentsMeta(depts || []);
      } catch (e) {
        console.error('Erreur chargement départements', e);
      }
    })();
  }, []);

  useEffect(() => {
    fetchWeekData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monday.getTime()]);

  /** ✅ CORRECTIF : ne récupère que le(s) mois couvrant la semaine réellement affichée */
  const fetchWeekData = async () => {
    setIsLoading(true);
    try {
      const monthKeys = new Set<string>();
      weekDays.forEach(d => monthKeys.add(`${d.getFullYear()}-${d.getMonth() + 1}`));

      const results: any[] = await Promise.all(
        Array.from(monthKeys).map(key => {
          const [y, m] = key.split('-').map(Number);
          return api.get(`/attendance?month=${m}&year=${y}`);
        })
      );

      const map = new Map<string, { employee: any; statusByDate: Map<string, any> }>();
      results.forEach((res: any) => {
        (res?.employees || []).forEach((emp: any, idx: number) => {
          if (!map.has(emp.id)) map.set(emp.id, { employee: emp, statusByDate: new Map() });
          const entry = map.get(emp.id)!;
          const statuses = res?.dayStatuses?.[idx] || [];
          statuses.forEach((ds: any) => entry.statusByDate.set(ds.date, ds));
        });
      });

      setEmployeeMap(map);
    } catch (e) {
      console.error(e);
      setEmployeeMap(new Map());
    } finally {
      setIsLoading(false);
    }
  };

  const EXCLUDED = new Set(['FUTURE', 'HOLIDAY', 'OFF_DAY']);

  /** Statistiques par département — uniquement sur les 7 jours de la semaine affichée */
  const departmentStats = useMemo(() => {
    const deptMap = new Map<string, any>();

    employeeMap.forEach(({ employee: emp, statusByDate }) => {
      const deptName = emp.department?.name || 'Non assigné';
      if (userRole === 'MANAGER' && userDepartment && deptName !== userDepartment) return;

      if (!deptMap.has(deptName)) {
        deptMap.set(deptName, { name: deptName, present: 0, late: 0, absent: 0, remote: 0, leave: 0, total: 0 });
      }
      const dept = deptMap.get(deptName);

      weekDays.forEach(day => {
        const ds = statusByDate.get(toDateStr(day));
        if (!ds || EXCLUDED.has(ds.status)) return;
        dept.total++;
        if (ds.status === 'PRESENT') dept.present++;
        else if (ds.status === 'LATE') dept.late++;
        else if (ds.status === 'ABSENT_UNPAID') dept.absent++;
        else if (ds.status === 'REMOTE') dept.remote++;
        else if (ds.status === 'LEAVE' || ds.status === 'ON_LEAVE') dept.leave++;
      });
    });

    return Array.from(deptMap.values());
  }, [employeeMap, userRole, userDepartment, weekDays]);

  /** ✅ Un seul graphique — tous les départements ensemble, en pourcentage */
  const departmentChartData = useMemo(() => departmentStats.map(d => ({
    name:      d.name,
    'Présence': d.total > 0 ? Math.round((d.present / d.total) * 1000) / 10 : 0,
    'Retards':  d.total > 0 ? Math.round((d.late / d.total) * 1000) / 10 : 0,
    'Absences': d.total > 0 ? Math.round((d.absent / d.total) * 1000) / 10 : 0,
    'Remote':   d.total > 0 ? Math.round((d.remote / d.total) * 1000) / 10 : 0,
    'Congés':   d.total > 0 ? Math.round((d.leave / d.total) * 1000) / 10 : 0,
  })), [departmentStats]);

  /** ✅ Courbe d'évolution — taux Présence/Absence/Congé jour par jour sur la semaine */
  const dailyStats = useMemo(() => {
    return weekDays.map((day, i) => {
      let present = 0, late = 0, absent = 0, remote = 0, leave = 0, total = 0;
      employeeMap.forEach(({ employee: emp, statusByDate }) => {
        const deptName = emp.department?.name || 'Non assigné';
        if (userRole === 'MANAGER' && userDepartment && deptName !== userDepartment) return;
        const ds = statusByDate.get(toDateStr(day));
        if (!ds || EXCLUDED.has(ds.status)) return;
        total++;
        if (ds.status === 'PRESENT') present++;
        else if (ds.status === 'LATE') late++;
        else if (ds.status === 'ABSENT_UNPAID') absent++;
        else if (ds.status === 'REMOTE') remote++;
        else if (ds.status === 'LEAVE' || ds.status === 'ON_LEAVE') leave++;
      });
      return {
        jour: DAY_LABELS[i],
        'Présence': total > 0 ? Math.round(((present + late + remote) / total) * 1000) / 10 : 0,
        'Absence':  total > 0 ? Math.round((absent / total) * 1000) / 10 : 0,
        'Congé':    total > 0 ? Math.round((leave / total) * 1000) / 10 : 0,
      };
    });
  }, [employeeMap, userRole, userDepartment, weekDays]);

  /** Grille jour-par-jour par employé — pour la sidebar département et le rapport imprimable */
  const employeeWeekRows = useMemo(() => {
    const rows: Array<{ id: string; name: string; department?: string; position?: string; photoUrl?: string | null; days: Array<{ label: string; status: string }>; totalHours: number; present: number; late: number; absent: number; remote: number; leave: number }> = [];

    employeeMap.forEach(({ employee: emp, statusByDate }) => {
      const deptName = emp.department?.name || 'Non assigné';
      if (userRole === 'MANAGER' && userDepartment && deptName !== userDepartment) return;

      let totalHours = 0, present = 0, late = 0, absent = 0, remote = 0, leave = 0;
      const days = weekDays.map((day, i) => {
        const ds = statusByDate.get(toDateStr(day));
        const status = ds?.status || 'OFF_DAY';
        if (ds && !EXCLUDED.has(status)) {
          totalHours += ds.totalHours || 0;
          if (status === 'PRESENT') present++;
          else if (status === 'LATE') late++;
          else if (status === 'ABSENT_UNPAID') absent++;
          else if (status === 'REMOTE') remote++;
          else if (status === 'LEAVE' || status === 'ON_LEAVE') leave++;
        }
        return { label: DAY_LABELS[i], status };
      });

      rows.push({ id: emp.id, name: `${emp.firstName} ${emp.lastName}`, department: deptName, position: emp.position, photoUrl: emp.photoUrl, days, totalHours, present, late, absent, remote, leave });
    });

    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, [employeeMap, userRole, userDepartment, weekDays]);

  const weekLabel = `Semaine du ${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${sunday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const openDepartmentDetail = (deptName: string) => {
    const stat = departmentStats.find(d => d.name === deptName);
    const meta = departmentsMeta.find((d: any) => d.name === deptName);
    const employees = employeeWeekRows.filter(r => r.department === deptName);

    setSelectedDept({
      name: deptName,
      description: meta?.description,
      color: meta?.color,
      employeeCount: meta?.employeeCount ?? employees.length,
      totalGross: meta?.totalGross,
      totalNet: meta?.totalNet,
      avgSalary: meta?.avgSalary,
      weekStats: {
        present: stat?.present ?? 0, late: stat?.late ?? 0, absent: stat?.absent ?? 0,
        remote: stat?.remote ?? 0, leave: stat?.leave ?? 0, total: stat?.total ?? 0,
      },
      employees: employees.map(e => ({
        name: e.name, position: e.position, photoUrl: e.photoUrl,
        present: e.present, late: e.late, absent: e.absent, remote: e.remote, leave: e.leave, totalHours: e.totalHours,
      })),
    });
  };

  const REPORT_ID = 'weekly-attendance-report';

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await downloadReportPDF(REPORT_ID, `rapport-hebdomadaire-${toDateStr(monday)}.pdf`, 'landscape');
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-center items-center min-h-[600px]">
        <Loader2 className="animate-spin text-sky-500" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500 rounded-xl">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Vue par Département</h3>
              <p className="text-sm text-gray-500 capitalize">{weekLabel}</p>
              {userRole === 'MANAGER' && userDepartment && (
                <p className="text-xs text-sky-600 dark:text-sky-400 mt-1 flex items-center gap-1">
                  <BarChart3 size={12} /> Vue limitée au département : {userDepartment}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setWeekAnchor(addDays(monday, -7))} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors" title="Semaine précédente">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setWeekAnchor(new Date())} className="px-3 py-2 text-xs font-bold text-sky-500 hover:text-sky-600 rounded-lg border border-sky-100 dark:border-sky-900">
              Cette semaine
            </button>
            <button onClick={() => setWeekAnchor(addDays(monday, 7))} disabled={monday >= startOfWeek(new Date())} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-30" title="Semaine suivante">
              <ChevronRight size={20} />
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
            <button onClick={() => setTimeout(() => printReport(REPORT_ID), 50)} title="Imprimer le rapport" className="p-2.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500">
              <Printer size={18} />
            </button>
            <button onClick={handleDownloadPdf} disabled={isExportingPdf} title="Télécharger en PDF" className="p-2.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500 disabled:opacity-40">
              {isExportingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>
          </div>
        </div>

        {departmentStats.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <BarChart3 size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500">Aucune donnée disponible pour cette semaine</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tous les départements ensemble — en pourcentage */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BarChart3 size={16} className="text-sky-500" /> Taux par Département (%)
              </h4>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={departmentChartData} onClick={(e: any) => e?.activeLabel && openDepartmentDetail(e.activeLabel)}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="Présence" fill="#10b981" radius={[4, 4, 0, 0]} cursor="pointer" />
                  <Bar dataKey="Retards" fill="#f97316" radius={[4, 4, 0, 0]} cursor="pointer" />
                  <Bar dataKey="Absences" fill="#ef4444" radius={[4, 4, 0, 0]} cursor="pointer" />
                  <Bar dataKey="Remote" fill="#a855f7" radius={[4, 4, 0, 0]} cursor="pointer" />
                  <Bar dataKey="Congés" fill="#0ea5e9" radius={[4, 4, 0, 0]} cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-400 mt-2">Cliquez sur une barre pour voir le détail du département.</p>
            </div>

            {/* Courbe d'évolution sur les 7 jours de la semaine */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" /> Évolution sur la Semaine
              </h4>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="jour" tick={{ fontSize: 12 }} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="Présence" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Absence" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Congé" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Accès rapide au détail de chaque département */}
            <div className="flex flex-wrap gap-2">
              {departmentStats.map(dept => (
                <button
                  key={dept.name}
                  onClick={() => openDepartmentDetail(dept.name)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {dept.name} · voir le détail
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Résumé global */}
      {departmentStats.length > 1 && (
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-6">
          <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-sky-500" />
            Résumé global de la semaine
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-sky-600 dark:text-sky-400">{departmentStats.length}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Départements</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{departmentStats.reduce((sum, d) => sum + d.present, 0)}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total présents</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{departmentStats.reduce((sum, d) => sum + d.late, 0)}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total retards</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{departmentStats.reduce((sum, d) => sum + d.absent, 0)}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total absents</p>
            </div>
          </div>
        </div>
      )}

      <DepartmentDetailSidebar open={!!selectedDept} onClose={() => setSelectedDept(null)} detail={selectedDept} />

      {/* Rapport imprimable — hors écran */}
      <div style={{ position: 'fixed', top: -99999, left: -99999 }}>
        <WeeklyAttendanceReportPrintable
          id={REPORT_ID}
          company={company || {}}
          weekLabel={weekLabel}
          deptStats={departmentStats}
          employeeRows={employeeWeekRows}
        />
      </div>
    </div>
  );
}