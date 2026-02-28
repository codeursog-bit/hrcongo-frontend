// // 'use client';

// // import React, { useEffect, useState } from 'react';
// // import { useRouter } from 'next/navigation';
// // import { 
// //   Users, Wallet, Calendar, Clock, UserPlus, BarChart, ArrowRight, 
// //   Loader2, CheckCircle, PlayCircle, Fingerprint, Bell, Radio, User
// // } from 'lucide-react';
// // import { 
// //   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
// //   PieChart, Pie, Cell, Legend 
// // } from 'recharts';
// // import { motion } from 'framer-motion';
// // import { StatCard } from './ui/StatCard';
// // import { GlobalLoader } from './ui/GlobalLoader';
// // import { api } from '@/services/api';
// // import { UserRole } from '@/types';

// // const containerVariants = {
// //   hidden: { opacity: 0 },
// //   visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
// // };

// // const itemVariants = {
// //   hidden: { y: 20, opacity: 0 },
// //   visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 50 } }
// // };

// // export const DashboardContent = () => {
// //   const router = useRouter();
// //   const [loading, setLoading] = useState(true);
// //   const [userRole, setUserRole] = useState<UserRole | null>(null);
  
// //   const [showSalary, setShowSalary] = useState(false);

// //   const [stats, setStats] = useState<any>({});
// //   const [charts, setCharts] = useState<any>({ salaryTrend: [], deptDistribution: [] });
  
// //   const [myStats, setMyStats] = useState<any>({});

// //   useEffect(() => {
// //     const fetchDashboard = async () => {
// //       const storedUser = localStorage.getItem('user');
// //       if (!storedUser) return;
      
// //       const user = JSON.parse(storedUser);
// //       setUserRole(user.role);

// //       try {
// //         if (['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role)) {
// //           const [summary, chartsData] = await Promise.all([
// //             api.get<any>('/dashboard/summary'),
// //             api.get<any>('/dashboard/charts')
// //           ]);
// //           setStats(summary);
// //           setCharts(chartsData);
// //         } else {
// //           // ✅ CHARGEMENT EMPLOYÉ - ÉTAPE PAR ÉTAPE
// //           console.log('🔍 Chargement dashboard employé...');
          
// //           // Étape 1: Récupérer le profil employé
// //           const employeeProfile = await api.get<any>('/employees/me');
// //           console.log('👤 Profil employé:', employeeProfile);
          
// //           if (!employeeProfile?.id) {
// //             console.error('❌ Pas de profil employé trouvé');
// //             setLoading(false);
// //             return;
// //           }

// //           // Étape 2: Récupérer toutes les données en parallèle
// //           const [leaves, attendance, payrolls] = await Promise.all([
// //             api.get<any[]>('/leaves/me').catch(err => {
// //               console.error('❌ Erreur leaves:', err);
// //               return [];
// //             }),
// //             api.get<any[]>('/attendance/today').catch(err => {
// //               console.error('❌ Erreur attendance:', err);
// //               return [];
// //             }),
// //             api.get<any[]>(`/payrolls?employeeId=${employeeProfile.id}`).catch(err => {
// //               console.error('❌ Erreur payrolls:', err);
// //               return [];
// //             })
// //           ]);

// //           console.log('📋 Congés récupérés:', leaves);
// //           console.log('⏰ Présences du jour:', attendance);
// //           console.log('💰 Bulletins récupérés:', payrolls);
          
// //           // ✅ CALCUL CONGÉS POSÉS (EN ATTENTE)
// //           const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;
// //           console.log('📅 Congés en attente:', pendingLeaves);
          
// //           // ✅ CALCUL SOLDE CONGÉS
// //           let remainingLeaves = 0;
// //           try {
// //             const currentYear = new Date().getFullYear();
// //             const balance = await api.get<any>(`/leaves/balance/${employeeProfile.id}?year=${currentYear}`);
// //             remainingLeaves = balance.annualRemaining || 0;
// //             console.log('✅ Solde congés depuis API:', remainingLeaves);
// //           } catch (error) {
// //             console.log('⚠️ Calcul fallback du solde congés');
// //             const currentYear = new Date().getFullYear();
// //             const approvedLeaves = leaves.filter((l: any) => {
// //               const leaveStartDate = new Date(l.startDate);
// //               return l.status === 'APPROVED' && 
// //                      l.type === 'ANNUAL' &&
// //                      leaveStartDate.getFullYear() === currentYear;
// //             });
            
// //             const takenDays = approvedLeaves.reduce((acc, curr) => acc + (curr.daysCount || 0), 0);
            
// //             if (employeeProfile.hireDate) {
// //               const hireDate = new Date(employeeProfile.hireDate);
// //               const now = new Date();
// //               const daysSinceHire = Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));
// //               const monthsWorked = daysSinceHire / 30.44;
// //               const accruedDays = Math.min(30, Math.round(monthsWorked * 2.5 * 10) / 10);
              
// //               remainingLeaves = Math.max(0, accruedDays - takenDays);
// //               console.log('✅ Solde calculé:', remainingLeaves);
// //             }
// //           }

// //           // ✅ DERNIER SALAIRE
// //           let lastSalaryAmount = '0 F';
// //           let lastSalaryMonth = '-';
          
// //           if (payrolls && payrolls.length > 0) {
// //             // Trier par année puis mois décroissant
// //             const sortedPayrolls = [...payrolls].sort((a, b) => {
// //               if (b.year !== a.year) return b.year - a.year;
// //               return b.month - a.month;
// //             });
            
// //             const lastPayroll = sortedPayrolls[0];
// //             lastSalaryAmount = lastPayroll.netSalary.toLocaleString() + ' F';
// //             lastSalaryMonth = new Date(0, lastPayroll.month - 1).toLocaleString('fr-FR', {month:'long'});
// //             console.log('💰 Dernier salaire:', lastSalaryAmount, '-', lastSalaryMonth);
// //           } else {
// //             console.log('⚠️ Aucun bulletin trouvé');
// //           }

// //           // ✅ STATUT POINTAGE DU JOUR
// //           const todayStatus = attendance.find((a: any) => a.employeeId === employeeProfile.id);
// //           console.log('🕐 Statut pointage:', todayStatus);

// //           setMyStats({
// //             pendingLeaves,
// //             remainingLeaves: Number(remainingLeaves).toFixed(1),
// //             checkIn: todayStatus?.checkIn,
// //             checkOut: todayStatus?.checkOut,
// //             lastSalary: lastSalaryAmount,
// //             lastSalaryMonth: lastSalaryMonth
// //           });

// //           console.log('✅ Stats employé finales:', {
// //             pendingLeaves,
// //             remainingLeaves: remainingLeaves.toFixed(1),
// //             lastSalary: lastSalaryAmount,
// //             lastSalaryMonth
// //           });
// //         }
// //       } catch (error) {
// //         console.error("❌ Erreur chargement dashboard:", error);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchDashboard();
// //   }, []);

// //   const formatCurrency = (val: number) => {
// //     if (!val) return '0';
// //     if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
// //     if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
// //     return val.toString();
// //   };

// //   if (loading) {
// //     return <GlobalLoader />;
// //   }

// //   // --- VUE EMPLOYÉ & MANAGER ---
// //   if (userRole === 'EMPLOYEE' || userRole === 'MANAGER') {
// //     return (
// //       <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
// //         <div className="mb-6">
// //           <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mon Espace {userRole === 'MANAGER' ? 'Manager' : ''}</h2>
// //           <p className="text-gray-500 dark:text-slate-400">Bienvenue, voici votre résumé personnel.</p>
// //         </div>

// //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
// //           <motion.div variants={itemVariants}>
// //             <StatCard 
// //               label="Congés Posés" 
// //               value={myStats.pendingLeaves?.toString() || '0'} 
// //               trend="En attente" 
// //               isPositive={true} 
// //               icon={Calendar} 
// //               gradientFrom="from-orange-400" 
// //               gradientTo="to-red-500" 
// //             />
// //           </motion.div>
// //           <motion.div variants={itemVariants}>
// //             <StatCard 
// //               label="Solde Congés" 
// //               value={`${myStats.remainingLeaves || '0'} j`} 
// //               trend="Disponibles" 
// //               isPositive={true} 
// //               icon={Clock} 
// //               gradientFrom="from-emerald-400" 
// //               gradientTo="to-teal-600" 
// //             />
// //           </motion.div>
// //           <motion.div variants={itemVariants}>
// //             <StatCard 
// //               label="Dernier Salaire" 
// //               value={myStats.lastSalary || '0 F'} 
// //               trend={myStats.lastSalaryMonth || '-'} 
// //               isPositive={true} 
// //               icon={Wallet} 
// //               gradientFrom="from-blue-500" 
// //               gradientTo="to-indigo-600"
// //               isPrivate={true}
// //               showValue={showSalary}
// //               onToggleVisibility={() => setShowSalary(!showSalary)}
// //             />
// //           </motion.div>
// //           <motion.div variants={itemVariants}>
// //             <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-6 border border-gray-200 dark:border-white/5 h-full flex flex-col justify-center items-center text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-xl" onClick={() => router.push('/presences/pointage')}>
// //               {myStats.checkIn && myStats.checkOut ? (
// //                 <>
// //                   <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-sky-500/20 text-sky-500">
// //                     <Fingerprint size={24} />
// //                   </div>
// //                   <h4 className="text-gray-900 dark:text-white font-bold">Journée terminée</h4>
// //                   <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Depuis {new Date(myStats.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
// //                 </>
// //               ) : myStats.checkIn ? (
// //                 <>
// //                   <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-emerald-500/20 text-emerald-500">
// //                     <Fingerprint size={24} />
// //                   </div>
// //                   <h4 className="text-gray-900 dark:text-white font-bold">Pointé</h4>
// //                   <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Depuis {new Date(myStats.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
// //                 </>
// //               ) : (
// //                 <>
// //                   <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-slate-200 dark:bg-slate-700/50 text-slate-400">
// //                     <Fingerprint size={24} />
// //                   </div>
// //                   <h4 className="text-gray-900 dark:text-white font-bold">Non pointé</h4>
// //                   <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Pointer maintenant</p>
// //                 </>
// //               )}
// //             </div>
// //           </motion.div>
// //         </div>

