'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Calendar, Loader2, ArrowLeft, Eye, Clock } from 'lucide-react';
import { api } from '@/services/api';

export default function MyPayrollsPage() {
  const router = useRouter();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    const fetchMyPayrolls = async () => {
        try {
            // Récupérer l'employé connecté
            const me = await api.get<any>('/employees/me');
            console.log('👤 Employé connecté:', me);
            
            if (!me?.id) {
                console.error('❌ Pas d\'ID employé trouvé');
                setIsLoading(false);
                return;
            }

            setEmployee(me);
            
            // Le backend filtre déjà automatiquement les bulletins PAID pour les employés
            // Pas besoin de passer l'employeeId car le backend utilise le userId du token JWT
            const data = await api.get<any[]>('/payrolls');
            console.log('💰 Bulletins récupérés (déjà filtrés PAID par backend):', data);
            console.log('📊 Nombre de bulletins:', data.length);
            
            // Debug: afficher les status
            if (data.length > 0) {
                console.log('📊 Status des bulletins:', data.map(p => ({
                    id: p.id.substring(0, 8),
                    month: p.month,
                    year: p.year,
                    status: p.status
                })));
            }
            
            setPayrolls(data);
        } catch (e: any) {
            console.error('❌ Erreur chargement bulletins:', e);
            
            // Afficher un message d'erreur approprié
            if (e.message?.includes('accès')) {
                alert('Vous n\'avez pas accès aux bulletins de paie');
            }
        } finally {
            setIsLoading(false);
        }
    };
    fetchMyPayrolls();
  }, []);

  const formatMoney = (val: number) => val?.toLocaleString('fr-FR') || '0';

  const currentYear = new Date().getFullYear();
  const currentYearPayrolls = payrolls.filter(p => p.year === currentYear);
  const yearTotal = currentYearPayrolls.reduce((sum, p) => sum + Number(p.netSalary || 0), 0);

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-8">
       
       <div className="flex items-center gap-4">
           <button 
               onClick={() => router.back()} 
               className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
           >
             <ArrowLeft size={20} className="text-gray-500 dark:text-gray-400" />
           </button>
           <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Bulletins de Paie</h1>
              <p className="text-gray-500 dark:text-gray-400">Consultez et téléchargez vos fiches de paie mensuelles.</p>
           </div>
       </div>

       {isLoading ? (
           <div className="flex justify-center py-20">
               <Loader2 className="animate-spin text-sky-500" size={48}/>
           </div>
       ) : payrolls.length === 0 ? (
           <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
               <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                   <Clock size={32} />
               </div>
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun bulletin disponible</h3>
               <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                   Vos bulletins de paie apparaîtront ici une fois que votre service RH aura effectué le paiement.
               </p>
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg text-sm text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                   <FileText size={16} />
                   <span>Les bulletins en brouillon ou validés ne sont pas encore visibles</span>
               </div>
           </div>
       ) : (
           <>
               {/* Stats rapides */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                       <div className="flex items-center gap-3 mb-3">
                           <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                               <FileText size={20} className="text-sky-500" />
                           </div>
                           <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Bulletins Payés</p>
                       </div>
                       <p className="text-3xl font-bold text-gray-900 dark:text-white">{payrolls.length}</p>
                       <p className="text-xs text-gray-400 mt-1">Total disponibles</p>
                   </div>

                   <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                       <div className="flex items-center gap-3 mb-3">
                           <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                               <Calendar size={20} className="text-emerald-500" />
                           </div>
                           <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Dernier Paiement</p>
                       </div>
                       <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                           {new Date(0, payrolls[0].month - 1).toLocaleString('fr-FR', { month: 'long' })} {payrolls[0].year}
                       </p>
                       <p className="text-xs text-gray-400 mt-1">{formatMoney(payrolls[0].netSalary)} F</p>
                   </div>

                   <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                       <div className="flex items-center gap-3 mb-3">
                           <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                               <Download size={20} className="text-purple-500" />
                           </div>
                           <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Année {currentYear}</p>
                       </div>
                       <p className="text-2xl font-bold text-gray-900 dark:text-white">
                           {formatMoney(yearTotal)} F
                       </p>
                       <p className="text-xs text-gray-400 mt-1">{currentYearPayrolls.length} bulletin(s)</p>
                   </div>
               </div>

               {/* Liste des bulletins payés */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {payrolls
                       .sort((a, b) => {
                           if (b.year !== a.year) return b.year - a.year;
                           return b.month - a.month;
                       })
                       .map((payroll) => (
                       <div 
                           key={payroll.id} 
                           className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all relative overflow-hidden cursor-pointer"
                           onClick={() => router.push(`/paie/${payroll.id}`)}
                       >
                           <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 dark:bg-sky-900/10 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-150"></div>
                           
                           <div className="relative z-10">
                               <div className="flex justify-between items-start mb-4">
                                   <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                       {new Date(0, payroll.month - 1).toLocaleString('fr-FR', { month: 'short' })}
                                   </div>
                                   <span className="px-2 py-1 rounded text-xs font-bold border bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                                       ✓ PAYÉ
                                   </span>
                               </div>

                               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 capitalize">
                                   {new Date(0, payroll.month - 1).toLocaleString('fr-FR', { month: 'long' })} {payroll.year}
                               </h3>
                               <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                   Bulletin N° {payroll.id.substring(0, 8).toUpperCase()}
                               </p>

                               <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                   <div className="text-sm">
                                       <p className="text-gray-400 text-xs uppercase font-bold mb-1">Net à Payer</p>
                                       <p className="font-mono font-bold text-xl text-gray-900 dark:text-white">
                                           {formatMoney(payroll.netSalary)} F
                                       </p>
                                   </div>
                                   <button 
                                       onClick={(e) => {
                                           e.stopPropagation();
                                           router.push(`/paie/${payroll.id}`);
                                       }}
                                       className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-white rounded-lg hover:bg-sky-500 hover:text-white transition-colors"
                                       title="Voir détail"
                                   >
                                       <Eye size={20} />
                                   </button>
                               </div>
                           </div>
                       </div>
                   ))}
               </div>

               {/* Info box */}
               <div className="bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-sky-200 dark:border-sky-800">
                   <div className="flex items-start gap-4">
                       <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                           <FileText size={20} className="text-sky-600 dark:text-sky-400" />
                       </div>
                       <div>
                           <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                               💡 Informations importantes
                           </h3>
                           <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                               <li>• Seuls vos bulletins <strong>payés</strong> apparaissent dans cette liste</li>
                               <li>• Les bulletins en cours de traitement (brouillon/validé) ne sont pas encore visibles</li>
                               <li>• Vous recevrez une notification dès qu'un nouveau bulletin sera disponible</li>
                               <li>• Conservez vos bulletins de paie sans limitation de durée</li>
                           </ul>
                       </div>
                   </div>
               </div>
           </>
       )}
    </div>
  );
}
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { FileText, Download, Calendar, Loader2, ArrowLeft, Eye } from 'lucide-react';
// import { api } from '@/services/api';

