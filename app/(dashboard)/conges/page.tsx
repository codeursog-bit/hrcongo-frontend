
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, Check, X, Clock, Users, ArrowRight, UserCircle, 
  Loader2, AlertCircle, FileText, Filter, CheckCircle2, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { api } from '@/services/api';

type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type LeaveType = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'SPECIAL';

interface LeaveRequest {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
    photoUrl?: string;
    position: string;
    department?: { name: string };
  };
  type: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason?: string;
  status: LeaveStatus;
  createdAt: string;
}

const LEAVE_TYPES_CONFIG: Record<LeaveType, { label: string, color: string, bg: string }> = {
  ANNUAL: { label: 'Congés Annuels', color: 'text-sky-600', bg: 'bg-sky-100 dark:bg-sky-900/30' },
  SICK: { label: 'Maladie', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  MATERNITY: { label: 'Maternité', color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  PATERNITY: { label: 'Paternité', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  UNPAID: { label: 'Sans Solde', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-700' },
  SPECIAL: { label: 'Spécial', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
};

export default function LeaveManagementPage() {
  const [activeTab, setActiveTab] = useState<'ACTION' | 'HISTORY'>('ACTION');
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalData, setModalData] = useState<{ type: 'approve' | 'reject', leave: LeaveRequest } | null>(null);

  const fetchLeaves = async () => {
    try {
        const data = await api.get<LeaveRequest[]>('/leaves');
        setLeaves(data);
    } catch (error) {
        console.error("Erreur chargement congés", error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const pendingLeaves = useMemo(() => leaves.filter(l => l.status === 'PENDING'), [leaves]);
  const historyLeaves = useMemo(() => leaves.filter(l => l.status !== 'PENDING'), [leaves]);

  const confirmAction = async () => {
    if (!modalData) return;
    try {
        const status = modalData.type === 'approve' ? 'APPROVED' : 'REJECTED';
        await api.patch(`/leaves/${modalData.leave.id}/status`, { status });
        
        // Optimistic update : On met à jour l'interface immédiatement sans recharger
        setLeaves(prev => prev.map(l => 
            l.id === modalData.leave.id ? { ...l, status } : l
        ));
    } catch (e) {
        alert("Erreur lors de la mise à jour");
    } finally {
        setModalData(null);
    }
  };

  if (isLoading) return <GlobalLoader />;

  return (
    <div className="max-w-[1600px] mx-auto pb-24 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Gestion des Congés</h1>
          <p className="text-gray-500 dark:text-gray-400">Cockpit RH : Validez les demandes et surveillez le planning.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/conges/mon-espace" className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <UserCircle size={20} /> Mon Espace Perso
          </Link>
          <Link href="/conges/calendrier" className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg">
            <Calendar size={20} /> Voir le Planning
          </Link>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b border-gray-200 dark:border-gray-800">
         <button 
            onClick={() => setActiveTab('ACTION')}
            className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'ACTION' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
         >
            <AlertCircle size={18} /> À Traiter 
            {pendingLeaves.length > 0 && <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">{pendingLeaves.length}</span>}
         </button>
         <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'HISTORY' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
         >
            <FileText size={18} /> Historique Global
         </button>
      </div>

      {/* CONTENT */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: ACTIONS (PENDING) */}
        {activeTab === 'ACTION' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                {pendingLeaves.length === 0 ? (
                    <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={48} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tout est à jour !</h3>
                        <p className="text-gray-500">Aucune demande en attente. Profitez de votre café ☕</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {pendingLeaves.map(leave => {
                            const typeConf = LEAVE_TYPES_CONFIG[leave.type];
                            return (
                                <motion.div 
                                    key={leave.id} 
                                    layoutId={leave.id}
                                    className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg shadow-gray-200/50 dark:shadow-none flex flex-col sm:flex-row gap-6 relative overflow-hidden group"
                                >
                                    {/* Barre latérale de couleur selon le type */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${typeConf.bg.replace('bg-', 'bg-').split(' ')[0].replace('/30', '')} dark:${typeConf.bg.replace('bg-', 'bg-').split(' ')[2]}`}></div>

                                    {/* Left Info */}
                                    <div className="flex-1 pl-4">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 text-lg shadow-sm">
                                                {leave.employee.firstName[0]}{leave.employee.lastName[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{leave.employee.firstName} {leave.employee.lastName}</h3>
                                                <p className="text-sm text-gray-500">{leave.employee.position} • {leave.employee.department?.name}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3 mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${typeConf.bg} ${typeConf.color}`}>
                                                    {typeConf.label}
                                                </div>
                                                <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                    {leave.daysCount} jours
                                                </span>
                                            </div>
                                            
                                            <div className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-750 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                                <Calendar size={16} className="text-gray-400"/>
                                                {new Date(leave.startDate).toLocaleDateString()} 
                                                <ArrowRight size={14} className="text-gray-400"/>
                                                {new Date(leave.endDate).toLocaleDateString()}
                                            </div>
                                            
                                            {leave.reason && (
                                                <p className="text-sm text-gray-500 italic pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                                                    "{leave.reason}"
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Actions */}
                                    <div className="flex flex-col justify-center gap-3 min-w-[140px] border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-700 pt-4 sm:pt-0 sm:pl-6">
                                        <button 
                                            onClick={() => setModalData({ type: 'approve', leave })}
                                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex justify-center items-center gap-2 hover:scale-105 active:scale-95"
                                        >
                                            <Check size={18} /> Valider
                                        </button>
                                        <button 
                                            onClick={() => setModalData({ type: 'reject', leave })}
                                            className="w-full py-3 bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-200 hover:text-red-600 font-bold rounded-xl transition-all flex justify-center items-center gap-2 hover:border-red-200"
                                        >
                                            <X size={18} /> Refuser
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        )}

        {/* TAB 2: HISTORY (APPROVED/REJECTED) */}
        {activeTab === 'HISTORY' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs uppercase text-gray-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Employé</th>
                                <th className="px-6 py-4">Type & Durée</th>
                                <th className="px-6 py-4">Période</th>
                                <th className="px-6 py-4 text-center">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {historyLeaves.map(leave => (
                                <tr key={leave.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{leave.employee.firstName} {leave.employee.lastName}</div>
                                        <div className="text-xs text-gray-500">{leave.employee.department?.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded-full ${LEAVE_TYPES_CONFIG[leave.type].bg.split(' ')[0].replace('/30','')}`}></span>
                                            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">{LEAVE_TYPES_CONFIG[leave.type].label}</span>
                                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">{leave.daysCount}j</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {leave.status === 'APPROVED' && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200"><CheckCircle2 size={14}/> Validé</span>}
                                        {leave.status === 'REJECTED' && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-full border border-red-200"><XCircle size={14}/> Refusé</span>}
                                        {leave.status === 'CANCELLED' && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">Annulé</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        )}

      </AnimatePresence>

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
         {modalData && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            >
               <motion.div 
                  initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden"
               >
                  <div className={`absolute top-0 left-0 w-full h-2 ${modalData.type === 'approve' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  
                  <div className="flex items-center gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${modalData.type === 'approve' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {modalData.type === 'approve' ? <Check size={28} /> : <X size={28} />}
                      </div>
                      <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {modalData.type === 'approve' ? 'Valider la demande' : 'Refuser la demande'}
                          </h3>
                          <p className="text-sm text-gray-500">Cette action est irréversible.</p>
                      </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-xl mb-8 text-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                      <p>Employé : <strong className="text-gray-900 dark:text-white">{modalData.leave.employee.firstName} {modalData.leave.employee.lastName}</strong></p>
                      <p>Période : Du {new Date(modalData.leave.startDate).toLocaleDateString()} au {new Date(modalData.leave.endDate).toLocaleDateString()}</p>
                      <p>Durée : <strong>{modalData.leave.daysCount} jours</strong></p>
                  </div>

                  <div className="flex gap-3">
                     <button onClick={() => setModalData(null)} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300">
                        Annuler
                     </button>
                     <button 
                        onClick={confirmAction}
                        className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-105 ${modalData.type === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
                     >
                        Confirmer
                     </button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}
