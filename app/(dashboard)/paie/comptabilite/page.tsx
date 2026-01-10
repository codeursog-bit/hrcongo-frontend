
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Download, FileSpreadsheet, Copy, 
  CheckCircle2, Building2, ArrowRightLeft, Settings
} from 'lucide-react';
import { api } from '@/services/api';

// --- Types ---
interface JournalEntry {
  account: string;
  label: string;
  debit: number;
  credit: number;
  ref: string;
}

export default function AccountingExportPage() {
  const router = useRouter();
  const [period, setPeriod] = useState({ month: 11, year: 2024 }); // Nov 2024 default
  const [copied, setCopied] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJournal = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<JournalEntry[]>(`/payrolls/journal?month=${period.month}&year=${period.year}`);
        setEntries(data);
      } catch (e) {
        console.error("Erreur chargement journal", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJournal();
  }, [period]);

  const totalDebit = entries.reduce((acc, curr) => acc + curr.debit, 0);
  const totalCredit = entries.reduce((acc, curr) => acc + curr.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 1; // Tolerance for float errors

  const handleCopy = () => {
    // Logic to copy text to clipboard
    const text = entries.map(e => `${e.account}\t${e.label}\t${e.debit}\t${e.credit}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
             <ArrowLeft size={20} className="text-gray-500" />
           </button>
           <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Ecritures Comptables</h1>
              <p className="text-gray-500 dark:text-gray-400">Génération automatique des OD de paie (Norme OHADA).</p>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center px-3 py-2 shadow-sm">
              <span className="text-gray-500 text-sm font-medium mr-2">Période :</span>
              <select 
                 value={period.month}
                 onChange={(e) => setPeriod({ ...period, month: parseInt(e.target.value) })}
                 className="bg-transparent font-bold text-gray-900 dark:text-white outline-none cursor-pointer text-sm mr-2"
              >
                 <option value={10}>Octobre</option>
                 <option value={11}>Novembre</option>
                 <option value={12}>Décembre</option>
              </select>
              <select 
                 value={period.year}
                 onChange={(e) => setPeriod({ ...period, year: parseInt(e.target.value) })}
                 className="bg-transparent font-bold text-gray-900 dark:text-white outline-none cursor-pointer text-sm"
              >
                 <option value={2024}>2024</option>
                 <option value={2025}>2025</option>
              </select>
           </div>
           
           <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
              <FileSpreadsheet size={18} />
              <span>Export Excel</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* LEFT: THE JOURNAL (The Core Feature) */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
               <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                        <ArrowRightLeft size={20} />
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Journal de Paie</h3>
                        <p className="text-xs text-gray-500">Brouillard de saisie</p>
                     </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isBalanced ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                     {isBalanced ? 'ÉQUILIBRÉ' : 'DÉSÉQUILIBRÉ'}
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left font-mono">
                     <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 uppercase text-xs font-semibold">
                        <tr>
                           <th className="px-6 py-3 w-24">Compte</th>
                           <th className="px-6 py-3">Libellé de l'écriture</th>
                           <th className="px-6 py-3 w-32 text-right text-emerald-600">Débit</th>
                           <th className="px-6 py-3 w-32 text-right text-red-500">Crédit</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {isLoading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Chargement des écritures...</td></tr>
                        ) : entries.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Aucune écriture pour cette période.</td></tr>
                        ) : (
                            entries.map((entry, i) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                <td className="px-6 py-3 font-bold text-gray-900 dark:text-white">{entry.account}</td>
                                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{entry.label}</td>
                                <td className="px-6 py-3 text-right text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-gray-700 bg-emerald-50/30 dark:bg-emerald-900/10">
                                    {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                                </td>
                                <td className="px-6 py-3 text-right text-gray-800 dark:text-gray-200 bg-red-50/30 dark:bg-red-900/10">
                                    {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                                </td>
                            </tr>
                            ))
                        )}
                     </tbody>
                     <tfoot className="bg-gray-100 dark:bg-gray-900 font-bold border-t-2 border-gray-200 dark:border-gray-600">
                        <tr>
                           <td colSpan={2} className="px-6 py-4 text-right uppercase tracking-wider text-xs">Totaux</td>
                           <td className="px-6 py-4 text-right text-emerald-600">{totalDebit.toLocaleString()}</td>
                           <td className="px-6 py-4 text-right text-red-600">{totalCredit.toLocaleString()}</td>
                        </tr>
                     </tfoot>
                  </table>
               </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-4 items-start">
               <div className="p-2 bg-white dark:bg-blue-900/40 rounded-full text-blue-500 shrink-0">
                  <Settings size={20} />
               </div>
               <div>
                  <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm">Configuration du Plan Comptable</h4>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 mb-3">
                     Les numéros de comptes (6611, 4221...) sont configurés par défaut selon le plan OHADA. Vous pouvez les personnaliser pour correspondre à votre logiciel comptable (Sage, Ciel, Xero).
                  </p>
                  <button className="text-xs font-bold bg-white dark:bg-blue-800 text-blue-600 dark:text-blue-200 px-3 py-1.5 rounded border border-blue-200 dark:border-blue-700 hover:shadow-sm transition-all">
                     Modifier le mapping des comptes
                  </button>
               </div>
            </div>
         </div>

         {/* RIGHT: ACTIONS & SUMMARY */}
         <div className="space-y-6">
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
               <h3 className="font-bold text-gray-900 dark:text-white mb-4">Formats d'export</h3>
               <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">XL</div>
                        <div className="text-left">
                           <p className="font-bold text-sm text-gray-900 dark:text-white">Excel (Standard)</p>
                           <p className="text-xs text-gray-500">Pour révision manuelle</p>
                        </div>
                     </div>
                     <Download size={16} className="text-gray-400 group-hover:text-emerald-500" />
                  </button>

                  <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">SG</div>
                        <div className="text-left">
                           <p className="font-bold text-sm text-gray-900 dark:text-white">Sage Comptabilité</p>
                           <p className="text-xs text-gray-500">Format .PNM ou .TXT</p>
                        </div>
                     </div>
                     <Download size={16} className="text-gray-400 group-hover:text-blue-500" />
                  </button>

                  <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">CS</div>
                        <div className="text-left">
                           <p className="font-bold text-sm text-gray-900 dark:text-white">CSV Générique</p>
                           <p className="text-xs text-gray-500">Universel</p>
                        </div>
                     </div>
                     <Download size={16} className="text-gray-400 group-hover:text-purple-500" />
                  </button>
               </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-black rounded-2xl p-6 text-white shadow-lg">
               <div className="flex items-center gap-2 mb-4 opacity-80">
                  <Building2 size={18} />
                  <span className="text-sm font-bold uppercase tracking-wider">Synthèse</span>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                     <span className="text-sm text-gray-300">Total Charges</span>
                     <span className="font-mono font-bold">{entries.find(e => e.account === '6641')?.debit.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                     <span className="text-sm text-gray-300">Net à Payer</span>
                     <span className="font-mono font-bold text-emerald-400">{entries.find(e => e.account === '4221')?.credit.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                     <span className="text-sm font-bold">Masse Totale</span>
                     <span className="font-mono font-bold text-xl">{totalDebit.toLocaleString()}</span>
                  </div>
               </div>
               
               <button 
                  onClick={handleCopy}
                  className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
               >
                  {copied ? <CheckCircle2 size={16} className="text-emerald-400"/> : <Copy size={16} />}
                  {copied ? 'Copié !' : 'Copier les montants'}
               </button>
            </div>

         </div>

      </div>
    </div>
  );
}
