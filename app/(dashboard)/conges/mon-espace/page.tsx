
// 'use client';

// import React, { useState, useEffect, useMemo } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { 
//   ArrowLeft, Plus, Clock, Umbrella, Stethoscope, Loader2, 
//   Wallet, TrendingDown, TrendingUp, AlertCircle, HelpCircle, 
//   Info, Calendar, CheckCircle2, XCircle, Hourglass
// } from 'lucide-react';
// import { api } from '@/services/api';
// import { motion, AnimatePresence } from 'framer-motion';

// export default function MyLeaveSpacePage() {
//   const router = useRouter();
//   const [leaves, setLeaves] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [showExplanation, setShowExplanation] = useState(false);

//   // Simulation des constantes RH (À récupérer idéalement du backend /settings)
//   const MONTHLY_RATE = 2.5; 
//   const CURRENT_MONTH = new Date().getMonth() + 1; // Mois actuel (ex: 11 pour Nov)

//   useEffect(() => {
//     const fetchMyLeaves = async () => {
//         try {
//             const data = await api.get<any[]>('/leaves/me');
//             setLeaves(data);
//         } catch (e) {
//             console.error(e);
//         } finally {
//             setIsLoading(false);
//         }
//     };
//     fetchMyLeaves();
//   }, []);

//   // Calcul Dynamique du Solde
//   const stats = useMemo(() => {
//     const acquired = MONTHLY_RATE * CURRENT_MONTH; // Ex: 2.5 * 11 = 27.5 jours acquis
    
//     // On ne déduit que les congés APPROUVÉS
//     const taken = leaves
//         .filter(l => l.status === 'APPROVED' && l.type === 'ANNUAL')
//         .reduce((acc, curr) => acc + curr.daysCount, 0);
    
//     // Congés en attente (pour info)
//     const pending = leaves
//         .filter(l => l.status === 'PENDING' && l.type === 'ANNUAL')
//         .reduce((acc, curr) => acc + curr.daysCount, 0);

//     const remaining = acquired - taken;

//     return { acquired, taken, pending, remaining };
//   }, [leaves]);

//   return (
//     <div className="max-w-[1200px] mx-auto pb-20 min-h-screen space-y-8">
      
//       {/* HEADER */}
//       <div className="flex items-center gap-4">
//            <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"><ArrowLeft size={20}/></button>
//            <div>
//               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mon Espace Congés</h1>
//               <p className="text-gray-500 dark:text-gray-400 text-sm">Gérez vos absences et consultez votre solde en temps réel.</p>
//            </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
//          {/* SECTION GAUCHE : SOLDE (PEDAGOGIQUE & FUTURISTE) */}
//          <div className="lg:col-span-1 space-y-6">
//             <motion.div 
//                 initial={{ y: 20, opacity: 0 }} 
//                 animate={{ y: 0, opacity: 1 }}
//                 className="bg-gradient-to-br from-sky-600 to-blue-700 dark:from-sky-900 dark:to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-sky-500/20 relative overflow-hidden group"
//             >
//                {/* Decorative Background */}
//                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
               
//                <div className="flex items-center justify-between mb-6 relative z-10">
//                   <div className="flex items-center gap-2">
//                     <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md"><Wallet size={18} /></div>
//                     <span className="font-bold text-sm tracking-widest uppercase opacity-90">Mon Compteur</span>
//                   </div>
//                   <button onClick={() => setShowExplanation(!showExplanation)} className="text-white/70 hover:text-white transition-colors">
//                     <HelpCircle size={20} />
//                   </button>
//                </div>

//                <div className="text-center mb-8 relative z-10">
//                   <span className="text-7xl font-extrabold tracking-tighter drop-shadow-lg">{stats.remaining.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</span>
//                   <div className="text-sm font-medium opacity-80 mt-1 uppercase tracking-wide">Jours Disponibles</div>
//                </div>