// //         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
// //           <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-lg">
// //             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Mes Actions Rapides</h3>
// //             <div className="grid grid-cols-2 gap-4">
// //               <button onClick={() => router.push('/conges/nouveau')} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 text-left transition-colors group">
// //                 <Calendar className="text-sky-500 mb-3 group-hover:scale-110 transition-transform" size={24} />
// //                 <p className="font-bold text-gray-900 dark:text-white text-sm">Demander congé</p>
// //               </button>
// //               <button onClick={() => router.push('/ma-paie')} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 text-left transition-colors group">
// //                 <Wallet className="text-emerald-500 mb-3 group-hover:scale-110 transition-transform" size={24} />
// //                 <p className="font-bold text-gray-900 dark:text-white text-sm">Mes bulletins</p>
// //               </button>
// //               <button onClick={() => router.push('/formation')} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 text-left transition-colors group">
// //                 <PlayCircle className="text-purple-500 mb-3 group-hover:scale-110 transition-transform" size={24} />
// //                 <p className="font-bold text-gray-900 dark:text-white text-sm">Formation</p>
// //               </button>
// //               <button onClick={() => router.push('/presences/pointage')} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 text-left transition-colors group">
// //                 <Fingerprint className="text-orange-500 mb-3 group-hover:scale-110 transition-transform" size={24} />
// //                 <p className="font-bold text-gray-900 dark:text-white text-sm">Pointer</p>
// //               </button>
// //             </div>
// //           </motion.div>
// //         </div>
// //       </motion.div>
// //     );
// //   }

// //   // --- VUE ADMIN / RH ---
// //   return (
// //     <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      
// //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
// //         <motion.div variants={itemVariants}>
// //           <StatCard 
// //             label="Total Employés" value={stats.totalEmployees?.toString() || '0'} trend="Actif" isPositive={true} 
// //             icon={Users} gradientFrom="from-cyan-500" gradientTo="to-blue-600" 
// //           />
// //         </motion.div>
// //         <motion.div variants={itemVariants}>
// //           <StatCard 
// //             label="Masse Salariale" value={formatCurrency(stats.masseSalariale)} trend="Mensuel" isPositive={true} 
// //             icon={Wallet} gradientFrom="from-emerald-400" gradientTo="to-teal-600" 
// //           />
// //         </motion.div>
// //         <motion.div variants={itemVariants}>
// //           <StatCard 
// //             label="Congés en attente" value={stats.pendingLeaves?.toString() || '0'} trend="À traiter" isPositive={stats.pendingLeaves === 0} 
// //             icon={Calendar} gradientFrom="from-orange-400" gradientTo="to-red-500" 
// //           />
// //         </motion.div>
// //         <motion.div variants={itemVariants}>
// //           <StatCard 
// //             label="Taux Présence" value={`${stats.attendanceRate || 0}%`} trend={`${stats.absentToday || 0} absents`} isPositive={stats.attendanceRate > 90} 
// //             icon={Clock} gradientFrom="from-violet-500" gradientTo="to-purple-600" 
// //           />
// //         </motion.div>
// //       </div>

// //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
// //         <div className="lg:col-span-2 space-y-6">
// //           <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //             {[
// //               { label: 'Ajouter Employé', icon: UserPlus, color: 'bg-cyan-500', action: '/employes/nouveau' },
// //               { label: 'Créer Paie', icon: Wallet, color: 'bg-emerald-500', action: '/paie/nouveau' },
// //               { label: 'Gérer Congés', icon: Calendar, color: 'bg-orange-500', action: '/conges' },
// //               { label: 'Rapports', icon: BarChart, color: 'bg-violet-500', action: '/rapports' },
// //             ].map((item, i) => (
// //               <div 
// //                 key={i} 
// //                 onClick={() => router.push(item.action)}
// //                 className="group cursor-pointer bg-white dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all hover:-translate-y-1 relative overflow-hidden shadow-sm"
// //               >
// //                 <div className={`absolute top-0 right-0 w-20 h-20 opacity-10 rounded-bl-full ${item.color}`}></div>
// //                 <div className="flex items-center gap-4">
// //                   <div className={`p-3 rounded-xl ${item.color} text-white shadow-lg`}>
// //                     <item.icon size={24} />
// //                   </div>
// //                   <div>
// //                     <h4 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{item.label}</h4>
// //                     <p className="text-xs text-gray-500 dark:text-slate-400">Action rapide</p>
// //                   </div>
// //                   <ArrowRight className="ml-auto text-gray-400 dark:text-slate-600 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" size={20} />
// //                 </div>
// //               </div>
// //             ))}
// //           </motion.div>

// //           <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl">
// //             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Derniers Bulletins (3)</h3>
// //             <div className="space-y-4">
// //               {stats.recentPayrolls?.length > 0 ? (
// //                 stats.recentPayrolls.map((payroll: any) => (
// //                   <div key={payroll.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
// //                     <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 flex items-center justify-center border border-emerald-500/30 font-bold text-xs">
// //                       {payroll.employee.firstName[0]}{payroll.employee.lastName[0]}
// //                     </div>
// //                     <div className="flex-1 min-w-0">
// //                       <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{payroll.employee.firstName} {payroll.employee.lastName}</p>
// //                       <p className="text-xs text-gray-500 dark:text-slate-400">Net: {payroll.netSalary.toLocaleString()} F</p>
// //                     </div>
// //                     <span className="text-xs font-mono text-cyan-600 dark:text-cyan-500">{new Date(payroll.createdAt).toLocaleDateString()}</span>
// //                   </div>
// //                 ))
// //               ) : (
// //                 <p className="text-sm text-gray-500 dark:text-slate-500 italic">Aucun bulletin récent</p>
// //               )}
// //             </div>
// //             <button onClick={() => router.push('/paie')} className="w-full mt-4 py-2 text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-dashed border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5">
// //               Voir tout l'historique
// //             </button>
// //           </motion.div>
// //         </div>
// //           <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl">
// //   <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Répartition</h3>
// //   <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Effectifs par département</p>
  
// //   {/* LOGIQUE TOP 5 + TRI RÉCENT */}
// //   {(() => {
// //     // 1. On trie par ID ou Date de création décroissante (plus récent en premier)
// //     // Note: Si tes objets n'ont pas de 'createdAt', on utilise l'index ou l'ID
// //     const sortedDepts = [...(charts.deptDistribution || [])].sort((a, b) => b.id - a.id);
    
// //     // 2. On sépare le Top 5 et le reste
// //     const top5 = sortedDepts.slice(0, 5);
// //     const others = sortedDepts.slice(5);
    
// //     // 3. On prépare la donnée finale pour Recharts
// //     const finalData = [...top5];
// //     if (others.length > 0) {
// //       finalData.push({
// //         name: 'Autres',
// //         value: others.reduce((acc, curr) => acc + curr.value, 0),
// //         color: '#64748b' // Un gris ardoise pour "Autres"
// //       });
// //     }

// //     return (
// //       <div className="h-[250px] relative">
// //         <ResponsiveContainer width="100%" height="100%">
// //           <PieChart>
// //             <Pie 
// //               data={finalData} 
// //               cx="50%" 
// //               cy="50%" 
// //               innerRadius={60} 
// //               outerRadius={80} 
// //               paddingAngle={5} 
// //               dataKey="value" 
// //               stroke="none"
// //             >
// //               {finalData.map((entry: any, index: number) => (
// //                 <Cell key={`cell-${index}`} fill={entry.color} />
// //               ))}
// //             </Pie>
// //             <Tooltip 
// //               contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }} 
// //               itemStyle={{ color: '#fff' }}
// //             />
// //             {/* Légende personnalisée pour gérer le overflow si besoin */}
// //             <Legend 
// //               verticalAlign="bottom" 
// //               height={36} 
// //               iconType="circle" 
// //               wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
// //             />
// //           </PieChart>
// //         </ResponsiveContainer>
// //         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
// //           <span className="text-4xl font-bold text-gray-900 dark:text-white">{stats.totalEmployees}</span>
// //           <span className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-widest">Total</span>
// //         </div>
// //       </div>
// //     );
// //   })()}
// // </motion.div>
// //       </div>


