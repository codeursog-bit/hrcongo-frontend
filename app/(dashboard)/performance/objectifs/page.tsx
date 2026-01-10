
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Target, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Flag, Loader2, Save, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';

export default function ObjectivesPage() {
  const [objectives, setObjectives] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]); // Pour l'assignation
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    employeeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    targetValue: 100,
    unit: '%'
  });

  useEffect(() => {
    const init = async () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
            
            try {
                // 1. Charger les objectifs
                const goalsData = await api.get<any[]>('/performance/goals');
                setObjectives(goalsData);

                // 2. Si Manager/RH/Admin, charger la liste des employés pour assignation
                if (['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(user.role)) {
                    const empData = await api.get<any[]>('/employees');
                    setEmployees(empData);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
    };
    init();
  }, []);

  const handleCreate = async () => {
      if (!newGoal.title || !newGoal.employeeId) return;
      setIsSubmitting(true);
      try {
          // Création simplifiée d'un objectif avec un résultat clé par défaut
          const payload = {
              ...newGoal,
              keyResults: [
                  { title: "Objectif Principal", target: newGoal.targetValue, unit: newGoal.unit, current: 0 }
              ]
          };
          
          await api.post('/performance/goals', payload);
          setShowModal(false);
          
          // Refresh
          const updated = await api.get<any[]>('/performance/goals');
          setObjectives(updated);
          
          // Reset form
          setNewGoal({ title: '', description: '', employeeId: '', startDate: '', endDate: '', targetValue: 100, unit: '%' });
      } catch (e) {
          alert("Erreur lors de la création");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleProgressUpdate = async (goalId: string, currentProgress: number) => {
      // Simulation d'update visuel (idéalement un endpoint PATCH /goals/:id/progress)
      setObjectives(prev => prev.map(o => o.id === goalId ? { ...o, progress: Math.min(100, currentProgress + 10) } : o));
  };

  const canCreate = currentUser && ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(currentUser.role);

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <Link href="/performance" className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><ArrowLeft size={20}/></Link>
           <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Objectifs (OKR)</h1>
              <p className="text-gray-500 dark:text-gray-400">Alignement stratégique et suivi.</p>
           </div>
        </div>
        
        {canCreate && (
            <button 
                onClick={() => setShowModal(true)}
                className="px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2"
            >
                <Plus size={20} /> Nouvel Objectif
            </button>
        )}
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={48}/></div> : (
      <div className="space-y-6">
         {objectives.map((obj) => (
            <motion.div 
                key={obj.id} 
                layoutId={obj.id}
                className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
               <div className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center gap-6" onClick={() => setExpandedId(expandedId === obj.id ? null : obj.id)}>
                  
                  {/* Avatar & Info */}
                  <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                          {obj.progress}%
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{obj.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1"><User size={12}/> {obj.employee?.firstName} {obj.employee?.lastName}</span>
                              <span>•</span>
                              <span className="text-gray-400">Échéance : {new Date(obj.endDate).toLocaleDateString()}</span>
                          </div>
                      </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-4">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold border ${obj.progress >= 100 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-sky-100 text-sky-700 border-sky-200'}`}>
                        {obj.progress >= 100 ? 'Atteint' : 'En cours'}
                     </span>
                     {expandedId === obj.id ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
                  </div>
               </div>
               
               <AnimatePresence>
                  {expandedId === obj.id && (
                     <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-black/20 p-6"
                     >
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">{obj.description}</p>
                        </div>

                        <h4 className="text-xs font-bold uppercase mb-4 text-gray-400 tracking-wider">Résultats Clés (KRs)</h4>
                        <div className="space-y-6">
                           {obj.keyResults.map((kr: any) => (
                              <div key={kr.id}>
                                 <div className="flex justify-between mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                                    <span>{kr.title}</span>
                                    <span>{kr.current} / {kr.target} {kr.unit}</span>
                                 </div>
                                 <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                                    <motion.div 
                                        className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full" 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(kr.current / kr.target) * 100}%` }}
                                    ></motion.div>
                                 </div>
                                 
                                 {/* Action Update pour l'employé ou manager */}
                                 <div className="mt-2 flex justify-end">
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); handleProgressUpdate(obj.id, obj.progress); }}
                                        className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                                     >
                                        + Mettre à jour progression
                                     </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>
            </motion.div>
         ))}
         
         {objectives.length === 0 && (
             <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                 <Target size={48} className="mx-auto text-gray-300 mb-4" />
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">Aucun objectif défini</h3>
                 <p className="text-gray-500 text-sm mb-6">Commencez par fixer des objectifs clairs pour vos équipes.</p>
                 {canCreate && (
                    <button onClick={() => setShowModal(true)} className="text-sky-500 font-bold hover:underline">Créer le premier objectif</button>
                 )}
             </div>
         )}
      </div>
      )}

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showModal && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-sky-100 dark:bg-sky-900/30 text-sky-600 rounded-xl">
                                <Target size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nouvel Objectif</h2>
                        </div>
                        <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500"><X size={20} /></button>
                    </div>

                    <div className="space-y-4">
                        {/* Assignation */}
                        <div>
                            <FancySelect 
                                label="Assigné à"
                                value={newGoal.employeeId}
                                onChange={(v) => setNewGoal({...newGoal, employeeId: v})}
                                icon={User}
                                options={employees.map(e => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))}
                                placeholder="Choisir un collaborateur..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Titre de l'objectif</label>
                            <input 
                                value={newGoal.title}
                                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"
                                placeholder="Ex: Augmenter le CA de 15%"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Cible</label>
                                <input 
                                    type="number"
                                    value={newGoal.targetValue}
                                    onChange={(e) => setNewGoal({...newGoal, targetValue: Number(e.target.value)})}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Unité</label>
                                <select 
                                    value={newGoal.unit}
                                    onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none appearance-none"
                                >
                                    <option value="%">%</option>
                                    <option value="FCFA">FCFA</option>
                                    <option value="Dossiers">Dossiers</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Début</label>
                                <input 
                                    type="date"
                                    value={newGoal.startDate}
                                    onChange={(e) => setNewGoal({...newGoal, startDate: e.target.value})}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Fin</label>
                                <input 
                                    type="date"
                                    value={newGoal.endDate}
                                    onChange={(e) => setNewGoal({...newGoal, endDate: e.target.value})}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Description (Optionnel)</label>
                            <textarea 
                                value={newGoal.description}
                                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none h-24 resize-none"
                                placeholder="Détails supplémentaires..."
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
                        <button onClick={handleCreate} disabled={isSubmitting} className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} />} Créer
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
