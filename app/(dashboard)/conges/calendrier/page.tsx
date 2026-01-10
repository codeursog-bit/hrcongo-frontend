
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, 
  Search, Download, Users, AlertTriangle, ArrowLeft, MoreHorizontal,
  CheckCircle2, Printer, FileSpreadsheet, CalendarDays, BarChart3,
  Umbrella, Stethoscope, Baby, User, Ban, Star, Info, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

type ViewType = 'month' | 'quarter' | 'year';
type LeaveType = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'SPECIAL';

interface LeaveEvent {
  id: string;
  employeeId: string;
  name: string;
  avatar: string;
  department: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: string;
}

const LEAVE_TYPES_CONFIG: Record<string, { label: string, color: string, bg: string, icon: any }> = {
  ANNUAL: { label: 'Congés Annuels', color: 'bg-sky-500', bg: 'bg-sky-100 dark:bg-sky-900/30', icon: Umbrella },
  SICK: { label: 'Maladie', color: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900/30', icon: Stethoscope },
  MATERNITY: { label: 'Maternité', color: 'bg-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30', icon: Baby },
  PATERNITY: { label: 'Paternité', color: 'bg-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: User },
  UNPAID: { label: 'Sans Solde', color: 'bg-gray-500', bg: 'bg-gray-100 dark:bg-gray-700', icon: Ban },
  SPECIAL: { label: 'Spécial', color: 'bg-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: Star },
};

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [leaves, setLeaves] = useState<LeaveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('Tous');

  useEffect(() => {
    const fetchLeaves = async () => {
        try {
            const data: any[] = await api.get('/leaves');
            const mapped = data.map(l => ({
                id: l.id,
                employeeId: l.employeeId,
                name: `${l.employee.firstName} ${l.employee.lastName}`,
                avatar: l.employee.photoUrl || `https://ui-avatars.com/api/?name=${l.employee.firstName}+${l.employee.lastName}&background=random`,
                department: l.employee.department?.name || 'N/A',
                type: l.type,
                startDate: new Date(l.startDate).toISOString().split('T')[0],
                endDate: new Date(l.endDate).toISOString().split('T')[0],
                status: l.status
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

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const isDateInRange = (dateStr: string, startStr: string, endStr: string) => dateStr >= startStr && dateStr <= endStr;
  const formatDate = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const filteredLeaves = leaves.filter(l => selectedDept === 'Tous' || l.department === selectedDept);

  const getDailyStats = (dateStr: string) => {
    const activeLeaves = filteredLeaves.filter(l => isDateInRange(dateStr, l.startDate, l.endDate) && l.status === 'APPROVED');
    return { count: activeLeaves.length, activeLeaves };
  };

  const MonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`pad-${i}`} className="bg-gray-50/50 dark:bg-gray-900/20 border-b border-r border-gray-100 dark:border-gray-700"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(year, month, d);
      const { activeLeaves } = getDailyStats(dateStr);
      const isWeekend = new Date(year, month, d).getDay() % 6 === 0;

      days.push(
        <div key={d} className={`min-h-[120px] p-2 border-b border-r border-gray-100 dark:border-gray-700 ${isWeekend ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'}`}>
          <div className="text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full text-gray-700 dark:text-gray-300 mb-1">{d}</div>
          <div className="space-y-1">
             {activeLeaves.slice(0, 3).map((leave, i) => (
                <div key={i} className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium flex items-center gap-1 ${LEAVE_TYPES_CONFIG[leave.type]?.bg || 'bg-gray-100'} ${LEAVE_TYPES_CONFIG[leave.type]?.color.replace('bg-', 'text-') || 'text-gray-600'}`}>
                   <div className={`w-1.5 h-1.5 rounded-full ${LEAVE_TYPES_CONFIG[leave.type]?.color || 'bg-gray-400'}`}></div>
                   {leave.name.split(' ')[0]}
                </div>
             ))}
             {activeLeaves.length > 3 && <div className="text-[10px] text-gray-400 pl-1">+{activeLeaves.length - 3} autres</div>}
          </div>
        </div>
      );
    }

    return (
      <div className="border-t border-l border-gray-100 dark:border-gray-700 grid grid-cols-7">
         {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="p-3 text-sm font-bold text-gray-500 uppercase text-center border-b border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">{day}</div>
         ))}
         {days}
      </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20 min-h-screen">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
         <div className="flex items-center gap-4 w-full lg:w-auto">
            <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border hover:bg-gray-50"><ArrowLeft size={20}/></button>
            <div>
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendrier des Congés</h1>
               <p className="text-gray-500 dark:text-gray-400 text-sm">Visualisez les absences de l'équipe.</p>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 border rounded-lg"><ChevronLeft size={20}/></button>
            <span className="font-bold w-32 text-center capitalize">{currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 border rounded-lg"><ChevronRight size={20}/></button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
         <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[600px]">
            {isLoading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-sky-500"/></div> : <MonthView />}
         </div>
         
         <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
               <h3 className="font-bold text-gray-900 dark:text-white mb-4">Légende</h3>
               <div className="space-y-3">
                  {Object.values(LEAVE_TYPES_CONFIG).map((conf: any) => (
                     <div key={conf.label} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className={`w-3 h-3 rounded-full ${conf.color}`}></div> {conf.label}
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
