
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, Download, Filter, Search, ChevronDown, ChevronUp, 
  CheckCircle2, AlertTriangle, Printer, Mail, Lock, ArrowRight,
  Calendar, Clock, Users, TrendingUp, MoreHorizontal, Loader2,
  FileSpreadsheet, ArrowUpRight, ArrowDownRight, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

// --- Types ---

interface AttendanceSummary {
  id: string;
  employeeId: string;
  name: string;
  matricule: string;
  avatar: string;
  department: string;
  daysPresent: number;
  daysAbsent: number;
  lates: number;
  normalHours: number;
  overtime15: number;
  overtime50: number;
  totalHours: number;
  status: 'perfect' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  details: { date: string; in: string; out: string; total: number; type: string }[];
}

export default function AttendanceResumePage() {
  const router = useRouter();
  
  // -- State --
  const [month, setMonth] = useState('11'); // Novembre
  const [year, setYear] = useState(2024);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState<AttendanceSummary[] | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filter, setFilter] = useState('All'); 
  const [isValidated, setIsValidated] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // -- Handlers --

  const generateReport = async () => {
    setIsGenerating(true);
    setProgress(10);
    setData(null);

    // Simulation de progression visuelle pour l'UX
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + Math.random() * 20;
      });
    }, 200);

    try {
        const reportData = await api.get<AttendanceSummary[]>(`/attendance/report?month=${month}&year=${year}`);
        setProgress(100);
        setTimeout(() => {
            clearInterval(interval);
            setIsGenerating(false);
            setData(reportData);
        }, 500);
    } catch (e) {
        clearInterval(interval);
        setIsGenerating(false);
        alert("Erreur lors de la génération du rapport");
    }
  };

  const handleSendToPayroll = () => {
    router.push('/paie/nouveau');
  };

  // -- Derived Data --

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(d => {
      if (filter === 'All') return true;
      return d.status === filter.toLowerCase();
    });
  }, [data, filter]);

  // -- Render Helpers --

  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      perfect: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'OK' },
      warning: { color: 'bg-orange-100 text-orange-700', icon: Clock, label: 'À vérifier' },
      critical: { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Anomalie' },
    };
    const { color, icon: Icon, label } = config[status as keyof typeof config] || config.perfect;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
        <Icon size={12} /> {label}
      </span>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-24 space-y-8">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <Link href="/presences" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                 <ArrowRight className="rotate-180 text-gray-500" size={20} />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Résumés de Présences</h1>
           </div>
           <p className="text-gray-500 dark:text-gray-400 ml-11">Consolidez et exportez les heures pour la paie.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
           <div className="flex items-center gap-2 px-2">
              <Calendar size={18} className="text-gray-400" />
              <select 
                 value={month} 
                 onChange={e => setMonth(e.target.value)} 
                 className="bg-transparent font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                 <option value="10">Octobre</option>
                 <option value="11">Novembre</option>
                 <option value="12">Décembre</option>
              </select>
              <select 
                 value={year} 
                 onChange={e => setYear(Number(e.target.value))} 
                 className="bg-transparent font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                 <option>2024</option><option>2025</option>
              </select>
           </div>
           
           <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

           <button 
              onClick={generateReport}
              disabled={isGenerating || isValidated}
              className={`
                 px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2
                 ${isValidated 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:scale-105 active:scale-95'}
              `}
           >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
              {isGenerating ? 'Calcul...' : isValidated ? 'Validé' : 'Générer Résumé'}
           </button>
        </div>
      </div>

      {/* LOADING STATE */}
      <AnimatePresence>
         {isGenerating && (
            <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               exit={{ opacity: 0, height: 0 }}
               className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700 shadow-sm"
            >
               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Traitement des pointages en cours...</h3>
               <p className="text-gray-500 dark:text-gray-400 mb-6">Calcul des heures supplémentaires et vérification des anomalies.</p>
               <div className="max-w-md mx-auto h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                     className="h-full bg-emerald-500 rounded-full"
                     initial={{ width: 0 }}
                     animate={{ width: `${progress}%` }}
                  />
               </div>
               <p className="mt-2 text-sm font-mono text-emerald-600 dark:text-emerald-400">{Math.round(progress)}%</p>
            </motion.div>
         )}
      </AnimatePresence>

      {/* REPORT CONTENT */}
      {data && !isGenerating && (
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
         >
            {/* OVERVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                  <div>
                     <p className="text-xs font-bold text-gray-500 uppercase mb-1">Employés Traités</p>
                     <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.length}</h3>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center">
                     <Users size={24} />
                  </div>
               </div>
               {/* Autres stats mockées pour l'exemple visuel */}
               <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                  <div>
                     <p className="text-xs font-bold text-gray-500 uppercase mb-1">Heures Totales</p>
                     <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.reduce((acc, curr) => acc + curr.totalHours, 0).toLocaleString()} <span className="text-sm text-gray-400">h</span></h3>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl flex items-center justify-center">
                     <Clock size={24} />
                  </div>
               </div>
            </div>

            {/* MAIN TABLE */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 font-semibold uppercase text-xs">
                        <tr>
                           <th className="px-6 py-3">Employé</th>
                           <th className="px-6 py-3 text-center">Jours Prés.</th>
                           <th className="px-6 py-3 text-center">Retards</th>
                           <th className="px-6 py-3 text-right">Heures Norm.</th>
                           <th className="px-6 py-3 text-right text-sky-600">HS 15%</th>
                           <th className="px-6 py-3 text-right text-purple-600">HS 50%</th>
                           <th className="px-6 py-3 text-center">Statut</th>
                           <th className="px-6 py-3 w-10"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredData.map(row => (
                           <React.Fragment key={row.id}>
                              <tr 
                                 onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                                 className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${expandedRow === row.id ? 'bg-sky-50/50 dark:bg-sky-900/10' : ''}`}
                              >
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                       <img src={row.avatar || `https://ui-avatars.com/api/?name=${row.name}&background=random`} className="w-8 h-8 rounded-full" />
                                       <div>
                                          <p className="font-bold text-gray-900 dark:text-white">{row.name}</p>
                                          <p className="text-xs text-gray-500">{row.matricule}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 text-center font-medium">{row.daysPresent}</td>
                                 <td className={`px-6 py-4 text-center font-bold ${row.lates > 2 ? 'text-orange-500' : 'text-gray-400'}`}>{row.lates}</td>
                                 <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-gray-400">{row.normalHours}</td>
                                 <td className="px-6 py-4 text-right font-mono font-bold text-sky-600 dark:text-sky-400">{row.overtime15 > 0 ? row.overtime15 : '-'}</td>
                                 <td className="px-6 py-4 text-right font-mono font-bold text-purple-600 dark:text-purple-400">{row.overtime50 > 0 ? row.overtime50 : '-'}</td>
                                 <td className="px-6 py-4 text-center"><StatusBadge status={row.status} /></td>
                                 <td className="px-6 py-4 text-gray-400">{expandedRow === row.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td>
                              </tr>
                              
                              {/* EXPANDED DETAILS */}
                              {expandedRow === row.id && (
                                 <tr className="bg-gray-50 dark:bg-gray-800/50">
                                    <td colSpan={8} className="p-0">
                                       <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-6 border-b border-gray-100 dark:border-gray-700">
                                          <table className="w-full text-xs text-left">
                                             <thead className="text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-600">
                                                <tr>
                                                   <th className="py-2">Date</th>
                                                   <th className="py-2">Entrée</th>
                                                   <th className="py-2">Sortie</th>
                                                   <th className="py-2">Total</th>
                                                   <th className="py-2">Type</th>
                                                </tr>
                                             </thead>
                                             <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {row.details.map((det, i) => (
                                                   <tr key={i}>
                                                      <td className="py-2 font-mono">{det.date}</td>
                                                      <td className="py-2">{det.in}</td>
                                                      <td className="py-2">{det.out}</td>
                                                      <td className="py-2 font-bold">{det.total}h</td>
                                                      <td className="py-2"><span className="bg-white dark:bg-gray-700 border px-1.5 py-0.5 rounded text-[10px]">{det.type}</span></td>
                                                   </tr>
                                                ))}
                                             </tbody>
                                          </table>
                                       </motion.div>
                                    </td>
                                 </tr>
                              )}
                           </React.Fragment>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* BOTTOM ACTIONS */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 sticky bottom-6 z-20">
               <div className="flex gap-3">
                  <button className="px-5 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-bold rounded-xl transition-colors flex items-center gap-2">
                     <Download size={18} /> Exporter
                  </button>
               </div>

               <div className="flex items-center gap-4 w-full md:w-auto">
                  {!isValidated ? (
                     <button onClick={() => setIsValidated(true)} className="flex-1 md:flex-none px-6 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                        <CheckCircle2 size={18} /> Valider ce Résumé
                     </button>
                  ) : (
                     <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm px-4 bg-emerald-50 dark:bg-emerald-900/20 py-3 rounded-xl border border-emerald-100 dark:border-emerald-800">
                        <Lock size={16} /> Validé
                     </div>
                  )}

                  <button onClick={handleSendToPayroll} disabled={!isValidated} className="flex-1 md:flex-none px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                     Envoyer à la Paie <ArrowRight size={18} />
                  </button>
               </div>
            </div>

         </motion.div>
      )}

    </div>
  );
}
