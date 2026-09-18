'use client';

// ============================================================================
// app/(dashboard)/paie/[id]/modifier/page.tsx
// Page d'édition d'un bulletin existant — même UX que la paie manuelle
// Charge toutes les données du bulletin et permet de les modifier
// Le calculateur recalcule en temps réel avant de sauvegarder
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Loader2, CheckCircle2,
  Calculator, AlertCircle, ChevronDown, ChevronUp,
  Building2, CreditCard, Wallet, Save, History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Row {
  localId: string;
  label:   string;
  base:    number | '';
  rate:    number | '';
  amount:  number;
}

interface ManualDeduction {
  localId: string;
  label:   string;
  amount:  number | '';
}

interface SimResult {
  employee:         { id: string; firstName: string; lastName: string; baseSalary: number; effectiveBaseSalary: number; isSubjectToCnss: boolean; isSubjectToIrpp: boolean };
  month:            number; year: number; daysToPay: number; workDays: number;
  absenceDeduction: number;
  overtime:         { hours10: number; amount10: number; hours25: number; amount25: number; hours50: number; amount50: number; hours100: number; amount100: number; total: number };
  bonuses:          Array<{ bonusType: string; amount: number }>;
  adjustedBaseSalary: number; grossSalary: number;
  cnssSalarial:     number; its: number; totalDeductions: number; netSalary: number;
  cnssEmployerPension: number; cnssEmployerFamily: number; cnssEmployerAccident: number;
  tusDgiAmount:     number; tusCnssAmount: number; totalEmployerCost: number;
  loans:            any[]; advances: any[];
  totalLoanDeduction: number; totalAdvanceDeduction: number;
  settings:         { cnssSalarialRate: number; overtimeRate10: number; overtimeRate25: number; overtimeRate50: number; overtimeRate100: number };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const ALL_PRIME_LABELS = [
  "Prime d'ancienneté","Prime d'assiduité","Prime de confiance","Prime de garde",
  "Prime de motivation","Prime de précaire","Prime de responsabilité","Prime de risque",
  "Prime de base congé","Prime de diplôme","Prime de technicité","Prime de rendement",
  "Prime de résultat","Prime de fin d'année","Prime de performance","Prime exceptionnelle",
  "Prime de poste","Prime de nuit","Prime de dimanche","Prime de caisse",
  "Gratification","13ème mois","Prime d'intéressement",
];

const ALL_INDEM_LABELS = [
  "Indemnité de transport","Indemnité de logement","Indemnité de panier",
  "Indemnité kilométrique","Indemnité de représentation","Indemnité vestimentaire",
  "Indemnité de déplacement","Indemnité de téléphone","Indemnité de salissure",
  "Indemnité de fonction","Indemnité de stage","Indemnité d'expatriation",
];

const uid  = () => Math.random().toString(36).slice(2, 9);
const fmt  = (v: number) => Math.round(v || 0).toLocaleString('fr-FR');
const n    = (v: number | '') => Number(v) || 0;

// ─── Micro-composants ────────────────────────────────────────────────────────

const SLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">{children}</label>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon, title, subtitle, total, color }: {
  icon: React.ReactNode; title: string; subtitle: string; total?: number; color: string;
}) => (
  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{title}</p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{subtitle}</p>
    </div>
    {total != null && total > 0 && (
      <span className="text-sm font-mono font-bold text-gray-600 dark:text-gray-300 shrink-0">{fmt(total)} F</span>
    )}
  </div>
);