//                {/* Jauge de progression annuelle */}
//                <div className="mb-6 relative z-10">
//                   <div className="flex justify-between text-xs opacity-70 mb-2 font-mono">
//                     <span>Consommé: {stats.taken}j</span>
//                     <span>Acquis: {stats.acquired}j</span>
//                   </div>
//                   <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
//                     {/* Barre de consommation */}
//                     <motion.div 
//                         initial={{ width: 0 }} 
//                         animate={{ width: `${(stats.taken / stats.acquired) * 100}%` }} 
//                         className="h-full bg-gradient-to-r from-emerald-300 to-emerald-500 rounded-full relative"
//                     >
//                         {/* Glow effect at the end of the bar */}
//                         <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
//                     </motion.div>
//                   </div>
//                   {stats.pending > 0 && (
//                       <div className="text-xs text-orange-200 mt-2 flex items-center gap-1 animate-pulse">
//                           <Hourglass size={10} /> {stats.pending} jours en attente de validation
//                       </div>
//                   )}
//                </div>

//                <div className="mt-8 relative z-10">
//                    <Link href="/conges/nouveau" className="block w-full py-4 bg-white text-blue-900 text-center font-bold rounded-2xl hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl hover:scale-[1.02] transform duration-200">
//                       <div className="flex items-center justify-center gap-2">
//                         <Plus size={20} /> Faire une demande
//                       </div>
//                    </Link>
//                </div>
//             </motion.div>

//             {/* Explication dynamique */}
//             <AnimatePresence>
//                 {showExplanation && (
//                     <motion.div 
//                         initial={{ opacity: 0, height: 0 }} 
//                         animate={{ opacity: 1, height: 'auto' }} 
//                         exit={{ opacity: 0, height: 0 }}
//                         className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 text-sm overflow-hidden"
//                     >
//                        <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
//                           <Info size={16}/> Comprendre le calcul
//                        </h4>
//                        <ul className="list-disc pl-4 text-blue-600 dark:text-blue-400 space-y-1 text-xs">
//                           <li><strong>Gain :</strong> 2,5 jours par mois travaillé.</li>
//                           <li><strong>Total acquis :</strong> {stats.acquired} jours (depuis Janvier).</li>
//                           <li><strong>Consommé :</strong> {stats.taken} jours validés par les RH.</li>
//                           <li><strong>Reste :</strong> {stats.remaining} jours à prendre.</li>
//                        </ul>
//                     </motion.div>
//                 )}
//             </AnimatePresence>
//          </div>

//          {/* SECTION DROITE : HISTORIQUE AVEC STATUTS CLAIRS */}
//          <div className="lg:col-span-2">
//             <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm min-h-[500px] relative">
//                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-8 flex items-center gap-2">
//                   <Clock size={24} className="text-purple-500" /> Historique de mes demandes
//                </h3>
               
//                {isLoading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-purple-500" size={32}/></div> : (
//                    <div className="space-y-4">
//                       {leaves.length === 0 ? (
//                           <div className="flex flex-col items-center justify-center py-20 text-gray-400">
//                               <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
//                                 <Umbrella size={32} className="opacity-50" />
//                               </div>
//                               <p className="font-medium">Vous n'avez fait aucune demande pour le moment.</p>
//                               <Link href="/conges/nouveau" className="text-sky-500 font-bold hover:underline mt-2">Planifier mes premières vacances</Link>
//                           </div>
//                       ) : (
//                           leaves.map((item) => (
//                              <motion.div 
//                                 key={item.id} 
//                                 initial={{ opacity: 0, y: 10 }}
//                                 animate={{ opacity: 1, y: 0 }}
//                                 className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50 dark:bg-gray-750/30 hover:bg-white dark:hover:bg-gray-750 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 rounded-2xl transition-all shadow-sm hover:shadow-md"
//                              >
//                                 <div className="flex items-center gap-5 mb-4 sm:mb-0">
//                                     {/* Icone Type */}
//                                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
//                                         item.type === 'SICK' ? 'bg-red-100 dark:bg-red-900/20 text-red-500' : 
//                                         item.type === 'MATERNITY' ? 'bg-pink-100 dark:bg-pink-900/20 text-pink-500' :
//                                         'bg-sky-100 dark:bg-sky-900/20 text-sky-500'
//                                     }`}>
//                                        {item.type === 'SICK' ? <Stethoscope size={24} /> : <Umbrella size={24} />}
//                                     </div>
                                    
//                                     <div>
//                                        <div className="flex items-center gap-3">
//                                            <h4 className="font-bold text-lg text-gray-900 dark:text-white">
//                                                {item.type === 'ANNUAL' ? 'Congés Payés' : item.type === 'SICK' ? 'Arrêt Maladie' : 'Absence'}
//                                            </h4>
//                                            <span className="text-xs font-mono font-bold bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
//                                                {item.daysCount}j
//                                            </span>
//                                        </div>
//                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
//                                           <Calendar size={14} />
//                                           <span>Du {new Date(item.startDate).toLocaleDateString()} au {new Date(item.endDate).toLocaleDateString()}</span>
//                                        </div>
//                                     </div>
//                                 </div>
                                
