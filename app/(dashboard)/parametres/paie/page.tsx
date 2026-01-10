
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, AlertTriangle, History, Calculator, 
  Plus, Trash2, RotateCcw, CheckCircle2, AlertCircle,
  Percent, Clock, Calendar, Shield, Info, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

// --- Types ---

interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

interface PayrollSettings {
  id: string;
  cnssSalarialRate: number;
  cnssEmployerRate: number;
  cnssCeiling: number;
  overtimeRate15: number;
  overtimeRate50: number;
  itsBrackets: TaxBracket[];
  workDaysPerMonth: number;
  workHoursPerDay: number;
}

export default function PayrollSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'rates' | 'its' | 'other' | 'history'>('rates');
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Simulator State
  const [simIncome, setSimIncome] = useState<number>(450000);
  const [simResult, setSimResult] = useState<{breakdown: any[], total: number, net: number} | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const data = await api.get<any>('/payroll-settings');
            if (data) {
                setSettings({
                    id: data.id,
                    cnssSalarialRate: data.cnssSalarialRate || 4,
                    cnssEmployerRate: data.cnssEmployerRate || 16,
                    cnssCeiling: data.cnssCeiling || 1200000,
                    overtimeRate15: data.overtimeRate15 || 15,
                    overtimeRate50: data.overtimeRate50 || 50,
                    workDaysPerMonth: data.workDaysPerMonth || 26,
                    workHoursPerDay: data.workHoursPerDay || 8,
                    itsBrackets: data.itsBrackets ? JSON.parse(data.itsBrackets) : []
                });
            }
        } catch (e) {
            console.error("Failed to load settings", e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
        await api.patch('/payroll-settings', {
            cnssSalarialRate: settings.cnssSalarialRate,
            cnssEmployerRate: settings.cnssEmployerRate,
            cnssCeiling: settings.cnssCeiling,
            overtimeRate15: settings.overtimeRate15,
            overtimeRate50: settings.overtimeRate50,
            workDaysPerMonth: settings.workDaysPerMonth,
            workHoursPerDay: settings.workHoursPerDay,
            itsBrackets: JSON.stringify(settings.itsBrackets)
        });
        setShowConfirm(false);
        alert("Paramètres mis à jour avec succès !");
    } catch (e) {
        console.error("Save failed", e);
        alert("Erreur lors de la sauvegarde.");
    } finally {
        setIsSaving(false);
    }
  };

  const calculateITS = () => {
    if (!settings) return;
    let tax = 0;
    const breakdown = [];
    let income = simIncome;

    for (const bracket of settings.itsBrackets) {
        const lower = bracket.min;
        const upper = bracket.max ?? Number.MAX_SAFE_INTEGER;
        
        // Amount in this bracket
        const overlap = Math.max(0, Math.min(income, upper) - Math.max(0, lower - 1));
        
        const taxAmount = overlap * bracket.rate;
        
        if (overlap > 0) {
           breakdown.push({
             range: `${lower.toLocaleString()} - ${bracket.max ? bracket.max.toLocaleString() : '∞'}`,
             rate: `${(bracket.rate * 100).toFixed(1)}%`,
             amount: taxAmount
           });
           tax += taxAmount;
        }
    }
    
    setSimResult({
      breakdown,
      total: tax,
      net: simIncome - tax
    });
  };

  if (isLoading || !settings) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={48} /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-24">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres de Paie</h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm">Configurez les taux et barèmes légaux.</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
         {[
           { id: 'rates', label: 'Taux & Cotisations', icon: Percent },
           { id: 'its', label: 'Barème ITS', icon: Calculator },
           { id: 'other', label: 'Autres Paramètres', icon: Shield },
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`
               px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap
               ${activeTab === tab.id 
                 ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg' 
                 : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'}
             `}
           >
             <tab.icon size={16} /> {tab.label}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'rates' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                 
                 {/* CNSS Section */}
                 <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                       <Shield size={20} className="text-sky-500" /> Sécurité Sociale (CNSS)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Part Salariale (%)</label>
                          <input 
                             type="number" 
                             value={settings.cnssSalarialRate}
                             onChange={(e) => setSettings({...settings, cnssSalarialRate: parseFloat(e.target.value)})}
                             className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-bold"
                          />
                          <p className="text-xs text-gray-400 mt-1">Retenue sur salaire brut</p>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Part Patronale (%)</label>
                          <input 
                             type="number" 
                             value={settings.cnssEmployerRate}
                             onChange={(e) => setSettings({...settings, cnssEmployerRate: parseFloat(e.target.value)})}
                             className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-bold"
                          />
                          <p className="text-xs text-gray-400 mt-1">Charge employeur</p>
                       </div>
                       <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Plafond CNSS</label>
                          <div className="relative">
                             <input 
                                type="number" 
                                value={settings.cnssCeiling}
                                onChange={(e) => setSettings({...settings, cnssCeiling: parseFloat(e.target.value)})}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-bold"
                             />
                             <span className="absolute right-3 top-3 text-gray-400 text-sm font-bold">FCFA</span>
                          </div>
                       </div>
                    </div>
                 </section>

                 {/* Overtime Section */}
                 <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                       <Clock size={20} className="text-purple-500" /> Heures Supplémentaires
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Majoration 1 (%)</label>
                          <input 
                             type="number" 
                             value={settings.overtimeRate15}
                             onChange={(e) => setSettings({...settings, overtimeRate15: parseFloat(e.target.value)})}
                             className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-bold"
                          />
                          <p className="text-xs text-gray-400 mt-1">8 premières heures</p>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Majoration 2 (%)</label>
                          <input 
                             type="number" 
                             value={settings.overtimeRate50}
                             onChange={(e) => setSettings({...settings, overtimeRate50: parseFloat(e.target.value)})}
                             className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-bold"
                          />
                          <p className="text-xs text-gray-400 mt-1">Au-delà de 8h & Jours fériés</p>
                       </div>
                    </div>
                 </section>
              </motion.div>
            )}

            {activeTab === 'its' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                       <h3 className="font-bold text-gray-900 dark:text-white">Tranches d'imposition (Annuel)</h3>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 font-semibold">
                             <tr>
                                <th className="px-6 py-3">Min (FCFA)</th>
                                <th className="px-6 py-3">Max (FCFA)</th>
                                <th className="px-6 py-3">Taux</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                             {settings.itsBrackets.map((bracket, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750/50">
                                   <td className="px-6 py-3 font-mono">{bracket.min.toLocaleString()}</td>
                                   <td className="px-6 py-3 font-mono">{bracket.max ? bracket.max.toLocaleString() : '∞'}</td>
                                   <td className="px-6 py-3 font-bold text-sky-600">{(bracket.rate * 100).toFixed(0)}%</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'other' && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                     <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Calendar size={20} className="text-orange-500" /> Période & Temps
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jours ouvrables / mois</label>
                           <input type="number" value={settings.workDaysPerMonth} onChange={(e) => setSettings({...settings, workDaysPerMonth: parseFloat(e.target.value)})} className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-bold" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Heures / jour</label>
                           <input type="number" value={settings.workHoursPerDay} onChange={(e) => setSettings({...settings, workHoursPerDay: parseFloat(e.target.value)})} className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-bold" />
                        </div>
                     </div>
                  </section>
               </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SIDEBAR - SIMULATOR & ACTIONS */}
        <div className="space-y-6">
           
           <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700`}>
              <div className="flex items-center justify-between mb-4">
                 <span className="font-bold text-gray-900 dark:text-white">Modifications</span>
              </div>
              <button 
                 onClick={() => setShowConfirm(true)}
                 className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                 <Save size={18} /> Enregistrer
              </button>
           </div>

           {/* ITS SIMULATOR */}
           {activeTab === 'its' && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-xl">
                 <div className="flex items-center gap-2 mb-6 border-b border-gray-700 pb-4">
                    <Calculator size={20} className="text-sky-400" />
                    <h3 className="font-bold">Simulateur IRPP</h3>
                 </div>
                 
                 <div className="space-y-4">
                    <div>
                       <label className="text-xs text-gray-400 uppercase font-bold">Revenu Imposable (Annuel)</label>
                       <div className="relative mt-1">
                          <input 
                             type="number" 
                             value={simIncome}
                             onChange={(e) => setSimIncome(parseFloat(e.target.value))}
                             className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono font-bold"
                          />
                          <span className="absolute right-3 top-2 text-xs text-gray-400">FCFA</span>
                       </div>
                    </div>
                    
                    <button 
                       onClick={calculateITS}
                       className="w-full py-2 bg-sky-600 hover:bg-sky-500 rounded-lg font-bold text-sm transition-colors"
                    >
                       Calculer
                    </button>
                 </div>

                 {simResult && (
                    <div className="mt-6 pt-6 border-t border-gray-700 space-y-3 animate-fade-in">
                       {simResult.breakdown.map((b, i) => (
                          <div key={i} className="flex justify-between text-xs text-gray-400">
                             <span>{b.range} ({b.rate})</span>
                             <span>{b.amount.toLocaleString()}</span>
                          </div>
                       ))}
                       <div className="flex justify-between font-bold text-orange-400 pt-2 border-t border-gray-700">
                          <span>Total Impôt</span>
                          <span>{simResult.total.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between font-bold text-emerald-400 text-lg">
                          <span>Net</span>
                          <span>{simResult.net.toLocaleString()}</span>
                       </div>
                    </div>
                 )}
              </div>
           )}

        </div>

      </div>

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-full flex items-center justify-center">
                   <AlertTriangle size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirmer changements</h3>
                   <p className="text-sm text-gray-500">Ces modifications seront appliquées immédiatement.</p>
                </div>
              </div>

              <div className="flex gap-3">
                 <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300">Annuler</button>
                 <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex justify-center items-center gap-2">
                    {isSaving ? 'Enregistrement...' : 'Confirmer'}
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
