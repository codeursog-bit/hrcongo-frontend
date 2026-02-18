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
//   const [overtime15, setOvertime15] = useState(0);
//   const [overtime50, setOvertime50] = useState(0);
  
//   const [autoLoans, setAutoLoans] = useState<any[]>([]);
//   const [autoAdvances, setAutoAdvances] = useState<any[]>([]);
//   const [totalLoanDeduction, setTotalLoanDeduction] = useState(0);
//   const [totalAdvanceDeduction, setTotalAdvanceDeduction] = useState(0);

//   // 🆕 PRIMES EMPLOYÉ
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
//           overtimeRate15: 15,
//           overtimeRate50: 50,
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
//     setOvertime15(0);
//     setOvertime50(0);
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
      
//       // Pointage
//       try {
//         const summary: any = await api.get(`/attendance/summary/${selectedEmployee.id}/${monthNum}/${year}`);
//         if (summary) {
//           setOvertime15(summary.overtime15Hours || 0);
//           setOvertime50(summary.overtime50Hours || 0);
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

//       // 🆕 Primes de l'employé (récurrentes uniquement pour le mois courant)
//       try {
//         const bonusesData: any = await api.get(`/employee-bonuses?employeeId=${selectedEmployee.id}`);
//         const bonuses = Array.isArray(bonusesData) ? bonusesData : bonusesData?.data || [];
//         const recurringBonuses = bonuses.filter((b: any) => b.isRecurring || b.source === 'AUTOMATIC');

//         let bonusTotal = 0;
//         const enrichedBonuses = recurringBonuses.map((b: any) => {
//           let amount = b.amount || 0;
//           if (b.percentage && !b.amount) {
//             const base = b.baseCalculation === 'GROSS_SALARY'
//               ? (selectedEmployee.baseSalary || 0) * 1.1 // approximation brut
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
//   // 💰 CALCUL PAIE — avec CNSS/IRPP conditionnels
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
      
//       const ot15 = hourlyRate * (overtime15 || 0) * (1 + (settings.overtimeRate15 || 15) / 100);
//       const ot50 = hourlyRate * (overtime50 || 0) * (1 + (settings.overtimeRate50 || 50) / 100);
      
//       // 🆕 Primes incluses dans le brut
//       const grossBeforeBonuses = base + ot15 + ot50;
//       const gross = grossBeforeBonuses + totalBonuses;
      
//       // ✅ CNSS conditionnelle — vérifier isSubjectToCnss
//       let cnssEmp = 0;
//       const isSubjectToCnss = selectedEmployee.isSubjectToCnss ?? true;
//       if (isSubjectToCnss) {
//         const cnssRate = (settings.cnssSalarialRate || 4) / 100;
//         // CNSS calculée sur base + HS uniquement (pas sur toutes les primes selon convention Congo)
//         const cnssBase = Math.min(grossBeforeBonuses, settings.cnssCeiling || 1200000);
//         cnssEmp = Math.floor(cnssBase * cnssRate);
//       }

//       // ✅ IRPP/ITS conditionnel — vérifier isSubjectToIrpp
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
//         overtimeTotal: Math.floor(ot15 + ot50),
//         overtimeAmount15: Math.floor(ot15),
//         overtimeAmount50: Math.floor(ot50),
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
//         overtime15: overtime15 || 0,
//         overtime50: overtime50 || 0,
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

