'use client';

import React, { useState, useCallback } from 'react';
import {
  Play, Plus, Trash2, ChevronDown, ChevronUp,
  Copy, Check, Clock, Gift, Minus, Calculator,
  Percent, Lock, Unlock, Building2, CreditCard,
  AlertCircle, ArrowRight, Zap, Shield, TrendingUp,
} from 'lucide-react';

// ============================================================================
// 🇨🇬 MOTEUR DE CALCUL — copie fidèle du backend (lib/payroll-engine.ts)
// Même résultat que « Simulateur de paie » de l'application : ITS 2026,
// CNSS, parts fiscales, TOL, taxes configurables, indemnités non imposables.
// ============================================================================
import {
  computeSimulation, calcFiscalParts, SMIG,
  type EngineResult, type CustomTaxInput, type FiscalModeInput,
} from '@/lib/payroll-engine';
import { PayslipBreakdown } from '@/components/payroll/PayslipBreakdown';

const WORK_DAYS = 26;

type CustomTax = CustomTaxInput & {
  localId: string;
  employeeRate: number; employerRate: number;
  fixedEmployee: number; fixedEmployer: number;
  hasCeiling: boolean; ceiling: number; baseType: string;
  minSalaryThreshold?: number; thresholdType?: string;
};

// ============================================================================
// 🎨 COMPOSANTS UI
// ============================================================================

const fmt   = (v: number)  => Math.round(v ?? 0).toLocaleString('fr-FR');
const uid   = ()           => Math.random().toString(36).slice(2, 9);
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

type FiscalMode = 'ITS_2026' | 'IRPP_LEGACY' | 'FORFAIT';
type SimResult = EngineResult;

interface ManualBonus   { localId: string; label: string; amount: number; isTaxable: boolean; isCnss: boolean; }
const bonusCategoryOf = (b: ManualBonus) => (!b.isTaxable ? 'NON_TAXABLE' : b.isCnss ? 'TAXABLE_CNSS' : 'TAXABLE_NO_CNSS');
interface ManualAdvance { localId: string; label: string; amount: number; }

const ResultRow = ({ label, sub, value, color = 'text-gray-700 dark:text-gray-200', bold = false }: {
  label: string; sub?: string; value: string; color?: string; bold?: boolean;
}) => (
  <tr className="border-b border-gray-50 dark:border-gray-700/50">
    <td className="px-4 py-2.5">
      <span className={`${bold ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'} text-sm`}>{label}</span>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sub}</p>}
    </td>
    <td className={`px-4 py-2.5 text-right font-mono font-semibold text-sm ${color}`}>{value}</td>
  </tr>
);

const TotalRow = ({ label, value, bg, text }: { label: string; value: string; bg: string; text: string }) => (
  <tr className={bg}>
    <td className={`px-4 py-3 font-black text-sm ${text}`}>{label}</td>
    <td className={`px-4 py-3 text-right font-black font-mono text-base ${text}`}>{value}</td>
  </tr>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, label, color, right }: { icon: any; label: string; color: string; right?: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon size={14} className={color} />
    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{label}</h3>
    {right && <span className="ml-auto">{right}</span>}
  </div>
);

// ── Stepper jours ─────────────────────────────────────────────────────────────
const Stepper = ({ value, onChange, min = 0, max = WORK_DAYS, className = '' }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; className?: string;
}) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <button onClick={() => onChange(Math.max(min, value - 1))}
      className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors">
      <Minus size={12} />
    </button>
    <input type="number" value={value} min={min} max={max}
      onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
      className="w-14 text-center font-black text-base font-mono border border-gray-200 dark:border-gray-600 rounded-xl py-1.5 bg-white dark:bg-gray-700 outline-none" />
    <button onClick={() => onChange(Math.min(max, value + 1))}
      className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors">
      <Plus size={12} />
    </button>
  </div>
);

// ============================================================================
// 🖥️ PAGE PRINCIPALE
// ============================================================================