// //            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
// //         <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl">
// //           <div className="flex justify-between items-center mb-6">
// //             <div>
// //               <h3 className="text-xl font-bold text-gray-900 dark:text-white">Évolution Salaires</h3>
// //               <p className="text-sm text-gray-500 dark:text-slate-400">5 derniers mois (FCFA)</p>
// //             </div>
// //           </div>
// //           <div className="h-[300px] w-full">
// //             <ResponsiveContainer width="100%" height="100%">
// //               <AreaChart data={charts.salaryTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
// //                 <defs>
// //                   <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
// //                     <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15}/>
// //                     <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
// //                   </linearGradient>
// //                   <linearGradient id="colorMasse" x1="0" y1="0" x2="0" y2="1">
// //                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
// //                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
// //                   </linearGradient>
// //                 </defs>
// //                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
// //                 <XAxis 
// //                   dataKey="name" 
// //                   axisLine={false} 
// //                   tickLine={false} 
// //                   tick={{ fill: '#94a3b8', fontSize: 12 }} 
// //                   dy={10}
// //                 />
// //                 <YAxis 
// //                   axisLine={false} 
// //                   tickLine={false} 
// //                   tick={{ fill: '#94a3b8', fontSize: 12 }}
// //                   tickFormatter={(value) => {
// //                     if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
// //                     if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
// //                     return value;
// //                   }}
// //                 />
// //                 <Tooltip 
// //                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }} 
// //                   itemStyle={{ color: '#fff' }}
// //                   formatter={(value: any) => value.toLocaleString() + ' F'}
// //                 />
// //                 <Area 
// //                   type="monotone" 
// //                   dataKey="masseSalariale" 
// //                   stroke="#10b981" 
// //                   strokeWidth={2} 
// //                   fillOpacity={1} 
// //                   fill="url(#colorMasse)" 
// //                   name="Masse Salariale" 
// //                 />
// //                 <Area 
// //                   type="monotone" 
// //                   dataKey="value" 
// //                   stroke="#06b6d4" 
// //                   strokeWidth={2} 
// //                   fillOpacity={1} 
// //                   fill="url(#colorSalary)" 
// //                   name="Salaire Net" 
// //                 />
// //               </AreaChart>
// //             </ResponsiveContainer>
// //           </div>
// //         </motion.div>

// //        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl flex flex-col">
// //           <div className="flex items-center gap-2 mb-6">
// //             <div className="p-2 bg-red-500/10 rounded-lg text-red-500 animate-pulse"><Radio size={18} /></div>
// //             <h3 className="text-lg font-bold text-gray-900 dark:text-white">En direct (36h)</h3>
// //           </div>
          
// //           <div className="flex-1 space-y-6 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
// //             {stats.recentActivities?.length > 0 ? (
// //               stats.recentActivities.map((act: any, i: number) => {
// //                 let icon = <CheckCircle size={16} />;
// //                 let color = "bg-gray-100 text-gray-500";
                
// //                 if (act.type === 'LEAVE') { icon = <Calendar size={16} />; color = "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"; }
// //                 if (act.type === 'HIRE') { icon = <User size={16} />; color = "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"; }
// //                 if (act.type === 'ATTENDANCE') { icon = <Clock size={16} />; color = "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"; }

// //                 return (
// //                   <div key={act.id} className="flex gap-4 relative">
// //                     {i !== stats.recentActivities.length - 1 && (
// //                       <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-gray-800"></div>
// //                     )}
                    
// //                     <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
// //                       {icon}
// //                     </div>
// //                     <div>
// //                       <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{act.text}</p>
// //                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{act.subText}</p>
// //                       <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-mono">{new Date(act.time).toLocaleString()}</p>
// //                     </div>
// //                   </div>
// //                 );
// //               })
// //             ) : (
// //               <div className="text-center py-10 text-gray-400">
// //                 <Bell size={32} className="mx-auto mb-2 opacity-20" />
// //                 <p className="text-sm">Aucune activité récente (dernières 36h).</p>
// //               </div>
// //             )}
// //           </div>
// //         </motion.div>
// //       </div>
// //     </motion.div>
// //   );
// // };


// 'use client';

// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Users, Wallet, Calendar, Clock, UserPlus, BarChart, ArrowRight,
//   Loader2, CheckCircle, PlayCircle, Fingerprint, Bell, Radio, User,
//   UserCheck, UserX, AlertTriangle, TrendingUp, Building2, ChevronRight,
//   Timer, Umbrella, Activity, Shield
// } from 'lucide-react';
// import {
//   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
//   PieChart, Pie, Cell, Legend
// } from 'recharts';
// import { motion } from 'framer-motion';
// import { StatCard } from './ui/StatCard';
// import { GlobalLoader } from './ui/GlobalLoader';
// import { api } from '@/services/api';
// import { UserRole } from '@/types';

// const containerVariants = {
//   hidden: { opacity: 0 },
//   visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
// };

// const itemVariants = {
//   hidden: { y: 20, opacity: 0 },
//   visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 60 } }
// };

// // ─── Petit badge de statut ────────────────────────────────────────────────────
// const StatusDot = ({ status }: { status: string }) => {
//   const map: Record<string, string> = {
//     PRESENT: 'bg-emerald-500',
//     LATE: 'bg-orange-400',
//     REMOTE: 'bg-purple-400',
//     ABSENT_UNPAID: 'bg-red-500',
//     LEAVE: 'bg-sky-400',
//     ON_LEAVE: 'bg-sky-400',
//   };
//   return <span className={`inline-block w-2 h-2 rounded-full ${map[status] || 'bg-gray-400'}`} />;
// };

// // ─── Mini carte stat équipe ───────────────────────────────────────────────────
// const TeamStatCard = ({
//   label, value, sub, color, icon: Icon
// }: {
//   label: string; value: number | string; sub?: string;
//   color: string; icon: React.ElementType;
// }) => (
//   <div className={`relative overflow-hidden rounded-2xl p-5 border ${color} flex flex-col gap-2`}>
//     <div className="flex items-center justify-between">
//       <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
//       <Icon size={18} className="opacity-60" />
//     </div>
//     <p className="text-3xl font-bold">{value}</p>
//     {sub && <p className="text-xs opacity-60">{sub}</p>}
//   </div>
// );

// // ─── Barre de présence visuelle ───────────────────────────────────────────────
// const PresenceBar = ({ present, late, absent, total }: {
//   present: number; late: number; absent: number; total: number;
// }) => {
//   if (total === 0) return null;
//   const pPct = (present / total) * 100;
//   const lPct = (late / total) * 100;
//   const aPct = (absent / total) * 100;
//   return (
//     <div className="w-full h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex">
//       <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${pPct}%` }} title={`${present} présents`} />
//       <div className="bg-orange-400 transition-all duration-700" style={{ width: `${lPct}%` }} title={`${late} retards`} />
//       <div className="bg-red-400 transition-all duration-700" style={{ width: `${aPct}%` }} title={`${absent} absents`} />
//     </div>
//   );
// };

// export const DashboardContent = () => {
//   const router = useRouter();
//   const [loading, setLoading]         = useState(true);
//   const [userRole, setUserRole]       = useState<UserRole | null>(null);
//   const [showSalary, setShowSalary]   = useState(false);
//   const [stats, setStats]             = useState<any>({});
//   const [charts, setCharts]           = useState<any>({ salaryTrend: [], deptDistribution: [] });
//   const [myStats, setMyStats]         = useState<any>({});
//   const [managerStats, setManagerStats] = useState<any>({});

//   useEffect(() => {
//     const fetchDashboard = async () => {
//       const storedUser = localStorage.getItem('user');
//       if (!storedUser) return;

//       const user = JSON.parse(storedUser);
//       setUserRole(user.role);

//       try {
//         // ── ADMIN / HR / SUPER_ADMIN ──────────────────────────
//         if (['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role)) {
//           const [summary, chartsData] = await Promise.all([
//             api.get<any>('/dashboard/summary'),
//             api.get<any>('/dashboard/charts')
//           ]);
//           setStats(summary);
//           setCharts(chartsData);

//         // ── MANAGER ───────────────────────────────────────────
//         } else if (user.role === 'MANAGER') {
//           const [managerData, employeeProfile] = await Promise.all([
//             api.get<any>('/dashboard/manager'),
//             api.get<any>('/employees/me').catch(() => null)
//           ]);
//           setManagerStats(managerData);

//           // Stats perso du manager (son salaire, ses congés)
//           if (employeeProfile?.id) {
//             const [leaves, attendance, payrolls] = await Promise.all([
//               api.get<any[]>('/leaves/me').catch(() => []),
//               api.get<any[]>('/attendance/today').catch(() => []),
//               api.get<any[]>(`/payrolls?employeeId=${employeeProfile.id}`).catch(() => [])
//             ]);

//             const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;
//             const todayStatus   = attendance.find((a: any) => a.employeeId === employeeProfile.id);

