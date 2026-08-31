
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Flag, CheckSquare, UserPlus, UserMinus, Calendar, 
  ChevronRight, MoreHorizontal, Mail, Laptop, BadgeCheck, 
  Briefcase, CheckCircle2, Circle, Clock, Filter, Search,
  Plus, Check, Loader2, X, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';

// --- Types ---

type ProcessType = 'ONBOARDING' | 'OFFBOARDING';

interface OnboardingTask {
  id: string;
  title: string;
  assigneeRole: string;
  isCompleted: boolean;
  completedAt?: string;
}

interface Process {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
    position: string;
    department: { name: string };
    photoUrl?: string;
  };
  type: ProcessType;
  startDate: string;
  tasks: OnboardingTask[];
}

const DEFAULT_TASKS_ONBOARDING = [
    { title: "Préparer le contrat de travail", assigneeRole: "RH" },
    { title: "Configurer l'adresse email", assigneeRole: "IT" },
    { title: "Préparer le poste de travail", assigneeRole: "IT" },
    { title: "Badge et accès locaux", assigneeRole: "OFFICE_MGR" },
    { title: "Session d'accueil RH", assigneeRole: "RH" },
    { title: "Présentation à l'équipe", assigneeRole: "MANAGER" }
];

const DEFAULT_TASKS_OFFBOARDING = [
    { title: "Lettre de démission / Licenciement", assigneeRole: "RH" },
    { title: "Solde de tout compte", assigneeRole: "RH" },
    { title: "Restitution Matériel (PC, Badge...)", assigneeRole: "IT" },
    { title: "Entretien de départ", assigneeRole: "RH" },
    { title: "Désactivation des accès", assigneeRole: "IT" }
];

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState<ProcessType>('ONBOARDING');
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProcess, setNewProcess] = useState({
      employeeId: '',
      startDate: new Date().toISOString().split('T')[0]
  });

  const fetchProcesses = async () => {
    try {
        const data = await api.get<Process[]>('/onboarding');
        setProcesses(data);
        if (data.length > 0 && !selectedProcess) setSelectedProcess(data[0].id);
    } catch (e) {
        console.error("Failed to load onboarding", e);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    // Charger la liste des employés pour la sélection
    api.get<any[]>('/employees').then(setEmployees);
  }, []);

  // --- Handlers ---

  const handleCreateProcess = async () => {
      if (!newProcess.employeeId) return;
      setIsCreating(true);
      try {
          // On génère automatiquement les tâches selon le type actif (Onglet)
          const tasks = activeTab === 'ONBOARDING' ? DEFAULT_TASKS_ONBOARDING : DEFAULT_TASKS_OFFBOARDING;
          
          await api.post('/onboarding', {
              employeeId: newProcess.employeeId,
              type: activeTab,
              startDate: newProcess.startDate,
              tasks: tasks
          });
          
          setShowModal(false);
          setNewProcess({ employeeId: '', startDate: new Date().toISOString().split('T')[0] });
          await fetchProcesses(); // Refresh
      } catch (e) {
          alert("Erreur lors de la création du processus");
      } finally {
          setIsCreating(false);
      }
  };

  const toggleTask = async (processId: string, taskId: string) => {
    try {
        await api.patch(`/onboarding/tasks/${taskId}/complete`, {});
        
        setProcesses(prev => prev.map(p => {
            if (p.id !== processId) return p;
            return {
                ...p,
                tasks: p.tasks.map(t => 
                    t.id === taskId ? { ...t, isCompleted: true, completedAt: new Date().toISOString() } : t
                )
            };
        }));
    } catch (e) {
        console.error("Failed to update task", e);
    }
  };

  const filteredProcesses = processes.filter(p => p.type === activeTab);
  const selectedData = processes.find(p => p.id === selectedProcess);

  const calculateProgress = (tasks: OnboardingTask[]) => {
      if (tasks.length === 0) return 0;
      const completed = tasks.filter(t => t.isCompleted).length;
      return Math.round((completed / tasks.length) * 100);
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl text-white shadow-lg">
              <Flag size={24} />
           </div>
           <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Onboarding & Offboarding</h1>
              <p className="text-gray-500 dark:text-gray-400">Gérez les arrivées et départs collaborateurs.</p>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center shadow-sm">
              <button 
                onClick={() => { setActiveTab('ONBOARDING'); setSelectedProcess(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ONBOARDING' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <UserPlus size={16} /> Arrivées
              </button>
              <button 
                onClick={() => { setActiveTab('OFFBOARDING'); setSelectedProcess(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'OFFBOARDING' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <UserMinus size={16} /> Départs
              </button>
           </div>
           <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold shadow-lg transition-all flex items-center gap-2"
           >
              <Plus size={20} /> Nouveau
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-250px)]">
         
         {/* LEFT LIST */}
         <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                     type="text" 
                     placeholder="Rechercher..."
                     className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20"
                  />
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
               {isLoading ? (
                   <div className="flex justify-center p-10"><Loader2 className="animate-spin text-teal-500"/></div>
               ) : filteredProcesses.length === 0 ? (
                   <div className="text-center p-10 text-gray-400 text-sm">Aucun processus en cours.</div>
               ) : (
                   filteredProcesses.map(process => {
                      const progress = calculateProgress(process.tasks);
                      return (
                      <div 
                         key={process.id}
                         onClick={() => setSelectedProcess(process.id)}
                         className={`
                            p-4 rounded-xl cursor-pointer border transition-all hover:shadow-md
                            ${selectedProcess === process.id 
                               ? 'bg-teal-50 dark:bg-teal-900/10 border-teal-500 ring-1 ring-teal-500' 
                               : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'}
                         `}
                      >
                         <div className="flex items-center gap-3 mb-3">
                            <img src={process.employee.photoUrl || `https://ui-avatars.com/api/?name=${process.employee.firstName}+${process.employee.lastName}&background=random`} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600" />
                            <div className="min-w-0">
                               <h4 className="font-bold text-gray-900 dark:text-white truncate">{process.employee.firstName} {process.employee.lastName}</h4>
                               <p className="text-xs text-gray-500 truncate">{process.employee.position}</p>
                            </div>
                         </div>
                         
                         <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-500">
                               <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(process.startDate).toLocaleDateString()}</span>
                               <span className="font-bold text-teal-600">{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                               <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                         </div>
                      </div>
                   )})
               )}
            </div>
         </div>

         {/* RIGHT DETAILS */}
         <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden">
            {selectedData ? (
               <>
                  {/* Detail Header */}
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-start">
                     <div className="flex items-center gap-4">
                        <img src={selectedData.employee.photoUrl || `https://ui-avatars.com/api/?name=${selectedData.employee.firstName}+${selectedData.employee.lastName}&background=random`} className="w-16 h-16 rounded-2xl shadow-sm" />
                        <div>
                           <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedData.employee.firstName} {selectedData.employee.lastName}</h2>
                           <p className="text-gray-500 dark:text-gray-400 font-medium">{selectedData.employee.position} • {selectedData.employee.department?.name}</p>
                           <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-xs font-bold text-gray-600 dark:text-gray-300">
                                 {selectedData.type}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                 <Clock size={12} /> Début: {new Date(selectedData.startDate).toLocaleDateString()}
                              </span>
                           </div>
                        </div>
                     </div>
                     
                     <div className="text-right">
                        <div className="text-3xl font-bold text-teal-600">{calculateProgress(selectedData.tasks)}%</div>
                        <p className="text-xs text-gray-400">Complété</p>
                     </div>
                  </div>

                  {/* Tasks List */}
                  <div className="flex-1 overflow-y-auto p-6">
                     <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CheckSquare size={20} className="text-teal-500" /> Checklist
                     </h3>
                     <div className="space-y-3">
                        {selectedData.tasks.map((task) => (
                           <div 
                              key={task.id}
                              onClick={() => !task.isCompleted && toggleTask(selectedData.id, task.id)}
                              className={`
                                 flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group
                                 ${task.isCompleted 
                                    ? 'bg-gray-50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800 opacity-70' 
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-teal-400 dark:hover:border-teal-500 shadow-sm'}
                              `}
                           >
                              <div className={`
                                 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                 ${task.isCompleted ? 'bg-teal-500 border-teal-500' : 'border-gray-300 dark:border-gray-500 group-hover:border-teal-400'}
                              `}>
                                 {task.isCompleted && <Check size={14} className="text-white" />}
                              </div>
                              
                              <div className="flex-1">
                                 <p className={`font-bold text-sm ${task.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                                    {task.title}
                                 </p>
                              </div>

                              <div className="flex items-center gap-2">
                                 <span className={`text-xs px-2 py-1 rounded-lg font-medium border border-gray-200 dark:border-gray-600`}>
                                    {task.assigneeRole}
                                 </span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </>
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                     <Briefcase size={40} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sélectionnez un dossier</h3>
                  <p className="text-gray-500">Cliquez sur un employé à gauche pour voir sa checklist.</p>
               </div>
            )}
         </div>

      </div>

      {/* MODAL CREATION */}
      <AnimatePresence>
        {showModal && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Nouveau {activeTab === 'ONBOARDING' ? 'Onboarding' : 'Offboarding'}
                        </h3>
                        <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={20}/></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <FancySelect 
                                label="Employé concerné"
                                value={newProcess.employeeId}
                                onChange={(v) => setNewProcess({...newProcess, employeeId: v})}
                                icon={User}
                                options={employees.map(e => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))}
                                placeholder="Choisir un employé..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Date de début</label>
                            <input type="date" value={newProcess.startDate} onChange={e => setNewProcess({...newProcess, startDate: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl outline-none" />
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                            Une liste de tâches standard sera générée automatiquement pour ce dossier.
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-750">Annuler</button>
                        <button onClick={handleCreateProcess} disabled={isCreating || !newProcess.employeeId} className="flex-1 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold flex justify-center gap-2">
                            {isCreating && <Loader2 className="animate-spin" size={20} />} Créer
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
