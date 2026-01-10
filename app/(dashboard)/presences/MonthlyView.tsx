import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/services/api';

interface MonthlyViewProps {
  data: any;
  date: Date;
  setDate: (date: Date) => void;
  userRole: string;
  userDepartment: string;
}

export default function MonthlyView({ data, date, setDate, userRole, userDepartment }: MonthlyViewProps) {
  
  const [companyCreatedAt, setCompanyCreatedAt] = useState<Date | null>(null);
  const [officialStartHour, setOfficialStartHour] = useState<number>(8);
  const [lateToleranceMinutes, setLateToleranceMinutes] = useState<number>(60);
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);

  useEffect(() => {
    if (data?.settings) {
      console.log('📥 Settings reçus du backend:', data.settings);
      setOfficialStartHour(data.settings.officialStartHour || 8);
      setLateToleranceMinutes(data.settings.lateToleranceMinutes || 0);
      setWorkDays(data.settings.workDays || [1, 2, 3, 4, 5]);
    }
  }, [data?.settings]);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const res: any = await api.get('/auth/me');
        if (res.employee?.company?.createdAt) {
          setCompanyCreatedAt(new Date(res.employee.company.createdAt));
        }
      } catch (e) {
        console.error('Erreur récupération infos entreprise:', e);
      }
    };
    fetchCompanyInfo();
  }, []);

  const today = new Date();
  const currentDayStart = new Date(
    today.getFullYear(), 
    today.getMonth(), 
    today.getDate(), 
    officialStartHour, 
    lateToleranceMinutes, 
    0
  );
  
  const effectiveToday = today < currentDayStart 
    ? new Date(today.getTime() - 24 * 60 * 60 * 1000) 
    : today;
  
  effectiveToday.setHours(23, 59, 59, 999);
  
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
    const dayOfWeek = dayDate.getDay();
    const normalizedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
    return workDays.includes(normalizedDay);
  };

  const getStatus = (empId: string, day: number) => {
    if (!data) return 'future';
    
    if (isBeforeCompanyCreation()) {
      return 'before-company';
    }
    
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const cellDate = new Date(date.getFullYear(), date.getMonth(), day);
    cellDate.setHours(23, 59, 59, 999);
    
    if (!isWorkingDay(day)) {
      return 'non-working';
    }
    
    if (cellDate > effectiveToday) {
      return 'future';
    }
    
    const empIndex = data.employees.findIndex((e: any) => e.id === empId);
    if (empIndex === -1 || !data.dayStatuses?.[empIndex]) {
      return 'future';
    }
    
    const dayStatus = data.dayStatuses[empIndex].find((ds: any) => ds.date === dateStr);
    
    if (!dayStatus) {
      return 'future';
    }
    
    switch (dayStatus.status) {
      case 'PRESENT': return 'present';
      case 'LATE': return 'late';
      case 'ABSENT_UNPAID': return 'absent';
      case 'REMOTE': return 'remote';
      case 'LEAVE': return 'leave';
      case 'HOLIDAY': return 'holiday';
      case 'OFF_DAY': return 'non-working';
      case 'FUTURE': return 'future';
      default: return 'future';
    }
  };

  const StatusCell = ({ status, isToday }: { status: string; isToday: boolean }) => {
    const colors: any = {
      present: 'bg-emerald-400',
      late: 'bg-orange-400',
      absent: 'bg-red-400',
      remote: 'bg-purple-400',
      leave: 'bg-sky-400',
      holiday: 'bg-blue-400',
      'non-working': 'bg-gray-300 dark:bg-gray-700',
      future: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
      'before-company': 'bg-gray-100 dark:bg-gray-800 opacity-50',
    };
    
    const labels: any = {
      present: 'PRÉSENT',
      late: 'RETARD',
      absent: 'ABSENT NON JUSTIFIÉ',
      remote: 'TÉLÉTRAVAIL',
      leave: 'CONGÉ',
      holiday: 'JOUR FÉRIÉ',
      'non-working': 'JOUR NON OUVRABLE (CONFIG)',
      future: 'JOUR FUTUR',
      'before-company': 'AVANT CRÉATION ENTREPRISE'
    };
    
    return (
      <div 
        className={`w-full h-full min-h-[32px] min-w-[24px] border-b border-r ${colors[status]} ${isToday ? 'ring-2 ring-sky-500 ring-inset' : 'border-gray-100 dark:border-gray-800'}`}
        title={labels[status] || status.toUpperCase()}
      ></div>
    );
  };

  const filteredEmployees = data?.employees.filter((emp: any) => {
    if (userRole === 'MANAGER' && userDepartment) {
      return emp.department?.name === userDepartment;
    }
    return true;
  }) || [];

  const currentDay = date.getMonth() === effectiveToday.getMonth() && date.getFullYear() === effectiveToday.getFullYear() 
    ? effectiveToday.getDate() 
    : null;

  const formatWorkDays = () => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return workDays
      .map(d => dayNames[d === 7 ? 0 : d])
      .join(', ');
  };

  const getDayName = (day: number) => {
    const dayDate = new Date(date.getFullYear(), date.getMonth(), day);
    return dayDate.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3).toUpperCase();
  };

  const workingDaysCount = daysArray.filter(d => isWorkingDay(d)).length;

  return (
    <div className="space-y-4">
      {isBeforeCompanyCreation() && companyCreatedAt && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
          <div className="text-2xl">⚠️</div>
          <div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
              Mois avant création de l'entreprise
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Votre entreprise a été créée le {companyCreatedAt.toLocaleDateString('fr-FR')}. Les données de ce mois ne sont pas disponibles.
            </p>
          </div>
        </div>
      )}

      {currentDay && !isBeforeCompanyCreation() && (
        <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <p className="text-sm text-sky-700 dark:text-sky-300">
              📅 <strong>Aujourd'hui :</strong> {currentDay} {date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-xs text-sky-600 dark:text-sky-400 mt-1">
              Nouveau jour à {String(officialStartHour).padStart(2, '0')}h{String(lateToleranceMinutes).padStart(2, '0')} • 
              Jours ouvrables : {formatWorkDays()} ({workingDaysCount} jours ce mois-ci)
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Légende</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-400"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Présent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-400"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Retard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-400"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Absent non justifié</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-purple-400"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Télétravail</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-sky-400"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Congé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-400"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Jour férié</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gray-300 dark:bg-gray-700 border border-gray-400"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Jour non ouvrable (selon config)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white dark:bg-gray-900 border-2 border-gray-300"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Jour futur (pas encore pointé)</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[600px]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Grille mensuelle {userRole === 'MANAGER' ? `- ${userDepartment}` : ''} 
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({workingDaysCount} jours ouvrables / {daysInMonth} jours au total)
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1))} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold capitalize px-4">
              {date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1))} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#0ea5e9 transparent'}}>
          <div className="inline-block min-w-full align-middle">
            <div className="border-b border-gray-200 dark:border-gray-700 flex">
              <div className="sticky left-0 z-20 w-48 shrink-0 bg-gray-100 dark:bg-gray-800 p-3 font-bold text-xs uppercase border-r text-gray-500">
                Employé
              </div>
              {daysArray.map(d => {
                const isToday = d === currentDay;
                const cellDate = new Date(date.getFullYear(), date.getMonth(), d);
                cellDate.setHours(23, 59, 59, 999);
                const isFuture = cellDate > effectiveToday;
                const dayName = getDayName(d);
                const isWorking = isWorkingDay(d);
                
                return (
                  <div 
                    key={d} 
                    className={`w-10 shrink-0 text-center p-2 border-r ${
                      isToday 
                        ? 'bg-sky-100 dark:bg-sky-900/50' 
                        : !isWorking
                        ? 'bg-gray-300 dark:bg-gray-700'
                        : isFuture || isBeforeCompanyCreation()
                        ? 'bg-gray-50 dark:bg-gray-900'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className={`text-[10px] font-bold ${
                      isToday 
                        ? 'text-sky-600 dark:text-sky-400'
                        : !isWorking
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-gray-400'
                    }`}>
                      {dayName}
                    </div>
                    <div className={`text-xs font-bold ${
                      isToday 
                        ? 'text-sky-600 dark:text-sky-400'
                        : !isWorking
                        ? 'text-gray-500 dark:text-gray-400'
                        : isFuture || isBeforeCompanyCreation()
                        ? 'text-gray-400'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {d}
                    </div>
                    {isToday && (
                      <div className="w-1.5 h-1.5 bg-sky-500 rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredEmployees.map((emp: any) => (
                <div key={emp.id} className="flex hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <div className="sticky left-0 z-10 w-48 shrink-0 bg-white dark:bg-gray-800 p-3 border-r flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600">
                      {emp.firstName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate text-gray-900 dark:text-white">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">{emp.department?.name || '-'}</p>
                    </div>
                  </div>
                  {daysArray.map(d => {
                    const isToday = d === currentDay;
                    return (
                      <div key={d} className="w-10 shrink-0">
                        <StatusCell status={getStatus(emp.id, d)} isToday={isToday} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}