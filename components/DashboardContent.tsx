'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Wallet, Calendar, Clock, UserPlus, BarChart as BarChartIcon, ArrowRight,
  Loader2, CheckCircle, PlayCircle, Fingerprint, Bell, Radio, User,
  UserCheck, UserX, AlertTriangle, Building2, ChevronRight,
  Timer, Umbrella, Activity, Shield, FileText, Ticket, Sparkles, LayoutGrid
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { StatCard } from './ui/StatCard';
import { GlobalLoader } from './ui/GlobalLoader';
import { api } from '@/services/api';
import { UserRole } from '@/types';
import { computeFallbackLeaveBalance, computeDebtKpis, computeMonthlyPresenceRate } from '@/lib/personal-dashboard-stats';
import { MyDay, MyDaySkeleton } from '@/components/dashboard/MyDay';
import { usePersonalDay } from '@/hooks/usePersonalDay';
import { PilotageDashboard, PilotageSkeleton } from '@/components/dashboard/PilotageDashboard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 70, damping: 16 } }
};

// ─── Carte "surface" réutilisable — remplace les répétitions bg-white dark:bg-slate-900/60... ──
function Panel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {children}
    </div>
  );
}

const StatusDot = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    PRESENT:       'bg-emerald-500',
    LATE:          'bg-amber-400',
    REMOTE:        'bg-emerald-400',
    ABSENT_UNPAID: 'bg-red-500',
    LEAVE:         'bg-amber-400',
    ON_LEAVE:      'bg-amber-400',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status] || 'bg-gray-400'}`} />;
};

// 🆕 Solde de congés — secours si /leaves/balance échoue. Mêmes règles que
// partout ailleurs dans l'app (Code du travail congolais : 26 j/an, soit
// 26/12 j/mois) — PAS 30j/2.5j comme l'ancien calcul de secours.
export const DashboardContent = () => {
  const router = useRouter();
  const [loading, setLoading]           = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [userRole, setUserRole]         = useState<UserRole | null>(null);
  const [userName, setUserName]         = useState<string>('');
  const [showSalary, setShowSalary]     = useState(false);
  const [stats, setStats]               = useState<any>({});
  const [charts, setCharts]             = useState<any>({ salaryTrend: [], deptDistribution: [] });
  const [myStats, setMyStats]           = useState<any>({});
  // Stagiaires / prestataires sans l'option entreprise : pas de congés → cartes congés masquées.
  const [leaveEligible, setLeaveEligible] = useState(true);
  const [managerStats, setManagerStats] = useState<any>({});
  const [activeView, setActiveView] = useState<'pilotage' | 'day'>('pilotage');
  const [personalContext, setPersonalContext] = useState<any>({});
  const isAdmin = !!userRole && ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(userRole);
  const adminDay = usePersonalDay(isAdmin && activeView === 'day');

  useEffect(() => {
    if (!localStorage.getItem('user')) return;
    api.get<{ eligible?: boolean }>('/leaves/me/eligibility')
      .then((r) => setLeaveEligible(r?.eligible !== false))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      setUserRole(user.role);
      setUserName(user.firstName || user.name?.split(' ')[0] || '');

      try {
        if (['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role)) {
          const [summary, chartsData] = await Promise.all([
            api.get<any>('/dashboard/summary'),
            api.get<any>('/dashboard/charts')
          ]);
          setStats(summary);
          setCharts(chartsData);

        } else if (user.role === 'MANAGER') {
          const [managerData, employeeProfile] = await Promise.all([
            api.get<any>('/dashboard/manager'),
            api.get<any>('/employees/me').catch(() => null)
          ]);
          setManagerStats(managerData);

          if (employeeProfile?.id) {
            const now = new Date();
            const [leaves, attendance, payrolls, loans, advancesList, dayStatuses] = await Promise.all([
              api.get<any[]>('/leaves/me').catch(() => []),
              api.get<any[]>('/attendance/today').catch(() => []),
              api.get<any[]>(`/payrolls?employeeId=${employeeProfile.id}`).catch(() => []),
              api.get<any[]>('/loans/me').catch(() => []),
              api.get<any[]>('/loans/advances/me').catch(() => []),
              api.get<any[]>(`/attendance/employee/${employeeProfile.id}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).catch(() => []),
            ]);
            const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;
            const todayStatus   = attendance.find((a: any) => a.employeeId === employeeProfile.id);
            let lastSalaryAmount = '0 F', lastSalaryMonth = '-';
            if (payrolls?.length > 0) {
              const sorted = [...payrolls].sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
              lastSalaryAmount = sorted[0].netSalary.toLocaleString() + ' F';
              lastSalaryMonth  = new Date(0, sorted[0].month - 1).toLocaleString('fr-FR', { month: 'long' });
            }

            let remainingLeaves = 0;
            try {
              const balance = await api.get<any>(`/leaves/balance/${employeeProfile.id}?year=${now.getFullYear()}`);
              remainingLeaves = balance.annualRemaining || 0;
            } catch {
              const approvedLeaves = leaves.filter((l: any) => l.status === 'APPROVED' && l.type === 'ANNUAL' && new Date(l.startDate).getFullYear() === now.getFullYear());
              remainingLeaves = computeFallbackLeaveBalance(employeeProfile, approvedLeaves);
            }

            // 🆕 Même source que « Mon espace » → un seul chiffre partout dans l'app
            const leaveEx = await api.get<any>('/leaves/me/balance-explained').catch(() => null);
            if (leaveEx?.totals) remainingLeaves = leaveEx.totals.remaining;

            const debtKpis = computeDebtKpis(loans, advancesList);
            const presenceRateMonth = computeMonthlyPresenceRate(dayStatuses);

            setMyStats({
              pendingLeaves,
              leaveEx,
              remainingLeaves: Number(remainingLeaves).toFixed(1),
              checkIn: todayStatus?.checkIn,
              checkOut: todayStatus?.checkOut,
              lastSalary: lastSalaryAmount,
              lastSalaryMonth,
              totalDebt: debtKpis.totalRemaining,
              totalPaid: debtKpis.totalPaid,
              presenceRateMonth,
            });
          }

        } else {
          const employeeProfile = await api.get<any>('/employees/me');
          if (!employeeProfile?.id) { setLoading(false); return; }

          const now = new Date();
          const [leaves, attendance, payrolls, loans, advancesList, dayStatuses] = await Promise.all([
            api.get<any[]>('/leaves/me').catch(() => []),
            api.get<any[]>('/attendance/today').catch(() => []),
            api.get<any[]>(`/payrolls?employeeId=${employeeProfile.id}`).catch(() => []),
            api.get<any[]>('/loans/me').catch(() => []),
            api.get<any[]>('/loans/advances/me').catch(() => []),
            api.get<any[]>(`/attendance/employee/${employeeProfile.id}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).catch(() => []),
          ]);
          const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;

          let remainingLeaves = 0;
          try {
            const balance = await api.get<any>(`/leaves/balance/${employeeProfile.id}?year=${now.getFullYear()}`);
            remainingLeaves = balance.annualRemaining || 0;
          } catch {
            const approvedLeaves = leaves.filter((l: any) => l.status === 'APPROVED' && l.type === 'ANNUAL' && new Date(l.startDate).getFullYear() === now.getFullYear());
            remainingLeaves = computeFallbackLeaveBalance(employeeProfile, approvedLeaves);
          }

          let lastSalaryAmount = '0 F', lastSalaryMonth = '-';
          if (payrolls?.length > 0) {
            const sorted = [...payrolls].sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
            lastSalaryAmount = sorted[0].netSalary.toLocaleString() + ' F';
            lastSalaryMonth  = new Date(0, sorted[0].month - 1).toLocaleString('fr-FR', { month: 'long' });
          }
          const todayStatus = attendance.find((a: any) => a.employeeId === employeeProfile.id);
          setPersonalContext({ employee: employeeProfile, leaves, attendance: todayStatus, dayStatuses });
          // 🆕 Même source que « Mon espace » → un seul chiffre partout dans l'app
            const leaveEx = await api.get<any>('/leaves/me/balance-explained').catch(() => null);
            if (leaveEx?.totals) remainingLeaves = leaveEx.totals.remaining;

            const debtKpis = computeDebtKpis(loans, advancesList);
          const presenceRateMonth = computeMonthlyPresenceRate(dayStatuses);

          setMyStats({
            pendingLeaves,
            leaveEx,
            remainingLeaves: Number(remainingLeaves).toFixed(1),
            checkIn: todayStatus?.checkIn,
            checkOut: todayStatus?.checkOut,
            lastSalary: lastSalaryAmount,
            lastSalaryMonth,
            totalDebt: debtKpis.totalRemaining,
            totalPaid: debtKpis.totalPaid,
            presenceRateMonth,
          });
        }
      } catch (error) {
        console.error('❌ Erreur chargement dashboard:', error);
        setDashboardError('Le chargement du pilotage RH a échoué.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // ══════════════════════════════════════════════════════════════
  // 🆕 SYNC TEMPS RÉEL — écoute l'event émis par EmployeeListPage
  //    et met à jour le compteur du dashboard sans rechargement
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const handleEmployeeDeleted = (e: Event) => {
      const event = e as CustomEvent<{ employeeId: string; departmentId?: string }>;
      setStats((prev: any) => ({
        ...prev,
        totalEmployees: Math.max(0, (prev.totalEmployees || 0) - 1),
      }));
      if (event.detail?.departmentId) {
        setManagerStats((prev: any) => {
          if (!prev || !prev.teamSize) return prev;
          return {
            ...prev,
            teamSize:     Math.max(0, (prev.teamSize || 0) - 1),
            presentCount: Math.max(0, (prev.presentCount || 0)),
            absentCount:  Math.max(0, (prev.absentCount || 0)),
          };
        });
      }
    };
    window.addEventListener('employee:deleted', handleEmployeeDeleted);
    return () => window.removeEventListener('employee:deleted', handleEmployeeDeleted);
  }, []);

  useEffect(() => {
    const handleEmployeeCreated = () => {
      setStats((prev: any) => ({ ...prev, totalEmployees: (prev.totalEmployees || 0) + 1 }));
      setManagerStats((prev: any) => {
        if (!prev || prev.teamSize === undefined) return prev;
        return { ...prev, teamSize: (prev.teamSize || 0) + 1 };
      });
    };
    window.addEventListener('employee:created', handleEmployeeCreated);
    return () => window.removeEventListener('employee:created', handleEmployeeCreated);
  }, []);

  const formatCurrency = (val: number) => {
    if (!val) return '0';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000)    return (val / 1000).toFixed(1) + 'k';
    return val.toString();
  };

  const monthLabel = (() => {
    const raw = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  })();
  const greetingName = userName ? `, ${userName}` : '';

  if (loading) return userRole && ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(userRole) ? <PilotageSkeleton /> : userRole === 'EMPLOYEE' ? <MyDaySkeleton /> : <GlobalLoader />;

  const tooltipStyle = {
    backgroundColor: 'var(--surface)',
    borderColor: 'var(--border)',
    color: 'var(--text)',
    borderRadius: 12,
    border: '1px solid var(--border)',
  };

  // ══════════════════════════════════════════════════════════════
  // 👔 VUE MANAGER
  // ══════════════════════════════════════════════════════════════
  if (userRole === 'MANAGER') {
    const m = managerStats;
    const presenceRate = m.presenceRate || 0;
    const rateColor =
      presenceRate >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
      presenceRate >= 70 ? 'text-amber-500' : 'text-red-500';

    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl" style={{ background: 'var(--brand-soft)' }}>
                <Shield size={20} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Bonjour{greetingName} 👋</h2>
            </div>
            <p className="ml-11" style={{ color: 'var(--text-muted)' }}>
              Voici la vue d'ensemble de votre équipe pour le mois de {monthLabel}.
            </p>
            <p className="ml-11 mt-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Building2 size={14} className="text-emerald-500" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{m.departmentName || 'Mon Département'}</span>
              <span>·</span>
              <span>{m.teamSize || 0} membre{(m.teamSize || 0) > 1 ? 's' : ''}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/presences')} className="px-4 py-2 bg-[#FAFAFA] hover:bg-white text-black font-bold rounded-xl transition-all flex items-center gap-2 text-sm">
              <Activity size={16} /> Présences équipe
            </button>
            <button
              onClick={() => router.push('/conges')}
              className="px-4 py-2 font-bold rounded-xl transition-all flex items-center gap-2 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <Calendar size={16} /> Congés
              {m.pendingLeaves > 0 && <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{m.pendingLeaves}</span>}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <motion.div variants={itemVariants}><StatCard label="Membres Équipe" value={(m.teamSize || 0).toString()} trend={m.departmentName || 'Département'} isPositive={true} icon={Users} color="emerald" /></motion.div>
          <motion.div variants={itemVariants}><StatCard label="Présents" value={(m.presentCount || 0).toString()} trend={`${presenceRate}% de l'équipe`} isPositive={presenceRate >= 70} icon={UserCheck} color="emerald" /></motion.div>
          <motion.div variants={itemVariants}><StatCard label="Absents" value={(m.absentCount || 0).toString()} trend={m.lateCount > 0 ? `dont ${m.lateCount} retard${m.lateCount > 1 ? 's' : ''}` : "Aujourd'hui"} isPositive={m.absentCount === 0} icon={UserX} color="red" /></motion.div>
          <motion.div variants={itemVariants}><StatCard label="Congés en cours" value={(m.onLeaveCount || 0).toString()} trend={`${m.pendingLeaves || 0} en attente`} isPositive={m.pendingLeaves === 0} icon={Umbrella} color="amber" /></motion.div>
        </div>

        <Panel>
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Présence aujourd'hui</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{m.teamSize || 0} membres dans l'équipe</p>
              </div>
              <span className={`text-4xl font-extrabold ${rateColor}`}>{presenceRate}%</span>
            </div>
            {(() => {
              const total = m.teamSize || 1;
              const pPct  = ((m.presentCount || 0) / total) * 100;
              const lPct  = ((m.lateCount    || 0) / total) * 100;
              const aPct  = ((m.absentCount  || 0) / total) * 100;
              return (
                <>
                  <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--surface-2)' }}>
                    <div className="bg-emerald-500 transition-all duration-700 rounded-l-full" style={{ width: `${pPct}%` }} />
                    <div className="bg-amber-400 transition-all duration-700" style={{ width: `${lPct}%` }} />
                    <div className="bg-red-400 transition-all duration-700 rounded-r-full" style={{ width: `${aPct}%` }} />
                  </div>
                  <div className="flex gap-6 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Présent ({m.presentCount || 0})</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />Retard ({m.lateCount || 0})</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" />Absent ({m.absentCount || 0})</span>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </Panel>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div variants={itemVariants} className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}><UserX size={18} className="text-red-400" /> Absents du jour</h3>
              <span className="text-xs bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full font-bold border border-red-500/20">{(m.absentMembers || []).length}</span>
            </div>
            <div className="divide-y max-h-72 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
              {(m.absentMembers || []).length === 0 ? (
                <div className="p-8 text-center"><CheckCircle size={32} className="mx-auto text-emerald-400 mb-2" /><p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Tout le monde est là !</p></div>
              ) : m.absentMembers.map((emp: any) => (
                <div key={emp.id} className="flex items-center gap-3 p-4 hover:bg-black/[0.02] dark:hover:bg-white/5 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-bold text-sm shrink-0">{emp.firstName[0]}{emp.lastName[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{emp.position}</p>
                  </div>
                  <StatusDot status={emp.status} />
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}><Users size={18} className="text-emerald-500" /> Mon équipe</h3>
              <button onClick={() => router.push('/employes')} className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:opacity-80 flex items-center gap-1 transition-opacity">Voir tout <ChevronRight size={14} /></button>
            </div>
            <div className="divide-y max-h-72 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
              {(m.teamMembers || []).slice(0, 8).map((emp: any) => (
                <div key={emp.id} className="flex items-center gap-3 p-4 hover:bg-black/[0.02] dark:hover:bg-white/5 transition-colors">
                  <img src={emp.photoUrl || `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random`} className="w-9 h-9 rounded-full object-cover shrink-0 border" style={{ borderColor: 'var(--border)' }} alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{emp.position}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono border" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>{emp.contractType}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="font-bold flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}><Calendar size={16} className="text-amber-500" /> Congés récents</h3>
                {m.pendingLeaves > 0 && <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold border border-amber-500/20">{m.pendingLeaves} en attente</span>}
              </div>
              <div className="divide-y max-h-40 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
                {(m.recentLeaveRequests || []).length === 0
                  ? <p className="p-4 text-xs text-center italic" style={{ color: 'var(--text-muted)' }}>Aucune demande récente</p>
                  : m.recentLeaveRequests.map((l: any) => (
                    <div key={l.id} className="flex items-center gap-3 p-3 hover:bg-black/[0.02] dark:hover:bg-white/5 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{l.employee.firstName} {l.employee.lastName}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{l.type} · {l.daysCount}j</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${l.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : l.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {l.status === 'PENDING' ? 'Attente' : l.status === 'APPROVED' ? 'OK' : 'Refusé'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="font-bold flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}><Timer size={16} className="text-emerald-500" /> Derniers pointages</h3>
              </div>
              <div className="divide-y max-h-40 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
                {(m.recentActivity || []).length === 0
                  ? <p className="p-4 text-xs text-center italic" style={{ color: 'var(--text-muted)' }}>Aucune activité</p>
                  : m.recentActivity.slice(0, 5).map((act: any) => (
                    <div key={act.id} className="flex items-center gap-3 p-3 hover:bg-black/[0.02] dark:hover:bg-white/5 transition-colors">
                      <StatusDot status={act.checkOut ? 'REMOTE' : 'PRESENT'} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{act.text}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{act.subText}</p>
                      </div>
                      <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                        {act.time ? new Date(act.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        </div>

        <Panel>
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-xl" style={{ background: 'var(--brand-soft)' }}><User size={16} className="text-emerald-500" /></div>
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text)' }}>Mon espace personnel</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {leaveEligible && (
              <div onClick={() => router.push('/conges/nouveau')} className="group cursor-pointer rounded-xl p-4 transition-all hover:-translate-y-0.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Congés en attente</p>
                <p className="text-2xl font-extrabold text-amber-500">{myStats.pendingLeaves || 0}</p>
                <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />Demander congé</p>
              </div>
              )}
              <div onClick={() => setShowSalary(!showSalary)} className="cursor-pointer rounded-xl p-4 transition-all hover:-translate-y-0.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Dernier salaire</p>
                {showSalary
                  ? <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 truncate">{myStats.lastSalary || '—'}</p>
                  : <p className="text-xl font-extrabold tracking-widest" style={{ color: 'var(--text-muted)' }}>••••••</p>
                }
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{myStats.lastSalaryMonth || '—'}</p>
              </div>
              <div onClick={() => router.push('/presences/pointage')} className="cursor-pointer rounded-xl p-4 transition-all hover:-translate-y-0.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Mon pointage</p>
                {myStats.checkIn ? (
                  <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">Pointé</p>
                ) : (
                  <p className="text-lg font-extrabold" style={{ color: 'var(--text-muted)' }}>—</p>
                )}
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{myStats.checkIn ? new Date(myStats.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pointer'}</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Solde congés</p>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{myStats.remainingLeaves || '0'} j</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Reste à rembourser</p>
                <p className="text-xl font-extrabold text-amber-500">{formatCurrency(myStats.totalDebt || 0)} F</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Déjà remboursé : {formatCurrency(myStats.totalPaid || 0)} F</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Ma présence (mois)</p>
                <p className={`text-2xl font-extrabold ${(myStats.presenceRateMonth || 0) >= 90 ? 'text-emerald-600 dark:text-emerald-400' : (myStats.presenceRateMonth || 0) >= 70 ? 'text-amber-500' : 'text-red-500'}`}>{myStats.presenceRateMonth || 0}%</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{monthLabel}</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Actions rapides</p>
                <div className="flex flex-col gap-2">
                  <button onClick={() => router.push('/conges/nouveau')} className="w-full text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1.5 rounded-lg font-bold transition-colors border border-emerald-500/20 text-left flex items-center gap-1.5"><Calendar size={12} /> + Congé</button>
                  <button onClick={() => router.push('/presences/pointage-manuel')} className="w-full text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-1.5 rounded-lg font-bold transition-colors border border-amber-500/20 text-left flex items-center gap-1.5"><Fingerprint size={12} /> Pointer équipe</button>
                </div>
              </div>
            </div>
          </motion.div>
        </Panel>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // 👤 VUE EMPLOYEE — enrichie (donut solde congés en plus)
  // ══════════════════════════════════════════════════════════════
  if (userRole === 'EMPLOYEE') return <MyDay viewerRole={userRole || ''} userName={userName} stats={myStats} context={personalContext} leaveEligible={leaveEligible} error={dashboardError} />;

  const pendingTotal = stats.pendingRequestsTotal ?? ((stats.pendingLeaves||0)+(stats.pendingAbsences||0)+(stats.pendingPermissions||0));

  // 🆕 Indicateurs RH complémentaires — fournis directement par /dashboard/summary
  const leavesThisMonth = stats.leavesThisMonth || 0;
  const totalPretAvanceMois = stats.totalPretAvanceMois || 0;
  const deptCount = (charts.deptDistribution || []).length;

  return <>
    <div className="myday-view-switch" role="group" aria-label="Vue du tableau de bord">
      <button type="button" aria-pressed={activeView === 'pilotage'} onClick={() => setActiveView('pilotage')}>Pilotage RH</button>
      <button type="button" aria-pressed={activeView === 'day'} onClick={() => setActiveView('day')}>Ma journée</button>
    </div>
    {activeView === 'day' ? (adminDay.loading ? <MyDaySkeleton /> : <MyDay viewerRole={userRole || ''} userName={userName} stats={adminDay.stats} context={adminDay.context} leaveEligible={leaveEligible} error={adminDay.error} />) : <PilotageDashboard userName={userName} monthLabel={monthLabel} stats={stats} charts={charts} pendingTotal={pendingTotal} leavesThisMonth={leavesThisMonth} totalPretAvanceMois={totalPretAvanceMois} deptCount={deptCount} error={dashboardError} />}
  </>;
};