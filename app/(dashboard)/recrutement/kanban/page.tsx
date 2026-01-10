
// 'use client';

// import React, { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { ArrowLeft, Plus, MoreHorizontal, Filter, Loader2, Check, UserPlus, X } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';

// type ColumnId = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';

// interface Candidate {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   status: ColumnId;
//   jobOffer?: { title: string };
//   createdAt: string;
// }

// const COLUMNS: { id: ColumnId, title: string, color: string }[] = [
//   { id: 'APPLIED', title: 'Nouvelles', color: 'border-blue-500' },
//   { id: 'SCREENING', title: 'Qualifiés', color: 'border-purple-500' },
//   { id: 'INTERVIEW', title: 'Entretiens', color: 'border-orange-500' },
//   { id: 'OFFER', title: 'Offre', color: 'border-sky-500' },
//   { id: 'HIRED', title: 'Embauché', color: 'border-emerald-500' },
//   { id: 'REJECTED', title: 'Refusé', color: 'border-red-500' },
// ];

// export default function RecruitmentKanbanPage() {
//   const router = useRouter();
//   const [candidates, setCandidates] = useState<Candidate[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null); // Pour le menu contextuel

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const data = await api.get<Candidate[]>('/recruitment/candidates');
//       setCandidates(data);
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleStatusChange = async (candidateId: string, newStatus: ColumnId) => {
//       // Optimistic UI update
//       setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c));
//       setActiveCandidate(null);
      
//       try {
//           await api.patch(`/recruitment/candidates/${candidateId}/status`, { status: newStatus });
//       } catch (e) {
//           fetchData(); // Revert on error
//           alert("Erreur lors de la mise à jour");
//       }
//   };

//   const handleHire = async (candidateId: string) => {
//       if(!confirm("Confirmer l'embauche ? Cela créera automatiquement un dossier employé.")) return;
      
//       try {
//           const employee = await api.post<any>(`/recruitment/candidates/${candidateId}/hire`, {});
//           alert(`Employé ${employee.firstName} ${employee.lastName} créé avec succès !`);
//           router.push(`/employes/${employee.id}/edit`); // Rediriger vers l'édition pour compléter
//       } catch (e) {
//           alert("Erreur lors de la création du dossier employé.");
//       }
//   };

//   const getColumnData = (colId: ColumnId) => candidates.filter(c => c.status === colId);

//   return (
//     <div className="h-[calc(100vh-100px)] flex flex-col" onClick={() => setActiveCandidate(null)}>
//       <div className="flex items-center justify-between mb-6 px-4 md:px-0">
//         <div className="flex items-center gap-4">
//            <Link href="/recrutement" className="p-2 bg-white dark:bg-gray-800 rounded-xl border"><ArrowLeft size={20}/></Link>
//            <div>
//               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline Recrutement</h1>
//               <p className="text-sm text-gray-500">Vue globale des candidatures.</p>
//            </div>
//         </div>
//       </div>

//       {isLoading ? (
//          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-sky-500"/></div>
//       ) : (
//          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
//             <div className="flex gap-6 min-w-[1600px] h-full px-4 md:px-0">
//                {COLUMNS.map((col) => {
//                   const colData = getColumnData(col.id);
//                   return (
//                   <div key={col.id} className="flex-1 flex flex-col min-w-[280px]">
//                      <div className={`flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-t-xl border-t-4 ${col.color} border-x border-b shadow-sm mb-3`}>
//                         <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                            {col.title} <span className="bg-gray-100 dark:bg-gray-700 text-xs px-2 py-0.5 rounded-full">{colData.length}</span>
//                         </h3>
//                      </div>
//                      <div className="flex-1 bg-gray-100/50 dark:bg-gray-900/50 rounded-xl p-2 overflow-y-auto space-y-3 custom-scrollbar">
//                         {colData.map((c) => (
//                            <motion.div 
//                               key={c.id} 
//                               layoutId={c.id} 
//                               className="bg-white dark:bg-gray-800 p-4 rounded-xl border shadow-sm cursor-pointer hover:shadow-md relative group"
//                               onClick={(e) => { e.stopPropagation(); setActiveCandidate(activeCandidate?.id === c.id ? null : c); }}
//                            >
//                               {/* Menu Contextuel Flottant */}
//                               <AnimatePresence>
//                                   {activeCandidate?.id === c.id && (
//                                       <motion.div 
//                                         initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
//                                         className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
//                                       >
//                                           {/* Actions de changement de statut */}
//                                           <div className="p-1">
//                                               <p className="text-[10px] uppercase font-bold text-gray-400 px-3 py-1">Déplacer vers</p>
//                                               {COLUMNS.filter(cl => cl.id !== c.status).map(cl => (
//                                                   <button 
//                                                     key={cl.id} 
//                                                     onClick={(e) => { e.stopPropagation(); handleStatusChange(c.id, cl.id); }}
//                                                     className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
//                                                   >
//                                                       <div className={`w-2 h-2 rounded-full ${cl.color.replace('border-', 'bg-')}`}></div> {cl.title}
//                                                   </button>
//                                               ))}
//                                           </div>
                                          
//                                           {/* Action spéciale Embauche */}
//                                           {c.status === 'HIRED' && (
//                                               <div className="border-t border-gray-100 dark:border-gray-700 p-1">
//                                                   <button 
//                                                     onClick={(e) => { e.stopPropagation(); handleHire(c.id); }}
//                                                     className="w-full text-left px-3 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg flex items-center gap-2"
//                                                   >
//                                                       <UserPlus size={16} /> Créer Employé
//                                                   </button>
//                                               </div>
//                                           )}
//                                       </motion.div>
//                                   )}
//                               </AnimatePresence>

//                               <div className="flex items-center gap-3 mb-2">
//                                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-xs text-gray-600 dark:text-gray-300">
//                                     {c.firstName[0]}{c.lastName[0]}
//                                  </div>
//                                  <div>
//                                     <h4 className="font-bold text-sm text-gray-900 dark:text-white">{c.firstName} {c.lastName}</h4>
//                                     <p className="text-xs text-gray-500 truncate w-32" title={c.jobOffer?.title}>{c.jobOffer?.title}</p>
//                                  </div>
//                               </div>
//                               <div className="flex justify-between items-center mt-3">
//                                   <div className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
//                                       {new Date(c.createdAt).toLocaleDateString()}
//                                   </div>
                                  
//                                   {c.status === 'HIRED' && (
//                                       <button 
//                                         onClick={(e) => { e.stopPropagation(); handleHire(c.id); }}
//                                         className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-bold hover:bg-emerald-200 transition-colors"
//                                       >
//                                           Recruter
//                                       </button>
//                                   )}
//                               </div>
//                            </motion.div>
//                         ))}
//                      </div>
//                   </div>
//                )})}
//             </div>
//          </div>
//       )}
//     </div>
//   );
// }
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';

type ColumnId = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: ColumnId;
  jobOffer?: { title: string };
  createdAt: string;
}

