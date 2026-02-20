// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { ArrowLeft, Calculator, CheckCircle2, Loader2, Gift, AlertCircle } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';

// import EmployeeSelector from './components/EmployeeSelector';
// import OvertimeSection from './components/OvertimeSection';
// import DeductionsSection from './components/DeductionsSection';
// import PayrollPreviewCard from './components/PayrollPreviewCard';

// export default function CreatePayrollPage() {
//   const router = useRouter();
  
//   const [employees, setEmployees] = useState<any[]>([]);
//   const [settings, setSettings] = useState<any>(null);
//   const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
//   const [isLoadingData, setIsLoadingData] = useState(true);
  
//   const now = new Date();
//   const [month, setMonth] = useState(now.toLocaleString('fr-FR', { month: 'long' }));
//   const [year, setYear] = useState(now.getFullYear());
  
//   const [workedDays, setWorkedDays] = useState(26);

//   // ✅ 4 catégories Décret 78-360 (remplace overtime15 / overtime50)
//   const [overtime10, setOvertime10]   = useState(0);
//   const [overtime25, setOvertime25]   = useState(0);
//   const [overtime50, setOvertime50]   = useState(0);
//   const [overtime100, setOvertime100] = useState(0);
  
//   const [autoLoans, setAutoLoans] = useState<any[]>([]);
//   const [autoAdvances, setAutoAdvances] = useState<any[]>([]);
//   const [totalLoanDeduction, setTotalLoanDeduction] = useState(0);
//   const [totalAdvanceDeduction, setTotalAdvanceDeduction] = useState(0);

//   const [employeeBonuses, setEmployeeBonuses] = useState<any[]>([]);
//   const [totalBonuses, setTotalBonuses] = useState(0);
  
