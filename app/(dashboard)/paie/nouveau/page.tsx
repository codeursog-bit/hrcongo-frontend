'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calculator, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

// Composants modulaires
import EmployeeSelector from './components/EmployeeSelector';
import OvertimeSection from './components/OvertimeSection';
import DeductionsSection from './components/DeductionsSection';
import PayrollPreviewCard from './components/PayrollPreviewCard';

export default function CreatePayrollPage() {
  const router = useRouter();
  
  // États
  const [employees, setEmployees] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const now = new Date();
  const [month, setMonth] = useState(now.toLocaleString('fr-FR', { month: 'long' }));
  const [year, setYear] = useState(now.getFullYear());
  
  const [workedDays, setWorkedDays] = useState(26);
  const [overtime15, setOvertime15] = useState(0);
  const [overtime50, setOvertime50] = useState(0);
  
  const [autoLoans, setAutoLoans] = useState<any[]>([]);
  const [autoAdvances, setAutoAdvances] = useState<any[]>([]);
  const [totalLoanDeduction, setTotalLoanDeduction] = useState(0);
  const [totalAdvanceDeduction, setTotalAdvanceDeduction] = useState(0);
  
  const [calculation, setCalculation] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ========================================
  // 🔧 CHARGEMENT INITIAL
  // ========================================
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
          overtimeRate15: 15,
          overtimeRate50: 50,
          workHoursPerDay: 8,
          workDaysPerMonth: 26,
          itsBrackets: '[]'
        });
      } catch (e) {
        console.error("❌ Erreur chargement:", e);
        setEmployees([]);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  // ========================================
  // 🎯 CHARGEMENT DONNÉES EMPLOYÉ
  // ========================================
  useEffect(() => {
    if (!selectedEmployee) {
      resetEmployeeData();
      return;
    }

    loadEmployeeData();
  }, [selectedEmployee, month, year]);

  const resetEmployeeData = () => {
    setOvertime15(0);
    setOvertime50(0);
    setAutoLoans([]);
    setAutoAdvances([]);
    setTotalLoanDeduction(0);
    setTotalAdvanceDeduction(0);
    setCalculation(null);
  };

  const loadEmployeeData = async () => {
    if (!selectedEmployee) return;

    try {
      const monthNum = getMonthNumber(month);
      
      // 🔥 ENDPOINT 1 : Résumé mensuel
      const summary: any = await api.get(`/attendance/summary/${selectedEmployee.id}/${monthNum}/${year}`);
      if (summary) {
        setOvertime15(summary.overtime15Hours || 0);
        setOvertime50(summary.overtime50Hours || 0);
      }

      // 🔥 ENDPOINT 2 : Prêts actifs
      const loansData: any = await api.get(`/loans`);
      const activeLoans = (Array.isArray(loansData) ? loansData : []).filter((l: any) => 
        l.employeeId === selectedEmployee.id && l.status === 'ACTIVE'
      );
      setAutoLoans(activeLoans);
      setTotalLoanDeduction(activeLoans.reduce((sum: number, l: any) => sum + (l.monthlyRepayment || 0), 0));

      // 🔥 ENDPOINT 3 : Avances à déduire
      const advancesData: any = await api.get(`/loans/advances`);
      const pendingAdvances = (Array.isArray(advancesData) ? advancesData : []).filter((a: any) => 
        a.employeeId === selectedEmployee.id && 
        a.deductMonth === monthNum && 
        a.deductYear === year && 
        a.status === 'APPROVED'
      );
      setAutoAdvances(pendingAdvances);
      setTotalAdvanceDeduction(pendingAdvances.reduce((sum: number, a: any) => sum + (a.amount || 0), 0));

    } catch (e) {
      console.error("❌ Erreur chargement données employé:", e);
      resetEmployeeData();
    }
  };

  // ========================================
  // 🔧 UTILITAIRES
  // ========================================
  const getMonthNumber = (m: string) => {
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const index = months.indexOf(m.toLowerCase());
    return index !== -1 ? index + 1 : 1;
  };

  // ========================================
  // 💰 CALCUL PAIE
  // ========================================
  const calculatePayroll = async () => {
    if (!selectedEmployee || !settings) return;
    
    setIsCalculating(true);
    await new Promise(r => setTimeout(r, 600));

    try {
      const base = Number(selectedEmployee.baseSalary || 0);
      if (base === 0) {
        alert("⚠️ Salaire de base invalide");
        setIsCalculating(false);
        return;
      }
      
      const workHoursPerMonth = (settings.workHoursPerDay || 8) * (settings.workDaysPerMonth || 26);
      const hourlyRate = base / workHoursPerMonth;
      
      const ot15 = hourlyRate * (overtime15 || 0) * (1 + (settings.overtimeRate15 || 15) / 100);
      const ot50 = hourlyRate * (overtime50 || 0) * (1 + (settings.overtimeRate50 || 50) / 100);
      const gross = base + ot15 + ot50;
      
      const cnssRate = (settings.cnssSalarialRate || 4) / 100;
      const cnssBase = Math.min(gross, settings.cnssCeiling || 1200000);
      const cnssEmp = Math.floor(cnssBase * cnssRate);

      const taxableNet = gross - cnssEmp;
      let its = 0;
      
      try {
        const brackets = JSON.parse(settings.itsBrackets || '[]');
        if (Array.isArray(brackets) && brackets.length > 0) {
          brackets.sort((a: any, b: any) => (a.min || 0) - (b.min || 0));
          for (const bracket of brackets) {
            if (taxableNet > (bracket.min || 0)) {
              const taxableAmountInBracket = Math.min(taxableNet, bracket.max || Infinity) - (bracket.min || 0);
              if (taxableAmountInBracket > 0) {
                its += taxableAmountInBracket * (bracket.rate || 0);
              }
            }
          }
        } else if (taxableNet > 50000) {
          its = (taxableNet - 50000) * 0.20; 
        }
      } catch (e) {
        if (taxableNet > 50000) {
          its = (taxableNet - 50000) * 0.20;
        }
      }
      
      const totalDeductions = cnssEmp + Math.floor(its) + totalLoanDeduction + totalAdvanceDeduction;
      const net = Math.floor(gross - totalDeductions);

      setCalculation({
        baseSalary: base,
        grossSalary: Math.floor(gross),
        netSalary: net,
        cnssEmployee: cnssEmp,
        its: Math.floor(its),
        overtimeTotal: Math.floor(ot15 + ot50),
        overtimeAmount15: Math.floor(ot15),
        overtimeAmount50: Math.floor(ot50),
        loanDeductions: totalLoanDeduction,
        advanceDeductions: totalAdvanceDeduction,
        parametersUsed: { cnssRate: settings.cnssSalarialRate || 4 }
      });
    } catch (error) {
      console.error("❌ Erreur calcul:", error);
      alert("❌ Erreur lors du calcul");
    } finally {
      setIsCalculating(false);
    }
  };

  // ========================================
  // 📤 ENREGISTREMENT
  // ========================================
  const submitPayroll = async () => {
    if (!selectedEmployee || !calculation) return;
    
    try {
      await api.post('/payrolls', {
        employeeId: selectedEmployee.id,
        month: month,
        year: year,
        workedDays: workedDays,
        overtime15: overtime15 || 0,
        overtime50: overtime50 || 0,
        bonuses: [],
        deductions: []
      });
      setShowSuccess(true);
    } catch (e: any) {
      console.error("❌ Erreur création:", e);
      alert(`❌ Erreur: ${e.response?.data?.message || e.message}`);
    }
  };

  // ========================================
  // 🎨 HANDLERS
  // ========================================
  const handleEmployeeSelect = (emp: any) => {
    setSelectedEmployee(emp);
  };

  const handleEmployeeClear = () => {
    setSelectedEmployee(null);
    setCalculation(null);
  };

  const handleOvertime15Change = (value: number) => {
    setOvertime15(value);
    setCalculation(null);
  };

  const handleOvertime50Change = (value: number) => {
    setOvertime50(value);
    setCalculation(null);
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-sky-500" size={32}/>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-20 relative px-4">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
        >
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
          
          {/* SÉLECTION EMPLOYÉ */}
          <EmployeeSelector
            selectedEmployee={selectedEmployee}
            employees={employees}
            onSelect={handleEmployeeSelect}
            onClear={handleEmployeeClear}
          />

          {/* HEURES SUPPLÉMENTAIRES */}
          {selectedEmployee && (
            <OvertimeSection
              month={month}
              year={year}
              overtime15={overtime15}
              overtime50={overtime50}
              onOvertime15Change={handleOvertime15Change}
              onOvertime50Change={handleOvertime50Change}
              overtimeRate15={settings?.overtimeRate15 || 15}
              overtimeRate50={settings?.overtimeRate50 || 50}
            />
          )}

          {/* DÉDUCTIONS */}
          {selectedEmployee && (
            <DeductionsSection
              month={month}
              year={year}
              loans={autoLoans}
              advances={autoAdvances}
              totalLoanDeduction={totalLoanDeduction}
              totalAdvanceDeduction={totalAdvanceDeduction}
            />
          )}

          {/* BOUTON CALCUL */}
          <button 
            onClick={calculatePayroll} 
            disabled={!selectedEmployee || isCalculating} 
            className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all ${!selectedEmployee ? 'bg-gray-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 hover:scale-[1.01]'}`}
          >
            {isCalculating ? <Loader2 className="animate-spin" /> : <Calculator size={20} />} 
            {isCalculating ? 'Calcul en cours...' : 'Calculer le Bulletin'}
          </button>
        </div>

        {/* APERÇU DU NET */}
        <div className="lg:col-span-2">
          <PayrollPreviewCard
            calculation={calculation}
            month={month}
            year={year}
            overtime15={overtime15}
            overtime50={overtime50}
            loansCount={autoLoans.length}
            advancesCount={autoAdvances.length}
            onSubmit={submitPayroll}
          />
        </div>
      </div>

      {/* MODAL SUCCÈS */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center">
              <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bulletin Créé !</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">La fiche de paie a été générée avec succès.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => { 
                    setShowSuccess(false); 
                    setCalculation(null); 
                    setSelectedEmployee(null); 
                  }} 
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Nouveau
                </button>
                <button 
                  onClick={() => router.push('/paie')} 
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg"
                >
                  Voir liste
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}