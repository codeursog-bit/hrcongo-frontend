'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, Loader2, Gift,
  AlertCircle, Clock, Moon, DollarSign, CreditCard,
  Wallet, Calculator, Building2, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import EmployeeSelector from './components/EmployeeSelector';

// ============================================================================
// ✅ Interface 100% alignée avec ce que le backend retourne
//    Zéro calcul côté front — on affiche uniquement ce que /payrolls/simulate donne
// ============================================================================
interface SimulationResult {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    baseSalary: number;
    effectiveBaseSalary: number;
    isSubjectToCnss: boolean;
    isSubjectToIrpp: boolean;
    isSubjectToTus?: boolean;
    taxExemptionReason?: string;
  };
  month: number;
  year: number;
  daysToPay: number;
  workDays: number;
  absenceDeduction: number;
  overtime: {
    hours10: number;  amount10: number;
    hours25: number;  amount25: number;
    hours50: number;  amount50: number;
    hours100: number; amount100: number;
    total: number;
  };
  bonuses: Array<{
    id: string; bonusType: string; amount: number;
    source: string; details?: string;
    isTaxable?: boolean; isCnss?: boolean;
  }>;
  totalBonuses: number;
  adjustedBaseSalary: number;
  grossSalary: number;
  // ✅ Cotisations salariales — backend décide
  cnssSalarial: number;
  its: number;
  irppDetails?: any;
  // ✅ Prêts & avances — backend récupère en BDD
  loans: Array<{ id: string; monthlyRepayment: number; remainingBalance: number; label?: string }>;
  advances: Array<{ id: string; amount: number; createdAt: string; label?: string }>;
  totalLoanDeduction: number;
  totalAdvanceDeduction: number;
  totalDeductions: number;
  netSalary: number;
  // ✅ Part patronale — 3 branches CNSS + TUS 2 lignes
  cnssEmployer: number;
  cnssEmployerPension: number;
  cnssEmployerFamily: number;
  cnssEmployerAccident: number;
  tusDgiAmount: number;
  tusCnssAmount: number;
  tusTotal: number;
  totalEmployerCost: number;
  // ✅ Settings utilisés
  settings: {
    cnssSalarialRate: number;
    overtimeRate10: number;
    overtimeRate25: number;
    overtimeRate50: number;
    overtimeRate100: number;
    workDaysPerMonth?: number;
  };
  simulationMode?: string;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const fmt = (v: number) => Math.round(v || 0).toLocaleString('fr-FR');