const BLine = ({ label, value, cls, sm }: { label: string; value: string; cls?: string; sm?: boolean }) => (
  <div className={`flex items-center justify-between ${sm ? 'py-0.5' : 'py-1.5'}`}>
    <span className={`${sm ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>{label}</span>
    <span className={`font-mono font-bold tabular-nums ${sm ? 'text-xs' : 'text-sm'} ${cls ?? 'text-gray-700 dark:text-gray-200'}`}>{value}</span>
  </div>
);

// ─── LabelInput — autocomplete contextuel ────────────────────────────────────

const LabelInput = ({ value, onChange, placeholder, suggestions, className = '' }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; suggestions: string[]; className?: string;
}) => {
  const [open, setOpen]   = React.useState(false);
  const [query, setQuery] = React.useState(value);
  const ref               = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { setQuery(value); }, [value]);
  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = query.length >= 1
    ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const handleChange = (v: string) => { setQuery(v); onChange(v); setOpen(true); };
  const handleSelect = (s: string) => { setQuery(s); onChange(s); setOpen(false); };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input type="text" value={query} onChange={e => handleChange(e.target.value)}
        onFocus={() => query.length >= 1 && setOpen(true)} placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 placeholder:text-gray-300" />
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="absolute z-[999] left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
            {filtered.map(s => {
              const idx = s.toLowerCase().indexOf(query.toLowerCase());
              return (
                <button key={s} onMouseDown={() => handleSelect(s)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                  {idx === -1 ? s : <>{s.slice(0, idx)}<span className="font-bold text-emerald-600 dark:text-emerald-400">{s.slice(idx, idx + query.length)}</span>{s.slice(idx + query.length)}</>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── InputRow ────────────────────────────────────────────────────────────────

const InputRow = ({ row, onChangeLabel, onChangeBase, onChangeRate, onRemove, placeholder = 'Libellé…', suggestions = [] }: {
  row: Row; onChangeLabel: (v: string) => void; onChangeBase: (v: number | '') => void;
  onChangeRate: (v: number | '') => void; onRemove: () => void; placeholder?: string; suggestions?: string[];
}) => (
  <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
    className="group grid grid-cols-[1fr_100px_70px_90px_28px] gap-2 items-center">
    <LabelInput value={row.label} onChange={onChangeLabel} placeholder={placeholder} suggestions={suggestions} />
    <div className="relative">
      <input type="number" value={row.base} onChange={e => onChangeBase(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Base"
        className="w-full pl-2 pr-5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-right text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/30" />
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">F</span>
    </div>
    <input type="number" value={row.rate} step="0.01" onChange={e => onChangeRate(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Taux"
      className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-center text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/30" />
    <div className={`px-2 py-2 rounded-xl text-sm font-black font-mono text-right tabular-nums border transition-colors ${row.amount > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700' : 'bg-gray-50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-700/50 text-gray-300'}`}>
      {row.amount > 0 ? row.amount.toLocaleString('fr-FR') : '—'}
    </div>
    <button onClick={onRemove} className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
      <Trash2 size={13} />
    </button>
  </motion.div>
);

const SimpleRow = ({ row, onChangeLabel, onChangeAmount, onRemove, placeholder = 'Libellé…' }: {
  row: Row; onChangeLabel: (v: string) => void; onChangeAmount: (v: number | '') => void;
  onRemove: () => void; placeholder?: string;
}) => (
  <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
    className="group flex items-center gap-2">
    <input type="text" value={row.label} onChange={e => onChangeLabel(e.target.value)} placeholder={placeholder}
      className="flex-1 min-w-0 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/30" />
    <div className="relative w-32 shrink-0">
      <input type="number" value={row.amount || ''} onChange={e => onChangeAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0"
        className="w-full pl-3 pr-5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-right text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/30" />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">F</span>
    </div>
    <button onClick={onRemove} className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0">
      <Trash2 size={13} />
    </button>
  </motion.div>
);

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ModifierBulletinPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { bp } = useBasePath();

  // ── Chargement ──────────────────────────────────────────────────────────────
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [empName, setEmpName]   = useState('');
  const [month, setMonth]       = useState('');
  const [year, setYear]         = useState(0);
  const [employeeId, setEmployeeId] = useState('');
  const [baseSalary, setBaseSalary] = useState(0);

  // ── Champs formulaire ────────────────────────────────────────────────────────
  const [workedDays, setWorkedDays] = useState<number | ''>(26);
  const [ot10, setOt10]   = useState<number | ''>(0);
  const [ot25, setOt25]   = useState<number | ''>(0);
  const [ot50, setOt50]   = useState<number | ''>(0);
  const [ot100, setOt100] = useState<number | ''>(0);

  const [primes, setPrimes]         = useState<Row[]>([]);
  const [indemnites, setIndemnites] = useState<Row[]>([]);
  const [retenues, setRetenues]     = useState<ManualDeduction[]>([]);

  const [congesDroits, setCongesDroits]     = useState<number | ''>('');
  const [congesPris, setCongesPris]         = useState<number | ''>('');
  const [congesSolde, setCongesSolde]       = useState<number | ''>('');
  const [joursCongesPris, setJoursCongesPris] = useState<number | ''>('');

  // ✅ Cumul annuel brut — modifiable, pré-rempli avec le cumul ACTUEL du
  // bulletin (payroll.ytd.grossSalary). Net imposable / charges sal / charges
  // pat sont recalculés automatiquement à partir du brut par le back — pas
  // besoin de les saisir séparément.
  const [cumulBrut, setCumulBrut]           = useState<number | ''>('');
  const [cumulBrutOriginal, setCumulBrutOriginal] = useState<number>(0);

  // ── Sim ─────────────────────────────────────────────────────────────────────
  const [sim, setSim]               = useState<SimResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError]     = useState<string | null>(null);
  const [showEmpCost, setShowEmpCost] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved]           = useState(false);

  // ── Chargement initial du bulletin ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const payroll: any = await api.get(`/payrolls/${params.id}`);
        if (!payroll) { setNotFound(true); return; }

        // Infos de base
        setEmpName(`${payroll.employee?.firstName ?? ''} ${payroll.employee?.lastName ?? ''}`.trim());
        setMonth(MONTHS[(payroll.month ?? 1) - 1]);
        setYear(payroll.year ?? new Date().getFullYear());
        setEmployeeId(payroll.employee?.id ?? '');
        setBaseSalary(Number(payroll.baseSalary ?? payroll.employee?.baseSalary ?? 0));

        // Jours travaillés
        setWorkedDays(payroll.workedDays ?? payroll.workDays ?? 26);

        // Heures sup
        setOt10(Number(payroll.overtimeHours10  ?? 0));
        setOt25(Number(payroll.overtimeHours25  ?? 0));
        setOt50(Number(payroll.overtimeHours50  ?? 0));
        setOt100(Number(payroll.overtimeHours100 ?? 0));

        // Extraire primes depuis les items (GAIN isTaxable, hors SAL_BASE et INDEM_CONGE)
        const items: any[] = payroll.items ?? [];

        const extractedPrimes: Row[] = items
          .filter(i => i.type === 'GAIN' && i.isTaxable && !['SAL_BASE','INDEM_CONGE','ABS_DEDUCT','ABS_CONGE'].includes(i.code))
          .map(i => ({
            localId: uid(),
            label:   i.label ?? '',
            base:    i.base     ? Number(i.base)     : '',
            rate:    i.quantity ? Number(i.quantity)  : (i.rate ? Number(i.rate) : 1),
            amount:  Number(i.amount ?? 0),
          }));
        if (extractedPrimes.length > 0) setPrimes(extractedPrimes);

        // Indemnités (GAIN !isTaxable && !isCnss)
        const extractedIndem: Row[] = items
          .filter(i => i.type === 'GAIN' && !i.isTaxable && !i.isCnss)
          .map(i => ({
            localId: uid(),
            label:   i.label ?? '',
            base:    i.base     ? Number(i.base)     : '',
            rate:    i.quantity ? Number(i.quantity)  : (i.rate ? Number(i.rate) : 1),
            amount:  Number(i.amount ?? 0),
          }));
        if (extractedIndem.length > 0) setIndemnites(extractedIndem);

        // Retenues libres (MANUAL_DEDUCTION)
        const extractedRet: ManualDeduction[] = items
          .filter(i => i.code === 'MANUAL_DEDUCTION')
          .map(i => ({
            localId: uid(),
            label:   i.label ?? '',
            amount:  Number(i.amount ?? 0),
          }));
        if (extractedRet.length > 0) setRetenues(extractedRet);

        // Congés — depuis le cumul YTD calculé par le back (ytd.droitsConge /
        // priseConge / soldeConge). ⚠️ Ne PAS lire payroll.congesDroits — ce
        // champ n'existe pas sur le modèle Payroll, il était toujours undefined
        // ici avant ce fix, donc les congés ne se pré-remplissaient jamais.
        if (payroll.ytd?.droitsConge != null) setCongesDroits(Number(payroll.ytd.droitsConge));
        if (payroll.ytd?.priseConge  != null) setCongesPris(Number(payroll.ytd.priseConge));
        if (payroll.ytd?.soldeConge  != null) setCongesSolde(Number(payroll.ytd.soldeConge));

        // ✅ Cumul brut actuel — pré-rempli pour permettre une correction manuelle
        const currentCumulBrut = Number(payroll.ytd?.grossSalary ?? 0);
        setCumulBrut(currentCumulBrut);
        setCumulBrutOriginal(currentCumulBrut);

      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  // ── Helpers rows ─────────────────────────────────────────────────────────────
  const newRow = (): Row => ({ localId: uid(), label: '', base: '', rate: 1, amount: 0 });

  const updateRow = (set: React.Dispatch<React.SetStateAction<Row[]>>, localId: string, patch: Partial<Row>) =>
    set(prev => prev.map(r => {
      if (r.localId !== localId) return r;
      const next = { ...r, ...patch };
      next.amount = Math.round((Number(next.base) || 0) * (Number(next.rate) || 0));
      return next;
    }));

  const removeRow = (set: React.Dispatch<React.SetStateAction<Row[]>>, localId: string) =>
    set(prev => prev.filter(r => r.localId !== localId));

  // ── Simulateur ───────────────────────────────────────────────────────────────
  const buildBonusPayload = (rows: Row[], taxable: boolean) =>
    rows.filter(r => n(r.amount) > 0).map(r => ({
      bonusType:  r.label || (taxable ? 'Prime' : 'Indemnité'),
      amount:     r.amount,
      base:       n(r.base) > 0 ? n(r.base) : r.amount,
      rate:       n(r.rate) > 0 ? n(r.rate) : (n(r.base) > 0 ? 1 : undefined),
      isTaxable:  taxable,
      isCnss:     taxable,
      fiscalType: taxable ? 'TAXABLE_CNSS' : 'NON_TAXABLE',
    }));

  useEffect(() => {
    if (!employeeId || !baseSalary) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runSim, 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primes, indemnites, workedDays, ot10, ot25, ot50, ot100, retenues, employeeId, baseSalary]);

  const runSim = async () => {
    if (!employeeId || !baseSalary) return;
    setSimLoading(true); setSimError(null);
    try {
      const monthNum = MONTHS.findIndex(m => m === month) + 1;
      const result = await api.post<SimResult>('/payrolls/simulate', {
        employeeId,
        month:            monthNum,
        year,
        workedDays:       n(workedDays) || 26,
        baseSalary,
        overtimeHours10:  n(ot10),
        overtimeHours25:  n(ot25),
        overtimeHours50:  n(ot50),
        overtimeHours100: n(ot100),
        manualBonuses:    [...buildBonusPayload(primes, true), ...buildBonusPayload(indemnites, false)],
        manualDeductions: retenues.filter(r => n(r.amount) > 0).map(r => ({ label: r.label || 'Retenue', amount: n(r.amount) })),
      });
      setSim(result);
    } catch (e: any) {
      setSimError(e?.response?.data?.message || e?.message || 'Erreur simulation');
      setSim(null);
    } finally {
      setSimLoading(false);
    }
  };

  // ── Sauvegarde ───────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!sim || !employeeId) return;
    setSubmitting(true);
    try {
      const monthNum = MONTHS.findIndex(m => m === month) + 1;
      await api.patch(`/payrolls/${params.id}`, {
        workedDays:       n(workedDays) || 26,
        baseSalary,
        overtimeHours10:  n(ot10),
        overtimeHours25:  n(ot25),
        overtimeHours50:  n(ot50),
        overtimeHours100: n(ot100),
        manualBonuses:    [...buildBonusPayload(primes, true), ...buildBonusPayload(indemnites, false)],
        manualDeductions: retenues.filter(r => n(r.amount) > 0).map(r => ({ label: r.label || 'Retenue', amount: n(r.amount) })),
        congesDroits:     n(congesDroits) || undefined,
        congesPris:       n(congesPris)   || undefined,
        congesSolde:      n(congesSolde)  || undefined,
        joursCongesPris:  n(joursCongesPris) || undefined,
        // ✅ Correction manuelle du cumul brut — envoyée seulement si modifiée.
        // Le back recalcule net imposable / charges sal / charges pat à partir
        // de ce brut (proportionnellement, via les taux du bulletin recalculé).
        cumulBrutOverride:
          n(cumulBrut) !== cumulBrutOriginal ? n(cumulBrut) : undefined,
        // ✅ Recalculés par le back depuis les manualBonuses
        month:            monthNum,
        year,
      });
      setSaved(true);
      setTimeout(() => router.push(bp(`/paie/${params.id}`)), 1500);
    } catch (e: any) {
      alert(`Erreur : ${e?.response?.data?.message || e?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Totaux ───────────────────────────────────────────────────────────────────
  const totalPrimes     = primes.reduce((s, r) => s + r.amount, 0);
  const totalIndemnites = indemnites.reduce((s, r) => s + r.amount, 0);
  const totalRetenues   = retenues.reduce((s, r) => s + n(r.amount), 0);

  // ── États de chargement ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500" size={32} />
    </div>
  );

  if (notFound) return (
    <div className="p-8 text-center">
      <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
      <p className="text-gray-500 mb-4">Bulletin introuvable ou non modifiable</p>
      <button onClick={() => router.back()} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold">Retour</button>
    </div>
  );

  return (
    <div className="max-w-[1380px] mx-auto pb-28 px-4 pt-1">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-7">
        <button onClick={() => router.back()}
          className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors shrink-0">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[var(--text)]">Modifier le bulletin</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase tracking-wide">Édition</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {empName} — {month} {year}
          </p>
        </div>
      </div>

      {/* ── Bandeau infos bulletin ── */}
      <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
        <History size={16} className="text-amber-500 shrink-0" />
        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
          Les données du bulletin <strong>{month} {year}</strong> ont été chargées. Modifiez les éléments puis confirmez pour recalculer et sauvegarder.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">

        {/* ════ COL GAUCHE ════ */}
        <div className="lg:col-span-3 space-y-4">

          {/* ── Jours travaillés ── */}
          <Card className="p-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Temps de travail</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <SLabel>Jours travaillés</SLabel>
                <div className="flex items-center gap-3">
                  <input type="number" min={0} max={31} value={workedDays}
                    onChange={e => setWorkedDays(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-center text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                  <span className="text-xs text-gray-400">jours</span>
                </div>
              </div>
            </div>

            {/* Heures supplémentaires */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 mt-5">Heures supplémentaires</p>
            <div className="grid grid-cols-4 gap-3">
              {([
                { label:'+10%',  v:ot10,  set:setOt10,  col:'text-amber-500',  ring:'focus:ring-amber-400/30' },
                { label:'+25%',  v:ot25,  set:setOt25,  col:'text-amber-500', ring:'focus:ring-amber-400/30' },
                { label:'+50%',  v:ot50,  set:setOt50,  col:'text-amber-500',   ring:'focus:ring-amber-400/30' },
                { label:'+100%', v:ot100, set:setOt100, col:'text-amber-500',    ring:'focus:ring-amber-400/30' },
              ] as const).map(({ label, v, set, col, ring }) => (
                <div key={label} className="text-center">
                  <label className={`block text-xs font-bold mb-1.5 ${col}`}>{label}</label>
                  <div className="relative">
                    <input type="number" min={0} value={v}
                      onChange={e => set(e.target.value === '' ? 0 : Number(e.target.value) as any)}
                      className={`w-full pl-2 pr-5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-center text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 ${ring}`} />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">h</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Primes ── */}
          <Card className="overflow-visible">
            <SectionHeader
              icon={<span className="text-amber-600 dark:text-amber-400 text-xs font-black">%</span>}
              title="Primes"
              subtitle="Soumises à CNSS et ITS"
              total={totalPrimes}
              color="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-600"
            />
            <div className="px-5 py-4 space-y-2">
              <div className="grid grid-cols-[1fr_100px_70px_90px_28px] gap-2 px-1 mb-1">
                {['Libellé','Base (F)','Taux','Gain (F)',''].map((h, i) => (
                  <span key={i} className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide ${i===3?'text-right':''}`}>{h}</span>
                ))}
              </div>
              <AnimatePresence initial={false}>
                {primes.map(row => (
                  <InputRow key={row.localId} row={row}
                    placeholder="Ex : Prime d'ancienneté, de rendement…"
                    suggestions={ALL_PRIME_LABELS}
                    onChangeLabel={v => updateRow(setPrimes, row.localId, { label: v })}
                    onChangeBase={v => updateRow(setPrimes, row.localId, { base: v })}
                    onChangeRate={v => updateRow(setPrimes, row.localId, { rate: v })}
                    onRemove={() => removeRow(setPrimes, row.localId)} />
                ))}
              </AnimatePresence>
              <button onClick={() => setPrimes(p => [...p, newRow()])}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors mt-1">
                <Plus size={11} /> Ajouter une prime
              </button>
            </div>
          </Card>

          {/* ── Indemnités ── */}
          <Card className="overflow-visible">
            <SectionHeader
              icon={<span className="text-emerald-600 dark:text-emerald-400 text-xs font-black">≠</span>}
              title="Indemnités"
              subtitle="Non soumises à CNSS ni ITS"
              total={totalIndemnites}
              color="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600"
            />
            <div className="px-5 py-4 space-y-2">
              <div className="grid grid-cols-[1fr_100px_70px_90px_28px] gap-2 px-1 mb-1">
                {['Libellé','Base (F)','Taux','Gain (F)',''].map((h, i) => (
                  <span key={i} className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide ${i===3?'text-right':''}`}>{h}</span>
                ))}
              </div>
              <AnimatePresence initial={false}>
                {indemnites.map(row => (
                  <InputRow key={row.localId} row={row}
                    placeholder="Ex : Indemnité de transport, de logement…"
                    suggestions={ALL_INDEM_LABELS}
                    onChangeLabel={v => updateRow(setIndemnites, row.localId, { label: v })}
                    onChangeBase={v => updateRow(setIndemnites, row.localId, { base: v })}
                    onChangeRate={v => updateRow(setIndemnites, row.localId, { rate: v })}
                    onRemove={() => removeRow(setIndemnites, row.localId)} />
                ))}
              </AnimatePresence>
              <button onClick={() => setIndemnites(p => [...p, newRow()])}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors mt-1">
                <Plus size={11} /> Ajouter une indemnité
              </button>
            </div>
          </Card>

          {/* ── Autres retenues ── */}
          <Card className="overflow-hidden">
            <SectionHeader
              icon={<span className="text-red-600 dark:text-red-400 text-xs font-black">−</span>}
              title="Autres retenues"
              subtitle="Retenues libres — déduites du net"
              total={totalRetenues}
              color="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            />
            <div className="px-5 py-4 space-y-2">
              <AnimatePresence initial={false}>
                {retenues.map(r => (
                  <motion.div key={r.localId} initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
                    className="group flex items-center gap-2">
                    <input type="text" value={r.label}
                      onChange={e => setRetenues(prev => prev.map(x => x.localId === r.localId ? { ...x, label: e.target.value } : x))}
                      placeholder="Ex : Remboursement, Trop-perçu…"
                      className="flex-1 min-w-0 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400/30" />
                    <div className="relative w-32 shrink-0">
                      <input type="number" value={r.amount || ''}
                        onChange={e => setRetenues(prev => prev.map(x => x.localId === r.localId ? { ...x, amount: e.target.value === '' ? '' : Number(e.target.value) } : x))}
                        placeholder="Montant"
                        className="w-full pl-3 pr-5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-right text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400/30" />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">F</span>
                    </div>
                    <button onClick={() => setRetenues(prev => prev.filter(x => x.localId !== r.localId))}
                      className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <button onClick={() => setRetenues(prev => [...prev, { localId: uid(), label: '', amount: '' }])}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors mt-1">
                <Plus size={11} /> Ajouter une retenue
              </button>
            </div>
          </Card>

          {/* ── Cumul annuel ── */}
          <Card className="p-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cumul annuel</p>
            <p className="text-[11px] text-gray-400 mb-4">
              Seul le brut se corrige ici — net imposable et charges sont recalculés automatiquement à partir de lui.
            </p>
            <div>
              <SLabel>Cumul brut (F)</SLabel>
              <input type="number" min={0} value={cumulBrut}
                onChange={e => setCumulBrut(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-center text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              {n(cumulBrut) !== cumulBrutOriginal && (
                <p className="text-[10px] text-amber-500 font-semibold mt-1.5">
                  Modifié — était {fmt(cumulBrutOriginal)} F
                </p>
              )}
            </div>
          </Card>

          {/* ── Congés ── */}
          <Card className="p-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Congés annuels</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:'Droits (j)', val:congesDroits, set:setCongesDroits },
                { label:'Pris (j)',   val:congesPris,   set:setCongesPris   },
                { label:'Solde (j)', val:congesSolde,  set:setCongesSolde  },
                { label:'Jours pris ce mois', val:joursCongesPris, set:setJoursCongesPris },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <SLabel>{label}</SLabel>
                  <input type="number" min={0} value={val}
                    onChange={e => set(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-center text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* ════ COL DROITE — Récap ════ */}
        <div className="lg:col-span-2 sticky top-4">
          <AnimatePresence mode="wait">
            {sim ? (
              <motion.div key="sim" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">

                <div className="px-5 pt-5 pb-3 border-b border-[var(--border)]">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Récapitulatif</p>
                    {simLoading && <Loader2 size={13} className="animate-spin text-emerald-400" />}
                  </div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{empName}</p>
                  <p className="text-xs text-gray-400">{month} {year}</p>
                </div>

                <div className="px-5 py-4 space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Éléments de paie</p>
                  <BLine label="Salaire de base"    value={`${fmt(baseSalary)} F`} />
                  {totalPrimes > 0     && <BLine label="Primes"       value={`+${fmt(totalPrimes)} F`}     cls="text-amber-600" />}
                  {totalIndemnites > 0 && <BLine label="Indemnités"   value={`+${fmt(totalIndemnites)} F`} cls="text-emerald-600" />}
                  {sim.overtime.total  > 0 && <BLine label="Heures sup" value={`+${fmt(sim.overtime.total)} F`} cls="text-amber-600" />}
                  {sim.absenceDeduction > 0 && <BLine label="Déd. absences" value={`−${fmt(sim.absenceDeduction)} F`} cls="text-red-400" sm />}

                  <div className="flex justify-between items-center py-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 rounded-xl mt-2">
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Salaire brut</span>
                    <span className="font-mono font-black text-emerald-700 dark:text-emerald-300">{fmt(sim.grossSalary)} F</span>
                  </div>

                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-3 mb-2">Retenues légales</p>
                  <BLine label={`CNSS (${sim.settings.cnssSalarialRate}%)`}
                    value={sim.employee.isSubjectToCnss ? `−${fmt(sim.cnssSalarial)} F` : '0 F (exempté)'}
                    cls={sim.employee.isSubjectToCnss ? 'text-red-500' : 'text-gray-400'} />
                  <BLine label="ITS / IRPP"
                    value={sim.employee.isSubjectToIrpp ? `−${fmt(sim.its)} F` : '0 F (exempté)'}
                    cls={sim.employee.isSubjectToIrpp ? 'text-red-500' : 'text-gray-400'} />
                  {totalRetenues > 0 && <BLine label="Autres retenues" value={`−${fmt(totalRetenues)} F`} cls="text-red-500" sm />}

                  <div className="mt-4 pt-4 border-t-2 border-dashed border-[var(--border)]">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Net à payer</span>
                      <div className="text-right leading-none">
                        <span className="text-[26px] font-black text-[var(--text)] font-mono tracking-tight">{fmt(sim.netSalary)}</span>
                        <span className="text-sm text-gray-400 ml-1">FCFA</span>
                      </div>
                    </div>
                  </div>

                  {/* Coût employeur */}
                  <div className="mt-3 border border-amber-200 dark:border-amber-800/40 rounded-xl overflow-hidden">
                    <button onClick={() => setShowEmpCost(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100/50 transition-colors">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                        <Building2 size={12} /> Coût employeur
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">+{fmt(sim.totalEmployerCost)} F</span>
                        {showEmpCost ? <ChevronUp size={12} className="text-amber-400"/> : <ChevronDown size={12} className="text-amber-400"/>}
                      </div>
                    </button>
                    <AnimatePresence>
                      {showEmpCost && (
                        <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }} className="overflow-hidden">
                          <div className="px-4 py-3 bg-[var(--surface)] space-y-0.5">
                            <BLine label="CNSS Pensions (8%)"    value={`+${fmt(sim.cnssEmployerPension)} F`}  cls="text-amber-500" sm />
                            <BLine label="CNSS Famille (10,03%)" value={`+${fmt(sim.cnssEmployerFamily)} F`}   cls="text-amber-500" sm />
                            <BLine label="CNSS Accident (2,25%)" value={`+${fmt(sim.cnssEmployerAccident)} F`} cls="text-amber-500" sm />
                            <BLine label="TUS DGI (2,025%)"      value={`+${fmt(sim.tusDgiAmount)} F`}         cls="text-amber-500"  sm />
                            <BLine label="TUS CNSS (5,475%)"     value={`+${fmt(sim.tusCnssAmount)} F`}        cls="text-amber-500"  sm />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Bouton sauvegarder */}
                <div className="px-5 pb-5">
                  {saved ? (
                    <div className="w-full py-3.5 bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm">
                      <CheckCircle2 size={15} /> Sauvegardé — redirection…
                    </div>
                  ) : (
                    <button onClick={submit} disabled={submitting || simLoading}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                      {submitting ? <><Loader2 size={15} className="animate-spin"/>Sauvegarde…</> : <><Save size={15}/>Sauvegarder le bulletin</>}
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="bg-[var(--surface-2)] border-2 border-dashed border-[var(--border)] rounded-2xl min-h-[260px] flex flex-col items-center justify-center text-center p-8">
                {simLoading
                  ? <><Loader2 size={32} className="animate-spin mb-3 text-emerald-500"/><p className="text-sm font-medium text-gray-600 dark:text-gray-300">Calcul en cours…</p></>
                  : simError
                  ? <><AlertCircle size={32} className="mb-3 text-red-400"/><p className="text-sm font-medium text-red-500 max-w-[200px]">{simError}</p></>
                  : <><Calculator size={36} className="mb-3 text-gray-300 dark:text-gray-600"/><p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Chargement du bulletin…</p></>
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}