//           {/* 🆕 PRIMES AFFICHÉES */}
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
//               overtime15={overtime15} overtime50={overtime50}
//               onOvertime15Change={(v) => { setOvertime15(v); setCalculation(null); }}
//               onOvertime50Change={(v) => { setOvertime50(v); setCalculation(null); }}
//               overtimeRate15={settings?.overtimeRate15 || 15}
//               overtimeRate50={settings?.overtimeRate50 || 50}
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
//             overtime15={overtime15} overtime50={overtime50}
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
import { ArrowLeft, Calculator, CheckCircle2, Loader2, Gift, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

import EmployeeSelector from './components/EmployeeSelector';
import OvertimeSection from './components/OvertimeSection';
import DeductionsSection from './components/DeductionsSection';
import PayrollPreviewCard from './components/PayrollPreviewCard';

export default function CreatePayrollPage() {
  const router = useRouter();
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const now = new Date();
  const [month, setMonth] = useState(now.toLocaleString('fr-FR', { month: 'long' }));
  const [year, setYear] = useState(now.getFullYear());
  
  const [workedDays, setWorkedDays] = useState(26);

  // ✅ 4 catégories Décret 78-360 (remplace overtime15 / overtime50)
  const [overtime10, setOvertime10]   = useState(0);
  const [overtime25, setOvertime25]   = useState(0);
  const [overtime50, setOvertime50]   = useState(0);
  const [overtime100, setOvertime100] = useState(0);
  
  const [autoLoans, setAutoLoans] = useState<any[]>([]);
  const [autoAdvances, setAutoAdvances] = useState<any[]>([]);
  const [totalLoanDeduction, setTotalLoanDeduction] = useState(0);
  const [totalAdvanceDeduction, setTotalAdvanceDeduction] = useState(0);

  const [employeeBonuses, setEmployeeBonuses] = useState<any[]>([]);
  const [totalBonuses, setTotalBonuses] = useState(0);
  
  const [calculation, setCalculation] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPayrollId, setCreatedPayrollId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [empsData, settingsData] = await Promise.all([
          api.get('/employees'),
          api.get('/payroll-settings')
        ]) as [any, any];
        
        setEmployees(Array.isArray(empsData) ? empsData : []);
        setSettings(settingsData || {
          cnssSalarialRate: 4,
          cnssEmployerRate: 16,
          cnssCeiling: 1200000,
          overtimeRate10: 10,
          overtimeRate25: 25,
          overtimeRate50: 50,
          overtimeRate100: 100,
          workHoursPerDay: 8,
          workDaysPerMonth: 26,
          itsBrackets: '[]'
        });
      } catch (e) {
        console.error('Erreur chargement:', e);
        setEmployees([]);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedEmployee) {
      resetEmployeeData();
      return;
    }
    loadEmployeeData();
  }, [selectedEmployee, month, year]);

  const resetEmployeeData = () => {
    setOvertime10(0);
    setOvertime25(0);
    setOvertime50(0);
    setOvertime100(0);
    setAutoLoans([]);
    setAutoAdvances([]);
    setTotalLoanDeduction(0);
    setTotalAdvanceDeduction(0);
    setEmployeeBonuses([]);
    setTotalBonuses(0);
    setCalculation(null);
  };

  const loadEmployeeData = async () => {
    if (!selectedEmployee) return;
    try {
      const monthNum = getMonthNumber(month);
      
      // ✅ Pointage — 4 catégories
      try {
        const summary: any = await api.get(`/attendance/summary/${selectedEmployee.id}/${monthNum}/${year}`);
        if (summary) {
          setOvertime10(Number(summary.overtime10Hours  || 0));
          setOvertime25(Number(summary.overtime25Hours  || 0));
          setOvertime50(Number(summary.overtime50Hours  || 0));
          setOvertime100(Number(summary.overtime100Hours || 0));
        }
      } catch {}

      // Prêts actifs
      try {
        const loansData: any = await api.get('/loans');
        const activeLoans = (Array.isArray(loansData) ? loansData : []).filter((l: any) => 
          l.employeeId === selectedEmployee.id && l.status === 'ACTIVE'
        );
        setAutoLoans(activeLoans);
        setTotalLoanDeduction(activeLoans.reduce((s: number, l: any) => s + (l.monthlyRepayment || 0), 0));
      } catch {}

      // Avances
      try {
        const advancesData: any = await api.get('/loans/advances');
        const pendingAdvances = (Array.isArray(advancesData) ? advancesData : []).filter((a: any) => 
          a.employeeId === selectedEmployee.id && 
          a.deductMonth === monthNum && 
          a.deductYear === year && 
          a.status === 'APPROVED'
        );
        setAutoAdvances(pendingAdvances);
        setTotalAdvanceDeduction(pendingAdvances.reduce((s: number, a: any) => s + (a.amount || 0), 0));
      } catch {}

      // Primes récurrentes
      try {
        const bonusesData: any = await api.get(`/employee-bonuses?employeeId=${selectedEmployee.id}`);
        const bonuses = Array.isArray(bonusesData) ? bonusesData : bonusesData?.data || [];
        const recurringBonuses = bonuses.filter((b: any) => b.isRecurring || b.source === 'AUTOMATIC');

        let bonusTotal = 0;
        const enrichedBonuses = recurringBonuses.map((b: any) => {
          let amount = b.amount || 0;
          if (b.percentage && !b.amount) {
            const base = b.baseCalculation === 'GROSS_SALARY'
              ? (selectedEmployee.baseSalary || 0) * 1.1
              : (selectedEmployee.baseSalary || 0);
            amount = Math.floor(base * b.percentage / 100);
          }
          bonusTotal += amount;
          return { ...b, computedAmount: amount };
        });

        setEmployeeBonuses(enrichedBonuses);
        setTotalBonuses(bonusTotal);
      } catch {}

    } catch (e) {
      console.error('Erreur chargement données employé:', e);
      resetEmployeeData();
    }
  };

  const getMonthNumber = (m: string) => {
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const idx = months.indexOf(m.toLowerCase());
    return idx !== -1 ? idx + 1 : 1;
  };

  // ============================================
  // 💰 CALCUL PAIE — 4 taux Décret 78-360
  // ============================================
  const calculatePayroll = async () => {
    if (!selectedEmployee || !settings) return;
    
    setIsCalculating(true);
    await new Promise(r => setTimeout(r, 500));

    try {
      const base = Number(selectedEmployee.baseSalary || 0);
      if (base === 0) {
        alert('Salaire de base invalide');
        setIsCalculating(false);
        return;
      }
      
      const workHoursPerMonth = (settings.workHoursPerDay || 8) * (settings.workDaysPerMonth || 26);
      const hourlyRate = base / workHoursPerMonth;

      // ✅ 4 catégories avec plancher légal
      const rate10  = Math.max(10,  Number(settings.overtimeRate10  ?? 10))  / 100;
      const rate25  = Math.max(25,  Number(settings.overtimeRate25  ?? 25))  / 100;
      const rate50  = Math.max(50,  Number(settings.overtimeRate50  ?? 50))  / 100;
      const rate100 = Math.max(100, Number(settings.overtimeRate100 ?? 100)) / 100;

      const ot10Amount  = Math.floor(hourlyRate * (overtime10  || 0) * (1 + rate10));
      const ot25Amount  = Math.floor(hourlyRate * (overtime25  || 0) * (1 + rate25));
      const ot50Amount  = Math.floor(hourlyRate * (overtime50  || 0) * (1 + rate50));
      const ot100Amount = Math.floor(hourlyRate * (overtime100 || 0) * (1 + rate100));
      const totalOT     = ot10Amount + ot25Amount + ot50Amount + ot100Amount;

      // Primes incluses dans le brut
      const grossBeforeBonuses = base + totalOT;
      const gross = grossBeforeBonuses + totalBonuses;

      // ✅ CNSS conditionnelle
      let cnssEmp = 0;
      const isSubjectToCnss = selectedEmployee.isSubjectToCnss ?? true;
      if (isSubjectToCnss) {
        const cnssRate = (settings.cnssSalarialRate || 4) / 100;
        const cnssBase = Math.min(grossBeforeBonuses, settings.cnssCeiling || 1200000);
        cnssEmp = Math.floor(cnssBase * cnssRate);
      }

      // ✅ IRPP/ITS conditionnel
      let its = 0;
      const isSubjectToIrpp = selectedEmployee.isSubjectToIrpp ?? true;
      if (isSubjectToIrpp) {
        const taxableNet = gross - cnssEmp;
        try {
          const brackets = JSON.parse(settings.itsBrackets || '[]');
          if (Array.isArray(brackets) && brackets.length > 0) {
            brackets.sort((a: any, b: any) => (a.min || 0) - (b.min || 0));
            for (const bracket of brackets) {
              if (taxableNet > (bracket.min || 0)) {
                const inBracket = Math.min(taxableNet, bracket.max || Infinity) - (bracket.min || 0);
                if (inBracket > 0) its += inBracket * (bracket.rate || 0);
              }
            }
          } else if (taxableNet > 50000) {
            its = (taxableNet - 50000) * 0.20;
          }
        } catch {
          if (gross - cnssEmp > 50000) its = (gross - cnssEmp - 50000) * 0.20;
        }
        its = Math.floor(its);
      }

      const totalDeductions = cnssEmp + its + totalLoanDeduction + totalAdvanceDeduction;
      const net = Math.floor(gross - totalDeductions);

      setCalculation({
        baseSalary: base,
        grossSalary: Math.floor(gross),
        netSalary: net,
        cnssEmployee: cnssEmp,
        its,
        // ✅ 4 montants distincts
        overtimeAmount10:  ot10Amount,
        overtimeAmount25:  ot25Amount,
        overtimeAmount50:  ot50Amount,
        overtimeAmount100: ot100Amount,
        overtimeTotal: totalOT,
        bonusesTotal: totalBonuses,
        bonuses: employeeBonuses,
        loanDeductions: totalLoanDeduction,
        advanceDeductions: totalAdvanceDeduction,
        isSubjectToCnss,
        isSubjectToIrpp,
        parametersUsed: {
          cnssRate: isSubjectToCnss ? (settings.cnssSalarialRate || 4) : 0,
        }
      });
    } catch (error) {
      console.error('Erreur calcul:', error);
      alert('Erreur lors du calcul');
    } finally {
      setIsCalculating(false);
    }
  };

  const submitPayroll = async () => {
    if (!selectedEmployee || !calculation) return;
    try {
      const result: any = await api.post('/payrolls', {
        employeeId: selectedEmployee.id,
        month: getMonthNumber(month),
        year,
        workedDays,
        // ✅ 4 champs
        overtime10:  overtime10  || 0,
        overtime25:  overtime25  || 0,
        overtime50:  overtime50  || 0,
        overtime100: overtime100 || 0,
        bonuses: employeeBonuses.map(b => ({ id: b.id, amount: b.computedAmount })),
        deductions: []
      });
      setCreatedPayrollId(result?.id || null);
      setShowSuccess(true);
    } catch (e: any) {
      console.error('Erreur création:', e);
      alert(`Erreur: ${e.response?.data?.message || e.message}`);
    }
  };

  if (isLoadingData) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-sky-500" size={32} />
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto pb-20 relative px-4">
      
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créer une fiche de paie</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Période : <span className="text-sky-500 font-bold capitalize">{month} {year}</span>
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 space-y-6">
          
          <EmployeeSelector
            selectedEmployee={selectedEmployee}
            employees={employees}
            onSelect={(emp) => { setSelectedEmployee(emp); setCalculation(null); }}
            onClear={() => { setSelectedEmployee(null); setCalculation(null); }}
          />

          {/* PRIMES AFFICHÉES */}
          {selectedEmployee && employeeBonuses.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/10 dark:to-sky-900/10 rounded-2xl border border-cyan-200 dark:border-cyan-800 p-6">
              <h3 className="text-lg font-bold text-cyan-900 dark:text-cyan-200 mb-4 flex items-center gap-2">
                <Gift size={20} /> Primes applicables ce mois
              </h3>
              <div className="space-y-2">
                {employeeBonuses.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-cyan-100 dark:border-cyan-900/30">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{b.bonusType}</p>
                      <p className="text-xs text-gray-500">{b.isRecurring ? 'Récurrente' : 'Ponctuelle'} {b.source === 'AUTOMATIC' ? '· Auto convention' : ''}</p>
                    </div>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">+{b.computedAmount.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-cyan-200 dark:border-cyan-800 mt-2">
                  <span className="text-sm font-bold text-cyan-800 dark:text-cyan-200">Total primes</span>
                  <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">+{totalBonuses.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>
            </motion.section>
          )}

          {/* ALERTE exemption fiscale */}
          {selectedEmployee && (!selectedEmployee.isSubjectToCnss || !selectedEmployee.isSubjectToIrpp) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-bold text-amber-800 dark:text-amber-200">Exemptions fiscales détectées</p>
                <p className="text-amber-600 dark:text-amber-400 text-xs mt-0.5">
                  {!selectedEmployee.isSubjectToCnss && '• CNSS salariale : 0% (exempté) '}
                  {!selectedEmployee.isSubjectToIrpp && '• IRPP/ITS : 0 FCFA (exempté)'}
                </p>
              </div>
            </motion.div>
          )}

          {selectedEmployee && (
            <OvertimeSection
              month={month} year={year}
              overtime10={overtime10}   overtime25={overtime25}
              overtime50={overtime50}   overtime100={overtime100}
              onOvertime10Change={(v)  => { setOvertime10(v);  setCalculation(null); }}
              onOvertime25Change={(v)  => { setOvertime25(v);  setCalculation(null); }}
              onOvertime50Change={(v)  => { setOvertime50(v);  setCalculation(null); }}
              onOvertime100Change={(v) => { setOvertime100(v); setCalculation(null); }}
              overtimeRate10={settings?.overtimeRate10   || 10}
              overtimeRate25={settings?.overtimeRate25   || 25}
              overtimeRate50={settings?.overtimeRate50   || 50}
              overtimeRate100={settings?.overtimeRate100 || 100}
            />
          )}

          {selectedEmployee && (
            <DeductionsSection
              month={month} year={year}
              loans={autoLoans} advances={autoAdvances}
              totalLoanDeduction={totalLoanDeduction}
              totalAdvanceDeduction={totalAdvanceDeduction}
            />
          )}

          <button onClick={calculatePayroll} disabled={!selectedEmployee || isCalculating}
            className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all ${!selectedEmployee ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 hover:scale-[1.01]'}`}>
            {isCalculating ? <Loader2 className="animate-spin" /> : <Calculator size={20} />}
            {isCalculating ? 'Calcul en cours...' : 'Calculer le Bulletin'}
          </button>
        </div>

        <div className="lg:col-span-2">
          <PayrollPreviewCard
            calculation={calculation} month={month} year={year}
            overtime10={overtime10}   overtime25={overtime25}
            overtime50={overtime50}   overtime100={overtime100}
            loansCount={autoLoans.length} advancesCount={autoAdvances.length}
            onSubmit={submitPayroll}
          />
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center">
              <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bulletin Créé !</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">La fiche de paie a été générée avec succès.</p>
              <div className="flex gap-3">
                <button onClick={() => { setShowSuccess(false); setCalculation(null); setSelectedEmployee(null); }}
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



// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { ArrowLeft, Calculator, CheckCircle2, Loader2 } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';

// // Composants modulaires
// import EmployeeSelector from './components/EmployeeSelector';
// import OvertimeSection from './components/OvertimeSection';
// import DeductionsSection from './components/DeductionsSection';
// import PayrollPreviewCard from './components/PayrollPreviewCard';

// export default function CreatePayrollPage() {
//   const router = useRouter();
  
//   // États
//   const [employees, setEmployees] = useState<any[]>([]);
//   const [settings, setSettings] = useState<any>(null);
//   const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
//   const [isLoadingData, setIsLoadingData] = useState(true);
  
//   const now = new Date();
//   const [month, setMonth] = useState(now.toLocaleString('fr-FR', { month: 'long' }));
//   const [year, setYear] = useState(now.getFullYear());
  
//   const [workedDays, setWorkedDays] = useState(26);
//   const [overtime15, setOvertime15] = useState(0);
//   const [overtime50, setOvertime50] = useState(0);
  
//   const [autoLoans, setAutoLoans] = useState<any[]>([]);
//   const [autoAdvances, setAutoAdvances] = useState<any[]>([]);
//   const [totalLoanDeduction, setTotalLoanDeduction] = useState(0);
//   const [totalAdvanceDeduction, setTotalAdvanceDeduction] = useState(0);
  
//   const [calculation, setCalculation] = useState<any>(null);
//   const [isCalculating, setIsCalculating] = useState(false);
//   const [showSuccess, setShowSuccess] = useState(false);

//   // ========================================
//   // 🔧 CHARGEMENT INITIAL
//   // ========================================
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
//           overtimeRate15: 15,
//           overtimeRate50: 50,
//           workHoursPerDay: 8,
//           workDaysPerMonth: 26,
//           itsBrackets: '[]'
//         });
//       } catch (e) {
//         console.error("❌ Erreur chargement:", e);
//         setEmployees([]);
//       } finally {
//         setIsLoadingData(false);
//       }
//     };
//     loadData();
//   }, []);

//   // ========================================
//   // 🎯 CHARGEMENT DONNÉES EMPLOYÉ
//   // ========================================
//   useEffect(() => {
//     if (!selectedEmployee) {
//       resetEmployeeData();
//       return;
//     }

//     loadEmployeeData();
//   }, [selectedEmployee, month, year]);

//   const resetEmployeeData = () => {
//     setOvertime15(0);
//     setOvertime50(0);
//     setAutoLoans([]);
//     setAutoAdvances([]);
//     setTotalLoanDeduction(0);
//     setTotalAdvanceDeduction(0);
//     setCalculation(null);
//   };

//   const loadEmployeeData = async () => {
//     if (!selectedEmployee) return;

//     try {
//       const monthNum = getMonthNumber(month);
      
//       // 🔥 ENDPOINT 1 : Résumé mensuel
//       const summary: any = await api.get(`/attendance/summary/${selectedEmployee.id}/${monthNum}/${year}`);
//       if (summary) {
//         setOvertime15(summary.overtime15Hours || 0);
//         setOvertime50(summary.overtime50Hours || 0);
//       }

//       // 🔥 ENDPOINT 2 : Prêts actifs
//       const loansData: any = await api.get(`/loans`);
//       const activeLoans = (Array.isArray(loansData) ? loansData : []).filter((l: any) => 
//         l.employeeId === selectedEmployee.id && l.status === 'ACTIVE'
//       );
//       setAutoLoans(activeLoans);
//       setTotalLoanDeduction(activeLoans.reduce((sum: number, l: any) => sum + (l.monthlyRepayment || 0), 0));

//       // 🔥 ENDPOINT 3 : Avances à déduire
//       const advancesData: any = await api.get(`/loans/advances`);
//       const pendingAdvances = (Array.isArray(advancesData) ? advancesData : []).filter((a: any) => 
//         a.employeeId === selectedEmployee.id && 
//         a.deductMonth === monthNum && 
//         a.deductYear === year && 
//         a.status === 'APPROVED'
//       );
//       setAutoAdvances(pendingAdvances);
//       setTotalAdvanceDeduction(pendingAdvances.reduce((sum: number, a: any) => sum + (a.amount || 0), 0));

//     } catch (e) {
//       console.error("❌ Erreur chargement données employé:", e);
//       resetEmployeeData();
//     }
//   };

//   // ========================================
//   // 🔧 UTILITAIRES
//   // ========================================
//   const getMonthNumber = (m: string) => {
//     const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
//     const index = months.indexOf(m.toLowerCase());
//     return index !== -1 ? index + 1 : 1;
//   };

//   // ========================================
//   // 💰 CALCUL PAIE
//   // ========================================
//   const calculatePayroll = async () => {
//     if (!selectedEmployee || !settings) return;
    
//     setIsCalculating(true);
//     await new Promise(r => setTimeout(r, 600));

//     try {
//       const base = Number(selectedEmployee.baseSalary || 0);
//       if (base === 0) {
//         alert("⚠️ Salaire de base invalide");
//         setIsCalculating(false);
//         return;
//       }
      
//       const workHoursPerMonth = (settings.workHoursPerDay || 8) * (settings.workDaysPerMonth || 26);
//       const hourlyRate = base / workHoursPerMonth;
      
//       const ot15 = hourlyRate * (overtime15 || 0) * (1 + (settings.overtimeRate15 || 15) / 100);
//       const ot50 = hourlyRate * (overtime50 || 0) * (1 + (settings.overtimeRate50 || 50) / 100);
//       const gross = base + ot15 + ot50;
      
//       const cnssRate = (settings.cnssSalarialRate || 4) / 100;
//       const cnssBase = Math.min(gross, settings.cnssCeiling || 1200000);
//       const cnssEmp = Math.floor(cnssBase * cnssRate);

//       const taxableNet = gross - cnssEmp;
//       let its = 0;
      
//       try {
//         const brackets = JSON.parse(settings.itsBrackets || '[]');
//         if (Array.isArray(brackets) && brackets.length > 0) {
//           brackets.sort((a: any, b: any) => (a.min || 0) - (b.min || 0));
//           for (const bracket of brackets) {
//             if (taxableNet > (bracket.min || 0)) {
//               const taxableAmountInBracket = Math.min(taxableNet, bracket.max || Infinity) - (bracket.min || 0);
//               if (taxableAmountInBracket > 0) {
//                 its += taxableAmountInBracket * (bracket.rate || 0);
//               }
//             }
//           }
//         } else if (taxableNet > 50000) {
//           its = (taxableNet - 50000) * 0.20; 
//         }
//       } catch (e) {
//         if (taxableNet > 50000) {
//           its = (taxableNet - 50000) * 0.20;
//         }
//       }
      
//       const totalDeductions = cnssEmp + Math.floor(its) + totalLoanDeduction + totalAdvanceDeduction;
//       const net = Math.floor(gross - totalDeductions);

//       setCalculation({
//         baseSalary: base,
//         grossSalary: Math.floor(gross),
//         netSalary: net,
//         cnssEmployee: cnssEmp,
//         its: Math.floor(its),
//         overtimeTotal: Math.floor(ot15 + ot50),
//         overtimeAmount15: Math.floor(ot15),
//         overtimeAmount50: Math.floor(ot50),
//         loanDeductions: totalLoanDeduction,
//         advanceDeductions: totalAdvanceDeduction,
//         parametersUsed: { cnssRate: settings.cnssSalarialRate || 4 }
//       });
//     } catch (error) {
//       console.error("❌ Erreur calcul:", error);
//       alert("❌ Erreur lors du calcul");
//     } finally {
//       setIsCalculating(false);
//     }
//   };

//   // ========================================
//   // 📤 ENREGISTREMENT
//   // ========================================
//   const submitPayroll = async () => {
//     if (!selectedEmployee || !calculation) return;
    
//     try {
//       await api.post('/payrolls', {
//         employeeId: selectedEmployee.id,
//         month: month,
//         year: year,
//         workedDays: workedDays,
//         overtime15: overtime15 || 0,
//         overtime50: overtime50 || 0,
//         bonuses: [],
//         deductions: []
//       });
//       setShowSuccess(true);
//     } catch (e: any) {
//       console.error("❌ Erreur création:", e);
//       alert(`❌ Erreur: ${e.response?.data?.message || e.message}`);
//     }
//   };

//   // ========================================
//   // 🎨 HANDLERS
//   // ========================================
//   const handleEmployeeSelect = (emp: any) => {
//     setSelectedEmployee(emp);
//   };

//   const handleEmployeeClear = () => {
//     setSelectedEmployee(null);
//     setCalculation(null);
//   };

//   const handleOvertime15Change = (value: number) => {
//     setOvertime15(value);
//     setCalculation(null);
//   };

//   const handleOvertime50Change = (value: number) => {
//     setOvertime50(value);
//     setCalculation(null);
//   };

//   if (isLoadingData) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Loader2 className="animate-spin text-sky-500" size={32}/>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-[1600px] mx-auto pb-20 relative px-4">
      
//       {/* HEADER */}
//       <div className="flex items-center gap-4 mb-8">
//         <button 
//           onClick={() => router.back()} 
//           className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
//         >
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
          
//           {/* SÉLECTION EMPLOYÉ */}
//           <EmployeeSelector
//             selectedEmployee={selectedEmployee}
//             employees={employees}
//             onSelect={handleEmployeeSelect}
//             onClear={handleEmployeeClear}
//           />

//           {/* HEURES SUPPLÉMENTAIRES */}
//           {selectedEmployee && (
//             <OvertimeSection
//               month={month}
//               year={year}
//               overtime15={overtime15}
//               overtime50={overtime50}
//               onOvertime15Change={handleOvertime15Change}
//               onOvertime50Change={handleOvertime50Change}
//               overtimeRate15={settings?.overtimeRate15 || 15}
//               overtimeRate50={settings?.overtimeRate50 || 50}
//             />
//           )}

//           {/* DÉDUCTIONS */}
//           {selectedEmployee && (
//             <DeductionsSection
//               month={month}
//               year={year}
//               loans={autoLoans}
//               advances={autoAdvances}
//               totalLoanDeduction={totalLoanDeduction}
//               totalAdvanceDeduction={totalAdvanceDeduction}
//             />
//           )}

//           {/* BOUTON CALCUL */}
//           <button 
//             onClick={calculatePayroll} 
//             disabled={!selectedEmployee || isCalculating} 
//             className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all ${!selectedEmployee ? 'bg-gray-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 hover:scale-[1.01]'}`}
//           >
//             {isCalculating ? <Loader2 className="animate-spin" /> : <Calculator size={20} />} 
//             {isCalculating ? 'Calcul en cours...' : 'Calculer le Bulletin'}
//           </button>
//         </div>

//         {/* APERÇU DU NET */}
//         <div className="lg:col-span-2">
//           <PayrollPreviewCard
//             calculation={calculation}
//             month={month}
//             year={year}
//             overtime15={overtime15}
//             overtime50={overtime50}
//             loansCount={autoLoans.length}
//             advancesCount={autoAdvances.length}
//             onSubmit={submitPayroll}
//           />
//         </div>
//       </div>

//       {/* MODAL SUCCÈS */}
//       <AnimatePresence>
//         {showSuccess && (
//           <motion.div 
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
//             initial={{ opacity: 0 }} 
//             animate={{ opacity: 1 }}
//           >
//             <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center">
//               <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-6" />
//               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bulletin Créé !</h2>
//               <p className="text-gray-500 dark:text-gray-400 mb-8">La fiche de paie a été générée avec succès.</p>
//               <div className="flex gap-3">
//                 <button 
//                   onClick={() => { 
//                     setShowSuccess(false); 
//                     setCalculation(null); 
//                     setSelectedEmployee(null); 
//                   }} 
//                   className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700"
//                 >
//                   Nouveau
//                 </button>
//                 <button 
//                   onClick={() => router.push('/paie')} 
//                   className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg"
//                 >
//                   Voir liste
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }