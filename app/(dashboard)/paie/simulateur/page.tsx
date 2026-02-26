'use client';

import React, { useState, useEffect } from 'react';
import {
  FlaskConical, Play, Plus, Trash2, ChevronDown, ChevronUp,
  Copy, Check, Loader2, AlertCircle, Info,
  Clock, Gift, Minus, User, Calculator, Users, UserPlus,
  Percent, Lock, Unlock, Building2
} from 'lucide-react';
import { api } from '@/services/api';

interface Employee { id: string; firstName: string; lastName: string; baseSalary: number; }
interface ManualBonus { localId: string; bonusType: string; amount: number; isTaxable: boolean; isCnss: boolean; }
interface SimResult {
  employee: {
    id?: string; firstName: string; lastName: string;
    baseSalary: number; effectiveBaseSalary: number;
    isSubjectToCnss: boolean; isSubjectToIrpp: boolean;
  };
  month: number; year: number; daysToPay: number; workDays: number;
  overtime: {
    hours10: number; amount10: number; hours25: number; amount25: number;
    hours50: number; amount50: number; hours100: number; amount100: number; total: number;
  };
  bonuses: Array<{ id: string; bonusType: string; amount: number; source: string; isTaxable: boolean; isCnss: boolean; }>;
  totalBonuses: number; adjustedBaseSalary: number; absenceDeduction: number;
  grossSalary: number;
  cnssSalarial: number;
  cnssEmployer: number;
  cnssEmployerPension: number;
  cnssEmployerFamily: number;
  cnssEmployerAccident: number;
  tusAmount: number;
  tusDgiAmount: number;
  its: number;
  irppDetails: any;
  totalLoanDeduction: number; totalAdvanceDeduction: number; totalDeductions: number;
  netSalary: number; totalEmployerCost: number; simulationMode: string;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
type FiscalMode = 'AUTO' | 'ITS_2026' | 'IRPP_LEGACY' | 'FORFAIT';
const FISCAL_MODES: { value: FiscalMode; label: string; sub: string; color: string }[] = [
  { value: 'AUTO',        label: 'Auto',        sub: "Selon l'année",        color: 'gray'   },
  { value: 'ITS_2026',    label: 'ITS 2026',    sub: 'Barème progressif',    color: 'violet' },
  { value: 'IRPP_LEGACY', label: 'IRPP Ancien', sub: 'Avant 2026 / parts',   color: 'amber'  },
  { value: 'FORFAIT',     label: 'Forfait',     sub: 'Taux fixe (6/8/10%)',  color: 'cyan'   },
];
const fmt = (v: number) => Math.round(v ?? 0).toLocaleString('fr-FR');
const uid = () => Math.random().toString(36).slice(2, 9);

const BonusFiscalBadge = ({ label, active, onChange, color }: { label: string; active: boolean; onChange: () => void; color: string }) => (
  <button onClick={onChange} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer select-none
    ${active ? color === 'cyan' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-600'
      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600'
    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600 line-through opacity-60'}`}>
    {label}
  </button>
);

// ── Ligne de détail dans les tableaux résultat ─────────────────────────────
const ResultRow = ({ label, sub, value, valueColor, bold }: {
  label: string; sub?: string; value: string;
  valueColor?: string; bold?: boolean;
}) => (
  <tr className="border-b border-gray-50 dark:border-gray-700/50">
    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
      <span className={bold ? 'font-semibold text-gray-700 dark:text-gray-200 text-sm' : 'text-sm'}>{label}</span>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sub}</p>}
    </td>
    <td className={`px-4 py-2.5 text-right font-mono font-semibold text-sm ${valueColor ?? 'text-gray-700 dark:text-gray-200'}`}>
      {value}
    </td>
  </tr>
);

// ── Ligne sous-total ────────────────────────────────────────────────────────
const TotalRow = ({ label, value, bgClass, textClass }: {
  label: string; value: string; bgClass: string; textClass: string;
}) => (
  <tr className={bgClass}>
    <td className={`px-4 py-3 font-black text-sm ${textClass}`}>{label}</td>
    <td className={`px-4 py-3 text-right font-black font-mono text-base ${textClass}`}>{value}</td>
  </tr>
);