// export default function MyPayrollsPage() {
//   const router = useRouter();
//   const [payrolls, setPayrolls] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [employee, setEmployee] = useState<any>(null);

//   useEffect(() => {
//     const fetchMyPayrolls = async () => {
//         try {
//             // 1. Récupérer l'ID employé
//             const me = await api.get<any>('/employees/me');
//             if (me) {
//                 setEmployee(me);
//                 // 2. Récupérer les bulletins pour cet ID
//                 const data = await api.get<any[]>(`/payrolls?employeeId=${me.id}`);
//                 setPayrolls(data);
//             }
//         } catch (e) {
//             console.error(e);
//         } finally {
//             setIsLoading(false);
//         }
//     };
//     fetchMyPayrolls();
//   }, []);

//   return (
//     <div className="max-w-[1200px] mx-auto pb-20 space-y-8">
       
//        <div className="flex items-center gap-4">
//            <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
//              <ArrowLeft size={20} className="text-gray-500 dark:text-gray-400" />
//            </button>
//            <div>
//               <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Bulletins de Paie</h1>
//               <p className="text-gray-500 dark:text-gray-400">Consultez et téléchargez vos fiches de paie mensuelles.</p>
//            </div>
//        </div>

//        {isLoading ? (
//            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={48}/></div>
//        ) : payrolls.length === 0 ? (
//            <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
//                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
//                    <FileText size={32} />
//                </div>
//                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun bulletin disponible</h3>
//                <p className="text-gray-500 dark:text-gray-400">Vos bulletins de paie s'afficheront ici une fois générés.</p>
//            </div>
//        ) : (
//            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                {payrolls.map((payroll) => (
//                    <div key={payroll.id} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all relative overflow-hidden">
//                        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 dark:bg-sky-900/10 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-150"></div>
                       
//                        <div className="relative z-10">
//                            <div className="flex justify-between items-start mb-4">
//                                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-sm">
//                                    {new Date(0, payroll.month - 1).toLocaleString('fr-FR', { month: 'short' })}
//                                </div>
//                                <span className={`px-2 py-1 rounded text-xs font-bold border ${payroll.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
//                                    {payroll.status === 'PAID' ? 'PAYÉ' : 'VALIDÉ'}
//                                </span>
//                            </div>

//                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
//                                {new Date(0, payroll.month - 1).toLocaleString('fr-FR', { month: 'long' })} {payroll.year}
//                            </h3>
//                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Bulletin N° {payroll.id.substring(0, 8).toUpperCase()}</p>

//                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
//                                <div className="text-sm">
//                                    <p className="text-gray-400 text-xs uppercase font-bold">Net à Payer</p>
//                                    <p className="font-mono font-bold text-gray-900 dark:text-white">{payroll.netSalary.toLocaleString()} F</p>
//                                </div>
//                                <button 
//                                    onClick={() => router.push(`/paie/${payroll.id}`)}
//                                    className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-white rounded-lg hover:bg-sky-500 hover:text-white transition-colors"
//                                    title="Voir détail"
//                                >
//                                    <Eye size={20} />
//                                </button>
//                            </div>
//                        </div>
//                    </div>
//                ))}
//            </div>
//        )}
//     </div>
//   );
// }
