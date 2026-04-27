


// 'use client';

// import React, { useState, useEffect, useMemo } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import {
//   ArrowLeft, Plus, Clock, Umbrella, Stethoscope, Loader2,
//   Wallet, AlertCircle, HelpCircle, Info, Calendar,
//   CheckCircle2, XCircle, Hourglass, TrendingUp, Lock
// } from 'lucide-react';
// import { api } from '@/services/api';
// import { motion, AnimatePresence } from 'framer-motion';

// // ✅ CONGO : 26j/an - taux affiché côté front uniquement pour info
// // La vraie source de vérité vient du backend via /leaves/balance
// const CONGO_ANNUAL_DAYS = 26;
// const CONGO_MONTHLY_RATE = (CONGO_ANNUAL_DAYS / 12).toFixed(2); // "2.17"

// interface LeaveBalance {
//   annualEntitled: number;
//   annualTaken: number;
//   annualRemaining: number;
//   monthlyRate: number;
//   annualMax: number;
//   acquiredThisYear: number;
//   monthsWorked: number;
//   canTakeAnnualLeave: boolean;
//   monthsUntilEligible: number;
// }

// const TYPE_LABEL: Record<string, string> = {
//   ANNUAL: 'Congés Payés',
//   SICK: 'Arrêt Maladie',
//   MATERNITY: 'Maternité',
//   PATERNITY: 'Paternité',
//   UNPAID: 'Sans Solde',
//   SPECIAL: 'Événement Familial',
// };

// const TYPE_COLOR: Record<string, string> = {
//   ANNUAL: 'bg-sky-100 dark:bg-sky-900/20 text-sky-500',
//   SICK: 'bg-red-100 dark:bg-red-900/20 text-red-500',
//   MATERNITY: 'bg-pink-100 dark:bg-pink-900/20 text-pink-500',
//   PATERNITY: 'bg-blue-100 dark:bg-blue-900/20 text-blue-500',
//   UNPAID: 'bg-gray-100 dark:bg-gray-700 text-gray-500',
//   SPECIAL: 'bg-violet-100 dark:bg-violet-900/20 text-violet-500',
// };

// export default function MyLeaveSpacePage() {
//   const router = useRouter();
//   const [leaves, setLeaves] = useState<any[]>([]);
//   const [balance, setBalance] = useState<LeaveBalance | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [showExplanation, setShowExplanation] = useState(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [leavesData, balanceData] = await Promise.all([
//           api.get<any[]>('/leaves/me'),
//           api.get<LeaveBalance>('/leaves/balance'),
//         ]);
//         setLeaves(leavesData);
//         setBalance(balanceData);
//       } catch (e) {
//         console.error(e);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   // Congés en attente (info uniquement)
//   const pendingDays = useMemo(
//     () =>
//       leaves
//         .filter((l) => l.status === 'PENDING' && l.type === 'ANNUAL')
//         .reduce((acc, l) => acc + l.daysCount, 0),
//     [leaves],
//   );

//   const consumedPercent = balance
//     ? Math.min(100, (balance.annualTaken / balance.annualEntitled) * 100)
//     : 0;

//   if (isLoading)
//     return (
//       <div className="flex items-center justify-center min-h-[60vh]">
//         <Loader2 className="animate-spin text-sky-500" size={32} />
//       </div>
//     );

//   return (
//     <div className="max-w-[1200px] mx-auto pb-20 space-y-8">

//       {/* ── HEADER ── */}
//       <div className="flex items-center gap-4">
//         <button
//           onClick={() => router.back()}
//           className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
//         >
//           <ArrowLeft size={18} className="text-gray-500" />
//         </button>
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mon Espace Congés</h1>
//           <p className="text-sm text-gray-400">Solde en temps réel · Droit congolais (26j/an)</p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

//         {/* ── COLONNE GAUCHE : SOLDE ── */}
//         <div className="lg:col-span-1 space-y-4">