//             let lastSalaryAmount = '0 F';
//             let lastSalaryMonth  = '-';
//             if (payrolls?.length > 0) {
//               const sorted = [...payrolls].sort((a, b) =>
//                 b.year !== a.year ? b.year - a.year : b.month - a.month
//               );
//               lastSalaryAmount = sorted[0].netSalary.toLocaleString() + ' F';
//               lastSalaryMonth  = new Date(0, sorted[0].month - 1).toLocaleString('fr-FR', { month: 'long' });
//             }

//             setMyStats({
//               pendingLeaves,
//               checkIn:          todayStatus?.checkIn,
//               checkOut:         todayStatus?.checkOut,
//               lastSalary:       lastSalaryAmount,
//               lastSalaryMonth,
//             });
//           }

//         // ── EMPLOYEE ──────────────────────────────────────────
//         } else {
//           const employeeProfile = await api.get<any>('/employees/me');
//           if (!employeeProfile?.id) { setLoading(false); return; }

//           const [leaves, attendance, payrolls] = await Promise.all([
//             api.get<any[]>('/leaves/me').catch(() => []),
//             api.get<any[]>('/attendance/today').catch(() => []),
//             api.get<any[]>(`/payrolls?employeeId=${employeeProfile.id}`).catch(() => [])
//           ]);

//           const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;

//           let remainingLeaves = 0;
//           try {
//             const balance = await api.get<any>(`/leaves/balance/${employeeProfile.id}?year=${new Date().getFullYear()}`);
//             remainingLeaves = balance.annualRemaining || 0;
//           } catch {
//             const currentYear    = new Date().getFullYear();
//             const approvedLeaves = leaves.filter((l: any) =>
//               l.status === 'APPROVED' && l.type === 'ANNUAL' &&
//               new Date(l.startDate).getFullYear() === currentYear
//             );
//             const takenDays = approvedLeaves.reduce((acc: number, curr: any) => acc + (curr.daysCount || 0), 0);
//             if (employeeProfile.hireDate) {
//               const months = (Date.now() - new Date(employeeProfile.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
//               remainingLeaves = Math.max(0, Math.round(Math.min(30, months * 2.5) * 10) / 10 - takenDays);
//             }
//           }

//           let lastSalaryAmount = '0 F';
//           let lastSalaryMonth  = '-';
//           if (payrolls?.length > 0) {
//             const sorted = [...payrolls].sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
//             lastSalaryAmount = sorted[0].netSalary.toLocaleString() + ' F';
//             lastSalaryMonth  = new Date(0, sorted[0].month - 1).toLocaleString('fr-FR', { month: 'long' });
//           }

//           const todayStatus = attendance.find((a: any) => a.employeeId === employeeProfile.id);
//           setMyStats({
//             pendingLeaves,
//             remainingLeaves: Number(remainingLeaves).toFixed(1),
//             checkIn:         todayStatus?.checkIn,
//             checkOut:        todayStatus?.checkOut,
//             lastSalary:      lastSalaryAmount,
//             lastSalaryMonth,
//           });
//         }
//       } catch (error) {
//         console.error('❌ Erreur chargement dashboard:', error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchDashboard();
//   }, []);

//   const formatCurrency = (val: number) => {
//     if (!val) return '0';
//     if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
//     if (val >= 1000)    return (val / 1000).toFixed(1) + 'k';
//     return val.toString();
//   };

//   if (loading) return <GlobalLoader />;

//   // ══════════════════════════════════════════════════════════════
//   // 👔 VUE MANAGER
//   // ══════════════════════════════════════════════════════════════
//   if (userRole === 'MANAGER') {
//     const m = managerStats;
//     const presenceRate = m.presenceRate || 0;
//     const rateColor =
//       presenceRate >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
//       presenceRate >= 70 ? 'text-orange-500' : 'text-red-500';

//     return (
//       <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">

//         {/* ── HEADER ── */}
//         <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//           <div>
//             <div className="flex items-center gap-3 mb-1">
//               <div className="p-2 bg-sky-500/10 rounded-xl">
//                 <Shield size={20} className="text-sky-500" />
//               </div>
//               <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
//                 Tableau de bord Manager
//               </h2>
//             </div>
//             <p className="text-gray-500 dark:text-gray-400 ml-11 flex items-center gap-2">
//               <Building2 size={14} className="text-sky-400" />
//               <span className="font-semibold text-sky-600 dark:text-sky-400">{m.departmentName || 'Mon Département'}</span>
//               <span className="text-gray-400">·</span>
//               <span>{m.teamSize || 0} membre{(m.teamSize || 0) > 1 ? 's' : ''}</span>
//             </p>
//           </div>
//           <div className="flex gap-3">
//             <button
//               onClick={() => router.push('/presences')}
//               className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20 text-sm"
//             >
//               <Activity size={16} /> Présences équipe
//             </button>
//             <button
//               onClick={() => router.push('/conges')}
//               className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 text-gray-700 dark:text-white font-bold rounded-xl transition-all flex items-center gap-2 text-sm"
//             >
//               <Calendar size={16} /> Congés
//               {m.pendingLeaves > 0 && (
//                 <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
//                   {m.pendingLeaves}
//                 </span>
//               )}
//             </button>
//           </div>
//         </motion.div>

//         {/* ── STATS ÉQUIPE — 4 CARDS ── */}
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//           <motion.div variants={itemVariants}>
//             <TeamStatCard
//               label="Membres" value={m.teamSize || 0}
//               sub="Actifs dans l'équipe"
//               color="bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100"
//               icon={Users}
//             />
//           </motion.div>
//           <motion.div variants={itemVariants}>
//             <TeamStatCard
//               label="Présents" value={m.presentCount || 0}
//               sub={`${presenceRate}% de l'équipe`}
//               color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
//               icon={UserCheck}
//             />
//           </motion.div>
//           <motion.div variants={itemVariants}>
//             <TeamStatCard
//               label="Absents" value={m.absentCount || 0}
//               sub={m.lateCount > 0 ? `dont ${m.lateCount} retard${m.lateCount > 1 ? 's' : ''}` : 'Aujourd\'hui'}
//               color="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100"
//               icon={UserX}
//             />
//           </motion.div>
//           <motion.div variants={itemVariants}>
//             <TeamStatCard
//               label="Congés" value={m.onLeaveCount || 0}
//               sub={`${m.pendingLeaves || 0} en attente`}
//               color="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100"
//               icon={Umbrella}
//             />
//           </motion.div>
//         </div>

//         {/* ── BARRE PRÉSENCE + TAUX ── */}
//         <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="font-bold text-gray-900 dark:text-white">Présence aujourd'hui</h3>
//             <span className={`text-3xl font-bold ${rateColor}`}>{presenceRate}%</span>
//           </div>
//           <PresenceBar
//             present={m.presentCount || 0}
//             late={m.lateCount || 0}
//             absent={m.absentCount || 0}
//             total={m.teamSize || 1}
//           />
//           <div className="flex gap-6 mt-3 text-xs text-gray-500 dark:text-gray-400">
//             <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Présent ({m.presentCount || 0})</span>
//             <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" />Retard ({m.lateCount || 0})</span>
//             <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" />Absent ({m.absentCount || 0})</span>
//           </div>
//         </motion.div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

//           {/* ── ABSENTS DU JOUR ── */}
//           <motion.div variants={itemVariants} className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
//             <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
//               <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                 <UserX size={18} className="text-red-400" /> Absents du jour
//               </h3>
//               <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full font-bold">
//                 {(m.absentMembers || []).length}
//               </span>
//             </div>
//             <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
//               {(m.absentMembers || []).length === 0 ? (
//                 <div className="p-8 text-center">
//                   <CheckCircle size={32} className="mx-auto text-emerald-400 mb-2" />
//                   <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Tout le monde est là !</p>
//                 </div>
//               ) : (
//                 m.absentMembers.map((emp: any) => (
//                   <div key={emp.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
//                     <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold text-sm shrink-0">
//                       {emp.firstName[0]}{emp.lastName[0]}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
//                         {emp.firstName} {emp.lastName}
//                       </p>
//                       <p className="text-xs text-gray-500 truncate">{emp.position}</p>
//                     </div>
//                     <StatusDot status={emp.status} />
//                   </div>
//                 ))
//               )}
//             </div>
//           </motion.div>

//           {/* ── MEMBRES DE L'ÉQUIPE ── */}
//           <motion.div variants={itemVariants} className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
//             <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
//               <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                 <Users size={18} className="text-sky-400" /> Mon équipe
//               </h3>
//               <button
//                 onClick={() => router.push('/employes')}
//                 className="text-xs text-sky-500 font-bold hover:text-sky-600 flex items-center gap-1"
//               >
//                 Voir tout <ChevronRight size={14} />
//               </button>
//             </div>
//             <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
//               {(m.teamMembers || []).slice(0, 8).map((emp: any) => (
//                 <div key={emp.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
//                   <img
//                     src={emp.photoUrl || `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random`}
//                     className="w-9 h-9 rounded-full object-cover shrink-0"
//                     alt=""
//                   />
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
//                       {emp.firstName} {emp.lastName}
//                     </p>
//                     <p className="text-xs text-gray-500 truncate">{emp.position}</p>
//                   </div>
//                   <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded font-mono">
//                     {emp.contractType}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//           {/* ── ACTIVITÉ RÉCENTE + DEMANDES CONGÉS ── */}
//           <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">