export default function CreatePayrollPage() {
  const router = useRouter();

  const [employees, setEmployees]                 = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [selectedEmployee, setSelectedEmployee]   = useState<any>(null);

  const now = new Date();
  const [month, setMonth] = useState(MONTHS[now.getMonth()]);
  const [year, setYear]   = useState(now.getFullYear());

  // Heures sup — viennent du backend (pointage), modifiables par le RH
  const [overtime10, setOvertime10]   = useState(0);
  const [overtime25, setOvertime25]   = useState(0);
  const [overtime50, setOvertime50]   = useState(0);
  const [overtime100, setOvertime100] = useState(0);
  const [overtimeEdited, setOvertimeEdited] = useState(false);

  const [simulation, setSimulation]           = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating]       = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting]         = useState(false);
  const [showSuccess, setShowSuccess]           = useState(false);
  const [createdPayrollId, setCreatedPayrollId] = useState<string | null>(null);

  const [showEmployerCost, setShowEmployerCost] = useState(false);

  // ── Chargement employés ────────────────────────────────────────────────────
  useEffect(() => {
    api.get<any>('/employees/simple')
      .then(raw => setEmployees(Array.isArray(raw) ? raw : (raw?.data ?? [])))
      .catch(() => setEmployees([]))
      .finally(() => setIsLoadingEmployees(false));
  }, []);

  // ── Simulation auto dès sélection employé ou changement période ────────────
  useEffect(() => {
    if (!selectedEmployee) {
      setSimulation(null); setSimulationError(null); setOvertimeEdited(false);
      setOvertime10(0); setOvertime25(0); setOvertime50(0); setOvertime100(0);
      return;
    }
    runSimulation(false);
  }, [selectedEmployee, month, year]);

  // ── Relancer si RH corrige heures sup (debounce 700ms) ─────────────────────
  useEffect(() => {
    if (!selectedEmployee || !overtimeEdited) return;
    const t = setTimeout(() => runSimulation(true), 700);
    return () => clearTimeout(t);
  }, [overtime10, overtime25, overtime50, overtime100]);

  const getMonthNumber = (m: string) =>
    MONTHS.findIndex(x => x.toLowerCase() === m.toLowerCase()) + 1;

  // ── POST /payrolls/simulate — LE BACKEND CALCULE TOUT ─────────────────────
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
      // Si le RH a corrigé les heures sup, on les envoie
      if (withOvertimeOverride) {
        body.overtimeHours10  = overtime10;
        body.overtimeHours25  = overtime25;
        body.overtimeHours50  = overtime50;
        body.overtimeHours100 = overtime100;
      }
      const result = await api.post<SimulationResult>('/payrolls/simulate', body);
      setSimulation(result);
      // Initialiser les heures sup depuis le pointage backend (première fois)
      if (!withOvertimeOverride) {
        setOvertime10(result.overtime.hours10);
        setOvertime25(result.overtime.hours25);
        setOvertime50(result.overtime.hours50);
        setOvertime100(result.overtime.hours100);
        setOvertimeEdited(false);
      }
    } catch (e: any) {
      setSimulationError(e?.response?.data?.message || e?.message || 'Erreur de simulation');
      setSimulation(null);
    } finally {
      setIsSimulating(false);
    }
  };

  // ── POST /payrolls — CRÉER LE BULLETIN EN BDD ─────────────────────────────
  const submitPayroll = async () => {
    if (!selectedEmployee || !simulation) return;
    setIsSubmitting(true);
    try {
      const result: any = await api.post('/payrolls', {
        employeeId:  selectedEmployee.id,
        month:       getMonthNumber(month),
        year,
        workedDays:  simulation.daysToPay,
        overtime10,   // ✅ noms alignés avec CreatePayrollDto backend
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

  if (isLoadingEmployees) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-sky-500" size={32} />
    </div>
  );

  const cnssPatTotal = simulation ? (simulation.cnssEmployerPension + simulation.cnssEmployerFamily + simulation.cnssEmployerAccident) : 0;

  return (
    <div className="max-w-[1600px] mx-auto pb-20 px-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()}
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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

        {/* ══ COLONNE GAUCHE — Formulaire ══ */}
        <div className="lg:col-span-3 space-y-5">

          {/* Période */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Période de paie</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Mois</label>
                <select value={month} onChange={e => { setMonth(e.target.value); setOvertimeEdited(false); }}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none cursor-pointer">
                  {MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Année</label>
                <select value={year} onChange={e => { setYear(Number(e.target.value)); setOvertimeEdited(false); }}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none cursor-pointer">
                  {[2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
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
              <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-red-800 dark:text-red-200 text-sm">Simulation impossible</p>
                <p className="text-red-600 dark:text-red-400 text-xs mt-1">{simulationError}</p>
              </div>
            </div>
          )}

          {/* Chargement */}
          {isSimulating && !simulation && (
            <div className="p-4 bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-800 rounded-xl flex items-center gap-3">
              <Loader2 size={16} className="text-sky-500 animate-spin shrink-0" />
              <p className="text-sm text-sky-700 dark:text-sky-300">Calcul depuis le serveur…</p>
            </div>
          )}

          {/* ✅ Exemptions fiscales — dès que le back répond */}
          {simulation && (!simulation.employee.isSubjectToCnss || !simulation.employee.isSubjectToIrpp) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-200 text-sm">Exemptions fiscales détectées</p>
                <div className="text-amber-600 dark:text-amber-400 text-xs mt-1 space-y-0.5">
                  {!simulation.employee.isSubjectToCnss && <p>• CNSS salariale : <strong>0 F</strong> — exempté</p>}
                  {!simulation.employee.isSubjectToIrpp && <p>• ITS / IRPP : <strong>0 F</strong> — exempté</p>}
                  {simulation.employee.taxExemptionReason && <p className="italic mt-1">Raison : {simulation.employee.taxExemptionReason}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ✅ Heures supplémentaires — depuis pointage, corrigeables */}
          {simulation && (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-2xl border border-orange-200 dark:border-orange-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-orange-900 dark:text-orange-200 flex items-center gap-2">
                  <Clock size={16} /> Heures Supplémentaires — Décret 78-360
                </h3>
                {overtimeEdited
                  ? <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full font-bold">✏️ Modifié</span>
                  : <span className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full">Depuis pointage</span>}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Valeurs issues du pointage. Modifiables — l'aperçu se recalcule automatiquement via le serveur.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: `HS +${simulation.settings.overtimeRate10}%`, sub: '5 premières heures',    val: overtime10,  set: setOvertime10,  color: 'amber'  },
                  { label: `HS +${simulation.settings.overtimeRate25}%`, sub: 'Heures suivantes',      val: overtime25,  set: setOvertime25,  color: 'orange' },
                  { label: `HS +${simulation.settings.overtimeRate50}%`, sub: 'Nuit / repos / férié',  val: overtime50,  set: setOvertime50,  color: 'purple' },
                  { label: `HS +${simulation.settings.overtimeRate100}%`,sub: 'Nuit dim. / férié',     val: overtime100, set: setOvertime100, color: 'red'    },
                ].map(ot => (
                  <div key={ot.label}>
                    <label className={`flex items-center gap-1 text-xs font-bold mb-1.5 ${
                      ot.color === 'amber'  ? 'text-amber-700 dark:text-amber-300'  :
                      ot.color === 'orange' ? 'text-orange-700 dark:text-orange-300':
                      ot.color === 'purple' ? 'text-purple-700 dark:text-purple-300':
                      'text-red-700 dark:text-red-300'}`}>
                      {(ot.color === 'purple' || ot.color === 'red') && <Moon size={10} />}
                      {ot.label} — {ot.sub}
                    </label>
                    <input type="number" step="0.5" min="0" value={ot.val}
                      onChange={e => { ot.set(Number(e.target.value) || 0); setOvertimeEdited(true); }}
                      className={`w-full p-3 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-lg focus:outline-none focus:ring-2 ${
                        ot.color === 'amber'  ? 'border-amber-200 dark:border-amber-800 focus:ring-amber-400/30'  :
                        ot.color === 'orange' ? 'border-orange-200 dark:border-orange-800 focus:ring-orange-400/30':
                        ot.color === 'purple' ? 'border-purple-200 dark:border-purple-800 focus:ring-purple-400/30':
                        'border-red-200 dark:border-red-800 focus:ring-red-400/30'}`} />
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ✅ Primes — imposables et non imposables, depuis le backend */}
          {simulation && simulation.bonuses.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/10 dark:to-sky-900/10 rounded-2xl border border-cyan-200 dark:border-cyan-800 p-5">
              <h3 className="text-sm font-bold text-cyan-900 dark:text-cyan-200 mb-4 flex items-center gap-2">
                <Gift size={16} /> Primes applicables — {month} {year}
              </h3>
              <div className="space-y-2">
                {simulation.bonuses.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-cyan-100 dark:border-cyan-900/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{b.bonusType}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500">
                          {b.source === 'AUTOMATIC' ? '🤖 Auto convention' : '✋ Manuelle'}
                          {b.details && ` · ${b.details}`}
                        </p>
                        {/* ✅ Badges fiscal */}
                        {b.isTaxable === true  && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-600 border border-cyan-200 font-bold">ITS</span>}
                        {b.isCnss === true      && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 font-bold">CNSS</span>}
                        {b.isTaxable === false  && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 border border-amber-200 font-bold">Non imposable</span>}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 flex-shrink-0 ml-3">
                      +{fmt(b.amount)} F
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-cyan-200 dark:border-cyan-800">
                  <span className="text-sm font-bold text-cyan-800 dark:text-cyan-200">Total primes</span>
                  <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">+{fmt(simulation.totalBonuses)} F</span>
                </div>
              </div>
            </motion.section>
          )}

          {/* ✅ Prêts & avances — récupérés par le backend depuis la BDD */}
          {simulation && (simulation.totalLoanDeduction > 0 || simulation.totalAdvanceDeduction > 0) && (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 rounded-2xl border border-red-200 dark:border-red-800 p-5">
              <h3 className="text-sm font-bold text-red-900 dark:text-red-200 mb-4 flex items-center gap-2">
                <DollarSign size={16} /> Déductions programmées
              </h3>
              <div className="space-y-2">
                {simulation.loans.map(loan => (
                  <div key={loan.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center gap-3">
                      <CreditCard size={14} className="text-red-500 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {loan.label || `Prêt #${loan.id.substring(0, 8)}`}
                        </p>
                        <p className="text-xs text-gray-500">Solde restant : {fmt(loan.remainingBalance)} F</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-red-600 dark:text-red-400">−{fmt(loan.monthlyRepayment)} F</span>
                  </div>
                ))}
                {simulation.advances.map(adv => (
                  <div key={adv.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center gap-3">
                      <Wallet size={14} className="text-red-500 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {adv.label || `Avance #${adv.id.substring(0, 8)}`}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(adv.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-red-600 dark:text-red-400">−{fmt(adv.amount)} F</span>
                  </div>
                ))}
                {(simulation.totalLoanDeduction > 0 && simulation.totalAdvanceDeduction > 0) && (
                  <div className="flex justify-between pt-2 border-t border-red-200 dark:border-red-800">
                    <span className="text-sm font-bold text-red-800 dark:text-red-200">Total déductions</span>
                    <span className="font-mono font-bold text-red-700 dark:text-red-300">
                      −{fmt(simulation.totalLoanDeduction + simulation.totalAdvanceDeduction)} F
                    </span>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* Message si pas encore d'employé sélectionné */}
          {!selectedEmployee && !isSimulating && (
            <div className="p-8 bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-center text-gray-400">
              <Calculator size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Sélectionnez un employé pour commencer</p>
              <p className="text-xs mt-1">Le bulletin est calculé automatiquement par le serveur</p>
            </div>
          )}
        </div>

        {/* ══ COLONNE DROITE — Aperçu bulletin (résultat backend) ══ */}
        <div className="lg:col-span-2 sticky top-6">
          <AnimatePresence mode="wait">

            {simulation ? (
              <motion.div key="preview"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">

                {/* Header aperçu */}
                <div className="bg-gradient-to-r from-gray-900 to-slate-800 text-white p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-base">Aperçu du Bulletin</h3>
                      <p className="text-gray-400 text-xs capitalize">{month} {year}</p>
                    </div>
                    {isSimulating && (
                      <div className="flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin text-sky-400" />
                        <span className="text-xs text-sky-400">Recalcul…</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white/80">
                    {simulation.employee.firstName} {simulation.employee.lastName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {simulation.daysToPay}/{simulation.workDays} jours travaillés
                  </p>
                </div>

                <div className="p-5 space-y-1.5 text-sm">

                  {/* Salaire de base */}
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">Salaire de base</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">+{fmt(simulation.employee.effectiveBaseSalary ?? simulation.employee.baseSalary)} F</span>
                  </div>

                  {/* Absence */}
                  {simulation.absenceDeduction > 0 && (
                    <div className="flex justify-between py-1.5 text-orange-500">
                      <span>Absence ({simulation.workDays - simulation.daysToPay}j)</span>
                      <span className="font-mono">−{fmt(simulation.absenceDeduction)} F</span>
                    </div>
                  )}

                  {/* ✅ Heures sup — montants calculés par le backend */}
                  {simulation.overtime.amount10  > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500 dark:text-gray-400">HS +{simulation.settings.overtimeRate10}% ({simulation.overtime.hours10}h)</span>
                      <span className="font-mono font-bold text-amber-600">+{fmt(simulation.overtime.amount10)} F</span>
                    </div>
                  )}
                  {simulation.overtime.amount25  > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500 dark:text-gray-400">HS +{simulation.settings.overtimeRate25}% ({simulation.overtime.hours25}h)</span>
                      <span className="font-mono font-bold text-amber-600">+{fmt(simulation.overtime.amount25)} F</span>
                    </div>
                  )}
                  {simulation.overtime.amount50  > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Moon size={10} className="text-purple-400" />HS +{simulation.settings.overtimeRate50}% ({simulation.overtime.hours50}h)</span>
                      <span className="font-mono font-bold text-purple-600">+{fmt(simulation.overtime.amount50)} F</span>
                    </div>
                  )}
                  {simulation.overtime.amount100 > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Moon size={10} className="text-red-400" />HS +{simulation.settings.overtimeRate100}% ({simulation.overtime.hours100}h)</span>
                      <span className="font-mono font-bold text-red-600">+{fmt(simulation.overtime.amount100)} F</span>
                    </div>
                  )}

                  {/* ✅ Primes */}
                  {simulation.totalBonuses > 0 && (
                    <div className="py-1.5 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Gift size={11} className="text-cyan-500" />Primes</span>
                        <span className="font-mono font-bold text-cyan-600">+{fmt(simulation.totalBonuses)} F</span>
                      </div>
                      {simulation.bonuses.map(b => (
                        <div key={b.id} className="flex justify-between text-xs text-gray-400 pl-4 py-0.5">
                          <span className="truncate flex-1 mr-2">{b.bonusType}</span>
                          <span className="font-mono flex-shrink-0">+{fmt(b.amount)} F</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Brut */}
                  <div className="flex justify-between py-2.5 bg-emerald-50 dark:bg-emerald-900/20 px-3 rounded-xl my-1">
                    <span className="font-bold text-emerald-800 dark:text-emerald-200">Salaire Brut</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{fmt(simulation.grossSalary)} F</span>
                  </div>

                  {/* ✅ CNSS — 0 si exempté */}
                  <div className="flex justify-between py-1.5">
                    <span className={simulation.employee.isSubjectToCnss ? 'text-red-500' : 'text-gray-400'}>
                      CNSS ({simulation.settings.cnssSalarialRate}%)
                    </span>
                    <span className={`font-mono font-bold ${simulation.employee.isSubjectToCnss ? 'text-red-500' : 'text-gray-400'}`}>
                      {simulation.employee.isSubjectToCnss ? `−${fmt(simulation.cnssSalarial)} F` : '0 F (Exempté)'}
                    </span>
                  </div>

                  {/* ✅ ITS — 0 si exempté */}
                  <div className="flex justify-between py-1.5">
                    <span className={simulation.employee.isSubjectToIrpp ? 'text-red-500' : 'text-gray-400'}>
                      ITS / IRPP
                    </span>
                    <span className={`font-mono font-bold ${simulation.employee.isSubjectToIrpp ? 'text-red-500' : 'text-gray-400'}`}>
                      {simulation.employee.isSubjectToIrpp ? `−${fmt(simulation.its)} F` : '0 F (Exempté)'}
                    </span>
                  </div>

                  {/* ✅ Prêts */}
                  {simulation.totalLoanDeduction > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-red-500 flex items-center gap-1"><CreditCard size={11} />Prêts ({simulation.loans.length})</span>
                      <span className="font-mono font-bold text-red-500">−{fmt(simulation.totalLoanDeduction)} F</span>
                    </div>
                  )}

                  {/* ✅ Avances */}
                  {simulation.totalAdvanceDeduction > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-red-500 flex items-center gap-1"><Wallet size={11} />Avances ({simulation.advances.length})</span>
                      <span className="font-mono font-bold text-red-500">−{fmt(simulation.totalAdvanceDeduction)} F</span>
                    </div>
                  )}

                  {/* NET À PAYER */}
                  <div className="pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-700 mt-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Net à Payer</span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
                          {fmt(simulation.netSalary)}
                        </span>
                        <span className="text-sm text-gray-400 ml-1.5">FCFA</span>
                      </div>
                    </div>
                  </div>

                  {/* ✅ Coût employeur — dépliable */}
                  <div className="mt-3 border border-orange-200 dark:border-orange-800/50 rounded-xl overflow-hidden">
                    <button onClick={() => setShowEmployerCost(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100/50 transition-colors cursor-pointer">
                      <span className="flex items-center gap-2 text-xs font-bold text-orange-700 dark:text-orange-400">
                        <Building2 size={13} /> Coût Employeur
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-orange-600 dark:text-orange-400">
                          +{fmt(simulation.totalEmployerCost)} F
                        </span>
                        {showEmployerCost ? <ChevronUp size={13} className="text-orange-400" /> : <ChevronDown size={13} className="text-orange-400" />}
                      </div>
                    </button>
                    {showEmployerCost && (
                      <div className="px-4 py-3 space-y-1.5 text-xs bg-white dark:bg-gray-800/50">
                        <div className="flex justify-between text-gray-500"><span>CNSS Pensions (8%)</span><span className="font-mono font-bold text-orange-500">+{fmt(simulation.cnssEmployerPension)} F</span></div>
                        <div className="flex justify-between text-gray-500"><span>CNSS Famille (10,03%)</span><span className="font-mono font-bold text-orange-500">+{fmt(simulation.cnssEmployerFamily)} F</span></div>
                        <div className="flex justify-between text-gray-500"><span>CNSS Accident (2,25%)</span><span className="font-mono font-bold text-orange-500">+{fmt(simulation.cnssEmployerAccident)} F</span></div>
                        <div className="flex justify-between text-gray-500 pt-1 border-t border-orange-100 dark:border-orange-900/30">
                          <span>Sous-total CNSS pat.</span>
                          <span className="font-mono font-bold text-orange-500">+{fmt(cnssPatTotal)} F</span>
                        </div>
                        <div className="flex justify-between text-gray-500"><span>TUS DGI (4,13%)</span><span className="font-mono font-bold text-amber-500">+{fmt(simulation.tusDgiAmount)} F</span></div>
                        <div className="flex justify-between text-gray-500"><span>TUS CNSS (3,38%)</span><span className="font-mono font-bold text-amber-500">+{fmt(simulation.tusCnssAmount)} F</span></div>
                        <div className="flex justify-between font-bold pt-2 border-t border-orange-200 dark:border-orange-800 text-gray-900 dark:text-white">
                          <span>Coût total</span>
                          <span className="font-mono">{fmt(simulation.totalEmployerCost)} F</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bouton confirmer → créer en BDD */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={submitPayroll} disabled={isSubmitting || isSimulating}
                    className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    {isSubmitting ? 'Enregistrement…' : 'Confirmer & Créer le Bulletin'}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-2">
                    Le bulletin sera créé en base de données avec ces valeurs
                  </p>
                </div>
              </motion.div>

            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl min-h-[300px] flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <Calculator size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">
                  {isSimulating ? 'Calcul en cours…' : 'Sélectionnez un employé pour voir l\'aperçu'}
                </p>
                <p className="text-xs text-gray-400 mt-1">L'aperçu est calculé automatiquement par le serveur</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Modal succès ── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center">
              <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bulletin Créé !</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                La fiche de paie a été enregistrée avec succès en base de données.
              </p>
              <div className="flex gap-3">
                <button onClick={() => { setShowSuccess(false); setSimulation(null); setSelectedEmployee(null); }}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Nouveau
                </button>
                {createdPayrollId && (
                  <button onClick={() => router.push(`/paie/${createdPayrollId}`)}
                    className="flex-1 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 shadow-lg transition-colors">
                    Voir bulletin
                  </button>
                )}
                <button onClick={() => router.push('/paie')}
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg transition-colors">
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
// import {
//   ArrowLeft, CheckCircle2, Loader2, Gift,
//   AlertCircle, Clock, Moon, DollarSign, CreditCard,
//   Wallet, Calculator, Building2, ChevronDown, ChevronUp
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';
// import EmployeeSelector from './components/EmployeeSelector';

// // ============================================================================
// // ✅ Interface 100% alignée avec ce que le backend retourne
// //    Zéro calcul côté front — on affiche uniquement ce que /payrolls/simulate donne
// // ============================================================================
// interface SimulationResult {
//   employee: {
//     id: string;
//     firstName: string;
//     lastName: string;
//     baseSalary: number;
//     effectiveBaseSalary: number;
//     isSubjectToCnss: boolean;
//     isSubjectToIrpp: boolean;
//     isSubjectToTus?: boolean;
//     taxExemptionReason?: string;
//   };
//   month: number;
//   year: number;
//   daysToPay: number;
//   workDays: number;
//   absenceDeduction: number;
//   overtime: {
//     hours10: number;  amount10: number;
//     hours25: number;  amount25: number;
//     hours50: number;  amount50: number;
//     hours100: number; amount100: number;
//     total: number;
//   };
//   bonuses: Array<{
//     id: string; bonusType: string; amount: number;
//     source: string; details?: string;
//     isTaxable?: boolean; isCnss?: boolean;
//   }>;
//   totalBonuses: number;
//   adjustedBaseSalary: number;
//   grossSalary: number;
//   // ✅ Cotisations salariales — backend décide
//   cnssSalarial: number;
//   its: number;
//   irppDetails?: any;
//   // ✅ Prêts & avances — backend récupère en BDD
//   loans: Array<{ id: string; monthlyRepayment: number; remainingBalance: number; label?: string }>;
//   advances: Array<{ id: string; amount: number; createdAt: string; label?: string }>;
//   totalLoanDeduction: number;
//   totalAdvanceDeduction: number;
//   totalDeductions: number;
//   netSalary: number;
//   // ✅ Part patronale — 3 branches CNSS + TUS 2 lignes
//   cnssEmployer: number;
//   cnssEmployerPension: number;
//   cnssEmployerFamily: number;
//   cnssEmployerAccident: number;
//   tusDgiAmount: number;
//   tusCnssAmount: number;
//   tusTotal: number;
//   totalEmployerCost: number;
//   // ✅ Settings utilisés
//   settings: {
//     cnssSalarialRate: number;
//     overtimeRate10: number;
//     overtimeRate25: number;
//     overtimeRate50: number;
//     overtimeRate100: number;
//     workDaysPerMonth?: number;
//   };
//   simulationMode?: string;
// }

// const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

// const fmt = (v: number) => Math.round(v || 0).toLocaleString('fr-FR');

// export default function CreatePayrollPage() {
//   const router = useRouter();

//   const [employees, setEmployees]                 = useState<any[]>([]);
//   const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
//   const [selectedEmployee, setSelectedEmployee]   = useState<any>(null);

//   const now = new Date();
//   const [month, setMonth] = useState(MONTHS[now.getMonth()]);
//   const [year, setYear]   = useState(now.getFullYear());

//   // Heures sup — viennent du backend (pointage), modifiables par le RH
//   const [overtime10, setOvertime10]   = useState(0);
//   const [overtime25, setOvertime25]   = useState(0);
//   const [overtime50, setOvertime50]   = useState(0);
//   const [overtime100, setOvertime100] = useState(0);
//   const [overtimeEdited, setOvertimeEdited] = useState(false);

//   const [simulation, setSimulation]           = useState<SimulationResult | null>(null);
//   const [isSimulating, setIsSimulating]       = useState(false);
//   const [simulationError, setSimulationError] = useState<string | null>(null);

//   const [isSubmitting, setIsSubmitting]         = useState(false);
//   const [showSuccess, setShowSuccess]           = useState(false);
//   const [createdPayrollId, setCreatedPayrollId] = useState<string | null>(null);

//   const [showEmployerCost, setShowEmployerCost] = useState(false);

//   // ── Chargement employés ────────────────────────────────────────────────────
//   useEffect(() => {
//     api.get<any>('/employees/simple')
//       .then(raw => setEmployees(Array.isArray(raw) ? raw : (raw?.data ?? [])))
//       .catch(() => setEmployees([]))
//       .finally(() => setIsLoadingEmployees(false));
//   }, []);

//   // ── Simulation auto dès sélection employé ou changement période ────────────
//   useEffect(() => {
//     if (!selectedEmployee) {
//       setSimulation(null); setSimulationError(null); setOvertimeEdited(false);
//       setOvertime10(0); setOvertime25(0); setOvertime50(0); setOvertime100(0);
//       return;
//     }
//     runSimulation(false);
//   }, [selectedEmployee, month, year]);

//   // ── Relancer si RH corrige heures sup (debounce 700ms) ─────────────────────
//   useEffect(() => {
//     if (!selectedEmployee || !overtimeEdited) return;
//     const t = setTimeout(() => runSimulation(true), 700);
//     return () => clearTimeout(t);
//   }, [overtime10, overtime25, overtime50, overtime100]);

//   const getMonthNumber = (m: string) =>
//     MONTHS.findIndex(x => x.toLowerCase() === m.toLowerCase()) + 1;

//   // ── POST /payrolls/simulate — LE BACKEND CALCULE TOUT ─────────────────────
//   const runSimulation = async (withOvertimeOverride = false) => {
//     if (!selectedEmployee) return;
//     setIsSimulating(true);
//     setSimulationError(null);
//     try {
//       const body: any = {
//         employeeId: selectedEmployee.id,
//         month: getMonthNumber(month),
//         year,
//       };
//       // Si le RH a corrigé les heures sup, on les envoie
//       if (withOvertimeOverride) {
//         body.overtimeHours10  = overtime10;
//         body.overtimeHours25  = overtime25;
//         body.overtimeHours50  = overtime50;
//         body.overtimeHours100 = overtime100;
//       }
//       const result = await api.post<SimulationResult>('/payrolls/simulate', body);
//       setSimulation(result);
//       // Initialiser les heures sup depuis le pointage backend (première fois)
//       if (!withOvertimeOverride) {
//         setOvertime10(result.overtime.hours10);
//         setOvertime25(result.overtime.hours25);
//         setOvertime50(result.overtime.hours50);
//         setOvertime100(result.overtime.hours100);
//         setOvertimeEdited(false);
//       }
//     } catch (e: any) {
//       setSimulationError(e?.response?.data?.message || e?.message || 'Erreur de simulation');
//       setSimulation(null);
//     } finally {
//       setIsSimulating(false);
//     }
//   };

//   // ── POST /payrolls — CRÉER LE BULLETIN EN BDD ─────────────────────────────
//   const submitPayroll = async () => {
//     if (!selectedEmployee || !simulation) return;
//     setIsSubmitting(true);
//     try {
//       const result: any = await api.post('/payrolls', {
//         employeeId:  selectedEmployee.id,
//         month:       getMonthNumber(month),
//         year,
//         workedDays:  simulation.daysToPay,
//         overtime10,   // ✅ noms alignés avec CreatePayrollDto backend
//         overtime25,
//         overtime50,
//         overtime100,
//       });
//       setCreatedPayrollId(result?.id || null);
//       setShowSuccess(true);
//     } catch (e: any) {
//       alert(`Erreur: ${e.response?.data?.message || e.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (isLoadingEmployees) return (
//     <div className="min-h-screen flex items-center justify-center">
//       <Loader2 className="animate-spin text-sky-500" size={32} />
//     </div>
//   );

//   const cnssPatTotal = simulation ? (simulation.cnssEmployerPension + simulation.cnssEmployerFamily + simulation.cnssEmployerAccident) : 0;

//   return (
//     <div className="max-w-[1600px] mx-auto pb-20 px-4">

//       {/* ── Header ── */}
//       <div className="flex items-center gap-4 mb-8">
//         <button onClick={() => router.back()}
//           className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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

//         {/* ══ COLONNE GAUCHE — Formulaire ══ */}
//         <div className="lg:col-span-3 space-y-5">

//           {/* Période */}
//           <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
//             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Période de paie</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Mois</label>
//                 <select value={month} onChange={e => { setMonth(e.target.value); setOvertimeEdited(false); }}
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none cursor-pointer">
//                   {MONTHS.map(m => <option key={m}>{m}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Année</label>
//                 <select value={year} onChange={e => { setYear(Number(e.target.value)); setOvertimeEdited(false); }}
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none cursor-pointer">
//                   {[2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Sélecteur employé */}
//           <EmployeeSelector
//             selectedEmployee={selectedEmployee}
//             employees={employees}
//             onSelect={emp => { setSelectedEmployee(emp); setSimulation(null); }}
//             onClear={() => { setSelectedEmployee(null); setSimulation(null); }}
//           />

//           {/* Erreur simulation */}
//           {simulationError && (
//             <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
//               <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
//               <div>
//                 <p className="font-bold text-red-800 dark:text-red-200 text-sm">Simulation impossible</p>
//                 <p className="text-red-600 dark:text-red-400 text-xs mt-1">{simulationError}</p>
//               </div>
//             </div>
//           )}

//           {/* Chargement */}
//           {isSimulating && !simulation && (
//             <div className="p-4 bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-800 rounded-xl flex items-center gap-3">
//               <Loader2 size={16} className="text-sky-500 animate-spin shrink-0" />
//               <p className="text-sm text-sky-700 dark:text-sky-300">Calcul depuis le serveur…</p>
//             </div>
//           )}

//           {/* ✅ Exemptions fiscales — dès que le back répond */}
//           {simulation && (!simulation.employee.isSubjectToCnss || !simulation.employee.isSubjectToIrpp) && (
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//               className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-xl flex items-start gap-3">
//               <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
//               <div>
//                 <p className="font-bold text-amber-800 dark:text-amber-200 text-sm">Exemptions fiscales détectées</p>
//                 <div className="text-amber-600 dark:text-amber-400 text-xs mt-1 space-y-0.5">
//                   {!simulation.employee.isSubjectToCnss && <p>• CNSS salariale : <strong>0 F</strong> — exempté</p>}
//                   {!simulation.employee.isSubjectToIrpp && <p>• ITS / IRPP : <strong>0 F</strong> — exempté</p>}
//                   {simulation.employee.taxExemptionReason && <p className="italic mt-1">Raison : {simulation.employee.taxExemptionReason}</p>}
//                 </div>
//               </div>
//             </motion.div>
//           )}

//           {/* ✅ Heures supplémentaires — depuis pointage, corrigeables */}
//           {simulation && (
//             <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
//               className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-2xl border border-orange-200 dark:border-orange-800 p-5">
//               <div className="flex items-center justify-between mb-3">
//                 <h3 className="text-sm font-bold text-orange-900 dark:text-orange-200 flex items-center gap-2">
//                   <Clock size={16} /> Heures Supplémentaires — Décret 78-360
//                 </h3>
//                 {overtimeEdited
//                   ? <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full font-bold">✏️ Modifié</span>
//                   : <span className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full">Depuis pointage</span>}
//               </div>
//               <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
//                 Valeurs issues du pointage. Modifiables — l'aperçu se recalcule automatiquement via le serveur.
//               </p>
//               <div className="grid grid-cols-2 gap-4">
//                 {[
//                   { label: `HS +${simulation.settings.overtimeRate10}%`, sub: '5 premières heures',    val: overtime10,  set: setOvertime10,  color: 'amber'  },
//                   { label: `HS +${simulation.settings.overtimeRate25}%`, sub: 'Heures suivantes',      val: overtime25,  set: setOvertime25,  color: 'orange' },
//                   { label: `HS +${simulation.settings.overtimeRate50}%`, sub: 'Nuit / repos / férié',  val: overtime50,  set: setOvertime50,  color: 'purple' },
//                   { label: `HS +${simulation.settings.overtimeRate100}%`,sub: 'Nuit dim. / férié',     val: overtime100, set: setOvertime100, color: 'red'    },
//                 ].map(ot => (
//                   <div key={ot.label}>
//                     <label className={`flex items-center gap-1 text-xs font-bold mb-1.5 ${
//                       ot.color === 'amber'  ? 'text-amber-700 dark:text-amber-300'  :
//                       ot.color === 'orange' ? 'text-orange-700 dark:text-orange-300':
//                       ot.color === 'purple' ? 'text-purple-700 dark:text-purple-300':
//                       'text-red-700 dark:text-red-300'}`}>
//                       {(ot.color === 'purple' || ot.color === 'red') && <Moon size={10} />}
//                       {ot.label} — {ot.sub}
//                     </label>
//                     <input type="number" step="0.5" min="0" value={ot.val}
//                       onChange={e => { ot.set(Number(e.target.value) || 0); setOvertimeEdited(true); }}
//                       className={`w-full p-3 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-lg focus:outline-none focus:ring-2 ${
//                         ot.color === 'amber'  ? 'border-amber-200 dark:border-amber-800 focus:ring-amber-400/30'  :
//                         ot.color === 'orange' ? 'border-orange-200 dark:border-orange-800 focus:ring-orange-400/30':
//                         ot.color === 'purple' ? 'border-purple-200 dark:border-purple-800 focus:ring-purple-400/30':
//                         'border-red-200 dark:border-red-800 focus:ring-red-400/30'}`} />
//                   </div>
//                 ))}
//               </div>
//             </motion.section>
//           )}

//           {/* ✅ Primes — imposables et non imposables, depuis le backend */}
//           {simulation && simulation.bonuses.length > 0 && (
//             <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
//               className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/10 dark:to-sky-900/10 rounded-2xl border border-cyan-200 dark:border-cyan-800 p-5">
//               <h3 className="text-sm font-bold text-cyan-900 dark:text-cyan-200 mb-4 flex items-center gap-2">
//                 <Gift size={16} /> Primes applicables — {month} {year}
//               </h3>
//               <div className="space-y-2">
//                 {simulation.bonuses.map(b => (
//                   <div key={b.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-cyan-100 dark:border-cyan-900/30">
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm font-bold text-gray-900 dark:text-white">{b.bonusType}</p>
//                       <div className="flex items-center gap-2 mt-0.5">
//                         <p className="text-xs text-gray-500">
//                           {b.source === 'AUTOMATIC' ? '🤖 Auto convention' : '✋ Manuelle'}
//                           {b.details && ` · ${b.details}`}
//                         </p>
//                         {/* ✅ Badges fiscal */}
//                         {b.isTaxable === true  && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-600 border border-cyan-200 font-bold">ITS</span>}
//                         {b.isCnss === true      && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 font-bold">CNSS</span>}
//                         {b.isTaxable === false  && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 border border-amber-200 font-bold">Non imposable</span>}
//                       </div>
//                     </div>
//                     <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 flex-shrink-0 ml-3">
//                       +{fmt(b.amount)} F
//                     </span>
//                   </div>
//                 ))}
//                 <div className="flex justify-between pt-2 border-t border-cyan-200 dark:border-cyan-800">
//                   <span className="text-sm font-bold text-cyan-800 dark:text-cyan-200">Total primes</span>
//                   <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">+{fmt(simulation.totalBonuses)} F</span>
//                 </div>
//               </div>
//             </motion.section>
//           )}

//           {/* ✅ Prêts & avances — récupérés par le backend depuis la BDD */}
//           {simulation && (simulation.totalLoanDeduction > 0 || simulation.totalAdvanceDeduction > 0) && (
//             <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
//               className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 rounded-2xl border border-red-200 dark:border-red-800 p-5">
//               <h3 className="text-sm font-bold text-red-900 dark:text-red-200 mb-4 flex items-center gap-2">
//                 <DollarSign size={16} /> Déductions programmées
//               </h3>
//               <div className="space-y-2">
//                 {simulation.loans.map(loan => (
//                   <div key={loan.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-900/30">
//                     <div className="flex items-center gap-3">
//                       <CreditCard size={14} className="text-red-500 shrink-0" />
//                       <div>
//                         <p className="text-sm font-bold text-gray-900 dark:text-white">
//                           {loan.label || `Prêt #${loan.id.substring(0, 8)}`}
//                         </p>
//                         <p className="text-xs text-gray-500">Solde restant : {fmt(loan.remainingBalance)} F</p>
//                       </div>
//                     </div>
//                     <span className="font-mono font-bold text-red-600 dark:text-red-400">−{fmt(loan.monthlyRepayment)} F</span>
//                   </div>
//                 ))}
//                 {simulation.advances.map(adv => (
//                   <div key={adv.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-900/30">
//                     <div className="flex items-center gap-3">
//                       <Wallet size={14} className="text-red-500 shrink-0" />
//                       <div>
//                         <p className="text-sm font-bold text-gray-900 dark:text-white">
//                           {adv.label || `Avance #${adv.id.substring(0, 8)}`}
//                         </p>
//                         <p className="text-xs text-gray-500">{new Date(adv.createdAt).toLocaleDateString('fr-FR')}</p>
//                       </div>
//                     </div>
//                     <span className="font-mono font-bold text-red-600 dark:text-red-400">−{fmt(adv.amount)} F</span>
//                   </div>
//                 ))}
//                 {(simulation.totalLoanDeduction > 0 && simulation.totalAdvanceDeduction > 0) && (
//                   <div className="flex justify-between pt-2 border-t border-red-200 dark:border-red-800">
//                     <span className="text-sm font-bold text-red-800 dark:text-red-200">Total déductions</span>
//                     <span className="font-mono font-bold text-red-700 dark:text-red-300">
//                       −{fmt(simulation.totalLoanDeduction + simulation.totalAdvanceDeduction)} F
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </motion.section>
//           )}

//           {/* Message si pas encore d'employé sélectionné */}
//           {!selectedEmployee && !isSimulating && (
//             <div className="p-8 bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-center text-gray-400">
//               <Calculator size={36} className="mx-auto mb-3 opacity-30" />
//               <p className="text-sm font-medium">Sélectionnez un employé pour commencer</p>
//               <p className="text-xs mt-1">Le bulletin est calculé automatiquement par le serveur</p>
//             </div>
//           )}
//         </div>

//         {/* ══ COLONNE DROITE — Aperçu bulletin (résultat backend) ══ */}
//         <div className="lg:col-span-2 sticky top-6">
//           <AnimatePresence mode="wait">

//             {simulation ? (
//               <motion.div key="preview"
//                 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
//                 className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">

//                 {/* Header aperçu */}
//                 <div className="bg-gradient-to-r from-gray-900 to-slate-800 text-white p-5">
//                   <div className="flex items-center justify-between mb-2">
//                     <div>
//                       <h3 className="font-bold text-base">Aperçu du Bulletin</h3>
//                       <p className="text-gray-400 text-xs capitalize">{month} {year}</p>
//                     </div>
//                     {isSimulating && (
//                       <div className="flex items-center gap-1.5">
//                         <Loader2 size={12} className="animate-spin text-sky-400" />
//                         <span className="text-xs text-sky-400">Recalcul…</span>
//                       </div>
//                     )}
//                   </div>
//                   <p className="text-sm font-bold text-white/80">
//                     {simulation.employee.firstName} {simulation.employee.lastName}
//                   </p>
//                   <p className="text-xs text-gray-500 mt-0.5">
//                     {simulation.daysToPay}/{simulation.workDays} jours travaillés
//                   </p>
//                 </div>

//                 <div className="p-5 space-y-1.5 text-sm">

//                   {/* Salaire de base */}
//                   <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
//                     <span className="text-gray-500 dark:text-gray-400">Salaire de base</span>
//                     <span className="font-mono font-bold text-gray-900 dark:text-white">+{fmt(simulation.employee.effectiveBaseSalary ?? simulation.employee.baseSalary)} F</span>
//                   </div>

//                   {/* Absence */}
//                   {simulation.absenceDeduction > 0 && (
//                     <div className="flex justify-between py-1.5 text-orange-500">
//                       <span>Absence ({simulation.workDays - simulation.daysToPay}j)</span>
//                       <span className="font-mono">−{fmt(simulation.absenceDeduction)} F</span>
//                     </div>
//                   )}

//                   {/* ✅ Heures sup — montants calculés par le backend */}
//                   {simulation.overtime.amount10  > 0 && (
//                     <div className="flex justify-between py-1.5">
//                       <span className="text-gray-500 dark:text-gray-400">HS +{simulation.settings.overtimeRate10}% ({simulation.overtime.hours10}h)</span>
//                       <span className="font-mono font-bold text-amber-600">+{fmt(simulation.overtime.amount10)} F</span>
//                     </div>
//                   )}
//                   {simulation.overtime.amount25  > 0 && (
//                     <div className="flex justify-between py-1.5">
//                       <span className="text-gray-500 dark:text-gray-400">HS +{simulation.settings.overtimeRate25}% ({simulation.overtime.hours25}h)</span>
//                       <span className="font-mono font-bold text-amber-600">+{fmt(simulation.overtime.amount25)} F</span>
//                     </div>
//                   )}
//                   {simulation.overtime.amount50  > 0 && (
//                     <div className="flex justify-between py-1.5">
//                       <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Moon size={10} className="text-purple-400" />HS +{simulation.settings.overtimeRate50}% ({simulation.overtime.hours50}h)</span>
//                       <span className="font-mono font-bold text-purple-600">+{fmt(simulation.overtime.amount50)} F</span>
//                     </div>
//                   )}
//                   {simulation.overtime.amount100 > 0 && (
//                     <div className="flex justify-between py-1.5">
//                       <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Moon size={10} className="text-red-400" />HS +{simulation.settings.overtimeRate100}% ({simulation.overtime.hours100}h)</span>
//                       <span className="font-mono font-bold text-red-600">+{fmt(simulation.overtime.amount100)} F</span>
//                     </div>
//                   )}

//                   {/* ✅ Primes */}
//                   {simulation.totalBonuses > 0 && (
//                     <div className="py-1.5 border-b border-gray-100 dark:border-gray-700">
//                       <div className="flex justify-between mb-1">
//                         <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Gift size={11} className="text-cyan-500" />Primes</span>
//                         <span className="font-mono font-bold text-cyan-600">+{fmt(simulation.totalBonuses)} F</span>
//                       </div>
//                       {simulation.bonuses.map(b => (
//                         <div key={b.id} className="flex justify-between text-xs text-gray-400 pl-4 py-0.5">
//                           <span className="truncate flex-1 mr-2">{b.bonusType}</span>
//                           <span className="font-mono flex-shrink-0">+{fmt(b.amount)} F</span>
//                         </div>
//                       ))}
//                     </div>
//                   )}

//                   {/* Brut */}
//                   <div className="flex justify-between py-2.5 bg-emerald-50 dark:bg-emerald-900/20 px-3 rounded-xl my-1">
//                     <span className="font-bold text-emerald-800 dark:text-emerald-200">Salaire Brut</span>
//                     <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{fmt(simulation.grossSalary)} F</span>
//                   </div>

//                   {/* ✅ CNSS — 0 si exempté */}
//                   <div className="flex justify-between py-1.5">
//                     <span className={simulation.employee.isSubjectToCnss ? 'text-red-500' : 'text-gray-400'}>
//                       CNSS ({simulation.settings.cnssSalarialRate}%)
//                     </span>
//                     <span className={`font-mono font-bold ${simulation.employee.isSubjectToCnss ? 'text-red-500' : 'text-gray-400'}`}>
//                       {simulation.employee.isSubjectToCnss ? `−${fmt(simulation.cnssSalarial)} F` : '0 F (Exempté)'}
//                     </span>
//                   </div>

//                   {/* ✅ ITS — 0 si exempté */}
//                   <div className="flex justify-between py-1.5">
//                     <span className={simulation.employee.isSubjectToIrpp ? 'text-red-500' : 'text-gray-400'}>
//                       ITS / IRPP
//                     </span>
//                     <span className={`font-mono font-bold ${simulation.employee.isSubjectToIrpp ? 'text-red-500' : 'text-gray-400'}`}>
//                       {simulation.employee.isSubjectToIrpp ? `−${fmt(simulation.its)} F` : '0 F (Exempté)'}
//                     </span>
//                   </div>

//                   {/* ✅ Prêts */}
//                   {simulation.totalLoanDeduction > 0 && (
//                     <div className="flex justify-between py-1.5">
//                       <span className="text-red-500 flex items-center gap-1"><CreditCard size={11} />Prêts ({simulation.loans.length})</span>
//                       <span className="font-mono font-bold text-red-500">−{fmt(simulation.totalLoanDeduction)} F</span>
//                     </div>
//                   )}

//                   {/* ✅ Avances */}
//                   {simulation.totalAdvanceDeduction > 0 && (
//                     <div className="flex justify-between py-1.5">
//                       <span className="text-red-500 flex items-center gap-1"><Wallet size={11} />Avances ({simulation.advances.length})</span>
//                       <span className="font-mono font-bold text-red-500">−{fmt(simulation.totalAdvanceDeduction)} F</span>
//                     </div>
//                   )}

//                   {/* NET À PAYER */}
//                   <div className="pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-700 mt-2">
//                     <div className="flex justify-between items-end">
//                       <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Net à Payer</span>
//                       <div className="text-right">
//                         <span className="text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
//                           {fmt(simulation.netSalary)}
//                         </span>
//                         <span className="text-sm text-gray-400 ml-1.5">FCFA</span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* ✅ Coût employeur — dépliable */}
//                   <div className="mt-3 border border-orange-200 dark:border-orange-800/50 rounded-xl overflow-hidden">
//                     <button onClick={() => setShowEmployerCost(v => !v)}
//                       className="w-full flex items-center justify-between px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100/50 transition-colors cursor-pointer">
//                       <span className="flex items-center gap-2 text-xs font-bold text-orange-700 dark:text-orange-400">
//                         <Building2 size={13} /> Coût Employeur
//                       </span>
//                       <div className="flex items-center gap-2">
//                         <span className="font-mono font-black text-sm text-orange-600 dark:text-orange-400">
//                           +{fmt(simulation.totalEmployerCost)} F
//                         </span>
//                         {showEmployerCost ? <ChevronUp size={13} className="text-orange-400" /> : <ChevronDown size={13} className="text-orange-400" />}
//                       </div>
//                     </button>
//                     {showEmployerCost && (
//                       <div className="px-4 py-3 space-y-1.5 text-xs bg-white dark:bg-gray-800/50">
//                         <div className="flex justify-between text-gray-500"><span>CNSS Pensions (8%)</span><span className="font-mono font-bold text-orange-500">+{fmt(simulation.cnssEmployerPension)} F</span></div>
//                         <div className="flex justify-between text-gray-500"><span>CNSS Famille (10,03%)</span><span className="font-mono font-bold text-orange-500">+{fmt(simulation.cnssEmployerFamily)} F</span></div>
//                         <div className="flex justify-between text-gray-500"><span>CNSS Accident (2,25%)</span><span className="font-mono font-bold text-orange-500">+{fmt(simulation.cnssEmployerAccident)} F</span></div>
//                         <div className="flex justify-between text-gray-500 pt-1 border-t border-orange-100 dark:border-orange-900/30">
//                           <span>Sous-total CNSS pat.</span>
//                           <span className="font-mono font-bold text-orange-500">+{fmt(cnssPatTotal)} F</span>
//                         </div>
//                         <div className="flex justify-between text-gray-500"><span>TUS DGI (4,13%)</span><span className="font-mono font-bold text-amber-500">+{fmt(simulation.tusDgiAmount)} F</span></div>
//                         <div className="flex justify-between text-gray-500"><span>TUS CNSS (3,38%)</span><span className="font-mono font-bold text-amber-500">+{fmt(simulation.tusCnssAmount)} F</span></div>
//                         <div className="flex justify-between font-bold pt-2 border-t border-orange-200 dark:border-orange-800 text-gray-900 dark:text-white">
//                           <span>Coût total</span>
//                           <span className="font-mono">{fmt(simulation.totalEmployerCost)} F</span>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Bouton confirmer → créer en BDD */}
//                 <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
//                   <button onClick={submitPayroll} disabled={isSubmitting || isSimulating}
//                     className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
//                     {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
//                     {isSubmitting ? 'Enregistrement…' : 'Confirmer & Créer le Bulletin'}
//                   </button>
//                   <p className="text-center text-xs text-gray-400 mt-2">
//                     Le bulletin sera créé en base de données avec ces valeurs
//                   </p>
//                 </div>
//               </motion.div>

//             ) : (
//               <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//                 className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl min-h-[300px] flex flex-col items-center justify-center text-gray-400 p-8 text-center">
//                 <Calculator size={48} className="mb-4 opacity-20" />
//                 <p className="text-sm font-medium">
//                   {isSimulating ? 'Calcul en cours…' : 'Sélectionnez un employé pour voir l\'aperçu'}
//                 </p>
//                 <p className="text-xs text-gray-400 mt-1">L'aperçu est calculé automatiquement par le serveur</p>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>
//       </div>

//       {/* ── Modal succès ── */}
//       <AnimatePresence>
//         {showSuccess && (
//           <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//             <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center">
//               <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-6" />
//               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bulletin Créé !</h2>
//               <p className="text-gray-500 dark:text-gray-400 mb-8">
//                 La fiche de paie a été enregistrée avec succès en base de données.
//               </p>
//               <div className="flex gap-3">
//                 <button onClick={() => { setShowSuccess(false); setSimulation(null); setSelectedEmployee(null); }}
//                   className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
//                   Nouveau
//                 </button>
//                 {createdPayrollId && (
//                   <button onClick={() => router.push(`/paie/${createdPayrollId}`)}
//                     className="flex-1 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 shadow-lg transition-colors">
//                     Voir bulletin
//                   </button>
//                 )}
//                 <button onClick={() => router.push('/paie')}
//                   className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg transition-colors">
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