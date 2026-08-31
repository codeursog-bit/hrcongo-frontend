'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/DailyView.tsx
// ✅ v2 : fichier nettoyé (l'ancien bloc commenté a été retiré), clic sur une
//    ligne = sidebar de détail employé, emojis remplacés par des icônes
//    lucide, bouton "Rapport imprimable" (impression + PDF, en-tête entreprise).
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, UserX, Timer, MapPin, Calendar, ChevronLeft,
  ChevronRight, Search, CalendarOff, Inbox, Printer, Download, Loader2,
} from 'lucide-react';
import { api } from '@/services/api';
import EmployeeDayDetailSidebar, { EmployeeDayDetail } from '@/components/EmployeeDayDetailSidebar';
import DailyAttendanceReportPrintable from '@/components/DailyAttendanceReportPrintable';
import { printReport, downloadReportPDF } from '@/lib/report-print';

interface DailyViewProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  userRole: string;
  userDepartment: string;
}

export default function DailyView({
  selectedDate,
  setSelectedDate,
  userRole,
  userDepartment,
}: DailyViewProps) {
  const [data, setData] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [selectedRow, setSelectedRow] = useState<EmployeeDayDetail | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [companySettings, setCompanySettings] = useState({
    officialStartHour: 8,
    lateToleranceMinutes: 0,
    workDays: [1, 2, 3, 4, 5],
  });

  useEffect(() => {
    (async () => {
      try {
        const res: any = await api.get('/payroll-settings');
        setCompanySettings({
          officialStartHour: res.officialStartHour || 8,
          lateToleranceMinutes: res.lateToleranceMinutes || 0,
          workDays: res.workDays || [1, 2, 3, 4, 5],
        });
      } catch (e) {
        console.error('Erreur settings:', e);
      }
      try {
        const me: any = await api.get('/auth/me');
        setCompany(me?.company ?? null);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    fetchDailyData();
  }, [selectedDate]);

  const fetchDailyData = async () => {
    setIsLoading(true);
    try {
      // Le backend filtre déjà par département si MANAGER — pas besoin de filtre ici
      const res: any = await api.get(`/attendance?month=${selectedDate.getMonth() + 1}&year=${selectedDate.getFullYear()}`);
      setData(res);
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const formatTime = (dateString?: string) =>
    dateString ? new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-';

  const getStatusColor = (status: string) => {
    const colors: any = {
      PRESENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      LATE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      ABSENT_UNPAID: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      ABSENT_PAID: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      REMOTE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      ON_LEAVE: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
      LEAVE: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
      HOLIDAY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: any = {
      PRESENT: 'Présent', LATE: 'Retard', ABSENT_UNPAID: 'Absent',
      ABSENT_PAID: 'Abs. Justifiée', REMOTE: 'Télétravail', ON_LEAVE: 'Congé',
      LEAVE: 'Congé', HOLIDAY: 'Férié', OFF_DAY: 'Repos',
    };
    return labels[status] || status;
  };

  const getDailyAttendances = () => {
    if (!data?.employees || !data?.dayStatuses) return [];

    const dateStr = selectedDate.toISOString().split('T')[0];
    const dailyData: any[] = [];

    const selectedDayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
    const isWorkingDay = companySettings.workDays.includes(selectedDayOfWeek);

    if (!isWorkingDay) return [];

    const now = new Date();
    const absenceThreshold = new Date(selectedDate);
    absenceThreshold.setHours(companySettings.officialStartHour, companySettings.lateToleranceMinutes, 0, 0);

    const isToday = dateStr === now.toISOString().split('T')[0];
    const isBeforeWorkTime = isToday && now < absenceThreshold;

    // Le backend renvoie déjà uniquement les employés accessibles (filtré par département si MANAGER)
    data.employees.forEach((emp: any, empIndex: number) => {
      const empDayStatuses = data.dayStatuses[empIndex] || [];
      const dayStatus = empDayStatuses.find((ds: any) => ds.date === dateStr);

      if (!dayStatus || dayStatus.status === 'FUTURE' || dayStatus.status === 'HOLIDAY') return;
      if (isBeforeWorkTime && dayStatus.status === 'ABSENT_UNPAID') return;
      if (dayStatus.status === 'OFF_DAY') return;

      dailyData.push({
        id: `${emp.id}-${dateStr}`,
        employee: emp,
        date: dateStr,
        status: dayStatus.status,
        checkIn: dayStatus.checkIn,
        checkOut: dayStatus.checkOut,
        totalHours: dayStatus.totalHours,
        overtime50: dayStatus.overtime50,
      });
    });

    return dailyData;
  };

  const calculateDailyStats = () => {
    const dailyAttendances = getDailyAttendances();
    const stats = { total: dailyAttendances.length, present: 0, late: 0, absent: 0, remote: 0, onLeave: 0 };

    dailyAttendances.forEach(att => {
      if (att.status === 'PRESENT') stats.present++;
      else if (att.status === 'LATE') stats.late++;
      else if (att.status === 'ABSENT_UNPAID') stats.absent++;
      else if (att.status === 'REMOTE') stats.remote++;
      else if (att.status === 'ON_LEAVE' || att.status === 'LEAVE') stats.onLeave++;
    });

    return stats;
  };

  const getFilteredAttendances = () => {
    let filtered = getDailyAttendances();

    if (searchTerm) {
      filtered = filtered.filter(att =>
        `${att.employee.firstName} ${att.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'ALL') filtered = filtered.filter(att => att.status === statusFilter);
    if (departmentFilter !== 'ALL' && userRole !== 'MANAGER') {
      filtered = filtered.filter(att => att.employee.department?.name === departmentFilter);
    }

    return filtered;
  };

  const uniqueDepartments = Array.from(
    new Set(getDailyAttendances().map(att => att.employee.department?.name).filter(Boolean))
  );

  const dailyStats = calculateDailyStats();
  const filteredAttendances = getFilteredAttendances();

  const selectedDayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
  const isWorkingDay = companySettings.workDays.includes(selectedDayOfWeek);

  const now = new Date();
  const dateStr = selectedDate.toISOString().split('T')[0];
  const isToday = dateStr === now.toISOString().split('T')[0];
  const absenceThreshold = new Date(selectedDate);
  absenceThreshold.setHours(companySettings.officialStartHour, companySettings.lateToleranceMinutes, 0, 0);
  const isBeforeWorkTime = isToday && now < absenceThreshold;

  const REPORT_ID = 'daily-attendance-report';

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await downloadReportPDF(REPORT_ID, `rapport-journalier-${dateStr}.pdf`, 'landscape');
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {formatDate(selectedDate)}
            </h2>
            {userRole === 'MANAGER' && (
              <span className="text-xs text-sky-500 font-bold mt-1 block">Votre département</span>
            )}
            <button
              onClick={() => setSelectedDate(new Date())}
              className="text-sm text-sky-500 hover:text-sky-600 font-medium mt-1"
            >
              Aujourd&apos;hui
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTimeout(() => printReport(REPORT_ID), 50)}
              title="Imprimer le rapport"
              className="p-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              title="Télécharger en PDF"
              className="p-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500 disabled:opacity-40"
            >
              {isExportingPdf ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
            </button>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              disabled={selectedDate >= new Date()}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>

      {!isWorkingDay && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
          <Calendar size={24} className="text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Jour non ouvrable</strong> selon la configuration de l&apos;entreprise (jours configurés : {companySettings.workDays.map(d => ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][d === 7 ? 0 : d]).join(', ')})
          </p>
        </div>
      )}

      {isBeforeWorkTime && isWorkingDay && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
          <Timer size={24} className="text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Avant l&apos;heure de travail</strong>
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Les absences seront comptabilisées à partir de {String(companySettings.officialStartHour).padStart(2, '0')}h{String(companySettings.lateToleranceMinutes).padStart(2, '0')}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: dailyStats.total, color: 'gray', Icon: Users },
          { label: 'Présents', value: dailyStats.present, color: 'emerald', Icon: UserCheck },
          { label: 'Retards', value: dailyStats.late, color: 'orange', Icon: Timer },
          { label: 'Absents', value: dailyStats.absent, color: 'red', Icon: UserX },
          { label: 'Remote', value: dailyStats.remote, color: 'purple', Icon: MapPin },
          { label: 'Congés', value: dailyStats.onLeave, color: 'sky', Icon: Calendar },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg`}>
                <Icon size={20} className={`text-${color}-600 dark:text-${color}-400`} />
              </div>
              <div>
                <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="ALL">Tous statuts</option>
            <option value="PRESENT">Présents</option>
            <option value="LATE">Retards</option>
            <option value="ABSENT_UNPAID">Absents</option>
            <option value="REMOTE">Remote</option>
          </select>

          {userRole !== 'MANAGER' && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="ALL">Tous dép.</option>
              {uniqueDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Employé</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Département</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Entrée</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Sortie</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Durée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      {!isWorkingDay ? (
                        <>
                          <CalendarOff size={36} className="text-gray-300" />
                          <p className="text-lg font-bold text-gray-700 dark:text-gray-300">Jour non ouvrable</p>
                          <p className="text-sm text-gray-500">Ce jour n&apos;est pas configuré comme jour de travail</p>
                        </>
                      ) : isBeforeWorkTime ? (
                        <>
                          <Timer size={36} className="text-gray-300" />
                          <p className="text-lg font-bold text-gray-700 dark:text-gray-300">Avant l&apos;heure de travail</p>
                          <p className="text-sm text-gray-500">Les absences seront comptabilisées à partir de {String(companySettings.officialStartHour).padStart(2, '0')}h{String(companySettings.lateToleranceMinutes).padStart(2, '0')}</p>
                        </>
                      ) : (
                        <>
                          <Inbox size={36} className="text-gray-300" />
                          <p className="text-lg font-bold text-gray-700 dark:text-gray-300">Aucun pointage</p>
                          <p className="text-sm text-gray-500">Aucune activité enregistrée ce jour-là</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAttendances.map(att => (
                  <tr
                    key={att.id}
                    onClick={() => setSelectedRow(att)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sm font-bold text-sky-600 overflow-hidden shrink-0">
                          {att.employee.photoUrl
                            ? <img src={att.employee.photoUrl} className="w-full h-full object-cover" alt="" />
                            : `${att.employee.firstName[0]}${att.employee.lastName[0]}`}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{att.employee.firstName} {att.employee.lastName}</p>
                          <p className="text-xs text-gray-500">{att.employee.employeeNumber || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{att.employee.department?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(att.status)}`}>
                        {getStatusLabel(att.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-white">{formatTime(att.checkIn)}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-white">{formatTime(att.checkOut)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{att.totalHours ? `${att.totalHours.toFixed(1)}h` : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sidebar de détail employé */}
      <EmployeeDayDetailSidebar
        open={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        detail={selectedRow}
      />

      {/* Rapport imprimable — hors écran, généré depuis les données déjà chargées */}
      <div style={{ position: 'fixed', top: -99999, left: -99999 }}>
        <DailyAttendanceReportPrintable
          id={REPORT_ID}
          company={company || {}}
          dateLabel={formatDate(selectedDate)}
          rows={filteredAttendances}
          stats={dailyStats}
        />
      </div>
    </div>
  );
}