//             {/* Demandes de congé récentes */}
//             <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
//               <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
//                 <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                   <Calendar size={16} className="text-orange-400" /> Congés récents
//                 </h3>
//                 {m.pendingLeaves > 0 && (
//                   <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-bold">
//                     {m.pendingLeaves} en attente
//                   </span>
//                 )}
//               </div>
//               <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-40 overflow-y-auto">
//                 {(m.recentLeaveRequests || []).length === 0 ? (
//                   <p className="p-4 text-xs text-gray-400 text-center">Aucune demande récente</p>
//                 ) : (
//                   m.recentLeaveRequests.map((l: any) => (
//                     <div key={l.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-750">
//                       <div className="flex-1 min-w-0">
//                         <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
//                           {l.employee.firstName} {l.employee.lastName}
//                         </p>
//                         <p className="text-[10px] text-gray-400">{l.type} · {l.daysCount}j</p>
//                       </div>
//                       <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
//                         l.status === 'PENDING'  ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
//                         l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
//                         'bg-red-100 text-red-600'
//                       }`}>
//                         {l.status === 'PENDING' ? 'Attente' : l.status === 'APPROVED' ? 'OK' : 'Refusé'}
//                       </span>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>

//             {/* Activité pointage */}
//             <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
//               <div className="p-4 border-b border-gray-100 dark:border-gray-700">
//                 <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                   <Timer size={16} className="text-emerald-400" /> Derniers pointages
//                 </h3>
//               </div>
//               <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-40 overflow-y-auto">
//                 {(m.recentActivity || []).length === 0 ? (
//                   <p className="p-4 text-xs text-gray-400 text-center">Aucune activité</p>
//                 ) : (
//                   m.recentActivity.slice(0, 5).map((act: any) => (
//                     <div key={act.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-750">
//                       <StatusDot status={act.checkOut ? 'REMOTE' : 'PRESENT'} />
//                       <div className="flex-1 min-w-0">
//                         <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{act.text}</p>
//                         <p className="text-[10px] text-gray-400">{act.subText}</p>
//                       </div>
//                       <p className="text-[10px] font-mono text-gray-400 shrink-0">
//                         {act.time ? new Date(act.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
//                       </p>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </motion.div>
//         </div>

//         {/* ── PERSO MANAGER : son salaire + son pointage ── */}
//         <motion.div variants={itemVariants}>
//           <div className="bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-5">
//             <h3 className="text-sm font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider mb-4 flex items-center gap-2">
//               <User size={14} /> Mon espace personnel
//             </h3>
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//               <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-sky-100 dark:border-sky-800">
//                 <p className="text-xs text-gray-500 mb-1">Congés en attente</p>
//                 <p className="text-2xl font-bold text-orange-500">{myStats.pendingLeaves || 0}</p>
//               </div>
//               <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-sky-100 dark:border-sky-800 cursor-pointer" onClick={() => setShowSalary(!showSalary)}>
//                 <p className="text-xs text-gray-500 mb-1">Dernier salaire</p>
//                 {showSalary
//                   ? <p className="text-xl font-bold text-emerald-600">{myStats.lastSalary || '—'}</p>
//                   : <p className="text-xl font-bold text-gray-400 tracking-widest">••••••</p>
//                 }
//                 <p className="text-[10px] text-gray-400 mt-0.5">{myStats.lastSalaryMonth || '—'}</p>
//               </div>
//               <div
//                 className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-sky-100 dark:border-sky-800 cursor-pointer hover:bg-gray-50"
//                 onClick={() => router.push('/presences/pointage')}
//               >
//                 <p className="text-xs text-gray-500 mb-1">Mon pointage</p>
//                 {myStats.checkIn ? (
//                   <>
//                     <p className="text-sm font-bold text-emerald-600">
//                       {myStats.checkOut ? '✓ Journée finie' : '⏳ En cours'}
//                     </p>
//                     <p className="text-[10px] text-gray-400 mt-0.5">
//                       Entrée {new Date(myStats.checkIn).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
//                     </p>
//                   </>
//                 ) : (
//                   <p className="text-sm font-bold text-gray-400">Non pointé</p>
//                 )}
//               </div>
//               <div
//                 className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-sky-100 dark:border-sky-800 cursor-pointer hover:bg-gray-50"
//                 onClick={() => router.push('/conges/nouveau')}
//               >
//                 <p className="text-xs text-gray-500 mb-1">Actions rapides</p>
//                 <div className="flex gap-2 mt-1">
//                   <span className="text-[10px] bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2 py-1 rounded-lg font-bold cursor-pointer hover:bg-sky-200 transition-colors">
//                     + Congé
//                   </span>
//                   <span
//                     className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg font-bold cursor-pointer hover:bg-emerald-200 transition-colors"
//                     onClick={e => { e.stopPropagation(); router.push('/presences/pointage-manuel'); }}
//                   >
//                     Pointer équipe
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </motion.div>

//       </motion.div>
//     );
//   }

//   // ══════════════════════════════════════════════════════════════
//   // 👤 VUE EMPLOYEE (inchangée)
//   // ══════════════════════════════════════════════════════════════
//   if (userRole === 'EMPLOYEE') {
//     return (
//       <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
//         <div className="mb-6">
//           <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mon Espace</h2>
//           <p className="text-gray-500 dark:text-slate-400">Bienvenue, voici votre résumé personnel.</p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           <motion.div variants={itemVariants}>
//             <StatCard label="Congés Posés" value={myStats.pendingLeaves?.toString() || '0'} trend="En attente" isPositive={true} icon={Calendar} gradientFrom="from-orange-400" gradientTo="to-red-500" />
//           </motion.div>
//           <motion.div variants={itemVariants}>
//             <StatCard label="Solde Congés" value={`${myStats.remainingLeaves || '0'} j`} trend="Disponibles" isPositive={true} icon={Clock} gradientFrom="from-emerald-400" gradientTo="to-teal-600" />
//           </motion.div>
//           <motion.div variants={itemVariants}>
//             <StatCard label="Dernier Salaire" value={myStats.lastSalary || '0 F'} trend={myStats.lastSalaryMonth || '-'} isPositive={true} icon={Wallet} gradientFrom="from-blue-500" gradientTo="to-indigo-600" isPrivate={true} showValue={showSalary} onToggleVisibility={() => setShowSalary(!showSalary)} />
//           </motion.div>
//           <motion.div variants={itemVariants}>
//             <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-6 border border-gray-200 dark:border-white/5 h-full flex flex-col justify-center items-center text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-xl" onClick={() => router.push('/presences/pointage')}>
//               {myStats.checkIn && myStats.checkOut ? (
//                 <><div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-sky-500/20 text-sky-500"><Fingerprint size={24} /></div><h4 className="text-gray-900 dark:text-white font-bold">Journée terminée</h4><p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Depuis {new Date(myStats.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></>
//               ) : myStats.checkIn ? (
//                 <><div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-emerald-500/20 text-emerald-500"><Fingerprint size={24} /></div><h4 className="text-gray-900 dark:text-white font-bold">Pointé</h4><p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Depuis {new Date(myStats.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></>
//               ) : (
//                 <><div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-slate-200 dark:bg-slate-700/50 text-slate-400"><Fingerprint size={24} /></div><h4 className="text-gray-900 dark:text-white font-bold">Non pointé</h4><p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Pointer maintenant</p></>
//               )}
//             </div>
//           </motion.div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-lg">
//             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Mes Actions Rapides</h3>
//             <div className="grid grid-cols-2 gap-4">
//               {[
//                 { label: 'Demander congé', icon: Calendar, color: 'text-sky-500', path: '/conges/nouveau' },
//                 { label: 'Mes bulletins',  icon: Wallet,   color: 'text-emerald-500', path: '/ma-paie' },
//                 { label: 'Formation',      icon: PlayCircle, color: 'text-purple-500', path: '/formation' },
//                 { label: 'Pointer',        icon: Fingerprint, color: 'text-orange-500', path: '/presences/pointage' },
//               ].map(item => (
//                 <button key={item.label} onClick={() => router.push(item.path)} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 text-left transition-colors group">
//                   <item.icon className={`${item.color} mb-3 group-hover:scale-110 transition-transform`} size={24} />
//                   <p className="font-bold text-gray-900 dark:text-white text-sm">{item.label}</p>
//                 </button>
//               ))}
//             </div>
//           </motion.div>
//         </div>
//       </motion.div>
//     );
//   }

