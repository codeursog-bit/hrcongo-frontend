'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import StepHeader from './StepHeader';
import PeriodStep from './PeriodStep';
import SelectionStep from './SelectionStep';
import ProcessingStep from './ProcessingStep';
import SuccessModal from './SuccessModal';

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const getMonthNumber = (monthName: string): number => {
  return MONTHS.findIndex(m => m.toLowerCase() === monthName.toLowerCase()) + 1;
};

export default function BatchPayrollPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [employees, setEmployees]     = useState<any[]>([]);
  const [settings, setSettings]       = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [month, setMonth]       = useState('Février');
  const [year, setYear]         = useState(2026);
  const [workDays, setWorkDays] = useState(26);

  // ✅ Estimation venant du back — JAMAIS calculée localement
  const [estimation, setEstimation]            = useState({ gross: 0, cost: 0, net: 0, count: 0 });
  const [isLoadingEstimation, setIsLoadingEst] = useState(false);

  const [isProcessing, setIsProcessing]           = useState(false);
  const [progress, setProgress]                   = useState(0);
  const [currentEmployee, setCurrentEmployee]     = useState('');
  const [logs, setLogs]                           = useState<string[]>([]);
  const [results, setResults]                     = useState({ success: 0, failed: 0, skipped: 0 });
  const [showSuccess, setShowSuccess]             = useState(false);
  const [processingDetails, setProcessingDetails] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const [empData, settingsData] = await Promise.all([
          api.get('/employees/paginated?limit=1000'),
          api.get('/payroll-settings')
        ]) as [any, any];

        const employeeList = empData?.data || empData || [];
        setEmployees(Array.isArray(employeeList) ? employeeList : []);
        setSettings(settingsData || { workDaysPerMonth: 26 });
        setSelectedIds(Array.isArray(employeeList) ? employeeList.map((e: any) => e.id) : []);

        if (settingsData?.workDaysPerMonth) {
          setWorkDays(settingsData.workDaysPerMonth);
        }
      } catch (e) {
        console.error('Erreur chargement:', e);
        setEmployees([]);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setEstimation({ gross: 0, cost: 0, net: 0, count: 0 });
      return;
    }
    fetchEstimation();
  }, [selectedIds, month, year]);

  // ─── ✅ Estimation via simulate-batch — back calcule, front affiche ──────
  const fetchEstimation = async () => {
    setIsLoadingEst(true);
    try {
      const result: any = await api.post('/payrolls/simulate-batch', {
        employeeIds: selectedIds,
        month: getMonthNumber(month),
        year,
      });
      const s = result?.summary;
      if (s) {
        setEstimation({
          count: s.count             || 0,
          gross: s.totalGross        || 0,
          net:   s.totalNet          || 0,
          cost:  s.totalEmployerCost || 0,
        });
      }
    } catch {
      setEstimation({ gross: 0, cost: 0, net: 0, count: selectedIds.length });
    } finally {
      setIsLoadingEst(false);
    }
  };

  const processBatch = async () => {
    setIsProcessing(true);
    setResults({ success: 0, failed: 0, skipped: 0 });
    setLogs([]);
    setProgress(0);
    setProcessingDetails([]);

    try {
      const monthNumber = getMonthNumber(month);
      setLogs(prev => [`🚀 Lancement du traitement de ${selectedIds.length} bulletins...`, ...prev]);
      setProgress(5);

      // ✅ FIX 1 : route corrigée  generate-batch → generate
      // ✅ FIX 2 : champ corrigé   workDays → customWorkDays
      const response: any = await api.post('/payrolls/generate', {
        employeeIds:    selectedIds,
        month:          monthNumber,
        year:           year,
        customWorkDays: workDays,
      });

      const details = response?.details || [];
      setProcessingDetails(details);

      if (details.length === 0) {
        setLogs(prev => [`⚠️ Aucun détail retourné par l'API`, ...prev]);
        setProgress(100);
        setResults({ success: response.created || 0, failed: response.failed || 0, skipped: response.skipped || 0 });
      } else {
        for (let i = 0; i < details.length; i++) {
          const detail = details[i];
          setCurrentEmployee(detail.employeeName || `Employé ${i + 1}`);
          setProgress(Math.round(((i + 1) / details.length) * 95) + 5);
          await new Promise(r => setTimeout(r, 100));

          if (detail.status === 'SUCCESS') {
            setLogs(prev => [`✅ ${detail.employeeName} → Net: ${detail.netSalary?.toLocaleString() || 'N/A'} F`, ...prev]);
            setResults(prev => ({ ...prev, success: prev.success + 1 }));
          } else if (detail.status === 'SKIPPED') {
            setLogs(prev => [`⚠️ ${detail.employeeName} → Ignoré (${detail.reason || 'Doublon'})`, ...prev]);
            setResults(prev => ({ ...prev, skipped: prev.skipped + 1 }));
          } else {
            setLogs(prev => [`❌ ${detail.employeeName} → Échec (${detail.reason || 'Erreur'})`, ...prev]);
            setResults(prev => ({ ...prev, failed: prev.failed + 1 }));
          }
        }
        setProgress(100);
        setLogs(prev => [`🎉 Terminé : ${response.created || 0} créés, ${response.skipped || 0} ignorés, ${response.failed || 0} échecs`, ...prev]);
      }
    } catch (e: any) {
      setProgress(100);
      setLogs(prev => [`❌ ERREUR : ${e.response?.data?.message || e.message}`, ...prev]);
      setResults({ success: 0, failed: selectedIds.length, skipped: 0 });
      setProcessingDetails(selectedIds.map(id => {
        const emp = employees.find(em => em.id === id);
        return {
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Employé inconnu',
          status: 'FAILED',
          reason: e.response?.data?.message || e.message,
        };
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-sky-500" size={32} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <SuccessModal show={showSuccess} results={results} processingDetails={processingDetails}
        onClose={() => setShowSuccess(false)}
        onNewBatch={() => window.location.reload()}
        onViewPayrolls={() => router.push('/paie')}
      />

      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()}
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Génération Paie en Masse</h1>
          <p className="text-sm text-gray-500">Traitement automatisé des bulletins mensuels.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col min-h-[500px]">
        <StepHeader currentStep={currentStep} />

        <div className="flex-1 p-8 md:p-12 relative">
          {currentStep === 1 && (
            <PeriodStep month={month} year={year} workDays={workDays}
              onMonthChange={setMonth} onYearChange={setYear} onWorkDaysChange={setWorkDays} />
          )}
          {currentStep === 2 && (
            <SelectionStep employees={employees} selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              estimation={estimation}
              isLoadingEstimation={isLoadingEstimation} />
          )}
          {currentStep === 3 && (
            <ProcessingStep isProcessing={isProcessing} progress={progress}
              currentEmployee={currentEmployee} logs={logs} results={results}
              selectedCount={selectedIds.length} estimatedCost={estimation.cost}
              onStart={processBatch} onShowSummary={() => setShowSuccess(true)} />
          )}
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
          <button disabled={currentStep === 1 || isProcessing} onClick={() => setCurrentStep(c => c - 1)}
            className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-white dark:hover:bg-gray-800">
            Précédent
          </button>
          {currentStep < 3 && (
            <button disabled={selectedIds.length === 0 || isLoadingEstimation} onClick={() => setCurrentStep(c => c + 1)}
              className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
              {isLoadingEstimation && <Loader2 size={16} className="animate-spin" />}
              Suivant
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
