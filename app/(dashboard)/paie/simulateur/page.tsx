'use client';

import React, { useState, useEffect } from 'react';
import {
  FlaskConical, Play, Plus, Trash2, ChevronDown, ChevronUp,
  Copy, Check, Loader2, AlertCircle, Info,
  Clock, Gift, Minus, User, Calculator, ToggleLeft, ToggleRight
} from 'lucide-react';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  baseSalary: number;
}

interface ManualBonus {
  localId: string;
  bonusType: string;
  amount: number;
  // ✅ Flags fiscaux — envoyés au backend pour la catégorisation
  isTaxable: boolean;
  isCnss: boolean;
}

interface SimResult {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    baseSalary: number;
    effectiveBaseSalary: number;
    isSubjectToCnss: boolean;
    isSubjectToIrpp: boolean;
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
    source: string;
    isTaxable: boolean;
    isCnss: boolean;
  }>;
  totalBonuses: number;
  adjustedBaseSalary: number;
  absenceDeduction: number;
  grossSalary: number;
  cnssSalarial: number;
  cnssEmployer: number;
  its: number;
  irppDetails: any;
  totalLoanDeduction: number;
  totalAdvanceDeduction: number;
  totalDeductions: number;
  netSalary: number;
  totalEmployerCost: number;
  simulationMode: string;
}

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

