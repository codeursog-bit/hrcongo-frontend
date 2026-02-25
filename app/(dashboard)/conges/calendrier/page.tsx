
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, 
//   Search, Download, Users, AlertTriangle, ArrowLeft, MoreHorizontal,
//   CheckCircle2, Printer, FileSpreadsheet, CalendarDays, BarChart3,
//   Umbrella, Stethoscope, Baby, User, Ban, Star, Info, Loader2
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';

// type ViewType = 'month' | 'quarter' | 'year';
// type LeaveType = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'SPECIAL';

// interface LeaveEvent {
//   id: string;
//   employeeId: string;
//   name: string;
//   avatar: string;
//   department: string;
//   type: LeaveType;
//   startDate: string;
//   endDate: string;
//   status: string;
// }

// const LEAVE_TYPES_CONFIG: Record<string, { label: string, color: string, bg: string, icon: any }> = {
//   ANNUAL: { label: 'Congés Annuels', color: 'bg-sky-500', bg: 'bg-sky-100 dark:bg-sky-900/30', icon: Umbrella },
//   SICK: { label: 'Maladie', color: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900/30', icon: Stethoscope },
//   MATERNITY: { label: 'Maternité', color: 'bg-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30', icon: Baby },
//   PATERNITY: { label: 'Paternité', color: 'bg-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: User },
//   UNPAID: { label: 'Sans Solde', color: 'bg-gray-500', bg: 'bg-gray-100 dark:bg-gray-700', icon: Ban },
//   SPECIAL: { label: 'Spécial', color: 'bg-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: Star },
// };

// export default function CalendarPage() {
//   const router = useRouter();
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [view, setView] = useState<ViewType>('month');
//   const [leaves, setLeaves] = useState<LeaveEvent[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [selectedDept, setSelectedDept] = useState('Tous');

//   useEffect(() => {
//     const fetchLeaves = async () => {
//         try {
//             const data: any[] = await api.get('/leaves');
//             const mapped = data.map(l => ({
//                 id: l.id,
//                 employeeId: l.employeeId,
//                 name: `${l.employee.firstName} ${l.employee.lastName}`,
//                 avatar: l.employee.photoUrl || `https://ui-avatars.com/api/?name=${l.employee.firstName}+${l.employee.lastName}&background=random`,
//                 department: l.employee.department?.name || 'N/A',
//                 type: l.type,
//                 startDate: new Date(l.startDate).toISOString().split('T')[0],
//                 endDate: new Date(l.endDate).toISOString().split('T')[0],
//                 status: l.status
//             }));
//             setLeaves(mapped);
//         } catch (e) {
//             console.error(e);
//         } finally {
//             setIsLoading(false);
//         }
//     };
//     fetchLeaves();
//   }, []);

//   const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
//   const getFirstDayOfMonth = (year: number, month: number) => {
//     const day = new Date(year, month, 1).getDay();
//     return day === 0 ? 6 : day - 1;
//   };

//   const isDateInRange = (dateStr: string, startStr: string, endStr: string) => dateStr >= startStr && dateStr <= endStr;
//   const formatDate = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

//   const filteredLeaves = leaves.filter(l => selectedDept === 'Tous' || l.department === selectedDept);

//   const getDailyStats = (dateStr: string) => {
//     const activeLeaves = filteredLeaves.filter(l => isDateInRange(dateStr, l.startDate, l.endDate) && l.status === 'APPROVED');
//     return { count: activeLeaves.length, activeLeaves };
//   };

//   const MonthView = () => {
//     const year = currentDate.getFullYear();
//     const month = currentDate.getMonth();
//     const daysInMonth = getDaysInMonth(year, month);
//     const startDay = getFirstDayOfMonth(year, month);
//     const days = [];

//     for (let i = 0; i < startDay; i++) {
//       days.push(<div key={`pad-${i}`} className="bg-gray-50/50 dark:bg-gray-900/20 border-b border-r border-gray-100 dark:border-gray-700"></div>);
//     }

