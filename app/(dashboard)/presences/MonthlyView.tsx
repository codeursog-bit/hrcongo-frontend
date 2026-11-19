import { localDateKey, attendanceCutoff, monthlyAttendanceStatus } from '@/lib/attendance-calendar';
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/services/api';
import { isWorkDay } from '@/lib/work-days';

interface MonthlyViewProps {
  data: any;
  date: Date;
  setDate: (date: Date) => void;
  userRole: string;
  userDepartment: string;
  canRecordAttendanceForAll?: boolean; // 🆕 permission "secrétaire" : pointage manuel pour tout le monde
}

export default function MonthlyView({ data, date, setDate, userRole, userDepartment, canRecordAttendanceForAll = false }: MonthlyViewProps) {

  const [companyCreatedAt, setCompanyCreatedAt] = useState<Date | null>(null);
  const settings = data?.settings ?? {};
  const workDays: number[] = settings.workDays ?? [1, 2, 3, 4, 5];

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const res: any = await api.get('/auth/me');
        if (res.company?.createdAt) {
          setCompanyCreatedAt(new Date(res.company.createdAt));
        }
      } catch (e) {
        console.error('Erreur récupération infos entreprise:', e);
      }
    };
    fetchCompanyInfo();
  }, []);

  const today = new Date();
  const currentDayStart = attendanceCutoff(today, settings);

  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isBeforeCompanyCreation = () => {
    if (!companyCreatedAt) return false;
    const viewedMonthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const companyStart = new Date(companyCreatedAt.getFullYear(), companyCreatedAt.getMonth(), 1);
    return viewedMonthStart < companyStart;
  };

  const isWorkingDay = (day: number): boolean => {
    const dayDate = new Date(date.getFullYear(), date.getMonth(), day);
    return isWorkDay(workDays, dayDate.getDay()); // 🕐 0 = dimanche (ou 7 lu comme 0)
  };

  const getStatus = (empId: string, day: number) => {
    // ✅ Protection complète : data, employees, dayStatuses
    if (!data || !data.employees || !Array.isArray(data.employees)) return 'future';

    if (isBeforeCompanyCreation()) return 'before-company';

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const cellDate = new Date(date.getFullYear(), date.getMonth(), day);
    cellDate.setHours(23, 59, 59, 999);

    const empIndex = data.employees.findIndex((e: any) => e.id === empId);
    if (empIndex === -1) return 'future';

    // ✅ Protection dayStatuses
    const dayStatusesRow = data.dayStatuses?.[empIndex];
    if (!dayStatusesRow || !Array.isArray(dayStatusesRow)) return 'future';

    const dayStatus = dayStatusesRow.find((ds: any) => ds.date === dateStr);
    return monthlyAttendanceStatus(cellDate, isWorkingDay(day), dayStatus, today, settings);
  };

  const StatusCell = ({ status, isToday }: { status: string; isToday: boolean }) => {
    const colors: Record<string, string> = {
      present:           'bg-[var(--brand)]',
      late:              'bg-[var(--mustard)]',
      absent:            'bg-[var(--danger)]',
      remote:            'bg-[var(--brand)]',
      leave:             'bg-[var(--text-muted)]',
      holiday:           'bg-[var(--text-muted)]',
      'non-working':     'bg-[var(--border)]',
      future:            'bg-[var(--surface)] border-[var(--border)]',
      'before-company':  'bg-[var(--surface-2)] opacity-50',
    };

    const labels: Record<string, string> = {
      present:          'PRÉSENT',
      late:             'RETARD',
      absent:           'ABSENT NON JUSTIFIÉ',
      remote:           'TÉLÉTRAVAIL',
      leave:            'CONGÉ',
      holiday:          'JOUR FÉRIÉ',
      'non-working':    'JOUR NON OUVRABLE (CONFIG)',
      future:           'JOUR FUTUR',
      'before-company': 'AVANT CRÉATION ENTREPRISE',
    };

    return (
      <div
        className={`w-full h-full min-h-[32px] min-w-[24px] border-b border-r ${colors[status] ?? 'bg-[var(--surface-2)]'} ${isToday ? 'ring-2 ring-[var(--focus)] ring-inset' : 'border-[var(--border)]'}`}
        title={labels[status] ?? status.toUpperCase()}
      />
    );
  };

  // ✅ Protection sur filteredEmployees
  const employees: any[] = Array.isArray(data?.employees) ? data.employees : [];

  const filteredEmployees = employees.filter((emp: any) => {
    if (userRole === 'MANAGER' && userDepartment && !canRecordAttendanceForAll) {
      return emp.department?.name === userDepartment;
    }
    return true;
  });

  const currentDay =
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
      ? today.getDate()
      : null;

  const formatWorkDays = () => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return workDays.map(d => dayNames[d === 7 ? 0 : d]).join(', ');
  };

  const getDayName = (day: number) => {
    const dayDate = new Date(date.getFullYear(), date.getMonth(), day);
    return dayDate.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3).toUpperCase();
  };

  const workingDaysCount = daysArray.filter(d => isWorkingDay(d)).length;

  return (
    <div className="space-y-4">
      {isBeforeCompanyCreation() && companyCreatedAt && (
        <div className="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)]  rounded-xl p-4 flex items-center gap-3">
          <div className="text-2xl"></div>
          <div>
            <p className="text-sm font-semibold text-[var(--warning-text)] ">
              Mois avant création de l'entreprise
            </p>
            <p className="text-xs text-[var(--warning-text)] ">
              Votre entreprise a été créée le {companyCreatedAt.toLocaleDateString('fr-FR')}. Les données de ce mois ne sont pas disponibles.
            </p>
          </div>
        </div>
      )}

      {currentDay && !isBeforeCompanyCreation() && (
        <div className="bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  border border-[var(--border)]  rounded-xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-[var(--brand)] rounded-full " />
          <div className="flex-1">
            <p className="text-sm text-[var(--success-text)] ">
               <strong>Aujourd'hui :</strong> {currentDay} {date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-xs text-[var(--success-text)]  mt-1">
              Absences du jour comptabilisées à partir de {String(currentDayStart.getHours()).padStart(2, '0')}h{String(currentDayStart.getMinutes()).padStart(2, '0')} ·
              Jours ouvrables : {formatWorkDays()} ({workingDaysCount} jours ce mois-ci)
            </p>
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
        <h4 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Légende</h4>
        <div className="flex flex-wrap gap-4">
          {[
            { color: 'bg-[var(--brand)]', label: 'Présent' },
            { color: 'bg-[var(--mustard)]',  label: 'Retard' },
            { color: 'bg-[var(--danger)]',     label: 'Absent non justifié' },
            { color: 'bg-[var(--brand)]',  label: 'Télétravail' },
            { color: 'bg-[var(--text-muted)]',     label: 'Congé' },
            { color: 'bg-[var(--text-muted)]',    label: 'Jour férié' },
            { color: 'bg-[var(--border)]', label: 'Jour non ouvrable' },
            { color: 'bg-[var(--surface)] border-2 border-[var(--border)]',  label: 'Jour futur' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded ${color}`} />
              <span className="text-xs text-[var(--text-muted)]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grille */}
      <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden min-h-[600px]">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text)]">
            Grille mensuelle {userRole === 'MANAGER' && !canRecordAttendanceForAll ? `- ${userDepartment}` : ''}
            <span className="text-sm font-normal text-[var(--text-muted)] ml-2">
              ({workingDaysCount} jours ouvrables / {daysInMonth} jours au total)
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1))}
              className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors" aria-label="Période précédente">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold capitalize px-4">
              {date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1))}
              className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors" aria-label="Période suivante">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* ✅ Message si data pas encore chargé */}
        {!data || !data.employees ? (
          <div className="flex items-center justify-center py-32 text-[var(--text-muted)]">
            <p className="text-sm">Chargement des données...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex items-center justify-center py-32 text-[var(--text-muted)]">
            <p className="text-sm">Aucun employé à afficher.</p>
          </div>
        ) : (
          <div className="overflow-x-auto attendance-table-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--brand) transparent' }} tabIndex={0} role="region" aria-label="Tableau défilant horizontalement">
            <div className="inline-block min-w-full align-middle">
              {/* En-tête jours */}
              <div className="border-b border-[var(--border)] flex">
                <div className="sticky left-0 z-20 w-48 shrink-0 bg-[var(--surface-2)] p-3 font-semibold text-xs  border-r border-[var(--border)] text-[var(--text-muted)]">
                  Employé
                </div>
                {daysArray.map(d => {
                  const isToday = d === currentDay;
                  const cellDate = new Date(date.getFullYear(), date.getMonth(), d);
                  cellDate.setHours(23, 59, 59, 999);
                  const isFuture = localDateKey(cellDate) > localDateKey(today);
                  const dayName = getDayName(d);
                  const isWorking = isWorkingDay(d);

                  return (
                    <div key={d} className={`w-10 shrink-0 text-center p-2 border-r ${
                      isToday
                        ? 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] '
                        : !isWorking
                        ? 'bg-[var(--border)]'
                        : isFuture || isBeforeCompanyCreation()
                        ? 'bg-[var(--surface-2)]'
                        : 'bg-[var(--surface-2)]'
                    }`}>
                      <div className={`text-[10px] font-semibold ${
                        isToday ? 'text-[var(--success-text)] '
                        : !isWorking ? 'text-[var(--text-muted)]'
                        : 'text-[var(--text-muted)]'
                      }`}>{dayName}</div>
                      <div className={`text-xs font-semibold ${
                        isToday ? 'text-[var(--success-text)] '
                        : !isWorking ? 'text-[var(--text-muted)]'
                        : isFuture || isBeforeCompanyCreation() ? 'text-[var(--text-muted)]'
                        : 'text-[var(--text-muted)]'
                      }`}>{d}</div>
                      {isToday && <div className="w-1.5 h-1.5 bg-[var(--brand)] rounded-full mx-auto mt-0.5" />}
                    </div>
                  );
                })}
              </div>

              {/* Lignes employés */}
              <div className="divide-y divide-[var(--border)]">
                {filteredEmployees.map((emp: any) => (
                  <div key={emp.id} className="flex hover:bg-[var(--surface-2)] transition-colors">
                    <div className="sticky left-0 z-10 w-48 shrink-0 bg-[var(--surface)] p-3 border-r flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-xs font-semibold text-[var(--text-muted)]">
                        {emp.firstName?.[0] ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-[var(--text)]">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">{emp.department?.name || '-'}</p>
                      </div>
                    </div>
                    {daysArray.map(d => (
                      <div key={d} className="w-10 shrink-0">
                        <StatusCell status={getStatus(emp.id, d)} isToday={d === currentDay} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
