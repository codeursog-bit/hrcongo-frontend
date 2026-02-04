'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Wallet, Calendar, Clock, UserPlus, BarChart, ArrowRight, 
  Loader2, CheckCircle, PlayCircle, Fingerprint, Bell, Radio, User
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { motion } from 'framer-motion';
import { StatCard } from './ui/StatCard';
import { GlobalLoader } from './ui/GlobalLoader';
import { api } from '@/services/api';
import { UserRole } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 50 } }
};

export const DashboardContent = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  const [showSalary, setShowSalary] = useState(false);

  const [stats, setStats] = useState<any>({});
  const [charts, setCharts] = useState<any>({ salaryTrend: [], deptDistribution: [] });
  
  const [myStats, setMyStats] = useState<any>({});

  useEffect(() => {
    const fetchDashboard = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const user = JSON.parse(storedUser);
      setUserRole(user.role);

      try {
        if (['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role)) {
          const [summary, chartsData] = await Promise.all([
            api.get<any>('/dashboard/summary'),
            api.get<any>('/dashboard/charts')
          ]);
          setStats(summary);
          setCharts(chartsData);
        } else {
          // ✅ CHARGEMENT EMPLOYÉ - ÉTAPE PAR ÉTAPE
          console.log('🔍 Chargement dashboard employé...');
          
          // Étape 1: Récupérer le profil employé
          const employeeProfile = await api.get<any>('/employees/me');
          console.log('👤 Profil employé:', employeeProfile);
          
          if (!employeeProfile?.id) {
            console.error('❌ Pas de profil employé trouvé');
            setLoading(false);
            return;
          }

          // Étape 2: Récupérer toutes les données en parallèle
          const [leaves, attendance, payrolls] = await Promise.all([
            api.get<any[]>('/leaves/me').catch(err => {
              console.error('❌ Erreur leaves:', err);
              return [];
            }),
            api.get<any[]>('/attendance/today').catch(err => {
              console.error('❌ Erreur attendance:', err);
              return [];
            }),
            api.get<any[]>(`/payrolls?employeeId=${employeeProfile.id}`).catch(err => {
              console.error('❌ Erreur payrolls:', err);
              return [];
            })
          ]);

          console.log('📋 Congés récupérés:', leaves);
          console.log('⏰ Présences du jour:', attendance);
          console.log('💰 Bulletins récupérés:', payrolls);
          
          // ✅ CALCUL CONGÉS POSÉS (EN ATTENTE)
          const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;
          console.log('📅 Congés en attente:', pendingLeaves);
          
          // ✅ CALCUL SOLDE CONGÉS
          let remainingLeaves = 0;
          try {
            const currentYear = new Date().getFullYear();
            const balance = await api.get<any>(`/leaves/balance/${employeeProfile.id}?year=${currentYear}`);
            remainingLeaves = balance.annualRemaining || 0;
            console.log('✅ Solde congés depuis API:', remainingLeaves);
          } catch (error) {
            console.log('⚠️ Calcul fallback du solde congés');
            const currentYear = new Date().getFullYear();
            const approvedLeaves = leaves.filter((l: any) => {
              const leaveStartDate = new Date(l.startDate);
              return l.status === 'APPROVED' && 
                     l.type === 'ANNUAL' &&
                     leaveStartDate.getFullYear() === currentYear;
            });
            
            const takenDays = approvedLeaves.reduce((acc, curr) => acc + (curr.daysCount || 0), 0);
            
            if (employeeProfile.hireDate) {
              const hireDate = new Date(employeeProfile.hireDate);
              const now = new Date();
              const daysSinceHire = Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));
              const monthsWorked = daysSinceHire / 30.44;
              const accruedDays = Math.min(30, Math.round(monthsWorked * 2.5 * 10) / 10);
              
              remainingLeaves = Math.max(0, accruedDays - takenDays);
              console.log('✅ Solde calculé:', remainingLeaves);
            }
          }

          // ✅ DERNIER SALAIRE
          let lastSalaryAmount = '0 F';
          let lastSalaryMonth = '-';
          
          if (payrolls && payrolls.length > 0) {
            // Trier par année puis mois décroissant
            const sortedPayrolls = [...payrolls].sort((a, b) => {
              if (b.year !== a.year) return b.year - a.year;
              return b.month - a.month;
            });
            
            const lastPayroll = sortedPayrolls[0];
            lastSalaryAmount = lastPayroll.netSalary.toLocaleString() + ' F';
            lastSalaryMonth = new Date(0, lastPayroll.month - 1).toLocaleString('fr-FR', {month:'long'});
            console.log('💰 Dernier salaire:', lastSalaryAmount, '-', lastSalaryMonth);
          } else {
            console.log('⚠️ Aucun bulletin trouvé');
          }

          // ✅ STATUT POINTAGE DU JOUR
          const todayStatus = attendance.find((a: any) => a.employeeId === employeeProfile.id);
          console.log('🕐 Statut pointage:', todayStatus);

          setMyStats({
            pendingLeaves,
            remainingLeaves: Number(remainingLeaves).toFixed(1),
            checkIn: todayStatus?.checkIn,
            checkOut: todayStatus?.checkOut,
            lastSalary: lastSalaryAmount,
            lastSalaryMonth: lastSalaryMonth
          });

          console.log('✅ Stats employé finales:', {
            pendingLeaves,
            remainingLeaves: remainingLeaves.toFixed(1),
            lastSalary: lastSalaryAmount,
            lastSalaryMonth
          });
        }
      } catch (error) {
        console.error("❌ Erreur chargement dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatCurrency = (val: number) => {
    if (!val) return '0';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val.toString();
  };

  if (loading) {
    return <GlobalLoader />;
  }

  // --- VUE EMPLOYÉ & MANAGER ---
  if (userRole === 'EMPLOYEE' || userRole === 'MANAGER') {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mon Espace {userRole === 'MANAGER' ? 'Manager' : ''}</h2>
          <p className="text-gray-500 dark:text-slate-400">Bienvenue, voici votre résumé personnel.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div variants={itemVariants}>
            <StatCard 
              label="Congés Posés" 
              value={myStats.pendingLeaves?.toString() || '0'} 
              trend="En attente" 
              isPositive={true} 
              icon={Calendar} 
              gradientFrom="from-orange-400" 
              gradientTo="to-red-500" 
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              label="Solde Congés" 
              value={`${myStats.remainingLeaves || '0'} j`} 
              trend="Disponibles" 
              isPositive={true} 
              icon={Clock} 
              gradientFrom="from-emerald-400" 
              gradientTo="to-teal-600" 
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              label="Dernier Salaire" 
              value={myStats.lastSalary || '0 F'} 
              trend={myStats.lastSalaryMonth || '-'} 
              isPositive={true} 
              icon={Wallet} 
              gradientFrom="from-blue-500" 
              gradientTo="to-indigo-600"
              isPrivate={true}
              showValue={showSalary}
              onToggleVisibility={() => setShowSalary(!showSalary)}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-6 border border-gray-200 dark:border-white/5 h-full flex flex-col justify-center items-center text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-xl" onClick={() => router.push('/presences/pointage')}>
              {myStats.checkIn && myStats.checkOut ? (
                <>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-sky-500/20 text-sky-500">
                    <Fingerprint size={24} />
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-bold">Journée terminée</h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Depuis {new Date(myStats.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </>
              ) : myStats.checkIn ? (
                <>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-emerald-500/20 text-emerald-500">
                    <Fingerprint size={24} />
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-bold">Pointé</h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Depuis {new Date(myStats.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-slate-200 dark:bg-slate-700/50 text-slate-400">
                    <Fingerprint size={24} />
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-bold">Non pointé</h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Pointer maintenant</p>
                </>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Mes Actions Rapides</h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => router.push('/conges/nouveau')} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 text-left transition-colors group">
                <Calendar className="text-sky-500 mb-3 group-hover:scale-110 transition-transform" size={24} />
                <p className="font-bold text-gray-900 dark:text-white text-sm">Demander congé</p>
              </button>
              <button onClick={() => router.push('/ma-paie')} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 text-left transition-colors group">
                <Wallet className="text-emerald-500 mb-3 group-hover:scale-110 transition-transform" size={24} />
                <p className="font-bold text-gray-900 dark:text-white text-sm">Mes bulletins</p>
              </button>
              <button onClick={() => router.push('/formation')} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 text-left transition-colors group">
                <PlayCircle className="text-purple-500 mb-3 group-hover:scale-110 transition-transform" size={24} />
                <p className="font-bold text-gray-900 dark:text-white text-sm">Formation</p>
              </button>
              <button onClick={() => router.push('/presences/pointage')} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 text-left transition-colors group">
                <Fingerprint className="text-orange-500 mb-3 group-hover:scale-110 transition-transform" size={24} />
                <p className="font-bold text-gray-900 dark:text-white text-sm">Pointer</p>
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // --- VUE ADMIN / RH ---
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants}>
          <StatCard 
            label="Total Employés" value={stats.totalEmployees?.toString() || '0'} trend="Actif" isPositive={true} 
            icon={Users} gradientFrom="from-cyan-500" gradientTo="to-blue-600" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard 
            label="Masse Salariale" value={formatCurrency(stats.masseSalariale)} trend="Mensuel" isPositive={true} 
            icon={Wallet} gradientFrom="from-emerald-400" gradientTo="to-teal-600" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard 
            label="Congés en attente" value={stats.pendingLeaves?.toString() || '0'} trend="À traiter" isPositive={stats.pendingLeaves === 0} 
            icon={Calendar} gradientFrom="from-orange-400" gradientTo="to-red-500" 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard 
            label="Taux Présence" value={`${stats.attendanceRate || 0}%`} trend={`${stats.absentToday || 0} absents`} isPositive={stats.attendanceRate > 90} 
            icon={Clock} gradientFrom="from-violet-500" gradientTo="to-purple-600" 
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Ajouter Employé', icon: UserPlus, color: 'bg-cyan-500', action: '/employes/nouveau' },
              { label: 'Créer Paie', icon: Wallet, color: 'bg-emerald-500', action: '/paie/nouveau' },
              { label: 'Gérer Congés', icon: Calendar, color: 'bg-orange-500', action: '/conges' },
              { label: 'Rapports', icon: BarChart, color: 'bg-violet-500', action: '/rapports' },
            ].map((item, i) => (
              <div 
                key={i} 
                onClick={() => router.push(item.action)}
                className="group cursor-pointer bg-white dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all hover:-translate-y-1 relative overflow-hidden shadow-sm"
              >
                <div className={`absolute top-0 right-0 w-20 h-20 opacity-10 rounded-bl-full ${item.color}`}></div>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${item.color} text-white shadow-lg`}>
                    <item.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{item.label}</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Action rapide</p>
                  </div>
                  <ArrowRight className="ml-auto text-gray-400 dark:text-slate-600 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" size={20} />
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Derniers Bulletins (3)</h3>
            <div className="space-y-4">
              {stats.recentPayrolls?.length > 0 ? (
                stats.recentPayrolls.map((payroll: any) => (
                  <div key={payroll.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 flex items-center justify-center border border-emerald-500/30 font-bold text-xs">
                      {payroll.employee.firstName[0]}{payroll.employee.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{payroll.employee.firstName} {payroll.employee.lastName}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Net: {payroll.netSalary.toLocaleString()} F</p>
                    </div>
                    <span className="text-xs font-mono text-cyan-600 dark:text-cyan-500">{new Date(payroll.createdAt).toLocaleDateString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-slate-500 italic">Aucun bulletin récent</p>
              )}
            </div>
            <button onClick={() => router.push('/paie')} className="w-full mt-4 py-2 text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-dashed border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5">
              Voir tout l'historique
            </button>
          </motion.div>
        </div>
             <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Répartition</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Effectifs par département</p>
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.deptDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {charts.deptDistribution.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">{stats.totalEmployees}</span>
              <span className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
        </motion.div>
      </div>


           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Évolution Salaires</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">5 derniers mois (FCFA)</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.salaryTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMasse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                    return value;
                  }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }} 
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => value.toLocaleString() + ' F'}
                />
                <Area 
                  type="monotone" 
                  dataKey="masseSalariale" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorMasse)" 
                  name="Masse Salariale" 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#06b6d4" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorSalary)" 
                  name="Salaire Net" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

       <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500 animate-pulse"><Radio size={18} /></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">En direct (36h)</h3>
          </div>
          
          <div className="flex-1 space-y-6 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
            {stats.recentActivities?.length > 0 ? (
              stats.recentActivities.map((act: any, i: number) => {
                let icon = <CheckCircle size={16} />;
                let color = "bg-gray-100 text-gray-500";
                
                if (act.type === 'LEAVE') { icon = <Calendar size={16} />; color = "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"; }
                if (act.type === 'HIRE') { icon = <User size={16} />; color = "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"; }
                if (act.type === 'ATTENDANCE') { icon = <Clock size={16} />; color = "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"; }

                return (
                  <div key={act.id} className="flex gap-4 relative">
                    {i !== stats.recentActivities.length - 1 && (
                      <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-gray-800"></div>
                    )}
                    
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                      {icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{act.text}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{act.subText}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-mono">{new Date(act.time).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Aucune activité récente (dernières 36h).</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