//           {/* Carte solde principale */}
//           <motion.div
//             initial={{ y: 20, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             className="bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
//           >
//             <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

//             <div className="flex items-center justify-between mb-6 relative z-10">
//               <div className="flex items-center gap-2">
//                 <Wallet size={16} className="text-sky-400" />
//                 <span className="text-xs font-bold tracking-widest uppercase text-gray-400">
//                   Mon Solde
//                 </span>
//               </div>
//               <button
//                 onClick={() => setShowExplanation(!showExplanation)}
//                 className="text-gray-500 hover:text-gray-300 transition-colors"
//               >
//                 <HelpCircle size={18} />
//               </button>
//             </div>

//             {/* Éligibilité */}
//             {balance && !balance.canTakeAnnualLeave && (
//               <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl px-3 py-2 mb-4 flex items-start gap-2 relative z-10">
//                 <Lock size={14} className="text-amber-400 mt-0.5 shrink-0" />
//                 <p className="text-xs text-amber-300">
//                   Congés annuels disponibles dans{' '}
//                   <strong>{balance.monthsUntilEligible} mois</strong> (loi congolaise : 12 mois d'ancienneté requis)
//                 </p>
//               </div>
//             )}

//             <div className="text-center mb-6 relative z-10">
//               <span className="text-6xl font-extrabold tracking-tighter">
//                 {balance ? Number(balance.annualRemaining).toFixed(1) : '—'}
//               </span>
//               <p className="text-sm text-gray-400 mt-1 uppercase tracking-wide">
//                 Jours disponibles
//               </p>
//             </div>

//             {/* Barre de progression */}
//             {balance && (
//               <div className="mb-5 relative z-10">
//                 <div className="flex justify-between text-xs text-gray-500 mb-2 font-mono">
//                   <span>Pris : {Number(balance.annualTaken).toFixed(1)}j</span>
//                   <span>Acquis : {Number(balance.annualEntitled).toFixed(1)}j</span>
//                 </div>
//                 <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
//                   <motion.div
//                     initial={{ width: 0 }}
//                     animate={{ width: `${consumedPercent}%` }}
//                     transition={{ duration: 0.8, ease: 'easeOut' }}
//                     className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"
//                   />
//                 </div>
//                 {pendingDays > 0 && (
//                   <p className="text-xs text-amber-300 mt-2 flex items-center gap-1 animate-pulse">
//                     <Hourglass size={11} />
//                     {pendingDays} jour(s) en attente de validation
//                   </p>
//                 )}
//               </div>
//             )}

//             <Link
//               href="/conges/nouveau"
//               className="block w-full py-3.5 bg-white text-slate-900 text-center font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm relative z-10"
//             >
//               <span className="flex items-center justify-center gap-2">
//                 <Plus size={18} /> Nouvelle demande
//               </span>
//             </Link>
//           </motion.div>

