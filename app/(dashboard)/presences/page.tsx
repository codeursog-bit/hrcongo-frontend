'use client';

import { AttendanceLoadError } from '@/components/attendance/AttendanceLoadError';
import { AttendanceModuleFrame } from '@/components/attendance/AttendanceModuleFrame';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Fingerprint, FileText, Activity, BarChart3,
  CalendarIcon, Edit3, User, ChevronLeft, ChevronRight
} from 'lucide-react';
import { api } from '@/services/api';

import DailyView from './DailyView';
import WeeklyView from './WeeklyView';
import MonthlyView from './MonthlyView';
import CorrectionsView from './CorrectionsView';
import EmployeeView from './EmployeeView';
import PresenceSubNav from '@/components/PresenceSubNav';
import { useBasePath } from '@/hooks/useBasePath';
import { KonzaLoader } from '@/components/ui/KonzaLoader';

type TabType = 'monthly' | 'daily' | 'weekly' | 'corrections' | 'myview';

function AttendancePageContent() {
  const [uiLoadError,setUiLoadError]=useState('');
  const { bp } = useBasePath();
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
  // 🆕 Permission "secrétaire" : pointage manuel pour tout le monde
  const [hasAttendanceAllPermission, setHasAttendanceAllPermission] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setUserRole(user.role);
        setHasAttendanceAllPermission(!!user.canRecordAttendanceForAll); // 🆕

        if (user.role === 'EMPLOYEE' && !user.canRecordAttendanceForAll) {
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
        setHasAttendanceAllPermission(!!res.canRecordAttendanceForAll); // 🆕
        if (res.employee?.department?.name) {
          setUserDepartment(res.employee.department.name);
        }

        if (res.role === 'EMPLOYEE' && !res.canRecordAttendanceForAll) {
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
    else if (activeTab === 'corrections') fetchCorrectionsData();
    else if (activeTab === 'myview') fetchMyAttendances();
    else if (activeTab === 'daily' || activeTab === 'weekly') setIsLoading(false);
  }, [activeTab, date, currentUser, employeeProfile]);

  const fetchMonthlyData = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get(`/attendance?month=${date.getMonth() + 1}&year=${date.getFullYear()}`);
      setData(res);
      setUiLoadError('');
    } catch (e) {
      console.error('Erreur chargement données mensuelles:', e);
      setUiLoadError('Impossible de charger les pr\u00e9sences. R\u00e9essayez.');
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
      <KonzaLoader variant="page" />
    );
  }

  if (userRole === 'EMPLOYEE' && !hasAttendanceAllPermission) {
    return (
      <div className="min-h-screen pb-20 space-y-6">
        <PresenceSubNav userRole={userRole} />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 attendance-page-header">
          <div className="attendance-page-heading">
            <h1 className="text-3xl font-semibold text-[var(--text)]">
              Mes Présences
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
              Votre calendrier de travail détaillé
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href={bp("/presences/pointage")} className="bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] px-5 py-3 rounded-xl font-semibold flex items-center gap-2 ">
              <Fingerprint size={20} /> Pointeur
            </Link>

            <div className="bg-[var(--surface)] p-1.5 rounded-xl border border-[var(--border)] flex items-center">
              <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1))} className="p-2 hover:bg-[var(--surface-2)] rounded-lg" aria-label="Période précédente">
                <ChevronLeft size={18} />
              </button>
              <span className="w-32 text-center font-semibold text-sm capitalize text-[var(--text)]">
                {date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1))} className="p-2 hover:bg-[var(--surface-2)] rounded-lg" aria-label="Période suivante">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] flex justify-center items-center min-h-[600px]">
            <KonzaLoader variant="section" />
          </div>
        ) : (
          <EmployeeView myAttendances={myAttendances} date={date} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 space-y-6">
      <PresenceSubNav userRole={userRole} canRecordAttendanceForAll={hasAttendanceAllPermission} />
      <AttendanceLoadError message={uiLoadError} retry={fetchMonthlyData} />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 attendance-page-header">
        <div className="attendance-page-heading">
          <h1 className="text-3xl font-semibold text-[var(--text)]">
            Présences de l’équipe
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Consultez les pointages, repérez les écarts et préparez les corrections.
          </p>
        </div>

        <div className="flex items-center gap-3">

          <Link href={bp("/presences/pointage")} className="bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] px-5 py-3 rounded-xl font-semibold flex items-center gap-2 ">
            <Fingerprint size={20} /> Ma Pointeuse
          </Link>

          {(activeTab === 'monthly' || activeTab === 'corrections') && (<div className="bg-[var(--surface)] p-1.5 rounded-xl border border-[var(--border)] flex items-center">
            <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1))} className="p-2 hover:bg-[var(--surface-2)] rounded-lg" aria-label="Période précédente">
              <ChevronLeft size={18} />
            </button>
            <span className="w-32 text-center font-semibold text-sm capitalize text-[var(--text)]">
              {date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1))} className="p-2 hover:bg-[var(--surface-2)] rounded-lg" aria-label="Période suivante">
              <ChevronRight size={18} />
            </button>
          </div>)}
        </div>
      </div>

      <div className="attendance-view-switch" role="group" aria-label="Vue des présences">
        <button onClick={() => setActiveTab('daily')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors whitespace-nowrap ${activeTab === 'daily' ? 'bg-[var(--brand)] text-[var(--on-brand)] ' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}>
          <Activity size={20} /> Journalière
        </button>
        <button onClick={() => setActiveTab('weekly')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors whitespace-nowrap ${activeTab === 'weekly' ? 'bg-[var(--brand)] text-[var(--on-brand)] ' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}>
          <BarChart3 size={20} /> Hebdomadaire
        </button>
        <button onClick={() => setActiveTab('monthly')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors whitespace-nowrap ${activeTab === 'monthly' ? 'bg-[var(--brand)] text-[var(--on-brand)] ' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}>
          <CalendarIcon size={20} /> Mensuelle
        </button>
        <button onClick={() => setActiveTab('corrections')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors whitespace-nowrap ${activeTab === 'corrections' ? 'bg-[var(--brand)] text-[var(--on-brand)] ' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}>
          <Edit3 size={20} /> Corrections
        </button>
      </div>

      {isLoading ? (
        <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] flex justify-center items-center min-h-[600px]">
          <KonzaLoader variant="section" />
        </div>
      ) : (
        <>
          {activeTab === 'daily' && (
            <DailyView
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              userRole={userRole}
              userDepartment={userDepartment}
              canRecordAttendanceForAll={hasAttendanceAllPermission}
            />
          )}

          {activeTab === 'weekly' && (
            <WeeklyView
              userRole={userRole}
              userDepartment={userDepartment}
              date={date}
              canRecordAttendanceForAll={hasAttendanceAllPermission}
            />
          )}

          {activeTab === 'monthly' && data && (
            <MonthlyView
              data={data}
              date={date}
              setDate={setDate}
              userRole={userRole}
              userDepartment={userDepartment}
              canRecordAttendanceForAll={hasAttendanceAllPermission}
            />
          )}

          {activeTab === 'corrections' && data && (
            <CorrectionsView
              data={data}
              userRole={userRole}
              userDepartment={userDepartment}
              onRefresh={fetchCorrectionsData}
              canRecordAttendanceForAll={hasAttendanceAllPermission}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function AttendancePage() {
  return <AttendanceModuleFrame kind="list"><AttendancePageContent /></AttendanceModuleFrame>;
}