//     for (let d = 1; d <= daysInMonth; d++) {
//       const dateStr = formatDate(year, month, d);
//       const { activeLeaves } = getDailyStats(dateStr);
//       const isWeekend = new Date(year, month, d).getDay() % 6 === 0;

//       days.push(
//         <div key={d} className={`min-h-[120px] p-2 border-b border-r border-gray-100 dark:border-gray-700 ${isWeekend ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'}`}>
//           <div className="text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full text-gray-700 dark:text-gray-300 mb-1">{d}</div>
//           <div className="space-y-1">
//              {activeLeaves.slice(0, 3).map((leave, i) => (
//                 <div key={i} className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium flex items-center gap-1 ${LEAVE_TYPES_CONFIG[leave.type]?.bg || 'bg-gray-100'} ${LEAVE_TYPES_CONFIG[leave.type]?.color.replace('bg-', 'text-') || 'text-gray-600'}`}>
//                    <div className={`w-1.5 h-1.5 rounded-full ${LEAVE_TYPES_CONFIG[leave.type]?.color || 'bg-gray-400'}`}></div>
//                    {leave.name.split(' ')[0]}
//                 </div>
//              ))}
//              {activeLeaves.length > 3 && <div className="text-[10px] text-gray-400 pl-1">+{activeLeaves.length - 3} autres</div>}
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div className="border-t border-l border-gray-100 dark:border-gray-700 grid grid-cols-7">
//          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
//             <div key={day} className="p-3 text-sm font-bold text-gray-500 uppercase text-center border-b border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">{day}</div>
//          ))}
//          {days}
//       </div>
//     );
//   };

//   return (
//     <div className="max-w-[1600px] mx-auto pb-20 min-h-screen">
//       <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
//          <div className="flex items-center gap-4 w-full lg:w-auto">
//             <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border hover:bg-gray-50"><ArrowLeft size={20}/></button>
//             <div>
//                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendrier des Congés</h1>
//                <p className="text-gray-500 dark:text-gray-400 text-sm">Visualisez les absences de l'équipe.</p>
//             </div>
//          </div>
//          <div className="flex items-center gap-2">
//             <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 border rounded-lg"><ChevronLeft size={20}/></button>
//             <span className="font-bold w-32 text-center capitalize">{currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</span>
//             <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 border rounded-lg"><ChevronRight size={20}/></button>
//          </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
//          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[600px]">
//             {isLoading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-sky-500"/></div> : <MonthView />}
//          </div>
         
//          <div className="space-y-6">
//             <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
//                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Légende</h3>
//                <div className="space-y-3">
//                   {Object.values(LEAVE_TYPES_CONFIG).map((conf: any) => (
//                      <div key={conf.label} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
//                         <div className={`w-3 h-3 rounded-full ${conf.color}`}></div> {conf.label}
//                      </div>
//                   ))}
//                </div>
//             </div>
//          </div>
//       </div>
//     </div>
//   );
// }



'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, ArrowLeft, Loader2,
  Umbrella, Stethoscope, Baby, User, Ban, Star, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';

type LeaveType = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'SPECIAL';

interface LeaveEvent {
  id: string;
  employeeId: string;
  name: string;
  initials: string;
  photoUrl?: string;
  department: string;
  type: LeaveType;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  status: string;
}