export default function SimulateurPublicPage() {
  // ── Formulaire ──────────────────────────────────────────────────────────────
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [baseSalary,  setBaseSalary]  = useState('');
  const [workedDays,  setWorkedDays]  = useState(WORK_DAYS);
  const [month,       setMonth]       = useState(new Date().getMonth() + 1);
  const [year,        setYear]        = useState(new Date().getFullYear());

  // HS
  const [ot10,  setOt10]  = useState(0);
  const [ot25,  setOt25]  = useState(0);
  const [ot50,  setOt50]  = useState(0);
  const [ot100, setOt100] = useState(0);

  // Primes & avances
  const [bonuses,   setBonuses]   = useState<ManualBonus[]>([]);
  const [advances,  setAdvances]  = useState<ManualAdvance[]>([]);

  // Fiscal
  const [fiscalMode,     setFiscalMode]     = useState<FiscalMode>('ITS_2026');
  const [forfaitRate,    setForfaitRate]    = useState(0.08);
  const [subjectToCnss,  setSubjectToCnss]  = useState(true);
  const [subjectToIts,   setSubjectToIts]   = useState(true);
  const [marital,        setMarital]        = useState('SINGLE');
  const [children,       setChildren]       = useState(0);
  const [contractType,   setContractType]   = useState('CDI');
  const [tolZone,        setTolZone]        = useState<'VILLE'|'PERIPHERIE'>('VILLE');
  const [isResident,     setIsResident]     = useState(true);

  // Taxes custom (TOL, CAMU, etc.)
  const [customTaxes,    setCustomTaxes]    = useState<CustomTax[]>([]);
  const [showAddTax,     setShowAddTax]     = useState(false);
  const [newTax,         setNewTax]         = useState<Partial<CustomTax>>({
    name: '', code: '', employeeRate: 0, employerRate: 0,
    fixedEmployee: 0, fixedEmployer: 0, hasCeiling: false, ceiling: 0, baseType: 'GROSS',
    minSalaryThreshold: 0, thresholdType: 'ELIGIBILITY',
  });

  // UI
  const [result,          setResult]          = useState<SimResult | null>(null);
  const [showItsDetail,   setShowItsDetail]   = useState(false);
  const [showEmpDetail,   setShowEmpDetail]   = useState(true);
  const [copied,          setCopied]          = useState(false);
  const [showFiscalPanel, setShowFiscalPanel] = useState(false);

  const absenceDays = Math.max(0, WORK_DAYS - workedDays);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const addBonus   = () => setBonuses(b => [...b, { localId: uid(), label: '', amount: 0, isTaxable: true, isCnss: true }]);
  const addAdvance = () => setAdvances(a => [...a, { localId: uid(), label: 'Avance sur salaire', amount: 0 }]);
  const rmBonus    = (id: string) => setBonuses(b => b.filter(x => x.localId !== id));
  const rmAdvance  = (id: string) => setAdvances(a => a.filter(x => x.localId !== id));

  const handleSimulate = useCallback(() => {
    const base = Number(baseSalary);
    if (!base || base < 1) return;
    const res = computeSimulation({
      baseSalary: base, workedDays, workDays: WORK_DAYS, month, year,
      overtimeHours10: ot10, overtimeHours25: ot25, overtimeHours50: ot50, overtimeHours100: ot100,
      bonuses: bonuses.filter(b => b.label && b.amount > 0).map(b => ({
        bonusType: b.label, amount: b.amount, isTaxable: b.isTaxable, isCnss: b.isCnss,
        fiscalType: bonusCategoryOf(b),
      })),
      advances: advances.filter(a => a.amount > 0).map(a => ({ label: a.label, amount: a.amount })),
      isSubjectToCnss: subjectToCnss, isSubjectToIrpp: subjectToIts,
      maritalStatus: marital as any, numberOfChildren: children,
      fiscalMode: fiscalMode as FiscalModeInput, forfaitItsRate: forfaitRate,
      contractType, tolZone, isResident,
      companyTaxes: customTaxes,
      firstName: firstName || 'Anonyme', lastName,
    });
    setResult(res);
    setShowItsDetail(false);
    setTimeout(() => document.getElementById('sim-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, [baseSalary, workedDays, month, year, ot10, ot25, ot50, ot100, bonuses, advances,
      subjectToCnss, subjectToIts, marital, children, fiscalMode, forfaitRate, customTaxes,
      contractType, tolZone, isResident, firstName, lastName]);

  const handleCopy = () => {
    if (!result) return;
    const name = [firstName, lastName].filter(Boolean).join(' ') || 'Anonyme';
    const nonTax = result.bonuses.filter(b => b.fiscalType === 'NON_TAXABLE').reduce((s, b) => s + b.amount, 0);
    const lines = [
      `Simulation paie — ${name} — ${MONTHS[month-1]} ${year}`,
      '─'.repeat(55),
      `Salaire brut imposable : ${fmt(result.grossSalary)} FCFA`,
      `CNSS salarié (4%)      : −${fmt(result.cnssSalarial)} FCFA`,
      `${result.isBncWorker ? 'BNC' : 'ITS'}                    : −${fmt(result.its)} FCFA`,
      ...result.customTaxes.map(t => `${t.name} (${t.code}) : −${fmt(t.employeeAmount)} FCFA`),
      result.totalAdvanceDeduction > 0 ? `Avances                : −${fmt(result.totalAdvanceDeduction)} FCFA` : null,
      nonTax > 0 ? `Indemnités non imposables : +${fmt(nonTax)} FCFA` : null,
      '─'.repeat(55),
      `NET À PAYER            : ${fmt(result.netSalary)} FCFA`,
      '─'.repeat(55),
      `CHARGES PATRONALES`,
      `  CNSS Pensions (8%)  : +${fmt(result.cnssEmployerPension)} FCFA`,
      `  CNSS Famille (10,03%): +${fmt(result.cnssEmployerFamily)} FCFA`,
      `  CNSS Accident (2,25%): +${fmt(result.cnssEmployerAccident)} FCFA`,
      `  TUS DGI (2,025%)    : +${fmt(result.tusDgiAmount)} FCFA`,
      `  TUS CNSS (5,475%)   : +${fmt(result.tusCnssAmount)} FCFA`,
      ...result.customTaxes.filter(t => t.employerAmount > 0).map(t => `  ${t.name} pat.    : +${fmt(t.employerAmount)} FCFA`),
      '─'.repeat(55),
      `COÛT TOTAL EMPLOYEUR   : ${fmt(result.totalEmployerCost)} FCFA`,
      '',
      'Simulé avec konza-rh.cg — Logiciel RH & Paie Congo-Brazzaville',
    ].filter(l => l !== null).join('\n');
    navigator.clipboard.writeText(lines).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  const addCustomTax = () => {
    if (!newTax.name || !newTax.code) return;
    setCustomTaxes(t => [...t, { ...newTax as CustomTax, applicableContractTypes: ['CDI', 'CDD', 'STAGE', 'INTERIM', 'CONSULTANT', 'PRESTATAIRE'], localId: uid() }]);
    setNewTax({ name: '', code: '', employeeRate: 0, employerRate: 0, fixedEmployee: 0, fixedEmployer: 0, hasCeiling: false, ceiling: 0, baseType: 'GROSS', minSalaryThreshold: 0, thresholdType: 'ELIGIBILITY' });
    setShowAddTax(false);
  };

  // Dérivés résultats
  const isLegacy        = fiscalMode === 'IRPP_LEGACY';
  const isForfait       = fiscalMode === 'FORFAIT';
  const canSimulate     = Number(baseSalary) >= 1;

  const OtRow = ({ label, sub, value, onChange }: { label: string; sub: string; value: number; onChange: (v:number) => void }) => (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-50 dark:bg-orange-900/10 rounded-xl mb-1.5">
      <div className="w-16 shrink-0">
        <span className="font-black text-orange-600 dark:text-orange-400 text-sm">{label}</span>
        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sub}</p>
      </div>
      <button onClick={() => onChange(Math.max(0, +(value - 0.5).toFixed(1)))}
        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 cursor-pointer"><Minus size={11} /></button>
      <span className="w-12 text-center font-bold font-mono text-sm">{value.toFixed(1)}</span>
      <button onClick={() => onChange(+(value + 0.5).toFixed(1))}
        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 cursor-pointer"><Plus size={11} /></button>
      <span className="text-xs text-gray-400">h</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 pb-8">

          {/* Logo / brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Calculator size={17} color="white" />
            </div>
            <span className="font-black text-lg tracking-tight">konza<span className="text-violet-400">.cg</span></span>
            <span className="ml-auto text-xs text-gray-500 border border-gray-700 px-2.5 py-1 rounded-full">Simulateur public gratuit</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3 leading-tight">
            Calculez votre salaire net<br />
            <span className="text-violet-400">Congo-Brazzaville 2026</span>
          </h1>
          <p className="text-gray-400 text-sm mb-6 max-w-xl">
            ITS 2026 · CNSS · TUS · Heures supplémentaires · Taxes custom (CAMU, TOL…)<br />
            Calcul conforme à l'Ordonnance n°2025-44 du 31 déc. 2025 · 100% gratuit · Aucun compte requis
          </p>

          {/* Features pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { icon: Zap,       label: 'Calcul instantané'        },
              { icon: Shield,    label: 'Barème officiel 2026'     },
              { icon: TrendingUp,label: 'Coût employeur inclus'    },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-300">
                <Icon size={11} className="text-violet-400" />{label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── CORPS ─────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ════════════════════════════════════════════════════════════════
              COLONNE FORMULAIRE
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">

            {/* Identité (optionnel) */}
            <Card>
              <SectionTitle icon={Calculator} label="Identité" color="text-violet-500"
                right={<span className="text-[10px] text-gray-400">optionnel</span>} />
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Prénom</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jean"
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 outline-none focus:border-violet-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nom</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Moukala"
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 outline-none focus:border-violet-400 transition-colors" />
                </div>
              </div>

              {/* Mois / Année */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mois</label>
                  <select value={month} onChange={e => setMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 outline-none cursor-pointer">
                    {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Année</label>
                  <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 outline-none" />
                </div>
              </div>
            </Card>

            {/* Rémunération */}
            <Card>
              <SectionTitle icon={Calculator} label="Rémunération" color="text-emerald-500" />

              <div className="mb-4">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Salaire de base (FCFA) *</label>
                <input type="number" value={baseSalary} onChange={e => setBaseSalary(e.target.value)} placeholder="Ex : 450 000"
                  className="w-full px-3 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-base font-black font-mono bg-white dark:bg-gray-700 outline-none focus:border-violet-400 transition-colors" />
                {Number(baseSalary) > 0 && Number(baseSalary) < SMIG && (
                  <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> Sous le SMIG congolais (70 400 FCFA)</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Jours travaillés <span className="text-gray-400 font-normal">(base {WORK_DAYS} jours)</span>
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <Stepper value={workedDays} onChange={setWorkedDays} />
                  <span className={`text-xs font-bold ${absenceDays > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                    {absenceDays > 0 ? `→ ${absenceDays}j absence` : '✓ Mois complet'}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${(workedDays / WORK_DAYS) * 100}%`, background: absenceDays === 0 ? '#10b981' : '#f97316' }} />
                </div>
              </div>
            </Card>

            {/* Mode fiscal */}
            <Card className="border-cyan-200 dark:border-cyan-800/50">
              <button onClick={() => setShowFiscalPanel(v => !v)}
                className="w-full flex items-center gap-2 cursor-pointer">
                <Percent size={14} className="text-cyan-500" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white flex-1 text-left">Fiscal & cotisations</h3>
                <span className="text-[10px] text-gray-400 mr-1">
                  {fiscalMode === 'ITS_2026' ? 'ITS 2026' : fiscalMode === 'IRPP_LEGACY' ? 'IRPP Ancien' : `Forfait ${Math.round(forfaitRate*100)}%`}
                  {!isForfait && ` · ${marital === 'MARRIED' ? 'Marié' : 'Célibataire'} · ${children} enf.`}
                </span>
                {showFiscalPanel ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </button>

              {showFiscalPanel && (
                <div className="mt-4 space-y-4">
                  {/* Contrat / TOL / résidence */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Type de contrat</label>
                      <select value={contractType} onChange={e => setContractType(e.target.value)}
                        className="w-full px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 outline-none cursor-pointer">
                        <option value="CDI">CDI</option>
                        <option value="CDD">CDD</option>
                        <option value="STAGE">Stage</option>
                        <option value="INTERIM">Intérim</option>
                        <option value="CONSULTANT">Consultant (BNC)</option>
                        <option value="PRESTATAIRE">Prestataire (BNC)</option>
                      </select>
                    </div>
                    {(contractType === 'CDI' || contractType === 'CDD') && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Zone TOL</label>
                        <select value={tolZone} onChange={e => setTolZone(e.target.value as any)}
                          className="w-full px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 outline-none cursor-pointer">
                          <option value="VILLE">Ville — 5 000 F</option>
                          <option value="PERIPHERIE">Périphérie — 1 000 F</option>
                        </select>
                      </div>
                    )}
                    {(contractType === 'CONSULTANT' || contractType === 'PRESTATAIRE') && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Résidence fiscale</label>
                        <select value={isResident ? 'R' : 'N'} onChange={e => setIsResident(e.target.value === 'R')}
                          className="w-full px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 outline-none cursor-pointer">
                          <option value="R">Résident — BNC 10 %</option>
                          <option value="N">Non-résident — BNC 20 %</option>
                        </select>
                      </div>
                    )}
                  </div>
                  {(contractType === 'CDI' || contractType === 'CDD') && (
                    <p className="text-[10px] text-gray-400 -mt-2">La TOL est appliquée automatiquement aux CDI/CDD.</p>
                  )}

                  {/* Toggle CNSS / ITS */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { active: subjectToCnss, toggle: () => setSubjectToCnss(v=>!v), label: 'CNSS', sub: subjectToCnss ? 'Assujetti (4%)' : 'Exonéré', color: 'emerald' },
                      { active: subjectToIts,  toggle: () => setSubjectToIts(v=>!v),  label: 'ITS / IRPP', sub: subjectToIts ? 'Assujetti' : 'Exonéré', color: 'cyan' },
                    ].map(({ active, toggle, label, sub, color }) => (
                      <button key={label} onClick={toggle}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer
                          ${active ? color === 'emerald' ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                        {active
                          ? <Lock size={13} className={color === 'emerald' ? 'text-emerald-600 shrink-0' : 'text-cyan-600 shrink-0'} />
                          : <Unlock size={13} className="text-gray-400 shrink-0" />}
                        <div className="text-left">
                          <p className={`text-xs font-bold ${active ? color === 'emerald' ? 'text-emerald-700 dark:text-emerald-300' : 'text-cyan-700 dark:text-cyan-300' : 'text-gray-400'}`}>{label}</p>
                          <p className="text-[10px] text-gray-400">{sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Mode de calcul */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Mode de calcul ITS</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: 'ITS_2026',    label: 'ITS 2026',    sub: 'Barème officiel', color: 'violet' },
                        { value: 'IRPP_LEGACY', label: 'IRPP Ancien', sub: 'Avant 2026 / parts', color: 'amber' },
                        { value: 'FORFAIT',     label: 'Forfait',     sub: '6 / 8 / 10%', color: 'cyan' },
                      ] as const).map(fm => {
                        const active = fiscalMode === fm.value;
                        const border = active ? fm.color === 'violet' ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20' : fm.color === 'amber' ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300';
                        const tc = active ? fm.color === 'violet' ? 'text-violet-700 dark:text-violet-300' : fm.color === 'amber' ? 'text-amber-700 dark:text-amber-300' : 'text-cyan-700 dark:text-cyan-300' : 'text-gray-600 dark:text-gray-400';
                        return (
                          <button key={fm.value} onClick={() => setFiscalMode(fm.value)}
                            className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${border}`}>
                            <p className={`text-xs font-black ${tc}`}>{fm.label}</p>
                            <p className="text-[10px] text-gray-400">{fm.sub}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Situation familiale — IRPP_LEGACY ou ITS_2026 */}
                  {(fiscalMode === 'IRPP_LEGACY' || fiscalMode === 'ITS_2026') && (
                    <div className={`p-3 rounded-xl border ${fiscalMode === 'IRPP_LEGACY' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800'}`}>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${fiscalMode === 'IRPP_LEGACY' ? 'text-amber-600 dark:text-amber-400' : 'text-violet-600 dark:text-violet-400'}`}>
                        Situation familiale (parts fiscales)
                        {fiscalMode === 'ITS_2026' && <span className="ml-1 font-normal text-gray-400">— maintenu en ITS 2026</span>}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Situation</label>
                          <select value={marital} onChange={e => setMarital(e.target.value)}
                            className="w-full px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 outline-none cursor-pointer">
                            <option value="SINGLE">Célibataire</option>
                            <option value="MARRIED">Marié(e)</option>
                            <option value="DIVORCED">Divorcé(e)</option>
                            <option value="WIDOWED">Veuf / Veuve</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Enfants à charge</label>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setChildren(n => Math.max(0, n-1))}
                              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center cursor-pointer"><Minus size={10} /></button>
                            <span className="w-8 text-center font-black text-sm font-mono">{children}</span>
                            <button onClick={() => setChildren(n => Math.min(10, n+1))}
                              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center cursor-pointer"><Plus size={10} /></button>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">
                            → {calcFiscalParts(marital, children).toFixed(1)} parts
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Forfait */}
                  {fiscalMode === 'FORFAIT' && (
                    <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
                      <label className="block text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-2">Taux forfaitaire</label>
                      <div className="flex gap-2 mb-2">
                        {[0.06, 0.08, 0.10].map(r => (
                          <button key={r} onClick={() => setForfaitRate(r)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${forfaitRate === r ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white dark:bg-gray-700 text-gray-600 border-gray-200 hover:border-cyan-300'}`}>
                            {Math.round(r*100)}%
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} max={40} step={0.5} value={Math.round(forfaitRate*100*10)/10}
                          onChange={e => setForfaitRate(Number(e.target.value)/100)}
                          className="w-20 px-2 py-1.5 border border-cyan-200 dark:border-cyan-700 rounded-lg text-sm font-mono font-bold bg-white dark:bg-gray-700 text-cyan-700 dark:text-cyan-300 outline-none" />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Heures supplémentaires */}
            <Card>
              <SectionTitle icon={Clock} label="Heures supplémentaires"
                color="text-orange-500"
                right={<span className="text-[10px] text-gray-400">Décret 78-360</span>} />
              <OtRow label="+10%"  sub="5 premières heures"   value={ot10}  onChange={setOt10} />
              <OtRow label="+25%"  sub="Heures suivantes"     value={ot25}  onChange={setOt25} />
              <OtRow label="+50%"  sub="Nuit / repos / férié" value={ot50}  onChange={setOt50} />
              <OtRow label="+100%" sub="Nuit dim. / férié"    value={ot100} onChange={setOt100} />
            </Card>

            {/* Primes */}
            <Card>
              <SectionTitle icon={Gift} label="Primes & éléments variables" color="text-cyan-500"
                right={
                  <button onClick={addBonus}
                    className="flex items-center gap-1 px-2.5 py-1 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 cursor-pointer">
                    <Plus size={10} /> Ajouter
                  </button>
                } />
              {bonuses.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">Aucune prime ajoutée</p>
              ) : (
                <div className="space-y-2.5">
                  {bonuses.map(b => (
                    <div key={b.localId} className="space-y-1.5">
                      <div className="flex gap-2 items-center">
                        <input placeholder="Libellé" value={b.label}
                          onChange={e => setBonuses(p => p.map(x => x.localId === b.localId ? { ...x, label: e.target.value } : x))}
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 outline-none" />
                        <input type="number" placeholder="Montant" value={b.amount || ''}
                          onChange={e => setBonuses(p => p.map(x => x.localId === b.localId ? { ...x, amount: Number(e.target.value) } : x))}
                          className="w-28 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-mono bg-white dark:bg-gray-700 outline-none" />
                        <button onClick={() => rmBonus(b.localId)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 cursor-pointer">
                          <Trash2 size={12} className="text-red-500" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] text-gray-400">Nature :</span>
                        <select value={bonusCategoryOf(b)}
                          onChange={e => {
                            const v = e.target.value;
                            setBonuses(p => p.map(x => x.localId === b.localId
                              ? { ...x, isTaxable: v !== 'NON_TAXABLE', isCnss: v === 'TAXABLE_CNSS' } : x));
                          }}
                          className="flex-1 px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 outline-none cursor-pointer">
                          <option value="TAXABLE_CNSS">Prime imposable + CNSS</option>
                          <option value="TAXABLE_NO_CNSS">Prime imposable, sans CNSS</option>
                          <option value="NON_TAXABLE">Indemnité non imposable (versée au net)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Avances */}
            <Card className="border-purple-200 dark:border-purple-800/50">
              <SectionTitle icon={CreditCard} label="Avances & Prêts" color="text-purple-500"
                right={
                  <button onClick={addAdvance}
                    className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-100 cursor-pointer">
                    <Plus size={10} /> Ajouter
                  </button>
                } />
              <p className="text-[10px] text-gray-400 mb-2">Déduites du net à payer</p>
              {advances.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">Aucune avance</p>
              ) : (
                <div className="space-y-2">
                  {advances.map(a => (
                    <div key={a.localId} className="flex gap-2 items-center">
                      <input placeholder="Libellé" value={a.label}
                        onChange={e => setAdvances(p => p.map(x => x.localId === a.localId ? { ...x, label: e.target.value } : x))}
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 outline-none" />
                      <input type="number" placeholder="Montant" value={a.amount || ''}
                        onChange={e => setAdvances(p => p.map(x => x.localId === a.localId ? { ...x, amount: Number(e.target.value) } : x))}
                        className="w-28 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-mono bg-white dark:bg-gray-700 outline-none" />
                      <button onClick={() => rmAdvance(a.localId)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 cursor-pointer">
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Taxes custom (CAMU, TOL, etc.) */}
            <Card className="border-rose-200 dark:border-rose-800/50">
              <SectionTitle icon={Percent} label="Taxes personnalisées" color="text-rose-500"
                right={
                  <button onClick={() => setShowAddTax(v => !v)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 cursor-pointer">
                    <Plus size={10} /> {showAddTax ? 'Annuler' : 'Ajouter une taxe'}
                  </button>
                } />
              <p className="text-[10px] text-gray-400 mb-3">Taxes propres à l'entreprise (ex. CAMU). La TOL est déjà incluse automatiquement pour les CDI/CDD.</p>

              {/* Taxes existantes */}
              {customTaxes.length > 0 && (
                <div className="space-y-2 mb-3">
                  {customTaxes.map(t => (
                    <div key={t.localId} className="flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-900/10 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs text-rose-700 dark:text-rose-300">{t.name}</span>
                        <span className="text-[10px] text-gray-400 ml-2 font-mono">{t.code}</span>
                        <p className="text-[10px] text-gray-400">
                          Sal {(t.employeeRate*100).toFixed(2)}% / Pat {(t.employerRate*100).toFixed(2)}%
                          {t.hasCeiling && ` · plaf. ${fmt(t.ceiling)} F`}
                        </p>
                      </div>
                      <button onClick={() => setCustomTaxes(p => p.filter(x => x.localId !== t.localId))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 cursor-pointer">
                        <Trash2 size={11} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulaire ajout taxe */}
              {showAddTax && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Nom *</label>
                      <input value={newTax.name} onChange={e => setNewTax(p => ({...p, name: e.target.value}))} placeholder="CAMU"
                        className="w-full px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Code *</label>
                      <input value={newTax.code} onChange={e => setNewTax(p => ({...p, code: e.target.value.toUpperCase()}))} placeholder="CAMU"
                        className="w-full px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-mono bg-white dark:bg-gray-700 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Taux salarié (%)</label>
                      <input type="number" min={0} max={100} step={0.01} value={newTax.employeeRate ? (newTax.employeeRate*100) : ''}
                        onChange={e => setNewTax(p => ({...p, employeeRate: Number(e.target.value)/100}))} placeholder="2.27"
                        className="w-full px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-mono bg-white dark:bg-gray-700 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Taux patronal (%)</label>
                      <input type="number" min={0} max={100} step={0.01} value={newTax.employerRate ? (newTax.employerRate*100) : ''}
                        onChange={e => setNewTax(p => ({...p, employerRate: Number(e.target.value)/100}))} placeholder="4.55"
                        className="w-full px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-mono bg-white dark:bg-gray-700 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Base de calcul</label>
                      <select value={newTax.baseType} onChange={e => setNewTax(p => ({...p, baseType: e.target.value}))}
                        className="w-full px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 outline-none cursor-pointer">
                        <option value="GROSS">Brut</option>
                        <option value="TAXABLE">Brut − CNSS</option>
                        <option value="NET_IMPOSABLE">Net imposable</option>
                        <option value="FIXED">Montant fixe</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Montant fixe salarié (F)</label>
                      <input type="number" min={0} value={newTax.fixedEmployee || ''} onChange={e => setNewTax(p => ({...p, fixedEmployee: Number(e.target.value)}))} placeholder="0"
                        className="w-full px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-mono bg-white dark:bg-gray-700 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Seuil de salaire (F)</label>
                      <input type="number" min={0} value={newTax.minSalaryThreshold || ''} onChange={e => setNewTax(p => ({...p, minSalaryThreshold: Number(e.target.value)}))} placeholder="500 000"
                        className="w-full px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-mono bg-white dark:bg-gray-700 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Le seuil sert à…</label>
                      <select value={newTax.thresholdType} onChange={e => setNewTax(p => ({...p, thresholdType: e.target.value}))}
                        className="w-full px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 outline-none cursor-pointer">
                        <option value="ELIGIBILITY">Déclencher la taxe</option>
                        <option value="EXCESS_ONLY">Taxer l'excédent seulement</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setNewTax(p => ({...p, hasCeiling: !p.hasCeiling}))}
                      className={`w-9 h-5 rounded-full transition-all cursor-pointer relative ${newTax.hasCeiling ? 'bg-rose-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${newTax.hasCeiling ? 'left-4' : 'left-0.5'}`} />
                    </button>
                    <span className="text-xs text-gray-500">Plafond</span>
                    {newTax.hasCeiling && (
                      <input type="number" value={newTax.ceiling} onChange={e => setNewTax(p => ({...p, ceiling: Number(e.target.value)}))} placeholder="600 000"
                        className="flex-1 px-2 py-1.5 border border-rose-200 dark:border-rose-700 rounded-lg text-xs font-mono bg-white dark:bg-gray-700 outline-none" />
                    )}
                  </div>
                  <button onClick={addCustomTax} disabled={!newTax.name || !newTax.code}
                    className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer transition-colors">
                    <Plus size={12} /> Ajouter cette taxe
                  </button>
                </div>
              )}

              {customTaxes.length === 0 && !showAddTax && (
                <p className="text-xs text-gray-400 text-center py-2">Aucune taxe ajoutée</p>
              )}
            </Card>

            {/* Bouton simuler */}
            <button onClick={handleSimulate} disabled={!canSimulate}
              className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all duration-200 shadow-lg
                ${canSimulate
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-500/25 cursor-pointer hover:scale-[1.01]'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
              <Play size={18} />
              Calculer le salaire net
            </button>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              COLONNE RÉSULTATS
          ═══════════════════════════════════════════════════════════════════ */}
          <div id="sim-result">
            {!result ? (
              <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-16 text-center sticky top-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                  <Calculator size={28} className="text-violet-300" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white mb-1">Prêt à calculer</p>
                <p className="text-sm text-gray-400">Renseignez le salaire et cliquez sur<br/>« Calculer le salaire net »</p>
              </div>
            ) : (
              <div className="space-y-4 sticky top-6">

                {/* NET À PAYER */}
                <div className="bg-gray-900 dark:bg-black rounded-2xl p-5 text-white">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Net à payer</p>
                      <p className="text-4xl font-black font-mono tracking-tight">
                        {fmt(result.netSalary)}
                        <span className="text-base font-normal text-gray-400 ml-2">FCFA</span>
                      </p>
                    </div>
                    <button onClick={handleCopy}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer
                        ${copied ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                      {copied ? <><Check size={12} /> Copié !</> : <><Copy size={12} /> Copier</>}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {[firstName, lastName].filter(Boolean).join(' ') || 'Anonyme'}
                    {' · '}{MONTHS[month-1]} {year}
                    {' · '}{workedDays}/{WORK_DAYS} jours
                    {result.irppDetails?.fiscalParts > 1 && ` · ${result.irppDetails.fiscalParts} parts`}
                  </p>
                </div>

                {/* DÉTAIL DU BULLETIN — même composant que l'application */}
                <PayslipBreakdown result={result} defaultOpenEmployer />

                {/* DÉTAIL ITS */}
                {!result.isBncWorker && result.irppDetails?.fiscalParts && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                    <button onClick={() => setShowItsDetail(d => !d)}
                      className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer">
                      <span>Détail du calcul {isForfait ? 'forfait' : isLegacy ? 'IRPP' : 'ITS'}</span>
                      {showItsDetail ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showItsDetail && (
                      <div className="px-4 pb-4 text-xs text-gray-500 space-y-1.5">
                        {!isForfait && <p>Base imposable (brut − CNSS) : <span className="font-mono font-bold">{fmt(result.irppDetails.baseImposable)} F</span></p>}
                        {!isForfait && <p>Abattement {isLegacy ? '30 %' : '20 %'} : <span className="font-mono font-bold">−{fmt(result.irppDetails.abattement)} F</span></p>}
                        {!isForfait && <p>Revenu net imposable : <span className="font-mono font-bold">{fmt(result.irppDetails.revenuNetImposable)} F</span></p>}
                        <p>Parts fiscales : <span className="font-bold">{result.irppDetails.fiscalParts}</span></p>
                        {!isForfait && result.irppDetails.revenuParPart != null && <p>Revenu annuel par part : <span className="font-mono font-bold">{fmt(result.irppDetails.revenuParPart)} F</span></p>}
                        {Array.isArray(result.irppDetails.details) && result.irppDetails.details.map((d: any, i: number) => (
                          <p key={i} className="pl-2">{d.tranche} · {d.taux}% sur {fmt(d.base)} F = <span className="font-mono font-bold">{fmt(d.montant)} F</span></p>
                        ))}
                        <p>Taux effectif : <span className="font-bold">{result.irppDetails.effectiveRate}%</span></p>
                      </div>
                    )}
                  </div>
                )}

                {/* CTA konza */}
                <div className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl border border-violet-200 dark:border-violet-800">
                  <p className="font-bold text-sm text-gray-900 dark:text-white mb-1">Gérez la paie de toute votre équipe</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Bulletins PDF · Déclarations CNSS · CAMU · Contrats · Congés · Pointage</p>
                  <a href="https://app.konza-rh.cg" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl text-sm hover:from-violet-700 hover:to-indigo-700 transition-all">
                    Essayer Konza gratuitement <ArrowRight size={14} />
                  </a>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* ── FAQ SEO ─────────────────────────────────────────────────────── */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6">Calcul de salaire net Congo-Brazzaville — Guide 2026</h2>
          <div className="space-y-4">
            {[
              {
                q: "Comment calculer le salaire net au Congo-Brazzaville en 2026 ?",
                a: "Le salaire net s'obtient en soustrayant du salaire brut : la CNSS salariale (4%, plafonnée à 1 200 000 FCFA), et l'ITS (barème progressif 2026 : 0% + 1 200 FCFA fixe jusqu'à 615 000 FCFA, 10% jusqu'à 1 500 000, 15% jusqu'à 3 500 000, 20% jusqu'à 5 000 000, 30% au-delà). Un abattement de 20% est appliqué avant le calcul de l'ITS."
              },
              {
                q: "Qu'est-ce que l'ITS 2026 au Congo ?",
                a: "L'ITS (Impôt sur les Traitements et Salaires) remplace l'IRPP depuis le 1er janvier 2026 en vertu de l'Ordonnance n°2025-44 du 31 décembre 2025. Il s'applique à un barème progressif à 5 tranches sur le revenu net imposable annualisé. Le quotient familial (parts fiscales) est maintenu : de 1 part (célibataire) à 6,5 parts maximum."
              },
              {
                q: "Quel est le coût total d'un employé pour l'employeur au Congo ?",
                a: "En plus du salaire brut, l'employeur verse : CNSS patronale pensions 8% (plaf. 1 200 000 FCFA), CNSS prestations familiales 10,03% (plaf. 600 000 FCFA), CNSS accidents du travail 2,25% (plaf. 600 000 FCFA), et TUS 7,5% (2,025% pour la DGI + 5,475% pour la CNSS). Soit environ 27% de charges patronales supplémentaires sur le brut."
              },
              {
                q: "Comment fonctionne la CAMU au Congo-Brazzaville ?",
                a: "La CAMU (Caisse d'Assurance Maladie Universelle) prélève 2,27% sur le salaire brut à la charge du salarié et 4,55% à la charge de l'employeur, avec un plafond d'assiette de 600 000 FCFA. Elle est configurable dans ce simulateur via le bouton « CAMU, TOL… »."
              },
              {
                q: "Quel est le SMIG au Congo-Brazzaville en 2026 ?",
                a: "Le SMIG (Salaire Minimum Interprofessionnel Garanti) est fixé à 70 400 FCFA par mois au Congo-Brazzaville."
              },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-bold text-sm text-gray-900 dark:text-white list-none">
                  {q}
                  <ChevronDown size={16} className="text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-3" />
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-3">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 py-8 px-4 text-center">
        <p className="text-xs text-gray-400">
          Simulateur gratuit · <span className="font-bold text-gray-600 dark:text-gray-300">konza-rh.cg</span> · Logiciel RH & Paie Congo-Brazzaville
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> · </span>
          Conforme Ordonnance n°2025-44 · ITS 2026 · CNSS · TUS · CAMU
        </p>
        <p className="text-[10px] text-gray-400 mt-2">
          Ce simulateur est fourni à titre indicatif. Pour toute décision fiscale, consultez un expert-comptable.
        </p>
      </footer>
    </div>
  );
}