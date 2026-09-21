'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  // ✅ Jours travaillés par employé.
  //  - autoDays  : valeur calculée par le back depuis les présences (lecture seule)
  //  - daysInput : valeur saisie à la main (texte brut, pour pouvoir effacer/retaper)
  const [autoDays, setAutoDays]     = useState<Record<string, number>>({});
  const [daysInput, setDaysInput]   = useState<Record<string, string>>({});
  const estimationReq = useRef(0);

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

  // ─── Jours saisis valides → { employeeId: jours } (bornés 0…workDays) ────
  const buildDaysOverrides = (): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const id of selectedIds) {
      const raw = daysInput[id];
      if (raw === undefined || raw.trim() === '') continue;
      const n = Number(raw.replace(',', '.'));
      if (!Number.isFinite(n)) continue;
      out[id] = Math.min(Math.max(0, n), workDays);
    }
    return out;
  };

  const handleDaysChange = (id: string, value: string) => {
    setDaysInput(prev => ({ ...prev, [id]: value }));
  };
  const handleDaysReset = (id: string) => {
    setDaysInput(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Re-estimation (avec pause de 400 ms pour ne pas appeler le back à chaque frappe)
  useEffect(() => {
    if (selectedIds.length === 0) {
      setEstimation({ gross: 0, cost: 0, net: 0, count: 0 });
      return;
    }
    const t = setTimeout(fetchEstimation, 400);
    return () => clearTimeout(t);
  }, [selectedIds, month, year, workDays, daysInput]);

  // ─── ✅ Estimation via simulate-batch — back calcule, front affiche ──────
  const fetchEstimation = async () => {
    const reqId = ++estimationReq.current;
    const sentOverrides = buildDaysOverrides();
    setIsLoadingEst(true);
    try {
      const result: any = await api.post('/payrolls/simulate-batch', {
        employeeIds: selectedIds,
        month: getMonthNumber(month),
        year,
        workDays,
        daysOverrides: sentOverrides,
      });
      if (reqId !== estimationReq.current) return; // réponse périmée
      const s = result?.summary;
      if (s) {
        setEstimation({
          count: s.count             || 0,
          gross: s.totalGross        || 0,
          net:   s.totalNet          || 0,
          cost:  s.totalEmployerCost || 0,
        });
      }
      // Jours "auto" (présences) : on ne mémorise que pour les employés non modifiés
      if (Array.isArray(result?.results)) {
        setAutoDays(prev => {
          const next = { ...prev };
          for (const r of result.results) {
            const d = r?.data?.daysToPay;
            if (r?.success && d != null && sentOverrides[r.employeeId] === undefined) {
              next[r.employeeId] = Number(d);
            }
          }
          return next;
        });
      }
    } catch {
      if (reqId !== estimationReq.current) return;
      setEstimation({ gross: 0, cost: 0, net: 0, count: selectedIds.length });
    } finally {
      if (reqId === estimationReq.current) setIsLoadingEst(false);
    }
  };

  const formatDetailLog = (detail: any): string => {
    const name = detail.employeeName || 'Employé';
    if (detail.status === 'SUCCESS') {
      const parts = [`Net: ${Number(detail.netSalary || 0).toLocaleString()} F`];
      if (detail.workedDays != null) parts.push(`${detail.workedDays}j travaillés`);
      if (detail.loanDeduction)    parts.push(`Prêt: -${Number(detail.loanDeduction).toLocaleString()} F`);
      if (detail.advanceDeduction) parts.push(`Avance: -${Number(detail.advanceDeduction).toLocaleString()} F`);
      if (detail.leaveIndemnity)   parts.push(`Congé: +${Number(detail.leaveIndemnity).toLocaleString()} F`);
      return `✅ ${name} → ${parts.join(' · ')}`;
    }
    if (detail.status === 'SKIPPED') {
      return `⚠️ ${name} → Ignoré (${detail.reason || 'Doublon'})`;
    }
    return `❌ ${name} → Échec (${detail.reason || 'Erreur'})`;
  };

  const processBatch = async () => {
    setIsProcessing(true);
    setResults({ success: 0, failed: 0, skipped: 0 });
    setLogs([]);
    setProgress(0);
    setProcessingDetails([]);

    const monthNumber = getMonthNumber(month);
    const total = selectedIds.length;
    let processed = 0;
    const details: any[] = [];

    setLogs(prev => [`🚀 Lancement du traitement de ${total} bulletins...`, ...prev]);
    setProgress(2);

    try {
      // ✅ Flux temps réel — chaque employé traité arrive dès que le backend
      // a fini SON bulletin, pas d'attente de la fin du lot entier — et plus
      // de ré-affichage factice ligne par ligne après coup : ce qu'on
      // affiche ici arrive réellement au fur et à mesure du traitement.
      await api.postStream('/payrolls/generate-stream', {
        employeeIds:    selectedIds,
        month:          monthNumber,
        year:           year,
        customWorkDays: workDays,
        daysOverrides:  buildDaysOverrides(),
      }, (line: any) => {
        if (line.type === 'detail') {
          processed++;
          details.push(line);
          setProcessingDetails([...details]);
          setCurrentEmployee(line.employeeName || `Employé ${processed}`);
          setProgress(Math.min(97, Math.round((processed / Math.max(total, 1)) * 95) + 2));
          setLogs(prev => [formatDetailLog(line), ...prev]);
          setResults(prev => ({
            ...prev,
            success: prev.success + (line.status === 'SUCCESS' ? 1 : 0),
            skipped: prev.skipped + (line.status === 'SKIPPED' ? 1 : 0),
            failed:  prev.failed  + (line.status === 'FAILED'  ? 1 : 0),
          }));
        } else if (line.type === 'summary') {
          setProgress(100);
          setLogs(prev => [`🎉 Terminé : ${line.created || 0} créés, ${line.skipped || 0} ignorés, ${line.failed || 0} échecs`, ...prev]);
        } else if (line.type === 'error') {
          setLogs(prev => [`❌ ERREUR : ${line.message}`, ...prev]);
        }
      });
    } catch (e: any) {
      setProgress(100);
      setLogs(prev => [`❌ ERREUR : ${e.message}`, ...prev]);
      if (details.length === 0) {
        setResults({ success: 0, failed: selectedIds.length, skipped: 0 });
        setProcessingDetails(selectedIds.map(id => {
          const emp = employees.find(em => em.id === id);
          return {
            employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Employé inconnu',
            status: 'FAILED',
            reason: e.message,
          };
        }));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500" size={32} />
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
          className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Génération Paie en Masse</h1>
          <p className="text-sm text-gray-500">Traitement automatisé des bulletins mensuels.</p>
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-3xl shadow-xl border border-[var(--border)] overflow-hidden flex flex-col min-h-[500px]">
        <StepHeader currentStep={currentStep} />

        <div className="flex-1 p-8 md:p-12 relative">
          {currentStep === 1 && (
            <PeriodStep month={month} year={year} workDays={workDays}
              onMonthChange={setMonth} onYearChange={setYear} onWorkDaysChange={setWorkDays} />
          )}
          {currentStep === 2 && (
            <SelectionStep employees={employees} selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              workDays={workDays}
              autoDays={autoDays}
              daysInput={daysInput}
              onDaysChange={handleDaysChange}
              onDaysReset={handleDaysReset}
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

        <div className="p-6 border-t border-[var(--border)] bg-[var(--surface-2)] flex justify-between items-center">
          <button disabled={currentStep === 1 || isProcessing} onClick={() => setCurrentStep(c => c - 1)}
            className="px-6 py-3 border border-[var(--border)] rounded-xl font-bold text-[var(--text-muted)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-[var(--surface)]">
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