const TYPE_CONFIG: Record<string, {
  label: string;
  dot: string;      // Tailwind bg class
  light: string;    // bg clair
  text: string;     // couleur texte
  icon: React.ElementType;
}> = {
  ANNUAL:    { label: 'Congés Annuels', dot: 'bg-sky-400',    light: 'bg-sky-100 dark:bg-sky-900/40',    text: 'text-sky-700 dark:text-sky-300',    icon: Umbrella },
  SICK:      { label: 'Maladie',        dot: 'bg-red-400',    light: 'bg-red-100 dark:bg-red-900/40',    text: 'text-red-700 dark:text-red-300',    icon: Stethoscope },
  MATERNITY: { label: 'Maternité',      dot: 'bg-pink-400',   light: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-700 dark:text-pink-300',  icon: Baby },
  PATERNITY: { label: 'Paternité',      dot: 'bg-blue-400',   light: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300',  icon: User },
  UNPAID:    { label: 'Sans Solde',     dot: 'bg-gray-400',   light: 'bg-gray-100 dark:bg-gray-700',    text: 'text-gray-600 dark:text-gray-300',  icon: Ban },
  SPECIAL:   { label: 'Spécial',        dot: 'bg-violet-400', light: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-300', icon: Star },
};

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isInRange(d: string, start: string, end: string): boolean {
  return d >= start && d <= end;
}

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState<LeaveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [filterDept, setFilterDept] = useState<string>('Tous');
  // Rôle pour affichage info seulement (la vraie sécurité = backend)
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    // Récup rôle pour info affichage du bandeau
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUserRole(u.role || '');
      }
    } catch {}

    const fetchLeaves = async () => {
      try {
        // Le backend retourne DÉJÀ les congés filtrés selon le rôle JWT :
        // - MANAGER → seulement son département
        // - ADMIN/HR → toute l'entreprise
        const data: any[] = await api.get('/leaves');
        const mapped: LeaveEvent[] = data.map((l) => ({
          id: l.id,
          employeeId: l.employeeId,
          name: `${l.employee.firstName} ${l.employee.lastName}`,
          initials: `${l.employee.firstName[0]}${l.employee.lastName[0]}`,
          photoUrl: l.employee.photoUrl,
          department: l.employee.department?.name || 'N/A',
          type: l.type as LeaveType,
          startDate: new Date(l.startDate).toISOString().split('T')[0],
          endDate: new Date(l.endDate).toISOString().split('T')[0],
          status: l.status,
        }));
        setLeaves(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  const departments = useMemo(() => {
    const depts = Array.from(new Set(leaves.map((l) => l.department))).sort();
    return ['Tous', ...depts];
  }, [leaves]);

  const filteredLeaves = useMemo(
    () => leaves.filter((l) => filterDept === 'Tous' || l.department === filterDept),
    [leaves, filterDept],
  );

  // Congés APPROUVÉS uniquement dans le calendrier
  const approvedLeaves = useMemo(
    () => filteredLeaves.filter((l) => l.status === 'APPROVED'),
    [filteredLeaves],
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayRaw = new Date(year, month, 1).getDay();
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1; // 0=Lun

  const getLeavesForDay = (dateStr: string) =>
    approvedLeaves.filter((l) => isInRange(dateStr, l.startDate, l.endDate));

  const selectedDayLeaves = useMemo(
    () => (selectedDay ? getLeavesForDay(selectedDay) : []),
    [selectedDay, approvedLeaves],
  );

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const todayStr = formatDate(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );

  // Stats mois
  const monthStats = useMemo(() => {
    const onLeave = new Set<string>();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(year, month, d);
      getLeavesForDay(dateStr).forEach((l) => onLeave.add(l.employeeId));
    }
    return { uniqueEmployees: onLeave.size };
  }, [approvedLeaves, year, month, daysInMonth]);

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-6">

      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Calendrier des Congés
            </h1>
            <p className="text-sm text-gray-400">
              {userRole === 'MANAGER'
                ? 'Vue limitée à votre département'
                : 'Vue complète de l\'entreprise'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtre département (visible pour ADMIN/HR qui voient plusieurs depts) */}
          {departments.length > 2 && (
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          {/* Navigation mois */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-w-[140px] text-center"
            >
              {MONTHS_FR[month]} {year}
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ── INFO MANAGER ── */}
      {userRole === 'MANAGER' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
          <Info size={16} className="text-amber-500 shrink-0" />
          <p className="text-amber-700 dark:text-amber-300">
            Vous visualisez uniquement les congés de votre département.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* ── CALENDRIER ── */}
        <div className="xl:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">

          {isLoading ? (
            <div className="flex justify-center items-center h-[500px]">
              <Loader2 className="animate-spin text-sky-500" size={32} />
            </div>
          ) : (
            <>
              {/* Jours de semaine */}
              <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
                {DAYS_FR.map((day) => (
                  <div
                    key={day}
                    className="py-3 text-xs font-bold text-gray-400 uppercase text-center tracking-wider"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Grille des jours */}
              <div className="grid grid-cols-7">
                {/* Cases vides avant le 1er */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div
                    key={`pad-${i}`}
                    className="min-h-[110px] border-b border-r border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/20"
                  />
                ))}

                {/* Jours du mois */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = formatDate(year, month, day);
                  const dayLeaves = getLeavesForDay(dateStr);
                  const isWeekend = [5, 6].includes(
                    (firstDay + i) % 7, // 5=Sam, 6=Dim (index Lun-based)
                  );
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDay;

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                      className={`min-h-[110px] border-b border-r border-gray-50 dark:border-gray-700/50 p-2 cursor-pointer transition-colors ${
                        isWeekend
                          ? 'bg-gray-50/80 dark:bg-gray-800/60'
                          : 'bg-white dark:bg-gray-800'
                      } ${isSelected ? 'ring-2 ring-inset ring-sky-400' : 'hover:bg-blue-50/30 dark:hover:bg-gray-700/30'}`}
                    >
                      {/* Numéro du jour */}
                      <div className="flex justify-end mb-1">
                        <span
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold ${
                            isToday
                              ? 'bg-sky-500 text-white'
                              : isWeekend
                              ? 'text-gray-400'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {day}
                        </span>
                      </div>

                      {/* Événements */}
                      <div className="space-y-0.5">
                        {dayLeaves.slice(0, 3).map((leave) => {
                          const cfg = TYPE_CONFIG[leave.type];
                          return (
                            <div
                              key={leave.id}
                              className={`flex items-center gap-1.5 text-[11px] px-1.5 py-0.5 rounded ${cfg.light} ${cfg.text} truncate`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
                              <span className="truncate font-medium">{leave.name.split(' ')[0]}</span>
                            </div>
                          );
                        })}
                        {dayLeaves.length > 3 && (
                          <p className="text-[10px] text-gray-400 pl-1 font-medium">
                            +{dayLeaves.length - 3} autres
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div className="xl:col-span-1 space-y-5">

          {/* Stat rapide */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Ce mois
            </p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {monthStats.uniqueEmployees}
              </span>
              <span className="text-sm text-gray-400 mb-1">
                employé{monthStats.uniqueEmployees > 1 ? 's' : ''} absent{monthStats.uniqueEmployees > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Légende */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              Légende
            </p>
            <div className="space-y-2.5">
              {Object.entries(TYPE_CONFIG).map(([, cfg]) => (
                <div key={cfg.label} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                  <span className={`w-3 h-3 rounded-full ${cfg.dot} shrink-0`} />
                  <span>{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Détail jour sélectionné */}
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-sky-100 dark:border-sky-900/40 shadow-sm"
            >
              <p className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-1">
                Absences du
              </p>
              <p className="font-bold text-gray-900 dark:text-white text-sm mb-4">
                {new Date(selectedDay + 'T00:00:00').toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>

              {selectedDayLeaves.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Aucune absence ce jour.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayLeaves.map((leave) => {
                    const cfg = TYPE_CONFIG[leave.type];
                    return (
                      <div
                        key={leave.id}
                        className={`flex items-center gap-3 p-3 rounded-xl ${cfg.light}`}
                      >
                        {leave.photoUrl ? (
                          <img
                            src={leave.photoUrl}
                            alt={leave.initials}
                            className="w-8 h-8 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${cfg.text} bg-white/60 dark:bg-black/20`}>
                            {leave.initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${cfg.text}`}>
                            {leave.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{cfg.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}