//           {/* Stats mini */}
//           {balance && (
//             <div className="grid grid-cols-2 gap-3">
//               <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
//                 <p className="text-xs text-gray-400 mb-1">Acquis en {new Date().getFullYear()}</p>
//                 <p className="text-xl font-bold text-gray-900 dark:text-white">
//                   {Number(balance.acquiredThisYear).toFixed(1)}j
//                 </p>
//               </div>
//               <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
//                 <p className="text-xs text-gray-400 mb-1">Taux mensuel</p>
//                 <p className="text-xl font-bold text-gray-900 dark:text-white">
//                   {Number(balance.monthlyRate).toFixed(2)}j
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* Explication loi */}
//           <AnimatePresence>
//             {showExplanation && (
//               <motion.div
//                 initial={{ opacity: 0, height: 0 }}
//                 animate={{ opacity: 1, height: 'auto' }}
//                 exit={{ opacity: 0, height: 0 }}
//                 className="overflow-hidden"
//               >
//                 <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-xs">
//                   <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
//                     <Info size={14} /> Droit congolais (Code du travail)
//                   </h4>
//                   <ul className="space-y-2 text-blue-600 dark:text-blue-400">
//                     <li className="flex items-start gap-1.5">
//                       <span className="text-blue-400 mt-0.5">▸</span>
//                       <span><strong>26 jours ouvrables</strong> par an (minimum légal)</span>
//                     </li>
//                     <li className="flex items-start gap-1.5">
//                       <span className="text-blue-400 mt-0.5">▸</span>
//                       <span><strong>2,17 jours</strong> acquis par mois travaillé</span>
//                     </li>
//                     <li className="flex items-start gap-1.5">
//                       <span className="text-blue-400 mt-0.5">▸</span>
//                       <span>Éligibilité après <strong>12 mois</strong> d'ancienneté</span>
//                     </li>
//                     <li className="flex items-start gap-1.5">
//                       <span className="text-blue-400 mt-0.5">▸</span>
//                       <span>Cumul possible sur <strong>3 ans maximum</strong></span>
//                     </li>
//                     <li className="flex items-start gap-1.5">
//                       <span className="text-blue-400 mt-0.5">▸</span>
//                       <span>Congé maternité : <strong>15 semaines minimum</strong></span>
//                     </li>
//                   </ul>
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>

//         {/* ── COLONNE DROITE : HISTORIQUE ── */}
//         <div className="lg:col-span-2">
//           <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 min-h-[500px]">
//             <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//               <Clock size={20} className="text-gray-400" />
//               Mes demandes
//             </h3>

//             {leaves.length === 0 ? (
//               <div className="flex flex-col items-center justify-center py-20 text-gray-300">
//                 <Umbrella size={40} className="mb-4 opacity-30" />
//                 <p className="text-sm font-medium text-gray-400">Aucune demande pour le moment</p>
//                 <Link
//                   href="/conges/nouveau"
//                   className="text-sky-500 text-sm font-semibold hover:underline mt-2"
//                 >
//                   Planifier mon premier congé →
//                 </Link>
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 {leaves.map((item, i) => (
//                   <motion.div
//                     key={item.id}
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: i * 0.04 }}
//                     className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700/60 border border-transparent hover:border-gray-100 dark:hover:border-gray-600 rounded-xl transition-all"
//                   >
//                     {/* Icone type */}
//                     <div
//                       className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
//                         TYPE_COLOR[item.type] || 'bg-gray-100 text-gray-500'
//                       }`}
//                     >
//                       {item.type === 'SICK' ? (
//                         <Stethoscope size={20} />
//                       ) : (
//                         <Umbrella size={20} />
//                       )}
//                     </div>

//                     {/* Info */}
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center gap-2 mb-0.5">
//                         <p className="font-semibold text-gray-900 dark:text-white text-sm">
//                           {TYPE_LABEL[item.type] || item.type}
//                         </p>
//                         <span className="text-xs font-mono font-bold bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded text-gray-500 dark:text-gray-300">
//                           {item.daysCount}j
//                         </span>
//                       </div>
//                       <div className="flex items-center gap-1.5 text-xs text-gray-400">
//                         <Calendar size={12} />
//                         <span className="font-mono">
//                           {new Date(item.startDate).toLocaleDateString('fr-FR')} →{' '}
//                           {new Date(item.endDate).toLocaleDateString('fr-FR')}
//                         </span>
//                       </div>
//                       {item.rejectionReason && (
//                         <p className="text-xs text-red-400 mt-1 italic truncate">
//                           Motif : "{item.rejectionReason}"
//                         </p>
//                       )}
//                     </div>

//                     {/* Statut */}
//                     <div className="shrink-0">
//                       {item.status === 'APPROVED' && (
//                         <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100">
//                           <CheckCircle2 size={13} /> Validé
//                         </span>
//                       )}
//                       {item.status === 'PENDING' && (
//                         <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-100">
//                           <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
//                           En attente
//                         </span>
//                       )}
//                       {item.status === 'REJECTED' && (
//                         <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full border border-red-100">
//                           <XCircle size={13} /> Refusé
//                         </span>
//                       )}
//                       {item.status === 'CANCELLED' && (
//                         <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600">
//                           Annulé
//                         </span>
//                       )}
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
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
  Wallet, HelpCircle, Info, Calendar, CheckCircle2, XCircle,
  Hourglass, Lock, TrendingUp, ArrowRight, RotateCcw, Banknote,
  Baby, User, Ban
} from 'lucide-react';
import { api } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useBasePath } from '@/hooks/useBasePath';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaveBalance {
  id:                  string;
  annualEntitled:      number;
  annualTaken:         number;
  annualRemaining:     number;
  carriedForward:      number;
  monthlyRate:         number;
  annualMax:           number;
  maxCumulDays:        number;
  acquiredThisYear:    number;
  monthsWorked:        number;
  canTakeAnnualLeave:  boolean;
  monthsUntilEligible: number;
  daysUntilNextAccrual: number;
  isNearCumulLimit:    boolean;
  year:                number;
}