const fmt = (v: number) => Math.round(v ?? 0).toLocaleString('fr-FR');
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Composant toggle fiscal d'une prime ─────────────────────────────────────
const BonusFiscalBadge = ({
  label, active, onChange, color,
}: { label: string; active: boolean; onChange: () => void; color: string }) => (
  <button
    onClick={onChange}
    title={active ? `${label} : oui` : `${label} : non`}
    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer select-none ${
      active
        ? color === 'cyan'
          ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-600'
          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600'
        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600 line-through opacity-60'
    }`}
  >
    {label}
  </button>
);

export default function SimulateurPage() {
  const [employees,    setEmployees]    = useState<Employee[]>([]);
  const [selectedEmp,  setSelectedEmp]  = useState<Employee | null>(null);
  const [empSearch,    setEmpSearch]    = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [month,      setMonth]      = useState(new Date().getMonth() + 1);
  const [year,       setYear]       = useState(new Date().getFullYear());
  const [baseSalary, setBaseSalary] = useState('');
  const [workedDays, setWorkedDays] = useState(26);
  const workDays = 26;

  const [ot10,  setOt10]  = useState(0);
  const [ot25,  setOt25]  = useState(0);
  const [ot50,  setOt50]  = useState(0);
  const [ot100, setOt100] = useState(0);

  // ✅ ManualBonus inclut maintenant isTaxable et isCnss
  const [manualBonuses, setManualBonuses] = useState<ManualBonus[]>([]);

  const [isSimulating,  setIsSimulating]  = useState(false);
  const [result,        setResult]        = useState<SimResult | null>(null);
  const [error,         setError]         = useState('');
  const [showItsDetail, setShowItsDetail] = useState(false);
  const [copied,        setCopied]        = useState(false);

  useEffect(() => {
    api.get('/employees?limit=500')
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.data || data?.employees || [];
        setEmployees(list);
      })
      .catch(() => setError('Impossible de charger les employés.'));
  }, []);

  const filteredEmps = empSearch.length >= 2
    ? employees.filter(e =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(empSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmp(emp);
    setEmpSearch(`${emp.firstName} ${emp.lastName}`);
    setBaseSalary(String(emp.baseSalary));
    setShowDropdown(false);
    setResult(null);
    setError('');
  };

  // ✅ Ajouter une prime avec isTaxable=true isCnss=true par défaut (modifiable par le RH)
  const addBonus = () => setManualBonuses(b => [
    ...b,
    { localId: uid(), bonusType: '', amount: 0, isTaxable: true, isCnss: true },
  ]);

  const updateBonus = (localId: string, patch: Partial<ManualBonus>) => {
    setManualBonuses(prev => prev.map(b => b.localId === localId ? { ...b, ...patch } : b));
  };

  // ✅ Simuler — envoie isTaxable + isCnss au backend
  const handleSimulate = async () => {
    if (!selectedEmp) { setError('Sélectionne un employé.'); return; }
    setIsSimulating(true);
    setError('');
    setResult(null);

    try {
      const payload: Record<string, any> = {
        employeeId:  selectedEmp.id,
        month,
        year,
        baseSalary:  Number(baseSalary) || selectedEmp.baseSalary,
        workedDays,
        overtimeHours10:  ot10,
        overtimeHours25:  ot25,
        overtimeHours50:  ot50,
        overtimeHours100: ot100,
      };

      const validBonuses = manualBonuses.filter(b => b.bonusType.trim() && b.amount > 0);
      if (validBonuses.length > 0) {
        // ✅ On envoie isTaxable et isCnss pour chaque prime
        payload.manualBonuses = validBonuses.map(b => ({
          bonusType: b.bonusType,
          amount:    b.amount,
          isTaxable: b.isTaxable,
          isCnss:    b.isCnss,
        }));
      }

      const data = await api.post<SimResult>('/payrolls/simulate', payload);
      setResult(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur lors de la simulation.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const lines = [
      `Simulation — ${result.employee.firstName} ${result.employee.lastName} — ${MONTHS[result.month-1]} ${result.year}`,
      '─'.repeat(50),
      `Base             : ${fmt(result.employee.effectiveBaseSalary)} FCFA`,
      `Jours travaillés : ${result.daysToPay}/${result.workDays}`,
      result.overtime.total > 0 ? `Total HS         : +${fmt(result.overtime.total)} FCFA` : null,
      result.totalBonuses > 0   ? `Total primes     : +${fmt(result.totalBonuses)} FCFA`   : null,
      '─'.repeat(50),
      `Brut             : ${fmt(result.grossSalary)} FCFA`,
      `CNSS salarié     : −${fmt(result.cnssSalarial)} FCFA`,
      `ITS              : −${fmt(result.its)} FCFA`,
      '─'.repeat(50),
      `NET À PAYER      : ${fmt(result.netSalary)} FCFA`,
      `Coût employeur   : ${fmt(result.totalEmployerCost)} FCFA`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const absenceDays = Math.max(0, workDays - workedDays);

  const OtRow = ({ label, sub, value, onChange }: {
    label: string; sub: string; value: number; onChange: (v: number) => void;
  }) => (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-50 dark:bg-orange-900/10 rounded-xl mb-1.5">
      <div className="w-14 shrink-0">
        <span className="font-black text-orange-600 dark:text-orange-400 text-sm">{label}</span>
        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sub}</p>
      </div>
      <button onClick={() => onChange(Math.max(0, +(value - 0.5).toFixed(1)))}
        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800
                   flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
        <Minus size={11} />
      </button>
      <span className="w-12 text-center font-bold font-mono text-sm">{value.toFixed(1)}</span>
      <button onClick={() => onChange(+(value + 0.5).toFixed(1))}
        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800
                   flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
        <Plus size={11} />
      </button>
      <span className="text-xs text-gray-400">h</span>
    </div>
  );

  // ✅ Détecter le mode fiscal pour l'affichage de l'abattement
  const isLegacyMode = result?.irppDetails?.fiscalMode === 'IRPP_LEGACY';
  const abattementLabel = isLegacyMode ? 'Abattement 30% (plafonné 75 000/mois)' : 'Abattement 20%';

  return (
    <div className="max-w-[1080px] mx-auto px-4 py-6 pb-20">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600
                        flex items-center justify-center shadow-lg shadow-violet-500/25">
          <FlaskConical size={18} color="white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Simulateur de paie</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Calcul 100% backend · Identique à la production
          </p>
        </div>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-2.5 p-3 mb-5 rounded-xl
                      bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
        <Info size={13} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
        <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
          <strong>Vérification de bulletins</strong> — Entrez les valeurs exactes d'un bulletin pour confirmer
          que CNSS et ITS sont corrects. Pour les primes manuelles, configurez les flags fiscaux (ITS / CNSS)
          selon la nature de la prime.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* ─── FORMULAIRE ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Employé */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <User size={14} className="text-violet-500" />
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Employé</h3>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un employé..."
                value={empSearch}
                onChange={e => { setEmpSearch(e.target.value); setShowDropdown(true); if (!e.target.value) setSelectedEmp(null); }}
                onFocus={() => setShowDropdown(true)}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors
                  focus:ring-2 focus:ring-violet-500/20
                  ${selectedEmp
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'}`}
              />
              {showDropdown && filteredEmps.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800
                                border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                  {filteredEmps.map(e => (
                    <button key={e.id} onMouseDown={() => handleSelectEmployee(e)}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                                 flex justify-between items-center border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        {e.firstName} {e.lastName}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{fmt(e.baseSalary)} F</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rémunération */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calculator size={14} className="text-emerald-500" />
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Rémunération</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mois</label>
                <select value={month} onChange={e => setMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none">
                  {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Année</label>
                <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none" />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Salaire de base (FCFA)
              </label>
              <input type="number" value={baseSalary}
                onChange={e => setBaseSalary(e.target.value)}
                placeholder="Ex: 500 000"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl
                           text-sm font-bold font-mono bg-white dark:bg-gray-700
                           text-gray-900 dark:text-white outline-none
                           focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Jours travaillés (sur {workDays})
              </label>
              <div className="flex items-center gap-2.5 mb-2">
                <button onClick={() => setWorkedDays(d => Math.max(0, d-1))}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700
                             flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                  <Minus size={12} className="text-gray-600 dark:text-gray-300" />
                </button>
                <input type="number" min={0} max={workDays} value={workedDays}
                  onChange={e => setWorkedDays(Math.min(workDays, Math.max(0, Number(e.target.value))))}
                  className="w-16 text-center font-black text-lg font-mono border border-gray-200 dark:border-gray-600
                             rounded-xl py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none" />
                <button onClick={() => setWorkedDays(d => Math.min(workDays, d+1))}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700
                             flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                  <Plus size={12} className="text-gray-600 dark:text-gray-300" />
                </button>
                {absenceDays > 0
                  ? <span className="text-xs font-bold text-orange-500">→ {absenceDays}j absence</span>
                  : <span className="text-xs font-bold text-emerald-500">✓ Mois complet</span>
                }
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(workedDays / workDays) * 100}%`,
                    background: absenceDays === 0 ? '#10b981' : '#f97316'
                  }} />
              </div>
            </div>
          </div>

          {/* Heures sup */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-orange-500" />
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Heures supplémentaires</h3>
              <span className="ml-auto text-[10px] text-gray-400">Décret 78-360</span>
            </div>
            <OtRow label="+10%"  sub="5 premières heures"   value={ot10}  onChange={setOt10} />
            <OtRow label="+25%"  sub="Heures suivantes"     value={ot25}  onChange={setOt25} />
            <OtRow label="+50%"  sub="Nuit / repos / férié" value={ot50}  onChange={setOt50} />
            <OtRow label="+100%" sub="Nuit dim. / férié"    value={ot100} onChange={setOt100} />
          </div>

          {/* ✅ Primes manuelles avec flags isTaxable et isCnss ─────────── */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Gift size={14} className="text-cyan-500" />
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Primes manuelles</h3>
              <button onClick={addBonus}
                className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-cyan-50 dark:bg-cyan-900/20
                           border border-cyan-200 dark:border-cyan-800 rounded-lg text-xs font-bold
                           text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 transition-colors cursor-pointer">
                <Plus size={10} /> Ajouter
              </button>
            </div>

            {manualBonuses.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">
                Vide → le backend utilisera les primes configurées pour cet employé
              </p>
            ) : (
              <>
                {/* Légende */}
                <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-2">
                  <span className="inline-flex h-px flex-1 bg-gray-100 dark:bg-gray-700" />
                  Cliquez les badges pour activer/désactiver
                  <span className="inline-flex h-px flex-1 bg-gray-100 dark:bg-gray-700" />
                </p>
                <div className="space-y-2.5">
                  {manualBonuses.map(b => (
                    <div key={b.localId} className="flex flex-col gap-1.5">
                      <div className="flex gap-2 items-center">
                        <input
                          placeholder="Libellé de la prime"
                          value={b.bonusType}
                          onChange={e => updateBonus(b.localId, { bonusType: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                                     text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Montant"
                          value={b.amount || ''}
                          onChange={e => updateBonus(b.localId, { amount: Number(e.target.value) })}
                          className="w-28 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                                     text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                        />
                        <button
                          onClick={() => setManualBonuses(prev => prev.filter(x => x.localId !== b.localId))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-800
                                     bg-red-50 dark:bg-red-900/20 hover:bg-red-100 transition-colors cursor-pointer">
                          <Trash2 size={12} className="text-red-500" />
                        </button>
                      </div>

                      {/* ✅ Toggles fiscaux de la prime */}
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] text-gray-400">Fiscal :</span>
                        <BonusFiscalBadge
                          label="ITS"
                          active={b.isTaxable}
                          onChange={() => updateBonus(b.localId, { isTaxable: !b.isTaxable })}
                          color="cyan"
                        />
                        <BonusFiscalBadge
                          label="CNSS"
                          active={b.isCnss}
                          onChange={() => updateBonus(b.localId, { isCnss: !b.isCnss })}
                          color="emerald"
                        />
                        {!b.isTaxable && !b.isCnss && (
                          <span className="text-[10px] text-amber-500 font-semibold">→ versée au net</span>
                        )}
                        {b.isTaxable && !b.isCnss && (
                          <span className="text-[10px] text-blue-400">→ ITS seulement</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20
                            border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Bouton simuler */}
          <button
            onClick={handleSimulate}
            disabled={isSimulating || !selectedEmp}
            className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2
                        transition-all duration-200
                        ${(!selectedEmp || isSimulating)
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 cursor-pointer'
                        }`}>
            {isSimulating
              ? <><Loader2 size={16} className="animate-spin" /> Calcul backend en cours...</>
              : <><Play size={16} /> Simuler</>
            }
          </button>
        </div>

        {/* ─── RÉSULTAT ───────────────────────────────────────────────── */}
        <div>
          {!result ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700
                            rounded-2xl p-16 text-center">
              <FlaskConical size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-400">Renseignez les paramètres et cliquez sur Simuler</p>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Net à payer */}
              <div className="bg-gray-900 dark:bg-black rounded-2xl p-5 text-white">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Net à payer</p>
                    <p className="text-3xl font-black font-mono tracking-tight">
                      {fmt(result.netSalary)}
                      <span className="text-base font-normal text-gray-400 ml-2">FCFA</span>
                    </p>
                  </div>
                  <button onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer
                      ${copied
                        ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                      }`}>
                    {copied ? <><Check size={12} /> Copié !</> : <><Copy size={12} /> Copier</>}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {result.employee.firstName} {result.employee.lastName}
                  {' · '}{MONTHS[result.month-1]} {result.year}
                  {' · '}{result.daysToPay}/{result.workDays} jours
                </p>
              </div>

              {/* Rémunérations */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                <p className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider
                              border-b border-gray-100 dark:border-gray-700">
                  Rémunérations
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-50 dark:border-gray-700/50">
                      <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">Salaire de base</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-gray-900 dark:text-white">
                        {fmt(result.employee.effectiveBaseSalary)} F
                      </td>
                    </tr>
                    {result.absenceDeduction > 0 && (
                      <tr className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="px-4 py-2.5 text-orange-500">
                          Déduction absences ({result.workDays - result.daysToPay}j)
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-orange-500">
                          −{fmt(result.absenceDeduction)} F
                        </td>
                      </tr>
                    )}
                    {result.overtime?.amount10 > 0 && (
                      <tr className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">HS +10% ({result.overtime.hours10}h)</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-600">+{fmt(result.overtime.amount10)} F</td>
                      </tr>
                    )}
                    {result.overtime?.amount25 > 0 && (
                      <tr className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">HS +25% ({result.overtime.hours25}h)</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-600">+{fmt(result.overtime.amount25)} F</td>
                      </tr>
                    )}
                    {result.overtime?.amount50 > 0 && (
                      <tr className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">HS +50% ({result.overtime.hours50}h)</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-600">+{fmt(result.overtime.amount50)} F</td>
                      </tr>
                    )}
                    {result.overtime?.amount100 > 0 && (
                      <tr className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">HS +100% ({result.overtime.hours100}h)</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-600">+{fmt(result.overtime.amount100)} F</td>
                      </tr>
                    )}
                    {result.bonuses?.map(b => (
                      <tr key={b.id} className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="px-4 py-2.5">
                          <span className="text-gray-500 dark:text-gray-400">{b.bonusType}</span>
                          {/* ✅ Badges fiscaux sur les primes dans le résultat */}
                          <span className="ml-2 inline-flex gap-1">
                            {b.isTaxable !== false && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-700 font-bold">ITS</span>
                            )}
                            {b.isCnss !== false && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 font-bold">CNSS</span>
                            )}
                            {b.isTaxable === false && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700 font-bold">Net</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-cyan-600">
                          +{fmt(b.amount)} F
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50 dark:bg-emerald-900/20">
                      <td className="px-4 py-3 font-bold text-emerald-700 dark:text-emerald-400">Salaire brut</td>
                      <td className="px-4 py-3 text-right font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {fmt(result.grossSalary)} F
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Cotisations */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                <p className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider
                              border-b border-gray-100 dark:border-gray-700">
                  Cotisations & retenues
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-50 dark:border-gray-700/50">
                      <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">CNSS salarié (4%)</td>
                      <td className="px-4 py-2.5 text-right font-mono text-red-500">−{fmt(result.cnssSalarial)} F</td>
                    </tr>
                    <tr className="border-b border-gray-50 dark:border-gray-700/50">
                      <td className="px-4 py-2.5">
                        <button onClick={() => setShowItsDetail(d => !d)}
                          className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer">
                          ITS {showItsDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-red-500">−{fmt(result.its)} F</td>
                    </tr>
                    {showItsDetail && result.irppDetails && (
                      <tr className="border-b border-gray-50 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/50">
                        <td colSpan={2} className="px-4 py-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            {/* ✅ Libellé d'abattement dynamique selon le mode fiscal */}
                            <p>{abattementLabel} : −{fmt(result.irppDetails.abattement)} F</p>
                            <p>RNI mensuel : {fmt(result.irppDetails.revenuNetImposable)} F</p>
                            <p>Parts fiscales : {result.irppDetails.fiscalParts}</p>
                            <p>Taux effectif : {result.irppDetails.effectiveRate}% (sur base imposable)</p>
                            {/* ✅ Affichage du mode fiscal */}
                            <p className={`font-semibold ${isLegacyMode ? 'text-amber-500' : 'text-violet-500'}`}>
                              Mode : {isLegacyMode ? 'IRPP legacy (avant 2026)' : 'ITS 2026'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {(result.totalLoanDeduction + result.totalAdvanceDeduction) > 0 && (
                      <tr className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">Prêts / avances</td>
                        <td className="px-4 py-2.5 text-right font-mono text-red-500">
                          −{fmt(result.totalLoanDeduction + result.totalAdvanceDeduction)} F
                        </td>
                      </tr>
                    )}
                    <tr className="bg-red-50 dark:bg-red-900/20">
                      <td className="px-4 py-3 font-bold text-red-700 dark:text-red-400">Total retenues</td>
                      <td className="px-4 py-3 text-right font-black font-mono text-red-600 dark:text-red-400">
                        −{fmt(result.totalDeductions)} F
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Coûts employeur */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">CNSS patronal</p>
                  <p className="font-black font-mono text-base text-emerald-600">{fmt(result.cnssEmployer)} F</p>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Coût employeur</p>
                  <p className="font-black font-mono text-base text-amber-600">{fmt(result.totalEmployerCost)} F</p>
                </div>
              </div>

              {/* Badge mode simulation */}
              <div className={`text-center py-2 px-4 rounded-xl text-xs font-medium border
                ${result.simulationMode === 'MANUAL_OVERRIDE'
                  ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                }`}>
                {result.simulationMode === 'MANUAL_OVERRIDE'
                  ? '⚡ Valeurs manuelles · calcul 100% backend'
                  : '📊 Depuis pointage BDD · calcul 100% backend'
                }
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}