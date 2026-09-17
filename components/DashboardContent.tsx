'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Wallet, Calendar, Clock, UserPlus, BarChart as BarChartIcon, ArrowRight,
  Loader2, CheckCircle, PlayCircle, Fingerprint, Bell, Radio, User,
  UserCheck, UserX, AlertTriangle, TrendingUp, Building2, ChevronRight,
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

export const DashboardContent = () => {
  const router = useRouter();
  const [loading, setLoading]           = useState(true);
  const [userRole, setUserRole]         = useState<UserRole | null>(null);
  const [userName, setUserName]         = useState<string>('');
  const [showSalary, setShowSalary]     = useState(false);
  const [stats, setStats]               = useState<any>({});
  const [charts, setCharts]             = useState<any>({ salaryTrend: [], deptDistribution: [] });
  const [myStats, setMyStats]           = useState<any>({});
  const [managerStats, setManagerStats] = useState<any>({});

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
            const [leaves, attendance, payrolls] = await Promise.all([
              api.get<any[]>('/leaves/me').catch(() => []),
              api.get<any[]>('/attendance/today').catch(() => []),
              api.get<any[]>(`/payrolls?employeeId=${employeeProfile.id}`).catch(() => [])
            ]);
            const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;
            const todayStatus   = attendance.find((a: any) => a.employeeId === employeeProfile.id);
            let lastSalaryAmount = '0 F', lastSalaryMonth = '-';
            if (payrolls?.length > 0) {
              const sorted = [...payrolls].sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
              lastSalaryAmount = sorted[0].netSalary.toLocaleString() + ' F';
              lastSalaryMonth  = new Date(0, sorted[0].month - 1).toLocaleString('fr-FR', { month: 'long' });
            }
            setMyStats({ pendingLeaves, checkIn: todayStatus?.checkIn, checkOut: todayStatus?.checkOut, lastSalary: lastSalaryAmount, lastSalaryMonth });
          }

        } else {
          const employeeProfile = await api.get<any>('/employees/me');
          if (!employeeProfile?.id) { setLoading(false); return; }

          const [leaves, attendance, payrolls] = await Promise.all([
            api.get<any[]>('/leaves/me').catch(() => []),
            api.get<any[]>('/attendance/today').catch(() => []),
            api.get<any[]>(`/payrolls?employeeId=${employeeProfile.id}`).catch(() => [])
          ]);
          const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;

          let remainingLeaves = 0;
          try {
            const balance = await api.get<any>(`/leaves/balance/${employeeProfile.id}?year=${new Date().getFullYear()}`);
            remainingLeaves = balance.annualRemaining || 0;
          } catch {
            const currentYear = new Date().getFullYear();
            const approvedLeaves = leaves.filter((l: any) => l.status === 'APPROVED' && l.type === 'ANNUAL' && new Date(l.startDate).getFullYear() === currentYear);
            const takenDays = approvedLeaves.reduce((acc: number, curr: any) => acc + (curr.daysCount || 0), 0);
            if (employeeProfile.hireDate) {
              const months = (Date.now() - new Date(employeeProfile.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
              remainingLeaves = Math.max(0, Math.round(Math.min(30, months * 2.5) * 10) / 10 - takenDays);
            }
          }

          let lastSalaryAmount = '0 F', lastSalaryMonth = '-';
          if (payrolls?.length > 0) {
            const sorted = [...payrolls].sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
            lastSalaryAmount = sorted[0].netSalary.toLocaleString() + ' F';
            lastSalaryMonth  = new Date(0, sorted[0].month - 1).toLocaleString('fr-FR', { month: 'long' });
          }
          const todayStatus = attendance.find((a: any) => a.employeeId === employeeProfile.id);
          setMyStats({ pendingLeaves, remainingLeaves: Number(remainingLeaves).toFixed(1), checkIn: todayStatus?.checkIn, checkOut: todayStatus?.checkOut, lastSalary: lastSalaryAmount, lastSalaryMonth });
        }
      } catch (error) {
        console.error('❌ Erreur chargement dashboard:', error);
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

  if (loading) return <GlobalLoader />;

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
              <div onClick={() => router.push('/conges/nouveau')} className="group cursor-pointer rounded-xl p-4 transition-all hover:-translate-y-0.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Congés en attente</p>
                <p className="text-2xl font-extrabold text-amber-500">{myStats.pendingLeaves || 0}</p>
                <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />Demander congé</p>
              </div>
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
  if (userRole === 'EMPLOYEE') {
    const remaining = parseFloat(myStats.remainingLeaves) || 0;
    const annualQuota = 30;
    const used = Math.max(0, annualQuota - remaining);

    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'var(--brand-soft)' }}><Sparkles size={20} className="text-emerald-500" /></div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Bonjour{greetingName} 👋</h2>
            <p style={{ color: 'var(--text-muted)' }}>Voici votre résumé personnel pour le mois de {monthLabel}.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <motion.div variants={itemVariants}><StatCard label="Congés Posés" value={myStats.pendingLeaves?.toString() || '0'} trend="En attente" isPositive={true} icon={Calendar} color="amber" /></motion.div>
          <motion.div variants={itemVariants}><StatCard label="Solde Congés" value={`${myStats.remainingLeaves || '0'} j`} trend="Disponibles" isPositive={true} icon={Clock} color="emerald" /></motion.div>
          <motion.div variants={itemVariants}><StatCard label="Dernier Salaire" value={myStats.lastSalary || '0 F'} trend={myStats.lastSalaryMonth || '-'} isPositive={true} icon={Wallet} color="emerald" isPrivate={true} showValue={showSalary} onToggleVisibility={() => setShowSalary(!showSalary)} /></motion.div>
          <motion.div variants={itemVariants}>
            <div
              className="rounded-2xl p-6 h-full flex flex-col justify-center items-center text-center cursor-pointer transition-colors hover:-translate-y-1"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              onClick={() => router.push('/presences/pointage')}
            >
              {myStats.checkIn && myStats.checkOut ? (
                <><div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-emerald-500/15 text-emerald-500"><Fingerprint size={24} /></div><h4 className="font-bold" style={{ color: 'var(--text)' }}>Journée terminée</h4><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Depuis {new Date(myStats.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></>
              ) : myStats.checkIn ? (
                <><div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-emerald-500/15 text-emerald-500"><Fingerprint size={24} /></div><h4 className="font-bold" style={{ color: 'var(--text)' }}>Pointé</h4><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Depuis {new Date(myStats.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></>
              ) : (
                <><div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}><Fingerprint size={24} /></div><h4 className="font-bold" style={{ color: 'var(--text)' }}>Non pointé</h4><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Pointer maintenant</p></>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 🆕 Enrichissement : visuel du solde de congés, à partir des données déjà chargées */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Panel>
              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Solde de congés</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Sur {annualQuota} jours annuels</p>
              <div className="h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ value: remaining }, { value: used }]} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                      <Cell fill="#10B981" />
                      <Cell fill="var(--surface-2)" fillOpacity={1} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{remaining}</span>
                  <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>jours restants</span>
                </div>
              </div>
            </Panel>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Panel>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>Mes Actions Rapides</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Demander congé', icon: Calendar,    color: 'text-emerald-500', path: '/conges/nouveau' },
                  { label: 'Mes bulletins',  icon: Wallet,      color: 'text-emerald-500', path: '/ma-paie' },
                  { label: 'Formation',      icon: PlayCircle,  color: 'text-amber-500',   path: '/formation' },
                  { label: 'Pointer',        icon: Fingerprint, color: 'text-amber-500',   path: '/presences/pointage' },
                ].map(item => (
                  <button key={item.label} onClick={() => router.push(item.path)} className="p-4 rounded-xl text-left transition-colors group" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <item.icon className={`${item.color} mb-3 group-hover:scale-110 transition-transform`} size={24} />
                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{item.label}</p>
                  </button>
                ))}
              </div>
            </Panel>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // 🔑 VUE ADMIN / HR
  // ══════════════════════════════════════════════════════════════
  const pendingTotal = stats.pendingRequestsTotal ?? ((stats.pendingLeaves||0)+(stats.pendingAbsences||0)+(stats.pendingPermissions||0));

  // 🆕 Indicateurs RH dérivés — calculés à partir des données déjà chargées
  //    (aucun nouvel appel API, donc rien à casser côté back)
  const avgSalary = stats.totalEmployees > 0 ? Math.round((stats.masseSalariale || 0) / stats.totalEmployees) : 0;
  const trend = charts.salaryTrend || [];
  const salaryVariation = trend.length >= 2
    ? Math.round((((trend[trend.length - 1]?.masseSalariale || 0) - (trend[trend.length - 2]?.masseSalariale || 0)) / (trend[trend.length - 2]?.masseSalariale || 1)) * 100)
    : 0;
  const deptCount = (charts.deptDistribution || []).length;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="p-2 rounded-xl" style={{ background: 'var(--brand-soft)' }}><LayoutGrid size={20} className="text-emerald-500" /></div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Bonjour{greetingName} 👋</h2>
          <p style={{ color: 'var(--text-muted)' }}>Voici la vue d'ensemble des opérations RH et paie pour le mois de {monthLabel}.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div variants={itemVariants}><StatCard label="Total Employés" value={stats.totalEmployees?.toString() || '0'} trend="Actif" isPositive={true} icon={Users} color="emerald" /></motion.div>
        <motion.div variants={itemVariants}><StatCard label="Masse Salariale" value={formatCurrency(stats.masseSalariale)} trend="Mensuel" isPositive={true} icon={Wallet} color="emerald" /></motion.div>
        <motion.div variants={itemVariants}><StatCard label="Demandes en attente" value={pendingTotal.toString()} trend="À traiter" isPositive={pendingTotal === 0} icon={Calendar} color="amber" /></motion.div>
        <motion.div variants={itemVariants}><StatCard label="Taux Présence" value={`${stats.attendanceRate || 0}%`} trend={`${stats.absentToday || 0} absents`} isPositive={stats.attendanceRate > 90} icon={Clock} color="emerald" /></motion.div>
      </div>

      {/* 🆕 Indicateurs RH complémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div variants={itemVariants}><StatCard label="Salaire Moyen" value={`${formatCurrency(avgSalary)} F`} trend="Par employé" isPositive={true} icon={Wallet} color="emerald" /></motion.div>
        <motion.div variants={itemVariants}><StatCard label="Variation Masse Salariale" value={`${salaryVariation > 0 ? '+' : ''}${salaryVariation}%`} trend="vs mois précédent" isPositive={salaryVariation >= 0} icon={TrendingUp} color={salaryVariation >= 0 ? 'emerald' : 'red'} /></motion.div>
        <motion.div variants={itemVariants}><StatCard label="Départements" value={deptCount.toString()} trend="Actifs" isPositive={true} icon={Building2} color="amber" /></motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Ajouter Employé', icon: UserPlus, color: 'emerald', action: '/employes/nouveau' },
              { label: 'Créer Paie',      icon: Wallet,   color: 'emerald', action: '/paie/nouveau' },
              { label: 'Gérer Congés',    icon: Calendar, color: 'amber',   action: '/conges' },
              { label: 'Rapports',        icon: BarChartIcon, color: 'amber',   action: '/rapports' },
            ].map((item, i) => (
              <div
                key={i}
                onClick={() => router.push(item.action)}
                className="group cursor-pointer rounded-2xl p-5 transition-all hover:-translate-y-1"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl text-white ${item.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                    <item.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--text)' }}>{item.label}</h4>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Action rapide</p>
                  </div>
                  <ArrowRight className="ml-auto transition-colors" style={{ color: 'var(--text-muted)' }} size={20} />
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants}>
            <Panel>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>Derniers Bulletins (3)</h3>
              <div className="space-y-3">
                {stats.recentPayrolls?.length > 0 ? stats.recentPayrolls.map((payroll: any) => (
                  <div key={payroll.id} className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-black/[0.02] dark:hover:bg-white/5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/25 font-bold text-xs">{payroll.employee.firstName[0]}{payroll.employee.lastName[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{payroll.employee.firstName} {payroll.employee.lastName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Net: {payroll.netSalary.toLocaleString()} F</p>
                    </div>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{new Date(payroll.createdAt).toLocaleDateString()}</span>
                  </div>
                )) : <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Aucun bulletin récent</p>}
              </div>
              <button onClick={() => router.push('/paie')} className="w-full mt-4 py-2 text-sm font-bold transition-colors rounded-xl border border-dashed hover:bg-black/[0.02] dark:hover:bg-white/5" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>Voir tout l'historique</button>
            </Panel>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Panel className="h-full">
            <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Répartition</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Effectifs par département</p>
            {(() => {
              const sorted = [...(charts.deptDistribution || [])].sort((a, b) => b.id - a.id);
              const top5   = sorted.slice(0, 5);
              const others = sorted.slice(5);
              const finalData = [...top5];
              if (others.length > 0) finalData.push({ name: 'Autres', value: others.reduce((acc: number, curr: any) => acc + curr.value, 0), color: '#64748b' });
              return (
                <div className="h-[250px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={finalData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {finalData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--text)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px', color: 'var(--text-muted)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-4xl font-bold" style={{ color: 'var(--text)' }}>{stats.totalEmployees}</span>
                    <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total</span>
                  </div>
                </div>
              );
            })()}
          </Panel>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Panel>
            <div className="mb-6">
              <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Évolution Salaires</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>5 derniers mois (FCFA)</p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.salaryTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--text)' }} formatter={(value: any) => value.toLocaleString() + ' F'} />
                  {/* Aires en couleur pleine — plus de dégradé */}
                  <Area type="monotone" dataKey="masseSalariale" stroke="#10B981" strokeWidth={2} fillOpacity={0.12} fill="#10B981" name="Masse Salariale" />
                  <Area type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={2} fillOpacity={0.12} fill="#F59E0B" name="Salaire Net" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Panel className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-red-500/10 rounded-lg text-red-500 animate-pulse"><Radio size={18} /></div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>En direct (36h)</h3>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto max-h-[400px] pr-2">
              {stats.recentActivities?.length > 0 ? stats.recentActivities.map((act: any, i: number) => {
                let icon  = <CheckCircle size={16} />;
                let color = 'bg-gray-100 text-gray-500';
                if (act.type === 'LEAVE')      { icon = <Calendar size={16} />; color = 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'; }
                if (act.type === 'ABSENCE')    { icon = <FileText size={16} />; color = 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'; }
                if (act.type === 'PERMISSION') { icon = <Ticket size={16} />;   color = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'; }
                if (act.type === 'HIRE')       { icon = <User size={16} />;     color = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'; }
                if (act.type === 'ATTENDANCE') { icon = <Clock size={16} />;    color = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'; }
                return (
                  <div key={act.id} className="flex gap-4 relative">
                    {i !== stats.recentActivities.length - 1 && <div className="absolute left-[15px] top-8 bottom-[-20px] w-0.5" style={{ background: 'var(--border)' }} />}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{act.text}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{act.subText}</p>
                      <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>{new Date(act.time).toLocaleString()}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
                  <Bell size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Aucune activité récente (dernières 36h).</p>
                </div>
              )}
            </div>
          </Panel>
        </motion.div>
      </div>

      {/* 🆕 Histogramme — même données que la courbe ci-dessus, vue complémentaire */}
      <motion.div variants={itemVariants}>
        <Panel>
          <div className="mb-6">
            <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Masse Salariale — vue en histogramme</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Comparaison mois par mois (FCFA)</p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.salaryTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--text)' }} formatter={(value: any) => value.toLocaleString() + ' F'} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar dataKey="masseSalariale" fill="#10B981" name="Masse Salariale" radius={[6, 6, 0, 0]} />
                <Bar dataKey="value" fill="#F59E0B" name="Salaire Net" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </motion.div>
    </motion.div>
  );
};