//   const [calculation, setCalculation] = useState<any>(null);
//   const [isCalculating, setIsCalculating] = useState(false);
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [createdPayrollId, setCreatedPayrollId] = useState<string | null>(null);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         const [empsData, settingsData] = await Promise.all([
//           api.get('/employees'),
//           api.get('/payroll-settings')
//         ]) as [any, any];
        
//         setEmployees(Array.isArray(empsData) ? empsData : []);
//         setSettings(settingsData || {
//           cnssSalarialRate: 4,
//           cnssEmployerRate: 16,
//           cnssCeiling: 1200000,
//           overtimeRate10: 10,
//           overtimeRate25: 25,
//           overtimeRate50: 50,
//           overtimeRate100: 100,
//           workHoursPerDay: 8,
//           workDaysPerMonth: 26,
//           itsBrackets: '[]'
//         });
//       } catch (e) {
//         console.error('Erreur chargement:', e);
//         setEmployees([]);
//       } finally {
//         setIsLoadingData(false);
//       }
//     };
//     loadData();
//   }, []);

//   useEffect(() => {
//     if (!selectedEmployee) {
//       resetEmployeeData();
//       return;
//     }
//     loadEmployeeData();
//   }, [selectedEmployee, month, year]);

//   const resetEmployeeData = () => {
//     setOvertime10(0);
//     setOvertime25(0);
//     setOvertime50(0);
//     setOvertime100(0);
//     setAutoLoans([]);
//     setAutoAdvances([]);
//     setTotalLoanDeduction(0);
//     setTotalAdvanceDeduction(0);
//     setEmployeeBonuses([]);
//     setTotalBonuses(0);
//     setCalculation(null);
//   };

//   const loadEmployeeData = async () => {
//     if (!selectedEmployee) return;
//     try {
//       const monthNum = getMonthNumber(month);
      
//       // ✅ Pointage — 4 catégories
//       try {
//         const summary: any = await api.get(`/attendance/summary/${selectedEmployee.id}/${monthNum}/${year}`);
//         if (summary) {
//           setOvertime10(Number(summary.overtime10Hours  || 0));
//           setOvertime25(Number(summary.overtime25Hours  || 0));
//           setOvertime50(Number(summary.overtime50Hours  || 0));
//           setOvertime100(Number(summary.overtime100Hours || 0));
//         }
//       } catch {}

//       // Prêts actifs
//       try {
//         const loansData: any = await api.get('/loans');
//         const activeLoans = (Array.isArray(loansData) ? loansData : []).filter((l: any) => 
//           l.employeeId === selectedEmployee.id && l.status === 'ACTIVE'
//         );
//         setAutoLoans(activeLoans);
//         setTotalLoanDeduction(activeLoans.reduce((s: number, l: any) => s + (l.monthlyRepayment || 0), 0));
//       } catch {}

//       // Avances
//       try {
//         const advancesData: any = await api.get('/loans/advances');
//         const pendingAdvances = (Array.isArray(advancesData) ? advancesData : []).filter((a: any) => 
//           a.employeeId === selectedEmployee.id && 
//           a.deductMonth === monthNum && 
//           a.deductYear === year && 
//           a.status === 'APPROVED'
//         );
//         setAutoAdvances(pendingAdvances);
//         setTotalAdvanceDeduction(pendingAdvances.reduce((s: number, a: any) => s + (a.amount || 0), 0));
//       } catch {}

//       // Primes récurrentes
//       try {
//         const bonusesData: any = await api.get(`/employee-bonuses?employeeId=${selectedEmployee.id}`);
//         const bonuses = Array.isArray(bonusesData) ? bonusesData : bonusesData?.data || [];
//         const recurringBonuses = bonuses.filter((b: any) => b.isRecurring || b.source === 'AUTOMATIC');

//         let bonusTotal = 0;
//         const enrichedBonuses = recurringBonuses.map((b: any) => {
//           let amount = b.amount || 0;
//           if (b.percentage && !b.amount) {
//             const base = b.baseCalculation === 'GROSS_SALARY'
//               ? (selectedEmployee.baseSalary || 0) * 1.1
//               : (selectedEmployee.baseSalary || 0);
//             amount = Math.floor(base * b.percentage / 100);
//           }
//           bonusTotal += amount;
//           return { ...b, computedAmount: amount };
//         });

//         setEmployeeBonuses(enrichedBonuses);
//         setTotalBonuses(bonusTotal);
//       } catch {}

//     } catch (e) {
//       console.error('Erreur chargement données employé:', e);
//       resetEmployeeData();
//     }
//   };

//   const getMonthNumber = (m: string) => {
//     const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
//     const idx = months.indexOf(m.toLowerCase());
//     return idx !== -1 ? idx + 1 : 1;
//   };

//   // ============================================
//   // 💰 CALCUL PAIE — 4 taux Décret 78-360
//   // ============================================
//   const calculatePayroll = async () => {
//     if (!selectedEmployee || !settings) return;
    
//     setIsCalculating(true);
//     await new Promise(r => setTimeout(r, 500));

//     try {
//       const base = Number(selectedEmployee.baseSalary || 0);
//       if (base === 0) {
//         alert('Salaire de base invalide');
//         setIsCalculating(false);
//         return;
//       }
      
//       const workHoursPerMonth = (settings.workHoursPerDay || 8) * (settings.workDaysPerMonth || 26);
//       const hourlyRate = base / workHoursPerMonth;

//       // ✅ 4 catégories avec plancher légal
//       const rate10  = Math.max(10,  Number(settings.overtimeRate10  ?? 10))  / 100;
//       const rate25  = Math.max(25,  Number(settings.overtimeRate25  ?? 25))  / 100;
//       const rate50  = Math.max(50,  Number(settings.overtimeRate50  ?? 50))  / 100;
//       const rate100 = Math.max(100, Number(settings.overtimeRate100 ?? 100)) / 100;

//       const ot10Amount  = Math.floor(hourlyRate * (overtime10  || 0) * (1 + rate10));
//       const ot25Amount  = Math.floor(hourlyRate * (overtime25  || 0) * (1 + rate25));
//       const ot50Amount  = Math.floor(hourlyRate * (overtime50  || 0) * (1 + rate50));
//       const ot100Amount = Math.floor(hourlyRate * (overtime100 || 0) * (1 + rate100));
//       const totalOT     = ot10Amount + ot25Amount + ot50Amount + ot100Amount;

//       // Primes incluses dans le brut
//       const grossBeforeBonuses = base + totalOT;
//       const gross = grossBeforeBonuses + totalBonuses;

//       // ✅ CNSS conditionnelle
//       let cnssEmp = 0;
//       const isSubjectToCnss = selectedEmployee.isSubjectToCnss ?? true;
//       if (isSubjectToCnss) {
//         const cnssRate = (settings.cnssSalarialRate || 4) / 100;
//         const cnssBase = Math.min(grossBeforeBonuses, settings.cnssCeiling || 1200000);
//         cnssEmp = Math.floor(cnssBase * cnssRate);
//       }

//       // ✅ IRPP/ITS conditionnel
//       let its = 0;
//       const isSubjectToIrpp = selectedEmployee.isSubjectToIrpp ?? true;
//       if (isSubjectToIrpp) {
//         const taxableNet = gross - cnssEmp;
//         try {
//           const brackets = JSON.parse(settings.itsBrackets || '[]');
//           if (Array.isArray(brackets) && brackets.length > 0) {
//             brackets.sort((a: any, b: any) => (a.min || 0) - (b.min || 0));
//             for (const bracket of brackets) {
//               if (taxableNet > (bracket.min || 0)) {
//                 const inBracket = Math.min(taxableNet, bracket.max || Infinity) - (bracket.min || 0);
//                 if (inBracket > 0) its += inBracket * (bracket.rate || 0);
//               }
//             }
//           } else if (taxableNet > 50000) {
//             its = (taxableNet - 50000) * 0.20;
//           }
//         } catch {
//           if (gross - cnssEmp > 50000) its = (gross - cnssEmp - 50000) * 0.20;
//         }
//         its = Math.floor(its);
//       }

//       const totalDeductions = cnssEmp + its + totalLoanDeduction + totalAdvanceDeduction;
//       const net = Math.floor(gross - totalDeductions);

//       setCalculation({
//         baseSalary: base,
//         grossSalary: Math.floor(gross),
//         netSalary: net,
//         cnssEmployee: cnssEmp,
//         its,
//         // ✅ 4 montants distincts
//         overtimeAmount10:  ot10Amount,
//         overtimeAmount25:  ot25Amount,
//         overtimeAmount50:  ot50Amount,
//         overtimeAmount100: ot100Amount,
//         overtimeTotal: totalOT,
//         bonusesTotal: totalBonuses,
//         bonuses: employeeBonuses,
//         loanDeductions: totalLoanDeduction,
//         advanceDeductions: totalAdvanceDeduction,
//         isSubjectToCnss,
//         isSubjectToIrpp,
//         parametersUsed: {
//           cnssRate: isSubjectToCnss ? (settings.cnssSalarialRate || 4) : 0,
//         }
//       });
//     } catch (error) {
//       console.error('Erreur calcul:', error);
//       alert('Erreur lors du calcul');
//     } finally {
//       setIsCalculating(false);
//     }
//   };

//   const submitPayroll = async () => {
//     if (!selectedEmployee || !calculation) return;
//     try {
//       const result: any = await api.post('/payrolls', {
//         employeeId: selectedEmployee.id,
//         month: getMonthNumber(month),
//         year,
//         workedDays,
//         // ✅ 4 champs
//         overtime10:  overtime10  || 0,
//         overtime25:  overtime25  || 0,
//         overtime50:  overtime50  || 0,
//         overtime100: overtime100 || 0,
//         bonuses: employeeBonuses.map(b => ({ id: b.id, amount: b.computedAmount })),
//         deductions: []
//       });
//       setCreatedPayrollId(result?.id || null);
//       setShowSuccess(true);
//     } catch (e: any) {
//       console.error('Erreur création:', e);
//       alert(`Erreur: ${e.response?.data?.message || e.message}`);
//     }
//   };

//   if (isLoadingData) return (
//     <div className="min-h-screen flex items-center justify-center">
//       <Loader2 className="animate-spin text-sky-500" size={32} />
//     </div>
//   );

//   return (
//     <div className="max-w-[1600px] mx-auto pb-20 relative px-4">
      
//       <div className="flex items-center gap-4 mb-8">
//         <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
//           <ArrowLeft size={20} className="text-gray-500" />
//         </button>
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créer une fiche de paie</h1>
//           <p className="text-gray-500 dark:text-gray-400 text-sm">
//             Période : <span className="text-sky-500 font-bold capitalize">{month} {year}</span>
//           </p>
//         </div>
//       </div>

//       <div className="grid lg:grid-cols-5 gap-8 items-start">
//         <div className="lg:col-span-3 space-y-6">
          
//           <EmployeeSelector
//             selectedEmployee={selectedEmployee}
//             employees={employees}
//             onSelect={(emp) => { setSelectedEmployee(emp); setCalculation(null); }}
//             onClear={() => { setSelectedEmployee(null); setCalculation(null); }}
//           />

//           {/* PRIMES AFFICHÉES */}
//           {selectedEmployee && employeeBonuses.length > 0 && (
//             <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
//               className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/10 dark:to-sky-900/10 rounded-2xl border border-cyan-200 dark:border-cyan-800 p-6">
//               <h3 className="text-lg font-bold text-cyan-900 dark:text-cyan-200 mb-4 flex items-center gap-2">
//                 <Gift size={20} /> Primes applicables ce mois
//               </h3>
//               <div className="space-y-2">
//                 {employeeBonuses.map((b: any) => (
//                   <div key={b.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-cyan-100 dark:border-cyan-900/30">
//                     <div>
//                       <p className="text-sm font-bold text-gray-900 dark:text-white">{b.bonusType}</p>
//                       <p className="text-xs text-gray-500">{b.isRecurring ? 'Récurrente' : 'Ponctuelle'} {b.source === 'AUTOMATIC' ? '· Auto convention' : ''}</p>
//                     </div>
//                     <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">+{b.computedAmount.toLocaleString('fr-FR')} FCFA</span>
//                   </div>
//                 ))}
//                 <div className="flex justify-between items-center pt-2 border-t border-cyan-200 dark:border-cyan-800 mt-2">
//                   <span className="text-sm font-bold text-cyan-800 dark:text-cyan-200">Total primes</span>
//                   <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">+{totalBonuses.toLocaleString('fr-FR')} FCFA</span>
//                 </div>
//               </div>
//             </motion.section>
//           )}

//           {/* ALERTE exemption fiscale */}
//           {selectedEmployee && (!selectedEmployee.isSubjectToCnss || !selectedEmployee.isSubjectToIrpp) && (
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//               className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-xl flex items-start gap-3">
//               <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
//               <div className="text-sm">
//                 <p className="font-bold text-amber-800 dark:text-amber-200">Exemptions fiscales détectées</p>
//                 <p className="text-amber-600 dark:text-amber-400 text-xs mt-0.5">
//                   {!selectedEmployee.isSubjectToCnss && '• CNSS salariale : 0% (exempté) '}
//                   {!selectedEmployee.isSubjectToIrpp && '• IRPP/ITS : 0 FCFA (exempté)'}
//                 </p>
//               </div>
//             </motion.div>
//           )}

//           {selectedEmployee && (
//             <OvertimeSection
//               month={month} year={year}
//               overtime10={overtime10}   overtime25={overtime25}
//               overtime50={overtime50}   overtime100={overtime100}
//               onOvertime10Change={(v)  => { setOvertime10(v);  setCalculation(null); }}
//               onOvertime25Change={(v)  => { setOvertime25(v);  setCalculation(null); }}
//               onOvertime50Change={(v)  => { setOvertime50(v);  setCalculation(null); }}
//               onOvertime100Change={(v) => { setOvertime100(v); setCalculation(null); }}
//               overtimeRate10={settings?.overtimeRate10   || 10}
//               overtimeRate25={settings?.overtimeRate25   || 25}
//               overtimeRate50={settings?.overtimeRate50   || 50}
//               overtimeRate100={settings?.overtimeRate100 || 100}
//             />
//           )}

//           {selectedEmployee && (
//             <DeductionsSection
//               month={month} year={year}
//               loans={autoLoans} advances={autoAdvances}
//               totalLoanDeduction={totalLoanDeduction}
//               totalAdvanceDeduction={totalAdvanceDeduction}
//             />
//           )}

//           <button onClick={calculatePayroll} disabled={!selectedEmployee || isCalculating}
//             className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all ${!selectedEmployee ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 hover:scale-[1.01]'}`}>
//             {isCalculating ? <Loader2 className="animate-spin" /> : <Calculator size={20} />}
//             {isCalculating ? 'Calcul en cours...' : 'Calculer le Bulletin'}
//           </button>
//         </div>

//         <div className="lg:col-span-2">
//           <PayrollPreviewCard
//             calculation={calculation} month={month} year={year}
//             overtime10={overtime10}   overtime25={overtime25}
//             overtime50={overtime50}   overtime100={overtime100}
//             loansCount={autoLoans.length} advancesCount={autoAdvances.length}
//             onSubmit={submitPayroll}
//           />
//         </div>
//       </div>

//       <AnimatePresence>
//         {showSuccess && (
//           <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//             <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center">
//               <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-6" />
//               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bulletin Créé !</h2>
//               <p className="text-gray-500 dark:text-gray-400 mb-8">La fiche de paie a été générée avec succès.</p>
//               <div className="flex gap-3">
//                 <button onClick={() => { setShowSuccess(false); setCalculation(null); setSelectedEmployee(null); }}
//                   className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700">
//                   Nouveau
//                 </button>
//                 {createdPayrollId && (
//                   <button onClick={() => router.push(`/paie/bulletins/${createdPayrollId}`)}
//                     className="flex-1 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 shadow-lg">
//                     Voir bulletin
//                   </button>
//                 )}
//                 <button onClick={() => router.push('/paie')}
//                   className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg">
//                   Liste paie
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }


'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Calculator, CheckCircle2, Loader2, Gift,
  AlertCircle, Clock, Moon, DollarSign, CreditCard, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import EmployeeSelector from './components/EmployeeSelector';

// ============================================================================
// Types — ce que le back retourne depuis /payrolls/simulate
// ============================================================================
interface SimulationResult {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    baseSalary: number;
    isSubjectToCnss: boolean;
    isSubjectToIrpp: boolean;
    taxExemptionReason?: string;
  };
  month: number;
  year: number;
  daysToPay: number;
  workDays: number;
  overtime: {
    hours10: number; amount10: number;
    hours25: number; amount25: number;
    hours50: number; amount50: number;
    hours100: number; amount100: number;
    total: number;
  };
  bonuses: Array<{
    id: string;
    bonusType: string;
    amount: number;
    isAutomatic: boolean;
    source: string;
    details?: string;
  }>;
  totalBonuses: number;
  adjustedBaseSalary: number;
  absenceDeduction: number;
  grossSalary: number;
  cnssSalarial: number;
  cnssEmployer: number;
  its: number;
  irppDetails?: any;
  loans: Array<{ id: string; monthlyRepayment: number; remainingBalance: number }>;
  advances: Array<{ id: string; amount: number; createdAt: string }>;
  totalLoanDeduction: number;
  totalAdvanceDeduction: number;
  totalDeductions: number;
  netSalary: number;
  totalEmployerCost: number;
  settings: {
    cnssSalarialRate: number;
    cnssEmployerRate: number;
    cnssCeiling: number;
    overtimeRate10: number;
    overtimeRate25: number;
    overtimeRate50: number;
    overtimeRate100: number;
  };
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function CreatePayrollPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const now = new Date();
  const [month, setMonth] = useState(MONTHS[now.getMonth()]);
  const [year, setYear] = useState(now.getFullYear());

  // ✅ Heures sup corrigées par le RH (override du pointage)
  const [overtime10, setOvertime10]   = useState(0);
  const [overtime25, setOvertime25]   = useState(0);
  const [overtime50, setOvertime50]   = useState(0);
  const [overtime100, setOvertime100] = useState(0);
  const [overtimeOverridden, setOvertimeOverridden] = useState(false);

  // ✅ Résultat de la simulation — vient entièrement du back
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPayrollId, setCreatedPayrollId] = useState<string | null>(null);

  // Chargement liste employés
  useEffect(() => {
    api.get('/employees')
      .then((data: any) => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => setEmployees([]))
      .finally(() => setIsLoadingData(false));
  }, []);

  // Relancer la simulation quand on change d'employé ou de période
  useEffect(() => {
    if (!selectedEmployee) {
      setSimulation(null);
      setOvertimeOverridden(false);
      return;
    }
    runSimulation();
  }, [selectedEmployee, month, year]);

  // Si le RH modifie les heures sup, relancer la simulation avec les nouvelles valeurs
  useEffect(() => {
    if (!selectedEmployee || !overtimeOverridden) return;
    runSimulation(true);
  }, [overtime10, overtime25, overtime50, overtime100]);

  const getMonthNumber = (m: string) =>
    MONTHS.findIndex(x => x.toLowerCase() === m.toLowerCase()) + 1;

  // ============================================================================
  // 🔮 APPEL SIMULATE — LE BACK CALCULE TOUT
  // ============================================================================
  const runSimulation = async (withOvertimeOverride = false) => {
    if (!selectedEmployee) return;
    setIsSimulating(true);
    setSimulationError(null);

    try {
      const body: any = {
        employeeId: selectedEmployee.id,
        month: getMonthNumber(month),
        year,
      };

      // Si le RH a modifié les heures sup, les envoyer pour que le back recalcule
      if (withOvertimeOverride) {
        body.overtime10  = overtime10;
        body.overtime25  = overtime25;
        body.overtime50  = overtime50;
        body.overtime100 = overtime100;
      }

      const result = await api.post<SimulationResult>('/payrolls/simulate', body);
      setSimulation(result);

      // Initialiser les heures sup depuis la simulation (pointage du back)
      if (!withOvertimeOverride) {
        setOvertime10(result.overtime.hours10);
        setOvertime25(result.overtime.hours25);
        setOvertime50(result.overtime.hours50);
        setOvertime100(result.overtime.hours100);
      }
    } catch (e: any) {
      setSimulationError(e?.response?.data?.message || e?.message || 'Erreur de simulation');
      setSimulation(null);
    } finally {
      setIsSimulating(false);
    }
  };

  // ============================================================================
  // ✅ CONFIRMER — Envoyer au back pour créer le bulletin
  // ============================================================================
  const submitPayroll = async () => {
    if (!selectedEmployee || !simulation) return;
    setIsSubmitting(true);
    try {
      const result: any = await api.post('/payrolls', {
        employeeId: selectedEmployee.id,
        month: getMonthNumber(month),
        year,
        // Heures sup (potentiellement corrigées par le RH)
        overtime10,
        overtime25,
        overtime50,
        overtime100,
      });
      setCreatedPayrollId(result?.id || null);
      setShowSuccess(true);
    } catch (e: any) {
      alert(`Erreur: ${e.response?.data?.message || e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmt = (val: number) => (val || 0).toLocaleString('fr-FR');

  if (isLoadingData) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-sky-500" size={32} />
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto pb-20 px-4">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()}
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créer une fiche de paie</h1>
          <p className="text-gray-500 text-sm">
            Période : <span className="text-sky-500 font-bold capitalize">{month} {year}</span>
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-start">

        {/* ── COLONNE GAUCHE : Formulaire ── */}
        <div className="lg:col-span-3 space-y-6">

          {/* Sélecteur période */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Période de paie</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Mois</label>
                <select value={month} onChange={e => { setMonth(e.target.value); setOvertimeOverridden(false); }}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold focus:ring-2 focus:ring-sky-500/20 outline-none">
                  {MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Année</label>
                <select value={year} onChange={e => { setYear(Number(e.target.value)); setOvertimeOverridden(false); }}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold focus:ring-2 focus:ring-sky-500/20 outline-none">
                  <option>2024</option><option>2025</option><option>2026</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sélecteur employé */}
          <EmployeeSelector
            selectedEmployee={selectedEmployee}
            employees={employees}
            onSelect={emp => { setSelectedEmployee(emp); setSimulation(null); }}
            onClear={() => { setSelectedEmployee(null); setSimulation(null); }}
          />

          {/* Erreur simulation */}
          {simulationError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 mt-0.5" />
              <div>
                <p className="font-bold text-red-800 dark:text-red-200 text-sm">Simulation impossible</p>
                <p className="text-red-600 dark:text-red-400 text-xs mt-1">{simulationError}</p>
              </div>
            </div>
          )}

          {/* Simulation en cours */}
          {isSimulating && (
            <div className="p-4 bg-sky-50 dark:bg-sky-900/10 border border-sky-200 rounded-xl flex items-center gap-3">
              <Loader2 size={18} className="text-sky-500 animate-spin" />
              <p className="text-sm text-sky-700 dark:text-sky-300 font-medium">Calcul en cours depuis le serveur...</p>
            </div>
          )}

          {/* Exemptions fiscales */}
          {simulation && (!simulation.employee.isSubjectToCnss || !simulation.employee.isSubjectToIrpp) && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-500 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-200 text-sm">Exemptions fiscales détectées</p>
                <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">
                  {!simulation.employee.isSubjectToCnss && '• CNSS salariale : 0% (exempté) '}
                  {!simulation.employee.isSubjectToIrpp && '• IRPP/ITS : 0 FCFA (exempté)'}
                </p>
              </div>
            </div>
          )}

          {/* Heures supplémentaires — affichées depuis la simulation, corrigeables */}
          {simulation && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-2xl border border-orange-200 dark:border-orange-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-orange-900 dark:text-orange-200 flex items-center gap-2">
                  <Clock size={20} /> Heures Supplémentaires
                </h3>
                {overtimeOverridden && (
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 px-2 py-1 rounded-full font-bold">
                    ✏️ Modifié manuellement
                  </span>
                )}
                {!overtimeOverridden && (overtime10 + overtime25 + overtime50 + overtime100) > 0 && (
                  <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 px-2 py-1 rounded-full font-bold">
                    Depuis le pointage
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Ces valeurs viennent du pointage. Vous pouvez les corriger — le calcul sera relancé automatiquement.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-amber-700 dark:text-amber-300 mb-1">
                    HS +{simulation.settings.overtimeRate10}% — 5 premières heures
                  </label>
                  <input type="number" step="0.5" min="0" value={overtime10}
                    onChange={e => { setOvertime10(Number(e.target.value) || 0); setOvertimeOverridden(true); }}
                    className="w-full p-3 border border-orange-200 dark:border-orange-800 rounded-xl bg-white dark:bg-gray-800 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-orange-700 dark:text-orange-300 mb-1">
                    HS +{simulation.settings.overtimeRate25}% — heures suivantes
                  </label>
                  <input type="number" step="0.5" min="0" value={overtime25}
                    onChange={e => { setOvertime25(Number(e.target.value) || 0); setOvertimeOverridden(true); }}
                    className="w-full p-3 border border-orange-200 dark:border-orange-800 rounded-xl bg-white dark:bg-gray-800 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-orange-200 dark:border-orange-800">
                <div>
                  <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
                    <Moon size={12} /> HS +{simulation.settings.overtimeRate50}% — nuit repos/férié
                  </label>
                  <input type="number" step="0.5" min="0" value={overtime50}
                    onChange={e => { setOvertime50(Number(e.target.value) || 0); setOvertimeOverridden(true); }}
                    className="w-full p-3 border border-purple-200 dark:border-purple-800 rounded-xl bg-white dark:bg-gray-800 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-red-700 dark:text-red-300 mb-1 flex items-center gap-1">
                    <Moon size={12} /> HS +{simulation.settings.overtimeRate100}% — nuit dimanche/JF
                  </label>
                  <input type="number" step="0.5" min="0" value={overtime100}
                    onChange={e => { setOvertime100(Number(e.target.value) || 0); setOvertimeOverridden(true); }}
                    className="w-full p-3 border border-red-200 dark:border-red-800 rounded-xl bg-white dark:bg-gray-800 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                </div>
              </div>
            </motion.section>
          )}

          {/* Primes */}
          {simulation && simulation.bonuses.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/10 dark:to-sky-900/10 rounded-2xl border border-cyan-200 dark:border-cyan-800 p-6">
              <h3 className="text-lg font-bold text-cyan-900 dark:text-cyan-200 mb-4 flex items-center gap-2">
                <Gift size={20} /> Primes applicables — {month} {year}
              </h3>
              <div className="space-y-2">
                {simulation.bonuses.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-cyan-100 dark:border-cyan-900/30">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{b.bonusType}</p>
                      <p className="text-xs text-gray-500">
                        {b.source === 'AUTOMATIC' ? '🤖 Auto convention' : '✋ Manuelle'}
                        {b.details && ` · ${b.details}`}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      +{fmt(b.amount)} FCFA
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-cyan-200 dark:border-cyan-800">
                  <span className="text-sm font-bold text-cyan-800 dark:text-cyan-200">Total primes</span>
                  <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">+{fmt(simulation.totalBonuses)} FCFA</span>
                </div>
              </div>
            </motion.section>
          )}

          {/* Déductions */}
          {simulation && (simulation.totalLoanDeduction > 0 || simulation.totalAdvanceDeduction > 0) && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 rounded-2xl border border-red-200 dark:border-red-800 p-6">
              <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-4 flex items-center gap-2">
                <DollarSign size={20} /> Déductions programmées
              </h3>
              <div className="space-y-2">
                {simulation.loans.map(loan => (
                  <div key={loan.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center gap-3">
                      <CreditCard size={16} className="text-red-500" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Prêt #{loan.id.substring(0, 8)}</p>
                        <p className="text-xs text-gray-500">Solde : {fmt(loan.remainingBalance)} FCFA</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-red-600">-{fmt(loan.monthlyRepayment)} FCFA</span>
                  </div>
                ))}
                {simulation.advances.map(adv => (
                  <div key={adv.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center gap-3">
                      <Wallet size={16} className="text-red-500" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Avance #{adv.id.substring(0, 8)}</p>
                        <p className="text-xs text-gray-500">{new Date(adv.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-red-600">-{fmt(adv.amount)} FCFA</span>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </div>

        {/* ── COLONNE DROITE : Aperçu — 100% données du back ── */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {simulation ? (
              <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-6">

                {/* Header bulletin */}
                <div className="bg-gradient-to-r from-gray-900 to-slate-800 text-white p-6">
                  <h3 className="font-bold text-lg">Aperçu du Bulletin</h3>
                  <p className="text-gray-400 text-sm capitalize">{month} {year}</p>
                  {isSimulating && (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 size={14} className="animate-spin text-sky-400" />
                      <span className="text-xs text-sky-400">Recalcul en cours...</span>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-3 text-sm">

                  {/* Salaire de base */}
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500">Salaire de base</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">{fmt(simulation.employee.baseSalary)} F</span>
                  </div>

                  {/* Déduction absences */}
                  {simulation.absenceDeduction > 0 && (
                    <div className="flex justify-between py-1.5 text-red-500">
                      <span>Absence ({simulation.workDays - simulation.daysToPay}j)</span>
                      <span className="font-mono">-{fmt(simulation.absenceDeduction)} F</span>
                    </div>
                  )}

                  {/* Heures sup (montants calculés par le back) */}
                  {simulation.overtime.amount10 > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500">HS +{simulation.settings.overtimeRate10}% ({simulation.overtime.hours10}h)</span>
                      <span className="font-mono font-bold text-amber-600">+{fmt(simulation.overtime.amount10)} F</span>
                    </div>
                  )}
                  {simulation.overtime.amount25 > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500">HS +{simulation.settings.overtimeRate25}% ({simulation.overtime.hours25}h)</span>
                      <span className="font-mono font-bold text-orange-600">+{fmt(simulation.overtime.amount25)} F</span>
                    </div>
                  )}
                  {simulation.overtime.amount50 > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500 flex items-center gap-1"><Moon size={11} className="text-purple-400"/>HS +{simulation.settings.overtimeRate50}% ({simulation.overtime.hours50}h)</span>
                      <span className="font-mono font-bold text-purple-600">+{fmt(simulation.overtime.amount50)} F</span>
                    </div>
                  )}
                  {simulation.overtime.amount100 > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500 flex items-center gap-1"><Moon size={11} className="text-red-400"/>HS +{simulation.settings.overtimeRate100}% ({simulation.overtime.hours100}h)</span>
                      <span className="font-mono font-bold text-red-600">+{fmt(simulation.overtime.amount100)} F</span>
                    </div>
                  )}
                  {simulation.overtime.total > 0 && (
                    <div className="flex justify-between text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700 pb-2">
                      <span>Sous-total heures sup.</span>
                      <span className="font-mono font-bold text-emerald-600">+{fmt(simulation.overtime.total)} F</span>
                    </div>
                  )}

                  {/* Primes */}
                  {simulation.totalBonuses > 0 && (
                    <div className="py-2 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500 flex items-center gap-1"><Gift size={13} className="text-cyan-500"/>Primes</span>
                        <span className="font-mono font-bold text-cyan-600">+{fmt(simulation.totalBonuses)} F</span>
                      </div>
                      {simulation.bonuses.map(b => (
                        <div key={b.id} className="flex justify-between text-xs text-gray-400 pl-4">
                          <span>{b.bonusType}</span>
                          <span className="font-mono">+{fmt(b.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Salaire BRUT */}
                  <div className="flex justify-between py-2 bg-gray-50 dark:bg-gray-900/50 px-3 rounded-lg">
                    <span className="font-bold text-gray-800 dark:text-gray-200">Salaire Brut</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">{fmt(simulation.grossSalary)} F</span>
                  </div>

                  {/* Retenues */}
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide pt-1">Retenues</p>
                  <div className="flex justify-between">
                    <span className={simulation.employee.isSubjectToCnss ? 'text-red-500' : 'text-gray-400'}>
                      CNSS ({simulation.settings.cnssSalarialRate}%)
                    </span>
                    <span className={`font-mono ${simulation.employee.isSubjectToCnss ? 'text-red-500' : 'text-gray-400'}`}>
                      {simulation.employee.isSubjectToCnss ? `-${fmt(simulation.cnssSalarial)} F` : '0 F (exempté)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={simulation.employee.isSubjectToIrpp ? 'text-red-500' : 'text-gray-400'}>
                      IRPP / ITS
                    </span>
                    <span className={`font-mono ${simulation.employee.isSubjectToIrpp ? 'text-red-500' : 'text-gray-400'}`}>
                      {simulation.employee.isSubjectToIrpp ? `-${fmt(simulation.its)} F` : '0 F (exempté)'}
                    </span>
                  </div>
                  {simulation.totalLoanDeduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-red-500">Prêts ({simulation.loans.length})</span>
                      <span className="font-mono text-red-500">-{fmt(simulation.totalLoanDeduction)} F</span>
                    </div>
                  )}
                  {simulation.totalAdvanceDeduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-red-500">Avances ({simulation.advances.length})</span>
                      <span className="font-mono text-red-500">-{fmt(simulation.totalAdvanceDeduction)} F</span>
                    </div>
                  )}

                  {/* NET */}
                  <div className="pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-gray-500 uppercase">Net à Payer</span>
                      <span className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {fmt(simulation.netSalary)} <span className="text-sm text-gray-400 font-normal">FCFA</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton confirmer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={submitPayroll} disabled={isSubmitting || isSimulating}
                    className="w-full py-3 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    {isSubmitting ? 'Enregistrement...' : 'Confirmer & Enregistrer'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl min-h-[300px] flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <Calculator size={48} className="mb-4 opacity-20" />
                <p className="text-sm">Sélectionnez un employé pour voir l'aperçu calculé par le serveur.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal succès */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center">
              <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bulletin Créé !</h2>
              <p className="text-gray-500 mb-8">La fiche de paie a été générée avec succès.</p>
              <div className="flex gap-3">
                <button onClick={() => { setShowSuccess(false); setSimulation(null); setSelectedEmployee(null); }}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700">
                  Nouveau
                </button>
                {createdPayrollId && (
                  <button onClick={() => router.push(`/paie/bulletins/${createdPayrollId}`)}
                    className="flex-1 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 shadow-lg">
                    Voir bulletin
                  </button>
                )}
                <button onClick={() => router.push('/paie')}
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg">
                  Liste paie
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}