//                                 {/* Badge Statut */}
//                                 <div>
//                                    {item.status === 'APPROVED' && (
//                                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
//                                            <CheckCircle2 size={16} className="fill-current" /> Validé
//                                        </div>
//                                    )}
//                                    {item.status === 'PENDING' && (
//                                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-100/50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 text-orange-700 dark:text-orange-400 font-bold text-sm">
//                                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" /> En attente
//                                        </div>
//                                    )}
//                                    {item.status === 'REJECTED' && (
//                                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100/50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 font-bold text-sm">
//                                            <XCircle size={16} /> Refusé
//                                        </div>
//                                    )}
//                                 </div>
//                              </motion.div>
//                           ))
//                       )}
//                    </div>
//                )}
//             </div>
//          </div>
//       </div>
//     </div>
//   );
// }




'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Clock, Umbrella, Stethoscope, Loader2,
  Wallet, AlertCircle, HelpCircle, Info, Calendar,
  CheckCircle2, XCircle, Hourglass, TrendingUp, Lock
} from 'lucide-react';
import { api } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ CONGO : 26j/an - taux affiché côté front uniquement pour info
// La vraie source de vérité vient du backend via /leaves/balance
const CONGO_ANNUAL_DAYS = 26;
const CONGO_MONTHLY_RATE = (CONGO_ANNUAL_DAYS / 12).toFixed(2); // "2.17"

interface LeaveBalance {
  annualEntitled: number;
  annualTaken: number;
  annualRemaining: number;
  monthlyRate: number;
  annualMax: number;
  acquiredThisYear: number;
  monthsWorked: number;
  canTakeAnnualLeave: boolean;
  monthsUntilEligible: number;
}

const TYPE_LABEL: Record<string, string> = {
  ANNUAL: 'Congés Payés',
  SICK: 'Arrêt Maladie',
  MATERNITY: 'Maternité',
  PATERNITY: 'Paternité',
  UNPAID: 'Sans Solde',
  SPECIAL: 'Événement Familial',
};

const TYPE_COLOR: Record<string, string> = {
  ANNUAL: 'bg-sky-100 dark:bg-sky-900/20 text-sky-500',
  SICK: 'bg-red-100 dark:bg-red-900/20 text-red-500',
  MATERNITY: 'bg-pink-100 dark:bg-pink-900/20 text-pink-500',
  PATERNITY: 'bg-blue-100 dark:bg-blue-900/20 text-blue-500',
  UNPAID: 'bg-gray-100 dark:bg-gray-700 text-gray-500',
  SPECIAL: 'bg-violet-100 dark:bg-violet-900/20 text-violet-500',
};