//   // ══════════════════════════════════════════════════════════════
//   // 🔑 VUE ADMIN / HR (inchangée)
//   // ══════════════════════════════════════════════════════════════
//   return (
//     <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <motion.div variants={itemVariants}><StatCard label="Total Employés" value={stats.totalEmployees?.toString() || '0'} trend="Actif" isPositive={true} icon={Users} gradientFrom="from-cyan-500" gradientTo="to-blue-600" /></motion.div>
//         <motion.div variants={itemVariants}><StatCard label="Masse Salariale" value={formatCurrency(stats.masseSalariale)} trend="Mensuel" isPositive={true} icon={Wallet} gradientFrom="from-emerald-400" gradientTo="to-teal-600" /></motion.div>
//         <motion.div variants={itemVariants}><StatCard label="Congés en attente" value={stats.pendingLeaves?.toString() || '0'} trend="À traiter" isPositive={stats.pendingLeaves === 0} icon={Calendar} gradientFrom="from-orange-400" gradientTo="to-red-500" /></motion.div>
//         <motion.div variants={itemVariants}><StatCard label="Taux Présence" value={`${stats.attendanceRate || 0}%`} trend={`${stats.absentToday || 0} absents`} isPositive={stats.attendanceRate > 90} icon={Clock} gradientFrom="from-violet-500" gradientTo="to-purple-600" /></motion.div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2 space-y-6">
//           <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             {[
//               { label: 'Ajouter Employé', icon: UserPlus, color: 'bg-cyan-500',    action: '/employes/nouveau' },
//               { label: 'Créer Paie',      icon: Wallet,   color: 'bg-emerald-500', action: '/paie/nouveau' },
//               { label: 'Gérer Congés',    icon: Calendar, color: 'bg-orange-500',  action: '/conges' },
//               { label: 'Rapports',        icon: BarChart, color: 'bg-violet-500',  action: '/rapports' },
//             ].map((item, i) => (
//               <div key={i} onClick={() => router.push(item.action)} className="group cursor-pointer bg-white dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all hover:-translate-y-1 relative overflow-hidden shadow-sm">
//                 <div className={`absolute top-0 right-0 w-20 h-20 opacity-10 rounded-bl-full ${item.color}`}></div>
//                 <div className="flex items-center gap-4">
//                   <div className={`p-3 rounded-xl ${item.color} text-white shadow-lg`}><item.icon size={24} /></div>
//                   <div>
//                     <h4 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{item.label}</h4>
//                     <p className="text-xs text-gray-500 dark:text-slate-400">Action rapide</p>
//                   </div>
//                   <ArrowRight className="ml-auto text-gray-400 dark:text-slate-600 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" size={20} />
//                 </div>
//               </div>
//             ))}
//           </motion.div>

//           <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl">
//             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Derniers Bulletins (3)</h3>
//             <div className="space-y-4">
//               {stats.recentPayrolls?.length > 0 ? stats.recentPayrolls.map((payroll: any) => (
//                 <div key={payroll.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
//                   <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 flex items-center justify-center border border-emerald-500/30 font-bold text-xs">
//                     {payroll.employee.firstName[0]}{payroll.employee.lastName[0]}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{payroll.employee.firstName} {payroll.employee.lastName}</p>
//                     <p className="text-xs text-gray-500 dark:text-slate-400">Net: {payroll.netSalary.toLocaleString()} F</p>
//                   </div>
//                   <span className="text-xs font-mono text-cyan-600 dark:text-cyan-500">{new Date(payroll.createdAt).toLocaleDateString()}</span>
//                 </div>
//               )) : <p className="text-sm text-gray-500 dark:text-slate-500 italic">Aucun bulletin récent</p>}
//             </div>
//             <button onClick={() => router.push('/paie')} className="w-full mt-4 py-2 text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-dashed border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5">
//               Voir tout l'historique
//             </button>
//           </motion.div>
//         </div>

//         <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl">
//           <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Répartition</h3>
//           <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Effectifs par département</p>
//           {(() => {
//             const sorted = [...(charts.deptDistribution || [])].sort((a, b) => b.id - a.id);
//             const top5   = sorted.slice(0, 5);
//             const others = sorted.slice(5);
//             const finalData = [...top5];
//             if (others.length > 0) finalData.push({ name: 'Autres', value: others.reduce((acc: number, curr: any) => acc + curr.value, 0), color: '#64748b' });
//             return (
//               <div className="h-[250px] relative">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie data={finalData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
//                       {finalData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
//                     </Pie>
//                     <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
//                     <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
//                   </PieChart>
//                 </ResponsiveContainer>
//                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
//                   <span className="text-4xl font-bold text-gray-900 dark:text-white">{stats.totalEmployees}</span>
//                   <span className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-widest">Total</span>
//                 </div>
//               </div>
//             );
//           })()}
//         </motion.div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl">
//           <div className="flex justify-between items-center mb-6">
//             <div>
//               <h3 className="text-xl font-bold text-gray-900 dark:text-white">Évolution Salaires</h3>
//               <p className="text-sm text-gray-500 dark:text-slate-400">5 derniers mois (FCFA)</p>
//             </div>
//           </div>
//           <div className="h-[300px] w-full">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart data={charts.salaryTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
//                 <defs>
//                   <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15}/><stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient>
//                   <linearGradient id="colorMasse"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
//                 </defs>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
//                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
//                 <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
//                 <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} formatter={(value: any) => value.toLocaleString() + ' F'} />
//                 <Area type="monotone" dataKey="masseSalariale" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMasse)" name="Masse Salariale" />
//                 <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorSalary)" name="Salaire Net" />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </motion.div>

//         <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl flex flex-col">
//           <div className="flex items-center gap-2 mb-6">
//             <div className="p-2 bg-red-500/10 rounded-lg text-red-500 animate-pulse"><Radio size={18} /></div>
//             <h3 className="text-lg font-bold text-gray-900 dark:text-white">En direct (36h)</h3>
//           </div>
//           <div className="flex-1 space-y-6 overflow-y-auto max-h-[400px] pr-2">
//             {stats.recentActivities?.length > 0 ? stats.recentActivities.map((act: any, i: number) => {
//               let icon  = <CheckCircle size={16} />;
//               let color = 'bg-gray-100 text-gray-500';
//               if (act.type === 'LEAVE')      { icon = <Calendar size={16} />; color = 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'; }
//               if (act.type === 'HIRE')       { icon = <User size={16} />;     color = 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'; }
//               if (act.type === 'ATTENDANCE') { icon = <Clock size={16} />;    color = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'; }
//               return (
//                 <div key={act.id} className="flex gap-4 relative">
//                   {i !== stats.recentActivities.length - 1 && <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-gray-800"></div>}
//                   <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
//                   <div>
//                     <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{act.text}</p>
//                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{act.subText}</p>
//                     <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-mono">{new Date(act.time).toLocaleString()}</p>
//                   </div>
//                 </div>
//               );
//             }) : (
//               <div className="text-center py-10 text-gray-400">
//                 <Bell size={32} className="mx-auto mb-2 opacity-20" />
//                 <p className="text-sm">Aucune activité récente (dernières 36h).</p>
//               </div>
//             )}
//           </div>
//         </motion.div>
//       </div>
//     </motion.div>
//   );
// };




'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Wallet, Calendar, Clock, UserPlus, BarChart, ArrowRight,
  Loader2, CheckCircle, PlayCircle, Fingerprint, Bell, Radio, User,
  UserCheck, UserX, AlertTriangle, TrendingUp, Building2, ChevronRight,
  Timer, Umbrella, Activity, Shield
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
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 60 } }
};