const COLUMNS: { id: ColumnId, title: string, color: string }[] = [
  { id: 'APPLIED', title: 'Nouvelles', color: 'border-blue-500' },
  { id: 'SCREENING', title: 'Qualifiés', color: 'border-purple-500' },
  { id: 'INTERVIEW', title: 'Entretiens', color: 'border-orange-500' },
  { id: 'OFFER', title: 'Offre', color: 'border-sky-500' },
  { id: 'HIRED', title: 'Embauché', color: 'border-emerald-500' },
  { id: 'REJECTED', title: 'Refusé', color: 'border-red-500' },
];

export default function RecruitmentKanbanPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await api.get<Candidate[]>('/recruitment/candidates');
      setCandidates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getColumnData = (colId: ColumnId) => candidates.filter(c => c.status === colId);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between mb-6 px-4 md:px-0">
        <div className="flex items-center gap-4">
          <Link href="/recrutement" className="p-2 bg-white dark:bg-gray-800 rounded-xl border">
            <ArrowLeft size={20}/>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline Recrutement</h1>
            <p className="text-sm text-gray-500">Vue globale des candidatures.</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-sky-500"/>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-6 min-w-[1600px] h-full px-4 md:px-0">
            {COLUMNS.map((col) => {
              const colData = getColumnData(col.id);
              return (
                <div key={col.id} className="flex-1 flex flex-col min-w-[280px]">
                  <div className={`flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-t-xl border-t-4 ${col.color} border-x border-b shadow-sm mb-3`}>
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {col.title} <span className="bg-gray-100 dark:bg-gray-700 text-xs px-2 py-0.5 rounded-full">{colData.length}</span>
                    </h3>
                  </div>
                  
                  <div className="flex-1 bg-gray-100/50 dark:bg-gray-900/50 rounded-xl p-2 overflow-y-auto space-y-3">
                    {colData.map((c) => (
                      <motion.div 
                        key={c.id} 
                        layoutId={c.id}
                        onClick={() => router.push(`/recrutement/candidats/${c.id}`)}
                        className="bg-white dark:bg-gray-800 p-4 rounded-xl border shadow-sm cursor-pointer hover:shadow-md hover:border-cyan-500/50 transition-all"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-xs text-gray-600 dark:text-gray-300">
                            {c.firstName[0]}{c.lastName[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{c.firstName} {c.lastName}</h4>
                            <p className="text-xs text-gray-500 truncate w-32" title={c.jobOffer?.title}>{c.jobOffer?.title}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <div className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}