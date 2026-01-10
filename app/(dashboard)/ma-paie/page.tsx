
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Calendar, Loader2, ArrowLeft, Eye } from 'lucide-react';
import { api } from '@/services/api';

export default function MyPayrollsPage() {
  const router = useRouter();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    const fetchMyPayrolls = async () => {
        try {
            // 1. Récupérer l'ID employé
            const me = await api.get<any>('/employees/me');
            if (me) {
                setEmployee(me);
                // 2. Récupérer les bulletins pour cet ID
                const data = await api.get<any[]>(`/payrolls?employeeId=${me.id}`);
                setPayrolls(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchMyPayrolls();
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-8">
       
       <div className="flex items-center gap-4">
           <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
             <ArrowLeft size={20} className="text-gray-500 dark:text-gray-400" />
           </button>
           <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Bulletins de Paie</h1>
              <p className="text-gray-500 dark:text-gray-400">Consultez et téléchargez vos fiches de paie mensuelles.</p>
           </div>
       </div>

       {isLoading ? (
           <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={48}/></div>
       ) : payrolls.length === 0 ? (
           <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
               <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                   <FileText size={32} />
               </div>
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun bulletin disponible</h3>
               <p className="text-gray-500 dark:text-gray-400">Vos bulletins de paie s'afficheront ici une fois générés.</p>
           </div>
       ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {payrolls.map((payroll) => (
                   <div key={payroll.id} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 dark:bg-sky-900/10 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-150"></div>
                       
                       <div className="relative z-10">
                           <div className="flex justify-between items-start mb-4">
                               <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                   {new Date(0, payroll.month - 1).toLocaleString('fr-FR', { month: 'short' })}
                               </div>
                               <span className={`px-2 py-1 rounded text-xs font-bold border ${payroll.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                   {payroll.status === 'PAID' ? 'PAYÉ' : 'VALIDÉ'}
                               </span>
                           </div>

                           <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                               {new Date(0, payroll.month - 1).toLocaleString('fr-FR', { month: 'long' })} {payroll.year}
                           </h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Bulletin N° {payroll.id.substring(0, 8).toUpperCase()}</p>

                           <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                               <div className="text-sm">
                                   <p className="text-gray-400 text-xs uppercase font-bold">Net à Payer</p>
                                   <p className="font-mono font-bold text-gray-900 dark:text-white">{payroll.netSalary.toLocaleString()} F</p>
                               </div>
                               <button 
                                   onClick={() => router.push(`/paie/${payroll.id}`)}
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
       )}
    </div>
  );
}