// ─── Petit badge de statut ────────────────────────────────────────────────────
const StatusDot = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    PRESENT: 'bg-emerald-500',
    LATE: 'bg-orange-400',
    REMOTE: 'bg-purple-400',
    ABSENT_UNPAID: 'bg-red-500',
    LEAVE: 'bg-sky-400',
    ON_LEAVE: 'bg-sky-400',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status] || 'bg-gray-400'}`} />;
};


export const DashboardContent = () => {
  const router = useRouter();
  const [loading, setLoading]         = useState(true);
  const [userRole, setUserRole]       = useState<UserRole | null>(null);
  const [showSalary, setShowSalary]   = useState(false);
  const [stats, setStats]             = useState<any>({});
  const [charts, setCharts]           = useState<any>({ salaryTrend: [], deptDistribution: [] });
  const [myStats, setMyStats]         = useState<any>({});
  const [managerStats, setManagerStats] = useState<any>({});

  useEffect(() => {
    const fetchDashboard = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      const user = JSON.parse(storedUser);
      setUserRole(user.role);

      try {
        // ── ADMIN / HR / SUPER_ADMIN ──────────────────────────
        if (['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(user.role)) {
          const [summary, chartsData] = await Promise.all([
            api.get<any>('/dashboard/summary'),
            api.get<any>('/dashboard/charts')
          ]);
          setStats(summary);
          setCharts(chartsData);

        // ── MANAGER ───────────────────────────────────────────
        } else if (user.role === 'MANAGER') {
          const [managerData, employeeProfile] = await Promise.all([
            api.get<any>('/dashboard/manager'),
            api.get<any>('/employees/me').catch(() => null)
          ]);
          setManagerStats(managerData);

          // Stats perso du manager (son salaire, ses congés)
          if (employeeProfile?.id) {
            const [leaves, attendance, payrolls] = await Promise.all([
              api.get<any[]>('/leaves/me').catch(() => []),
              api.get<any[]>('/attendance/today').catch(() => []),
              api.get<any[]>(`/payrolls?employeeId=${employeeProfile.id}`).catch(() => [])
            ]);

            const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;
            const todayStatus   = attendance.find((a: any) => a.employeeId === employeeProfile.id);

            let lastSalaryAmount = '0 F';
            let lastSalaryMonth  = '-';
            if (payrolls?.length > 0) {
              const sorted = [...payrolls].sort((a, b) =>
                b.year !== a.year ? b.year - a.year : b.month - a.month
              );
              lastSalaryAmount = sorted[0].netSalary.toLocaleString() + ' F';
              lastSalaryMonth  = new Date(0, sorted[0].month - 1).toLocaleString('fr-FR', { month: 'long' });
            }

            setMyStats({
              pendingLeaves,
              checkIn:          todayStatus?.checkIn,
              checkOut:         todayStatus?.checkOut,
              lastSalary:       lastSalaryAmount,
              lastSalaryMonth,
            });
          }

        // ── EMPLOYEE ──────────────────────────────────────────
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
            const currentYear    = new Date().getFullYear();
            const approvedLeaves = leaves.filter((l: any) =>
              l.status === 'APPROVED' && l.type === 'ANNUAL' &&
              new Date(l.startDate).getFullYear() === currentYear
            );
            const takenDays = approvedLeaves.reduce((acc: number, curr: any) => acc + (curr.daysCount || 0), 0);
            if (employeeProfile.hireDate) {
              const months = (Date.now() - new Date(employeeProfile.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
              remainingLeaves = Math.max(0, Math.round(Math.min(30, months * 2.5) * 10) / 10 - takenDays);
            }
          }

          let lastSalaryAmount = '0 F';
          let lastSalaryMonth  = '-';
          if (payrolls?.length > 0) {
            const sorted = [...payrolls].sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
            lastSalaryAmount = sorted[0].netSalary.toLocaleString() + ' F';
            lastSalaryMonth  = new Date(0, sorted[0].month - 1).toLocaleString('fr-FR', { month: 'long' });
          }

          const todayStatus = attendance.find((a: any) => a.employeeId === employeeProfile.id);
          setMyStats({
            pendingLeaves,
            remainingLeaves: Number(remainingLeaves).toFixed(1),
            checkIn:         todayStatus?.checkIn,
            checkOut:        todayStatus?.checkOut,
            lastSalary:      lastSalaryAmount,
            lastSalaryMonth,
          });
        }
      } catch (error) {
        console.error('❌ Erreur chargement dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatCurrency = (val: number) => {
    if (!val) return '0';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000)    return (val / 1000).toFixed(1) + 'k';
    return val.toString();
  };

  if (loading) return <GlobalLoader />;

  // ══════════════════════════════════════════════════════════════
  // 👔 VUE MANAGER — même niveau visuel que l'ADMIN
  // ══════════════════════════════════════════════════════════════
  if (userRole === 'MANAGER') {
    const m = managerStats;
    const presenceRate = m.presenceRate || 0;
    const rateColor =
      presenceRate >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
      presenceRate >= 70 ? 'text-orange-500' : 'text-red-500';

    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">

        {/* ── HEADER — identique admin ── */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-sky-500/10 rounded-xl">
                <Shield size={20} className="text-sky-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Tableau de bord Manager
              </h2>
            </div>
            <p className="text-gray-500 dark:text-gray-400 ml-11 flex items-center gap-2">
              <Building2 size={14} className="text-sky-400" />
              <span className="font-semibold text-sky-600 dark:text-sky-400">{m.departmentName || 'Mon Département'}</span>
              <span className="text-gray-400">·</span>
              <span>{m.teamSize || 0} membre{(m.teamSize || 0) > 1 ? 's' : ''}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/presences')}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20 text-sm">
              <Activity size={16} /> Présences équipe
            </button>
            <button onClick={() => router.push('/conges')}
              className="px-4 py-2 bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-white font-bold rounded-xl transition-all flex items-center gap-2 text-sm backdrop-blur-xl">
              <Calendar size={16} /> Congés
              {m.pendingLeaves > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{m.pendingLeaves}</span>
              )}
            </button>
          </div>
        </motion.div>

        {/* ── STATS ÉQUIPE — 4 StatCard identiques admin ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div variants={itemVariants}>
            <StatCard
              label="Membres Équipe" value={(m.teamSize || 0).toString()}
              trend={m.departmentName || 'Département'} isPositive={true}
              icon={Users} gradientFrom="from-cyan-500" gradientTo="to-blue-600"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              label="Présents" value={(m.presentCount || 0).toString()}
              trend={`${presenceRate}% de l'équipe`} isPositive={presenceRate >= 70}
              icon={UserCheck} gradientFrom="from-emerald-400" gradientTo="to-teal-600"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              label="Absents" value={(m.absentCount || 0).toString()}
              trend={m.lateCount > 0 ? `dont ${m.lateCount} retard${m.lateCount > 1 ? 's' : ''}` : "Aujourd'hui"}
              isPositive={m.absentCount === 0}
              icon={UserX} gradientFrom="from-orange-400" gradientTo="to-red-500"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              label="Congés en cours" value={(m.onLeaveCount || 0).toString()}
              trend={`${m.pendingLeaves || 0} en attente`} isPositive={m.pendingLeaves === 0}
              icon={Umbrella} gradientFrom="from-violet-500" gradientTo="to-purple-600"
            />
          </motion.div>
        </div>

        {/* ── BARRE PRÉSENCE — même style carte admin ── */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Présence aujourd'hui</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">{m.teamSize || 0} membres dans l'équipe</p>
            </div>
            <span className={`text-4xl font-extrabold ${rateColor}`}>{presenceRate}%</span>
          </div>
          {/* Barre visuelle */}
          {(() => {
            const total = m.teamSize || 1;
            const pPct  = ((m.presentCount || 0) / total) * 100;
            const lPct  = ((m.lateCount    || 0) / total) * 100;
            const aPct  = ((m.absentCount  || 0) / total) * 100;
            return (
              <>
                <div className="w-full h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-white/10 flex">
                  <div className="bg-emerald-500 transition-all duration-700 rounded-l-full" style={{ width: `${pPct}%` }} />
                  <div className="bg-orange-400 transition-all duration-700" style={{ width: `${lPct}%` }} />
                  <div className="bg-red-400 transition-all duration-700 rounded-r-full" style={{ width: `${aPct}%` }} />
                </div>
                <div className="flex gap-6 mt-3 text-xs text-gray-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Présent ({m.presentCount || 0})</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" />Retard ({m.lateCount || 0})</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" />Absent ({m.absentCount || 0})</span>
                </div>
              </>
            );
          })()}
        </motion.div>

        {/* ── GRILLE 3 COLONNES — même style panneaux admin ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Absents du jour */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserX size={18} className="text-red-400" /> Absents du jour
              </h3>
              <span className="text-xs bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full font-bold border border-red-500/20">
                {(m.absentMembers || []).length}
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-72 overflow-y-auto">
              {(m.absentMembers || []).length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle size={32} className="mx-auto text-emerald-400 mb-2" />
                  <p className="text-sm font-bold text-gray-700 dark:text-slate-300">Tout le monde est là !</p>
                </div>
              ) : (
                m.absentMembers.map((emp: any) => (
                  <div key={emp.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-bold text-sm shrink-0">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{emp.position}</p>
                    </div>
                    <StatusDot status={emp.status} />
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Mon équipe */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users size={18} className="text-sky-400" /> Mon équipe
              </h3>
              <button onClick={() => router.push('/employes')}
                className="text-xs text-sky-500 font-bold hover:text-sky-400 flex items-center gap-1 transition-colors">
                Voir tout <ChevronRight size={14} />
              </button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-72 overflow-y-auto">
              {(m.teamMembers || []).slice(0, 8).map((emp: any) => (
                <div key={emp.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <img
                    src={emp.photoUrl || `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random`}
                    className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200 dark:border-white/10"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{emp.position}</p>
                  </div>
                  <span className="text-[10px] bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded font-mono border border-gray-200 dark:border-white/10">
                    {emp.contractType}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Congés récents + Derniers pointages */}
          <motion.div variants={itemVariants} className="space-y-4">

            {/* Congés */}
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar size={16} className="text-orange-400" /> Congés récents
                </h3>
                {m.pendingLeaves > 0 && (
                  <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full font-bold border border-orange-500/20">
                    {m.pendingLeaves} en attente
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-40 overflow-y-auto">
                {(m.recentLeaveRequests || []).length === 0 ? (
                  <p className="p-4 text-xs text-gray-400 dark:text-slate-500 text-center italic">Aucune demande récente</p>
                ) : (
                  m.recentLeaveRequests.map((l: any) => (
                    <div key={l.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{l.employee.firstName} {l.employee.lastName}</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500">{l.type} · {l.daysCount}j</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
                        l.status === 'PENDING'  ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                        l.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {l.status === 'PENDING' ? 'Attente' : l.status === 'APPROVED' ? 'OK' : 'Refusé'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Derniers pointages */}
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-white/5">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Timer size={16} className="text-emerald-400" /> Derniers pointages
                </h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-40 overflow-y-auto">
                {(m.recentActivity || []).length === 0 ? (
                  <p className="p-4 text-xs text-gray-400 dark:text-slate-500 text-center italic">Aucune activité</p>
                ) : (
                  m.recentActivity.slice(0, 5).map((act: any) => (
                    <div key={act.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <StatusDot status={act.checkOut ? 'REMOTE' : 'PRESENT'} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{act.text}</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500">{act.subText}</p>
                      </div>
                      <p className="text-[10px] font-mono text-cyan-600 dark:text-cyan-500 shrink-0">
                        {act.time ? new Date(act.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── ESPACE PERSO — même style panneaux admin ── */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-sky-500/10 rounded-xl"><User size={16} className="text-sky-500" /></div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Mon espace personnel</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Congés */}
            <div onClick={() => router.push('/conges/nouveau')} className="group cursor-pointer bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl p-4 border border-gray-100 dark:border-white/5 transition-all hover:-translate-y-0.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-full bg-orange-500" />
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Congés en attente</p>
              <p className="text-2xl font-extrabold text-orange-500">{myStats.pendingLeaves || 0}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 flex items-center gap-1"><ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />Demander congé</p>
            </div>
            {/* Salaire */}
            <div onClick={() => setShowSalary(!showSalary)} className="cursor-pointer bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl p-4 border border-gray-100 dark:border-white/5 transition-all hover:-translate-y-0.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-full bg-emerald-500" />
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Dernier salaire</p>
              {showSalary
                ? <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 truncate">{myStats.lastSalary || '—'}</p>
                : <p className="text-xl font-extrabold text-gray-300 dark:text-slate-600 tracking-widest">••••••</p>
              }
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">{myStats.lastSalaryMonth || '—'}</p>
            </div>
            {/* Pointage */}
            <div onClick={() => router.push('/presences/pointage')} className="cursor-pointer bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl p-4 border border-gray-100 dark:border-white/5 transition-all hover:-translate-y-0.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-full bg-sky-500" />
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Mon pointage</p>
              {myStats.checkIn ? (
                <>
                  <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{myStats.checkOut ? '✓ Journée finie' : '⏳ En cours'}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                    Entrée {new Date(myStats.checkIn).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </>
              ) : (
                <p className="text-sm font-bold text-gray-400 dark:text-slate-500">Non pointé</p>
              )}
            </div>
            {/* Actions */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">Actions rapides</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => router.push('/conges/nouveau')}
                  className="w-full text-[11px] bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 px-2 py-1.5 rounded-lg font-bold transition-colors border border-sky-500/20 text-left flex items-center gap-1.5">
                  <Calendar size={12} /> + Congé
                </button>
                <button onClick={() => router.push('/presences/pointage-manuel')}
                  className="w-full text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1.5 rounded-lg font-bold transition-colors border border-emerald-500/20 text-left flex items-center gap-1.5">
                  <Fingerprint size={12} /> Pointer équipe
                </button>
              </div>
            </div>
          </div>
        </motion.div>

      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // 👤 VUE EMPLOYEE (inchangée)
  // ══════════════════════════════════════════════════════════════
  if (userRole === 'EMPLOYEE') {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mon Espace</h2>
          <p className="text-gray-500 dark:text-slate-400">Bienvenue, voici votre résumé personnel.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div variants={itemVariants}>
            <StatCard label="Congés Posés" value={myStats.pendingLeaves?.toString() || '0'} trend="En attente" isPositive={true} icon={Calendar} gradientFrom="from-orange-400" gradientTo="to-red-500" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard label="Solde Congés" value={`${myStats.remainingLeaves || '0'} j`} trend="Disponibles" isPositive={true} icon={Clock} gradientFrom="from-emerald-400" gradientTo="to-teal-600" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard label="Dernier Salaire" value={myStats.lastSalary || '0 F'} trend={myStats.lastSalaryMonth || '-'} isPositive={true} icon={Wallet} gradientFrom="from-blue-500" gradientTo="to-indigo-600" isPrivate={true} showValue={showSalary} onToggleVisibility={() => setShowSalary(!showSalary)} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-6 border border-gray-200 dark:border-white/5 h-full flex flex-col justify-center items-center text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-xl" onClick={() => router.push('/presences/pointage')}>
              {myStats.checkIn && myStats.checkOut ? (
                <><div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-sky-500/20 text-sky-500"><Fingerprint size={24} /></div><h4 className="text-gray-900 dark:text-white font-bold">Journée terminée</h4><p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Depuis {new Date(myStats.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></>
              ) : myStats.checkIn ? (
                <><div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-emerald-500/20 text-emerald-500"><Fingerprint size={24} /></div><h4 className="text-gray-900 dark:text-white font-bold">Pointé</h4><p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Depuis {new Date(myStats.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></>
              ) : (
                <><div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-slate-200 dark:bg-slate-700/50 text-slate-400"><Fingerprint size={24} /></div><h4 className="text-gray-900 dark:text-white font-bold">Non pointé</h4><p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Pointer maintenant</p></>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Mes Actions Rapides</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Demander congé', icon: Calendar, color: 'text-sky-500', path: '/conges/nouveau' },
                { label: 'Mes bulletins',  icon: Wallet,   color: 'text-emerald-500', path: '/ma-paie' },
                { label: 'Formation',      icon: PlayCircle, color: 'text-purple-500', path: '/formation' },
                { label: 'Pointer',        icon: Fingerprint, color: 'text-orange-500', path: '/presences/pointage' },
              ].map(item => (
                <button key={item.label} onClick={() => router.push(item.path)} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 text-left transition-colors group">
                  <item.icon className={`${item.color} mb-3 group-hover:scale-110 transition-transform`} size={24} />
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{item.label}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // 🔑 VUE ADMIN / HR (inchangée)
  // ══════════════════════════════════════════════════════════════
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants}><StatCard label="Total Employés" value={stats.totalEmployees?.toString() || '0'} trend="Actif" isPositive={true} icon={Users} gradientFrom="from-cyan-500" gradientTo="to-blue-600" /></motion.div>
        <motion.div variants={itemVariants}><StatCard label="Masse Salariale" value={formatCurrency(stats.masseSalariale)} trend="Mensuel" isPositive={true} icon={Wallet} gradientFrom="from-emerald-400" gradientTo="to-teal-600" /></motion.div>
        <motion.div variants={itemVariants}><StatCard label="Congés en attente" value={stats.pendingLeaves?.toString() || '0'} trend="À traiter" isPositive={stats.pendingLeaves === 0} icon={Calendar} gradientFrom="from-orange-400" gradientTo="to-red-500" /></motion.div>
        <motion.div variants={itemVariants}><StatCard label="Taux Présence" value={`${stats.attendanceRate || 0}%`} trend={`${stats.absentToday || 0} absents`} isPositive={stats.attendanceRate > 90} icon={Clock} gradientFrom="from-violet-500" gradientTo="to-purple-600" /></motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Ajouter Employé', icon: UserPlus, color: 'bg-cyan-500',    action: '/employes/nouveau' },
              { label: 'Créer Paie',      icon: Wallet,   color: 'bg-emerald-500', action: '/paie/nouveau' },
              { label: 'Gérer Congés',    icon: Calendar, color: 'bg-orange-500',  action: '/conges' },
              { label: 'Rapports',        icon: BarChart, color: 'bg-violet-500',  action: '/rapports' },
            ].map((item, i) => (
              <div key={i} onClick={() => router.push(item.action)} className="group cursor-pointer bg-white dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all hover:-translate-y-1 relative overflow-hidden shadow-sm">
                <div className={`absolute top-0 right-0 w-20 h-20 opacity-10 rounded-bl-full ${item.color}`}></div>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${item.color} text-white shadow-lg`}><item.icon size={24} /></div>
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
              {stats.recentPayrolls?.length > 0 ? stats.recentPayrolls.map((payroll: any) => (
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
              )) : <p className="text-sm text-gray-500 dark:text-slate-500 italic">Aucun bulletin récent</p>}
            </div>
            <button onClick={() => router.push('/paie')} className="w-full mt-4 py-2 text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-dashed border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5">
              Voir tout l'historique
            </button>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Répartition</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Effectifs par département</p>
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
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{stats.totalEmployees}</span>
                  <span className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-widest">Total</span>
                </div>
              </div>
            );
          })()}
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
                  <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15}/><stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorMasse"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} formatter={(value: any) => value.toLocaleString() + ' F'} />
                <Area type="monotone" dataKey="masseSalariale" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMasse)" name="Masse Salariale" />
                <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorSalary)" name="Salaire Net" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500 animate-pulse"><Radio size={18} /></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">En direct (36h)</h3>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto max-h-[400px] pr-2">
            {stats.recentActivities?.length > 0 ? stats.recentActivities.map((act: any, i: number) => {
              let icon  = <CheckCircle size={16} />;
              let color = 'bg-gray-100 text-gray-500';
              if (act.type === 'LEAVE')      { icon = <Calendar size={16} />; color = 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'; }
              if (act.type === 'HIRE')       { icon = <User size={16} />;     color = 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'; }
              if (act.type === 'ATTENDANCE') { icon = <Clock size={16} />;    color = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'; }
              return (
                <div key={act.id} className="flex gap-4 relative">
                  {i !== stats.recentActivities.length - 1 && <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-gray-800"></div>}
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{act.text}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{act.subText}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-mono">{new Date(act.time).toLocaleString()}</p>
                  </div>
                </div>
              );
            }) : (
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