interface LeaveIndemnity {
  indemnity:       number;
  basedOnAverage:  number;
  monthsUsed:      number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  ANNUAL:       'Congés Payés', SICK: 'Arrêt Maladie',
  MATERNITY:    'Maternité',    PATERNITY: 'Paternité',
  UNPAID:       'Sans Solde',   COMPENSATORY: 'Compensatoire',
  SPECIAL:      'Événement Familial',
};

const TYPE_ICON: Record<string, React.ElementType> = {
  ANNUAL: Umbrella, SICK: Stethoscope, MATERNITY: Baby,
  PATERNITY: User, UNPAID: Ban, COMPENSATORY: RotateCcw, SPECIAL: Calendar,
};

const TYPE_COLOR: Record<string, string> = {
  ANNUAL:    'bg-sky-100 dark:bg-sky-900/20 text-sky-500',
  SICK:      'bg-red-100 dark:bg-red-900/20 text-red-500',
  MATERNITY: 'bg-pink-100 dark:bg-pink-900/20 text-pink-500',
  PATERNITY: 'bg-blue-100 dark:bg-blue-900/20 text-blue-500',
  UNPAID:    'bg-gray-100 dark:bg-gray-700 text-gray-500',
  COMPENSATORY: 'bg-violet-100 dark:bg-violet-900/20 text-violet-500',
  SPECIAL:   'bg-amber-100 dark:bg-amber-900/20 text-amber-500',
};

const fmtXAF = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' F';

// ─── Composant principal ─────────────────────────────────────────────────────