export default function SimulateurPage() {
  const [mode, setMode] = useState<'existing' | 'free'>('existing');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [empSearch, setEmpSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [freeFirstName, setFreeFirstName] = useState('');
  const [freeLastName, setFreeLastName] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [baseSalary, setBaseSalary] = useState('');
  const [workedDays, setWorkedDays] = useState(26);
  const workDays = 26;
  const [ot10, setOt10] = useState(0);
  const [ot25, setOt25] = useState(0);
  const [ot50, setOt50] = useState(0);
  const [ot100, setOt100] = useState(0);
  const [manualBonuses, setManualBonuses] = useState<ManualBonus[]>([]);
  const [fiscalMode, setFiscalMode] = useState<FiscalMode>('AUTO');
  const [forfaitRate, setForfaitRate] = useState(0.08);
  const [isSubjectCnss, setIsSubjectCnss] = useState(true);
  const [isSubjectIts, setIsSubjectIts] = useState(true);
  const [maritalStatus, setMaritalStatus] = useState<'SINGLE'|'MARRIED'|'DIVORCED'|'WIDOWED'>('SINGLE');
  const [nbChildren, setNbChildren] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [error, setError] = useState('');
  const [showItsDetail, setShowItsDetail] = useState(false);
  const [showEmpDetail, setShowEmpDetail] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/employees?limit=500').then((data: any) => {
      setEmployees(Array.isArray(data) ? data : data?.data || data?.employees || []);
    }).catch(() => {});
  }, []);

  const filteredEmps = empSearch.length >= 2
    ? employees.filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(empSearch.toLowerCase())).slice(0, 8)
    : [];

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmp(emp); setEmpSearch(`${emp.firstName} ${emp.lastName}`);
    setBaseSalary(String(emp.baseSalary)); setShowDropdown(false); setResult(null); setError('');
  };

  const switchMode = (m: 'existing' | 'free') => {
    setMode(m); setResult(null); setError(''); setSelectedEmp(null);
    setEmpSearch(''); setBaseSalary(''); setManualBonuses([]);
    setOt10(0); setOt25(0); setOt50(0); setOt100(0);
  };

  const addBonus = () => setManualBonuses(b => [...b, { localId: uid(), bonusType: '', amount: 0, isTaxable: true, isCnss: true }]);
  const updateBonus = (localId: string, patch: Partial<ManualBonus>) =>
    setManualBonuses(prev => prev.map(b => b.localId === localId ? { ...b, ...patch } : b));

  const canSimulate = mode === 'existing'
    ? !!selectedEmp && !!baseSalary
    : !!baseSalary && Number(baseSalary) >= 70400;

  const handleSimulate = async () => {
    if (!canSimulate) { setError(mode === 'existing' ? 'Sélectionne un employé.' : 'Salaire de base requis (min. 70 400 FCFA).'); return; }
    setIsSimulating(true); setError(''); setResult(null);
    const validBonuses = manualBonuses.filter(b => b.bonusType.trim() && b.amount > 0);
    try {
      let data: SimResult;
      if (mode === 'existing') {
        const payload: Record<string, any> = {
          employeeId: selectedEmp!.id, month, year,
          baseSalary: Number(baseSalary) || selectedEmp!.baseSalary,
          workedDays, overtimeHours10: ot10, overtimeHours25: ot25, overtimeHours50: ot50, overtimeHours100: ot100,
        };
        if (validBonuses.length > 0) payload.manualBonuses = validBonuses.map(b => ({ bonusType: b.bonusType, amount: b.amount, isTaxable: b.isTaxable, isCnss: b.isCnss }));
        data = await api.post<SimResult>('/payrolls/simulate', payload);
      } else {
        const payload: Record<string, any> = {
          firstName: freeFirstName || 'Anonyme', lastName: freeLastName || '',
          baseSalary: Number(baseSalary), workedDays, workDays, month, year,
          overtimeHours10: ot10, overtimeHours25: ot25, overtimeHours50: ot50, overtimeHours100: ot100,
          isSubjectToCnss: isSubjectCnss, isSubjectToIrpp: isSubjectIts,
          maritalStatus, numberOfChildren: nbChildren, fiscalMode,
          forfaitItsRate: fiscalMode === 'FORFAIT' ? forfaitRate : undefined,
        };
        if (validBonuses.length > 0) payload.manualBonuses = validBonuses.map(b => ({ bonusType: b.bonusType, amount: b.amount, isTaxable: b.isTaxable, isCnss: b.isCnss }));
        data = await api.post<SimResult>('/payrolls/simulate-free', payload);
      }
      setResult(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur lors de la simulation.');
    } finally { setIsSimulating(false); }
  };

  const handleCopy = () => {
    if (!result) return;
    const name = [result.employee.firstName, result.employee.lastName].filter(Boolean).join(' ');
    const cnssPatTotal = (result.cnssEmployerPension ?? 0) + (result.cnssEmployerFamily ?? 0) + (result.cnssEmployerAccident ?? 0);
    const lines = [
      `Simulation — ${name || 'Anonyme'} — ${MONTHS[result.month-1]} ${result.year}`,
      '─'.repeat(55),
      `Salaire brut           : ${fmt(result.grossSalary)} FCFA`,
      `CNSS salarié (4%)      : −${fmt(result.cnssSalarial)} FCFA`,
      `ITS                    : −${fmt(result.its)} FCFA`,
      `─`.repeat(55),
      `NET À PAYER            : ${fmt(result.netSalary)} FCFA`,
      `─`.repeat(55),
      `PART PATRONALE`,
      `  CNSS Pensions (8%)   : +${fmt(result.cnssEmployerPension ?? 0)} FCFA`,
      `  CNSS Famille (10,03%): +${fmt(result.cnssEmployerFamily ?? 0)} FCFA`,
      `  CNSS Accident (2,25%): +${fmt(result.cnssEmployerAccident ?? 0)} FCFA`,
      `  TUS (2%)             : +${fmt(result.tusAmount ?? 0)} FCFA`,
      `  Total charges patron : +${fmt(cnssPatTotal + (result.tusAmount ?? 0))} FCFA`,
      `─`.repeat(55),
      `COÛT TOTAL EMPLOYEUR   : ${fmt(result.totalEmployerCost)} FCFA`,
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });
  };

  const absenceDays  = Math.max(0, workDays - workedDays);
  const isLegacyMode = result?.irppDetails?.fiscalMode === 'IRPP_LEGACY' || result?.irppDetails?.mode === 'IRPP_LEGACY';
  const isForfait    = result?.irppDetails?.fiscalMode === 'FORFAIT' || result?.irppDetails?.mode === 'FORFAIT';
  const abattementLabel = isLegacyMode ? 'Abattement 30% (plafonné 75 000/mois)' : 'Abattement 20%';

  // Charges patronales depuis le backend (jamais recalculées ici)
  const cnssPatPension  = result?.cnssEmployerPension  ?? 0;
  const cnssPatFamily   = result?.cnssEmployerFamily   ?? 0;
  const cnssPatAccident = result?.cnssEmployerAccident ?? 0;
  const cnssPatTus      = result?.tusAmount            ?? 0;
  const cnssPatTotal    = cnssPatPension + cnssPatFamily + cnssPatAccident;
  const totalChargesEmp = cnssPatTotal + cnssPatTus;

  const OtRow = ({ label, sub, value, onChange }: { label: string; sub: string; value: number; onChange: (v: number) => void }) => (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-50 dark:bg-orange-900/10 rounded-xl mb-1.5">
      <div className="w-14 shrink-0">
        <span className="font-black text-orange-600 dark:text-orange-400 text-sm">{label}</span>
        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sub}</p>
      </div>
      <button onClick={() => onChange(Math.max(0, +(value - 0.5).toFixed(1)))} className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"><Minus size={11} /></button>
      <span className="w-12 text-center font-bold font-mono text-sm">{value.toFixed(1)}</span>
      <button onClick={() => onChange(+(value + 0.5).toFixed(1))} className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"><Plus size={11} /></button>
      <span className="text-xs text-gray-400">h</span>
    </div>
  );

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6 pb-20">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
          <FlaskConical size={18} color="white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Simulateur de paie</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Calcul 100% backend · Conforme droit congolais · CNSS 3 branches</p>
        </div>
      </div>

      {/* Sélecteur de mode */}
      <div className="flex gap-3 mb-5">
        <button onClick={() => switchMode('existing')}
          className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left
            ${mode === 'existing' ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${mode === 'existing' ? 'bg-violet-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}><Users size={16} /></div>
          <div>
            <p className={`font-bold text-sm ${mode === 'existing' ? 'text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300'}`}>Employé existant</p>
            <p className="text-[11px] text-gray-400">Depuis la liste de l'entreprise</p>
          </div>
          {mode === 'existing' && <div className="ml-auto w-2 h-2 rounded-full bg-violet-500" />}
        </button>

        <button onClick={() => switchMode('free')}
          className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left
            ${mode === 'free' ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${mode === 'free' ? 'bg-cyan-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}><UserPlus size={16} /></div>
          <div>
            <p className={`font-bold text-sm ${mode === 'free' ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-700 dark:text-gray-300'}`}>Simulation libre</p>
            <p className="text-[11px] text-gray-400">Vérifier un bulletin · sans compte</p>
          </div>
          {mode === 'free' && <div className="ml-auto w-2 h-2 rounded-full bg-cyan-500" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* ══ FORMULAIRE ═══════════════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* Identité */}
          {mode === 'existing' ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3"><User size={14} className="text-violet-500" /><h3 className="font-bold text-sm text-gray-900 dark:text-white">Employé</h3></div>
              <div className="relative">
                <input type="text" placeholder="Rechercher un employé..." value={empSearch}
                  onChange={e => { setEmpSearch(e.target.value); setShowDropdown(true); if (!e.target.value) setSelectedEmp(null); }}
                  onFocus={() => setShowDropdown(true)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-500/20
                    ${selectedEmp ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'}`} />
                {showDropdown && filteredEmps.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                    {filteredEmps.map(e => (
                      <button key={e.id} onMouseDown={() => handleSelectEmployee(e)}
                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center border-b border-gray-100 dark:border-gray-700/50 last:border-0 cursor-pointer">
                        <span className="font-semibold text-sm">{e.firstName} {e.lastName}</span>
                        <span className="text-xs text-gray-400 font-mono">{fmt(e.baseSalary)} F</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-cyan-200 dark:border-cyan-800/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3"><UserPlus size={14} className="text-cyan-500" /><h3 className="font-bold text-sm text-gray-900 dark:text-white">Identité <span className="font-normal text-gray-400">(optionnel)</span></h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Prénom</label>
                  <input type="text" value={freeFirstName} placeholder="Jean" onChange={e => setFreeFirstName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nom</label>
                  <input type="text" value={freeLastName} placeholder="Dupont" onChange={e => setFreeLastName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* Rémunération */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3"><Calculator size={14} className="text-emerald-500" /><h3 className="font-bold text-sm text-gray-900 dark:text-white">Rémunération</h3></div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mois</label>
                <select value={month} onChange={e => setMonth(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 outline-none cursor-pointer">
                  {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Année</label>
                <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 outline-none" />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Salaire de base (FCFA)</label>
              <input type="number" value={baseSalary} onChange={e => setBaseSalary(e.target.value)} placeholder="Ex: 500 000"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold font-mono bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
              {mode === 'free' && Number(baseSalary) > 0 && Number(baseSalary) < 70400 && (
                <p className="text-[10px] text-red-500 mt-1">⚠ En dessous du SMIG (70 400 FCFA)</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Jours travaillés (sur {workDays})</label>
              <div className="flex items-center gap-2.5 mb-2">
                <button onClick={() => setWorkedDays(d => Math.max(0, d-1))} className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center hover:bg-gray-50 cursor-pointer"><Minus size={12} /></button>
                <input type="number" min={0} max={workDays} value={workedDays} onChange={e => setWorkedDays(Math.min(workDays, Math.max(0, Number(e.target.value))))}
                  className="w-16 text-center font-black text-lg font-mono border border-gray-200 dark:border-gray-600 rounded-xl py-1.5 bg-white dark:bg-gray-700 outline-none" />
                <button onClick={() => setWorkedDays(d => Math.min(workDays, d+1))} className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center hover:bg-gray-50 cursor-pointer"><Plus size={12} /></button>
                {absenceDays > 0 ? <span className="text-xs font-bold text-orange-500">→ {absenceDays}j absence</span> : <span className="text-xs font-bold text-emerald-500">✓ Mois complet</span>}
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(workedDays / workDays) * 100}%`, background: absenceDays === 0 ? '#10b981' : '#f97316' }} />
              </div>
            </div>
          </div>

          {/* Mode fiscal — mode libre uniquement */}
          {mode === 'free' && (
            <div className="bg-white dark:bg-gray-800 border border-cyan-200 dark:border-cyan-800/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3"><Percent size={14} className="text-cyan-500" /><h3 className="font-bold text-sm text-gray-900 dark:text-white">Mode fiscal & cotisations</h3></div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={() => setIsSubjectCnss(v => !v)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${isSubjectCnss ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                  {isSubjectCnss ? <Lock size={13} className="text-emerald-600 shrink-0" /> : <Unlock size={13} className="text-gray-400 shrink-0" />}
                  <div className="text-left">
                    <p className={`text-xs font-bold ${isSubjectCnss ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-400'}`}>CNSS</p>
                    <p className="text-[10px] text-gray-400">{isSubjectCnss ? 'Assujetti (4%)' : 'Exonéré'}</p>
                  </div>
                </button>
                <button onClick={() => setIsSubjectIts(v => !v)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${isSubjectIts ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                  {isSubjectIts ? <Lock size={13} className="text-cyan-600 shrink-0" /> : <Unlock size={13} className="text-gray-400 shrink-0" />}
                  <div className="text-left">
                    <p className={`text-xs font-bold ${isSubjectIts ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-400'}`}>ITS / IRPP</p>
                    <p className="text-[10px] text-gray-400">{isSubjectIts ? 'Assujetti' : 'Exonéré'}</p>
                  </div>
                </button>
              </div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Mode de calcul ITS</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {FISCAL_MODES.map(fm => {
                  const isActive = fiscalMode === fm.value;
                  const activeClass = fm.color === 'violet' ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20' : fm.color === 'amber' ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : fm.color === 'cyan' ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20' : 'border-gray-400 bg-gray-50 dark:bg-gray-700';
                  const textClass  = fm.color === 'violet' ? 'text-violet-700 dark:text-violet-300' : fm.color === 'amber' ? 'text-amber-700 dark:text-amber-300' : fm.color === 'cyan' ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-700 dark:text-gray-300';
                  return (
                    <button key={fm.value} onClick={() => setFiscalMode(fm.value)}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${isActive ? activeClass : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                      <p className={`text-xs font-black ${isActive ? textClass : 'text-gray-600 dark:text-gray-400'}`}>{fm.label}</p>
                      <p className="text-[10px] text-gray-400">{fm.sub}</p>
                    </button>
                  );
                })}
              </div>
              {fiscalMode === 'FORFAIT' && (
                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
                  <label className="block text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-2">Taux forfaitaire ITS</label>
                  <div className="flex gap-2 mb-2">
                    {[{ label: '6%', value: 0.06 }, { label: '8%', value: 0.08 }, { label: '10%', value: 0.10 }].map(p => (
                      <button key={p.value} onClick={() => setForfaitRate(p.value)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${forfaitRate === p.value ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white dark:bg-gray-700 text-gray-600 border-gray-200 hover:border-cyan-300'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} max={40} step={0.5} value={Math.round(forfaitRate * 100 * 10) / 10} onChange={e => setForfaitRate(Number(e.target.value) / 100)}
                      className="w-20 px-2 py-1.5 border border-cyan-200 dark:border-cyan-700 rounded-lg text-sm font-mono font-bold bg-white dark:bg-gray-700 text-cyan-700 dark:text-cyan-300 outline-none" />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              )}
              {fiscalMode === 'IRPP_LEGACY' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 mt-3">
                  <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Situation familiale (parts fiscales)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Situation</label>
                      <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value as any)}
                        className="w-full px-2 py-2 border border-amber-200 dark:border-amber-700 rounded-lg text-xs bg-white dark:bg-gray-700 outline-none cursor-pointer">
                        <option value="SINGLE">Célibataire</option>
                        <option value="MARRIED">Marié(e)</option>
                        <option value="DIVORCED">Divorcé(e)</option>
                        <option value="WIDOWED">Veuf/Veuve</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Enfants</label>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setNbChildren(n => Math.max(0, n-1))} className="w-7 h-7 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-700 flex items-center justify-center cursor-pointer text-amber-600"><Minus size={10} /></button>
                        <span className="w-8 text-center font-black text-sm font-mono">{nbChildren}</span>
                        <button onClick={() => setNbChildren(n => Math.min(10, n+1))} className="w-7 h-7 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-700 flex items-center justify-center cursor-pointer text-amber-600"><Plus size={10} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Heures supplémentaires */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3"><Clock size={14} className="text-orange-500" /><h3 className="font-bold text-sm text-gray-900 dark:text-white">Heures supplémentaires</h3><span className="ml-auto text-[10px] text-gray-400">Décret 78-360</span></div>
            <OtRow label="+10%"  sub="5 premières heures"   value={ot10}  onChange={setOt10} />
            <OtRow label="+25%"  sub="Heures suivantes"     value={ot25}  onChange={setOt25} />
            <OtRow label="+50%"  sub="Nuit / repos / férié" value={ot50}  onChange={setOt50} />
            <OtRow label="+100%" sub="Nuit dim. / férié"    value={ot100} onChange={setOt100} />
          </div>

          {/* Primes */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Gift size={14} className="text-cyan-500" /><h3 className="font-bold text-sm text-gray-900 dark:text-white">Primes</h3>
              <button onClick={addBonus} className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 cursor-pointer"><Plus size={10} /> Ajouter</button>
            </div>
            {manualBonuses.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">{mode === 'existing' ? 'Vide → backend utilisera les primes configurées' : 'Ajoutez les primes de votre bulletin'}</p>
            ) : (
              <div className="space-y-2.5 mt-2">
                {manualBonuses.map(b => (
                  <div key={b.localId} className="flex flex-col gap-1.5">
                    <div className="flex gap-2 items-center">
                      <input placeholder="Libellé" value={b.bonusType} onChange={e => updateBonus(b.localId, { bonusType: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 outline-none" />
                      <input type="number" placeholder="Montant" value={b.amount || ''} onChange={e => updateBonus(b.localId, { amount: Number(e.target.value) })}
                        className="w-28 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-mono bg-white dark:bg-gray-700 outline-none" />
                      <button onClick={() => setManualBonuses(prev => prev.filter(x => x.localId !== b.localId))} className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 cursor-pointer"><Trash2 size={12} className="text-red-500" /></button>
                    </div>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[10px] text-gray-400">Fiscal :</span>
                      <BonusFiscalBadge label="ITS"  active={b.isTaxable} onChange={() => updateBonus(b.localId, { isTaxable: !b.isTaxable })} color="cyan" />
                      <BonusFiscalBadge label="CNSS" active={b.isCnss}    onChange={() => updateBonus(b.localId, { isCnss: !b.isCnss })} color="emerald" />
                      {!b.isTaxable && !b.isCnss && <span className="text-[10px] text-amber-500 font-semibold">→ versée au net</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Bouton simuler */}
          <button onClick={handleSimulate} disabled={isSimulating || !canSimulate}
            className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-200
              ${(!canSimulate || isSimulating) ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : mode === 'free' ? 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/25 cursor-pointer'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 cursor-pointer'
              }`}>
            {isSimulating ? <><Loader2 size={16} className="animate-spin" /> Calcul en cours...</> : <><Play size={16} /> Simuler</>}
          </button>
        </div>

        {/* ══ RÉSULTATS ════════════════════════════════════════════════════ */}
        <div>
          {!result ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-16 text-center">
              <FlaskConical size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-400">{mode === 'free' ? 'Renseignez le salaire et cliquez Simuler' : 'Sélectionnez un employé et cliquez Simuler'}</p>
            </div>
          ) : (
            <div className="space-y-4">

              {/* ── NET À PAYER ─────────────────────────────────────────── */}
              <div className="bg-gray-900 dark:bg-black rounded-2xl p-5 text-white">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Net à payer</p>
                    <p className="text-3xl font-black font-mono tracking-tight">{fmt(result.netSalary)}<span className="text-base font-normal text-gray-400 ml-2">FCFA</span></p>
                  </div>
                  <button onClick={handleCopy} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${copied ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                    {copied ? <><Check size={12} /> Copié !</> : <><Copy size={12} /> Copier</>}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {[result.employee.firstName, result.employee.lastName].filter(Boolean).join(' ') || 'Anonyme'}{' · '}{MONTHS[result.month-1]} {result.year}{' · '}{result.daysToPay}/{result.workDays} jours
                </p>
              </div>

              {/* ── RÉMUNÉRATIONS ─────────────────────────────────────── */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                <p className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 bg-emerald-50/50 dark:bg-emerald-900/10">Rémunérations</p>
                <table className="w-full"><tbody>
                  <ResultRow label="Salaire de base" value={`+${fmt(result.employee.effectiveBaseSalary)} F`} valueColor="text-emerald-600 dark:text-emerald-400" />
                  {result.absenceDeduction > 0 && <ResultRow label={`Absences (${result.workDays - result.daysToPay}j)`} value={`−${fmt(result.absenceDeduction)} F`} valueColor="text-orange-500" />}
                  {result.overtime?.amount10  > 0 && <ResultRow label={`HS +10% (${result.overtime.hours10}h)`} value={`+${fmt(result.overtime.amount10)} F`} valueColor="text-amber-600 dark:text-amber-400" />}
                  {result.overtime?.amount25  > 0 && <ResultRow label={`HS +25% (${result.overtime.hours25}h)`} value={`+${fmt(result.overtime.amount25)} F`} valueColor="text-amber-600 dark:text-amber-400" />}
                  {result.overtime?.amount50  > 0 && <ResultRow label={`HS +50% (${result.overtime.hours50}h)`} value={`+${fmt(result.overtime.amount50)} F`} valueColor="text-amber-600 dark:text-amber-400" />}
                  {result.overtime?.amount100 > 0 && <ResultRow label={`HS +100% (${result.overtime.hours100}h)`} value={`+${fmt(result.overtime.amount100)} F`} valueColor="text-amber-600 dark:text-amber-400" />}
                  {result.bonuses?.map(b => (
                    <tr key={b.id} className="border-b border-gray-50 dark:border-gray-700/50">
                      <td className="px-4 py-2.5 text-sm text-gray-500">
                        {b.bonusType}
                        <span className="ml-2 inline-flex gap-1">
                          {b.isTaxable && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-600 border border-cyan-200 font-bold">ITS</span>}
                          {b.isCnss    && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 font-bold">CNSS</span>}
                          {!b.isTaxable && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 border border-amber-200 font-bold">Net</span>}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-sm text-cyan-600 dark:text-cyan-400">+{fmt(b.amount)} F</td>
                    </tr>
                  ))}
                  <TotalRow label="Salaire brut" value={`${fmt(result.grossSalary)} F`} bgClass="bg-emerald-50 dark:bg-emerald-900/20" textClass="text-emerald-700 dark:text-emerald-400" />
                </tbody></table>
              </div>

              {/* ── COTISATIONS SALARIALES ────────────────────────────── */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                <p className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 bg-red-50/50 dark:bg-red-900/10">Cotisations & Retenues Salariales</p>
                <table className="w-full"><tbody>
                  <ResultRow
                    label="CNSS salariale (4%)"
                    sub="Branche pension · plafond 1 200 000 FCFA"
                    value={result.cnssSalarial > 0 ? `−${fmt(result.cnssSalarial)} F` : '0 F (Exonéré)'}
                    valueColor={result.cnssSalarial > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400'}
                  />
                  <tr className="border-b border-gray-50 dark:border-gray-700/50">
                    <td className="px-4 py-2.5">
                      <button onClick={() => setShowItsDetail(d => !d)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer text-sm">
                        ITS — barème progressif {showItsDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono font-semibold text-sm ${result.its > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400'}`}>
                      {result.its > 0 ? `−${fmt(result.its)} F` : '0 F (Exonéré)'}
                    </td>
                  </tr>
                  {showItsDetail && result.irppDetails && (
                    <tr className="border-b border-gray-50 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/50">
                      <td colSpan={2} className="px-4 py-3">
                        <div className="text-xs text-gray-500 space-y-1.5">
                          {!isForfait && <p>{abattementLabel} : <span className="font-mono font-bold">−{fmt(result.irppDetails.abattement)} F</span></p>}
                          {!isForfait && <p>Revenu net imposable : <span className="font-mono font-bold">{fmt(result.irppDetails.revenuNetImposable)} F</span></p>}
                          <p>Parts fiscales : <span className="font-bold">{result.irppDetails.fiscalParts}</span></p>
                          <p>Taux effectif : <span className="font-bold">{result.irppDetails.effectiveRate}%</span></p>
                          <p className={`font-semibold ${isForfait ? 'text-cyan-500' : isLegacyMode ? 'text-amber-500' : 'text-violet-500'}`}>
                            Mode : {isForfait ? `Forfait ${Math.round((result.irppDetails.forfaitRate ?? forfaitRate) * 100)}%` : isLegacyMode ? 'IRPP legacy (avant 2026)' : 'ITS 2026 · 1%/10%/25%/40%'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {(result.totalLoanDeduction + result.totalAdvanceDeduction) > 0 && (
                    <ResultRow label="Prêts & avances" value={`−${fmt(result.totalLoanDeduction + result.totalAdvanceDeduction)} F`} valueColor="text-purple-500 dark:text-purple-400" />
                  )}
                  <TotalRow label="Total retenues salariales" value={`−${fmt(result.totalDeductions)} F`} bgClass="bg-red-50 dark:bg-red-900/20" textClass="text-red-700 dark:text-red-400" />
                </tbody></table>
              </div>

              {/* ══ PART PATRONALE — SECTION COMPLÈTE ═══════════════════ */}
              <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800/50 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowEmpDetail(d => !d)}
                  className="w-full flex items-center gap-2 px-4 py-3 border-b border-orange-100 dark:border-orange-900/30 bg-orange-50/70 dark:bg-orange-900/20 hover:bg-orange-100/50 dark:hover:bg-orange-900/30 transition-colors cursor-pointer text-left"
                >
                  <Building2 size={13} className="text-orange-500 shrink-0" />
                  <p className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider flex-1">
                    Part Patronale — Charges Sociales Employeur
                  </p>
                  <span className="font-mono font-black text-sm text-orange-600 dark:text-orange-400 mr-2">
                    +{fmt(totalChargesEmp)} F
                  </span>
                  {showEmpDetail ? <ChevronUp size={14} className="text-orange-400" /> : <ChevronDown size={14} className="text-orange-400" />}
                </button>

                {showEmpDetail && (
                  <table className="w-full"><tbody>

                    {/* CNSS — 3 branches */}
                    <tr className="border-b border-gray-50 dark:border-gray-700/50 bg-orange-50/30 dark:bg-orange-900/10">
                      <td colSpan={2} className="px-4 pt-3 pb-1">
                        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">CNSS Patronale — Décret n°99-284</p>
                      </td>
                    </tr>

                    <ResultRow
                      label="Pensions / Vieillesse / Invalidité"
                      sub="8,00% × min(brut, 1 200 000 FCFA)"
                      value={`+${fmt(cnssPatPension)} F`}
                      valueColor="text-orange-600 dark:text-orange-400"
                    />
                    <ResultRow
                      label="Prestations Familiales"
                      sub="10,03% × min(brut, 600 000 FCFA)"
                      value={`+${fmt(cnssPatFamily)} F`}
                      valueColor="text-orange-600 dark:text-orange-400"
                    />
                    <ResultRow
                      label="Accidents du Travail"
                      sub="2,25% × min(brut, 600 000 FCFA)"
                      value={`+${fmt(cnssPatAccident)} F`}
                      valueColor="text-orange-600 dark:text-orange-400"
                    />

                    {/* Sous-total CNSS patronale */}
                    <tr className="border-b border-orange-200/50 dark:border-orange-800/30 bg-orange-50/50 dark:bg-orange-900/15">
                      <td className="px-4 py-2 text-xs font-semibold text-orange-600 dark:text-orange-400">
                        Sous-total CNSS patronale
                        <span className="ml-2 text-[10px] font-normal text-gray-400">~20,28% (taux effectif variable)</span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-sm text-orange-600 dark:text-orange-400">
                        +{fmt(cnssPatTotal)} F
                      </td>
                    </tr>

                    {/* TUS */}
                    <tr className="border-b border-gray-50 dark:border-gray-700/50 bg-orange-50/20 dark:bg-orange-900/5">
                      <td colSpan={2} className="px-4 pt-3 pb-1">
                        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">TUS — Taxe Unique sur les Salaires</p>
                      </td>
                    </tr>
                    <ResultRow
                      label="TUS patronale (2% déplafonné)"
                      sub={`Base = ${fmt(result.grossSalary)} F (brut total sans plafond)`}
                      value={`+${fmt(cnssPatTus)} F`}
                      valueColor="text-orange-600 dark:text-orange-400"
                    />
                    {(result.tusDgiAmount ?? 0) > 0 && (
                      <tr className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="px-4 py-2 text-xs text-gray-400">
                          TUS total DGI (5%) — pour déclaration eTax
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-xs text-gray-400">
                          {fmt(result.tusDgiAmount)} F
                        </td>
                      </tr>
                    )}

                    {/* TOTAL CHARGES PATRONALES */}
                    <TotalRow
                      label="Total charges patronales"
                      value={`+${fmt(totalChargesEmp)} F`}
                      bgClass="bg-orange-50 dark:bg-orange-900/20"
                      textClass="text-orange-700 dark:text-orange-400"
                    />
                  </tbody></table>
                )}
              </div>

              {/* ── RÉCAPITULATIF 3 COLONNES ─────────────────────────── */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/50 rounded-xl p-3">
                  <p className="text-[9px] font-bold text-sky-500 uppercase tracking-widest mb-2">Salarié</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">CNSS 4%</span>
                      <span className="font-mono font-bold text-red-500">−{fmt(result.cnssSalarial)} F</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">ITS</span>
                      <span className="font-mono font-bold text-red-500">−{fmt(result.its)} F</span>
                    </div>
                    <div className="flex justify-between text-[10px] pt-1.5 border-t border-sky-200 dark:border-sky-700">
                      <span className="font-bold text-gray-600 dark:text-gray-300">Total</span>
                      <span className="font-mono font-black text-sky-600 dark:text-sky-400">{fmt(result.totalDeductions)} F</span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl p-3">
                  <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mb-2">Employeur</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">CNSS pat.</span>
                      <span className="font-mono font-bold text-orange-500">+{fmt(cnssPatTotal)} F</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">TUS 2%</span>
                      <span className="font-mono font-bold text-orange-500">+{fmt(cnssPatTus)} F</span>
                    </div>
                    <div className="flex justify-between text-[10px] pt-1.5 border-t border-orange-200 dark:border-orange-700">
                      <span className="font-bold text-gray-600 dark:text-gray-300">Total</span>
                      <span className="font-mono font-black text-orange-600 dark:text-orange-400">{fmt(totalChargesEmp)} F</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-xl p-3">
                  <p className="text-[9px] font-bold text-purple-500 uppercase tracking-widest mb-2">Récap</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">Brut</span>
                      <span className="font-mono font-bold text-emerald-600">+{fmt(result.grossSalary)} F</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">Charges</span>
                      <span className="font-mono font-bold text-orange-500">+{fmt(totalChargesEmp)} F</span>
                    </div>
                    <div className="flex justify-between text-[10px] pt-1.5 border-t border-purple-200 dark:border-purple-700">
                      <span className="font-bold text-gray-600 dark:text-gray-300">Coût total</span>
                      <span className="font-mono font-black text-purple-600 dark:text-purple-400">{fmt(result.totalEmployerCost)} F</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── BANDE NET / COÛT ─────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900 dark:bg-black rounded-xl p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Net à payer</p>
                  <p className="font-black font-mono text-xl text-white">{fmt(result.netSalary)} <span className="text-sm font-normal text-gray-400">F</span></p>
                </div>
                <div className="bg-orange-600 dark:bg-orange-700 rounded-xl p-4">
                  <p className="text-[9px] text-orange-200 uppercase tracking-widest mb-1">Coût employeur</p>
                  <p className="font-black font-mono text-xl text-white">{fmt(result.totalEmployerCost)} <span className="text-sm font-normal text-orange-200">F</span></p>
                </div>
              </div>

              {/* ── BADGE MODE ─────────────────────────────────────────── */}
              <div className={`text-center py-2 px-4 rounded-xl text-xs font-medium border
                ${result.simulationMode === 'FREE_SIMULATION' ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 border-cyan-200 dark:border-cyan-800'
                  : result.simulationMode === 'MANUAL_OVERRIDE' ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 border-violet-200'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200'}`}>
                {result.simulationMode === 'FREE_SIMULATION' ? '🆓 Simulation libre · calcul 100% backend'
                  : result.simulationMode === 'MANUAL_OVERRIDE' ? '⚡ Valeurs manuelles · calcul 100% backend'
                  : '📊 Depuis pointage BDD · calcul 100% backend'}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}