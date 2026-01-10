'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Fingerprint, FileText, Loader2, Activity, BarChart3, 
  CalendarIcon, Edit3, User, ChevronLeft, ChevronRight
} from 'lucide-react';
import { api } from '@/services/api';

import DailyView from './DailyView';
import WeeklyView from './WeeklyView';
import MonthlyView from './MonthlyView';
import CorrectionsView from './CorrectionsView';
import EmployeeView from './EmployeeView';

type TabType = 'monthly' | 'daily' | 'weekly' | 'corrections' | 'myview';

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState<any>(null);
  const [myAttendances, setMyAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [userRole, setUserRole] = useState<string>('');
  const [userDepartment, setUserDepartment] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [employeeProfile, setEmployeeProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setUserRole(user.role);
        
        if (user.role === 'EMPLOYEE') {
          setActiveTab('myview');
          
          try {
            const empProfile: any = await api.get('/employees/me');
            setEmployeeProfile(empProfile);
            console.log('✅ Profil employé chargé:', empProfile);
          } catch (e) {
            console.error('❌ Erreur récupération profil employé:', e);
          }
        }
      }

      try {
        const res: any = await api.get('/auth/me');
        setCurrentUser(res);
        setUserRole(res.role);
        if (res.employee?.department?.name) {
          setUserDepartment(res.employee.department.name);
        }
        
        if (res.role === 'EMPLOYEE') {
          setActiveTab('myview');
        }
      } catch (e) {
        console.error('Erreur chargement utilisateur:', e);
      }
    };
    
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    if (activeTab === 'monthly') fetchMonthlyData();
    else if (activeTab === 'weekly') fetchWeeklyData();
    else if (activeTab === 'corrections') fetchCorrectionsData();
    else if (activeTab === 'myview') fetchMyAttendances();
    else if (activeTab === 'daily') setIsLoading(false);
  }, [activeTab, date, currentUser, employeeProfile]);

  const fetchMonthlyData = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get(`/attendance?month=${date.getMonth() + 1}&year=${date.getFullYear()}`);
      setData(res);
    } catch (e) {
      console.error('Erreur chargement données mensuelles:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklyData = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get(`/attendance/report?month=${date.getMonth() + 1}&year=${date.getFullYear()}`);
      setData(res);
    } catch (e) {
      console.error('Erreur chargement données hebdomadaires:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCorrectionsData = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get(`/attendance?month=${date.getMonth() + 1}&year=${date.getFullYear()}`);
      setData(res);
    } catch (e) {
      console.error('Erreur chargement corrections:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyAttendances = async () => {
    if (!employeeProfile?.id) {
      console.log('⚠️ Pas de profil employé, skip fetchMyAttendances');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    console.log(`🔍 Chargement pointages pour ${employeeProfile.id} - ${date.getMonth() + 1}/${date.getFullYear()}`);
    
    try {
      const res: any = await api.get(`/attendance/employee/${employeeProfile.id}?month=${date.getMonth() + 1}&year=${date.getFullYear()}`);
      console.log('✅ Pointages reçus:', res);
      setMyAttendances(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('❌ Erreur chargement mes présences:', e);
      setMyAttendances([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen pb-20 flex justify-center items-center">
        <Loader2 className="animate-spin text-sky-500" size={48}/>
      </div>
    );
  }

  if (userRole === 'EMPLOYEE') {
    return (
      <div className="min-h-screen pb-20 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Mes Présences
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Votre calendrier de travail détaillé
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/presences/pointage" className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-sky-500/30">
              <Fingerprint size={20} /> Pointeur
            </Link>
            
            <div className="bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center">
              <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ChevronLeft size={18} />
              </button>
              <span className="w-32 text-center font-bold text-sm capitalize text-gray-900 dark:text-white">
                {date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-center items-center min-h-[600px]">
            <Loader2 className="animate-spin text-sky-500" size={48}/>
          </div>
        ) : (
          <EmployeeView myAttendances={myAttendances} date={date} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Présences Équipe
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Gestion complète des temps et activités
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/presences/resume" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
            <FileText size={20} /> Rapports
          </Link>
          
          <Link href="/presences/pointage" className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-sky-500/30">
            <Fingerprint size={20} /> Ma Pointeuse
          </Link>
          
          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center">
            <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ChevronLeft size={18} />
            </button>
            <span className="w-32 text-center font-bold text-sm capitalize text-gray-900 dark:text-white">
              {date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 border border-gray-200 dark:border-gray-700 flex gap-2 overflow-x-auto">
        <button onClick={() => setActiveTab('daily')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'daily' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
          <Activity size={20} /> Journalière
        </button>
        <button onClick={() => setActiveTab('weekly')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'weekly' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
          <BarChart3 size={20} /> Hebdomadaire
        </button>
        <button onClick={() => setActiveTab('monthly')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'monthly' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
          <CalendarIcon size={20} /> Mensuelle
        </button>
        <button onClick={() => setActiveTab('corrections')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'corrections' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
          <Edit3 size={20} /> Corrections
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-center items-center min-h-[600px]">
          <Loader2 className="animate-spin text-sky-500" size={48}/>
        </div>
      ) : (
        <>
          {activeTab === 'daily' && (
            <DailyView 
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              userRole={userRole}
              userDepartment={userDepartment}
            />
          )}

          {activeTab === 'weekly' && (
            <WeeklyView 
              userRole={userRole}
              userDepartment={userDepartment}
              date={date}
            />
          )}

          {activeTab === 'monthly' && data && (
            <MonthlyView 
              data={data}
              date={date}
              setDate={setDate}
              userRole={userRole}
              userDepartment={userDepartment}
            />
          )}

          {activeTab === 'corrections' && data && (
            <CorrectionsView 
              data={data}
              userRole={userRole}
              userDepartment={userDepartment}
              onRefresh={fetchCorrectionsData}
            />
          )}
        </>
      )}
    </div>
  );
}