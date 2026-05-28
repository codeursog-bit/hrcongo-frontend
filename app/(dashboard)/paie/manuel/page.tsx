'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Loader2, CheckCircle2,
  ChevronDown, ChevronUp, Search, X, Calculator,
  AlertCircle, Building2, Gift, Pencil, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

// ─── Types ─────────────────────────────────────────────────────────────────

type FiscalType = 'TAXABLE_CNSS' | 'TAXABLE_NO_CNSS' | 'NON_TAXABLE';

interface ManualItem {
  localId: string;
  kind: 'gain' | 'deduction';
  code: string;
  label: string;
  base: number | '';
  rate: number | '';
  amount: number;
  fiscalType: FiscalType;
  isSystem: boolean;
}

interface InlineBonus {
  localId: string;
  name: string;
  fiscalType: FiscalType;
  amount: number | '';
}

interface InlineTax {
  localId: string;
  name: string;
  code: string;
  rate: number | '';       // % du brut
  fixed: number | '';      // montant fixe
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  baseSalary: number;
  position?: string;
  employeeNumber?: string;
  contractType?: string;
  isSubjectToCnss?: boolean;
  isSubjectToIrpp?: boolean;
}

interface SimResult {
  employee: { id: string; firstName: string; lastName: string; baseSalary: number; effectiveBaseSalary: number; isSubjectToCnss: boolean; isSubjectToIrpp: boolean };
  month: number; year: number;
  daysToPay: number; workDays: number;
  absenceDeduction: number;
  overtime: { hours10: number; amount10: number; hours25: number; amount25: number; hours50: number; amount50: number; hours100: number; amount100: number; total: number };
  bonuses: Array<{ bonusType: string; amount: number }>;
  adjustedBaseSalary: number;
  grossSalary: number;
  cnssSalarial: number; its: number;
  totalDeductions: number; netSalary: number;
  cnssEmployerPension: number; cnssEmployerFamily: number; cnssEmployerAccident: number;
  tusDgiAmount: number; tusCnssAmount: number;
  totalEmployerCost: number;
  loans: any[]; advances: any[];
  totalLoanDeduction: number; totalAdvanceDeduction: number;
  settings: { cnssSalarialRate: number; overtimeRate10: number; overtimeRate25: number; overtimeRate50: number; overtimeRate100: number };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const FC: Record<FiscalType, { label: string; cls: string }> = {
  TAXABLE_CNSS:    { label: 'ITS + CNSS',  cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  TAXABLE_NO_CNSS: { label: 'ITS seul',    cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  NON_TAXABLE:     { label: 'Exonéré',     cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
};

const BONUS_SUGGESTIONS: { name: string; fiscal: FiscalType }[] = [
  { name: 'Prime de transport',      fiscal: 'NON_TAXABLE' },
  { name: 'Prime de logement',       fiscal: 'NON_TAXABLE' },
  { name: 'Prime de panier',         fiscal: 'NON_TAXABLE' },
  { name: "Indemnité de déplacement",fiscal: 'NON_TAXABLE' },
  { name: 'Prime de responsabilité', fiscal: 'TAXABLE_CNSS' },
  { name: "Prime d'ancienneté",      fiscal: 'TAXABLE_CNSS' },
  { name: 'Prime de diplôme',        fiscal: 'TAXABLE_CNSS' },
  { name: 'Prime de rendement',      fiscal: 'TAXABLE_NO_CNSS' },
  { name: "Prime de fin d'année",    fiscal: 'TAXABLE_NO_CNSS' },
  { name: "Prime d'assiduité",       fiscal: 'TAXABLE_NO_CNSS' },
];

const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (v: number) => Math.round(v || 0).toLocaleString('fr-FR');

const FPill = ({ type }: { type: FiscalType }) => (
  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${FC[type].cls}`}>{FC[type].label}</span>
);

const BLine = ({ label, value, cls, sm }: { label: string; value: string; cls?: string; sm?: boolean }) => (
  <div className={`flex items-center justify-between ${sm ? 'py-0.5' : 'py-1.5'}`}>
    <span className={sm ? 'text-xs text-gray-500 dark:text-gray-400' : 'text-sm text-gray-500 dark:text-gray-400'}>{label}</span>
    <span className={`font-mono font-bold tabular-nums ${sm ? 'text-xs' : 'text-sm'} ${cls ?? 'text-gray-700 dark:text-gray-200'}`}>{value}</span>
  </div>
);

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ManuelPayrollPage() {
  const router = useRouter();
  const now = new Date();

  // Header state
  const [employees, setEmployees]       = useState<Employee[]>([]);
  const [empSearch, setEmpSearch]       = useState('');
  const [showEmpDrop, setShowEmpDrop]   = useState(false);
  const [selectedEmp, setSelectedEmp]   = useState<Employee | null>(null);
  const [loadingEmp, setLoadingEmp]     = useState(true);
  const [month, setMonth]               = useState(MONTHS[now.getMonth()]);
  const [year, setYear]                 = useState(now.getFullYear());
  const [workedDays, setWorkedDays]     = useState<number | ''>(26);
  const [ot10, setOt10]                 = useState<number | ''>(0);
  const [ot25, setOt25]                 = useState<number | ''>(0);
  const [ot50, setOt50]                 = useState<number | ''>(0);
  const [ot100, setOt100]               = useState<number | ''>(0);

  // Items (gains + deductions)
  const [items, setItems] = useState<ManualItem[]>([
    { localId: uid(), kind: 'gain', code: '100', label: 'Salaire de base', base: '', rate: 1, amount: 0, fiscalType: 'TAXABLE_CNSS', isSystem: true },
  ]);

  // Inline primes panel
  const [inlineBonuses, setInlineBonuses]   = useState<InlineBonus[]>([]);
  const [showBonusPanel, setShowBonusPanel] = useState(false);
  const [newBonusName, setNewBonusName]     = useState('');
  const [newBonusFiscal, setNewBonusFiscal] = useState<FiscalType>('TAXABLE_CNSS');

  // Inline taxes panel
  const [inlineTaxes, setInlineTaxes]     = useState<InlineTax[]>([]);
  const [showTaxPanel, setShowTaxPanel]   = useState(false);
  const [newTaxName, setNewTaxName]       = useState('');
  const [newTaxCode, setNewTaxCode]       = useState('');
  const [newTaxRate, setNewTaxRate]       = useState<number | ''>('');
  const [newTaxFixed, setNewTaxFixed]     = useState<number | ''>('');

  // Simulation
  const [sim, setSim]               = useState<SimResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError]     = useState<string | null>(null);
  const [showEmpCost, setShowEmpCost] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Submit
  const [submitting, setSubmitting]   = useState(false);
  const [success, setSuccess]         = useState(false);
  const [createdId, setCreatedId]     = useState<string | null>(null);

  // Editing label inline
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── Load employees ──────────────────────────────────────────────────────
  useEffect(() => {
    api.get<any>('/employees/simple')
      .then(r => setEmployees(Array.isArray(r) ? r : (r?.data ?? [])))
      .catch(() => setEmployees([]))
      .finally(() => setLoadingEmp(false));
  }, []);

  // ── Pre-fill base salary on employee select ─────────────────────────────
  useEffect(() => {
    if (!selectedEmp) return;
    setItems(prev => prev.map(it =>
      it.isSystem ? { ...it, base: selectedEmp.baseSalary, amount: selectedEmp.baseSalary } : it
    ));
  }, [selectedEmp]);

  // ── Autocomplete filter ─────────────────────────────────────────────────
  const filtered = empSearch.length >= 1
    ? employees.filter(e =>
        `${e.firstName} ${e.lastName} ${e.employeeNumber ?? ''}`.toLowerCase()
          .includes(empSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  // ── Item helpers ─────────────────────────────────────────────────────────
  const computeAmount = (base: number | '', rate: number | '') =>
    Math.round((Number(base) || 0) * (Number(rate) || 0));

  const updateItem = (localId: string, patch: Partial<ManualItem>) =>
    setItems(prev => prev.map(it => {
      if (it.localId !== localId) return it;
      const n = { ...it, ...patch };
      n.amount = computeAmount(n.base, n.rate);
      return n;
    }));

  const removeItem = (localId: string) =>
    setItems(prev => prev.filter(i => i.localId !== localId));

  const addGain = (pre?: Partial<ManualItem>) => {
    const n = items.filter(i => i.kind === 'gain').length;
    setItems(prev => [...prev, { localId: uid(), kind: 'gain', code: String((n + 1) * 100), label: '', base: '', rate: 1, amount: 0, fiscalType: 'TAXABLE_CNSS', isSystem: false, ...pre }]);
  };

  const addDedu = (pre?: Partial<ManualItem>) =>
    setItems(prev => [...prev, { localId: uid(), kind: 'deduction', code: '', label: '', base: '', rate: 1, amount: 0, fiscalType: 'NON_TAXABLE', isSystem: false, ...pre }]);

  // ── Add bonus from inline panel ──────────────────────────────────────────
  const applyBonus = (b: InlineBonus) => {
    if (items.some(i => i.kind === 'gain' && i.label === b.name)) return;
    const n = items.filter(i => i.kind === 'gain').length;
    setItems(prev => [...prev, { localId: uid(), kind: 'gain', code: String((n + 1) * 100), label: b.name, base: Number(b.amount) || 0, rate: 1, amount: Number(b.amount) || 0, fiscalType: b.fiscalType, isSystem: false }]);
  };

  // ── Add tax from inline panel ────────────────────────────────────────────
  const applyTax = (t: InlineTax) => {
    if (items.some(i => i.kind === 'deduction' && i.label === t.name)) return;
    const grossBase = items.filter(i => i.kind === 'gain').reduce((s, i) => s + i.amount, 0);
    if (Number(t.fixed) > 0) {
      addDedu({ label: t.name, code: t.code, base: Number(t.fixed), rate: 1, amount: Number(t.fixed) });
    } else {
      const r = Number(t.rate) / 100;
      addDedu({ label: t.name, code: t.code, base: grossBase, rate: r, amount: Math.round(grossBase * r) });
    }
  };

  // ── Simulation debounce ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedEmp) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(simulate, 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedEmp, month, year, workedDays, ot10, ot25, ot50, ot100]);

  const simulate = async () => {
    if (!selectedEmp) return;
    const baseRow  = items.find(i => i.isSystem);
    const baseSal  = Number(baseRow?.base) || selectedEmp.baseSalary;
    if (!baseSal) return;
    const bonusRows = items.filter(i => i.kind === 'gain' && !i.isSystem && i.amount > 0);
    setSimLoading(true); setSimError(null);
    try {
      const payload: any = {
        employeeId: selectedEmp.id,
        month: MONTHS.findIndex(m => m === month) + 1,
        year,
        workedDays:       Number(workedDays) || 26,
        baseSalary:       baseSal,
        overtimeHours10:  Number(ot10)  || 0,
        overtimeHours25:  Number(ot25)  || 0,
        overtimeHours50:  Number(ot50)  || 0,
        overtimeHours100: Number(ot100) || 0,
      };
      if (bonusRows.length > 0) {
        payload.manualBonuses = bonusRows.map(i => ({
          bonusType: i.label || 'Prime', amount: i.amount,
          isTaxable: i.fiscalType !== 'NON_TAXABLE',
          isCnss:    i.fiscalType === 'TAXABLE_CNSS',
          fiscalType: i.fiscalType,
        }));
      }
      const result = await api.post<SimResult>('/payrolls/simulate', payload);
      setSim(result);
    } catch (e: any) {
      setSimError(e?.response?.data?.message || e?.message || 'Erreur de calcul');
      setSim(null);
    } finally {
      setSimLoading(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!selectedEmp || !sim) return;
    setSubmitting(true);
    try {
      const baseRow   = items.find(i => i.isSystem);
      const bonusRows = items.filter(i => i.kind === 'gain' && !i.isSystem && i.amount > 0);
      const result: any = await api.post('/payrolls/manual', {
        employeeId:       selectedEmp.id,
        month:            MONTHS.findIndex(m => m === month) + 1,
        year,
        workedDays:       Number(workedDays) || 26,
        baseSalary:       Number(baseRow?.base) || selectedEmp.baseSalary,
        overtimeHours10:  Number(ot10)  || 0,
        overtimeHours25:  Number(ot25)  || 0,
        overtimeHours50:  Number(ot50)  || 0,
        overtimeHours100: Number(ot100) || 0,
        manualBonuses: bonusRows.map(i => ({
          bonusType: i.label || 'Prime', amount: i.amount,
          isTaxable: i.fiscalType !== 'NON_TAXABLE',
          isCnss:    i.fiscalType === 'TAXABLE_CNSS',
          fiscalType: i.fiscalType,
        })),
      });
      setCreatedId(result?.id || null);
      setSuccess(true);
    } catch (e: any) {
      alert(`Erreur : ${e?.response?.data?.message || e?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSuccess(false); setSim(null); setSelectedEmp(null); setEmpSearch('');
    setWorkedDays(26); setOt10(0); setOt25(0); setOt50(0); setOt100(0);
    setInlineBonuses([]); setInlineTaxes([]);
    setItems([{ localId: uid(), kind: 'gain', code: '100', label: 'Salaire de base', base: '', rate: 1, amount: 0, fiscalType: 'TAXABLE_CNSS', isSystem: true }]);
  };

  // Computed
  const gainItems  = items.filter(i => i.kind === 'gain');
  const deduItems  = items.filter(i => i.kind === 'deduction');
  const totalGains = gainItems.reduce((s, i) => s + i.amount, 0);
  const totalDedus = deduItems.reduce((s, i) => s + i.amount, 0);
  const hasOt = [ot10,ot25,ot50,ot100].some(v => Number(v) > 0);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1400px] mx-auto pb-24 px-4 pt-1">

      {/* ── Page header ── */}
      <div className="flex items-center gap-4 mb-7">
        <button onClick={() => router.back()}
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Saisie manuelle de paie</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 uppercase tracking-wide">Manuel</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Saisissez chaque élément — CNSS, ITS et TUS sont calculés automatiquement</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">

        {/* ════════════ COL GAUCHE ════════════ */}
        <div className="lg:col-span-3 space-y-4">

          {/* Bloc : Infos générales */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Informations générales</p>

            {/* Mois / Année */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Mois</label>
                <select value={month} onChange={e => setMonth(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30">
                  {MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Année</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30">
                  {[2023,2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* Employé */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Employé</label>
              {selectedEmp ? (
                <div className="flex items-center justify-between px-3 py-2.5 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-sky-200 dark:bg-sky-800 flex items-center justify-center text-sky-700 dark:text-sky-300 text-xs font-black shrink-0">
                      {selectedEmp.firstName[0]}{selectedEmp.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedEmp.firstName} {selectedEmp.lastName}</p>
                      <p className="text-xs text-gray-500">{[selectedEmp.employeeNumber, selectedEmp.position ?? selectedEmp.contractType].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedEmp(null); setEmpSearch(''); setSim(null); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={empSearch}
                    onChange={e => { setEmpSearch(e.target.value); setShowEmpDrop(true); }}
                    onFocus={() => setShowEmpDrop(true)}
                    placeholder="Rechercher par nom, prénom ou matricule…"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 text-gray-800 dark:text-gray-200" />
                  <AnimatePresence>
                    {showEmpDrop && filtered.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute z-30 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                        {filtered.map(e => (
                          <button key={e.id}
                            onClick={() => { setSelectedEmp(e); setEmpSearch(''); setShowEmpDrop(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-left transition-colors">
                            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-black text-gray-600 dark:text-gray-300 shrink-0">
                              {e.firstName[0]}{e.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{e.firstName} {e.lastName}</p>
                              <p className="text-[11px] text-gray-400">{[e.employeeNumber && <span key="m" className="font-mono">{e.employeeNumber}</span>, e.position ?? e.contractType].filter(Boolean).reduce((a: any, b: any, i) => i === 0 ? [b] : [...a, ' · ', b], [])}</p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Jours travaillés */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                Jours travaillés <span className="font-normal text-gray-400">/ 26 jours théoriques</span>
              </label>
              <div className="flex items-center gap-3">
                <input type="number" min={0} max={26} value={workedDays}
                  onChange={e => setWorkedDays(e.target.value === '' ? '' : Math.min(26, Number(e.target.value)))}
                  className="w-20 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-center text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (Number(workedDays) || 0) / 26 * 100)}%` }} />
                </div>
                <span className="text-xs text-gray-400 tabular-nums w-8 text-right">
                  {Math.round((Number(workedDays) || 0) / 26 * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Bloc : Heures supplémentaires */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Heures supplémentaires</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: '+10%', v: ot10,  set: setOt10,  col: 'text-amber-500' },
                { label: '+25%', v: ot25,  set: setOt25,  col: 'text-orange-500' },
                { label: '+50%', v: ot50,  set: setOt50,  col: 'text-rose-500' },
                { label: '+100%',v: ot100, set: setOt100, col: 'text-red-500' },
              ].map(({ label, v, set, col }) => (
                <div key={label}>
                  <label className={`block text-xs font-bold mb-1.5 ${col}`}>{label}</label>
                  <div className="relative">
                    <input type="number" min={0} value={v}
                      onChange={e => set(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-3 pr-5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-center text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloc : Gains */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Éléments de gains</p>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalGains)} F</span>
              </div>
              <div className="grid grid-cols-[44px_1fr_110px_52px_78px_28px] gap-2 px-1">
                {['N°','Libellé','Base (F)','Taux','Gain (F)',''].map((h, i) => (
                  <span key={i} className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wide ${i === 4 ? 'text-right' : ''}`}>{h}</span>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700/40 divide-y divide-gray-50 dark:divide-gray-700/30">
              <AnimatePresence initial={false}>
                {gainItems.map(item => (
                  <ItemRow key={item.localId} item={item}
                    editingId={editingId} setEditingId={setEditingId}
                    onUpdate={updateItem} onRemove={removeItem} />
                ))}
              </AnimatePresence>
            </div>

            {/* Footer gains */}
            <div className="px-5 py-3 bg-gray-50/50 dark:bg-gray-900/20 flex flex-wrap items-start gap-2">
              <button onClick={() => addGain()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-lg transition-colors">
                <Plus size={11} /> Nouvelle ligne
              </button>

              {/* Panel primes */}
              <div className="relative">
                <button onClick={() => { setShowBonusPanel(v => !v); setShowTaxPanel(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg transition-colors">
                  <Gift size={11} /> Primes & indemnités
                  <ChevronDown size={9} className={`transition-transform ${showBonusPanel ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showBonusPanel && (
                    <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                      className="absolute z-40 left-0 top-full mt-1.5 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-300">Primes & indemnités</p>
                        <button onClick={() => setShowBonusPanel(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={12} /></button>
                      </div>

                      {/* Primes déjà configurées dans ce panel */}
                      {inlineBonuses.length > 0 && (
                        <div className="px-3 pt-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Configurées</p>
                          <div className="space-y-1.5 mb-3">
                            {inlineBonuses.map(b => {
                              const applied = items.some(i => i.kind === 'gain' && i.label === b.name);
                              return (
                                <div key={b.localId} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/30 rounded-xl px-2.5 py-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{b.name}</p>
                                    <FPill type={b.fiscalType} />
                                  </div>
                                  <input type="number" placeholder="Montant" value={b.amount}
                                    onChange={e => setInlineBonuses(p => p.map(x => x.localId === b.localId ? { ...x, amount: e.target.value === '' ? '' : Number(e.target.value) } : x))}
                                    className="w-24 text-xs text-right bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-400" />
                                  <span className="text-[10px] text-gray-400">F</span>
                                  {applied ? (
                                    <Check size={13} className="text-emerald-500 shrink-0" />
                                  ) : (
                                    <button onClick={() => applyBonus(b)} disabled={!b.amount}
                                      className="px-2 py-1 text-[10px] font-bold bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white rounded-lg transition-colors shrink-0">
                                      Ajouter
                                    </button>
                                  )}
                                  <button onClick={() => setInlineBonuses(p => p.filter(x => x.localId !== b.localId))}
                                    className="p-0.5 text-gray-300 hover:text-red-400 transition-colors shrink-0"><Trash2 size={11} /></button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      <div className="px-3 pt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Suggestions rapides</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {BONUS_SUGGESTIONS.filter(s => !inlineBonuses.some(b => b.name === s.name)).map(s => (
                            <button key={s.name}
                              onClick={() => setInlineBonuses(p => [...p, { localId: uid(), name: s.name, fiscalType: s.fiscal, amount: '' }])}
                              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300 rounded-lg transition-colors">
                              <Plus size={9} /> {s.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Créer une prime personnalisée */}
                      <div className="px-3 pb-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Créer une prime</p>
                        <input type="text" placeholder="Nom de la prime…" value={newBonusName}
                          onChange={e => setNewBonusName(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 mb-2" />
                        <div className="flex gap-1.5 mb-2">
                          {(['TAXABLE_CNSS','TAXABLE_NO_CNSS','NON_TAXABLE'] as FiscalType[]).map(f => (
                            <button key={f} onClick={() => setNewBonusFiscal(f)}
                              className={`flex-1 px-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${newBonusFiscal === f ? FC[f].cls + ' border-current' : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:border-gray-300'}`}>
                              {FC[f].label}
                            </button>
                          ))}
                        </div>
                        <button disabled={!newBonusName.trim()}
                          onClick={() => {
                            setInlineBonuses(p => [...p, { localId: uid(), name: newBonusName.trim(), fiscalType: newBonusFiscal, amount: '' }]);
                            setNewBonusName('');
                          }}
                          className="w-full py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors">
                          Créer et configurer le montant
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Bloc : Retenues */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Retenues manuelles</p>
                <span className="text-xs font-mono font-bold text-red-500">{fmt(totalDedus)} F</span>
              </div>
              <p className="text-[11px] text-gray-400 mb-3">CNSS et ITS calculés automatiquement. Ajoutez ici les retenues spécifiques.</p>
              {deduItems.length > 0 && (
                <div className="grid grid-cols-[44px_1fr_110px_52px_78px_28px] gap-2 px-1">
                  {['Code','Libellé','Base (F)','Taux','Retenu (F)',''].map((h,i) => (
                    <span key={i} className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wide ${i===4?'text-right':''}`}>{h}</span>
                  ))}
                </div>
              )}
            </div>

            {deduItems.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-700/40 divide-y divide-gray-50 dark:divide-gray-700/30">
                <AnimatePresence initial={false}>
                  {deduItems.map(item => (
                    <ItemRow key={item.localId} item={item} isDeduction
                      editingId={editingId} setEditingId={setEditingId}
                      onUpdate={updateItem} onRemove={removeItem} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            <div className="px-5 py-3 bg-gray-50/50 dark:bg-gray-900/20 flex flex-wrap items-start gap-2">
              <button onClick={() => addDedu()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                <Plus size={11} /> Nouvelle retenue
              </button>

              {/* Panel taxes */}
              <div className="relative">
                <button onClick={() => { setShowTaxPanel(v => !v); setShowBonusPanel(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors">
                  <Building2 size={11} /> Taxes & cotisations
                  <ChevronDown size={9} className={`transition-transform ${showTaxPanel ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showTaxPanel && (
                    <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                      className="absolute z-40 left-0 top-full mt-1.5 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-300">Taxes & cotisations</p>
                        <button onClick={() => setShowTaxPanel(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={12} /></button>
                      </div>

                      {inlineTaxes.length > 0 && (
                        <div className="px-3 pt-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Configurées</p>
                          <div className="space-y-1.5 mb-3">
                            {inlineTaxes.map(t => {
                              const applied = items.some(i => i.kind === 'deduction' && i.label === t.name);
                              return (
                                <div key={t.localId} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/30 rounded-xl px-2.5 py-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{t.name}</p>
                                    <p className="text-[10px] font-mono text-gray-400">
                                      {t.code || '—'} · {Number(t.fixed) > 0 ? `${fmt(Number(t.fixed))} F fixe` : `${t.rate}%`}
                                    </p>
                                  </div>
                                  {applied ? (
                                    <Check size={13} className="text-emerald-500 shrink-0" />
                                  ) : (
                                    <button onClick={() => applyTax(t)}
                                      className="px-2 py-1 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shrink-0">
                                      Appliquer
                                    </button>
                                  )}
                                  <button onClick={() => setInlineTaxes(p => p.filter(x => x.localId !== t.localId))}
                                    className="p-0.5 text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Créer une taxe */}
                      <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Créer une taxe</p>
                        <div className="space-y-2">
                          <input type="text" placeholder="Nom de la taxe" value={newTaxName}
                            onChange={e => setNewTaxName(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Code (ex: CAMU)" value={newTaxCode}
                              onChange={e => setNewTaxCode(e.target.value.toUpperCase())}
                              className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                            <div className="relative">
                              <input type="number" placeholder="Taux %" value={newTaxRate}
                                onChange={e => { setNewTaxRate(e.target.value === '' ? '' : Number(e.target.value)); setNewTaxFixed(''); }}
                                className="w-full pl-3 pr-6 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-400 shrink-0">ou fixe :</span>
                            <div className="relative flex-1">
                              <input type="number" placeholder="0" value={newTaxFixed}
                                onChange={e => { setNewTaxFixed(e.target.value === '' ? '' : Number(e.target.value)); setNewTaxRate(''); }}
                                className="w-full pl-3 pr-6 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">F</span>
                            </div>
                          </div>
                          <button
                            disabled={!newTaxName.trim() || (!newTaxRate && !newTaxFixed)}
                            onClick={() => {
                              setInlineTaxes(p => [...p, { localId: uid(), name: newTaxName.trim(), code: newTaxCode, rate: newTaxRate, fixed: newTaxFixed }]);
                              setNewTaxName(''); setNewTaxCode(''); setNewTaxRate(''); setNewTaxFixed('');
                            }}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors">
                            Créer et configurer
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {!selectedEmp && (
            <div className="flex items-center gap-3 px-4 py-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl">
              <AlertCircle size={14} className="text-sky-500 shrink-0" />
              <p className="text-sm text-sky-700 dark:text-sky-300">Sélectionnez un employé pour activer le calcul automatique des cotisations.</p>
            </div>
          )}
        </div>

        {/* ════════════ COL DROITE — Bulletin ════════════ */}
        <div className="lg:col-span-2 sticky top-6">
          <AnimatePresence mode="wait">
            {sim ? (
              <motion.div key="sim" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-gray-900 to-slate-800 text-white px-5 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Aperçu bulletin</p>
                      <p className="font-bold text-base mt-0.5">{sim.employee.firstName} {sim.employee.lastName}</p>
                    </div>
                    {simLoading && (
                      <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-full mt-0.5">
                        <Loader2 size={10} className="animate-spin text-sky-400" />
                        <span className="text-[10px] text-sky-300">Recalcul…</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 flex-wrap">
                    <span className="capitalize">{month} {year}</span>
                    <span>·</span>
                    <span>{sim.daysToPay}/{sim.workDays} jours</span>
                    {sim.absenceDeduction > 0 && <><span>·</span><span className="text-orange-400">−{fmt(sim.absenceDeduction)} F</span></>}
                    {hasOt && <><span>·</span><span className="text-amber-400">HS incluses</span></>}
                  </div>
                </div>

                <div className="px-5 py-4 space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Gains</p>
                  <BLine label="Salaire de base ajusté" value={`+${fmt(sim.adjustedBaseSalary)} F`} cls="text-gray-800 dark:text-gray-100" />
                  {sim.overtime.amount10  > 0 && <BLine label={`HS +${sim.settings.overtimeRate10}% (${sim.overtime.hours10}h)`}  value={`+${fmt(sim.overtime.amount10)} F`}  cls="text-amber-500" sm />}
                  {sim.overtime.amount25  > 0 && <BLine label={`HS +${sim.settings.overtimeRate25}% (${sim.overtime.hours25}h)`}  value={`+${fmt(sim.overtime.amount25)} F`}  cls="text-amber-500" sm />}
                  {sim.overtime.amount50  > 0 && <BLine label={`HS +${sim.settings.overtimeRate50}% (${sim.overtime.hours50}h)`}  value={`+${fmt(sim.overtime.amount50)} F`}  cls="text-rose-500" sm />}
                  {sim.overtime.amount100 > 0 && <BLine label={`HS +${sim.settings.overtimeRate100}% (${sim.overtime.hours100}h)`} value={`+${fmt(sim.overtime.amount100)} F`} cls="text-red-500" sm />}
                  {sim.bonuses?.map((b, i) => <BLine key={i} label={b.bonusType} value={`+${fmt(b.amount)} F`} cls="text-emerald-600 dark:text-emerald-400" sm />)}

                  <div className="flex justify-between py-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 rounded-xl mt-2">
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Salaire brut</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{fmt(sim.grossSalary)} F</span>
                  </div>

                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-3 mb-2">Retenues légales</p>
                  <BLine
                    label={`CNSS salariale (${sim.settings.cnssSalarialRate}%)`}
                    value={sim.employee.isSubjectToCnss ? `−${fmt(sim.cnssSalarial)} F` : '0 F (exempté)'}
                    cls={sim.employee.isSubjectToCnss ? 'text-red-500' : 'text-gray-400'} />
                  <BLine
                    label="ITS / IRPP"
                    value={sim.employee.isSubjectToIrpp ? `−${fmt(sim.its)} F` : '0 F (exempté)'}
                    cls={sim.employee.isSubjectToIrpp ? 'text-red-500' : 'text-gray-400'} />
                  {sim.totalLoanDeduction    > 0 && <BLine label={`Prêts (${sim.loans.length})`} value={`−${fmt(sim.totalLoanDeduction)} F`}    cls="text-red-500" sm />}
                  {sim.totalAdvanceDeduction > 0 && <BLine label="Avances"                        value={`−${fmt(sim.totalAdvanceDeduction)} F`} cls="text-red-500" sm />}

                  <div className="pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-700 mt-3">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Net à payer</span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tight">{fmt(sim.netSalary)}</span>
                        <span className="text-sm text-gray-400 ml-1">FCFA</span>
                      </div>
                    </div>
                  </div>

                  {/* Coût employeur */}
                  <div className="mt-3 border border-orange-200 dark:border-orange-800/40 rounded-xl overflow-hidden">
                    <button onClick={() => setShowEmpCost(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100/50 transition-colors">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-400">
                        <Building2 size={12} /> Coût employeur
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-orange-600 dark:text-orange-400">+{fmt(sim.totalEmployerCost)} F</span>
                        {showEmpCost ? <ChevronUp size={12} className="text-orange-400" /> : <ChevronDown size={12} className="text-orange-400" />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {showEmpCost && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-4 py-3 bg-white dark:bg-gray-800/50 space-y-0.5">
                            <BLine label="CNSS Pensions (8%)"       value={`+${fmt(sim.cnssEmployerPension)} F`}  cls="text-orange-500" sm />
                            <BLine label="CNSS Famille (10,03%)"    value={`+${fmt(sim.cnssEmployerFamily)} F`}   cls="text-orange-500" sm />
                            <BLine label="CNSS Accident (2,25%)"    value={`+${fmt(sim.cnssEmployerAccident)} F`} cls="text-orange-500" sm />
                            <BLine label="TUS DGI (2,025%)"         value={`+${fmt(sim.tusDgiAmount)} F`}         cls="text-amber-500" sm />
                            <BLine label="TUS CNSS (5,475%)"        value={`+${fmt(sim.tusCnssAmount)} F`}        cls="text-amber-500" sm />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button onClick={submit} disabled={submitting || simLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
                    {submitting
                      ? <><Loader2 size={16} className="animate-spin" /> Enregistrement…</>
                      : <><CheckCircle2 size={16} /> Confirmer & créer le bulletin</>}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl min-h-[260px] flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                {simLoading ? (
                  <><Loader2 size={30} className="animate-spin mb-3 text-sky-500" /><p className="text-sm font-medium text-gray-600 dark:text-gray-300">Calcul en cours…</p></>
                ) : simError ? (
                  <><AlertCircle size={30} className="mb-3 text-red-400" /><p className="text-sm font-medium text-red-500">{simError}</p></>
                ) : (
                  <><Calculator size={34} className="mb-3 opacity-20" /><p className="text-sm font-medium">{!selectedEmp ? 'Sélectionnez un employé' : 'Saisissez le salaire de base'}</p><p className="text-xs mt-1">Le bulletin se calcule automatiquement</p></>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal succès */}
      <AnimatePresence>
        {success && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={34} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bulletin créé !</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">La fiche de paie a été enregistrée avec succès.</p>
              <div className="flex gap-3">
                <button onClick={reset} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Nouveau</button>
                {createdId && <button onClick={() => router.push(`/paie/${createdId}`)} className="flex-1 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 shadow-lg transition-colors">Voir bulletin</button>}
                <button onClick={() => router.push('/paie')} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg transition-colors">Liste paie</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ItemRow ─────────────────────────────────────────────────────────────────

function ItemRow({ item, editingId, setEditingId, onUpdate, onRemove, isDeduction }:
  { item: ManualItem; editingId: string | null; setEditingId: (id: string | null) => void; onUpdate: (id: string, p: Partial<ManualItem>) => void; onRemove: (id: string) => void; isDeduction?: boolean }) {
  const labelRef = useRef<HTMLInputElement>(null);
  const isEditing = editingId === item.localId;
  useEffect(() => { if (isEditing) labelRef.current?.focus(); }, [isEditing]);

  return (
    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
      className="group grid grid-cols-[44px_1fr_110px_52px_78px_28px] gap-2 items-center px-5 py-2 hover:bg-gray-50/60 dark:hover:bg-gray-700/20 transition-colors">
      <input type="text" value={item.code} onChange={e => onUpdate(item.localId, { code: e.target.value })}
        className="bg-transparent text-xs font-mono text-gray-400 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 rounded px-1 py-0.5 w-full" placeholder="N°" />
      <div className="flex items-center gap-1.5 min-w-0">
        {(isEditing || !item.label) ? (
          <input ref={labelRef} type="text" value={item.label}
            onChange={e => onUpdate(item.localId, { label: e.target.value })}
            onBlur={() => setEditingId(null)}
            onKeyDown={e => e.key === 'Enter' && setEditingId(null)}
            placeholder="Libellé de l'élément…"
            className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-700 border border-sky-300 dark:border-sky-700 rounded-lg px-2 py-1 text-sm text-gray-800 dark:text-gray-200 focus:outline-none" />
        ) : (
          <button onClick={() => setEditingId(item.localId)}
            className="flex items-center gap-1 text-sm font-medium text-gray-800 dark:text-gray-200 truncate hover:text-sky-600 dark:hover:text-sky-400 transition-colors group/lbl min-w-0">
            <span className="truncate">{item.label}</span>
            <Pencil size={9} className="shrink-0 opacity-0 group-hover/lbl:opacity-50 transition-opacity" />
          </button>
        )}
        {!item.isSystem && !isDeduction && (
          <FiscalDropdown value={item.fiscalType} onChange={v => onUpdate(item.localId, { fiscalType: v })} />
        )}
      </div>
      <input type="number" value={item.base} placeholder="0"
        onChange={e => onUpdate(item.localId, { base: e.target.value === '' ? '' : Number(e.target.value) })}
        className="bg-transparent text-sm font-mono text-right text-gray-700 dark:text-gray-300 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 rounded-lg px-2 py-1 w-full tabular-nums" />
      <input type="number" value={item.rate} step="0.01" placeholder="1"
        onChange={e => onUpdate(item.localId, { rate: e.target.value === '' ? '' : Number(e.target.value) })}
        className="bg-transparent text-sm font-mono text-center text-gray-700 dark:text-gray-300 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 rounded-lg px-1 py-1 w-full tabular-nums" />
      <p className={`text-sm font-bold font-mono text-right tabular-nums ${isDeduction ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
        {item.amount > 0 ? fmt(item.amount) : '—'}
      </p>
      {!item.isSystem ? (
        <button onClick={() => onRemove(item.localId)}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
          <Trash2 size={12} />
        </button>
      ) : <span />}
    </motion.div>
  );
}

// ─── FiscalDropdown ───────────────────────────────────────────────────────────

function FiscalDropdown({ value, onChange }: { value: FiscalType; onChange: (v: FiscalType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${FC[value].cls}`}>
        {FC[value].label} <ChevronDown size={8} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute z-50 left-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
            {(['TAXABLE_CNSS','TAXABLE_NO_CNSS','NON_TAXABLE'] as FiscalType[]).map(opt => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${opt === value ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${FC[opt].cls}`}>{FC[opt].label}</span>
                {opt === value && <Check size={9} className="text-emerald-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}