export default function MyLeaveSpacePage() {
  const router = useRouter();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leavesData, balanceData] = await Promise.all([
          api.get<any[]>('/leaves/me'),
          api.get<LeaveBalance>('/leaves/balance'),
        ]);
        setLeaves(leavesData);
        setBalance(balanceData);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Congés en attente (info uniquement)
  const pendingDays = useMemo(
    () =>
      leaves
        .filter((l) => l.status === 'PENDING' && l.type === 'ANNUAL')
        .reduce((acc, l) => acc + l.daysCount, 0),
    [leaves],
  );

  const consumedPercent = balance
    ? Math.min(100, (balance.annualTaken / balance.annualEntitled) * 100)
    : 0;

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-sky-500" size={32} />
      </div>
    );

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-8">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mon Espace Congés</h1>
          <p className="text-sm text-gray-400">Solde en temps réel · Droit congolais (26j/an)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── COLONNE GAUCHE : SOLDE ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Carte solde principale */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-sky-400" />
                <span className="text-xs font-bold tracking-widest uppercase text-gray-400">
                  Mon Solde
                </span>
              </div>
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <HelpCircle size={18} />
              </button>
            </div>

            {/* Éligibilité */}
            {balance && !balance.canTakeAnnualLeave && (
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl px-3 py-2 mb-4 flex items-start gap-2 relative z-10">
                <Lock size={14} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-300">
                  Congés annuels disponibles dans{' '}
                  <strong>{balance.monthsUntilEligible} mois</strong> (loi congolaise : 12 mois d'ancienneté requis)
                </p>
              </div>
            )}

            <div className="text-center mb-6 relative z-10">
              <span className="text-6xl font-extrabold tracking-tighter">
                {balance ? Number(balance.annualRemaining).toFixed(1) : '—'}
              </span>
              <p className="text-sm text-gray-400 mt-1 uppercase tracking-wide">
                Jours disponibles
              </p>
            </div>

            {/* Barre de progression */}
            {balance && (
              <div className="mb-5 relative z-10">
                <div className="flex justify-between text-xs text-gray-500 mb-2 font-mono">
                  <span>Pris : {Number(balance.annualTaken).toFixed(1)}j</span>
                  <span>Acquis : {Number(balance.annualEntitled).toFixed(1)}j</span>
                </div>
                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${consumedPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"
                  />
                </div>
                {pendingDays > 0 && (
                  <p className="text-xs text-amber-300 mt-2 flex items-center gap-1 animate-pulse">
                    <Hourglass size={11} />
                    {pendingDays} jour(s) en attente de validation
                  </p>
                )}
              </div>
            )}

            <Link
              href="/conges/nouveau"
              className="block w-full py-3.5 bg-white text-slate-900 text-center font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm relative z-10"
            >
              <span className="flex items-center justify-center gap-2">
                <Plus size={18} /> Nouvelle demande
              </span>
            </Link>
          </motion.div>

          {/* Stats mini */}
          {balance && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Acquis en {new Date().getFullYear()}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {Number(balance.acquiredThisYear).toFixed(1)}j
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Taux mensuel</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {Number(balance.monthlyRate).toFixed(2)}j
                </p>
              </div>
            </div>
          )}

          {/* Explication loi */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-xs">
                  <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <Info size={14} /> Droit congolais (Code du travail)
                  </h4>
                  <ul className="space-y-2 text-blue-600 dark:text-blue-400">
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">▸</span>
                      <span><strong>26 jours ouvrables</strong> par an (minimum légal)</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">▸</span>
                      <span><strong>2,17 jours</strong> acquis par mois travaillé</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">▸</span>
                      <span>Éligibilité après <strong>12 mois</strong> d'ancienneté</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">▸</span>
                      <span>Cumul possible sur <strong>3 ans maximum</strong></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">▸</span>
                      <span>Congé maternité : <strong>15 semaines minimum</strong></span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── COLONNE DROITE : HISTORIQUE ── */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 min-h-[500px]">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock size={20} className="text-gray-400" />
              Mes demandes
            </h3>

            {leaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                <Umbrella size={40} className="mb-4 opacity-30" />
                <p className="text-sm font-medium text-gray-400">Aucune demande pour le moment</p>
                <Link
                  href="/conges/nouveau"
                  className="text-sky-500 text-sm font-semibold hover:underline mt-2"
                >
                  Planifier mon premier congé →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {leaves.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700/60 border border-transparent hover:border-gray-100 dark:hover:border-gray-600 rounded-xl transition-all"
                  >
                    {/* Icone type */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        TYPE_COLOR[item.type] || 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.type === 'SICK' ? (
                        <Stethoscope size={20} />
                      ) : (
                        <Umbrella size={20} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {TYPE_LABEL[item.type] || item.type}
                        </p>
                        <span className="text-xs font-mono font-bold bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded text-gray-500 dark:text-gray-300">
                          {item.daysCount}j
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar size={12} />
                        <span className="font-mono">
                          {new Date(item.startDate).toLocaleDateString('fr-FR')} →{' '}
                          {new Date(item.endDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {item.rejectionReason && (
                        <p className="text-xs text-red-400 mt-1 italic truncate">
                          Motif : "{item.rejectionReason}"
                        </p>
                      )}
                    </div>

                    {/* Statut */}
                    <div className="shrink-0">
                      {item.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100">
                          <CheckCircle2 size={13} /> Validé
                        </span>
                      )}
                      {item.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-100">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                          En attente
                        </span>
                      )}
                      {item.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full border border-red-100">
                          <XCircle size={13} /> Refusé
                        </span>
                      )}
                      {item.status === 'CANCELLED' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600">
                          Annulé
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}