export default function MyLeaveSpacePage() {
  const router = useRouter();
  const { bp } = useBasePath();
  const [leaves, setLeaves]       = useState<any[]>([]);
  const [balance, setBalance]     = useState<LeaveBalance | null>(null);
  const [indemnity, setIndemnity] = useState<LeaveIndemnity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHelp, setShowHelp]   = useState(false);
  const [myEmpId, setMyEmpId]     = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [leavesData, balanceData] = await Promise.all([
          api.get<any[]>('/leaves/me'),
          api.get<LeaveBalance>('/leaves/me/balance'),
        ]);
        setLeaves(leavesData);
        setBalance(balanceData);

        // Récupérer l'ID employé pour les calculs d'indemnité
        const emp = await api.get<any>('/employees/me').catch(() => null);
        if (emp?.id) {
          setMyEmpId(emp.id);
          // Indemnité estimée sur 10 jours (simulation)
          const ind = await api.get<LeaveIndemnity>(
            `/leaves/indemnity/${emp.id}?days=10`
          ).catch(() => null);
          setIndemnity(ind);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const pendingDays = useMemo(
    () => leaves.filter(l => l.status === 'PENDING' && l.type === 'ANNUAL').reduce((s, l) => s + l.daysCount, 0),
    [leaves]
  );

  const consumedPct = balance
    ? Math.min(100, balance.annualEntitled > 0 ? (balance.annualTaken / balance.annualEntitled) * 100 : 0)
    : 0;

  const cumulPct = balance
    ? Math.min(100, (balance.annualRemaining / balance.maxCumulDays) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-sky-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-8">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mon Espace Congés</h1>
          <p className="text-sm text-gray-400">Solde temps réel · Code du travail Congo (26j/an)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── COLONNE GAUCHE : SOLDE ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Carte principale solde */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-5 relative z-10">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-sky-400" />
                <span className="text-xs font-bold tracking-widest uppercase text-gray-400">Mon Solde {balance?.year}</span>
              </div>
              <button onClick={() => setShowHelp(!showHelp)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <HelpCircle size={18} />
              </button>
            </div>

            {/* Alerte éligibilité */}
            {balance && !balance.canTakeAnnualLeave && (
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl px-3 py-2 mb-4 flex items-start gap-2 relative z-10">
                <Lock size={14} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-300">
                  Congés annuels disponibles dans <strong>{balance.monthsUntilEligible} mois</strong> (12 mois d'ancienneté requis)
                </p>
              </div>
            )}

            {/* Alerte plafond critique */}
            {balance?.isNearCumulLimit && balance.canTakeAnnualLeave && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-3 py-2 mb-4 flex items-start gap-2 relative z-10">
                <TrendingUp size={14} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-300">
                  Vous approchez le plafond légal (78j). Pensez à planifier vos congés.
                </p>
              </div>
            )}

            {/* Solde principal */}
            <div className="text-center mb-5 relative z-10">
              <span className="text-6xl font-extrabold tracking-tighter">
                {balance ? Number(balance.annualRemaining).toFixed(1) : '—'}
              </span>
              <p className="text-sm text-gray-400 mt-1 uppercase tracking-wide">Jours disponibles</p>
            </div>

            {/* Barre utilisation */}
            {balance && (
              <div className="mb-5 relative z-10">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-mono">
                  <span>Pris : {Number(balance.annualTaken).toFixed(1)}j</span>
                  <span>Acquis : {Number(balance.annualEntitled).toFixed(1)}j</span>
                </div>
                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${consumedPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"
                  />
                </div>
                {pendingDays > 0 && (
                  <p className="text-xs text-amber-300 mt-1.5 flex items-center gap-1 animate-pulse">
                    <Hourglass size={11} /> {pendingDays} jour(s) en attente
                  </p>
                )}
              </div>
            )}

            {/* Barre cumul / plafond */}
            {balance && balance.canTakeAnnualLeave && (
              <div className="mb-5 relative z-10">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-mono">
                  <span>Cumul : {Number(balance.annualRemaining).toFixed(1)}j</span>
                  <span>Plafond : {balance.maxCumulDays}j</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cumulPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                    className={`h-full rounded-full ${cumulPct >= 90 ? 'bg-red-400' : cumulPct >= 75 ? 'bg-amber-400' : 'bg-sky-400'}`}
                  />
                </div>
              </div>
            )}

            <Link href={bp('/conges/nouveau')} className="block w-full py-3.5 bg-white text-slate-900 text-center font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm relative z-10">
              <span className="flex items-center justify-center gap-2">
                <Plus size={18} /> Nouvelle demande
              </span>
            </Link>
          </motion.div>

          {/* Stats mini : 4 cases */}
          {balance && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Acquis cette année</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{Number(balance.acquiredThisYear).toFixed(1)}j</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Taux mensuel</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{Number(balance.monthlyRate).toFixed(2)}j</p>
              </div>
              {/* Report année précédente */}
              <div className={`rounded-xl p-4 border ${balance.carriedForward > 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                <div className="flex items-center gap-1 mb-1">
                  <RotateCcw size={12} className={balance.carriedForward > 0 ? 'text-blue-500' : 'text-gray-400'} />
                  <p className="text-xs text-gray-400">Report N-1</p>
                </div>
                <p className={`text-xl font-bold ${balance.carriedForward > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-300'}`}>
                  {balance.carriedForward > 0 ? `+${Number(balance.carriedForward).toFixed(1)}j` : '0j'}
                </p>
              </div>
              {/* Prochain gain */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Prochain gain</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  dans {balance.daysUntilNextAccrual}j
                </p>
                <p className="text-xs text-emerald-500">+{Number(balance.monthlyRate).toFixed(2)}j</p>
              </div>
            </div>
          )}

          {/* Simulation indemnité */}
          {indemnity && balance?.canTakeAnnualLeave && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Banknote size={16} className="text-emerald-500" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">Indemnité estimée</p>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Pour 10 jours de congé, basé sur vos {indemnity.monthsUsed > 0 ? `${indemnity.monthsUsed} derniers bulletins` : 'salaire de base'}
              </p>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {fmtXAF(indemnity.indemnity)}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                  Base : {fmtXAF(indemnity.basedOnAverage)} / mois moyen
                </p>
              </div>
              {indemnity.monthsUsed < 12 && (
                <p className="text-xs text-gray-400 mt-2 flex items-start gap-1">
                  <Info size={11} className="mt-0.5 shrink-0" />
                  Estimation sur {indemnity.monthsUsed} mois. L'indemnité sera plus précise après 12 mois de bulletins.
                </p>
              )}
            </div>
          )}

          {/* Explications loi Congo */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-xs">
                  <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <Info size={14} /> Droit congolais (Code du travail Loi n°45-75)
                  </h4>
                  <ul className="space-y-2 text-blue-600 dark:text-blue-400">
                    {[
                      ['26 jours ouvrables par an', 'minimum légal'],
                      ['2,17 jours acquis par mois', 'acquisition mensuelle automatique'],
                      ['Éligibilité après 12 mois', 'de service continu'],
                      ['Cumul max 3 ans = 78 jours', 'plafond légal absolu'],
                      ['Indemnité = moyenne 12 mois', 'salaire + heures sup + primes'],
                      ['Congé maternité : 15 semaines', 'minimum 105 jours calendaires'],
                    ].map(([title, sub]) => (
                      <li key={title} className="flex items-start gap-1.5">
                        <span className="text-blue-400 mt-0.5">▸</span>
                        <span><strong>{title}</strong> — {sub}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── COLONNE DROITE : HISTORIQUE ── */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Clock size={20} className="text-gray-400" /> Mes demandes
              </h3>
              <Link href={bp('/conges/nouveau')} className="text-sm text-sky-500 font-semibold hover:underline flex items-center gap-1">
                Nouvelle <ArrowRight size={14} />
              </Link>
            </div>

            {leaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                <Umbrella size={40} className="mb-4 opacity-30" />
                <p className="text-sm font-medium text-gray-400">Aucune demande pour le moment</p>
                <Link href={bp('/conges/nouveau')} className="text-sky-500 text-sm font-semibold hover:underline mt-2">
                  Planifier mon premier congé →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {leaves.map((item, i) => {
                  const Icon = TYPE_ICON[item.type] ?? Umbrella;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700/60 border border-transparent hover:border-gray-100 dark:hover:border-gray-600 rounded-xl transition-all"
                    >
                      {/* Icone type */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLOR[item.type] ?? 'bg-gray-100 text-gray-500'}`}>
                        <Icon size={20} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {TYPE_LABELS[item.type] ?? item.type}
                          </p>
                          <span className="text-xs font-mono font-bold bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded text-gray-500 dark:text-gray-300">
                            {item.daysCount}j
                          </span>
                          {/* Badge congé non payé */}
                          {item.type === 'UNPAID' && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">
                              0 indemnité
                            </span>
                          )}
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}